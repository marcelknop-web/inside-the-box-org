import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { Crown, Settings, CheckSquare, DollarSign, Zap, Award, UserCheck } from 'lucide-react';

const VirtualCISO = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Virtual CISO
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Outsourced Chief Information Security Officer services for strategic cybersecurity leadership.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Crown}
              title="Strategic Leadership"
              description="Executive-level cybersecurity guidance and strategic decision-making support."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Cybersecurity strategy development</li>
                <li className="pl-4 -indent-4">• Risk management and governance</li>
                <li className="pl-4 -indent-4">• Board and executive reporting</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Settings}
              title="Operational Excellence"
              description="Day-to-day security operations oversight and program management."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Security program implementation</li>
                <li className="pl-4 -indent-4">• Team leadership and development</li>
                <li className="pl-4 -indent-4">• Vendor and technology management</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={CheckSquare}
              title="Compliance & Assurance"
              description="Regulatory compliance management and security assurance programs."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Regulatory compliance oversight</li>
                <li className="pl-4 -indent-4">• Audit coordination and management</li>
                <li className="pl-4 -indent-4">• Policy and procedure development</li>
              </ul>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Service Model</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <UserCheck className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Flexible Engagement</h3>
                    <p>Part-time or project-based CISO services tailored to organizational needs.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <DollarSign className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cost-Effective</h3>
                    <p>Executive-level expertise without the full-time executive cost.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Immediate Impact</h3>
                    <p>Rapid deployment of experienced cybersecurity leadership.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Proven Experience</h3>
                    <p>Enterprise-level cybersecurity management and consulting expertise.</p>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <div className="pt-8">
            <div className="flex justify-between space-x-4 flex-wrap gap-y-4">
              <LinkButton href="/consulting">All Consulting Services</LinkButton>
              <LinkButton href="/consulting/team">Meet the Team</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default VirtualCISO;