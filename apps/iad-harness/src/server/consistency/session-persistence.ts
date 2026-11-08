import path from 'node:path';
import fs, {type FileHandle} from 'node:fs/promises';
import type {Context} from '@deepseek-ai/cordis';
import {SessionId, SessionLogOffset, type SessionEvent, type SessionHeader} from '@deepseek-ai/dsh-session';
import {SessionPersistence, SessionPersistenceRevision, SessionAlreadyExistsError, SessionAlreadyOwnedError,
  SessionPersistenceNotFoundError, SessionReadOnlyError, SessionHandleClosedError,
  materializeCreateHeader, materializeAppendBatch, assertContiguous, assertStoredId, validateStoredEvents,
  type SessionHandle, type SessionAccess, type SessionPersistenceCreateOptions,
  type SessionPersistenceOpenOptions} from '@deepseek-ai/dsh-session-persistence';
import {sessionFormatCatalog} from '@deepseek-ai/dsh-session-format-catalog';
import type {ConsistencySessionLocation} from '../../shared/domain.generated.js';

export type SessionLocator = (id: string) => Promise<ConsistencySessionLocation>;

export function consistencySessionPath(root: string, location: ConsistencySessionLocation): string {
  const timestamp = new Date(location.submitted_at).toISOString().replaceAll(':', '-');
  const name = path.parse(location.image_name).name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, encodeURIComponent);
  return path.join(root, timestamp, location.job_id, `${name}_${location.image_id}.jsonl`);
}

class ConsistencySessionHandle implements SessionHandle {
  private chain: Promise<void> = Promise.resolve();
  private closed = false;

  constructor(readonly id: SessionId, readonly header: SessionHeader, readonly access: SessionAccess,
    readonly inheritedEventCount: SessionLogOffset, private readonly filename: string,
    private readonly file: FileHandle, private cursor: number, private readonly release: () => void) {}

  static async load(filename: string, id: SessionId) {
    const text = await fs.readFile(filename, 'utf8');
    const end = text.lastIndexOf('\n') + 1;
    const lines = text.slice(0, end).trimEnd().split('\n').map(line => JSON.parse(line));
    const restore = sessionFormatCatalog.createRestore(lines[0], {recovery: 'strict', validation: 'current'});
    for (const line of lines.slice(1)) restore.decodeRow(line);
    const artifact = restore.finish();
    const header = materializeCreateHeader({...artifact.header, id: SessionId(artifact.header.id)} as SessionHeader);
    assertStoredId(id, header);
    const events = validateStoredEvents(header, [...artifact.events] as unknown as SessionEvent[], {kind: 'jsonl', path: filename});
    return {header, events, inheritedEventCount: SessionLogOffset(artifact.inheritedEventCount),
      bytes: Buffer.byteLength(text.slice(0, end)), torn: end !== text.length};
  }

  async read(offset = 0, length?: number, options?: {signal?: AbortSignal}) {
    options?.signal?.throwIfAborted();
    if (this.closed) throw new SessionHandleClosedError(this.id, 'read');
    await this.chain;
    const {events} = await ConsistencySessionHandle.load(this.filename, this.id);
    return {eventState: 'shared-frozen' as const, events: events.slice(offset, length === undefined ? undefined : offset + length)};
  }

  append(events: readonly SessionEvent[], options?: {signal?: AbortSignal}): Promise<void> {
    options?.signal?.throwIfAborted();
    if (this.closed) throw new SessionHandleClosedError(this.id, 'append');
    if (this.access !== 'write') throw new SessionReadOnlyError(this.id, 'append');
    const batch = materializeAppendBatch(events);
    this.chain = this.chain.then(async () => {
      assertContiguous(this.id, batch, this.cursor);
      const text = batch.map(event => JSON.stringify(sessionFormatCatalog.encodeCurrentEvent(JSON.parse(JSON.stringify(event))))).join('\n');
      if (batch.length) await this.file.writeFile(text + '\n');
      this.cursor += batch.length;
    });
    return this.chain;
  }

  async flush(options?: {signal?: AbortSignal}): Promise<void> {
    options?.signal?.throwIfAborted();
    if (this.closed) throw new SessionHandleClosedError(this.id, 'flush');
    if (this.access !== 'write') throw new SessionReadOnlyError(this.id, 'flush');
    await this.chain;
    await this.file.sync();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.release();
    try {
      await this.chain;
      if (this.access === 'write') await this.file.sync();
    } finally {await this.file.close();}
  }

