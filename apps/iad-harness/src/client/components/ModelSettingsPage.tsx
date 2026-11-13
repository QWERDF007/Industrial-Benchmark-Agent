import React from 'react';
import {IconButton} from './IconButton.js';
import {useModelProviders} from '../models.js';
import {workbenchStyles} from '../styles.js';
import {ProviderManager} from './ProviderManager.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';

export function ModelSettingsPage() {
  const {loading,error,refresh}=useModelProviders();
  return <div className="iad-workbench" data-page="industrial-model-settings"><style>{workbenchStyles}</style>
    <WorkbenchHeader pageId="industrial-model-settings"><IconButton icon="refresh" label="刷新" disabled={loading} onClick={()=>void refresh()}/></WorkbenchHeader>
    {error&&<p role="alert" className="iad-error">{error}</p>}
    <section className="iad-provider-manager" aria-label="提供商管理"><ProviderManager/></section>
  </div>;
}
