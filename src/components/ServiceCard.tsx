import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  href?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'highlight';
  children?: ReactNode;
  className?: string;
}

export const ServiceCard = ({ 
  href, 
  title, 
  description, 
  icon: Icon,
  variant = 'primary',
  children,
  className = '' 
}: ServiceCardProps) => {
  const variantClasses = {
    primary: href ? 'bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50' : 'bg-primary/10 border-2 border-primary/30',
    highlight: href ? 'bg-highlight/10 border-2 border-highlight/30 hover:bg-highlight/20 hover:border-highlight/50' : 'bg-highlight/10 border-2 border-highlight/30'
  };

  const titleColor = variant === 'primary' ? 'text-primary' : 'text-highlight';
  const iconColor = variant === 'primary' ? 'text-primary' : 'text-highlight';

  const content = (
    <>
      {Icon && (
        <div className="flex items-start space-x-4">
          <Icon className={`${iconColor} mt-1 flex-shrink-0`} size={28} />
          <div className="flex-1">
            <h3 className={`${titleColor} text-lg font-semibold font-mono mb-3`}>
              {title}
            </h3>
            <p className="text-base sm:text-lg text-foreground/80">
              {description}
            </p>
            {children}
          </div>
        </div>
      )}
      {!Icon && (
        <>
          <h3 className={`${titleColor} text-lg font-semibold font-mono mb-3`}>
            {title}
          </h3>
          <p className="text-base sm:text-lg text-foreground/80">
            {description}
          </p>
          {children}
        </>
      )}
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