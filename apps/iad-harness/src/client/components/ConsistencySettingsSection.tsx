import React from 'react';
import {useModuleSettings} from '../useModuleSettings.js';
import {useImageEncoderSettings} from '../useImageEncoderSettings.js';
import {moduleSettingsStyles} from '../styles/module-settings.js';
import {ModuleModelFields} from './ModuleModelFields.js';
import {ModuleNumberSetting} from './ModuleNumberSetting.js';
import {Button} from '@deepseek-ai/dsh-client-ui-primitives';
import {ModuleSelectSetting} from './ModuleSelectSetting.js';

export function ConsistencySettingsSection() {
  const business=useModuleSettings('consistency'),encoder=useImageEncoderSettings();
  const settings=business.settings,images=encoder.settings;
  const error=[business.error,encoder.error].filter(Boolean).join('；');
  return <section className="iad-module-settings iad-consistency-settings" aria-label="数据一致性设置" data-module-settings="consistency">
    <style>{moduleSettingsStyles}</style>
    {!settings||!('mode' in settings)?<p role="status">正在读取设置…</p>:<>
      <fieldset className="iad-settings-group" data-settings-group="review"><legend>审核设置</legend>
        <ModuleModelFields settings={settings} save={business.save}/>
        <ModuleNumberSetting label="同时检查的主图数" value={settings.concurrency} min={1} step={1}
          validationMessage="并发数量需要为正整数" onSave={concurrency=>business.save({concurrency})}/>
      </fieldset>
      <fieldset className="iad-settings-group" data-settings-group="retrieval"><legend>检索方式</legend>
        <ModuleSelectSetting<'exact'|'combined'> label="检索方式" value={settings.mode}
          onChange={mode=>business.save({mode})} options={[{value:'exact',label:'完全一致'},{value:'combined',label:'一致+相似'}]}/>
        <ModuleNumberSetting label="完全一致图上限" value={settings.max_exact_candidates} min={1} step={1}
          validationMessage="完全一致图上限需要为正整数" onSave={max_exact_candidates=>business.save({max_exact_candidates})}/>
      </fieldset>
      <fieldset className="iad-settings-group" data-settings-group="similar" disabled={settings.mode==='exact'}><legend>相似图检索</legend>
        {settings.mode==='exact'&&<p className="iad-setting-hint">选择“一致+相似”后启用</p>}
        {!images?<p role="status">正在读取模型设置…</p>:<>
          <ModuleSelectSetting label="模型" controlLabel="相似图模型" value={images.model_id??''} disabled={settings.mode==='exact'}
            onChange={value=>{const model=encoder.models.find(model=>model.model_id===value);if(model)encoder.save({model_id:model.model_id});}}
            options={[{value:'',label:'请选择模型',disabled:true},...encoder.models.map(model=>({value:model.model_id,
              label:model.label+(model.available?'':'（权重未准备）'),disabled:!model.available}))]}/>
          <ModuleNumberSetting label="编码批量大小" value={images.batch_size} min={1} max={256} step={1} disabled={!images.model_id}
            hint="每次编码的图片数，越大越占显存。" validationMessage="编码批量大小需要为 1～256 的整数"
            onSave={batch_size=>encoder.save({batch_size})}/>
          <ModuleNumberSetting label="输入大小" value={images.input_size} min={16} step={16} disabled={!images.model_id}
            hint="必须为 16 的倍数，按正方形输入；越大越占显存。" validationMessage="输入大小必须是不小于 16 的整数，且为 16 的倍数"
            onSave={input_size=>encoder.save({input_size})}/>
        </>}
        <ModuleNumberSetting label="相似图上限" value={settings.max_similar_candidates} min={1} max={200} step={1}
          hint="先取前 K 张，再按阈值过滤，结果可能少于 K 张。" validationMessage="相似图上限需要为 1～200 的整数"
          onSave={max_similar_candidates=>business.save({max_similar_candidates})}/>
        <ModuleNumberSetting label="相似度阈值" value={settings.min_similarity} min={0} max={1} step={.01}
          validationMessage="相似度阈值需要在 0～1 之间" onSave={min_similarity=>business.save({min_similarity})}/>
      </fieldset>
    </>}
    <p className="iad-module-status" role="status" aria-live="polite">{business.saving||encoder.saving?'正在保存…':!error&&(business.saved||encoder.saved)?'已保存':''}</p>
    {error&&<div className="iad-module-error" role="alert"><span>{error}</span><Button variant="outline" onClick={()=>{if(business.error)business.retry();if(encoder.error)encoder.retry();}}>重试保存</Button></div>}
  </section>;
}
