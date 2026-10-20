import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { message } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { resolveInspection } from "../inspection.js";
export function InspectionQuestion({ inspection, selection, transform }) {
    const { workspace } = useWorkspace();
    const [expanded, setExpanded] = useState(false);
    const [question, setQuestion] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function send(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        const { finding, evidence } = resolveInspection(inspection.analysis, selection);
        try {
            await workspace.ask({ ...inspection.reference, finding_id: finding?.finding_id || null,
                evidence_id: evidence?.evidence_id || null }, selection, transform(), question.trim());
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return expanded ? _jsxs("form", { className: "iad-inspection-question", onSubmit: send, "aria-label": "\u5411 Agent \u8FFD\u95EE", children: [_jsxs("label", { className: "iad-field", children: ["\u8FFD\u95EE\u5185\u5BB9", _jsx("textarea", { "aria-label": "\u8FFD\u95EE\u5185\u5BB9", rows: 3, value: question, disabled: busy, onChange: event => setQuestion(event.target.value) })] }), _jsx("p", { className: "iad-muted", children: "\u643A\u5E26\u5F53\u524D\u7591\u70B9\u3001\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u5B9E\u9645\u56FE\u50CF\u5F15\u7528\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-actions", children: [_jsx("button", { type: "submit", className: "iad-primary", disabled: busy, children: busy ? "正在提交…" : "发送到会话" }), _jsx("button", { type: "button", disabled: busy, onClick: () => setExpanded(false), children: "\u53D6\u6D88" })] })] }) : _jsx("button", { onClick: () => setExpanded(true), children: "\u5411 Agent \u8FFD\u95EE" });
}
