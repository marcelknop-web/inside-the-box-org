import type { StandardProfile } from './types';

// ── ISO 9001 profile ────────────────────────────────────────────
// ISO 9001:2015 — Quality Management Systems (QMS).
// Covers the HLS management-system clauses (4–10) with a focus on
// customer orientation, process approach, risk-based thinking and
// continual improvement.
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const ISO9001_PROFILE: StandardProfile = {
  id: 'iso9001',
  name: 'ISO 9001',
  icon: 'Award',
  available: true,
  fullName: {
    de: 'ISO 9001:2015 — Qualitätsmanagement-System',
    en: 'ISO 9001:2015 — Quality Management System',
    fr: 'ISO 9001:2015 — Système de management de la qualité',
  },
  regulation: {
    de: 'ISO 9001:2015',
    en: 'ISO 9001:2015',
    fr: 'ISO 9001:2015',
  },
  description: {
    de: 'Audit-Workflow zur Konformität eines Qualitätsmanagement-Systems mit ISO 9001.',
    en: 'Conformity audit workflow for a quality management system under ISO 9001.',
    fr: "Flux d'audit de conformité d'un système de management de la qualité selon ISO 9001.",
  },
  intake: [
    {
      title: { de: 'Organisation & QMS-Geltungsbereich', en: 'Organisation & QMS scope', fr: 'Organisation & périmètre du SMQ' },
      subtitle: {
        de: 'Welcher Bereich wird bewertet?',
        en: 'Which scope is being assessed?',
        fr: 'Quel périmètre est évalué ?',
      },
      info: {
        de: 'ISO 9001 strukturiert das QMS nach den HLS-Klauseln 4–10 mit Prozessansatz und risikobasierter Denkweise.',
        en: 'ISO 9001 structures the QMS along HLS clauses 4–10 with a process approach and risk-based thinking.',
        fr: 'ISO 9001 structure le SMQ selon les clauses HLS 4–10 avec approche processus et pensée basée sur les risques.',
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Geltungsbereich', en: 'Organisation / scope', fr: 'Organisation / périmètre' },
          placeholder: { de: 'z. B. Muster GmbH, Produktion', en: 'e.g. Acme Ltd, Production', fr: 'p. ex. Exemple SARL, Production' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle / Verantwortung', en: 'Role / responsibility', fr: 'Rôle / responsabilité' },
          options: [
            { id: 'owner', icon: '🏢', label: { de: 'QM-Verantwortung / Leitung', en: 'QM owner / leadership', fr: 'Responsable SMQ / direction' }, desc: { de: 'QMS-Verantwortung', en: 'QMS responsibility', fr: 'Responsabilité SMQ' } },
            { id: 'manager', icon: '🧭', label: { de: 'QM-Manager / Repräsentant', en: 'QM manager / representative', fr: 'Responsable SMQ / représentant' } },
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
      title: { de: 'Kontext, Prozesse & Risikolandschaft', en: 'Context, processes & risk landscape', fr: 'Contexte, processus & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der Organisation, Prozesse & relevanten Interessenparteien', en: 'Description of the organisation, processes & interested parties', fr: "Description de l'organisation, des processus & parties intéressées" },
          placeholder: { de: 'Branche, Kernprozesse, Kunden, Lieferanten, Standorte, regulatorische Anforderungen …', en: 'Industry, core processes, customers, suppliers, sites, regulatory requirements …', fr: 'Secteur, processus clés, clients, fournisseurs, sites, exigences réglementaires …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kritische Bereiche / Prozesse', en: 'Critical areas / processes', fr: 'Domaines / processus critiques' },
          options: [
            { id: 'design', icon: '📐', label: { de: 'Entwicklung / Konstruktion', en: 'Design / development', fr: 'Conception / développement' } },
            { id: 'production', icon: '🏭', label: { de: 'Produktion / Fertigung', en: 'Production / manufacturing', fr: 'Production / fabrication' } },
            { id: 'service', icon: '🛎️', label: { de: 'Dienstleistung / Kundenservice', en: 'Service / customer support', fr: 'Prestation / service client' } },
            { id: 'supplychain', icon: '🔗', label: { de: 'Lieferkette / Beschaffung', en: 'Supply chain / procurement', fr: 'Chaîne logistique / approvisionnement' } },
            { id: 'it', icon: '💻', label: { de: 'IT & Dokumentenmanagement', en: 'IT & document management', fr: 'IT & gestion documentaire' } },
            { id: 'hr', icon: '👥', label: { de: 'Personal & Kompetenz', en: 'People & competence', fr: 'Personnel & compétence' } },
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
            { id: 'qmrep', icon: '🧭', label: { de: 'Benannter QM-Verantwortlicher', en: 'Designated QM representative', fr: 'Responsable SMQ désigné' } },
            { id: 'qms', icon: '📘', label: { de: 'QMS dokumentiert & etabliert', en: 'QMS documented & established', fr: 'SMQ documenté & établi' } },
            { id: 'policy', icon: '📜', label: { de: 'Qualitätspolitik & Ziele', en: 'Quality policy & objectives', fr: 'Politique qualité & objectifs' } },
            { id: 'processes', icon: '⚙️', label: { de: 'Prozesse definiert & überwacht', en: 'Processes defined & monitored', fr: 'Processus définis & surveillés' } },
            { id: 'audit', icon: '📋', label: { de: 'Internes Audit-/Review-Programm', en: 'Internal audit / review programme', fr: "Programme d'audit / revue interne" } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine dokumentierten Prozesse, keine internen Audits, unklare Verantwortlichkeiten, ungelöste Reklamationen …', en: 'e.g. no documented processes, no internal audits, unclear responsibilities, unresolved complaints …', fr: "p. ex. pas de processus documentés, pas d'audits internes, responsabilités floues …" },
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
          label: { de: 'QMS-Maßnahmen (ISO 9001)', en: 'QMS measures (ISO 9001)', fr: 'Mesures SMQ (ISO 9001)' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'context', label: { de: 'Kontext der Organisation & Interessenparteien', en: 'Context of the organisation & interested parties', fr: "Contexte de l'organisation & parties intéressées" } },
            { id: 'scope', label: { de: 'Geltungsbereich des QMS', en: 'Scope of the QMS', fr: 'Périmètre du SMQ' } },
            { id: 'leadership', label: { de: 'Führung, Politik & Verantwortlichkeiten', en: 'Leadership, policy & responsibilities', fr: 'Leadership, politique & responsabilités' } },
            { id: 'objectives', label: { de: 'Qualitätsziele & Planung', en: 'Quality objectives & planning', fr: 'Objectifs qualité & planification' } },
            { id: 'risk', label: { de: 'Risiken & Chancen (risikobasiertes Denken)', en: 'Risks & opportunities (risk-based thinking)', fr: 'Risques & opportunités (pensée basée sur les risques)' } },
            { id: 'resources', label: { de: 'Ressourcen & Kompetenz', en: 'Resources & competence', fr: 'Ressources & compétence' } },
            { id: 'awareness', label: { de: 'Bewusstsein & Kommunikation', en: 'Awareness & communication', fr: 'Sensibilisation & communication' } },
            { id: 'documented', label: { de: 'Dokumentierte Information', en: 'Documented information', fr: 'Informations documentées' } },
            { id: 'processes', label: { de: 'Prozesssteuerung & -überwachung', en: 'Process control & monitoring', fr: 'Maîtrise & surveillance des processus' } },
            { id: 'design', label: { de: 'Design- & Entwicklungssteuerung', en: 'Design & development control', fr: 'Maîtrise de la conception & développement' } },
            { id: 'purchasing', label: { de: 'Beschaffung & Lieferantenbewertung', en: 'Purchasing & supplier evaluation', fr: 'Achats & évaluation des fournisseurs' } },
            { id: 'production', label: { de: 'Produktions- / Dienstleistungserbringung', en: 'Production / service delivery', fr: 'Production / réalisation du service' } },
            { id: 'monitoring', label: { de: 'Messmittel & Überwachung', en: 'Monitoring & measuring resources', fr: 'Ressources de surveillance & mesure' } },
            { id: 'customer', label: { de: 'Kundenzufriedenheit & Reklamationsmanagement', en: 'Customer satisfaction & complaint management', fr: 'Satisfaction client & gestion des réclamations' } },
            { id: 'nc', label: { de: 'Nichtkonformität & Korrekturmaßnahmen', en: 'Nonconformity & corrective action', fr: 'Non-conformité & action corrective' } },
            { id: 'audit', label: { de: 'Internes Audit & Managementbewertung', en: 'Internal audit & management review', fr: 'Audit interne & revue de direction' } },
            { id: 'improvement', label: { de: 'Kontinuierliche Verbesserung', en: 'Continual improvement', fr: 'Amélioration continue' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Kontext & Führung', en: 'Context & leadership', fr: 'Contexte & leadership' }, weight: 2 },
    { id: 'plan', name: { de: 'Planung & Risiko', en: 'Planning & risk', fr: 'Planification & risque' } },
    { id: 'support', name: { de: 'Unterstützung', en: 'Support', fr: 'Support' } },
    { id: 'operation', name: { de: 'Betrieb', en: 'Operation', fr: 'Opération' }, weight: 2 },
    { id: 'evaluate', name: { de: 'Bewertung', en: 'Evaluation', fr: 'Évaluation' } },
    { id: 'improve', name: { de: 'Verbesserung', en: 'Improvement', fr: 'Amélioration' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'Q-G1', article: 'ISO 9001 §4–5', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:leadership'], requiresAny: ['roles:qmrep', 'roles:qms', 'roles:policy'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Top-Management', en: 'Top management', fr: 'Direction' }, name: { de: 'Kontext, Politik & QMS-Geltungsbereich', en: 'Context, policy & QMS scope', fr: 'Contexte, politique & périmètre du SMQ' }, criteria: [
      { de: 'Dokumentiertes QMS mit Politik, Geltungsbereich, benannten Rollen und Management-Commitment', en: 'Documented QMS with policy, scope, named roles and management commitment', fr: 'SMQ documenté avec politique, périmètre, rôles désignés et engagement de la direction' },
    ] },
    { id: 'Q-G2', article: 'ISO 9001 §6', categoryId: 'plan', mandatory: true, rule: { requiresAll: ['measures:objectives'], requiresAny: ['measures:risk'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'QM-Manager', en: 'QM manager', fr: 'Responsable SMQ' }, name: { de: 'Risiken, Chancen & Qualitätsziele', en: 'Risks, opportunities & quality objectives', fr: 'Risques, opportunités & objectifs qualité' } },
    { id: 'Q-S1', article: 'ISO 9001 §7', categoryId: 'support', mandatory: true, rule: { requiresAll: ['measures:resources'], requiresAny: ['measures:awareness', 'measures:documented'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'HR / QM', en: 'HR / QM', fr: 'RH / SMQ' }, name: { de: 'Ressourcen, Kompetenz & dokumentierte Information', en: 'Resources, competence & documented information', fr: 'Ressources, compétence & informations documentées' } },
    { id: 'Q-O1', article: 'ISO 9001 §8.1–8.5', categoryId: 'operation', weight: 2, mandatory: true, rule: { requiresAll: ['measures:processes'], requiresAny: ['measures:production', 'measures:monitoring'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Fachbereich / Prozessverantwortung', en: 'Business unit / process owner', fr: 'Métier / propriétaire de processus' }, name: { de: 'Prozesssteuerung & Produkt-/Dienstleistungserbringung', en: 'Process control & product/service delivery', fr: 'Maîtrise des processus & réalisation du produit/service' } },
    { id: 'Q-O2', article: 'ISO 9001 §8.3', categoryId: 'operation', weight: 2, mandatory: false, rule: { requiresAll: ['measures:design'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Entwicklung / Konstruktion', en: 'Design / development', fr: 'Conception / développement' }, name: { de: 'Design- & Entwicklungssteuerung', en: 'Design & development control', fr: 'Maîtrise de la conception & développement' } },
    { id: 'Q-O3', article: 'ISO 9001 §8.4', categoryId: 'operation', mandatory: true, rule: { requiresAll: ['measures:purchasing'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Beschaffung / Einkauf', en: 'Procurement / purchasing', fr: 'Achats' }, name: { de: 'Beschaffung & extern bereitgestellte Prozesse', en: 'Purchasing & externally provided processes', fr: 'Achats & processus fournis par des extérieurs' } },
    { id: 'Q-EV1', article: 'ISO 9001 §9.1', categoryId: 'evaluate', mandatory: true, rule: { requiresAll: ['measures:monitoring'], requiresAny: ['measures:customer'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'QM / Fachbereich', en: 'QM / business unit', fr: 'SMQ / métier' }, name: { de: 'Überwachung, Messung & Kundenzufriedenheit', en: 'Monitoring, measurement & customer satisfaction', fr: 'Surveillance, mesure & satisfaction client' } },
    { id: 'Q-EV2', article: 'ISO 9001 §9.2', categoryId: 'evaluate', mandatory: true, rule: { requiresAll: ['measures:audit'], requiresAny: ['roles:audit'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'QM / Interne Revision', en: 'QM / internal audit', fr: 'SMQ / audit interne' }, name: { de: 'Internes Audit & Managementbewertung', en: 'Internal audit & management review', fr: 'Audit interne & revue de direction' } },
    { id: 'Q-IM1', article: 'ISO 9001 §10.2', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:nc'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'QM-Manager', en: 'QM manager', fr: 'Responsable SMQ' }, name: { de: 'Nichtkonformität & Korrekturmaßnahmen', en: 'Nonconformity & corrective action', fr: 'Non-conformité & action corrective' } },
    { id: 'Q-IM2', article: 'ISO 9001 §10.3', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:improvement'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Top-Management', en: 'Top management', fr: 'Direction' }, name: { de: 'Kontinuierliche Verbesserung', en: 'Continual improvement', fr: 'Amélioration continue' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Precision Components AG',
    role: 'manager',
    phase: 'first',
    description:
      'Medium-sized manufacturing company producing precision mechanical parts for automotive and aerospace. ISO 9001 first certification sought. Core processes include design, CNC machining, quality inspection, and logistics. Key interested parties: OEM customers, regulatory bodies, suppliers of raw materials.',
    systems: ['design', 'production', 'supplychain', 'it', 'hr'],
    roles: ['mgmt', 'qmrep', 'qms', 'policy', 'processes'],
    knownIssues:
      'Some process instructions not fully reviewed. Internal audit program planned but not yet executed. Supplier evaluation criteria need formalisation. Management review held once but not yet on a regular schedule.',
    measures: ['context', 'scope', 'leadership', 'objectives', 'risk', 'resources', 'awareness', 'documented', 'processes', 'design', 'purchasing', 'production', 'monitoring', 'customer', 'nc', 'audit', 'improvement'],
    measures__mat__context: 'documented',
    measures__mat__scope: 'documented',
    measures__mat__leadership: 'documented',
    measures__mat__objectives: 'documented',
    measures__mat__risk: 'existing',
    measures__mat__resources: 'existing',
    measures__mat__awareness: 'existing',
    measures__mat__documented: 'documented',
    measures__mat__processes: 'existing',
    measures__mat__design: 'existing',
    measures__mat__purchasing: 'existing',
    measures__mat__production: 'existing',
    measures__mat__monitoring: 'existing',
    measures__mat__customer: 'existing',
    measures__mat__nc: 'existing',
    measures__mat__audit: 'existing',
    measures__mat__improvement: 'existing',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Re-Zertifizierung — auditreif', en: 'Re-certification — audit-ready', fr: 'Recertification — prêt pour l\'audit' },
      description: {
        de: 'Reifes QMS mit vollständigem Zyklus, internen Audits und kontinuierlicher Verbesserung.',
        en: 'Mature QMS with a complete cycle, internal audits and continual improvement.',
        fr: 'SMQ mature avec cycle complet, audits internes et amélioration continue.',
      },
      answers: {
        entityName: 'AeroTech Systems GmbH',
        role: 'owner',
        phase: 'recert',
        description:
          'Established QMS certified since 2019. All processes mapped, monitored and improved. Regular internal audits, management reviews, and closed-loop corrective actions. Customer satisfaction tracked and trended.',
        systems: ['design', 'production', 'service', 'supplychain', 'it', 'hr'],
        roles: ['mgmt', 'qmrep', 'qms', 'policy', 'processes', 'audit'],
        knownIssues:
          'Minor nonconformity from last surveillance on document control version numbering. Corrective action implemented and verified.',
        measures: ['context', 'scope', 'leadership', 'objectives', 'risk', 'resources', 'awareness', 'documented', 'processes', 'design', 'purchasing', 'production', 'monitoring', 'customer', 'nc', 'audit', 'improvement'],
        measures__mat__context: 'audited',
        measures__mat__scope: 'audited',
        measures__mat__leadership: 'audited',
        measures__mat__objectives: 'audited',
        measures__mat__risk: 'audited',
        measures__mat__resources: 'audited',
        measures__mat__awareness: 'audited',
        measures__mat__documented: 'audited',
        measures__mat__processes: 'audited',
        measures__mat__design: 'audited',
        measures__mat__purchasing: 'audited',
        measures__mat__production: 'audited',
        measures__mat__monitoring: 'audited',
        measures__mat__customer: 'audited',
        measures__mat__nc: 'audited',
        measures__mat__audit: 'audited',
        measures__mat__improvement: 'audited',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En développement' },
      description: {
        de: 'Teil-Konformität mit dokumentierten Prozessen, aber Lücken bei Audit und Verbesserung.',
        en: 'Partial conformity with documented processes, but gaps in audit and improvement.',
        fr: 'Conformité partielle avec processus documentés, mais lacunes sur audit et amélioration.',
      },
      answers: {
        entityName: 'Midway Logistics Ltd',
        role: 'manager',
        phase: 'internal',
        description:
          'Logistics provider with documented procedures for warehousing and transport. Quality policy established, but internal audit not yet performed and no formal management review cycle.',
        systems: ['service', 'supplychain', 'it'],
        roles: ['mgmt', 'qmrep', 'qms'],
        knownIssues:
          'No internal audit programme yet. Management review informal. No systematic customer satisfaction measurement. Supplier evaluation ad-hoc.',
        measures: ['context', 'scope', 'leadership', 'objectives', 'resources', 'documented', 'processes', 'purchasing', 'production', 'monitoring', 'nc'],
        measures__mat__context: 'documented',
        measures__mat__scope: 'documented',
        measures__mat__leadership: 'existing',
        measures__mat__objectives: 'existing',
        measures__mat__resources: 'existing',
        measures__mat__documented: 'existing',
        measures__mat__processes: 'existing',
        measures__mat__purchasing: 'existing',
        measures__mat__production: 'existing',
        measures__mat__monitoring: 'existing',
        measures__mat__nc: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum formalisiertes QMS, viele Lücken gegenüber ISO 9001.',
        en: 'Barely formalised QMS with many gaps against ISO 9001.',
        fr: 'SMQ peu formalisé, nombreuses lacunes face à ISO 9001.',
      },
      answers: {
        entityName: 'Start-Up Workshop Co',
        role: 'unit',
        phase: 'gap',
        description:
          'Small workshop with five employees. No formal QMS, processes learned by doing. No documented procedures, no internal audits, no management review.',
        systems: ['production'],
        roles: ['mgmt'],
        knownIssues:
          'No documented processes, no quality policy, no objectives, no risk assessment, no internal audit, no management review, no formal complaint handling.',
        measures: ['leadership'],
        measures__mat__leadership: 'existing',
      },
    },
  ],
};
