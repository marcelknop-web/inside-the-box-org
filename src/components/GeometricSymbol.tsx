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
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}>
      {/* Cross/Plus pattern with nested diamonds */}
      
      {/* Vertical bar */}
      <div className="absolute w-6 h-full border-l-2 border-r-2 border-primary/60" />
      
      {/* Horizontal bar */}
      <div className="absolute w-full h-6 border-t-2 border-b-2 border-primary/60" />
      
      {/* Top diamond */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
      
      {/* Bottom diamond */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
      
      {/* Left diamond */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
      
      {/* Right diamond */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-16 h-16 border-2 border-primary/80 rotate-45" />
      
      {/* Center diamond */}
      <div className="absolute inset-1/4 border-2 border-primary rotate-45" />
      
      {/* Inner nested squares */}
      <div className="absolute inset-1/3 border-2 border-primary/60 rotate-45" />
      <div className="absolute inset-2/5 bg-primary/10 rotate-45" />
    </div>
  );
};