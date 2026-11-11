import React from 'react';

export function PromptTextEditor({id,label,value,onChange,disabled=false}: {
  id:string;label:string;value:string;onChange(text:string):void;disabled?:boolean;
}) {
  return <label className="exp-input" htmlFor={id}>{label}
    <textarea className="f iad-prompt-editor" id={id} aria-label={label} spellCheck={false}
      value={value} onChange={event=>onChange(event.target.value)} disabled={disabled}/>
  </label>;
}

export function AgentPromptEditors({id,system,user,onSystemChange,onUserChange,disabled=false,agentLabel,children}: {
  id:string;system:string;user:string;onSystemChange(text:string):void;onUserChange(text:string):void;disabled?:boolean;agentLabel?:string;children?:React.ReactNode;
}) {
  return <div className="iad-agent-prompts">
    <PromptTextEditor id={`${id}-system`} label={agentLabel?`${agentLabel} 系统提示词`:'系统提示词'} value={system} onChange={onSystemChange} disabled={disabled}/>
    <PromptTextEditor id={id} label={agentLabel?`${agentLabel} 用户提示词`:'用户提示词'} value={user} onChange={onUserChange} disabled={disabled}/>
    {children}
  </div>;
}
