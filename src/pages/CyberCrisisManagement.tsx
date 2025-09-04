import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { ClipboardList, Zap, Target, Crown, MessageSquare, Users, Gamepad2, MonitorSpeaker, Monitor } from 'lucide-react';

const CyberCrisisManagement = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Cyber Crisis Management
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Cyber crisis management through planning and simulation exercises.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={ClipboardList}
              title="Crisis Planning & Preparedness"
              description="Development of comprehensive crisis management plans and organizational preparedness frameworks."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Crisis management governance and authority</li>
                <li className="pl-4 -indent-4">• Crisis team composition and roles</li>
                <li className="pl-4 -indent-4">• Decision-making frameworks under pressure</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Zap}
              title="Scenario Development"
              description="Creation of realistic crisis scenarios based on current threat intelligence and organizational risk profile."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Threat-informed scenario design</li>
                <li className="pl-4 -indent-4">• Crisis progression and escalation modeling</li>
                <li className="pl-4 -indent-4">• Cross-functional impact analysis</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Target}
              title="Crisis Simulation Exercises"
              description="Immersive crisis simulation training using controlled cyber training range environments."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Live cyber attack simulation</li>
                <li className="pl-4 -indent-4">• Team coordination and communication testing</li>
                <li className="pl-4 -indent-4">• Decision-making under pressure</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Crown}
              title="Leadership Development"
              description="Specialized training for crisis leadership and executive decision-making during cyber incidents."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Executive crisis leadership training</li>
                <li className="pl-4 -indent-4">• Strategic decision-making frameworks</li>
                <li className="pl-4 -indent-4">• Crisis communication and media skills</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={MessageSquare}
              title="Crisis Communication"
              description="Strategic communication planning and execution for internal and external stakeholder management."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Crisis communication strategy development</li>
                <li className="pl-4 -indent-4">• Media relations and public statements</li>
                <li className="pl-4 -indent-4">• Regulatory reporting and compliance</li>
              </ul>
            </ServiceCard>
            
            <InfoCard variant="highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Training Methodologies</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Users className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Tabletop Exercises</h3>
                  <p>Discussion-based scenario walkthroughs for strategic planning and coordination practice.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Gamepad2 className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Live Simulations</h3>
                  <p>Real-time crisis scenarios with technical components and operational constraints.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Monitor className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Cyber Range Training</h3>
                  <p>Immersive technical environment simulating realistic attack scenarios and business impact.</p>
                </div>
              </div>
            </InfoCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Expected Outcomes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Enhanced Readiness</h3>
                  <p>Improved organizational preparedness and response capability for cyber crisis situations.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Tested Procedures</h3>
                  <p>Validated crisis management procedures and identification of improvement opportunities.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Team Coordination</h3>
                  <p>Strengthened cross-functional collaboration and communication under crisis conditions.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Leadership Confidence</h3>
                  <p>Increased executive confidence in crisis decision-making and stakeholder management.</p>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <div className="pt-8">
            <div className="flex justify-between space-x-4 flex-wrap gap-y-4">
              <LinkButton href="/consulting">All Consulting Services</LinkButton>
              <LinkButton href="/consulting/team">By Whom</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CyberCrisisManagement;