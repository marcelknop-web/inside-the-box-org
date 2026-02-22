import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { Search, TrendingUp, Shield, Building2, Landmark, Plane } from 'lucide-react';

const NIS2DORA = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="NIS-2, DORA, PART-IS" description="Regulatory compliance across NIS-2, DORA, and PART-IS frameworks. Impact analysis, gap analysis, and implementation support." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          NIS-2, DORA, PART-IS
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Regulatory compliance across three distinct frameworks – scoped to your sector, organization size, and existing security maturity.
          </p>
          
          {/* Services Overview */}
          <div className="space-y-6">
            <InfoCard icon={Search} variant="primary">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Impact Analysis</h2>
              <p className="text-base text-foreground/80">
                Determine whether and how regulations apply to your organization – including entity classification, critical function mapping, and cross-divisional obligations.
              </p>
            </InfoCard>
            
            <InfoCard icon={TrendingUp} variant="primary">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">GAP Analysis</h2>
              <p className="text-base text-foreground/80">
                Current state against regulatory requirements – prioritized by risk, not alphabetical order. Output: a realistic implementation roadmap, not a checklist.
              </p>
            </InfoCard>
            
            <InfoCard icon={Shield} variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Implementation of Measures</h2>
              <p className="text-base text-foreground/80">
                Technical and organizational measures developed with your teams and validated against regulatory expectations – including incident reporting workflows and monitoring mechanisms.
              </p>
            </InfoCard>
            
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Framework Coverage</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <Building2 className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">NIS-2</h3>
                    <p>Scope determination, security requirements, and reporting obligations for essential and important entities.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Landmark className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">DORA</h3>
                    <p>ICT risk management, resilience testing, and third-party oversight for financial sector organizations.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Plane className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">PART-IS</h3>
                    <p>Proportionate, risk-based IS compliance under EASA regulation. One of few consulting practices with hands-on PART-IS project experience.</p>
                  </div>
                </div>
              </div>
            </div>
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

export default NIS2DORA;