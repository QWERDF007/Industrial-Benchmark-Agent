import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SubagentRuntime } from '@deepseek-ai/dsh-subagent';
import type { AuditSampleRun, AuditWorkflowSnapshot } from '../../shared/domain.generated.js';
import type { PythonBridge } from '../python-bridge/index.js';
import { NativeMediaAttachments } from '../sessions/media.js';
export declare const auditImageTools: string[];
export declare class AuditImageAgents {
    private readonly bridge;
    private readonly runId;
    private readonly attachments;
    private readonly subagents;
    private readonly snapshot;
    private readonly failures;
    private readonly samples;
    constructor(bridge: PythonBridge, runId: string, attachments: NativeMediaAttachments, subagents: SubagentRuntime, snapshot: AuditWorkflowSnapshot, samples: AuditSampleRun[], failures: Map<string, unknown>);
    private identity;
    register(scope: Context): void;
    run(parent: Agent, signal: AbortSignal): Promise<void>;
}
//# sourceMappingURL=images.d.ts.map