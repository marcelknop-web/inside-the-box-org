import { GeometricSymbol } from './GeometricSymbol';

export const Header = () => {
  return (
    <header className="py-8">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <GeometricSymbol size="sm" />
          <span className="text-electric text-xl font-mono">INSIDE THE BOX</span>
        </div>
        
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