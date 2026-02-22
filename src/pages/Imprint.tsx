import { PageLayout } from '@/components/PageLayout';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';

const Imprint = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('imprint.title')} description={t('imprint.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('imprint.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <div className="space-y-4">
            <p className="text-lg font-sans">
              <span className="text-primary font-semibold">{t('imprint.responsible')}</span><br />
              Marcel Knop<br />
              Appenrother Weg 14<br />
              34308 Bad Emstal, Germany
            </p>
            
            <p className="text-lg font-sans">
              <span className="text-primary font-semibold">{t('imprint.contactLabel')}</span><br />
              <a href="mailto:marcel@inside-the-box.org" className="text-foreground hover:text-primary transition-electric">marcel@inside-the-box.org</a><br />
              <a href="tel:+4915205691648" className="text-foreground hover:text-primary transition-electric">+49 1520 569 1648</a>
            </p>
            
            <p className="text-lg font-sans">
              <span className="text-primary font-semibold">{t('imprint.vatId')}</span> DE328906053
            </p>
            
            <p className="text-lg font-sans">
              <span className="text-primary font-semibold">{t('imprint.insurance')}</span><br />
              Hiscox SA<br />
              Arnulfstr. 31<br />
              80636 Munich, Germany
            </p>
          </div>
          
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h2 className="text-primary text-xl font-bold font-mono mb-4">{t('imprint.disclaimer')}</h2>
            <p className="text-base text-foreground font-sans">{t('imprint.disclaimerText')}</p>
          </div>
          
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h2 className="text-primary text-xl font-bold font-mono mb-4">{t('imprint.copyright')}</h2>
            <p className="text-base text-foreground font-sans">{t('imprint.copyrightText')}</p>
          </div>
          
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h2 className="text-primary text-xl font-bold font-mono mb-4">{t('imprint.dataProtection')}</h2>
            <p className="text-base text-foreground font-sans">{t('imprint.dataProtectionText')}</p>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/training', label: t('nav.training') },
            { href: '/consulting', label: t('nav.consulting') },
            { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Imprint;
