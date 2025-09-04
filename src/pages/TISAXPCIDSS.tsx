import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { Settings, CheckCircle, FileCheck, Car, CreditCard } from 'lucide-react';

const TISAXPCIDSS = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          TISAX, PCI-DSS
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            TISAX and PCI-DSS compliance consulting for automotive and payment industries.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Settings}
              title="Implementation"
              description="Comprehensive implementation support for TISAX and PCI-DSS requirements."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Assessment level determination</li>
                <li className="pl-4 -indent-4">• Security control implementation</li>
                <li className="pl-4 -indent-4">• Documentation and evidence collection</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={CheckCircle}
              title="Reviews"
              description="Pre-assessment evaluation and compliance verification."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Pre-assessment readiness evaluation</li>
                <li className="pl-4 -indent-4">• Security control effectiveness review</li>
                <li className="pl-4 -indent-4">• Compliance status verification</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={FileCheck}
              title="Audit Support"
              description="Comprehensive audit preparation and certification maintenance."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Assessment preparation</li>
                <li className="pl-4 -indent-4">• Auditor coordination</li>
                <li className="pl-4 -indent-4">• Certification maintenance</li>
              </ul>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Framework Expertise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <Car className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">TISAX</h3>
                    <p>Security assessment exchange for automotive industry suppliers.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CreditCard className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">PCI-DSS</h3>
                    <p>Data security standard for payment card processing organizations.</p>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <div className="pt-8">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-4 md:hidden">
              <LinkButton href="/consulting">All Consulting Services</LinkButton>
              <LinkButton href="/consulting/team">By Whom</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between space-x-4">
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

export default TISAXPCIDSS;