import type { StandardProfile } from './types';

// ── Maritime Cyber Readiness profile ────────────────────────────
// Operational maritime cyber risk management for shipping companies,
// aligned with the BIMCO "Guidelines on Cyber Security Onboard Ships",
// IMO MSC-FAL.1/Circ.3 ("Guidelines on Maritime Cyber Risk Management")
// and IMO Resolution MSC.428(98) — which requires cyber risk to be
// addressed within the company's Safety Management System (ISM Code).
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const MARITIME_CYBER_PROFILE: StandardProfile = {
  id: 'maritimecyber',
  name: 'Maritime Cyber',
  icon: 'Ship',
  available: true,
  fullName: {
    de: 'Maritime Cyber Readiness — BIMCO / IMO / MSC.428(98)',
    en: 'Maritime Cyber Readiness — BIMCO / IMO / MSC.428(98)',
    fr: 'Cyber-préparation maritime — BIMCO / OMI / MSC.428(98)',
  },
  regulation: {
    de: 'BIMCO-Leitlinien · IMO MSC-FAL.1/Circ.3 · Resolution MSC.428(98)',
    en: 'BIMCO Guidelines · IMO MSC-FAL.1/Circ.3 · Resolution MSC.428(98)',
    fr: 'Lignes directrices BIMCO · OMI MSC-FAL.1/Circ.3 · Résolution MSC.428(98)',
  },
  description: {
    de: 'Audit der maritimen Cyber-Risikosteuerung im SMS (ISM Code, MSC.428(98)).',
    en: 'Audit of maritime cyber risk management in the SMS (ISM Code, MSC.428(98)).',
    fr: "Audit de la gestion des cyber-risques maritimes dans le SGS (Code ISM, MSC.428(98)).",
  },
  intake: [
    {
      title: { de: 'Reederei & Bewertungsobjekt', en: 'Company & assessment object', fr: "Compagnie & objet d'évaluation" },
      subtitle: {
        de: 'Welche Reederei / Flotte wird bewertet?',
        en: 'Which company / fleet is being assessed?',
        fr: 'Quelle compagnie / flotte est évaluée ?',
      },
      info: {
        de: 'MSC.428(98) verlangt seit dem ersten jährlichen DOC-Verifizierungsaudit nach dem 1. Januar 2021 die Berücksichtigung von Cyber-Risiken im SMS.',
        en: 'MSC.428(98) requires cyber risk to be addressed in the SMS from the first annual DOC verification audit after 1 January 2021.',
        fr: "MSC.428(98) exige la prise en compte des cyber-risques dans le SGS dès le premier audit annuel de vérification du DOC après le 1er janvier 2021.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Reederei / Organisation', en: 'Company / organisation', fr: 'Compagnie / organisation' },
          placeholder: { de: 'z. B. Muster Shipping GmbH', en: 'e.g. Acme Shipping Ltd', fr: 'p. ex. Exemple Shipping' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle / Verantwortung', en: 'Role / responsibility', fr: 'Rôle / responsabilité' },
          options: [
            { id: 'company', icon: '🏢', label: { de: 'Reederei / DOC-Holder', en: 'Company / DOC holder', fr: 'Compagnie / titulaire du DOC' }, desc: { de: 'SMS-Verantwortung', en: 'SMS responsibility', fr: 'Responsabilité SGS' } },
            { id: 'dpa', icon: '🧭', label: { de: 'Designated Person Ashore (DPA)', en: 'Designated Person Ashore (DPA)', fr: 'Personne désignée à terre (DPA)' } },
            { id: 'ship', icon: '🛳️', label: { de: 'Bordmanagement / Master', en: 'Ship management / master', fr: 'Gestion du navire / capitaine' } },
            { id: 'manager', icon: '🤝', label: { de: 'Ship Manager (Drittverwaltung)', en: 'Ship manager (third-party)', fr: 'Gestionnaire de navire (tiers)' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Audit-Kontext', en: 'Audit context', fr: "Contexte d'audit" },
          options: [
            { id: 'initial', label: { de: 'Erst-Implementierung', en: 'Initial implementation', fr: 'Mise en œuvre initiale' } },
            { id: 'internal', label: { de: 'Internes Audit / Vorbereitung', en: 'Internal audit / preparation', fr: 'Audit interne / préparation' } },
            { id: 'doc', label: { de: 'DOC-Verifizierungsaudit', en: 'DOC verification audit', fr: 'Audit de vérification DOC' } },
            { id: 'review', label: { de: 'Jährliche Überprüfung', en: 'Annual review', fr: 'Revue annuelle' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Flotte, Systeme & Risikolandschaft', en: 'Fleet, systems & risk landscape', fr: 'Flotte, systèmes & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der Flotte, IT/OT-Systeme & Schnittstellen', en: 'Description of fleet, IT/OT systems & interfaces', fr: 'Description de la flotte, systèmes IT/OT & interfaces' },
          placeholder: { de: 'Schiffstypen, Bord-IT, OT-Systeme (Navigation, Antrieb), Ship-Shore-Kommunikation, Dienstleister …', en: 'Vessel types, ship IT, OT systems (navigation, propulsion), ship-shore communications, service providers …', fr: 'Types de navires, IT de bord, systèmes OT (navigation, propulsion), communications navire-terre, prestataires …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kategorien betroffener Systeme', en: 'Categories of affected systems', fr: 'Catégories de systèmes concernés' },
          options: [
            { id: 'navigation', icon: '🧭', label: { de: 'Navigation (ECDIS, Radar, GNSS)', en: 'Navigation (ECDIS, radar, GNSS)', fr: 'Navigation (ECDIS, radar, GNSS)' } },
            { id: 'propulsion', icon: '⚙️', label: { de: 'Antrieb & Maschinensteuerung', en: 'Propulsion & machinery control', fr: 'Propulsion & contrôle machine' } },
            { id: 'cargo', icon: '📦', label: { de: 'Ladungs- & Ballastmanagement', en: 'Cargo & ballast management', fr: 'Gestion cargaison & ballast' } },
            { id: 'comms', icon: '📡', label: { de: 'Ship-Shore-Kommunikation / VSAT', en: 'Ship-shore communications / VSAT', fr: 'Communications navire-terre / VSAT' } },
            { id: 'business', icon: '💼', label: { de: 'Geschäfts-IT an Land', en: 'Shore business IT', fr: 'IT métier à terre' } },
            { id: 'crew', icon: '👥', label: { de: 'Crew-Wohlfahrt / Internet', en: 'Crew welfare / internet', fr: 'Bien-être équipage / internet' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Senior Management committed', en: 'Senior management committed', fr: 'Direction engagée' } },
            { id: 'dpa', icon: '🧭', label: { de: 'DPA mit Cyber-Verantwortung', en: 'DPA with cyber responsibility', fr: 'DPA avec responsabilité cyber' } },
            { id: 'sms', icon: '📘', label: { de: 'Cyber im SMS verankert (ISM)', en: 'Cyber embedded in SMS (ISM)', fr: 'Cyber ancré dans le SGS (ISM)' } },
            { id: 'shipshore', icon: '🔗', label: { de: 'Ship-Shore-Verantwortlichkeiten geklärt', en: 'Ship-shore responsibilities defined', fr: 'Responsabilités navire-terre définies' } },
            { id: 'supplier', icon: '🏭', label: { de: 'Lieferanten-/Dienstleister-Steuerung', en: 'Supplier / service provider management', fr: 'Gestion fournisseurs / prestataires' } },
            { id: 'training', icon: '📚', label: { de: 'Crew- & Office-Awareness', en: 'Crew & office awareness', fr: 'Sensibilisation équipage & bureau' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine Risikobeurteilung, kein Notfallplan an Bord, keine Übungen, keine USB-Kontrolle …', en: 'e.g. no risk assessment, no on-board contingency plan, no exercises, no USB control …', fr: 'p. ex. pas d\'appréciation des risques, pas de plan d\'urgence à bord, pas d\'exercices …' },
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
          label: { de: 'Maßnahmen der maritimen Cyber-Risikosteuerung', en: 'Maritime cyber risk management measures', fr: 'Mesures de gestion des cyber-risques maritimes' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'policy', label: { de: 'Cyber-Policy & Management-Commitment', en: 'Cyber policy & management commitment', fr: 'Politique cyber & engagement de la direction' } },
            { id: 'smsintegration', label: { de: 'Integration ins SMS (ISM Code)', en: 'Integration into the SMS (ISM Code)', fr: 'Intégration au SGS (Code ISM)' } },
            { id: 'inventory', label: { de: 'Inventar kritischer IT/OT-Systeme', en: 'Inventory of critical IT/OT systems', fr: 'Inventaire des systèmes IT/OT critiques' } },
            { id: 'riskassess', label: { de: 'Cyber-Risikobeurteilung (Schiff & Land)', en: 'Cyber risk assessment (ship & shore)', fr: 'Appréciation des cyber-risques (navire & terre)' } },
            { id: 'access', label: { de: 'Zugriffssteuerung & Benutzerverwaltung', en: 'Access control & user management', fr: "Contrôle d'accès & gestion des utilisateurs" } },
            { id: 'network', label: { de: 'Netzwerksegmentierung & -härtung', en: 'Network segmentation & hardening', fr: 'Segmentation & durcissement réseau' } },
            { id: 'media', label: { de: 'Kontrolle von Wechselmedien (USB)', en: 'Control of removable media (USB)', fr: 'Contrôle des supports amovibles (USB)' } },
            { id: 'malware', label: { de: 'Schutz vor Schadsoftware', en: 'Malware protection', fr: 'Protection contre les logiciels malveillants' } },
            { id: 'remote', label: { de: 'Absicherung Remote- & Wartungszugänge', en: 'Securing remote & maintenance access', fr: 'Sécurisation accès distant & maintenance' } },
            { id: 'detection', label: { de: 'Detektion & Monitoring', en: 'Detection & monitoring', fr: 'Détection & surveillance' } },
            { id: 'contingency', label: { de: 'Notfall-/Contingency-Plan an Bord', en: 'On-board contingency plan', fr: "Plan d'urgence à bord" } },
            { id: 'response', label: { de: 'Incident-Response & Meldewege', en: 'Incident response & reporting lines', fr: 'Réponse aux incidents & remontée' } },
            { id: 'recovery', label: { de: 'Backup & Wiederherstellung', en: 'Backup & recovery', fr: 'Sauvegarde & restauration' } },
            { id: 'training', label: { de: 'Schulung & Awareness (Bord & Land)', en: 'Training & awareness (ship & shore)', fr: 'Formation & sensibilisation (bord & terre)' } },
            { id: 'drills', label: { de: 'Übungen & Tests (Drills)', en: 'Exercises & drills', fr: 'Exercices & simulations' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Governance & SMS-Verankerung', en: 'Governance & SMS embedding', fr: 'Gouvernance & ancrage SGS' }, weight: 2 },
    { id: 'identify', name: { de: 'Identifizieren', en: 'Identify', fr: 'Identifier' }, weight: 2 },
    { id: 'protect', name: { de: 'Schützen', en: 'Protect', fr: 'Protéger' }, weight: 2 },
    { id: 'detect', name: { de: 'Erkennen', en: 'Detect', fr: 'Détecter' } },
    { id: 'respond', name: { de: 'Reagieren', en: 'Respond', fr: 'Répondre' }, weight: 2 },
    { id: 'recover', name: { de: 'Wiederherstellen', en: 'Recover', fr: 'Récupérer' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'MAR-G1', article: 'MSC.428(98)', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:smsintegration'], requiresAny: ['roles:sms', 'roles:dpa'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Reederei / DPA', en: 'Company / DPA', fr: 'Compagnie / DPA' }, name: { de: 'Verankerung der Cyber-Risiken im SMS (ISM Code)', en: 'Cyber risk embedded in the SMS (ISM Code)', fr: 'Cyber-risques ancrés dans le SGS (Code ISM)' }, criteria: [
      { de: 'Cyber-Risikomanagement nachweislich Bestandteil des dokumentierten SMS gemäß MSC.428(98)', en: 'Cyber risk management demonstrably part of the documented SMS per MSC.428(98)', fr: 'Gestion des cyber-risques démontrée comme partie du SGS documenté selon MSC.428(98)' },
    ] },
    { id: 'MAR-G2', article: 'BIMCO §2', categoryId: 'govern', mandatory: true, rule: { requiresAll: ['measures:policy'], requiresAny: ['roles:mgmt'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Senior Management', en: 'Senior management', fr: 'Direction' }, name: { de: 'Cyber-Policy & Management-Commitment', en: 'Cyber policy & management commitment', fr: 'Politique cyber & engagement de la direction' } },
    { id: 'MAR-ID1', article: 'IMO MSC-FAL.1/Circ.3 Identify', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:inventory'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Reederei / Bord', en: 'Company / ship', fr: 'Compagnie / bord' }, name: { de: 'Inventar kritischer IT/OT-Systeme', en: 'Inventory of critical IT/OT systems', fr: 'Inventaire des systèmes IT/OT critiques' } },
    { id: 'MAR-ID2', article: 'IMO MSC-FAL.1/Circ.3 Identify', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:riskassess'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Reederei / DPA', en: 'Company / DPA', fr: 'Compagnie / DPA' }, name: { de: 'Cyber-Risikobeurteilung (Schiff & Land)', en: 'Cyber risk assessment (ship & shore)', fr: 'Appréciation des cyber-risques (navire & terre)' } },
    { id: 'MAR-PR1', article: 'IMO MSC-FAL.1/Circ.3 Protect', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:network'], requiresAny: ['measures:access'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'IT / OT', en: 'IT / OT', fr: 'IT / OT' }, name: { de: 'Netzwerksegmentierung, Härtung & Zugriffssteuerung', en: 'Network segmentation, hardening & access control', fr: 'Segmentation, durcissement réseau & contrôle d\'accès' } },
    { id: 'MAR-PR2', article: 'BIMCO §3 Protect', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:media'], requiresAny: ['measures:malware'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Bord / IT', en: 'Ship / IT', fr: 'Bord / IT' }, name: { de: 'Wechselmedien-Kontrolle & Schadsoftwareschutz', en: 'Removable-media control & malware protection', fr: 'Contrôle supports amovibles & protection anti-malware' } },
    { id: 'MAR-PR3', article: 'BIMCO §3 Protect', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:remote'], requiresAny: ['roles:supplier'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Reederei / Dienstleister', en: 'Company / service provider', fr: 'Compagnie / prestataire' }, name: { de: 'Absicherung von Remote- & Wartungszugängen / Dienstleistern', en: 'Securing remote & maintenance access / service providers', fr: 'Sécurisation accès distant & maintenance / prestataires' } },
    { id: 'MAR-DE1', article: 'IMO MSC-FAL.1/Circ.3 Detect', categoryId: 'detect', mandatory: true, rule: { requiresAll: ['measures:detection'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Reederei / Land-SOC', en: 'Company / shore SOC', fr: 'Compagnie / SOC à terre' }, name: { de: 'Detektion & Monitoring von Cyber-Ereignissen', en: 'Detection & monitoring of cyber events', fr: 'Détection & surveillance des événements cyber' } },
    { id: 'MAR-RS1', article: 'IMO MSC-FAL.1/Circ.3 Respond', categoryId: 'respond', weight: 2, mandatory: true, rule: { requiresAll: ['measures:contingency'], requiresAny: ['measures:response'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Bord / DPA', en: 'Ship / DPA', fr: 'Bord / DPA' }, name: { de: 'Notfall-/Contingency-Plan & Incident-Response', en: 'Contingency plan & incident response', fr: "Plan d'urgence & réponse aux incidents" } },
    { id: 'MAR-RS2', article: 'BIMCO §5 Respond', categoryId: 'respond', mandatory: true, rule: { requiresAll: ['measures:training'], requiresAny: ['measures:drills', 'roles:training'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Reederei / Bord', en: 'Company / ship', fr: 'Compagnie / bord' }, name: { de: 'Schulung, Awareness & Übungen', en: 'Training, awareness & exercises', fr: 'Formation, sensibilisation & exercices' } },
    { id: 'MAR-RC1', article: 'IMO MSC-FAL.1/Circ.3 Recover', categoryId: 'recover', mandatory: true, rule: { requiresAll: ['measures:recovery'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Bord / IT', en: 'Ship / IT', fr: 'Bord / IT' }, name: { de: 'Backup & Wiederherstellung kritischer Systeme', en: 'Backup & recovery of critical systems', fr: 'Sauvegarde & restauration des systèmes critiques' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Shipping Ltd',
    role: 'company',
    phase: 'doc',
    description:
      'Mid-size dry-bulk operator managing a fleet of 18 vessels. Ship IT and OT (navigation, propulsion control), VSAT ship-shore communications and a shore business network. Several systems maintained remotely by OEM service providers. Preparing for the annual DOC verification audit.',
    systems: ['navigation', 'propulsion', 'comms', 'business', 'crew'],
    roles: ['mgmt', 'dpa', 'sms', 'shipshore', 'training'],
    knownIssues:
      'Risk assessments completed for most but not all vessel types. Removable-media policy defined but not enforced technically on all ships. Contingency plans drafted but only partially exercised on board. OT backups inconsistent across the fleet.',
    measures: ['policy', 'smsintegration', 'inventory', 'riskassess', 'access', 'network', 'malware', 'remote', 'detection', 'contingency', 'response', 'recovery', 'training'],
    measures__mat__policy: 'documented',
    measures__mat__smsintegration: 'documented',
    measures__mat__inventory: 'documented',
    measures__mat__riskassess: 'documented',
    measures__mat__access: 'documented',
    measures__mat__network: 'existing',
    measures__mat__malware: 'documented',
    measures__mat__remote: 'existing',
    measures__mat__detection: 'existing',
    measures__mat__contingency: 'documented',
    measures__mat__response: 'existing',
    measures__mat__recovery: 'existing',
    measures__mat__training: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'DOC-Audit — auditreif', en: 'DOC audit — audit-ready', fr: 'Audit DOC — prêt pour l\'audit' },
      description: {
        de: 'Reederei mit vollständig im SMS verankertem Cyber-Risikomanagement und geübten Plänen.',
        en: 'Company with cyber risk management fully embedded in the SMS and exercised plans.',
        fr: 'Compagnie avec gestion des cyber-risques pleinement ancrée dans le SGS et plans testés.',
      },
      answers: {
        entityName: 'Northern Star Maritime',
        role: 'company',
        phase: 'doc',
        description:
          'Tanker operator with a mature SMS. Cyber risk management fully integrated per MSC.428(98), complete IT/OT inventory, segmented networks, enforced USB controls, monitored shore SOC, and regularly exercised on-board contingency plans.',
        systems: ['navigation', 'propulsion', 'cargo', 'comms', 'business', 'crew'],
        roles: ['mgmt', 'dpa', 'sms', 'shipshore', 'supplier', 'training'],
        knownIssues:
          'Minor observations from the last internal audit on documentation versioning. Monitoring rule tuning ongoing.',
        measures: ['policy', 'smsintegration', 'inventory', 'riskassess', 'access', 'network', 'media', 'malware', 'remote', 'detection', 'contingency', 'response', 'recovery', 'training', 'drills'],
        measures__mat__policy: 'audited',
        measures__mat__smsintegration: 'audited',
        measures__mat__inventory: 'documented',
        measures__mat__riskassess: 'audited',
        measures__mat__access: 'documented',
        measures__mat__network: 'documented',
        measures__mat__media: 'documented',
        measures__mat__malware: 'documented',
        measures__mat__remote: 'documented',
        measures__mat__detection: 'documented',
        measures__mat__contingency: 'audited',
        measures__mat__response: 'documented',
        measures__mat__recovery: 'documented',
        measures__mat__training: 'documented',
        measures__mat__drills: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En développement' },
      description: {
        de: 'Teil-Konformität mit dokumentierter Policy, aber mehreren offenen operativen Maßnahmen.',
        en: 'Partial conformity with a documented policy but several open operational measures.',
        fr: 'Conformité partielle avec politique documentée mais plusieurs mesures opérationnelles ouvertes.',
      },
      answers: {
        entityName: 'Coastal Trader Shipping',
        role: 'dpa',
        phase: 'internal',
        description:
          'General cargo operator establishing maritime cyber risk management. Policy and SMS integration drafted; risk assessments under way; no on-board exercises yet.',
        systems: ['navigation', 'propulsion', 'comms'],
        roles: ['mgmt', 'dpa'],
        knownIssues:
          'No enforced USB control. Contingency plans not exercised. OT backups missing. Remote-access governance for OEMs not formalised.',
        measures: ['policy', 'smsintegration', 'inventory', 'riskassess', 'malware'],
        measures__mat__policy: 'documented',
        measures__mat__smsintegration: 'existing',
        measures__mat__inventory: 'existing',
        measures__mat__riskassess: 'existing',
        measures__mat__malware: 'documented',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum formalisiertes Cyber-Risikomanagement, viele Lücken im SMS.',
        en: 'Barely formalised cyber risk management with many SMS gaps.',
        fr: 'Gestion des cyber-risques peu formalisée, nombreuses lacunes dans le SGS.',
      },
      answers: {
        entityName: 'Harbour Lines Co',
        role: 'ship',
        phase: 'initial',
        description:
          'Small operator at the start of cyber risk management. No formal cyber policy, no risk assessment, security relies on individual crew practices and supplier defaults.',
        systems: ['navigation', 'comms'],
        roles: ['mgmt'],
        knownIssues:
          'No SMS integration, no inventory, no risk assessment, no contingency or recovery planning, no awareness programme.',
        measures: ['malware'],
        measures__mat__malware: 'existing',
      },
    },
  ],
};
