import type { StandardProfile } from './types';

// ── TISAX profile ───────────────────────────────────────────────
// TISAX (Trusted Information Security Assessment Exchange) based on the
// VDA ISA (Information Security Assessment) catalogue. Covers Information
// Security, Prototype Protection and Data Protection across the maturity
// model (levels 0–5, target 3) and the assessment levels AL1–AL3.
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const TISAX_PROFILE: StandardProfile = {
  id: 'tisax',
  name: 'TISAX',
  icon: 'Car',
  available: true,
  fullName: {
    de: 'TISAX — Trusted Information Security Assessment Exchange (VDA ISA)',
    en: 'TISAX — Trusted Information Security Assessment Exchange (VDA ISA)',
    fr: 'TISAX — Trusted Information Security Assessment Exchange (VDA ISA)',
  },
  regulation: {
    de: 'VDA ISA · ENX TISAX',
    en: 'VDA ISA · ENX TISAX',
    fr: 'VDA ISA · ENX TISAX',
  },
  description: {
    de: 'Audit-Workflow zur Informationssicherheit nach VDA ISA / TISAX, einschließlich Prototypen- und Datenschutz.',
    en: 'Conformity audit workflow for information security under VDA ISA / TISAX, including prototype and data protection.',
    fr: "Flux d'audit de conformité pour la sécurité de l'information selon VDA ISA / TISAX, y compris protection des prototypes et des données.",
  },
  intake: [
    {
      title: { de: 'Organisation & Bewertungsobjekt', en: 'Organisation & assessment object', fr: "Organisation & objet d'évaluation" },
      subtitle: {
        de: 'Welcher Standort / Geltungsbereich wird bewertet?',
        en: 'Which site / scope is being assessed?',
        fr: 'Quel site / périmètre est évalué ?',
      },
      info: {
        de: 'TISAX basiert auf dem VDA-ISA-Katalog. Das Assessment-Level (AL2/AL3) richtet sich nach dem Schutzbedarf.',
        en: 'TISAX is based on the VDA ISA catalogue. The assessment level (AL2/AL3) depends on the protection needs.',
        fr: "TISAX repose sur le catalogue VDA ISA. Le niveau d'évaluation (AL2/AL3) dépend des besoins de protection.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Standort', en: 'Organisation / site', fr: 'Organisation / site' },
          placeholder: { de: 'z. B. Muster Automotive GmbH, Werk Süd', en: 'e.g. Acme Automotive, South plant', fr: 'p. ex. Exemple Automotive, usine Sud' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Zielangriffsvektor / Geltungsbereich', en: 'Target scope', fr: 'Périmètre cible' },
          options: [
            { id: 'info', icon: '🔒', label: { de: 'Informationssicherheit', en: 'Information security', fr: "Sécurité de l'information" }, desc: { de: 'Basis-Geltungsbereich', en: 'Base scope', fr: 'Périmètre de base' } },
            { id: 'proto', icon: '🚗', label: { de: 'Prototypenschutz', en: 'Prototype protection', fr: 'Protection des prototypes' } },
            { id: 'data', icon: '🛡️', label: { de: 'Datenschutz', en: 'Data protection', fr: 'Protection des données' } },
            { id: 'full', icon: '🧩', label: { de: 'Voller Geltungsbereich', en: 'Full scope', fr: 'Périmètre complet' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Assessment-Level / Kontext', en: 'Assessment level / context', fr: "Niveau d'évaluation / contexte" },
          options: [
            { id: 'al2', label: { de: 'AL2 (normaler Schutzbedarf)', en: 'AL2 (normal protection)', fr: 'AL2 (protection normale)' } },
            { id: 'al3', label: { de: 'AL3 (hoher/sehr hoher Schutzbedarf)', en: 'AL3 (high/very high protection)', fr: 'AL3 (protection élevée)' } },
            { id: 'internal', label: { de: 'Internes Audit / Self-Assessment', en: 'Internal audit / self-assessment', fr: 'Audit interne / auto-évaluation' } },
            { id: 'recert', label: { de: 'Re-Zertifizierung', en: 'Re-certification', fr: 'Recertification' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Geltungsbereich, Systeme & Risikolandschaft', en: 'Scope, systems & risk landscape', fr: 'Périmètre, systèmes & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung des Geltungsbereichs, Standorte & verarbeiteter Informationen', en: 'Description of scope, sites & processed information', fr: 'Description du périmètre, sites & informations traitées' },
          placeholder: { de: 'Standorte, Geschäftsprozesse, OEM-Daten, Prototypen, personenbezogene Daten, IT-Dienstleister …', en: 'Sites, business processes, OEM data, prototypes, personal data, IT service providers …', fr: 'Sites, processus métier, données OEM, prototypes, données personnelles, prestataires IT …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kategorien verarbeiteter Informationen / Assets', en: 'Categories of processed information / assets', fr: "Catégories d'informations / actifs" },
          options: [
            { id: 'oem', icon: '🏭', label: { de: 'OEM-/Kundeninformationen', en: 'OEM / customer information', fr: 'Informations OEM / client' } },
            { id: 'proto', icon: '🚗', label: { de: 'Prototypen / Fahrzeuge / Bauteile', en: 'Prototypes / vehicles / parts', fr: 'Prototypes / véhicules / pièces' } },
            { id: 'pii', icon: '👤', label: { de: 'Personenbezogene Daten', en: 'Personal data', fr: 'Données personnelles' } },
            { id: 'ip', icon: '📐', label: { de: 'Konstruktions-/Entwicklungsdaten', en: 'Design / development data', fr: 'Données de conception / développement' } },
            { id: 'it', icon: '💻', label: { de: 'IT-Systeme & Netzwerke', en: 'IT systems & networks', fr: 'Systèmes IT & réseaux' } },
            { id: 'cloud', icon: '☁️', label: { de: 'Cloud- / Dienstleister', en: 'Cloud / service providers', fr: 'Cloud / prestataires' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Management committed', en: 'Management committed', fr: 'Direction engagée' } },
            { id: 'ciso', icon: '🛡️', label: { de: 'Benannte ISMS-Verantwortung (ISO/CISO)', en: 'Designated ISMS responsibility (ISO/CISO)', fr: 'Responsabilité SMSI désignée (ISO/CISO)' } },
            { id: 'isms', icon: '📘', label: { de: 'ISMS etabliert (VDA ISA)', en: 'ISMS established (VDA ISA)', fr: 'SMSI établi (VDA ISA)' } },
            { id: 'supplier', icon: '🔗', label: { de: 'Lieferanten-/Dienstleister-Steuerung', en: 'Supplier / service provider management', fr: 'Gestion fournisseurs / prestataires' } },
            { id: 'training', icon: '📚', label: { de: 'Awareness & Schulung', en: 'Awareness & training', fr: 'Sensibilisation & formation' } },
            { id: 'audit', icon: '📋', label: { de: 'Internes Audit-/Review-Programm', en: 'Internal audit / review programme', fr: "Programme d'audit / revue interne" } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine Risikobeurteilung, keine Klassifizierung, kein IAM, kein Incident-Prozess, keine BCM …', en: 'e.g. no risk assessment, no classification, no IAM, no incident process, no BCM …', fr: 'p. ex. pas d\'appréciation des risques, pas de classification, pas d\'IAM …' },
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
          label: { de: 'Maßnahmen nach VDA ISA / TISAX', en: 'Measures per VDA ISA / TISAX', fr: 'Mesures selon VDA ISA / TISAX' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'policy', label: { de: 'IS-Leitlinien & Management-Commitment', en: 'IS policies & management commitment', fr: 'Politiques SI & engagement direction' } },
            { id: 'isms', label: { de: 'ISMS-Organisation & Verantwortlichkeiten', en: 'ISMS organisation & responsibilities', fr: 'Organisation SMSI & responsabilités' } },
            { id: 'risk', label: { de: 'Risikomanagement & -beurteilung', en: 'Risk management & assessment', fr: 'Gestion & appréciation des risques' } },
            { id: 'assets', label: { de: 'Asset-Management & Inventar', en: 'Asset management & inventory', fr: 'Gestion des actifs & inventaire' } },
            { id: 'classification', label: { de: 'Informationsklassifizierung & -handhabung', en: 'Information classification & handling', fr: "Classification & traitement de l'information" } },
            { id: 'iam', label: { de: 'Identitäts- & Zugriffsmanagement', en: 'Identity & access management', fr: "Gestion des identités & des accès" } },
            { id: 'crypto', label: { de: 'Kryptografie & Schlüsselmanagement', en: 'Cryptography & key management', fr: 'Cryptographie & gestion des clés' } },
            { id: 'physical', label: { de: 'Physische Sicherheit & Zutritt', en: 'Physical security & access', fr: 'Sécurité physique & accès' } },
            { id: 'operations', label: { de: 'Betriebssicherheit (Malware, Patch, Backup)', en: 'Operations security (malware, patch, backup)', fr: 'Sécurité d\'exploitation (malware, patch, sauvegarde)' } },
            { id: 'network', label: { de: 'Netzwerksicherheit & Segmentierung', en: 'Network security & segmentation', fr: 'Sécurité réseau & segmentation' } },
            { id: 'supplier', label: { de: 'Lieferanten- & Dienstleistersteuerung', en: 'Supplier & service provider management', fr: 'Gestion fournisseurs & prestataires' } },
            { id: 'incident', label: { de: 'Incident-Management', en: 'Incident management', fr: 'Gestion des incidents' } },
            { id: 'bcm', label: { de: 'Business Continuity & Wiederherstellung', en: 'Business continuity & recovery', fr: 'Continuité d\'activité & restauration' } },
            { id: 'proto', label: { de: 'Prototypenschutz (Bau/Test/Transport)', en: 'Prototype protection (build/test/transport)', fr: 'Protection prototypes (fabrication/essai/transport)' } },
            { id: 'privacy', label: { de: 'Datenschutz / DSGVO-Maßnahmen', en: 'Data protection / GDPR measures', fr: 'Protection des données / mesures RGPD' } },
            { id: 'awareness', label: { de: 'Awareness & Schulung', en: 'Awareness & training', fr: 'Sensibilisation & formation' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Governance & ISMS', en: 'Governance & ISMS', fr: 'Gouvernance & SMSI' }, weight: 2 },
    { id: 'identify', name: { de: 'Identifizieren & Klassifizieren', en: 'Identify & classify', fr: 'Identifier & classifier' }, weight: 2 },
    { id: 'protect', name: { de: 'Schützen', en: 'Protect', fr: 'Protéger' }, weight: 2 },
    { id: 'detect', name: { de: 'Erkennen', en: 'Detect', fr: 'Détecter' } },
    { id: 'respond', name: { de: 'Reagieren', en: 'Respond', fr: 'Répondre' }, weight: 2 },
    { id: 'recover', name: { de: 'Wiederherstellen & Spezialschutz', en: 'Recover & special protection', fr: 'Récupérer & protection spéciale' } },
  ],
  maturity: { enabled: true, target: 3 },
  requirements: [
    { id: 'TX-G1', article: 'VDA ISA 1 IS Policies', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:isms'], requiresAny: ['roles:ciso', 'roles:isms'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Geschäftsführung / ISO', en: 'Management / ISO', fr: 'Direction / ISO' }, name: { de: 'ISMS-Organisation, Leitlinien & Verantwortlichkeiten', en: 'ISMS organisation, policies & responsibilities', fr: 'Organisation SMSI, politiques & responsabilités' }, criteria: [
      { de: 'Dokumentiertes ISMS nach VDA ISA mit benannten Rollen und Management-Commitment', en: 'Documented ISMS per VDA ISA with named roles and management commitment', fr: 'SMSI documenté selon VDA ISA avec rôles désignés et engagement de la direction' },
    ] },
    { id: 'TX-G2', article: 'VDA ISA Risk', categoryId: 'govern', mandatory: true, rule: { requiresAll: ['measures:risk'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'ISO / Risk-Owner', en: 'ISO / risk owner', fr: 'ISO / propriétaire du risque' }, name: { de: 'Risikomanagement & -beurteilung', en: 'Risk management & assessment', fr: 'Gestion & appréciation des risques' } },
    { id: 'TX-ID1', article: 'VDA ISA Asset Mgmt', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:assets'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / Fachbereiche', en: 'IT / business units', fr: 'IT / métiers' }, name: { de: 'Asset-Management & Inventar', en: 'Asset management & inventory', fr: 'Gestion des actifs & inventaire' } },
    { id: 'TX-ID2', article: 'VDA ISA Classification', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:classification'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Informationseigentümer', en: 'Information owners', fr: "Propriétaires de l'information" }, name: { de: 'Informationsklassifizierung & -handhabung', en: 'Information classification & handling', fr: "Classification & traitement de l'information" } },
    { id: 'TX-PR1', article: 'VDA ISA IAM', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:iam'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Identitäts- & Zugriffsmanagement', en: 'Identity & access management', fr: 'Gestion des identités & des accès' } },
    { id: 'TX-PR2', article: 'VDA ISA Crypto', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:crypto'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Kryptografie & Schlüsselmanagement', en: 'Cryptography & key management', fr: 'Cryptographie & gestion des clés' } },
    { id: 'TX-PR3', article: 'VDA ISA Physical', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:physical'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Facility / Sicherheit', en: 'Facility / security', fr: 'Installations / sécurité' }, name: { de: 'Physische Sicherheit & Zutrittssteuerung', en: 'Physical security & access control', fr: "Sécurité physique & contrôle d'accès" } },
    { id: 'TX-PR4', article: 'VDA ISA Operations', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:operations'], requiresAny: ['measures:network'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT-Betrieb', en: 'IT operations', fr: 'Exploitation IT' }, name: { de: 'Betriebs- & Netzwerksicherheit (Malware, Patch, Segmentierung)', en: 'Operations & network security (malware, patch, segmentation)', fr: 'Sécurité exploitation & réseau (malware, patch, segmentation)' } },
    { id: 'TX-PR5', article: 'VDA ISA Suppliers', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:supplier'], requiresAny: ['roles:supplier'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Einkauf / ISO', en: 'Procurement / ISO', fr: 'Achats / ISO' }, name: { de: 'Lieferanten- & Dienstleistersteuerung', en: 'Supplier & service provider management', fr: 'Gestion fournisseurs & prestataires' } },
    { id: 'TX-DE1', article: 'VDA ISA Detect', categoryId: 'detect', mandatory: true, rule: { requiresAll: ['measures:operations'], requiresAny: ['measures:incident'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / SOC', en: 'IT / SOC', fr: 'IT / SOC' }, name: { de: 'Logging, Monitoring & Ereigniserkennung', en: 'Logging, monitoring & event detection', fr: 'Journalisation, surveillance & détection d\'événements' } },
    { id: 'TX-RS1', article: 'VDA ISA Incident', categoryId: 'respond', weight: 2, mandatory: true, rule: { requiresAll: ['measures:incident'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'ISO / IT', en: 'ISO / IT', fr: 'ISO / IT' }, name: { de: 'Incident-Management & Meldewege', en: 'Incident management & reporting lines', fr: 'Gestion des incidents & remontée' } },
    { id: 'TX-RS2', article: 'VDA ISA Awareness', categoryId: 'respond', mandatory: true, rule: { requiresAll: ['measures:awareness'], requiresAny: ['roles:training'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'HR / ISO', en: 'HR / ISO', fr: 'RH / ISO' }, name: { de: 'Awareness & Schulung', en: 'Awareness & training', fr: 'Sensibilisation & formation' } },
    { id: 'TX-RC1', article: 'VDA ISA BCM', categoryId: 'recover', mandatory: true, rule: { requiresAll: ['measures:bcm'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'IT / BCM', en: 'IT / BCM', fr: 'IT / BCM' }, name: { de: 'Business Continuity & Wiederherstellung', en: 'Business continuity & recovery', fr: 'Continuité d\'activité & restauration' } },
    { id: 'TX-RC2', article: 'VDA ISA Prototype', categoryId: 'recover', mandatory: false, rule: { requiresAll: ['measures:proto'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Werk / Sicherheit', en: 'Plant / security', fr: 'Usine / sécurité' }, name: { de: 'Prototypenschutz (sofern im Geltungsbereich)', en: 'Prototype protection (if in scope)', fr: 'Protection des prototypes (si dans le périmètre)' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Automotive GmbH',
    role: 'full',
    phase: 'al3',
    description:
      'Tier-1 automotive supplier processing OEM design and prototype data at two German plants. ISMS based on VDA ISA, segmented IT/OT networks, classified information handling and a prototype protection regime for test vehicles. Preparing for an AL3 TISAX assessment.',
    systems: ['oem', 'proto', 'pii', 'ip', 'it', 'cloud'],
    roles: ['mgmt', 'ciso', 'isms', 'supplier', 'training'],
    knownIssues:
      'Classification applied but not consistently across legacy repositories. IAM reviews quarterly but privileged-access governance incomplete. BCM plans documented but not fully tested. Prototype transport controls partially implemented.',
    measures: ['policy', 'isms', 'risk', 'assets', 'classification', 'iam', 'crypto', 'physical', 'operations', 'network', 'supplier', 'incident', 'bcm', 'proto', 'privacy', 'awareness'],
    measures__mat__policy: 'documented',
    measures__mat__isms: 'documented',
    measures__mat__risk: 'documented',
    measures__mat__assets: 'documented',
    measures__mat__classification: 'existing',
    measures__mat__iam: 'documented',
    measures__mat__crypto: 'documented',
    measures__mat__physical: 'documented',
    measures__mat__operations: 'documented',
    measures__mat__network: 'existing',
    measures__mat__supplier: 'documented',
    measures__mat__incident: 'documented',
    measures__mat__bcm: 'existing',
    measures__mat__proto: 'existing',
    measures__mat__privacy: 'documented',
    measures__mat__awareness: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'AL3 — auditreif', en: 'AL3 — audit-ready', fr: 'AL3 — prêt pour l\'audit' },
      description: {
        de: 'Tier-1-Zulieferer mit reifem ISMS und geprüftem Prototypenschutz.',
        en: 'Tier-1 supplier with a mature ISMS and verified prototype protection.',
        fr: 'Fournisseur de rang 1 avec SMSI mature et protection des prototypes vérifiée.',
      },
      answers: {
        entityName: 'Northern Star Automotive',
        role: 'full',
        phase: 'al3',
        description:
          'Tier-1 supplier with a fully implemented VDA ISA ISMS, consistent information classification, mature IAM with privileged-access governance, tested BCM and an audited prototype protection regime across build, test and transport.',
        systems: ['oem', 'proto', 'pii', 'ip', 'it', 'cloud'],
        roles: ['mgmt', 'ciso', 'isms', 'supplier', 'training', 'audit'],
        knownIssues:
          'Minor observations from the last internal audit on document versioning. Monitoring rule tuning ongoing.',
        measures: ['policy', 'isms', 'risk', 'assets', 'classification', 'iam', 'crypto', 'physical', 'operations', 'network', 'supplier', 'incident', 'bcm', 'proto', 'privacy', 'awareness'],
        measures__mat__policy: 'audited',
        measures__mat__isms: 'audited',
        measures__mat__risk: 'documented',
        measures__mat__assets: 'documented',
        measures__mat__classification: 'documented',
        measures__mat__iam: 'documented',
        measures__mat__crypto: 'documented',
        measures__mat__physical: 'documented',
        measures__mat__operations: 'documented',
        measures__mat__network: 'documented',
        measures__mat__supplier: 'documented',
        measures__mat__incident: 'documented',
        measures__mat__bcm: 'documented',
        measures__mat__proto: 'audited',
        measures__mat__privacy: 'documented',
        measures__mat__awareness: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En développement' },
      description: {
        de: 'Teil-Konformität mit etabliertem ISMS, aber offenen technischen Maßnahmen.',
        en: 'Partial conformity with an established ISMS but open technical measures.',
        fr: 'Conformité partielle avec SMSI établi mais mesures techniques ouvertes.',
      },
      answers: {
        entityName: 'Coastal Components GmbH',
        role: 'info',
        phase: 'al2',
        description:
          'Component supplier building its VDA ISA ISMS. Policies and risk assessment in place; classification under way; no prototype scope. BCM not yet tested.',
        systems: ['oem', 'ip', 'it'],
        roles: ['mgmt', 'ciso'],
        knownIssues:
          'No consistent IAM reviews. Network segmentation partial. Incident process undocumented. BCM not exercised.',
        measures: ['policy', 'isms', 'risk', 'assets', 'iam', 'operations'],
        measures__mat__policy: 'documented',
        measures__mat__isms: 'existing',
        measures__mat__risk: 'existing',
        measures__mat__assets: 'existing',
        measures__mat__iam: 'existing',
        measures__mat__operations: 'documented',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum formalisiertes ISMS, viele Lücken im VDA-ISA-Katalog.',
        en: 'Barely formalised ISMS with many gaps against the VDA ISA catalogue.',
        fr: 'SMSI peu formalisé, nombreuses lacunes face au catalogue VDA ISA.',
      },
      answers: {
        entityName: 'Harbour Parts Co',
        role: 'info',
        phase: 'internal',
        description:
          'Small supplier at the start of its TISAX journey. No formal ISMS, no risk assessment, security relies on individual IT practices.',
        systems: ['oem', 'it'],
        roles: ['mgmt'],
        knownIssues:
          'No ISMS, no classification, no IAM governance, no incident or BCM process, no awareness programme.',
        measures: ['operations'],
        measures__mat__operations: 'existing',
      },
    },
  ],
};
