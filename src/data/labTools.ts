import { AlertTriangle, Building2, Car, ClipboardList, CreditCard, Crosshair, Factory, Landmark, Play, Scale, Shield, Skull, TrendingDown, type LucideIcon } from 'lucide-react';

/**
 * KI-Lab entries: one model for the /ki-lab cards, the workspace orientation
 * (breadcrumb, page title, "Zurück zum KI-Lab") and the wide game frame.
 * `slug` null = opens in place (video dialog), no own route.
 */
export type LabTool = {
  slug: string | null;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  /** Large play surface: workspace collapses its side navigation into the menu. */
  wide?: boolean;
};

type L = { de: string; en: string; fr: string };

export const LAB_GROUPS: { id: string; label: L; tools: LabTool[] }[] = [
  {
    id: 'exercise',
    label: { de: 'Krisenübung', en: 'Crisis exercise', fr: 'Exercice de crise' },
    tools: [
      { slug: 'crisis-sim', titleKey: 'crisisSim.sidebarLabel', descKey: 'aiWorkflows.agentCrisisDesc', icon: AlertTriangle, wide: true },
      { slug: null, titleKey: 'aiWorkflows.agentYtTitle', descKey: 'aiWorkflows.agentYtDesc', icon: Play },
    ],
  },
  {
    id: 'checks',
    label: { de: 'Regulierungs-Checks', en: 'Regulatory checks', fr: 'Contrôles réglementaires' },
    tools: [
      { slug: 'dora-check', titleKey: 'aiWorkflows.agentDoraTitle', descKey: 'aiWorkflows.agentDoraDesc', icon: Landmark },
      { slug: 'tisax-check', titleKey: 'aiWorkflows.agentTisaxTitle', descKey: 'aiWorkflows.agentTisaxDesc', icon: Car },
      { slug: 'pci-check', titleKey: 'aiWorkflows.agentPciTitle', descKey: 'aiWorkflows.agentPciDesc', icon: CreditCard },
      { slug: 'ttx-check', titleKey: 'aiWorkflows.agentTtxTitle', descKey: 'aiWorkflows.agentTtxDesc', icon: ClipboardList },
    ],
  },
  {
    id: 'learn',
    label: { de: 'Lernen & Spiele', en: 'Learning & games', fr: 'Apprentissage & jeux' },
    tools: [
      { slug: 'nis2-quiz', titleKey: 'aiWorkflows.agentNis2QuizTitle', descKey: 'aiWorkflows.agentNis2QuizDesc', icon: Scale },
      { slug: 'ciso-sim', titleKey: 'aiWorkflows.agentCisoTitle', descKey: 'aiWorkflows.agentCisoDesc', icon: TrendingDown },
      { slug: 'threatdrop', titleKey: 'aiWorkflows.agentThreatDropTitle', descKey: 'aiWorkflows.agentThreatDropDesc', icon: Shield },
      { slug: 'trigger-triage', titleKey: 'aiWorkflows.agentTriggerTriageTitle', descKey: 'aiWorkflows.agentTriggerTriageDesc', icon: Crosshair, wide: true },
      { slug: 'soc-life', titleKey: 'aiWorkflows.agentSocLifeTitle', descKey: 'aiWorkflows.agentSocLifeDesc', icon: Building2, wide: true },
      { slug: 'ot-soc-life', titleKey: 'aiWorkflows.agentOtSocLifeTitle', descKey: 'aiWorkflows.agentOtSocLifeDesc', icon: Factory, wide: true },
      { slug: 'syndicate', titleKey: 'aiWorkflows.syndicateTitle', descKey: 'aiWorkflows.syndicateDesc', icon: Skull },
    ],
  },
];

export const LAB_TOOLS = LAB_GROUPS.flatMap((g) => g.tools);
export const labToolForPath = (pathname: string) => {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  return LAB_TOOLS.find((tool) => tool.slug === slug) ?? null;
};

/**
 * Every routed tool, game or lab page rendered inside the public workspace:
 * KI-Lab entries plus direct-link tools. Drives breadcrumb, visible title,
 * return link and the wide play-surface frame.
 */
export type FramedTool = { titleKey?: string; title?: L; back: '/ki-lab' | '/assessment-tools'; wide: boolean };
const t3 = (de: string, en = de, fr = de): L => ({ de, en, fr });
const DIRECT_TOOLS: Record<string, FramedTool> = {
  'ai-workflows': { titleKey: 'aiWorkflows.title', back: '/ki-lab', wide: false },
  'cyber-frogger': { title: t3('Cyber Frogger'), back: '/ki-lab', wide: true },
  'elite-ship': { title: t3('Elite Ship'), back: '/ki-lab', wide: true },
  'butterfly-lab': { title: t3('Butterfly Effect Lab'), back: '/ki-lab', wide: true },
  wcst: { title: t3('Wisconsin Card Sorting Test'), back: '/ki-lab', wide: false },
  'datenschutz-tools': { title: t3('Datenschutz & Datenfluss'), back: '/assessment-tools', wide: false },
  'system-check': { title: t3('System-Check', 'System check', 'Vérification système'), back: '/ki-lab', wide: false },
  'cra-check': { title: t3('CRA Compliance Tool'), back: '/assessment-tools', wide: false },
  'dora-compliance': { title: t3('DORA Compliance Tool'), back: '/assessment-tools', wide: false },
  'nis2-compliance': { title: t3('NIS-2 Compliance Tool'), back: '/assessment-tools', wide: false },
  iec62443: { title: t3('IEC 62443 Assessment'), back: '/assessment-tools', wide: false },
  'iacs-e27': { title: t3('IEC 62443 Assessment'), back: '/assessment-tools', wide: false },
  'ai-act-readiness': { title: t3('EU AI Act Readiness Assessment'), back: '/assessment-tools', wide: false },
};
export const framedToolForPath = (pathname: string): FramedTool | null => {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  const lab = LAB_TOOLS.find((tool) => tool.slug === slug);
  if (lab) return { titleKey: lab.titleKey, back: '/ki-lab', wide: Boolean(lab.wide) };
  return DIRECT_TOOLS[slug] ?? null;
};
