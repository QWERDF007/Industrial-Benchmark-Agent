import { SessionId } from "@deepseek-ai/dsh-session/types";
/** Uses host admission and the retained Session scope; never touches the composer draft. */
export class WorkbenchSession {
    host;
    constructor(host) {
        this.host = host;
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
    async mine(scopeRunId, kind, imageCount, images, returnLink, previousSessionId) {
        const id = previousSessionId ? SessionId(previousSessionId) : await this.host.sessions.create();
        const link = returnLink(id);
        await this.host.sessions.using(id, { source: "iadKnowledge" }, async (reference) => {
            const binding = await reference.ready;
            const text = [
                `请持续挖掘此固定范围的${kind === "normal" ? "良品" : "异常"}知识，直到整个范围观察完成。每次选择${imageCount}张来源，末组不足时处理实际剩余。`,
                `范围引用：${scopeRunId}`,
                images.length ? `已选图像：${JSON.stringify(images)}。正式调用前核对真实剩余范围，不重复处理已发布图组。` : "请从真实剩余范围选择图组。",
                "先将此范围关联到当前会话并读取真实进度，逐组显式续用刚发布的知识；保留冲突、人审待办与缺证，不启动其他未请求阶段。",
                `返回知识工作台：${link}`,
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
