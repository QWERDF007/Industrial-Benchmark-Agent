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
  function ReviewIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 4H5v17h14V4h-4M9 2h6v5H9zM8 14l3 3 5-6" }) });
  }
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

  // src/client/WorkbenchPage.tsx
  var import_react6 = __require("react");

  // src/client/api.ts
  async function request(path, body, method, signal) {
    const response = await fetch("/api/iad" + path, {
      method: method || (body === void 0 ? "GET" : "POST"),
      headers: body === void 0 ? void 0 : { "Content-Type": "application/json" },
      body: body === void 0 ? void 0 : JSON.stringify(body),
      signal
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `\u8BF7\u6C42\u5931\u8D25 (${response.status})`);
    return data;
  }
  var initialFilters = { annotation_filters: [], model_status: "all", review_status: "all", technical: "all", search: "", sort_by: "default" };
  var mediaUrl = (sample, thumbnail = false) => `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${thumbnail ? "thumbnail?size=240" : "image"}`;
  var message = (error) => error instanceof Error ? error.message : String(error);
  var auditPhases = { PREPARING_KNOWLEDGE: "\u51C6\u5907\u51BB\u7ED3\u77E5\u8BC6", GLOBAL: "\u5168\u56FE\u89C2\u5BDF", REGIONS: "ROI \u7EC6\u770B", SYNTHESIS: "\u5168\u56FE\u4E0E ROI \u8054\u5408\u5206\u6790", SAMPLE_COMPLETED: "\u56FE\u50CF\u5BA1\u8BA1\u5B8C\u6210" };

  // src/client/components/DatasetManager.tsx
  var import_react = __require("react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function DirectoryPicker({ label, value, onChange }) {
    const [listing, setListing] = (0, import_react.useState)(null);
    const [error, setError] = (0, import_react.useState)("");
    async function browse(path) {
      try {
        setListing(await request(`/directories?path=${encodeURIComponent(path || "/data1")}`));
        setError("");
      } catch (e) {
        setError(message(e));
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { "aria-label": label, value, onChange: (e) => onChange(e.target.value), placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => browse(value), children: "\u6D4F\u89C8" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      listing && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-directory", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: listing.path }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => browse(listing.parent), children: "\u4E0A\u7EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => {
            onChange(listing.path);
            setListing(null);
          }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => setListing(null), children: "\u5173\u95ED" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "iad-directory-list", children: listing.directories.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", onClick: () => browse(dir.path), children: [
          "\u{1F4C1} ",
          dir.name
        ] }, dir.path)) })
      ] })
    ] });
  }
  function DatasetManager({ datasets, selected, onChanged }) {
    const [name2, setName] = (0, import_react.useState)("");
    const [imageDir, setImageDir] = (0, import_react.useState)("");
    const [annotationDir, setAnnotationDir] = (0, import_react.useState)("");
    const [busy, setBusy] = (0, import_react.useState)(false);
    const [error, setError] = (0, import_react.useState)("");
    const [rename, setRename] = (0, import_react.useState)("");
    async function importDataset(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      try {
        const dataset = await request("/datasets/import", { name: name2, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
        onChanged(dataset.dataset_id);
        setName("");
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    async function updateName() {
      if (!selected) return;
      setError("");
      try {
        await request(`/datasets/${selected.dataset_id}`, { name: rename }, "PATCH");
        onChanged();
        setRename("");
      } catch (e) {
        setError(message(e));
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { onSubmit: importDataset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5BFC\u5165 Labelme \u6570\u636E\u96C6" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: "dataset-name", value: name2, onChange: (e) => setName(e.target.value), maxLength: 120, required: true })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "iad-muted", children: "\u6807\u6CE8\u76EE\u5F55\u6309\u56FE\u50CF\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\u3002\u521D\u59CB\u4ECE\u65E0\u6807\u6CE8\u56FE\u9009\u53D6\u826F\u54C1\u53C2\u8003\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "iad-primary", disabled: busy || !name2.trim() || !imageDir || !annotationDir, children: busy ? "\u6B63\u5728\u626B\u63CF\u5BFC\u5165\u2026" : "\u5BFC\u5165\u6570\u636E\u96C6" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { children: [
          "\u6570\u636E\u96C6\u7BA1\u7406 \xB7 ",
          datasets.length
        ] }),
        selected ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("dl", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u540D\u79F0" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: selected.name }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u6570\u636E\u96C6 ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: selected.dataset_id }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u56FE\u50CF\u76EE\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: selected.image_dir }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u6807\u6CE8\u76EE\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: selected.annotation_dir || "\u7531\u539F\u5BFC\u5165\u914D\u7F6E\u5B9A\u4F4D" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { "aria-label": "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", placeholder: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", value: rename, onChange: (e) => setRename(e.target.value) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { disabled: !rename.trim(), onClick: updateName, children: "\u4FDD\u5B58\u540D\u79F0" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "iad-row iad-rule", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: selected.unannotated_is_normal, onChange: async (e) => {
              try {
                await request(`/datasets/${selected.dataset_id}`, { unannotated_is_normal: e.target.checked }, "PATCH");
                onChanged();
              } catch (err) {
                setError(message(err));
              }
            } }),
            "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u53C2\u8003"
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u8BF7\u5BFC\u5165\u6570\u636E\u96C6\u3002" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "alert", className: "iad-error", children: error })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading }) {
    const select = (key, label, options) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "iad-filter", children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { "aria-label": label, value: filters[key], onChange: (e) => onFilters({ ...filters, [key]: e.target.value }), children: options.map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value, children: title }, value)) })
    ] });
    const pagination = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-pagination", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        total,
        " \u5F20"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: page <= 1, onClick: () => onPage(page - 1), children: "\u4E0A\u4E00\u9875" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        page,
        " / ",
        Math.max(1, Math.ceil(total / 24))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: page * 24 >= total, onClick: () => onPage(page + 1), children: "\u4E0B\u4E00\u9875" })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "iad-gallery", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "iad-multiselect", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { "aria-label": "\u6807\u6CE8\u7B5B\u9009", children: [
            "\u6807\u6CE8 \xB7 ",
            filters.annotation_filters.length ? `\u5DF2\u9009 ${filters.annotation_filters.length} \u9879` : "\u5168\u90E8"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-multiselect-menu", children: [
            [["none", "\u65E0\u6807\u6CE8"], ["present", "\u6709\u6807\u6CE8"], ...dataset.annotation_categories.map((value) => [`category:${value}`, `\u7C7B\u522B ${value}`])].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", "aria-label": title, checked: filters.annotation_filters.includes(value), onChange: (e) => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        select("model_status", "\u6A21\u578B\u5BA1\u8BA1", [["all", "\u5168\u90E8"], ["pending", "\u5F85\u5BA1\u8BA1"], ["audited", "\u5DF2\u5BA1\u8BA1"], ["risk", "\u53EF\u7591"], ["PASS", "\u6A21\u578B\u5EFA\u8BAE\u826F\u54C1"], ["FAIL", "\u6A21\u578B\u5EFA\u8BAE\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"]]),
        select("review_status", "\u4EBA\u5DE5\u590D\u6838", [["all", "\u5168\u90E8"], ["pending", "\u5F85\u590D\u6838"], ["reviewed", "\u5DF2\u590D\u6838"], ["PASS", "\u826F\u54C1"], ["HARD_NORMAL", "\u56F0\u96BE\u6B63\u5E38"], ["FAIL", "\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"], ["SKIP", "\u5DF2\u8DF3\u8FC7"]]),
        select("technical", "\u6280\u672F\u8D28\u91CF", [["all", "\u5168\u90E8"], ["issues", "\u5B58\u5728\u95EE\u9898"]]),
        select("sort_by", "\u6392\u5E8F", [["default", "\u9ED8\u8BA4"], ["risk", "\u53EF\u7591\u5EA6\u4F18\u5148"], ["tech", "\u6280\u672F\u95EE\u9898\u4F18\u5148"]]),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6309\u6587\u4EF6\u540D\u641C\u7D22", value: filters.search, onChange: (e) => onFilters({ ...filters, search: e.target.value }) })
      ] }),
      pagination,
      loading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "iad-grid", children: items.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { className: `iad-sample ${selected === sample.sample_id ? "is-selected" : ""}`, onClick: () => onSelect(sample.sample_id), children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-thumb", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("img", { loading: "lazy", src: mediaUrl(sample, true), alt: sample.relative_path }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `iad-badge ${sample.suggestion?.suggested_label === "FAIL" ? "is-risk" : ""}`, children: sample.review_decision ? `\u4EBA\u5BA1 ${sample.review_decision}` : sample.suggestion ? `\u6A21\u578B ${sample.suggestion.suggested_label}` : "\u5F85\u6A21\u578B\u5BA1\u8BA1" }),
          dataset.reference_sample_ids.includes(sample.sample_id) && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "iad-reference", children: "\u826F\u54C1\u53C2\u8003" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { title: sample.relative_path, children: sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "iad-muted", children: sample.annotation_count ? sample.annotation_categories.join("\u3001") : "\u65E0\u6807\u6CE8" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "iad-muted", children: [
          "\u53EF\u7591\u5EA6 ",
          sample.visual_suspicion_score ?? "\u672A\u6D4B",
          " \xB7 \u6280\u672F ",
          sample.technical_quality_score
        ] })
      ] }, sample.sample_id)) }),
      !loading && !items.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6837\u672C\u3002" }),
      pagination
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_react3 = __require("react");

  // src/client/components/ImageViewer.tsx
  var import_react2 = __require("react");
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function AnnotatedImage({ image, visible = true }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-image-frame", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("img", { src: image.src, alt: image.title, draggable: false }),
      visible && image.annotations && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { className: "iad-annotation-layer", viewBox: `0 0 ${image.width} ${image.height}`, preserveAspectRatio: "none", children: image.annotations.filter((a) => a.geometry_status !== "INVALID").map((a) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("g", { children: [
        a.polygon ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polygon", { points: a.polygon.map((p) => p.join(",")).join(" ") }) : a.bbox && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: a.bbox[0], y: a.bbox[1], width: a.bbox[2] - a.bbox[0], height: a.bbox[3] - a.bbox[1] }),
        a.bbox && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("text", { x: a.bbox[0], y: Math.max(12, a.bbox[1] - 4), children: a.raw_label })
      ] }, a.annotation_id)) })
    ] });
  }
  function ImageViewer({ image, onClose }) {
    const viewport = (0, import_react2.useRef)(null);
    const [size, setSize] = (0, import_react2.useState)({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = (0, import_react2.useState)({ width: 0, height: 0 });
    const [view, setView] = (0, import_react2.useState)({ scale: 0, x: 0, y: 0 });
    const [visible, setVisible] = (0, import_react2.useState)(true);
    const drag = (0, import_react2.useRef)(null);
    const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
    const scale = view.scale || fit;
    (0, import_react2.useLayoutEffect)(() => {
      const element = viewport.current;
      const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    (0, import_react2.useEffect)(() => {
      const source = new Image();
      source.onload = () => setSize({ width: source.naturalWidth, height: source.naturalHeight });
      source.src = image.src;
      const key = (event) => {
        if (event.key === "Escape") onClose();
      };
      window.addEventListener("keydown", key);
      return () => {
        source.onload = null;
        window.removeEventListener("keydown", key);
      };
    }, [image.src, onClose]);
    (0, import_react2.useEffect)(() => {
      const element = viewport.current;
      const wheel = (event) => {
        event.preventDefault();
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
        setView((previous) => {
          const oldScale = previous.scale || fit;
          const next = Math.max(0.02, Math.min(16, oldScale * Math.exp(-event.deltaY * 15e-4)));
          return { scale: next, x: x - (x - previous.x) * next / oldScale, y: y - (y - previous.y) * next / oldScale };
        });
      };
      element.addEventListener("wheel", wheel, { passive: false });
      return () => element.removeEventListener("wheel", wheel);
    }, [fit]);
    const fixed = [0, 1, 1.5, 2].includes(view.scale);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-lightbox", role: "dialog", "aria-modal": "true", "aria-label": "\u539F\u56FE\u68C0\u89C6\u5668", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-lightbox-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: image.title }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: (e) => setView({ scale: Number(e.target.value), x: 0, y: 0 }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: 1, children: "100%" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: 1.5, children: "150%" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: 2, children: "200%" }),
          !fixed && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("option", { value: "custom", children: [
            Math.round(scale * 100),
            "%"
          ] })
        ] }),
        image.annotations && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "iad-eye", title: visible ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-label": visible ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-pressed": visible, onClick: () => setVisible((v) => !v), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
          !visible && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m3 3 18 18" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: onClose, children: "\u5173\u95ED" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "div",
        {
          className: "iad-viewer-viewport",
          ref: viewport,
          onPointerDown: (event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y };
          },
          onPointerMove: (event) => {
            const start = drag.current;
            if (start) {
              const x = start.panX + event.clientX - start.x, y = start.panY + event.clientY - start.y;
              setView((previous) => ({ ...previous, x, y }));
            }
          },
          onPointerUp: () => {
            drag.current = null;
          },
          onPointerCancel: () => {
            drag.current = null;
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "iad-viewer-world", "data-scale": scale, style: { width: size.width, height: size.height, transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AnnotatedImage, { image: { ...image, ...size }, visible }) })
        }
      )
    ] });
  }

  // src/client/components/DatasetKnowledge.tsx
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  var statuses = { supported: "\u6709\u8BC1\u636E\u652F\u6301", provisional: "\u5F85\u9A8C\u8BC1", conflicted: "\u5B58\u5728\u77DB\u76FE" };
  function DatasetKnowledge({ knowledge }) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-profile", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: knowledge.kind === "normal" ? "\u826F\u54C1\u77E5\u8BC6" : "\u4E0D\u826F\u77E5\u8BC6" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: knowledge.summary }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("small", { className: "iad-muted", children: [
        knowledge.version_id,
        " \xB7 ",
        knowledge.sources.length,
        " \u5F20\u6765\u6E90 \xB7 ",
        knowledge.checks.length,
        " \u9879\u5224\u636E"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: "\u68C0\u67E5\u5224\u636E" }),
        knowledge.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("strong", { children: [
            check.title,
            " \xB7 ",
            statuses[check.status]
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: check.criterion }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("small", { className: "iad-muted", children: [
            check.subject,
            " \xB7 ",
            check.location
          ] }),
          !!check.allowed_variations.length && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
            "\u5141\u8BB8\u53D8\u5316\uFF1A",
            check.allowed_variations.join("\uFF1B")
          ] }),
          !!check.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
        ] }, check.check_id))
      ] })
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_jsx_runtime6 = __require("react/jsx-runtime");
  function SampleInspector({ dataset, sampleId, mode, revision, onChanged, jobs, onJobsChanged }) {
    const [detail, setDetail] = (0, import_react3.useState)(null);
    const [error, setError] = (0, import_react3.useState)("");
    const [notice, setNotice] = (0, import_react3.useState)("");
    const [busy, setBusy] = (0, import_react3.useState)(false);
    const job = jobs.find((job2) => job2.sample_ids.includes(sampleId));
    const jobRunning = jobs.some((job2) => job2.status === "RUNNING" || job2.status === "PENDING");
    const [reviewer, setReviewer] = (0, import_react3.useState)(localStorage.getItem("iad.reviewer") || "auditor_qc");
    const [comment, setComment] = (0, import_react3.useState)("");
    const [lightbox, setLightbox] = (0, import_react3.useState)(null);
    const activeId = (0, import_react3.useRef)(sampleId);
    const openedAt = (0, import_react3.useRef)(Date.now());
    (0, import_react3.useEffect)(() => {
      activeId.current = sampleId;
      setDetail(null);
      setError("");
      setNotice("");
      setComment("");
      setLightbox(null);
      openedAt.current = Date.now();
    }, [sampleId]);
    (0, import_react3.useEffect)(() => {
      if (!sampleId) return;
      const controller = new AbortController();
      request(`/sample/${encodeURIComponent(sampleId)}`, void 0, void 0, controller.signal).then(setDetail).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
      return () => controller.abort();
    }, [sampleId, revision]);
    async function audit() {
      setBusy(true);
      setError("");
      try {
        await request("/audit/start", { dataset_id: dataset.dataset_id, sample_ids: [sampleId] });
        onJobsChanged();
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    async function setReference() {
      setError("");
      const ids = dataset.reference_sample_ids.includes(sampleId) ? dataset.reference_sample_ids.filter((id) => id !== sampleId) : [...dataset.reference_sample_ids, sampleId];
      try {
        await request(`/datasets/${dataset.dataset_id}`, { reference_sample_ids: ids }, "PATCH");
        onChanged();
      } catch (e) {
        setError(message(e));
      }
    }
    async function submit(decision) {
      if (!reviewer.trim()) {
        setError("\u8BF7\u586B\u5199\u590D\u6838\u4EBA");
        return;
      }
      const id = sampleId;
      setBusy(true);
      setError("");
      try {
        localStorage.setItem("iad.reviewer", reviewer.trim());
        const session = await request("/review/session", { task_id: dataset.task_id, dataset_id: dataset.dataset_id, reviewer: reviewer.trim() });
        await request("/review/submit", { session_id: session.session_id, sample_id: id, decision, comment, duration_ms: Date.now() - openedAt.current });
        await request("/review/finish", { session_id: session.session_id });
        if (activeId.current === id) {
          onChanged();
          setNotice(`\u5DF2\u63D0\u4EA4 ${decision}`);
        }
      } catch (e) {
        if (activeId.current === id) setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    const evidenceSource = (image2) => ({
      src: `/api/iad/evidence/${encodeURIComponent(detail.suggestion.suggestion_id)}/${image2.evidence_id}`,
      title: image2.role === "overview" ? "\u9001\u6A21\u5168\u56FE\u6982\u89C8" : `${image2.representation === "annotation_mask" ? "\u6807\u6CE8\u5B9A\u4F4D\u56FE" : "ROI"} \xB7 ${image2.crop_bbox.join(", ")}`,
      width: image2.sent_size[0],
      height: image2.sent_size[1]
    });
    const image = detail ? { src: mediaUrl(detail.sample), title: detail.sample.relative_path.split("/").pop(), width: detail.sample.width, height: detail.sample.height, annotations: detail.annotations } : null;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("aside", { className: "iad-inspector", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: mode === "review" ? "\u590D\u6838\u660E\u7EC6" : "\u6837\u672C\u4FE1\u606F" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "status", children: notice }),
      !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AnnotatedImage, { image }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("dl", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dd", { title: detail.sample.image_path, children: detail.sample.image_path }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: "\u56FE\u50CF\u540D" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: "UUID" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dd", { "data-field": "sample-uuid", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: "\u539F\u59CB\u8D28\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dd", { children: detail.sample.quality_status }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: "\u5206\u8FA8\u7387" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("dd", { children: [
            detail.sample.width,
            " \xD7 ",
            detail.sample.height
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dd", { children: detail.technical_quality_score })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("h3", { children: [
            "Labelme \u6807\u6CE8 \xB7 ",
            detail.annotations.length
          ] }),
          detail.annotations.length ? detail.annotations.map((a) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "iad-annotation", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: a.raw_label }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
              a.bbox?.join(", "),
              " \xB7 ",
              a.geometry_status
            ] })
          ] }, a.annotation_id)) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }),
          detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: i.message }, index)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
          detail.suggestion ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: detail.suggestion.suggested_label }),
              " \xB7 ",
              detail.suggestion.reason_category,
              " \xB7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ",
              detail.suggestion.confidence === null ? "\u672A\u8BB0\u5F55" : `${Math.round(detail.suggestion.confidence * 100)}%`
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-observation", children: detail.suggestion.notes }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { className: "iad-muted", children: detail.suggestion.model_name }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-muted", children: [
              "\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \xB7 ",
              detail.suggestion.reference_sample_ids.length,
              " \u5F20\u53C2\u8003\u56FE"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "iad-reference-grid", children: detail.normal_knowledge?.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)).map((item) => {
              const src = `/api/iad/knowledge/evidence/${encodeURIComponent(detail.normal_knowledge.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
              return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("img", { alt: "\u672C\u6B21\u5BA1\u8BA1\u7684\u77E5\u8BC6\u6765\u6E90", src }) }, item.image.evidence_id);
            }) }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("details", { className: "iad-analysis", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }),
              detail.normal_knowledge ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }),
              detail.defect_knowledge && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DatasetKnowledge, { knowledge: detail.defect_knowledge }),
              !!detail.suggestion.analysis.knowledge_limitations.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-muted", children: [
                "\u77E5\u8BC6\u9650\u5236\uFF1A",
                detail.suggestion.analysis.knowledge_limitations.join("\uFF1B")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: [
                "\u5C40\u90E8\u8986\u76D6 ",
                detail.suggestion.analysis.coverage.inspected_regions,
                " / ",
                detail.suggestion.analysis.coverage.planned_regions,
                " \xB7 ",
                detail.suggestion.analysis.coverage.complete ? "\u8BA1\u5212\u5DF2\u8986\u76D6" : "\u68C0\u67E5\u672A\u5B8C\u6210"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("img", { src: evidenceSource(detail.suggestion.analysis.overview).src, alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                  "\u5168\u56FE \xB7 ",
                  detail.suggestion.analysis.overview.sent_size.join(" \xD7 "),
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: detail.suggestion.analysis.global_view.description }),
              detail.suggestion.analysis.regions.map((region, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("h3", { children: [
                  "\u5C40\u90E8 \xB7 ",
                  region.origins.map((origin) => origin.label).join(" / ")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("small", { children: [
                  { annotation: "Labelme \u7EBF\u7D22", model: "MLLM \u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" }[region.source],
                  " \xB7 \u539F\u56FE\u5750\u6807 ",
                  region.crop_bbox.join(", ")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("img", { src: evidenceSource(region.image).src, alt: `\u5BA1\u8BA1 ROI ${index + 1}` }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                    region.image.sent_size.join(" \xD7 "),
                    " \xB7 PNG",
                    detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: region.observation.description }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
                  "\u4F4D\u7F6E\uFF1A",
                  region.observation.position_analysis
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
                  "\u5149\u7167\uFF1A",
                  region.observation.illumination_analysis
                ] })
              ] }, index)),
              detail.suggestion.analysis.auxiliary_evidence.map((image2) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image2)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("img", { src: evidenceSource(image2).src, alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                  "\u6807\u6CE8\u5B9A\u4F4D\u56FE",
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(image2.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }, image2.evidence_id)),
              detail.suggestion.analysis.conclusion.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-error", children: [
                "\u89C2\u5BDF\u77DB\u76FE\uFF1A",
                detail.suggestion.analysis.conclusion.conflicts.join("\uFF1B")
              ] }),
              detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-error", children: [
                "\u7F3A\u5931\u8BC1\u636E\uFF1A",
                detail.suggestion.analysis.conclusion.missing_evidence.join("\uFF1B")
              ] }),
              detail.suggestion.analysis.joint_steps.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("details", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("summary", { children: [
                  "\u8054\u5408\u5206\u6790\u8BB0\u5F55 \xB7 ",
                  detail.suggestion.analysis.joint_steps.length,
                  " \u6B65"
                ] }),
                detail.suggestion.analysis.joint_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("strong", { children: [
                    step.step_id,
                    " \xB7 ",
                    step.result.suggested_label
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
                    step.input_evidence_ids.length,
                    " \u5F20\u56FE\u50CF",
                    step.child_step_ids.length ? ` \xB7 \u6C47\u603B ${step.child_step_ids.join("\u3001")}` : ""
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: step.result.description })
                ] }, step.step_id))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-muted", children: [
                "\u7ED3\u8BBA\u5F15\u7528 ",
                detail.suggestion.analysis.conclusion.evidence_ids.length,
                " \u9879\u89C6\u89C9\u8BC1\u636E"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
                "\u4F4D\u7F6E\u5206\u6790\uFF1A",
                detail.suggestion.analysis.conclusion.position_analysis
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
                "\u5149\u7167\u5206\u6790\uFF1A",
                detail.suggestion.analysis.conclusion.illumination_analysis
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })
        ] }),
        mode === "model" && job && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "iad-single-job iad-info-group", "aria-live": "polite", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: job.status }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: auditPhases[job.phase || ""] || job.message }),
          !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
            "ROI ",
            job.inspected_regions || 0,
            " / ",
            job.planned_regions
          ] }),
          !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
            "\u8054\u5408\u5224\u65AD ",
            job.completed_batches || 0,
            " / ",
            job.total_batches
          ] }),
          job.errors.map((error2, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-error", children: error2.message }, index)),
          (job.status === "RUNNING" || job.status === "PENDING") && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: async () => {
            try {
              await request(`/audit/cancel/${job.run_id}`, {});
              onJobsChanged();
            } catch (error2) {
              setError(message(error2));
            }
          }, children: "\u53D6\u6D88\u5BA1\u8BA1" })
        ] }),
        mode === "model" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "iad-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: "iad-primary", disabled: busy || jobRunning, onClick: audit, children: busy || jobRunning ? "\u6B63\u5728\u8054\u5408\u5BA1\u8BA1\u2026" : "\u6309\u77E5\u8BC6\u5BA1\u8BA1\u6B64\u56FE" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { disabled: busy, onClick: setReference, children: dataset.reference_sample_ids.includes(sampleId) ? "\u79FB\u51FA\u826F\u54C1\u53C2\u8003" : "\u8BBE\u4E3A\u826F\u54C1\u53C2\u8003" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "iad-decision", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
          detail.review_decision && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
            "\u5F53\u524D\uFF1A",
            detail.review_decision.decision,
            " \xB7 ",
            detail.review_decision.reviewer,
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("br", {}),
            detail.review_decision.comment
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u4EBA",
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { value: reviewer, onChange: (e) => setReviewer(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u8BF4\u660E",
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("textarea", { value: comment, onChange: (e) => setComment(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "iad-actions", children: [["PASS", "\u826F\u54C1"], ["HARD_NORMAL", "\u56F0\u96BE\u6B63\u5E38"], ["FAIL", "\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"], ["SKIP", "\u8DF3\u8FC7"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: value === "FAIL" ? "iad-danger" : "", disabled: busy, onClick: () => submit(value), children: label }, value)) })
        ] })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_react4 = __require("react");
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  function AuditJobs({ dataset, filters, jobs, onJobsChanged }) {
    const [lightbox, setLightbox] = (0, import_react4.useState)(null);
    const [normal, setNormal] = (0, import_react4.useState)(null);
    const [defect, setDefect] = (0, import_react4.useState)(null);
    const [model, setModel] = (0, import_react4.useState)("Qwen/Qwen3.8-27B-FP8");
    const [busy, setBusy] = (0, import_react4.useState)(false);
    const [error, setError] = (0, import_react4.useState)("");
    (0, import_react4.useEffect)(() => {
      const controller = new AbortController();
      setNormal(null);
      setDefect(null);
      Promise.all(["normal", "defect"].map((kind) => request(`/knowledge?${new URLSearchParams({ dataset_id: dataset.dataset_id, kind })}`, void 0, void 0, controller.signal))).then(([normal2, defect2]) => {
        setNormal(normal2.knowledge);
        setDefect(defect2.knowledge?.normal_version_id === normal2.knowledge?.version_id ? defect2.knowledge : null);
      }).catch((error2) => {
        if (!controller.signal.aborted) setError(message(error2));
      });
      return () => controller.abort();
    }, [dataset.dataset_id, jobs[0]?.normal_version_id]);
    async function start() {
      setBusy(true);
      setError("");
      try {
        await request("/audit/start", {
          dataset_id: dataset.dataset_id,
          model_name: model,
          normal_version_id: normal?.version_id,
          defect_version_id: defect?.version_id,
          filters
        });
        onJobsChanged();
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "iad-job-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "\u51BB\u7ED3\u77E5\u8BC6" }),
        normal ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(DatasetKnowledge, { knowledge: normal }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "iad-reference-grid", children: normal.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw").map((item) => {
            const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
            return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u56FE", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("img", { alt: "\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", src }) }, item.image.evidence_id);
          }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "iad-profile iad-muted", children: "\u8BF7\u5148\u8FD0\u884C\u201C\u6316\u6398\u826F\u54C1\u77E5\u8BC6\u201D\u6280\u80FD\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002" }),
        defect ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(DatasetKnowledge, { knowledge: defect }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { children: [
            "\u6A21\u578B",
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, onChange: (e) => setModel(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "iad-primary", onClick: start, disabled: busy || !normal?.checks.some((check) => check.status === "supported") || jobs.some((j) => j.status === "RUNNING"), children: busy ? "\u542F\u52A8\u4E2D\u2026" : "\u5BA1\u8BA1\u5F53\u524D\u7B5B\u9009\u5168\u90E8\u56FE\u50CF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "iad-muted", children: "\u7ED3\u5408\u51BB\u7ED3\u77E5\u8BC6\u3001\u5168\u56FE\u4E0E\u5168\u90E8\u5C40\u90E8\u56FE\uFF0C\u7EFC\u5408\u5206\u6790\u4F4D\u7F6E\u548C\u5149\u7167\u3002" }),
        error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { role: "alert", className: "iad-error", children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("article", { className: "iad-job", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: job.status }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: job.model_name }),
            (job.status === "RUNNING" || job.status === "PENDING") && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { onClick: async () => {
              try {
                await request(`/audit/cancel/${job.run_id}`, {});
                onJobsChanged();
              } catch (e) {
                setError(message(e));
              }
            }, children: "\u53D6\u6D88" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("progress", { value: job.progress, max: 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
            "\u5B8C\u6210 ",
            job.completed,
            " \xB7 \u5931\u8D25 ",
            job.failed,
            " \xB7 \u5171 ",
            job.total_samples,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "iad-muted", children: auditPhases[job.phase || ""] || job.message }),
          !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "iad-muted", children: [
            "ROI ",
            job.inspected_regions || 0,
            " / ",
            job.planned_regions
          ] }),
          !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "iad-muted", children: [
            "\u8054\u5408\u5224\u65AD ",
            job.completed_batches || 0,
            " / ",
            job.total_batches
          ] }),
          job.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("small", { className: "iad-muted", children: [
            "\u826F\u54C1\u7248\u672C ",
            job.normal_version_id,
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("br", {}),
            job.defect_version_id && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
              "\u4E0D\u826F\u7248\u672C ",
              job.defect_version_id,
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("br", {})
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { className: "iad-muted", children: job.run_id }),
          job.errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("summary", { children: "\u5931\u8D25\u8BE6\u60C5" }),
            job.errors.map((error2, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
              error2.sample_id,
              ": ",
              error2.message
            ] }, i))
          ] })
        ] }, job.run_id)),
        !jobs.length && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }
  function AuditReport({ dataset }) {
    const [report, setReport] = (0, import_react4.useState)(null);
    const [error, setError] = (0, import_react4.useState)("");
    (0, import_react4.useEffect)(() => {
      const controller = new AbortController();
      request(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`, void 0, void 0, controller.signal).then(setReport).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
      return () => controller.abort();
    }, [dataset]);
    function download() {
      const blob = new Blob([JSON.stringify({ dataset_id: dataset.dataset_id, name: dataset.name, ...report }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${dataset.name}-report.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      report && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dt", { children: "\u6A21\u578B\u8986\u76D6" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("dd", { children: [
            report.vlm_audited_count,
            " / ",
            report.total_samples,
            " (",
            report.vlm_coverage_pct,
            "%)"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dt", { children: "\u6A21\u578B\u5EFA\u8BAE\u5F02\u5E38" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dd", { children: report.vlm_anomalies_count }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dt", { children: "\u6280\u672F\u8D28\u91CF\u95EE\u9898" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dd", { children: report.technical_quality_issues }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dt", { children: "\u4EBA\u5DE5\u590D\u6838" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dd", { children: report.human_reviewed_count }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("dt", { children: "\u4EBA\u5BA1\u826F\u54C1 / \u5F02\u5E38 / \u4E0D\u786E\u5B9A" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("dd", { children: [
            report.human_pass_count,
            " / ",
            report.human_fail_count,
            " / ",
            report.human_uncertain_count
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { onClick: download, children: "\u5BFC\u51FA JSON" })
      ] })
    ] });
  }

  // src/client/useAuditJobs.ts
  var import_react5 = __require("react");
  function useAuditJobs(datasetId, onProgress) {
    const [jobs, setJobs] = (0, import_react5.useState)([]);
    const [error, setError] = (0, import_react5.useState)("");
    const [revision, setRevision] = (0, import_react5.useState)(0);
    const observed = (0, import_react5.useRef)({ datasetId: "", signature: "" });
    const refresh = (0, import_react5.useCallback)(() => setRevision((value) => value + 1), []);
    (0, import_react5.useEffect)(() => {
      if (observed.current.datasetId !== datasetId) {
        observed.current = { datasetId, signature: "" };
        setJobs([]);
      }
      if (!datasetId) return;
      const controller = new AbortController();
      let timer, running = true;
      async function poll() {
        try {
          const result = await request(`/audit/jobs?dataset_id=${encodeURIComponent(datasetId)}`, void 0, void 0, controller.signal);
          if (controller.signal.aborted) return;
          const signature = JSON.stringify(result.jobs.map((job) => [job.run_id, job.status, job.completed, job.failed]));
          if (observed.current.signature && observed.current.signature !== signature) onProgress();
          observed.current.signature = signature;
          setJobs(result.jobs);
          setError("");
          running = result.jobs.some((job) => job.status === "RUNNING" || job.status === "PENDING");
        } catch (error2) {
          if (!controller.signal.aborted) setError(message(error2));
        } finally {
          if (!controller.signal.aborted) timer = setTimeout(poll, running ? 1200 : 5e3);
        }
      }
      poll();
      return () => {
        controller.abort();
        clearTimeout(timer);
      };
    }, [datasetId, onProgress, revision]);
    return { jobs, error, refresh };
  }

  // src/client/styles.ts
  var workbenchStyles = `
.iad-workbench {height:100%;box-sizing:border-box;overflow:auto;padding:28px 32px;color:#17253d;background:#edf2f8;font:14px/1.55 system-ui,sans-serif;}
.iad-workbench * {box-sizing:border-box;}
.iad-workbench h1 {font-size:27px;margin:3px 0 0;font-weight:700;}
.iad-workbench h2 {font-size:17px;margin:0 0 16px;}
.iad-workbench h3 {font-size:14px;margin:20px 0 9px;overflow:hidden;text-overflow:ellipsis;}
.iad-workbench button,.iad-workbench input,.iad-workbench select,.iad-workbench textarea {font:inherit;}
.iad-workbench button {cursor:pointer;background:white;color:#23446b;border:1px solid #dce4f0;border-radius:7px;padding:7px 12px;}
.iad-workbench button:hover {background:#edf3fc;}
.iad-workbench button:disabled {cursor:default;opacity:.45;}
.iad-workbench button.iad-primary {background:#2563eb;border-color:#2563eb;color:white;}
.iad-workbench button.iad-danger {color:#b42332;}
.iad-workbench input,.iad-workbench select,.iad-workbench textarea {min-width:0;background:white;border:1px solid #dce4f0;border-radius:6px;padding:7px 9px;}
.iad-workbench input[type=checkbox] {width:auto;}
.iad-workbench textarea {min-height:80px;resize:vertical;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-header {justify-content:space-between;margin-bottom:25px;}
.iad-eyebrow {font-size:11px;letter-spacing:1.5px;color:#4778c9;}
.iad-kpis {display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-bottom:24px;}
.iad-kpis>div {padding:16px 20px;background:white;border:1px solid #dce4f0;border-radius:10px;box-shadow:0 2px 5px #193b6c05;}
.iad-kpis span,.iad-kpis strong {display:block;}
.iad-kpis span,.iad-muted {color:#76859a;font-size:12px;}
.iad-kpis strong {font-size:25px;}.iad-kpis small {font-size:15px;color:#8996a9;font-weight:400;}
.iad-tabs {display:flex;gap:12px;margin-bottom:23px;}
.iad-tabs button {border:none;background:transparent;padding:9px 14px;}
.iad-tabs button.active {background:#e5edff;color:#1b54d7;}
.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:26px;align-items:start;}
.iad-gallery {min-width:0;background:#fff;border:1px solid #dce4f0;border-radius:10px;padding:16px;}.iad-filters {display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:10px;background:#f0f4fa;border-radius:8px;padding:12px;}
.iad-filter {font-size:11px;color:#697991;display:flex;flex-direction:column;gap:4px;}
.iad-filter select {font-size:12px;max-width:160px;color:#243e60;}
.iad-pagination {display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 0;font-size:12px;}
.iad-pagination button {font-size:12px;}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:14px;}
.iad-workbench button.iad-sample {padding:0;text-align:left;overflow:hidden;border:2px solid transparent;box-shadow:0 2px 8px #193b6c09;}
.iad-workbench button.iad-sample.is-selected {border-color:#3477ef;}
.iad-sample>strong,.iad-sample>span {display:block;margin:6px 9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;}
.iad-thumb {position:relative;aspect-ratio:1.35;background:#e8edf5;}.iad-thumb img {width:100%;height:100%;object-fit:contain;}
.iad-badge,.iad-reference {position:absolute;top:6px;left:6px;padding:2px 5px;background:#163855dd;color:white;border-radius:4px;font-size:10px;}
.iad-badge.is-risk {background:#b74132e6;}.iad-reference {top:auto;bottom:6px;background:#177658e8;}
.iad-inspector {background:white;border:1px solid #dce4f0;box-shadow:0 3px 12px #193b6c08;border-radius:10px;padding:18px;min-width:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:#e8edf5!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-image-frame svg {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon {fill:#ff532b0f;stroke:#ff532b;stroke-width:2;vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:#ff532b;font-size:14px;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:#8190a5;}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:#8190a5;}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-error {color:#a22c34;background:#fff1f1;padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-empty {padding:40px;text-align:center;color:#8190a5;}
.iad-settings {display:grid;grid-template-columns:minmax(300px,1fr) minmax(300px,1fr);gap:24px;max-width:1200px;}
.iad-settings>section {padding:20px;background:white;border:1px solid #dce4f0;border-radius:10px;}
.iad-directory {background:#eef3f9;padding:14px;border-radius:8px;}.iad-directory code {overflow-wrap:anywhere;}
.iad-directory-list {display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px;}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:#edf2f7;border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;}
.iad-job-panel {max-width:1000px;}.iad-job-panel>h2 {margin-top:26px;}.iad-job {padding:16px;margin-bottom:12px;background:#f0f4fa;border-radius:8px;}
.iad-job progress {width:100%;height:7px;accent-color:#3477ef;}.iad-job small {overflow-wrap:anywhere;}
.iad-lightbox {position:fixed;inset:0;z-index:10000;background:#142135f5;display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;gap:16px;align-items:center;flex-shrink:0;color:white;}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;margin-top:18px;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-viewer-world {position:absolute;left:50%;top:50%;transform-origin:center;}
.iad-viewer-world .iad-image-frame,.iad-viewer-world img {width:100%;height:100%;}
.iad-eye {display:flex;align-items:center;justify-content:center;}
.iad-info-group {background:#f0f4fa;padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:#3264b0;}
.iad-multiselect {position:relative;align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:white;border:1px solid #dce4f0;border-radius:6px;padding:7px 9px;font-size:12px;}
.iad-multiselect-menu {position:absolute;z-index:20;top:100%;left:0;min-width:190px;max-height:300px;overflow:auto;padding:12px;background:white;border:1px solid #dce4f0;border-radius:8px;box-shadow:0 8px 24px #1b315226;}
.iad-multiselect-menu label {display:flex;gap:9px;align-items:center;padding:6px 0;color:#243e60;white-space:nowrap;font-size:12px;}
.iad-multiselect-menu input {accent-color:#2563eb;}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:white;border:1px solid #dce4f0;border-radius:10px;}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:11px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:#e6edf7;}
.iad-profile {padding:14px;background:#f0f5fc;border-radius:8px;}
@media(max-width:1100px) {.iad-workbench {padding:20px;}.iad-main {grid-template-columns:minmax(0,1fr) 300px;}.iad-grid {grid-template-columns:repeat(auto-fill,minmax(125px,1fr));}}
@media(max-width:760px) {.iad-main,.iad-settings {grid-template-columns:1fr;}.iad-kpis {grid-template-columns:repeat(2,1fr);gap:10px;}.iad-inspector {width:100%;}}
`;

  // src/client/WorkbenchPage.tsx
  var import_jsx_runtime8 = __require("react/jsx-runtime");
  function WorkbenchPage({ mode }) {
    const [datasets, setDatasets] = (0, import_react6.useState)([]);
    const [datasetId, setDatasetId] = (0, import_react6.useState)(localStorage.getItem("iad.dataset") || "");
    const [tab, setTab] = (0, import_react6.useState)("samples");
    const [filters, setFilters] = (0, import_react6.useState)({ ...initialFilters, review_status: mode === "review" ? "pending" : "all" });
    const [page, setPage] = (0, import_react6.useState)(1);
    const [items, setItems] = (0, import_react6.useState)([]);
    const [total, setTotal] = (0, import_react6.useState)(0);
    const [selected, setSelected] = (0, import_react6.useState)("");
    const [loading, setLoading] = (0, import_react6.useState)(false);
    const [error, setError] = (0, import_react6.useState)("");
    const [revision, setRevision] = (0, import_react6.useState)(0);
    const dataset = datasets.find((d) => d.dataset_id === datasetId);
    const loadDatasets = (0, import_react6.useCallback)(async (preferred) => {
      try {
        const result = await request("/datasets");
        setDatasets(result.datasets);
        setDatasetId((current) => preferred || (result.datasets.some((d) => d.dataset_id === current) ? current : result.datasets[0]?.dataset_id || ""));
        setError("");
      } catch (e) {
        setError(message(e));
      }
    }, []);
    const changed = (0, import_react6.useCallback)(() => {
      setRevision((v) => v + 1);
      loadDatasets();
    }, [loadDatasets]);
    const audit = useAuditJobs(dataset?.dataset_id || "", changed);
    (0, import_react6.useEffect)(() => {
      loadDatasets();
    }, [loadDatasets]);
    (0, import_react6.useEffect)(() => {
      localStorage.setItem("iad.dataset", datasetId);
      setPage(1);
      setSelected("");
    }, [datasetId]);
    (0, import_react6.useEffect)(() => {
      if (!dataset) return;
      const controller = new AbortController();
      setLoading(true);
      const query = new URLSearchParams({ ...filters, annotation_filters: JSON.stringify(filters.annotation_filters), dataset_id: datasetId, page: String(page), page_size: "24" });
      request(`/samples/${dataset.task_id}?${query}`, void 0, void 0, controller.signal).then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setSelected((current) => current || result.items[0]?.sample_id || "");
      }).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [datasetId, dataset?.task_id, filters, page, revision]);
    const updateFilters = (value) => {
      setFilters(value);
      setPage(1);
      setSelected("");
    };
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "iad-workbench", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("header", { className: "iad-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "iad-eyebrow", children: "INDUSTRIAL BENCHMARK" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h1", { children: mode === "review" ? "\u4EBA\u5DE5\u590D\u6838" : "\u6A21\u578B\u5BA1\u8BA1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: (e) => setDatasetId(e.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }),
            datasets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { value: item.dataset_id, children: [
              item.name,
              " (",
              item.total_samples,
              ")"
            ] }, item.dataset_id))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { onClick: changed, children: "\u5237\u65B0" })
        ] })
      ] }),
      (error || audit.error) && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { role: "alert", className: "iad-error", children: error || audit.error }),
      dataset && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "iad-kpis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u56FE\u50CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: dataset.total_samples })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u6A21\u578B\u5BA1\u8BA1" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("strong", { children: [
            dataset.vlm_audited_count,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("small", { children: [
              "/ ",
              dataset.total_samples
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u5F85\u590D\u6838\u5F02\u5E38\u5EFA\u8BAE" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: dataset.pending_risk_count })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u5DF2\u4EBA\u5DE5\u590D\u6838" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: dataset.human_reviewed_count })
        ] })
      ] }),
      mode === "model" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("nav", { className: "iad-tabs", children: [["samples", "\u56FE\u50CF\u6837\u672C"], ["datasets", "\u6570\u636E\u96C6\u7BA1\u7406"], ["jobs", "\u6A21\u578B\u5BA1\u8BA1\u4F5C\u4E1A"], ["reports", "\u62A5\u544A"]].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: tab === key ? "active" : "", onClick: () => setTab(key), children: label }, key)) }),
      mode === "model" && (tab === "datasets" || !datasets.length) ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(DatasetManager, { datasets, selected: dataset, onChanged: (id) => {
        loadDatasets(id);
        setRevision((v) => v + 1);
      } }) : dataset ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
        (mode === "review" || tab === "samples") && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "iad-main", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SampleGrid, { dataset, filters, onFilters: updateFilters, items, total, page, onPage: (value) => {
            setPage(value);
            setSelected("");
          }, selected, onSelect: setSelected, loading }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SampleInspector, { dataset, sampleId: selected, mode, revision, onChanged: changed, jobs: audit.jobs, onJobsChanged: audit.refresh })
        ] }),
        mode === "model" && tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(AuditJobs, { dataset, filters, jobs: audit.jobs, onJobsChanged: audit.refresh }),
        mode === "model" && tab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(AuditReport, { dataset })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "iad-empty", children: "\u8BF7\u5728\u6A21\u578B\u5BA1\u8BA1\u7684\u6570\u636E\u96C6\u7BA1\u7406\u4E2D\u5BFC\u5165\u6570\u636E\u96C6\u3002" })
    ] });
  }
  function ModelAuditPage() {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(WorkbenchPage, { mode: "model" });
  }
  function HumanReviewPage() {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(WorkbenchPage, { mode: "review" });
  }

  // src/client/index.ts
  var name = "iad-client";
  var inject = ["slots"];
  function apply(ctx) {
    for (const [id, label, order, icon, page] of [
      ["industrial-audit", "\u6A21\u578B\u5BA1\u8BA1", 1, AuditIcon, ModelAuditPage],
      ["industrial-review", "\u4EBA\u5DE5\u590D\u6838", 2, ReviewIcon, HumanReviewPage]
    ]) {
      ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id, order, label }, icon));
      ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: id }, page));
    }
  }
  return __toCommonJS(index_exports);
})();

    return __IadClientBundle__;
  }
});

//# sourceMappingURL=client.js.map
