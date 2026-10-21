import { useEffect, useMemo, useState } from "react";
import type { KnowledgeQuery, KnowledgeSnapshot } from "../shared/contracts.js";
import { message, request } from "./api.js";

const empty: KnowledgeQuery = { knowledge: null, versions: [], freshness: null, eligible_source_count: 0, unavailable_source_count: 0 };

/** A response belongs to one dataset, kind and version; pending queries never expose another selection. */
export function useKnowledge(datasetId: string, kind: KnowledgeSnapshot["kind"] | null, versionId = "", revision = 0) {
  const queryIdentity = useMemo(() => ({ scope: JSON.stringify([datasetId, kind, versionId]), revision }), [datasetId, kind, versionId, revision]);
  const [value, setValue] = useState<{ query: typeof queryIdentity; data: KnowledgeQuery; error: string }>();
  useEffect(() => {
    if (!datasetId || !kind) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ dataset_id: datasetId, kind, ...(versionId ? { version_id: versionId } : {}) });
    request<KnowledgeQuery>(`/knowledge?${query}`, undefined, undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setValue({ query: queryIdentity, data, error: "" }); })
      .catch(error => { if (!controller.signal.aborted) setValue(previous => ({ query: queryIdentity, data: previous?.query.scope === queryIdentity.scope ? previous.data : empty, error: message(error) })); });
    return () => controller.abort();
  }, [queryIdentity]);
  if (!datasetId || !kind) return { ...empty, loading: false, error: "" };
  const data = value?.query.scope === queryIdentity.scope ? value.data : empty;
  return { ...data, loading: value?.query !== queryIdentity, error: value?.query === queryIdentity ? value.error : "" };
}
