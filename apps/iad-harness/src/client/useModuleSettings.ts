import {useMutation,useMutationState,useQuery,useQueryClient} from '@tanstack/react-query';
import type {ModuleSettingsEdit,ModuleSettingsSnapshot} from '../shared/domain.generated.js';
import type {BusinessModule} from '../shared/business-modules.js';
import {message,request} from './api.js';

type Values=ModuleSettingsSnapshot['settings'];
type Patch=ModuleSettingsEdit['settings'];
interface ModuleSettingsState {settings:Values|undefined;save(patch:Patch):void;retry():void;loading:boolean;saving:boolean;saved:boolean;error:string}

export function useModuleSettings(module:BusinessModule):ModuleSettingsState {
  const client=useQueryClient(),key=['iad','module-settings',module] as const,path=`/settings/modules/${module}`;
  const resource=useQuery({queryKey:key,queryFn:({signal})=>request<ModuleSettingsSnapshot>(path,undefined,undefined,signal)});
  const mutations=useMutationState({filters:{mutationKey:key,exact:true}});
  const edits=new Map<string,{value:unknown;status:'pending'|'error';error:unknown}>();
  for(const state of mutations){
    for(const [field,value] of Object.entries(state.variables as Patch ?? {})){
      if(state.status==='success')edits.delete(field);
      else if(state.status==='pending'||state.status==='error')edits.set(field,{value,status:state.status,error:state.error});
    }
  }
  const failed=[...edits].filter(([,edit])=>edit.status==='error');
  const settings=resource.data ? {...resource.data.settings,...Object.fromEntries([...edits].map(([field,edit])=>[field,edit.value]))} as Values : undefined;
  const mutation=useMutation({mutationKey:key,scope:{id:`iad-module-settings-${module}`},retry:false,
    mutationFn:async(patch:Patch)=>{
      const current=client.getQueryData<ModuleSettingsSnapshot>(key);
      if(!current)throw new Error('设置尚未读取完成');
      return request<ModuleSettingsSnapshot>(path,{expected_revision:current.revision,settings:patch});
    },
    onSuccess:async(saved)=>{
      await client.cancelQueries({queryKey:key,exact:true});
      client.setQueryData(key,saved);
    },
    onError:()=>client.invalidateQueries({queryKey:key,exact:true}),
  });
  return {settings,save:patch=>mutation.mutate(patch),
    retry:()=>mutation.mutate(Object.fromEntries(failed.map(([field,edit])=>[field,edit.value]))),
    loading:resource.isPending,saving:mutations.some(state=>state.status==='pending'),
    saved:mutations.length>0&&edits.size===0,
    error:failed.length ? [...new Set(failed.map(([,edit])=>message(edit.error)))].join('；') : resource.error ? message(resource.error) : '',
  };
}
