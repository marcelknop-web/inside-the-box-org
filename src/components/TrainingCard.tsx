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
        bg-highlight/10 border-2 border-highlight/30 rounded-lg cursor-pointer group h-full flex flex-col justify-center hover:bg-highlight/20 hover:border-highlight/50 transition-electric
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex flex-col items-center space-y-3 p-2">
        <Icon size={32} className="text-highlight/80 group-hover:text-highlight transition-electric" />
        <h3 className="text-sm font-mono tracking-wide text-center text-highlight/90 group-hover:text-highlight transition-electric">
          {title}
        </h3>
      </div>
    </div>
  );
};