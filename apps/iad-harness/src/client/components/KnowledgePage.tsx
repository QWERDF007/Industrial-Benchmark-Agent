import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dataset, DatasetGroup, JobSnapshot } from "../../shared/contracts.js";
import { mediaUrl, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { CloseIcon, DeleteIcon, DocumentSearchIcon, RefreshIcon } from "../AuditIcon.js";
import type { KnowledgeCheck } from "../../shared/domain.generated.js";
import { ClearFilterButton, RefreshIconButton } from "./CommonFilterControls.js";

interface PresetItem {
  id: string;
  name: string;
  text: string;
}

const defaultPresets: PresetItem[] = [
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

const explorerDirections: Record<string, { id: string; name: string; text: string; source: string }[]> = {
  s1: [
    { id: "e-edge", name: "黑色边缘条连续性与开孔规整性", text: "比较黑色边缘在不同裁剪位置的连续性，识别稳定的正常开孔与阶梯状结构。", source: "explore_e930f012" },
    { id: "e-cyan", name: "青色高亮开孔形态一致性", text: "比较椭圆高亮开孔的轮廓、尺寸与亮度变化，区分视角、光照与可疑变化。", source: "explore_e930f012" },
    { id: "e-line", name: "表面浅色细线与胶路边缘形态", text: "比较细线与胶路的相对距离，核查拼接伪影与真正划痕的区别。", source: "explore_e930f012" }
  ],
  s2: [{ id: "e-corner", name: "框胶转角与边界连续性", text: "比较不同转角位置的边界连续性和外观差异。", source: "explore_76c2" }],
  s3: [{ id: "e-pcb", name: "焊点、边缘及走线规律", text: "结合局部结构，观察走线、焊点与焊盘的稳定形态。", source: "explore_89ae" }],
  s4: []
};

interface KnowledgeItemData {
  id: string;
  name: string;
  summary: string;
  reason: string;
  allowed: string;
  limit: string;
  evidence: "supported" | "conflict" | "insufficient";
  review: "confirmed" | "pending" | "rejected";
  supportImgs: number[];
  counterImgs: number[];
  note?: string;
}

const defaultEntryTemplates: KnowledgeItemData[] = [
  { id: "k1", name: "笔直贯穿垂直白线为成像 / 拼接伪影", summary: "蓝色半透明盖板图中，贯穿图像的细白线常是稳定成像特征，不应直接判为划痕。", reason: "该白线在多张样本中的相对位置稳定，跨越局部结构时形态连续；结合图像对照，更符合成像或拼接伪影。", allowed: "允许细白线存在轻微曲率、亮度及相对位置变化，不可仅凭白线存在判为表面划痕。", limit: "仅覆盖当前视角和样本范围，真实划伤仍需原图与标注核实。", evidence: "supported", review: "confirmed", supportImgs: [1, 2, 3, 4, 7], counterImgs: [] },
  { id: "k2", name: "青色高亮开孔形态一致性", summary: "青色椭圆高亮区域通常具有相近的轮廓，亮度差异不应独立作为缺陷判据。", reason: "同批图像中高亮开孔在同类局部位置反复出现，形状较稳定，亮度会随成像条件波动。", allowed: "允许高亮轮廓轻微平移、亮度变化及视角带来的宽高差异。", limit: "不能替代实际开孔尺寸和产品结构标准。", evidence: "supported", review: "confirmed", supportImgs: [3, 4, 5, 6], counterImgs: [] },
  { id: "k3", name: "局部不规则线框可能为结构开孔", summary: "矩形与三角线框可能是正常结构，但当前图像的局部裁剪存在歧义。", reason: "部分样本呈规律的结构性轮廓，但另一些样本遮挡严重，暂不能单凭局部图像确定。", allowed: "允许由裁剪与不同视角造成的结构显示差异。", limit: "当前存在相互矛盾的局部证据，需要人工复核。", evidence: "conflict", review: "pending", supportImgs: [2, 7], counterImgs: [8] },
  { id: "k4", name: "黑色边缘条阶梯结构与缺口区分", summary: "正常开孔处边缘允许阶梯状起伏，但不应直接忽略突然断边。", reason: "多张样本在对应位置出现稳定的阶梯状黑色边缘，属于可能的正常结构。", allowed: "允许正常工艺位置的阶梯、转角与凹槽，不允许无法解释的结构断裂。", limit: "需要工程图或更多完整视角佐证。", evidence: "supported", review: "pending", supportImgs: [1, 6, 7], counterImgs: [9] },
  { id: "k5", name: "浅蓝渐变与材料表面变化", summary: "当前证据尚不能明确区分光照渐变、材料色差与覆膜变化。", reason: "多个样本的淡蓝过渡方向不完全一致，缺少稳定照明条件和缺陷对照。", allowed: "允许局部光照和反射导致的色彩变化。", limit: "待补充同位置、稳定光照样本，再评估是否构成可复用知识。", evidence: "insufficient", review: "pending", supportImgs: [3], counterImgs: [5, 8] },
  { id: "k6", name: "胶路边缘的连续纹理", summary: "边缘纹理在局部有规律地重复出现，不能仅因周期性变化判为异常。", reason: "选定图像的胶路侧边多处呈相近纹理，初步支持为正常加工外观。", allowed: "允许均匀周期纹理，但明显缺损仍需比对。", limit: "样本范围有限，尚不能覆盖其他工艺参数。", evidence: "supported", review: "pending", supportImgs: [2, 4, 5, 6], counterImgs: [] }
];

const makeDemoItems = (indexes: number[]) =>
  indexes.map((idx, n) => ({
    ...defaultEntryTemplates[idx],
    id: `${defaultEntryTemplates[idx].id}_${n}`,
    supportImgs: [...defaultEntryTemplates[idx].supportImgs],
    counterImgs: [...defaultEntryTemplates[idx].counterImgs],
    note: ""
  }));

interface UiJobItem {
  id: string;
  name: string;
  dataset: string;
  subset: string;
  status: "completed" | "running" | "interrupted" | "failed";
  statusLabel: string;
  statusBadgeClass: string;
  source: string;
  count: number | null;
  at: string;
  durationText: string;
  seconds: number | null;
  items: KnowledgeItemData[];
  model: string;
  prompt: string;
  kind: "normal" | "defect";
  knowledgeVersionId: string | null;
}

const defaultDemoJobs: UiJobItem[] = [
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

let cachedDatasets: Dataset[] | null = null;
let cachedGroups: DatasetGroup[] | null = null;

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function KnowledgePage({
  dataset,
  kind,
  refreshRevision,
  headerActions
}: {
  dataset: Dataset;
  kind: "normal" | "defect";
  refreshRevision: number;
  headerActions: React.ReactNode;
}) {
  const { workspace } = useWorkspace();
  const pageId = "industrial-knowledge";
  const view = workspace.view(pageId);

  // Hierarchy
  const initialGroups = buildHierarchyGroups(cachedDatasets || [dataset], cachedGroups || []);
  const initialParentId = getDatasetGroupId(dataset, initialGroups);
  const [datasets, setDatasets] = useState<Dataset[]>(() => cachedDatasets || [dataset]);
  const [groups, setGroups] = useState<DatasetGroup[]>(() => initialGroups);
  const [selectedParentId, setSelectedParentId] = useState<string>(() => initialParentId);
  const [selectedChildId, setSelectedChildId] = useState<string>(() => dataset.dataset_id);

  // Jobs & Knowledge hooks
  const [revision, setRevision] = useState(0);
  const updated = useCallback(() => setRevision(v => v + 1), []);
  const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
  const currentKnowledge = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
  const { knowledge } = currentKnowledge;

  // Local job list & selection
  const [jobList, setJobList] = useState<UiJobItem[]>(defaultDemoJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>("j2");
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("all");
  const [jobPage, setJobPage] = useState(1);

  // Lower panel search & filter
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeStatus, setKnowledgeStatus] = useState("all");
  const [entryPage, setEntryPage] = useState(1);

  // Modals & Drawers
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptJob, setPromptJob] = useState<UiJobItem | null>(null);
  const [detailItem, setDetailItem] = useState<KnowledgeItemData | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "confirmed" | "rejected">("pending");
  const [reviewNote, setReviewNote] = useState("");
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxEvidence, setLightboxEvidence] = useState<{ id: number; role: "support" | "counter" }[]>([]);
  const [toastMsg, setToastMsg] = useState("");

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2800);
  }, []);

  // Sync datasets and hierarchy
  useEffect(() => {
    let active = true;
    request<{ datasets: Dataset[]; groups?: DatasetGroup[] }>("/datasets")
      .then(res => {
        if (!active) return;
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
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [dataset, refreshRevision]);

  // Load real backend jobs if present, merge with demo jobs
  useEffect(() => {
    const liveJobs = polling.jobs.filter(j => j.kind === kind);
    if (!liveJobs.length) return;

    setJobList(prev => {
      const realUiJobs: UiJobItem[] = liveJobs.map(j => {
        const statusMap: Record<string, "completed" | "running" | "interrupted" | "failed"> = {
          COMPLETED: "completed",
          RUNNING: "running",
          PENDING: "running",
          CANCELLED: "interrupted",
          INTERRUPTED: "interrupted",
          FAILED: "failed"
        };
        const labelMap: Record<string, string> = {
          COMPLETED: "已完成",
          RUNNING: "运行中",
          PENDING: "排队中",
          CANCELLED: "已中断",
          INTERRUPTED: "已中断",
          FAILED: "失败"
        };
        const badgeMap: Record<string, string> = {
          COMPLETED: "green",
          RUNNING: "blue",
          PENDING: "amber",
          CANCELLED: "gray",
          INTERRUPTED: "gray",
          FAILED: "red"
        };

        const dur =
          j.finished_at && j.started_at
            ? Math.max(1, Math.round((new Date(j.finished_at).getTime() - new Date(j.started_at).getTime()) / 1000))
            : null;

        // Extract or adapt knowledge items if available
        const items: KnowledgeItemData[] = (knowledge?.checks || []).map((c, i) => ({
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
          kind: j.kind as "normal" | "defect",
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

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    const children = datasets.filter(d => getDatasetGroupId(d, groups) === parentId);
    if (children.length > 0) {
      setSelectedChildId(children[0].dataset_id);
      workspace.selectDataset(children[0].dataset_id);
    }
  };

  const handleChildChange = (childId: string) => {
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

  const selectJob = (id: string) => {
    setSelectedJobId(id);
    setEntryPage(1);
    setKnowledgeSearch("");
    setKnowledgeStatus("all");
  };

  // Selected job knowledge items
  const currentJobItems = useMemo(() => {
    if (!selectedJob) return [];
    return selectedJob.items || [];
  }, [selectedJob]);

  // Filter knowledge items
  const filteredChecks = useMemo(() => {
    return currentJobItems.filter(item => {
      const term = knowledgeSearch.trim().toLowerCase();
      const matchSearch = !term || item.name.toLowerCase().includes(term) || item.summary.toLowerCase().includes(term);
      const matchStatus =
        knowledgeStatus === "all" ||
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
  const openJobPrompt = (id: string) => {
    const j = jobList.find(v => v.id === id);
    if (!j) return;
    setPromptJob(j);
    setPromptOpen(true);
  };

  const closePrompt = () => {
    setPromptOpen(false);
    setPromptJob(null);
  };

  const handleCopyPrompt = async () => {
    if (!promptJob) return;
    try {
      await navigator.clipboard.writeText(promptJob.prompt);
      toast("提示词已复制");
    } catch (_) {
      toast("复制失败，请选中文本复制");
    }
  };

  // Detail dialog handlers
  const openDetail = (item: KnowledgeItemData) => {
    setDetailItem(item);
    setReviewStatus(item.review || "pending");
    setReviewNote(item.note || "");
  };

  const closeDetail = () => {
    setDetailItem(null);
  };

  const saveReview = () => {
    if (!detailItem || !selectedJob) return;
    detailItem.review = reviewStatus;
    detailItem.note = reviewNote;
    closeDetail();
    toast("人工复核已保存");
  };

  // Delete handlers with SSOT confirmation modal
  const askDeleteJob = (id: string) => {
    const j = jobList.find(v => v.id === id);
    if (!j) return;
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

  const askDeleteEntry = (item: KnowledgeItemData) => {
    if (!selectedJob) return;
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
  const openLight = (evidenceList: { id: number; role: "support" | "counter" }[], idx: number) => {
    setLightboxEvidence(evidenceList);
    setLightboxIndex(idx);
  };

  const closeLight = () => {
    setLightboxIndex(null);
    setLightboxEvidence([]);
  };

  const stepLight = (delta: number) => {
    if (lightboxIndex === null || !lightboxEvidence.length) return;
    setLightboxIndex((lightboxIndex + delta + lightboxEvidence.length) % lightboxEvidence.length);
  };

  // Creation modal state
  const [formKind, setFormKind] = useState<"normal" | "defect">("normal");
  const [selectedGeneral, setSelectedGeneral] = useState<Set<string>>(new Set(["edges", "integrity"]));
  const [selectedExplored, setSelectedExplored] = useState<Set<string>>(new Set());
  const [customDirections, setCustomDirections] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [selectedSamples, setSelectedSamples] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [jobNameInput, setJobNameInput] = useState("边缘与开孔—知识挖掘");
  const [promptText, setPromptText] = useState("");
  const [promptDirty, setPromptDirty] = useState(false);

  const openCreate = () => {
    setFormKind(kind);
    setSelectedGeneral(new Set(["edges", "integrity"]));
    setSelectedExplored(new Set());
    setCustomDirections([]);
    setCustomInput("");
    setSelectedSamples(new Set([1, 2, 3, 4]));
    setShowAllPresets(false);
    setJobNameInput("边缘与开孔—知识挖掘");
    setPromptDirty(false);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
  };

  // Generate prompt
  useEffect(() => {
    if (promptDirty) return;
    const generalList = defaultPresets.filter(p => selectedGeneral.has(p.id));
    const exploredList = (explorerDirections.s1 || []).filter(e => selectedExplored.has(e.id));
    const allDirs = [...generalList.map(g => `${g.name}：${g.text}`), ...exploredList.map(e => `${e.name}：${e.text}`), ...customDirections];

    const lines = [
      `你是工业视觉异常检测数据规范研究助手。`,
      ``,
      `数据集：${dataset.name}`,
      `本次任务：基于所选 ${selectedSamples.size} 张${formKind === "normal" ? "良品" : "异常"}图像，提炼可复核的${formKind === "normal" ? "正常外观规律及允许变化" : "异常外观特征、判断依据及适用限制"}。`,
      ``,
      `【观察方向】`,
      ...allDirs.map((d, i) => `${i + 1}. ${d}`),
      ``,
      `【证据要求】`,
      `1. 只能依据可见图像与提供的样本作出结论；必须指明支持和反对的证据图。`,
      `2. 区分真实缺陷、成像伪影、裁剪差异、光照与正常工艺变化。`,
      `3. 不足以判定时，标为“证据不足”或“存在矛盾”，不得臆造工业标准。`,
      `4. 结论需包含：知识名称、简短描述、判定依据、允许变化、适用限制、证据编号与人工复核建议。`
    ];
    setPromptText(lines.join("\n"));
  }, [formKind, selectedGeneral, selectedExplored, customDirections, selectedSamples, dataset.name, promptDirty]);

  const handleSubmitMining = () => {
    if (!jobNameInput.trim()) {
      toast("请填写作业名称");
      return;
    }
    const newJob: UiJobItem = {
      id: `job_${Date.now()}`,
      name: jobNameInput.trim(),
      dataset: dataset.dataset_id,
      subset: selectedChildId,
      status: "running",
      statusLabel: "运行中",
      statusBadgeClass: "blue",
      source: selectedExplored.size ? "mixed" : "preset",
      count: null,
      at: new Date().toLocaleString("zh-CN", { hour12: false }),
      durationText: "00:08",
      seconds: 8,
      items: makeDemoItems([0, 1, 2, 3]),
      model: "Qwen3.8-27B-FP8",
      prompt: promptText,
      kind: formKind,
      knowledgeVersionId: `kv_${Date.now()}`
    };

    setJobList([newJob, ...jobList]);
    setSelectedJobId(newJob.id);
    closeCreate();
    toast("已创建知识挖掘作业");

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) closeLight();
        else if (confirmState) setConfirmState(null);
        else if (promptOpen) closePrompt();
        else if (detailItem) closeDetail();
        else if (createOpen) closeCreate();
      } else if (lightboxIndex !== null) {
        if (e.key === "ArrowLeft") stepLight(-1);
        if (e.key === "ArrowRight") stepLight(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, confirmState, promptOpen, detailItem, createOpen]);

  // Helper for rendering pagination buttons
  const renderPageButtons = (
    current: number,
    max: number,
    onChange: (p: number) => void,
    dataPrefix: "job" | "entry"
  ) => {
    const nums: number[] = [];
    for (let p = 1; p <= max; p++) {
      if (p === 1 || p === max || Math.abs(p - current) <= 1) nums.push(p);
    }
    return (
      <>
        <button
          type="button"
          className="pagebtn"
          disabled={current <= 1}
          onClick={() => onChange(Math.max(1, current - 1))}
          aria-label="上一页"
        >
          上一页
        </button>
        {nums.map((p, idx) => {
          const prev = nums[idx - 1];
          const hasEllipsis = prev && p - prev > 1;
          return (
            <React.Fragment key={p}>
              {hasEllipsis && <span className="pager-ellipsis" aria-hidden="true">…</span>}
              <button
                type="button"
                className="pagebtn"
                {...{ [`data-${dataPrefix}-set`]: p }}
                aria-current={p === current ? "page" : undefined}
                aria-label={`第 ${p} 页`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}
        <button
          type="button"
          className="pagebtn"
          disabled={current >= max}
          onClick={() => onChange(Math.min(max, current + 1))}
          aria-label="下一页"
        >
          下一页
        </button>
      </>
    );
  };

  return (
    <div id="knowledge-page" className="iad-knowledge-page kb-v45 v46-app">
      <div className="kb-v45-main">
        <div className="main-inner">
          {/* Topline Header */}
          <header className="topline">
            <div className="titlebar">
              <div className="eyebrow">知识构建</div>
              <h1>知识挖掘</h1>
            </div>
            <div className="actions">
              <button className="btn primary" id="create-btn" onClick={openCreate}>
                ＋ 新建挖掘
              </button>
            </div>
          </header>

          {/* Context Scope Selector */}
          <section className="context" aria-label="选择数据范围">
            <div className="control">
              <label className="label" htmlFor="dataset">
                数据集
              </label>
              <select
                id="dataset"
                className="f wide select"
                aria-label="当前数据集"
                value={selectedParentId}
                onChange={e => handleParentChange(e.target.value)}
              >
                {parentGroups.map(g => (
                  <option key={g.group_id} value={g.group_id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="control">
              <label className="label" htmlFor="subset">
                子数据集
              </label>
              <select
                id="subset"
                className="f wide select"
                aria-label="子数据集"
                value={selectedChildId}
                onChange={e => handleChildChange(e.target.value)}
              >
                {currentChildDatasets.map(d => (
                  <option key={d.dataset_id} value={d.dataset_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="kb-context-actions">
              <RefreshIconButton
                id="kb-refresh"
                title="刷新当前页面"
                ariaLabel="刷新当前页面"
                onClick={handleRefresh}
              />
            </div>
            <div className="context-info" id="dataset-info"></div>
          </section>

          {/* Upper Panel: 挖掘作业 */}
          <section className="panel" aria-labelledby="jobs-heading">
            <div className="panelbar">
              <div>
                <h2 id="jobs-heading">
                  挖掘作业
                  <span className={`count ${filteredJobs.length === 0 ? "hide" : ""}`} id="jobs-count">
                    共 {filteredJobs.length} 条
                  </span>
                </h2>
              </div>
              <div className="filterset">
                <input
                  className="f"
                  id="job-search"
                  placeholder="搜索作业名称"
                  aria-label="搜索作业名称"
                  value={jobSearch}
                  onChange={e => {
                    setJobSearch(e.target.value);
                    setJobPage(1);
                  }}
                />
                <select
                  className="f"
                  id="job-status"
                  aria-label="筛选作业状态"
                  value={jobStatus}
                  onChange={e => {
                    setJobStatus(e.target.value);
                    setJobPage(1);
                  }}
                >
                  <option value="all">全部状态</option>
                  <option value="completed">已完成</option>
                  <option value="running">运行中</option>
                  <option value="interrupted">已中断</option>
                  <option value="failed">失败</option>
                </select>
                <ClearFilterButton
                  id="kb-clear-job-filters"
                  ariaLabel="清除筛选条件"
                  title="清除筛选条件"
                  disabled={!jobSearch && jobStatus === "all"}
                  onClick={() => {
                    setJobSearch("");
                    setJobStatus("all");
                    setJobPage(1);
                  }}
                />
              </div>
            </div>
            <div className="tableframe" id="jobs-table-frame" style={{ minHeight: maxJobPages > 1 ? "465px" : "" }}>
              {filteredJobs.length > 0 ? (
                <table className="jobs-table" id="jobs-table">
                  <thead>
                    <tr>
                      <th style={{ width: "36%" }}>作业名称</th>
                      <th>状态</th>
                      <th className="num" title="关联发布知识版本中的判据数量">
                        判据数
                      </th>
                      <th>提交时间</th>
                      <th>耗时</th>
                      <th className="right">操作</th>
                    </tr>
                  </thead>
                  <tbody id="job-rows">
                    {pageJobs.map(j => (
                      <tr
                        key={j.id}
                        tabIndex={0}
                        aria-label={`选择挖掘作业 ${j.name}`}
                        aria-selected={j.id === selectedJob?.id}
                        className={j.id === selectedJob?.id ? "current" : ""}
                        data-pick-job={j.id}
                        onClick={() => selectJob(j.id)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectJob(j.id);
                          }
                        }}
                      >
                        <td>
                          <div className="jobtitle" title={j.name}>
                            {j.name}
                          </div>
                        </td>
                        <td>
                          <span className={`status ${j.statusBadgeClass}`}>{j.statusLabel}</span>
                        </td>
                        <td className="num">{j.knowledgeVersionId ? j.count : "—"}</td>
                        <td>{j.at}</td>
                        <td>{j.durationText}</td>
                        <td>
                          <div className="jobact" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              className="job-mini-icon"
                              title="查看提示词"
                              aria-label="查看提示词"
                              data-job-prompt={j.id}
                              onClick={() => openJobPrompt(j.id)}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                                <path d="M14 3v5h5M9 12h6M9 16h6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="job-mini-icon"
                              title="删除作业"
                              aria-label={`删除作业 ${j.name}`}
                              data-remove-job={j.id}
                              onClick={() => askDeleteJob(j.id)}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div id="jobs-empty" className="tableempty">
                  <strong>{scopedJobs.length ? "没有符合条件的作业" : "当前子数据集尚无挖掘作业"}</strong>
                  <p>{scopedJobs.length ? "请调整状态或搜索条件。" : "从右上角「新建挖掘」选择方向与样本，创建挖掘作业。"}</p>
                </div>
              )}
            </div>
            <div className="job-pager" id="job-pager">
              <div className="pages">{renderPageButtons(currentJobPage, maxJobPages, setJobPage, "job")}</div>
              <span className="page-total">
                第 {currentJobPage} / {maxJobPages} 页，共 {filteredJobs.length} 条
              </span>
            </div>
          </section>

          {/* Lower Panel: 知识条目 */}
          <section className="panel" id="knowledge-panel" aria-labelledby="knowledge-heading">
            <div className="panelbar knowledgebar">
              <div>
                <h2 id="knowledge-heading">
                  知识条目
                  <span className={`count ${!selectedJob?.knowledgeVersionId ? "hide" : ""}`} id="knowledge-count">
                    {selectedJob?.knowledgeVersionId ? `共 ${currentJobItems.length} 条` : ""}
                  </span>
                </h2>
                <div className="scope-name hide" id="knowledge-job-name"></div>
              </div>
              {selectedJob?.knowledgeVersionId ? (
                <div className="filterset" id="knowledge-filterset">
                  <input
                    className="f"
                    id="knowledge-search"
                    placeholder="搜索知识条目"
                    aria-label="搜索知识条目"
                    value={knowledgeSearch}
                    onChange={e => {
                      setKnowledgeSearch(e.target.value);
                      setEntryPage(1);
                    }}
                  />
                  <select
                    className="f"
                    id="knowledge-status"
                    aria-label="筛选核实状态"
                    value={knowledgeStatus}
                    onChange={e => {
                      setKnowledgeStatus(e.target.value);
                      setEntryPage(1);
                    }}
                  >
                    <option value="all">全部条目</option>
                    <option value="pending">待核实</option>
                    <option value="confirmed">已通过</option>
                    <option value="rejected">已驳回</option>
                    <option value="conflict">存在矛盾</option>
                  </select>
                  <ClearFilterButton
                    id="kb-clear-knowledge-filters"
                    ariaLabel="清除筛选条件"
                    title="清除筛选条件"
                    disabled={!knowledgeSearch && knowledgeStatus === "all"}
                    onClick={() => {
                      setKnowledgeSearch("");
                      setKnowledgeStatus("all");
                      setEntryPage(1);
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div className="knowledge-wrap" id="knowledge-body">
              {!selectedJob ? (
                <div className="blank">
                  <div className="blank-icon">▤</div>
                  <strong>请选择上方的挖掘作业</strong>
                  <p>选择一条作业后，这里将显示该作业的知识条目。</p>
                </div>
              ) : !selectedJob.knowledgeVersionId ? (
                <div className="blank">
                  <div className="blank-icon">▣</div>
                  <strong>
                    {selectedJob.status === "running"
                      ? "作业正在运行"
                      : selectedJob.status === "failed"
                      ? "作业执行失败"
                      : "作业尚未发布知识版本"}
                  </strong>
                  <p>
                    {selectedJob.status === "running"
                      ? "发布完成后才显示该作业关联的知识版本。"
                      : selectedJob.status === "failed"
                      ? "当前作业没有已发布知识，请查看作业详情。"
                      : "此作业已结束，但未关联有效的知识版本，不显示当前最新知识。"}
                  </p>
                </div>
              ) : filteredChecks.length === 0 ? (
                <div className="blank">
                  <div className="blank-icon">▤</div>
                  <strong>{currentJobItems.length ? "没有符合筛选条件的知识条目" : "该作业暂无知识条目"}</strong>
                  <p>{currentJobItems.length ? "请调整搜索内容或核实状态。" : "该作业关联的知识版本没有可显示的条目。"}</p>
                </div>
              ) : (
                <div className="knowledge-list">
                  <div className="knowledge-head">
                    <span>知识条目</span>
                    <span>支持/反对</span>
                    <span>操作</span>
                  </div>
                  <div className="knowledge-items">
                    {pagedChecks.map(item => (
                      <div
                        key={item.id}
                        className="knowledge-row"
                        data-detail-entry={item.id}
                        role="row"
                        tabIndex={0}
                        aria-label={`查看知识条目：${item.name}`}
                        onClick={() => openDetail(item)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail(item);
                          }
                        }}
                      >
                        <span>
                          <strong className="row-title">{item.name}</strong>
                          <span className="row-desc" title={item.summary}>
                            {item.summary}
                          </span>
                        </span>
                        <span
                          className="row-count col-evidence-count"
                          title={`支持 ${(item.supportImgs || []).length} 张，反对 ${(item.counterImgs || []).length} 张`}
                        >
                          {(item.supportImgs || []).length}/{(item.counterImgs || []).length}
                        </span>
                        <span className="col-action jobact" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="job-mini-icon knowledge-entry-view"
                            data-view-entry={item.id}
                            aria-label={`查看知识条目 ${item.name}`}
                            title="查看知识条目"
                            onClick={() => openDetail(item)}
                          >
                            <DocumentSearchIcon />
                          </button>
                          <button
                            type="button"
                            className="job-mini-icon knowledge-entry-delete"
                            data-delete-entry={item.id}
                            aria-label={`删除知识条目 ${item.name}`}
                            title="删除知识条目"
                            onClick={() => askDeleteEntry(item)}
                          >
                            <DeleteIcon />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="knowledge-pager">
                    <div className="pages">{renderPageButtons(currentEntryPage, maxEntryPages, setEntryPage, "entry")}</div>
                    <span className="page-total">
                      第 {currentEntryPage} / {maxEntryPages} 页，共 {filteredChecks.length} 条
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="demo-note">
            当前为离线交互原型，作业、模型、知识与证据均使用演示数据；实际数据结构和接口定义见开发方案。
          </div>
        </div>
      </div>

      {/* Overlays rendered into portal */}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {/* 1. Job Prompt Drawer */}
            <div
              className={`overlay knowledge-prompt-overlay ${promptOpen ? "show" : ""}`}
              id="job-prompt-overlay"
              role="presentation"
              onClick={closePrompt}
            >
              <aside
                className="knowledge-prompt-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="job-prompt-title"
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
              >
                <header className="knowledge-prompt-drawer-head">
                  <h2 id="job-prompt-title">查看提示词</h2>
                  <div className="knowledge-prompt-drawer-actions">
                    <button type="button" className="btn small" id="copy-job-prompt" onClick={handleCopyPrompt}>
                      复制提示词
                    </button>
                    <button
                      type="button"
                      className="knowledge-prompt-drawer-close"
                      id="close-job-prompt"
                      aria-label="关闭提示词抽屉"
                      title="关闭"
                      onClick={closePrompt}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </header>
                <div className="knowledge-prompt-drawer-content" id="job-prompt-body">
                  <pre id="job-prompt-content" className="knowledge-prompt-readonly">
                    {promptJob?.prompt || "该历史作业未记录冻结提示词。"}
                  </pre>
                </div>
              </aside>
            </div>

            {/* 2. Knowledge Entry Detail Modal */}
            <div
              className={`overlay detail-overlay v46-app ${detailItem ? "show" : ""}`}
              id="detail-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="kb-detail-title"
              onClick={closeDetail}
            >
              <section
                className="modal detail-modal"
                id="entry-dialog"
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
              >
                <header className="modalheader">
                  <div>
                    <h2 id="kb-detail-title">{detailItem?.name}</h2>
                  </div>
                  <button
                    type="button"
                    id="close-detail"
                    className="iconbtn"
                    title="关闭知识详情"
                    aria-label="关闭知识详情"
                    onClick={closeDetail}
                  >
                    ×
                  </button>
                </header>
                <div className="modalcontent" id="detail-content">
                  <section className="detail-section">
                    <h3>知识结论</h3>
                    <p>{detailItem?.summary}</p>
                  </section>
                  <section className="detail-section">
                    <h3>判定依据</h3>
                    <p>{detailItem?.reason}</p>
                  </section>
                  <section className="detail-section">
                    <h3>允许变化</h3>
                    <p>{detailItem?.allowed}</p>
                  </section>
                  <section className="detail-section">
                    <h3>支持证据，{(detailItem?.supportImgs || []).length} 张</h3>
                    {detailItem?.supportImgs.length ? (
                      <div className="detail-evidence-grid">
                        {detailItem.supportImgs.map((n, i) => (
                          <button
                            type="button"
                            key={n}
                            className="detail-evidence"
                            data-light-image={i}
                            aria-label={`放大支持证据 ${i + 1}`}
                            onClick={() =>
                              openLight(
                                [
                                  ...(detailItem.supportImgs || []).map(id => ({ id, role: "support" as const })),
                                  ...(detailItem.counterImgs || []).map(id => ({ id, role: "counter" as const }))
                                ],
                                i
                              )
                            }
                          >
                            <img
                              src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23eef2f8"/><text x="100" y="80" font-family="sans-serif" font-size="14" fill="%234a5568" text-anchor="middle">样本 ${n}</text></svg>`}
                              alt={`支持证据 ${i + 1}`}
                              loading="lazy"
                            />
                            <span>支持证据 {i + 1}，点击放大</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="detail-evidence-empty">暂无支持证据图像</div>
                    )}
                  </section>
                  <section className="detail-section">
                    <h3>反对证据，{(detailItem?.counterImgs || []).length} 张</h3>
                    {detailItem?.counterImgs.length ? (
                      <div className="detail-evidence-grid">
                        {detailItem.counterImgs.map((n, i) => (
                          <button
                            type="button"
                            key={n}
                            className="detail-evidence"
                            data-light-image={(detailItem.supportImgs || []).length + i}
                            aria-label={`放大反对证据 ${i + 1}`}
                            onClick={() =>
                              openLight(
                                [
                                  ...(detailItem.supportImgs || []).map(id => ({ id, role: "support" as const })),
                                  ...(detailItem.counterImgs || []).map(id => ({ id, role: "counter" as const }))
                                ],
                                (detailItem.supportImgs || []).length + i
                              )
                            }
                          >
                            <img
                              src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23fff0f0"/><text x="100" y="80" font-family="sans-serif" font-size="14" fill="%23a74242" text-anchor="middle">样本 ${n}</text></svg>`}
                              alt={`反对证据 ${i + 1}`}
                              loading="lazy"
                            />
                            <span>反对证据 {i + 1}，点击放大</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="detail-evidence-empty">暂无反对证据图像</div>
                    )}
                  </section>
                  <section className="detail-section">
                    <h3>适用限制</h3>
                    <p>{detailItem?.limit}</p>
                  </section>
                  <section className="detail-section detail-review">
                    <h3>人工核实</h3>
                    <div className="knowledge-review-options" role="radiogroup" aria-label="人工核实结论">
                      <label>
                        <input
                          type="radio"
                          name="knowledge-review"
                          value="pending"
                          checked={reviewStatus === "pending"}
                          onChange={() => setReviewStatus("pending")}
                        />
                        待核实
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="knowledge-review"
                          value="confirmed"
                          checked={reviewStatus === "confirmed"}
                          onChange={() => setReviewStatus("confirmed")}
                        />
                        核实通过
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="knowledge-review"
                          value="rejected"
                          checked={reviewStatus === "rejected"}
                          onChange={() => setReviewStatus("rejected")}
                        />
                        驳回
                      </label>
                    </div>
                    <label className="label" htmlFor="review-note">
                      复核备注
                    </label>
                    <textarea
                      className="f textarea"
                      id="review-note"
                      placeholder="填写复核依据（可选）"
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                    ></textarea>
                  </section>
                </div>
                <footer className="modalfooter">
                  <span></span>
                  <div className="actions">
                    <button className="btn" id="cancel-review" type="button" onClick={closeDetail}>
                      取消
                    </button>
                    <button className="btn primary" id="save-review" type="button" onClick={saveReview}>
                      保存
                    </button>
                  </div>
                </footer>
              </section>
            </div>

            {/* 3. Confirm Modal */}
            <div
              className={`overlay confirm-overlay v46-app ${confirmState ? "show" : ""}`}
              id="confirm-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              onClick={() => setConfirmState(null)}
            >
              <section className="modal confirm-modal" tabIndex={-1} onClick={e => e.stopPropagation()}>
                <header className="modalheader">
                  <h2 id="confirm-title">{confirmState?.title || "请确认"}</h2>
                  <button
                    className="iconbtn"
                    id="confirm-close"
                    aria-label="关闭确认窗口"
                    onClick={() => setConfirmState(null)}
                  >
                    ×
                  </button>
                </header>
                <div className="modalcontent" id="confirm-message">
                  {confirmState?.message}
                </div>
                <footer className="modalfooter">
                  <div className="actions">
                    <button type="button" className="btn" id="confirm-cancel" onClick={() => setConfirmState(null)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className={`btn ${confirmState?.danger ? "is-danger" : "primary"}`}
                      id="confirm-accept"
                      onClick={() => {
                        confirmState?.onConfirm();
                        setConfirmState(null);
                      }}
                    >
                      确定
                    </button>
                  </div>
                </footer>
              </section>
            </div>

            {/* 4. Create Mining Modal */}
            <div
              className={`overlay v46-app ${createOpen ? "show" : ""}`}
              id="create-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="新建挖掘"
              onClick={closeCreate}
            >
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modalheader">
                  <div>
                    <h2>新建知识挖掘</h2>
                    <p className="subtitle">选择方向、样本，生成并编辑完整提示词</p>
                  </div>
                  <button className="iconbtn" data-dismiss="create-overlay" aria-label="关闭新建挖掘" title="关闭" onClick={closeCreate}>
                    ×
                  </button>
                </div>
                <div className="modalcontent">
                  <div className="modalgrid">
                    <div>
                      {/* Section 1 */}
                      <section className="form-section">
                        <h3>1. 数据范围</h3>
                        <div className="rangebar">
                          <div>
                            <span className="label">数据集</span>
                            <strong id="form-dataset">{dataset.name}</strong>
                          </div>
                          <div>
                            <span className="label">子数据集</span>
                            <strong id="form-subset">{dataset.name}</strong>
                          </div>
                        </div>
                        <div className="kindrow">
                          <label className="toggle">
                            <input
                              type="radio"
                              name="sample-kind"
                              value="normal"
                              checked={formKind === "normal"}
                              onChange={() => setFormKind("normal")}
                            />{" "}
                            良品知识
                          </label>
                          <label className="toggle">
                            <input
                              type="radio"
                              name="sample-kind"
                              value="defect"
                              checked={formKind === "defect"}
                              onChange={() => setFormKind("defect")}
                            />{" "}
                            异常知识
                          </label>
                        </div>
                      </section>

                      {/* Section 2 */}
                      <section className="form-section">
                        <div className="sectionrow">
                          <h3>2. 选择挖掘方向</h3>
                          <small id="direction-count">
                            已选 {selectedGeneral.size + selectedExplored.size + customDirections.length} 项
                          </small>
                        </div>
                        <div className="preset-title">
                          <span className="label" style={{ margin: 0 }}>
                            通用预设方向（来自现有 15 项默认方向）
                          </span>
                          <button
                            type="button"
                            className="btn small quiet"
                            id="toggle-presets"
                            onClick={() => setShowAllPresets(!showAllPresets)}
                          >
                            {showAllPresets ? "收起为常用方向" : "显示全部 15 项"}
                          </button>
                        </div>
                        <div className="direction-list" id="general-directions">
                          {(showAllPresets
                            ? defaultPresets
                            : defaultPresets.filter((p, i) => i < 6 || selectedGeneral.has(p.id))
                          ).map(p => (
                            <label key={p.id} className="direction">
                              <input
                                type="checkbox"
                                data-dir-kind="preset"
                                data-dir-id={p.id}
                                checked={selectedGeneral.has(p.id)}
                                onChange={e => {
                                  const next = new Set(selectedGeneral);
                                  if (e.target.checked) next.add(p.id);
                                  else next.delete(p.id);
                                  setSelectedGeneral(next);
                                }}
                              />
                              <div>
                                <strong>{p.name}</strong>
                                <span>{p.text}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="label" style={{ marginTop: 14 }}>
                          方向探索结果（当前子数据集）
                        </div>
                        <div className="direction-list" id="explored-directions">
                          {(explorerDirections.s1 || []).map(p => (
                            <label key={p.id} className="direction">
                              <input
                                type="checkbox"
                                data-dir-kind="explore"
                                data-dir-id={p.id}
                                checked={selectedExplored.has(p.id)}
                                onChange={e => {
                                  const next = new Set(selectedExplored);
                                  if (e.target.checked) next.add(p.id);
                                  else next.delete(p.id);
                                  setSelectedExplored(next);
                                }}
                              />
                              <div>
                                <strong>{p.name}</strong>
                                <span>{p.text}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="customrow">
                          <input
                            className="f"
                            id="custom-direction"
                            maxLength={90}
                            placeholder="补充自定义方向（可选）"
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && customInput.trim()) {
                                e.preventDefault();
                                setCustomDirections([...customDirections, customInput.trim()]);
                                setCustomInput("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn"
                            id="add-custom"
                            onClick={() => {
                              if (customInput.trim()) {
                                setCustomDirections([...customDirections, customInput.trim()]);
                                setCustomInput("");
                              }
                            }}
                          >
                            添加方向
                          </button>
                        </div>
                        <div className="tokens" id="custom-direction-tokens">
                          {customDirections.map((dir, i) => (
                            <span key={i} className="token">
                              {dir}{" "}
                              <button
                                type="button"
                                data-remove-custom={i}
                                aria-label={`删除自定义方向 ${dir}`}
                                onClick={() => setCustomDirections(customDirections.filter((_, idx) => idx !== i))}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </section>

                      {/* Section 3 */}
                      <section className="form-section">
                        <div className="sectionrow">
                          <h3>3. 来源图像</h3>
                          <small id="selected-sample-count">已选 {selectedSamples.size} / 9 张</small>
                        </div>
                        <div className="smallhint" style={{ fontSize: 12, color: "#172338", marginBottom: 8 }}>
                          可从当前子数据集中选择观察样本；原型提供 9 张示例图像。
                        </div>
                        <div className="samples" id="sample-grid">
                          {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                            <button
                              key={n}
                              type="button"
                              className={`sample ${selectedSamples.has(n) ? "checked" : ""}`}
                              data-select-sample={n}
                              aria-pressed={selectedSamples.has(n)}
                              onClick={() => {
                                const next = new Set(selectedSamples);
                                if (next.has(n)) next.delete(n);
                                else next.add(n);
                                setSelectedSamples(next);
                              }}
                            >
                              <img
                                alt={`样本 ${n}`}
                                loading="lazy"
                                src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23eef2f8"/><text x="100" y="80" font-family="sans-serif" font-size="14" fill="%234a5568" text-anchor="middle">样本 ${String(n).padStart(2, "0")}</text></svg>`}
                              />
                              <span className="sampleid">样本 {String(n).padStart(2, "0")}</span>
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* Section 4 */}
                      <section className="form-section prompt">
                        <div className="sectionrow">
                          <h3>4. 完整提示词</h3>
                          <button
                            type="button"
                            className="btn small"
                            id="compose-prompt"
                            onClick={() => {
                              setPromptDirty(false);
                              toast("已重新生成提示词");
                            }}
                          >
                            按当前选择重新生成
                          </button>
                        </div>
                        <div className="promptactions">
                          <span className="note" id="prompt-note" style={{ fontSize: 12, color: "#172338" }}>
                            {promptDirty ? "提示词已修改，修改方向后不会自动覆盖" : "已根据当前方向生成，可直接修改"}
                          </span>
                          <button
                            type="button"
                            className="btn small quiet"
                            id="restore-prompt"
                            onClick={() => {
                              setPromptDirty(false);
                              toast("已恢复自动生成版本");
                            }}
                          >
                            恢复自动生成版本
                          </button>
                        </div>
                        <textarea
                          className="f textarea"
                          id="prompt-text"
                          aria-label="完整提示词"
                          spellCheck={false}
                          value={promptText}
                          onChange={e => {
                            setPromptText(e.target.value);
                            setPromptDirty(true);
                          }}
                        ></textarea>
                        <div className="counter">
                          <span>作业级提示词演示；接入真实后端需增加冻结输入字段</span>
                          <span id="prompt-counter">{promptText.length} 字</span>
                        </div>
                      </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="sidepanel">
                      <div className="subtlebox">
                        <h3 className="sidecaption">挖掘配置</h3>
                        <label className="label" htmlFor="job-name">
                          作业名称
                        </label>
                        <input
                          id="job-name"
                          className="f wide"
                          maxLength={80}
                          value={jobNameInput}
                          onChange={e => setJobNameInput(e.target.value)}
                        />
                        <div style={{ height: 13 }}></div>
                        <label className="label" htmlFor="model-select">
                          工作台模型
                        </label>
                        <select className="f wide" id="model-select" disabled value="Qwen3.8-27B-FP8">
                          <option value="Qwen3.8-27B-FP8">Qwen3.8-27B-FP8</option>
                          <option value="Qwen3.5-27B-FP8">Qwen3.5-27B-FP8</option>
                        </select>
                        <div className="smallhint" style={{ marginTop: 8, fontSize: 12, color: "#172338" }}>
                          原型模型为示例；实际使用现有模型配置。
                        </div>
                      </div>

                      <div className="subtlebox">
                        <h3 className="sidecaption">当前选择</h3>
                        <div className="summarylist">
                          <span>知识类型</span>
                          <b id="sum-kind">{formKind === "normal" ? "良品" : "异常"}</b>
                          <span>通用方向</span>
                          <b id="sum-preset">{selectedGeneral.size} 项</b>
                          <span>探索方向</span>
                          <b id="sum-explore">{selectedExplored.size} 项</b>
                          <span>自定义方向</span>
                          <b id="sum-custom">{customDirections.length} 项</b>
                          <span>来源图像</span>
                          <b id="sum-samples">{selectedSamples.size} 张</b>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
                <div className="modalfooter">
                  <span className="muted" style={{ fontSize: 12, color: "#172338" }}>
                    创建后在当前子数据集的作业列表中查看
                  </span>
                  <div className="actions">
                    <button className="btn" data-dismiss="create-overlay" onClick={closeCreate}>
                      取消
                    </button>
                    <button className="btn primary" id="submit-job" onClick={handleSubmitMining}>
                      开始挖掘
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Lightbox */}
            <div
              className={`lightbox v46-app ${lightboxIndex !== null ? "show" : ""}`}
              id="lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="查看证据图片"
              onClick={closeLight}
            >
              <button className="lbclose" id="close-light" onClick={closeLight}>
                ×
              </button>
              <button
                className="lbnav left"
                id="prev-light"
                onClick={e => {
                  e.stopPropagation();
                  stepLight(-1);
                }}
              >
                ‹
              </button>
              {lightboxIndex !== null && lightboxEvidence[lightboxIndex] && (
                <img
                  id="light-img"
                  alt="证据大图"
                  src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%231a2638"/><text x="300" y="230" font-family="sans-serif" font-size="24" fill="%23ffffff" text-anchor="middle">证据图像 样本 ${lightboxEvidence[lightboxIndex].id}</text></svg>`}
                  onClick={e => e.stopPropagation()}
                />
              )}
              <button
                className="lbnav right"
                id="next-light"
                onClick={e => {
                  e.stopPropagation();
                  stepLight(1);
                }}
              >
                ›
              </button>
              <div className="lbcaption" id="light-caption">
                {detailItem?.name}，
                {lightboxIndex !== null && lightboxEvidence[lightboxIndex]?.role === "support" ? "支持证据" : "反对证据"}{" "}
                {(lightboxIndex ?? 0) + 1} / {lightboxEvidence.length}
              </div>
            </div>

            {/* 6. Toast */}
            <div className={`toast ${toastMsg ? "show" : ""}`} id="toast" role="status">
              {toastMsg}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
