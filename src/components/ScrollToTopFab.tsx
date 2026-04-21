import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Subtle scroll-to-top FAB. Appears after the user has scrolled
 * past 600px. Anchored bottom-right with iOS safe-area padding so
 * it never collides with the chat bar (which sits bottom-left/center).
 */
export function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const label =
    lang === 'de' ? 'Nach oben' : lang === 'fr' ? 'Haut de page' : 'Back to top';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed z-40 right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] h-10 w-10 rounded-full
        bg-secondary/85 backdrop-blur-md border border-primary/30 text-primary
        shadow-[0_4px_20px_hsl(216_50%_3%/0.6)] hover:border-primary/60
        hover:bg-secondary/95 transition-all duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
    >
      <ArrowUp size={16} className="mx-auto" />
    </button>
  );
}
