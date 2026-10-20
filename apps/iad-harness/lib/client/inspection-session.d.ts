import type { Context } from "@deepseek-ai/cordis";
import type { InspectionSnapshot } from "../shared/contracts.js";
declare module "@deepseek-ai/dsh-api-session-controller/client" {
    interface SessionReferenceSourceMap {
        iadInspection: unknown;
    }
}
/** Uses host admission and the retained Session scope; never touches the composer draft. */
export declare class InspectionSession {
    private host;
    constructor(host: Pick<Context, "sessions" | "uiWorkspace">);
    send(snapshot: InspectionSnapshot, question: string, returnLink: (sessionId: string) => string, previousSessionId?: string): Promise<void>;
    open(sessionId: string): Promise<void>;
}
//# sourceMappingURL=inspection-session.d.ts.map