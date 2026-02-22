import { Presentation, Users, Flag } from 'lucide-react';

interface MethodIconProps {
  type: 'knowledge' | 'group' | 'cyber';
  title: string;
  description: string;
  className?: string;
}

const iconMap = {
  knowledge: Presentation,
  group: Users,
  cyber: Flag,
};

export const MethodIcon = ({ type, title, description, className = '' }: MethodIconProps) => {
  const Icon = iconMap[type];
  
  return (
    <div className={`bg-highlight/10 border-2 border-highlight/30 rounded-lg h-full flex flex-col justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-3 p-4">
        <Icon size={28} className="text-highlight/80" />
        <h3 className="text-base sm:text-lg font-mono tracking-wide text-center text-highlight/90">
          {title}
        </h3>
        <p className="text-base sm:text-lg text-center text-foreground font-sans leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
};