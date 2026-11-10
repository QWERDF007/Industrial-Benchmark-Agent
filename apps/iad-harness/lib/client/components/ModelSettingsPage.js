import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IconButton } from './IconButton.js';
import { useModelProviders } from '../models.js';
import { workbenchStyles } from '../styles.js';
import { ProviderManager } from './ProviderManager.js';
import { ImageEncoderSettings } from './ImageEncoderSettings.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { PageTabs } from './layout/PageTabs.js';
export function ModelSettingsPage() {
    const { loading, error, refresh } = useModelProviders();
    const [tab, setTab] = useState('providers');
    const [imageRefresh, setImageRefresh] = useState(0), [imageState, setImageState] = useState({ dirty: false, busy: false });
    return _jsxs("div", { className: "iad-workbench", "data-page": "industrial-model-settings", children: [_jsx("style", { children: workbenchStyles }), _jsx(WorkbenchHeader, { pageId: "industrial-model-settings", children: _jsx(IconButton, { icon: "refresh", label: "\u5237\u65B0", disabled: loading || imageState.busy, onClick: () => tab === 'images' ? setImageRefresh(value => value + 1) : void refresh() }) }), _jsxs(PageTabs, { label: "\u6A21\u578B\u8BBE\u7F6E\u5206\u533A", items: [{ id: 'providers', label: '提供商' }, { id: 'images', label: '图像检索' }], value: tab, onChange: value => {
                    if (tab === 'images' && (imageState.busy || (imageState.dirty && !window.confirm('有未保存的图像配置，确认放弃修改？'))))
                        return;
                    setTab(value);
                    setImageState({ dirty: false, busy: false });
                }, children: [error && _jsx("p", { role: "alert", className: "iad-error", children: error }), tab === 'images' ? _jsx(ImageEncoderSettings, { refreshVersion: imageRefresh, onStateChange: setImageState }) :
                        _jsx("section", { className: "iad-provider-manager", "aria-label": "\u63D0\u4F9B\u5546\u7BA1\u7406", children: _jsx(ProviderManager, {}) })] })] });
}
