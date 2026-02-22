import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Search, TrendingUp, Shield, Building2, Landmark, Plane } from 'lucide-react';

const NIS2DORA = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('nis2.title')} description={t('nis2.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('nis2.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('nis2.intro')}</p>
          
          <div className="space-y-6">
            <InfoCard icon={Search} variant="primary">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('nis2.impactTitle')}</h2>
              <p className="text-base text-foreground font-sans">{t('nis2.impactDesc')}</p>
            </InfoCard>
            
            <InfoCard icon={TrendingUp} variant="primary">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('nis2.gapTitle')}</h2>
              <p className="text-base text-foreground font-sans">{t('nis2.gapDesc')}</p>
            </InfoCard>
            
            <InfoCard icon={Shield} variant="primary">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('nis2.measuresTitle')}</h2>
              <p className="text-base text-foreground font-sans">{t('nis2.measuresDesc')}</p>
            </InfoCard>
            
            <InfoCard variant="subtle-highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('nis2.frameworkTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Building2 className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('nis2.nis2Name')}</h3>
                    <p>{t('nis2.nis2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Landmark className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('nis2.doraName')}</h3>
                    <p>{t('nis2.doraDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Plane className="text-highlight mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('nis2.partisName')}</h3>
                    <p>{t('nis2.partisDesc')}</p>
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

export default NIS2DORA;
