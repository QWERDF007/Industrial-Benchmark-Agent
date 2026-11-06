import React from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '../query-client.js';
import {Workspace,WorkspaceContext} from '../workspace.js';
import {WorkbenchModelProvider} from '../models.js';

export function WorkbenchProviders({workspace,children}:{workspace:Workspace;children:React.ReactNode}) {
  return <QueryClientProvider client={queryClient}><WorkspaceContext.Provider value={workspace}>
    <WorkbenchModelProvider>{children}</WorkbenchModelProvider>
  </WorkspaceContext.Provider></QueryClientProvider>;
}
