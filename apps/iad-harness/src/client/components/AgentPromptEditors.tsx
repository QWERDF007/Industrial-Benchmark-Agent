import React from 'react';

export function AgentPromptEditors({id,system,user,onSystemChange,onUserChange,disabled=false}: {
  id:string;system:string;user:string;onSystemChange(text:string):void;onUserChange(text:string):void;disabled?:boolean;
}) {
  return <div className="iad-agent-prompts">
    <label className="exp-input" htmlFor={`${id}-system`}>系统提示词
      <textarea className="f" id={`${id}-system`} aria-label="系统提示词" rows={7} spellCheck={false}
        value={system} onChange={event=>onSystemChange(event.target.value)} disabled={disabled}/>
    </label>
    <label className="exp-input" htmlFor={id}>用户提示词
      <textarea className="f" id={id} aria-label="用户提示词" rows={7} spellCheck={false}
        value={user} onChange={event=>onUserChange(event.target.value)} disabled={disabled}/>
    </label>
  </div>;
}
