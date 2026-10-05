import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BookOpen,
  Crosshair,
  FlaskConical,
  MessagesSquare,
  Presentation,
  Radar,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Siren,
  Workflow,
} from 'lucide-react';

export type HomeLanguage = 'de' | 'en' | 'fr';
export type LocalizedText = Record<HomeLanguage, string>;

export type HomeOffer = {
  title: LocalizedText;
  description: LocalizedText;
  icon: LucideIcon;
  links: { href: string; label: LocalizedText }[];
};

export type HomeTopic = {
  id: 'security' | 'crisis' | 'exercise';
  number: string;
  title: LocalizedText;
  shortTitle: LocalizedText;
  faceTitle: LocalizedText;
  faceSubtitle: LocalizedText;
  choiceSubtitle: LocalizedText;
  outcome: LocalizedText;
  icon: LucideIcon;
  offers: HomeOffer[];
};

const l = (de: string, en: string, fr: string): LocalizedText => ({ de, en, fr });

export const HOME_TOPICS: HomeTopic[] = [
  {
    id: 'security',
    number: '01',
    title: l('Sicherheit & Compliance', 'Security & Compliance', 'Sécurité & conformité'),
    shortTitle: l('Sicherheit', 'Security', 'Sécurité'),
    faceTitle: l('Sicherheit & Compliance', 'Security & Compliance', 'Sécurité & conformité'),
    faceSubtitle: l('Bewerten · Umsetzen · Steuern', 'Assess · Implement · Govern', 'Évaluer · Mettre en œuvre · Piloter'),
    choiceSubtitle: l('Risiken bewerten. Anforderungen umsetzen.', 'Assess risks. Implement requirements.', 'Évaluer les risques. Mettre en œuvre les exigences.'),
    outcome: l(
      'Erkennen Sie Ihre Risiken und setzen Sie die passenden Anforderungen um.',
      'Identify your risks and implement the requirements that matter.',
      'Identifiez vos risques et mettez en œuvre les exigences pertinentes.',
    ),
    icon: ShieldCheck,
    offers: [
      {
        title: l('Assessments & Konzepte', 'Assessments & concepts', 'Évaluations & concepts'),
        description: l(
          'Wissen, wo Sie stehen und welche Maßnahmen zuerst nötig sind.',
          'Understand where you stand and which actions come first.',
          'Savoir où vous en êtes et quelles actions engager en priorité.',
        ),
        icon: ScanSearch,
        links: [
          { href: '/assessments-concepts', label: l('Standortbestimmung', 'Baseline assessment', 'État des lieux') },
          { href: '/assessment-tools', label: l('Assessment-Tools', 'Assessment tools', 'Outils d’évaluation') },
          { href: '/gapzero', label: l('GapZero', 'GapZero', 'GapZero') },
        ],
      },
      {
        title: l('Compliance & Managementsysteme', 'Compliance & management systems', 'Conformité & systèmes de management'),
        description: l(
          'Anforderungen in klare Verantwortlichkeiten und umsetzbare Maßnahmen übersetzen.',
          'Translate requirements into clear ownership and practical measures.',
          'Traduire les exigences en responsabilités claires et mesures réalisables.',
        ),
        icon: ShieldCheck,
        links: [
          { href: '/isms', label: l('ISO 27001 · BSI-Grundschutz', 'ISO 27001 · BSI Baseline Protection', 'ISO 27001 · Référentiel BSI') },
          { href: '/nis2-dora', label: l('NIS-2 · DORA · PART-IS', 'NIS 2 · DORA · PART-IS', 'NIS 2 · DORA · PART-IS') },
          { href: '/tisax-pci-dss', label: l('TISAX · PCI-DSS', 'TISAX · PCI DSS', 'TISAX · PCI DSS') },
        ],
      },
      {
        title: l('Security-Führung & Betrieb', 'Security leadership & operations', 'Pilotage & opérations de sécurité'),
        description: l(
          'Security steuern und Ihr Team im Alltag entlasten.',
          'Direct security effectively and support your team day to day.',
          'Piloter la sécurité et soutenir votre équipe au quotidien.',
        ),
        icon: Settings2,
        links: [
          { href: '/virtual-ciso', label: l('Virtual CISO', 'Virtual CISO', 'RSSI à temps partagé') },
          { href: '/soc-operations', label: l('SOC-Betrieb & Playbooks', 'SOC operations & playbooks', 'Opérations SOC & playbooks') },
          { href: '/ai-workflows', label: l('KI-gestützte Workflows', 'AI-assisted workflows', 'Workflows assistés par IA') },
        ],
      },
    ],
  },
  {
    id: 'crisis',
    number: '02',
    title: l('Krisen vorbereiten & bewältigen', 'Prepare for & manage crises', 'Préparer & gérer les crises'),
    shortTitle: l('Krise', 'Crisis', 'Crise'),
    faceTitle: l('Krisen bewältigen', 'Manage crises', 'Gérer les crises'),
    faceSubtitle: l('Vorbereiten · Reagieren', 'Prepare · Respond', 'Préparer · Réagir'),
    choiceSubtitle: l('Handeln, entscheiden, kommunizieren.', 'Act, decide and communicate.', 'Agir, décider et communiquer.'),
    outcome: l(
      'Ihr Team weiß, wer entscheidet, wer handelt und wer kommuniziert.',
      'Your team knows who decides, who acts and who communicates.',
      'Votre équipe sait qui décide, qui agit et qui communique.',
    ),
    icon: Siren,
    offers: [
      {
        title: l('Incident Management', 'Incident management', 'Gestion des incidents'),
        description: l(
          'Vorfälle einordnen, eskalieren und die Reaktion koordinieren.',
          'Classify incidents, escalate them and coordinate the response.',
          'Qualifier les incidents, les escalader et coordonner la réponse.',
        ),
        icon: Activity,
        links: [{ href: '/incident-management', label: l('Eskalation · Incident Response', 'Escalation · Incident response', 'Escalade · Réponse aux incidents') }],
      },
      {
        title: l('Notfallmanagement · BCM', 'Emergency management · BCM', 'Gestion d’urgence · PCA'),
        description: l(
          'Wichtige Abläufe bei Ausfällen aufrechterhalten und den Wiederanlauf vorbereiten.',
          'Maintain critical operations during outages and prepare recovery.',
          'Maintenir les activités critiques en cas d’arrêt et préparer la reprise.',
        ),
        icon: Workflow,
        links: [
          { href: '/bcm', label: l('Notfallpläne · Wiederanlauf', 'Emergency plans · Recovery', 'Plans d’urgence · Reprise') },
          { href: '/notnagel', label: l('Notnagel BCM-Werkzeug', 'Notnagel BCM tool', 'Outil PCA Notnagel') },
        ],
      },
      {
        title: l('Cyber-Krisenmanagement', 'Cyber crisis management', 'Gestion de crise cyber'),
        description: l(
          'Krisenstab, Entscheidungen und Kommunikation aufeinander abstimmen.',
          'Align the crisis team, decisions and communications.',
          'Aligner cellule de crise, décisions et communication.',
        ),
        icon: Siren,
        links: [{ href: '/cyber-crisis-management', label: l('Vorbereitung · Krisenbewältigung · Kommunikation', 'Preparedness · Crisis response · Communications', 'Préparation · Gestion de crise · Communication') }],
      },
    ],
  },
  {
    id: 'exercise',
    number: '03',
    title: l('Üben & trainieren', 'Exercise & train', 'Exercer & former'),
    shortTitle: l('Üben', 'Exercise', 'Exercer'),
    faceTitle: l('Üben & trainieren', 'Exercise & train', 'Exercer & former'),
    faceSubtitle: l('Erproben · Lernen · Verbessern', 'Test · Learn · Improve', 'Tester · Apprendre · Améliorer'),
    choiceSubtitle: l('Teams auf den Ernstfall vorbereiten.', 'Prepare teams for real incidents.', 'Préparer les équipes aux situations réelles.'),
    outcome: l(
      'Erproben Sie Abläufe und Entscheidungen, bevor der Ernstfall eintritt.',
      'Test procedures and decisions before a real incident occurs.',
      'Testez les procédures et les décisions avant qu’une crise ne survienne.',
    ),
    icon: Radar,
    offers: [
      {
        title: l('Tabletop & Krisensimulation', 'Tabletop & crisis simulation', 'Exercices sur table & simulation de crise'),
        description: l(
          'Entscheidungen und Zusammenarbeit an realistischen Szenarien üben.',
          'Practise decisions and collaboration using realistic scenarios.',
          'Entraîner les décisions et la coopération sur des scénarios réalistes.',
        ),
        icon: MessagesSquare,
        links: [
          { href: '/dora-nis2-ttx', label: l('DORA & NIS-2 TTX', 'DORA & NIS 2 TTX', 'TTX DORA & NIS 2') },
          { href: '/ttx-readiness', label: l('TTX Readiness', 'TTX readiness', 'Préparation TTX') },
        ],
      },
      {
        title: l('TIBER Test', 'TIBER testing', 'Test TIBER'),
        description: l(
          'Die Vorbereitung und Koordination eines bedrohungsgeleiteten Tests strukturieren.',
          'Structure the preparation and coordination of a threat-led test.',
          'Structurer la préparation et la coordination d’un test fondé sur la menace.',
        ),
        icon: Crosshair,
        links: [{ href: '/arena-training', label: l('TIBER · Testkoordination', 'TIBER · Test coordination', 'TIBER · Coordination du test') }],
      },
      {
        title: l('Events & Trainings', 'Events & training', 'Événements & formations'),
        description: l(
          'Teams und Führungskräfte auf ihre Aufgaben im Ernstfall vorbereiten.',
          'Prepare teams and executives for their responsibilities during an incident.',
          'Préparer les équipes et les dirigeants à leurs missions en situation de crise.',
        ),
        icon: Presentation,
        links: [{ href: '/events-workshops', label: l('Praxisübungen · Training', 'Practical exercises · Training', 'Exercices pratiques · Formation') }],
      },
    ],
  },
];

export const HOME_KNOWLEDGE = [
  {
    title: l('Fachartikel & Insights', 'Articles & insights', 'Articles & analyses'),
    description: l('iX-Fachartikel, building IoT 2024, ISACA-Training CSE.', 'iX articles, building IoT 2024, ISACA CSE training.', 'Articles iX, building IoT 2024, formation ISACA CSE.'),
    icon: BookOpen,
    href: '/publications',
  },
  {
    title: l('KI-Lab', 'AI lab', 'Laboratoire IA'),
    description: l('Ausgewählte Anwendungen für Assessments, Übungen und Lernen.', 'Selected applications for assessments, exercises and learning.', 'Applications sélectionnées pour l’évaluation, les exercices et l’apprentissage.'),
    icon: FlaskConical,
    href: '/ki-lab',
  },
];