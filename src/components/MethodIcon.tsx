import { Presentation, Users, Flag } from 'lucide-react';

interface MethodIconProps {
  type: 'knowledge' | 'group' | 'cyber';
  title: string;
  className?: string;
}

const iconMap = {
  knowledge: Presentation,
  group: Users,
  cyber: Flag,
};

export const MethodIcon = ({ type, title, className = '' }: MethodIconProps) => {
  const Icon = iconMap[type];
  
  return (
    <div className="flex">
      <div className={`bg-highlight/10 border-2 border-highlight/30 rounded-lg cursor-pointer group h-full flex flex-col justify-center flex-1 p-6 hover:bg-highlight/20 hover:border-highlight/50 transition-electric ${className}`}>
        <div className="flex flex-col items-center space-y-3 p-2">
          <Icon size={32} className="text-highlight/80 group-hover:text-highlight transition-electric" />
          <span className="text-sm font-mono text-highlight/90 group-hover:text-highlight transition-electric text-center">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};