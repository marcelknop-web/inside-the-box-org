import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';

const ISMS = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          ISMS ISO 27001, BSI GS
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            ISMS development and certification support.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              title="ISO 27001 Implementation"
              description="ISMS frameworks meeting international standards."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li>• Risk assessment and treatment</li>
                <li>• Policy development</li>
                <li>• Certification support</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              title="BSI IT-Grundschutz"
              description="BSI IT-Grundschutz methodology implementation."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li>• IT-Grundschutz compendium</li>
                <li>• Security safeguards</li>
                <li>• BSI certification</li>
              </ul>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Our Approach</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Assessment</h3>
                  <p>Analysis of current security posture and gap identification.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Implementation</h3>
                  <p>Structured rollout of security controls and procedures.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Certification</h3>
                  <p>Support through external audits and compliance.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Maintenance</h3>
                  <p>Ongoing ISMS improvement and threat adaptation.</p>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <div className="pt-8">
            <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
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

export default ISMS;