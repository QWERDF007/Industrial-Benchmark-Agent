import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import type {ServerResponse} from 'node:http';
import type {PythonBridge} from '../python-bridge/index.js';

export class ConsistencyHttpQueries {
  constructor(private readonly bridge: PythonBridge) {}

  async export(res: ServerResponse, runId: string): Promise<void> {
    const artifact = await this.bridge.execute<{path: string; filename: string}>('consistency_agent_export', {run_id: runId});
    try {
      const stat = await fsp.stat(artifact.path);
      res.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(artifact.filename)}`, 'Cache-Control': 'no-store'});
      await pipeline(fs.createReadStream(artifact.path), res);
    } finally {
      await fsp.unlink(artifact.path);
    }
  }

  async session(res: ServerResponse, runId: string, anchorId: string): Promise<void> {
    const artifact = await this.bridge.execute<{filename: string; jsonl: string}>('consistency_agent_session_export',
      {run_id: runId, anchor_id: anchorId});
    res.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Length': Buffer.byteLength(artifact.jsonl),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(artifact.filename)}`, 'Cache-Control': 'no-store'});
    res.end(artifact.jsonl);
  }
}
