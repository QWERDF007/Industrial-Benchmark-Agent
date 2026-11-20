import type {PythonBridge} from '../python-bridge/index.js';
import type {AnchorReviewTask} from './scheduler.js';
import {JobSessionHost} from '../sessions/host.js';

export class ConsistencyAnchorReviewer {
  constructor(private readonly bridge: PythonBridge, private readonly host: JobSessionHost) {}

  async review(task: AnchorReviewTask): Promise<boolean> {
    const identity = {run_id: task.runId, anchor_id: task.anchorId, attempt: task.attempt};
    task.signal.throwIfAborted();
    const result = await this.bridge.execute<{ready:boolean}>('consistency_agent_collect',
      identity, task.signal, {timeoutMs: 0});
    await this.host.notice(task.sessionId, {type:'iad/consistency',
      summary:result.ready ? '标注比较已完成' : '图像内容需要重新核对', value:{...identity,...result}});
    return result.ready;
  }
}
