import { ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { Award, BookOpen, ChevronDown, ChevronRight, Mail, Menu, Users, X } from 'lucide-react';
import { REFERENCES_COPY } from '@/data/references';
import { HOME_KNOWLEDGE, HOME_TOPICS, type HomeLanguage, type HomeTopic } from '@/data/homeTopics';
import { SERVICE_DETAILS } from '@/data/serviceDetails';
import { useLanguage } from '@/i18n/LanguageContext';
import { framedToolForPath } from '@/data/labTools';

/**
 * Stable public workspace: sticky left navigation (desktop) or compact sticky
 * orientation bar (mobile) next to ONE content column whose start edge never
 * moves. Rendered by SiteChrome for public sub-pages only.
 */

const COPY = {
  de: { topics: 'Themen', more: 'Weitere Leistungen', areas: 'Bereiche', team: 'Team', contact: 'Kontakt', menu: 'Navigation', nav: 'Seitennavigation', close: 'Schließen' },
  en: { topics: 'Topics', more: 'More services', areas: 'Areas', team: 'Team', contact: 'Contact', menu: 'Navigation', nav: 'Page navigation', close: 'Close' },
  fr: { topics: 'Thèmes', more: 'Autres services', areas: 'Rubriques', team: 'Équipe', contact: 'Contact', menu: 'Navigation', nav: 'Navigation de page', close: 'Fermer' },
};

const KNOWLEDGE_PATHS = HOME_KNOWLEDGE.map((k) => k.href);

/** Public paths that always render inside the workspace. */
export const isWorkspacePath = (pathname: string) => {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return Boolean(SERVICE_DETAILS[slug]) || KNOWLEDGE_PATHS.includes(pathname) || pathname === '/team' || pathname === '/contact' || pathname === '/references' || Boolean(framedToolForPath(pathname));
};

const topicLinks = (topic: HomeTopic) => {
  const primary = topic.offers.map((offer) => offer.links[0]).filter(Boolean);
  const secondary = topic.offers.flatMap((offer) => offer.links.slice(1));
  return { primary, secondary };
};

const topicForPath = (pathname: string): HomeTopic['id'] | null => {
  if (KNOWLEDGE_PATHS.includes(pathname) || framedToolForPath(pathname)) return null;
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  const detail = SERVICE_DETAILS[slug];
  if (detail) return detail.topic;
  const hit = HOME_TOPICS.find((topic) => topic.offers.some((o) => o.links.some((l) => l.href === pathname)));
  return hit?.id ?? null;
};

const SCROLL_KEY = 'workspace:scroll';
const readScroll = (): Record<string, number> => {
  try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}'); } catch { return {}; }
};

