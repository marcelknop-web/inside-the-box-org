/**
 * ServiceSymbol — themen-spezifische SVG-Symbole pro Beratungsdienstleistung.
 *
 * Konzept: Jede Service-Kategorie bekommt ein eigens gezeichnetes, geometrisches
 * Symbol im Stil der Marken-Raute (dünne Linien, gold/cyan-Akzente, technische
 * Anmutung). Dadurch wird die thematische Zuordnung visuell klarer als mit
 * generischen Lucide-Icons, ohne dass die Marken-Raute selbst ersetzt wird.
 *
 * Alle Symbole nutzen ausschließlich Design-Tokens (currentColor / hsl(var(--…))).
 * Größe wird per `size` (px) gesteuert, Farbe vererbt sich über `color` /
 * `text-primary` Klassen.
 */

import type { SVGProps } from 'react';

export type ServiceTheme =
  | 'isms'
  | 'nis2-dora'
  | 'tisax-pci-dss'
  | 'assessments-concepts'
  | 'incident-management'
  | 'cyber-crisis-management'
  | 'arena-training'
  | 'events-workshops'
  | 'publications'
  | 'virtual-ciso'
  | 'ai-workflows'
  /* Journey-Map-Phasen (Overview) */
  | 'phase-understand'
  | 'phase-comply'
  | 'phase-govern'
  | 'phase-train'
  | 'phase-respond';

interface ServiceSymbolProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  theme: ServiceTheme;
  size?: number;
}

