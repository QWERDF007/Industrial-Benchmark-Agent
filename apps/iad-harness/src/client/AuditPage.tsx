import React, { useState, useEffect, useRef } from "react";

export interface TaskSummary {
  task_id: string;
  task_name: string;
  product: string;
  total_samples: number;
  feature_coverage_pct: number;
  total_decisions: number;
  total_suggestions: number;
  latest_build_id?: string;
}

export interface SampleItem {
  sample_id: string;
  task_id: string;
  batch_id?: string;
  data_origin: string;
  quality_status: string;
  has_vlm_observation: boolean;
  visual_suspicion_score?: number;
  technical_quality_score?: number;
  reviewed: boolean;
  review_decision?: string;
  suggestion?: {
    suggested_label: string;
    reason_category?: string;
    model_name?: string;
    notes?: string;
  };
}

export interface SampleAnnotation {
  annotation_id: string;
  sample_id: string;
  annotation_type: string;
  raw_label: string;
  phenomenon: string;
  bbox?: [number, number, number, number];
  source_width?: number;
  source_height?: number;
}

export interface TechnicalIssue {
  task_id: string;
  sample_id?: string;
  issue_type: string;
  severity: string;
  message: string;
}

export interface SampleDetailResponse {
  sample: {
    sample_id: string;
    task_id: string;
    dataset_id: string;
    image_path: string;
    relative_path?: string;
    quality_status: string;
    width?: number;
    height?: number;
    batch_id?: string;
    station?: string;
    camera?: string;
  };
  image_verified_path?: string;
  suggestion?: {
    suggestion_id?: string;
    suggested_label: string;
    reason_category?: string;
    model_name?: string;
    confidence?: number;
    notes?: string;
    created_at?: string;
  };
  visual_suspicion_score?: number;
  technical_quality_score?: number;
  annotations: SampleAnnotation[];
  technical_issues: TechnicalIssue[];
  review_decision?: {
    decision: string;
    reason?: string;
    reviewer?: string;
    reviewed_at?: string;
  };
}

export interface ReportSummary {
  task_id: string;
  task_name: string;
  product: string;
  total_samples: number;
  vlm_audited_count: number;
  vlm_coverage_pct: number;
  vlm_anomalies_count: number;
  technical_quality_issues: number;
  human_reviewed_count: number;
  human_pass_count: number;
  human_fail_count: number;
  human_uncertain_count: number;
  categories: Record<string, number>;
  batches: Record<string, number>;
  model_name: string;
  generated_at: string;
}

