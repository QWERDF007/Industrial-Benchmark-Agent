import type { InferValue } from "@deepseek-ai/dsh-tools";
import type { AuditJob } from "../shared/contracts.js";
import type { PythonBridge } from "./python-bridge/index.js";
export declare const jobStatusParameters: {
    readonly run_id: {
        readonly type: "string";
        readonly required: true;
    };
    readonly wait_seconds: {
        readonly type: "number";
        readonly description: "等待作业终态的最长秒数，0..30；省略最多等10秒，终态立即返回，超时仍返回真实当前状态";
    };
};
type JobStatus = {
    status: AuditJob["status"];
    [key: string]: InferValue<{
        type: "json";
    }>;
};
export declare function waitForJobStatus(bridge: PythonBridge, operation: "knowledge_status" | "audit_status", { run_id, wait_seconds }: {
    run_id: string;
    wait_seconds?: number;
}, signal: AbortSignal): Promise<JobStatus>;
export {};
//# sourceMappingURL=job-status.d.ts.map