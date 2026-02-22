import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { ShieldCheck, FileText, Search, Settings, Award, RotateCcw } from 'lucide-react';

const ISMS = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="ISMS ISO 27001, BSI GS" description="ISMS implementation from gap analysis to certification. ISO 27001 and BSI IT-Grundschutz across all protection levels." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          ISMS ISO 27001, BSI GS
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            ISMS development and certification support.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={ShieldCheck}
              title="ISO 27001 Implementation"
              description="ISMS implementation from initial gap analysis to certification. We apply structured risk methods, develop audit-ready documentation, and accompany the full certification process – including Stage-1/Stage-2 preparation and pre-audits with your chosen certification body."
            />
            
            <ServiceCard
              icon={FileText}
              title="BSI IT-Grundschutz"
              description="BSI IT-Grundschutz implementation across all protection levels – Basis, Standard, or Core. We handle structural analysis, protection needs assessment, and modelling, then prepare you for IS-audit or BSI certification. Practical experience in KRITIS and public sector environments."
              variant="highlight"
            />
            
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Our Approach</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Search className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Assessment</h3>
                    <p>Gap analysis against the target standard through interviews, document review, and technical spot checks – delivered as a prioritized action plan for management and IT leadership.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Settings className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Implementation</h3>
                    <p>We build ISMS documentation, policies, and controls jointly with your teams – not off-the-shelf templates. Pragmatic, audit-ready, scaled to your organization.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Certification</h3>
                    <p>Full audit support: certification body coordination, internal pre-audits, interview preparation, and finding remediation – aiming for a clean Stage-2 result.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RotateCcw className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Maintenance</h3>
                    <p>Surveillance audits, management reviews, updated risk assessments, and integration of new threat intelligence. Your ISMS stays current, not just certified.</p>
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

export default ISMS;