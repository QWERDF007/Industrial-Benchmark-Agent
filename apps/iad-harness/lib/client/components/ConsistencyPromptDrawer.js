import { jsx as _jsx } from "react/jsx-runtime";
import { identityPromptFields } from '../consistency-prompts.js';
import { PromptDrawer } from './PromptDrawer.js';
export function ConsistencyPromptDrawer({ job, onClose }) {
    return _jsx(PromptDrawer, { title: "\u67E5\u770B\u63D0\u793A\u8BCD", text: job.consistency_prompt || '该作业没有保存提示词。', systemText: job.system_prompt, additionalSections: job.consistency_identity_prompts ? identityPromptFields.map(({ name, label }) => ({ title: label, text: job.consistency_identity_prompts[name] })) : [], onClose: onClose });
}
