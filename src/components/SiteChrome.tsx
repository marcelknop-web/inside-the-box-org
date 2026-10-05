import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Languages, Menu, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { PublicWorkspace, isWorkspacePath } from '@/components/PublicWorkspace';

const ChromeContext = createContext(false);

/** Layout route: keeps one SiteChrome mounted across public sub-pages. */
export const PublicFrame = ({ children }: { children: ReactNode }) => <SiteChrome>{children}</SiteChrome>;

/**
 * Shared site chrome (top bar + footer + legal drawer) used by the
 * Overview homepage and every service sub-page reachable from it. Keeps the
 * brand surface identical across the journey.
 *
 * `onBrandClick` is optional — pages that have an in-page reset (e.g. Overview's
 * hero) can hook into it. By default the brand link navigates to `/`.
 */
const LANGUAGE_NAMES = { de: 'Deutsch', en: 'English', fr: 'Français' } as const;

export const SiteChrome = ({
  children,
  onBrandClick,
  hideLanguageSwitch,
  activeSection,
  workspace,
}: {
  children: ReactNode;
  onBrandClick?: () => void;
  /** Hide the language switcher (for English-only pages like GapZero). */
  hideLanguageSwitch?: boolean;
  activeSection?: 'services' | 'knowledge' | 'team' | 'contact';
  /** Force the stable sub-page workspace (e.g. public tool introductions). */
  workspace?: boolean;
}) => {
  const nested = useContext(ChromeContext);
  if (nested) return <>{children}</>;
  return <ChromeFrame onBrandClick={onBrandClick} hideLanguageSwitch={hideLanguageSwitch} activeSection={activeSection} workspace={workspace}>{children}</ChromeFrame>;
};

