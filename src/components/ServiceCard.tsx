import { ReactNode } from 'react';

interface ServiceCardProps {
  href?: string;
  title: string;
  description: string;
  variant?: 'primary' | 'highlight';
  children?: ReactNode;
  className?: string;
}

export const ServiceCard = ({ 
  href, 
  title, 
  description, 
  variant = 'primary',
  children,
  className = '' 
}: ServiceCardProps) => {
  const variantClasses = {
    primary: 'bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50',
    highlight: 'bg-highlight/10 border-2 border-highlight/30 hover:bg-highlight/20 hover:border-highlight/50'
  };

  const titleColor = variant === 'primary' ? 'text-primary' : 'text-highlight';

  const content = (
    <>
      <h3 className={`${titleColor} text-lg font-semibold font-mono mb-3`}>
        {title}
      </h3>
      <p className="text-base sm:text-lg text-foreground/80">
        {description}
      </p>
      {children}
    </>
  );

  const baseClasses = `${variantClasses[variant]} rounded-lg p-6 transition-electric ${className}`;

  if (href) {
    return (
      <a href={href} className={`${baseClasses} block`}>
        {content}
      </a>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
};