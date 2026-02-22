import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { ClipboardList, Zap, Target, Crown, MessageSquare, Users, Gamepad2, Monitor, ShieldCheck, Users2, Lightbulb } from 'lucide-react';

const CyberCrisisManagement = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Cyber Crisis Management" description="Crisis management capability through planning and simulation. Scenario development, leadership training, and cyber range exercises." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Cyber Crisis Management
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Crisis management capability built through planning and simulation – not binders that stay on the shelf.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={ClipboardList}
              title="Crisis Planning & Preparedness"
              description="Governance structure, team composition, and decision-making authority defined before pressure arrives. Who decides what, at what threshold, and with what mandate."
            />
            
            <ServiceCard
              icon={Zap}
              title="Scenario Development"
              description="Threat-informed scenarios based on current attack patterns and your organization's actual risk profile – including realistic escalation paths and cross-functional impact."
              variant="highlight"
            />
            
            <ServiceCard
              icon={Target}
              title="Crisis Simulation Exercises"
              description="Live simulations in controlled cyber range environments – team coordination, communication under pressure, and technical response tested simultaneously."
            />
            
            <ServiceCard
              icon={Crown}
              title="Leadership Development"
              description="Crisis leadership training for executives: strategic decision-making, stakeholder management, and media communication when the situation is still developing."
              variant="highlight"
            />
            
            <ServiceCard
              icon={MessageSquare}
              title="Crisis Communication"
              description="Internal and external communication planning – including regulatory reporting obligations, media statements, and stakeholder protocols prepared before they are needed."
            />
            
            <InfoCard variant="highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Training Methodologies</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Users className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Tabletop</h3>
                  <p>Discussion-based walkthroughs for governance and coordination.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Gamepad2 className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Live Simulation</h3>
                  <p>Real-time scenarios with operational constraints and time pressure.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Monitor className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Cyber Range</h3>
                  <p>Immersive technical environment with realistic attack simulation and measurable business impact.</p>
                </div>
              </div>
            </InfoCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Expected Outcomes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Readiness</h3>
                    <p>Tested procedures, not assumed ones.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users2 className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Coordination</h3>
                    <p>Cross-functional response validated under realistic conditions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lightbulb className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Leadership</h3>
                    <p>Executive confidence built through practice, not theory.</p>
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

export default CyberCrisisManagement;