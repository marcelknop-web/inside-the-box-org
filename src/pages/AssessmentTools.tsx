import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, Network, Server, Ship, ShieldCheck, Factory, Car, CreditCard,
  Sparkles, AlertCircle, ClipboardList, GraduationCap, Lock, Download,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { SiteChrome } from '@/components/SiteChrome';
import { PasswordGate } from '@/components/PasswordGate';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';

type Lang = 'en' | 'de' | 'fr';
type Tri = Record<Lang, string>;

interface Tool {
  icon: LucideIcon;
  path: string;
  protected?: boolean;
  title: string;
  desc: Tri;
}

interface Group {
  label: Tri;
  tools: Tool[];
}

const GROUPS: Group[] = [
  {
    label: {
      de: 'Universal (Beta)',
      en: 'Universal (Beta)',
      fr: 'Universel (Bêta)',
    },
    tools: [
      {
        icon: Sparkles, path: '/meta-assessment', protected: true, title: 'Meta-Assessment',
        desc: {
          de: 'Universelles Tool: Standard wählen → Intake → KI-Auswertung → Reporting.',
          en: 'Universal tool: pick a standard → intake → AI evaluation → reporting.',
          fr: 'Outil universel : standard → intake → IA → rapport.',
        },
      },
    ],
  },
  {
    label: {
      de: 'Assessments',
      en: 'Assessments',
      fr: 'Évaluations',
    },
    tools: [
      {
        icon: Network, path: '/nis2-compliance', protected: true, title: 'NIS2',
        desc: {
          de: 'Audit-Workflow inkl. PDF-Report nach NIS-2.',
          en: 'Audit workflow with PDF report per NIS-2.',
          fr: 'Flux d\'audit avec rapport PDF selon NIS-2.',
        },
      },
      {
        icon: Network, path: '/dora-compliance', protected: true, title: 'DORA',
        desc: {
          de: 'DORA-Selbstbewertung mit KI-gestütztem Reasoning.',
          en: 'DORA self-assessment with AI-assisted reasoning.',
          fr: 'Auto-évaluation DORA avec raisonnement IA.',
        },
      },
      {
        icon: Sparkles, path: '/ai-act-readiness', protected: true, title: 'AI Act',
        desc: {
          de: 'Risikoklassifizierung nach Reg. (EU) 2024/1689.',
          en: 'Risk classification per Reg. (EU) 2024/1689.',
          fr: 'Classification des risques selon Règl. (UE) 2024/1689.',
        },
      },
      {
        icon: Car, path: '/tisax-check', title: 'TISAX',
        desc: {
          de: 'AL1–AL3 Klassifizierungs-Wizard für Automotive.',
          en: 'AL1–AL3 classification wizard for automotive.',
          fr: 'Assistant de classification AL1–AL3 (automobile).',
        },
      },
      {
        icon: CreditCard, path: '/pci-check', title: 'PCI-DSS',
        desc: {
          de: 'Selbstbewertungs-Pfad-Wizard für Payment.',
          en: 'Self-assessment path wizard for payment.',
          fr: 'Assistant de parcours d\'auto-évaluation paiement.',
        },
      },
      {
        icon: Factory, path: '/iec62443', protected: true, title: 'IEC 62443',
        desc: {
          de: 'OT-Security-Assessment nach IEC 62443.',
          en: 'OT security assessment per IEC 62443.',
          fr: 'Évaluation sécurité OT selon IEC 62443.',
        },
      },
      {
        icon: Server, path: '/cra-check', protected: true, title: 'CRA',
        desc: {
          de: 'Cyber Resilience Act — Einzelsystem-Assessment.',
          en: 'Cyber Resilience Act — individual system assessment.',
          fr: 'Cyber Resilience Act — évaluation des systèmes individuels.',
        },
      },
      {
        icon: Ship, path: '/iacs-ur26', protected: true, title: 'UR E26',
        desc: {
          de: 'Maritime Cyber-Resilience — Schiff als Ganzes.',
          en: 'Maritime cyber resilience — vessel as a whole.',
          fr: 'Cyber-résilience maritime — navire dans son ensemble.',
        },
      },
      {
        icon: ShieldCheck, path: '/iacs-ur27', protected: true, title: 'UR E27',
        desc: {
          de: 'IACS UR E27 — Einzelsysteme.',
          en: 'IACS UR E27 — individual systems.',
          fr: 'IACS UR E27 — systèmes individuels.',
        },
      },
    ],
  },
  {
    label: {
      de: 'Spezialisierte Tools',
      en: 'Specialized Tools',
      fr: 'Outils Spécialisés',
    },
    tools: [
      {
        icon: AlertCircle, path: '/dora-check', title: 'DORA Incident Classification',
        desc: {
          de: 'Major-Incident-Bewertung nach Art. 18 DORA.',
          en: 'Major-incident assessment per Art. 18 DORA.',
          fr: 'Évaluation d\'incident majeur selon l\'art. 18 DORA.',
        },
      },
      {
        icon: GraduationCap, path: '/ttx-readiness', title: 'TTX Readiness',
        desc: {
          de: 'Reifegrad-Check für Krisenübungen.',
          en: 'Maturity check for crisis exercises.',
          fr: 'Bilan de maturité pour exercices de crise.',
        },
      },
      {
        icon: ClipboardList, path: '/ttx-check', title: 'Scenario Prioritizer',
        desc: {
          de: 'Szenario-Priorisierung für Tabletop-Übungen.',
          en: 'Scenario prioritisation for tabletop exercises.',
          fr: 'Priorisation de scénarios pour exercices tabletop.',
        },
      },
    ],
  },
];

