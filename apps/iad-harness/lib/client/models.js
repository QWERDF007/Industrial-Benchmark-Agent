import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext } from 'react';
import { message, request } from './api.js';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from './query-client.js';
import { useWorkspace } from './workspace.js';
const ModelContext = createContext(null);
export function WorkbenchModelProvider({ children }) {
    const resource = useQuery({ queryKey: ['iad', 'resource', '/models'], queryFn: () => request('/models'),
        staleTime: 10000, refetchOnWindowFocus: true }, queryClient);
    const view = resource.data ?? null, loading = resource.isPending, error = resource.error ? message(resource.error) : '';
    const refresh = useCallback(async () => { await resource.refetch({ cancelRefetch: false }); }, [resource.refetch]);
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
                    (view?.selection ? `${provider?.name || view.selection.provider_id}，${model?.name || view.selection.model_id}` : '使用当前服务配置') }), _jsx("button", { onClick: () => workspace.navigate('industrial-model-settings'), children: "\u6A21\u578B\u8BBE\u7F6E" })] });
}
