import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Shield, Radio, Video, Award, Presentation, BookOpen } from 'lucide-react';

const Publications = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('publications.title')} description={t('publications.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('publications.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('publications.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Shield} title={t('publications.pub1Title')} description={t('publications.pub1Desc')}>
              <div className="mt-4">
                <a href="https://www.heise.de/select/ix/2021/10/2019809530193925811" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  {t('publications.readOnHeise')}
                </a>
              </div>
            </ServiceCard>
            
            <ServiceCard icon={Radio} title={t('publications.pub2Title')} description={t('publications.pub2Desc')} variant="highlight">
              <div className="mt-4">
                <a href="https://www.heise.de/select/ix/archiv/2015/7/seite-78" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  {t('publications.readOnHeise')}
                </a>
              </div>
            </ServiceCard>
            
            <ServiceCard icon={Video} title={t('publications.pub3Title')} description={t('publications.pub3Desc')}>
              <div className="mt-4">
                <a href="https://vimeo.com/295582173" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  {t('publications.watchOnVimeo')}
                </a>
              </div>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('publications.certTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Award className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('publications.isacaTitle')}</h3>
                    <p>{t('publications.isacaDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Presentation className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('publications.confTitle')}</h3>
                    <p>{t('publications.confDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BookOpen className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('publications.eduTitle')}</h3>
                    <p>{t('publications.eduDesc')}</p>
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

export default Publications;
