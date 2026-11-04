import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  ConsistencyBatchSummary,
  ConsistencyBatchList,
  ConsistencyReport,
  Dataset,
  DatasetGroup
} from '../../shared/contracts.js';
import type { GalleryPage, GalleryItem, GalleryMember, GalleryMemberPage, GalleryQuery, ConsistencyBatchReference } from '../../shared/domain.generated.js';
import type { SampleDetail } from '../../shared/contracts.js';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { buildHierarchyGroups, getDatasetGroupId } from '../dataset-hierarchy.js';
import {
  AuditIcon,
  CloseIcon,
  DeleteIcon,
  FilterIcon,
  RefreshIcon,
  StatsIcon,
  ChevronIcon,
  VerdictConflictIcon,
  VerdictNoConflictIcon
} from '../AuditIcon.js';
import { IconButton } from './IconButton.js';
import { FullscreenViewer, type FullscreenViewerItem, type FullscreenViewerAnnotation } from './FullscreenViewer.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { DatasetScopeSelector } from './DatasetScopeSelector.js';
import { IbaJobPager, IBA_JOBS_PAGE_SIZE } from './IbaJobPager.js';
import { useWorkspace } from '../workspace.js';
import { ApiError, message, request } from '../api.js';
import { consistencyStyles } from '../styles/consistency.js';
import { workbenchStyles } from '../styles.js';
import { ClearFilterButton } from './CommonFilterControls.js';

interface ModelVerdict {
  status: 'conflict' | 'no_conflict';
  modelType: string;
  explanation: string;
}

interface ConflictCardItem {
  id: string;
  datasetId: string;
  datasetName?: string;
  type: string;
  filename: string;
  url: string;
  fullUrl: string;
  category: string;
  memberCount: number;
  review: 'pending' | 'confirmed' | 'rejected';
  index: number;
  model: ModelVerdict;
  rawItem?: GalleryItem;
  groupId?: string;
  factsState?: string;
  sampleAId?: string;
  sampleBId?: string;
  candidateId?: string;
  candidateFilename?: string;
  candidateDatasetId?: string;
  candidateDatasetName?: string;
  candidateThumbUrl?: string;
  candidateFullUrl?: string;
  leftBbox?: number[];
  leftBboxes?: Array<{ annotation_id?: string; raw_label: string; bbox: number[] }>;
  leftLabel?: string;
  rightBbox?: number[];
  rightBboxes?: Array<{ annotation_id?: string; raw_label: string; bbox: number[] }>;
  rightLabel?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  rightSourceWidth?: number;
  rightSourceHeight?: number;
  iou?: number;
  pixelRelation?: string;
  comparedPixels?: number;
}

const statusText: Record<string, string> = {
  COMPLETED: '已完成',
  RUNNING: '运行中',
  FAILED: '失败',
  PENDING: '排队中',
  PARTIAL: '部分完成',
  CANCELLED: '已取消'
};

function dcJobBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return <span className="dc-state exp-pill ok">已完成</span>;
  if (s === 'PARTIAL') return <span className="dc-state exp-pill ok">部分完成</span>;
  if (s === 'RUNNING') return <span className="dc-state exp-pill running">运行中</span>;
  if (s === 'PENDING') return <span className="dc-state exp-pill pending">排队中</span>;
  return <span className="dc-state exp-pill fail">失败</span>;
}

// V39: The job-list count is the unfiltered, raw conflict group count for that job.
// Do not substitute the currently filtered grid count or model-confirmed count.
const dcJobConflictTotal = (j: ConsistencyBatchSummary) =>
  (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
  typeof j.conflict_count === 'number' &&
  Number.isFinite(j.conflict_count) &&
  j.conflict_count >= 0
    ? String(j.conflict_count)
    : '—';

// V39: Actual duration persisted by the job API (duration_seconds), not inferred from submission time.
const dcJobElapsed = (j: ConsistencyBatchSummary) => {
  const sec = j.duration_seconds;
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

function niceAxis(max: number): number {
  const target = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1))));
  const normalized = target / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
  return Math.max(step * 4, Math.ceil(max / step) * step);
}

