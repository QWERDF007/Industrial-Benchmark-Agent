import { useLayoutEffect, useRef } from "react";
import { useWorkspace } from "./workspace.js";

/** Restore only after the current query is rendered, before listening for user scroll. */
export function usePagePosition(source: string | null, ready: boolean) {
  const { workspace } = useWorkspace();
  const surface = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = surface.current;
    if (!source || !ready || !element) return;
    element.scrollTop = workspace.pagePosition(source);
    const remember = () => workspace.rememberPagePosition(source, element.scrollTop);
    element.addEventListener("scroll", remember, { passive: true });
    return () => element.removeEventListener("scroll", remember);
  }, [workspace, source, ready]);
  return surface;
}
