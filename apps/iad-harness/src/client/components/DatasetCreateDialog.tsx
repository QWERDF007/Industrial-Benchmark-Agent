import React, {useRef, useState} from 'react';
import type {Dataset, DatasetGroup} from '../../shared/contracts.js';
import {message, request} from '../api.js';
import {useFolderPreview} from '../useFolderPreview.js';
import {Button} from './Button.js';
import {DirectoryPickerDialog} from './DirectoryPickerDialog.js';
import {Modal} from './Modal.js';
import {Select} from './Select.js';

export function DatasetCreateDialog({groups, parentId, onCreated, onClose}: {
  groups: DatasetGroup[]; parentId?: string; onClose(): void;
  onCreated(value: {kind:'group'; group:DatasetGroup}|{kind:'child'; dataset:Dataset; groupId:string}): void;
}) {
  const [kind,setKind]=useState<'group'|'child'>(parentId?'child':'group');
  const [format,setFormat]=useState<Dataset['format']>('labelme');
  const [groupId,setGroupId]=useState(parentId||groups[0]?.group_id||'');
  const [name,setName]=useState(''),[imagePath,setImagePath]=useState(''),[labelPath,setLabelPath]=useState('');
  const [browse,setBrowse]=useState<'image'|'label'|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const nameInput=useRef<HTMLInputElement>(null);
  const {preview,ready,error:previewError}=useFolderPreview(imagePath,undefined,kind==='child'&&format==='folder_classification');
  async function create(event:React.FormEvent) {
    event.preventDefault();if(busy)return;setError('');
    if(!name.trim()){setError('请输入数据集名称');return;}
    if(kind==='child'&&(!groupId||!imagePath||format==='labelme'&&!labelPath)){setError('请填写数据集及目录');return;}
    setBusy(true);
    try {
      if(kind==='group')onCreated({kind,group:await request<DatasetGroup>('/datasets/groups',{name:name.trim()})});
      else {
        const body=format==='labelme'
          ? {format,name:name.trim(),group_id:groupId,image_dir:imagePath,annotation_dir:labelPath,unannotated_is_normal:true}
          : {format,name:name.trim(),group_id:groupId,root_dir:imagePath,
              rules:preview?.items.map(({path,role})=>({path,role})),preview_fingerprint:preview?.preview_fingerprint};
        onCreated({kind,dataset:await request<Dataset>('/datasets/import',body),groupId});
      }
    }catch(failure){setError(message(failure));}
    finally{setBusy(false);}
  }
  return <>
    <Modal title="添加数据集" size="form" className="iad-dataset-form" initialFocus={nameInput} onClose={()=>{if(!busy)onClose();}}>
      <form className="iad-dialog-form-layout" onSubmit={event=>void create(event)}>
        <div className="iad-dialog-body iad-form-fields">
          <fieldset className="iad-choice-group"><legend>添加类型</legend>
            <label><input type="radio" name="new-kind" value="group" disabled={busy||Boolean(parentId)} checked={kind==='group'} onChange={()=>setKind('group')}/>数据集</label>
            <label><input type="radio" name="new-kind" value="child" disabled={busy||!groups.length} checked={kind==='child'} onChange={()=>setKind('child')}/>子数据集</label>
          </fieldset>
          {kind==='child'&&<>
            <div className="iad-field"><label htmlFor="new-parent">所属数据集</label>
              <Select id="new-parent" disabled={busy||Boolean(parentId)} value={groupId} onChange={event=>setGroupId(event.target.value)}>
                {groups.map(group=><option key={group.group_id} value={group.group_id}>{group.name}</option>)}
              </Select>
            </div>
            <fieldset className="iad-choice-group"><legend>数据格式</legend>
              <label><input type="radio" name="new-format" value="labelme" disabled={busy} checked={format==='labelme'} onChange={()=>setFormat('labelme')}/>Labelme</label>
              <label><input type="radio" name="new-format" value="folder_classification" disabled={busy} checked={format==='folder_classification'} onChange={()=>setFormat('folder_classification')}/>异常检测目录</label>
            </fieldset>
          </>}
          <div className="iad-field"><label htmlFor="new-name">{kind==='child'?'子数据集名称':'数据集名称'}</label>
            <input id="new-name" placeholder="请输入数据集名称" ref={nameInput} maxLength={120} autoComplete="off" disabled={busy} required value={name} onChange={event=>setName(event.target.value)}/>
          </div>
          {kind==='child'&&<>
            <div className="iad-field"><label htmlFor="new-path">{format==='labelme'?'图像目录':'根目录'}</label><div className="iad-path-input">
              <input id="new-path" placeholder="服务器上的目录" disabled={busy} required value={imagePath} onChange={event=>setImagePath(event.target.value)}/>
              <Button disabled={busy} onClick={()=>setBrowse('image')}>浏览</Button>
            </div></div>
            {format==='labelme'&&<div className="iad-field"><label htmlFor="new-label-path">标注目录</label><div className="iad-path-input">
              <input id="new-label-path" placeholder="服务器上的目录" disabled={busy} required value={labelPath} onChange={event=>setLabelPath(event.target.value)}/>
              <Button disabled={busy} onClick={()=>setBrowse('label')}>浏览</Button>
            </div></div>}
          </>}
          {(error||previewError)&&<p role="alert" className="iad-error">{error||previewError}</p>}
        </div>
        <footer className="iad-dialog-footer"><Button disabled={busy} onClick={onClose}>取消</Button>
          <Button type="submit" variant="primary" disabled={busy||kind==='child'&&format==='folder_classification'&&!ready}>{busy?'正在添加…':'添加'}</Button>
        </footer>
      </form>
    </Modal>
    {browse&&<DirectoryPickerDialog label={browse==='label'?'标注目录':format==='labelme'?'图像目录':'根目录'}
      initialPath={browse==='image'?imagePath:labelPath} onClose={()=>setBrowse(null)}
      onPick={path=>{if(browse==='image')setImagePath(path);else setLabelPath(path);}}/>}
  </>;
}
