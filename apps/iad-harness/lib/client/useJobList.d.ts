import type { JobSnapshot } from '../shared/contracts.js';
export declare function useJobList(jobs: JobSnapshot[], scope: string, selectedRunId?: string, onSelect?: (job: JobSnapshot) => void): {
    state: {
        scope: string;
        search: string;
        status: string;
        page: number;
        runId: string;
    };
    selected: JobSnapshot;
    filtered: JobSnapshot[];
    hasJobs: boolean;
    page: number;
    visible: JobSnapshot[];
    select: (job: JobSnapshot) => void;
    search: (search: string) => void;
    status: (status: string) => void;
    clear: () => void;
    setPage: (value: number) => void;
};
//# sourceMappingURL=useJobList.d.ts.map