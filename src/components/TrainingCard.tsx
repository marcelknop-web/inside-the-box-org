import { LucideIcon } from 'lucide-react';

interface TrainingCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  onClick?: () => void;
}

export const TrainingCard = ({ title, description, icon: Icon, className = '', onClick }: TrainingCardProps) => {
  return (
    <div 
      className={`
        bg-primary/10 border-2 border-primary/30 rounded-lg cursor-pointer group h-full flex flex-col justify-center hover:bg-primary/20 hover:border-primary/50 transition-electric
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col items-center space-y-3 p-4">
        <Icon size={28} className="text-primary/80 group-hover:text-primary transition-electric" />
        <h3 className="text-sm font-mono tracking-wide text-center text-primary/90 group-hover:text-primary transition-electric">
          {title}
        </h3>
        <p className="text-xs text-center text-foreground/70 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};