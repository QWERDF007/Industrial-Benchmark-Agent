import React from 'react';
import {IconButton,type IconButtonProps} from './IconButton.js';

type FilterButtonProps=Omit<IconButtonProps,'icon'|'label'> & {
  ariaLabel?:string;
  [key:`data-${string}`]:string|undefined;
};

export function ClearFilterButton({ariaLabel='清除筛选条件',title='清除筛选条件',className='',...props}:FilterButtonProps) {
  return <IconButton {...props} icon="clear" label={ariaLabel} title={title} className={`iad-filter-action iba-filter-clear ${className}`} />;
}

export function RefreshIconButton({ariaLabel='刷新当前页面',title='刷新当前页面',className='',...props}:FilterButtonProps) {
  return <IconButton {...props} icon="refresh" label={ariaLabel} title={title} className={`iad-filter-action iba-refresh-icon ${className}`} />;
}
