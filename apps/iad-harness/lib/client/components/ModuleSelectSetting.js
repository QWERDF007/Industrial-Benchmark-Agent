import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { ModuleSettingRow } from './ModuleSettingRow.js';
import { ModuleSelectButton } from './ModuleSelectButton.js';
export function ModuleSelectSetting({ label, controlLabel, value, options, onChange, disabled, hint }) {
    const [open, setOpen] = useState(false);
    useEffect(() => { if (disabled)
        setOpen(false); }, [disabled]);
    const selected = options.find(option => option.value === value);
    return _jsx(ModuleSettingRow, { label: label, controlLabel: controlLabel, hint: hint, children: props => _jsx(Menu, { open: open, onClose: () => setOpen(false), align: "end", portal: true, selectedId: value, items: options.map(option => ({ id: option.value, label: option.label, disabled: option.disabled })), onSelect: id => { const option = options.find(option => option.value === id); setOpen(false); if (option && option.value !== value)
                onChange(option.value); }, anchor: _jsx(ModuleSelectButton, { ...props, disabled: disabled, open: open, onClick: () => setOpen(!open), children: selected?.label ?? '请选择' }) }) });
}
