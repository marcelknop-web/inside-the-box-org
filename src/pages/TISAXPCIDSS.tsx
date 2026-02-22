import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { Settings, CheckCircle, FileCheck, Car, CreditCard } from 'lucide-react';

const TISAXPCIDSS = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="TISAX, PCI-DSS" description="Compliance consulting for automotive suppliers and payment card environments. From initial scoping to label or certification." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          TISAX, PCI-DSS
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Compliance consulting for automotive suppliers and payment card environments – from initial scoping to label or certification.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Settings}
              title="Implementation"
              description="Control implementation mapped to your assessment level (TISAX) or SAQ/ROC scope (PCI-DSS) – including evidence collection and documentation built for auditor scrutiny, not internal comfort."
            />
            
            <ServiceCard
              icon={CheckCircle}
              title="Reviews"
              description="Pre-assessment readiness check before the auditor arrives. Identifies open findings while there is still time to close them."
              variant="highlight"
            />
            
            <ServiceCard
              icon={FileCheck}
              title="Audit Support"
              description="Assessment preparation, auditor coordination, and finding remediation. For TISAX: ENX portal handling and label maintenance. For PCI-DSS: QSA coordination and ongoing compliance calendar."
            />
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Framework Coverage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Car className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">TISAX</h3>
                    <p>Assessment levels AL2 and AL3, including prototype protection and connected supplier requirements. Practical experience with major OEMs and Tier-1 suppliers.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CreditCard className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">PCI-DSS</h3>
                    <p>v4.0 compliant scoping, control design, and QSA preparation for merchants and service providers across all SAQ types and full ROC engagements.</p>
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

export default TISAXPCIDSS;