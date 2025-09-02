import { GeometricSymbol } from '@/components/GeometricSymbol';
import { Footer } from '@/components/Footer';

const Start = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with consistent styling */}
      <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="/" className="group">
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
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="flex flex-col items-center justify-center text-center space-y-12">
          {/* Geometric Symbol */}
          <div>
            <GeometricSymbol size="lg" />
          </div>
          
          {/* Main Options */}
          <div className="w-full max-w-6xl space-y-8">
            <a 
              href="/why" 
              className="block group"
            >
              <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-electric px-6 py-4">
                Cyber Training Range
              </div>
            </a>
            
            <a 
              href="/consulting" 
              className="block group"
            >
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-4">
                Cybersecurity Consulting
              </div>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Start;