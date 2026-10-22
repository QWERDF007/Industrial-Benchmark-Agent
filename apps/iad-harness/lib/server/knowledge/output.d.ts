import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import type { InferValue } from "@deepseek-ai/dsh-tools";
export declare const knowledgePromptOutput: {
    schema: {
        readonly type: "json";
    };
    presentationMeta(_args: unknown, value: InferValue<{
        type: "json";
    }>): import("../../shared/tool-presentation.js").ToolPresentation | null;
    render(_args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
export declare const knowledgeOutput: {
    schema: {
        readonly type: "json";
    };
    presentationMeta(_args: unknown, value: InferValue<{
        type: "json";
    }>): import("../../shared/tool-presentation.js").ToolPresentation | null;
    render(_args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
export declare const knowledgeScopeOutput: {
    schema: {
        readonly type: "json";
    };
    presentationMeta(_args: unknown, value: InferValue<{
        type: "json";
    }>): import("../../shared/tool-presentation.js").ToolPresentation | null;
    render(_args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
export declare const knowledgeJobOutput: {
    schema: {
        readonly type: "json";
    };
    presentationMeta(_args: unknown, value: InferValue<{
        type: "json";
    }>): import("../../shared/tool-presentation.js").ToolPresentation | null;
    render(_args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
//# sourceMappingURL=output.d.ts.map