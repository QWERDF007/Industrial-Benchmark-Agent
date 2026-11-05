import React, {forwardRef} from 'react';
import {CloseIcon,DeleteIcon,RefreshIcon,ClearFilterIcon,EditIcon,CopyIcon,PlusIcon,ChevronIcon,
  DocumentIcon,DocumentSearchIcon,MineIcon,StatsIcon,EyeIcon,EyeOffIcon,ZoomInIcon,ZoomOutIcon,FitIcon,ExpandIcon} from '../AuditIcon.js';

const icons={close:CloseIcon,delete:DeleteIcon,refresh:RefreshIcon,clear:ClearFilterIcon,edit:EditIcon,copy:CopyIcon,
  add:PlusIcon,chevron:ChevronIcon,prompt:DocumentIcon,details:DocumentSearchIcon,mine:MineIcon,stats:StatsIcon,
  annotations:EyeIcon,annotationsOff:EyeOffIcon,zoomIn:ZoomInIcon,zoomOut:ZoomOutIcon,fit:FitIcon,expand:ExpandIcon};
export type IconName=keyof typeof icons;
export type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'|'children'> & {label:string;icon:IconName};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {icon,label, title = label, type = 'button', className = '', ...props}, ref,
) {
  const Icon=icons[icon];
  return <button {...props} ref={ref} type={type} aria-label={label} title={title} data-icon={icon}
    className={`iad-icon-button ${className}`.trim()}><Icon /></button>;
});
