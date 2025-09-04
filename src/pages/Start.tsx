import { GeometricSymbol } from '@/components/GeometricSymbol';
import { Footer } from '@/components/Footer';
import { Target, Shield, Users, Globe, Award } from 'lucide-react';

const Start = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with consistent styling */}
      <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-center md:justify-between">
          <a href="/" className="w-full md:w-auto flex items-center justify-center md:justify-start group">
            <span className="text-primary text-xl font-mono group-hover:text-highlight transition-electric whitespace-nowrap text-center">inside-the-box.org</span>
          </a>
          <nav className="hidden md:flex space-x-4">
            <a href="/why" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
              Training
            </a>
            <a href="/consulting" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
              Consulting
            </a>
            <a href="/by-whom" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
              By Whom
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

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-6 text-center">
              <Target className="text-cyan-400 mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">40+</div>
              <div className="text-foreground/80 font-sans">Trainings Conducted</div>
            </div>
            <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-6 text-center">
              <Users className="text-cyan-400 mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">150+</div>
              <div className="text-foreground/80 font-sans">Participants</div>
            </div>
            <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-6 text-center">
              <Globe className="text-cyan-400 mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">4</div>
              <div className="text-foreground/80 font-sans">Countries</div>
            </div>
          </div>
          
          {/* Main Options */}
          <div className="w-full max-w-3xl space-y-8">
            <a 
              href="/why" 
              className="block group"
            >
              <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-electric px-6 py-4 flex items-center justify-center space-x-4">
                <Target size={32} className="flex-shrink-0" />
                <span>Cyber Training Range</span>
              </div>
            </a>
            
            <a 
              href="/consulting" 
              className="block group"
            >
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-4 flex items-center justify-center space-x-4">
                <Shield size={32} className="flex-shrink-0" />
                <span>Cybersecurity Consulting</span>
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