import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { FileText, Eye, Shield, RefreshCw, GraduationCap } from 'lucide-react';

const IncidentManagement = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('incident.title')} description={t('incident.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('incident.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('incident.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={FileText} title={t('incident.planTitle')} description={t('incident.planDesc')} />
            <ServiceCard icon={Eye} title={t('incident.detectionTitle')} description={t('incident.detectionDesc')} variant="highlight" />
            <ServiceCard icon={Shield} title={t('incident.containTitle')} description={t('incident.containDesc')} />
            <ServiceCard icon={RefreshCw} title={t('incident.recoveryTitle')} description={t('incident.recoveryDesc')} variant="highlight" />
            <ServiceCard icon={GraduationCap} title={t('incident.simTitle')} description={t('incident.simDesc')} />
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting', label: t('common.allConsulting') },
            { href: '/consulting/team', label: t('nav.byWhom') },
            { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default IncidentManagement;
