/**
 * DSH Native HTTP Route Handler for Industrial AD Benchmark (DS-S01, DS-S02, DS-S03, DS-S11, DS-S15).
 * Mounted directly into DSH WebServer (port 5173) under /api/iad/*.
 * Strictly isolated, safe, no external server or port 8000.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { PythonBridge } from "../python-bridge/index.js";
export declare function createIadHttpHandler(bridge: PythonBridge): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
//# sourceMappingURL=index.d.ts.map