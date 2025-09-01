import { GeometricSymbol } from './GeometricSymbol';

export const Header = () => {
  return (
    <header className="py-8">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="/" className="flex items-center space-x-4 group">
          <GeometricSymbol size="sm" />
          <span className="text-electric text-xl font-mono group-hover:text-highlight transition-electric">INSIDE THE BOX</span>
        </a>
        
        <nav className="hidden md:flex space-x-4">
          <a href="/training" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            Training
          </a>
          <a href="/technical-requirements" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            Methods
          </a>
          <a href="/why" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            About
          </a>
        </nav>
      </div>
    </header>
  );
};