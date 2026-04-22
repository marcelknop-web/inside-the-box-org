import { Helmet } from 'react-helmet-async';
import { PageMeta } from '@/components/PageMeta';
import { SiteChrome } from '@/components/SiteChrome';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * /impressum — Legal imprint + privacy notice.
 * Uses SiteChrome for shared header/footer/drawers.
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
        <h1 className="font-mono font-semibold text-3xl sm:text-4xl text-foreground leading-[1.1] mb-10">
          {t('imprint.title')}
        </h1>

        <div className="space-y-8 font-sans text-[15px] text-foreground/85 leading-relaxed">
          {/* Responsible */}
          <section>
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.responsible')}
            </h2>
            <p className="space-y-1">
              <span className="block font-medium text-foreground">Marcel Knop</span>
              <span className="block text-muted-foreground">inside-the-box.org</span>
              <span className="block text-muted-foreground">Bad Emstal, Deutschland</span>
            </p>
          </section>

          {/* Contact */}
          <section>
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
          </section>

          {/* Disclaimer */}
          <section className="border-t border-primary/10 pt-6">
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.disclaimer')}
            </h2>
            <p>{t('imprint.disclaimerText')}</p>
          </section>

          {/* Copyright */}
          <section className="border-t border-primary/10 pt-6">
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.copyright')}
            </h2>
            <p>{t('imprint.copyrightText')}</p>
          </section>

          {/* Data protection — short notice */}
          <section className="border-t border-primary/10 pt-6">
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
              {t('imprint.dataProtection')}
            </h2>
            <p>{t('imprint.dataProtectionText')}</p>
          </section>

          {/* Privacy notice */}
          <section className="border-t border-primary/10 pt-8 mt-4">
            <h2 className="font-mono font-semibold text-2xl sm:text-3xl text-foreground leading-[1.1] mb-6">
              {t('imprint.privacyTitle')}
            </h2>
            <p className="mb-6">{t('imprint.privacyIntro')}</p>

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
          </section>

          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/70 pt-6 border-t border-primary/10">
            {t('imprint.lastUpdatedPrefix')}{' '}
            {new Date(__BUILD_DATE__).toLocaleDateString(
              lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB',
              { year: 'numeric', month: 'long', day: 'numeric' },
            )}
          </p>
        </div>
      </main>
    </SiteChrome>
  );
};

export default Imprint;
