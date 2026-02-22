import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Target, Flag, Gamepad2, Users, Crosshair, CheckSquare } from 'lucide-react';

const ArenaTraining = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('arena.title')} description={t('arena.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('arena.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('arena.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Target} title={t('arena.arenaTitle')} description={t('arena.arenaDesc')} />
            <ServiceCard icon={Flag} title={t('arena.tiberTitle')} description={t('arena.tiberDesc')} variant="highlight" />
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('arena.methTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <Gamepad2 className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('arena.realisticTitle')}</h3>
                    <p>{t('arena.realisticDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Crosshair className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('arena.handsOnTitle')}</h3>
                    <p>{t('arena.handsOnDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('arena.teamTitle')}</h3>
                    <p>{t('arena.teamDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckSquare className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('arena.regulatoryTitle')}</h3>
                    <p>{t('arena.regulatoryDesc')}</p>
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

export default ArenaTraining;
