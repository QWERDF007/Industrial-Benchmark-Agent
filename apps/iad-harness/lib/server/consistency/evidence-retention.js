/** Pending candidate facts stay readable; completed facts remain in storage and original events. */
export class ConsistencyEvidenceRetention {
    scope;
    calls = new Map();
    assessed = new Set();
    observations = new Map();
    contexts = new Map();
    deliveredContexts = new Set();
    constructor(scope, events) {
        this.scope = scope;
        for (const event of events)
            this.accept(event);
        scope.on('session/event', (_session, event) => this.accept(event));
    }
    accept(event) {
        if (event.type === 'tool/call')
            this.calls.set(event.data.callId, event.data.name);
        if (event.type !== 'tool/result' || event.data.message.isError)
            return;
        const name = this.calls.get(event.data.message.toolCallId);
        if (name !== 'anchor_observe' && name !== 'anchor_assess' && name !== 'anchor_context')
            return;
        const text = event.data.message.content.find(block => block.type === 'text');
        if (!text || text.type !== 'text')
            return;
        const value = JSON.parse(text.text);
        if (name === 'anchor_context') {
            if (!('observations' in value))
                return;
            if (value.assessments)
                for (const item of value.assessments)
                    this.assessed.add(item.candidate_id);
            this.contexts.set(event.seq, { event, value });
        }
        else if (name === 'anchor_assess')
            this.assessed.add(value.candidate_id);
        else if (value.request)
            this.observations.set(event.seq, { event, id: value.observation_id,
                requestId: value.request.request_id, candidates: value.request.candidate_ids });
    }
    retainPending(session) {
        const visible = new Set(session.surface.nodes);
        for (const [seq, item] of this.observations) {
            if (!visible.has(seq)) {
                this.observations.delete(seq);
                continue;
            }
            this.replace(session, item.event, { observation_id: item.id, request_id: item.requestId, candidate_ids: item.candidates,
                retained: true, read_tool: 'anchor_context' });
            this.observations.delete(seq);
        }
        const current = session.surface.nodes.filter(seq => this.contexts.has(seq)).at(-1);
        const latest = new Map();
        for (const seq of session.surface.nodes) {
            const context = this.contexts.get(seq);
            if (context)
                for (const item of context.value.observations)
                    latest.set(item.candidate_id, seq);
        }
        for (const [seq, { event, value }] of [...this.contexts]) {
            if (!visible.has(seq)) {
                this.contexts.delete(seq);
                continue;
            }
            const delivered = this.deliveredContexts.has(seq);
            this.deliveredContexts.add(seq);
            const pending = value.observations.filter(item => latest.get(item.candidate_id) === seq
                && (!delivered || !this.assessed.has(item.candidate_id)));
            if (pending.length === value.observations.length && (seq === current || !value.anchor))
                continue;
            const projection = seq === current && value.anchor ? { ...value, observations: pending }
                : pending.length ? { observations: pending }
                    : { retained: true, read_tool: 'anchor_context', candidate_ids: value.observations.map(item => item.candidate_id) };
            this.replace(session, event, projection);
            this.contexts.delete(seq);
        }
    }
    replace(session, event, value) {
        const seq = event.seq;
        session.append('compaction/prune', { shadowedRange: { start: seq, end: seq }, shadowedSeqs: [seq],
            shadowedTokenCount: this.scope.tokenMeter.estimateMessage(event.data.message) });
        const replacement = session.append('tool/result', { ...event.data, message: { ...event.data.message,
                content: [{ type: 'text', text: JSON.stringify(value) }] } }, { surfaceOp: { op: 'replace', startSeq: seq, endSeq: seq }, sourceEventSeqs: [seq] });
        this.deliveredContexts.add(replacement.seq);
    }
}
