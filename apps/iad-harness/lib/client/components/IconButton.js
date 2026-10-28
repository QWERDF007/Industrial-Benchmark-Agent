import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const IconButton = forwardRef(function IconButton({ label, title = label, type = 'button', className = '', ...props }, ref) {
    return _jsx("button", { ...props, ref: ref, type: type, "aria-label": label, title: title, className: `iad-icon-button ${className}` });
});
