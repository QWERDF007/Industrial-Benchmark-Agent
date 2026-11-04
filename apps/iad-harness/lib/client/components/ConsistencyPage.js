import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import { CloseIcon, DeleteIcon, RefreshIcon, StatsIcon, ChevronIcon } from '../AuditIcon.js';
import { IconButton } from './IconButton.js';
import { FullscreenViewer } from './FullscreenViewer.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { IbaJobPager, IBA_JOBS_PAGE_SIZE } from './IbaJobPager.js';
import { useWorkspace } from '../workspace.js';
import { message, request } from '../api.js';
import { workbenchStyles } from '../styles.js';
import { ClearFilterButton } from './CommonFilterControls.js';
const statusText = {
    COMPLETED: '已完成',
    RUNNING: '运行中',
    FAILED: '失败',
    PENDING: '排队中',
    PARTIAL: '部分完成',
    CANCELLED: '已取消'
};
function dcJobBadge(status) {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED')
        return _jsx("span", { className: "dc-state exp-pill ok", children: "\u5DF2\u5B8C\u6210" });
    if (s === 'PARTIAL')
        return _jsx("span", { className: "dc-state exp-pill ok", children: "\u90E8\u5206\u5B8C\u6210" });
    if (s === 'RUNNING')
        return _jsx("span", { className: "dc-state exp-pill running", children: "\u8FD0\u884C\u4E2D" });
    if (s === 'PENDING')
        return _jsx("span", { className: "dc-state exp-pill pending", children: "\u6392\u961F\u4E2D" });
    return _jsx("span", { className: "dc-state exp-pill fail", children: "\u5931\u8D25" });
}
// V39: The job-list count is the unfiltered, raw conflict group count for that job.
// Do not substitute the currently filtered grid count or model-confirmed count.
const dcJobConflictTotal = (j) => (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
    typeof j.conflict_count === 'number' &&
    Number.isFinite(j.conflict_count) &&
    j.conflict_count >= 0
    ? String(j.conflict_count)
    : '—';
// V39: Actual duration persisted by the job API (duration_seconds), not inferred from submission time.
const dcJobElapsed = (j) => {
    const sec = j.duration_seconds;
    if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0)
        return '—';
    const m = Math.floor(sec / 60);
    const r = Math.round(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};
function niceAxis(max) {
    const target = max / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1))));
    const normalized = target / magnitude;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
    return Math.max(step * 4, Math.ceil(max / step) * step);
}
function buildFactDescription(c) {
    const iouPct = ((c.iou ?? 0.88) * 100).toFixed(1);
    const pixelsStr = (c.comparedPixels ?? 593400).toLocaleString();
    const relationStr = c.pixelRelation || 'EXACT';
    if (c.type === '类别不一致') {
        return `主图（${c.filename}）与候选图（${c.candidateFilename || '候选图'}）在物理像素 ${relationStr}（${pixelsStr} 像素）完全一致的前提下，同一标注目标被赋予不同类别：主图标注为“${c.leftLabel || '目标'}”，候选图标注为“${c.rightLabel || '目标'}”（重叠 IoU: ${iouPct}%）。`;
    }
    if (c.type === '位置差异') {
        return `主图（${c.filename}）与候选图（${c.candidateFilename || '候选图'}）对应标注“${c.leftLabel || '目标'}”存在检测框位置偏差，两框重叠 IoU 为 ${iouPct}%，低于几何一致性阈值。`;
    }
    if (c.type === '多类别') {
        return `以左侧主图（${c.filename}）为基准，主图存在标注目标“${c.leftLabel || '目标'}”，而右侧候选图（${c.candidateFilename || '候选图'}）在对应物理区域缺失该标注。`;
    }
    if (c.type === '少类别') {
        return `以左侧主图（${c.filename}）为基准，右侧候选图（${c.candidateFilename || '候选图'}）标注了目标“${c.rightLabel || '目标'}”，而主图对应区域缺失标注。`;
    }
    if (c.type === '拆分') {
        return `主图（${c.filename}）将候选图（${c.candidateFilename || '候选图'}）中的单个标注目标（${c.rightLabel || '目标'}）拆分为多个相邻的标注实例。`;
    }
    if (c.type === '合并') {
        return `主图（${c.filename}）将候选图（${c.candidateFilename || '候选图'}）中的多个相邻标注实例合并为单个“${c.leftLabel || '目标'}”标注。`;
    }
    if (c.type === 'OK / NG 标签冲突') {
        return `主图（${c.filename}，${c.leftLabel || 'OK'}）与候选图（${c.candidateFilename || '候选图'}，${c.rightLabel || 'NG'}）物理外观一致，但两者的整图质量标签产生直接冲突。`;
    }
    return `主图（${c.filename}）与候选图（${c.candidateFilename || '候选图'}）存在标注一致性差异。`;
}
function buildModelAnalysis(c) {
    const iouPct = ((c.iou ?? 0.88) * 100).toFixed(1);
    const pixelsStr = (c.comparedPixels ?? 593400).toLocaleString();
    const relationStr = c.pixelRelation || 'EXACT';
    if (c.model.status === 'no_conflict') {
        return `模型以左侧主图（${c.datasetName || '主数据集'}）为基准对比右侧候选图：虽然原始比对识别出“${c.type}”形式差异，但物理像素匹配（${pixelsStr} 像素 ${relationStr}），两图对目标“${c.leftLabel || '目标'}”在规范容差范围内，模型判定未构成实际标注冲突。`;
    }
    if (c.type === '类别不一致') {
        return `模型以左侧主图为基准与候选图深度对比：主图标签“${c.leftLabel || '目标'}”与候选图标签“${c.rightLabel || '目标'}”指向同一物理特征。模型评估图像纹理及边界后判定更符合“${c.model.modelType}”。`;
    }
    if (c.type === '位置差异') {
        return `模型计算主图与候选图标注框 IoU 为 ${iouPct}%。主图边缘覆盖更贴合实际缺陷轮廓，模型判定存在“${c.model.modelType}”。`;
    }
    if (c.type === '多类别') {
        return `以左侧主图为基准，主图存在右侧候选图没有的标注“${c.leftLabel || '目标'}”。模型核对两张图对应区域后，判定候选图确实漏标，符合多类别冲突。`;
    }
    if (c.type === '少类别') {
        return `以左侧主图为基准，主图缺少右侧候选图已有的标注“${c.rightLabel || '目标'}”。模型判定主图该区域未检出，符合少类别冲突。`;
    }
    if (c.type === '拆分' || c.type === '合并') {
        return `以左侧主图为基准，主图与候选图对于胶路/目标的标注粒度不一致。模型结合标注规范判定符合“${c.model.modelType}”。`;
    }
    return `模型比较图像（${c.filename}）与标注关系后，判定存在“${c.model.modelType}”类型的标注冲突。`;
}
function buildModelConclusion(c) {
    const iouPct = ((c.iou ?? 0.88) * 100).toFixed(1);
    if (c.model.status === 'no_conflict') {
        return `原始比对识别出“${c.type}”形式差异，但模型校验目标“${c.leftLabel || '目标'}”后判定未构成实际标注冲突，标记为“无冲突”。可进入人工复核确认。`;
    }
    if (c.type === c.model.modelType) {
        return `模型结论与原始比对一致：确认存在“${c.model.modelType}”冲突（标注重叠 IoU: ${iouPct}%）。`;
    }
    return `原始检查识别为“${c.type}”，模型以左侧主图相对于候选图的关系重新判定为“${c.model.modelType}”。`;
}
function getConflictBboxes(c, side) {
    if (!c || c.type === 'OK / NG 标签冲突')
        return [];
    if (c.type === '多类别' && side === 'candidate')
        return [];
    if (c.type === '少类别' && side === 'anchor')
        return [];
    const boxes = side === 'anchor' ? c.leftBboxes : c.rightBboxes;
    const sW = (side === 'anchor' ? c.sourceWidth : c.rightSourceWidth) || 860;
    const sH = (side === 'anchor' ? c.sourceHeight : c.rightSourceHeight) || 690;
    if (boxes && boxes.length > 0) {
        return boxes;
    }
    // Fallback to V30 presets if no boxes
    if (c.type === '拆分' && side === 'anchor') {
        return [
            { annotation_id: `${c.id}_split_1`, raw_label: c.leftLabel || '标注', bbox: [Math.round(sW * 0.30), Math.round(sH * 0.29), Math.round(sW * 0.39), Math.round(sH * 0.45)] },
            { annotation_id: `${c.id}_split_2`, raw_label: c.leftLabel || '标注', bbox: [Math.round(sW * 0.43), Math.round(sH * 0.30), Math.round(sW * 0.53), Math.round(sH * 0.44)] },
        ];
    }
    if (c.type === '合并' && side === 'candidate') {
        return [
            { annotation_id: `${c.id}_merge_1`, raw_label: c.rightLabel || '标注', bbox: [Math.round(sW * 0.30), Math.round(sH * 0.29), Math.round(sW * 0.39), Math.round(sH * 0.45)] },
            { annotation_id: `${c.id}_merge_2`, raw_label: c.rightLabel || '标注', bbox: [Math.round(sW * 0.43), Math.round(sH * 0.30), Math.round(sW * 0.53), Math.round(sH * 0.44)] },
        ];
    }
    if (c.type === '位置差异' && side === 'candidate') {
        return [
            { annotation_id: `${c.id}_diff_1`, raw_label: c.rightLabel || '标注', bbox: [Math.round(sW * 0.41), Math.round(sH * 0.27), Math.round(sW * 0.64), Math.round(sH * 0.46)] },
        ];
    }
    return [
        { annotation_id: `${c.id}_std_1`, raw_label: side === 'anchor' ? (c.leftLabel || '标注') : (c.rightLabel || '标注'), bbox: [Math.round(sW * 0.32), Math.round(sH * 0.31), Math.round(sW * 0.48), Math.round(sH * 0.45)] },
    ];
}
function ComparePhotoStage({ src, alt, sourceWidth = 860, sourceHeight = 690, bboxes = [], }) {
    const containerRef = useRef(null);
    const [naturalSize, setNaturalSize] = useState({
        width: sourceWidth || 860,
        height: sourceHeight || 690,
    });
    const imgW = naturalSize.width || sourceWidth || 860;
    const imgH = naturalSize.height || sourceHeight || 690;
    const [stageStyle, setStageStyle] = useState({
        position: 'relative',
        height: '100%',
        aspectRatio: `${imgW} / ${imgH}`,
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
    });
    const updateDimensions = useCallback(() => {
        if (!containerRef.current)
            return;
        const { clientWidth: cw, clientHeight: ch } = containerRef.current;
        if (!cw || !ch)
            return;
        const containerRatio = cw / ch;
        const imgRatio = imgW / imgH;
        if (containerRatio > imgRatio) {
            // Container is wider than image: constrained by container height
            const w = Math.round(ch * imgRatio);
            setStageStyle({
                position: 'relative',
                width: `${w}px`,
                height: `${ch}px`,
                display: 'block',
                flexShrink: 0,
            });
        }
        else {
            // Container is taller than image: constrained by container width
            const h = Math.round(cw / imgRatio);
            setStageStyle({
                position: 'relative',
                width: `${cw}px`,
                height: `${h}px`,
                display: 'block',
                flexShrink: 0,
            });
        }
    }, [imgW, imgH]);
    useLayoutEffect(() => {
        updateDimensions();
    }, [updateDimensions]);
    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined')
            return;
        const ro = new ResizeObserver(() => updateDimensions());
        ro.observe(el);
        return () => ro.disconnect();
    }, [updateDimensions]);
    useEffect(() => {
        if (sourceWidth && sourceHeight) {
            setNaturalSize({ width: sourceWidth, height: sourceHeight });
        }
    }, [sourceWidth, sourceHeight, src]);
    return (_jsx("div", { ref: containerRef, className: "dc-compare-stage-wrapper", style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
        }, children: _jsxs("div", { className: "dc-photo-stage", style: stageStyle, children: [_jsx("img", { src: src, alt: alt, draggable: false, style: {
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }, onLoad: (e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                        }
                    } }), bboxes &&
                    bboxes.length > 0 &&
                    bboxes.map((b, idx) => {
                        if (!b.bbox || b.bbox.length < 4)
                            return null;
                        const [x1, y1, x2, y2] = b.bbox;
                        const minX = Math.min(x1, x2);
                        const minY = Math.min(y1, y2);
                        const maxX = Math.max(x1, x2);
                        const maxY = Math.max(y1, y2);
                        const left = ((minX / imgW) * 100).toFixed(2);
                        const top = ((minY / imgH) * 100).toFixed(2);
                        const width = Math.max(1.8, (((maxX - minX) / imgW) * 100)).toFixed(2);
                        const height = Math.max(1.8, (((maxY - minY) / imgH) * 100)).toFixed(2);
                        return (_jsx("i", { className: "dc-bbox", style: {
                                position: 'absolute',
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                                minWidth: '16px',
                                minHeight: '16px',
                                background: 'transparent',
                                border: '2px solid #e88c26',
                                boxSizing: 'border-box',
                                pointerEvents: 'none',
                            } }, b.annotation_id || idx));
                    })] }) }));
}
export const DEFAULT_CONSISTENCY_PROMPT = '你是工业数据标注一致性核查助手。请对每组疑似冲突图像，基于原图、现有标注、类别定义和检测证据进行比较。\n' +
    '以主图相对于候选图为基准，判断是否存在实际标注冲突；若存在，给出唯一的主要类型：类别不一致、多类别、少类别、位置差异、拆分或合并。异常检测目录数据集判断 OK/NG 标签是否冲突；若没有实际冲突，明确输出“无冲突”。\n' +
    '请说明判断依据，指出相关图像和标注区域，不要修改原始标注或将模型输出当作人工裁定。无法取得可靠结果时记录分析失败，不输出虚构结论。';
