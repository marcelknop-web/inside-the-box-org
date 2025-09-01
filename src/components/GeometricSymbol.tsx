interface GeometricSymbolProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GeometricSymbol = ({ size = 'lg', className = '' }: GeometricSymbolProps) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32', 
    lg: 'w-48 h-48'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center animate-pulse-slow`}>
      {/* Cross/Plus pattern with nested diamonds - matching original */}
      
      {/* Vertical bar with glow */}
      <div className="absolute w-6 h-full border-l-2 border-r-2 border-primary/60 animate-glow-slow" />
      
      {/* Horizontal bar with glow */}
      <div className="absolute w-full h-6 border-t-2 border-b-2 border-primary/60 animate-glow-slow" />
      
      {/* Top diamond with enhanced glow */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-primary/80 rotate-45 animate-glow-slow" />
      
      {/* Bottom diamond with enhanced glow */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-primary/80 rotate-45 animate-glow-slow" />
      
      {/* Left diamond with enhanced glow */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 border-primary/80 rotate-45 animate-glow-slow" />
      
      {/* Right diamond with enhanced glow */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 border-primary/80 rotate-45 animate-glow-slow" />
      
      {/* Center diamond with subtle glow */}
      <div className="absolute inset-1/4 border-2 border-primary rotate-45 animate-glow-slow" style={{
        boxShadow: '0 0 3px hsl(var(--primary) / 0.2)'
      }} />
      
      {/* Inner nested squares with subtle glow */}
      <div className="absolute inset-1/3 border-2 border-primary/60 rotate-45 animate-glow-slow" />
      <div className="absolute inset-2/5 bg-primary/10 rotate-45" />
    </div>
  );
};