const AssessmentTools = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language as Lang;

  const sectionLabel = lang === 'de' ? '/ ASSESSMENT-TOOLS' : lang === 'fr' ? '/ OUTILS D\'ÉVALUATION' : '/ ASSESSMENT TOOLS';
  const headline =
    lang === 'de' ? 'Alle Assessment- & Compliance-Tools'
    : lang === 'fr' ? 'Tous les outils d\'évaluation et de conformité'
    : 'All assessment & compliance tools';
  const subline =
    lang === 'de' ? 'Direkter Zugang zu jedem Tool — ob verlinkt oder nicht.'
    : lang === 'fr' ? 'Accès direct à chaque outil — référencé ou non.'
    : 'Direct access to every tool — linked or not.';
  const protectedLabel =
    lang === 'de' ? 'Passwortgeschützt' : lang === 'fr' ? 'Protégé par mot de passe' : 'Password-protected';
  const downloadLabel =
    lang === 'de' ? 'Build-Anleitung herunterladen'
    : lang === 'fr' ? 'Télécharger le guide de construction'
    : 'Download build guide';

  return (
    <SiteChrome>
      <PasswordGate storageKey="assessment-tools" label="Assessment Tools">
      <PageMeta
        title="Assessment Tools — Inside the Box"
        description="Zentraler Einstieg zu allen Assessment- und Compliance-Tools: NIS-2, DORA, IEC 62443, IACS UR E26/E27, TISAX, PCI-DSS, EU AI Act und mehr."
      />
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-10 sm:mb-14">
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary mb-3">
            {sectionLabel}
          </div>
          <h1 className="font-mono text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight">
            {headline}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            {subline}
          </p>
          <a
            href="/assessment-tools-build-guide.md"
            download="assessment-tools-build-guide.md"
            className="inline-flex items-center gap-2 mt-5 font-mono text-xs text-primary border border-primary/25 rounded-lg px-4 py-2.5 hover:border-primary/60 hover:bg-primary/5 transition-colors"
          >
            <Download size={14} />
            {downloadLabel}
          </a>
        </header>

        <div className="space-y-12">
          {GROUPS.map((group) => (
            <section key={group.label.en}>
              <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-5">
                {group.label[lang]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.title + tool.path}
                      onClick={() => navigate(tool.path)}
                      className="group text-left bg-background/40 border border-primary/15 rounded-lg p-5 hover:border-primary/40 transition-colors shadow-[0_1px_3px_hsl(216_50%_3%/0.3)]"
                    >
                      <div className="flex items-start gap-3.5">
                        <Icon size={20} className="mt-0.5 flex-shrink-0 text-primary opacity-75" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-mono text-[15px] text-foreground leading-tight">
                              {tool.title}
                            </h3>
                            {tool.protected && (
                              <span
                                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border/60 rounded px-1.5 py-0.5"
                                title={protectedLabel}
                              >
                                <Lock size={9} /> {protectedLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                            {tool.desc[lang]}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-3 font-mono text-xs text-primary group-hover:gap-2 transition-all">
                            {lang === 'de' ? 'Öffnen' : lang === 'fr' ? 'Ouvrir' : 'Open'}
                            <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
      </PasswordGate>
    </SiteChrome>
  );
};

export default AssessmentTools;
