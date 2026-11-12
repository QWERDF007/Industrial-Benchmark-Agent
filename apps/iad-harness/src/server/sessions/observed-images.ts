import type {Context} from '@deepseek-ai/cordis';
import type {Session, SessionSeq, SessionStore} from '@deepseek-ai/dsh-session';
import type {MessageId} from '@deepseek-ai/dsh-llm';
import type {ImageOffloadTarget} from '@deepseek-ai/dsh-compaction-image-offload/projection';
import {lastAssistantStreamChunk} from '@deepseek-ai/dsh-llm/assistant-stream';

export class ObservedImages {
  constructor(private readonly sessions: SessionStore) {}

  attach(scope: Context, handoffTools?: readonly string[]): void {
    const handoffs = handoffTools ? new Set(handoffTools) : undefined;
    scope.systemPrompt.section({name:'observed-images-policy',order:105,interpolate:false,text:
      (handoffs
        ? '图像上下文采用观察提交协议：当前观察所需的图片在补看、裁图及比较期间保留，只有观察报告、目录或定稿工具成功保存文字事实后才卸载此前实际送达的附件。模型请求成功和读取工具成功都不代表观察事实已保存。成功提交前直接联合比较已有图片，不机械重复读取。\n'
        : '图像上下文采用按需证据协议：图片进入一次正常结束的业务请求后退出后续请求，原图、标注和送达记录仍保留。')
      +'历史图片占位不表示读取失败；原生占位中的 image omitted to fit request image limits 在本协议中表示此前图片已退出历史附件，不能据此声称原图未送达。\n'
      +'补看前用简短文字保留已观察的关键事实；需要重新比较时显式调用图像工具。需要同时比较整图与局部时，在同一轮取得所需的完整材料。压缩摘要不算新的读图。仅对本次真实工具错误或当前新附图确实无法观察的情况记录取证限制。'});
    const sessions = this.sessions;
    const indexes = new WeakMap<Session, Map<MessageId, SessionSeq>>();
    const initialized = new WeakSet<Session>();
    const requests = new WeakMap<Session, {targets: ImageOffloadTarget[]; successful: boolean}>();
    const observed = new WeakMap<Session, ImageOffloadTarget[]>();
    scope.on('tools/result', (execution, result) => {
      if (!handoffs?.has(execution.name) || result.isError || !execution.agent) return;
      const session = execution.agent.session;
      const targets = observed.get(session);
      observed.delete(session);
      if (targets?.length) session.append('image/offload', {targets});
    });
    scope.on('session/event', (session, event) => {
      const message = event.type === 'user/message' ? event.data
        : event.type === 'tool/result' ? event.data.message : null;
      if (!message?.content.some(block => block.type === 'image')) return;
      let index = indexes.get(session);
      if (!index) indexes.set(session, index = new Map());
      index.set(message.id, event.seq);
    });
    scope.on('agent/pre-step', async ({agent}, next) => {
      const session = agent.session;
      if (!initialized.has(session)) {
        await sessions.flush(session);
        const reader = await scope.sessionPersistence.open(session.id, 'read');
        try {
          const {events} = await reader.read();
          const nodes = new Set(session.surface.nodes);
          const index = new Map<MessageId, SessionSeq>();
          let successful = -1;
          const committedCalls = new Map<string, SessionSeq>();
          for (const event of events) {
            if (event.type === 'assistant/message' && !event.data.interrupted) {
              const finish = lastAssistantStreamChunk(event.data.stream, 'finish')?.reason.kind;
              if (finish !== 'stop' && finish !== 'tool-calls') continue;
              if (!handoffs) successful = event.seq;
              else for (const block of event.data.message.content)
                if (block.type === 'tool-call' && handoffs.has(block.name)) committedCalls.set(block.id, event.seq);
            } else if (handoffs && event.type === 'tool/result' && !event.data.message.isError
                && committedCalls.has(event.data.message.toolCallId)) successful = committedCalls.get(event.data.message.toolCallId)!;
          }
          const targets: ImageOffloadTarget[] = [];
          for (const event of events) {
            if (!nodes.has(event.seq)) continue;
            const message = event.type === 'user/message' ? event.data
              : event.type === 'tool/result' ? event.data.message : null;
            if (!message?.content.some(block => block.type === 'image')) continue;
            index.set(message.id, event.seq);
            if (event.seq >= successful) continue;
            let imageIndex = 0;
            const imageIndexes = (session.deriveEventMessage(event)?.content ?? []).flatMap(block =>
              block.type === 'image' ? (block.offloaded ? (imageIndex++, []) : [imageIndex++]) : []);
            if (imageIndexes.length) targets.push({seq:event.seq, imageIndexes});
          }
          indexes.set(session, index);
          initialized.add(session);
          if (targets.length) session.append('image/offload', {targets});
        } finally {await reader.close();}
      }
      return next();
    });
    scope.on('llm/stream', async function* (options, next) {
      const session = !options.purpose && options.sessionId ? sessions.get(options.sessionId) : undefined;
      if (!session) {yield* next(); return;}
      const index = indexes.get(session)!;
      const nodes = new Set(session.surface.nodes);
      for (const [id, seq] of index) if (!nodes.has(seq)) index.delete(id);
      const targets: ImageOffloadTarget[] = [];
      for (const message of options.messages) {
        if (!('id' in message) || !message.id) continue;
        const seq = index.get(message.id);
        if (seq === undefined) continue;
        let imageIndex = 0;
        const imageIndexes = message.content.flatMap(block => block.type === 'image'
          ? (block.offloaded ? (imageIndex++, []) : [imageIndex++]) : []);
        if (imageIndexes.length) targets.push({seq, imageIndexes});
      }
      const request = {targets, successful: false};
      requests.set(session, request);
      try {
        for await (const chunk of next()) {
          if (chunk.type === 'finish') request.successful = chunk.reason.kind === 'stop' || chunk.reason.kind === 'tool-calls';
          yield chunk;
        }
      } catch (error) {
        requests.delete(session);
        throw error;
      }
    });
    scope.on('agent/assistant-stream', ({agent, frame}) => {
      if (frame.type !== 'end') return;
      const request = requests.get(agent.session);
      requests.delete(agent.session);
      if (frame.outcome.kind === 'committed' && frame.outcome.eventType === 'assistant/message'
          && request?.successful && request.targets.length) {
        if (handoffs) observed.set(agent.session, request.targets);
        else agent.session.append('image/offload', {targets: request.targets});
      }
    });
  }
}
