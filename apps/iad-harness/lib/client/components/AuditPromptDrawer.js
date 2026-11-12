import { jsx as _jsx } from "react/jsx-runtime";
import { useResource } from '../useResource.js';
import { PromptDrawer } from './PromptDrawer.js';
export function AuditPromptDrawer({ runId, onClose }) {
    const prompts = useResource(`/audit/jobs/${encodeURIComponent(runId)}/prompts`);
    const sections = prompts.data?.sections || [];
    return _jsx(PromptDrawer, { title: "\u67E5\u770B\u63D0\u793A\u8BCD", systemText: sections[0]?.text, text: sections[1]?.text || prompts.error || '', systemLabel: sections[0]?.title, userLabel: sections[1]?.title, additionalSections: sections.slice(2), onClose: onClose });
}
