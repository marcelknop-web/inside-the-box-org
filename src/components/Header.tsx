import { GeometricSymbol } from './GeometricSymbol';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-center md:justify-between">
          <a href="/" className="w-full md:w-auto flex items-center justify-center md:justify-start space-x-4 group">
            <GeometricSymbol size="sm" />
            <span className="text-highlight text-xl font-bold font-mono group-hover:text-primary transition-electric whitespace-nowrap text-center">inside-the-box.org</span>
          </a>
        
        <nav className="hidden md:flex space-x-4 items-center">
          <a href="/why" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">
            {t('nav.training')}
          </a>
          <a href="/consulting" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">
            {t('nav.consulting')}
          </a>
          <a href="/by-whom" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">
            {t('nav.byWhom')}
          </a>
          <a href="/contact" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">
            {t('nav.contact')}
          </a>
          <button
            onClick={() => setLanguage(nextLanguage(language))}
            className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-3 py-2 uppercase tracking-wider"
          >
            {language.toUpperCase()}
          </button>
        </nav>
      </div>
    </header>
  );
};
