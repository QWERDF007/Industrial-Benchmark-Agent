import {useEffect, useMemo, useState} from 'react';
import {message, request} from './api.js';

export function useResource<T>(path: string | null, revision: number | string = 0) {
  const query = useMemo(() => ({path, revision}), [path, revision]);
  const [result, setResult] = useState<{query: typeof query; data: T | null; error: string}>();
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    request<T>(path, undefined, undefined, controller.signal)
      .then(data => {if (!controller.signal.aborted) setResult({query, data, error: ''});})
      .catch(error => {if (!controller.signal.aborted) setResult(previous => ({query,
        data: previous?.query.path === path ? previous.data : null, error: message(error)}));});
    return () => controller.abort();
  }, [query]);
  return {
    data: path && result?.query.path === path ? result.data : null,
    error: path && result?.query === query ? result.error : '',
    loading: !!path && result?.query !== query,
  };
}
