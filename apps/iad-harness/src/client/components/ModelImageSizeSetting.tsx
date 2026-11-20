import React from 'react';
import {ModuleNumberSetting} from './ModuleNumberSetting.js';
import {ModuleSelectSetting} from './ModuleSelectSetting.js';

export function ModelImageSizeSetting({value,onSave,disabled,commitOnChange=false,onValidityChange}:{
  value:number|null;onSave(value:number|null):void;disabled?:boolean;commitOnChange?:boolean;onValidityChange?(valid:boolean):void;
}) {
  return <>
    <ModuleSelectSetting<'original'|'limited'> label="图像大小" value={value===null?'original':'limited'}
      disabled={disabled}
      options={[{value:'original',label:'原图尺寸'},{value:'limited',label:'自定义最大边'}]}
      onChange={mode=>{onValidityChange?.(true);onSave(mode==='original'?null:2048);}}/>
    {value!==null&&<ModuleNumberSetting label="最大边（像素）" value={value} min={1} step={1}
      validationMessage="最大边需要为正整数" onSave={onSave} disabled={disabled}
      commitOnChange={commitOnChange} onValidityChange={onValidityChange}/>}
  </>;
}
