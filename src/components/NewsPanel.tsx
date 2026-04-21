import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles } from 'lucide-react';

type Lang = 'de' | 'en' | 'fr';
type L = Record<Lang, string>;

interface NewsItem {
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Optional internal route (starts with /) — renders as button */
  route?: string;
  title: L;
  desc: L;
  badge?: L;
}

// Curated changelog — keep last ~30 days. Newest first.
// When adding new entries, prune anything older than ~30 days.
const NEWS: NewsItem[] = [
  {
    date: '2026-04-21',
    route: '/ttx-readiness',
    badge: { de: 'Neu', en: 'New', fr: 'Nouveau' },
    title: {
      de: 'TTX Readiness · Self-Assessment',
      en: 'TTX Readiness · Self-Assessment',
      fr: 'TTX Readiness · Self-Assessment',
    },
    desc: {
      de: 'Acht Dimensionen, 24 Fragen. Reifegrad-Score, Radar und Top-3-Lücken für DORA und NIS-2.',
      en: 'Eight dimensions, 24 questions. Maturity score, radar and top-3 gaps for DORA and NIS-2.',
      fr: 'Huit dimensions, 24 questions. Score de maturité, radar et top-3 des lacunes pour DORA et NIS-2.',
    },
  },
  {
    date: '2026-04-15',
    route: '/nis2-dora',
    badge: { de: 'Aktualisiert', en: 'Updated', fr: 'Mis à jour' },
    title: {
      de: 'TTX-Termin: 26.–30.10.2026 (ISACA Germany Chapter)',
      en: 'TTX session: 26–30 Oct 2026 (ISACA Germany Chapter)',
      fr: 'Session TTX : 26–30 oct. 2026 (ISACA Germany Chapter)',
    },
    desc: {
      de: 'Neuer Termin und aktualisierter Link zur Cyber Security Expert Schulung.',
      en: 'New date and refreshed link to the Cyber Security Expert training.',
      fr: 'Nouvelle date et lien mis à jour vers la formation Cyber Security Expert.',
    },
  },
  {
    date: '2026-04-10',
    route: '/dora-compliance',
    badge: { de: 'Aktualisiert', en: 'Updated', fr: 'Mis à jour' },
    title: {
      de: 'DORA Compliance Tool · Schärfere Findings',
      en: 'DORA Compliance Tool · Sharper findings',
      fr: 'DORA Compliance Tool · Constats affinés',
    },
    desc: {
      de: 'Quality Gates verschärft, Management Summary überarbeitet, Audit-Traceability erweitert.',
      en: 'Tightened quality gates, refreshed management summary, extended audit traceability.',
      fr: 'Quality gates renforcés, synthèse direction revue, traçabilité d\'audit étendue.',
    },
  },
  {
    date: '2026-04-05',
    route: '/nis2-compliance',
    badge: { de: 'Aktualisiert', en: 'Updated', fr: 'Mis à jour' },
    title: {
      de: 'NIS-2 Compliance Tool · PDF-Report verfeinert',
      en: 'NIS-2 Compliance Tool · Refined PDF report',
      fr: 'NIS-2 Compliance Tool · Rapport PDF affiné',
    },
    desc: {
      de: 'Lesbarere Prosa in den Findings, dezenteres Wasserzeichen, präzisere Remediation-Pläne.',
      en: 'More readable finding prose, subtler watermark, more precise remediation plans.',
      fr: 'Prose plus lisible dans les constats, filigrane discret, plans de remédiation plus précis.',
    },
  },
  {
    date: '2026-03-28',
    route: '/iec62443',
    badge: { de: 'Aktualisiert', en: 'Updated', fr: 'Mis à jour' },
    title: {
      de: 'IEC 62443 · OT-Risikokalibrierung',
      en: 'IEC 62443 · OT risk calibration',
      fr: 'IEC 62443 · Calibrage des risques OT',
    },
    desc: {
      de: 'Impact-Skala 1–5 auf OT-Kontext zugeschnitten, produktspezifische Findings statt Templates.',
      en: 'Impact scale 1–5 tuned to OT context, product-specific findings instead of templates.',
      fr: 'Échelle d\'impact 1–5 ajustée au contexte OT, constats spécifiques au produit.',
    },
  },
  {
    date: '2026-03-25',
    route: '/iscp-ttx',
    badge: { de: 'Aktualisiert', en: 'Updated', fr: 'Mis à jour' },
    title: {
      de: 'ISCP Quick Check · TTX-Vorschläge geschärft',
      en: 'ISCP Quick Check · Sharper TTX suggestions',
      fr: 'ISCP Quick Check · Suggestions TTX affinées',
    },
    desc: {
      de: 'KI-Empfehlungen klarer formuliert, neue Default-ISCPs, sauberere Übersetzungen DE/EN/FR.',
      en: 'Clearer AI recommendations, new default ISCPs, cleaner DE/EN/FR translations.',
      fr: 'Recommandations IA plus claires, nouveaux ISCP par défaut, traductions DE/EN/FR plus nettes.',
    },
  },
];


const I18N = {
  heading: { de: 'Neuigkeiten', en: "What's new", fr: 'Nouveautés' } as L,
  sub: {
    de: 'Letzte 30 Tage',
    en: 'Last 30 days',
    fr: '30 derniers jours',
  } as L,
};

interface NewsPanelProps {
  onSelectService?: (id: string) => void;
}

export function NewsPanel({ onSelectService }: NewsPanelProps) {
  const { language } = useLanguage();
  const lang = language as Lang;
  const t = (l: L) => l[lang] || l.en;

  // Filter to last 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const items = NEWS.filter(n => new Date(n.date).getTime() >= cutoff);
  if (items.length === 0) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const locale = lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  };

  const handleClick = (route: string) => {
    // Try in-app routing if a service id matches a known internal path
    if (onSelectService && route.startsWith('/') && !route.includes('://')) {
      const id = route.replace(/^\//, '');
      onSelectService(id);
      return;
    }
    window.location.href = route;
  };

  return (
    <aside
      className="w-full max-w-xl mx-auto mt-10 bg-card/40 border border-primary/20 rounded-lg backdrop-blur-sm overflow-hidden"
      aria-label={t(I18N.heading)}
    >
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-primary/15 bg-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-highlight" />
          <h2 className="font-mono text-xs uppercase tracking-wider text-primary">
            {t(I18N.heading)}
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t(I18N.sub)}
        </span>
      </header>
      <ul className="divide-y divide-primary/10">
        {items.map((item, i) => {
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3 group">
              <span className="font-mono text-[10px] text-muted-foreground mt-0.5 shrink-0 w-12 tabular-nums">
                {formatDate(item.date)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-rounded text-sm text-foreground group-hover:text-highlight transition-electric leading-snug">
                    {t(item.title)}
                  </h3>
                  {item.badge && (
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-highlight/15 text-highlight border border-highlight/30">
                      {t(item.badge)}
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t(item.desc)}
                </p>
              </div>
            </div>
          );

          return (
            <li key={i}>
              {item.route ? (
                <button
                  type="button"
                  onClick={() => handleClick(item.route!)}
                  className="w-full text-left bg-transparent border-none p-0 cursor-pointer hover:bg-primary/5 transition-electric"
                >
                  {inner}
                </button>
              ) : (
                <div>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
