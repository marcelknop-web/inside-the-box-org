import { ReactNode } from 'react';

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'highlight';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LinkButton = ({ 
  href, 
  children, 
  variant = 'primary', 
  size = 'lg',
  className = '' 
}: LinkButtonProps) => {
  const sizeClasses = {
    sm: 'text-base sm:text-lg px-4 py-2',
    md: 'text-base sm:text-lg px-6 py-3',
    lg: 'text-lg px-6 py-3'
  };

  const variantClasses = {
    primary: 'bg-primary/10 border-2 border-primary/30 text-primary hover:text-highlight hover:bg-primary/20 hover:border-primary/50',
    highlight: 'bg-highlight/10 border-2 border-highlight/30 text-highlight hover:text-primary hover:bg-highlight/20 hover:border-highlight/50'
  };

  return (
    <a 
      href={href}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-lg font-mono transition-electric inline-block
        ${className}
      `}
    >
      {children}
    </a>
  );
};