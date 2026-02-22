import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { Search, Shield, Users, Calendar, BarChart } from 'lucide-react';

const AssessmentsConcepts = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Assessments & Concepts" description="Structured security assessments and actionable concepts. Threat analysis, controls design, and implementation roadmaps." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Assessments & Concepts
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Structured security assessments and actionable concepts – from threat analysis to implementation roadmap.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Search}
              title="Threat & Risk Assessment"
              description="Threat landscape analysis, attack vector mapping, and vulnerability identification – combined with risk quantification tied to actual business impact, not theoretical severity scores."
            />
            
            <ServiceCard
              icon={Shield}
              title="Security Controls Design"
              description="Control frameworks mapped to identified risks and compliance requirements. We specify what is needed, why, and at what cost – so decisions can be made on facts, not vendor recommendations."
              variant="highlight"
            />
            
            <ServiceCard
              icon={Users}
              title="Roles & Responsibilities"
              description="Clear governance structures: who owns security decisions, who escalates, and who acts. Defined on paper and verified against operational reality."
            />
            
            <ServiceCard
              icon={Calendar}
              title="Implementation Planning"
              description="Phased roadmap with realistic milestones, resource requirements, and budget allocation. Includes change management where organizational resistance is a known risk factor."
              variant="highlight"
            />
            
            <ServiceCard
              icon={BarChart}
              title="Measurement & Monitoring"
              description="KPI definition, reporting structures, and monitoring mechanisms that reflect actual security posture – not compliance theater. Built to survive the first management review."
            />
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

export default AssessmentsConcepts;