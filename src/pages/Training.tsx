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
        <div className="max-w-6xl mx-auto">
          {/* Title and Topics */}
          <div className="space-y-8">
            <h1 className="text-electric text-4xl lg:text-5xl font-bold font-mono mb-12 text-center hover:text-highlight transition-electric">
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
          <h2 className="text-highlight text-3xl lg:text-4xl font-bold font-mono mb-12 text-center hover:text-electric transition-electric">
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
                href="/by-whom" 
                className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                By Whom?
              </a>
            </div>
            <div className="flex">
              <a 
                href="/technical-requirements" 
                className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-sm hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric flex-1 flex items-center justify-center p-4"
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
