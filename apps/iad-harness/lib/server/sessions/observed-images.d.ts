import type { Context } from '@deepseek-ai/cordis';
import type { SessionStore } from '@deepseek-ai/dsh-session';
export declare class ObservedImages {
    private readonly sessions;
    constructor(sessions: SessionStore);
    attach(scope: Context, handoffTools?: readonly string[]): void;
}
//# sourceMappingURL=observed-images.d.ts.map