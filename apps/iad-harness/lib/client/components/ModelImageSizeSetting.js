import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ModuleNumberSetting } from './ModuleNumberSetting.js';
import { ModuleSelectSetting } from './ModuleSelectSetting.js';
export function ModelImageSizeSetting({ value, onSave, disabled, commitOnChange = false, onValidityChange }) {
    return _jsxs(_Fragment, { children: [_jsx(ModuleSelectSetting, { label: "\u56FE\u50CF\u5927\u5C0F", value: value === null ? 'original' : 'limited', disabled: disabled, options: [{ value: 'original', label: '原图尺寸' }, { value: 'limited', label: '自定义最大边' }], onChange: mode => { onValidityChange?.(true); onSave(mode === 'original' ? null : 2048); } }), value !== null && _jsx(ModuleNumberSetting, { label: "\u6700\u5927\u8FB9\uFF08\u50CF\u7D20\uFF09", value: value, min: 1, step: 1, validationMessage: "\u6700\u5927\u8FB9\u9700\u8981\u4E3A\u6B63\u6574\u6570", onSave: onSave, disabled: disabled, commitOnChange: commitOnChange, onValidityChange: onValidityChange })] });
}
