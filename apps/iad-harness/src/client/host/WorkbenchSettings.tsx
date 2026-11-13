import React from 'react';
import type {Context} from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import {Workspace} from '../workspace.js';
import {businessModules,type BusinessModule} from '../../shared/business-modules.js';
import {WorkbenchProviders} from './WorkbenchProviders.js';
import {ModuleSettingsSection} from '../components/ModuleSettingsSection.js';
import {ConsistencySettingsSection} from '../components/ConsistencySettingsSection.js';

export function registerWorkbenchSettings(ctx:Context,workspace:Workspace) {
  ctx.slots.inject('settings.section',()=>{
    const disposers=(Object.entries(businessModules) as [BusinessModule,string][]).map(([module,label],index)=>
      ctx.slots.register({name:'settings.section',id:`industrial-${module}`,order:50+index,label},
        ()=><WorkbenchProviders workspace={workspace}>{module==='consistency'?<ConsistencySettingsSection/>:<ModuleSettingsSection module={module}/>}</WorkbenchProviders>));
    return ()=>disposers.forEach(dispose=>dispose());
  });
}
