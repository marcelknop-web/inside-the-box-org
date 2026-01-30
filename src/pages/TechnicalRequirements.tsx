import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { LinkButton } from '@/components/LinkButton';
import { Monitor, Network } from 'lucide-react';

const TechnicalRequirements = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Technical Requirements
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8 text-white">
            Training takes place in a virtual environment. 
            Participants connect via RDP from their own devices.
          </p>
          
          <div className="space-y-6">
            <h2 className="text-primary text-2xl font-bold font-mono mb-6">
              Requirements
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceCard
                icon={Monitor}
                title="System"
                description="Hardware and software requirements for training participation."
              >
                <ul className="text-base text-foreground/80 space-y-2 mt-4">
                  <li className="pl-4 -indent-4">• Modern computer (Windows/Mac/Linux)</li>
                  <li className="pl-4 -indent-4">• 8GB RAM minimum</li>
                  <li className="pl-4 -indent-4">• Stable internet (10+ Mbps)</li>
                  <li className="pl-4 -indent-4">• 1920x1080 resolution</li>
                  <li className="pl-4 -indent-4">• RDP client installed</li>
                </ul>
              </ServiceCard>
              
              <ServiceCard
                icon={Network}
                title="Network"
                description="Network connectivity and port requirements for training access."
                variant="highlight"
              >
                <ul className="text-base text-foreground/80 space-y-2 mt-4">
                  <li className="pl-4 -indent-4">• <span className="font-mono">RDP: 7000-7020/TCP outbound</span></li>
                  <li className="pl-4 -indent-4">• <span className="font-mono">HTTPS: 443/TCP outbound</span></li>
                  <li className="pl-4 -indent-4">• Test connectivity beforehand</li>
                  <li className="pl-4 -indent-4">• Backup communication ready</li>
                </ul>
              </ServiceCard>
            </div>
          </div>
          
          <div className="pt-8">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-4 md:hidden">
              <LinkButton href="/training">Back to Training</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between space-x-4">
              <LinkButton href="/training">Back to Training</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default TechnicalRequirements;