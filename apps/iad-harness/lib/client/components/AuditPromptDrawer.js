import { jsx as _jsx } from "react/jsx-runtime";
import { useResource } from '../useResource.js';
import { PromptDrawer } from './PromptDrawer.js';
export function AuditPromptDrawer({ runId, onClose }) {
    const prompts = useResource(`/audit/jobs/${encodeURIComponent(runId)}/prompts`);
    return _jsx(PromptDrawer, { title: "\u67E5\u770B\u63D0\u793A\u8BCD", systemText: prompts.data?.system_prompt, text: prompts.data?.instruction || prompts.error || '', additionalSections: prompts.data ? [{ title: '报告用户提示词', text: prompts.data.report_instruction }] : [], onClose: onClose });
}
