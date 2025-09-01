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
      {/* Outer diamond */}
      <div className="absolute inset-0 border-2 border-primary/60 rotate-45 rounded-lg animate-glow" />
      
      {/* Second layer */}
      <div className="absolute inset-4 border-2 border-primary/80 rotate-45 rounded-lg" />
      
      {/* Third layer */}
      <div className="absolute inset-8 border-2 border-primary rotate-45 rounded-lg" />
      
      {/* Inner core */}
      <div className="absolute inset-12 bg-primary/20 rotate-45 rounded-lg" />
      
      {/* Central dot */}
      <div className="w-2 h-2 bg-primary rounded-full z-10 animate-pulse" />
    </div>
  );
};