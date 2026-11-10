import type {ModelCatalog} from '../shared/domain.generated.js';
import {useQuery} from '@tanstack/react-query';
import {message,request} from './api.js';

export function useModelProviders() {
  const resource=useQuery({queryKey:['iad','resource','/models/providers'],
    queryFn:({signal})=>request<ModelCatalog>('/models/providers',undefined,undefined,signal),
    staleTime:0,refetchOnMount:'always',refetchOnWindowFocus:true});
  return {view:resource.data??null,providers:resource.data?.providers??[],loading:resource.isPending,
    error:resource.error?message(resource.error):'',refresh:async()=>{await resource.refetch({cancelRefetch:false});}};
}
