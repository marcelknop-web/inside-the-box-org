import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Server, AlertTriangle, Bug, Shield, AlertCircle, MessageSquare } from 'lucide-react';

const Training = () => {
  const trainingTopics = [
    { 
      title: 'Host and Network Forensics', 
      description: 'Dig deep into compromised systems and network traffic. Learn to piece together what happened and how.',
      icon: Server 
    },
    { 
      title: 'Crisis Management', 
      description: 'When everything hits the fan, someone needs to take charge. Practice making tough calls under pressure.',
      icon: AlertTriangle 
    }, 
    { 
      title: 'Malware Analysis', 
      description: 'Take apart malicious code to understand what makes it tick. Know your enemy.',
      icon: Bug 
    },
    { 
      title: 'SIEM', 
      description: 'Keep your finger on the pulse of your network. Spot the bad guys before they spot you.',
      icon: Shield 
    },
    { 
      title: 'Incident Management', 
      description: 'Turn chaos into order. Build processes that actually work when you need them most.',
      icon: AlertCircle 
    },
    { 
      title: 'Crisis Communication', 
      description: 'Keep stakeholders informed without causing panic. Master the art of crisis communication.',
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
              description="Learn from experts who've been in the trenches. Real insights, not textbook theory."
            />
            <MethodIcon 
              type="group" 
              title="Group exercises"
              description="Work together to solve problems. Because cyber defense is always a team sport."
            />
            <MethodIcon 
              type="cyber" 
              title="Live cyber attacks"
              description="Face real attacks in a safe environment. No simulations - actual threat scenarios targeting your setup."
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
