import { useEffect, useRef } from "react";
import { useWorkspace } from "./workspace.js";

/** Register the same dirty state with workspace navigation and browser unload. */
export function useUnsavedChanges(dirty: boolean) {
  const { workspace } = useWorkspace();
  const current = useRef(dirty); current.current = dirty;
  useEffect(() => workspace.registerLeaveGuard(() => !current.current || window.confirm("有未保存的修改，确认离开并放弃修改？")), [workspace]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty]);
}
