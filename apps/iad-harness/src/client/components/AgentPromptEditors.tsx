import React from 'react';

export function PromptTextEditor({id,label,value,onChange,disabled=false}: {
  id:string;label:string;value:string;onChange(text:string):void;disabled?:boolean;
}) {
  return <label className="exp-input" htmlFor={id}>{label}
    <textarea className="f iad-prompt-editor" id={id} aria-label={label} spellCheck={false}
      value={value} onChange={event=>onChange(event.target.value)} disabled={disabled}/>
  </label>;
}

export function AgentPromptEditors({id,system,user,onSystemChange,onUserChange,disabled=false}: {
  id:string;system:string;user:string;onSystemChange(text:string):void;onUserChange(text:string):void;disabled?:boolean;
}) {
  return <div className="iad-agent-prompts">
    <PromptTextEditor id={`${id}-system`} label="系统提示词" value={system} onChange={onSystemChange} disabled={disabled}/>
    <PromptTextEditor id={id} label="用户提示词" value={user} onChange={onUserChange} disabled={disabled}/>
  </div>;
}
