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
  var import_react69 = __toESM(__require("react"), 1);

  // src/client/AuditIcon.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  function EditIcon() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5" }) });
  }
  function RefreshIcon() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6" }) });
  }
  function CopyIcon() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "8", y: "8", width: "12", height: "13", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 8V3H3v13h5" })
    ] });
  }
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

  // src/client/components/IconButton.tsx
  var import_react = __require("react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  var IconButton = (0, import_react.forwardRef)(function IconButton2({ label, title = label, type = "button", className = "", ...props }, ref) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { ...props, ref, type, "aria-label": label, title, className: `iad-icon-button ${className}` });
  });

  // src/client/WorkbenchPage.tsx
  var import_react54 = __require("react");

  // src/client/api.ts
  async function request(path, body, method, signal) {
    const multipart = body instanceof FormData;
    const response = await fetch("/api/iad" + path, {
      method: method || (body === void 0 ? "GET" : "POST"),
      headers: body === void 0 || multipart ? void 0 : { "Content-Type": "application/json" },
      body: body === void 0 ? void 0 : multipart ? body : JSON.stringify(body),
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
  var import_react9 = __require("react");

  // src/client/components/Modal.tsx
  var import_react2 = __require("react");
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function Modal({ title, onClose, children, className = "", restoreFocus, initialFocus, header = true, presentation = "modal" }) {
    const dialog = (0, import_react2.useRef)(null);
    const focusTarget = (0, import_react2.useRef)(restoreFocus);
    const pressedOutside = (0, import_react2.useRef)(false);
    const previousFocus = (0, import_react2.useRef)(null), currentPresentation = (0, import_react2.useRef)(presentation);
    focusTarget.current = restoreFocus;
    (0, import_react2.useLayoutEffect)(() => {
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
    (0, import_react2.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
          header && presentation === "modal" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "iad-dialog-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "iad-icon-button", "aria-label": `\u5173\u95ED${title}`, title: "\u5173\u95ED", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CloseIcon, {}) })
          ] }),
          children
        ]
      }
    );
  }

  // src/client/components/DeleteAction.tsx
  var import_react3 = __require("react");

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
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function DeleteAction({ title, name: name2, description, onDelete, disabled, className = "", restoreFocus }) {
    const [open, setOpen] = (0, import_react3.useState)(false), [busy, setBusy] = (0, import_react3.useState)(false), [error2, setError] = (0, import_react3.useState)("");
    const trigger = (0, import_react3.useRef)(null), cancel = (0, import_react3.useRef)(null);
    const submission = (0, import_react3.useRef)(""), actionStarted = (0, import_react3.useRef)(false);
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
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        IconButton,
        {
          ref: trigger,
          className,
          label: `${title} ${name2}`,
          title,
          disabled: disabled || busy,
          onClick: () => {
            submission.current = v4_default();
            actionStarted.current = false;
            setError("");
            setOpen(true);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(DeleteIcon, {})
        }
      ),
      open && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
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
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
              "\u786E\u8BA4",
              title,
              "\u201C",
              name2,
              "\u201D\uFF1F"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "iad-muted", children: description }),
            error2 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "iad-form-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { ref: cancel, type: "button", "aria-label": "\u53D6\u6D88\u5220\u9664", disabled: busy, onClick: () => setOpen(false), children: "\u53D6\u6D88" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "iad-danger", disabled: busy, onClick: () => void confirm(), children: busy ? "\u6B63\u5728\u5220\u9664\u2026" : "\u786E\u8BA4\u5220\u9664" })
            ] })
          ]
        }
      )
    ] });
  }

  // src/client/components/DatasetName.tsx
  var import_react4 = __require("react");
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  function DatasetName({ dataset, label, onChanged }) {
    const [editing, setEditing] = (0, import_react4.useState)(false), [value, setValue] = (0, import_react4.useState)("");
    const [busy, setBusy] = (0, import_react4.useState)(false), [error2, setError] = (0, import_react4.useState)("");
    const trigger = (0, import_react4.useRef)(null), restoreFocus = (0, import_react4.useRef)(false);
    const session = (0, import_react4.useRef)("idle");
    (0, import_react4.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "iad-dataset-name", children: editing ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
      error2 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "alert", className: "iad-error", children: error2 })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { ref: trigger, type: "button", className: "iad-name-trigger", "aria-label": `\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0 ${dataset.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: () => {
      session.current = "editing";
      setValue(dataset.name);
      setError("");
      setEditing(true);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: dataset.name }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EditIcon, {})
    ] }) });
  }

  // src/client/components/FolderMapping.tsx
  var import_jsx_runtime6 = __require("react/jsx-runtime");
  var roleLabels = {
    normal: "\u6B63\u5E38 (OK)",
    anomaly: "\u5F02\u5E38 (NG)",
    unlabeled: "\u672A\u6807\u8BB0",
    excluded: "\u6392\u9664"
  };
  function FolderMapping({ preview, rules, pending, disabled, onChange }) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "iad-folder-rules", children: [
      pending && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "status", children: "\u6B63\u5728\u9884\u89C8\u76EE\u5F55\u2026" }),
      preview && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "iad-muted", children: [
          "\u76EE\u5F55\u9884\u89C8\uFF1A\u53D1\u73B0 ",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: preview.total_images }),
          " \u5F20\u56FE\u50CF \xB7 ",
          preview.items.length,
          " \u4E2A\u76EE\u5F55"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("table", { className: "iad-preview-table", "aria-label": "\u76EE\u5F55\u89D2\u8272\u6620\u5C04", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u76EE\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { className: "iad-number", children: "\u56FE\u50CF\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u89D2\u8272\u6620\u5C04" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("tbody", { children: preview.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: item.path === "." ? "\u76F4\u5C5E\u56FE\u50CF" : item.path }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { className: "iad-number", children: item.image_count }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "select",
              {
                "aria-label": `\u76EE\u5F55 ${item.path} \u89D2\u8272`,
                disabled,
                value: rules?.find((rule) => rule.path === item.path)?.role || item.role,
                onChange: (event) => onChange(preview.items.map((row) => ({
                  path: row.path,
                  role: row.path === item.path ? event.target.value : rules?.find((rule) => rule.path === row.path)?.role || row.role
                }))),
                children: Object.entries(roleLabels).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value, children: label }, value))
              }
            ) })
          ] }, item.path)) })
        ] }) }),
        preview.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { role: "alert", className: "iad-error", children: preview.conflicts.map((conflict) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: conflict }, conflict)) })
      ] })
    ] });
  }

  // src/client/useFolderPreview.ts
  var import_react5 = __require("react");
  function useFolderPreview(root, rules, enabled) {
    const key = JSON.stringify({ root, rules });
    const [result, setResult] = (0, import_react5.useState)();
    (0, import_react5.useEffect)(() => {
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
    "industrial-consistency": { label: "\u6570\u636E\u4E00\u81F4\u6027", chapter: "\u8D28\u91CF\u5BA1\u6838" },
    "industrial-audit": { label: "\u6A21\u578B\u5BA1\u8BA1", chapter: "\u8D28\u91CF\u5BA1\u6838" },
    "industrial-review": { label: "\u4EBA\u5DE5\u590D\u6838", chapter: "\u8D28\u91CF\u5BA1\u6838" },
    "industrial-model-settings": { label: "\u6A21\u578B\u8BBE\u7F6E", chapter: "\u5DE5\u5177" }
  };
  var pages = Object.fromEntries(Object.entries(navigation).map(([id, page]) => [id, page.label]));
  var consistencyTabs = [{ id: "conflicts", label: "\u6807\u6CE8\u51B2\u7A81" }, { id: "search", label: "\u56FE\u50CF\u68C0\u7D22" }, { id: "groups", label: "\u91CD\u590D\u56FE\u7EC4" }, { id: "jobs", label: "\u7D22\u5F15\u4E0E\u4F5C\u4E1A" }];

  // src/client/components/layout/WorkbenchHeader.tsx
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  function WorkbenchHeader({ pageId, children, title }) {
    const page = navigation[pageId];
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "iad-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "iad-breadcrumb", "aria-label": "\u6240\u5728\u7AE0\u8282", children: page.chapter }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h1", { children: title || page.label })
      ] }),
      children && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "iad-header-actions", children })
    ] });
  }

  // src/client/components/Pagination.tsx
  var import_jsx_runtime8 = __require("react/jsx-runtime");
  var pageSize = 24;
  function Pagination({ total, page, unit, onPage, size: size4 = pageSize }) {
    if (!total) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "iad-pagination", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
        total,
        " ",
        unit
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { disabled: page <= 1, onClick: () => onPage(page - 1), children: "\u4E0A\u4E00\u9875" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
        page,
        " / ",
        Math.max(1, Math.ceil(total / size4))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { disabled: page * size4 >= total, onClick: () => onPage(page + 1), children: "\u4E0B\u4E00\u9875" })
    ] });
  }

  // src/client/useUnsavedChanges.ts
  var import_react7 = __require("react");

  // src/client/workspace.tsx
  var import_react6 = __require("react");

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
  var defaultView = (page) => ({ auditConsistencyMode: "exact", explorationPrompt: null, explorationPromptBase: "", directionFocus: "", datasetSettingsTab: "directories", checkId: "", explorationVersion: "", explorationNormalCount: "10", explorationDefectCount: "10", explorationNormalImages: [], explorationDefectImages: [], explorationObjective: "", miningSourceMode: "uncovered", scopeRunId: "", scopeSessionId: "", miningContinuous: false, conflictId: "", miningCount: "10", miningImages: [], miningPreset: "", miningSearch: "", miningPage: 1, filters: { ...page === "industrial-review" ? initialReviewFilters : initialFilters }, page: 1, selected: "", tab: "results", version: "", normalVersion: "", defectVersion: "", job: "", historyPage: 1, historySearch: "", historySampleId: "", knowledgeSearch: "", knowledgeStatus: "", inspection: null });
  var Workspace = class {
    constructor(conversation) {
      this.conversation = conversation;
    }
    conversation;
    state = { consistency: { tab: "conflicts", scope: { kind: "all_registered" } }, knowledgeKind: "normal", active: false, pageId: "industrial-datasets", datasetId: "", views: {} };
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
    view(page, kind = this.state.knowledgeKind, datasetId = this.state.datasetId) {
      return { ...this.defaults[page], ...this.state.views[this.viewKey(page, datasetId, kind)] };
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
    updateConsistency(patch, replace = false) {
      this.state = { ...this.state, consistency: { ...this.state.consistency, ...patch } };
      this.commit(replace);
    }
    openLocation(location2) {
      if (!this.canLeave()) return;
      if (location2.pageId === "industrial-consistency") {
        const { pageId: pageId2, ...consistency } = location2;
        this.state = { ...this.state, active: true, pageId: pageId2, consistency: { tab: "conflicts", scope: { kind: "all_registered" }, ...consistency } };
        this.commit();
        this.layout?.selectPanel(pageId2);
        return;
      }
      const { pageId, datasetId, knowledgeKind = this.state.knowledgeKind, ...view } = location2;
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
    async explainConsistency(result) {
      const frozen = { ...this.state.consistency };
      if (frozen.evidenceId !== result.evidence_id) throw new Error("\u8BF7\u5148\u6253\u5F00\u5B9E\u9645\u6BD4\u8F83\u8BC1\u636E");
      frozen.resultId = result.result_id;
      const reference = {
        evidence_id: result.evidence_id,
        result_id: result.result_id,
        difference_ids: frozen.differenceId ? [frozen.differenceId] : [],
        return_location: { pageId: "industrial-consistency", ...frozen }
      };
      await request("/consistency/context", reference);
      if (!this.state.active || this.state.pageId !== "industrial-consistency" || this.state.consistency.evidenceId !== frozen.evidenceId) throw new Error("\u8BC1\u636E\u4F4D\u7F6E\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u8BC1\u636E\u91CD\u65B0\u53D1\u8D77");
      await this.conversation.explainConsistency(reference, (sessionId) => {
        if (!this.state.active || this.state.pageId !== "industrial-consistency" || this.state.consistency.evidenceId !== frozen.evidenceId) throw new Error("\u8BC1\u636E\u4F4D\u7F6E\u5DF2\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u8BC1\u636E\u91CD\u65B0\u53D1\u8D77");
        this.updateConsistency({ sessionId }, true);
        return `${location.origin}${location.pathname}?${new URLSearchParams({ iad: JSON.stringify({ pageId: "industrial-consistency", ...frozen, sessionId }) })}`;
      }, frozen.sessionId);
    }
    commit(replace = false) {
      const { pageId, datasetId, knowledgeKind } = this.state;
      const url = new URL(location.href);
      const { explorationPrompt, explorationPromptBase, ...routeView } = this.view(pageId);
      if (this.state.active) url.searchParams.set("iad", JSON.stringify(pageId === "industrial-consistency" ? { pageId, ...this.state.consistency } : { pageId, datasetId, knowledgeKind, ...routeView }));
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
          this.state = { ...this.state, ...saved, consistency: saved.consistency || this.state.consistency, knowledgeKind: saved.knowledgeKind === "defect" ? "defect" : "normal", views: Object.fromEntries(Object.entries(saved.views || {}).map(([key, value]) => {
            const view = value;
            return [key, { ...view, filters: { ...initialFilters, ...view.filters } }];
          })) };
        }
        if (fromHistory) this.state = { ...this.state, active: false };
        if (raw) {
          const route = JSON.parse(raw);
          if (route.pageId === "industrial-consistency") {
            const consistency = { tab: "conflicts", scope: { kind: "all_registered" } };
            if (consistencyTabs.some((tab) => tab.id === route.tab)) consistency.tab = route.tab;
            if (["CURRENT", "HISTORICAL", "UNKNOWN"].includes(route.facts)) consistency.facts = route.facts;
            if (route.scope?.kind === "datasets" && Array.isArray(route.scope.dataset_ids) && route.scope.dataset_ids.length && route.scope.dataset_ids.every((id) => typeof id === "string" && id.length)) consistency.scope = route.scope;
            if (route.query?.kind === "sample" && typeof route.query.sample_id === "string" && route.query.sample_id) consistency.query = route.query;
            for (const key of ["batchId", "resultId", "evidenceId", "groupId", "memberId", "differenceId", "sessionId"]) if (typeof route[key] === "string") consistency[key] = route[key];
            for (const key of ["groupPage", "memberPage"]) if (Number.isSafeInteger(route[key]) && route[key] > 0) consistency[key] = route[key];
            if (route.returnPage in pages && route.returnPage !== "industrial-consistency") consistency.returnPage = route.returnPage;
            this.state = { ...this.state, active: true, pageId: route.pageId, consistency };
          } else if (route.pageId in pages && typeof route.datasetId === "string") {
            const knowledgeKind = route.knowledgeKind === "defect" ? "defect" : "normal";
            const stored = this.state.views[this.viewKey(route.pageId, route.datasetId, knowledgeKind)];
            const view = { ...defaultView(route.pageId), explorationPrompt: stored?.explorationPrompt || null, explorationPromptBase: stored?.explorationPromptBase || "" };
            for (const key of ["directionFocus", "checkId", "explorationVersion", "explorationNormalCount", "explorationDefectCount", "explorationObjective", "selected", "scopeRunId", "scopeSessionId", "conflictId", "tab", "version", "miningCount", "miningPreset", "miningSearch", "normalVersion", "defectVersion", "job", "historySearch", "historySampleId", "knowledgeSearch"]) if (typeof route[key] === "string") view[key] = route[key];
            if (route.datasetSettingsTab === "directories" || route.datasetSettingsTab === "basic") view.datasetSettingsTab = route.datasetSettingsTab;
            if (["exact", "visual", "combined"].includes(route.auditConsistencyMode)) view.auditConsistencyMode = route.auditConsistencyMode;
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
  var WorkspaceContext = (0, import_react6.createContext)(null);
  function useWorkspace() {
    const workspace = (0, import_react6.useContext)(WorkspaceContext);
    if (!workspace) throw new Error("Workbench requires its workspace owner");
    const state = (0, import_react6.useSyncExternalStore)(workspace.subscribe, workspace.getSnapshot);
    return { workspace, state };
  }

  // src/client/useUnsavedChanges.ts
  function useUnsavedChanges(dirty) {
    const { workspace } = useWorkspace();
    const current = (0, import_react7.useRef)(dirty);
    current.current = dirty;
    (0, import_react7.useEffect)(() => workspace.registerLeaveGuard(() => !current.current || window.confirm("\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF0C\u786E\u8BA4\u79BB\u5F00\u5E76\u653E\u5F03\u4FEE\u6539\uFF1F")), [workspace]);
    (0, import_react7.useEffect)(() => {
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
  var import_react8 = __require("react");
  var import_jsx_runtime9 = __require("react/jsx-runtime");
  function PageTabs({ label, items, value, onChange, children }) {
    const id = (0, import_react8.useId)(), buttons = (0, import_react8.useRef)(/* @__PURE__ */ new Map());
    const current = items.find((item) => item.id === value)?.id || items[0].id;
    function navigate(event, index3) {
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowRight" ? (index3 + 1) % items.length : event.key === "ArrowLeft" ? (index3 + items.length - 1) % items.length : null;
      if (next === null) return;
      event.preventDefault();
      onChange(items[next].id);
      buttons.current.get(items[next].id)?.focus();
    }
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "iad-tabs", role: "tablist", "aria-label": label, children: items.map((item, index3) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "iad-tab-panel", role: "tabpanel", id: `${id}-panel`, "aria-labelledby": `${id}-${current}`, tabIndex: 0, children })
    ] });
  }

  // src/client/components/DatasetManager.tsx
  var import_jsx_runtime10 = __require("react/jsx-runtime");
  function DirectoryPicker({ label, value, onChange, disabled = false }) {
    const [listing, setListing] = (0, import_react9.useState)(null);
    const [error2, setError] = (0, import_react9.useState)("");
    async function browse(path) {
      try {
        setListing(await request(`/directories?path=${encodeURIComponent(path || "/data1")}`));
        setError("");
      } catch (e) {
        setError(message(e));
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("label", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { "aria-label": label, disabled, value, onChange: (e) => onChange(e.target.value), placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", disabled, onClick: () => browse(value), children: "\u6D4F\u89C8" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      listing && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("fieldset", { className: "iad-directory", "aria-label": `${label}\u6D4F\u89C8`, disabled, children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { children: listing.path }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: () => browse(listing.parent), children: "\u4E0A\u7EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: () => {
            onChange(listing.path);
            setListing(null);
          }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: () => setListing(null), children: "\u5173\u95ED" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-directory-list", children: listing.directories.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: () => browse(dir.path), children: dir.name }, dir.path)) })
      ] })
    ] });
  }
  function DatasetSettings({ dataset, onChanged, sectionRef }) {
    const { workspace } = useWorkspace();
    const tab = workspace.view("industrial-datasets").datasetSettingsTab;
    const isFolder = dataset.format === "folder_classification";
    const [imageDir, setImageDir] = (0, import_react9.useState)(dataset.image_dir);
    const [annotationDir, setAnnotationDir] = (0, import_react9.useState)(dataset.annotation_dir || "");
    const savedRules = JSON.stringify(dataset.folder_rules || []);
    const [folderRules, setFolderRules] = (0, import_react9.useState)(dataset.folder_rules);
    const { preview, ready, pending, error: previewError } = useFolderPreview(imageDir, folderRules, isFolder);
    (0, import_react9.useEffect)(() => {
      setImageDir(dataset.image_dir);
      setAnnotationDir(dataset.annotation_dir || "");
      setFolderRules(JSON.parse(savedRules));
    }, [dataset.image_dir, dataset.annotation_dir, savedRules]);
    const rulesChanged = isFolder && JSON.stringify(folderRules) !== savedRules;
    const directoriesChanged = imageDir !== dataset.image_dir || !isFolder && annotationDir !== (dataset.annotation_dir || "");
    const modified = directoriesChanged || rulesChanged;
    useUnsavedChanges(modified);
    const [scan, setScan] = (0, import_react9.useState)(null);
    const [busy, setBusy] = (0, import_react9.useState)(false);
    const [error2, setError] = (0, import_react9.useState)("");
    const [copied, setCopied] = (0, import_react9.useState)(false);
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
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { ref: sectionRef, tabIndex: -1, className: "iad-dataset-detail", "aria-label": "\u5F53\u524D\u6570\u636E\u96C6\u8BE6\u60C5", "aria-busy": busy, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h2", { children: dataset.name }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "iad-muted", children: [
          dataset.total_samples,
          " \u5F20\u56FE\u50CF"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(PageTabs, { label: "\u6570\u636E\u96C6\u914D\u7F6E", items: [{ id: "directories", label: "\u76EE\u5F55\u4E0E\u6620\u5C04" }, { id: "basic", label: "\u57FA\u672C\u4FE1\u606F" }], value: tab, onChange: (datasetSettingsTab) => workspace.updateView("industrial-datasets", { datasetSettingsTab }), children: [
        tab === "basic" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-dataset-basic", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { children: "\u57FA\u672C\u4FE1\u606F" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("dl", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u6570\u636E\u96C6\u540D\u79F0" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DatasetName, { dataset, label: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", onChanged }) }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u6570\u636E\u683C\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { children: isFolder ? "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55" : "Labelme" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u56FE\u50CF\u603B\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("dd", { children: [
              dataset.total_samples,
              " \u5F20"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u6807\u6CE8 / \u6807\u7B7E" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { children: isFolder ? dataset.labeled_sample_count ?? 0 : dataset.annotation_count }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("dd", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { children: dataset.dataset_id }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(IconButton, { label: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", onClick: async () => {
                try {
                  await navigator.clipboard.writeText(dataset.dataset_id);
                  setCopied(true);
                } catch (error3) {
                  setError(message(error3));
                }
              }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CopyIcon, {}) }),
              copied && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "iad-muted", role: "status", children: "\u5DF2\u590D\u5236" })
            ] })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-section-layout", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { children: "\u670D\u52A1\u5668\u76EE\u5F55" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: "\u56FE\u50CF\u6839\u76EE\u5F55\u4E0E\u6807\u7B7E\u6620\u5C04" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DirectoryPicker, { label: isFolder ? "\u6839\u76EE\u5F55" : "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: (p) => {
                setImageDir(p);
                if (isFolder) setFolderRules(void 0);
              }, disabled: busy }),
              !isFolder && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }),
              isFolder && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FolderMapping, { preview, rules: folderRules, pending, disabled: busy, onChange: setFolderRules }),
              previewError && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", className: "iad-error", children: previewError }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-dataset-footer", children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", role: "status", "data-dirty": modified, children: modified ? "\u6709\u5C1A\u672A\u4FDD\u5B58\u7684\u53D8\u66F4" : "\u53EF\u4FEE\u6539\u8DEF\u5F84\u548C\u89D2\u8272\u6620\u5C04\u540E\u91CD\u65B0\u626B\u63CF" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-form-actions", children: [
                  modified && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", disabled: busy, onClick: () => {
                    setImageDir(dataset.image_dir);
                    setAnnotationDir(dataset.annotation_dir || "");
                    setFolderRules(dataset.folder_rules);
                    setError("");
                  }, children: "\u53D6\u6D88\u66F4\u6539" }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: modified ? "iad-primary" : "", disabled: busy || isFolder && modified && !ready || directoriesChanged && (!imageDir.trim() || !isFolder && !annotationDir.trim()), onClick: () => void rescan(), children: busy ? "\u6B63\u5728\u5904\u7406\u2026" : modified ? "\u4FDD\u5B58\u6620\u5C04\u5E76\u91CD\u65B0\u626B\u63CF" : "\u91CD\u65B0\u626B\u63CF\u76EE\u5F55" })
                ] })
              ] })
            ] })
          ] }),
          !isFolder && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "iad-row iad-rule", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { type: "checkbox", checked: dataset.unannotated_is_normal, disabled: busy, onChange: (e) => save({ unannotated_is_normal: e.target.checked }) }),
            "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u6765\u6E90"
          ] }),
          scan && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { role: "status", "aria-label": "\u626B\u63CF\u7ED3\u679C", children: [
            "\u626B\u63CF\u5B8C\u6210 \xB7 ",
            scan.image_count,
            " \u5F20\u56FE\u50CF \xB7 ",
            scan.annotation_count,
            " \u4E2A\u6807\u6CE8 \xB7 ",
            scan.issue_count,
            " \u9879\u95EE\u9898"
          ] })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", className: "iad-error", children: error2 })
      ] })
    ] });
  }
  function DatasetManager({ datasets, selected, onChanged }) {
    const settingsRef = (0, import_react9.useRef)(null);
    const [requested, setRequested] = (0, import_react9.useState)(null);
    (0, import_react9.useEffect)(() => {
      if (requested && selected?.dataset_id === requested && settingsRef.current) {
        settingsRef.current.scrollIntoView({ block: "start" });
        settingsRef.current.focus({ preventScroll: true });
        setRequested(null);
      }
    }, [requested, selected?.dataset_id]);
    const [search, setSearch] = (0, import_react9.useState)("");
    const [page, setPage] = (0, import_react9.useState)(1);
    const filtered = datasets.filter((dataset) => dataset.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
    const [importing, setImporting] = (0, import_react9.useState)(false);
    const [importFormat, setImportFormat] = (0, import_react9.useState)("labelme");
    const [notice, setNotice] = (0, import_react9.useState)("");
    const addButton = (0, import_react9.useRef)(null);
    (0, import_react9.useEffect)(() => {
      if (notice) addButton.current?.focus();
    }, [notice]);
    const [name2, setName] = (0, import_react9.useState)("");
    const [imageDir, setImageDir] = (0, import_react9.useState)("");
    const [annotationDir, setAnnotationDir] = (0, import_react9.useState)("");
    const [rootDir, setRootDir] = (0, import_react9.useState)("");
    const [userRules, setUserRules] = (0, import_react9.useState)();
    const [busy, setBusy] = (0, import_react9.useState)(false);
    const [error2, setError] = (0, import_react9.useState)("");
    const { preview, ready, pending, error: previewError } = useFolderPreview(rootDir, userRules, importing && importFormat === "folder_classification");
    (0, import_react9.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(WorkbenchHeader, { pageId: "industrial-datasets", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { ref: addButton, className: "iad-primary", onClick: () => {
        setError("");
        setNotice("");
        setImporting(true);
      }, children: "\u6DFB\u52A0\u6570\u636E\u96C6" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-settings", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: "iad-dataset-list", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-section-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("h2", { children: [
              "\u6570\u636E\u96C6 ",
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "iad-muted", children: datasets.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22\u6570\u636E\u96C6", placeholder: "\u641C\u7D22\u6570\u636E\u96C6", value: search, onChange: (event) => {
              setSearch(event.target.value);
              setPage(1);
            } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("colgroup", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("col", { style: { width: "33%" } }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("col", {}),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("col", { style: { width: "12%" } }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("col", { style: { width: "15%" } }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("col", { style: { width: 112 } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "\u6570\u636E\u96C6\u540D\u79F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "\u683C\u5F0F" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { className: "iad-number", children: "\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { className: "iad-number", children: "\u6807\u6CE8 / \u6807\u7B7E" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "\u64CD\u4F5C" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("tbody", { children: filtered.slice((currentPage - 1) * 10, currentPage * 10).map((dataset) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("tr", { className: "iad-dataset-row", "data-selected": selected?.dataset_id === dataset.dataset_id, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DatasetName, { dataset, label: "\u5217\u8868\u6570\u636E\u96C6\u540D\u79F0", onChanged: () => onChanged() }) }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: dataset.format === "folder_classification" ? "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55" : "Labelme" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { className: "iad-number", children: dataset.total_samples }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { className: "iad-number", children: dataset.format === "folder_classification" ? dataset.labeled_sample_count ?? 0 : dataset.annotation_count }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(IconButton, { label: `\u914D\u7F6E\u6570\u636E\u96C6 ${dataset.name}`, title: "\u914D\u7F6E\u6570\u636E\u96C6", "aria-pressed": selected?.dataset_id === dataset.dataset_id, onClick: () => {
                  setRequested(dataset.dataset_id);
                  onChanged(dataset.dataset_id);
                }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ModelSettingsIcon, { size: 16 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
                )
              ] }) })
            ] }, dataset.dataset_id)) })
          ] }) }),
          filtered.length > 10 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Pagination, { total: filtered.length, page: currentPage, size: 10, unit: "\u4E2A\u6570\u636E\u96C6", onPage: setPage }),
          notice && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "status", children: notice }),
          !filtered.length && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: datasets.length ? "\u6CA1\u6709\u5339\u914D\u7684\u6570\u636E\u96C6\u3002" : "\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u56FE\u50CF\u76EE\u5F55\u4E0E\u6807\u6CE8\u76EE\u5F55\uFF0C\u6216\u5F02\u5E38\u68C0\u6D4B\u5206\u7C7B\u76EE\u5F55\u3002" })
        ] }),
        selected ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DatasetSettings, { dataset: selected, onChanged, sectionRef: settingsRef }, selected.dataset_id) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: "\u9009\u62E9\u6216\u6DFB\u52A0\u6570\u636E\u96C6\u3002" }) }),
        importing && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Modal, { title: "\u6DFB\u52A0\u6570\u636E\u96C6", className: "iad-dataset-dialog", onClose: () => {
          if (!busy) setImporting(false);
        }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("form", { className: "iad-dataset-import", onSubmit: importDataset, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("label", { children: "\u6570\u636E\u683C\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-row", role: "radiogroup", "aria-label": "\u6570\u636E\u683C\u5F0F", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { type: "radio", name: "dataset_format", value: "labelme", checked: importFormat === "labelme", onChange: () => {
                  setImportFormat("labelme");
                  setError("");
                } }),
                "Labelme"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { type: "radio", name: "dataset_format", value: "folder_classification", checked: importFormat === "folder_classification", onChange: () => {
                  setImportFormat("folder_classification");
                  setError("");
                } }),
                "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55"
              ] })
            ] })
          ] }),
          importFormat === "labelme" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { id: "dataset-name", value: name2, onChange: (e) => setName(e.target.value), maxLength: 120, autoFocus: true, required: true, disabled: busy })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir, disabled: busy }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "iad-muted", children: "\u6309\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\uFF0C\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u5019\u9009\u3002" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DirectoryPicker, { label: "\u7236\u76EE\u5F55", value: rootDir, onChange: (path) => {
              setRootDir(path);
              setUserRules(void 0);
            }, disabled: busy }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { id: "dataset-name", value: name2, onChange: (e) => setName(e.target.value), maxLength: 120, required: true, disabled: busy })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FolderMapping, { preview, rules: userRules, pending, disabled: busy, onChange: setUserRules }),
            previewError && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", className: "iad-error", children: previewError })
          ] }),
          error2 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "iad-form-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", disabled: busy, onClick: () => setImporting(false), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "iad-primary", disabled: busy || !name2.trim() || (importFormat === "labelme" ? !imageDir || !annotationDir : !rootDir || !ready), children: busy ? "\u6B63\u5728\u626B\u63CF\u5BFC\u5165\u2026" : "\u5BFC\u5165\u6570\u636E\u96C6" })
          ] })
        ] }) })
      ] })
    ] });
  }

  // src/client/components/FloatingMenu.tsx
  var import_react12 = __require("react");

  // ../../node_modules/.pnpm/@floating-ui+react@0.27.20_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@floating-ui/react/dist/floating-ui.react.mjs
  var React9 = __toESM(__require("react"), 1);

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
  var React7 = __toESM(__require("react"), 1);
  var import_react10 = __require("react");

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
  var index = isClient ? import_react10.useLayoutEffect : noop;
  var SafeReact = {
    ...React7
  };
  function useLatestRef(value) {
    const ref = React7.useRef(value);
    index(() => {
      ref.current = value;
    });
    return ref;
  }
  var useInsertionEffect = SafeReact.useInsertionEffect;
  var useSafeInsertionEffect = useInsertionEffect || ((fn) => fn());
  function useEffectEvent(callback) {
    const ref = React7.useRef(() => {
      if (true) {
        throw new Error("Cannot call an event handler while rendering.");
      }
    });
    useSafeInsertionEffect(() => {
      ref.current = callback;
    });
    return React7.useCallback(function() {
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
  var import_jsx_runtime11 = __require("react/jsx-runtime");
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
  var React8 = __toESM(__require("react"), 1);
  var import_react11 = __require("react");
  var ReactDOM = __toESM(__require("react-dom"), 1);
  var isClient2 = typeof document !== "undefined";
  var noop3 = function noop4() {
  };
  var index2 = isClient2 ? import_react11.useLayoutEffect : noop3;
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
    const ref = React8.useRef(value);
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
    const [data, setData] = React8.useState({
      x: 0,
      y: 0,
      strategy,
      placement,
      middlewareData: {},
      isPositioned: false
    });
    const [latestMiddleware, setLatestMiddleware] = React8.useState(middleware);
    if (!deepEqual(latestMiddleware, middleware)) {
      setLatestMiddleware(middleware);
    }
    const [_reference, _setReference] = React8.useState(null);
    const [_floating, _setFloating] = React8.useState(null);
    const setReference = React8.useCallback((node) => {
      if (node !== referenceRef.current) {
        referenceRef.current = node;
        _setReference(node);
      }
    }, []);
    const setFloating = React8.useCallback((node) => {
      if (node !== floatingRef.current) {
        floatingRef.current = node;
        _setFloating(node);
      }
    }, []);
    const referenceEl = externalReference || _reference;
    const floatingEl = externalFloating || _floating;
    const referenceRef = React8.useRef(null);
    const floatingRef = React8.useRef(null);
    const dataRef = React8.useRef(data);
    const hasWhileElementsMounted = whileElementsMounted != null;
    const whileElementsMountedRef = useLatestRef2(whileElementsMounted);
    const platformRef = useLatestRef2(platform2);
    const openRef = useLatestRef2(open);
    const update = React8.useCallback(() => {
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
    const isMountedRef = React8.useRef(false);
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
    const refs = React8.useMemo(() => ({
      reference: referenceRef,
      floating: floatingRef,
      setReference,
      setFloating
    }), [setReference, setFloating]);
    const elements = React8.useMemo(() => ({
      reference: referenceEl,
      floating: floatingEl
    }), [referenceEl, floatingEl]);
    const floatingStyles = React8.useMemo(() => {
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
    return React8.useMemo(() => ({
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
    ...React9
  };
  var serverHandoffComplete = false;
  var count = 0;
  var genId = () => (
    // Ensure the id is unique with multiple independent versions of Floating UI
    // on <React 18
    "floating-ui-" + Math.random().toString(36).slice(2, 6) + count++
  );
  function useFloatingId() {
    const [id, setId] = React9.useState(() => serverHandoffComplete ? genId() : void 0);
    index(() => {
      if (id == null) {
        setId(genId());
      }
    }, []);
    React9.useEffect(() => {
      serverHandoffComplete = true;
    }, []);
    return id;
  }
  var useReactId = SafeReact2.useId;
  var useId2 = useReactId || useFloatingId;
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
  var FloatingNodeContext = /* @__PURE__ */ React9.createContext(null);
  var FloatingTreeContext = /* @__PURE__ */ React9.createContext(null);
  var useFloatingParentNodeId = () => {
    var _React$useContext;
    return ((_React$useContext = React9.useContext(FloatingNodeContext)) == null ? void 0 : _React$useContext.id) || null;
  };
  var useFloatingTree = () => React9.useContext(FloatingTreeContext);
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
    const pointerTypeRef = React9.useRef();
    const timeoutRef = React9.useRef(-1);
    const handlerRef = React9.useRef();
    const restTimeoutRef = React9.useRef(-1);
    const blockMouseMoveRef = React9.useRef(true);
    const performedPointerEventsMutationRef = React9.useRef(false);
    const unbindMouseMoveRef = React9.useRef(() => {
    });
    const restTimeoutPendingRef = React9.useRef(false);
    const isHoverOpen = useEffectEvent(() => {
      var _dataRef$current$open;
      const type = (_dataRef$current$open = dataRef.current.openEvent) == null ? void 0 : _dataRef$current$open.type;
      return (type == null ? void 0 : type.includes("mouse")) && type !== "mousedown";
    });
    React9.useEffect(() => {
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
    React9.useEffect(() => {
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
    const closeWithDelay = React9.useCallback(function(event, runElseBranch, reason) {
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
    React9.useEffect(() => {
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
    React9.useEffect(() => {
      return () => {
        cleanupMouseMoveHandler();
        clearTimeoutIfSet(timeoutRef);
        clearTimeoutIfSet(restTimeoutRef);
        clearPointerEvents();
      };
    }, [enabled, elements.domReference, cleanupMouseMoveHandler, clearPointerEvents]);
    const reference = React9.useMemo(() => {
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
    return React9.useMemo(() => enabled ? {
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
  var FocusGuard = /* @__PURE__ */ React9.forwardRef(function FocusGuard2(props, ref) {
    const [role, setRole] = React9.useState();
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
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", {
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
  var PortalContext = /* @__PURE__ */ React9.createContext(null);
  var attr = /* @__PURE__ */ createAttribute("portal");
  function useFloatingPortalNode(props) {
    if (props === void 0) {
      props = {};
    }
    const {
      id,
      root
    } = props;
    const uniqueId = useId2();
    const portalContext = usePortalContext();
    const [portalNode, setPortalNode] = React9.useState(null);
    const portalNodeRef = React9.useRef(null);
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
    const [focusManagerState, setFocusManagerState] = React9.useState(null);
    const beforeOutsideRef = React9.useRef(null);
    const afterOutsideRef = React9.useRef(null);
    const beforeInsideRef = React9.useRef(null);
    const afterInsideRef = React9.useRef(null);
    const modal = focusManagerState == null ? void 0 : focusManagerState.modal;
    const open = focusManagerState == null ? void 0 : focusManagerState.open;
    const shouldRenderGuards = (
      // The FocusManager and therefore floating element are currently open/
      // rendered.
      !!focusManagerState && // Guards are only for non-modal focus management.
      !focusManagerState.modal && // Don't render if unmount is transitioning.
      focusManagerState.open && preserveTabOrder && !!(root || portalNode)
    );
    React9.useEffect(() => {
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
    React9.useEffect(() => {
      if (!portalNode) return;
      if (open) return;
      enableFocusInside(portalNode);
    }, [open, portalNode]);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(PortalContext.Provider, {
      value: React9.useMemo(() => ({
        preserveTabOrder,
        beforeOutsideRef,
        afterOutsideRef,
        beforeInsideRef,
        afterInsideRef,
        portalNode,
        setFocusManagerState
      }), [preserveTabOrder, portalNode]),
      children: [shouldRenderGuards && portalNode && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FocusGuard, {
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
      }), shouldRenderGuards && portalNode && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", {
        "aria-owns": portalNode.id,
        style: HIDDEN_OWNER_STYLES
      }), portalNode && /* @__PURE__ */ ReactDOM2.createPortal(children, portalNode), shouldRenderGuards && portalNode && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FocusGuard, {
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
  var usePortalContext = () => React9.useContext(PortalContext);
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
    const pointerTypeRef = React9.useRef();
    const didKeyDownRef = React9.useRef(false);
    const reference = React9.useMemo(() => ({
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
    return React9.useMemo(() => enabled ? {
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
    const endedOrStartedInsideRef = React9.useRef(false);
    const {
      escapeKey: escapeKeyBubbles,
      outsidePress: outsidePressBubbles
    } = normalizeProp(bubbles);
    const {
      escapeKey: escapeKeyCapture,
      outsidePress: outsidePressCapture
    } = normalizeProp(capture);
    const isComposingRef = React9.useRef(false);
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
    React9.useEffect(() => {
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
    React9.useEffect(() => {
      dataRef.current.insideReactTree = false;
    }, [dataRef, outsidePress, outsidePressEvent]);
    const reference = React9.useMemo(() => ({
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
    const floating = React9.useMemo(() => {
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
    return React9.useMemo(() => enabled ? {
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
    const floatingId = useId2();
    const dataRef = React9.useRef({});
    const [events] = React9.useState(() => createEventEmitter());
    const nested = useFloatingParentNodeId() != null;
    if (true) {
      const optionDomReference = elementsProp.reference;
      if (optionDomReference && !isElement(optionDomReference)) {
        error("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
      }
    }
    const [positionReference, setPositionReference] = React9.useState(elementsProp.reference);
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
    const refs = React9.useMemo(() => ({
      setPositionReference
    }), []);
    const elements = React9.useMemo(() => ({
      reference: positionReference || elementsProp.reference || null,
      floating: elementsProp.floating || null,
      domReference: elementsProp.reference
    }), [positionReference, elementsProp.reference, elementsProp.floating]);
    return React9.useMemo(() => ({
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
    const [_domReference, setDomReference] = React9.useState(null);
    const [positionReference, _setPositionReference] = React9.useState(null);
    const optionDomReference = computedElements == null ? void 0 : computedElements.domReference;
    const domReference = optionDomReference || _domReference;
    const domReferenceRef = React9.useRef(null);
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
    const setPositionReference = React9.useCallback((node) => {
      const computedPositionReference = isElement(node) ? {
        getBoundingClientRect: () => node.getBoundingClientRect(),
        getClientRects: () => node.getClientRects(),
        contextElement: node
      } : node;
      _setPositionReference(computedPositionReference);
      position.refs.setReference(computedPositionReference);
    }, [position.refs]);
    const setReference = React9.useCallback((node) => {
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
    const refs = React9.useMemo(() => ({
      ...position.refs,
      setReference,
      setPositionReference,
      domReference: domReferenceRef
    }), [position.refs, setReference, setPositionReference]);
    const elements = React9.useMemo(() => ({
      ...position.elements,
      domReference
    }), [position.elements, domReference]);
    const context = React9.useMemo(() => ({
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
    return React9.useMemo(() => ({
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
    const blockFocusRef = React9.useRef(false);
    const timeoutRef = React9.useRef(-1);
    const keyboardModalityRef = React9.useRef(true);
    React9.useEffect(() => {
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
    React9.useEffect(() => {
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
    React9.useEffect(() => {
      return () => {
        clearTimeoutIfSet(timeoutRef);
      };
    }, []);
    const reference = React9.useMemo(() => ({
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
    return React9.useMemo(() => enabled ? {
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
    const getReferenceProps = React9.useCallback(
      (userProps) => mergeProps(userProps, propsList, "reference"),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      referenceDeps
    );
    const getFloatingProps = React9.useCallback(
      (userProps) => mergeProps(userProps, propsList, "floating"),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      floatingDeps
    );
    const getItemProps = React9.useCallback(
      (userProps) => mergeProps(userProps, propsList, "item"),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      itemDeps
    );
    return React9.useMemo(() => ({
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
    const defaultReferenceId = useId2();
    const referenceId = ((_elements$domReferenc = elements.domReference) == null ? void 0 : _elements$domReferenc.id) || defaultReferenceId;
    const floatingId = React9.useMemo(() => {
      var _getFloatingFocusElem;
      return ((_getFloatingFocusElem = getFloatingFocusElement(elements.floating)) == null ? void 0 : _getFloatingFocusElem.id) || defaultFloatingId;
    }, [elements.floating, defaultFloatingId]);
    const ariaRole = (_componentRoleToAriaR = componentRoleToAriaRoleMap.get(role)) != null ? _componentRoleToAriaR : role;
    const parentId = useFloatingParentNodeId();
    const isNested = parentId != null;
    const reference = React9.useMemo(() => {
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
    const floating = React9.useMemo(() => {
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
    const item = React9.useCallback((_ref) => {
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
    return React9.useMemo(() => enabled ? {
      reference,
      floating,
      item
    } : {}, [enabled, reference, floating, item]);
  }

  // src/client/components/FloatingMenu.tsx
  var import_jsx_runtime12 = __require("react/jsx-runtime");
  function FloatingMenu({ label, summary, className, detailsRef, children }) {
    const [open, setOpen] = (0, import_react12.useState)(false);
    const internalRef = (0, import_react12.useRef)(null);
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
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("details", { ref: menu, className: `iad-floating-menu ${className}`, onToggle: (event) => setOpen(event.currentTarget.open), children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("summary", { ref: refs.setReference, "aria-label": label, ...getReferenceProps(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: summary }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "m6 9 6 6 6-6" }) })
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { ref: refs.setFloating, ...getFloatingProps(), className: "iad-floating-menu-panel", style: { ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }, children })
    ] });
  }

  // src/client/components/SampleFilters.tsx
  var import_jsx_runtime13 = __require("react/jsx-runtime");
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
    const select = (key, label) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "iad-filter", children: [
      label,
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("select", { "aria-label": label, disabled: busy, value: filters[key], onChange: (e) => onFilters({ ...filters, [key]: e.target.value }), children: options[key].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value, children: title }, value)) })
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
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "iad-filter iad-search", children: [
          "\u641C\u7D22",
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "search", "aria-label": "\u6309\u6587\u4EF6\u540D\u641C\u7D22", placeholder: "\u6587\u4EF6\u540D", disabled: busy, value: filters.search, onChange: (e) => onFilters({ ...filters, search: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-filter", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: "\u539F\u59CB\u6807\u7B7E" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(FloatingMenu, { className: "iad-multiselect", label: "\u539F\u59CB\u6807\u7B7E\u7B5B\u9009", summary: rawFilters.length ? `\u5DF2\u9009 ${rawFilters.length} \u9879` : "\u5168\u90E8", children: [
            rawLabelOptions.map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "checkbox", "aria-label": `\u539F\u59CB\u6807\u7B7E ${title}`, disabled: busy, checked: rawFilters.includes(value), onChange: (e) => onFilters({ ...filters, raw_label_filters: e.target.checked ? [...rawFilters, value] : rawFilters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { disabled: busy, onClick: () => onFilters({ ...filters, raw_label_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        !isFolder && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-filter", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: "\u6807\u6CE8" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(FloatingMenu, { className: "iad-multiselect", label: "\u6807\u6CE8\u7B5B\u9009", summary: filters.annotation_filters.length ? `\u5DF2\u9009 ${filters.annotation_filters.length} \u9879` : "\u5168\u90E8", children: [
            [["none", "\u65E0\u6807\u6CE8"], ["present", "\u6709\u6807\u6CE8"], ...dataset.annotation_categories.map((value) => [`category:${value}`, `\u7C7B\u522B ${value}`])].map(([value, title]) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "checkbox", "aria-label": title, disabled: busy, checked: filters.annotation_filters.includes(value), onChange: (e) => onFilters({ ...filters, annotation_filters: e.target.checked ? [...filters.annotation_filters, value] : filters.annotation_filters.filter((item) => item !== value) }) }),
              title
            ] }, value)),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { disabled: busy, onClick: () => onFilters({ ...filters, annotation_filters: [] }), children: "\u6E05\u7A7A" })
          ] })
        ] }),
        select("model_status", "\u6A21\u578B\u5BA1\u8BA1"),
        select("review_status", "\u4EBA\u5DE5\u590D\u6838"),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(FloatingMenu, { className: "iad-multiselect", label: "\u66F4\u591A\u7B5B\u9009", summary: "\u66F4\u591A\u7B5B\u9009", children: [
          select("technical", "\u6280\u672F\u8D28\u91CF"),
          select("reference_status", "\u826F\u54C1\u6765\u6E90"),
          select("sort_by", "\u6392\u5E8F")
        ] })
      ] }),
      !!active.length && /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "iad-filter-summary", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { children: [
          "\u7B5B\u9009\uFF1A",
          active.join(" \xB7 ")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { disabled: busy, onClick: () => onFilters({ ...defaults }), children: "\u6E05\u9664\u7B5B\u9009" })
      ] })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_react16 = __require("react");

  // src/client/components/Tooltip.tsx
  var import_react14 = __require("react");

  // src/client/theme.ts
  var darkColors = `--iad-canvas:#141B25;--iad-surface:#202B3A;--iad-navigation:#182231;--iad-surface-muted:#293648;--iad-text:#EDF2F8;--iad-muted:#B4C0D0;--iad-border:#4C5B6E;--iad-control-border:#8393AA;--iad-primary:#A7C5FF;--iad-primary-fill:#315FC9;--iad-hover:#293E60;--iad-success:#92D7B0;--iad-warning:#F3C280;--iad-danger:#FFB7B1;--iad-viewer:#10161F;`;
  var themeStyles = `
:root {
 --iad-canvas:#EEF1F5;
 --iad-surface:#fff;
 --iad-navigation:#F5F7FA;
 --iad-surface-muted:#F2F5F9;
 --iad-text:#182230;
 --iad-muted:#536174;
 --iad-border:#CBD3DE;
 --iad-control-border:#7D8CA0;
 --iad-primary:#2458C6;
 --iad-primary-fill:#2458C6;
 --iad-on-primary:#fff;
 --iad-hover:#EAF0FE;
 --iad-danger:#B42318;
 --iad-success:#166344;
 --iad-warning:#8A4B06;
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-viewer:#202833;
 --iad-on-viewer:#fff;
 --iad-viewer-edge-fill:rgba(15,25,36,.76);--iad-viewer-edge-hover:rgba(35,48,65,.94);
 --iad-viewer-edge-border:#4B5C70;--iad-viewer-edge-hover-border:#8294A8;--iad-viewer-edge-shadow:rgba(0,0,0,.1);
 --iad-scrim:#101b2bd9;
 --iad-radius:.375rem;
 --iad-control-height:2.5rem;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-6);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.285714);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.071429);
}
[data-ds-dark-theme] {${darkColors}}
.iad-consistency{--iad-text:#17243A;--iad-muted:#64748A;--iad-border:#D9E0E9;--iad-primary:#275BCC;--iad-primary-fill:#275BCC;--iad-hover:#EAF0FD;--iad-surface-muted:#F9FAFC}
[data-ds-dark-theme] .iad-consistency{${darkColors}}
:is([data-page="industrial-datasets"],.iad-dataset-dialog) {
 --iad-canvas:#F7F8FA;--iad-surface:#fff;--iad-surface-muted:#F1F4F8;
 --iad-text:#202938;--iad-muted:#626E80;--iad-border:#E2E6EC;--iad-panel-border:#CBD5E1;
 --iad-control-border:#8491A3;--iad-primary:#275BCC;--iad-primary-fill:#275BCC;--iad-hover:#EDF3FF;--iad-dialog-shadow:#17213435;
}
.iad-detail-dialog.iad-dataset-dialog::backdrop{background:rgba(17,30,51,.45)}
[data-ds-dark-theme] :is([data-page="industrial-datasets"],.iad-dataset-dialog) {${darkColors}--iad-panel-border:var(--iad-border);}
`;

  // src/client/components/Tooltip.tsx
  var import_jsx_runtime14 = __require("react/jsx-runtime");
  function Tooltip({ label, content, className, children }) {
    const [open, setOpen] = (0, import_react14.useState)(false);
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
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { type: "button", ref: refs.setReference, className, "aria-label": label, ...getReferenceProps(), children }),
      open && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(FloatingPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { ref: refs.setFloating, className: "iad-tooltip", style: floatingStyles, ...getFloatingProps(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("style", { children: [
          themeStyles,
          `.iad-tooltip{box-sizing:border-box;z-index:10020;max-width:min(340px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:12px;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);font:var(--dsh-content-font-size,14px)/1.5 system-ui,sans-serif;overflow-wrap:anywhere;box-shadow:0 4px 16px #0002}.iad-tooltip p{margin:4px 0}`
        ] }),
        content
      ] }) })
    ] });
  }

  // src/client/components/SampleCard.tsx
  var import_jsx_runtime15 = __require("react/jsx-runtime");
  function SampleCard({ sample, selected, onSelect, reference, selection, compact = false }) {
    const status = sample.suggestion?.suggested_label;
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "iad-sample-item", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("button", { "data-sample-id": sample.sample_id, className: `iad-sample ${selected ? "is-selected" : ""}`, title: sample.relative_path, onClick: onSelect, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "iad-thumb", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("img", { loading: "lazy", src: mediaUrl(sample, "thumbnail"), alt: sample.relative_path }),
          reference && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "iad-reference", children: "\u826F\u54C1\u6765\u6E90" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children: sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "iad-sample-label", children: [
          sample.quality_status === "PASS" ? "OK" : sample.quality_status === "FAIL" ? "NG" : "\u672A\u6807\u8BB0",
          " ",
          compact && ` \xB7 ${sample.review_decision ? reviewLabel(sample.review_decision) : status ? modelLabels[status] : "\u672A\u5BA1\u8BA1"}`
        ] })
      ] }),
      !compact && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(Tooltip, { label: `\u67E5\u770B\u72B6\u6001 ${sample.relative_path}`, className: `iad-status-trigger is-${status || "pending"}`, content: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { children: "\u6A21\u578B\u5EFA\u8BAE\u4E0D\u4EE3\u66FF\u4EBA\u5DE5\u88C1\u51B3\u3002" }),
        sample.review_decision && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("p", { children: [
          "\u6A21\u578B\u5BA1\u8BA1\uFF1A",
          status ? modelLabels[status] : "\u672A\u5BA1\u8BA1"
        ] })
      ] }), children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "iad-status-mark", "aria-hidden": "true" }),
        sample.review_decision ? reviewLabel(sample.review_decision) : status ? modelLabels[status] : "\u672A\u5BA1\u8BA1"
      ] }),
      selection && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("label", { className: "iad-source-check", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("input", { type: "checkbox", "aria-label": `\u9009\u62E9\u826F\u54C1\u6765\u6E90 ${sample.relative_path}`, disabled: selection.disabled, checked: selection.checked, onChange: (event) => selection.onChange(event.target.checked) }) })
    ] });
  }

  // src/client/components/SampleGrid.tsx
  var import_jsx_runtime16 = __require("react/jsx-runtime");
  function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading, sourceManagement, layout = "grid", showFilters = true }) {
    const scope = dataset.dataset_id;
    const [selection, setSelection] = (0, import_react16.useState)({ scope: "", ids: [] });
    const [busy, setBusy] = (0, import_react16.useState)(false), [error2, setError] = (0, import_react16.useState)(""), [notice, setNotice] = (0, import_react16.useState)("");
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
    const pagination = /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Pagination, { total, page, unit: "\u5F20", onPage });
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: `iad-gallery ${layout === "queue" ? "iad-review-queue" : ""}`, "aria-label": "\u56FE\u50CF\u5217\u8868", children: [
      showFilters && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(SampleFilters, { dataset, filters, onFilters, busy }),
      managing && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "iad-source-controls", "aria-label": "\u826F\u54C1\u6765\u6E90\u7BA1\u7406", "aria-busy": busy, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("strong", { "aria-label": "\u826F\u54C1\u6765\u6E90\u6458\u8981", children: [
            dataset.reference_mode === "automatic" ? "\u81EA\u52A8\u6765\u6E90" : "\u4EBA\u5DE5\u9009\u5B9A",
            " \xB7 ",
            dataset.reference_sample_ids.length,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy || dataset.reference_mode === "automatic", onClick: () => void save(), children: "\u6062\u590D\u81EA\u52A8\u6765\u6E90" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy || loading, onClick: () => setSelection({ scope, ids: items.map((item) => item.sample_id) }), children: "\u9009\u62E9\u5F53\u524D\u9875" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy || loading || !total, onClick: () => void selectAll(), children: "\u9009\u62E9\u7B5B\u9009\u5168\u90E8" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { children: [
            "\u5DF2\u9009 ",
            chosen.length,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy || !chosen.length, onClick: () => setSelection({ scope, ids: [] }), children: "\u53D6\u6D88\u9009\u62E9" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { className: "iad-primary", disabled: busy || !chosen.length, onClick: () => void save(true), children: "\u52A0\u5165\u826F\u54C1\u6765\u6E90" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { disabled: busy || !chosen.length, onClick: () => void save(false), children: "\u79FB\u51FA\u826F\u54C1\u6765\u6E90" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "iad-muted", children: "\u5019\u9009\u6765\u6E90\uFF0C\u975E\u4EBA\u5DE5\u88C1\u51B3" })
        ] })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { role: "status", children: notice }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "iad-grid", children: items.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
      !loading && !items.length && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "iad-empty", children: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6837\u672C\u3002" }),
      pagination
    ] });
  }

  // src/client/components/SampleInspector.tsx
  var import_react28 = __require("react");

  // src/client/components/ImageViewer.tsx
  var import_react22 = __require("react");

  // src/client/components/ImageCanvas.tsx
  var import_react21 = __require("react");

  // src/client/components/MediaLoad.tsx
  var import_react17 = __require("react");
  var import_jsx_runtime17 = __require("react/jsx-runtime");
  var RetryContext = (0, import_react17.createContext)(0);
  function MediaLoad({ children, className = "", primarySource }) {
    const [attempt, setAttempt] = (0, import_react17.useState)(0);
    const [failures, setFailures] = (0, import_react17.useState)(/* @__PURE__ */ new Map());
    const [settledSource, setSettledSource] = (0, import_react17.useState)("");
    const loading = !!primarySource && primarySource !== settledSource;
    function capture(event) {
      const target = event.target;
      const source = target.getAttribute?.("data-media-source");
      if (!source) return;
      if (source === primarySource) setSettledSource(source);
      setFailures((previous) => {
        const next = new Map(previous);
        if (event.type === "error") next.set(source, target.getAttribute("data-media-label") || target.getAttribute("alt") || "\u56FE\u50CF");
        else next.delete(source);
        return next;
      });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(RetryContext.Provider, { value: attempt, children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: `iad-media-load ${className}`, "aria-busy": primarySource ? loading : void 0, onErrorCapture: capture, onLoadCapture: capture, children: [
      children,
      loading && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "iad-media-loading", role: "status", children: "\u6B63\u5728\u52A0\u8F7D\u56FE\u50CF\u2026" }),
      !!failures.size && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "iad-media-error", role: "alert", children: [
        [...new Set(failures.values())].map((label) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { children: [
          label,
          "\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u8BF7\u68C0\u67E5\u8D44\u6E90\u662F\u5426\u5B58\u5728\u6216\u5B8C\u6574\u3002"
        ] }, label)),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { type: "button", "aria-label": "\u91CD\u65B0\u52A0\u8F7D\u56FE\u50CF", onClick: () => {
          setSettledSource("");
          setFailures(/* @__PURE__ */ new Map());
          setAttempt((previous) => previous + 1);
        }, children: "\u91CD\u65B0\u52A0\u8F7D" })
      ] })
    ] }) });
  }
  function useRetryUrl(source) {
    const attempt = (0, import_react17.useContext)(RetryContext);
    if (!attempt) return source;
    const url = new URL(source, window.location.href);
    url.searchParams.set("_retry", String(attempt));
    return url.href;
  }
  function MediaImage({ src = "", ...props }) {
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("img", { ...props, src: useRetryUrl(src), "data-media-source": src });
  }
  function MediaMask({ href = "", ...props }) {
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("image", { ...props, href: useRetryUrl(href), "data-media-source": href, "data-media-label": "\u6807\u6CE8\u50CF\u7D20" });
  }

  // src/client/components/AnnotationLayer.tsx
  var import_react18 = __require("react");
  var import_jsx_runtime18 = __require("react/jsx-runtime");
  function AnnotationLayer({ source }) {
    const namespace = (0, import_react18.useId)();
    const [width, height] = source.kind === "sample" ? [source.sample.width, source.sample.height] : source.analysis.overview.original_size;
    const annotations = source.kind === "sample" ? source.annotations.filter((annotation) => annotation.geometry_status !== "INVALID") : [];
    const masks = source.kind === "sample" ? annotations.filter((annotation) => annotation.annotation_type === "mask").map((annotation) => ({
      id: annotation.annotation_id,
      bbox: [0, 0, width, height],
      url: source.maskUrls?.[annotation.annotation_id] || `${mediaUrl(source.sample, "mask")}?${new URLSearchParams({ annotation_id: annotation.annotation_id, sha256: annotation.mask_sha256 || "" })}`
    })) : source.analysis.auxiliary_evidence.filter((image) => image.representation === "annotation_mask").map((image) => ({
      id: image.evidence_id,
      bbox: image.crop_bbox,
      url: auditEvidenceUrl(source.suggestionId, image)
    }));
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("svg", { className: "iad-annotation-layer", viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none", "aria-label": "Labelme \u6807\u6CE8", children: [
      !!masks.length && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("g", { className: "iad-annotation-mask", children: masks.map((mask, index3) => {
        const maskId = `${namespace}-mask-${index3}`;
        const [x1, y1, x2, y2] = mask.bbox;
        return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("mask", { id: maskId, x: 0, y: 0, width, height, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", style: { maskType: "luminance" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MediaMask, { href: mask.url, x: x1, y: y1, width: x2 - x1, height: y2 - y1, preserveAspectRatio: "none", style: { imageRendering: "pixelated" } }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("rect", { x: 0, y: 0, width, height, mask: `url(#${maskId})` })
        ] }, mask.id);
      }) }),
      annotations.map((annotation) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("g", { children: [
        annotation.annotation_type !== "mask" && (annotation.polygon ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("polygon", { points: annotation.polygon.map((point) => point.join(",")).join(" ") }) : annotation.bbox && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("rect", { x: annotation.bbox[0], y: annotation.bbox[1], width: annotation.bbox[2] - annotation.bbox[0], height: annotation.bbox[3] - annotation.bbox[1] })),
        annotation.bbox && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("text", { x: annotation.bbox[0], y: Math.max(12, annotation.bbox[1] - 4), children: annotation.raw_label })
      ] }, annotation.annotation_id))
    ] });
  }

  // src/client/components/AuditEvidence.tsx
  var import_jsx_runtime19 = __require("react/jsx-runtime");
  function AuditEvidence({ analysis, ids, label, onEvidence, selectedId }) {
    const images = auditImageIndex(analysis);
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "iad-actions", children: ids.map((id, index3) => {
      const image = images.get(id);
      return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
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
  var import_react19 = __require("react");
  var import_jsx_runtime20 = __require("react/jsx-runtime");
  var priorities = { high: "\u4F18\u5148\u590D\u6838", medium: "\u968F\u540E\u590D\u6838", low: "\u8865\u5145\u6838\u5BF9" };
  function AuditFindings({ analysis, onLocate, onEvidence }) {
    const [expanded, setExpanded] = (0, import_react19.useState)(false);
    if (!analysis.findings.length) return null;
    const visible = expanded ? analysis.findings : analysis.findings.slice(0, 3);
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("section", { className: "iad-findings", "aria-label": "\u4F18\u5148\u590D\u6838\u7591\u70B9", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("h3", { children: [
        "\u91CD\u70B9\u7591\u70B9 \xB7 ",
        analysis.findings.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("ol", { children: visible.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("li", { "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { children: priorities[finding.priority] }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("button", { onClick: () => onLocate(finding), title: "\u5728\u5168\u56FE\u5B9A\u4F4D", children: [
          finding.location.description,
          " \xB7 ",
          finding.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("details", { className: "iad-analysis", children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("summary", { children: "\u4F9D\u636E\u4E0E\u6B63\u5E38\u89E3\u91CA" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(FindingExplanation, { finding }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, onEvidence: (image) => onEvidence(image, finding) })
        ] })
      ] }, finding.finding_id)) }),
      analysis.findings.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u5176\u4ED6\u7591\u70B9" : `\u67E5\u770B\u5176\u4F59 ${analysis.findings.length - 3} \u9879` })
    ] });
  }
  function FindingExplanation({ finding }) {
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("p", { children: [
        "\u5F02\u5E38\u5047\u8BBE\uFF1A",
        finding.hypothesis
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("p", { children: [
        "\u6B63\u5E38\u89E3\u91CA\uFF1A",
        finding.normal_explanation
      ] }),
      !!finding.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "iad-muted", children: finding.limitations.join("\uFF1B") })
    ] });
  }

  // src/client/components/InspectionQuestion.tsx
  var import_react20 = __require("react");
  var import_jsx_runtime21 = __require("react/jsx-runtime");
  function InspectionQuestion({ inspection, selection, transform }) {
    const { workspace } = useWorkspace();
    const [expanded, setExpanded] = (0, import_react20.useState)(false);
    const [question, setQuestion] = (0, import_react20.useState)("");
    const [busy, setBusy] = (0, import_react20.useState)(false);
    const [error2, setError] = (0, import_react20.useState)("");
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
    return expanded ? /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("form", { className: "iad-inspection-question", onSubmit: send, "aria-label": "\u5411 Agent \u8FFD\u95EE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("label", { className: "iad-field", children: [
        "\u8FFD\u95EE\u5185\u5BB9",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("textarea", { "aria-label": "\u8FFD\u95EE\u5185\u5BB9", rows: 3, value: question, disabled: busy, onChange: (event) => setQuestion(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { className: "iad-muted", children: "\u643A\u5E26\u5F53\u524D\u7591\u70B9\u3001\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u5B9E\u9645\u56FE\u50CF\u5F15\u7528\u3002" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "iad-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { type: "submit", className: "iad-primary", disabled: busy, children: busy ? "\u6B63\u5728\u63D0\u4EA4\u2026" : "\u53D1\u9001\u5230\u4F1A\u8BDD" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { type: "button", disabled: busy, onClick: () => setExpanded(false), children: "\u53D6\u6D88" })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { onClick: () => setExpanded(true), children: "\u5411 Agent \u8FFD\u95EE" });
  }

  // src/client/components/InspectionEvidence.tsx
  var import_jsx_runtime22 = __require("react/jsx-runtime");
  function InspectionOverlay({ inspection, selectedId, hoveredIds, regions, finding }) {
    const { analysis } = inspection;
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("svg", { className: "iad-roi-layer", viewBox: `0 0 ${analysis.overview.original_size.join(" ")}`, preserveAspectRatio: "none", "aria-label": "\u5BA1\u8BA1\u533A\u57DF", children: regions.map((region) => {
        const [x1, y1, x2, y2] = region.crop_bbox;
        return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("g", { "data-evidence-id": region.image.evidence_id, "data-locked": selectedId === region.image.evidence_id, className: hoveredIds.includes(region.image.evidence_id) ? "is-hovered" : "", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("rect", { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }) }, region.image.evidence_id);
      }) }),
      finding?.location.scope === "local" && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        "svg",
        {
          className: "iad-finding-layer",
          "data-finding-id": finding.finding_id,
          viewBox: `0 0 ${analysis.overview.original_size.join(" ")}`,
          preserveAspectRatio: "none",
          "aria-label": finding.location.description,
          children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("rect", { x: finding.location.bbox[0], y: finding.location.bbox[1], width: finding.location.bbox[2] - finding.location.bbox[0], height: finding.location.bbox[3] - finding.location.bbox[1] })
        }
      )
    ] });
  }
  function InspectionPanel({ inspection, selection, onSelect, choices, transform }) {
    const { analysis, reference } = inspection;
    const { workspace, state } = useWorkspace();
    const suggestionId = reference.suggestion_id;
    const { finding, evidence, region } = resolveInspection(analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const related = region ? analysis.findings.filter((finding2) => finding2.evidence_ids.includes(region.image.evidence_id)) : [];
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("aside", { className: "iad-inspection-panel", "aria-label": "\u5168\u56FE\u4E0E ROI \u7EFC\u5408\u5206\u6790", children: [
      inspection.historical && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { role: "status", children: "\u5386\u53F2\u5EFA\u8BAE \xB7 \u4FDD\u7559\u8BE5\u6B21\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u56FE\u50CF\u8BC1\u636E\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(InspectionQuestion, { inspection, selection, transform }),
      !!analysis.consistency?.results.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { "aria-label": "\u51BB\u7ED3\u4E00\u81F4\u6027\u8BC1\u636E", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: "\u6570\u636E\u4E00\u81F4\u6027\u8BC1\u636E" }),
        analysis.consistency.results.map((result) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { onClick: () => workspace.openLocation({
          pageId: "industrial-consistency",
          tab: "search",
          query: { kind: "sample", sample_id: reference.sample_id },
          evidenceId: result.evidence_id,
          resultId: result.result_id,
          returnPage: state.pageId === "industrial-consistency" ? void 0 : state.pageId
        }), children: "\u67E5\u770B\u6BD4\u8F83\u8BC1\u636E" }, result.result_id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h2", { children: "\u7EFC\u5408\u5EFA\u8BAE" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: analysis.conclusion.description }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "iad-muted", children: [
        "\u4F4D\u7F6E\uFF1A",
        analysis.conclusion.position_analysis,
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("br", {}),
        "\u5149\u7167\uFF1A",
        analysis.conclusion.illumination_analysis
      ] }),
      !!analysis.findings.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { className: "iad-field", children: [
        "\u5BA1\u8BA1\u7591\u70B9",
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u7591\u70B9", value: finding?.finding_id || "", onChange: (event) => onSelect(event.target.value ? { kind: "finding", id: event.target.value } : null), children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("option", { value: "", children: "\u9009\u62E9\u7591\u70B9" }),
          analysis.findings.map((item) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("option", { value: item.finding_id, children: [
            item.location.scope === "global" ? "\u5168\u56FE" : "\u5C40\u90E8",
            " \xB7 ",
            item.location.description,
            " \xB7 ",
            item.description
          ] }, item.finding_id))
        ] })
      ] }),
      finding && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-inspection-finding", "data-finding-id": finding.finding_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("h3", { children: [
          finding.location.scope === "global" ? "\u5168\u56FE\u5173\u7CFB" : "\u5C40\u90E8\u7591\u70B9",
          " \xB7 ",
          finding.location.description
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: finding.description }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(FindingExplanation, { finding }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: finding.review_action }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(AuditEvidence, { analysis, ids: finding.evidence_ids, label: finding.description, selectedId: evidence?.evidence_id || region?.image.evidence_id, onEvidence: (image) => onSelect({ kind: "evidence", id: image.evidence_id, findingId: finding.finding_id }) })
      ] }),
      !!choices.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { role: "group", "aria-label": "\u91CD\u53E0\u533A\u57DF", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: "\u9009\u62E9\u91CD\u53E0\u533A\u57DF" }),
        analysis.regions.filter((item) => choices.includes(item.image.evidence_id)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("button", { onClick: () => onSelect({ kind: "evidence", id: item.image.evidence_id }), children: [
          item.label,
          " \xB7 ",
          item.crop_bbox.join(", ")
        ] }, item.image.evidence_id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "iad-roi-list", "aria-label": "\u5BA1\u8BA1 ROI", children: analysis.regions.map((item, index3) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("button", { "aria-label": `\u5B9A\u4F4D ROI ${index3 + 1}`, "aria-pressed": selectedId === item.image.evidence_id, onClick: () => onSelect({ kind: "evidence", id: item.image.evidence_id }), children: [
        "ROI ",
        index3 + 1,
        " \xB7 ",
        item.label
      ] }, item.image.evidence_id)) }),
      region ? /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-inspection-region", "data-evidence-id": region.image.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("h3", { children: [
          regionSources[region.source],
          " \xB7 ",
          region.label
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(MediaImage, { src: auditEvidenceUrl(suggestionId, region.image), alt: "\u6240\u9009 ROI \u7684\u5B9E\u9645\u9001\u6A21\u88C1\u56FE", "data-media-label": "ROI \u88C1\u56FE" }) }, region.image.evidence_id),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("dt", { children: "\u539F\u56FE\u533A\u57DF" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("dd", { children: region.bbox.join(", ") }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("dt", { children: "\u5916\u6269\u88C1\u56FE" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("dd", { children: region.crop_bbox.join(", ") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: region.observation.description }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
          "\u4F4D\u7F6E\uFF1A",
          region.observation.position_analysis
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
          "\u5149\u7167\uFF1A",
          region.observation.illumination_analysis
        ] }),
        !finding && !!related.length && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "iad-related-findings iad-actions", "aria-label": "ROI \u5173\u8054\u7591\u70B9", children: related.map((item) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("button", { "data-finding-id": item.finding_id, onClick: () => onSelect({ kind: "finding", id: item.finding_id }), children: [
          item.location.description,
          " \xB7 ",
          item.description
        ] }, item.finding_id)) })
      ] }) : !evidence && !finding && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "iad-muted", children: "\u70B9\u9009\u56FE\u4E2D\u533A\u57DF\u6216 ROI \u6309\u94AE\u67E5\u770B\u5B9E\u9645\u88C1\u56FE\u3002" }),
      evidence && evidence.representation !== "raw" && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-inspection-mask", "data-evidence-id": evidence.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: evidence.representation === "annotation_mask" ? "\u6807\u6CE8\u5B9A\u4F4D\u56FE" : "\u6807\u6CE8\u53E0\u52A0\u56FE" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(MediaImage, { src: auditEvidenceUrl(suggestionId, evidence), alt: "\u6240\u9009\u6807\u6CE8\u7684\u5B9E\u9645\u9001\u6A21\u56FE", "data-media-label": "\u6807\u6CE8\u8BC1\u636E" }) }, evidence.evidence_id),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
          "\u539F\u56FE\u5750\u6807\uFF1A",
          evidence.crop_bbox.join(", ")
        ] })
      ] }),
      evidence?.role === "overview" && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("section", { className: "iad-inspection-overview", "data-evidence-id": evidence.evidence_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: analysis.global_view.description }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
          "\u4F4D\u7F6E\uFF1A",
          analysis.global_view.position_analysis
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
          "\u5149\u7167\uFF1A",
          analysis.global_view.illumination_analysis
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("summary", { children: "\u7248\u672C\u4E0E\u8BC1\u636E\u8303\u56F4" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("code", { children: analysis.normal_version_id }) }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { children: [
          "\u5B9E\u9645\u7EC6\u770B ",
          analysis.coverage.inspected_regions,
          " / ",
          analysis.coverage.planned_regions,
          " \u4E2A ROI"
        ] }),
        analysis.coverage.missing.map((item, index3) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: item }, index3))
      ] })
    ] });
  }

  // src/client/components/ImageCanvas.tsx
  var import_jsx_runtime23 = __require("react/jsx-runtime");
  var emptyHover = { ids: [], dismissed: false, x: 0, y: 0 };
  var minScale = 0.02;
  var maxScale = 16;
  function AnnotatedImage({ image, visible = true, onLoad }) {
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-image-frame", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(MediaImage, { src: image.src, alt: image.title, width: image.width, height: image.height, "data-media-label": "\u56FE\u50CF", draggable: false, onLoad }),
      visible && image.annotationLayer && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(AnnotationLayer, { source: image.annotationLayer })
    ] });
  }
  function ImageCanvas({ image, onClose, navigation: navigation2, embedded = false, onExpand, context, closeLabel, control, focusRegion, overlay }) {
    const { workspace } = useWorkspace();
    const reference = image.inspection?.reference;
    const source = JSON.stringify(reference ? [reference.dataset_id, reference.sample_id, reference.suggestion_id] : [image.src]);
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(CanvasViewport, { image, onClose, navigation: navigation2, embedded, context, closeLabel, onExpand, control, focusRegion, overlay, savedView: workspace.imageView(source), onRemember: (view) => workspace.rememberImageView(source, view) }, JSON.stringify([source, image.src]));
  }
  function CanvasViewport({ image, onClose, navigation: navigation2, savedView, onRemember, embedded, onExpand, context, closeLabel, control, focusRegion, overlay }) {
    const viewport = (0, import_react21.useRef)(null);
    const world = (0, import_react21.useRef)(null);
    const layerMenu = (0, import_react21.useRef)(null);
    const inspection = image.inspection;
    const [selection, setSelection] = (0, import_react21.useState)(() => inspection ? image.initialSelection === void 0 ? savedView?.selection || null : image.initialSelection : null);
    const initialTransform = image.initialTransform || (image.initialSelection === void 0 || JSON.stringify(image.initialSelection) === JSON.stringify(savedView?.selection) ? savedView?.transform : void 0);
    const [hover, setHover] = (0, import_react21.useState)(emptyHover);
    const hintId = (0, import_react21.useId)();
    const [auxiliary, setAuxiliary] = (0, import_react21.useState)(context ? "context" : "inspection");
    const [showEvidence, setShowEvidence] = (0, import_react21.useState)(!!image.initialSelection);
    const [choices, setChoices] = (0, import_react21.useState)([]);
    const { finding, evidence, region } = resolveInspection(inspection?.analysis, selection);
    const selectedId = region?.image.evidence_id || "";
    const [size4, setSize] = (0, import_react21.useState)({ width: image.width || 0, height: image.height || 0 });
    const [bounds, setBounds] = (0, import_react21.useState)({ width: 0, height: 0 });
    const [localView, setLocalView] = (0, import_react21.useState)({ scale: 0, x: 0, y: 0 });
    const focusedSelection = (0, import_react21.useRef)();
    const restoredTransform = (0, import_react21.useRef)(false);
    const [layers, setLayers] = (0, import_react21.useState)(() => {
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
    (0, import_react21.useEffect)(() => {
      localStorage.setItem("iad.image-layers", JSON.stringify(layers));
    }, [layers]);
    const drag = (0, import_react21.useRef)(null);
    const fit = size4.width && size4.height ? Math.min(bounds.width / size4.width, bounds.height / size4.height) : 1;
    const view = control ? { scale: control.transform.zoom * fit, x: control.transform.x, y: control.transform.y } : localView;
    function setView(update) {
      if (control) control.onChange((previous) => {
        const current = { scale: previous.zoom * fit, x: previous.x, y: previous.y };
        const next = typeof update === "function" ? update(current) : update;
        return { zoom: next.scale && fit ? next.scale / fit : 0, x: next.x, y: next.y };
      });
      else setLocalView(update);
    }
    const scale = view.scale || fit;
    const remembered = (0, import_react21.useRef)({ onRemember, view: { selection, transform: { zoom: 0, x: 0, y: 0 } } });
    remembered.current = { onRemember, view: { selection, transform: { zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y } } };
    (0, import_react21.useEffect)(() => () => remembered.current.onRemember(remembered.current.view), []);
    (0, import_react21.useEffect)(() => {
      if (!focusRegion || !bounds.width || !size4.width) return;
      const [x1, y1, x2, y2] = focusRegion.bbox.map((value, index3) => value * (index3 % 2 ? size4.height / (image.height || size4.height) : size4.width / (image.width || size4.width)));
      const next = Math.min(maxScale, bounds.width / Math.max(1, (x2 - x1) * 1.6), bounds.height / Math.max(1, (y2 - y1) * 1.6));
      setView({ scale: next, x: (size4.width / 2 - (x1 + x2) / 2) * next, y: (size4.height / 2 - (y1 + y2) / 2) * next });
    }, [focusRegion?.id, bounds.width, bounds.height, size4.width, size4.height]);
    (0, import_react21.useLayoutEffect)(() => {
      const element = viewport.current;
      const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    (0, import_react21.useEffect)(() => {
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
    (0, import_react21.useEffect)(() => {
      const element = viewport.current;
      const wheel = (event) => {
        event.preventDefault();
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
        zoomBy(Math.exp(-event.deltaY * 15e-4), x, y);
      };
      element.addEventListener("wheel", wheel, { passive: false });
      return () => element.removeEventListener("wheel", wheel);
    }, [fit, !!control]);
    const fixed = [0, 1, 1.5, 2].includes(view.scale);
    const closeButton = onClose && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { onClick: () => {
      onRemember(remembered.current.view);
      onClose();
    }, children: closeLabel || "\u5173\u95ED" });
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: embedded ? "iad-image-canvas iad-embedded-canvas" : "iad-image-canvas iad-lightbox", onKeyDown: (event) => {
      if (navigation2 && ["PageUp", "PageDown"].includes(event.key) && !event.target.closest("input,select,textarea")) {
        event.preventDefault();
        event.stopPropagation();
        const offset4 = event.key === "PageUp" ? -1 : 1;
        if (!navigation2.busy && (offset4 === -1 ? navigation2.previous : navigation2.next)) navigation2.move(offset4);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-lightbox-toolbar", children: [
        context && closeButton,
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-viewer-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("strong", { title: image.title, children: image.title }),
          image.caption && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("small", { children: image.caption })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-viewer-zoom", role: "group", "aria-label": "\u56FE\u50CF\u7F29\u653E", children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "iad-icon-button", "aria-label": "\u7F29\u5C0F", title: "\u7F29\u5C0F", disabled: scale <= minScale, onClick: () => zoomBy(0.5), children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("path", { d: "M5 12h14" }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("select", { "aria-label": "\u7F29\u653E", value: fixed ? view.scale : "custom", onChange: (e) => {
            const next = Number(e.target.value);
            if (next) zoomBy(next / scale);
            else {
              setView({ scale: 0, x: 0, y: 0 });
              setHover(emptyHover);
            }
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: 0, children: "\u9002\u5E94\u7A97\u53E3" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: 1, children: "100%" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: 1.5, children: "150%" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: 2, children: "200%" }),
            !fixed && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("option", { value: "custom", children: [
              Math.round(scale * 100),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "iad-icon-button", "aria-label": "\u653E\u5927", title: "\u653E\u5927", disabled: scale >= maxScale, onClick: () => zoomBy(2), children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("path", { d: "M5 12h14M12 5v14" }) }) })
        ] }),
        (image.annotationLayer || inspection) && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "iad-icon-button", title: layers.annotation ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-label": layers.annotation ? "\u9690\u85CF\u6807\u6CE8" : "\u663E\u793A\u6807\u6CE8", "aria-pressed": layers.annotation, onClick: () => setLayers((previous) => ({ ...previous, annotation: !previous.annotation })), children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("svg", { viewBox: "0 0 24 24", width: "21", height: "21", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
          !layers.annotation && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("path", { d: "m3 3 18 18" })
        ] }) }),
        inspection && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(FloatingMenu, { detailsRef: layerMenu, className: "iad-layer-menu", label: "\u53EF\u89C6\u56FE\u5C42", summary: "\u56FE\u5C42", children: Object.keys(regionSources).map((source) => {
          const label = { annotation: "\u6807\u6CE8", model: "\u6A21\u578B\u5019\u9009", coverage: "\u7EC6\u8282\u8986\u76D6" }[source];
          return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
        navigation2 && embedded && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-viewer-navigation", role: "group", "aria-label": "\u56FE\u50CF\u5207\u6362", children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "iad-image-step", disabled: navigation2.busy || !navigation2.previous, onClick: () => navigation2.move(-1), children: "\u524D\u4E00\u5F20" }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "iad-image-step", disabled: navigation2.busy || !navigation2.next, onClick: () => navigation2.move(1), children: "\u540E\u4E00\u5F20" }),
          navigation2.busy && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { role: "status", children: "\u6B63\u5728\u5207\u6362\u56FE\u50CF\u2026" })
        ] }),
        navigation2 && !embedded && navigation2.busy && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { className: "iad-visually-hidden", role: "status", children: "\u6B63\u5728\u5207\u6362\u56FE\u50CF\u2026" }),
        onExpand && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "iad-icon-button", "aria-label": "\u5168\u5C4F\u68C0\u89C6", title: "\u5168\u5C4F\u68C0\u89C6", onClick: () => {
          onRemember(remembered.current.view);
          onExpand(remembered.current.view);
        }, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("svg", { width: "21", height: "21", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("path", { d: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" }) }) }),
        !context && closeButton
      ] }),
      navigation2?.error && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { role: "alert", className: "iad-error", children: navigation2.error }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: `iad-viewer-body ${inspection && !embedded ? "has-inspection" : ""} ${context ? "has-context" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(MediaLoad, { className: "iad-viewer-media", primarySource: image.src, children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-viewer-world", ref: world, "data-scale": scale, style: {
                  width: size4.width,
                  height: size4.height,
                  "--iad-view-scale": scale,
                  transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})`
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(AnnotatedImage, { image: { ...image, ...size4 }, visible: layers.annotation, onLoad: (event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) }),
                  overlay,
                  inspection && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(InspectionOverlay, { inspection, selectedId, hoveredIds: hover.ids, regions, finding: layers.model ? finding : void 0 })
                ] }),
                hint && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { id: hintId, role: "tooltip", className: "iad-roi-hint", style: { left: hover.x, top: hover.y + (hover.y < bounds.height / 2 ? 1 : 0), transform: hover.y >= bounds.height / 2 ? "translateY(-100%)" : void 0 }, onPointerMove: (event) => event.stopPropagation(), onPointerDown: (event) => event.stopPropagation(), children: [
                  regionSources[hint.source],
                  " \xB7 ",
                  hint.label.slice(0, 80),
                  hint.label.length > 80 ? "\u2026" : "",
                  hoveredRegions.length > 1 ? ` \xB7 ${hoveredRegions.length} \u4E2A\u91CD\u53E0\u533A\u57DF` : ""
                ] })
              ]
            }
          ),
          !embedded && navigation2 && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("nav", { className: "iad-viewer-edge-nav", "aria-label": "\u56FE\u7247\u5207\u6362", children: [-1, 1].map((offset4) => /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
            "button",
            {
              type: "button",
              className: "iad-viewer-edge-button",
              "aria-label": offset4 === -1 ? "\u4E0A\u4E00\u5F20\u56FE\u50CF" : "\u4E0B\u4E00\u5F20\u56FE\u50CF",
              title: offset4 === -1 ? "\u4E0A\u4E00\u5F20" : "\u4E0B\u4E00\u5F20",
              disabled: navigation2.busy || !(offset4 === -1 ? navigation2.previous : navigation2.next),
              onClick: () => navigation2.move(offset4),
              children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { className: "iad-viewer-edge-disc", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("path", { d: offset4 === -1 ? "m15 4-8 8 8 8" : "m9 4 8 8-8 8" }) }) })
            },
            offset4
          )) }),
          context && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { className: "iad-viewer-hint", children: "\u62D6\u52A8\u5E73\u79FB \xB7 \u6EDA\u8F6E\u7F29\u653E \xB7 PgUp/PgDn \u5207\u6362" })
        ] }, image.src),
        (context || inspection && !embedded) && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-viewer-aux", children: [
          context && inspection && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "iad-tabs", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: auxiliary === "context" ? "active" : "", onClick: () => setAuxiliary("context"), children: "\u56FE\u50CF\u8BC1\u636E" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: auxiliary === "inspection" ? "active" : "", onClick: () => setAuxiliary("inspection"), children: "\u68C0\u89C6\u5206\u6790" })
          ] }),
          context && auxiliary === "context" && context,
          inspection && (!context || auxiliary === "inspection") && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(InspectionPanel, { inspection, selection, choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })
        ] }),
        inspection && embedded && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("details", { className: "iad-embedded-evidence", open: showEvidence, onToggle: (event) => setShowEvidence(event.currentTarget.open), children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("summary", { children: "\u8BC1\u636E\u4E0E\u5206\u6790" }),
          "    ",
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(InspectionPanel, { inspection, selection, choices, onSelect: select, transform: () => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y }) })
        ] })
      ] })
    ] });
  }

  // src/client/components/ImageViewer.tsx
  var import_jsx_runtime24 = __require("react/jsx-runtime");
  function ImageViewer({
    image,
    onClose,
    navigation: navigation2,
    collection
  }) {
    const [index3, setIndex] = (0, import_react22.useState)(collection?.index || 0);
    const current = collection?.images[index3];
    const context = collection && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("aside", { className: "iad-viewer-context", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h3", { children: "\u5F53\u524D\u65B9\u5411" }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { children: collection.title }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { children: collection.instruction }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("h3", { children: [
          "\u56FE\u50CF\u8BC1\u636E \xB7 ",
          collection.images.length
        ] }),
        [...new Set(collection.images.map((item) => item.group))].map(
          (group) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "iad-viewer-evidence-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("h4", { children: [
              group,
              " \xB7",
              " ",
              collection.images.filter((item) => item.group === group).length
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(MediaLoad, { className: "iad-viewer-thumbnails", children: collection.images.filter((item) => item.group === group).map((item) => {
              const position = collection.images.indexOf(item);
              return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
                "button",
                {
                  "aria-label": `\u5207\u6362\u8BC1\u636E ${item.label}`,
                  "aria-current": index3 === position,
                  onClick: () => setIndex(position),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                      MediaImage,
                      {
                        src: item.image.src,
                        alt: item.label,
                        loading: "lazy"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: item.label })
                  ]
                },
                item.id
              );
            }) })
          ] }, group)
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("summary", { children: "\u56FE\u50CF\u4FE1\u606F" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("dt", { children: "\u6587\u4EF6\u540D" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("dd", { children: current?.image.title }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("dt", { children: "\u8BC1\u636E ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("dd", { children: current?.id }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("dt", { children: "\u539F\u59CB\u5C3A\u5BF8" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("dd", { children: [
            current?.originalSize[0],
            " \xD7 ",
            current?.originalSize[1]
          ] })
        ] })
      ] })
    ] });
    const scopedNavigation = collection ? {
      previous: index3 > 0,
      next: index3 < collection.images.length - 1,
      busy: false,
      error: "",
      move: (offset4) => setIndex((value) => value + offset4)
    } : navigation2;
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
      Modal,
      {
        title: "\u539F\u56FE\u68C0\u89C6\u5668",
        className: "iad-viewer-dialog",
        header: false,
        onClose,
        children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          ImageCanvas,
          {
            image: current ? {
              ...current.image,
              caption: `${current.label} \xB7 ${index3 + 1} / ${collection.images.length}`
            } : image,
            onClose,
            navigation: scopedNavigation,
            context,
            closeLabel: collection ? "\u8FD4\u56DE\u65B9\u5411\u8BE6\u60C5" : void 0
          }
        )
      }
    );
  }

  // src/client/components/ReviewWorkspace.tsx
  var import_react23 = __require("react");
  var import_jsx_runtime25 = __require("react/jsx-runtime");
  function ReviewWorkspace({ queue, filters, image, decision, information }) {
    const [panel, setPanel] = (0, import_react23.useState)(null);
    return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("section", { className: "iad-review-focused", "aria-label": "\u4E13\u6CE8\u590D\u6838", children: [
      filters,
      /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "iad-review-tools", children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("button", { className: "iad-queue-trigger", onClick: () => setPanel("queue"), children: "\u6253\u5F00\u590D\u6838\u961F\u5217" }),
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("button", { className: "iad-decision-trigger", disabled: !decision, onClick: () => setPanel("decision"), children: "\u6253\u5F00\u4EBA\u5DE5\u88C1\u51B3" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "iad-review-columns", children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("aside", { className: "iad-review-queue-slot", "aria-label": "\u5F85\u590D\u6838\u6837\u672C", children: panel !== "queue" && queue }),
        /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "iad-review-center", children: [
          image,
          /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("details", { className: "iad-review-information", children: [
            /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("summary", { children: "\u6837\u672C\u4FE1\u606F\u4E0E\u6A21\u578B\u89C2\u5BDF" }),
            information
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("aside", { className: "iad-review-decision-slot", "aria-label": "\u4EBA\u5DE5\u88C1\u51B3\u9762\u677F", children: panel !== "decision" && decision })
      ] }),
      panel && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Modal, { title: panel === "queue" ? "\u590D\u6838\u961F\u5217" : "\u4EBA\u5DE5\u88C1\u51B3", className: "iad-review-drawer", onClose: () => setPanel(null), children: panel === "queue" ? queue : decision })
    ] });
  }

  // src/client/components/KnowledgeEvidenceGallery.tsx
  var import_react24 = __require("react");
  var import_jsx_runtime26 = __require("react/jsx-runtime");
  function KnowledgeEvidenceGallery({ versionId, items, onOpen }) {
    const scope = JSON.stringify([versionId, items.map((item) => item.image.evidence_id)]);
    const [position, setPosition] = (0, import_react24.useState)({ scope: "", page: 1 });
    const page = position.scope === scope ? Math.min(position.page, Math.max(1, Math.ceil(items.length / 10))) : 1;
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(import_jsx_runtime26.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "iad-knowledge-evidence iad-reference-grid", children: items.slice((page - 1) * 10, page * 10).map(({ image }) => {
        const src = `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(image.evidence_id)}`;
        return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("button", { title: "\u653E\u5927\u51BB\u7ED3\u8BC1\u636E", onClick: () => onOpen({ src, title: `${image.role} \xB7 ${image.representation} \xB7 ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("img", { src, alt: `${image.role} \xB7 ${image.representation}`, loading: "lazy" }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("small", { children: [
            image.role,
            " \xB7 ",
            image.representation
          ] })
        ] }, image.evidence_id);
      }) }),
      !items.length && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("p", { className: "iad-muted", children: "\u672A\u63D0\u4F9B\u6B64\u7EC4\u8BC1\u636E\u3002" }),
      items.length > 10 && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(Pagination, { total: items.length, page, size: 10, unit: "\u9879\u8BC1\u636E", onPage: (page2) => setPosition({ scope, page: page2 }) })
    ] });
  }

  // src/client/components/DatasetKnowledge.tsx
  var import_jsx_runtime27 = __require("react/jsx-runtime");
  var statuses = { supported: "\u6709\u8BC1\u636E\u652F\u6301", provisional: "\u5F85\u9A8C\u8BC1", conflicted: "\u5B58\u5728\u77DB\u76FE" };
  function DatasetKnowledge({ knowledge }) {
    return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "iad-profile", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: knowledge.kind === "normal" ? "\u826F\u54C1\u77E5\u8BC6" : "\u4E0D\u826F\u77E5\u8BC6" }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { children: knowledge.summary }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("small", { className: "iad-muted", children: [
        knowledge.version_id,
        " \xB7 ",
        knowledge.sources.length,
        " \u5F20\u6765\u6E90 \xB7 ",
        knowledge.checks.length,
        " \u9879\u5224\u636E"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("summary", { children: "\u68C0\u67E5\u5224\u636E" }),
        knowledge.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("strong", { children: [
            check.title,
            " \xB7 ",
            statuses[check.status]
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { children: check.criterion }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("small", { className: "iad-muted", children: [
            check.subject,
            " \xB7 ",
            check.location
          ] }),
          !!check.allowed_variations.length && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("p", { children: [
            "\u5141\u8BB8\u53D8\u5316\uFF1A",
            check.allowed_variations.join("\uFF1B")
          ] }),
          !!check.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "iad-muted", children: check.limitations.join("\uFF1B") })
        ] }, check.check_id))
      ] })
    ] });
  }

  // src/client/components/RuleAssessments.tsx
  var import_jsx_runtime28 = __require("react/jsx-runtime");
  var statuses2 = { normal: "\u672A\u89C1\u5F02\u5E38", anomaly: "\u53D1\u73B0\u504F\u79BB", insufficient: "\u8BC1\u636E\u4E0D\u8DB3", not_applicable: "\u4E0D\u9002\u7528" };
  function RuleAssessments({ analysis, knowledge, onEvidence }) {
    const checks = new Map(knowledge.flatMap((snapshot) => snapshot.checks.map((check) => [check.check_id, check])));
    if (!analysis.check_assessments.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("details", { className: "iad-rule-assessments iad-analysis", children: [
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("summary", { children: [
        "\u68C0\u67E5\u9879 \xB7 ",
        analysis.check_assessments.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("ol", { children: analysis.check_assessments.map((assessment) => /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("li", { "data-check-id": assessment.check_id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("strong", { children: checks.get(assessment.check_id)?.title || assessment.check_id }),
        " \xB7 ",
        statuses2[assessment.status],
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("p", { children: assessment.description }),
        !!assessment.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("p", { className: "iad-muted", children: assessment.limitations.join("\uFF1B") }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(AuditEvidence, { analysis, ids: assessment.evidence_ids, label: checks.get(assessment.check_id)?.title || "\u68C0\u67E5\u9879", onEvidence })
      ] }, assessment.check_id)) })
    ] });
  }

  // src/shared/consistency-presentation.ts
  var imageRelations = {
    EXACT: "\u50CF\u7D20\u5B8C\u5168\u76F8\u540C",
    NEAR_CANDIDATE: "\u8FD1\u91CD\u590D\u5019\u9009",
    VISUAL_REFERENCE: "\u89C6\u89C9\u53C2\u8003",
    DIFFERENT: "\u4E0D\u540C\u56FE\u50CF",
    UNCHECKED: "\u5C1A\u672A\u6838\u9A8C"
  };
  var differenceLabels = {
    QUALITY_LABEL: "\u8D28\u91CF\u6807\u7B7E\u4E0D\u540C",
    CATEGORY: "\u7C7B\u522B\u4E0D\u540C",
    GEOMETRY: "\u51E0\u4F55\u4E0D\u540C",
    ONE_SIDED_REGION: "\u5355\u4FA7\u6807\u6CE8",
    SPLIT_MERGE: "\u5B9E\u4F8B\u62C6\u5206\u6216\u5408\u5E76",
    AMBIGUOUS_MATCH: "\u5339\u914D\u6709\u6B67\u4E49",
    POLICY_UNCONFIRMED: "\u6807\u6CE8\u89C4\u8303\u672A\u786E\u8BA4",
    ANNOTATION_UNREADABLE: "\u6807\u6CE8\u4E0D\u53EF\u8BFB\u53D6"
  };

  // src/client/components/AuditConsistency.tsx
  var import_jsx_runtime29 = __require("react/jsx-runtime");
  function AuditConsistency({ record, onEvidence }) {
    const conflicts = record.results.filter((result) => result.annotation.confirmed_conflict).length;
    const pending = record.results.filter((result) => result.annotation.policy_relation === "UNKNOWN" && result.annotation.differences.length).length;
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("section", { className: "iad-info-group", "aria-label": "\u5BA1\u8BA1\u4E00\u81F4\u6027\u68C0\u67E5", "data-check-id": record.check_id, children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("h3", { children: "\u6570\u636E\u4E00\u81F4\u6027" }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { children: [
        record.mode === "exact" ? "\u7CBE\u786E\u68C0\u67E5" : record.mode === "combined" ? "\u7CBE\u786E\u4E0E\u89C6\u89C9\u68C0\u67E5" : "\u89C6\u89C9\u5019\u9009\u68C0\u67E5",
        " \xB7 ",
        { COMPLETE: "\u5DF2\u5B8C\u6210", PARTIAL: "\u90E8\u5206\u5B8C\u6210", FAILED: "\u68C0\u67E5\u5931\u8D25" }[record.status]
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { children: [
        "\u786E\u8BA4\u51B2\u7A81 ",
        conflicts,
        " \xB7 \u89C4\u8303\u5F85\u786E\u8BA4 ",
        pending,
        " \xB7 \u8BC1\u636E ",
        record.results.length
      ] }),
      record.coverage && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { className: "iad-muted", children: [
        "\u68C0\u7D22\u5E93 ",
        record.coverage.corpus.completed,
        " / ",
        record.coverage.corpus.total
      ] }),
      record.coverage && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { className: "iad-muted", children: [
        "\u6210\u5458\u6838\u9A8C ",
        record.coverage.verification.completed,
        " / ",
        record.coverage.verification.total
      ] }),
      record.reason && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("p", { className: "iad-error", children: record.reason }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("summary", { children: [
          "\u68C0\u67E5\u8BC1\u636E \xB7 ",
          record.results.length
        ] }),
        record.results.map((result) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "iad-annotation", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("span", { children: [
            imageRelations[result.verification.relation],
            " \xB7 ",
            result.annotation.confirmed_conflict ? "\u786E\u8BA4\u51B2\u7A81" : result.annotation.policy_relation === "UNKNOWN" && result.annotation.differences.length ? "\u89C4\u8303\u5F85\u786E\u8BA4" : result.annotation.differences.length ? "\u5B58\u5728\u5DEE\u5F02" : "\u672A\u53D1\u73B0\u6807\u6CE8\u5DEE\u5F02"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("button", { onClick: () => onEvidence(result), children: "\u67E5\u770B\u6BD4\u8F83\u8BC1\u636E" })
        ] }, result.result_id))
      ] })
    ] });
  }

  // src/client/components/HumanReviewForm.tsx
  var import_react26 = __require("react");

  // src/client/useReviewDraft.ts
  var import_react25 = __require("react");
  function useReviewDraft(datasetId, sampleId) {
    const key = `iad.review-draft:${datasetId}:${sampleId}`;
    const [state, setState] = (0, import_react25.useState)(() => {
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
  var import_jsx_runtime30 = __require("react/jsx-runtime");
  function HumanReviewForm({ datasetId, sampleId, detail, onSubmitted, advanceOnSubmit = false }) {
    const draft = useReviewDraft(datasetId, sampleId);
    const formId = (0, import_react26.useId)();
    const [busy, setBusy] = (0, import_react26.useState)(false), [error2, setError] = (0, import_react26.useState)(""), [notice, setNotice] = (0, import_react26.useState)("");
    const openedAt = (0, import_react26.useRef)(Date.now());
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
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("section", { className: "iad-decision", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("h3", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "iad-decision-scroll", children: [
        draft.pending ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "status", children: "\u63D0\u4EA4\u7ED3\u679C\u5F85\u786E\u8BA4" }) : draft.dirty && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("span", { role: "status", children: "\u8349\u7A3F\u672A\u63D0\u4EA4" }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { disabled: busy, onClick: draft.discard, children: "\u653E\u5F03\u8349\u7A3F" })
        ] }),
        detail.review_decision && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { children: [
          "\u5F53\u524D\uFF1A",
          reviewLabel(detail.review_decision.decision),
          " \xB7 ",
          detail.review_decision.reviewer,
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("br", {}),
          detail.review_decision.comment
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("form", { id: formId, onSubmit: (event) => {
          event.preventDefault();
          if (draft.decision) void submit(draft.decision);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("fieldset", { className: "iad-review-options", disabled: busy || !!draft.pending, children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("legend", { children: "\u88C1\u51B3" }),
            Object.entries(reviewLabels).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("input", { type: "radio", name: `decision:${sampleId}`, value, checked: (draft.pending?.decision || draft.decision) === value, onChange: () => draft.update({ decision: value }) }),
              label
            ] }, value))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u4EBA",
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("input", { required: true, value: draft.reviewer, disabled: busy || !!draft.pending, onChange: (e) => draft.update({ reviewer: e.target.value }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("label", { className: "iad-field", children: [
            "\u590D\u6838\u8BF4\u660E",
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("textarea", { value: draft.comment, disabled: busy || !!draft.pending, onChange: (e) => draft.update({ comment: e.target.value }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("details", { className: "iad-review-history", children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("summary", { children: [
            "\u590D\u6838\u8BB0\u5F55 \xB7 ",
            detail.review_history.length,
            " \u6B21"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("ol", { children: detail.review_history.map((record) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("li", { "data-decision-id": record.decision_id, children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("strong", { children: reviewLabel(record.decision) }),
            " \xB7 ",
            record.reviewer,
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("br", {}),
            record.submitted_at ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "\u672A\u8BB0\u5F55\u63D0\u4EA4\u65F6\u95F4",
            record.comment && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { children: record.comment })
          ] }, record.decision_id)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("footer", { className: "iad-review-submit", children: [
        error2 && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        notice && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { role: "status", children: notice }),
        draft.pending ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { type: "button", className: "iad-primary", disabled: busy, onClick: () => submit(draft.pending.decision), children: "\u91CD\u8BD5\u63D0\u4EA4" }) : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("button", { type: "submit", form: formId, className: "iad-primary", disabled: busy || !draft.decision || !draft.reviewer.trim(), children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : "\u63D0\u4EA4\u590D\u6838" }),
        advanceOnSubmit && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("small", { className: "iad-muted", children: "\u63D0\u4EA4\u6210\u529F\u540E\u8FDB\u5165\u4E0B\u4E00\u5F20" })
      ] })
    ] });
  }

  // src/client/models.tsx
  var import_react27 = __require("react");
  var import_jsx_runtime31 = __require("react/jsx-runtime");
  var ModelContext = (0, import_react27.createContext)(null);
  function WorkbenchModelProvider({ children }) {
    const [view, setView] = (0, import_react27.useState)(null), [loading, setLoading] = (0, import_react27.useState)(true), [error2, setError] = (0, import_react27.useState)("");
    const pending = (0, import_react27.useRef)(null);
    const refresh = (0, import_react27.useCallback)(async () => {
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
    (0, import_react27.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(ModelContext.Provider, { value: { view, loading, error: error2, refresh }, children });
  }
  function useWorkbenchModel() {
    const context = (0, import_react27.useContext)(ModelContext);
    if (!context) throw new Error("\u5DE5\u4F5C\u53F0\u6A21\u578B\u4E0A\u4E0B\u6587\u672A\u6CE8\u518C");
    return { ...context, ready: !context.loading && !context.error && context.view?.ready === true };
  }
  function WorkbenchModelStatus() {
    const { workspace } = useWorkspace(), { view, loading, error: error2 } = useWorkbenchModel();
    const provider = view?.providers.find((row) => row.provider_id === view.selection?.provider_id);
    const model = provider?.models.find((row) => row.model_id === view?.selection?.model_id);
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: "iad-model-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("span", { children: loading ? "\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u2026" : error2 || view?.error || (view?.selection ? `${provider?.name || view.selection.provider_id} \xB7 ${model?.name || view.selection.model_id}` : "\u4F7F\u7528\u5F53\u524D\u670D\u52A1\u914D\u7F6E") }),
      /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("button", { onClick: () => workspace.navigate("industrial-model-settings"), children: "\u6A21\u578B\u8BBE\u7F6E" })
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
    WAITING_RESOURCE: "\u7B49\u5F85\u6267\u884C\u8D44\u6E90",
    ENCODING: "\u51C6\u5907\u56FE\u50CF\u7279\u5F81",
    INDEXING: "\u53D1\u5E03\u5171\u4EAB\u7D22\u5F15",
    COMPARING: "\u6BD4\u8F83\u56FE\u50CF\u4E0E\u6807\u6CE8",
    PREPARING_EXPLORATION: "\u51C6\u5907\u56FE\u50CF",
    CHECKING_CAPACITY: "\u5BB9\u91CF\u68C0\u67E5",
    EXPLORING_DIRECTIONS: "\u6A21\u578B\u8054\u5408\u5206\u6790",
    PUBLISHING_DIRECTIONS: "\u6821\u9A8C\u5E76\u53D1\u5E03\u65B9\u5411",
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
  var import_jsx_runtime32 = __require("react/jsx-runtime");
  function SampleInspector({ dataset, sampleId, mode, revision, onReviewed, jobs, onJobsChanged, navigation: navigation2, queue, filters, advanceOnSubmit = false, panel }) {
    const { workspace, state } = useWorkspace();
    const model = useWorkbenchModel();
    const [loadedDetail, setDetail] = (0, import_react28.useState)(null);
    const detail = loadedDetail?.sample.sample_id === sampleId ? loadedDetail : null;
    const [error2, setError] = (0, import_react28.useState)("");
    const [busy, setBusy] = (0, import_react28.useState)(false);
    const job = jobs.find((job2) => job2.sample_ids.includes(sampleId));
    const jobRunning = jobs.some((job2) => job2.status === "RUNNING" || job2.status === "PENDING");
    const [lightbox, setLightbox] = (0, import_react28.useState)(null);
    const onPanelOpen = panel?.onOpen;
    (0, import_react28.useEffect)(() => {
      if (lightbox) onPanelOpen?.(true);
    }, [lightbox, onPanelOpen]);
    const imageButton = (0, import_react28.useRef)(null);
    (0, import_react28.useEffect)(() => {
      setDetail(null);
      setError("");
      setLightbox(null);
    }, [sampleId]);
    (0, import_react28.useEffect)(() => {
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
    (0, import_react28.useEffect)(() => {
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
          defect_version_id: view.defectVersion || void 0,
          consistency_mode: view.auditConsistencyMode
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
    const image = (0, import_react28.useMemo)(() => detail ? {
      src: mediaUrl(detail.sample),
      title: detail.sample.relative_path.split("/").pop(),
      width: detail.sample.width,
      height: detail.sample.height,
      annotationLayer: { kind: "sample", annotations: detail.annotations, sample: detail.sample },
      inspection: detail.suggestion?.analysis ? { reference: { dataset_id: dataset.dataset_id, sample_id: sampleId, suggestion_id: detail.suggestion.suggestion_id }, analysis: detail.suggestion.analysis } : void 0
    } : null, [detail, dataset.dataset_id, sampleId]);
    (0, import_react28.useEffect)(() => {
      if (navigation2?.open && image && detail?.sample.sample_id === sampleId) {
        imageButton.current?.focus({ preventScroll: true });
        setLightbox({ ...image, initialSelection: null, initialTransform: { zoom: 0, x: 0, y: 0 } });
        navigation2.opened();
      }
    }, [navigation2, image, detail, sampleId]);
    const information = detail && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
      "      ",
      /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("dl", { className: "iad-info-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u56FE\u50CF\u8DEF\u5F84" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { title: detail.sample.image_path, children: detail.sample.image_path }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u56FE\u50CF\u540D" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { "data-field": "image-name", children: detail.sample.relative_path.split("/").pop() }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "UUID" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { "data-field": "sample-uuid", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("code", { title: detail.sample.sample_uuid, children: detail.sample.sample_uuid }) }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("dd", { "data-field": "raw-label", children: [
          detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "\u672A\u6807\u8BB0",
          detail.sample.quality_source ? ` \xB7 ${detail.sample.quality_source}` : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u5206\u8FA8\u7387" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("dd", { children: [
          detail.sample.width,
          " \xD7 ",
          detail.sample.height
        ] }),
        mode !== "review" && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u4EBA\u5DE5\u7ED3\u679C" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { children: detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} \xB7 ${detail.review_decision.reviewer}` : "\u5F85\u4EBA\u5DE5\u590D\u6838" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u6570\u636E\u4E0E\u6280\u672F\u8D28\u91CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { children: detail.technical_quality_score })
      ] }),
      dataset.format !== "folder_classification" && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("section", { className: "iad-info-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("h3", { children: [
          "Labelme \u6807\u6CE8 \xB7 ",
          detail.annotations.length
        ] }),
        detail.annotations.length ? detail.annotations.map((a) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "iad-annotation", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { children: a.raw_label }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("span", { children: [
            a.bbox?.join(", "),
            " \xB7 ",
            a.geometry_status
          ] })
        ] }, a.annotation_id)) : /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-muted", children: "\u65E0\u6807\u6CE8" }),
        detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index3) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { children: i.message }, index3)) })
      ] }),
      dataset.format === "folder_classification" && detail.technical_issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("section", { className: "iad-info-group", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "iad-error", children: detail.technical_issues.map((i, index3) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { children: i.message }, index3)) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("section", { className: "iad-info-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
        detail.suggestion ? /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { children: modelLabels[detail.suggestion.suggested_label] }),
            " \xB7 ",
            detail.suggestion.reason_category,
            " \xB7 \u6A21\u578B\u81EA\u62A5\u7F6E\u4FE1\u5EA6 ",
            detail.suggestion.confidence === null ? "\u672A\u8BB0\u5F55" : `${Math.round(detail.suggestion.confidence * 100)}%`
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-observation", children: detail.suggestion.notes }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("small", { className: "iad-muted", children: detail.suggestion.model_name }),
          detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("summary", { children: [
              "\u826F\u54C1\u77E5\u8BC6\u6765\u6E90 \xB7 ",
              detail.suggestion.reference_sample_ids.length,
              " \u5F20"
            ] }),
            detail.normal_knowledge && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(KnowledgeEvidenceGallery, { versionId: detail.normal_knowledge.version_id, items: detail.normal_knowledge.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw" && detail.suggestion.reference_sample_ids.includes(item.sample_id)), onOpen: setLightbox })
          ] }),
          detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(RuleAssessments, { analysis: detail.suggestion.analysis, knowledge: [...detail.normal_knowledge ? [detail.normal_knowledge] : [], ...detail.defect_knowledge ? [detail.defect_knowledge] : []], onEvidence: (image2) => setLightbox(evidenceSource(image2)) }),
          detail.suggestion.analysis && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("details", { className: "iad-analysis", children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("summary", { children: "\u5BA1\u8BA1\u8FC7\u7A0B\u4E0E\u77E5\u8BC6\u7248\u672C" }),
            detail.normal_knowledge ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(DatasetKnowledge, { knowledge: detail.normal_knowledge }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-muted", children: "\u5386\u53F2\u5BA1\u8BA1\uFF0C\u672A\u5173\u8054\u77E5\u8BC6\u7248\u672C\u3002" }),
            detail.defect_knowledge && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(DatasetKnowledge, { knowledge: detail.defect_knowledge }),
            !!detail.suggestion.analysis.knowledge_limitations.length && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "iad-muted", children: [
              "\u77E5\u8BC6\u9650\u5236\uFF1A",
              detail.suggestion.analysis.knowledge_limitations.join("\uFF1B")
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: detail.suggestion.analysis.coverage.complete ? "iad-muted" : "iad-error", children: [
              "\u5C40\u90E8\u8986\u76D6 ",
              detail.suggestion.analysis.coverage.inspected_regions,
              " / ",
              detail.suggestion.analysis.coverage.planned_regions,
              " \xB7 ",
              detail.suggestion.analysis.coverage.complete ? "\u8BA1\u5212\u5DF2\u8986\u76D6" : "\u68C0\u67E5\u672A\u5B8C\u6210"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(detail.suggestion.analysis.overview)), children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, detail.suggestion.analysis.overview), alt: "\u9001\u6A21\u5168\u56FE\u6982\u89C8" }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("span", { children: [
                "\u5168\u56FE \xB7 ",
                detail.suggestion.analysis.overview.sent_size.join(" \xD7 "),
                detail.suggestion.analysis.conclusion.evidence_ids.includes(detail.suggestion.analysis.overview.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("h3", { children: "\u5168\u56FE\u89C2\u5BDF" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { children: detail.suggestion.analysis.global_view.description }),
            detail.suggestion.analysis.regions.map((region, index3) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("h3", { children: [
                "\u5C40\u90E8 \xB7 ",
                region.origins.map((origin) => origin.label).join(" / ")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("small", { children: [
                regionSources[region.source],
                " \xB7 \u539F\u56FE\u5750\u6807 ",
                region.crop_bbox.join(", ")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(region.image)), children: [
                /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, region.image), alt: `\u5BA1\u8BA1 ROI ${index3 + 1}` }),
                /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("span", { children: [
                  region.image.sent_size.join(" \xD7 "),
                  " \xB7 PNG",
                  detail.suggestion.analysis.conclusion.evidence_ids.includes(region.image.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { children: region.observation.description }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
                "\u4F4D\u7F6E\uFF1A",
                region.observation.position_analysis
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
                "\u5149\u7167\uFF1A",
                region.observation.illumination_analysis
              ] })
            ] }, index3)),
            detail.suggestion.analysis.auxiliary_evidence.map((image2) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("button", { className: "iad-evidence-preview", onClick: () => setLightbox(evidenceSource(image2)), children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("img", { src: auditEvidenceUrl(detail.suggestion.suggestion_id, image2), alt: "\u5B9E\u9645\u9001\u6A21\u7684\u4E8C\u503C\u6807\u6CE8\u5B9A\u4F4D\u56FE" }),
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("span", { children: [
                "\u6807\u6CE8\u5B9A\u4F4D\u56FE",
                detail.suggestion.analysis.conclusion.evidence_ids.includes(image2.evidence_id) ? " \xB7 \u7ED3\u8BBA\u5F15\u7528" : ""
              ] })
            ] }, image2.evidence_id)),
            detail.suggestion.analysis.conclusion.conflicts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "iad-error", children: [
              "\u89C2\u5BDF\u77DB\u76FE\uFF1A",
              detail.suggestion.analysis.conclusion.conflicts.join("\uFF1B")
            ] }),
            detail.suggestion.analysis.conclusion.missing_evidence.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "iad-error", children: [
              "\u7F3A\u5931\u8BC1\u636E\uFF1A",
              detail.suggestion.analysis.conclusion.missing_evidence.join("\uFF1B")
            ] }),
            detail.suggestion.analysis.joint_steps.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("summary", { children: [
                "\u8054\u5408\u5206\u6790\u8BB0\u5F55 \xB7 ",
                detail.suggestion.analysis.joint_steps.length,
                " \u6B65"
              ] }),
              detail.suggestion.analysis.joint_steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("strong", { children: [
                  step.step_id,
                  " \xB7 ",
                  modelLabels[step.result.suggested_label]
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
                  step.input_evidence_ids.length,
                  " \u5F20\u56FE\u50CF",
                  step.child_step_ids.length ? ` \xB7 \u6C47\u603B ${step.child_step_ids.join("\u3001")}` : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { children: step.result.description }),
                "resolved_findings" in step.result && step.result.resolved_findings.map((resolution, index3) => /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
                    "\u5DF2\u6392\u9664\u7591\u70B9\uFF1A",
                    resolution.description
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
                    "\u6B63\u5E38\u89E3\u91CA\uFF1A",
                    resolution.normal_explanation
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(AuditEvidence, { analysis: detail.suggestion.analysis, ids: resolution.evidence_ids, label: resolution.description, onEvidence: (image2) => setLightbox(evidenceSource(image2)) })
                ] }, index3))
              ] }, step.step_id))
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "iad-muted", children: [
              "\u7ED3\u8BBA\u5F15\u7528 ",
              detail.suggestion.analysis.conclusion.evidence_ids.length,
              " \u9879\u89C6\u89C9\u8BC1\u636E"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
              "\u4F4D\u7F6E\u5206\u6790\uFF1A",
              detail.suggestion.analysis.conclusion.position_analysis
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { children: [
              "\u5149\u7167\u5206\u6790\uFF1A",
              detail.suggestion.analysis.conclusion.illumination_analysis
            ] })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-muted", children: "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" })
      ] })
    ] });
    const consistency = detail?.consistency && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(AuditConsistency, { record: detail.consistency, onEvidence: (result) => workspace.openLocation({
      pageId: "industrial-consistency",
      tab: "search",
      query: { kind: "sample", sample_id: sampleId },
      evidenceId: result.evidence_id,
      resultId: result.result_id,
      returnPage: mode === "model" ? "industrial-audit" : mode === "review" ? "industrial-review" : "industrial-images"
    }) });
    const decision = detail && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId, detail, advanceOnSubmit, onSubmitted: (record) => onReviewed(record, detail.sample.relative_path) }, sampleId);
    const lightboxView = /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
      "    ",
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ImageViewer, { image: lightbox, navigation: navigation2, onClose: () => {
        navigation2?.cancel();
        setLightbox(null);
        if (workspace.view(state.pageId).inspection) workspace.updateView(state.pageId, { inspection: null }, true);
      } })
    ] });
    if (queue !== void 0) return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "iad-inspector iad-focused-inspector", children: [
      error2 && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ReviewWorkspace, { queue, filters, information: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
        consistency,
        information
      ] }), decision, image: image && !lightbox ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ImageCanvas, { image, embedded: true, navigation: navigation2 ? { ...navigation2, move: (offset4) => navigation2.move(offset4, "embedded") } : void 0, onExpand: (view) => setLightbox({ ...image, initialSelection: view.selection, initialTransform: view.transform }) }) : !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-empty", children: "\u5F53\u524D\u590D\u6838\u961F\u5217\u5DF2\u5904\u7406\u5B8C\u6210\uFF0C\u6216\u6CA1\u6709\u5339\u914D\u7684\u6837\u672C\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6837\u672C\u2026" }) : null }, sampleId),
      lightboxView
    ] });
    const body = /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("aside", { className: "iad-inspector", children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("h2", { children: mode === "review" ? "\u590D\u6838\u660E\u7EC6" : "\u6837\u672C\u8BE6\u60C5" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !sampleId ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { children: "\u9009\u62E9\u56FE\u50CF\u67E5\u770B\u3002" }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(MediaLoad, { children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("button", { ref: imageButton, className: "iad-image-button", onClick: () => setLightbox(image), title: "\u653E\u5927\u56FE\u50CF", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(AnnotatedImage, { image }) }) }, image.src),
        consistency,
        mode === "model" ? /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { className: "iad-inspector-filename", "data-field": "image-name", title: detail.sample.relative_path, children: detail.sample.relative_path.split("/").pop() }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("dl", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { children: detail.sample.quality_status === "PASS" ? "OK" : detail.sample.quality_status === "FAIL" ? "NG" : "\u672A\u6807\u8BB0" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u4EBA\u5DE5\u7ED3\u679C" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { children: detail.review_decision ? `${reviewLabel(detail.review_decision.decision)} \xB7 ${detail.review_decision.reviewer}` : "\u5F85\u4EBA\u5DE5\u590D\u6838" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dt", { children: "\u6A21\u578B\u5EFA\u8BAE" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("dd", { children: detail.suggestion ? modelLabels[detail.suggestion.suggested_label] : "\u5C1A\u672A\u5BA1\u8BA1" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF" }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "iad-observation iad-observation-summary", children: detail.suggestion?.notes || "\u5C1A\u65E0\u6A21\u578B\u89C2\u5BDF\u3002" }),
          detail.suggestion && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "iad-muted iad-inspector-basis", children: [
            "\u51BB\u7ED3\u4F9D\u636E\uFF1A\u826F\u54C1 ",
            detail.normal_knowledge ? "\u5DF2\u5173\u8054" : "\u672A\u5173\u8054",
            " \xB7 \u5F02\u5E38 ",
            detail.defect_knowledge ? "\u5DF2\u5173\u8054" : "\u672A\u5173\u8054"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "iad-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("button", { onClick: () => workspace.navigate("industrial-review", sampleId), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" }),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("button", { disabled: busy || jobRunning || !model.ready, onClick: audit, children: busy || jobRunning ? "\u6B63\u5728\u8054\u5408\u5BA1\u8BA1\u2026" : "\u6309\u77E5\u8BC6\u5BA1\u8BA1\u6B64\u56FE" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("details", { className: "iad-audit-details", children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("summary", { children: "\u6837\u672C\u4FE1\u606F\u4E0E\u5BA1\u8BA1\u8BE6\u60C5" }),
            information
          ] })
        ] }) : information,
        mode === "model" && job && /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("section", { className: "iad-single-job", "aria-label": "\u5F53\u524D\u6837\u672C\u4F5C\u4E1A", children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { role: "status", children: [
            job.cancel_requested && ["PENDING", "RUNNING"].includes(job.status) ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[job.status],
            " \xB7 ",
            jobPhases[job.phase || ""] || job.message
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("button", { onClick: () => workspace.updateView("industrial-audit", { tab: "jobs", job: job.run_id }), children: "\u67E5\u770B\u6B64\u56FE\u5BA1\u8BA1\u4F5C\u4E1A" })
        ] }),
        mode === "review" && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(HumanReviewForm, { datasetId: dataset.dataset_id, sampleId, detail, advanceOnSubmit, onSubmitted: (record) => onReviewed(record, detail.sample.relative_path) }, sampleId)
      ] }),
      lightboxView
    ] });
    const presentation = lightbox ? "inline" : panel?.presentation;
    return panel ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Modal, { title: "\u6837\u672C\u8BE6\u60C5", onClose: panel.onClose, restoreFocus: panel.restoreFocus, presentation, className: `iad-audit-sample ${presentation === "modal" ? "iad-drawer" : ""}`, children: body }) : body;
  }

  // src/client/components/AuditSetup.tsx
  var import_react30 = __require("react");

  // src/client/useKnowledge.ts
  var import_react29 = __require("react");
  var empty = { knowledge: null, versions: [], freshness: null, eligible_source_count: 0, unavailable_source_count: 0 };
  function useKnowledge(datasetId, kind, versionId = "", revision = 0) {
    const queryIdentity = (0, import_react29.useMemo)(() => ({ scope: JSON.stringify([datasetId, kind, versionId]), revision }), [datasetId, kind, versionId, revision]);
    const [value, setValue] = (0, import_react29.useState)();
    (0, import_react29.useEffect)(() => {
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
  var import_jsx_runtime33 = __require("react/jsx-runtime");
  var reasons = { image: "\u56FE\u50CF\u5185\u5BB9\u53D8\u5316", annotations: "\u5DF2\u5BFC\u5165\u6807\u6CE8\u53D8\u5316", review: "\u4EBA\u5DE5\u53CD\u9988\u53D8\u5316", audit_candidates: "\u5BA1\u8BA1\u5019\u9009\u53D8\u5316", qualification: "\u6765\u6E90\u8D44\u683C\u53D8\u5316", unavailable: "\u6765\u6E90\u65E0\u6CD5\u8BFB\u53D6\u6216\u6838\u9A8C" };
  function KnowledgeState({ freshness }) {
    if (!freshness) return null;
    if (freshness.status === "current") return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { role: "status", "aria-label": "\u77E5\u8BC6\u6765\u6E90\u72B6\u6001", className: "iad-muted", title: `\u6838\u9A8C\u65F6\u95F4 ${new Date(freshness.checked_at).toLocaleString()}`, children: [
      "\u6765\u6E90\u4E0E\u751F\u6210\u89C4\u5219\u672A\u53D8\u5316\u3002",
      freshness.additional_source_ids.length > 0 && ` ${freshness.additional_source_ids.length} \u5F20\u5408\u683C\u5019\u9009\u672A\u8986\u76D6\u3002`
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("details", { "aria-label": "\u77E5\u8BC6\u6765\u6E90\u72B6\u6001", className: "iad-freshness", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("summary", { role: "status", children: freshness.status === "changed" ? freshness.source_changes.length ? "\u6765\u6E90\u53D1\u751F\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : "\u77E5\u8BC6\u4F9D\u8D56\u6216\u751F\u6210\u89C4\u5219\u53D1\u751F\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : freshness.status === "unverified" ? "\u751F\u6210\u89C4\u5219\u5C1A\u672A\u6838\u5B9E\uFF0C\u8BF7\u91CD\u65B0\u6316\u6398\u6838\u9A8C\u3002" : "\u6765\u6E90\u4E0E\u751F\u6210\u89C4\u5219\u672A\u53D8\u5316\u3002" }),
      freshness.normal_version_changed && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { children: [
        "\u6240\u4F9D\u636E\u7684\u826F\u54C1\u7248\u672C\u5DF2\u975E\u5F53\u524D\u53D1\u5E03\u7248\u672C\u3002\u5F53\u524D\u826F\u54C1\uFF1A",
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("code", { children: freshness.current_normal_version_id || "\u65E0" })
      ] }),
      freshness.normal_sources_changed && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { children: "\u6240\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7684\u6765\u6E90\u6216\u751F\u6210\u89C4\u5219\u9700\u8981\u91CD\u65B0\u6838\u9A8C\u3002" }),
      freshness.generation_changed && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { children: "\u77E5\u8BC6\u751F\u6210\u89C4\u5219\u5DF2\u53D8\u5316\u3002" }),
      !!freshness.source_changes.length && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("summary", { children: [
          freshness.source_changes.length,
          " \u5F20\u6765\u6E90\u9700\u8981\u6838\u9A8C"
        ] }),
        freshness.source_changes.map((change) => /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("code", { children: change.sample_id.slice(change.sample_id.indexOf(":") + 1) }),
          " \xB7 ",
          change.reasons.map((reason) => reasons[reason]).join("\u3001")
        ] }, change.sample_id))
      ] }),
      !!freshness.additional_source_ids.length && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { children: [
        freshness.additional_source_ids.length,
        " \u5F20\u5408\u683C\u5019\u9009\u672A\u7EB3\u5165\u6B64\u7248\u672C\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("small", { className: "iad-muted", children: [
        "\u6838\u9A8C\u65F6\u95F4 ",
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("time", { dateTime: freshness.checked_at, children: new Date(freshness.checked_at).toLocaleString() })
      ] })
    ] });
  }

  // src/client/components/AuditSetup.tsx
  var import_jsx_runtime34 = __require("react/jsx-runtime");
  function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged, onStarted }) {
    const { workspace } = useWorkspace();
    const view = workspace.view("industrial-audit");
    const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
    const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
    const normal = normalQuery.knowledge;
    const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
    const loading = normalQuery.loading || defectQuery.loading;
    const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "\u6240\u9009\u4E0D\u826F\u77E5\u8BC6\u4E0E\u826F\u54C1\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" : "");
    const [lightbox, setLightbox] = (0, import_react30.useState)(null);
    const model = useWorkbenchModel();
    const [busy, setBusy] = (0, import_react30.useState)(false);
    const [error2, setError] = (0, import_react30.useState)("");
    const [total, setTotal] = (0, import_react30.useState)(null);
    const scopeQuery = sampleQuery(dataset.dataset_id, filters, 1, 1);
    (0, import_react30.useEffect)(() => {
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
          filters,
          consistency_mode: view.auditConsistencyMode
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
    const normalDetails = normal && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(DatasetKnowledge, { knowledge: normal }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(KnowledgeEvidenceGallery, { versionId: normal.version_id, items: normal.evidence.filter((item) => item.image.role === "normal" && item.image.representation === "raw"), onOpen: setLightbox })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("section", { className: "iad-job-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(WorkbenchModelStatus, {}),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("h3", { children: "\u77E5\u8BC6\u4F9D\u636E" }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("div", { className: "iad-config-bar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("label", { className: "iad-field", children: [
            "\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: loading, onChange: (event) => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("option", { value: "", children: "\u5F53\u524D\u7248\u672C" }),
              normalQuery.versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("label", { className: "iad-field", children: [
            "\u4E0D\u826F\u54C1\u7248\u672C",
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u4E0D\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.defectVersion, disabled: loading || !normal, onChange: (event) => workspace.updateView("industrial-audit", { defectVersion: event.target.value }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("option", { value: "", children: "\u5339\u914D\u7684\u5F53\u524D\u7248\u672C" }),
              defectQuery.versions.filter((version) => version.normal_version_id === normal?.version_id).map((version) => /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("label", { className: "iad-field", children: [
            "\u4E00\u81F4\u6027\u68C0\u67E5",
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("select", { "aria-label": "\u5BA1\u8BA1\u4E00\u81F4\u6027\u6A21\u5F0F", value: view.auditConsistencyMode, onChange: (event) => workspace.updateView("industrial-audit", { auditConsistencyMode: event.target.value }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("option", { value: "exact", children: "\u5DF2\u6709\u7CBE\u786E\u7D22\u5F15" }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("option", { value: "combined", children: "\u7CBE\u786E\u4E0E\u5DF2\u6709\u89C6\u89C9\u7D22\u5F15" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { "aria-label": "\u5BA1\u8BA1\u6267\u884C\u8303\u56F4", children: [
          "\u5F53\u524D\u7B5B\u9009\u7684\u5168\u90E8 ",
          total === null ? "\u2026" : total,
          " \u5F20\u56FE\u50CF \xB7 \u5168\u56FE\u4E0E\u5168\u90E8\u9002\u7528 ROI \u8054\u5408\u5206\u6790"
        ] }),
        loading ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u77E5\u8BC6\u2026" }) : loadError ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "alert", className: "iad-error", children: loadError }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
          normal ? /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(KnowledgeState, { freshness: normalQuery.freshness }),
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("summary", { children: [
                "\u826F\u54C1\u77E5\u8BC6 \xB7 ",
                normal.checks.filter((check) => check.status === "supported").length,
                " \u9879\u6709\u8BC1\u636E\u652F\u6301"
              ] }),
              normalDetails
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { className: "iad-profile iad-muted", children: [
            "\u8BF7\u5148\u6316\u6398\u826F\u54C1\u77E5\u8BC6\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002",
            /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: "normal" }), children: "\u524D\u5F80\u6316\u6398\u826F\u54C1\u77E5\u8BC6" })
          ] }),
          defect ? /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(KnowledgeState, { freshness: defectQuery.freshness }),
            /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("summary", { children: [
                "\u4E0D\u826F\u77E5\u8BC6 \xB7 ",
                defect.checks.length,
                " \u9879\u5224\u636E"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(DatasetKnowledge, { knowledge: defect })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", { className: "iad-primary", disabled: busy || loading || total === null || total === 0 || !!loadError || !model.ready || !normal?.checks.some((check) => check.status === "supported") || jobs.some((job) => job.status === "RUNNING" || job.status === "PENDING"), onClick: start, children: busy ? "\u542F\u52A8\u4E2D\u2026" : "\u5BA1\u8BA1\u5F53\u524D\u7B5B\u9009\u5168\u90E8\u56FE\u50CF" }) })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_react36 = __require("react");

  // src/client/components/JobTable.tsx
  var import_react34 = __require("react");

  // src/client/components/ExplorationProgress.tsx
  var import_react31 = __require("react");
  var import_jsx_runtime35 = __require("react/jsx-runtime");
  var stages = ["\u51C6\u5907\u56FE\u50CF", "\u5BB9\u91CF\u68C0\u67E5", "\u6A21\u578B\u8054\u5408\u5206\u6790", "\u6821\u9A8C\u5E76\u53D1\u5E03\u65B9\u5411"];
  function ExplorationProgress({
    job,
    stale = false,
    lastSyncedAt
  }) {
    const [now, setNow] = (0, import_react31.useState)(Date.now());
    const active = job.status === "RUNNING";
    (0, import_react31.useEffect)(() => {
      if (!active || stale) return;
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 1e3);
      return () => clearInterval(timer);
    }, [active, stale]);
    const stage = job.phase === "CHECKING_CAPACITY" ? 1 : job.phase === "EXPLORING_DIRECTIONS" ? 2 : ["PUBLISHING_DIRECTIONS", "DIRECTIONS_PUBLISHED"].includes(
      job.phase || ""
    ) ? 3 : 0;
    const call = [...job.model_calls].reverse().find((item) => !item.finished_at);
    const start = call?.started_at || job.phase_started_at || job.started_at;
    const clock = stale ? lastSyncedAt : active ? now : job.finished_at ? Date.parse(job.finished_at) : now;
    const elapsed = start && clock ? Math.max(0, Math.floor((Number(clock) - Date.parse(start)) / 1e3)) : null;
    return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("div", { className: "iad-exploration-progress", children: [
      /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("p", { children: [
        "\u8F93\u5165 ",
        job.total_samples,
        " \u5F20 \xB7 \u826F\u54C1",
        " ",
        job.exploration_request?.normal_images.length ?? "\u672A\u8BB0\u5F55",
        " \xB7 \u5F02\u5E38",
        " ",
        job.exploration_request?.defect_images.length ?? "\u672A\u8BB0\u5F55"
      ] }),
      job.status === "PENDING" ? /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("p", { children: [
        "\u6392\u961F\u7B2C ",
        job.queue_position,
        " \u9879 \xB7 \u7B49\u5F85\u524D\u4E00\u4EFB\u52A1\u7ED3\u675F"
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("ol", { className: "iad-execution-stages", children: stages.map((label, index3) => /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
        "li",
        {
          "data-state": job.status === "COMPLETED" || index3 < stage ? "done" : index3 === stage ? "current" : "waiting",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { "aria-hidden": "true", children: index3 + 1 }),
            /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("strong", { children: label }),
              index3 === stage && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("small", { children: stage === 0 ? `\u5DF2\u51C6\u5907 ${job.prepared_sources} / ${job.total_samples} \u5F20` : stage === 2 ? call?.operation === "generate" ? "\u751F\u6210\u8BF7\u6C42\u5C1A\u672A\u8BB0\u5F55\u5B8C\u6574\u8FD4\u56DE" : "\u7B49\u5F85\u751F\u6210\u8BF7\u6C42\u8BB0\u5F55" : stage === 1 ? "\u6821\u9A8C\u6574\u7EC4\u8F93\u5165\u5BB9\u91CF" : job.status === "COMPLETED" ? "\u65B9\u5411\u5DF2\u53D1\u5E03" : "\u6838\u9A8C\u5F15\u7528\u4E0E\u51BB\u7ED3\u8F93\u5165" })
            ] })
          ]
        },
        label
      )) }),
      active && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
          "div",
          {
            className: `iad-indeterminate ${stale ? "is-stale" : ""}`,
            role: "progressbar",
            "aria-label": "\u7B49\u5F85\u8054\u5408\u63A2\u7D22\u7ED3\u679C",
            children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", {})
          }
        ),
        elapsed !== null && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("p", { className: "iad-muted", children: [
          "\u5F53\u524D",
          call ? "\u8BF7\u6C42" : "\u9636\u6BB5",
          "\u5DF2\u7528 ",
          Math.floor(elapsed / 60),
          " \u5206",
          " ",
          elapsed % 60,
          " \u79D2",
          stale ? " \xB7 \u4E0A\u6B21\u540C\u6B65\u65F6" : ""
        ] })
      ] })
    ] });
  }

  // src/client/components/JobDetail.tsx
  var import_react33 = __require("react");

  // src/client/components/KnowledgeJobEvidence.tsx
  var import_react32 = __require("react");
  var import_jsx_runtime36 = __require("react/jsx-runtime");
  function KnowledgeJobEvidence({ job }) {
    const [open, setOpen] = (0, import_react32.useState)(false), [page, setPage] = (0, import_react32.useState)(1);
    const [result, setResult] = (0, import_react32.useState)(null), [error2, setError] = (0, import_react32.useState)("");
    const [image, setImage] = (0, import_react32.useState)(null);
    (0, import_react32.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("details", { onToggle: (event) => setOpen(event.currentTarget.open), children: [
      /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("summary", { children: "\u89C2\u5BDF\u8BC1\u636E" }),
      job.mining_prompt && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("summary", { children: "\u672C\u6B21\u51BB\u7ED3\u6316\u6398\u63D0\u793A\u8BCD" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("pre", { className: "iad-observation", children: job.mining_prompt.instruction })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      open && !result && !error2 && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51BB\u7ED3\u89C2\u5BDF\u2026" }),
      open && result && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("p", { className: "iad-muted", children: [
          "\u89C4\u5212 ",
          result.progress.planned_visuals,
          " \u4E2A\u89C6\u56FE \xB7 \u5DF2\u63A5\u53D7\u89C2\u5BDF ",
          result.progress.observed_visuals,
          " \u4E2A \xB7 \u5DF2\u53D1\u5E03 ",
          result.progress.published_sources,
          " \u5F20\u6765\u6E90"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("div", { className: "iad-reference-grid", children: result.items.map((item) => {
          const src = `/api/iad/knowledge/observations/${encodeURIComponent(job.run_id)}/evidence/${encodeURIComponent(item.image.evidence_id)}`;
          const title = `${item.image.role} \xB7 ${item.observed ? "\u5DF2\u63A5\u53D7\u89C2\u5BDF" : "\u5C1A\u672A\u5B8C\u6210\u89C2\u5BDF"}`;
          return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("button", { title: "\u653E\u5927\u51BB\u7ED3\u89C2\u5BDF\u8BC1\u636E", onClick: () => setImage({ src, title, width: item.image.sent_size[0], height: item.image.sent_size[1] }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("img", { src, alt: title, loading: "lazy" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("small", { children: title })
          ] }, item.image.evidence_id);
        }) }),
        !result.total && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { children: "\u5C1A\u672A\u89C4\u5212\u56FE\u50CF\u8BC1\u636E\u3002" }),
        result.total > result.page_size && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { disabled: page <= 1, onClick: () => setPage((value) => value - 1), children: "\u4E0A\u4E00\u9875\u8BC1\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("span", { children: [
            "\u7B2C ",
            page,
            " \u9875"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { disabled: page * result.page_size >= result.total, onClick: () => setPage((value) => value + 1), children: "\u4E0B\u4E00\u9875\u8BC1\u636E" })
        ] })
      ] }),
      image && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(ImageViewer, { image, onClose: () => setImage(null) })
    ] });
  }

  // src/client/components/JobDetail.tsx
  var import_jsx_runtime37 = __require("react/jsx-runtime");
  var sampleName = (sample) => sample.relative_path || sample.sample_uuid;
  function JobDetail({ job, onChanged, stale = false, lastSyncedAt, onCopy }) {
    const { workspace } = useWorkspace();
    const kind = job.job_type === "MODEL_AUDIT" ? "audit" : job.job_type === "DIRECTION_EXPLORATION" ? "exploration" : "knowledge";
    const page = kind === "audit" ? "industrial-audit" : kind === "exploration" ? "industrial-exploration" : "industrial-knowledge";
    const active = job.status === "RUNNING" || job.status === "PENDING";
    const [busy, setBusy] = (0, import_react33.useState)(false);
    const [error2, setError] = (0, import_react33.useState)("");
    const [expanded, setExpanded] = (0, import_react33.useState)(false);
    const [options, setOptions] = (0, import_react33.useState)(null);
    const [selected, setSelected] = (0, import_react33.useState)([]);
    const [revision, setRevision] = (0, import_react33.useState)(0);
    const article = (0, import_react33.useRef)(null);
    const focused = workspace.view(page, job.kind ?? void 0).job === job.run_id;
    (0, import_react33.useEffect)(() => {
      if (focused) article.current?.scrollIntoView({ block: "nearest" });
    }, [focused]);
    (0, import_react33.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("article", { ref: article, className: "iad-job", "data-job-id": job.run_id, "aria-label": `\u4F5C\u4E1A ${job.run_id}`, "aria-current": focused || void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("strong", { role: "status", children: active && job.cancel_requested ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[job.status] }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("span", { children: [
          job.model_profile?.provider_name ? `${job.model_profile.provider_name} \xB7 ` : "",
          job.model_name
        ] }),
        active && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { disabled: busy || job.cancel_requested, onClick: cancel, children: job.cancel_requested ? "\u6B63\u5728\u505C\u6B62\u2026" : kind === "audit" ? "\u53D6\u6D88\u5BA1\u8BA1" : kind === "exploration" ? job.status === "PENDING" ? "\u53D6\u6D88\u6392\u961F" : "\u53D6\u6D88\u63A2\u7D22" : "\u53D6\u6D88\u6316\u6398" }),
        kind === "knowledge" && !active && !job.deleted_at && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
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
      kind !== "exploration" && job.total_samples > 0 && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("progress", { "aria-label": "\u4F5C\u4E1A\u5904\u7406\u8FDB\u5EA6", value: job.progress, max: 1 }),
      kind === "exploration" ? /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(ExplorationProgress, { job, stale, lastSyncedAt }) : /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { children: [
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
      kind === "exploration" && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(import_jsx_runtime37.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("summary", { children: "\u4EFB\u52A1\u51BB\u7ED3\u63D0\u793A\u8BCD" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("pre", { className: "iad-observation", children: job.exploration_prompt?.text || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: job.exploration_request?.objective })
        ] }),
        onCopy && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => onCopy(job), children: "\u590D\u5236\u4E3A\u65B0\u914D\u7F6E" })
      ] }),
      kind === "knowledge" && job.observation_progress && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { className: "iad-muted", children: [
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
      kind === "knowledge" && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(KnowledgeJobEvidence, { job }),
      active && job.cancel_requested ? /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "iad-muted", children: "\u7B49\u5F85\u5F53\u524D\u6A21\u578B\u8BF7\u6C42\u8FD4\u56DE\u540E\u505C\u6B62\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "iad-muted", children: jobPhases[job.phase || ""] || job.message }),
      job.current_sample && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { children: [
        "\u5F53\u524D\u56FE\u50CF ",
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => locate(job.current_sample.sample_id), title: job.current_sample.sample_uuid, children: sampleName(job.current_sample) })
      ] }),
      !!job.planned_regions && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { className: "iad-muted", children: [
        "ROI ",
        job.inspected_regions || 0,
        " / ",
        job.planned_regions
      ] }),
      !!job.total_batches && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { className: "iad-muted", children: [
        "\u8054\u5408\u5224\u65AD ",
        job.completed_batches || 0,
        " / ",
        job.total_batches
      ] }),
      job.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("small", { className: "iad-muted", children: [
        "\u826F\u54C1\u7248\u672C ",
        job.normal_version_id,
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("br", {}),
        job.defect_version_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(import_jsx_runtime37.Fragment, { children: [
          "\u4E0D\u826F\u7248\u672C ",
          job.defect_version_id,
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("br", {})
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("summary", { children: "\u51BB\u7ED3\u4F9D\u636E\u4E0E\u4EFB\u52A1\u6807\u8BC6" }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dt", { children: "\u4EFB\u52A1 ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dd", { children: job.run_id }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dt", { children: "\u6839\u4EFB\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dd", { children: job.root_run_id }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dt", { children: "\u5F00\u59CB\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dd", { children: job.started_at || "\u672A\u63D0\u4F9B" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dt", { children: "\u7ED3\u675F\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dd", { children: job.finished_at || "\u672A\u63D0\u4F9B" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dt", { children: "\u63D0\u4F9B\u5546" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dd", { children: job.model_profile?.provider_name || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dt", { children: "\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("dd", { children: job.model_name })
        ] })
      ] }),
      job.origin_session_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { disabled: busy, onClick: async () => {
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
      job.parent_run_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { className: "iad-job-links", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("button", { onClick: () => related(job.parent_run_id), children: [
          "\u539F\u4F5C\u4E1A ",
          job.parent_run_id
        ] }),
        job.root_run_id !== job.parent_run_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("button", { onClick: () => related(job.root_run_id), children: [
          "\u8D77\u59CB\u4F5C\u4E1A ",
          job.root_run_id
        ] })
      ] }),
      job.knowledge_version_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => {
        workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? void 0, version: job.knowledge_version_id, tab: "results" });
      }, children: "\u67E5\u770B\u5DF2\u53D1\u5E03\u7248\u672C" }) }),
      !!job.errors.length && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("summary", { children: [
          "\u5931\u8D25\u8BE6\u60C5 \xB7 ",
          job.errors.length
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("ul", { className: "iad-job-errors", children: job.errors.map((error3, index3) => /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => locate(error3.sample_id), title: error3.sample_uuid, children: sampleName(error3) }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "iad-error", children: error3.message })
        ] }, index3)) })
      ] }),
      kind === "exploration" && job.exploration_version_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => workspace.updateView(page, { version: job.exploration_version_id, tab: "results" }), children: "\u67E5\u770B\u63A2\u7D22\u7ED3\u679C" }),
      kind === "exploration" && !active && job.status !== "COMPLETED" && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { disabled: busy, onClick: () => void retry(), children: "\u6309\u539F\u56FE\u7EC4\u91CD\u8BD5" }),
      kind !== "exploration" && !active && !job.deleted_at && job.status !== "COMPLETED" && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), children: expanded ? "\u6536\u8D77\u91CD\u8BD5\u8303\u56F4" : "\u9009\u62E9\u91CD\u8BD5\u8303\u56F4" }),
      expanded && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("section", { className: "iad-retry-scope", "aria-label": "\u91CD\u8BD5\u8303\u56F4", children: [
        options ? /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(import_jsx_runtime37.Fragment, { children: [
          options.active_run_id && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { role: "status", children: "\u540C\u7C7B\u4F5C\u4E1A\u4ECD\u5728\u6267\u884C\uFF0C\u8BF7\u7ED3\u675F\u540E\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4\u3002" }),
          !options.samples.length ? /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: "\u5173\u8054\u4F5C\u4E1A\u5DF2\u5B8C\u6210\u5168\u90E8\u56FE\u50CF\uFF0C\u65E0\u9700\u91CD\u8BD5\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(import_jsx_runtime37.Fragment, { children: [
            options.selection_mode === "all_sources" ? /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "iad-muted", children: "\u77E5\u8BC6\u8054\u5408\u5F52\u7EB3\u987B\u4F7F\u7528\u6574\u7EC4\u51BB\u7ED3\u6765\u6E90\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "iad-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => setSelected(options.samples.map((sample) => sample.sample_id)), children: "\u5168\u9009" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => setSelected(options.samples.filter((sample) => sample.state === "failed").map((sample) => sample.sample_id)), children: "\u4EC5\u5931\u8D25" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { onClick: () => setSelected(options.samples.filter((sample) => sample.state === "unprocessed").map((sample) => sample.sample_id)), children: "\u4EC5\u672A\u5904\u7406" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("fieldset", { disabled: busy || !!options.active_run_id, children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("legend", { children: "\u5931\u8D25\u6216\u672A\u5904\u7406\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("div", { className: "iad-retry-samples", children: options.samples.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("label", { title: sample.sample_uuid, children: [
                /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: selected.includes(sample.sample_id),
                    disabled: options.selection_mode === "all_sources",
                    onChange: (event) => setSelected((values) => event.target.checked ? [...values, sample.sample_id] : values.filter((id) => id !== sample.sample_id))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { children: sampleName(sample) }),
                /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("small", { children: sample.state === "failed" ? "\u5931\u8D25" : "\u672A\u5904\u7406" })
              ] }, sample.sample_id)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { className: "iad-primary", disabled: busy || !selected.length || !!options.active_run_id, onClick: retry, children: busy ? "\u542F\u52A8\u91CD\u8BD5\u4E2D\u2026" : `\u91CD\u8BD5\u6240\u9009 ${selected.length} \u5F20` })
          ] })
        ] }) : !error2 && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u53EF\u91CD\u8BD5\u8303\u56F4\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(IconButton, { label: "\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4", disabled: busy, onClick: () => setRevision((value) => value + 1), children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(RefreshIcon, {}) })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { role: "alert", className: "iad-error", children: error2 })
    ] });
  }

  // src/client/components/JobTable.tsx
  var import_jsx_runtime38 = __require("react/jsx-runtime");
  var types = {
    MODEL_AUDIT: "\u6A21\u578B\u5BA1\u8BA1",
    NORMAL_KNOWLEDGE: "\u826F\u54C1\u77E5\u8BC6",
    DEFECT_KNOWLEDGE: "\u5F02\u5E38\u77E5\u8BC6",
    DIRECTION_EXPLORATION: "\u65B9\u5411\u63A2\u7D22",
    IMAGE_INDEX: "\u56FE\u50CF\u7D22\u5F15",
    DATA_CONSISTENCY: "\u6570\u636E\u4E00\u81F4\u6027"
  };
  function JobTable({
    jobs,
    pageId,
    onChanged,
    stale = false,
    lastSyncedAt,
    onCopy
  }) {
    const { workspace } = useWorkspace(), selected = workspace.view(pageId).job;
    const [page, setPage] = (0, import_react34.useState)(1), [status, setStatus] = (0, import_react34.useState)("");
    const exploration = pageId === "industrial-exploration";
    const filtered = jobs.filter((job2) => !status || job2.status === status);
    const index3 = filtered.findIndex((job2) => job2.run_id === selected);
    (0, import_react34.useEffect)(() => {
      if (index3 >= 0) setPage(Math.floor(index3 / 10) + 1);
    }, [selected, index3]);
    const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))), visible = filtered.slice((current - 1) * 10, current * 10);
    const job = jobs.find((job2) => job2.run_id === selected) || visible[0];
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
      "div",
      {
        className: `iad-job-table ${exploration && job ? "iad-exploration-jobs-layout" : ""}`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "iad-field iad-job-filter", children: [
            "\u4EFB\u52A1\u72B6\u6001",
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
              "select",
              {
                "aria-label": "\u4EFB\u52A1\u72B6\u6001",
                value: status,
                onChange: (event) => {
                  setStatus(event.target.value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
                  Object.entries(jobStatuses).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { value, children: label }, value))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u4F5C\u4E1A\u5217\u8868", children: [
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { children: "\u4EFB\u52A1" }),
                !exploration && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { children: "\u7C7B\u578B" }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("th", { children: [
                  "\u72B6\u6001",
                  exploration && " / \u5F53\u524D\u9636\u6BB5"
                ] }),
                exploration ? /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { children: "\u8F93\u5165\u56FE\u7EC4" }) : /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(import_jsx_runtime38.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { className: "iad-number", children: "\u5B8C\u6210 / \u603B\u6570" }),
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { className: "iad-number", children: "\u5931\u8D25" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { className: "iad-job-time", children: exploration ? "\u63D0\u4EA4\u65F6\u95F4" : "\u5F00\u59CB\u65F6\u95F4" }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("th", { children: "\u64CD\u4F5C" })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("tbody", { children: visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
                "tr",
                {
                  "data-selected": job?.run_id === item.run_id,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("td", { title: item.run_id, children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("span", { className: "iad-identifier", children: item.run_id }) }),
                    !exploration && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("td", { children: types[item.job_type] }),
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("td", { children: [
                      item.cancel_requested && (item.status === "RUNNING" || item.status === "PENDING") ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[item.status],
                      exploration && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("small", { className: "iad-job-stage", children: item.status === "PENDING" ? `\u6392\u961F\u7B2C ${item.queue_position} \u9879` : jobPhases[item.phase || ""] || item.message })
                    ] }),
                    exploration ? /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("td", { children: [
                      "\u826F\u54C1",
                      " ",
                      item.exploration_request?.normal_images.length ?? "\u2014",
                      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("br", {}),
                      "\u5F02\u5E38",
                      " ",
                      item.exploration_request?.defect_images.length ?? "\u2014"
                    ] }) : /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(import_jsx_runtime38.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("td", { className: "iad-number", children: [
                        item.completed,
                        " / ",
                        item.total_samples
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("td", { className: "iad-number", children: item.failed })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("td", { className: "iad-job-time", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
                      "time",
                      {
                        dateTime: (exploration ? item.submitted_at : item.started_at) || void 0,
                        children: (exploration ? item.submitted_at : item.started_at) ? new Date(
                          exploration ? item.submitted_at : item.started_at
                        ).toLocaleString() : "\u672A\u63D0\u4F9B"
                      }
                    ) }),
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
                      "button",
                      {
                        "aria-label": `\u67E5\u770B\u4F5C\u4E1A ${item.run_id}`,
                        onClick: () => workspace.updateView(pageId, { job: item.run_id }),
                        children: "\u8BE6\u60C5"
                      }
                    ) })
                  ]
                },
                item.run_id
              )) })
            ] }) }),
            !exploration || filtered.length > 10 ? /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
              Pagination,
              {
                total: filtered.length,
                page: current,
                size: 10,
                unit: "\u4E2A\u4F5C\u4E1A",
                onPage: setPage
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("p", { className: "iad-muted", children: [
              filtered.length,
              " \u4E2A\u4F5C\u4E1A \xB7 \u6700\u8FD1 30 \u9879\u53CA\u8FD0\u884C\u9879"
            ] }),
            !filtered.length && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { role: "status", children: "\u6CA1\u6709\u5339\u914D\u7684\u4F5C\u4E1A\u3002" })
          ] }),
          job && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("section", { "aria-label": "\u4F5C\u4E1A\u8BE6\u60C5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("h3", { children: "\u4F5C\u4E1A\u8BE6\u60C5" }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
              JobDetail,
              {
                job,
                onChanged,
                stale,
                lastSyncedAt,
                onCopy
              },
              job.run_id
            )
          ] })
        ]
      }
    );
  }

  // src/client/components/QualityReport.tsx
  var import_react35 = __toESM(__require("react"), 1);

  // src/client/components/ConsistencyReportSummary.tsx
  var import_jsx_runtime39 = __require("react/jsx-runtime");
  function ConsistencyReportSummary({ report, facts = "CURRENT", children }) {
    const statistics = report.statistics[facts === "CURRENT" ? "current" : facts === "HISTORICAL" ? "historical" : "unknown"];
    const execution = report.page.execution;
    const notStarted = execution.completed === 0 && execution.failed === 0 && execution.unsupported === 0;
    const complete = execution.total > 0 && execution.completed === execution.total;
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("section", { "aria-label": "\u8303\u56F4\u68C0\u67E5\u62A5\u544A", className: "iad-consistency-summary", children: /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-consistency-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("strong", { children: execution.total === 0 ? "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u56FE\u50CF" : notStarted ? "\u5C1A\u672A\u6267\u884C\u68C0\u67E5" : complete ? "\u68C0\u67E5\u5B8C\u6210" : "\u8303\u56F4\u68C0\u67E5\u4E0D\u5B8C\u6574" }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
        "\u8303\u56F4 ",
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("b", { children: execution.total }),
        " \u5F20"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
        "\u5DF2\u68C0\u67E5 ",
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("b", { children: [
          execution.completed,
          " / ",
          execution.total
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
        "\u4E25\u683C\u540C\u56FE ",
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("b", { children: statistics.strict_groups }),
        " \u7EC4 \xB7 ",
        statistics.strict_members,
        " \u6210\u5458"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
        "\u5F85\u590D\u6838 ",
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("b", { children: statistics.pending_review })
      ] }),
      !!execution.failed && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { className: "iad-error", children: [
        "\u5931\u8D25 ",
        execution.failed
      ] }),
      !!execution.unsupported && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
        "\u4E0D\u652F\u6301 ",
        execution.unsupported
      ] }),
      !!execution.pending && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
        "\u672A\u5904\u7406 ",
        execution.pending
      ] }),
      children,
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("details", { className: "iad-consistency-summary-details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("summary", { children: "\u68C0\u67E5\u660E\u7EC6" }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-consistency-summary-body", children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("p", { className: "iad-muted", children: [
            "\u68C0\u7D22\u5E93\u53EF\u7528 ",
            report.page.corpus.completed,
            "/",
            report.page.corpus.total,
            " \xB7 \u5F53\u524D\u7ED3\u679C ",
            report.page.facts.current,
            " \xB7 \u5386\u53F2\u7ED3\u679C ",
            report.page.facts.historical,
            " \xB7 \u65E0\u6CD5\u6838\u5B9E ",
            report.page.facts.unknown
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("strong", { children: [
              "\u4E25\u683C\u540C\u56FE ",
              statistics.strict_groups,
              " \u7EC4 \xB7 ",
              statistics.strict_members,
              " \u6210\u5458"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u8D28\u91CF\u51B2\u7A81 ",
              statistics.confirmed_quality_conflicts || 0
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u533A\u57DF\u5DEE\u5F02 ",
              statistics.regional_differences || 0
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u89C4\u8303\u5F85\u786E\u8BA4 ",
              statistics.policy_unknown || 0
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("p", { className: "iad-muted", children: [
            "\u5F85\u590D\u6838 ",
            statistics.pending_review ?? "\u672A\u8BC4\u4F30",
            " \xB7 \u5F85\u4FEE\u6B63 ",
            statistics.pending_correction ?? "\u672A\u8BC4\u4F30"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("p", { className: "iad-muted", children: [
            facts === "CURRENT" ? "\u5F53\u524D\u6765\u6E90" : facts === "HISTORICAL" ? "\u5386\u53F2\u6765\u6E90" : "\u65E0\u6CD5\u6838\u5B9E",
            " \xB7 \u6309\u5F53\u524D\u7B5B\u9009\u7EDF\u8BA1 \xB7 ",
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("time", { dateTime: report.page.observed_at, children: new Date(report.page.observed_at).toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("strong", { children: [
              "\u5F53\u524D\u8303\u56F4 Gold \xB7 ",
              report.gold.total,
              " \u5F20"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u53EF\u786E\u8BA4 ",
              report.gold.confirmed ?? "\u672A\u8BC4\u4F30"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u8D28\u91CF\u51B2\u7A81 ",
              report.gold.conflicts ?? "\u672A\u8BC4\u4F30"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u8BC1\u636E\u4E0D\u8DB3 ",
              report.gold.excluded ?? "\u672A\u8BC4\u4F30"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { children: [
              "\u4E0D\u53EF\u7EB3\u5165 ",
              report.gold_excluded ?? "\u672A\u8BC4\u4F30"
            ] })
          ] }),
          report.gold.unavailable_reason && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { className: "iad-muted", children: report.gold.unavailable_reason })
        ] })
      ] })
    ] }) });
  }

  // src/client/components/QualityReport.tsx
  var import_jsx_runtime40 = __require("react/jsx-runtime");
  function QualityReport({ report }) {
    const [consistency, setConsistency] = (0, import_react35.useState)(null), [consistencyError, setConsistencyError] = (0, import_react35.useState)("");
    (0, import_react35.useEffect)(() => {
      const controller = new AbortController();
      setConsistency(null);
      setConsistencyError("");
      if (report.dataset_id) request("/consistency/report", { selection: { kind: "scope", subjects: { kind: "datasets", dataset_ids: [report.dataset_id] } }, page_size: 1 }, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setConsistency(value);
      }).catch((error2) => {
        if (!controller.signal.aborted) setConsistencyError(message(error2));
      });
      return () => controller.abort();
    }, [report.dataset_id, report.generated_at]);
    const quality = report.quality;
    const dimensions = [
      ["\u6280\u672F\u53EF\u7528\u7387", quality.technical_usability],
      ["\u5BA1\u8BA1\u8986\u76D6\u7387", quality.audit_coverage],
      ["\u4EBA\u5DE5\u6838\u9A8C\u8986\u76D6\u7387", quality.human_verification_coverage]
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
      report.dataset_id && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { children: "\u6570\u636E\u4E00\u81F4\u6027\u4E0E Gold" }),
        consistency ? /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(ConsistencyReportSummary, { report: consistency }) : /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("p", { className: "iad-muted", children: consistencyError || "\u6B63\u5728\u8BFB\u53D6\u4E00\u81F4\u6027\u4E0E Gold \u8303\u56F4\u2026" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { children: "\u8986\u76D6\u4E0E\u53EF\u7528\u6027" }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dl", { children: dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_react35.default.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("strong", { children: ratio.percent === null ? "\u672A\u8BC4\u4F30" : `${ratio.percent}%` }),
          " \xB7 ",
          ratio.numerator,
          " / ",
          ratio.denominator
        ] })
      ] }, label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { children: "\u6A21\u578B\u89C2\u5BDF\u4E0E\u4EBA\u5DE5\u6838\u9A8C" }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dl", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u7591\u70B9\u56FE\u50CF / \u6570" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
          quality.model.suspect_samples,
          " / ",
          quality.model.finding_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u7F3A\u8BC1 / \u51B2\u7A81\u56FE\u50CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
          quality.model.missing_evidence_samples,
          " / ",
          quality.model.conflict_samples
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u6A21\u578B\u4E0D\u786E\u5B9A" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: quality.model.uncertain_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u65E0\u7ED3\u6784\u5316\u5206\u6790" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: quality.model.unstructured_samples }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u4EBA\u5BA1\u826F\u54C1 / \u5F02\u5E38" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
          "\u826F\u54C1 ",
          report.human_pass_count,
          " \xB7 \u5F02\u5E38 ",
          report.human_fail_count
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u4EBA\u5DE5\u5F85\u5B9A / \u8DF3\u8FC7" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
          report.human_uncertain_count,
          " / ",
          report.human_skipped_count
        ] })
      ] }),
      quality.label_comparison && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { children: "\u6807\u7B7E\u5BF9\u7167" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u6807\u7B7E\u4E0D\u4E00\u81F4\u6BD4\u4F8B" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("strong", { children: quality.label_comparison.inconsistency_ratio.percent === null ? "\u672A\u8BC4\u4F30" : `${quality.label_comparison.inconsistency_ratio.percent}%` }),
            " \xB7 ",
            quality.label_comparison.inconsistency_ratio.numerator,
            " / ",
            quality.label_comparison.inconsistency_ratio.denominator,
            quality.label_comparison.source_changed_count > 0 && ` (\u6392\u9664\u6765\u6E90\u53D8\u52A8 ${quality.label_comparison.source_changed_count})`
          ] }),
          quality.label_comparison.source_unverified_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u6765\u6E90\u6307\u7EB9\u672A\u8BB0\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
              quality.label_comparison.source_unverified_count,
              " \u5F20\u5386\u53F2\u5EFA\u8BAE\u4E0D\u53C2\u4E0E\u6807\u7B7E\u5BF9\u7167"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E\u5206\u5E03" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
            "\u826F\u54C1 ",
            quality.label_comparison.raw_ok,
            " \xB7 \u5F02\u5E38 ",
            quality.label_comparison.raw_ng,
            " \xB7 \u672A\u6807\u8BB0 ",
            quality.label_comparison.raw_unlabeled
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u6A21\u578B\u5EFA\u8BAE\u5206\u5E03" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
            "\u826F\u54C1 ",
            quality.label_comparison.model_pass,
            " \xB7 \u5F02\u5E38 ",
            quality.label_comparison.model_fail,
            " \xB7 \u5F85\u5B9A ",
            quality.label_comparison.model_uncertain,
            " \xB7 \u672A\u5BA1\u8BA1 ",
            quality.label_comparison.unaudited
          ] }),
          quality.label_comparison.source_changed_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u5BA1\u8BA1\u540E\u6765\u6E90\u53D8\u52A8" }),
            /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
              quality.label_comparison.source_changed_count,
              " \u5F20\u56FE\u50CF\u89C4\u5219\u6216\u6587\u4EF6\u5DF2\u66F4\u65B0\uFF0C\u4E0D\u53EF\u4F5C\u4E3A\u5F53\u524D\u6807\u7B7E\u6838\u9A8C\u4F9D\u636E"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("details", { className: "iad-analysis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("summary", { children: "\u53E3\u5F84\u3001\u8303\u56F4\u4E0E\u7248\u672C" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u8F93\u5165 / \u5DF2\u767B\u8BB0" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dd", { children: [
            quality.scope.observed_inputs,
            " / ",
            quality.scope.registered_samples,
            "\uFF0C\u672A\u767B\u8BB0 ",
            quality.scope.unregistered_inputs
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: "\u5168\u90E8\u5DF2\u4FDD\u5B58\u56FE\u50CF\uFF0C\u6BCF\u5F20\u53D6\u6700\u65B0\u8BB0\u5F55\uFF1B\u4E0D\u53D7\u5F53\u524D\u7F51\u683C\u7B5B\u9009\u5F71\u54CD\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u7EDF\u8BA1\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("time", { dateTime: report.generated_at, children: report.generated_at }) }),
          dimensions.map(([label, ratio]) => /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_react35.default.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: ratio.basis })
          ] }, label)),
          quality.label_comparison && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u6807\u7B7E\u5BF9\u7167\u53E3\u5F84" }),
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: quality.label_comparison.inconsistency_ratio.basis })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { children: "\u5BA1\u8BA1\u4F7F\u7528\u7684\u77E5\u8BC6\u7EC4\u5408" }),
        quality.knowledge_versions.length ? quality.knowledge_versions.map((usage, index3) => /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u56FE\u50CF\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: usage.sample_count }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: usage.normal_version_id || "\u672A\u8BB0\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u4E0D\u826F\u54C1\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: usage.defect_version_id || "\u672A\u4F7F\u7528" }),
          usage.legacy_profile_id && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dt", { children: "\u53C2\u8003\u6A21\u5F0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("dd", { children: usage.legacy_profile_id })
          ] })
        ] }, index3)) : /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("p", { children: "\u5C1A\u65E0\u53EF\u8FFD\u6EAF\u7684\u77E5\u8BC6\u7248\u672C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
        quality.audit_run_ids.length ? /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("ul", { children: quality.audit_run_ids.map((id) => /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("li", { children: id }, id)) }) : /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("p", { children: "\u5C1A\u65E0\u5DF2\u8BB0\u5F55\u7684\u5BA1\u8BA1\u4F5C\u4E1A\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("ul", { children: quality.scope.limitations.map((text) => /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("li", { children: text }, text)) })
      ] })
    ] });
  }

  // src/client/components/AuditJobs.tsx
  var import_jsx_runtime41 = __require("react/jsx-runtime");
  function AuditJobs(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-job-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }),
      /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(JobTable, { jobs: props.jobs, pageId: "industrial-audit", onChanged: props.onJobsChanged })
    ] });
  }
  function AuditReport({ dataset }) {
    const [report, setReport] = (0, import_react36.useState)(null);
    const [error2, setError] = (0, import_react36.useState)("");
    (0, import_react36.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("section", { className: "iad-job-section iad-quality-report", children: [
      /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }),
        report && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { onClick: download, children: "\u5BFC\u51FA JSON" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { className: "iad-muted", children: "\u5168\u90E8\u6570\u636E\u96C6\u56FE\u50CF \xB7 \u6BCF\u56FE\u6700\u65B0\u5DF2\u4FDD\u5B58\u8BB0\u5F55 \xB7 \u4E0D\u53D7\u7F51\u683C\u7B5B\u9009\u5F71\u54CD" }),
      !report && !error2 && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u6570\u636E\u96C6\u62A5\u544A\u2026" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      report && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(import_jsx_runtime41.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(QualityReport, { report }) })
    ] });
  }

  // src/client/components/KnowledgeConflictReview.tsx
  var import_react37 = __require("react");
  var import_jsx_runtime42 = __require("react/jsx-runtime");
  var states = { pending_review: "\u5F85\u4EBA\u5DE5\u786E\u8BA4", pending_recheck: "\u5F85\u91CD\u6838\u9A8C", resolved: "\u5DF2\u751F\u6548" };
  var actions = { retain: "\u4FDD\u7559\u5224\u636E", revise: "\u4FEE\u8BA2\u5224\u636E", retire: "\u9000\u5F79\u5224\u636E", need_evidence: "\u8981\u6C42\u8865\u8BC1" };
  function KnowledgeConflictReview({ datasetId }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-review");
    const [loading, setLoading] = (0, import_react37.useState)(true), [contextLoading, setContextLoading] = (0, import_react37.useState)(false), [page, setPage] = (0, import_react37.useState)(1);
    const [state, setState] = (0, import_react37.useState)("");
    const [items, setItems] = (0, import_react37.useState)([]);
    const [context, setContext] = (0, import_react37.useState)(null);
    const [error2, setError] = (0, import_react37.useState)(""), [revision, setRevision] = (0, import_react37.useState)(0), [busy, setBusy] = (0, import_react37.useState)(false);
    const [reviewer, setReviewer] = (0, import_react37.useState)(""), [reason, setReason] = (0, import_react37.useState)(""), [instruction, setInstruction] = (0, import_react37.useState)("");
    const [action, setAction] = (0, import_react37.useState)("retain");
    const [pending, setPending] = (0, import_react37.useState)(null);
    const [lightbox, setLightbox] = (0, import_react37.useState)(null);
    (0, import_react37.useEffect)(() => {
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
    (0, import_react37.useEffect)(() => {
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
      const submission = pending || { ...context.reference, submission_id: v4_default(), context_signature: context.context_signature, reviewer, action, instruction: action === "revise" ? instruction : "", reason };
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
    return /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("section", { className: "iad-job-section", "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u590D\u6838", children: [
      error2 && /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("p", { role: "alert", className: "iad-error", children: [
        error2,
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(IconButton, { label: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6\u51B2\u7A81", onClick: () => setRevision((value) => value + 1), children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(RefreshIcon, {}) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("label", { className: "iad-field", children: [
        "\u72B6\u6001",
        /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u72B6\u6001", value: state, onChange: (event) => {
          setState(event.target.value);
          setPage(1);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
          Object.entries(states).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("option", { value, children: label }, value))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { className: "iad-conflict-workspace", children: [
        /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { className: "iad-check-list", "aria-label": "\u77E5\u8BC6\u51B2\u7A81\u961F\u5217", children: [
            filtered.slice((page - 1) * 10, page * 10).map((item) => /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(
              "button",
              {
                "aria-pressed": selected?.conflict_id === item.conflict_id,
                onClick: () => workspace.updateView("industrial-review", { conflictId: item.conflict_id, version: item.version_id }),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("strong", { children: item.description }),
                  /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("span", { children: [
                    item.kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38",
                    " \xB7 ",
                    states[item.state]
                  ] })
                ]
              },
              item.conflict_id
            )),
            !loading && !filtered.length && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { children: "\u6682\u65E0\u5339\u914D\u7684\u77E5\u8BC6\u51B2\u7A81\u3002" }),
            loading && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51B2\u7A81\u961F\u5217\u2026" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Pagination, { total: filtered.length, page, size: 10, unit: "\u9879\u51B2\u7A81", onPage: setPage })
        ] }),
        contextLoading && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51B2\u7A81\u8BC1\u636E\u2026" }),
        context && /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { className: "iad-conflict-detail", children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("article", { "aria-label": "\u51B2\u7A81\u8BC1\u636E", children: [
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h2", { children: "\u77E5\u8BC6\u51B2\u7A81" }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { role: "status", "data-field": "knowledge-review-state", children: states[context.state] }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { children: context.conflict.description }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("p", { children: [
              "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
              context.conflict.normal_explanation || "\u672A\u63D0\u4F9B"
            ] }),
            context.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h3", { children: check.title }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { children: check.criterion }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("p", { className: "iad-muted", children: [
                check.subject,
                " \xB7 ",
                check.location
              ] })
            ] }, check.check_id)),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("section", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h3", { children: "\u65B0\u56FE\u8BC1\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(KnowledgeEvidenceGallery, { versionId: context.reference.version_id, items: context.evidence.filter((item) => context.conflict.new_evidence_ids.includes(item.image.evidence_id)), onOpen: setLightbox })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("section", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h3", { children: "\u5386\u53F2\u6BD4\u8F83\u8BC1\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(KnowledgeEvidenceGallery, { versionId: context.reference.version_id, items: context.evidence.filter((item) => context.conflict.comparison_evidence_ids.includes(item.image.evidence_id)), onOpen: setLightbox })
            ] }),
            context.evidence.some((item) => ![...context.conflict.new_evidence_ids, ...context.conflict.comparison_evidence_ids].includes(item.image.evidence_id)) && /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("summary", { children: "\u5224\u636E\u7684\u5176\u4ED6\u5F15\u7528" }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(KnowledgeEvidenceGallery, { versionId: context.reference.version_id, items: context.evidence.filter((item) => ![...context.conflict.new_evidence_ids, ...context.conflict.comparison_evidence_ids].includes(item.image.evidence_id)), onOpen: setLightbox })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { className: "iad-muted", children: context.conflict.limitations.join("\uFF1B") }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId, selected: context.conflict.sample_id, tab: "results" }), children: "\u590D\u6838\u6B64\u56FE\u50CF" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("aside", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E\u9762\u677F", children: [
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h2", { children: "\u77E5\u8BC6\u5904\u7F6E" }),
            !context.is_latest && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { role: "status", children: "\u6B63\u5728\u67E5\u770B\u5386\u53F2\u51B2\u7A81\uFF0C\u63D0\u4EA4\u524D\u8BF7\u8BFB\u53D6\u5F53\u524D\u7248\u672C\u3002" }),
            !context.source_current && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { role: "status", children: "\u6765\u6E90\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u9A8C\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("form", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E", onSubmit: (event) => {
              event.preventDefault();
              void submit();
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("fieldset", { className: "iad-disposition-fields", disabled: busy || !!pending || !context.is_latest || !context.source_current, children: [
                /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("label", { className: "iad-field", children: [
                  "\u590D\u6838\u4EBA",
                  /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("input", { "aria-label": "\u77E5\u8BC6\u590D\u6838\u4EBA", required: true, value: reviewer, onChange: (event) => setReviewer(event.target.value) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("label", { className: "iad-field", children: [
                  "\u77E5\u8BC6\u5904\u7F6E",
                  /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("select", { "aria-label": "\u77E5\u8BC6\u5904\u7F6E\u65B9\u5F0F", value: action, onChange: (event) => setAction(event.target.value), children: Object.entries(actions).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("option", { value, children: label }, value)) })
                ] }),
                action === "revise" && /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("label", { className: "iad-field", children: [
                  "\u5F85\u6838\u9A8C\u4FEE\u8BA2",
                  /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("textarea", { "aria-label": "\u77E5\u8BC6\u4FEE\u8BA2\u5EFA\u8BAE", required: true, value: instruction, onChange: (event) => setInstruction(event.target.value) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("label", { className: "iad-field", children: [
                  "\u539F\u56E0",
                  /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("textarea", { "aria-label": "\u77E5\u8BC6\u590D\u6838\u539F\u56E0", required: true, value: reason, onChange: (event) => setReason(event.target.value) })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("button", { type: "submit", className: "iad-primary", disabled: busy || !context.is_latest || !context.source_current || !pending && (!reviewer.trim() || !reason.trim() || action === "revise" && !instruction.trim()), children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : pending ? "\u91CD\u8BD5\u76F8\u540C\u63D0\u4EA4" : "\u63D0\u4EA4\u77E5\u8BC6\u5904\u7F6E" }) })
            ] }),
            context.state === "pending_recheck" && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-knowledge", datasetId, knowledgeKind: items.find((item) => item.conflict_id === context.reference.conflict_id)?.kind || "normal", miningPreset: context.reference.version_id, scopeRunId: context.scope_run_id || "", miningSourceMode: "all", miningContinuous: false, version: "", tab: "setup" }), children: "\u9009\u62E9\u56FE\u50CF\u91CD\u6838\u9A8C" }),
            !!context.events.length && /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("summary", { children: [
                "\u5904\u7F6E\u8BB0\u5F55 \xB7 ",
                context.events.length,
                " \u6B21"
              ] }),
              context.events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("p", { children: [
                  actions[event.action],
                  " \xB7 ",
                  event.reviewer
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("p", { children: event.instruction || event.reason }),
                /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("time", { dateTime: event.created_at, children: new Date(event.created_at).toLocaleString() })
              ] }, event.submission_id))
            ] })
          ] })
        ] })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/ExplorationPage.tsx
  var import_react44 = __require("react");

  // src/client/useJobs.ts
  var import_react38 = __require("react");
  function useJobs(kind, datasetId, onProgress, selectedRunId = "", refreshRevision = 0) {
    const identity = `${kind}:${datasetId}`;
    const [snapshot, setSnapshot] = (0, import_react38.useState)({
      identity,
      jobs: [],
      pendingCount: 0,
      error: "",
      lastSyncedAt: null,
      syncState: "syncing"
    });
    const [revision, setRevision] = (0, import_react38.useState)(0);
    const observed = (0, import_react38.useRef)({ identity: "", signature: "" });
    const refresh = (0, import_react38.useCallback)(() => setRevision((value) => value + 1), []);
    (0, import_react38.useEffect)(() => {
      const controller = new AbortController();
      if (observed.current.identity !== identity) {
        observed.current = { identity, signature: "" };
        setSnapshot({
          identity,
          jobs: [],
          pendingCount: 0,
          error: "",
          lastSyncedAt: null,
          syncState: "syncing"
        });
      }
      if (!datasetId) return;
      let timer, reading = false, active = true, failures = 0;
      let currentRequest;
      async function poll() {
        if (reading || controller.signal.aborted || document.hidden) return;
        reading = true;
        currentRequest = new AbortController();
        const readingController = currentRequest;
        const timeout = setTimeout(() => readingController.abort(), 1e4);
        setSnapshot(
          (previous) => previous.identity === identity ? { ...previous, syncState: previous.error ? "stale" : "syncing" } : previous
        );
        try {
          const result = await request(
            `/${kind}/jobs?dataset_id=${encodeURIComponent(datasetId)}`,
            void 0,
            void 0,
            readingController.signal
          );
          if (selectedRunId && !result.jobs.some((job) => job.run_id === selectedRunId)) {
            const selected = await request(
              `/${kind}/status/${encodeURIComponent(selectedRunId)}`,
              void 0,
              void 0,
              readingController.signal
            );
            if (selected.dataset_id !== datasetId)
              throw new Error("\u6240\u9009\u4F5C\u4E1A\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6570\u636E\u96C6");
            result.jobs.push(selected);
          }
          if (controller.signal.aborted) return;
          if (readingController.signal.aborted) throw new Error("\u72B6\u6001\u8BFB\u53D6\u8D85\u65F6");
          const signature = JSON.stringify(
            result.jobs.filter(
              (job) => kind === "audit" || !["RUNNING", "PENDING"].includes(job.status) || job.knowledge_version_id || job.exploration_version_id
            ).map((job) => [
              job.run_id,
              job.status,
              job.completed,
              job.failed,
              job.knowledge_version_id,
              job.exploration_version_id
            ]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))
          );
          if (observed.current.signature && observed.current.signature !== signature)
            onProgress();
          observed.current = { identity, signature };
          setSnapshot({
            identity,
            jobs: result.jobs,
            pendingCount: result.pending_count || 0,
            error: "",
            lastSyncedAt: Date.now(),
            syncState: "current"
          });
          active = result.jobs.some(
            (job) => ["RUNNING", "PENDING"].includes(job.status)
          );
          failures = 0;
        } catch (error2) {
          if (!controller.signal.aborted) {
            failures++;
            setSnapshot(
              (previous) => previous.identity === identity ? {
                ...previous,
                syncState: "stale",
                error: readingController.signal.aborted ? "\u72B6\u6001\u8BFB\u53D6\u8D85\u8FC7 10 \u79D2\uFF0C\u8BF7\u91CD\u8BD5\u3002" : message(error2)
              } : previous
            );
          }
        } finally {
          clearTimeout(timeout);
          reading = false;
          if (!controller.signal.aborted)
            timer = setTimeout(
              poll,
              failures ? Math.min(1e4, 1200 * 2 ** failures) : active ? 1200 : 5e3
            );
        }
      }
      const foreground = () => {
        if (!document.hidden) {
          clearTimeout(timer);
          void poll();
        }
      };
      document.addEventListener("visibilitychange", foreground);
      void poll();
      return () => {
        controller.abort();
        currentRequest?.abort();
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", foreground);
      };
    }, [
      identity,
      kind,
      datasetId,
      onProgress,
      revision,
      selectedRunId,
      refreshRevision
    ]);
    const current = snapshot.identity === identity ? snapshot : {
      identity,
      jobs: [],
      pendingCount: 0,
      error: "",
      lastSyncedAt: null,
      syncState: "syncing"
    };
    return { ...current, refresh };
  }

  // src/client/components/DirectionDetail.tsx
  var import_react39 = __toESM(__require("react"), 1);
  var import_jsx_runtime43 = __require("react/jsx-runtime");
  function ReferencedText({
    text,
    references,
    onReference
  }) {
    if (!references.size) return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_jsx_runtime43.Fragment, { children: text });
    const ids = [...references.keys()].sort((a, b) => b.length - a.length).map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(
      `(?<![A-Za-z0-9_:/.-])(${ids.join("|")})(?![A-Za-z0-9_:/.-])`,
      "g"
    );
    return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_jsx_runtime43.Fragment, { children: text.split(pattern).map(
      (part, index3) => references.has(part) ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
        "button",
        {
          className: "iad-evidence-ref",
          "aria-label": `\u5B9A\u4F4D\u8BC1\u636E ${references.get(part)}`,
          onClick: () => onReference(part),
          children: references.get(part)
        },
        index3
      ) : /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_react39.default.Fragment, { children: part }, index3)
    ) });
  }
  function DirectionDetail({
    snapshot,
    direction,
    onClose,
    onGo
  }) {
    const [imageIndex, setImageIndex] = (0, import_react39.useState)(null), [expanded, setExpanded] = (0, import_react39.useState)(false), [focused, setFocused] = (0, import_react39.useState)("");
    const [destination, setDestination] = (0, import_react39.useState)(
      direction.applies_to === "defect" ? "defect" : "normal"
    );
    const [promptOpen, setPromptOpen] = (0, import_react39.useState)(false), [promptRevision, setPromptRevision] = (0, import_react39.useState)(0), [frozenPrompt, setFrozenPrompt] = (0, import_react39.useState)(
      snapshot.request.prompt || null
    ), [promptError, setPromptError] = (0, import_react39.useState)(""), [promptLoading, setPromptLoading] = (0, import_react39.useState)(false);
    (0, import_react39.useEffect)(() => {
      if (!promptOpen || frozenPrompt) return;
      const controller = new AbortController();
      setPromptLoading(true);
      setPromptError("");
      request(
        `/exploration/status/${encodeURIComponent(snapshot.run_id)}`,
        void 0,
        void 0,
        controller.signal
      ).then((job) => {
        if (!controller.signal.aborted) {
          setPromptLoading(false);
          setFrozenPrompt(job.exploration_prompt);
          if (!job.exploration_prompt) setPromptError("\u539F\u4EFB\u52A1\u672A\u8BB0\u5F55\u63D0\u793A\u8BCD\u3002");
        }
      }).catch((error2) => {
        if (!controller.signal.aborted) setPromptError(message(error2));
      }).finally(() => {
        if (!controller.signal.aborted) setPromptLoading(false);
      });
      return () => controller.abort();
    }, [promptOpen, promptRevision, snapshot.run_id, frozenPrompt]);
    const buttons = (0, import_react39.useRef)(/* @__PURE__ */ new Map());
    const normals = new Set(
      snapshot.normal_sources.map((source) => source.sample_id)
    ), defects = new Set(
      snapshot.defect_sources.map((source) => source.sample_id)
    );
    const counters = { normal: 0, defect: 0, unknown: 0 };
    const entries = direction.evidence_ids.map((id) => {
      const evidence = snapshot.evidence.find(
        (item) => item.image.evidence_id === id
      );
      if (!evidence)
        return {
          id,
          evidence: null,
          label: "\u8BC1\u636E\u7F3A\u5931",
          kind: "unknown"
        };
      const kind = normals.has(evidence.sample_id) ? "normal" : defects.has(evidence.sample_id) ? "defect" : "unknown";
      const label = { normal: "\u826F\u54C1 N", defect: "\u5F02\u5E38 A", unknown: "\u8BC1\u636E E" }[kind] + ++counters[kind];
      return { id, evidence, label, kind };
    });
    const references = /* @__PURE__ */ new Map(), referenceTargets = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (!entry.evidence) continue;
      references.set(entry.id, entry.label);
      referenceTargets.set(entry.id, entry.id);
      if (entries.filter(
        (item) => item.evidence?.sample_id === entry.evidence.sample_id
      ).length === 1) {
        references.set(entry.evidence.sample_id, entry.label);
        referenceTargets.set(entry.evidence.sample_id, entry.id);
      }
    }
    const collection = {
      title: direction.title,
      instruction: direction.instruction,
      index: imageIndex || 0,
      images: entries.flatMap(
        (entry) => entry.evidence ? [
          {
            id: entry.id,
            originalSize: entry.evidence.image.original_size,
            label: entry.label,
            group: entry.kind === "normal" ? "\u5019\u9009\u826F\u54C1" : entry.kind === "defect" ? "\u5019\u9009\u5F02\u5E38" : "\u5176\u4ED6\u8BC1\u636E",
            image: {
              src: `/api/iad/exploration/evidence/${encodeURIComponent(snapshot.version_id)}/${encodeURIComponent(entry.id)}`,
              title: entry.evidence.sample_id.startsWith(
                snapshot.dataset_id + ":"
              ) ? entry.evidence.sample_id.slice(
                snapshot.dataset_id.length + 1
              ) : entry.evidence.sample_id,
              width: entry.evidence.image.sent_size[0],
              height: entry.evidence.image.sent_size[1]
            }
          }
        ] : []
      )
    };
    (0, import_react39.useEffect)(() => {
      if (focused) {
        const element = buttons.current.get(focused);
        element?.scrollIntoView({ block: "nearest" });
        element?.focus({ preventScroll: true });
      }
    }, [focused, expanded]);
    const locate = (id) => {
      setExpanded(true);
      setFocused(referenceTargets.get(id) || id);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
        Modal,
        {
          title: direction.title,
          className: "iad-direction-dialog",
          onClose,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("div", { className: "iad-direction-body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("div", { className: "iad-direction-meta", children: [
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { children: "\u5019\u9009\u65B9\u5411" }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { children: direction.applies_to === "both" ? "\u826F\u54C1\u4E0E\u5F02\u5E38" : direction.applies_to === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38" }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("span", { title: snapshot.version_id, children: [
                  "\u6765\u6E90 ",
                  snapshot.created_at.slice(0, 19).replace("T", " ")
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { className: "iad-direction-objective", children: [
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("h3", { children: "\u89C2\u5BDF\u76EE\u6807" }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                  ReferencedText,
                  {
                    text: direction.instruction,
                    references,
                    onReference: locate
                  }
                ) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("div", { className: "iad-direction-text-grid", children: [
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("h3", { children: "\u6BD4\u8F83\u4F9D\u636E" }),
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                    ReferencedText,
                    {
                      text: direction.rationale,
                      references,
                      onReference: locate
                    }
                  ) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("h3", { children: "\u9650\u5236\u4E0E\u5F85\u786E\u8BA4" }),
                  direction.limitations.length ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("ul", { children: direction.limitations.map((text, index3) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                    ReferencedText,
                    {
                      text,
                      references,
                      onReference: locate
                    }
                  ) }, index3)) }) : /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { className: "iad-muted", children: "\u672A\u8BB0\u5F55\u9650\u5236\u3002" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { className: "iad-direction-evidence", children: [
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("h3", { children: [
                  "\u56FE\u50CF\u8BC1\u636E \xB7 ",
                  entries.length
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                  "div",
                  {
                    className: "iad-evidence-groups",
                    style: {
                      "--iad-normal-width": `${Math.max(counters.normal, 1)}fr`,
                      "--iad-defect-width": `${Math.max(counters.defect, 1)}fr`
                    },
                    children: [
                      ["normal", "\u5019\u9009\u826F\u54C1"],
                      ["defect", "\u5019\u9009\u5F02\u5E38"],
                      ["unknown", "\u5176\u4ED6\u4E0E\u7F3A\u5931"]
                    ].map(([kind, label]) => {
                      const group = entries.filter((entry) => entry.kind === kind);
                      return !!group.length && /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { className: "iad-evidence-group", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("h4", { children: [
                          label,
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("span", { children: [
                            group.length,
                            " \u5F20"
                          ] })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(MediaLoad, { className: "iad-evidence-thumbnails", children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                          "div",
                          {
                            style: {
                              "--iad-evidence-columns": Math.min(
                                group.length,
                                8
                              )
                            },
                            children: group.slice(0, expanded ? void 0 : 8).map((entry) => {
                              const item = collection.images.find(
                                (item2) => item2.id === entry.id
                              );
                              return item ? /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
                                "button",
                                {
                                  ref: (element) => {
                                    if (element)
                                      buttons.current.set(entry.id, element);
                                    else buttons.current.delete(entry.id);
                                  },
                                  className: "iad-direction-evidence-item",
                                  "data-focused": focused === entry.id,
                                  "aria-label": `\u67E5\u770B\u8BC1\u636E ${entry.label}`,
                                  onClick: () => setImageIndex(
                                    collection.images.indexOf(item)
                                  ),
                                  children: [
                                    /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                                      MediaImage,
                                      {
                                        src: item.image.src,
                                        alt: item.label,
                                        loading: "lazy"
                                      }
                                    ),
                                    /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("strong", { children: item.label }),
                                    /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { title: item.image.title, children: item.image.title })
                                  ]
                                },
                                entry.id
                              ) : /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
                                "div",
                                {
                                  className: "iad-missing-evidence",
                                  role: "status",
                                  children: [
                                    "\u8BC1\u636E\u7F3A\u5931",
                                    /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("code", { children: entry.id })
                                  ]
                                },
                                entry.id
                              );
                            })
                          }
                        ) }),
                        !expanded && group.length > 8 && /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("button", { onClick: () => setExpanded(true), children: [
                          "\u5C55\u5F00\u66F4\u591A \xB7 ",
                          group.length - 8,
                          " \u5F20"
                        ] })
                      ] }, kind);
                    })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("details", { className: "iad-direction-trace", children: [
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("summary", { children: "\u5B8C\u6574 ID \u4E0E\u6765\u6E90\u660E\u7EC6" }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("dl", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("dt", { children: "\u65B9\u5411 ID" }),
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("dd", { children: direction.direction_id }),
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("dt", { children: "\u7248\u672C ID" }),
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("dd", { children: snapshot.version_id }),
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("dt", { children: "\u4F5C\u4E1A ID" }),
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("dd", { children: snapshot.run_id })
                ] }),
                entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("p", { children: [
                  entry.label,
                  " \xB7 ",
                  entry.id,
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("br", {}),
                  entry.evidence?.sample_id || "\u672A\u8BB0\u5F55\u6765\u6E90"
                ] }, entry.id)),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
                  "details",
                  {
                    open: promptOpen,
                    onToggle: (event) => setPromptOpen(event.currentTarget.open),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("summary", { children: "\u63A2\u7D22\u51BB\u7ED3\u63D0\u793A\u8BCD" }),
                      promptLoading ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u539F\u4EFB\u52A1\u63D0\u793A\u8BCD\u2026" }) : frozenPrompt ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("pre", { className: "iad-observation", children: frozenPrompt.text }) : /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("p", { children: [
                        promptError || "\u672A\u8BB0\u5F55",
                        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(IconButton, { label: "\u91CD\u65B0\u8BFB\u53D6\u63D0\u793A\u8BCD", onClick: () => setPromptRevision((value) => value + 1), children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(RefreshIcon, {}) })
                      ] })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("footer", { className: "iad-direction-footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { onClick: onClose, children: "\u8FD4\u56DE" }),
              onGo && /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("label", { className: "iad-direction-destination", children: [
                  "\u7528\u4E8E\u77E5\u8BC6\u7C7B\u578B",
                  /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                    "select",
                    {
                      "aria-label": "\u91C7\u7528\u77E5\u8BC6\u7C7B\u578B",
                      value: destination,
                      onChange: (event) => setDestination(event.target.value),
                      children: [
                        ["normal", "\u826F\u54C1"],
                        ["defect", "\u5F02\u5E38"]
                      ].filter(
                        ([kind]) => direction.applies_to === "both" || direction.applies_to === kind
                      ).map(([kind, label]) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("option", { value: kind, children: label }, kind))
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("button", { className: "iad-primary", onClick: () => onGo(destination), children: "\u53BB\u77E5\u8BC6\u6316\u6398" })
              ] })
            ] })
          ]
        }
      ),
      imageIndex !== null && collection.images[imageIndex] && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
        ImageViewer,
        {
          image: collection.images[imageIndex].image,
          collection,
          onClose: () => setImageIndex(null)
        }
      )
    ] });
  }

  // src/client/components/ExplorationSetup.tsx
  var import_react43 = __require("react");

  // src/client/components/ExplorationSources.tsx
  var import_react41 = __require("react");

  // src/client/components/SourcePicker.tsx
  var import_react40 = __require("react");
  var import_jsx_runtime44 = __require("react/jsx-runtime");
  function SourcePicker({ dataset, label, sources, selected, target, disabled, page, onPage, onChange, search, onSearch, onChoose, choosing = false, canChoose = true }) {
    const [open, setOpen] = (0, import_react40.useState)(false), [selectedOnly, setSelectedOnly] = (0, import_react40.useState)(false), [selectedPage, setSelectedPage] = (0, import_react40.useState)(1);
    const [selectedSearch, setSelectedSearch] = (0, import_react40.useState)("");
    const [image, setImage] = (0, import_react40.useState)(null);
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
      return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { type: "button", "aria-label": `\u653E\u5927\u6837\u4F8B ${path}`, onClick: () => setImage({ src: mediaUrl(sample, "image"), title: path }), children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("img", { src: mediaUrl(sample, "thumbnail"), alt: path, loading: "lazy" }) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-source-picker", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("p", { role: "status", children: [
        "\u5DF2\u9009 ",
        selected.length,
        " / ",
        target || "\u2014",
        " \u5F20",
        sources ? ` \xB7 \u53EF\u7528 ${sources.total}` : ""
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { className: "iad-source-preview", children: selected.slice(0, 4).map((id) => /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { children: [
        thumbnail(id, name2(id)),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { title: name2(id), children: name2(id).split("/").pop() })
      ] }, id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("button", { type: "button", disabled, onClick: () => show(false), children: [
          "\u9009\u62E9",
          label,
          "\u56FE\u50CF"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("button", { type: "button", disabled: !selected.length || disabled, onClick: () => show(true), children: [
          "\u67E5\u770B\u5168\u90E8\u5DF2\u9009",
          label
        ] })
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(Modal, { title: `\u9009\u62E9${label}\u56FE\u50CF`, onClose: () => setOpen(false), className: "iad-source-dialog", children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { className: "iad-field", children: [
            "\u641C\u7D22\u56FE\u50CF",
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { type: "search", "aria-label": `\u641C\u7D22${label}\u56FE\u50CF`, value: selectedOnly ? selectedSearch : search, onChange: (event) => {
              if (selectedOnly) {
                setSelectedSearch(event.target.value);
                setSelectedPage(1);
              } else onSearch(event.target.value);
            } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { type: "checkbox", checked: selectedOnly, onChange: (event) => {
              setSelectedOnly(event.target.checked);
              setSelectedPage(1);
            } }),
            "\u4EC5\u5DF2\u9009"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("span", { children: [
            "\u5DF2\u9009 ",
            selected.length,
            " / ",
            target || "\u2014",
            " \u5F20"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-row", children: [
          onChoose && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { type: "button", disabled: disabled || choosing || !canChoose, onClick: onChoose, children: choosing ? "\u9009\u62E9\u4E2D\u2026" : "\u6309\u6570\u91CF\u9009\u62E9" }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("button", { type: "button", disabled: disabled || choosing || !selected.length, onClick: () => onChange([]), children: [
            "\u6E05\u7A7A",
            label,
            "\u9009\u62E9"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("fieldset", { disabled: disabled || choosing, className: "iad-source-candidates", children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("legend", { children: [
            label,
            "\u56FE\u50CF"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { className: "iad-source-grid", children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "iad-source-option", children: [
            thumbnail(item.sample_id, item.relative_path),
            /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("label", { title: item.relative_path, children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", { type: "checkbox", "aria-label": `\u9009\u62E9${label} ${item.relative_path}`, checked: selected.includes(item.sample_id), onChange: (event) => onChange(event.target.checked ? [...selected, item.sample_id] : selected.filter((id) => id !== item.sample_id)) }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("span", { children: item.relative_path.split("/").pop() })
            ] })
          ] }, item.sample_id)) }),
          !items.length && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { role: "status", children: selectedOnly ? "\u6CA1\u6709\u5339\u914D\u7684\u5DF2\u9009\u56FE\u50CF\u3002" : sources ? "\u6CA1\u6709\u5339\u914D\u7684\u5408\u683C\u6765\u6E90\u3002" : "\u6B63\u5728\u8BFB\u53D6\u6765\u6E90\u2026" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(Pagination, { total: selectedOnly ? chosen.length : sources?.total || 0, page: selectedOnly ? current : page, size: 10, unit: "\u5F20", onPage: selectedOnly ? setSelectedPage : onPage }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { className: "iad-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", { type: "button", disabled: choosing, onClick: () => setOpen(false), children: "\u5B8C\u6210\u9009\u62E9" }) })
      ] }),
      image && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(ImageViewer, { image, onClose: () => setImage(null) })
    ] });
  }

  // src/client/components/ExplorationSources.tsx
  var import_jsx_runtime45 = __require("react/jsx-runtime");
  function ExplorationSources({ dataset, kind, count: count2, images, disabled, onCount, onImages, onSelecting }) {
    const label = kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38";
    const [page, setPage] = (0, import_react41.useState)(1), [sources, setSources] = (0, import_react41.useState)(null);
    const [error2, setError] = (0, import_react41.useState)(""), [selecting, setSelecting] = (0, import_react41.useState)(false), [search, setSearch] = (0, import_react41.useState)("");
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, search });
    (0, import_react41.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("section", { className: "iad-info-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("h3", { children: [
        label,
        "\u6837\u4F8B"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("fieldset", { disabled: disabled || selecting, children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("label", { className: "iad-field iad-short-field", children: [
          "\u76EE\u6807\u6570\u91CF",
          /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("input", { type: "number", min: "1", "aria-label": `${label}\u56FE\u50CF\u6570\u91CF`, value: count2, onChange: (e) => onCount(e.target.value) })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(SourcePicker, { dataset, label, sources, selected: images, target: count2, disabled, choosing: selecting, canChoose: Number.isInteger(Number(count2)) && Number(count2) > 0, onChoose: () => void select(), page, onPage: setPage, onChange: onImages, search, onSearch: (value) => {
          setSearch(value);
          setPage(1);
        } })
      ] })
    ] });
  }

  // src/client/components/ExplorationPromptEditor.tsx
  var import_react42 = __require("react");
  var import_jsx_runtime46 = __require("react/jsx-runtime");
  function ExplorationPromptEditor({
    presets,
    value,
    base,
    disabled,
    onChange,
    onCreated
  }) {
    const [replace, setReplace] = (0, import_react42.useState)(null);
    const [saving, setSaving] = (0, import_react42.useState)(false), [dialog, setDialog] = (0, import_react42.useState)(false), [name2, setName] = (0, import_react42.useState)(""), [error2, setError] = (0, import_react42.useState)("");
    const alive = (0, import_react42.useRef)(true);
    (0, import_react42.useEffect)(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    const modified = value.text !== base;
    function choose(preset) {
      onChange(
        { preset_id: preset.id, preset_name: preset.name, text: preset.text },
        preset.text
      );
    }
    function confirm(preset) {
      if (modified) setReplace(preset);
      else choose(preset);
    }
    async function save() {
      setSaving(true);
      setError("");
      try {
        const preset = await request(
          "/exploration/presets",
          { name: name2, text: value.text }
        );
        if (alive.current) {
          onCreated(preset);
          choose(preset);
          setDialog(false);
        }
      } catch (error3) {
        if (alive.current) setError(message(error3));
      } finally {
        if (alive.current) setSaving(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(import_jsx_runtime46.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "iad-prompt-controls", children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("label", { className: "iad-field", children: [
          "\u63D0\u793A\u8BCD\u9884\u8BBE",
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(
            "select",
            {
              "aria-label": "\u63D0\u793A\u8BCD\u9884\u8BBE",
              disabled,
              value: value.preset_id || "",
              onChange: (event) => {
                const preset = presets.find(
                  (item) => item.id === event.target.value
                );
                if (preset) confirm(preset);
              },
              children: [
                !presets.some((item) => item.id === value.preset_id) && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("option", { value: value.preset_id || "", children: value.preset_name || "\u81EA\u5B9A\u4E49\u63D0\u793A\u8BCD" }),
                presets.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("option", { value: preset.id, children: preset.name }, preset.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { className: "iad-muted", children: modified ? "\u5DF2\u4FEE\u6539" : "\u4F7F\u7528\u9884\u8BBE\u5185\u5BB9" }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
          "button",
          {
            disabled: disabled || !modified || !presets.some((p) => p.id === value.preset_id),
            onClick: () => confirm(presets.find((p) => p.id === value.preset_id)),
            children: "\u91CD\u7F6E\u4E3A\u9884\u8BBE"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
          "button",
          {
            disabled: disabled || !value.text.trim(),
            onClick: () => {
              setName("");
              setError("");
              setDialog(true);
            },
            children: "\u53E6\u5B58\u4E3A\u65B0\u9884\u8BBE"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("label", { className: "iad-field", children: [
        "\u63D0\u793A\u8BCD\u6B63\u6587",
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
          "textarea",
          {
            "aria-label": "\u63D0\u793A\u8BCD\u6B63\u6587",
            rows: 8,
            disabled,
            value: value.text,
            onChange: (event) => onChange({ ...value, text: event.target.value }, base)
          }
        )
      ] }),
      replace && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(
        Modal,
        {
          title: "\u66FF\u6362\u5F53\u524D\u63D0\u793A\u8BCD\uFF1F",
          onClose: () => setReplace(null),
          className: "iad-confirm-dialog",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: "\u5F53\u524D\u6B63\u6587\u5DF2\u4FEE\u6539\u3002\u66FF\u6362\u6B63\u6587\u4F1A\u4FDD\u7559\u8865\u5145\u76EE\u6807\u548C\u4E24\u7EC4\u56FE\u50CF\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "iad-form-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("button", { onClick: () => setReplace(null), children: "\u4FDD\u7559\u5F53\u524D\u7F16\u8F91" }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
                "button",
                {
                  className: "iad-primary",
                  onClick: () => {
                    choose(replace);
                    setReplace(null);
                  },
                  children: "\u66FF\u6362\u4E3A\u6240\u9009\u9884\u8BBE"
                }
              )
            ] })
          ]
        }
      ),
      dialog && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(
        Modal,
        {
          title: "\u4FDD\u5B58\u63D0\u793A\u8BCD\u9884\u8BBE",
          onClose: () => {
            if (!saving) setDialog(false);
          },
          className: "iad-confirm-dialog",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("label", { className: "iad-field", children: [
              "\u9884\u8BBE\u540D\u79F0",
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
                "input",
                {
                  "aria-label": "\u9884\u8BBE\u540D\u79F0",
                  value: name2,
                  disabled: saving,
                  onChange: (event) => setName(event.target.value)
                }
              )
            ] }),
            error2 && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { role: "alert", children: error2 }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "iad-form-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("button", { disabled: saving, onClick: () => setDialog(false), children: "\u53D6\u6D88" }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
                "button",
                {
                  disabled: saving || !name2.trim() || !value.text.trim(),
                  className: "iad-primary",
                  onClick: () => void save(),
                  children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u9884\u8BBE"
                }
              )
            ] })
          ]
        }
      )
    ] });
  }

  // src/client/components/ExplorationSetup.tsx
  var import_jsx_runtime47 = __require("react/jsx-runtime");
  function ExplorationSetup({
    dataset,
    jobs,
    refreshRevision
  }) {
    const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
    const model = useWorkbenchModel();
    const [presets, setPresets] = (0, import_react43.useState)([]), [presetError, setPresetError] = (0, import_react43.useState)("");
    const [error2, setError] = (0, import_react43.useState)(""), [busy, setBusy] = (0, import_react43.useState)(false), [normalSelecting, setNormalSelecting] = (0, import_react43.useState)(false), [defectSelecting, setDefectSelecting] = (0, import_react43.useState)(false), [preview, setPreview] = (0, import_react43.useState)(false), [uncertainAfter, setUncertainAfter] = (0, import_react43.useState)(null);
    const [enteredAt] = (0, import_react43.useState)(Date.now);
    const alive = (0, import_react43.useRef)(true);
    (0, import_react43.useEffect)(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    (0, import_react43.useEffect)(() => jobs.refresh(), [jobs.refresh]);
    (0, import_react43.useEffect)(() => {
      const controller = new AbortController();
      request(
        "/exploration/presets",
        void 0,
        void 0,
        controller.signal
      ).then((value) => {
        if (controller.signal.aborted) return;
        setPresets(value.presets);
        setPresetError("");
        const current = workspace.view(pageId);
        const original = value.presets.find(
          (preset) => preset.id === current.explorationPrompt?.preset_id
        );
        if (current.explorationPrompt && !current.explorationPromptBase && original && workspace.getSnapshot().datasetId === dataset.dataset_id)
          workspace.updateView(
            pageId,
            { explorationPromptBase: original.text },
            true
          );
        if (!workspace.view(pageId).explorationPrompt && workspace.getSnapshot().datasetId === dataset.dataset_id) {
          const preset = value.presets[0];
          workspace.updateView(
            pageId,
            {
              explorationPrompt: {
                preset_id: preset.id,
                preset_name: preset.name,
                text: preset.text
              },
              explorationPromptBase: preset.text
            },
            true
          );
        }
      }).catch((error3) => {
        if (!controller.signal.aborted) setPresetError(message(error3));
      });
      return () => controller.abort();
    }, [dataset.dataset_id, workspace, refreshRevision]);
    const active = jobs.jobs.find((job) => job.status === "RUNNING"), occupied = active || jobs.pendingCount > 0;
    const normalCount = Number(view.explorationNormalCount), defectCount = Number(view.explorationDefectCount);
    const valid = Number.isInteger(normalCount) && normalCount > 0 && Number.isInteger(defectCount) && defectCount > 0 && view.explorationNormalImages.length === normalCount && view.explorationDefectImages.length === defectCount;
    const unconfirmed = uncertainAfter !== null && (!jobs.lastSyncedAt || jobs.lastSyncedAt < uncertainAfter);
    const reason = busy ? "\u6B63\u5728\u63D0\u4EA4\u672C\u6B21\u63A2\u7D22\u3002" : normalSelecting || defectSelecting ? "\u8BF7\u5148\u5B8C\u6210\u56FE\u7EC4\u9009\u62E9\u3002" : jobs.syncState === "stale" || !jobs.lastSyncedAt || jobs.lastSyncedAt < enteredAt || unconfirmed ? "\u8BF7\u5148\u540C\u6B65\u4F5C\u4E1A\u72B6\u6001\uFF0C\u786E\u8BA4\u5DF2\u6709\u63D0\u4EA4\u3002" : !view.explorationPrompt?.text.trim() ? "\u8BF7\u586B\u5199\u63D0\u793A\u8BCD\u6B63\u6587\u3002" : !valid ? "\u8BF7\u6309\u76EE\u6807\u6570\u91CF\u9009\u62E9\u4E24\u7EC4\u56FE\u50CF\u3002" : !model.ready ? "\u8BF7\u5148\u914D\u7F6E\u5DE5\u4F5C\u53F0\u6A21\u578B\u3002" : "";
    async function run() {
      setBusy(true);
      setError("");
      try {
        const job = await request("/exploration/start", {
          dataset_id: dataset.dataset_id,
          normal_images: view.explorationNormalImages,
          defect_images: view.explorationDefectImages,
          prompt: view.explorationPrompt,
          ...view.explorationObjective.trim() ? { objective: view.explorationObjective } : {}
        });
        if (!alive.current) return;
        const current = workspace.getSnapshot();
        if (current.datasetId === dataset.dataset_id && current.pageId === pageId)
          workspace.updateView(pageId, { job: job.run_id, tab: "jobs" });
        jobs.refresh();
      } catch (error3) {
        if (alive.current) {
          setError(message(error3));
          setUncertainAfter(Date.now());
          jobs.refresh();
        }
      } finally {
        if (alive.current) setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
      error2 && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-exploration-setup-layout", "aria-label": "\u65B9\u5411\u63A2\u7D22\u914D\u7F6E", children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-exploration-fields iad-panel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-setup-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "1. \u63A2\u7D22\u63D0\u793A\u8BCD" }),
            presetError && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { role: "alert", children: presetError }),
            view.explorationPrompt ? /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
              ExplorationPromptEditor,
              {
                presets,
                value: view.explorationPrompt,
                base: view.explorationPromptBase,
                disabled: busy,
                onChange: (explorationPrompt, explorationPromptBase) => {
                  if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                    workspace.updateView(
                      pageId,
                      { explorationPrompt, explorationPromptBase },
                      true
                    );
                },
                onCreated: (preset) => setPresets((values) => [...values, preset])
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u63D0\u793A\u8BCD\u9884\u8BBE\u2026" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("label", { className: "iad-field", children: [
              "\u8865\u5145\u76EE\u6807\uFF08\u53EF\u9009\uFF09",
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                "textarea",
                {
                  "aria-label": "\u65B9\u5411\u63A2\u7D22\u76EE\u6807",
                  disabled: busy,
                  value: view.explorationObjective,
                  rows: 2,
                  onChange: (event) => workspace.updateView(
                    pageId,
                    { explorationObjective: event.target.value },
                    true
                  )
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-setup-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "2. \u5BF9\u6BD4\u6837\u4F8B" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-exploration-groups", children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                ExplorationSources,
                {
                  dataset,
                  kind: "normal",
                  disabled: busy,
                  count: view.explorationNormalCount,
                  images: view.explorationNormalImages,
                  onCount: (explorationNormalCount) => workspace.updateView(pageId, { explorationNormalCount }),
                  onImages: (explorationNormalImages) => {
                    if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                      workspace.updateView(pageId, { explorationNormalImages });
                  },
                  onSelecting: setNormalSelecting
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                ExplorationSources,
                {
                  dataset,
                  kind: "defect",
                  disabled: busy,
                  count: view.explorationDefectCount,
                  images: view.explorationDefectImages,
                  onCount: (explorationDefectCount) => workspace.updateView(pageId, { explorationDefectCount }),
                  onImages: (explorationDefectImages) => {
                    if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                      workspace.updateView(pageId, { explorationDefectImages });
                  },
                  onSelecting: setDefectSelecting
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("aside", { className: "iad-exploration-side", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-panel", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "3. \u8FD0\u884C\u786E\u8BA4" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(WorkbenchModelStatus, {}),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("dl", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("dt", { children: "\u63D0\u793A\u8BCD" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("dd", { children: [
                view.explorationPrompt?.preset_name || "\u81EA\u5B9A\u4E49\u63D0\u793A\u8BCD",
                view.explorationPrompt && view.explorationPrompt.text !== view.explorationPromptBase && " \xB7 \u5DF2\u4FEE\u6539"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("dt", { children: "\u8F93\u5165\u56FE\u7EC4" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("dd", { children: [
                "\u826F\u54C1 ",
                view.explorationNormalImages.length,
                " \xB7 \u5F02\u5E38",
                " ",
                view.explorationDefectImages.length
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("dt", { children: "\u6267\u884C\u65B9\u5F0F" }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("dd", { children: "\u5168\u90E8\u56FE\u50CF\u4E00\u6B21\u8054\u5408\u8F93\u5165" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
              "button",
              {
                disabled: !view.explorationPrompt,
                onClick: () => setPreview(true),
                children: "\u67E5\u770B\u672C\u6B21\u6267\u884C\u6587\u672C"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "iad-form-footer", children: [
              reason && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: reason }),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                "button",
                {
                  className: "iad-primary",
                  disabled: !!reason,
                  onClick: () => void run(),
                  children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : occupied ? "\u52A0\u5165\u961F\u5217" : "\u5F00\u59CB\u63A2\u7D22"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("section", { className: "iad-panel iad-execution-rail", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("h3", { children: "\u8FD0\u884C\u961F\u5217" }),
            active ? /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                ExplorationProgress,
                {
                  job: active,
                  stale: jobs.syncState === "stale",
                  lastSyncedAt: jobs.lastSyncedAt
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
                "button",
                {
                  onClick: () => workspace.updateView(pageId, {
                    tab: "jobs",
                    job: active.run_id
                  }),
                  children: "\u67E5\u770B\u8FD0\u884C\u72B6\u6001"
                }
              )
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "iad-muted", children: "\u6682\u65E0\u8FD0\u884C\u4EFB\u52A1\u3002" }),
            jobs.pendingCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { children: [
              "\u6392\u961F ",
              jobs.pendingCount,
              " \u9879"
            ] })
          ] })
        ] })
      ] }),
      " ",
      preview && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(Modal, { title: "\u672C\u6B21\u63A2\u7D22\u63D0\u793A\u8BCD", onClose: () => setPreview(false), children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("pre", { className: "iad-observation", children: [
          view.explorationPrompt?.text,
          view.explorationObjective.trim() && `

\u8865\u5145\u76EE\u6807\uFF1A${view.explorationObjective}`
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => setPreview(false), children: "\u5173\u95ED" })
      ] })
    ] });
  }

  // src/client/components/JobSync.tsx
  var import_jsx_runtime48 = __require("react/jsx-runtime");
  function JobSync({
    syncState,
    lastSyncedAt,
    error: error2,
    refresh,
    label = "\u63A2\u7D22\u72B6\u6001\u540C\u6B65"
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(
      "div",
      {
        className: "iad-job-sync",
        "data-state": syncState,
        "aria-label": label,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { role: "status", children: syncState === "stale" ? "\u540C\u6B65\u5931\u8D25\uFF0C\u5F53\u524D\u4E3A\u4E0A\u6B21\u5FEB\u7167" : syncState === "syncing" ? "\u6B63\u5728\u540C\u6B65\u72B6\u6001" : "\u81EA\u52A8\u540C\u6B65\u6B63\u5E38" }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("span", { className: "iad-muted", children: [
            "\u6700\u8FD1\u6210\u529F\u54CD\u5E94\uFF1A",
            lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : "\u5C1A\u672A\u540C\u6B65"
          ] }),
          error2 && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { children: error2 }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(IconButton, { label: syncState === "stale" ? "\u91CD\u8BD5\u540C\u6B65" : "\u5237\u65B0\u72B6\u6001", onClick: refresh, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(RefreshIcon, {}) })
        ]
      }
    );
  }

  // src/client/components/ExplorationPage.tsx
  var import_jsx_runtime49 = __require("react/jsx-runtime");
  function ExplorationPage({
    dataset,
    refreshRevision,
    headerActions
  }) {
    const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
    const [catalog, setCatalog] = (0, import_react44.useState)(null), [revision, setRevision] = (0, import_react44.useState)(0);
    const [error2, setError] = (0, import_react44.useState)("");
    const [detail, setDetail] = (0, import_react44.useState)(null);
    const changed = (0, import_react44.useCallback)(() => setRevision((value) => value + 1), []);
    const jobs = useJobs(
      "exploration",
      dataset.dataset_id,
      changed,
      view.job,
      refreshRevision
    );
    (0, import_react44.useEffect)(() => {
      const controller = new AbortController();
      const query = new URLSearchParams({ dataset_id: dataset.dataset_id });
      if (view.version) query.set("version_id", view.version);
      request(
        `/exploration?${query}`,
        void 0,
        void 0,
        controller.signal
      ).then((value) => {
        if (!controller.signal.aborted) {
          setCatalog(
            (previous) => !view.version && previous?.exploration ? { ...value, exploration: previous.exploration } : value
          );
          setError("");
        }
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [dataset.dataset_id, view.version, revision, refreshRevision]);
    const active = jobs.jobs.find((job) => job.status === "RUNNING");
    function refresh() {
      jobs.refresh();
      changed();
    }
    function copy(job) {
      const input = job.exploration_request;
      if (!input) return;
      const prompt = job.exploration_prompt;
      workspace.updateView(pageId, {
        tab: "setup",
        explorationNormalImages: [...input.normal_images],
        explorationDefectImages: [...input.defect_images],
        explorationNormalCount: String(input.normal_images.length),
        explorationDefectCount: String(input.defect_images.length),
        explorationObjective: input.objective || "",
        explorationPrompt: prompt,
        explorationPromptBase: prompt?.preset_id ? "" : prompt?.text || ""
      });
    }
    const result = catalog?.exploration, latest = catalog?.versions[0];
    return /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "iad-exploration-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(
        WorkbenchHeader,
        {
          pageId,
          title: view.tab === "setup" ? "\u65B0\u5EFA\u63A2\u7D22" : void 0,
          children: [
            headerActions,
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              "button",
              {
                className: view.tab === "setup" ? "" : "iad-primary",
                onClick: () => workspace.updateView(pageId, {
                  tab: view.tab === "setup" ? "results" : "setup"
                }),
                children: view.tab === "setup" ? "\u8FD4\u56DE\u63A2\u7D22\u7ED3\u679C" : "\u65B0\u5EFA\u63A2\u7D22"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(JobSync, { ...jobs, refresh }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      view.tab === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
        ExplorationSetup,
        {
          dataset,
          jobs,
          refreshRevision
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
        PageTabs,
        {
          label: "\u65B9\u5411\u63A2\u7D22\u89C6\u56FE",
          items: [
            { id: "results", label: "\u63A2\u7D22\u7ED3\u679C" },
            { id: "jobs", label: "\u63A2\u7D22\u4F5C\u4E1A" }
          ],
          value: view.tab,
          onChange: (tab) => workspace.updateView(pageId, { tab }),
          children: view.tab === "jobs" ? /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("section", { className: "iad-job-section", children: [
            /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "iad-section-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h2", { children: "\u63A2\u7D22\u4F5C\u4E1A" }),
              /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("span", { children: [
                "\u6392\u961F ",
                jobs.pendingCount,
                " \u9879"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              JobTable,
              {
                jobs: jobs.jobs,
                pageId,
                onChanged: jobs.refresh,
                stale: jobs.syncState === "stale",
                lastSyncedAt: jobs.lastSyncedAt,
                onCopy: copy
              }
            )
          ] }) : !result ? /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "iad-empty", children: [
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h2", { children: active || jobs.pendingCount ? "\u63A2\u7D22\u6B63\u5728\u8FDB\u884C" : "\u5C1A\u65E0\u63A2\u7D22\u7ED3\u679C" }),
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { children: active || jobs.pendingCount ? "\u6574\u7EC4\u7ED3\u679C\u8FD4\u56DE\u540E\u53D1\u5E03\u65B9\u5411\u3002" : "\u9009\u62E9\u826F\u54C1\u548C\u5F02\u5E38\u6837\u4F8B\uFF0C\u5EFA\u7ACB\u9002\u5408\u5F53\u524D\u6570\u636E\u96C6\u7684\u63A2\u7D22\u65B9\u5411\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              "button",
              {
                className: "iad-primary",
                onClick: () => workspace.updateView(pageId, {
                  tab: active || jobs.pendingCount ? "jobs" : "setup"
                }),
                children: active || jobs.pendingCount ? "\u67E5\u770B\u8FD0\u884C\u72B6\u6001" : "\u65B0\u5EFA\u63A2\u7D22"
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("section", { className: "iad-exploration-results", children: [
            /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "iad-section-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h2", { children: "\u5019\u9009\u65B9\u5411" }),
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
                "select",
                {
                  "aria-label": "\u63A2\u7D22\u7ED3\u679C\u7248\u672C",
                  value: result.version_id,
                  onChange: (event) => workspace.updateView(pageId, {
                    version: event.target.value
                  }),
                  children: catalog.versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("option", { value: version.version_id, children: [
                    version.created_at.slice(0, 19).replace("T", " "),
                    " \xB7",
                    " ",
                    version.direction_count,
                    " \u9879\u65B9\u5411"
                  ] }, version.version_id))
                }
              )
            ] }),
            latest && latest.version_id !== result.version_id && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              "button",
              {
                onClick: () => workspace.updateView(pageId, { version: latest.version_id }),
                children: "\u67E5\u770B\u65B0\u53D1\u5E03\u7ED3\u679C"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { className: "iad-muted", children: result.summary }),
            result.directions.length ? /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u63A2\u7D22\u65B9\u5411", children: [
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("th", { children: "\u65B9\u5411" }),
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("th", { children: "\u9002\u7528\u77E5\u8BC6" }),
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("th", { className: "iad-number", children: "\u8BC1\u636E" }),
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("th", { children: "\u64CD\u4F5C" })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("tbody", { children: result.directions.map((direction) => /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("strong", { children: direction.title }) }),
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("td", { children: direction.applies_to === "both" ? "\u826F\u54C1\u4E0E\u5F02\u5E38" : direction.applies_to === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38" }),
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("td", { className: "iad-number", children: direction.evidence_ids.length }),
                /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
                  "button",
                  {
                    onClick: () => setDetail({ snapshot: result, direction }),
                    children: "\u67E5\u770B\u65B9\u5411"
                  }
                ) })
              ] }, direction.direction_id)) })
            ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { children: "\u672C\u6279\u6837\u4F8B\u672A\u5F62\u6210\u53EF\u7528\u63A2\u7D22\u65B9\u5411\u3002" }),
            !!result.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("summary", { children: "\u6574\u4F53\u9650\u5236" }),
              result.limitations.map((text, index3) => /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { children: text }, index3))
            ] })
          ] })
        }
      ),
      detail && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
        DirectionDetail,
        {
          ...detail,
          onClose: () => setDetail(null),
          onGo: (kind) => workspace.openLocation({
            pageId: "industrial-knowledge",
            datasetId: dataset.dataset_id,
            knowledgeKind: kind,
            explorationVersion: detail.snapshot.version_id,
            directionFocus: detail.direction.direction_id,
            tab: "setup"
          })
        }
      )
    ] });
  }

  // src/client/components/KnowledgeVersions.tsx
  var import_react45 = __require("react");
  var import_jsx_runtime50 = __require("react/jsx-runtime");
  function KnowledgeVersions({ versions, onSelect }) {
    const [page, setPage] = (0, import_react45.useState)(1);
    const current = Math.min(page, Math.max(1, Math.ceil(versions.length / 10)));
    return /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)(import_jsx_runtime50.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u77E5\u8BC6\u7248\u672C\u5217\u8868", children: [
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("th", { children: "\u7248\u672C" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("th", { className: "iad-number", children: "\u6765\u6E90" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("th", { className: "iad-number", children: "\u5224\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("th", { children: "\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("th", { children: "\u4F9D\u636E" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("tbody", { children: versions.slice((current - 1) * 10, current * 10).map((version) => /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("button", { title: version.version_id, className: "iad-identifier", onClick: () => onSelect(version.version_id), children: version.version_id }) }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("td", { className: "iad-number", children: version.source_count }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("td", { className: "iad-number", children: version.check_count }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("time", { dateTime: version.created_at, children: new Date(version.created_at).toLocaleString() }) }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("summary", { children: "\u7248\u672C\u5173\u7CFB" }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("dl", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("dt", { children: "\u7236\u7248\u672C" }),
              /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("dd", { children: version.parent_version_id || "\u65E0" }),
              /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("dt", { children: "\u826F\u54C1\u57FA\u51C6" }),
              /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("dd", { children: version.normal_version_id || "\u672A\u4F7F\u7528" })
            ] })
          ] }) })
        ] }, version.version_id)) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Pagination, { total: versions.length, page: current, size: 10, unit: "\u4E2A\u7248\u672C", onPage: setPage })
    ] });
  }

  // src/client/components/KnowledgePage.tsx
  var import_react50 = __require("react");

  // src/client/components/KnowledgeScopePanel.tsx
  var import_react46 = __require("react");
  var import_jsx_runtime51 = __require("react/jsx-runtime");
  function KnowledgeScopePanel({ scopeRunId, datasetId, kind, revision, onScope }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-knowledge");
    const [scope, setScope] = (0, import_react46.useState)(null), [error2, setError] = (0, import_react46.useState)(""), [busy, setBusy] = (0, import_react46.useState)(false);
    const update = (0, import_react46.useCallback)((value) => {
      if (value.dataset_id !== datasetId || value.kind !== kind) throw new Error("\u8303\u56F4\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6570\u636E\u96C6\u548C\u77E5\u8BC6\u7C7B\u578B");
      onScope(value);
      setScope(value);
      setError("");
    }, [onScope, datasetId, kind]);
    (0, import_react46.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("section", { className: "iad-job-section", "aria-label": "\u8FDE\u7EED\u6765\u6E90\u8303\u56F4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("h2", { children: "\u8FDE\u7EED\u8303\u56F4" }),
        scope && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { "data-field": "knowledge-scope-state", children: scope.status === "STOPPED" ? "\u5DF2\u505C\u6B62" : scope.active_run_ids.length ? "\u6267\u884C\u4E2D" : !scope.unprocessed ? "\u89C2\u5BDF\u5B8C\u6210" : "\u5F85\u7EE7\u7EED" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !scope && !error2 && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8303\u56F4\u2026" }),
      scope && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("p", { role: "status", "aria-atomic": "true", "aria-label": "\u8FDE\u7EED\u8303\u56F4\u8FDB\u5EA6", children: [
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
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { disabled: busy, onClick: () => void change(scope.status === "STOPPED" ? "resume" : "stop"), children: scope.status === "STOPPED" ? "\u7EE7\u7EED\u8303\u56F4" : "\u505C\u6B62\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { disabled: busy, onClick: () => workspace.updateView("industrial-knowledge", { tab: "setup", scopeRunId, scopeSessionId: view.scopeRunId === scopeRunId ? view.scopeSessionId : "", miningPreset: scope.current_version_id || "", normalVersion: scope.normal_version_id || "", miningImages: [], miningPage: 1 }), children: "\u9009\u62E9\u6B64\u8303\u56F4" }),
          scope.current_version_id && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { onClick: () => workspace.updateView("industrial-knowledge", { version: scope.current_version_id || "", tab: "results" }), children: "\u67E5\u770B\u8303\u56F4\u77E5\u8BC6" }),
          view.scopeSessionId && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { onClick: () => void workspace.openSession(view.scopeSessionId), children: "\u67E5\u770B\u4F1A\u8BDD" }),
          scope.status === "STOPPED" && view.scopeRunId && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { onClick: () => workspace.updateView("industrial-knowledge", { scopeRunId: "", scopeSessionId: "", miningContinuous: false, miningImages: [] }), children: "\u8FD4\u56DE\u5355\u7EC4\u914D\u7F6E" })
        ] })
      ] })
    ] });
  }

  // src/client/components/KnowledgeSetup.tsx
  var import_react49 = __require("react");

  // src/client/components/KnowledgeDirections.tsx
  var import_react48 = __require("react");

  // src/client/components/MiningDirectionList.tsx
  var import_react47 = __require("react");
  var import_jsx_runtime52 = __require("react/jsx-runtime");
  function MiningDirectionList({
    configuration,
    catalog,
    opening,
    focusId,
    savedRevision,
    onChange,
    onSource
  }) {
    const { workspace, state } = useWorkspace(), view = workspace.view("industrial-knowledge"), kind = state.knowledgeKind;
    const draft = configuration;
    const focusTarget = (0, import_react47.useRef)(null);
    const [category, setCategory] = (0, import_react47.useState)(
      view.explorationVersion ? "explored" : "preset"
    ), [search, setSearch] = (0, import_react47.useState)(""), [selectedOnly, setSelectedOnly] = (0, import_react47.useState)(false);
    const [editing, setEditing] = (0, import_react47.useState)(null);
    const [title, setTitle] = (0, import_react47.useState)(""), [instruction, setInstruction] = (0, import_react47.useState)(""), [adding, setAdding] = (0, import_react47.useState)(false);
    const candidates = catalog?.exploration?.directions.filter(
      (item) => item.applies_to === "both" || item.applies_to === kind
    ) || [];
    const rows = [
      ...draft?.directions || [],
      ...candidates.filter(
        (item) => !draft?.directions.some(
          (row) => row.direction_id === item.direction_id
        )
      ).map((item) => ({
        direction_id: item.direction_id,
        title: item.title,
        instruction: item.instruction,
        enabled: false,
        origin: "explored"
      }))
    ];
    const visible = rows.filter(
      (item) => item.origin === category && (!selectedOnly || item.enabled) && `${item.title}
${item.instruction}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    );
    const focusOrigin = rows.find(
      (item) => item.direction_id === focusId
    )?.origin;
    (0, import_react47.useEffect)(() => {
      if (focusOrigin) setCategory(focusOrigin);
    }, [focusId, focusOrigin]);
    (0, import_react47.useEffect)(() => {
      if (focusId) focusTarget.current?.scrollIntoView({ block: "nearest" });
    }, [category, focusId, catalog]);
    (0, import_react47.useEffect)(() => {
      setEditing(null);
    }, [savedRevision]);
    function change(item, patch) {
      if (!draft) return;
      const exists = draft.directions.some(
        (row) => row.direction_id === item.direction_id
      );
      onChange({
        ...draft,
        directions: exists ? draft.directions.map(
          (row) => row.direction_id === item.direction_id ? { ...row, ...patch } : row
        ) : [...draft.directions, { ...item, ...patch }]
      });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(import_jsx_runtime52.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { className: "iad-direction-tabs", children: [
        ["preset", "\u901A\u7528"],
        ["explored", "\u63A2\u7D22"],
        ["dataset", "\u81EA\u5B9A\u4E49"]
      ].map(([origin, label]) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(
        "button",
        {
          "aria-label": `${label}\u65B9\u5411`,
          "aria-pressed": category === origin,
          onClick: () => setCategory(origin),
          children: [
            label,
            " ",
            rows.filter((item) => item.origin === origin).length
          ]
        },
        origin
      )) }),
      category === "explored" && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field iad-exploration-version", children: [
        "\u63A2\u7D22\u7248\u672C",
        /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(
          "select",
          {
            "aria-label": "\u9009\u7528\u63A2\u7D22\u7248\u672C",
            value: catalog?.exploration?.version_id || "",
            onChange: (event) => workspace.updateView("industrial-knowledge", {
              explorationVersion: event.target.value
            }),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("option", { value: "", disabled: true, children: "\u5C1A\u65E0\u63A2\u7D22\u7ED3\u679C" }),
              catalog?.versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("option", { value: version.version_id, children: [
                version.created_at.slice(0, 19).replace("T", " "),
                " \xB7",
                " ",
                version.direction_count,
                " \u9879"
              ] }, version.version_id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-direction-tools", children: [
        /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
          "\u641C\u7D22\u65B9\u5411",
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
            "input",
            {
              type: "search",
              "aria-label": "\u641C\u7D22\u6316\u6398\u65B9\u5411",
              value: search,
              onChange: (event) => setSearch(event.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
            "input",
            {
              type: "checkbox",
              checked: selectedOnly,
              onChange: (event) => setSelectedOnly(event.target.checked)
            }
          ),
          "\u4EC5\u770B\u5DF2\u9009"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
          "button",
          {
            onClick: () => {
              setTitle("");
              setInstruction("");
              setAdding(true);
            },
            children: "\u6DFB\u52A0\u65B9\u5411"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("p", { className: "iad-muted", children: [
        "\u663E\u793A ",
        visible.length,
        " \u9879 \xB7 \u5DF2\u9009",
        " ",
        draft.directions.filter((item) => item.enabled).length,
        " \u9879"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { className: "iad-direction-list", children: visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(
        "div",
        {
          ref: focusId === item.direction_id ? focusTarget : void 0,
          "data-focused": focusId === item.direction_id,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-direction-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                "input",
                {
                  type: "checkbox",
                  "aria-label": `${draft.directions.some((row) => row.direction_id === item.direction_id) ? "\u542F\u7528\u65B9\u5411" : "\u542F\u7528\u63A2\u7D22\u65B9\u5411"} ${item.title}`,
                  checked: item.enabled,
                  onChange: (event) => change(item, { enabled: event.target.checked })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-direction-label", children: [
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("strong", { children: item.title }),
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { title: item.instruction, children: item.instruction })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-direction-actions", children: [
                item.origin === "explored" && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                  "button",
                  {
                    disabled: opening === item.direction_id,
                    onClick: () => void onSource(item.direction_id),
                    children: "\u67E5\u770B\u6765\u6E90"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                  IconButton,
                  {
                    label: `\u7F16\u8F91\u65B9\u5411 ${item.title}`,
                    disabled: !!editing && editing.original.direction_id !== item.direction_id,
                    onClick: () => setEditing({
                      original: { ...item },
                      existed: draft.directions.some(
                        (row) => row.direction_id === item.direction_id
                      )
                    }),
                    children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(EditIcon, {})
                  }
                )
              ] })
            ] }),
            editing?.original.direction_id === item.direction_id && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-direction-editor", children: [
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                "\u540D\u79F0",
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                  "input",
                  {
                    "aria-label": `\u65B9\u5411\u540D\u79F0 ${item.direction_id}`,
                    value: item.title,
                    onChange: (event) => change(item, { title: event.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
                "\u89C2\u5BDF\u8BF4\u660E",
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                  "textarea",
                  {
                    "aria-label": `\u65B9\u5411\u8BF4\u660E ${item.direction_id}`,
                    rows: 4,
                    value: item.instruction,
                    onChange: (event) => change(item, { instruction: event.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "iad-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("button", { onClick: () => setEditing(null), children: "\u5B8C\u6210\u7F16\u8F91" }),
                /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                  "button",
                  {
                    onClick: () => {
                      onChange({
                        ...draft,
                        directions: editing.existed ? draft.directions.map(
                          (row) => row.direction_id === item.direction_id ? editing.original : row
                        ) : draft.directions.filter(
                          (row) => row.direction_id !== item.direction_id
                        )
                      });
                      setEditing(null);
                    },
                    children: "\u53D6\u6D88\u672C\u884C\u7F16\u8F91"
                  }
                ),
                draft.directions.some(
                  (row) => row.direction_id === item.direction_id
                ) && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                  IconButton,
                  {
                    label: `\u5220\u9664\u65B9\u5411 ${item.title}`,
                    title: "\u5220\u9664\u65B9\u5411",
                    onClick: () => {
                      onChange({
                        ...draft,
                        directions: draft.directions.filter(
                          (row) => row.direction_id !== item.direction_id
                        )
                      });
                      setEditing(null);
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(DeleteIcon, {})
                  }
                )
              ] })
            ] })
          ]
        },
        item.direction_id
      )) }),
      !visible.length && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { className: "iad-muted", children: "\u6CA1\u6709\u5339\u914D\u7684\u65B9\u5411\u3002" }),
      adding && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(
        Modal,
        {
          title: "\u6DFB\u52A0\u81EA\u5B9A\u4E49\u65B9\u5411",
          onClose: () => setAdding(false),
          className: "iad-direction-add",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
              "\u540D\u79F0",
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                "input",
                {
                  "aria-label": "\u65B0\u65B9\u5411\u540D\u79F0",
                  value: title,
                  onChange: (event) => setTitle(event.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("label", { className: "iad-field", children: [
              "\u89C2\u5BDF\u8BF4\u660E",
              /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
                "textarea",
                {
                  "aria-label": "\u65B0\u65B9\u5411\u8BF4\u660E",
                  rows: 3,
                  value: instruction,
                  onChange: (event) => setInstruction(event.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
              "button",
              {
                disabled: !title.trim() || !instruction.trim(),
                onClick: () => {
                  onChange({
                    ...draft,
                    directions: [
                      ...draft.directions,
                      {
                        direction_id: v4_default(),
                        title: title.trim(),
                        instruction: instruction.trim(),
                        enabled: true,
                        origin: "dataset"
                      }
                    ]
                  });
                  setCategory("dataset");
                  setAdding(false);
                },
                children: "\u6DFB\u52A0\u6570\u636E\u96C6\u65B9\u5411"
              }
            )
          ]
        }
      )
    ] });
  }

  // src/client/components/KnowledgeDirections.tsx
  var import_jsx_runtime53 = __require("react/jsx-runtime");
  function KnowledgeDirections({
    datasetId,
    kind,
    proposal,
    onPending,
    onProposalUsed,
    onState
  }) {
    const { workspace } = useWorkspace(), view = workspace.view("industrial-knowledge");
    const [catalog, setCatalog] = (0, import_react48.useState)(null), [catalogError, setCatalogError] = (0, import_react48.useState)("");
    const [saved, setSaved] = (0, import_react48.useState)(null), [draft, setDraft] = (0, import_react48.useState)(null);
    const [error2, setError] = (0, import_react48.useState)(""), [saving, setSaving] = (0, import_react48.useState)(false), [revision, setRevision] = (0, import_react48.useState)(0);
    const [focus, setFocus] = (0, import_react48.useState)("");
    const [confirmation, setConfirmation] = (0, import_react48.useState)(null), [preview, setPreview] = (0, import_react48.useState)(null);
    const [source, setSource] = (0, import_react48.useState)(null), [opening, setOpening] = (0, import_react48.useState)("");
    const applied = (0, import_react48.useRef)(""), alive = (0, import_react48.useRef)(true);
    const query = new URLSearchParams({ dataset_id: datasetId, kind }).toString();
    (0, import_react48.useEffect)(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    (0, import_react48.useEffect)(() => {
      const controller = new AbortController();
      setCatalogError("");
      setCatalog(null);
      const params = new URLSearchParams({ dataset_id: datasetId });
      if (view.explorationVersion)
        params.set("version_id", view.explorationVersion);
      request(
        `/exploration?${params}`,
        void 0,
        void 0,
        controller.signal
      ).then((value) => {
        if (!controller.signal.aborted) setCatalog(value);
      }).catch((error3) => {
        if (!controller.signal.aborted) setCatalogError(message(error3));
      });
      return () => controller.abort();
    }, [datasetId, view.explorationVersion]);
    (0, import_react48.useEffect)(() => {
      const controller = new AbortController();
      setSaved(null);
      setDraft(null);
      setError("");
      request(
        `/knowledge/prompt?${query}`,
        void 0,
        void 0,
        controller.signal
      ).then((value) => {
        if (!controller.signal.aborted) {
          setSaved(value);
          setDraft(value.configuration);
        }
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => controller.abort();
    }, [query, revision]);
    (0, import_react48.useEffect)(() => {
      if (!proposal || !draft || saving || applied.current === proposal.id || proposal.datasetId !== datasetId || proposal.kind !== kind)
        return;
      applied.current = proposal.id;
      onProposalUsed();
      if (draft.directions.some(
        (item) => item.title.trim().toLocaleLowerCase() === proposal.title.trim().toLocaleLowerCase()
      )) {
        setError("\u5DF2\u6709\u540C\u540D\u65B9\u5411\uFF0C\u8BF7\u7F16\u8F91\u73B0\u6709\u8BF4\u660E\u3002");
        return;
      }
      const directionId = v4_default();
      setFocus(directionId);
      setDraft({
        ...draft,
        directions: [
          ...draft.directions,
          {
            direction_id: directionId,
            title: proposal.title,
            instruction: proposal.instruction,
            enabled: true,
            origin: "dataset"
          }
        ]
      });
    }, [proposal, draft, saving, datasetId, kind, onProposalUsed]);
    const dirty = !!saved && JSON.stringify(saved.configuration) !== JSON.stringify(draft);
    const invalid = !!draft && (!draft.objective.trim() || draft.directions.some(
      (item) => !item.title.trim() || !item.instruction.trim()
    ) || new Set(
      draft.directions.map((item) => item.title.trim().toLocaleLowerCase())
    ).size !== draft.directions.length);
    const reason = saving ? "\u6B63\u5728\u4FDD\u5B58\u6316\u6398\u65B9\u5411\u3002" : invalid ? "\u8BF7\u586B\u5199\u76EE\u6807\u3001\u65B9\u5411\u540D\u79F0\u548C\u8BF4\u660E\uFF0C\u65B9\u5411\u540D\u79F0\u4E0D\u80FD\u91CD\u590D\u3002" : error2 ? "\u65B9\u5411\u4FDD\u5B58\u6216\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u5148\u5904\u7406\u3002" : !saved ? "\u6B63\u5728\u8BFB\u53D6\u6316\u6398\u65B9\u5411\u3002" : dirty ? "\u8BF7\u5148\u4FDD\u5B58\u6709\u6548\u7684\u6316\u6398\u65B9\u5411\u3002" : "";
    useUnsavedChanges(dirty);
    (0, import_react48.useEffect)(() => {
      onPending(!!reason);
      onState?.({
        reason,
        count: saved?.configuration.directions.filter((item) => item.enabled).length || 0,
        revision: saved?.revision || ""
      });
    }, [reason, saved, onPending, onState]);
    async function save(reset = false) {
      if (!saved || !draft) return;
      setSaving(true);
      setError("");
      try {
        const value = await request("/knowledge/prompt", {
          dataset_id: datasetId,
          kind,
          expected_revision: saved.revision,
          configuration: reset ? null : draft
        });
        if (alive.current) {
          setSaved(value);
          setDraft(value.configuration);
        }
      } catch (error3) {
        if (alive.current) setError(message(error3));
      } finally {
        if (alive.current) setSaving(false);
      }
    }
    async function openSource(id) {
      setOpening(id);
      setCatalogError("");
      try {
        const value = catalog?.exploration?.directions.some(
          (direction2) => direction2.direction_id === id
        ) ? catalog : await request(
          `/exploration?${new URLSearchParams({ dataset_id: datasetId, direction_id: id })}`
        );
        const snapshot = value?.exploration, direction = snapshot?.directions.find(
          (item) => item.direction_id === id
        );
        if (!snapshot || !direction)
          throw new Error("\u6CA1\u6709\u627E\u5230\u8BE5\u65B9\u5411\u7684\u539F\u59CB\u63A2\u7D22\u8BB0\u5F55\u3002");
        if (alive.current) setSource({ snapshot, direction });
      } catch (error3) {
        if (alive.current) setCatalogError(message(error3));
      } finally {
        if (alive.current) setOpening("");
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("div", { className: "iad-mining-directions", children: [
      !draft ? /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("section", { className: "iad-setup-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("h3", { children: "2. \u6316\u6398\u76EE\u6807" }),
        !error2 && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6316\u6398\u65B9\u5411\u2026" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)(import_jsx_runtime53.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("section", { className: "iad-setup-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("h3", { children: "2. \u6316\u6398\u76EE\u6807" }),
          /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("label", { className: "iad-field", children: [
            "\u672C\u6B21\u89C2\u5BDF\u76EE\u6807",
            /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
              "textarea",
              {
                "aria-label": "\u6316\u6398\u76EE\u6807",
                disabled: saving,
                rows: 3,
                value: draft.objective,
                onChange: (event) => {
                  setDraft({ ...draft, objective: event.target.value });
                  setError("");
                }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("section", { className: "iad-setup-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("h3", { "data-action": "mining-directions", children: "3. \u6316\u6398\u65B9\u5411" }),
          /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("fieldset", { className: "iad-directions-form", disabled: saving, children: [
            catalogError && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("p", { role: "alert", children: catalogError }),
            /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
              MiningDirectionList,
              {
                configuration: draft,
                catalog,
                opening,
                focusId: focus || view.directionFocus,
                savedRevision: saved?.revision || "",
                onChange: (value) => {
                  setDraft(value);
                  setError("");
                },
                onSource: (id) => void openSource(id)
              }
            ),
            invalid && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("p", { role: "alert", children: reason }),
            /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("div", { className: "iad-direction-savebar", children: [
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("span", { className: "iad-muted", children: dirty ? "\u672A\u4FDD\u5B58" : "\u5DF2\u4FDD\u5B58" }),
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
                "button",
                {
                  className: "iad-primary",
                  "data-action": "save-mining-directions",
                  disabled: !dirty || invalid || saving,
                  onClick: () => void save(),
                  children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u65B9\u5411"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
                "button",
                {
                  disabled: !dirty || saving,
                  onClick: () => setConfirmation("discard"),
                  children: "\u653E\u5F03\u4FEE\u6539"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
                "button",
                {
                  disabled: saving || !saved?.customized && !dirty,
                  onClick: () => setConfirmation("reset"),
                  children: "\u6062\u590D\u9ED8\u8BA4\u65B9\u5411"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("button", { disabled: !saved, onClick: () => setPreview(saved), children: "\u9884\u89C8\u5DF2\u4FDD\u5B58\u63D0\u793A\u8BCD" })
            ] })
          ] })
        ] })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("p", { role: "alert", className: "iad-error", children: [
        error2,
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
          "button",
          {
            onClick: () => dirty ? setConfirmation("reload") : setRevision((value) => value + 1),
            children: "\u91CD\u65B0\u8F7D\u5165"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
          "button",
          {
            onClick: () => {
              void request(`/knowledge/prompt?${query}`).then((value) => {
                if (alive.current) setPreview(value);
              }).catch((error3) => {
                if (alive.current) setError(message(error3));
              });
            },
            children: "\u67E5\u770B\u670D\u52A1\u5668\u7248\u672C"
          }
        )
      ] }),
      confirmation && /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)(
        Modal,
        {
          title: confirmation === "reset" ? "\u6062\u590D\u9ED8\u8BA4\u65B9\u5411\uFF1F" : confirmation === "discard" ? "\u653E\u5F03\u4FEE\u6539\uFF1F" : "\u8F7D\u5165\u670D\u52A1\u5668\u914D\u7F6E\uFF1F",
          className: "iad-confirm-dialog",
          onClose: () => setConfirmation(null),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("p", { children: confirmation === "reset" ? "\u6062\u590D\u9ED8\u8BA4\u4F1A\u79FB\u9664\u81EA\u5B9A\u4E49\u548C\u5DF2\u91C7\u7528\u65B9\u5411\u3002" : confirmation === "discard" ? "\u6062\u590D\u4E0A\u6B21\u4FDD\u5B58\u7684\u76EE\u6807\u548C\u65B9\u5411\u3002" : "\u670D\u52A1\u5668\u914D\u7F6E\u5C06\u66FF\u6362\u5F53\u524D\u8349\u7A3F\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("div", { className: "iad-form-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("button", { onClick: () => setConfirmation(null), children: "\u4FDD\u7559\u5F53\u524D\u7F16\u8F91" }),
              /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
                "button",
                {
                  className: "iad-primary",
                  onClick: () => {
                    if (confirmation === "reset") void save(true);
                    else if (confirmation === "discard") {
                      setDraft(saved.configuration);
                      setError("");
                    } else setRevision((value) => value + 1);
                    setConfirmation(null);
                  },
                  children: confirmation === "reset" ? "\u786E\u8BA4\u6062\u590D\u9ED8\u8BA4" : confirmation === "discard" ? "\u786E\u8BA4\u653E\u5F03" : "\u91CD\u65B0\u8F7D\u5165\u670D\u52A1\u5668\u914D\u7F6E"
                }
              )
            ] })
          ]
        }
      ),
      preview && /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)(Modal, { title: "\u5DF2\u4FDD\u5B58\u7684\u6316\u6398\u63D0\u793A\u8BCD", onClose: () => setPreview(null), children: [
        /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("p", { className: "iad-muted", title: preview.revision, children: [
          "\u4FDD\u5B58\u7248\u672C ",
          preview.revision
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("pre", { className: "iad-observation", children: preview.instruction }),
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("button", { onClick: () => setPreview(null), children: "\u5173\u95ED" })
      ] }),
      source && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(DirectionDetail, { ...source, onClose: () => setSource(null) })
    ] });
  }

  // src/client/components/KnowledgeSetup.tsx
  var import_jsx_runtime54 = __require("react/jsx-runtime");
  function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous, directionProposal, onDirectionProposalUsed }) {
    const { workspace } = useWorkspace(), pageId = "industrial-knowledge";
    const model = useWorkbenchModel();
    const view = workspace.view(pageId);
    const [sources, setSources] = (0, import_react49.useState)(null), [error2, setError] = (0, import_react49.useState)("");
    const [selecting, setSelecting] = (0, import_react49.useState)(false);
    const [directionsPending, setDirectionsPending] = (0, import_react49.useState)(true);
    const [directionState, setDirectionState] = (0, import_react49.useState)({ reason: "\u6B63\u5728\u8BFB\u53D6\u6316\u6398\u65B9\u5411\u3002", count: 0, revision: "" });
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
    (0, import_react49.useEffect)(() => {
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
    const reason = busy ? "\u6B63\u5728\u542F\u52A8\u4F5C\u4E1A\u3002" : directionState.reason || (directionsPending ? "\u8BF7\u5148\u4FDD\u5B58\u6709\u6548\u7684\u6316\u6398\u65B9\u5411\u3002" : "") || (selecting ? "\u8BF7\u5148\u5B8C\u6210\u6765\u6E90\u9009\u62E9\u3002" : error2 || (!sources ? "\u6B63\u5728\u8BFB\u53D6\u5408\u683C\u6765\u6E90\u3002" : unavailable ? "\u8BF7\u6309\u76EE\u6807\u6570\u91CF\u9009\u62E9\u56FE\u50CF\u3002" : !model.ready ? "\u8BF7\u5148\u914D\u7F6E\u5DE5\u4F5C\u53F0\u6A21\u578B\u3002" : ""));
    return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("section", { className: "iad-knowledge-setup", "aria-label": "\u77E5\u8BC6\u6316\u6398\u914D\u7F6E", children: [
      /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", { className: "iad-mining-main iad-panel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("section", { className: "iad-setup-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("h3", { children: "1. \u65B9\u5F0F\u4E0E\u4F9D\u636E" }),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", { className: "iad-config-bar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("label", { className: "iad-field", children: [
              "\u6267\u884C\u65B9\u5F0F",
              /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u6267\u884C\u65B9\u5F0F", value: view.miningContinuous ? "continuous" : "group", disabled: busy, onChange: (event) => workspace.updateView(pageId, { miningContinuous: event.target.value === "continuous" }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "group", children: "\u5F53\u524D\u56FE\u7EC4" }),
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "continuous", children: "\u8FDE\u7EED\u8303\u56F4 \xB7 Agent\u6267\u884C" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("label", { className: "iad-field", children: [
              "\u77E5\u8BC6\u9884\u8BBE",
              /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u9884\u8BBE", value: view.miningPreset, disabled: busy || !!view.scopeRunId, onChange: (e) => workspace.updateView(pageId, { miningPreset: e.target.value, miningPage: 1, miningImages: [] }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "", children: "\u4E0D\u4F7F\u7528\u9884\u8BBE" }),
                view.miningPreset && !versions.some((item) => item.version_id === view.miningPreset) && /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("option", { value: view.miningPreset, children: [
                  "\u5DF2\u9009\u7248\u672C \xB7 ",
                  view.miningPreset
                ] }),
                versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: version.version_id, children: version.version_id }, version.version_id))
              ] })
            ] }),
            kind === "defect" && /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("label", { className: "iad-field", children: [
              "\u826F\u54C1\u6BD4\u8F83\u57FA\u51C6",
              /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("select", { "aria-label": "\u4F9D\u636E\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: busy || !!view.scopeRunId, onChange: (e) => workspace.updateView(pageId, { normalVersion: e.target.value, miningImages: [], miningPage: 1 }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "", children: "\u4E0D\u4F7F\u7528\u57FA\u51C6 \xB7 \u4EC5\u6574\u7406\u5047\u8BBE" }),
                view.normalVersion && !normalVersions.some((item) => item.version_id === view.normalVersion) && /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("option", { value: view.normalVersion, children: [
                  "\u5DF2\u9009\u7248\u672C \xB7 ",
                  view.normalVersion
                ] }),
                normalVersions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: version.version_id, children: version.version_id }, version.version_id))
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(KnowledgeDirections, { datasetId: dataset.dataset_id, kind, proposal: directionProposal, onPending: setDirectionsPending, onState: setDirectionState, onProposalUsed: onDirectionProposalUsed }, `${dataset.dataset_id}:${kind}`)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("aside", { className: "iad-mining-rail", children: [
        /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("section", { className: "iad-panel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("h3", { children: "4. \u56FE\u50CF\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", { className: "iad-config-bar", children: [
            "      ",
            /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("label", { className: "iad-field iad-short-field", children: [
              "\u56FE\u50CF\u6570\u91CF",
              /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("input", { type: "number", min: "1", step: "1", "aria-label": "\u6316\u6398\u56FE\u50CF\u6570\u91CF", value: view.miningCount, disabled: busy || selecting, onChange: (e) => workspace.updateView(pageId, { miningCount: e.target.value }, true) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("label", { className: "iad-field", children: [
              "\u6765\u6E90\u8303\u56F4",
              /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("select", { "aria-label": "\u6765\u6E90\u8303\u56F4", value: view.miningSourceMode, disabled: busy, onChange: (e) => workspace.updateView(pageId, { miningSourceMode: e.target.value, miningPage: 1, miningImages: [] }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "uncovered", children: "\u4EC5\u672A\u89C2\u5BDF" }),
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "all", children: "\u5168\u90E8\u5408\u683C \xB7 \u542B\u5386\u53F2\u6765\u6E90" }),
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("option", { value: "recheck", disabled: !view.miningPreset, children: "\u5224\u636E\u5F85\u91CD\u6838\u9A8C" })
              ] })
            ] })
          ] }),
          sources?.coverage && /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("details", { className: "iad-source-coverage", children: [
            /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("summary", { children: "\u6765\u6E90\u8986\u76D6" }),
            /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("p", { className: "iad-muted", children: [
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
            ] })
          ] }),
          error2 && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
          !valid && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("p", { role: "alert", children: "\u8BF7\u8F93\u5165\u6B63\u6574\u6570\u56FE\u50CF\u6570\u91CF\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(SourcePicker, { dataset, label: "\u6765\u6E90", sources, selected: view.miningImages, target: valid ? count2 : "\u2014", disabled: busy, choosing: selecting, canChoose: valid, onChoose: () => void choose(), page: view.miningPage, onPage: (miningPage) => workspace.updateView(pageId, { miningPage }), onChange: (miningImages) => {
            setError("");
            workspace.updateView(pageId, { miningImages });
          }, search: view.miningSearch, onSearch: (miningSearch) => workspace.updateView(pageId, { miningSearch, miningPage: 1 }, true) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("section", { className: "iad-panel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("h3", { children: "5. \u8FD0\u884C\u786E\u8BA4" }),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(WorkbenchModelStatus, {}),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("p", { children: [
            view.miningContinuous ? `\u8FDE\u7EED\u8303\u56F4 \xB7 \u6BCF\u7EC4 ${valid ? count2 : "\u2014"} \u5F20` : `\u5F53\u524D\u56FE\u7EC4 \xB7 ${view.miningImages.length} \u5F20`,
            " \xB7 ",
            view.miningPreset ? "\u4F7F\u7528\u6240\u9009\u77E5\u8BC6\u9884\u8BBE" : "\u4E0D\u4F7F\u7528\u77E5\u8BC6\u9884\u8BBE"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("p", { className: "iad-muted", title: directionState.revision, children: [
            "\u5DF2\u4FDD\u5B58\u65B9\u5411 ",
            directionState.count,
            " \u9879",
            directionState.revision && ` \xB7 ${directionState.revision.slice(0, 8)}`
          ] }),
          view.miningContinuous && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("p", { className: "iad-muted", children: "\u4EA4\u7ED9 Agent \u6309\u5F53\u524D\u51BB\u7ED3\u8303\u56F4\u8FDE\u7EED\u6267\u884C\u3002" }),
          reason && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("p", { className: "iad-muted", children: reason }),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("button", { "data-action": view.miningContinuous ? "knowledge-agent-run" : "knowledge-group-run", className: "iad-primary", disabled: !!reason, onClick: () => {
            if (view.miningContinuous) {
              onContinuous();
              return;
            }
            const [first, ...rest] = view.miningImages;
            if (!first || unavailable) return;
            onStart({ image_count: count2, images: [first, ...rest], knowledge_preset: [view.miningPreset, ...kind === "defect" ? [view.normalVersion] : []].filter(Boolean) });
          }, children: busy ? "\u542F\u52A8\u4E2D\u2026" : view.miningContinuous ? "\u5728Agent\u4E2D\u8FDE\u7EED\u6316\u6398" : `\u5F00\u59CB\u6316\u6398${kind === "normal" ? "\u826F\u54C1" : "\u5F02\u5E38"}\u77E5\u8BC6` })
        ] })
      ] })
    ] });
  }

  // src/client/components/KnowledgeDiscovery.tsx
  var import_jsx_runtime55 = __require("react/jsx-runtime");
  function KnowledgeDiscovery({ knowledge, evidence, onPropose }) {
    const discovery = knowledge.mining_steps.at(-1)?.result.discovery;
    const selected = knowledge.mining_prompt?.configuration.directions.filter((item) => item.enabled) || [];
    const recorded = new Set(discovery?.areas.map((area) => area.direction_id).filter(Boolean));
    const missing = selected.filter((item) => !recorded.has(item.direction_id));
    return /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("details", { className: "iad-knowledge-discovery", children: [
      /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("summary", { children: [
        "\u89C2\u5BDF\u8303\u56F4",
        discovery ? ` \xB7 ${discovery.areas.length} \u9879\u8BB0\u5F55` : " \xB7 \u672A\u8BB0\u5F55"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("p", { className: "iad-muted", children: [
        "\u8FD9\u662F\u751F\u6210\u65F6\u7684\u89C2\u5BDF\u8BB0\u5F55\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u8BC1\u660E\u8986\u76D6\u5B8C\u6574\u6216\u4EBA\u5DE5\u786E\u8BA4\u3002",
        knowledge.manual_edit ? "\u5F53\u524D\u4E3A\u4EBA\u5DE5\u7EF4\u62A4\u7248\u672C\u3002" : ""
      ] }),
      knowledge.mining_prompt && /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("summary", { children: "\u672C\u6B21\u6316\u6398\u63D0\u793A\u8BCD" }),
        /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("pre", { className: "iad-observation", children: knowledge.mining_prompt.instruction })
      ] }),
      !!missing.length && /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("p", { children: [
        "\u6240\u9009\u65B9\u5411\u672A\u8BB0\u5F55\u7ED3\u679C\uFF1A",
        missing.map((item) => item.title).join("\u3001")
      ] }),
      !discovery && /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("p", { children: "\u6B64\u7248\u672C\u672A\u4FDD\u5B58\u7ED3\u6784\u5316\u89C2\u5BDF\u8303\u56F4\u3002" }),
      discovery && /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)(import_jsx_runtime55.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("summary", { children: [
            "\u53EF\u89C1\u90E8\u4EF6 \xB7 ",
            discovery.parts.length
          ] }),
          discovery.parts.map((part) => /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("p", { children: [
              part.name,
              " \xB7 ",
              part.location
            ] }),
            evidence(part.evidence_ids)
          ] }, part.name))
        ] }),
        discovery.areas.map((area, index3) => /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("article", { className: "iad-discovery-area iad-info-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("div", { className: "iad-section-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("h3", { children: selected.find((item) => item.direction_id === area.direction_id)?.title || area.direction }),
            /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("span", { children: [
              area.status,
              " \xB7 ",
              area.direction_id ? "\u7528\u6237\u6240\u9009" : "\u6A21\u578B\u65B0\u589E"
            ] })
          ] }),
          !!area.subjects.length && /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("p", { children: area.subjects.join("\u3001") }),
          /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("p", { children: area.reason }),
          !!area.check_titles.length && /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("p", { className: "iad-muted", children: [
            "\u672C\u6B21\u5F52\u7EB3\u5224\u636E\uFF1A",
            area.check_titles.join("\u3001")
          ] }),
          !!area.evidence_ids.length && /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("summary", { children: "\u67E5\u770B\u56FE\u50CF\u4F9D\u636E" }),
            evidence(area.evidence_ids)
          ] }),
          !area.direction_id && /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("button", { onClick: () => onPropose({
            id: v4_default(),
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
  var import_jsx_runtime56 = __require("react/jsx-runtime");
  function KnowledgePage({ dataset, kind, refreshRevision, headerActions }) {
    const { workspace } = useWorkspace();
    const pageId = "industrial-knowledge";
    const view = workspace.view(pageId);
    const [error2, setError] = (0, import_react50.useState)("");
    const [busy, setBusy] = (0, import_react50.useState)(false);
    const [directionProposal, setDirectionProposal] = (0, import_react50.useState)();
    const consumeDirection = (0, import_react50.useCallback)(() => setDirectionProposal(void 0), []);
    const [revision, setRevision] = (0, import_react50.useState)(0);
    const current = useKnowledge(dataset.dataset_id, kind, view.version, revision + refreshRevision);
    const reference = useKnowledge(dataset.dataset_id, kind === "defect" ? "normal" : null, view.normalVersion, revision + refreshRevision);
    const { knowledge, versions } = current;
    const normal = view.normalVersion ? reference.knowledge : null, normalVersions = reference.versions;
    const loading = current.loading || reference.loading, loadError = current.error || reference.error;
    const [lightbox, setLightbox] = (0, import_react50.useState)(null);
    const updated = (0, import_react50.useCallback)(() => setRevision((value) => value + 1), []);
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
    const scoped = (0, import_react50.useCallback)((scope) => {
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
      return knowledge && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(KnowledgeEvidenceGallery, { versionId: knowledge.version_id, items: knowledge.evidence.filter((item) => ids.includes(item.image.evidence_id)), onOpen: setLightbox });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("section", { className: "iad-knowledge-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(WorkbenchHeader, { pageId, title: view.tab === "setup" ? "\u65B0\u5EFA\u77E5\u8BC6\u6316\u6398" : void 0, children: [
        headerActions,
        view.tab === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "results" }), children: "\u8FD4\u56DE\u77E5\u8BC6\u7ED3\u679C" }) : /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { className: "iad-primary", disabled: busy || running, onClick: () => workspace.updateView(pageId, { tab: "setup" }), children: "\u65B0\u5EFA\u6316\u6398" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("section", { className: "iad-knowledge-context", children: [
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("div", { className: "iad-type-switch", role: "group", "aria-label": "\u77E5\u8BC6\u7C7B\u578B", children: [["normal", "\u826F\u54C1"], ["defect", "\u5F02\u5E38"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { "aria-pressed": kind === value, onClick: () => workspace.selectKnowledgeKind(value), children: label }, value)) }),
        view.tab !== "setup" && view.tab !== "jobs" && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(import_jsx_runtime56.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("label", { className: "iad-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { className: "iad-visually-hidden", children: "\u77E5\u8BC6\u7248\u672C" }),
            /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u7248\u672C", value: view.version, onChange: (event) => workspace.updateView(pageId, { version: event.target.value, checkId: "" }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("option", { value: "", children: [
                "\u5F53\u524D\u53D1\u5E03\u7248\u672C",
                versions.length ? "" : " \xB7 \u5C1A\u672A\u53D1\u5E03"
              ] }),
              versions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("option", { value: version.version_id, children: [
                version.version_id,
                " \xB7 ",
                version.source_count,
                " \u5F20\u6765\u6E90 \xB7 ",
                version.created_at
              ] }, version.version_id))
            ] })
          ] }),
          view.version && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { className: "iad-muted", children: "\u6B63\u5728\u67E5\u770B\u56FA\u5B9A\u5386\u53F2\u7248\u672C\u3002" }),
          loading && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { role: "status", className: "iad-muted", children: "\u6B63\u5728\u8BFB\u53D6\u77E5\u8BC6\u2026" }),
          loadError && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { role: "alert", className: "iad-error", children: [
            loadError,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(IconButton, { label: "\u91CD\u65B0\u8BFB\u53D6\u77E5\u8BC6", onClick: updated, children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(RefreshIcon, {}) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { className: "iad-muted", children: kind === "normal" ? `\u826F\u54C1\u6765\u6E90 \xB7 ${dataset.reference_sample_ids.length} \u5F20` : dataset.format === "folder_classification" ? "\u5F02\u5E38\u5019\u9009\u4EE5\u76EE\u5F55\u6807\u7B7E\u53CA\u6838\u9A8C\u7ED3\u679C\u4E3A\u51C6" : "\u5F02\u5E38\u5019\u9009\u4EE5\u5B9E\u9645\u6807\u6CE8\u53CA\u6838\u9A8C\u7ED3\u679C\u4E3A\u51C6" }),
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-images", datasetId: dataset.dataset_id, tab: kind === "normal" ? "sources" : "results", selected: "", page: 1, filters: { ...initialFilters, reference_status: kind === "normal" ? "candidate" : "all", raw_label_filters: kind === "defect" && dataset.format === "folder_classification" ? ["FAIL"] : [], annotation_filters: kind === "defect" && dataset.format !== "folder_classification" ? ["present"] : [] } }), children: kind === "normal" ? "\u7BA1\u7406\u6765\u6E90" : "\u67E5\u770B\u5F02\u5E38\u5019\u9009" })
          ] })
        ] })
      ] }),
      (error2 || polling.error) && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { role: "alert", className: "iad-error", children: error2 || polling.error }),
      scopeRunId && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(KnowledgeScopePanel, { datasetId: dataset.dataset_id, kind, scopeRunId, revision: revision + refreshRevision, onScope: scoped }),
      view.tab === "setup" && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(KnowledgeSetup, { dataset, kind, versions, normalVersions, busy: busy || running, directionProposal, onDirectionProposalUsed: consumeDirection, onStart: (group) => void start(group), onContinuous: () => void continuous() }),
      view.tab !== "setup" && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(PageTabs, { label: "\u77E5\u8BC6\u89C6\u56FE", items: [{ id: "results", label: "\u77E5\u8BC6\u6761\u76EE" }, { id: "findings", label: kind === "normal" ? "\u5F85\u6838\u5B9E" : "\u6807\u6CE8\u6838\u9A8C" }, { id: "versions", label: "\u7248\u672C" }, { id: "jobs", label: "\u4F5C\u4E1A\u8BB0\u5F55" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
        view.tab !== "jobs" && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("section", { className: "iad-knowledge-content", children: knowledge ? /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(import_jsx_runtime56.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(KnowledgeState, { freshness: current.freshness }),
          knowledge.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { "data-field": "knowledge-normal-version", children: [
            "\u6B64\u77E5\u8BC6\u7248\u672C\u4F9D\u636E\u826F\u54C1 ",
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("code", { children: knowledge.normal_version_id })
          ] }),
          knowledge.kind === "defect" && !loading && normal && normal.version_id !== knowledge.normal_version_id && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { className: "iad-muted", children: "\u4E0B\u6B21\u6316\u6398\u5C06\u4F7F\u7528\u53E6\u4E00\u826F\u54C1\u7248\u672C\uFF0C\u5F53\u524D\u7ED3\u679C\u4FDD\u7559\u539F\u4F9D\u636E\u3002" }),
          knowledge.manual_edit && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { className: "iad-muted", children: "\u4EBA\u5DE5\u7EF4\u62A4\u7248\u672C" }),
          knowledge.summary && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: knowledge.summary }),
          /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("details", { className: "iad-knowledge-overview", children: [
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("summary", { children: "\u7248\u672C\u4FE1\u606F" }),
            /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { className: "iad-muted", children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("code", { children: knowledge.version_id }),
              " \xB7 ",
              knowledge.sources.length,
              " \u5F20\u6765\u6E90 \xB7 ",
              knowledge.checks.length,
              " \u9879\u5224\u636E \xB7 ",
              knowledge.findings.length,
              " \u9879\u6838\u9A8C"
            ] })
          ] }),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(KnowledgeDiscovery, { knowledge, evidence, onPropose: (proposal) => {
            setDirectionProposal(proposal);
            workspace.updateView(pageId, { tab: "setup" });
          } }),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(import_jsx_runtime56.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { className: "iad-knowledge-split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { className: "iad-check-list", children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { className: "iad-row", "aria-label": "\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009", children: [
                /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("label", { className: "iad-field", children: [
                  "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE",
                  /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u6761\u76EE", value: view.knowledgeSearch, onChange: (event) => workspace.updateView(pageId, { knowledgeSearch: event.target.value }, true) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("label", { className: "iad-field", children: [
                  "\u652F\u6301\u72B6\u6001",
                  /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("select", { "aria-label": "\u77E5\u8BC6\u652F\u6301\u72B6\u6001", value: view.knowledgeStatus, onChange: (event) => workspace.updateView(pageId, { knowledgeStatus: event.target.value }), children: [
                    /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }),
                    Object.entries(knowledgeStatuses).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("option", { value, children: label }, value))
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { disabled: !view.knowledgeSearch && !view.knowledgeStatus, onClick: () => workspace.updateView(pageId, { knowledgeSearch: "", knowledgeStatus: "" }), children: "\u6E05\u9664\u77E5\u8BC6\u7B5B\u9009" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { role: "status", "aria-label": "\u77E5\u8BC6\u7B5B\u9009\u7ED3\u679C", children: [
                "\u663E\u793A ",
                checks.length,
                " / ",
                knowledge.checks.length,
                " \u9879\u5224\u636E"
              ] }),
              checks.map((item) => /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("button", { "aria-pressed": check?.check_id === item.check_id, onClick: () => workspace.updateView(pageId, { checkId: item.check_id }, true), children: [
                /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("strong", { children: item.title }),
                /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("span", { children: [
                  knowledgeStatuses[item.status],
                  " \xB7 \u652F\u6301 ",
                  item.support_evidence_ids.length,
                  " / \u53CD\u5BF9 ",
                  item.counter_evidence_ids.length
                ] })
              ] }, item.check_id)),
              !checks.length && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: knowledge.checks.length ? "\u6CA1\u6709\u5339\u914D\u7684\u5224\u636E\uFF0C\u8BF7\u8C03\u6574\u6216\u6E05\u9664\u7B5B\u9009\u3002" : "\u5C1A\u65E0\u53EF\u53D1\u5E03\u5224\u636E\uFF0C\u8BF7\u67E5\u770B\u9650\u5236\u548C\u6838\u9A8C\u7ED3\u679C\u3002" })
            ] }),
            check && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("article", { className: "iad-check-detail", children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { className: "iad-section-header", children: [
                /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h2", { children: check.title }),
                /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { className: "iad-muted", children: [
                check.subject,
                " \xB7 ",
                check.location,
                " \xB7 ",
                knowledgeStatuses[check.status]
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: "\u5224\u5B9A\u4F9D\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: check.criterion }),
              !!check.recheck_sample_ids.length && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("button", { onClick: () => workspace.updateView(pageId, { tab: "setup", miningPreset: knowledge.version_id, miningSourceMode: "recheck", miningContinuous: false, miningImages: [], miningPage: 1 }), children: [
                "\u91CD\u6838\u9A8C\u5386\u53F2\u6765\u6E90 \xB7 ",
                check.recheck_sample_ids.length,
                " \u5F20"
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: "\u5141\u8BB8\u53D8\u5316" }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: check.allowed_variations.join("\uFF1B") || "\u672A\u8BB0\u5F55" }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: "\u652F\u6301\u8BC1\u636E" }),
              evidence(check.support_evidence_ids),
              !!check.counter_evidence_ids.length && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(import_jsx_runtime56.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: "\u53CD\u5BF9\u8BC1\u636E" }),
                evidence(check.counter_evidence_ids)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: "\u9002\u7528\u9650\u5236" }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { className: "iad-muted", children: [...check.limitations, ...check.support_limitations].join("\uFF1B") || "\u672A\u8BB0\u5F55\u989D\u5916\u9650\u5236" })
            ] })
          ] }) }),
          view.tab === "findings" && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(import_jsx_runtime56.Fragment, { children: [
            knowledge.conflicts.map((conflict) => /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("article", { className: "iad-info-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: conflict.resolution?.status === "resolved" ? "\u51B2\u7A81\u5DF2\u91CD\u6838\u9A8C" : "\u77E5\u8BC6\u4E0E\u56FE\u50CF\u5F85\u6838\u5B9E" }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: conflict.description }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { children: [
                "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
                conflict.normal_explanation
              ] }),
              evidence([...conflict.new_evidence_ids, ...conflict.comparison_evidence_ids]),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { onClick: () => workspace.openLocation({ pageId: "industrial-review", datasetId: dataset.dataset_id, tab: "conflicts", version: knowledge.version_id, conflictId: conflict.conflict_id }), children: "\u4EBA\u5DE5\u786E\u8BA4\u6B64\u51B2\u7A81" })
            ] }, conflict.conflict_id)),
            knowledge.findings.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("article", { className: "iad-info-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h3", { children: finding.judgment.status === "supported" ? "\u56FE\u50CF\u652F\u6301\u5F02\u5E38" : finding.judgment.status === "refuted" ? "\u6B63\u5E38\u89E3\u91CA\u6210\u7ACB" : "\u8BC1\u636E\u4E0D\u8DB3" }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: finding.judgment.description }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { children: [
                "\u6B63\u5E38\u66FF\u4EE3\u89E3\u91CA\uFF1A",
                finding.judgment.normal_explanation
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { className: "iad-muted", children: finding.judgment.limitations.join("\uFF1B") }),
              evidence(finding.judgment.evidence_ids),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { onClick: () => workspace.navigate("industrial-review", finding.sample_id), children: "\u4EBA\u5DE5\u6838\u5B9E\u6B64\u56FE" })
            ] }, finding.finding_id)),
            !knowledge.findings.length && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: "\u6B64\u7248\u672C\u6CA1\u6709\u5F85\u6838\u9A8C\u533A\u57DF\u3002" })
          ] }),
          !!knowledge.limitations.length && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("summary", { children: "\u77E5\u8BC6\u9650\u5236" }),
            knowledge.limitations.map((limitation, index3) => /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: limitation }, index3))
          ] }),
          !!knowledge.corrections.length && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("summary", { children: "\u4EBA\u5DE5\u4FEE\u8BA2\u5019\u9009" }),
            knowledge.corrections.map((item) => /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { children: item.instruction }),
              /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("p", { className: "iad-muted", children: knowledge.revisions.find((revision2) => revision2.previous_check_id === item.check_id)?.reason })
            ] }, item.check_id))
          ] }),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "setup", miningPreset: knowledge.version_id, miningSourceMode: "uncovered", miningImages: [], miningPage: 1 }), children: "\u4F5C\u4E3A\u9884\u8BBE\u7EE7\u7EED\u9009\u56FE" }),
          view.tab === "versions" && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(KnowledgeVersions, { versions, onSelect: (version) => workspace.updateView(pageId, { version, checkId: "", tab: "results" }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("p", { children: [
          "\u5C1A\u65E0",
          kind === "normal" ? "\u826F\u54C1" : "\u4E0D\u826F\u54C1",
          "\u77E5\u8BC6\u7248\u672C\u3002"
        ] }) }),
        view.tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("section", { className: "iad-knowledge-jobs iad-job-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("h2", { children: "\u6316\u6398\u4F5C\u4E1A" }),
          /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(JobTable, { jobs, pageId, onChanged: polling.refresh })
        ] })
      ] }),
      lightbox && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })
    ] });
  }

  // src/client/components/ReviewRecords.tsx
  var import_react51 = __require("react");
  var import_jsx_runtime57 = __require("react/jsx-runtime");
  function ReviewRecords({ datasetId, page, search, selected, revision, onPage, onSearch, onSelect, onQueue, detail }) {
    const [result, setResult] = (0, import_react51.useState)(null);
    const [loading, setLoading] = (0, import_react51.useState)(true), [error2, setError] = (0, import_react51.useState)("");
    const [retry, setRetry] = (0, import_react51.useState)(0);
    (0, import_react51.useEffect)(() => {
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
    const pagination = result && /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(Pagination, { total: result.total, page, unit: "\u6761\u8BB0\u5F55", onPage });
    const showingDetail = !loading && !error2 && result?.items.some((record) => record.sample_id === selected);
    return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("div", { className: showingDetail ? "iad-main" : "", children: [
      /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("section", { className: "iad-review-records", "aria-label": "\u590D\u6838\u8BB0\u5F55", children: [
        /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("label", { className: "iad-field", children: [
          "\u641C\u7D22\u590D\u6838\u8BB0\u5F55",
          /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("input", { "aria-label": "\u641C\u7D22\u590D\u6838\u8BB0\u5F55", placeholder: "\u56FE\u50CF\u540D\u3001\u590D\u6838\u4EBA\u6216\u8BF4\u660E", value: search, onChange: (event) => onSearch(event.target.value) })
        ] }),
        error2 ? /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("div", { role: "alert", className: "iad-error", children: [
          error2,
          /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("button", { onClick: () => setRetry((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D\u8BB0\u5F55" })
        ] }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("p", { role: "status", children: "\u52A0\u8F7D\u590D\u6838\u8BB0\u5F55\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)(import_jsx_runtime57.Fragment, { children: [
          result?.items.length ? /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("div", { className: "iad-table-scroll", role: "region", "aria-label": "\u590D\u6838\u5386\u53F2\u8868\u683C", tabIndex: 0, onFocus: (event) => {
            if (event.target === event.currentTarget) event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
          }, children: /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("table", { className: "iad-resource-table", children: [
            /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("caption", { children: "\u4EBA\u5DE5\u88C1\u51B3\u5386\u53F2" }),
            /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("th", { children: "\u56FE\u50CF" }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("th", { children: "\u4EBA\u5DE5\u88C1\u51B3" }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("th", { children: "\u590D\u6838\u4EBA / \u65F6\u95F4" }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("th", { children: "\u590D\u6838\u8BF4\u660E" }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("th", { children: "\u64CD\u4F5C" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("tbody", { children: result.items.map((record) => /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("tr", { "data-decision-id": record.decision_id, "data-selected": record.sample_id === selected, children: [
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("td", { title: record.relative_path, children: record.relative_path }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("td", { children: reviewLabel(record.decision) }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("td", { children: [
                record.reviewer,
                /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("br", {}),
                record.submitted_at ? /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("time", { dateTime: record.submitted_at, children: new Date(record.submitted_at).toLocaleString() }) : "\u672A\u8BB0\u5F55\u63D0\u4EA4\u65F6\u95F4"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("td", { children: record.comment || "\u2014" }),
              /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("button", { onClick: () => onSelect(record.sample_id), children: "\u67E5\u770B\u6837\u672C" }) })
            ] }, record.decision_id)) })
          ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("div", { className: "iad-empty", children: [
            /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("h2", { children: search ? "\u6CA1\u6709\u5339\u914D\u7684\u590D\u6838\u8BB0\u5F55" : "\u6682\u65E0\u590D\u6838\u8BB0\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("p", { children: search ? "\u8BF7\u8C03\u6574\u641C\u7D22\u5173\u952E\u8BCD\u3002" : "\u5B8C\u6210\u4E00\u6B21\u4EBA\u5DE5\u88C1\u51B3\u540E\uFF0C\u8BB0\u5F55\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("button", { onClick: onQueue, children: "\u524D\u5F80\u590D\u6838\u961F\u5217" })
          ] }),
          pagination
        ] })
      ] }),
      showingDetail && detail
    ] });
  }

  // src/client/controls.ts
  var controlStyles = `
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {font:inherit;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);min-height:var(--iad-control-height);padding:8px 12px;transition:background-color 140ms,border-color 140ms;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:hover:not(:disabled) {background:var(--iad-hover);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:disabled {cursor:default;opacity:1;background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-primary {background:var(--iad-primary-fill);border-color:var(--iad-primary-fill);color:var(--iad-on-primary);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-primary:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-primary-fill) 88%,#000);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-danger {color:var(--iad-danger);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-width:0;max-width:100%;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 10px;min-height:var(--iad-control-height);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input,textarea)::placeholder {color:var(--iad-muted);opacity:1;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-height:80px;resize:vertical;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(button,input,select,textarea,summary,[tabindex]):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input[type=checkbox],input[type=radio]) {min-height:20px;width:20px;margin:0;accent-color:var(--iad-primary);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-icon-button {display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;min-height:32px;padding:7px;flex-shrink:0;background:transparent;border-color:transparent;color:var(--iad-muted);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-icon-button:disabled{background:transparent;border-color:transparent;opacity:.5}
.iad-icon-button svg{display:block;width:16px;height:16px;flex:none}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-primary:disabled{background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border)}
@media(prefers-reduced-motion:reduce) {:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {transition:none;}}
`;

  // src/client/styles/models.ts
  var modelsStyles = `
.iad-model-configuration{min-width:0}.iad-model-form{padding:24px;margin-top:20px;background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-model-configuration>.iad-muted{margin-top:8px}.iad-model-endpoint p{font-size:12px;color:var(--iad-muted);overflow-wrap:anywhere;margin-top:6px}.iad-model-configuration fieldset{border:0;min-width:0;padding:0;margin:0}.iad-model-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:0 0 16px}.iad-model-fields .iad-field{min-width:0;margin:0}.iad-model-advanced{margin:0;min-width:0}.iad-model-advanced>summary{cursor:pointer;min-height:40px}.iad-model-advanced[open]>summary{margin-bottom:16px}.iad-model-advanced textarea{width:100%}.iad-provider-manager{min-width:0}.iad-provider-manager>.iad-muted{margin-bottom:20px}.iad-provider-manager>.iad-table-scroll{background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-provider-manager input{max-width:100%}.iad-provider-endpoint{overflow-wrap:anywhere;max-width:420px}.iad-provider-dialog{width:min(780px,calc(100vw - 32px))}.iad-provider-dialog fieldset{border:0;padding:0;margin:0;min-width:0}.iad-provider-model{padding:12px 16px;margin:12px 0;background:var(--iad-surface-muted);border-radius:8px}.iad-provider-model .iad-row{justify-content:space-between}.iad-model-status{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding:10px 14px;background:var(--iad-surface);border-radius:8px}.iad-model-status span{min-width:0;overflow-wrap:anywhere;font-size:12px;color:var(--iad-muted)}
`;

  // src/client/styles/exploration.ts
  var explorationStyles = `
.iad-exploration-page{min-width:0}.iad-job-sync{display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px;min-height:44px;margin-bottom:20px;font-size:.8125rem}.iad-job-sync button{margin-left:auto}.iad-job-sync[data-state=stale]{padding:12px 16px;border-left:3px solid var(--iad-warning);background:var(--iad-surface);color:var(--iad-warning)}
.iad-exploration-setup-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start}.iad-exploration-side{display:grid;gap:24px;min-width:0}.iad-exploration-side>.iad-panel{padding:20px}.iad-exploration-side .iad-form-footer{display:grid}.iad-exploration-side dl{display:grid;grid-template-columns:76px minmax(0,1fr);gap:16px 12px;margin:24px 0}.iad-exploration-side dd{margin:0;overflow-wrap:anywhere}
.iad-exploration-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.iad-exploration-groups>section+section{border-left:1px solid var(--iad-border);padding-left:24px!important}.iad-exploration-groups h3{margin:0 0 14px}.iad-exploration-groups fieldset{border:0;padding:0;min-width:0}.iad-exploration-page textarea{width:100%}.iad-prompt-controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.iad-prompt-controls>.iad-field{flex:1 1 220px;margin:0}.iad-prompt-controls+label{margin-top:20px}
.iad-exploration-page .iad-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px;padding:40px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}.iad-exploration-page .iad-empty h2{margin:0;color:var(--iad-text)}.iad-exploration-page .iad-empty p{max-width:480px}.iad-exploration-page .iad-empty button{margin-top:8px}
.iad-exploration-results{min-width:0}.iad-exploration-results>.iad-muted{margin-bottom:20px}.iad-exploration-results>.iad-table-scroll{background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}
.iad-exploration-jobs-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,38%);gap:24px;align-items:start}.iad-exploration-jobs-layout>.iad-job-filter{grid-column:1/-1}.iad-job-stage{display:block;white-space:normal;margin-top:6px;color:var(--iad-muted)}.iad-execution-stages{list-style:none;display:grid;gap:20px;padding:0;margin:24px 0}.iad-execution-stages li{display:flex;gap:12px;color:var(--iad-muted);align-items:start}.iad-execution-stages li>span{display:grid;place-items:center;width:24px;height:24px;flex:none;border:1px solid var(--iad-border);border-radius:50%;font-size:12px}.iad-execution-stages strong{display:block;font-weight:500}.iad-execution-stages small{display:block;margin-top:4px}.iad-execution-stages li[data-state=current]{color:var(--iad-text)}.iad-execution-stages li[data-state=current]>span{background:var(--iad-primary-fill);color:var(--iad-on-primary);border-color:var(--iad-primary-fill)}.iad-execution-stages li[data-state=done]>span{color:var(--iad-success);border-color:var(--iad-success)}
.iad-indeterminate{height:4px;overflow:hidden;border-radius:3px;background:var(--iad-border);margin:20px 0}.iad-indeterminate span{display:block;width:30%;height:100%;background:var(--iad-primary-fill);animation:iad-exploration-wait 1.8s linear infinite}.iad-indeterminate.is-stale span{animation-play-state:paused;background:var(--iad-muted)}@keyframes iad-exploration-wait{from{transform:translateX(-100%)}to{transform:translateX(433%)}}
@container workbench (max-width:1180px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr) 320px}.iad-exploration-jobs-layout{grid-template-columns:minmax(0,1fr)}.iad-execution-stages{grid-template-columns:repeat(4,minmax(0,1fr))}.iad-execution-stages li{flex-direction:column}}
@container workbench (max-width:960px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr)}.iad-exploration-side{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.iad-execution-stages{grid-template-columns:repeat(2,minmax(0,1fr))}}

.iad-execution-rail .iad-execution-stages{grid-template-columns:minmax(0,1fr)}.iad-execution-rail .iad-execution-stages li{flex-direction:row}
.iad-detail-dialog.iad-direction-dialog{width:min(1280px,calc(100vw - 64px));height:fit-content;max-height:calc(100dvh - 64px);overflow:hidden;padding:0;display:flex;flex-direction:column}.iad-direction-dialog .iad-dialog-header{position:static;flex:none;padding:22px 28px 14px;margin:0;top:0}.iad-direction-dialog .iad-dialog-header h2{font-size:1.3125rem}.iad-direction-body{min-height:0;overflow:auto;padding:0 28px 20px}.iad-direction-meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--iad-muted);font-size:.75rem;padding:14px 0 20px}.iad-direction-objective{padding-bottom:20px;border-bottom:1px solid var(--iad-border)}.iad-detail-dialog.iad-direction-dialog h3{margin:0 0 12px}.iad-direction-body p{white-space:pre-line;overflow-wrap:anywhere;line-height:1.8}.iad-direction-text-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:32px;padding:20px 0;border-bottom:1px solid var(--iad-border)}.iad-direction-text-grid>section+section{padding-left:28px;border-left:1px solid var(--iad-border)}.iad-direction-text-grid ul{margin:0;padding-left:18px;display:grid;gap:10px}.iad-direction-evidence{padding-top:20px}.iad-evidence-groups{display:grid;grid-template-columns:minmax(0,var(--iad-normal-width,3fr)) minmax(0,var(--iad-defect-width,5fr));gap:24px}.iad-evidence-group{min-width:0}.iad-evidence-group h4{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;font-size:.75rem;font-weight:500;color:var(--iad-muted)}.iad-evidence-thumbnails>div:first-child{display:grid;grid-template-columns:repeat(var(--iad-evidence-columns),minmax(0,1fr));gap:10px}.iad-direction-evidence-item{display:grid;gap:6px;text-align:left;min-width:0;padding:5px!important;border-color:var(--iad-border)!important}.iad-direction-evidence-item img{width:100%;height:104px;object-fit:contain;background:var(--iad-surface-muted)}.iad-direction-evidence-item strong{font-size:.75rem;font-weight:500}.iad-direction-evidence-item>span{font-size:.625rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.iad-direction-evidence-item[data-focused=true]{outline:2px solid var(--iad-primary);outline-offset:2px;border-color:var(--iad-primary)!important}.iad-detail-dialog button.iad-evidence-ref{display:inline;min-height:0;padding:1px 5px;vertical-align:baseline;font-size:.75rem;color:var(--iad-primary);background:var(--iad-hover);border-color:var(--iad-border)}.iad-direction-trace{margin-top:16px;padding-top:12px;border-top:1px solid var(--iad-border);overflow-wrap:anywhere}.iad-direction-trace summary{cursor:pointer;min-height:32px}.iad-direction-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;flex:none;padding:14px 28px;border-top:1px solid var(--iad-border)}.iad-direction-destination{display:flex;align-items:center;gap:12px;color:var(--iad-muted);font-size:.75rem}.iad-direction-destination select{width:112px}.iad-missing-evidence{overflow-wrap:anywhere;font-size:.75rem}.iad-missing-evidence code{display:block}
@media(max-width:1050px){.iad-evidence-groups{grid-template-columns:minmax(0,1fr)}.iad-evidence-thumbnails>div:first-child{grid-template-columns:repeat(5,minmax(0,1fr))}}

@media(prefers-reduced-motion:reduce){.iad-indeterminate span{animation:none;margin:auto}}
`;

  // src/client/styles/base.ts
  var baseStyles = `.iad-detail-dialog,.iad-floating-menu-panel{overflow-wrap:anywhere;font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.iad-panel{min-width:0;padding:24px;border:1px solid var(--iad-border);border-radius:var(--iad-radius);background:var(--iad-surface)}.iad-panel>h3:first-child{margin-top:0}
.iad-workbench {container:workbench / inline-size;height:100%;box-sizing:border-box;overflow:auto;min-width:0;padding:var(--iad-page-padding);color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
:is(.iad-workbench,.iad-detail-dialog,.iad-floating-menu-panel) * {box-sizing:border-box;}
.iad-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:var(--iad-title-size);line-height:1.285714;margin:0;font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) h2 {font-size:var(--iad-section-size);line-height:1.4;margin:0 0 var(--iad-space-4);font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) h3 {font-size:var(--iad-group-size);line-height:1.5;margin:var(--iad-space-6) 0 var(--iad-space-2);font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) p {margin:0;}:is(.iad-workbench,.iad-detail-dialog) p+p {margin-top:12px;}
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
.iad-error {color:var(--iad-danger);background:color-mix(in srgb,var(--iad-danger) 12%,var(--iad-surface));padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-muted {color:var(--iad-muted);font-size:.75rem;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-review-records {min-width:0;padding:18px;background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-table-scroll {max-width:100%;overflow:auto;scroll-margin-block:24px;}.iad-review-records table {width:100%;min-width:620px;border-collapse:collapse;text-align:left;font-size:13px;}
.iad-review-records .iad-table-scroll {max-height:min(60dvh,480px);}
.iad-review-records caption {text-align:left;font-weight:600;margin:12px 0;}.iad-review-records th,.iad-review-records td {padding:12px;vertical-align:top;overflow-wrap:anywhere;max-width:240px;}
.iad-review-records thead,.iad-review-records tr[data-selected=true] {background:var(--iad-surface-muted);}.iad-review-records time {font-size:12px;color:var(--iad-muted);}
.iad-job-table {min-width:0;}.iad-job-table>.iad-field {max-width:240px;}.iad-identifier {display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-resource-table {width:100%;border-collapse:collapse;text-align:left;font-size:.875rem;}
.iad-resource-table th,.iad-resource-table td {padding:8px 16px;height:56px;border-bottom:1px solid var(--iad-border);vertical-align:middle;}
.iad-resource-table th {height:44px;background:var(--iad-surface-muted);font-weight:500;color:var(--iad-muted);white-space:nowrap;}
.iad-resource-table .iad-number {text-align:right;font-variant-numeric:tabular-nums;}
.iad-resource-table tr[data-selected=true] {background:var(--iad-hover);}
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
  var overlaysStyles = `.iad-viewer-hint{margin:0;padding:8px 20px;flex:none;border-top:1px solid var(--iad-control-border);color:color-mix(in srgb,var(--iad-on-viewer) 75%,var(--iad-viewer));font-size:.75rem;background:var(--iad-viewer)}.iad-viewer-zoom,.iad-viewer-navigation{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.iad-viewer-evidence-group h4{font-size:.75rem;color:var(--iad-muted);font-weight:500;margin:16px 0 8px}.iad-viewer-heading{flex:1;min-width:160px;overflow:hidden}.iad-viewer-heading strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iad-viewer-heading small{display:block;margin-top:4px;font-size:.75rem;color:var(--iad-muted)}
.iad-viewer-dialog .iad-lightbox{padding:0}.iad-lightbox>.iad-lightbox-toolbar{padding:12px 20px;gap:12px;border-bottom:1px solid var(--iad-control-border);background:var(--iad-surface);color:var(--iad-text)}.iad-lightbox>.iad-viewer-body{margin:0;gap:0}.iad-viewer-body.has-context{grid-template-columns:minmax(0,1fr) 288px}.iad-viewer-aux{min-width:0;min-height:0;overflow:auto}.iad-viewer-aux>.iad-inspection-panel{height:100%;border-radius:0}.iad-viewer-context{padding:24px 20px;background:var(--iad-surface);color:var(--iad-text);height:100%;border-left:1px solid var(--iad-control-border);overflow:auto}.iad-viewer-context h3{font-size:.875rem;margin:0 0 10px}.iad-viewer-context p{font-size:.75rem;line-height:1.8;overflow-wrap:anywhere;color:var(--iad-muted)}.iad-viewer-context section,.iad-viewer-context details{margin-top:20px;padding-top:20px;border-top:1px solid var(--iad-border)}.iad-viewer-context dl{font-size:.75rem;overflow-wrap:anywhere}.iad-viewer-context dd{margin-left:0}.iad-viewer-thumbnails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0 20px}.iad-viewer-thumbnails button{display:grid;gap:5px;padding:3px;min-width:0;font-size:.6875rem}.iad-viewer-thumbnails img{width:100%;height:80px;object-fit:contain;background:var(--iad-surface-muted)}.iad-viewer-thumbnails button[aria-current=true]{outline:2px solid var(--iad-primary);outline-offset:1px;background:var(--iad-hover)}

.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;color:var(--iad-on-viewer);}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-media-load {min-width:0;}.iad-media-error {display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px;background:var(--iad-surface);color:var(--iad-text);line-height:1.5;}
.iad-viewer-media {position:relative;display:flex;flex-direction:column;min-height:0;}
.iad-viewer-edge-nav{position:absolute;inset:0;z-index:5;display:flex;justify-content:space-between;align-items:center;pointer-events:none}
.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button{display:grid;place-items:center;width:80px;height:216px;flex:none;padding:0;border:0;border-radius:0;background:transparent;color:var(--iad-on-viewer);opacity:0;pointer-events:auto;transition:opacity 150ms ease}
.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button:is(:hover,:focus-visible){opacity:1}
.iad-viewer-edge-disc{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--iad-viewer-edge-fill);border:1px solid var(--iad-viewer-edge-border);box-shadow:0 2px 10px var(--iad-viewer-edge-shadow);transition:background 150ms ease}
.iad-viewer-edge-button:is(:hover,:focus-visible)>.iad-viewer-edge-disc{background:var(--iad-viewer-edge-hover);border-color:var(--iad-viewer-edge-hover-border)}
.iad-viewer-edge-button:disabled>.iad-viewer-edge-disc{opacity:.38}
.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}
@media(hover:none){.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button:not(:disabled){opacity:1}}
@media(prefers-reduced-motion:reduce){.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button,.iad-viewer-edge-disc{transition:none}}
.iad-viewer-media>.iad-media-loading {position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:calc(100% - 32px);padding:12px 16px;border-radius:var(--iad-radius);background:var(--iad-viewer);color:var(--iad-on-viewer);line-height:1.5;pointer-events:none;}
.iad-viewer-media[aria-busy=true] .iad-viewer-world {visibility:hidden;}
.iad-viewer-media>.iad-media-error {position:absolute;left:0;right:0;bottom:0;z-index:1;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-roi-hint {position:absolute;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;max-width:min(280px,calc(100% - 24px));padding:8px 12px;border-radius:6px;background:var(--iad-surface);color:var(--iad-text);font-size:13px;line-height:1.5;overflow-wrap:anywhere;cursor:default;}
.iad-viewer-body {display:grid;grid-template-columns:minmax(0,1fr);flex:1;min-height:0;margin-top:18px;gap:16px;}
.iad-viewer-body.has-inspection:not(.has-context) {grid-template-columns:minmax(0,1fr) 340px;}
.iad-inspection-panel {padding:16px;min-width:0;overflow:auto;background:var(--iad-surface);color:var(--iad-text);border-radius:8px;}
.iad-inspection-panel img {display:block;width:100%;max-height:220px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-roi-list {display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.iad-roi-list button[aria-pressed=true],.iad-actions button[aria-current=true] {border-color:var(--iad-primary);background:var(--iad-hover);}
.iad-roi-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;}
.iad-roi-layer rect {fill:none;stroke:var(--iad-on-viewer);stroke-width:calc(1px / var(--iad-view-scale,1));stroke-dasharray:calc(5px / var(--iad-view-scale,1)) calc(4px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-roi-layer [data-locked=true] rect,.iad-roi-layer .is-hovered rect {stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));stroke-dasharray:none;}

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
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}
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

.iad-discovery-area {margin:12px 0;}.iad-discovery-area h3 {margin:0 0 8px;}

.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:6px;padding:16px;}
.iad-detail-dialog.iad-inline-dialog {position:sticky;inset:auto;top:0;width:100%;max-width:none;max-height:none;margin:0;padding:0;overflow:visible;background:transparent;}.iad-inline-dialog .iad-inspector{position:static}
.iad-detail-dialog.iad-drawer {width:min(560px,100%);max-width:100%;height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;padding:24px;}.iad-drawer .iad-config-bar {display:grid;gap:16px;}.iad-drawer .iad-config-bar>.iad-field {margin:0;}.iad-drawer .iad-job-panel {min-width:0;}
.iad-detail-dialog.iad-confirm-dialog {width:min(440px,calc(100% - 32px));}
.iad-detail-dialog.iad-viewer-dialog {width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;background:var(--iad-viewer);overflow:hidden;}
.iad-detail-dialog::backdrop {background:var(--iad-scrim);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}

@container workbench (max-width:959px){.iad-workbench{--iad-page-padding:var(--iad-space-6)}}

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

`;

  // src/client/styles/knowledge.ts
  var knowledgeStyles = `
.iad-knowledge-setup{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start;min-width:0}.iad-mining-main{min-width:0}.iad-mining-main>.iad-setup-section:first-child{padding-top:0}.iad-mining-rail{display:grid;gap:20px;min-width:0}.iad-mining-rail>.iad-panel{padding:20px}.iad-mining-rail .iad-field{margin-top:0}.iad-mining-rail .iad-row{display:grid;grid-template-columns:minmax(0,1fr);align-items:start}.iad-mining-rail .iad-config-bar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.iad-source-coverage{margin:12px 0;font-size:.75rem;color:var(--iad-muted)}.iad-source-coverage summary{cursor:pointer}.iad-knowledge-setup .iad-mining-rail .iad-short-field{width:100%}.iad-mining-rail .iad-source-picker>.iad-row{display:flex}.iad-mining-rail .iad-source-preview{margin:12px 0}.iad-mining-rail button[data-action]{width:100%;margin-top:20px}.iad-mining-rail .iad-panel>p{margin-top:16px}
.iad-directions-form{padding:0;margin:0;border:0;min-width:0}.iad-direction-tabs{display:flex;gap:24px;border-bottom:1px solid var(--iad-control-border);margin-bottom:16px;overflow:auto}.iad-direction-tabs>button{border:0;border-radius:0;border-bottom:2px solid transparent;padding:10px 0;background:transparent!important;white-space:nowrap;color:var(--iad-muted)}.iad-direction-tabs>button[aria-pressed=true]{color:var(--iad-primary);border-bottom-color:var(--iad-primary);font-weight:600}.iad-exploration-version{display:flex;align-items:center;gap:12px;max-width:480px;margin:16px 0}.iad-exploration-version select{flex:1;min-width:0}.iad-direction-tools{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:16px 0}.iad-direction-tools>.iad-field{margin:0;flex:0 1 290px}.iad-direction-tools>.iad-field input{width:100%}.iad-direction-tools>label:not(.iad-field){display:flex;align-items:center;gap:8px;white-space:nowrap}.iad-direction-tools>button{margin-left:auto}.iad-direction-list{margin-top:8px;border-top:1px solid var(--iad-border)}.iad-direction-list>div{border-bottom:1px solid var(--iad-border);min-width:0}.iad-direction-list>div[data-focused=true]{box-shadow:inset 3px 0 var(--iad-primary)}.iad-direction-row{display:grid;grid-template-columns:20px minmax(0,1fr) 128px;gap:16px;align-items:center;min-height:76px;padding:16px 0}.iad-direction-label{min-width:0}.iad-direction-label strong{font-weight:500}.iad-direction-label p{margin:4px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.75rem;color:var(--iad-muted)}.iad-direction-actions{display:flex;justify-content:flex-end;gap:8px;align-items:center}.iad-direction-actions>button:not(.iad-icon-button){border-color:transparent;background:transparent;color:var(--iad-primary);padding:4px;min-height:32px}.iad-direction-editor{padding:0 0 20px 36px}.iad-direction-editor .iad-field{margin-top:0}.iad-direction-savebar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:20px;padding-top:20px;border-top:1px solid var(--iad-border)}.iad-direction-savebar>.iad-muted{margin-right:auto}.iad-direction-list+.iad-muted{padding:20px 0}.iad-mining-directions .iad-setup-section:last-child{border-bottom:0;padding-bottom:0}
@container workbench (max-width:1040px){.iad-knowledge-setup{grid-template-columns:minmax(0,1fr)}.iad-mining-rail{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}}

.iad-knowledge-context {display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:20px;min-width:0;}
.iad-knowledge-context>.iad-field {margin:0;max-width:260px;min-width:0;}.iad-knowledge-context>.iad-field select {width:220px;max-width:100%;}
.iad-knowledge-context .iad-row {gap:12px;}.iad-knowledge-context .iad-row>button{border-color:transparent;background:transparent;color:var(--iad-primary);padding:6px 4px}
.iad-knowledge-content:not(:has(.iad-knowledge-split)){padding:24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}.iad-knowledge-overview{margin:8px 0}.iad-knowledge-overview>summary{cursor:pointer;color:var(--iad-muted);font-size:12px}.iad-knowledge-content>button{margin-top:16px}
.iad-knowledge-split {display:grid;grid-template-columns:272px minmax(0,1fr);align-items:start;margin-top:20px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}
.iad-check-list {display:grid;gap:4px;padding:16px;border-right:1px solid var(--iad-border);min-width:0;}.iad-check-list>button {display:grid;gap:8px;text-align:left;border:0;padding:16px;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
.iad-check-list [aria-label="\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009"]{display:grid;gap:12px}.iad-check-list .iad-field{margin:0}.iad-check-list [aria-label="\u77E5\u8BC6\u6761\u76EE\u7B5B\u9009"] input{width:100%}
.iad-check-detail {min-width:0;padding:20px 32px;}.iad-freshness {margin:16px 0;}.iad-freshness>summary {cursor:pointer;min-height:40px;padding:8px 0;}
.iad-check-detail .iad-knowledge-evidence{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.iad-check-detail .iad-knowledge-evidence button{min-width:0;text-align:left}.iad-check-detail .iad-knowledge-evidence img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain}.iad-check-detail .iad-knowledge-evidence small{max-width:100%}
@container workbench (max-width:1180px){.iad-knowledge-split {grid-template-columns:240px minmax(0,1fr);}.iad-check-detail{padding:20px 24px}}
@container workbench (max-width:900px){.iad-knowledge-split {grid-template-columns:220px minmax(0,1fr);}.iad-check-detail .iad-knowledge-evidence{grid-template-columns:repeat(2,minmax(0,1fr));}}

`;

  // src/client/styles/setup.ts
  var setupStyles = `.iad-setup {max-width:1040px;min-width:0;padding:24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}.iad-workbench .iad-short-field{flex:none;width:88px;margin:0 0 16px}.iad-short-field input{width:100%}.iad-form-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;padding-top:20px;margin-top:24px;border-top:1px solid var(--iad-border)}.iad-form-footer>.iad-muted{margin-right:auto}
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

  // src/client/styles/datasets.ts
  var datasetsStyles = `
.iad-workbench[data-page="industrial-datasets"]{padding-top:28px}
.iad-settings{display:grid;gap:28px;min-width:0}
.iad-settings>section{min-width:0}
.iad-dataset-list>.iad-table-scroll,.iad-dataset-detail>.iad-tab-panel{background:var(--iad-surface);border:1px solid var(--iad-panel-border);border-radius:var(--iad-radius)}
.iad-dataset-list .iad-section-header input{width:240px;max-width:100%}
.iad-dataset-list h2>.iad-muted{margin-left:4px;font-size:.8125rem;font-weight:400}
.iad-dataset-list .iad-resource-table{min-width:700px;table-layout:fixed;font-size:.8125rem}
.iad-dataset-list th,.iad-dataset-list td{padding:10px 16px}
.iad-dataset-list th{height:44px;font-size:.75rem}
.iad-dataset-list td{height:60px}
.iad-dataset-list tbody tr:last-child td{border-bottom:0}
.iad-dataset-list tbody tr:not([data-selected=true]):hover{background:var(--iad-surface-muted)}
.iad-dataset-list td:last-child>.iad-row{flex-wrap:nowrap;gap:4px}
.iad-dataset-list .iad-name-trigger{font-size:inherit}
.iad-dataset-detail>.iad-section-header{margin-bottom:12px}
.iad-dataset-detail h2{overflow-wrap:anywhere}
.iad-dataset-detail>.iad-tab-panel{padding:24px}
.iad-dataset-detail .iad-section-layout{grid-template-columns:180px minmax(0,1fr);gap:32px;padding:0;border:0}
.iad-dataset-detail .iad-section-layout .iad-field{margin:0 0 16px}
.iad-dataset-detail .iad-section-layout h3{margin:0}
.iad-dataset-detail .iad-section-layout h3+.iad-muted{margin-top:8px}
.iad-dataset-detail .iad-rule{margin-top:20px}
.iad-dataset-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}
.iad-dataset-footer .iad-form-actions{margin:0;flex:none}
.iad-dataset-footer [data-dirty=true]{color:var(--iad-warning)}
.iad-dataset-basic h3{margin:0 0 24px}
.iad-workbench .iad-dataset-basic dl{grid-template-columns:150px minmax(0,1fr);gap:14px 28px;align-items:center;font-size:.8125rem;margin:0}
.iad-dataset-basic dd{min-height:40px;display:flex;align-items:center;gap:12px}
.iad-dataset-basic dd:last-child{flex-wrap:wrap}
.iad-dataset-basic dd code{overflow-wrap:anywhere;white-space:normal;overflow:visible;background:var(--iad-surface-muted);color:var(--iad-muted);padding:8px 10px;border-radius:var(--iad-radius)}
.iad-dataset-name{min-width:0;flex:1;margin:0}
.iad-workbench .iad-name-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;padding:4px 0;background:transparent;border-color:transparent;text-align:left;font-weight:600;min-height:40px}
.iad-name-trigger span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iad-name-trigger svg{flex-shrink:0;color:var(--iad-muted)}
.iad-dataset-name input{width:100%}
.iad-preview-table{width:100%;min-width:480px;border-collapse:collapse;table-layout:fixed;text-align:left;font-size:.8125rem}
.iad-preview-table th,.iad-preview-table td{padding:10px 16px;height:60px;border-bottom:1px solid var(--iad-border)}
.iad-preview-table th{height:44px;background:var(--iad-surface-muted);color:var(--iad-muted);font-weight:500;font-size:.75rem}
.iad-preview-table th:nth-child(1){width:44%}
.iad-preview-table th:nth-child(2){width:18%}
.iad-preview-table th:nth-child(3){width:38%}
.iad-preview-table tbody tr:last-child td{border-bottom:0}
.iad-preview-table td:first-child{overflow-wrap:anywhere}
.iad-preview-table .iad-number{text-align:right;font-variant-numeric:tabular-nums}
.iad-preview-table select{width:150px;max-width:100%;min-height:40px}
.iad-folder-rules>.iad-muted{margin:12px 0}
.iad-folder-rules>.iad-muted strong{font-weight:600;color:var(--iad-text)}
.iad-directory{min-width:0;margin:0;border:1px solid var(--iad-border);background:var(--iad-surface-muted);padding:14px;border-radius:var(--iad-radius)}
.iad-directory code{overflow-wrap:anywhere}
.iad-directory-list{display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px}
.iad-detail-dialog.iad-dataset-dialog{width:min(740px,calc(100% - 32px));padding:24px;border-color:var(--iad-border);border-radius:8px;box-shadow:0 20px 60px var(--iad-dialog-shadow)}
.iad-dataset-dialog>.iad-dialog-header{padding:0 0 16px;top:-24px;border-bottom:1px solid var(--iad-border);margin-bottom:20px}
.iad-dataset-import{margin:auto}
.iad-dataset-import>.iad-field:first-child{margin-top:0}
.iad-dataset-import [role=radiogroup]{flex-wrap:nowrap;gap:8px}
.iad-dataset-import [role=radiogroup]>label{display:flex;align-items:center;gap:8px;flex:1;padding:12px 16px;border:1px solid var(--iad-border);border-radius:var(--iad-radius);cursor:pointer}
.iad-dataset-import [role=radiogroup] input{flex:none}
.iad-dataset-import [role=radiogroup]>label:has(:checked){border-color:var(--iad-primary);background:var(--iad-hover);color:var(--iad-primary)}
@container workbench (max-width:980px){.iad-dataset-detail .iad-section-layout{grid-template-columns:150px minmax(0,1fr);gap:20px}}


`;

  // src/client/styles/consistency.ts
  var consistencyStyles = `
.iad-workbench.iad-consistency{padding:28px 30px 36px}.iad-consistency .iad-header{margin-bottom:20px}.iad-consistency .iad-header h1{font-size:27px}
.iad-consistency .iad-consistency-query{padding:18px 20px 16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;margin-bottom:14px}
.iad-consistency .iad-consistency-query .iad-row{align-items:end;gap:12px;flex-wrap:wrap}.iad-consistency-query .iad-filter{min-width:145px;gap:7px;color:var(--iad-muted);font-size:12px}.iad-consistency-query .iad-filter :is(select,input){font-size:14px;height:40px}
.iad-consistency-summary{margin:12px 0 14px}.iad-consistency-status{display:flex;align-items:center;flex-wrap:wrap;gap:10px 24px;padding:11px 15px;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface-muted);font-size:12px}.iad-consistency-status strong{font-weight:650}.iad-consistency-status>span{white-space:nowrap}
.iad-consistency-summary-details{margin-left:auto;position:relative}.iad-consistency-summary-details>summary{cursor:pointer;color:var(--iad-muted)}.iad-consistency-summary-body{position:absolute;right:0;top:28px;z-index:8;width:540px;max-width:75vw;padding:16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px}.iad-consistency-summary-body .iad-row{gap:10px}
.iad-consistency-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:290px;padding:44px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;text-align:center;color:var(--iad-muted)}.iad-consistency-empty h2{font-size:16px;color:var(--iad-text);margin:16px 0 6px}.iad-consistency-empty p{margin:0 0 18px;max-width:560px}.iad-consistency-empty .iad-row{justify-content:center}
.iad-consistency-master-detail{display:grid;grid-template-columns:minmax(290px,380px) minmax(0,1fr);gap:14px;align-items:start}.iad-consistency-list,.iad-consistency-detail{min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;overflow:hidden}
.iad-consistency-panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 16px 13px;border-bottom:1px solid var(--iad-border)}.iad-consistency-panel-header strong{font-size:15px}.iad-consistency-panel-header>span{color:var(--iad-muted);font-size:12px}
.iad-consistency-list-scroll>button.iad-consistency-thumbnail-item{display:grid;grid-template-columns:48px minmax(0,1fr);gap:11px;align-items:center}.iad-consistency-thumbnail-item>img{width:45px;height:52px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-list-caption{display:grid;gap:5px;min-width:0}.iad-consistency-list-caption strong{color:var(--iad-text)}
.iad-consistency-list-scroll{max-height:570px;overflow:auto}.iad-consistency-list-scroll>button{display:flex;flex-direction:column;align-items:stretch;gap:5px;width:100%;padding:15px 16px;min-height:88px;border:0;border-bottom:1px solid var(--iad-border);border-radius:0;background:var(--iad-surface);text-align:left;white-space:normal}.iad-consistency-list-scroll>button[aria-pressed=true]{background:var(--iad-hover);box-shadow:inset 3px 0 var(--iad-primary)}.iad-consistency-list-scroll>button strong{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iad-consistency-list-scroll>button :is(span,small){font-size:12px;color:var(--iad-muted)}
.iad-consistency-detail-body{padding:16px}.iad-consistency-pair-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:12px}.iad-consistency-pair-meta>div{display:grid;gap:5px;min-width:0}.iad-consistency-pair-meta strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.iad-consistency-pair-meta span{font-size:12px;color:var(--iad-muted)}.iad-consistency-detail-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:14px;margin-top:14px;border-top:1px solid var(--iad-border)}
.iad-consistency-preview .iad-consistency-canvases{margin-top:10px}.iad-consistency-preview .iad-consistency-side>p,.iad-consistency-preview .iad-viewer-heading{display:none}.iad-consistency .iad-consistency-preview .iad-lightbox-toolbar{padding:6px;flex-wrap:nowrap}.iad-consistency .iad-consistency-preview .iad-viewer-zoom select{width:90px}.iad-consistency .iad-consistency-preview .iad-embedded-canvas{height:250px}.iad-consistency-preview .iad-consistency-differences{max-height:150px;margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}.iad-consistency-preview .iad-consistency-differences>h2,.iad-consistency-preview .iad-consistency-differences>p{flex-basis:100%;margin:0}.iad-consistency-preview .iad-consistency-differences>dl{font-size:12px;margin:5px 0}.iad-consistency-preview .iad-consistency-differences>button{width:auto;flex:1;min-width:160px;margin:0;padding:10px;border:1px solid var(--iad-border);border-radius:5px}
.iad-consistency-search-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start}.iad-consistency-candidate-grid{display:grid;align-content:start;align-items:start;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px;max-height:570px;overflow:auto;min-height:360px}.iad-consistency-candidate-grid>button{display:flex;flex-direction:column;gap:5px;padding:9px;min-width:0;text-align:left;white-space:normal;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface)}.iad-consistency-candidate-grid>button[aria-pressed=true]{border-color:var(--iad-primary);background:var(--iad-hover)}.iad-consistency-candidate-grid img{display:block;width:100%;height:146px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-candidate-grid strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.iad-consistency-candidate-grid :is(span,small){font-size:12px;color:var(--iad-muted)}.iad-consistency-detail-photo{width:100%;height:290px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-detail-body dl{display:grid;grid-template-columns:90px minmax(0,1fr);gap:7px;font-size:12px;margin-top:14px}.iad-consistency-detail-body dt{color:var(--iad-muted)}.iad-consistency-detail-body dd{margin:0;overflow-wrap:anywhere}.iad-consistency-result-pagination{margin:12px 0}
.iad-consistency-jobs{display:grid;gap:16px;margin-top:14px}.iad-consistency-jobs .iad-resource-table{width:100%;table-layout:fixed}.iad-consistency-jobs .iad-resource-table :is(th,td){padding:13px 16px}.iad-consistency-jobs .iad-resource-table tr[aria-selected=true]{background:var(--iad-hover)}.iad-consistency-jobs td small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--iad-muted);font-size:11px;margin-top:4px}.iad-consistency-jobs [aria-label="\u6279\u6B21\u8BE6\u60C5"]{padding:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-jobs progress{width:100%;accent-color:var(--iad-primary)}.iad-consistency-text-button{min-height:0;border:0;background:none;padding:0;text-align:left;color:var(--iad-primary)}
.iad-consistency-expanded{margin-top:14px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-expanded>.iad-consistency-layout{padding:16px;margin:0}
.iad-consistency-query fieldset,.iad-consistency-review fieldset{border:0;padding:0;margin:0;min-width:0}
.iad-consistency-query .iad-filter input{min-width:0;max-width:100%}.iad-consistency-query input[type=file]{width:178px}.iad-consistency-query .iad-query-search{flex:1;min-width:190px}.iad-consistency-query .iad-query-search input{width:100%}.iad-consistency-query .iad-query-sample{flex:0 1 224px;min-width:200px}.iad-consistency-query .iad-query-sample select{width:100%}
.iad-consistency-query .iad-pagination{padding:0;margin-left:auto}.iad-consistency-query-actions{margin-top:14px}.iad-consistency-advanced summary{cursor:pointer;min-height:40px;display:flex;align-items:center;color:var(--iad-muted)}.iad-consistency-advanced[open]{flex:1}.iad-consistency-advanced .iad-row{margin:8px 0}
.iad-consistency-scope summary{cursor:pointer;min-height:40px;display:flex;align-items:center}.iad-consistency-scope label{display:flex;align-items:center;gap:8px;margin:8px 0}
.iad-consistency-results>p{margin:8px 0 16px}.iad-consistency-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:start;margin-top:20px}
.iad-consistency-differences{min-width:0;max-height:620px;overflow:auto}.iad-consistency-differences button{display:flex;flex-direction:column;align-items:stretch;text-align:left;white-space:normal;width:100%;padding:12px;gap:6px;border:0;background:var(--iad-surface);margin-bottom:8px}
.iad-consistency-differences button.is-selected{background:var(--iad-hover);box-shadow:inset 3px 0 var(--iad-primary)}.iad-consistency-differences button small{color:var(--iad-muted);font-size:12px}
.iad-consistency-comparison{min-width:0}.iad-consistency-canvases{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.iad-consistency-side{min-width:0}.iad-consistency-side>p{margin-bottom:8px;color:var(--iad-muted)}
.iad-consistency .iad-embedded-canvas{height:470px;min-height:0}.iad-consistency .iad-lightbox-toolbar{gap:6px;padding:10px;flex-wrap:wrap}.iad-consistency .iad-viewer-heading{flex-basis:100%}.iad-consistency .iad-viewer-heading strong{font-size:12px}.iad-consistency .iad-viewer-zoom select{width:112px}
.iad-consistency-differences h2{font-size:16px;margin:0 0 12px}.iad-consistency-differences dl{grid-template-columns:80px minmax(0,1fr)}.iad-consistency-region rect{stroke:var(--iad-danger);fill:color-mix(in srgb,var(--iad-danger) 8%,transparent);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke}
.iad-consistency .iad-frozen-comparison .iad-embedded-canvas{height:620px}
`;

  // src/client/styles.ts
  var workbenchStyles = themeStyles + controlStyles + modelsStyles + explorationStyles + baseStyles + collectionsStyles + jobsStyles + overlaysStyles + formsStyles + reviewStyles + knowledgeStyles + setupStyles + datasetsStyles + consistencyStyles;

  // src/client/useSampleNavigation.ts
  var import_react52 = __require("react");
  function useSampleNavigation(pageId, taskId, query, result, enabled) {
    const { workspace, state } = useWorkspace();
    const view = workspace.view(pageId);
    const [busy, setBusy] = (0, import_react52.useState)(false);
    const [error2, setError] = (0, import_react52.useState)("");
    const [target, setTarget] = (0, import_react52.useState)("");
    const pending = (0, import_react52.useRef)();
    const position = enabled && result.query === query ? result.items.findIndex((item) => item.sample_id === view.selected) : -1;
    const previous = position >= 0 && (position > 0 || view.page > 1);
    const next = position >= 0 && (position < result.items.length - 1 || view.page * pageSize < result.total);
    const cancel = (0, import_react52.useCallback)(() => {
      pending.current?.abort();
      pending.current = void 0;
      setBusy(false);
      setError("");
      setTarget("");
    }, []);
    const opened = (0, import_react52.useCallback)(() => setTarget(""), []);
    (0, import_react52.useEffect)(() => {
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
  var import_react53 = __require("react");
  function usePagePosition(source, ready) {
    const { workspace } = useWorkspace();
    const surface = (0, import_react53.useRef)(null);
    (0, import_react53.useLayoutEffect)(() => {
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
  var import_jsx_runtime58 = __require("react/jsx-runtime");
  function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [auditSetupOpen, setAuditSetupOpen] = (0, import_react54.useState)(false);
    const [auditDetailOpen, setAuditDetailOpen] = (0, import_react54.useState)(false);
    const [auditWidth, setAuditWidth] = (0, import_react54.useState)(null);
    const [datasets, setDatasets] = (0, import_react54.useState)([]);
    const [result, setResult] = (0, import_react54.useState)({ query: "", items: [], total: 0 });
    const [loading, setLoading] = (0, import_react54.useState)(false);
    const [error2, setError] = (0, import_react54.useState)("");
    const [revision, setRevision] = (0, import_react54.useState)(0);
    const advance = (0, import_react54.useRef)(null);
    const [reviewConfirmation, setReviewConfirmation] = (0, import_react54.useState)(null);
    const dataset = datasets.find((d) => d.dataset_id === datasetId);
    const loadDatasets = (0, import_react54.useCallback)(async (preferred, signal) => {
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
    const changed = (0, import_react54.useCallback)(() => {
      setRevision((v) => v + 1);
      void loadDatasets();
    }, [loadDatasets]);
    const audit = useJobs("audit", pageId === "industrial-audit" ? datasetId : "", changed, workspace.view("industrial-audit").job);
    (0, import_react54.useEffect)(() => {
      const controller = new AbortController();
      void loadDatasets(void 0, controller.signal);
      return () => controller.abort();
    }, [loadDatasets]);
    const gallery = pageId === "industrial-images" || (pageId === "industrial-review" || pageId === "industrial-audit") && view.tab === "results";
    const query = sampleQuery(datasetId, view.filters, view.page, pageSize);
    const navigation2 = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
    const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
    (0, import_react54.useEffect)(() => {
      if (pageId !== "industrial-audit" || !surface.current) return;
      const observer = new ResizeObserver(([entry]) => setAuditWidth(entry.borderBoxSize[0].inlineSize));
      observer.observe(surface.current);
      return () => observer.disconnect();
    }, [pageId, surface]);
    (0, import_react54.useEffect)(() => setAuditDetailOpen(false), [datasetId, view.tab]);
    const auditCompact = auditWidth !== null && auditWidth <= 900;
    const auditModalOpen = auditCompact && (auditDetailOpen || !!view.inspection);
    (0, import_react54.useEffect)(() => {
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
    const grid = dataset && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(SampleGrid, { layout: pageId === "industrial-review" ? "queue" : "grid", showFilters: pageId === "industrial-images", dataset, filters: view.filters, onFilters: updateFilters, items: result.query === query ? result.items : [], total: result.query === query ? result.total : 0, page: view.page, onPage: (page) => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: (selected) => {
      workspace.updateView(pageId, { selected });
      if (pageId === "industrial-audit") setAuditDetailOpen(auditCompact);
    }, loading, sourceManagement: pageId === "industrial-images" ? { active: view.tab === "sources", onChanged: changed } : void 0 }, datasetId);
    const inspectedSample = pageId === "industrial-review" && view.tab === "records" ? view.historySampleId : view.selected;
    const inspector = dataset && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(SampleInspector, { dataset, sampleId: inspectedSample, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-images" ? "browse" : "model", queue: pageId === "industrial-review" && view.tab === "results" ? grid : void 0, filters: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(SampleFilters, { defaults: initialReviewFilters, dataset, filters: view.filters, onFilters: updateFilters }), advanceOnSubmit: view.tab === "results" && view.filters.review_status === "pending", panel: pageId === "industrial-audit" ? {
      presentation: auditWidth === null ? "closed" : auditModalOpen ? "modal" : auditCompact ? "closed" : "inline",
      onOpen: setAuditDetailOpen,
      onClose: () => {
        setAuditDetailOpen(false);
        workspace.updateView(pageId, { inspection: null }, true);
      },
      restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null
    } : void 0, revision, onReviewed: reviewed, jobs: audit.jobs, onJobsChanged: audit.refresh, navigation: gallery ? navigation2 : void 0 }, pageId === "industrial-review" && view.tab === "results" ? datasetId : `${datasetId}:${inspectedSample}`);
    const datasetControls = /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: (event) => workspace.selectDataset(event.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }),
        datasets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("option", { value: item.dataset_id, children: [
          item.name,
          " (",
          item.total_samples,
          ")"
        ] }, item.dataset_id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(IconButton, { label: "\u5237\u65B0", onClick: changed, children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(RefreshIcon, {}) })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { ref: surface, className: "iad-workbench", "data-page": pageId, children: [
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("style", { children: workbenchStyles }),
      pageId !== "industrial-datasets" && (!dataset || pageId !== "industrial-exploration" && pageId !== "industrial-knowledge") && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(WorkbenchHeader, { pageId, children: [
        datasetControls,
        pageId === "industrial-audit" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("button", { className: "iad-primary", disabled: !dataset, onClick: () => setAuditSetupOpen(true), children: "\u65B0\u5EFA\u5BA1\u8BA1" })
      ] }),
      (error2 || audit.error) && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("p", { role: "alert", className: "iad-error", children: error2 || audit.error }),
      pageId === "industrial-datasets" ? /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(import_jsx_runtime58.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(DatasetManager, { datasets, selected: dataset, onChanged: (id) => {
        void loadDatasets(id);
        setRevision((v) => v + 1);
      } }) }) : !dataset ? /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("section", { className: "iad-job-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684\u6570\u636E\u96C6\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
        pageId === "industrial-exploration" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(ExplorationPage, { dataset, refreshRevision: revision, headerActions: datasetControls }, datasetId),
        pageId === "industrial-knowledge" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(KnowledgePage, { dataset, kind: state.knowledgeKind, refreshRevision: revision, headerActions: datasetControls }, `${datasetId}:${state.knowledgeKind}`),
        pageId === "industrial-images" && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(PageTabs, { label: "\u56FE\u50CF\u89C6\u56FE", items: [{ id: "results", label: "\u5168\u90E8\u56FE\u50CF" }, { id: "sources", label: "\u826F\u54C1\u6765\u6E90" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab, selected: "" }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("div", { className: "iad-browse", children: grid }),
          view.selected && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null, onClose: () => workspace.updateView(pageId, { selected: "" }), children: inspector })
        ] }),
        pageId === "industrial-audit" && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(PageTabs, { label: "\u5BA1\u8BA1\u89C6\u56FE", items: [{ id: "results", label: "\u7ED3\u679C" }, { id: "jobs", label: "\u6A21\u578B\u5BA1\u8BA1\u4F5C\u4E1A" }, { id: "reports", label: "\u62A5\u544A" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
            view.tab !== "jobs" && audit.jobs.some((job) => ["RUNNING", "PENDING"].includes(job.status)) && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("p", { role: "status", children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("button", { onClick: () => workspace.updateView(pageId, { tab: "jobs" }), children: "\u67E5\u770B\u6267\u884C\u4E2D\u7684\u5BA1\u8BA1\u4F5C\u4E1A" }) }),
            view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(SampleFilters, { dataset, filters: view.filters, onFilters: updateFilters }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "iad-main", "data-compact": auditCompact, children: [
                grid,
                inspector
              ] })
            ] }),
            view.tab === "jobs" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(AuditJobs, { jobs: audit.jobs, onJobsChanged: audit.refresh }),
            view.tab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(AuditReport, { dataset }, datasetId)
          ] }),
          auditSetupOpen && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Modal, { title: "\u65B0\u5EFA\u6A21\u578B\u5BA1\u8BA1", className: "iad-drawer", onClose: () => setAuditSetupOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(AuditSetup, { dataset, filters: view.filters, jobs: audit.jobs, revision, onJobsChanged: audit.refresh, onStarted: (job) => {
            setAuditSetupOpen(false);
            workspace.updateView(pageId, { tab: "jobs", job: job.run_id });
          } }, datasetId) })
        ] }),
        pageId === "industrial-review" && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(PageTabs, { label: "\u590D\u6838\u89C6\u56FE", items: [{ id: "results", label: "\u590D\u6838\u961F\u5217" }, { id: "conflicts", label: "\u77E5\u8BC6\u51B2\u7A81" }, { id: "records", label: "\u590D\u6838\u8BB0\u5F55" }], value: view.tab, onChange: (tab) => workspace.updateView(pageId, { tab }), children: [
          view.tab === "conflicts" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(KnowledgeConflictReview, { datasetId }, datasetId),
          view.tab === "results" && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
            reviewConfirmation?.datasetId === datasetId && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("p", { role: "status", className: "iad-review-confirmation", children: [
              "\u5DF2\u63D0\u4EA4 ",
              reviewConfirmation.name,
              " \xB7 ",
              reviewLabel(reviewConfirmation.decision)
            ] }),
            inspector
          ] }),
          view.tab === "records" && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
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
    async explainConsistency(context, returnLink, previousSessionId) {
      const id = previousSessionId ? SessionId(previousSessionId) : await this.host.sessions.create();
      const link = returnLink(id);
      context = { ...context, return_location: { pageId: "industrial-consistency", ...context.return_location, sessionId: id } };
      await this.host.sessions.using(id, { source: "iadConsistency" }, async (reference) => {
        const binding = await reference.ready;
        const text = [
          "\u8BF7\u89E3\u91CA\u8FD9\u4EFD\u51BB\u7ED3\u7684\u4E00\u81F4\u6027\u8BC1\u636E\u53CA\u6240\u9009\u5DEE\u5F02\uFF0C\u533A\u5206\u539F\u56FE\u4E8B\u5B9E\u3001\u53CC\u65B9\u6807\u6CE8\u3001\u89C4\u8303\u3001\u4EBA\u5DE5\u590D\u6838\u3001\u63A8\u65AD\u548C\u5F85\u786E\u8BA4\u4E8B\u9879\u3002",
          `\u4E00\u81F4\u6027\u8BC1\u636E\u5F15\u7528\uFF1A${JSON.stringify(context)}`,
          `\u8FD4\u56DE\u6BD4\u8F83\u8BC1\u636E\uFF1A${link}`,
          "\u5148\u7528 consistency_context \u6821\u9A8C\u5F15\u7528\u5E76\u5B9E\u9645\u8BFB\u53D6\u5B83\u8FD4\u56DE\u7684\u56FE\u7247\u9644\u4EF6\uFF0C\u6309 next_cursor \u7EE7\u7EED\u6240\u9009\u5DEE\u5F02\uFF1B\u8BF4\u660E\u5269\u4F59\u548C\u672A\u9009\u62E9\u8303\u56F4\u3002\u4FDD\u7559\u8FD4\u56DE\u94FE\u63A5\uFF0C\u4E0D\u542F\u52A8\u5168\u5E93\u68C0\u67E5\u3001\u77E5\u8BC6\u6316\u6398\u3001\u6A21\u578B\u5BA1\u8BA1\u6216\u4EBA\u5DE5\u88C1\u51B3\u3002"
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
  var import_jsx_runtime59 = __require("react/jsx-runtime");
  function SessionResult(props) {
    const { workspace } = useWorkspace();
    const meta = props.phase === "result" ? props.block.meta : null;
    const result = meta?.type === "industrial-workbench" ? meta : null;
    return /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("section", { className: "iad-tool-card", "aria-label": props.title, "data-iad-tool": props.toolName, children: [
      /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("style", { children: [
        themeStyles,
        controlStyles,
        `
      .iad-tool-card{background:var(--iad-surface);color:var(--iad-text);border-radius:var(--iad-radius);padding:12px;margin:8px 0;overflow-wrap:anywhere}
      .iad-tool-card p{margin:4px 0}.iad-tool-card nav{display:flex;flex-wrap:wrap;gap:8px}

    `
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("strong", { children: props.title }),
      props.phase !== "result" ? /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("p", { role: "status", children: props.phase === "preparing" ? "\u51C6\u5907\u8C03\u7528\u2026" : "\u5DE5\u5177\u6267\u884C\u4E2D\u2026" }) : props.block.isError ? /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("p", { role: "alert", children: "\u8C03\u7528\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u8C03\u7528\u8BE6\u60C5\u3002" }) : result?.job && /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("p", { children: [
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
      /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("nav", { "aria-label": "\u67E5\u770B\u5DE5\u5177\u7ED3\u679C", children: [
        result?.links.map((link, index3) => /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("button", { "data-iad-page": link.location.pageId, "data-iad-scope-id": link.location.pageId === "industrial-consistency" ? void 0 : link.location.scopeRunId, "data-iad-run-id": link.location.pageId === "industrial-consistency" ? link.location.batchId : link.location.job, "data-iad-version-id": link.location.pageId === "industrial-consistency" ? void 0 : link.location.version, onClick: () => workspace.openLocation(link.location), children: link.label }, index3)),
        props.inspect && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("button", { onClick: props.inspect, children: "\u8C03\u7528\u8BE6\u60C5" })
      ] })
    ] });
  }

  // src/shared/tool-presentation.ts
  var workbenchTools = {
    image_retrieve: "\u67E5\u627E\u540C\u56FE",
    image_index_prepare: "\u51C6\u5907\u68C0\u7D22\u7D22\u5F15",
    consistency_start: "\u5F00\u59CB\u4E00\u81F4\u6027\u68C0\u67E5",
    consistency_status: "\u4E00\u81F4\u6027\u6279\u6B21\u72B6\u6001",
    consistency_cancel: "\u505C\u6B62\u4E00\u81F4\u6027\u68C0\u67E5",
    consistency_retry: "\u7EE7\u7EED\u4E00\u81F4\u6027\u68C0\u67E5",
    consistency_query: "\u4E00\u81F4\u6027\u7ED3\u679C",
    consistency_report: "\u4E00\u81F4\u6027\u62A5\u544A",
    consistency_groups: "\u4E25\u683C\u540C\u56FE\u7EC4",
    consistency_group_members: "\u540C\u56FE\u7EC4\u6210\u5458",
    consistency_compare: "\u4FDD\u5B58\u6BD4\u8F83\u8BC1\u636E",
    consistency_context: "\u89E3\u91CA\u6BD4\u8F83\u8BC1\u636E",
    consistency_evidence: "\u67E5\u770B\u51BB\u7ED3\u4E8B\u5B9E",
    consistency_evidence_media: "\u8BFB\u53D6\u51BB\u7ED3\u56FE\u7247",
    consistency_evidence_export: "\u5BFC\u51FA\u6BD4\u8F83\u8BC1\u636E",
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
  var import_react57 = __require("react");

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
  var import_react55 = __require("react");
  var import_jsx_runtime60 = __require("react/jsx-runtime");
  function ProviderManager() {
    const { view, refresh } = useWorkbenchModel();
    const [editing, setEditing] = (0, import_react55.useState)(null);
    const [notice, setNotice] = (0, import_react55.useState)("");
    return /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)(import_jsx_runtime60.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("header", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "\u63D0\u4F9B\u5546" }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
          "button",
          {
            className: "iad-primary",
            disabled: view?.provider_revision == null,
            onClick: () => setEditing({ revision: view.provider_revision }),
            children: "\u6DFB\u52A0\u63D0\u4F9B\u5546"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { className: "iad-muted", children: "\u4E0E DSH \u8BBE\u7F6E\u5171\u7528\u63D0\u4F9B\u5546\u8D44\u6599\u548C\u51ED\u636E\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u63D0\u4F9B\u5546\u5217\u8868", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("th", { children: "\u63D0\u4F9B\u5546\u540D\u79F0" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("th", { children: "\u670D\u52A1\u5730\u5740" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("th", { className: "iad-number", children: "\u6A21\u578B\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("th", { children: "\u64CD\u4F5C" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("tbody", { children: view?.providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("td", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("strong", { children: provider.name }),
            provider.error && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { className: "iad-error", children: provider.error })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { className: "iad-provider-endpoint", children: provider.endpoint || provider.api || "\u5C1A\u672A\u914D\u7F6E" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { className: "iad-number", children: provider.models.length }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(IconButton, { label: `\u7F16\u8F91\u63D0\u4F9B\u5546 ${provider.name}`, title: "\u7F16\u8F91\u63D0\u4F9B\u5546", disabled: !provider.editable, onClick: () => setEditing({ provider, revision: view.provider_revision }), children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(EditIcon, {}) }),
            provider.removable && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
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
      notice && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { role: "status", children: notice }),
      editing && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
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
    const [id] = (0, import_react55.useState)(provider?.provider_id || `vision-${v4_default()}`);
    const [name2, setName] = (0, import_react55.useState)(provider?.name || ""), [endpoint, setEndpoint] = (0, import_react55.useState)(provider?.endpoint || ""), [key, setKey] = (0, import_react55.useState)("");
    const [models, setModels] = (0, import_react55.useState)(provider?.models || []);
    const [busy, setBusy] = (0, import_react55.useState)(false), [error2, setError] = (0, import_react55.useState)("");
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
    return /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Modal, { title: provider ? "\u7F16\u8F91\u63D0\u4F9B\u5546" : "\u6DFB\u52A0\u63D0\u4F9B\u5546", className: "iad-provider-dialog", onClose: () => {
      if (!busy) onClose();
    }, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("form", { onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("fieldset", { disabled: busy, children: [
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-model-fields", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
          "\u63D0\u4F9B\u5546\u540D\u79F0",
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { autoFocus: true, required: true, "aria-label": "\u63D0\u4F9B\u5546\u540D\u79F0", value: name2, onChange: (event) => setName(event.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
          "\u670D\u52A1\u5730\u5740",
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { required: true, type: "url", "aria-label": "\u670D\u52A1\u5730\u5740", placeholder: "https://\u2026/v1", value: endpoint, onChange: (event) => setEndpoint(event.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
        "API \u5BC6\u94A5",
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("header", { className: "iad-section-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h3", { children: "\u6A21\u578B" }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { type: "button", disabled: !endpoint, onClick: () => void discover(), children: "\u8BFB\u53D6\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { type: "button", onClick: () => setModels([...models, { model_id: "", name: "", input_modalities: ["text"], context_tokens: null, max_output_tokens: null }]), children: "\u6DFB\u52A0\u6A21\u578B" })
        ] })
      ] }),
      models.map((model, index3) => /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-provider-model", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-model-fields", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
            "\u6A21\u578B ID",
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { "aria-label": `\u6A21\u578B ID ${index3 + 1}`, required: true, value: model.model_id, onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, model_id: event.target.value } : row)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
            "\u663E\u793A\u540D\u79F0",
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { "aria-label": `\u6A21\u578B\u540D\u79F0 ${index3 + 1}`, value: model.name, onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, name: event.target.value } : row)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
            "\u4E0A\u4E0B\u6587\u4E0A\u9650",
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { type: "number", min: "1", placeholder: "\u672A\u58F0\u660E", value: model.context_tokens ?? "", onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, context_tokens: event.target.value ? Number(event.target.value) : null } : row)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "iad-field", children: [
            "\u8F93\u51FA\u4E0A\u9650",
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { type: "number", min: "1", placeholder: "\u672A\u58F0\u660E", value: model.max_output_tokens ?? "", onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, max_output_tokens: event.target.value ? Number(event.target.value) : null } : row)) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { type: "checkbox", checked: model.input_modalities?.includes("image") || false, onChange: (event) => setModels(models.map((row, position) => position === index3 ? { ...row, input_modalities: event.target.checked ? ["text", "image"] : ["text"] } : row)) }),
            " \u652F\u6301\u56FE\u50CF\u8F93\u5165"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(IconButton, { label: `\u79FB\u9664\u6A21\u578B ${model.name || model.model_id || index3 + 1}`, title: "\u79FB\u9664\u6A21\u578B", onClick: () => setModels(models.filter((_, position) => position !== index3)), children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(DeleteIcon, {}) })
        ] })
      ] }, index3)),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "iad-form-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { className: "iad-primary", disabled: !name2.trim() || !endpoint || !models.length, type: "submit", children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u4FDD\u5B58\u63D0\u4F9B\u5546" })
      ] })
    ] }) }) });
  }

  // src/client/components/ImageEncoderSettings.tsx
  var import_react56 = __require("react");

  // src/shared/image-encoder.parameters.generated.ts
  var imageBackbones = {
    "dinov2_vitb14_reg": {
      "backend": "torch_hub",
      "processor": "dinov2_imagenet_eval",
      "input_size": 224,
      "pooling": "x_norm_clstoken",
      "dim": 768,
      "resize_size": 256,
      "resize_mode": "shorter_side",
      "crop": "center",
      "interpolation": "bicubic",
      "local_snapshot": false
    },
    "dinov3_vitb16": {
      "backend": "torch_hub",
      "processor": "dinov3_lvd_eval",
      "input_size": 256,
      "pooling": "x_norm_clstoken",
      "dim": 768,
      "resize_size": 256,
      "resize_mode": "stretch",
      "crop": "none",
      "interpolation": "bilinear",
      "local_snapshot": true
    },
    "sscd_disc_mixup": {
      "backend": "torchscript",
      "processor": "sscd_skew320",
      "input_size": 320,
      "pooling": "serialized_global",
      "dim": 512,
      "resize_size": 320,
      "resize_mode": "stretch",
      "crop": "none",
      "interpolation": "bilinear",
      "local_snapshot": false
    }
  };

  // src/client/components/ImageEncoderSettings.tsx
  var import_jsx_runtime61 = __require("react/jsx-runtime");
  function editable(view) {
    const selection = view.selection, resources = view.resources;
    return {
      model_id: selection?.profile.model_id || "",
      weights_ref: selection?.profile.weights_ref || "",
      source_ref: selection?.profile.source_ref || "",
      device: resources.device,
      batch_size: resources.batch_size,
      gpu_memory_mb: resources.gpu_memory_mb,
      compute_dtype: resources.compute_dtype,
      decode_workers: resources.decode_workers,
      decode_memory_mb: resources.decode_memory_mb,
      storage_dtype: selection?.profile.storage_dtype || "float32"
    };
  }
  function ImageEncoderSettings({ refreshVersion, onStateChange }) {
    const [view, setView] = (0, import_react56.useState)(null), [draft, setDraft] = (0, import_react56.useState)(null);
    const [revision, setRevision] = (0, import_react56.useState)(0), [loading, setLoading] = (0, import_react56.useState)(true), [busy, setBusy] = (0, import_react56.useState)(false);
    const [error2, setError] = (0, import_react56.useState)(""), [notice, setNotice] = (0, import_react56.useState)("");
    const changed = !!draft && !!view && JSON.stringify(draft) !== JSON.stringify(editable(view));
    useUnsavedChanges(changed && !busy);
    (0, import_react56.useEffect)(() => {
      onStateChange({ dirty: changed, busy });
    }, [changed, busy, onStateChange]);
    (0, import_react56.useEffect)(() => {
      const controller = new AbortController();
      setLoading(true);
      setError("");
      void request("/images/settings", void 0, void 0, controller.signal).then((settings) => {
        setView(settings);
        if (!changed) {
          setDraft(editable(settings));
          setRevision(settings.revision);
        }
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, [refreshVersion]);
    const backbone = draft?.model_id ? imageBackbones[draft.model_id] : null;
    const validResources = !!draft && /^(cpu|cuda:[0-9]+)$/.test(draft.device) && Number.isInteger(draft.batch_size) && draft.batch_size >= 1 && draft.batch_size <= 256 && Number.isInteger(draft.gpu_memory_mb) && draft.gpu_memory_mb >= 256 && draft.gpu_memory_mb <= 12288 && Number.isInteger(draft.decode_workers) && draft.decode_workers >= 1 && draft.decode_workers <= 8 && Number.isInteger(draft.decode_memory_mb) && draft.decode_memory_mb >= 1 && draft.decode_memory_mb <= 1024 && !(draft.device === "cpu" && draft.compute_dtype === "float16");
    const valid = validResources && (!draft?.model_id || !!draft.weights_ref.trim() && (backbone?.backend === "torchscript" || backbone?.local_snapshot || !!draft.source_ref.trim()));
    async function input() {
      if (!draft || !valid) throw new Error("\u8BF7\u586B\u5199\u6709\u6548\u7684\u6A21\u578B\u3001\u8DEF\u5F84\u548C\u8D44\u6E90\u914D\u7F6E");
      if (!draft.model_id) return null;
      const profile = await request("/images/profiles", {
        model_id: draft.model_id,
        weights_ref: draft.weights_ref.trim(),
        source_ref: backbone?.backend === "torchscript" ? null : draft.source_ref.trim() || null,
        storage_dtype: draft.storage_dtype
      });
      return {
        profile,
        device: draft.device,
        batch_size: draft.batch_size,
        gpu_memory_mb: draft.gpu_memory_mb,
        compute_dtype: draft.compute_dtype,
        decode_workers: draft.decode_workers,
        decode_memory_mb: draft.decode_memory_mb
      };
    }
    async function save(event) {
      event.preventDefault();
      setBusy(true);
      setError("");
      setNotice("");
      try {
        if (!draft) return;
        const { model_id, weights_ref, source_ref, storage_dtype, ...resources } = draft;
        const result = await request("/images/settings", { expected_revision: revision, selection: await input(), resources });
        setView(result);
        setDraft(editable(result));
        setRevision(result.revision);
        setNotice("\u5DF2\u4FDD\u5B58\u56FE\u50CF\u68C0\u7D22\u914D\u7F6E");
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
        const result = await request("/images/settings/check", { selection: await input() });
        setNotice(`\u52A0\u8F7D\u6B63\u5E38 \xB7 ${result.model_id} \xB7 ${result.dim} \u7EF4 \xB7 ${result.device}`);
      } catch (failure) {
        setError(message(failure));
      } finally {
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("section", { className: "iad-model-configuration", "aria-label": "\u56FE\u50CF\u68C0\u7D22\u8BBE\u7F6E", "aria-busy": busy || loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("h2", { children: "\u56FE\u50CF\u68C0\u7D22" }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !draft ? /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("form", { "aria-label": "\u56FE\u50CF\u68C0\u7D22\u914D\u7F6E", className: "iad-model-form", onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("fieldset", { disabled: busy || loading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("section", { className: "iad-section-layout", children: [
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("h3", { children: "\u56FE\u50CF\u7F16\u7801\u5668" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("div", { className: "iad-model-fields", children: [
            /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
              "\u6A21\u578B",
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("select", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u5668", value: draft.model_id, onChange: (event) => {
                setDraft({ ...draft, model_id: event.target.value, weights_ref: "", source_ref: "" });
                setError("");
                setNotice("");
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("option", { value: "", children: "\u4EC5\u4E25\u683C\u540C\u56FE" }),
                Object.keys(imageBackbones).map((id) => /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("option", { value: id, children: id }, id))
              ] })
            ] }),
            draft.model_id && /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)(import_jsx_runtime61.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u6743\u91CD\u8DEF\u5F84",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u6743\u91CD\u8DEF\u5F84", required: true, value: draft.weights_ref, onChange: (event) => setDraft({ ...draft, weights_ref: event.target.value }) })
              ] }),
              backbone?.backend === "torch_hub" && /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u5B98\u65B9\u6E90\u7801\u76EE\u5F55",
                backbone.local_snapshot ? "\uFF08.pth \u5FC5\u586B\uFF09" : "",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u6E90\u7801\u76EE\u5F55", required: !backbone.local_snapshot, value: draft.source_ref, onChange: (event) => setDraft({ ...draft, source_ref: event.target.value }) })
              ] }),
              backbone && /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("p", { className: "iad-muted", children: [
                backbone.dim,
                " \u7EF4 \xB7 ",
                backbone.local_snapshot ? "\u672C\u5730\u6A21\u578B\u76EE\u5F55\u6216 .pth \u6743\u91CD" : `${backbone.input_size} px \xB7 ${backbone.processor}`
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("section", { className: "iad-section-layout", children: [
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("h3", { children: "\u8FD0\u884C\u8D44\u6E90" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("div", { className: "iad-model-fields", children: [
            draft.model_id && /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)(import_jsx_runtime61.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u8BBE\u5907",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u8BBE\u5907", required: true, pattern: "cpu|cuda:[0-9]+", value: draft.device, onChange: (event) => setDraft({ ...draft, device: event.target.value }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u6279\u91CF",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u6279\u91CF", type: "number", min: 1, max: 256, value: draft.batch_size, onChange: (event) => setDraft({ ...draft, batch_size: Number(event.target.value) }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u663E\u5B58\u9884\u7B97\uFF08MiB\uFF09",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u663E\u5B58\u9884\u7B97", type: "number", min: 256, max: 12288, value: draft.gpu_memory_mb, onChange: (event) => setDraft({ ...draft, gpu_memory_mb: Number(event.target.value) }) })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
              "\u89E3\u7801\u7EBF\u7A0B",
              /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u89E3\u7801\u7EBF\u7A0B", type: "number", min: 1, max: 8, value: draft.decode_workers, onChange: (event) => setDraft({ ...draft, decode_workers: Number(event.target.value) }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
              "\u89E3\u7801\u5185\u5B58\uFF08MiB\uFF09",
              /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("input", { "aria-label": "\u56FE\u50CF\u89E3\u7801\u5185\u5B58\u9884\u7B97", type: "number", min: 1, max: 1024, value: draft.decode_memory_mb, onChange: (event) => setDraft({ ...draft, decode_memory_mb: Number(event.target.value) }) })
            ] }),
            draft.model_id && /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)(import_jsx_runtime61.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u8BA1\u7B97\u7CBE\u5EA6",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("select", { "aria-label": "\u56FE\u50CF\u7F16\u7801\u8BA1\u7B97\u7CBE\u5EA6", value: draft.compute_dtype, onChange: (event) => setDraft({ ...draft, compute_dtype: event.target.value }), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("option", { value: "float32", children: "FP32" }),
                  /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("option", { value: "float16", disabled: draft.device === "cpu", children: "FP16" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("label", { className: "iad-field", children: [
                "\u5411\u91CF\u5B58\u50A8",
                /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("select", { "aria-label": "\u56FE\u50CF\u5411\u91CF\u5B58\u50A8\u7CBE\u5EA6", value: draft.storage_dtype, onChange: (event) => setDraft({ ...draft, storage_dtype: event.target.value }), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("option", { value: "float32", children: "FP32" }),
                  /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("option", { value: "float16", children: "FP16" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        view?.selection && /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("details", { className: "iad-model-advanced", children: [
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("summary", { children: "\u5DF2\u4FDD\u5B58\u914D\u7F6E" }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("code", { children: view.selection.profile.profile_id }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("p", { className: "iad-muted", children: [
            view.selection.profile.input_size,
            " px \xB7 ",
            view.selection.profile.pooling,
            " \xB7 ",
            view.selection.profile.color_conversion
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("div", { className: "iad-form-footer", children: [
          changed && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("span", { className: "iad-muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539" }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("button", { type: "button", disabled: !valid || !draft.model_id, onClick: () => void check(), children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u68C0\u67E5\u52A0\u8F7D" }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("button", { className: "iad-primary", type: "submit", disabled: !changed || !valid, children: "\u4FDD\u5B58\u56FE\u50CF\u914D\u7F6E" }),
          /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("button", { type: "button", disabled: !changed, onClick: () => {
            if (view) setDraft(editable(view));
            setRevision(view?.revision || 0);
            setError("");
            setNotice("");
          }, children: "\u91CD\u7F6E\u56FE\u50CF\u914D\u7F6E" })
        ] })
      ] }) }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("p", { role: "status", children: notice })
    ] });
  }

  // src/client/components/ModelSettingsPage.tsx
  var import_jsx_runtime62 = __require("react/jsx-runtime");
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
    const parametersId = (0, import_react57.useId)();
    const [tab, setTab] = (0, import_react57.useState)("model");
    const [imageRefresh, setImageRefresh] = (0, import_react57.useState)(0), [imageState, setImageState] = (0, import_react57.useState)({ dirty: false, busy: false });
    const [draft, setDraft] = (0, import_react57.useState)(null), [expectedRevision, setExpectedRevision] = (0, import_react57.useState)(0);
    const [parameters, setParameters] = (0, import_react57.useState)("{}"), [busy, setBusy] = (0, import_react57.useState)(false), [error2, setError] = (0, import_react57.useState)(""), [notice, setNotice] = (0, import_react57.useState)("");
    const reset = () => {
      if (!view) return;
      setDraft(structuredClone(savedSelection));
      setExpectedRevision(view.revision);
      setParameters(JSON.stringify(savedSelection.limits.request_parameters, null, 2));
      setError("");
      setNotice("");
    };
    (0, import_react57.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { className: "iad-workbench", "data-page": "industrial-model-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(WorkbenchHeader, { pageId: "industrial-model-settings", children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(IconButton, { label: "\u5237\u65B0", disabled: busy || loading || imageState.busy, onClick: () => tab === "images" ? setImageRefresh((value) => value + 1) : void refresh(), children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(RefreshIcon, {}) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)(PageTabs, { label: "\u6A21\u578B\u8BBE\u7F6E\u5206\u533A", items: [{ id: "model", label: "\u5DE5\u4F5C\u53F0\u6A21\u578B" }, { id: "providers", label: "\u63D0\u4F9B\u5546" }, { id: "images", label: "\u56FE\u50CF\u68C0\u7D22" }], value: tab, onChange: (value) => {
        if (tab === "images" && (imageState.busy || imageState.dirty && !window.confirm("\u6709\u672A\u4FDD\u5B58\u7684\u56FE\u50CF\u914D\u7F6E\uFF0C\u786E\u8BA4\u653E\u5F03\u4FEE\u6539\uFF1F"))) return;
        setTab(value);
        setImageState({ dirty: false, busy: false });
        if (value === "model") void refresh();
      }, children: [
        (loadError || error2) && /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { role: "alert", className: "iad-error", children: error2 || loadError }),
        tab === "images" ? /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ImageEncoderSettings, { refreshVersion: imageRefresh, onStateChange: setImageState }) : tab === "providers" ? /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("section", { className: "iad-provider-manager", "aria-label": "\u63D0\u4F9B\u5546\u7BA1\u7406", children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ProviderManager, {}) }) : /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("section", { className: "iad-model-configuration", children: [
          /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("h2", { children: "\u5DE5\u4F5C\u53F0\u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { className: "iad-muted", children: "\u63A2\u7D22\u3001\u6316\u6398\u548C\u5BA1\u8BA1\u5171\u7528\u6B64\u914D\u7F6E\uFF1B\u4F1A\u8BDD\u6A21\u578B\u72EC\u7ACB\u9009\u62E9\u3002" }),
          view?.error && /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("p", { role: "status", className: "iad-muted", children: [
            "\u5DF2\u4FDD\u5B58\u914D\u7F6E\uFF1A",
            view.error
          ] }),
          !draft ? /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("form", { className: "iad-model-form", onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("fieldset", { disabled: busy || loading, children: [
            /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("section", { className: "iad-section-layout", children: [
              /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("h3", { children: "\u6A21\u578B\u9009\u62E9" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { className: "iad-model-fields", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("label", { className: "iad-field", children: [
                    "\u63D0\u4F9B\u5546",
                    /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("select", { "aria-label": "\u5DE5\u4F5C\u53F0\u63D0\u4F9B\u5546", value: draft.provider_id, onChange: (event) => {
                      setDraft({ provider_id: event.target.value, model_id: "", limits: { ...defaultModelLimits } });
                      setParameters("{}");
                      setError("");
                      setNotice("");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("option", { value: "", children: "\u9009\u62E9\u63D0\u4F9B\u5546" }),
                      draft.provider_id && !provider && /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("option", { value: draft.provider_id, children: [
                        "\u5DF2\u5931\u6548 \xB7 ",
                        draft.provider_id
                      ] }),
                      view?.providers.map((row) => /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("option", { value: row.provider_id, disabled: !!row.error, children: [
                        row.name,
                        row.error ? " \xB7 \u6682\u4E0D\u53EF\u7528" : ""
                      ] }, row.provider_id))
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("label", { className: "iad-field", children: [
                    "\u6A21\u578B",
                    /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("select", { "aria-label": "\u5DE5\u4F5C\u53F0\u6A21\u578B", value: draft.model_id, disabled: !provider || !!provider.error, onChange: (event) => {
                      setDraft({ ...draft, model_id: event.target.value });
                      setError("");
                      setNotice("");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("option", { value: "", children: "\u9009\u62E9\u6A21\u578B" }),
                      draft.model_id && !provider?.models.some((row) => row.model_id === draft.model_id) && /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("option", { value: draft.model_id, children: [
                        "\u5DF2\u5931\u6548 \xB7 ",
                        draft.model_id
                      ] }),
                      provider?.models.map((row) => /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("option", { value: row.model_id, disabled: !row.input_modalities?.includes("image"), children: [
                        row.name,
                        row.input_modalities?.includes("image") ? "" : " \xB7 \u672A\u58F0\u660E\u56FE\u50CF\u80FD\u529B"
                      ] }, row.model_id))
                    ] })
                  ] })
                ] }),
                provider && /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { className: "iad-model-endpoint", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("span", { className: "iad-muted", children: "\u670D\u52A1\u5730\u5740" }),
                  /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { children: provider.endpoint || provider.error })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("section", { className: "iad-section-layout", children: [
              /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("h3", { children: "\u9AD8\u7EA7\u8BBE\u7F6E" }),
                /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { className: "iad-muted", children: "\u672A\u586B\u5199\u65F6\u4F7F\u7528\u670D\u52A1\u58F0\u660E\u503C" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("details", { className: "iad-model-advanced", children: [
                /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("summary", { children: "\u5BB9\u91CF\u4E0E\u8D85\u65F6" }),
                /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { className: "iad-model-fields", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("label", { className: "iad-field", children: [
                    "\u5BB9\u91CF\u9884\u68C0",
                    /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("select", { "aria-label": "\u5BB9\u91CF\u9884\u68C0\u534F\u8BAE", value: draft.limits.capacity_mode || "", onChange: (event) => setDraft({ ...draft, limits: { ...draft.limits, capacity_mode: event.target.value === "vllm_tokenize" ? "vllm_tokenize" : null } }), children: [
                      /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("option", { value: "", children: "\u5C1A\u672A\u786E\u8BA4" }),
                      /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("option", { value: "vllm_tokenize", children: "vLLM /tokenize" })
                    ] })
                  ] }),
                  numbers.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("label", { className: "iad-field", children: [
                    label,
                    /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("label", { className: "iad-field", children: [
                  "\u670D\u52A1\u6269\u5C55\u53C2\u6570\uFF08JSON\uFF09",
                  /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("textarea", { "aria-label": "\u670D\u52A1\u6269\u5C55\u53C2\u6570", "aria-invalid": parametersError ? true : void 0, "aria-describedby": parametersError ? parametersId : void 0, rows: 4, value: parameters, onChange: (event) => setParameters(event.target.value) })
                ] }),
                parametersError && /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { id: parametersId, role: "alert", className: "iad-error", children: parametersError })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("div", { className: "iad-form-footer", children: [
              changed && /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("span", { className: "iad-muted", children: "\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539" }),
              /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("button", { type: "button", disabled: !draft.provider_id || !draft.model_id || !!parametersError, onClick: () => void check(), children: "\u68C0\u67E5\u8FDE\u63A5" }),
              /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("button", { className: "iad-primary", type: "submit", disabled: !changed || !draft.provider_id || !draft.model_id || !!parametersError, children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u4FDD\u5B58\u914D\u7F6E" }),
              /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("button", { type: "button", disabled: !changed, onClick: reset, children: "\u91CD\u7F6E" })
            ] })
          ] }) }),
          notice && /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { role: "status", children: notice })
        ] })
      ] })
    ] });
  }

  // src/client/host/IndustrialSidebar.tsx
  var import_react58 = __toESM(__require("react"), 1);
  var import_jsx_runtime63 = __require("react/jsx-runtime");
  function IndustrialSidebar({ wide, panels, renderPanel, renderWorkspaces, usePanelInfo }) {
    const active = usePanelInfo((info) => info.activePanelId);
    const [sessionsOpen, setSessionsOpen] = (0, import_react58.useState)(!active);
    const workspacesId = (0, import_react58.useId)();
    (0, import_react58.useEffect)(() => setSessionsOpen(!active), [active]);
    const business = panels.filter((panel) => panel.id in navigation && navigation[panel.id].chapter !== "\u5DE5\u5177");
    const auxiliary = panels.filter((panel) => !business.includes(panel));
    return /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("div", { className: `iad-sidebar-content ${wide ? "iad-sidebar-wide" : "iad-sidebar-rail"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("style", { children: themeStyles + `
      .iad-sidebar-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;gap:16px;background:var(--iad-navigation);color:var(--iad-text);font-size:14px}
      .iad-sidebar-content>nav{display:flex;flex-direction:column;gap:20px;min-height:0;overflow:auto;flex:0 1 auto}.iad-sidebar-content>nav>section,.iad-sidebar-tools{display:flex;flex-direction:column;gap:4px}
      .iad-sidebar-content h2{margin:0 10px 4px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content>nav>section>button,.iad-sidebar-tools>button{min-height:44px}.iad-sidebar-content [aria-current=page]{color:var(--iad-primary);background:var(--iad-hover);box-shadow:inset 3px 0 var(--iad-primary)}
      .iad-sidebar-sessions{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden}.iad-sidebar-sessions[data-open=false]{flex:none}
      .iad-sidebar-disclosure{display:flex;align-items:center;gap:6px;flex:none;min-height:36px;padding:8px 10px;cursor:pointer;background:transparent;border:0;text-align:left;font:inherit;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-disclosure:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:-2px}
      .iad-native-workspace-content{min-height:0;overflow:hidden;flex:1}.iad-native-workspace-content:not([hidden]){display:flex;flex-direction:column}
      .iad-sidebar-tools{margin-top:auto;flex:none}.iad-sidebar-rail{gap:12px}.iad-sidebar-rail>nav{gap:12px}
    ` }),
      /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("nav", { "aria-label": "\u5DE5\u4E1A\u5DE5\u4F5C\u53F0\u5BFC\u822A", children: ["\u6570\u636E\u51C6\u5907", "\u77E5\u8BC6\u6784\u5EFA", "\u8D28\u91CF\u5BA1\u6838"].map((chapter) => /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("section", { "aria-label": chapter, children: [
        wide && /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("h2", { children: chapter }),
        business.filter((panel) => navigation[panel.id].chapter === chapter).map((panel) => /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(import_react58.default.Fragment, { children: renderPanel(panel) }, panel.id))
      ] }, chapter)) }),
      wide ? /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("section", { className: "iad-sidebar-sessions", "data-native-workspaces": true, "data-open": sessionsOpen, children: [
        /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("button", { type: "button", className: "iad-sidebar-disclosure", "aria-expanded": sessionsOpen, "aria-controls": workspacesId, onClick: () => setSessionsOpen((value) => !value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("span", { "aria-hidden": "true", children: sessionsOpen ? "\u25BE" : "\u25B8" }),
          "\u4F1A\u8BDD\u4E0E\u5DE5\u4F5C\u533A"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("div", { id: workspacesId, className: "iad-native-workspace-content", hidden: !sessionsOpen, children: renderWorkspaces() })
      ] }) : renderWorkspaces(),
      /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("section", { className: "iad-sidebar-tools", "aria-label": "\u5DE5\u5177", children: auxiliary.map((panel) => /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(import_react58.default.Fragment, { children: renderPanel(panel) }, panel.id)) })
    ] });
  }

  // src/client/components/ConsistencyPage.tsx
  var import_react68 = __require("react");

  // src/shared/consistency.parameters.generated.ts
  var temporaryImageLimits = {
    "max_source_bytes": 134217728,
    "max_bytes": 268435456,
    "max_images": 128,
    "max_vector_bytes": 8388608,
    "ttl_seconds": 1800
  };

  // src/client/components/ConsistencyComparison.tsx
  var import_react59 = __require("react");
  var import_jsx_runtime64 = __require("react/jsx-runtime");
  function ConsistencyComparison({ member, query, temporary, differenceId, onDifference, frozen }) {
    const { workspace } = useWorkspace();
    const [saving, setSaving] = (0, import_react59.useState)(false);
    const saveRequest = (0, import_react59.useRef)(null);
    (0, import_react59.useEffect)(() => () => saveRequest.current?.abort(), []);
    const [detail, setDetail] = (0, import_react59.useState)(null), [error2, setError] = (0, import_react59.useState)("");
    const [transform, setTransform] = (0, import_react59.useState)({ zoom: 0, x: 0, y: 0 }), [synchronized, setSynchronized] = (0, import_react59.useState)(true);
    const [rightTransform, setRightTransform] = (0, import_react59.useState)({ zoom: 0, x: 0, y: 0 });
    const [showDifferences, setShowDifferences] = (0, import_react59.useState)(true);
    (0, import_react59.useEffect)(() => {
      if (frozen) return;
      const controller = new AbortController();
      request(`/sample/${encodeURIComponent(member.sample_id)}`, void 0, void 0, controller.signal).then((data) => {
        if (!controller.signal.aborted) setDetail(data);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [member.sample_id, frozen]);
    const selected = member.annotation?.differences.find((row) => row.difference_id === differenceId);
    const region = showDifferences && selected?.region ? { id: selected.difference_id, bbox: selected.region } : void 0;
    const image = (data) => ({
      src: mediaUrl(data.sample),
      title: data.sample.relative_path,
      width: data.sample.width,
      height: data.sample.height,
      annotationLayer: { kind: "sample", sample: data.sample, annotations: data.annotations }
    });
    const sources = frozen ? ["left", "right"].map((side) => {
      const source = frozen.sources[side], media = frozen.media.find((item) => item.side === side && item.representation === "preview" && !item.difference_id);
      const url = (mediaId) => `/api/iad/consistency/evidence/${encodeURIComponent(frozen.result.evidence_id)}/media/${encodeURIComponent(mediaId)}`;
      const valid = frozen.media.find((item) => item.media_id === side + "-annotation_overlay")?.available;
      return {
        src: url(media.media_id),
        title: source.sample.relative_path,
        width: source.sample.width,
        height: source.sample.height,
        annotationLayer: valid ? {
          kind: "sample",
          sample: source.sample,
          annotations: source.annotations.annotations,
          maskUrls: Object.fromEntries(frozen.media.filter((item) => item.side === side && item.annotation_id).map((item) => [item.annotation_id, url(item.media_id)]))
        } : void 0
      };
    }) : [query ? image(query) : temporary ? { src: temporary.preview, title: temporary.name } : null, detail ? image(detail) : null];
    async function save() {
      if (!query) return;
      setSaving(true);
      setError("");
      const controller = new AbortController();
      saveRequest.current = controller;
      try {
        const result = await request("/consistency/compare", { sample_a: query.sample.sample_id, sample_b: member.sample_id }, void 0, controller.signal);
        if (controller.signal.aborted) return;
        workspace.updateConsistency({ batchId: void 0, evidenceId: result.evidence_id, resultId: result.result_id }, true);
      } catch (failure) {
        if (!controller.signal.aborted) setError(message(failure));
      } finally {
        if (!controller.signal.aborted) setSaving(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)(import_jsx_runtime64.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("section", { className: "iad-consistency-comparison", "aria-label": "\u53CC\u56FE\u6BD4\u8F83", children: [
        /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("input", { type: "checkbox", checked: synchronized, onChange: (event) => {
              if (!event.target.checked) setRightTransform(transform);
              setSynchronized(event.target.checked);
            } }),
            "\u540C\u6B65\u7F29\u653E\u4E0E\u5E73\u79FB"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("input", { type: "checkbox", checked: showDifferences, onChange: (event) => setShowDifferences(event.target.checked) }),
            "\u5DEE\u5F02\u533A\u57DF"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("span", { className: "iad-muted", children: member.relation === "EXACT" ? "\u5DF2\u6309\u539F\u59CB\u89E3\u7801\u50CF\u7D20\u6838\u9A8C" : "\u5C1A\u65E0\u4E25\u683C\u540C\u56FE\u8BC1\u660E" }),
          !frozen && query && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("button", { disabled: saving || !detail, onClick: () => void save(), children: saving ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u4FDD\u5B58\u6BD4\u8F83\u8BC1\u636E" })
        ] }),
        error2 && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { className: "iad-error", role: "alert", children: error2 }),
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", { className: "iad-consistency-canvases", children: sources.map((source, index3) => /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("div", { className: "iad-consistency-side", children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { children: index3 ? "\u5019\u9009\u56FE\u50CF" : "\u67E5\u8BE2\u56FE\u50CF" }),
          source ? /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(
            ImageCanvas,
            {
              image: source,
              embedded: true,
              control: index3 === 0 || synchronized ? { transform, onChange: setTransform } : { transform: rightTransform, onChange: setRightTransform },
              focusRegion: region,
              overlay: region && source.width && source.height ? /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("svg", { className: "iad-finding-layer iad-consistency-region", viewBox: `0 0 ${source.width} ${source.height}`, children: /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("rect", { x: region.bbox[0], y: region.bbox[1], width: region.bbox[2] - region.bbox[0], height: region.bbox[3] - region.bbox[1], strokeDasharray: selected?.reference_from_other === (index3 ? "right" : "left") ? "6 4" : void 0 }) }) : void 0
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { role: "status", className: "iad-empty", children: error2 ? "\u6765\u6E90\u4E0D\u53EF\u7528" : "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" })
        ] }, index3)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("aside", { className: "iad-consistency-differences", "aria-label": "\u6807\u6CE8\u5DEE\u5F02", children: [
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("h2", { children: "\u6807\u6CE8\u5DEE\u5F02" }),
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { className: "iad-muted", children: member.annotation ? `\u89C4\u8303${{ SAME: "\u76F8\u540C", DIFFERENT: "\u4E0D\u540C", UNKNOWN: "\u672A\u77E5" }[member.annotation.policy_relation]} \xB7 ${member.annotation.status === "COMPLETE" ? "\u6BD4\u8F83\u5B8C\u6210" : "\u6BD4\u8F83\u4E0D\u5B8C\u6574"}` : "\u5C1A\u672A\u6BD4\u8F83\u6807\u6CE8" }),
        member.pixel.status === "COMPLETE" && /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "\u6BD4\u8F83\u50CF\u7D20" }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { children: member.pixel.compared_pixels.toLocaleString() }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "\u53D8\u5316\u50CF\u7D20" }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { children: member.pixel.changed_pixels === null ? "\u672A\u8BA1\u7B97" : member.pixel.changed_pixels.toLocaleString() })
        ] }),
        member.local && (member.local.status === "COMPLETE" ? /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("dl", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "\u6709\u6548\u533A\u57DF\u50CF\u7D20" }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { "data-stat": "local-compared", children: member.local.compared_pixels.toLocaleString() }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "\u5C40\u90E8\u53D8\u5316\u50CF\u7D20" }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { children: member.local.changed_pixels?.toLocaleString() }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "\u5C40\u90E8\u6700\u5927\u5DEE\u503C" }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { children: member.local.max_abs_diff })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("p", { className: "iad-muted", children: [
          "\u5C40\u90E8\u5DEE\u5F02\u4E0D\u53EF\u6BD4\u8F83\uFF1A",
          member.local.reason
        ] })),
        member.near && /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)(import_jsx_runtime64.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { children: imageRelations[member.relation] }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { className: "iad-muted", children: "\u7F29\u7565\u56FE\u8FD1\u4F3C\u590D\u6838\u4EC5\u7528\u4E8E\u5019\u9009\u5206\u7EA7\u3002" }),
          member.near.pixel_cosine !== null && /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("dl", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "\u7070\u5EA6\u4F59\u5F26" }),
            /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { children: member.near.pixel_cosine.toFixed(4) }),
            /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dt", { children: "NCC" }),
            /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("dd", { children: member.near.ncc?.toFixed(4) })
          ] }),
          member.registration?.status === "UNSUPPORTED" && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { className: "iad-muted", children: "\u5C40\u90E8\u914D\u51C6\u672A\u542F\u7528\uFF0C\u4E0D\u8FDB\u884C\u8DE8\u5750\u6807\u6807\u6CE8\u5BF9\u8D26\u3002" })
        ] }),
        member.reason && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { className: "iad-error", children: member.reason }),
        member.annotation?.differences.map((difference) => /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("button", { "data-difference": difference.type, className: selected === difference ? "is-selected" : "", "aria-pressed": selected === difference, onClick: () => onDifference(difference.difference_id), children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("strong", { children: [
            differenceLabels[difference.type],
            " \xB7 ",
            difference.confirmed_conflict ? "\u5DF2\u786E\u8BA4\u51B2\u7A81" : "\u5F85\u5B9A"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("span", { children: [
            "\u67E5\u8BE2\uFF1A",
            difference.type === "QUALITY_LABEL" ? String(difference.facts.left_quality) : difference.left.map((annotation) => annotation.raw_label).join("\u3001") || "\u65E0\u5BF9\u5E94\u6807\u6CE8"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("span", { children: [
            "\u5019\u9009\uFF1A",
            difference.type === "QUALITY_LABEL" ? String(difference.facts.right_quality) : difference.right.map((annotation) => annotation.raw_label).join("\u3001") || "\u65E0\u5BF9\u5E94\u6807\u6CE8"
          ] }),
          difference.reference_from_other && /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("small", { children: [
            "\u865A\u7EBF\u4F4D\u7F6E\u6765\u81EA",
            difference.reference_from_other === "left" ? "\u5019\u9009" : "\u67E5\u8BE2",
            "\u56FE\u50CF\u6807\u6CE8\uFF0C\u4EC5\u4F5C\u53C2\u8003"
          ] }),
          difference.pending.map((reason, index3) => /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("small", { children: reason }, index3))
        ] }, difference.difference_id)),
        member.annotation?.differences.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("p", { children: member.annotation.status === "COMPLETE" ? "\u5F53\u524D\u53EF\u6BD4\u8F83\u6807\u6CE8\u672A\u53D1\u73B0\u5DEE\u5F02" : "\u5F53\u524D\u672A\u53D6\u5F97\u53EF\u5224\u5B9A\u5DEE\u5F02" }),
        !!member.annotation?.masking.length && /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("summary", { children: "\u5FFD\u7565\u533A\u57DF" }),
          member.annotation.masking.map((row) => /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("p", { children: [
            "\u53EF\u89C1 ",
            row.visible_pixels,
            "/",
            row.total_pixels,
            " \u50CF\u7D20"
          ] }, row.annotation_id))
        ] })
      ] })
    ] });
  }

  // src/client/components/ConsistencyEvidencePage.tsx
  var import_react62 = __require("react");

  // src/client/components/FrozenConsistencyComparison.tsx
  var import_jsx_runtime65 = __require("react/jsx-runtime");
  function FrozenConsistencyComparison({ bundle, compact = false }) {
    const { state, workspace } = useWorkspace(), result = bundle.result;
    const member = {
      sample_id: bundle.sources.right.sample.sample_id,
      dataset_id: bundle.sources.right.sample.dataset_id,
      quality_status: bundle.sources.right.sample.quality_status,
      relation: result.verification.relation,
      pixel: result.verification.pixel,
      near: result.verification.relation === "EXACT" ? null : result.verification,
      local: result.verification.local,
      registration: result.verification.registration,
      annotation: result.annotation,
      error_code: null,
      reason: null
    };
    return /* @__PURE__ */ (0, import_jsx_runtime65.jsx)("div", { className: compact ? "iad-consistency-preview" : "iad-consistency-layout iad-frozen-comparison", children: /* @__PURE__ */ (0, import_jsx_runtime65.jsx)(
      ConsistencyComparison,
      {
        member,
        query: null,
        temporary: null,
        frozen: bundle,
        differenceId: state.consistency.differenceId,
        onDifference: (differenceId) => workspace.updateConsistency({ differenceId }, true)
      }
    ) });
  }

  // src/client/components/ConsistencyReviewPanel.tsx
  var import_react61 = __require("react");

  // src/client/components/ConsistencyRegionProposal.tsx
  var import_react60 = __require("react");
  var import_jsx_runtime66 = __require("react/jsx-runtime");
  function ConsistencyRegionProposal({ sources, differences, onChange }) {
    const [sampleId, setSampleId] = (0, import_react60.useState)(""), [annotationId, setAnnotationId] = (0, import_react60.useState)(""), [operation, setOperation] = (0, import_react60.useState)("relabel");
    const [category, setCategory] = (0, import_react60.useState)(""), [geometryKind, setGeometryKind] = (0, import_react60.useState)("bbox"), [geometryText, setGeometryText] = (0, import_react60.useState)("");
    const annotations = differences.flatMap((diff) => [...diff.left, ...diff.right]).filter((item, index3, items) => items.findIndex((other) => other.annotation_id === item.annotation_id) === index3 && item.sample_id === sampleId);
    const value = (0, import_react60.useMemo)(() => {
      if (!sampleId || operation !== "add" && !annotationId) return null;
      if (operation === "remove") return { kind: "PROPOSE_REGION_CHANGE", changes: [{ operation, sample_id: sampleId, annotation_id: annotationId }] };
      if (operation === "relabel") return category.trim() ? { kind: "PROPOSE_REGION_CHANGE", changes: [{ operation, sample_id: sampleId, annotation_id: annotationId, category: category.trim() }] } : null;
      const numbers2 = geometryText.trim().split(/[\s,，]+/).filter(Boolean).map(Number);
      if (!numbers2.every(Number.isFinite)) return null;
      const points = Array.from({ length: Math.floor(numbers2.length / 2) }, (_, index3) => [numbers2[index3 * 2], numbers2[index3 * 2 + 1]]);
      const geometry = geometryKind === "bbox" && numbers2.length === 4 ? { kind: "bbox", coordinates: [numbers2[0], numbers2[1], numbers2[2], numbers2[3]] } : geometryKind === "polygon" && numbers2.length >= 6 && numbers2.length % 2 === 0 ? { kind: "polygon", points: [points[0], points[1], points[2], ...points.slice(3)] } : null;
      if (!geometry || operation === "add" && !category.trim()) return null;
      const change = operation === "add" ? { operation, sample_id: sampleId, category: category.trim(), geometry } : { operation, sample_id: sampleId, annotation_id: annotationId, geometry };
      return { kind: "PROPOSE_REGION_CHANGE", changes: [change] };
    }, [sampleId, annotationId, operation, category, geometryKind, geometryText]);
    (0, import_react60.useEffect)(() => onChange(value), [value, onChange]);
    return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("section", { "aria-label": "\u533A\u57DF\u4FEE\u6B63\u5EFA\u8BAE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("p", { className: "iad-muted", children: "\u5EFA\u8BAE\u4E0D\u4F1A\u6539\u5199\u6E90\u6807\u6CE8\u3002\u5B9E\u9645\u4FEE\u6B63\u5E76\u91CD\u626B\u540E\u518D\u9A8C\u8BC1\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("div", { className: "iad-config-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("label", { className: "iad-field", children: [
          "\u76EE\u6807\u6837\u672C",
          /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("select", { "aria-label": "\u533A\u57DF\u5EFA\u8BAE\u76EE\u6807", value: sampleId, onChange: (event) => {
            setSampleId(event.target.value);
            setAnnotationId("");
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "", children: "\u8BF7\u9009\u62E9" }),
            sources.map((source) => /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: source.sample.sample_id, children: source.sample.relative_path }, source.sample.sample_id))
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("label", { className: "iad-field", children: [
          "\u4FEE\u6B63\u65B9\u5F0F",
          /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("select", { "aria-label": "\u533A\u57DF\u4FEE\u6B63\u65B9\u5F0F", value: operation, onChange: (event) => setOperation(event.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "relabel", children: "\u4FEE\u6539\u7C7B\u522B" }),
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "reshape", children: "\u4FEE\u6539\u5F62\u72B6" }),
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "add", children: "\u65B0\u589E\u533A\u57DF" }),
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "remove", children: "\u5220\u9664\u533A\u57DF" })
          ] })
        ] })
      ] }),
      operation !== "add" && /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("label", { className: "iad-field", children: [
        "\u6240\u9009\u5DEE\u5F02\u4E2D\u7684\u533A\u57DF",
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("select", { "aria-label": "\u5EFA\u8BAE\u76EE\u6807\u533A\u57DF", value: annotationId, onChange: (event) => setAnnotationId(event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "", children: "\u8BF7\u9009\u62E9" }),
          annotations.map((annotation) => /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("option", { value: annotation.annotation_id, children: [
            annotation.raw_label,
            " \xB7 ",
            annotation.bbox?.join(", ")
          ] }, annotation.annotation_id))
        ] })
      ] }),
      (operation === "add" || operation === "relabel") && /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("label", { className: "iad-field", children: [
        "\u5EFA\u8BAE\u7C7B\u522B",
        /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("input", { "aria-label": "\u5EFA\u8BAE\u7C7B\u522B", value: category, onChange: (event) => setCategory(event.target.value) })
      ] }),
      (operation === "add" || operation === "reshape") && /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_jsx_runtime66.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("label", { className: "iad-field", children: [
          "\u5F62\u72B6",
          /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("select", { value: geometryKind, onChange: (event) => setGeometryKind(event.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "bbox", children: "\u77E9\u5F62" }),
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("option", { value: "polygon", children: "\u591A\u8FB9\u5F62" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("label", { className: "iad-field", children: [
          geometryKind === "bbox" ? "\u539F\u56FE\u5750\u6807 x1, y1, x2, y2" : "\u539F\u56FE\u9876\u70B9 x1, y1, x2, y2, \u2026",
          /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("input", { "aria-label": "\u5EFA\u8BAE\u533A\u57DF\u5750\u6807", value: geometryText, onChange: (event) => setGeometryText(event.target.value) })
        ] })
      ] })
    ] });
  }

  // src/client/components/ConsistencyReviewPanel.tsx
  var import_jsx_runtime67 = __require("react/jsx-runtime");
  var actions2 = { CONFIRM_DIFFERENCE: "\u786E\u8BA4\u5DEE\u5F02\uFF0C\u5F85\u4FEE\u6B63", EXPECTED_POLICY_DIFFERENCE: "\u5C5E\u4E8E\u4E0D\u540C\u89C4\u8303", NEEDS_CONTEXT: "\u9700\u8981\u8865\u5145\u4F9D\u636E", SET_EFFECTIVE_QUALITY: "\u63D0\u4EA4\u6709\u6548\u8D28\u91CF\u88C1\u51B3", PROPOSE_REGION_CHANGE: "\u63D0\u51FA\u533A\u57DF\u4FEE\u6B63\u5EFA\u8BAE" };
  var reviewStates = { OPEN: "\u5F85\u590D\u6838", NEEDS_CONTEXT: "\u5F85\u8865\u5145\u4F9D\u636E", RESOLVED: "\u5DF2\u88C1\u51B3" };
  var correctionStates = { NOT_REQUIRED: "\u65E0\u9700\u4FEE\u6B63", PROPOSED: "\u5EFA\u8BAE\u672A\u5E94\u7528", AWAITING_RESCAN: "\u7B49\u5F85\u6E90\u4FEE\u6B63\u53CA\u91CD\u626B", VERIFIED: "\u91CD\u626B\u5DF2\u9A8C\u8BC1" };
  function ConsistencyReviewPanel({ bundle }) {
    const { workspace } = useWorkspace();
    const { result } = bundle, key = "iad.consistency-pending:" + result.evidence_id;
    const [context, setContext] = (0, import_react61.useState)(null), [error2, setError] = (0, import_react61.useState)(""), [notice, setNotice] = (0, import_react61.useState)(""), [busy, setBusy] = (0, import_react61.useState)(false);
    const [selected, setSelected] = (0, import_react61.useState)([]), [kind, setKind] = (0, import_react61.useState)("CONFIRM_DIFFERENCE");
    const [reviewer, setReviewer] = (0, import_react61.useState)(() => localStorage.getItem("iad.reviewer") || "auditor_qc"), [comment, setComment] = (0, import_react61.useState)("");
    const [quality, setQuality] = (0, import_react61.useState)({});
    const [region, setRegion] = (0, import_react61.useState)(null);
    const pending = (0, import_react61.useRef)(null), active = (0, import_react61.useRef)(true);
    const [hasPending, setHasPending] = (0, import_react61.useState)(false);
    const sources = [bundle.sources.left, bundle.sources.right];
    (0, import_react61.useEffect)(() => {
      active.current = true;
      const controller = new AbortController();
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) || "null");
        if (saved?.evidence_id === result.evidence_id && typeof saved.client_request_id === "string") {
          pending.current = saved;
          setHasPending(true);
        }
      } catch {
        sessionStorage.removeItem(key);
      }
      request("/consistency/review/context", { evidence_id: result.evidence_id }, void 0, controller.signal).then((value) => {
        if (active.current) setContext(value);
      }).catch((error3) => {
        if (!controller.signal.aborted) setError(message(error3));
      });
      return () => {
        active.current = false;
        controller.abort();
      };
    }, [key, result.evidence_id]);
    const current = context?.source_states.left === "CURRENT" && context.source_states.right === "CURRENT";
    const selectedDiffs = result.annotation.differences.filter((diff) => selected.includes(diff.difference_id));
    const targets = Object.entries(quality).flatMap(([sample_id, quality2]) => quality2 ? [{ sample_id, quality: quality2 }] : []);
    const canSubmit = reviewer.trim() && comment.trim() && selected.length && (kind !== "SET_EFFECTIVE_QUALITY" || current && targets.length) && (kind !== "PROPOSE_REGION_CHANGE" || current && region);
    async function submit() {
      if (busy) return;
      setBusy(true);
      setError("");
      setNotice("");
      try {
        if (!pending.current) {
          if (!canSubmit) throw new Error("\u8BF7\u586B\u5199\u5904\u7F6E\u76EE\u6807\u3001\u590D\u6838\u4EBA\u4E0E\u8BF4\u660E");
          const action = kind === "SET_EFFECTIVE_QUALITY" ? { kind, targets: targets.length === 1 ? [targets[0]] : [targets[0], targets[1]] } : kind === "PROPOSE_REGION_CHANGE" ? region : { kind };
          pending.current = { client_request_id: v4_default(), evidence_id: result.evidence_id, result_id: result.result_id, difference_ids: [selected[0], ...selected.slice(1)], reviewer: reviewer.trim(), comment: comment.trim(), action };
          sessionStorage.setItem(key, JSON.stringify(pending.current));
          setHasPending(true);
        }
        const submission = pending.current;
        await request("/consistency/review/submit", submission);
        const next = await request("/consistency/review/context", { evidence_id: result.evidence_id });
        sessionStorage.removeItem(key);
        localStorage.setItem("iad.reviewer", submission.reviewer);
        pending.current = null;
        if (active.current) {
          setContext(next);
          setHasPending(false);
          setNotice("\u5904\u7F6E\u5DF2\u63D0\u4EA4");
        }
      } catch (error3) {
        if (active.current) setError(message(error3));
      } finally {
        if (active.current) setBusy(false);
      }
    }
    async function verify(decision_id) {
      setBusy(true);
      setError("");
      try {
        const compared = await request("/consistency/compare", { sample_a: bundle.parameters.sample_a, sample_b: bundle.parameters.sample_b });
        const checked = await request("/consistency/review/verify", { client_request_id: v4_default(), decision_id, evidence_id: compared.evidence_id, reviewer: reviewer.trim() });
        const next = await request("/consistency/review/context", { evidence_id: result.evidence_id });
        if (active.current) {
          setContext(next);
          setNotice(checked.reason);
        }
      } catch (error3) {
        if (active.current) setError(message(error3));
      } finally {
        if (active.current) setBusy(false);
      }
    }
    async function compareCurrent() {
      setBusy(true);
      setError("");
      try {
        const compared = await request("/consistency/compare", { sample_a: bundle.parameters.sample_a, sample_b: bundle.parameters.sample_b });
        if (active.current) workspace.updateConsistency({ evidenceId: compared.evidence_id, resultId: compared.result_id, differenceId: void 0 }, true);
      } catch (error3) {
        if (active.current) setError(message(error3));
      } finally {
        if (active.current) setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("section", { className: "iad-job-panel iad-consistency-review", "aria-label": "\u4E00\u81F4\u6027\u4EBA\u5DE5\u5904\u7F6E", children: [
      /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("h2", { children: "\u4EBA\u5DE5\u5904\u7F6E" }),
      context && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("table", { className: "iad-resource-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("th", { children: "\u5DEE\u5F02" }),
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("th", { children: "\u590D\u6838" }),
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("th", { children: "\u6E90\u4FEE\u6B63" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("tbody", { children: context.differences.map((item) => /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("tr", { "data-review-state": item.review_state, "data-correction-state": item.correction_state, children: [
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("input", { type: "checkbox", "aria-label": `\u5904\u7F6E\u5DEE\u5F02 ${result.annotation.differences.find((diff) => diff.difference_id === item.difference_id)?.type}`, disabled: busy || hasPending, checked: selected.includes(item.difference_id), onChange: (event) => setSelected(event.target.checked ? [...selected, item.difference_id] : selected.filter((id) => id !== item.difference_id)) }),
            differenceLabels[result.annotation.differences.find((diff) => diff.difference_id === item.difference_id).type]
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("td", { children: reviewStates[item.review_state] }),
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("td", { children: correctionStates[item.correction_state] })
        ] }, item.difference_id)) })
      ] }) }),
      !current && /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("div", { className: "iad-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("p", { className: "iad-muted", children: "\u5386\u53F2\u6765\u6E90\u53EF\u8865\u5145\u5904\u7F6E\u8BF4\u660E\uFF1B\u8D28\u91CF\u88C1\u51B3\u548C\u533A\u57DF\u5EFA\u8BAE\u9700\u91CD\u65B0\u6BD4\u8F83\u5F53\u524D\u6765\u6E90\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("button", { disabled: busy || hasPending, onClick: () => void compareCurrent(), children: "\u91CD\u65B0\u6BD4\u8F83\u5F53\u524D\u6765\u6E90" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("form", { onSubmit: (event) => {
        event.preventDefault();
        void submit();
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("fieldset", { disabled: busy || hasPending, children: [
          /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("div", { className: "iad-config-bar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("label", { className: "iad-field", children: [
              "\u5904\u7F6E\u52A8\u4F5C",
              /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("select", { "aria-label": "\u4E00\u81F4\u6027\u5904\u7F6E\u52A8\u4F5C", value: kind, onChange: (event) => setKind(event.target.value), children: Object.entries(actions2).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("option", { value, children: label }, value)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("label", { className: "iad-field", children: [
              "\u590D\u6838\u4EBA",
              /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("input", { "aria-label": "\u4E00\u81F4\u6027\u590D\u6838\u4EBA", value: reviewer, onChange: (event) => setReviewer(event.target.value), required: true })
            ] })
          ] }),
          kind === "SET_EFFECTIVE_QUALITY" && /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("section", { "aria-label": "\u8D28\u91CF\u88C1\u51B3\u76EE\u6807", children: [
            /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("h3", { children: "\u5B9E\u9645\u76EE\u6807\u6837\u672C" }),
            sources.map((source) => /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("label", { className: "iad-field", children: [
              source.sample.relative_path,
              /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("select", { "aria-label": `\u8D28\u91CF\u88C1\u51B3 ${source.sample.relative_path}`, value: quality[source.sample.sample_id] || "", onChange: (event) => setQuality({ ...quality, [source.sample.sample_id]: event.target.value }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("option", { value: "", children: "\u4E0D\u4FEE\u6539" }),
                ["PASS", "FAIL", "HARD_NORMAL", "UNCERTAIN"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("option", { value, children: reviewLabel(value) }, value))
              ] })
            ] }, source.sample.sample_id))
          ] }),
          kind === "PROPOSE_REGION_CHANGE" && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)(ConsistencyRegionProposal, { sources, differences: selectedDiffs, onChange: setRegion }),
          /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("label", { className: "iad-field", children: [
            "\u5904\u7F6E\u8BF4\u660E",
            /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("textarea", { "aria-label": "\u4E00\u81F4\u6027\u5904\u7F6E\u8BF4\u660E", required: true, value: comment, onChange: (event) => setComment(event.target.value) })
          ] })
        ] }),
        hasPending && pending.current && /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("div", { role: "status", children: [
          "\u63D0\u4EA4\u7ED3\u679C\u5F85\u786E\u8BA4 \xB7 ",
          actions2[pending.current.action.kind],
          " \xB7 ",
          pending.current.reviewer,
          /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("p", { children: pending.current.comment }),
          pending.current.action.kind === "SET_EFFECTIVE_QUALITY" && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("ul", { children: pending.current.action.targets.map((target) => /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("li", { children: [
            sources.find((source) => source.sample.sample_id === target.sample_id)?.sample.relative_path,
            " \xB7 ",
            reviewLabel(target.quality)
          ] }, target.sample_id)) }),
          pending.current.action.kind === "PROPOSE_REGION_CHANGE" && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("ul", { children: pending.current.action.changes.map((change, index3) => /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("li", { children: [
            sources.find((source) => source.sample.sample_id === change.sample_id)?.sample.relative_path,
            " \xB7 ",
            change.operation
          ] }, index3)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("button", { className: "iad-primary", disabled: busy || !hasPending && !canSubmit, children: busy ? "\u63D0\u4EA4\u4E2D\u2026" : hasPending ? "\u91CD\u8BD5\u540C\u4E00\u5904\u7F6E" : "\u63D0\u4EA4\u5904\u7F6E" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("p", { role: "status", children: notice }),
      !!context?.decisions.length && /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("summary", { children: [
          "\u5904\u7F6E\u8BB0\u5F55 \xB7 ",
          context.decisions.length
        ] }),
        context.decisions.map((decision) => /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)("p", { children: [
            actions2[decision.request.action.kind],
            " \xB7 ",
            decision.request.reviewer,
            " \xB7 ",
            decision.request.comment
          ] }),
          decision.request.action.kind === "PROPOSE_REGION_CHANGE" && /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("button", { disabled: busy || hasPending || !reviewer.trim(), onClick: () => void verify(decision.decision_id), children: "\u9A8C\u8BC1\u91CD\u626B\u7ED3\u679C" })
        ] }, decision.decision_id))
      ] })
    ] });
  }

  // src/client/components/ConsistencyEvidencePage.tsx
  var import_jsx_runtime68 = __require("react/jsx-runtime");
  var sourceStates = { CURRENT: "\u6765\u6E90\u4E0E\u5F53\u6B21\u68C0\u67E5\u4E00\u81F4", CHANGED: "\u6765\u6E90\u5DF2\u53D8\u5316", MISSING: "\u6765\u6E90\u5DF2\u79FB\u9664", UNKNOWN: "\u6765\u6E90\u72B6\u6001\u672A\u77E5" };
  function ConsistencyEvidencePage({ evidenceId }) {
    const { workspace, state } = useWorkspace();
    const [bundle, setBundle] = (0, import_react62.useState)(null), [error2, setError] = (0, import_react62.useState)("");
    const [asking, setAsking] = (0, import_react62.useState)(false);
    (0, import_react62.useEffect)(() => {
      const controller = new AbortController();
      setBundle(null);
      setError("");
      request(`/consistency/evidence/${encodeURIComponent(evidenceId)}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setBundle(value);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [evidenceId]);
    return /* @__PURE__ */ (0, import_jsx_runtime68.jsxs)("div", { className: "iad-workbench iad-consistency", "data-page": "industrial-consistency", "data-evidence-id": evidenceId, children: [
      /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime68.jsxs)(WorkbenchHeader, { pageId: "industrial-consistency", title: "\u6BD4\u8F83\u8BC1\u636E", children: [
        /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("button", { disabled: !!state.consistency.returnPage && !bundle, onClick: () => {
          const pageId = state.consistency.returnPage, queryId = state.consistency.query?.sample_id;
          const source = queryId && bundle ? [bundle.sources.left.sample, bundle.sources.right.sample].find((sample) => sample.sample_id === queryId) : bundle?.sources.left.sample;
          if (pageId && source?.dataset_id) workspace.openLocation({ pageId, datasetId: source.dataset_id, selected: source.sample_id });
          else workspace.updateConsistency({ evidenceId: void 0, resultId: state.consistency.tab === "conflicts" ? state.consistency.resultId : void 0, tab: state.consistency.batchId ? "jobs" : state.consistency.tab || "search" }, true);
        }, children: state.consistency.returnPage === "industrial-audit" ? "\u8FD4\u56DE\u5BA1\u8BA1" : state.consistency.returnPage === "industrial-review" ? "\u8FD4\u56DE\u590D\u6838" : state.consistency.returnPage === "industrial-images" ? "\u8FD4\u56DE\u56FE\u50CF" : state.consistency.batchId ? "\u8FD4\u56DE\u6279\u6B21" : state.consistency.tab === "conflicts" || state.consistency.tab === "groups" ? "\u8FD4\u56DE\u7ED3\u679C" : "\u8FD4\u56DE\u68C0\u7D22" }),
        /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("button", { disabled: !bundle || asking, onClick: async () => {
          if (!bundle) return;
          setAsking(true);
          setError("");
          try {
            await workspace.explainConsistency(bundle.result);
          } catch (failure) {
            setError(message(failure));
          } finally {
            setAsking(false);
          }
        }, children: asking ? "\u6B63\u5728\u6253\u5F00\u4F1A\u8BDD\u2026" : "\u5728 DSH \u4E2D\u89E3\u91CA" }),
        /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("button", { disabled: !bundle, onClick: () => window.location.assign(`/api/iad/consistency/evidence/${encodeURIComponent(evidenceId)}/export`), children: "\u4E0B\u8F7D\u8BC1\u636E" })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !bundle && !error2 && /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51BB\u7ED3\u8BC1\u636E\u2026" }),
      bundle && /* @__PURE__ */ (0, import_jsx_runtime68.jsxs)(import_jsx_runtime68.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime68.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("strong", { children: "\u5F53\u6B21\u68C0\u67E5\u7684\u51BB\u7ED3\u5185\u5BB9" }),
          /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("time", { dateTime: bundle.checked_at, children: new Date(bundle.checked_at).toLocaleString() })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime68.jsxs)("p", { className: "iad-muted", children: [
          "\u67E5\u8BE2\uFF1A",
          sourceStates[bundle.source_states.left],
          " \xB7 \u5019\u9009\uFF1A",
          sourceStates[bundle.source_states.right]
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime68.jsx)(FrozenConsistencyComparison, { bundle }),
        /* @__PURE__ */ (0, import_jsx_runtime68.jsx)(ConsistencyReviewPanel, { bundle }, bundle.result.evidence_id)
      ] })
    ] });
  }

  // src/client/components/ConsistencyJobsPanel.tsx
  var import_react64 = __require("react");

  // src/client/components/ConsistencyScopePicker.tsx
  var import_jsx_runtime69 = __require("react/jsx-runtime");
  function ConsistencyScopePicker({ datasets, value, onChange }) {
    return /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)(import_jsx_runtime69.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("label", { className: "iad-filter", children: [
        "\u68C0\u7D22\u8303\u56F4",
        /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("select", { "aria-label": "\u68C0\u7D22\u8303\u56F4", value: value.kind === "all_registered" ? "all" : "selected", onChange: (event) => onChange(event.target.value === "all" ? { kind: "all_registered" } : { kind: "datasets", dataset_ids: [datasets[0].dataset_id] }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("option", { value: "all", children: "\u5168\u90E8\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }),
          /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("option", { value: "selected", disabled: !datasets.length, children: "\u6307\u5B9A\u6570\u636E\u96C6" })
        ] })
      ] }),
      value.kind === "datasets" && /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("details", { className: "iad-consistency-scope", children: [
        /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("summary", { children: [
          "\u5DF2\u9009 ",
          value.dataset_ids.length,
          " \u4E2A\u6570\u636E\u96C6"
        ] }),
        datasets.map((row) => /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("input", { type: "checkbox", checked: value.dataset_ids.includes(row.dataset_id), disabled: value.dataset_ids.length === 1 && value.dataset_ids.includes(row.dataset_id), onChange: (event) => {
            const ids = event.target.checked ? [...value.dataset_ids, row.dataset_id] : value.dataset_ids.filter((id) => id !== row.dataset_id);
            if (ids.length) onChange({ kind: "datasets", dataset_ids: [ids[0], ...ids.slice(1)] });
          } }),
          row.name
        ] }, row.dataset_id))
      ] })
    ] });
  }

  // src/client/useConsistencyStart.ts
  var import_react63 = __require("react");
  function useConsistencyStart(onStarted) {
    const mounted = (0, import_react63.useRef)(true), pending = (0, import_react63.useRef)(false);
    const [busy, setBusy] = (0, import_react63.useState)(false), [error2, setError] = (0, import_react63.useState)(""), [notice, setNotice] = (0, import_react63.useState)("");
    (0, import_react63.useEffect)(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);
    async function start(endpoint, body) {
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const response = await request(endpoint, { ...body, request_id: v4_default() });
        if (!mounted.current) return;
        if (response.kind === "started") onStarted(response.batch_id);
        else setNotice("\u6CA1\u6709\u9700\u8981\u5904\u7406\u7684\u6837\u672C\u3002");
      } catch (failure) {
        if (mounted.current) setError(message(failure));
      } finally {
        pending.current = false;
        if (mounted.current) setBusy(false);
      }
    }
    return { start, busy, error: error2, notice };
  }

  // src/client/components/ConsistencyEmpty.tsx
  var import_jsx_runtime70 = __require("react/jsx-runtime");
  function ConsistencyEmpty({ title, description, children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime70.jsxs)("div", { className: "iad-consistency-empty", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime70.jsxs)("svg", { "aria-hidden": "true", width: "36", height: "36", viewBox: "0 0 36 36", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("rect", { x: "5", y: "6", width: "26", height: "24", rx: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("path", { d: "m9 24 7-7 5 5 4-4 6 6" }),
        /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("circle", { cx: "24", cy: "13", r: "2" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("h2", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("p", { children: description }),
      children && /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("div", { className: "iad-row", children })
    ] });
  }

  // src/client/components/ConsistencyJobsPanel.tsx
  var import_jsx_runtime71 = __require("react/jsx-runtime");
  function ConsistencyJobsPanel({ datasets }) {
    const { state, workspace } = useWorkspace(), location2 = state.consistency;
    const [subject, setSubject] = (0, import_react64.useState)("all"), [mode, setMode] = (0, import_react64.useState)("exact");
    const [batches, setBatches] = (0, import_react64.useState)([]), [revision, setRevision] = (0, import_react64.useState)(0);
    const [cancelling, setCancelling] = (0, import_react64.useState)(false), [error2, setError] = (0, import_react64.useState)("");
    const actions3 = useConsistencyStart((batchId) => {
      workspace.updateConsistency({ batchId }, true);
      setRevision((value) => value + 1);
    });
    const busy = actions3.busy || cancelling;
    const [sync, setSync] = (0, import_react64.useState)({ state: "syncing", error: "", at: null });
    const [results, setResults] = (0, import_react64.useState)(null), [cursor, setCursor] = (0, import_react64.useState)();
    const [encoder, setEncoder] = (0, import_react64.useState)(null);
    const mounted = (0, import_react64.useRef)(true);
    (0, import_react64.useEffect)(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);
    (0, import_react64.useEffect)(() => {
      const controller = new AbortController();
      request("/images/settings", void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setEncoder(value);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, []);
    (0, import_react64.useEffect)(() => {
      const controller = new AbortController();
      let timer;
      async function poll() {
        let active = false;
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(1e4)]);
        setSync((previous) => ({ ...previous, state: previous.error ? "stale" : "syncing" }));
        try {
          const catalog = await request("/consistency/runs", void 0, void 0, signal);
          if (location2.batchId && !catalog.items.some((item) => item.batch_id === location2.batchId)) catalog.items.push(await request(`/consistency/runs/${encodeURIComponent(location2.batchId)}`, void 0, void 0, signal));
          if (controller.signal.aborted) return;
          setBatches(catalog.items);
          setSync({ state: "current", error: "", at: Date.now() });
          active = catalog.items.some((item) => ["RUNNING", "PENDING"].includes(item.status));
        } catch (failure) {
          if (!controller.signal.aborted) setSync((previous) => ({ ...previous, state: "stale", error: message(failure) }));
        } finally {
          if (!controller.signal.aborted) timer = setTimeout(poll, active ? 1200 : 5e3);
        }
      }
      void poll();
      return () => {
        controller.abort();
        clearTimeout(timer);
      };
    }, [location2.batchId, revision]);
    const selected = batches.find((item) => item.batch_id === location2.batchId) || (!location2.batchId ? batches[0] : void 0);
    (0, import_react64.useEffect)(() => {
      setCursor(void 0);
    }, [selected?.batch_id]);
    (0, import_react64.useEffect)(() => {
      const controller = new AbortController();
      setResults(null);
      if (selected) request("/consistency/query", { selection: { kind: "batch", batch_id: selected.batch_id }, cursor, page_size: 20 }, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setResults(value);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [selected?.batch_id, selected?.pair_count, cursor]);
    async function cancel() {
      if (!selected) return;
      setCancelling(true);
      setError("");
      try {
        await request(`/consistency/runs/${encodeURIComponent(selected.batch_id)}/cancel`, {});
        if (mounted.current) setRevision((value) => value + 1);
      } catch (failure) {
        if (mounted.current) setError(message(failure));
      } finally {
        if (mounted.current) setCancelling(false);
      }
    }
    const scope = location2.scope || { kind: "all_registered" };
    const latestIndex = batches.filter((batch) => batch.kind === "index").sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
    return /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("section", { "aria-label": "\u4E00\u81F4\u6027\u6279\u6B21", children: [
      (error2 || actions3.error) && /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("p", { role: "alert", className: "iad-error", children: error2 || actions3.error }),
      actions3.notice && /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("p", { role: "status", children: actions3.notice }),
      /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("form", { className: "iad-consistency-query", onSubmit: (event) => {
        event.preventDefault();
        void actions3.start("/consistency/start", { subjects: subject === "all" ? { kind: "all_registered" } : { kind: "datasets", dataset_ids: [subject] }, corpus_scope: scope, mode });
      }, children: /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("fieldset", { disabled: busy, children: [
        /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("legend", { className: "iad-visually-hidden", children: "\u6279\u91CF\u68C0\u67E5\u8303\u56F4\u4E0E\u68C0\u7D22\u5E93" }),
        /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("label", { className: "iad-filter", children: [
            "\u68C0\u67E5\u8303\u56F4",
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("select", { "aria-label": "\u68C0\u67E5\u8303\u56F4", value: subject, onChange: (event) => setSubject(event.target.value), children: [
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("option", { value: "all", children: "\u5168\u90E8\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }),
              datasets.map((dataset) => /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("option", { value: dataset.dataset_id, children: dataset.name }, dataset.dataset_id))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)(ConsistencyScopePicker, { datasets, value: scope, onChange: (value) => workspace.updateConsistency({ scope: value }, true) }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("label", { className: "iad-filter", children: [
            "\u68C0\u67E5\u65B9\u5F0F",
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("select", { "aria-label": "\u68C0\u67E5\u65B9\u5F0F", value: mode, onChange: (event) => setMode(event.target.value), children: [
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("option", { value: "exact", children: "\u4E25\u683C\u540C\u56FE" }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("option", { value: "combined", children: "\u4E25\u683C\u540C\u56FE\u4E0E\u89C6\u89C9\u5019\u9009" }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("option", { value: "visual", children: "\u89C6\u89C9\u5019\u9009" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { className: "iad-primary", type: "submit", disabled: !datasets.length, children: "\u5F00\u59CB\u6279\u91CF\u68C0\u67E5" }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { type: "button", disabled: !datasets.length, onClick: () => void actions3.start("/images/index/prepare", { corpus_scope: scope }), children: "\u51C6\u5907\u68C0\u7D22\u7D22\u5F15" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime71.jsx)(JobSync, { label: "\u6279\u6B21\u72B6\u6001\u540C\u6B65", syncState: sync.state, lastSyncedAt: sync.at, error: sync.error, refresh: () => setRevision((value) => value + 1) }),
      /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("div", { className: "iad-consistency-status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("strong", { children: "\u7D22\u5F15\u4E0E\u4F5C\u4E1A" }),
        /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("span", { children: !encoder ? "\u7D22\u5F15\u914D\u7F6E\u8BFB\u53D6\u4E2D" : !encoder.selection ? "\u56FE\u50CF\u7F16\u7801\u5668\u672A\u914D\u7F6E" : "\u5F53\u524D\u7D22\u5F15\u8986\u76D6\u4EE5\u5B9E\u9645\u67E5\u8BE2\u4E3A\u51C6" }),
        /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
          "\u4F5C\u4E1A ",
          batches.length
        ] }),
        latestIndex ? /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
          "\u6700\u8FD1\u7D22\u5F15\u4F5C\u4E1A \xB7 ",
          jobStatuses[latestIndex.status],
          " \xB7 ",
          latestIndex.completed,
          "/",
          latestIndex.total,
          " \u5F20"
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("span", { children: "\u5C1A\u65E0\u7D22\u5F15\u4F5C\u4E1A\u8BB0\u5F55" }),
        selected && /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
          "\u5F53\u524D\u4F5C\u4E1A\u8303\u56F4 ",
          selected.scopes.subjects.sample_count,
          " \u5F20"
        ] })
      ] }),
      !batches.length ? /* @__PURE__ */ (0, import_jsx_runtime71.jsx)(ConsistencyEmpty, { title: "\u5C1A\u65E0\u68C0\u67E5\u4F5C\u4E1A", description: "\u4E25\u683C\u540C\u56FE\u68C0\u67E5\u53EF\u76F4\u63A5\u6267\u884C\uFF1B\u89C6\u89C9\u68C0\u7D22\u9700\u8981\u5148\u5728\u56FE\u50CF\u68C0\u7D22\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u7F16\u7801\u5668\u5E76\u51C6\u5907\u5BF9\u5E94\u7D22\u5F15\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("div", { className: "iad-consistency-jobs", children: [
        /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("div", { className: "iad-consistency-list iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u4F5C\u4E1A\u8BB0\u5F55", children: [
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u4F5C\u4E1A" }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u7C7B\u578B" }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u68C0\u67E5\u8303\u56F4 / \u68C0\u7D22\u5E93" }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u8FDB\u5EA6" }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u72B6\u6001" }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u64CD\u4F5C" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("tbody", { children: batches.map((batch) => /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("tr", { "aria-selected": batch.batch_id === selected?.batch_id, children: [
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("td", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("time", { dateTime: batch.created_at, children: new Date(batch.created_at).toLocaleString() }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("small", { title: batch.batch_id, children: batch.batch_id })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("td", { children: batch.kind === "index" ? "\u7D22\u5F15\u51C6\u5907" : "\u4E00\u81F4\u6027\u68C0\u67E5" }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("td", { children: [
              batch.scopes.subjects.sample_count,
              " / ",
              batch.scopes.corpus.sample_count,
              " \u5F20"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("td", { children: [
              batch.completed,
              " / ",
              batch.total,
              !!batch.failed && /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { className: "iad-error", children: [
                " \xB7 \u5931\u8D25 ",
                batch.failed
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("td", { children: jobStatuses[batch.status] }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { "aria-pressed": batch.batch_id === selected?.batch_id, onClick: () => workspace.updateConsistency({ batchId: batch.batch_id }, true), children: "\u67E5\u770B\u7ED3\u679C" }) })
          ] }, batch.batch_id)) })
        ] }) }),
        selected && /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("section", { "data-batch-id": selected.batch_id, "aria-label": "\u6279\u6B21\u8BE6\u60C5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("strong", { role: "status", children: selected.cancel_requested && ["PENDING", "RUNNING"].includes(selected.status) ? "\u6B63\u5728\u505C\u6B62" : jobStatuses[selected.status] }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
              "\u5B8C\u6210 ",
              selected.completed,
              " \xB7 \u5931\u8D25 ",
              selected.failed,
              " \xB7 \u672A\u5904\u7406 ",
              selected.unprocessed,
              " \xB7 \u5171 ",
              selected.total,
              " \u5F20"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
              "\u6BD4\u8F83 ",
              selected.pair_count,
              " \u5BF9"
            ] }),
            ["PENDING", "RUNNING"].includes(selected.status) ? /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { disabled: busy || selected.cancel_requested, onClick: () => void cancel(), children: "\u505C\u6B62\u6279\u6B21" }) : selected.failed + selected.unprocessed > 0 && /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { disabled: busy, onClick: () => void actions3.start(`/consistency/runs/${encodeURIComponent(selected.batch_id)}/retry`, {}), children: "\u91CD\u8BD5\u5931\u8D25\u4E0E\u672A\u5904\u7406" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("progress", { "aria-label": "\u6279\u6B21\u6837\u672C\u8FDB\u5EA6", max: selected.total || 1, value: selected.completed + selected.failed }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("p", { className: "iad-muted", children: [
            "\u51BB\u7ED3\u68C0\u67E5\u8303\u56F4 ",
            selected.scopes.subjects.sample_count,
            " \u5F20 \xB7 \u68C0\u7D22\u5E93 ",
            selected.scopes.corpus.sample_count,
            " \u5F20"
          ] }),
          selected.error && /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("p", { role: "alert", children: [
            selected.error.code,
            " \xB7 ",
            selected.error.message
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("table", { className: "iad-resource-table", "aria-label": "\u6279\u6B21\u5B50\u4F5C\u4E1A", children: [
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u6570\u636E\u96C6" }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u4EFB\u52A1" }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u72B6\u6001" }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("th", { children: "\u5B8C\u6210 / \u5931\u8D25 / \u672A\u5904\u7406" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("tbody", { children: selected.children.map((child) => /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("td", { children: datasets.find((dataset) => dataset.dataset_id === child.dataset_id)?.name || child.dataset_id }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("td", { children: child.job_type === "IMAGE_INDEX" ? "\u56FE\u50CF\u7D22\u5F15" : "\u4E00\u81F4\u6027\u6BD4\u8F83" }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("td", { children: [
                jobStatuses[child.status],
                child.phase && ["PENDING", "RUNNING"].includes(child.status) ? ` \xB7 ${jobPhases[child.phase] || child.phase}` : ""
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("td", { children: [
                child.completed,
                " / ",
                child.failed,
                " / ",
                child.unprocessed
              ] })
            ] }, child.run_id)) })
          ] }) }),
          selected.children.flatMap((child) => child.errors.map((failure, index3) => /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("p", { className: "iad-error", children: [
            failure.relative_path || failure.sample_id,
            "\uFF1A",
            failure.code ? `${failure.code} \xB7 ` : "",
            failure.message
          ] }, child.run_id + index3))),
          /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("section", { "aria-label": "\u6279\u6B21\u6BD4\u8F83\u7ED3\u679C", children: [
            /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("h2", { children: [
              "\u6BD4\u8F83\u7ED3\u679C",
              results ? ` \xB7 ${results.total}` : ""
            ] }),
            results?.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("div", { className: "iad-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
                imageRelations[item.result.verification.relation],
                " \xB7 ",
                item.result.annotation.confirmed_conflict ? "\u5DF2\u786E\u8BA4\u5DEE\u5F02" : item.result.annotation.differences.length ? "\u5B58\u5728\u5F85\u6838\u5BF9\u5DEE\u5F02" : "\u672A\u53D1\u73B0\u5DEE\u5F02"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsxs)("span", { children: [
                item.sample_a.split(":").slice(1).join(":"),
                " \u2194 ",
                item.sample_b.split(":").slice(1).join(":")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { onClick: () => workspace.updateConsistency({ batchId: selected.batch_id, evidenceId: item.result.evidence_id, resultId: item.result.result_id }, true), children: "\u6253\u5F00\u6BD4\u8F83\u8BC1\u636E" })
            ] }, item.result.result_id)),
            results?.next_cursor && /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { onClick: () => setCursor(results.next_cursor), children: "\u4E0B\u4E00\u9875\u7ED3\u679C" }),
            cursor && /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("button", { onClick: () => setCursor(void 0), children: "\u8FD4\u56DE\u9996\u6279\u7ED3\u679C" }),
            results && !results.total && /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("p", { className: "iad-muted", children: "\u5F53\u524D\u6279\u6B21\u5C1A\u65E0\u6210\u5BF9\u6BD4\u8F83\u7ED3\u679C\u3002" })
          ] })
        ] })
      ] })
    ] });
  }

  // src/client/components/ConsistencyScopeResults.tsx
  var import_react67 = __require("react");

  // src/client/components/ConsistencyGroups.tsx
  var import_react66 = __require("react");

  // src/client/components/ConsistencyEvidencePreview.tsx
  var import_react65 = __require("react");
  var import_jsx_runtime72 = __require("react/jsx-runtime");
  function ConsistencyEvidencePreview({ evidenceId }) {
    const { workspace } = useWorkspace();
    const [bundle, setBundle] = (0, import_react65.useState)(null), [error2, setError] = (0, import_react65.useState)("");
    (0, import_react65.useEffect)(() => {
      const controller = new AbortController();
      setBundle(null);
      setError("");
      request(`/consistency/evidence/${encodeURIComponent(evidenceId)}`, void 0, void 0, controller.signal).then((value) => {
        if (!controller.signal.aborted) setBundle(value);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [evidenceId]);
    const open = () => workspace.updateConsistency({ batchId: void 0, evidenceId, resultId: bundle?.result.result_id }, true);
    return /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("section", { className: "iad-consistency-detail", "aria-label": "\u9009\u4E2D\u56FE\u7EC4\u8BC1\u636E", "aria-busy": !bundle && !error2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("header", { className: "iad-consistency-panel-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("strong", { children: "\u56FE\u7EC4\u8BC1\u636E" }),
        bundle && /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("span", { children: [
          imageRelations[bundle.result.verification.relation],
          " \xB7 ",
          bundle.result.annotation.differences.length,
          " \u9879\u5DEE\u5F02"
        ] })
      ] }),
      error2 && /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
      !bundle && !error2 && /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("p", { role: "status", className: "iad-empty", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u7EC4\u8BC1\u636E\u2026" }),
      bundle && /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("div", { className: "iad-consistency-detail-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("div", { className: "iad-consistency-pair-meta", children: ["left", "right"].map((side) => {
          const sample = bundle.sources[side].sample;
          return /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("strong", { title: sample.relative_path, children: sample.relative_path }),
            /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("span", { children: [
              "\u539F\u6807\u7B7E\uFF1A",
              reviewLabels[sample.quality_status] || sample.quality_status
            ] })
          ] }, side);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime72.jsx)(FrozenConsistencyComparison, { bundle, compact: true }, evidenceId),
        /* @__PURE__ */ (0, import_jsx_runtime72.jsxs)("footer", { className: "iad-consistency-detail-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("button", { onClick: open, children: "\u67E5\u770B\u539F\u56FE\u5BF9\u6BD4" }),
          /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("button", { className: "iad-primary", onClick: open, children: "\u4EBA\u5DE5\u590D\u6838" }),
          /* @__PURE__ */ (0, import_jsx_runtime72.jsx)("button", { onClick: () => window.location.assign(`/api/iad/consistency/evidence/${encodeURIComponent(evidenceId)}/export`), children: "\u5BFC\u51FA\u8BC1\u636E" })
        ] })
      ] })
    ] });
  }

  // src/client/components/ConsistencyGroups.tsx
  var import_jsx_runtime73 = __require("react/jsx-runtime");
  function ConsistencyGroups({ queryId, datasets }) {
    const { workspace, state } = useWorkspace();
    const [groups, setGroups] = (0, import_react66.useState)(null), [members, setMembers] = (0, import_react66.useState)(null);
    const page = state.consistency.groupPage || 1, memberPage = state.consistency.memberPage || 1, selected = state.consistency.groupId || "";
    const [error2, setError] = (0, import_react66.useState)("");
    (0, import_react66.useEffect)(() => {
      const controller = new AbortController();
      setGroups(null);
      setError("");
      request("/consistency/groups", { query_id: queryId, page, page_size: 20 }, void 0, controller.signal).then((data) => {
        if (!controller.signal.aborted) setGroups(data);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [queryId, page]);
    const group = groups?.items.find((item) => item.group_id === selected) || groups?.items[0];
    (0, import_react66.useEffect)(() => {
      const controller = new AbortController();
      setMembers(null);
      if (!group) return;
      request("/consistency/groups/members", { query_id: queryId, group_id: group.group_id, facts_state: group.facts_state, page: memberPage, page_size: 20 }, void 0, controller.signal).then((data) => {
        if (!controller.signal.aborted) setMembers(data);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [queryId, group?.group_id, group?.facts_state, memberPage]);
    const member = members?.items.find((item) => item.sample_id === state.consistency.memberId) || members?.items[0];
    return /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("section", { "aria-label": "\u8303\u56F4\u91CD\u590D\u56FE\u7EC4", children: [
      error2 && /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("p", { className: "iad-error", role: "alert", children: error2 }),
      groups && !groups.total ? /* @__PURE__ */ (0, import_jsx_runtime73.jsx)(ConsistencyEmpty, { title: "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u5DF2\u4FDD\u5B58\u7684\u91CD\u590D\u56FE\u7EC4", description: "\u53EF\u8C03\u6574\u4E8B\u5B9E\u6765\u6E90\u548C\u5904\u7F6E\u7B5B\u9009\uFF0C\u6216\u542F\u52A8\u5F53\u524D\u8303\u56F4\u7684\u4E25\u683C\u540C\u56FE\u68C0\u67E5\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("div", { className: "iad-consistency-master-detail", children: [
        /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("aside", { className: "iad-consistency-list", "aria-label": "\u4E25\u683C\u540C\u56FE\u7EC4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("header", { className: "iad-consistency-panel-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("strong", { children: "\u91CD\u590D\u56FE\u7EC4" }),
            /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("span", { children: [
              groups?.total || 0,
              " \u7EC4"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("div", { className: "iad-consistency-list-scroll", children: groups?.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("button", { "aria-pressed": group?.group_id === item.group_id, onClick: () => workspace.updateConsistency({ groupId: item.group_id, memberPage: 1, memberId: void 0 }, true), children: [
            /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("strong", { children: [
              item.member_count,
              " \u6210\u5458 \xB7 ",
              item.dataset_count,
              " \u4E2A\u6570\u636E\u96C6"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("span", { children: [
              item.pair_count,
              " \u5BF9\u6BD4\u8F83 \xB7 ",
              item.facts_state === "CURRENT" ? "\u5F53\u524D" : item.facts_state === "HISTORICAL" ? "\u5386\u53F2" : "\u5F85\u6838\u5B9E"
            ] })
          ] }, item.group_id + item.facts_state)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("section", { children: [
          member && /* @__PURE__ */ (0, import_jsx_runtime73.jsx)(ConsistencyEvidencePreview, { evidenceId: member.evidence_id }, member.evidence_id),
          group && /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)(import_jsx_runtime73.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("h2", { children: [
              "\u4E25\u683C\u540C\u56FE\u6210\u5458 \xB7 ",
              group.member_count
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("div", { className: "iad-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("table", { className: "iad-resource-table", children: [
              /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("th", { children: "\u56FE\u50CF" }),
                /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("th", { children: "\u6570\u636E\u96C6" }),
                /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("th", { children: "\u8BC1\u636E" })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("tbody", { children: members?.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("button", { className: "iad-consistency-text-button", "aria-pressed": item === member, onClick: () => workspace.updateConsistency({ memberId: item.sample_id }, true), children: item.relative_path }) }),
                /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("td", { title: item.dataset_id, children: datasets.find((dataset) => dataset.dataset_id === item.dataset_id)?.name || item.dataset_id }),
                /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("button", { onClick: () => workspace.updateConsistency({ evidenceId: item.evidence_id, batchId: void 0, tab: "groups" }, true), children: "\u6253\u5F00\u6BD4\u8F83\u8BC1\u636E" }) })
              ] }, item.sample_id)) })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime73.jsx)(Pagination, { total: members?.total || 0, page: memberPage, size: 20, unit: "\u4E2A\u6210\u5458", onPage: (value) => workspace.updateConsistency({ memberPage: value }, true) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime73.jsx)(Pagination, { total: groups?.total || 0, page, size: 20, unit: "\u4E2A\u56FE\u7EC4", onPage: (value) => workspace.updateConsistency({ groupPage: value, groupId: void 0, memberPage: 1 }, true) })
    ] });
  }

  // src/client/components/ConsistencyScopeResults.tsx
  var import_jsx_runtime74 = __require("react/jsx-runtime");
  function ConsistencyScopeResults({ datasets, tab }) {
    const { state, workspace } = useWorkspace();
    const scope = state.consistency.scope || { kind: "all_registered" };
    const facts = state.consistency.facts || "CURRENT";
    const [subject, setSubject] = (0, import_react67.useState)("all"), [conflict, setConflict] = (0, import_react67.useState)("confirmed");
    const [review, setReview] = (0, import_react67.useState)("");
    const [report, setReport] = (0, import_react67.useState)(null), [busy, setBusy] = (0, import_react67.useState)(false), [error2, setError] = (0, import_react67.useState)("");
    const [cursor, setCursor] = (0, import_react67.useState)(), [revision, setRevision] = (0, import_react67.useState)(0);
    const selected = state.consistency.resultId;
    const batchId = state.consistency.batchId || "";
    const [batch, setBatch] = (0, import_react67.useState)(null);
    const [batchError, setBatchError] = (0, import_react67.useState)("");
    const actions3 = useConsistencyStart((id) => {
      setBatch(null);
      workspace.updateConsistency({ batchId: id }, true);
    });
    (0, import_react67.useEffect)(() => {
      if (!batchId) return;
      const controller = new AbortController();
      let timer;
      setBatch(null);
      setBatchError("");
      async function poll() {
        try {
          const current = await request(`/consistency/runs/${encodeURIComponent(batchId)}`, void 0, void 0, AbortSignal.any([controller.signal, AbortSignal.timeout(1e4)]));
          if (controller.signal.aborted) return;
          setBatch(current);
          setBatchError("");
          if (["PENDING", "RUNNING"].includes(current.status)) timer = setTimeout(poll, 1200);
          else {
            setCursor(void 0);
            setRevision((value) => value + 1);
          }
        } catch (failure) {
          if (!controller.signal.aborted) {
            setBatchError(message(failure));
            timer = setTimeout(poll, 5e3);
          }
        }
      }
      void poll();
      return () => {
        controller.abort();
        clearTimeout(timer);
      };
    }, [batchId]);
    const scopeKey = JSON.stringify(scope);
    (0, import_react67.useEffect)(() => {
      setCursor(void 0);
    }, [scopeKey, subject, conflict, facts, tab, review]);
    (0, import_react67.useEffect)(() => {
      const controller = new AbortController();
      setBusy(true);
      setError("");
      setReport(null);
      const input = {
        selection: { kind: "scope", subjects: subject === "all" ? { kind: "all_registered" } : { kind: "datasets", dataset_ids: [subject] }, corpus_scope: scope, facts, mode: "exact" },
        relation: tab === "groups" ? "EXACT" : void 0,
        confirmed_conflict: tab === "conflicts" && conflict === "confirmed" ? true : void 0,
        review_state: review || void 0,
        cursor,
        page_size: 20
      };
      request("/consistency/report", input, void 0, controller.signal).then((data) => {
        if (!controller.signal.aborted) setReport(data);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      }).finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
      return () => controller.abort();
    }, [scopeKey, subject, conflict, facts, tab, cursor, revision, review]);
    const item = report?.page.items.find((row) => row.result.result_id === selected) || report?.page.items[0];
    return /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("section", { "aria-label": "\u8303\u56F4\u4E00\u81F4\u6027\u7ED3\u679C", children: [
      /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("form", { className: "iad-consistency-query", onSubmit: (event) => {
        event.preventDefault();
        setCursor(void 0);
        setRevision((value) => value + 1);
      }, children: /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("fieldset", { disabled: busy, children: [
        /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("legend", { className: "iad-visually-hidden", children: "\u7ED3\u679C\u8303\u56F4" }),
        /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("div", { className: "iad-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("label", { className: "iad-filter", children: [
            "\u68C0\u67E5\u8303\u56F4",
            /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("select", { "aria-label": "\u7ED3\u679C\u68C0\u67E5\u8303\u56F4", value: subject, onChange: (event) => setSubject(event.target.value), children: [
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "all", children: "\u5168\u90E8\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }),
              datasets.map((item2) => /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: item2.dataset_id, children: item2.name }, item2.dataset_id))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(ConsistencyScopePicker, { datasets, value: scope, onChange: (value) => workspace.updateConsistency({ scope: value, groupId: void 0, groupPage: 1, memberPage: 1 }, true) }),
          /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("label", { className: "iad-filter", children: [
            "\u4E8B\u5B9E\u6765\u6E90",
            /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("select", { "aria-label": "\u4E8B\u5B9E\u6765\u6E90", value: facts, onChange: (event) => workspace.updateConsistency({ facts: event.target.value }, true), children: [
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "CURRENT", children: "\u5F53\u524D\u6765\u6E90" }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "HISTORICAL", children: "\u5386\u53F2\u6765\u6E90" }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "UNKNOWN", children: "\u65E0\u6CD5\u6838\u5B9E" })
            ] })
          ] }),
          tab === "conflicts" && /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("label", { className: "iad-filter", children: [
            "\u5DEE\u5F02\u7B5B\u9009",
            /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("select", { "aria-label": "\u5DEE\u5F02\u7B5B\u9009", value: conflict, onChange: (event) => setConflict(event.target.value), children: [
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "confirmed", children: "\u5DF2\u786E\u8BA4\u51B2\u7A81" }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "all", children: "\u5168\u90E8\u6BD4\u8F83\u4E0E\u5F85\u786E\u8BA4" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("label", { className: "iad-filter", children: [
            "\u5904\u7F6E\u72B6\u6001",
            /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("select", { "aria-label": "\u5904\u7F6E\u72B6\u6001\u7B5B\u9009", value: review, onChange: (event) => setReview(event.target.value), children: [
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "", children: "\u5168\u90E8\u5904\u7F6E\u72B6\u6001" }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "OPEN", children: "\u5F85\u590D\u6838" }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "NEEDS_CONTEXT", children: "\u5F85\u8865\u5145\u4F9D\u636E" }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("option", { value: "RESOLVED", children: "\u5DF2\u88C1\u51B3" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("button", { className: "iad-primary", type: "button", disabled: !datasets.length || actions3.busy || !!batchId && !batch || !!batch && ["PENDING", "RUNNING"].includes(batch.status), onClick: () => void actions3.start("/consistency/start", { subjects: subject === "all" ? { kind: "all_registered" } : { kind: "datasets", dataset_ids: [subject] }, corpus_scope: scope, mode: "exact" }), children: actions3.busy ? "\u6B63\u5728\u542F\u52A8\u2026" : "\u5F00\u59CB\u6279\u91CF\u68C0\u67E5" }),
          /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(IconButton, { type: "submit", label: "\u5237\u65B0\u7ED3\u679C", children: /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(RefreshIcon, {}) })
        ] })
      ] }) }),
      (error2 || actions3.error) && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("p", { role: "alert", className: "iad-error", children: error2 || actions3.error }),
      actions3.notice && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("p", { role: "status", children: actions3.notice }),
      busy && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8303\u56F4\u7ED3\u679C\u2026" }),
      batchId && (batchError || !batch || batch.status !== "COMPLETED") && /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("div", { className: "iad-consistency-status", role: "status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("strong", { children: batchError ? "\u6279\u6B21\u72B6\u6001\u672A\u6838\u5B9E" : batch ? jobStatuses[batch.status] : "\u6B63\u5728\u8BFB\u53D6\u6279\u6B21\u72B6\u6001" }),
        batch && /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("span", { children: [
          "\u5B8C\u6210 ",
          batch.completed,
          " / ",
          batch.total,
          " \xB7 \u5931\u8D25 ",
          batch.failed,
          " \xB7 \u672A\u5904\u7406 ",
          batch.unprocessed
        ] }),
        batchError && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("span", { className: "iad-error", role: "alert", children: batchError }),
        /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("button", { onClick: () => workspace.updateConsistency({ tab: "jobs", batchId }, true), children: "\u67E5\u770B\u4F5C\u4E1A" })
      ] }),
      report && /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)(import_jsx_runtime74.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(ConsistencyReportSummary, { report, facts, children: batchId && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("button", { className: "iad-consistency-text-button", onClick: () => workspace.updateConsistency({ tab: "jobs", batchId }, true), children: "\u67E5\u770B\u4F5C\u4E1A" }) }),
        tab === "groups" ? /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(ConsistencyGroups, { queryId: report.page.query_id, datasets }) : /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("section", { "aria-label": "\u8303\u56F4\u6BD4\u8F83\u7ED3\u679C", children: [
          !report.page.total ? /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(ConsistencyEmpty, { title: report.page.execution.failed || report.page.execution.unsupported ? "\u5F53\u524D\u8303\u56F4\u68C0\u67E5\u4E0D\u5B8C\u6574" : report.page.execution.completed ? "\u5F53\u524D\u7B5B\u9009\u6CA1\u6709\u6BD4\u8F83\u7ED3\u679C" : "\u5C1A\u672A\u6267\u884C\u4E00\u81F4\u6027\u68C0\u67E5", description: report.page.execution.failed || report.page.execution.unsupported ? "\u8BF7\u5230\u4F5C\u4E1A\u8BB0\u5F55\u67E5\u770B\u5931\u8D25\u6216\u4E0D\u652F\u6301\u7684\u539F\u56E0\uFF1B\u672A\u6210\u529F\u68C0\u67E5\u7684\u56FE\u50CF\u4E0D\u4EE3\u8868\u6CA1\u6709\u51B2\u7A81\u3002" : report.page.execution.completed ? "\u53EF\u8C03\u6574\u5DEE\u5F02\u6216\u5904\u7F6E\u72B6\u6001\u7B5B\u9009\uFF0C\u67E5\u770B\u5DF2\u4FDD\u5B58\u7684\u68C0\u67E5\u4E8B\u5B9E\u3002" : "\u9009\u62E9\u68C0\u67E5\u8303\u56F4\u4E0E\u68C0\u7D22\u8303\u56F4\u540E\u5F00\u59CB\u68C0\u67E5\uFF0C\u7ED3\u679C\u5C06\u5728\u6B64\u663E\u793A\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("button", { onClick: () => workspace.updateConsistency({ tab: "jobs" }), children: "\u524D\u5F80\u6279\u91CF\u68C0\u67E5" }) }) : /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("div", { className: "iad-consistency-master-detail", children: [
            /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("aside", { className: "iad-consistency-list", "aria-label": "\u51B2\u7A81\u6BD4\u8F83\u5217\u8868", children: [
              /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("header", { className: "iad-consistency-panel-header", children: [
                /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("strong", { children: "\u6807\u6CE8\u51B2\u7A81" }),
                /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("span", { children: [
                  report.page.total,
                  " \u5BF9\u6BD4\u8F83"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("div", { className: "iad-consistency-list-scroll", children: report.page.items.map((row) => {
                const source = row.facts_state === "CURRENT" ? datasets.find((dataset) => row.sample_a.startsWith(dataset.dataset_id + ":")) : void 0;
                return /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("button", { className: source ? "iad-consistency-thumbnail-item" : void 0, "data-facts-state": row.facts_state, "aria-pressed": row === item, onClick: () => workspace.updateConsistency({ resultId: row.result.result_id, differenceId: void 0 }, true), children: [
                  source && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("img", { alt: "\u6BD4\u8F83\u56FE\u50CF\u7F29\u7565\u56FE", loading: "lazy", src: mediaUrl({ task_id: source.task_id, sample_id: row.sample_a }, "thumbnail") }),
                  /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("span", { className: "iad-consistency-list-caption", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("strong", { title: `${row.sample_a} \u2194 ${row.sample_b}`, children: [
                      row.sample_a.split(":").slice(1).join(":"),
                      " \u2194 ",
                      row.sample_b.split(":").slice(1).join(":")
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("span", { children: [
                      imageRelations[row.result.verification.relation],
                      " \xB7 ",
                      row.result.annotation.differences.length,
                      " \u9879\u5DEE\u5F02"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("small", { children: [
                      row.facts_state === "CURRENT" ? "\u5F53\u524D" : row.facts_state === "HISTORICAL" ? "\u5386\u53F2" : "\u65E0\u6CD5\u6838\u5B9E",
                      " \xB7 ",
                      row.result.annotation.confirmed_conflict ? "\u5DF2\u786E\u8BA4\u51B2\u7A81" : "\u5F85\u786E\u8BA4",
                      !row.evidence_available && " \xB7 \u539F\u56FE\u4E0D\u53EF\u6062\u590D"
                    ] })
                  ] })
                ] }, row.result.result_id);
              }) })
            ] }),
            item?.evidence_available ? /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(ConsistencyEvidencePreview, { evidenceId: item.result.evidence_id }, item.result.evidence_id) : /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(ConsistencyEmpty, { title: "\u8BC1\u636E\u4E0D\u53EF\u6062\u590D", description: "\u4FDD\u7559\u5DF2\u6709\u6BD4\u8F83\u4E8B\u5B9E\uFF1B\u5F53\u524D\u65E0\u6CD5\u8BFB\u53D6\u8BE5\u7EC4\u7684\u539F\u56FE\u8BC1\u636E\u3002" })
          ] }),
          report.page.next_cursor && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("button", { onClick: () => setCursor(report.page.next_cursor), children: "\u4E0B\u4E00\u9875\u6BD4\u8F83" }),
          cursor && /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("button", { onClick: () => setCursor(void 0), children: "\u8FD4\u56DE\u9996\u6279\u6BD4\u8F83" })
        ] })
      ] })
    ] });
  }

  // src/client/components/ConsistencyCandidates.tsx
  var import_jsx_runtime75 = __require("react/jsx-runtime");
  function ConsistencyCandidates({ groups, selected, datasets, onSelect, onCompare }) {
    const dataset = datasets.find((item) => item.dataset_id === selected?.dataset_id);
    const selectedGroup = groups.find((item) => item.members.includes(selected));
    const score = selectedGroup?.origins.find((origin) => origin.branch === "visual")?.score;
    return /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", { className: "iad-consistency-search-layout", children: [
      /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("section", { className: "iad-consistency-list", "aria-label": "\u5019\u9009\u56FE\u50CF\u7F51\u683C", children: [
        /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("header", { className: "iad-consistency-panel-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", { children: "\u68C0\u7D22\u7ED3\u679C" }),
          /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("span", { children: "\u6309\u5B9E\u9645\u53EC\u56DE\u987A\u5E8F" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("div", { className: "iad-consistency-candidate-grid", children: groups.flatMap((group) => group.members.map((member) => {
          const source = datasets.find((item) => item.dataset_id === member.dataset_id), name2 = member.sample_id.slice(member.sample_id.indexOf(":") + 1);
          const value = group.origins.find((origin) => origin.branch === "visual")?.score;
          return /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("button", { "data-relation": member.relation, "aria-pressed": member === selected, onClick: () => onSelect(group.content_group_id, member.sample_id), children: [
            source && /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("img", { loading: "lazy", src: mediaUrl({ task_id: source.task_id, sample_id: member.sample_id }, "thumbnail"), alt: name2 }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", { title: name2, children: name2 }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("span", { children: [
              imageRelations[member.relation],
              typeof value === "number" ? ` \xB7 \u89C6\u89C9\u5206\u6570 ${value.toFixed(4)}` : ""
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("small", { children: [
              "\u539F\u6807\u7B7E\uFF1A",
              reviewLabels[member.quality_status] || member.quality_status
            ] })
          ] }, group.content_group_id + member.sample_id);
        })) })
      ] }),
      selected && /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("aside", { className: "iad-consistency-detail", "aria-label": "\u5019\u9009\u56FE\u50CF\u8BE6\u60C5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("header", { className: "iad-consistency-panel-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", { children: "\u56FE\u50CF\u8BE6\u60C5" }),
          /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("span", { children: imageRelations[selected.relation] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", { className: "iad-consistency-detail-body", children: [
          dataset && /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("img", { className: "iad-consistency-detail-photo", src: mediaUrl({ task_id: dataset.task_id, sample_id: selected.sample_id }), alt: selected.sample_id.slice(selected.sample_id.indexOf(":") + 1) }),
          /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("dl", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dt", { children: "\u6587\u4EF6\u540D" }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dd", { title: selected.sample_id, children: selected.sample_id.slice(selected.sample_id.indexOf(":") + 1) }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dt", { children: "\u539F\u59CB\u6807\u7B7E" }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dd", { children: reviewLabels[selected.quality_status] || selected.quality_status }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dt", { children: "\u6240\u5C5E\u6570\u636E\u96C6" }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dd", { children: dataset?.name || selected.dataset_id }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dt", { children: "\u89C6\u89C9\u5206\u6570" }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dd", { children: typeof score === "number" ? score.toFixed(4) : "\u672A\u4F7F\u7528\u89C6\u89C9\u5206\u652F" }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dt", { children: "\u6807\u6CE8\u5DEE\u5F02" }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("dd", { children: selected.annotation ? `${selected.annotation.differences.length} \u9879` : "\u5C1A\u672A\u6BD4\u8F83" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("footer", { className: "iad-consistency-detail-actions", children: /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("button", { onClick: (event) => onCompare(event.currentTarget), children: "\u67E5\u770B\u539F\u56FE\u5BF9\u6BD4" }) })
        ] })
      ] })
    ] });
  }

  // src/client/components/ConsistencyPage.tsx
  var import_jsx_runtime76 = __require("react/jsx-runtime");
  function ConsistencyPage() {
    const { state } = useWorkspace();
    return state.consistency.evidenceId ? /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyEvidencePage, { evidenceId: state.consistency.evidenceId }) : /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(RetrievalWorkspace, {});
  }
  function RetrievalWorkspace() {
    const { workspace, state } = useWorkspace(), location2 = state.consistency;
    const tab = location2.tab || "conflicts", scope = location2.scope || { kind: "all_registered" };
    const [datasets, setDatasets] = (0, import_react68.useState)([]), [sourceDataset, setSourceDataset] = (0, import_react68.useState)(state.datasetId);
    const [samples, setSamples] = (0, import_react68.useState)(null), [search, setSearch] = (0, import_react68.useState)(""), [page, setPage] = (0, import_react68.useState)(1);
    const [temporary, setTemporary] = (0, import_react68.useState)(null);
    const [mode, setMode] = (0, import_react68.useState)("exact"), [topK, setTopK] = (0, import_react68.useState)(50);
    const [result, setResult] = (0, import_react68.useState)(null), [submitted, setSubmitted] = (0, import_react68.useState)(null);
    const [queryDetail, setQueryDetail] = (0, import_react68.useState)(null);
    const [comparing, setComparing] = (0, import_react68.useState)(false);
    const comparison = (0, import_react68.useRef)(null), comparisonTrigger = (0, import_react68.useRef)(null);
    (0, import_react68.useEffect)(() => {
      if (comparing) {
        comparison.current?.focus({ preventScroll: true });
        comparison.current?.scrollIntoView({ block: "start" });
      }
    }, [comparing]);
    const [busy, setBusy] = (0, import_react68.useState)(false), [uploading, setUploading] = (0, import_react68.useState)(false), [error2, setError] = (0, import_react68.useState)("");
    const mounted = (0, import_react68.useRef)(true), operation = (0, import_react68.useRef)(0);
    (0, import_react68.useEffect)(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
        operation.current++;
      };
    }, []);
    (0, import_react68.useEffect)(() => {
      const controller = new AbortController();
      request("/datasets", void 0, void 0, controller.signal).then((data) => {
        if (controller.signal.aborted) return;
        setDatasets(data.datasets);
        setSourceDataset((current) => data.datasets.find((row) => location2.query?.sample_id.startsWith(row.dataset_id + ":"))?.dataset_id || current || data.datasets[0]?.dataset_id || "");
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, []);
    const dataset = datasets.find((row) => row.dataset_id === sourceDataset);
    (0, import_react68.useEffect)(() => {
      if (tab !== "search") return;
      setSamples(null);
      if (!dataset) return;
      const controller = new AbortController();
      request(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id, { ...initialFilters, search }, page, 24)}`, void 0, void 0, controller.signal).then((data) => {
        if (!controller.signal.aborted) setSamples(data);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [tab, dataset, search, page]);
    const sampleId = location2.query?.sample_id;
    (0, import_react68.useEffect)(() => {
      operation.current++;
      setBusy(false);
      setResult(null);
      setSubmitted(null);
      setComparing(false);
    }, [sampleId, temporary?.image_ref]);
    (0, import_react68.useEffect)(() => {
      if (tab !== "search") return;
      setQueryDetail(null);
      if (!sampleId) return;
      const controller = new AbortController();
      request(`/sample/${encodeURIComponent(sampleId)}`, void 0, void 0, controller.signal).then((data) => {
        if (!controller.signal.aborted) setQueryDetail(data);
      }).catch((failure) => {
        if (!controller.signal.aborted) setError(message(failure));
      });
      return () => controller.abort();
    }, [tab, sampleId]);
    (0, import_react68.useEffect)(() => () => {
      if (!temporary) return;
      URL.revokeObjectURL(temporary.preview);
      void fetch(`/api/iad/images/temporary/${encodeURIComponent(temporary.image_ref)}`, { method: "DELETE", keepalive: true }).catch(console.error);
    }, [temporary]);
    const query = temporary ? { kind: "temporary", image_ref: temporary.image_ref } : sampleId ? { kind: "sample", sample_id: sampleId } : null;
    async function upload(file) {
      setError("");
      if (file.size > temporaryImageLimits.max_source_bytes) {
        setError("\u56FE\u50CF\u8D85\u8FC7\u4E0A\u4F20\u5927\u5C0F\u9650\u5236");
        return;
      }
      setUploading(true);
      operation.current++;
      setResult(null);
      setSubmitted(null);
      const form = new FormData();
      form.append("image", file);
      try {
        const accepted = await request("/images/temporary", form);
        if (!mounted.current) {
          await request(`/images/temporary/${encodeURIComponent(accepted.image_ref)}`, void 0, "DELETE");
          return;
        }
        setTemporary({ ...accepted, preview: URL.createObjectURL(file), name: file.name });
        workspace.updateConsistency({ query: void 0, groupId: void 0, differenceId: void 0 }, true);
      } catch (failure) {
        if (mounted.current) setError(message(failure));
      } finally {
        if (mounted.current) {
          setUploading(false);
          setBusy(false);
        }
      }
    }
    async function retrieve(cursor) {
      if (!query) return;
      const current = ++operation.current, input = cursor && submitted ? { ...submitted, cursor } : { query, corpus_scope: scope, mode, top_k: topK };
      setBusy(true);
      setError("");
      try {
        const data = await request("/images/retrieve", input);
        if (!mounted.current || current !== operation.current) return;
        setResult(data);
        setSubmitted({ ...input, cursor: void 0 });
      } catch (failure) {
        if (mounted.current && current === operation.current) setError(message(failure));
      } finally {
        if (mounted.current && current === operation.current) setBusy(false);
      }
    }
    const allGroups = result ? [...result.exact.groups, ...result.visual.groups] : [];
    const groups = allGroups;
    const group = groups.find((row) => row.content_group_id === location2.groupId) || groups[0];
    const member = group?.members.find((row) => row.sample_id === location2.memberId) || group?.members[0];
    const draftChanged = submitted && JSON.stringify({ ...submitted, cursor: void 0 }) !== JSON.stringify({ query, corpus_scope: scope, mode, top_k: topK });
    return /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-workbench iad-consistency", "data-page": "industrial-consistency", children: [
      /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("style", { children: workbenchStyles }),
      /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)(WorkbenchHeader, { pageId: "industrial-consistency", children: [
        queryDetail && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("button", { onClick: () => {
          const page2 = location2.returnPage || "industrial-images";
          workspace.openLocation({ pageId: page2, datasetId: queryDetail.sample.dataset_id, ...workspace.view(page2, void 0, queryDetail.sample.dataset_id), selected: queryDetail.sample.sample_id });
        }, children: "\u8FD4\u56DE\u56FE\u50CF" }),
        /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("button", { onClick: () => workspace.navigate("industrial-model-settings"), children: "\u56FE\u50CF\u68C0\u7D22\u8BBE\u7F6E" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)(PageTabs, { label: "\u6570\u636E\u4E00\u81F4\u6027\u5206\u533A", items: consistencyTabs, value: tab, onChange: (value) => workspace.updateConsistency({ tab: value }), children: [
        error2 && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("p", { role: "alert", className: "iad-error", children: error2 }),
        tab === "search" && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("form", { className: "iad-consistency-query", onSubmit: (event) => {
          event.preventDefault();
          void retrieve();
        }, children: /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("fieldset", { disabled: busy || uploading, children: [
          /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("legend", { className: "iad-visually-hidden", children: "\u67E5\u8BE2\u56FE\u50CF\u4E0E\u68C0\u7D22\u8303\u56F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("label", { className: "iad-filter", children: [
              "\u67E5\u8BE2\u56FE\u50CF\u6240\u5728\u96C6",
              /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("select", { "aria-label": "\u67E5\u8BE2\u56FE\u50CF\u6240\u5728\u96C6", value: sourceDataset, onChange: (event) => {
                setSourceDataset(event.target.value);
                setPage(1);
                setSearch("");
                setTemporary(null);
                workspace.updateConsistency({ query: void 0, groupId: void 0, differenceId: void 0 }, true);
              }, children: [
                !datasets.length && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: "", children: "\u65E0\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }),
                datasets.map((row) => /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: row.dataset_id, children: row.name }, row.dataset_id))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("label", { className: "iad-filter iad-query-search", children: [
              "\u641C\u7D22\u56FE\u50CF",
              /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22\u67E5\u8BE2\u56FE\u50CF", value: search, onChange: (event) => {
                setSearch(event.target.value);
                setPage(1);
              } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("label", { className: "iad-filter iad-query-sample", children: [
              "\u67E5\u8BE2\u56FE\u50CF",
              /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("select", { "aria-label": "\u67E5\u8BE2\u56FE\u50CF", value: temporary ? "" : sampleId || "", onChange: (event) => {
                setTemporary(null);
                workspace.updateConsistency({ query: event.target.value ? { kind: "sample", sample_id: event.target.value } : void 0, groupId: void 0, differenceId: void 0 }, true);
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: "", children: "\u9009\u62E9\u56FE\u50CF" }),
                sampleId && !samples?.items.some((row) => row.sample_id === sampleId) && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: sampleId, children: queryDetail?.sample.relative_path || sampleId }),
                samples?.items.map((row) => /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: row.sample_id, children: row.relative_path }, row.sample_id))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("label", { className: "iad-filter", children: [
              "\u6216\u4E0A\u4F20\u4E34\u65F6\u56FE",
              /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("input", { type: "file", "aria-label": "\u4E0A\u4F20\u67E5\u8BE2\u56FE\u50CF", accept: "image/*,.tif,.tiff", onChange: (event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyScopePicker, { datasets, value: scope, onChange: (value) => workspace.updateConsistency({ scope: value }, true) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-row iad-consistency-query-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("details", { className: "iad-consistency-advanced", children: [
              /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("summary", { children: "\u9AD8\u7EA7\u53C2\u6570" }),
              /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("label", { className: "iad-filter", children: [
                  "\u68C0\u7D22\u65B9\u5F0F",
                  /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("select", { "aria-label": "\u68C0\u7D22\u65B9\u5F0F", value: mode, onChange: (event) => setMode(event.target.value), children: [
                    /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: "exact", children: "\u4E25\u683C\u540C\u56FE" }),
                    /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: "combined", children: "\u4E25\u683C\u540C\u56FE\u4E0E\u89C6\u89C9\u5019\u9009" }),
                    /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("option", { value: "visual", children: "\u89C6\u89C9\u5019\u9009" })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("label", { className: "iad-filter", children: [
                  "\u89C6\u89C9\u5019\u9009\u7EC4\u6570",
                  /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("input", { "aria-label": "\u89C6\u89C9\u5019\u9009\u7EC4\u6570", type: "number", min: 1, max: 200, value: topK, onChange: (event) => setTopK(event.target.valueAsNumber) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("button", { className: "iad-primary", type: "submit", disabled: !query || !Number.isInteger(topK) || topK < 1 || topK > 200, children: busy ? "\u6B63\u5728\u68C0\u7D22\u2026" : "\u67E5\u627E\u540C\u56FE" }),
            uploading && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("span", { role: "status", children: "\u6B63\u5728\u63A5\u6536\u56FE\u50CF\u2026" }),
            temporary && /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("span", { children: [
              temporary.name,
              " \xB7 \u4E34\u65F6\u67E5\u8BE2"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(Pagination, { total: samples?.total || 0, page, size: 24, unit: "\u5F20\u67E5\u8BE2\u56FE\u50CF", onPage: setPage })
          ] })
        ] }) }),
        tab === "jobs" ? /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyJobsPanel, { datasets }) : tab === "conflicts" || tab === "groups" ? /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyScopeResults, { datasets, tab }) : !result ? /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyEmpty, { title: busy ? "\u6B63\u5728\u68C0\u7D22\u56FE\u50CF" : query ? "\u51C6\u5907\u5F00\u59CB\u56FE\u50CF\u68C0\u7D22" : "\u9009\u62E9\u67E5\u8BE2\u56FE\u50CF", description: "\u9009\u62E9\u6570\u636E\u96C6\u4E2D\u7684\u56FE\u50CF\uFF0C\u6216\u4E0A\u4F20\u4E00\u5F20\u4E34\u65F6\u67E5\u8BE2\u56FE\uFF1B\u68C0\u7D22\u4E0D\u4F1A\u5C06\u4E34\u65F6\u56FE\u5BFC\u5165\u6570\u636E\u96C6\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("button", { disabled: !query || busy || uploading, onClick: () => void retrieve(), children: "\u5F00\u59CB\u68C0\u7D22" }) }) : /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)(import_jsx_runtime76.Fragment, { children: [
          draftChanged && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("p", { role: "status", className: "iad-muted", children: "\u67E5\u8BE2\u6761\u4EF6\u5DF2\u6539\u53D8\uFF0C\u4EE5\u4E0B\u4FDD\u7559\u4E0A\u6B21\u68C0\u7D22\u7ED3\u679C\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("section", { className: "iad-consistency-results", "aria-label": "\u68C0\u7D22\u7ED3\u679C", "aria-busy": busy, children: [
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-consistency-status", children: [
              /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("strong", { children: [
                busy ? "\u6B63\u5728\u68C0\u7D22" : "\u68C0\u7D22\u5B8C\u6210",
                " \xB7 ",
                result.group_count,
                " \u7EC4 \xB7 ",
                result.member_count,
                " \u6210\u5458"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("span", { children: result.retrieval_completeness === "PARTIAL" ? "\u7D22\u5F15\u6216\u6BD4\u8F83\u4E0D\u5B8C\u6574" : result.retrieval_completeness === "TOP_K" ? "\u89C6\u89C9 Top-K \u5019\u9009" : "\u4E25\u683C\u540C\u56FE\u8303\u56F4" }),
              /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("span", { className: "iad-muted", children: "\u672C\u6B21\u68C0\u7D22" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("p", { className: "iad-muted", children: [
              "\u539F\u56FE\u6838\u9A8C ",
              result.coverage.verification.completed,
              "/",
              result.coverage.verification.total,
              " \xB7 \u5931\u8D25 ",
              result.coverage.verification.failed,
              " \xB7 \u6807\u6CE8\u6BD4\u8F83 ",
              result.coverage.annotation.completed,
              "/",
              result.coverage.annotation.total,
              " \xB7 \u5931\u8D25 ",
              result.coverage.annotation.failed,
              " \xB7 \u5F85\u5B9A ",
              result.coverage.annotation.pending
            ] }),
            [result.exact, result.visual].map((branch, index3) => branch.reason && /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("p", { className: "iad-muted", children: [
              index3 ? "\u89C6\u89C9\u68C0\u7D22" : "\u4E25\u683C\u540C\u56FE",
              "\uFF1A",
              branch.reason
            ] }, index3)),
            !groups.length ? /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyEmpty, { title: "\u5F53\u524D\u8FD4\u56DE\u9875\u6CA1\u6709\u5019\u9009\u56FE\u7EC4", description: "\u7ED3\u679C\u4EC5\u4EE3\u8868\u672C\u6B21\u5B9E\u9645\u68C0\u7D22\u8303\u56F4\u548C\u5DF2\u8FD4\u56DE\u7684\u8986\u76D6\uFF1B\u53EF\u8C03\u6574\u67E5\u8BE2\u6761\u4EF6\u540E\u91CD\u65B0\u68C0\u7D22\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)(import_jsx_runtime76.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyCandidates, { groups, selected: member, datasets, onCompare: (trigger) => {
                comparisonTrigger.current = trigger;
                setComparing(true);
                comparison.current?.scrollIntoView({ block: "start" });
              }, onSelect: (groupId, memberId) => workspace.updateConsistency({ groupId, memberId, differenceId: void 0 }, true) }),
              /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-row iad-consistency-result-pagination", children: [
                group?.next_member_cursor && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("button", { disabled: busy, onClick: () => void retrieve(group.next_member_cursor), children: "\u4E0B\u4E00\u9875\u6210\u5458" }),
                ["exact", "visual"].map((branch) => result[branch].next_cursor && /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("button", { disabled: busy, onClick: () => void retrieve(result[branch].next_cursor), children: [
                  "\u4E0B\u4E00\u9875",
                  branch === "exact" ? "\u540C\u56FE" : "\u89C6\u89C9",
                  "\u7EC4"
                ] }, branch))
              ] }),
              comparing && /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", { className: "iad-consistency-expanded", ref: comparison, tabIndex: -1, "aria-label": "\u539F\u56FE\u5BF9\u6BD4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("header", { className: "iad-consistency-panel-header", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("strong", { children: "\u539F\u56FE\u5BF9\u6BD4" }),
                  /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("button", { onClick: () => {
                    setComparing(false);
                    comparisonTrigger.current?.focus();
                  }, children: "\u6536\u8D77\u5BF9\u6BD4" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("div", { className: "iad-consistency-layout iad-frozen-comparison", children: member && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ConsistencyComparison, { member, query: submitted?.query.kind === "sample" ? queryDetail : null, temporary, differenceId: location2.differenceId, onDifference: (differenceId) => workspace.updateConsistency({ groupId: group.content_group_id, memberId: member.sample_id, differenceId }, true) }, member.sample_id + JSON.stringify(submitted?.query)) })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] });
  }

  // src/client/index.ts
  var name = "iad-client";
  var inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];
  function apply(ctx) {
    const workspace = new Workspace(new WorkbenchSession(ctx));
    const icons = { "industrial-datasets": DatasetIcon, "industrial-images": ImagesIcon, "industrial-exploration": ExplorationIcon, "industrial-knowledge": KnowledgeIcon, "industrial-consistency": ImagesIcon, "industrial-audit": AuditIcon, "industrial-review": ReviewIcon, "industrial-model-settings": ModelSettingsIcon };
    ctx.slots.inject("sidebar.content", () => ctx.slots.register({ name: "sidebar.content" }, IndustrialSidebar));
    ctx.slots.inject("tool.call.toolview", () => {
      for (const [key, title] of Object.entries(workbenchTools)) ctx.slots.register({ name: "tool.call.toolview", key }, (props) => import_react69.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react69.default.createElement(SessionResult, { ...props, title })));
    });
    ctx.slots.inject("sidebar.panellist", () => {
      const disposers = Object.entries(pages).map(([id, label], index3) => ctx.slots.register({ name: "sidebar.panellist", id, order: index3 + 1, label }, icons[id]));
      return () => disposers.forEach((dispose) => dispose());
    });
    ctx.slots.inject("main", () => {
      for (const id of Object.keys(pages)) {
        ctx.slots.register(
          { name: "main", key: id },
          () => import_react69.default.createElement(WorkspaceContext.Provider, { value: workspace }, import_react69.default.createElement(WorkbenchModelProvider, { children: import_react69.default.createElement(
            "div",
            { className: "iad-workspace", onFocusCapture: (event) => {
              if (event.target instanceof HTMLElement) event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
            }, style: { height: "100%", minWidth: 0, containerType: "inline-size", containerName: "workbench" } },
            id === "industrial-model-settings" ? import_react69.default.createElement(ModelSettingsPage) : id === "industrial-consistency" ? import_react69.default.createElement(ConsistencyPage) : import_react69.default.createElement(WorkbenchPage, { pageId: id })
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
