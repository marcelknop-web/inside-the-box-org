import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Languages, ArrowRight, Linkedin, Mail, Phone } from 'lucide-react';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { consultantProfiles } from '@/data/consultantProfiles';

/**
 * Shared site chrome (top bar + footer + Team/Contact drawers) used by the
 * Overview homepage and every service sub-page reachable from it. Keeps the
 * brand surface identical across the journey.
 *
 * `onBrandClick` is optional — pages that have an in-page reset (e.g. Overview's
 * hero) can hook into it. By default the brand link navigates to `/`.
 */
export const SiteChrome = ({
  children,
  onBrandClick,
}: {
  children: ReactNode;
  onBrandClick?: () => void;
}) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState<'team' | 'contact' | 'imprint' | null>(null);
  const lang = language as 'en' | 'de' | 'fr';

  const footerImprintLabel =
    lang === 'de' ? 'Impressum' : lang === 'fr' ? 'Mentions légales' : 'Imprint';
  const footerContactLabel =
    lang === 'de' ? 'Kontakt' : lang === 'fr' ? 'Contact' : 'Contact';

  const handleBrand = () => {
    if (onBrandClick) onBrandClick();
    // Navigate to the overview but skip the hero opener — land directly on
    // the journey-map (the "page after" the hero). Overview reads this flag.
    else navigate('/', { state: { skipHero: true } });
  };

  // Footer brand link: always go back to the hero opener (no skipHero flag),
  // so clicking the wordmark in the footer feels like "back to the start".
  const handleFooterBrand = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-primary/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-3">
          <button
            onClick={handleBrand}
            className="flex-shrink-0 transition-opacity hover:opacity-80"
            aria-label="inside-the-box"
            style={{ transform: 'scale(1.6)', transformOrigin: 'left center' }}
          >
            <GeometricSymbol size="xs" />
          </button>
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => setDrawer('team')}
              className="font-mono text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
            >
              {lang === 'de' ? 'TEAM' : lang === 'fr' ? 'ÉQUIPE' : 'TEAM'}
            </button>
            <button
              onClick={() => setLanguage(nextLanguage(language))}
              className="font-mono text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              aria-label="Language"
            >
              <Languages className="w-3 h-3" />
              {language.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Page content – flex-1 ensures the footer stays pinned to the
          bottom on short pages (e.g. hero), keeping a consistent footer
          baseline across the homepage and all sub-pages. */}
      <div className="flex-1 flex flex-col">{children}</div>

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-nowrap items-center justify-between gap-2.5 sm:gap-4 font-mono text-[9px] sm:text-[10px] tracking-[0.08em] sm:tracking-[0.22em] text-muted-foreground">
          <button
            onClick={handleFooterBrand}
            className="whitespace-nowrap hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors no-underline text-left"
            aria-label="inside-the-box — Home"
          >
            <span className="hidden sm:inline">© {new Date().getFullYear()} </span>INSIDE-THE-BOX.ORG
          </button>
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setDrawer('contact')}
              className="hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors uppercase whitespace-nowrap no-underline"
            >
              {footerContactLabel}
            </button>
            <a
              href="https://www.linkedin.com/in/inside-the-box"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hidden sm:inline-flex hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors items-center gap-1.5 uppercase whitespace-nowrap no-underline"
            >
              <Linkedin className="w-3 h-3" />
              <span>LinkedIn</span>
            </a>
            <button
              onClick={() => setDrawer('imprint')}
              className="hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm transition-colors uppercase whitespace-nowrap no-underline"
            >
              {footerImprintLabel}
            </button>
          </div>
        </div>
      </footer>

      {/* Team Drawer */}
      <Sheet open={drawer === 'team'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-background/85 backdrop-blur-md border-l border-primary/20 overflow-y-auto"
        >
          <SheetHeader className="text-left mb-8">
            <div className="font-mono text-[11px] tracking-[0.35em] text-primary mb-3">/ TEAM</div>
            <SheetTitle className="font-mono font-semibold text-2xl sm:text-3xl text-foreground">
              {lang === 'de'
                ? 'Wer hinter inside-the-box steht'
                : lang === 'fr'
                ? 'Qui se cache derrière inside-the-box'
                : 'The people behind inside-the-box'}
            </SheetTitle>
            <SheetDescription className="font-sans text-sm text-muted-foreground leading-relaxed">
              {lang === 'de'
                ? 'Zwei Senior-Berater, gemeinsam über 35 Jahre Erfahrung in Cybersecurity, Compliance und Krisenmanagement.'
                : lang === 'fr'
                ? 'Deux consultants seniors, plus de 35 ans d\'expérience combinée en cybersécurité, conformité et gestion de crise.'
                : 'Two senior consultants, 35+ combined years in cybersecurity, compliance and crisis management.'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {consultantProfiles.map((p) => {
              const key = p.name === 'Marcel Knop' ? 'marcel' : 'andreas';
              const sections = [
                { label: t(`profiles.${key}.focusLabel`), value: t(`profiles.${key}.focus`) },
                { label: t(`profiles.${key}.experienceLabel`), value: t(`profiles.${key}.experience`) },
                { label: t(`profiles.${key}.certsLabel`), value: t(`profiles.${key}.certs`) },
                { label: t(`profiles.${key}.eduLabel`), value: t(`profiles.${key}.edu`) },
                { label: t(`profiles.${key}.langLabel`), value: t(`profiles.${key}.lang`) },
              ];
              return (
                <article key={p.name} className="bg-background/40 border border-primary/15 p-5">
                  <header className="flex items-start gap-4 mb-4">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-16 h-16 rounded-full object-cover border border-primary/30"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono font-semibold text-base text-foreground">{p.name}</h3>
                      <p className="font-mono text-[11px] tracking-[0.15em] text-primary/80 uppercase mt-1">{p.role}</p>
                      {p.linkedinUrl && (
                        <a
                          href={p.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors mt-2"
                        >
                          <Linkedin className="w-3 h-3" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </header>

                  <div className="font-sans text-sm text-foreground/80 leading-relaxed mb-4 space-y-3">
                    {t(`profiles.${key}.bio`).split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  <dl className="grid grid-cols-1 gap-3">
                    {sections.map((s) => (
                      <div key={s.label} className="border-t border-primary/10 pt-3">
                        <dt className="font-mono text-[10px] tracking-[0.25em] text-primary/70 uppercase mb-1.5">
                          {s.label}
                        </dt>
                        <dd className="font-sans text-[13px] text-foreground/85 leading-snug">
                          {s.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Contact Drawer */}
      <Sheet open={drawer === 'contact'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-background/85 backdrop-blur-md border-l border-primary/20"
        >
          <SheetHeader className="text-left mb-8">
            <div className="font-mono text-[11px] tracking-[0.35em] text-primary mb-3">{lang === 'de' ? '/ KONTAKT' : '/ CONTACT'}</div>
            <SheetTitle className="font-mono font-semibold text-2xl sm:text-3xl text-foreground">
              {lang === 'de' ? 'Sprechen wir' : lang === 'fr' ? 'Parlons-en' : 'Let\'s talk'}
            </SheetTitle>
            <SheetDescription className="font-sans text-sm text-muted-foreground leading-relaxed">
              {lang === 'de'
                ? '30 Minuten, kein Pitch — eine erste Klärung, wo Sie stehen und was als Nächstes ansteht.'
                : lang === 'fr'
                ? '30 minutes, pas de pitch — une première clarification de votre situation et des prochaines étapes.'
                : '30 minutes, no pitch — a first clarification of where you stand and what comes next.'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            <a
              href="mailto:marcel@inside-the-box.org"
              className="group flex items-center justify-between gap-3 p-4 border border-primary/20 hover:border-primary bg-background/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">{lang === 'fr' ? 'E-mail · Marcel Knop' : 'E-Mail · Marcel Knop'}</div>
                  <div className="font-mono text-sm text-foreground truncate">marcel@inside-the-box.org</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>

            <a
              href="tel:+4915205691648"
              className="group flex items-center justify-between gap-3 p-4 border border-primary/20 hover:border-primary bg-background/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">{lang === 'de' ? 'Mobil · Marcel Knop' : lang === 'fr' ? 'Mobile · Marcel Knop' : 'Mobile · Marcel Knop'}</div>
                  <div className="font-mono text-sm text-foreground">+49 1520 569 1648</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>

            <a
              href="https://www.linkedin.com/in/inside-the-box"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 p-4 border border-primary/20 hover:border-primary bg-background/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Linkedin className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">LinkedIn</div>
                  <div className="font-mono text-sm text-foreground">inside-the-box</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          </div>
        </SheetContent>
      </Sheet>

      {/* Imprint Drawer */}
      <Sheet open={drawer === 'imprint'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-background/85 backdrop-blur-md border-l border-primary/20 overflow-y-auto"
        >
          <SheetHeader className="text-left mb-8">
            <div className="font-mono text-[11px] tracking-[0.35em] text-primary mb-3">
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