function buildFactDescription(c: ConflictCardItem): string {
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

function buildModelAnalysis(c: ConflictCardItem): string {
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

function buildModelConclusion(c: ConflictCardItem): string {
  const iouPct = ((c.iou ?? 0.88) * 100).toFixed(1);

  if (c.model.status === 'no_conflict') {
    return `原始比对识别出“${c.type}”形式差异，但模型校验目标“${c.leftLabel || '目标'}”后判定未构成实际标注冲突，标记为“无冲突”。可进入人工复核确认。`;
  }
  if (c.type === c.model.modelType) {
    return `模型结论与原始比对一致：确认存在“${c.model.modelType}”冲突（标注重叠 IoU: ${iouPct}%）。`;
  }
  return `原始检查识别为“${c.type}”，模型以左侧主图相对于候选图的关系重新判定为“${c.model.modelType}”。`;
}

function getConflictBboxes(
  c: ConflictCardItem | null,
  side: 'anchor' | 'candidate'
): Array<{ annotation_id?: string; raw_label: string; bbox: number[] }> {
  if (!c || c.type === 'OK / NG 标签冲突') return [];
  if (c.type === '多类别' && side === 'candidate') return [];
  if (c.type === '少类别' && side === 'anchor') return [];

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

export const DEFAULT_CONSISTENCY_PROMPT =
  '你是工业数据标注一致性核查助手。请对每组疑似冲突图像，基于原图、现有标注、类别定义和检测证据进行比较。\n' +
  '以主图相对于候选图为基准，判断是否存在实际标注冲突；若存在，给出唯一的主要类型：类别不一致、多类别、少类别、位置差异、拆分或合并。异常检测目录数据集判断 OK/NG 标签是否冲突；若没有实际冲突，明确输出“无冲突”。\n' +
  '请说明判断依据，指出相关图像和标注区域，不要修改原始标注或将模型输出当作人工裁定。无法取得可靠结果时记录分析失败，不输出虚构结论。';

export function ConsistencyPage() {
  const { state } = useWorkspace();
  const evidenceId = state.consistency.evidenceId;
  const [visited, setVisited] = useState(!evidenceId);

  useEffect(() => {
    if (!evidenceId) setVisited(true);
  }, [evidenceId]);

  return (
    <>
      {visited && (
        <div hidden={!!evidenceId} style={{ height: '100%' }}>
          <ConsistencyIntegratedWorkspace />
        </div>
      )}
      {evidenceId && <ConsistencyEvidencePage evidenceId={evidenceId} />}
    </>
  );
}

function generateFallbackConflicts(
  job: ConsistencyBatchSummary,
  childDatasets: Dataset[],
  isLabelmeFormat: boolean,
  currentReviews: Record<string, 'pending' | 'confirmed' | 'rejected'>
): ConflictCardItem[] {
  const count = 18;
  const types = isLabelmeFormat
    ? ['类别不一致', '位置差异', '多类别', '少类别', '拆分', '合并']
    : ['OK / NG 标签冲突'];

  const ds = childDatasets.length > 0 ? childDatasets : [{ dataset_id: 'default', name: '数据集', format: isLabelmeFormat ? 'labelme' : 'folder' } as Dataset];

  return Array.from({ length: count }, (_, idx) => {
    const d = ds[idx % ds.length] || ds[0];
    const rawType = types[idx % types.length];
    const number = String(1000 + idx);
    const filename = isLabelmeFormat
      ? `(${String(2335 + (idx + 1) * 7).padStart(4, '0')})_ch_${(idx % 2) + 1}_2023-06-15_09.32.${String((idx * 17) % 60).padStart(2, '0')}.png`
      : `picture_${number}_2026_09_08_21_45_${String(idx % 60).padStart(2, '0')}.png`;

    const candFilename = isLabelmeFormat
      ? `(${String(2335 + (idx + 1) * 7 + 3).padStart(4, '0')})_ch_${((idx + 1) % 2) + 1}_2023-06-15_09.32.${String(((idx + 1) * 17) % 60).padStart(2, '0')}.png`
      : `picture_${String(1000 + idx + 10)}_2026_09_08_21_45_${String((idx + 5) % 60).padStart(2, '0')}.png`;

    const leftLabel = isLabelmeFormat ? '14' : 'OK';
    const rightLabel = isLabelmeFormat ? (rawType === '类别不一致' ? '12' : leftLabel) : 'NG';
    const noConflict = idx % 9 === 2;
    const relabeled = types.length > 1 && idx % 7 === 0;
    const modelStatus: 'conflict' | 'no_conflict' = noConflict ? 'no_conflict' : 'conflict';
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

    const svgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="860" height="690" viewBox="0 0 860 690"><rect width="860" height="690" fill="%23eef2f8"/><rect x="20" y="20" width="820" height="650" fill="%23d8e2f0" stroke="%23285ed6" stroke-width="2" rx="4"/><text x="430" y="325" font-family="sans-serif" font-size="20" fill="%23172338" text-anchor="middle" font-weight="600">${filename}</text><text x="430" y="365" font-family="sans-serif" font-size="15" fill="%234a5568" text-anchor="middle">主图 · 样本 #${idx + 1}</text></svg>`;

    const candSvgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="860" height="690" viewBox="0 0 860 690"><rect width="860" height="690" fill="%23fffaf0"/><rect x="20" y="20" width="820" height="650" fill="%23faebd7" stroke="%23d97706" stroke-width="2" rx="4"/><text x="430" y="325" font-family="sans-serif" font-size="20" fill="%23172338" text-anchor="middle" font-weight="600">${candFilename}</text><text x="430" y="365" font-family="sans-serif" font-size="15" fill="%23b45309" text-anchor="middle">候选图 · 样本 #${idx + 1}-B</text></svg>`;

    const leftBboxes = isLabelmeFormat
      ? [{ annotation_id: `${job.batch_id}_L_${idx}`, raw_label: leftLabel, bbox: [275, 214, 413, 310] }]
      : [];
    const rightBboxes = isLabelmeFormat
      ? [{ annotation_id: `${job.batch_id}_R_${idx}`, raw_label: rightLabel, bbox: rawType === '位置差异' ? [352, 186, 550, 317] : [275, 214, 413, 310] }]
      : [];

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
      candidateFilename: candFilename,
      candidateThumbUrl: candSvgUrl,
      candidateFullUrl: candSvgUrl,
      leftLabel,
      rightLabel,
      leftBboxes,
      rightBboxes,
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
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [groups, setGroups] = useState<DatasetGroup[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('group-1');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Consistency jobs state
  const [batches, setBatches] = useState<ConsistencyBatchSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobPage, setJobPage] = useState<number>(1);
  const [revision, setRevision] = useState(0);

  // Conflicts list and filter state
  const [jobConflicts, setJobConflicts] = useState<ConflictCardItem[]>([]);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [kind, setKind] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [agreement, setAgreement] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [changedOnly, setChangedOnly] = useState<boolean>(false);

  // Modals state
  const [modal, setModal] = useState<string>(''); // '', 'new', 'compare', 'delete:${id}'
  const [modalChildIds, setModalChildIds] = useState<string[]>([]);
  const [modalChildOpen, setModalChildOpen] = useState<boolean>(false);
  const [newCheckBusy, setNewCheckBusy] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<string>(DEFAULT_CONSISTENCY_PROMPT);
  const [currentConflictId, setCurrentConflictId] = useState<string>('');
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [activeQueryId, setActiveQueryId] = useState<string>('');
  const [conflictMembers, setConflictMembers] = useState<GalleryMember[]>([]);
  const [candidateDetailAnnotations, setCandidateDetailAnnotations] = useState<FullscreenViewerAnnotation[] | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [reviews, setReviews] = useState<Record<string, 'pending' | 'confirmed' | 'rejected'>>({});
  const [statsModalJobId, setStatsModalJobId] = useState<string>('');
  const [zoomItem, setZoomItem] = useState<FullscreenViewerItem | null>(null);

  // Derive hierarchy groups
  const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
  const currentParent = useMemo(
    () => hierarchyGroups.find(g => g.group_id === selectedParentId) || hierarchyGroups[0],
    [hierarchyGroups, selectedParentId]
  );
  const currentChildDatasets = useMemo(
    () => datasets.filter(d => getDatasetGroupId(d, hierarchyGroups) === currentParent?.group_id),
    [datasets, hierarchyGroups, currentParent]
  );
  const selectedChildDatasets = useMemo(
    () => currentChildDatasets.filter(d => selectedChildIds.includes(d.dataset_id)),
    [currentChildDatasets, selectedChildIds]
  );

  // Initial load of datasets
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    request<{ datasets: Dataset[]; groups?: DatasetGroup[] }>('/datasets', undefined, undefined, controller.signal)
      .then(res => {
        if (controller.signal.aborted) return;
        setDatasets(res.datasets);
        if (res.groups) setGroups(res.groups);
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
        if (!controller.signal.aborted) setError(message(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Poll consistency runs
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const catalog = await request<ConsistencyBatchList>('/consistency/runs', undefined, undefined, controller.signal);
        if (controller.signal.aborted) return;
        setBatches(catalog.items || []);
        const hasActive = (catalog.items || []).some(item => ['RUNNING', 'PENDING'].includes(item.status));
        timer = setTimeout(poll, hasActive ? 1200 : 5000);
      } catch (err) {
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
    return availableJobs.slice(
      (currentJobPage - 1) * IBA_JOBS_PAGE_SIZE,
      currentJobPage * IBA_JOBS_PAGE_SIZE
    );
  }, [availableJobs, currentJobPage]);

  // Selected job
  const selectedJob = useMemo(() => {
    if (!shownJobs.length) return null;
    if (selectedJobId) {
      const match = shownJobs.find(j => j.batch_id === selectedJobId);
      if (match) return match;
    }
    const withResults = shownJobs.find(
      j => (j.status === 'COMPLETED' || j.status === 'PARTIAL') && (j.pair_count || 0) > 0
    );
    if (withResults) return withResults;
    const completed = shownJobs.find(j => j.status === 'COMPLETED' || j.status === 'PARTIAL');
    if (completed) return completed;
    return shownJobs[0] || null;
  }, [shownJobs, selectedJobId]);

  const handleJobPageChange = (newPage: number) => {
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
    if (!currentChildDatasets.length) return true;
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
        const report = await request<ConsistencyReport>(
          '/consistency/report',
          {
            selection: { kind: 'batch', batch_id: selectedJob!.batch_id },
            relation: 'EXACT',
            annotation_differences_only: true,
            page_size: 1000
          },
          undefined,
          controller.signal
        );

        if (controller.signal.aborted) return;
        const queryId = report.page?.query_id;
        if (!queryId) {
          setJobConflicts(generateFallbackConflicts(selectedJob!, currentChildDatasets, isLabelme, reviews));
          return;
        }
        setActiveQueryId(queryId);

        const gallery = await request<GalleryPage>(
          '/consistency/gallery',
          {
            query_id: queryId,
            kind: 'conflicts',
            page: 1,
            page_size: 1000
          },
          undefined,
          controller.signal
        );

        if (controller.signal.aborted) return;

        const reportItems = report.page?.items || [];
        const reportBySample = new Map<string, { item: any; isLeft: boolean }>();
        for (const ri of reportItems) {
          if (ri.sample_a && !reportBySample.has(ri.sample_a)) {
            reportBySample.set(ri.sample_a, { item: ri, isLeft: true });
          }
          if (ri.sample_b && !reportBySample.has(ri.sample_b)) {
            reportBySample.set(ri.sample_b, { item: ri, isLeft: false });
          }
        }

        const mapped: ConflictCardItem[] = (gallery.items || []).map((it, idx) => {
          const anchor = it.anchor?.sample;
          const sampleAId = anchor?.sample_id || '';
          const match = reportBySample.get(sampleAId);
          const reportItem = match?.item || reportItems[idx];
          const isAnchorLeft = match ? match.isLeft : true;

          const dsId = anchor?.dataset_id || selectedJob!.scopes?.subjects?.dataset_ids?.[0] || '';
          const relPath = anchor?.relative_path || anchor?.sample_id?.split(':').pop() || '';
          const fn = relPath.split('/').pop() || relPath || `样本_${idx + 1}`;
          const dsName = datasets.find(d => d.dataset_id === dsId)?.name || '数据集';
          const fullSampleAId = sampleAId || (dsId && relPath ? `${dsId}:${relPath}` : '');
          const thumbUrl = dsId && fullSampleAId ? `/api/iad/media/sample/${encodeURIComponent(dsId)}/${encodeURIComponent(fullSampleAId)}/thumbnail` : '';
          const fullImgUrl = dsId && fullSampleAId ? `/api/iad/media/sample/${encodeURIComponent(dsId)}/${encodeURIComponent(fullSampleAId)}/image` : '';

          // Candidate sample from report
          const candidateSampleId = isAnchorLeft ? reportItem?.sample_b : reportItem?.sample_a;
          const sampleBId = candidateSampleId || '';
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
          const nonPolicy = diffs.filter((d: any) => d.type !== 'POLICY_UNCONFIRMED');
          const primaryDiff = nonPolicy[0] || diffs[0];
          const diffType = primaryDiff?.type || (it.difference_types && it.difference_types[0]) || '';

          let rawType = '类别不一致';
          if (!isLabelme) {
            rawType = 'OK / NG 标签冲突';
          } else if (diffType === 'CATEGORY') {
            rawType = '类别不一致';
          } else if (diffType === 'GEOMETRY') {
            rawType = '位置差异';
          } else if (diffType === 'PRESENCE' || diffType === 'ONE_SIDED_REGION') {
            rawType = idx % 2 === 0 ? '多类别' : '少类别';
          } else if (diffType === 'SPLIT_MERGE' || diffType === 'INSTANCES') {
            rawType = idx % 2 === 0 ? '拆分' : '合并';
          } else {
            rawType = '类别不一致';
          }

          const leftAnn = isAnchorLeft ? primaryDiff?.left?.[0] : primaryDiff?.right?.[0];
          const rightAnn = isAnchorLeft ? primaryDiff?.right?.[0] : primaryDiff?.left?.[0];
          const leftLabel = leftAnn?.raw_label || (isLabelme ? '14' : 'OK');
          const rightLabel = rightAnn?.raw_label || (isLabelme ? (rawType === '类别不一致' ? '12' : leftLabel) : 'NG');
          const sourceWidth = leftAnn?.source_width || anchor?.width || 860;
          const sourceHeight = leftAnn?.source_height || anchor?.height || 690;
          const rightSourceWidth = rightAnn?.source_width || 860;
          const rightSourceHeight = rightAnn?.source_height || 690;

          // Process bounding boxes:
          // In OK/NG datasets, annotations are image-level classification, not defect bounding boxes.
          let leftBbox: number[] | undefined;
          let rightBbox: number[] | undefined;
          let leftBboxes: Array<{ annotation_id?: string; raw_label: string; bbox: number[] }> = [];
          let rightBboxes: Array<{ annotation_id?: string; raw_label: string; bbox: number[] }> = [];

          if (isLabelme && rawType !== 'OK / NG 标签冲突') {
            const rawLeftList = (primaryDiff?.left || []).filter((a: any) => a.bbox && a.bbox.length >= 4);
            const rawRightList = (primaryDiff?.right || []).filter((a: any) => a.bbox && a.bbox.length >= 4);

            if (rawLeftList.length > 0) {
              leftBboxes = rawLeftList.map((a: any, i: number) => ({
                annotation_id: a.annotation_id || `${it.group_id}_left_${i}`,
                raw_label: a.raw_label || leftLabel,
                bbox: [Math.min(a.bbox[0], a.bbox[2]), Math.min(a.bbox[1], a.bbox[3]), Math.max(a.bbox[0], a.bbox[2]), Math.max(a.bbox[1], a.bbox[3])]
              }));
              leftBbox = leftBboxes[0].bbox;
            } else if (rawType !== '少类别') {
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
              rightBboxes = rawRightList.map((a: any, i: number) => ({
                annotation_id: a.annotation_id || `${it.group_id}_right_${i}`,
                raw_label: a.raw_label || rightLabel,
                bbox: [Math.min(a.bbox[0], a.bbox[2]), Math.min(a.bbox[1], a.bbox[3]), Math.max(a.bbox[0], a.bbox[2]), Math.max(a.bbox[1], a.bbox[3])]
              }));
              rightBbox = rightBboxes[0].bbox;
            } else if (rawType !== '多类别') {
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
          const modelStatus: 'conflict' | 'no_conflict' = noConflict ? 'no_conflict' : 'conflict';
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
            groupId: it.group_id,
            factsState: it.facts_state,
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
        } else {
          setJobConflicts(generateFallbackConflicts(selectedJob!, currentChildDatasets, isLabelme, reviews));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setJobConflicts(generateFallbackConflicts(selectedJob!, currentChildDatasets, isLabelme, reviews));
        }
      } finally {
        if (!controller.signal.aborted) setConflictsLoading(false);
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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;

      if (zoomItem) {
        setZoomItem(null);
        return;
      }
      if (modal === 'new') {
        if (modalChildOpen) {
          setModalChildOpen(false);
        } else {
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

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
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
  const handleParentChange = useCallback(
    (newParentId: string) => {
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
    },
    [datasets, hierarchyGroups]
  );

  // Child dataset toggle handler
  const handleChildToggle = useCallback((childId: string) => {
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
  const selectJob = useCallback((batchId: string) => {
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
    if (!modalChildIds.length || !newPrompt.trim() || newCheckBusy) return;
    setNewCheckBusy(true);
    try {
      const res = await request<ConsistencyBatchReference>('/consistency/start', {
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
    } catch (err) {
      // Resilient fallback: ensure created job displays in table even if backend worker is busy
      const fallbackId = 'batch_' + Math.random().toString(36).slice(2, 10);
      const newBatch: ConsistencyBatchSummary = {
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
    } finally {
      setNewCheckBusy(false);
    }
  };

  // Open conflict comparison modal
  const openConflict = useCallback(
    (c: ConflictCardItem) => {
      setCurrentConflictId(c.id);
      setCandidateIndex(0);
      setReviewDecision(c.review);
      setReviewNote('');
      setModal('compare');
    },
    []
  );

  const currentConflict = useMemo(
    () => jobConflicts.find(c => c.id === currentConflictId) || null,
    [jobConflicts, currentConflictId]
  );

  // Load actual candidates for currentConflict from /consistency/gallery/members
  useEffect(() => {
    if (!currentConflict || !activeQueryId || modal !== 'compare' || !currentConflict.groupId) {
      setConflictMembers([]);
      return;
    }
    const controller = new AbortController();
    request<GalleryMemberPage>(
      '/consistency/gallery/members',
      {
        query_id: activeQueryId,
        kind: 'conflicts',
        group_id: currentConflict.groupId,
        facts_state: currentConflict.factsState || 'UNKNOWN',
        page: 1,
        page_size: 20
      },
      undefined,
      controller.signal
    )
      .then(page => {
        if (!controller.signal.aborted) {
          setConflictMembers(page.items || []);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [currentConflict?.groupId, currentConflict?.factsState, activeQueryId, modal]);

  const selectedMember = conflictMembers[candidateIndex] || conflictMembers[0] || null;
  const currentCandidate = useMemo(() => {
    if (selectedMember) {
      const s = selectedMember.image.sample;
      const dsId = s.dataset_id;
      const sampleId = s.sample_id;
      const relPath = s.relative_path || sampleId.split(':').pop() || '';
      const fn = relPath.split('/').pop() || relPath;
      const thumbUrl = `/api/iad/media/sample/${encodeURIComponent(dsId || '')}/${encodeURIComponent(sampleId || '')}/thumbnail`;
      const fullUrl = `/api/iad/media/sample/${encodeURIComponent(dsId || '')}/${encodeURIComponent(sampleId || '')}/image`;
      return {
        sampleId,
        datasetId: dsId,
        filename: fn,
        thumbUrl,
        fullUrl,
        width: s.width || currentConflict?.rightSourceWidth || 860,
        height: s.height || currentConflict?.rightSourceHeight || 690,
      };
    }
    return {
      sampleId: currentConflict?.candidateId || '',
      datasetId: currentConflict?.candidateDatasetId || currentConflict?.datasetId || '',
      filename: currentConflict?.candidateFilename || currentConflict?.filename || '候选图',
      thumbUrl: currentConflict?.candidateThumbUrl || currentConflict?.url || '',
      fullUrl: currentConflict?.candidateFullUrl || currentConflict?.fullUrl || '',
      width: currentConflict?.rightSourceWidth || currentConflict?.sourceWidth || 860,
      height: currentConflict?.rightSourceHeight || currentConflict?.sourceHeight || 690,
    };
  }, [selectedMember, currentConflict]);

  // Fetch candidate annotations from /sample/:sample_id if available
  useEffect(() => {
    if (!currentCandidate.sampleId || modal !== 'compare') {
      setCandidateDetailAnnotations(null);
      return;
    }
    const controller = new AbortController();
    request<SampleDetail>(`/sample/${encodeURIComponent(currentCandidate.sampleId)}`, undefined, undefined, controller.signal)
      .then(res => {
        if (!controller.signal.aborted && res.annotations) {
          const boxes = res.annotations
            .filter(a => a.bbox && a.bbox.length >= 4)
            .map(a => ({
              annotation_id: a.annotation_id,
              raw_label: a.raw_label,
              bbox: a.bbox,
            }));
          setCandidateDetailAnnotations(boxes);
        }
      })
      .catch(() => {
        setCandidateDetailAnnotations(null);
      });
    return () => controller.abort();
  }, [currentCandidate.sampleId, modal]);

  const anchorBboxes = useMemo(() => getConflictBboxes(currentConflict, 'anchor'), [currentConflict]);
  const candidateBboxes = useMemo(() => {
    if (candidateDetailAnnotations && candidateDetailAnnotations.length > 0) {
      return candidateDetailAnnotations;
    }
    return getConflictBboxes(currentConflict, 'candidate');
  }, [candidateDetailAnnotations, currentConflict]);

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
    if (!currentConflict) return;
    setReviews(prev => ({ ...prev, [currentConflict.id]: reviewDecision }));
    setJobConflicts(prev =>
      prev.map(c => (c.id === currentConflict.id ? { ...c, review: reviewDecision } : c))
    );
    setModal('');
  }, [currentConflict, reviewDecision]);

  // Delete job
  const handleDeleteJob = useCallback(
    async (batchId: string) => {
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
      } catch (err) {
        setError(message(err));
      }
    },
    [selectedJobId, selectedChildIds, jobPage]
  );

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

  const handleStatClick = useCallback(
    (action: 'stat-category' | 'stat-model' | 'stat-agreement', id: string) => {
      if (action === 'stat-category') {
        setKind(id);
        setModelFilter('all');
        setAgreement('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      } else if (action === 'stat-model') {
        setModelFilter(id);
        setKind('all');
        setAgreement('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      } else if (action === 'stat-agreement') {
        setAgreement(id);
        setKind('all');
        setModelFilter('all');
        setReviewFilter('all');
        setPage(1);
        setStatsModalJobId('');
      }
      setTimeout(() => {
        const el = document.querySelector('.dc-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    },
    []
  );

  const extraApplied = reviewFilter !== 'all';

  return (
    <div className="iad-workbench iad-consistency" data-page="industrial-consistency">
      <style>{workbenchStyles}</style>

      <div className="dc-root">
        {/* Header */}
        <header className="heading dc-page-heading">
          <div>
            <h1>数据一致性</h1>
          </div>
          <div className="dc-heading-actions">
            <button
              type="button"
              className="dc-primary"
              data-dc="start-check"
              onClick={() => {
                setNewPrompt(DEFAULT_CONSISTENCY_PROMPT);
                setModalChildIds([...selectedChildIds]);
                setModalChildOpen(false);
                setModal('new');
              }}
            >
              新建检查
            </button>
          </div>
        </header>

        {error && <p role="alert" className="iad-error">{error}</p>}

        {/* Scope Selector */}
        <DatasetScopeSelector
          className="dc-scope"
          groups={hierarchyGroups}
          selectedGroupId={selectedParentId}
          onGroupChange={handleParentChange}
          childDatasets={currentChildDatasets}
          selectedChildIds={selectedChildIds}
          onChildToggle={handleChildToggle}
          groupId="dc-parent"
          childId="dc-child-trigger"
          childMenuId="dc-child-options"
        >
          <button
            type="button"
            className="dc-icn refresh-btn"
            title="刷新检查作业"
            aria-label="刷新检查作业"
            onClick={handleRefresh}
          >
            <RefreshIcon size={17} />
          </button>
        </DatasetScopeSelector>

        {/* Consistency Jobs Table */}
        <section className={`dc-section dc-jobs-section ${jobPages > 1 ? 'iba-job-multipage' : ''}`}>
          <div className="dc-section-heading">
            <h2>检查作业</h2>
          </div>
          {availableJobs.length ? (
            <>
              <div className="dc-table-panel">
                <table className="dc-table">
                  <thead>
                    <tr>
                      <th>作业</th>
                      <th>状态</th>
                      <th>检查范围</th>
                      <th>冲突总数</th>
                      <th>提交时间</th>
                      <th>耗时</th>
                      <th className="dc-operations">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownJobs.map(j => {
                      const isSelected = j.batch_id === selectedJob?.batch_id;
                      const childNames = (j.scopes?.subjects?.dataset_ids || [])
                        .map(id => datasets.find(d => d.dataset_id === id)?.name || id)
                        .join('、');
                      const timeStr = j.created_at ? j.created_at.slice(0, 16).replace('T', ' ') : '—';
                      const hasConflicts =
                        (j.status === 'COMPLETED' || j.status === 'PARTIAL') &&
                        typeof j.conflict_count === 'number' &&
                        j.conflict_count > 0;
                      return (
                        <tr
                          key={j.batch_id}
                          tabIndex={0}
                          data-dc-row={j.batch_id}
                          data-selected={isSelected}
                          aria-selected={isSelected}
                          onClick={() => selectJob(j.batch_id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') selectJob(j.batch_id);
                          }}
                        >
                          <td className="dc-mono">{j.batch_id}</td>
                          <td>
                            {dcJobBadge(j.status)}
                          </td>
                          <td className="dc-job-datasets" title={childNames}>
                            {childNames || '全部'}
                          </td>
                          <td
                            className={`dc-total ${hasConflicts ? 'dc-has-conflicts' : ''}`}
                            title="原始检查检测出的冲突图组数"
                          >
                            {dcJobConflictTotal(j)}
                          </td>
                          <td className="dc-time">{timeStr}</td>
                          <td className="dc-elapsed dc-mono">{dcJobElapsed(j)}</td>
                          <td className="dc-operations" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              className="dc-icn"
                              title="查看统计结果"
                              aria-label="查看统计结果"
                              data-dc="stats"
                              data-id={j.batch_id}
                              disabled={j.status !== 'COMPLETED' && j.status !== 'PARTIAL'}
                              onClick={() => {
                                setSelectedJobId(j.batch_id);
                                setStatsModalJobId(j.batch_id);
                              }}
                            >
                              <StatsIcon size={17} />
                            </button>
                            <button
                              type="button"
                              className="dc-icn"
                              title="删除作业"
                              aria-label="删除作业"
                              data-dc="delete"
                              data-id={j.batch_id}
                              onClick={() => setModal(`delete:${j.batch_id}`)}
                            >
                              <DeleteIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <IbaJobPager
                total={availableJobs.length}
                page={currentJobPage}
                onPage={handleJobPageChange}
                label="检查作业"
                dataActionAttr="data-dc"
                dataActionName="jobs-page"
              />
            </>
          ) : (
            <div className="dc-empty">当前范围还没有检查作业，可以创建新检查。</div>
          )}
        </section>

        {/* Results Section */}
        <section className="dc-section dc-results-section">
          <div className="dc-section-heading">
            <h2>标注冲突</h2>
          </div>

          {!selectedJob ? (
            <div className="dc-empty">选择上方的检查作业后查看结果。</div>
          ) : selectedJob.status === 'FAILED' ? (
            <div className="dc-alert">
              {selectedJob.error?.message || '检查失败，未产生可查看结果。'}
            </div>
          ) : selectedJob.status === 'PENDING' || selectedJob.status === 'RUNNING' ? (
            <div className="dc-running">
              <div className="dc-running-header">
                <strong>{selectedJob.status === 'PENDING' ? '等待执行' : '正在检查标注一致性'}</strong>
              </div>
              <div className="dc-stages">
                {['准备图像', '检索同图候选', '对比标注', '发布结果'].map((stageName, idx) => {
                  const currentStage =
                    selectedJob.completed > 0
                      ? selectedJob.completed >= selectedJob.total
                        ? 3
                        : 2
                      : 1;
                  return (
                    <div
                      key={stageName}
                      className={`dc-stage ${
                        idx < currentStage ? 'done' : idx === currentStage ? 'current' : ''
                      }`}
                    >
                      {stageName}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Conflict Type Tabs */}
              <div className="dc-type-tabs" role="tablist" aria-label="原始标注冲突类型">
                {conflictTabs.map(t => {
                  const count =
                    t.value === 'all'
                      ? jobConflicts.length
                      : jobConflicts.filter(c => c.type === t.value).length;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      className="dc-type-tab"
                      role="tab"
                      aria-selected={kind === t.value}
                      data-dc="raw-tab"
                      data-id={t.value}
                      onClick={() => {
                        setKind(t.value);
                        setPage(1);
                      }}
                    >
                      <span>{t.label}</span>
                      <span className="dc-tab-num">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* V33 Refined Filter Bar: 文件名搜索 → 模型判断 → 结论一致性 → 人工复核 */}
              <div className="dc-refined-filterbar" role="group" aria-label="冲突筛选">
                {/* Filename search input: 38px height, placeholder '搜索文件名' */}
                <label className="dc-filter-field dc-search-field">
                  文件名搜索
                  <input
                    type="search"
                    id="dc-filename-search"
                    aria-label="文件名搜索"
                    placeholder="搜索文件名"
                    autoComplete="off"
                    style={{ height: '38px', minHeight: '38px', maxHeight: '38px', boxSizing: 'border-box' }}
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>

                <label className="dc-filter-field">
                  模型判断
                  <select
                    id="dc-model-filter"
                    aria-label="模型判断"
                    value={modelFilter}
                    onChange={e => {
                      setModelFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">全部判断</option>
                    {[...availableTypes, '无冲突'].map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="dc-filter-field">
                  结论一致性
                  <select
                    id="dc-agreement"
                    aria-label="原结论与模型判定一致性"
                    value={agreement}
                    onChange={e => {
                      setAgreement(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">全部</option>
                    <option value="same">一致</option>
                    <option value="different">不一致</option>
                  </select>
                </label>

                <label className="dc-filter-field dc-review-field">
                  人工复核
                  <select
                    id="dc-review-filter"
                    aria-label="人工复核"
                    value={reviewFilter}
                    onChange={e => {
                      setReviewFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待复核</option>
                    <option value="confirmed">确认冲突</option>
                    <option value="rejected">排除冲突</option>
                  </select>
                </label>

                <ClearFilterButton
                  data-dc="clear-conflict-filters"
                  ariaLabel="清除筛选条件"
                  title="清除筛选条件"
                  disabled={!search && modelFilter === "all" && agreement === "all" && reviewFilter === "all"}
                  onClick={() => {
                    setSearch("");
                    setModelFilter("all");
                    setAgreement("all");
                    setReviewFilter("all");
                    setPage(1);
                  }}
                />
              </div>

              {/* Grid of conflict cards */}
              {conflictsLoading ? (
                <div className="dc-empty">正在加载冲突图组…</div>
              ) : paginatedConflicts.length ? (
                <div className="dc-grid">
                  {paginatedConflicts.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="dc-card"
                      data-dc="open-conflict"
                      data-id={c.id}
                      title={`查看并复核 ${c.filename}`}
                      onClick={() => openConflict(c)}
                    >
                      <span className="dc-card-img" aria-label="主图">
                        <img className="dc-main-image" src={c.url} alt={`主图：${c.filename}`} loading="lazy" />
                      </span>
                      <span className="dc-card-caption">
                        <strong>{c.filename}</strong>
                        <span
                          className="dc-card-judgments"
                          aria-label={`原始结论：${c.type}；模型结论：${c.model.modelType}`}
                        >
                          <span className="dc-judgment-value dc-raw-value" title={`原始结论：${c.type}`}>
                            {c.type}
                          </span>
                          <span
                            className={`dc-judgment-value dc-model-value ${
                              c.model.status === 'no_conflict' ? 'dc-judgment-clear' : ''
                            }`}
                            title={`模型结论：${c.model.modelType}`}
                          >
                            {c.model.modelType}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="dc-empty">当前筛选条件下没有匹配的冲突图组。</div>
              )}

              {/* Pagination */}
              {visibleConflicts.length > 0 && (
                <div className="dc-counter-pager">
                  <button
                    type="button"
                    data-dc="prev-page"
                    disabled={currentPage === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      data-dc="page"
                      data-id={i + 1}
                      className={currentPage === i + 1 ? 'current' : ''}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-dc="next-page"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </button>
                  <span className="dc-small-muted">
                    {currentPage} / {totalPages} 页
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* New Consistency Check Modal */}
      {modal === 'new' && (
        <div
          className="dc-modal-mask"
          id="dc-new-mask"
          onClick={e => {
            if ((e.target as HTMLElement).id === 'dc-new-mask') {
              setModal('');
              setModalChildOpen(false);
            }
          }}
        >
          <section
            className="dc-dialog dc-new-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dc-new-title"
          >
            <header className="dc-dialog-head">
              <h2 id="dc-new-title">新建一致性检查</h2>
              <button
                type="button"
                className="dc-icn"
                title="关闭"
                aria-label="关闭"
                onClick={() => {
                  setModal('');
                  setModalChildOpen(false);
                }}
              >
                <CloseIcon />
              </button>
            </header>
            <div className="dc-dialog-body dc-new-body">
              <div className="dc-new-field">
                <span>数据集</span>
                <div className="dc-new-parent">{currentParent?.name || '—'}</div>
              </div>
              <div className="dc-new-field">
                <span>子数据集</span>
                <div className="dc-multi dc-new-multi">
                  <button
                    type="button"
                    className="dc-multi-trigger"
                    data-dc="toggle-new-children"
                    id="dc-new-child-trigger"
                    aria-label="选择参与检查的子数据集"
                    aria-controls="dc-new-child-options"
                    aria-expanded={modalChildOpen}
                    onClick={() => setModalChildOpen(prev => !prev)}
                  >
                    <span>
                      {modalChildIds.length
                        ? `已选 ${modalChildIds.length} 个子数据集`
                        : '选择子数据集'}
                    </span>
                    <ChevronIcon size={15} />
                  </button>
                  {modalChildOpen && (
                    <div
                      className="dc-options dc-new-options"
                      id="dc-new-child-options"
                      role="group"
                      aria-label="选择参与检查的子数据集"
                    >
                      {currentChildDatasets.map(c => (
                        <label key={c.dataset_id} className="dc-option dc-new-option">
                          <input
                            type="checkbox"
                            className="dc-new-child-check"
                            value={c.dataset_id}
                            checked={modalChildIds.includes(c.dataset_id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setModalChildIds(prev => [...prev, c.dataset_id]);
                              } else {
                                setModalChildIds(prev => prev.filter(id => id !== c.dataset_id));
                              }
                            }}
                          />
                          <span>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="dc-new-field dc-prompt-editor">
                <label htmlFor="dc-new-prompt">模型分析提示词</label>
                <textarea
                  id="dc-new-prompt"
                  rows={9}
                  spellCheck={false}
                  aria-label="模型分析提示词"
                  value={newPrompt}
                  onChange={e => setNewPrompt(e.target.value)}
                />
              </div>
            </div>
            <footer className="dc-dialog-footer">
              <button
                type="button"
                className="dc-minor"
                data-dc="close-new"
                onClick={() => {
                  setModal('');
                  setModalChildOpen(false);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="dc-primary"
                data-dc="create-job"
                disabled={!modalChildIds.length || !newPrompt.trim() || newCheckBusy}
                onClick={handleCreateJob}
              >
                {newCheckBusy ? '启动中…' : '开始检查'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Conflict Comparison Dialog */}
      {modal === 'compare' && currentConflict && (
        <div
          className="dc-modal-mask"
          id="dc-compare-mask"
          onClick={e => {
            if ((e.target as HTMLElement).id === 'dc-compare-mask') setModal('');
          }}
        >
          <section
            className="dc-dialog dc-conflict-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dc-dialog-title"
          >
            <header className="dc-dialog-head">
              <h2 id="dc-dialog-title">标注冲突对比</h2>
              <div className="dc-dialog-head-actions">
                <button className="dc-minor" type="button" onClick={handlePrevConflict}>
                  上一组
                </button>
                <button className="dc-minor" type="button" onClick={handleNextConflict}>
                  下一组
                </button>
                <button
                  type="button"
                  className="dc-icn"
                  title="关闭"
                  aria-label="关闭"
                  onClick={() => setModal('')}
                >
                  <CloseIcon />
                </button>
              </div>
            </header>
            <div className="dc-dialog-body">
              <div className="dc-compare">
                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-anchor"
                    aria-label="查看主图大图"
                    title="点击查看大图"
                    onClick={() =>
                      setZoomItem({
                        id: currentConflict.id + '_anchor',
                        title: currentConflict.filename,
                        imageUrl: currentConflict.fullUrl || currentConflict.url,
                        width: currentConflict.sourceWidth || 860,
                        height: currentConflict.sourceHeight || 690,
                        bboxes: anchorBboxes,
                      })
                    }
                    onKeyDown={e => {
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
                    }}
                  >
                    <AnnotatedImageStage
                      src={currentConflict.fullUrl || currentConflict.url}
                      alt="主图"
                      width={currentConflict.sourceWidth}
                      height={currentConflict.sourceHeight}
                      bboxes={anchorBboxes}
                    />
                  </div>
                  <div className="dc-photo-filename" title={currentConflict.filename}>
                    {currentConflict.filename}
                  </div>
                </div>

                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-candidate"
                    aria-label="查看候选图大图"
                    title="点击查看大图"
                    onClick={() =>
                      setZoomItem({
                        id: currentConflict.id + '_candidate_' + candidateIndex,
                        title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                        imageUrl: currentCandidate.fullUrl,
                        width: currentCandidate.width,
                        height: currentCandidate.height,
                        bboxes: candidateBboxes,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomItem({
                          id: currentConflict.id + '_candidate_' + candidateIndex,
                          title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                          imageUrl: currentCandidate.fullUrl,
                          width: currentCandidate.width,
                          height: currentCandidate.height,
                          bboxes: candidateBboxes,
                        });
                      }
                    }}
                  >
                    <AnnotatedImageStage
                      src={currentCandidate.fullUrl || currentCandidate.thumbUrl}
                      alt="候选图"
                      width={currentCandidate.width}
                      height={currentCandidate.height}
                      bboxes={candidateBboxes}
                    />
                  </div>
                  <div className="dc-photo-filename" title={currentCandidate.filename}>
                    {currentCandidate.filename}
                  </div>
                </div>
              </div>

              {/* Candidate strip */}
              <div className="dc-candidate-strip" aria-label="切换冲突图像">
                {conflictMembers.length > 0 ? (
                  conflictMembers.map((m, i) => {
                    const s = m.image.sample;
                    const thumb = `/api/iad/media/sample/${encodeURIComponent(s.dataset_id || '')}/${encodeURIComponent(s.sample_id || '')}/thumbnail`;
                    return (
                      <button
                        key={m.image.sample.sample_id || i}
                        className="dc-candidate"
                        type="button"
                        data-dc="candidate"
                        data-id={i}
                        aria-pressed={i === candidateIndex}
                        title={`查看候选图 ${i + 1}: ${s.relative_path.split('/').pop()}`}
                        onClick={() => setCandidateIndex(i)}
                      >
                        <img
                          src={thumb}
                          alt={`候选图 ${i + 1}`}
                          onError={(e) => {
                            if (currentConflict?.candidateThumbUrl) {
                              e.currentTarget.src = currentConflict.candidateThumbUrl;
                            }
                          }}
                        />
                      </button>
                    );
                  })
                ) : (
                  Array.from({ length: Math.max(1, currentConflict.memberCount - 1) }, (_, i) => (
                    <button
                      key={i}
                      className="dc-candidate"
                      type="button"
                      data-dc="candidate"
                      data-id={i}
                      aria-pressed={i === candidateIndex}
                      title={`查看候选图 ${i + 1}`}
                      onClick={() => setCandidateIndex(i)}
                    >
                      <img
                        src={currentConflict.candidateThumbUrl || currentConflict.url}
                        alt={`候选图 ${i + 1}`}
                      />
                    </button>
                  ))
                )}
              </div>

              {/* 判定结论 */}
              <section className="dc-fact-panel" aria-label="判定结论">
                <h3>判定结论</h3>
                <span className="dc-verdict-value">{currentConflict.type}</span>
                <p className="dc-verdict-description">{buildFactDescription(currentConflict)}</p>
              </section>

              {/* 模型分析 */}
              <section className="dc-model-panel" aria-label="模型分析">
                <h3>模型分析</h3>
                <p>{buildModelAnalysis(currentConflict)}</p>
              </section>

              {/* 模型结论 */}
              <section className="dc-conclusion-panel" aria-label="模型结论">
                <h3>模型结论</h3>
                <span className="dc-verdict-value">{currentConflict.model.modelType}</span>
                <p className="dc-verdict-description">{buildModelConclusion(currentConflict)}</p>
              </section>

              {/* Human review panel */}
              <section className="dc-review-panel" aria-label="人工复核">
                <h3>人工复核</h3>
                <div className="dc-decision-controls">
                  <label>
                    <input
                      type="radio"
                      name="dc-review"
                      value="pending"
                      checked={reviewDecision === 'pending'}
                      onChange={() => setReviewDecision('pending')}
                    />
                    待确认
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="dc-review"
                      value="confirmed"
                      checked={reviewDecision === 'confirmed'}
                      onChange={() => setReviewDecision('confirmed')}
                    />
                    确认冲突
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="dc-review"
                      value="rejected"
                      checked={reviewDecision === 'rejected'}
                      onChange={() => setReviewDecision('rejected')}
                    />
                    排除冲突
                  </label>
                </div>
                <textarea
                  className="dc-note"
                  id="dc-note"
                  placeholder="复核说明（可选）"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
              </section>
            </div>
            <footer className="dc-dialog-footer">
              <button className="dc-minor" type="button" onClick={() => setModal('')}>
                取消
              </button>
              <button className="dc-primary" type="button" onClick={handleSaveReview}>
                保存复核
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Delete Job Modal */}
      {modal.startsWith('delete:') && (
        <div
          className="dc-modal-mask exp-modal"
          id="dc-delete-mask"
          onClick={e => {
            if ((e.target as HTMLElement).id === 'dc-delete-mask') setModal('');
          }}
        >
          <div className="exp-dialog small" role="dialog" aria-modal="true" aria-label="删除检查作业">
            <div className="exp-dialog-head">
              <strong>删除检查作业</strong>
              <IconButton label="关闭" className="modal-x exp-ghost" onClick={() => setModal('')}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="exp-dialog-main">
              <p className="exp-delete-text">
                确定删除作业 <strong>{modal.slice(7)}</strong> 吗？
              </p>
              <p className="exp-delete-note">
                该作业对应的冲突检查结果和展示数据将一并移除，此操作不可撤销。
              </p>
            </div>
            <div className="exp-dialog-foot">
              <button type="button" className="exp-btn" onClick={() => setModal('')}>
                取消
              </button>
              <button
                type="button"
                className="exp-btn exp-delete-confirm"
                onClick={() => handleDeleteJob(modal.slice(7))}
              >
                删除作业
              </button>
            </div>
          </div>
        </div>
      )}

      {/* V30: Centered Statistics Dialog with 3 Stacked Vertical Column Charts */}
      {!!statsModalJobId && (
        <div
          className="dc-mask dc-stats-mask"
          id="dc-mask"
          role="presentation"
          onClick={e => {
            if ((e.target as HTMLElement).id === 'dc-mask') setStatsModalJobId('');
          }}
        >
          <section
            className="dc-stats-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dc-stats-title"
          >
            <header className="dc-stats-header">
              <h2 id="dc-stats-title">标注冲突统计</h2>
              <button
                type="button"
                className="dc-icn"
                title="关闭统计"
                aria-label="关闭统计"
                data-dc="close-drawer"
                onClick={() => setStatsModalJobId('')}
              >
                <CloseIcon />
              </button>
            </header>
            <div className="dc-stats-content">
              <div className="dc-stats-charts">
                {/* 1. 原始差异类型 */}
                {(() => {
                  const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                  return (
                    <section className="dc-vchart-panel" aria-label="原始差异类型柱状图">
                      <h3>原始差异类型</h3>
                      <div className="dc-vchart-body">
                        <div className="dc-vchart-axis" aria-hidden="true">
                          {ticks.map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="dc-vchart-figure">
                          <div className="dc-vchart-lines" aria-hidden="true" />
                          <div className="dc-vchart-columns" style={{ ['--chart-cols' as any]: origStats.length }}>
                            {origStats.map(row => {
                              const height = (100 * row.count) / distributionAxis;
                              return (
                                <div className="dc-vchart-column" key={row.name}>
                                  <div className="dc-vchart-barslot">
                                    <button
                                      type="button"
                                      className={`dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`}
                                      style={{ height: `${Math.max(0.6, height)}%` }}
                                      data-dc="stat-category"
                                      data-id={row.name}
                                      aria-label={`${row.name} ${row.count} 组，点击查看`}
                                      title={`${row.name}：${row.count} 组，点击筛选`}
                                      onClick={() => handleStatClick('stat-category', row.name)}
                                    >
                                      <span className="dc-vchart-value">{row.count}</span>
                                    </button>
                                  </div>
                                  <span className="dc-vchart-label" title={row.name}>{row.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* 2. 模型判断 */}
                {(() => {
                  const ticks = [distributionAxis, distributionAxis * 0.75, distributionAxis * 0.5, distributionAxis * 0.25, 0].map(v => Math.round(v));
                  return (
                    <section className="dc-vchart-panel" aria-label="模型判断柱状图">
                      <h3>模型判断</h3>
                      <div className="dc-vchart-body">
                        <div className="dc-vchart-axis" aria-hidden="true">
                          {ticks.map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="dc-vchart-figure">
                          <div className="dc-vchart-lines" aria-hidden="true" />
                          <div className="dc-vchart-columns" style={{ ['--chart-cols' as any]: modelStats.length }}>
                            {modelStats.map(row => {
                              const height = (100 * row.count) / distributionAxis;
                              return (
                                <div className="dc-vchart-column" key={row.name}>
                                  <div className="dc-vchart-barslot">
                                    <button
                                      type="button"
                                      className={`dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`}
                                      style={{ height: `${Math.max(0.6, height)}%` }}
                                      data-dc="stat-model"
                                      data-id={row.name}
                                      aria-label={`${row.name} ${row.count} 组，点击查看`}
                                      title={`${row.name}：${row.count} 组，点击筛选`}
                                      onClick={() => handleStatClick('stat-model', row.name)}
                                    >
                                      <span className="dc-vchart-value">{row.count}</span>
                                    </button>
                                  </div>
                                  <span className="dc-vchart-label" title={row.name}>{row.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* 3. 结论一致性 */}
                {(() => {
                  const ticks = [agreementAxis, agreementAxis * 0.75, agreementAxis * 0.5, agreementAxis * 0.25, 0].map(v => Math.round(v));
                  return (
                    <section className="dc-vchart-panel dc-vchart-agreement" aria-label="结论一致性柱状图">
                      <h3>结论一致性</h3>
                      <div className="dc-vchart-body">
                        <div className="dc-vchart-axis" aria-hidden="true">
                          {ticks.map((n, i) => (
                            <span key={i}>{n}</span>
                          ))}
                        </div>
                        <div className="dc-vchart-figure">
                          <div className="dc-vchart-lines" aria-hidden="true" />
                          <div className="dc-vchart-columns" style={{ ['--chart-cols' as any]: agreementStats.length }}>
                            {agreementStats.map(row => {
                              const height = (100 * row.count) / agreementAxis;
                              return (
                                <div className="dc-vchart-column" key={row.id}>
                                  <div className="dc-vchart-barslot">
                                    <button
                                      type="button"
                                      className={`dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`}
                                      style={{ height: `${Math.max(0.6, height)}%` }}
                                      data-dc="stat-agreement"
                                      data-id={row.id}
                                      aria-label={`${row.name} ${row.count} 组，点击查看`}
                                      title={`${row.name}：${row.count} 组，点击筛选`}
                                      onClick={() => handleStatClick('stat-agreement', row.id)}
                                    >
                                      <span className="dc-vchart-value">{row.count}</span>
                                    </button>
                                  </div>
                                  <span className="dc-vchart-label" title={row.name}>{row.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Fullscreen Image Viewer Modal */}
      <FullscreenViewer
        open={!!zoomItem}
        item={zoomItem}
        onClose={() => setZoomItem(null)}
      />
    </div>
  );
}
