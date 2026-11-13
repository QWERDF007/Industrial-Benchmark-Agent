export class ConsistencyAnchorReviewer {
    bridge;
    host;
    providers;
    constructor(bridge, host, providers) {
        this.bridge = bridge;
        this.host = host;
        this.providers = providers;
    }
    async review(task) {
        const { vision } = task.snapshot.roles;
        if (vision.error || !vision.profile)
            throw new Error('视觉模型角色不可用：' + (vision.error || '未配置'));
        const identity = { run_id: task.runId, anchor_id: task.anchorId, attempt: task.attempt };
        task.signal.throwIfAborted();
        const result = await this.bridge.execute('consistency_agent_audit', { ...identity, _model_execution: await this.providers.credentialsFor(vision.profile) }, task.signal, { timeoutMs: 0 });
        await this.host.notice(task.sessionId, { type: 'iad/consistency',
            summary: result.ready ? '标注比较已完成' : '图像内容需要重新核对', value: { ...identity, ...result } });
    }
}
