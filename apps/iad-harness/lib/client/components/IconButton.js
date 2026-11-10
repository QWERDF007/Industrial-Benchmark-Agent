import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { CloseIcon, DeleteIcon, RefreshIcon, ClearFilterIcon, EditIcon, CopyIcon, PlusIcon, ChevronIcon, DocumentIcon, DocumentSearchIcon, ClockIcon, MineIcon, StatsIcon, EyeIcon, EyeOffIcon, ZoomInIcon, ZoomOutIcon, FitIcon, ExpandIcon } from '../AuditIcon.js';
const icons = { close: CloseIcon, delete: DeleteIcon, refresh: RefreshIcon, clear: ClearFilterIcon, edit: EditIcon, copy: CopyIcon,
    add: PlusIcon, chevron: ChevronIcon, prompt: DocumentIcon, details: DocumentSearchIcon, clock: ClockIcon, mine: MineIcon, stats: StatsIcon,
    annotations: EyeIcon, annotationsOff: EyeOffIcon, zoomIn: ZoomInIcon, zoomOut: ZoomOutIcon, fit: FitIcon, expand: ExpandIcon };
export const IconButton = forwardRef(function IconButton({ icon, label, title = label, type = 'button', className = '', ...props }, ref) {
    const Icon = icons[icon];
    return _jsx("button", { ...props, ref: ref, type: type, "aria-label": label, title: title, "data-icon": icon, className: `iad-icon-button ${className}`.trim(), children: _jsx(Icon, {}) });
});
