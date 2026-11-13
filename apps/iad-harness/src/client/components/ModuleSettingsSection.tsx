import React from 'react';
import {businessModules,type BusinessModule} from '../../shared/business-modules.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {ModuleModelFields} from './ModuleModelFields.js';
import {Button} from '@deepseek-ai/dsh-client-ui-primitives';
import {ModuleNumberSetting} from './ModuleNumberSetting.js';
import {ModuleSelectSetting} from './ModuleSelectSetting.js';
import {moduleSettingsStyles} from '../styles/module-settings.js';

export function ModuleSettingsSection({module}:{module:Exclude<BusinessModule,'consistency'>}) {
  const {settings,save,retry,loading,saving,saved,error}=useModuleSettings(module);
  return <section className="iad-module-settings" aria-label={`${businessModules[module]}设置`} data-module-settings={module}>
    <style>{moduleSettingsStyles}</style>
    {loading&&!settings ? <p role="status">正在读取设置…</p> : settings && <div>
      <ModuleModelFields settings={settings} save={save}/>
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
      {'concurrency' in settings && <ModuleNumberSetting label={(module==='exploration'||module==='knowledge')?'并行观察批次数':'同时运行的子 Agent 数量'} value={settings.concurrency} min={1} step={1}
        validationMessage="并发数量需要为正整数" onSave={concurrency=>save({concurrency})}/>}
      {module!=='audit'&&'whole_image_max_side' in settings && <>
        <ModuleSelectSetting label="整图输入分辨率" value="original" disabled onChange={()=>{}}
          options={[{value:'original',label:'使用原图'}]}/>
      </>}
      <p className="iad-module-status" role="status" aria-live="polite">{saving?'正在保存…':!error&&saved?'已保存':''}</p>
    </div>}
    {error&&<div className="iad-module-error" role="alert"><span>{error}</span>{settings&&<Button variant="outline" onClick={retry}>重试保存</Button>}</div>}
  </section>;
}
