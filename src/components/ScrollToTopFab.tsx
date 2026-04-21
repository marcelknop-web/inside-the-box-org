import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Subtle scroll-to-top FAB. Listens to scroll events globally (capture
 * phase) so it works for both window scroll and the app's inner
 * scrollable container. Anchored bottom-right with iOS safe-area padding
 * so it sits just above the chat bar.
 */
export function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    let raf = 0;
    const check = () => {
      let max = window.scrollY || document.documentElement.scrollTop || 0;
      const els = document.querySelectorAll<HTMLElement>('[class*="overflow-y"], main, .flex-1');
      for (let i = 0; i < els.length; i++) {
        if (els[i].scrollTop > max) max = els[i].scrollTop;
      }
      setVisible(max > 600);
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Reset any scrolled inner containers
    document.querySelectorAll<HTMLElement>('div').forEach((el) => {
      if (el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const label =
    language === 'de' ? 'Nach oben' : language === 'fr' ? 'Haut de page' : 'Back to top';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={scrollToTop}
      className={`fixed z-50 right-3 md:right-4 h-10 w-10 rounded-full
        bg-secondary/90 backdrop-blur-md border border-primary/40 text-primary
        shadow-[0_4px_20px_hsl(216_50%_3%/0.6)] hover:border-primary/70
        hover:bg-secondary hover:text-primary transition-all duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
    >
      <ArrowUp size={16} className="mx-auto" />
    </button>
  );
}
