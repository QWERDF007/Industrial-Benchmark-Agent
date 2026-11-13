import React from 'react';
import type {ModelProfile,ModuleSettingsValues} from '../../shared/domain.generated.js';
import {reasoningEffortLabels} from '../../shared/model-settings.generated.js';
import {useModelProviders} from '../models.js';
import {ModuleModelSelect} from './ModuleModelSelect.js';
import {ModuleSettingRow} from './ModuleSettingRow.js';
import {ModuleSelectSetting} from './ModuleSelectSetting.js';

export function ModuleModelFields({settings,save}:{settings:ModuleSettingsValues;save(patch:Partial<ModuleSettingsValues>):void}) {
  const {providers,loading,error}=useModelProviders();
  const efforts=providers.find(provider=>provider.provider_id===settings.model?.provider_id)?.models
    .find(model=>model.model_id===settings.model?.model_id)?.reasoning_efforts??[];
  return <>
    <ModuleSettingRow label="分析模型">{props=><ModuleModelSelect {...props} providers={providers} model={settings.model}
      loading={loading} onChange={model=>save({model,reasoning_effort:null})}/>}</ModuleSettingRow>
    <ModuleSelectSetting<NonNullable<ModelProfile['reasoning_effort']>|''> label="推理强度" disabled={loading||!efforts.length} value={settings.reasoning_effort??''}
      onChange={value=>save({reasoning_effort:value||null})} options={[
        {value:'',label:'Default'},
        ...(settings.reasoning_effort&&!efforts.includes(settings.reasoning_effort)?[{value:settings.reasoning_effort,label:'所选强度不可用',disabled:true}]:[]),
        ...efforts.map(value=>({value,label:reasoningEffortLabels[value]})),
      ]}/>
    {error&&<p role="alert">{error}</p>}
  </>;
}
