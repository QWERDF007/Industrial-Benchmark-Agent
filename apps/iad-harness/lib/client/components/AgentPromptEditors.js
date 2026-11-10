import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PromptTextEditor({ id, label, value, onChange, disabled = false }) {
    return _jsxs("label", { className: "exp-input", htmlFor: id, children: [label, _jsx("textarea", { className: "f iad-prompt-editor", id: id, "aria-label": label, spellCheck: false, value: value, onChange: event => onChange(event.target.value), disabled: disabled })] });
}
export function AgentPromptEditors({ id, system, user, onSystemChange, onUserChange, disabled = false, children }) {
    return _jsxs("div", { className: "iad-agent-prompts", children: [_jsx(PromptTextEditor, { id: `${id}-system`, label: "\u7CFB\u7EDF\u63D0\u793A\u8BCD", value: system, onChange: onSystemChange, disabled: disabled }), _jsx(PromptTextEditor, { id: id, label: "\u7528\u6237\u63D0\u793A\u8BCD", value: user, onChange: onUserChange, disabled: disabled }), children] });
}
