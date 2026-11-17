import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SessionStore } from '@deepseek-ai/dsh-session';
/** Admission and compaction share one budget, including auxiliary summary calls. */
export declare class JobSessionCapacity {
    private readonly scope;
    private readonly sessions;
    private readonly calibration;
    private readonly recovered;
    constructor(scope: Context, sessions: SessionStore);
    private estimate;
    private budget;
    pageChars(agent: Agent): Promise<number>;
    private reduce;
    attach(): void;
}
//# sourceMappingURL=capacity.d.ts.map