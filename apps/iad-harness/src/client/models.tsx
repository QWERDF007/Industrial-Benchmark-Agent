import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import type {WorkbenchModelView} from '../shared/domain.generated.js';
import {message, request} from './api.js';
import {useWorkspace} from './workspace.js';

interface ModelState {view: WorkbenchModelView | null; loading: boolean; error: string; refresh(): Promise<void>}
const ModelContext = createContext<ModelState | null>(null);

export function WorkbenchModelProvider({children}: {children: React.ReactNode}) {
  const [view, setView] = useState<WorkbenchModelView | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    pending.current?.abort(); const controller = pending.current = new AbortController(); setLoading(true);
    try {const value = await request<WorkbenchModelView>('/models', undefined, undefined, controller.signal);
      if (!controller.signal.aborted) {setView(value); setError('');}}
    catch (failure) {if (!controller.signal.aborted) setError(message(failure));}
    finally {if (!controller.signal.aborted) setLoading(false);}
  }, []);
  useEffect(() => {void refresh(); const focus = () => {void refresh();}; window.addEventListener('focus', focus);
    return () => {pending.current?.abort(); window.removeEventListener('focus', focus);};}, [refresh]);
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
    (view?.selection ? `${provider?.name || view.selection.provider_id} · ${model?.name || view.selection.model_id}` : '使用当前服务配置')}</span>
    <button onClick={() => workspace.navigate('industrial-model-settings')}>模型设置</button></div>;
}
