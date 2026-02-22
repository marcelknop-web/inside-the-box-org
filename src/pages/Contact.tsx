import { PageLayout } from '@/components/PageLayout';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Phone, Mail } from 'lucide-react';

const Contact = () => {
  const { t } = useLanguage();

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('contact.title')} description={t('contact.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('contact.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans">
            {t('contact.intro')}
          </p>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Phone size={24} className="text-primary" />
                <h3 className="text-primary text-lg font-semibold">{t('contact.phone')}</h3>
              </div>
              <div className="space-y-2 text-base sm:text-lg">
                <p><a href="tel:+4915205691648" className="text-foreground hover:text-highlight transition-electric">+49 1520 569 1648</a></p>
              </div>
            </div>
            
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Mail size={24} className="text-primary" />
                <h3 className="text-primary text-lg font-semibold">{t('contact.email')}</h3>
              </div>
              <div className="space-y-2 text-base sm:text-lg">
                <p><a href="mailto:marcel@inside-the-box.org" className="text-foreground hover:text-highlight transition-electric">marcel@inside-the-box.org</a></p>
              </div>
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/why', label: t('contact.viewTraining') },
            { href: '/consulting', label: t('contact.viewConsulting') },
            { href: '/imprint', label: t('contact.imprint'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Contact;
