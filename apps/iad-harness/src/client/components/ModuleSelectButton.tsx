import React from 'react';
import {IconChevronDownOutlineRegular} from '@deepseek-ai/dsh-client-ui-primitives';
import type {SettingControlProps} from './ModuleSettingRow.js';

export function ModuleSelectButton({children,open,disabled,onClick,...control}:SettingControlProps&{
  children:React.ReactNode;open:boolean;disabled?:boolean;onClick():void;
}) {
  return <button {...control} type="button" className="iad-module-selector" disabled={disabled}
    aria-haspopup="menu" aria-expanded={open} onClick={onClick}>
    <span>{children}</span><IconChevronDownOutlineRegular/>
  </button>;
}
