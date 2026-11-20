export class ConsistencyAnchorReviewer {
    bridge;
    host;
    constructor(bridge, host) {
        this.bridge = bridge;
        this.host = host;
    }
    async review(task) {
        const identity = { run_id: task.runId, anchor_id: task.anchorId, attempt: task.attempt };
        task.signal.throwIfAborted();
        const result = await this.bridge.execute('consistency_agent_collect', identity, task.signal, { timeoutMs: 0 });
        await this.host.notice(task.sessionId, { type: 'iad/consistency',
            summary: result.ready ? '标注比较已完成' : '图像内容需要重新核对', value: { ...identity, ...result } });
        return result.ready;
    }
}
