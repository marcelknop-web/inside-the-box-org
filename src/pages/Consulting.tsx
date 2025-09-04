import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { LinkButton } from '@/components/LinkButton';
import { Users, Building2, Award, ShieldCheck, Network, CreditCard, Search, AlertTriangle, Radio, Target, Calendar, FileText, UserCheck } from 'lucide-react';

const Consulting = () => {
  const services = [
    {
      title: 'ISMS ISO 27001, BSI GS',
      description: 'Information Security Management System implementation and certification according to ISO 27001 and BSI IT-Grundschutz standards.',
      href: '/isms',
      icon: ShieldCheck
    },
    {
      title: 'NIS-2, DORA, PART-IS',
      description: 'Network and Information Security Directive, Digital Operational Resilience Act, and PART-IS compliance consulting.',
      href: '/nis2-dora',
      icon: Network
    },
    {
      title: 'TISAX, PCI-DSS',
      description: 'Trusted Information Security Assessment Exchange and Payment Card Industry Data Security Standard implementation.',
      href: '/tisax-pci-dss',
      icon: CreditCard
    },
    {
      title: 'Assessments & Concepts',
      description: 'Comprehensive security assessments, penetration tests, and strategic cybersecurity concept development.',
      href: '/assessments-concepts',
      icon: Search
    },
    {
      title: 'Incident Management',
      description: 'Security incident response planning, implementation, and crisis management procedures.',
      href: '/incident-management',
      icon: AlertTriangle
    },
    {
      title: 'Cyber Crisis Management',
      description: 'Crisis management strategy development and cyber crisis simulation exercises.',
      href: '/cyber-crisis-management',
      icon: Radio
    },
    {
      title: 'Arena Training, TIBER Test',
      description: 'Threat Intelligence-based Ethical Red Teaming and advanced cybersecurity training programs.',
      href: '/arena-training',
      icon: Target
    },
    {
      title: 'Events & Workshops',
      description: 'Cybersecurity awareness workshops, training events, and educational seminars.',
      href: '/events-workshops',
      icon: Calendar
    },
    {
      title: 'Publications, Trainings',
      description: 'Industry publications, thought leadership content, and specialized training programs.',
      href: '/publications',
      icon: FileText
    },
    {
      title: 'Virtual CISO',
      description: 'Outsourced Chief Information Security Officer services for strategic cybersecurity leadership.',
      href: '/virtual-ciso',
      icon: UserCheck
    }
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Cybersecurity Consulting
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-2">
            Cybersecurity advisory services for risk management and compliance.
          </p>
          <p className="text-lg font-sans mb-8">
            On behalf of boards, internal and external audit, IT departments, and business stakeholders.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Users className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">270+</div>
              <div className="text-foreground/80 font-sans">Clients Served</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Building2 className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">20+</div>
              <div className="text-foreground/80 font-sans">Industry Sectors</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Award className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">35+</div>
              <div className="text-foreground/80 font-sans">Years Combined Expertise</div>
            </div>
          </div>
          
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
          
          <div className="pt-8">
            <div className="flex justify-between space-x-4">
              <LinkButton href="/consulting/team">By Whom</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Consulting;