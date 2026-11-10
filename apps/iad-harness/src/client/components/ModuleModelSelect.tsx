import React,{useId,useRef,useState} from 'react';
import {autoUpdate,flip,FloatingFocusManager,FloatingPortal,offset,shift,size,useClick,useDismiss,useFloating,useInteractions,useListNavigation,useRole} from '@floating-ui/react';
import type {ModuleModelReference,WorkbenchProvider} from '../../shared/domain.generated.js';
import {ChevronIcon} from '../AuditIcon.js';

export function ModuleModelSelect({providers,model,loading,onChange}:{
  providers:WorkbenchProvider[];model:ModuleModelReference|null;loading:boolean;
  onChange(model:ModuleModelReference):void;
}) {
  const id=useId(),input=useRef<HTMLInputElement>(null),items=useRef<Array<HTMLElement|null>>([]);
  const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[active,setActive]=useState<number|null>(null);
  const options=providers.flatMap(provider=>provider.models.map(value=>({
    reference:{provider_id:provider.provider_id,model_id:value.model_id},name:value.name||value.model_id,provider,
  })));
  const selected=options.find(option=>option.reference.provider_id===model?.provider_id&&option.reference.model_id===model.model_id);
  const query=search.trim().toLocaleLowerCase();
  const filtered=options.filter(option=>[option.name,option.reference.model_id,option.provider.name].some(value=>value.toLocaleLowerCase().includes(query)));
  const {refs,context,floatingStyles}=useFloating({open,onOpenChange:value=>{
    setOpen(value);if(!value){setSearch('');setActive(null);}
  },placement:'bottom-end',strategy:'fixed',whileElementsMounted:autoUpdate,
  middleware:[offset(6),flip({padding:12}),shift({padding:12}),size({padding:12,apply({availableHeight,availableWidth,elements}){
    Object.assign(elements.floating.style,{maxHeight:`${Math.min(360,availableHeight)}px`,maxWidth:`${availableWidth}px`});
  }})]});
  const {getReferenceProps,getFloatingProps,getItemProps}=useInteractions([
    useClick(context),useDismiss(context),useRole(context,{role:'dialog'}),
    useListNavigation(context,{listRef:items,activeIndex:active,onNavigate:setActive,virtual:true,loop:true,focusItemOnOpen:false}),
  ]);
  const choose=(reference:ModuleModelReference)=>{onChange(reference);setOpen(false);setSearch('');setActive(null);};
  return <div className="iad-module-model-select">
    <button type="button" ref={refs.setReference} className="iad-module-model-trigger" aria-label="分析模型"
      disabled={!options.length} {...getReferenceProps()}>
      <span>{selected?.name||model?.model_id||(loading?'正在读取模型…':options.length?'请选择具体模型':'暂无可选模型')}</span><ChevronIcon/>
    </button>
    {open&&<FloatingPortal><FloatingFocusManager context={context} initialFocus={input} modal={false}>
      <div ref={refs.setFloating} className="iad-module-model-menu" style={floatingStyles} {...getFloatingProps()}>
        <input ref={input} type="search" aria-label="搜索模型" placeholder="搜索模型…" value={search}
          role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls={`${id}-list`}
          aria-activedescendant={active===null?undefined:`${id}-${active}`}
          onChange={event=>{setSearch(event.target.value);setActive(null);}}
          onKeyDown={event=>{if(event.key==='Enter'&&active!==null&&filtered[active]){
            event.preventDefault();choose(filtered[active].reference);
          }}}/>
        <div role="listbox" id={`${id}-list`} aria-label="模型列表" className="iad-module-model-options">
          {providers.map(provider=>{
            const entries=filtered.map((option,index)=>({option,index})).filter(({option})=>option.provider.provider_id===provider.provider_id);
            return entries.length>0&&<div role="group" aria-label={provider.name} key={provider.provider_id}>
              <div className="iad-module-model-heading">{provider.name}</div>
              {entries.map(({option,index})=>{
                const current=option.reference.provider_id===model?.provider_id&&option.reference.model_id===model.model_id;
                return <div key={option.reference.model_id} ref={element=>{items.current[index]=element;}} id={`${id}-${index}`}
                  role="option" tabIndex={-1} aria-label={`${option.name}（${provider.name}）`} aria-selected={current}
                  className={`iad-module-model-option${active===index?' is-active':''}`}
                  {...getItemProps({onClick:()=>choose(option.reference)})}>
                  <span>{option.name}</span>{current&&<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m5 12 4 4 10-10"/></svg>}
                </div>;
              })}
            </div>;
          })}
        </div>
      </div>
    </FloatingFocusManager></FloatingPortal>}
    {model&&!selected&&!loading&&<p role="alert">所选模型不可用，请重新选择</p>}
  </div>;
}
