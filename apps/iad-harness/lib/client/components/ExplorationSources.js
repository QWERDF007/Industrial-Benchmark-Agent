import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request } from "../api.js";
import { SourcePicker } from "./SourcePicker.js";
export function ExplorationSources({ dataset, kind, count, images, disabled, onCount, onImages, onSelecting }) {
    const label = kind === "normal" ? "良品" : "异常";
    const [page, setPage] = useState(1), [sources, setSources] = useState(null);
    const [error, setError] = useState(""), [selecting, setSelecting] = useState(false), [search, setSearch] = useState("");
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, search });
    useEffect(() => {
        const controller = new AbortController();
        setError("");
        request(`/knowledge/sources?${query}&page=${page}&page_size=10`, undefined, undefined, controller.signal)
            .then(result => { if (!controller.signal.aborted)
            setSources(result); }).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); });
        return () => controller.abort();
    }, [dataset.dataset_id, kind, page, search]);
    async function select() {
        setSelecting(true);
        onSelecting(true);
        setError("");
        try {
            const selected = [];
            for (let next = 1; selected.length < Number(count); next++) {
                const result = await request(`/knowledge/sources?${query}&page=${next}&page_size=100`);
                selected.push(...result.items.slice(0, Number(count) - selected.length).map(item => item.sample_id));
                if (next * 100 >= result.total)
                    break;
            }
            if (selected.length !== Number(count))
                throw new Error(`可用${label}不足${count}张，请调整数量`);
            onImages(selected);
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setSelecting(false);
            onSelecting(false);
        }
    }
    return _jsxs("section", { className: "iad-info-group", children: [_jsxs("h3", { children: [label, "\u6837\u4F8B"] }), _jsxs("fieldset", { disabled: disabled || selecting, children: [_jsxs("label", { className: "iad-field iad-short-field", children: ["\u76EE\u6807\u6570\u91CF", _jsx("input", { type: "number", min: "1", "aria-label": `${label}图像数量`, value: count, onChange: e => onCount(e.target.value) })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsx(SourcePicker, { dataset: dataset, label: label, sources: sources, selected: images, target: count, disabled: disabled, choosing: selecting, canChoose: Number.isInteger(Number(count)) && Number(count) > 0, onChoose: () => void select(), page: page, onPage: setPage, onChange: onImages, search: search, onSearch: value => { setSearch(value); setPage(1); } })] })] });
}
