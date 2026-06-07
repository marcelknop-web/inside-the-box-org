import type { StandardProfile } from './types';

// ── CIS Controls profile ────────────────────────────────────────
// CIS Critical Security Controls v8 — 18 controls, assessed across the
// three Implementation Groups (IG1 essential cyber hygiene, IG2, IG3).
// Covers asset and software inventory, data protection, secure
// configuration, access and identity, vulnerability management, logging,
// defenses, awareness, incident response and penetration testing.
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const CIS_CONTROLS_PROFILE: StandardProfile = {
  id: 'ciscontrols',
  name: 'CIS Controls',
  icon: 'ListChecks',
  available: true,
  fullName: {
    de: 'CIS Critical Security Controls v8',
    en: 'CIS Critical Security Controls v8',
    fr: 'CIS Critical Security Controls v8',
  },
  regulation: {
    de: 'CIS Controls v8 (IG1–IG3)',
    en: 'CIS Controls v8 (IG1–IG3)',
    fr: 'CIS Controls v8 (IG1–IG3)',
  },
  description: {
    de: 'Audit-Workflow für die 18 CIS Critical Security Controls v8 entlang der Implementation Groups (IG1–IG3).',
    en: 'Conformity audit workflow for the 18 CIS Critical Security Controls v8 along the Implementation Groups (IG1–IG3).',
    fr: "Flux d'audit de conformité pour les 18 CIS Critical Security Controls v8 selon les Implementation Groups (IG1–IG3).",
  },
  intake: [
    {
      title: { de: 'Organisation & Bewertungsobjekt', en: 'Organisation & assessment object', fr: "Organisation & objet d'évaluation" },
      subtitle: {
        de: 'Welche Umgebung wird gegen die CIS Controls bewertet?',
        en: 'Which environment is assessed against the CIS Controls?',
        fr: 'Quel environnement est évalué par rapport aux CIS Controls ?',
      },
      info: {
        de: 'Die Implementation Group (IG1–IG3) bestimmt den erwarteten Umsetzungsumfang nach Größe und Risiko.',
        en: 'The Implementation Group (IG1–IG3) determines the expected scope based on size and risk.',
        fr: "L'Implementation Group (IG1–IG3) détermine le périmètre attendu selon la taille et le risque.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Umgebung', en: 'Organisation / environment', fr: 'Organisation / environnement' },
          placeholder: { de: 'z. B. Muster GmbH, Unternehmens-IT', en: 'e.g. Acme Ltd, corporate IT', fr: 'p. ex. Exemple SARL, IT d\'entreprise' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Implementation Group (Ziel)', en: 'Implementation Group (target)', fr: 'Implementation Group (cible)' },
          options: [
            { id: 'ig1', icon: '🟢', label: { de: 'IG1 — Basis-Cyberhygiene', en: 'IG1 — essential cyber hygiene', fr: 'IG1 — hygiène cyber essentielle' }, desc: { de: 'Kleine Organisationen', en: 'Small organisations', fr: 'Petites organisations' } },
            { id: 'ig2', icon: '🟡', label: { de: 'IG2 — erweiterte Reife', en: 'IG2 — enhanced maturity', fr: 'IG2 — maturité renforcée' } },
            { id: 'ig3', icon: '🔴', label: { de: 'IG3 — hohe Reife', en: 'IG3 — high maturity', fr: 'IG3 — maturité élevée' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Bewertungskontext', en: 'Assessment context', fr: "Contexte d'évaluation" },
          options: [
            { id: 'baseline', label: { de: 'Erst-Bewertung / Baseline', en: 'Initial assessment / baseline', fr: 'Évaluation initiale / baseline' } },
            { id: 'gap', label: { de: 'Gap-Analyse', en: 'Gap analysis', fr: 'Analyse des écarts' } },
            { id: 'periodic', label: { de: 'Periodische Überprüfung', en: 'Periodic review', fr: 'Revue périodique' } },
            { id: 'improvement', label: { de: 'Verbesserungsprogramm', en: 'Improvement programme', fr: "Programme d'amélioration" } },
          ],
        },
      ],
    },
    {
      title: { de: 'Umgebung & Risikolandschaft', en: 'Environment & risk landscape', fr: 'Environnement & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der IT-Umgebung, Assets & Datenflüsse', en: 'Description of the IT environment, assets & data flows', fr: 'Description de l\'environnement IT, actifs & flux de données' },
          placeholder: { de: 'Endpoints, Server, Cloud, Netzwerke, Anwendungen, Identitäten, Remote-Arbeit …', en: 'Endpoints, servers, cloud, networks, applications, identities, remote work …', fr: 'Postes, serveurs, cloud, réseaux, applications, identités, télétravail …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kategorien von Assets / Umgebungen', en: 'Categories of assets / environments', fr: "Catégories d'actifs / environnements" },
          options: [
            { id: 'endpoints', icon: '💻', label: { de: 'Endpoints / Workstations', en: 'Endpoints / workstations', fr: 'Postes / workstations' } },
            { id: 'servers', icon: '🖥️', label: { de: 'Server & Rechenzentrum', en: 'Servers & data centre', fr: 'Serveurs & datacenter' } },
            { id: 'cloud', icon: '☁️', label: { de: 'Cloud / SaaS', en: 'Cloud / SaaS', fr: 'Cloud / SaaS' } },
            { id: 'network', icon: '🌐', label: { de: 'Netzwerk & Perimeter', en: 'Network & perimeter', fr: 'Réseau & périmètre' } },
            { id: 'identity', icon: '🔑', label: { de: 'Identitäten & Verzeichnisdienste', en: 'Identities & directory services', fr: 'Identités & annuaires' } },
            { id: 'apps', icon: '🧩', label: { de: 'Eigen-/Webanwendungen', en: 'In-house / web applications', fr: 'Applications internes / web' } },
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
            { id: 'secteam', icon: '🛡️', label: { de: 'Benanntes Security-Team / Verantwortung', en: 'Designated security team / responsibility', fr: 'Équipe / responsabilité sécurité désignée' } },
            { id: 'tooling', icon: '🧰', label: { de: 'Zentrales Security-Tooling (EDR, SIEM)', en: 'Central security tooling (EDR, SIEM)', fr: 'Outils de sécurité centralisés (EDR, SIEM)' } },
            { id: 'soc', icon: '📡', label: { de: 'SOC / Monitoring (intern oder MSSP)', en: 'SOC / monitoring (internal or MSSP)', fr: 'SOC / surveillance (interne ou MSSP)' } },
            { id: 'training', icon: '📚', label: { de: 'Security-Awareness-Programm', en: 'Security awareness programme', fr: 'Programme de sensibilisation' } },
            { id: 'review', icon: '📋', label: { de: 'Regelmäßige Reviews / Tests', en: 'Regular reviews / testing', fr: 'Revues / tests réguliers' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. kein Asset-Inventar, kein Patch-Prozess, kein MFA, keine Logs, keine Backups, kein IR-Plan …', en: 'e.g. no asset inventory, no patch process, no MFA, no logs, no backups, no IR plan …', fr: 'p. ex. pas d\'inventaire, pas de patch, pas de MFA, pas de logs, pas de sauvegardes …' },
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
          label: { de: 'CIS Controls v8 (1–18)', en: 'CIS Controls v8 (1–18)', fr: 'CIS Controls v8 (1–18)' },
          help: { de: 'Pro ausgewähltem Control den Reifegrad angeben.', en: 'Specify the maturity for each selected control.', fr: 'Indiquez la maturité de chaque contrôle.' },
          options: [
            { id: 'c1', label: { de: 'C1 — Inventar Enterprise-Assets', en: 'C1 — Inventory of enterprise assets', fr: 'C1 — Inventaire des actifs' } },
            { id: 'c2', label: { de: 'C2 — Inventar Software-Assets', en: 'C2 — Inventory of software assets', fr: 'C2 — Inventaire des logiciels' } },
            { id: 'c3', label: { de: 'C3 — Datenschutz / Data Protection', en: 'C3 — Data protection', fr: 'C3 — Protection des données' } },
            { id: 'c4', label: { de: 'C4 — Sichere Konfiguration', en: 'C4 — Secure configuration', fr: 'C4 — Configuration sécurisée' } },
            { id: 'c5', label: { de: 'C5 — Account-Management', en: 'C5 — Account management', fr: 'C5 — Gestion des comptes' } },
            { id: 'c6', label: { de: 'C6 — Zugriffssteuerung & MFA', en: 'C6 — Access control management & MFA', fr: 'C6 — Gestion des accès & MFA' } },
            { id: 'c7', label: { de: 'C7 — Kontinuierliches Schwachstellenmanagement', en: 'C7 — Continuous vulnerability management', fr: 'C7 — Gestion continue des vulnérabilités' } },
            { id: 'c8', label: { de: 'C8 — Audit-Log-Management', en: 'C8 — Audit log management', fr: 'C8 — Gestion des journaux' } },
            { id: 'c9', label: { de: 'C9 — Schutz von E-Mail & Browser', en: 'C9 — Email & web browser protections', fr: 'C9 — Protection messagerie & navigateur' } },
            { id: 'c10', label: { de: 'C10 — Malware-Abwehr', en: 'C10 — Malware defenses', fr: 'C10 — Défenses anti-malware' } },
            { id: 'c11', label: { de: 'C11 — Datenwiederherstellung / Backup', en: 'C11 — Data recovery', fr: 'C11 — Récupération des données' } },
            { id: 'c12', label: { de: 'C12 — Management der Netzwerk-Infrastruktur', en: 'C12 — Network infrastructure management', fr: 'C12 — Gestion de l\'infrastructure réseau' } },
            { id: 'c13', label: { de: 'C13 — Netzwerk-Monitoring & -Verteidigung', en: 'C13 — Network monitoring & defense', fr: 'C13 — Surveillance & défense réseau' } },
            { id: 'c14', label: { de: 'C14 — Security-Awareness & Schulung', en: 'C14 — Security awareness & skills training', fr: 'C14 — Sensibilisation & formation' } },
            { id: 'c15', label: { de: 'C15 — Management von Dienstleistern', en: 'C15 — Service provider management', fr: 'C15 — Gestion des prestataires' } },
            { id: 'c16', label: { de: 'C16 — Sicherheit von Anwendungssoftware', en: 'C16 — Application software security', fr: 'C16 — Sécurité des applications' } },
            { id: 'c17', label: { de: 'C17 — Incident-Response-Management', en: 'C17 — Incident response management', fr: 'C17 — Gestion de la réponse aux incidents' } },
            { id: 'c18', label: { de: 'C18 — Penetrationstests', en: 'C18 — Penetration testing', fr: 'C18 — Tests d\'intrusion' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'inventory', name: { de: 'Inventar & Datenschutz', en: 'Inventory & data protection', fr: 'Inventaire & protection des données' }, weight: 2 },
    { id: 'protect', name: { de: 'Konfiguration & Zugriff', en: 'Configuration & access', fr: 'Configuration & accès' }, weight: 2 },
    { id: 'maintain', name: { de: 'Schwachstellen & Logging', en: 'Vulnerability & logging', fr: 'Vulnérabilités & journalisation' }, weight: 2 },
    { id: 'defend', name: { de: 'Abwehr & Wiederherstellung', en: 'Defenses & recovery', fr: 'Défenses & récupération' }, weight: 2 },
    { id: 'people', name: { de: 'Menschen & Lieferkette', en: 'People & supply chain', fr: 'Personnes & chaîne d\'approvisionnement' } },
    { id: 'respond', name: { de: 'Reaktion & Tests', en: 'Response & testing', fr: 'Réponse & tests' }, weight: 2 },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'CIS-1', article: 'CIS Control 1', categoryId: 'inventory', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c1'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Inventarisierung & Kontrolle der Enterprise-Assets', en: 'Inventory & control of enterprise assets', fr: 'Inventaire & contrôle des actifs' }, criteria: [
      { de: 'Aktuelles, gepflegtes Inventar aller Enterprise-Assets als Basis aller weiteren Controls', en: 'Current, maintained inventory of all enterprise assets as the basis for all other controls', fr: 'Inventaire à jour de tous les actifs, base de tous les autres contrôles' },
    ] },
    { id: 'CIS-2', article: 'CIS Control 2', categoryId: 'inventory', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c2'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Inventarisierung & Kontrolle der Software-Assets', en: 'Inventory & control of software assets', fr: 'Inventaire & contrôle des logiciels' } },
    { id: 'CIS-3', article: 'CIS Control 3', categoryId: 'inventory', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c3'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'IT / Datenschutz', en: 'IT / data protection', fr: 'IT / protection des données' }, name: { de: 'Datenschutz (Klassifizierung, Handhabung, Verschlüsselung)', en: 'Data protection (classification, handling, encryption)', fr: 'Protection des données (classification, traitement, chiffrement)' } },
    { id: 'CIS-4', article: 'CIS Control 4', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c4'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Sichere Konfiguration von Assets & Software', en: 'Secure configuration of assets & software', fr: 'Configuration sécurisée des actifs & logiciels' } },
    { id: 'CIS-5', article: 'CIS Control 5', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:c5'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / IAM', en: 'IT / IAM', fr: 'IT / IAM' }, name: { de: 'Account-Management', en: 'Account management', fr: 'Gestion des comptes' } },
    { id: 'CIS-6', article: 'CIS Control 6', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c6'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'IT / IAM', en: 'IT / IAM', fr: 'IT / IAM' }, name: { de: 'Zugriffssteuerung & Mehr-Faktor-Authentifizierung', en: 'Access control management & MFA', fr: "Gestion des accès & MFA" } },
    { id: 'CIS-7', article: 'CIS Control 7', categoryId: 'maintain', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c7'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT-Security', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Kontinuierliches Schwachstellenmanagement', en: 'Continuous vulnerability management', fr: 'Gestion continue des vulnérabilités' } },
    { id: 'CIS-8', article: 'CIS Control 8', categoryId: 'maintain', mandatory: true, rule: { requiresAll: ['measures:c8'], requiresAny: ['roles:soc'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Security / SOC', en: 'IT security / SOC', fr: 'Sécurité IT / SOC' }, name: { de: 'Audit-Log-Management', en: 'Audit log management', fr: 'Gestion des journaux d\'audit' } },
    { id: 'CIS-10', article: 'CIS Control 10', categoryId: 'defend', mandatory: true, rule: { requiresAll: ['measures:c10'], requiresAny: ['measures:c9'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT-Security', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Malware-Abwehr & Schutz von E-Mail/Browser', en: 'Malware defenses & email/browser protection', fr: 'Défenses anti-malware & protection messagerie/navigateur' } },
    { id: 'CIS-11', article: 'CIS Control 11', categoryId: 'defend', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c11'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Datenwiederherstellung & Backup', en: 'Data recovery & backup', fr: 'Récupération & sauvegarde des données' } },
    { id: 'CIS-13', article: 'CIS Control 12–13', categoryId: 'defend', mandatory: true, rule: { requiresAll: ['measures:c13'], requiresAny: ['measures:c12'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Netzwerk / Security', en: 'Network / security', fr: 'Réseau / sécurité' }, name: { de: 'Netzwerk-Infrastruktur, -Monitoring & -Verteidigung', en: 'Network infrastructure, monitoring & defense', fr: 'Infrastructure, surveillance & défense réseau' } },
    { id: 'CIS-14', article: 'CIS Control 14', categoryId: 'people', mandatory: true, rule: { requiresAll: ['measures:c14'], requiresAny: ['roles:training'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'HR / Security', en: 'HR / security', fr: 'RH / sécurité' }, name: { de: 'Security-Awareness & Schulung', en: 'Security awareness & skills training', fr: 'Sensibilisation & formation à la sécurité' } },
    { id: 'CIS-15', article: 'CIS Control 15', categoryId: 'people', mandatory: true, rule: { requiresAll: ['measures:c15'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Einkauf / Security', en: 'Procurement / security', fr: 'Achats / sécurité' }, name: { de: 'Management von Dienstleistern', en: 'Service provider management', fr: 'Gestion des prestataires' } },
    { id: 'CIS-16', article: 'CIS Control 16', categoryId: 'people', mandatory: false, rule: { requiresAll: ['measures:c16'], requiresAny: ['systems:apps'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Entwicklung', en: 'Development', fr: 'Développement' }, name: { de: 'Sicherheit von Anwendungssoftware', en: 'Application software security', fr: 'Sécurité des applications' } },
    { id: 'CIS-17', article: 'CIS Control 17', categoryId: 'respond', weight: 2, mandatory: true, rule: { requiresAll: ['measures:c17'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT-Security', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Incident-Response-Management', en: 'Incident response management', fr: 'Gestion de la réponse aux incidents' } },
    { id: 'CIS-18', article: 'CIS Control 18', categoryId: 'respond', mandatory: false, rule: { requiresAll: ['measures:c18'], requiresAny: ['roles:review'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Security', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Penetrationstests', en: 'Penetration testing', fr: "Tests d'intrusion" } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Ltd',
    role: 'ig2',
    phase: 'baseline',
    description:
      'Mid-size company with mixed on-prem and cloud environment: 600 endpoints, Microsoft 365, Azure workloads, an Active Directory, and several in-house web applications. Targeting CIS Controls v8 IG2 maturity. Baseline assessment to plan a 12-month improvement programme.',
    systems: ['endpoints', 'servers', 'cloud', 'network', 'identity', 'apps'],
    roles: ['mgmt', 'secteam', 'tooling', 'training'],
    knownIssues:
      'Asset and software inventories partly automated but incomplete for cloud. MFA enforced for admins but not all users. Log management exists but no central SIEM. Backups run but restore not regularly tested. No formal pentest programme.',
    measures: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c13', 'c14', 'c15', 'c17'],
    measures__mat__c1: 'documented',
    measures__mat__c2: 'existing',
    measures__mat__c3: 'documented',
    measures__mat__c4: 'documented',
    measures__mat__c5: 'documented',
    measures__mat__c6: 'existing',
    measures__mat__c7: 'documented',
    measures__mat__c8: 'existing',
    measures__mat__c9: 'documented',
    measures__mat__c10: 'documented',
    measures__mat__c11: 'existing',
    measures__mat__c13: 'existing',
    measures__mat__c14: 'documented',
    measures__mat__c15: 'existing',
    measures__mat__c17: 'existing',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'IG3 — hohe Reife', en: 'IG3 — high maturity', fr: 'IG3 — maturité élevée' },
      description: {
        de: 'Reifes Security-Programm mit nahezu vollständigen, getesteten Controls.',
        en: 'Mature security programme with near-complete, tested controls.',
        fr: 'Programme de sécurité mature avec contrôles quasi complets et testés.',
      },
      answers: {
        entityName: 'Northern Star Systems',
        role: 'ig3',
        phase: 'periodic',
        description:
          'Large enterprise with a dedicated SOC, EDR and SIEM. Automated asset/software inventories, enforced MFA, continuous vulnerability management, tested backups, network segmentation, mature IR and a regular pentest programme.',
        systems: ['endpoints', 'servers', 'cloud', 'network', 'identity', 'apps'],
        roles: ['mgmt', 'secteam', 'tooling', 'soc', 'training', 'review'],
        knownIssues:
          'Minor coverage gaps for newly acquired subsidiary still being integrated. Pentest findings tracked to closure.',
        measures: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18'],
        measures__mat__c1: 'audited',
        measures__mat__c2: 'documented',
        measures__mat__c3: 'documented',
        measures__mat__c4: 'documented',
        measures__mat__c5: 'documented',
        measures__mat__c6: 'documented',
        measures__mat__c7: 'documented',
        measures__mat__c8: 'documented',
        measures__mat__c9: 'documented',
        measures__mat__c10: 'documented',
        measures__mat__c11: 'documented',
        measures__mat__c12: 'documented',
        measures__mat__c13: 'documented',
        measures__mat__c14: 'documented',
        measures__mat__c15: 'documented',
        measures__mat__c16: 'documented',
        measures__mat__c17: 'audited',
        measures__mat__c18: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'IG1 erreicht — IG2 im Aufbau', en: 'IG1 reached — IG2 developing', fr: 'IG1 atteint — IG2 en cours' },
      description: {
        de: 'Basis-Cyberhygiene weitgehend umgesetzt, erweiterte Controls offen.',
        en: 'Essential cyber hygiene largely in place, enhanced controls open.',
        fr: 'Hygiène cyber essentielle largement en place, contrôles renforcés ouverts.',
      },
      answers: {
        entityName: 'Coastal Trading Ltd',
        role: 'ig1',
        phase: 'gap',
        description:
          'Small business with basic IT hygiene. Inventories drafted, antivirus and backups in place, MFA partial. No central logging, no vulnerability scanning, no IR plan.',
        systems: ['endpoints', 'cloud', 'identity'],
        roles: ['mgmt', 'secteam'],
        knownIssues:
          'No continuous vulnerability management. No central log management. No incident response plan. Backups not restore-tested.',
        measures: ['c1', 'c2', 'c4', 'c5', 'c6', 'c10', 'c11', 'c14'],
        measures__mat__c1: 'documented',
        measures__mat__c2: 'existing',
        measures__mat__c4: 'existing',
        measures__mat__c5: 'documented',
        measures__mat__c6: 'existing',
        measures__mat__c10: 'documented',
        measures__mat__c11: 'existing',
        measures__mat__c14: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum strukturierte Controls, viele Basis-Lücken.',
        en: 'Barely structured controls with many baseline gaps.',
        fr: 'Contrôles peu structurés, nombreuses lacunes de base.',
      },
      answers: {
        entityName: 'Harbour Shop Co',
        role: 'ig1',
        phase: 'baseline',
        description:
          'Very small organisation at the start of its security journey. No asset inventory, ad-hoc patching, shared accounts, antivirus only on some machines.',
        systems: ['endpoints', 'cloud'],
        roles: ['mgmt'],
        knownIssues:
          'No inventory, no secure configuration, no MFA, no logging, no backups tested, no IR plan, no awareness training.',
        measures: ['c10'],
        measures__mat__c10: 'existing',
      },
    },
  ],
};
