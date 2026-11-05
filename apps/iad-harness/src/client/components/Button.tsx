import React, {forwardRef} from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'secondary' | 'primary' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {variant = 'secondary', type = 'button', className = '', ...props}, ref,
) {
  return <button {...props} ref={ref} type={type} data-variant={variant}
    className={['iad-button', className].filter(Boolean).join(' ')} />;
});
