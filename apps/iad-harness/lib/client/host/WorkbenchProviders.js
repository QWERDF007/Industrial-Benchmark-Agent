import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../query-client.js';
import { WorkspaceContext } from '../workspace.js';
import { WorkbenchModelProvider } from '../models.js';
export function WorkbenchProviders({ workspace, children }) {
    return _jsx(QueryClientProvider, { client: queryClient, children: _jsx(WorkspaceContext.Provider, { value: workspace, children: _jsx(WorkbenchModelProvider, { children: children }) }) });
}
