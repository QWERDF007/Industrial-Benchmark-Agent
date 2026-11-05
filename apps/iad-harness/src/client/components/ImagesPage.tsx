import {Select} from './Select.js';
import {IconButton} from "./IconButton.js";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {Modal} from "./Modal.js";
import {useResource} from "../useResource.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import type { Dataset, DatasetGroup, Sample, SampleDetail } from "../../shared/contracts.js";
import { mediaUrl, request, message } from "../api.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
import { FullscreenViewer } from "./FullscreenViewer.js";
import { AnnotatedImageStage } from "./AnnotatedImageStage.js";
import { DatasetScopeSelector } from "./DatasetScopeSelector.js";
import {ThumbnailCard} from "./ThumbnailCard.js";
import {Pagination} from "./Pagination.js";

import { ClearFilterButton } from "./CommonFilterControls.js";

export interface ImagesPageProps {
  datasets: Dataset[];
  groups: DatasetGroup[];
  onDatasetsChanged?: () => void;
}

export function ImagesPage({ datasets, groups, onDatasetsChanged }: ImagesPageProps) {
  // 1. Group & Hierarchy
  const hierarchyGroups = useMemo(() => {
    return buildHierarchyGroups(datasets, groups);
  }, [groups, datasets]);

  const getGroupId = useCallback((d: Dataset): string => {
    return getDatasetGroupId(d, hierarchyGroups);
  }, [hierarchyGroups]);

  // Selected parent group
  const [selectedParentId, setSelectedParentId] = useState<string>(() => hierarchyGroups[0]?.group_id || "");
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
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());

  // When parent group changes, auto-select the first child
  useEffect(() => {
    if (parentChildren.length > 0) {
      setSelectedChildIds(new Set([parentChildren[0].dataset_id]));
    } else {
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
    if (activeDatasets.length > 0) return activeDatasets;
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
    const set = new Set<string>();
    for (const d of effectiveDatasets) {
      for (const cat of d.annotation_categories || []) {
        if (cat) set.add(cat);
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
      if (annotation !== "all") setAnnotation("all");
      if (category !== "all") setCategory("all");
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
  const [samples, setSamples] = useState<Sample[]>([]);
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
    const annFilters: string[] = [];
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

    request<{ items: Sample[]; total: number }>(`/samples?${params.toString()}`, undefined, undefined, controller.signal)
      .then(res => {
        if (controller.signal.aborted) return;
        setSamples(res.items);
        setTotal(res.total);
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(message(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedChildIds, quality, annotation, category, search, page, pageSize, refreshRev]);

  // Viewer State (Stage 1 & Stage 2)
  const [viewerIndex, setViewerIndex] = useState<number>(-1);
  const [fullscreen, setFullscreen] = useState(false);
  const activeSample = viewerIndex >= 0 && viewerIndex < samples.length ? samples[viewerIndex] : null;
  const {data:sampleDetail,loading:detailLoading,error:detailError}=useResource<SampleDetail>(
    activeSample ? `/sample/${encodeURIComponent(activeSample.sample_id)}` : null);

  // Active dataset of current sample in viewer
  const sampleDataset = useMemo(() => {
    if (!activeSample) return null;
    return datasets.find(d => d.dataset_id === activeSample.dataset_id) || activeDatasets[0] || null;
  }, [activeSample, datasets, activeDatasets]);

  // Annotations list for detail modal and fullscreen
  const detailAnnotations = sampleDetail?.annotations || [];
  const bboxes = useMemo(() => {
    return detailAnnotations.filter(a => a.bbox && a.bbox.length >= 4);
  }, [detailAnnotations]);

  const imgW = sampleDetail?.sample.width || activeSample?.width || 955;
  const imgH = sampleDetail?.sample.height || activeSample?.height || 713;

  return (
    <div className="main" style={{ minWidth: 0, width: "100%", padding: 0 }}>
      {/* Header */}
      <WorkbenchHeader pageId="industrial-images" />

      {/* Dataset Panel */}
      <DatasetScopeSelector
        className="dataset-panel"
        groups={hierarchyGroups}
        selectedGroupId={selectedParentId}
        onGroupChange={groupId => {
          setSelectedParentId(groupId);
          resetFilters();
        }}
        childDatasets={parentChildren}
        selectedChildIds={selectedChildIds}
        onChildToggle={cid => {
          const next = new Set(selectedChildIds);
          if (next.has(cid)) next.delete(cid);
          else next.add(cid);
          setSelectedChildIds(next);
          setPage(1);
        }}
        groupId="parent"
        childId="child"
        childMenuId="child-menu"
      >
        <IconButton icon="refresh" id="refresh" type="button" title="刷新图像" label="刷新图像" onClick={() => {
            setRefreshRev(r => r + 1);
            onDatasetsChanged?.();
          }} />
      </DatasetScopeSelector>

      {/* Filter Bar */}
      <section className="filter-bar" aria-label="图像筛选">
        <div className="filter-item filter-search">
          <label htmlFor="search">文件名搜索</label>
          <input
            id="search"
            type="search"
            autoComplete="off"
            placeholder="搜索文件名"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {hasAnomaly && (
          <div className="filter-item filter-status" id="quality-wrap">
            <label htmlFor="quality" title="图像级类别（OK / NG / 未判定）">
              {hasLabelme ? "标注类别 (图像)" : "标注类别"}
            </label>
            <Select
              id="quality"
              value={quality}
              onChange={e => {
                setQuality(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">全部</option>
              <option value="PASS">OK</option>
              <option value="FAIL">NG</option>
              <option value="UNCERTAIN" title="原始规则无法判定为 OK 或 NG">
                未判定
              </option>
            </Select>
          </div>
        )}

        {hasLabelme && (
          <>
            <div className="filter-item filter-ann" id="annotation-wrap">
              <label htmlFor="annotation">标注情况</label>
              <Select
                id="annotation"
                value={annotation}
                onChange={e => {
                  setAnnotation(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">全部</option>
                <option value="present">有标注</option>
                <option value="none">无标注</option>
              </Select>
            </div>

            <div className="filter-item filter-category" id="category-wrap">
              <label htmlFor="category">
                {hasAnomaly ? "标注类别 (目标)" : "标注类别"}
              </label>
              <Select
                id="category"
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">全部</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.startsWith("类别 ") || isNaN(Number(cat)) ? cat : `类别 ${cat}`}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}

        <ClearFilterButton
          id="reset"
          title="清除筛选条件"
          ariaLabel="清除筛选条件"
          disabled={!search && quality === "all" && annotation === "all" && category === "all"}
          onClick={resetFilters}
        />
      </section>

      {/* Grid or Empty */}
      {error && <p role="alert" className="iad-error">{error}</p>}
      {total > 0 ? (
        <section id="grid" className="iad-thumbnail-grid" aria-label="图像网格">
          {samples.map((s, idx) => {
            const filename = s.relative_path.split("/").pop() || s.relative_path;
            return (
              <ThumbnailCard key={s.sample_id} src={mediaUrl(s,"thumbnail")} label={filename}
                data-idx={idx} data-sample-id={s.sample_id} onClick={()=>{setViewerIndex(idx);setFullscreen(false);}} />
            );
          })}
        </section>
      ) : (
        <div id="grid" className="empty" aria-label="图像网格">
          {selectedChildIds.size === 0
            ? "请选择至少一个子数据集"
            : loading
            ? "正在读取图像…"
            : "没有符合筛选条件的图像"}
        </div>
      )}

      <Pagination id="pager" total={total} page={page} size={pageSize} unit="张图像" label="图像" onPage={number=>{
        setPage(number);document.getElementById("grid")?.scrollIntoView({block:"start",behavior:"smooth"});
      }} />

      {activeSample && <Modal title="图像详情" id="overlay" className="detail-dialog" onClose={()=>{setViewerIndex(-1);setFullscreen(false);}}>
          <div className="detail-scroll" aria-busy={detailLoading}>
            {detailError && <p role="alert" className="iad-error">{detailError}</p>}
            {activeSample && (
              <>
                <button
                  id="detail-preview"
                  type="button"
                  className="detail-preview"
                  aria-label="打开大图检视器"
                  title="点击查看大图与标注"
                  onClick={()=>setFullscreen(true)}
                >
                  <AnnotatedImageStage
                    src={mediaUrl(activeSample, "image")}
                    alt={activeSample.relative_path.split("/").pop()}
                    width={imgW}
                    height={imgH}
                    bboxes={bboxes}
                  />
                  <span className="detail-preview-hint">点击查看大图</span>
                </button>

                <section className="detail-content">
                  <h3 className="detail-section-heading">图像信息</h3>
                  <dl className="detail-meta" id="detail-fields">
                    <dt>图像路径</dt>
                    <dd className="path-value">{sampleDetail?.sample.image_path || activeSample.relative_path}</dd>
                    <dt>图像名</dt>
                    <dd>{activeSample.relative_path.split("/").pop()}</dd>
                    <dt>UUID</dt>
                    <dd>{activeSample.sample_uuid}</dd>
                    <dt>分辨率</dt>
                    <dd>{`${sampleDetail?.sample.width || activeSample.width} × ${sampleDetail?.sample.height || activeSample.height}`}</dd>
                  </dl>
                </section>

                <section className="detail-part" id="detail-ann-section">
                  <div className="detail-annotation-heading">
                    <h3 className="detail-section-heading" id="detail-ann-title">
                      标注信息
                    </h3>
                    <span className="detail-ann-summary" id="detail-ann-count">
                      {sampleDataset?.format === "folder_classification"
                        ? "共 1 个标注"
                        : `共 ${detailAnnotations.length} 个标注`}
                    </span>
                  </div>
                  <div id="detail-ann-content">
                    {detailLoading ? <p>正在读取标注…</p> : detailError ? null : sampleDataset?.format === "folder_classification" ? (
                      <table className="detail-ann-table" aria-label="异常检测标注列表">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>标注类别</th>
                            <th>类型</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>{activeSample.quality_status === "FAIL" ? "NG" : "OK"}</td>
                            <td>异常检测</td>
                          </tr>
                        </tbody>
                      </table>
                    ) : detailAnnotations.length > 0 ? (
                      <table className="detail-ann-table" aria-label="Labelme 标注列表">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>标注类别</th>
                            <th>类型</th>
                            <th>数据</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailAnnotations.map((a, k) => (
                            <tr key={a.annotation_id || k}>
                              <td>{k + 1}</td>
                              <td>{a.raw_label}</td>
                              <td>{a.annotation_type || "bbox"}</td>
                              <td className="ann-value">
                                {a.bbox ? a.bbox.map(v => Number(v).toFixed(0)).join(", ") : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="detail-fallback">无标注</p>
                    )}
                  </div>
                </section>

                <section className="detail-model-section" aria-labelledby="detail-model-title">
                  <h3 className="detail-section-heading" id="detail-model-title">
                    模型观察
                  </h3>
                  <div id="detail-model-content">
                    {detailLoading ? <p>正在读取观察…</p> : detailError ? null : sampleDetail?.suggestion ? (
                      <>
                        <p className="detail-model-result">
                          <strong>
                            {sampleDetail.suggestion.suggested_label === "FAIL"
                              ? "发现疑点"
                              : sampleDetail.suggestion.suggested_label === "PASS"
                              ? "判定正常"
                              : "未判定"}
                          </strong>
                          {sampleDetail.suggestion.reason_category ? `（${sampleDetail.suggestion.reason_category}）` : ""}
                        </p>
                        <p className="detail-model-text">{sampleDetail.suggestion.notes || "无附注。"}</p>
                      </>
                    ) : (
                      <p className="detail-model-text">尚无模型观察。</p>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
      </Modal>}

      {/* Stage 2: Fullscreen Viewer */}
      <FullscreenViewer
        open={fullscreen}
        item={
          activeSample
            ? {
                id: activeSample.sample_id,sampleId:activeSample.sample_id,
                annotationLayer:{kind:'sample',sample:sampleDetail?.sample||activeSample,annotations:sampleDetail?.annotations||[]},
                title: activeSample.relative_path,
                imageUrl: mediaUrl(activeSample, "image"),
                width: activeSample.width,
                height: activeSample.height,
                bboxes,
              }
            : null
        }
        items={samples.map(s => ({
          id: s.sample_id,sampleId:s.sample_id,
          title: s.relative_path,
          imageUrl: mediaUrl(s, "image"),
          width: s.width,
          height: s.height,
        }))}
        currentIndex={viewerIndex}
        onClose={()=>setFullscreen(false)}
        onNavigate={setViewerIndex}
      />
    </div>
  );
}
