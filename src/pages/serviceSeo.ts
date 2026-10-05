/**
 * Per-route SEO metadata for the service sub-pages rendered by ChatView.
 *
 * Titles are kept short (≤ 38 chars) because PageMeta appends
 * " · inside-the-box.org" (21 chars), keeping the final <title> under 60.
 * Descriptions stay within the 50–160 character window search engines show.
 */
export interface ServiceSeo {
  title: string;
  description: string;
}

type SeoLanguage = 'de' | 'en' | 'fr';
type LocalizedServiceSeo = Record<SeoLanguage, ServiceSeo>;

export const SITE_SEO: ServiceSeo = {
  title: 'Cybersecurity Consulting & Training',
  description:
    'Senior cybersecurity consulting and cyber crisis training: ISO 27001, IEC 62443, NIS-2, DORA, TISAX, incident response and tabletop exercises.',
};

export const SERVICE_SEO: Record<string, ServiceSeo> = {
  isms: {
    title: 'ISMS: ISO 27001 & IT-Grundschutz',
    description:
      'ISMS design, implementation and audit preparation along ISO 27001, BSI IT-Grundschutz and IEC 62443 for IT and OT environments.',
  },
  'nis2-dora': {
    title: 'NIS-2 & DORA Compliance',
    description:
      'NIS-2 and DORA readiness: gap analysis, governance, reporting duties, supplier requirements and management liability in practical steps.',
  },
  'tisax-pci-dss': {
    title: 'TISAX & PCI-DSS Readiness',
    description:
      'TISAX assessment level scoping and PCI-DSS SAQ preparation: scope definition, control evidence and audit-ready documentation.',
  },
  'assessments-concepts': {
    title: 'Security Assessments & Concepts',
    description:
      'Independent security assessments, maturity reviews and security concepts with prioritised, budget-aware remediation roadmaps.',
  },
  'incident-management': {
    title: 'Incident Response Management',
    description:
      'Incident response capability build-up: playbooks, escalation paths, forensic readiness and post-incident lessons-learned processes.',
  },
  bcm: {
    title: 'BCM & ISO 22301',
    description:
      'Business continuity management to ISO 22301: business impact analysis, RTO/RPO targets, continuity plans and exercise programmes.',
  },
  'cyber-crisis-management': {
    title: 'Cyber Crisis Management',
    description:
      'Cyber crisis management for executives: crisis organisation, decision rights, communication lines and realistic crisis exercises.',
  },
  'arena-training': {
    title: 'Cyber Range & Red Team Training',
    description:
      'Hands-on cyber range and red team training: attack simulations, blue team drills and measurable defensive skill development.',
  },
  'events-workshops': {
    title: 'Events & Security Workshops',
    description:
      'Security workshops, awareness formats and keynote sessions tailored to management, IT and OT audiences in German, English or French.',
  },
  publications: {
    title: 'Publications & Insights',
    description:
      'Articles, talks and trainings by Marcel Knop on cybersecurity and cyber crisis management: iX articles, building IoT, ISACA CSE.',
  },
  'virtual-ciso': {
    title: 'Virtual CISO (vCISO)',
    description:
      'Virtual CISO services: security strategy, board reporting, risk decisions and programme steering without a full-time hire.',
  },
  'soc-operations': {
    title: 'SOC Operations & Monitoring',
    description:
      'SOC design and operations: use cases, detection engineering, alert triage, KPIs and realistic staffing and tooling decisions.',
  },
  'ai-workflows': {
    title: 'AI Workflows for Security',
    description:
      'AI-assisted security workflows: automation of assessments, documentation and reporting with clear data protection guardrails.',
  },
  'dora-nis2-ttx': {
    title: 'DORA & NIS-2 Tabletop Exercises',
    description:
      'Tabletop exercises for DORA and NIS-2: regulatory reporting clocks, decision drills and documented evidence for auditors.',
  },
  why: {
    title: 'Cyber Training Range',
    description:
      'The Cyber Training Range concept: why realistic exercises change behaviour faster than slide decks and policy documents.',
  },
  'ki-lab': {
    title: 'AI Lab: Compliance Tools',
    description:
      'Free browser-based AI tools for compliance and training: assessment wizards, crisis simulators and awareness quizzes.',
  },
  contact: {
    title: 'Contact',
    description:
      'Get in touch for cybersecurity consulting, audit preparation or a cyber crisis exercise tailored to your organisation.',
  },
  imprint: {
    title: 'Imprint',
    description:
      'Legal notice and provider identification for inside-the-box.org, including contact details and responsible parties.',
  },
  'nis2-compliance': {
    title: 'NIS-2 Compliance Check',
    description:
      'Interactive NIS-2 compliance check: assess governance, risk management and reporting duties, then export an audit-grade report.',
  },
  iec62443: {
    title: 'IEC 62443 Assessment',
    description:
      'IEC 62443 assessment for industrial control systems: zones, conduits, security levels and documented conformance findings.',
  },
  'iacs-e27': {
    title: 'IACS UR E27 Assessment',
    description:
      'IACS UR E27 assessment for onboard systems: requirement-by-requirement evidence review and maritime-calibrated findings.',
  },
  'soc-life': {
    title: 'SOC Life Simulation',
    description:
      'SOC Life simulation: run a security operations centre, triage incidents and feel the trade-offs between alerts, staff and budget.',
  },
  'ot-soc-life': {
    title: 'OT SOC Life Simulation',
    description:
      'OT SOC Life simulation: defend an industrial plant, balance safety and availability, and learn OT incident response decisions.',
  },
  'ai-act-readiness': {
    title: 'EU AI Act Readiness Check',
    description:
      'EU AI Act readiness check: classify AI systems by risk, review obligations and export a structured readiness report.',
  },
};

