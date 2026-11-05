import React,{useRef,useState} from 'react';
import type {ExplorationPromptPreset} from '../../shared/domain.generated.js';
import {message,request} from '../api.js';
import {Button} from './Button.js';
import {Modal} from './Modal.js';

export function ExplorationPresetDialog({text,onSaved,onClose}:{
  text:string;onSaved(preset:ExplorationPromptPreset):void;onClose():void;
}) {
  const [name,setName]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const input=useRef<HTMLInputElement>(null);
  async function save(event:React.FormEvent) {
    event.preventDefault();
    if(saving||!name.trim())return;
    setSaving(true);setError('');
    try{onSaved(await request<ExplorationPromptPreset>('/exploration/presets',{name:name.trim(),text}));}
    catch(failure){setError(message(failure));}
    finally{setSaving(false);}
  }
  return <Modal title="另存为提示词预设" size="compact" initialFocus={input} onClose={()=>{if(!saving)onClose();}}>
    <form className="iad-dialog-form-layout" onSubmit={event=>void save(event)}>
      <div className="iad-dialog-body"><label className="iad-field">预设名称
        <input ref={input} id="exp-new-preset" disabled={saving} value={name} onChange={event=>setName(event.target.value)} />
      </label>{error&&<p role="alert" className="iad-error">{error}</p>}</div>
      <footer className="iad-dialog-footer"><Button disabled={saving} onClick={onClose}>取消</Button>
        <Button type="submit" variant="primary" disabled={saving||!name.trim()}>{saving?'保存中…':'保存'}</Button></footer>
    </form>
  </Modal>;
}
