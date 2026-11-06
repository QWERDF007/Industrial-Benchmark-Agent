import type { JobSnapshot } from "./contracts.js";
export declare const jobStatuses: Record<JobSnapshot["status"], string>;
export declare const jobPhases: Record<string, string>;
export declare function jobWorkflow(job: JobSnapshot): {
    title: string;
    stages: {
        title: string;
        phases: string[];
    }[];
    index: number;
} | {
    title: string;
    stages: {
        title: string;
        phases: string[];
    }[];
    index: number;
} | {
    title: string;
    stages: {
        title: string;
        phases: string[];
    }[];
    index: number;
} | {
    title: string;
    stages: {
        title: string;
        phases: string[];
    }[];
    index: number;
};
//# sourceMappingURL=job-display.d.ts.map