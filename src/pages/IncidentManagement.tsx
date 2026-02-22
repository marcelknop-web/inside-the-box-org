import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { FileText, Eye, Shield, RefreshCw, GraduationCap } from 'lucide-react';

const IncidentManagement = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Incident Management" description="Incident response framework development. Response planning, detection, containment, recovery, and team training." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Incident Management
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Framework development for organizations that need to respond to incidents – not just document that they have a plan.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={FileText}
              title="Incident Response Planning"
              description="Structured response procedures and operational playbooks: classification criteria, team roles, escalation paths, and communication protocols – ready before an incident occurs."
            />
            
            <ServiceCard
              icon={Eye}
              title="Detection & Analysis"
              description="Monitoring and alerting architecture, forensic methodology, and evidence handling procedures – built to hold up under legal and regulatory scrutiny."
              variant="highlight"
            />
            
            <ServiceCard
              icon={Shield}
              title="Containment & Eradication"
              description="Containment strategies, network isolation procedures, and recovery operations – developed for your environment, not copied from a framework template."
            />
            
            <ServiceCard
              icon={RefreshCw}
              title="Recovery & Lessons Learned"
              description="Business continuity coordination, post-incident review, and documented process improvements. The incident report is the starting point, not the deliverable."
              variant="highlight"
            />
            
            <ServiceCard
              icon={GraduationCap}
              title="Training & Simulation"
              description="Tabletop exercises and technical training for response teams – scenario-based, realistic, and calibrated to your threat profile. Experience across industrial, financial, and public sector environments."
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

export default IncidentManagement;