const LOCALIZED_SERVICE_SEO: Partial<Record<string, LocalizedServiceSeo>> = {
  isms: {
    de: { title: 'ISMS & ISO 27001', description: 'ISMS aufbauen, in reale Abläufe integrieren und Audits nach ISO 27001, BSI IT-Grundschutz oder IEC 62443 fundiert vorbereiten.' },
    en: { title: 'ISMS & ISO 27001', description: 'Build an ISMS, integrate it into real operations and prepare soundly for ISO 27001, BSI IT-Grundschutz or IEC 62443 audits.' },
    fr: { title: 'SMSI & ISO 27001', description: 'Construire un SMSI, l’intégrer aux opérations et préparer rigoureusement les audits ISO 27001, BSI IT-Grundschutz ou IEC 62443.' },
  },
  'nis2-dora': {
    de: { title: 'NIS-2 & DORA', description: 'Betroffenheit, Governance, Risikomaßnahmen und Nachweise für NIS-2 und DORA strukturiert klären und priorisieren.' },
    en: { title: 'NIS 2 & DORA', description: 'Clarify and prioritise scope, governance, risk measures and evidence for NIS 2 and DORA in a structured way.' },
    fr: { title: 'NIS 2 & DORA', description: 'Clarifier et prioriser de manière structurée l’applicabilité, la gouvernance, les mesures de risque et les preuves NIS 2 et DORA.' },
  },
  'tisax-pci-dss': {
    de: { title: 'TISAX & PCI DSS', description: 'Scope, Assessment Level, SAQ, Kontrollen und Nachweise für TISAX- und PCI-DSS-Prüfungen sauber vorbereiten.' },
    en: { title: 'TISAX & PCI DSS', description: 'Prepare scope, assessment level, SAQ, controls and evidence for TISAX and PCI DSS assessments.' },
    fr: { title: 'TISAX & PCI DSS', description: 'Préparer précisément périmètre, niveau d’évaluation, SAQ, contrôles et preuves pour les évaluations TISAX et PCI DSS.' },
  },
  'assessments-concepts': {
    de: { title: 'Assessments & Konzepte', description: 'Sicherheitslage unabhängig bewerten, Lücken priorisieren und umsetzbare Sicherheitskonzepte mit klarer Roadmap entwickeln.' },
    en: { title: 'Assessments & Concepts', description: 'Assess security independently, prioritise gaps and develop actionable security concepts with a clear roadmap.' },
    fr: { title: 'Évaluations & concepts', description: 'Évaluer la sécurité avec indépendance, prioriser les écarts et développer des concepts applicables avec une feuille de route claire.' },
  },
  'cyber-crisis-management': {
    de: { title: 'Cyber-Krisenmanagement', description: 'Krisenorganisation, Entscheidungswege und Kommunikation so vorbereiten, dass Führung und Koordination im Cyber-Ernstfall funktionieren.' },
    en: { title: 'Cyber Crisis Management', description: 'Prepare crisis organisation, decision paths and communications so leadership and coordination work during a serious cyber incident.' },
    fr: { title: 'Gestion de cyber-crise', description: 'Préparer organisation, décisions et communication pour piloter et coordonner efficacement une cyber-crise réelle.' },
  },
  'incident-management': {
    de: { title: 'Incident Management', description: 'Technische und operative Reaktion auf Sicherheitsvorfälle mit klarer Triage, Eskalation, Koordination und Nachbereitung.' },
    en: { title: 'Incident Management', description: 'Technical and operational incident response with clear triage, escalation, coordination and post-incident review.' },
    fr: { title: 'Gestion des incidents', description: 'Réponse technique et opérationnelle avec triage, escalade, coordination et retour d’expérience clairement définis.' },
  },
  bcm: {
    de: { title: 'Notfallmanagement & BCM', description: 'Kritische Geschäftsprozesse absichern, Wiederanlaufziele festlegen und belastbare Notfallpläne nach ISO 22301 und BSI 200-4 entwickeln.' },
    en: { title: 'Business Continuity & BCM', description: 'Protect critical business processes, set recovery objectives and develop robust continuity plans aligned with ISO 22301 and BSI 200-4.' },
    fr: { title: 'Continuité d’activité & PCA', description: 'Protéger les activités critiques, définir les objectifs de reprise et élaborer des plans robustes selon ISO 22301 et BSI 200-4.' },
  },
  'arena-training': {
    de: { title: 'Cyber Range & Red Team', description: 'Angriffe realistisch simulieren und technische Teams in Cyber Range, Blue-Team-Drills und Red-Team-Szenarien gezielt trainieren.' },
    en: { title: 'Cyber Range & Red Team', description: 'Simulate attacks realistically and train technical teams through cyber range, blue-team drills and red-team scenarios.' },
    fr: { title: 'Cyber Range & Red Team', description: 'Simuler des attaques réalistes et entraîner les équipes techniques par cyber range, exercices blue team et scénarios red team.' },
  },
  'events-workshops': {
    de: { title: 'Events & Workshops', description: 'Moderierte Security-Workshops, Awareness-Formate und Fachvorträge passend zu Zielgruppe, Anlass und gewünschtem Ergebnis.' },
    en: { title: 'Events & Workshops', description: 'Facilitated security workshops, awareness formats and talks aligned with the audience, occasion and intended outcome.' },
    fr: { title: 'Événements & ateliers', description: 'Ateliers sécurité animés, sensibilisation et conférences adaptés au public, au contexte et au résultat recherché.' },
  },
  publications: {
    de: { title: 'Artikel, Vorträge & Trainings', description: 'Fachartikel, Vorträge und Trainings von Marcel Knop zu Cybersecurity und Krisenbewältigung, u. a. iX, building IoT und ISACA.' },
    en: { title: 'Articles, talks & trainings', description: 'Articles, talks and trainings by Marcel Knop on cybersecurity and crisis management, including iX, building IoT and ISACA.' },
    fr: { title: 'Articles, conférences & formations', description: 'Articles, conférences et formations de Marcel Knop en cybersécurité et gestion de crise, notamment iX, building IoT et ISACA.' },
  },
  'virtual-ciso': {
    de: { title: 'Virtual CISO', description: 'Informationssicherheit strategisch steuern, Risiken entscheiden und Management-Reporting mit erfahrener CISO-Unterstützung etablieren.' },
    en: { title: 'Virtual CISO', description: 'Direct information security strategy, make risk decisions and establish management reporting with experienced CISO support.' },
    fr: { title: 'CISO virtuel', description: 'Piloter la stratégie de sécurité, décider des risques et établir le reporting de direction avec un accompagnement CISO expérimenté.' },
  },
  'soc-operations': {
    de: { title: 'SOC-Betrieb & Playbooks', description: 'SOC-Prozesse, Use Cases, Triage, Eskalation und Kennzahlen so strukturieren, dass Security Monitoring wirksam betrieben werden kann.' },
    en: { title: 'SOC Operations & Playbooks', description: 'Structure SOC processes, use cases, triage, escalation and metrics so security monitoring can operate effectively.' },
    fr: { title: 'Opérations SOC & playbooks', description: 'Structurer processus SOC, cas d’usage, triage, escalade et indicateurs pour exploiter efficacement la surveillance sécurité.' },
  },
  'ai-workflows': {
    de: { title: 'KI-Workflows für Security', description: 'Wiederkehrende Security- und Compliance-Aufgaben mit klaren Daten- und Prüfgrenzen sinnvoll automatisieren.' },
    en: { title: 'AI Workflows for Security', description: 'Automate recurring security and compliance tasks sensibly with clear data and review boundaries.' },
    fr: { title: 'Workflows IA pour la sécurité', description: 'Automatiser utilement les tâches récurrentes de sécurité et conformité avec des limites claires pour les données et la revue.' },
  },
  'dora-nis2-ttx': {
    de: { title: 'DORA & NIS-2 TTX', description: 'Tabletop Exercises für Entscheidungswege, regulatorische Meldungen und belastbare Nachweise nach DORA und NIS-2 gestalten.' },
    en: { title: 'DORA & NIS 2 TTX', description: 'Design tabletop exercises for decision paths, regulatory reporting and robust evidence under DORA and NIS 2.' },
    fr: { title: 'TTX DORA & NIS 2', description: 'Concevoir des exercices sur table pour les décisions, les notifications réglementaires et les preuves DORA et NIS 2.' },
  },
  why: {
    de: { title: 'Cyber Training Range', description: 'Realistische Übungen machen Rollen, Entscheidungen und technische Reaktion unter Druck überprüfbar und verbesserbar.' },
    en: { title: 'Cyber Training Range', description: 'Realistic exercises make roles, decisions and technical response under pressure observable and improvable.' },
    fr: { title: 'Cyber Training Range', description: 'Des exercices réalistes rendent observables et améliorables les rôles, décisions et réponses techniques sous pression.' },
  },
  'ki-lab': {
    de: { title: 'KI-Lab & Werkzeuge', description: 'Direkt nutzbare und geschützte Simulationen, Checks und Lernformate für Security, Compliance und Krisenmanagement.' },
    en: { title: 'AI Lab & Tools', description: 'Open and protected simulations, checks and learning formats for security, compliance and crisis management.' },
    fr: { title: 'Lab IA & outils', description: 'Simulations, évaluations et formats pédagogiques ouverts ou protégés pour sécurité, conformité et gestion de crise.' },
  },
  contact: {
    de: { title: 'Kontakt', description: 'Kontakt zu Marcel Knop für Cybersecurity, Compliance, Krisenmanagement, Assessments und Übungen.' },
    en: { title: 'Contact', description: 'Contact Marcel Knop about cybersecurity, compliance, crisis management, assessments and exercises.' },
    fr: { title: 'Contact', description: 'Contacter Marcel Knop pour cybersécurité, conformité, gestion de crise, évaluations et exercices.' },
  },
  imprint: {
    de: { title: 'Impressum & Datenschutz', description: 'Impressum, Anbieterkennzeichnung und Datenschutzhinweise von inside-the-box.org.' },
    en: { title: 'Legal notice & privacy', description: 'Legal notice, provider information and privacy information for inside-the-box.org.' },
    fr: { title: 'Mentions légales & confidentialité', description: 'Mentions légales, informations sur l’éditeur et confidentialité de inside-the-box.org.' },
  },
};

export const getServiceSeo = (serviceId: string | null, fallbackLabel?: string, language: SeoLanguage = 'en'): ServiceSeo => {
  if (!serviceId) return SITE_SEO;
  const localized = LOCALIZED_SERVICE_SEO[serviceId]?.[language];
  if (localized) return localized;
  const hit = SERVICE_SEO[serviceId];
  if (hit) return hit;
  const label = (fallbackLabel || serviceId).slice(0, 38);
  return {
    title: label,
    description: `${label} — cybersecurity consulting, compliance and cyber crisis training by inside-the-box.org.`,
  };
};
