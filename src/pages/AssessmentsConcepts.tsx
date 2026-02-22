import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Search, Shield, Users, Calendar, BarChart } from 'lucide-react';

const AssessmentsConcepts = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('assessments.title')} description={t('assessments.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('assessments.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('assessments.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Search} title={t('assessments.threatTitle')} description={t('assessments.threatDesc')} />
            <ServiceCard icon={Shield} title={t('assessments.controlsTitle')} description={t('assessments.controlsDesc')} variant="highlight" />
            <ServiceCard icon={Users} title={t('assessments.rolesTitle')} description={t('assessments.rolesDesc')} />
            <ServiceCard icon={Calendar} title={t('assessments.planningTitle')} description={t('assessments.planningDesc')} variant="highlight" />
            <ServiceCard icon={BarChart} title={t('assessments.measureTitle')} description={t('assessments.measureDesc')} />
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

export default AssessmentsConcepts;
