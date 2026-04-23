import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { PageMeta } from '@/components/PageMeta';

/**
 * /hero-day — Test-Seite: Day-Variante der Hero-Section.
 *
 * Standalone-Test, bewusst OHNE SiteChrome und ohne globale CSS-Variablen-
 * Änderungen. Alles was hier hell wirken soll, wird lokal als Inline-Styles
 * bzw. mit eigenen Klassen umgesetzt, damit die Original-Hero (dunkel)
 * unverändert bleibt.
 *
 * Idee: Tageslicht-Atmosphäre — warmes Off-White, weiches Lichtspiel von
 * oben links, dezentes Karo-Raster (statt grünlichem Tech-Grid), Gold als
 * Akzent bleibt, Text in dunklem Navy für Kontrast.
 */

const PHASE_TITLES: { de: string; en: string; fr: string }[] = [
  { de: 'VERSTEHEN', en: 'UNDERSTAND', fr: 'COMPRENDRE' },
  { de: 'AUSRICHTEN', en: 'ALIGN', fr: 'ALIGNER' },
  { de: 'FÜHREN', en: 'LEAD', fr: 'DIRIGER' },
  { de: 'TRAINIEREN', en: 'TRAIN', fr: 'ENTRAÎNER' },
  { de: 'REAGIEREN', en: 'RESPOND', fr: 'RÉAGIR' },
];

