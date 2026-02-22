import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { Users, Building2, Award, ShieldCheck, Network, CreditCard, Search, AlertTriangle, Radio, Target, Calendar, FileText, UserCheck } from 'lucide-react';

const Consulting = () => {
  const services = [
    {
      title: 'ISMS ISO 27001, BSI GS',
      description: 'ISMS implementation and certification support.',
      href: '/isms',
      icon: ShieldCheck
    },
    {
      title: 'NIS-2, DORA, PART-IS',
      description: 'Regulatory compliance across three distinct frameworks.',
      href: '/nis2-dora',
      icon: Network
    },
    {
      title: 'TISAX, PCI-DSS',
      description: 'Compliance consulting for automotive and payment environments.',
      href: '/tisax-pci-dss',
      icon: CreditCard
    },
    {
      title: 'Assessments & Concepts',
      description: 'Threat analysis, penetration testing, and security concept development.',
      href: '/assessments-concepts',
      icon: Search
    },
    {
      title: 'Incident Management',
      description: 'Response planning, detection, and crisis procedures.',
      href: '/incident-management',
      icon: AlertTriangle
    },
    {
      title: 'Cyber Crisis Management',
      description: 'Crisis strategy and simulation exercises.',
      href: '/cyber-crisis-management',
      icon: Radio
    },
    {
      title: 'Arena Training, TIBER Test',
      description: 'Red team training and TIBER-EU/DE coordination.',
      href: '/arena-training',
      icon: Target
    },
    {
      title: 'Events & Workshops',
      description: 'Moderation, awareness training, and technical workshops.',
      href: '/events-workshops',
      icon: Calendar
    },
    {
      title: 'Publications & Training',
      description: 'Industry publications and certification programs.',
      href: '/publications',
      icon: FileText
    },
    {
      title: 'Virtual CISO',
      description: 'Flexible executive security leadership.',
      href: '/virtual-ciso',
      icon: UserCheck
    }
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Cybersecurity Consulting" description="Cybersecurity consulting for boards, audit, IT, and business stakeholders. ISMS, NIS-2, TISAX, incident management, and more." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-8">
          Cybersecurity Consulting
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Practical security consulting for boards, audit functions, IT departments, and business stakeholders – across strategy, compliance, and operational response.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                href={service.href}
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            ))}
          </div>
          
          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Users className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">270+</div>
              <div className="text-foreground font-sans">Clients Served</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Building2 className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">20+</div>
              <div className="text-foreground font-sans">Industry Sectors</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Award className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">35+</div>
              <div className="text-foreground font-sans">Years Combined Expertise</div>
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting/team', label: 'By Whom' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Consulting;