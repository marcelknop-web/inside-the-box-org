import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { PageLayout } from '@/components/PageLayout';
import { Server, AlertTriangle, Bug, Shield, AlertCircle, MessageSquare } from 'lucide-react';

const Training = () => {
  const trainingTopics = [
    { 
      title: 'Host and Network Forensics', 
      description: 'Analyze compromised systems and reconstruct attack timelines.',
      icon: Server 
    },
    { 
      title: 'SIEM', 
      description: 'Monitor security events and investigate threats.',
      icon: Shield 
    },
    { 
      title: 'Malware Analysis', 
      description: 'Reverse engineer malicious code and develop countermeasures.',
      icon: Bug 
    },
    { 
      title: 'Incident Management', 
      description: 'Structure response processes and document incidents.',
      icon: AlertCircle 
    },
    { 
      title: 'Crisis Management', 
      description: 'Lead incident response teams under pressure.',
      icon: AlertTriangle 
    }, 
    { 
      title: 'Crisis Communication', 
      description: 'Manage stakeholder communication during incidents.',
      icon: MessageSquare 
    }
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-6 text-left hover:text-highlight transition-electric">
          Training Topics
        </h1>
        <p className="text-white text-base sm:text-lg mb-12">
          From Command Line to Boardroom.
        </p>
        
        {/* Training Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {trainingTopics.map((topic, index) => (
            <div key={index} className="flex">
              <TrainingCard 
                title={topic.title}
                description={topic.description}
                icon={topic.icon}
                className="flex-1"
                onClick={() => console.log(`Selected: ${topic.title}`)}
              />
            </div>
          ))}
        </div>

        {/* Methods Section */}
        <section className="border-t border-border pt-16">
          <h2 className="text-highlight text-xl sm:text-2xl lg:text-4xl font-bold font-mono mb-12 text-center hover:text-primary transition-electric">
            Methods
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <MethodIcon 
              type="knowledge" 
              title="Knowledge transfer"
              description="Expert-led sessions covering cybersecurity fundamentals."
            />
            <MethodIcon 
              type="group" 
              title="Group exercises"
              description="Team-based scenarios for coordination practice."
            />
            <MethodIcon 
              type="cyber" 
              title="Live cyber attacks"
              description="Real-time attack simulations in controlled environments."
            />
          </div>
          
          {/* Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-border">
            <div className="flex">
              <a 
                href="/by-whom" 
                className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base sm:text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                By Whom
              </a>
            </div>
            <div className="flex">
              <a 
                href="/technical-requirements" 
                className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base sm:text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                Technical requirements
              </a>
            </div>
            <div className="flex">
              <a 
                href="/contact" 
                className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base sm:text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                Contact
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default Training;
