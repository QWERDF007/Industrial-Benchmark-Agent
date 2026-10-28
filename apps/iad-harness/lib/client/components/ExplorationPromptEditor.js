import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
export function ExplorationPromptEditor({ presets, value, base, disabled, onChange, onCreated, }) {
    const [replace, setReplace] = useState(null);
    const [saving, setSaving] = useState(false), [dialog, setDialog] = useState(false), [name, setName] = useState(""), [error, setError] = useState("");
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const modified = value.text !== base;
    function choose(preset) {
        onChange({ preset_id: preset.id, preset_name: preset.name, text: preset.text }, preset.text);
    }
    function confirm(preset) {
        if (modified)
            setReplace(preset);
        else
            choose(preset);
    }
    async function save() {
        setSaving(true);
        setError("");
        try {
            const preset = await request("/exploration/presets", { name, text: value.text });
            if (alive.current) {
                onCreated(preset);
                choose(preset);
                setDialog(false);
            }
        }
        catch (error) {
            if (alive.current)
                setError(message(error));
        }
        finally {
            if (alive.current)
                setSaving(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-prompt-controls", children: [_jsxs("label", { className: "iad-field", children: ["\u63D0\u793A\u8BCD\u9884\u8BBE", _jsxs("select", { "aria-label": "\u63D0\u793A\u8BCD\u9884\u8BBE", disabled: disabled, value: value.preset_id || "", onChange: (event) => {
                                    const preset = presets.find((item) => item.id === event.target.value);
                                    if (preset)
                                        confirm(preset);
                                }, children: [!presets.some((item) => item.id === value.preset_id) && (_jsx("option", { value: value.preset_id || "", children: value.preset_name || "自定义提示词" })), presets.map((preset) => (_jsx("option", { value: preset.id, children: preset.name }, preset.id)))] })] }), _jsx("span", { className: "iad-muted", children: modified ? "已修改" : "使用预设内容" }), _jsx("button", { disabled: disabled ||
                            !modified ||
                            !presets.some((p) => p.id === value.preset_id), onClick: () => confirm(presets.find((p) => p.id === value.preset_id)), children: "\u91CD\u7F6E\u4E3A\u9884\u8BBE" }), _jsx("button", { disabled: disabled || !value.text.trim(), onClick: () => {
                            setName("");
                            setError("");
                            setDialog(true);
                        }, children: "\u53E6\u5B58\u4E3A\u65B0\u9884\u8BBE" })] }), _jsxs("label", { className: "iad-field", children: ["\u63D0\u793A\u8BCD\u6B63\u6587", _jsx("textarea", { "aria-label": "\u63D0\u793A\u8BCD\u6B63\u6587", rows: 8, disabled: disabled, value: value.text, onChange: (event) => onChange({ ...value, text: event.target.value }, base) })] }), replace && (_jsxs(Modal, { title: "\u66FF\u6362\u5F53\u524D\u63D0\u793A\u8BCD\uFF1F", onClose: () => setReplace(null), className: "iad-confirm-dialog", children: [_jsx("p", { children: "\u5F53\u524D\u6B63\u6587\u5DF2\u4FEE\u6539\u3002\u66FF\u6362\u6B63\u6587\u4F1A\u4FDD\u7559\u8865\u5145\u76EE\u6807\u548C\u4E24\u7EC4\u56FE\u50CF\u3002" }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { onClick: () => setReplace(null), children: "\u4FDD\u7559\u5F53\u524D\u7F16\u8F91" }), _jsx("button", { className: "iad-primary", onClick: () => {
                                    choose(replace);
                                    setReplace(null);
                                }, children: "\u66FF\u6362\u4E3A\u6240\u9009\u9884\u8BBE" })] })] })), dialog && (_jsxs(Modal, { title: "\u4FDD\u5B58\u63D0\u793A\u8BCD\u9884\u8BBE", onClose: () => {
                    if (!saving)
                        setDialog(false);
                }, className: "iad-confirm-dialog", children: [_jsxs("label", { className: "iad-field", children: ["\u9884\u8BBE\u540D\u79F0", _jsx("input", { "aria-label": "\u9884\u8BBE\u540D\u79F0", value: name, disabled: saving, onChange: (event) => setName(event.target.value) })] }), error && _jsx("p", { role: "alert", children: error }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { disabled: saving, onClick: () => setDialog(false), children: "\u53D6\u6D88" }), _jsx("button", { disabled: saving || !name.trim() || !value.text.trim(), className: "iad-primary", onClick: () => void save(), children: saving ? "保存中…" : "保存预设" })] })] }))] }));
}
