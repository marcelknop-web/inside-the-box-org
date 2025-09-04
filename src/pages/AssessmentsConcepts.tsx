import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { LinkButton } from '@/components/LinkButton';
import { Search, Shield, Users, Calendar, BarChart } from 'lucide-react';

const AssessmentsConcepts = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Assessments & Concepts
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Security assessment and concept development for responsible digitalization.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Search}
              title="Threat & Risk Assessment"
              description="Comprehensive identification and analysis of cybersecurity threats and organizational risk exposure."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Threat landscape analysis and attack vectors</li>
                <li className="pl-4 -indent-4">• Penetration testing and vulnerability scanning</li>
                <li className="pl-4 -indent-4">• Risk quantification and business impact evaluation</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Shield}
              title="Security Controls Design"
              description="Development of tailored security control frameworks addressing identified risks and compliance requirements."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Control objective definition and mapping</li>
                <li className="pl-4 -indent-4">• Technical and organizational measure specification</li>
                <li className="pl-4 -indent-4">• Cost-benefit analysis and investment prioritization</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Users}
              title="Roles & Responsibilities"
              description="Definition of organizational roles, responsibilities, and governance structures for security management."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Security governance framework</li>
                <li className="pl-4 -indent-4">• Role definition and responsibility assignment</li>
                <li className="pl-4 -indent-4">• Escalation procedures and decision-making</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Calendar}
              title="Implementation Planning"
              description="Strategic roadmap development for systematic security concept implementation and operationalization."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Implementation phasing and milestones</li>
                <li className="pl-4 -indent-4">• Resource planning and budget allocation</li>
                <li className="pl-4 -indent-4">• Change management and communication</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={BarChart}
              title="Measurement & Monitoring"
              description="Establishment of metrics, monitoring capabilities, and continuous improvement processes."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• KPI definition and measurement</li>
                <li className="pl-4 -indent-4">• Security dashboard and reporting</li>
                <li className="pl-4 -indent-4">• Continuous monitoring and improvement</li>
              </ul>
            </ServiceCard>
          </div>
          
          <div className="pt-8">
            <div className="flex justify-between space-x-4 flex-wrap gap-y-4">
              <LinkButton href="/consulting">All Consulting Services</LinkButton>
              <LinkButton href="/consulting/team">By Whom?</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AssessmentsConcepts;