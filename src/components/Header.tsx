import { GeometricSymbol } from './GeometricSymbol';
import { useLanguage } from '@/i18n/LanguageContext';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-center md:justify-between">
          <a href="/" className="w-full md:w-auto flex items-center justify-center md:justify-start space-x-4 group">
            <GeometricSymbol size="sm" />
            <span className="text-primary text-xl font-mono group-hover:text-highlight transition-electric whitespace-nowrap text-center">inside-the-box.org</span>
          </a>
        
        <nav className="hidden md:flex space-x-4 items-center">
          <a href="/why" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            {t('nav.training')}
          </a>
          <a href="/consulting" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            {t('nav.consulting')}
          </a>
          <a href="/by-whom" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            {t('nav.byWhom')}
          </a>
          <a href="/contact" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">
            {t('nav.contact')}
          </a>
          <button
            onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
            className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-3 py-2 uppercase tracking-wider"
          >
            {language === 'en' ? 'DE' : 'EN'}
          </button>
        </nav>
      </div>
    </header>
  );
};
