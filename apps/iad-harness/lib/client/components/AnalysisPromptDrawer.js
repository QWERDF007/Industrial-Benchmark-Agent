import { jsx as _jsx } from "react/jsx-runtime";
import { useResource } from '../useResource.js';
import { PromptDrawer } from './PromptDrawer.js';
export function AnalysisPromptDrawer({ jobId, onClose }) {
    const { data, loading, error } = useResource(`/analysis/prompts/${encodeURIComponent(jobId)}`);
    const sections = data?.observer ? [
        { title: '子 Agent 系统提示词', text: data.observer.system_prompt || '本作业未记录系统提示词。' },
        { title: '子 Agent 用户提示词', text: data.observer.user_prompt },
    ] : [];
    return _jsx(PromptDrawer, { title: "\u63A2\u7D22\u63D0\u793A\u8BCD", systemText: data?.main.system_prompt || (!loading && !error ? '本作业未记录系统提示词。' : null), text: data?.main.user_prompt || (loading ? '正在读取提示词…' : error || '本作业未记录提示词正文。'), systemLabel: "\u4E3B Agent \u7CFB\u7EDF\u63D0\u793A\u8BCD", userLabel: "\u4E3B Agent \u7528\u6237\u63D0\u793A\u8BCD", additionalSections: sections, onClose: onClose });
}
