import { Context } from '@deepseek-ai/cordis';
import { AgentRegistry } from '@deepseek-ai/dsh-agent';
import { LlmRuntime } from '@deepseek-ai/dsh-llm';
import { SessionStore, SessionId, SessionSeq } from '@deepseek-ai/dsh-session';
import { SessionProjectionRegistry } from '@deepseek-ai/dsh-session-projection';
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt';
import { ToolRuntime } from '@deepseek-ai/dsh-tools';
import { JobSessionPersistence } from './persistence.js';
import * as SessionCheckpoints from '@deepseek-ai/dsh-session-checkpoint-policy';
import { sessionFormatCatalog } from '@deepseek-ai/dsh-session-format-catalog';
import TokenMeter from '@deepseek-ai/dsh-token-meter';
import BasicCompaction from '@deepseek-ai/dsh-compaction-basic';
import * as ImageOffload from '@deepseek-ai/dsh-compaction-image-offload';
import { imageOffloadProjection } from '@deepseek-ai/dsh-compaction-image-offload/projection';
import SubagentRuntime from '@deepseek-ai/dsh-subagent';
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process';
import SessionQuery from '@deepseek-ai/dsh-session-query-sqlite';
import { ObservedImages } from './observed-images.js';
export class JobSessionHost {
    root;
    locate;
    ctx;
    sessions;
    stop;
    active = new Map();
    constructor(root, locate, ctx, sessions, stop) {
        this.root = root;
        this.locate = locate;
        this.ctx = ctx;
        this.sessions = sessions;
        this.stop = stop;
    }
    static async open(root, locate, evidenceOnDemand = false) {
        const ctx = new Context();
        let sessions;
        let owner;
        const fork = await ctx.plugin({ name: 'iad-job-sessions', apply: async (scope) => {
                sessions = new SessionStore(scope);
                new SessionProjectionRegistry(scope);
                new AgentRegistry(scope);
                new LlmRuntime(scope);
                await scope.plugin(TokenMeter, {});
                if (evidenceOnDemand)
                    sessions.registerMessageProjection(imageOffloadProjection);
                else
                    await scope.plugin(ImageOffload);
                new SystemPrompt(scope, { includeHarnessIdentity: false, includeRuntimeContext: false });
                new ToolRuntime(scope);
                new JobSessionPersistence(scope, root, locate);
                await scope.plugin(SessionCheckpoints);
                await scope.inject(['sessionPersistence', 'agents'], injected => { owner = injected; });
            } });
        return new JobSessionHost(root, locate, owner, sessions, () => fork.dispose());
    }
    async create(id) {
        const sessionId = SessionId(id);
        if (await this.ctx.sessionPersistence.stat(sessionId))
            return;
        const session = this.sessions.prepare(sessionId);
        const detach = this.sessions.enter(session);
        try {
            this.sessions.announce(session);
            const handle = await this.ctx.sessionPersistence.create(session.header);
            try {
                await handle.flush();
            }
            finally {
                await handle.close();
            }
        }
        finally {
            detach();
        }
    }
    async withAgent(id, options, operation) {
        options.signal?.throwIfAborted();
        const sessionId = SessionId(id);
        const stored = await this.ctx.sessionPersistence.stat(sessionId);
        if (!stored)
            throw new Error('作业真实内部会话缺失，不能用同 ID 新建会话代替恢复');
        const runtime = await JobSessionHost.open(this.root, this.locate, options.evidenceOnDemand);
        this.active.set(id, runtime);
        const dispose = this.ctx.effect(() => async () => {
            this.active.delete(id);
            await runtime.dispose();
        });
        try {
            const { AgentLoop } = await import('@deepseek-ai/dsh-agent-loop');
            await runtime.ctx.plugin(AgentLoop, { agents: [] });
            if (options.evidenceOnDemand)
                new ObservedImages(runtime.sessions).attach(runtime.ctx, options.imageHandoffTools);
            const retention = options.evidenceOnDemand ? { retainTokens: 0, compactionRetries: 0, maxOverflowRetries: 0 } : {};
            let owner = runtime.ctx;
            if (options.subagents !== undefined) {
                await runtime.ctx.plugin(SessionQuery, { path: ':memory:', openAt: 'never' });
                await runtime.ctx.plugin(SubagentRuntime, { maxActiveSubagents: options.subagents, maxDepth: 1 });
                await runtime.ctx.plugin(SubagentSpawn, { providerName: 'spawn' });
                await runtime.ctx.inject(['subagents'], injected => { owner = injected; });
            }
            if (options.sharedSetup) {
                await owner.inject(['llm', 'systemPrompt', 'tools'], async (injected) => { await options.sharedSetup(injected); });
                const maxTokens = options.agentOptions?.maxTokens ?? 4096;
                await owner.plugin(BasicCompaction, { headroomTokens: maxTokens, maxTokens, ...retention });
            }
            const handle = await owner.agents.resume({ resumeSessionId: sessionId, ...options,
                setup: async (scope, agent) => {
                    const commit = await options.setup?.(scope, agent);
                    const maxTokens = agent.options.maxTokens ?? 4096;
                    if (!options.sharedSetup)
                        await scope.plugin(BasicCompaction, { headroomTokens: maxTokens, maxTokens, ...retention });
                    return commit;
                } });
            try {
                return await operation(handle.agent);
            }
            finally {
                try {
                    if (options.subagents !== undefined)
                        await owner.subagents.drainContinuableDescendants([handle.agent]);
                    await runtime.sessions.flush(handle.agent.session);
                }
                finally {
                    await handle.dispose();
                }
            }
        }
        finally {
            await dispose();
        }
    }
    async read(id) {
        const active = this.active.get(id);
        if (active)
            return active.read(id);
        const handle = await this.ctx.sessionPersistence.open(SessionId(id), 'read');
        try {
            return { header: handle.header, events: (await handle.read()).events };
        }
        finally {
            await handle.close();
        }
    }
    async exists(id) {
        return !!await this.ctx.sessionPersistence.stat(SessionId(id));
    }
    async notice(id, notice) {
        const { type, ...data } = notice;
        const handle = await this.ctx.sessionPersistence.open(SessionId(id), 'write');
        try {
            const { events } = await handle.read();
            if (data.record_id && events.some(event => event.type === type && event.data.record_id === data.record_id))
                return;
            await handle.append([{ type, seq: SessionSeq(events.length), time: Date.now(), ignorable: true, data }]);
            await handle.flush();
        }
        finally {
            await handle.close();
        }
    }
    async exportJsonl(id) {
        const { header, events } = await this.read(id);
        return [sessionFormatCatalog.encodeCurrentHeader({ ...header, delegationDepth: header.delegationDepth ?? 0 }, 0),
            ...events.map(event => sessionFormatCatalog.encodeCurrentEvent(JSON.parse(JSON.stringify(event))))]
            .map(line => JSON.stringify(line) + '\n').join('');
    }
    async dispose() {
        await this.stop();
    }
}
