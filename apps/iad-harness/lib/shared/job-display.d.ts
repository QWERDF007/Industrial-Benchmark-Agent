import type { JobSnapshot } from "./contracts.js";
export declare const JOB_POLL_INTERVAL = 1200;
export declare const jobIsActive: (job: Pick<JobSnapshot, 'status'> | null | undefined) => boolean;
export declare function formatJobTime(value: string): string;
export declare function formatJobElapsed(job: Pick<JobSnapshot, 'status' | 'started_at' | 'finished_at'>, now?: number): string;
export declare const jobStatuses: Record<JobSnapshot["status"], string>;
export declare const jobPhases: Record<string, string>;
export declare function jobWorkflow(job: JobSnapshot, now?: number): {
    title: string;
    stages: {
        title: string;
        phases: string[];
        elapsedSeconds: number | null;
    }[];
    index: number;
} | {
    title: string;
    stages: {
        title: string;
        phases: string[];
        elapsedSeconds: number | null;
    }[];
    index: number;
} | {
    title: string;
    stages: {
        title: string;
        phases: string[];
        elapsedSeconds: number | null;
    }[];
    index: number;
} | {
    title: string;
    stages: {
        title: string;
        phases: string[];
        elapsedSeconds: number | null;
    }[];
    index: number;
};
//# sourceMappingURL=job-display.d.ts.map