import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Server, AlertTriangle, Bug, Shield, AlertCircle, MessageSquare } from 'lucide-react';

const Training = () => {
  const trainingTopics = [
    { 
      title: 'Host and Network Forensics', 
      description: 'Analyze compromised systems and network traffic. Extract evidence and reconstruct attack timelines.',
      icon: Server 
    },
    { 
      title: 'Crisis Management', 
      description: 'Lead incident response teams. Make critical decisions under pressure and coordinate recovery efforts.',
      icon: AlertTriangle 
    }, 
    { 
      title: 'Malware Analysis', 
      description: 'Reverse engineer malicious code. Understand attack methods and develop countermeasures.',
      icon: Bug 
    },
    { 
      title: 'SIEM', 
      description: 'Monitor security events in real-time. Configure alerts and investigate suspicious activities.',
      icon: Shield 
    },
    { 
      title: 'Incident Management', 
      description: 'Structure response processes. Document incidents and implement lessons learned.',
      icon: AlertCircle 
    },
    { 
      title: 'Crisis Communication', 
      description: 'Manage stakeholder communication. Report to executives and coordinate with external parties.',
      icon: MessageSquare 
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Title and Topics */}
          <div className="space-y-8">
            <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12 text-center hover:text-highlight transition-electric">
              Training Topics
            </h1>
            
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
          </div>
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
              description="Expert-led sessions covering cybersecurity fundamentals and advanced techniques."
            />
            <MethodIcon 
              type="group" 
              title="Group exercises"
              description="Collaborative problem-solving scenarios that build teamwork and communication skills."
            />
            <MethodIcon 
              type="cyber" 
              title="Live cyber attacks"
              description="Real-time simulated attacks where participants defend against actual threat scenarios."
            />
          </div>
          
          {/* Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-border">
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
            <div className="flex">
              <a 
                href="/contact" 
                className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric flex-1 flex items-center justify-center p-4"
              >
                Let's talk
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Training;
