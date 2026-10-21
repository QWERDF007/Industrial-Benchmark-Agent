import type { Context } from "@deepseek-ai/cordis";
import type { InspectionSnapshot } from "../shared/contracts.js";
declare module "@deepseek-ai/dsh-api-session-controller/client" {
    interface SessionReferenceSourceMap {
        iadInspection: unknown;
        iadKnowledge: unknown;
    }
}
/** Uses host admission and the retained Session scope; never touches the composer draft. */
export declare class WorkbenchSession {
    private host;
    constructor(host: Pick<Context, "sessions" | "uiWorkspace">);
    inspect(snapshot: InspectionSnapshot, question: string, returnLink: (sessionId: string) => string, previousSessionId?: string): Promise<void>;
    mine(scopeRunId: string, kind: "normal" | "defect", imageCount: number, images: string[], returnLink: (sessionId: string) => string, previousSessionId?: string): Promise<void>;
    open(sessionId: string): Promise<void>;
}
//# sourceMappingURL=workbench-session.d.ts.map