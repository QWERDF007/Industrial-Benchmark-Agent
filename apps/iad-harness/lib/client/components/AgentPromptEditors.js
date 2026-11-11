import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PromptTextEditor({ id, label, value, onChange, disabled = false }) {
    return _jsxs("label", { className: "exp-input", htmlFor: id, children: [label, _jsx("textarea", { className: "f iad-prompt-editor", id: id, "aria-label": label, spellCheck: false, value: value, onChange: event => onChange(event.target.value), disabled: disabled })] });
}
export function AgentPromptEditors({ id, system, user, onSystemChange, onUserChange, disabled = false, agentLabel, children }) {
    return _jsxs("div", { className: "iad-agent-prompts", children: [_jsx(PromptTextEditor, { id: `${id}-system`, label: agentLabel ? `${agentLabel} 系统提示词` : '系统提示词', value: system, onChange: onSystemChange, disabled: disabled }), _jsx(PromptTextEditor, { id: id, label: agentLabel ? `${agentLabel} 用户提示词` : '用户提示词', value: user, onChange: onUserChange, disabled: disabled }), children] });
}
