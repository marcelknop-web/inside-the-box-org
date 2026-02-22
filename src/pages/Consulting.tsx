import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Users, Building2, Award, ShieldCheck, Network, CreditCard, Search, AlertTriangle, Radio, Target, Calendar, FileText, UserCheck } from 'lucide-react';

const Consulting = () => {
  const { t } = useLanguage();

  const services = [
    { title: t('consulting.ismsTitle'), description: t('consulting.ismsDesc'), href: '/isms', icon: ShieldCheck },
    { title: t('consulting.nis2Title'), description: t('consulting.nis2Desc'), href: '/nis2-dora', icon: Network },
    { title: t('consulting.tisaxTitle'), description: t('consulting.tisaxDesc'), href: '/tisax-pci-dss', icon: CreditCard },
    { title: t('consulting.assessTitle'), description: t('consulting.assessDesc'), href: '/assessments-concepts', icon: Search },
    { title: t('consulting.incidentTitle'), description: t('consulting.incidentDesc'), href: '/incident-management', icon: AlertTriangle },
    { title: t('consulting.crisisTitle'), description: t('consulting.crisisDesc'), href: '/cyber-crisis-management', icon: Radio },
    { title: t('consulting.arenaTitle'), description: t('consulting.arenaDesc'), href: '/arena-training', icon: Target },
    { title: t('consulting.eventsTitle'), description: t('consulting.eventsDesc'), href: '/events-workshops', icon: Calendar },
    { title: t('consulting.pubTitle'), description: t('consulting.pubDesc'), href: '/publications', icon: FileText },
    { title: t('consulting.vcisoTitle'), description: t('consulting.vcisoDesc'), href: '/virtual-ciso', icon: UserCheck },
  ];

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('consulting.title')} description={t('consulting.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-8">
          {t('consulting.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            {t('consulting.intro')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} href={service.href} icon={service.icon} title={service.title} description={service.description} />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Users className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">270+</div>
              <div className="text-foreground font-sans">{t('consulting.clientsServed')}</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Building2 className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">20+</div>
              <div className="text-foreground font-sans">{t('consulting.industrySectors')}</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Award className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">35+</div>
              <div className="text-foreground font-sans">{t('consulting.yearsCombined')}</div>
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting/team', label: t('nav.byWhom') },
            { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Consulting;
