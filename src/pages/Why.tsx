import { GeometricSymbol } from '@/components/GeometricSymbol';
import { Header } from '@/components/Header';

const Why = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-start justify-between">
          {/* Left: Geometric Symbol */}
          <div className="mb-12 lg:mb-0 lg:mr-20">
            <GeometricSymbol size="lg" />
          </div>
          
          {/* Right: Content */}
          <div className="flex-1 max-w-3xl">
            <h1 className="text-electric text-5xl font-bold font-mono mb-12">
              Why?
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg">
                Analyses of past cybersecurity incidents repeatedly show that human error is the most common 
                cause of delays and serious mistakes in dealing with such events. In order to be better prepared for 
                the dynamics and complexity of such rare situations, we have created realistic training in a simulated 
                IT environment ("Cyber Training Range").
              </p>
              
              <p className="text-lg">
                During the training, participants are introduced to key technologies and techniques for detecting 
                and remediating cyber attacks. This knowledge is then practiced by analyzing and defending against 
                simulated live attacks. Within the cyber training range, participants can safely practice various 
                defense and remediation tactics.
              </p>
              
              <p className="text-lg">
                In addition, participants gain experience in interdisciplinary cooperation with corporate 
                management and communication, specialist departments and third parties. The training includes 
                technical elements as well as elements of incident, emergency and crisis management.
              </p>
              
              <div className="pt-8">
                <a 
                  href="/training" 
                  className="text-electric font-mono text-lg underline hover:text-primary/80 transition-electric"
                >
                  What?
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Why;