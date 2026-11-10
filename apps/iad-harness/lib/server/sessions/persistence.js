import path from 'node:path';
import fs from 'node:fs/promises';
import { SessionId, SessionLogOffset } from '@deepseek-ai/dsh-session';
import { SessionPersistence, SessionPersistenceRevision, SessionAlreadyExistsError, SessionAlreadyOwnedError, SessionPersistenceNotFoundError, SessionReadOnlyError, SessionHandleClosedError, materializeCreateHeader, materializeAppendBatch, assertContiguous, assertStoredId, validateStoredEvents } from '@deepseek-ai/dsh-session-persistence';
import { sessionFormatCatalog } from '@deepseek-ai/dsh-session-format-catalog';
class JobSessionHandle {
    id;
    header;
    access;
    inheritedEventCount;
    filename;
    file;
    cursor;
    release;
    chain = Promise.resolve();
    closed = false;
    constructor(id, header, access, inheritedEventCount, filename, file, cursor, release) {
        this.id = id;
        this.header = header;
        this.access = access;
        this.inheritedEventCount = inheritedEventCount;
        this.filename = filename;
        this.file = file;
        this.cursor = cursor;
        this.release = release;
    }
    static async load(filename, id) {
        const text = await fs.readFile(filename, 'utf8');
        const end = text.lastIndexOf('\n') + 1;
        const lines = text.slice(0, end).trimEnd().split('\n').map(line => JSON.parse(line));
        const restore = sessionFormatCatalog.createRestore(lines[0], { recovery: 'strict', validation: 'current' });
        for (const line of lines.slice(1))
            restore.decodeRow(line);
        const artifact = restore.finish();
        const header = materializeCreateHeader({ ...artifact.header, id: SessionId(artifact.header.id) });
        assertStoredId(id, header);
        const events = validateStoredEvents(header, [...artifact.events], { kind: 'jsonl', path: filename });
        return { header, events, inheritedEventCount: SessionLogOffset(artifact.inheritedEventCount),
            bytes: Buffer.byteLength(text.slice(0, end)), torn: end !== text.length };
    }
    async read(offset = 0, length, options) {
        options?.signal?.throwIfAborted();
        if (this.closed)
            throw new SessionHandleClosedError(this.id, 'read');
        await this.chain;
        const { events } = await JobSessionHandle.load(this.filename, this.id);
        return { eventState: 'shared-frozen', events: events.slice(offset, length === undefined ? undefined : offset + length) };
    }
    append(events, options) {
        options?.signal?.throwIfAborted();
        if (this.closed)
            throw new SessionHandleClosedError(this.id, 'append');
        if (this.access !== 'write')
            throw new SessionReadOnlyError(this.id, 'append');
        const batch = materializeAppendBatch(events);
        this.chain = this.chain.then(async () => {
            assertContiguous(this.id, batch, this.cursor);
            const text = batch.map(event => JSON.stringify(sessionFormatCatalog.encodeCurrentEvent(JSON.parse(JSON.stringify(event))))).join('\n');
            if (batch.length)
                await this.file.writeFile(text + '\n');
            this.cursor += batch.length;
        });
        return this.chain;
    }
    async flush(options) {
        options?.signal?.throwIfAborted();
        if (this.closed)
            throw new SessionHandleClosedError(this.id, 'flush');
        if (this.access !== 'write')
            throw new SessionReadOnlyError(this.id, 'flush');
        await this.chain;
        await this.file.sync();
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        this.release();
        try {
            await this.chain;
            if (this.access === 'write')
                await this.file.sync();
        }
        finally {
            await this.file.close();
        }
    }
    [Symbol.asyncDispose]() { return this.close(); }
}
export class JobSessionPersistence extends SessionPersistence {
    root;
    locate;
    handles = new Set();
    writers = new Map();
    constructor(ctx, root, locate) {
        super(ctx);
        this.root = root;
        this.locate = locate;
        ctx.on('session/event', (session, event) => {
            const writer = this.writers.get(session.id);
            if (writer)
                void writer.append([event]).catch(error => ctx.logger.warn(error));
        });
        ctx.on('session/flush', session => this.writers.get(session.id)?.flush());
        ctx.on('session/disposed', session => {
            void this.writers.get(session.id)?.close().catch(error => ctx.logger.warn(error));
        });
        ctx.effect(() => async () => { await Promise.all([...this.handles].map(handle => handle.close())); });
    }
    async create(header, options) {
        options?.signal?.throwIfAborted();
        const meta = materializeCreateHeader(header);
        const filename = await this.locate(meta.id);
        const inheritedEventCount = SessionLogOffset(options?.inheritedEventCount ?? 0);
        const text = JSON.stringify(sessionFormatCatalog.encodeCurrentHeader({ ...meta, delegationDepth: meta.delegationDepth ?? 0 }, inheritedEventCount)) + '\n';
        await fs.mkdir(path.dirname(filename), { recursive: true });
        let file;
        try {
            file = await fs.open(filename, 'ax+');
        }
        catch (error) {
            if (error.code === 'EEXIST')
                throw new SessionAlreadyExistsError(meta.id);
            throw error;
        }
        try {
            await file.writeFile(text);
            await file.sync();
        }
        catch (error) {
            await file.close();
            throw error;
        }
        const handle = new JobSessionHandle(meta.id, meta, 'write', inheritedEventCount, filename, file, 0, () => { this.handles.delete(handle); this.writers.delete(meta.id); });
        this.handles.add(handle);
        this.writers.set(meta.id, handle);
        return handle;
    }
    async open(id, access, options) {
        options?.signal?.throwIfAborted();
        if (access === 'write' && this.writers.has(id))
            throw new SessionAlreadyOwnedError(id);
        const filename = await this.locate(id);
        let stored;
        try {
            stored = await JobSessionHandle.load(filename, id);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                throw new SessionPersistenceNotFoundError(id);
            throw error;
        }
        const file = await fs.open(filename, access === 'write' ? 'a+' : 'r');
        if (access === 'write' && stored.torn)
            await file.truncate(stored.bytes);
        const handle = new JobSessionHandle(id, stored.header, access, stored.inheritedEventCount, filename, file, stored.events.length, () => {
            this.handles.delete(handle);
            if (access === 'write')
                this.writers.delete(id);
        });
        this.handles.add(handle);
        if (access === 'write')
            this.writers.set(id, handle);
        return handle;
    }
    async flush() { await Promise.all([...this.writers.values()].map(handle => handle.flush())); }
    async stat(id, options) {
        options?.signal?.throwIfAborted();
        const filename = await this.locate(id);
        try {
            const file = await fs.stat(filename);
            const { header } = await JobSessionHandle.load(filename, id);
            return { header, sizeBytes: file.size, revision: SessionPersistenceRevision(`${file.mtimeMs}:${file.size}`) };
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return undefined;
            throw error;
        }
    }
    async list(options) {
        options?.signal?.throwIfAborted();
        let entries;
        try {
            entries = await fs.readdir(this.root, { recursive: true, withFileTypes: true });
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return [];
            throw error;
        }
        const snapshots = [];
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith('.jsonl'))
                continue;
            const filename = path.join(entry.parentPath, entry.name);
            const first = JSON.parse((await fs.readFile(filename, 'utf8')).split('\n', 1)[0]);
            const snapshot = await this.stat(SessionId(first.id), options);
            if (snapshot)
                snapshots.push(snapshot);
        }
        return snapshots;
    }
}
