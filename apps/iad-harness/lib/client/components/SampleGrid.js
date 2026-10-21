import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { initialFilters, message, modelLabels, request, sampleQuery } from "../api.js";
import { Pagination } from "./Pagination.js";
import { FloatingMenu } from "./FloatingMenu.js";
import { SampleCard } from "./SampleCard.js";
export function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading, sourceManagement }) {
    const scope = sampleQuery(dataset.dataset_id, filters, page, 200);
    const [selection, setSelection] = useState({ scope: "", ids: [] });
    const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
    const chosen = selection.scope === scope ? selection.ids : [];
    const managing = sourceManagement?.active;
    const options = {
        model_status: [["all", "全部"], ["pending", "未审计"], ["audited", "已审计"], ["risk", "可疑"], ["PASS", modelLabels.PASS], ["FAIL", modelLabels.FAIL], ["UNCERTAIN", modelLabels.UNCERTAIN]],
        review_status: [["all", "全部"], ["pending", "待复核"], ["reviewed", "已复核"], ["PASS", "良品"], ["HARD_NORMAL", "困难正常"], ["FAIL", "异常"], ["UNCERTAIN", "不确定"], ["SKIP", "已跳过"]],
        technical: [["all", "全部"], ["issues", "存在问题"]],
        reference_status: [["all", "全部"], ["candidate", "良品候选"], ["excluded", "非候选"]],
        sort_by: [["default", "默认"], ["risk", "可疑度优先"], ["tech", "技术问题优先"]],
    };
    const select = (key, label) => _jsxs("label", { className: "iad-filter", children: [label, _jsx("select", { "aria-label": label, disabled: busy, value: filters[key], onChange: e => onFilters({ ...filters, [key]: e.target.value }), children: options[key].map(([value, title]) => _jsx("option", { value: value, children: title }, value)) })] });
    const active = [
        ...filters.annotation_filters.map(value => value === "none" ? "无标注" : value === "present" ? "有标注" : value.slice(9)),
        ...Object.entries(options).filter(([key]) => filters[key] !== initialFilters[key])
            .flatMap(([key, values]) => { const option = values.find(([value]) => value === filters[key]); return option ? [option[1]] : []; }),
        ...(filters.search ? [`文件名：${filters.search}`] : []),
    ];
    async function selectAll() {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            const ids = [];
            for (let next = 1;; next++) {
                const result = await request(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id, filters, next, 200)}`);
                ids.push(...result.items.map(item => item.sample_id));
                if (ids.length >= result.total)
                    break;
                if (!result.items.length)
                    throw new Error("筛选范围已变化，请重新选择");
            }
            setSelection({ scope, ids });
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function save(include) {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            if (include === undefined)
                await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { reset_references: true }, "PATCH");
            else {
                const ids = new Set(dataset.reference_sample_ids);
                for (const id of chosen) {
                    if (include)
                        ids.add(id);
                    else
                        ids.delete(id);
                }
                await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { reference_sample_ids: [...ids] }, "PATCH");
            }
            setNotice(include === undefined ? "已恢复自动来源" : `已${include ? "加入" : "移出"} ${chosen.length} 张图像`);
            setSelection({ scope, ids: [] });
            sourceManagement?.onChanged();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    const pagination = _jsx(Pagination, { total: total, page: page, unit: "\u5F20", onPage: onPage });
    return _jsxs("section", { className: "iad-gallery", "aria-label": "\u56FE\u50CF\u5217\u8868", children: [_jsxs("div", { className: "iad-filters", children: [_jsxs("div", { className: "iad-filter", children: [_jsx("span", { children: "\u6807\u6CE8" }), _jsxs(FloatingMenu, { className: "iad-multiselect", label: "\u6807\u6CE8\u7B5B\u9009", summary: filters.annotation_filters.length ? `已选 ${filters.annotation_filters.length} 项` : "全部", children: [[["none", "无标注"], ["present", "有标注"], ...dataset.annotation_categories.map(value => [`category:${value}`, `类别 ${value}`])].map(([value, title]) => _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": title, disabled: busy, checked: filters.annotation_filters.includes(value), onChange: e => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter(item => item !== value) }) }), title] }, value)), _jsx("button", { disabled: busy, onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })] })] }), select("model_status", "模型审计"), select("review_status", "人工复核"), _jsxs("label", { className: "iad-filter iad-search", children: ["\u641C\u7D22", _jsx("input", { type: "search", "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6587\u4EF6\u540D", disabled: busy, value: filters.search, onChange: e => onFilters({ ...filters, search: e.target.value }) })] }), _jsxs(FloatingMenu, { className: "iad-multiselect", label: "\u66F4\u591A\u7B5B\u9009", summary: "\u66F4\u591A\u7B5B\u9009", children: [select("technical", "技术质量"), select("reference_status", "良品来源"), select("sort_by", "排序")] })] }), !!active.length && _jsxs("div", { className: "iad-filter-summary", children: [_jsxs("span", { children: ["\u7B5B\u9009\uFF1A", active.join(" · ")] }), _jsx("button", { disabled: busy, onClick: () => onFilters({ ...initialFilters }), children: "\u6E05\u9664\u7B5B\u9009" })] }), managing && _jsxs("section", { className: "iad-source-controls", "aria-label": "\u826F\u54C1\u6765\u6E90\u7BA1\u7406", "aria-busy": busy, children: [_jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: busy, onClick: () => sourceManagement?.onToggle(), children: "\u5B8C\u6210\u6765\u6E90\u7BA1\u7406" }), _jsxs("strong", { "aria-label": "\u826F\u54C1\u6765\u6E90\u6458\u8981", children: [dataset.reference_mode === "automatic" ? "自动来源" : "人工选定", " \u00B7 ", dataset.reference_sample_ids.length, " \u5F20"] }), _jsx("span", { className: "iad-muted", children: "\u5019\u9009\u6765\u6E90\uFF0C\u975E\u4EBA\u5DE5\u88C1\u51B3" }), _jsx("button", { disabled: busy || dataset.reference_mode === "automatic", onClick: () => void save(), children: "\u6062\u590D\u81EA\u52A8\u6765\u6E90" })] }), _jsxs("div", { className: "iad-row", children: [_jsx("button", { disabled: busy || loading, onClick: () => setSelection({ scope, ids: items.map(item => item.sample_id) }), children: "\u9009\u62E9\u5F53\u524D\u9875" }), _jsx("button", { disabled: busy || loading || !total, onClick: () => void selectAll(), children: "\u9009\u62E9\u7B5B\u9009\u5168\u90E8" }), _jsxs("span", { children: ["\u5DF2\u9009 ", chosen.length, " \u5F20"] }), _jsx("button", { disabled: busy || !chosen.length, onClick: () => setSelection({ scope, ids: [] }), children: "\u53D6\u6D88\u9009\u62E9" }), _jsx("button", { className: "iad-primary", disabled: busy || !chosen.length, onClick: () => void save(true), children: "\u52A0\u5165\u826F\u54C1\u6765\u6E90" }), _jsx("button", { disabled: busy || !chosen.length, onClick: () => void save(false), children: "\u79FB\u51FA\u826F\u54C1\u6765\u6E90" })] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), notice && _jsx("p", { role: "status", children: notice }), pagination, loading ? _jsx("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : _jsx("div", { className: "iad-grid", children: items.map(sample => _jsx(SampleCard, { sample: sample, selected: selected === sample.sample_id, onSelect: () => onSelect(sample.sample_id), reference: !!managing && dataset.reference_sample_ids.includes(sample.sample_id), selection: managing ? { checked: chosen.includes(sample.sample_id), disabled: busy, onChange: checked => setSelection({ scope, ids: checked ? [...chosen, sample.sample_id] : chosen.filter(id => id !== sample.sample_id) }) } : undefined }, sample.sample_id)) }), !loading && !items.length && _jsx("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6837\u672C\u3002" }), pagination] });
}
