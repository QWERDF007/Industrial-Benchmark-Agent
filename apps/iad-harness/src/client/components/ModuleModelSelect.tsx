import React,{useState} from 'react';
import {IconCheckOutlineRegular,Input,Menu,MenuGroup,MenuItemButton} from '@deepseek-ai/dsh-client-ui-primitives';
import type {ModuleModelReference,WorkbenchProvider} from '../../shared/domain.generated.js';
import {ModuleSelectButton} from './ModuleSelectButton.js';
import type {SettingControlProps} from './ModuleSettingRow.js';

export function ModuleModelSelect({providers,model,loading,onChange,...control}:{
  providers:WorkbenchProvider[];model:ModuleModelReference|null;loading:boolean;
  onChange(model:ModuleModelReference):void;
}&SettingControlProps) {
  const [open,setOpen]=useState(false),[search,setSearch]=useState('');
  const options=providers.flatMap(provider=>provider.models.map(value=>({
    reference:{provider_id:provider.provider_id,model_id:value.model_id},name:value.name||value.model_id,provider,
  })));
  const selected=options.find(option=>option.reference.provider_id===model?.provider_id&&option.reference.model_id===model.model_id);
  const query=search.trim().toLocaleLowerCase();
  const filtered=options.filter(option=>[option.name,option.reference.model_id,option.provider.name].some(value=>value.toLocaleLowerCase().includes(query)));
  const close=()=>{setOpen(false);setSearch('');};
  return <div className="iad-module-model-select">
    <Menu open={open} onClose={close} portal align="end" listClassName="iad-module-model-menu"
      anchor={<ModuleSelectButton {...control} open={open} disabled={!options.length} onClick={()=>{setSearch('');setOpen(!open);}}>
        {selected?.name||model?.model_id||(loading?'正在读取模型…':options.length?'请选择具体模型':'暂无可选模型')}
      </ModuleSelectButton>}>
      <Input autoFocus type="search" aria-label="搜索模型" placeholder="搜索模型…" value={search}
        className="iad-module-model-search" onChange={event=>setSearch(event.target.value)}/>
      <div className="iad-module-model-options">
        {providers.map(provider=>{
          const entries=filtered.filter(option=>option.provider.provider_id===provider.provider_id);
          return entries.length>0&&<MenuGroup label={provider.name} key={provider.provider_id}>
            {entries.map(option=><MenuItemButton key={option.reference.model_id}
              onSelect={()=>{if(option!==selected)onChange(option.reference);close();}}>
              <span className="iad-module-model-label"><span>{option.name}</span>
                {option===selected&&<IconCheckOutlineRegular/>}</span>
            </MenuItemButton>)}
          </MenuGroup>;
        })}
        {!filtered.length&&<p role="status" className="iad-module-status">没有匹配的模型</p>}
      </div>
    </Menu>
    {model&&!selected&&!loading&&<p role="alert">所选模型不可用，请重新选择</p>}
  </div>;
}
