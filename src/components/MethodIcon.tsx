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
    <div className="flex">
      <div className={`bg-highlight/10 border-2 border-highlight/30 rounded-lg h-full flex flex-col justify-center flex-1 p-6 ${className}`}>
        <div className="flex flex-col items-center space-y-3 p-4">
          <Icon size={28} className="text-highlight/80" />
          <span className="text-base sm:text-lg font-mono text-highlight/90 text-center">
            {title}
          </span>
          <p className="text-base sm:text-lg text-center text-foreground/70 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};