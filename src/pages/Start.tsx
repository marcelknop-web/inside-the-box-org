import { GeometricSymbol } from '@/components/GeometricSymbol';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

const Start = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-20">
          {/* Left: Geometric Symbol */}
          <div className="mb-12 lg:mb-0 lg:mr-20">
            <GeometricSymbol size="lg" />
          </div>
          
          {/* Right: Hero Content */}
          <div className="flex-1 max-w-4xl">
            <div className="text-center lg:text-left space-y-8">
              <h1 className="text-electric text-6xl lg:text-7xl font-bold font-mono leading-tight animate-fade-in">
                Cyber Training Range
              </h1>
              
              <p className="text-2xl lg:text-3xl text-foreground font-light leading-relaxed animate-fade-in">
                <span className="text-highlight font-semibold">Realistic cybersecurity training</span> in a 
                simulated IT environment
              </p>
              
              <div className="space-y-6 text-lg font-sans leading-relaxed animate-fade-in">
                <p>
                  Train your teams to handle <span className="text-highlight font-semibold">real cyber attacks</span> in a safe, 
                  controlled environment. Our cyber training range provides hands-on experience with 
                  <span className="text-highlight font-semibold">incident response, threat detection, and crisis management</span>.
                </p>
                
                <p>
                  Developed for organizations that need to prepare their cybersecurity teams for 
                  the complexity and dynamics of modern cyber threats.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-8 animate-fade-in">
                <Button 
                  asChild
                  className="button-electric hover-scale"
                >
                  <a href="/why">
                    Why Train?
                  </a>
                </Button>
                
                <Button 
                  variant="outline" 
                  asChild
                  className="border-electric text-foreground hover:bg-primary/10 hover-scale"
                >
                  <a href="/training">
                    What We Offer
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="border-t border-border pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="card-electric text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-gradient-electric rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-electric">Realistic Scenarios</h3>
              <p className="text-sm text-muted-foreground">
                Train with actual attack patterns and methodologies used by real threat actors
              </p>
            </div>
            
            <div className="card-electric text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-gradient-electric rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-electric">Safe Environment</h3>
              <p className="text-sm text-muted-foreground">
                Practice incident response without risk to your production systems
              </p>
            </div>
            
            <div className="card-electric text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-gradient-electric rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">👥</span>
              </div>
              <h3 className="text-xl font-bold text-electric">Team Coordination</h3>
              <p className="text-sm text-muted-foreground">
                Learn to work effectively across technical and management teams during incidents
              </p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 pt-8 border-t border-border">
            <a 
              href="/technical-requirements" 
              className="story-link text-electric font-mono text-lg hover:text-primary/80 transition-electric"
            >
              Technical Requirements
            </a>
            <span className="hidden md:block text-muted-foreground">•</span>
            <a 
              href="/training" 
              className="story-link text-electric font-mono text-lg hover:text-primary/80 transition-electric"
            >
              Training Topics
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Start;