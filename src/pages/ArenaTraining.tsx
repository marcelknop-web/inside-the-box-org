import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Target, Flag, Gamepad2, Users, Crosshair, CheckSquare } from 'lucide-react';

const ArenaTraining = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Arena Training, TIBER Test
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Advanced threat intelligence-based ethical red teaming and cyber training programs.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Target}
              title="Arena Training"
              description="Comprehensive cybersecurity training in realistic attack scenarios."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Analysis of host and network-based attacks</li>
                <li className="pl-4 -indent-4">• SIEM monitoring of live communication</li>
                <li className="pl-4 -indent-4">• Techniques and tactics to prevent detection</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Flag}
              title="TIBER Test"
              description="Threat Intelligence-based Ethical Red Teaming coordination and management."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Scenario creation and safeguard definition</li>
                <li className="pl-4 -indent-4">• Team communication moderation</li>
                <li className="pl-4 -indent-4">• Testing coordination and documentation</li>
              </ul>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Training Methodology</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <Gamepad2 className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Realistic Scenarios</h3>
                    <p>Live attack simulations using actual threat intelligence and attack patterns.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Crosshair className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Hands-on Practice</h3>
                    <p>Direct engagement with cybersecurity tools and defensive techniques.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Team Coordination</h3>
                    <p>Multi-team exercises involving threat intelligence, red team, and blue team coordination.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckSquare className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Regulatory Compliance</h3>
                    <p>Authority contact procedures and regulatory reporting requirements.</p>
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