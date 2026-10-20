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
  var import_react23 = __toESM(__require("react"), 1);

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
  var import_react22 = __require("react");

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
  var mediaUrl = (sample, view = "image") => `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${view}${view === "thumbnail" ? "?size=240" : ""}`;
  var message = (error) => error instanceof Error ? error.message : String(error);
  var reviewLabels = { PASS: "\u826F\u54C1", HARD_NORMAL: "\u56F0\u96BE\u6B63\u5E38", FAIL: "\u5F02\u5E38", UNCERTAIN: "\u4E0D\u786E\u5B9A", SKIP: "\u8DF3\u8FC7" };
  var reviewLabel = (decision) => reviewLabels[decision] || decision;
  var auditEvidenceUrl = (suggestionId, image) => `/api/iad/evidence/${encodeURIComponent(suggestionId)}/${encodeURIComponent(image.evidence_id)}`;
  var regionSources = { annotation: "Labelme \u7EBF\u7D22", model: "MLLM \u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" };
  var auditImageIndex = (analysis) => new Map([analysis.overview, ...analysis.regions.map((region) => region.image), ...analysis.auxiliary_evidence].map((image) => [image.evidence_id, image]));

  // src/client/components/DatasetManager.tsx
  var import_react2 = __require("react");

  // src/client/components/Modal.tsx
  var import_react = __require("react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function Modal({ title, onClose, children, className = "", restoreFocus }) {
    const dialog = (0, import_react.useRef)(null);
    const focusTarget = (0, import_react.useRef)(restoreFocus);
    focusTarget.current = restoreFocus;
    (0, import_react.useEffect)(() => {
      const previous = document.activeElement;
      const element = dialog.current;
      element.showModal();
      return () => {
        element.close();
        const target = focusTarget.current ? focusTarget.current() : previous;
        if (target instanceof HTMLElement && target.isConnected) target.focus();
      };
    }, []);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dialog", { ref: dialog, "aria-label": title, className: `iad-detail-dialog ${className}`, onCancel: (event) => {
      event.preventDefault();
      event.stopPropagation();
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
    const [scan, setScan] = (0, import_react2.useState)(null);
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
    async function rescan() {
      setBusy(true);
      setError("");
      setScan(null);
      try {
        setScan(await request(`/datasets/${dataset.dataset_id}/rescan`, {}));
        onChanged();
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6\u8BE6\u60C5", "aria-busy": busy, children: [
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
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: busy, onClick: () => void rescan(), children: busy ? "\u6B63\u5728\u5904\u7406\u2026" : "\u91CD\u65B0\u626B\u63CF\u76EE\u5F55" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "iad-muted", children: "\u66F4\u65B0\u5F53\u524D\u76EE\u5F55\u7684\u56FE\u50CF\u4E0E\u6807\u6CE8\uFF1B\u4EBA\u5DE5\u8BB0\u5F55\u3001\u65E7\u77E5\u8BC6\u4E0E\u5BA1\u8BA1\u4FDD\u7559\u3002\u626B\u63CF\u540E\u53EF\u5728\u77E5\u8BC6\u9875\u67E5\u770B\u53D8\u5316\u5E76\u91CD\u65B0\u6838\u9A8C\u3002" }),
      scan && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { role: "status", "aria-label": "\u626B\u63CF\u7ED3\u679C", children: [
        "\u626B\u63CF\u5B8C\u6210 \xB7 ",
        scan.image_count,
        " \u5F20\u56FE\u50CF \xB7 ",
        scan.annotation_count,
        " \u4E2A\u6807\u6CE8 \xB7 ",
        scan.issue_count,
        " \u9879\u95EE\u9898"
      ] }),
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

  // src/client/components/Pagination.tsx
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  var pageSize = 24;
  function Pagination({ total, page, unit, onPage }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-pagination", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
        total,
        " ",
        unit
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: page <= 1, onClick: () => onPage(page - 1), children: "\u4E0A\u4E00\u9875" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
        page,
        " / ",
        Math.max(1, Math.ceil(total / pageSize))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: page * pageSize >= total, onClick: () => onPage(page + 1), children: "\u4E0B\u4E00\u9875" })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading }) {
    const select = (key, label, options) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "iad-filter", children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { "aria-label": label, value: filters[key], onChange: (e) => onFilters({ ...filters, [key]: e.target.value }), children: options.map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value, children: title }, value)) })
    ] });
    const pagination = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Pagination, { total, page, unit: "\u5F20", onPage });
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "iad-gallery", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "iad-multiselect", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("summary", { "aria-label": "\u6807\u6CE8\u7B5B\u9009", children: [
            "\u6807\u6CE8 \xB7 ",
            filters.annotation_filters.length ? `\u5DF2\u9009 ${filters.annotation_filters.length} \u9879` : "\u5168\u90E8"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-multiselect-menu", children: [
            [["none", "\u65E0\u6807\u6CE8"], ["present", "\u6709\u6807\u6CE8"], ...dataset.annotation_categories.map((value) => [`category:${value}`, `\u7C7B\u522B ${value}`])].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", "aria-label": title, checked: filters.annotation_filters.includes(value), onChange: (e) => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        select("model_status", "\u6A21\u578B\u5BA1\u8BA1", [["all", "\u5168\u90E8"], ["pending", "\u5F85\u5BA1\u8BA1"], ["audited", "\u5DF2\u5BA1\u8BA1"], ["risk", "\u53EF\u7591"], ["PASS", "\u6A21\u578B\u5EFA\u8BAE\u826F\u54C1"], ["FAIL", "\u6A21\u578B\u5EFA\u8BAE\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"]]),
        select("review_status", "\u4EBA\u5DE5\u590D\u6838", [["all", "\u5168\u90E8"], ["pending", "\u5F85\u590D\u6838"], ["reviewed", "\u5DF2\u590D\u6838"], ["PASS", "\u826F\u54C1"], ["HARD_NORMAL", "\u56F0\u96BE\u6B63\u5E38"], ["FAIL", "\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"], ["SKIP", "\u5DF2\u8DF3\u8FC7"]]),
        select("technical", "\u6280\u672F\u8D28\u91CF", [["all", "\u5168\u90E8"], ["issues", "\u5B58\u5728\u95EE\u9898"]]),
        select("sort_by", "\u6392\u5E8F", [["default", "\u9ED8\u8BA4"], ["risk", "\u53EF\u7591\u5EA6\u4F18\u5148"], ["tech", "\u6280\u672F\u95EE\u9898\u4F18\u5148"]]),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6309\u6587\u4EF6\u540D\u641C\u7D22", value: filters.search, onChange: (e) => onFilters({ ...filters, search: e.target.value }) })
      ] }),
      pagination,
      loading ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "iad-grid", children: items.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { "data-sample-id": sample.sample_id, className: `iad-sample ${selected === sample.sample_id ? "is-selected" : ""}`, onClick: () => onSelect(sample.sample_id), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-thumb", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("img", { loading: "lazy", src: mediaUrl(sample, "thumbnail"), alt: sample.relative_path }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `iad-badge ${sample.suggestion?.suggested_label === "FAIL" ? "is-risk" : ""}`, children: sample.review_decision ? `\u4EBA\u5BA1 ${sample.review_decision}` : sample.suggestion ? `\u6A21\u578B ${sample.suggestion.suggested_label}` : "\u5F85\u6A21\u578B\u5BA1\u8BA1" }),
          dataset.reference_sample_ids.includes(sample.sample_id) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "iad-reference", children: "\u826F\u54C1\u53C2\u8003" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { title: sample.relative_path, children: sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "iad-muted", children: sample.annotation_count ? sample.annotation_categories.join("\u3001") : "\u65E0\u6807\u6CE8" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "iad-muted", children: [
          "\u53EF\u7591\u5EA6 ",
          sample.visual_suspicion_score ?? "\u672A\u6D4B",
          " \xB7 \u6280\u672F ",
          sample.technical_quality_score
        ] })
      ] }, sample.sample_id)) }),
      !loading && !items.length && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6837\u672C\u3002" }),
      pagination
    ] });
  }

  // src/client/components/JobCard.tsx
  var import_react4 = __require("react");

  // src/client/workspace.tsx
  var import_react3 = __require("react");

  // src/client/inspection.ts
  function inspectionImage(inspection, selection, transform) {
    const { analysis, reference } = inspection;
    return {
      src: auditEvidenceUrl(reference.suggestion_id, analysis.overview),
      title: "\u9001\u6A21\u5168\u56FE\u6982\u89C8",
      width: analysis.overview.sent_size[0],
      height: analysis.overview.sent_size[1],
      annotationLayer: { kind: "audit", analysis, suggestionId: reference.suggestion_id },
      inspection,
      initialSelection: selection,
      initialTransform: transform
    };
  }
  function restoreInspection(value, datasetId, sampleId) {
    if (!value || typeof value !== "object") return null;
    const { reference, selection, transform, sessionId } = value;
    if (!reference || reference.dataset_id !== datasetId || reference.sample_id !== sampleId || !reference.suggestion_id || typeof reference.suggestion_id !== "string") return null;
    for (const id of [reference.finding_id, reference.evidence_id]) if (id != null && typeof id !== "string") return null;
    if (selection && (!["finding", "evidence"].includes(selection.kind) || typeof selection.id !== "string" || "findingId" in selection && typeof selection.findingId !== "string")) return null;
    if (!transform || ![transform.zoom, transform.x, transform.y].every(Number.isFinite) || transform.zoom < 0) return null;
    return { reference, selection: selection || null, transform, ...typeof sessionId === "string" ? { sessionId } : {} };
  }
  function resolveInspection(analysis, selection) {
    const findingId = selection?.kind === "finding" ? selection.id : selection?.findingId;
    const finding = analysis?.findings.find((item) => item.finding_id === findingId);
    const evidence = analysis && selection?.kind === "evidence" ? auditImageIndex(analysis).get(selection.id) : void 0;
    const region = analysis?.regions.find((item) => selection?.kind === "evidence" ? item.image.evidence_id === selection.id : finding?.location.scope === "local" && finding.evidence_ids.includes(item.image.evidence_id));
    return { finding, evidence, region };
  }

  // src/shared/navigation.ts
  var pages = {
    "industrial-datasets": "\u6570\u636E\u96C6\u7BA1\u7406",
    "industrial-images": "\u56FE\u50CF\u6D4F\u89C8",
    "industrial-normal": "\u6316\u6398\u826F\u54C1\u77E5\u8BC6",
    "industrial-defect": "\u6316\u6398\u4E0D\u826F\u54C1\u77E5\u8BC6",
    "industrial-audit": "\u6A21\u578B\u5BA1\u8BA1",
    "industrial-review": "\u4EBA\u5DE5\u590D\u6838"
  };

  // src/shared/knowledge-presentation.ts
  var knowledgeStatuses = {
    supported: "\u6709\u8BC1\u636E\u652F\u6301",
    provisional: "\u5F85\u9A8C\u8BC1",
    conflicted: "\u5B58\u5728\u77DB\u76FE"
  };

  // src/client/workspace.tsx
  var defaultView = (page) => ({ filters: { ...initialFilters, review_status: page === "industrial-review" ? "pending" : "all" }, page: 1, selected: "", tab: "results", version: "", normalVersion: "", defectVersion: "", job: "", historyPage: 1, historySearch: "", knowledgeSearch: "", knowledgeStatus: "", inspection: null });
  var Workspace = class {
    constructor(conversation) {
      this.conversation = conversation;
    }
    conversation;
    state = { active: false, pageId: "industrial-datasets", datasetId: "", views: {} };
    listeners = /* @__PURE__ */ new Set();
    layout;
    imageViews = /* @__PURE__ */ new Map();
    pagePositions = /* @__PURE__ */ new Map();
    imageView(source) {
      return this.imageViews.get(source);
    }
    rememberImageView(source, view) {
      this.imageViews.set(source, view);
    }
    pagePosition(source) {
      return this.pagePositions.get(source) || 0;
    }
    rememberPagePosition(source, top) {
      this.pagePositions.set(source, top);
    }
    defaults = Object.fromEntries(Object.keys(pages).map((id) => [id, defaultView(id)]));
    getSnapshot = () => this.state;
    subscribe = (listener) => {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    };
    view(page) {
      return { ...this.defaults[page], ...this.state.views[`${page}:${this.state.datasetId}`] };
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
    openLocation({ pageId, datasetId, ...view }) {
      this.state = { ...this.state, active: true, pageId, datasetId };
      this.state = { ...this.state, views: { ...this.state.views, [`${pageId}:${datasetId}`]: { ...this.view(pageId), ...view, inspection: null } } };
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
    async ask(reference, selection, transform, question) {
      const { pageId, datasetId } = this.state;
      const view = this.view(pageId);
      const snapshot = await request("/inspection/context", reference);
      if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id) throw new Error("\u68C0\u89C6\u4F4D\u7F6E\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u56FE\u50CF\u91CD\u65B0\u8FFD\u95EE");
      await this.conversation.send(snapshot, question, (sessionId) => {
        if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id) throw new Error("\u68C0\u89C6\u4F4D\u7F6E\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u56FE\u50CF\u91CD\u65B0\u8FFD\u95EE");
        this.updateView(pageId, { inspection: { reference, selection, transform, sessionId } }, true);
        const route = new URLSearchParams({ iad: JSON.stringify({ pageId, datasetId, ...this.view(pageId) }) });
        return `${location.origin}${location.pathname}?${route}`;
      }, view.inspection?.reference.sample_id === reference.sample_id ? view.inspection.sessionId : void 0);
    }
    openSession(sessionId) {
      return this.conversation.open(sessionId);
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
            for (const key of ["selected", "tab", "version", "normalVersion", "defectVersion", "job", "historySearch", "knowledgeSearch"]) if (typeof route[key] === "string") view[key] = route[key];
            if (typeof route.knowledgeStatus === "string" && (route.knowledgeStatus === "" || Object.hasOwn(knowledgeStatuses, route.knowledgeStatus))) view.knowledgeStatus = route.knowledgeStatus;
            view.inspection = restoreInspection(route.inspection, route.datasetId, view.selected);
            if (Number.isInteger(route.page) && route.page > 0) view.page = route.page;
            if (Number.isInteger(route.historyPage) && route.historyPage > 0) view.historyPage = route.historyPage;
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
  var WorkspaceContext = (0, import_react3.createContext)(null);
  function useWorkspace() {
    const workspace = (0, import_react3.useContext)(WorkspaceContext);
    if (!workspace) throw new Error("Workbench requires its workspace owner");
    const state = (0, import_react3.useSyncExternalStore)(workspace.subscribe, workspace.getSnapshot);
    return { workspace, state };
  }

  // src/shared/job-display.ts
  var jobStatuses = {
    PENDING: "\u7B49\u5F85\u6267\u884C",
    RUNNING: "\u6267\u884C\u4E2D",
    COMPLETED: "\u5DF2\u5B8C\u6210",
    PARTIAL: "\u90E8\u5206\u6210\u529F",
    FAILED: "\u5931\u8D25",
    CANCELLED: "\u5DF2\u53D6\u6D88",
    INTERRUPTED: "\u5DF2\u4E2D\u65AD"
  };

  // src/client/components/JobCard.tsx
  var import_jsx_runtime6 = __require("react/jsx-runtime");
  var phases = {
    PREPARING_KNOWLEDGE: "\u51C6\u5907\u51BB\u7ED3\u77E5\u8BC6",
    GLOBAL: "\u5168\u56FE\u89C2\u5BDF",
    REGIONS: "ROI \u7EC6\u770B",
    SYNTHESIS: "\u5168\u56FE\u4E0E ROI \u8054\u5408\u5206\u6790",
    SAMPLE_COMPLETED: "\u56FE\u50CF\u5BA1\u8BA1\u5B8C\u6210",
    LEARNING_NORMAL: "\u5F52\u7EB3\u826F\u54C1\u77E5\u8BC6",
    LEARNING_DEFECT: "\u5F52\u7EB3\u4E0D\u826F\u54C1\u77E5\u8BC6",
    VERIFYING_NORMAL: "\u6838\u9A8C\u826F\u54C1\u7591\u70B9",
    VERIFYING_DEFECT: "\u6838\u9A8C\u6807\u6CE8\u4E0E\u5F02\u5E38\u77E5\u8BC6",
    KNOWLEDGE_PUBLISHED: "\u77E5\u8BC6\u5DF2\u53D1\u5E03",
    KNOWLEDGE_REUSED: "\u590D\u7528\u5DF2\u6838\u9A8C\u77E5\u8BC6"
  };
  var sampleName = (sample) => sample.relative_path || sample.sample_uuid;
  function JobCard({ job, onChanged }) {
    const { workspace } = useWorkspace();
    const kind = job.job_type === "MODEL_AUDIT" ? "audit" : "knowledge";
    const page = kind === "audit" ? "industrial-audit" : job.kind === "normal" ? "industrial-normal" : "industrial-defect";
    const active = job.status === "RUNNING" || job.status === "PENDING";
    const [busy, setBusy] = (0, import_react4.useState)(false);
    const [error, setError] = (0, import_react4.useState)("");
    const [expanded, setExpanded] = (0, import_react4.useState)(false);
    const [options, setOptions] = (0, import_react4.useState)(null);
    const [selected, setSelected] = (0, import_react4.useState)([]);
    const [revision, setRevision] = (0, import_react4.useState)(0);
    const article = (0, import_react4.useRef)(null);
    const focused = workspace.view(page).job === job.run_id;
    (0, import_react4.useEffect)(() => {
      if (focused) article.current?.scrollIntoView({ block: "nearest" });
    }, [focused]);
    (0, import_react4.useEffect)(() => {
      if (!expanded) return;
      const controller = new AbortController();
      setOptions(null);
      setError("");
      request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, void 0, void 0, controller.signal).then((options2) => {
        if (!controller.signal.aborted) {
          setOptions(options2);
          setSelected(options2.samples.map((sample) => sample.sample_id));
        }
      }).catch((error2) => {
        if (!controller.signal.aborted) setError(message(error2));
      });
      return () => controller.abort();
    }, [expanded, revision, job.run_id, kind]);
    async function cancel() {
      setBusy(true);
      setError("");
      try {
        await request(`/${kind}/cancel/${encodeURIComponent(job.run_id)}`, {});
        onChanged();
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    async function retry() {
      setBusy(true);
      setError("");
      try {
        await request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, { sample_ids: selected });
        setExpanded(false);
        onChanged();
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    function locate(sampleId) {
      workspace.navigate(kind === "audit" ? "industrial-audit" : "industrial-images", sampleId);
    }
    function related(runId) {
      workspace.updateView(page, { job: runId, tab: "jobs" });
      workspace.navigate(page);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("article", { ref: article, className: "iad-job", "data-job-id": job.run_id, "aria-label": `\u4F5C\u4E1A ${job.run_id}`, "aria-current": focused || void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { role: "status", children: active && job.cancel_requested ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[job.status] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: job.model_name }),
        active && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { disabled: busy || job.cancel_requested, onClick: cancel, children: job.cancel_requested ? "\u6B63\u5728\u505C\u6B62\u2026" : kind === "audit" ? "\u53D6\u6D88\u5BA1\u8BA1" : "\u53D6\u6D88\u6316\u6398" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("progress", { "aria-label": "\u4F5C\u4E1A\u5904\u7406\u8FDB\u5EA6", value: job.progress, max: 1 }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
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
      active && job.cancel_requested ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: "\u7B49\u5F85\u5F53\u524D\u6A21\u578B\u8BF7\u6C42\u8FD4\u56DE\u540E\u505C\u6B62\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: phases[job.phase || ""] || job.message }),
      job.current_sample && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
        "\u5F53\u524D\u56FE\u50CF ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => locate(job.current_sample.sample_id), title: job.current_sample.sample_uuid, children: sampleName(job.current_sample) })
      ] }),
      !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-muted", children: [
        "ROI ",
        job.inspected_regions || 0,
        " / ",
        job.planned_regions
      ] }),
      !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-muted", children: [
        "\u8054\u5408\u5224\u65AD ",
        job.completed_batches || 0,
        " / ",
        job.total_batches
      ] }),
      job.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("small", { className: "iad-muted", children: [
        "\u826F\u54C1\u7248\u672C ",
        job.normal_version_id,
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("br", {}),
        job.defect_version_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          "\u4E0D\u826F\u7248\u672C ",
          job.defect_version_id,
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("br", {})
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { className: "iad-muted", children: job.run_id }),
      job.origin_session_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { disabled: busy, onClick: async () => {
        setBusy(true);
        setError("");
        try {
          await workspace.openSession(job.origin_session_id);
        } catch (error2) {
          setError(message(error2));
        } finally {
          setBusy(false);
        }
      }, children: "\u8FD4\u56DE\u53D1\u8D77\u4F1A\u8BDD" }) }),
      job.parent_run_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-job-links", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { onClick: () => related(job.parent_run_id), children: [
          "\u539F\u4F5C\u4E1A ",
          job.parent_run_id
        ] }),
        job.root_run_id !== job.parent_run_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { onClick: () => related(job.root_run_id), children: [
          "\u8D77\u59CB\u4F5C\u4E1A ",
          job.root_run_id
        ] })
      ] }),
      job.knowledge_version_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => {
        workspace.updateView(page, { version: job.knowledge_version_id, tab: "results" });
        workspace.navigate(page);
      }, children: "\u67E5\u770B\u5DF2\u53D1\u5E03\u7248\u672C" }) }),
      !!job.errors.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("summary", { children: [
          "\u5931\u8D25\u8BE6\u60C5 \xB7 ",
          job.errors.length
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ul", { className: "iad-job-errors", children: job.errors.map((error2, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => locate(error2.sample_id), title: error2.sample_uuid, children: sampleName(error2) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-error", children: error2.message })
        ] }, index)) })
      ] }),
      !active && job.status !== "COMPLETED" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u91CD\u8BD5\u8303\u56F4" : "\u9009\u62E9\u91CD\u8BD5\u8303\u56F4" }),
      expanded && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "iad-retry-scope", "aria-label": "\u91CD\u8BD5\u8303\u56F4", children: [
        options ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          options.active_run_id && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "status", children: "\u540C\u7C7B\u4F5C\u4E1A\u4ECD\u5728\u6267\u884C\uFF0C\u8BF7\u7ED3\u675F\u540E\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4\u3002" }),
          !options.samples.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u5173\u8054\u4F5C\u4E1A\u5DF2\u5B8C\u6210\u5168\u90E8\u56FE\u50CF\uFF0C\u65E0\u9700\u91CD\u8BD5\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
            options.selection_mode === "all_sources" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-muted", children: "\u77E5\u8BC6\u8054\u5408\u5F52\u7EB3\u987B\u4F7F\u7528\u6574\u7EC4\u51BB\u7ED3\u6765\u6E90\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "iad-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => setSelected(options.samples.map((sample) => sample.sample_id)), children: "\u5168\u9009" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => setSelected(options.samples.filter((sample) => sample.state === "failed").map((sample) => sample.sample_id)), children: "\u4EC5\u5931\u8D25" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => setSelected(options.samples.filter((sample) => sample.state === "unprocessed").map((sample) => sample.sample_id)), children: "\u4EC5\u672A\u5904\u7406" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("fieldset", { disabled: busy || !!options.active_run_id, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("legend", { children: "\u5931\u8D25\u6216\u672A\u5904\u7406\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "iad-retry-samples", children: options.samples.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { title: sample.sample_uuid, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: selected.includes(sample.sample_id),
                    disabled: options.selection_mode === "all_sources",
                    onChange: (event) => setSelected((values) => event.target.checked ? [...values, sample.sample_id] : values.filter((id) => id !== sample.sample_id))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: sampleName(sample) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: sample.state === "failed" ? "\u5931\u8D25" : "\u672A\u5904\u7406" })
              ] }, sample.sample_id)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: "iad-primary", disabled: busy || !selected.length || !!options.active_run_id, onClick: retry, children: busy ? "\u542F\u52A8\u91CD\u8BD5\u4E2D\u2026" : `\u91CD\u8BD5\u6240\u9009 ${selected.length} \u5F20` })
          ] })
        ] }) : !error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u53EF\u91CD\u8BD5\u8303\u56F4\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { disabled: busy, onClick: () => setRevision((value) => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "alert", className: "iad-error", children: error })
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_react12 = __require("react");

  // src/client/components/ImageViewer.tsx
  var import_react9 = __require("react");

  // src/client/components/MediaLoad.tsx
  var import_react5 = __require("react");
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  var RetryContext = (0, import_react5.createContext)(0);
  function MediaLoad({ children, className = "" }) {
    const [attempt, setAttempt] = (0, import_react5.useState)(0);
    const [failures, setFailures] = (0, import_react5.useState)(/* @__PURE__ */ new Map());
    function capture(event) {
      const target = event.target;
      const source = target.getAttribute?.("data-media-source");
      if (!source) return;
      setFailures((previous) => {
        const next = new Map(previous);
        if (event.type === "error") next.set(source, target.getAttribute("data-media-label") || target.getAttribute("alt") || "\u56FE\u50CF");
        else next.delete(source);
        return next;
      });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RetryContext.Provider, { value: attempt, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `iad-media-load ${className}`, onErrorCapture: capture, onLoadCapture: capture, children: [
      children,
      !!failures.size && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "iad-media-error", role: "alert", children: [
        [...new Set(failures.values())].map((label) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
          label,
          "\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u8BF7\u68C0\u67E5\u8D44\u6E90\u662F\u5426\u5B58\u5728\u6216\u5B8C\u6574\u3002"
        ] }, label)),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", "aria-label": "\u91CD\u65B0\u52A0\u8F7D\u56FE\u50CF", onClick: () => setAttempt((previous) => previous + 1), children: "\u91CD\u65B0\u52A0\u8F7D" })
      ] })
    ] }) });
  }
  function useRetryUrl(source) {
    const attempt = (0, import_react5.useContext)(RetryContext);
    if (!attempt) return source;
    const url = new URL(source, window.location.href);
    url.searchParams.set("_retry", String(attempt));
    return url.href;
  }
  function MediaImage({ src = "", ...props }) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("img", { ...props, src: useRetryUrl(src), "data-media-source": src });
  }
  function MediaMask({ href = "", ...props }) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("image", { ...props, href: useRetryUrl(href), "data-media-source": href, "data-media-label": "\u6807\u6CE8\u50CF\u7D20" });
  }

  // src/client/components/AnnotationLayer.tsx
  var import_react6 = __require("react");
  var import_jsx_runtime8 = __require("react/jsx-runtime");
  function AnnotationLayer({ source }) {
    const namespace = (0, import_react6.useId)();
    const [width, height] = source.kind === "sample" ? [source.sample.width, source.sample.height] : source.analysis.overview.original_size;
    const annotations = source.kind === "sample" ? source.annotations.filter((annotation) => annotation.geometry_status !== "INVALID") : [];
    const masks = source.kind === "sample" ? annotations.filter((annotation) => annotation.annotation_type === "mask").map((annotation) => ({
      id: annotation.annotation_id,
      bbox: [0, 0, width, height],
      url: `${mediaUrl(source.sample, "mask")}?${new URLSearchParams({ annotation_id: annotation.annotation_id, sha256: annotation.mask_sha256 || "" })}`
    })) : source.analysis.auxiliary_evidence.filter((image) => image.representation === "annotation_mask").map((image) => ({
      id: image.evidence_id,
      bbox: image.crop_bbox,
      url: auditEvidenceUrl(source.suggestionId, image)
    }));
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { className: "iad-annotation-layer", viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none", "aria-label": "Labelme \u6807\u6CE8", children: [
      !!masks.length && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { className: "iad-annotation-mask", children: masks.map((mask, index) => {
        const maskId = `${namespace}-mask-${index}`;
        const [x1, y1, x2, y2] = mask.bbox;
        return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("mask", { id: maskId, x: 0, y: 0, width, height, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", style: { maskType: "luminance" }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(MediaMask, { href: mask.url, x: x1, y: y1, width: x2 - x1, height: y2 - y1, preserveAspectRatio: "none", style: { imageRendering: "pixelated" } }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: 0, y: 0, width, height, mask: `url(#${maskId})` })
        ] }, mask.id);
      }) }),
      annotations.map((annotation) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("g", { children: [
        annotation.annotation_type !== "mask" && (annotation.polygon ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("polygon", { points: annotation.polygon.map((point) => point.join(",")).join(" ") }) : annotation.bbox && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: annotation.bbox[0], y: annotation.bbox[1], width: annotation.bbox[2] - annotation.bbox[0], height: annotation.bbox[3] - annotation.bbox[1] })),
        annotation.bbox && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("text", { x: annotation.bbox[0], y: Math.max(12, annotation.bbox[1] - 4), children: annotation.raw_label })
      ] }, annotation.annotation_id))
    ] });
  }

  // src/client/components/AuditEvidence.tsx
  var import_jsx_runtime9 = __require("react/jsx-runtime");
  function AuditEvidence({ analysis, ids, label, onEvidence, selectedId }) {
    const images = auditImageIndex(analysis);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "iad-actions", children: ids.map((id, index) => {
      const image = images.get(id);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "button",
        {
          "data-evidence-id": id,
          "aria-current": id === selectedId ? "true" : void 0,
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

  // src/client/components/AuditFindings.tsx
  var import_react7 = __require("react");
  var import_jsx_runtime10 = __require("react/jsx-runtime");
  var priorities = { high: "\u4F18\u5148\u590D\u6838", medium: "\u968F\u540E\u590D\u6838", low: "\u8865\u5145\u6838\u5BF9" };
  function AuditFindings({ analysis, onLocate, onEvidence }) {
    const [expanded, setExpanded] = (0, import_react7.useState)(false);
    if (!analysis.findings.length) return null;
    const visible = expanded ? analysis.findings : analysis.findings.slice(0, 3);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: "iad-findings", "aria-label": "\u4F18\u5148\u590D\u6838\u7591\u70B9", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("h3", { children: [
        "\u91CD\u70B9\u7591\u70B9 \xB7 ",
        analysis.findings.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ol", { children: visible.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: priorities[finding.priority] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { onClick: () => onLocate(finding), title: "\u5728\u5168\u56FE\u5B9A\u4F4D", children: [
          finding.location.description,
          " \xB7 ",
          finding.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("details", { className: "iad-analysis", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("summary", { children: "\u4F9D\u636E\u4E0E\u6B63\u5E38\u89E3\u91CA" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FindingExplanation, { finding }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, onEvidence: (image) => onEvidence(image, finding) })
        ] })
      ] }, finding.finding_id)) }),
      analysis.findings.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u5176\u4ED6\u7591\u70B9" : `\u67E5\u770B\u5176\u4F59 ${analysis.findings.length - 3} \u9879` })
    ] });
  }
  function FindingExplanation({ finding }) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
        "\u5F02\u5E38\u5047\u8BBE\uFF1A",
        finding.hypothesis
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
        "\u6B63\u5E38\u89E3\u91CA\uFF1A",
        finding.normal_explanation
      ] }),
      !!finding.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: finding.limitations.join("\uFF1B") })
    ] });
  }

  // src/client/components/InspectionQuestion.tsx
  var import_react8 = __require("react");
  var import_jsx_runtime11 = __require("react/jsx-runtime");
  function InspectionQuestion({ inspection, selection, transform }) {
    const { workspace } = useWorkspace();
    const [expanded, setExpanded] = (0, import_react8.useState)(false);
    const [question, setQuestion] = (0, import_react8.useState)("");
    const [busy, setBusy] = (0, import_react8.useState)(false);
    const [error, setError] = (0, import_react8.useState)("");
    async function send(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      const { finding, evidence } = resolveInspection(inspection.analysis, selection);
      try {
        await workspace.ask({
          ...inspection.reference,
          finding_id: finding?.finding_id || null,
          evidence_id: evidence?.evidence_id || null
        }, selection, transform(), question.trim());
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    return expanded ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("form", { className: "iad-inspection-question", onSubmit: send, "aria-label": "\u5411 Agent \u8FFD\u95EE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "iad-field", children: [
        "\u8FFD\u95EE\u5185\u5BB9",
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("textarea", { "aria-label": "\u8FFD\u95EE\u5185\u5BB9", rows: 3, value: question, disabled: busy, onChange: (event) => setQuestion(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "iad-muted", children: "\u643A\u5E26\u5F53\u524D\u7591\u70B9\u3001\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u5B9E\u9645\u56FE\u50CF\u5F15\u7528\u3002" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "submit", className: "iad-primary", disabled: busy, children: busy ? "\u6B63\u5728\u63D0\u4EA4\u2026" : "\u53D1\u9001\u5230\u4F1A\u8BDD" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", disabled: busy, onClick: () => setExpanded(false), children: "\u53D6\u6D88" })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => setExpanded(true), children: "\u5411 Agent \u8FFD\u95EE" });
  }

  // src/client/components/InspectionEvidence.tsx
  var import_jsx_runtime12 = __require("react/jsx-runtime");
  function InspectionOverlay({ inspection, selectedId, hoveredIds, regions, finding }) {
    const { analysis } = inspection;
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("svg", { className: "iad-roi-layer", viewBox: `0 0 ${analysis.overview.original_size.join(" ")}`, preserveAspectRatio: "none", "aria-label": "\u5BA1\u8BA1\u533A\u57DF", children: regions.map((region) => {
        const [x1, y1, x2, y2] = region.crop_bbox;
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("g", { "data-evidence-id": region.image.evidence_id, "data-locked": selectedId === region.image.evidence_id, className: hoveredIds.includes(region.image.evidence_id) ? "is-hovered" : "", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }) }, region.image.evidence_id);
      }) }),
      finding?.location.scope === "local" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
        "svg",
        {
          className: "iad-finding-layer",
          "data-finding-id": finding.finding_id,
          viewBox: `0 0 ${analysis.overview.original_size.join(" ")}`,
          preserveAspectRatio: "none",
          "aria-label": finding.location.description,
          children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { x: finding.location.bbox[0], y: finding.location.bbox[1], width: finding.location.bbox[2] - finding.location.bbox[0], height: finding.location.bbox[3] - finding.location.bbox[1] })
        }
      )
    ] });
  }
  function InspectionPanel({ inspection, selection, onSelect, choices, transform }) {
    const { analysis, reference } = inspection;
    const suggestionId = reference.suggestion_id;
    const { finding, evidence, region } = resolveInspection(analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const related = region ? analysis.findings.filter((finding2) => finding2.evidence_ids.includes(region.image.evidence_id)) : [];
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("aside", { className: "iad-inspection-panel", "aria-label": "\u5168\u56FE\u4E0E ROI \u7EFC\u5408\u5206\u6790", children: [
      inspection.historical && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { role: "status", children: "\u5386\u53F2\u5EFA\u8BAE \xB7 \u4FDD\u7559\u8BE5\u6B21\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u56FE\u50CF\u8BC1\u636E\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(InspectionQuestion, { inspection, selection, transform }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u7EFC\u5408\u5EFA\u8BAE" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: analysis.conclusion.description }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { className: "iad-muted", children: [
        "\u4F4D\u7F6E\uFF1A",
        analysis.conclusion.position_analysis,
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("br", {}),
        "\u5149\u7167\uFF1A",
        analysis.conclusion.illumination_analysis
      ] }),
      !!analysis.findings.length && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "iad-field", children: [
        "\u5BA1\u8BA1\u7591\u70B9",
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u7591\u70B9", value: finding?.finding_id || "", onChange: (event) => onSelect(event.target.value ? { kind: "finding", id: event.target.value } : null), children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "", children: "\u9009\u62E9\u7591\u70B9" }),
          analysis.findings.map((item) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("option", { value: item.finding_id, children: [
            item.location.scope === "global" ? "\u5168\u56FE" : "\u5C40\u90E8",
            " \xB7 ",
            item.location.description,
            " \xB7 ",
            item.description
          ] }, item.finding_id))
        ] })
      ] }),
      finding && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-inspection-finding", "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("h3", { children: [
          finding.location.scope === "global" ? "\u5168\u56FE\u5173\u7CFB" : "\u5C40\u90E8\u7591\u70B9",
          " \xB7 ",
          finding.location.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: finding.description }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(FindingExplanation, { finding }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, selectedId: evidence?.evidence_id || region?.image.evidence_id, onEvidence: (image) => onSelect({ kind: "evidence", id: image.evidence_id, findingId: finding.finding_id }) })
      ] }),
      !!choices.length && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { role: "group", "aria-label": "\u91CD\u53E0\u533A\u57DF", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { children: "\u9009\u62E9\u91CD\u53E0\u533A\u57DF" }),
        analysis.regions.filter((item) => choices.includes(item.image.evidence_id)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { onClick: () => onSelect({ kind: "evidence", id: item.image.evidence_id }), children: [
          item.label,
          " \xB7 ",
          item.crop_bbox.join(", ")
        ] }, item.image.evidence_id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "iad-roi-list", "aria-label": "\u5BA1\u8BA1 ROI", children: analysis.regions.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { "aria-label": `\u5B9A\u4F4D ROI ${index + 1}`, "aria-pressed": selectedId === item.image.evidence_id, onClick: () => onSelect({ kind: "evidence", id: item.image.evidence_id }), children: [
        "ROI ",
        index + 1,
        " \xB7 ",
        item.label
      ] }, item.image.evidence_id)) }),
      region ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-inspection-region", "data-evidence-id": region.image.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("h3", { children: [
          regionSources[region.source],
          " \xB7 ",
          region.label
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(MediaImage, { src: auditEvidenceUrl(suggestionId, region.image), alt: "\u6240\u9009 ROI \u7684\u5B9E\u9645\u9001\u6A21\u88C1\u56FE", "data-media-label": "ROI \u88C1\u56FE" }) }, region.image.evidence_id),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("dt", { children: "\u539F\u56FE\u533A\u57DF" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("dd", { children: region.bbox.join(", ") }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("dt", { children: "\u5916\u6269\u88C1\u56FE" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("dd", { children: region.crop_bbox.join(", ") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: region.observation.description }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
          "\u4F4D\u7F6E\uFF1A",
          region.observation.position_analysis
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
          "\u5149\u7167\uFF1A",
          region.observation.illumination_analysis
        ] }),
        !finding && !!related.length && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "iad-related-findings iad-actions", "aria-label": "ROI \u5173\u8054\u7591\u70B9", children: related.map((item) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { "data-finding-id": item.finding_id, onClick: () => onSelect({ kind: "finding", id: item.finding_id }), children: [
          item.location.description,
          " \xB7 ",
          item.description
        ] }, item.finding_id)) })
      ] }) : !evidence && !finding && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "iad-muted", children: "\u70B9\u9009\u56FE\u4E2D\u533A\u57DF\u6216 ROI \u6309\u94AE\u67E5\u770B\u5B9E\u9645\u88C1\u56FE\u3002" }),
      evidence && evidence.representation !== "raw" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-inspection-mask", "data-evidence-id": evidence.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { children: evidence.representation === "annotation_mask" ? "\u6807\u6CE8\u5B9A\u4F4D\u56FE" : "\u6807\u6CE8\u53E0\u52A0\u56FE" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(MediaImage, { src: auditEvidenceUrl(suggestionId, evidence), alt: "\u6240\u9009\u6807\u6CE8\u7684\u5B9E\u9645\u9001\u6A21\u56FE", "data-media-label": "\u6807\u6CE8\u8BC1\u636E" }) }, evidence.evidence_id),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
          "\u539F\u56FE\u5750\u6807\uFF1A",
          evidence.crop_bbox.join(", ")
        ] })
      ] }),
      evidence?.role === "overview" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { className: "iad-inspection-overview", "data-evidence-id": evidence.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: analysis.global_view.description }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
          "\u4F4D\u7F6E\uFF1A",
          analysis.global_view.position_analysis
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
          "\u5149\u7167\uFF1A",
          analysis.global_view.illumination_analysis
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("summary", { children: "\u7248\u672C\u4E0E\u8BC1\u636E\u8303\u56F4" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("code", { children: analysis.normal_version_id }) }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
          "\u5B9E\u9645\u7EC6\u770B ",
          analysis.coverage.inspected_regions,
          " / ",
          analysis.coverage.planned_regions,
          " \u4E2A ROI"
        ] }),
        analysis.coverage.missing.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: item }, index))
      ] })
    ] });
  }

  // src/client/components/ImageViewer.tsx
  var import_jsx_runtime13 = __require("react/jsx-runtime");
  var emptyHover = { ids: [], dismissed: false, x: 0, y: 0 };
  var minScale = 0.02;
  var maxScale = 16;
  function AnnotatedImage({ image, visible = true, onLoad }) {
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-image-frame", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MediaImage, { src: image.src, alt: image.title, width: image.width, height: image.height, "data-media-label": "\u56FE\u50CF", draggable: false, onLoad }),
      visible && image.annotationLayer && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AnnotationLayer, { source: image.annotationLayer })
    ] });
  }
  function ImageViewer({ image, onClose, navigation }) {
    const { workspace } = useWorkspace();
    const reference = image.inspection?.reference;
    const source = JSON.stringify(reference ? [reference.dataset_id, reference.sample_id, reference.suggestion_id] : [image.src]);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ImageCanvas, { image, onClose, navigation, savedView: workspace.imageView(source), onRemember: (view) => workspace.rememberImageView(source, view) }, JSON.stringify([source, image.src]));
  }
  function ImageCanvas({ image, onClose, navigation, savedView, onRemember }) {
    const viewport = (0, import_react9.useRef)(null);
    const world = (0, import_react9.useRef)(null);
    const layerMenu = (0, import_react9.useRef)(null);
    const inspection = image.inspection;
    const [selection, setSelection] = (0, import_react9.useState)(() => inspection ? image.initialSelection === void 0 ? savedView?.selection || null : image.initialSelection : null);
    const initialTransform = image.initialTransform || (image.initialSelection === void 0 || JSON.stringify(image.initialSelection) === JSON.stringify(savedView?.selection) ? savedView?.transform : void 0);
    const [hover, setHover] = (0, import_react9.useState)(emptyHover);
    const hintId = (0, import_react9.useId)();
    const [choices, setChoices] = (0, import_react9.useState)([]);
    const { finding, evidence, region } = resolveInspection(inspection?.analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const [size, setSize] = (0, import_react9.useState)({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = (0, import_react9.useState)({ width: 0, height: 0 });
    const [view, setView] = (0, import_react9.useState)({ scale: 0, x: 0, y: 0 });
    const focusedSelection = (0, import_react9.useRef)();
    const restoredTransform = (0, import_react9.useRef)(false);
    const [layers, setLayers] = (0, import_react9.useState)(() => {
      const initial = { annotation: true, model: true, coverage: true };
      try {
        const saved = JSON.parse(localStorage.getItem("iad.image-layers") || "null");
        for (const key of Object.keys(initial)) {
          if (typeof saved?.[key] === "boolean") initial[key] = saved[key];
        }
      } catch {
        localStorage.removeItem("iad.image-layers");
      }
      if (image.initialSelection) {
        if (region) initial[region.source] = true;
        if (finding?.location.scope === "local") initial.model = true;
      }
      return initial;
    });
    const regions = inspection?.analysis.regions.filter((region2) => region2.origins.some((origin) => layers[origin.source])) || [];
    const hoveredRegions = regions.filter((region2) => hover.ids.includes(region2.image.evidence_id));
    const hint = !hover.dismissed && hoveredRegions[0];
    (0, import_react9.useEffect)(() => {
      localStorage.setItem("iad.image-layers", JSON.stringify(layers));
    }, [layers]);
    const drag = (0, import_react9.useRef)(null);
    const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
    const scale = view.scale || fit;
    const remembered = (0, import_react9.useRef)({ onRemember, view: { selection, transform: { zoom: 0, x: 0, y: 0 } } });
    remembered.current = { onRemember, view: { selection, transform: { zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y } } };
    (0, import_react9.useEffect)(() => () => remembered.current.onRemember(remembered.current.view), []);
    (0, import_react9.useLayoutEffect)(() => {
      const element = viewport.current;
      const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    (0, import_react9.useEffect)(() => {
      if (!bounds.width || !bounds.height || !size.width || !size.height) return;
      const key = JSON.stringify(selection);
      if (focusedSelection.current === key) return;
      focusedSelection.current = key;
      if (!restoredTransform.current && initialTransform) {
        restoredTransform.current = true;
        setView({ scale: initialTransform.zoom ? initialTransform.zoom * fit : 0, x: initialTransform.x, y: initialTransform.y });
        return;
      }
      if (!inspection || !selection) return;
      const box = selection.kind === "evidence" ? evidence?.role === "overview" ? null : evidence?.crop_bbox : finding?.location.bbox;
      if (!box) {
        setView({ scale: 0, x: 0, y: 0 });
        return;
      }
      const [x1, y1, x2, y2] = box.map((value, axis) => value * (axis % 2 ? size.height : size.width) / inspection.analysis.overview.original_size[axis % 2]);
      const scale2 = Math.min(maxScale, bounds.width / ((x2 - x1) * 1.4), bounds.height / ((y2 - y1) * 1.4));
      setView({ scale: scale2, x: (size.width / 2 - (x1 + x2) / 2) * scale2, y: (size.height / 2 - (y1 + y2) / 2) * scale2 });
    }, [selection, inspection, finding, evidence, bounds.width, bounds.height, size.width, size.height]);
    function select(target) {
      const { region: targetRegion, finding: targetFinding } = resolveInspection(inspection?.analysis, target);
      if (targetRegion) setLayers((previous) => ({ ...previous, [targetRegion.source]: true }));
      if (targetFinding?.location.scope === "local") setLayers((previous) => ({ ...previous, model: true }));
      setSelection(target);
      setChoices([]);
      setHover(emptyHover);
    }
    function regionsAt(event) {
      if (!inspection || !world.current) return [];
      const rect = world.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) * inspection.analysis.overview.original_size[0] / rect.width;
      const y = (event.clientY - rect.top) * inspection.analysis.overview.original_size[1] / rect.height;
      return regions.filter((region2) => x >= region2.crop_bbox[0] && x <= region2.crop_bbox[2] && y >= region2.crop_bbox[1] && y <= region2.crop_bbox[3]).map((region2) => region2.image.evidence_id);
    }
    function cancel() {
      if (layerMenu.current?.open) {
        layerMenu.current.open = false;
        layerMenu.current.querySelector("summary")?.focus();
      } else if (hint) setHover((previous) => ({ ...previous, dismissed: true }));
      else if (choices.length) setChoices([]);
      else if (selection) setSelection(null);
      else onClose();
    }
    function zoomBy(factor, anchorX = 0, anchorY = 0) {
      setHover(emptyHover);
      setView((previous) => {
        const oldScale = previous.scale || fit;
        const next = Math.max(minScale, Math.min(maxScale, oldScale * factor));
        return { scale: next, x: anchorX - (anchorX - previous.x) * next / oldScale, y: anchorY - (anchorY - previous.y) * next / oldScale };
      });
    }
    (0, import_react9.useEffect)(() => {
      const element = viewport.current;
      const wheel = (event) => {
        event.preventDefault();
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
        zoomBy(Math.exp(-event.deltaY * 15e-4), x, y);
      };
      element.addEventListener("wheel", wheel, { passive: false });
      return () => element.removeEventListener("wheel", wheel);
    }, [fit]);
    const fixed = [0, 1, 1.5, 2].includes(view.scale);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Modal, { title: "\u539F\u56FE\u68C0\u89C6\u5668", className: "iad-viewer-dialog", onClose: cancel, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-lightbox", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-lightbox-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: image.title }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: "iad-eye", "aria-label": "\u7F29\u5C0F", title: "\u7F29\u5C0F", disabled: scale <= minScale, onClick: () => zoomBy(0.5), children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("path", { d: "M5 12h14" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: (e) => {
          const next = Number(e.target.value);
          if (next) zoomBy(next / scale);
          else {
            setView({ scale: 0, x: 0, y: 0 });
            setHover(emptyHover);
          }
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: 1, children: "100%" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: 1.5, children: "150%" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: 2, children: "200%" }),
          !fixed && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("option", { value: "custom", children: [
            Math.round(scale * 100),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: "iad-eye", "aria-label": "\u653E\u5927", title: "\u653E\u5927", disabled: scale >= maxScale, onClick: () => zoomBy(2), children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("path", { d: "M5 12h14M12 5v14" }) }) }),
        (image.annotationLayer || inspection) && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: "iad-eye", title: layers.annotation ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-label": layers.annotation ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-pressed": layers.annotation, onClick: () => setLayers((previous) => ({ ...previous, annotation: !previous.annotation })), children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
          !layers.annotation && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("path", { d: "m3 3 18 18" })
        ] }) }),
        inspection && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("details", { ref: layerMenu, className: "iad-layer-menu", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("summary", { "aria-label": "\u53EF\u89C6\u56FE\u5C42", children: "\u56FE\u5C42" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { children: Object.keys(regionSources).map((source) => {
            const label = { annotation: "\u6807\u6CE8", model: "\u6A21\u578B\u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" }[source];
            return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                "input",
                {
                  type: "checkbox",
                  "aria-label": `${label}\u56FE\u5C42`,
                  checked: layers[source],
                  onChange: (event) => setLayers((previous) => ({ ...previous, [source]: event.target.checked }))
                }
              ),
              label
            ] }, source);
          }) })
        ] }),
        navigation && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { disabled: navigation.busy || !navigation.previous, onClick: () => navigation.move(-1), children: "\u524D\u4E00\u5F20" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { disabled: navigation.busy || !navigation.next, onClick: () => navigation.move(1), children: "\u540E\u4E00\u5F20" }),
          navigation.busy && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { role: "status", children: "\u6B63\u5728\u5207\u6362\u56FE\u50CF\u2026" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { onClick: onClose, children: "\u5173\u95ED" })
      ] }),
      navigation?.error && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { role: "alert", className: "iad-error", children: navigation.error }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: `iad-viewer-body ${inspection ? "has-inspection" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MediaLoad, { className: "iad-viewer-media", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
          "div",
          {
            className: "iad-viewer-viewport",
            ref: viewport,
            tabIndex: 0,
            "aria-label": "\u56FE\u50CF\u89C6\u53E3",
            "aria-describedby": hint ? hintId : void 0,
            onKeyDown: (event) => {
              const direction = { ArrowLeft: [20, 0], ArrowRight: [-20, 0], ArrowUp: [0, 20], ArrowDown: [0, -20] }[event.key];
              if (direction) {
                event.preventDefault();
                setView((previous) => ({ ...previous, x: previous.x + direction[0], y: previous.y + direction[1] }));
              }
            },
            onPointerDown: (event) => {
              if (event.button !== 0) return;
              setHover(emptyHover);
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y, moved: false };
            },
            onPointerMove: (event) => {
              const start = drag.current;
              if (start) {
                const dx = event.clientX - start.x, dy = event.clientY - start.y;
                start.moved ||= Math.hypot(dx, dy) > 4;
                if (start.moved) setView((previous) => ({ ...previous, x: start.panX + dx, y: start.panY + dy }));
              } else if (inspection && event.pointerType !== "touch") {
                const ids = regionsAt(event);
                const rect = event.currentTarget.getBoundingClientRect();
                const x = Math.max(12, Math.min(event.clientX - rect.left, rect.width - 292)), y = event.clientY - rect.top;
                setHover((previous) => ids.length === previous.ids.length && ids.every((id, index) => id === previous.ids[index]) ? previous : { ids, dismissed: false, x, y });
              }
            },
            onPointerLeave: () => setHover(emptyHover),
            onPointerUp: (event) => {
              const start = drag.current;
              drag.current = null;
              if (start && !start.moved && inspection) {
                const ids = regionsAt(event);
                if (ids.length === 1) select({ kind: "evidence", id: ids[0] });
                else {
                  setSelection(null);
                  setChoices(ids);
                }
              }
            },
            onPointerCancel: () => {
              drag.current = null;
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-viewer-world", ref: world, "data-scale": scale, style: {
                width: size.width,
                height: size.height,
                "--iad-view-scale": scale,
                transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})`
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AnnotatedImage, { image: { ...image, ...size }, visible: layers.annotation, onLoad: (event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) }),
                inspection && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(InspectionOverlay, { inspection, selectedId, hoveredIds: hover.ids, regions, finding: layers.model ? finding : void 0 })
              ] }),
              hint && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { id: hintId, role: "tooltip", className: "iad-roi-hint", style: { left: hover.x, top: hover.y + (hover.y < bounds.height / 2 ? 1 : 0), transform: hover.y >= bounds.height / 2 ? "translateY(-100%)" : void 0 }, onPointerMove: (event) => event.stopPropagation(), onPointerDown: (event) => event.stopPropagation(), children: [
                regionSources[hint.source],
                " \xB7 ",
                hint.label.slice(0, 80),
                hint.label.length > 80 ? "\u2026" : "",
                hoveredRegions.length > 1 ? ` \xB7 ${hoveredRegions.length} \u4E2A\u91CD\u53E0\u533A\u57DF` : ""
              ] })
            ]
          }
        ) }, image.src),
        inspection && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(InspectionPanel, { inspection, selection, choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })
      ] })
    ] }) });
  }

  // src/client/components/DatasetKnowledge.tsx
  var import_jsx_runtime14 = __require("react/jsx-runtime");
  var statuses = { supported: "\u6709\u8BC1\u636E\u652F\u6301", provisional: "\u5F85\u9A8C\u8BC1", conflicted: "\u5B58\u5728\u77DB\u76FE" };
  function DatasetKnowledge({ knowledge }) {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-profile", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: knowledge.kind === "normal" ? "\u826F\u54C1\u77E5\u8BC6" : "\u4E0D\u826F\u77E5\u8BC6" }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: knowledge.summary }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("small", { className: "iad-muted", children: [
        knowledge.version_id,
        " \xB7 ",
        knowledge.sources.length,
        " \u5F20\u6765\u6E90 \xB7 ",
        knowledge.checks.length,
        " \u9879\u5224\u636E"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("summary", { children: "\u68C0\u67E5\u5224\u636E" }),
        knowledge.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("strong", { children: [
            check.title,
            " \xB7 ",
            statuses[check.status]
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: check.criterion }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("small", { className: "iad-muted", children: [
            check.subject,
            " \xB7 ",
            check.location
          ] }),
          !!check.allowed_variations.length && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { children: [
            "\u5141\u8BB8\u53D8\u5316\uFF1A",
            check.allowed_variations.join("\uFF1B")
          ] }),
          !!check.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
        ] }, check.check_id))
      ] })
    ] });
  }

  // src/client/components/RuleAssessments.tsx
  var import_jsx_runtime15 = __require("react/jsx-runtime");
  var statuses2 = { normal: "\u672A\u89C1\u5F02\u5E38", anomaly: "\u53D1\u73B0\u504F\u79BB", insufficient: "\u8BC1\u636E\u4E0D\u8DB3", not_applicable: "\u4E0D\u9002\u7528" };
  function RuleAssessments({ analysis, knowledge, onEvidence }) {
    const checks = new Map(knowledge.flatMap((snapshot) => snapshot.checks.map((check) => [check.check_id, check])));
    if (!analysis.check_assessments.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("details", { className: "iad-rule-assessments iad-analysis", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("summary", { children: [
        "\u68C0\u67E5\u9879 \xB7 ",
        analysis.check_assessments.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ol", { children: analysis.check_assessments.map((assessment) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("li", { "data-check-id": assessment.check_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children: checks.get(assessment.check_id)?.title || assessment.check_id }),
        " \xB7 ",
        statuses2[assessment.status],
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { children: assessment.description }),
        !!assessment.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "iad-muted", children: assessment.limitations.join("\uFF1B") }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(AuditEvidence, { analysis, ids: assessment.evidence_ids, label: checks.get(assessment.check_id)?.title || "\u68C0\u67E5\u9879", onEvidence })
      ] }, assessment.check_id)) })
    ] });
  }

  // src/client/components/HumanReviewForm.tsx
  var import_react11 = __require("react");

  // src/client/useReviewDraft.ts
  var import_react10 = __require("react");

  // ../../node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }

  // ../../node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      if (typeof crypto === "undefined" || !crypto.getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
      getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
  }

  // ../../node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = { randomUUID };

  // ../../node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/v4.js
  function _v4(options, buf, offset) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
      throw new Error("Random bytes length must be >= 16");
    }
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      if (offset < 0 || offset + 16 > buf.length) {
        throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
      }
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    return _v4(options, buf, offset);
  }
  var v4_default = v4;

  // src/client/useReviewDraft.ts
  function useReviewDraft(datasetId, sampleId) {
    const key = `iad.review-draft:${datasetId}:${sampleId}`;
    const [state, setState] = (0, import_react10.useState)(() => {
      const draft = { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", pending: null };
      try {
        const stored = JSON.parse(sessionStorage.getItem(key) || "null");
        if (stored && typeof stored.reviewer === "string" && typeof stored.comment === "string") return { draft: { ...draft, ...stored }, dirty: true };
      } catch {
        sessionStorage.removeItem(key);
      }
      return { draft, dirty: false };
    });
    function persist(draft) {
      sessionStorage.setItem(key, JSON.stringify(draft));
      setState({ draft, dirty: true });
    }
    function update(patch) {
      persist({ ...state.draft, ...patch });
    }
    function prepare(decision, duration) {
      if (state.draft.pending) return state.draft.pending;
      const pending = {
        submission_id: v4_default(),
        dataset_id: datasetId,
        sample_id: sampleId,
        reviewer: state.draft.reviewer.trim(),
        comment: state.draft.comment,
        decision,
        duration_ms: duration
      };
      persist({ ...state.draft, pending });
      return pending;
    }
    function discard() {
      sessionStorage.removeItem(key);
      setState({ draft: { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", pending: null }, dirty: false });
    }
    return { ...state.draft, dirty: state.dirty, update, prepare, discard };
  }

  // src/client/components/HumanReviewForm.tsx
  var import_jsx_runtime16 = __require("react/jsx-runtime");
  function HumanReviewForm({ datasetId, sampleId, detail, onSubmitted }) {
    const draft = useReviewDraft(datasetId, sampleId);
    const [busy, setBusy] = (0, import_react11.useState)(false), [error, setError] = (0, import_react11.useState)(""), [notice, setNotice] = (0, import_react11.useState)("");
    const openedAt = (0, import_react11.useRef)(Date.now());
    async function submit(decision) {
      if (!draft.reviewer.trim()) {
        setError("\u8BF7\u586B\u5199\u590D\u6838\u4EBA");
        return;
      }
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const submission = draft.prepare(decision, Date.now() - openedAt.current);
        const saved = await request("/review/submit", submission);
        localStorage.setItem("iad.reviewer", saved.reviewer);
        draft.discard();
        openedAt.current = Date.now();
        setNotice(`\u5DF2\u63D0\u4EA4 ${reviewLabel(saved.decision)}`);
        onSubmitted(saved);
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "iad-decision", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { role: "status", children: notice }),
      draft.pending ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { role: "status", children: "\u63D0\u4EA4\u7ED3\u679C\u5F85\u786E\u8BA4" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy, onClick: () => submit(draft.pending.decision), children: "\u91CD\u8BD5\u63D0\u4EA4" })
      ] }) : draft.dirty && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { role: "status", children: "\u8349\u7A3F\u672A\u63D0\u4EA4" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy, onClick: draft.discard, children: "\u653E\u5F03\u8349\u7A3F" })
      ] }),
      detail.review_decision && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
        "\u5F53\u524D\uFF1A",
        reviewLabel(detail.review_decision.decision),
        " \xB7 ",
        detail.review_decision.reviewer,
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("br", {}),
        detail.review_decision.comment
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("label", { className: "iad-field", children: [
        "\u590D\u6838\u4EBA",
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("input", { value: draft.reviewer, disabled: busy || !!draft.pending, onChange: (e) => draft.update({ reviewer: e.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("label", { className: "iad-field", children: [
        "\u590D\u6838\u8BF4\u660E",
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("textarea", { value: draft.comment, disabled: busy || !!draft.pending, onChange: (e) => draft.update({ comment: e.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "iad-actions", children: Object.entries(reviewLabels).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { className: value === "FAIL" ? "iad-danger" : "", disabled: busy || !!draft.pending, onClick: () => submit(value), children: label }, value)) }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("details", { className: "iad-review-history", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("summary", { children: [
          "\u590D\u6838\u8BB0\u5F55 \xB7 ",
          detail.review_history.length,
          " \u6B21"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("ol", { children: detail.review_history.map((record) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("li", { "data-decision-id": record.decision_id, children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: reviewLabel(record.decision) }),
          " \xB7 ",
          record.reviewer,
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("br", {}),
          record.submitted_at ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "\u672A\u8BB0\u5F55\u63D0\u4EA4\u65F6\u95F4",
          record.comment && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: record.comment })
        ] }, record.decision_id)) })
      ] })
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_jsx_runtime17 = __require("react/jsx-runtime");
  function SampleInspector({ dataset, sampleId, mode, revision, onChanged, onReviewed, jobs, onJobsChanged, navigation }) {
    const { workspace, state } = useWorkspace();
    const [detail, setDetail] = (0, import_react12.useState)(null);
    const [error, setError] = (0, import_react12.useState)("");
    const [busy, setBusy] = (0, import_react12.useState)(false);
    const job = jobs.find((job2) => job2.sample_ids.includes(sampleId));
    const jobRunning = jobs.some((job2) => job2.status === "RUNNING" || job2.status === "PENDING");
    const [lightbox, setLightbox] = (0, import_react12.useState)(null);
    const imageButton = (0, import_react12.useRef)(null);
    (0, import_react12.useEffect)(() => {
      setDetail(null);
      setError("");
      setLightbox(null);
    }, [sampleId]);
    (0, import_react12.useEffect)(() => {
      const saved = workspace.view(workspace.getSnapshot().pageId).inspection;
      if (!saved || saved.reference.sample_id !== sampleId) return;
      const controller = new AbortController();
      request("/inspection/context", saved.reference, void 0, controller.signal).then((snapshot) => {
        if (!controller.signal.aborted) setLightbox(inspectionImage({ reference: snapshot.reference, analysis: snapshot.analysis, historical: !snapshot.is_latest }, saved.selection, saved.transform));
      }).catch((error2) => {
        if (!controller.signal.aborted) setError(message(error2));
      });
      return () => controller.abort();
    }, [sampleId, workspace]);
    (0, import_react12.useEffect)(() => {
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
    const evidenceSource = (evidence) => {
      const suggestion = detail.suggestion;
      const analysis = suggestion.analysis;
      return inspectionImage({ reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: suggestion.suggestion_id }, analysis }, { kind: "evidence", id: evidence.evidence_id });
    };
    const image = (0, import_react12.useMemo)(() => detail ? {
      src: mediaUrl(detail.sample),
      title: detail.sample.relative_path.split("/").pop(),
      width: detail.sample.width,
      height: detail.sample.height,
      annotationLayer: { kind: "sample", annotations: detail.annotations, sample: detail.sample },
      inspection: detail.suggestion?.analysis ? { reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: detail.suggestion.suggestion_id }, analysis: detail.suggestion.analysis } : void 0
    } : null, [detail, dataset.dataset_id, sampleId]);
    (0, import_react12.useEffect)(() => {
      if (navigation?.open && image && detail?.sample.sample_id === sampleId) {
        imageButton.current?.focus({ preventScroll: true });
        setLightbox({ ...image, initialSelection: null, initialTransform: { zoom: 0, x: 0, y: 0 } });
        navigation.opened();
      }
    }, [navigation, image, detail, sampleId]);
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("aside", { className: "iad-inspector", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h2", { children: mode === "review" ? "\u590D\u6838\u660E\u7EC6" : "\u6837\u672C\u4FE1\u606F" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { ref: imageButton, className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(AnnotatedImage, { image }) }) }, image.src),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("dl", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dd", { title: detail.sample.image_path, children: detail.sample.image_path }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "\u56FE\u50CF\u540D" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "UUID" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dd", { "data-field": "sample-uuid", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "\u539F\u59CB\u8D28\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dd", { children: detail.sample.quality_status }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "\u5206\u8FA8\u7387" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("dd", { children: [
            detail.sample.width,
            " \xD7 ",
            detail.sample.height
          ] }),
          mode !== "review" && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "\u4EBA\u5DE5\u7ED3\u679C" }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dd", { children: detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} \xB7 ${detail.review_decision.reviewer}` : "\u5F85\u4EBA\u5DE5\u590D\u6838" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("dd", { children: detail.technical_quality_score })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("section", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("h3", { children: [
            "Labelme \u6807\u6CE8 \xB7 ",
            detail.annotations.length
          ] }),
          detail.annotations.length ? detail.annotations.map((a) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "iad-annotation", children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: a.raw_label }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { children: [
              a.bbox?.join(", "),
              " \xB7 ",
              a.geometry_status
            ] })
          ] }, a.annotation_id)) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }),
          detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: i.message }, index)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("section", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
          detail.suggestion ? /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: detail.suggestion.suggested_label }),
              " \xB7 ",
              detail.suggestion.reason_category,
              " \xB7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ",
              detail.suggestion.confidence === null ? "\u672A\u8BB0\u5F55" : `${Math.round(detail.suggestion.confidence * 100)}%`
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "iad-observation", children: detail.suggestion.notes }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("small", { className: "iad-muted", children: detail.suggestion.model_name }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
              AuditFindings,
              {
                analysis: detail.suggestion.analysis,
                onEvidence: (image2, finding) => setLightbox({ ...evidenceSource(image2), initialSelection: { kind: "evidence", id: image2.evidence_id, findingId: finding.finding_id } }),
                onLocate: (finding) => {
                  const overview = detail.suggestion.analysis.overview;
                  setLightbox({ ...evidenceSource(overview), initialSelection: { kind: "finding", id: finding.finding_id } });
                }
              },
              detail.suggestion.suggestion_id
            ),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { className: "iad-muted", children: [
              "\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \xB7 ",
              detail.suggestion.reference_sample_ids.length,
              " \u5F20\u53C2\u8003\u56FE"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "iad-reference-grid", children: detail.normal_knowledge?.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)).map((item) => {
              const src = `/api/iad/knowledge/evidence/${encodeURIComponent(detail.normal_knowledge.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
              return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("img", { alt: "\u672C\u6B21\u5BA1\u8BA1\u7684\u77E5\u8BC6\u6765\u6E90", src }) }, item.image.evidence_id);
            }) }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(RuleAssessments, { analysis: detail.suggestion.analysis, knowledge: [...detail.normal_knowledge ? [detail.normal_knowledge] : [], ...detail.defect_knowledge ? [detail.defect_knowledge] : []], onEvidence: (image2) => setLightbox(evidenceSource(image2)) }),
            detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("details", { className: "iad-analysis", children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }),
              detail.normal_knowledge ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }),
              detail.defect_knowledge && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(DatasetKnowledge, { knowledge: detail.defect_knowledge }),
              !!detail.suggestion.analysis.knowledge_limitations.length && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { className: "iad-muted", children: [
                "\u77E5\u8BC6\u9650\u5236\uFF1A",
                detail.suggestion.analysis.knowledge_limitations.join("\uFF1B")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: [
                "\u5C40\u90E8\u8986\u76D6 ",
                detail.suggestion.analysis.coverage.inspected_regions,
                " / ",
                detail.suggestion.analysis.coverage.planned_regions,
                " \xB7 ",
                detail.suggestion.analysis.coverage.complete ? "\u8BA1\u5212\u5DF2\u8986\u76D6" : "\u68C0\u67E5\u672A\u5B8C\u6210"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview), alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { children: [
                  "\u5168\u56FE \xB7 ",
                  detail.suggestion.analysis.overview.sent_size.join(" \xD7 "),
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: detail.suggestion.analysis.global_view.description }),
              detail.suggestion.analysis.regions.map((region, index) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("h3", { children: [
                  "\u5C40\u90E8 \xB7 ",
                  region.origins.map((origin) => origin.label).join(" / ")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("small", { children: [
                  regionSources[region.source],
                  " \xB7 \u539F\u56FE\u5750\u6807 ",
                  region.crop_bbox.join(", ")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, region.image), alt: `\u5BA1\u8BA1 ROI ${index + 1}` }),
                  /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { children: [
                    region.image.sent_size.join(" \xD7 "),
                    " \xB7 PNG",
                    detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: region.observation.description }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                  "\u4F4D\u7F6E\uFF1A",
                  region.observation.position_analysis
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                  "\u5149\u7167\uFF1A",
                  region.observation.illumination_analysis
                ] })
              ] }, index)),
              detail.suggestion.analysis.auxiliary_evidence.map((image2) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image2)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, image2), alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }),
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { children: [
                  "\u6807\u6CE8\u5B9A\u4F4D\u56FE",
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(image2.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }, image2.evidence_id)),
              detail.suggestion.analysis.conclusion.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { className: "iad-error", children: [
                "\u89C2\u5BDF\u77DB\u76FE\uFF1A",
                detail.suggestion.analysis.conclusion.conflicts.join("\uFF1B")
              ] }),
              detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { className: "iad-error", children: [
                "\u7F3A\u5931\u8BC1\u636E\uFF1A",
                detail.suggestion.analysis.conclusion.missing_evidence.join("\uFF1B")
              ] }),
              detail.suggestion.analysis.joint_steps.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("details", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("summary", { children: [
                  "\u8054\u5408\u5206\u6790\u8BB0\u5F55 \xB7 ",
                  detail.suggestion.analysis.joint_steps.length,
                  " \u6B65"
                ] }),
                detail.suggestion.analysis.joint_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("strong", { children: [
                    step.step_id,
                    " \xB7 ",
                    step.result.suggested_label
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                    step.input_evidence_ids.length,
                    " \u5F20\u56FE\u50CF",
                    step.child_step_ids.length ? ` \xB7 \u6C47\u603B ${step.child_step_ids.join("\u3001")}` : ""
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: step.result.description }),
                  "resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                      "\u5DF2\u6392\u9664\u7591\u70B9\uFF1A",
                      resolution.description
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                      "\u6B63\u5E38\u89E3\u91CA\uFF1A",
                      resolution.normal_explanation
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(AuditEvidence, { analysis: detail.suggestion.analysis, ids: resolution.evidence_ids, label: resolution.description, onEvidence: (image2) => setLightbox(evidenceSource(image2)) })
                  ] }, index))
                ] }, step.step_id))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { className: "iad-muted", children: [
                "\u7ED3\u8BBA\u5F15\u7528 ",
                detail.suggestion.analysis.conclusion.evidence_ids.length,
                " \u9879\u89C6\u89C9\u8BC1\u636E"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                "\u4F4D\u7F6E\u5206\u6790\uFF1A",
                detail.suggestion.analysis.conclusion.position_analysis
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("p", { children: [
                "\u5149\u7167\u5206\u6790\uFF1A",
                detail.suggestion.analysis.conclusion.illumination_analysis
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })
        ] }),
        mode === "model" && job && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("section", { className: "iad-single-job", "aria-label": "\u5F53\u524D\u6837\u672C\u4F5C\u4E1A", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(JobCard, { job, onChanged: onJobsChanged }, job.run_id) }),
        mode === "review" ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId, detail, onSubmitted: (record) => onReviewed(record, detail.sample.relative_path) }) : mode !== "browse" && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "iad-actions", children: [
          mode === "dataset" && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { disabled: busy, onClick: setReference, children: dataset.reference_sample_ids.includes(sampleId) ? "\u79FB\u51FA\u826F\u54C1\u53C2\u8003" : "\u8BBE\u4E3A\u826F\u54C1\u53C2\u8003" }),
          mode === "model" && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { className: "iad-primary", disabled: busy || jobRunning, onClick: audit, children: busy || jobRunning ? "\u6B63\u5728\u8054\u5408\u5BA1\u8BA1\u2026" : "\u6309\u77E5\u8BC6\u5BA1\u8BA1\u6B64\u56FE" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { onClick: () => workspace.navigate("industrial-review", sampleId), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" })
        ] })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(ImageViewer, { image: lightbox, navigation, onClose: () => {
        navigation?.cancel();
        setLightbox(null);
        if (workspace.view(state.pageId).inspection) workspace.updateView(state.pageId, { inspection: null }, true);
      } })
    ] });
  }

  // src/client/components/QualityReport.tsx
  var import_react13 = __toESM(__require("react"), 1);
  var import_jsx_runtime18 = __require("react/jsx-runtime");
  function QualityReport({ report }) {
    const quality = report.quality;
    const dimensions = [
      ["\u6280\u672F\u53EF\u7528\u7387", quality.technical_usability],
      ["\u5BA1\u8BA1\u8986\u76D6\u7387", quality.audit_coverage],
      ["\u4EBA\u5DE5\u6838\u9A8C\u8986\u76D6\u7387", quality.human_verification_coverage]
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dl", { children: dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_react13.default.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dd", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: ratio.percent === null ? "\u672A\u8BC4\u4F30" : `${ratio.percent}%` }),
          " \xB7 ",
          ratio.numerator,
          " / ",
          ratio.denominator
        ] })
      ] }, label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dl", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u7591\u70B9\u56FE\u50CF / \u6570" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dd", { children: [
          quality.model.suspect_samples,
          " / ",
          quality.model.finding_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u7F3A\u8BC1 / \u51B2\u7A81\u56FE\u50CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dd", { children: [
          quality.model.missing_evidence_samples,
          " / ",
          quality.model.conflict_samples
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u6A21\u578B\u4E0D\u786E\u5B9A" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: quality.model.uncertain_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u65E0\u7ED3\u6784\u5316\u5206\u6790" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: quality.model.unstructured_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u4EBA\u5BA1\u826F\u54C1 / \u5F02\u5E38" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dd", { children: [
          "\u826F\u54C1 ",
          report.human_pass_count,
          " \xB7 \u5F02\u5E38 ",
          report.human_fail_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u4EBA\u5DE5\u5F85\u5B9A / \u8DF3\u8FC7" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dd", { children: [
          report.human_uncertain_count,
          " / ",
          report.human_skipped_count
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("details", { className: "iad-analysis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("summary", { children: "\u53E3\u5F84\u3001\u8303\u56F4\u4E0E\u7248\u672C" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u8F93\u5165 / \u5DF2\u767B\u8BB0" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dd", { children: [
            quality.scope.observed_inputs,
            " / ",
            quality.scope.registered_samples,
            "\uFF0C\u672A\u767B\u8BB0 ",
            quality.scope.unregistered_inputs
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: "\u5168\u90E8\u5DF2\u4FDD\u5B58\u56FE\u50CF\uFF0C\u6BCF\u5F20\u53D6\u6700\u65B0\u8BB0\u5F55\uFF1B\u4E0D\u53D7\u5F53\u524D\u7F51\u683C\u7B5B\u9009\u5F71\u54CD\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u7EDF\u8BA1\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("time", { dateTime: report.generated_at, children: report.generated_at }) }),
          dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_react13.default.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: ratio.basis })
          ] }, label))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h3", { children: "\u5BA1\u8BA1\u4F7F\u7528\u7684\u77E5\u8BC6\u7EC4\u5408" }),
        quality.knowledge_versions.length ? quality.knowledge_versions.map((usage, index) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u56FE\u50CF\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: usage.sample_count }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: usage.normal_version_id || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u4E0D\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: usage.defect_version_id || "\u672A\u4F7F\u7528" }),
          usage.legacy_profile_id && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dt", { children: "\u53C2\u8003\u6A21\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("dd", { children: usage.legacy_profile_id })
          ] })
        ] }, index)) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: "\u5C1A\u65E0\u53EF\u8FFD\u6EAF\u7684\u77E5\u8BC6\u7248\u672C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h3", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        quality.audit_run_ids.length ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("ul", { children: quality.audit_run_ids.map((id) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("li", { children: id }, id)) }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: "\u5C1A\u65E0\u5DF2\u8BB0\u5F55\u7684\u5BA1\u8BA1\u4F5C\u4E1A\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("ul", { children: quality.scope.limitations.map((text) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("li", { children: text }, text)) })
      ] })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_react15 = __require("react");

  // src/client/useKnowledge.ts
  var import_react14 = __require("react");
  var empty = { knowledge: null, versions: [], freshness: null };
  function useKnowledge(datasetId, kind, versionId = "", revision = 0) {
    const queryIdentity = (0, import_react14.useMemo)(() => ({ scope: JSON.stringify([datasetId, kind, versionId]), revision }), [datasetId, kind, versionId, revision]);
    const [value, setValue] = (0, import_react14.useState)();
    (0, import_react14.useEffect)(() => {
      if (!datasetId || !kind) return;
      const controller = new AbortController();
      const query = new URLSearchParams({ dataset_id: datasetId, kind, ...versionId ? { version_id: versionId } : {} });
      request(`/knowledge?${query}`, void 0, void 0, controller.signal).then((data2) => {
        if (!controller.signal.aborted) setValue({ query: queryIdentity, data: data2, error: "" });
      }).catch((error) => {
        if (!controller.signal.aborted) setValue((previous) => ({ query: queryIdentity, data: previous?.query.scope === queryIdentity.scope ? previous.data : empty, error: message(error) }));
      });
      return () => controller.abort();
    }, [queryIdentity]);
    if (!datasetId || !kind) return { ...empty, loading: false, error: "" };
    const data = value?.query.scope === queryIdentity.scope ? value.data : empty;
    return { ...data, loading: value?.query !== queryIdentity, error: value?.query === queryIdentity ? value.error : "" };
  }

  // src/client/components/KnowledgeState.tsx
  var import_jsx_runtime19 = __require("react/jsx-runtime");
  var reasons = { image: "\u56FE\u50CF\u5185\u5BB9\u53D8\u5316", annotations: "\u5DF2\u5BFC\u5165\u6807\u6CE8\u53D8\u5316", review: "\u4EBA\u5DE5\u53CD\u9988\u53D8\u5316", audit_candidates: "\u5BA1\u8BA1\u5019\u9009\u53D8\u5316", qualification: "\u6765\u6E90\u8D44\u683C\u53D8\u5316", unavailable: "\u6765\u6E90\u65E0\u6CD5\u8BFB\u53D6\u6216\u6838\u9A8C" };
  function KnowledgeState({ freshness }) {
    if (!freshness) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("section", { "aria-label": "\u77E5\u8BC6\u6765\u6E90\u72B6\u6001", className: "iad-info-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { role: "status", children: freshness.status === "changed" ? freshness.source_changes.length ? "\u6765\u6E90\u53D1\u751F\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : "\u77E5\u8BC6\u4F9D\u8D56\u6216\u751F\u6210\u89C4\u5219\u53D1\u751F\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : freshness.status === "unverified" ? "\u751F\u6210\u89C4\u5219\u5C1A\u672A\u6838\u5B9E\uFF0C\u8BF7\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : "\u6765\u6E90\u4E0E\u751F\u6210\u89C4\u5219\u672A\u53D8\u5316\u3002" }),
      freshness.normal_version_changed && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { children: [
        "\u6240\u4F9D\u636E\u7684\u826F\u54C1\u7248\u672C\u5DF2\u975E\u5F53\u524D\u53D1\u5E03\u7248\u672C\u3002\u5F53\u524D\u826F\u54C1\uFF1A",
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("code", { children: freshness.current_normal_version_id || "\u65E0" })
      ] }),
      freshness.normal_sources_changed && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: "\u6240\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7684\u6765\u6E90\u6216\u751F\u6210\u89C4\u5219\u9700\u8981\u91CD\u65B0\u6838\u9A8C\u3002" }),
      freshness.generation_changed && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: "\u77E5\u8BC6\u751F\u6210\u89C4\u5219\u5DF2\u53D8\u5316\u3002" }),
      !!freshness.source_changes.length && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("summary", { children: [
          freshness.source_changes.length,
          " \u5F20\u6765\u6E90\u9700\u8981\u6838\u9A8C"
        ] }),
        freshness.source_changes.map((change) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("code", { children: change.sample_id.slice(change.sample_id.indexOf(":") + 1) }),
          " \xB7 ",
          change.reasons.map((reason) => reasons[reason]).join("\u3001")
        ] }, change.sample_id))
      ] }),
      !!freshness.additional_source_ids.length && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { children: [
        freshness.additional_source_ids.length,
        " \u5F20\u5408\u683C\u5019\u9009\u672A\u7EB3\u5165\u6B64\u7248\u672C\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("small", { className: "iad-muted", children: [
        "\u6838\u9A8C\u65F6\u95F4 ",
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("time", { dateTime: freshness.checked_at, children: new Date(freshness.checked_at).toLocaleString() })
      ] })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_jsx_runtime20 = __require("react/jsx-runtime");
  function AuditJobs({ dataset, filters, jobs, revision, onJobsChanged }) {
    const { workspace } = useWorkspace();
    const view = workspace.view("industrial-audit");
    const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
    const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
    const normal = normalQuery.knowledge;
    const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
    const loading = normalQuery.loading || defectQuery.loading;
    const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "\u6240\u9009\u4E0D\u826F\u77E5\u8BC6\u4E0E\u826F\u54C1\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" : "");
    const [lightbox, setLightbox] = (0, import_react15.useState)(null);
    const [model, setModel] = (0, import_react15.useState)("Qwen/Qwen3.8-27B-FP8");
    const [busy, setBusy] = (0, import_react15.useState)(false);
    const [error, setError] = (0, import_react15.useState)("");
    async function start() {
      setBusy(true);
      setError("");
      try {
        const input = {
          dataset_id: dataset.dataset_id,
          model_name: model,
          normal_version_id: normal?.version_id,
          defect_version_id: defect?.version_id,
          filters
        };
        await request("/audit/start", input);
        onJobsChanged();
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("section", { className: "iad-job-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h2", { children: "\u5BA1\u8BA1\u77E5\u8BC6" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("label", { className: "iad-field", children: [
            "\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: loading, onChange: (event) => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("option", { value: "", children: "\u5F53\u524D\u7248\u672C" }),
              normalQuery.versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("label", { className: "iad-field", children: [
            "\u4E0D\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u4E0D\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.defectVersion, disabled: loading || !normal, onChange: (event) => workspace.updateView("industrial-audit", { defectVersion: event.target.value }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("option", { value: "", children: "\u5339\u914D\u7684\u5F53\u524D\u7248\u672C" }),
              defectQuery.versions.filter((version) => version.normal_version_id === normal?.version_id).map((version) => /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] })
        ] }),
        loading ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u77E5\u8BC6\u2026" }) : loadError ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { role: "alert", className: "iad-error", children: loadError }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, { children: [
          normal ? /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(DatasetKnowledge, { knowledge: normal }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(KnowledgeState, { freshness: normalQuery.freshness }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "iad-reference-grid", children: normal.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw").map((item) => {
              const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
              return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u56FE", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("img", { alt: "\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", src }) }, item.image.evidence_id);
            }) })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "iad-profile iad-muted", children: "\u8BF7\u5148\u8FD0\u884C\u201C\u6316\u6398\u826F\u54C1\u77E5\u8BC6\u201D\u6280\u80FD\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002" }),
          defect ? /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(DatasetKnowledge, { knowledge: defect }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(KnowledgeState, { freshness: defectQuery.freshness })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h2", { children: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("label", { children: [
            "\u6A21\u578B",
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, onChange: (e) => setModel(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { className: "iad-primary", onClick: start, disabled: busy || loading || !!loadError || !normal?.checks.some((check) => check.status === "supported") || jobs.some((j) => j.status === "RUNNING" || j.status === "PENDING"), children: busy ? "\u542F\u52A8\u4E2D\u2026" : "\u5BA1\u8BA1\u5F53\u524D\u7B5B\u9009\u5168\u90E8\u56FE\u50CF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "iad-muted", children: "\u7ED3\u5408\u51BB\u7ED3\u77E5\u8BC6\u3001\u5168\u56FE\u4E0E\u5168\u90E8\u5C40\u90E8\u56FE\uFF0C\u7EFC\u5408\u5206\u6790\u4F4D\u7F6E\u548C\u5149\u7167\u3002" }),
        error && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { role: "alert", className: "iad-error", children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(JobCard, { job, onChanged: onJobsChanged }, job.run_id)),
        !jobs.length && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }
  function AuditReport({ dataset }) {
    const [report, setReport] = (0, import_react15.useState)(null);
    const [error, setError] = (0, import_react15.useState)("");
    (0, import_react15.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("section", { className: "iad-job-section iad-quality-report", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      report && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(QualityReport, { report }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { onClick: download, children: "\u5BFC\u51FA JSON" })
      ] })
    ] });
  }

  // src/client/components/KnowledgePage.tsx
  var import_react18 = __require("react");

  // src/client/useJobs.ts
  var import_react16 = __require("react");
  function useJobs(kind, datasetId, onProgress, selectedRunId = "") {
    const [jobs, setJobs] = (0, import_react16.useState)([]);
    const [error, setError] = (0, import_react16.useState)("");
    const [revision, setRevision] = (0, import_react16.useState)(0);
    const observed = (0, import_react16.useRef)({ datasetId: "", signature: "" });
    const refresh = (0, import_react16.useCallback)(() => setRevision((value) => value + 1), []);
    (0, import_react16.useEffect)(() => {
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
          if (selectedRunId && !result.jobs.some((job) => job.run_id === selectedRunId)) {
            const selected = await request(`/${kind}/status/${encodeURIComponent(selectedRunId)}`, void 0, void 0, controller.signal);
            if (selected.dataset_id !== datasetId) throw new Error("\u6240\u9009\u4F5C\u4E1A\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6570\u636E\u96C6");
            result.jobs.push(selected);
          }
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
    }, [kind, datasetId, onProgress, revision, selectedRunId]);
    return { jobs, error, refresh };
  }

  // src/client/components/KnowledgeRevision.tsx
  var import_react17 = __require("react");
  var import_jsx_runtime21 = __require("react/jsx-runtime");
  function KnowledgeRevision({ versionId, check, busy, error, onSubmit, onClose }) {
    const [instruction, setInstruction] = (0, import_react17.useState)(check.criterion);
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Modal, { title: "\u4FEE\u8BA2\u5224\u636E", onClose: () => {
      if (!busy) onClose();
    }, children: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("form", { onSubmit: (event) => {
      event.preventDefault();
      if (!busy && instruction.trim()) onSubmit(instruction.trim());
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h2", { children: check.title }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { className: "iad-muted", children: [
        "\u57FA\u51C6\u7248\u672C ",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("code", { children: versionId })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("label", { className: "iad-field", children: [
        "\u4FEE\u8BA2\u5EFA\u8BAE",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("textarea", { "aria-label": "\u5224\u636E\u4FEE\u8BA2\u5EFA\u8BAE", required: true, value: instruction, disabled: busy, onChange: (event) => setInstruction(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { className: "iad-muted", children: "\u91CD\u65B0\u770B\u56FE\u6838\u9A8C\u540E\u5F62\u6210\u540E\u7EE7\u7248\u672C\uFF0C\u5F53\u524D\u7248\u672C\u4FDD\u7559\u3002" }),
      error && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { role: "alert", className: "iad-error", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { type: "submit", className: "iad-primary", disabled: busy || !instruction.trim(), children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : "\u63D0\u4EA4\u6838\u9A8C" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { type: "button", disabled: busy, onClick: onClose, children: "\u53D6\u6D88" })
      ] })
    ] }) });
  }

  // src/client/components/KnowledgePage.tsx
  var import_jsx_runtime22 = __require("react/jsx-runtime");
  function KnowledgePage({ dataset, kind, refreshRevision }) {
    const { workspace } = useWorkspace();
    const pageId = kind === "normal" ? "industrial-normal" : "industrial-defect";
    const view = workspace.view(pageId);
    const [error, setError] = (0, import_react18.useState)("");
    const [busy, setBusy] = (0, import_react18.useState)(false);
    const [revision, setRevision] = (0, import_react18.useState)(0);
    const current = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
    const reference = useKnowledge(dataset.dataset_id, kind === "defect" ? "normal" : null, view.normalVersion, revision + refreshRevision);
    const { knowledge, versions } = current;
    const normal = reference.knowledge, normalVersions = reference.versions;
    const loading = current.loading || reference.loading, loadError = current.error || reference.error;
    const [lightbox, setLightbox] = (0, import_react18.useState)(null);
    const [model, setModel] = (0, import_react18.useState)("");
    const updated = (0, import_react18.useCallback)(() => setRevision((value) => value + 1), []);
    const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
    const jobs = polling.jobs.filter((job) => job.kind === kind);
    const running = jobs.some((job) => job.status === "RUNNING" || job.status === "PENDING");
    const [checkId, setCheckId] = (0, import_react18.useState)("");
    const [editing, setEditing] = (0, import_react18.useState)(null);
    async function start(correction) {
      setBusy(true);
      setError("");
      try {
        const input = { dataset_id: dataset.dataset_id, kind, ...kind === "defect" ? { normal_version_id: normal?.version_id } : {}, ...model.trim() ? { model_name: model.trim() } : {}, ...correction };
        await request("/knowledge/start", input);
        setEditing(null);
        workspace.updateView(pageId, { version: "" });
        polling.refresh();
        updated();
      } catch (error2) {
        setError(message(error2));
      } finally {
        setBusy(false);
      }
    }
    const term = view.knowledgeSearch.trim().normalize("NFKC").toLocaleLowerCase();
    const checks = (knowledge?.checks || []).filter((item) => (!view.knowledgeStatus || item.status === view.knowledgeStatus) && [item.title, item.subject, item.location, item.criterion, ...item.allowed_variations, ...item.limitations].join(" ").normalize("NFKC").toLocaleLowerCase().includes(term));
    const check = checks.find((check2) => check2.check_id === checkId) || checks[0];
    function evidence(ids) {
      return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "iad-knowledge-evidence iad-reference-grid", children: knowledge?.evidence.filter((item) => ids.includes(item.image.evidence_id)).map((item) => {
        const image = item.image;
        const src = `/api/iad/knowledge/evidence/${encodeURIComponent(knowledge.version_id)}/${encodeURIComponent(image.evidence_id)}`;
        return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("button", { title: `\u67E5\u770B ${image.role} \xB7 ${image.representation}`, onClick: () => setLightbox({ src, title: `${image.role} \xB7 ${image.representation} \xB7 ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("img", { src, alt: `${image.role} ${image.representation}` }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("small", { children: [
            image.role,
            " \xB7 ",
            image.representation
          ] })
        ] }, image.evidence_id);
      }) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-knowledge-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("strong", { children: [
            "\u5168\u90E8\u5408\u683C",
            kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38",
            "\u5019\u9009"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { children: [
            "\u6A21\u578B",
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("input", { "aria-label": "\u77E5\u8BC6\u6316\u6398\u6A21\u578B", placeholder: "\u4F7F\u7528\u9879\u76EE\u914D\u7F6E", value: model, onChange: (event) => setModel(event.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-primary", disabled: busy || loading || !!loadError || running || (kind === "normal" ? !dataset.reference_sample_ids.length : !normal?.checks.some((check2) => check2.status === "supported") || !!view.normalVersion && normal.version_id !== view.normalVersion), onClick: () => void start(), children: busy ? "\u542F\u52A8\u4E2D\u2026" : `\u5F00\u59CB\u6316\u6398${kind === "normal" ? "\u826F\u54C1" : "\u4E0D\u826F\u54C1"}\u77E5\u8BC6` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { className: "iad-field", children: [
          "\u77E5\u8BC6\u7248\u672C",
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: (event) => workspace.updateView(pageId, { version: event.target.value }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("option", { value: "", children: [
              "\u5F53\u524D\u53D1\u5E03\u7248\u672C",
              versions.length ? "" : " \xB7 \u5C1A\u672A\u53D1\u5E03"
            ] }),
            versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("option", { value: version.version_id, children: [
              version.version_id,
              " \xB7 ",
              version.source_count,
              " \u5F20\u6765\u6E90 \xB7 ",
              version.created_at
            ] }, version.version_id))
          ] })
        ] }),
        view.version && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u7248\u672C\uFF1B\u65B0\u4F5C\u4E1A\u4ECE\u5F53\u524D\u5DF2\u53D1\u5E03\u7248\u672C\u7EE7\u7EED\u6838\u9A8C\u3002" }),
        kind === "defect" && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { className: "iad-field", children: [
            "\u4E0B\u6B21\u6316\u6398\u4F9D\u636E\u7684\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("select", { "aria-label": "\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion || "", onChange: (event) => workspace.updateView(pageId, { normalVersion: event.target.value }), disabled: busy || running, children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: "", children: "\u5F53\u524D\u53D1\u5E03\u7248\u672C" }),
              normalVersions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          !loading && !normal?.checks.some((check2) => check2.status === "supported") && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
            "\u6240\u9009\u7248\u672C\u6CA1\u6709\u53EF\u7528\u7684\u826F\u54C1\u5224\u636E\u3002",
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: () => workspace.navigate("industrial-normal"), children: "\u524D\u5F80\u826F\u54C1\u77E5\u8BC6" })
          ] })
        ] }),
        loading && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { role: "status", className: "iad-muted", children: "\u6B63\u5728\u8BFB\u53D6\u77E5\u8BC6\u2026" }),
        loadError && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { role: "alert", className: "iad-error", children: [
          loadError,
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: updated, children: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6" })
        ] }),
        (error || polling.error) && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { role: "alert", className: "iad-error", children: error || polling.error }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: "\u53C2\u8003\u8D44\u683C\u4E0E\u521D\u59CB\u65E0\u6807\u6CE8\u7EA6\u5B9A\u5728\u6570\u636E\u96C6\u7BA1\u7406\u7EF4\u62A4\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u7EF4\u62A4\u5019\u9009\u6765\u6E90" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("nav", { className: "iad-tabs", "aria-label": "\u77E5\u8BC6\u89C6\u56FE", children: [["results", "\u77E5\u8BC6\u6761\u76EE"], ["findings", kind === "normal" ? "\u5F85\u6838\u5B9E" : "\u6807\u6CE8\u6838\u9A8C"], ["versions", "\u7248\u672C"], ["jobs", "\u4F5C\u4E1A\u8BB0\u5F55"]].map(([tab, title]) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: view.tab === tab ? "active" : "", "aria-pressed": view.tab === tab, onClick: () => workspace.updateView(pageId, { tab }), children: title }, tab)) }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("section", { className: "iad-knowledge-content iad-job-section", children: knowledge ? /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(KnowledgeState, { freshness: current.freshness }),
        knowledge.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { "data-field": "knowledge-normal-version", children: [
          "\u6B64\u77E5\u8BC6\u7248\u672C\u4F9D\u636E\u826F\u54C1 ",
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("code", { children: knowledge.normal_version_id })
        ] }),
        knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: "\u4E0B\u6B21\u6316\u6398\u5C06\u4F7F\u7528\u53E6\u4E00\u826F\u54C1\u7248\u672C\uFF0C\u5F53\u524D\u7ED3\u679C\u4FDD\u7559\u539F\u4F9D\u636E\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: knowledge.summary }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "iad-muted", children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("code", { children: knowledge.version_id }),
          " \xB7 ",
          knowledge.sources.length,
          " \u5F20\u6765\u6E90 \xB7 ",
          knowledge.checks.length,
          " \u9879\u5224\u636E \xB7 ",
          knowledge.findings.length,
          " \u9879\u6838\u9A8C"
        ] }),
        view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-row", "aria-label": "\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009", children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { className: "iad-field", children: [
              "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE",
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: view.knowledgeSearch, onChange: (event) => workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { className: "iad-field", children: [
              "\u652F\u6301\u72B6\u6001",
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u652F\u6301\u72B6\u6001", value: view.knowledgeStatus, onChange: (event) => workspace.updateView(pageId, { knowledgeStatus: event.target.value }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
                Object.entries(knowledgeStatuses).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value, children: label }, value))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { disabled: !view.knowledgeSearch && !view.knowledgeStatus, onClick: () => workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" }), children: "\u6E05\u9664\u77E5\u8BC6\u7B5B\u9009" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { role: "status", "aria-label": "\u77E5\u8BC6\u7B5B\u9009\u7ED3\u679C", children: [
            "\u663E\u793A ",
            checks.length,
            " / ",
            knowledge.checks.length,
            " \u9879\u5224\u636E"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-knowledge-split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-check-list", children: [
              checks.map((item) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("button", { "aria-pressed": check?.check_id === item.check_id, onClick: () => setCheckId(item.check_id), children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: item.title }),
                /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                  knowledgeStatuses[item.status],
                  " \xB7 \u652F\u6301 ",
                  item.support_evidence_ids.length,
                  " / \u53CD\u5BF9 ",
                  item.counter_evidence_ids.length
                ] })
              ] }, item.check_id)),
              !checks.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: knowledge.checks.length ? "\u6CA1\u6709\u5339\u914D\u7684\u5224\u636E\uFF0C\u8BF7\u8C03\u6574\u6216\u6E05\u9664\u7B5B\u9009\u3002" : "\u5C1A\u65E0\u53EF\u53D1\u5E03\u5224\u636E\uFF0C\u8BF7\u67E5\u770B\u9650\u5236\u548C\u6838\u9A8C\u7ED3\u679C\u3002" })
            ] }),
            check && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("article", { className: "iad-info-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h2", { children: check.title }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
                check.subject,
                " \xB7 ",
                check.location
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: check.criterion }),
              !view.version && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { disabled: busy || loading || !!loadError || running, onClick: () => {
                setError("");
                setEditing({ versionId: knowledge.version_id, check });
              }, children: "\u4FEE\u8BA2\u5224\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
                "\u5141\u8BB8\u53D8\u5316\uFF1A",
                check.allowed_variations.join("\uFF1B") || "\u672A\u8BB0\u5F55"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: "\u652F\u6301\u8BC1\u636E" }),
              evidence(check.support_evidence_ids),
              !!check.counter_evidence_ids.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: "\u53CD\u5BF9\u8BC1\u636E" }),
                evidence(check.counter_evidence_ids)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
            ] })
          ] })
        ] }),
        view.tab === "findings" && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
          knowledge.findings.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("article", { className: "iad-info-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: finding.judgment.status === "supported" ? "\u56FE\u50CF\u652F\u6301\u5F02\u5E38" : finding.judgment.status === "refuted" ? "\u6B63\u5E38\u89E3\u91CA\u6210\u7ACB" : "\u8BC1\u636E\u4E0D\u8DB3" }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: finding.judgment.description }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
              "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
              finding.judgment.normal_explanation
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: finding.judgment.limitations.join("\uFF1B") }),
            evidence(finding.judgment.evidence_ids),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })
          ] }, finding.finding_id)),
          !knowledge.findings.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })
        ] }),
        !!knowledge.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("summary", { children: "\u77E5\u8BC6\u9650\u5236" }),
          knowledge.limitations.map((limitation, index) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: limitation }, index))
        ] }),
        !!knowledge.corrections.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("summary", { children: "\u4EBA\u5DE5\u4FEE\u8BA2\u5019\u9009" }),
          knowledge.corrections.map((item) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: item.instruction }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: knowledge.revisions.find((revision2) => revision2.previous_check_id === item.check_id)?.reason })
          ] }, item.check_id))
        ] }),
        view.tab === "versions" && versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("article", { className: "iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: () => workspace.updateView(pageId, { version: version.version_id, tab: "results" }), children: version.version_id }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
            version.source_count,
            " \u5F20\u6765\u6E90 \xB7 ",
            version.check_count,
            " \u9879\u5224\u636E \xB7 ",
            version.created_at
          ] }),
          version.parent_version_id && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "iad-muted", children: [
            "\u7236\u7248\u672C ",
            version.parent_version_id
          ] }),
          version.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "iad-muted", children: [
            "\u4F9D\u636E\u826F\u54C1\u7248\u672C ",
            version.normal_version_id
          ] })
        ] }, version.version_id))
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
        "\u5C1A\u65E0",
        kind === "normal" ? "\u826F\u54C1" : "\u4E0D\u826F\u54C1",
        "\u77E5\u8BC6\u7248\u672C\u3002"
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-knowledge-jobs iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }),
        jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(JobCard, { job, onChanged: polling.refresh }, job.run_id)),
        !jobs.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: "\u5C1A\u65E0\u6316\u6398\u4F5C\u4E1A\u3002" })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) }),
      editing && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(KnowledgeRevision, { versionId: editing.versionId, check: editing.check, busy, error, onClose: () => {
        setEditing(null);
        setError("");
      }, onSubmit: (instruction) => void start({ base_version_id: editing.versionId, corrections: [{ check_id: editing.check.check_id, instruction }] }) })
    ] });
  }

  // src/client/components/ReviewRecords.tsx
  var import_react19 = __require("react");
  var import_jsx_runtime23 = __require("react/jsx-runtime");
  function ReviewRecords({ datasetId, page, search, selected, revision, onPage, onSearch, onSelect }) {
    const [result, setResult] = (0, import_react19.useState)(null);
    const [loading, setLoading] = (0, import_react19.useState)(true), [error, setError] = (0, import_react19.useState)("");
    const [retry, setRetry] = (0, import_react19.useState)(0);
    (0, import_react19.useEffect)(() => {
      const controller = new AbortController();
      setLoading(true);
      setError("");
      const query = new URLSearchParams({ dataset_id: datasetId, page: String(page), page_size: String(pageSize), search });
      request(`/review/history?${query}`, void 0, void 0, controller.signal).then((result2) => {
        if (!controller.signal.aborted) setResult(result2);
      }).catch((error2) => {
        if (!controller.signal.aborted) setError(message(error2));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [datasetId, page, search, revision, retry]);
    const pagination = result && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Pagination, { total: result.total, page, unit: "\u6761\u8BB0\u5F55", onPage });
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("section", { className: "iad-review-records", "aria-label": "\u590D\u6838\u8BB0\u5F55", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("label", { className: "iad-field", children: [
        "\u641C\u7D22\u590D\u6838\u8BB0\u5F55",
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("input", { "aria-label": "\u641C\u7D22\u590D\u6838\u8BB0\u5F55", placeholder: "\u56FE\u50CF\u540D\u3001\u590D\u6838\u4EBA\u6216\u8BF4\u660E", value: search, onChange: (event) => onSearch(event.target.value) })
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { role: "alert", className: "iad-error", children: [
        error,
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { onClick: () => setRetry((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D\u8BB0\u5F55" })
      ] }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u590D\u6838\u8BB0\u5F55\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(import_jsx_runtime23.Fragment, { children: [
        pagination,
        result?.items.length ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "iad-table-scroll", role: "region", "aria-label": "\u590D\u6838\u5386\u53F2\u8868\u683C", tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("table", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("caption", { children: "\u4EBA\u5DE5\u88C1\u51B3\u5386\u53F2" }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { children: "\u56FE\u50CF" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { children: "\u590D\u6838\u4EBA / \u65F6\u95F4" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { children: "\u590D\u6838\u8BF4\u660E" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { children: "\u64CD\u4F5C" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("tbody", { children: result.items.map((record) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("tr", { "data-decision-id": record.decision_id, "data-selected": record.sample_id === selected, children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { title: record.relative_path, children: record.relative_path }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { children: reviewLabel(record.decision) }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("td", { children: [
              record.reviewer,
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("br", {}),
              record.submitted_at ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "\u672A\u8BB0\u5F55\u63D0\u4EA4\u65F6\u95F4"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { children: record.comment || "\u2014" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { onClick: () => onSelect(record.sample_id), children: "\u67E5\u770B\u6837\u672C" }) })
          ] }, record.decision_id)) })
        ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u590D\u6838\u8BB0\u5F55\u3002" }),
        pagination
      ] })
    ] });
  }

  // src/client/theme.ts
  var themeStyles = `
.iad-workbench,.iad-tool-card,.iad-detail-dialog::backdrop {
 --iad-canvas:var(--dsw-alias-bg-module-platform,#edf2f7);
 --iad-surface:var(--dsw-alias-bg-layer-1,#fff);
 --iad-surface-muted:var(--dsw-alias-bg-module-platform,#e7edf5);
 --iad-text:var(--dsw-alias-label-primary,#1c2a3c);
 --iad-muted:var(--dsw-alias-label-secondary,#53647c);
 --iad-border:var(--dsw-alias-border-l3,#a1adbe);
 --iad-control-border:color-mix(in srgb,var(--iad-muted) 90%,var(--iad-surface));
 --iad-primary:var(--dsw-alias-brand-primary,#215bd5);
 --iad-on-primary:var(--dsw-alias-label-primary-inverted,#fff);
 --iad-hover:var(--dsw-alias-interactive-bg-hover,#e4eaf4);
 --iad-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary,#a22c34) 85%,var(--iad-text));
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
.iad-workbench code {overflow-wrap:anywhere;}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:24px;margin:3px 0 0;font-weight:700;}
.iad-workbench h2 {font-size:17px;margin:0 0 16px;}
.iad-workbench h3 {font-size:14px;margin:20px 0 9px;overflow:hidden;text-overflow:ellipsis;}
.iad-workbench button,.iad-workbench input,.iad-workbench select,.iad-workbench textarea {font:inherit;}
.iad-workbench button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-border);border-radius:8px;min-height:40px;padding:8px 12px;}
.iad-workbench button:hover {background:var(--iad-hover);}
.iad-workbench button:disabled {cursor:default;opacity:.45;}
.iad-workbench button.iad-primary {background:var(--iad-primary);border-color:var(--iad-primary);color:var(--iad-on-primary);}
.iad-workbench button.iad-danger {color:var(--iad-danger);}
.iad-workbench input,.iad-workbench select,.iad-workbench textarea {min-width:0;max-width:100%;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:6px;padding:8px 9px;min-height:40px;}
.iad-workbench :is(input,textarea)::placeholder {color:var(--iad-muted);opacity:1;}
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
.iad-image-frame svg,.iad-finding-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon,.iad-finding-layer rect {fill:none;stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-warning);font-size:calc(14px / var(--iad-view-scale,1));}
.iad-image-frame .iad-annotation-mask {opacity:.28;}
.iad-image-frame .iad-annotation-mask rect {fill:var(--iad-warning);stroke:none;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-row>.iad-field {flex:1 1 280px;min-width:0;}
.iad-error {color:var(--iad-danger);background:var(--iad-danger-bg);padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-review-records {min-width:0;padding:18px;background:var(--iad-surface);border-radius:10px;}
.iad-table-scroll {max-width:100%;overflow:auto;}.iad-review-records table {width:100%;min-width:620px;border-collapse:collapse;text-align:left;font-size:13px;}
.iad-review-records caption {text-align:left;font-weight:600;margin:12px 0;}.iad-review-records th,.iad-review-records td {padding:12px;vertical-align:top;overflow-wrap:anywhere;max-width:240px;}
.iad-review-records thead,.iad-review-records tr[data-selected=true] {background:var(--iad-surface-muted);}.iad-review-records time {font-size:12px;color:var(--iad-muted);}
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
.iad-job {overflow-wrap:anywhere;}.iad-job[aria-current="true"] {outline:2px solid var(--iad-primary);outline-offset:2px;}
.iad-job-links {display:flex;flex-wrap:wrap;gap:8px;}.iad-job-errors {padding-left:20px;}.iad-job-errors p {margin-top:6px;}
.iad-retry-scope {margin-top:12px;display:grid;gap:10px;}.iad-retry-scope fieldset {min-width:0;border:0;padding:0;margin:0;}.iad-retry-scope legend {margin-bottom:8px;}
.iad-retry-samples {max-height:260px;overflow:auto;display:grid;gap:8px;}.iad-retry-samples label {display:flex;align-items:center;gap:8px;padding:8px;background:var(--iad-surface);border-radius:6px;}.iad-retry-samples input {flex:0 0 auto;}.iad-retry-samples span {flex:1;min-width:0;overflow-wrap:anywhere;}
.iad-job progress {width:100%;height:7px;accent-color:var(--iad-primary);}.iad-job small {overflow-wrap:anywhere;}
.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;color:var(--iad-on-viewer);}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-media-load {min-width:0;}.iad-media-error {display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px;background:var(--iad-surface);color:var(--iad-text);line-height:1.5;}
.iad-viewer-media {position:relative;display:flex;flex-direction:column;min-height:0;}
.iad-viewer-media>.iad-media-error {position:absolute;left:0;right:0;bottom:0;z-index:1;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-roi-hint {position:absolute;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;max-width:min(280px,calc(100% - 24px));padding:8px 12px;border-radius:6px;background:var(--iad-surface);color:var(--iad-text);font-size:13px;line-height:1.5;overflow-wrap:anywhere;cursor:default;}
.iad-viewer-body {display:grid;grid-template-columns:minmax(0,1fr);flex:1;min-height:0;margin-top:18px;gap:16px;}
.iad-viewer-body.has-inspection {grid-template-columns:minmax(0,1fr) 340px;}
.iad-inspection-panel {padding:16px;min-width:0;overflow:auto;background:var(--iad-surface);color:var(--iad-text);border-radius:8px;}
.iad-inspection-panel img {display:block;width:100%;max-height:220px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-roi-list {display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.iad-roi-list button[aria-pressed=true],.iad-actions button[aria-current=true] {border-color:var(--iad-primary);background:var(--iad-hover);}
.iad-roi-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;}
.iad-roi-layer rect {fill:none;stroke:var(--iad-on-viewer);stroke-width:calc(1px / var(--iad-view-scale,1));stroke-dasharray:calc(5px / var(--iad-view-scale,1)) calc(4px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-roi-layer [data-locked=true] rect,.iad-roi-layer .is-hovered rect {stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));stroke-dasharray:none;}
@media(max-width:760px){.iad-viewer-body.has-inspection {grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(160px,1fr) minmax(160px,.8fr);}}

.iad-viewer-world {position:absolute;left:50%;top:50%;transform-origin:center;}
.iad-viewer-world .iad-image-frame,.iad-viewer-world img {width:100%;height:100%;}
.iad-eye {display:flex;align-items:center;justify-content:center;}
.iad-layer-menu {position:relative;color:var(--iad-text);}
.iad-layer-menu summary {cursor:pointer;padding:8px 12px;border-radius:8px;background:var(--iad-surface);min-height:40px;}
.iad-layer-menu>div {position:absolute;top:calc(100% + 8px);right:0;z-index:1;min-width:180px;padding:12px;background:var(--iad-surface);box-shadow:0 3px 12px var(--iad-scrim);border-radius:8px;}
.iad-layer-menu label {display:flex;align-items:center;gap:8px;padding:6px;white-space:nowrap;}

.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {position:relative;align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:6px;padding:8px 9px;min-height:40px;font-size:12px;}
.iad-multiselect-menu {position:absolute;z-index:20;top:100%;left:0;min-width:190px;max-height:300px;overflow:auto;padding:12px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:8px;box-shadow:0 8px 24px var(--iad-border);}
.iad-multiselect-menu label {display:flex;gap:9px;align-items:center;padding:6px 0;color:var(--iad-text);white-space:normal;font-size:12px;}
.iad-multiselect-menu input {accent-color:var(--iad-primary);}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;overflow-wrap:anywhere;}
@media(max-width:1100px) {.iad-workbench {padding:20px;}.iad-main {grid-template-columns:minmax(0,1fr) 300px;}.iad-grid {grid-template-columns:repeat(auto-fill,minmax(125px,1fr));}}
@media(max-width:760px) {.iad-main,.iad-settings {grid-template-columns:1fr;}.iad-kpis {grid-template-columns:repeat(2,1fr);gap:10px;}.iad-inspector {width:100%;}}

.iad-workbench :is(button,input,select,textarea,summary,[tabindex]):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
.iad-workbench :is(input[type=checkbox]) {min-height:20px;width:20px;accent-color:var(--iad-primary);}
.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:0;border-radius:8px;padding:16px;}
.iad-detail-dialog.iad-viewer-dialog {width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;background:var(--iad-viewer);overflow:hidden;}
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

  // src/client/useSampleNavigation.ts
  var import_react20 = __require("react");
  function useSampleNavigation(pageId, taskId, query, result, enabled) {
    const { workspace, state } = useWorkspace();
    const view = workspace.view(pageId);
    const [busy, setBusy] = (0, import_react20.useState)(false);
    const [error, setError] = (0, import_react20.useState)("");
    const [target, setTarget] = (0, import_react20.useState)("");
    const pending = (0, import_react20.useRef)();
    const position = enabled && result.query === query ? result.items.findIndex((item) => item.sample_id === view.selected) : -1;
    const previous = position >= 0 && (position > 0 || view.page > 1);
    const next = position >= 0 && (position < result.items.length - 1 || view.page * pageSize < result.total);
    const cancel = (0, import_react20.useCallback)(() => {
      pending.current?.abort();
      pending.current = void 0;
      setBusy(false);
      setError("");
      setTarget("");
    }, []);
    const opened = (0, import_react20.useCallback)(() => setTarget(""), []);
    (0, import_react20.useEffect)(() => {
      setBusy(false);
      setError("");
      setTarget((target2) => state.active && state.pageId === pageId && target2 === view.selected ? target2 : "");
      return () => {
        pending.current?.abort();
        pending.current = void 0;
      };
    }, [query, view.selected, enabled, state.active, state.pageId, state.datasetId, pageId]);
    async function move(offset) {
      if (pending.current || !taskId || (offset < 0 ? !previous : !next)) return;
      const controller = new AbortController();
      pending.current = controller;
      setBusy(true);
      setError("");
      try {
        let page = view.page;
        let sample = result.items[position + offset];
        if (!sample) {
          page += offset;
          const parameters = new URLSearchParams(query);
          parameters.set("page", String(page));
          const adjacent = await request(`/samples/${encodeURIComponent(taskId)}?${parameters}`, void 0, void 0, controller.signal);
          sample = adjacent.items[offset > 0 ? 0 : adjacent.items.length - 1];
        }
        if (controller.signal.aborted) return;
        const current = workspace.getSnapshot(), selected = workspace.view(pageId);
        if (!current.active || current.pageId !== pageId || current.datasetId !== state.datasetId || selected.selected !== view.selected || selected.page !== view.page || selected.filters !== view.filters) return;
        if (!sample) throw new Error("\u5F53\u524D\u7B5B\u9009\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
        setTarget(sample.sample_id);
        workspace.updateView(pageId, { page, selected: sample.sample_id, inspection: null });
      } catch (error2) {
        if (!controller.signal.aborted) setError(message(error2));
      } finally {
        if (pending.current === controller) {
          pending.current = void 0;
          setBusy(false);
        }
      }
    }
    return { previous, next, busy, error, move, open: !!target && target === view.selected, opened, cancel };
  }

  // src/client/usePagePosition.ts
  var import_react21 = __require("react");
  function usePagePosition(source, ready) {
    const { workspace } = useWorkspace();
    const surface = (0, import_react21.useRef)(null);
    (0, import_react21.useLayoutEffect)(() => {
      const element = surface.current;
      if (!source || !ready || !element) return;
      element.scrollTop = workspace.pagePosition(source);
      const remember = () => workspace.rememberPagePosition(source, element.scrollTop);
      element.addEventListener("scroll", remember, { passive: true });
      return () => element.removeEventListener("scroll", remember);
    }, [workspace, source, ready]);
    return surface;
  }

  // src/client/WorkbenchPage.tsx
  var import_jsx_runtime24 = __require("react/jsx-runtime");
  function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [datasets, setDatasets] = (0, import_react22.useState)([]);
    const [result, setResult] = (0, import_react22.useState)({ query: "", items: [], total: 0 });
    const [loading, setLoading] = (0, import_react22.useState)(false);
    const [error, setError] = (0, import_react22.useState)("");
    const [revision, setRevision] = (0, import_react22.useState)(0);
    const advance = (0, import_react22.useRef)(null);
    const [reviewConfirmation, setReviewConfirmation] = (0, import_react22.useState)(null);
    const dataset = datasets.find((d) => d.dataset_id === datasetId);
    const loadDatasets = (0, import_react22.useCallback)(async (preferred, signal) => {
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
    const changed = (0, import_react22.useCallback)(() => {
      setRevision((v) => v + 1);
      void loadDatasets();
    }, [loadDatasets]);
    const audit = useJobs("audit", datasetId, changed, workspace.view("industrial-audit").job);
    (0, import_react22.useEffect)(() => {
      const controller = new AbortController();
      void loadDatasets(void 0, controller.signal);
      return () => controller.abort();
    }, [loadDatasets]);
    const gallery = pageId === "industrial-datasets" || pageId === "industrial-images" || (pageId === "industrial-review" || pageId === "industrial-audit") && view.tab === "results";
    const query = new URLSearchParams({ ...view.filters, annotation_filters: JSON.stringify(view.filters.annotation_filters), dataset_id: datasetId, page: String(view.page), page_size: String(pageSize) }).toString();
    const navigation = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
    const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
    (0, import_react22.useEffect)(() => {
      if (!dataset || !gallery) return;
      const controller = new AbortController();
      setLoading(true);
      const requestedAdvance = advance.current;
      request(`/samples/${dataset.task_id}?${query}`, void 0, void 0, controller.signal).then((result2) => {
        if (controller.signal.aborted) return;
        setResult({ ...result2, query });
        setError("");
        const current = workspace.view(pageId), snapshot = workspace.getSnapshot();
        if (requestedAdvance && advance.current === requestedAdvance) {
          advance.current = null;
          if (requestedAdvance.query === query && current.selected === requestedAdvance.sampleId && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && current.tab === "results") {
            if (!result2.items.length && result2.total > 0 && current.page > 1) workspace.updateView(pageId, { page: Math.ceil(result2.total / pageSize), selected: "" }, true);
            else workspace.updateView(pageId, { selected: (result2.items[requestedAdvance.position] || result2.items[0])?.sample_id || "" }, true);
            return;
          }
        }
        if (!current.selected && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && (pageId === "industrial-audit" || pageId === "industrial-review") && result2.items.length) workspace.updateView(pageId, { selected: result2.items[0].sample_id }, true);
      }).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [dataset?.task_id, query, gallery, revision, workspace, pageId]);
    function reviewed(record, relativePath) {
      const snapshot = workspace.getSnapshot(), current = workspace.view(pageId);
      if (snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && current.selected === record.sample_id && current.tab === "results" && current.filters.review_status === "pending" && current.filters === view.filters && current.page === view.page) {
        const position = result.query === query ? result.items.findIndex((sample) => sample.sample_id === record.sample_id) : -1;
        advance.current = { query, sampleId: record.sample_id, position: Math.max(0, position) };
        setReviewConfirmation({ datasetId, name: relativePath.split("/").pop(), decision: record.decision });
      }
      changed();
    }
    const updateFilters = (filters) => workspace.updateView(pageId, { filters, page: 1, selected: "" });
    const inspector = dataset && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SampleInspector, { dataset, sampleId: view.selected, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-datasets" ? "dataset" : pageId === "industrial-images" ? "browse" : "model", revision, onChanged: changed, onReviewed: reviewed, jobs: audit.jobs, onJobsChanged: audit.refresh, navigation: gallery ? navigation : void 0 }, `${datasetId}:${view.selected}`);
    const grid = dataset && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SampleGrid, { dataset, filters: view.filters, onFilters: updateFilters, items: result.query === query ? result.items : [], total: result.query === query ? result.total : 0, page: view.page, onPage: (page) => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: (selected) => workspace.updateView(pageId, { selected }), loading });
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { ref: surface, className: "iad-workbench", "data-page": pageId, children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("header", { className: "iad-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h1", { children: pages[pageId] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: (e) => workspace.selectDataset(e.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }),
            datasets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("option", { value: item.dataset_id, children: [
              item.name,
              " (",
              item.total_samples,
              ")"
            ] }, item.dataset_id))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: changed, children: "\u5237\u65B0" })
        ] })
      ] }),
      (error || audit.error) && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { role: "alert", className: "iad-error", children: error || audit.error }),
      dataset && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-kpis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "\u56FE\u50CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("strong", { children: dataset.total_samples })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "\u6A21\u578B\u5BA1\u8BA1" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("strong", { children: [
            dataset.vlm_audited_count,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("small", { children: [
              "/ ",
              dataset.total_samples
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "\u5F85\u590D\u6838\u5F02\u5E38\u5EFA\u8BAE" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("strong", { children: dataset.pending_risk_count })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "\u5DF2\u4EBA\u5DE5\u590D\u6838" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("strong", { children: dataset.human_reviewed_count })
        ] })
      ] }),
      pageId === "industrial-datasets" ? /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(import_jsx_runtime24.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(DatasetManager, { datasets, selected: dataset, onChanged: (id) => {
          void loadDatasets(id);
          setRevision((v) => v + 1);
        } }),
        dataset && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: () => workspace.navigate("industrial-images"), children: "\u6D4F\u89C8\u56FE\u50CF" }),
        dataset && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("details", { className: "iad-reference-manager", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("summary", { children: [
            "\u826F\u54C1\u53C2\u8003\u8D44\u683C \xB7 ",
            dataset.reference_sample_ids.length,
            " \u5F20"
          ] }),
          grid
        ] }),
        dataset && view.selected && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(Modal, { title: "\u826F\u54C1\u53C2\u8003\u8D44\u683C", onClose: () => workspace.updateView(pageId, { selected: "" }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: () => workspace.updateView(pageId, { selected: "" }), children: "\u8FD4\u56DE\u6570\u636E\u96C6\u7BA1\u7406" }),
          inspector
        ] })
      ] }) : !dataset ? /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u6570\u636E\u96C6\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(import_jsx_runtime24.Fragment, { children: [
        (pageId === "industrial-normal" || pageId === "industrial-defect") && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(KnowledgePage, { dataset, kind: pageId === "industrial-normal" ? "normal" : "defect", refreshRevision: revision }, `${datasetId}:${pageId}`),
        pageId === "industrial-audit" && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("nav", { className: "iad-tabs", "aria-label": "\u5BA1\u8BA1\u89C6\u56FE", children: [["results", "\u7ED3\u679C"], ["jobs", "\u6A21\u578B\u5BA1\u8BA1\u4F5C\u4E1A"], ["reports", "\u62A5\u544A"]].map(([tab, label]) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { "aria-pressed": view.tab === tab, className: view.tab === tab ? "active" : "", onClick: () => workspace.updateView(pageId, { tab }), children: label }, tab)) }),
        pageId === "industrial-review" && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("nav", { className: "iad-tabs", "aria-label": "\u590D\u6838\u89C6\u56FE", children: [["results", "\u590D\u6838\u961F\u5217"], ["records", "\u590D\u6838\u8BB0\u5F55"]].map(([tab, label]) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { "aria-pressed": view.tab === tab, className: view.tab === tab ? "active" : "", onClick: () => workspace.updateView(pageId, { tab }), children: label }, tab)) }),
        pageId === "industrial-review" && view.tab === "results" && reviewConfirmation?.datasetId === datasetId && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("p", { role: "status", className: "iad-review-confirmation", children: [
          "\u5DF2\u63D0\u4EA4 ",
          reviewConfirmation.name,
          " \xB7 ",
          reviewLabel(reviewConfirmation.decision)
        ] }),
        gallery && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: pageId === "industrial-images" ? "iad-browse" : "iad-main", children: [
          grid,
          pageId !== "industrial-images" && inspector
        ] }),
        pageId === "industrial-review" && view.tab === "records" && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-main", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
            ReviewRecords,
            {
              datasetId,
              page: view.historyPage,
              search: view.historySearch,
              selected: view.selected,
              revision,
              onPage: (historyPage) => workspace.updateView(pageId, { historyPage }),
              onSearch: (historySearch) => workspace.updateView(pageId, { historySearch, historyPage: 1 }, true),
              onSelect: (selected) => workspace.updateView(pageId, { selected })
            },
            datasetId
          ),
          inspector
        ] }),
        pageId === "industrial-images" && view.selected && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null, onClose: () => workspace.updateView(pageId, { selected: "" }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: () => workspace.updateView(pageId, { selected: "" }), children: "\u8FD4\u56DE\u56FE\u50CF\u6D4F\u89C8" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: () => workspace.navigate("industrial-audit", view.selected), children: "\u524D\u5F80\u6A21\u578B\u5BA1\u8BA1" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { onClick: () => workspace.navigate("industrial-review", view.selected), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" })
          ] }),
          inspector
        ] }),
        pageId === "industrial-audit" && view.tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(AuditJobs, { dataset, filters: view.filters, jobs: audit.jobs, revision, onJobsChanged: audit.refresh }, datasetId),
        pageId === "industrial-audit" && view.tab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(AuditReport, { dataset })
      ] })
    ] });
  }

  // ../../node_modules/.pnpm/@deepseek-ai+dsh-brand@0.2.0-rc.2_@deepseek-ai+cordis@4.0.5/node_modules/@deepseek-ai/dsh-brand/lib/index.js
  function brandString(value) {
    return value;
  }

  // ../../node_modules/.pnpm/@deepseek-ai+dsh-session@0.2.0-rc.2_@deepseek-ai+cordis@4.0.5_@deepseek-ai+dsh-scope@0._74d7c8626a228cbe66b774fdac6de306/node_modules/@deepseek-ai/dsh-session/lib/types/types.js
  function SessionId(id) {
    return brandString(id);
  }

  // src/client/inspection-session.ts
  var InspectionSession = class {
    constructor(host) {
      this.host = host;
    }
    host;
    async send(snapshot, question, returnLink, previousSessionId) {
      const existing = previousSessionId || snapshot.origin_session_id;
      const id = existing ? SessionId(existing) : await this.host.sessions.create();
      const link = returnLink(id);
      await this.host.sessions.using(id, { source: "iadInspection" }, async (reference) => {
        const binding = await reference.ready;
        const text = [
          question || "\u8BF7\u7ED3\u5408\u5F53\u524D\u7591\u70B9\u548C\u5B9E\u9645\u56FE\u50CF\u6838\u5BF9\uFF0C\u8BF4\u660E\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\u4E0E\u4ECD\u9700\u4EBA\u5DE5\u6838\u5B9E\u4E4B\u5904\u3002",
          `\u51BB\u7ED3\u68C0\u89C6\u5F15\u7528\uFF1A${JSON.stringify(snapshot.reference)}`,
          `\u77E5\u8BC6\u7248\u672C\uFF1A${JSON.stringify({ normal: snapshot.analysis.normal_version_id, defect: snapshot.analysis.defect_version_id })}`,
          `\u8FD4\u56DE\u68C0\u89C6\uFF1A${link}`,
          "\u5148\u7528 model_audit_context \u6821\u9A8C\u5F15\u7528\uFF0C\u518D\u7528 model_audit_evidence \u8BFB\u53D6\u5176 evidence \u6E05\u5355\u4E2D\u7684\u771F\u5B9E\u5168\u56FE\u3001ROI\u4E0E\u914D\u5BF9\u539F\u56FE\uFF0C\u7ED3\u5408\u56FE\u50CF\u56DE\u7B54\u3002\u4FDD\u7559\u8FD4\u56DE\u68C0\u89C6\u94FE\u63A5\uFF0C\u4E0D\u5199\u4EBA\u5DE5\u88C1\u51B3\u3002"
        ].join("\n");
        const submission = binding.ctx.inject(["conversation"], (scoped) => scoped.conversation.send(text));
        try {
          await submission;
        } finally {
          await submission.dispose();
        }
        this.host.uiWorkspace.openSession(id);
      });
    }
    async open(sessionId) {
      const id = SessionId(sessionId);
      await this.host.sessions.using(id, { source: "iadInspection" }, async (reference) => {
        await reference.ready;
        this.host.uiWorkspace.openSession(id);
      });
    }
  };

  // src/client/components/SessionResult.tsx
  var import_jsx_runtime25 = __require("react/jsx-runtime");
  function SessionResult(props) {
    const { workspace } = useWorkspace();
    const meta = props.phase === "result" ? props.block.meta : null;
    const result = meta?.type === "industrial-workbench" ? meta : null;
    return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("section", { className: "iad-tool-card", "aria-label": props.title, "data-iad-tool": props.toolName, children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("style", { children: [
        themeStyles,
        `
      .iad-tool-card{background:var(--iad-surface);color:var(--iad-text);border-radius:12px;padding:12px;margin:8px 0;overflow-wrap:anywhere}
      .iad-tool-card p{margin:4px 0}.iad-tool-card nav{display:flex;flex-wrap:wrap;gap:8px}
      .iad-tool-card button{min-height:44px;padding:8px 12px;background:var(--iad-surface-muted);color:var(--iad-text);border:0;border-radius:8px;cursor:pointer;font:inherit}
      .iad-tool-card button:hover{background:var(--iad-hover)}.iad-tool-card button:focus-visible{outline:2px solid var(--iad-primary);outline-offset:2px}
    `
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("strong", { children: props.title }),
      props.phase !== "result" ? /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("p", { role: "status", children: props.phase === "preparing" ? "\u51C6\u5907\u8C03\u7528\u2026" : "\u5DE5\u5177\u6267\u884C\u4E2D\u2026" }) : props.block.isError ? /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("p", { role: "alert", children: "\u8C03\u7528\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u8C03\u7528\u8BE6\u60C5\u3002" }) : result?.job && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("p", { children: [
        "\u8C03\u7528\u65F6\u72B6\u6001\uFF1A",
        jobStatuses[result.job.status],
        " \xB7 \u5B8C\u6210 ",
        result.job.completed,
        " \xB7 \u5931\u8D25 ",
        result.job.failed,
        " \xB7 \u5171 ",
        result.job.total_samples,
        " \u5F20"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("nav", { "aria-label": "\u67E5\u770B\u5DE5\u5177\u7ED3\u679C", children: [
        result?.links.map((link, index) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("button", { "data-iad-page": link.location.pageId, "data-iad-run-id": link.location.job, "data-iad-version-id": link.location.version, onClick: () => workspace.openLocation(link.location), children: link.label }, index)),
        props.inspect && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("button", { onClick: props.inspect, children: "\u8C03\u7528\u8BE6\u60C5" })
      ] })
    ] });
  }

  // src/shared/tool-presentation.ts
  var workbenchTools = {
    dataset_list: "\u6570\u636E\u96C6\u5217\u8868",
    dataset_import: "\u63A5\u5165\u6570\u636E\u96C6",
    dataset_rescan: "\u91CD\u65B0\u626B\u63CF\u76EE\u5F55",
    dataset_report: "\u6570\u636E\u96C6\u8D28\u91CF\u62A5\u544A",
    knowledge_get: "\u77E5\u8BC6\u7248\u672C",
    knowledge_mine_normal: "\u6316\u6398\u826F\u54C1\u77E5\u8BC6",
    knowledge_mine_defect: "\u6316\u6398\u4E0D\u826F\u54C1\u77E5\u8BC6",
    knowledge_job_status: "\u77E5\u8BC6\u4F5C\u4E1A\u72B6\u6001",
    knowledge_job_cancel: "\u505C\u6B62\u77E5\u8BC6\u4F5C\u4E1A",
    knowledge_job_retry: "\u91CD\u8BD5\u77E5\u8BC6\u4F5C\u4E1A",
    model_audit_start: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1",
    model_audit_status: "\u5BA1\u8BA1\u4F5C\u4E1A\u72B6\u6001",
    model_audit_cancel: "\u505C\u6B62\u6A21\u578B\u5BA1\u8BA1",
    model_audit_retry: "\u91CD\u8BD5\u6A21\u578B\u5BA1\u8BA1"
  };

  // src/client/index.ts
  var name = "iad-client";
  var inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];
  function apply(ctx) {
    const workspace = new Workspace(new InspectionSession(ctx));
    const icons = [DatasetIcon, ImagesIcon, KnowledgeIcon, KnowledgeIcon, AuditIcon, ReviewIcon];
    ctx.slots.inject("tool.call.toolview", () => {
      for (const [key, title] of Object.entries(workbenchTools)) ctx.slots.register({ name: "tool.call.toolview", key }, (props) => import_react23.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react23.default.createElement(SessionResult, { ...props, title })));
    });
    ctx.slots.inject("sidebar.panellist", () => {
      Object.entries(pages).forEach(([id, label], index) => ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[index]));
    });
    ctx.slots.inject("main", () => {
      for (const id of Object.keys(pages)) {
        ctx.slots.register({ name: "main", key: id }, () => import_react23.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react23.default.createElement(WorkbenchPage, { pageId: id })));
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
