import { type Agent, type AgentOptions, type AgentSetup } from '@deepseek-ai/dsh-agent';
import { type SessionEvent, type SessionHeader } from '@deepseek-ai/dsh-session';
declare module '@deepseek-ai/dsh-session' {
    interface SessionEventMap {
        'iad/consistency': {
            summary: string;
            value: unknown;
            record_id?: string;
        };
    }
}
export declare class ConsistencySessionHost {
    private readonly root;
    private readonly ctx;
    private readonly sessions;
    private readonly stop;
    private readonly active;
    private constructor();
    static open(root: string): Promise<ConsistencySessionHost>;
    create(id: string): Promise<void>;
    withAgent<T>(id: string, options: {
        agentOptions?: AgentOptions;
        setup?: AgentSetup;
        signal?: AbortSignal;
    }, operation: (agent: Agent) => T | Promise<T>): Promise<T>;
    read(id: string): Promise<{
        header: SessionHeader;
        events: readonly SessionEvent[];
    }>;
    notice(id: string, summary: string, value: unknown, recordId?: string): Promise<void>;
    exportJsonl(id: string): Promise<string>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=session-host.d.ts.map