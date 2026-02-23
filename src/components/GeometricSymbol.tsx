interface GeometricSymbolProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const GeometricSymbol = ({ size = 'lg', className = '' }: GeometricSymbolProps) => {
  if (size === 'xs') {
    // Crisp tiny version matching the large symbol's design precisely
    return (
      <svg width="24" height="24" viewBox="0 0 192 192" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Vertical bar (w-6 = 24px centered in 192) */}
        <rect x="84" y="0" width="24" height="192" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
        {/* Horizontal bar */}
        <rect x="0" y="84" width="192" height="24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
        {/* Top diamond (w-16=64px, top-2=8px offset, centered) */}
        <rect x="96" y="8" width="45" height="45" transform="rotate(45 96 8)" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8" />
        {/* Bottom diamond */}
        <rect x="96" y="120" width="45" height="45" transform="rotate(45 96 120)" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8" />
        {/* Left diamond */}
        <rect x="8" y="96" width="45" height="45" transform="rotate(45 8 96)" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8" />
        {/* Right diamond */}
        <rect x="120" y="96" width="45" height="45" transform="rotate(45 120 96)" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8" />
        {/* Center diamond (inset-1/4 = 48px from each side, so 96x96 centered) */}
        <rect x="96" y="48" width="68" height="68" transform="rotate(45 96 48)" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* Inner diamond (inset-1/3 = 64px) */}
        <rect x="96" y="64" width="45" height="45" transform="rotate(45 96 64)" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
        {/* Innermost fill (inset-2/5 ~77px) */}
        <rect x="96" y="77" width="27" height="27" transform="rotate(45 96 77)" fill="currentColor" opacity="0.1" />
      </svg>
    );
  }

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