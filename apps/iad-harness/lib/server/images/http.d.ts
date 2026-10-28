import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PythonBridge } from '../python-bridge/index.js';
export declare class ImageHttpQueries {
    private readonly bridge;
    constructor(bridge: PythonBridge);
    private owner;
    upload(req: IncomingMessage, res: ServerResponse): Promise<any>;
    release(req: IncomingMessage, res: ServerResponse, imageRef: string): Promise<any>;
    retrieve(req: IncomingMessage, res: ServerResponse, request: Record<string, unknown>): Promise<any>;
}
//# sourceMappingURL=http.d.ts.map