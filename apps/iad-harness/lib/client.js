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
  var import_react51 = __toESM(__require("react"), 1);

  // src/client/AuditIcon.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  function DeleteIcon() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" }) });
  }
  function CloseIcon() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 6 12 12M18 6 6 18" }) });
  }
  function DatasetIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: size4, height: size4, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: "12", cy: "5", rx: "8", ry: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" })
    ] });
  }
  function ImagesIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: size4, height: size4, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "3", width: "18", height: "18", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "1.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m3 17 5-5 4 4 4-7 5 8" })
    ] });
  }
  function KnowledgeIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: size4, height: size4, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1zm0 0v15M6 8h3m-3 4h3m6-4h3m-3 4h3" }) });
  }
  function ReviewIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: size4, height: size4, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 4H5v17h14V4h-4M9 2h6v5H9zM8 14l3 3 5-6" }) });
  }
  function AuditIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "svg",
      {
        "aria-hidden": "true",
        width: size4,
        height: size4,
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
  function ExplorationIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: size4, height: size4, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "10", cy: "10", r: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m14.5 14.5 6 6M7 10h6M10 7v6" })
    ] });
  }
  function ModelSettingsIcon({ size: size4 = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: size4, height: size4, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 6h16M4 12h16M4 18h16" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "9", cy: "6", r: "2", fill: "var(--iad-surface,currentColor)" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "15", cy: "12", r: "2", fill: "var(--iad-surface,currentColor)" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "9", cy: "18", r: "2", fill: "var(--iad-surface,currentColor)" })
    ] });
  }

  // src/client/WorkbenchPage.tsx
  var import_react47 = __require("react");

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
  var initialFilters = { raw_label_filters: [], annotation_filters: [], model_status: "all", review_status: "all", technical: "all", reference_status: "all", search: "", sort_by: "default" };
  var initialReviewFilters = { ...initialFilters, review_status: "pending" };
  function sampleQuery(datasetId, filters, page, pageSize2) {
    return new URLSearchParams({
      ...filters,
      raw_label_filters: JSON.stringify(filters.raw_label_filters || []),
      annotation_filters: JSON.stringify(filters.annotation_filters || []),
      dataset_id: datasetId,
      page: String(page),
      page_size: String(pageSize2)
    }).toString();
  }
  var mediaUrl = (sample, view = "image") => `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${view}${view === "thumbnail" ? "?size=240" : ""}`;
  var message = (error2) => error2 instanceof Error ? error2.message : String(error2);
  var reviewLabels = { PASS: "\u826F\u54C1", HARD_NORMAL: "\u56F0\u96BE\u6B63\u5E38", FAIL: "\u5F02\u5E38", UNCERTAIN: "\u4E0D\u786E\u5B9A", SKIP: "\u8DF3\u8FC7" };
  var reviewLabel = (decision) => reviewLabels[decision] || decision;
  var modelLabels = { PASS: "\u65E0\u660E\u663E\u5F02\u5E38", FAIL: "\u53D1\u73B0\u7591\u70B9", UNCERTAIN: "\u8BC1\u636E\u4E0D\u8DB3" };
  var auditEvidenceUrl = (suggestionId, image) => `/api/iad/evidence/${encodeURIComponent(suggestionId)}/${encodeURIComponent(image.evidence_id)}`;
  var regionSources = { annotation: "Labelme \u7EBF\u7D22", model: "MLLM \u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" };
  var auditImageIndex = (analysis) => new Map([analysis.overview, ...analysis.regions.map((region) => region.image), ...analysis.auxiliary_evidence].map((image) => [image.evidence_id, image]));

  // src/client/components/DatasetManager.tsx
  var import_react12 = __require("react");

  // src/client/components/Modal.tsx
  var import_react = __require("react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function Modal({ title, onClose, children, className = "", restoreFocus, initialFocus, header = true, presentation = "modal" }) {
    const dialog = (0, import_react.useRef)(null);
    const focusTarget = (0, import_react.useRef)(restoreFocus);
    const pressedOutside = (0, import_react.useRef)(false);
    const previousFocus = (0, import_react.useRef)(null), currentPresentation = (0, import_react.useRef)(presentation);
    focusTarget.current = restoreFocus;
    (0, import_react.useLayoutEffect)(() => {
      const element = dialog.current;
      const active = document.activeElement, wasModal = element.matches(":modal");
      if (!previousFocus.current) previousFocus.current = active;
      currentPresentation.current = presentation;
      if (element.open) element.close();
      if (presentation === "inline") element.show();
      if (presentation === "modal") {
        element.showModal();
        if (initialFocus?.current) initialFocus.current.focus();
        else if (active instanceof HTMLElement && element.contains(active)) active.focus();
      }
      if (presentation === "closed" && (wasModal || active && element.contains(active))) {
        const target = focusTarget.current ? focusTarget.current() : previousFocus.current;
        if (target instanceof HTMLElement && target.isConnected) target.focus();
      }
    }, [presentation, initialFocus]);
    (0, import_react.useEffect)(() => {
      const element = dialog.current;
      return () => {
        element.close();
        if (currentPresentation.current !== "modal") return;
        const target = focusTarget.current ? focusTarget.current() : previousFocus.current;
        if (target instanceof HTMLElement && target.isConnected) target.focus();
      };
    }, []);
    const outside = (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "dialog",
      {
        ref: dialog,
        "aria-label": title,
        role: presentation === "inline" ? "region" : void 0,
        className: `iad-detail-dialog ${presentation === "inline" ? "iad-inline-dialog" : ""} ${className}`,
        onCancel: (event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        },
        onPointerDown: (event) => {
          pressedOutside.current = outside(event);
        },
        onPointerUp: (event) => {
          if (pressedOutside.current && outside(event)) onClose();
          pressedOutside.current = false;
        },
        children: [
          header && presentation === "modal" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "iad-dialog-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "iad-icon-button", "aria-label": `\u5173\u95ED${title}`, title: "\u5173\u95ED", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CloseIcon, {}) })
          ] }),
          children
        ]
      }
    );
  }

  // src/client/components/DeleteAction.tsx
  var import_react2 = __require("react");

  // ../../node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset4 = 0) {
    return (byteToHex[arr[offset4 + 0]] + byteToHex[arr[offset4 + 1]] + byteToHex[arr[offset4 + 2]] + byteToHex[arr[offset4 + 3]] + "-" + byteToHex[arr[offset4 + 4]] + byteToHex[arr[offset4 + 5]] + "-" + byteToHex[arr[offset4 + 6]] + byteToHex[arr[offset4 + 7]] + "-" + byteToHex[arr[offset4 + 8]] + byteToHex[arr[offset4 + 9]] + "-" + byteToHex[arr[offset4 + 10]] + byteToHex[arr[offset4 + 11]] + byteToHex[arr[offset4 + 12]] + byteToHex[arr[offset4 + 13]] + byteToHex[arr[offset4 + 14]] + byteToHex[arr[offset4 + 15]]).toLowerCase();
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
  function _v4(options, buf, offset4) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
      throw new Error("Random bytes length must be >= 16");
    }
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset4 = offset4 || 0;
      if (offset4 < 0 || offset4 + 16 > buf.length) {
        throw new RangeError(`UUID byte range ${offset4}:${offset4 + 15} is out of buffer bounds`);
      }
      for (let i = 0; i < 16; ++i) {
        buf[offset4 + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  function v4(options, buf, offset4) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    return _v4(options, buf, offset4);
  }
  var v4_default = v4;

  // src/client/components/DeleteAction.tsx
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function DeleteAction({ title, name: name2, description, onDelete, disabled, className = "", restoreFocus }) {
    const [open, setOpen] = (0, import_react2.useState)(false), [busy, setBusy] = (0, import_react2.useState)(false), [error2, setError] = (0, import_react2.useState)("");
    const trigger = (0, import_react2.useRef)(null), cancel = (0, import_react2.useRef)(null);
    const submission = (0, import_react2.useRef)(""), actionStarted = (0, import_react2.useRef)(false);
    async function confirm() {
      if (busy) return;
      actionStarted.current = true;
      setBusy(true);
      setError("");
      try {
        await onDelete(submission.current);
        setOpen(false);
      } catch (error3) {
        actionStarted.current = false;
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          ref: trigger,
          type: "button",
          className: `iad-icon-button ${className}`,
          "aria-label": `${title} ${name2}`,
          title,
          disabled: disabled || busy,
          onClick: () => {
            submission.current = v4_default();
            actionStarted.current = false;
            setError("");
            setOpen(true);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(DeleteIcon, {})
        }
      ),
      open && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        Modal,
        {
          title,
          className: "iad-confirm-dialog",
          initialFocus: cancel,
          restoreFocus: () => actionStarted.current ? restoreFocus?.() || trigger.current : trigger.current,
          onClose: () => {
            if (!busy) setOpen(false);
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { children: [
              "\u786E\u8BA4",
              title,
              "\u201C",
              name2,
              "\u201D\uFF1F"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "iad-muted", children: description }),
            error2 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "iad-form-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { ref: cancel, type: "button", "aria-label": "\u53D6\u6D88\u5220\u9664", disabled: busy, onClick: () => setOpen(false), children: "\u53D6\u6D88" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "iad-danger", disabled: busy, onClick: () => void confirm(), children: busy ? "\u6B63\u5728\u5220\u9664\u2026" : "\u786E\u8BA4\u5220\u9664" })
            ] })
          ]
        }
      )
    ] });
  }

  // src/client/components/DatasetName.tsx
  var import_react3 = __require("react");
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function DatasetName({ dataset, label, onChanged }) {
    const [editing, setEditing] = (0, import_react3.useState)(false), [value, setValue] = (0, import_react3.useState)("");
    const [busy, setBusy] = (0, import_react3.useState)(false), [error2, setError] = (0, import_react3.useState)("");
    const trigger = (0, import_react3.useRef)(null), restoreFocus = (0, import_react3.useRef)(false);
    const session = (0, import_react3.useRef)("idle");
    (0, import_react3.useEffect)(() => {
      if (!editing && restoreFocus.current) {
        trigger.current?.focus();
        restoreFocus.current = false;
      }
    }, [editing]);
    function close(restore) {
      session.current = "idle";
      restoreFocus.current = restore;
      setEditing(false);
    }
    async function save(restore) {
      if (session.current !== "editing") return;
      const name2 = value.trim();
      if (name2 === dataset.name) {
        close(restore);
        return;
      }
      if (!name2) {
        setError("\u6570\u636E\u96C6\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      session.current = "saving";
      setBusy(true);
      setError("");
      try {
        await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { name: name2 }, "PATCH");
        onChanged();
        close(restore);
      } catch (e) {
        session.current = "editing";
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "iad-dataset-name", children: editing ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "input",
        {
          "aria-label": label,
          "aria-busy": busy,
          autoFocus: true,
          maxLength: 120,
          disabled: busy,
          value,
          onChange: (event) => setValue(event.target.value),
          onBlur: () => void save(false),
          onKeyDown: (event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              void save(true);
            }
            if (event.key === "Escape" && !busy) {
              event.preventDefault();
              event.stopPropagation();
              close(true);
            }
          }
        }
      ),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "alert", className: "iad-error", children: error2 })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { ref: trigger, type: "button", className: "iad-name-trigger", "aria-label": `\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0 ${dataset.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: () => {
      session.current = "editing";
      setValue(dataset.name);
      setError("");
      setEditing(true);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: dataset.name }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5" }) })
    ] }) });
  }

  // src/client/components/FolderMapping.tsx
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  var roleLabels = {
    normal: "\u6B63\u5E38 (OK)",
    anomaly: "\u5F02\u5E38 (NG)",
    unlabeled: "\u672A\u6807\u8BB0",
    excluded: "\u6392\u9664"
  };
  function FolderMapping({ preview, rules, pending, disabled, onChange }) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "iad-folder-rules", children: [
      pending && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "status", children: "\u6B63\u5728\u9884\u89C8\u76EE\u5F55\u2026" }),
      preview && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "iad-muted", children: [
          "\u53D1\u73B0 ",
          preview.total_images,
          " \u5F20\u56FE\u50CF"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("table", { className: "iad-preview-table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("th", { children: "\u76EE\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("th", { className: "iad-number", children: "\u56FE\u50CF\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("th", { children: "\u89D2\u8272" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("tbody", { children: preview.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: item.path === "." ? "\u76F4\u5C5E\u56FE\u50CF" : item.path }) }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { className: "iad-number", children: item.image_count }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "select",
              {
                "aria-label": `\u76EE\u5F55 ${item.path} \u89D2\u8272`,
                disabled,
                value: rules?.find((rule) => rule.path === item.path)?.role || item.role,
                onChange: (event) => onChange(preview.items.map((row) => ({
                  path: row.path,
                  role: row.path === item.path ? event.target.value : rules?.find((rule) => rule.path === row.path)?.role || row.role
                }))),
                children: Object.entries(roleLabels).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value, children: label }, value))
              }
            ) })
          ] }, item.path)) })
        ] }) }),
        preview.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "alert", className: "iad-error", children: preview.conflicts.map((conflict) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: conflict }, conflict)) })
      ] })
    ] });
  }

  // src/client/useFolderPreview.ts
  var import_react4 = __require("react");
  function useFolderPreview(root, rules, enabled) {
    const key = JSON.stringify({ root, rules });
    const [result, setResult] = (0, import_react4.useState)();
    (0, import_react4.useEffect)(() => {
      if (!enabled || !root.trim()) return;
      const controller = new AbortController();
      const timer = setTimeout(() => {
        void request("/datasets/preview", { root_dir: root, rules }, "POST", controller.signal).then((preview2) => {
          if (!controller.signal.aborted) setResult({ key, root, preview: preview2, error: "" });
        }).catch((error2) => {
          if (!controller.signal.aborted) setResult({ key, root, preview: null, error: message(error2) });
        });
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }, [key, enabled]);
    const preview = enabled && result?.root === root ? result.preview : null;
    const pending = enabled && Boolean(root.trim()) && result?.key !== key;
    return {
      preview,
      pending,
      error: result?.key === key ? result.error : "",
      ready: !pending && preview !== null && preview.conflicts.length === 0 && preview.total_images > 0
    };
  }

  // src/shared/navigation.ts
  var navigation = {
    "industrial-datasets": { label: "\u6570\u636E\u96C6\u7BA1\u7406", chapter: "\u6570\u636E\u51C6\u5907" },
    "industrial-images": { label: "\u56FE\u50CF\u6D4F\u89C8", chapter: "\u6570\u636E\u51C6\u5907" },
    "industrial-exploration": { label: "\u65B9\u5411\u63A2\u7D22", chapter: "\u77E5\u8BC6\u6784\u5EFA" },
    "industrial-knowledge": { label: "\u77E5\u8BC6\u6316\u6398", chapter: "\u77E5\u8BC6\u6784\u5EFA" },
    "industrial-audit": { label: "\u6A21\u578B\u5BA1\u8BA1", chapter: "\u8D28\u91CF\u5BA1\u6838" },
    "industrial-review": { label: "\u4EBA\u5DE5\u590D\u6838", chapter: "\u8D28\u91CF\u5BA1\u6838" },
    "industrial-model-settings": { label: "\u6A21\u578B\u8BBE\u7F6E", chapter: "\u5DE5\u5177" }
  };
  var pages = Object.fromEntries(Object.entries(navigation).map(([id, page]) => [id, page.label]));

  // src/client/components/layout/WorkbenchHeader.tsx
  var import_jsx_runtime6 = __require("react/jsx-runtime");
  function WorkbenchHeader({ pageId, children }) {
    const page = navigation[pageId];
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "iad-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "iad-breadcrumb", "aria-label": "\u6240\u5728\u7AE0\u8282", children: page.chapter }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { children: page.label })
      ] }),
      children && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "iad-header-actions", children })
    ] });
  }

  // src/client/components/FloatingMenu.tsx
  var import_react7 = __require("react");

  // ../../node_modules/.pnpm/@floating-ui+react@0.27.20_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react/dist/floating-ui.react.mjs
  var React6 = __toESM(__require("react"), 1);

  // ../../node_modules/.pnpm/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
  function hasWindow() {
    return typeof window !== "undefined";
  }
  function getNodeName(node) {
    if (isNode(node)) {
      return (node.nodeName || "").toLowerCase();
    }
    return "#document";
  }
  function getWindow(node) {
    var _node$ownerDocument;
    return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
  }
  function getDocumentElement(node) {
    var _ref;
    return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
  }
  function isNode(value) {
    if (!hasWindow()) {
      return false;
    }
    return value instanceof Node || value instanceof getWindow(value).Node;
  }
  function isElement(value) {
    if (!hasWindow()) {
      return false;
    }
    return value instanceof Element || value instanceof getWindow(value).Element;
  }
  function isHTMLElement(value) {
    if (!hasWindow()) {
      return false;
    }
    return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
  }
  function isShadowRoot(value) {
    if (!hasWindow() || typeof ShadowRoot === "undefined") {
      return false;
    }
    return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
  }
  function isOverflowElement(element) {
    const {
      overflow,
      overflowX,
      overflowY,
      display
    } = getComputedStyle2(element);
    return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
  }
  function isTableElement(element) {
    return /^(table|td|th)$/.test(getNodeName(element));
  }
  function isTopLayer(element) {
    try {
      if (element.matches(":popover-open")) {
        return true;
      }
    } catch (_e) {
    }
    try {
      return element.matches(":modal");
    } catch (_e) {
      return false;
    }
  }
  var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
  var containRe = /paint|layout|strict|content/;
  var isNotNone = (value) => !!value && value !== "none";
  var isWebKitValue;
  function isContainingBlock(elementOrCss) {
    const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
    return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
  }
  function getContainingBlock(element) {
    let currentNode = getParentNode(element);
    while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
      if (isContainingBlock(currentNode)) {
        return currentNode;
      } else if (isTopLayer(currentNode)) {
        return null;
      }
      currentNode = getParentNode(currentNode);
    }
    return null;
  }
  function isWebKit() {
    if (isWebKitValue == null) {
      isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
    }
    return isWebKitValue;
  }
  function isLastTraversableNode(node) {
    return /^(html|body|#document)$/.test(getNodeName(node));
  }
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }
  function getNodeScroll(element) {
    if (isElement(element)) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    return {
      scrollLeft: element.scrollX,
      scrollTop: element.scrollY
    };
  }
  function getParentNode(node) {
    if (getNodeName(node) === "html") {
      return node;
    }
    const result = (
      // Step into the shadow DOM of the parent of a slotted node.
      node.assignedSlot || // DOM Element detected.
      node.parentNode || // ShadowRoot detected.
      isShadowRoot(node) && node.host || // Fallback.
      getDocumentElement(node)
    );
    return isShadowRoot(result) ? result.host : result;
  }
  function getNearestOverflowAncestor(node) {
    const parentNode = getParentNode(node);
    if (isLastTraversableNode(parentNode)) {
      return (node.ownerDocument || node).body;
    }
    if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
      return parentNode;
    }
    return getNearestOverflowAncestor(parentNode);
  }
  function getOverflowAncestors(node, list, traverseIframes) {
    var _node$ownerDocument2;
    if (list === void 0) {
      list = [];
    }
    if (traverseIframes === void 0) {
      traverseIframes = true;
    }
    const scrollableAncestor = getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
    const win = getWindow(scrollableAncestor);
    if (isBody) {
      const frameElement = getFrameElement(win);
      return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
    } else {
      return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
    }
  }
  function getFrameElement(win) {
    return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
  }

  // ../../node_modules/.pnpm/@floating-ui+react@0.27.20_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react/dist/floating-ui.react.utils.mjs
  var React4 = __toESM(__require("react"), 1);
  var import_react5 = __require("react");

  // ../../node_modules/.pnpm/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
  var min = Math.min;
  var max = Math.max;
  var round = Math.round;
  var floor = Math.floor;
  var createCoords = (v) => ({
    x: v,
    y: v
  });
  var oppositeSideMap = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function clamp(start, value, end) {
    return max(start, min(value, end));
  }
  function evaluate(value, param) {
    return typeof value === "function" ? value(param) : value;
  }
  function getSide(placement) {
    return placement.split("-")[0];
  }
  function getAlignment(placement) {
    return placement.split("-")[1];
  }
  function getOppositeAxis(axis) {
    return axis === "x" ? "y" : "x";
  }
  function getAxisLength(axis) {
    return axis === "y" ? "height" : "width";
  }
  function getSideAxis(placement) {
    const firstChar = placement[0];
    return firstChar === "t" || firstChar === "b" ? "y" : "x";
  }
  function getAlignmentAxis(placement) {
    return getOppositeAxis(getSideAxis(placement));
  }
  function getAlignmentSides(placement, rects, rtl) {
    if (rtl === void 0) {
      rtl = false;
    }
    const alignment = getAlignment(placement);
    const alignmentAxis = getAlignmentAxis(placement);
    const length = getAxisLength(alignmentAxis);
    let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
    if (rects.reference[length] > rects.floating[length]) {
      mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
    }
    return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
  }
  function getExpandedPlacements(placement) {
    const oppositePlacement = getOppositePlacement(placement);
    return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
  }
  function getOppositeAlignmentPlacement(placement) {
    return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
  }
  var lrPlacement = ["left", "right"];
  var rlPlacement = ["right", "left"];
  var tbPlacement = ["top", "bottom"];
  var btPlacement = ["bottom", "top"];
  function getSideList(side, isStart, rtl) {
    switch (side) {
      case "top":
      case "bottom":
        if (rtl) return isStart ? rlPlacement : lrPlacement;
        return isStart ? lrPlacement : rlPlacement;
      case "left":
      case "right":
        return isStart ? tbPlacement : btPlacement;
      default:
        return [];
    }
  }
  function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
    const alignment = getAlignment(placement);
    let list = getSideList(getSide(placement), direction === "start", rtl);
    if (alignment) {
      list = list.map((side) => side + "-" + alignment);
      if (flipAlignment) {
        list = list.concat(list.map(getOppositeAlignmentPlacement));
      }
    }
    return list;
  }
  function getOppositePlacement(placement) {
    const side = getSide(placement);
    return oppositeSideMap[side] + placement.slice(side.length);
  }
  function expandPaddingObject(padding) {
    var _padding$top, _padding$right, _padding$bottom, _padding$left;
    return {
      top: (_padding$top = padding.top) != null ? _padding$top : 0,
      right: (_padding$right = padding.right) != null ? _padding$right : 0,
      bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
      left: (_padding$left = padding.left) != null ? _padding$left : 0
    };
  }
  function getPaddingObject(padding) {
    return typeof padding !== "number" ? expandPaddingObject(padding) : {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }
  function rectToClientRect(rect) {
    const {
      x,
      y,
      width,
      height
    } = rect;
    return {
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
      x,
      y
    };
  }

  // ../../node_modules/.pnpm/tabbable@6.5.0/node_modules/tabbable/dist/index.esm.js
  var candidateSelectors = ["input:not([inert]):not([inert] *)", "select:not([inert]):not([inert] *)", "textarea:not([inert]):not([inert] *)", "a[href]:not([inert]):not([inert] *)", "area[href]:not([inert]):not([inert] *)", "button:not([inert]):not([inert] *)", "[tabindex]:not(slot):not([inert]):not([inert] *)", "audio[controls]:not([inert]):not([inert] *)", "video[controls]:not([inert]):not([inert] *)", '[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)', "details>summary:first-of-type:not([inert]):not([inert] *)", "details:not([inert]):not([inert] *)"];
  var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
  var NoElement = typeof Element === "undefined";
  var matches = NoElement ? function() {
  } : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  var getRootNode = !NoElement && Element.prototype.getRootNode ? function(element) {
    var _element$getRootNode;
    return element === null || element === void 0 ? void 0 : (_element$getRootNode = element.getRootNode) === null || _element$getRootNode === void 0 ? void 0 : _element$getRootNode.call(element);
  } : function(element) {
    return element === null || element === void 0 ? void 0 : element.ownerDocument;
  };
  var _isInert = function isInert(node, lookUp) {
    var _node$getAttribute;
    if (lookUp === void 0) {
      lookUp = true;
    }
    var inertAtt = node === null || node === void 0 ? void 0 : (_node$getAttribute = node.getAttribute) === null || _node$getAttribute === void 0 ? void 0 : _node$getAttribute.call(node, "inert");
    var inert = inertAtt === "" || inertAtt === "true";
    var result = inert || lookUp && node && // closest does not exist on shadow roots, so we fall back to a manual
    // lookup upward, in case it is not defined.
    (typeof node.closest === "function" ? node.closest("[inert]") : _isInert(node.parentNode));
    return result;
  };
  var isContentEditable = function isContentEditable2(node) {
    var _node$getAttribute2;
    var attValue = node === null || node === void 0 ? void 0 : (_node$getAttribute2 = node.getAttribute) === null || _node$getAttribute2 === void 0 ? void 0 : _node$getAttribute2.call(node, "contenteditable");
    return attValue === "" || attValue === "true";
  };
  var getCandidates = function getCandidates2(el, includeContainer, filter) {
    if (_isInert(el)) {
      return [];
    }
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  };
  var _getCandidatesIteratively = function getCandidatesIteratively(elements, includeContainer, options) {
    var candidates = [];
    var elementsToCheck = Array.from(elements);
    while (elementsToCheck.length) {
      var element = elementsToCheck.shift();
      if (_isInert(element, false)) {
        continue;
      }
      if (element.tagName === "SLOT") {
        var assigned = element.assignedElements();
        var content = assigned.length ? assigned : element.children;
        var nestedCandidates = _getCandidatesIteratively(content, true, options);
        if (options.flatten) {
          candidates.push.apply(candidates, nestedCandidates);
        } else {
          candidates.push({
            scopeParent: element,
            candidates: nestedCandidates
          });
        }
      } else {
        var validCandidate = matches.call(element, candidateSelector);
        if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
          candidates.push(element);
        }
        var shadowRoot = element.shadowRoot || // check for an undisclosed shadow
        typeof options.getShadowRoot === "function" && options.getShadowRoot(element);
        var validShadowRoot = !_isInert(shadowRoot, false) && (!options.shadowRootFilter || options.shadowRootFilter(element));
        if (shadowRoot && validShadowRoot) {
          var _nestedCandidates = _getCandidatesIteratively(shadowRoot === true ? element.children : shadowRoot.children, true, options);
          if (options.flatten) {
            candidates.push.apply(candidates, _nestedCandidates);
          } else {
            candidates.push({
              scopeParent: element,
              candidates: _nestedCandidates
            });
          }
        } else {
          elementsToCheck.unshift.apply(elementsToCheck, element.children);
        }
      }
    }
    return candidates;
  };
  var hasTabIndex = function hasTabIndex2(node) {
    return !isNaN(parseInt(node.getAttribute("tabindex"), 10));
  };
  var getTabIndex = function getTabIndex2(node) {
    if (!node) {
      throw new Error("No node provided");
    }
    if (node.tabIndex < 0) {
      if ((/^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || isContentEditable(node)) && !hasTabIndex(node)) {
        return 0;
      }
    }
    return node.tabIndex;
  };
  var getSortOrderTabIndex = function getSortOrderTabIndex2(node, isScope) {
    var tabIndex = getTabIndex(node);
    if (tabIndex < 0 && isScope && !hasTabIndex(node)) {
      return 0;
    }
    return tabIndex;
  };
  var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };
  var isInput = function isInput2(node) {
    return node.tagName === "INPUT";
  };
  var isHiddenInput = function isHiddenInput2(node) {
    return isInput(node) && node.type === "hidden";
  };
  var isDetailsWithSummary = function isDetailsWithSummary2(node) {
    var r = node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
      return child.tagName === "SUMMARY";
    });
    return r;
  };
  var getCheckedRadio = function getCheckedRadio2(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var isTabbableRadio = function isTabbableRadio2(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || getRootNode(node);
    var queryRadios = function queryRadios2(name2) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name2 + '"]');
    };
    var radioSet;
    if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
        return false;
      }
    }
    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };
  var isRadio = function isRadio2(node) {
    return isInput(node) && node.type === "radio";
  };
  var isNonTabbableRadio = function isNonTabbableRadio2(node) {
    return isRadio(node) && !isTabbableRadio(node);
  };
  var isNodeAttached = function isNodeAttached2(node) {
    var _nodeRoot;
    var nodeRoot = node && getRootNode(node);
    var nodeRootHost = (_nodeRoot = nodeRoot) === null || _nodeRoot === void 0 ? void 0 : _nodeRoot.host;
    var attached = false;
    if (nodeRoot && nodeRoot !== node) {
      var _nodeRootHost, _nodeRootHost$ownerDo, _node$ownerDocument;
      attached = !!((_nodeRootHost = nodeRootHost) !== null && _nodeRootHost !== void 0 && (_nodeRootHost$ownerDo = _nodeRootHost.ownerDocument) !== null && _nodeRootHost$ownerDo !== void 0 && _nodeRootHost$ownerDo.contains(nodeRootHost) || node !== null && node !== void 0 && (_node$ownerDocument = node.ownerDocument) !== null && _node$ownerDocument !== void 0 && _node$ownerDocument.contains(node));
      while (!attached && nodeRootHost) {
        var _nodeRoot2, _nodeRootHost2, _nodeRootHost2$ownerD;
        nodeRoot = getRootNode(nodeRootHost);
        nodeRootHost = (_nodeRoot2 = nodeRoot) === null || _nodeRoot2 === void 0 ? void 0 : _nodeRoot2.host;
        attached = !!((_nodeRootHost2 = nodeRootHost) !== null && _nodeRootHost2 !== void 0 && (_nodeRootHost2$ownerD = _nodeRootHost2.ownerDocument) !== null && _nodeRootHost2$ownerD !== void 0 && _nodeRootHost2$ownerD.contains(nodeRootHost));
      }
    }
    return attached;
  };
  var isZeroArea = function isZeroArea2(node) {
    var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
    return width === 0 && height === 0;
  };
  var isHidden = function isHidden2(node, _ref) {
    var displayCheck = _ref.displayCheck, getShadowRoot = _ref.getShadowRoot;
    if (displayCheck === "full-native") {
      if ("checkVisibility" in node) {
        var visible = node.checkVisibility({
          // Checking opacity might be desirable for some use cases, but natively,
          // opacity zero elements _are_ focusable and tabbable.
          checkOpacity: false,
          opacityProperty: false,
          contentVisibilityAuto: true,
          visibilityProperty: true,
          // This is an alias for `visibilityProperty`. Contemporary browsers
          // support both. However, this alias has wider browser support (Chrome
          // >= 105 and Firefox >= 106, vs. Chrome >= 121 and Firefox >= 122), so
          // we include it anyway.
          checkVisibilityCSS: true
        });
        return !visible;
      }
    }
    var _getComputedStyle = getComputedStyle(node), visibility = _getComputedStyle.visibility;
    if (visibility === "hidden" || visibility === "collapse") {
      return true;
    }
    var isDirectSummary = matches.call(node, "details>summary:first-of-type");
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
    if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
      return true;
    }
    if (!displayCheck || displayCheck === "full" || // full-native can run this branch when it falls through in case
    // Element#checkVisibility is unsupported
    displayCheck === "full-native" || displayCheck === "legacy-full") {
      if (typeof getShadowRoot === "function") {
        var originalNode = node;
        while (node) {
          var parentElement = node.parentElement;
          var rootNode = getRootNode(node);
          if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true) {
            return isZeroArea(node);
          } else if (node.assignedSlot) {
            node = node.assignedSlot;
          } else if (!parentElement && rootNode !== node.ownerDocument) {
            node = rootNode.host;
          } else {
            node = parentElement;
          }
        }
        node = originalNode;
      }
      if (isNodeAttached(node)) {
        return !node.getClientRects().length;
      }
      if (displayCheck !== "legacy-full") {
        return true;
      }
    } else if (displayCheck === "non-zero-area") {
      return isZeroArea(node);
    }
    return false;
  };
  var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
    if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
      var parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            if (child.tagName === "LEGEND") {
              return matches.call(parentNode, "fieldset[disabled] *") ? true : !child.contains(node);
            }
          }
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }
    return false;
  };
  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node, options) || // For a details element with a summary, the summary element gets the focus
    isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
      return false;
    }
    return true;
  };
  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
    if (isNonTabbableRadio(node) || getTabIndex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
      return false;
    }
    return true;
  };
  var isShadowRootTabbable = function isShadowRootTabbable2(shadowHostNode) {
    var tabIndex = parseInt(shadowHostNode.getAttribute("tabindex"), 10);
    if (isNaN(tabIndex) || tabIndex >= 0) {
      return true;
    }
    return false;
  };
  var _sortByOrder = function sortByOrder(candidates) {
    var regularTabbables = [];
    var orderedTabbables = [];
    candidates.forEach(function(item, i) {
      var isScope = !!item.scopeParent;
      var element = isScope ? item.scopeParent : item;
      var candidateTabindex = getSortOrderTabIndex(element, isScope);
      var elements = isScope ? _sortByOrder(item.candidates) : element;
      if (candidateTabindex === 0) {
        isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          item,
          isScope,
          content: elements
        });
      }
    });
    return orderedTabbables.sort(sortOrderedTabbables).reduce(function(acc, sortable) {
      sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
      return acc;
    }, []).concat(regularTabbables);
  };
  var tabbable = function tabbable2(container, options) {
    options = options || {};
    var candidates;
    if (options.getShadowRoot) {
      candidates = _getCandidatesIteratively([container], options.includeContainer, {
        filter: isNodeMatchingSelectorTabbable.bind(null, options),
        flatten: false,
        getShadowRoot: options.getShadowRoot,
        shadowRootFilter: isShadowRootTabbable
      });
    } else {
      candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    }
    return _sortByOrder(candidates);
  };

  // ../../node_modules/.pnpm/@floating-ui+react@0.27.20_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react/dist/floating-ui.react.utils.mjs
  function getPlatform() {
    const uaData = navigator.userAgentData;
    if (uaData != null && uaData.platform) {
      return uaData.platform;
    }
    return navigator.platform;
  }
  function getUserAgent() {
    const uaData = navigator.userAgentData;
    if (uaData && Array.isArray(uaData.brands)) {
      return uaData.brands.map((_ref) => {
        let {
          brand,
          version
        } = _ref;
        return brand + "/" + version;
      }).join(" ");
    }
    return navigator.userAgent;
  }
  function isSafari() {
    return /apple/i.test(navigator.vendor);
  }
  function isMac() {
    return getPlatform().toLowerCase().startsWith("mac") && !navigator.maxTouchPoints;
  }
  function isJSDOM() {
    return getUserAgent().includes("jsdom/");
  }
  var FOCUSABLE_ATTRIBUTE = "data-floating-ui-focusable";
  var TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
  function activeElement(doc) {
    let activeElement2 = doc.activeElement;
    while (((_activeElement = activeElement2) == null || (_activeElement = _activeElement.shadowRoot) == null ? void 0 : _activeElement.activeElement) != null) {
      var _activeElement;
      activeElement2 = activeElement2.shadowRoot.activeElement;
    }
    return activeElement2;
  }
  function contains(parent, child) {
    if (!parent || !child) {
      return false;
    }
    const rootNode = child.getRootNode == null ? void 0 : child.getRootNode();
    if (parent.contains(child)) {
      return true;
    }
    if (rootNode && isShadowRoot(rootNode)) {
      let next = child;
      while (next) {
        if (parent === next) {
          return true;
        }
        next = next.parentNode || next.host;
      }
    }
    return false;
  }
  function getTarget(event) {
    if ("composedPath" in event) {
      return event.composedPath()[0];
    }
    return event.target;
  }
  function isEventTargetWithin(event, node) {
    if (node == null) {
      return false;
    }
    if ("composedPath" in event) {
      return event.composedPath().includes(node);
    }
    const e = event;
    return e.target != null && node.contains(e.target);
  }
  function isRootElement(element) {
    return element.matches("html,body");
  }
  function getDocument(node) {
    return (node == null ? void 0 : node.ownerDocument) || document;
  }
  function isTypeableElement(element) {
    return isHTMLElement(element) && element.matches(TYPEABLE_SELECTOR);
  }
  function matchesFocusVisible(element) {
    if (!element || isJSDOM()) return true;
    try {
      return element.matches(":focus-visible");
    } catch (_e) {
      return true;
    }
  }
  function getFloatingFocusElement(floatingElement) {
    if (!floatingElement) {
      return null;
    }
    return floatingElement.hasAttribute(FOCUSABLE_ATTRIBUTE) ? floatingElement : floatingElement.querySelector("[" + FOCUSABLE_ATTRIBUTE + "]") || floatingElement;
  }
  function getNodeChildren(nodes, id, onlyOpenChildren) {
    if (onlyOpenChildren === void 0) {
      onlyOpenChildren = true;
    }
    const directChildren = nodes.filter((node) => {
      var _node$context;
      return node.parentId === id && (!onlyOpenChildren || ((_node$context = node.context) == null ? void 0 : _node$context.open));
    });
    return directChildren.flatMap((child) => [child, ...getNodeChildren(nodes, child.id, onlyOpenChildren)]);
  }
  function isReactEvent(event) {
    return "nativeEvent" in event;
  }
  function isMouseLikePointerType(pointerType, strict) {
    const values = ["mouse", "pen"];
    if (!strict) {
      values.push("", void 0);
    }
    return values.includes(pointerType);
  }
  var isClient = typeof document !== "undefined";
  var noop = function noop2() {
  };
  var index = isClient ? import_react5.useLayoutEffect : noop;
  var SafeReact = {
    ...React4
  };
  function useLatestRef(value) {
    const ref = React4.useRef(value);
    index(() => {
      ref.current = value;
    });
    return ref;
  }
  var useInsertionEffect = SafeReact.useInsertionEffect;
  var useSafeInsertionEffect = useInsertionEffect || ((fn) => fn());
  function useEffectEvent(callback) {
    const ref = React4.useRef(() => {
      if (true) {
        throw new Error("Cannot call an event handler while rendering.");
      }
    });
    useSafeInsertionEffect(() => {
      ref.current = callback;
    });
    return React4.useCallback(function() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return ref.current == null ? void 0 : ref.current(...args);
    }, []);
  }
  var getTabbableOptions = () => ({
    getShadowRoot: true,
    displayCheck: (
      // JSDOM does not support the `tabbable` library. To solve this we can
      // check if `ResizeObserver` is a real function (not polyfilled), which
      // determines if the current environment is JSDOM-like.
      typeof ResizeObserver === "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
    )
  });
  function getTabbableIn(container, dir) {
    const list = tabbable(container, getTabbableOptions());
    const len = list.length;
    if (len === 0) return;
    const active = activeElement(getDocument(container));
    const index3 = list.indexOf(active);
    const nextIndex = index3 === -1 ? dir === 1 ? 0 : len - 1 : index3 + dir;
    return list[nextIndex];
  }
  function getNextTabbable(referenceElement) {
    return getTabbableIn(getDocument(referenceElement).body, 1) || referenceElement;
  }
  function getPreviousTabbable(referenceElement) {
    return getTabbableIn(getDocument(referenceElement).body, -1) || referenceElement;
  }
  function isOutsideEvent(event, container) {
    const containerElement = container || event.currentTarget;
    const relatedTarget = event.relatedTarget;
    return !relatedTarget || !contains(containerElement, relatedTarget);
  }
  function disableFocusInside(container) {
    const tabbableElements = tabbable(container, getTabbableOptions());
    tabbableElements.forEach((element) => {
      element.dataset.tabindex = element.getAttribute("tabindex") || "";
      element.setAttribute("tabindex", "-1");
    });
  }
  function enableFocusInside(container) {
    const elements = container.querySelectorAll("[data-tabindex]");
    elements.forEach((element) => {
      const tabindex = element.dataset.tabindex;
      delete element.dataset.tabindex;
      if (tabindex) {
        element.setAttribute("tabindex", tabindex);
      } else {
        element.removeAttribute("tabindex");
      }
    });
  }

  // ../../node_modules/.pnpm/@floating-ui+react@0.27.20_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react/dist/floating-ui.react.mjs
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  var ReactDOM2 = __toESM(__require("react-dom"), 1);

  // ../../node_modules/.pnpm/@floating-ui+core@1.8.0/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
  function computeCoordsFromPlacement(_ref, placement, rtl) {
    let {
      reference,
      floating
    } = _ref;
    const sideAxis = getSideAxis(placement);
    const alignmentAxis = getAlignmentAxis(placement);
    const alignLength = getAxisLength(alignmentAxis);
    const side = getSide(placement);
    const isVertical = sideAxis === "y";
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
    let coords;
    switch (side) {
      case "top":
        coords = {
          x: commonX,
          y: reference.y - floating.height
        };
        break;
      case "bottom":
        coords = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;
      case "right":
        coords = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;
      case "left":
        coords = {
          x: reference.x - floating.width,
          y: commonY
        };
        break;
      default:
        coords = {
          x: reference.x,
          y: reference.y
        };
    }
    const alignment = getAlignment(placement);
    if (alignment) {
      coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1);
    }
    return coords;
  }
  async function detectOverflow(state, options) {
    var _await$platform$isEle;
    if (options === void 0) {
      options = {};
    }
    const {
      x,
      y,
      platform: platform2,
      rects,
      elements,
      strategy
    } = state;
    const {
      boundary = "clippingAncestors",
      rootBoundary = "viewport",
      elementContext = "floating",
      altBoundary = false,
      padding = 0
    } = evaluate(options, state);
    const paddingObject = getPaddingObject(padding);
    const altContext = elementContext === "floating" ? "reference" : "floating";
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
      element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
      boundary,
      rootBoundary,
      strategy
    }));
    const rect = elementContext === "floating" ? {
      x,
      y,
      width: rects.floating.width,
      height: rects.floating.height
    } : rects.reference;
    const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
    const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) && await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
      x: 1,
      y: 1
    };
    const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
      elements,
      rect,
      offsetParent,
      strategy
    }) : rect);
    return {
      top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
      bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
      left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
      right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
  }
  var MAX_RESET_COUNT = 50;
  var computePosition = async (reference, floating, config) => {
    const {
      placement = "bottom",
      strategy = "absolute",
      middleware = [],
      platform: platform2
    } = config;
    const platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
      ...platform2,
      detectOverflow
    };
    const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
    let rects = await platform2.getElementRects({
      reference,
      floating,
      strategy
    });
    let {
      x,
      y
    } = computeCoordsFromPlacement(rects, placement, rtl);
    let statefulPlacement = placement;
    let resetCount = 0;
    const middlewareData = {};
    for (let i = 0; i < middleware.length; i++) {
      const currentMiddleware = middleware[i];
      if (!currentMiddleware) {
        continue;
      }
      const {
        name: name2,
        fn
      } = currentMiddleware;
      const {
        x: nextX,
        y: nextY,
        data,
        reset
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        platform: platformWithDetectOverflow,
        elements: {
          reference,
          floating
        }
      });
      x = nextX != null ? nextX : x;
      y = nextY != null ? nextY : y;
      middlewareData[name2] = {
        ...middlewareData[name2],
        ...data
      };
      if (reset && resetCount < MAX_RESET_COUNT) {
        resetCount++;
        if (typeof reset === "object") {
          if (reset.placement) {
            statefulPlacement = reset.placement;
          }
          if (reset.rects) {
            rects = reset.rects === true ? await platform2.getElementRects({
              reference,
              floating,
              strategy
            }) : reset.rects;
          }
          ({
            x,
            y
          } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
        }
        i = -1;
      }
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData
    };
  };
  var flip = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "flip",
      options,
      async fn(state) {
        var _middlewareData$arrow, _middlewareData$flip;
        const {
          placement,
          middlewareData,
          rects,
          initialPlacement,
          platform: platform2,
          elements
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true,
          fallbackPlacements: specifiedFallbackPlacements,
          fallbackStrategy = "bestFit",
          fallbackAxisSideDirection = "none",
          flipAlignment = true,
          ...detectOverflowOptions
        } = evaluate(options, state);
        if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
          return {};
        }
        const side = getSide(placement);
        const initialSideAxis = getSideAxis(initialPlacement);
        const isBasePlacement = getSide(initialPlacement) === initialPlacement;
        const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
        const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
        const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
        if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
          fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
        }
        const placements2 = [initialPlacement, ...fallbackPlacements];
        const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
        const overflows = [];
        let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
        if (checkMainAxis) {
          overflows.push(overflow[side]);
        }
        if (checkCrossAxis) {
          const sides2 = getAlignmentSides(placement, rects, rtl);
          overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
        }
        overflowsData = [...overflowsData, {
          placement,
          overflows
        }];
        if (!overflows.every((side2) => side2 <= 0)) {
          var _middlewareData$flip2, _overflowsData$filter;
          const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
          const nextPlacement = placements2[nextIndex];
          if (nextPlacement) {
            const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
            if (!ignoreCrossAxisOverflow || // We leave the current main axis only if every placement on that axis
            // overflows the main axis.
            overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
              return {
                data: {
                  index: nextIndex,
                  overflows: overflowsData
                },
                reset: {
                  placement: nextPlacement
                }
              };
            }
          }
          let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
          if (!resetPlacement) {
            switch (fallbackStrategy) {
              case "bestFit": {
                var _overflowsData$filter2;
                const placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                  if (hasFallbackAxisSideDirection) {
                    const currentSideAxis = getSideAxis(d.placement);
                    return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                    // reading directions favoring greater width.
                    currentSideAxis === "y";
                  }
                  return true;
                }).map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                if (placement2) {
                  resetPlacement = placement2;
                }
                break;
              }
              case "initialPlacement":
                resetPlacement = initialPlacement;
                break;
            }
          }
          if (placement !== resetPlacement) {
            return {
              reset: {
                placement: resetPlacement
              }
            };
          }
        }
        return {};
      }
    };
  };
  var originSides = /* @__PURE__ */ new Set(["left", "top"]);
  async function convertValueToCoords(state, options) {
    const {
      placement,
      platform: platform2,
      elements
    } = state;
    const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getSideAxis(placement) === "y";
    const mainAxisMulti = originSides.has(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = evaluate(options, state);
    let {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue === "number" ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: rawValue.mainAxis || 0,
      crossAxis: rawValue.crossAxis || 0,
      alignmentAxis: rawValue.alignmentAxis
    };
    if (alignment && typeof alignmentAxis === "number") {
      crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
    }
    return isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  }
  var offset = function(options) {
    if (options === void 0) {
      options = 0;
    }
    return {
      name: "offset",
      options,
      async fn(state) {
        var _middlewareData$offse, _middlewareData$arrow;
        const {
          x,
          y,
          placement,
          middlewareData
        } = state;
        const diffCoords = await convertValueToCoords(state, options);
        if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
          return {};
        }
        return {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: {
            ...diffCoords,
            placement
          }
        };
      }
    };
  };
  var shift = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "shift",
      options,
      async fn(state) {
        const {
          x,
          y,
          placement,
          platform: platform2
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = false,
          limiter = {
            fn: (_ref) => {
              let {
                x: x2,
                y: y2
              } = _ref;
              return {
                x: x2,
                y: y2
              };
            }
          },
          ...detectOverflowOptions
        } = evaluate(options, state);
        const coords = {
          x,
          y
        };
        const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
        const crossAxis = getSideAxis(placement);
        const mainAxis = getOppositeAxis(crossAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        const clampCoord = (axis, coord) => clamp(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
        if (checkMainAxis) {
          mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
        }
        if (checkCrossAxis) {
          crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
        }
        const limitedCoords = limiter.fn({
          ...state,
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        });
        return {
          ...limitedCoords,
          data: {
            x: limitedCoords.x - x,
            y: limitedCoords.y - y,
            enabled: {
              [mainAxis]: checkMainAxis,
              [crossAxis]: checkCrossAxis
            }
          }
        };
      }
    };
  };
  var size = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "size",
      options,
      async fn(state) {
        const {
          placement,
          rects,
          platform: platform2,
          elements
        } = state;
        const {
          apply: apply2 = () => {
          },
          ...detectOverflowOptions
        } = evaluate(options, state);
        const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
        const side = getSide(placement);
        const alignment = getAlignment(placement);
        const isYAxis = getSideAxis(placement) === "y";
        const {
          width,
          height
        } = rects.floating;
        let heightSide;
        let widthSide;
        if (side === "top" || side === "bottom") {
          heightSide = side;
          widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
        } else {
          widthSide = side;
          heightSide = alignment === "end" ? "top" : "bottom";
        }
        const maximumClippingHeight = height - overflow.top - overflow.bottom;
        const maximumClippingWidth = width - overflow.left - overflow.right;
        const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
        const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
        const shiftData = state.middlewareData.shift;
        const noShift = !shiftData;
        let availableHeight = overflowAvailableHeight;
        let availableWidth = overflowAvailableWidth;
        if (shiftData != null && shiftData.enabled.x) {
          availableWidth = maximumClippingWidth;
        }
        if (shiftData != null && shiftData.enabled.y) {
          availableHeight = maximumClippingHeight;
        }
        if (noShift && !alignment) {
          if (isYAxis) {
            availableWidth = width - 2 * max(overflow.left, overflow.right);
          } else {
            availableHeight = height - 2 * max(overflow.top, overflow.bottom);
          }
        }
        await apply2({
          ...state,
          availableWidth,
          availableHeight
        });
        const nextDimensions = await platform2.getDimensions(elements.floating);
        if (width !== nextDimensions.width || height !== nextDimensions.height) {
          return {
            reset: {
              rects: true
            }
          };
        }
        return {};
      }
    };
  };

  // ../../node_modules/.pnpm/@floating-ui+dom@1.8.0/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
  function getCssDimensions(element) {
    const css = getComputedStyle2(element);
    let width = parseFloat(css.width) || 0;
    let height = parseFloat(css.height) || 0;
    const hasOffset = isHTMLElement(element);
    const offsetWidth = hasOffset ? element.offsetWidth : width;
    const offsetHeight = hasOffset ? element.offsetHeight : height;
    const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
    if (shouldFallback) {
      width = offsetWidth;
      height = offsetHeight;
    }
    return {
      width,
      height,
      $: shouldFallback
    };
  }
  function unwrapElement(element) {
    return !isElement(element) ? element.contextElement : element;
  }
  function getScale(element) {
    const domElement = unwrapElement(element);
    if (!isHTMLElement(domElement)) {
      return createCoords(1);
    }
    const rect = domElement.getBoundingClientRect();
    const {
      width,
      height,
      $
    } = getCssDimensions(domElement);
    let x = ($ ? round(rect.width) : rect.width) / width;
    let y = ($ ? round(rect.height) : rect.height) / height;
    if (!x || !Number.isFinite(x)) {
      x = 1;
    }
    if (!y || !Number.isFinite(y)) {
      y = 1;
    }
    return {
      x,
      y
    };
  }
  var noOffsets = /* @__PURE__ */ createCoords(0);
  function getVisualOffsets(element) {
    const win = getWindow(element);
    if (!isWebKit() || !win.visualViewport) {
      return noOffsets;
    }
    return {
      x: win.visualViewport.offsetLeft,
      y: win.visualViewport.offsetTop
    };
  }
  function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
  }
  function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    const clientRect = element.getBoundingClientRect();
    const domElement = unwrapElement(element);
    let scale = createCoords(1);
    if (includeScale) {
      if (offsetParent) {
        if (isElement(offsetParent)) {
          scale = getScale(offsetParent);
        }
      } else {
        scale = getScale(element);
      }
    }
    const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
    let x = (clientRect.left + visualOffsets.x) / scale.x;
    let y = (clientRect.top + visualOffsets.y) / scale.y;
    let width = clientRect.width / scale.x;
    let height = clientRect.height / scale.y;
    if (domElement && offsetParent) {
      const win = getWindow(domElement);
      const offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
      let currentWin = win;
      let currentIFrame = getFrameElement(currentWin);
      while (currentIFrame && offsetWin !== currentWin) {
        const iframeScale = getScale(currentIFrame);
        const iframeRect = currentIFrame.getBoundingClientRect();
        const css = getComputedStyle2(currentIFrame);
        const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
        const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
        x *= iframeScale.x;
        y *= iframeScale.y;
        width *= iframeScale.x;
        height *= iframeScale.y;
        x += left;
        y += top;
        currentWin = getWindow(currentIFrame);
        currentIFrame = getFrameElement(currentWin);
      }
    }
    return rectToClientRect({
      width,
      height,
      x,
      y
    });
  }
  function getWindowScrollBarX(element, rect) {
    const leftScroll = getNodeScroll(element).scrollLeft;
    if (!rect) {
      return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
    }
    return rect.left + leftScroll;
  }
  function getHTMLOffset(documentElement, scroll) {
    const htmlRect = documentElement.getBoundingClientRect();
    const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
    const y = htmlRect.top + scroll.scrollTop;
    return {
      x,
      y
    };
  }
  function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let {
      elements,
      rect,
      offsetParent,
      strategy
    } = _ref;
    const isFixed = strategy === "fixed";
    const documentElement = getDocumentElement(offsetParent);
    const topLayer = elements ? isTopLayer(elements.floating) : false;
    if (offsetParent === documentElement || topLayer && isFixed) {
      return rect;
    }
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    let scale = createCoords(1);
    const offsets = createCoords(0);
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    if (isOffsetParentAnElement || !isFixed) {
      if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isOffsetParentAnElement) {
        const offsetRect = getBoundingClientRect(offsetParent);
        scale = getScale(offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      }
    }
    const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
    return {
      width: rect.width * scale.x,
      height: rect.height * scale.y,
      x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
      y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
    };
  }
  function getClientRects(element) {
    return element.getClientRects ? Array.from(element.getClientRects()) : [];
  }
  function getDocumentRect(html) {
    const scroll = getNodeScroll(html);
    const body = html.ownerDocument.body;
    const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
    const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
    let x = -scroll.scrollLeft + getWindowScrollBarX(html);
    const y = -scroll.scrollTop;
    if (getComputedStyle2(body).direction === "rtl") {
      x += max(html.clientWidth, body.clientWidth) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }
  var SCROLLBAR_MAX = 25;
  function getViewportRect(element, strategy, rootBoundary) {
    if (rootBoundary === void 0) {
      rootBoundary = "viewport";
    }
    const isLayoutViewport = rootBoundary === "layoutViewport";
    const win = getWindow(element);
    const html = getDocumentElement(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
      const layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
      if (isLayoutViewport) {
        if (!layoutRelativeClientCoords) {
          x = -visualViewport.offsetLeft;
          y = -visualViewport.offsetTop;
        }
      } else {
        width = visualViewport.width;
        height = visualViewport.height;
        if (layoutRelativeClientCoords) {
          x = visualViewport.offsetLeft;
          y = visualViewport.offsetTop;
        }
      }
    }
    const windowScrollbarX = getWindowScrollBarX(html);
    if (windowScrollbarX <= 0) {
      const doc = html.ownerDocument;
      const body = doc.body;
      const bodyStyles = getComputedStyle(body);
      const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
      const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
      const gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
      if (gutter <= SCROLLBAR_MAX) {
        width -= gutter;
      }
    }
    return {
      width,
      height,
      x,
      y
    };
  }
  function getInnerBoundingClientRect(element, strategy) {
    const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    const scale = getScale(element);
    const width = element.clientWidth * scale.x;
    const height = element.clientHeight * scale.y;
    const x = left * scale.x;
    const y = top * scale.y;
    return {
      width,
      height,
      x,
      y
    };
  }
  function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
    let rect;
    if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport") {
      rect = getViewportRect(element, strategy, clippingAncestor);
    } else if (clippingAncestor === "document") {
      rect = getDocumentRect(getDocumentElement(element));
    } else if (isElement(clippingAncestor)) {
      rect = getInnerBoundingClientRect(clippingAncestor, strategy);
    } else {
      const visualOffsets = getVisualOffsets(element);
      rect = {
        x: clippingAncestor.x - visualOffsets.x,
        y: clippingAncestor.y - visualOffsets.y,
        width: clippingAncestor.width,
        height: clippingAncestor.height
      };
    }
    return rectToClientRect(rect);
  }
  function getClippingElementAncestors(element, cache) {
    const cachedResult = cache.get(element);
    if (cachedResult) {
      return cachedResult;
    }
    let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
    let lastKeptComputedStyle = null;
    const elementIsFixed = getComputedStyle2(element).position === "fixed";
    let currentNode = elementIsFixed ? getParentNode(element) : element;
    while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
      const computedStyle = getComputedStyle2(currentNode);
      const currentNodeIsContaining = isContainingBlock(currentNode);
      const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
      const shouldDropCurrentNode = !currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static");
      if (shouldDropCurrentNode) {
        result = result.filter((ancestor) => ancestor !== currentNode);
      } else {
        lastKeptComputedStyle = computedStyle;
      }
      currentNode = getParentNode(currentNode);
    }
    cache.set(element, result);
    return result;
  }
  function getClippingRect(_ref) {
    let {
      element,
      boundary,
      rootBoundary,
      strategy
    } = _ref;
    const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
    const clippingAncestors = [...elementClippingAncestors, rootBoundary];
    const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
    let top = firstRect.top;
    let right = firstRect.right;
    let bottom = firstRect.bottom;
    let left = firstRect.left;
    for (let i = 1; i < clippingAncestors.length; i++) {
      const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
      top = max(rect.top, top);
      right = min(rect.right, right);
      bottom = min(rect.bottom, bottom);
      left = max(rect.left, left);
    }
    return {
      width: right - left,
      height: bottom - top,
      x: left,
      y: top
    };
  }
  function getDimensions(element) {
    const {
      width,
      height
    } = getCssDimensions(element);
    return {
      width,
      height
    };
  }
  function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    const isFixed = strategy === "fixed";
    const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    const offsets = createCoords(0);
    if (isOffsetParentAnElement || !isFixed) {
      if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isOffsetParentAnElement) {
        const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      }
    }
    if (!isOffsetParentAnElement && documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
    const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
    const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
    const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
    return {
      x,
      y,
      width: rect.width,
      height: rect.height
    };
  }
  function isStaticPositioned(element) {
    return getComputedStyle2(element).position === "static";
  }
  function getTrueOffsetParent(element, polyfill) {
    if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
      return null;
    }
    if (polyfill) {
      return polyfill(element);
    }
    let rawOffsetParent = element.offsetParent;
    if (getDocumentElement(element) === rawOffsetParent) {
      rawOffsetParent = rawOffsetParent.ownerDocument.body;
    }
    return rawOffsetParent;
  }
  function getOffsetParent(element, polyfill) {
    const win = getWindow(element);
    if (isTopLayer(element)) {
      return win;
    }
    if (!isHTMLElement(element)) {
      let svgOffsetParent = getParentNode(element);
      while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
        if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
          return svgOffsetParent;
        }
        svgOffsetParent = getParentNode(svgOffsetParent);
      }
      return win;
    }
    let offsetParent = getTrueOffsetParent(element, polyfill);
    while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
      offsetParent = getTrueOffsetParent(offsetParent, polyfill);
    }
    if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
      return win;
    }
    return offsetParent || getContainingBlock(element) || win;
  }
  var getElementRects = async function(data) {
    const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
    const getDimensionsFn = this.getDimensions;
    const floatingDimensions = await getDimensionsFn(data.floating);
    return {
      reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
      floating: {
        x: 0,
        y: 0,
        width: floatingDimensions.width,
        height: floatingDimensions.height
      }
    };
  };
  function isRTL(element) {
    return getComputedStyle2(element).direction === "rtl";
  }
  var platform = {
    convertOffsetParentRelativeRectToViewportRelativeRect,
    getDocumentElement,
    getClippingRect,
    getOffsetParent,
    getElementRects,
    getClientRects,
    getDimensions,
    getScale,
    isElement,
    isRTL
  };
  function rectsAreEqual(a, b) {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }
  function observeMove(element, onMove, ancestorResize) {
    let io = null;
    let timeoutId;
    const root = getDocumentElement(element);
    function cleanup() {
      var _io;
      clearTimeout(timeoutId);
      (_io = io) == null || _io.disconnect();
      io = null;
    }
    function refresh(skip, threshold) {
      if (skip === void 0) {
        skip = false;
      }
      if (threshold === void 0) {
        threshold = 1;
      }
      cleanup();
      const elementRectForRootMargin = element.getBoundingClientRect();
      const {
        left,
        top,
        width,
        height
      } = elementRectForRootMargin;
      if (!skip) {
        onMove();
      }
      if (!width || !height) {
        return;
      }
      const insetTop = floor(top);
      const insetRight = floor(root.clientWidth - (left + width));
      const insetBottom = floor(root.clientHeight - (top + height));
      const insetLeft = floor(left);
      const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
      const options = {
        rootMargin,
        threshold: max(0, min(1, threshold)) || 1
      };
      let isFirstUpdate = true;
      function handleObserve(entries) {
        const ratio = entries[0].intersectionRatio;
        if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
          return refresh();
        }
        if (ratio !== threshold) {
          if (!isFirstUpdate) {
            return refresh();
          }
          if (!ratio) {
            timeoutId = setTimeout(() => {
              refresh(false, 1e-7);
            }, 1e3);
          } else {
            refresh(false, ratio);
          }
        }
        isFirstUpdate = false;
      }
      try {
        io = new IntersectionObserver(handleObserve, {
          ...options,
          // Handle <iframe>s
          root: root.ownerDocument
        });
      } catch (_e) {
        io = new IntersectionObserver(handleObserve, options);
      }
      io.observe(element);
    }
    const win = getWindow(element);
    const handleResize = () => refresh(ancestorResize);
    win.addEventListener("resize", handleResize);
    refresh(true);
    return () => {
      win.removeEventListener("resize", handleResize);
      cleanup();
    };
  }
  function autoUpdate(reference, floating, update, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      ancestorScroll = true,
      ancestorResize = true,
      elementResize = typeof ResizeObserver === "function",
      layoutShift = typeof IntersectionObserver === "function",
      animationFrame = false
    } = options;
    const referenceEl = unwrapElement(reference);
    const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.addEventListener("scroll", update);
      ancestorResize && ancestor.addEventListener("resize", update);
    });
    const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null;
    let reobserveFrame = -1;
    let resizeObserver = null;
    if (elementResize) {
      resizeObserver = new ResizeObserver((_ref) => {
        let [firstEntry] = _ref;
        if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
          resizeObserver.unobserve(floating);
          cancelAnimationFrame(reobserveFrame);
          reobserveFrame = requestAnimationFrame(() => {
            var _resizeObserver;
            (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
          });
        }
        update();
      });
      if (referenceEl && !animationFrame) {
        resizeObserver.observe(referenceEl);
      }
      if (floating) {
        resizeObserver.observe(floating);
      }
    }
    let frameId;
    let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
    if (animationFrame) {
      frameLoop();
    }
    function frameLoop() {
      const nextRefRect = getBoundingClientRect(reference);
      if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
        update();
      }
      prevRefRect = nextRefRect;
      frameId = requestAnimationFrame(frameLoop);
    }
    update();
    return () => {
      var _resizeObserver2;
      ancestors.forEach((ancestor) => {
        ancestorScroll && ancestor.removeEventListener("scroll", update);
        ancestorResize && ancestor.removeEventListener("resize", update);
      });
      cleanupIo == null || cleanupIo();
      (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
      resizeObserver = null;
      if (animationFrame) {
        cancelAnimationFrame(frameId);
      }
    };
  }
  var offset2 = offset;
  var shift2 = shift;
  var flip2 = flip;
  var size2 = size;
  var computePosition2 = (reference, floating, options) => {
    const cache = /* @__PURE__ */ new Map();
    const mergedOptions = options != null ? options : {};
    const platformWithCache = {
      ...platform,
      ...mergedOptions.platform,
      _c: cache
    };
    return computePosition(reference, floating, {
      ...mergedOptions,
      platform: platformWithCache
    });
  };

  // ../../node_modules/.pnpm/@floating-ui+react-dom@2.1.9_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs
  var React5 = __toESM(__require("react"), 1);
  var import_react6 = __require("react");
  var ReactDOM = __toESM(__require("react-dom"), 1);
  var isClient2 = typeof document !== "undefined";
  var noop3 = function noop4() {
  };
  var index2 = isClient2 ? import_react6.useLayoutEffect : noop3;
  function deepEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (typeof a !== typeof b) {
      return false;
    }
    if (typeof a === "function" && a.toString() === b.toString()) {
      return true;
    }
    let length;
    let i;
    let keys;
    if (a && b && typeof a === "object") {
      if (Array.isArray(a)) {
        length = a.length;
        if (length !== b.length) return false;
        for (i = length; i-- !== 0; ) {
          if (!deepEqual(a[i], b[i])) {
            return false;
          }
        }
        return true;
      }
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length) {
        return false;
      }
      for (i = length; i-- !== 0; ) {
        if (!{}.hasOwnProperty.call(b, keys[i])) {
          return false;
        }
      }
      for (i = length; i-- !== 0; ) {
        const key = keys[i];
        if (key === "_owner" && a.$$typeof) {
          continue;
        }
        if (!deepEqual(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }
    return a !== a && b !== b;
  }
  function getDPR(element) {
    if (typeof window === "undefined") {
      return 1;
    }
    const win = element.ownerDocument.defaultView || window;
    return win.devicePixelRatio || 1;
  }
  function roundByDPR(element, value) {
    const dpr = getDPR(element);
    return Math.round(value * dpr) / dpr;
  }
  function useLatestRef2(value) {
    const ref = React5.useRef(value);
    index2(() => {
      ref.current = value;
    });
    return ref;
  }
  function useFloating(options) {
    if (options === void 0) {
      options = {};
    }
    const {
      placement = "bottom",
      strategy = "absolute",
      middleware = [],
      platform: platform2,
      elements: {
        reference: externalReference,
        floating: externalFloating
      } = {},
      transform = true,
      whileElementsMounted,
      open
    } = options;
    const [data, setData] = React5.useState({
      x: 0,
      y: 0,
      strategy,
      placement,
      middlewareData: {},
      isPositioned: false
    });
    const [latestMiddleware, setLatestMiddleware] = React5.useState(middleware);
    if (!deepEqual(latestMiddleware, middleware)) {
      setLatestMiddleware(middleware);
    }
    const [_reference, _setReference] = React5.useState(null);
    const [_floating, _setFloating] = React5.useState(null);
    const setReference = React5.useCallback((node) => {
      if (node !== referenceRef.current) {
        referenceRef.current = node;
        _setReference(node);
      }
    }, []);
    const setFloating = React5.useCallback((node) => {
      if (node !== floatingRef.current) {
        floatingRef.current = node;
        _setFloating(node);
      }
    }, []);
    const referenceEl = externalReference || _reference;
    const floatingEl = externalFloating || _floating;
    const referenceRef = React5.useRef(null);
    const floatingRef = React5.useRef(null);
    const dataRef = React5.useRef(data);
    const hasWhileElementsMounted = whileElementsMounted != null;
    const whileElementsMountedRef = useLatestRef2(whileElementsMounted);
    const platformRef = useLatestRef2(platform2);
    const openRef = useLatestRef2(open);
    const update = React5.useCallback(() => {
      if (!referenceRef.current || !floatingRef.current) {
        return;
      }
      const config = {
        placement,
        strategy,
        middleware: latestMiddleware
      };
      if (platformRef.current) {
        config.platform = platformRef.current;
      }
      computePosition2(referenceRef.current, floatingRef.current, config).then((data2) => {
        const fullData = {
          ...data2,
          // The floating element's position may be recomputed while it's closed
          // but still mounted (such as when transitioning out). To ensure
          // `isPositioned` will be `false` initially on the next open, avoid
          // setting it to `true` when `open === false` (must be specified).
          isPositioned: openRef.current !== false
        };
        if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
          dataRef.current = fullData;
          ReactDOM.flushSync(() => {
            setData(fullData);
          });
        }
      });
    }, [latestMiddleware, placement, strategy, platformRef, openRef]);
    index2(() => {
      if (open === false && dataRef.current.isPositioned) {
        dataRef.current.isPositioned = false;
        setData((data2) => ({
          ...data2,
          isPositioned: false
        }));
      }
    }, [open]);
    const isMountedRef = React5.useRef(false);
    index2(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);
    index2(() => {
      if (referenceEl) referenceRef.current = referenceEl;
      if (floatingEl) floatingRef.current = floatingEl;
      if (referenceEl && floatingEl) {
        if (whileElementsMountedRef.current) {
          return whileElementsMountedRef.current(referenceEl, floatingEl, update);
        }
        update();
      }
    }, [referenceEl, floatingEl, update, whileElementsMountedRef, hasWhileElementsMounted]);
    const refs = React5.useMemo(() => ({
      reference: referenceRef,
      floating: floatingRef,
      setReference,
      setFloating
    }), [setReference, setFloating]);
    const elements = React5.useMemo(() => ({
      reference: referenceEl,
      floating: floatingEl
    }), [referenceEl, floatingEl]);
    const floatingStyles = React5.useMemo(() => {
      const initialStyles = {
        position: strategy,
        left: 0,
        top: 0
      };
      if (!elements.floating) {
        return initialStyles;
      }
      const x = roundByDPR(elements.floating, data.x);
      const y = roundByDPR(elements.floating, data.y);
      if (transform) {
        return {
          ...initialStyles,
          transform: "translate(" + x + "px, " + y + "px)",
          ...getDPR(elements.floating) >= 1.5 && {
            willChange: "transform"
          }
        };
      }
      return {
        position: strategy,
        left: x,
        top: y
      };
    }, [strategy, transform, elements.floating, data.x, data.y]);
    return React5.useMemo(() => ({
      ...data,
      update,
      refs,
      elements,
      floatingStyles
    }), [data, update, refs, elements, floatingStyles]);
  }
  var offset3 = (options, deps) => {
    const result = offset2(options);
    return {
      name: result.name,
      fn: result.fn,
      options: [options, deps]
    };
  };
  var shift3 = (options, deps) => {
    const result = shift2(options);
    return {
      name: result.name,
      fn: result.fn,
      options: [options, deps]
    };
  };
  var flip3 = (options, deps) => {
    const result = flip2(options);
    return {
      name: result.name,
      fn: result.fn,
      options: [options, deps]
    };
  };
  var size3 = (options, deps) => {
    const result = size2(options);
    return {
      name: result.name,
      fn: result.fn,
      options: [options, deps]
    };
  };

  // ../../node_modules/.pnpm/@floating-ui+react@0.27.20_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react/dist/floating-ui.react.mjs
  var FOCUSABLE_ATTRIBUTE2 = "data-floating-ui-focusable";
  var ACTIVE_KEY = "active";
  var SELECTED_KEY = "selected";
  var ARROW_LEFT = "ArrowLeft";
  var ARROW_RIGHT = "ArrowRight";
  var ARROW_UP = "ArrowUp";
  var ARROW_DOWN = "ArrowDown";
  var horizontalKeys = [ARROW_LEFT, ARROW_RIGHT];
  var verticalKeys = [ARROW_UP, ARROW_DOWN];
  var allKeys = [...horizontalKeys, ...verticalKeys];
  var SafeReact2 = {
    ...React6
  };
  var serverHandoffComplete = false;
  var count = 0;
  var genId = () => (
    // Ensure the id is unique with multiple independent versions of Floating UI
    // on <React 18
    "floating-ui-" + Math.random().toString(36).slice(2, 6) + count++
  );
  function useFloatingId() {
    const [id, setId] = React6.useState(() => serverHandoffComplete ? genId() : void 0);
    index(() => {
      if (id == null) {
        setId(genId());
      }
    }, []);
    React6.useEffect(() => {
      serverHandoffComplete = true;
    }, []);
    return id;
  }
  var useReactId = SafeReact2.useId;
  var useId = useReactId || useFloatingId;
  var devMessageSet;
  if (true) {
    devMessageSet = /* @__PURE__ */ new Set();
  }
  function error() {
    var _devMessageSet3;
    for (var _len2 = arguments.length, messages = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      messages[_key2] = arguments[_key2];
    }
    const message2 = "Floating UI: " + messages.join(" ");
    if (!((_devMessageSet3 = devMessageSet) != null && _devMessageSet3.has(message2))) {
      var _devMessageSet4;
      (_devMessageSet4 = devMessageSet) == null || _devMessageSet4.add(message2);
      console.error(message2);
    }
  }
  function createEventEmitter() {
    const map = /* @__PURE__ */ new Map();
    return {
      emit(event, data) {
        var _map$get;
        (_map$get = map.get(event)) == null || _map$get.forEach((listener) => listener(data));
      },
      on(event, listener) {
        if (!map.has(event)) {
          map.set(event, /* @__PURE__ */ new Set());
        }
        map.get(event).add(listener);
      },
      off(event, listener) {
        var _map$get2;
        (_map$get2 = map.get(event)) == null || _map$get2.delete(listener);
      }
    };
  }
  var FloatingNodeContext = /* @__PURE__ */ React6.createContext(null);
  var FloatingTreeContext = /* @__PURE__ */ React6.createContext(null);
  var useFloatingParentNodeId = () => {
    var _React$useContext;
    return ((_React$useContext = React6.useContext(FloatingNodeContext)) == null ? void 0 : _React$useContext.id) || null;
  };
  var useFloatingTree = () => React6.useContext(FloatingTreeContext);
  function createAttribute(name2) {
    return "data-floating-ui-" + name2;
  }
  function clearTimeoutIfSet(timeoutRef) {
    if (timeoutRef.current !== -1) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = -1;
    }
  }
  var safePolygonIdentifier = /* @__PURE__ */ createAttribute("safe-polygon");
  function getDelay(value, prop, pointerType) {
    if (pointerType && !isMouseLikePointerType(pointerType)) {
      return 0;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "function") {
      const result = value();
      if (typeof result === "number") {
        return result;
      }
      return result == null ? void 0 : result[prop];
    }
    return value == null ? void 0 : value[prop];
  }
  function getRestMs(value) {
    if (typeof value === "function") {
      return value();
    }
    return value;
  }
  function useHover(context, props) {
    if (props === void 0) {
      props = {};
    }
    const {
      open,
      onOpenChange,
      dataRef,
      events,
      elements
    } = context;
    const {
      enabled = true,
      delay = 0,
      handleClose = null,
      mouseOnly = false,
      restMs = 0,
      move = true
    } = props;
    const tree = useFloatingTree();
    const parentId = useFloatingParentNodeId();
    const handleCloseRef = useLatestRef(handleClose);
    const delayRef = useLatestRef(delay);
    const openRef = useLatestRef(open);
    const restMsRef = useLatestRef(restMs);
    const pointerTypeRef = React6.useRef();
    const timeoutRef = React6.useRef(-1);
    const handlerRef = React6.useRef();
    const restTimeoutRef = React6.useRef(-1);
    const blockMouseMoveRef = React6.useRef(true);
    const performedPointerEventsMutationRef = React6.useRef(false);
    const unbindMouseMoveRef = React6.useRef(() => {
    });
    const restTimeoutPendingRef = React6.useRef(false);
    const isHoverOpen = useEffectEvent(() => {
      var _dataRef$current$open;
      const type = (_dataRef$current$open = dataRef.current.openEvent) == null ? void 0 : _dataRef$current$open.type;
      return (type == null ? void 0 : type.includes("mouse")) && type !== "mousedown";
    });
    React6.useEffect(() => {
      if (!enabled) return;
      function onOpenChange2(_ref) {
        let {
          open: open2
        } = _ref;
        if (!open2) {
          clearTimeoutIfSet(timeoutRef);
          clearTimeoutIfSet(restTimeoutRef);
          blockMouseMoveRef.current = true;
          restTimeoutPendingRef.current = false;
        }
      }
      events.on("openchange", onOpenChange2);
      return () => {
        events.off("openchange", onOpenChange2);
      };
    }, [enabled, events]);
    React6.useEffect(() => {
      if (!enabled) return;
      if (!handleCloseRef.current) return;
      if (!open) return;
      function onLeave(event) {
        if (isHoverOpen()) {
          onOpenChange(false, event, "hover");
        }
      }
      const html = getDocument(elements.floating).documentElement;
      html.addEventListener("mouseleave", onLeave);
      return () => {
        html.removeEventListener("mouseleave", onLeave);
      };
    }, [elements.floating, open, onOpenChange, enabled, handleCloseRef, isHoverOpen]);
    const closeWithDelay = React6.useCallback(function(event, runElseBranch, reason) {
      if (runElseBranch === void 0) {
        runElseBranch = true;
      }
      if (reason === void 0) {
        reason = "hover";
      }
      const closeDelay = getDelay(delayRef.current, "close", pointerTypeRef.current);
      if (closeDelay && !handlerRef.current) {
        clearTimeoutIfSet(timeoutRef);
        timeoutRef.current = window.setTimeout(() => onOpenChange(false, event, reason), closeDelay);
      } else if (runElseBranch) {
        clearTimeoutIfSet(timeoutRef);
        onOpenChange(false, event, reason);
      }
    }, [delayRef, onOpenChange]);
    const cleanupMouseMoveHandler = useEffectEvent(() => {
      unbindMouseMoveRef.current();
      handlerRef.current = void 0;
    });
    const clearPointerEvents = useEffectEvent(() => {
      if (performedPointerEventsMutationRef.current) {
        const body = getDocument(elements.floating).body;
        body.style.pointerEvents = "";
        body.removeAttribute(safePolygonIdentifier);
        performedPointerEventsMutationRef.current = false;
      }
    });
    const isClickLikeOpenEvent = useEffectEvent(() => {
      return dataRef.current.openEvent ? ["click", "mousedown"].includes(dataRef.current.openEvent.type) : false;
    });
    React6.useEffect(() => {
      if (!enabled) return;
      function onReferenceMouseEnter(event) {
        clearTimeoutIfSet(timeoutRef);
        blockMouseMoveRef.current = false;
        if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current) || getRestMs(restMsRef.current) > 0 && !getDelay(delayRef.current, "open")) {
          return;
        }
        const openDelay = getDelay(delayRef.current, "open", pointerTypeRef.current);
        if (openDelay) {
          timeoutRef.current = window.setTimeout(() => {
            if (!openRef.current) {
              onOpenChange(true, event, "hover");
            }
          }, openDelay);
        } else if (!open) {
          onOpenChange(true, event, "hover");
        }
      }
      function onReferenceMouseLeave(event) {
        if (isClickLikeOpenEvent()) {
          clearPointerEvents();
          return;
        }
        unbindMouseMoveRef.current();
        const doc = getDocument(elements.floating);
        clearTimeoutIfSet(restTimeoutRef);
        restTimeoutPendingRef.current = false;
        if (handleCloseRef.current && dataRef.current.floatingContext) {
          if (!open) {
            clearTimeoutIfSet(timeoutRef);
          }
          handlerRef.current = handleCloseRef.current({
            ...dataRef.current.floatingContext,
            tree,
            x: event.clientX,
            y: event.clientY,
            onClose() {
              clearPointerEvents();
              cleanupMouseMoveHandler();
              if (!isClickLikeOpenEvent()) {
                closeWithDelay(event, true, "safe-polygon");
              }
            }
          });
          const handler = handlerRef.current;
          doc.addEventListener("mousemove", handler);
          unbindMouseMoveRef.current = () => {
            doc.removeEventListener("mousemove", handler);
          };
          return;
        }
        const shouldClose = pointerTypeRef.current === "touch" ? !contains(elements.floating, event.relatedTarget) : true;
        if (shouldClose) {
          closeWithDelay(event);
        }
      }
      function onScrollMouseLeave(event) {
        if (isClickLikeOpenEvent()) return;
        if (!dataRef.current.floatingContext) return;
        handleCloseRef.current == null || handleCloseRef.current({
          ...dataRef.current.floatingContext,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (!isClickLikeOpenEvent()) {
              closeWithDelay(event);
            }
          }
        })(event);
      }
      function onFloatingMouseEnter() {
        clearTimeoutIfSet(timeoutRef);
      }
      function onFloatingMouseLeave(event) {
        if (!isClickLikeOpenEvent()) {
          closeWithDelay(event, false);
        }
      }
      if (isElement(elements.domReference)) {
        const reference2 = elements.domReference;
        const floating = elements.floating;
        if (open) {
          reference2.addEventListener("mouseleave", onScrollMouseLeave);
        }
        if (move) {
          reference2.addEventListener("mousemove", onReferenceMouseEnter, {
            once: true
          });
        }
        reference2.addEventListener("mouseenter", onReferenceMouseEnter);
        reference2.addEventListener("mouseleave", onReferenceMouseLeave);
        if (floating) {
          floating.addEventListener("mouseleave", onScrollMouseLeave);
          floating.addEventListener("mouseenter", onFloatingMouseEnter);
          floating.addEventListener("mouseleave", onFloatingMouseLeave);
        }
        return () => {
          if (open) {
            reference2.removeEventListener("mouseleave", onScrollMouseLeave);
          }
          if (move) {
            reference2.removeEventListener("mousemove", onReferenceMouseEnter);
          }
          reference2.removeEventListener("mouseenter", onReferenceMouseEnter);
          reference2.removeEventListener("mouseleave", onReferenceMouseLeave);
          if (floating) {
            floating.removeEventListener("mouseleave", onScrollMouseLeave);
            floating.removeEventListener("mouseenter", onFloatingMouseEnter);
            floating.removeEventListener("mouseleave", onFloatingMouseLeave);
          }
        };
      }
    }, [elements, enabled, context, mouseOnly, move, closeWithDelay, cleanupMouseMoveHandler, clearPointerEvents, onOpenChange, open, openRef, tree, delayRef, handleCloseRef, dataRef, isClickLikeOpenEvent, restMsRef]);
    index(() => {
      var _handleCloseRef$curre;
      if (!enabled) return;
      if (open && (_handleCloseRef$curre = handleCloseRef.current) != null && (_handleCloseRef$curre = _handleCloseRef$curre.__options) != null && _handleCloseRef$curre.blockPointerEvents && isHoverOpen()) {
        performedPointerEventsMutationRef.current = true;
        const floatingEl = elements.floating;
        if (isElement(elements.domReference) && floatingEl) {
          var _tree$nodesRef$curren;
          const body = getDocument(elements.floating).body;
          body.setAttribute(safePolygonIdentifier, "");
          const ref = elements.domReference;
          const parentFloating = tree == null || (_tree$nodesRef$curren = tree.nodesRef.current.find((node) => node.id === parentId)) == null || (_tree$nodesRef$curren = _tree$nodesRef$curren.context) == null ? void 0 : _tree$nodesRef$curren.elements.floating;
          if (parentFloating) {
            parentFloating.style.pointerEvents = "";
          }
          body.style.pointerEvents = "none";
          ref.style.pointerEvents = "auto";
          floatingEl.style.pointerEvents = "auto";
          return () => {
            body.style.pointerEvents = "";
            ref.style.pointerEvents = "";
            floatingEl.style.pointerEvents = "";
          };
        }
      }
    }, [enabled, open, parentId, elements, tree, handleCloseRef, isHoverOpen]);
    index(() => {
      if (!open) {
        pointerTypeRef.current = void 0;
        restTimeoutPendingRef.current = false;
        cleanupMouseMoveHandler();
        clearPointerEvents();
      }
    }, [open, cleanupMouseMoveHandler, clearPointerEvents]);
    React6.useEffect(() => {
      return () => {
        cleanupMouseMoveHandler();
        clearTimeoutIfSet(timeoutRef);
        clearTimeoutIfSet(restTimeoutRef);
        clearPointerEvents();
      };
    }, [enabled, elements.domReference, cleanupMouseMoveHandler, clearPointerEvents]);
    const reference = React6.useMemo(() => {
      function setPointerRef(event) {
        pointerTypeRef.current = event.pointerType;
      }
      return {
        onPointerDown: setPointerRef,
        onPointerEnter: setPointerRef,
        onMouseMove(event) {
          const {
            nativeEvent
          } = event;
          function handleMouseMove() {
            if (!blockMouseMoveRef.current && !openRef.current) {
              onOpenChange(true, nativeEvent, "hover");
            }
          }
          if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current)) {
            return;
          }
          if (open || getRestMs(restMsRef.current) === 0) {
            return;
          }
          if (restTimeoutPendingRef.current && event.movementX ** 2 + event.movementY ** 2 < 2) {
            return;
          }
          clearTimeoutIfSet(restTimeoutRef);
          if (pointerTypeRef.current === "touch") {
            handleMouseMove();
          } else {
            restTimeoutPendingRef.current = true;
            restTimeoutRef.current = window.setTimeout(handleMouseMove, getRestMs(restMsRef.current));
          }
        }
      };
    }, [mouseOnly, onOpenChange, open, openRef, restMsRef]);
    return React6.useMemo(() => enabled ? {
      reference
    } : {}, [enabled, reference]);
  }
  var HIDDEN_STYLES = {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "fixed",
    whiteSpace: "nowrap",
    width: "1px",
    top: 0,
    left: 0
  };
  var FocusGuard = /* @__PURE__ */ React6.forwardRef(function FocusGuard2(props, ref) {
    const [role, setRole] = React6.useState();
    index(() => {
      if (isSafari()) {
        setRole("button");
      }
    }, []);
    const restProps = {
      ref,
      tabIndex: 0,
      // Role is only for VoiceOver
      role,
      "aria-hidden": role ? void 0 : true,
      [createAttribute("focus-guard")]: "",
      style: HIDDEN_STYLES
    };
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", {
      ...props,
      ...restProps
    });
  });
  var HIDDEN_OWNER_STYLES = {
    clipPath: "inset(50%)",
    position: "fixed",
    top: 0,
    left: 0
  };
  var PortalContext = /* @__PURE__ */ React6.createContext(null);
  var attr = /* @__PURE__ */ createAttribute("portal");
  function useFloatingPortalNode(props) {
    if (props === void 0) {
      props = {};
    }
    const {
      id,
      root
    } = props;
    const uniqueId = useId();
    const portalContext = usePortalContext();
    const [portalNode, setPortalNode] = React6.useState(null);
    const portalNodeRef = React6.useRef(null);
    index(() => {
      return () => {
        portalNode == null || portalNode.remove();
        queueMicrotask(() => {
          portalNodeRef.current = null;
        });
      };
    }, [portalNode]);
    index(() => {
      if (!uniqueId) return;
      if (portalNodeRef.current) return;
      const existingIdRoot = id ? document.getElementById(id) : null;
      if (!existingIdRoot) return;
      const subRoot = document.createElement("div");
      subRoot.id = uniqueId;
      subRoot.setAttribute(attr, "");
      existingIdRoot.appendChild(subRoot);
      portalNodeRef.current = subRoot;
      setPortalNode(subRoot);
    }, [id, uniqueId]);
    index(() => {
      if (root === null) return;
      if (!uniqueId) return;
      if (portalNodeRef.current) return;
      let container = root || (portalContext == null ? void 0 : portalContext.portalNode);
      if (container && !isNode(container)) container = container.current;
      container = container || document.body;
      let idWrapper = null;
      if (id) {
        idWrapper = document.createElement("div");
        idWrapper.id = id;
        container.appendChild(idWrapper);
      }
      const subRoot = document.createElement("div");
      subRoot.id = uniqueId;
      subRoot.setAttribute(attr, "");
      container = idWrapper || container;
      container.appendChild(subRoot);
      portalNodeRef.current = subRoot;
      setPortalNode(subRoot);
    }, [id, root, uniqueId, portalContext]);
    return portalNode;
  }
  function FloatingPortal(props) {
    const {
      children,
      id,
      root,
      preserveTabOrder = true
    } = props;
    const portalNode = useFloatingPortalNode({
      id,
      root
    });
    const [focusManagerState, setFocusManagerState] = React6.useState(null);
    const beforeOutsideRef = React6.useRef(null);
    const afterOutsideRef = React6.useRef(null);
    const beforeInsideRef = React6.useRef(null);
    const afterInsideRef = React6.useRef(null);
    const modal = focusManagerState == null ? void 0 : focusManagerState.modal;
    const open = focusManagerState == null ? void 0 : focusManagerState.open;
    const shouldRenderGuards = (
      // The FocusManager and therefore floating element are currently open/
      // rendered.
      !!focusManagerState && // Guards are only for non-modal focus management.
      !focusManagerState.modal && // Don't render if unmount is transitioning.
      focusManagerState.open && preserveTabOrder && !!(root || portalNode)
    );
    React6.useEffect(() => {
      if (!portalNode || !preserveTabOrder || modal) {
        return;
      }
      function onFocus(event) {
        if (portalNode && isOutsideEvent(event)) {
          const focusing = event.type === "focusin";
          const manageFocus = focusing ? enableFocusInside : disableFocusInside;
          manageFocus(portalNode);
        }
      }
      portalNode.addEventListener("focusin", onFocus, true);
      portalNode.addEventListener("focusout", onFocus, true);
      return () => {
        portalNode.removeEventListener("focusin", onFocus, true);
        portalNode.removeEventListener("focusout", onFocus, true);
      };
    }, [portalNode, preserveTabOrder, modal]);
    React6.useEffect(() => {
      if (!portalNode) return;
      if (open) return;
      enableFocusInside(portalNode);
    }, [open, portalNode]);
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(PortalContext.Provider, {
      value: React6.useMemo(() => ({
        preserveTabOrder,
        beforeOutsideRef,
        afterOutsideRef,
        beforeInsideRef,
        afterInsideRef,
        portalNode,
        setFocusManagerState
      }), [preserveTabOrder, portalNode]),
      children: [shouldRenderGuards && portalNode && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FocusGuard, {
        "data-type": "outside",
        ref: beforeOutsideRef,
        onFocus: (event) => {
          if (isOutsideEvent(event, portalNode)) {
            var _beforeInsideRef$curr;
            (_beforeInsideRef$curr = beforeInsideRef.current) == null || _beforeInsideRef$curr.focus();
          } else {
            const domReference = focusManagerState ? focusManagerState.domReference : null;
            const prevTabbable = getPreviousTabbable(domReference);
            prevTabbable == null || prevTabbable.focus();
          }
        }
      }), shouldRenderGuards && portalNode && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", {
        "aria-owns": portalNode.id,
        style: HIDDEN_OWNER_STYLES
      }), portalNode && /* @__PURE__ */ ReactDOM2.createPortal(children, portalNode), shouldRenderGuards && portalNode && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FocusGuard, {
        "data-type": "outside",
        ref: afterOutsideRef,
        onFocus: (event) => {
          if (isOutsideEvent(event, portalNode)) {
            var _afterInsideRef$curre;
            (_afterInsideRef$curre = afterInsideRef.current) == null || _afterInsideRef$curre.focus();
          } else {
            const domReference = focusManagerState ? focusManagerState.domReference : null;
            const nextTabbable = getNextTabbable(domReference);
            nextTabbable == null || nextTabbable.focus();
            (focusManagerState == null ? void 0 : focusManagerState.closeOnFocusOut) && (focusManagerState == null ? void 0 : focusManagerState.onOpenChange(false, event.nativeEvent, "focus-out"));
          }
        }
      })]
    });
  }
  var usePortalContext = () => React6.useContext(PortalContext);
  function isButtonTarget(event) {
    return isHTMLElement(event.target) && event.target.tagName === "BUTTON";
  }
  function isAnchorTarget(event) {
    return isHTMLElement(event.target) && event.target.tagName === "A";
  }
  function isSpaceIgnored(element) {
    return isTypeableElement(element);
  }
  function useClick(context, props) {
    if (props === void 0) {
      props = {};
    }
    const {
      open,
      onOpenChange,
      dataRef,
      elements: {
        domReference
      }
    } = context;
    const {
      enabled = true,
      event: eventOption = "click",
      toggle = true,
      ignoreMouse = false,
      keyboardHandlers = true,
      stickIfOpen = true
    } = props;
    const pointerTypeRef = React6.useRef();
    const didKeyDownRef = React6.useRef(false);
    const reference = React6.useMemo(() => ({
      onPointerDown(event) {
        pointerTypeRef.current = event.pointerType;
      },
      onMouseDown(event) {
        const pointerType = pointerTypeRef.current;
        if (event.button !== 0) return;
        if (eventOption === "click") return;
        if (isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
        if (open && toggle && (dataRef.current.openEvent && stickIfOpen ? dataRef.current.openEvent.type === "mousedown" : true)) {
          onOpenChange(false, event.nativeEvent, "click");
        } else {
          event.preventDefault();
          onOpenChange(true, event.nativeEvent, "click");
        }
      },
      onClick(event) {
        const pointerType = pointerTypeRef.current;
        if (eventOption === "mousedown" && pointerTypeRef.current) {
          pointerTypeRef.current = void 0;
          return;
        }
        if (isMouseLikePointerType(pointerType, true) && ignoreMouse) return;
        if (open && toggle && (dataRef.current.openEvent && stickIfOpen ? dataRef.current.openEvent.type === "click" : true)) {
          onOpenChange(false, event.nativeEvent, "click");
        } else {
          onOpenChange(true, event.nativeEvent, "click");
        }
      },
      onKeyDown(event) {
        pointerTypeRef.current = void 0;
        if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event)) {
          return;
        }
        if (event.key === " " && !isSpaceIgnored(domReference)) {
          event.preventDefault();
          didKeyDownRef.current = true;
        }
        if (isAnchorTarget(event)) {
          return;
        }
        if (event.key === "Enter") {
          if (open && toggle) {
            onOpenChange(false, event.nativeEvent, "click");
          } else {
            onOpenChange(true, event.nativeEvent, "click");
          }
        }
      },
      onKeyUp(event) {
        if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event) || isSpaceIgnored(domReference)) {
          return;
        }
        if (event.key === " " && didKeyDownRef.current) {
          didKeyDownRef.current = false;
          if (open && toggle) {
            onOpenChange(false, event.nativeEvent, "click");
          } else {
            onOpenChange(true, event.nativeEvent, "click");
          }
        }
      }
    }), [dataRef, domReference, eventOption, ignoreMouse, keyboardHandlers, onOpenChange, open, stickIfOpen, toggle]);
    return React6.useMemo(() => enabled ? {
      reference
    } : {}, [enabled, reference]);
  }
  var bubbleHandlerKeys = {
    pointerdown: "onPointerDown",
    mousedown: "onMouseDown",
    click: "onClick"
  };
  var captureHandlerKeys = {
    pointerdown: "onPointerDownCapture",
    mousedown: "onMouseDownCapture",
    click: "onClickCapture"
  };
  var normalizeProp = (normalizable) => {
    var _normalizable$escapeK, _normalizable$outside;
    return {
      escapeKey: typeof normalizable === "boolean" ? normalizable : (_normalizable$escapeK = normalizable == null ? void 0 : normalizable.escapeKey) != null ? _normalizable$escapeK : false,
      outsidePress: typeof normalizable === "boolean" ? normalizable : (_normalizable$outside = normalizable == null ? void 0 : normalizable.outsidePress) != null ? _normalizable$outside : true
    };
  };
  function useDismiss(context, props) {
    if (props === void 0) {
      props = {};
    }
    const {
      open,
      onOpenChange,
      elements,
      dataRef
    } = context;
    const {
      enabled = true,
      escapeKey = true,
      outsidePress: unstable_outsidePress = true,
      outsidePressEvent = "pointerdown",
      referencePress = false,
      referencePressEvent = "pointerdown",
      ancestorScroll = false,
      bubbles,
      capture
    } = props;
    const tree = useFloatingTree();
    const outsidePressFn = useEffectEvent(typeof unstable_outsidePress === "function" ? unstable_outsidePress : () => false);
    const outsidePress = typeof unstable_outsidePress === "function" ? outsidePressFn : unstable_outsidePress;
    const endedOrStartedInsideRef = React6.useRef(false);
    const {
      escapeKey: escapeKeyBubbles,
      outsidePress: outsidePressBubbles
    } = normalizeProp(bubbles);
    const {
      escapeKey: escapeKeyCapture,
      outsidePress: outsidePressCapture
    } = normalizeProp(capture);
    const isComposingRef = React6.useRef(false);
    const closeOnEscapeKeyDown = useEffectEvent((event) => {
      var _dataRef$current$floa;
      if (!open || !enabled || !escapeKey || event.key !== "Escape") {
        return;
      }
      if (isComposingRef.current) {
        return;
      }
      const nodeId = (_dataRef$current$floa = dataRef.current.floatingContext) == null ? void 0 : _dataRef$current$floa.nodeId;
      const children = tree ? getNodeChildren(tree.nodesRef.current, nodeId) : [];
      if (!escapeKeyBubbles) {
        event.stopPropagation();
        if (children.length > 0) {
          let shouldDismiss = true;
          children.forEach((child) => {
            var _child$context;
            if ((_child$context = child.context) != null && _child$context.open && !child.context.dataRef.current.__escapeKeyBubbles) {
              shouldDismiss = false;
              return;
            }
          });
          if (!shouldDismiss) {
            return;
          }
        }
      }
      onOpenChange(false, isReactEvent(event) ? event.nativeEvent : event, "escape-key");
    });
    const closeOnEscapeKeyDownCapture = useEffectEvent((event) => {
      var _getTarget2;
      const callback = () => {
        var _getTarget;
        closeOnEscapeKeyDown(event);
        (_getTarget = getTarget(event)) == null || _getTarget.removeEventListener("keydown", callback);
      };
      (_getTarget2 = getTarget(event)) == null || _getTarget2.addEventListener("keydown", callback);
    });
    const closeOnPressOutside = useEffectEvent((event) => {
      var _dataRef$current$floa2;
      const insideReactTree = dataRef.current.insideReactTree;
      dataRef.current.insideReactTree = false;
      const endedOrStartedInside = endedOrStartedInsideRef.current;
      endedOrStartedInsideRef.current = false;
      if (outsidePressEvent === "click" && endedOrStartedInside) {
        return;
      }
      if (insideReactTree) {
        return;
      }
      if (typeof outsidePress === "function" && !outsidePress(event)) {
        return;
      }
      const target = getTarget(event);
      const inertSelector = "[" + createAttribute("inert") + "]";
      const markers = getDocument(elements.floating).querySelectorAll(inertSelector);
      let targetRootAncestor = isElement(target) ? target : null;
      while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
        const nextParent = getParentNode(targetRootAncestor);
        if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
          break;
        }
        targetRootAncestor = nextParent;
      }
      if (markers.length && isElement(target) && !isRootElement(target) && // Clicked on a direct ancestor (e.g. FloatingOverlay).
      !contains(target, elements.floating) && // If the target root element contains none of the markers, then the
      // element was injected after the floating element rendered.
      Array.from(markers).every((marker) => !contains(targetRootAncestor, marker))) {
        return;
      }
      if (isHTMLElement(target) && floating) {
        const lastTraversableNode = isLastTraversableNode(target);
        const style = getComputedStyle2(target);
        const scrollRe = /auto|scroll/;
        const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
        const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);
        const canScrollX = isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
        const canScrollY = isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;
        const isRTL2 = style.direction === "rtl";
        const pressedVerticalScrollbar = canScrollY && (isRTL2 ? event.offsetX <= target.offsetWidth - target.clientWidth : event.offsetX > target.clientWidth);
        const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;
        if (pressedVerticalScrollbar || pressedHorizontalScrollbar) {
          return;
        }
      }
      const nodeId = (_dataRef$current$floa2 = dataRef.current.floatingContext) == null ? void 0 : _dataRef$current$floa2.nodeId;
      const targetIsInsideChildren = tree && getNodeChildren(tree.nodesRef.current, nodeId).some((node) => {
        var _node$context;
        return isEventTargetWithin(event, (_node$context = node.context) == null ? void 0 : _node$context.elements.floating);
      });
      if (isEventTargetWithin(event, elements.floating) || isEventTargetWithin(event, elements.domReference) || targetIsInsideChildren) {
        return;
      }
      const children = tree ? getNodeChildren(tree.nodesRef.current, nodeId) : [];
      if (children.length > 0) {
        let shouldDismiss = true;
        children.forEach((child) => {
          var _child$context2;
          if ((_child$context2 = child.context) != null && _child$context2.open && !child.context.dataRef.current.__outsidePressBubbles) {
            shouldDismiss = false;
            return;
          }
        });
        if (!shouldDismiss) {
          return;
        }
      }
      onOpenChange(false, event, "outside-press");
    });
    const closeOnPressOutsideCapture = useEffectEvent((event) => {
      var _getTarget4;
      const callback = () => {
        var _getTarget3;
        closeOnPressOutside(event);
        (_getTarget3 = getTarget(event)) == null || _getTarget3.removeEventListener(outsidePressEvent, callback);
      };
      (_getTarget4 = getTarget(event)) == null || _getTarget4.addEventListener(outsidePressEvent, callback);
    });
    React6.useEffect(() => {
      if (!open || !enabled) {
        return;
      }
      dataRef.current.__escapeKeyBubbles = escapeKeyBubbles;
      dataRef.current.__outsidePressBubbles = outsidePressBubbles;
      let compositionTimeout = -1;
      function onScroll(event) {
        onOpenChange(false, event, "ancestor-scroll");
      }
      function handleCompositionStart() {
        window.clearTimeout(compositionTimeout);
        isComposingRef.current = true;
      }
      function handleCompositionEnd() {
        compositionTimeout = window.setTimeout(
          () => {
            isComposingRef.current = false;
          },
          // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
          // Only apply to WebKit for the test to remain 0ms.
          isWebKit() ? 5 : 0
        );
      }
      const doc = getDocument(elements.floating);
      if (escapeKey) {
        doc.addEventListener("keydown", escapeKeyCapture ? closeOnEscapeKeyDownCapture : closeOnEscapeKeyDown, escapeKeyCapture);
        doc.addEventListener("compositionstart", handleCompositionStart);
        doc.addEventListener("compositionend", handleCompositionEnd);
      }
      outsidePress && doc.addEventListener(outsidePressEvent, outsidePressCapture ? closeOnPressOutsideCapture : closeOnPressOutside, outsidePressCapture);
      let ancestors = [];
      if (ancestorScroll) {
        if (isElement(elements.domReference)) {
          ancestors = getOverflowAncestors(elements.domReference);
        }
        if (isElement(elements.floating)) {
          ancestors = ancestors.concat(getOverflowAncestors(elements.floating));
        }
        if (!isElement(elements.reference) && elements.reference && elements.reference.contextElement) {
          ancestors = ancestors.concat(getOverflowAncestors(elements.reference.contextElement));
        }
      }
      ancestors = ancestors.filter((ancestor) => {
        var _doc$defaultView;
        return ancestor !== ((_doc$defaultView = doc.defaultView) == null ? void 0 : _doc$defaultView.visualViewport);
      });
      ancestors.forEach((ancestor) => {
        ancestor.addEventListener("scroll", onScroll);
      });
      return () => {
        if (escapeKey) {
          doc.removeEventListener("keydown", escapeKeyCapture ? closeOnEscapeKeyDownCapture : closeOnEscapeKeyDown, escapeKeyCapture);
          doc.removeEventListener("compositionstart", handleCompositionStart);
          doc.removeEventListener("compositionend", handleCompositionEnd);
        }
        outsidePress && doc.removeEventListener(outsidePressEvent, outsidePressCapture ? closeOnPressOutsideCapture : closeOnPressOutside, outsidePressCapture);
        ancestors.forEach((ancestor) => {
          ancestor.removeEventListener("scroll", onScroll);
        });
        window.clearTimeout(compositionTimeout);
      };
    }, [dataRef, elements, escapeKey, outsidePress, outsidePressEvent, open, onOpenChange, ancestorScroll, enabled, escapeKeyBubbles, outsidePressBubbles, closeOnEscapeKeyDown, escapeKeyCapture, closeOnEscapeKeyDownCapture, closeOnPressOutside, outsidePressCapture, closeOnPressOutsideCapture]);
    React6.useEffect(() => {
      dataRef.current.insideReactTree = false;
    }, [dataRef, outsidePress, outsidePressEvent]);
    const reference = React6.useMemo(() => ({
      onKeyDown: closeOnEscapeKeyDown,
      ...referencePress && {
        [bubbleHandlerKeys[referencePressEvent]]: (event) => {
          onOpenChange(false, event.nativeEvent, "reference-press");
        },
        ...referencePressEvent !== "click" && {
          onClick(event) {
            onOpenChange(false, event.nativeEvent, "reference-press");
          }
        }
      }
    }), [closeOnEscapeKeyDown, onOpenChange, referencePress, referencePressEvent]);
    const floating = React6.useMemo(() => {
      function setMouseDownOrUpInside(event) {
        if (event.button !== 0) {
          return;
        }
        endedOrStartedInsideRef.current = true;
      }
      return {
        onKeyDown: closeOnEscapeKeyDown,
        onMouseDown: setMouseDownOrUpInside,
        onMouseUp: setMouseDownOrUpInside,
        [captureHandlerKeys[outsidePressEvent]]: () => {
          dataRef.current.insideReactTree = true;
        }
      };
    }, [closeOnEscapeKeyDown, outsidePressEvent, dataRef]);
    return React6.useMemo(() => enabled ? {
      reference,
      floating
    } : {}, [enabled, reference, floating]);
  }
  function useFloatingRootContext(options) {
    const {
      open = false,
      onOpenChange: onOpenChangeProp,
      elements: elementsProp
    } = options;
    const floatingId = useId();
    const dataRef = React6.useRef({});
    const [events] = React6.useState(() => createEventEmitter());
    const nested = useFloatingParentNodeId() != null;
    if (true) {
      const optionDomReference = elementsProp.reference;
      if (optionDomReference && !isElement(optionDomReference)) {
        error("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
      }
    }
    const [positionReference, setPositionReference] = React6.useState(elementsProp.reference);
    const onOpenChange = useEffectEvent((open2, event, reason) => {
      dataRef.current.openEvent = open2 ? event : void 0;
      events.emit("openchange", {
        open: open2,
        event,
        reason,
        nested
      });
      onOpenChangeProp == null || onOpenChangeProp(open2, event, reason);
    });
    const refs = React6.useMemo(() => ({
      setPositionReference
    }), []);
    const elements = React6.useMemo(() => ({
      reference: positionReference || elementsProp.reference || null,
      floating: elementsProp.floating || null,
      domReference: elementsProp.reference
    }), [positionReference, elementsProp.reference, elementsProp.floating]);
    return React6.useMemo(() => ({
      dataRef,
      open,
      onOpenChange,
      elements,
      events,
      floatingId,
      refs
    }), [open, onOpenChange, elements, events, floatingId, refs]);
  }
  function useFloating2(_temp) {
    var _elementsOption$refer, _elementsOption$float;
    let {
      elements: elementsOption,
      ...options
    } = _temp === void 0 ? {} : _temp;
    const {
      nodeId
    } = options;
    const internalRootContext = useFloatingRootContext({
      ...options,
      elements: {
        reference: (_elementsOption$refer = elementsOption == null ? void 0 : elementsOption.reference) != null ? _elementsOption$refer : null,
        floating: (_elementsOption$float = elementsOption == null ? void 0 : elementsOption.floating) != null ? _elementsOption$float : null
      }
    });
    const rootContext = options.rootContext || internalRootContext;
    const computedElements = rootContext.elements;
    const [_domReference, setDomReference] = React6.useState(null);
    const [positionReference, _setPositionReference] = React6.useState(null);
    const optionDomReference = computedElements == null ? void 0 : computedElements.domReference;
    const domReference = optionDomReference || _domReference;
    const domReferenceRef = React6.useRef(null);
    const tree = useFloatingTree();
    index(() => {
      if (domReference) {
        domReferenceRef.current = domReference;
      }
    }, [domReference]);
    const position = useFloating({
      ...options,
      elements: {
        ...computedElements,
        ...positionReference && {
          reference: positionReference
        }
      }
    });
    const setPositionReference = React6.useCallback((node) => {
      const computedPositionReference = isElement(node) ? {
        getBoundingClientRect: () => node.getBoundingClientRect(),
        getClientRects: () => node.getClientRects(),
        contextElement: node
      } : node;
      _setPositionReference(computedPositionReference);
      position.refs.setReference(computedPositionReference);
    }, [position.refs]);
    const setReference = React6.useCallback((node) => {
      if (isElement(node) || node === null) {
        domReferenceRef.current = node;
        setDomReference(node);
      }
      if (isElement(position.refs.reference.current) || position.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      node !== null && !isElement(node)) {
        position.refs.setReference(node);
      }
    }, [position.refs]);
    const refs = React6.useMemo(() => ({
      ...position.refs,
      setReference,
      setPositionReference,
      domReference: domReferenceRef
    }), [position.refs, setReference, setPositionReference]);
    const elements = React6.useMemo(() => ({
      ...position.elements,
      domReference
    }), [position.elements, domReference]);
    const context = React6.useMemo(() => ({
      ...position,
      ...rootContext,
      refs,
      elements,
      nodeId
    }), [position, refs, elements, nodeId, rootContext]);
    index(() => {
      rootContext.dataRef.current.floatingContext = context;
      const node = tree == null ? void 0 : tree.nodesRef.current.find((node2) => node2.id === nodeId);
      if (node) {
        node.context = context;
      }
    });
    return React6.useMemo(() => ({
      ...position,
      context,
      refs,
      elements
    }), [position, refs, elements, context]);
  }
  function isMacSafari() {
    return isMac() && isSafari();
  }
  function useFocus(context, props) {
    if (props === void 0) {
      props = {};
    }
    const {
      open,
      onOpenChange,
      events,
      dataRef,
      elements
    } = context;
    const {
      enabled = true,
      visibleOnly = true
    } = props;
    const blockFocusRef = React6.useRef(false);
    const timeoutRef = React6.useRef(-1);
    const keyboardModalityRef = React6.useRef(true);
    React6.useEffect(() => {
      if (!enabled) return;
      const win = getWindow(elements.domReference);
      function onBlur() {
        if (!open && isHTMLElement(elements.domReference) && elements.domReference === activeElement(getDocument(elements.domReference))) {
          blockFocusRef.current = true;
        }
      }
      function onKeyDown() {
        keyboardModalityRef.current = true;
      }
      function onPointerDown() {
        keyboardModalityRef.current = false;
      }
      win.addEventListener("blur", onBlur);
      if (isMacSafari()) {
        win.addEventListener("keydown", onKeyDown, true);
        win.addEventListener("pointerdown", onPointerDown, true);
      }
      return () => {
        win.removeEventListener("blur", onBlur);
        if (isMacSafari()) {
          win.removeEventListener("keydown", onKeyDown, true);
          win.removeEventListener("pointerdown", onPointerDown, true);
        }
      };
    }, [elements.domReference, open, enabled]);
    React6.useEffect(() => {
      if (!enabled) return;
      function onOpenChange2(_ref) {
        let {
          reason
        } = _ref;
        if (reason === "reference-press" || reason === "escape-key") {
          blockFocusRef.current = true;
        }
      }
      events.on("openchange", onOpenChange2);
      return () => {
        events.off("openchange", onOpenChange2);
      };
    }, [events, enabled]);
    React6.useEffect(() => {
      return () => {
        clearTimeoutIfSet(timeoutRef);
      };
    }, []);
    const reference = React6.useMemo(() => ({
      onMouseLeave() {
        blockFocusRef.current = false;
      },
      onFocus(event) {
        if (blockFocusRef.current) return;
        const target = getTarget(event.nativeEvent);
        if (visibleOnly && isElement(target)) {
          if (isMacSafari() && !event.relatedTarget) {
            if (!keyboardModalityRef.current && !isTypeableElement(target)) {
              return;
            }
          } else if (!matchesFocusVisible(target)) {
            return;
          }
        }
        onOpenChange(true, event.nativeEvent, "focus");
      },
      onBlur(event) {
        blockFocusRef.current = false;
        const relatedTarget = event.relatedTarget;
        const nativeEvent = event.nativeEvent;
        const movedToFocusGuard = isElement(relatedTarget) && relatedTarget.hasAttribute(createAttribute("focus-guard")) && relatedTarget.getAttribute("data-type") === "outside";
        timeoutRef.current = window.setTimeout(() => {
          var _dataRef$current$floa;
          const activeEl = activeElement(elements.domReference ? elements.domReference.ownerDocument : document);
          if (!relatedTarget && activeEl === elements.domReference) return;
          if (contains((_dataRef$current$floa = dataRef.current.floatingContext) == null ? void 0 : _dataRef$current$floa.refs.floating.current, activeEl) || contains(elements.domReference, activeEl) || movedToFocusGuard) {
            return;
          }
          onOpenChange(false, nativeEvent, "focus");
        });
      }
    }), [dataRef, elements.domReference, onOpenChange, visibleOnly]);
    return React6.useMemo(() => enabled ? {
      reference
    } : {}, [enabled, reference]);
  }
  function mergeProps(userProps, propsList, elementKey) {
    const map = /* @__PURE__ */ new Map();
    const isItem = elementKey === "item";
    let domUserProps = userProps;
    if (isItem && userProps) {
      const {
        [ACTIVE_KEY]: _,
        [SELECTED_KEY]: __,
        ...validProps
      } = userProps;
      domUserProps = validProps;
    }
    return {
      ...elementKey === "floating" && {
        tabIndex: -1,
        [FOCUSABLE_ATTRIBUTE2]: ""
      },
      ...domUserProps,
      ...propsList.map((value) => {
        const propsOrGetProps = value ? value[elementKey] : null;
        if (typeof propsOrGetProps === "function") {
          return userProps ? propsOrGetProps(userProps) : null;
        }
        return propsOrGetProps;
      }).concat(userProps).reduce((acc, props) => {
        if (!props) {
          return acc;
        }
        Object.entries(props).forEach((_ref) => {
          let [key, value] = _ref;
          if (isItem && [ACTIVE_KEY, SELECTED_KEY].includes(key)) {
            return;
          }
          if (key.indexOf("on") === 0) {
            if (!map.has(key)) {
              map.set(key, []);
            }
            if (typeof value === "function") {
              var _map$get;
              (_map$get = map.get(key)) == null || _map$get.push(value);
              acc[key] = function() {
                var _map$get2;
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }
                return (_map$get2 = map.get(key)) == null ? void 0 : _map$get2.map((fn) => fn(...args)).find((val) => val !== void 0);
              };
            }
          } else {
            acc[key] = value;
          }
        });
        return acc;
      }, {})
    };
  }
  function useInteractions(propsList) {
    if (propsList === void 0) {
      propsList = [];
    }
    const referenceDeps = propsList.map((key) => key == null ? void 0 : key.reference);
    const floatingDeps = propsList.map((key) => key == null ? void 0 : key.floating);
    const itemDeps = propsList.map((key) => key == null ? void 0 : key.item);
    const getReferenceProps = React6.useCallback(
      (userProps) => mergeProps(userProps, propsList, "reference"),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      referenceDeps
    );
    const getFloatingProps = React6.useCallback(
      (userProps) => mergeProps(userProps, propsList, "floating"),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      floatingDeps
    );
    const getItemProps = React6.useCallback(
      (userProps) => mergeProps(userProps, propsList, "item"),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      itemDeps
    );
    return React6.useMemo(() => ({
      getReferenceProps,
      getFloatingProps,
      getItemProps
    }), [getReferenceProps, getFloatingProps, getItemProps]);
  }
  var componentRoleToAriaRoleMap = /* @__PURE__ */ new Map([["select", "listbox"], ["combobox", "listbox"], ["label", false]]);
  function useRole(context, props) {
    var _elements$domReferenc, _componentRoleToAriaR;
    if (props === void 0) {
      props = {};
    }
    const {
      open,
      elements,
      floatingId: defaultFloatingId
    } = context;
    const {
      enabled = true,
      role = "dialog"
    } = props;
    const defaultReferenceId = useId();
    const referenceId = ((_elements$domReferenc = elements.domReference) == null ? void 0 : _elements$domReferenc.id) || defaultReferenceId;
    const floatingId = React6.useMemo(() => {
      var _getFloatingFocusElem;
      return ((_getFloatingFocusElem = getFloatingFocusElement(elements.floating)) == null ? void 0 : _getFloatingFocusElem.id) || defaultFloatingId;
    }, [elements.floating, defaultFloatingId]);
    const ariaRole = (_componentRoleToAriaR = componentRoleToAriaRoleMap.get(role)) != null ? _componentRoleToAriaR : role;
    const parentId = useFloatingParentNodeId();
    const isNested = parentId != null;
    const reference = React6.useMemo(() => {
      if (ariaRole === "tooltip" || role === "label") {
        return {
          ["aria-" + (role === "label" ? "labelledby" : "describedby")]: open ? floatingId : void 0
        };
      }
      return {
        "aria-expanded": open ? "true" : "false",
        "aria-haspopup": ariaRole === "alertdialog" ? "dialog" : ariaRole,
        "aria-controls": open ? floatingId : void 0,
        ...ariaRole === "listbox" && {
          role: "combobox"
        },
        ...ariaRole === "menu" && {
          id: referenceId
        },
        ...ariaRole === "menu" && isNested && {
          role: "menuitem"
        },
        ...role === "select" && {
          "aria-autocomplete": "none"
        },
        ...role === "combobox" && {
          "aria-autocomplete": "list"
        }
      };
    }, [ariaRole, floatingId, isNested, open, referenceId, role]);
    const floating = React6.useMemo(() => {
      const floatingProps = {
        id: floatingId,
        ...ariaRole && {
          role: ariaRole
        }
      };
      if (ariaRole === "tooltip" || role === "label") {
        return floatingProps;
      }
      return {
        ...floatingProps,
        ...ariaRole === "menu" && {
          "aria-labelledby": referenceId
        }
      };
    }, [ariaRole, floatingId, referenceId, role]);
    const item = React6.useCallback((_ref) => {
      let {
        active,
        selected
      } = _ref;
      const commonProps = {
        role: "option",
        ...active && {
          id: floatingId + "-fui-option"
        }
      };
      switch (role) {
        case "select":
        case "combobox":
          return {
            ...commonProps,
            "aria-selected": selected
          };
      }
      return {};
    }, [floatingId, role]);
    return React6.useMemo(() => enabled ? {
      reference,
      floating,
      item
    } : {}, [enabled, reference, floating, item]);
  }

  // src/client/components/FloatingMenu.tsx
  var import_jsx_runtime8 = __require("react/jsx-runtime");
  function FloatingMenu({ label, summary, className, detailsRef, children }) {
    const [open, setOpen] = (0, import_react7.useState)(false);
    const internalRef = (0, import_react7.useRef)(null);
    const menu = detailsRef || internalRef;
    const { refs, context, floatingStyles, isPositioned } = useFloating2({
      open,
      placement: "bottom-start",
      whileElementsMounted: autoUpdate,
      onOpenChange(next, event, reason) {
        if (menu.current) menu.current.open = next;
        setOpen(next);
        if (!next && reason === "escape-key") {
          event?.preventDefault();
          refs.domReference.current?.focus();
        }
      },
      middleware: [offset3(8), flip3({ padding: 12 }), shift3({ padding: 12 }), size3({ padding: 12, apply({ availableWidth, availableHeight, elements }) {
        Object.assign(elements.floating.style, { maxWidth: `${Math.max(0, availableWidth)}px`, maxHeight: `${Math.max(0, Math.min(300, availableHeight))}px` });
      } })]
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context, { bubbles: false })]);
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("details", { ref: menu, className: `iad-floating-menu ${className}`, onToggle: (event) => setOpen(event.currentTarget.open), children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("summary", { ref: refs.setReference, "aria-label": label, ...getReferenceProps(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: summary }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "m6 9 6 6 6-6" }) })
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { ref: refs.setFloating, ...getFloatingProps(), className: "iad-floating-menu-panel", style: { ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }, children })
    ] });
  }

  // src/client/components/Pagination.tsx
  var import_jsx_runtime9 = __require("react/jsx-runtime");
  var pageSize = 24;
  function Pagination({ total, page, unit, onPage, size: size4 = pageSize }) {
    if (!total) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "iad-pagination", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
        total,
        " ",
        unit
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { disabled: page <= 1, onClick: () => onPage(page - 1), children: "\u4E0A\u4E00\u9875" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
        page,
        " / ",
        Math.max(1, Math.ceil(total / size4))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { disabled: page * size4 >= total, onClick: () => onPage(page + 1), children: "\u4E0B\u4E00\u9875" })
    ] });
  }

  // src/client/useUnsavedChanges.ts
  var import_react10 = __require("react");

  // src/client/workspace.tsx
  var import_react9 = __require("react");

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

  // src/shared/knowledge-presentation.ts
  var knowledgeStatuses = {
    supported: "\u6709\u8BC1\u636E\u652F\u6301",
    provisional: "\u5F85\u9A8C\u8BC1",
    conflicted: "\u5B58\u5728\u77DB\u76FE"
  };

  // src/client/workspace.tsx
  var defaultView = (page) => ({ datasetSettingsTab: "directories", checkId: "", explorationVersion: "", explorationNormalCount: "10", explorationDefectCount: "10", explorationNormalImages: [], explorationDefectImages: [], explorationObjective: "", miningSourceMode: "uncovered", scopeRunId: "", scopeSessionId: "", miningContinuous: false, conflictId: "", miningCount: "10", miningImages: [], miningPreset: "", miningSearch: "", miningPage: 1, filters: { ...page === "industrial-review" ? initialReviewFilters : initialFilters }, page: 1, selected: "", tab: "results", version: "", normalVersion: "", defectVersion: "", job: "", historyPage: 1, historySearch: "", historySampleId: "", knowledgeSearch: "", knowledgeStatus: "", inspection: null });
  var Workspace = class {
    constructor(conversation) {
      this.conversation = conversation;
    }
    conversation;
    state = { knowledgeKind: "normal", active: false, pageId: "industrial-datasets", datasetId: "", views: {} };
    listeners = /* @__PURE__ */ new Set();
    leaveGuards = /* @__PURE__ */ new Set();
    registerLeaveGuard(guard) {
      this.leaveGuards.add(guard);
      return () => {
        this.leaveGuards.delete(guard);
      };
    }
    canLeave() {
      return [...this.leaveGuards].every((guard) => guard());
    }
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
    view(page, kind = this.state.knowledgeKind) {
      return { ...this.defaults[page], ...this.state.views[this.viewKey(page, this.state.datasetId, kind)] };
    }
    viewKey(page, datasetId, kind) {
      return `${page}:${datasetId}${page === "industrial-knowledge" ? `:${kind}` : ""}`;
    }
    selectKnowledgeKind(knowledgeKind) {
      if (knowledgeKind === this.state.knowledgeKind) return;
      if (!this.canLeave()) return;
      this.state = { ...this.state, knowledgeKind };
      this.commit();
    }
    connect(layout) {
      this.layout = layout;
      this.restore();
      const unsubscribe = layout.panelInfo.subscribe(() => {
        const id = layout.panelInfo.getSnapshot().activePanelId;
        if (id && id in pages) {
          if (!this.state.active || id !== this.state.pageId) this.navigate(id);
        } else if (this.state.active) {
          if (!this.canLeave()) {
            this.layout?.selectPanel(this.state.pageId);
            return;
          }
          this.state = { ...this.state, active: false };
          this.commit();
        }
      });
      const restore = () => {
        if (this.canLeave()) this.restore(true);
        else this.commit(true);
      };
      window.addEventListener("popstate", restore);
      return () => {
        unsubscribe();
        window.removeEventListener("popstate", restore);
        this.layout = void 0;
      };
    }
    navigate(pageId, selected) {
      if (pageId !== this.state.pageId && !this.canLeave()) {
        this.layout?.selectPanel(this.state.pageId);
        return;
      }
      this.state = { ...this.state, active: true, pageId };
      if (selected !== void 0) this.state = { ...this.state, views: { ...this.state.views, [this.viewKey(pageId, this.state.datasetId, this.state.knowledgeKind)]: { ...this.view(pageId), selected, tab: "results" } } };
      this.commit();
      this.layout?.selectPanel(pageId);
    }
    openLocation({ pageId, datasetId, knowledgeKind = this.state.knowledgeKind, ...view }) {
      if (!this.canLeave()) return;
      this.state = { ...this.state, active: true, pageId, datasetId, knowledgeKind };
      this.state = { ...this.state, views: { ...this.state.views, [this.viewKey(pageId, datasetId, knowledgeKind)]: { ...this.view(pageId), ...view, inspection: null } } };
      this.commit();
      this.layout?.selectPanel(pageId);
    }
    selectDataset(datasetId, replace = false) {
      if (datasetId === this.state.datasetId) return;
      if (!this.canLeave()) return;
      this.state = { ...this.state, datasetId };
      this.commit(replace);
    }
    updateView(page, patch, replace = false) {
      if (patch.tab && patch.tab !== this.view(page).tab && !this.canLeave()) return;
      this.state = { ...this.state, views: { ...this.state.views, [this.viewKey(page, this.state.datasetId, this.state.knowledgeKind)]: { ...this.view(page), ...patch } } };
      this.commit(replace);
    }
    async ask(reference, selection, transform, question) {
      const { pageId, datasetId, knowledgeKind } = this.state;
      const view = this.view(pageId);
      const snapshot = await request("/inspection/context", reference);
      if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id) throw new Error("\u68C0\u89C6\u4F4D\u7F6E\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u56FE\u50CF\u91CD\u65B0\u8FFD\u95EE");
      await this.conversation.inspect(snapshot, question, (sessionId) => {
        if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id) throw new Error("\u68C0\u89C6\u4F4D\u7F6E\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u56FE\u50CF\u91CD\u65B0\u8FFD\u95EE");
        this.updateView(pageId, { inspection: { reference, selection, transform, sessionId } }, true);
        const route = new URLSearchParams({ iad: JSON.stringify({ pageId, datasetId, knowledgeKind, ...this.view(pageId) }) });
        return `${location.origin}${location.pathname}?${route}`;
      }, view.inspection?.reference.sample_id === reference.sample_id ? view.inspection.sessionId : void 0);
    }
    async mineScope(scopeRunId, imageCount, images) {
      const { datasetId, knowledgeKind } = this.state;
      const pageId = "industrial-knowledge", view = this.view(pageId);
      await this.conversation.mine(scopeRunId, knowledgeKind, imageCount, images, (sessionId) => {
        if (this.state.datasetId !== datasetId || this.state.knowledgeKind !== knowledgeKind) throw new Error("\u6570\u636E\u96C6\u6216\u77E5\u8BC6\u7C7B\u578B\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u8303\u56F4\u91CD\u65B0\u53D1\u8D77");
        this.updateView(pageId, { scopeRunId, scopeSessionId: sessionId });
        return `${location.origin}${location.pathname}?${new URLSearchParams({ iad: JSON.stringify({ pageId, datasetId, knowledgeKind, ...this.view(pageId) }) })}`;
      }, view.scopeSessionId || void 0);
    }
    openSession(sessionId) {
      return this.conversation.open(sessionId);
    }
    commit(replace = false) {
      const { pageId, datasetId, knowledgeKind } = this.state;
      const url = new URL(location.href);
      if (this.state.active) url.searchParams.set("iad", JSON.stringify({ pageId, datasetId, knowledgeKind, ...this.view(pageId) }));
      else url.searchParams.delete("iad");
      history[replace ? "replaceState" : "pushState"](history.state, "", url);
      sessionStorage.setItem("iad.workspace", JSON.stringify(this.state));
      this.listeners.forEach((listener) => listener());
    }
    restore(fromHistory = false) {
      const raw = new URL(location.href).searchParams.get("iad");
      try {
        const saved = JSON.parse(sessionStorage.getItem("iad.workspace") || "null");
        if (!fromHistory && saved?.pageId in pages && typeof saved.datasetId === "string" && typeof saved.active === "boolean") {
          this.state = { ...saved, knowledgeKind: saved.knowledgeKind === "defect" ? "defect" : "normal", views: Object.fromEntries(Object.entries(saved.views || {}).map(([key, value]) => {
            const view = value;
            return [key, { ...view, filters: { ...initialFilters, ...view.filters } }];
          })) };
        }
        if (fromHistory) this.state = { ...this.state, active: false };
        if (raw) {
          const route = JSON.parse(raw);
          if (route.pageId in pages && typeof route.datasetId === "string") {
            const knowledgeKind = route.knowledgeKind === "defect" ? "defect" : "normal";
            const view = defaultView(route.pageId);
            for (const key of ["checkId", "explorationVersion", "explorationNormalCount", "explorationDefectCount", "explorationObjective", "selected", "scopeRunId", "scopeSessionId", "conflictId", "tab", "version", "miningCount", "miningPreset", "miningSearch", "normalVersion", "defectVersion", "job", "historySearch", "historySampleId", "knowledgeSearch"]) if (typeof route[key] === "string") view[key] = route[key];
            if (route.datasetSettingsTab === "directories" || route.datasetSettingsTab === "basic") view.datasetSettingsTab = route.datasetSettingsTab;
            if (["uncovered", "all", "recheck"].includes(route.miningSourceMode)) view.miningSourceMode = route.miningSourceMode;
            if (typeof route.miningContinuous === "boolean") view.miningContinuous = route.miningContinuous;
            if (typeof route.knowledgeStatus === "string" && (route.knowledgeStatus === "" || Object.hasOwn(knowledgeStatuses, route.knowledgeStatus))) view.knowledgeStatus = route.knowledgeStatus;
            if (Number.isInteger(route.miningPage) && route.miningPage > 0) view.miningPage = route.miningPage;
            for (const key of ["miningImages", "explorationNormalImages", "explorationDefectImages"])
              if (Array.isArray(route[key]) && route[key].every((id) => typeof id === "string")) view[key] = route[key];
            view.inspection = restoreInspection(route.inspection, route.datasetId, view.selected);
            if (Number.isInteger(route.page) && route.page > 0) view.page = route.page;
            if (Number.isInteger(route.historyPage) && route.historyPage > 0) view.historyPage = route.historyPage;
            if (route.filters) {
              for (const key of ["search", "model_status", "review_status", "technical", "sort_by", "reference_status"]) if (typeof route.filters[key] === "string") view.filters = { ...view.filters, [key]: route.filters[key] };
              if (Array.isArray(route.filters.raw_label_filters) && route.filters.raw_label_filters.every((item) => typeof item === "string")) view.filters.raw_label_filters = route.filters.raw_label_filters;
              if (Array.isArray(route.filters.annotation_filters) && route.filters.annotation_filters.every((item) => typeof item === "string")) view.filters.annotation_filters = route.filters.annotation_filters;
            }
            this.state = { ...this.state, active: true, pageId: route.pageId, datasetId: route.datasetId, knowledgeKind, views: { ...this.state.views, [this.viewKey(route.pageId, route.datasetId, knowledgeKind)]: view } };
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
  var WorkspaceContext = (0, import_react9.createContext)(null);
  function useWorkspace() {
    const workspace = (0, import_react9.useContext)(WorkspaceContext);
    if (!workspace) throw new Error("Workbench requires its workspace owner");
    const state = (0, import_react9.useSyncExternalStore)(workspace.subscribe, workspace.getSnapshot);
    return { workspace, state };
  }

  // src/client/useUnsavedChanges.ts
  function useUnsavedChanges(dirty) {
    const { workspace } = useWorkspace();
    const current = (0, import_react10.useRef)(dirty);
    current.current = dirty;
    (0, import_react10.useEffect)(() => workspace.registerLeaveGuard(() => !current.current || window.confirm("\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF0C\u786E\u8BA4\u79BB\u5F00\u5E76\u653E\u5F03\u4FEE\u6539\uFF1F")), [workspace]);
    (0, import_react10.useEffect)(() => {
      if (!dirty) return;
      const unload = (event) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", unload);
      return () => window.removeEventListener("beforeunload", unload);
    }, [dirty]);
  }

  // src/client/components/layout/PageTabs.tsx
  var import_react11 = __require("react");
  var import_jsx_runtime10 = __require("react/jsx-runtime");
  function PageTabs({ label, items, value, onChange, children }) {
    const id = (0, import_react11.useId)(), buttons = (0, import_react11.useRef)(/* @__PURE__ */ new Map());
    const current = items.find((item) => item.id === value)?.id || items[0].id;
    function navigate(event, index3) {
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowRight" ? (index3 + 1) % items.length : event.key === "ArrowLeft" ? (index3 + items.length - 1) % items.length : null;
      if (next === null) return;
      event.preventDefault();
      onChange(items[next].id);
      buttons.current.get(items[next].id)?.focus();
    }
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-tabs", role: "tablist", "aria-label": label, children: items.map((item, index3) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        "button",
        {
          id: `${id}-${item.id}`,
          role: "tab",
          "aria-selected": current === item.id,
          "aria-controls": `${id}-panel`,
          tabIndex: current === item.id ? 0 : -1,
          className: current === item.id ? "active" : "",
          ref: (button) => {
            if (button) buttons.current.set(item.id, button);
            else buttons.current.delete(item.id);
          },
          onKeyDown: (event) => navigate(event, index3),
          onClick: () => onChange(item.id),
          children: item.label
        },
        item.id
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-tab-panel", role: "tabpanel", id: `${id}-panel`, "aria-labelledby": `${id}-${current}`, tabIndex: 0, children })
    ] });
  }

  // src/client/components/DatasetManager.tsx
  var import_jsx_runtime11 = __require("react/jsx-runtime");
  function DirectoryPicker({ label, value, onChange, disabled = false }) {
    const [listing, setListing] = (0, import_react12.useState)(null);
    const [error2, setError] = (0, import_react12.useState)("");
    async function browse(path) {
      try {
        setListing(await request(`/directories?path=${encodeURIComponent(path || "/data1")}`));
        setError("");
      } catch (e) {
        setError(message(e));
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("label", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { "aria-label": label, disabled, value, onChange: (e) => onChange(e.target.value), placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", disabled, onClick: () => browse(value), children: "\u6D4F\u89C8" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      listing && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("fieldset", { className: "iad-directory", "aria-label": `${label}\u6D4F\u89C8`, disabled, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("code", { children: listing.path }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => browse(listing.parent), children: "\u4E0A\u7EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => {
            onChange(listing.path);
            setListing(null);
          }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => setListing(null), children: "\u5173\u95ED" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "iad-directory-list", children: listing.directories.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => browse(dir.path), children: dir.name }, dir.path)) })
      ] })
    ] });
  }
  function DatasetSettings({ dataset, onChanged }) {
    const { workspace } = useWorkspace();
    const tab = workspace.view("industrial-datasets").datasetSettingsTab;
    const isFolder = dataset.format === "folder_classification";
    const [imageDir, setImageDir] = (0, import_react12.useState)(dataset.image_dir);
    const [annotationDir, setAnnotationDir] = (0, import_react12.useState)(dataset.annotation_dir || "");
    const savedRules = JSON.stringify(dataset.folder_rules || []);
    const [folderRules, setFolderRules] = (0, import_react12.useState)(dataset.folder_rules);
    const { preview, ready, pending, error: previewError } = useFolderPreview(imageDir, folderRules, isFolder);
    (0, import_react12.useEffect)(() => {
      setImageDir(dataset.image_dir);
      setAnnotationDir(dataset.annotation_dir || "");
      setFolderRules(JSON.parse(savedRules));
    }, [dataset.image_dir, dataset.annotation_dir, savedRules]);
    const rulesChanged = isFolder && JSON.stringify(folderRules) !== savedRules;
    const directoriesChanged = imageDir !== dataset.image_dir || !isFolder && annotationDir !== (dataset.annotation_dir || "");
    const modified = directoriesChanged || rulesChanged;
    useUnsavedChanges(modified);
    const [scan, setScan] = (0, import_react12.useState)(null);
    const [busy, setBusy] = (0, import_react12.useState)(false);
    const [error2, setError] = (0, import_react12.useState)("");
    async function save(patch) {
      setBusy(true);
      setError("");
      try {
        await request(`/datasets/${dataset.dataset_id}`, patch, "PATCH");
        onChanged();
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    async function rescan() {
      setBusy(true);
      setError("");
      setScan(null);
      try {
        const payload = isFolder ? modified ? { image_dir: imageDir, folder_rules: preview?.items.map(({ path, role }) => ({ path, role })), preview_fingerprint: preview?.preview_fingerprint } : {} : directoriesChanged ? { image_dir: imageDir, annotation_dir: annotationDir } : {};
        setScan(await request(`/datasets/${dataset.dataset_id}/rescan`, payload));
        onChanged();
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "iad-dataset-detail", "aria-label": "\u5F53\u524D\u6570\u636E\u96C6\u8BE6\u60C5", "aria-busy": busy, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: dataset.name }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(PageTabs, { label: "\u6570\u636E\u96C6\u914D\u7F6E", items: [{ id: "directories", label: "\u76EE\u5F55\u4E0E\u6620\u5C04" }, { id: "basic", label: "\u57FA\u672C\u4FE1\u606F" }], value: tab, onChange: (datasetSettingsTab) => workspace.updateView("industrial-datasets", { datasetSettingsTab }), children: [
        tab === "basic" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-section-layout", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u57FA\u672C\u4FE1\u606F" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DatasetName, { dataset, label: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", onChanged }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dl", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: "\u683C\u5F0F" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: isFolder ? "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55" : "Labelme" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("summary", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("code", { children: dataset.dataset_id })
            ] })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-section-layout", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u670D\u52A1\u5668\u76EE\u5F55" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DirectoryPicker, { label: isFolder ? "\u6839\u76EE\u5F55" : "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: (p) => {
                setImageDir(p);
                if (isFolder) setFolderRules(void 0);
              }, disabled: busy }),
              !isFolder && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }),
              isFolder && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FolderMapping, { preview, rules: folderRules, pending, disabled: busy, onChange: setFolderRules }),
              previewError && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "iad-error", children: previewError }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: modified ? "iad-primary" : "", disabled: busy || isFolder && modified && !ready || directoriesChanged && (!imageDir.trim() || !isFolder && !annotationDir.trim()), onClick: () => void rescan(), children: busy ? "\u6B63\u5728\u5904\u7406\u2026" : modified ? "\u4FDD\u5B58\u6620\u5C04\u5E76\u91CD\u65B0\u626B\u63CF" : "\u91CD\u65B0\u626B\u63CF\u76EE\u5F55" }) })
            ] })
          ] }),
          !isFolder && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "iad-row iad-rule", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { type: "checkbox", checked: dataset.unannotated_is_normal, disabled: busy, onChange: (e) => save({ unannotated_is_normal: e.target.checked }) }),
            "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u6765\u6E90"
          ] }),
          scan && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { role: "status", "aria-label": "\u626B\u63CF\u7ED3\u679C", children: [
            "\u626B\u63CF\u5B8C\u6210 \xB7 ",
            scan.image_count,
            " \u5F20\u56FE\u50CF \xB7 ",
            scan.annotation_count,
            " \u4E2A\u6807\u6CE8 \xB7 ",
            scan.issue_count,
            " \u9879\u95EE\u9898"
          ] })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "iad-error", children: error2 })
      ] })
    ] });
  }
  function DatasetManager({ datasets, selected, onChanged }) {
    const [search, setSearch] = (0, import_react12.useState)("");
    const [page, setPage] = (0, import_react12.useState)(1);
    const filtered = datasets.filter((dataset) => dataset.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
    const [importing, setImporting] = (0, import_react12.useState)(false);
    const [importFormat, setImportFormat] = (0, import_react12.useState)("labelme");
    const [notice, setNotice] = (0, import_react12.useState)("");
    const addButton = (0, import_react12.useRef)(null);
    (0, import_react12.useEffect)(() => {
      if (notice) addButton.current?.focus();
    }, [notice]);
    const [name2, setName] = (0, import_react12.useState)("");
    const [imageDir, setImageDir] = (0, import_react12.useState)("");
    const [annotationDir, setAnnotationDir] = (0, import_react12.useState)("");
    const [rootDir, setRootDir] = (0, import_react12.useState)("");
    const [userRules, setUserRules] = (0, import_react12.useState)();
    const [busy, setBusy] = (0, import_react12.useState)(false);
    const [error2, setError] = (0, import_react12.useState)("");
    const { preview, ready, pending, error: previewError } = useFolderPreview(rootDir, userRules, importing && importFormat === "folder_classification");
    (0, import_react12.useEffect)(() => {
      if (preview) setName((current) => current.trim() ? current : preview.suggested_name);
    }, [preview?.root_dir]);
    async function importDataset(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      try {
        let dataset;
        if (importFormat === "labelme") {
          dataset = await request("/datasets/import", { format: "labelme", name: name2, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
        } else {
          const rules = preview ? preview.items.map(({ path, role }) => ({ path, role })) : [];
          dataset = await request("/datasets/import", {
            format: "folder_classification",
            name: name2,
            root_dir: rootDir,
            rules,
            preview_fingerprint: preview?.preview_fingerprint
          });
        }
        onChanged(dataset.dataset_id);
        setName("");
        setImageDir("");
        setAnnotationDir("");
        setRootDir("");
        setUserRules(void 0);
        setImporting(false);
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(WorkbenchHeader, { pageId: "industrial-datasets", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { ref: addButton, className: "iad-primary", onClick: () => {
        setError("");
        setNotice("");
        setImporting(true);
      }, children: "\u6DFB\u52A0\u6570\u636E\u96C6" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-settings", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "iad-dataset-list", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-section-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("h2", { children: [
              "\u6570\u636E\u96C6 ",
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "iad-muted", children: datasets.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22\u6570\u636E\u96C6", placeholder: "\u641C\u7D22\u6570\u636E\u96C6", value: search, onChange: (event) => {
              setSearch(event.target.value);
              setPage(1);
            } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("th", { children: "\u6570\u636E\u96C6\u540D\u79F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("th", { children: "\u683C\u5F0F" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("th", { className: "iad-number", children: "\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("th", { className: "iad-number", children: "\u6807\u6CE8 / \u6807\u7B7E" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("th", { children: "\u64CD\u4F5C" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("tbody", { children: filtered.slice((currentPage - 1) * 10, currentPage * 10).map((dataset) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("tr", { className: "iad-dataset-row", "data-selected": selected?.dataset_id === dataset.dataset_id, children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DatasetName, { dataset, label: "\u5217\u8868\u6570\u636E\u96C6\u540D\u79F0", onChanged: () => onChanged() }) }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("td", { children: dataset.format === "folder_classification" ? "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55" : "Labelme" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("td", { className: "iad-number", children: dataset.total_samples }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("td", { className: "iad-number", children: dataset.format === "folder_classification" ? dataset.labeled_sample_count ?? 0 : dataset.annotation_count }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", "aria-label": `\u9009\u62E9\u6570\u636E\u96C6 ${dataset.name}`, "aria-pressed": selected?.dataset_id === dataset.dataset_id, onClick: () => onChanged(dataset.dataset_id), children: "\u914D\u7F6E" }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FloatingMenu, { label: `\u66F4\u591A\u64CD\u4F5C ${dataset.name}`, summary: "\u66F4\u591A", className: "iad-row-menu", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                  DeleteAction,
                  {
                    title: "\u5220\u9664\u6570\u636E\u96C6",
                    name: dataset.name,
                    description: "\u5220\u9664\u5176\u6837\u672C\u8BB0\u5F55\u3001\u77E5\u8BC6\u3001\u5BA1\u8BA1\u548C\u590D\u6838\u8BB0\u5F55\uFF0C\u4FDD\u7559\u670D\u52A1\u5668\u4E0A\u7684\u539F\u59CB\u56FE\u50CF\u4E0E\u6807\u6CE8\u6587\u4EF6\u3002",
                    restoreFocus: () => addButton.current,
                    onDelete: async () => {
                      await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, void 0, "DELETE");
                      setNotice(`\u5DF2\u5220\u9664\u6570\u636E\u96C6\u201C${dataset.name}\u201D`);
                      onChanged();
                    }
                  }
                ) })
              ] }) })
            ] }, dataset.dataset_id)) })
          ] }) }),
          filtered.length > 10 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Pagination, { total: filtered.length, page: currentPage, size: 10, unit: "\u4E2A\u6570\u636E\u96C6", onPage: setPage }),
          notice && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "status", children: notice }),
          !filtered.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "iad-muted", children: datasets.length ? "\u6CA1\u6709\u5339\u914D\u7684\u6570\u636E\u96C6\u3002" : "\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u56FE\u50CF\u76EE\u5F55\u4E0E\u6807\u6CE8\u76EE\u5F55\uFF0C\u6216\u5F02\u5E38\u68C0\u6D4B\u5206\u7C7B\u76EE\u5F55\u3002" })
        ] }),
        selected ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DatasetSettings, { dataset: selected, onChanged }, selected.dataset_id) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u9009\u62E9\u6216\u6DFB\u52A0\u6570\u636E\u96C6\u3002" }) }),
        importing && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Modal, { title: "\u6DFB\u52A0\u6570\u636E\u96C6", onClose: () => {
          if (!busy) setImporting(false);
        }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("form", { className: "iad-dataset-import", onSubmit: importDataset, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("label", { children: "\u6570\u636E\u683C\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-row", role: "radiogroup", "aria-label": "\u6570\u636E\u683C\u5F0F", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { type: "radio", name: "dataset_format", value: "labelme", checked: importFormat === "labelme", onChange: () => {
                  setImportFormat("labelme");
                  setError("");
                } }),
                "Labelme"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { type: "radio", name: "dataset_format", value: "folder_classification", checked: importFormat === "folder_classification", onChange: () => {
                  setImportFormat("folder_classification");
                  setError("");
                } }),
                "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55"
              ] })
            ] })
          ] }),
          importFormat === "labelme" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { id: "dataset-name", value: name2, onChange: (e) => setName(e.target.value), maxLength: 120, autoFocus: true, required: true, disabled: busy })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir, disabled: busy }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "iad-muted", children: "\u6309\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\uFF0C\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u5019\u9009\u3002" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DirectoryPicker, { label: "\u7236\u76EE\u5F55", value: rootDir, onChange: (path) => {
              setRootDir(path);
              setUserRules(void 0);
            }, disabled: busy }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { id: "dataset-name", value: name2, onChange: (e) => setName(e.target.value), maxLength: 120, required: true, disabled: busy })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FolderMapping, { preview, rules: userRules, pending, disabled: busy, onChange: setUserRules }),
            previewError && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "iad-error", children: previewError })
          ] }),
          error2 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "iad-form-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", disabled: busy, onClick: () => setImporting(false), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "iad-primary", disabled: busy || !name2.trim() || (importFormat === "labelme" ? !imageDir || !annotationDir : !rootDir || !ready), children: busy ? "\u6B63\u5728\u626B\u63CF\u5BFC\u5165\u2026" : "\u5BFC\u5165\u6570\u636E\u96C6" })
          ] })
        ] }) })
      ] })
    ] });
  }

  // src/client/components/SampleFilters.tsx
  var import_jsx_runtime12 = __require("react/jsx-runtime");
  function SampleFilters({ dataset, filters, onFilters, busy = false, defaults = initialFilters }) {
    const options = {
      model_status: [["all", "\u5168\u90E8"], ["pending", "\u672A\u5BA1\u8BA1"], ["audited", "\u5DF2\u5BA1\u8BA1"], ["risk", "\u53EF\u7591"], ["PASS", modelLabels.PASS], ["FAIL", modelLabels.FAIL], ["UNCERTAIN", modelLabels.UNCERTAIN]],
      review_status: [["all", "\u5168\u90E8"], ["pending", "\u5F85\u590D\u6838"], ["reviewed", "\u5DF2\u590D\u6838"], ["PASS", "\u826F\u54C1"], ["HARD_NORMAL", "\u56F0\u96BE\u6B63\u5E38"], ["FAIL", "\u5F02\u5E38"], ["UNCERTAIN", "\u4E0D\u786E\u5B9A"], ["SKIP", "\u5DF2\u8DF3\u8FC7"]],
      technical: [["all", "\u5168\u90E8"], ["issues", "\u5B58\u5728\u95EE\u9898"]],
      reference_status: [["all", "\u5168\u90E8"], ["candidate", "\u826F\u54C1\u5019\u9009"], ["excluded", "\u975E\u5019\u9009"]],
      sort_by: [["default", "\u9ED8\u8BA4"], ["risk", "\u53EF\u7591\u5EA6\u4F18\u5148"], ["tech", "\u6280\u672F\u95EE\u9898\u4F18\u5148"]]
    };
    const isFolder = dataset.format === "folder_classification";
    const rawLabelOptions = [["PASS", "OK"], ["FAIL", "NG"], ["UNCERTAIN", "\u672A\u6807\u8BB0"]];
    const rawLabelMap = { PASS: "OK", FAIL: "NG", UNCERTAIN: "\u672A\u6807\u8BB0" };
    const rawFilters = filters.raw_label_filters || [];
    const select = (key, label) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "iad-filter", children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("select", { "aria-label": label, disabled: busy, value: filters[key], onChange: (e) => onFilters({ ...filters, [key]: e.target.value }), children: options[key].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value, children: title }, value)) })
    ] });
    const active = [
      ...rawFilters.map((value) => `\u6807\u7B7E\uFF1A${rawLabelMap[value] || value}`),
      ...!isFolder ? filters.annotation_filters.map((value) => value === "none" ? "\u65E0\u6807\u6CE8" : value === "present" ? "\u6709\u6807\u6CE8" : value.slice(9)) : [],
      ...Object.entries(options).filter(([key]) => filters[key] !== defaults[key]).flatMap(([key, values]) => {
        const option = values.find(([value]) => value === filters[key]);
        return option ? [option[1]] : [];
      }),
      ...filters.search ? [`\u6587\u4EF6\u540D\uFF1A${filters.search}`] : []
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "iad-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "iad-filter iad-search", children: [
          "\u641C\u7D22",
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("input", { type: "search", "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6587\u4EF6\u540D", disabled: busy, value: filters.search, onChange: (e) => onFilters({ ...filters, search: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "iad-filter", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: "\u539F\u59CB\u6807\u7B7E" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(FloatingMenu, { className: "iad-multiselect", label: "\u539F\u59CB\u6807\u7B7E\u7B5B\u9009", summary: rawFilters.length ? `\u5DF2\u9009 ${rawFilters.length} \u9879` : "\u5168\u90E8", children: [
            rawLabelOptions.map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("input", { type: "checkbox", "aria-label": `\u539F\u59CB\u6807\u7B7E ${title}`, disabled: busy, checked: rawFilters.includes(value), onChange: (e) => onFilters({ ...filters, raw_label_filters: e.target.checked ? [...rawFilters, value] : rawFilters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { disabled: busy, onClick: () => onFilters({ ...filters, raw_label_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        !isFolder && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "iad-filter", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: "\u6807\u6CE8" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(FloatingMenu, { className: "iad-multiselect", label: "\u6807\u6CE8\u7B5B\u9009", summary: filters.annotation_filters.length ? `\u5DF2\u9009 ${filters.annotation_filters.length} \u9879` : "\u5168\u90E8", children: [
            [["none", "\u65E0\u6807\u6CE8"], ["present", "\u6709\u6807\u6CE8"], ...dataset.annotation_categories.map((value) => [`category:${value}`, `\u7C7B\u522B ${value}`])].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("input", { type: "checkbox", "aria-label": title, disabled: busy, checked: filters.annotation_filters.includes(value), onChange: (e) => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { disabled: busy, onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        select("model_status", "\u6A21\u578B\u5BA1\u8BA1"),
        select("review_status", "\u4EBA\u5DE5\u590D\u6838"),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(FloatingMenu, { className: "iad-multiselect", label: "\u66F4\u591A\u7B5B\u9009", summary: "\u66F4\u591A\u7B5B\u9009", children: [
          select("technical", "\u6280\u672F\u8D28\u91CF"),
          select("reference_status", "\u826F\u54C1\u6765\u6E90"),
          select("sort_by", "\u6392\u5E8F")
        ] })
      ] }),
      !!active.length && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "iad-filter-summary", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
          "\u7B5B\u9009\uFF1A",
          active.join(" \xB7 ")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { disabled: busy, onClick: () => onFilters({ ...defaults }), children: "\u6E05\u9664\u7B5B\u9009" })
      ] })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_react15 = __require("react");

  // src/client/components/Tooltip.tsx
  var import_react13 = __require("react");

  // src/client/theme.ts
  var themeStyles = `
.iad-workbench,.iad-tool-card,.iad-tooltip,.iad-sidebar-content,.iad-detail-dialog::backdrop {
 --iad-canvas:#F7F8FA;
 --iad-surface:#fff;
 --iad-surface-muted:#f1f4f8;
 --iad-text:#202938;
 --iad-muted:#626e80;
 --iad-border:#e2e6ec;
 --iad-control-border:#7D899A;
 --iad-primary:#275BCC;
 --iad-primary-fill:#275BCC;
 --iad-on-primary:#fff;
 --iad-hover:#edf3ff;
 --iad-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary,#a22c34) 85%,var(--iad-text));
 --iad-danger-bg:var(--dsw-alias-state-error-secondary,#ffeded);
 --iad-success:var(--dsw-alias-state-success-primary,#12634b);
 --iad-warning:var(--dsw-alias-state-warn-primary,#af4a12);
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-viewer:#1d2633;
 --iad-on-viewer:#fff;
 --iad-scrim:#101b2bd9;
 --iad-radius:.375rem;
 --iad-control-height:2.5rem;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-6);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.285714);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.071429);
}
[data-ds-dark-theme] :is(.iad-workbench,.iad-tool-card,.iad-tooltip,.iad-sidebar-content) {--iad-canvas:#171c25;--iad-surface:#222936;--iad-surface-muted:#2a3342;--iad-text:#f2f4f7;--iad-muted:#b1bbcb;--iad-border:#3e4756;--iad-hover:#283b59;--iad-primary:#A6C8FF;--iad-control-border:#7F8A9C;}
`;

  // src/client/components/Tooltip.tsx
  var import_jsx_runtime13 = __require("react/jsx-runtime");
  function Tooltip({ label, content, className, children }) {
    const [open, setOpen] = (0, import_react13.useState)(false);
    const { refs, context, floatingStyles } = useFloating2({
      open,
      onOpenChange: setOpen,
      placement: "top",
      whileElementsMounted: autoUpdate,
      middleware: [offset3(8), flip3(), shift3({ padding: 12, crossAxis: true })]
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([
      useHover(context, { move: false, delay: { open: 200, close: 100 } }),
      useFocus(context),
      useClick(context),
      useDismiss(context, { bubbles: false }),
      useRole(context, { role: "tooltip" })
    ]);
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { type: "button", ref: refs.setReference, className, "aria-label": label, ...getReferenceProps(), children }),
      open && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(FloatingPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { ref: refs.setFloating, className: "iad-tooltip", style: floatingStyles, ...getFloatingProps(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("style", { children: [
          themeStyles,
          `.iad-tooltip{box-sizing:border-box;z-index:10020;max-width:min(340px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:12px;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);font:var(--dsh-content-font-size,14px)/1.5 system-ui,sans-serif;overflow-wrap:anywhere;box-shadow:0 4px 16px #0002}.iad-tooltip p{margin:4px 0}`
        ] }),
        content
      ] }) })
    ] });
  }

  // src/client/components/SampleCard.tsx
  var import_jsx_runtime14 = __require("react/jsx-runtime");
  function SampleCard({ sample, selected, onSelect, reference, selection, compact = false }) {
    const status = sample.suggestion?.suggested_label;
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-sample-item", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("button", { "data-sample-id": sample.sample_id, className: `iad-sample ${selected ? "is-selected" : ""}`, title: sample.relative_path, onClick: onSelect, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "iad-thumb", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("img", { loading: "lazy", src: mediaUrl(sample, "thumbnail"), alt: sample.relative_path }),
          reference && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "iad-reference", children: "\u826F\u54C1\u6765\u6E90" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { className: "iad-sample-label", children: [
          sample.quality_status === "PASS" ? "OK" : sample.quality_status === "FAIL" ? "NG" : "\u672A\u6807\u8BB0",
          " ",
          compact && ` \xB7 ${sample.review_decision ? reviewLabel(sample.review_decision) : status ? modelLabels[status] : "\u672A\u5BA1\u8BA1"}`
        ] })
      ] }),
      !compact && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Tooltip, { label: `\u67E5\u770B\u72B6\u6001 ${sample.relative_path}`, className: `iad-status-trigger is-${status || "pending"}`, content: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: "\u6A21\u578B\u5EFA\u8BAE\u4E0D\u4EE3\u66FF\u4EBA\u5DE5\u88C1\u51B3\u3002" }),
        sample.review_decision && /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { children: [
          "\u6A21\u578B\u5BA1\u8BA1\uFF1A",
          status ? modelLabels[status] : "\u672A\u5BA1\u8BA1"
        ] })
      ] }), children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "iad-status-mark", "aria-hidden": "true" }),
        sample.review_decision ? reviewLabel(sample.review_decision) : status ? modelLabels[status] : "\u672A\u5BA1\u8BA1"
      ] }),
      selection && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("label", { className: "iad-source-check", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { type: "checkbox", "aria-label": `\u9009\u62E9\u826F\u54C1\u6765\u6E90 ${sample.relative_path}`, disabled: selection.disabled, checked: selection.checked, onChange: (event) => selection.onChange(event.target.checked) }) })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_jsx_runtime15 = __require("react/jsx-runtime");
  function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading, sourceManagement, layout = "grid", showFilters = true }) {
    const scope = dataset.dataset_id;
    const [selection, setSelection] = (0, import_react15.useState)({ scope: "", ids: [] });
    const [busy, setBusy] = (0, import_react15.useState)(false), [error2, setError] = (0, import_react15.useState)(""), [notice, setNotice] = (0, import_react15.useState)("");
    const chosen = selection.scope === scope ? selection.ids : [];
    const managing = sourceManagement?.active;
    async function selectAll() {
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const ids = [];
        for (let next = 1; ; next++) {
          const result = await request(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id, filters, next, 200)}`);
          ids.push(...result.items.map((item) => item.sample_id));
          if (ids.length >= result.total) break;
          if (!result.items.length) throw new Error("\u7B5B\u9009\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
        }
        setSelection({ scope, ids });
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    async function save(include) {
      setBusy(true);
      setError("");
      setNotice("");
      try {
        if (include === void 0) await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { reset_references: true }, "PATCH");
        else {
          const ids = new Set(dataset.reference_sample_ids);
          for (const id of chosen) {
            if (include) ids.add(id);
            else ids.delete(id);
          }
          await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, { reference_sample_ids: [...ids] }, "PATCH");
        }
        setNotice(include === void 0 ? "\u5DF2\u6062\u590D\u81EA\u52A8\u6765\u6E90" : `\u5DF2${include ? "\u52A0\u5165" : "\u79FB\u51FA"} ${chosen.length} \u5F20\u56FE\u50CF`);
        setSelection({ scope, ids: [] });
        sourceManagement?.onChanged();
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    const pagination = /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Pagination, { total, page, unit: "\u5F20", onPage });
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("section", { className: `iad-gallery ${layout === "queue" ? "iad-review-queue" : ""}`, "aria-label": "\u56FE\u50CF\u5217\u8868", children: [
      showFilters && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SampleFilters, { dataset, filters, onFilters, busy }),
      managing && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("section", { className: "iad-source-controls", "aria-label": "\u826F\u54C1\u6765\u6E90\u7BA1\u7406", "aria-busy": busy, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("strong", { "aria-label": "\u826F\u54C1\u6765\u6E90\u6458\u8981", children: [
            dataset.reference_mode === "automatic" ? "\u81EA\u52A8\u6765\u6E90" : "\u4EBA\u5DE5\u9009\u5B9A",
            " \xB7 ",
            dataset.reference_sample_ids.length,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { disabled: busy || dataset.reference_mode === "automatic", onClick: () => void save(), children: "\u6062\u590D\u81EA\u52A8\u6765\u6E90" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { disabled: busy || loading, onClick: () => setSelection({ scope, ids: items.map((item) => item.sample_id) }), children: "\u9009\u62E9\u5F53\u524D\u9875" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { disabled: busy || loading || !total, onClick: () => void selectAll(), children: "\u9009\u62E9\u7B5B\u9009\u5168\u90E8" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { children: [
            "\u5DF2\u9009 ",
            chosen.length,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { disabled: busy || !chosen.length, onClick: () => setSelection({ scope, ids: [] }), children: "\u53D6\u6D88\u9009\u62E9" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: "iad-primary", disabled: busy || !chosen.length, onClick: () => void save(true), children: "\u52A0\u5165\u826F\u54C1\u6765\u6E90" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { disabled: busy || !chosen.length, onClick: () => void save(false), children: "\u79FB\u51FA\u826F\u54C1\u6765\u6E90" }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "iad-muted", children: "\u5019\u9009\u6765\u6E90\uFF0C\u975E\u4EBA\u5DE5\u88C1\u51B3" })
        ] })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { role: "status", children: notice }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "iad-grid", children: items.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        SampleCard,
        {
          sample,
          compact: layout === "queue",
          selected: selected === sample.sample_id,
          onSelect: () => onSelect(sample.sample_id),
          reference: !!managing && dataset.reference_sample_ids.includes(sample.sample_id),
          selection: managing ? { checked: chosen.includes(sample.sample_id), disabled: busy, onChange: (checked) => setSelection({ scope, ids: checked ? [...chosen, sample.sample_id] : chosen.filter((id) => id !== sample.sample_id) }) } : void 0
        },
        sample.sample_id
      )) }),
      !loading && !items.length && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6837\u672C\u3002" }),
      pagination
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_react26 = __require("react");

  // src/client/components/ImageCanvas.tsx
  var import_react20 = __require("react");

  // src/client/components/MediaLoad.tsx
  var import_react16 = __require("react");
  var import_jsx_runtime16 = __require("react/jsx-runtime");
  var RetryContext = (0, import_react16.createContext)(0);
  function MediaLoad({ children, className = "" }) {
    const [attempt, setAttempt] = (0, import_react16.useState)(0);
    const [failures, setFailures] = (0, import_react16.useState)(/* @__PURE__ */ new Map());
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
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RetryContext.Provider, { value: attempt, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: `iad-media-load ${className}`, onErrorCapture: capture, onLoadCapture: capture, children: [
      children,
      !!failures.size && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "iad-media-error", role: "alert", children: [
        [...new Set(failures.values())].map((label) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { children: [
          label,
          "\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u8BF7\u68C0\u67E5\u8D44\u6E90\u662F\u5426\u5B58\u5728\u6216\u5B8C\u6574\u3002"
        ] }, label)),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { type: "button", "aria-label": "\u91CD\u65B0\u52A0\u8F7D\u56FE\u50CF", onClick: () => setAttempt((previous) => previous + 1), children: "\u91CD\u65B0\u52A0\u8F7D" })
      ] })
    ] }) });
  }
  function useRetryUrl(source) {
    const attempt = (0, import_react16.useContext)(RetryContext);
    if (!attempt) return source;
    const url = new URL(source, window.location.href);
    url.searchParams.set("_retry", String(attempt));
    return url.href;
  }
  function MediaImage({ src = "", ...props }) {
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("img", { ...props, src: useRetryUrl(src), "data-media-source": src });
  }
  function MediaMask({ href = "", ...props }) {
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("image", { ...props, href: useRetryUrl(href), "data-media-source": href, "data-media-label": "\u6807\u6CE8\u50CF\u7D20" });
  }

  // src/client/components/AnnotationLayer.tsx
  var import_react17 = __require("react");
  var import_jsx_runtime17 = __require("react/jsx-runtime");
  function AnnotationLayer({ source }) {
    const namespace = (0, import_react17.useId)();
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
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("svg", { className: "iad-annotation-layer", viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none", "aria-label": "Labelme \u6807\u6CE8", children: [
      !!masks.length && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("g", { className: "iad-annotation-mask", children: masks.map((mask, index3) => {
        const maskId = `${namespace}-mask-${index3}`;
        const [x1, y1, x2, y2] = mask.bbox;
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("mask", { id: maskId, x: 0, y: 0, width, height, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", style: { maskType: "luminance" }, children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(MediaMask, { href: mask.url, x: x1, y: y1, width: x2 - x1, height: y2 - y1, preserveAspectRatio: "none", style: { imageRendering: "pixelated" } }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: 0, y: 0, width, height, mask: `url(#${maskId})` })
        ] }, mask.id);
      }) }),
      annotations.map((annotation) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("g", { children: [
        annotation.annotation_type !== "mask" && (annotation.polygon ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("polygon", { points: annotation.polygon.map((point) => point.join(",")).join(" ") }) : annotation.bbox && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: annotation.bbox[0], y: annotation.bbox[1], width: annotation.bbox[2] - annotation.bbox[0], height: annotation.bbox[3] - annotation.bbox[1] })),
        annotation.bbox && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("text", { x: annotation.bbox[0], y: Math.max(12, annotation.bbox[1] - 4), children: annotation.raw_label })
      ] }, annotation.annotation_id))
    ] });
  }

  // src/client/components/AuditEvidence.tsx
  var import_jsx_runtime18 = __require("react/jsx-runtime");
  function AuditEvidence({ analysis, ids, label, onEvidence, selectedId }) {
    const images = auditImageIndex(analysis);
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "iad-actions", children: ids.map((id, index3) => {
      const image = images.get(id);
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
        "button",
        {
          "data-evidence-id": id,
          "aria-current": id === selectedId ? "true" : void 0,
          disabled: !image,
          onClick: () => image && onEvidence(image),
          "aria-label": `\u67E5\u770B${label}\u7684\u8BC1\u636E ${index3 + 1}`,
          children: [
            "\u8BC1\u636E ",
            index3 + 1,
            " \xB7 ",
            !image ? "\u4E0D\u53EF\u7528" : image.representation === "annotation_mask" ? "\u5B9A\u4F4D\u56FE" : image.role === "overview" ? "\u5168\u56FE" : "ROI"
          ]
        },
        id
      );
    }) });
  }

  // src/client/components/AuditFindings.tsx
  var import_react18 = __require("react");
  var import_jsx_runtime19 = __require("react/jsx-runtime");
  var priorities = { high: "\u4F18\u5148\u590D\u6838", medium: "\u968F\u540E\u590D\u6838", low: "\u8865\u5145\u6838\u5BF9" };
  function AuditFindings({ analysis, onLocate, onEvidence }) {
    const [expanded, setExpanded] = (0, import_react18.useState)(false);
    if (!analysis.findings.length) return null;
    const visible = expanded ? analysis.findings : analysis.findings.slice(0, 3);
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("section", { className: "iad-findings", "aria-label": "\u4F18\u5148\u590D\u6838\u7591\u70B9", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("h3", { children: [
        "\u91CD\u70B9\u7591\u70B9 \xB7 ",
        analysis.findings.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("ol", { children: visible.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("li", { "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: priorities[finding.priority] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("button", { onClick: () => onLocate(finding), title: "\u5728\u5168\u56FE\u5B9A\u4F4D", children: [
          finding.location.description,
          " \xB7 ",
          finding.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("details", { className: "iad-analysis", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("summary", { children: "\u4F9D\u636E\u4E0E\u6B63\u5E38\u89E3\u91CA" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(FindingExplanation, { finding }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, onEvidence: (image) => onEvidence(image, finding) })
        ] })
      ] }, finding.finding_id)) }),
      analysis.findings.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u5176\u4ED6\u7591\u70B9" : `\u67E5\u770B\u5176\u4F59 ${analysis.findings.length - 3} \u9879` })
    ] });
  }
  function FindingExplanation({ finding }) {
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(import_jsx_runtime19.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { children: [
        "\u5F02\u5E38\u5047\u8BBE\uFF1A",
        finding.hypothesis
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { children: [
        "\u6B63\u5E38\u89E3\u91CA\uFF1A",
        finding.normal_explanation
      ] }),
      !!finding.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { className: "iad-muted", children: finding.limitations.join("\uFF1B") })
    ] });
  }

  // src/client/components/InspectionQuestion.tsx
  var import_react19 = __require("react");
  var import_jsx_runtime20 = __require("react/jsx-runtime");
  function InspectionQuestion({ inspection, selection, transform }) {
    const { workspace } = useWorkspace();
    const [expanded, setExpanded] = (0, import_react19.useState)(false);
    const [question, setQuestion] = (0, import_react19.useState)("");
    const [busy, setBusy] = (0, import_react19.useState)(false);
    const [error2, setError] = (0, import_react19.useState)("");
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
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    return expanded ? /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("form", { className: "iad-inspection-question", onSubmit: send, "aria-label": "\u5411 Agent \u8FFD\u95EE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("label", { className: "iad-field", children: [
        "\u8FFD\u95EE\u5185\u5BB9",
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("textarea", { "aria-label": "\u8FFD\u95EE\u5185\u5BB9", rows: 3, value: question, disabled: busy, onChange: (event) => setQuestion(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "iad-muted", children: "\u643A\u5E26\u5F53\u524D\u7591\u70B9\u3001\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u5B9E\u9645\u56FE\u50CF\u5F15\u7528\u3002" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "iad-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { type: "submit", className: "iad-primary", disabled: busy, children: busy ? "\u6B63\u5728\u63D0\u4EA4\u2026" : "\u53D1\u9001\u5230\u4F1A\u8BDD" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { type: "button", disabled: busy, onClick: () => setExpanded(false), children: "\u53D6\u6D88" })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { onClick: () => setExpanded(true), children: "\u5411 Agent \u8FFD\u95EE" });
  }

  // src/client/components/InspectionEvidence.tsx
  var import_jsx_runtime21 = __require("react/jsx-runtime");
  function InspectionOverlay({ inspection, selectedId, hoveredIds, regions, finding }) {
    const { analysis } = inspection;
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("svg", { className: "iad-roi-layer", viewBox: `0 0 ${analysis.overview.original_size.join(" ")}`, preserveAspectRatio: "none", "aria-label": "\u5BA1\u8BA1\u533A\u57DF", children: regions.map((region) => {
        const [x1, y1, x2, y2] = region.crop_bbox;
        return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("g", { "data-evidence-id": region.image.evidence_id, "data-locked": selectedId === region.image.evidence_id, className: hoveredIds.includes(region.image.evidence_id) ? "is-hovered" : "", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }) }, region.image.evidence_id);
      }) }),
      finding?.location.scope === "local" && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "svg",
        {
          className: "iad-finding-layer",
          "data-finding-id": finding.finding_id,
          viewBox: `0 0 ${analysis.overview.original_size.join(" ")}`,
          preserveAspectRatio: "none",
          "aria-label": finding.location.description,
          children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: finding.location.bbox[0], y: finding.location.bbox[1], width: finding.location.bbox[2] - finding.location.bbox[0], height: finding.location.bbox[3] - finding.location.bbox[1] })
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
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("aside", { className: "iad-inspection-panel", "aria-label": "\u5168\u56FE\u4E0E ROI \u7EFC\u5408\u5206\u6790", children: [
      inspection.historical && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { role: "status", children: "\u5386\u53F2\u5EFA\u8BAE \xB7 \u4FDD\u7559\u8BE5\u6B21\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u56FE\u50CF\u8BC1\u636E\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(InspectionQuestion, { inspection, selection, transform }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h2", { children: "\u7EFC\u5408\u5EFA\u8BAE" }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: analysis.conclusion.description }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { className: "iad-muted", children: [
        "\u4F4D\u7F6E\uFF1A",
        analysis.conclusion.position_analysis,
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("br", {}),
        "\u5149\u7167\uFF1A",
        analysis.conclusion.illumination_analysis
      ] }),
      !!analysis.findings.length && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("label", { className: "iad-field", children: [
        "\u5BA1\u8BA1\u7591\u70B9",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u7591\u70B9", value: finding?.finding_id || "", onChange: (event) => onSelect(event.target.value ? { kind: "finding", id: event.target.value } : null), children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("option", { value: "", children: "\u9009\u62E9\u7591\u70B9" }),
          analysis.findings.map((item) => /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("option", { value: item.finding_id, children: [
            item.location.scope === "global" ? "\u5168\u56FE" : "\u5C40\u90E8",
            " \xB7 ",
            item.location.description,
            " \xB7 ",
            item.description
          ] }, item.finding_id))
        ] })
      ] }),
      finding && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("section", { className: "iad-inspection-finding", "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("h3", { children: [
          finding.location.scope === "global" ? "\u5168\u56FE\u5173\u7CFB" : "\u5C40\u90E8\u7591\u70B9",
          " \xB7 ",
          finding.location.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: finding.description }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(FindingExplanation, { finding }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, selectedId: evidence?.evidence_id || region?.image.evidence_id, onEvidence: (image) => onSelect({ kind: "evidence", id: image.evidence_id, findingId: finding.finding_id }) })
      ] }),
      !!choices.length && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { role: "group", "aria-label": "\u91CD\u53E0\u533A\u57DF", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h3", { children: "\u9009\u62E9\u91CD\u53E0\u533A\u57DF" }),
        analysis.regions.filter((item) => choices.includes(item.image.evidence_id)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("button", { onClick: () => onSelect({ kind: "evidence", id: item.image.evidence_id }), children: [
          item.label,
          " \xB7 ",
          item.crop_bbox.join(", ")
        ] }, item.image.evidence_id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "iad-roi-list", "aria-label": "\u5BA1\u8BA1 ROI", children: analysis.regions.map((item, index3) => /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("button", { "aria-label": `\u5B9A\u4F4D ROI ${index3 + 1}`, "aria-pressed": selectedId === item.image.evidence_id, onClick: () => onSelect({ kind: "evidence", id: item.image.evidence_id }), children: [
        "ROI ",
        index3 + 1,
        " \xB7 ",
        item.label
      ] }, item.image.evidence_id)) }),
      region ? /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("section", { className: "iad-inspection-region", "data-evidence-id": region.image.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("h3", { children: [
          regionSources[region.source],
          " \xB7 ",
          region.label
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(MediaImage, { src: auditEvidenceUrl(suggestionId, region.image), alt: "\u6240\u9009 ROI \u7684\u5B9E\u9645\u9001\u6A21\u88C1\u56FE", "data-media-label": "ROI \u88C1\u56FE" }) }, region.image.evidence_id),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("dt", { children: "\u539F\u56FE\u533A\u57DF" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("dd", { children: region.bbox.join(", ") }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("dt", { children: "\u5916\u6269\u88C1\u56FE" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("dd", { children: region.crop_bbox.join(", ") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: region.observation.description }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { children: [
          "\u4F4D\u7F6E\uFF1A",
          region.observation.position_analysis
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { children: [
          "\u5149\u7167\uFF1A",
          region.observation.illumination_analysis
        ] }),
        !finding && !!related.length && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "iad-related-findings iad-actions", "aria-label": "ROI \u5173\u8054\u7591\u70B9", children: related.map((item) => /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("button", { "data-finding-id": item.finding_id, onClick: () => onSelect({ kind: "finding", id: item.finding_id }), children: [
          item.location.description,
          " \xB7 ",
          item.description
        ] }, item.finding_id)) })
      ] }) : !evidence && !finding && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { className: "iad-muted", children: "\u70B9\u9009\u56FE\u4E2D\u533A\u57DF\u6216 ROI \u6309\u94AE\u67E5\u770B\u5B9E\u9645\u88C1\u56FE\u3002" }),
      evidence && evidence.representation !== "raw" && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("section", { className: "iad-inspection-mask", "data-evidence-id": evidence.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h3", { children: evidence.representation === "annotation_mask" ? "\u6807\u6CE8\u5B9A\u4F4D\u56FE" : "\u6807\u6CE8\u53E0\u52A0\u56FE" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(MediaImage, { src: auditEvidenceUrl(suggestionId, evidence), alt: "\u6240\u9009\u6807\u6CE8\u7684\u5B9E\u9645\u9001\u6A21\u56FE", "data-media-label": "\u6807\u6CE8\u8BC1\u636E" }) }, evidence.evidence_id),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { children: [
          "\u539F\u56FE\u5750\u6807\uFF1A",
          evidence.crop_bbox.join(", ")
        ] })
      ] }),
      evidence?.role === "overview" && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("section", { className: "iad-inspection-overview", "data-evidence-id": evidence.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: analysis.global_view.description }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { children: [
          "\u4F4D\u7F6E\uFF1A",
          analysis.global_view.position_analysis
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { children: [
          "\u5149\u7167\uFF1A",
          analysis.global_view.illumination_analysis
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("summary", { children: "\u7248\u672C\u4E0E\u8BC1\u636E\u8303\u56F4" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("code", { children: analysis.normal_version_id }) }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { children: [
          "\u5B9E\u9645\u7EC6\u770B ",
          analysis.coverage.inspected_regions,
          " / ",
          analysis.coverage.planned_regions,
          " \u4E2A ROI"
        ] }),
        analysis.coverage.missing.map((item, index3) => /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { children: item }, index3))
      ] })
    ] });
  }

  // src/client/components/ImageCanvas.tsx
  var import_jsx_runtime22 = __require("react/jsx-runtime");
  var emptyHover = { ids: [], dismissed: false, x: 0, y: 0 };
  var minScale = 0.02;
  var maxScale = 16;
  function AnnotatedImage({ image, visible = true, onLoad }) {
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-image-frame", children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(MediaImage, { src: image.src, alt: image.title, width: image.width, height: image.height, "data-media-label": "\u56FE\u50CF", draggable: false, onLoad }),
      visible && image.annotationLayer && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(AnnotationLayer, { source: image.annotationLayer })
    ] });
  }
  function ImageCanvas({ image, onClose, navigation: navigation2, embedded = false, onExpand }) {
    const { workspace } = useWorkspace();
    const reference = image.inspection?.reference;
    const source = JSON.stringify(reference ? [reference.dataset_id, reference.sample_id, reference.suggestion_id] : [image.src]);
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(CanvasViewport, { image, onClose, navigation: navigation2, embedded, onExpand, savedView: workspace.imageView(source), onRemember: (view) => workspace.rememberImageView(source, view) }, JSON.stringify([source, image.src]));
  }
  function CanvasViewport({ image, onClose, navigation: navigation2, savedView, onRemember, embedded, onExpand }) {
    const viewport = (0, import_react20.useRef)(null);
    const world = (0, import_react20.useRef)(null);
    const layerMenu = (0, import_react20.useRef)(null);
    const inspection = image.inspection;
    const [selection, setSelection] = (0, import_react20.useState)(() => inspection ? image.initialSelection === void 0 ? savedView?.selection || null : image.initialSelection : null);
    const initialTransform = image.initialTransform || (image.initialSelection === void 0 || JSON.stringify(image.initialSelection) === JSON.stringify(savedView?.selection) ? savedView?.transform : void 0);
    const [hover, setHover] = (0, import_react20.useState)(emptyHover);
    const hintId = (0, import_react20.useId)();
    const [showEvidence, setShowEvidence] = (0, import_react20.useState)(!!image.initialSelection);
    const [choices, setChoices] = (0, import_react20.useState)([]);
    const { finding, evidence, region } = resolveInspection(inspection?.analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const [size4, setSize] = (0, import_react20.useState)({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = (0, import_react20.useState)({ width: 0, height: 0 });
    const [view, setView] = (0, import_react20.useState)({ scale: 0, x: 0, y: 0 });
    const focusedSelection = (0, import_react20.useRef)();
    const restoredTransform = (0, import_react20.useRef)(false);
    const [layers, setLayers] = (0, import_react20.useState)(() => {
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
    (0, import_react20.useEffect)(() => {
      localStorage.setItem("iad.image-layers", JSON.stringify(layers));
    }, [layers]);
    const drag = (0, import_react20.useRef)(null);
    const fit = size4.width && size4.height ? Math.min(bounds.width / size4.width, bounds.height / size4.height) : 1;
    const scale = view.scale || fit;
    const remembered = (0, import_react20.useRef)({ onRemember, view: { selection, transform: { zoom: 0, x: 0, y: 0 } } });
    remembered.current = { onRemember, view: { selection, transform: { zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y } } };
    (0, import_react20.useEffect)(() => () => remembered.current.onRemember(remembered.current.view), []);
    (0, import_react20.useLayoutEffect)(() => {
      const element = viewport.current;
      const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    (0, import_react20.useEffect)(() => {
      if (!bounds.width || !bounds.height || !size4.width || !size4.height) return;
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
      const [x1, y1, x2, y2] = box.map((value, axis) => value * (axis % 2 ? size4.height : size4.width) / inspection.analysis.overview.original_size[axis % 2]);
      const scale2 = Math.min(maxScale, bounds.width / ((x2 - x1) * 1.4), bounds.height / ((y2 - y1) * 1.4));
      setView({ scale: scale2, x: (size4.width / 2 - (x1 + x2) / 2) * scale2, y: (size4.height / 2 - (y1 + y2) / 2) * scale2 });
    }, [selection, inspection, finding, evidence, bounds.width, bounds.height, size4.width, size4.height]);
    function select(target) {
      const { region: targetRegion, finding: targetFinding } = resolveInspection(inspection?.analysis, target);
      if (targetRegion) setLayers((previous) => ({ ...previous, [targetRegion.source]: true }));
      if (targetFinding?.location.scope === "local") setLayers((previous) => ({ ...previous, model: true }));
      setSelection(target);
      setShowEvidence(!!target);
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
      else if (onClose) {
        onRemember(remembered.current.view);
        onClose();
      }
    }
    function zoomBy(factor, anchorX = 0, anchorY = 0) {
      setHover(emptyHover);
      setView((previous) => {
        const oldScale = previous.scale || fit;
        const next = Math.max(minScale, Math.min(maxScale, oldScale * factor));
        return { scale: next, x: anchorX - (anchorX - previous.x) * next / oldScale, y: anchorY - (anchorY - previous.y) * next / oldScale };
      });
    }
    (0, import_react20.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: embedded ? "iad-image-canvas iad-embedded-canvas" : "iad-image-canvas iad-lightbox", onKeyDown: (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-lightbox-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: image.title }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-icon-button", "aria-label": "\u7F29\u5C0F", title: "\u7F29\u5C0F", disabled: scale <= minScale, onClick: () => zoomBy(0.5), children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "M5 12h14" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: (e) => {
          const next = Number(e.target.value);
          if (next) zoomBy(next / scale);
          else {
            setView({ scale: 0, x: 0, y: 0 });
            setHover(emptyHover);
          }
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: 1, children: "100%" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: 1.5, children: "150%" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: 2, children: "200%" }),
          !fixed && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("option", { value: "custom", children: [
            Math.round(scale * 100),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-icon-button", "aria-label": "\u653E\u5927", title: "\u653E\u5927", disabled: scale >= maxScale, onClick: () => zoomBy(2), children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "M5 12h14M12 5v14" }) }) }),
        (image.annotationLayer || inspection) && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-icon-button", title: layers.annotation ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-label": layers.annotation ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-pressed": layers.annotation, onClick: () => setLayers((previous) => ({ ...previous, annotation: !previous.annotation })), children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
          !layers.annotation && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "m3 3 18 18" })
        ] }) }),
        inspection && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(FloatingMenu, { detailsRef: layerMenu, className: "iad-layer-menu", label: "\u53EF\u89C6\u56FE\u5C42", summary: "\u56FE\u5C42", children: Object.keys(regionSources).map((source) => {
          const label = { annotation: "\u6807\u6CE8", model: "\u6A21\u578B\u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" }[source];
          return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
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
        }) }),
        navigation2 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-image-step", disabled: navigation2.busy || !navigation2.previous, onClick: () => navigation2.move(-1), children: "\u524D\u4E00\u5F20" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-image-step", disabled: navigation2.busy || !navigation2.next, onClick: () => navigation2.move(1), children: "\u540E\u4E00\u5F20" }),
          navigation2.busy && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { role: "status", children: "\u6B63\u5728\u5207\u6362\u56FE\u50CF\u2026" })
        ] }),
        onExpand && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { className: "iad-icon-button", "aria-label": "\u5168\u5C4F\u68C0\u89C6", title: "\u5168\u5C4F\u68C0\u89C6", onClick: () => {
          onRemember(remembered.current.view);
          onExpand(remembered.current.view);
        }, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("svg", { width: "21", height: "21", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("path", { d: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" }) }) }),
        onClose && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: () => {
          onRemember(remembered.current.view);
          onClose();
        }, children: "\u5173\u95ED" })
      ] }),
      navigation2?.error && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { role: "alert", className: "iad-error", children: navigation2.error }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: `iad-viewer-body ${inspection && !embedded ? "has-inspection" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(MediaLoad, { className: "iad-viewer-media", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
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
                setHover((previous) => ids.length === previous.ids.length && ids.every((id, index3) => id === previous.ids[index3]) ? previous : { ids, dismissed: false, x, y });
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
                  setShowEvidence(!!ids.length);
                }
              }
            },
            onPointerCancel: () => {
              drag.current = null;
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "iad-viewer-world", ref: world, "data-scale": scale, style: {
                width: size4.width,
                height: size4.height,
                "--iad-view-scale": scale,
                transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})`
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(AnnotatedImage, { image: { ...image, ...size4 }, visible: layers.annotation, onLoad: (event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) }),
                inspection && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(InspectionOverlay, { inspection, selectedId, hoveredIds: hover.ids, regions, finding: layers.model ? finding : void 0 })
              ] }),
              hint && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { id: hintId, role: "tooltip", className: "iad-roi-hint", style: { left: hover.x, top: hover.y + (hover.y < bounds.height / 2 ? 1 : 0), transform: hover.y >= bounds.height / 2 ? "translateY(-100%)" : void 0 }, onPointerMove: (event) => event.stopPropagation(), onPointerDown: (event) => event.stopPropagation(), children: [
                regionSources[hint.source],
                " \xB7 ",
                hint.label.slice(0, 80),
                hint.label.length > 80 ? "\u2026" : "",
                hoveredRegions.length > 1 ? ` \xB7 ${hoveredRegions.length} \u4E2A\u91CD\u53E0\u533A\u57DF` : ""
              ] })
            ]
          }
        ) }, image.src),
        inspection && (embedded ? /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("details", { className: "iad-embedded-evidence", open: showEvidence, onToggle: (event) => setShowEvidence(event.currentTarget.open), children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("summary", { children: "\u8BC1\u636E\u4E0E\u5206\u6790" }),
          "    ",
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(InspectionPanel, { inspection, selection, choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(InspectionPanel, { inspection, selection, choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) }))
      ] })
    ] });
  }

  // src/client/components/ImageViewer.tsx
  var import_jsx_runtime23 = __require("react/jsx-runtime");
  function ImageViewer({ image, onClose, navigation: navigation2 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Modal, { title: "\u539F\u56FE\u68C0\u89C6\u5668", className: "iad-viewer-dialog", header: false, onClose, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(ImageCanvas, { image, onClose, navigation: navigation2 }) });
  }

  // src/client/components/ReviewWorkspace.tsx
  var import_react21 = __require("react");
  var import_jsx_runtime24 = __require("react/jsx-runtime");
  function ReviewWorkspace({ queue, filters, image, decision, information }) {
    const [panel, setPanel] = (0, import_react21.useState)(null);
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "iad-review-focused", "aria-label": "\u4E13\u6CE8\u590D\u6838", children: [
      filters,
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-review-tools", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { className: "iad-queue-trigger", onClick: () => setPanel("queue"), children: "\u6253\u5F00\u590D\u6838\u961F\u5217" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("button", { className: "iad-decision-trigger", disabled: !decision, onClick: () => setPanel("decision"), children: "\u6253\u5F00\u4EBA\u5DE5\u88C1\u51B3" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-review-columns", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("aside", { className: "iad-review-queue-slot", "aria-label": "\u5F85\u590D\u6838\u6837\u672C", children: panel !== "queue" && queue }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-review-center", children: [
          image,
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("details", { className: "iad-review-information", children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("summary", { children: "\u6837\u672C\u4FE1\u606F\u4E0E\u6A21\u578B\u89C2\u5BDF" }),
            information
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("aside", { className: "iad-review-decision-slot", "aria-label": "\u4EBA\u5DE5\u88C1\u51B3\u9762\u677F", children: panel !== "decision" && decision })
      ] }),
      panel && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Modal, { title: panel === "queue" ? "\u590D\u6838\u961F\u5217" : "\u4EBA\u5DE5\u88C1\u51B3", className: "iad-review-drawer", onClose: () => setPanel(null), children: panel === "queue" ? queue : decision })
    ] });
  }

  // src/client/components/KnowledgeEvidenceGallery.tsx
  var import_react22 = __require("react");
  var import_jsx_runtime25 = __require("react/jsx-runtime");
  function KnowledgeEvidenceGallery({ versionId, items, onOpen }) {
    const scope = JSON.stringify([versionId, items.map((item) => item.image.evidence_id)]);
    const [position, setPosition] = (0, import_react22.useState)({ scope: "", page: 1 });
    const page = position.scope === scope ? Math.min(position.page, Math.max(1, Math.ceil(items.length / 10))) : 1;
    return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(import_jsx_runtime25.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("div", { className: "iad-knowledge-evidence iad-reference-grid", children: items.slice((page - 1) * 10, page * 10).map(({ image }) => {
        const src = `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(image.evidence_id)}`;
        return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("button", { title: "\u653E\u5927\u51BB\u7ED3\u8BC1\u636E", onClick: () => onOpen({ src, title: `${image.role} \xB7 ${image.representation} \xB7 ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("img", { src, alt: `${image.role} \xB7 ${image.representation}`, loading: "lazy" }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("small", { children: [
            image.role,
            " \xB7 ",
            image.representation
          ] })
        ] }, image.evidence_id);
      }) }),
      !items.length && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("p", { className: "iad-muted", children: "\u672A\u63D0\u4F9B\u6B64\u7EC4\u8BC1\u636E\u3002" }),
      items.length > 10 && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Pagination, { total: items.length, page, size: 10, unit: "\u9879\u8BC1\u636E", onPage: (page2) => setPosition({ scope, page: page2 }) })
    ] });
  }

  // src/client/components/DatasetKnowledge.tsx
  var import_jsx_runtime26 = __require("react/jsx-runtime");
  var statuses = { supported: "\u6709\u8BC1\u636E\u652F\u6301", provisional: "\u5F85\u9A8C\u8BC1", conflicted: "\u5B58\u5728\u77DB\u76FE" };
  function DatasetKnowledge({ knowledge }) {
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "iad-profile", children: [
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("strong", { children: knowledge.kind === "normal" ? "\u826F\u54C1\u77E5\u8BC6" : "\u4E0D\u826F\u77E5\u8BC6" }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("p", { children: knowledge.summary }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("small", { className: "iad-muted", children: [
        knowledge.version_id,
        " \xB7 ",
        knowledge.sources.length,
        " \u5F20\u6765\u6E90 \xB7 ",
        knowledge.checks.length,
        " \u9879\u5224\u636E"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("summary", { children: "\u68C0\u67E5\u5224\u636E" }),
        knowledge.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("strong", { children: [
            check.title,
            " \xB7 ",
            statuses[check.status]
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("p", { children: check.criterion }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("small", { className: "iad-muted", children: [
            check.subject,
            " \xB7 ",
            check.location
          ] }),
          !!check.allowed_variations.length && /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("p", { children: [
            "\u5141\u8BB8\u53D8\u5316\uFF1A",
            check.allowed_variations.join("\uFF1B")
          ] }),
          !!check.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
        ] }, check.check_id))
      ] })
    ] });
  }

  // src/client/components/RuleAssessments.tsx
  var import_jsx_runtime27 = __require("react/jsx-runtime");
  var statuses2 = { normal: "\u672A\u89C1\u5F02\u5E38", anomaly: "\u53D1\u73B0\u504F\u79BB", insufficient: "\u8BC1\u636E\u4E0D\u8DB3", not_applicable: "\u4E0D\u9002\u7528" };
  function RuleAssessments({ analysis, knowledge, onEvidence }) {
    const checks = new Map(knowledge.flatMap((snapshot) => snapshot.checks.map((check) => [check.check_id, check])));
    if (!analysis.check_assessments.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("details", { className: "iad-rule-assessments iad-analysis", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("summary", { children: [
        "\u68C0\u67E5\u9879 \xB7 ",
        analysis.check_assessments.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("ol", { children: analysis.check_assessments.map((assessment) => /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("li", { "data-check-id": assessment.check_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: checks.get(assessment.check_id)?.title || assessment.check_id }),
        " \xB7 ",
        statuses2[assessment.status],
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { children: assessment.description }),
        !!assessment.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "iad-muted", children: assessment.limitations.join("\uFF1B") }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(AuditEvidence, { analysis, ids: assessment.evidence_ids, label: checks.get(assessment.check_id)?.title || "\u68C0\u67E5\u9879", onEvidence })
      ] }, assessment.check_id)) })
    ] });
  }

  // src/client/components/HumanReviewForm.tsx
  var import_react24 = __require("react");

  // src/client/useReviewDraft.ts
  var import_react23 = __require("react");
  function useReviewDraft(datasetId, sampleId) {
    const key = `iad.review-draft:${datasetId}:${sampleId}`;
    const [state, setState] = (0, import_react23.useState)(() => {
      const draft = { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", decision: null, pending: null };
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
      setState({ draft: { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", decision: null, pending: null }, dirty: false });
    }
    return { ...state.draft, dirty: state.dirty, update, prepare, discard };
  }

  // src/client/components/HumanReviewForm.tsx
  var import_jsx_runtime28 = __require("react/jsx-runtime");
  function HumanReviewForm({ datasetId, sampleId, detail, onSubmitted, advanceOnSubmit = false }) {
    const draft = useReviewDraft(datasetId, sampleId);
    const formId = (0, import_react24.useId)();
    const [busy, setBusy] = (0, import_react24.useState)(false), [error2, setError] = (0, import_react24.useState)(""), [notice, setNotice] = (0, import_react24.useState)("");
    const openedAt = (0, import_react24.useRef)(Date.now());
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
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("section", { className: "iad-decision", children: [
      /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "iad-decision-scroll", children: [
        draft.pending ? /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("p", { role: "status", children: "\u63D0\u4EA4\u7ED3\u679C\u5F85\u786E\u8BA4" }) : draft.dirty && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { role: "status", children: "\u8349\u7A3F\u672A\u63D0\u4EA4" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("button", { disabled: busy, onClick: draft.discard, children: "\u653E\u5F03\u8349\u7A3F" })
        ] }),
        detail.review_decision && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("p", { children: [
          "\u5F53\u524D\uFF1A",
          reviewLabel(detail.review_decision.decision),
          " \xB7 ",
          detail.review_decision.reviewer,
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("br", {}),
          detail.review_decision.comment
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("form", { id: formId, onSubmit: (event) => {
          event.preventDefault();
          if (draft.decision) void submit(draft.decision);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("fieldset", { className: "iad-review-options", disabled: busy || !!draft.pending, children: [
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("legend", { children: "\u88C1\u51B3" }),
            Object.entries(reviewLabels).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("input", { type: "radio", name: `decision:${sampleId}`, value, checked: (draft.pending?.decision || draft.decision) === value, onChange: () => draft.update({ decision: value }) }),
              label
            ] }, value))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u4EBA",
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("input", { required: true, value: draft.reviewer, disabled: busy || !!draft.pending, onChange: (e) => draft.update({ reviewer: e.target.value }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u8BF4\u660E",
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("textarea", { value: draft.comment, disabled: busy || !!draft.pending, onChange: (e) => draft.update({ comment: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("details", { className: "iad-review-history", children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("summary", { children: [
            "\u590D\u6838\u8BB0\u5F55 \xB7 ",
            detail.review_history.length,
            " \u6B21"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("ol", { children: detail.review_history.map((record) => /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("li", { "data-decision-id": record.decision_id, children: [
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("strong", { children: reviewLabel(record.decision) }),
            " \xB7 ",
            record.reviewer,
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("br", {}),
            record.submitted_at ? /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "\u672A\u8BB0\u5F55\u63D0\u4EA4\u65F6\u95F4",
            record.comment && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("p", { children: record.comment })
          ] }, record.decision_id)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("footer", { className: "iad-review-submit", children: [
        error2 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        notice && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("p", { role: "status", children: notice }),
        draft.pending ? /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("button", { type: "button", className: "iad-primary", disabled: busy, onClick: () => submit(draft.pending.decision), children: "\u91CD\u8BD5\u63D0\u4EA4" }) : /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("button", { type: "submit", form: formId, className: "iad-primary", disabled: busy || !draft.decision || !draft.reviewer.trim(), children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : "\u63D0\u4EA4\u590D\u6838" }),
        advanceOnSubmit && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("small", { className: "iad-muted", children: "\u63D0\u4EA4\u6210\u529F\u540E\u8FDB\u5165\u4E0B\u4E00\u5F20" })
      ] })
    ] });
  }

  // src/client/models.tsx
  var import_react25 = __require("react");
  var import_jsx_runtime29 = __require("react/jsx-runtime");
  var ModelContext = (0, import_react25.createContext)(null);
  function WorkbenchModelProvider({ children }) {
    const [view, setView] = (0, import_react25.useState)(null), [loading, setLoading] = (0, import_react25.useState)(true), [error2, setError] = (0, import_react25.useState)("");
    const pending = (0, import_react25.useRef)(null);
    const refresh = (0, import_react25.useCallback)(async () => {
      pending.current?.abort();
      const controller = pending.current = new AbortController();
      setLoading(true);
      try {
        const value = await request("/models", void 0, void 0, controller.signal);
        if (!controller.signal.aborted) {
          setView(value);
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(message(failure));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, []);
    (0, import_react25.useEffect)(() => {
      void refresh();
      const focus = () => {
        void refresh();
      };
      window.addEventListener("focus", focus);
      return () => {
        pending.current?.abort();
        window.removeEventListener("focus", focus);
      };
    }, [refresh]);
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(ModelContext.Provider, { value: { view, loading, error: error2, refresh }, children });
  }
  function useWorkbenchModel() {
    const context = (0, import_react25.useContext)(ModelContext);
    if (!context) throw new Error("\u5DE5\u4F5C\u53F0\u6A21\u578B\u4E0A\u4E0B\u6587\u672A\u6CE8\u518C");
    return { ...context, ready: !context.loading && !context.error && context.view?.ready === true };
  }
  function WorkbenchModelStatus() {
    const { workspace } = useWorkspace(), { view, loading, error: error2 } = useWorkbenchModel();
    const provider = view?.providers.find((row) => row.provider_id === view.selection?.provider_id);
    const model = provider?.models.find((row) => row.model_id === view?.selection?.model_id);
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "iad-model-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { children: loading ? "\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u2026" : error2 || view?.error || (view?.selection ? `${provider?.name || view.selection.provider_id} \xB7 ${model?.name || view.selection.model_id}` : "\u4F7F\u7528\u5F53\u524D\u670D\u52A1\u914D\u7F6E") }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("button", { onClick: () => workspace.navigate("industrial-model-settings"), children: "\u6A21\u578B\u8BBE\u7F6E" })
    ] });
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
  var jobPhases = {
    PREPARING_EXPLORATION: "\u51C6\u5907\u63A2\u7D22\u56FE\u7EC4",
    EXPLORING_DIRECTIONS: "\u8054\u5408\u63A2\u7D22\u65B9\u5411",
    DIRECTIONS_PUBLISHED: "\u65B9\u5411\u5DF2\u4FDD\u5B58",
    PREPARING_KNOWLEDGE: "\u51C6\u5907\u51BB\u7ED3\u77E5\u8BC6",
    GLOBAL: "\u5168\u56FE\u89C2\u5BDF",
    REGIONS: "ROI \u7EC6\u770B",
    SYNTHESIS: "\u5168\u56FE\u4E0E ROI \u8054\u5408\u5206\u6790",
    SAMPLE_COMPLETED: "\u56FE\u50CF\u5BA1\u8BA1\u5B8C\u6210",
    LEARNING_NORMAL: "\u5F52\u7EB3\u826F\u54C1\u77E5\u8BC6",
    LEARNING_DEFECT: "\u5F52\u7EB3\u4E0D\u826F\u54C1\u77E5\u8BC6",
    VERIFYING_NORMAL: "\u6838\u9A8C\u826F\u54C1\u7591\u70B9",
    VERIFYING_DEFECT: "\u6838\u9A8C\u6807\u6CE8\u4E0E\u5F02\u5E38\u77E5\u8BC6",
    OBSERVING_PRESET: "\u89C2\u5BDF\u51BB\u7ED3\u5224\u636E",
    RECHECKING_HUMAN_KNOWLEDGE: "\u6838\u9A8C\u4EBA\u5DE5\u77E5\u8BC6\u5904\u7F6E",
    COMPARING_KNOWLEDGE: "\u6BD4\u8F83\u65B0\u65E7\u8BC1\u636E",
    RECHECKING_CRITERIA: "\u91CD\u6838\u9A8C\u4FEE\u8BA2\u5224\u636E",
    KNOWLEDGE_PUBLISHED: "\u77E5\u8BC6\u5DF2\u53D1\u5E03",
    KNOWLEDGE_REUSED: "\u590D\u7528\u5DF2\u6838\u9A8C\u77E5\u8BC6"
  };

  // src/client/components/SampleInspector.tsx
  var import_jsx_runtime30 = __require("react/jsx-runtime");
  function SampleInspector({ dataset, sampleId, mode, revision, onReviewed, jobs, onJobsChanged, navigation: navigation2, queue, filters, advanceOnSubmit = false, panel }) {
    const { workspace, state } = useWorkspace();
    const model = useWorkbenchModel();
    const [loadedDetail, setDetail] = (0, import_react26.useState)(null);
    const detail = loadedDetail?.sample.sample_id === sampleId ? loadedDetail : null;
    const [error2, setError] = (0, import_react26.useState)("");
    const [busy, setBusy] = (0, import_react26.useState)(false);
    const job = jobs.find((job2) => job2.sample_ids.includes(sampleId));
    const jobRunning = jobs.some((job2) => job2.status === "RUNNING" || job2.status === "PENDING");
    const [lightbox, setLightbox] = (0, import_react26.useState)(null);
    const onPanelOpen = panel?.onOpen;
    (0, import_react26.useEffect)(() => {
      if (lightbox) onPanelOpen?.(true);
    }, [lightbox, onPanelOpen]);
    const imageButton = (0, import_react26.useRef)(null);
    (0, import_react26.useEffect)(() => {
      setDetail(null);
      setError("");
      setLightbox(null);
    }, [sampleId]);
    (0, import_react26.useEffect)(() => {
      const saved = workspace.view(workspace.getSnapshot().pageId).inspection;
      if (!saved || saved.reference.sample_id !== sampleId) return;
      const controller = new AbortController();
      request("/inspection/context", saved.reference, void 0, controller.signal).then((snapshot) => {
        if (!controller.signal.aborted) setLightbox(inspectionImage({ reference: snapshot.reference, analysis: snapshot.analysis, historical: !snapshot.is_latest }, saved.selection, saved.transform));
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [sampleId, workspace]);
    (0, import_react26.useEffect)(() => {
      if (!sampleId) return;
      const controller = new AbortController();
      request(`/sample/${encodeURIComponent(sampleId)}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setDetail(value);
      }).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
      return () => controller.abort();
    }, [sampleId, revision]);
    async function audit() {
      setBusy(true);
      setError("");
      try {
        const view = workspace.view("industrial-audit");
        const input = {
          dataset_id: dataset.dataset_id,
          sample_ids: [sampleId],
          normal_version_id: view.normalVersion || void 0,
          defect_version_id: view.defectVersion || void 0
        };
        const job2 = await request("/audit/start", input);
        workspace.updateView("industrial-audit", { job: job2.run_id });
        onJobsChanged();
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    const evidenceSource = (evidence) => {
      const suggestion = detail.suggestion;
      const analysis = suggestion.analysis;
      return inspectionImage({ reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: suggestion.suggestion_id }, analysis }, { kind: "evidence", id: evidence.evidence_id });
    };
    const image = (0, import_react26.useMemo)(() => detail ? {
      src: mediaUrl(detail.sample),
      title: detail.sample.relative_path.split("/").pop(),
      width: detail.sample.width,
      height: detail.sample.height,
      annotationLayer: { kind: "sample", annotations: detail.annotations, sample: detail.sample },
      inspection: detail.suggestion?.analysis ? { reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: detail.suggestion.suggestion_id }, analysis: detail.suggestion.analysis } : void 0
    } : null, [detail, dataset.dataset_id, sampleId]);
    (0, import_react26.useEffect)(() => {
      if (navigation2?.open && image && detail?.sample.sample_id === sampleId) {
        imageButton.current?.focus({ preventScroll: true });
        setLightbox({ ...image, initialSelection: null, initialTransform: { zoom: 0, x: 0, y: 0 } });
        navigation2.opened();
      }
    }, [navigation2, image, detail, sampleId]);
    const information = detail && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(import_jsx_runtime30.Fragment, { children: [
      "      ",
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("dl", { className: "iad-info-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { title: detail.sample.image_path, children: detail.sample.image_path }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u56FE\u50CF\u540D" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "UUID" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { "data-field": "sample-uuid", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("dd", { "data-field": "raw-label", children: [
          detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "\u672A\u6807\u8BB0",
          detail.sample.quality_source ? ` \xB7 ${detail.sample.quality_source}` : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u5206\u8FA8\u7387" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("dd", { children: [
          detail.sample.width,
          " \xD7 ",
          detail.sample.height
        ] }),
        mode !== "review" && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(import_jsx_runtime30.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u4EBA\u5DE5\u7ED3\u679C" }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { children: detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} \xB7 ${detail.review_decision.reviewer}` : "\u5F85\u4EBA\u5DE5\u590D\u6838" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { children: detail.technical_quality_score })
      ] }),
      dataset.format !== "folder_classification" && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("section", { className: "iad-info-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("h3", { children: [
          "Labelme \u6807\u6CE8 \xB7 ",
          detail.annotations.length
        ] }),
        detail.annotations.length ? detail.annotations.map((a) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "iad-annotation", children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("strong", { children: a.raw_label }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { children: [
            a.bbox?.join(", "),
            " \xB7 ",
            a.geometry_status
          ] })
        ] }, a.annotation_id)) : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }),
        detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index3) => /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: i.message }, index3)) })
      ] }),
      dataset.format === "folder_classification" && detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("section", { className: "iad-info-group", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index3) => /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: i.message }, index3)) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("section", { className: "iad-info-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
        detail.suggestion ? /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(import_jsx_runtime30.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("strong", { children: modelLabels[detail.suggestion.suggested_label] }),
            " \xB7 ",
            detail.suggestion.reason_category,
            " \xB7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ",
            detail.suggestion.confidence === null ? "\u672A\u8BB0\u5F55" : `${Math.round(detail.suggestion.confidence * 100)}%`
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "iad-observation", children: detail.suggestion.notes }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("small", { className: "iad-muted", children: detail.suggestion.model_name }),
          detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("summary", { children: [
              "\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \xB7 ",
              detail.suggestion.reference_sample_ids.length,
              " \u5F20"
            ] }),
            detail.normal_knowledge && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(KnowledgeEvidenceGallery, { versionId: detail.normal_knowledge.version_id, items: detail.normal_knowledge.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)), onOpen: setLightbox })
          ] }),
          detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(RuleAssessments, { analysis: detail.suggestion.analysis, knowledge: [...detail.normal_knowledge ? [detail.normal_knowledge] : [], ...detail.defect_knowledge ? [detail.defect_knowledge] : []], onEvidence: (image2) => setLightbox(evidenceSource(image2)) }),
          detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("details", { className: "iad-analysis", children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }),
            detail.normal_knowledge ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }),
            detail.defect_knowledge && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(DatasetKnowledge, { knowledge: detail.defect_knowledge }),
            !!detail.suggestion.analysis.knowledge_limitations.length && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: "iad-muted", children: [
              "\u77E5\u8BC6\u9650\u5236\uFF1A",
              detail.suggestion.analysis.knowledge_limitations.join("\uFF1B")
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: [
              "\u5C40\u90E8\u8986\u76D6 ",
              detail.suggestion.analysis.coverage.inspected_regions,
              " / ",
              detail.suggestion.analysis.coverage.planned_regions,
              " \xB7 ",
              detail.suggestion.analysis.coverage.complete ? "\u8BA1\u5212\u5DF2\u8986\u76D6" : "\u68C0\u67E5\u672A\u5B8C\u6210"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [
              /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview), alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { children: [
                "\u5168\u56FE \xB7 ",
                detail.suggestion.analysis.overview.sent_size.join(" \xD7 "),
                detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: detail.suggestion.analysis.global_view.description }),
            detail.suggestion.analysis.regions.map((region, index3) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("h3", { children: [
                "\u5C40\u90E8 \xB7 ",
                region.origins.map((origin) => origin.label).join(" / ")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("small", { children: [
                regionSources[region.source],
                " \xB7 \u539F\u56FE\u5750\u6807 ",
                region.crop_bbox.join(", ")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, region.image), alt: `\u5BA1\u8BA1 ROI ${index3 + 1}` }),
                /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { children: [
                  region.image.sent_size.join(" \xD7 "),
                  " \xB7 PNG",
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: region.observation.description }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
                "\u4F4D\u7F6E\uFF1A",
                region.observation.position_analysis
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
                "\u5149\u7167\uFF1A",
                region.observation.illumination_analysis
              ] })
            ] }, index3)),
            detail.suggestion.analysis.auxiliary_evidence.map((image2) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image2)), children: [
              /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, image2), alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }),
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { children: [
                "\u6807\u6CE8\u5B9A\u4F4D\u56FE",
                detail.suggestion.analysis.conclusion.evidence_ids.includes(image2.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
              ] })
            ] }, image2.evidence_id)),
            detail.suggestion.analysis.conclusion.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: "iad-error", children: [
              "\u89C2\u5BDF\u77DB\u76FE\uFF1A",
              detail.suggestion.analysis.conclusion.conflicts.join("\uFF1B")
            ] }),
            detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: "iad-error", children: [
              "\u7F3A\u5931\u8BC1\u636E\uFF1A",
              detail.suggestion.analysis.conclusion.missing_evidence.join("\uFF1B")
            ] }),
            detail.suggestion.analysis.joint_steps.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("summary", { children: [
                "\u8054\u5408\u5206\u6790\u8BB0\u5F55 \xB7 ",
                detail.suggestion.analysis.joint_steps.length,
                " \u6B65"
              ] }),
              detail.suggestion.analysis.joint_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("strong", { children: [
                  step.step_id,
                  " \xB7 ",
                  modelLabels[step.result.suggested_label]
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
                  step.input_evidence_ids.length,
                  " \u5F20\u56FE\u50CF",
                  step.child_step_ids.length ? ` \xB7 \u6C47\u603B ${step.child_step_ids.join("\u3001")}` : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: step.result.description }),
                "resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index3) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
                    "\u5DF2\u6392\u9664\u7591\u70B9\uFF1A",
                    resolution.description
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
                    "\u6B63\u5E38\u89E3\u91CA\uFF1A",
                    resolution.normal_explanation
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(AuditEvidence, { analysis: detail.suggestion.analysis, ids: resolution.evidence_ids, label: resolution.description, onEvidence: (image2) => setLightbox(evidenceSource(image2)) })
                ] }, index3))
              ] }, step.step_id))
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: "iad-muted", children: [
              "\u7ED3\u8BBA\u5F15\u7528 ",
              detail.suggestion.analysis.conclusion.evidence_ids.length,
              " \u9879\u89C6\u89C9\u8BC1\u636E"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
              "\u4F4D\u7F6E\u5206\u6790\uFF1A",
              detail.suggestion.analysis.conclusion.position_analysis
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
              "\u5149\u7167\u5206\u6790\uFF1A",
              detail.suggestion.analysis.conclusion.illumination_analysis
            ] })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })
      ] })
    ] });
    const decision = detail && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId, detail, advanceOnSubmit, onSubmitted: (record) => onReviewed(record, detail.sample.relative_path) }, sampleId);
    const lightboxView = /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(import_jsx_runtime30.Fragment, { children: [
      "    ",
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ImageViewer, { image: lightbox, navigation: navigation2, onClose: () => {
        navigation2?.cancel();
        setLightbox(null);
        if (workspace.view(state.pageId).inspection) workspace.updateView(state.pageId, { inspection: null }, true);
      } })
    ] });
    if (queue !== void 0) return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "iad-inspector iad-focused-inspector", children: [
      error2 && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ReviewWorkspace, { queue, filters, information, decision, image: image && !lightbox ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ImageCanvas, { image, embedded: true, navigation: navigation2 ? { ...navigation2, move: (offset4) => navigation2.move(offset4, "embedded") } : void 0, onExpand: (view) => setLightbox({ ...image, initialSelection: view.selection, initialTransform: view.transform }) }) : !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "iad-empty", children: "\u5F53\u524D\u590D\u6838\u961F\u5217\u5DF2\u5904\u7406\u5B8C\u6210\uFF0C\u6216\u6CA1\u6709\u5339\u914D\u7684\u6837\u672C\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6837\u672C\u2026" }) : null }, sampleId),
      lightboxView
    ] });
    const body = /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("aside", { className: "iad-inspector", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("h2", { children: mode === "review" ? "\u590D\u6838\u660E\u7EC6" : "\u6837\u672C\u8BE6\u60C5" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(import_jsx_runtime30.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { ref: imageButton, className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(AnnotatedImage, { image }) }) }, image.src),
        mode === "model" ? /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(import_jsx_runtime30.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("strong", { className: "iad-inspector-filename", "data-field": "image-name", title: detail.sample.relative_path, children: detail.sample.relative_path.split("/").pop() }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("dl", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { children: detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "\u672A\u6807\u8BB0" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u4EBA\u5DE5\u7ED3\u679C" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { children: detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} \xB7 ${detail.review_decision.reviewer}` : "\u5F85\u4EBA\u5DE5\u590D\u6838" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dt", { children: "\u6A21\u578B\u5EFA\u8BAE" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("dd", { children: detail.suggestion ? modelLabels[detail.suggestion.suggested_label] : "\u5C1A\u672A\u5BA1\u8BA1" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "iad-observation iad-observation-summary", children: detail.suggestion?.notes || "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" }),
          detail.suggestion && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: "iad-muted iad-inspector-basis", children: [
            "\u51BB\u7ED3\u4F9D\u636E\uFF1A\u826F\u54C1 ",
            detail.normal_knowledge ? "\u5DF2\u5173\u8054" : "\u672A\u5173\u8054",
            " \xB7 \u5F02\u5E38 ",
            detail.defect_knowledge ? "\u5DF2\u5173\u8054" : "\u672A\u5173\u8054"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "iad-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { onClick: () => workspace.navigate("industrial-review", sampleId), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { disabled: busy || jobRunning || !model.ready, onClick: audit, children: busy || jobRunning ? "\u6B63\u5728\u8054\u5408\u5BA1\u8BA1\u2026" : "\u6309\u77E5\u8BC6\u5BA1\u8BA1\u6B64\u56FE" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("details", { className: "iad-audit-details", children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("summary", { children: "\u6837\u672C\u4FE1\u606F\u4E0E\u5BA1\u8BA1\u8BE6\u60C5" }),
            information
          ] })
        ] }) : information,
        mode === "model" && job && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("section", { className: "iad-single-job", "aria-label": "\u5F53\u524D\u6837\u672C\u4F5C\u4E1A", children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { role: "status", children: [
            job.cancel_requested && ["PENDING", "RUNNING"].includes(job.status) ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[job.status],
            " \xB7 ",
            jobPhases[job.phase || ""] || job.message
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { onClick: () => workspace.updateView("industrial-audit", { tab: "jobs", job: job.run_id }), children: "\u67E5\u770B\u6B64\u56FE\u5BA1\u8BA1\u4F5C\u4E1A" })
        ] }),
        mode === "review" && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId, detail, advanceOnSubmit, onSubmitted: (record) => onReviewed(record, detail.sample.relative_path) }, sampleId)
      ] }),
      lightboxView
    ] });
    const presentation = lightbox ? "inline" : panel?.presentation;
    return panel ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(Modal, { title: "\u6837\u672C\u8BE6\u60C5", onClose: panel.onClose, restoreFocus: panel.restoreFocus, presentation, className: `iad-audit-sample ${presentation === "modal" ? "iad-drawer" : ""}`, children: body }) : body;
  }

  // src/client/components/AuditSetup.tsx
  var import_react28 = __require("react");

  // src/client/useKnowledge.ts
  var import_react27 = __require("react");
  var empty = { knowledge: null, versions: [], freshness: null, eligible_source_count: 0, unavailable_source_count: 0 };
  function useKnowledge(datasetId, kind, versionId = "", revision = 0) {
    const queryIdentity = (0, import_react27.useMemo)(() => ({ scope: JSON.stringify([datasetId, kind, versionId]), revision }), [datasetId, kind, versionId, revision]);
    const [value, setValue] = (0, import_react27.useState)();
    (0, import_react27.useEffect)(() => {
      if (!datasetId || !kind) return;
      const controller = new AbortController();
      const query = new URLSearchParams({ dataset_id: datasetId, kind, ...versionId ? { version_id: versionId } : {} });
      request(`/knowledge?${query}`, void 0, void 0, controller.signal).then((data2) => {
        if (!controller.signal.aborted) setValue({ query: queryIdentity, data: data2, error: "" });
      }).catch((error2) => {
        if (!controller.signal.aborted) setValue((previous) => ({ query: queryIdentity, data: previous?.query.scope === queryIdentity.scope ? previous.data : empty, error: message(error2) }));
      });
      return () => controller.abort();
    }, [queryIdentity]);
    if (!datasetId || !kind) return { ...empty, loading: false, error: "" };
    const data = value?.query.scope === queryIdentity.scope ? value.data : empty;
    return { ...data, loading: value?.query !== queryIdentity, error: value?.query === queryIdentity ? value.error : "" };
  }

  // src/client/components/KnowledgeState.tsx
  var import_jsx_runtime31 = __require("react/jsx-runtime");
  var reasons = { image: "\u56FE\u50CF\u5185\u5BB9\u53D8\u5316", annotations: "\u5DF2\u5BFC\u5165\u6807\u6CE8\u53D8\u5316", review: "\u4EBA\u5DE5\u53CD\u9988\u53D8\u5316", audit_candidates: "\u5BA1\u8BA1\u5019\u9009\u53D8\u5316", qualification: "\u6765\u6E90\u8D44\u683C\u53D8\u5316", unavailable: "\u6765\u6E90\u65E0\u6CD5\u8BFB\u53D6\u6216\u6838\u9A8C" };
  function KnowledgeState({ freshness }) {
    if (!freshness) return null;
    if (freshness.status === "current") return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("p", { role: "status", "aria-label": "\u77E5\u8BC6\u6765\u6E90\u72B6\u6001", className: "iad-muted", title: `\u6838\u9A8C\u65F6\u95F4 ${new Date(freshness.checked_at).toLocaleString()}`, children: [
      "\u6765\u6E90\u4E0E\u751F\u6210\u89C4\u5219\u672A\u53D8\u5316\u3002",
      freshness.additional_source_ids.length > 0 && ` ${freshness.additional_source_ids.length} \u5F20\u5408\u683C\u5019\u9009\u672A\u8986\u76D6\u3002`
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("details", { "aria-label": "\u77E5\u8BC6\u6765\u6E90\u72B6\u6001", className: "iad-freshness", children: [
      /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("summary", { role: "status", children: freshness.status === "changed" ? freshness.source_changes.length ? "\u6765\u6E90\u53D1\u751F\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : "\u77E5\u8BC6\u4F9D\u8D56\u6216\u751F\u6210\u89C4\u5219\u53D1\u751F\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : freshness.status === "unverified" ? "\u751F\u6210\u89C4\u5219\u5C1A\u672A\u6838\u5B9E\uFF0C\u8BF7\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : "\u6765\u6E90\u4E0E\u751F\u6210\u89C4\u5219\u672A\u53D8\u5316\u3002" }),
      freshness.normal_version_changed && /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("p", { children: [
        "\u6240\u4F9D\u636E\u7684\u826F\u54C1\u7248\u672C\u5DF2\u975E\u5F53\u524D\u53D1\u5E03\u7248\u672C\u3002\u5F53\u524D\u826F\u54C1\uFF1A",
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("code", { children: freshness.current_normal_version_id || "\u65E0" })
      ] }),
      freshness.normal_sources_changed && /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("p", { children: "\u6240\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7684\u6765\u6E90\u6216\u751F\u6210\u89C4\u5219\u9700\u8981\u91CD\u65B0\u6838\u9A8C\u3002" }),
      freshness.generation_changed && /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("p", { children: "\u77E5\u8BC6\u751F\u6210\u89C4\u5219\u5DF2\u53D8\u5316\u3002" }),
      !!freshness.source_changes.length && /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("summary", { children: [
          freshness.source_changes.length,
          " \u5F20\u6765\u6E90\u9700\u8981\u6838\u9A8C"
        ] }),
        freshness.source_changes.map((change) => /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("p", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("code", { children: change.sample_id.slice(change.sample_id.indexOf(":") + 1) }),
          " \xB7 ",
          change.reasons.map((reason) => reasons[reason]).join("\u3001")
        ] }, change.sample_id))
      ] }),
      !!freshness.additional_source_ids.length && /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("p", { children: [
        freshness.additional_source_ids.length,
        " \u5F20\u5408\u683C\u5019\u9009\u672A\u7EB3\u5165\u6B64\u7248\u672C\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("small", { className: "iad-muted", children: [
        "\u6838\u9A8C\u65F6\u95F4 ",
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("time", { dateTime: freshness.checked_at, children: new Date(freshness.checked_at).toLocaleString() })
      ] })
    ] });
  }

  // src/client/components/AuditSetup.tsx
  var import_jsx_runtime32 = __require("react/jsx-runtime");
  function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged, onStarted }) {
    const { workspace } = useWorkspace();
    const view = workspace.view("industrial-audit");
    const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
    const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
    const normal = normalQuery.knowledge;
    const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
    const loading = normalQuery.loading || defectQuery.loading;
    const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "\u6240\u9009\u4E0D\u826F\u77E5\u8BC6\u4E0E\u826F\u54C1\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" : "");
    const [lightbox, setLightbox] = (0, import_react28.useState)(null);
    const model = useWorkbenchModel();
    const [busy, setBusy] = (0, import_react28.useState)(false);
    const [error2, setError] = (0, import_react28.useState)("");
    const [total, setTotal] = (0, import_react28.useState)(null);
    const scopeQuery = sampleQuery(dataset.dataset_id, filters, 1, 1);
    (0, import_react28.useEffect)(() => {
      const controller = new AbortController();
      setTotal(null);
      setError("");
      request(`/samples/${encodeURIComponent(dataset.task_id)}?${scopeQuery}`, void 0, void 0, controller.signal).then((result) => {
        if (!controller.signal.aborted) setTotal(result.total);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [dataset.task_id, scopeQuery]);
    async function start() {
      setBusy(true);
      setError("");
      try {
        const input = {
          dataset_id: dataset.dataset_id,
          normal_version_id: normal?.version_id,
          defect_version_id: defect?.version_id,
          filters
        };
        const job = await request("/audit/start", input);
        onJobsChanged();
        onStarted?.(job);
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    const normalDetails = normal && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(DatasetKnowledge, { knowledge: normal }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(KnowledgeEvidenceGallery, { versionId: normal.version_id, items: normal.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw"), onOpen: setLightbox })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("section", { className: "iad-job-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(WorkbenchModelStatus, {}),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("h3", { children: "\u77E5\u8BC6\u4F9D\u636E" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "iad-config-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("label", { className: "iad-field", children: [
            "\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: loading, onChange: (event) => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("option", { value: "", children: "\u5F53\u524D\u7248\u672C" }),
              normalQuery.versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("label", { className: "iad-field", children: [
            "\u4E0D\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u4E0D\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.defectVersion, disabled: loading || !normal, onChange: (event) => workspace.updateView("industrial-audit", { defectVersion: event.target.value }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("option", { value: "", children: "\u5339\u914D\u7684\u5F53\u524D\u7248\u672C" }),
              defectQuery.versions.filter((version) => version.normal_version_id === normal?.version_id).map((version) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { "aria-label": "\u5BA1\u8BA1\u6267\u884C\u8303\u56F4", children: [
          "\u5F53\u524D\u7B5B\u9009\u7684\u5168\u90E8 ",
          total === null ? "\u2026" : total,
          " \u5F20\u56FE\u50CF \xB7 \u5168\u56FE\u4E0E\u5168\u90E8\u9002\u7528 ROI \u8054\u5408\u5206\u6790"
        ] }),
        loading ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u77E5\u8BC6\u2026" }) : loadError ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "alert", className: "iad-error", children: loadError }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
          normal ? /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(KnowledgeState, { freshness: normalQuery.freshness }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("summary", { children: [
                "\u826F\u54C1\u77E5\u8BC6 \xB7 ",
                normal.checks.filter((check) => check.status === "supported").length,
                " \u9879\u6709\u8BC1\u636E\u652F\u6301"
              ] }),
              normalDetails
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "iad-profile iad-muted", children: [
            "\u8BF7\u5148\u6316\u6398\u826F\u54C1\u77E5\u8BC6\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002",
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: "normal" }), children: "\u524D\u5F80\u6316\u6398\u826F\u54C1\u77E5\u8BC6" })
          ] }),
          defect ? /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(KnowledgeState, { freshness: defectQuery.freshness }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("summary", { children: [
                "\u4E0D\u826F\u77E5\u8BC6 \xB7 ",
                defect.checks.length,
                " \u9879\u5224\u636E"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(DatasetKnowledge, { knowledge: defect })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("button", { className: "iad-primary", disabled: busy || loading || total === null || total === 0 || !!loadError || !model.ready || !normal?.checks.some((check) => check.status === "supported") || jobs.some((job) => job.status === "RUNNING" || job.status === "PENDING"), onClick: start, children: busy ? "\u542F\u52A8\u4E2D\u2026" : "\u5BA1\u8BA1\u5F53\u524D\u7B5B\u9009\u5168\u90E8\u56FE\u50CF" }) })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_react33 = __require("react");

  // src/client/components/JobTable.tsx
  var import_react31 = __require("react");

  // src/client/components/JobDetail.tsx
  var import_react30 = __require("react");

  // src/client/components/KnowledgeJobEvidence.tsx
  var import_react29 = __require("react");
  var import_jsx_runtime33 = __require("react/jsx-runtime");
  function KnowledgeJobEvidence({ job }) {
    const [open, setOpen] = (0, import_react29.useState)(false), [page, setPage] = (0, import_react29.useState)(1);
    const [result, setResult] = (0, import_react29.useState)(null), [error2, setError] = (0, import_react29.useState)("");
    const [image, setImage] = (0, import_react29.useState)(null);
    (0, import_react29.useEffect)(() => {
      if (!open) return;
      const controller = new AbortController();
      setError("");
      request(`/knowledge/observations/${encodeURIComponent(job.run_id)}?page=${page}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setResult(value);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [open, page, job.run_id, job.status, job.observation_progress?.observed_visuals]);
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("details", { onToggle: (event) => setOpen(event.currentTarget.open), children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("summary", { children: "\u89C2\u5BDF\u8BC1\u636E" }),
      job.mining_prompt && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("summary", { children: "\u672C\u6B21\u51BB\u7ED3\u6316\u6398\u63D0\u793A\u8BCD" }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("pre", { className: "iad-observation", children: job.mining_prompt.instruction })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      open && !result && !error2 && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51BB\u7ED3\u89C2\u5BDF\u2026" }),
      open && result && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(import_jsx_runtime33.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { className: "iad-muted", children: [
          "\u89C4\u5212 ",
          result.progress.planned_visuals,
          " \u4E2A\u89C6\u56FE \xB7 \u5DF2\u63A5\u53D7\u89C2\u5BDF ",
          result.progress.observed_visuals,
          " \u4E2A \xB7 \u5DF2\u53D1\u5E03 ",
          result.progress.published_sources,
          " \u5F20\u6765\u6E90"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "iad-reference-grid", children: result.items.map((item) => {
          const src = `/api/iad/knowledge/observations/${encodeURIComponent(job.run_id)}/evidence/${encodeURIComponent(item.image.evidence_id)}`;
          const title = `${item.image.role} \xB7 ${item.observed ? "\u5DF2\u63A5\u53D7\u89C2\u5BDF" : "\u5C1A\u672A\u5B8C\u6210\u89C2\u5BDF"}`;
          return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("button", { title: "\u653E\u5927\u51BB\u7ED3\u89C2\u5BDF\u8BC1\u636E", onClick: () => setImage({ src, title, width: item.image.sent_size[0], height: item.image.sent_size[1] }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("img", { src, alt: title, loading: "lazy" }),
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("small", { children: title })
          ] }, item.image.evidence_id);
        }) }),
        !result.total && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { children: "\u5C1A\u672A\u89C4\u5212\u56FE\u50CF\u8BC1\u636E\u3002" }),
        result.total > result.page_size && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("button", { disabled: page <= 1, onClick: () => setPage((value) => value - 1), children: "\u4E0A\u4E00\u9875\u8BC1\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("span", { children: [
            "\u7B2C ",
            page,
            " \u9875"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("button", { disabled: page * result.page_size >= result.total, onClick: () => setPage((value) => value + 1), children: "\u4E0B\u4E00\u9875\u8BC1\u636E" })
        ] })
      ] }),
      image && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(ImageViewer, { image, onClose: () => setImage(null) })
    ] });
  }

  // src/client/components/JobDetail.tsx
  var import_jsx_runtime34 = __require("react/jsx-runtime");
  var sampleName = (sample) => sample.relative_path || sample.sample_uuid;
  function JobDetail({ job, onChanged }) {
    const { workspace } = useWorkspace();
    const kind = job.job_type === "MODEL_AUDIT" ? "audit" : job.job_type === "DIRECTION_EXPLORATION" ? "exploration" : "knowledge";
    const page = kind === "audit" ? "industrial-audit" : kind === "exploration" ? "industrial-exploration" : "industrial-knowledge";
    const active = job.status === "RUNNING" || job.status === "PENDING";
    const [busy, setBusy] = (0, import_react30.useState)(false);
    const [error2, setError] = (0, import_react30.useState)("");
    const [expanded, setExpanded] = (0, import_react30.useState)(false);
    const [options, setOptions] = (0, import_react30.useState)(null);
    const [selected, setSelected] = (0, import_react30.useState)([]);
    const [revision, setRevision] = (0, import_react30.useState)(0);
    const article = (0, import_react30.useRef)(null);
    const focused = workspace.view(page, job.kind ?? void 0).job === job.run_id;
    (0, import_react30.useEffect)(() => {
      if (focused) article.current?.scrollIntoView({ block: "nearest" });
    }, [focused]);
    (0, import_react30.useEffect)(() => {
      if (!expanded || kind === "exploration") return;
      const controller = new AbortController();
      setOptions(null);
      setError("");
      request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, void 0, void 0, controller.signal).then((options2) => {
        if (!controller.signal.aborted) {
          setOptions(options2);
          setSelected(options2.samples.map((sample) => sample.sample_id));
        }
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [expanded, revision, job.run_id, kind]);
    async function cancel() {
      setBusy(true);
      setError("");
      try {
        await request(`/${kind}/cancel/${encodeURIComponent(job.run_id)}`, {});
        onChanged();
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    async function retry() {
      setBusy(true);
      setError("");
      try {
        const next = await request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, kind === "exploration" ? {} : { sample_ids: selected });
        workspace.updateView(page, { job: next.run_id });
        setExpanded(false);
        onChanged();
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    function locate(sampleId) {
      workspace.navigate(kind === "audit" ? "industrial-audit" : "industrial-images", sampleId);
    }
    function related(runId) {
      workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? void 0, job: runId, tab: "jobs" });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("article", { ref: article, className: "iad-job", "data-job-id": job.run_id, "aria-label": `\u4F5C\u4E1A ${job.run_id}`, "aria-current": focused || void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("strong", { role: "status", children: active && job.cancel_requested ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[job.status] }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("span", { children: [
          job.model_profile?.provider_name ? `${job.model_profile.provider_name} \xB7 ` : "",
          job.model_name
        ] }),
        active && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { disabled: busy || job.cancel_requested, onClick: cancel, children: job.cancel_requested ? "\u6B63\u5728\u505C\u6B62\u2026" : kind === "audit" ? "\u53D6\u6D88\u5BA1\u8BA1" : kind === "exploration" ? "\u53D6\u6D88\u63A2\u7D22" : "\u53D6\u6D88\u6316\u6398" }),
        kind === "knowledge" && !active && !job.deleted_at && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
          DeleteAction,
          {
            title: "\u5220\u9664\u4F5C\u4E1A",
            name: job.run_id,
            className: "iad-action-end",
            description: "\u4ECE\u4F5C\u4E1A\u5217\u8868\u5220\u9664\uFF0C\u4FDD\u7559\u5DF2\u53D1\u5E03\u77E5\u8BC6\u3001\u51BB\u7ED3\u8BC1\u636E\u53CA\u5386\u53F2\u5F15\u7528\u3002",
            restoreFocus: () => document.querySelector(".iad-knowledge-page .iad-tabs button.active"),
            onDelete: async () => {
              await request(`/knowledge/jobs/${encodeURIComponent(job.run_id)}`, void 0, "DELETE");
              if (focused) workspace.updateView(page, { job: "" });
              onChanged();
            }
          }
        )
      ] }),
      job.total_samples > 0 && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("progress", { "aria-label": "\u4F5C\u4E1A\u5904\u7406\u8FDB\u5EA6", value: job.progress, max: 1 }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { children: [
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
      kind === "knowledge" && job.observation_progress && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { className: "iad-muted", children: [
        "\u5DF2\u89C2\u5BDF ",
        job.observation_progress.observed_sources,
        " / ",
        job.observation_progress.planned_sources,
        " \u5F20 \xB7 \u5B8C\u6574\u89C6\u56FE ",
        job.observation_progress.complete_sources,
        " \u5F20 \xB7 \u5DF2\u53D1\u5E03 ",
        job.observation_progress.published_sources,
        " \u5F20"
      ] }),
      kind === "knowledge" && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(KnowledgeJobEvidence, { job }),
      active && job.cancel_requested ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "iad-muted", children: "\u7B49\u5F85\u5F53\u524D\u6A21\u578B\u8BF7\u6C42\u8FD4\u56DE\u540E\u505C\u6B62\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "iad-muted", children: jobPhases[job.phase || ""] || job.message }),
      job.current_sample && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { children: [
        "\u5F53\u524D\u56FE\u50CF ",
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => locate(job.current_sample.sample_id), title: job.current_sample.sample_uuid, children: sampleName(job.current_sample) })
      ] }),
      !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { className: "iad-muted", children: [
        "ROI ",
        job.inspected_regions || 0,
        " / ",
        job.planned_regions
      ] }),
      !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { className: "iad-muted", children: [
        "\u8054\u5408\u5224\u65AD ",
        job.completed_batches || 0,
        " / ",
        job.total_batches
      ] }),
      job.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("small", { className: "iad-muted", children: [
        "\u826F\u54C1\u7248\u672C ",
        job.normal_version_id,
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("br", {}),
        job.defect_version_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
          "\u4E0D\u826F\u7248\u672C ",
          job.defect_version_id,
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("br", {})
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("summary", { children: "\u51BB\u7ED3\u4F9D\u636E\u4E0E\u4EFB\u52A1\u6807\u8BC6" }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dt", { children: "\u4EFB\u52A1 ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dd", { children: job.run_id }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dt", { children: "\u6839\u4EFB\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dd", { children: job.root_run_id }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dt", { children: "\u5F00\u59CB\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dd", { children: job.started_at || "\u672A\u63D0\u4F9B" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dt", { children: "\u7ED3\u675F\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dd", { children: job.finished_at || "\u672A\u63D0\u4F9B" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dt", { children: "\u63D0\u4F9B\u5546" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dd", { children: job.model_profile?.provider_name || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dt", { children: "\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("dd", { children: job.model_name })
        ] })
      ] }),
      job.origin_session_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { disabled: busy, onClick: async () => {
        setBusy(true);
        setError("");
        try {
          await workspace.openSession(job.origin_session_id);
        } catch (error3) {
          setError(message(error3));
        } finally {
          setBusy(false);
        }
      }, children: "\u8FD4\u56DE\u53D1\u8D77\u4F1A\u8BDD" }) }),
      job.parent_run_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { className: "iad-job-links", children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("button", { onClick: () => related(job.parent_run_id), children: [
          "\u539F\u4F5C\u4E1A ",
          job.parent_run_id
        ] }),
        job.root_run_id !== job.parent_run_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("button", { onClick: () => related(job.root_run_id), children: [
          "\u8D77\u59CB\u4F5C\u4E1A ",
          job.root_run_id
        ] })
      ] }),
      job.knowledge_version_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => {
        workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? void 0, version: job.knowledge_version_id, tab: "results" });
      }, children: "\u67E5\u770B\u5DF2\u53D1\u5E03\u7248\u672C" }) }),
      !!job.errors.length && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("summary", { children: [
          "\u5931\u8D25\u8BE6\u60C5 \xB7 ",
          job.errors.length
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("ul", { className: "iad-job-errors", children: job.errors.map((error3, index3) => /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => locate(error3.sample_id), title: error3.sample_uuid, children: sampleName(error3) }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "iad-error", children: error3.message })
        ] }, index3)) })
      ] }),
      kind === "exploration" && job.exploration_version_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => workspace.updateView(page, { version: job.exploration_version_id, tab: "results" }), children: "\u67E5\u770B\u63A2\u7D22\u7ED3\u679C" }),
      kind === "exploration" && !active && job.status !== "COMPLETED" && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { disabled: busy, onClick: () => void retry(), children: "\u6309\u539F\u56FE\u7EC4\u91CD\u8BD5" }),
      kind !== "exploration" && !active && !job.deleted_at && job.status !== "COMPLETED" && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u91CD\u8BD5\u8303\u56F4" : "\u9009\u62E9\u91CD\u8BD5\u8303\u56F4" }),
      expanded && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("section", { className: "iad-retry-scope", "aria-label": "\u91CD\u8BD5\u8303\u56F4", children: [
        options ? /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
          options.active_run_id && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "status", children: "\u540C\u7C7B\u4F5C\u4E1A\u4ECD\u5728\u6267\u884C\uFF0C\u8BF7\u7ED3\u675F\u540E\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4\u3002" }),
          !options.samples.length ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { children: "\u5173\u8054\u4F5C\u4E1A\u5DF2\u5B8C\u6210\u5168\u90E8\u56FE\u50CF\uFF0C\u65E0\u9700\u91CD\u8BD5\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
            options.selection_mode === "all_sources" ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "iad-muted", children: "\u77E5\u8BC6\u8054\u5408\u5F52\u7EB3\u987B\u4F7F\u7528\u6574\u7EC4\u51BB\u7ED3\u6765\u6E90\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("div", { className: "iad-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => setSelected(options.samples.map((sample) => sample.sample_id)), children: "\u5168\u9009" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => setSelected(options.samples.filter((sample) => sample.state === "failed").map((sample) => sample.sample_id)), children: "\u4EC5\u5931\u8D25" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => setSelected(options.samples.filter((sample) => sample.state === "unprocessed").map((sample) => sample.sample_id)), children: "\u4EC5\u672A\u5904\u7406" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("fieldset", { disabled: busy || !!options.active_run_id, children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("legend", { children: "\u5931\u8D25\u6216\u672A\u5904\u7406\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("div", { className: "iad-retry-samples", children: options.samples.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("label", { title: sample.sample_uuid, children: [
                /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: selected.includes(sample.sample_id),
                    disabled: options.selection_mode === "all_sources",
                    onChange: (event) => setSelected((values) => event.target.checked ? [...values, sample.sample_id] : values.filter((id) => id !== sample.sample_id))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("span", { children: sampleName(sample) }),
                /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("small", { children: sample.state === "failed" ? "\u5931\u8D25" : "\u672A\u5904\u7406" })
              ] }, sample.sample_id)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { className: "iad-primary", disabled: busy || !selected.length || !!options.active_run_id, onClick: retry, children: busy ? "\u542F\u52A8\u91CD\u8BD5\u4E2D\u2026" : `\u91CD\u8BD5\u6240\u9009 ${selected.length} \u5F20` })
          ] })
        ] }) : !error2 && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u53EF\u91CD\u8BD5\u8303\u56F4\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { disabled: busy, onClick: () => setRevision((value) => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "alert", className: "iad-error", children: error2 })
    ] });
  }

  // src/client/components/JobTable.tsx
  var import_jsx_runtime35 = __require("react/jsx-runtime");
  var types = { MODEL_AUDIT: "\u6A21\u578B\u5BA1\u8BA1", NORMAL_KNOWLEDGE: "\u826F\u54C1\u77E5\u8BC6", DEFECT_KNOWLEDGE: "\u5F02\u5E38\u77E5\u8BC6", DIRECTION_EXPLORATION: "\u65B9\u5411\u63A2\u7D22" };
  function JobTable({ jobs, pageId, onChanged }) {
    const { workspace } = useWorkspace(), selected = workspace.view(pageId).job;
    const [page, setPage] = (0, import_react31.useState)(1), [status, setStatus] = (0, import_react31.useState)("");
    const filtered = jobs.filter((job2) => !status || job2.status === status);
    const index3 = filtered.findIndex((job2) => job2.run_id === selected);
    (0, import_react31.useEffect)(() => {
      if (index3 >= 0) setPage(Math.floor(index3 / 10) + 1);
    }, [selected, index3]);
    const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))), visible = filtered.slice((current - 1) * 10, current * 10);
    const job = jobs.find((job2) => job2.run_id === selected) || visible[0];
    return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("div", { className: "iad-job-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("label", { className: "iad-field", children: [
        "\u4EFB\u52A1\u72B6\u6001",
        /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("select", { "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: status, onChange: (event) => {
          setStatus(event.target.value);
          setPage(1);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
          Object.entries(jobStatuses).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("option", { value, children: label }, value))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u4F5C\u4E1A\u5217\u8868", children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { children: "\u4EFB\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { children: "\u7C7B\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { children: "\u72B6\u6001" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { className: "iad-number", children: "\u5B8C\u6210 / \u603B\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { className: "iad-number", children: "\u5931\u8D25" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { children: "\u5F00\u59CB\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("th", { children: "\u64CD\u4F5C" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("tbody", { children: visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("tr", { "data-selected": job?.run_id === item.run_id, children: [
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("td", { title: item.run_id, children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { className: "iad-identifier", children: item.run_id }) }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("td", { children: types[item.job_type] }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("td", { children: item.cancel_requested && (item.status === "RUNNING" || item.status === "PENDING") ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[item.status] }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("td", { className: "iad-number", children: [
            item.completed,
            " / ",
            item.total_samples
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("td", { className: "iad-number", children: item.failed }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("time", { dateTime: item.started_at || void 0, children: item.started_at ? new Date(item.started_at).toLocaleString() : "\u672A\u63D0\u4F9B" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("button", { "aria-label": `\u67E5\u770B\u4F5C\u4E1A ${item.run_id}`, onClick: () => workspace.updateView(pageId, { job: item.run_id }), children: "\u8BE6\u60C5" }) })
        ] }, item.run_id)) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Pagination, { total: filtered.length, page: current, size: 10, unit: "\u4E2A\u4F5C\u4E1A", onPage: setPage }),
      !filtered.length && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: "\u6CA1\u6709\u5339\u914D\u7684\u4F5C\u4E1A\u3002" }),
      job && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("section", { "aria-label": "\u4F5C\u4E1A\u8BE6\u60C5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h3", { children: "\u4F5C\u4E1A\u8BE6\u60C5" }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(JobDetail, { job, onChanged }, job.run_id)
      ] })
    ] });
  }

  // src/client/components/QualityReport.tsx
  var import_react32 = __toESM(__require("react"), 1);
  var import_jsx_runtime36 = __require("react/jsx-runtime");
  function QualityReport({ report }) {
    const quality = report.quality;
    const dimensions = [
      ["\u6280\u672F\u53EF\u7528\u7387", quality.technical_usability],
      ["\u5BA1\u8BA1\u8986\u76D6\u7387", quality.audit_coverage],
      ["\u4EBA\u5DE5\u6838\u9A8C\u8986\u76D6\u7387", quality.human_verification_coverage]
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "\u8986\u76D6\u4E0E\u53EF\u7528\u6027" }),
      /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dl", { children: dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_react32.default.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("strong", { children: ratio.percent === null ? "\u672A\u8BC4\u4F30" : `${ratio.percent}%` }),
          " \xB7 ",
          ratio.numerator,
          " / ",
          ratio.denominator
        ] })
      ] }, label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF\u4E0E\u4EBA\u5DE5\u6838\u9A8C" }),
      /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dl", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u7591\u70B9\u56FE\u50CF / \u6570" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
          quality.model.suspect_samples,
          " / ",
          quality.model.finding_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u7F3A\u8BC1 / \u51B2\u7A81\u56FE\u50CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
          quality.model.missing_evidence_samples,
          " / ",
          quality.model.conflict_samples
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u6A21\u578B\u4E0D\u786E\u5B9A" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: quality.model.uncertain_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u65E0\u7ED3\u6784\u5316\u5206\u6790" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: quality.model.unstructured_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u4EBA\u5BA1\u826F\u54C1 / \u5F02\u5E38" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
          "\u826F\u54C1 ",
          report.human_pass_count,
          " \xB7 \u5F02\u5E38 ",
          report.human_fail_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u4EBA\u5DE5\u5F85\u5B9A / \u8DF3\u8FC7" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
          report.human_uncertain_count,
          " / ",
          report.human_skipped_count
        ] })
      ] }),
      quality.label_comparison && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "\u6807\u7B7E\u5BF9\u7167" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u6807\u7B7E\u4E0D\u4E00\u81F4\u6BD4\u4F8B" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("strong", { children: quality.label_comparison.inconsistency_ratio.percent === null ? "\u672A\u8BC4\u4F30" : `${quality.label_comparison.inconsistency_ratio.percent}%` }),
            " \xB7 ",
            quality.label_comparison.inconsistency_ratio.numerator,
            " / ",
            quality.label_comparison.inconsistency_ratio.denominator,
            quality.label_comparison.source_changed_count > 0 && ` (\u6392\u9664\u6765\u6E90\u53D8\u52A8 ${quality.label_comparison.source_changed_count})`
          ] }),
          quality.label_comparison.source_unverified_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u6765\u6E90\u6307\u7EB9\u672A\u8BB0\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
              quality.label_comparison.source_unverified_count,
              " \u5F20\u5386\u53F2\u5EFA\u8BAE\u4E0D\u53C2\u4E0E\u6807\u7B7E\u5BF9\u7167"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E\u5206\u5E03" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
            "\u826F\u54C1 ",
            quality.label_comparison.raw_ok,
            " \xB7 \u5F02\u5E38 ",
            quality.label_comparison.raw_ng,
            " \xB7 \u672A\u6807\u8BB0 ",
            quality.label_comparison.raw_unlabeled
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u6A21\u578B\u5EFA\u8BAE\u5206\u5E03" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
            "\u826F\u54C1 ",
            quality.label_comparison.model_pass,
            " \xB7 \u5F02\u5E38 ",
            quality.label_comparison.model_fail,
            " \xB7 \u5F85\u5B9A ",
            quality.label_comparison.model_uncertain,
            " \xB7 \u672A\u5BA1\u8BA1 ",
            quality.label_comparison.unaudited
          ] }),
          quality.label_comparison.source_changed_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u5BA1\u8BA1\u540E\u6765\u6E90\u53D8\u52A8" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
              quality.label_comparison.source_changed_count,
              " \u5F20\u56FE\u50CF\u89C4\u5219\u6216\u6587\u4EF6\u5DF2\u66F4\u65B0\uFF0C\u4E0D\u53EF\u4F5C\u4E3A\u5F53\u524D\u6807\u7B7E\u6838\u9A8C\u4F9D\u636E"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("details", { className: "iad-analysis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("summary", { children: "\u53E3\u5F84\u3001\u8303\u56F4\u4E0E\u7248\u672C" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u8F93\u5165 / \u5DF2\u767B\u8BB0" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dd", { children: [
            quality.scope.observed_inputs,
            " / ",
            quality.scope.registered_samples,
            "\uFF0C\u672A\u767B\u8BB0 ",
            quality.scope.unregistered_inputs
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: "\u5168\u90E8\u5DF2\u4FDD\u5B58\u56FE\u50CF\uFF0C\u6BCF\u5F20\u53D6\u6700\u65B0\u8BB0\u5F55\uFF1B\u4E0D\u53D7\u5F53\u524D\u7F51\u683C\u7B5B\u9009\u5F71\u54CD\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u7EDF\u8BA1\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("time", { dateTime: report.generated_at, children: report.generated_at }) }),
          dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_react32.default.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: ratio.basis })
          ] }, label)),
          quality.label_comparison && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u6807\u7B7E\u5BF9\u7167\u53E3\u5F84" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: quality.label_comparison.inconsistency_ratio.basis })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "\u5BA1\u8BA1\u4F7F\u7528\u7684\u77E5\u8BC6\u7EC4\u5408" }),
        quality.knowledge_versions.length ? quality.knowledge_versions.map((usage, index3) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u56FE\u50CF\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: usage.sample_count }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: usage.normal_version_id || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u4E0D\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: usage.defect_version_id || "\u672A\u4F7F\u7528" }),
          usage.legacy_profile_id && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: "\u53C2\u8003\u6A21\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: usage.legacy_profile_id })
          ] })
        ] }, index3)) : /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { children: "\u5C1A\u65E0\u53EF\u8FFD\u6EAF\u7684\u77E5\u8BC6\u7248\u672C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        quality.audit_run_ids.length ? /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("ul", { children: quality.audit_run_ids.map((id) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("li", { children: id }, id)) }) : /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { children: "\u5C1A\u65E0\u5DF2\u8BB0\u5F55\u7684\u5BA1\u8BA1\u4F5C\u4E1A\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("ul", { children: quality.scope.limitations.map((text) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("li", { children: text }, text)) })
      ] })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_jsx_runtime37 = __require("react/jsx-runtime");
  function AuditJobs(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("section", { className: "iad-job-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
      /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(JobTable, { jobs: props.jobs, pageId: "industrial-audit", onChanged: props.onJobsChanged })
    ] });
  }
  function AuditReport({ dataset }) {
    const [report, setReport] = (0, import_react33.useState)(null);
    const [error2, setError] = (0, import_react33.useState)("");
    (0, import_react33.useEffect)(() => {
      const controller = new AbortController();
      request(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) {
          setReport(value);
          setError("");
        }
      }).catch((e) => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("section", { className: "iad-job-section iad-quality-report", children: [
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }),
        report && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: download, children: "\u5BFC\u51FA JSON" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "iad-muted", children: "\u5168\u90E8\u6570\u636E\u96C6\u56FE\u50CF \xB7 \u6BCF\u56FE\u6700\u65B0\u5DF2\u4FDD\u5B58\u8BB0\u5F55 \xB7 \u4E0D\u53D7\u7F51\u683C\u7B5B\u9009\u5F71\u54CD" }),
      !report && !error2 && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u6570\u636E\u96C6\u62A5\u544A\u2026" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      report && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_jsx_runtime37.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(QualityReport, { report }) })
    ] });
  }

  // src/client/components/KnowledgeConflictReview.tsx
  var import_react34 = __require("react");
  var import_jsx_runtime38 = __require("react/jsx-runtime");
  var states = { pending_review: "\u5F85\u4EBA\u5DE5\u786E\u8BA4", pending_recheck: "\u5F85\u91CD\u6838\u9A8C", resolved: "\u5DF2\u751F\u6548" };
  var actions = { retain: "\u4FDD\u7559\u5224\u636E", revise: "\u4FEE\u8BA2\u5224\u636E", retire: "\u9000\u5F79\u5224\u636E", need_evidence: "\u8981\u6C42\u8865\u8BC1" };
  function KnowledgeConflictReview({ datasetId }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-review");
    const [loading, setLoading] = (0, import_react34.useState)(true), [contextLoading, setContextLoading] = (0, import_react34.useState)(false), [page, setPage] = (0, import_react34.useState)(1);
    const [state, setState] = (0, import_react34.useState)("");
    const [items, setItems] = (0, import_react34.useState)([]);
    const [context, setContext] = (0, import_react34.useState)(null);
    const [error2, setError] = (0, import_react34.useState)(""), [revision, setRevision] = (0, import_react34.useState)(0), [busy, setBusy] = (0, import_react34.useState)(false);
    const [reviewer, setReviewer] = (0, import_react34.useState)(""), [reason, setReason] = (0, import_react34.useState)(""), [instruction, setInstruction] = (0, import_react34.useState)("");
    const [action, setAction] = (0, import_react34.useState)("retain");
    const [pending, setPending] = (0, import_react34.useState)(null);
    const [lightbox, setLightbox] = (0, import_react34.useState)(null);
    (0, import_react34.useEffect)(() => {
      const controller = new AbortController();
      setLoading(true);
      request(`/review/knowledge/queue?${new URLSearchParams({ dataset_id: datasetId })}`, void 0, void 0, controller.signal).then((result) => {
        if (!controller.signal.aborted) setItems(result.items);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [datasetId, revision]);
    const filtered = items.filter((item) => !state || item.state === state);
    const selected = filtered.find((item) => item.conflict_id === view.conflictId && item.version_id === view.version) || filtered[0];
    (0, import_react34.useEffect)(() => {
      const controller = new AbortController();
      setContext(null);
      setError("");
      setContextLoading(!!selected);
      setPending(null);
      setReason("");
      setInstruction("");
      setAction("retain");
      if (selected) request(`/review/knowledge?${new URLSearchParams({ version_id: selected.version_id, conflict_id: selected.conflict_id })}`, void 0, void 0, controller.signal).then((result) => {
        if (!controller.signal.aborted) setContext(result);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      }).finally(() => {
        if (!controller.signal.aborted) setContextLoading(false);
      });
      return () => controller.abort();
    }, [selected?.conflict_id, selected?.version_id, revision]);
    async function submit() {
      if (!context) return;
      const submission = pending || { ...context.reference, submission_id: crypto.randomUUID(), context_signature: context.context_signature, reviewer, action, instruction: action === "revise" ? instruction : "", reason };
      setPending(submission);
      setBusy(true);
      setError("");
      try {
        await request("/review/knowledge", submission);
        setReason("");
        setInstruction("");
        setRevision((value) => value + 1);
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("section", { className: "iad-job-section", "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u590D\u6838", children: [
      error2 && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("p", { role: "alert", className: "iad-error", children: [
        error2,
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("button", { onClick: () => setRevision((value) => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "iad-field", children: [
        "\u72B6\u6001",
        /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u72B6\u6001", value: state, onChange: (event) => {
          setState(event.target.value);
          setPage(1);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
          Object.entries(states).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { value, children: label }, value))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "iad-conflict-workspace", children: [
        /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "iad-check-list", "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u961F\u5217", children: [
            filtered.slice((page - 1) * 10, page * 10).map((item) => /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
              "button",
              {
                "aria-pressed": selected?.conflict_id === item.conflict_id,
                onClick: () => workspace.updateView("industrial-review", { conflictId: item.conflict_id, version: item.version_id }),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("strong", { children: item.description }),
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("span", { children: [
                    item.kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38",
                    " \xB7 ",
                    states[item.state]
                  ] })
                ]
              },
              item.conflict_id
            )),
            !loading && !filtered.length && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { children: "\u6682\u65E0\u5339\u914D\u7684\u77E5\u8BC6\u51B2\u7A81\u3002" }),
            loading && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51B2\u7A81\u961F\u5217\u2026" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Pagination, { total: filtered.length, page, size: 10, unit: "\u9879\u51B2\u7A81", onPage: setPage })
        ] }),
        contextLoading && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51B2\u7A81\u8BC1\u636E\u2026" }),
        context && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "iad-conflict-detail", children: [
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("article", { "aria-label": "\u51B2\u7A81\u8BC1\u636E", children: [
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("h2", { children: "\u77E5\u8BC6\u51B2\u7A81" }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { role: "status", "data-field": "knowledge-review-state", children: states[context.state] }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { children: context.conflict.description }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("p", { children: [
              "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
              context.conflict.normal_explanation || "\u672A\u63D0\u4F9B"
            ] }),
            context.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("h3", { children: check.title }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { children: check.criterion }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("p", { className: "iad-muted", children: [
                check.subject,
                " \xB7 ",
                check.location
              ] })
            ] }, check.check_id)),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("section", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("h3", { children: "\u65B0\u56FE\u8BC1\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KnowledgeEvidenceGallery, { versionId: context.reference.version_id, items: context.evidence.filter((item) => context.conflict.new_evidence_ids.includes(item.image.evidence_id)), onOpen: setLightbox })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("section", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("h3", { children: "\u5386\u53F2\u6BD4\u8F83\u8BC1\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KnowledgeEvidenceGallery, { versionId: context.reference.version_id, items: context.evidence.filter((item) => context.conflict.comparison_evidence_ids.includes(item.image.evidence_id)), onOpen: setLightbox })
            ] }),
            context.evidence.some((item) => ![...context.conflict.new_evidence_ids, ...context.conflict.comparison_evidence_ids].includes(item.image.evidence_id)) && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("summary", { children: "\u5224\u636E\u7684\u5176\u4ED6\u5F15\u7528" }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KnowledgeEvidenceGallery, { versionId: context.reference.version_id, items: context.evidence.filter((item) => ![...context.conflict.new_evidence_ids, ...context.conflict.comparison_evidence_ids].includes(item.image.evidence_id)), onOpen: setLightbox })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { className: "iad-muted", children: context.conflict.limitations.join("\uFF1B") }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId, selected: context.conflict.sample_id, tab: "results" }), children: "\u590D\u6838\u6B64\u56FE\u50CF" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("aside", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E\u9762\u677F", children: [
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("h2", { children: "\u77E5\u8BC6\u5904\u7F6E" }),
            !context.is_latest && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { role: "status", children: "\u6B63\u5728\u67E5\u770B\u5386\u53F2\u51B2\u7A81\uFF0C\u63D0\u4EA4\u524D\u8BF7\u8BFB\u53D6\u5F53\u524D\u7248\u672C\u3002" }),
            !context.source_current && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { role: "status", children: "\u6765\u6E90\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u9A8C\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("form", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E", onSubmit: (event) => {
              event.preventDefault();
              void submit();
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("fieldset", { className: "iad-disposition-fields", disabled: busy || !!pending || !context.is_latest || !context.source_current, children: [
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "iad-field", children: [
                  "\u590D\u6838\u4EBA",
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("input", { "aria-label": "\u77E5\u8BC6\u590D\u6838\u4EBA", required: true, value: reviewer, onChange: (event) => setReviewer(event.target.value) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "iad-field", children: [
                  "\u77E5\u8BC6\u5904\u7F6E",
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("select", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E\u65B9\u5F0F", value: action, onChange: (event) => setAction(event.target.value), children: Object.entries(actions).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { value, children: label }, value)) })
                ] }),
                action === "revise" && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "iad-field", children: [
                  "\u5F85\u6838\u9A8C\u4FEE\u8BA2",
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("textarea", { "aria-label": "\u77E5\u8BC6\u4FEE\u8BA2\u5EFA\u8BAE", required: true, value: instruction, onChange: (event) => setInstruction(event.target.value) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "iad-field", children: [
                  "\u539F\u56E0",
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("textarea", { "aria-label": "\u77E5\u8BC6\u590D\u6838\u539F\u56E0", required: true, value: reason, onChange: (event) => setReason(event.target.value) })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("button", { type: "submit", className: "iad-primary", disabled: busy || !context.is_latest || !context.source_current || !pending && (!reviewer.trim() || !reason.trim() || action === "revise" && !instruction.trim()), children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : pending ? "\u91CD\u8BD5\u76F8\u540C\u63D0\u4EA4" : "\u63D0\u4EA4\u77E5\u8BC6\u5904\u7F6E" }) })
            ] }),
            context.state === "pending_recheck" && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId, knowledgeKind: items.find((item) => item.conflict_id === context.reference.conflict_id)?.kind || "normal", miningPreset: context.reference.version_id, scopeRunId: context.scope_run_id || "", miningSourceMode: "all", miningContinuous: false, version: "", tab: "setup" }), children: "\u9009\u62E9\u56FE\u50CF\u91CD\u6838\u9A8C" }),
            !!context.events.length && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("summary", { children: [
                "\u5904\u7F6E\u8BB0\u5F55 \xB7 ",
                context.events.length,
                " \u6B21"
              ] }),
              context.events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("p", { children: [
                  actions[event.action],
                  " \xB7 ",
                  event.reviewer
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { children: event.instruction || event.reason }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("time", { dateTime: event.created_at, children: new Date(event.created_at).toLocaleString() })
              ] }, event.submission_id))
            ] })
          ] })
        ] })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/ExplorationPage.tsx
  var import_react38 = __require("react");

  // src/client/useJobs.ts
  var import_react35 = __require("react");
  function useJobs(kind, datasetId, onProgress, selectedRunId = "") {
    const [jobs, setJobs] = (0, import_react35.useState)([]);
    const [error2, setError] = (0, import_react35.useState)("");
    const [revision, setRevision] = (0, import_react35.useState)(0);
    const observed = (0, import_react35.useRef)({ datasetId: "", signature: "" });
    const refresh = (0, import_react35.useCallback)(() => setRevision((value) => value + 1), []);
    (0, import_react35.useEffect)(() => {
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
        } catch (error3) {
          if (!controller.signal.aborted) setError(message(error3));
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
    return { jobs, error: error2, refresh };
  }

  // src/client/components/ExplorationSources.tsx
  var import_react37 = __require("react");

  // src/client/components/SourcePicker.tsx
  var import_react36 = __require("react");
  var import_jsx_runtime39 = __require("react/jsx-runtime");
  function SourcePicker({ dataset, label, sources, selected, target, disabled, page, onPage, onChange, search, onSearch, onChoose, choosing = false, canChoose = true }) {
    const [open, setOpen] = (0, import_react36.useState)(false), [selectedOnly, setSelectedOnly] = (0, import_react36.useState)(false), [selectedPage, setSelectedPage] = (0, import_react36.useState)(1);
    const [selectedSearch, setSelectedSearch] = (0, import_react36.useState)("");
    const [image, setImage] = (0, import_react36.useState)(null);
    const name2 = (id) => id.slice(id.indexOf(":") + 1);
    const chosen = selected.filter((id) => name2(id).toLocaleLowerCase().includes(selectedSearch.toLocaleLowerCase()));
    const current = Math.min(selectedPage, Math.max(1, Math.ceil(chosen.length / 10)));
    const items = selectedOnly ? chosen.slice((current - 1) * 10, current * 10).map((id) => ({ sample_id: id, relative_path: name2(id) })) : sources?.items || [];
    function show(only) {
      setSelectedOnly(only);
      setSelectedPage(1);
      setSelectedSearch("");
      setOpen(true);
    }
    function thumbnail(id, path) {
      const sample = { task_id: dataset.task_id, sample_id: id };
      return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", "aria-label": `\u653E\u5927\u6837\u4F8B ${path}`, onClick: () => setImage({ src: mediaUrl(sample, "image"), title: path }), children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("img", { src: mediaUrl(sample, "thumbnail"), alt: path, loading: "lazy" }) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-source-picker", children: [
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("p", { role: "status", children: [
        "\u5DF2\u9009 ",
        selected.length,
        " / ",
        target || "\u2014",
        " \u5F20",
        sources ? ` \xB7 \u53EF\u7528 ${sources.total}` : ""
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "iad-source-preview", children: selected.slice(0, 4).map((id) => /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { children: [
        thumbnail(id, name2(id)),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { title: name2(id), children: name2(id).split("/").pop() })
      ] }, id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("button", { type: "button", disabled, onClick: () => show(false), children: [
          "\u9009\u62E9",
          label,
          "\u56FE\u50CF"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("button", { type: "button", disabled: !selected.length || disabled, onClick: () => show(true), children: [
          "\u67E5\u770B\u5168\u90E8\u5DF2\u9009",
          label
        ] })
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(Modal, { title: `\u9009\u62E9${label}\u56FE\u50CF`, onClose: () => setOpen(false), className: "iad-source-dialog", children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "iad-field", children: [
            "\u641C\u7D22\u56FE\u50CF",
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { type: "search", "aria-label": `\u641C\u7D22${label}\u56FE\u50CF`, value: selectedOnly ? selectedSearch : search, onChange: (event) => {
              if (selectedOnly) {
                setSelectedSearch(event.target.value);
                setSelectedPage(1);
              } else onSearch(event.target.value);
            } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { type: "checkbox", checked: selectedOnly, onChange: (event) => {
              setSelectedOnly(event.target.checked);
              setSelectedPage(1);
            } }),
            "\u4EC5\u5DF2\u9009"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
            "\u5DF2\u9009 ",
            selected.length,
            " / ",
            target || "\u2014",
            " \u5F20"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-row", children: [
          onChoose && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", disabled: disabled || choosing || !canChoose, onClick: onChoose, children: choosing ? "\u9009\u62E9\u4E2D\u2026" : "\u6309\u6570\u91CF\u9009\u62E9" }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("button", { type: "button", disabled: disabled || choosing || !selected.length, onClick: () => onChange([]), children: [
            "\u6E05\u7A7A",
            label,
            "\u9009\u62E9"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("fieldset", { disabled: disabled || choosing, className: "iad-source-candidates", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("legend", { children: [
            label,
            "\u56FE\u50CF"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "iad-source-grid", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-source-option", children: [
            thumbnail(item.sample_id, item.relative_path),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { title: item.relative_path, children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { type: "checkbox", "aria-label": `\u9009\u62E9${label} ${item.relative_path}`, checked: selected.includes(item.sample_id), onChange: (event) => onChange(event.target.checked ? [...selected, item.sample_id] : selected.filter((id) => id !== item.sample_id)) }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { children: item.relative_path.split("/").pop() })
            ] })
          ] }, item.sample_id)) }),
          !items.length && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { role: "status", children: selectedOnly ? "\u6CA1\u6709\u5339\u914D\u7684\u5DF2\u9009\u56FE\u50CF\u3002" : sources ? "\u6CA1\u6709\u5339\u914D\u7684\u5408\u683C\u6765\u6E90\u3002" : "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u2026" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Pagination, { total: selectedOnly ? chosen.length : sources?.total || 0, page: selectedOnly ? current : page, size: 10, unit: "\u5F20", onPage: selectedOnly ? setSelectedPage : onPage }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", disabled: choosing, onClick: () => setOpen(false), children: "\u5B8C\u6210\u9009\u62E9" }) })
      ] }),
      image && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(ImageViewer, { image, onClose: () => setImage(null) })
    ] });
  }

  // src/client/components/ExplorationSources.tsx
  var import_jsx_runtime40 = __require("react/jsx-runtime");
  function ExplorationSources({ dataset, kind, count: count2, images, disabled, onCount, onImages, onSelecting }) {
    const label = kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38";
    const [page, setPage] = (0, import_react37.useState)(1), [sources, setSources] = (0, import_react37.useState)(null);
    const [error2, setError] = (0, import_react37.useState)(""), [selecting, setSelecting] = (0, import_react37.useState)(false), [search, setSearch] = (0, import_react37.useState)("");
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, search });
    (0, import_react37.useEffect)(() => {
      const controller = new AbortController();
      setError("");
      request(`/knowledge/sources?${query}&page=${page}&page_size=10`, void 0, void 0, controller.signal).then((result) => {
        if (!controller.signal.aborted) setSources(result);
      }).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
      return () => controller.abort();
    }, [dataset.dataset_id, kind, page, search]);
    async function select() {
      setSelecting(true);
      onSelecting(true);
      setError("");
      try {
        const selected = [];
        for (let next = 1; selected.length < Number(count2); next++) {
          const result = await request(`/knowledge/sources?${query}&page=${next}&page_size=100`);
          selected.push(...result.items.slice(0, Number(count2) - selected.length).map((item) => item.sample_id));
          if (next * 100 >= result.total) break;
        }
        if (selected.length !== Number(count2)) throw new Error(`\u53EF\u7528${label}\u4E0D\u8DB3${count2}\u5F20\uFF0C\u8BF7\u8C03\u6574\u6570\u91CF`);
        onImages(selected);
      } catch (e) {
        setError(message(e));
      } finally {
        setSelecting(false);
        onSelecting(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("section", { className: "iad-info-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("h3", { children: [
        label,
        "\u6837\u4F8B"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("fieldset", { disabled: disabled || selecting, children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("label", { className: "iad-field iad-short-field", children: [
          "\u76EE\u6807\u6570\u91CF",
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("input", { type: "number", min: "1", "aria-label": `${label}\u56FE\u50CF\u6570\u91CF`, value: count2, onChange: (e) => onCount(e.target.value) })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(SourcePicker, { dataset, label, sources, selected: images, target: count2, disabled, choosing: selecting, canChoose: Number.isInteger(Number(count2)) && Number(count2) > 0, onChoose: () => void select(), page, onPage: setPage, onChange: onImages, search, onSearch: (value) => {
          setSearch(value);
          setPage(1);
        } })
      ] })
    ] });
  }

  // src/client/components/ExplorationPage.tsx
  var import_jsx_runtime41 = __require("react/jsx-runtime");
  function ExplorationPage({ dataset, refreshRevision, headerActions }) {
    const model = useWorkbenchModel();
    const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
    const [catalog, setCatalog] = (0, import_react38.useState)(null), [revision, setRevision] = (0, import_react38.useState)(0);
    const [error2, setError] = (0, import_react38.useState)(""), [busy, setBusy] = (0, import_react38.useState)(false), [normalSelecting, setNormalSelecting] = (0, import_react38.useState)(false), [defectSelecting, setDefectSelecting] = (0, import_react38.useState)(false);
    const [directionId, setDirectionId] = (0, import_react38.useState)("");
    const [image, setImage] = (0, import_react38.useState)(null);
    const changed = (0, import_react38.useCallback)(() => setRevision((v) => v + 1), []);
    const jobs = useJobs("exploration", dataset.dataset_id, changed, view.job);
    (0, import_react38.useEffect)(() => {
      const controller = new AbortController();
      const query = new URLSearchParams({ dataset_id: dataset.dataset_id });
      if (view.version) query.set("version_id", view.version);
      request(`/exploration?${query}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) {
          setCatalog(value);
          setError("");
        }
      }).catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
      return () => controller.abort();
    }, [dataset.dataset_id, view.version, revision, refreshRevision]);
    const active = jobs.jobs.find((j) => j.status === "RUNNING" || j.status === "PENDING");
    const blocked = busy || !!active;
    const normalCount = Number(view.explorationNormalCount), defectCount = Number(view.explorationDefectCount);
    const valid = Number.isInteger(normalCount) && normalCount > 0 && Number.isInteger(defectCount) && defectCount > 0 && view.explorationNormalImages.length === normalCount && view.explorationDefectImages.length === defectCount;
    async function run(path, body) {
      setBusy(true);
      setError("");
      try {
        const job = await request(path, body || {});
        if (workspace.getSnapshot().datasetId === dataset.dataset_id) workspace.updateView(pageId, { job: job.run_id, tab: "jobs" });
        jobs.refresh();
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
    const result = catalog?.exploration;
    const direction = result?.directions.find((item) => item.direction_id === directionId);
    return /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-exploration-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(WorkbenchHeader, { pageId, children: [
        headerActions,
        view.tab === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "results" }), children: "\u8FD4\u56DE\u63A2\u7D22\u7ED3\u679C" }) : (result || view.tab === "jobs") && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { className: "iad-primary", disabled: blocked, onClick: () => workspace.updateView(pageId, { tab: "setup" }), children: "\u65B0\u5EFA\u63A2\u7D22" })
      ] }),
      (error2 || jobs.error) && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { role: "alert", className: "iad-error", children: error2 || jobs.error }),
      view.tab === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-setup", "aria-label": "\u65B0\u5EFA\u63A2\u7D22", children: [
        /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-setup-fields", children: [
          /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-setup-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h3", { children: "1. \u63A2\u7D22\u76EE\u6807" }),
            /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("label", { className: "iad-field", children: [
              "\u63A2\u7D22\u76EE\u6807\uFF08\u53EF\u9009\uFF09",
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("textarea", { "aria-label": "\u65B9\u5411\u63A2\u7D22\u76EE\u6807", disabled: blocked, value: view.explorationObjective, rows: 2, onChange: (e) => workspace.updateView(pageId, { explorationObjective: e.target.value }, true) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-setup-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h3", { children: "2. \u4E24\u7EC4\u6837\u4F8B" }),
            "      ",
            /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-exploration-groups", children: [
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(ExplorationSources, { dataset, kind: "normal", disabled: blocked, count: view.explorationNormalCount, images: view.explorationNormalImages, onCount: (explorationNormalCount) => workspace.updateView(pageId, { explorationNormalCount }), onImages: (explorationNormalImages) => {
                if (workspace.getSnapshot().datasetId === dataset.dataset_id) workspace.updateView(pageId, { explorationNormalImages });
              }, onSelecting: setNormalSelecting }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(ExplorationSources, { dataset, kind: "defect", disabled: blocked, count: view.explorationDefectCount, images: view.explorationDefectImages, onCount: (explorationDefectCount) => workspace.updateView(pageId, { explorationDefectCount }), onImages: (explorationDefectImages) => {
                if (workspace.getSnapshot().datasetId === dataset.dataset_id) workspace.updateView(pageId, { explorationDefectImages });
              }, onSelecting: setDefectSelecting })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-setup-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h3", { children: "3. \u8FD0\u884C\u786E\u8BA4" }),
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(WorkbenchModelStatus, {}),
            /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("p", { children: [
              "\u826F\u54C1 ",
              view.explorationNormalImages.length,
              " \u5F20 \xB7 \u5F02\u5E38 ",
              view.explorationDefectImages.length,
              " \u5F20 \xB7 \u8054\u5408\u89C2\u5BDF"
            ] }),
            !valid && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { className: "iad-muted", children: "\u8BF7\u6309\u76EE\u6807\u6570\u91CF\u9009\u62E9\u4E24\u7EC4\u56FE\u50CF\u3002" }),
            "      "
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-form-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "results" }), children: "\u53D6\u6D88" }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { className: "iad-primary", disabled: blocked || normalSelecting || defectSelecting || !valid || !model.ready, onClick: () => void run("/exploration/start", {
            dataset_id: dataset.dataset_id,
            normal_images: view.explorationNormalImages,
            defect_images: view.explorationDefectImages,
            ...view.explorationObjective.trim() ? { objective: view.explorationObjective } : {}
          }), children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : "\u5F00\u59CB\u65B9\u5411\u63A2\u7D22" })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(PageTabs, { label: "\u65B9\u5411\u63A2\u7D22\u89C6\u56FE", items: [{ id: "results", label: "\u63A2\u7D22\u7ED3\u679C" }, { id: "jobs", label: "\u63A2\u7D22\u4F5C\u4E1A" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
        active && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("div", { className: "iad-section-header", children: /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("span", { role: "status", children: [
          active.cancel_requested ? "\u6B63\u5728\u505C\u6B62\u65B9\u5411\u63A2\u7D22" : "\u65B9\u5411\u63A2\u7D22\u6267\u884C\u4E2D",
          " \xB7 ",
          jobPhases[active.phase || ""] || active.message
        ] }) }),
        view.tab === "jobs" ? /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-job-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h2", { children: "\u63A2\u7D22\u4F5C\u4E1A" }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(JobTable, { jobs: jobs.jobs, pageId, onChanged: jobs.refresh })
        ] }) : !result ? /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-empty", children: [
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h2", { children: "\u5C1A\u65E0\u63A2\u7D22\u7ED3\u679C" }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { children: "\u9009\u62E9\u826F\u54C1\u548C\u5F02\u5E38\u6837\u4F8B\uFF0C\u5EFA\u7ACB\u9002\u5408\u5F53\u524D\u6570\u636E\u96C6\u7684\u63A2\u7D22\u65B9\u5411\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { className: "iad-primary", disabled: blocked, onClick: () => workspace.updateView(pageId, { tab: "setup" }), children: "\u65B0\u5EFA\u63A2\u7D22" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-exploration-results", children: [
          /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-section-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h2", { children: "\u5019\u9009\u65B9\u5411" }),
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("select", { "aria-label": "\u63A2\u7D22\u7ED3\u679C\u7248\u672C", value: result.version_id, onChange: (event) => {
              setDirectionId("");
              workspace.updateView(pageId, { version: event.target.value });
            }, children: catalog?.versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("option", { value: version.version_id, children: [
              version.created_at.slice(0, 19).replace("T", " "),
              " \xB7 ",
              version.direction_count,
              " \u9879\u65B9\u5411"
            ] }, version.version_id)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { className: "iad-muted", children: result.summary }),
          result.directions.length ? /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u63A2\u7D22\u65B9\u5411", children: [
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("th", { children: "\u65B9\u5411" }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("th", { children: "\u9002\u7528\u77E5\u8BC6" }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("th", { className: "iad-number", children: "\u8BC1\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("th", { children: "\u64CD\u4F5C" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("tbody", { children: result.directions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("strong", { children: item.title }) }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { children: item.applies_to === "both" ? "\u826F\u54C1\u4E0E\u5F02\u5E38" : item.applies_to === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38" }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { className: "iad-number", children: item.evidence_ids.length }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { onClick: () => setDirectionId(item.direction_id), children: "\u67E5\u770B\u65B9\u5411" }) })
            ] }, item.direction_id)) })
          ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { children: "\u672C\u6279\u6837\u4F8B\u672A\u5F62\u6210\u53EF\u7528\u63A2\u7D22\u65B9\u5411\u3002" }),
          !!result.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("summary", { children: "\u6574\u4F53\u9650\u5236" }),
            result.limitations.map((limitation, index3) => /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { children: limitation }, index3))
          ] })
        ] })
      ] }),
      direction && result && /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(Modal, { title: direction.title, onClose: () => setDirectionId(""), children: [
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h3", { children: "\u89C2\u5BDF\u76EE\u6807" }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { children: direction.instruction }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h3", { children: "\u4F9D\u636E\u4E0E\u9650\u5236" }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { children: direction.rationale }),
        direction.limitations.map((limitation, index3) => /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { children: limitation }, index3)),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("div", { className: "iad-reference-grid", children: direction.evidence_ids.map((id) => {
          const src = `/api/iad/exploration/evidence/${encodeURIComponent(result.version_id)}/${encodeURIComponent(id)}`;
          return /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { "aria-label": `\u67E5\u770B\u65B9\u5411\u8BC1\u636E ${direction.title}`, onClick: () => setImage({ src, title: direction.title }), children: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("img", { src, alt: direction.title, loading: "lazy" }) }, id);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("div", { className: "iad-form-actions", children: [["normal", "\u826F\u54C1"], ["defect", "\u5F02\u5E38"]].map(([kind, label]) => /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: kind, explorationVersion: result.version_id, tab: "setup" }), children: [
          "\u7528\u4E8E",
          label,
          "\u77E5\u8BC6\u6316\u6398"
        ] }, kind)) })
      ] }),
      image && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(ImageViewer, { image, onClose: () => setImage(null) })
    ] });
  }

  // src/client/components/KnowledgeVersions.tsx
  var import_react39 = __require("react");
  var import_jsx_runtime42 = __require("react/jsx-runtime");
  function KnowledgeVersions({ versions, onSelect }) {
    const [page, setPage] = (0, import_react39.useState)(1);
    const current = Math.min(page, Math.max(1, Math.ceil(versions.length / 10)));
    return /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(import_jsx_runtime42.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u77E5\u8BC6\u7248\u672C\u5217\u8868", children: [
        /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("th", { children: "\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("th", { className: "iad-number", children: "\u6765\u6E90" }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("th", { className: "iad-number", children: "\u5224\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("th", { children: "\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("th", { children: "\u4F9D\u636E" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("tbody", { children: versions.slice((current - 1) * 10, current * 10).map((version) => /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("button", { title: version.version_id, className: "iad-identifier", onClick: () => onSelect(version.version_id), children: version.version_id }) }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { className: "iad-number", children: version.source_count }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { className: "iad-number", children: version.check_count }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("time", { dateTime: version.created_at, children: new Date(version.created_at).toLocaleString() }) }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("summary", { children: "\u7248\u672C\u5173\u7CFB" }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("dl", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("dt", { children: "\u7236\u7248\u672C" }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("dd", { children: version.parent_version_id || "\u65E0" }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("dt", { children: "\u826F\u54C1\u57FA\u51C6" }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("dd", { children: version.normal_version_id || "\u672A\u4F7F\u7528" })
            ] })
          ] }) })
        ] }, version.version_id)) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Pagination, { total: versions.length, page: current, size: 10, unit: "\u4E2A\u7248\u672C", onPage: setPage })
    ] });
  }

  // src/client/components/KnowledgePage.tsx
  var import_react43 = __require("react");

  // src/client/components/KnowledgeScopePanel.tsx
  var import_react40 = __require("react");
  var import_jsx_runtime43 = __require("react/jsx-runtime");
  function KnowledgeScopePanel({ scopeRunId, datasetId, kind, revision, onScope }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-knowledge");
    const [scope, setScope] = (0, import_react40.useState)(null), [error2, setError] = (0, import_react40.useState)(""), [busy, setBusy] = (0, import_react40.useState)(false);
    const update = (0, import_react40.useCallback)((value) => {
      if (value.dataset_id !== datasetId || value.kind !== kind) throw new Error("\u8303\u56F4\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6570\u636E\u96C6\u548C\u77E5\u8BC6\u7C7B\u578B");
      onScope(value);
      setScope(value);
      setError("");
    }, [onScope, datasetId, kind]);
    (0, import_react40.useEffect)(() => {
      const controller = new AbortController();
      setScope((current) => current?.scope_run_id === scopeRunId ? current : null);
      request(`/knowledge/scopes/${encodeURIComponent(scopeRunId)}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) update(value);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [scopeRunId, revision, update]);
    async function change(action) {
      setBusy(true);
      setError("");
      try {
        update(await request(`/knowledge/scopes/${encodeURIComponent(scopeRunId)}/${action}`, {}));
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { className: "iad-job-section", "aria-label": "\u8FDE\u7EED\u6765\u6E90\u8303\u56F4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("h2", { children: "\u8FDE\u7EED\u8303\u56F4" }),
        scope && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { "data-field": "knowledge-scope-state", children: scope.status === "STOPPED" ? "\u5DF2\u505C\u6B62" : scope.active_run_ids.length ? "\u6267\u884C\u4E2D" : !scope.unprocessed ? "\u89C2\u5BDF\u5B8C\u6210" : "\u5F85\u7EE7\u7EED" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !scope && !error2 && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8303\u56F4\u2026" }),
      scope && /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("p", { role: "status", "aria-atomic": "true", "aria-label": "\u8FDE\u7EED\u8303\u56F4\u8FDB\u5EA6", children: [
          "\u5DF2\u89C2\u5BDF ",
          scope.observed,
          " / ",
          scope.total,
          " \xB7 \u5269\u4F59 ",
          scope.remaining,
          !!scope.pending_review && ` \xB7 \u5F85\u4EBA\u5BA1 ${scope.pending_review}`,
          !!scope.stale && ` \xB7 \u6765\u6E90\u5931\u6548 ${scope.stale}`,
          !!scope.recheck && ` \xB7 \u5224\u636E\u5F85\u91CD\u6838\u9A8C ${scope.recheck}`,
          !!scope.excluded && ` \xB7 \u5DF2\u79FB\u51FA\u652F\u6301 ${scope.excluded}`
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { disabled: busy, onClick: () => void change(scope.status === "STOPPED" ? "resume" : "stop"), children: scope.status === "STOPPED" ? "\u7EE7\u7EED\u8303\u56F4" : "\u505C\u6B62\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { disabled: busy, onClick: () => workspace.updateView("industrial-knowledge", { tab: "setup", scopeRunId, scopeSessionId: view.scopeRunId === scopeRunId ? view.scopeSessionId : "", miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [], miningPage: 1 }), children: "\u9009\u62E9\u6B64\u8303\u56F4" }),
          scope.current_version_id && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { onClick: () => workspace.updateView("industrial-knowledge", { version: scope.current_version_id || "", tab: "results" }), children: "\u67E5\u770B\u8303\u56F4\u77E5\u8BC6" }),
          view.scopeSessionId && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { onClick: () => void workspace.openSession(view.scopeSessionId), children: "\u67E5\u770B\u4F1A\u8BDD" }),
          scope.status === "STOPPED" && view.scopeRunId && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { onClick: () => workspace.updateView("industrial-knowledge", { scopeRunId: "", scopeSessionId: "", miningContinuous: false, miningImages: [] }), children: "\u8FD4\u56DE\u5355\u7EC4\u914D\u7F6E" })
        ] })
      ] })
    ] });
  }

  // src/client/components/KnowledgeSetup.tsx
  var import_react42 = __require("react");

  // src/client/components/KnowledgeDirections.tsx
  var import_react41 = __require("react");
  var import_jsx_runtime44 = __require("react/jsx-runtime");
  function KnowledgeDirections({ datasetId, kind, proposal, onPending, onProposalUsed }) {
    const { workspace } = useWorkspace();
    const explorationVersion = workspace.view("industrial-knowledge").explorationVersion;
    const [catalog, setCatalog] = (0, import_react41.useState)(null), [catalogError, setCatalogError] = (0, import_react41.useState)("");
    const [saved, setSaved] = (0, import_react41.useState)(null), [draft, setDraft] = (0, import_react41.useState)(null);
    const [error2, setError] = (0, import_react41.useState)(""), [saving, setSaving] = (0, import_react41.useState)(false), [revision, setRevision] = (0, import_react41.useState)(0);
    const [title, setTitle] = (0, import_react41.useState)(""), [instruction, setInstruction] = (0, import_react41.useState)(""), [open, setOpen] = (0, import_react41.useState)(false);
    const applied = (0, import_react41.useRef)(""), alive = (0, import_react41.useRef)(true);
    const query = new URLSearchParams({ dataset_id: datasetId, kind }).toString();
    (0, import_react41.useEffect)(() => {
      const controller = new AbortController();
      const params = new URLSearchParams({ dataset_id: datasetId });
      if (explorationVersion) params.set("version_id", explorationVersion);
      setCatalog(null);
      setCatalogError("");
      request(`/exploration?${params}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setCatalog(value);
      }).catch((e) => {
        if (!controller.signal.aborted) setCatalogError(message(e));
      });
      return () => controller.abort();
    }, [datasetId, explorationVersion, revision]);
    (0, import_react41.useEffect)(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    (0, import_react41.useEffect)(() => {
      const controller = new AbortController();
      setSaved(null);
      setDraft(null);
      setError("");
      request(`/knowledge/prompt?${query}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) {
          setSaved(value);
          setDraft(value.configuration);
        }
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [query, revision]);
    (0, import_react41.useEffect)(() => {
      if (!proposal || !draft || saving || applied.current === proposal.id || proposal.datasetId !== datasetId || proposal.kind !== kind) return;
      applied.current = proposal.id;
      setOpen(true);
      onProposalUsed();
      if (draft.directions.some((item) => item.title.trim().toLocaleLowerCase() === proposal.title.trim().toLocaleLowerCase())) {
        setError("\u5DF2\u6709\u540C\u540D\u65B9\u5411\uFF0C\u8BF7\u7F16\u8F91\u73B0\u6709\u8BF4\u660E\u3002");
        return;
      }
      setDraft({ ...draft, directions: [...draft.directions, {
        direction_id: crypto.randomUUID(),
        title: proposal.title,
        instruction: proposal.instruction,
        enabled: true,
        origin: "dataset"
      }] });
    }, [proposal, draft, saving, datasetId, kind, onProposalUsed]);
    const dirty = !!saved && JSON.stringify(saved.configuration) !== JSON.stringify(draft);
    useUnsavedChanges(dirty);
    const invalid = !!draft && (!draft.objective.trim() || draft.directions.some((item) => !item.title.trim() || !item.instruction.trim()) || new Set(draft.directions.map((item) => item.title.trim().toLocaleLowerCase())).size !== draft.directions.length);
    (0, import_react41.useEffect)(() => onPending(!saved || dirty || saving || invalid || !!error2), [saved, dirty, saving, invalid, error2, onPending]);
    function change(index3, patch) {
      if (draft) setDraft({ ...draft, directions: draft.directions.map((item, i) => i === index3 ? { ...item, ...patch } : item) });
      setError("");
    }
    async function save(reset = false) {
      if (!saved || !draft) return;
      setSaving(true);
      setError("");
      try {
        const result = await request("/knowledge/prompt", {
          dataset_id: datasetId,
          kind,
          expected_revision: saved.revision,
          configuration: reset ? null : draft
        });
        if (alive.current) {
          setSaved(result);
          setDraft(result.configuration);
        }
      } catch (error3) {
        if (alive.current) setError(message(error3));
      } finally {
        if (alive.current) setSaving(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("details", { className: "iad-mining-directions", open, onToggle: (event) => setOpen(event.currentTarget.open), children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("summary", { "data-action": "mining-directions", children: [
        "\u6316\u6398\u65B9\u5411",
        draft ? ` \xB7 \u5DF2\u9009 ${draft.directions.filter((item) => item.enabled).length} \u9879` : "",
        dirty ? " \xB7 \u672A\u4FDD\u5B58" : ""
      ] }),
      !saved && !error2 && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6316\u6398\u65B9\u5411\u2026" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("p", { role: "alert", className: "iad-error", children: [
        error2,
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { onClick: () => setRevision((value) => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6" })
      ] }),
      draft && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("fieldset", { disabled: saving, className: "iad-directions-form", children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
          "\u6316\u6398\u76EE\u6807",
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("textarea", { "aria-label": "\u6316\u6398\u76EE\u6807", rows: 3, value: draft.objective, onChange: (event) => {
            setDraft({ ...draft, objective: event.target.value });
            setError("");
          } })
        ] }),
        [["preset", "\u901A\u7528\u65B9\u5411"], ["dataset", "\u6570\u636E\u96C6\u65B9\u5411"], ["explored", "\u63A2\u7D22\u65B9\u5411"]].map(([origin, label]) => /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("fieldset", { className: "iad-direction-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("legend", { children: label }),
          origin === "explored" && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(import_jsx_runtime44.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
              "\u63A2\u7D22\u7ED3\u679C\u7248\u672C",
              /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("select", { "aria-label": "\u9009\u7528\u63A2\u7D22\u7248\u672C", value: catalog?.exploration?.version_id || "", onChange: (e) => workspace.updateView("industrial-knowledge", { explorationVersion: e.target.value }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("option", { value: "", disabled: true, children: "\u5C1A\u65E0\u63A2\u7D22\u7ED3\u679C" }),
                catalog?.versions.map((v) => /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("option", { value: v.version_id, children: [
                  v.created_at.slice(0, 19).replace("T", " "),
                  " \xB7 ",
                  v.direction_count,
                  " \u9879"
                ] }, v.version_id))
              ] })
            ] }),
            catalogError && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { role: "alert", children: catalogError })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-direction-grid", children: [
            draft.directions.map((item, index3) => item.origin !== origin ? null : /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-direction", children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-direction-toggle", children: [
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { type: "checkbox", "aria-label": `\u542F\u7528\u65B9\u5411 ${item.title}`, checked: item.enabled, onChange: (event) => change(index3, { enabled: event.target.checked }) }),
                item.title
              ] }),
              origin === "explored" && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { onClick: () => {
                request(`/exploration?${new URLSearchParams({ dataset_id: datasetId, direction_id: item.direction_id })}`).then((value) => {
                  if (value.exploration && workspace.getSnapshot().datasetId === datasetId && workspace.getSnapshot().knowledgeKind === kind) workspace.openLocation({ pageId: "industrial-exploration", datasetId, version: value.exploration.version_id });
                }).catch((e) => setError(message(e)));
              }, children: "\u67E5\u770B\u6765\u6E90" }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("details", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("summary", { "aria-label": `\u7F16\u8F91\u65B9\u5411 ${item.title}`, children: "\u7F16\u8F91" }),
                /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
                  "\u540D\u79F0",
                  /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { "aria-label": `\u65B9\u5411\u540D\u79F0 ${item.direction_id}`, value: item.title, onChange: (event) => change(index3, { title: event.target.value }) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
                  "\u89C2\u5BDF\u8BF4\u660E",
                  /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("textarea", { "aria-label": `\u65B9\u5411\u8BF4\u660E ${item.direction_id}`, rows: 4, value: item.instruction, onChange: (event) => change(index3, { instruction: event.target.value }) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { onClick: () => {
                  setDraft({ ...draft, directions: draft.directions.filter((_, i) => i !== index3) });
                  setError("");
                }, children: "\u5220\u9664\u65B9\u5411" })
              ] })
            ] }, item.direction_id)),
            origin === "explored" && catalog?.exploration?.directions.filter((item) => (item.applies_to === "both" || item.applies_to === kind) && !draft.directions.some((d) => d.direction_id === item.direction_id)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-direction iad-direction-toggle", children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { type: "checkbox", "aria-label": `\u542F\u7528\u63A2\u7D22\u65B9\u5411 ${item.title}`, checked: false, onChange: () => setDraft({ ...draft, directions: [...draft.directions, { direction_id: item.direction_id, title: item.title, instruction: item.instruction, origin: "explored", enabled: true }] }) }),
              item.title,
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { className: "iad-muted", children: item.instruction })
            ] }, item.direction_id))
          ] }),
          origin === "dataset" && !draft.directions.some((item) => item.origin === origin) && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6570\u636E\u96C6\u4E13\u5C5E\u65B9\u5411\u3002" })
        ] }, origin)),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("details", { className: "iad-direction-add", children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("summary", { children: "\u6DFB\u52A0\u81EA\u5B9A\u4E49\u65B9\u5411" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
            "\u540D\u79F0",
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { "aria-label": "\u65B0\u65B9\u5411\u540D\u79F0", value: title, onChange: (event) => setTitle(event.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
            "\u89C2\u5BDF\u8BF4\u660E",
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("textarea", { "aria-label": "\u65B0\u65B9\u5411\u8BF4\u660E", rows: 3, value: instruction, onChange: (event) => setInstruction(event.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { disabled: !title.trim() || !instruction.trim(), onClick: () => {
            setDraft({ ...draft, directions: [...draft.directions, { direction_id: crypto.randomUUID(), title: title.trim(), instruction: instruction.trim(), enabled: true, origin: "dataset" }] });
            setTitle("");
            setInstruction("");
            setError("");
          }, children: "\u6DFB\u52A0\u6570\u636E\u96C6\u65B9\u5411" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { className: "iad-muted", children: "\u6A21\u578B\u53EF\u81EA\u4E3B\u53D1\u73B0\u65B0\u65B9\u5411\u3002\u4FDD\u5B58\u7528\u4E8E\u4E0B\u4E00\u6B21\u542F\u52A8\u7684\u56FE\u7EC4\uFF1B\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\u4E0D\u53C2\u4E0E\u6316\u6398\u3002" }),
        invalid && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { role: "alert", children: "\u8BF7\u586B\u5199\u76EE\u6807\u3001\u65B9\u5411\u540D\u79F0\u548C\u8BF4\u660E\uFF0C\u65B9\u5411\u540D\u79F0\u4E0D\u80FD\u91CD\u590D\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { "data-action": "save-mining-directions", disabled: !dirty || invalid || saving, onClick: () => void save(), children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u65B9\u5411" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { disabled: !dirty || saving, onClick: () => {
            setDraft(saved.configuration);
            setError("");
          }, children: "\u653E\u5F03\u4FEE\u6539" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { disabled: saving || !saved?.customized && !dirty, onClick: () => void save(true), children: "\u6062\u590D\u9ED8\u8BA4\u65B9\u5411" })
        ] }),
        saved && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("summary", { children: "\u5DF2\u4FDD\u5B58\u7684\u6316\u6398\u63D0\u793A\u8BCD" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("pre", { className: "iad-observation", children: saved.instruction })
        ] })
      ] })
    ] });
  }

  // src/client/components/KnowledgeSetup.tsx
  var import_jsx_runtime45 = __require("react/jsx-runtime");
  function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous, directionProposal, onDirectionProposalUsed }) {
    const { workspace } = useWorkspace(), pageId = "industrial-knowledge";
    const model = useWorkbenchModel();
    const view = workspace.view(pageId);
    const [sources, setSources] = (0, import_react42.useState)(null), [error2, setError] = (0, import_react42.useState)("");
    const [selecting, setSelecting] = (0, import_react42.useState)(false);
    const [directionsPending, setDirectionsPending] = (0, import_react42.useState)(true);
    const query = new URLSearchParams({
      dataset_id: dataset.dataset_id,
      kind,
      page: String(view.miningPage),
      page_size: "10",
      search: view.miningSearch,
      include_observed: String(view.miningSourceMode === "all"),
      ...view.miningSourceMode === "recheck" && view.miningPreset ? { recheck_from_version: view.miningPreset } : {},
      ...view.scopeRunId ? { scope_run_id: view.scopeRunId } : view.miningPreset ? { uncovered_from_version: view.miningPreset } : {},
      ...kind === "defect" && view.normalVersion ? { normal_version_id: view.normalVersion } : {}
    }).toString();
    (0, import_react42.useEffect)(() => {
      const controller = new AbortController();
      setSources(null);
      setError("");
      request(`/knowledge/sources?${query}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setSources(value);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [query]);
    const count2 = Number(view.miningCount), valid = Number.isInteger(count2) && count2 > 0;
    async function choose() {
      if (!valid) return;
      setSelecting(true);
      setError("");
      try {
        const ids = [], pageSize2 = Math.min(count2, 200);
        for (let page = 1; ids.length < count2; page++) {
          const parameters = new URLSearchParams(query);
          parameters.set("page", String(page));
          parameters.set("page_size", String(pageSize2));
          const result = await request(`/knowledge/sources?${parameters}`);
          if (result.total < count2) throw new Error(`\u5F53\u524D\u7B5B\u9009\u4EC5\u6709 ${result.total} \u5F20\u5408\u683C\u6765\u6E90\uFF0C\u8BF7\u8C03\u6574\u6570\u91CF\u3002`);
          ids.push(...result.items.map((item) => item.sample_id));
          if (!result.items.length) throw new Error("\u6765\u6E90\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002");
        }
        const current = workspace.getSnapshot(), latest = workspace.view(pageId);
        if (current.datasetId === dataset.dataset_id && current.knowledgeKind === kind && latest.miningCount === view.miningCount && latest.miningSearch === view.miningSearch && latest.normalVersion === view.normalVersion && latest.miningPreset === view.miningPreset && latest.scopeRunId === view.scopeRunId && latest.miningSourceMode === view.miningSourceMode)
          workspace.updateView(pageId, { miningImages: ids.slice(0, count2) });
      } catch (error3) {
        setError(message(error3));
      } finally {
        setSelecting(false);
      }
    }
    const unavailable = !valid || (view.miningContinuous ? !!view.miningImages.length && view.miningImages.length !== count2 : view.miningImages.length !== count2);
    return /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("section", { className: "iad-setup", "aria-label": "\u77E5\u8BC6\u6316\u6398\u914D\u7F6E", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("section", { className: "iad-setup-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("h3", { children: "1. \u65B9\u5F0F\u4E0E\u4F9D\u636E" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "iad-config-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field", children: [
            "\u6267\u884C\u65B9\u5F0F",
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u6267\u884C\u65B9\u5F0F", value: view.miningContinuous ? "continuous" : "group", disabled: busy, onChange: (event) => workspace.updateView(pageId, { miningContinuous: event.target.value === "continuous" }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "group", children: "\u5F53\u524D\u56FE\u7EC4" }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "continuous", children: "\u8FDE\u7EED\u8303\u56F4 \xB7 Agent\u6267\u884C" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field", children: [
            "\u77E5\u8BC6\u9884\u8BBE",
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u9884\u8BBE", value: view.miningPreset, disabled: busy || !!view.scopeRunId, onChange: (e) => workspace.updateView(pageId, { miningPreset: e.target.value, miningPage: 1, miningImages: [] }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "", children: "\u4E0D\u4F7F\u7528\u9884\u8BBE" }),
              view.miningPreset && !versions.some((item) => item.version_id === view.miningPreset) && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("option", { value: view.miningPreset, children: [
                "\u5DF2\u9009\u7248\u672C \xB7 ",
                view.miningPreset
              ] }),
              versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: version.version_id, children: version.version_id }, version.version_id))
            ] })
          ] }),
          kind === "defect" && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field", children: [
            "\u826F\u54C1\u6BD4\u8F83\u57FA\u51C6",
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("select", { "aria-label": "\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: busy || !!view.scopeRunId, onChange: (e) => workspace.updateView(pageId, { normalVersion: e.target.value, miningImages: [], miningPage: 1 }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "", children: "\u4E0D\u4F7F\u7528\u57FA\u51C6 \xB7 \u4EC5\u6574\u7406\u5047\u8BBE" }),
              view.normalVersion && !normalVersions.some((item) => item.version_id === view.normalVersion) && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("option", { value: view.normalVersion, children: [
                "\u5DF2\u9009\u7248\u672C \xB7 ",
                view.normalVersion
              ] }),
              normalVersions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: version.version_id, children: version.version_id }, version.version_id))
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("section", { className: "iad-setup-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("h3", { children: "2. \u6316\u6398\u65B9\u5411" }),
        "    ",
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(KnowledgeDirections, { datasetId: dataset.dataset_id, kind, proposal: directionProposal, onPending: setDirectionsPending, onProposalUsed: onDirectionProposalUsed }, `${dataset.dataset_id}:${kind}`)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("section", { className: "iad-setup-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("h3", { children: "3. \u56FE\u50CF\u8303\u56F4" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "iad-config-bar", children: [
          "      ",
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field iad-short-field", children: [
            "\u56FE\u50CF\u6570\u91CF",
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("input", { type: "number", min: "1", step: "1", "aria-label": "\u6316\u6398\u56FE\u50CF\u6570\u91CF", value: view.miningCount, disabled: busy || selecting, onChange: (e) => workspace.updateView(pageId, { miningCount: e.target.value }, true) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field", children: [
            "\u6765\u6E90\u8303\u56F4",
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("select", { "aria-label": "\u6765\u6E90\u8303\u56F4", value: view.miningSourceMode, disabled: busy, onChange: (e) => workspace.updateView(pageId, { miningSourceMode: e.target.value, miningPage: 1, miningImages: [] }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "uncovered", children: "\u4EC5\u672A\u89C2\u5BDF" }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "all", children: "\u5168\u90E8\u5408\u683C \xB7 \u542B\u5386\u53F2\u6765\u6E90" }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("option", { value: "recheck", disabled: !view.miningPreset, children: "\u5224\u636E\u5F85\u91CD\u6838\u9A8C" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field", children: [
            "\u7B5B\u9009\u6765\u6E90",
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("input", { type: "search", "aria-label": "\u7B5B\u9009\u6316\u6398\u6765\u6E90", disabled: !!view.scopeRunId, value: view.miningSearch, onChange: (e) => workspace.updateView(pageId, { miningSearch: e.target.value, miningPage: 1 }, true) })
          ] })
        ] }),
        sources?.coverage && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("p", { className: "iad-muted", children: [
          "\u5DF2\u89C2\u5BDF ",
          sources.coverage.observed,
          " \xB7 \u5269\u4F59 ",
          sources.coverage.remaining,
          " \xB7 \u5F85\u6838\u5B9E ",
          sources.coverage.pending_review,
          " \xB7 \u6765\u6E90\u5931\u6548 ",
          sources.coverage.stale,
          " \xB7 \u5224\u636E\u5F85\u91CD\u6838\u9A8C ",
          sources.coverage.recheck
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        !valid && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { role: "alert", children: "\u8BF7\u8F93\u5165\u6B63\u6574\u6570\u56FE\u50CF\u6570\u91CF\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(SourcePicker, { dataset, label: "\u6765\u6E90", sources, selected: view.miningImages, target: valid ? count2 : "\u2014", disabled: busy, choosing: selecting, canChoose: valid, onChoose: () => void choose(), page: view.miningPage, onPage: (miningPage) => workspace.updateView(pageId, { miningPage }), onChange: (miningImages) => {
          setError("");
          workspace.updateView(pageId, { miningImages });
        }, search: view.miningSearch, onSearch: (miningSearch) => workspace.updateView(pageId, { miningSearch, miningPage: 1 }, true) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("section", { className: "iad-setup-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("h3", { children: "4. \u8FD0\u884C\u786E\u8BA4" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(WorkbenchModelStatus, {}),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("p", { children: [
          view.miningContinuous ? `\u8FDE\u7EED\u8303\u56F4 \xB7 \u6BCF\u7EC4 ${valid ? count2 : "\u2014"} \u5F20` : `\u5F53\u524D\u56FE\u7EC4 \xB7 ${view.miningImages.length} \u5F20`,
          " \xB7 ",
          view.miningPreset ? "\u4F7F\u7528\u6240\u9009\u77E5\u8BC6\u9884\u8BBE" : "\u4E0D\u4F7F\u7528\u77E5\u8BC6\u9884\u8BBE"
        ] }),
        (unavailable || directionsPending) && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "iad-muted", children: directionsPending ? "\u8BF7\u5148\u4FDD\u5B58\u6709\u6548\u7684\u6316\u6398\u65B9\u5411\u3002" : "\u8BF7\u6309\u76EE\u6807\u6570\u91CF\u9009\u62E9\u56FE\u50CF\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("button", { "data-action": view.miningContinuous ? "knowledge-agent-run" : "knowledge-group-run", className: "iad-primary", disabled: busy || selecting || !!error2 || unavailable || directionsPending || !model.ready, onClick: () => {
          if (view.miningContinuous) {
            onContinuous();
            return;
          }
          const [first, ...rest] = view.miningImages;
          if (!first || unavailable) return;
          onStart({ image_count: count2, images: [first, ...rest], knowledge_preset: [view.miningPreset, ...kind === "defect" ? [view.normalVersion] : []].filter(Boolean) });
        }, children: busy ? "\u542F\u52A8\u4E2D\u2026" : view.miningContinuous ? "\u5728Agent\u4E2D\u8FDE\u7EED\u6316\u6398" : `\u5F00\u59CB\u6316\u6398${kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38"}\u77E5\u8BC6` })
      ] })
    ] });
  }

  // src/client/components/KnowledgeDiscovery.tsx
  var import_jsx_runtime46 = __require("react/jsx-runtime");
  function KnowledgeDiscovery({ knowledge, evidence, onPropose }) {
    const discovery = knowledge.mining_steps.at(-1)?.result.discovery;
    const selected = knowledge.mining_prompt?.configuration.directions.filter((item) => item.enabled) || [];
    const recorded = new Set(discovery?.areas.map((area) => area.direction_id).filter(Boolean));
    const missing = selected.filter((item) => !recorded.has(item.direction_id));
    return /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("details", { className: "iad-knowledge-discovery", children: [
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("summary", { children: [
        "\u89C2\u5BDF\u8303\u56F4",
        discovery ? ` \xB7 ${discovery.areas.length} \u9879\u8BB0\u5F55` : " \xB7 \u672A\u8BB0\u5F55"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("p", { className: "iad-muted", children: [
        "\u8FD9\u662F\u751F\u6210\u65F6\u7684\u89C2\u5BDF\u8BB0\u5F55\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u8BC1\u660E\u8986\u76D6\u5B8C\u6574\u6216\u4EBA\u5DE5\u786E\u8BA4\u3002",
        knowledge.manual_edit ? "\u5F53\u524D\u4E3A\u4EBA\u5DE5\u7EF4\u62A4\u7248\u672C\u3002" : ""
      ] }),
      knowledge.mining_prompt && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("summary", { children: "\u672C\u6B21\u6316\u6398\u63D0\u793A\u8BCD" }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("pre", { className: "iad-observation", children: knowledge.mining_prompt.instruction })
      ] }),
      !!missing.length && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("p", { children: [
        "\u6240\u9009\u65B9\u5411\u672A\u8BB0\u5F55\u7ED3\u679C\uFF1A",
        missing.map((item) => item.title).join("\u3001")
      ] }),
      !discovery && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: "\u6B64\u7248\u672C\u672A\u4FDD\u5B58\u7ED3\u6784\u5316\u89C2\u5BDF\u8303\u56F4\u3002" }),
      discovery && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(import_jsx_runtime46.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("summary", { children: [
            "\u53EF\u89C1\u90E8\u4EF6 \xB7 ",
            discovery.parts.length
          ] }),
          discovery.parts.map((part) => /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("p", { children: [
              part.name,
              " \xB7 ",
              part.location
            ] }),
            evidence(part.evidence_ids)
          ] }, part.name))
        ] }),
        discovery.areas.map((area, index3) => /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("article", { className: "iad-discovery-area iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "iad-section-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("h3", { children: selected.find((item) => item.direction_id === area.direction_id)?.title || area.direction }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("span", { children: [
              area.status,
              " \xB7 ",
              area.direction_id ? "\u7528\u6237\u6240\u9009" : "\u6A21\u578B\u65B0\u589E"
            ] })
          ] }),
          !!area.subjects.length && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: area.subjects.join("\u3001") }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: area.reason }),
          !!area.check_titles.length && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("p", { className: "iad-muted", children: [
            "\u672C\u6B21\u5F52\u7EB3\u5224\u636E\uFF1A",
            area.check_titles.join("\u3001")
          ] }),
          !!area.evidence_ids.length && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("summary", { children: "\u67E5\u770B\u56FE\u50CF\u4F9D\u636E" }),
            evidence(area.evidence_ids)
          ] }),
          !area.direction_id && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("button", { onClick: () => onPropose({
            id: crypto.randomUUID(),
            datasetId: knowledge.dataset_id,
            kind: knowledge.kind,
            title: area.direction,
            instruction: `\u89C2\u5BDF${area.direction}${area.subjects.length ? `\uFF0C\u5173\u6CE8${area.subjects.join("\u3001")}` : ""}\uFF1B\u7ED3\u5408\u539F\u56FE\u6838\u9A8C\u76F8\u5173\u89C4\u5F8B\u3001\u6B63\u5E38\u53D8\u5316\u53CA\u8BC1\u636E\u9650\u5236\u3002`
          }), children: "\u52A0\u5165\u6570\u636E\u96C6\u65B9\u5411" })
        ] }, index3))
      ] })
    ] });
  }

  // src/client/components/KnowledgePage.tsx
  var import_jsx_runtime47 = __require("react/jsx-runtime");
  function KnowledgePage({ dataset, kind, refreshRevision, headerActions }) {
    const { workspace } = useWorkspace();
    const pageId = "industrial-knowledge";
    const view = workspace.view(pageId);
    const [error2, setError] = (0, import_react43.useState)("");
    const [busy, setBusy] = (0, import_react43.useState)(false);
    const [directionProposal, setDirectionProposal] = (0, import_react43.useState)();
    const consumeDirection = (0, import_react43.useCallback)(() => setDirectionProposal(void 0), []);
    const [revision, setRevision] = (0, import_react43.useState)(0);
    const current = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
    const reference = useKnowledge(dataset.dataset_id, kind === "defect" ? "normal" : null, view.normalVersion, revision + refreshRevision);
    const { knowledge, versions } = current;
    const normal = view.normalVersion ? reference.knowledge : null, normalVersions = reference.versions;
    const loading = current.loading || reference.loading, loadError = current.error || reference.error;
    const [lightbox, setLightbox] = (0, import_react43.useState)(null);
    const updated = (0, import_react43.useCallback)(() => setRevision((value) => value + 1), []);
    const polling = useJobs("knowledge", dataset.dataset_id, updated, view.job);
    const jobs = polling.jobs.filter((job) => job.kind === kind);
    const running = jobs.some((job) => job.status === "RUNNING" || job.status === "PENDING");
    async function start(group) {
      setBusy(true);
      setError("");
      try {
        const input = { ...group, kind };
        const job = await request(view.scopeRunId ? `/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}/start` : "/knowledge/start", input);
        const current2 = workspace.getSnapshot();
        if (current2.datasetId === dataset.dataset_id && current2.knowledgeKind === kind) workspace.updateView(pageId, { version: "", miningImages: [], job: job.run_id, tab: "jobs" });
        polling.refresh();
        updated();
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    const scoped = (0, import_react43.useCallback)((scope) => {
      const snapshot = workspace.getSnapshot(), current2 = workspace.view(pageId);
      if (snapshot.datasetId === dataset.dataset_id && snapshot.knowledgeKind === kind && current2.scopeRunId === scope.scope_run_id && (current2.miningSearch !== scope.search || current2.miningPreset !== (scope.current_version_id || "") || kind === "defect" && current2.normalVersion !== (scope.normal_version_id || "")))
        workspace.updateView(pageId, { miningSearch: scope.search, miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [] }, true);
    }, [workspace, dataset.dataset_id, kind]);
    async function continuous() {
      setBusy(true);
      setError("");
      try {
        const count2 = Number(view.miningCount);
        if (!Number.isInteger(count2) || count2 <= 0) throw new Error("\u8BF7\u8F93\u5165\u6B63\u6574\u6570\u56FE\u50CF\u6570\u91CF");
        const scope = view.scopeRunId ? await request(`/knowledge/scopes/${encodeURIComponent(view.scopeRunId)}`) : await request("/knowledge/scopes/open", {
          dataset_id: dataset.dataset_id,
          kind,
          objective: `\u8FDE\u7EED\u6316\u6398\u5F53\u524D\u7B5B\u9009\u7684\u5168\u90E8${kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38"}\u6765\u6E90\uFF0C\u6BCF\u6B21${count2}\u5F20\uFF0C\u4FDD\u7559\u51B2\u7A81\u4EBA\u5DE5\u786E\u8BA4`,
          search: view.miningSearch,
          starting_version_id: view.miningPreset || null,
          normal_version_id: kind === "defect" ? view.normalVersion || null : null
        });
        const current2 = workspace.getSnapshot();
        if (current2.datasetId !== dataset.dataset_id || current2.knowledgeKind !== kind) throw new Error("\u6570\u636E\u96C6\u6216\u77E5\u8BC6\u7C7B\u578B\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u539F\u8303\u56F4\u7EE7\u7EED");
        workspace.updateView(pageId, { scopeRunId: scope.scope_run_id });
        await workspace.mineScope(scope.scope_run_id, count2, view.miningImages);
      } catch (error3) {
        setError(message(error3));
      } finally {
        setBusy(false);
      }
    }
    const scopeRunId = view.scopeRunId || knowledge?.scope_run_id || "";
    const term = view.knowledgeSearch.trim().normalize("NFKC").toLocaleLowerCase();
    const checks = (knowledge?.checks || []).filter((item) => (!view.knowledgeStatus || item.status === view.knowledgeStatus) && [item.title, item.subject, item.location, item.criterion, ...item.allowed_variations, ...item.limitations].join(" ").normalize("NFKC").toLocaleLowerCase().includes(term));
    const check = checks.find((check2) => check2.check_id === view.checkId) || checks[0];
    function evidence(ids) {
      return knowledge && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KnowledgeEvidenceGallery, { versionId: knowledge.version_id, items: knowledge.evidence.filter((item) => ids.includes(item.image.evidence_id)), onOpen: setLightbox });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-knowledge-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(WorkbenchHeader, { pageId, children: [
        headerActions,
        view.tab === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "results" }), children: "\u8FD4\u56DE\u77E5\u8BC6\u7ED3\u679C" }) : /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { className: "iad-primary", disabled: busy || running, onClick: () => workspace.updateView(pageId, { tab: "setup" }), children: "\u65B0\u5EFA\u6316\u6398" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-knowledge-context", children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { className: "iad-type-switch", role: "group", "aria-label": "\u77E5\u8BC6\u7C7B\u578B", children: [["normal", "\u826F\u54C1"], ["defect", "\u5F02\u5E38"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { "aria-pressed": kind === value, onClick: () => workspace.selectKnowledgeKind(value), children: label }, value)) }),
        view.tab !== "setup" && view.tab !== "jobs" && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("label", { className: "iad-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { className: "iad-visually-hidden", children: "\u77E5\u8BC6\u7248\u672C" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: (event) => workspace.updateView(pageId, { version: event.target.value, checkId: "" }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("option", { value: "", children: [
                "\u5F53\u524D\u53D1\u5E03\u7248\u672C",
                versions.length ? "" : " \xB7 \u5C1A\u672A\u53D1\u5E03"
              ] }),
              versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.source_count,
                " \u5F20\u6765\u6E90 \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          view.version && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u5386\u53F2\u7248\u672C\u3002" }),
          loading && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { role: "status", className: "iad-muted", children: "\u6B63\u5728\u8BFB\u53D6\u77E5\u8BC6\u2026" }),
          loadError && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { role: "alert", className: "iad-error", children: [
            loadError,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: updated, children: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { className: "iad-muted", children: kind === "normal" ? `\u826F\u54C1\u6765\u6E90 \xB7 ${dataset.reference_sample_ids.length} \u5F20` : dataset.format === "folder_classification" ? "\u5F02\u5E38\u5019\u9009\u4EE5\u76EE\u5F55\u6807\u7B7E\u53CA\u6838\u9A8C\u7ED3\u679C\u4E3A\u51C6" : "\u5F02\u5E38\u5019\u9009\u4EE5\u5B9E\u9645\u6807\u6CE8\u53CA\u6838\u9A8C\u7ED3\u679C\u4E3A\u51C6" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-images", datasetId: dataset.dataset_id, tab: kind === "normal" ? "sources" : "results", selected: "", page: 1, filters: { ...initialFilters, reference_status: kind === "normal" ? "candidate" : "all", raw_label_filters: kind === "defect" && dataset.format === "folder_classification" ? ["FAIL"] : [], annotation_filters: kind === "defect" && dataset.format !== "folder_classification" ? ["present"] : [] } }), children: kind === "normal" ? "\u7BA1\u7406\u6765\u6E90" : "\u67E5\u770B\u5F02\u5E38\u5019\u9009" })
          ] })
        ] })
      ] }),
      (error2 || polling.error) && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { role: "alert", className: "iad-error", children: error2 || polling.error }),
      scopeRunId && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KnowledgeScopePanel, { datasetId: dataset.dataset_id, kind, scopeRunId, revision: revision + refreshRevision, onScope: scoped }),
      view.tab === "setup" && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KnowledgeSetup, { dataset, kind, versions, normalVersions, busy: busy || running, directionProposal, onDirectionProposalUsed: consumeDirection, onStart: (group) => void start(group), onContinuous: () => void continuous() }),
      view.tab !== "setup" && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(PageTabs, { label: "\u77E5\u8BC6\u89C6\u56FE", items: [{ id: "results", label: "\u77E5\u8BC6\u6761\u76EE" }, { id: "findings", label: kind === "normal" ? "\u5F85\u6838\u5B9E" : "\u6807\u6CE8\u6838\u9A8C" }, { id: "versions", label: "\u7248\u672C" }, { id: "jobs", label: "\u4F5C\u4E1A\u8BB0\u5F55" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
        view.tab !== "jobs" && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("section", { className: "iad-knowledge-content", children: knowledge ? /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KnowledgeState, { freshness: current.freshness }),
          knowledge.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { "data-field": "knowledge-normal-version", children: [
            "\u6B64\u77E5\u8BC6\u7248\u672C\u4F9D\u636E\u826F\u54C1 ",
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("code", { children: knowledge.normal_version_id })
          ] }),
          knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: "\u4E0B\u6B21\u6316\u6398\u5C06\u4F7F\u7528\u53E6\u4E00\u826F\u54C1\u7248\u672C\uFF0C\u5F53\u524D\u7ED3\u679C\u4FDD\u7559\u539F\u4F9D\u636E\u3002" }),
          knowledge.manual_edit && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: "\u4EBA\u5DE5\u7EF4\u62A4\u7248\u672C" }),
          knowledge.summary && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: knowledge.summary }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("details", { className: "iad-knowledge-overview", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("summary", { children: "\u7248\u672C\u4FE1\u606F" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { className: "iad-muted", children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("code", { children: knowledge.version_id }),
              " \xB7 ",
              knowledge.sources.length,
              " \u5F20\u6765\u6E90 \xB7 ",
              knowledge.checks.length,
              " \u9879\u5224\u636E \xB7 ",
              knowledge.findings.length,
              " \u9879\u6838\u9A8C"
            ] })
          ] }),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KnowledgeDiscovery, { knowledge, evidence, onPropose: (proposal) => {
            setDirectionProposal(proposal);
            workspace.updateView(pageId, { tab: "setup" });
          } }),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_jsx_runtime47.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-knowledge-split", "data-detail": !!view.checkId && checks.some((item) => item.check_id === view.checkId), children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-check-list", children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-row", "aria-label": "\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009", children: [
                /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("label", { className: "iad-field", children: [
                  "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE",
                  /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: view.knowledgeSearch, onChange: (event) => workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("label", { className: "iad-field", children: [
                  "\u652F\u6301\u72B6\u6001",
                  /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u652F\u6301\u72B6\u6001", value: view.knowledgeStatus, onChange: (event) => workspace.updateView(pageId, { knowledgeStatus: event.target.value }), children: [
                    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
                    Object.entries(knowledgeStatuses).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("option", { value, children: label }, value))
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { disabled: !view.knowledgeSearch && !view.knowledgeStatus, onClick: () => workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" }), children: "\u6E05\u9664\u77E5\u8BC6\u7B5B\u9009" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { role: "status", "aria-label": "\u77E5\u8BC6\u7B5B\u9009\u7ED3\u679C", children: [
                "\u663E\u793A ",
                checks.length,
                " / ",
                knowledge.checks.length,
                " \u9879\u5224\u636E"
              ] }),
              checks.map((item) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("button", { "aria-pressed": check?.check_id === item.check_id, onClick: () => workspace.updateView(pageId, { checkId: item.check_id }, true), children: [
                /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("strong", { children: item.title }),
                /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("span", { children: [
                  knowledgeStatuses[item.status],
                  " \xB7 \u652F\u6301 ",
                  item.support_evidence_ids.length,
                  " / \u53CD\u5BF9 ",
                  item.counter_evidence_ids.length
                ] })
              ] }, item.check_id)),
              !checks.length && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: knowledge.checks.length ? "\u6CA1\u6709\u5339\u914D\u7684\u5224\u636E\uFF0C\u8BF7\u8C03\u6574\u6216\u6E05\u9664\u7B5B\u9009\u3002" : "\u5C1A\u65E0\u53EF\u53D1\u5E03\u5224\u636E\uFF0C\u8BF7\u67E5\u770B\u9650\u5236\u548C\u6838\u9A8C\u7ED3\u679C\u3002" })
            ] }),
            check && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("article", { className: "iad-check-detail", children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { className: "iad-back-to-checks", onClick: () => workspace.updateView(pageId, { checkId: "" }, true), children: "\u8FD4\u56DE\u5224\u636E\u5217\u8868" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-section-header", children: [
                /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h2", { children: check.title }),
                /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                  DeleteAction,
                  {
                    title: "\u5220\u9664\u77E5\u8BC6\u6761\u76EE",
                    name: check.title,
                    description: "\u53D1\u5E03\u79FB\u9664\u8BE5\u6761\u76EE\u7684\u65B0\u7248\u672C\uFF0C\u4FDD\u7559\u5386\u53F2\u77E5\u8BC6\u548C\u5DF2\u6709\u5BA1\u8BA1\u4F9D\u636E\u3002",
                    disabled: current.freshness?.current_version_id !== knowledge.version_id || loading,
                    restoreFocus: () => document.querySelector(".iad-knowledge-page .iad-tabs button.active"),
                    onDelete: async (submission_id) => {
                      const next = await request(`/knowledge/versions/${encodeURIComponent(knowledge.version_id)}/checks/remove`, { submission_id, check_id: check.check_id });
                      workspace.updateView(pageId, { version: "", miningPreset: view.miningPreset === knowledge.version_id ? next.version_id : view.miningPreset, miningImages: [] });
                      workspace.updateView(pageId, { checkId: "" }, true);
                      updated();
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { className: "iad-muted", children: [
                check.subject,
                " \xB7 ",
                check.location,
                " \xB7 ",
                knowledgeStatuses[check.status]
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "\u5224\u5B9A\u4F9D\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: check.criterion }),
              !!check.recheck_sample_ids.length && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("button", { onClick: () => workspace.updateView(pageId, { tab: "setup", miningPreset: knowledge.version_id, miningSourceMode: "recheck", miningContinuous: false, miningImages: [], miningPage: 1 }), children: [
                "\u91CD\u6838\u9A8C\u5386\u53F2\u6765\u6E90 \xB7 ",
                check.recheck_sample_ids.length,
                " \u5F20"
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "\u5141\u8BB8\u53D8\u5316" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: check.allowed_variations.join("\uFF1B") || "\u672A\u8BB0\u5F55" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "\u652F\u6301\u8BC1\u636E" }),
              evidence(check.support_evidence_ids),
              !!check.counter_evidence_ids.length && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "\u53CD\u5BF9\u8BC1\u636E" }),
                evidence(check.counter_evidence_ids)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "\u9002\u7528\u9650\u5236" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: [...check.limitations, ...check.support_limitations].join("\uFF1B") || "\u672A\u8BB0\u5F55\u989D\u5916\u9650\u5236" })
            ] })
          ] }) }),
          view.tab === "findings" && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
            knowledge.conflicts.map((conflict) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("article", { className: "iad-info-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: conflict.resolution?.status === "resolved" ? "\u51B2\u7A81\u5DF2\u91CD\u6838\u9A8C" : "\u77E5\u8BC6\u4E0E\u56FE\u50CF\u5F85\u6838\u5B9E" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: conflict.description }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { children: [
                "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
                conflict.normal_explanation
              ] }),
              evidence([...conflict.new_evidence_ids, ...conflict.comparison_evidence_ids]),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId: dataset.dataset_id, tab: "conflicts", version: knowledge.version_id, conflictId: conflict.conflict_id }), children: "\u4EBA\u5DE5\u786E\u8BA4\u6B64\u51B2\u7A81" })
            ] }, conflict.conflict_id)),
            knowledge.findings.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("article", { className: "iad-info-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: finding.judgment.status === "supported" ? "\u56FE\u50CF\u652F\u6301\u5F02\u5E38" : finding.judgment.status === "refuted" ? "\u6B63\u5E38\u89E3\u91CA\u6210\u7ACB" : "\u8BC1\u636E\u4E0D\u8DB3" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: finding.judgment.description }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { children: [
                "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
                finding.judgment.normal_explanation
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: finding.judgment.limitations.join("\uFF1B") }),
              evidence(finding.judgment.evidence_ids),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })
            ] }, finding.finding_id)),
            !knowledge.findings.length && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })
          ] }),
          !!knowledge.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("summary", { children: "\u77E5\u8BC6\u9650\u5236" }),
            knowledge.limitations.map((limitation, index3) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: limitation }, index3))
          ] }),
          !!knowledge.corrections.length && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("summary", { children: "\u4EBA\u5DE5\u4FEE\u8BA2\u5019\u9009" }),
            knowledge.corrections.map((item) => /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: item.instruction }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: knowledge.revisions.find((revision2) => revision2.previous_check_id === item.check_id)?.reason })
            ] }, item.check_id))
          ] }),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "setup", miningPreset: knowledge.version_id, miningSourceMode: "uncovered", miningImages: [], miningPage: 1 }), children: "\u4F5C\u4E3A\u9884\u8BBE\u7EE7\u7EED\u9009\u56FE" }),
          view.tab === "versions" && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(KnowledgeVersions, { versions, onSelect: (version) => workspace.updateView(pageId, { version, checkId: "", tab: "results" }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { children: [
          "\u5C1A\u65E0",
          kind === "normal" ? "\u826F\u54C1" : "\u4E0D\u826F\u54C1",
          "\u77E5\u8BC6\u7248\u672C\u3002"
        ] }) }),
        view.tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-knowledge-jobs iad-job-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(JobTable, { jobs, pageId, onChanged: polling.refresh })
        ] })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/ReviewRecords.tsx
  var import_react44 = __require("react");
  var import_jsx_runtime48 = __require("react/jsx-runtime");
  function ReviewRecords({ datasetId, page, search, selected, revision, onPage, onSearch, onSelect, onQueue, detail }) {
    const [result, setResult] = (0, import_react44.useState)(null);
    const [loading, setLoading] = (0, import_react44.useState)(true), [error2, setError] = (0, import_react44.useState)("");
    const [retry, setRetry] = (0, import_react44.useState)(0);
    (0, import_react44.useEffect)(() => {
      const controller = new AbortController();
      setLoading(true);
      setError("");
      const query = new URLSearchParams({ dataset_id: datasetId, page: String(page), page_size: String(pageSize), search });
      request(`/review/history?${query}`, void 0, void 0, controller.signal).then((result2) => {
        if (!controller.signal.aborted) setResult(result2);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [datasetId, page, search, revision, retry]);
    const pagination = result && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Pagination, { total: result.total, page, unit: "\u6761\u8BB0\u5F55", onPage });
    const showingDetail = !loading && !error2 && result?.items.some((record) => record.sample_id === selected);
    return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: showingDetail ? "iad-main" : "", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("section", { className: "iad-review-records", "aria-label": "\u590D\u6838\u8BB0\u5F55", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("label", { className: "iad-field", children: [
          "\u641C\u7D22\u590D\u6838\u8BB0\u5F55",
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("input", { "aria-label": "\u641C\u7D22\u590D\u6838\u8BB0\u5F55", placeholder: "\u56FE\u50CF\u540D\u3001\u590D\u6838\u4EBA\u6216\u8BF4\u660E", value: search, onChange: (event) => onSearch(event.target.value) })
        ] }),
        error2 ? /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { role: "alert", className: "iad-error", children: [
          error2,
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("button", { onClick: () => setRetry((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D\u8BB0\u5F55" })
        ] }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u590D\u6838\u8BB0\u5F55\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(import_jsx_runtime48.Fragment, { children: [
          result?.items.length ? /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "iad-table-scroll", role: "region", "aria-label": "\u590D\u6838\u5386\u53F2\u8868\u683C", tabIndex: 0, onFocus: (event) => {
            if (event.target === event.currentTarget) event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
          }, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("table", { className: "iad-resource-table", children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("caption", { children: "\u4EBA\u5DE5\u88C1\u51B3\u5386\u53F2" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("th", { children: "\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("th", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("th", { children: "\u590D\u6838\u4EBA / \u65F6\u95F4" }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("th", { children: "\u590D\u6838\u8BF4\u660E" }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("th", { children: "\u64CD\u4F5C" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("tbody", { children: result.items.map((record) => /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("tr", { "data-decision-id": record.decision_id, "data-selected": record.sample_id === selected, children: [
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("td", { title: record.relative_path, children: record.relative_path }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("td", { children: reviewLabel(record.decision) }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("td", { children: [
                record.reviewer,
                /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("br", {}),
                record.submitted_at ? /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "\u672A\u8BB0\u5F55\u63D0\u4EA4\u65F6\u95F4"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("td", { children: record.comment || "\u2014" }),
              /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("button", { onClick: () => onSelect(record.sample_id), children: "\u67E5\u770B\u6837\u672C" }) })
            ] }, record.decision_id)) })
          ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "iad-empty", children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h2", { children: search ? "\u6CA1\u6709\u5339\u914D\u7684\u590D\u6838\u8BB0\u5F55" : "\u6682\u65E0\u590D\u6838\u8BB0\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: search ? "\u8BF7\u8C03\u6574\u641C\u7D22\u5173\u952E\u8BCD\u3002" : "\u5B8C\u6210\u4E00\u6B21\u4EBA\u5DE5\u88C1\u51B3\u540E\uFF0C\u8BB0\u5F55\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("button", { onClick: onQueue, children: "\u524D\u5F80\u590D\u6838\u961F\u5217" })
          ] }),
          pagination
        ] })
      ] }),
      showingDetail && detail
    ] });
  }

  // src/client/controls.ts
  var controlStyles = `
:is(.iad-workbench,.iad-tool-card) button,:is(.iad-workbench,.iad-tool-card) input,:is(.iad-workbench,.iad-tool-card) select,:is(.iad-workbench,.iad-tool-card) textarea {font:inherit;}
:is(.iad-workbench,.iad-tool-card) button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);min-height:var(--iad-control-height);padding:8px 12px;transition:background-color 140ms,border-color 140ms;}
:is(.iad-workbench,.iad-tool-card) button:hover:not(:disabled) {background:var(--iad-hover);}
:is(.iad-workbench,.iad-tool-card) button:disabled {cursor:default;opacity:.45;}
:is(.iad-workbench,.iad-tool-card) button.iad-primary {background:var(--iad-primary-fill);border-color:var(--iad-primary-fill);color:var(--iad-on-primary);}
:is(.iad-workbench,.iad-tool-card) button.iad-primary:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-primary-fill) 88%,#000);}
:is(.iad-workbench,.iad-tool-card) button.iad-danger {color:var(--iad-danger);}
:is(.iad-workbench,.iad-tool-card) input,:is(.iad-workbench,.iad-tool-card) select,:is(.iad-workbench,.iad-tool-card) textarea {min-width:0;max-width:100%;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 10px;min-height:var(--iad-control-height);}
:is(.iad-workbench,.iad-tool-card) :is(input,textarea)::placeholder {color:var(--iad-muted);opacity:1;}
:is(.iad-workbench,.iad-tool-card) textarea {min-height:80px;resize:vertical;}
:is(.iad-workbench,.iad-tool-card) :is(button,input,select,textarea,summary,[tabindex]):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
:is(.iad-workbench,.iad-tool-card) :is(input[type=checkbox],input[type=radio]) {min-height:20px;width:20px;margin:0;accent-color:var(--iad-primary);}
:is(.iad-workbench,.iad-tool-card) .iad-icon-button {display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:8px;flex-shrink:0;}
@media(prefers-reduced-motion:reduce) {:is(.iad-workbench,.iad-tool-card) button {transition:none;}}
`;

  // src/client/styles/models.ts
  var modelsStyles = `
.iad-model-configuration{max-width:1000px}.iad-model-form{padding:24px;margin-top:20px;background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-model-configuration>.iad-muted{margin-top:8px}.iad-model-endpoint p{font-size:12px;color:var(--iad-muted);overflow-wrap:anywhere;margin-top:6px}.iad-model-configuration fieldset{border:0;min-width:0;padding:0;margin:0}.iad-model-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:0 0 16px}.iad-model-fields .iad-field{min-width:0;margin:0}.iad-model-advanced{margin:0;min-width:0}.iad-model-advanced>summary{cursor:pointer;min-height:40px}.iad-model-advanced[open]>summary{margin-bottom:16px}.iad-model-advanced textarea{width:100%}.iad-provider-manager{max-width:1160px;min-width:0}.iad-provider-manager>.iad-muted{margin-bottom:20px}.iad-provider-manager>.iad-table-scroll{background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-provider-manager input{max-width:100%}.iad-provider-endpoint{overflow-wrap:anywhere;max-width:420px}.iad-provider-dialog{width:min(780px,calc(100vw - 32px))}.iad-provider-dialog fieldset{border:0;padding:0;margin:0;min-width:0}.iad-provider-model{padding:12px 16px;margin:12px 0;background:var(--iad-surface-muted);border-radius:8px}.iad-provider-model .iad-row{justify-content:space-between}.iad-model-status{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding:10px 14px;background:var(--iad-surface);border-radius:8px}.iad-model-status span{min-width:0;overflow-wrap:anywhere;font-size:12px;color:var(--iad-muted)}@media(max-width:650px){.iad-model-fields{grid-template-columns:minmax(0,1fr)}}
`;

  // src/client/styles/exploration.ts
  var explorationStyles = `.iad-exploration-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}.iad-exploration-groups>section+section{border-left:1px solid var(--iad-border);padding-left:32px!important}.iad-exploration-groups h3{margin:0 0 14px}.iad-exploration-groups fieldset{border:0;padding:0;min-width:0}.iad-exploration-page{min-width:0}.iad-exploration-page .iad-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px;padding:40px 24px;background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-exploration-page .iad-empty h2{margin:0;color:var(--iad-text)}.iad-exploration-page .iad-empty p{max-width:480px}.iad-exploration-page .iad-empty button{margin-top:8px}.iad-exploration-page textarea{width:100%}.iad-exploration-results{max-width:1160px}.iad-exploration-results>.iad-muted{margin-bottom:20px}.iad-exploration-results>.iad-table-scroll{background:var(--iad-surface);border-radius:var(--iad-radius)}@container workbench (max-width:640px){.iad-exploration-groups{grid-template-columns:minmax(0,1fr)}.iad-exploration-groups>section+section{border-left:0;border-top:1px solid var(--iad-border);padding:24px 0 0!important}}
`;

  // src/client/styles/base.ts
  var baseStyles = `.iad-workbench {height:100%;box-sizing:border-box;overflow:auto;min-width:0;padding:var(--iad-page-padding);color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
.iad-workbench * {box-sizing:border-box;}
.iad-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:var(--iad-title-size);line-height:1.285714;margin:0;font-weight:600;}
.iad-workbench h2 {font-size:var(--iad-section-size);line-height:1.4;margin:0 0 var(--iad-space-4);font-weight:600;}
.iad-workbench h3 {font-size:var(--iad-group-size);line-height:1.5;margin:var(--iad-space-6) 0 var(--iad-space-2);font-weight:600;}
.iad-workbench p {margin:0;}.iad-workbench p+p {margin-top:12px;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-action-end {margin-inline-start:auto;flex:none;}
.iad-header {flex-shrink:0;justify-content:space-between;align-items:end;margin-bottom:var(--iad-section-gap);}.iad-header-actions{display:flex;align-items:center;gap:var(--iad-space-3);min-width:0;flex-wrap:wrap}.iad-header-actions select{max-width:min(100%,24rem)}.iad-breadcrumb{color:var(--iad-muted);font-size:.75rem;margin:0 0 var(--iad-space-2)}



.iad-type-switch {display:inline-flex;gap:3px;padding:3px;background:var(--iad-surface-muted);border-radius:var(--iad-radius);}
.iad-type-switch button {border-color:transparent;background:transparent;min-width:64px;min-height:32px;padding:5px 16px;}
.iad-type-switch button[aria-pressed=true] {background:var(--iad-surface);color:var(--iad-primary);font-weight:600;}
.iad-tabs {flex-shrink:0;display:flex;gap:var(--iad-space-6);margin-bottom:var(--iad-space-6);border-bottom:1px solid var(--iad-border);overflow:auto;}
.iad-tabs button {border:0;border-radius:0;border-bottom:2px solid transparent;background:transparent;min-height:44px;padding:10px 0;white-space:nowrap;color:var(--iad-muted);}
.iad-tabs button.active {background:transparent;color:var(--iad-primary);border-bottom-color:var(--iad-primary);}.iad-tab-panel{min-width:0;}.iad-tab-panel:focus-visible{outline:2px solid var(--iad-primary);outline-offset:2px;}
.iad-section-layout {display:grid;grid-template-columns:180px minmax(0,1fr);gap:32px;padding:28px 0;border-bottom:1px solid var(--iad-border);min-width:0;}
.iad-section-layout:first-child {padding-top:0;}.iad-section-layout:last-of-type {padding-bottom:0;border-bottom:0;}
.iad-section-layout>div {min-width:0;}.iad-section-layout h3 {margin:0;}.iad-section-layout .iad-field:first-child {margin-top:0;}
@container workbench (max-width:1180px){.iad-section-layout{grid-template-columns:150px minmax(0,1fr);gap:24px}}
@container workbench (max-width:900px){.iad-section-layout{grid-template-columns:minmax(0,1fr);gap:20px}}
`;

  // src/client/styles/collections.ts
  var collectionsStyles = `.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start;}
.iad-audit-sample:not(.iad-inline-dialog) .iad-inspector{position:static;padding:0}.iad-audit-sample:not(.iad-inline-dialog) .iad-inspector>h2{display:none}
.iad-main[data-compact=true]{grid-template-columns:minmax(0,1fr)}
.iad-gallery {min-width:0;color:var(--iad-text);background:transparent;border:0;border-radius:var(--iad-radius);padding:0;}.iad-filters {display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-bottom:20px;background:transparent;padding:0;}
.iad-filter {font-size:12px;color:var(--iad-muted);display:flex;flex-direction:column;gap:8px;min-width:0;max-width:100%;}
.iad-filter select {font-size:14px;width:150px;max-width:100%;color:var(--iad-text);}
.iad-pagination {display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 0;font-size:12px;}
.iad-pagination button {font-size:12px;}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,184px),1fr));gap:24px 16px;}
.iad-sample-item {position:relative;min-width:0;}
.iad-workbench button.iad-sample {display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;width:100%;height:100%;padding:0;text-align:left;overflow:hidden;border:2px solid transparent;box-shadow:none;background:var(--iad-surface);}
.iad-workbench button.iad-sample:hover {background:var(--iad-hover);}
.iad-workbench button.iad-sample.is-selected {border-color:var(--iad-primary);}
.iad-sample>strong {display:block;margin:0;padding:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:20px;font-weight:500;}
.iad-thumb {position:relative;width:100%;aspect-ratio:4/3;flex:none;overflow:hidden;background:var(--iad-surface-muted);}.iad-thumb img {position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;}
.iad-sample-label {font-size:.75rem;line-height:44px;padding:0 8px;color:var(--iad-muted);}
.iad-workbench .iad-status-trigger {position:absolute;right:4px;bottom:2px;z-index:1;display:flex;align-items:center;justify-content:end;gap:6px;min-height:44px;padding:4px 8px;border:0;background:transparent;font-size:.75rem;color:var(--iad-muted);}
.iad-status-mark {width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;}
.iad-reference {padding:2px 5px;color:var(--iad-on-viewer);border-radius:4px;font-size:12px;}
.iad-reference {position:absolute;left:6px;bottom:6px;background:var(--iad-success-badge);}
.iad-inspector {background:var(--iad-surface);border:0;border-radius:var(--iad-radius);padding:20px;min-width:0;position:sticky;top:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:var(--iad-surface-muted)!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-inspector-filename{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.iad-observation-summary{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.iad-inspector>h3{margin-top:16px}.iad-inspector-basis{margin-top:12px!important;overflow-wrap:anywhere}.iad-audit-details{margin-top:20px}.iad-audit-details>summary{cursor:pointer;min-height:40px;color:var(--iad-muted)}
.iad-inspector>.iad-media-load .iad-image-button {height:156px;margin:16px 0;display:flex;justify-content:center;align-items:center;overflow:hidden}.iad-inspector>.iad-media-load .iad-image-frame {width:auto;max-width:100%;height:100%}.iad-inspector>.iad-media-load .iad-image-frame img {width:auto;max-width:100%;height:100%;object-fit:contain;}
.iad-image-frame svg,.iad-finding-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon,.iad-finding-layer rect {fill:none;stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-on-viewer);stroke:var(--iad-viewer);stroke-width:calc(4px / var(--iad-view-scale,1));paint-order:stroke;stroke-linejoin:round;font-size:calc(14px / var(--iad-view-scale,1));}
.iad-image-frame .iad-annotation-mask {opacity:.28;}
.iad-image-frame .iad-annotation-mask rect {fill:var(--iad-warning);stroke:none;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench code {overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-row>.iad-field {flex:1 1 280px;min-width:0;}
.iad-error {color:var(--iad-danger);background:var(--iad-danger-bg);padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-muted {color:var(--iad-muted);font-size:.75rem;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-review-records {min-width:0;padding:18px;background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-preview-table {width:100%;border-collapse:collapse;text-align:left;font-size:13px;}.iad-preview-table th,.iad-preview-table td {padding:10px 16px;height:56px;border-bottom:1px solid var(--iad-border);}.iad-preview-table th {height:44px;background:var(--iad-surface-muted);color:var(--iad-muted);font-weight:500}.iad-preview-table .iad-number {text-align:right;font-variant-numeric:tabular-nums}.iad-preview-table select {width:150px;max-width:100%;}
.iad-table-scroll {max-width:100%;overflow:auto;scroll-margin-block:24px;}.iad-review-records table {width:100%;min-width:620px;border-collapse:collapse;text-align:left;font-size:13px;}
.iad-review-records .iad-table-scroll {max-height:min(60dvh,480px);}
.iad-review-records caption {text-align:left;font-weight:600;margin:12px 0;}.iad-review-records th,.iad-review-records td {padding:12px;vertical-align:top;overflow-wrap:anywhere;max-width:240px;}
.iad-review-records thead,.iad-review-records tr[data-selected=true] {background:var(--iad-surface-muted);}.iad-review-records time {font-size:12px;color:var(--iad-muted);}
.iad-settings {display:grid;gap:28px;min-width:0;max-width:1160px;}
.iad-settings>section {min-width:0;}.iad-dataset-list>.iad-table-scroll,.iad-dataset-detail>.iad-tab-panel {background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-dataset-detail>.iad-tab-panel{padding:24px}.iad-dataset-list .iad-section-header input{width:240px;max-width:65%}.iad-dataset-detail>h2{overflow-wrap:anywhere}.iad-dataset-detail .iad-rule{margin-top:20px}.iad-dataset-detail .iad-section-layout .iad-field{margin-bottom:20px;}
.iad-job-table {min-width:0;}.iad-job-table>.iad-field {max-width:240px;}.iad-identifier {display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-resource-table {width:100%;border-collapse:collapse;text-align:left;font-size:.875rem;}
.iad-resource-table th,.iad-resource-table td {padding:8px 16px;height:56px;border-bottom:1px solid var(--iad-border);vertical-align:middle;}
.iad-resource-table th {height:44px;background:var(--iad-surface-muted);font-weight:500;color:var(--iad-muted);white-space:nowrap;}
.iad-resource-table .iad-number {text-align:right;font-variant-numeric:tabular-nums;}
.iad-resource-table tr[data-selected=true] {background:var(--iad-hover);}
.iad-resource-table .iad-dataset-name {margin:0;min-width:140px;max-width:360px;}
.iad-row-menu summary {cursor:pointer;display:flex;align-items:center;gap:8px;min-height:40px;padding:8px;}
.iad-row-menu .iad-floating-menu-panel {min-width:64px;}
.iad-dataset-name {flex:1;}
.iad-dataset-name {min-width:0;margin-bottom:12px;}
.iad-workbench .iad-name-trigger {display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;padding:4px 6px;background:transparent;border-color:transparent;text-align:left;font-weight:600;min-height:44px;}
.iad-name-trigger span {min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.iad-name-trigger svg {flex-shrink:0;}
.iad-dataset-name input {width:100%;}
.iad-detail-dialog:has(.iad-dataset-import) {width:min(640px,calc(100vw - 32px));}
.iad-dataset-import {max-width:640px;margin:auto;}
.iad-directory {min-width:0;margin:0;border:0;background:var(--iad-surface-muted);padding:14px;border-radius:8px;}.iad-directory code {overflow-wrap:anywhere;}
.iad-directory-list {display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px;}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:var(--iad-surface-muted);border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
`;

  // src/client/styles/jobs.ts
  var jobsStyles = `.iad-job-panel {min-width:0;}.iad-job-panel>h2 {margin-top:26px;}.iad-job {padding:16px;margin-bottom:12px;background:var(--iad-surface-muted);border-radius:8px;}
.iad-job {overflow-wrap:anywhere;}.iad-job[aria-current="true"] {outline:2px solid var(--iad-primary);outline-offset:2px;}
.iad-job-links {display:flex;flex-wrap:wrap;gap:8px;}.iad-job-errors {padding-left:20px;}.iad-job-errors p {margin-top:6px;}
.iad-retry-scope {margin-top:12px;display:grid;gap:10px;}.iad-retry-scope fieldset {min-width:0;border:0;padding:0;margin:0;}.iad-retry-scope legend {margin-bottom:8px;}
.iad-retry-samples {max-height:260px;overflow:auto;display:grid;gap:8px;}.iad-retry-samples label {display:flex;align-items:center;gap:8px;padding:8px;background:var(--iad-surface);border-radius:6px;}.iad-retry-samples input {flex:0 0 auto;}.iad-retry-samples span {flex:1;min-width:0;overflow-wrap:anywhere;}
.iad-job progress {width:100%;height:7px;accent-color:var(--iad-primary);}.iad-job small {overflow-wrap:anywhere;}
`;

  // src/client/styles/overlays.ts
  var overlaysStyles = `.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
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
.iad-floating-menu {position:relative;}
.iad-floating-menu-panel {z-index:20;min-width:180px;padding:12px;overflow:auto;background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:8px;box-shadow:0 8px 24px var(--iad-border);}
.iad-floating-menu-panel label {display:flex;align-items:center;gap:9px;padding:8px 4px;color:var(--iad-text);white-space:normal;font-size:14px;}
.iad-floating-menu-panel label.iad-filter {align-items:stretch;}
.iad-floating-menu-panel select {width:100%;max-width:none;}
.iad-layer-menu {color:var(--iad-text);}
.iad-layer-menu summary {cursor:pointer;padding:8px 12px;border-radius:8px;background:var(--iad-surface);min-height:40px;}

`;

  // src/client/styles/forms.ts
  var formsStyles = `.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 12px;min-height:var(--iad-control-height);font-size:14px;}
.iad-floating-menu>summary {display:flex;align-items:center;justify-content:space-between;gap:12px;}
.iad-floating-menu summary::marker {content:"";}
.iad-floating-menu[open]>summary {border-color:var(--iad-primary);}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:0;border-radius:var(--iad-radius);}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;overflow-wrap:anywhere;}
.iad-filter-summary {display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--iad-muted);font-size:13px;margin:8px 0;}
.iad-search {flex:1 1 180px;max-width:300px;}
.iad-search input {width:100%;}
.iad-source-controls {background:var(--iad-hover);border-radius:var(--iad-radius);padding:12px 16px;display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;}
.iad-source-check {position:absolute;right:8px;top:8px;z-index:2;display:flex;padding:5px;background:var(--iad-surface);border-radius:6px;cursor:pointer;}
.iad-source-check input {margin:0;}
.iad-dialog-header {display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-16px;z-index:5;background:var(--iad-surface);padding:8px 0;margin-bottom:12px;}
.iad-dialog-header h2 {margin:0;}
.iad-review-options {display:flex;flex-wrap:wrap;gap:8px 16px;border:0;padding:0;margin:16px 0;}
.iad-review-options legend {margin-bottom:8px;}
.iad-review-options label {display:flex;align-items:center;gap:8px;min-height:40px;cursor:pointer;}
.iad-form-actions {display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:20px;}
.iad-section-header {display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.iad-section-header h2 {margin:0;}
.iad-config-bar {display:flex;align-items:end;gap:12px;flex-wrap:wrap;}
.iad-config-bar>.iad-field {flex:1 1 220px;margin:0;min-width:0;}
.iad-config-bar select {width:100%;}
.iad-config-bar>.iad-primary {margin-left:auto;}


.iad-mining-directions {margin:16px 0;}.iad-mining-directions>summary {cursor:pointer;padding:8px 0;min-height:44px;}
.iad-directions-form,.iad-direction-group {border:0;padding:0;margin:12px 0;min-width:0;}.iad-direction-group>legend {font-weight:600;margin:8px 0;}
.iad-direction-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:8px;align-items:start;}
.iad-direction {display:flex;align-items:start;flex-wrap:wrap;gap:8px;padding:8px 12px;background:var(--iad-surface-muted);border-radius:var(--iad-radius);min-width:0;}
.iad-direction-toggle {display:flex;align-items:center;flex:1;gap:8px;cursor:pointer;min-height:44px;}.iad-direction>details {min-width:0;}.iad-direction>details[open] {flex-basis:100%;}.iad-direction>details>summary {cursor:pointer;min-height:44px;display:flex;align-items:center;color:var(--iad-muted);}
.iad-direction-add {margin:12px 0;}.iad-direction-add>summary {cursor:pointer;min-height:44px;display:flex;align-items:center;}
.iad-mining-directions pre {overflow-wrap:anywhere;}.iad-discovery-area {margin:12px 0;}.iad-discovery-area h3 {margin:0 0 8px;}

@media(max-width:760px) {.iad-main {grid-template-columns:1fr;}.iad-inspector {width:100%;}}

.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:0;border-radius:8px;padding:16px;}
.iad-detail-dialog.iad-inline-dialog {position:sticky;inset:auto;top:0;width:100%;max-width:none;max-height:none;margin:0;padding:0;overflow:visible;background:transparent;}.iad-inline-dialog .iad-inspector{position:static}
.iad-detail-dialog.iad-drawer {width:min(560px,100%);max-width:100%;height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;padding:24px;}.iad-drawer .iad-config-bar {display:grid;gap:16px;}.iad-drawer .iad-config-bar>.iad-field {margin:0;}.iad-drawer .iad-job-panel {min-width:0;}
.iad-detail-dialog.iad-confirm-dialog {width:min(440px,calc(100% - 32px));}
.iad-detail-dialog.iad-viewer-dialog {width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;background:var(--iad-viewer);overflow:hidden;}
.iad-detail-dialog::backdrop {background:var(--iad-scrim);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}

@media(max-width:760px) {.iad-header {align-items:start;}.iad-header>.iad-row {width:100%;}.iad-header select {flex:1;max-width:100%;}.iad-tabs {flex-wrap:wrap;}.iad-settings {width:100%;}.iad-pagination {flex-wrap:wrap;}.iad-lightbox {padding:12px;}.iad-lightbox-toolbar strong {flex-basis:100%;}.iad-workbench dl {grid-template-columns:80px minmax(0,1fr);}}
@container workbench (max-width:959px){.iad-workbench{--iad-page-padding:var(--iad-space-6)}}
@container workbench (max-width:639px){.iad-workbench{--iad-page-padding:var(--iad-space-4)}.iad-header{align-items:start}.iad-header-actions{width:100%}.iad-header-actions select{flex:1}.iad-model-fields{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce) {.iad-workbench * {scroll-behavior:auto;transition:none;animation:none;}}

.iad-knowledge-content>p,.iad-knowledge-content [data-field] {overflow-wrap:anywhere;}

`;

  // src/client/styles/review.ts
  var reviewStyles = `.iad-workbench[data-page=industrial-review]:has(.iad-review-focused) {display:flex;flex-direction:column;overflow:auto;}
.iad-workbench[data-page=industrial-review]:has(.iad-review-focused)>.iad-tab-panel {display:flex;flex-direction:column;flex:1;min-height:min-content;}
.iad-focused-inspector {display:flex;flex-direction:column;flex:1;min-height:min-content;padding:0;background:transparent;}
.iad-review-focused {display:flex;flex-direction:column;flex:1;min-height:0;gap:16px;}
.iad-review-focused>.iad-filters {margin:0;flex:none;background:transparent;padding:0;}
.iad-review-columns {display:grid;grid-template-columns:180px minmax(0,1fr) 300px;gap:16px;flex:1;min-height:20rem;}
.iad-review-columns>aside,.iad-review-center {min-width:0;min-height:0;}.iad-review-columns>aside {contain:size;}
.iad-review-center {display:flex;flex-direction:column;gap:12px;}
.iad-review-information {max-height:40%;overflow:auto;background:var(--iad-surface);padding:12px;border-radius:var(--iad-radius);flex:none;}
.iad-review-information>summary {cursor:pointer;min-height:24px;}
.iad-review-queue-slot {overflow:auto;}
.iad-review-queue {padding:0;background:transparent;}
.iad-review-queue .iad-grid {display:flex;flex-direction:column;gap:8px;}
.iad-review-queue button.iad-sample {display:grid;grid-template-columns:40px minmax(0,1fr);gap:0 8px;padding:8px;height:64px;}
.iad-review-queue .iad-thumb {grid-row:1/3;align-self:center;}
.iad-review-queue .iad-sample>strong {padding:0;line-height:22px;}
.iad-review-queue .iad-sample-label {padding:0;line-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.iad-review-queue .iad-pagination {flex-wrap:wrap;justify-content:center;}
.iad-review-decision-slot>.iad-decision {height:100%;}
.iad-decision {display:flex;flex-direction:column;min-height:0;background:var(--iad-surface);padding:16px;border-radius:var(--iad-radius);}
.iad-decision>h3 {margin:0 0 16px;}.iad-decision .iad-review-options{display:grid;grid-template-columns:minmax(0,1fr);gap:3px;margin:12px 0 20px}.iad-decision .iad-review-options label{min-height:36px;padding:7px 8px;border-radius:4px}.iad-decision .iad-review-options label:has(input:checked){background:var(--iad-hover);color:var(--iad-primary)}.iad-decision textarea{min-height:76px}.iad-review-records>.iad-field{max-width:360px;}
.iad-decision-scroll {min-height:0;overflow:auto;flex:1;padding:4px;scroll-padding:12px;}
.iad-review-submit {display:flex;flex-direction:column;gap:8px;padding-top:16px;flex:none;background:var(--iad-surface);}
.iad-review-submit .iad-error {margin:0;max-height:100px;overflow:auto;}
.iad-review-submit small {text-align:center;}
.iad-review-tools {display:none;gap:8px;flex:none;}
.iad-review-tools button {display:none;}
.iad-detail-dialog.iad-review-drawer {width:min(440px,100%);height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;flex-direction:column;}.iad-detail-dialog.iad-review-drawer[open]{display:flex;}
.iad-review-drawer>.iad-decision {flex:1;min-height:0;}
.iad-review-drawer .iad-review-queue {overflow:auto;}
.iad-embedded-canvas {position:relative;display:flex;flex-direction:column;flex:1;min-height:0;background:var(--iad-viewer);border-radius:var(--iad-radius);padding:12px;color:var(--iad-on-viewer);overflow:hidden;}
.iad-embedded-canvas .iad-lightbox-toolbar {gap:8px;}
.iad-embedded-canvas .iad-viewer-body {margin-top:12px;}
.iad-embedded-evidence {position:absolute;right:12px;bottom:12px;z-index:2;max-width:calc(100% - 24px);width:340px;color:var(--iad-text);background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-embedded-evidence>summary {cursor:pointer;padding:12px;min-height:44px;}
.iad-embedded-evidence .iad-inspection-panel {max-height:260px;}
@container workbench (max-width:1180px) {.iad-review-columns {grid-template-columns:minmax(0,1fr) 300px;}.iad-review-queue-slot {display:none;}.iad-review-tools {display:flex;}.iad-review-tools .iad-queue-trigger {display:block;}}
@container workbench (max-width:900px) {.iad-review-columns {grid-template-columns:minmax(0,1fr);}.iad-review-decision-slot {display:none;}.iad-review-tools .iad-decision-trigger {display:block;}}
.iad-conflict-workspace {display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;align-items:start;}
.iad-conflict-detail {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;min-width:0;}.iad-conflict-detail>article,.iad-conflict-detail>aside {min-width:0;}
.iad-disposition-fields {border:0;min-width:0;margin:0;padding:0;}
@container workbench (max-width:1180px){.iad-conflict-detail {grid-template-columns:minmax(0,1fr);}.iad-conflict-workspace {grid-template-columns:220px minmax(0,1fr);}}
@container workbench (max-width:900px){.iad-conflict-workspace {grid-template-columns:minmax(0,1fr);}}
@container workbench (max-width:639px) {.iad-workbench[data-page=industrial-review]:has(.iad-review-focused){overflow:auto}.iad-workbench[data-page=industrial-review]:has(.iad-review-focused)>.iad-tab-panel {flex:none}.iad-embedded-canvas {min-height:360px;}.iad-embedded-canvas .iad-lightbox-toolbar>strong,.iad-embedded-canvas select[aria-label="\u7F29\u653E"],.iad-embedded-canvas .iad-image-step {display:none}.iad-review-focused>.iad-filters {max-height:120px;overflow:auto;}.iad-review-drawer {width:100%;}.iad-lightbox-toolbar strong {flex-basis:100%;}}
`;

  // src/client/styles/knowledge.ts
  var knowledgeStyles = `
.iad-knowledge-context {display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:20px;min-width:0;}
.iad-knowledge-context>.iad-field {margin:0;max-width:260px;min-width:0;}.iad-knowledge-context>.iad-field select {width:220px;max-width:100%;}
.iad-knowledge-context .iad-row {gap:12px;}.iad-knowledge-context .iad-row>button{border-color:transparent;background:transparent;color:var(--iad-primary);padding:6px 4px}
.iad-knowledge-content:not(:has(.iad-knowledge-split)){padding:24px;background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-knowledge-overview{margin:8px 0}.iad-knowledge-overview>summary{cursor:pointer;color:var(--iad-muted);font-size:12px}.iad-knowledge-content>button{margin-top:16px}
.iad-knowledge-split {display:grid;grid-template-columns:272px minmax(0,1fr);align-items:start;margin-top:20px;background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-check-list {display:grid;gap:4px;padding:16px;border-right:1px solid var(--iad-border);min-width:0;}.iad-check-list>button {display:grid;gap:8px;text-align:left;border:0;padding:16px;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
.iad-check-list [aria-label="\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009"]{display:grid;gap:12px}.iad-check-list .iad-field{margin:0}.iad-check-list [aria-label="\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009"] input{width:100%}
.iad-check-detail {min-width:0;padding:20px 32px;}.iad-back-to-checks {display:none;}.iad-freshness {margin:16px 0;}.iad-freshness>summary {cursor:pointer;min-height:40px;padding:8px 0;}
.iad-check-detail .iad-knowledge-evidence{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.iad-check-detail .iad-knowledge-evidence button{min-width:0;text-align:left}.iad-check-detail .iad-knowledge-evidence img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain}.iad-check-detail .iad-knowledge-evidence small{max-width:100%}
@container workbench (max-width:1180px){.iad-knowledge-split {grid-template-columns:240px minmax(0,1fr);}.iad-check-detail{padding:20px 24px}}
@container workbench (max-width:900px){.iad-knowledge-split {grid-template-columns:220px minmax(0,1fr);}.iad-check-detail .iad-knowledge-evidence{grid-template-columns:repeat(2,minmax(0,1fr));}}
@container workbench (max-width:640px){.iad-knowledge-split {grid-template-columns:minmax(0,1fr);}.iad-knowledge-split[data-detail=true]>.iad-check-list,.iad-knowledge-split[data-detail=false]>.iad-check-detail {display:none;}.iad-back-to-checks {display:block;margin-bottom:16px;}.iad-check-list{border-right:0}.iad-check-detail{padding:16px 0}.iad-knowledge-context>.iad-field{flex:1}.iad-knowledge-context{gap:12px}}
`;

  // src/client/styles/setup.ts
  var setupStyles = `.iad-setup {max-width:1040px;min-width:0;padding:24px;background:var(--iad-surface);border-radius:var(--iad-radius);}.iad-workbench .iad-short-field{flex:none;width:88px;margin:0 0 16px}.iad-short-field input{width:100%}.iad-form-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;padding-top:20px;margin-top:24px;border-top:1px solid var(--iad-border)}.iad-form-footer>.iad-muted{margin-right:auto}.iad-workbench:has(.iad-exploration-page>.iad-setup){display:flex;flex-direction:column;overflow:hidden}.iad-exploration-page:has(>.iad-setup){display:flex;flex-direction:column;flex:1;min-height:0}.iad-exploration-page>.iad-setup{display:flex;flex-direction:column;flex:0 1 auto;min-height:0}.iad-setup-fields{overflow:auto;min-height:0;scroll-padding:16px;padding:4px}.iad-setup>.iad-form-footer{flex:none;}
.iad-setup-section {padding:var(--iad-space-6) 0;border-bottom:1px solid var(--iad-border);}
.iad-setup-section:first-of-type {padding-top:0;}.iad-setup-section:last-child {border:0;}
.iad-setup-section>h3 {margin:0 0 var(--iad-space-4);}
.iad-setup-section .iad-info-group {background:transparent;padding:0;margin:0;}
.iad-source-candidates {border:0;min-width:0;padding:0;margin:16px 0;}
.iad-source-candidates>legend {font-weight:600;margin-bottom:16px;}
.iad-source-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,160px),1fr));gap:16px;}
.iad-source-preview {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:16px 0;}
.iad-source-preview>div {min-width:0;}.iad-source-preview button {width:100%;padding:0;}.iad-source-preview img {width:100%;aspect-ratio:1/1;object-fit:contain;display:block;}
.iad-source-preview span {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.75rem;}
.iad-source-grid .iad-source-option {padding:0;background:transparent;}.iad-source-grid .iad-source-option button {width:100%;padding:0;}.iad-source-grid .iad-source-option img {display:block;aspect-ratio:4/3;height:auto;}
.iad-source-option label {display:flex;gap:8px;align-items:center;min-width:0;}.iad-source-option label span {min-width:0;}
.iad-source-dialog {width:min(880px,calc(100% - 32px));}
.iad-source-option{flex:0 1 160px;display:flex;flex-direction:column;gap:8px;min-width:0;padding:8px;background:var(--iad-surface-muted);border-radius:var(--iad-radius)}
.iad-source-option img{width:100%;height:100px;object-fit:contain}.iad-source-option span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iad-source-option input{margin-inline-end:8px}
`;

  // src/client/styles.ts
  var workbenchStyles = themeStyles + controlStyles + modelsStyles + explorationStyles + baseStyles + collectionsStyles + jobsStyles + overlaysStyles + formsStyles + reviewStyles + knowledgeStyles + setupStyles;

  // src/client/useSampleNavigation.ts
  var import_react45 = __require("react");
  function useSampleNavigation(pageId, taskId, query, result, enabled) {
    const { workspace, state } = useWorkspace();
    const view = workspace.view(pageId);
    const [busy, setBusy] = (0, import_react45.useState)(false);
    const [error2, setError] = (0, import_react45.useState)("");
    const [target, setTarget] = (0, import_react45.useState)("");
    const pending = (0, import_react45.useRef)();
    const position = enabled && result.query === query ? result.items.findIndex((item) => item.sample_id === view.selected) : -1;
    const previous = position >= 0 && (position > 0 || view.page > 1);
    const next = position >= 0 && (position < result.items.length - 1 || view.page * pageSize < result.total);
    const cancel = (0, import_react45.useCallback)(() => {
      pending.current?.abort();
      pending.current = void 0;
      setBusy(false);
      setError("");
      setTarget("");
    }, []);
    const opened = (0, import_react45.useCallback)(() => setTarget(""), []);
    (0, import_react45.useEffect)(() => {
      setBusy(false);
      setError("");
      setTarget((target2) => state.active && state.pageId === pageId && target2 === view.selected ? target2 : "");
      return () => {
        pending.current?.abort();
        pending.current = void 0;
      };
    }, [query, view.selected, enabled, state.active, state.pageId, state.datasetId, pageId]);
    async function move(offset4, display = "fullscreen") {
      if (pending.current || !taskId || (offset4 < 0 ? !previous : !next)) return;
      const controller = new AbortController();
      pending.current = controller;
      setBusy(true);
      setError("");
      try {
        let page = view.page;
        let sample = result.items[position + offset4];
        if (!sample) {
          page += offset4;
          const parameters = new URLSearchParams(query);
          parameters.set("page", String(page));
          const adjacent = await request(`/samples/${encodeURIComponent(taskId)}?${parameters}`, void 0, void 0, controller.signal);
          sample = adjacent.items[offset4 > 0 ? 0 : adjacent.items.length - 1];
        }
        if (controller.signal.aborted) return;
        const current = workspace.getSnapshot(), selected = workspace.view(pageId);
        if (!current.active || current.pageId !== pageId || current.datasetId !== state.datasetId || selected.selected !== view.selected || selected.page !== view.page || selected.filters !== view.filters) return;
        if (!sample) throw new Error("\u5F53\u524D\u7B5B\u9009\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
        setTarget(display === "fullscreen" ? sample.sample_id : "");
        workspace.updateView(pageId, { page, selected: sample.sample_id, inspection: null });
      } catch (error3) {
        if (!controller.signal.aborted) setError(message(error3));
      } finally {
        if (pending.current === controller) {
          pending.current = void 0;
          setBusy(false);
        }
      }
    }
    return { previous, next, busy, error: error2, move, open: !!target && target === view.selected, opened, cancel };
  }

  // src/client/usePagePosition.ts
  var import_react46 = __require("react");
  function usePagePosition(source, ready) {
    const { workspace } = useWorkspace();
    const surface = (0, import_react46.useRef)(null);
    (0, import_react46.useLayoutEffect)(() => {
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
  var import_jsx_runtime49 = __require("react/jsx-runtime");
  function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [auditSetupOpen, setAuditSetupOpen] = (0, import_react47.useState)(false);
    const [auditDetailOpen, setAuditDetailOpen] = (0, import_react47.useState)(false);
    const [auditWidth, setAuditWidth] = (0, import_react47.useState)(null);
    const [datasets, setDatasets] = (0, import_react47.useState)([]);
    const [result, setResult] = (0, import_react47.useState)({ query: "", items: [], total: 0 });
    const [loading, setLoading] = (0, import_react47.useState)(false);
    const [error2, setError] = (0, import_react47.useState)("");
    const [revision, setRevision] = (0, import_react47.useState)(0);
    const advance = (0, import_react47.useRef)(null);
    const [reviewConfirmation, setReviewConfirmation] = (0, import_react47.useState)(null);
    const dataset = datasets.find((d) => d.dataset_id === datasetId);
    const loadDatasets = (0, import_react47.useCallback)(async (preferred, signal) => {
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
    const changed = (0, import_react47.useCallback)(() => {
      setRevision((v) => v + 1);
      void loadDatasets();
    }, [loadDatasets]);
    const audit = useJobs("audit", pageId === "industrial-audit" ? datasetId : "", changed, workspace.view("industrial-audit").job);
    (0, import_react47.useEffect)(() => {
      const controller = new AbortController();
      void loadDatasets(void 0, controller.signal);
      return () => controller.abort();
    }, [loadDatasets]);
    const gallery = pageId === "industrial-images" || (pageId === "industrial-review" || pageId === "industrial-audit") && view.tab === "results";
    const query = sampleQuery(datasetId, view.filters, view.page, pageSize);
    const navigation2 = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
    const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
    (0, import_react47.useEffect)(() => {
      if (pageId !== "industrial-audit" || !surface.current) return;
      const observer = new ResizeObserver(([entry]) => setAuditWidth(entry.borderBoxSize[0].inlineSize));
      observer.observe(surface.current);
      return () => observer.disconnect();
    }, [pageId, surface]);
    (0, import_react47.useEffect)(() => setAuditDetailOpen(false), [datasetId, view.tab]);
    const auditCompact = auditWidth !== null && auditWidth <= 900;
    const auditModalOpen = auditCompact && (auditDetailOpen || !!view.inspection);
    (0, import_react47.useEffect)(() => {
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
    const grid = dataset && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(SampleGrid, { layout: pageId === "industrial-review" ? "queue" : "grid", showFilters: pageId === "industrial-images", dataset, filters: view.filters, onFilters: updateFilters, items: result.query === query ? result.items : [], total: result.query === query ? result.total : 0, page: view.page, onPage: (page) => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: (selected) => {
      workspace.updateView(pageId, { selected });
      if (pageId === "industrial-audit") setAuditDetailOpen(auditCompact);
    }, loading, sourceManagement: pageId === "industrial-images" ? { active: view.tab === "sources", onChanged: changed } : void 0 }, datasetId);
    const inspectedSample = pageId === "industrial-review" && view.tab === "records" ? view.historySampleId : view.selected;
    const inspector = dataset && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(SampleInspector, { dataset, sampleId: inspectedSample, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-images" ? "browse" : "model", queue: pageId === "industrial-review" && view.tab === "results" ? grid : void 0, filters: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(SampleFilters, { defaults: initialReviewFilters, dataset, filters: view.filters, onFilters: updateFilters }), advanceOnSubmit: view.tab === "results" && view.filters.review_status === "pending", panel: pageId === "industrial-audit" ? {
      presentation: auditWidth === null ? "closed" : auditModalOpen ? "modal" : auditCompact ? "closed" : "inline",
      onOpen: setAuditDetailOpen,
      onClose: () => {
        setAuditDetailOpen(false);
        workspace.updateView(pageId, { inspection: null }, true);
      },
      restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null
    } : void 0, revision, onReviewed: reviewed, jobs: audit.jobs, onJobsChanged: audit.refresh, navigation: gallery ? navigation2 : void 0 }, pageId === "industrial-review" && view.tab === "results" ? datasetId : `${datasetId}:${inspectedSample}`);
    const datasetControls = /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: (event) => workspace.selectDataset(event.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }),
        datasets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("option", { value: item.dataset_id, children: [
          item.name,
          " (",
          item.total_samples,
          ")"
        ] }, item.dataset_id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("button", { onClick: changed, children: "\u5237\u65B0" })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { ref: surface, className: "iad-workbench", "data-page": pageId, children: [
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("style", { children: workbenchStyles }),
      pageId !== "industrial-datasets" && (!dataset || pageId !== "industrial-exploration" && pageId !== "industrial-knowledge") && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(WorkbenchHeader, { pageId, children: [
        datasetControls,
        pageId === "industrial-audit" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("button", { className: "iad-primary", disabled: !dataset, onClick: () => setAuditSetupOpen(true), children: "\u65B0\u5EFA\u5BA1\u8BA1" })
      ] }),
      (error2 || audit.error) && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { role: "alert", className: "iad-error", children: error2 || audit.error }),
      pageId === "industrial-datasets" ? /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_jsx_runtime49.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(DatasetManager, { datasets, selected: dataset, onChanged: (id) => {
        void loadDatasets(id);
        setRevision((v) => v + 1);
      } }) }) : !dataset ? /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684\u6570\u636E\u96C6\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, { children: [
        pageId === "industrial-exploration" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(ExplorationPage, { dataset, refreshRevision: revision, headerActions: datasetControls }, datasetId),
        pageId === "industrial-knowledge" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(KnowledgePage, { dataset, kind: state.knowledgeKind, refreshRevision: revision, headerActions: datasetControls }, `${datasetId}:${state.knowledgeKind}`),
        pageId === "industrial-images" && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(PageTabs, { label: "\u56FE\u50CF\u89C6\u56FE", items: [{ id: "results", label: "\u5168\u90E8\u56FE\u50CF" }, { id: "sources", label: "\u826F\u54C1\u6765\u6E90" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab, selected: "" }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("div", { className: "iad-browse", children: grid }),
          view.selected && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null, onClose: () => workspace.updateView(pageId, { selected: "" }), children: inspector })
        ] }),
        pageId === "industrial-audit" && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(PageTabs, { label: "\u5BA1\u8BA1\u89C6\u56FE", items: [{ id: "results", label: "\u7ED3\u679C" }, { id: "jobs", label: "\u6A21\u578B\u5BA1\u8BA1\u4F5C\u4E1A" }, { id: "reports", label: "\u62A5\u544A" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
            view.tab !== "jobs" && audit.jobs.some((job) => ["RUNNING", "PENDING"].includes(job.status)) && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { role: "status", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "jobs" }), children: "\u67E5\u770B\u6267\u884C\u4E2D\u7684\u5BA1\u8BA1\u4F5C\u4E1A" }) }),
            view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(SampleFilters, { dataset, filters: view.filters, onFilters: updateFilters }),
              /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "iad-main", "data-compact": auditCompact, children: [
                grid,
                inspector
              ] })
            ] }),
            view.tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(AuditJobs, { jobs: audit.jobs, onJobsChanged: audit.refresh }),
            view.tab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(AuditReport, { dataset }, datasetId)
          ] }),
          auditSetupOpen && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(Modal, { title: "\u65B0\u5EFA\u6A21\u578B\u5BA1\u8BA1", className: "iad-drawer", onClose: () => setAuditSetupOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(AuditSetup, { dataset, filters: view.filters, jobs: audit.jobs, revision, onJobsChanged: audit.refresh, onStarted: (job) => {
            setAuditSetupOpen(false);
            workspace.updateView(pageId, { tab: "jobs", job: job.run_id });
          } }, datasetId) })
        ] }),
        pageId === "industrial-review" && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(PageTabs, { label: "\u590D\u6838\u89C6\u56FE", items: [{ id: "results", label: "\u590D\u6838\u961F\u5217" }, { id: "conflicts", label: "\u77E5\u8BC6\u51B2\u7A81" }, { id: "records", label: "\u590D\u6838\u8BB0\u5F55" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
          view.tab === "conflicts" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(KnowledgeConflictReview, { datasetId }, datasetId),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, { children: [
            reviewConfirmation?.datasetId === datasetId && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("p", { role: "status", className: "iad-review-confirmation", children: [
              "\u5DF2\u63D0\u4EA4 ",
              reviewConfirmation.name,
              " \xB7 ",
              reviewLabel(reviewConfirmation.decision)
            ] }),
            inspector
          ] }),
          view.tab === "records" && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
            ReviewRecords,
            {
              datasetId,
              page: view.historyPage,
              search: view.historySearch,
              selected: view.historySampleId,
              revision,
              onPage: (historyPage) => workspace.updateView(pageId, { historyPage }),
              onSearch: (historySearch) => workspace.updateView(pageId, { historySearch, historyPage: 1 }, true),
              onSelect: (historySampleId) => workspace.updateView(pageId, { historySampleId }),
              onQueue: () => workspace.updateView(pageId, { tab: "results" }),
              detail: inspector
            },
            datasetId
          )
        ] })
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

  // src/client/workbench-session.ts
  var WorkbenchSession = class {
    constructor(host) {
      this.host = host;
    }
    host;
    async inspect(snapshot, question, returnLink, previousSessionId) {
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
    async mine(scopeRunId, kind, imageCount, images, returnLink, previousSessionId) {
      const id = previousSessionId ? SessionId(previousSessionId) : await this.host.sessions.create();
      const link = returnLink(id);
      await this.host.sessions.using(id, { source: "iadKnowledge" }, async (reference) => {
        const binding = await reference.ready;
        const text = [
          `\u8BF7\u6301\u7EED\u6316\u6398\u6B64\u56FA\u5B9A\u8303\u56F4\u7684${kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38"}\u77E5\u8BC6\uFF0C\u76F4\u5230\u6574\u4E2A\u8303\u56F4\u89C2\u5BDF\u5B8C\u6210\u3002\u6BCF\u6B21\u9009\u62E9${imageCount}\u5F20\u6765\u6E90\uFF0C\u672B\u7EC4\u4E0D\u8DB3\u65F6\u5904\u7406\u5B9E\u9645\u5269\u4F59\u3002`,
          `\u8303\u56F4\u5F15\u7528\uFF1A${scopeRunId}`,
          images.length ? `\u5DF2\u9009\u56FE\u50CF\uFF1A${JSON.stringify(images)}\u3002\u6B63\u5F0F\u8C03\u7528\u524D\u6838\u5BF9\u771F\u5B9E\u5269\u4F59\u8303\u56F4\uFF0C\u4E0D\u91CD\u590D\u5904\u7406\u5DF2\u53D1\u5E03\u56FE\u7EC4\u3002` : "\u8BF7\u4ECE\u771F\u5B9E\u5269\u4F59\u8303\u56F4\u9009\u62E9\u56FE\u7EC4\u3002",
          "\u5148\u5C06\u6B64\u8303\u56F4\u5173\u8054\u5230\u5F53\u524D\u4F1A\u8BDD\u5E76\u8BFB\u53D6\u771F\u5B9E\u8FDB\u5EA6\uFF0C\u9010\u7EC4\u663E\u5F0F\u7EED\u7528\u521A\u53D1\u5E03\u7684\u77E5\u8BC6\uFF1B\u4FDD\u7559\u51B2\u7A81\u3001\u4EBA\u5BA1\u5F85\u529E\u4E0E\u7F3A\u8BC1\uFF0C\u4E0D\u542F\u52A8\u5176\u4ED6\u672A\u8BF7\u6C42\u9636\u6BB5\u3002",
          `\u8FD4\u56DE\u77E5\u8BC6\u5DE5\u4F5C\u53F0\uFF1A${link}`
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
  var import_jsx_runtime50 = __require("react/jsx-runtime");
  function SessionResult(props) {
    const { workspace } = useWorkspace();
    const meta = props.phase === "result" ? props.block.meta : null;
    const result = meta?.type === "industrial-workbench" ? meta : null;
    return /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("section", { className: "iad-tool-card", "aria-label": props.title, "data-iad-tool": props.toolName, children: [
      /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("style", { children: [
        themeStyles,
        controlStyles,
        `
      .iad-tool-card{background:var(--iad-surface);color:var(--iad-text);border-radius:var(--iad-radius);padding:12px;margin:8px 0;overflow-wrap:anywhere}
      .iad-tool-card p{margin:4px 0}.iad-tool-card nav{display:flex;flex-wrap:wrap;gap:8px}

    `
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("strong", { children: props.title }),
      props.phase !== "result" ? /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("p", { role: "status", children: props.phase === "preparing" ? "\u51C6\u5907\u8C03\u7528\u2026" : "\u5DE5\u5177\u6267\u884C\u4E2D\u2026" }) : props.block.isError ? /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("p", { role: "alert", children: "\u8C03\u7528\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u8C03\u7528\u8BE6\u60C5\u3002" }) : result?.job && /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("p", { children: [
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
      /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("nav", { "aria-label": "\u67E5\u770B\u5DE5\u5177\u7ED3\u679C", children: [
        result?.links.map((link, index3) => /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("button", { "data-iad-page": link.location.pageId, "data-iad-scope-id": link.location.scopeRunId, "data-iad-run-id": link.location.job, "data-iad-version-id": link.location.version, onClick: () => workspace.openLocation(link.location), children: link.label }, index3)),
        props.inspect && /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("button", { onClick: props.inspect, children: "\u8C03\u7528\u8BE6\u60C5" })
      ] })
    ] });
  }

  // src/shared/tool-presentation.ts
  var workbenchTools = {
    direction_exploration_start: "\u63A2\u7D22\u68C0\u67E5\u65B9\u5411",
    direction_exploration_status: "\u65B9\u5411\u63A2\u7D22\u72B6\u6001",
    direction_exploration_get: "\u65B9\u5411\u63A2\u7D22\u7ED3\u679C",
    direction_exploration_cancel: "\u505C\u6B62\u65B9\u5411\u63A2\u7D22",
    direction_exploration_retry: "\u91CD\u8BD5\u65B9\u5411\u63A2\u7D22",
    knowledge_directions_adopt: "\u91C7\u7528\u63A2\u7D22\u65B9\u5411",
    dataset_list: "\u6570\u636E\u96C6\u5217\u8868",
    dataset_import: "\u63A5\u5165\u6570\u636E\u96C6",
    dataset_rescan: "\u91CD\u65B0\u626B\u63CF\u76EE\u5F55",
    dataset_report: "\u6570\u636E\u96C6\u8D28\u91CF\u62A5\u544A",
    knowledge_get: "\u77E5\u8BC6\u7248\u672C",
    knowledge_scope_open: "\u5EFA\u7ACB\u77E5\u8BC6\u8303\u56F4",
    knowledge_scope_get: "\u77E5\u8BC6\u8303\u56F4\u8FDB\u5EA6",
    knowledge_scope_stop: "\u505C\u6B62\u77E5\u8BC6\u8303\u56F4",
    knowledge_scope_resume: "\u7EE7\u7EED\u77E5\u8BC6\u8303\u56F4",
    knowledge_details: "\u77E5\u8BC6\u6761\u76EE",
    knowledge_conflict_context: "\u77E5\u8BC6\u51B2\u7A81",
    knowledge_job_observations: "\u77E5\u8BC6\u89C2\u5BDF\u8BC1\u636E",
    knowledge_sources: "\u67E5\u8BE2\u77E5\u8BC6\u6765\u6E90",
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

  // src/client/components/ModelSettingsPage.tsx
  var import_react49 = __require("react");

  // src/shared/model-settings.generated.ts
  var defaultModelLimits = {
    "capacity_mode": null,
    "max_visual_inputs": null,
    "max_request_bytes": null,
    "context_tokens": null,
    "max_output_tokens": null,
    "request_parameters": {},
    "generation_timeout_seconds": null,
    "connect_timeout_seconds": null,
    "write_timeout_seconds": null,
    "pool_timeout_seconds": null
  };

  // src/client/components/ProviderManager.tsx
  var import_react48 = __require("react");
  var import_jsx_runtime51 = __require("react/jsx-runtime");
  function ProviderManager() {
    const { view, refresh } = useWorkbenchModel();
    const [editing, setEditing] = (0, import_react48.useState)(null);
    const [notice, setNotice] = (0, import_react48.useState)("");
    return /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("header", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("h2", { children: "\u63D0\u4F9B\u5546" }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
          "button",
          {
            className: "iad-primary",
            disabled: view?.provider_revision == null,
            onClick: () => setEditing({ revision: view.provider_revision }),
            children: "\u6DFB\u52A0\u63D0\u4F9B\u5546"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "iad-muted", children: "\u4E0E DSH \u8BBE\u7F6E\u5171\u7528\u63D0\u4F9B\u5546\u8D44\u6599\u548C\u51ED\u636E\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u63D0\u4F9B\u5546\u5217\u8868", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("th", { children: "\u63D0\u4F9B\u5546\u540D\u79F0" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("th", { children: "\u670D\u52A1\u5730\u5740" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("th", { className: "iad-number", children: "\u6A21\u578B\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("th", { children: "\u64CD\u4F5C" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("tbody", { children: view?.providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("td", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("strong", { children: provider.name }),
            provider.error && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "iad-error", children: provider.error })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("td", { className: "iad-provider-endpoint", children: provider.endpoint || provider.api || "\u5C1A\u672A\u914D\u7F6E" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("td", { className: "iad-number", children: provider.models.length }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { disabled: !provider.editable, onClick: () => setEditing({ provider, revision: view.provider_revision }), children: "\u7F16\u8F91" }),
            provider.removable && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
              DeleteAction,
              {
                title: "\u5220\u9664\u63D0\u4F9B\u5546",
                name: provider.name,
                description: "\u4FDD\u7559\u5386\u53F2\u4F5C\u4E1A\u53CA\u5176\u51ED\u636E\u5F15\u7528\u3002\u6B63\u5728\u8FD0\u884C\u7684\u4F5C\u4E1A\u4E0D\u53D7\u5F71\u54CD\u3002",
                onDelete: async () => {
                  await request(`/models/providers/${encodeURIComponent(provider.provider_id)}?expected_revision=${view.provider_revision}`, void 0, "DELETE");
                  await refresh();
                  setNotice("\u5DF2\u5220\u9664\u63D0\u4F9B\u5546");
                }
              }
            )
          ] }) })
        ] }, provider.provider_id)) })
      ] }) }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { role: "status", children: notice }),
      editing && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
        ProviderEditor,
        {
          provider: editing.provider,
          revision: editing.revision,
          onClose: () => setEditing(null),
          onSaved: async () => {
            await refresh();
            setEditing(null);
            setNotice("\u63D0\u4F9B\u5546\u5DF2\u4FDD\u5B58");
          }
        }
      )
    ] });
  }
  function ProviderEditor({ provider, revision, onClose, onSaved }) {
    const [id] = (0, import_react48.useState)(provider?.provider_id || `vision-${v4_default()}`);
    const [name2, setName] = (0, import_react48.useState)(provider?.name || ""), [endpoint, setEndpoint] = (0, import_react48.useState)(provider?.endpoint || ""), [key, setKey] = (0, import_react48.useState)("");
    const [models, setModels] = (0, import_react48.useState)(provider?.models || []);
    const [busy, setBusy] = (0, import_react48.useState)(false), [error2, setError] = (0, import_react48.useState)("");
    async function discover() {
      setBusy(true);
      setError("");
      try {
        const result = await request("/models/providers/discover", { endpoint, provider_id: provider?.provider_id, api_key: key || null });
        setModels(result.models);
        if (!result.models.length) setError("\u670D\u52A1\u672A\u8FD4\u56DE\u6A21\u578B\uFF0C\u53EF\u4EE5\u624B\u52A8\u6DFB\u52A0");
      } catch (failure) {
        setError(message(failure));
      } finally {
        setBusy(false);
      }
    }
    async function save(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      try {
        const [first, ...remaining] = models;
        if (!first) throw new Error("\u8BF7\u6DFB\u52A0\u81F3\u5C11\u4E00\u4E2A\u6A21\u578B");
        const body = { expected_revision: revision, provider_id: id, name: name2, endpoint, models: [first, ...remaining], api_key: key || null };
        await request("/models/providers", body);
        setKey("");
        await onSaved();
      } catch (failure) {
        setError(message(failure));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(Modal, { title: provider ? "\u7F16\u8F91\u63D0\u4F9B\u5546" : "\u6DFB\u52A0\u63D0\u4F9B\u5546", className: "iad-provider-dialog", onClose: () => {
      if (!busy) onClose();
    }, children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("form", { onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("fieldset", { disabled: busy, children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-model-fields", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
          "\u63D0\u4F9B\u5546\u540D\u79F0",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { autoFocus: true, required: true, "aria-label": "\u63D0\u4F9B\u5546\u540D\u79F0", value: name2, onChange: (event) => setName(event.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
          "\u670D\u52A1\u5730\u5740",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { required: true, type: "url", "aria-label": "\u670D\u52A1\u5730\u5740", placeholder: "https://\u2026/v1", value: endpoint, onChange: (event) => setEndpoint(event.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
        "API \u5BC6\u94A5",
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
          "input",
          {
            type: "password",
            autoComplete: "new-password",
            "aria-label": "API \u5BC6\u94A5",
            value: key,
            disabled: provider?.credential_writable === false,
            placeholder: provider?.credential_configured ? "\u5DF2\u914D\u7F6E\uFF0C\u7559\u7A7A\u4FDD\u7559" : "\u53EF\u9009",
            onChange: (event) => setKey(event.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("header", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("h3", { children: "\u6A21\u578B" }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", disabled: !endpoint, onClick: () => void discover(), children: "\u8BFB\u53D6\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", onClick: () => setModels([...models, { model_id: "", name: "", input_modalities: ["text"], context_tokens: null, max_output_tokens: null }]), children: "\u6DFB\u52A0\u6A21\u578B" })
        ] })
      ] }),
      models.map((model, index3) => /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-provider-model", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-model-fields", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
            "\u6A21\u578B ID",
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { "aria-label": `\u6A21\u578B ID ${index3 + 1}`, required: true, value: model.model_id, onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, model_id: event.target.value } : row)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
            "\u663E\u793A\u540D\u79F0",
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { "aria-label": `\u6A21\u578B\u540D\u79F0 ${index3 + 1}`, value: model.name, onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, name: event.target.value } : row)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
            "\u4E0A\u4E0B\u6587\u4E0A\u9650",
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { type: "number", min: "1", placeholder: "\u672A\u58F0\u660E", value: model.context_tokens ?? "", onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, context_tokens: event.target.value ? Number(event.target.value) : null } : row)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "iad-field", children: [
            "\u8F93\u51FA\u4E0A\u9650",
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { type: "number", min: "1", placeholder: "\u672A\u58F0\u660E", value: model.max_output_tokens ?? "", onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, max_output_tokens: event.target.value ? Number(event.target.value) : null } : row)) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("input", { type: "checkbox", checked: model.input_modalities?.includes("image") || false, onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, input_modalities: event.target.checked ? ["text", "image"] : ["text"] } : row)) }),
            " \u652F\u6301\u56FE\u50CF\u8F93\u5165"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", onClick: () => setModels(models.filter((_, position) => position !== index3)), children: "\u79FB\u9664\u6A21\u578B" })
        ] })
      ] }, index3)),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-form-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { className: "iad-primary", disabled: !name2.trim() || !endpoint || !models.length, type: "submit", children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u4FDD\u5B58\u63D0\u4F9B\u5546" })
      ] })
    ] }) }) });
  }

  // src/client/components/ModelSettingsPage.tsx
  var import_jsx_runtime52 = __require("react/jsx-runtime");
  var numbers = [
    ["context_tokens", "\u4E0A\u4E0B\u6587\u4E0A\u9650"],
    ["max_output_tokens", "\u5355\u6B21\u8F93\u51FA\u4E0A\u9650"],
    ["max_visual_inputs", "\u89C6\u89C9\u8F93\u5165\u4E0A\u9650"],
    ["max_request_bytes", "\u8BF7\u6C42\u4F53\u4E0A\u9650\uFF08\u5B57\u8282\uFF09"],
    ["generation_timeout_seconds", "\u751F\u6210\u8D85\u65F6\uFF08\u79D2\uFF09"],
    ["connect_timeout_seconds", "\u8FDE\u63A5\u8D85\u65F6\uFF08\u79D2\uFF09"],
    ["write_timeout_seconds", "\u53D1\u9001\u8D85\u65F6\uFF08\u79D2\uFF09"],
    ["pool_timeout_seconds", "\u8FDE\u63A5\u6C60\u7B49\u5F85\uFF08\u79D2\uFF09"]
  ];
  function ModelSettingsPage() {
    const { view, loading, error: loadError, refresh } = useWorkbenchModel();
    const savedSelection = view?.selection || { provider_id: "", model_id: "", limits: { ...defaultModelLimits } };
    const parametersId = (0, import_react49.useId)();
    const [tab, setTab] = (0, import_react49.useState)("model");
    const [draft, setDraft] = (0, import_react49.useState)(null), [expectedRevision, setExpectedRevision] = (0, import_react49.useState)(0);
    const [parameters, setParameters] = (0, import_react49.useState)("{}"), [busy, setBusy] = (0, import_react49.useState)(false), [error2, setError] = (0, import_react49.useState)(""), [notice, setNotice] = (0, import_react49.useState)("");
    const reset = () => {
      if (!view) return;
      setDraft(structuredClone(savedSelection));
      setExpectedRevision(view.revision);
      setParameters(JSON.stringify(savedSelection.limits.request_parameters, null, 2));
      setError("");
      setNotice("");
    };
    (0, import_react49.useEffect)(() => {
      if (view && !draft) reset();
    }, [view, draft]);
    const provider = view?.providers.find((row) => row.provider_id === draft?.provider_id);
    const changed = !!draft && (JSON.stringify(draft) !== JSON.stringify(savedSelection) || parameters !== JSON.stringify(savedSelection.limits.request_parameters, null, 2));
    useUnsavedChanges(changed && !busy);
    let parsedParameters = {}, parametersError = "";
    try {
      const parsed = JSON.parse(parameters);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) parametersError = "\u670D\u52A1\u6269\u5C55\u53C2\u6570\u5FC5\u987B\u662F JSON \u5BF9\u8C61";
      else parsedParameters = parsed;
    } catch {
      parametersError = "\u8BF7\u8F93\u5165\u6709\u6548\u7684 JSON \u5BF9\u8C61";
    }
    const input = () => {
      if (!draft?.provider_id || !draft.model_id) throw new Error("\u8BF7\u9009\u62E9\u63D0\u4F9B\u5546\u548C\u6A21\u578B");
      if (parametersError) throw new Error(parametersError);
      return { ...draft, limits: { ...draft.limits, request_parameters: parsedParameters } };
    };
    async function save(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const result = await request("/models", { expected_revision: expectedRevision, selection: input() });
        setDraft(result.selection);
        setExpectedRevision(result.revision);
        setParameters(JSON.stringify(result.selection.limits.request_parameters, null, 2));
        await refresh();
        setNotice("\u5DF2\u4FDD\u5B58\uFF0C\u65B0\u4F5C\u4E1A\u4F7F\u7528\u6B64\u6A21\u578B");
      } catch (failure) {
        setError(message(failure));
      } finally {
        setBusy(false);
      }
    }
    async function check() {
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const result = await request("/models/check", input());
        setDraft((previous) => previous ? { ...previous, limits: { ...previous.limits, capacity_mode: result.capacity_mode } } : previous);
        setNotice(`\u8FDE\u63A5\u6B63\u5E38 \xB7 \u670D\u52A1\u4E0A\u4E0B\u6587 ${result.context_tokens.toLocaleString()} token\uFF1B\u5C1A\u672A\u53D1\u9001\u56FE\u50CF`);
      } catch (failure) {
        setError(message(failure));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-workbench", "data-page": "industrial-model-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(WorkbenchHeader, { pageId: "industrial-model-settings", children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("button", { disabled: busy || loading, onClick: () => void refresh(), children: "\u5237\u65B0" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(PageTabs, { label: "\u6A21\u578B\u8BBE\u7F6E\u5206\u533A", items: [{ id: "model", label: "\u5DE5\u4F5C\u53F0\u6A21\u578B" }, { id: "providers", label: "\u63D0\u4F9B\u5546" }], value: tab, onChange: (value) => {
        setTab(value);
        if (value === "model") void refresh();
      }, children: [
        (loadError || error2) && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { role: "alert", className: "iad-error", children: error2 || loadError }),
        tab === "providers" ? /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("section", { className: "iad-provider-manager", "aria-label": "\u63D0\u4F9B\u5546\u7BA1\u7406", children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ProviderManager, {}) }) : /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("section", { className: "iad-model-configuration", children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("h2", { children: "\u5DE5\u4F5C\u53F0\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { className: "iad-muted", children: "\u63A2\u7D22\u3001\u6316\u6398\u548C\u5BA1\u8BA1\u5171\u7528\u6B64\u914D\u7F6E\uFF1B\u4F1A\u8BDD\u6A21\u578B\u72EC\u7ACB\u9009\u62E9\u3002" }),
          view?.error && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("p", { role: "status", className: "iad-muted", children: [
            "\u5DF2\u4FDD\u5B58\u914D\u7F6E\uFF1A",
            view.error
          ] }),
          !draft ? /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("form", { className: "iad-model-form", onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("fieldset", { disabled: busy || loading, children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("section", { className: "iad-section-layout", children: [
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("h3", { children: "\u6A21\u578B\u9009\u62E9" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-model-fields", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                    "\u63D0\u4F9B\u5546",
                    /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("select", { "aria-label": "\u5DE5\u4F5C\u53F0\u63D0\u4F9B\u5546", value: draft.provider_id, onChange: (event) => {
                      setDraft({ provider_id: event.target.value, model_id: "", limits: { ...defaultModelLimits } });
                      setParameters("{}");
                      setError("");
                      setNotice("");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("option", { value: "", children: "\u9009\u62E9\u63D0\u4F9B\u5546" }),
                      draft.provider_id && !provider && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("option", { value: draft.provider_id, children: [
                        "\u5DF2\u5931\u6548 \xB7 ",
                        draft.provider_id
                      ] }),
                      view?.providers.map((row) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("option", { value: row.provider_id, disabled: !!row.error, children: [
                        row.name,
                        row.error ? " \xB7 \u6682\u4E0D\u53EF\u7528" : ""
                      ] }, row.provider_id))
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                    "\u6A21\u578B",
                    /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("select", { "aria-label": "\u5DE5\u4F5C\u53F0\u6A21\u578B", value: draft.model_id, disabled: !provider || !!provider.error, onChange: (event) => {
                      setDraft({ ...draft, model_id: event.target.value });
                      setError("");
                      setNotice("");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("option", { value: "", children: "\u9009\u62E9\u6A21\u578B" }),
                      draft.model_id && !provider?.models.some((row) => row.model_id === draft.model_id) && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("option", { value: draft.model_id, children: [
                        "\u5DF2\u5931\u6548 \xB7 ",
                        draft.model_id
                      ] }),
                      provider?.models.map((row) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("option", { value: row.model_id, disabled: !row.input_modalities?.includes("image"), children: [
                        row.name,
                        row.input_modalities?.includes("image") ? "" : " \xB7 \u672A\u58F0\u660E\u56FE\u50CF\u80FD\u529B"
                      ] }, row.model_id))
                    ] })
                  ] })
                ] }),
                provider && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-model-endpoint", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { className: "iad-muted", children: "\u670D\u52A1\u5730\u5740" }),
                  /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { children: provider.endpoint || provider.error })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("section", { className: "iad-section-layout", children: [
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("h3", { children: "\u9AD8\u7EA7\u8BBE\u7F6E" }),
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { className: "iad-muted", children: "\u672A\u586B\u5199\u65F6\u4F7F\u7528\u670D\u52A1\u58F0\u660E\u503C" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("details", { className: "iad-model-advanced", children: [
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("summary", { children: "\u5BB9\u91CF\u4E0E\u8D85\u65F6" }),
                /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-model-fields", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                    "\u5BB9\u91CF\u9884\u68C0",
                    /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("select", { "aria-label": "\u5BB9\u91CF\u9884\u68C0\u534F\u8BAE", value: draft.limits.capacity_mode || "", onChange: (event) => setDraft({ ...draft, limits: { ...draft.limits, capacity_mode: event.target.value === "vllm_tokenize" ? "vllm_tokenize" : null } }), children: [
                      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("option", { value: "", children: "\u5C1A\u672A\u786E\u8BA4" }),
                      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("option", { value: "vllm_tokenize", children: "vLLM /tokenize" })
                    ] })
                  ] }),
                  numbers.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                    label,
                    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                      "input",
                      {
                        type: "number",
                        "aria-label": label,
                        min: key.endsWith("_seconds") ? 0 : 1,
                        step: key.endsWith("_seconds") ? "any" : "1",
                        value: draft.limits[key] ?? "",
                        placeholder: "\u4F7F\u7528\u670D\u52A1\u58F0\u660E\u503C",
                        onChange: (event) => setDraft({ ...draft, limits: { ...draft.limits, [key]: event.target.value === "" ? null : Number(event.target.value) } })
                      }
                    )
                  ] }, key))
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                  "\u670D\u52A1\u6269\u5C55\u53C2\u6570\uFF08JSON\uFF09",
                  /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("textarea", { "aria-label": "\u670D\u52A1\u6269\u5C55\u53C2\u6570", "aria-invalid": parametersError ? true : void 0, "aria-describedby": parametersError ? parametersId : void 0, rows: 4, value: parameters, onChange: (event) => setParameters(event.target.value) })
                ] }),
                parametersError && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { id: parametersId, role: "alert", className: "iad-error", children: parametersError })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-form-footer", children: [
              changed && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { className: "iad-muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539" }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("button", { type: "button", disabled: !draft.provider_id || !draft.model_id || !!parametersError, onClick: () => void check(), children: "\u68C0\u67E5\u8FDE\u63A5" }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("button", { className: "iad-primary", type: "submit", disabled: !changed || !draft.provider_id || !draft.model_id || !!parametersError, children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u4FDD\u5B58\u914D\u7F6E" }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("button", { type: "button", disabled: !changed, onClick: reset, children: "\u91CD\u7F6E" })
            ] })
          ] }) }),
          notice && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { role: "status", children: notice })
        ] })
      ] })
    ] });
  }

  // src/client/host/IndustrialSidebar.tsx
  var import_react50 = __toESM(__require("react"), 1);
  var import_jsx_runtime53 = __require("react/jsx-runtime");
  function IndustrialSidebar({ wide, panels, renderPanel, renderWorkspaces, usePanelInfo }) {
    const active = usePanelInfo((info) => info.activePanelId);
    const [sessionsOpen, setSessionsOpen] = (0, import_react50.useState)(!active);
    (0, import_react50.useEffect)(() => setSessionsOpen(!active), [active]);
    const business = panels.filter((panel) => panel.id in navigation && navigation[panel.id].chapter !== "\u5DE5\u5177");
    const auxiliary = panels.filter((panel) => !business.includes(panel));
    return /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("div", { className: `iad-sidebar-content ${wide ? "iad-sidebar-wide" : "iad-sidebar-rail"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("style", { children: themeStyles + `
      .iad-sidebar-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto;gap:16px;color:var(--dsw-alias-label-primary);font-size:14px}
      .iad-sidebar-content nav{display:flex;flex-direction:column;gap:20px}.iad-sidebar-content section{display:flex;flex-direction:column;gap:4px}
      .iad-sidebar-content h2{margin:0 10px 4px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content section>button{min-height:44px}.iad-sidebar-content [aria-current=page]{color:var(--iad-primary);background:var(--iad-hover)}
      .iad-sidebar-content details{min-height:0}.iad-sidebar-content summary{padding:8px 10px;cursor:pointer;list-style-position:inside;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:-2px}
      .iad-sidebar-content details[open]{flex:1;display:flex;flex-direction:column}.iad-native-workspace-content{min-height:0;overflow:auto;flex:1}
      .iad-sidebar-tools{margin-top:auto}.iad-sidebar-rail{gap:12px}.iad-sidebar-rail nav{gap:12px}
    ` }),
      /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("nav", { "aria-label": "\u5DE5\u4E1A\u5DE5\u4F5C\u53F0\u5BFC\u822A", children: ["\u6570\u636E\u51C6\u5907", "\u77E5\u8BC6\u6784\u5EFA", "\u8D28\u91CF\u5BA1\u6838"].map((chapter) => /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("section", { "aria-label": chapter, children: [
        wide && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("h2", { children: chapter }),
        business.filter((panel) => navigation[panel.id].chapter === chapter).map((panel) => /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(import_react50.default.Fragment, { children: renderPanel(panel) }, panel.id))
      ] }, chapter)) }),
      wide ? /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("details", { "data-native-workspaces": true, open: sessionsOpen, onToggle: (event) => setSessionsOpen(event.currentTarget.open), children: [
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("summary", { children: "\u4F1A\u8BDD\u4E0E\u5DE5\u4F5C\u533A" }),
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("div", { className: "iad-native-workspace-content", children: renderWorkspaces() })
      ] }) : renderWorkspaces(),
      /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("section", { className: "iad-sidebar-tools", "aria-label": "\u5DE5\u5177", children: auxiliary.map((panel) => /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(import_react50.default.Fragment, { children: renderPanel(panel) }, panel.id)) })
    ] });
  }

  // src/client/index.ts
  var name = "iad-client";
  var inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];
  function apply(ctx) {
    const workspace = new Workspace(new WorkbenchSession(ctx));
    const icons = { "industrial-datasets": DatasetIcon, "industrial-images": ImagesIcon, "industrial-exploration": ExplorationIcon, "industrial-knowledge": KnowledgeIcon, "industrial-audit": AuditIcon, "industrial-review": ReviewIcon, "industrial-model-settings": ModelSettingsIcon };
    ctx.slots.inject("sidebar.content", () => ctx.slots.register({ name: "sidebar.content" }, IndustrialSidebar));
    ctx.slots.inject("tool.call.toolview", () => {
      for (const [key, title] of Object.entries(workbenchTools)) ctx.slots.register({ name: "tool.call.toolview", key }, (props) => import_react51.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react51.default.createElement(SessionResult, { ...props, title })));
    });
    ctx.slots.inject("sidebar.panellist", () => {
      const disposers = Object.entries(pages).map(([id, label], index3) => ctx.slots.register({ name: "sidebar.panellist", id, order: index3 + 1, label }, icons[id]));
      return () => disposers.forEach((dispose) => dispose());
    });
    ctx.slots.inject("main", () => {
      for (const id of Object.keys(pages)) {
        ctx.slots.register(
          { name: "main", key: id },
          () => import_react51.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react51.default.createElement(WorkbenchModelProvider, { children: import_react51.default.createElement(
            "div",
            { className: "iad-workspace", onFocusCapture: (event) => {
              if (event.target instanceof HTMLElement) event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
            }, style: { height: "100%", minWidth: 0, containerType: "inline-size", containerName: "workbench" } },
            id === "industrial-model-settings" ? import_react51.default.createElement(ModelSettingsPage) : import_react51.default.createElement(WorkbenchPage, { pageId: id })
          ) }))
        );
      }
      return workspace.connect(ctx.layout);
    });
  }
  return __toCommonJS(index_exports);
})();
/*! Bundled license information:

tabbable/dist/index.esm.js:
  (*!
  * tabbable 6.5.0
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  *)
*/

    return __IadClientBundle__;
  }
});

//# sourceMappingURL=client.js.map
