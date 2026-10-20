import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { message, request } from "../api.js";
import { useReviewDraft } from "../useReviewDraft.js";
const decisions = { PASS: "良品", HARD_NORMAL: "困难正常", FAIL: "异常", UNCERTAIN: "不确定", SKIP: "跳过" };
export function HumanReviewForm({ datasetId, sampleId, detail, onChanged }) {
    const draft = useReviewDraft(datasetId, sampleId);
    const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
    const openedAt = useRef(Date.now());
    async function submit(decision) {
        if (!draft.reviewer.trim()) {
            setError("请填写复核人");
            return;
        }
        setBusy(true);
        setError("");
        setNotice("");
        try {
            const submission = draft.prepare(decision, Date.now() - openedAt.current);
            const saved = await request("/review/submit", submission);
            localStorage.setItem("iad.reviewer", saved.reviewer);
            draft.discard();
            openedAt.current = Date.now();
            setNotice(`已提交 ${saved.decision}`);
            onChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-decision", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), notice && _jsx("p", { role: "status", children: notice }), draft.pending ? _jsxs("div", { className: "iad-row", children: [_jsx("span", { role: "status", children: "\u63D0\u4EA4\u7ED3\u679C\u5F85\u786E\u8BA4" }), _jsx("button", { disabled: busy, onClick: () => submit(draft.pending.decision), children: "\u91CD\u8BD5\u63D0\u4EA4" })] })
                : draft.dirty && _jsxs("div", { className: "iad-row", children: [_jsx("span", { role: "status", children: "\u8349\u7A3F\u672A\u63D0\u4EA4" }), _jsx("button", { disabled: busy, onClick: draft.discard, children: "\u653E\u5F03\u8349\u7A3F" })] }), detail.review_decision && _jsxs("p", { children: ["\u5F53\u524D\uFF1A", decisions[detail.review_decision.decision] || detail.review_decision.decision, " \u00B7 ", detail.review_decision.reviewer, _jsx("br", {}), detail.review_decision.comment] }), _jsxs("label", { className: "iad-field", children: ["\u590D\u6838\u4EBA", _jsx("input", { value: draft.reviewer, disabled: busy || !!draft.pending, onChange: e => draft.update({ reviewer: e.target.value }) })] }), _jsxs("label", { className: "iad-field", children: ["\u590D\u6838\u8BF4\u660E", _jsx("textarea", { value: draft.comment, disabled: busy || !!draft.pending, onChange: e => draft.update({ comment: e.target.value }) })] }), _jsx("div", { className: "iad-actions", children: Object.entries(decisions).map(([value, label]) => _jsx("button", { className: value === "FAIL" ? "iad-danger" : "", disabled: busy || !!draft.pending, onClick: () => submit(value), children: label }, value)) }), _jsxs("details", { className: "iad-review-history", children: [_jsxs("summary", { children: ["\u590D\u6838\u8BB0\u5F55 \u00B7 ", detail.review_history.length, " \u6B21"] }), _jsx("ol", { children: detail.review_history.map(record => _jsxs("li", { "data-decision-id": record.decision_id, children: [_jsx("strong", { children: decisions[record.decision] || record.decision }), " \u00B7 ", record.reviewer, _jsx("br", {}), record.submitted_at ? _jsx("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "未记录提交时间", record.comment && _jsx("p", { children: record.comment })] }, record.decision_id)) })] })] });
}