function NavList({ lang, pathname, onNavigate }: { lang: HomeLanguage; pathname: string; onNavigate?: () => void }) {
  const copy = COPY[lang];
  const activeTopic = topicForPath(pathname);
  const [moreOpen, setMoreOpen] = useState(false);
  const itemClass = (active: boolean) =>
    `group flex min-h-11 items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-sm leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active ? 'border-primary bg-primary/10 font-semibold text-foreground' : 'border-transparent text-foreground/65 hover:border-primary/40 hover:text-foreground'
    }`;
  const areaLinks = [
    ...HOME_KNOWLEDGE.map((k) => ({ href: k.href, label: k.title[lang], icon: BookOpen })),
    { href: '/references', label: REFERENCES_COPY[lang].nav, icon: Award },
    { href: '/team', label: copy.team, icon: Users },
    { href: '/contact', label: copy.contact, icon: Mail },
  ];

  const activeTopicData = HOME_TOPICS.find((t) => t.id === activeTopic);
  const activeGroup = activeTopicData ? { topic: activeTopicData, ...topicLinks(activeTopicData) } : null;
  // Secondary offers stay closed unless the current page is one of them.
  useEffect(() => {
    setMoreOpen(Boolean(activeGroup?.secondary.some((l) => l.href === pathname)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic, pathname]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{copy.topics}</p>
        {/* Fixed signposts: the three topics never move. */}
        <ul className="space-y-0.5">
          {HOME_TOPICS.map((topic) => {
            const Icon = topic.icon;
            const isActive = topic.id === activeTopic;
            return (
              <li key={topic.id}>
                <Link
                  to={topicLinks(topic).primary[0]?.href ?? '/'}
                  onClick={onNavigate}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex min-h-11 items-center gap-2.5 border-l-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'border-primary text-primary' : 'border-transparent text-foreground/80 hover:text-primary'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                  <span className="flex-1">{topic.shortTitle[lang]}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {activeGroup && (
        <div className="border-t border-border pt-4">
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{activeGroup.topic.shortTitle[lang]}</p>
          <ul className="space-y-0.5">
            {activeGroup.primary.map((link) => (
              <li key={link.href}>
                <Link to={link.href} onClick={onNavigate} aria-current={pathname === link.href ? 'page' : undefined} className={itemClass(pathname === link.href)}>
                  {pathname === link.href && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
                  <span>{link.label[lang]}</span>
                </Link>
              </li>
            ))}
            {activeGroup.secondary.length > 0 && (
              <li>
                <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)} className="flex min-h-11 w-full items-center gap-2 pl-3 pr-2 text-left text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? '' : '-rotate-90'}`} aria-hidden="true" />{copy.more}
                </button>
                {moreOpen && (
                  <ul className="space-y-0.5">
                    {activeGroup.secondary.map((link) => (
                      <li key={link.href}>
                        <Link to={link.href} onClick={onNavigate} aria-current={pathname === link.href ? 'page' : undefined} className={`${itemClass(pathname === link.href)} pl-6`}>
                          <span>{link.label[lang]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
      <div className="border-t border-border pt-4">
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{copy.areas}</p>
        <ul className="space-y-0.5">
          {areaLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link to={href} onClick={onNavigate} aria-current={pathname === href ? 'page' : href === '/ki-lab' && framedToolForPath(pathname)?.back === '/ki-lab' ? 'true' : undefined} className={itemClass(pathname === href || (href === '/ki-lab' && framedToolForPath(pathname)?.back === '/ki-lab'))}>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden="true" /><span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SLOT = {
  de: { home: 'Start', back: 'Zur Themenübersicht', lab: 'KI-Lab', labBack: 'Zurück zum KI-Lab', tools: 'Assessment Tools', toolsBack: 'Zurück zu den Assessment Tools' },
  en: { home: 'Home', back: 'Topic overview', lab: 'AI lab', labBack: 'Back to AI lab', tools: 'Assessment tools', toolsBack: 'Back to assessment tools' },
  fr: { home: 'Accueil', back: 'Vue du thème', lab: 'Laboratoire IA', labBack: 'Retour au laboratoire IA', tools: 'Outils d’évaluation', toolsBack: 'Retour aux outils d’évaluation' },
};

/** One compact intro slot for every workspace page: breadcrumb + optional topic return. */
function IntroSlot({ lang, pathname, pageLabel }: { lang: HomeLanguage; pathname: string; pageLabel: string }) {
  const slot = SLOT[lang];
  const topic = HOME_TOPICS.find((t) => t.id === topicForPath(pathname));
  const crumb = 'rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const remember = () => topic && sessionStorage.setItem('overview:topic', topic.id);
  const framed = framedToolForPath(pathname);
  const parent = framed ? (framed.back === '/ki-lab' ? { href: '/ki-lab', label: slot.lab, back: slot.labBack } : { href: '/assessment-tools', label: slot.tools, back: slot.toolsBack }) : null;
  return (
    <div className="workspace-slot flex h-11 items-center justify-between gap-4 mb-5 mt-5 text-xs text-muted-foreground lg:mb-6 lg:mt-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
        <Link to="/" className={crumb}>{slot.home}</Link>
        {topic && <><span aria-hidden="true" className="hidden sm:inline">/</span><Link to="/#services" onClick={remember} className={`hidden shrink-0 sm:inline ${crumb}`}>{topic.title[lang]}</Link></>}
        {parent && <><span aria-hidden="true">/</span><Link to={parent.href} className={`shrink-0 ${crumb}`}>{parent.label}</Link></>}
        {pageLabel && <><span aria-hidden="true">/</span><span aria-current="page" className="truncate text-foreground/75">{pageLabel}</span></>}
      </nav>
      {parent && <Link to={parent.href} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap font-semibold text-foreground/80 ${crumb}`}><span aria-hidden="true">←</span>{parent.back}</Link>}
      {topic && <Link to="/#services" onClick={remember} aria-label={slot.back} className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap ${crumb}`}><span aria-hidden="true">←</span><span className="hidden sm:inline">{slot.back}</span></Link>}
    </div>
  );
}

const currentLabels = (pathname: string, lang: HomeLanguage, t: (k: string) => string) => {
  const copy = COPY[lang];
  const topicId = topicForPath(pathname);
  const topic = HOME_TOPICS.find((t) => t.id === topicId);
  const link = HOME_TOPICS.flatMap((t) => t.offers.flatMap((o) => o.links)).find((l) => l.href === pathname);
  const knowledge = HOME_KNOWLEDGE.find((k) => k.href === pathname);
  const framed = framedToolForPath(pathname);
  if (pathname === '/assessment-tools') return { area: copy.areas, page: SLOT[lang].tools };
  if (framed) return { area: framed.back === '/ki-lab' ? SLOT[lang].lab : SLOT[lang].tools, page: framed.titleKey ? t(framed.titleKey) : framed.title?.[lang] ?? '' };
  const page = link?.label[lang] ?? knowledge?.title[lang] ?? (pathname === '/references' ? REFERENCES_COPY[lang].nav : pathname === '/team' ? copy.team : pathname === '/contact' ? copy.contact : '');
  return { area: topic?.shortTitle[lang] ?? copy.areas, page };
};

export function PublicWorkspace({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage();
  const lang = language as HomeLanguage;
  const copy = COPY[lang];
  const location = useLocation();
  const navType = useNavigationType();
  const contentRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const first = useRef(true);

  // Remember scroll per history entry so Back restores context.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const map = readScroll();
        map[location.key] = window.scrollY;
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, [location.key]);

  // Forward: start at the content edge and focus the page heading. Back: restore.
  // Runs after child effects (e.g. ChatView's reset), so it has the last word.
  useEffect(() => {
    setMenuOpen(false);
    if (navType === 'POP' && !first.current) {
      const y = readScroll()[location.key];
      if (typeof y === 'number') {
        window.scrollTo(0, y);
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    } else {
      window.scrollTo(0, 0);
      if (!first.current) {
        let tries = 0;
        const focusHeading = () => {
          const heading = contentRef.current?.querySelector<HTMLElement>('h1');
          if (heading) {
            if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
            heading.classList.add('focus:outline-none');
            heading.focus({ preventScroll: true });
          } else if (tries++ < 20) window.setTimeout(focusHeading, 50);
        };
        window.setTimeout(focusHeading, 30);
      }
    }
    first.current = false;
  }, [location.key, navType]);

  const { area, page } = currentLabels(location.pathname, lang, t);
  const labTool = framedToolForPath(location.pathname);
  const wide = Boolean(labTool?.wide);
  const detail = SERVICE_DETAILS[location.pathname.replace(/^\/+|\/+$/g, '')];
  const serviceTitle = detail ? t(detail.titleKey) : undefined;

  return (
    <div className={`public-workspace mx-auto w-full flex-1 ${wide ? 'max-w-[1700px]' : 'max-w-7xl lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10 lg:px-6'}`}>
      {/* Mobile / tablet orientation bar */}
      <div className={`sticky top-[var(--site-header-h)] z-30 border-b border-border bg-background/95 backdrop-blur ${wide ? '' : 'lg:hidden'}`}>
        <div className="flex min-h-12 items-center gap-3 px-4 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{area}</span>
            {page && <span className="text-foreground/80"> · {page}</span>}
          </p>
          <button type="button" aria-expanded={menuOpen} aria-controls="workspace-mobile-nav" onClick={() => setMenuOpen((o) => !o)} className="flex min-h-11 items-center gap-2 border border-border px-3 text-xs font-semibold text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            {menuOpen ? copy.close : copy.menu}
          </button>
        </div>
        {menuOpen && (
          <nav id="workspace-mobile-nav" aria-label={copy.nav} className="max-h-[60vh] overflow-y-auto border-t border-border px-2 py-4 sm:px-4">
            <NavList lang={lang} pathname={location.pathname} onNavigate={() => setMenuOpen(false)} />
          </nav>
        )}
      </div>

      {/* Desktop sticky navigation */}
      <aside className={wide ? 'hidden' : 'hidden lg:block'}>
        <nav aria-label={copy.nav} className="sticky top-[calc(var(--site-header-h)+2.5rem)] mt-10 max-h-[calc(100vh-var(--site-header-h)-3.5rem)] overflow-y-auto pb-6 pr-1">
          <NavList lang={lang} pathname={location.pathname} />
        </nav>
      </aside>

      <div ref={contentRef} className="workspace-content min-w-0">
        <div className={wide ? 'px-4 sm:px-6' : 'px-4 sm:px-6 lg:px-0'}><IntroSlot lang={lang} pathname={location.pathname} pageLabel={serviceTitle ?? page} />
          {labTool && <LabHeading title={page} contentRef={contentRef} />}</div>
        {children}
      </div>
    </div>
  );
}

/** Visible tool title outside any canvas, rendered only when the tool has no h1 of its own. */
function LabHeading({ title, contentRef }: { title: string; contentRef: RefObject<HTMLDivElement> }) {
  const [own, setOwn] = useState(true);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOwn(el.querySelectorAll('h1:not([data-lab-heading])').length === 0);
    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [contentRef]);
  const cls = 'mb-5 font-sans text-2xl font-semibold leading-tight text-foreground sm:text-3xl';
  // Tools with their own visible h1 already show the title; avoid a duplicate.
  return own ? <h1 data-lab-heading className={cls}>{title}</h1> : null;
}
