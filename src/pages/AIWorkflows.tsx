import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Zap, FileCheck, Search, Gamepad2 } from 'lucide-react';

const AIWorkflows = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('aiWorkflows.title')} description={t('aiWorkflows.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('aiWorkflows.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('aiWorkflows.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Zap} title={t('aiWorkflows.irTitle')} description={t('aiWorkflows.irDesc')} />
            <ServiceCard icon={FileCheck} title={t('aiWorkflows.policyTitle')} description={t('aiWorkflows.policyDesc')} variant="highlight" />
            <ServiceCard icon={Search} title={t('aiWorkflows.auditTitle')} description={t('aiWorkflows.auditDesc')} />
            <ServiceCard icon={Gamepad2} title={t('aiWorkflows.crisisTitle')} description={t('aiWorkflows.crisisDesc')} variant="highlight" />
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

export default AIWorkflows;
