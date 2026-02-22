import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Crown, Settings, CheckSquare, DollarSign, Zap, Award, UserCheck } from 'lucide-react';

const VirtualCISO = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('vciso.title')} description={t('vciso.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('vciso.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('vciso.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Crown} title={t('vciso.stratTitle')} description={t('vciso.stratDesc')} />
            <ServiceCard icon={Settings} title={t('vciso.opsTitle')} description={t('vciso.opsDesc')} variant="primary" />
            <ServiceCard icon={CheckSquare} title={t('vciso.compTitle')} description={t('vciso.compDesc')} />
            
            <InfoCard variant="highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('vciso.modelTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <UserCheck className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('vciso.flexible')}</h3>
                    <p>{t('vciso.flexibleDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <DollarSign className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('vciso.costEffective')}</h3>
                    <p>{t('vciso.costEffectiveDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('vciso.immediate')}</h3>
                    <p>{t('vciso.immediateDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="text-highlight mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('vciso.experienced')}</h3>
                    <p>{t('vciso.experiencedDesc')}</p>
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

export default VirtualCISO;
