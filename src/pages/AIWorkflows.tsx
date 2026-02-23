import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Zap, FileCheck, Search, Gamepad2, Rocket } from 'lucide-react';

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="mt-3 space-y-1.5 text-sm sm:text-base text-foreground">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2">
        <span className="text-primary mt-1 flex-shrink-0">▸</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const ResultBadge = ({ text }: { text: string }) => (
  <p className="mt-3 text-sm font-semibold text-highlight font-mono">{text}</p>
);

const AIWorkflows = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('aiWorkflows.title')} description={t('aiWorkflows.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">{t('aiWorkflows.title')}</h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('aiWorkflows.intro')}</p>
          
          <div className="space-y-6">
            <ServiceCard icon={Zap} title={t('aiWorkflows.irTitle')} description={t('aiWorkflows.irDesc')}>
              <BulletList items={[t('aiWorkflows.irBullet1'), t('aiWorkflows.irBullet2'), t('aiWorkflows.irBullet3')]} />
              <ResultBadge text={t('aiWorkflows.irResult')} />
            </ServiceCard>

            <ServiceCard icon={FileCheck} title={t('aiWorkflows.policyTitle')} description={t('aiWorkflows.policyDesc')} variant="highlight">
              <BulletList items={[t('aiWorkflows.policyBullet1'), t('aiWorkflows.policyBullet2'), t('aiWorkflows.policyBullet3')]} />
              <ResultBadge text={t('aiWorkflows.policyResult')} />
            </ServiceCard>

            <ServiceCard icon={Search} title={t('aiWorkflows.auditTitle')} description={t('aiWorkflows.auditDesc')}>
              <BulletList items={[t('aiWorkflows.auditBullet1'), t('aiWorkflows.auditBullet2'), t('aiWorkflows.auditBullet3')]} />
              <ResultBadge text={t('aiWorkflows.auditResult')} />
            </ServiceCard>

            <ServiceCard icon={Gamepad2} title={t('aiWorkflows.crisisTitle')} description={t('aiWorkflows.crisisDesc')} variant="highlight">
              <BulletList items={[t('aiWorkflows.crisisBullet1'), t('aiWorkflows.crisisBullet2'), t('aiWorkflows.crisisBullet3')]} />
              <ResultBadge text={t('aiWorkflows.crisisResult')} />
            </ServiceCard>
          </div>

          <ServiceCard icon={Rocket} title={t('aiWorkflows.ctaTitle')} description={t('aiWorkflows.ctaDesc')} variant="highlight" />
          
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

export default AIWorkflows;
