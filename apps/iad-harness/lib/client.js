window.__ModuleLoader__.load({
  id: "@industrial-benchmark/iad-harness",
  factory: (require) => {

"use strict";
var __IadClientBundle__ = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
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
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client/index.ts
  var index_exports = {};
  __export(index_exports, {
    apply: () => apply,
    inject: () => inject,
    name: () => name
  });
  var import_react13 = __toESM(__require("react"), 1);

  // src/client/AuditIcon.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  function DatasetIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: "12", cy: "5", rx: "8", ry: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" })
    ] });
  }
  function ImagesIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "3", width: "18", height: "18", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "1.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m3 17 5-5 4 4 4-7 5 8" })
    ] });
  }
  function KnowledgeIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1zm0 0v15M6 8h3m-3 4h3m6-4h3m-3 4h3" }) });
  }
  function ReviewIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 4H5v17h14V4h-4M9 2h6v5H9zM8 14l3 3 5-6" }) });
  }
  function AuditIcon({ size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "svg",
      {
        "aria-hidden": "true",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
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
  var import_react12 = __require("react");

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
  var import_react2 = __require("react");

  // src/client/components/Modal.tsx
  var import_react = __require("react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function Modal({ title, onClose, children }) {
    const dialog = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(() => {
      const previous = document.activeElement;
      const element = dialog.current;
      element.showModal();
      return () => {
        element.close();
        if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      };
    }, []);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dialog", { ref: dialog, "aria-label": title, className: "iad-detail-dialog", onCancel: (event) => {
      event.preventDefault();
      onClose();
    }, children });
  }

  // src/client/components/DatasetManager.tsx
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function DirectoryPicker({ label, value, onChange }) {
    const [listing, setListing] = (0, import_react2.useState)(null);
    const [error, setError] = (0, import_react2.useState)("");
    async function browse(path) {
      try {
        setListing(await request(`/directories?path=${encodeURIComponent(path || "/data1")}`));
        setError("");
      } catch (e) {
        setError(message(e));
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { "aria-label": label, value, onChange: (e) => onChange(e.target.value), placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => browse(value), children: "\u6D4F\u89C8" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      listing && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-directory", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { children: listing.path }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => browse(listing.parent), children: "\u4E0A\u7EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => {
            onChange(listing.path);
            setListing(null);
          }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => setListing(null), children: "\u5173\u95ED" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "iad-directory-list", children: listing.directories.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => browse(dir.path), children: dir.name }, dir.path)) })
      ] })
    ] });
  }
  function DatasetSettings({ dataset, onChanged }) {
    const [rename, setRename] = (0, import_react2.useState)("");
    const [busy, setBusy] = (0, import_react2.useState)(false);
    const [error, setError] = (0, import_react2.useState)("");
    async function save(patch) {
      setBusy(true);
      setError("");
      try {
        await request(`/datasets/${dataset.dataset_id}`, patch, "PATCH");
        onChanged();
        setRename("");
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6\u8BE6\u60C5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: dataset.name }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u56FE\u50CF\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: dataset.image_dir }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u6807\u6CE8\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: dataset.annotation_dir || "\u7531\u539F\u5BFC\u5165\u914D\u7F6E\u5B9A\u4F4D" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "\u6570\u636E\u96C6 ID" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { children: dataset.dataset_id }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { "aria-label": "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", placeholder: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", value: rename, onChange: (e) => setRename(e.target.value), maxLength: 120, disabled: busy }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: busy || !rename.trim(), onClick: () => save({ name: rename }), children: "\u4FDD\u5B58\u540D\u79F0" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "iad-row iad-rule", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", checked: dataset.unannotated_is_normal, disabled: busy, onChange: (e) => save({ unannotated_is_normal: e.target.checked }) }),
        "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u53C2\u8003"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { children: [
        "\u826F\u54C1\u5019\u9009\uFF1A",
        dataset.reference_mode === "selected" ? "\u4EBA\u5DE5\u9009\u5B9A\u8303\u56F4" : "\u81EA\u52A8\u8D44\u683C",
        " \xB7 ",
        dataset.reference_sample_ids.length,
        " \u5F20"
      ] }),
      dataset.reference_mode === "selected" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: busy, onClick: () => save({ reset_references: true }), children: "\u6062\u590D\u81EA\u52A8\u8D44\u683C" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "iad-muted", children: "\u6765\u6E90\u8D44\u683C\u53D8\u66F4\u7528\u4E8E\u540E\u7EED\u77E5\u8BC6\u6316\u6398\uFF1B\u5DF2\u6709\u77E5\u8BC6\u4E0E\u5BA1\u8BA1\u4FDD\u7559\u539F\u7248\u672C\u3002" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", className: "iad-error", children: error })
    ] });
  }
  function DatasetManager({ datasets, selected, onChanged }) {
    const [importing, setImporting] = (0, import_react2.useState)(false);
    const [name2, setName] = (0, import_react2.useState)("");
    const [imageDir, setImageDir] = (0, import_react2.useState)("");
    const [annotationDir, setAnnotationDir] = (0, import_react2.useState)("");
    const [busy, setBusy] = (0, import_react2.useState)(false);
    const [error, setError] = (0, import_react2.useState)("");
    async function importDataset(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      try {
        const dataset = await request("/datasets/import", { name: name2, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
        onChanged(dataset.dataset_id);
        setName("");
        setImageDir("");
        setAnnotationDir("");
        setImporting(false);
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { children: [
            "\u6570\u636E\u96C6 \xB7 ",
            datasets.length
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "iad-primary", onClick: () => {
            setError("");
            setImporting(true);
          }, children: "\u6DFB\u52A0\u6570\u636E\u96C6" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "iad-dataset-list", children: datasets.map((dataset) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { "aria-label": `\u9009\u62E9\u6570\u636E\u96C6 ${dataset.name}`, "aria-pressed": selected?.dataset_id === dataset.dataset_id, onClick: () => onChanged(dataset.dataset_id), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: dataset.name }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
            dataset.total_samples,
            " \u5F20 \xB7 \u4EBA\u5DE5\u590D\u6838 ",
            dataset.human_reviewed_count,
            " \u5F20"
          ] })
        ] }, dataset.dataset_id)) }),
        !datasets.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "iad-muted", children: "\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u56FE\u50CF\u76EE\u5F55\u4E0E\u6807\u6CE8\u76EE\u5F55\u3002" })
      ] }),
      selected ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DatasetSettings, { dataset: selected, onChanged }, selected.dataset_id) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u9009\u62E9\u6216\u6DFB\u52A0\u6570\u636E\u96C6\u3002" }) }),
      importing && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Modal, { title: "\u5BFC\u5165 Labelme \u6570\u636E\u96C6", onClose: () => {
        if (!busy) setImporting(false);
      }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("form", { className: "iad-dataset-import", onSubmit: importDataset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "\u5BFC\u5165 Labelme \u6570\u636E\u96C6" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { id: "dataset-name", value: name2, onChange: (e) => setName(e.target.value), maxLength: 120, autoFocus: true, required: true, disabled: busy })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "iad-muted", children: "\u6309\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\uFF0C\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u5019\u9009\u3002" }),
        error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", className: "iad-error", children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "iad-primary", disabled: busy || !name2.trim() || !imageDir || !annotationDir, children: busy ? "\u6B63\u5728\u626B\u63CF\u5BFC\u5165\u2026" : "\u5BFC\u5165\u6570\u636E\u96C6" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", disabled: busy, onClick: () => setImporting(false), children: "\u53D6\u6D88" })
        ] })
      ] }) })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading }) {
    const select = (key, label, options) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "iad-filter", children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("select", { "aria-label": label, value: filters[key], onChange: (e) => onFilters({ ...filters, [key]: e.target.value }), children: options.map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value, children: title }, value)) })
    ] });
    const pagination = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-pagination", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
        total,
        " \u5F20"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: page <= 1, onClick: () => onPage(page - 1), children: "\u4E0A\u4E00\u9875" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
        page,
        " / ",
        Math.max(1, Math.ceil(total / 24))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: page * 24 >= total, onClick: () => onPage(page + 1), children: "\u4E0B\u4E00\u9875" })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "iad-gallery", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("details", { className: "iad-multiselect", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("summary", { "aria-label": "\u6807\u6CE8\u7B5B\u9009", children: [
            "\u6807\u6CE8 \xB7 ",
            filters.annotation_filters.length ? `\u5DF2\u9009 ${filters.annotation_filters.length} \u9879` : "\u5168\u90E8"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-multiselect-menu", children: [
            [["none", "\u65E0\u6807\u6CE8"], ["present", "\u6709\u6807\u6CE8"], ...dataset.annotation_categories.map((value) => [`category:${value}`, `\u7C7B\u522B ${value}`])].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "checkbox", "aria-label": title, checked: filters.annotation_filters.includes(value), onChange: (e) => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        select("model_status", "\u6A21\u578B\u5BA1\u8BA1", [["all", "\u5168\u90E8"], ["pending", "\u5F85\u5BA1\u8BA1"], ["audited", "\u5DF2\u5BA1\u8BA1"], ["risk", "\u53EF\u7591"], ["PASS", "\u6A21\u578B\u5EFA\u8BAE\u826F\u54C1"], ["FAIL", "\u6A21\u578B\u5EFA\u8BAE\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"]]),
        select("review_status", "\u4EBA\u5DE5\u590D\u6838", [["all", "\u5168\u90E8"], ["pending", "\u5F85\u590D\u6838"], ["reviewed", "\u5DF2\u590D\u6838"], ["PASS", "\u826F\u54C1"], ["HARD_NORMAL", "\u56F0\u96BE\u6B63\u5E38"], ["FAIL", "\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"], ["SKIP", "\u5DF2\u8DF3\u8FC7"]]),
        select("technical", "\u6280\u672F\u8D28\u91CF", [["all", "\u5168\u90E8"], ["issues", "\u5B58\u5728\u95EE\u9898"]]),
        select("sort_by", "\u6392\u5E8F", [["default", "\u9ED8\u8BA4"], ["risk", "\u53EF\u7591\u5EA6\u4F18\u5148"], ["tech", "\u6280\u672F\u95EE\u9898\u4F18\u5148"]]),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6309\u6587\u4EF6\u540D\u641C\u7D22", value: filters.search, onChange: (e) => onFilters({ ...filters, search: e.target.value }) })
      ] }),
      pagination,
      loading ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "iad-grid", children: items.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: `iad-sample ${selected === sample.sample_id ? "is-selected" : ""}`, onClick: () => onSelect(sample.sample_id), children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-thumb", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("img", { loading: "lazy", src: mediaUrl(sample, true), alt: sample.relative_path }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `iad-badge ${sample.suggestion?.suggested_label === "FAIL" ? "is-risk" : ""}`, children: sample.review_decision ? `\u4EBA\u5BA1 ${sample.review_decision}` : sample.suggestion ? `\u6A21\u578B ${sample.suggestion.suggested_label}` : "\u5F85\u6A21\u578B\u5BA1\u8BA1" }),
          dataset.reference_sample_ids.includes(sample.sample_id) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "iad-reference", children: "\u826F\u54C1\u53C2\u8003" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { title: sample.relative_path, children: sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "iad-muted", children: sample.annotation_count ? sample.annotation_categories.join("\u3001") : "\u65E0\u6807\u6CE8" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "iad-muted", children: [
          "\u53EF\u7591\u5EA6 ",
          sample.visual_suspicion_score ?? "\u672A\u6D4B",
          " \xB7 \u6280\u672F ",
          sample.technical_quality_score
        ] })
      ] }, sample.sample_id)) }),
      !loading && !items.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6837\u672C\u3002" }),
      pagination
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_react6 = __require("react");

  // src/client/components/ImageViewer.tsx
  var import_react3 = __require("react");
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  function AnnotatedImage({ image, visible = true }) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-image-frame", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("img", { src: image.src, alt: image.title, draggable: false }),
      visible && image.annotations && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { className: "iad-annotation-layer", viewBox: `0 0 ${image.width} ${image.height}`, preserveAspectRatio: "none", children: image.annotations.filter((a) => a.geometry_status !== "INVALID").map((a) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { children: [
        a.polygon ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("polygon", { points: a.polygon.map((p) => p.join(",")).join(" ") }) : a.bbox && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: a.bbox[0], y: a.bbox[1], width: a.bbox[2] - a.bbox[0], height: a.bbox[3] - a.bbox[1] }),
        a.bbox && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("text", { x: a.bbox[0], y: Math.max(12, a.bbox[1] - 4), children: a.raw_label })
      ] }, a.annotation_id)) }),
      image.focus && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "svg",
        {
          className: "iad-finding-layer",
          "data-finding-id": image.focus.findingId,
          viewBox: `0 0 ${image.width} ${image.height}`,
          preserveAspectRatio: "none",
          "aria-label": image.focus.label,
          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: image.focus.bbox[0], y: image.focus.bbox[1], width: image.focus.bbox[2] - image.focus.bbox[0], height: image.focus.bbox[3] - image.focus.bbox[1] })
        }
      )
    ] });
  }
  function ImageViewer({ image, onClose }) {
    const viewport = (0, import_react3.useRef)(null);
    const [size, setSize] = (0, import_react3.useState)({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = (0, import_react3.useState)({ width: 0, height: 0 });
    const [view, setView] = (0, import_react3.useState)({ scale: 0, x: 0, y: 0 });
    const [visible, setVisible] = (0, import_react3.useState)(true);
    const drag = (0, import_react3.useRef)(null);
    const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
    const scale = view.scale || fit;
    (0, import_react3.useLayoutEffect)(() => {
      const element = viewport.current;
      const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    (0, import_react3.useEffect)(() => {
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
    (0, import_react3.useEffect)(() => {
      if (!image.focus || !bounds.width || !bounds.height || !size.width || !size.height) return;
      const [x1, y1, x2, y2] = image.focus.bbox;
      const scale2 = Math.min(16, bounds.width / ((x2 - x1) * 1.4), bounds.height / ((y2 - y1) * 1.4));
      setView({ scale: scale2, x: (size.width / 2 - (x1 + x2) / 2) * scale2, y: (size.height / 2 - (y1 + y2) / 2) * scale2 });
    }, [image.focus, bounds.width, bounds.height, size.width, size.height]);
    (0, import_react3.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-lightbox", role: "dialog", "aria-modal": "true", "aria-label": "\u539F\u56FE\u68C0\u89C6\u5668", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-lightbox-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: image.title }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: (e) => setView({ scale: Number(e.target.value), x: 0, y: 0 }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: 1, children: "100%" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: 1.5, children: "150%" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: 2, children: "200%" }),
          !fixed && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: "custom", children: [
            Math.round(scale * 100),
            "%"
          ] })
        ] }),
        image.annotations && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "iad-eye", title: visible ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-label": visible ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-pressed": visible, onClick: () => setVisible((v) => !v), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
          !visible && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "m3 3 18 18" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { onClick: onClose, children: "\u5173\u95ED" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "iad-viewer-world", "data-scale": scale, style: {
            width: size.width,
            height: size.height,
            "--iad-view-scale": scale,
            transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})`
          }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AnnotatedImage, { image: { ...image, ...size }, visible }) })
        }
      )
    ] });
  }

  // src/client/components/DatasetKnowledge.tsx
  var import_jsx_runtime6 = __require("react/jsx-runtime");
  var statuses = { supported: "\u6709\u8BC1\u636E\u652F\u6301", provisional: "\u5F85\u9A8C\u8BC1", conflicted: "\u5B58\u5728\u77DB\u76FE" };
  function DatasetKnowledge({ knowledge }) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "iad-profile", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: knowledge.kind === "normal" ? "\u826F\u54C1\u77E5\u8BC6" : "\u4E0D\u826F\u77E5\u8BC6" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: knowledge.summary }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("small", { className: "iad-muted", children: [
        knowledge.version_id,
        " \xB7 ",
        knowledge.sources.length,
        " \u5F20\u6765\u6E90 \xB7 ",
        knowledge.checks.length,
        " \u9879\u5224\u636E"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("summary", { children: "\u68C0\u67E5\u5224\u636E" }),
        knowledge.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("strong", { children: [
            check.title,
            " \xB7 ",
            statuses[check.status]
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: check.criterion }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("small", { className: "iad-muted", children: [
            check.subject,
            " \xB7 ",
            check.location
          ] }),
          !!check.allowed_variations.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
            "\u5141\u8BB8\u53D8\u5316\uFF1A",
            check.allowed_variations.join("\uFF1B")
          ] }),
          !!check.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
        ] }, check.check_id))
      ] })
    ] });
  }

  // src/client/components/AuditEvidence.tsx
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  function AuditEvidence({ analysis, ids, label, onEvidence }) {
    const images = new Map([analysis.overview, ...analysis.regions.map((region) => region.image), ...analysis.auxiliary_evidence].map((image) => [image.evidence_id, image]));
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "iad-actions", children: ids.map((id, index) => {
      const image = images.get(id);
      return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          "data-evidence-id": id,
          disabled: !image,
          onClick: () => image && onEvidence(image),
          "aria-label": `\u67E5\u770B${label}\u7684\u8BC1\u636E ${index + 1}`,
          children: [
            "\u8BC1\u636E ",
            index + 1,
            " \xB7 ",
            !image ? "\u4E0D\u53EF\u7528" : image.representation === "annotation_mask" ? "\u5B9A\u4F4D\u56FE" : image.role === "overview" ? "\u5168\u56FE" : "ROI"
          ]
        },
        id
      );
    }) });
  }

  // src/client/components/RuleAssessments.tsx
  var import_jsx_runtime8 = __require("react/jsx-runtime");
  var statuses2 = { normal: "\u672A\u89C1\u5F02\u5E38", anomaly: "\u53D1\u73B0\u504F\u79BB", insufficient: "\u8BC1\u636E\u4E0D\u8DB3", not_applicable: "\u4E0D\u9002\u7528" };
  function RuleAssessments({ analysis, knowledge, onEvidence }) {
    const checks = new Map(knowledge.flatMap((snapshot) => snapshot.checks.map((check) => [check.check_id, check])));
    if (!analysis.check_assessments.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("details", { className: "iad-rule-assessments iad-analysis", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("summary", { children: [
        "\u68C0\u67E5\u9879 \xB7 ",
        analysis.check_assessments.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("ol", { children: analysis.check_assessments.map((assessment) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { "data-check-id": assessment.check_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: checks.get(assessment.check_id)?.title || assessment.check_id }),
        " \xB7 ",
        statuses2[assessment.status],
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: assessment.description }),
        !!assessment.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "iad-muted", children: assessment.limitations.join("\uFF1B") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(AuditEvidence, { analysis, ids: assessment.evidence_ids, label: checks.get(assessment.check_id)?.title || "\u68C0\u67E5\u9879", onEvidence })
      ] }, assessment.check_id)) })
    ] });
  }

  // src/client/components/AuditFindings.tsx
  var import_react4 = __require("react");
  var import_jsx_runtime9 = __require("react/jsx-runtime");
  var priorities = { high: "\u4F18\u5148\u590D\u6838", medium: "\u968F\u540E\u590D\u6838", low: "\u8865\u5145\u6838\u5BF9" };
  function AuditFindings({ analysis, onLocate, onEvidence }) {
    const [expanded, setExpanded] = (0, import_react4.useState)(false);
    if (!analysis.findings.length) return null;
    const visible = expanded ? analysis.findings : analysis.findings.slice(0, 3);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("section", { className: "iad-findings", "aria-label": "\u4F18\u5148\u590D\u6838\u7591\u70B9", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h3", { children: [
        "\u91CD\u70B9\u7591\u70B9 \xB7 ",
        analysis.findings.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ol", { children: visible.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("li", { "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: priorities[finding.priority] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("button", { onClick: () => onLocate(finding), title: "\u5728\u5168\u56FE\u5B9A\u4F4D", children: [
          finding.location.description,
          " \xB7 ",
          finding.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("details", { className: "iad-analysis", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("summary", { children: "\u4F9D\u636E\u4E0E\u6B63\u5E38\u89E3\u91CA" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
            "\u5F02\u5E38\u5047\u8BBE\uFF1A",
            finding.hypothesis
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
            "\u6B63\u5E38\u89E3\u91CA\uFF1A",
            finding.normal_explanation
          ] }),
          !!finding.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "iad-muted", children: finding.limitations.join("\uFF1B") }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, onEvidence })
        ] })
      ] }, finding.finding_id)) }),
      analysis.findings.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u5176\u4ED6\u7591\u70B9" : `\u67E5\u770B\u5176\u4F59 ${analysis.findings.length - 3} \u9879` })
    ] });
  }

  // src/client/useReviewDraft.ts
  var import_react5 = __require("react");
  function useReviewDraft(datasetId, sampleId) {
    const key = `iad.review-draft:${datasetId}:${sampleId}`;
    const [state, setState] = (0, import_react5.useState)(() => {
      const draft = { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "" };
      try {
        const stored = JSON.parse(sessionStorage.getItem(key) || "null");
        if (stored && typeof stored.reviewer === "string" && typeof stored.comment === "string") return { draft: stored, dirty: true };
      } catch {
        sessionStorage.removeItem(key);
      }
      return { draft, dirty: false };
    });
    function update(patch) {
      const draft = { ...state.draft, ...patch };
      sessionStorage.setItem(key, JSON.stringify(draft));
      setState({ draft, dirty: true });
    }
    function discard() {
      sessionStorage.removeItem(key);
      setState({ draft: { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "" }, dirty: false });
    }
    return { ...state.draft, dirty: state.dirty, update, discard };
  }

  // src/client/components/SampleInspector.tsx
  var import_jsx_runtime10 = __require("react/jsx-runtime");
  function SampleInspector({ dataset, sampleId, mode, revision, onChanged, jobs, onJobsChanged }) {
    const [detail, setDetail] = (0, import_react6.useState)(null);
    const [error, setError] = (0, import_react6.useState)("");
    const [notice, setNotice] = (0, import_react6.useState)("");
    const [busy, setBusy] = (0, import_react6.useState)(false);
    const job = jobs.find((job2) => job2.sample_ids.includes(sampleId));
    const jobRunning = jobs.some((job2) => job2.status === "RUNNING" || job2.status === "PENDING");
    const draft = useReviewDraft(dataset.dataset_id, sampleId);
    const { reviewer, comment } = draft;
    const [lightbox, setLightbox] = (0, import_react6.useState)(null);
    const activeId = (0, import_react6.useRef)(sampleId);
    const openedAt = (0, import_react6.useRef)(Date.now());
    (0, import_react6.useEffect)(() => {
      activeId.current = sampleId;
      setDetail(null);
      setError("");
      setNotice("");
      setLightbox(null);
      openedAt.current = Date.now();
    }, [sampleId]);
    (0, import_react6.useEffect)(() => {
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
      setBusy(true);
      setError("");
      const ids = dataset.reference_sample_ids.includes(sampleId) ? dataset.reference_sample_ids.filter((id) => id !== sampleId) : [...dataset.reference_sample_ids, sampleId];
      try {
        await request(`/datasets/${dataset.dataset_id}`, { reference_sample_ids: ids }, "PATCH");
        onChanged();
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
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
        draft.discard();
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
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("aside", { className: "iad-inspector", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { children: mode === "review" ? "\u590D\u6838\u660E\u7EC6" : "\u6837\u672C\u4FE1\u606F" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "status", children: notice }),
      !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(AnnotatedImage, { image }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("dl", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { title: detail.sample.image_path, children: detail.sample.image_path }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u56FE\u50CF\u540D" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "UUID" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { "data-field": "sample-uuid", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u539F\u59CB\u8D28\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { children: detail.sample.quality_status }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u5206\u8FA8\u7387" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("dd", { children: [
            detail.sample.width,
            " \xD7 ",
            detail.sample.height
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { children: detail.technical_quality_score })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("h3", { children: [
            "Labelme \u6807\u6CE8 \xB7 ",
            detail.annotations.length
          ] }),
          detail.annotations.length ? detail.annotations.map((a) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-annotation", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: a.raw_label }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
              a.bbox?.join(", "),
              " \xB7 ",
              a.geometry_status
            ] })
          ] }, a.annotation_id)) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }),
          detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: i.message }, index)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
          detail.suggestion ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: detail.suggestion.suggested_label }),
              " \xB7 ",
              detail.suggestion.reason_category,
              " \xB7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ",
              detail.suggestion.confidence === null ? "\u672A\u8BB0\u5F55" : `${Math.round(detail.suggestion.confidence * 100)}%`
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-observation", children: detail.suggestion.notes }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("small", { className: "iad-muted", children: detail.suggestion.model_name }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              AuditFindings,
              {
                analysis: detail.suggestion.analysis,
                onEvidence: (image2) => setLightbox(evidenceSource(image2)),
                onLocate: (finding) => {
                  const overview = detail.suggestion.analysis.overview;
                  setLightbox({ ...evidenceSource(overview), focus: finding.location.bbox ? {
                    bbox: finding.location.bbox.map((coordinate, axis) => coordinate * overview.sent_size[axis % 2] / overview.original_size[axis % 2]),
                    label: finding.location.description,
                    findingId: finding.finding_id
                  } : void 0 });
                }
              },
              detail.suggestion.suggestion_id
            ),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "iad-muted", children: [
              "\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \xB7 ",
              detail.suggestion.reference_sample_ids.length,
              " \u5F20\u53C2\u8003\u56FE"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-reference-grid", children: detail.normal_knowledge?.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)).map((item) => {
              const src = `/api/iad/knowledge/evidence/${encodeURIComponent(detail.normal_knowledge.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
              return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("img", { alt: "\u672C\u6B21\u5BA1\u8BA1\u7684\u77E5\u8BC6\u6765\u6E90", src }) }, item.image.evidence_id);
            }) }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(RuleAssessments, { analysis: detail.suggestion.analysis, knowledge: [...detail.normal_knowledge ? [detail.normal_knowledge] : [], ...detail.defect_knowledge ? [detail.defect_knowledge] : []], onEvidence: (image2) => setLightbox(evidenceSource(image2)) }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("details", { className: "iad-analysis", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }),
              detail.normal_knowledge ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }),
              detail.defect_knowledge && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DatasetKnowledge, { knowledge: detail.defect_knowledge }),
              !!detail.suggestion.analysis.knowledge_limitations.length && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "iad-muted", children: [
                "\u77E5\u8BC6\u9650\u5236\uFF1A",
                detail.suggestion.analysis.knowledge_limitations.join("\uFF1B")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: [
                "\u5C40\u90E8\u8986\u76D6 ",
                detail.suggestion.analysis.coverage.inspected_regions,
                " / ",
                detail.suggestion.analysis.coverage.planned_regions,
                " \xB7 ",
                detail.suggestion.analysis.coverage.complete ? "\u8BA1\u5212\u5DF2\u8986\u76D6" : "\u68C0\u67E5\u672A\u5B8C\u6210"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("img", { src: evidenceSource(detail.suggestion.analysis.overview).src, alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
                  "\u5168\u56FE \xB7 ",
                  detail.suggestion.analysis.overview.sent_size.join(" \xD7 "),
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: detail.suggestion.analysis.global_view.description }),
              detail.suggestion.analysis.regions.map((region, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("h3", { children: [
                  "\u5C40\u90E8 \xB7 ",
                  region.origins.map((origin) => origin.label).join(" / ")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("small", { children: [
                  { annotation: "Labelme \u7EBF\u7D22", model: "MLLM \u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" }[region.source],
                  " \xB7 \u539F\u56FE\u5750\u6807 ",
                  region.crop_bbox.join(", ")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("img", { src: evidenceSource(region.image).src, alt: `\u5BA1\u8BA1 ROI ${index + 1}` }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
                    region.image.sent_size.join(" \xD7 "),
                    " \xB7 PNG",
                    detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: region.observation.description }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                  "\u4F4D\u7F6E\uFF1A",
                  region.observation.position_analysis
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                  "\u5149\u7167\uFF1A",
                  region.observation.illumination_analysis
                ] })
              ] }, index)),
              detail.suggestion.analysis.auxiliary_evidence.map((image2) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image2)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("img", { src: evidenceSource(image2).src, alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
                  "\u6807\u6CE8\u5B9A\u4F4D\u56FE",
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(image2.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }, image2.evidence_id)),
              detail.suggestion.analysis.conclusion.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "iad-error", children: [
                "\u89C2\u5BDF\u77DB\u76FE\uFF1A",
                detail.suggestion.analysis.conclusion.conflicts.join("\uFF1B")
              ] }),
              detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "iad-error", children: [
                "\u7F3A\u5931\u8BC1\u636E\uFF1A",
                detail.suggestion.analysis.conclusion.missing_evidence.join("\uFF1B")
              ] }),
              detail.suggestion.analysis.joint_steps.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("details", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("summary", { children: [
                  "\u8054\u5408\u5206\u6790\u8BB0\u5F55 \xB7 ",
                  detail.suggestion.analysis.joint_steps.length,
                  " \u6B65"
                ] }),
                detail.suggestion.analysis.joint_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("strong", { children: [
                    step.step_id,
                    " \xB7 ",
                    step.result.suggested_label
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                    step.input_evidence_ids.length,
                    " \u5F20\u56FE\u50CF",
                    step.child_step_ids.length ? ` \xB7 \u6C47\u603B ${step.child_step_ids.join("\u3001")}` : ""
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: step.result.description }),
                  "resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                      "\u5DF2\u6392\u9664\u7591\u70B9\uFF1A",
                      resolution.description
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                      "\u6B63\u5E38\u89E3\u91CA\uFF1A",
                      resolution.normal_explanation
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(AuditEvidence, { analysis: detail.suggestion.analysis, ids: resolution.evidence_ids, label: resolution.description, onEvidence: (image2) => setLightbox(evidenceSource(image2)) })
                  ] }, index))
                ] }, step.step_id))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "iad-muted", children: [
                "\u7ED3\u8BBA\u5F15\u7528 ",
                detail.suggestion.analysis.conclusion.evidence_ids.length,
                " \u9879\u89C6\u89C9\u8BC1\u636E"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                "\u4F4D\u7F6E\u5206\u6790\uFF1A",
                detail.suggestion.analysis.conclusion.position_analysis
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
                "\u5149\u7167\u5206\u6790\uFF1A",
                detail.suggestion.analysis.conclusion.illumination_analysis
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })
        ] }),
        mode === "model" && job && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: "iad-single-job iad-info-group", "aria-live": "polite", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: job.status }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: auditPhases[job.phase || ""] || job.message }),
          !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
            "ROI ",
            job.inspected_regions || 0,
            " / ",
            job.planned_regions
          ] }),
          !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
            "\u8054\u5408\u5224\u65AD ",
            job.completed_batches || 0,
            " / ",
            job.total_batches
          ] }),
          job.errors.map((error2, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-error", children: error2.message }, index)),
          (job.status === "RUNNING" || job.status === "PENDING") && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { onClick: async () => {
            try {
              await request(`/audit/cancel/${job.run_id}`, {});
              onJobsChanged();
            } catch (error2) {
              setError(message(error2));
            }
          }, children: "\u53D6\u6D88\u5BA1\u8BA1" })
        ] }),
        mode === "dataset" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-actions", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { disabled: busy, onClick: setReference, children: dataset.reference_sample_ids.includes(sampleId) ? "\u79FB\u51FA\u826F\u54C1\u53C2\u8003" : "\u8BBE\u4E3A\u826F\u54C1\u53C2\u8003" }) }),
        mode === "model" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-actions", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "iad-primary", disabled: busy || jobRunning, onClick: audit, children: busy || jobRunning ? "\u6B63\u5728\u8054\u5408\u5BA1\u8BA1\u2026" : "\u6309\u77E5\u8BC6\u5BA1\u8BA1\u6B64\u56FE" }) }) : mode === "review" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: "iad-decision", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
          draft.dirty && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { role: "status", children: "\u8349\u7A3F\u672A\u63D0\u4EA4" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { disabled: busy, onClick: draft.discard, children: "\u653E\u5F03\u8349\u7A3F" })
          ] }),
          detail.review_decision && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
            "\u5F53\u524D\uFF1A",
            detail.review_decision.decision,
            " \xB7 ",
            detail.review_decision.reviewer,
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("br", {}),
            detail.review_decision.comment
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u4EBA",
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { value: reviewer, onChange: (e) => draft.update({ reviewer: e.target.value }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u8BF4\u660E",
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("textarea", { value: comment, onChange: (e) => draft.update({ comment: e.target.value }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-actions", children: [["PASS", "\u826F\u54C1"], ["HARD_NORMAL", "\u56F0\u96BE\u6B63\u5E38"], ["FAIL", "\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"], ["SKIP", "\u8DF3\u8FC7"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: value === "FAIL" ? "iad-danger" : "", disabled: busy, onClick: () => submit(value), children: label }, value)) })
        ] }) : null
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/QualityReport.tsx
  var import_react7 = __toESM(__require("react"), 1);
  var import_jsx_runtime11 = __require("react/jsx-runtime");
  function QualityReport({ report }) {
    const quality = report.quality;
    const dimensions = [
      ["\u6280\u672F\u53EF\u7528\u7387", quality.technical_usability],
      ["\u5BA1\u8BA1\u8986\u76D6\u7387", quality.audit_coverage],
      ["\u4EBA\u5DE5\u6838\u9A8C\u8986\u76D6\u7387", quality.human_verification_coverage]
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dl", { children: dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_react7.default.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: ratio.percent === null ? "\u672A\u8BC4\u4F30" : `${ratio.percent}%` }),
          " \xB7 ",
          ratio.numerator,
          " / ",
          ratio.denominator
        ] })
      ] }, label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dl", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u7591\u70B9\u56FE\u50CF / \u6570" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
          quality.model.suspect_samples,
          " / ",
          quality.model.finding_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u7F3A\u8BC1 / \u51B2\u7A81\u56FE\u50CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
          quality.model.missing_evidence_samples,
          " / ",
          quality.model.conflict_samples
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u6A21\u578B\u4E0D\u786E\u5B9A" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: quality.model.uncertain_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u65E0\u7ED3\u6784\u5316\u5206\u6790" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: quality.model.unstructured_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u4EBA\u5BA1\u826F\u54C1 / \u5F02\u5E38" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
          "\u826F\u54C1 ",
          report.human_pass_count,
          " \xB7 \u5F02\u5E38 ",
          report.human_fail_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u4EBA\u5DE5\u5F85\u5B9A / \u8DF3\u8FC7" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
          report.human_uncertain_count,
          " / ",
          report.human_skipped_count
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("details", { className: "iad-analysis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("summary", { children: "\u53E3\u5F84\u3001\u8303\u56F4\u4E0E\u7248\u672C" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u8F93\u5165 / \u5DF2\u767B\u8BB0" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
            quality.scope.observed_inputs,
            " / ",
            quality.scope.registered_samples,
            "\uFF0C\u672A\u767B\u8BB0 ",
            quality.scope.unregistered_inputs
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: "\u5168\u90E8\u5DF2\u4FDD\u5B58\u56FE\u50CF\uFF0C\u6BCF\u5F20\u53D6\u6700\u65B0\u8BB0\u5F55\uFF1B\u4E0D\u53D7\u5F53\u524D\u7F51\u683C\u7B5B\u9009\u5F71\u54CD\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u7EDF\u8BA1\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("time", { dateTime: report.generated_at, children: report.generated_at }) }),
          dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_react7.default.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: ratio.basis })
          ] }, label))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u5BA1\u8BA1\u4F7F\u7528\u7684\u77E5\u8BC6\u7EC4\u5408" }),
        quality.knowledge_versions.length ? quality.knowledge_versions.map((usage, index) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u56FE\u50CF\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: usage.sample_count }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: usage.normal_version_id || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u4E0D\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: usage.defect_version_id || "\u672A\u4F7F\u7528" }),
          usage.legacy_profile_id && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u53C2\u8003\u6A21\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: usage.legacy_profile_id })
          ] })
        ] }, index)) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u5C1A\u65E0\u53EF\u8FFD\u6EAF\u7684\u77E5\u8BC6\u7248\u672C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        quality.audit_run_ids.length ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ul", { children: quality.audit_run_ids.map((id) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("li", { children: id }, id)) }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u5C1A\u65E0\u5DF2\u8BB0\u5F55\u7684\u5BA1\u8BA1\u4F5C\u4E1A\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ul", { children: quality.scope.limitations.map((text) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("li", { children: text }, text)) })
      ] })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_react8 = __require("react");
  var import_jsx_runtime12 = __require("react/jsx-runtime");
  function AuditJobs({ dataset, filters, jobs, onJobsChanged }) {
    const [lightbox, setLightbox] = (0, import_react8.useState)(null);
    const [normal, setNormal] = (0, import_react8.useState)(null);
    const [defect, setDefect] = (0, import_react8.useState)(null);
    const [model, setModel] = (0, import_react8.useState)("Qwen/Qwen3.8-27B-FP8");
    const [busy, setBusy] = (0, import_react8.useState)(false);
    const [error, setError] = (0, import_react8.useState)("");
    (0, import_react8.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-job-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u51BB\u7ED3\u77E5\u8BC6" }),
        normal ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(DatasetKnowledge, { knowledge: normal }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "iad-reference-grid", children: normal.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw").map((item) => {
            const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
            return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u56FE", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("img", { alt: "\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", src }) }, item.image.evidence_id);
          }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "iad-profile iad-muted", children: "\u8BF7\u5148\u8FD0\u884C\u201C\u6316\u6398\u826F\u54C1\u77E5\u8BC6\u201D\u6280\u80FD\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002" }),
        defect ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(DatasetKnowledge, { knowledge: defect }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { children: [
            "\u6A21\u578B",
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, onChange: (e) => setModel(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { className: "iad-primary", onClick: start, disabled: busy || !normal?.checks.some((check) => check.status === "supported") || jobs.some((j) => j.status === "RUNNING"), children: busy ? "\u542F\u52A8\u4E2D\u2026" : "\u5BA1\u8BA1\u5F53\u524D\u7B5B\u9009\u5168\u90E8\u56FE\u50CF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "iad-muted", children: "\u7ED3\u5408\u51BB\u7ED3\u77E5\u8BC6\u3001\u5168\u56FE\u4E0E\u5168\u90E8\u5C40\u90E8\u56FE\uFF0C\u7EFC\u5408\u5206\u6790\u4F4D\u7F6E\u548C\u5149\u7167\u3002" }),
        error && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { role: "alert", className: "iad-error", children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("article", { className: "iad-job", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("strong", { children: job.status }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: job.model_name }),
            (job.status === "RUNNING" || job.status === "PENDING") && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { onClick: async () => {
              try {
                await request(`/audit/cancel/${job.run_id}`, {});
                onJobsChanged();
              } catch (e) {
                setError(message(e));
              }
            }, children: "\u53D6\u6D88" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("progress", { value: job.progress, max: 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
            "\u5B8C\u6210 ",
            job.completed,
            " \xB7 \u5931\u8D25 ",
            job.failed,
            " \xB7 \u5171 ",
            job.total_samples,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "iad-muted", children: auditPhases[job.phase || ""] || job.message }),
          !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: "iad-muted", children: [
            "ROI ",
            job.inspected_regions || 0,
            " / ",
            job.planned_regions
          ] }),
          !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: "iad-muted", children: [
            "\u8054\u5408\u5224\u65AD ",
            job.completed_batches || 0,
            " / ",
            job.total_batches
          ] }),
          job.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("small", { className: "iad-muted", children: [
            "\u826F\u54C1\u7248\u672C ",
            job.normal_version_id,
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("br", {}),
            job.defect_version_id && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
              "\u4E0D\u826F\u7248\u672C ",
              job.defect_version_id,
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("br", {})
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("small", { className: "iad-muted", children: job.run_id }),
          job.errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("summary", { children: "\u5931\u8D25\u8BE6\u60C5" }),
            job.errors.map((error2, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
              error2.sample_id,
              ": ",
              error2.message
            ] }, i))
          ] })
        ] }, job.run_id)),
        !jobs.length && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }
  function AuditReport({ dataset }) {
    const [report, setReport] = (0, import_react8.useState)(null);
    const [error, setError] = (0, import_react8.useState)("");
    (0, import_react8.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-job-section iad-quality-report", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      report && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(QualityReport, { report }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { onClick: download, children: "\u5BFC\u51FA JSON" })
      ] })
    ] });
  }

  // src/client/components/KnowledgePage.tsx
  var import_react11 = __require("react");

  // src/client/useJobs.ts
  var import_react9 = __require("react");
  function useJobs(kind, datasetId, onProgress) {
    const [jobs, setJobs] = (0, import_react9.useState)([]);
    const [error, setError] = (0, import_react9.useState)("");
    const [revision, setRevision] = (0, import_react9.useState)(0);
    const observed = (0, import_react9.useRef)({ datasetId: "", signature: "" });
    const refresh = (0, import_react9.useCallback)(() => setRevision((value) => value + 1), []);
    (0, import_react9.useEffect)(() => {
      if (observed.current.datasetId !== datasetId) {
        observed.current = { datasetId, signature: "" };
        setJobs([]);
      }
      if (!datasetId) return;
      const controller = new AbortController();
      let timer, running = true;
      async function poll() {
        try {
          const result = await request(`/${kind}/jobs?dataset_id=${encodeURIComponent(datasetId)}`, void 0, void 0, controller.signal);
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
    }, [kind, datasetId, onProgress, revision]);
    return { jobs, error, refresh };
  }

  // src/client/workspace.tsx
  var import_react10 = __require("react");
  var pages = {
    "industrial-datasets": "\u6570\u636E\u96C6\u7BA1\u7406",
    "industrial-images": "\u56FE\u50CF\u6D4F\u89C8",
    "industrial-normal": "\u6316\u6398\u826F\u54C1\u77E5\u8BC6",
    "industrial-defect": "\u6316\u6398\u4E0D\u826F\u54C1\u77E5\u8BC6",
    "industrial-audit": "\u6A21\u578B\u5BA1\u8BA1",
    "industrial-review": "\u4EBA\u5DE5\u590D\u6838"
  };
  var defaultView = (page) => ({ filters: { ...initialFilters, review_status: page === "industrial-review" ? "pending" : "all" }, page: 1, selected: "", tab: "results", version: "", job: "" });
  var Workspace = class {
    state = { active: false, pageId: "industrial-datasets", datasetId: "", views: {} };
    listeners = /* @__PURE__ */ new Set();
    layout;
    defaults = Object.fromEntries(Object.keys(pages).map((id) => [id, defaultView(id)]));
    getSnapshot = () => this.state;
    subscribe = (listener) => {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    };
    view(page) {
      return this.state.views[`${page}:${this.state.datasetId}`] || this.defaults[page];
    }
    connect(layout) {
      this.layout = layout;
      this.restore();
      const unsubscribe = layout.panelInfo.subscribe(() => {
        const id = layout.panelInfo.getSnapshot().activePanelId;
        if (id && id in pages) {
          if (!this.state.active || id !== this.state.pageId) this.navigate(id);
        } else if (this.state.active) {
          this.state = { ...this.state, active: false };
          this.commit();
        }
      });
      const restore = () => this.restore(true);
      window.addEventListener("popstate", restore);
      return () => {
        unsubscribe();
        window.removeEventListener("popstate", restore);
        this.layout = void 0;
      };
    }
    navigate(pageId, selected) {
      this.state = { ...this.state, active: true, pageId };
      if (selected !== void 0) this.state = { ...this.state, views: { ...this.state.views, [`${pageId}:${this.state.datasetId}`]: { ...this.view(pageId), selected, tab: "results" } } };
      this.commit();
      this.layout?.selectPanel(pageId);
    }
    selectDataset(datasetId, replace = false) {
      if (datasetId === this.state.datasetId) return;
      this.state = { ...this.state, datasetId };
      this.commit(replace);
    }
    updateView(page, patch, replace = false) {
      this.state = { ...this.state, views: { ...this.state.views, [`${page}:${this.state.datasetId}`]: { ...this.view(page), ...patch } } };
      this.commit(replace);
    }
    commit(replace = false) {
      const { pageId, datasetId } = this.state;
      const url = new URL(location.href);
      if (this.state.active) url.searchParams.set("iad", JSON.stringify({ pageId, datasetId, ...this.view(pageId) }));
      else url.searchParams.delete("iad");
      history[replace ? "replaceState" : "pushState"](history.state, "", url);
      sessionStorage.setItem("iad.workspace", JSON.stringify(this.state));
      this.listeners.forEach((listener) => listener());
    }
    restore(fromHistory = false) {
      const raw = new URL(location.href).searchParams.get("iad");
      try {
        const saved = JSON.parse(sessionStorage.getItem("iad.workspace") || "null");
        if (!fromHistory && saved?.pageId in pages && typeof saved.datasetId === "string" && typeof saved.active === "boolean") this.state = saved;
        if (fromHistory) this.state = { ...this.state, active: false };
        if (raw) {
          const route = JSON.parse(raw);
          if (route.pageId in pages && typeof route.datasetId === "string") {
            const view = defaultView(route.pageId);
            for (const key of ["selected", "tab", "version", "job"]) if (typeof route[key] === "string") view[key] = route[key];
            if (Number.isInteger(route.page) && route.page > 0) view.page = route.page;
            if (route.filters) {
              for (const key of ["search", "model_status", "review_status", "technical", "sort_by"]) if (typeof route.filters[key] === "string") view.filters[key] = route.filters[key];
              if (Array.isArray(route.filters.annotation_filters) && route.filters.annotation_filters.every((item) => typeof item === "string")) view.filters.annotation_filters = route.filters.annotation_filters;
            }
            this.state = { ...this.state, active: true, pageId: route.pageId, datasetId: route.datasetId, views: { ...this.state.views, [`${route.pageId}:${route.datasetId}`]: view } };
          }
        }
      } catch {
        sessionStorage.removeItem("iad.workspace");
      }
      if (this.state.active) this.layout?.selectPanel(this.state.pageId);
      else if (fromHistory) this.layout?.selectPanel(null);
      this.listeners.forEach((listener) => listener());
    }
  };
  var WorkspaceContext = (0, import_react10.createContext)(null);
  function useWorkspace() {
    const workspace = (0, import_react10.useContext)(WorkspaceContext);
    if (!workspace) throw new Error("Workbench requires its workspace owner");
    const state = (0, import_react10.useSyncExternalStore)(workspace.subscribe, workspace.getSnapshot);
    return { workspace, state };
  }

  // src/client/components/KnowledgePage.tsx
  var import_jsx_runtime13 = __require("react/jsx-runtime");
  var statuses3 = { supported: "\u6709\u8BC1\u636E\u652F\u6301", provisional: "\u5F85\u9A8C\u8BC1", conflicted: "\u5B58\u5728\u77DB\u76FE" };
  function KnowledgePage({ dataset, kind }) {
    const { workspace } = useWorkspace();
    const pageId = kind === "normal" ? "industrial-normal" : "industrial-defect";
    const view = workspace.view(pageId);
    const [knowledge, setKnowledge] = (0, import_react11.useState)(null);
    const [normal, setNormal] = (0, import_react11.useState)(null);
    const [versions, setVersions] = (0, import_react11.useState)([]);
    const [error, setError] = (0, import_react11.useState)("");
    const [busy, setBusy] = (0, import_react11.useState)(false);
    const [revision, setRevision] = (0, import_react11.useState)(0);
    const [lightbox, setLightbox] = (0, import_react11.useState)(null);
    const [model, setModel] = (0, import_react11.useState)("");
    const updated = (0, import_react11.useCallback)(() => setRevision((value) => value + 1), []);
    const polling = useJobs("knowledge", dataset.dataset_id, updated);
    const jobs = polling.jobs.filter((job) => job.kind === kind);
    const running = jobs.some((job) => job.status === "RUNNING" || job.status === "PENDING");
    const [checkId, setCheckId] = (0, import_react11.useState)("");
    (0, import_react11.useEffect)(() => {
      const controller = new AbortController();
      const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, ...view.version ? { version_id: view.version } : {} });
      Promise.all([
        request(`/knowledge?${query}`, void 0, void 0, controller.signal),
        kind === "defect" ? request(`/knowledge?${new URLSearchParams({ dataset_id: dataset.dataset_id, kind: "normal" })}`, void 0, void 0, controller.signal) : Promise.resolve({ knowledge: null })
      ]).then(([current, reference]) => {
        if (!controller.signal.aborted) {
          setKnowledge(current.knowledge);
          setVersions(current.versions);
          setNormal(reference.knowledge);
          setError("");
        }
      }).catch((error2) => {
        if (!controller.signal.aborted) setError(message(error2));
      });
      return () => controller.abort();
    }, [dataset.dataset_id, kind, revision, view.version]);
    async function start() {
      setBusy(true);
      setError("");
      try {
        await request("/knowledge/start", { dataset_id: dataset.dataset_id, kind, ...kind === "defect" ? { normal_version_id: normal?.version_id } : {}, ...model.trim() ? { model_name: model.trim() } : {} });
        workspace.updateView(pageId, { version: "" });
        polling.refresh();
        updated();
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    const check = knowledge?.checks.find((check2) => check2.check_id === checkId) || knowledge?.checks[0];
    function evidence(ids) {
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "iad-knowledge-evidence iad-reference-grid", children: knowledge?.evidence.filter((item) => ids.includes(item.image.evidence_id)).map((item) => {
        const image = item.image;
        const src = `/api/iad/knowledge/evidence/${encodeURIComponent(knowledge.version_id)}/${encodeURIComponent(image.evidence_id)}`;
        return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("button", { title: `\u67E5\u770B ${image.role} \xB7 ${image.representation}`, onClick: () => setLightbox({ src, title: `${image.role} \xB7 ${image.representation} \xB7 ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("img", { src, alt: `${image.role} ${image.representation}` }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("small", { children: [
            image.role,
            " \xB7 ",
            image.representation
          ] })
        ] }, image.evidence_id);
      }) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "iad-knowledge-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("strong", { children: [
            "\u5168\u90E8\u5408\u683C",
            kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38",
            "\u5019\u9009"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { children: [
            "\u6A21\u578B",
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { "aria-label": "\u77E5\u8BC6\u6316\u6398\u6A21\u578B", placeholder: "\u4F7F\u7528\u9879\u76EE\u914D\u7F6E", value: model, onChange: (event) => setModel(event.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: "iad-primary", disabled: busy || running || kind === "defect" && !normal?.checks.some((check2) => check2.status === "supported"), onClick: start, children: busy ? "\u542F\u52A8\u4E2D\u2026" : `\u5F00\u59CB\u6316\u6398${kind === "normal" ? "\u826F\u54C1" : "\u4E0D\u826F\u54C1"}\u77E5\u8BC6` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "iad-field", children: [
          "\u77E5\u8BC6\u7248\u672C",
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: (event) => workspace.updateView(pageId, { version: event.target.value }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("option", { value: "", children: [
              "\u5F53\u524D\u53D1\u5E03\u7248\u672C",
              versions.length ? "" : " \xB7 \u5C1A\u672A\u53D1\u5E03"
            ] }),
            versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("option", { value: version.version_id, children: [
              version.created_at,
              " \xB7 ",
              version.version_id,
              " \xB7 ",
              version.source_count,
              " \u5F20\u6765\u6E90"
            ] }, version.version_id))
          ] })
        ] }),
        view.version && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u7248\u672C\uFF1B\u65B0\u4F5C\u4E1A\u4ECE\u5F53\u524D\u5DF2\u53D1\u5E03\u7248\u672C\u7EE7\u7EED\u6838\u9A8C\u3002" }),
        kind === "defect" && (normal ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "iad-muted", children: [
          "\u4F9D\u636E\u826F\u54C1\u7248\u672C ",
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("code", { children: normal.version_id })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
          "\u9700\u8981\u53EF\u7528\u7684\u826F\u54C1\u77E5\u8BC6\u3002",
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: () => workspace.navigate("industrial-normal"), children: "\u524D\u5F80\u826F\u54C1\u77E5\u8BC6" })
        ] })),
        (error || polling.error) && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { role: "alert", className: "iad-error", children: error || polling.error }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "iad-muted", children: "\u53C2\u8003\u8D44\u683C\u4E0E\u521D\u59CB\u65E0\u6807\u6CE8\u7EA6\u5B9A\u5728\u6570\u636E\u96C6\u7BA1\u7406\u7EF4\u62A4\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u7EF4\u62A4\u5019\u9009\u6765\u6E90" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("nav", { className: "iad-tabs", "aria-label": "\u77E5\u8BC6\u89C6\u56FE", children: [["results", "\u77E5\u8BC6\u6761\u76EE"], ["findings", kind === "normal" ? "\u5F85\u6838\u5B9E" : "\u6807\u6CE8\u6838\u9A8C"], ["versions", "\u7248\u672C"], ["jobs", "\u4F5C\u4E1A\u8BB0\u5F55"]].map(([tab, title]) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: view.tab === tab ? "active" : "", "aria-pressed": view.tab === tab, onClick: () => workspace.updateView(pageId, { tab }), children: title }, tab)) }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("section", { className: "iad-knowledge-content iad-job-section", children: knowledge ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: knowledge.summary }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "iad-muted", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("code", { children: knowledge.version_id }),
          " \xB7 ",
          knowledge.sources.length,
          " \u5F20\u6765\u6E90 \xB7 ",
          knowledge.checks.length,
          " \u9879\u5224\u636E \xB7 ",
          knowledge.findings.length,
          " \u9879\u6838\u9A8C"
        ] }),
        view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-knowledge-split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-check-list", children: [
            knowledge.checks.map((item) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("button", { "aria-pressed": check?.check_id === item.check_id, onClick: () => setCheckId(item.check_id), children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: item.title }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { children: [
                statuses3[item.status],
                " \xB7 \u652F\u6301 ",
                item.support_evidence_ids.length,
                " / \u53CD\u5BF9 ",
                item.counter_evidence_ids.length
              ] })
            ] }, item.check_id)),
            !knowledge.checks.length && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: "\u5C1A\u65E0\u53EF\u53D1\u5E03\u5224\u636E\uFF0C\u8BF7\u67E5\u770B\u9650\u5236\u548C\u6838\u9A8C\u7ED3\u679C\u3002" })
          ] }),
          check && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("article", { className: "iad-info-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { children: check.title }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
              check.subject,
              " \xB7 ",
              check.location
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: check.criterion }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
              "\u5141\u8BB8\u53D8\u5316\uFF1A",
              check.allowed_variations.join("\uFF1B") || "\u672A\u8BB0\u5F55"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { children: "\u652F\u6301\u8BC1\u636E" }),
            evidence(check.support_evidence_ids),
            !!check.counter_evidence_ids.length && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { children: "\u53CD\u5BF9\u8BC1\u636E" }),
              evidence(check.counter_evidence_ids)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
          ] })
        ] }),
        view.tab === "findings" && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
          knowledge.findings.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("article", { className: "iad-info-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { children: finding.judgment.status === "supported" ? "\u56FE\u50CF\u652F\u6301\u5F02\u5E38" : finding.judgment.status === "refuted" ? "\u6B63\u5E38\u89E3\u91CA\u6210\u7ACB" : "\u8BC1\u636E\u4E0D\u8DB3" }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: finding.judgment.description }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
              "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
              finding.judgment.normal_explanation
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "iad-muted", children: finding.judgment.limitations.join("\uFF1B") }),
            evidence(finding.judgment.evidence_ids),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })
          ] }, finding.finding_id)),
          !knowledge.findings.length && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })
        ] }),
        !!knowledge.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("summary", { children: "\u77E5\u8BC6\u9650\u5236" }),
          knowledge.limitations.map((limitation, index) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: limitation }, index))
        ] }),
        view.tab === "versions" && versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("article", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: () => workspace.updateView(pageId, { version: version.version_id, tab: "results" }), children: version.version_id }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
            version.source_count,
            " \u5F20\u6765\u6E90 \xB7 ",
            version.check_count,
            " \u9879\u5224\u636E \xB7 ",
            version.created_at
          ] }),
          version.parent_version_id && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "iad-muted", children: [
            "\u7236\u7248\u672C ",
            version.parent_version_id
          ] }),
          version.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "iad-muted", children: [
            "\u4F9D\u636E\u826F\u54C1\u7248\u672C ",
            version.normal_version_id
          ] })
        ] }, version.version_id))
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
        "\u5C1A\u65E0",
        kind === "normal" ? "\u826F\u54C1" : "\u4E0D\u826F\u54C1",
        "\u77E5\u8BC6\u7248\u672C\u3002"
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "iad-knowledge-jobs iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }),
        jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("article", { className: "iad-job", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: job.status }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("code", { children: job.run_id }),
            (job.status === "RUNNING" || job.status === "PENDING") && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: async () => {
              try {
                await request(`/knowledge/cancel/${job.run_id}`, {});
                polling.refresh();
              } catch (error2) {
                setError(message(error2));
              }
            }, children: "\u53D6\u6D88\u6316\u6398" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("progress", { value: job.progress, max: 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
            "\u5B8C\u6210 ",
            job.completed,
            " \xB7 \u5931\u8D25 ",
            job.failed,
            " \xB7 \u672A\u5904\u7406 ",
            job.unprocessed,
            " \xB7 \u5171 ",
            job.total_samples,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "iad-muted", children: job.message }),
          job.knowledge_version_id && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: () => workspace.updateView(pageId, { version: job.knowledge_version_id, tab: "results" }), children: "\u67E5\u770B\u5DF2\u53D1\u5E03\u7248\u672C" }),
          job.errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("summary", { children: "\u5931\u8D25\u8BE6\u60C5" }),
            job.errors.map((error2, index) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: error2.message }, index))
          ] })
        ] }, job.run_id)),
        !jobs.length && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: "\u5C1A\u65E0\u6316\u6398\u4F5C\u4E1A\u3002" })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/theme.ts
  var themeStyles = `
.iad-workbench,.iad-detail-dialog::backdrop {
 --iad-canvas:var(--dsw-alias-bg-module-platform,#edf2f7);
 --iad-surface:var(--dsw-alias-bg-layer-1,#fff);
 --iad-surface-muted:var(--dsw-alias-bg-module-platform,#e7edf5);
 --iad-text:var(--dsw-alias-label-primary,#1c2a3c);
 --iad-muted:var(--dsw-alias-label-secondary,#53647c);
 --iad-border:var(--dsw-alias-border-l3,#a1adbe);
 --iad-primary:var(--dsw-alias-brand-primary,#215bd5);
 --iad-on-primary:var(--dsw-alias-label-primary-inverted,#fff);
 --iad-hover:var(--dsw-alias-interactive-bg-hover,#e4eaf4);
 --iad-danger:var(--dsw-alias-state-error-primary,#a22c34);
 --iad-danger-bg:var(--dsw-alias-state-error-secondary,#ffeded);
 --iad-success:var(--dsw-alias-state-success-primary,#12634b);
 --iad-warning:var(--dsw-alias-state-warn-primary,#af4a12);
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-danger-badge:color-mix(in srgb,var(--iad-danger) 45%,#000);
 --iad-viewer:#15202e;
 --iad-on-viewer:#fff;
 --iad-scrim:#101b2bd9;
}
`;

  // src/client/styles.ts
  var workbenchStyles = themeStyles + `
.iad-workbench {height:100%;box-sizing:border-box;overflow:auto;min-width:0;padding:24px;color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,14px)/1.55 system-ui,sans-serif;}
.iad-workbench * {box-sizing:border-box;}
.iad-workbench h1 {font-size:24px;margin:3px 0 0;font-weight:700;}
.iad-workbench h2 {font-size:17px;margin:0 0 16px;}
.iad-workbench h3 {font-size:14px;margin:20px 0 9px;overflow:hidden;text-overflow:ellipsis;}
.iad-workbench button,.iad-workbench input,.iad-workbench select,.iad-workbench textarea {font:inherit;}
.iad-workbench button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-border);border-radius:8px;min-height:40px;padding:8px 12px;}
.iad-workbench button:hover {background:var(--iad-hover);}
.iad-workbench button:disabled {cursor:default;opacity:.45;}
.iad-workbench button.iad-primary {background:var(--iad-primary);border-color:var(--iad-primary);color:var(--iad-on-primary);}
.iad-workbench button.iad-danger {color:var(--iad-danger);}
.iad-workbench input,.iad-workbench select,.iad-workbench textarea {min-width:0;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px;padding:8px 9px;min-height:40px;}
.iad-workbench input[type=checkbox] {width:auto;}
.iad-workbench textarea {min-height:80px;resize:vertical;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-header {justify-content:space-between;margin-bottom:25px;}
.iad-eyebrow {font-size:12px;letter-spacing:1.5px;color:var(--iad-primary);}
.iad-kpis {display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-bottom:24px;}
.iad-kpis>div {padding:16px 20px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;box-shadow:0 2px 5px var(--iad-surface-muted);}
.iad-kpis span,.iad-kpis strong {display:block;}
.iad-kpis span,.iad-muted {color:var(--iad-muted);font-size:12px;}
.iad-kpis strong {font-size:25px;}.iad-kpis small {font-size:15px;color:var(--iad-muted);font-weight:400;}
.iad-tabs {display:flex;gap:12px;margin-bottom:23px;}
.iad-tabs button {border:none;background:transparent;padding:9px 14px;}
.iad-tabs button.active {background:var(--iad-hover);color:var(--iad-primary);}
.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:26px;align-items:start;}
.iad-gallery {min-width:0;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;padding:16px;}.iad-filters {display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:10px;background:var(--iad-surface-muted);border-radius:8px;padding:12px;}
.iad-filter {font-size:12px;color:var(--iad-muted);display:flex;flex-direction:column;gap:4px;}
.iad-filter select {font-size:12px;max-width:160px;color:var(--iad-text);}
.iad-pagination {display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 0;font-size:12px;}
.iad-pagination button {font-size:12px;}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:14px;}
.iad-workbench button.iad-sample {padding:0;text-align:left;overflow:hidden;border:2px solid transparent;box-shadow:0 2px 8px var(--iad-surface-muted);}
.iad-workbench button.iad-sample.is-selected {border-color:var(--iad-primary);}
.iad-sample>strong,.iad-sample>span {display:block;margin:6px 9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-thumb {position:relative;aspect-ratio:1.35;background:var(--iad-surface-muted);}.iad-thumb img {width:100%;height:100%;object-fit:contain;}
.iad-badge,.iad-reference {position:absolute;top:6px;left:6px;padding:2px 5px;background:var(--iad-viewer);color:var(--iad-on-viewer);border-radius:4px;font-size:12px;}
.iad-badge.is-risk {background:var(--iad-danger-badge);}.iad-reference {top:auto;bottom:6px;background:var(--iad-success-badge);}
.iad-inspector {background:var(--iad-surface);border:1px solid var(--iad-border);box-shadow:0 3px 12px var(--iad-surface-muted);border-radius:10px;padding:18px;min-width:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:var(--iad-surface-muted)!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-image-frame svg {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon {fill:var(--iad-surface-muted);stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-warning);font-size:14px;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-error {color:var(--iad-danger);background:var(--iad-danger-bg);padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-settings {display:grid;grid-template-columns:minmax(240px,1fr) minmax(0,2fr);gap:24px;}
.iad-settings>section {padding:20px;background:var(--iad-surface);border-radius:8px;min-width:0;}
.iad-dataset-list {display:flex;flex-direction:column;gap:8px;}
.iad-dataset-list button {display:flex;flex-direction:column;align-items:start;gap:6px;text-align:start;padding:14px;background:var(--iad-surface-muted);border-color:transparent;overflow-wrap:anywhere;}
.iad-dataset-list button[aria-pressed=true] {background:color-mix(in srgb,var(--iad-primary) 10%,var(--iad-surface));border-color:var(--iad-primary);}
.iad-dataset-list span {font-size:13px;color:var(--iad-muted);}
.iad-detail-dialog:has(.iad-dataset-import) {width:min(640px,calc(100vw - 32px));}
.iad-dataset-import {max-width:640px;margin:auto;}
.iad-directory {background:var(--iad-surface-muted);padding:14px;border-radius:8px;}.iad-directory code {overflow-wrap:anywhere;}
.iad-directory-list {display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px;}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:var(--iad-surface-muted);border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-job-panel {max-width:1000px;}.iad-job-panel>h2 {margin-top:26px;}.iad-job {padding:16px;margin-bottom:12px;background:var(--iad-surface-muted);border-radius:8px;}
.iad-job progress {width:100%;height:7px;accent-color:var(--iad-primary);}.iad-job small {overflow-wrap:anywhere;}
.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;color:var(--iad-on-viewer);}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;margin-top:18px;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-viewer-world {position:absolute;left:50%;top:50%;transform-origin:center;}
.iad-viewer-world .iad-image-frame,.iad-viewer-world img {width:100%;height:100%;}
.iad-eye {display:flex;align-items:center;justify-content:center;}
.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {position:relative;align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px;padding:8px 9px;min-height:40px;font-size:12px;}
.iad-multiselect-menu {position:absolute;z-index:20;top:100%;left:0;min-width:190px;max-height:300px;overflow:auto;padding:12px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:8px;box-shadow:0 8px 24px var(--iad-border);}
.iad-multiselect-menu label {display:flex;gap:9px;align-items:center;padding:6px 0;color:var(--iad-text);white-space:normal;font-size:12px;}
.iad-multiselect-menu input {accent-color:var(--iad-primary);}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;}
@media(max-width:1100px) {.iad-workbench {padding:20px;}.iad-main {grid-template-columns:minmax(0,1fr) 300px;}.iad-grid {grid-template-columns:repeat(auto-fill,minmax(125px,1fr));}}
@media(max-width:760px) {.iad-main,.iad-settings {grid-template-columns:1fr;}.iad-kpis {grid-template-columns:repeat(2,1fr);gap:10px;}.iad-inspector {width:100%;}}

.iad-workbench :is(button,input,select,textarea,summary):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
.iad-workbench :is(input[type=checkbox]) {min-height:20px;width:20px;accent-color:var(--iad-primary);}
.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:0;border-radius:8px;padding:16px;}
.iad-detail-dialog::backdrop {background:var(--iad-scrim);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}
.iad-reference-manager {margin-top:24px;}.iad-reference-manager>summary {cursor:pointer;padding:16px;background:var(--iad-surface);border-radius:8px;}
.iad-workbench .iad-eye {min-width:44px;min-height:44px;}
@media(max-width:760px) {.iad-workbench {padding:16px;}.iad-header {align-items:start;}.iad-header>.iad-row {width:100%;}.iad-header select {flex:1;max-width:100%;}.iad-tabs {flex-wrap:wrap;}.iad-settings {width:100%;}.iad-pagination {flex-wrap:wrap;}.iad-detail-overlay {padding:8px;}.iad-lightbox {padding:12px;}.iad-lightbox-toolbar strong {flex-basis:100%;}.iad-workbench dl {grid-template-columns:80px minmax(0,1fr);}.iad-kpis>div {padding:12px;}}
@media(prefers-reduced-motion:reduce) {.iad-workbench * {scroll-behavior:auto;transition:none;animation:none;}}

.iad-knowledge-split {display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,2fr);gap:24px;align-items:start;}
.iad-check-list {display:grid;gap:8px;}.iad-check-list>button {display:grid;gap:4px;text-align:left;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);border-color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
@media(max-width:760px) {.iad-knowledge-split {grid-template-columns:minmax(0,1fr);}.iad-knowledge-page .iad-row>label {width:100%;}}
`;

  // src/client/WorkbenchPage.tsx
  var import_jsx_runtime14 = __require("react/jsx-runtime");
  function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [datasets, setDatasets] = (0, import_react12.useState)([]);
    const [result, setResult] = (0, import_react12.useState)({ datasetId: "", items: [], total: 0 });
    const [loading, setLoading] = (0, import_react12.useState)(false);
    const [error, setError] = (0, import_react12.useState)("");
    const [revision, setRevision] = (0, import_react12.useState)(0);
    const dataset = datasets.find((d) => d.dataset_id === datasetId);
    const loadDatasets = (0, import_react12.useCallback)(async (preferred, signal) => {
      try {
        const result2 = await request("/datasets", void 0, void 0, signal);
        if (signal?.aborted) return;
        setDatasets(result2.datasets);
        const current = workspace.getSnapshot().datasetId;
        workspace.selectDataset(preferred || (result2.datasets.some((d) => d.dataset_id === current) ? current : result2.datasets[0]?.dataset_id || ""), true);
        setError("");
      } catch (e) {
        if (!signal?.aborted) setError(message(e));
      }
    }, [workspace]);
    const changed = (0, import_react12.useCallback)(() => {
      setRevision((v) => v + 1);
      void loadDatasets();
    }, [loadDatasets]);
    const audit = useJobs("audit", datasetId, changed);
    (0, import_react12.useEffect)(() => {
      const controller = new AbortController();
      void loadDatasets(void 0, controller.signal);
      return () => controller.abort();
    }, [loadDatasets]);
    const gallery = pageId === "industrial-datasets" || pageId === "industrial-images" || pageId === "industrial-review" || pageId === "industrial-audit" && view.tab === "results";
    (0, import_react12.useEffect)(() => {
      if (!dataset || !gallery) return;
      const controller = new AbortController();
      setLoading(true);
      const query = new URLSearchParams({ ...view.filters, annotation_filters: JSON.stringify(view.filters.annotation_filters), dataset_id: datasetId, page: String(view.page), page_size: "24" });
      request(`/samples/${dataset.task_id}?${query}`, void 0, void 0, controller.signal).then((result2) => {
        if (controller.signal.aborted) return;
        setResult({ ...result2, datasetId });
        setError("");
        if (!view.selected && (pageId === "industrial-audit" || pageId === "industrial-review") && result2.items.length) workspace.updateView(pageId, { selected: result2.items[0].sample_id }, true);
      }).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [datasetId, dataset?.task_id, view.filters, view.page, gallery, revision, workspace, pageId]);
    const updateFilters = (filters) => workspace.updateView(pageId, { filters, page: 1, selected: "" });
    const inspector = dataset && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SampleInspector, { dataset, sampleId: view.selected, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-datasets" ? "dataset" : pageId === "industrial-images" ? "browse" : "model", revision, onChanged: changed, jobs: audit.jobs, onJobsChanged: audit.refresh }, `${datasetId}:${view.selected}`);
    const grid = dataset && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SampleGrid, { dataset, filters: view.filters, onFilters: updateFilters, items: result.datasetId === datasetId ? result.items : [], total: result.datasetId === datasetId ? result.total : 0, page: view.page, onPage: (page) => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: (selected) => workspace.updateView(pageId, { selected }), loading });
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-workbench", "data-page": pageId, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("header", { className: "iad-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h1", { children: pages[pageId] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: (e) => workspace.selectDataset(e.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }),
            datasets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("option", { value: item.dataset_id, children: [
              item.name,
              " (",
              item.total_samples,
              ")"
            ] }, item.dataset_id))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: changed, children: "\u5237\u65B0" })
        ] })
      ] }),
      (error || audit.error) && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { role: "alert", className: "iad-error", children: error || audit.error }),
      dataset && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-kpis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "\u56FE\u50CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: dataset.total_samples })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "\u6A21\u578B\u5BA1\u8BA1" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("strong", { children: [
            dataset.vlm_audited_count,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("small", { children: [
              "/ ",
              dataset.total_samples
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "\u5F85\u590D\u6838\u5F02\u5E38\u5EFA\u8BAE" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: dataset.pending_risk_count })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "\u5DF2\u4EBA\u5DE5\u590D\u6838" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: dataset.human_reviewed_count })
        ] })
      ] }),
      pageId === "industrial-datasets" ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(DatasetManager, { datasets, selected: dataset, onChanged: (id) => {
          void loadDatasets(id);
          setRevision((v) => v + 1);
        } }),
        dataset && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: () => workspace.navigate("industrial-images"), children: "\u6D4F\u89C8\u56FE\u50CF" }),
        dataset && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("details", { className: "iad-reference-manager", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("summary", { children: [
            "\u826F\u54C1\u53C2\u8003\u8D44\u683C \xB7 ",
            dataset.reference_sample_ids.length,
            " \u5F20"
          ] }),
          grid
        ] }),
        dataset && view.selected && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Modal, { title: "\u826F\u54C1\u53C2\u8003\u8D44\u683C", onClose: () => workspace.updateView(pageId, { selected: "" }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: () => workspace.updateView(pageId, { selected: "" }), children: "\u8FD4\u56DE\u6570\u636E\u96C6\u7BA1\u7406" }),
          inspector
        ] })
      ] }) : !dataset ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u6570\u636E\u96C6\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
        (pageId === "industrial-normal" || pageId === "industrial-defect") && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(KnowledgePage, { dataset, kind: pageId === "industrial-normal" ? "normal" : "defect" }, datasetId),
        pageId === "industrial-audit" && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("nav", { className: "iad-tabs", "aria-label": "\u5BA1\u8BA1\u89C6\u56FE", children: [["results", "\u7ED3\u679C"], ["jobs", "\u6A21\u578B\u5BA1\u8BA1\u4F5C\u4E1A"], ["reports", "\u62A5\u544A"]].map(([tab, label]) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { "aria-pressed": view.tab === tab, className: view.tab === tab ? "active" : "", onClick: () => workspace.updateView(pageId, { tab }), children: label }, tab)) }),
        gallery && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: pageId === "industrial-images" ? "iad-browse" : "iad-main", children: [
          grid,
          pageId !== "industrial-images" && inspector
        ] }),
        pageId === "industrial-images" && view.selected && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", onClose: () => workspace.updateView(pageId, { selected: "" }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: () => workspace.updateView(pageId, { selected: "" }), children: "\u8FD4\u56DE\u56FE\u50CF\u6D4F\u89C8" }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: () => workspace.navigate("industrial-audit", view.selected), children: "\u524D\u5F80\u6A21\u578B\u5BA1\u8BA1" }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { onClick: () => workspace.navigate("industrial-review", view.selected), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" })
          ] }),
          inspector
        ] }),
        pageId === "industrial-audit" && view.tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AuditJobs, { dataset, filters: view.filters, jobs: audit.jobs, onJobsChanged: audit.refresh }, datasetId),
        pageId === "industrial-audit" && view.tab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AuditReport, { dataset })
      ] })
    ] });
  }

  // src/client/index.ts
  var name = "iad-client";
  var inject = ["slots", "layout"];
  function apply(ctx) {
    const workspace = new Workspace();
    const icons = [DatasetIcon, ImagesIcon, KnowledgeIcon, KnowledgeIcon, AuditIcon, ReviewIcon];
    ctx.slots.inject("sidebar.panellist", () => {
      Object.entries(pages).forEach(([id, label], index) => ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[index]));
    });
    ctx.slots.inject("main", () => {
      for (const id of Object.keys(pages)) {
        ctx.slots.register({ name: "main", key: id }, () => import_react13.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react13.default.createElement(WorkbenchPage, { pageId: id })));
      }
      return workspace.connect(ctx.layout);
    });
  }
  return __toCommonJS(index_exports);
})();

    return __IadClientBundle__;
  }
});

//# sourceMappingURL=client.js.map
