import type { JobSnapshot } from '../shared/contracts.js';
export declare function useAuditJobSelection(jobs: JobSnapshot[], scope: string): {
    state: {
        scope: string;
        search: string;
        status: string;
        page: number;
        runId: string;
    };
    selected: JobSnapshot;
    filtered: JobSnapshot[];
    page: number;
    hasJobs: boolean;
    visible: JobSnapshot[];
    search: (search: string) => void;
    status: (status: string) => void;
    select: (runId: string) => void;
    setPage: (page: number) => void;
    clear: () => void;
};
//# sourceMappingURL=useAuditJobSelection.d.ts.map