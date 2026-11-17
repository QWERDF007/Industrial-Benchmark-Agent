import { isCompactCheckpointSource, toolPairingBalancedAfter, toolPairingBalancedBefore } from '@deepseek-ai/dsh-compaction';
import { lastAssistantStreamChunk, LlmError } from '@deepseek-ai/dsh-llm';
/** Admission and compaction share one budget, including auxiliary summary calls. */
export class JobSessionCapacity {
    scope;
    sessions;
    calibration = new Map();
    recovered = new WeakSet();
    constructor(scope, sessions) {
        this.scope = scope;
        this.sessions = sessions;
    }
    estimate(messages, tools) {
        let images = 0;
        const text = JSON.stringify({ tools, messages }, (_key, value) => {
            if (value && typeof value === 'object' && value.type === 'image') {
                if (!value.offloaded)
                    images++;
                return { type: 'text', text: value.offloaded ? '[previously observed image]' : '[image]' };
            }
            return value;
        });
        return Math.ceil(Buffer.byteLength(text, 'utf8') / 2) + images * 4096;
    }
    async budget(provider, model, maxTokens, signal) {
        const info = await this.scope.llm.resolveModelInfo(provider, model, signal);
        const window = info.context?.contextWindow;
        if (!window)
            throw new LlmError('模型未声明上下文容量，无法执行容量检查', 'JOB_CONTEXT_BUDGET');
        const reserve = maxTokens ?? info.defaultMaxTokens ?? 4096;
        if (reserve >= window)
            throw new LlmError('模型输出预留超过上下文容量', 'JOB_CONTEXT_BUDGET');
        const available = window - reserve;
        return { window, reserve, threshold: available * .5, limit: available * .75 };
    }
    async pageChars(agent) {
        const header = agent.session.requestHeader();
        const provider = header?.config.provider ?? agent.options.provider, model = header?.config.model ?? agent.options.model;
        if (!provider || !model)
            throw new LlmError('主 Agent 未解析模型容量', 'JOB_CONTEXT_BUDGET');
        const budget = await this.budget(provider, model, agent.options.maxTokens);
        const input = Math.max(this.scope.tokenMeter.measure(agent.session).totalTokens, this.estimate(agent.session.deriveMessages(), header?.tools) * (this.calibration.get(provider + '/' + model) ?? 1));
        const chars = Math.floor((budget.limit - input) / 2);
        if (chars < 4000)
            throw new LlmError('当前页面剩余容量不足，请等待上下文压缩后继续读取', 'JOB_CONTEXT_BUDGET');
        return Math.min(64000, chars);
    }
    async reduce(agent, pending, signal, force = false) {
        const header = agent.session.requestHeader();
        const provider = header?.config.provider ?? agent.options.provider, model = header?.config.model ?? agent.options.model;
        if (!provider || !model)
            return false;
        const budget = await this.budget(provider, model, agent.options.maxTokens, signal);
        const factor = this.calibration.get(provider + '/' + model) ?? 1;
        const measure = () => {
            const measurement = this.scope.tokenMeter.measure(agent.session);
            const input = Math.max(measurement.totalTokens, this.estimate(agent.session.deriveMessages(), header?.tools) * factor)
                + this.estimate(pending, undefined) * factor;
            return { measurement, input };
        };
        const fixedTokens = this.estimate(agent.session.deriveMessages().filter(message => message.role === 'system'), header?.tools) * factor;
        const threshold = Math.max(budget.threshold, fixedTokens + (budget.limit - fixedTokens) * .5);
        let { measurement, input } = measure();
        if (!force && input < threshold)
            return false;
        let reduced = false;
        while (force || input >= threshold) {
            signal.throwIfAborted();
            let end;
            let selectedTokens = 0, freshTokens = 0, endFreshTokens = 0;
            const summaryLimit = budget.limit - fixedTokens - 2048;
            await this.sessions.flush(agent.session);
            const reader = await this.scope.sessionPersistence.open(agent.session.id, 'read');
            const events = await reader.read().finally(() => reader.close());
            const bySeq = new Map(events.events.map(event => [event.seq, event]));
            let observedThrough = -1;
            for (const event of events.events)
                if (event.type === 'assistant/message' && !event.data.interrupted) {
                    const finish = lastAssistantStreamChunk(event.data.stream, 'finish')?.reason.kind;
                    if (finish === 'stop' || finish === 'tool-calls')
                        observedThrough = event.seq;
                }
            const first = measurement.nodes[0];
            const head = first ? bySeq.get(first.seq) : undefined;
            const nodes = head && agent.session.deriveEventMessage(head)?.role === 'system' ? measurement.nodes.slice(1) : measurement.nodes;
            const start = nodes[0]?.seq;
            if (start === undefined || !toolPairingBalancedBefore(agent.session, start))
                break;
            for (const node of nodes) {
                if (node.seq > observedThrough)
                    break;
                const event = bySeq.get(node.seq);
                const message = event ? agent.session.deriveEventMessage(event) : null;
                if (message?.content.some(block => block.type === 'image' && !block.offloaded))
                    break;
                const tokens = Math.max(node.tokens, message ? this.estimate([message], undefined) : 0) * factor;
                selectedTokens += tokens;
                if (event?.type !== 'user/message' || !isCompactCheckpointSource(event.data.source))
                    freshTokens += tokens;
                if (selectedTokens > summaryLimit)
                    break;
                if (toolPairingBalancedAfter(agent.session, node.seq)) {
                    end = node.seq;
                    endFreshTokens = freshTokens;
                }
            }
            if (end === undefined || endFreshTokens < Math.min(2048, budget.limit * .1))
                break;
            const before = input;
            await this.scope.compaction.compactRegion(start, end, agent, signal);
            ({ measurement, input } = measure());
            if (input >= before)
                throw new LlmError('上下文摘要未缩小输入，已停止当前阶段', 'JOB_COMPACTION_FAILED');
            reduced = true;
            force = false;
        }
        if (input >= budget.limit)
            throw new LlmError(`输入估计 ${Math.ceil(input)} token，超过容量预算 ${Math.floor(budget.limit)}，已停止当前阶段`, 'JOB_CONTEXT_BUDGET');
        return reduced;
    }
    attach() {
        this.scope.on('agent/pre-step', async ({ agent, signal }, next) => {
            const decision = await next();
            if (decision.kind === 'enter')
                await this.reduce(agent, decision.messages, signal);
            return decision;
        });
        this.scope.on('agent/request-error', async ({ agent, failure, signal }, next) => {
            if (this.recovered.has(agent) || !/context|maximum.*length/i.test(failure.message))
                return next();
            this.recovered.add(agent);
            if (await this.reduce(agent, [], signal, true))
                return { kind: 'retry' };
            return next();
        });
        const capacity = this;
        this.scope.on('llm/stream', async function* (request, next) {
            const { provider, model } = request;
            const budget = await capacity.budget(provider, model, request.maxTokens, request.signal);
            const key = provider + '/' + model;
            const estimated = capacity.estimate(request.messages, request.tools);
            const input = estimated * (capacity.calibration.get(key) ?? 1);
            if (input > budget.limit)
                throw new LlmError(`${request.purpose === 'compaction' ? '摘要' : '业务'}输入估计 ${Math.ceil(input)} token，超过容量预算 ${Math.floor(budget.limit)}`, 'JOB_CONTEXT_BUDGET');
            for await (const chunk of next()) {
                if (chunk.type === 'usage') {
                    const usage = chunk.usage;
                    const actual = (usage.inputTokens ?? 0) + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
                    if (estimated > 0 && actual > estimated)
                        capacity.calibration.set(key, Math.max(capacity.calibration.get(key) ?? 1, actual / estimated * 1.1));
                }
                yield chunk;
            }
        });
    }
}
