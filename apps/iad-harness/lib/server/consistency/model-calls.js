import { randomUUID } from 'node:crypto';
import { LlmError } from '@deepseek-ai/dsh-llm';
export class ConsistencyAgentCalls {
    bridge;
    constructor(bridge) {
        this.bridge = bridge;
    }
    attach(scope, identity) {
        const bridge = this.bridge;
        scope.on('llm/stream', async function* (options, next) {
            const { signal, ...request } = options;
            const callId = 'call_' + randomUUID();
            const started = performance.now();
            const start = { call_id: callId, started_at: new Date().toISOString(), request };
            await bridge.execute('consistency_agent_model_call_start', { ...identity, request: start });
            const result = { call_id: callId, finished_at: '', elapsed_ms: 0,
                finish_reason: null, usage: null, error: null, http_status: null };
            try {
                for await (const chunk of next()) {
                    if (chunk.type === 'usage')
                        result.usage = { ...chunk.usage };
                    if (chunk.type === 'finish') {
                        result.finish_reason = chunk.reason.kind;
                        if (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted') {
                            const { failure } = chunk.reason;
                            result.error = { type: failure.code, message: failure.message };
                            result.http_status = failure.status ?? null;
                        }
                    }
                    yield chunk;
                }
            }
            catch (error) {
                result.error = error instanceof LlmError ? { type: error.code, message: error.message }
                    : { type: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error) };
                if (error instanceof LlmError)
                    result.http_status = error.failure.status ?? null;
                throw error;
            }
            finally {
                if (!result.finish_reason && signal?.aborted) {
                    result.finish_reason = 'aborted';
                    result.error = { type: 'ABORTED', message: '原生模型调用已取消，提供商是否完成及完整用量未知' };
                }
                result.finished_at = new Date().toISOString();
                result.elapsed_ms = performance.now() - started;
                await bridge.execute('consistency_agent_model_call_end', { ...identity, result });
            }
        });
    }
}
