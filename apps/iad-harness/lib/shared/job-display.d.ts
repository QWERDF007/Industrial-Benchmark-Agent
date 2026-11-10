import type { JobSnapshot } from "./contracts.js";
export declare function formatJobTime(value: string): string;
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