import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Subtle scroll-to-top FAB. Appears after the user has scrolled
 * past 600px in either the window OR the app's main scrollable container.
 * Anchored bottom-right with iOS safe-area padding so it sits just above
 * the chat bar.
 */
export function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // The app uses an internal scrollable container (flex layout) on
    // desktop, but the window itself scrolls on small viewports. Listen
    // to both and any element matching common scroll-container patterns.
    const getScrollY = (): number => {
      let max = window.scrollY || 0;
      // Walk all elements and pick the largest scrollTop — covers both
      // window scroll and inner overflow-y containers.
      const els = document.querySelectorAll<HTMLElement>('div');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el.scrollTop > max) max = el.scrollTop;
      }
      return max;
    };

    const onScroll = () => setVisible(getScrollY() > 600);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as any);
      document.removeEventListener('scroll', onScroll, { capture: true } as any);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also reset any inner scroll containers
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
