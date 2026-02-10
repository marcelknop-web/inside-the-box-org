import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Search, TrendingUp, Shield, Building2, Landmark, Plane } from 'lucide-react';

const NIS2DORA = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          NIS-2, DORA, PART-IS
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            NIS-2, DORA, and PART-IS compliance support.
          </p>
          
          {/* Services Overview */}
          <div className="space-y-6">
            <InfoCard icon={Search} variant="primary">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Impact Analysis</h2>
              <p className="text-sm text-foreground/80 mb-4">
                Determine the scope and implications of regulatory requirements for your organization.
              </p>
              <ul className="text-sm text-foreground/80 space-y-2">
                <li className="pl-4 -indent-4">• Regulatory applicability assessment</li>
                <li className="pl-4 -indent-4">• Critical business function identification</li>
                <li className="pl-4 -indent-4">• Cross-divisional impact analysis</li>
              </ul>
            </InfoCard>
            
            <InfoCard icon={TrendingUp} variant="highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">GAP Analysis</h2>
              <p className="text-sm text-foreground/80 mb-4">
                Systematic evaluation of current capabilities against regulatory requirements.
              </p>
              <ul className="text-sm text-foreground/80 space-y-2">
                <li className="pl-4 -indent-4">• Current state assessment and gap identification</li>
                <li className="pl-4 -indent-4">• Risk-based prioritization of activities</li>
                <li className="pl-4 -indent-4">• Implementation timeline development</li>
              </ul>
            </InfoCard>
            
            <InfoCard icon={Shield} variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Implementation of Measures</h2>
              <p className="text-sm text-foreground/80 mb-4">
                Development and deployment of technical and organizational measures for compliance.
              </p>
              <ul className="text-sm text-foreground/80 space-y-2">
                <li className="pl-4 -indent-4">• Technical and organizational measure development</li>
                <li className="pl-4 -indent-4">• Continuous monitoring and effectiveness assessment</li>
                <li className="pl-4 -indent-4">• Incident response and reporting mechanisms</li>
              </ul>
            </InfoCard>
            
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Regulatory Framework Coverage</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <Building2 className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">NIS-2 Directive</h3>
                    <p>Network and Information Systems security requirements for essential and important entities.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Landmark className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">DORA</h3>
                    <p>Digital Operational Resilience Act for financial services ICT risk management.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Plane className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">PART-IS</h3>
                    <p>EASA aviation regulation compliance for proportionate and risk-based approaches to information security.</p>
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