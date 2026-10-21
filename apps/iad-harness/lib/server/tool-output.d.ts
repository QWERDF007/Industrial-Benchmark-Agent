import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import type { InferValue } from "@deepseek-ai/dsh-tools";
export declare const workbenchJsonOutput: {
    schema: {
        readonly type: "json";
    };
    presentationMeta(_args: unknown, value: InferValue<{
        type: "json";
    }>): import("../shared/tool-presentation.js").ToolPresentation | null;
    render(_args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
export declare const datasetDiscoveryOutput: {
    schema: {
        readonly type: "json";
    };
    presentationMeta(_args: unknown, value: InferValue<{
        type: "json";
    }>): import("../shared/tool-presentation.js").ToolPresentation | null;
    render(args: unknown, value: InferValue<{
        type: "json";
    }>): ContentBlock[];
};
//# sourceMappingURL=tool-output.d.ts.map