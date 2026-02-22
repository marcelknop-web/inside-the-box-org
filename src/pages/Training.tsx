import { TrainingCard } from '@/components/TrainingCard';
import { MethodIcon } from '@/components/MethodIcon';
import { PageLayout } from '@/components/PageLayout';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Server, AlertTriangle, Bug, Shield, AlertCircle, MessageSquare } from 'lucide-react';

const Training = () => {
  const { t } = useLanguage();

  const trainingTopics = [
    { title: t('training.hostForensics'), description: t('training.hostForensicsDesc'), icon: Server },
    { title: t('training.malwareAnalysis'), description: t('training.malwareAnalysisDesc'), icon: Bug },
    { title: t('training.siem'), description: t('training.siemDesc'), icon: Shield },
    { title: t('training.incidentMgmt'), description: t('training.incidentMgmtDesc'), icon: AlertCircle },
    { title: t('training.crisisMgmt'), description: t('training.crisisMgmtDesc'), icon: AlertTriangle },
    { title: t('training.crisisComm'), description: t('training.crisisCommDesc'), icon: MessageSquare },
  ];

  return (
    <PageLayout>
      <div className="space-y-12">
        <PageMeta title={t('training.title')} description={t('training.metaDesc')} />
        <div>
          <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-6">
            {t('training.title')}
          </h1>
          <p className="text-lg font-sans">
            {t('training.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingTopics.map((topic, index) => (
            <div key={index} className="flex">
              <TrainingCard title={topic.title} description={topic.description} icon={topic.icon} className="flex-1" />
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-highlight text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-6">
            {t('training.methodsTitle')}
          </h2>
          <p className="text-lg font-sans mb-8">
            {t('training.methodsSubtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MethodIcon type="knowledge" title={t('training.knowledgeTransfer')} description={t('training.knowledgeTransferDesc')} />
            <MethodIcon type="group" title={t('training.groupExercises')} description={t('training.groupExercisesDesc')} />
            <MethodIcon type="cyber" title={t('training.liveCyberAttacks')} description={t('training.liveCyberAttacksDesc')} />
          </div>
        </section>
          
        <PageNavButtons buttons={[
          { href: '/by-whom', label: t('nav.byWhom') },
          { href: '/technical-requirements', label: t('training.techRequirements') },
          { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
        ]} />
      </div>
    </PageLayout>
  );
};

export default Training;
