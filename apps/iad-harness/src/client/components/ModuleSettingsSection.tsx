import React,{useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import type {ModuleSettingsSnapshot} from '../../shared/domain.generated.js';
import {businessModules,type BusinessModule} from '../../shared/business-modules.js';
import {request,message} from '../api.js';
import {useWorkbenchModel} from '../models.js';
import {Select} from './Select.js';
import {Button} from './Button.js';
import {moduleSettingsStyles} from '../styles/module-settings.js';

type Values=ModuleSettingsSnapshot['settings'];
export function ModuleSettingsSection({module}:{module:BusinessModule}) {
  const client=useQueryClient();
  const resource=useQuery({queryKey:['iad','module-settings',module],queryFn:()=>request<ModuleSettingsSnapshot>(`/settings/modules/${module}`)});
  const {view}=useWorkbenchModel();
  const [draft,setDraft]=useState<Values|null>(null),[revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{if(resource.data && !draft){setDraft(structuredClone(resource.data.settings));setRevision(resource.data.revision);}},[resource.data,draft]);
  const changed=!!draft && JSON.stringify(draft)!==JSON.stringify(resource.data?.settings);
  const choices=(view?.providers||[]).filter(provider=>!provider.error).flatMap(provider=>provider.models
    .filter(model=>model.input_modalities?.includes('image')).map(model=>({model:{provider_id:provider.provider_id,model_id:model.model_id},label:`${model.name}（${provider.name}）`})));
  const selection=draft?.model ? JSON.stringify(draft.model) : '';
  async function save(event:React.FormEvent){
    event.preventDefault();if(!draft)return;setBusy(true);setError('');setNotice('');
    try{
      const saved=await request<ModuleSettingsSnapshot>(`/settings/modules/${module}`,{expected_revision:revision,settings:draft});
      client.setQueryData(['iad','module-settings',module],saved);
      setDraft(saved.settings);setRevision(saved.revision);setNotice('已保存');
    }catch(failure){setError(message(failure));}finally{setBusy(false);}
  }
  return <section className="iad-module-settings" aria-label={`${businessModules[module]}设置`} data-module-settings={module}>
    <style>{moduleSettingsStyles}</style><h2>{businessModules[module]}</h2>
    {resource.isPending ? <p role="status">正在读取设置…</p> : resource.error ? <p role="alert">{message(resource.error)}</p> : draft && <form onSubmit={save}>
      <fieldset disabled={busy}><label className="iad-module-row"><span>分析模型</span><Select aria-label="分析模型" value={selection} onChange={event=>{setDraft({...draft,model:choices.find(choice=>JSON.stringify(choice.model)===event.target.value)?.model ?? null});setNotice('');}}>
        <option value="">使用工作台模型</option>{selection&&!choices.some(choice=>JSON.stringify(choice.model)===selection)&&<option value={selection} disabled>所选模型不可用</option>}
        {choices.map(choice=><option key={JSON.stringify(choice.model)} value={JSON.stringify(choice.model)}>{choice.label}</option>)}
      </Select></label>
      {'mode' in draft && <><label className="iad-module-row"><span>检索方式</span><Select aria-label="检索方式" value={draft.mode} onChange={event=>setDraft({...draft,mode:event.target.value as 'exact'|'combined'})}>
        <option value="exact">完全一致</option><option value="combined">一致+相似</option>
      </Select></label>{draft.mode==='combined'&&<label className="iad-module-row"><span>相似度阈值</span><input aria-label="相似度阈值" type="number" min="0" max="1" step="0.01" required value={draft.min_similarity} onChange={event=>setDraft({...draft,min_similarity:event.target.valueAsNumber})}/></label>}</>}
      <footer><span role="status">{changed ? '有未保存的更改' : notice}</span><button type="button" onClick={()=>{setDraft(structuredClone(resource.data!.defaults));setNotice('');}}>恢复默认</button>
        <Button variant="primary" type="submit" disabled={!changed}>{busy?'保存中…':'保存设置'}</Button></footer>
      </fieldset>{error&&<p role="alert">{error}</p>}
    </form>}
  </section>;
}
