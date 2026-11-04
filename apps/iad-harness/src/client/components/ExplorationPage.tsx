import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dataset, DatasetGroup, Sample } from "../../shared/contracts.js";
import { mediaUrl, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import {
  CloseIcon,
  ChevronIcon,
  DeleteIcon,
  DocumentIcon,
  DocumentSearchIcon,
  EyeIcon,
  MineIcon,
  PlusIcon,
  RefreshIcon,
} from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import { DirectionDetailDialog, type DirectionItem, type DirectionEvidenceItem } from "./DirectionDetailDialog.js";
import { FullscreenViewer, type FullscreenViewerItem } from "./FullscreenViewer.js";
import { IbaJobPager, IBA_JOBS_PAGE_SIZE } from "./IbaJobPager.js";

interface PresetItem {
  id: string;
  name: string;
  text: string;
}

const defaultPresets: PresetItem[] = [
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

const defaultDirections: DirectionItem[] = [
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

interface JobItem {
  id: string;
  scopeKey: string;
  datasetIds: string[];
  normal: string[];
  defect: string[];
  prompt: string;
  preset: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  phase: number;
  elapsed: number;
  time: string;
  error?: string;
  summary?: string;
  directions?: DirectionItem[];
  limitations?: string[];
  explorationVersionId?: string;
}

interface SampleItem {
  id: string;
  filename: string;
  url: string;
  kind: "normal" | "defect";
  category?: string;
  datasetId: string;
}

function expElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (m > 0 ? `${m}分` : "") + `${s}秒`;
}

function expJobBadge(status: string) {
  if (status === "COMPLETED") return <span className="exp-pill ok">已完成</span>;
  if (status === "RUNNING") return <span className="exp-pill running">运行中</span>;
  if (status === "PENDING") return <span className="exp-pill pending">排队中</span>;
  return <span className="exp-pill fail">失败</span>;
}

let cachedDatasets: Dataset[] | null = null;
let cachedGroups: DatasetGroup[] | null = null;

export function ExplorationPage({
  dataset,
  refreshRevision,
  headerActions,
}: {
  dataset: Dataset;
  refreshRevision: number;
  headerActions: React.ReactNode;
}) {
  const { workspace } = useWorkspace();
  const initialGroups = buildHierarchyGroups(cachedDatasets || [dataset], cachedGroups || []);
  const initialParentId = getDatasetGroupId(dataset, initialGroups);
  const initialChildren = (cachedDatasets || [dataset]).filter(
    (d) => getDatasetGroupId(d, initialGroups) === initialParentId
  );
  const [datasets, setDatasets] = useState<Dataset[]>(() => cachedDatasets || [dataset]);
  const [groups, setGroups] = useState<DatasetGroup[]>(() => initialGroups);
  const [selectedParentId, setSelectedParentId] = useState<string>(() => initialParentId);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(() =>
    initialChildren.length > 0 ? initialChildren.map((c) => c.dataset_id) : [dataset.dataset_id]
  );

  // View state: 'jobs' (unified layout) or 'setup' (3-step creation)
  const [view, setView] = useState<"jobs" | "setup">("jobs");
  const [jobFilter, setJobFilter] = useState("全部");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobPage, setJobPage] = useState<number>(1);
  const [refreshTick, setRefreshTick] = useState(0);

  // Setup state
  const [sampleTab, setSampleTab] = useState<"normal" | "defect">("normal");
  const [normalSelected, setNormalSelected] = useState<string[]>([]);
  const [defectSelected, setDefectSelected] = useState<string[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>(defaultPresets);
  const [selectedPresetId, setSelectedPresetId] = useState("contrast");
  const [prompt, setPrompt] = useState(defaultPresets[0].text);
  const [originalPrompt, setOriginalPrompt] = useState(defaultPresets[0].text);

  // Modals
  const [modal, setModal] = useState<"" | "source" | "delete-job" | "save" | "direction" | "prompt">("");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [promptJobId, setPromptJobId] = useState<string | null>(null);
  const [viewingDirectionId, setViewingDirectionId] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState("");

  // Source picker modal state
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceCategory, setSourceCategory] = useState("all");
  const [sourceSelectedOnly, setSourceSelectedOnly] = useState(false);
  const [sourcePage, setSourcePage] = useState(1);

  // Direction detail interaction
  const [highlightRef, setHighlightRef] = useState<string | null>(null);

  // Fullscreen Viewer state (reusing shared FullscreenViewer.tsx)
  const [viewerData, setViewerData] = useState<{
    items: FullscreenViewerItem[];
    currentIndex: number;
  } | null>(null);

  useEffect(() => {
    if (modal !== "prompt") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
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
  const [samplePool, setSamplePool] = useState<SampleItem[]>([]);

  // Jobs state initialized to empty array (loaded dynamically from backend API)
  const [jobs, setJobs] = useState<JobItem[]>([]);

  // Load datasets and hierarchy
  useEffect(() => {
    let active = true;
    request<{ datasets: Dataset[]; groups?: DatasetGroup[] }>("/datasets")
      .then((res) => {
        if (!active) return;
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
        if (!active) return;
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
    request<{ presets: PresetItem[] }>("/exploration/presets")
      .then((res) => {
        if (active && res.presets?.length) {
          setPresets(res.presets);
          const first = res.presets[0];
          setSelectedPresetId(first.id);
          setPrompt(first.text);
          setOriginalPrompt(first.text);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load candidate samples for the current child datasets
  useEffect(() => {
    let active = true;
    if (!selectedChildIds.length) return;
    Promise.all(
      selectedChildIds.map((cid) =>
        request<{ items: Sample[]; total: number }>(`/samples?dataset_id=${encodeURIComponent(cid)}&page_size=60`)
          .then((res) => ({ cid, items: res.items || [] }))
          .catch(() => ({ cid, items: [] }))
      )
    ).then((results) => {
      if (!active) return;
      const pool: SampleItem[] = [];
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

    Promise.all(
      selectedChildIds.map(async (cid) => {
        const [jobsRes, catRes] = await Promise.all([
          request<{ jobs: any[]; pending_count: number }>(`/exploration/jobs?dataset_id=${encodeURIComponent(cid)}`)
            .catch(() => ({ jobs: [], pending_count: 0 })),
          request<any>(`/exploration?dataset_id=${encodeURIComponent(cid)}`)
            .catch(() => null),
        ]);
        return { cid, jobs: jobsRes?.jobs || [], catalog: catRes };
      })
    ).then((results) => {
      if (!active) return;
      const allMappedJobs: JobItem[] = [];

      results.forEach(({ cid, jobs: rawJobs, catalog: catRes }) => {
        const catalogExp = catRes?.exploration;
        const catalogVersions = catRes?.versions || [];

        rawJobs.forEach((bj: any) => {
          const normalList = (bj.normal_sources || []).map((s: any) => s.sample_id || s);
          const defectList = (bj.defect_sources || []).map((s: any) => s.sample_id || s);
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

          let jobDirections: DirectionItem[] | undefined;
          let jobSummary: string | undefined;
          let jobLimitations: string[] | undefined;

          const isMatchingCatalog = catalogExp && (
            bj.exploration_version_id === catalogExp.version_id ||
            catalogVersions.some((v: any) => v.run_id === bj.run_id) ||
            rawJobs.length === 1
          );

          if (isMatchingCatalog && catalogExp) {
            jobSummary = catalogExp.summary;
            jobLimitations = catalogExp.limitations;

            const evMap = new Map<string, any>();
            (catalogExp.evidence || []).forEach((ev: any) => {
              if (ev.image?.evidence_id) evMap.set(ev.image.evidence_id, ev);
            });

            jobDirections = (catalogExp.directions || []).map((d: any) => {
              const evItems: DirectionEvidenceItem[] = [];
              let nIdx = 0;
              let aIdx = 0;

              (d.evidence_ids || []).forEach((eid: string) => {
                const ev = evMap.get(eid);
                const sid = ev ? ev.sample_id : "";
                const isNorm = normalList.includes(sid) || sid.includes("OK") || sid.includes("pass");
                const ref = isNorm ? `N${++nIdx}` : `A${++aIdx}`;
                const label = isNorm ? `良品 ${ref}` : `异常 ${ref}`;
                const dsId = sid.includes(":") ? sid.split(":")[0] : bj.dataset_id;
                const fname = sid.includes("/") ? sid.split("/").pop()! : sid;

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
            normal: normalList.length ? normalList : (bj.sample_ids || []).filter((s: string) => s.includes("OK")),
            defect: defectList.length ? defectList : (bj.sample_ids || []).filter((s: string) => s.includes("NG")),
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
        if (curr && allMappedJobs.some((j) => j.id === curr)) return curr;
        return allMappedJobs[0]?.id || null;
      });
    }).catch((err) => {
      console.error("ExplorationPage error in jobs loader:", err);
      if (!active) return;
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
    if (!hasActiveJob) return;
    const interval = setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [jobs]);

  // Derived state
  const parentGroups = groups.length ? groups : buildHierarchyGroups([dataset], []);
  const currentChildDatasets = datasets.filter((d) => getDatasetGroupId(d, groups) === selectedParentId);

  const filteredJobs: JobItem[] = useMemo(() => {
    return jobs.filter((j) => {
      if (jobFilter === "全部") return true;
      return j.status === jobFilter;
    });
  }, [jobs, jobFilter]);

  const jobPages = Math.max(1, Math.ceil(filteredJobs.length / IBA_JOBS_PAGE_SIZE));
  const currentJobPage = Math.max(1, Math.min(jobPages, jobPage));
  const shownJobs: JobItem[] = useMemo(() => {
    return filteredJobs.slice(
      (currentJobPage - 1) * IBA_JOBS_PAGE_SIZE,
      currentJobPage * IBA_JOBS_PAGE_SIZE
    );
  }, [filteredJobs, currentJobPage]);

  const selectedJob: JobItem | null = useMemo(() => {
    if (!shownJobs.length) return null;
    if (selectedJobId) {
      const match = shownJobs.find((j: JobItem) => j.id === selectedJobId);
      if (match) return match;
    }
    return shownJobs[0] || null;
  }, [shownJobs, selectedJobId]);

  const handleJobPageChange = (newPage: number) => {
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
  const handleParentChange = (newParentId: string) => {
    setSelectedParentId(newParentId);
    const children = datasets.filter((d) => getDatasetGroupId(d, groups) === newParentId);
    setSelectedChildIds(children.map((c) => c.dataset_id));
    setJobPage(1);
  };

  // Toggle child dataset selection
  const handleChildToggle = (cid: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
    setJobPage(1);
  };

  // Preset selection
  const handlePresetChange = (presetId: string) => {
    const p = presets.find((x) => x.id === presetId);
    if (p) {
      setSelectedPresetId(presetId);
      setPrompt(p.text);
      setOriginalPrompt(p.text);
    }
  };

  // Start exploration job via real backend API
  const handleStartExploration = async () => {
    if (!canRun) return;
    try {
      const targetDatasetId = selectedChildIds[0] || dataset.dataset_id;
      const res = await request<any>("/exploration/start", {
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
    } catch (err) {
      console.error("Failed to start exploration", err);
      const newId = `explore_${Date.now()}`;
      const newJob: JobItem = {
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
    if (!deletingJobId) return;
    const targetId = deletingJobId;
    setModal("");
    setDeletingJobId(null);
    try {
      await request(`/exploration/delete/${encodeURIComponent(targetId)}`, {}, "POST");
    } catch (err) {
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

  const renderJobDataset = (j: JobItem) => {
    const storedIds = (j.datasetIds && j.datasetIds.length > 0)
      ? j.datasetIds
      : (j.scopeKey || "").split("|")[1]?.split(",").filter(Boolean) || [j.scopeKey || dataset.dataset_id];
    const childNames = storedIds
      .map((id) => datasets.find((d) => d.dataset_id === id)?.name)
      .filter(Boolean) as string[];
    const text = childNames.join("、") || datasets.find((d) => d.dataset_id === (storedIds[0] || j.scopeKey))?.name || "—";
    return (
      <div className="exp-job-dataset" title={text}>
        <span className="exp-job-dataset-name">{text}</span>
      </div>
    );
  };

  // Helper to find image details from samplePool or fallback to sample media endpoint
  const getImageInfo = (id: string, kindFallback: "normal" | "defect" = "normal"): SampleItem => {
    const found = samplePool.find((p) => p.id === id);
    if (found) return found;
    const dsId = id.includes(":") ? id.split(":")[0] : selectedChildIds[0] || dataset.dataset_id;
    const fname = id.includes("/") ? id.split("/").pop()! : id;
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
  const getJobEvidence = (job: JobItem | null, dirId?: string | null) => {
    if (!job) return { normals: [], defects: [], all: [] };
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
        kind: "normal" as const,
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
        kind: "defect" as const,
        url: info.url,
        fullUrl: info.url.includes("thumbnail") ? info.url.replace("/thumbnail?size=240", "/image") : info.url,
        filename: info.filename,
      };
    });
    return { normals, defects, all: [...normals, ...defects] };
  };

  const currentEvidence = getJobEvidence(selectedJob, viewingDirectionId);

  // Scroll evidence into view when hovering or clicking chips
  const handleChipFocus = (ref: string) => {
    setHighlightRef(ref);
  };

  // Open FullscreenViewer on evidence click
  const handleOpenEvidenceFullscreen = (clickedRef: string) => {
    const allItems: FullscreenViewerItem[] = currentEvidence.all.map((item) => ({
      id: item.ref,
      title: `${item.label} · ${item.filename}`,
      imageUrl: (item as any).fullUrl || item.url,
    }));
    const index = currentEvidence.all.findIndex((item) => item.ref === clickedRef);
    setViewerData({
      items: allItems,
      currentIndex: Math.max(0, index),
    });
  };

  return (
    <div id="exploration-page" className="iad-exploration-page">
      {/* Top Heading */}
      <div className="exp-heading">
        <div>
          <h1>{view === "setup" ? "新建探索" : "方向探索"}</h1>
        </div>
        <div className="exp-heading-actions">
          {view === "setup" ? (
            <button type="button" className="exp-btn" onClick={() => setView("jobs")}>
              返回作业与结果
            </button>
          ) : (
            <button
              type="button"
              className="exp-btn exp-primary"
              disabled={!!runningJob}
              title={runningJob ? "已有探索任务运行或排队" : "新建探索"}
              onClick={() => setView("setup")}
            >
              新建探索
            </button>
          )}
        </div>
      </div>

      {/* Dataset & Child Scope Selector (Shared Component) */}
      <DatasetScopeSelector
        className="exp-scope"
        groups={parentGroups}
        selectedGroupId={selectedParentId}
        onGroupChange={handleParentChange}
        childDatasets={currentChildDatasets}
        selectedChildIds={selectedChildIds}
        onChildToggle={handleChildToggle}
        disabled={!!runningJob}
        groupId="exp-parent"
        childId="exp-child-toggle"
        childMenuId="exp-child-menu"
      >
        <button
          id="refresh"
          type="button"
          className="iad-subtle-icon refresh-btn dc-icn"
          title="刷新探索作业"
          aria-label="刷新探索作业"
          disabled={!!runningJob}
          onClick={() => {
            setRefreshTick((t) => t + 1);
          }}
        >
          <RefreshIcon size={17} />
        </button>
      </DatasetScopeSelector>

      {/* Main Content: Setup View or Unified Workspace */}
      {view === "setup" ? (
        <div>
          {/* Step 1: Select Contrast Samples */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>1. 选择对比样例</h2>
            </div>
            <div className="exp-tab-header">
              <div className="exp-sample-tabs" role="tablist" aria-label="对比样例">
                <button
                  type="button"
                  role="tab"
                  aria-selected={sampleTab === "normal"}
                  className={sampleTab === "normal" ? "active" : ""}
                  onClick={() => setSampleTab("normal")}
                >
                  良品样例 ({normalSelected.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sampleTab === "defect"}
                  className={sampleTab === "defect" ? "active" : ""}
                  onClick={() => setSampleTab("defect")}
                >
                  异常样例 ({defectSelected.length})
                </button>
              </div>
              <button
                type="button"
                className="exp-clear-icon icon-button iad-icon-button"
                disabled={sampleTab === "normal" ? !normalSelected.length : !defectSelected.length}
                title="清空当前页已选图像"
                aria-label={`清空${sampleTab === "normal" ? "良品" : "异常"}已选图像`}
                onClick={() => {
                  if (sampleTab === "normal") setNormalSelected([]);
                  else setDefectSelected([]);
                }}
              >
                <DeleteIcon />
              </button>
            </div>

            <div className="exp-sample-body">
              <div className="exp-previews exp-previews-wide">
                {(sampleTab === "normal" ? normalSelected : defectSelected).map((id) => {
                  const item = getImageInfo(id, sampleTab);
                  return (
                    <div key={id} className="exp-preview">
                      <img src={item.url} alt={item.filename} />
                      <span title={item.filename}>{item.filename}</span>
                    </div>
                  );
                })}
                <div className="exp-preview add-tile">
                  <button
                    type="button"
                    className="exp-add-image"
                    aria-label={`继续添加${sampleTab === "normal" ? "良品" : "异常"}图像`}
                    title="继续添加图像"
                    onClick={() => {
                      setSourceSearch("");
                      setSourceCategory("all");
                      setSourceSelectedOnly(false);
                      setSourcePage(1);
                      setModal("source");
                    }}
                  >
                    <PlusIcon size={24} />
                    {!(sampleTab === "normal" ? normalSelected : defectSelected).length && <span>添加图像</span>}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Exploration Prompt */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>2. 探索提示词</h2>
            </div>
            <div className="exp-prompt-head">
              <label className="exp-input">
                提示词预设
                <select
                  id="exp-preset"
                  value={selectedPresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                >
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="exp-btn"
                disabled={prompt === originalPrompt}
                onClick={() => setPrompt(originalPrompt)}
              >
                重置为预设
              </button>
              <button
                type="button"
                className="exp-btn"
                disabled={!prompt.trim()}
                onClick={() => {
                  setNewPresetName("");
                  setModal("save");
                }}
              >
                另存为预设
              </button>
            </div>
            <label className="exp-input">
              提示词正文
              <textarea
                id="exp-prompt"
                rows={7}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
          </section>

          {/* Step 3: Confirm and Start */}
          <section className="exp-panel">
            <div className="exp-panel-title">
              <h2>3. 确认并启动</h2>
            </div>
            <div className="exp-brief">
              <span>所选子数据集 <b>{selectedChildIds.length} 个</b></span>
              <span>输入图像 <b>良品 {normalSelected.length} · 异常 {defectSelected.length}</b></span>
              <span>模型 <b>Qwen3.8-27B-FP8（示例）</b></span>
              <span>执行 <b>整组联合输入</b></span>
            </div>
            <div className="exp-summarybar">
              <span style={{ fontSize: 12, color: canRun ? "#58718c" : "#8b5660" }}>
                {runningJob
                  ? "当前已有探索运行，暂不可重复启动"
                  : !selectedChildIds.length
                  ? "请选择子数据集"
                  : !normalSelected.length || !defectSelected.length
                  ? "请至少选择 1 张良品和 1 张异常图像"
                  : "可启动"}
              </span>
              <button
                type="button"
                className="exp-btn exp-primary"
                disabled={!canRun}
                onClick={handleStartExploration}
              >
                启动联合探索
              </button>
            </div>
          </section>
        </div>
      ) : (
        /* Unified Workspace Layout */
        <div className="exp-unified-layout">
          {/* Upper Panel: 探索作业 */}
          <section className={`exp-panel exp-job-list ${jobPages > 1 ? 'iba-job-multipage' : ''}`} aria-label="探索作业">
            <div className="exp-job-list-head">
              <h2>探索作业</h2>
              <div className="exp-job-list-actions">
                <label className="exp-input" aria-label="筛选作业状态">
                  <select
                    id="exp-jobfilter"
                    aria-label="任务状态"
                    value={jobFilter}
                    onChange={(e) => {
                      setJobFilter(e.target.value);
                      setJobPage(1);
                    }}
                  >
                    <option value="全部">全部状态</option>
                    <option value="PENDING">排队中</option>
                    <option value="RUNNING">运行中</option>
                    <option value="COMPLETED">已完成</option>
                    <option value="FAILED">失败</option>
                  </select>
                </label>
              </div>
            </div>

            {filteredJobs.length ? (
              <>
                <div className="exp-job-table-wrap" role="region" aria-label="探索作业列表" tabIndex={0}>
                  <table className="exp-job-table">
                    <thead>
                      <tr>
                        <th>作业 ID</th>
                        <th>状态</th>
                        <th>数据集</th>
                        <th>提交时间</th>
                        <th>耗时</th>
                        <th className="exp-prompt-action-col">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownJobs.map((j) => (
                        <tr
                          key={j.id}
                          data-action="select-job"
                          data-id={j.id}
                          data-selected={selectedJob?.id === j.id}
                          aria-selected={selectedJob?.id === j.id}
                          tabIndex={0}
                          role="button"
                          aria-label={`选择作业 ${j.id}`}
                          onClick={() => setSelectedJobId(j.id)}
                        >
                          <td>
                            <strong className="exp-row-title">{j.id}</strong>
                          </td>
                          <td>{expJobBadge(j.status)}</td>
                          <td>{renderJobDataset(j)}</td>
                          <td className="exp-job-time">{j.time || "—"}</td>
                          <td className="exp-job-duration">
                            {j.status === "PENDING" ? "—" : expElapsed(j.elapsed)}
                          </td>
                          <td className="exp-prompt-action-col">
                            <div className="exp-job-icon-actions" onClick={(e) => e.stopPropagation()}>
                              <IconButton
                                label="查看提示词"
                                title="查看提示词"
                                className="exp-row-icon icon-button"
                                data-exp="show-prompt"
                                data-id={j.id}
                                onClick={() => {
                                  setPromptJobId(j.id);
                                  setModal("prompt");
                                }}
                              >
                                <DocumentIcon />
                              </IconButton>
                              <IconButton
                                label="删除作业"
                                title={j.status === "RUNNING" || j.status === "PENDING" ? "请先停止运行中的作业" : "删除作业"}
                                data-delete="true"
                                data-exp="ask-delete-job"
                                data-id={j.id}
                                className="exp-row-icon danger icon-button"
                                disabled={j.status === "RUNNING" || j.status === "PENDING"}
                                onClick={() => {
                                  setDeletingJobId(j.id);
                                  setModal("delete-job");
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <IbaJobPager
                  total={filteredJobs.length}
                  page={currentJobPage}
                  onPage={handleJobPageChange}
                  label="探索作业"
                  dataActionAttr="data-exp"
                  dataActionName="job-page"
                />
              </>
            ) : (
              <div className="exp-job-empty" role="status">
                {jobs.length ? "没有匹配的作业" : "当前数据集尚无探索作业。"}
              </div>
            )}
          </section>

          {/* Lower Panel: 探索结果 */}
          {!selectedJob ? (
            <section className="exp-panel exp-selected-result exp-empty-result" aria-label="探索结果">
              <div className="exp-selected-head">
                <div>
                  <h2>探索结果</h2>
                </div>
              </div>
              <div className="exp-result-empty-message" role="status">
                {jobs.length
                  ? "当前筛选条件下没有匹配的探索作业。"
                  : "当前数据集尚未产生探索作业。从右上角「新建探索」选择良品和异常样例，建立适合当前数据集的探索方向。"}
              </div>
            </section>
          ) : selectedJob.status === "PENDING" || selectedJob.status === "RUNNING" ? (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的执行阶段">
              <div className="exp-selected-head">
                <div>
                  <h2>运行状态</h2>
                  <span className="exp-selected-sub">{selectedJob.id}</span>
                </div>
              </div>
              <div className="exp-job-current-title" style={{ margin: "0 0 17px" }}>
                <span className={`exp-pill ${selectedJob.status === "PENDING" ? "pending" : "running"}`}>
                  {selectedJob.status === "PENDING" ? "排队中" : "运行中"}
                </span>
                <strong>
                  {selectedJob.status === "PENDING"
                    ? "等待执行"
                    : ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"][selectedJob.phase || 0]}
                </strong>
                <span className="exp-lead">
                  {selectedJob.status === "PENDING" ? "等待队列安排" : `已用时 ${expElapsed(selectedJob.elapsed)}`}
                </span>
              </div>
              <div className="exp-job-stages" role="list" aria-label="执行阶段">
                {["准备图像", "容量检查", "模型联合分析", "校验并发布方向"].map((p, i) => {
                  const pending = selectedJob.status === "PENDING";
                  const state = pending ? "waiting" : i < selectedJob.phase ? "done" : i === selectedJob.phase ? "current" : "waiting";
                  return (
                    <div key={p} role="listitem" className="exp-job-stage" data-state={state}>
                      <span className="exp-job-stage-icon">
                        {!pending && i < selectedJob.phase ? "✓" : i + 1}
                      </span>
                      <span className="exp-job-stage-label">{p}</span>
                    </div>
                  );
                })}
              </div>
              <div className="exp-result-neutral">
                方向尚未发布，完成后将在这里显示本次作业的候选方向与整体限制。
              </div>
            </section>
          ) : selectedJob.status === "FAILED" ? (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的错误信息">
              <div className="exp-selected-head">
                <div>
                  <h2>作业失败</h2>
                  <span className="exp-selected-sub">{selectedJob.id}</span>
                </div>
              </div>
              <p className="exp-error-message">{selectedJob.error || "任务未成功完成，未生成探索结果。"}</p>
              <p className="exp-lead">本次作业没有可用的候选方向或整体限制。</p>
              <button
                type="button"
                className="exp-btn"
                disabled={!!runningJob}
                onClick={() => {
                  setNormalSelected([...selectedJob.normal]);
                  setDefectSelected([...selectedJob.defect]);
                  setPrompt(selectedJob.prompt);
                  setView("setup");
                }}
              >
                使用该配置新建
              </button>
            </section>
          ) : (
            <section className="exp-panel exp-selected-result" aria-label="所选作业的探索结果">
              <div className="exp-selected-head">
                <div>
                  <h2>探索结果</h2>
                  <span className="exp-selected-sub">{selectedJob.id}</span>
                </div>
              </div>
              {selectedJob.summary && <p className="exp-result-summary">{selectedJob.summary}</p>}
              <div className="exp-result-section-head">
                <h3>候选方向</h3>
              </div>
              <div className="exp-job-table-wrap">
                <table className="exp-job-table exp-direction-table">
                  <thead>
                    <tr>
                      <th>方向</th>
                      <th>适用知识</th>
                      <th>证据</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedJob.directions && selectedJob.directions.length > 0 ? (
                      selectedJob.directions.map((d) => (
                        <tr
                          key={d.id}
                          role="button"
                          tabIndex={0}
                          data-action="direction"
                          data-id={d.id}
                          aria-label={`查看方向 ${d.title}`}
                          onClick={() => {
                            setViewingDirectionId(d.id);
                            setModal("direction");
                          }}
                        >
                          <td>
                            <strong className="exp-row-title">{d.title}</strong>
                            <span className="exp-row-info">{d.brief}</span>
                          </td>
                          <td>{d.applies}</td>
                          <td>{d.evidences?.length || d.evidenceIds?.length || (Math.min(selectedJob.normal.length, 2) + Math.min(selectedJob.defect.length, 4))} 张</td>
                          <td className="exp-direction-action" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              label="查看方向"
                              title="查看方向"
                              className="exp-row-icon exp-direction-view-icon exp-view-detail-button icon-button"
                              onClick={() => {
                                setViewingDirectionId(d.id);
                                setModal("direction");
                              }}
                            >
                              <DocumentSearchIcon />
                            </IconButton>
                            <IconButton
                              label="去知识挖掘"
                              title="用该方向进行知识挖掘"
                              className="exp-row-icon exp-direction-mine-icon icon-button plus-action"
                              onClick={() => {
                                workspace.openLocation({
                                  pageId: "industrial-knowledge",
                                  datasetId: dataset.dataset_id,
                                  knowledgeKind: d.applies === "良品" ? "normal" : "defect",
                                  directionFocus: d.id,
                                  tab: "setup",
                                });
                              }}
                            >
                              <MineIcon />
                            </IconButton>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "28px 16px", color: "#64748b" }}>
                          本次作业未生成候选方向
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Limitations List */}
              <div className="exp-limitations">
                <div className="exp-result-section-head">
                  <h3>整体限制</h3>
                </div>
                {selectedJob.limitations?.length ? (
                  <ol>
                    {selectedJob.limitations.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="exp-lead">本次未记录整体限制。</p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modals & Overlays Portalled to document.body */}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Prompt Drawer */}
      {modal === "prompt" && promptJobId && (
        <div
          className="exp-modal exp-prompt-overlay"
          id="exp-prompt-overlay"
          role="presentation"
          onClick={() => setModal("")}
        >
          <aside
            className="exp-prompt-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exp-prompt-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="exp-prompt-drawer-head">
              <h2 id="exp-prompt-title">探索提示词</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="exp-btn small"
                  id="copy-exp-prompt"
                  onClick={async () => {
                    const text = jobs.find((j) => j.id === promptJobId)?.prompt || "本次作业未记录提示词正文。";
                    try {
                      await navigator.clipboard.writeText(text);
                    } catch (_) {}
                  }}
                >
                  复制提示词
                </button>
                <IconButton
                  label="关闭提示词抽屉"
                  title="关闭"
                  className="exp-prompt-close drawer-close exp-ghost"
                  onClick={() => setModal("")}
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>
            <div className="exp-prompt-drawer-content">
              <div className="exp-prompt-readonly">
                {jobs.find((j) => j.id === promptJobId)?.prompt || "本次作业未记录提示词正文。"}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Delete Job Confirmation Modal */}
      {modal === "delete-job" && deletingJobId && (
        <div className="exp-modal" id="exp-modal">
          <div className="exp-dialog small" role="dialog" aria-modal="true" aria-label="删除探索作业">
            <div className="exp-dialog-head">
              <strong>删除探索作业</strong>
              <IconButton label="关闭" className="modal-x exp-ghost" onClick={() => setModal("")}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="exp-dialog-main">
              <p className="exp-delete-text">
                确定删除作业 <strong>{deletingJobId}</strong> 吗？
              </p>
              <p className="exp-delete-note">
                该作业对应的候选方向和整体限制将一并移除，此操作不可撤销。
              </p>
            </div>
            <div className="exp-dialog-foot">
              <button type="button" className="exp-btn" onClick={() => setModal("")}>
                取消
              </button>
              <button
                type="button"
                className="exp-btn exp-delete-confirm"
                onClick={handleConfirmDeleteJob}
              >
                删除作业
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {modal === "save" && (
        <div className="exp-modal" id="exp-modal">
          <div className="exp-dialog small" role="dialog" aria-modal="true" aria-label="另存为提示词预设">
            <div className="exp-dialog-head">
              <strong>另存为提示词预设</strong>
              <IconButton label="关闭" className="modal-x exp-ghost" onClick={() => setModal("")}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="exp-dialog-main">
              <label className="exp-input">
                预设名称
                <input
                  id="exp-new-preset"
                  placeholder="请输入预设名称"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
              </label>
            </div>
            <div className="exp-dialog-foot">
              <button type="button" className="exp-btn" onClick={() => setModal("")}>
                取消
              </button>
              <button
                type="button"
                className="exp-btn exp-primary"
                disabled={!newPresetName.trim()}
                onClick={() => {
                  const newP: PresetItem = {
                    id: `custom_${Date.now()}`,
                    name: newPresetName.trim(),
                    text: prompt,
                  };
                  setPresets([...presets, newP]);
                  setSelectedPresetId(newP.id);
                  setOriginalPrompt(prompt);
                  setModal("");
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Image Picker Modal */}
      {modal === "source" && (
        <div className="exp-modal" id="exp-modal">
          <div className="exp-dialog exp-source-dialog" role="dialog" aria-modal="true" aria-label={`选择${sampleTab === "normal" ? "良品" : "异常"}图像`}>
            <div className="exp-dialog-head">
              <strong>选择{sampleTab === "normal" ? "良品" : "异常"}图像</strong>
              <IconButton label="关闭" className="modal-x exp-ghost" onClick={() => setModal("")}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="exp-dialog-main">
              <div className="exp-source-scope exp-source-scope-clean">
                <label className="exp-input">
                  搜索图像
                  <input
                    id="exp-source-search"
                    type="search"
                    placeholder="文件名"
                    value={sourceSearch}
                    onChange={(e) => {
                      setSourceSearch(e.target.value);
                      setSourcePage(1);
                    }}
                  />
                </label>
                {sampleTab === "defect" && (
                  <label className="exp-input">
                    标注类别
                    <select
                      id="exp-source-category"
                      value={sourceCategory}
                      onChange={(e) => {
                        setSourceCategory(e.target.value);
                        setSourcePage(1);
                      }}
                    >
                      <option value="all">全部类别</option>
                      {[...new Set(samplePool.map((s) => s.category).filter(Boolean))].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="exp-source-only">
                  <input
                    id="exp-only-selected"
                    type="checkbox"
                    checked={sourceSelectedOnly}
                    onChange={(e) => {
                      setSourceSelectedOnly(e.target.checked);
                      setSourcePage(1);
                    }}
                  />
                  仅看已选
                </label>
              </div>

              {/* Candidate Grid */}
              {(() => {
                const selectedList = sampleTab === "normal" ? normalSelected : defectSelected;
                const filtered = samplePool.filter((s) => {
                  if (s.kind !== sampleTab) return false;
                  if (sourceSelectedOnly && !selectedList.includes(s.id)) return false;
                  if (sourceSearch.trim() && !s.filename.toLowerCase().includes(sourceSearch.trim().toLowerCase())) return false;
                  if (sourceCategory !== "all" && s.category !== sourceCategory) return false;
                  return true;
                });
                const totalPages = Math.ceil(filtered.length / 24) || 1;
                const page = Math.max(1, Math.min(sourcePage, totalPages));
                const visible = filtered.slice((page - 1) * 24, page * 24);

                return (
                  <>
                    <div className="exp-source-grid">
                      {visible.map((item) => {
                        const isChosen = selectedList.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`exp-source-option ${isChosen ? "chosen" : ""}`}
                          >
                            <img src={item.url} alt={item.filename} />
                            <span className="exp-select-meta">
                              <input
                                type="checkbox"
                                checked={isChosen}
                                onChange={(e) => {
                                  if (sampleTab === "normal") {
                                    setNormalSelected((prev) =>
                                      e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id)
                                    );
                                  } else {
                                    setDefectSelected((prev) =>
                                      e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id)
                                    );
                                  }
                                }}
                              />
                              <span title={item.filename}>{item.filename}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {!visible.length && <p className="exp-lead">没有符合条件的图像</p>}
                    <div className="pagination" style={{ marginTop: 18 }}>
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setSourcePage((p) => Math.max(1, p - 1))}
                      >
                        上一页
                      </button>
                      <span>
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setSourcePage((p) => p + 1)}
                      >
                        下一页
                      </button>
                      <span>共 {filtered.length} 张图像</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="exp-dialog-foot">
              <button
                type="button"
                className="exp-btn exp-primary"
                onClick={() => setModal("")}
              >
                完成选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direction Detail Dialog (Shared Reusable Component) */}
      {modal === "direction" && viewingDirectionId && selectedJob && (
        <DirectionDetailDialog
          direction={
            (selectedJob.directions || []).find((x) => x.id === viewingDirectionId) ||
            selectedJob.directions?.[0]!
          }
          evidence={currentEvidence}
          highlightRef={highlightRef}
          onHighlightRef={setHighlightRef}
          onChipFocus={handleChipFocus}
          onOpenFullscreen={handleOpenEvidenceFullscreen}
          onClose={() => setModal("")}
        />
      )}

      {/* Fullscreen Viewer (reused from FullscreenViewer.tsx) */}
      {viewerData && (
        <FullscreenViewer
          open={true}
          item={viewerData.items[viewerData.currentIndex] || null}
          items={viewerData.items}
          currentIndex={viewerData.currentIndex}
          onClose={() => setViewerData(null)}
          onNavigate={(idx) =>
            setViewerData((prev) => (prev ? { ...prev, currentIndex: idx } : null))
          }
        />
      )}
          </>,
          document.body
        )}
    </div>
  );
}
