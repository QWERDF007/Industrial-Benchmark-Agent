import { jsx as _jsx } from "react/jsx-runtime";
import { ConfirmationDialog } from './ConfirmationDialog.js';
export function KnowledgeConfirmation({ state, onClose }) {
    return state && _jsx(ConfirmationDialog, { title: state.title, danger: state.danger, confirmLabel: state.confirmLabel, onClose: onClose, onConfirm: state.onConfirm, children: _jsx("p", { id: "confirm-message", children: state.message }) });
}
