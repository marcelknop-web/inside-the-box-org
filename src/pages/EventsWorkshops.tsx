import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Mic, Users, Award, Presentation, Wrench, GraduationCap } from 'lucide-react';

const EventsWorkshops = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('events.title')} description={t('events.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('events.title')}</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img src="/lovable-uploads/fc4cff06-0e9d-41c4-bac3-73a041a924b3.png" alt="Cybersecurity Training Presentation" className="w-full h-24 sm:h-32 object-cover" />
          </div>
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img src="/lovable-uploads/f463db5a-733d-4e4e-b151-d3e33ebe8997.png" alt="Training Room Session" className="w-full h-24 sm:h-32 object-cover" />
          </div>
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img src="/lovable-uploads/48ad82c3-84e8-4161-93d5-d79b509f7cc4.png" alt="Conference Presentation" className="w-full h-24 sm:h-32 object-cover" />
          </div>
        </div>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('events.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Mic} title={t('events.moderationTitle')} description={t('events.moderationDesc')} />
            <ServiceCard icon={Users} title={t('events.workshopsTitle')} description={t('events.workshopsDesc')} variant="highlight" />
            <ServiceCard icon={Award} title={t('events.referencesTitle')} description={t('events.referencesDesc')}>
              <div className="text-base text-foreground font-sans leading-relaxed mt-4">
                <p>Beamtenbund · Bechtle · Bitkom · BSI · CDU · DENIC · DDPS (CH) · DIIR · DWT · Fast Lane · Euroforum · HPI · IIR · ISACA · Management Circle · SoftwareONE · Bundeswehr University · University of Giessen</p>
              </div>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('events.eventTypesTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Presentation className="text-primary" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">{t('events.conferences')}</h3>
                  <p>{t('events.conferencesDesc')}</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Wrench className="text-primary" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">{t('events.workshops')}</h3>
                  <p>{t('events.workshopsDescShort')}</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <GraduationCap className="text-primary" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">{t('events.seminars')}</h3>
                  <p>{t('events.seminarsDesc')}</p>
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

export default EventsWorkshops;
