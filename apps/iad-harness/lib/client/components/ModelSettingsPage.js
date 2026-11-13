import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from './IconButton.js';
import { useModelProviders } from '../models.js';
import { workbenchStyles } from '../styles.js';
import { ProviderManager } from './ProviderManager.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
export function ModelSettingsPage() {
    const { loading, error, refresh } = useModelProviders();
    return _jsxs("div", { className: "iad-workbench", "data-page": "industrial-model-settings", children: [_jsx("style", { children: workbenchStyles }), _jsx(WorkbenchHeader, { pageId: "industrial-model-settings", children: _jsx(IconButton, { icon: "refresh", label: "\u5237\u65B0", disabled: loading, onClick: () => void refresh() }) }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsx("section", { className: "iad-provider-manager", "aria-label": "\u63D0\u4F9B\u5546\u7BA1\u7406", children: _jsx(ProviderManager, {}) })] });
}
