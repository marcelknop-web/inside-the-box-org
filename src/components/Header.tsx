import { GeometricSymbol } from './GeometricSymbol';

export const Header = () => {
  return (
    <header className="py-8">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="/" className="flex items-center space-x-4 group">
          <GeometricSymbol size="sm" />
          <span className="text-primary text-xl font-mono group-hover:text-highlight transition-electric">inside-the-box.org</span>
        </a>
        
        <nav className="hidden md:flex space-x-4">
          <a href="/why" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            Training
          </a>
          <a href="/consulting" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            Consulting
          </a>
          <a href="/contact" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};