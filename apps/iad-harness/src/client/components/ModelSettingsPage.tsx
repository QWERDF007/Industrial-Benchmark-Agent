import React,{useState} from 'react';
import {IconButton} from './IconButton.js';
import {useModelProviders} from '../models.js';
import {workbenchStyles} from '../styles.js';
import {ProviderManager} from './ProviderManager.js';
import {ImageEncoderSettings} from './ImageEncoderSettings.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {PageTabs} from './layout/PageTabs.js';

export function ModelSettingsPage() {
  const {loading,error,refresh}=useModelProviders();
  const [tab,setTab]=useState<'providers'|'images'>('providers');
  const [imageRefresh,setImageRefresh]=useState(0),[imageState,setImageState]=useState({dirty:false,busy:false});
  return <div className="iad-workbench" data-page="industrial-model-settings"><style>{workbenchStyles}</style>
    <WorkbenchHeader pageId="industrial-model-settings"><IconButton icon="refresh" label="刷新" disabled={loading||imageState.busy}
      onClick={()=>tab==='images'?setImageRefresh(value=>value+1):void refresh()}/></WorkbenchHeader>
    <PageTabs label="模型设置分区" items={[{id:'providers',label:'提供商'},{id:'images',label:'图像检索'}]} value={tab} onChange={value=>{
      if(tab==='images'&&(imageState.busy||(imageState.dirty&&!window.confirm('有未保存的图像配置，确认放弃修改？'))))return;
      setTab(value);setImageState({dirty:false,busy:false});
    }}>
      {error&&<p role="alert" className="iad-error">{error}</p>}
      {tab==='images'?<ImageEncoderSettings refreshVersion={imageRefresh} onStateChange={setImageState}/>:
        <section className="iad-provider-manager" aria-label="提供商管理"><ProviderManager/></section>}
    </PageTabs>
  </div>;
}
