import type { StandardProfile } from './types';

// ── ISO 22301 profile ───────────────────────────────────────────
// ISO 22301:2019 — Business Continuity Management Systems (BCMS).
// Covers the management-system clauses (4–10) and the operational
// planning controls: business impact analysis, risk assessment,
// continuity strategies, plans, and exercising/testing.
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const ISO22301_PROFILE: StandardProfile = {
  id: 'iso22301',
  name: 'ISO 22301',
  icon: 'Activity',
  available: true,
  fullName: {
    de: 'ISO 22301:2019 — Business Continuity Management',
    en: 'ISO 22301:2019 — Business Continuity Management',
    fr: 'ISO 22301:2019 — Management de la continuité d\'activité',
  },
  regulation: {
    de: 'ISO/IEC 22301:2019',
    en: 'ISO/IEC 22301:2019',
    fr: 'ISO/IEC 22301:2019',
  },
  description: {
    de: 'Audit-Workflow für ein Business-Continuity-Managementsystem (BCMS) nach ISO 22301.',
    en: 'Conformity audit workflow for a Business Continuity Management System (BCMS) under ISO 22301.',
    fr: "Flux d'audit de conformité pour un système de management de la continuité d'activité (SMCA) selon ISO 22301.",
  },
  intake: [
    {
      title: { de: 'Organisation & Bewertungsobjekt', en: 'Organisation & assessment object', fr: "Organisation & objet d'évaluation" },
      subtitle: {
        de: 'Welcher Geltungsbereich des BCMS wird bewertet?',
        en: 'Which BCMS scope is being assessed?',
        fr: 'Quel périmètre du SMCA est évalué ?',
      },
      info: {
        de: 'ISO 22301 strukturiert das BCMS nach den HLS-Klauseln 4–10 mit operativer Planung (BIA, Strategien, Pläne, Übungen).',
        en: 'ISO 22301 structures the BCMS along HLS clauses 4–10 with operational planning (BIA, strategies, plans, exercises).',
        fr: "ISO 22301 structure le SMCA selon les clauses HLS 4–10 avec planification opérationnelle (BIA, stratégies, plans, exercices).",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Geltungsbereich', en: 'Organisation / scope', fr: 'Organisation / périmètre' },
          placeholder: { de: 'z. B. Muster GmbH, IT-Services', en: 'e.g. Acme Ltd, IT services', fr: 'p. ex. Exemple SARL, services IT' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle / Verantwortung', en: 'Role / responsibility', fr: 'Rôle / responsabilité' },
          options: [
            { id: 'owner', icon: '🏢', label: { de: 'BCM-Verantwortung / Leitung', en: 'BCM owner / leadership', fr: 'Responsable PCA / direction' }, desc: { de: 'BCMS-Verantwortung', en: 'BCMS responsibility', fr: 'Responsabilité SMCA' } },
            { id: 'manager', icon: '🧭', label: { de: 'BCM-Manager / Koordinator', en: 'BCM manager / coordinator', fr: 'Responsable / coordinateur PCA' } },
            { id: 'unit', icon: '🧩', label: { de: 'Fachbereich / Prozessverantwortung', en: 'Business unit / process owner', fr: 'Métier / propriétaire de processus' } },
            { id: 'consultant', icon: '🤝', label: { de: 'Berater / Auditor', en: 'Consultant / auditor', fr: 'Consultant / auditeur' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Audit-Kontext', en: 'Audit context', fr: "Contexte d'audit" },
          options: [
            { id: 'first', label: { de: 'Erst-Zertifizierung', en: 'First certification', fr: 'Première certification' } },
            { id: 'recert', label: { de: 'Re-Zertifizierung', en: 'Re-certification', fr: 'Recertification' } },
            { id: 'internal', label: { de: 'Internes Audit / Vorbereitung', en: 'Internal audit / preparation', fr: 'Audit interne / préparation' } },
            { id: 'gap', label: { de: 'Gap-Analyse', en: 'Gap analysis', fr: 'Analyse des écarts' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Geltungsbereich, Prozesse & Risikolandschaft', en: 'Scope, processes & risk landscape', fr: 'Périmètre, processus & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung des BCMS-Geltungsbereichs, kritischer Prozesse & Abhängigkeiten', en: 'Description of BCMS scope, critical processes & dependencies', fr: 'Description du périmètre SMCA, processus critiques & dépendances' },
          placeholder: { de: 'Kritische Geschäftsprozesse, Standorte, IT-Abhängigkeiten, Lieferanten, RTO/RPO …', en: 'Critical business processes, sites, IT dependencies, suppliers, RTO/RPO …', fr: 'Processus critiques, sites, dépendances IT, fournisseurs, RTO/RPO …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kritische Bereiche / Abhängigkeiten', en: 'Critical areas / dependencies', fr: 'Domaines critiques / dépendances' },
          options: [
            { id: 'processes', icon: '⚙️', label: { de: 'Kritische Geschäftsprozesse', en: 'Critical business processes', fr: 'Processus métier critiques' } },
            { id: 'it', icon: '💻', label: { de: 'IT-Systeme & Anwendungen', en: 'IT systems & applications', fr: 'Systèmes IT & applications' } },
            { id: 'sites', icon: '🏭', label: { de: 'Standorte & Infrastruktur', en: 'Sites & facilities', fr: 'Sites & infrastructures' } },
            { id: 'people', icon: '👥', label: { de: 'Personal & Schlüsselrollen', en: 'People & key roles', fr: 'Personnel & rôles clés' } },
            { id: 'suppliers', icon: '🔗', label: { de: 'Lieferanten & Dienstleister', en: 'Suppliers & service providers', fr: 'Fournisseurs & prestataires' } },
            { id: 'data', icon: '🗄️', label: { de: 'Daten & Aufzeichnungen', en: 'Data & records', fr: 'Données & enregistrements' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Governance & Schwachstellen', en: 'Governance & gaps', fr: 'Gouvernance & lacunes' },
      fields: [
        {
          id: 'roles',
          type: 'multi',
          required: true,
          label: { de: 'Etablierte Rollen & Strukturen', en: 'Established roles & structures', fr: 'Rôles & structures établis' },
          options: [
            { id: 'mgmt', icon: '👔', label: { de: 'Top-Management committed', en: 'Top management committed', fr: 'Direction engagée' } },
            { id: 'bcmlead', icon: '🧭', label: { de: 'Benannte BCM-Verantwortung', en: 'Designated BCM responsibility', fr: 'Responsabilité PCA désignée' } },
            { id: 'bcms', icon: '📘', label: { de: 'BCMS dokumentiert & etabliert', en: 'BCMS documented & established', fr: 'SMCA documenté & établi' } },
            { id: 'team', icon: '🚨', label: { de: 'Krisen-/Notfallteam benannt', en: 'Crisis / response team appointed', fr: 'Équipe de crise / réponse désignée' } },
            { id: 'supplier', icon: '🔗', label: { de: 'Lieferanten-Continuity geregelt', en: 'Supplier continuity managed', fr: 'Continuité fournisseurs gérée' } },
            { id: 'audit', icon: '📋', label: { de: 'Internes Audit-/Review-Programm', en: 'Internal audit / review programme', fr: "Programme d'audit / revue interne" } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine BIA, keine RTO/RPO, ungetestete Pläne, keine Übungen, keine Lieferantenkontinuität …', en: 'e.g. no BIA, no RTO/RPO, untested plans, no exercises, no supplier continuity …', fr: 'p. ex. pas de BIA, pas de RTO/RPO, plans non testés, pas d\'exercices …' },
        },
      ],
    },
    {
      title: { de: 'Umgesetzte Maßnahmen', en: 'Implemented measures', fr: 'Mesures en place' },
      info: {
        de: 'Nur ankreuzen, was nachweislich existiert. Die KI erfindet keine Nachweise.',
        en: 'Only tick what verifiably exists. The AI invents no evidence.',
        fr: "Ne cochez que ce qui existe réellement. L'IA n'invente aucune preuve.",
      },
      fields: [
        {
          id: 'measures',
          type: 'maturity-multi',
          label: { de: 'BCMS-Maßnahmen (ISO 22301)', en: 'BCMS measures (ISO 22301)', fr: 'Mesures SMCA (ISO 22301)' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'context', label: { de: 'Kontext & Geltungsbereich des BCMS', en: 'Context & scope of the BCMS', fr: 'Contexte & périmètre du SMCA' } },
            { id: 'leadership', label: { de: 'Führung, Politik & Verantwortlichkeiten', en: 'Leadership, policy & responsibilities', fr: 'Leadership, politique & responsabilités' } },
            { id: 'objectives', label: { de: 'BCM-Ziele & Planung', en: 'BCM objectives & planning', fr: 'Objectifs PCA & planification' } },
            { id: 'resources', label: { de: 'Ressourcen & Kompetenz', en: 'Resources & competence', fr: 'Ressources & compétence' } },
            { id: 'awareness', label: { de: 'Bewusstsein & Kommunikation', en: 'Awareness & communication', fr: 'Sensibilisation & communication' } },
            { id: 'bia', label: { de: 'Business Impact Analyse (BIA)', en: 'Business impact analysis (BIA)', fr: 'Analyse d\'impact (BIA)' } },
            { id: 'riskassess', label: { de: 'Risikobeurteilung', en: 'Risk assessment', fr: 'Appréciation des risques' } },
            { id: 'strategy', label: { de: 'Kontinuitätsstrategien & -lösungen', en: 'Continuity strategies & solutions', fr: 'Stratégies & solutions de continuité' } },
            { id: 'plans', label: { de: 'Business-Continuity-Pläne & -Verfahren', en: 'Business continuity plans & procedures', fr: 'Plans & procédures de continuité' } },
            { id: 'response', label: { de: 'Notfall-/Krisenreaktionsstruktur', en: 'Incident / crisis response structure', fr: 'Structure de réponse incident / crise' } },
            { id: 'rto', label: { de: 'RTO/RPO & Wiederanlaufprioritäten', en: 'RTO/RPO & recovery priorities', fr: 'RTO/RPO & priorités de reprise' } },
            { id: 'exercise', label: { de: 'Übungen & Tests', en: 'Exercising & testing', fr: 'Exercices & tests' } },
            { id: 'supplier', label: { de: 'Lieferanten- & Dienstleisterkontinuität', en: 'Supplier & service provider continuity', fr: 'Continuité fournisseurs & prestataires' } },
            { id: 'evaluation', label: { de: 'Leistungsbewertung & internes Audit', en: 'Performance evaluation & internal audit', fr: 'Évaluation des performances & audit interne' } },
            { id: 'improvement', label: { de: 'Korrekturmaßnahmen & kontinuierliche Verbesserung', en: 'Corrective action & continual improvement', fr: 'Actions correctives & amélioration continue' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Kontext & Führung', en: 'Context & leadership', fr: 'Contexte & leadership' }, weight: 2 },
    { id: 'plan', name: { de: 'Planung & Unterstützung', en: 'Planning & support', fr: 'Planification & support' } },
    { id: 'analysis', name: { de: 'Analyse (BIA & Risiko)', en: 'Analysis (BIA & risk)', fr: 'Analyse (BIA & risque)' }, weight: 2 },
    { id: 'continuity', name: { de: 'Kontinuität & Wiederanlauf', en: 'Continuity & recovery', fr: 'Continuité & reprise' }, weight: 2 },
    { id: 'response', name: { de: 'Reaktion & Übung', en: 'Response & exercising', fr: 'Réponse & exercices' }, weight: 2 },
    { id: 'improve', name: { de: 'Bewertung & Verbesserung', en: 'Evaluation & improvement', fr: 'Évaluation & amélioration' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'BC-G1', article: 'ISO 22301 §4–5', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:leadership'], requiresAny: ['roles:bcmlead', 'roles:bcms'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Top-Management', en: 'Top management', fr: 'Direction' }, name: { de: 'Führung, Politik & BCMS-Geltungsbereich', en: 'Leadership, policy & BCMS scope', fr: 'Leadership, politique & périmètre SMCA' }, criteria: [
      { de: 'Dokumentiertes BCMS mit Politik, Geltungsbereich, benannten Rollen und Management-Commitment', en: 'Documented BCMS with policy, scope, named roles and management commitment', fr: 'SMCA documenté avec politique, périmètre, rôles désignés et engagement de la direction' },
    ] },
    { id: 'BC-G2', article: 'ISO 22301 §6–7', categoryId: 'plan', mandatory: true, rule: { requiresAll: ['measures:objectives'], requiresAny: ['measures:resources', 'measures:awareness'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'BCM-Manager', en: 'BCM manager', fr: 'Responsable PCA' }, name: { de: 'BCM-Ziele, Ressourcen & Kompetenz', en: 'BCM objectives, resources & competence', fr: 'Objectifs PCA, ressources & compétence' } },
    { id: 'BC-AN1', article: 'ISO 22301 §8.2.2', categoryId: 'analysis', weight: 2, mandatory: true, rule: { requiresAll: ['measures:bia'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'BCM / Fachbereiche', en: 'BCM / business units', fr: 'PCA / métiers' }, name: { de: 'Business Impact Analyse (BIA)', en: 'Business impact analysis (BIA)', fr: 'Analyse d\'impact (BIA)' } },
    { id: 'BC-AN2', article: 'ISO 22301 §8.2.3', categoryId: 'analysis', weight: 2, mandatory: true, rule: { requiresAll: ['measures:riskassess'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'BCM / Risk', en: 'BCM / risk', fr: 'PCA / risque' }, name: { de: 'Risikobeurteilung der Disruption', en: 'Disruption risk assessment', fr: 'Appréciation des risques de disruption' } },
    { id: 'BC-CO1', article: 'ISO 22301 §8.3', categoryId: 'continuity', weight: 2, mandatory: true, rule: { requiresAll: ['measures:strategy'], requiresAny: ['measures:rto'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'BCM-Manager', en: 'BCM manager', fr: 'Responsable PCA' }, name: { de: 'Kontinuitätsstrategien & RTO/RPO', en: 'Continuity strategies & RTO/RPO', fr: 'Stratégies de continuité & RTO/RPO' } },
    { id: 'BC-CO2', article: 'ISO 22301 §8.4', categoryId: 'continuity', weight: 2, mandatory: true, rule: { requiresAll: ['measures:plans'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'BCM / Fachbereiche', en: 'BCM / business units', fr: 'PCA / métiers' }, name: { de: 'Business-Continuity-Pläne & -Verfahren', en: 'Business continuity plans & procedures', fr: 'Plans & procédures de continuité' } },
    { id: 'BC-CO3', article: 'ISO 22301 §8.4.2', categoryId: 'continuity', mandatory: true, rule: { requiresAll: ['measures:supplier'], requiresAny: ['roles:supplier'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Einkauf / BCM', en: 'Procurement / BCM', fr: 'Achats / PCA' }, name: { de: 'Lieferanten- & Dienstleisterkontinuität', en: 'Supplier & service provider continuity', fr: 'Continuité fournisseurs & prestataires' } },
    { id: 'BC-RS1', article: 'ISO 22301 §8.4.2', categoryId: 'response', weight: 2, mandatory: true, rule: { requiresAll: ['measures:response'], requiresAny: ['roles:team'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Krisen-/Notfallteam', en: 'Crisis / response team', fr: 'Équipe de crise / réponse' }, name: { de: 'Notfall- & Krisenreaktionsstruktur', en: 'Incident & crisis response structure', fr: 'Structure de réponse incident & crise' } },
    { id: 'BC-RS2', article: 'ISO 22301 §8.5', categoryId: 'response', weight: 2, mandatory: true, rule: { requiresAll: ['measures:exercise'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'BCM-Manager', en: 'BCM manager', fr: 'Responsable PCA' }, name: { de: 'Übungs- & Testprogramm', en: 'Exercising & testing programme', fr: "Programme d'exercices & tests" } },
    { id: 'BC-IM1', article: 'ISO 22301 §9', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:evaluation'], requiresAny: ['roles:audit'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'BCM / Interne Revision', en: 'BCM / internal audit', fr: 'PCA / audit interne' }, name: { de: 'Leistungsbewertung & internes Audit', en: 'Performance evaluation & internal audit', fr: 'Évaluation des performances & audit interne' } },
    { id: 'BC-IM2', article: 'ISO 22301 §10', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:improvement'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'BCM-Manager', en: 'BCM manager', fr: 'Responsable PCA' }, name: { de: 'Korrekturmaßnahmen & kontinuierliche Verbesserung', en: 'Corrective action & continual improvement', fr: 'Actions correctives & amélioration continue' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Services GmbH',
    role: 'manager',
    phase: 'first',
    description:
      'Shared-services organisation seeking first ISO 22301 certification. BCMS scope covers IT services, payroll and customer support across two sites. BIA and risk assessment completed, continuity strategies defined with RTO/RPO, and plans documented. Preparing for the certification audit.',
    systems: ['processes', 'it', 'sites', 'people', 'suppliers'],
    roles: ['mgmt', 'bcmlead', 'bcms', 'team', 'supplier'],
    knownIssues:
      'BIA complete for primary processes but not all support functions. Plans documented but only partially exercised. Supplier continuity assessed for key vendors only. Management review scheduled but not yet held.',
    measures: ['context', 'leadership', 'objectives', 'resources', 'awareness', 'bia', 'riskassess', 'strategy', 'plans', 'response', 'rto', 'exercise', 'supplier', 'evaluation'],
    measures__mat__context: 'documented',
    measures__mat__leadership: 'documented',
    measures__mat__objectives: 'documented',
    measures__mat__resources: 'existing',
    measures__mat__awareness: 'existing',
    measures__mat__bia: 'documented',
    measures__mat__riskassess: 'documented',
    measures__mat__strategy: 'documented',
    measures__mat__plans: 'documented',
    measures__mat__response: 'documented',
    measures__mat__rto: 'documented',
    measures__mat__exercise: 'existing',
    measures__mat__supplier: 'existing',
    measures__mat__evaluation: 'existing',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Re-Zertifizierung — auditreif', en: 'Re-certification — audit-ready', fr: 'Recertification — prêt pour l\'audit' },
      description: {
        de: 'Reifes BCMS mit getesteten Plänen und vollständigem Verbesserungszyklus.',
        en: 'Mature BCMS with tested plans and a complete improvement cycle.',
        fr: 'SMCA mature avec plans testés et cycle d\'amélioration complet.',
      },
      answers: {
        entityName: 'Northern Star Group',
        role: 'owner',
        phase: 'recert',
        description:
          'Established BCMS covering all critical processes. BIA and risk assessment maintained annually, continuity strategies with validated RTO/RPO, fully exercised plans, supplier continuity programme and a closed-loop management review.',
        systems: ['processes', 'it', 'sites', 'people', 'suppliers', 'data'],
        roles: ['mgmt', 'bcmlead', 'bcms', 'team', 'supplier', 'audit'],
        knownIssues:
          'Minor observations from the last exercise on communication timelines. Documentation versioning being tidied.',
        measures: ['context', 'leadership', 'objectives', 'resources', 'awareness', 'bia', 'riskassess', 'strategy', 'plans', 'response', 'rto', 'exercise', 'supplier', 'evaluation', 'improvement'],
        measures__mat__context: 'audited',
        measures__mat__leadership: 'audited',
        measures__mat__objectives: 'documented',
        measures__mat__resources: 'documented',
        measures__mat__awareness: 'documented',
        measures__mat__bia: 'audited',
        measures__mat__riskassess: 'documented',
        measures__mat__strategy: 'documented',
        measures__mat__plans: 'audited',
        measures__mat__response: 'documented',
        measures__mat__rto: 'documented',
        measures__mat__exercise: 'audited',
        measures__mat__supplier: 'documented',
        measures__mat__evaluation: 'documented',
        measures__mat__improvement: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En développement' },
      description: {
        de: 'Teil-Konformität mit BIA und Plänen, aber ungetestet und ohne vollständigen Zyklus.',
        en: 'Partial conformity with BIA and plans, but untested and without a full cycle.',
        fr: 'Conformité partielle avec BIA et plans, mais non testés et sans cycle complet.',
      },
      answers: {
        entityName: 'Coastal Trading GmbH',
        role: 'manager',
        phase: 'internal',
        description:
          'Mid-size firm building its BCMS. Policy and BIA in place, draft continuity plans, but no exercises and no supplier continuity yet.',
        systems: ['processes', 'it', 'people'],
        roles: ['mgmt', 'bcmlead'],
        knownIssues:
          'Plans not exercised. RTO/RPO not validated. No supplier continuity. No internal audit performed.',
        measures: ['context', 'leadership', 'objectives', 'bia', 'strategy', 'plans'],
        measures__mat__context: 'documented',
        measures__mat__leadership: 'existing',
        measures__mat__objectives: 'existing',
        measures__mat__bia: 'documented',
        measures__mat__strategy: 'existing',
        measures__mat__plans: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum formalisiertes BCMS, viele Lücken gegenüber ISO 22301.',
        en: 'Barely formalised BCMS with many gaps against ISO 22301.',
        fr: 'SMCA peu formalisé, nombreuses lacunes face à ISO 22301.',
      },
      answers: {
        entityName: 'Harbour Office Co',
        role: 'unit',
        phase: 'gap',
        description:
          'Small organisation at the start of business continuity. No formal BCMS, no BIA, recovery relies on ad-hoc IT backups.',
        systems: ['processes', 'it'],
        roles: ['mgmt'],
        knownIssues:
          'No BIA, no risk assessment, no continuity strategy or plans, no exercising, no review cycle.',
        measures: ['leadership'],
        measures__mat__leadership: 'existing',
      },
    },
  ],
};
