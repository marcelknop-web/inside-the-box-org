import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { LinkButton } from '@/components/LinkButton';

const Consulting = () => {
  const services = [
    {
      title: 'ISMS ISO 27001, BSI GS',
      description: 'Information Security Management System implementation and certification according to ISO 27001 and BSI IT-Grundschutz standards.',
      href: '/isms'
    },
    {
      title: 'NIS-2, DORA, PART-IS',
      description: 'Network and Information Security Directive, Digital Operational Resilience Act, and PART-IS compliance consulting.',
      href: '/nis2-dora'
    },
    {
      title: 'TISAX, PCI-DSS',
      description: 'Trusted Information Security Assessment Exchange and Payment Card Industry Data Security Standard implementation.',
      href: '/tisax-pci-dss'
    },
    {
      title: 'Assessments & Concepts',
      description: 'Comprehensive security assessments and strategic cybersecurity concept development.',
      href: '/assessments-concepts'
    },
    {
      title: 'Incident Management',
      description: 'Security incident response planning, implementation, and crisis management procedures.',
      href: '/incident-management'
    },
    {
      title: 'Cyber Crisis Management',
      description: 'Crisis management strategy development and cyber crisis simulation exercises.',
      href: '/cyber-crisis-management'
    },
    {
      title: 'Arena Training, TIBER Test',
      description: 'Threat Intelligence-based Ethical Red Teaming and advanced cybersecurity training programs.',
      href: '/arena-training'
    },
    {
      title: 'Events & Workshops',
      description: 'Cybersecurity awareness workshops, training events, and educational seminars.',
      href: '/events-workshops'
    },
    {
      title: 'Publications, Trainings',
      description: 'Industry publications, thought leadership content, and specialized training programs.',
      href: '/publications'
    },
    {
      title: 'Virtual CISO',
      description: 'Outsourced Chief Information Security Officer services for strategic cybersecurity leadership.',
      href: '/virtual-ciso'
    }
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
          Cybersecurity Consulting
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Cybersecurity advisory services for risk management and compliance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary font-mono mb-2">350+</div>
              <div className="text-foreground/80 font-sans">Clients Successfully Served</div>
            </div>
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary font-mono mb-2">15+</div>
              <div className="text-foreground/80 font-sans">Industry Sectors</div>
            </div>
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary font-mono mb-2">35+</div>
              <div className="text-foreground/80 font-sans">Years Combined Expertise</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                href={service.href}
                title={service.title}
                description={service.description}
              />
            ))}
          </div>
          
          <div className="pt-8">
            <div className="flex justify-center lg:justify-between space-x-4">
              <LinkButton href="/consulting/team">By Whom?</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Consulting;