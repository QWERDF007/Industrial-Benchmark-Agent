import { Context } from '@deepseek-ai/cordis';
import { type Agent, type AgentOptions, type AgentSetup } from '@deepseek-ai/dsh-agent';
import { type SessionEvent, type SessionHeader } from '@deepseek-ai/dsh-session';
import { type SessionLocator } from './persistence.js';
interface JobSessionNoticeData {
    summary: string;
    value: unknown;
    record_id?: string;
}
export type JobSessionNotice = JobSessionNoticeData & {
    type: 'iad/job' | 'iad/consistency';
};
declare module '@deepseek-ai/dsh-session' {
    interface SessionEventMap {
        'iad/consistency': JobSessionNoticeData;
        'iad/job': JobSessionNoticeData;
    }
}
export declare class JobSessionHost {
    private readonly root;
    private readonly locate;
    private readonly ctx;
    private readonly sessions;
    private readonly stop;
    private readonly active;
    private constructor();
    static open(root: string, locate: SessionLocator, evidenceOnDemand?: boolean): Promise<JobSessionHost>;
    create(id: string): Promise<void>;
    withAgent<T>(id: string, options: {
        agentOptions?: AgentOptions;
        setup?: AgentSetup;
        sharedSetup?: (scope: Context) => Promise<void>;
        signal?: AbortSignal;
        subagents?: number;
        evidenceOnDemand?: boolean;
        imageHandoffTools?: readonly string[];
    }, operation: (agent: Agent) => T | Promise<T>): Promise<T>;
    read(id: string): Promise<{
        header: SessionHeader;
        events: readonly SessionEvent[];
    }>;
    exists(id: string): Promise<boolean>;
    notice(id: string, notice: JobSessionNotice): Promise<void>;
    exportJsonl(id: string): Promise<string>;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=host.d.ts.map