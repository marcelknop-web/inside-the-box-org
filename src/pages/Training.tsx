import { GeometricSymbol } from '@/components/GeometricSymbol';
import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { Header } from '@/components/Header';
import { Server, AlertTriangle, Bug, Shield, AlertCircle, MessageSquare } from 'lucide-react';

const Training = () => {
  const trainingTopics = [
    { title: 'Host and Network Forensics', icon: Server },
    { title: 'Crises Management', icon: AlertTriangle }, 
    { title: 'Malware Analysis', icon: Bug },
    { title: 'SIEM', icon: Shield },
    { title: 'Incident Management', icon: AlertCircle },
    { title: 'Crises Communication', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen">
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
            <h1 className="text-electric text-4xl lg:text-5xl font-bold font-mono mb-12 text-center lg:text-left hover:text-highlight transition-electric">
              Training Topics
            </h1>
            
            {/* Training Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {trainingTopics.map((topic, index) => (
                <div key={index} className="flex">
                  <TrainingCard 
                    title={topic.title}
                    icon={topic.icon}
                    className="flex-1"
                    onClick={() => console.log(`Selected: ${topic.title}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Methods Section */}
        <section className="border-t border-border pt-16">
          <h2 className="text-electric text-3xl lg:text-4xl font-bold font-mono mb-12 text-center hover:text-highlight transition-electric">
            Methods
          </h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-border">
            <div className="flex">
              <a 
                href="/" 
                className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:text-electric hover:bg-highlight/20 hover:border-highlight/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                Why?
              </a>
            </div>
            <div className="flex">
              <a 
                href="/technical-requirements" 
                className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:text-electric hover:bg-highlight/20 hover:border-highlight/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                Technical requirements
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Training;
