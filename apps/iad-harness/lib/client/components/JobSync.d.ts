import React from "react";
export declare function JobSync({ syncState, lastSyncedAt, error, refresh, label, }: {
    syncState: "syncing" | "current" | "stale";
    lastSyncedAt: number | null;
    error: string;
    refresh(): void;
    label?: string;
}): React.JSX.Element;
//# sourceMappingURL=JobSync.d.ts.map