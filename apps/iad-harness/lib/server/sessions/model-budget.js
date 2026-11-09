import http from 'node:http';
import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { createProxyServer } from 'httpxy';
export class NativeModelBudget {
    profile;
    server;
    constructor(profile, server) {
        this.profile = profile;
        this.server = server;
    }
    static async open(profile, measure) {
        if (profile.api !== 'openai-completions' || !profile.baseURL)
            throw new Error('Agent 实际上下文计量需要 OpenAI Chat Completions 与 /tokenize 协议');
        const target = new URL(profile.baseURL);
        const proxy = createProxyServer({ target: target.origin, changeOrigin: true });
        const server = http.createServer(async (request, response) => {
            const controller = new AbortController();
            response.once('close', () => { if (!response.writableEnded)
                controller.abort(); });
            try {
                const source = await buffer(request);
                const budget = await measure(JSON.parse(source.toString('utf8')), controller.signal);
                controller.signal.throwIfAborted();
                if (!budget.fits) {
                    response.writeHead(400, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: { code: 'context_length_exceeded',
                            message: `maximum context length exceeded: Agent 输入 ${budget.input_tokens} token，上下文上限 ${budget.context_tokens}，输出预留 ${budget.output_reserve}` } }));
                    return;
                }
                await proxy.web(request, response, { buffer: Readable.from(source) });
            }
            catch (error) {
                if (controller.signal.aborted)
                    return;
                if (response.headersSent) {
                    response.destroy(error instanceof Error ? error : new Error(String(error)));
                    return;
                }
                response.writeHead(502, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: { message: error instanceof Error ? error.message : String(error) } }));
            }
        });
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve(); });
        });
        const address = server.address();
        target.protocol = 'http:';
        target.host = '127.0.0.1:' + address.port;
        return new NativeModelBudget({ ...profile, baseURL: target.toString() }, server);
    }
    async close() {
        await new Promise((resolve, reject) => this.server.close(error => error ? reject(error) : resolve()));
    }
}
