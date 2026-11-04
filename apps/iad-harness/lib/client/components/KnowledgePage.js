import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { CloseIcon, DeleteIcon, DocumentSearchIcon } from "../AuditIcon.js";
import { ClearFilterButton, RefreshIconButton } from "./CommonFilterControls.js";
const defaultPresets = [
    { id: "edges", name: "边缘与开口", text: "边缘连续性、孔、槽、齿、缺口、开口内外、堵塞、毛刺、崩边与局部残缺的可见迹象。" },
    { id: "integrity", name: "表面完整性", text: "裂纹状线条、划痕、磨损、压痕、凹坑、凸起、破损及其与结构边界的关系。" },
    { id: "texture", name: "纹理与表面加工", text: "纹理方向、周期、粗细、颗粒、纤维、加工纹路、光泽一致性及正常局部变化。" },
    { id: "coating", name: "颜色与覆盖层", text: "颜色分布、斑点、色差、涂覆、镀层或膜层的可见连续性、露底、起皮；材质与化学成分不由颜色证明。" },
    { id: "cleanliness", name: "清洁与异物", text: "颗粒、纤维、污迹、残胶、油状痕迹、附着物、孔隙内遮挡及可能的正常反光解释。" },
    { id: "process", name: "工艺痕迹", text: "适用时观察胶路、焊缝、焊点、切边、冲压、注塑、浇口、飞边、溢胶、覆盖连续性和分布。" },
    { id: "markings", name: "标识与图案", text: "字符、标志、印刷、刻印、编码区域的存在、位置、朝向、清晰度、缺笔、重影及图案重复关系。" },
    { id: "packaging", name: "柔性部件与包装", text: "适用时观察折痕、褶皱、封边、封口、薄膜、边缘卷曲、褶叠及其正常变化。" },
    { id: "logic", name: "多实例与逻辑关系", text: "多个对象的数量、槽位、组合、左右对应、顺序和相互位置；仅在跨图证据支持时形成约束。" },
    { id: "imaging", name: "成像与允许变化", text: "视角、旋转、尺度、光照、高光、阴影、曝光、透明或反射、景深、模糊、遮挡和背景。" }
];
const explorerDirections = {
    s1: [
        { id: "e-edge", name: "黑色边缘条连续性与开孔规整性", text: "比较黑色边缘在不同裁剪位置的连续性，识别稳定的正常开孔与阶梯状结构。", source: "explore_e930f012" },
        { id: "e-cyan", name: "青色高亮开孔形态一致性", text: "比较椭圆高亮开孔的轮廓、尺寸与亮度变化，区分视角、光照与可疑变化。", source: "explore_e930f012" },
        { id: "e-line", name: "表面浅色细线与胶路边缘形态", text: "比较细线与胶路的相对距离，核查拼接伪影与真正划痕的区别。", source: "explore_e930f012" }
    ],
    s2: [{ id: "e-corner", name: "框胶转角与边界连续性", text: "比较不同转角位置的边界连续性和外观差异。", source: "explore_76c2" }],
    s3: [{ id: "e-pcb", name: "焊点、边缘及走线规律", text: "结合局部结构，观察走线、焊点与焊盘的稳定形态。", source: "explore_89ae" }],
    s4: []
};
const defaultEntryTemplates = [
    { id: "k1", name: "笔直贯穿垂直白线为成像 / 拼接伪影", summary: "蓝色半透明盖板图中，贯穿图像的细白线常是稳定成像特征，不应直接判为划痕。", reason: "该白线在多张样本中的相对位置稳定，跨越局部结构时形态连续；结合图像对照，更符合成像或拼接伪影。", allowed: "允许细白线存在轻微曲率、亮度及相对位置变化，不可仅凭白线存在判为表面划痕。", limit: "仅覆盖当前视角和样本范围，真实划伤仍需原图与标注核实。", evidence: "supported", review: "confirmed", supportImgs: [1, 2, 3, 4, 7], counterImgs: [] },
    { id: "k2", name: "青色高亮开孔形态一致性", summary: "青色椭圆高亮区域通常具有相近的轮廓，亮度差异不应独立作为缺陷判据。", reason: "同批图像中高亮开孔在同类局部位置反复出现，形状较稳定，亮度会随成像条件波动。", allowed: "允许高亮轮廓轻微平移、亮度变化及视角带来的宽高差异。", limit: "不能替代实际开孔尺寸和产品结构标准。", evidence: "supported", review: "confirmed", supportImgs: [3, 4, 5, 6], counterImgs: [] },
    { id: "k3", name: "局部不规则线框可能为结构开孔", summary: "矩形与三角线框可能是正常结构，但当前图像的局部裁剪存在歧义。", reason: "部分样本呈规律的结构性轮廓，但另一些样本遮挡严重，暂不能单凭局部图像确定。", allowed: "允许由裁剪与不同视角造成的结构显示差异。", limit: "当前存在相互矛盾的局部证据，需要人工复核。", evidence: "conflict", review: "pending", supportImgs: [2, 7], counterImgs: [8] },
    { id: "k4", name: "黑色边缘条阶梯结构与缺口区分", summary: "正常开孔处边缘允许阶梯状起伏，但不应直接忽略突然断边。", reason: "多张样本在对应位置出现稳定的阶梯状黑色边缘，属于可能的正常结构。", allowed: "允许正常工艺位置的阶梯、转角与凹槽，不允许无法解释的结构断裂。", limit: "需要工程图或更多完整视角佐证。", evidence: "supported", review: "pending", supportImgs: [1, 6, 7], counterImgs: [9] },
    { id: "k5", name: "浅蓝渐变与材料表面变化", summary: "当前证据尚不能明确区分光照渐变、材料色差与覆膜变化。", reason: "多个样本的淡蓝过渡方向不完全一致，缺少稳定照明条件和缺陷对照。", allowed: "允许局部光照和反射导致的色彩变化。", limit: "待补充同位置、稳定光照样本，再评估是否构成可复用知识。", evidence: "insufficient", review: "pending", supportImgs: [3], counterImgs: [5, 8] },
    { id: "k6", name: "胶路边缘的连续纹理", summary: "边缘纹理在局部有规律地重复出现，不能仅因周期性变化判为异常。", reason: "选定图像的胶路侧边多处呈相近纹理，初步支持为正常加工外观。", allowed: "允许均匀周期纹理，但明显缺损仍需比对。", limit: "样本范围有限，尚不能覆盖其他工艺参数。", evidence: "supported", review: "pending", supportImgs: [2, 4, 5, 6], counterImgs: [] }
];
const makeDemoItems = (indexes) => indexes.map((idx, n) => ({
    ...defaultEntryTemplates[idx],
    id: `${defaultEntryTemplates[idx].id}_${n}`,
    supportImgs: [...defaultEntryTemplates[idx].supportImgs],
    counterImgs: [...defaultEntryTemplates[idx].counterImgs],
    note: ""
}));
const defaultDemoJobs = [
    { id: "j1", dataset: "d1", subset: "s1", name: "蓝色背面工艺知识挖掘_v3", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "mixed", count: 6, at: "2026/10/29 14:27:33", durationText: "04:36", seconds: 276, items: makeDemoItems([0, 1, 2, 3, 4, 5]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：蓝色背面工艺知识挖掘_v3\n观察边缘连续性与涂层情况。", kind: "normal", knowledgeVersionId: "knowledge_demo_j1" },
    { id: "j2", dataset: "d1", subset: "s1", name: "开孔与边缘一致性核验_v2", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "explore", count: 5, at: "2026/10/29 13:27:33", durationText: "04:02", seconds: 242, items: makeDemoItems([0, 1, 3, 4, 5]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：开孔与边缘一致性核验_v2\n比较开孔与边缘连续性。", kind: "normal", knowledgeVersionId: "knowledge_demo_j2" },
    { id: "j3", dataset: "d1", subset: "s1", name: "表面完整性与异常挖掘", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "preset", count: 4, at: "2026/10/29 11:04:42", durationText: "04:12", seconds: 252, items: makeDemoItems([1, 2, 3, 5]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：表面完整性与异常挖掘", kind: "normal", knowledgeVersionId: "knowledge_demo_j3" },
    { id: "j4", dataset: "d1", subset: "s1", name: "颜色与覆盖层一致性", status: "interrupted", statusLabel: "已中断", statusBadgeClass: "gray", source: "preset", count: null, at: "2026/10/29 10:53:36", durationText: "00:45", seconds: 45, items: [], model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：颜色与覆盖层一致性", kind: "normal", knowledgeVersionId: null },
    { id: "j5", dataset: "d1", subset: "s1", name: "纹理与加工特征挖掘", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "preset", count: 3, at: "2026/10/29 10:05:55", durationText: "04:26", seconds: 266, items: makeDemoItems([0, 1, 2]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：纹理与加工特征挖掘", kind: "normal", knowledgeVersionId: "knowledge_demo_j5" },
    { id: "j6", dataset: "d1", subset: "s1", name: "开孔与转角复核", status: "failed", statusLabel: "失败", statusBadgeClass: "red", source: "explore", count: null, at: "2026/10/28 16:25:48", durationText: "00:33", seconds: 33, items: [], model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：开孔与转角复核", kind: "normal", knowledgeVersionId: null },
    { id: "j7", dataset: "d1", subset: "s1", name: "表面浅线与胶路边缘", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "explore", count: 2, at: "2026/10/28 15:12:13", durationText: "02:19", seconds: 139, items: makeDemoItems([0, 5]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：表面浅线与胶路边缘", kind: "normal", knowledgeVersionId: "knowledge_demo_j7" },
    { id: "j8", dataset: "d1", subset: "s1", name: "异常示例知识复查", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "mixed", count: 3, at: "2026/10/28 14:20:40", durationText: "04:51", seconds: 291, items: makeDemoItems([2, 3, 4]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：异常示例知识复查", kind: "defect", knowledgeVersionId: "knowledge_demo_j8" },
    { id: "j9", dataset: "d1", subset: "s1", name: "材料渐变观察", status: "interrupted", statusLabel: "已中断", statusBadgeClass: "gray", source: "preset", count: null, at: "2026/10/28 11:45:10", durationText: "00:28", seconds: 28, items: [], model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：材料渐变观察", kind: "normal", knowledgeVersionId: null },
    { id: "j10", dataset: "d1", subset: "s1", name: "边缘结构复查_初版", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "preset", count: 2, at: "2026/10/27 12:02:15", durationText: "03:04", seconds: 184, items: makeDemoItems([3, 0]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：边缘结构复查_初版", kind: "normal", knowledgeVersionId: "knowledge_demo_j10" },
    { id: "j11", dataset: "d1", subset: "s2", name: "框胶转角结构知识挖掘", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "explore", count: 2, at: "2026/10/27 11:00:04", durationText: "02:54", seconds: 174, items: makeDemoItems([3, 4]), model: "Qwen3.8-27B-FP8", prompt: "挖掘目标：框胶转角结构知识挖掘", kind: "normal", knowledgeVersionId: "knowledge_demo_j11" },
    { id: "j12", dataset: "d2", subset: "s3", name: "PCB 焊点及走线规范梳理", status: "completed", statusLabel: "已完成", statusBadgeClass: "green", source: "mixed", count: 3, at: "2026/10/26 16:30:30", durationText: "03:38", seconds: 218, items: makeDemoItems([1, 2, 5]), model: "Qwen3.5-27B-FP8", prompt: "挖掘目标：PCB 焊点及走线规范梳理", kind: "normal", knowledgeVersionId: "knowledge_demo_j12" }
];
let cachedDatasets = null;
let cachedGroups = null;
function formatDuration(sec) {
    if (sec == null)
        return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
export function KnowledgePage({ dataset, kind, refreshRevision, headerActions }) {
    const { workspace } = useWorkspace();
    const pageId = "industrial-knowledge";
    const view = workspace.view(pageId);
    // Hierarchy
    const initialGroups = buildHierarchyGroups(cachedDatasets || [dataset], cachedGroups || []);
    const initialParentId = getDatasetGroupId(dataset, initialGroups);
    const [datasets, setDatasets] = useState(() => cachedDatasets || [dataset]);
    const [groups, setGroups] = useState(() => initialGroups);
    const [selectedParentId, setSelectedParentId] = useState(() => initialParentId);
    const [selectedChildId, setSelectedChildId] = useState(() => dataset.dataset_id);
    // Jobs & Knowledge hooks
    const [revision, setRevision] = useState(0);
    const updated = useCallback(() => setRevision(v => v + 1), []);
    const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
    const currentKnowledge = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
    const { knowledge } = currentKnowledge;
    // Local job list & selection
    const [jobList, setJobList] = useState(defaultDemoJobs);
    const [selectedJobId, setSelectedJobId] = useState("j2");
    const [jobSearch, setJobSearch] = useState("");
    const [jobStatus, setJobStatus] = useState("all");
    const [jobPage, setJobPage] = useState(1);
    // Lower panel search & filter
    const [knowledgeSearch, setKnowledgeSearch] = useState("");
    const [knowledgeStatus, setKnowledgeStatus] = useState("all");
    const [entryPage, setEntryPage] = useState(1);
    // Modals & Drawers
    const [promptOpen, setPromptOpen] = useState(false);
    const [promptJob, setPromptJob] = useState(null);
    const [detailItem, setDetailItem] = useState(null);
    const [reviewStatus, setReviewStatus] = useState("pending");
    const [reviewNote, setReviewNote] = useState("");
    const [confirmState, setConfirmState] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [lightboxEvidence, setLightboxEvidence] = useState([]);
    const [toastMsg, setToastMsg] = useState("");
    const toast = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 2800);
    }, []);
    // Sync datasets and hierarchy
    useEffect(() => {
        let active = true;
        request("/datasets")
            .then(res => {
            if (!active)
                return;
            const dsList = res.datasets || [dataset];
            const grpList = buildHierarchyGroups(dsList, res.groups || []);
            cachedDatasets = dsList;
            cachedGroups = res.groups || [];
            setDatasets(dsList);
            setGroups(grpList);
            const parentId = getDatasetGroupId(dataset, grpList);
            setSelectedParentId(parentId);
            setSelectedChildId(dataset.dataset_id);
        })
            .catch(() => { });
        return () => {
            active = false;
        };
    }, [dataset, refreshRevision]);
    // Load real backend jobs if present, merge with demo jobs
    useEffect(() => {
        const liveJobs = polling.jobs.filter(j => j.kind === kind);
        if (!liveJobs.length)
            return;
        setJobList(prev => {
            const realUiJobs = liveJobs.map(j => {
                const statusMap = {
                    COMPLETED: "completed",
                    RUNNING: "running",
                    PENDING: "running",
                    CANCELLED: "interrupted",
                    INTERRUPTED: "interrupted",
                    FAILED: "failed"
                };
                const labelMap = {
                    COMPLETED: "已完成",
                    RUNNING: "运行中",
                    PENDING: "排队中",
                    CANCELLED: "已中断",
                    INTERRUPTED: "已中断",
                    FAILED: "失败"
                };
                const badgeMap = {
                    COMPLETED: "green",
                    RUNNING: "blue",
                    PENDING: "amber",
                    CANCELLED: "gray",
                    INTERRUPTED: "gray",
                    FAILED: "red"
                };
                const dur = j.finished_at && j.started_at
                    ? Math.max(1, Math.round((new Date(j.finished_at).getTime() - new Date(j.started_at).getTime()) / 1000))
                    : null;
                // Extract or adapt knowledge items if available
                const items = (knowledge?.checks || []).map((c, i) => ({
                    id: c.check_id || `k_real_${i}`,
                    name: c.title,
                    summary: c.criterion || c.subject,
                    reason: c.criterion,
                    allowed: c.allowed_variations.join("；") || "允许正常工艺位置的轻微起伏与视角差异。",
                    limit: c.limitations.join("；") || "仅覆盖当前视角和样本范围。",
                    evidence: c.status === "conflicted" ? "conflict" : "supported",
                    review: "pending",
                    supportImgs: [1, 2, 3],
                    counterImgs: c.status === "conflicted" ? [8] : [],
                    note: ""
                }));
                return {
                    id: j.run_id,
                    name: (j.kind === "normal" ? "良品工艺知识挖掘" : "异常特征知识挖掘") + `_${j.run_id.slice(-6)}`,
                    dataset: j.dataset_id,
                    subset: j.dataset_id,
                    status: statusMap[j.status] || "completed",
                    statusLabel: labelMap[j.status] || "已完成",
                    statusBadgeClass: badgeMap[j.status] || "green",
                    source: "mixed",
                    count: j.knowledge_version_id ? items.length || 6 : null,
                    at: j.submitted_at ? new Date(j.submitted_at).toLocaleString("zh-CN", { hour12: false }) : "2026/10/29 14:27:33",
                    durationText: formatDuration(dur),
                    seconds: dur,
                    items: items.length ? items : makeDemoItems([0, 1, 2, 3, 4, 5]),
                    model: j.model_name || "Qwen3.8-27B-FP8",
                    prompt: j.mining_prompt?.instruction || "挖掘目标：基于所选样本图像，提炼可复核的外观规律及允许变化。\n对所选图像进行对照观察，记录支持和反对证据，注意适用边界。",
                    kind: j.kind,
                    knowledgeVersionId: j.knowledge_version_id || (j.status === "COMPLETED" ? "version_1" : null)
                };
            });
            // Filter out existing live ids to avoid duplicate
            const liveIds = new Set(realUiJobs.map(j => j.id));
            const remainingDemo = prev.filter(j => !liveIds.has(j.id) && !j.id.startsWith("run_"));
            return [...realUiJobs, ...remainingDemo];
        });
    }, [polling.jobs, kind, knowledge]);
    // Current scope datasets
    const parentGroups = useMemo(() => groups.filter(g => g.group_id !== "single"), [groups]);
    const currentChildDatasets = useMemo(() => {
        return datasets.filter(d => getDatasetGroupId(d, groups) === selectedParentId);
    }, [datasets, groups, selectedParentId]);
    const handleParentChange = (parentId) => {
        setSelectedParentId(parentId);
        const children = datasets.filter(d => getDatasetGroupId(d, groups) === parentId);
        if (children.length > 0) {
            setSelectedChildId(children[0].dataset_id);
            workspace.selectDataset(children[0].dataset_id);
        }
    };
    const handleChildChange = (childId) => {
        setSelectedChildId(childId);
        workspace.selectDataset(childId);
    };
    const handleRefresh = () => {
        polling.refresh();
        updated();
        toast("已刷新当前数据");
    };
    // Filter jobs by current dataset/subset, search and status
    const scopedJobs = useMemo(() => {
        return jobList.filter(j => {
            // In demo mode allow jobs belonging to s1/s2/d1 or matching current selectedChildId
            return j.subset === selectedChildId || j.dataset === selectedParentId || j.subset === "s1" || true;
        });
    }, [jobList, selectedChildId, selectedParentId]);
    const filteredJobs = useMemo(() => {
        return scopedJobs.filter(j => {
            const matchSearch = !jobSearch.trim() || j.name.toLowerCase().includes(jobSearch.toLowerCase());
            const matchStatus = jobStatus === "all" || j.status === jobStatus;
            return matchSearch && matchStatus;
        });
    }, [scopedJobs, jobSearch, jobStatus]);
    // Job pagination (8 per page SSOT)
    const jobsPerPage = 8;
    const maxJobPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
    const currentJobPage = Math.min(maxJobPages, Math.max(1, jobPage));
    const pageJobs = useMemo(() => {
        return filteredJobs.slice((currentJobPage - 1) * jobsPerPage, currentJobPage * jobsPerPage);
    }, [filteredJobs, currentJobPage]);
    // Selected job
    const selectedJob = useMemo(() => {
        return jobList.find(j => j.id === selectedJobId) || filteredJobs[0] || null;
    }, [jobList, selectedJobId, filteredJobs]);
    const selectJob = (id) => {
        setSelectedJobId(id);
        setEntryPage(1);
        setKnowledgeSearch("");
        setKnowledgeStatus("all");
    };
    // Selected job knowledge items
    const currentJobItems = useMemo(() => {
        if (!selectedJob)
            return [];
        return selectedJob.items || [];
    }, [selectedJob]);
    // Filter knowledge items
    const filteredChecks = useMemo(() => {
        return currentJobItems.filter(item => {
            const term = knowledgeSearch.trim().toLowerCase();
            const matchSearch = !term || item.name.toLowerCase().includes(term) || item.summary.toLowerCase().includes(term);
            const matchStatus = knowledgeStatus === "all" ||
                (knowledgeStatus === "conflict" ? item.evidence === "conflict" : item.review === knowledgeStatus);
            return matchSearch && matchStatus;
        });
    }, [currentJobItems, knowledgeSearch, knowledgeStatus]);
    // Knowledge pagination (8 per page SSOT)
    const entriesPerPage = 8;
    const maxEntryPages = Math.max(1, Math.ceil(filteredChecks.length / entriesPerPage));
    const currentEntryPage = Math.min(maxEntryPages, Math.max(1, entryPage));
    const pagedChecks = useMemo(() => {
        return filteredChecks.slice((currentEntryPage - 1) * entriesPerPage, currentEntryPage * entriesPerPage);
    }, [filteredChecks, currentEntryPage]);
    // Prompt drawer handlers
    const openJobPrompt = (id) => {
        const j = jobList.find(v => v.id === id);
        if (!j)
            return;
        setPromptJob(j);
        setPromptOpen(true);
    };
    const closePrompt = () => {
        setPromptOpen(false);
        setPromptJob(null);
    };
    const handleCopyPrompt = async () => {
        if (!promptJob)
            return;
        try {
            await navigator.clipboard.writeText(promptJob.prompt);
            toast("提示词已复制");
        }
        catch (_) {
            toast("复制失败，请选中文本复制");
        }
    };
    // Detail dialog handlers
    const openDetail = (item) => {
        setDetailItem(item);
        setReviewStatus(item.review || "pending");
        setReviewNote(item.note || "");
    };
    const closeDetail = () => {
        setDetailItem(null);
    };
    const saveReview = () => {
        if (!detailItem || !selectedJob)
            return;
        detailItem.review = reviewStatus;
        detailItem.note = reviewNote;
        closeDetail();
        toast("人工复核已保存");
    };
    // Delete handlers with SSOT confirmation modal
    const askDeleteJob = (id) => {
        const j = jobList.find(v => v.id === id);
        if (!j)
            return;
        setConfirmState({
            title: "删除挖掘作业",
            message: `确定删除“${j.name}”吗？此操作将移除该作业记录。`,
            danger: true,
            onConfirm: () => {
                setJobList(prev => prev.filter(item => item.id !== id));
                if (selectedJobId === id) {
                    const next = jobList.find(item => item.id !== id);
                    setSelectedJobId(next?.id || null);
                }
                toast("作业已删除");
            }
        });
    };
    const askDeleteEntry = (item) => {
        if (!selectedJob)
            return;
        setConfirmState({
            title: "删除知识条目",
            message: `确定删除“${item.name}”吗？此操作将从当前作业结果中移除此知识条目。`,
            danger: true,
            onConfirm: () => {
                selectedJob.items = selectedJob.items.filter(x => x.id !== item.id);
                selectedJob.count = selectedJob.items.length;
                setJobList([...jobList]);
                toast("已删除知识条目");
            }
        });
    };
    // Lightbox handlers
    const openLight = (evidenceList, idx) => {
        setLightboxEvidence(evidenceList);
        setLightboxIndex(idx);
    };
    const closeLight = () => {
        setLightboxIndex(null);
        setLightboxEvidence([]);
    };
    const stepLight = (delta) => {
        if (lightboxIndex === null || !lightboxEvidence.length)
            return;
        setLightboxIndex((lightboxIndex + delta + lightboxEvidence.length) % lightboxEvidence.length);
    };
    // Creation subpage state (V54/V56)
    const [setupDataset, setSetupDataset] = useState(selectedParentId);
    const [setupSubsets, setSetupSubsets] = useState(new Set([selectedChildId]));
    const [setupKind, setSetupKind] = useState("normal");
    const [setupGeneral, setSetupGeneral] = useState(new Set(["edges", "integrity"]));
    const [setupExplored, setSetupExplored] = useState(new Set());
    const [setupEdits, setSetupEdits] = useState({});
    const [setupTab, setSetupTab] = useState("preset");
    const [setupPrompt, setSetupPrompt] = useState("");
    const [setupPromptDirty, setSetupPromptDirty] = useState(false);
    const [setupChildMenuOpen, setSetupChildMenuOpen] = useState(false);
    const [formError, setFormError] = useState("");
    const [editingDir, setEditingDir] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingText, setEditingText] = useState("");
    const [dirEditError, setDirEditError] = useState("");
    const currentSetupParent = useMemo(() => {
        return parentGroups.find(g => g.group_id === setupDataset) || parentGroups[0];
    }, [parentGroups, setupDataset]);
    const currentSetupChildDatasets = useMemo(() => {
        return datasets.filter(d => getDatasetGroupId(d, groups) === setupDataset);
    }, [datasets, groups, setupDataset]);
    const kbExploredDirs = useMemo(() => {
        const map = new Map();
        for (const sid of setupSubsets) {
            for (const item of (explorerDirections[sid] || [])) {
                if (!map.has(item.id))
                    map.set(item.id, item);
            }
        }
        if (map.size === 0 && (explorerDirections.s1 || []).length > 0) {
            for (const item of explorerDirections.s1) {
                if (!map.has(item.id))
                    map.set(item.id, item);
            }
        }
        return Array.from(map.values());
    }, [setupSubsets]);
    const getDirInfo = useCallback((item, dirKind) => {
        const edit = setupEdits[`${dirKind}:${item.id}`];
        return edit ? { ...item, ...edit } : item;
    }, [setupEdits]);
    const allSelectedDirItems = useMemo(() => {
        const presetsList = defaultPresets
            .filter(p => setupGeneral.has(p.id))
            .map(p => getDirInfo(p, "preset"));
        const exploredList = kbExploredDirs
            .filter(e => setupExplored.has(e.id))
            .map(e => getDirInfo(e, "explore"));
        return [...presetsList, ...exploredList];
    }, [setupGeneral, setupExplored, kbExploredDirs, getDirInfo]);
    const generatePromptText = useCallback((datasetName, subsetsNames, promptKind, dirs) => {
        return [
            "挖掘目标：",
            promptKind === "normal"
                ? "联合比较所选子数据集中的合格良品来源，归纳正常外观规律、允许变化与适用限制。"
                : "联合比较所选子数据集中的异常候选，整理可见异常判据、正常替代解释和适用限制。",
            `数据集：${datasetName}`,
            `子数据集：${subsetsNames.join("、")}`,
            "来源范围：所选子数据集的全部合格来源。",
            "用户选择的观察方向：",
            ...dirs.map((x, i) => `${i + 1}. ${x.name}：${x.text}`),
            "证据要求：",
            "只根据实际图像证据推断，区分正常变化、成像差异和异常现象。",
            "分别记录支持和反对证据。证据不足时明确说明，不能臆造规则或工业标准。"
        ].join("\n");
    }, []);
    useEffect(() => {
        if (setupPromptDirty)
            return;
        const parentName = currentSetupParent?.name || dataset.name;
        const subsetsNames = currentSetupChildDatasets
            .filter((c) => setupSubsets.has(c.dataset_id))
            .map((c) => c.name);
        setSetupPrompt(generatePromptText(parentName, subsetsNames, setupKind, allSelectedDirItems));
    }, [setupPromptDirty, currentSetupParent, currentSetupChildDatasets, setupSubsets, setupKind, allSelectedDirItems, generatePromptText, dataset.name]);
    const validationProblem = useMemo(() => {
        if (!setupSubsets.size)
            return "请选择子数据集";
        if (!allSelectedDirItems.length)
            return "请选择挖掘方向";
        if (!setupPrompt.trim())
            return "请填写完整提示词";
        return "";
    }, [setupSubsets.size, allSelectedDirItems.length, setupPrompt]);
    const handleRestorePrompt = () => {
        if (setupPromptDirty && setupPrompt.trim()) {
            setConfirmState({
                title: "恢复自动生成提示词",
                message: "恢复将覆盖手工修改的提示词。",
                danger: false,
                onConfirm: () => {
                    setSetupPromptDirty(false);
                    const parentName = currentSetupParent?.name || dataset.name;
                    const subsetsNames = currentSetupChildDatasets
                        .filter((c) => setupSubsets.has(c.dataset_id))
                        .map((c) => c.name);
                    setSetupPrompt(generatePromptText(parentName, subsetsNames, setupKind, allSelectedDirItems));
                    setConfirmState(null);
                }
            });
            return;
        }
        setSetupPromptDirty(false);
        const parentName = currentSetupParent?.name || dataset.name;
        const subsetsNames = currentSetupChildDatasets
            .filter((c) => setupSubsets.has(c.dataset_id))
            .map((c) => c.name);
        setSetupPrompt(generatePromptText(parentName, subsetsNames, setupKind, allSelectedDirItems));
    };
    const openCreate = () => {
        setSetupDataset(selectedParentId);
        setSetupSubsets(new Set([selectedChildId]));
        setSetupKind(kind);
        setSetupGeneral(new Set(["edges", "integrity"]));
        setSetupExplored(new Set());
        setSetupEdits({});
        setSetupTab("preset");
        setSetupPromptDirty(false);
        setSetupChildMenuOpen(false);
        setFormError("");
        setEditingDir(null);
        setCreateOpen(true);
    };
    const closeCreate = () => {
        setCreateOpen(false);
        setSetupChildMenuOpen(false);
        setEditingDir(null);
    };
    const saveDirEdit = () => {
        if (!editingDir)
            return;
        const name = editingName.trim();
        const text = editingText.trim();
        if (!name || !text) {
            setDirEditError("标题和描述不能为空。");
            return;
        }
        setSetupEdits(prev => ({
            ...prev,
            [`${editingDir.kind}:${editingDir.id}`]: { name, text }
        }));
        setEditingDir(null);
    };
    const closeDirDrawer = () => {
        setEditingDir(null);
        setDirEditError("");
    };
    const handleSubmitJob = () => {
        if (validationProblem)
            return;
        const selectedChildList = Array.from(setupSubsets);
        const firstName = allSelectedDirItems[0]?.name || "知识挖掘";
        const sourceKind = setupGeneral.size && setupExplored.size ? "mixed" : setupExplored.size ? "explore" : "preset";
        const newJob = {
            id: `demo_${Date.now()}`,
            name: `${firstName}知识挖掘`,
            dataset: setupDataset,
            subset: selectedChildList[0] || selectedChildId,
            status: "running",
            statusLabel: "运行中",
            statusBadgeClass: "blue",
            source: sourceKind,
            count: null,
            at: new Date().toLocaleString("zh-CN", { hour12: false }),
            durationText: "00:08",
            seconds: 8,
            items: makeDemoItems(setupGeneral.has("edges") ? [0, 1, 2, 3, 5] : [1, 4, 3]),
            model: "当前工作台模型",
            prompt: setupPrompt,
            kind: setupKind,
            knowledgeVersionId: `knowledge_demo_${Date.now()}`
        };
        setJobList(prev => [newJob, ...prev]);
        setSelectedJobId(newJob.id);
        closeCreate();
        toast("已创建离线演示作业");
        setTimeout(() => {
            newJob.status = "completed";
            newJob.statusLabel = "已完成";
            newJob.statusBadgeClass = "green";
            newJob.count = newJob.items.length;
            setJobList(prev => [...prev]);
            toast(`挖掘作业“${newJob.name}”已完成`);
        }, 4000);
    };
    // Keyboard shortcut for Esc
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                if (lightboxIndex !== null)
                    closeLight();
                else if (confirmState)
                    setConfirmState(null);
                else if (promptOpen)
                    closePrompt();
                else if (detailItem)
                    closeDetail();
                else if (editingDir)
                    closeDirDrawer();
                else if (createOpen)
                    closeCreate();
            }
            else if (lightboxIndex !== null) {
                if (e.key === "ArrowLeft")
                    stepLight(-1);
                if (e.key === "ArrowRight")
                    stepLight(1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [lightboxIndex, confirmState, promptOpen, detailItem, editingDir, createOpen]);
    // Helper for rendering pagination buttons
    const renderPageButtons = (current, max, onChange, dataPrefix) => {
        const nums = [];
        for (let p = 1; p <= max; p++) {
            if (p === 1 || p === max || Math.abs(p - current) <= 1)
                nums.push(p);
        }
        return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "pagebtn", disabled: current <= 1, onClick: () => onChange(Math.max(1, current - 1)), "aria-label": "\u4E0A\u4E00\u9875", children: "\u4E0A\u4E00\u9875" }), nums.map((p, idx) => {
                    const prev = nums[idx - 1];
                    const hasEllipsis = prev && p - prev > 1;
                    return (_jsxs(React.Fragment, { children: [hasEllipsis && _jsx("span", { className: "pager-ellipsis", "aria-hidden": "true", children: "\u2026" }), _jsx("button", { type: "button", className: "pagebtn", [`data-${dataPrefix}-set`]: p, "aria-current": p === current ? "page" : undefined, "aria-label": `第 ${p} 页`, onClick: () => onChange(p), children: p })] }, p));
                }), _jsx("button", { type: "button", className: "pagebtn", disabled: current >= max, onClick: () => onChange(Math.min(max, current + 1)), "aria-label": "\u4E0B\u4E00\u9875", children: "\u4E0B\u4E00\u9875" })] }));
    };
    return (_jsxs("div", { id: "knowledge-page", className: `iad-knowledge-page kb-v45 v46-app ${createOpen ? "kb-creating" : ""}`, children: [_jsx("div", { className: "kb-v45-main", children: _jsxs("div", { className: "main-inner", children: [_jsxs("header", { className: "topline", children: [_jsxs("div", { className: "titlebar", children: [_jsx("div", { className: "eyebrow", children: "\u77E5\u8BC6\u6784\u5EFA" }), _jsx("h1", { children: "\u77E5\u8BC6\u6316\u6398" })] }), _jsx("div", { className: "actions", children: _jsx("button", { className: "btn primary", id: "create-btn", onClick: openCreate, children: "\uFF0B \u65B0\u5EFA\u6316\u6398" }) })] }), _jsxs("section", { className: "context", "aria-label": "\u9009\u62E9\u6570\u636E\u8303\u56F4", children: [_jsxs("div", { className: "control", children: [_jsx("label", { className: "label", htmlFor: "dataset", children: "\u6570\u636E\u96C6" }), _jsx("select", { id: "dataset", className: "f wide select", "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: selectedParentId, onChange: e => handleParentChange(e.target.value), children: parentGroups.map(g => (_jsx("option", { value: g.group_id, children: g.name }, g.group_id))) })] }), _jsxs("div", { className: "control", children: [_jsx("label", { className: "label", htmlFor: "subset", children: "\u5B50\u6570\u636E\u96C6" }), _jsx("select", { id: "subset", className: "f wide select", "aria-label": "\u5B50\u6570\u636E\u96C6", value: selectedChildId, onChange: e => handleChildChange(e.target.value), children: currentChildDatasets.map(d => (_jsx("option", { value: d.dataset_id, children: d.name }, d.dataset_id))) })] }), _jsx("div", { className: "kb-context-actions", children: _jsx(RefreshIconButton, { id: "kb-refresh", title: "\u5237\u65B0\u5F53\u524D\u9875\u9762", ariaLabel: "\u5237\u65B0\u5F53\u524D\u9875\u9762", onClick: handleRefresh }) }), _jsx("div", { className: "context-info", id: "dataset-info" })] }), _jsxs("section", { className: "panel", "aria-labelledby": "jobs-heading", children: [_jsxs("div", { className: "panelbar", children: [_jsx("div", { children: _jsxs("h2", { id: "jobs-heading", children: ["\u6316\u6398\u4F5C\u4E1A", _jsx("span", { "aria-hidden": "true", className: "count hide", id: "jobs-count" })] }) }), _jsxs("div", { className: "filterset", children: [_jsx("input", { className: "f", id: "job-search", placeholder: "\u641C\u7D22\u4F5C\u4E1A\u540D\u79F0", "aria-label": "\u641C\u7D22\u4F5C\u4E1A\u540D\u79F0", value: jobSearch, onChange: e => {
                                                        setJobSearch(e.target.value);
                                                        setJobPage(1);
                                                    } }), _jsxs("select", { className: "f", id: "job-status", "aria-label": "\u7B5B\u9009\u4F5C\u4E1A\u72B6\u6001", value: jobStatus, onChange: e => {
                                                        setJobStatus(e.target.value);
                                                        setJobPage(1);
                                                    }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "completed", children: "\u5DF2\u5B8C\u6210" }), _jsx("option", { value: "running", children: "\u8FD0\u884C\u4E2D" }), _jsx("option", { value: "interrupted", children: "\u5DF2\u4E2D\u65AD" }), _jsx("option", { value: "failed", children: "\u5931\u8D25" })] }), _jsx(ClearFilterButton, { id: "kb-clear-job-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !jobSearch && jobStatus === "all", onClick: () => {
                                                        setJobSearch("");
                                                        setJobStatus("all");
                                                        setJobPage(1);
                                                    } })] })] }), _jsx("div", { className: "tableframe", id: "jobs-table-frame", style: { minHeight: maxJobPages > 1 ? "465px" : "" }, children: filteredJobs.length > 0 ? (_jsxs("table", { className: "jobs-table", id: "jobs-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { width: "36%" }, children: "\u4F5C\u4E1A\u540D\u79F0" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { className: "num", title: "\u5173\u8054\u53D1\u5E03\u77E5\u8BC6\u7248\u672C\u4E2D\u7684\u5224\u636E\u6570\u91CF", children: "\u5224\u636E\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "right", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { id: "job-rows", children: pageJobs.map(j => (_jsxs("tr", { tabIndex: 0, "aria-label": `选择挖掘作业 ${j.name}`, "aria-selected": j.id === selectedJob?.id, className: j.id === selectedJob?.id ? "current" : "", "data-pick-job": j.id, onClick: () => selectJob(j.id), onKeyDown: e => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            selectJob(j.id);
                                                        }
                                                    }, children: [_jsx("td", { children: _jsx("div", { className: "jobtitle", title: j.name, children: j.name }) }), _jsx("td", { children: _jsx("span", { className: `status ${j.statusBadgeClass}`, children: j.statusLabel }) }), _jsx("td", { className: "num", children: j.knowledgeVersionId ? j.count : "—" }), _jsx("td", { children: j.at }), _jsx("td", { children: j.durationText }), _jsx("td", { children: _jsxs("div", { className: "jobact", onClick: e => e.stopPropagation(), children: [_jsx("button", { type: "button", className: "job-mini-icon", title: "\u67E5\u770B\u63D0\u793A\u8BCD", "aria-label": "\u67E5\u770B\u63D0\u793A\u8BCD", "data-job-prompt": j.id, onClick: () => openJobPrompt(j.id), children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" }), _jsx("path", { d: "M14 3v5h5M9 12h6M9 16h6" })] }) }), _jsx("button", { type: "button", className: "job-mini-icon", title: "\u5220\u9664\u4F5C\u4E1A", "aria-label": `删除作业 ${j.name}`, "data-remove-job": j.id, onClick: () => askDeleteJob(j.id), children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" }) }) })] }) })] }, j.id))) })] })) : (_jsxs("div", { id: "jobs-empty", className: "tableempty", children: [_jsx("strong", { children: scopedJobs.length ? "没有符合条件的作业" : "当前子数据集尚无挖掘作业" }), _jsx("p", { children: scopedJobs.length ? "请调整状态或搜索条件。" : "从右上角「新建挖掘」选择方向与样本，创建挖掘作业。" })] })) }), _jsxs("div", { className: "job-pager", id: "job-pager", children: [_jsx("div", { className: "pages", children: renderPageButtons(currentJobPage, maxJobPages, setJobPage, "job") }), _jsxs("span", { className: "page-total", children: ["\u7B2C ", currentJobPage, " / ", maxJobPages, " \u9875\uFF0C\u5171 ", filteredJobs.length, " \u6761"] })] })] }), _jsxs("section", { className: "panel", id: "knowledge-panel", "aria-labelledby": "knowledge-heading", children: [_jsxs("div", { className: "panelbar knowledgebar", children: [_jsxs("div", { children: [_jsxs("h2", { id: "knowledge-heading", children: ["\u77E5\u8BC6\u6761\u76EE", _jsx("span", { "aria-hidden": "true", className: "count hide", id: "knowledge-count" })] }), _jsx("div", { className: "scope-name hide", id: "knowledge-job-name" })] }), selectedJob?.knowledgeVersionId ? (_jsxs("div", { className: "filterset", id: "knowledge-filterset", children: [_jsx("input", { className: "f", id: "knowledge-search", placeholder: "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: knowledgeSearch, onChange: e => {
                                                        setKnowledgeSearch(e.target.value);
                                                        setEntryPage(1);
                                                    } }), _jsxs("select", { className: "f", id: "knowledge-status", "aria-label": "\u7B5B\u9009\u6838\u5B9E\u72B6\u6001", value: knowledgeStatus, onChange: e => {
                                                        setKnowledgeStatus(e.target.value);
                                                        setEntryPage(1);
                                                    }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u6761\u76EE" }), _jsx("option", { value: "pending", children: "\u5F85\u6838\u5B9E" }), _jsx("option", { value: "confirmed", children: "\u5DF2\u901A\u8FC7" }), _jsx("option", { value: "rejected", children: "\u5DF2\u9A73\u56DE" }), _jsx("option", { value: "conflict", children: "\u5B58\u5728\u77DB\u76FE" })] }), _jsx(ClearFilterButton, { id: "kb-clear-knowledge-filters", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !knowledgeSearch && knowledgeStatus === "all", onClick: () => {
                                                        setKnowledgeSearch("");
                                                        setKnowledgeStatus("all");
                                                        setEntryPage(1);
                                                    } })] })) : null] }), _jsx("div", { className: "knowledge-wrap", id: "knowledge-body", children: !selectedJob ? (_jsxs("div", { className: "blank", children: [_jsx("div", { className: "blank-icon", children: "\u25A4" }), _jsx("strong", { children: "\u8BF7\u9009\u62E9\u4E0A\u65B9\u7684\u6316\u6398\u4F5C\u4E1A" }), _jsx("p", { children: "\u9009\u62E9\u4E00\u6761\u4F5C\u4E1A\u540E\uFF0C\u8FD9\u91CC\u5C06\u663E\u793A\u8BE5\u4F5C\u4E1A\u7684\u77E5\u8BC6\u6761\u76EE\u3002" })] })) : !selectedJob.knowledgeVersionId ? (_jsxs("div", { className: "blank", children: [_jsx("div", { className: "blank-icon", children: "\u25A3" }), _jsx("strong", { children: selectedJob.status === "running"
                                                    ? "作业正在运行"
                                                    : selectedJob.status === "failed"
                                                        ? "作业执行失败"
                                                        : "作业尚未发布知识版本" }), _jsx("p", { children: selectedJob.status === "running"
                                                    ? "发布完成后才显示该作业关联的知识版本。"
                                                    : selectedJob.status === "failed"
                                                        ? "当前作业没有已发布知识，请查看作业详情。"
                                                        : "此作业已结束，但未关联有效的知识版本，不显示当前最新知识。" })] })) : filteredChecks.length === 0 ? (_jsxs("div", { className: "blank", children: [_jsx("div", { className: "blank-icon", children: "\u25A4" }), _jsx("strong", { children: currentJobItems.length ? "没有符合筛选条件的知识条目" : "该作业暂无知识条目" }), _jsx("p", { children: currentJobItems.length ? "请调整搜索内容或核实状态。" : "该作业关联的知识版本没有可显示的条目。" })] })) : (_jsxs("div", { className: "knowledge-list", children: [_jsxs("div", { className: "knowledge-head", children: [_jsx("span", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsx("span", { children: "\u63CF\u8FF0" }), _jsx("span", { children: "\u652F\u6301/\u53CD\u5BF9" }), _jsx("span", { children: "\u64CD\u4F5C" })] }), _jsx("div", { className: "knowledge-items", children: pagedChecks.map(item => (_jsxs("div", { className: "knowledge-row", "data-detail-entry": item.id, role: "row", tabIndex: 0, "aria-label": `查看知识条目：${item.name}`, onClick: () => openDetail(item), onKeyDown: e => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            openDetail(item);
                                                        }
                                                    }, children: [_jsx("span", { className: "row-title knowledge-entry-name", children: item.name }), _jsx("span", { className: "row-desc knowledge-entry-description", title: item.summary, children: item.summary }), _jsxs("span", { className: "row-count col-evidence-count", title: `支持 ${(item.supportImgs || []).length} 张，反对 ${(item.counterImgs || []).length} 张`, children: [(item.supportImgs || []).length, "/", (item.counterImgs || []).length] }), _jsxs("span", { className: "col-action jobact", onClick: e => e.stopPropagation(), children: [_jsx("button", { type: "button", className: "job-mini-icon knowledge-entry-view", "data-view-entry": item.id, "aria-label": `查看知识条目 ${item.name}`, title: "\u67E5\u770B\u77E5\u8BC6\u6761\u76EE", onClick: () => openDetail(item), children: _jsx(DocumentSearchIcon, {}) }), _jsx("button", { type: "button", className: "job-mini-icon knowledge-entry-delete", "data-delete-entry": item.id, "aria-label": `删除知识条目 ${item.name}`, title: "\u5220\u9664\u77E5\u8BC6\u6761\u76EE", onClick: () => askDeleteEntry(item), children: _jsx(DeleteIcon, {}) })] })] }, item.id))) }), _jsxs("div", { className: "knowledge-pager", children: [_jsx("div", { className: "pages", children: renderPageButtons(currentEntryPage, maxEntryPages, setEntryPage, "entry") }), _jsxs("span", { className: "page-total", children: ["\u7B2C ", currentEntryPage, " / ", maxEntryPages, " \u9875\uFF0C\u5171 ", filteredChecks.length, " \u6761"] })] })] })) })] }), _jsx("div", { className: "demo-note", children: "\u5F53\u524D\u4E3A\u79BB\u7EBF\u4EA4\u4E92\u539F\u578B\uFF0C\u4F5C\u4E1A\u3001\u6A21\u578B\u3001\u77E5\u8BC6\u4E0E\u8BC1\u636E\u5747\u4F7F\u7528\u6F14\u793A\u6570\u636E\uFF1B\u5B9E\u9645\u6570\u636E\u7ED3\u6784\u548C\u63A5\u53E3\u5B9A\u4E49\u89C1\u5F00\u53D1\u65B9\u6848\u3002" })] }) }), typeof document !== "undefined" &&
                createPortal(_jsxs(_Fragment, { children: [_jsx("div", { className: `overlay knowledge-prompt-overlay ${promptOpen ? "show" : ""}`, id: "job-prompt-overlay", role: "presentation", onClick: closePrompt, children: _jsxs("aside", { className: "knowledge-prompt-drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": "job-prompt-title", tabIndex: -1, onClick: e => e.stopPropagation(), children: [_jsxs("header", { className: "knowledge-prompt-drawer-head", children: [_jsx("h2", { id: "job-prompt-title", children: "\u67E5\u770B\u63D0\u793A\u8BCD" }), _jsxs("div", { className: "knowledge-prompt-drawer-actions", children: [_jsx("button", { type: "button", className: "btn small", id: "copy-job-prompt", onClick: handleCopyPrompt, children: "\u590D\u5236\u63D0\u793A\u8BCD" }), _jsx("button", { type: "button", className: "knowledge-prompt-drawer-close", id: "close-job-prompt", "aria-label": "\u5173\u95ED\u63D0\u793A\u8BCD\u62BD\u5C49", title: "\u5173\u95ED", onClick: closePrompt, children: _jsx(CloseIcon, {}) })] })] }), _jsx("div", { className: "knowledge-prompt-drawer-content", id: "job-prompt-body", children: _jsx("pre", { id: "job-prompt-content", className: "knowledge-prompt-readonly", children: promptJob?.prompt || "该历史作业未记录冻结提示词。" }) })] }) }), _jsx("div", { className: `overlay detail-overlay v46-app ${detailItem ? "show" : ""}`, id: "detail-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "kb-detail-title", onClick: closeDetail, children: _jsxs("section", { className: "modal detail-modal", id: "entry-dialog", tabIndex: -1, onClick: e => e.stopPropagation(), children: [_jsxs("header", { className: "modalheader", children: [_jsx("div", { children: _jsx("h2", { id: "kb-detail-title", children: detailItem?.name }) }), _jsx("button", { type: "button", id: "close-detail", className: "iconbtn", title: "\u5173\u95ED\u77E5\u8BC6\u8BE6\u60C5", "aria-label": "\u5173\u95ED\u77E5\u8BC6\u8BE6\u60C5", onClick: closeDetail, children: "\u00D7" })] }), _jsxs("div", { className: "modalcontent", id: "detail-content", children: [_jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u77E5\u8BC6\u7ED3\u8BBA" }), _jsx("p", { children: detailItem?.summary })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u5224\u5B9A\u4F9D\u636E" }), _jsx("p", { children: detailItem?.reason })] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u5141\u8BB8\u53D8\u5316" }), _jsx("p", { children: detailItem?.allowed })] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: ["\u652F\u6301\u8BC1\u636E\uFF0C", (detailItem?.supportImgs || []).length, " \u5F20"] }), detailItem?.supportImgs.length ? (_jsx("div", { className: "detail-evidence-grid", children: detailItem.supportImgs.map((n, i) => (_jsxs("button", { type: "button", className: "detail-evidence", "data-light-image": i, "aria-label": `放大支持证据 ${i + 1}`, onClick: () => openLight([
                                                                ...(detailItem.supportImgs || []).map(id => ({ id, role: "support" })),
                                                                ...(detailItem.counterImgs || []).map(id => ({ id, role: "counter" }))
                                                            ], i), children: [_jsx("img", { src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23eef2f8"/><text x="100" y="80" font-family="sans-serif" font-size="14" fill="%234a5568" text-anchor="middle">样本 ${n}</text></svg>`, alt: `支持证据 ${i + 1}`, loading: "lazy" }), _jsxs("span", { children: ["\u652F\u6301\u8BC1\u636E ", i + 1, "\uFF0C\u70B9\u51FB\u653E\u5927"] })] }, n))) })) : (_jsx("div", { className: "detail-evidence-empty", children: "\u6682\u65E0\u652F\u6301\u8BC1\u636E\u56FE\u50CF" }))] }), _jsxs("section", { className: "detail-section", children: [_jsxs("h3", { children: ["\u53CD\u5BF9\u8BC1\u636E\uFF0C", (detailItem?.counterImgs || []).length, " \u5F20"] }), detailItem?.counterImgs.length ? (_jsx("div", { className: "detail-evidence-grid", children: detailItem.counterImgs.map((n, i) => (_jsxs("button", { type: "button", className: "detail-evidence", "data-light-image": (detailItem.supportImgs || []).length + i, "aria-label": `放大反对证据 ${i + 1}`, onClick: () => openLight([
                                                                ...(detailItem.supportImgs || []).map(id => ({ id, role: "support" })),
                                                                ...(detailItem.counterImgs || []).map(id => ({ id, role: "counter" }))
                                                            ], (detailItem.supportImgs || []).length + i), children: [_jsx("img", { src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23fff0f0"/><text x="100" y="80" font-family="sans-serif" font-size="14" fill="%23a74242" text-anchor="middle">样本 ${n}</text></svg>`, alt: `反对证据 ${i + 1}`, loading: "lazy" }), _jsxs("span", { children: ["\u53CD\u5BF9\u8BC1\u636E ", i + 1, "\uFF0C\u70B9\u51FB\u653E\u5927"] })] }, n))) })) : (_jsx("div", { className: "detail-evidence-empty", children: "\u6682\u65E0\u53CD\u5BF9\u8BC1\u636E\u56FE\u50CF" }))] }), _jsxs("section", { className: "detail-section", children: [_jsx("h3", { children: "\u9002\u7528\u9650\u5236" }), _jsx("p", { children: detailItem?.limit })] }), _jsxs("section", { className: "detail-section detail-review", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u6838\u5B9E" }), _jsxs("div", { className: "knowledge-review-options", role: "radiogroup", "aria-label": "\u4EBA\u5DE5\u6838\u5B9E\u7ED3\u8BBA", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: "pending", checked: reviewStatus === "pending", onChange: () => setReviewStatus("pending") }), "\u5F85\u6838\u5B9E"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: "confirmed", checked: reviewStatus === "confirmed", onChange: () => setReviewStatus("confirmed") }), "\u6838\u5B9E\u901A\u8FC7"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "knowledge-review", value: "rejected", checked: reviewStatus === "rejected", onChange: () => setReviewStatus("rejected") }), "\u9A73\u56DE"] })] }), _jsx("label", { className: "label", htmlFor: "review-note", children: "\u590D\u6838\u5907\u6CE8" }), _jsx("textarea", { className: "f textarea", id: "review-note", placeholder: "\u586B\u5199\u590D\u6838\u4F9D\u636E\uFF08\u53EF\u9009\uFF09", value: reviewNote, onChange: e => setReviewNote(e.target.value) })] })] }), _jsxs("footer", { className: "modalfooter", children: [_jsx("span", {}), _jsxs("div", { className: "actions", children: [_jsx("button", { className: "btn", id: "cancel-review", type: "button", onClick: closeDetail, children: "\u53D6\u6D88" }), _jsx("button", { className: "btn primary", id: "save-review", type: "button", onClick: saveReview, children: "\u4FDD\u5B58" })] })] })] }) }), _jsx("div", { className: `overlay confirm-overlay v46-app ${confirmState ? "show" : ""}`, id: "confirm-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "confirm-title", "aria-describedby": "confirm-message", onClick: () => setConfirmState(null), children: _jsxs("section", { className: "modal confirm-modal", tabIndex: -1, onClick: e => e.stopPropagation(), children: [_jsxs("header", { className: "modalheader", children: [_jsx("h2", { id: "confirm-title", children: confirmState?.title || "请确认" }), _jsx("button", { className: "iconbtn", id: "confirm-close", "aria-label": "\u5173\u95ED\u786E\u8BA4\u7A97\u53E3", onClick: () => setConfirmState(null), children: "\u00D7" })] }), _jsx("div", { className: "modalcontent", id: "confirm-message", children: confirmState?.message }), _jsx("footer", { className: "modalfooter", children: _jsxs("div", { className: "actions", children: [_jsx("button", { type: "button", className: "btn", id: "confirm-cancel", onClick: () => setConfirmState(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: `btn ${confirmState?.danger ? "is-danger" : "primary"}`, id: "confirm-accept", onClick: () => {
                                                        confirmState?.onConfirm();
                                                        setConfirmState(null);
                                                    }, children: "\u786E\u5B9A" })] }) })] }) }), _jsxs("section", { id: "kb-setup-page", className: `kb-setup-page ${createOpen ? "" : "hide"}`, "aria-label": "\u65B0\u5EFA\u77E5\u8BC6\u6316\u6398\u914D\u7F6E", children: [_jsxs("header", { className: "exp-heading kb-setup-heading", children: [_jsx("div", { children: _jsx("h1", { children: "\u65B0\u5EFA\u6316\u6398" }) }), _jsx("button", { type: "button", className: "exp-btn", id: "kb-setup-back", onClick: closeCreate, children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })] }), _jsxs("section", { className: "kb-setup-scope", "aria-label": "\u9009\u62E9\u6570\u636E\u8303\u56F4", children: [_jsxs("div", { className: "kb-setup-control", children: [_jsx("label", { htmlFor: "kb-setup-dataset", children: "\u6570\u636E\u96C6" }), _jsx("select", { id: "kb-setup-dataset", className: "f", value: setupDataset, onChange: e => {
                                                        const dsId = e.target.value;
                                                        setSetupDataset(dsId);
                                                        const firstChildId = datasets.find(d => getDatasetGroupId(d, groups) === dsId)?.dataset_id;
                                                        setSetupSubsets(new Set(firstChildId ? [firstChildId] : []));
                                                        setSetupExplored(new Set());
                                                        setSetupChildMenuOpen(false);
                                                    }, children: parentGroups.map(g => (_jsx("option", { value: g.group_id, children: g.name }, g.group_id))) })] }), _jsxs("div", { className: "kb-setup-control kb-child-control", children: [_jsx("label", { id: "kb-setup-child-label", htmlFor: "kb-setup-child-trigger", children: "\u5B50\u6570\u636E\u96C6" }), _jsxs("div", { className: "kb-child-picker", children: [_jsxs("button", { type: "button", className: "kb-child-trigger", id: "kb-setup-child-trigger", "aria-haspopup": "true", "aria-expanded": setupChildMenuOpen, "aria-labelledby": "kb-setup-child-label kb-setup-child-selected", onClick: () => setSetupChildMenuOpen(!setupChildMenuOpen), children: [_jsx("span", { id: "kb-setup-child-selected", children: setupSubsets.size ? `已选 ${setupSubsets.size} 个子数据集` : "请选择子数据集" }), _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) })] }), _jsx("div", { className: `kb-child-menu ${setupChildMenuOpen ? "" : "hide"}`, id: "kb-setup-child-menu", role: "group", "aria-label": "\u5B50\u6570\u636E\u96C6\u9009\u62E9", children: currentSetupChildDatasets.map(sub => (_jsxs("label", { className: "kb-child-option", children: [_jsx("input", { type: "checkbox", value: sub.dataset_id, checked: setupSubsets.has(sub.dataset_id), onChange: e => {
                                                                            const next = new Set(setupSubsets);
                                                                            if (e.target.checked)
                                                                                next.add(sub.dataset_id);
                                                                            else
                                                                                next.delete(sub.dataset_id);
                                                                            setSetupSubsets(next);
                                                                        } }), _jsx("span", { children: sub.name })] }, sub.dataset_id))) })] })] }), _jsxs("div", { className: "kb-setup-kind", role: "group", "aria-label": "\u77E5\u8BC6\u7C7B\u578B", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "sample-kind", value: "normal", checked: setupKind === "normal", onChange: () => setSetupKind("normal") }), "\u826F\u54C1"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "sample-kind", value: "defect", checked: setupKind === "defect", onChange: () => setSetupKind("defect") }), "\u5F02\u5E38"] })] })] }), _jsxs("section", { className: "exp-panel kb-setup-directions", "aria-labelledby": "kb-direction-heading", children: [_jsx("h2", { id: "kb-direction-heading", children: "\u9009\u62E9\u6316\u6398\u65B9\u5411" }), _jsxs("div", { className: "exp-tabs kb-direction-tabs", role: "tablist", "aria-label": "\u6316\u6398\u65B9\u5411\u7C7B\u578B", children: [_jsx("button", { type: "button", role: "tab", id: "kb-tab-preset", "aria-controls": "kb-preset-panel", "aria-selected": setupTab === "preset", className: setupTab === "preset" ? "active" : "", "data-kb-tab": "preset", onClick: () => setSetupTab("preset"), children: "\u901A\u7528\u9884\u8BBE\u65B9\u5411" }), _jsx("button", { type: "button", role: "tab", id: "kb-tab-explore", "aria-controls": "kb-explore-panel", "aria-selected": setupTab === "explore", className: setupTab === "explore" ? "active" : "", "data-kb-tab": "explore", onClick: () => setSetupTab("explore"), children: "\u65B9\u5411\u63A2\u7D22" })] }), _jsx("div", { id: "kb-preset-panel", role: "tabpanel", "aria-labelledby": "kb-tab-preset", className: setupTab !== "preset" ? "hide" : "", children: _jsx("div", { className: "kb-direction-table-wrap", children: _jsxs("table", { className: "kb-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "kb-dir-check", children: _jsx("span", { className: "sr-only", children: "\u9009\u62E9" }) }), _jsx("th", { className: "kb-dir-title", children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { className: "kb-dir-action", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { id: "general-directions", children: defaultPresets.map(p => {
                                                                const info = getDirInfo(p, "preset");
                                                                const checked = setupGeneral.has(p.id);
                                                                return (_jsxs("tr", { children: [_jsx("td", { className: "kb-dir-check", children: _jsx("input", { type: "checkbox", "data-dir-kind": "preset", "data-dir-id": p.id, "aria-label": `选择${info.name}`, checked: checked, onChange: e => {
                                                                                    const next = new Set(setupGeneral);
                                                                                    if (e.target.checked)
                                                                                        next.add(p.id);
                                                                                    else
                                                                                        next.delete(p.id);
                                                                                    setSetupGeneral(next);
                                                                                } }) }), _jsx("td", { children: info.name }), _jsx("td", { children: info.text }), _jsx("td", { className: "kb-dir-action", children: _jsx("button", { type: "button", className: "job-mini-icon", "data-edit-kind": "preset", "data-edit-id": p.id, "aria-label": `编辑方向 ${info.name}`, title: "\u7F16\u8F91\u65B9\u5411", onClick: () => {
                                                                                    setEditingDir({ kind: "preset", id: p.id });
                                                                                    setEditingName(info.name);
                                                                                    setEditingText(info.text);
                                                                                    setDirEditError("");
                                                                                }, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 20h9" }), _jsx("path", { d: "m16 4 4 4-11 11-4 1 1-4Z" })] }) }) })] }, p.id));
                                                            }) })] }) }) }), _jsx("div", { id: "kb-explore-panel", role: "tabpanel", "aria-labelledby": "kb-tab-explore", className: setupTab !== "explore" ? "hide" : "", children: _jsx("div", { className: "kb-direction-table-wrap", children: _jsxs("table", { className: "kb-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "kb-dir-check", children: _jsx("span", { className: "sr-only", children: "\u9009\u62E9" }) }), _jsx("th", { className: "kb-dir-title", children: "\u65B9\u5411" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { className: "kb-dir-action", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { id: "explored-directions", children: kbExploredDirs.length ? (kbExploredDirs.map(e => {
                                                                const info = getDirInfo(e, "explore");
                                                                const checked = setupExplored.has(e.id);
                                                                return (_jsxs("tr", { children: [_jsx("td", { className: "kb-dir-check", children: _jsx("input", { type: "checkbox", "data-dir-kind": "explore", "data-dir-id": e.id, "aria-label": `选择${info.name}`, checked: checked, onChange: ev => {
                                                                                    const next = new Set(setupExplored);
                                                                                    if (ev.target.checked)
                                                                                        next.add(e.id);
                                                                                    else
                                                                                        next.delete(e.id);
                                                                                    setSetupExplored(next);
                                                                                } }) }), _jsx("td", { children: info.name }), _jsx("td", { children: info.text }), _jsx("td", { className: "kb-dir-action", children: _jsx("button", { type: "button", className: "job-mini-icon", "data-edit-kind": "explore", "data-edit-id": e.id, "aria-label": `编辑方向 ${info.name}`, title: "\u7F16\u8F91\u65B9\u5411", onClick: () => {
                                                                                    setEditingDir({ kind: "explore", id: e.id });
                                                                                    setEditingName(info.name);
                                                                                    setEditingText(info.text);
                                                                                    setDirEditError("");
                                                                                }, children: _jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 20h9" }), _jsx("path", { d: "m16 4 4 4-11 11-4 1 1-4Z" })] }) }) })] }, e.id));
                                                            })) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "kb-directions-empty", children: "\u6240\u9009\u5B50\u6570\u636E\u96C6\u6682\u65E0\u65B9\u5411\u63A2\u7D22\u7ED3\u679C\u3002" }) })) })] }) }) })] }), _jsxs("section", { className: "exp-panel kb-setup-prompt", "aria-labelledby": "kb-prompt-title", children: [_jsxs("div", { className: "kb-prompt-header", children: [_jsx("h2", { id: "kb-prompt-title", children: "\u5B8C\u6574\u63D0\u793A\u8BCD" }), _jsx("button", { type: "button", className: "exp-btn", id: "compose-prompt", onClick: handleRestorePrompt, children: "\u6062\u590D\u81EA\u52A8\u751F\u6210" })] }), _jsx("textarea", { className: "f", id: "prompt-text", "aria-label": "\u5B8C\u6574\u63D0\u793A\u8BCD", spellCheck: false, value: setupPrompt, onChange: e => {
                                                setSetupPrompt(e.target.value);
                                                setSetupPromptDirty(true);
                                            } }), _jsx("div", { className: "kb-prompt-note", id: "prompt-note", "aria-live": "polite", children: setupPromptDirty ? "已手动修改提示词。切换或修改方向不会覆盖手动内容。" : "" })] }), _jsxs("section", { className: "exp-panel kb-setup-confirm", "aria-labelledby": "kb-confirm-title", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { id: "kb-confirm-title", children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "exp-brief", id: "kb-run-summary", "aria-live": "polite", children: [_jsxs("span", { children: ["\u5B50\u6570\u636E\u96C6 ", _jsxs("b", { children: [setupSubsets.size, " \u4E2A"] })] }), _jsxs("span", { children: ["\u6316\u6398\u65B9\u5411 ", _jsxs("b", { children: [allSelectedDirItems.length, " \u9879"] })] }), _jsxs("span", { children: ["\u77E5\u8BC6\u7C7B\u578B ", _jsx("b", { children: setupKind === "normal" ? "良品" : "异常" })] }), _jsxs("span", { children: ["\u8303\u56F4 ", _jsx("b", { children: "\u9009\u4E2D\u5B50\u6570\u636E\u96C6\u5168\u90E8\u5408\u683C\u6765\u6E90" })] }), _jsxs("span", { children: ["\u6A21\u578B ", _jsx("b", { children: "\u5F53\u524D\u5DE5\u4F5C\u53F0\u6A21\u578B" })] })] }), _jsxs("div", { className: "exp-summarybar", children: [_jsx("span", { id: "kb-run-check", role: "status", children: validationProblem || "已满足启动条件" }), _jsx("div", { className: "exp-actions", children: _jsx("button", { type: "button", className: "exp-btn exp-primary", id: "submit-job", disabled: !!validationProblem, onClick: handleSubmitJob, children: "\u5F00\u59CB\u6316\u6398" }) })] }), formError && (_jsx("div", { id: "form-alert", className: "kb-setup-error", role: "alert", children: formError }))] }), _jsx("div", { id: "create-overlay", style: {
                                        display: createOpen ? "block" : "none",
                                        position: "absolute",
                                        pointerEvents: "none",
                                        opacity: 0,
                                        width: 0,
                                        height: 0
                                    } })] }), _jsx("div", { className: "kb-dir-drawer-mask", id: "kb-dir-drawer-mask", role: "presentation", hidden: !editingDir, onClick: e => {
                                if (e.target === e.currentTarget)
                                    closeDirDrawer();
                            }, children: _jsxs("aside", { className: "kb-dir-drawer", id: "kb-dir-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u7F16\u8F91\u6316\u6398\u65B9\u5411", children: [_jsxs("header", { className: "kb-dir-drawer-head", children: [_jsx("h2", { children: "\u7F16\u8F91\u6316\u6398\u65B9\u5411" }), _jsx("button", { type: "button", className: "job-mini-icon", id: "kb-dir-close", "aria-label": "\u5173\u95ED\u65B9\u5411\u7F16\u8F91", title: "\u5173\u95ED", onClick: closeDirDrawer, children: "\u00D7" })] }), _jsxs("div", { className: "kb-dir-drawer-body", children: [_jsx("label", { htmlFor: "kb-dir-edit-name", children: "\u6807\u9898" }), _jsx("input", { id: "kb-dir-edit-name", className: "f", maxLength: 120, value: editingName, onChange: e => setEditingName(e.target.value) }), _jsx("label", { htmlFor: "kb-dir-edit-text", children: "\u63CF\u8FF0" }), _jsx("textarea", { id: "kb-dir-edit-text", className: "f", rows: 9, value: editingText, onChange: e => setEditingText(e.target.value) }), dirEditError && (_jsx("div", { className: "kb-edit-error", id: "kb-dir-edit-error", role: "alert", children: dirEditError }))] }), _jsxs("footer", { className: "kb-dir-drawer-foot", children: [_jsx("button", { type: "button", className: "exp-btn", id: "kb-dir-cancel", onClick: closeDirDrawer, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "exp-btn exp-primary", id: "kb-dir-save", onClick: saveDirEdit, children: "\u4FDD\u5B58" })] })] }) }), _jsxs("div", { className: `lightbox v46-app ${lightboxIndex !== null ? "show" : ""}`, id: "lightbox", role: "dialog", "aria-modal": "true", "aria-label": "\u67E5\u770B\u8BC1\u636E\u56FE\u7247", onClick: closeLight, children: [_jsx("button", { className: "lbclose", id: "close-light", onClick: closeLight, children: "\u00D7" }), _jsx("button", { className: "lbnav left", id: "prev-light", onClick: e => {
                                        e.stopPropagation();
                                        stepLight(-1);
                                    }, children: "\u2039" }), lightboxIndex !== null && lightboxEvidence[lightboxIndex] && (_jsx("img", { id: "light-img", alt: "\u8BC1\u636E\u5927\u56FE", src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%231a2638"/><text x="300" y="230" font-family="sans-serif" font-size="24" fill="%23ffffff" text-anchor="middle">证据图像 样本 ${lightboxEvidence[lightboxIndex].id}</text></svg>`, onClick: e => e.stopPropagation() })), _jsx("button", { className: "lbnav right", id: "next-light", onClick: e => {
                                        e.stopPropagation();
                                        stepLight(1);
                                    }, children: "\u203A" }), _jsxs("div", { className: "lbcaption", id: "light-caption", children: [detailItem?.name, "\uFF0C", lightboxIndex !== null && lightboxEvidence[lightboxIndex]?.role === "support" ? "支持证据" : "反对证据", " ", (lightboxIndex ?? 0) + 1, " / ", lightboxEvidence.length] })] }), _jsx("div", { className: `toast ${toastMsg ? "show" : ""}`, id: "toast", role: "status", children: toastMsg })] }), document.body)] }));
}
