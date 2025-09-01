import { GeometricSymbol } from './GeometricSymbol';

export const Header = () => {
  return (
    <header className="py-8">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="/" className="flex items-center space-x-4 group">
          <GeometricSymbol size="sm" />
          <span className="text-electric text-xl font-mono group-hover:text-highlight transition-electric">INSIDE THE BOX</span>
        </a>
        
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="font-mono text-sm hover:text-primary transition-electric">
            Training
          </a>
          <a href="#" className="font-mono text-sm hover:text-primary transition-electric">
            Methods
          </a>
          <a href="#" className="font-mono text-sm hover:text-primary transition-electric">
            About
          </a>
        </nav>
      </div>
    </header>
  );
};