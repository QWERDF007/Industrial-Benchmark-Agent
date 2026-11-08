import {Context} from '@deepseek-ai/cordis';
import {AgentRegistry, type Agent, type AgentOptions, type AgentSetup} from '@deepseek-ai/dsh-agent';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import {SessionStore, SessionId, SessionSeq, type SessionEvent, type SessionHeader} from '@deepseek-ai/dsh-session';
import {SessionProjectionRegistry} from '@deepseek-ai/dsh-session-projection';
import {SystemPrompt} from '@deepseek-ai/dsh-system-prompt';
import {ToolRuntime} from '@deepseek-ai/dsh-tools';
import {ConsistencySessionPersistence, type SessionLocator} from './session-persistence.js';
import * as SessionCheckpoints from '@deepseek-ai/dsh-session-checkpoint-policy';
import {sessionFormatCatalog} from '@deepseek-ai/dsh-session-format-catalog';
import TokenMeter from '@deepseek-ai/dsh-token-meter';

declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    'iad/consistency': {summary: string; value: unknown; record_id?: string};
  }
}

export class ConsistencySessionHost {
  private readonly active = new Map<string, ConsistencySessionHost>();
  private constructor(private readonly root: string, private readonly locate: SessionLocator, private readonly ctx: Context, private readonly sessions: SessionStore,
    private readonly stop: () => Promise<void>) {}

  static async open(root: string, locate: SessionLocator): Promise<ConsistencySessionHost> {
    const ctx = new Context();
    let sessions!: SessionStore;
    let owner!: Context;
    const fork = await ctx.plugin({name: 'iad-consistency-sessions', apply: async (scope: Context) => {
      sessions = new SessionStore(scope);
      new SessionProjectionRegistry(scope);
      new AgentRegistry(scope);
      new LlmRuntime(scope);
      await scope.plugin(TokenMeter, {});
      new SystemPrompt(scope, {includeHarnessIdentity: false, includeRuntimeContext: false});
      new ToolRuntime(scope);
      new ConsistencySessionPersistence(scope, root, locate);
      await scope.plugin(SessionCheckpoints);
      await scope.inject(['sessionPersistence', 'agents'], injected => {owner = injected;});
    }});
    return new ConsistencySessionHost(root, locate, owner, sessions, () => fork.dispose());
  }

  async create(id: string): Promise<void> {
    const sessionId = SessionId(id);
    if (await this.ctx.sessionPersistence.stat(sessionId)) return;
    const session = this.sessions.prepare(sessionId);
    const detach = this.sessions.enter(session);
    try {
      this.sessions.announce(session);
      const handle = await this.ctx.sessionPersistence.create(session.header);
      try {await handle.flush();}
      finally {await handle.close();}
    } finally {
      detach();
    }
  }

  async withAgent<T>(id: string, options: {agentOptions?: AgentOptions; setup?: AgentSetup; signal?: AbortSignal},
    operation: (agent: Agent) => T | Promise<T>): Promise<T> {
    options.signal?.throwIfAborted();
    const sessionId = SessionId(id);
    const stored = await this.ctx.sessionPersistence.stat(sessionId);
    if (!stored) throw new Error('主图真实内部会话缺失，不能用同 ID 新建会话代替恢复');
    const runtime = await ConsistencySessionHost.open(this.root, this.locate);
    this.active.set(id, runtime);
    const dispose = this.ctx.effect(() => async () => {
      this.active.delete(id);
      await runtime.dispose();
    });
    try {
      const {AgentLoop} = await import('@deepseek-ai/dsh-agent-loop');
      await runtime.ctx.plugin(AgentLoop, {agents: []});
      const handle = await runtime.ctx.agents.resume({resumeSessionId: sessionId, ...options});
      try {
        return await operation(handle.agent);
      } finally {
        try {
          await runtime.sessions.flush(handle.agent.session);
        } finally {
          await handle.dispose();
        }
      }
    } finally {
      await dispose();
    }
  }

  async read(id: string): Promise<{header: SessionHeader; events: readonly SessionEvent[]}> {
    const active = this.active.get(id);
    if (active) return active.read(id);
    const handle = await this.ctx.sessionPersistence.open(SessionId(id), 'read');
    try {
      return {header: handle.header, events: (await handle.read()).events};
    } finally {
      await handle.close();
    }
  }

  async notice(id: string, summary: string, value: unknown, recordId?: string): Promise<void> {
    const handle = await this.ctx.sessionPersistence.open(SessionId(id), 'write');
    try {
      const {events} = await handle.read();
      if (recordId && events.some(event => event.type === 'iad/consistency' && event.data.record_id === recordId)) return;
      await handle.append([{type: 'iad/consistency', seq: SessionSeq(events.length), time: Date.now(), ignorable: true,
        data: {summary, value, ...(recordId ? {record_id: recordId} : {})}}]);
      await handle.flush();
    } finally {
      await handle.close();
    }
  }

  async exportJsonl(id: string): Promise<string> {
    const {header, events} = await this.read(id);
    return [sessionFormatCatalog.encodeCurrentHeader({...header, delegationDepth: header.delegationDepth ?? 0}, 0),
      ...events.map(event => sessionFormatCatalog.encodeCurrentEvent(JSON.parse(JSON.stringify(event))))]
      .map(line => JSON.stringify(line) + '\n').join('');
  }

  async dispose(): Promise<void> {
    await this.stop();
  }
}
