import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Settings, CheckCircle, FileCheck, Car, CreditCard } from 'lucide-react';

const TISAXPCIDSS = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('tisax.title')} description={t('tisax.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('tisax.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('tisax.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Settings} title={t('tisax.implTitle')} description={t('tisax.implDesc')} />
            <ServiceCard icon={CheckCircle} title={t('tisax.reviewsTitle')} description={t('tisax.reviewsDesc')} variant="highlight" />
            <ServiceCard icon={FileCheck} title={t('tisax.auditTitle')} description={t('tisax.auditDesc')} />
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('tisax.frameworkTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Car className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('tisax.tisaxName')}</h3>
                    <p>{t('tisax.tisaxDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CreditCard className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('tisax.pciName')}</h3>
                    <p>{t('tisax.pciDesc')}</p>
                  </div>
                </div>
              </div>
            </InfoCard>
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

export default TISAXPCIDSS;
