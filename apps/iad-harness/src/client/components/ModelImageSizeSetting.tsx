import React from 'react';
import {ModuleNumberSetting} from './ModuleNumberSetting.js';
import {ModuleSelectSetting} from './ModuleSelectSetting.js';

export function ModelImageSizeSetting({value,onSave}:{value:number|null;onSave(value:number|null):void}) {
  return <>
    <ModuleSelectSetting<'original'|'limited'> label="图像大小" value={value===null?'original':'limited'}
      options={[{value:'original',label:'原图尺寸'},{value:'limited',label:'自定义最大边'}]}
      onChange={mode=>onSave(mode==='original'?null:2048)}/>
    {value!==null&&<ModuleNumberSetting label="最大边（像素）" value={value} min={1} step={1}
      validationMessage="最大边需要为正整数" onSave={onSave}/>}
  </>;
}
