import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { message, request } from './api.js';
function editable(view) {
    return { model_id: view.models.find(model => model.model_id === view.selection?.profile.model_id)?.model_id ?? null,
        batch_size: view.resources.batch_size, input_size: view.selection?.profile.input_size ?? 224 };
}
export function useImageEncoderSettings() {
    const client = useQueryClient(), key = ['iad', 'image-settings'], path = '/images/settings';
    const resource = useQuery({ queryKey: key, queryFn: ({ signal }) => request(path, undefined, undefined, signal) });
    const mutations = useMutationState({ filters: { mutationKey: key, exact: true } });
    const edits = new Map();
    for (const state of mutations)
        for (const [field, value] of Object.entries(state.variables ?? {})) {
            if (state.status === 'success')
                edits.delete(field);
            else if (state.status === 'pending' || state.status === 'error')
                edits.set(field, { value, status: state.status, error: state.error });
        }
    const failed = [...edits].filter(([, edit]) => edit.status === 'error');
    const mutation = useMutation({ mutationKey: key, scope: { id: 'iad-image-settings' }, retry: false,
        mutationFn: async (patch) => {
            const current = client.getQueryData(key);
            if (!current)
                throw new Error('设置尚未读取完成');
            const values = { ...editable(current), ...patch };
            if (!values.model_id)
                throw new Error('请选择相似图模型');
            return request(path, { expected_revision: current.revision, ...values });
        },
        onSuccess: async (saved) => {
            await client.cancelQueries({ queryKey: key, exact: true });
            client.setQueryData(key, current => current ? { ...current, ...saved } : undefined);
        },
        onError: () => client.invalidateQueries({ queryKey: key, exact: true }), });
    return { settings: resource.data ? { ...editable(resource.data), ...Object.fromEntries([...edits].map(([field, edit]) => [field, edit.value])) } : undefined,
        models: resource.data?.models ?? [], save: (patch) => mutation.mutate(patch),
        retry: () => resource.isError ? void resource.refetch() : mutation.mutate(Object.fromEntries(failed.map(([field, edit]) => [field, edit.value]))),
        loading: resource.isPending, saving: mutations.some(state => state.status === 'pending'), saved: mutations.length > 0 && edits.size === 0,
        error: failed.length ? [...new Set(failed.map(([, edit]) => message(edit.error)))].join('；') : resource.error ? message(resource.error) : '' };
}