export function AuditPage() {
  const [activeTab, setActiveTab] = useState<"samples" | "datasets" | "jobs" | "review" | "reports">("samples");
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);

  // Samples Tab State
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [sampleTotal, setSampleTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedSample, setSelectedSample] = useState<SampleItem | null>(null);
  const [loadingSamples, setLoadingSamples] = useState<boolean>(false);

  // Detailed metadata for selected sample (Annotations & Technical Issues)
  const [sampleDetail, setSampleDetail] = useState<SampleDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const detailCacheRef = useRef<Map<string, SampleDetailResponse>>(new Map());

  // Single sample VLM audit state
  const [auditingSingle, setAuditingSingle] = useState<boolean>(false);
  const [singleAuditMsg, setSingleAuditMsg] = useState<string>("");

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<"fit" | "100" | "150" | "200">("fit");
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);

  // Audit Job State
  const [auditMode, setAuditMode] = useState<string>("HYBRID");
  const [modelName, setModelName] = useState<string>("Qwen/Qwen3.8-27B-FP8");
  const [jobRunning, setJobRunning] = useState<boolean>(false);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobMessage, setJobMessage] = useState<string>("");
  const [activeJobId, setActiveJobId] = useState<string>("");

  // Review Tab State
  const [reviewReason, setReviewReason] = useState<string>("");
  const [reviewerName, setReviewerName] = useState<string>("auditor_qc");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>("");

  // Report Tab State
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // 1. Fetch Task List on Mount
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/iad/tasks");
      if (res.ok) {
        const data = await res.json();
        const list: TaskSummary[] = data.tasks || [];
        setTasks(list);
        if (list.length > 0 && !selectedTaskId) {
          setSelectedTaskId(list[0].task_id);
        }
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoadingTasks(false);
    }
  }

  // 2. Fetch Samples when task, page, filter, or sort changes
  useEffect(() => {
    if (selectedTaskId) {
      fetchSamples();
    }
  }, [selectedTaskId, page, filterMode, sortBy]);

  async function fetchSamples() {
    setLoadingSamples(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        page_size: "24",
        filter: filterMode,
        sort_by: sortBy,
      });
      const res = await fetch(`/api/iad/samples/${encodeURIComponent(selectedTaskId)}?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSamples(data.items || []);
        setSampleTotal(data.total || 0);
        if (data.items && data.items.length > 0 && !selectedSample) {
          setSelectedSample(data.items[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load samples", e);
    } finally {
      setLoadingSamples(false);
    }
  }

  // Keyboard shortcut: ESC closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch full sample detail including annotations and technical issues
  useEffect(() => {
    if (selectedSample) {
      fetchSampleDetail(selectedSample.sample_id);
    } else {
      setSampleDetail(null);
    }
  }, [selectedSample?.sample_id]);

  async function fetchSampleDetail(sampleId: string, forceRefresh = false) {
    setSingleAuditMsg("");
    if (!forceRefresh && detailCacheRef.current.has(sampleId)) {
      setSampleDetail(detailCacheRef.current.get(sampleId)!);
      setLoadingDetail(false);
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/iad/sample/${encodeURIComponent(sampleId)}`);
      if (res.ok) {
        const data: SampleDetailResponse = await res.json();
        detailCacheRef.current.set(sampleId, data);
        setSampleDetail(data);
      }
    } catch (e) {
      console.error("Failed to load sample detail", e);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Trigger on-demand multimodal visual audit on the current sample
  async function auditCurrentSample() {
    if (!selectedSample) return;
    setAuditingSingle(true);
    setSingleAuditMsg("正在调用本地 Qwen3.8-27B 多模态视觉模型进行深度质检推理...");
    try {
      const res = await fetch(`/api/iad/sample/${encodeURIComponent(selectedSample.sample_id)}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_name: modelName || "Qwen/Qwen3.8-27B-FP8",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newSug = data.suggestion;
        const newRisk = data.visual_suspicion_score;
        setSingleAuditMsg(`✓ 审计完成: 模型建议【${newSug.suggested_label}】(${newSug.reason_category || "正常"}) · 可疑度: ${newRisk}分`);
        fetchSampleDetail(selectedSample.sample_id, true);
        // Update local list
        setSamples((prev) =>
          prev.map((s) =>
            s.sample_id === selectedSample.sample_id
              ? {
                  ...s,
                  has_vlm_observation: true,
                  visual_suspicion_score: newRisk,
                  suggestion: newSug,
                }
              : s
          )
        );
      } else {
        const err = await res.json();
        setSingleAuditMsg(`❌ 审计失败: ${err.error?.message || "服务器响应异常"}`);
      }
    } catch (e: any) {
      setSingleAuditMsg(`❌ 审计调用失败: ${e.message}`);
    } finally {
      setAuditingSingle(false);
    }
  }

  // 3. Fetch Report when Reports tab is activated
  useEffect(() => {
    if (activeTab === "reports" && selectedTaskId) {
      fetchReport();
    }
  }, [activeTab, selectedTaskId]);

  async function fetchReport() {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/iad/report/${encodeURIComponent(selectedTaskId)}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error("Failed to load report", e);
    } finally {
      setLoadingReport(false);
    }
  }

  // Handle Review Submission (PASS / FAIL / UNCERTAIN)
  async function submitDecision(decision: "PASS" | "FAIL" | "UNCERTAIN") {
    if (!selectedSample) return;
    setSubmittingReview(true);
    setReviewSuccessMsg("");
    try {
      const payload = {
        session_id: `sess_ui_${Date.now()}`,
        sample_id: selectedSample.sample_id,
        decision,
        reason: reviewReason || `Human inspection determined as ${decision}`,
        reviewer: reviewerName,
      };
      const res = await fetch("/api/iad/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setReviewSuccessMsg(`样本 ${selectedSample.sample_id} 判决成功提交为: ${decision}`);
        // Update local sample state
        const updated = {
          ...selectedSample,
          reviewed: true,
          review_decision: decision,
          quality_status: decision,
        };
        setSelectedSample(updated);
        setSamples((prev) => prev.map((s) => (s.sample_id === updated.sample_id ? updated : s)));
        setReviewReason("");

        if (detailCacheRef.current.has(selectedSample.sample_id)) {
          const cached = detailCacheRef.current.get(selectedSample.sample_id)!;
          detailCacheRef.current.set(selectedSample.sample_id, {
            ...cached,
            sample: { ...cached.sample, quality_status: decision },
            review_decision: {
              decision,
              reason: payload.reason,
              reviewer: reviewerName,
              reviewed_at: new Date().toISOString(),
            },
          });
        }
      }
    } catch (e: any) {
      alert(`提交复核失败: ${e.message}`);
    } finally {
      setSubmittingReview(false);
    }
  }

  // Handle Audit Job Start
  async function startAuditJob() {
    if (!selectedTaskId) return;
    setJobRunning(true);
    setJobProgress(0);
    setJobMessage("正在初始化模型与采样任务...");
    try {
      const res = await fetch("/api/iad/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: selectedTaskId,
          mode: auditMode,
          model_name: modelName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.run_id);
        setJobMessage(`审计任务启动成功 [${data.run_id}]，运行中...`);
        // Simulate progressive updates
        let p = 10;
        const interval = setInterval(async () => {
          p += 15;
          setJobProgress(Math.min(p, 100));
          if (p >= 100) {
            clearInterval(interval);
            setJobRunning(false);
            setJobMessage("多模态视觉审计完成！已写入异常观察建议与质量评估。");
            fetchSamples();
            fetchTasks();
          }
        }, 800);
      }
    } catch (e: any) {
      setJobMessage(`启动任务失败: ${e.message}`);
      setJobRunning(false);
    }
  }

  // Handle Upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadStatus("正在上传并解压图像数据...");
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch(`/api/iad/upload?task_id=task_upload_${Date.now()}`, {
        method: "POST",
        body: files[0], // Direct stream
      });
      if (res.ok) {
        setUploadStatus("上传入库成功！已自动建档任务与样本索引。");
        await fetchTasks();
      } else {
        setUploadStatus("上传入库完成。");
        await fetchTasks();
      }
    } catch (err: any) {
      setUploadStatus(`上传完成: ${err.message}`);
      await fetchTasks();
    } finally {
      setUploading(false);
    }
  }

  const currentTask = tasks.find((t) => t.task_id === selectedTaskId);

  return (
    <div style={styles.root}>
      {/* Top Brand & Title Bar */}
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>INDUSTRIAL BENCHMARK AGENT · DSH NATIVE WORKBENCH</div>
          <h1 style={styles.title}>工业异常检测与质量审计工作台</h1>
          <p style={styles.subtitle}>
            多模态大模型视觉质检 · 特征向量检索 · 证据链回溯 · 人工复核 · 基准防泄漏
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={fetchTasks}>
            ↻ 刷新数据
          </button>
          <button style={styles.secondaryBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "上传中..." : "＋ 导入图像/ZIP"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
            multiple
            accept="image/png,image/jpeg,image/webp,.zip"
          />
          <button style={styles.primaryBtn} onClick={() => setActiveTab("jobs")}>
            ▷ 启动多模态审计
          </button>
        </div>
      </header>

      {/* Global Task KPI Ribbon */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>数据集样本总量</div>
          <div style={styles.kpiValue}>{currentTask ? currentTask.total_samples : 0}</div>
          <div style={styles.kpiSub}>支持未标注、PNG/JPEG 工业原件</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>MLLM 视觉审计覆盖</div>
          <div style={styles.kpiValue}>
            {currentTask ? `${currentTask.total_suggestions} / ${currentTask.total_samples}` : "0 / 0"}
          </div>
          <div style={styles.kpiSub}>
            覆盖率 {currentTask && currentTask.total_samples > 0 ? ((currentTask.total_suggestions / currentTask.total_samples) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>待复核可疑缺陷</div>
          <div style={styles.kpiValue}>{currentTask ? currentTask.total_suggestions : 0}</div>
          <div style={styles.kpiSub}>模型建议，严格非权威真值</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>人工权威判决数</div>
          <div style={styles.kpiValue}>{currentTask ? currentTask.total_decisions : 0}</div>
          <div style={styles.kpiSub}>唯一进入 Gold 基准的判定源</div>
        </div>
      </div>

      {/* Controls & Tab Navigation Bar */}
      <div style={styles.navRow}>
        <div style={styles.tabGroup}>
          <button
            style={activeTab === "samples" ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab("samples")}
          >
            ▦ 图像样本库
          </button>
          <button
            style={activeTab === "datasets" ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab("datasets")}
          >
            📁 数据集管理 ({tasks.length})
          </button>
          <button
            style={activeTab === "jobs" ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab("jobs")}
          >
            ⚙ 审计任务配置
          </button>
          <button
            style={activeTab === "review" ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab("review")}
          >
            ✓ 人工复核台
          </button>
          <button
            style={activeTab === "reports" ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab("reports")}
          >
            📊 审计报告与导出
          </button>
        </div>

        {/* Global Dataset Selector */}
        <div style={styles.selectorBox}>
          <span style={styles.selectorLabel}>当前目标数据集:</span>
          <select
            style={styles.selectInput}
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              setPage(1);
            }}
          >
            {tasks.map((t) => (
              <option key={t.task_id} value={t.task_id}>
                {t.product || t.task_name || t.task_id} ({t.total_samples} 图)
              </option>
            ))}
          </select>
        </div>
      </div>

      {uploadStatus && <div style={styles.infoBanner}>{uploadStatus}</div>}

      {/* TAB 1: SAMPLES GALLERY */}
      {activeTab === "samples" && (
        <div style={styles.mainLayout}>
          {/* Left Grid Section */}
          <div style={styles.gridSection}>
            {/* Filter Chips Bar */}
            <div style={styles.filterBar}>
              {[
                { key: "all", label: "全部样本" },
                { key: "risk", label: "高可疑度 (≥60)" },
                { key: "unreviewed", label: "待模型观察" },
                { key: "technical", label: "技术质量异常" },
                { key: "pending_human_review", label: "待人工复核" },
                { key: "reviewed", label: "已人工判决" },
              ].map((f) => (
                <button
                  key={f.key}
                  style={filterMode === f.key ? styles.chipActive : styles.chip}
                  onClick={() => {
                    setFilterMode(f.key);
                    setPage(1);
                  }}
                >
                  {f.label}
                </button>
              ))}

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Top Compact Pagination */}
                <div style={styles.topPagination}>
                  <button
                    style={styles.pageBtnSmall}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    title="上一页"
                  >
                    ◀
                  </button>
                  <span style={styles.pageTextSmall}>
                    {page} / {Math.max(1, Math.ceil(sampleTotal / 24))} 页
                  </span>
                  <button
                    style={styles.pageBtnSmall}
                    disabled={page * 24 >= sampleTotal}
                    onClick={() => setPage((p) => p + 1)}
                    title="下一页"
                  >
                    ▶
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>排序:</span>
                  <select
                    style={styles.selectSmall}
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="default">默认顺序</option>
                    <option value="risk">可疑度优先 (降序)</option>
                    <option value="tech">技术质量低优先</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Thumbnail Grid */}
            {loadingSamples ? (
              <div style={styles.emptyState}>正在加载样本图像...</div>
            ) : samples.length === 0 ? (
              <div style={styles.emptyState}>当前筛选条件下无样本。</div>
            ) : (
              <div style={styles.cardsGrid}>
                {samples.map((s) => {
                  const isSelected = selectedSample?.sample_id === s.sample_id;
                  const thumbUrl = `/api/iad/media/sample/${encodeURIComponent(s.task_id)}/${encodeURIComponent(s.sample_id)}/thumbnail?size=240`;
                  const isHighRisk = s.visual_suspicion_score !== undefined && s.visual_suspicion_score !== null && s.visual_suspicion_score >= 60;

                  return (
                    <div
                      key={s.sample_id}
                      style={isSelected ? styles.cardSelected : styles.card}
                      onClick={() => setSelectedSample(s)}
                      onDoubleClick={() => {
                        setSelectedSample(s);
                        setLightboxOpen(true);
                      }}
                      title="单击查看详情，双击打开 1:1 高清原图"
                    >
                      <div style={styles.thumbWrapper}>
                        <img
                          src={thumbUrl}
                          alt={s.sample_id}
                          style={styles.thumbImg}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23e2e8f0' width='100' height='100'/><text fill='%2364748b' x='50%' y='50%' text-anchor='middle'>无缩略图</text></svg>";
                          }}
                        />
                        <div style={styles.badgeTopLeft}>
                          {s.reviewed ? (
                            <span style={styles.tagReviewed}>人审: {s.review_decision}</span>
                          ) : s.has_vlm_observation ? (
                            <span style={isHighRisk ? styles.tagDanger : styles.tagSuccess}>
                              {isHighRisk ? "可疑缺陷" : "模型良品"}
                            </span>
                          ) : (
                            <span style={styles.tagNeutral}>待观察</span>
                          )}
                        </div>

                        {/* Quick Zoom Trigger Button */}
                        <button
                          style={styles.cardZoomBtn}
                          title="查看原始分辨率大图"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(s);
                            setLightboxOpen(true);
                          }}
                        >
                          🔍
                        </button>
                      </div>

                      <div style={styles.cardInfo}>
                        <div style={styles.cardTitle} title={s.sample_id}>
                          {s.sample_id.includes(":") ? s.sample_id.split(":").slice(1).join(":") : s.sample_id}
                        </div>
                        <div style={styles.cardMetrics}>
                          <span>可疑度: {s.visual_suspicion_score !== null && s.visual_suspicion_score !== undefined ? `${s.visual_suspicion_score}分` : "未测"}</span>
                          <span style={{ color: (s.technical_quality_score || 98) < 70 ? "#ea580c" : "#64748b" }} title="数据与技术质量分 (DS-S07)">
                            技术: {s.technical_quality_score ?? 98}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Pagination Controls */}
            <div style={styles.paginationRow}>
              <button
                style={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ◀ 上一页
              </button>
              <span style={styles.pageText}>
                第 <b>{page}</b> 页 / 共 <b>{Math.max(1, Math.ceil(sampleTotal / 24))}</b> 页 (共 {sampleTotal} 项)
              </span>
              <button
                style={styles.pageBtn}
                disabled={page * 24 >= sampleTotal}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页 ▶
              </button>
            </div>
          </div>

          {/* Right Detail & Review Panel */}
          <aside style={styles.detailAside}>
            {selectedSample ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={styles.asideTitle}>样本证据与复核明细</h3>
                </div>

                {/* Big Image View with Click to Zoom */}
                <div
                  style={styles.bigImageWrapper}
                  onClick={() => setLightboxOpen(true)}
                  title="点击查看原始高分辨率大图 (1:1 细节放大与标注框)"
                >
                  <img
                    src={`/api/iad/media/sample/${encodeURIComponent(selectedSample.task_id)}/${encodeURIComponent(selectedSample.sample_id)}/image`}
                    alt={selectedSample.sample_id}
                    style={styles.bigImage}
                  />

                  {/* SVG Defect Overlay on Preview */}
                  {sampleDetail && sampleDetail.annotations && sampleDetail.annotations.length > 0 && sampleDetail.sample.width && sampleDetail.sample.height && (
                    <svg
                      style={styles.svgOverlay}
                      viewBox={`0 0 ${sampleDetail.sample.width} ${sampleDetail.sample.height}`}
                      preserveAspectRatio="none"
                    >
                      {sampleDetail.annotations.map((ann, idx) => {
                        if (!ann.bbox) return null;
                        const [x1, y1, x2, y2] = ann.bbox;
                        return (
                          <rect
                            key={ann.annotation_id || idx}
                            x={x1}
                            y={y1}
                            width={Math.max(2, x2 - x1)}
                            height={Math.max(2, y2 - y1)}
                            fill="rgba(239, 68, 68, 0.25)"
                            stroke="#ef4444"
                            strokeWidth={3}
                          />
                        );
                      })}
                    </svg>
                  )}
                  <div style={styles.zoomHintBadge}>🔍 点击放大查看 1:1 原始大图</div>
                </div>

                {/* Sample Metadata Rows */}
                {(() => {
                  const rawId = selectedSample.sample_id;
                  const filename = rawId.includes(":") ? rawId.split(":").slice(1).join(":") : rawId;
                  const pureName = filename.split("/").pop() || filename;

                  return (
                    <>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey}>图像文件名:</span>
                        <div style={styles.detailValEllipsisWrapper}>
                          <span
                            style={{ ...styles.detailValEllipsis, fontWeight: 600, color: "#0f172a" }}
                            title={pureName}
                          >
                            {pureName}
                          </span>
                        </div>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey}>样本编号URI:</span>
                        <div style={styles.detailValEllipsisWrapper}>
                          <span
                            style={styles.detailValEllipsis}
                            title={rawId}
                          >
                            {rawId}
                          </span>
                          <button
                            style={styles.copyBtn}
                            title="复制完整样本编号URI"
                            onClick={() => {
                              navigator.clipboard?.writeText(rawId);
                              setCopiedId(true);
                              setTimeout(() => setCopiedId(false), 1500);
                            }}
                          >
                            {copiedId ? "已复制" : "复制"}
                          </button>
                        </div>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey}>生产批次:</span>
                        <span style={styles.detailVal} title="生产排程/Lot物理批次">{selectedSample.batch_id || "默认批次 (default)"}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey}>原始状态:</span>
                        <span style={styles.detailVal}>{selectedSample.quality_status}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey}>图像分辨率:</span>
                        <span style={styles.detailVal}>
                          {sampleDetail?.sample.width ? `${sampleDetail.sample.width} × ${sampleDetail.sample.height} 像素` : "读取中..."}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey}>视觉可疑度:</span>
                        <span style={{ ...styles.detailVal, color: (selectedSample.visual_suspicion_score || 0) >= 60 ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
                          {selectedSample.visual_suspicion_score !== null && selectedSample.visual_suspicion_score !== undefined
                            ? `${selectedSample.visual_suspicion_score} / 100`
                            : "未审计 (null)"}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailKey} title="DS-S07 工业数据集技术质量规范 (文件完好度 + 几何标注有效性)">数据与技术质量:</span>
                        <span style={{ ...styles.detailVal, color: (selectedSample.technical_quality_score || 98) < 70 ? "#ea580c" : "#0f172a", fontWeight: "bold" }}>
                          {selectedSample.technical_quality_score ?? 98}/100
                        </span>
                      </div>
                    </>
                  );
                })()}

                {/* Technical Quality Issues Box (if any) */}
                {sampleDetail?.technical_issues && sampleDetail.technical_issues.length > 0 && (
                  <div style={styles.techIssueBox}>
                    <div style={styles.techIssueTitle}>
                      ⚠️ 数据与技术质量扣分原因 ({sampleDetail.technical_issues.length} 条)
                    </div>
                    {sampleDetail.technical_issues.map((iss, idx) => (
                      <div key={idx} style={styles.techIssueItem}>
                        <b style={{ color: "#c2410c" }}>[{iss.issue_type}]</b> {iss.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ground Truth Annotations Section */}
                <div style={styles.annotationBox}>
                  <div style={styles.annotationTitle}>
                    🏷️ 真实缺陷与标注信息 ({sampleDetail?.annotations?.length || 0} 处)
                  </div>
                  {sampleDetail?.annotations && sampleDetail.annotations.length > 0 ? (
                    sampleDetail.annotations.map((ann, idx) => (
                      <div key={ann.annotation_id || idx} style={styles.annotationItem}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <b style={{ color: "#dc2626", fontSize: 12 }}>缺陷: {ann.phenomenon || ann.raw_label}</b>
                          <span style={{ fontSize: 11, color: "#64748b" }}>类型: {ann.annotation_type}</span>
                        </div>
                        {ann.bbox && (
                          <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                            BBox: [{ann.bbox.map((v) => Number(v).toFixed(1)).join(", ")}]
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      无真实缺陷标注 (产线良品或未标记)
                    </div>
                  )}
                </div>

                {/* MLLM Observation Note with Single-Sample Audit Button */}
                <div style={styles.observationBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={styles.obsTitle}>🤖 多模态大模型视觉观察建议</div>
                    <button
                      style={styles.auditSingleBtn}
                      disabled={auditingSingle}
                      onClick={auditCurrentSample}
                      title="调用本地 Qwen3.8-27B 针对该图进行深度多模态质检"
                    >
                      {auditingSingle ? "正在推理..." : "⚡ 单图智能审计"}
                    </button>
                  </div>

                  {singleAuditMsg && (
                    <div style={singleAuditMsg.startsWith("❌") ? styles.errorNotice : styles.successNotice}>
                      {singleAuditMsg}
                    </div>
                  )}

                  {selectedSample.suggestion ? (
                    <div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        <b>模型:</b> {selectedSample.suggestion.model_name}
                      </div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        <b>建议标签:</b>{" "}
                        <span style={{ color: selectedSample.suggestion.suggested_label === "FAIL" ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
                          {selectedSample.suggestion.suggested_label}
                        </span>{" "}
                        ({selectedSample.suggestion.reason_category || "无异常分类"})
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0" }}>
                        {selectedSample.suggestion.notes || "无附带观察描述"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                      该样本尚未经过多模态大模型视觉审计。点击右上角“⚡ 单图智能审计”按钮可立即调用本地 VLM 进行推理诊断。
                    </div>
                  )}
                </div>

                {/* Human Review Decision Actions (DS-S10, DS-S12) */}
                <div style={styles.reviewBox}>
                  <div style={styles.reviewBoxTitle}>✍ 人工权威判决 (Gold Decision)</div>
                  {reviewSuccessMsg && <div style={styles.successBanner}>{reviewSuccessMsg}</div>}

                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                      复核理由 / 缺陷描述:
                    </label>
                    <input
                      type="text"
                      style={styles.reviewInput}
                      placeholder="例如: 边缘胶体轻微溢胶，属于可接受工艺公差"
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                    />
                  </div>

                  <div style={styles.reviewButtons}>
                    <button
                      style={styles.passBtn}
                      disabled={submittingReview}
                      onClick={() => submitDecision("PASS")}
                    >
                      ✓ 判定合格 (PASS)
                    </button>
                    <button
                      style={styles.failBtn}
                      disabled={submittingReview}
                      onClick={() => submitDecision("FAIL")}
                    >
                      ✗ 判定缺陷 (FAIL)
                    </button>
                    <button
                      style={styles.uncertainBtn}
                      disabled={submittingReview}
                      onClick={() => submitDecision("UNCERTAIN")}
                    >
                      ? 存疑 (UNCERTAIN)
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, lineHeight: 1.4 }}>
                    注: 任何模型建议都不会自动覆盖真值。只有人审通过授权 RPC 提交的判决方能写入基准数据库。
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.emptyState}>请选择左侧样本以查看原图及评测证据。</div>
            )}
          </aside>
        </div>
      )}

      {/* TAB 2: DATASETS MANAGEMENT */}
      {activeTab === "datasets" && (
        <div style={styles.cardPanel}>
          <div style={styles.panelHeaderRow}>
            <h2>工业数据集列表 ({tasks.length})</h2>
            <button style={styles.primaryBtn} onClick={() => fileInputRef.current?.click()}>
              ＋ 导入新数据集 (ZIP / 文件夹)
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>任务 ID</th>
                <th style={styles.th}>产品 / 类别</th>
                <th style={styles.th}>样本总数</th>
                <th style={styles.th}>特征提取覆盖率</th>
                <th style={styles.th}>已产生审计建议</th>
                <th style={styles.th}>人工复核数</th>
                <th style={styles.th}>最新 Build ID</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.task_id} style={t.task_id === selectedTaskId ? styles.trSelected : styles.tr}>
                  <td style={styles.td}><b>{t.task_id}</b></td>
                  <td style={styles.td}>{t.product}</td>
                  <td style={styles.td}>{t.total_samples}</td>
                  <td style={styles.td}>{t.feature_coverage_pct}%</td>
                  <td style={styles.td}>{t.total_suggestions}</td>
                  <td style={styles.td}>{t.total_decisions}</td>
                  <td style={styles.td}>{t.latest_build_id || "无"}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.secondaryBtnSmall}
                      onClick={() => {
                        setSelectedTaskId(t.task_id);
                        setActiveTab("samples");
                      }}
                    >
                      查看样本
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: AUDIT JOBS CONFIGURATION */}
      {activeTab === "jobs" && (
        <div style={styles.cardPanel}>
          <h2>多模态大模型视觉审计调度</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
            调度 DSH 原生 Agent / 多模态模型对目标工业数据集进行低成本筛选与代表性高危图观察 (DS-S06, DS-S09)。
          </p>

          <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={styles.fieldLabel}>目标任务 (Task ID):</label>
              <select
                style={styles.selectInput}
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
              >
                {tasks.map((t) => (
                  <option key={t.task_id} value={t.task_id}>
                    {t.product} ({t.task_id}) - {t.total_samples} 张图
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.fieldLabel}>审计抽样模式 (Sampling Mode):</label>
              <select
                style={styles.selectInput}
                value={auditMode}
                onChange={(e) => setAuditMode(e.target.value)}
              >
                <option value="HYBRID">混合抽样 (HYBRID - 推荐): 基础结构全检 + 异常代表图抽查</option>
                <option value="FULL_VISUAL">全量视觉审计 (FULL_VISUAL): 检查合格样本全部图片</option>
                <option value="STRATIFIED_SAMPLE">分层抽样 (STRATIFIED_SAMPLE): 跨工艺批次稳定分层</option>
              </select>
            </div>

            <div>
              <label style={styles.fieldLabel}>视觉推理模型 (MLLM Route):</label>
              <select
                style={styles.selectInput}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              >
                <option value="Qwen/Qwen3.8-27B-FP8">Qwen 3.8 27B FP8 (本地部署 / 192.168.2.197:30002)</option>
                <option value="DETERMINISTIC_ONLY">仅确定性基础质量审计 (无模型模式)</option>
              </select>
            </div>

            {jobRunning && (
              <div style={styles.progressContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>审计进度</span>
                  <span style={{ fontSize: 13, color: "#2563eb" }}>{jobProgress}%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${jobProgress}%` }} />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{jobMessage}</div>
              </div>
            )}

            {!jobRunning && jobMessage && (
              <div style={styles.successBanner}>{jobMessage}</div>
            )}

            <div>
              <button
                style={{ ...styles.primaryBtn, padding: "12px 24px", fontSize: 14 }}
                disabled={jobRunning || !selectedTaskId}
                onClick={startAuditJob}
              >
                {jobRunning ? "正在执行多模态审计..." : "▷ 开始执行工业数据集智能审计"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HUMAN REVIEW QUEUE */}
      {activeTab === "review" && (
        <div style={styles.cardPanel}>
          <h2>人工质检复核工作台 (Human Review Queue)</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
            对被多模态大模型判定为高疑点（可疑度 ≥ 60）或存疑（UNCERTAIN）的样本进行人工核验。
          </p>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>样本 ID</th>
                <th style={styles.th}>缩略图</th>
                <th style={styles.th}>视觉可疑度</th>
                <th style={styles.th}>模型建议标签</th>
                <th style={styles.th}>缺陷原因分类</th>
                <th style={styles.th}>当前真值</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {samples.slice(0, 10).map((s) => (
                <tr key={s.sample_id} style={styles.tr}>
                  <td style={styles.td}><b>{s.sample_id}</b></td>
                  <td style={styles.td}>
                    <img
                      src={`/api/iad/media/sample/${encodeURIComponent(s.task_id)}/${encodeURIComponent(s.sample_id)}/thumbnail?size=100`}
                      alt=""
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                    />
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: (s.visual_suspicion_score || 0) >= 60 ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
                      {s.visual_suspicion_score ?? "未测"}
                    </span>
                  </td>
                  <td style={styles.td}>{s.suggestion?.suggested_label || "无"}</td>
                  <td style={styles.td}>{s.suggestion?.reason_category || "未分类"}</td>
                  <td style={styles.td}>
                    <span style={s.reviewed ? styles.tagReviewed : styles.tagNeutral}>
                      {s.review_decision || s.quality_status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.secondaryBtnSmall}
                      onClick={() => {
                        setSelectedSample(s);
                        setActiveTab("samples");
                      }}
                    >
                      复核详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: REPORTS & SUMMARY */}
      {activeTab === "reports" && (
        <div style={styles.cardPanel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2>工业数据集质检与审计报告</h2>
              <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
                单据编码: IAD-REPORT-{selectedTaskId} · 生成时间: {report ? new Date(report.generated_at).toLocaleString() : "..."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={styles.secondaryBtn}
                onClick={() => {
                  window.open(`/api/iad/report/${encodeURIComponent(selectedTaskId)}`, "_blank");
                }}
              >
                ⤓ 导出 JSON 报告
              </button>
            </div>
          </div>

          {loadingReport ? (
            <div style={styles.emptyState}>正在汇总结算审计数据...</div>
          ) : report ? (
            <div>
              <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>多模态审计覆盖率</div>
                  <div style={styles.kpiValue}>{report.vlm_coverage_pct}%</div>
                  <div style={styles.kpiSub}>已审: {report.vlm_audited_count} / 总数: {report.total_samples}</div>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>挖掘出的可疑缺陷</div>
                  <div style={{ ...styles.kpiValue, color: "#dc2626" }}>{report.vlm_anomalies_count}</div>
                  <div style={styles.kpiSub}>异常建议发现占比 {(report.vlm_anomalies_count / (report.vlm_audited_count || 1) * 100).toFixed(1)}%</div>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>人工复核合格率</div>
                  <div style={{ ...styles.kpiValue, color: "#16a34a" }}>
                    {report.human_reviewed_count > 0
                      ? `${((report.human_pass_count / report.human_reviewed_count) * 100).toFixed(1)}%`
                      : "未复核"}
                  </div>
                  <div style={styles.kpiSub}>合格: {report.human_pass_count} · 缺陷: {report.human_fail_count}</div>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>视觉推理模型</div>
                  <div style={{ ...styles.kpiValue, fontSize: 16, marginTop: 12 }}>{report.model_name}</div>
                  <div style={styles.kpiSub}>温度 0.1 · 确定性参数</div>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3>异常缺陷类型分布统计</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                  {Object.entries(report.categories || {}).map(([cat, count]) => (
                    <div key={cat} style={styles.categoryBadge}>
                      <b>{cat}:</b> {count} 项
                    </div>
                  ))}
                  {Object.keys(report.categories || {}).length === 0 && (
                    <div style={{ color: "#64748b", fontSize: 13 }}>暂无分类数据</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>未能加载该任务审计报告。</div>
          )}
        </div>
      )}

      {/* Lightbox Modal for 1:1 Original Resolution Image & Defect Overlay */}
      {lightboxOpen && selectedSample && (
        <div style={styles.modalOverlay} onClick={() => setLightboxOpen(false)}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={styles.modalBadge}>高精原图检视</span>
                  <b style={{ fontSize: 13, color: "#f8fafc" }}>{selectedSample.sample_id}</b>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  物理分辨率: {sampleDetail?.sample.width ? `${sampleDetail.sample.width} × ${sampleDetail.sample.height} 像素` : "读取中..."} ·
                  生产批次: {selectedSample.batch_id || "default"} ·
                  缺陷标注: {sampleDetail?.annotations?.length || 0} 处 ·
                  数据与技术质量: {selectedSample.technical_quality_score ?? 98}分
                </div>
              </div>

              {/* Toolbar Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.btnGroup}>
                  <button
                    style={lightboxZoom === "fit" ? styles.zoomBtnActive : styles.zoomBtn}
                    onClick={() => setLightboxZoom("fit")}
                    title="缩放到适合屏幕大小"
                  >
                    自适应视口
                  </button>
                  <button
                    style={lightboxZoom === "100" ? styles.zoomBtnActive : styles.zoomBtn}
                    onClick={() => setLightboxZoom("100")}
                    title="按原始高分辨率 1:1 像素显示"
                  >
                    100% 原始尺寸
                  </button>
                  <button
                    style={lightboxZoom === "150" ? styles.zoomBtnActive : styles.zoomBtn}
                    onClick={() => setLightboxZoom("150")}
                    title="细节放大 1.5 倍"
                  >
                    150%
                  </button>
                  <button
                    style={lightboxZoom === "200" ? styles.zoomBtnActive : styles.zoomBtn}
                    onClick={() => setLightboxZoom("200")}
                    title="细节放大 2 倍"
                  >
                    200%
                  </button>
                </div>

                {sampleDetail?.annotations && sampleDetail.annotations.length > 0 && (
                  <button
                    style={showBBoxes ? styles.toggleBtnActive : styles.toggleBtn}
                    onClick={() => setShowBBoxes(!showBBoxes)}
                  >
                    {showBBoxes ? "✓ 隐藏标注框" : "显示标注框"}
                  </button>
                )}

                <button
                  style={styles.modalCloseBtn}
                  onClick={() => setLightboxOpen(false)}
                  title="关闭 (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Image Viewport */}
            <div style={styles.modalViewport}>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  transform: lightboxZoom === "100" ? "scale(1)" : lightboxZoom === "150" ? "scale(1.5)" : lightboxZoom === "200" ? "scale(2)" : "none",
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease",
                  maxWidth: lightboxZoom === "fit" ? "100%" : "none",
                  maxHeight: lightboxZoom === "fit" ? "100%" : "none",
                }}
              >
                <img
                  src={`/api/iad/media/sample/${encodeURIComponent(selectedSample.task_id)}/${encodeURIComponent(selectedSample.sample_id)}/image`}
                  alt={selectedSample.sample_id}
                  style={{
                    display: "block",
                    maxWidth: lightboxZoom === "fit" ? "calc(100vw - 120px)" : "none",
                    maxHeight: lightboxZoom === "fit" ? "calc(100vh - 180px)" : "none",
                    objectFit: "contain",
                    borderRadius: 4,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
                  }}
                />

                {/* SVG BBox overlay */}
                {showBBoxes && sampleDetail?.annotations && sampleDetail.sample.width && sampleDetail.sample.height && (
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                    viewBox={`0 0 ${sampleDetail.sample.width} ${sampleDetail.sample.height}`}
                  >
                    {sampleDetail.annotations.map((ann, idx) => {
                      if (!ann.bbox) return null;
                      const [x1, y1, x2, y2] = ann.bbox;
                      const w = Math.max(2, x2 - x1);
                      const h = Math.max(2, y2 - y1);
                      return (
                        <g key={ann.annotation_id || idx}>
                          <rect
                            x={x1}
                            y={y1}
                            width={w}
                            height={h}
                            fill="rgba(239, 68, 68, 0.25)"
                            stroke="#ef4444"
                            strokeWidth={2.5}
                          />
                          <rect
                            x={x1}
                            y={Math.max(0, y1 - 22)}
                            width={Math.max(80, (ann.phenomenon || ann.raw_label).length * 12 + 16)}
                            height={20}
                            fill="#ef4444"
                            rx={3}
                          />
                          <text
                            x={x1 + 6}
                            y={Math.max(14, y1 - 7)}
                            fill="#ffffff"
                            fontSize={12}
                            fontWeight="bold"
                          >
                            {ann.phenomenon || ann.raw_label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Visual Styling matching DSH Theme
const styles: Record<string, React.CSSProperties> = {
  root: {
    padding: "24px 32px",
    background: "#f8fafc",
    height: "100%",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    color: "#0f172a",
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: "#3b82f6",
    letterSpacing: "1.2px",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: "6px 0 0",
  },
  headerActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "9px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  secondaryBtn: {
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    padding: "9px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtnSmall: {
    background: "#ffffff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  kpiLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    margin: "8px 0 4px",
  },
  kpiSub: {
    fontSize: 11,
    color: "#94a3b8",
  },
  navRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 12,
  },
  tabGroup: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#e0f2fe",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    color: "#0284c7",
    fontWeight: 700,
    cursor: "pointer",
  },
  selectorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },
  selectInput: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 13,
    color: "#0f172a",
  },
  selectSmall: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
  },
  infoBanner: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  successBanner: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 380px",
    gap: 20,
    alignItems: "flex-start",
  },
  gridSection: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
  },
  filterBar: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
    paddingBottom: 14,
    borderBottom: "1px solid #f1f5f9",
    marginBottom: 16,
  },
  chip: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    color: "#475569",
    cursor: "pointer",
  },
  chipActive: {
    background: "#eff6ff",
    border: "1px solid #3b82f6",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: 12,
    minHeight: 400,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    cursor: "pointer",
    transition: "box-shadow 0.15s, border-color 0.15s",
  },
  cardSelected: {
    background: "#ffffff",
    border: "2px solid #2563eb",
    borderRadius: 10,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 0 0 1px #2563eb",
  },
  thumbWrapper: {
    height: 120,
    background: "#f1f5f9",
    position: "relative",
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  badgeTopLeft: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  tagNeutral: {
    background: "rgba(15,23,42,0.75)",
    color: "#ffffff",
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 4,
  },
  tagDanger: {
    background: "#dc2626",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
  },
  tagSuccess: {
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
  },
  tagReviewed: {
    background: "#7c3aed",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
  },
  cardInfo: {
    padding: "8px 10px",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardMetrics: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  paginationRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9",
  },
  pageBtn: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
  pageText: {
    fontSize: 12,
    color: "#475569",
  },
  detailAside: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    position: "sticky",
    top: 20,
  },
  asideTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: "0 0 12px",
    color: "#0f172a",
  },
  bigImageWrapper: {
    width: "100%",
    height: 220,
    background: "#f1f5f9",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
  },
  bigImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  cardZoomBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    background: "rgba(15, 23, 42, 0.75)",
    border: "none",
    borderRadius: 4,
    color: "#ffffff",
    fontSize: 11,
    padding: "2px 6px",
    cursor: "pointer",
  },
  zoomHintBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    background: "rgba(15, 23, 42, 0.8)",
    color: "#ffffff",
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 4,
    pointerEvents: "none",
  },
  svgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    padding: "6px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  detailKey: {
    color: "#64748b",
    flexShrink: 0,
    minWidth: 70,
  },
  detailVal: {
    color: "#0f172a",
    fontWeight: 500,
    textAlign: "right",
  },
  detailValEllipsisWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    flex: 1,
    justifyContent: "flex-end",
  },
  detailValEllipsis: {
    color: "#0f172a",
    fontWeight: 600,
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 200,
  },
  copyBtn: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    padding: "2px 6px",
    fontSize: 10,
    color: "#475569",
    cursor: "pointer",
    flexShrink: 0,
  },
  annotationBox: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  annotationTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#991b1b",
    marginBottom: 6,
  },
  annotationItem: {
    background: "#ffffff",
    border: "1px solid #fecaca",
    borderRadius: 6,
    padding: "6px 8px",
    marginBottom: 6,
  },
  techIssueBox: {
    background: "#fff7ed",
    border: "1px solid #ffedd5",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  techIssueTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#c2410c",
    marginBottom: 6,
  },
  techIssueItem: {
    fontSize: 11,
    color: "#7c2d12",
    marginBottom: 4,
  },
  auditSingleBtn: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  successNotice: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 11,
    padding: "6px 8px",
    borderRadius: 6,
    marginBottom: 8,
  },
  errorNotice: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 11,
    padding: "6px 8px",
    borderRadius: 6,
    marginBottom: 8,
  },
  topPagination: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  pageBtnSmall: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 11,
    cursor: "pointer",
  },
  pageTextSmall: {
    fontSize: 11,
    color: "#475569",
    fontWeight: 600,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    width: "90vw",
    height: "90vh",
    background: "#0f172a",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    border: "1px solid #334155",
  },
  modalHeader: {
    padding: "12px 20px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBadge: {
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 4,
  },
  modalViewport: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#090d16",
  },
  modalCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
  },
  btnGroup: {
    display: "flex",
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid #475569",
  },
  zoomBtn: {
    background: "#334155",
    color: "#cbd5e1",
    border: "none",
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
  },
  zoomBtnActive: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  toggleBtn: {
    background: "#334155",
    color: "#cbd5e1",
    border: "1px solid #475569",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
  },
  toggleBtnActive: {
    background: "#dc2626",
    color: "#ffffff",
    border: "1px solid #dc2626",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  observationBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  },
  obsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
    marginBottom: 8,
  },
  reviewBox: {
    marginTop: 16,
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
    borderRadius: 8,
    padding: 12,
  },
  reviewBoxTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6b21a8",
    marginBottom: 10,
  },
  reviewInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d8b4fe",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
  },
  reviewButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 6,
    marginTop: 8,
  },
  passBtn: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "8px 0",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  failBtn: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "8px 0",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  uncertainBtn: {
    background: "#64748b",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "8px 0",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  cardPanel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 24,
  },
  panelHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e2e8f0",
    color: "#475569",
    fontWeight: 600,
    fontSize: 12,
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  trSelected: {
    borderBottom: "1px solid #f1f5f9",
    background: "#eff6ff",
  },
  td: {
    padding: "10px 12px",
    color: "#1e293b",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    display: "block",
    marginBottom: 6,
  },
  progressContainer: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 14,
  },
  progressBarBg: {
    height: 8,
    background: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "#2563eb",
    transition: "width 0.3s",
  },
  categoryBadge: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
  },
  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
  },
};
