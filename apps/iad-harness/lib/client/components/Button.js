import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Button = forwardRef(function Button({ variant = 'secondary', type = 'button', className = '', ...props }, ref) {
    return _jsx("button", { ...props, ref: ref, type: type, "data-variant": variant, className: ['iad-button', className].filter(Boolean).join(' ') });
});
