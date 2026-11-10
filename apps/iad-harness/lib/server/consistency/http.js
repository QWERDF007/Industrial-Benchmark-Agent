import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
export class ConsistencyHttpQueries {
    bridge;
    constructor(bridge) {
        this.bridge = bridge;
    }
    async export(res, runId) {
        const artifact = await this.bridge.execute('consistency_agent_export', { run_id: runId });
        try {
            const stat = await fsp.stat(artifact.path);
            res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(artifact.filename)}`, 'Cache-Control': 'no-store' });
            await pipeline(fs.createReadStream(artifact.path), res);
        }
        finally {
            await fsp.unlink(artifact.path);
        }
    }
    async session(res, runId, anchorId) {
        const artifact = await this.bridge.execute('consistency_agent_session_export', { run_id: runId, anchor_id: anchorId });
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Length': Buffer.byteLength(artifact.jsonl),
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(artifact.filename)}`, 'Cache-Control': 'no-store' });
        res.end(artifact.jsonl);
    }
}
