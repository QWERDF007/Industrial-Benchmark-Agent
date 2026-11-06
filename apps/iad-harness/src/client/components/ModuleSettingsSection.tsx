import React,{useState} from 'react';
import {businessModules,type BusinessModule} from '../../shared/business-modules.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {useWorkbenchModel} from '../models.js';
import {Select} from './Select.js';
import {Button} from './Button.js';
import {moduleSettingsStyles} from '../styles/module-settings.js';

export function ModuleSettingsSection({module}:{module:BusinessModule}) {
  const {settings,save,retry,loading,saving,saved,error}=useModuleSettings(module);
  const {view,loading:modelsLoading,error:modelError}=useWorkbenchModel();
  const [thresholdInput,setThresholdInput]=useState<string|null>(null),[thresholdError,setThresholdError]=useState('');
  const choices=(view?.providers||[]).filter(provider=>!provider.error).flatMap(provider=>provider.models
    .filter(model=>model.input_modalities?.includes('image')).map(model=>({model:{provider_id:provider.provider_id,model_id:model.model_id},label:`${model.name}（${provider.name}）`})));
  const selection=settings?.model ? JSON.stringify(settings.model) : '';
  const unavailable=!!selection&&!choices.some(choice=>JSON.stringify(choice.model)===selection);
  return <section className="iad-module-settings" aria-label={`${businessModules[module]}设置`} data-module-settings={module}>
    <style>{moduleSettingsStyles}</style><h2>{businessModules[module]}</h2>
    {loading&&!settings ? <p role="status">正在读取设置…</p> : settings && <div>
      <label className="iad-module-row"><span>分析模型</span><Select aria-label="分析模型" disabled={modelsLoading||!choices.length} value={selection} onChange={event=>{
        const model=choices.find(choice=>JSON.stringify(choice.model)===event.target.value)?.model;
        if(model)save({model});
      }}>
        <option value="" disabled>{modelsLoading?'正在读取模型…':choices.length?'请选择具体模型':'暂无可选模型'}</option>
        {unavailable&&<option value={selection} disabled>所选模型不可用</option>}
        {choices.map(choice=><option key={JSON.stringify(choice.model)} value={JSON.stringify(choice.model)}>{choice.label}</option>)}
      </Select></label>
      {'mode' in settings && <><label className="iad-module-row"><span>检索方式</span><Select aria-label="检索方式" value={settings.mode} onChange={event=>{
        save({mode:event.target.value as 'exact'|'combined'});setThresholdInput(null);setThresholdError('');
      }}>
        <option value="exact">完全一致</option><option value="combined">一致+相似</option>
      </Select></label>{settings.mode==='combined'&&<label className="iad-module-row"><span>相似度阈值</span><input aria-label="相似度阈值" type="number" min="0" max="1" step="0.01" required
        aria-invalid={thresholdError?true:undefined} value={thresholdInput??settings.min_similarity}
        onChange={event=>{setThresholdInput(event.target.value);setThresholdError('');}}
        onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}
        onBlur={event=>{
          if(!event.currentTarget.validity.valid||!Number.isFinite(event.currentTarget.valueAsNumber)){setThresholdError('相似度阈值需要在 0～1 之间');return;}
          const value=event.currentTarget.valueAsNumber;
          if(value!==settings.min_similarity)save({min_similarity:value});
          setThresholdInput(null);setThresholdError('');
        }}/></label>}</>}
      {thresholdError&&<p role="alert">{thresholdError}</p>}
      {modelError&&<p role="alert">{modelError}</p>}
      {unavailable&&!modelsLoading&&<p role="alert">所选模型已不可用，请重新选择</p>}
      <p className="iad-module-status" role="status" aria-live="polite">{saving?'正在保存…':!error&&saved?'已保存':''}</p>
    </div>}
    {error&&<div className="iad-module-error" role="alert"><span>{error}</span>{settings&&<Button onClick={retry}>重试保存</Button>}</div>}
  </section>;
}
