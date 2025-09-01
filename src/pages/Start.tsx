import { GeometricSymbol } from '@/components/GeometricSymbol';

const Start = () => {
  return (
    <div className="min-h-screen">
      {/* Header with consistent styling */}
      <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="/" className="group">
            <span className="text-primary text-xl font-mono group-hover:text-highlight transition-electric">INSIDE THE BOX</span>
          </a>
          <nav className="hidden md:flex space-x-4">
            <a href="/training" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
              Training
            </a>
            <a href="/by-whom" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
              About
            </a>
            <a href="/contact" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
              Contact
            </a>
          </nav>
        </div>
      </header>
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-20">
          {/* Left: Geometric Symbol */}
          <div className="mb-12 lg:mb-0 lg:mr-20">
            <GeometricSymbol size="lg" />
          </div>
          
          {/* Right: Main Options */}
          <div className="flex-1 max-w-4xl">
            <div className="text-center lg:text-left space-y-12">
              <div className="space-y-8">
                <a 
                  href="/why" 
                  className="block group"
                >
                  <h1 className="text-highlight text-3xl sm:text-4xl lg:text-6xl font-bold font-mono leading-tight hover:text-primary transition-electric">
                    Cyber Training Range
                  </h1>
                </a>
                
                <a 
                  href="/consulting" 
                  className="block group"
                >
                  <h2 className="text-primary text-3xl sm:text-4xl lg:text-6xl font-bold font-mono leading-tight hover:text-highlight transition-electric">
                    Cybersecurity Consulting
                  </h2>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;