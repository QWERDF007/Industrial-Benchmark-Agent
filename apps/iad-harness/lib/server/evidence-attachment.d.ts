import type { Context } from "@deepseek-ai/cordis";
import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import type { InferValue } from "@deepseek-ai/dsh-tools";
import type { PythonBridge } from "./python-bridge/index.js";
export declare const evidenceOutput: {
    schema: {
        readonly type: "json";
    };
    render(_args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
export declare function readEvidenceAttachment(bridge: PythonBridge, ctx: Context, operation: "knowledge_evidence" | "audit_evidence", args: {
    evidence_id: string;
    run_id?: string;
    version_id?: string;
    suggestion_id?: string;
}, signal: AbortSignal): Promise<{
    evidence_id: string;
    run_id?: string;
    version_id?: string;
    suggestion_id?: string;
    attachment: {
        attachmentId: import("@deepseek-ai/dsh-attachment").AttachmentId;
        mediaType: import("@deepseek-ai/dsh-attachment").ImageMediaType;
        bytes: number;
        width: number;
        height: number;
        name?: string;
        originalDimensions?: {
            width: number;
            height: number;
        };
    };
}>;
//# sourceMappingURL=evidence-attachment.d.ts.map