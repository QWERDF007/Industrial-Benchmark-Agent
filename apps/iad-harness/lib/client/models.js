import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { message, request } from './api.js';
import { useWorkspace } from './workspace.js';
const ModelContext = createContext(null);
export function WorkbenchModelProvider({ children }) {
    const [view, setView] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
    const pending = useRef(null);
    const refresh = useCallback(async () => {
        pending.current?.abort();
        const controller = pending.current = new AbortController();
        setLoading(true);
        try {
            const value = await request('/models', undefined, undefined, controller.signal);
            if (!controller.signal.aborted) {
                setView(value);
                setError('');
            }
        }
        catch (failure) {
            if (!controller.signal.aborted)
                setError(message(failure));
        }
        finally {
            if (!controller.signal.aborted)
                setLoading(false);
        }
    }, []);
    useEffect(() => {
        void refresh();
        const focus = () => { void refresh(); };
        window.addEventListener('focus', focus);
        return () => { pending.current?.abort(); window.removeEventListener('focus', focus); };
    }, [refresh]);
    return _jsx(ModelContext.Provider, { value: { view, loading, error, refresh }, children: children });
}
export function useWorkbenchModel() {
    const context = useContext(ModelContext);
    if (!context)
        throw new Error('工作台模型上下文未注册');
    return { ...context, ready: !context.loading && !context.error && context.view?.ready === true };
}
export function WorkbenchModelStatus() {
    const { workspace } = useWorkspace(), { view, loading, error } = useWorkbenchModel();
    const provider = view?.providers.find(row => row.provider_id === view.selection?.provider_id);
    const model = provider?.models.find(row => row.model_id === view?.selection?.model_id);
    return _jsxs("div", { className: "iad-model-status", children: [_jsx("span", { children: loading ? '正在读取模型…' : error || view?.error ||
                    (view?.selection ? `${provider?.name || view.selection.provider_id} · ${model?.name || view.selection.model_id}` : '使用当前服务配置') }), _jsx("button", { onClick: () => workspace.navigate('industrial-model-settings'), children: "\u6A21\u578B\u8BBE\u7F6E" })] });
}
