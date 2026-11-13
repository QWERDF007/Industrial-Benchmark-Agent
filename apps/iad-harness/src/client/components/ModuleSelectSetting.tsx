import React,{useEffect,useState} from 'react';
import {Menu} from '@deepseek-ai/dsh-client-ui-primitives';
import {ModuleSettingRow} from './ModuleSettingRow.js';
import {ModuleSelectButton} from './ModuleSelectButton.js';

export function ModuleSelectSetting<T extends string>({label,controlLabel,value,options,onChange,disabled,hint}:{
  label:string;controlLabel?:string;value:T;
  options:readonly {value:T;label:string;disabled?:boolean}[];
  onChange:(value:T)=>void;disabled?:boolean;hint?:string;
}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{if(disabled)setOpen(false);},[disabled]);
  const selected=options.find(option=>option.value===value);
  return <ModuleSettingRow label={label} controlLabel={controlLabel} hint={hint}>{props=><Menu open={open}
    onClose={()=>setOpen(false)} align="end" portal
    selectedId={value} items={options.map(option=>({id:option.value,label:option.label,disabled:option.disabled}))}
    onSelect={id=>{const option=options.find(option=>option.value===id);setOpen(false);if(option&&option.value!==value)onChange(option.value);}}
    anchor={<ModuleSelectButton {...props} disabled={disabled} open={open} onClick={()=>setOpen(!open)}>
      {selected?.label??'请选择'}
    </ModuleSelectButton>}/>}</ModuleSettingRow>;
}
