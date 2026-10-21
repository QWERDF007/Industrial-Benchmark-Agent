import { useEffect, useState } from "react";
import type { FolderPreview, FolderRule } from "../shared/contracts.js";
import { message, request } from "./api.js";

export function useFolderPreview(root: string, rules: FolderRule[] | undefined, enabled: boolean) {
  const key = JSON.stringify({ root, rules });
  const [result, setResult] = useState<{ key: string; root: string; preview: FolderPreview | null; error: string }>();
  useEffect(() => {
    if (!enabled || !root.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void request<FolderPreview>("/datasets/preview", { root_dir: root, rules }, "POST", controller.signal)
        .then(preview => { if (!controller.signal.aborted) setResult({ key, root, preview, error: "" }); })
        .catch(error => { if (!controller.signal.aborted) setResult({ key, root, preview: null, error: message(error) }); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, enabled]);
  const preview = enabled && result?.root === root ? result.preview : null;
  const pending = enabled && Boolean(root.trim()) && result?.key !== key;
  return { preview, pending, error: result?.key === key ? result.error : "",
    ready: !pending && preview !== null && preview.conflicts.length === 0 && preview.total_images > 0 };
}
