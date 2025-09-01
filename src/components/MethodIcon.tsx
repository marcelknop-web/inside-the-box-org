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
    <div className={`flex flex-col items-center space-y-3 group ${className}`}>
      <div className="p-6 border-electric rounded-lg group-hover:bg-primary/5 transition-electric">
        <Icon size={48} className="text-muted-foreground group-hover:text-primary transition-electric" />
      </div>
      <span className="text-sm font-mono text-muted-foreground group-hover:text-primary transition-electric text-center">
        {title}
      </span>
    </div>
  );
};