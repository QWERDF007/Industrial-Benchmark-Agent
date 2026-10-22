import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { initialFilters, modelLabels } from "../api.js";
import { FloatingMenu } from "./FloatingMenu.js";
export function SampleFilters({ dataset, filters, onFilters, busy = false, defaults = initialFilters }) {
    const options = {
        model_status: [["all", "全部"], ["pending", "未审计"], ["audited", "已审计"], ["risk", "可疑"], ["PASS", modelLabels.PASS], ["FAIL", modelLabels.FAIL], ["UNCERTAIN", modelLabels.UNCERTAIN]],
        review_status: [["all", "全部"], ["pending", "待复核"], ["reviewed", "已复核"], ["PASS", "良品"], ["HARD_NORMAL", "困难正常"], ["FAIL", "异常"], ["UNCERTAIN", "不确定"], ["SKIP", "已跳过"]],
        technical: [["all", "全部"], ["issues", "存在问题"]],
        reference_status: [["all", "全部"], ["candidate", "良品候选"], ["excluded", "非候选"]],
        sort_by: [["default", "默认"], ["risk", "可疑度优先"], ["tech", "技术问题优先"]],
    };
    const isFolder = dataset.format === "folder_classification";
    const rawLabelOptions = [["PASS", "OK"], ["FAIL", "NG"], ["UNCERTAIN", "未标记"]];
    const rawLabelMap = { PASS: "OK", FAIL: "NG", UNCERTAIN: "未标记" };
    const rawFilters = filters.raw_label_filters || [];
    const select = (key, label) => _jsxs("label", { className: "iad-filter", children: [label, _jsx("select", { "aria-label": label, disabled: busy, value: filters[key], onChange: e => onFilters({ ...filters, [key]: e.target.value }), children: options[key].map(([value, title]) => _jsx("option", { value: value, children: title }, value)) })] });
    const active = [
        ...rawFilters.map(value => `标签：${rawLabelMap[value] || value}`),
        ...(!isFolder ? filters.annotation_filters.map(value => value === "none" ? "无标注" : value === "present" ? "有标注" : value.slice(9)) : []),
        ...Object.entries(options).filter(([key]) => filters[key] !== defaults[key])
            .flatMap(([key, values]) => { const option = values.find(([value]) => value === filters[key]); return option ? [option[1]] : []; }),
        ...(filters.search ? [`文件名：${filters.search}`] : []),
    ];
    return _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-filters", children: [_jsxs("div", { className: "iad-filter", children: [_jsx("span", { children: "\u539F\u59CB\u6807\u7B7E" }), _jsxs(FloatingMenu, { className: "iad-multiselect", label: "\u539F\u59CB\u6807\u7B7E\u7B5B\u9009", summary: rawFilters.length ? `已选 ${rawFilters.length} 项` : "全部", children: [rawLabelOptions.map(([value, title]) => _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": `原始标签 ${title}`, disabled: busy, checked: rawFilters.includes(value), onChange: e => onFilters({ ...filters, raw_label_filters: e.target.checked ? [...rawFilters, value] : rawFilters.filter(item => item !== value) }) }), title] }, value)), _jsx("button", { disabled: busy, onClick: () => onFilters({ ...filters, raw_label_filters: [] }), children: "\u6E05\u7A7A" })] })] }), !isFolder && _jsxs("div", { className: "iad-filter", children: [_jsx("span", { children: "\u6807\u6CE8" }), _jsxs(FloatingMenu, { className: "iad-multiselect", label: "\u6807\u6CE8\u7B5B\u9009", summary: filters.annotation_filters.length ? `已选 ${filters.annotation_filters.length} 项` : "全部", children: [[["none", "无标注"], ["present", "有标注"], ...dataset.annotation_categories.map(value => [`category:${value}`, `类别 ${value}`])].map(([value, title]) => _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": title, disabled: busy, checked: filters.annotation_filters.includes(value), onChange: e => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter(item => item !== value) }) }), title] }, value)), _jsx("button", { disabled: busy, onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })] })] }), select("model_status", "模型审计"), select("review_status", "人工复核"), _jsxs("label", { className: "iad-filter iad-search", children: ["\u641C\u7D22", _jsx("input", { type: "search", "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6587\u4EF6\u540D", disabled: busy, value: filters.search, onChange: e => onFilters({ ...filters, search: e.target.value }) })] }), _jsxs(FloatingMenu, { className: "iad-multiselect", label: "\u66F4\u591A\u7B5B\u9009", summary: "\u66F4\u591A\u7B5B\u9009", children: [select("technical", "技术质量"), select("reference_status", "良品来源"), select("sort_by", "排序")] })] }), !!active.length && _jsxs("div", { className: "iad-filter-summary", children: [_jsxs("span", { children: ["\u7B5B\u9009\uFF1A", active.join(" · ")] }), _jsx("button", { disabled: busy, onClick: () => onFilters({ ...defaults }), children: "\u6E05\u9664\u7B5B\u9009" })] })] });
}