  [Symbol.asyncDispose](): Promise<void> {return this.close();}
}

export class ConsistencySessionPersistence extends SessionPersistence {
  private readonly handles = new Set<ConsistencySessionHandle>();
  private readonly writers = new Map<SessionId, ConsistencySessionHandle>();

  constructor(ctx: Context, private readonly root: string, private readonly locate: SessionLocator) {
    super(ctx);
    ctx.on('session/event', (session, event) => {
      const writer = this.writers.get(session.id);
      if (writer) void writer.append([event]).catch(error => ctx.logger.warn(error));
    });
    ctx.on('session/flush', session => this.writers.get(session.id)?.flush());
    ctx.on('session/disposed', session => {
      void this.writers.get(session.id)?.close().catch(error => ctx.logger.warn(error));
    });
    ctx.effect(() => async () => {await Promise.all([...this.handles].map(handle => handle.close()));});
  }

  async create(header: SessionHeader, options?: SessionPersistenceCreateOptions): Promise<SessionHandle> {
    options?.signal?.throwIfAborted();
    const meta = materializeCreateHeader(header);
    const filename = consistencySessionPath(this.root, await this.locate(meta.id));
    const inheritedEventCount = SessionLogOffset(options?.inheritedEventCount ?? 0);
    const text = JSON.stringify(sessionFormatCatalog.encodeCurrentHeader(
      {...meta, delegationDepth: meta.delegationDepth ?? 0}, inheritedEventCount)) + '\n';
    await fs.mkdir(path.dirname(filename), {recursive: true});
    let file: FileHandle;
    try {file = await fs.open(filename, 'ax+');}
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new SessionAlreadyExistsError(meta.id);
      throw error;
    }
    try {await file.writeFile(text);await file.sync();}
    catch (error) {await file.close();throw error;}
    const handle = new ConsistencySessionHandle(meta.id, meta, 'write', inheritedEventCount, filename, file, 0,
      () => {this.handles.delete(handle);this.writers.delete(meta.id);});
    this.handles.add(handle);this.writers.set(meta.id, handle);
    return handle;
  }

  async open(id: SessionId, access: SessionAccess, options?: SessionPersistenceOpenOptions): Promise<SessionHandle> {
    options?.signal?.throwIfAborted();
    if (access === 'write' && this.writers.has(id)) throw new SessionAlreadyOwnedError(id);
    const filename = consistencySessionPath(this.root, await this.locate(id));
    let stored: Awaited<ReturnType<typeof ConsistencySessionHandle.load>>;
    try {stored = await ConsistencySessionHandle.load(filename, id);}
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new SessionPersistenceNotFoundError(id);
      throw error;
    }
    const file = await fs.open(filename, access === 'write' ? 'a+' : 'r');
    if (access === 'write' && stored.torn) await file.truncate(stored.bytes);
    const handle = new ConsistencySessionHandle(id, stored.header, access, stored.inheritedEventCount,
      filename, file, stored.events.length, () => {
        this.handles.delete(handle);
        if (access === 'write') this.writers.delete(id);
      });
    this.handles.add(handle);
    if (access === 'write') this.writers.set(id, handle);
    return handle;
  }

  async flush(): Promise<void> {await Promise.all([...this.writers.values()].map(handle => handle.flush()));}

  async stat(id: SessionId, options?: {signal?: AbortSignal}) {
    options?.signal?.throwIfAborted();
    const filename = consistencySessionPath(this.root, await this.locate(id));
    try {
      const file = await fs.stat(filename);
      const {header} = await ConsistencySessionHandle.load(filename, id);
      return {header, sizeBytes: file.size, revision: SessionPersistenceRevision(`${file.mtimeMs}:${file.size}`)};
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async list(options?: {signal?: AbortSignal}) {
    options?.signal?.throwIfAborted();
    let entries;
    try {entries = await fs.readdir(this.root, {recursive: true, withFileTypes: true});}
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const snapshots = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
      const filename = path.join(entry.parentPath, entry.name);
      const first = JSON.parse((await fs.readFile(filename, 'utf8')).split('\n', 1)[0]);
      const snapshot = await this.stat(SessionId(first.id), options);
      if (snapshot) snapshots.push(snapshot);
    }
    return snapshots;
  }
}
