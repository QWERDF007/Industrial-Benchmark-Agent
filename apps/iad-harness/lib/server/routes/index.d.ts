import type { IncomingMessage, ServerResponse } from "node:http";
import { PythonBridge } from "../python-bridge/index.js";
export declare function createIadHttpHandler(bridge: PythonBridge): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
//# sourceMappingURL=index.d.ts.map