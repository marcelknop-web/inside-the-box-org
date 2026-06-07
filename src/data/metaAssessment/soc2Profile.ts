import type { StandardProfile } from './types';

// ── SOC 2 profile ───────────────────────────────────────────────
// AICPA SOC 2 (Trust Services Criteria 2017, rev. 2022). Assessed
// against the five Trust Services Categories: Security (Common
// Criteria CC1–CC9, mandatory), Availability, Confidentiality,
// Processing Integrity and Privacy. The engine assesses the
// requirements below strictly against supplied evidence (no invented
// findings — Data Integrity Policy).

export const SOC2_PROFILE: StandardProfile = {
  id: 'soc2',
  name: 'SOC 2',
  icon: 'ShieldCheck',
  available: true,
  fullName: {
    de: 'SOC 2 (AICPA Trust Services Criteria)',
    en: 'SOC 2 (AICPA Trust Services Criteria)',
    fr: 'SOC 2 (AICPA Trust Services Criteria)',
  },
  regulation: {
    de: 'AICPA TSC 2017 (rev. 2022)',
    en: 'AICPA TSC 2017 (rev. 2022)',
    fr: 'AICPA TSC 2017 (rév. 2022)',
  },
  description: {
    de: 'Readiness-Workflow für SOC 2 entlang der Trust Services Criteria (Security/Common Criteria + Availability, Confidentiality, Processing Integrity, Privacy).',
    en: 'Readiness workflow for SOC 2 along the Trust Services Criteria (Security/Common Criteria + Availability, Confidentiality, Processing Integrity, Privacy).',
    fr: "Flux de préparation SOC 2 selon les Trust Services Criteria (Security/Common Criteria + Availability, Confidentiality, Processing Integrity, Privacy).",
  },
  intake: [
    {
      title: { de: 'Organisation & Bewertungsobjekt', en: 'Organisation & assessment object', fr: "Organisation & objet d'évaluation" },
      subtitle: {
        de: 'Welcher Service wird gegen die SOC 2 Trust Services Criteria bewertet?',
        en: 'Which service is assessed against the SOC 2 Trust Services Criteria?',
        fr: 'Quel service est évalué par rapport aux SOC 2 Trust Services Criteria ?',
      },
      info: {
        de: 'Der Report-Typ (Type I = Design zum Stichtag, Type II = operative Wirksamkeit über einen Zeitraum) bestimmt die Nachweistiefe.',
        en: 'The report type (Type I = design at a point in time, Type II = operating effectiveness over a period) determines the depth of evidence.',
        fr: "Le type de rapport (Type I = conception à une date, Type II = efficacité opérationnelle sur une période) détermine la profondeur des preuves.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Service', en: 'Organisation / service', fr: 'Organisation / service' },
          placeholder: { de: 'z. B. Muster GmbH, SaaS-Plattform', en: 'e.g. Acme Ltd, SaaS platform', fr: "p. ex. Exemple SARL, plateforme SaaS" },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Report-Typ (Ziel)', en: 'Report type (target)', fr: 'Type de rapport (cible)' },
          options: [
            { id: 'type1', icon: '🟡', label: { de: 'Type I — Design zum Stichtag', en: 'Type I — design at a point in time', fr: 'Type I — conception à une date' } },
            { id: 'type2', icon: '🔴', label: { de: 'Type II — operative Wirksamkeit', en: 'Type II — operating effectiveness', fr: 'Type II — efficacité opérationnelle' }, desc: { de: 'Über einen Zeitraum (z. B. 6–12 Monate)', en: 'Over a period (e.g. 6–12 months)', fr: 'Sur une période (p. ex. 6–12 mois)' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Bewertungskontext', en: 'Assessment context', fr: "Contexte d'évaluation" },
          options: [
            { id: 'baseline', label: { de: 'Readiness / Erst-Bewertung', en: 'Readiness / initial assessment', fr: 'Préparation / évaluation initiale' } },
            { id: 'gap', label: { de: 'Gap-Analyse', en: 'Gap analysis', fr: 'Analyse des écarts' } },
            { id: 'periodic', label: { de: 'Re-Audit / Überwachung', en: 'Re-audit / surveillance', fr: 'Ré-audit / surveillance' } },
            { id: 'improvement', label: { de: 'Verbesserungsprogramm', en: 'Improvement programme', fr: "Programme d'amélioration" } },
          ],
        },
      ],
    },
    {
      title: { de: 'Umfang & Trust Services Categories', en: 'Scope & Trust Services Categories', fr: 'Périmètre & Trust Services Categories' },
      info: {
        de: 'Security (Common Criteria) ist immer im Umfang. Die weiteren Kategorien sind optional je nach Service-Commitment.',
        en: 'Security (Common Criteria) is always in scope. The other categories are optional depending on the service commitment.',
        fr: "La Security (Common Criteria) est toujours dans le périmètre. Les autres catégories sont optionnelles selon l'engagement de service.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung des Service-Systems, Infrastruktur & Datenflüsse', en: 'Description of the service system, infrastructure & data flows', fr: 'Description du système de service, infrastructure & flux de données' },
          placeholder: { de: 'Anwendung, Cloud-Infrastruktur, Subprozessoren, Kundendaten, Mitarbeitende, Standorte …', en: 'Application, cloud infrastructure, subservice organisations, customer data, staff, locations …', fr: 'Application, infrastructure cloud, sous-traitants, données clients, personnel, sites …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Trust Services Categories im Umfang', en: 'Trust Services Categories in scope', fr: 'Trust Services Categories dans le périmètre' },
          options: [
            { id: 'security', icon: '🛡️', label: { de: 'Security (Common Criteria)', en: 'Security (Common Criteria)', fr: 'Security (Common Criteria)' }, desc: { de: 'Immer im Umfang', en: 'Always in scope', fr: 'Toujours dans le périmètre' } },
            { id: 'availability', icon: '⏱️', label: { de: 'Availability', en: 'Availability', fr: 'Availability' } },
            { id: 'confidentiality', icon: '🔒', label: { de: 'Confidentiality', en: 'Confidentiality', fr: 'Confidentiality' } },
            { id: 'integrity', icon: '✅', label: { de: 'Processing Integrity', en: 'Processing Integrity', fr: 'Processing Integrity' } },
            { id: 'privacy', icon: '👤', label: { de: 'Privacy', en: 'Privacy', fr: 'Privacy' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Management committed / Tone at the top', en: 'Management committed / tone at the top', fr: 'Direction engagée / tone at the top' } },
            { id: 'secteam', icon: '🛡️', label: { de: 'Benanntes Security-Team / Verantwortung', en: 'Designated security team / responsibility', fr: 'Équipe / responsabilité sécurité désignée' } },
            { id: 'policies', icon: '📜', label: { de: 'Dokumentierte Policies & Verfahren', en: 'Documented policies & procedures', fr: 'Politiques & procédures documentées' } },
            { id: 'monitoring', icon: '📡', label: { de: 'Monitoring / Logging (SIEM)', en: 'Monitoring / logging (SIEM)', fr: 'Surveillance / journalisation (SIEM)' } },
            { id: 'vendor', icon: '🤝', label: { de: 'Vendor-/Subservice-Management', en: 'Vendor / subservice management', fr: 'Gestion fournisseurs / sous-traitants' } },
            { id: 'review', icon: '📋', label: { de: 'Regelmäßige Reviews / Tests', en: 'Regular reviews / testing', fr: 'Revues / tests réguliers' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine Risikobewertung, kein Change-Management, kein IR-Plan, keine Zugriffsreviews, keine Vendor-Bewertung …', en: 'e.g. no risk assessment, no change management, no IR plan, no access reviews, no vendor assessment …', fr: "p. ex. pas d'évaluation des risques, pas de gestion du changement, pas de plan IR …" },
        },
      ],
    },
    {
      title: { de: 'Umgesetzte Controls', en: 'Implemented controls', fr: 'Contrôles en place' },
      info: {
        de: 'Nur ankreuzen, was nachweislich existiert. Die KI erfindet keine Nachweise.',
        en: 'Only tick what verifiably exists. The AI invents no evidence.',
        fr: "Ne cochez que ce qui existe réellement. L'IA n'invente aucune preuve.",
      },
      fields: [
        {
          id: 'measures',
          type: 'maturity-multi',
          label: { de: 'SOC 2 Trust Services Criteria', en: 'SOC 2 Trust Services Criteria', fr: 'SOC 2 Trust Services Criteria' },
          help: { de: 'Pro ausgewähltem Kriterium den Reifegrad angeben.', en: 'Specify the maturity for each selected criterion.', fr: 'Indiquez la maturité de chaque critère.' },
          options: [
            { id: 'cc1', label: { de: 'CC1 — Kontrollumfeld (Governance, Integrität)', en: 'CC1 — Control environment (governance, integrity)', fr: "CC1 — Environnement de contrôle (gouvernance)" } },
            { id: 'cc2', label: { de: 'CC2 — Kommunikation & Information', en: 'CC2 — Communication & information', fr: 'CC2 — Communication & information' } },
            { id: 'cc3', label: { de: 'CC3 — Risikobewertung', en: 'CC3 — Risk assessment', fr: 'CC3 — Évaluation des risques' } },
            { id: 'cc4', label: { de: 'CC4 — Monitoring-Aktivitäten', en: 'CC4 — Monitoring activities', fr: 'CC4 — Activités de surveillance' } },
            { id: 'cc5', label: { de: 'CC5 — Kontrollaktivitäten', en: 'CC5 — Control activities', fr: 'CC5 — Activités de contrôle' } },
            { id: 'cc6', label: { de: 'CC6 — Logischer & physischer Zugriff', en: 'CC6 — Logical & physical access', fr: 'CC6 — Accès logique & physique' } },
            { id: 'cc7', label: { de: 'CC7 — Systembetrieb (Monitoring, Incident)', en: 'CC7 — System operations (monitoring, incident)', fr: 'CC7 — Exploitation des systèmes' } },
            { id: 'cc8', label: { de: 'CC8 — Change-Management', en: 'CC8 — Change management', fr: 'CC8 — Gestion du changement' } },
            { id: 'cc9', label: { de: 'CC9 — Risikominderung (Vendor, BCP)', en: 'CC9 — Risk mitigation (vendor, BCP)', fr: 'CC9 — Atténuation des risques (fournisseurs, PCA)' } },
            { id: 'a1', label: { de: 'A1 — Availability (Kapazität, Backup, DR)', en: 'A1 — Availability (capacity, backup, DR)', fr: 'A1 — Availability (capacité, sauvegarde, DR)' } },
            { id: 'c1', label: { de: 'C1 — Confidentiality (Klassifizierung, Verschlüsselung)', en: 'C1 — Confidentiality (classification, encryption)', fr: 'C1 — Confidentiality (classification, chiffrement)' } },
            { id: 'pi1', label: { de: 'PI1 — Processing Integrity (Vollständigkeit, Genauigkeit)', en: 'PI1 — Processing Integrity (completeness, accuracy)', fr: 'PI1 — Processing Integrity (exhaustivité, exactitude)' } },
            { id: 'p1', label: { de: 'P1 — Privacy (Notice, Consent, Datenrechte)', en: 'P1 — Privacy (notice, consent, data rights)', fr: 'P1 — Privacy (notice, consentement, droits)' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'cc', name: { de: 'Common Criteria (Security)', en: 'Common Criteria (Security)', fr: 'Common Criteria (Security)' }, weight: 2 },
    { id: 'availability', name: { de: 'Availability', en: 'Availability', fr: 'Availability' } },
    { id: 'confidentiality', name: { de: 'Confidentiality', en: 'Confidentiality', fr: 'Confidentiality' } },
    { id: 'integrity', name: { de: 'Processing Integrity', en: 'Processing Integrity', fr: 'Processing Integrity' } },
    { id: 'privacy', name: { de: 'Privacy', en: 'Privacy', fr: 'Privacy' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'CC1', article: 'TSC CC1', categoryId: 'cc', weight: 2, mandatory: true, rule: { requiresAll: ['measures:cc1'], requiresAny: ['roles:mgmt'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Geschäftsführung', en: 'Executive management', fr: 'Direction' }, name: { de: 'Kontrollumfeld (Governance, Integrität, Verantwortung)', en: 'Control environment (governance, integrity, accountability)', fr: 'Environnement de contrôle (gouvernance, intégrité)' }, criteria: [
      { de: 'Integrität, ethische Werte, Aufsicht durch Leitung und definierte Verantwortlichkeiten', en: 'Integrity, ethical values, board oversight and defined responsibilities', fr: 'Intégrité, valeurs éthiques, supervision et responsabilités définies' },
    ] },
    { id: 'CC2', article: 'TSC CC2', categoryId: 'cc', mandatory: true, rule: { requiresAll: ['measures:cc2'], requiresAny: ['roles:policies'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Security / Compliance', en: 'Security / compliance', fr: 'Sécurité / conformité' }, name: { de: 'Kommunikation & Information', en: 'Communication & information', fr: 'Communication & information' } },
    { id: 'CC3', article: 'TSC CC3', categoryId: 'cc', weight: 2, mandatory: true, rule: { requiresAll: ['measures:cc3'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Risikomanagement', en: 'Risk management', fr: 'Gestion des risques' }, name: { de: 'Risikobewertung', en: 'Risk assessment', fr: 'Évaluation des risques' } },
    { id: 'CC4', article: 'TSC CC4', categoryId: 'cc', mandatory: true, rule: { requiresAll: ['measures:cc4'], requiresAny: ['roles:review', 'roles:monitoring'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Internal Audit / Security', en: 'Internal audit / security', fr: 'Audit interne / sécurité' }, name: { de: 'Monitoring-Aktivitäten', en: 'Monitoring activities', fr: 'Activités de surveillance' } },
    { id: 'CC5', article: 'TSC CC5', categoryId: 'cc', mandatory: true, rule: { requiresAll: ['measures:cc5'], requiresAny: ['roles:policies'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Security / Compliance', en: 'Security / compliance', fr: 'Sécurité / conformité' }, name: { de: 'Kontrollaktivitäten', en: 'Control activities', fr: 'Activités de contrôle' } },
    { id: 'CC6', article: 'TSC CC6', categoryId: 'cc', weight: 2, mandatory: true, rule: { requiresAll: ['measures:cc6'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'IT / IAM', en: 'IT / IAM', fr: 'IT / IAM' }, name: { de: 'Logischer & physischer Zugriffsschutz', en: 'Logical & physical access controls', fr: 'Contrôles d\'accès logique & physique' } },
    { id: 'CC7', article: 'TSC CC7', categoryId: 'cc', weight: 2, mandatory: true, rule: { requiresAll: ['measures:cc7'], requiresAny: ['roles:monitoring'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT-Security / SOC', en: 'IT security / SOC', fr: 'Sécurité IT / SOC' }, name: { de: 'Systembetrieb (Monitoring & Incident-Management)', en: 'System operations (monitoring & incident management)', fr: 'Exploitation des systèmes (surveillance & incidents)' } },
    { id: 'CC8', article: 'TSC CC8', categoryId: 'cc', mandatory: true, rule: { requiresAll: ['measures:cc8'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / Entwicklung', en: 'IT / development', fr: 'IT / développement' }, name: { de: 'Change-Management', en: 'Change management', fr: 'Gestion du changement' } },
    { id: 'CC9', article: 'TSC CC9', categoryId: 'cc', mandatory: true, rule: { requiresAll: ['measures:cc9'], requiresAny: ['roles:vendor'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Security / Einkauf', en: 'Security / procurement', fr: 'Sécurité / achats' }, name: { de: 'Risikominderung (Vendor-Management & Business Continuity)', en: 'Risk mitigation (vendor management & business continuity)', fr: 'Atténuation des risques (fournisseurs & continuité)' } },
    { id: 'A1', article: 'TSC A1', categoryId: 'availability', mandatory: false, rule: { requiresAll: ['measures:a1'], requiresAny: ['systems:availability'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Betrieb', en: 'IT operations', fr: 'Exploitation IT' }, name: { de: 'Availability (Kapazität, Backup, Disaster Recovery)', en: 'Availability (capacity, backup, disaster recovery)', fr: 'Availability (capacité, sauvegarde, reprise)' } },
    { id: 'C1', article: 'TSC C1', categoryId: 'confidentiality', mandatory: false, rule: { requiresAll: ['measures:c1'], requiresAny: ['systems:confidentiality'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Security / Datenschutz', en: 'Security / data protection', fr: 'Sécurité / protection des données' }, name: { de: 'Confidentiality (Klassifizierung, Verschlüsselung, Löschung)', en: 'Confidentiality (classification, encryption, disposal)', fr: 'Confidentiality (classification, chiffrement, suppression)' } },
    { id: 'PI1', article: 'TSC PI1', categoryId: 'integrity', mandatory: false, rule: { requiresAll: ['measures:pi1'], requiresAny: ['systems:integrity'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'IT / Fachbereich', en: 'IT / business', fr: 'IT / métier' }, name: { de: 'Processing Integrity (Vollständigkeit, Genauigkeit, Aktualität)', en: 'Processing Integrity (completeness, accuracy, timeliness)', fr: 'Processing Integrity (exhaustivité, exactitude, actualité)' } },
    { id: 'P1', article: 'TSC P1', categoryId: 'privacy', mandatory: false, rule: { requiresAll: ['measures:p1'], requiresAny: ['systems:privacy'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Datenschutz', en: 'Data protection', fr: 'Protection des données' }, name: { de: 'Privacy (Notice, Consent, Datenrechte, Datenqualität)', en: 'Privacy (notice, consent, data rights, data quality)', fr: 'Privacy (notice, consentement, droits, qualité des données)' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Cloud Ltd',
    role: 'type2',
    phase: 'baseline',
    description:
      'B2B SaaS platform hosted on AWS, serving enterprise customers. In-scope categories Security, Availability and Confidentiality. Pursuing a SOC 2 Type II report covering a 6-month observation window. Readiness assessment to prepare for the audit.',
    systems: ['security', 'availability', 'confidentiality'],
    roles: ['mgmt', 'secteam', 'policies', 'monitoring'],
    knownIssues:
      'Formal risk assessment performed but not yet annual cadence. Access reviews ad-hoc rather than quarterly. Change management documented but evidence inconsistent. Vendor risk assessment partial. DR tested once, not on a schedule.',
    measures: ['cc1', 'cc2', 'cc3', 'cc5', 'cc6', 'cc7', 'cc8', 'a1', 'c1'],
    measures__mat__cc1: 'documented',
    measures__mat__cc2: 'documented',
    measures__mat__cc3: 'existing',
    measures__mat__cc5: 'documented',
    measures__mat__cc6: 'documented',
    measures__mat__cc7: 'existing',
    measures__mat__cc8: 'existing',
    measures__mat__a1: 'existing',
    measures__mat__c1: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Type II — audit-ready', en: 'Type II — audit-ready', fr: 'Type II — prêt pour l\'audit' },
      description: {
        de: 'Reifes Kontrollsystem mit nachgewiesener operativer Wirksamkeit.',
        en: 'Mature control system with demonstrated operating effectiveness.',
        fr: 'Système de contrôle mature avec efficacité opérationnelle démontrée.',
      },
      answers: {
        entityName: 'Northern Star SaaS',
        role: 'type2',
        phase: 'periodic',
        description:
          'Established SaaS provider with a mature control framework, dedicated security team, SIEM, quarterly access reviews, formal change management, annual risk assessment, vendor risk programme and scheduled DR tests. In-scope: Security, Availability, Confidentiality, Processing Integrity.',
        systems: ['security', 'availability', 'confidentiality', 'integrity'],
        roles: ['mgmt', 'secteam', 'policies', 'monitoring', 'vendor', 'review'],
        knownIssues:
          'Minor exceptions in prior audit remediated and re-tested. Control evidence consistently collected.',
        measures: ['cc1', 'cc2', 'cc3', 'cc4', 'cc5', 'cc6', 'cc7', 'cc8', 'cc9', 'a1', 'c1', 'pi1'],
        measures__mat__cc1: 'audited',
        measures__mat__cc2: 'documented',
        measures__mat__cc3: 'documented',
        measures__mat__cc4: 'documented',
        measures__mat__cc5: 'documented',
        measures__mat__cc6: 'audited',
        measures__mat__cc7: 'documented',
        measures__mat__cc8: 'documented',
        measures__mat__cc9: 'documented',
        measures__mat__a1: 'documented',
        measures__mat__c1: 'documented',
        measures__mat__pi1: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En cours' },
      description: {
        de: 'Common Criteria teils umgesetzt, Wirksamkeitsnachweise lückenhaft.',
        en: 'Common Criteria partly in place, effectiveness evidence patchy.',
        fr: 'Common Criteria partiellement en place, preuves d\'efficacité lacunaires.',
      },
      answers: {
        entityName: 'Coastal Apps Ltd',
        role: 'type1',
        phase: 'gap',
        description:
          'Growing startup pursuing its first SOC 2 Type I. Core security controls drafted, policies partly documented, monitoring basic. In-scope: Security and Availability only.',
        systems: ['security', 'availability'],
        roles: ['mgmt', 'secteam', 'policies'],
        knownIssues:
          'No formal risk assessment. Access reviews not performed. Change management informal. No vendor risk process. DR untested.',
        measures: ['cc1', 'cc2', 'cc5', 'cc6', 'cc7', 'a1'],
        measures__mat__cc1: 'documented',
        measures__mat__cc2: 'existing',
        measures__mat__cc5: 'existing',
        measures__mat__cc6: 'existing',
        measures__mat__cc7: 'existing',
        measures__mat__a1: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum strukturierte Controls, viele Lücken in den Common Criteria.',
        en: 'Barely structured controls with many Common Criteria gaps.',
        fr: 'Contrôles peu structurés, nombreuses lacunes dans les Common Criteria.',
      },
      answers: {
        entityName: 'Harbour Startup Co',
        role: 'type1',
        phase: 'baseline',
        description:
          'Very small organisation at the start of its SOC 2 journey. Few documented controls, no risk assessment, shared accounts, ad-hoc operations. In-scope: Security only.',
        systems: ['security'],
        roles: ['mgmt'],
        knownIssues:
          'No control environment documentation, no risk assessment, no access controls, no monitoring, no change management, no vendor management.',
        measures: ['cc6'],
        measures__mat__cc6: 'existing',
      },
    },
  ],
};
