import type { JobSnapshot } from "./contracts.js";
export declare const JOB_POLL_INTERVAL = 1200;
export declare const jobIsActive: (job: Pick<JobSnapshot, 'status'> | null | undefined) => boolean;
export declare function formatJobTime(value: string): string;
type JobTiming = Pick<JobSnapshot, 'status' | 'started_at' | 'finished_at'> & Partial<Pick<JobSnapshot, 'phase_timings'>>;
export declare function formatJobElapsed(job: JobTiming, now?: number): string;
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
export {};
//# sourceMappingURL=job-display.d.ts.map