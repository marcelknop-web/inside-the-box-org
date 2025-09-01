import { LucideIcon } from 'lucide-react';

interface TrainingCardProps {
  title: string;
  icon: LucideIcon;
  className?: string;
  onClick?: () => void;
}

export const TrainingCard = ({ title, icon: Icon, className = '', onClick }: TrainingCardProps) => {
  return (
    <div 
      className={`
        card-electric cursor-pointer group
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col items-center space-y-3">
        <Icon size={32} className="text-primary/60 group-hover:text-primary transition-electric" />
        <h3 className="text-sm font-mono tracking-wide text-center text-foreground group-hover:text-primary transition-electric">
          {title}
        </h3>
      </div>
    </div>
  );
};