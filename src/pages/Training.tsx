import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { PageLayout } from '@/components/PageLayout';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { Server, AlertTriangle, Bug, Shield, AlertCircle, MessageSquare } from 'lucide-react';

const Training = () => {
  const trainingTopics = [
    { 
      title: 'Host & Network Forensics', 
      description: 'Analyze compromised systems and reconstruct attack timelines.',
      icon: Server 
    },
    { 
      title: 'Malware Analysis', 
      description: 'Reverse engineer malicious code and develop countermeasures.',
      icon: Bug 
    },
    { 
      title: 'SIEM', 
      description: 'Monitor security events and investigate threats in real time.',
      icon: Shield 
    },
    { 
      title: 'Incident Management', 
      description: 'Structure response processes and document incidents under operational conditions.',
      icon: AlertCircle 
    },
    { 
      title: 'Crisis Management', 
      description: 'Lead response teams under pressure with competing priorities and incomplete information.',
      icon: AlertTriangle 
    }, 
    { 
      title: 'Crisis Communication', 
      description: 'Manage internal and external stakeholder communication when the situation is still developing.',
      icon: MessageSquare 
    }
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Training Topics" description="Cybersecurity training from command line to boardroom. Host forensics, malware analysis, SIEM, incident management, and crisis communication." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-6">
          Training Topics
        </h1>
        <p className="text-lg font-sans mb-12">
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
              />
            </div>
          ))}
        </div>

        {/* Methods Section */}
        <section className="border-t border-border pt-16">
          <h2 className="text-highlight text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-6">
            Methods
          </h2>
          <p className="text-lg font-sans mb-12">
            Understanding, communicating, and practicing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <PageNavButtons buttons={[
            { href: '/by-whom', label: 'By Whom' },
            { href: '/technical-requirements', label: 'Technical Requirements' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </section>
      </div>
    </PageLayout>
  );
};

export default Training;