const ChromeFrame = ({
  children,
  onBrandClick,
  hideLanguageSwitch,
  activeSection,
  workspace,
}: {
  children: ReactNode;
  onBrandClick?: () => void;
  hideLanguageSwitch?: boolean;
  activeSection?: 'services' | 'knowledge' | 'team' | 'contact';
  workspace?: boolean;
}) => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState<'imprint' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lang = language as 'en' | 'de' | 'fr';
  const inWorkspace = Boolean(workspace) || isWorkspacePath(location.pathname);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty('--site-header-h', `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const footerImprintLabel =
    lang === 'de' ? 'Impressum' : lang === 'fr' ? 'Mentions légales' : 'Imprint';
  const footerContactLabel =
    lang === 'de' ? 'Kontakt' : lang === 'fr' ? 'Contact' : 'Contact';

  const handleBrand = () => {
    if (onBrandClick) onBrandClick();
    // Navigate to the homepage hero (opener). On sub-pages, clicking the
    // logo should always feel like "back to the start" — not jump straight
    // into the journey-map.
    else navigate('/');
  };

  // Footer brand link: always go back to the hero opener (no skipHero flag),
  // so clicking the wordmark in the footer feels like "back to the start".
  const handleFooterBrand = () => {
    navigate('/');
  };

  const isCurrent = (section: NonNullable<typeof activeSection>) => activeSection === section || (section === 'knowledge' && ['/publications','/ki-lab'].includes(location.pathname)) || (section === 'services' && inWorkspace && !['/publications','/ki-lab','/team','/contact'].includes(location.pathname)) || (section === 'team' && location.pathname === '/team') || (section === 'contact' && location.pathname === '/contact');
  const navClass = (section: NonNullable<typeof activeSection>) => `font-mono text-[10px] tracking-[0.08em] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[11px] ${isCurrent(section) ? 'text-primary' : 'text-muted-foreground'}`;

  return (
    <div className="technical-grid min-h-screen w-full overflow-x-clip text-foreground flex flex-col">
      {/* Top bar */}
      <header ref={headerRef} className={`border-b border-primary/10 ${inWorkspace ? 'sticky top-0 z-40 bg-background/95 backdrop-blur' : ''}`}>
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-2 px-4 py-2 sm:flex sm:flex-wrap sm:justify-between sm:gap-3 sm:px-6 sm:py-5">
          <button
            onClick={handleBrand}
            className="flex flex-shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
            aria-label="inside-the-box"
          >
            <GeometricSymbol size="xs" />
            <span className="font-mono text-xs font-medium text-foreground sm:text-sm">inside-the-box.org</span>
          </button>
          <nav className="hidden items-center gap-3 sm:flex" aria-label={lang === 'de' ? 'Hauptnavigation' : lang === 'fr' ? 'Navigation principale' : 'Main navigation'}>
            <Link to="/#services" aria-current={isCurrent('services') ? 'page' : undefined} className={navClass('services')}>
              {lang === 'de' ? 'LEISTUNGEN' : lang === 'fr' ? 'SERVICES' : 'SERVICES'}
            </Link>
            <Link to="/#knowledge" aria-current={isCurrent('knowledge') ? 'page' : undefined} className={navClass('knowledge')}>
              {lang === 'de' ? 'WISSEN & TOOLS' : lang === 'fr' ? 'EXPERTISE & OUTILS' : 'KNOWLEDGE & TOOLS'}
            </Link>
            <Link to="/team" aria-current={isCurrent('team') ? 'page' : undefined} className={`inline-flex min-h-11 items-center ${navClass('team')}`}>
              {lang === 'de' ? 'TEAM' : lang === 'fr' ? 'ÉQUIPE' : 'TEAM'}
            </Link>
            <Link to="/contact" aria-current={isCurrent('contact') ? 'page' : undefined} className={`inline-flex min-h-11 items-center ${navClass('contact')}`}>
              {lang === 'de' ? 'KONTAKT' : 'CONTACT'}
            </Link>
          </nav>
          <div className="hidden items-center sm:flex" aria-label="Language">
            {!hideLanguageSwitch && (
              <>
                <Languages className="mr-1 hidden h-3 w-3 text-muted-foreground sm:block" aria-hidden="true" />
                {(['de', 'en', 'fr'] as const).map((code) => (
                  <button key={code} onClick={() => setLanguage(code)} aria-pressed={language === code} className={`min-h-10 min-w-8 font-mono text-[10px] uppercase transition-colors sm:min-w-9 ${language === code ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{code}</button>
                ))}
              </>
            )}
          </div>
          <button type="button" aria-expanded={mobileMenuOpen} aria-controls="mobile-site-navigation" aria-label={`${lang === 'de' ? 'Menü' : 'Menu'}${hideLanguageSwitch ? '' : ` · ${LANGUAGE_NAMES[lang]}`}`} onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-11 min-w-11 items-center justify-center gap-2 px-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden">
            {!hideLanguageSwitch && <span className="font-mono text-[11px] uppercase text-primary" aria-hidden="true">{lang}</span>}
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          {mobileMenuOpen && <nav id="mobile-site-navigation" className="col-span-2 grid w-full grid-cols-2 border-t border-border pt-2 sm:hidden" aria-label={lang === 'de' ? 'Hauptnavigation' : lang === 'fr' ? 'Navigation principale' : 'Main navigation'}>
            <Link to="/#services" onClick={() => setMobileMenuOpen(false)} aria-current={isCurrent('services') ? 'page' : undefined} className="flex min-h-11 items-center font-mono text-[11px] text-muted-foreground hover:text-primary">{lang === 'de' ? 'LEISTUNGEN' : 'SERVICES'}</Link>
            <Link to="/#knowledge" onClick={() => setMobileMenuOpen(false)} aria-current={isCurrent('knowledge') ? 'page' : undefined} className="flex min-h-11 items-center font-mono text-[11px] text-muted-foreground hover:text-primary">{lang === 'de' ? 'WISSEN & TOOLS' : lang === 'fr' ? 'EXPERTISE & OUTILS' : 'KNOWLEDGE & TOOLS'}</Link>
            <Link to="/team" onClick={() => setMobileMenuOpen(false)} aria-current={isCurrent('team') ? 'page' : undefined} className="flex min-h-11 items-center font-mono text-[11px] text-muted-foreground hover:text-primary">{lang === 'fr' ? 'ÉQUIPE' : 'TEAM'}</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} aria-current={isCurrent('contact') ? 'page' : undefined} className="flex min-h-11 items-center font-mono text-[11px] text-muted-foreground hover:text-primary">{lang === 'de' ? 'KONTAKT' : 'CONTACT'}</Link>
            {!hideLanguageSwitch && <div className="col-span-2 mt-1 flex items-center gap-1 border-t border-border pt-2" role="group" aria-label={lang === 'de' ? 'Sprache' : lang === 'fr' ? 'Langue' : 'Language'}>
              <Languages className="mr-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {(['de', 'en', 'fr'] as const).map((code) => (
                <button key={code} type="button" onClick={() => setLanguage(code)} aria-pressed={language === code} aria-label={LANGUAGE_NAMES[code]} className={`min-h-11 min-w-11 border font-mono text-[11px] uppercase transition-colors ${language === code ? 'border-primary/60 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{code}</button>
              ))}
            </div>}
          </nav>}
        </div>
      </header>

      {/* Page content – flex-1 ensures the footer stays pinned to the
          bottom on short pages (e.g. hero), keeping a consistent footer
          baseline across the homepage and all sub-pages. */}
      <ChromeContext.Provider value={true}>
        <div className="flex-1 flex flex-col">{inWorkspace ? <PublicWorkspace>{children}</PublicWorkspace> : children}</div>
      </ChromeContext.Provider>

      {/* Footer
          ----------------------------------------------------------------
          Footer link convention (kept identical to the top-bar chrome):
            • Never underlined — these are navigation chips, not prose links.
            • Default colour: muted-foreground.
            • Hover & keyboard-focus shift to text-primary.
            • Focus is made visible with a subtle ring (no underline) so
              keyboard users get a clear, brand-consistent indicator.
      */}
      <footer className="border-t border-primary/10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4 font-mono text-[9px] sm:text-[10px] tracking-[0.08em] sm:tracking-[0.22em] text-muted-foreground">
          <button
            onClick={handleFooterBrand}
            className="whitespace-nowrap hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors no-underline text-left"
            aria-label="inside-the-box — Home"
          >
            <span className="hidden sm:inline">© {new Date().getFullYear()} </span>INSIDE-THE-BOX.ORG
          </button>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <Link
              to="/contact"
              className="hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors uppercase whitespace-nowrap no-underline"
            >
              {footerContactLabel}
            </Link>
            <button
              onClick={() => setDrawer('imprint')}
              className="hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors uppercase whitespace-nowrap no-underline"
            >
              {footerImprintLabel}
            </button>
          </div>
        </div>
      </footer>

      {/* Imprint Drawer */}
      <Sheet open={drawer === 'imprint'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-background/85 backdrop-blur-md border-l border-primary/20 overflow-y-auto"
        >
          <SheetHeader className="text-left mb-8">
            <div className="font-mono text-[12px] tracking-[0.3em] text-primary mb-3">
              {lang === 'de' ? '/ IMPRESSUM' : lang === 'fr' ? '/ MENTIONS LÉGALES' : '/ IMPRINT'}
            </div>
            <SheetTitle className="font-mono font-semibold text-2xl sm:text-3xl text-foreground">
              {lang === 'de' ? 'Impressum' : lang === 'fr' ? 'Mentions légales' : 'Imprint'}
            </SheetTitle>
            <SheetDescription className="font-sans text-sm text-muted-foreground leading-relaxed">
              {lang === 'de'
                ? 'Diese Website verarbeitet personenbezogene Daten nur in dem Umfang, der für Betrieb und Kontaktaufnahme nötig ist. Verantwortlich ist Marcel Knop (Adresse siehe unten).'
                : lang === 'fr'
                ? 'Ce site ne traite des données personnelles que dans la mesure nécessaire à son exploitation et à la prise de contact. Responsable : Marcel Knop (adresse ci-dessous).'
                : 'This site only processes personal data to the extent necessary for operation and contact. Responsible: Marcel Knop (address below).'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            {/* Responsible */}
            <div className="bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
                {lang === 'de' ? 'Verantwortlich für den Inhalt' : lang === 'fr' ? 'Responsable du contenu' : 'Responsible for content'}
              </h3>
              <div className="space-y-1">
                <div className="font-medium text-foreground">Marcel Knop</div>
                <div className="text-muted-foreground">Independent Cybersecurity Consultant</div>
                <div className="text-muted-foreground">Appenrother Weg 14</div>
                <div className="text-muted-foreground">
                  {lang === 'de' ? '34308 Bad Emstal, Deutschland' : lang === 'fr' ? '34308 Bad Emstal, Allemagne' : '34308 Bad Emstal, Germany'}
                </div>
              </div>
            </div>

            {/* VAT ID — § 5 TMG / § 27 a UStG. Mirrors the standalone
                /imprint page so the drawer is legally complete. */}
            <div className="bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
                {lang === 'de'
                  ? 'Umsatzsteuer-Identifikationsnummer'
                  : lang === 'fr'
                  ? 'Numéro d’identification TVA'
                  : 'VAT identification number'}
              </h3>
              <div className="space-y-1">
                <div className="font-medium text-foreground tracking-wider">DE328906053</div>
                <div className="text-muted-foreground text-sm">
                  {lang === 'de'
                    ? 'gemäß § 27 a UStG'
                    : lang === 'fr'
                    ? 'selon l’art. 27 a de la loi allemande sur la TVA'
                    : 'pursuant to § 27 a German VAT Act'}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
                {lang === 'de' ? 'Kontakt' : 'Contact'}
              </h3>
              <div className="space-y-1">
                <div>
                  <a href="mailto:marcel@inside-the-box.org" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors">
                    marcel@inside-the-box.org
                  </a>
                </div>
                <div>
                  <a href="tel:+4915205691648" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors">
                    +49 1520 569 1648
                  </a>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
                {lang === 'de' ? 'Haftungsausschluss' : lang === 'fr' ? 'Avertissement' : 'Disclaimer'}
              </h3>
              <p>
                {lang === 'de'
                  ? 'Trotz sorgfältiger inhaltlicher Kontrolle übernehme ich keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Die Haftung für eigene Inhalte richtet sich nach § 7 TMG.'
                  : lang === 'fr'
                  ? 'Malgré un contrôle attentif du contenu, je décline toute responsabilité quant au contenu des liens externes. Seuls les exploitants des pages liées sont responsables de leur contenu.'
                  : 'Despite careful content review, I assume no liability for the content of external links. Only the operators of the linked pages are responsible for their content.'}
              </p>
            </div>

            {/* Copyright */}
            <div className="bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
                {lang === 'de' ? 'Urheberrecht' : lang === 'fr' ? 'Droits d\'auteur' : 'Copyright'}
              </h3>
              <p>
                {lang === 'de'
                  ? 'Alle Inhalte dieser Seite unterliegen dem deutschen Urheberrecht. Eine Nutzung über den privaten Gebrauch hinaus bedarf der schriftlichen Zustimmung.'
                  : lang === 'fr'
                  ? 'Tous les contenus de ce site sont soumis au droit d\'auteur allemand. Toute utilisation au-delà de l\'usage privé nécessite un accord écrit.'
                  : 'All content on this site is subject to German copyright law. Use beyond private purposes requires written consent.'}
              </p>
            </div>

            {/* Data Protection */}
            <div className="bg-card/40 rounded-xl px-5 py-4 font-sans text-[15px] text-foreground/85 leading-relaxed">
              <h3 className="font-mono text-[11px] tracking-[0.3em] text-primary/80 uppercase mb-3">
                {lang === 'de' ? 'Datenschutz' : lang === 'fr' ? 'Protection des données' : 'Data Protection'}
              </h3>
              <div className="space-y-3">
                <p>
                  {lang === 'de'
                    ? 'Die Seite wird über Lovable bereitgestellt. Beim Abruf werden technisch notwendige Verbindungsdaten (IP, Zeitpunkt, User-Agent) kurzzeitig in Server-Logs verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).'
                    : lang === 'fr'
                    ? 'Le site est hébergé via Lovable. Lors de la consultation, les données de connexion techniquement nécessaires (IP, horodatage, user-agent) sont traitées brièvement dans les journaux du serveur (art. 6, par. 1, point f, RGPD).'
                    : 'The site is hosted via Lovable. On access, technically necessary connection data (IP, timestamp, user-agent) is briefly processed in server logs (Art. 6(1)(f) GDPR).'}
                </p>
                <p>
                  {lang === 'de'
                    ? 'Eingaben in die KI-Tools werden anonym über das Lovable AI Gateway verarbeitet und nicht dauerhaft gespeichert. Es werden keine Marketing- oder Tracking-Cookies gesetzt.'
                    : lang === 'fr'
                    ? 'Les saisies dans les outils IA sont traitées anonymement via la passerelle Lovable AI et ne sont pas stockées de manière permanente. Aucun cookie marketing ou de suivi n\'est utilisé.'
                    : 'Inputs to the AI tools are processed anonymously via the Lovable AI Gateway and not permanently stored. No marketing or tracking cookies are set.'}
                </p>
                <p>
                  {lang === 'de'
                    ? 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung und Widerspruch. Anfragen formlos an '
                    : lang === 'fr'
                    ? 'Vous avez le droit d\'accès, de rectification, de suppression, de limitation et d\'opposition. Demandes informelles à '
                    : 'You have the right to access, correction, deletion, restriction and objection. Informal requests to '}
                  <a href="mailto:marcel@inside-the-box.org" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors">
                    marcel@inside-the-box.org
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
