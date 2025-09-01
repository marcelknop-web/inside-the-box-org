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
      <div className={`card-electric cursor-pointer group h-full flex flex-col justify-center flex-1 ${className}`}>
        <div className="flex flex-col items-center space-y-3 p-2">
          <Icon size={32} className="text-muted-foreground group-hover:text-primary transition-electric" />
          <span className="text-sm font-mono text-muted-foreground group-hover:text-primary transition-electric text-center">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};