const HeroDay = () => {
  const { t, language } = useLanguage();
  const lang = language as 'en' | 'de' | 'fr';
  const enterCta = t('welcome.heroCta');

  return (
    <div
      className="min-h-screen w-full flex flex-col relative"
      style={{
        // Tag-Variante – Millimeterpapier in warmem Cream:
        //  • Basis: warmes Cream-Papier (#f5efe0 → #ede4cf), leicht vergilbt
        //  • Sanfter Lichtkegel oben-links (kühles Tageslicht-Weiß)
        //  • Cyan-Hauch unten-rechts als Gegengewicht zum Gold
        //  • Millimeterpapier-Raster in warmem Sepia-Ton:
        //      – feines 5px-Raster (sehr leise, „Millimeter")
        //      – mittleres 25px-Raster (etwas kräftiger, „halber Zentimeter")
        //      – grobes 50px-Raster (am sichtbarsten, „Zentimeter")
        color: '#1a2535',
        background: [
          'radial-gradient(ellipse at 12% -5%, rgba(255, 250, 235, 0.95) 0%, transparent 55%)',
          'radial-gradient(ellipse at 88% 105%, rgba(0, 188, 212, 0.08) 0%, transparent 55%)',
          'radial-gradient(ellipse at 70% 30%, rgba(245, 184, 0, 0.07) 0%, transparent 50%)',
          'linear-gradient(rgba(120, 95, 40, 0.06) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(120, 95, 40, 0.06) 1px, transparent 1px)',
          'linear-gradient(rgba(120, 95, 40, 0.10) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(120, 95, 40, 0.10) 1px, transparent 1px)',
          'linear-gradient(rgba(120, 95, 40, 0.16) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(120, 95, 40, 0.16) 1px, transparent 1px)',
          'linear-gradient(180deg, #f5efe0 0%, #ede4cf 100%)',
        ].join(', '),
        backgroundSize: [
          '100% 100%', '100% 100%', '100% 100%',
          '5px 5px', '5px 5px',
          '25px 25px', '25px 25px',
          '50px 50px', '50px 50px',
          '100% 100%',
        ].join(', '),
      }}
    >
      <PageMeta
        title="Hero · Day Variant (Test)"
        description="Tageslicht-Variante der Startseite — separater Test."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Test-Banner oben — klar als Test gekennzeichnet */}
      <div
        className="font-mono text-[10px] tracking-[0.3em] text-center py-2 border-b"
        style={{
          color: '#5a4a1a',
          background: 'rgba(245, 184, 0, 0.12)',
          borderColor: 'rgba(245, 184, 0, 0.3)',
        }}
      >
        / TEST · DAY VARIANT · /hero-day
      </div>

      {/* Top-Bar (vereinfachte Day-Version) */}
      <header className="border-b" style={{ borderColor: 'rgba(20, 28, 40, 0.08)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-3">
          <a
            href="/"
            className="flex-shrink-0 transition-opacity hover:opacity-80 font-mono font-semibold text-[13px] tracking-[0.2em]"
            style={{ color: '#1a2535' }}
            aria-label="inside-the-box"
          >
            INSIDE-THE-BOX
          </a>
          <div className="flex items-center gap-6 sm:gap-8 font-mono text-[10px] tracking-[0.3em]" style={{ color: '#4a5a72' }}>
            <span>TEAM</span>
            <span>{lang.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Hero-Inhalt */}
      <section className="flex-1 flex items-center justify-center px-5 sm:px-6 py-8 sm:py-14 max-w-5xl mx-auto w-full">
        <div className="w-full max-w-3xl text-center">
          {/* Category label */}
          <div
            className="font-mono text-[10px] sm:text-[13px] md:text-[14px] tracking-[0.3em] sm:tracking-[0.4em] mb-5 sm:mb-6 opacity-0 animate-fade-in"
            style={{ color: '#a07a00', animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            / {t('welcome.heroConsulting').toUpperCase()}
          </div>

          {/* Wordmark */}
          <h1
            className="font-mono font-semibold text-xl sm:text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] mb-6 sm:mb-8 opacity-0 animate-fade-in"
            style={{ color: '#1a2535', animationDelay: '180ms', animationFillMode: 'forwards' }}
          >
            {t('welcome.title')}
          </h1>

          {/* Claim */}
          <p
            className="font-sans font-light text-[20px] sm:text-3xl md:text-5xl leading-[1.2] tracking-[-0.01em] mb-5 opacity-0 animate-fade-in max-w-3xl mx-auto"
            style={{ color: '#1a2535', animationDelay: '420ms', animationFillMode: 'forwards' }}
          >
            {t('welcome.heroSubtitle')}
          </p>

          {/* Byline */}
          <p
            className="font-mono text-[10px] sm:text-[12px] tracking-[0.14em] sm:tracking-[0.18em] mb-10 sm:mb-12 opacity-0 animate-fade-in"
            style={{ color: '#6a7689', animationDelay: '780ms', animationFillMode: 'forwards' }}
          >
            {t('welcome.heroByline')}
          </p>

          {/* Phasen-Preview */}
          <div
            className="mb-10 sm:mb-12 opacity-0 animate-fade-in"
            style={{ animationDelay: '950ms', animationFillMode: 'forwards' }}
            aria-hidden
          >
            <div className="relative w-full max-w-2xl mx-auto pt-2 pb-4">
              <ul className="grid grid-cols-3 sm:grid-cols-5 gap-x-3 gap-y-3 sm:gap-2">
                {PHASE_TITLES.map((phase, idx) => {
                  const isFirstMobileRow = idx % 3 === 0;
                  const isFirstDesktopRow = idx === 0;
                  return (
                    <li key={idx} className="relative flex flex-col items-center text-center min-w-0">
                      {!isFirstMobileRow && (
                        <span
                          className="absolute h-px pointer-events-none top-[10px] sm:hidden"
                          style={{ right: 'calc(50% + 7px)', left: 'calc(-50% + 7px)', background: 'rgba(245, 184, 0, 0.45)' }}
                          aria-hidden
                        />
                      )}
                      {!isFirstDesktopRow && (
                        <span
                          className="absolute h-px pointer-events-none hidden sm:block top-[12px]"
                          style={{ right: 'calc(50% + 8px)', left: 'calc(-50% + 8px)', background: 'rgba(245, 184, 0, 0.45)' }}
                          aria-hidden
                        />
                      )}
                      <span className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 z-10 mb-1.5 sm:mb-2">
                        <span
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] rotate-45 border-[1.5px]"
                          style={{
                            borderColor: '#c89500',
                            background: '#fafaf6',
                            boxShadow: '0 1px 3px rgba(200, 149, 0, 0.25)',
                          }}
                          aria-hidden
                        />
                      </span>
                      <span
                        className="font-mono text-[10px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.18em] leading-[1.15] w-full px-0"
                        style={{ color: '#6a7689' }}
                      >
                        {phase[lang]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <a
            href="/"
            className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3.5 sm:py-4 max-w-full border font-mono text-[10px] sm:text-[14px] tracking-[0.16em] sm:tracking-[0.25em] leading-tight transition-all duration-300 opacity-0 animate-fade-in text-center"
            style={{
              animationDelay: '1200ms',
              animationFillMode: 'forwards',
              borderColor: 'rgba(200, 149, 0, 0.6)',
              background: 'rgba(245, 184, 0, 0.08)',
              color: '#7a5e00',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c89500';
              e.currentTarget.style.background = 'rgba(245, 184, 0, 0.18)';
              e.currentTarget.style.boxShadow = '0 8px 24px -10px rgba(200, 149, 0, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(200, 149, 0, 0.6)';
              e.currentTarget.style.background = 'rgba(245, 184, 0, 0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label={enterCta}
          >
            <span className="break-words">{enterCta.toUpperCase()}</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0 -translate-x-1 group-hover:translate-x-0 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'rgba(20, 28, 40, 0.08)', background: 'rgba(255, 255, 255, 0.4)' }}>
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-nowrap items-center justify-between gap-2.5 sm:gap-4 font-mono text-[9px] sm:text-[10px] tracking-[0.08em] sm:tracking-[0.22em]"
          style={{ color: '#6a7689' }}
        >
          <span className="whitespace-nowrap">
            <span className="hidden sm:inline">© {new Date().getFullYear()} </span>INSIDE-THE-BOX.ORG
          </span>
          <span className="uppercase">DAY VARIANT · TEST</span>
        </div>
      </footer>
    </div>
  );
};

export default HeroDay;
