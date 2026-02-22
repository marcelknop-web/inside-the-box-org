import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

export const Footer = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const isImprintPage = location.pathname === '/imprint';
  
  return (
    <footer className="py-6 mt-16">
      <div className="container mx-auto px-6">
        <div className="flex justify-center items-center space-x-6">
          {!isImprintPage && (
            <a 
              href="/imprint" 
              className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-16 py-2"
            >
              {t('footer.imprint')}
            </a>
          )}
          {isImprintPage && (
            <p className="text-foreground text-sm font-mono">
              {t('imprint.lastUpdated')}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};
