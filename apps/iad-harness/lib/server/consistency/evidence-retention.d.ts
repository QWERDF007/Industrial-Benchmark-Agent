import type { Context } from '@deepseek-ai/cordis';
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session';
/** Pending candidate facts stay readable; completed facts remain in storage and original events. */
export declare class ConsistencyEvidenceRetention {
    private readonly scope;
    private readonly calls;
    private readonly assessed;
    private readonly observations;
    private readonly contexts;
    private readonly deliveredContexts;
    constructor(scope: Context, events: readonly SessionEvent[]);
    private accept;
    retainPending(session: Session): void;
    private replace;
}
//# sourceMappingURL=evidence-retention.d.ts.map