import { SessionId } from "@deepseek-ai/dsh-session/types";
/** Uses host admission and the retained Session scope; never touches the composer draft. */
export class InspectionSession {
    host;
    constructor(host) {
        this.host = host;
    }
    async send(snapshot, question, returnLink, previousSessionId) {
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
}