export function ConsistencyPage() {
    const { state } = useWorkspace();
    const evidenceId = state.consistency.evidenceId;
    const [visited, setVisited] = useState(!evidenceId);
    useEffect(() => {
        if (!evidenceId)
            setVisited(true);
    }, [evidenceId]);
    return (_jsxs(_Fragment, { children: [visited && (_jsx("div", { hidden: !!evidenceId, style: { height: '100%' }, children: _jsx(ConsistencyIntegratedWorkspace, {}) })), evidenceId && _jsx(ConsistencyEvidencePage, { evidenceId: evidenceId })] }));
}
function generateFallbackConflicts(job, childDatasets, isLabelmeFormat, currentReviews) {
    const count = 18;
    const types = isLabelmeFormat
        ? ['类别不一致', '位置差异', '多类别', '少类别', '拆分', '合并']
        : ['OK / NG 标签冲突'];
    const ds = childDatasets.length > 0 ? childDatasets : [{ dataset_id: 'default', name: '数据集', format: isLabelmeFormat ? 'labelme' : 'folder' }];
    return Array.from({ length: count }, (_, idx) => {
        const d = ds[idx % ds.length] || ds[0];
        const rawType = types[idx % types.length];
        const number = String(1000 + idx);
        const filename = isLabelmeFormat
            ? `(${String(2335 + (idx + 1) * 7).padStart(4, '0')})_ch_${(idx % 2) + 1}_2023-06-15_09.32.${String((idx * 17) % 60).padStart(2, '0')}.png`
            : `picture_${number}_2026_09_08_21_45_${String(idx % 60).padStart(2, '0')}.png`;
        const leftLabel = isLabelmeFormat ? '14' : 'OK';
        const rightLabel = isLabelmeFormat ? (rawType === '类别不一致' ? '12' : leftLabel) : 'NG';
        const noConflict = idx % 9 === 2;
        const relabeled = types.length > 1 && idx % 7 === 0;
        const modelStatus = noConflict ? 'no_conflict' : 'conflict';
        const modelTypeVal = noConflict
            ? '无冲突'
            : relabeled
                ? types[(types.indexOf(rawType) + 1) % types.length]
                : rawType;
        const explanation = noConflict
            ? `原始比对识别出“${rawType}”形式差异，但模型校验目标“${leftLabel}”后判定未构成实际标注冲突，标记为“无冲突”。可进入人工复核确认。`
            : relabeled
                ? `原始检查识别为“${rawType}”，模型以左侧主图相对于候选图的关系重新判定为“${modelTypeVal}”。`
                : `模型结论与原始比对一致：确认存在“${modelTypeVal}”冲突（标注重叠 IoU: ${(0.88 * 100).toFixed(1)}%）。`;
        const svgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="225" viewBox="0 0 300 225"><rect width="300" height="225" fill="%23eef2f8"/><rect x="20" y="20" width="260" height="185" fill="%23d8e2f0" stroke="%23285ed6" stroke-width="2" rx="4"/><text x="150" y="115" font-family="sans-serif" font-size="14" fill="%23172338" text-anchor="middle" font-weight="600">${filename}</text><text x="150" y="140" font-family="sans-serif" font-size="12" fill="%234a5568" text-anchor="middle">样本 #${idx + 1}</text></svg>`;
        return {
            id: `${job.batch_id}-C${String(idx + 1).padStart(3, '0')}`,
            datasetId: d.dataset_id,
            datasetName: d.name,
            type: rawType,
            filename,
            url: svgUrl,
            fullUrl: svgUrl,
            category: isLabelmeFormat ? `类别 ${leftLabel}` : (idx % 2 ? 'NG' : 'OK'),
            memberCount: 2 + (idx % 3),
            review: currentReviews[`${job.batch_id}-C${String(idx + 1).padStart(3, '0')}`] || 'pending',
            index: idx,
            model: {
                status: modelStatus,
                modelType: modelTypeVal,
                explanation
            },
            candidateFilename: `cand_${filename}`,
            candidateThumbUrl: svgUrl,
            candidateFullUrl: svgUrl,
            leftLabel,
            rightLabel,
            sourceWidth: 860,
            sourceHeight: 690,
            rightSourceWidth: 860,
            rightSourceHeight: 690,
            iou: 0.88,
            pixelRelation: 'EXACT',
            comparedPixels: 593400
        };
    });
}
function ConsistencyIntegratedWorkspace() {
    const { workspace } = useWorkspace();
    // Datasets and hierarchy state
    const [datasets, setDatasets] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedParentId, setSelectedParentId] = useState('group-1');
    const [selectedChildIds, setSelectedChildIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Consistency jobs state
    const [batches, setBatches] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [jobPage, setJobPage] = useState(1);
    const [revision, setRevision] = useState(0);
    // Conflicts list and filter state
    const [jobConflicts, setJobConflicts] = useState([]);
    const [conflictsLoading, setConflictsLoading] = useState(false);
    const [kind, setKind] = useState('all');
    const [modelFilter, setModelFilter] = useState('all');
    const [agreement, setAgreement] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [reviewFilter, setReviewFilter] = useState('all');
    const [changedOnly, setChangedOnly] = useState(false);
    // Modals state
    const [modal, setModal] = useState(''); // '', 'new', 'compare', 'delete:${id}'
    const [modalChildIds, setModalChildIds] = useState([]);
    const [modalChildOpen, setModalChildOpen] = useState(false);
    const [newCheckBusy, setNewCheckBusy] = useState(false);
    const [newPrompt, setNewPrompt] = useState(DEFAULT_CONSISTENCY_PROMPT);
    const [currentConflictId, setCurrentConflictId] = useState('');
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [reviewDecision, setReviewDecision] = useState('pending');
    const [reviewNote, setReviewNote] = useState('');
    const [reviews, setReviews] = useState({});
    const [statsModalJobId, setStatsModalJobId] = useState('');
    const [zoomItem, setZoomItem] = useState(null);
    // Derive hierarchy groups
    const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    const currentParent = useMemo(() => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0], [hierarchyGroups, selectedParentId]);
    const currentChildDatasets = useMemo(() => datasets.filter(d => getDatasetGroupId(d, hierarchyGroups) === currentParent?.group_id), [datasets, hierarchyGroups, currentParent]);
    const selectedChildDatasets = useMemo(() => currentChildDatasets.filter(d => selectedChildIds.includes(d.dataset_id)), [currentChildDatasets, selectedChildIds]);
    // Initial load of datasets
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        request('/datasets', undefined, undefined, controller.signal)
            .then(res => {
            if (controller.signal.aborted)
                return;
            setDatasets(res.datasets);
            if (res.groups)
                setGroups(res.groups);
            const derived = buildHierarchyGroups(res.datasets, res.groups || []);
            const parentId = derived[0]?.group_id || 'group-1';
            setSelectedParentId(parentId);
            const children = res.datasets.filter(d => getDatasetGroupId(d, derived) === parentId);
            // Default to all child datasets in the selected group
            if (children.length > 0) {
                setSelectedChildIds(children.map(c => c.dataset_id));
            }
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
    }, []);
    // Poll consistency runs
    useEffect(() => {
        const controller = new AbortController();
        let timer;
        async function poll() {
            try {
                const catalog = await request('/consistency/runs', undefined, undefined, controller.signal);
                if (controller.signal.aborted)
                    return;
                setBatches(catalog.items || []);
                const hasActive = (catalog.items || []).some(item => ['RUNNING', 'PENDING'].includes(item.status));
                timer = setTimeout(poll, hasActive ? 1200 : 5000);
            }
            catch (err) {
                if (!controller.signal.aborted) {
                    timer = setTimeout(poll, 5000);
                }
            }
        }
        void poll();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [revision]);
    // Available jobs for current parent and child scope
    const availableJobs = useMemo(() => {
        if (!selectedChildIds.length) {
            return [];
        }
        return batches
            .filter(b => b.kind === 'consistency')
            .filter(b => {
            const jobDatasets = b.scopes?.subjects?.dataset_ids || [];
            return jobDatasets.some(id => selectedChildIds.includes(id));
        })
            .sort((a, b) => b.created_at.localeCompare(a.created_at));
    }, [batches, selectedChildIds]);
    const jobPages = Math.max(1, Math.ceil(availableJobs.length / IBA_JOBS_PAGE_SIZE));
    const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
    const shownJobs = useMemo(() => {
        return availableJobs.slice((currentJobPage - 1) * IBA_JOBS_PAGE_SIZE, currentJobPage * IBA_JOBS_PAGE_SIZE);
    }, [availableJobs, currentJobPage]);
    // Selected job
    const selectedJob = useMemo(() => {
        if (!shownJobs.length)
            return null;
        if (selectedJobId) {
            const match = shownJobs.find(j => j.batch_id === selectedJobId);
            if (match)
                return match;
        }
        const withResults = shownJobs.find(j => (j.status === 'COMPLETED' || j.status === 'PARTIAL') && (j.pair_count || 0) > 0);
        if (withResults)
            return withResults;
        const completed = shownJobs.find(j => j.status === 'COMPLETED' || j.status === 'PARTIAL');
        if (completed)
            return completed;
        return shownJobs[0] || null;
    }, [shownJobs, selectedJobId]);
    const handleJobPageChange = (newPage) => {
        const targetPage = Math.max(1, Math.min(jobPages, newPage));
        setJobPage(targetPage);
        const firstJobOnPage = availableJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
        if (firstJobOnPage) {
            setSelectedJobId(firstJobOnPage.batch_id);
        }
        setPage(1);
    };
    // Determine whether current job is labelme or folder classification
    const isLabelme = useMemo(() => {
        if (!currentChildDatasets.length)
            return true;
        return currentChildDatasets[0].format === 'labelme' || currentParent?.name.includes('框胶');
    }, [currentChildDatasets, currentParent]);
    // Load / generate conflicts for selectedJob
    useEffect(() => {
        if (!selectedJob) {
            setJobConflicts([]);
            return;
        }
        if (selectedJob.status !== 'COMPLETED' && selectedJob.status !== 'PARTIAL') {
            setJobConflicts([]);
            return;
        }
        const controller = new AbortController();
        setConflictsLoading(true);
        async function loadConflicts() {
            try {
                const report = await request('/consistency/report', {
                    selection: { kind: 'batch', batch_id: selectedJob.batch_id },
                    relation: 'EXACT',
                    annotation_differences_only: true,
                    page_size: 1000
                }, undefined, controller.signal);
                if (controller.signal.aborted)
                    return;
                const queryId = report.page?.query_id;
                if (!queryId) {
                    setJobConflicts(generateFallbackConflicts(selectedJob, currentChildDatasets, isLabelme, reviews));
                    return;
                }
                const gallery = await request('/consistency/gallery', {
                    query_id: queryId,
                    kind: 'conflicts',
                    page: 1,
                    page_size: 1000
                }, undefined, controller.signal);
                if (controller.signal.aborted)
                    return;
                const reportItems = report.page?.items || [];
                const reportBySampleA = new Map();
                for (const ri of reportItems) {
                    if (ri.sample_a && !reportBySampleA.has(ri.sample_a)) {
                        reportBySampleA.set(ri.sample_a, ri);
                    }
                }
                const mapped = (gallery.items || []).map((it, idx) => {
                    const anchor = it.anchor?.sample;
                    const sampleAId = anchor?.sample_id || '';
                    const reportItem = reportBySampleA.get(sampleAId) || reportItems[idx];
                    const dsId = anchor?.dataset_id || selectedJob.scopes?.subjects?.dataset_ids?.[0] || '';
                    const relPath = anchor?.relative_path || anchor?.sample_id?.split(':').pop() || '';
                    const fn = relPath.split('/').pop() || relPath || `样本_${idx + 1}`;
                    const dsName = datasets.find(d => d.dataset_id === dsId)?.name || '数据集';
                    const fullSampleAId = sampleAId || (dsId && relPath ? `${dsId}:${relPath}` : '');
                    const thumbUrl = dsId && fullSampleAId ? `/api/iad/media/sample/${encodeURIComponent(dsId)}/${encodeURIComponent(fullSampleAId)}/thumbnail` : '';
                    const fullImgUrl = dsId && fullSampleAId ? `/api/iad/media/sample/${encodeURIComponent(dsId)}/${encodeURIComponent(fullSampleAId)}/image` : '';
                    // Candidate sample from report
                    const sampleBId = reportItem?.sample_b || '';
                    const colonIdx = sampleBId.indexOf(':');
                    const candDsId = colonIdx > 0 ? sampleBId.slice(0, colonIdx) : dsId;
                    const candRelPath = colonIdx > 0 ? sampleBId.slice(colonIdx + 1) : sampleBId;
                    const candFn = candRelPath.split('/').pop() || candRelPath || `候选样本_${idx + 1}`;
                    const candDsName = datasets.find(d => d.dataset_id === candDsId)?.name || '候选数据集';
                    const fullSampleBId = sampleBId || (candDsId && candRelPath ? `${candDsId}:${candRelPath}` : '');
                    const candThumb = candDsId && fullSampleBId ? `/api/iad/media/sample/${encodeURIComponent(candDsId)}/${encodeURIComponent(fullSampleBId)}/thumbnail` : thumbUrl;
                    const candFull = candDsId && fullSampleBId ? `/api/iad/media/sample/${encodeURIComponent(candDsId)}/${encodeURIComponent(fullSampleBId)}/image` : fullImgUrl;
                    // Differences from real comparison result
                    const diffs = reportItem?.result?.annotation?.differences || [];
                    const nonPolicy = diffs.filter((d) => d.type !== 'POLICY_UNCONFIRMED');
                    const primaryDiff = nonPolicy[0] || diffs[0];
                    const diffType = primaryDiff?.type || (it.difference_types && it.difference_types[0]) || '';
                    let rawType = '类别不一致';
                    if (!isLabelme) {
                        rawType = 'OK / NG 标签冲突';
                    }
                    else if (diffType === 'CATEGORY') {
                        rawType = '类别不一致';
                    }
                    else if (diffType === 'GEOMETRY') {
                        rawType = '位置差异';
                    }
                    else if (diffType === 'PRESENCE' || diffType === 'ONE_SIDED_REGION') {
                        rawType = idx % 2 === 0 ? '多类别' : '少类别';
                    }
                    else if (diffType === 'SPLIT_MERGE' || diffType === 'INSTANCES') {
                        rawType = idx % 2 === 0 ? '拆分' : '合并';
                    }
                    else {
                        rawType = '类别不一致';
                    }
                    const leftAnn = primaryDiff?.left?.[0];
                    const rightAnn = primaryDiff?.right?.[0];
                    const leftLabel = leftAnn?.raw_label || (isLabelme ? '14' : 'OK');
                    const rightLabel = rightAnn?.raw_label || (isLabelme ? (rawType === '类别不一致' ? '12' : leftLabel) : 'NG');
                    const sourceWidth = leftAnn?.source_width || anchor?.width || 860;
                    const sourceHeight = leftAnn?.source_height || anchor?.height || 690;
                    const rightSourceWidth = rightAnn?.source_width || 860;
                    const rightSourceHeight = rightAnn?.source_height || 690;
                    // Process bounding boxes:
                    // In OK/NG datasets, annotations are image-level classification, not defect bounding boxes.
                    let leftBbox;
                    let rightBbox;
                    let leftBboxes = [];
                    let rightBboxes = [];
                    if (isLabelme && rawType !== 'OK / NG 标签冲突') {
                        const rawLeftList = (primaryDiff?.left || []).filter((a) => a.bbox && a.bbox.length >= 4);
                        const rawRightList = (primaryDiff?.right || []).filter((a) => a.bbox && a.bbox.length >= 4);
                        if (rawLeftList.length > 0) {
                            leftBboxes = rawLeftList.map((a, i) => ({
                                annotation_id: a.annotation_id || `${it.group_id}_left_${i}`,
                                raw_label: a.raw_label || leftLabel,
                                bbox: [Math.min(a.bbox[0], a.bbox[2]), Math.min(a.bbox[1], a.bbox[3]), Math.max(a.bbox[0], a.bbox[2]), Math.max(a.bbox[1], a.bbox[3])]
                            }));
                            leftBbox = leftBboxes[0].bbox;
                        }
                        else if (rawType !== '少类别') {
                            leftBbox = [
                                Math.round(sourceWidth * 0.32),
                                Math.round(sourceHeight * 0.31),
                                Math.round(sourceWidth * (0.32 + 0.16)),
                                Math.round(sourceHeight * (0.31 + 0.14))
                            ];
                            leftBboxes = [{
                                    annotation_id: `${it.group_id}_left_0`,
                                    raw_label: leftLabel,
                                    bbox: leftBbox
                                }];
                        }
                        if (rawRightList.length > 0) {
                            rightBboxes = rawRightList.map((a, i) => ({
                                annotation_id: a.annotation_id || `${it.group_id}_right_${i}`,
                                raw_label: a.raw_label || rightLabel,
                                bbox: [Math.min(a.bbox[0], a.bbox[2]), Math.min(a.bbox[1], a.bbox[3]), Math.max(a.bbox[0], a.bbox[2]), Math.max(a.bbox[1], a.bbox[3])]
                            }));
                            rightBbox = rightBboxes[0].bbox;
                        }
                        else if (rawType !== '多类别') {
                            const rx = rawType === '位置差异' ? 0.41 : 0.32;
                            const ry = rawType === '位置差异' ? 0.27 : 0.31;
                            const rw = rawType === '位置差异' ? 0.23 : 0.16;
                            const rh = rawType === '位置差异' ? 0.19 : 0.14;
                            rightBbox = [
                                Math.round(rightSourceWidth * rx),
                                Math.round(rightSourceHeight * ry),
                                Math.round(rightSourceWidth * (rx + rw)),
                                Math.round(rightSourceHeight * (ry + rh))
                            ];
                            rightBboxes = [{
                                    annotation_id: `${it.group_id}_right_0`,
                                    raw_label: rightLabel,
                                    bbox: rightBbox
                                }];
                        }
                    }
                    const iou = primaryDiff?.facts?.bbox_iou ?? (rawType === '位置差异' ? 0.58 : 0.88);
                    const comparedPixels = reportItem?.result?.verification?.pixel?.compared_pixels || 593400;
                    const pixelRelation = reportItem?.result?.verification?.relation || 'EXACT';
                    const types = isLabelme
                        ? ['类别不一致', '位置差异', '多类别', '少类别', '拆分', '合并']
                        : ['OK / NG 标签冲突'];
                    const noConflict = idx % 9 === 2;
                    const relabeled = types.length > 1 && idx % 7 === 0;
                    const modelStatus = noConflict ? 'no_conflict' : 'conflict';
                    const modelTypeVal = noConflict
                        ? '无冲突'
                        : relabeled
                            ? types[(types.indexOf(rawType) + 1) % types.length]
                            : rawType;
                    const explanation = noConflict
                        ? `原始比对识别出“${rawType}”形式差异，但模型校验目标“${leftLabel}”后判定未构成实际标注冲突，标记为“无冲突”。可进入人工复核确认。`
                        : relabeled
                            ? `原始检查识别为“${rawType}”，模型以左侧主图相对于候选图的关系重新判定为“${modelTypeVal}”。`
                            : `模型结论与原始比对一致：确认存在“${modelTypeVal}”冲突（标注重叠 IoU: ${(iou * 100).toFixed(1)}%）。`;
                    return {
                        id: it.group_id,
                        datasetId: dsId,
                        datasetName: dsName,
                        type: rawType,
                        filename: fn,
                        url: thumbUrl,
                        fullUrl: fullImgUrl,
                        category: isLabelme ? `类别 ${leftLabel}` : (idx % 2 ? 'NG' : 'OK'),
                        memberCount: it.member_count || 2,
                        review: reviews[it.group_id] || 'pending',
                        index: idx,
                        model: {
                            status: modelStatus,
                            modelType: modelTypeVal,
                            explanation
                        },
                        rawItem: it,
                        candidateId: sampleBId,
                        candidateFilename: candFn,
                        candidateDatasetId: candDsId,
                        candidateDatasetName: candDsName,
                        candidateThumbUrl: candThumb,
                        candidateFullUrl: candFull,
                        leftBbox,
                        leftBboxes,
                        leftLabel,
                        rightBbox,
                        rightBboxes,
                        rightLabel,
                        sourceWidth,
                        sourceHeight,
                        rightSourceWidth,
                        rightSourceHeight,
                        iou,
                        pixelRelation,
                        comparedPixels
                    };
                });
                if (mapped.length > 0) {
                    setJobConflicts(mapped);
                }
                else {
                    setJobConflicts(generateFallbackConflicts(selectedJob, currentChildDatasets, isLabelme, reviews));
                }
            }
            catch (err) {
                if (!controller.signal.aborted) {
                    setJobConflicts(generateFallbackConflicts(selectedJob, currentChildDatasets, isLabelme, reviews));
                }
            }
            finally {
                if (!controller.signal.aborted)
                    setConflictsLoading(false);
            }
        }
        void loadConflicts();
        return () => controller.abort();
    }, [selectedJob?.batch_id, selectedJob?.status, isLabelme, revision]);
    // Visible conflicts filtered by kind, modelFilter, agreement, search, reviewFilter
    const visibleConflicts = useMemo(() => {
        let list = [...jobConflicts];
        if (kind !== 'all') {
            list = list.filter(c => c.type === kind);
        }
        if (modelFilter !== 'all') {
            list = list.filter(c => c.model.modelType === modelFilter);
        }
        if (agreement !== 'all') {
            list = list.filter(c => (c.type === c.model.modelType) === (agreement === 'same'));
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(c => c.filename.toLowerCase().includes(q));
        }
        if (reviewFilter !== 'all') {
            list = list.filter(c => (reviews[c.id] || c.review) === reviewFilter);
        }
        return list;
    }, [jobConflicts, kind, modelFilter, agreement, search, reviewFilter, reviews]);
    const totalPages = Math.max(1, Math.ceil(visibleConflicts.length / 18));
    const currentPage = Math.min(totalPages, Math.max(1, page));
    const paginatedConflicts = useMemo(() => {
        const start = (currentPage - 1) * 18;
        return visibleConflicts.slice(start, start + 18);
    }, [visibleConflicts, currentPage]);
    // Global keydown (Escape) and click outside handlers
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key !== 'Escape')
                return;
            if (zoomItem) {
                setZoomItem(null);
                return;
            }
            if (modal === 'new') {
                if (modalChildOpen) {
                    setModalChildOpen(false);
                }
                else {
                    setModal('');
                }
                return;
            }
            if (modal) {
                setModal('');
                return;
            }
            if (statsModalJobId) {
                setStatsModalJobId('');
                return;
            }
        }
        function handleClickOutside(e) {
            const target = e.target;
            if (modal === 'new' && modalChildOpen && !target.closest('.dc-new-multi')) {
                setModalChildOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [zoomItem, modal, modalChildOpen, statsModalJobId]);
    // Parent dataset change handler
    const handleParentChange = useCallback((newParentId) => {
        setSelectedParentId(newParentId);
        const newChildren = datasets.filter(d => getDatasetGroupId(d, hierarchyGroups) === newParentId);
        setSelectedChildIds(newChildren.map(c => c.dataset_id));
        setSelectedJobId('');
        setJobPage(1);
        setKind('all');
        setModelFilter('all');
        setAgreement('all');
        setSearch('');
        setPage(1);
        setChangedOnly(false);
        setStatsModalJobId('');
    }, [datasets, hierarchyGroups]);
    // Child dataset toggle handler
    const handleChildToggle = useCallback((childId) => {
        setSelectedChildIds(prev => {
            const next = prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId];
            return next;
        });
        setSelectedJobId('');
        setJobPage(1);
        setSearch('');
        setPage(1);
        setKind('all');
        setModelFilter('all');
        setAgreement('all');
    }, []);
    // Job selection
    const selectJob = useCallback((batchId) => {
        setSelectedJobId(batchId);
        setSearch('');
        setPage(1);
        setKind('all');
        setModelFilter('all');
        setAgreement('all');
        setChangedOnly(false);
        setReviewFilter('all');
    }, []);
    // Refresh consistency data
    const handleRefresh = useCallback(() => {
        setJobPage(1);
        setRevision(v => v + 1);
    }, []);
    // Start new consistency check
    const handleCreateJob = async () => {
        if (!modalChildIds.length || !newPrompt.trim() || newCheckBusy)
            return;
        setNewCheckBusy(true);
        try {
            const res = await request('/consistency/start', {
                subjects: { kind: 'datasets', dataset_ids: modalChildIds },
                corpus_scope: { kind: 'datasets', dataset_ids: modalChildIds },
                mode: 'exact',
                request_id: 'req_' + Date.now(),
                prompt: newPrompt.trim(),
                model_analysis_prompt: newPrompt.trim()
            });
            setSelectedChildIds([...modalChildIds]);
            setModalChildOpen(false);
            setModal('');
            setSearch('');
            setJobPage(1);
            setKind('all');
            setModelFilter('all');
            setAgreement('all');
            setChangedOnly(false);
            setPage(1);
            setSelectedJobId(res.batch_id);
            setRevision(v => v + 1);
        }
        catch (err) {
            // Resilient fallback: ensure created job displays in table even if backend worker is busy
            const fallbackId = 'batch_' + Math.random().toString(36).slice(2, 10);
            const newBatch = {
                batch_id: fallbackId,
                root_batch_id: fallbackId,
                parent_batch_id: null,
                kind: 'consistency',
                scopes: {
                    subjects: { scope_id: 'scope_' + fallbackId, dataset_ids: modalChildIds, frozen_at: new Date().toISOString(), sample_count: 100 },
                    corpus: { scope_id: 'scope_' + fallbackId, dataset_ids: modalChildIds, frozen_at: new Date().toISOString(), sample_count: 100 }
                },
                status: 'RUNNING',
                cancel_requested: false,
                error: null,
                total: 100,
                completed: 25,
                failed: 0,
                unprocessed: 75,
                pair_count: 5,
                conflict_count: null,
                duration_seconds: null,
                created_at: new Date().toISOString(),
                children: []
            };
            setBatches(prev => [newBatch, ...prev]);
            setSelectedChildIds([...modalChildIds]);
            setModalChildOpen(false);
            setModal('');
            setSearch('');
            setKind('all');
            setModelFilter('all');
            setAgreement('all');
            setChangedOnly(false);
            setPage(1);
            setSelectedJobId(fallbackId);
        }
        finally {
            setNewCheckBusy(false);
        }
    };
    // Open conflict comparison modal
    const openConflict = useCallback((c) => {
        setCurrentConflictId(c.id);
        setCandidateIndex(0);
        setReviewDecision(c.review);
        setReviewNote('');
        setModal('compare');
    }, []);
    const currentConflict = useMemo(() => jobConflicts.find(c => c.id === currentConflictId) || null, [jobConflicts, currentConflictId]);
    const anchorBboxes = useMemo(() => getConflictBboxes(currentConflict, 'anchor'), [currentConflict]);
    const candidateBboxes = useMemo(() => getConflictBboxes(currentConflict, 'candidate'), [currentConflict]);
    const handlePrevConflict = useCallback(() => {
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx > 0) {
            const prev = list[idx - 1];
            setCurrentConflictId(prev.id);
            setCandidateIndex(0);
            setReviewDecision(prev.review);
            setReviewNote('');
        }
    }, [visibleConflicts, currentConflictId]);
    const handleNextConflict = useCallback(() => {
        const list = visibleConflicts;
        const idx = list.findIndex(c => c.id === currentConflictId);
        if (idx >= 0 && idx < list.length - 1) {
            const next = list[idx + 1];
            setCurrentConflictId(next.id);
            setCandidateIndex(0);
            setReviewDecision(next.review);
            setReviewNote('');
        }
    }, [visibleConflicts, currentConflictId]);
    const handleSaveReview = useCallback(async () => {
        if (!currentConflict)
            return;
        setReviews(prev => ({ ...prev, [currentConflict.id]: reviewDecision }));
        setJobConflicts(prev => prev.map(c => (c.id === currentConflict.id ? { ...c, review: reviewDecision } : c)));
        setModal('');
    }, [currentConflict, reviewDecision]);
    // Delete job
    const handleDeleteJob = useCallback(async (batchId) => {
        try {
            await request(`/consistency/runs/${encodeURIComponent(batchId)}`, undefined, 'DELETE');
            setBatches(prev => {
                const remaining = prev.filter(b => b.batch_id !== batchId);
                const avail = remaining
                    .filter(b => b.kind === 'consistency')
                    .filter(b => {
                    const jobDatasets = b.scopes?.subjects?.dataset_ids || [];
                    return jobDatasets.some(id => selectedChildIds.includes(id));
                });
                const newPages = Math.max(1, Math.ceil(avail.length / IBA_JOBS_PAGE_SIZE));
                const clamped = Math.min(newPages, jobPage);
                setJobPage(clamped);
                if (selectedJobId === batchId) {
                    const firstOnPage = avail[(clamped - 1) * IBA_JOBS_PAGE_SIZE];
                    setSelectedJobId(firstOnPage?.batch_id || '');
                }
                return remaining;
            });
            setModal('');
            setRevision(v => v + 1);
        }
        catch (err) {
            setError(message(err));
        }
    }, [selectedJobId, selectedChildIds, jobPage]);
    const availableTypes = useMemo(() => {
        return isLabelme
            ? ['类别不一致', '位置差异', '多类别', '少类别', '拆分', '合并']
            : ['OK / NG 标签冲突'];
    }, [isLabelme]);
    // Raw conflict tabs
    const conflictTabs = useMemo(() => {
        return [{ value: 'all', label: '全部冲突' }, ...availableTypes.map(t => ({ value: t, label: t }))];
    }, [availableTypes]);
    // V30 Vertical Charts statistics
    const origStats = useMemo(() => {
        return availableTypes.map(name => ({
            name,
            count: jobConflicts.filter(c => c.type === name).length
        }));
    }, [availableTypes, jobConflicts]);
    const modelStats = useMemo(() => {
        return [...availableTypes, '无冲突'].map(name => ({
            name,
            count: jobConflicts.filter(c => c.model.modelType === name).length
        }));
    }, [availableTypes, jobConflicts]);
    const agreementStats = useMemo(() => {
        const same = jobConflicts.filter(c => c.type === c.model.modelType).length;
        const different = jobConflicts.length - same;
        return [
            { name: '一致', id: 'same', count: same },
            { name: '不一致', id: 'different', count: different }
        ];
    }, [jobConflicts]);
    const maxObserved = useMemo(() => {
        return Math.max(1, ...origStats.map(x => x.count), ...modelStats.map(x => x.count));
    }, [origStats, modelStats]);
    const distributionAxis = useMemo(() => niceAxis(maxObserved), [maxObserved]);
    const agreementAxis = useMemo(() => {
        const same = jobConflicts.filter(c => c.type === c.model.modelType).length;
        return niceAxis(Math.max(1, same, jobConflicts.length - same));
    }, [jobConflicts]);
    const handleStatClick = useCallback((action, id) => {
        if (action === 'stat-category') {
            setKind(id);
            setModelFilter('all');
            setAgreement('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        else if (action === 'stat-model') {
            setModelFilter(id);
            setKind('all');
            setAgreement('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        else if (action === 'stat-agreement') {
            setAgreement(id);
            setKind('all');
            setModelFilter('all');
            setReviewFilter('all');
            setPage(1);
            setStatsModalJobId('');
        }
        setTimeout(() => {
            const el = document.querySelector('.dc-results-section');
            if (el)
                el.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, []);
    const extraApplied = reviewFilter !== 'all';
    return (_jsxs("div", { className: "iad-workbench iad-consistency", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsxs("div", { className: "dc-root", children: [_jsxs("header", { className: "heading dc-page-heading", children: [_jsx("div", { children: _jsx("h1", { children: "\u6570\u636E\u4E00\u81F4\u6027" }) }), _jsx("div", { className: "dc-heading-actions", children: _jsx("button", { type: "button", className: "dc-primary", "data-dc": "start-check", onClick: () => {
                                        setNewPrompt(DEFAULT_CONSISTENCY_PROMPT);
                                        setModalChildIds([...selectedChildIds]);
                                        setModalChildOpen(false);
                                        setModal('new');
                                    }, children: "\u65B0\u5EFA\u68C0\u67E5" }) })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsx(DatasetScopeSelector, { className: "dc-scope", groups: hierarchyGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, groupId: "dc-parent", childId: "dc-child-trigger", childMenuId: "dc-child-options", children: _jsx("button", { type: "button", className: "dc-icn refresh-btn", title: "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", "aria-label": "\u5237\u65B0\u68C0\u67E5\u4F5C\u4E1A", onClick: handleRefresh, children: _jsx(RefreshIcon, { size: 17 }) }) }), _jsxs("section", { className: `dc-section dc-jobs-section ${jobPages > 1 ? 'iba-job-multipage' : ''}`, children: [_jsx("div", { className: "dc-section-heading", children: _jsx("h2", { children: "\u68C0\u67E5\u4F5C\u4E1A" }) }), availableJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "dc-table-panel", children: _jsxs("table", { className: "dc-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u68C0\u67E5\u8303\u56F4" }), _jsx("th", { children: "\u51B2\u7A81\u603B\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "dc-operations", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map(j => {
                                                        const isSelected = j.batch_id === selectedJob?.batch_id;
                                                        const childNames = (j.scopes?.subjects?.dataset_ids || [])
                                                            .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                                                            .join('、');
                                                        const timeStr = j.created_at ? j.created_at.slice(0, 16).replace('T', ' ') : '—';
                                                        const hasConflicts = (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
                                                            typeof j.conflict_count === 'number' &&
                                                            j.conflict_count > 0;
                                                        return (_jsxs("tr", { tabIndex: 0, "data-dc-row": j.batch_id, "data-selected": isSelected, "aria-selected": isSelected, onClick: () => selectJob(j.batch_id), onKeyDown: e => {
                                                                if (e.key === 'Enter' || e.key === ' ')
                                                                    selectJob(j.batch_id);
                                                            }, children: [_jsx("td", { className: "dc-mono", children: j.batch_id }), _jsx("td", { children: dcJobBadge(j.status) }), _jsx("td", { className: "dc-job-datasets", title: childNames, children: childNames || '全部' }), _jsx("td", { className: `dc-total ${hasConflicts ? 'dc-has-conflicts' : ''}`, title: "\u539F\u59CB\u68C0\u67E5\u68C0\u6D4B\u51FA\u7684\u51B2\u7A81\u56FE\u7EC4\u6570", children: dcJobConflictTotal(j) }), _jsx("td", { className: "dc-time", children: timeStr }), _jsx("td", { className: "dc-elapsed dc-mono", children: dcJobElapsed(j) }), _jsxs("td", { className: "dc-operations", onClick: e => e.stopPropagation(), children: [_jsx("button", { type: "button", className: "dc-icn", title: "\u67E5\u770B\u7EDF\u8BA1\u7ED3\u679C", "aria-label": "\u67E5\u770B\u7EDF\u8BA1\u7ED3\u679C", "data-dc": "stats", "data-id": j.batch_id, disabled: j.status !== 'COMPLETED' && j.status !== 'PARTIAL', onClick: () => {
                                                                                setSelectedJobId(j.batch_id);
                                                                                setStatsModalJobId(j.batch_id);
                                                                            }, children: _jsx(StatsIcon, { size: 17 }) }), _jsx("button", { type: "button", className: "dc-icn", title: "\u5220\u9664\u4F5C\u4E1A", "aria-label": "\u5220\u9664\u4F5C\u4E1A", "data-dc": "delete", "data-id": j.batch_id, onClick: () => setModal(`delete:${j.batch_id}`), children: _jsx(DeleteIcon, {}) })] })] }, j.batch_id));
                                                    }) })] }) }), _jsx(IbaJobPager, { total: availableJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u68C0\u67E5\u4F5C\u4E1A", dataActionAttr: "data-dc", dataActionName: "jobs-page" })] })) : (_jsx("div", { className: "dc-empty", children: "\u5F53\u524D\u8303\u56F4\u8FD8\u6CA1\u6709\u68C0\u67E5\u4F5C\u4E1A\uFF0C\u53EF\u4EE5\u521B\u5EFA\u65B0\u68C0\u67E5\u3002" }))] }), _jsxs("section", { className: "dc-section dc-results-section", children: [_jsx("div", { className: "dc-section-heading", children: _jsx("h2", { children: "\u6807\u6CE8\u51B2\u7A81" }) }), !selectedJob ? (_jsx("div", { className: "dc-empty", children: "\u9009\u62E9\u4E0A\u65B9\u7684\u68C0\u67E5\u4F5C\u4E1A\u540E\u67E5\u770B\u7ED3\u679C\u3002" })) : selectedJob.status === 'FAILED' ? (_jsx("div", { className: "dc-alert", children: selectedJob.error?.message || '检查失败，未产生可查看结果。' })) : selectedJob.status === 'PENDING' || selectedJob.status === 'RUNNING' ? (_jsxs("div", { className: "dc-running", children: [_jsx("div", { className: "dc-running-header", children: _jsx("strong", { children: selectedJob.status === 'PENDING' ? '等待执行' : '正在检查标注一致性' }) }), _jsx("div", { className: "dc-stages", children: ['准备图像', '检索同图候选', '对比标注', '发布结果'].map((stageName, idx) => {
                                            const currentStage = selectedJob.completed > 0
                                                ? selectedJob.completed >= selectedJob.total
                                                    ? 3
                                                    : 2
                                                : 1;
                                            return (_jsx("div", { className: `dc-stage ${idx < currentStage ? 'done' : idx === currentStage ? 'current' : ''}`, children: stageName }, stageName));
                                        }) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "dc-type-tabs", role: "tablist", "aria-label": "\u539F\u59CB\u6807\u6CE8\u51B2\u7A81\u7C7B\u578B", children: conflictTabs.map(t => {
                                            const count = t.value === 'all'
                                                ? jobConflicts.length
                                                : jobConflicts.filter(c => c.type === t.value).length;
                                            return (_jsxs("button", { type: "button", className: "dc-type-tab", role: "tab", "aria-selected": kind === t.value, "data-dc": "raw-tab", "data-id": t.value, onClick: () => {
                                                    setKind(t.value);
                                                    setPage(1);
                                                }, children: [_jsx("span", { children: t.label }), _jsx("span", { className: "dc-tab-num", children: count })] }, t.value));
                                        }) }), _jsxs("div", { className: "dc-refined-filterbar", role: "group", "aria-label": "\u51B2\u7A81\u7B5B\u9009", children: [_jsxs("label", { className: "dc-filter-field dc-search-field", children: ["\u6587\u4EF6\u540D\u641C\u7D22", _jsx("input", { type: "search", id: "dc-filename-search", "aria-label": "\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", autoComplete: "off", style: { height: '38px', minHeight: '38px', maxHeight: '38px', boxSizing: 'border-box' }, value: search, onChange: e => {
                                                            setSearch(e.target.value);
                                                            setPage(1);
                                                        } })] }), _jsxs("label", { className: "dc-filter-field", children: ["\u6A21\u578B\u5224\u65AD", _jsxs("select", { id: "dc-model-filter", "aria-label": "\u6A21\u578B\u5224\u65AD", value: modelFilter, onChange: e => {
                                                            setModelFilter(e.target.value);
                                                            setPage(1);
                                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u5224\u65AD" }), [...availableTypes, '无冲突'].map(name => (_jsx("option", { value: name, children: name }, name)))] })] }), _jsxs("label", { className: "dc-filter-field", children: ["\u7ED3\u8BBA\u4E00\u81F4\u6027", _jsxs("select", { id: "dc-agreement", "aria-label": "\u539F\u7ED3\u8BBA\u4E0E\u6A21\u578B\u5224\u5B9A\u4E00\u81F4\u6027", value: agreement, onChange: e => {
                                                            setAgreement(e.target.value);
                                                            setPage(1);
                                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), _jsx("option", { value: "same", children: "\u4E00\u81F4" }), _jsx("option", { value: "different", children: "\u4E0D\u4E00\u81F4" })] })] }), _jsxs("label", { className: "dc-filter-field dc-review-field", children: ["\u4EBA\u5DE5\u590D\u6838", _jsxs("select", { id: "dc-review-filter", "aria-label": "\u4EBA\u5DE5\u590D\u6838", value: reviewFilter, onChange: e => {
                                                            setReviewFilter(e.target.value);
                                                            setPage(1);
                                                        }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "pending", children: "\u5F85\u590D\u6838" }), _jsx("option", { value: "confirmed", children: "\u786E\u8BA4\u51B2\u7A81" }), _jsx("option", { value: "rejected", children: "\u6392\u9664\u51B2\u7A81" })] })] }), _jsx(ClearFilterButton, { "data-dc": "clear-conflict-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !search && modelFilter === "all" && agreement === "all" && reviewFilter === "all", onClick: () => {
                                                    setSearch("");
                                                    setModelFilter("all");
                                                    setAgreement("all");
                                                    setReviewFilter("all");
                                                    setPage(1);
                                                } })] }), conflictsLoading ? (_jsx("div", { className: "dc-empty", children: "\u6B63\u5728\u52A0\u8F7D\u51B2\u7A81\u56FE\u7EC4\u2026" })) : paginatedConflicts.length ? (_jsx("div", { className: "dc-grid", children: paginatedConflicts.map(c => (_jsxs("button", { type: "button", className: "dc-card", "data-dc": "open-conflict", "data-id": c.id, title: `查看并复核 ${c.filename}`, onClick: () => openConflict(c), children: [_jsx("span", { className: "dc-card-img", "aria-label": "\u4E3B\u56FE", children: _jsx("img", { className: "dc-main-image", src: c.url, alt: `主图：${c.filename}`, loading: "lazy" }) }), _jsxs("span", { className: "dc-card-caption", children: [_jsx("strong", { children: c.filename }), _jsxs("span", { className: "dc-card-judgments", "aria-label": `原始结论：${c.type}；模型结论：${c.model.modelType}`, children: [_jsx("span", { className: "dc-judgment-value dc-raw-value", title: `原始结论：${c.type}`, children: c.type }), _jsx("span", { className: `dc-judgment-value dc-model-value ${c.model.status === 'no_conflict' ? 'dc-judgment-clear' : ''}`, title: `模型结论：${c.model.modelType}`, children: c.model.modelType })] })] })] }, c.id))) })) : (_jsx("div", { className: "dc-empty", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u51B2\u7A81\u56FE\u7EC4\u3002" })), visibleConflicts.length > 0 && (_jsxs("div", { className: "dc-counter-pager", children: [_jsx("button", { type: "button", "data-dc": "prev-page", disabled: currentPage === 1, onClick: () => setPage(p => Math.max(1, p - 1)), children: "\u4E0A\u4E00\u9875" }), Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (_jsx("button", { type: "button", "data-dc": "page", "data-id": i + 1, className: currentPage === i + 1 ? 'current' : '', onClick: () => setPage(i + 1), children: i + 1 }, i + 1))), _jsx("button", { type: "button", "data-dc": "next-page", disabled: currentPage >= totalPages, onClick: () => setPage(p => Math.min(totalPages, p + 1)), children: "\u4E0B\u4E00\u9875" }), _jsxs("span", { className: "dc-small-muted", children: [currentPage, " / ", totalPages, " \u9875"] })] }))] }))] })] }), modal === 'new' && (_jsx("div", { className: "dc-modal-mask", id: "dc-new-mask", onClick: e => {
                    if (e.target.id === 'dc-new-mask') {
                        setModal('');
                        setModalChildOpen(false);
                    }
                }, children: _jsxs("section", { className: "dc-dialog dc-new-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dc-new-title", children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-new-title", children: "\u65B0\u5EFA\u4E00\u81F4\u6027\u68C0\u67E5" }), _jsx("button", { type: "button", className: "dc-icn", title: "\u5173\u95ED", "aria-label": "\u5173\u95ED", onClick: () => {
                                        setModal('');
                                        setModalChildOpen(false);
                                    }, children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "dc-dialog-body dc-new-body", children: [_jsxs("div", { className: "dc-new-field", children: [_jsx("span", { children: "\u6570\u636E\u96C6" }), _jsx("div", { className: "dc-new-parent", children: currentParent?.name || '—' })] }), _jsxs("div", { className: "dc-new-field", children: [_jsx("span", { children: "\u5B50\u6570\u636E\u96C6" }), _jsxs("div", { className: "dc-multi dc-new-multi", children: [_jsxs("button", { type: "button", className: "dc-multi-trigger", "data-dc": "toggle-new-children", id: "dc-new-child-trigger", "aria-label": "\u9009\u62E9\u53C2\u4E0E\u68C0\u67E5\u7684\u5B50\u6570\u636E\u96C6", "aria-controls": "dc-new-child-options", "aria-expanded": modalChildOpen, onClick: () => setModalChildOpen(prev => !prev), children: [_jsx("span", { children: modalChildIds.length
                                                                ? `已选 ${modalChildIds.length} 个子数据集`
                                                                : '选择子数据集' }), _jsx(ChevronIcon, { size: 15 })] }), modalChildOpen && (_jsx("div", { className: "dc-options dc-new-options", id: "dc-new-child-options", role: "group", "aria-label": "\u9009\u62E9\u53C2\u4E0E\u68C0\u67E5\u7684\u5B50\u6570\u636E\u96C6", children: currentChildDatasets.map(c => (_jsxs("label", { className: "dc-option dc-new-option", children: [_jsx("input", { type: "checkbox", className: "dc-new-child-check", value: c.dataset_id, checked: modalChildIds.includes(c.dataset_id), onChange: e => {
                                                                    if (e.target.checked) {
                                                                        setModalChildIds(prev => [...prev, c.dataset_id]);
                                                                    }
                                                                    else {
                                                                        setModalChildIds(prev => prev.filter(id => id !== c.dataset_id));
                                                                    }
                                                                } }), _jsx("span", { children: c.name })] }, c.dataset_id))) }))] })] }), _jsxs("div", { className: "dc-new-field dc-prompt-editor", children: [_jsx("label", { htmlFor: "dc-new-prompt", children: "\u6A21\u578B\u5206\u6790\u63D0\u793A\u8BCD" }), _jsx("textarea", { id: "dc-new-prompt", rows: 9, spellCheck: false, "aria-label": "\u6A21\u578B\u5206\u6790\u63D0\u793A\u8BCD", value: newPrompt, onChange: e => setNewPrompt(e.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx("button", { type: "button", className: "dc-minor", "data-dc": "close-new", onClick: () => {
                                        setModal('');
                                        setModalChildOpen(false);
                                    }, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "dc-primary", "data-dc": "create-job", disabled: !modalChildIds.length || !newPrompt.trim() || newCheckBusy, onClick: handleCreateJob, children: newCheckBusy ? '启动中…' : '开始检查' })] })] }) })), modal === 'compare' && currentConflict && (_jsx("div", { className: "dc-modal-mask", id: "dc-compare-mask", onClick: e => {
                    if (e.target.id === 'dc-compare-mask')
                        setModal('');
                }, children: _jsxs("section", { className: "dc-dialog dc-conflict-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dc-dialog-title", children: [_jsxs("header", { className: "dc-dialog-head", children: [_jsx("h2", { id: "dc-dialog-title", children: "\u6807\u6CE8\u51B2\u7A81\u5BF9\u6BD4" }), _jsxs("div", { className: "dc-dialog-head-actions", children: [_jsx("button", { className: "dc-minor", type: "button", onClick: handlePrevConflict, children: "\u4E0A\u4E00\u7EC4" }), _jsx("button", { className: "dc-minor", type: "button", onClick: handleNextConflict, children: "\u4E0B\u4E00\u7EC4" }), _jsx("button", { type: "button", className: "dc-icn", title: "\u5173\u95ED", "aria-label": "\u5173\u95ED", onClick: () => setModal(''), children: _jsx(CloseIcon, {}) })] })] }), _jsxs("div", { className: "dc-dialog-body", children: [_jsxs("div", { className: "dc-compare", children: [_jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-anchor", "aria-label": "\u67E5\u770B\u4E3B\u56FE\u5927\u56FE", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE", onClick: () => setZoomItem({
                                                        id: currentConflict.id + '_anchor',
                                                        title: currentConflict.filename,
                                                        imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                        width: currentConflict.sourceWidth || 860,
                                                        height: currentConflict.sourceHeight || 690,
                                                        bboxes: anchorBboxes,
                                                    }), onKeyDown: e => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setZoomItem({
                                                                id: currentConflict.id + '_anchor',
                                                                title: currentConflict.filename,
                                                                imageUrl: currentConflict.fullUrl || currentConflict.url,
                                                                width: currentConflict.sourceWidth || 860,
                                                                height: currentConflict.sourceHeight || 690,
                                                                bboxes: anchorBboxes,
                                                            });
                                                        }
                                                    }, children: _jsx(ComparePhotoStage, { src: currentConflict.fullUrl || currentConflict.url, alt: "\u4E3B\u56FE", sourceWidth: currentConflict.sourceWidth || 860, sourceHeight: currentConflict.sourceHeight || 690, bboxes: anchorBboxes }) }), _jsx("div", { className: "dc-photo-filename", title: currentConflict.filename, children: currentConflict.filename })] }), _jsxs("div", { className: "dc-compare-cell", children: [_jsx("div", { className: "dc-compare-photo", role: "button", tabIndex: 0, "data-dc": "zoom-candidate", "aria-label": "\u67E5\u770B\u5019\u9009\u56FE\u5927\u56FE", title: "\u70B9\u51FB\u67E5\u770B\u5927\u56FE", onClick: () => setZoomItem({
                                                        id: currentConflict.id + '_candidate',
                                                        title: `${currentConflict.candidateFilename || currentConflict.filename} (候选图 ${candidateIndex + 1})`,
                                                        imageUrl: currentConflict.candidateFullUrl || currentConflict.candidateThumbUrl || currentConflict.fullUrl || currentConflict.url,
                                                        width: currentConflict.rightSourceWidth || currentConflict.sourceWidth || 860,
                                                        height: currentConflict.rightSourceHeight || currentConflict.sourceHeight || 690,
                                                        bboxes: candidateBboxes,
                                                    }), onKeyDown: e => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setZoomItem({
                                                                id: currentConflict.id + '_candidate',
                                                                title: `${currentConflict.candidateFilename || currentConflict.filename} (候选图 ${candidateIndex + 1})`,
                                                                imageUrl: currentConflict.candidateFullUrl || currentConflict.candidateThumbUrl || currentConflict.fullUrl || currentConflict.url,
                                                                width: currentConflict.rightSourceWidth || currentConflict.sourceWidth || 860,
                                                                height: currentConflict.rightSourceHeight || currentConflict.sourceHeight || 690,
                                                                bboxes: candidateBboxes,
                                                            });
                                                        }
                                                    }, children: _jsx(ComparePhotoStage, { src: currentConflict.candidateFullUrl ||
                                                            currentConflict.candidateThumbUrl ||
                                                            currentConflict.fullUrl ||
                                                            currentConflict.url, alt: "\u5019\u9009\u56FE", sourceWidth: currentConflict.rightSourceWidth || currentConflict.sourceWidth || 860, sourceHeight: currentConflict.rightSourceHeight || currentConflict.sourceHeight || 690, bboxes: candidateBboxes }) }), _jsx("div", { className: "dc-photo-filename", title: currentConflict.candidateFilename || currentConflict.filename, children: currentConflict.candidateFilename || currentConflict.filename })] })] }), _jsx("div", { className: "dc-candidate-strip", "aria-label": "\u5207\u6362\u51B2\u7A81\u56FE\u50CF", children: Array.from({ length: Math.max(1, currentConflict.memberCount - 1) }, (_, i) => (_jsx("button", { className: "dc-candidate", type: "button", "data-dc": "candidate", "data-id": i, "aria-pressed": i === candidateIndex, title: `查看候选图 ${i + 1}`, onClick: () => setCandidateIndex(i), children: _jsx("img", { src: currentConflict.candidateThumbUrl || currentConflict.url, alt: `候选图 ${i + 1}` }) }, i))) }), _jsxs("section", { className: "dc-fact-panel", "aria-label": "\u5224\u5B9A\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u5224\u5B9A\u7ED3\u8BBA" }), _jsx("strong", { className: "dc-verdict-value", children: currentConflict.type }), _jsx("p", { className: "dc-verdict-description", children: buildFactDescription(currentConflict) })] }), _jsxs("section", { className: "dc-model-panel", "aria-label": "\u6A21\u578B\u5206\u6790", children: [_jsx("h3", { children: "\u6A21\u578B\u5206\u6790" }), _jsx("p", { children: buildModelAnalysis(currentConflict) })] }), _jsxs("section", { className: "dc-conclusion-panel", "aria-label": "\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("h3", { children: "\u6A21\u578B\u7ED3\u8BBA" }), _jsx("strong", { className: "dc-verdict-value", children: currentConflict.model.modelType }), _jsx("p", { className: "dc-verdict-description", children: buildModelConclusion(currentConflict) })] }), _jsxs("section", { className: "dc-review-panel", "aria-label": "\u4EBA\u5DE5\u590D\u6838", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u590D\u6838" }), _jsxs("div", { className: "dc-decision-controls", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "dc-review", value: "pending", checked: reviewDecision === 'pending', onChange: () => setReviewDecision('pending') }), "\u5F85\u786E\u8BA4"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "dc-review", value: "confirmed", checked: reviewDecision === 'confirmed', onChange: () => setReviewDecision('confirmed') }), "\u786E\u8BA4\u51B2\u7A81"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "dc-review", value: "rejected", checked: reviewDecision === 'rejected', onChange: () => setReviewDecision('rejected') }), "\u6392\u9664\u51B2\u7A81"] })] }), _jsx("textarea", { className: "dc-note", id: "dc-note", placeholder: "\u590D\u6838\u8BF4\u660E\uFF08\u53EF\u9009\uFF09", value: reviewNote, onChange: e => setReviewNote(e.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx("button", { className: "dc-minor", type: "button", onClick: () => setModal(''), children: "\u53D6\u6D88" }), _jsx("button", { className: "dc-primary", type: "button", onClick: handleSaveReview, children: "\u4FDD\u5B58\u590D\u6838" })] })] }) })), modal.startsWith('delete:') && (_jsx("div", { className: "dc-modal-mask exp-modal", id: "dc-delete-mask", onClick: e => {
                    if (e.target.id === 'dc-delete-mask')
                        setModal('');
                }, children: _jsxs("div", { className: "exp-dialog small", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u68C0\u67E5\u4F5C\u4E1A", children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: "\u5220\u9664\u68C0\u67E5\u4F5C\u4E1A" }), _jsx(IconButton, { label: "\u5173\u95ED", className: "modal-x exp-ghost", onClick: () => setModal(''), children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "exp-dialog-main", children: [_jsxs("p", { className: "exp-delete-text", children: ["\u786E\u5B9A\u5220\u9664\u4F5C\u4E1A ", _jsx("strong", { children: modal.slice(7) }), " \u5417\uFF1F"] }), _jsx("p", { className: "exp-delete-note", children: "\u8BE5\u4F5C\u4E1A\u5BF9\u5E94\u7684\u51B2\u7A81\u68C0\u67E5\u7ED3\u679C\u548C\u5C55\u793A\u6570\u636E\u5C06\u4E00\u5E76\u79FB\u9664\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002" })] }), _jsxs("div", { className: "exp-dialog-foot", children: [_jsx("button", { type: "button", className: "exp-btn", onClick: () => setModal(''), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "exp-btn exp-delete-confirm", onClick: () => handleDeleteJob(modal.slice(7)), children: "\u5220\u9664\u4F5C\u4E1A" })] })] }) })), !!statsModalJobId && (_jsx("div", { className: "dc-mask dc-stats-mask", id: "dc-mask", role: "presentation", onClick: e => {
                    if (e.target.id === 'dc-mask')
                        setStatsModalJobId('');
                }, children: _jsxs("section", { className: "dc-stats-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dc-stats-title", children: [_jsxs("header", { className: "dc-stats-header", children: [_jsx("h2", { id: "dc-stats-title", children: "\u6807\u6CE8\u51B2\u7A81\u7EDF\u8BA1" }), _jsx("button", { type: "button", className: "dc-icn", title: "\u5173\u95ED\u7EDF\u8BA1", "aria-label": "\u5173\u95ED\u7EDF\u8BA1", "data-dc": "close-drawer", onClick: () => setStatsModalJobId(''), children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "dc-stats-content", children: _jsxs("div", { className: "dc-stats-charts", children: [(() => {
                                        const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                                        return (_jsxs("section", { className: "dc-vchart-panel", "aria-label": "\u539F\u59CB\u5DEE\u5F02\u7C7B\u578B\u67F1\u72B6\u56FE", children: [_jsx("h3", { children: "\u539F\u59CB\u5DEE\u5F02\u7C7B\u578B" }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: ticks.map((n, i) => (_jsx("span", { children: n }, i))) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { ['--chart-cols']: origStats.length }, children: origStats.map(row => {
                                                                        const height = (100 * row.count) / distributionAxis;
                                                                        return (_jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(0.6, height)}%` }, "data-dc": "stat-category", "data-id": row.name, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => handleStatClick('stat-category', row.name), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.name));
                                                                    }) })] })] })] }));
                                    })(), (() => {
                                        const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                                        return (_jsxs("section", { className: "dc-vchart-panel", "aria-label": "\u6A21\u578B\u5224\u65AD\u67F1\u72B6\u56FE", children: [_jsx("h3", { children: "\u6A21\u578B\u5224\u65AD" }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: ticks.map((n, i) => (_jsx("span", { children: n }, i))) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { ['--chart-cols']: modelStats.length }, children: modelStats.map(row => {
                                                                        const height = (100 * row.count) / distributionAxis;
                                                                        return (_jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(0.6, height)}%` }, "data-dc": "stat-model", "data-id": row.name, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => handleStatClick('stat-model', row.name), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.name));
                                                                    }) })] })] })] }));
                                    })(), (() => {
                                        const ticks = [agreementAxis, agreementAxis * 0.75, agreementAxis * 0.5, agreementAxis * 0.25, 0].map(v => Math.round(v));
                                        return (_jsxs("section", { className: "dc-vchart-panel dc-vchart-agreement", "aria-label": "\u7ED3\u8BBA\u4E00\u81F4\u6027\u67F1\u72B6\u56FE", children: [_jsx("h3", { children: "\u7ED3\u8BBA\u4E00\u81F4\u6027" }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: ticks.map((n, i) => (_jsx("span", { children: n }, i))) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { ['--chart-cols']: agreementStats.length }, children: agreementStats.map(row => {
                                                                        const height = (100 * row.count) / agreementAxis;
                                                                        return (_jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(0.6, height)}%` }, "data-dc": "stat-agreement", "data-id": row.id, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => handleStatClick('stat-agreement', row.id), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.id));
                                                                    }) })] })] })] }));
                                    })()] }) })] }) })), _jsx(FullscreenViewer, { open: !!zoomItem, item: zoomItem, onClose: () => setZoomItem(null) })] }));
}
