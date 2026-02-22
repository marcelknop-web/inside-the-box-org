import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { ClipboardList, Zap, Target, Crown, MessageSquare, Users, Gamepad2, Monitor, ShieldCheck, Users2, Lightbulb } from 'lucide-react';

const CyberCrisisManagement = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('cyberCrisis.title')} description={t('cyberCrisis.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('cyberCrisis.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('cyberCrisis.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={ClipboardList} title={t('cyberCrisis.planTitle')} description={t('cyberCrisis.planDesc')} />
            <ServiceCard icon={Zap} title={t('cyberCrisis.scenarioTitle')} description={t('cyberCrisis.scenarioDesc')} variant="highlight" />
            <ServiceCard icon={Target} title={t('cyberCrisis.simTitle')} description={t('cyberCrisis.simDesc')} />
            <ServiceCard icon={Crown} title={t('cyberCrisis.leaderTitle')} description={t('cyberCrisis.leaderDesc')} variant="highlight" />
            <ServiceCard icon={MessageSquare} title={t('cyberCrisis.commTitle')} description={t('cyberCrisis.commDesc')} />
            
            <InfoCard variant="highlight">
              <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('cyberCrisis.methTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Users className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">{t('cyberCrisis.tabletop')}</h3>
                  <p>{t('cyberCrisis.tabletopDesc')}</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Gamepad2 className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">{t('cyberCrisis.liveSim')}</h3>
                  <p>{t('cyberCrisis.liveSimDesc')}</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Monitor className="text-highlight" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">{t('cyberCrisis.cyberRange')}</h3>
                  <p>{t('cyberCrisis.cyberRangeDesc')}</p>
                </div>
              </div>
            </InfoCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">{t('cyberCrisis.outcomesTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground font-sans">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('cyberCrisis.readiness')}</h3>
                    <p>{t('cyberCrisis.readinessDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users2 className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('cyberCrisis.coordination')}</h3>
                    <p>{t('cyberCrisis.coordinationDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lightbulb className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('cyberCrisis.leadership')}</h3>
                    <p>{t('cyberCrisis.leadershipDesc')}</p>
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

export default CyberCrisisManagement;
