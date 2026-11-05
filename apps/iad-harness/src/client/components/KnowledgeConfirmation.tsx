import {Button} from './Button.js';
import {IconButton} from "./IconButton.js";
import React, {useState} from 'react';
import {Modal} from './Modal.js';
import {message} from '../api.js';

export interface KnowledgeConfirmationState {
  title:string; message:string; danger?:boolean; onConfirm():void | Promise<void>;
}

export function KnowledgeConfirmation({state, onClose}: {state:KnowledgeConfirmationState|null;onClose():void}) {
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  if (!state) return null;
  return <Modal title={state.title} onClose={()=>{if(!busy)onClose();}} className="iad-confirm-dialog knowledge-confirm-dialog" header={false}>
      <header className="iad-dialog-header"><h2>{state.title}</h2><IconButton icon="close" label="关闭确认窗口" disabled={busy} onClick={onClose} /></header>
      <div className="iad-dialog-body" id="confirm-message">{state.message}{error && <p role="alert">{error}</p>}</div>
      <footer className="iad-dialog-footer"><Button disabled={busy} onClick={onClose}>取消</Button>
        <Button variant={state.danger ? "danger" : "primary"} id="confirm-accept" disabled={busy} onClick={async()=>{
          setBusy(true);setError('');
          try{await state.onConfirm();onClose();}catch(error){setError(message(error));}finally{setBusy(false);}
        }}>{busy?'处理中…':'确定'}</Button></footer>
  </Modal>;
}
