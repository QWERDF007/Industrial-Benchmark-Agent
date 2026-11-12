import React from 'react';
import type {ModelProfile} from '../../shared/domain.generated.js';
import {reasoningEffortLabels} from '../../shared/model-settings.generated.js';
import {businessModules,type BusinessModule} from '../../shared/business-modules.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {useModelProviders} from '../models.js';
import {Select} from './Select.js';
import {ModuleModelSelect} from './ModuleModelSelect.js';
import {Button} from './Button.js';
import {ModuleNumberSetting} from './ModuleNumberSetting.js';
import {moduleSettingsStyles} from '../styles/module-settings.js';

export function ModuleSettingsSection({module}:{module:BusinessModule}) {
  const {settings,save,retry,loading,saving,saved,error}=useModuleSettings(module);
  const {providers,loading:modelsLoading,error:modelError}=useModelProviders();
  const efforts=providers.find(provider=>provider.provider_id===settings?.model?.provider_id)?.models
    .find(model=>model.model_id===settings?.model?.model_id)?.reasoning_efforts||[];
  return <section className="iad-module-settings" aria-label={`${businessModules[module]}设置`} data-module-settings={module}>
    <style>{moduleSettingsStyles}</style><h2>{businessModules[module]}</h2>
    {loading&&!settings ? <p role="status">正在读取设置…</p> : settings && <div>
      <div className="iad-module-row"><span>分析模型</span><ModuleModelSelect providers={providers} model={settings.model} loading={modelsLoading}
        onChange={model=>save({model,reasoning_effort:null})}/></div>
      {'reasoning_effort' in settings&&<label className="iad-module-row"><span>推理强度</span>
        <Select aria-label="推理强度" disabled={modelsLoading||!efforts.length} value={settings.reasoning_effort||''}
          onChange={event=>save({reasoning_effort:(event.target.value||null) as ModelProfile['reasoning_effort']})}>
          <option value="">Default</option>
          {settings.reasoning_effort&&!efforts.includes(settings.reasoning_effort)&&<option value={settings.reasoning_effort} disabled>所选强度不可用</option>}
          {efforts.map(effort=><option key={effort} value={effort}>{reasoningEffortLabels[effort]}</option>)}
        </Select>
      </label>}
      {'batch_size' in settings && <>
        <ModuleNumberSetting label={module==='audit'?'主 Agent 联合分析间隔':module==='exploration'?'后续每批图像数':'每批图像数'} value={settings.batch_size} min={1} max={module==='knowledge'?200:undefined} step={1}
          validationMessage={module==='knowledge'?'每批图像数需要为 1～200 的整数':'图像数量需要为正整数'} onSave={batch_size=>save({batch_size})}/>
      </>}
      {'sampling_ratio' in settings && <>
        <ModuleNumberSetting label="良品抽取权重" value={settings.sampling_ratio.normal} min={1} step={1}
          validationMessage="良品抽取权重需要为正整数" onSave={normal=>save({sampling_ratio:{...settings.sampling_ratio,normal}})}/>
        <ModuleNumberSetting label="异常品抽取权重" value={settings.sampling_ratio.abnormal} min={1} step={1}
          validationMessage="异常品抽取权重需要为正整数" onSave={abnormal=>save({sampling_ratio:{...settings.sampling_ratio,abnormal}})}/>
      </>}
      {'concurrency' in settings && <ModuleNumberSetting label={(module==='exploration'||module==='knowledge')?'并行观察批次数':module==='consistency'?'同时检查的主图数':'同时运行的子 Agent 数量'} value={settings.concurrency} min={1} step={1}
        validationMessage="并发数量需要为正整数" onSave={concurrency=>save({concurrency})}/>}
      {module!=='audit'&&'whole_image_max_side' in settings && <>
        <label className="iad-module-row"><span>整图输入分辨率</span><Select aria-label="整图输入分辨率" value={module==='knowledge'||module==='exploration'?0:settings.whole_image_max_side ?? 0} disabled={module==='knowledge'||module==='exploration'}
          onChange={event=>save({whole_image_max_side:Number(event.target.value)||null})}>
          <option value={0}>使用原图</option>
          {settings.whole_image_max_side && ![512,1024,1280,2048].includes(settings.whole_image_max_side) && <option value={settings.whole_image_max_side}>最长边 {settings.whole_image_max_side}</option>}
          {[512,1024,1280,2048].map(size=><option key={size} value={size}>最长边 {size}</option>)}
        </Select></label>
      </>}
      {'mode' in settings && <>
      <label className="iad-module-row"><span>检索方式</span><Select aria-label="检索方式" value={settings.mode} onChange={event=>save({mode:event.target.value as 'exact'|'combined'})}>
        <option value="exact">完全一致</option><option value="combined">一致+相似</option>
      </Select></label>
      {settings.mode==='combined'&&<ModuleNumberSetting label="相似度阈值" value={settings.min_similarity} min={0} max={1} step={.01}
        validationMessage="相似度阈值需要在 0～1 之间" onSave={min_similarity=>save({min_similarity})}/>}
      <ModuleNumberSetting label="完全一致图上限" value={settings.max_exact_candidates} min={1} step={1}
        validationMessage="完全一致图上限需要为正整数" onSave={max_exact_candidates=>save({max_exact_candidates})}/>
      {settings.mode==='combined'&&<ModuleNumberSetting label="相似图上限" value={settings.max_similar_candidates} min={1} step={1}
        validationMessage="相似图上限需要为正整数" onSave={max_similar_candidates=>save({max_similar_candidates})}/>}</>}
      {modelError&&<p role="alert">{modelError}</p>}
      <p className="iad-module-status" role="status" aria-live="polite">{saving?'正在保存…':!error&&saved?'已保存':''}</p>
    </div>}
    {error&&<div className="iad-module-error" role="alert"><span>{error}</span>{settings&&<Button onClick={retry}>重试保存</Button>}</div>}
  </section>;
}
