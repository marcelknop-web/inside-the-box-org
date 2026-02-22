import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
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
            Executive cybersecurity leadership on a flexible engagement model – for organizations that need strategic direction without a full-time hire.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Crown}
              title="Strategic Leadership"
              description="Cybersecurity strategy, risk governance, and board-level reporting. Decisions grounded in operational reality, not framework theory."
            />
            
            <ServiceCard
              icon={Settings}
              title="Operational Excellence"
              description="Security program oversight, team guidance, and vendor management – maintaining continuity and accountability without a permanent headcount."
              variant="primary"
            />
            
            <ServiceCard
              icon={CheckSquare}
              title="Compliance & Assurance"
              description="Regulatory compliance management, audit coordination, and policy development. One point of ownership across frameworks, assessments, and reporting obligations."
            />
            
            <InfoCard variant="highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Service Model</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <UserCheck className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Flexible</h3>
                    <p>Part-time or project-based engagement scaled to your current needs.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <DollarSign className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cost-effective</h3>
                    <p>Senior expertise at a fraction of full-time executive cost.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Immediate</h3>
                    <p>No onboarding lag. Operational from day one.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Experienced</h3>
                    <p>Background in enterprise security management across regulated industries.</p>
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

export default VirtualCISO;