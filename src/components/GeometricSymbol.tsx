interface GeometricSymbolProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  hoverCyan?: boolean;
}

export const GeometricSymbol = ({ size = 'lg', className = '', hoverCyan = false }: GeometricSymbolProps) => {
  const borderBase = hoverCyan ? 'border-primary/60 group-hover/welcome:border-highlight/60 transition-colors' : 'border-primary/60';
  const border80 = hoverCyan ? 'border-primary/80 group-hover/welcome:border-highlight/80 transition-colors' : 'border-primary/80';
  const borderFull = hoverCyan ? 'border-primary group-hover/welcome:border-highlight transition-colors' : 'border-primary';
  const bgFill = hoverCyan ? 'bg-primary/10 group-hover/welcome:bg-highlight/10 transition-colors' : 'bg-primary/10';
  if (size === 'xs') {
    // Render the full symbol at native size inside a scaled-down container
    return (
      <div className={`w-6 h-6 flex-shrink-0 ${className}`} style={{ overflow: 'hidden' }}>
        <div style={{ width: 96, height: 96, transform: 'scale(0.25)', transformOrigin: 'top left' }}>
          <div className="w-24 h-24 relative flex items-center justify-center">
            <div className="absolute w-6 h-full border-l-2 border-r-2 border-primary/60" />
            <div className="absolute w-full h-6 border-t-2 border-b-2 border-primary/60" />
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
            <div className="absolute inset-1/4 border-2 border-primary rotate-45" />
            <div className="absolute inset-1/3 border-2 border-primary/60 rotate-45" />
            <div className="absolute inset-2/5 bg-primary/10 rotate-45" />
          </div>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32', 
    lg: 'w-48 h-48'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}>
      <div className={`absolute w-6 h-full border-l-2 border-r-2 ${borderBase}`} />
      <div className={`absolute w-full h-6 border-t-2 border-b-2 ${borderBase}`} />
      <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 ${border80} rotate-45`} />
      <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 ${border80} rotate-45`} />
      <div className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 ${border80} rotate-45`} />
      <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 ${border80} rotate-45`} />
      <div className={`absolute inset-1/4 border-2 ${borderFull} rotate-45`} />
      <div className={`absolute inset-1/3 border-2 ${borderBase} rotate-45`} />
      <div className={`absolute inset-2/5 ${bgFill} rotate-45`} />
    </div>
  );
};