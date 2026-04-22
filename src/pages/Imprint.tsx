import { Helmet } from 'react-helmet-async';
import { PageMeta } from '@/components/PageMeta';
import { SiteChrome } from '@/components/SiteChrome';
import { useLanguage } from '@/i18n/LanguageContext';
import TypedSection from '@/components/TypedSection';

/**
 * /impressum — Legal imprint + privacy notice.
 * Uses SiteChrome for shared header/footer/drawers.
 *
 * The page reuses the same TypedSection + StaggerReveal pattern as the
 * service sub-pages (ChatView), so the title types in, then the intro,
 * then the legal blocks reveal one after another. This keeps the entrance
 * choreography identical across the journey.
 *
 * Link convention on this page (and across the site):
 *   • Inline prose links (email, phone, body links) ALWAYS carry an underline
 *     and use `text-primary` with subtle decoration that strengthens on hover.
 *     Focus state shows a ring matching the brand color for accessibility.
 *   • Navigation/chrome links (header, footer) NEVER carry an underline; they
 *     use the muted color and shift to `text-primary` on hover/focus.
 *
 * The shared `inlineLink` class below is the single source of truth so all
 * inline anchors render identically in default, hover and focus states.
 */
const inlineLink =
  'text-primary underline underline-offset-2 decoration-primary/40 ' +
  'hover:decoration-primary focus-visible:decoration-primary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'rounded-sm transition-colors';

/**
 * Replace any literal `marcel@inside-the-box.org` occurrence inside a translated
 * string with a clickable, consistently-styled inline link. Keeps i18n strings
 * free of markup while guaranteeing one visual treatment for the email.
 */
const renderWithEmailLink = (text: string) => {
  const email = 'marcel@inside-the-box.org';
  if (!text.includes(email)) return text;
  const parts = text.split(email);
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [
          <span key={`p-${i}`}>{part}</span>,
          <a key={`l-${i}`} href={`mailto:${email}`} className={inlineLink}>
            {email}
          </a>,
        ]
      : [<span key={`p-${i}`}>{part}</span>],
  );
};

const Imprint = () => {
  const { t, language } = useLanguage();
  const lang = language as 'en' | 'de' | 'fr';

  const sectionLabel =
    lang === 'de' ? '/ IMPRESSUM' : lang === 'fr' ? '/ MENTIONS LÉGALES' : '/ IMPRINT';

  // Block style mirrors the bg-card/40 panels used on the service sub-pages
  // so the visual rhythm matches once each block reveals.
  const blockClass =
    'bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed';

  return (
    <SiteChrome>
      <PageMeta title={t('imprint.title')} description={t('imprint.metaDesc')} />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-14 max-w-3xl mx-auto w-full">
        <div className="font-mono text-[11px] sm:text-[13px] tracking-[0.4em] text-primary mb-6">
          {sectionLabel}
        </div>

        <TypedSection
          title={t('imprint.title')}
          mode="typewriter"
          intro={<p>{t('imprint.privacyIntro')}</p>}
        >
          {/* Responsible */}
          <div className={blockClass}>
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.responsible')}
            </h2>
            <p className="space-y-1">
              <span className="block font-medium text-foreground">Marcel Knop</span>
              <span className="block text-muted-foreground">Appenrother Weg 14</span>
              <span className="block text-muted-foreground">34308 Bad Emstal, Deutschland</span>
            </p>
          </div>

          {/* Contact */}
          <div className={blockClass}>
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.contactLabel')}
            </h2>
            <p className="space-y-1">
              <span className="block">
                <a href="mailto:marcel@inside-the-box.org" className={inlineLink}>
                  marcel@inside-the-box.org
                </a>
              </span>
              <span className="block">
                <a href="tel:+4915205691648" className={inlineLink}>
                  +49 1520 569 1648
                </a>
              </span>
            </p>
          </div>

          {/* Disclaimer */}
          <div className={blockClass}>
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.disclaimer')}
            </h2>
            <p>{t('imprint.disclaimerText')}</p>
          </div>

          {/* Copyright */}
          <div className={blockClass}>
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.copyright')}
            </h2>
            <p>{t('imprint.copyrightText')}</p>
          </div>

          {/* Data protection — short notice */}
          <div className={blockClass}>
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.dataProtection')}
            </h2>
            <p>{t('imprint.dataProtectionText')}</p>
          </div>

          {/* Privacy notice — multi-section block */}
          <div className={blockClass}>
            <h2 className="font-mono font-semibold text-2xl sm:text-3xl text-foreground leading-[1.1] mb-6">
              {t('imprint.privacyTitle')}
            </h2>

            <div className="space-y-5">
              <div>
                <h3 className="font-mono text-[11px] tracking-[0.25em] text-primary/80 uppercase mb-2">
                  {t('imprint.privacyHostingTitle')}
                </h3>
                <p>{t('imprint.privacyHosting')}</p>
              </div>
              <div>
                <h3 className="font-mono text-[11px] tracking-[0.25em] text-primary/80 uppercase mb-2">
                  {t('imprint.privacyContactTitle')}
                </h3>
                <p>{t('imprint.privacyContact')}</p>
              </div>
              <div>
                <h3 className="font-mono text-[11px] tracking-[0.25em] text-primary/80 uppercase mb-2">
                  {t('imprint.privacyToolsTitle')}
                </h3>
                <p>{t('imprint.privacyTools')}</p>
              </div>
              <div>
                <h3 className="font-mono text-[11px] tracking-[0.25em] text-primary/80 uppercase mb-2">
                  {t('imprint.privacyCookiesTitle')}
                </h3>
                <p>{t('imprint.privacyCookies')}</p>
              </div>
              <div>
                <h3 className="font-mono text-[11px] tracking-[0.25em] text-primary/80 uppercase mb-2">
                  {t('imprint.privacyRightsTitle')}
                </h3>
                <p>{renderWithEmailLink(t('imprint.privacyRights'))}</p>
              </div>
            </div>
          </div>

          {/* Last updated footer line */}
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/70 pt-2">
            {t('imprint.lastUpdatedPrefix')}{' '}
            {new Date(__BUILD_DATE__).toLocaleDateString(
              lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB',
              { year: 'numeric', month: 'long', day: 'numeric' },
            )}
          </p>
        </TypedSection>
      </main>
    </SiteChrome>
  );
};

export default Imprint;
