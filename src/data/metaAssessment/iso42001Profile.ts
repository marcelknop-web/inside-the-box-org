import type { StandardProfile } from './types';

// ── ISO 42001 profile ───────────────────────────────────────────
// ISO/IEC 42001:2023 — Artificial Intelligence Management System (AIMS).
// Covers the management-system clauses (4–10) plus Annex A controls for
// responsible AI: AI policy, roles, impact assessment, data governance,
// lifecycle management, transparency and third-party oversight.
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const ISO42001_PROFILE: StandardProfile = {
  id: 'iso42001',
  name: 'ISO 42001',
  icon: 'BrainCircuit',
  available: true,
  fullName: {
    de: 'ISO/IEC 42001:2023 — AI-Managementsystem (AIMS)',
    en: 'ISO/IEC 42001:2023 — AI Management System (AIMS)',
    fr: "ISO/IEC 42001:2023 — Système de management de l'IA (AIMS)",
  },
  regulation: {
    de: 'ISO/IEC 42001:2023',
    en: 'ISO/IEC 42001:2023',
    fr: 'ISO/IEC 42001:2023',
  },
  description: {
    de: 'Audit-Workflow für ein KI-Managementsystem (AIMS) nach ISO/IEC 42001 mit verantwortungsvoller KI.',
    en: 'Conformity audit workflow for an AI Management System (AIMS) under ISO/IEC 42001 with responsible AI.',
    fr: "Flux d'audit de conformité pour un système de management de l'IA (AIMS) selon ISO/IEC 42001 avec IA responsable.",
  },
  intake: [
    {
      title: { de: 'Organisation & Bewertungsobjekt', en: 'Organisation & assessment object', fr: "Organisation & objet d'évaluation" },
      subtitle: {
        de: 'Welcher Geltungsbereich des AIMS wird bewertet?',
        en: 'Which AIMS scope is being assessed?',
        fr: 'Quel périmètre de l\'AIMS est évalué ?',
      },
      info: {
        de: 'ISO 42001 strukturiert das AIMS nach den HLS-Klauseln 4–10 mit Annex-A-Maßnahmen für verantwortungsvolle KI.',
        en: 'ISO 42001 structures the AIMS along HLS clauses 4–10 with Annex A controls for responsible AI.',
        fr: "ISO 42001 structure l'AIMS selon les clauses HLS 4–10 avec les mesures de l'Annexe A pour une IA responsable.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Geltungsbereich', en: 'Organisation / scope', fr: 'Organisation / périmètre' },
          placeholder: { de: 'z. B. Muster AI GmbH', en: 'e.g. Acme AI Ltd', fr: 'p. ex. Exemple AI' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle im KI-Ökosystem', en: 'Role in the AI ecosystem', fr: "Rôle dans l'écosystème IA" },
          options: [
            { id: 'developer', icon: '🧠', label: { de: 'KI-Entwickler / Anbieter', en: 'AI developer / provider', fr: 'Développeur / fournisseur IA' }, desc: { de: 'Entwicklung & Bereitstellung', en: 'Development & provision', fr: 'Développement & fourniture' } },
            { id: 'deployer', icon: '⚙️', label: { de: 'KI-Betreiber / Anwender', en: 'AI deployer / user', fr: 'Exploitant / utilisateur IA' } },
            { id: 'integrator', icon: '🔧', label: { de: 'Integrator / Reseller', en: 'Integrator / reseller', fr: 'Intégrateur / revendeur' } },
            { id: 'both', icon: '🔁', label: { de: 'Entwickler & Betreiber', en: 'Developer & deployer', fr: 'Développeur & exploitant' } },
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
      title: { de: 'Geltungsbereich, KI-Systeme & Risikolandschaft', en: 'Scope, AI systems & risk landscape', fr: 'Périmètre, systèmes IA & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der KI-Systeme, Anwendungsfälle & Datenflüsse', en: 'Description of AI systems, use cases & data flows', fr: 'Description des systèmes IA, cas d\'usage & flux de données' },
          placeholder: { de: 'Modelle, Anwendungsfälle, Trainingsdaten, betroffene Personen, Drittanbieter / Foundation Models …', en: 'Models, use cases, training data, affected persons, third-party / foundation models …', fr: 'Modèles, cas d\'usage, données d\'entraînement, personnes concernées, modèles tiers / de fondation …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kategorien von KI-Systemen / Assets', en: 'Categories of AI systems / assets', fr: "Catégories de systèmes IA / actifs" },
          options: [
            { id: 'ml', icon: '🧠', label: { de: 'ML-/Prädiktionsmodelle', en: 'ML / predictive models', fr: 'Modèles ML / prédictifs' } },
            { id: 'genai', icon: '✨', label: { de: 'Generative KI / LLM', en: 'Generative AI / LLM', fr: 'IA générative / LLM' } },
            { id: 'foundation', icon: '🏗️', label: { de: 'Foundation Models / Drittanbieter', en: 'Foundation models / third-party', fr: 'Modèles de fondation / tiers' } },
            { id: 'data', icon: '🗄️', label: { de: 'Trainings- & Eingabedaten', en: 'Training & input data', fr: 'Données d\'entraînement & d\'entrée' } },
            { id: 'pii', icon: '👤', label: { de: 'Personenbezogene Daten', en: 'Personal data', fr: 'Données personnelles' } },
            { id: 'critical', icon: '⚠️', label: { de: 'Sicherheits-/grundrechtsrelevante Nutzung', en: 'Safety / rights-relevant use', fr: 'Usage sensible (sécurité / droits)' } },
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
            { id: 'ailead', icon: '🧭', label: { de: 'Benannte KI-Verantwortung / Governance-Board', en: 'Designated AI responsibility / governance board', fr: 'Responsabilité IA désignée / comité de gouvernance' } },
            { id: 'aims', icon: '📘', label: { de: 'AIMS dokumentiert & etabliert', en: 'AIMS documented & established', fr: 'AIMS documenté & établi' } },
            { id: 'ethics', icon: '⚖️', label: { de: 'Ethik-/Verantwortungs-Grundsätze', en: 'Ethics / responsibility principles', fr: 'Principes d\'éthique / responsabilité' } },
            { id: 'supplier', icon: '🔗', label: { de: 'Drittanbieter-/Modell-Steuerung', en: 'Third-party / model management', fr: 'Gestion tiers / modèles' } },
            { id: 'training', icon: '📚', label: { de: 'Awareness & Schulung', en: 'Awareness & training', fr: 'Sensibilisation & formation' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine KI-Impact-Bewertung, keine Datengovernance, kein Lifecycle-Prozess, keine Transparenz …', en: 'e.g. no AI impact assessment, no data governance, no lifecycle process, no transparency …', fr: 'p. ex. pas d\'évaluation d\'impact IA, pas de gouvernance des données, pas de cycle de vie …' },
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
          label: { de: 'AIMS-Maßnahmen (ISO 42001, Annex A)', en: 'AIMS measures (ISO 42001, Annex A)', fr: 'Mesures AIMS (ISO 42001, Annexe A)' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'policy', label: { de: 'KI-Politik & Management-Commitment', en: 'AI policy & management commitment', fr: 'Politique IA & engagement direction' } },
            { id: 'aims', label: { de: 'AIMS-Organisation & Verantwortlichkeiten', en: 'AIMS organisation & responsibilities', fr: 'Organisation AIMS & responsabilités' } },
            { id: 'objectives', label: { de: 'KI-Ziele & Planung', en: 'AI objectives & planning', fr: 'Objectifs IA & planification' } },
            { id: 'inventory', label: { de: 'Inventar der KI-Systeme', en: 'Inventory of AI systems', fr: 'Inventaire des systèmes IA' } },
            { id: 'risk', label: { de: 'KI-Risikobeurteilung', en: 'AI risk assessment', fr: 'Appréciation des risques IA' } },
            { id: 'impact', label: { de: 'KI-Impact-Assessment (Personen & Gesellschaft)', en: 'AI impact assessment (individuals & society)', fr: 'Évaluation d\'impact IA (personnes & société)' } },
            { id: 'datagov', label: { de: 'Datengovernance & -qualität', en: 'Data governance & quality', fr: 'Gouvernance & qualité des données' } },
            { id: 'lifecycle', label: { de: 'Lebenszyklus-Management (Dev, Test, Deploy)', en: 'Lifecycle management (dev, test, deploy)', fr: 'Gestion du cycle de vie (dev, test, déploiement)' } },
            { id: 'fairness', label: { de: 'Fairness, Bias- & Robustheitstests', en: 'Fairness, bias & robustness testing', fr: 'Tests d\'équité, de biais & de robustesse' } },
            { id: 'transparency', label: { de: 'Transparenz & Erklärbarkeit', en: 'Transparency & explainability', fr: 'Transparence & explicabilité' } },
            { id: 'oversight', label: { de: 'Menschliche Aufsicht & Eingriff', en: 'Human oversight & intervention', fr: 'Supervision & intervention humaines' } },
            { id: 'security', label: { de: 'KI-Sicherheit (Modell & Daten)', en: 'AI security (model & data)', fr: 'Sécurité IA (modèle & données)' } },
            { id: 'monitoring', label: { de: 'Monitoring & Performance im Betrieb', en: 'Monitoring & in-operation performance', fr: 'Surveillance & performance en exploitation' } },
            { id: 'incident', label: { de: 'Incident- & Beschwerdemanagement', en: 'Incident & complaint management', fr: 'Gestion des incidents & réclamations' } },
            { id: 'supplier', label: { de: 'Drittanbieter- & Modell-Steuerung', en: 'Third-party & model management', fr: 'Gestion tiers & modèles' } },
            { id: 'improvement', label: { de: 'Internes Audit & kontinuierliche Verbesserung', en: 'Internal audit & continual improvement', fr: 'Audit interne & amélioration continue' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Governance & KI-Politik', en: 'Governance & AI policy', fr: 'Gouvernance & politique IA' }, weight: 2 },
    { id: 'identify', name: { de: 'Identifizieren & Bewerten', en: 'Identify & assess', fr: 'Identifier & évaluer' }, weight: 2 },
    { id: 'responsible', name: { de: 'Verantwortungsvolle KI', en: 'Responsible AI', fr: 'IA responsable' }, weight: 2 },
    { id: 'operate', name: { de: 'Betrieb & Überwachung', en: 'Operation & monitoring', fr: 'Exploitation & surveillance' }, weight: 2 },
    { id: 'respond', name: { de: 'Reagieren', en: 'Respond', fr: 'Répondre' } },
    { id: 'improve', name: { de: 'Steuerung & Verbesserung', en: 'Oversight & improvement', fr: 'Pilotage & amélioration' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'AI-G1', article: 'ISO 42001 §4–5', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:policy'], requiresAny: ['roles:ailead', 'roles:aims'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Top-Management', en: 'Top management', fr: 'Direction' }, name: { de: 'KI-Politik, Governance & Verantwortlichkeiten', en: 'AI policy, governance & responsibilities', fr: 'Politique IA, gouvernance & responsabilités' }, criteria: [
      { de: 'Dokumentiertes AIMS mit KI-Politik, benannten Rollen und Management-Commitment', en: 'Documented AIMS with AI policy, named roles and management commitment', fr: 'AIMS documenté avec politique IA, rôles désignés et engagement de la direction' },
    ] },
    { id: 'AI-G2', article: 'ISO 42001 §6', categoryId: 'govern', mandatory: true, rule: { requiresAll: ['measures:objectives'], requiresAny: ['measures:aims'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'KI-Governance-Board', en: 'AI governance board', fr: 'Comité de gouvernance IA' }, name: { de: 'KI-Ziele & Planung', en: 'AI objectives & planning', fr: 'Objectifs IA & planification' } },
    { id: 'AI-ID1', article: 'ISO 42001 Annex A', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:inventory'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'KI-Verantwortung', en: 'AI owner', fr: 'Responsable IA' }, name: { de: 'Inventar & Klassifizierung der KI-Systeme', en: 'Inventory & classification of AI systems', fr: 'Inventaire & classification des systèmes IA' } },
    { id: 'AI-ID2', article: 'ISO 42001 §6.1 / A', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:risk'], requiresAny: ['measures:impact'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'KI-Risk / Governance', en: 'AI risk / governance', fr: 'Risque IA / gouvernance' }, name: { de: 'KI-Risiko- & Impact-Assessment', en: 'AI risk & impact assessment', fr: "Appréciation des risques & d'impact IA" } },
    { id: 'AI-RE1', article: 'ISO 42001 Annex A Data', categoryId: 'responsible', weight: 2, mandatory: true, rule: { requiresAll: ['measures:datagov'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Data / KI-Team', en: 'Data / AI team', fr: 'Data / équipe IA' }, name: { de: 'Datengovernance & -qualität', en: 'Data governance & quality', fr: 'Gouvernance & qualité des données' } },
    { id: 'AI-RE2', article: 'ISO 42001 Annex A Lifecycle', categoryId: 'responsible', weight: 2, mandatory: true, rule: { requiresAll: ['measures:lifecycle'], requiresAny: ['measures:fairness'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'KI-Entwicklung', en: 'AI development', fr: 'Développement IA' }, name: { de: 'Lebenszyklus-Management, Fairness- & Robustheitstests', en: 'Lifecycle management, fairness & robustness testing', fr: 'Gestion du cycle de vie, tests d\'équité & robustesse' } },
    { id: 'AI-RE3', article: 'ISO 42001 Annex A Transparency', categoryId: 'responsible', mandatory: true, rule: { requiresAll: ['measures:transparency'], requiresAny: ['measures:oversight'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'KI-Team / Produkt', en: 'AI team / product', fr: 'Équipe IA / produit' }, name: { de: 'Transparenz, Erklärbarkeit & menschliche Aufsicht', en: 'Transparency, explainability & human oversight', fr: 'Transparence, explicabilité & supervision humaine' } },
    { id: 'AI-OP1', article: 'ISO 42001 Annex A Security', categoryId: 'operate', weight: 2, mandatory: true, rule: { requiresAll: ['measures:security'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'KI / IT-Security', en: 'AI / IT security', fr: 'IA / sécurité IT' }, name: { de: 'KI-Sicherheit (Modell & Daten)', en: 'AI security (model & data)', fr: 'Sécurité IA (modèle & données)' } },
    { id: 'AI-OP2', article: 'ISO 42001 Annex A Operation', categoryId: 'operate', mandatory: true, rule: { requiresAll: ['measures:monitoring'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'KI-Betrieb', en: 'AI operations', fr: 'Exploitation IA' }, name: { de: 'Monitoring & Performance im Betrieb', en: 'Monitoring & in-operation performance', fr: 'Surveillance & performance en exploitation' } },
    { id: 'AI-RS1', article: 'ISO 42001 Annex A Incident', categoryId: 'respond', mandatory: true, rule: { requiresAll: ['measures:incident'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'KI-Governance', en: 'AI governance', fr: 'Gouvernance IA' }, name: { de: 'Incident- & Beschwerdemanagement', en: 'Incident & complaint management', fr: 'Gestion des incidents & réclamations' } },
    { id: 'AI-RS2', article: 'ISO 42001 Annex A Suppliers', categoryId: 'respond', mandatory: true, rule: { requiresAll: ['measures:supplier'], requiresAny: ['roles:supplier'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'KI / Einkauf', en: 'AI / procurement', fr: 'IA / achats' }, name: { de: 'Drittanbieter- & Modell-Steuerung', en: 'Third-party & model management', fr: 'Gestion tiers & modèles' } },
    { id: 'AI-IM1', article: 'ISO 42001 §9–10', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:improvement'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'KI-Governance / Audit', en: 'AI governance / audit', fr: 'Gouvernance IA / audit' }, name: { de: 'Internes Audit & kontinuierliche Verbesserung', en: 'Internal audit & continual improvement', fr: 'Audit interne & amélioration continue' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme AI GmbH',
    role: 'both',
    phase: 'first',
    description:
      'SaaS provider developing and operating generative-AI features built on third-party foundation models. AIMS scope covers model selection, fine-tuning, deployment and monitoring. AI policy, impact assessments and data governance established. Preparing for first ISO 42001 certification.',
    systems: ['genai', 'foundation', 'data', 'pii'],
    roles: ['mgmt', 'ailead', 'aims', 'ethics', 'supplier'],
    knownIssues:
      'Impact assessments completed for main use cases but not all features. Bias testing partially automated. Human-oversight procedures documented but not consistently logged. Vendor model governance for one provider incomplete.',
    measures: ['policy', 'aims', 'objectives', 'inventory', 'risk', 'impact', 'datagov', 'lifecycle', 'fairness', 'transparency', 'oversight', 'security', 'monitoring', 'incident', 'supplier'],
    measures__mat__policy: 'documented',
    measures__mat__aims: 'documented',
    measures__mat__objectives: 'documented',
    measures__mat__inventory: 'documented',
    measures__mat__risk: 'documented',
    measures__mat__impact: 'existing',
    measures__mat__datagov: 'documented',
    measures__mat__lifecycle: 'documented',
    measures__mat__fairness: 'existing',
    measures__mat__transparency: 'documented',
    measures__mat__oversight: 'existing',
    measures__mat__security: 'documented',
    measures__mat__monitoring: 'existing',
    measures__mat__incident: 'existing',
    measures__mat__supplier: 'existing',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Re-Zertifizierung — auditreif', en: 'Re-certification — audit-ready', fr: 'Recertification — prêt pour l\'audit' },
      description: {
        de: 'Reifes AIMS mit getesteter verantwortungsvoller KI und vollständigem Verbesserungszyklus.',
        en: 'Mature AIMS with tested responsible-AI controls and a complete improvement cycle.',
        fr: 'AIMS mature avec mesures d\'IA responsable testées et cycle d\'amélioration complet.',
      },
      answers: {
        entityName: 'Northern Star AI',
        role: 'both',
        phase: 'recert',
        description:
          'Established AIMS across the full AI lifecycle. Maintained AI inventory and impact assessments, automated bias and robustness testing, logged human oversight, monitored production models and a closed-loop management review.',
        systems: ['ml', 'genai', 'foundation', 'data', 'pii', 'critical'],
        roles: ['mgmt', 'ailead', 'aims', 'ethics', 'supplier', 'training'],
        knownIssues:
          'Minor observations on documentation versioning. Drift-monitoring thresholds being tuned.',
        measures: ['policy', 'aims', 'objectives', 'inventory', 'risk', 'impact', 'datagov', 'lifecycle', 'fairness', 'transparency', 'oversight', 'security', 'monitoring', 'incident', 'supplier', 'improvement'],
        measures__mat__policy: 'audited',
        measures__mat__aims: 'audited',
        measures__mat__objectives: 'documented',
        measures__mat__inventory: 'documented',
        measures__mat__risk: 'documented',
        measures__mat__impact: 'audited',
        measures__mat__datagov: 'documented',
        measures__mat__lifecycle: 'documented',
        measures__mat__fairness: 'documented',
        measures__mat__transparency: 'documented',
        measures__mat__oversight: 'documented',
        measures__mat__security: 'documented',
        measures__mat__monitoring: 'documented',
        measures__mat__incident: 'documented',
        measures__mat__supplier: 'documented',
        measures__mat__improvement: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En développement' },
      description: {
        de: 'Teil-Konformität mit Politik und Inventar, aber offenen Responsible-AI-Maßnahmen.',
        en: 'Partial conformity with policy and inventory but open responsible-AI measures.',
        fr: 'Conformité partielle avec politique et inventaire mais mesures d\'IA responsable ouvertes.',
      },
      answers: {
        entityName: 'Coastal Analytics GmbH',
        role: 'deployer',
        phase: 'internal',
        description:
          'Company deploying third-party ML models for analytics. AI policy and inventory in place; risk assessment under way; no formal bias testing or human-oversight logging yet.',
        systems: ['ml', 'foundation', 'data'],
        roles: ['mgmt', 'ailead'],
        knownIssues:
          'No impact assessment. No bias/robustness testing. Human oversight informal. Vendor model governance not defined.',
        measures: ['policy', 'aims', 'inventory', 'risk', 'datagov'],
        measures__mat__policy: 'documented',
        measures__mat__aims: 'existing',
        measures__mat__inventory: 'existing',
        measures__mat__risk: 'existing',
        measures__mat__datagov: 'documented',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum formalisiertes AIMS, viele Lücken gegenüber ISO 42001.',
        en: 'Barely formalised AIMS with many gaps against ISO 42001.',
        fr: 'AIMS peu formalisé, nombreuses lacunes face à ISO 42001.',
      },
      answers: {
        entityName: 'Harbour Bots Co',
        role: 'deployer',
        phase: 'gap',
        description:
          'Small company adopting generative AI without formal governance. No AI policy, no inventory, no impact or risk assessment; reliance on vendor defaults.',
        systems: ['genai', 'foundation'],
        roles: ['mgmt'],
        knownIssues:
          'No AIMS, no AI inventory, no impact or risk assessment, no oversight, no monitoring, no improvement cycle.',
        measures: ['datagov'],
        measures__mat__datagov: 'existing',
      },
    },
  ],
};
