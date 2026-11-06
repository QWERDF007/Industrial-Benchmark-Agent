import React, {createContext, useCallback, useContext} from 'react';
import type {WorkbenchModelView} from '../shared/domain.generated.js';
import {message, request} from './api.js';
import {useQuery} from '@tanstack/react-query';
import {queryClient} from './query-client.js';
import {useWorkspace} from './workspace.js';

interface ModelState {view: WorkbenchModelView | null; loading: boolean; error: string; refresh(): Promise<void>}
const ModelContext = createContext<ModelState | null>(null);

export function WorkbenchModelProvider({children}: {children: React.ReactNode}) {
  const resource=useQuery({queryKey:['iad','resource','/models'],queryFn:()=>request<WorkbenchModelView>('/models'),
    staleTime:10000,refetchOnWindowFocus:true},queryClient);
  const view=resource.data ?? null,loading=resource.isPending,error=resource.error?message(resource.error):'';
  const refresh=useCallback(async()=>{await resource.refetch({cancelRefetch:false});},[resource.refetch]);
  return <ModelContext.Provider value={{view, loading, error, refresh}}>{children}</ModelContext.Provider>;
}

export function useWorkbenchModel() {
  const context = useContext(ModelContext);
  if (!context) throw new Error('工作台模型上下文未注册');
  return {...context, ready: !context.loading && !context.error && context.view?.ready === true};
}

export function WorkbenchModelStatus() {
  const {workspace} = useWorkspace(), {view, loading, error} = useWorkbenchModel();
  const provider = view?.providers.find(row => row.provider_id === view.selection?.provider_id);
  const model = provider?.models.find(row => row.model_id === view?.selection?.model_id);
  return <div className="iad-model-status"><span>{loading ? '正在读取模型…' : error || view?.error ||
    (view?.selection ? `${provider?.name || view.selection.provider_id}，${model?.name || view.selection.model_id}` : '使用当前服务配置')}</span>
    <button onClick={() => workspace.navigate('industrial-model-settings')}>模型设置</button></div>;
}
