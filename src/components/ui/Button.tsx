import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  className?: string;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-life-teal to-teal-500 hover:from-teal-500 hover:to-life-teal text-white shadow-lg hover:shadow-life-teal/20',
    secondary: 'bg-white/[0.03] hover:bg-white/[0.07] border border-life-line hover:border-life-line-strong text-life-text',
    danger: 'bg-gradient-to-r from-life-rose to-rose-500 hover:from-rose-500 hover:to-life-rose text-white shadow-lg hover:shadow-life-rose/20',
  };

  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3 rounded-md gap-1.5',
    md: 'text-sm py-2 px-4 rounded-lg gap-2',
    lg: 'text-base py-2.5 px-5 rounded-xl gap-2.5',
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
}
