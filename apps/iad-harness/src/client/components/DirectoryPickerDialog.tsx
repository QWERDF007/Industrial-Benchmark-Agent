import React, {useEffect, useId, useRef, useState} from 'react';
import type {DirectoryListing} from '../../shared/contracts.js';
import {message, request} from '../api.js';
import {Button} from './Button.js';
import {Modal} from './Modal.js';

export function DirectoryPickerDialog({label, initialPath, onClose, onPick}: {
  label: string; initialPath: string; onClose(): void; onPick(path: string): void;
}) {
  const id=useId(), input=useRef<HTMLInputElement>(null), pending=useRef<AbortController|null>(null);
  const [path,setPath]=useState(initialPath||'/data1'),[listing,setListing]=useState<DirectoryListing|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  async function browse(directory:string) {
    pending.current?.abort();const controller=new AbortController();pending.current=controller;
    setPath(directory);setLoading(true);setError('');
    try {
      const value=await request<DirectoryListing>(`/directories?path=${encodeURIComponent(directory)}`,undefined,undefined,controller.signal);
      if(!controller.signal.aborted){setListing(value);setPath(current=>current===directory?value.path:current);}
    }catch(failure){if(!controller.signal.aborted)setError(message(failure));}
    finally{if(!controller.signal.aborted)setLoading(false);}
  }
  useEffect(()=>{void browse(initialPath||'/data1');return()=>pending.current?.abort();},[initialPath]);
  const canPick=listing!==null&&!loading&&!error&&path===listing.path;
  return <Modal title={`浏览服务器目录 - ${label}`} size="form" initialFocus={input} onClose={onClose}>
    <form className="iad-dialog-form-layout" onSubmit={event=>{event.preventDefault();void browse(path);}}>
      <div className="iad-dialog-body">
        <div className="iad-field"><label htmlFor={id}>目录路径</label><div className="iad-row">
          <input id={id} ref={input} value={path} onChange={event=>setPath(event.target.value)}/>
          <Button type="submit" disabled={loading}>跳转</Button>
        </div></div>
        {error&&<p role="alert" className="iad-error">{error}</p>}
        <nav aria-label="目录列表" aria-busy={loading}>
          {listing?.parent&&<Button disabled={loading} onClick={()=>void browse(listing.parent)}>上级目录</Button>}
          <ul className="iad-directory-list">{listing?.directories.map(directory=><li key={directory.path}>
            <Button disabled={loading} onClick={()=>void browse(directory.path)}>{directory.name}</Button>
          </li>)}</ul>
          {listing&&!listing.directories.length&&!loading&&<p>没有子目录</p>}
        </nav>
      </div>
      <footer className="iad-dialog-footer"><Button onClick={onClose}>取消</Button>
        <Button variant="primary" disabled={!canPick} onClick={()=>{if(canPick){onPick(listing.path);onClose();}}}>选择此目录</Button>
      </footer>
    </form>
  </Modal>;
}
