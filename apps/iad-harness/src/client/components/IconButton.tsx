import React, {forwardRef} from 'react';

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {label: string};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {label, title = label, type = 'button', className = '', ...props}, ref,
) {
  return <button {...props} ref={ref} type={type} aria-label={label} title={title} className={`iad-icon-button ${className}`} />;
});
