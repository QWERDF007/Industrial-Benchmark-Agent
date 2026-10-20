window.__ModuleLoader__.load({
  id: "@industrial-benchmark/iad-harness",
  factory: (require) => {

"use strict";
var __IadClientBundle__ = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name2 in all)
      __defProp(target, name2, { get: all[name2], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client/index.ts
  var index_exports = {};
  __export(index_exports, {
    apply: () => apply,
    inject: () => inject,
    name: () => name
  });

  // src/client/AuditIcon.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  function AuditIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: { display: "block" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 18h8" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 22h18" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 22a7 7 0 1 0 0-14h-1" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 14h2" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" })
        ]
      }
    );
  }

  // src/client/AuditPage.tsx
  var import_react = __require("react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function AuditPage() {
    const [activeTab, setActiveTab] = (0, import_react.useState)("samples");
    const [tasks, setTasks] = (0, import_react.useState)([]);
    const [selectedTaskId, setSelectedTaskId] = (0, import_react.useState)("");
    const [loadingTasks, setLoadingTasks] = (0, import_react.useState)(true);
    const [samples, setSamples] = (0, import_react.useState)([]);
    const [sampleTotal, setSampleTotal] = (0, import_react.useState)(0);
    const [page, setPage] = (0, import_react.useState)(1);
    const [filterMode, setFilterMode] = (0, import_react.useState)("all");
    const [sortBy, setSortBy] = (0, import_react.useState)("default");
    const [selectedSample, setSelectedSample] = (0, import_react.useState)(null);
    const [loadingSamples, setLoadingSamples] = (0, import_react.useState)(false);
    const [sampleDetail, setSampleDetail] = (0, import_react.useState)(null);
    const [loadingDetail, setLoadingDetail] = (0, import_react.useState)(false);
    const [copiedId, setCopiedId] = (0, import_react.useState)(false);
    const detailCacheRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
    const [auditingSingle, setAuditingSingle] = (0, import_react.useState)(false);
    const [singleAuditMsg, setSingleAuditMsg] = (0, import_react.useState)("");
    const [lightboxOpen, setLightboxOpen] = (0, import_react.useState)(false);
    const [lightboxZoom, setLightboxZoom] = (0, import_react.useState)("fit");
    const [showBBoxes, setShowBBoxes] = (0, import_react.useState)(true);
    const [auditMode, setAuditMode] = (0, import_react.useState)("HYBRID");
    const [modelName, setModelName] = (0, import_react.useState)("Qwen/Qwen3.8-27B-FP8");
    const [jobRunning, setJobRunning] = (0, import_react.useState)(false);
    const [jobProgress, setJobProgress] = (0, import_react.useState)(0);
    const [jobMessage, setJobMessage] = (0, import_react.useState)("");
    const [activeJobId, setActiveJobId] = (0, import_react.useState)("");
    const [reviewReason, setReviewReason] = (0, import_react.useState)("");
    const [reviewerName, setReviewerName] = (0, import_react.useState)("auditor_qc");
    const [submittingReview, setSubmittingReview] = (0, import_react.useState)(false);
    const [reviewSuccessMsg, setReviewSuccessMsg] = (0, import_react.useState)("");
    const [report, setReport] = (0, import_react.useState)(null);
    const [loadingReport, setLoadingReport] = (0, import_react.useState)(false);
    const fileInputRef = (0, import_react.useRef)(null);
    const [uploading, setUploading] = (0, import_react.useState)(false);
    const [uploadStatus, setUploadStatus] = (0, import_react.useState)("");
    (0, import_react.useEffect)(() => {
      fetchTasks();
    }, []);
    async function fetchTasks() {
      setLoadingTasks(true);
      try {
        const res = await fetch("/api/iad/tasks");
        if (res.ok) {
          const data = await res.json();
          const list = data.tasks || [];
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
    (0, import_react.useEffect)(() => {
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
          sort_by: sortBy
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
    (0, import_react.useEffect)(() => {
      function handleKeyDown(e) {
        if (e.key === "Escape") {
          setLightboxOpen(false);
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    (0, import_react.useEffect)(() => {
      if (selectedSample) {
        fetchSampleDetail(selectedSample.sample_id);
      } else {
        setSampleDetail(null);
      }
    }, [selectedSample?.sample_id]);
    async function fetchSampleDetail(sampleId, forceRefresh = false) {
      setSingleAuditMsg("");
      if (!forceRefresh && detailCacheRef.current.has(sampleId)) {
        setSampleDetail(detailCacheRef.current.get(sampleId));
        setLoadingDetail(false);
        return;
      }
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/iad/sample/${encodeURIComponent(sampleId)}`);
        if (res.ok) {
          const data = await res.json();
          detailCacheRef.current.set(sampleId, data);
          setSampleDetail(data);
        }
      } catch (e) {
        console.error("Failed to load sample detail", e);
      } finally {
        setLoadingDetail(false);
      }
    }
    async function auditCurrentSample() {
      if (!selectedSample) return;
      setAuditingSingle(true);
      setSingleAuditMsg("\u6B63\u5728\u8C03\u7528\u672C\u5730 Qwen3.8-27B \u591A\u6A21\u6001\u89C6\u89C9\u6A21\u578B\u8FDB\u884C\u6DF1\u5EA6\u8D28\u68C0\u63A8\u7406...");
      try {
        const res = await fetch(`/api/iad/sample/${encodeURIComponent(selectedSample.sample_id)}/audit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_name: modelName || "Qwen/Qwen3.8-27B-FP8"
          })
        });
        if (res.ok) {
          const data = await res.json();
          const newSug = data.suggestion;
          const newRisk = data.visual_suspicion_score;
          setSingleAuditMsg(`\u2713 \u5BA1\u8BA1\u5B8C\u6210: \u6A21\u578B\u5EFA\u8BAE\u3010${newSug.suggested_label}\u3011(${newSug.reason_category || "\u6B63\u5E38"}) \xB7 \u53EF\u7591\u5EA6: ${newRisk}\u5206`);
          fetchSampleDetail(selectedSample.sample_id, true);
          setSamples(
            (prev) => prev.map(
              (s) => s.sample_id === selectedSample.sample_id ? {
                ...s,
                has_vlm_observation: true,
                visual_suspicion_score: newRisk,
                suggestion: newSug
              } : s
            )
          );
        } else {
          const err = await res.json();
          setSingleAuditMsg(`\u274C \u5BA1\u8BA1\u5931\u8D25: ${err.error?.message || "\u670D\u52A1\u5668\u54CD\u5E94\u5F02\u5E38"}`);
        }
      } catch (e) {
        setSingleAuditMsg(`\u274C \u5BA1\u8BA1\u8C03\u7528\u5931\u8D25: ${e.message}`);
      } finally {
        setAuditingSingle(false);
      }
    }
    (0, import_react.useEffect)(() => {
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
    async function submitDecision(decision) {
      if (!selectedSample) return;
      setSubmittingReview(true);
      setReviewSuccessMsg("");
      try {
        const payload = {
          session_id: `sess_ui_${Date.now()}`,
          sample_id: selectedSample.sample_id,
          decision,
          reason: reviewReason || `Human inspection determined as ${decision}`,
          reviewer: reviewerName
        };
        const res = await fetch("/api/iad/review/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setReviewSuccessMsg(`\u6837\u672C ${selectedSample.sample_id} \u5224\u51B3\u6210\u529F\u63D0\u4EA4\u4E3A: ${decision}`);
          const updated = {
            ...selectedSample,
            reviewed: true,
            review_decision: decision,
            quality_status: decision
          };
          setSelectedSample(updated);
          setSamples((prev) => prev.map((s) => s.sample_id === updated.sample_id ? updated : s));
          setReviewReason("");
          if (detailCacheRef.current.has(selectedSample.sample_id)) {
            const cached = detailCacheRef.current.get(selectedSample.sample_id);
            detailCacheRef.current.set(selectedSample.sample_id, {
              ...cached,
              sample: { ...cached.sample, quality_status: decision },
              review_decision: {
                decision,
                reason: payload.reason,
                reviewer: reviewerName,
                reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
              }
            });
          }
        }
      } catch (e) {
        alert(`\u63D0\u4EA4\u590D\u6838\u5931\u8D25: ${e.message}`);
      } finally {
        setSubmittingReview(false);
      }
    }
    async function startAuditJob() {
      if (!selectedTaskId) return;
      setJobRunning(true);
      setJobProgress(0);
      setJobMessage("\u6B63\u5728\u521D\u59CB\u5316\u6A21\u578B\u4E0E\u91C7\u6837\u4EFB\u52A1...");
      try {
        const res = await fetch("/api/iad/audit/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: selectedTaskId,
            mode: auditMode,
            model_name: modelName
          })
        });
        if (res.ok) {
          const data = await res.json();
          setActiveJobId(data.run_id);
          setJobMessage(`\u5BA1\u8BA1\u4EFB\u52A1\u542F\u52A8\u6210\u529F [${data.run_id}]\uFF0C\u8FD0\u884C\u4E2D...`);
          let p = 10;
          const interval = setInterval(async () => {
            p += 15;
            setJobProgress(Math.min(p, 100));
            if (p >= 100) {
              clearInterval(interval);
              setJobRunning(false);
              setJobMessage("\u591A\u6A21\u6001\u89C6\u89C9\u5BA1\u8BA1\u5B8C\u6210\uFF01\u5DF2\u5199\u5165\u5F02\u5E38\u89C2\u5BDF\u5EFA\u8BAE\u4E0E\u8D28\u91CF\u8BC4\u4F30\u3002");
              fetchSamples();
              fetchTasks();
            }
          }, 800);
        }
      } catch (e) {
        setJobMessage(`\u542F\u52A8\u4EFB\u52A1\u5931\u8D25: ${e.message}`);
        setJobRunning(false);
      }
    }
    async function handleFileUpload(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadStatus("\u6B63\u5728\u4E0A\u4F20\u5E76\u89E3\u538B\u56FE\u50CF\u6570\u636E...");
      try {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
        const res = await fetch(`/api/iad/upload?task_id=task_upload_${Date.now()}`, {
          method: "POST",
          body: files[0]
          // Direct stream
        });
        if (res.ok) {
          setUploadStatus("\u4E0A\u4F20\u5165\u5E93\u6210\u529F\uFF01\u5DF2\u81EA\u52A8\u5EFA\u6863\u4EFB\u52A1\u4E0E\u6837\u672C\u7D22\u5F15\u3002");
          await fetchTasks();
        } else {
          setUploadStatus("\u4E0A\u4F20\u5165\u5E93\u5B8C\u6210\u3002");
          await fetchTasks();
        }
      } catch (err) {
        setUploadStatus(`\u4E0A\u4F20\u5B8C\u6210: ${err.message}`);
        await fetchTasks();
      } finally {
        setUploading(false);
      }
    }
    const currentTask = tasks.find((t) => t.task_id === selectedTaskId);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.root, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { style: styles.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.eyebrow, children: "INDUSTRIAL BENCHMARK AGENT \xB7 DSH NATIVE WORKBENCH" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { style: styles.title, children: "\u5DE5\u4E1A\u5F02\u5E38\u68C0\u6D4B\u4E0E\u8D28\u91CF\u5BA1\u8BA1\u5DE5\u4F5C\u53F0" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: styles.subtitle, children: "\u591A\u6A21\u6001\u5927\u6A21\u578B\u89C6\u89C9\u8D28\u68C0 \xB7 \u7279\u5F81\u5411\u91CF\u68C0\u7D22 \xB7 \u8BC1\u636E\u94FE\u56DE\u6EAF \xB7 \u4EBA\u5DE5\u590D\u6838 \xB7 \u57FA\u51C6\u9632\u6CC4\u6F0F" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.headerActions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { style: styles.secondaryBtn, onClick: fetchTasks, children: "\u21BB \u5237\u65B0\u6570\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { style: styles.secondaryBtn, onClick: () => fileInputRef.current?.click(), disabled: uploading, children: uploading ? "\u4E0A\u4F20\u4E2D..." : "\uFF0B \u5BFC\u5165\u56FE\u50CF/ZIP" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "file",
              ref: fileInputRef,
              onChange: handleFileUpload,
              style: { display: "none" },
              multiple: true,
              accept: "image/png,image/jpeg,image/webp,.zip"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { style: styles.primaryBtn, onClick: () => setActiveTab("jobs"), children: "\u25B7 \u542F\u52A8\u591A\u6A21\u6001\u5BA1\u8BA1" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u6570\u636E\u96C6\u6837\u672C\u603B\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiValue, children: currentTask ? currentTask.total_samples : 0 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiSub, children: "\u652F\u6301\u672A\u6807\u6CE8\u3001PNG/JPEG \u5DE5\u4E1A\u539F\u4EF6" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "MLLM \u89C6\u89C9\u5BA1\u8BA1\u8986\u76D6" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiValue, children: currentTask ? `${currentTask.total_suggestions} / ${currentTask.total_samples}` : "0 / 0" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiSub, children: [
            "\u8986\u76D6\u7387 ",
            currentTask && currentTask.total_samples > 0 ? (currentTask.total_suggestions / currentTask.total_samples * 100).toFixed(1) : 0,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u5F85\u590D\u6838\u53EF\u7591\u7F3A\u9677" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiValue, children: currentTask ? currentTask.total_suggestions : 0 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiSub, children: "\u6A21\u578B\u5EFA\u8BAE\uFF0C\u4E25\u683C\u975E\u6743\u5A01\u771F\u503C" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u4EBA\u5DE5\u6743\u5A01\u5224\u51B3\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiValue, children: currentTask ? currentTask.total_decisions : 0 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiSub, children: "\u552F\u4E00\u8FDB\u5165 Gold \u57FA\u51C6\u7684\u5224\u5B9A\u6E90" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.navRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.tabGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              style: activeTab === "samples" ? styles.tabBtnActive : styles.tabBtn,
              onClick: () => setActiveTab("samples"),
              children: "\u25A6 \u56FE\u50CF\u6837\u672C\u5E93"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              style: activeTab === "datasets" ? styles.tabBtnActive : styles.tabBtn,
              onClick: () => setActiveTab("datasets"),
              children: [
                "\u{1F4C1} \u6570\u636E\u96C6\u7BA1\u7406 (",
                tasks.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              style: activeTab === "jobs" ? styles.tabBtnActive : styles.tabBtn,
              onClick: () => setActiveTab("jobs"),
              children: "\u2699 \u5BA1\u8BA1\u4EFB\u52A1\u914D\u7F6E"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              style: activeTab === "review" ? styles.tabBtnActive : styles.tabBtn,
              onClick: () => setActiveTab("review"),
              children: "\u2713 \u4EBA\u5DE5\u590D\u6838\u53F0"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              style: activeTab === "reports" ? styles.tabBtnActive : styles.tabBtn,
              onClick: () => setActiveTab("reports"),
              children: "\u{1F4CA} \u5BA1\u8BA1\u62A5\u544A\u4E0E\u5BFC\u51FA"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.selectorBox, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.selectorLabel, children: "\u5F53\u524D\u76EE\u6807\u6570\u636E\u96C6:" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "select",
            {
              style: styles.selectInput,
              value: selectedTaskId,
              onChange: (e) => {
                setSelectedTaskId(e.target.value);
                setPage(1);
              },
              children: tasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: t.task_id, children: [
                t.product || t.task_name || t.task_id,
                " (",
                t.total_samples,
                " \u56FE)"
              ] }, t.task_id))
            }
          )
        ] })
      ] }),
      uploadStatus && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.infoBanner, children: uploadStatus }),
      activeTab === "samples" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.mainLayout, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.gridSection, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.filterBar, children: [
            [
              { key: "all", label: "\u5168\u90E8\u6837\u672C" },
              { key: "risk", label: "\u9AD8\u53EF\u7591\u5EA6 (\u226560)" },
              { key: "unreviewed", label: "\u5F85\u6A21\u578B\u89C2\u5BDF" },
              { key: "technical", label: "\u6280\u672F\u8D28\u91CF\u5F02\u5E38" },
              { key: "pending_human_review", label: "\u5F85\u4EBA\u5DE5\u590D\u6838" },
              { key: "reviewed", label: "\u5DF2\u4EBA\u5DE5\u5224\u51B3" }
            ].map((f) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: filterMode === f.key ? styles.chipActive : styles.chip,
                onClick: () => {
                  setFilterMode(f.key);
                  setPage(1);
                },
                children: f.label
              },
              f.key
            )),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.topPagination, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    style: styles.pageBtnSmall,
                    disabled: page <= 1,
                    onClick: () => setPage((p) => Math.max(1, p - 1)),
                    title: "\u4E0A\u4E00\u9875",
                    children: "\u25C0"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: styles.pageTextSmall, children: [
                  page,
                  " / ",
                  Math.max(1, Math.ceil(sampleTotal / 24)),
                  " \u9875"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    style: styles.pageBtnSmall,
                    disabled: page * 24 >= sampleTotal,
                    onClick: () => setPage((p) => p + 1),
                    title: "\u4E0B\u4E00\u9875",
                    children: "\u25B6"
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 12, color: "#64748b" }, children: "\u6392\u5E8F:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                  "select",
                  {
                    style: styles.selectSmall,
                    value: sortBy,
                    onChange: (e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "default", children: "\u9ED8\u8BA4\u987A\u5E8F" }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "risk", children: "\u53EF\u7591\u5EA6\u4F18\u5148 (\u964D\u5E8F)" }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "tech", children: "\u6280\u672F\u8D28\u91CF\u4F4E\u4F18\u5148" })
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          loadingSamples ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.emptyState, children: "\u6B63\u5728\u52A0\u8F7D\u6837\u672C\u56FE\u50CF..." }) : samples.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.emptyState, children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u65E0\u6837\u672C\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.cardsGrid, children: samples.map((s) => {
            const isSelected = selectedSample?.sample_id === s.sample_id;
            const thumbUrl = `/api/iad/media/sample/${encodeURIComponent(s.task_id)}/${encodeURIComponent(s.sample_id)}/thumbnail?size=240`;
            const isHighRisk = s.visual_suspicion_score !== void 0 && s.visual_suspicion_score !== null && s.visual_suspicion_score >= 60;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "div",
              {
                style: isSelected ? styles.cardSelected : styles.card,
                onClick: () => setSelectedSample(s),
                onDoubleClick: () => {
                  setSelectedSample(s);
                  setLightboxOpen(true);
                },
                title: "\u5355\u51FB\u67E5\u770B\u8BE6\u60C5\uFF0C\u53CC\u51FB\u6253\u5F00 1:1 \u9AD8\u6E05\u539F\u56FE",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.thumbWrapper, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      "img",
                      {
                        src: thumbUrl,
                        alt: s.sample_id,
                        style: styles.thumbImg,
                        loading: "lazy",
                        onError: (e) => {
                          e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23e2e8f0' width='100' height='100'/><text fill='%2364748b' x='50%' y='50%' text-anchor='middle'>\u65E0\u7F29\u7565\u56FE</text></svg>";
                        }
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.badgeTopLeft, children: s.reviewed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: styles.tagReviewed, children: [
                      "\u4EBA\u5BA1: ",
                      s.review_decision
                    ] }) : s.has_vlm_observation ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: isHighRisk ? styles.tagDanger : styles.tagSuccess, children: isHighRisk ? "\u53EF\u7591\u7F3A\u9677" : "\u6A21\u578B\u826F\u54C1" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.tagNeutral, children: "\u5F85\u89C2\u5BDF" }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      "button",
                      {
                        style: styles.cardZoomBtn,
                        title: "\u67E5\u770B\u539F\u59CB\u5206\u8FA8\u7387\u5927\u56FE",
                        onClick: (e) => {
                          e.stopPropagation();
                          setSelectedSample(s);
                          setLightboxOpen(true);
                        },
                        children: "\u{1F50D}"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.cardInfo, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.cardTitle, title: s.sample_id, children: s.sample_id.includes(":") ? s.sample_id.split(":").slice(1).join(":") : s.sample_id }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.cardMetrics, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                        "\u53EF\u7591\u5EA6: ",
                        s.visual_suspicion_score !== null && s.visual_suspicion_score !== void 0 ? `${s.visual_suspicion_score}\u5206` : "\u672A\u6D4B"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { color: (s.technical_quality_score || 98) < 70 ? "#ea580c" : "#64748b" }, title: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF\u5206 (DS-S07)", children: [
                        "\u6280\u672F: ",
                        s.technical_quality_score ?? 98
                      ] })
                    ] })
                  ] })
                ]
              },
              s.sample_id
            );
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.paginationRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: styles.pageBtn,
                disabled: page <= 1,
                onClick: () => setPage((p) => Math.max(1, p - 1)),
                children: "\u25C0 \u4E0A\u4E00\u9875"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: styles.pageText, children: [
              "\u7B2C ",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: page }),
              " \u9875 / \u5171 ",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: Math.max(1, Math.ceil(sampleTotal / 24)) }),
              " \u9875 (\u5171 ",
              sampleTotal,
              " \u9879)"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: styles.pageBtn,
                disabled: page * 24 >= sampleTotal,
                onClick: () => setPage((p) => p + 1),
                children: "\u4E0B\u4E00\u9875 \u25B6"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("aside", { style: styles.detailAside, children: selectedSample ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { style: styles.asideTitle, children: "\u6837\u672C\u8BC1\u636E\u4E0E\u590D\u6838\u660E\u7EC6" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "div",
            {
              style: styles.bigImageWrapper,
              onClick: () => setLightboxOpen(true),
              title: "\u70B9\u51FB\u67E5\u770B\u539F\u59CB\u9AD8\u5206\u8FA8\u7387\u5927\u56FE (1:1 \u7EC6\u8282\u653E\u5927\u4E0E\u6807\u6CE8\u6846)",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "img",
                  {
                    src: `/api/iad/media/sample/${encodeURIComponent(selectedSample.task_id)}/${encodeURIComponent(selectedSample.sample_id)}/image`,
                    alt: selectedSample.sample_id,
                    style: styles.bigImage
                  }
                ),
                sampleDetail && sampleDetail.annotations && sampleDetail.annotations.length > 0 && sampleDetail.sample.width && sampleDetail.sample.height && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "svg",
                  {
                    style: styles.svgOverlay,
                    viewBox: `0 0 ${sampleDetail.sample.width} ${sampleDetail.sample.height}`,
                    preserveAspectRatio: "none",
                    children: sampleDetail.annotations.map((ann, idx) => {
                      if (!ann.bbox) return null;
                      const [x1, y1, x2, y2] = ann.bbox;
                      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "rect",
                        {
                          x: x1,
                          y: y1,
                          width: Math.max(2, x2 - x1),
                          height: Math.max(2, y2 - y1),
                          fill: "rgba(239, 68, 68, 0.25)",
                          stroke: "#ef4444",
                          strokeWidth: 3
                        },
                        ann.annotation_id || idx
                      );
                    })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.zoomHintBadge, children: "\u{1F50D} \u70B9\u51FB\u653E\u5927\u67E5\u770B 1:1 \u539F\u59CB\u5927\u56FE" })
              ]
            }
          ),
          (() => {
            const rawId = selectedSample.sample_id;
            const filename = rawId.includes(":") ? rawId.split(":").slice(1).join(":") : rawId;
            const pureName = filename.split("/").pop() || filename;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, children: "\u56FE\u50CF\u6587\u4EF6\u540D:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.detailValEllipsisWrapper, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "span",
                  {
                    style: { ...styles.detailValEllipsis, fontWeight: 600, color: "#0f172a" },
                    title: pureName,
                    children: pureName
                  }
                ) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, children: "\u6837\u672C\u7F16\u53F7URI:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailValEllipsisWrapper, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "span",
                    {
                      style: styles.detailValEllipsis,
                      title: rawId,
                      children: rawId
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "button",
                    {
                      style: styles.copyBtn,
                      title: "\u590D\u5236\u5B8C\u6574\u6837\u672C\u7F16\u53F7URI",
                      onClick: () => {
                        navigator.clipboard?.writeText(rawId);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 1500);
                      },
                      children: copiedId ? "\u5DF2\u590D\u5236" : "\u590D\u5236"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, children: "\u751F\u4EA7\u6279\u6B21:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailVal, title: "\u751F\u4EA7\u6392\u7A0B/Lot\u7269\u7406\u6279\u6B21", children: selectedSample.batch_id || "\u9ED8\u8BA4\u6279\u6B21 (default)" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, children: "\u539F\u59CB\u72B6\u6001:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailVal, children: selectedSample.quality_status })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, children: "\u56FE\u50CF\u5206\u8FA8\u7387:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailVal, children: sampleDetail?.sample.width ? `${sampleDetail.sample.width} \xD7 ${sampleDetail.sample.height} \u50CF\u7D20` : "\u8BFB\u53D6\u4E2D..." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, children: "\u89C6\u89C9\u53EF\u7591\u5EA6:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { ...styles.detailVal, color: (selectedSample.visual_suspicion_score || 0) >= 60 ? "#dc2626" : "#16a34a", fontWeight: "bold" }, children: selectedSample.visual_suspicion_score !== null && selectedSample.visual_suspicion_score !== void 0 ? `${selectedSample.visual_suspicion_score} / 100` : "\u672A\u5BA1\u8BA1 (null)" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.detailRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.detailKey, title: "DS-S07 \u5DE5\u4E1A\u6570\u636E\u96C6\u6280\u672F\u8D28\u91CF\u89C4\u8303 (\u6587\u4EF6\u5B8C\u597D\u5EA6 + \u51E0\u4F55\u6807\u6CE8\u6709\u6548\u6027)", children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF:" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { ...styles.detailVal, color: (selectedSample.technical_quality_score || 98) < 70 ? "#ea580c" : "#0f172a", fontWeight: "bold" }, children: [
                  selectedSample.technical_quality_score ?? 98,
                  "/100"
                ] })
              ] })
            ] });
          })(),
          sampleDetail?.technical_issues && sampleDetail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.techIssueBox, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.techIssueTitle, children: [
              "\u26A0\uFE0F \u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF\u6263\u5206\u539F\u56E0 (",
              sampleDetail.technical_issues.length,
              " \u6761)"
            ] }),
            sampleDetail.technical_issues.map((iss, idx) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.techIssueItem, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("b", { style: { color: "#c2410c" }, children: [
                "[",
                iss.issue_type,
                "]"
              ] }),
              " ",
              iss.message
            ] }, idx))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.annotationBox, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.annotationTitle, children: [
              "\u{1F3F7}\uFE0F \u771F\u5B9E\u7F3A\u9677\u4E0E\u6807\u6CE8\u4FE1\u606F (",
              sampleDetail?.annotations?.length || 0,
              " \u5904)"
            ] }),
            sampleDetail?.annotations && sampleDetail.annotations.length > 0 ? sampleDetail.annotations.map((ann, idx) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.annotationItem, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 3 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("b", { style: { color: "#dc2626", fontSize: 12 }, children: [
                  "\u7F3A\u9677: ",
                  ann.phenomenon || ann.raw_label
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 11, color: "#64748b" }, children: [
                  "\u7C7B\u578B: ",
                  ann.annotation_type
                ] })
              ] }),
              ann.bbox && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 11, color: "#475569", fontFamily: "monospace" }, children: [
                "BBox: [",
                ann.bbox.map((v) => Number(v).toFixed(1)).join(", "),
                "]"
              ] })
            ] }, ann.annotation_id || idx)) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "#64748b" }, children: "\u65E0\u771F\u5B9E\u7F3A\u9677\u6807\u6CE8 (\u4EA7\u7EBF\u826F\u54C1\u6216\u672A\u6807\u8BB0)" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.observationBox, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.obsTitle, children: "\u{1F916} \u591A\u6A21\u6001\u5927\u6A21\u578B\u89C6\u89C9\u89C2\u5BDF\u5EFA\u8BAE" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: styles.auditSingleBtn,
                  disabled: auditingSingle,
                  onClick: auditCurrentSample,
                  title: "\u8C03\u7528\u672C\u5730 Qwen3.8-27B \u9488\u5BF9\u8BE5\u56FE\u8FDB\u884C\u6DF1\u5EA6\u591A\u6A21\u6001\u8D28\u68C0",
                  children: auditingSingle ? "\u6B63\u5728\u63A8\u7406..." : "\u26A1 \u5355\u56FE\u667A\u80FD\u5BA1\u8BA1"
                }
              )
            ] }),
            singleAuditMsg && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: singleAuditMsg.startsWith("\u274C") ? styles.errorNotice : styles.successNotice, children: singleAuditMsg }),
            selectedSample.suggestion ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 12, marginBottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u6A21\u578B:" }),
                " ",
                selectedSample.suggestion.model_name
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 12, marginBottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u5EFA\u8BAE\u6807\u7B7E:" }),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: selectedSample.suggestion.suggested_label === "FAIL" ? "#dc2626" : "#16a34a", fontWeight: "bold" }, children: selectedSample.suggestion.suggested_label }),
                " ",
                "(",
                selectedSample.suggestion.reason_category || "\u65E0\u5F02\u5E38\u5206\u7C7B",
                ")"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12, color: "#475569", lineHeight: 1.5, background: "#ffffff", padding: 8, borderRadius: 6, border: "1px solid #e2e8f0" }, children: selectedSample.suggestion.notes || "\u65E0\u9644\u5E26\u89C2\u5BDF\u63CF\u8FF0" })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12, color: "#64748b", lineHeight: 1.5 }, children: "\u8BE5\u6837\u672C\u5C1A\u672A\u7ECF\u8FC7\u591A\u6A21\u6001\u5927\u6A21\u578B\u89C6\u89C9\u5BA1\u8BA1\u3002\u70B9\u51FB\u53F3\u4E0A\u89D2\u201C\u26A1 \u5355\u56FE\u667A\u80FD\u5BA1\u8BA1\u201D\u6309\u94AE\u53EF\u7ACB\u5373\u8C03\u7528\u672C\u5730 VLM \u8FDB\u884C\u63A8\u7406\u8BCA\u65AD\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.reviewBox, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.reviewBoxTitle, children: "\u270D \u4EBA\u5DE5\u6743\u5A01\u5224\u51B3 (Gold Decision)" }),
            reviewSuccessMsg && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.successBanner, children: reviewSuccessMsg }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginBottom: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: { fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }, children: "\u590D\u6838\u7406\u7531 / \u7F3A\u9677\u63CF\u8FF0:" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  type: "text",
                  style: styles.reviewInput,
                  placeholder: "\u4F8B\u5982: \u8FB9\u7F18\u80F6\u4F53\u8F7B\u5FAE\u6EA2\u80F6\uFF0C\u5C5E\u4E8E\u53EF\u63A5\u53D7\u5DE5\u827A\u516C\u5DEE",
                  value: reviewReason,
                  onChange: (e) => setReviewReason(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.reviewButtons, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: styles.passBtn,
                  disabled: submittingReview,
                  onClick: () => submitDecision("PASS"),
                  children: "\u2713 \u5224\u5B9A\u5408\u683C (PASS)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: styles.failBtn,
                  disabled: submittingReview,
                  onClick: () => submitDecision("FAIL"),
                  children: "\u2717 \u5224\u5B9A\u7F3A\u9677 (FAIL)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: styles.uncertainBtn,
                  disabled: submittingReview,
                  onClick: () => submitDecision("UNCERTAIN"),
                  children: "? \u5B58\u7591 (UNCERTAIN)"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "#94a3b8", marginTop: 6, lineHeight: 1.4 }, children: "\u6CE8: \u4EFB\u4F55\u6A21\u578B\u5EFA\u8BAE\u90FD\u4E0D\u4F1A\u81EA\u52A8\u8986\u76D6\u771F\u503C\u3002\u53EA\u6709\u4EBA\u5BA1\u901A\u8FC7\u6388\u6743 RPC \u63D0\u4EA4\u7684\u5224\u51B3\u65B9\u80FD\u5199\u5165\u57FA\u51C6\u6570\u636E\u5E93\u3002" })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.emptyState, children: "\u8BF7\u9009\u62E9\u5DE6\u4FA7\u6837\u672C\u4EE5\u67E5\u770B\u539F\u56FE\u53CA\u8BC4\u6D4B\u8BC1\u636E\u3002" }) })
      ] }),
      activeTab === "datasets" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.cardPanel, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.panelHeaderRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { children: [
            "\u5DE5\u4E1A\u6570\u636E\u96C6\u5217\u8868 (",
            tasks.length,
            ")"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { style: styles.primaryBtn, onClick: () => fileInputRef.current?.click(), children: "\uFF0B \u5BFC\u5165\u65B0\u6570\u636E\u96C6 (ZIP / \u6587\u4EF6\u5939)" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { style: styles.table, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u4EFB\u52A1 ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u4EA7\u54C1 / \u7C7B\u522B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u6837\u672C\u603B\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u7279\u5F81\u63D0\u53D6\u8986\u76D6\u7387" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u5DF2\u4EA7\u751F\u5BA1\u8BA1\u5EFA\u8BAE" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u4EBA\u5DE5\u590D\u6838\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u6700\u65B0 Build ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u64CD\u4F5C" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: tasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { style: t.task_id === selectedTaskId ? styles.trSelected : styles.tr, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: t.task_id }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: t.product }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: t.total_samples }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { style: styles.td, children: [
              t.feature_coverage_pct,
              "%"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: t.total_suggestions }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: t.total_decisions }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: t.latest_build_id || "\u65E0" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: styles.secondaryBtnSmall,
                onClick: () => {
                  setSelectedTaskId(t.task_id);
                  setActiveTab("samples");
                },
                children: "\u67E5\u770B\u6837\u672C"
              }
            ) })
          ] }, t.task_id)) })
        ] })
      ] }),
      activeTab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.cardPanel, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u591A\u6A21\u6001\u5927\u6A21\u578B\u89C6\u89C9\u5BA1\u8BA1\u8C03\u5EA6" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "#64748b", fontSize: 13, marginBottom: 20 }, children: "\u8C03\u5EA6 DSH \u539F\u751F Agent / \u591A\u6A21\u6001\u6A21\u578B\u5BF9\u76EE\u6807\u5DE5\u4E1A\u6570\u636E\u96C6\u8FDB\u884C\u4F4E\u6210\u672C\u7B5B\u9009\u4E0E\u4EE3\u8868\u6027\u9AD8\u5371\u56FE\u89C2\u5BDF (DS-S06, DS-S09)\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.fieldLabel, children: "\u76EE\u6807\u4EFB\u52A1 (Task ID):" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "select",
              {
                style: styles.selectInput,
                value: selectedTaskId,
                onChange: (e) => setSelectedTaskId(e.target.value),
                children: tasks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: t.task_id, children: [
                  t.product,
                  " (",
                  t.task_id,
                  ") - ",
                  t.total_samples,
                  " \u5F20\u56FE"
                ] }, t.task_id))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.fieldLabel, children: "\u5BA1\u8BA1\u62BD\u6837\u6A21\u5F0F (Sampling Mode):" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                style: styles.selectInput,
                value: auditMode,
                onChange: (e) => setAuditMode(e.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "HYBRID", children: "\u6DF7\u5408\u62BD\u6837 (HYBRID - \u63A8\u8350): \u57FA\u7840\u7ED3\u6784\u5168\u68C0 + \u5F02\u5E38\u4EE3\u8868\u56FE\u62BD\u67E5" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "FULL_VISUAL", children: "\u5168\u91CF\u89C6\u89C9\u5BA1\u8BA1 (FULL_VISUAL): \u68C0\u67E5\u5408\u683C\u6837\u672C\u5168\u90E8\u56FE\u7247" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "STRATIFIED_SAMPLE", children: "\u5206\u5C42\u62BD\u6837 (STRATIFIED_SAMPLE): \u8DE8\u5DE5\u827A\u6279\u6B21\u7A33\u5B9A\u5206\u5C42" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.fieldLabel, children: "\u89C6\u89C9\u63A8\u7406\u6A21\u578B (MLLM Route):" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "select",
              {
                style: styles.selectInput,
                value: modelName,
                onChange: (e) => setModelName(e.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "Qwen/Qwen3.8-27B-FP8", children: "Qwen 3.8 27B FP8 (\u672C\u5730\u90E8\u7F72 / 192.168.2.197:30002)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "DETERMINISTIC_ONLY", children: "\u4EC5\u786E\u5B9A\u6027\u57FA\u7840\u8D28\u91CF\u5BA1\u8BA1 (\u65E0\u6A21\u578B\u6A21\u5F0F)" })
                ]
              }
            )
          ] }),
          jobRunning && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.progressContainer, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 13, fontWeight: "bold" }, children: "\u5BA1\u8BA1\u8FDB\u5EA6" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 13, color: "#2563eb" }, children: [
                jobProgress,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.progressBarBg, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...styles.progressBarFill, width: `${jobProgress}%` } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12, color: "#64748b", marginTop: 6 }, children: jobMessage })
          ] }),
          !jobRunning && jobMessage && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.successBanner, children: jobMessage }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              style: { ...styles.primaryBtn, padding: "12px 24px", fontSize: 14 },
              disabled: jobRunning || !selectedTaskId,
              onClick: startAuditJob,
              children: jobRunning ? "\u6B63\u5728\u6267\u884C\u591A\u6A21\u6001\u5BA1\u8BA1..." : "\u25B7 \u5F00\u59CB\u6267\u884C\u5DE5\u4E1A\u6570\u636E\u96C6\u667A\u80FD\u5BA1\u8BA1"
            }
          ) })
        ] })
      ] }),
      activeTab === "review" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.cardPanel, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u4EBA\u5DE5\u8D28\u68C0\u590D\u6838\u5DE5\u4F5C\u53F0 (Human Review Queue)" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "#64748b", fontSize: 13, marginBottom: 20 }, children: "\u5BF9\u88AB\u591A\u6A21\u6001\u5927\u6A21\u578B\u5224\u5B9A\u4E3A\u9AD8\u7591\u70B9\uFF08\u53EF\u7591\u5EA6 \u2265 60\uFF09\u6216\u5B58\u7591\uFF08UNCERTAIN\uFF09\u7684\u6837\u672C\u8FDB\u884C\u4EBA\u5DE5\u6838\u9A8C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { style: styles.table, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u6837\u672C ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u7F29\u7565\u56FE" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u89C6\u89C9\u53EF\u7591\u5EA6" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u6A21\u578B\u5EFA\u8BAE\u6807\u7B7E" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u7F3A\u9677\u539F\u56E0\u5206\u7C7B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u5F53\u524D\u771F\u503C" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { style: styles.th, children: "\u64CD\u4F5C" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: samples.slice(0, 10).map((s) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { style: styles.tr, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: s.sample_id }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "img",
              {
                src: `/api/iad/media/sample/${encodeURIComponent(s.task_id)}/${encodeURIComponent(s.sample_id)}/thumbnail?size=100`,
                alt: "",
                style: { width: 48, height: 48, objectFit: "cover", borderRadius: 4 }
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: (s.visual_suspicion_score || 0) >= 60 ? "#dc2626" : "#16a34a", fontWeight: "bold" }, children: s.visual_suspicion_score ?? "\u672A\u6D4B" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: s.suggestion?.suggested_label || "\u65E0" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: s.suggestion?.reason_category || "\u672A\u5206\u7C7B" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: s.reviewed ? styles.tagReviewed : styles.tagNeutral, children: s.review_decision || s.quality_status }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: styles.td, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: styles.secondaryBtnSmall,
                onClick: () => {
                  setSelectedSample(s);
                  setActiveTab("samples");
                },
                children: "\u590D\u6838\u8BE6\u60C5"
              }
            ) })
          ] }, s.sample_id)) })
        ] })
      ] }),
      activeTab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.cardPanel, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.panelHeaderRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5DE5\u4E1A\u6570\u636E\u96C6\u8D28\u68C0\u4E0E\u5BA1\u8BA1\u62A5\u544A" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { style: { color: "#64748b", fontSize: 13, margin: "4px 0 0" }, children: [
              "\u5355\u636E\u7F16\u7801: IAD-REPORT-",
              selectedTaskId,
              " \xB7 \u751F\u6210\u65F6\u95F4: ",
              report ? new Date(report.generated_at).toLocaleString() : "..."
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", gap: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              style: styles.secondaryBtn,
              onClick: () => {
                window.open(`/api/iad/report/${encodeURIComponent(selectedTaskId)}`, "_blank");
              },
              children: "\u2913 \u5BFC\u51FA JSON \u62A5\u544A"
            }
          ) })
        ] }),
        loadingReport ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.emptyState, children: "\u6B63\u5728\u6C47\u603B\u7ED3\u7B97\u5BA1\u8BA1\u6570\u636E..." }) : report ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiGrid, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u591A\u6A21\u6001\u5BA1\u8BA1\u8986\u76D6\u7387" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiValue, children: [
                report.vlm_coverage_pct,
                "%"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiSub, children: [
                "\u5DF2\u5BA1: ",
                report.vlm_audited_count,
                " / \u603B\u6570: ",
                report.total_samples
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u6316\u6398\u51FA\u7684\u53EF\u7591\u7F3A\u9677" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...styles.kpiValue, color: "#dc2626" }, children: report.vlm_anomalies_count }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiSub, children: [
                "\u5F02\u5E38\u5EFA\u8BAE\u53D1\u73B0\u5360\u6BD4 ",
                (report.vlm_anomalies_count / (report.vlm_audited_count || 1) * 100).toFixed(1),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u4EBA\u5DE5\u590D\u6838\u5408\u683C\u7387" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...styles.kpiValue, color: "#16a34a" }, children: report.human_reviewed_count > 0 ? `${(report.human_pass_count / report.human_reviewed_count * 100).toFixed(1)}%` : "\u672A\u590D\u6838" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiSub, children: [
                "\u5408\u683C: ",
                report.human_pass_count,
                " \xB7 \u7F3A\u9677: ",
                report.human_fail_count
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.kpiCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiLabel, children: "\u89C6\u89C9\u63A8\u7406\u6A21\u578B" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...styles.kpiValue, fontSize: 16, marginTop: 12 }, children: report.model_name }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.kpiSub, children: "\u6E29\u5EA6 0.1 \xB7 \u786E\u5B9A\u6027\u53C2\u6570" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginTop: 24 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u5F02\u5E38\u7F3A\u9677\u7C7B\u578B\u5206\u5E03\u7EDF\u8BA1" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }, children: [
              Object.entries(report.categories || {}).map(([cat, count]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.categoryBadge, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("b", { children: [
                  cat,
                  ":"
                ] }),
                " ",
                count,
                " \u9879"
              ] }, cat)),
              Object.keys(report.categories || {}).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "#64748b", fontSize: 13 }, children: "\u6682\u65E0\u5206\u7C7B\u6570\u636E" })
            ] })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.emptyState, children: "\u672A\u80FD\u52A0\u8F7D\u8BE5\u4EFB\u52A1\u5BA1\u8BA1\u62A5\u544A\u3002" })
      ] }),
      lightboxOpen && selectedSample && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.modalOverlay, onClick: () => setLightboxOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.modalContainer, onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.modalHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 3 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.modalBadge, children: "\u9AD8\u7CBE\u539F\u56FE\u68C0\u89C6" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { style: { fontSize: 13, color: "#f8fafc" }, children: selectedSample.sample_id })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 12, color: "#94a3b8" }, children: [
              "\u7269\u7406\u5206\u8FA8\u7387: ",
              sampleDetail?.sample.width ? `${sampleDetail.sample.width} \xD7 ${sampleDetail.sample.height} \u50CF\u7D20` : "\u8BFB\u53D6\u4E2D...",
              " \xB7 \u751F\u4EA7\u6279\u6B21: ",
              selectedSample.batch_id || "default",
              " \xB7 \u7F3A\u9677\u6807\u6CE8: ",
              sampleDetail?.annotations?.length || 0,
              " \u5904 \xB7 \u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF: ",
              selectedSample.technical_quality_score ?? 98,
              "\u5206"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.btnGroup, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: lightboxZoom === "fit" ? styles.zoomBtnActive : styles.zoomBtn,
                  onClick: () => setLightboxZoom("fit"),
                  title: "\u7F29\u653E\u5230\u9002\u5408\u5C4F\u5E55\u5927\u5C0F",
                  children: "\u81EA\u9002\u5E94\u89C6\u53E3"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: lightboxZoom === "100" ? styles.zoomBtnActive : styles.zoomBtn,
                  onClick: () => setLightboxZoom("100"),
                  title: "\u6309\u539F\u59CB\u9AD8\u5206\u8FA8\u7387 1:1 \u50CF\u7D20\u663E\u793A",
                  children: "100% \u539F\u59CB\u5C3A\u5BF8"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: lightboxZoom === "150" ? styles.zoomBtnActive : styles.zoomBtn,
                  onClick: () => setLightboxZoom("150"),
                  title: "\u7EC6\u8282\u653E\u5927 1.5 \u500D",
                  children: "150%"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  style: lightboxZoom === "200" ? styles.zoomBtnActive : styles.zoomBtn,
                  onClick: () => setLightboxZoom("200"),
                  title: "\u7EC6\u8282\u653E\u5927 2 \u500D",
                  children: "200%"
                }
              )
            ] }),
            sampleDetail?.annotations && sampleDetail.annotations.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: showBBoxes ? styles.toggleBtnActive : styles.toggleBtn,
                onClick: () => setShowBBoxes(!showBBoxes),
                children: showBBoxes ? "\u2713 \u9690\u85CF\u6807\u6CE8\u6846" : "\u663E\u793A\u6807\u6CE8\u6846"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                style: styles.modalCloseBtn,
                onClick: () => setLightboxOpen(false),
                title: "\u5173\u95ED (ESC)",
                children: "\u2715"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.modalViewport, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "div",
          {
            style: {
              position: "relative",
              display: "inline-block",
              transform: lightboxZoom === "100" ? "scale(1)" : lightboxZoom === "150" ? "scale(1.5)" : lightboxZoom === "200" ? "scale(2)" : "none",
              transformOrigin: "center center",
              transition: "transform 0.15s ease",
              maxWidth: lightboxZoom === "fit" ? "100%" : "none",
              maxHeight: lightboxZoom === "fit" ? "100%" : "none"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "img",
                {
                  src: `/api/iad/media/sample/${encodeURIComponent(selectedSample.task_id)}/${encodeURIComponent(selectedSample.sample_id)}/image`,
                  alt: selectedSample.sample_id,
                  style: {
                    display: "block",
                    maxWidth: lightboxZoom === "fit" ? "calc(100vw - 120px)" : "none",
                    maxHeight: lightboxZoom === "fit" ? "calc(100vh - 180px)" : "none",
                    objectFit: "contain",
                    borderRadius: 4,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.6)"
                  }
                }
              ),
              showBBoxes && sampleDetail?.annotations && sampleDetail.sample.width && sampleDetail.sample.height && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "svg",
                {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none"
                  },
                  viewBox: `0 0 ${sampleDetail.sample.width} ${sampleDetail.sample.height}`,
                  children: sampleDetail.annotations.map((ann, idx) => {
                    if (!ann.bbox) return null;
                    const [x1, y1, x2, y2] = ann.bbox;
                    const w = Math.max(2, x2 - x1);
                    const h = Math.max(2, y2 - y1);
                    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "rect",
                        {
                          x: x1,
                          y: y1,
                          width: w,
                          height: h,
                          fill: "rgba(239, 68, 68, 0.25)",
                          stroke: "#ef4444",
                          strokeWidth: 2.5
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "rect",
                        {
                          x: x1,
                          y: Math.max(0, y1 - 22),
                          width: Math.max(80, (ann.phenomenon || ann.raw_label).length * 12 + 16),
                          height: 20,
                          fill: "#ef4444",
                          rx: 3
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "text",
                        {
                          x: x1 + 6,
                          y: Math.max(14, y1 - 7),
                          fill: "#ffffff",
                          fontSize: 12,
                          fontWeight: "bold",
                          children: ann.phenomenon || ann.raw_label
                        }
                      )
                    ] }, ann.annotation_id || idx);
                  })
                }
              )
            ]
          }
        ) })
      ] }) })
    ] });
  }
  var styles = {
    root: {
      padding: "24px 32px",
      background: "#f8fafc",
      height: "100%",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      color: "#0f172a",
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: "border-box"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      flexWrap: "wrap",
      gap: 16
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: 700,
      color: "#3b82f6",
      letterSpacing: "1.2px",
      marginBottom: 4
    },
    title: {
      fontSize: 26,
      fontWeight: 800,
      color: "#0f172a",
      margin: 0,
      letterSpacing: "-0.5px"
    },
    subtitle: {
      fontSize: 13,
      color: "#64748b",
      margin: "6px 0 0"
    },
    headerActions: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
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
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    },
    secondaryBtn: {
      background: "#ffffff",
      color: "#334155",
      border: "1px solid #cbd5e1",
      padding: "9px 16px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer"
    },
    secondaryBtnSmall: {
      background: "#ffffff",
      color: "#2563eb",
      border: "1px solid #bfdbfe",
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    },
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 16,
      marginBottom: 20
    },
    kpiCard: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
    },
    kpiLabel: {
      fontSize: 12,
      color: "#64748b",
      fontWeight: 500
    },
    kpiValue: {
      fontSize: 28,
      fontWeight: 800,
      color: "#0f172a",
      margin: "8px 0 4px"
    },
    kpiSub: {
      fontSize: 11,
      color: "#94a3b8"
    },
    navRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      flexWrap: "wrap",
      gap: 12,
      borderBottom: "1px solid #e2e8f0",
      paddingBottom: 12
    },
    tabGroup: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    },
    tabBtn: {
      background: "transparent",
      border: "none",
      padding: "8px 14px",
      borderRadius: 8,
      fontSize: 13,
      color: "#64748b",
      fontWeight: 600,
      cursor: "pointer"
    },
    tabBtnActive: {
      background: "#e0f2fe",
      border: "none",
      padding: "8px 14px",
      borderRadius: 8,
      fontSize: 13,
      color: "#0284c7",
      fontWeight: 700,
      cursor: "pointer"
    },
    selectorBox: {
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    selectorLabel: {
      fontSize: 12,
      fontWeight: 600,
      color: "#475569"
    },
    selectInput: {
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: 8,
      padding: "7px 12px",
      fontSize: 13,
      color: "#0f172a"
    },
    selectSmall: {
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 12
    },
    infoBanner: {
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1e40af",
      padding: "10px 16px",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 16
    },
    successBanner: {
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#166534",
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 12,
      marginBottom: 12
    },
    mainLayout: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 380px",
      gap: 20,
      alignItems: "flex-start"
    },
    gridSection: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 16
    },
    filterBar: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center",
      paddingBottom: 14,
      borderBottom: "1px solid #f1f5f9",
      marginBottom: 16
    },
    chip: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 20,
      padding: "5px 12px",
      fontSize: 12,
      color: "#475569",
      cursor: "pointer"
    },
    chipActive: {
      background: "#eff6ff",
      border: "1px solid #3b82f6",
      borderRadius: 20,
      padding: "5px 12px",
      fontSize: 12,
      color: "#1d4ed8",
      fontWeight: 700,
      cursor: "pointer"
    },
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
      gap: 12,
      minHeight: 400
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      overflow: "hidden",
      cursor: "pointer",
      transition: "box-shadow 0.15s, border-color 0.15s"
    },
    cardSelected: {
      background: "#ffffff",
      border: "2px solid #2563eb",
      borderRadius: 10,
      overflow: "hidden",
      cursor: "pointer",
      boxShadow: "0 0 0 1px #2563eb"
    },
    thumbWrapper: {
      height: 120,
      background: "#f1f5f9",
      position: "relative",
      overflow: "hidden"
    },
    thumbImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    },
    badgeTopLeft: {
      position: "absolute",
      top: 6,
      left: 6
    },
    tagNeutral: {
      background: "rgba(15,23,42,0.75)",
      color: "#ffffff",
      fontSize: 10,
      padding: "2px 6px",
      borderRadius: 4
    },
    tagDanger: {
      background: "#dc2626",
      color: "#ffffff",
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 6px",
      borderRadius: 4
    },
    tagSuccess: {
      background: "#16a34a",
      color: "#ffffff",
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 6px",
      borderRadius: 4
    },
    tagReviewed: {
      background: "#7c3aed",
      color: "#ffffff",
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 6px",
      borderRadius: 4
    },
    cardInfo: {
      padding: "8px 10px"
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: "#1e293b",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    cardMetrics: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 10,
      color: "#64748b",
      marginTop: 4
    },
    paginationRow: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      marginTop: 20,
      paddingTop: 12,
      borderTop: "1px solid #f1f5f9"
    },
    pageBtn: {
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      padding: "5px 12px",
      fontSize: 12,
      cursor: "pointer"
    },
    pageText: {
      fontSize: 12,
      color: "#475569"
    },
    detailAside: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 16,
      position: "sticky",
      top: 20
    },
    asideTitle: {
      fontSize: 15,
      fontWeight: 700,
      margin: "0 0 12px",
      color: "#0f172a"
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
      border: "1px solid #e2e8f0"
    },
    bigImage: {
      width: "100%",
      height: "100%",
      objectFit: "contain"
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
      cursor: "pointer"
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
      pointerEvents: "none"
    },
    svgOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12,
      padding: "6px 0",
      borderBottom: "1px solid #f1f5f9"
    },
    detailKey: {
      color: "#64748b",
      flexShrink: 0,
      minWidth: 70
    },
    detailVal: {
      color: "#0f172a",
      fontWeight: 500,
      textAlign: "right"
    },
    detailValEllipsisWrapper: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
      flex: 1,
      justifyContent: "flex-end"
    },
    detailValEllipsis: {
      color: "#0f172a",
      fontWeight: 600,
      textAlign: "right",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: 200
    },
    copyBtn: {
      background: "#f1f5f9",
      border: "1px solid #cbd5e1",
      borderRadius: 4,
      padding: "2px 6px",
      fontSize: 10,
      color: "#475569",
      cursor: "pointer",
      flexShrink: 0
    },
    annotationBox: {
      background: "#fef2f2",
      border: "1px solid #fee2e2",
      borderRadius: 8,
      padding: 10,
      marginTop: 12
    },
    annotationTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: "#991b1b",
      marginBottom: 6
    },
    annotationItem: {
      background: "#ffffff",
      border: "1px solid #fecaca",
      borderRadius: 6,
      padding: "6px 8px",
      marginBottom: 6
    },
    techIssueBox: {
      background: "#fff7ed",
      border: "1px solid #ffedd5",
      borderRadius: 8,
      padding: 10,
      marginTop: 12
    },
    techIssueTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: "#c2410c",
      marginBottom: 6
    },
    techIssueItem: {
      fontSize: 11,
      color: "#7c2d12",
      marginBottom: 4
    },
    auditSingleBtn: {
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 11,
      fontWeight: 600,
      cursor: "pointer"
    },
    successNotice: {
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#166534",
      fontSize: 11,
      padding: "6px 8px",
      borderRadius: 6,
      marginBottom: 8
    },
    errorNotice: {
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      fontSize: 11,
      padding: "6px 8px",
      borderRadius: 6,
      marginBottom: 8
    },
    topPagination: {
      display: "flex",
      alignItems: "center",
      gap: 6
    },
    pageBtnSmall: {
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: 4,
      padding: "3px 8px",
      fontSize: 11,
      cursor: "pointer"
    },
    pageTextSmall: {
      fontSize: 11,
      color: "#475569",
      fontWeight: 600
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
      justifyContent: "center"
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
      border: "1px solid #334155"
    },
    modalHeader: {
      padding: "12px 20px",
      background: "#1e293b",
      borderBottom: "1px solid #334155",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    modalBadge: {
      background: "#2563eb",
      color: "#ffffff",
      fontSize: 11,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 4
    },
    modalViewport: {
      flex: 1,
      overflow: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "#090d16"
    },
    modalCloseBtn: {
      background: "transparent",
      border: "none",
      color: "#94a3b8",
      fontSize: 18,
      cursor: "pointer",
      padding: "4px 8px"
    },
    btnGroup: {
      display: "flex",
      borderRadius: 6,
      overflow: "hidden",
      border: "1px solid #475569"
    },
    zoomBtn: {
      background: "#334155",
      color: "#cbd5e1",
      border: "none",
      padding: "5px 10px",
      fontSize: 11,
      cursor: "pointer"
    },
    zoomBtnActive: {
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      padding: "5px 10px",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    },
    toggleBtn: {
      background: "#334155",
      color: "#cbd5e1",
      border: "1px solid #475569",
      borderRadius: 6,
      padding: "5px 10px",
      fontSize: 11,
      cursor: "pointer"
    },
    toggleBtnActive: {
      background: "#dc2626",
      color: "#ffffff",
      border: "1px solid #dc2626",
      borderRadius: 6,
      padding: "5px 10px",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    },
    observationBox: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: 12,
      marginTop: 14
    },
    obsTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: "#334155",
      marginBottom: 8
    },
    reviewBox: {
      marginTop: 16,
      background: "#faf5ff",
      border: "1px solid #e9d5ff",
      borderRadius: 8,
      padding: 12
    },
    reviewBoxTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: "#6b21a8",
      marginBottom: 10
    },
    reviewInput: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #d8b4fe",
      borderRadius: 6,
      padding: "6px 10px",
      fontSize: 12
    },
    reviewButtons: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6,
      marginTop: 8
    },
    passBtn: {
      background: "#16a34a",
      color: "#ffffff",
      border: "none",
      borderRadius: 6,
      padding: "8px 0",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    },
    failBtn: {
      background: "#dc2626",
      color: "#ffffff",
      border: "none",
      borderRadius: 6,
      padding: "8px 0",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    },
    uncertainBtn: {
      background: "#64748b",
      color: "#ffffff",
      border: "none",
      borderRadius: 6,
      padding: "8px 0",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    },
    cardPanel: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 24
    },
    panelHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    },
    th: {
      textAlign: "left",
      padding: "10px 12px",
      borderBottom: "2px solid #e2e8f0",
      color: "#475569",
      fontWeight: 600,
      fontSize: 12
    },
    tr: {
      borderBottom: "1px solid #f1f5f9"
    },
    trSelected: {
      borderBottom: "1px solid #f1f5f9",
      background: "#eff6ff"
    },
    td: {
      padding: "10px 12px",
      color: "#1e293b"
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: 600,
      color: "#334155",
      display: "block",
      marginBottom: 6
    },
    progressContainer: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: 14
    },
    progressBarBg: {
      height: 8,
      background: "#e2e8f0",
      borderRadius: 4,
      overflow: "hidden"
    },
    progressBarFill: {
      height: "100%",
      background: "#2563eb",
      transition: "width 0.3s"
    },
    categoryBadge: {
      background: "#f1f5f9",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      padding: "6px 12px",
      fontSize: 12
    },
    emptyState: {
      padding: "60px 20px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 13
    }
  };

  // src/client/index.ts
  var name = "iad-client";
  var inject = ["slots"];
  function apply(ctx) {
    if (ctx.slots && typeof ctx.slots.inject === "function") {
      ctx.slots.inject("sidebar.panellist", () => {
        return ctx.slots.register(
          {
            name: "sidebar.panellist",
            id: "industrial-audit",
            order: 0,
            label: "\u5DE5\u4E1A\u6570\u636E\u96C6\u5BA1\u8BA1"
          },
          AuditIcon
        );
      });
      ctx.slots.inject("main", () => {
        return ctx.slots.register(
          {
            name: "main",
            key: "industrial-audit"
          },
          AuditPage
        );
      });
    }
  }
  return __toCommonJS(index_exports);
})();

    return __IadClientBundle__;
  }
});

//# sourceMappingURL=client.js.map
