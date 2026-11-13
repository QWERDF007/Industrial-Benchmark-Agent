import {useMutation,useMutationState,useQuery,useQueryClient} from '@tanstack/react-query';
import type {DinoEncoderEdit,DinoSettingsView,ImageEncoderSettings} from '../shared/domain.generated.js';
import {message,request} from './api.js';

type Patch=Partial<Omit<DinoEncoderEdit,'expected_revision'>>;

function editable(view:DinoSettingsView) {
  return {model_id:view.models.find(model=>model.model_id===view.selection?.profile.model_id)?.model_id??null,
    batch_size:view.resources.batch_size,input_size:view.selection?.profile.input_size??224};
}

export function useImageEncoderSettings() {
  const client=useQueryClient(),key=['iad','image-settings'] as const,path='/images/settings';
  const resource=useQuery({queryKey:key,queryFn:({signal})=>request<DinoSettingsView>(path,undefined,undefined,signal)});
  const mutations=useMutationState({filters:{mutationKey:key,exact:true}});
  const edits=new Map<string,{value:unknown;status:'pending'|'error';error:unknown}>();
  for(const state of mutations)for(const [field,value] of Object.entries(state.variables as Patch??{})) {
    if(state.status==='success')edits.delete(field);
    else if(state.status==='pending'||state.status==='error')edits.set(field,{value,status:state.status,error:state.error});
  }
  const failed=[...edits].filter(([,edit])=>edit.status==='error');
  const mutation=useMutation({mutationKey:key,scope:{id:'iad-image-settings'},retry:false,
    mutationFn:async(patch:Patch)=>{
      const current=client.getQueryData<DinoSettingsView>(key);
      if(!current)throw new Error('设置尚未读取完成');
      const values={...editable(current),...patch};
      if(!values.model_id)throw new Error('请选择相似图模型');
      return request<ImageEncoderSettings>(path,{expected_revision:current.revision,...values});
    },
    onSuccess:async(saved)=>{
      await client.cancelQueries({queryKey:key,exact:true});
      client.setQueryData<DinoSettingsView>(key,current=>current?{...current,...saved}:undefined);
    },
    onError:()=>client.invalidateQueries({queryKey:key,exact:true}),
  });
  return {settings:resource.data?{...editable(resource.data),...Object.fromEntries([...edits].map(([field,edit])=>[field,edit.value]))} as ReturnType<typeof editable>:undefined,
    models:resource.data?.models??[],save:(patch:Patch)=>mutation.mutate(patch),
    retry:()=>resource.isError?void resource.refetch():mutation.mutate(Object.fromEntries(failed.map(([field,edit])=>[field,edit.value]))),
    loading:resource.isPending,saving:mutations.some(state=>state.status==='pending'),saved:mutations.length>0&&edits.size===0,
    error:failed.length?[...new Set(failed.map(([,edit])=>message(edit.error)))].join('；'):resource.error?message(resource.error):''};
}
