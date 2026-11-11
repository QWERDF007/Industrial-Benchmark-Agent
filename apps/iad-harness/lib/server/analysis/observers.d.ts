import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SubagentRuntime } from '@deepseek-ai/dsh-subagent';
import type { ContentBlock } from '@deepseek-ai/dsh-llm';
import type { AnalysisAgentContext, AnalysisWorkflowSnapshot, AnalysisWave, AnalysisWorkerMaterials } from '../../shared/domain.generated.js';
import type { PythonBridge } from '../python-bridge/index.js';
import { NativeMediaAttachments } from '../sessions/media.js';
export declare class AnalysisObservers {
    private readonly bridge;
    private readonly runId;
    private readonly attachments;
    private readonly subagents;
    private readonly snapshot;
    constructor(bridge: PythonBridge, runId: string, attachments: NativeMediaAttachments, subagents: SubagentRuntime, snapshot: AnalysisWorkflowSnapshot);
    register(scope: Context): void;
    context(sessionId: string, signal: AbortSignal): Promise<AnalysisWorkerMaterials>;
    review(context: AnalysisAgentContext, signal: AbortSignal): Promise<AnalysisAgentContext & {
        role: 'reviewer';
        reports: Omit<AnalysisWave['tasks'][number], 'catalog'>[];
        observation_catalog?: AnalysisAgentContext['catalog'];
    }>;
    wave(parent: Agent, context: AnalysisAgentContext, signal: AbortSignal): Promise<{
        context: Awaited<ReturnType<AnalysisObservers['review']>>;
        media: ContentBlock[];
    }>;
}
//# sourceMappingURL=observers.d.ts.map