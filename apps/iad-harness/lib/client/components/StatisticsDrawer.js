import { jsx as _jsx } from "react/jsx-runtime";
import { Modal } from './Modal.js';
export function StatisticsDrawer({ title, loading, error, onClose, children, className = '' }) {
    return _jsx(Modal, { title: title, className: `iad-drawer iad-statistics-drawer ${className}`, onClose: onClose, children: _jsx("div", { className: "iad-dialog-body iad-statistics-content", children: error ? _jsx("p", { role: "alert", children: error }) : loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u7EDF\u8BA1\u2026" }) : children ?
                _jsx("div", { className: "iad-statistics-charts", children: children }) : _jsx("p", { role: "status", children: "\u6682\u65E0\u7EDF\u8BA1\u6570\u636E\u3002" }) }) });
}
