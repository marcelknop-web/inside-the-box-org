import { GeometricSymbol } from '@/components/GeometricSymbol';
import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { Header } from '@/components/Header';

const Index = () => {
  const trainingTopics = [
    'Host and Network Forensics',
    'Crises Management', 
    'Malware Analysis',
    'SIEM',
    'Incident Management',
    'Crises Communication'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-20">
          {/* Left: Geometric Symbol */}
          <div className="mb-12 lg:mb-0">
            <GeometricSymbol size="lg" />
          </div>
          
          {/* Right: Title and Topics */}
          <div className="flex-1 lg:ml-20">
            <h1 className="text-electric text-4xl lg:text-5xl font-bold font-mono mb-12 text-center lg:text-left">
              Training Topics and Methods
            </h1>
            
            {/* Training Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {trainingTopics.map((topic, index) => (
                <TrainingCard 
                  key={index}
                  title={topic}
                  onClick={() => console.log(`Selected: ${topic}`)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Methods Section */}
        <section className="border-t border-border pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <MethodIcon 
              type="knowledge" 
              title="Knowledge transfer"
            />
            <MethodIcon 
              type="group" 
              title="Group exercises"
            />
            <MethodIcon 
              type="cyber" 
              title="Live cyber attacks"
            />
          </div>
          
          {/* Footer Links */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
            <a 
              href="#" 
              className="text-electric font-mono text-sm underline hover:text-primary/80 transition-electric mb-4 md:mb-0"
            >
              By whom?
            </a>
            <a 
              href="#" 
              className="text-electric font-mono text-sm underline hover:text-primary/80 transition-electric"
            >
              Technical requirements
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
