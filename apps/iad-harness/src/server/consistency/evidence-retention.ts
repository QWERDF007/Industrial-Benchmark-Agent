import type {Context} from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-compaction';
import type {Session, SessionEvent, SessionSeq} from '@deepseek-ai/dsh-session';
import type {} from '@deepseek-ai/dsh-token-meter';

type ContextFacts = {anchor?: unknown; assessments?: {candidate_id: string}[]; observations: {candidate_id: string}[]};

/** Pending candidate facts stay readable; completed facts remain in storage and original events. */
export class ConsistencyEvidenceRetention {
  private readonly calls = new Map<string, string>();
  private readonly assessed = new Set<string>();
  private readonly contexts = new Map<SessionSeq, {event: SessionEvent<'tool/result'>; value: ContextFacts}>();
  private readonly deliveredContexts = new Set<SessionSeq>();

  constructor(private readonly scope: Context, events: readonly SessionEvent[]) {
    for (const event of events) this.accept(event);
    scope.on('session/event', (_session, event) => this.accept(event));
  }

  private accept(event: SessionEvent): void {
    if (event.type === 'tool/call') this.calls.set(event.data.callId, event.data.name);
    if (event.type !== 'tool/result' || event.data.message.isError) return;
    const name = this.calls.get(event.data.message.toolCallId);
    if (name !== 'anchor_observe' && name !== 'anchor_assess' && name !== 'anchor_context') return;
    const text = event.data.message.content.find(block => block.type === 'text');
    if (!text || text.type !== 'text') return;
    const value = JSON.parse(text.text);
    if (name === 'anchor_context' || name === 'anchor_observe') {
      if (!('observations' in value)) return;
      if (value.assessments) for (const item of value.assessments) this.assessed.add(item.candidate_id);
      this.contexts.set(event.seq, {event, value});
    } else if (name === 'anchor_assess') this.assessed.add(value.candidate_id);
  }

  retainPending(session: Session): void {
    const visible = new Set(session.surface.nodes);
    const current = session.surface.nodes.filter(seq => this.contexts.get(seq)?.value.anchor).at(-1);
    const latest = new Map<string, SessionSeq>();
    for (const seq of session.surface.nodes) {
      const context = this.contexts.get(seq);
      if (context) for (const item of context.value.observations) latest.set(item.candidate_id, seq);
    }
    for (const [seq, {event, value}] of [...this.contexts]) {
      if (!visible.has(seq)) {this.contexts.delete(seq);continue;}
      const delivered = this.deliveredContexts.has(seq);
      this.deliveredContexts.add(seq);
      const pending = value.observations.filter(item => latest.get(item.candidate_id) === seq
        && (!delivered || !this.assessed.has(item.candidate_id)));
      if (pending.length === value.observations.length && (seq === current || !value.anchor)) continue;
      const projection = seq === current || 'observation_id' in value ? {...value, observations: pending}
        : pending.length ? {observations: pending}
        : {retained: true, read_tool: 'anchor_context', candidate_ids: value.observations.map(item => item.candidate_id)};
      this.replace(session, event, projection);
      this.contexts.delete(seq);
    }
  }

  private replace(session: Session, event: SessionEvent<'tool/result'>, value: unknown): void {
    const seq = event.seq;
    session.append('compaction/prune', {shadowedRange: {start: seq, end: seq}, shadowedSeqs: [seq],
      shadowedTokenCount: this.scope.tokenMeter.estimateMessage(event.data.message)});
    const replacement = session.append('tool/result', {...event.data, message: {...event.data.message,
      content: [{type: 'text', text: JSON.stringify(value)}]}},
      {surfaceOp: {op: 'replace', startSeq: seq, endSeq: seq}, sourceEventSeqs: [seq]});
    this.deliveredContexts.add(replacement.seq);
  }
}
