import { useEffect, useState } from "react";
import type { KnowledgeQuery, KnowledgeSnapshot } from "../shared/contracts.js";
import { message, request } from "./api.js";

const empty: KnowledgeQuery = { knowledge: null, versions: [] };

/** A response belongs to one dataset, kind and version; pending queries never expose another selection. */
export function useKnowledge(datasetId: string, kind: KnowledgeSnapshot["kind"] | null, versionId = "", revision = 0) {
  const key = JSON.stringify([datasetId, kind, versionId, revision]);
  const [value, setValue] = useState<{ key: string; data: KnowledgeQuery; error: string }>();
  useEffect(() => {
    if (!datasetId || !kind) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ dataset_id: datasetId, kind, ...(versionId ? { version_id: versionId } : {}) });
    request<KnowledgeQuery>(`/knowledge?${query}`, undefined, undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setValue({ key, data, error: "" }); })
      .catch(error => { if (!controller.signal.aborted) setValue({ key, data: empty, error: message(error) }); });
    return () => controller.abort();
  }, [datasetId, kind, versionId, revision]);
  if (!datasetId || !kind) return { ...empty, loading: false, error: "" };
  return value?.key === key ? { ...value.data, loading: false, error: value.error } : { ...empty, loading: true, error: "" };
}
