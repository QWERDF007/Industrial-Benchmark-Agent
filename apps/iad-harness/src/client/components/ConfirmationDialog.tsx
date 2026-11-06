import React,{useRef,useState} from 'react';
import {Modal} from './Modal.js';
import {Button} from './Button.js';
import {message} from '../api.js';

export function ConfirmationDialog({title,children,confirmLabel='确定',danger=false,confirmDisabled=false,onConfirm,onClose,restoreFocus}: {
  title:string;children:React.ReactNode;confirmLabel?:string;danger?:boolean;confirmDisabled?:boolean;
  onConfirm():void|Promise<void>;onClose():void;restoreFocus?():HTMLElement|null;
}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const cancel=useRef<HTMLButtonElement>(null);
  return <Modal title={title} size="compact" initialFocus={cancel} restoreFocus={restoreFocus} onClose={()=>{if(!busy)onClose();}}>
    <div className="iad-dialog-body">{children}{error&&<p role="alert" className="iad-error">{error}</p>}</div>
    <footer className="iad-dialog-footer"><Button ref={cancel} aria-label={danger?'取消删除':'取消'} disabled={busy} onClick={onClose}>取消</Button>
      <Button variant={danger?'danger':'primary'} id="confirm-accept" disabled={busy||confirmDisabled} onClick={async()=>{
        setBusy(true);setError('');try{await onConfirm();onClose();}catch(error){setError(message(error));}finally{setBusy(false);}
      }}>{busy?'处理中…':confirmLabel}</Button></footer>
  </Modal>;
}