const COMMON: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const ServiceSymbol = ({ theme, size = 16, className, ...rest }: ServiceSymbolProps) => {
  const props = { ...COMMON, width: size, height: size, className, ...rest };

  switch (theme) {
    /* ISMS / BSI — Schild mit zentriertem Punkt (Schutz, Standard, Kern). */
    case 'isms':
      return (
        <svg {...props}>
          <path d="M12 2.5 L20 5.5 V12 C20 16.5 16.5 19.8 12 21.5 C7.5 19.8 4 16.5 4 12 V5.5 Z" />
          <circle cx="12" cy="11" r="2" />
          <path d="M12 13 V16" />
        </svg>
      );

    /* NIS-2 / DORA — Vernetztes Knoten-Diagramm (Resilienz, Sektoren). */
    case 'nis2-dora':
      return (
        <svg {...props}>
          <circle cx="12" cy="4" r="2" />
          <circle cx="4" cy="14" r="2" />
          <circle cx="20" cy="14" r="2" />
          <circle cx="12" cy="20" r="2" />
          <path d="M12 6 L4.8 12.5 M12 6 L19.2 12.5 M5.5 15.5 L10.8 18.8 M18.5 15.5 L13.2 18.8 M6 14 H18" />
        </svg>
      );

    /* TISAX / PCI-DSS — Karte mit Magnetstreifen (Branchen-Datenschutz). */
    case 'tisax-pci-dss':
      return (
        <svg {...props}>
          <rect x="2.5" y="6" width="19" height="13" rx="1.5" />
          <path d="M2.5 10 H21.5" />
          <path d="M5.5 15 H9.5 M5.5 17 H8" />
          <rect x="14" y="13.5" width="5" height="3.5" rx="0.5" />
        </svg>
      );

    /* Assessments / Concepts — Lupe über Raster (Analyse, Untersuchung). */
    case 'assessments-concepts':
      return (
        <svg {...props}>
          <path d="M3 4 H11 V12 H3 Z" />
          <path d="M3 7.3 H11 M3 9.6 H11 M5.7 4 V12 M8.3 4 V12" />
          <circle cx="15" cy="15" r="4.5" />
          <path d="M18.5 18.5 L21.5 21.5" />
        </svg>
      );

    /* Incident Management — Flamme mit Basislinie (akutes Ereignis). */
    case 'incident-management':
      return (
        <svg {...props}>
          <path d="M12 3 C13.5 6 16 7 16 11 C16 14 14.2 15.5 12 15.5 C9.8 15.5 8 14 8 11 C8 9.5 9 8.5 9.5 8.5 C9.5 9.8 10.5 10.5 11 10 C11 7.5 12 5 12 3 Z" />
          <path d="M3 19 H21" />
          <path d="M5.5 21.5 H8.5 M11 21.5 H13 M15.5 21.5 H18.5" />
        </svg>
      );

    /* Cyber Crisis Management — Gekreuzte Schwerter (Konflikt, Verteidigung). */
    case 'cyber-crisis-management':
      return (
        <svg {...props}>
          {/* Schwert 1: links-oben → rechts-unten */}
          <path d="M4 4 L15 15" />
          <path d="M3 3 L5.5 3 L5.5 5.5 Z" fill="currentColor" />
          <path d="M14 16 L17 19 L19 17 L16 14" />
          <path d="M17.5 19.5 L20 22" />
          {/* Schwert 2: rechts-oben → links-unten */}
          <path d="M20 4 L9 15" />
          <path d="M21 3 L18.5 3 L18.5 5.5 Z" fill="currentColor" />
          <path d="M10 16 L7 19 L5 17 L8 14" />
          <path d="M6.5 19.5 L4 22" />
        </svg>
      );

    /* Arena / Red Team — Zielscheibe mit Treffer (Übung, Simulation). */
    case 'arena-training':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 1 V4 M12 20 V23 M1 12 H4 M20 12 H23" />
        </svg>
      );

    /* Events / Workshops — Kalenderblatt mit markiertem Tag. */
    case 'events-workshops':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="1.5" />
          <path d="M3 10 H21" />
          <path d="M8 3 V7 M16 3 V7" />
          <rect x="13" y="13" width="4" height="4" rx="0.5" />
        </svg>
      );

    /* Publications — Aufgeschlagenes Buch / Dokument-Stapel. */
    case 'publications':
      return (
        <svg {...props}>
          <path d="M3 5 C5 5 8 5.5 12 7 C16 5.5 19 5 21 5 V19 C19 19 16 19.5 12 21 C8 19.5 5 19 3 19 Z" />
          <path d="M12 7 V21" />
          <path d="M5.5 9 H9.5 M5.5 11.5 H9.5 M5.5 14 H8.5" />
          <path d="M14.5 9 H18.5 M14.5 11.5 H18.5 M14.5 14 H17.5" />
        </svg>
      );

    /* Virtual CISO — Schach-König (strategische Führung). */
    case 'virtual-ciso':
      return (
        <svg {...props}>
          <path d="M12 2 V5 M10 3.5 H14" />
          <path d="M8 8 H16 V11 C16 13 14.5 14 12 14 C9.5 14 8 13 8 11 Z" />
          <path d="M9 14 L8 20 H16 L15 14" />
          <path d="M6.5 20 H17.5 V22 H6.5 Z" />
        </svg>
      );

    /* AI Workflows — Knoten-Pfad mit Verzweigung (Automation). */
    case 'ai-workflows':
      return (
        <svg {...props}>
          <circle cx="5" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M6.5 6.5 L10.5 10.5 M17.5 6.5 L13.5 10.5 M10.5 13.5 L6.5 17.5 M13.5 13.5 L17.5 17.5" />
        </svg>
      );

    /* ───── Journey-Map-Phasen (Overview) ─────
       Jede Phase bekommt ein eigenes Mini-Symbol, gezeichnet so,
       dass es innerhalb des 28×28-Diamanten (rotiert 45°) lesbar bleibt.
       Die Symbole selbst sind NICHT rotiert — sie werden über dem
       Diamant-Rahmen aufrecht gerendert. */

    /* UNDERSTAND — Lupe (Standortbestimmung, Analyse). */
    case 'phase-understand':
      return (
        <svg {...props}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M15 15 L20 20" />
        </svg>
      );

    /* COMPLY — Häkchen im Kreis (Konformität, Audit-Reife). */
    case 'phase-comply':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7.5 12.5 L10.5 15.5 L16.5 9" />
        </svg>
      );

    /* GOVERN — Säulen / Tempel (Führung, Governance). */
    case 'phase-govern':
      return (
        <svg {...props}>
          <path d="M3 7 L12 3 L21 7" />
          <path d="M5 7 V18 M9 7 V18 M15 7 V18 M19 7 V18" />
          <path d="M3 18 H21" />
          <path d="M2 21 H22" />
        </svg>
      );

    /* TRAIN — Stoppuhr (Üben, Tempo, Wiederholung). */
    case 'phase-train':
      return (
        <svg {...props}>
          <circle cx="12" cy="13" r="8" />
          <path d="M9.5 2.5 H14.5" />
          <path d="M12 2.5 V5" />
          <path d="M12 13 L12 8.5 M12 13 L15.5 15" />
        </svg>
      );

    /* RESPOND — Blitz (Reaktion, akute Wirksamkeit). */
    case 'phase-respond':
      return (
        <svg {...props}>
          <path d="M13 2 L4 14 H11 L9 22 L20 9 H13 Z" />
        </svg>
      );

    default:
      return null;
  }
};
