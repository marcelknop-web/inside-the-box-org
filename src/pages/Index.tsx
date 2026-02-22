import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { AlertTriangle, Target, Users, Globe } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('index.title')} description={t('index.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-8">
          {t('index.title')}
        </h1>
        <p className="text-lg font-sans mb-12 text-foreground">
          {t('index.subtitle')}
        </p>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <InfoCard icon={AlertTriangle}>
            <p className="text-lg font-sans" dangerouslySetInnerHTML={{
              __html: t('index.card1').replace(/<span>/g, '<span class="text-primary font-semibold">')
            }} />
          </InfoCard>
          
          <InfoCard icon={Target}>
            <p className="text-lg font-sans" dangerouslySetInnerHTML={{
              __html: t('index.card2').replace(/<span>/g, '<span class="text-primary font-semibold">')
            }} />
          </InfoCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Target className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">40+</div>
              <div className="text-foreground font-sans">{t('index.trainingsDelivered')}</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Users className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">350+</div>
              <div className="text-foreground font-sans">{t('index.peopleTrained')}</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Globe className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">6</div>
              <div className="text-foreground font-sans">{t('index.countriesCovered')}</div>
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/training', label: t('index.howButton') },
            { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
