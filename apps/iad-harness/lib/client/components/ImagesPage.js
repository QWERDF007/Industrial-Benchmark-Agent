import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from './Select.js';
import { IconButton } from "./IconButton.js";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "./Modal.js";
import { useResource } from "../useResource.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { mediaUrl, request, message } from "../api.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { FullscreenViewer } from "./FullscreenViewer.js";
import { AnnotatedImageStage } from "./AnnotatedImageStage.js";
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { ThumbnailCard } from "./ThumbnailCard.js";
import { Pagination } from "./Pagination.js";
import { ClearFilterButton } from "./CommonFilterControls.js";
export function ImagesPage({ datasets, groups, onDatasetsChanged }) {
    // 1. Group & Hierarchy
    const hierarchyGroups = useMemo(() => {
        return buildHierarchyGroups(datasets, groups);
    }, [groups, datasets]);
    const getGroupId = useCallback((d) => {
        return getDatasetGroupId(d, hierarchyGroups);
    }, [hierarchyGroups]);
    // Selected parent group
    const [selectedParentId, setSelectedParentId] = useState(() => hierarchyGroups[0]?.group_id || "");
    useEffect(() => {
        if (hierarchyGroups.length > 0 && (!selectedParentId || !hierarchyGroups.some(g => g.group_id === selectedParentId))) {
            setSelectedParentId(hierarchyGroups[0].group_id);
        }
    }, [hierarchyGroups, selectedParentId]);
    // Child datasets for current parent
    const parentChildren = useMemo(() => {
        return datasets.filter(d => getGroupId(d) === selectedParentId);
    }, [datasets, selectedParentId, getGroupId]);
    // Multi-selected child dataset IDs
    const [selectedChildIds, setSelectedChildIds] = useState(new Set());
    // When parent group changes, auto-select the first child
    useEffect(() => {
        if (parentChildren.length > 0) {
            setSelectedChildIds(new Set([parentChildren[0].dataset_id]));
        }
        else {
            setSelectedChildIds(new Set());
        }
    }, [selectedParentId, parentChildren]);
    // Filter state
    const [search, setSearch] = useState("");
    const [quality, setQuality] = useState("all");
    const [annotation, setAnnotation] = useState("all");
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 24;
    // Selected datasets objects
    const activeDatasets = useMemo(() => {
        return parentChildren.filter(d => selectedChildIds.has(d.dataset_id));
    }, [parentChildren, selectedChildIds]);
    const effectiveDatasets = useMemo(() => {
        if (activeDatasets.length > 0)
            return activeDatasets;
        return parentChildren;
    }, [activeDatasets, parentChildren]);
    const hasLabelme = useMemo(() => {
        return effectiveDatasets.some(d => d.format === "labelme");
    }, [effectiveDatasets]);
    const hasAnomaly = useMemo(() => {
        return effectiveDatasets.some(d => d.format === "folder_classification");
    }, [effectiveDatasets]);
    // Unique categories across selected datasets
    const availableCategories = useMemo(() => {
        const set = new Set();
        for (const d of effectiveDatasets) {
            for (const cat of d.annotation_categories || []) {
                if (cat)
                    set.add(cat);
            }
        }
        return Array.from(set);
    }, [effectiveDatasets]);
    // Reset unused filters when dataset format changes
    useEffect(() => {
        if (!hasAnomaly && quality !== "all") {
            setQuality("all");
        }
    }, [hasAnomaly, quality]);
    useEffect(() => {
        if (!hasLabelme) {
            if (annotation !== "all")
                setAnnotation("all");
            if (category !== "all")
                setCategory("all");
        }
    }, [hasLabelme, annotation, category]);
    // Reset filters
    const resetFilters = useCallback(() => {
        setSearch("");
        setQuality("all");
        setAnnotation("all");
        setCategory("all");
        setPage(1);
    }, []);
    // Sample listing state
    const [samples, setSamples] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [refreshRev, setRefreshRev] = useState(0);
    // Query samples
    useEffect(() => {
        if (selectedChildIds.size === 0) {
            setSamples([]);
            setTotal(0);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        params.set("dataset_ids", Array.from(selectedChildIds).join(","));
        if (hasAnomaly && quality !== "all") {
            params.set("raw_label_filters", JSON.stringify([quality]));
        }
        const annFilters = [];
        if (hasLabelme && annotation !== "all") {
            annFilters.push(annotation);
        }
        if (hasLabelme && category !== "all") {
            annFilters.push(`category:${category}`);
            const trimmed = category.replace(/^类别\s*/, "");
            if (trimmed !== category) {
                annFilters.push(`category:${trimmed}`);
            }
        }
        if (annFilters.length > 0) {
            params.set("annotation_filters", JSON.stringify(annFilters));
        }
        if (search.trim()) {
            params.set("search", search.trim());
        }
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        request(`/samples?${params.toString()}`, undefined, undefined, controller.signal)
            .then(res => {
            if (controller.signal.aborted)
                return;
            setSamples(res.items);
            setTotal(res.total);
        })
            .catch(err => {
            if (!controller.signal.aborted)
                setError(message(err));
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [selectedChildIds, quality, annotation, category, search, page, pageSize, refreshRev]);
    // Viewer State (Stage 1 & Stage 2)
    const [viewerIndex, setViewerIndex] = useState(-1);
    const [fullscreen, setFullscreen] = useState(false);
    const activeSample = viewerIndex >= 0 && viewerIndex < samples.length ? samples[viewerIndex] : null;
    const { data: sampleDetail, loading: detailLoading, error: detailError } = useResource(activeSample ? `/sample/${encodeURIComponent(activeSample.sample_id)}` : null);
    // Active dataset of current sample in viewer
    const sampleDataset = useMemo(() => {
        if (!activeSample)
            return null;
        return datasets.find(d => d.dataset_id === activeSample.dataset_id) || activeDatasets[0] || null;
    }, [activeSample, datasets, activeDatasets]);
    // Annotations list for detail modal and fullscreen
    const detailAnnotations = sampleDetail?.annotations || [];
    const bboxes = useMemo(() => {
        return detailAnnotations.filter(a => a.bbox && a.bbox.length >= 4);
    }, [detailAnnotations]);
    const imgW = sampleDetail?.sample.width || activeSample?.width || 955;
    const imgH = sampleDetail?.sample.height || activeSample?.height || 713;
    return (_jsxs("div", { className: "main", style: { minWidth: 0, width: "100%", padding: 0 }, children: [_jsx(WorkbenchHeader, { pageId: "industrial-images" }), _jsx(DatasetScopeSelector, { className: "dataset-panel", groups: hierarchyGroups, selectedGroupId: selectedParentId, onGroupChange: groupId => {
                    setSelectedParentId(groupId);
                    resetFilters();
                }, childDatasets: parentChildren, selectedChildIds: selectedChildIds, onChildToggle: cid => {
                    const next = new Set(selectedChildIds);
                    if (next.has(cid))
                        next.delete(cid);
                    else
                        next.add(cid);
                    setSelectedChildIds(next);
                    setPage(1);
                }, groupId: "parent", childId: "child", childMenuId: "child-menu", children: _jsx(IconButton, { icon: "refresh", id: "refresh", type: "button", title: "\u5237\u65B0\u56FE\u50CF", label: "\u5237\u65B0\u56FE\u50CF", onClick: () => {
                        setRefreshRev(r => r + 1);
                        onDatasetsChanged?.();
                    } }) }), _jsxs("section", { className: "filter-bar", "aria-label": "\u56FE\u50CF\u7B5B\u9009", children: [_jsxs("div", { className: "filter-item filter-search", children: [_jsx("label", { htmlFor: "search", children: "\u6587\u4EF6\u540D\u641C\u7D22" }), _jsx("input", { id: "search", type: "search", autoComplete: "off", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", value: search, onChange: e => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                } })] }), hasAnomaly && (_jsxs("div", { className: "filter-item filter-status", id: "quality-wrap", children: [_jsx("label", { htmlFor: "quality", title: "\u56FE\u50CF\u7EA7\u7C7B\u522B\uFF08OK / NG / \u672A\u5224\u5B9A\uFF09", children: hasLabelme ? "标注类别 (图像)" : "标注类别" }), _jsxs(Select, { id: "quality", value: quality, onChange: e => {
                                    setQuality(e.target.value);
                                    setPage(1);
                                }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), _jsx("option", { value: "PASS", children: "OK" }), _jsx("option", { value: "FAIL", children: "NG" }), _jsx("option", { value: "UNCERTAIN", title: "\u539F\u59CB\u89C4\u5219\u65E0\u6CD5\u5224\u5B9A\u4E3A OK \u6216 NG", children: "\u672A\u5224\u5B9A" })] })] })), hasLabelme && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "filter-item filter-ann", id: "annotation-wrap", children: [_jsx("label", { htmlFor: "annotation", children: "\u6807\u6CE8\u60C5\u51B5" }), _jsxs(Select, { id: "annotation", value: annotation, onChange: e => {
                                            setAnnotation(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), _jsx("option", { value: "present", children: "\u6709\u6807\u6CE8" }), _jsx("option", { value: "none", children: "\u65E0\u6807\u6CE8" })] })] }), _jsxs("div", { className: "filter-item filter-category", id: "category-wrap", children: [_jsx("label", { htmlFor: "category", children: hasAnomaly ? "标注类别 (目标)" : "标注类别" }), _jsxs(Select, { id: "category", value: category, onChange: e => {
                                            setCategory(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), availableCategories.map(cat => (_jsx("option", { value: cat, children: cat.startsWith("类别 ") || isNaN(Number(cat)) ? cat : `类别 ${cat}` }, cat)))] })] })] })), _jsx(ClearFilterButton, { id: "reset", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !search && quality === "all" && annotation === "all" && category === "all", onClick: resetFilters })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), total > 0 ? (_jsx("section", { id: "grid", className: "iad-thumbnail-grid", "aria-label": "\u56FE\u50CF\u7F51\u683C", children: samples.map((s, idx) => {
                    const filename = s.relative_path.split("/").pop() || s.relative_path;
                    return (_jsx(ThumbnailCard, { src: mediaUrl(s, "thumbnail"), label: filename, "data-idx": idx, "data-sample-id": s.sample_id, onClick: () => { setViewerIndex(idx); setFullscreen(false); } }, s.sample_id));
                }) })) : (_jsx("div", { id: "grid", className: "empty", "aria-label": "\u56FE\u50CF\u7F51\u683C", children: selectedChildIds.size === 0
                    ? "请选择至少一个子数据集"
                    : loading
                        ? "正在读取图像…"
                        : "没有符合筛选条件的图像" })), _jsx(Pagination, { id: "pager", total: total, page: page, size: pageSize, unit: "\u5F20\u56FE\u50CF", label: "\u56FE\u50CF", onPage: number => {
                    setPage(number);
                    document.getElementById("grid")?.scrollIntoView({ block: "start", behavior: "smooth" });
                } }), activeSample && _jsx(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", id: "overlay", className: "detail-dialog", onClose: () => { setViewerIndex(-1); setFullscreen(false); }, children: _jsxs("div", { className: "detail-scroll", "aria-busy": detailLoading, children: [detailError && _jsx("p", { role: "alert", className: "iad-error", children: detailError }), activeSample && (_jsxs(_Fragment, { children: [_jsxs("button", { id: "detail-preview", type: "button", className: "detail-preview", "aria-label": "\u6253\u5F00\u5927\u56FE\u68C0\u89C6\u5668", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE\u4E0E\u6807\u6CE8", onClick: () => setFullscreen(true), children: [_jsx(AnnotatedImageStage, { src: mediaUrl(activeSample, "image"), alt: activeSample.relative_path.split("/").pop(), width: imgW, height: imgH, bboxes: bboxes }), _jsx("span", { className: "detail-preview-hint", children: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE" })] }), _jsxs("section", { className: "detail-content", children: [_jsx("h3", { className: "detail-section-heading", children: "\u56FE\u50CF\u4FE1\u606F" }), _jsxs("dl", { className: "detail-meta", id: "detail-fields", children: [_jsx("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }), _jsx("dd", { className: "path-value", children: sampleDetail?.sample.image_path || activeSample.relative_path }), _jsx("dt", { children: "\u56FE\u50CF\u540D" }), _jsx("dd", { children: activeSample.relative_path.split("/").pop() }), _jsx("dt", { children: "UUID" }), _jsx("dd", { children: activeSample.sample_uuid }), _jsx("dt", { children: "\u5206\u8FA8\u7387" }), _jsx("dd", { children: `${sampleDetail?.sample.width || activeSample.width} × ${sampleDetail?.sample.height || activeSample.height}` })] })] }), _jsxs("section", { className: "detail-part", id: "detail-ann-section", children: [_jsxs("div", { className: "detail-annotation-heading", children: [_jsx("h3", { className: "detail-section-heading", id: "detail-ann-title", children: "\u6807\u6CE8\u4FE1\u606F" }), _jsx("span", { className: "detail-ann-summary", id: "detail-ann-count", children: sampleDataset?.format === "folder_classification"
                                                        ? "共 1 个标注"
                                                        : `共 ${detailAnnotations.length} 个标注` })] }), _jsx("div", { id: "detail-ann-content", children: detailLoading ? _jsx("p", { children: "\u6B63\u5728\u8BFB\u53D6\u6807\u6CE8\u2026" }) : detailError ? null : sampleDataset?.format === "folder_classification" ? (_jsxs("table", { className: "detail-ann-table", "aria-label": "\u5F02\u5E38\u68C0\u6D4B\u6807\u6CE8\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "\u6807\u6CE8\u7C7B\u522B" }), _jsx("th", { children: "\u7C7B\u578B" })] }) }), _jsx("tbody", { children: _jsxs("tr", { children: [_jsx("td", { children: "1" }), _jsx("td", { children: activeSample.quality_status === "FAIL" ? "NG" : "OK" }), _jsx("td", { children: "\u5F02\u5E38\u68C0\u6D4B" })] }) })] })) : detailAnnotations.length > 0 ? (_jsxs("table", { className: "detail-ann-table", "aria-label": "Labelme \u6807\u6CE8\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "\u6807\u6CE8\u7C7B\u522B" }), _jsx("th", { children: "\u7C7B\u578B" }), _jsx("th", { children: "\u6570\u636E" })] }) }), _jsx("tbody", { children: detailAnnotations.map((a, k) => (_jsxs("tr", { children: [_jsx("td", { children: k + 1 }), _jsx("td", { children: a.raw_label }), _jsx("td", { children: a.annotation_type || "bbox" }), _jsx("td", { className: "ann-value", children: a.bbox ? a.bbox.map(v => Number(v).toFixed(0)).join(", ") : "-" })] }, a.annotation_id || k))) })] })) : (_jsx("p", { className: "detail-fallback", children: "\u65E0\u6807\u6CE8" })) })] }), _jsxs("section", { className: "detail-model-section", "aria-labelledby": "detail-model-title", children: [_jsx("h3", { className: "detail-section-heading", id: "detail-model-title", children: "\u6A21\u578B\u89C2\u5BDF" }), _jsx("div", { id: "detail-model-content", children: detailLoading ? _jsx("p", { children: "\u6B63\u5728\u8BFB\u53D6\u89C2\u5BDF\u2026" }) : detailError ? null : sampleDetail?.suggestion ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "detail-model-result", children: [_jsx("strong", { children: sampleDetail.suggestion.suggested_label === "FAIL"
                                                                    ? "发现疑点"
                                                                    : sampleDetail.suggestion.suggested_label === "PASS"
                                                                        ? "判定正常"
                                                                        : "未判定" }), sampleDetail.suggestion.reason_category ? `（${sampleDetail.suggestion.reason_category}）` : ""] }), _jsx("p", { className: "detail-model-text", children: sampleDetail.suggestion.notes || "无附注。" })] })) : (_jsx("p", { className: "detail-model-text", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })) })] })] }))] }) }), _jsx(FullscreenViewer, { open: fullscreen, item: activeSample
                    ? {
                        id: activeSample.sample_id, sampleId: activeSample.sample_id,
                        annotationLayer: { kind: 'sample', sample: sampleDetail?.sample || activeSample, annotations: sampleDetail?.annotations || [] },
                        title: activeSample.relative_path,
                        imageUrl: mediaUrl(activeSample, "image"),
                        width: activeSample.width,
                        height: activeSample.height,
                        bboxes,
                    }
                    : null, items: samples.map(s => ({
                    id: s.sample_id, sampleId: s.sample_id,
                    title: s.relative_path,
                    imageUrl: mediaUrl(s, "image"),
                    width: s.width,
                    height: s.height,
                })), currentIndex: viewerIndex, onClose: () => setFullscreen(false), onNavigate: setViewerIndex })] }));
}
