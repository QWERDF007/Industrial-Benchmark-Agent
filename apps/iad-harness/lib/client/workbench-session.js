import { SessionId } from "@deepseek-ai/dsh-session/types";
/** Uses host admission and the retained Session scope; never touches the composer draft. */
export class WorkbenchSession {
    host;
    constructor(host) {
        this.host = host;
    }
    async explainConsistency(context, returnLink, previousSessionId) {
        const id = previousSessionId ? SessionId(previousSessionId) : await this.host.sessions.create();
        const link = returnLink(id);
        context = { ...context, return_location: { pageId: 'industrial-consistency', ...context.return_location, sessionId: id } };
        await this.host.sessions.using(id, { source: 'iadConsistency' }, async (reference) => {
            const binding = await reference.ready;
            const text = [
                '请解释这份冻结的一致性证据及所选差异，区分原图事实、双方标注、规范、人工复核、推断和待确认事项。',
                `一致性证据引用：${JSON.stringify(context)}`,
                ...(context.return_location?.queryId && context.return_location.groupId ? [
                    `同时解释当前完整图组：${JSON.stringify({ query_id: context.return_location.queryId, kind: context.return_location.tab, group_id: context.return_location.groupId, facts_state: context.return_location.facts || 'CURRENT' })}`,
                    '用 consistency_group_analyze 启动当前图组的结构化模型验证，同一请求固定request_id；用 consistency_group_analysis读取真实状态和结论引用。仅当作业完成并保存结果后说已分析；失败或超预算明确说明，不将首批候选代表全组。',
                ] : []),
                `返回比较证据：${link}`,
                '先用 consistency_context 校验引用并实际读取它返回的图片附件，按 next_cursor 继续所选差异；说明剩余和未选择范围。保留返回链接，不启动全库检查、知识挖掘、模型审计或人工裁决。',
            ].join('\n');
            const submission = binding.ctx.inject(['conversation'], scoped => scoped.conversation.send(text));
            try {
                await submission;
            }
            finally {
                await submission.dispose();
            }
            this.host.uiWorkspace.openSession(id);
        });
    }
    async inspect(snapshot, question, returnLink, previousSessionId) {
        const existing = previousSessionId || snapshot.origin_session_id;
        const id = existing ? SessionId(existing) : await this.host.sessions.create();
        const link = returnLink(id);
        await this.host.sessions.using(id, { source: "iadInspection" }, async (reference) => {
            const binding = await reference.ready;
            const text = [
                question || "请结合当前疑点和实际图像核对，说明正常替代解释与仍需人工核实之处。",
                `冻结检视引用：${JSON.stringify(snapshot.reference)}`,
                `知识版本：${JSON.stringify({ normal: snapshot.analysis.normal_version_id, defect: snapshot.analysis.defect_version_id })}`,
                `返回检视：${link}`,
                "先用 model_audit_context 校验引用，再用 model_audit_evidence 读取其 evidence 清单中的真实全图、ROI与配对原图，结合图像回答。保留返回检视链接，不写人工裁决。",
            ].join("\n");
            const submission = binding.ctx.inject(["conversation"], scoped => scoped.conversation.send(text));
            try {
                await submission;
            }
            finally {
                await submission.dispose();
            }
            this.host.uiWorkspace.openSession(id);
        });
    }
    async open(sessionId) {
        const id = SessionId(sessionId);
        await this.host.sessions.using(id, { source: "iadInspection" }, async (reference) => {
            await reference.ready;
            this.host.uiWorkspace.openSession(id);
        });
    }
}
