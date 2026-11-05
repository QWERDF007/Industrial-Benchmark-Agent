import { jsx as _jsx } from "react/jsx-runtime";
import { IconButton } from './IconButton.js';
export function ClearFilterButton({ ariaLabel = '清除筛选条件', title = '清除筛选条件', className = '', ...props }) {
    return _jsx(IconButton, { ...props, icon: "clear", label: ariaLabel, title: title, className: `iad-filter-action iba-filter-clear ${className}` });
}
export function RefreshIconButton({ ariaLabel = '刷新当前页面', title = '刷新当前页面', className = '', ...props }) {
    return _jsx(IconButton, { ...props, icon: "refresh", label: ariaLabel, title: title, className: `iad-filter-action iba-refresh-icon ${className}` });
}
