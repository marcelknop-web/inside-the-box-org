interface TrainingCardProps {
  title: string;
  className?: string;
  onClick?: () => void;
}

export const TrainingCard = ({ title, className = '', onClick }: TrainingCardProps) => {
  return (
    <div 
      className={`
        card-electric cursor-pointer group
        ${className}
      `}
      onClick={onClick}
    >
      <h3 className="text-sm font-mono tracking-wide text-center text-foreground group-hover:text-primary transition-electric">
        {title}
      </h3>
    </div>
  );
};