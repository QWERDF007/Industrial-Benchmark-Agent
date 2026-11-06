import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { IconButton } from './IconButton.js';
import { ConfirmationDialog } from './ConfirmationDialog.js';
export function DeleteAction({ title, name, description, confirmation, confirmLabel = '确认删除', confirmDisabled, onDelete, disabled, className = '', restoreFocus }) {
    const [open, setOpen] = useState(false);
    const trigger = useRef(null), submission = useRef(''), actionStarted = useRef(false);
    return _jsxs(_Fragment, { children: [_jsx(IconButton, { icon: "delete", ref: trigger, className: className, label: `${title} ${name}`, title: title, disabled: disabled, onClick: event => { event.stopPropagation(); submission.current = uuid(); actionStarted.current = false; setOpen(true); } }), open && _jsxs(ConfirmationDialog, { title: title, danger: true, confirmLabel: confirmLabel, confirmDisabled: confirmDisabled, restoreFocus: () => actionStarted.current ? restoreFocus?.() || trigger.current : trigger.current, onClose: () => setOpen(false), onConfirm: async () => { actionStarted.current = true; try {
                    await onDelete(submission.current);
                }
                catch (error) {
                    actionStarted.current = false;
                    throw error;
                } }, children: [_jsx("p", { children: confirmation || `确认删除「${name}」？` }), description && _jsx("p", { children: description })] })] });
}
