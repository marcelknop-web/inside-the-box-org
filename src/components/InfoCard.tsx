import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  icon?: LucideIcon;
  children: ReactNode;
  variant?: 'primary' | 'highlight' | 'subtle';
  className?: string;
}

export const InfoCard = ({ 
  icon: Icon, 
  children, 
  variant = 'primary',
  className = '' 
}: InfoCardProps) => {
  const variantClasses = {
    primary: 'bg-primary/10 border-2 border-primary/30',
    highlight: 'bg-highlight/10 border-2 border-highlight/30', 
    subtle: 'bg-primary/5 border border-primary/20'
  };

  const iconColor = variant === 'highlight' ? 'text-highlight' : 'text-primary';

  return (
    <div className={`${variantClasses[variant]} rounded-lg p-6 ${className}`}>
      {Icon && (
        <div className="flex items-start space-x-4">
          <Icon className={`${iconColor} mt-1 flex-shrink-0`} size={28} />
          <div className="flex-1">{children}</div>
        </div>
      )}
      {!Icon && children}
    </div>
  );
};