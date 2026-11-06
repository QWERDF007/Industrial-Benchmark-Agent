import React,{useRef,useState} from 'react';
import {v4 as uuid} from 'uuid';
import {IconButton} from './IconButton.js';
import {ConfirmationDialog} from './ConfirmationDialog.js';

export function DeleteAction({title,name,description,confirmation,confirmLabel='确认删除',confirmDisabled,onDelete,disabled,className='',restoreFocus}: {
  title:string;name:string;description?:string;confirmation?:React.ReactNode;confirmLabel?:string;confirmDisabled?:boolean;
  onDelete(submissionId:string):Promise<void>;disabled?:boolean;className?:string;restoreFocus?():HTMLElement|null;
}) {
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null),submission=useRef(''),actionStarted=useRef(false);
  return <><IconButton icon="delete" ref={trigger} className={className} label={`${title} ${name}`} title={title} disabled={disabled}
    onClick={event=>{event.stopPropagation();submission.current=uuid();actionStarted.current=false;setOpen(true);}} />
    {open&&<ConfirmationDialog title={title} danger confirmLabel={confirmLabel} confirmDisabled={confirmDisabled}
      restoreFocus={()=>actionStarted.current?restoreFocus?.()||trigger.current:trigger.current} onClose={()=>setOpen(false)}
      onConfirm={async()=>{actionStarted.current=true;try{await onDelete(submission.current);}catch(error){actionStarted.current=false;throw error;}}}>
      <p>{confirmation||`确认删除「${name}」？`}</p>{description&&<p>{description}</p>}
    </ConfirmationDialog>}
  </>;
}
