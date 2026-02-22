import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { Target, Flag, Gamepad2, Users, Crosshair, CheckSquare } from 'lucide-react';

const ArenaTraining = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Arena Training, TIBER Test" description="Advanced red team training and TIBER-EU/TIBER-DE coordination for financial sector and critical infrastructure." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Arena Training, TIBER Test
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Advanced red team training and regulatory TIBER coordination – for organizations that need to test beyond compliance checkboxes.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Target}
              title="Arena Training"
              description="Hands-on training in realistic attack environments: host and network-based attack analysis, live SIEM monitoring, and detection evasion techniques – from both sides of the kill chain."
            />
            
            <ServiceCard
              icon={Flag}
              title="TIBER Test"
              description="End-to-end TIBER-EU/TIBER-DE coordination: scenario design, safeguard definition, team communication, and full documentation for regulatory submission. Experience with financial sector and critical infrastructure engagements."
              variant="highlight"
            />
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Training Methodology</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Gamepad2 className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Realistic Scenarios</h3>
                    <p>Live simulations built on current threat intelligence, not synthetic exercises.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Crosshair className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Hands-on Practice</h3>
                    <p>Direct tool engagement for both offensive and defensive roles.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Team Coordination</h3>
                    <p>Red, blue, and threat intelligence teams operating under realistic operational constraints.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckSquare className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Regulatory Compliance</h3>
                    <p>Authority notification procedures and reporting requirements integrated into the exercise design from the start.</p>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting', label: 'All Consulting Services' },
            { href: '/consulting/team', label: 'By Whom' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default ArenaTraining;