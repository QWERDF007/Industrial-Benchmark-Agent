import React from 'react';
import {businessModules,type BusinessModule} from '../../shared/business-modules.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {ModuleModelFields} from './ModuleModelFields.js';
import {Button} from '@deepseek-ai/dsh-client-ui-primitives';
import {ModuleNumberSetting} from './ModuleNumberSetting.js';
import {ModuleSelectSetting} from './ModuleSelectSetting.js';
import {ModelImageSizeSetting} from './ModelImageSizeSetting.js';
import {moduleSettingsStyles} from '../styles/module-settings.js';

const scoreWeightLabels={consistency:'数据一致性',diversity:'数据多样性',redundancy:'数据冗余度'} as const;

export function ModuleSettingsSection({module}:{module:Exclude<BusinessModule,'consistency'>}) {
  const {settings,save,retry,loading,saving,saved,error}=useModuleSettings(module);
  const auditSettings=settings&&'audit_scope' in settings?settings:undefined;
  const weightField=auditSettings?.audit_scope==='consistency'?'consistency_score_weights':'quality_score_weights';
  const weights=auditSettings?.[weightField];
  return <section className="iad-module-settings" aria-label={`${businessModules[module]}设置`} data-module-settings={module}>
    <style>{moduleSettingsStyles}</style>
    {loading&&!settings ? <p role="status">正在读取设置…</p> : settings && <div>
      {'audit_scope' in settings&&<ModuleSelectSetting label="审计范围" value={settings.audit_scope}
        options={[{value:'full',label:'完整范围'},{value:'consistency',label:'数据一致性'}]}
        onChange={audit_scope=>save({audit_scope})}/>}
      <ModuleModelFields settings={settings} save={save}/>
      {'batch_size' in settings && !('audit_scope' in settings&&settings.audit_scope==='consistency') && <>
        <ModuleNumberSetting label={module==='audit'?'主 Agent 联合分析间隔':module==='exploration'?'后续每批图像数':'每批图像数'} value={settings.batch_size} min={1} max={module==='knowledge'?200:undefined} step={1}
          validationMessage={module==='knowledge'?'每批图像数需要为 1～200 的整数':'图像数量需要为正整数'} onSave={batch_size=>save({batch_size})}/>
      </>}
      {'sampling_ratio' in settings && <>
        <ModuleNumberSetting label="良品抽取权重" value={settings.sampling_ratio.normal} min={1} step={1}
          validationMessage="良品抽取权重需要为正整数" onSave={normal=>save({sampling_ratio:{...settings.sampling_ratio,normal}})}/>
        <ModuleNumberSetting label="异常品抽取权重" value={settings.sampling_ratio.abnormal} min={1} step={1}
          validationMessage="异常品抽取权重需要为正整数" onSave={abnormal=>save({sampling_ratio:{...settings.sampling_ratio,abnormal}})}/>
      </>}
      {'concurrency' in settings && !('audit_scope' in settings&&settings.audit_scope==='consistency') && <ModuleNumberSetting label={(module==='exploration'||module==='knowledge')?'并行观察批次数':'同时运行的子 Agent 数量'} value={settings.concurrency} min={1} step={1}
        validationMessage="并发数量需要为正整数" onSave={concurrency=>save({concurrency})}/>}
      {module==='audit'&&'audit_scope' in settings&&settings.audit_scope==='full'&&<ModelImageSizeSetting value={settings.whole_image_max_side}
        onSave={whole_image_max_side=>save({whole_image_max_side})}/>}
      {module!=='audit'&&'whole_image_max_side' in settings && <>
        <ModuleSelectSetting label="整图输入分辨率" value="original" disabled onChange={()=>{}}
          options={[{value:'original',label:'使用原图'}]}/>
      </>}
      {weights&&<>
        <h3>综合得分</h3>
        {(Object.keys(scoreWeightLabels) as (keyof typeof scoreWeightLabels)[]).flatMap(key=>{
          const value=key==='redundancy'?('redundancy' in weights?weights.redundancy:undefined):weights[key];
          return value===undefined?[]:[<ModuleNumberSetting key={`${weightField}:${key}`} label={`${scoreWeightLabels[key]}系数`} value={value} min={0} step={.01}
            validationMessage="系数需为非负数，且不能全部为零"
            validate={value=>value>0||Object.entries(weights).some(([name,weight])=>name!==key&&weight>0)}
            onSave={value=>save({[weightField]:{[key]:value}})}/>];
        })}
      </>}
      <p className="iad-module-status" role="status" aria-live="polite">{saving?'正在保存…':!error&&saved?'已保存':''}</p>
    </div>}
    {error&&<div className="iad-module-error" role="alert"><span>{error}</span>{settings&&<Button variant="outline" onClick={retry}>重试保存</Button>}</div>}
  </section>;
}
