import React,{useId} from 'react';

export interface SettingControlProps {
  id:string;
  'aria-label':string;
  'aria-describedby':string|undefined;
  'aria-invalid':true|undefined;
}

export function ModuleSettingRow({label,controlLabel,hint,error,children}:{
  label:string;controlLabel?:string;hint?:string;error?:string;
  children:(props:SettingControlProps)=>React.ReactNode;
}) {
  const id=useId();
  return <div className="iad-module-row">
    <div className="iad-module-row-text">
      <label htmlFor={id} className="iad-setting-label">{label}</label>
      {hint&&<p id={id+'-hint'} className="iad-setting-hint">{hint}</p>}
      {error&&<p id={id+'-error'} role="alert" className="iad-setting-hint">{error}</p>}
    </div>
    <div className="iad-module-control">{children({id,'aria-label':controlLabel??label,
      'aria-describedby':[hint?id+'-hint':null,error?id+'-error':null].filter(Boolean).join(' ')||undefined,
      'aria-invalid':error?true:undefined})}</div>
  </div>;
}
