import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { ShieldCheck, FileText, Search, Settings, Award, RotateCcw } from 'lucide-react';

const ISMS = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('isms.title')} description={t('isms.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('isms.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('isms.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={ShieldCheck} title={t('isms.iso27001Title')} description={t('isms.iso27001Desc')} />
            <ServiceCard icon={FileText} title={t('isms.bsiTitle')} description={t('isms.bsiDesc')} variant="highlight" />
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('isms.approachTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Search className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('isms.assessmentTitle')}</h3>
                    <p>{t('isms.assessmentDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Settings className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('isms.implementationTitle')}</h3>
                    <p>{t('isms.implementationDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Award className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('isms.certificationTitle')}</h3>
                    <p>{t('isms.certificationDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RotateCcw className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('isms.maintenanceTitle')}</h3>
                    <p>{t('isms.maintenanceDesc')}</p>
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

export default ISMS;
