import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { mediaUrl, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { CloseIcon, DeleteIcon, DocumentIcon, DocumentSearchIcon, MineIcon, PlusIcon, RefreshIcon, } from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog } from "./DirectionDetailDialog.js";
import { FullscreenViewer } from "./FullscreenViewer.js";
import { IbaJobPager, IBA_JOBS_PAGE_SIZE } from "./IbaJobPager.js";
const defaultPresets = [
    {
        id: "contrast",
        name: "通用对比探索",
        text: "联合观察本次全部候选良品与异常图像，探索值得后续检查的方向。\n从真实可见的共性、差异、结构关系、正常变化与观察限制出发，不套用固定缺陷分类，不凑方向数量。\n候选角色仅是来源线索，可能存在错标、污染或成像差异；不能把 NG、标注或外观差异直接当作缺陷。\n每项方向说明后续应观察或比较什么，明确适用于良品、异常或两者，并引用本次真实图像 evidence_id 说明依据与限制。\n合并同义方向；证据不足时可以不提出方向。不虚构尺寸、材质、物理功能或不可见部位。\n只输出候选检查议题，不声称完成质量判定、知识挖掘或人工确认。",
    },
    {
        id: "variation",
        name: "正常变化与成像差异",
        text: "联合比较本次良品与异常图组，重点探索正常外观变化与成像变化可能混淆判断的方向。\n观察亮度、反光、视角、位置和可见遮挡在各图中的变化；仅讨论图像实际支持的现象，不推断未知拍摄条件。\n比较同类变化是否同时存在于两组，不因出现于候选良品就认定为正常，也不因出现于候选异常就认定为缺陷。\n提出后续需要对照哪些区域、哪些样例及需要补充什么证据，标明适用范围和局限。\n每项引用本次真实 evidence_id；合并同义项。证据不足可返回空方向，不将探索结论直接作为质量规则。",
    },
    {
        id: "surface",
        name: "表面与局部差异",
        text: "联合观察本次两组图像，探索表面与局部可见差异中值得进一步核查的方向。\n关注纹理、边缘、覆盖、颜色和局部痕迹的共性与差异；这些是可选观察线索，不是必须填满的缺陷类别。\n将疑似局部差异与反光、模糊、阴影和遮挡进行对照；不把所有污点、划痕样外观直接判为异常。\n每项描述可执行的比较位置与观察方法、两组中的支持或反例、适用范围及不可辨认的限制。\n仅引用本次 evidence_id，不虚构不可见细节或像素外的物理尺寸。允许无方向；不输出已确认缺陷结论。",
    },
    {
        id: "assembly",
        name: "结构与装配关系",
        text: "同时比较本次候选良品和异常图组，探索结构、组成及相对位置关系中的可观察检查方向。\n从图像实际出现的轮廓、部件数量、位置、间距、连接和遮挡关系出发，不预设具体产品结构或必有缺陷类别。\n区分姿态与视角变化、可见性不足和可能的结构差异；不凭图像臆测装配规范、内部功能、材质或绝对尺寸。\n为各方向提出后续对照方法，说明适用于哪组或两者，引用真实 evidence_id 及不确定性。\n合并重复方向；证据不足允许返回空结果。探索方向仅供后续选择，不直接改变质量标签。",
    },
];
const defaultDirections = [
    {
        id: "edge",
        title: "边缘过渡与局部形态差异",
        applies: "良品与异常",
        brief: "比较边缘连续性、形状变化及拍摄差异，检查局部变化是否具有重复性。",
        limit: "需排除角度与光照造成的边缘变化。",
    },
    {
        id: "texture",
        title: "表面纹理与细小区域变化",
        applies: "异常",
        brief: "关注局部纹理变化在多张图像中是否表现一致，保留不确定情况。",
        limit: "局部纹理可能由反光、噪声或图像压缩导致。",
    },
    {
        id: "lighting",
        title: "成像亮度与结构一致性",
        applies: "良品",
        brief: "对比正常成像条件下的亮度与结构形态，排除拍摄干扰。",
        limit: "光源变动可造成显著亮度差。",
    },
];
function expElapsed(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m > 0 ? `${m}分` : "") + `${s}秒`;
}
function expJobBadge(status) {
    if (status === "COMPLETED")
        return _jsx("span", { className: "exp-pill ok", children: "\u5DF2\u5B8C\u6210" });
    if (status === "RUNNING")
        return _jsx("span", { className: "exp-pill running", children: "\u8FD0\u884C\u4E2D" });
    if (status === "PENDING")
        return _jsx("span", { className: "exp-pill pending", children: "\u6392\u961F\u4E2D" });
    return _jsx("span", { className: "exp-pill fail", children: "\u5931\u8D25" });
}
let cachedDatasets = null;
let cachedGroups = null;
export function ExplorationPage({ dataset, refreshRevision, headerActions, }) {
    const { workspace } = useWorkspace();
    const initialGroups = buildHierarchyGroups(cachedDatasets || [dataset], cachedGroups || []);
    const initialParentId = getDatasetGroupId(dataset, initialGroups);
    const initialChildren = (cachedDatasets || [dataset]).filter((d) => getDatasetGroupId(d, initialGroups) === initialParentId);
    const [datasets, setDatasets] = useState(() => cachedDatasets || [dataset]);
    const [groups, setGroups] = useState(() => initialGroups);
    const [selectedParentId, setSelectedParentId] = useState(() => initialParentId);
    const [selectedChildIds, setSelectedChildIds] = useState(() => initialChildren.length > 0 ? initialChildren.map((c) => c.dataset_id) : [dataset.dataset_id]);
    // View state: 'jobs' (unified layout) or 'setup' (3-step creation)
    const [view, setView] = useState("jobs");
    const [jobFilter, setJobFilter] = useState("全部");
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [jobPage, setJobPage] = useState(1);
    const [refreshTick, setRefreshTick] = useState(0);
    // Setup state
    const [sampleTab, setSampleTab] = useState("normal");
    const [normalSelected, setNormalSelected] = useState([]);
    const [defectSelected, setDefectSelected] = useState([]);
    const [presets, setPresets] = useState(defaultPresets);
    const [selectedPresetId, setSelectedPresetId] = useState("contrast");
    const [prompt, setPrompt] = useState(defaultPresets[0].text);
    const [originalPrompt, setOriginalPrompt] = useState(defaultPresets[0].text);
    // Modals
    const [modal, setModal] = useState("");
    const [deletingJobId, setDeletingJobId] = useState(null);
    const [promptJobId, setPromptJobId] = useState(null);
    const [viewingDirectionId, setViewingDirectionId] = useState(null);
    const [newPresetName, setNewPresetName] = useState("");
    // Source picker modal state
    const [sourceSearch, setSourceSearch] = useState("");
    const [sourceCategory, setSourceCategory] = useState("all");
    const [sourceSelectedOnly, setSourceSelectedOnly] = useState(false);
    const [sourcePage, setSourcePage] = useState(1);
    // Direction detail interaction
    const [highlightRef, setHighlightRef] = useState(null);
    // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
    const [viewerData, setViewerData] = useState(null);
    useEffect(() => {
        if (modal !== "prompt")
            return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setModal("");
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [modal]);
    // Candidate samples pool
    const [samplePool, setSamplePool] = useState([]);
    // Jobs state initialized to empty array (loaded dynamically from backend API)
    const [jobs, setJobs] = useState([]);
    // Load datasets and hierarchy
    useEffect(() => {
        let active = true;
        request("/datasets")
            .then((res) => {
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
            const children = dsList.filter((d) => getDatasetGroupId(d, grpList) === parentId);
            setSelectedChildIds(children.length > 0 ? children.map((c) => c.dataset_id) : [dataset.dataset_id]);
        })
            .catch(() => {
            if (!active)
                return;
            const grpList = buildHierarchyGroups([dataset], []);
            setGroups(grpList);
            const parentId = getDatasetGroupId(dataset, grpList);
            setSelectedParentId(parentId);
            setSelectedChildIds((prev) => (prev.length ? prev : [dataset.dataset_id]));
        });
        return () => {
            active = false;
        };
    }, [dataset, refreshRevision]);
    // Load presets from server if available
    useEffect(() => {
        let active = true;
        request("/exploration/presets")
            .then((res) => {
            if (active && res.presets?.length) {
                setPresets(res.presets);
                const first = res.presets[0];
                setSelectedPresetId(first.id);
                setPrompt(first.text);
                setOriginalPrompt(first.text);
            }
        })
            .catch(() => { });
        return () => {
            active = false;
        };
    }, []);
    // Load candidate samples for the current child datasets
    useEffect(() => {
        let active = true;
        if (!selectedChildIds.length)
            return;
        Promise.all(selectedChildIds.map((cid) => request(`/samples?dataset_id=${encodeURIComponent(cid)}&page_size=60`)
            .then((res) => ({ cid, items: res.items || [] }))
            .catch(() => ({ cid, items: [] })))).then((results) => {
            if (!active)
                return;
            const pool = [];
            results.forEach(({ cid, items }) => {
                items.forEach((s, sIdx) => {
                    const isNormal = s.quality_status === "PASS" || s.quality_status === "OK" ||
                        (s.quality_status !== "FAIL" && s.quality_status !== "NG" && sIdx % 2 === 0);
                    pool.push({
                        id: s.sample_id,
                        filename: s.relative_path || s.sample_uuid || s.sample_id,
                        url: mediaUrl(s, "thumbnail"),
                        kind: isNormal ? "normal" : "defect",
                        category: s.annotation_categories?.[0] || undefined,
                        datasetId: cid,
                    });
                });
            });
            setSamplePool(pool);
            // Auto-populate initial selection in setup if empty
            const normals = pool.filter((p) => p.kind === "normal").slice(0, 4).map((p) => p.id);
            const defects = pool.filter((p) => p.kind === "defect").slice(0, 4).map((p) => p.id);
            setNormalSelected((prev) => (prev.length ? prev : normals));
            setDefectSelected((prev) => (prev.length ? prev : defects));
        });
        return () => {
            active = false;
        };
    }, [selectedChildIds]);
    // Load real exploration jobs and catalog from backend API for all selected child datasets
    useEffect(() => {
        let active = true;
        if (!selectedChildIds.length) {
            setJobs([]);
            setSelectedJobId(null);
            return;
        }
        Promise.all(selectedChildIds.map(async (cid) => {
            const [jobsRes, catRes] = await Promise.all([
                request(`/exploration/jobs?dataset_id=${encodeURIComponent(cid)}`)
                    .catch(() => ({ jobs: [], pending_count: 0 })),
                request(`/exploration?dataset_id=${encodeURIComponent(cid)}`)
                    .catch(() => null),
            ]);
            return { cid, jobs: jobsRes?.jobs || [], catalog: catRes };
        })).then((results) => {
            if (!active)
                return;
            const allMappedJobs = [];
            results.forEach(({ cid, jobs: rawJobs, catalog: catRes }) => {
                const catalogExp = catRes?.exploration;
                const catalogVersions = catRes?.versions || [];
                rawJobs.forEach((bj) => {
                    const normalList = (bj.normal_sources || []).map((s) => s.sample_id || s);
                    const defectList = (bj.defect_sources || []).map((s) => s.sample_id || s);
                    const elapsedSec = bj.started_at && bj.finished_at
                        ? Math.max(1, Math.round((new Date(bj.finished_at).getTime() - new Date(bj.started_at).getTime()) / 1000))
                        : bj.started_at
                            ? Math.max(1, Math.round((Date.now() - new Date(bj.started_at).getTime()) / 1000))
                            : bj.elapsed || 0;
                    const promptText = typeof bj.exploration_prompt === "object"
                        ? bj.exploration_prompt?.text || ""
                        : typeof bj.exploration_prompt === "string"
                            ? bj.exploration_prompt
                            : bj.instruction || "";
                    const presetName = typeof bj.exploration_prompt === "object"
                        ? bj.exploration_prompt?.preset_id || "contrast"
                        : "contrast";
                    let jobDirections;
                    let jobSummary;
                    let jobLimitations;
                    const isMatchingCatalog = catalogExp && (bj.exploration_version_id === catalogExp.version_id ||
                        catalogVersions.some((v) => v.run_id === bj.run_id) ||
                        rawJobs.length === 1);
                    if (isMatchingCatalog && catalogExp) {
                        jobSummary = catalogExp.summary;
                        jobLimitations = catalogExp.limitations;
                        const evMap = new Map();
                        (catalogExp.evidence || []).forEach((ev) => {
                            if (ev.image?.evidence_id)
                                evMap.set(ev.image.evidence_id, ev);
                        });
                        jobDirections = (catalogExp.directions || []).map((d) => {
                            const evItems = [];
                            let nIdx = 0;
                            let aIdx = 0;
                            (d.evidence_ids || []).forEach((eid) => {
                                const ev = evMap.get(eid);
                                const sid = ev ? ev.sample_id : "";
                                const isNorm = normalList.includes(sid) || sid.includes("OK") || sid.includes("pass");
                                const ref = isNorm ? `N${++nIdx}` : `A${++aIdx}`;
                                const label = isNorm ? `良品 ${ref}` : `异常 ${ref}`;
                                const dsId = sid.includes(":") ? sid.split(":")[0] : bj.dataset_id;
                                const fname = sid.includes("/") ? sid.split("/").pop() : sid;
                                evItems.push({
                                    evidenceId: eid,
                                    sampleId: sid,
                                    ref,
                                    label,
                                    kind: isNorm ? "normal" : "defect",
                                    url: sid ? mediaUrl({ task_id: dsId, sample_id: sid }, "thumbnail") : "",
                                    fullUrl: sid ? mediaUrl({ task_id: dsId, sample_id: sid }, "image") : "",
                                    filename: fname,
                                });
                            });
                            const appliesStr = d.applies_to === "normal" ? "良品" : d.applies_to === "defect" ? "异常" : "通用";
                            return {
                                id: d.direction_id || d.title,
                                title: d.title,
                                applies: appliesStr,
                                brief: d.instruction || "",
                                rationale: d.rationale || "",
                                evidenceIds: d.evidence_ids || [],
                                limit: (d.limitations && d.limitations[0]) || "",
                                limitations: d.limitations || [],
                                evidences: evItems,
                            };
                        });
                    }
                    allMappedJobs.push({
                        id: bj.run_id,
                        scopeKey: bj.dataset_id,
                        datasetIds: [bj.dataset_id],
                        normal: normalList.length ? normalList : (bj.sample_ids || []).filter((s) => s.includes("OK")),
                        defect: defectList.length ? defectList : (bj.sample_ids || []).filter((s) => s.includes("NG")),
                        prompt: promptText,
                        preset: presetName,
                        status: bj.status === "CANCELED" ? "FAILED" : bj.status,
                        phase: bj.status === "COMPLETED" ? 3 : bj.status === "RUNNING" ? 2 : 0,
                        elapsed: elapsedSec,
                        time: bj.submitted_at ? new Date(bj.submitted_at).toLocaleString("zh-CN", { hour12: false }) : "",
                        error: bj.errors?.[0]?.message || bj.message,
                        summary: jobSummary,
                        directions: jobDirections,
                        limitations: jobLimitations,
                        explorationVersionId: bj.exploration_version_id,
                    });
                });
            });
            allMappedJobs.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
            setJobs(allMappedJobs);
            setSelectedJobId((curr) => {
                if (curr && allMappedJobs.some((j) => j.id === curr))
                    return curr;
                return allMappedJobs[0]?.id || null;
            });
        }).catch((err) => {
            console.error("ExplorationPage error in jobs loader:", err);
            if (!active)
                return;
            setJobs([]);
            setSelectedJobId(null);
        });
        return () => {
            active = false;
        };
    }, [selectedChildIds, refreshRevision, refreshTick]);
    // Polling for active background jobs
    useEffect(() => {
        const hasActiveJob = jobs.some((j) => j.status === "RUNNING" || j.status === "PENDING");
        if (!hasActiveJob)
            return;
        const interval = setInterval(() => {
            setRefreshTick((t) => t + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, [jobs]);
    // Derived state
    const parentGroups = groups.length ? groups : buildHierarchyGroups([dataset], []);
    const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d, groups) === selectedParentId);
    const filteredJobs = useMemo(() => {
        return jobs.filter((j) => {
            if (jobFilter === "全部")
                return true;
            return j.status === jobFilter;
        });
    }, [jobs, jobFilter]);
    const jobPages = Math.max(1, Math.ceil(filteredJobs.length / IBA_JOBS_PAGE_SIZE));
    const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
    const shownJobs = useMemo(() => {
        return filteredJobs.slice((currentJobPage - 1) * IBA_JOBS_PAGE_SIZE, currentJobPage * IBA_JOBS_PAGE_SIZE);
    }, [filteredJobs, currentJobPage]);
    const selectedJob = useMemo(() => {
        if (!shownJobs.length)
            return null;
        if (selectedJobId) {
            const match = shownJobs.find((j) => j.id === selectedJobId);
            if (match)
                return match;
        }
        return shownJobs[0] || null;
    }, [shownJobs, selectedJobId]);
    const handleJobPageChange = (newPage) => {
        const targetPage = Math.max(1, Math.min(jobPages, newPage));
        setJobPage(targetPage);
        const firstOnPage = filteredJobs[(targetPage - 1) * IBA_JOBS_PAGE_SIZE];
        if (firstOnPage) {
            setSelectedJobId(firstOnPage.id);
        }
    };
    const runningJob = jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
    const canRun = !runningJob && selectedChildIds.length > 0 && normalSelected.length > 0 && defectSelected.length > 0;
    // Handle parent group change
    const handleParentChange = (newParentId) => {
        setSelectedParentId(newParentId);
        const children = datasets.filter((d) => getDatasetGroupId(d, groups) === newParentId);
        setSelectedChildIds(children.map((c) => c.dataset_id));
        setJobPage(1);
    };
    // Toggle child dataset selection
    const handleChildToggle = (cid) => {
        setSelectedChildIds((prev) => prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]);
        setJobPage(1);
    };
    // Preset selection
    const handlePresetChange = (presetId) => {
        const p = presets.find((x) => x.id === presetId);
        if (p) {
            setSelectedPresetId(presetId);
            setPrompt(p.text);
            setOriginalPrompt(p.text);
        }
    };
    // Start exploration job via real backend API
    const handleStartExploration = async () => {
        if (!canRun)
            return;
        try {
            const targetDatasetId = selectedChildIds[0] || dataset.dataset_id;
            const res = await request("/exploration/start", {
                dataset_id: targetDatasetId,
                normal_images: normalSelected,
                defect_images: defectSelected,
                objective: prompt,
                prompt: {
                    preset_id: selectedPresetId,
                    preset_name: presets.find((p) => p.id === selectedPresetId)?.name || "自定义预设",
                    text: prompt,
                },
            });
            if (res?.run_id) {
                setSelectedJobId(res.run_id);
            }
            setJobPage(1);
            setRefreshTick((t) => t + 1);
            setView("jobs");
        }
        catch (err) {
            console.error("Failed to start exploration", err);
            const newId = `explore_${Date.now()}`;
            const newJob = {
                id: newId,
                scopeKey: selectedParentId + "|" + selectedChildIds.join(","),
                datasetIds: [...selectedChildIds],
                normal: [...normalSelected],
                defect: [...defectSelected],
                prompt,
                preset: selectedPresetId,
                status: "RUNNING",
                phase: 0,
                elapsed: 0,
                time: new Date().toLocaleString("zh-CN", { hour12: false }),
            };
            setJobs([newJob, ...jobs]);
            setSelectedJobId(newId);
            setJobPage(1);
            setView("jobs");
        }
    };
    // Confirm delete job
    const handleConfirmDeleteJob = async () => {
        if (!deletingJobId)
            return;
        const targetId = deletingJobId;
        setModal("");
        setDeletingJobId(null);
        try {
            await request(`/exploration/delete/${encodeURIComponent(targetId)}`, {}, "POST");
        }
        catch (err) {
            console.warn("Delete exploration job error", err);
        }
        setJobs((prevJobs) => {
            const remaining = prevJobs.filter((j) => j.id !== targetId);
            const remainingFiltered = remaining.filter((j) => jobFilter === "全部" || j.status === jobFilter);
            const newPages = Math.max(1, Math.ceil(remainingFiltered.length / IBA_JOBS_PAGE_SIZE));
            const clampedPage = Math.min(newPages, jobPage);
            setJobPage(clampedPage);
            if (selectedJobId === targetId) {
                setSelectedJobId(remainingFiltered[(clampedPage - 1) * IBA_JOBS_PAGE_SIZE]?.id || null);
            }
            return remaining;
        });
    };
    const renderJobDataset = (j) => {
        const storedIds = (j.datasetIds && j.datasetIds.length > 0)
            ? j.datasetIds
            : (j.scopeKey || "").split("|")[1]?.split(",").filter(Boolean) || [j.scopeKey || dataset.dataset_id];
        const childNames = storedIds
            .map((id) => datasets.find((d) => d.dataset_id === id)?.name)
            .filter(Boolean);
        const text = childNames.join("、") || datasets.find((d) => d.dataset_id === (storedIds[0] || j.scopeKey))?.name || "—";
        return (_jsx("div", { className: "exp-job-dataset", title: text, children: _jsx("span", { className: "exp-job-dataset-name", children: text }) }));
    };
    // Helper to find image details from samplePool or fallback to sample media endpoint
    const getImageInfo = (id, kindFallback = "normal") => {
        const found = samplePool.find((p) => p.id === id);
        if (found)
            return found;
        const dsId = id.includes(":") ? id.split(":")[0] : selectedChildIds[0] || dataset.dataset_id;
        const fname = id.includes("/") ? id.split("/").pop() : id;
        return {
            id,
            filename: fname,
            url: id.includes(":")
                ? mediaUrl({ task_id: dsId, sample_id: id }, "thumbnail")
                : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23edf2f7"/><text x="100" y="80" font-family="sans-serif" font-size="14" fill="%234a5568" text-anchor="middle">${id}</text></svg>`,
            kind: kindFallback,
            datasetId: dsId,
        };
    };
    // Build evidence images list for selected job and direction
    const getJobEvidence = (job, dirId) => {
        if (!job)
            return { normals: [], defects: [], all: [] };
        const dir = job.directions?.find((d) => d.id === dirId) || job.directions?.[0];
        if (dir?.evidences && dir.evidences.length > 0) {
            const normals = dir.evidences.filter((e) => e.kind === "normal");
            const defects = dir.evidences.filter((e) => e.kind === "defect");
            return { normals, defects, all: dir.evidences };
        }
        const normals = (job.normal || []).slice(0, 2).map((id, i) => {
            const info = getImageInfo(id, "normal");
            return {
                evidenceId: id,
                sampleId: id,
                ref: `N${i + 1}`,
                label: `良品 N${i + 1}`,
                kind: "normal",
                url: info.url,
                fullUrl: info.url.includes("thumbnail") ? info.url.replace("/thumbnail?size=240", "/image") : info.url,
                filename: info.filename,
            };
        });
        const defects = (job.defect || []).slice(0, 4).map((id, i) => {
            const info = getImageInfo(id, "defect");
            return {
                evidenceId: id,
                sampleId: id,
                ref: `A${i + 1}`,
                label: `异常 A${i + 1}`,
                kind: "defect",
                url: info.url,
                fullUrl: info.url.includes("thumbnail") ? info.url.replace("/thumbnail?size=240", "/image") : info.url,
                filename: info.filename,
            };
        });
        return { normals, defects, all: [...normals, ...defects] };
    };
    const currentEvidence = getJobEvidence(selectedJob, viewingDirectionId);
    // Scroll evidence into view when hovering or clicking chips
    const handleChipFocus = (ref) => {
        setHighlightRef(ref);
    };
    // Open FullscreenViewer on evidence click
    const handleOpenEvidenceFullscreen = (clickedRef) => {
        const allItems = currentEvidence.all.map((item) => ({
            id: item.ref,
            title: `${item.label} · ${item.filename}`,
            imageUrl: item.fullUrl || item.url,
        }));
        const index = currentEvidence.all.findIndex((item) => item.ref === clickedRef);
        setViewerData({
            items: allItems,
            currentIndex: Math.max(0, index),
        });
    };
    return (_jsxs("div", { id: "exploration-page", className: "iad-exploration-page", children: [_jsxs("div", { className: "exp-heading", children: [_jsx("div", { children: _jsx("h1", { children: view === "setup" ? "新建探索" : "方向探索" }) }), _jsx("div", { className: "exp-heading-actions", children: view === "setup" ? (_jsx("button", { type: "button", className: "exp-btn", onClick: () => setView("jobs"), children: "\u8FD4\u56DE\u4F5C\u4E1A\u4E0E\u7ED3\u679C" })) : (_jsx("button", { type: "button", className: "exp-btn exp-primary", disabled: !!runningJob, title: runningJob ? "已有探索任务运行或排队" : "新建探索", onClick: () => setView("setup"), children: "\u65B0\u5EFA\u63A2\u7D22" })) })] }), _jsx(DatasetScopeSelector, { className: "exp-scope", groups: parentGroups, selectedGroupId: selectedParentId, onGroupChange: handleParentChange, childDatasets: currentChildDatasets, selectedChildIds: selectedChildIds, onChildToggle: handleChildToggle, disabled: !!runningJob, groupId: "exp-parent", childId: "exp-child-toggle", childMenuId: "exp-child-menu", children: _jsx("button", { id: "refresh", type: "button", className: "iad-subtle-icon refresh-btn dc-icn", title: "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", "aria-label": "\u5237\u65B0\u63A2\u7D22\u4F5C\u4E1A", disabled: !!runningJob, onClick: () => {
                        setRefreshTick((t) => t + 1);
                    }, children: _jsx(RefreshIcon, { size: 17 }) }) }), view === "setup" ? (_jsxs("div", { children: [_jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "1. \u9009\u62E9\u5BF9\u6BD4\u6837\u4F8B" }) }), _jsxs("div", { className: "exp-tab-header", children: [_jsxs("div", { className: "exp-sample-tabs", role: "tablist", "aria-label": "\u5BF9\u6BD4\u6837\u4F8B", children: [_jsxs("button", { type: "button", role: "tab", "aria-selected": sampleTab === "normal", className: sampleTab === "normal" ? "active" : "", onClick: () => setSampleTab("normal"), children: ["\u826F\u54C1\u6837\u4F8B (", normalSelected.length, ")"] }), _jsxs("button", { type: "button", role: "tab", "aria-selected": sampleTab === "defect", className: sampleTab === "defect" ? "active" : "", onClick: () => setSampleTab("defect"), children: ["\u5F02\u5E38\u6837\u4F8B (", defectSelected.length, ")"] })] }), _jsx("button", { type: "button", className: "exp-clear-icon icon-button iad-icon-button", disabled: sampleTab === "normal" ? !normalSelected.length : !defectSelected.length, title: "\u6E05\u7A7A\u5F53\u524D\u9875\u5DF2\u9009\u56FE\u50CF", "aria-label": `清空${sampleTab === "normal" ? "良品" : "异常"}已选图像`, onClick: () => {
                                            if (sampleTab === "normal")
                                                setNormalSelected([]);
                                            else
                                                setDefectSelected([]);
                                        }, children: _jsx(DeleteIcon, {}) })] }), _jsx("div", { className: "exp-sample-body", children: _jsxs("div", { className: "exp-previews exp-previews-wide", children: [(sampleTab === "normal" ? normalSelected : defectSelected).map((id) => {
                                            const item = getImageInfo(id, sampleTab);
                                            return (_jsxs("div", { className: "exp-preview", children: [_jsx("img", { src: item.url, alt: item.filename }), _jsx("span", { title: item.filename, children: item.filename })] }, id));
                                        }), _jsx("div", { className: "exp-preview add-tile", children: _jsxs("button", { type: "button", className: "exp-add-image", "aria-label": `继续添加${sampleTab === "normal" ? "良品" : "异常"}图像`, title: "\u7EE7\u7EED\u6DFB\u52A0\u56FE\u50CF", onClick: () => {
                                                    setSourceSearch("");
                                                    setSourceCategory("all");
                                                    setSourceSelectedOnly(false);
                                                    setSourcePage(1);
                                                    setModal("source");
                                                }, children: [_jsx(PlusIcon, { size: 24 }), !(sampleTab === "normal" ? normalSelected : defectSelected).length && _jsx("span", { children: "\u6DFB\u52A0\u56FE\u50CF" })] }) })] }) })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "2. \u63A2\u7D22\u63D0\u793A\u8BCD" }) }), _jsxs("div", { className: "exp-prompt-head", children: [_jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u9884\u8BBE", _jsx("select", { id: "exp-preset", value: selectedPresetId, onChange: (e) => handlePresetChange(e.target.value), children: presets.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) })] }), _jsx("button", { type: "button", className: "exp-btn", disabled: prompt === originalPrompt, onClick: () => setPrompt(originalPrompt), children: "\u91CD\u7F6E\u4E3A\u9884\u8BBE" }), _jsx("button", { type: "button", className: "exp-btn", disabled: !prompt.trim(), onClick: () => {
                                            setNewPresetName("");
                                            setModal("save");
                                        }, children: "\u53E6\u5B58\u4E3A\u9884\u8BBE" })] }), _jsxs("label", { className: "exp-input", children: ["\u63D0\u793A\u8BCD\u6B63\u6587", _jsx("textarea", { id: "exp-prompt", rows: 7, value: prompt, onChange: (e) => setPrompt(e.target.value) })] })] }), _jsxs("section", { className: "exp-panel", children: [_jsx("div", { className: "exp-panel-title", children: _jsx("h2", { children: "3. \u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "exp-brief", children: [_jsxs("span", { children: ["\u6240\u9009\u5B50\u6570\u636E\u96C6 ", _jsxs("b", { children: [selectedChildIds.length, " \u4E2A"] })] }), _jsxs("span", { children: ["\u8F93\u5165\u56FE\u50CF ", _jsxs("b", { children: ["\u826F\u54C1 ", normalSelected.length, " \u00B7 \u5F02\u5E38 ", defectSelected.length] })] }), _jsxs("span", { children: ["\u6A21\u578B ", _jsx("b", { children: "Qwen3.8-27B-FP8\uFF08\u793A\u4F8B\uFF09" })] }), _jsxs("span", { children: ["\u6267\u884C ", _jsx("b", { children: "\u6574\u7EC4\u8054\u5408\u8F93\u5165" })] })] }), _jsxs("div", { className: "exp-summarybar", children: [_jsx("span", { style: { fontSize: 12, color: canRun ? "#58718c" : "#8b5660" }, children: runningJob
                                            ? "当前已有探索运行，暂不可重复启动"
                                            : !selectedChildIds.length
                                                ? "请选择子数据集"
                                                : !normalSelected.length || !defectSelected.length
                                                    ? "请至少选择 1 张良品和 1 张异常图像"
                                                    : "可启动" }), _jsx("button", { type: "button", className: "exp-btn exp-primary", disabled: !canRun, onClick: handleStartExploration, children: "\u542F\u52A8\u8054\u5408\u63A2\u7D22" })] })] })] })) : (_jsxs("div", { className: "exp-unified-layout", children: [_jsxs("section", { className: `exp-panel exp-job-list ${jobPages > 1 ? 'iba-job-multipage' : ''}`, "aria-label": "\u63A2\u7D22\u4F5C\u4E1A", children: [_jsxs("div", { className: "exp-job-list-head", children: [_jsx("h2", { children: "\u63A2\u7D22\u4F5C\u4E1A" }), _jsx("div", { className: "exp-job-list-actions", children: _jsx("label", { className: "exp-input", "aria-label": "\u7B5B\u9009\u4F5C\u4E1A\u72B6\u6001", children: _jsxs("select", { id: "exp-jobfilter", "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: jobFilter, onChange: (e) => {
                                                    setJobFilter(e.target.value);
                                                    setJobPage(1);
                                                }, children: [_jsx("option", { value: "\u5168\u90E8", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "PENDING", children: "\u6392\u961F\u4E2D" }), _jsx("option", { value: "RUNNING", children: "\u8FD0\u884C\u4E2D" }), _jsx("option", { value: "COMPLETED", children: "\u5DF2\u5B8C\u6210" }), _jsx("option", { value: "FAILED", children: "\u5931\u8D25" })] }) }) })] }), filteredJobs.length ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "exp-job-table-wrap", role: "region", "aria-label": "\u63A2\u7D22\u4F5C\u4E1A\u5217\u8868", tabIndex: 0, children: _jsxs("table", { className: "exp-job-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A ID" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u6570\u636E\u96C6" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { className: "exp-prompt-action-col", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: shownJobs.map((j) => (_jsxs("tr", { "data-action": "select-job", "data-id": j.id, "data-selected": selectedJob?.id === j.id, "aria-selected": selectedJob?.id === j.id, tabIndex: 0, role: "button", "aria-label": `选择作业 ${j.id}`, onClick: () => setSelectedJobId(j.id), children: [_jsx("td", { children: _jsx("strong", { className: "exp-row-title", children: j.id }) }), _jsx("td", { children: expJobBadge(j.status) }), _jsx("td", { children: renderJobDataset(j) }), _jsx("td", { className: "exp-job-time", children: j.time || "—" }), _jsx("td", { className: "exp-job-duration", children: j.status === "PENDING" ? "—" : expElapsed(j.elapsed) }), _jsx("td", { className: "exp-prompt-action-col", children: _jsxs("div", { className: "exp-job-icon-actions", onClick: (e) => e.stopPropagation(), children: [_jsx(IconButton, { label: "\u67E5\u770B\u63D0\u793A\u8BCD", title: "\u67E5\u770B\u63D0\u793A\u8BCD", className: "exp-row-icon icon-button", "data-exp": "show-prompt", "data-id": j.id, onClick: () => {
                                                                                setPromptJobId(j.id);
                                                                                setModal("prompt");
                                                                            }, children: _jsx(DocumentIcon, {}) }), _jsx(IconButton, { label: "\u5220\u9664\u4F5C\u4E1A", title: j.status === "RUNNING" || j.status === "PENDING" ? "请先停止运行中的作业" : "删除作业", "data-delete": "true", "data-exp": "ask-delete-job", "data-id": j.id, className: "exp-row-icon danger icon-button", disabled: j.status === "RUNNING" || j.status === "PENDING", onClick: () => {
                                                                                setDeletingJobId(j.id);
                                                                                setModal("delete-job");
                                                                            }, children: _jsx(DeleteIcon, {}) })] }) })] }, j.id))) })] }) }), _jsx(IbaJobPager, { total: filteredJobs.length, page: currentJobPage, onPage: handleJobPageChange, label: "\u63A2\u7D22\u4F5C\u4E1A", dataActionAttr: "data-exp", dataActionName: "job-page" })] })) : (_jsx("div", { className: "exp-job-empty", role: "status", children: jobs.length ? "没有匹配的作业" : "当前数据集尚无探索作业。" }))] }), !selectedJob ? (_jsxs("section", { className: "exp-panel exp-selected-result exp-empty-result", "aria-label": "\u63A2\u7D22\u7ED3\u679C", children: [_jsx("div", { className: "exp-selected-head", children: _jsx("div", { children: _jsx("h2", { children: "\u63A2\u7D22\u7ED3\u679C" }) }) }), _jsx("div", { className: "exp-result-empty-message", role: "status", children: jobs.length
                                    ? "当前筛选条件下没有匹配的探索作业。"
                                    : "当前数据集尚未产生探索作业。从右上角「新建探索」选择良品和异常样例，建立适合当前数据集的探索方向。" })] })) : selectedJob.status === "PENDING" || selectedJob.status === "RUNNING" ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u6267\u884C\u9636\u6BB5", children: [_jsx("div", { className: "exp-selected-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u8FD0\u884C\u72B6\u6001" }), _jsx("span", { className: "exp-selected-sub", children: selectedJob.id })] }) }), _jsxs("div", { className: "exp-job-current-title", style: { margin: "0 0 17px" }, children: [_jsx("span", { className: `exp-pill ${selectedJob.status === "PENDING" ? "pending" : "running"}`, children: selectedJob.status === "PENDING" ? "排队中" : "运行中" }), _jsx("strong", { children: selectedJob.status === "PENDING"
                                            ? "等待执行"
                                            : ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"][selectedJob.phase || 0] }), _jsx("span", { className: "exp-lead", children: selectedJob.status === "PENDING" ? "等待队列安排" : `已用时 ${expElapsed(selectedJob.elapsed)}` })] }), _jsx("div", { className: "exp-job-stages", role: "list", "aria-label": "\u6267\u884C\u9636\u6BB5", children: ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"].map((p, i) => {
                                    const pending = selectedJob.status === "PENDING";
                                    const state = pending ? "waiting" : i < selectedJob.phase ? "done" : i === selectedJob.phase ? "current" : "waiting";
                                    return (_jsxs("div", { role: "listitem", className: "exp-job-stage", "data-state": state, children: [_jsx("span", { className: "exp-job-stage-icon", children: !pending && i < selectedJob.phase ? "✓" : i + 1 }), _jsx("span", { className: "exp-job-stage-label", children: p })] }, p));
                                }) }), _jsx("div", { className: "exp-result-neutral", children: "\u65B9\u5411\u5C1A\u672A\u53D1\u5E03\uFF0C\u5B8C\u6210\u540E\u5C06\u5728\u8FD9\u91CC\u663E\u793A\u672C\u6B21\u4F5C\u4E1A\u7684\u5019\u9009\u65B9\u5411\u4E0E\u6574\u4F53\u9650\u5236\u3002" })] })) : selectedJob.status === "FAILED" ? (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u9519\u8BEF\u4FE1\u606F", children: [_jsx("div", { className: "exp-selected-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u4F5C\u4E1A\u5931\u8D25" }), _jsx("span", { className: "exp-selected-sub", children: selectedJob.id })] }) }), _jsx("p", { className: "exp-error-message", children: selectedJob.error || "任务未成功完成，未生成探索结果。" }), _jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u4F5C\u4E1A\u6CA1\u6709\u53EF\u7528\u7684\u5019\u9009\u65B9\u5411\u6216\u6574\u4F53\u9650\u5236\u3002" }), _jsx("button", { type: "button", className: "exp-btn", disabled: !!runningJob, onClick: () => {
                                    setNormalSelected([...selectedJob.normal]);
                                    setDefectSelected([...selectedJob.defect]);
                                    setPrompt(selectedJob.prompt);
                                    setView("setup");
                                }, children: "\u4F7F\u7528\u8BE5\u914D\u7F6E\u65B0\u5EFA" })] })) : (_jsxs("section", { className: "exp-panel exp-selected-result", "aria-label": "\u6240\u9009\u4F5C\u4E1A\u7684\u63A2\u7D22\u7ED3\u679C", children: [_jsx("div", { className: "exp-selected-head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u63A2\u7D22\u7ED3\u679C" }), _jsx("span", { className: "exp-selected-sub", children: selectedJob.id })] }) }), selectedJob.summary && _jsx("p", { className: "exp-result-summary", children: selectedJob.summary }), _jsx("div", { className: "exp-result-section-head", children: _jsx("h3", { children: "\u5019\u9009\u65B9\u5411" }) }), _jsx("div", { className: "exp-job-table-wrap", children: _jsxs("table", { className: "exp-job-table exp-direction-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65B9\u5411" }), _jsx("th", { children: "\u9002\u7528\u77E5\u8BC6" }), _jsx("th", { children: "\u8BC1\u636E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: selectedJob.directions && selectedJob.directions.length > 0 ? (selectedJob.directions.map((d) => (_jsxs("tr", { role: "button", tabIndex: 0, "data-action": "direction", "data-id": d.id, "aria-label": `查看方向 ${d.title}`, onClick: () => {
                                                    setViewingDirectionId(d.id);
                                                    setModal("direction");
                                                }, children: [_jsxs("td", { children: [_jsx("strong", { className: "exp-row-title", children: d.title }), _jsx("span", { className: "exp-row-info", children: d.brief })] }), _jsx("td", { children: d.applies }), _jsxs("td", { children: [d.evidences?.length || d.evidenceIds?.length || (Math.min(selectedJob.normal.length, 2) + Math.min(selectedJob.defect.length, 4)), " \u5F20"] }), _jsxs("td", { className: "exp-direction-action", onClick: (e) => e.stopPropagation(), children: [_jsx(IconButton, { label: "\u67E5\u770B\u65B9\u5411", title: "\u67E5\u770B\u65B9\u5411", className: "exp-row-icon exp-direction-view-icon exp-view-detail-button icon-button", onClick: () => {
                                                                    setViewingDirectionId(d.id);
                                                                    setModal("direction");
                                                                }, children: _jsx(DocumentSearchIcon, {}) }), _jsx(IconButton, { label: "\u53BB\u77E5\u8BC6\u6316\u6398", title: "\u7528\u8BE5\u65B9\u5411\u8FDB\u884C\u77E5\u8BC6\u6316\u6398", className: "exp-row-icon exp-direction-mine-icon icon-button plus-action", onClick: () => {
                                                                    workspace.openLocation({
                                                                        pageId: "industrial-knowledge",
                                                                        datasetId: dataset.dataset_id,
                                                                        knowledgeKind: d.applies === "良品" ? "normal" : "defect",
                                                                        directionFocus: d.id,
                                                                        tab: "setup",
                                                                    });
                                                                }, children: _jsx(MineIcon, {}) })] })] }, d.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { textAlign: "center", padding: "28px 16px", color: "#64748b" }, children: "\u672C\u6B21\u4F5C\u4E1A\u672A\u751F\u6210\u5019\u9009\u65B9\u5411" }) })) })] }) }), _jsxs("div", { className: "exp-limitations", children: [_jsx("div", { className: "exp-result-section-head", children: _jsx("h3", { children: "\u6574\u4F53\u9650\u5236" }) }), selectedJob.limitations?.length ? (_jsx("ol", { children: selectedJob.limitations.map((text, i) => (_jsx("li", { children: text }, i))) })) : (_jsx("p", { className: "exp-lead", children: "\u672C\u6B21\u672A\u8BB0\u5F55\u6574\u4F53\u9650\u5236\u3002" }))] })] }))] })), typeof document !== "undefined" &&
                createPortal(_jsxs(_Fragment, { children: [modal === "prompt" && promptJobId && (_jsx("div", { className: "exp-modal exp-prompt-overlay", id: "exp-prompt-overlay", role: "presentation", onClick: () => setModal(""), children: _jsxs("aside", { className: "exp-prompt-drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": "exp-prompt-title", tabIndex: -1, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "exp-prompt-drawer-head", children: [_jsx("h2", { id: "exp-prompt-title", children: "\u63A2\u7D22\u63D0\u793A\u8BCD" }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("button", { type: "button", className: "exp-btn small", id: "copy-exp-prompt", onClick: async () => {
                                                            const text = jobs.find((j) => j.id === promptJobId)?.prompt || "本次作业未记录提示词正文。";
                                                            try {
                                                                await navigator.clipboard.writeText(text);
                                                            }
                                                            catch (_) { }
                                                        }, children: "\u590D\u5236\u63D0\u793A\u8BCD" }), _jsx(IconButton, { label: "\u5173\u95ED\u63D0\u793A\u8BCD\u62BD\u5C49", title: "\u5173\u95ED", className: "exp-prompt-close drawer-close exp-ghost", onClick: () => setModal(""), children: _jsx(CloseIcon, {}) })] })] }), _jsx("div", { className: "exp-prompt-drawer-content", children: _jsx("div", { className: "exp-prompt-readonly", children: jobs.find((j) => j.id === promptJobId)?.prompt || "本次作业未记录提示词正文。" }) })] }) })), modal === "delete-job" && deletingJobId && (_jsx("div", { className: "exp-modal", id: "exp-modal", children: _jsxs("div", { className: "exp-dialog small", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u63A2\u7D22\u4F5C\u4E1A", children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: "\u5220\u9664\u63A2\u7D22\u4F5C\u4E1A" }), _jsx(IconButton, { label: "\u5173\u95ED", className: "modal-x exp-ghost", onClick: () => setModal(""), children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "exp-dialog-main", children: [_jsxs("p", { className: "exp-delete-text", children: ["\u786E\u5B9A\u5220\u9664\u4F5C\u4E1A ", _jsx("strong", { children: deletingJobId }), " \u5417\uFF1F"] }), _jsx("p", { className: "exp-delete-note", children: "\u8BE5\u4F5C\u4E1A\u5BF9\u5E94\u7684\u5019\u9009\u65B9\u5411\u548C\u6574\u4F53\u9650\u5236\u5C06\u4E00\u5E76\u79FB\u9664\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002" })] }), _jsxs("div", { className: "exp-dialog-foot", children: [_jsx("button", { type: "button", className: "exp-btn", onClick: () => setModal(""), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "exp-btn exp-delete-confirm", onClick: handleConfirmDeleteJob, children: "\u5220\u9664\u4F5C\u4E1A" })] })] }) })), modal === "save" && (_jsx("div", { className: "exp-modal", id: "exp-modal", children: _jsxs("div", { className: "exp-dialog small", role: "dialog", "aria-modal": "true", "aria-label": "\u53E6\u5B58\u4E3A\u63D0\u793A\u8BCD\u9884\u8BBE", children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsx("strong", { children: "\u53E6\u5B58\u4E3A\u63D0\u793A\u8BCD\u9884\u8BBE" }), _jsx(IconButton, { label: "\u5173\u95ED", className: "modal-x exp-ghost", onClick: () => setModal(""), children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "exp-dialog-main", children: _jsxs("label", { className: "exp-input", children: ["\u9884\u8BBE\u540D\u79F0", _jsx("input", { id: "exp-new-preset", placeholder: "\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0", value: newPresetName, onChange: (e) => setNewPresetName(e.target.value) })] }) }), _jsxs("div", { className: "exp-dialog-foot", children: [_jsx("button", { type: "button", className: "exp-btn", onClick: () => setModal(""), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "exp-btn exp-primary", disabled: !newPresetName.trim(), onClick: () => {
                                                    const newP = {
                                                        id: `custom_${Date.now()}`,
                                                        name: newPresetName.trim(),
                                                        text: prompt,
                                                    };
                                                    setPresets([...presets, newP]);
                                                    setSelectedPresetId(newP.id);
                                                    setOriginalPrompt(prompt);
                                                    setModal("");
                                                }, children: "\u4FDD\u5B58" })] })] }) })), modal === "source" && (_jsx("div", { className: "exp-modal", id: "exp-modal", children: _jsxs("div", { className: "exp-dialog exp-source-dialog", role: "dialog", "aria-modal": "true", "aria-label": `选择${sampleTab === "normal" ? "良品" : "异常"}图像`, children: [_jsxs("div", { className: "exp-dialog-head", children: [_jsxs("strong", { children: ["\u9009\u62E9", sampleTab === "normal" ? "良品" : "异常", "\u56FE\u50CF"] }), _jsx(IconButton, { label: "\u5173\u95ED", className: "modal-x exp-ghost", onClick: () => setModal(""), children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "exp-dialog-main", children: [_jsxs("div", { className: "exp-source-scope exp-source-scope-clean", children: [_jsxs("label", { className: "exp-input", children: ["\u641C\u7D22\u56FE\u50CF", _jsx("input", { id: "exp-source-search", type: "search", placeholder: "\u6587\u4EF6\u540D", value: sourceSearch, onChange: (e) => {
                                                                    setSourceSearch(e.target.value);
                                                                    setSourcePage(1);
                                                                } })] }), sampleTab === "defect" && (_jsxs("label", { className: "exp-input", children: ["\u6807\u6CE8\u7C7B\u522B", _jsxs("select", { id: "exp-source-category", value: sourceCategory, onChange: (e) => {
                                                                    setSourceCategory(e.target.value);
                                                                    setSourcePage(1);
                                                                }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u7C7B\u522B" }), [...new Set(samplePool.map((s) => s.category).filter(Boolean))].map((c) => (_jsx("option", { value: c, children: c }, c)))] })] })), _jsxs("label", { className: "exp-source-only", children: [_jsx("input", { id: "exp-only-selected", type: "checkbox", checked: sourceSelectedOnly, onChange: (e) => {
                                                                    setSourceSelectedOnly(e.target.checked);
                                                                    setSourcePage(1);
                                                                } }), "\u4EC5\u770B\u5DF2\u9009"] })] }), (() => {
                                                const selectedList = sampleTab === "normal" ? normalSelected : defectSelected;
                                                const filtered = samplePool.filter((s) => {
                                                    if (s.kind !== sampleTab)
                                                        return false;
                                                    if (sourceSelectedOnly && !selectedList.includes(s.id))
                                                        return false;
                                                    if (sourceSearch.trim() && !s.filename.toLowerCase().includes(sourceSearch.trim().toLowerCase()))
                                                        return false;
                                                    if (sourceCategory !== "all" && s.category !== sourceCategory)
                                                        return false;
                                                    return true;
                                                });
                                                const totalPages = Math.ceil(filtered.length / 24) || 1;
                                                const page = Math.max(1, Math.min(sourcePage, totalPages));
                                                const visible = filtered.slice((page - 1) * 24, page * 24);
                                                return (_jsxs(_Fragment, { children: [_jsx("div", { className: "exp-source-grid", children: visible.map((item) => {
                                                                const isChosen = selectedList.includes(item.id);
                                                                return (_jsxs("label", { className: `exp-source-option ${isChosen ? "chosen" : ""}`, children: [_jsx("img", { src: item.url, alt: item.filename }), _jsxs("span", { className: "exp-select-meta", children: [_jsx("input", { type: "checkbox", checked: isChosen, onChange: (e) => {
                                                                                        if (sampleTab === "normal") {
                                                                                            setNormalSelected((prev) => e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id));
                                                                                        }
                                                                                        else {
                                                                                            setDefectSelected((prev) => e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id));
                                                                                        }
                                                                                    } }), _jsx("span", { title: item.filename, children: item.filename })] })] }, item.id));
                                                            }) }), !visible.length && _jsx("p", { className: "exp-lead", children: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u56FE\u50CF" }), _jsxs("div", { className: "pagination", style: { marginTop: 18 }, children: [_jsx("button", { type: "button", disabled: page === 1, onClick: () => setSourcePage((p) => Math.max(1, p - 1)), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: [page, " / ", totalPages] }), _jsx("button", { type: "button", disabled: page >= totalPages, onClick: () => setSourcePage((p) => p + 1), children: "\u4E0B\u4E00\u9875" }), _jsxs("span", { children: ["\u5171 ", filtered.length, " \u5F20\u56FE\u50CF"] })] })] }));
                                            })()] }), _jsx("div", { className: "exp-dialog-foot", children: _jsx("button", { type: "button", className: "exp-btn exp-primary", onClick: () => setModal(""), children: "\u5B8C\u6210\u9009\u62E9" }) })] }) })), modal === "direction" && viewingDirectionId && selectedJob && (_jsx(DirectionDetailDialog, { direction: (selectedJob.directions || []).find((x) => x.id === viewingDirectionId) ||
                                selectedJob.directions?.[0], evidence: currentEvidence, highlightRef: highlightRef, onHighlightRef: setHighlightRef, onChipFocus: handleChipFocus, onOpenFullscreen: handleOpenEvidenceFullscreen, onClose: () => setModal("") })), viewerData && (_jsx(FullscreenViewer, { open: true, item: viewerData.items[viewerData.currentIndex] || null, items: viewerData.items, currentIndex: viewerData.currentIndex, onClose: () => setViewerData(null), onNavigate: (idx) => setViewerData((prev) => (prev ? { ...prev, currentIndex: idx } : null)) }))] }), document.body)] }));
}
