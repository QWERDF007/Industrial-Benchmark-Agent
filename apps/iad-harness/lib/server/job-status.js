import { setTimeout as delay } from "node:timers/promises";
export const jobStatusParameters = {
    run_id: { type: "string", required: true },
    wait_seconds: { type: "number", description: "等待作业终态的最长秒数，0..30；省略最多等10秒，终态立即返回，超时仍返回真实当前状态" },
};
export const jobRetryParameters = {
    run_id: jobStatusParameters.run_id,
    sample_ids: { type: "array", items: { type: "string" }, description: "省略重试失败及未处理项；显式子集必须属于原作业且尚未完成" },
};
export async function waitForJobStatus(bridge, operation, { run_id, wait_seconds = 10 }, signal) {
    if (!Number.isFinite(wait_seconds) || wait_seconds < 0 || wait_seconds > 30)
        throw new Error("wait_seconds must be between 0 and 30");
    const deadline = performance.now() + wait_seconds * 1000;
    let job = await bridge.execute(operation, { run_id }, signal);
    while ((job.status === "PENDING" || job.status === "RUNNING") && performance.now() < deadline) {
        await delay(Math.min(500, Math.max(0, deadline - performance.now())), undefined, { signal });
        job = await bridge.execute(operation, { run_id }, signal);
    }
    return job;
}
