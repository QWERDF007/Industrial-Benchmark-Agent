import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request, reviewLabel } from "../api.js";
import { Pagination, pageSize } from "./Pagination.js";
export function ReviewRecords({ datasetId, page, search, selected, revision, onPage, onSearch, onSelect }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        const query = new URLSearchParams({ dataset_id: datasetId, page: String(page), page_size: String(pageSize), search });
        request(`/review/history?${query}`, undefined, undefined, controller.signal).then(result => {
            if (!controller.signal.aborted)
                setResult(result);
        }).catch(error => { if (!controller.signal.aborted)
            setError(message(error)); })
            .finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [datasetId, page, search, revision, retry]);
    const pagination = result && _jsx(Pagination, { total: result.total, page: page, unit: "\u6761\u8BB0\u5F55", onPage: onPage });
    return _jsxs("section", { className: "iad-review-records", "aria-label": "\u590D\u6838\u8BB0\u5F55", children: [_jsxs("label", { className: "iad-field", children: ["\u641C\u7D22\u590D\u6838\u8BB0\u5F55", _jsx("input", { "aria-label": "\u641C\u7D22\u590D\u6838\u8BB0\u5F55", placeholder: "\u56FE\u50CF\u540D\u3001\u590D\u6838\u4EBA\u6216\u8BF4\u660E", value: search, onChange: event => onSearch(event.target.value) })] }), error ? _jsxs("div", { role: "alert", className: "iad-error", children: [error, _jsx("button", { onClick: () => setRetry(value => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D\u8BB0\u5F55" })] })
                : loading ? _jsx("p", { role: "status", children: "\u52A0\u8F7D\u590D\u6838\u8BB0\u5F55\u2026" }) : _jsxs(_Fragment, { children: [pagination, result?.items.length ? _jsx("div", { className: "iad-table-scroll", role: "region", "aria-label": "\u590D\u6838\u5386\u53F2\u8868\u683C", tabIndex: 0, onFocus: event => { if (event.target === event.currentTarget)
                                event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" }); }, children: _jsxs("table", { children: [_jsx("caption", { children: "\u4EBA\u5DE5\u88C1\u51B3\u5386\u53F2" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u56FE\u50CF" }), _jsx("th", { children: "\u4EBA\u5DE5\u88C1\u51B3" }), _jsx("th", { children: "\u590D\u6838\u4EBA / \u65F6\u95F4" }), _jsx("th", { children: "\u590D\u6838\u8BF4\u660E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: result.items.map(record => _jsxs("tr", { "data-decision-id": record.decision_id, "data-selected": record.sample_id === selected, children: [_jsx("td", { title: record.relative_path, children: record.relative_path }), _jsx("td", { children: reviewLabel(record.decision) }), _jsxs("td", { children: [record.reviewer, _jsx("br", {}), record.submitted_at ? _jsx("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "未记录提交时间"] }), _jsx("td", { children: record.comment || "—" }), _jsx("td", { children: _jsx("button", { onClick: () => onSelect(record.sample_id), children: "\u67E5\u770B\u6837\u672C" }) })] }, record.decision_id)) })] }) }) : _jsx("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u590D\u6838\u8BB0\u5F55\u3002" }), pagination] })] });
}
