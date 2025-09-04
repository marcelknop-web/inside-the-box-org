import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { LinkButton } from '@/components/LinkButton';
import { FileText, Eye, Shield, RefreshCw, GraduationCap } from 'lucide-react';

const IncidentManagement = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Incident Management
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Security incident management framework development.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={FileText}
              title="Incident Response Planning"
              description="Development of structured incident response procedures and operational playbooks."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Incident classification and severity levels</li>
                <li className="pl-4 -indent-4">• Response team structure and roles</li>
                <li className="pl-4 -indent-4">• Escalation and communication protocols</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Eye}
              title="Detection & Analysis"
              description="Implementation of incident detection capabilities and analytical processes for effective threat identification."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Security monitoring and alerting systems</li>
                <li className="pl-4 -indent-4">• Forensic analysis methodology</li>
                <li className="pl-4 -indent-4">• Evidence collection and preservation</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Shield}
              title="Containment & Eradication"
              description="Strategic approaches for incident containment, threat eradication, and system recovery operations."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Containment strategy development</li>
                <li className="pl-4 -indent-4">• Network segmentation and isolation</li>
                <li className="pl-4 -indent-4">• System hardening and recovery</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={RefreshCw}
              title="Recovery & Lessons Learned"
              description="Systematic recovery operations and post-incident analysis for continuous improvement."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Business continuity coordination</li>
                <li className="pl-4 -indent-4">• Post-incident review and analysis</li>
                <li className="pl-4 -indent-4">• Process improvement implementation</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={GraduationCap}
              title="Training & Simulation"
              description="Practical training programs and simulation exercises to develop incident response capabilities."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Incident response team training</li>
                <li className="pl-4 -indent-4">• Tabletop exercises and simulations</li>
                <li className="pl-4 -indent-4">• Technical skills development</li>
              </ul>
            </ServiceCard>
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

export default IncidentManagement;