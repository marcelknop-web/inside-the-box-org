import type { StandardProfile } from './types';

// ── PCI-DSS profile ─────────────────────────────────────────────
// PCI DSS v4.0.1 — Payment Card Industry Data Security Standard.
// Assessed against the 12 core requirements grouped into the six
// control objectives. The SAQ / RoC scope (merchant level, validation
// type) frames the expected breadth. The engine assesses the
// requirements below strictly against supplied evidence (no invented
// findings — Data Integrity Policy).

export const PCIDSS_PROFILE: StandardProfile = {
  id: 'pcidss',
  name: 'PCI-DSS',
  icon: 'CreditCard',
  available: true,
  fullName: {
    de: 'PCI DSS v4.0.1',
    en: 'PCI DSS v4.0.1',
    fr: 'PCI DSS v4.0.1',
  },
  regulation: {
    de: 'Payment Card Industry Data Security Standard v4.0.1',
    en: 'Payment Card Industry Data Security Standard v4.0.1',
    fr: 'Payment Card Industry Data Security Standard v4.0.1',
  },
  description: {
    de: 'Readiness-Workflow für PCI DSS v4.0.1 entlang der 12 Kernanforderungen und sechs Kontrollziele für die Karteninhaberdaten-Umgebung (CDE).',
    en: 'Readiness workflow for PCI DSS v4.0.1 along the 12 core requirements and six control objectives for the cardholder data environment (CDE).',
    fr: "Flux de préparation PCI DSS v4.0.1 selon les 12 exigences et six objectifs de contrôle pour l'environnement des données de cartes (CDE).",
  },
  intake: [
    {
      title: { de: 'Organisation & Bewertungsobjekt', en: 'Organisation & assessment object', fr: "Organisation & objet d'évaluation" },
      subtitle: {
        de: 'Welche Karteninhaberdaten-Umgebung (CDE) wird gegen PCI DSS bewertet?',
        en: 'Which cardholder data environment (CDE) is assessed against PCI DSS?',
        fr: 'Quel environnement de données de cartes (CDE) est évalué par rapport à PCI DSS ?',
      },
      info: {
        de: 'Der Validierungstyp (SAQ-Typ bzw. RoC) bestimmt den anwendbaren Umfang. Reduktion durch Tokenisierung/Outsourcing verringert den Scope.',
        en: 'The validation type (SAQ type or RoC) determines the applicable scope. Tokenisation/outsourcing reduces scope.',
        fr: "Le type de validation (type SAQ ou RoC) détermine le périmètre applicable. La tokenisation/externalisation réduit le périmètre.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / CDE', en: 'Organisation / CDE', fr: 'Organisation / CDE' },
          placeholder: { de: 'z. B. Muster GmbH, Webshop-Zahlungsumgebung', en: 'e.g. Acme Ltd, e-commerce payment environment', fr: "p. ex. Exemple SARL, environnement de paiement e-commerce" },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Validierungstyp (Ziel)', en: 'Validation type (target)', fr: 'Type de validation (cible)' },
          options: [
            { id: 'saqa', icon: '🟢', label: { de: 'SAQ A — vollständig ausgelagert', en: 'SAQ A — fully outsourced', fr: 'SAQ A — entièrement externalisé' } },
            { id: 'saqaep', icon: '🟡', label: { de: 'SAQ A-EP — E-Commerce, teils selbst', en: 'SAQ A-EP — e-commerce, partly self-hosted', fr: 'SAQ A-EP — e-commerce, partiellement interne' } },
            { id: 'saqd', icon: '🔴', label: { de: 'SAQ D / RoC — vollständiger Umfang', en: 'SAQ D / RoC — full scope', fr: 'SAQ D / RoC — périmètre complet' } },
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
            { id: 'periodic', label: { de: 'Jährliche Re-Validierung', en: 'Annual re-validation', fr: 'Re-validation annuelle' } },
            { id: 'improvement', label: { de: 'Verbesserungsprogramm', en: 'Improvement programme', fr: "Programme d'amélioration" } },
          ],
        },
      ],
    },
    {
      title: { de: 'Umgebung & Datenflüsse', en: 'Environment & data flows', fr: 'Environnement & flux de données' },
      info: {
        de: 'Je konkreter die Beschreibung der CDE und Kartendatenflüsse, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description of the CDE and card data flows, the sharper the AI assessment.',
        fr: "Plus la description de la CDE et des flux de données de cartes est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der CDE, Systeme & Kartendatenflüsse', en: 'Description of the CDE, systems & card data flows', fr: 'Description de la CDE, systèmes & flux de données de cartes' },
          placeholder: { de: 'Zahlungswege, Speicherung/Übertragung von PAN, Tokenisierung, Dienstleister (PSP), Netzsegmentierung …', en: 'Payment channels, storage/transmission of PAN, tokenisation, service providers (PSP), network segmentation …', fr: 'Canaux de paiement, stockage/transmission du PAN, tokenisation, prestataires (PSP), segmentation réseau …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Komponenten der CDE', en: 'Components of the CDE', fr: 'Composants de la CDE' },
          options: [
            { id: 'ecommerce', icon: '🛒', label: { de: 'E-Commerce / Webshop', en: 'E-commerce / web shop', fr: 'E-commerce / boutique web' } },
            { id: 'pos', icon: '💳', label: { de: 'POS / Kartenterminals', en: 'POS / card terminals', fr: 'TPV / terminaux de carte' } },
            { id: 'storage', icon: '🗄️', label: { de: 'Speicherung von Kartendaten (PAN)', en: 'Storage of card data (PAN)', fr: 'Stockage de données de cartes (PAN)' } },
            { id: 'network', icon: '🌐', label: { de: 'Netzwerk & Segmentierung', en: 'Network & segmentation', fr: 'Réseau & segmentation' } },
            { id: 'psp', icon: '🤝', label: { de: 'Zahlungsdienstleister (PSP) / Tokenisierung', en: 'Payment service provider (PSP) / tokenisation', fr: 'Prestataire de paiement (PSP) / tokenisation' } },
            { id: 'cloud', icon: '☁️', label: { de: 'Cloud / Hosting', en: 'Cloud / hosting', fr: 'Cloud / hébergement' } },
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
            { id: 'segmentation', icon: '🧱', label: { de: 'Netzsegmentierung zur Scope-Reduktion', en: 'Network segmentation for scope reduction', fr: 'Segmentation réseau pour réduire le périmètre' } },
            { id: 'monitoring', icon: '📡', label: { de: 'Logging / Monitoring (SIEM)', en: 'Logging / monitoring (SIEM)', fr: 'Journalisation / surveillance (SIEM)' } },
            { id: 'scanning', icon: '🔎', label: { de: 'Vulnerability-Scans (ASV) / Pentests', en: 'Vulnerability scans (ASV) / pentests', fr: 'Scans de vulnérabilités (ASV) / pentests' } },
            { id: 'review', icon: '📋', label: { de: 'Regelmäßige Reviews / Tests', en: 'Regular reviews / testing', fr: 'Revues / tests réguliers' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. PAN unverschlüsselt gespeichert, kein MFA, Default-Passwörter, keine ASV-Scans, keine Segmentierung …', en: 'e.g. PAN stored unencrypted, no MFA, default passwords, no ASV scans, no segmentation …', fr: "p. ex. PAN stocké en clair, pas de MFA, mots de passe par défaut, pas de scans ASV …" },
        },
      ],
    },
    {
      title: { de: 'Umgesetzte Anforderungen', en: 'Implemented requirements', fr: 'Exigences en place' },
      info: {
        de: 'Nur ankreuzen, was nachweislich existiert. Die KI erfindet keine Nachweise.',
        en: 'Only tick what verifiably exists. The AI invents no evidence.',
        fr: "Ne cochez que ce qui existe réellement. L'IA n'invente aucune preuve.",
      },
      fields: [
        {
          id: 'measures',
          type: 'maturity-multi',
          label: { de: 'PCI DSS Kernanforderungen (1–12)', en: 'PCI DSS core requirements (1–12)', fr: 'Exigences PCI DSS (1–12)' },
          help: { de: 'Pro ausgewählter Anforderung den Reifegrad angeben.', en: 'Specify the maturity for each selected requirement.', fr: 'Indiquez la maturité de chaque exigence.' },
          options: [
            { id: 'r1', label: { de: 'R1 — Netzwerksicherheitskontrollen (Firewalls)', en: 'R1 — Network security controls (firewalls)', fr: 'R1 — Contrôles de sécurité réseau (pare-feux)' } },
            { id: 'r2', label: { de: 'R2 — Sichere Konfiguration (keine Defaults)', en: 'R2 — Secure configuration (no defaults)', fr: 'R2 — Configuration sécurisée (pas de valeurs par défaut)' } },
            { id: 'r3', label: { de: 'R3 — Schutz gespeicherter Kontodaten', en: 'R3 — Protect stored account data', fr: 'R3 — Protection des données de comptes stockées' } },
            { id: 'r4', label: { de: 'R4 — Verschlüsselung bei Übertragung', en: 'R4 — Encryption in transit', fr: 'R4 — Chiffrement en transit' } },
            { id: 'r5', label: { de: 'R5 — Malware-Schutz', en: 'R5 — Malware protection', fr: 'R5 — Protection anti-malware' } },
            { id: 'r6', label: { de: 'R6 — Sichere Systeme & Software', en: 'R6 — Secure systems & software', fr: 'R6 — Systèmes & logiciels sécurisés' } },
            { id: 'r7', label: { de: 'R7 — Zugriffsbeschränkung (Need-to-know)', en: 'R7 — Restrict access (need-to-know)', fr: 'R7 — Restriction d\'accès (besoin d\'en connaître)' } },
            { id: 'r8', label: { de: 'R8 — Identifizierung & Authentifizierung (MFA)', en: 'R8 — Identification & authentication (MFA)', fr: 'R8 — Identification & authentification (MFA)' } },
            { id: 'r9', label: { de: 'R9 — Physischer Zugriffsschutz', en: 'R9 — Physical access controls', fr: 'R9 — Contrôles d\'accès physique' } },
            { id: 'r10', label: { de: 'R10 — Logging & Monitoring', en: 'R10 — Logging & monitoring', fr: 'R10 — Journalisation & surveillance' } },
            { id: 'r11', label: { de: 'R11 — Tests der Sicherheit (Scans, Pentests)', en: 'R11 — Test security (scans, pentests)', fr: 'R11 — Tests de sécurité (scans, pentests)' } },
            { id: 'r12', label: { de: 'R12 — Informationssicherheits-Policy & Programm', en: 'R12 — Information security policy & programme', fr: 'R12 — Politique & programme de sécurité' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'network', name: { de: 'Sicheres Netzwerk', en: 'Secure network', fr: 'Réseau sécurisé' }, weight: 2 },
    { id: 'data', name: { de: 'Schutz von Kontodaten', en: 'Protect account data', fr: 'Protection des données de comptes' }, weight: 2 },
    { id: 'vuln', name: { de: 'Schwachstellen-Management', en: 'Vulnerability management', fr: 'Gestion des vulnérabilités' }, weight: 2 },
    { id: 'access', name: { de: 'Zugriffssteuerung', en: 'Access control', fr: 'Contrôle d\'accès' }, weight: 2 },
    { id: 'monitor', name: { de: 'Monitoring & Tests', en: 'Monitoring & testing', fr: 'Surveillance & tests' }, weight: 2 },
    { id: 'policy', name: { de: 'Sicherheitsrichtlinie', en: 'Security policy', fr: 'Politique de sécurité' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'PCI-1', article: 'PCI DSS Req. 1', categoryId: 'network', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r1'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Netzwerk / Security', en: 'Network / security', fr: 'Réseau / sécurité' }, name: { de: 'Netzwerksicherheitskontrollen installieren & pflegen', en: 'Install & maintain network security controls', fr: 'Installer & maintenir des contrôles de sécurité réseau' }, criteria: [
      { de: 'Firewalls/Router-Konfiguration schützt die CDE; eingehender/ausgehender Verkehr ist beschränkt', en: 'Firewall/router configuration protects the CDE; inbound/outbound traffic is restricted', fr: 'La configuration pare-feu/routeur protège la CDE ; le trafic est restreint' },
    ] },
    { id: 'PCI-2', article: 'PCI DSS Req. 2', categoryId: 'network', mandatory: true, rule: { requiresAll: ['measures:r2'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT', en: 'IT', fr: 'IT' }, name: { de: 'Sichere Konfigurationen anwenden (keine Defaults)', en: 'Apply secure configurations (no defaults)', fr: 'Appliquer des configurations sécurisées (pas de valeurs par défaut)' } },
    { id: 'PCI-3', article: 'PCI DSS Req. 3', categoryId: 'data', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r3'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Security / IT', en: 'Security / IT', fr: 'Sécurité / IT' }, name: { de: 'Gespeicherte Kontodaten schützen', en: 'Protect stored account data', fr: 'Protéger les données de comptes stockées' } },
    { id: 'PCI-4', article: 'PCI DSS Req. 4', categoryId: 'data', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r4'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Security / IT', en: 'Security / IT', fr: 'Sécurité / IT' }, name: { de: 'Karteninhaberdaten bei Übertragung verschlüsseln', en: 'Encrypt cardholder data in transmission', fr: 'Chiffrer les données de cartes en transit' } },
    { id: 'PCI-5', article: 'PCI DSS Req. 5', categoryId: 'vuln', mandatory: true, rule: { requiresAll: ['measures:r5'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Security', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Schutz vor Malware', en: 'Protect against malware', fr: 'Protection contre les logiciels malveillants' } },
    { id: 'PCI-6', article: 'PCI DSS Req. 6', categoryId: 'vuln', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r6'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Entwicklung / IT', en: 'Development / IT', fr: 'Développement / IT' }, name: { de: 'Sichere Systeme & Software entwickeln & pflegen', en: 'Develop & maintain secure systems & software', fr: 'Développer & maintenir des systèmes & logiciels sécurisés' } },
    { id: 'PCI-7', article: 'PCI DSS Req. 7', categoryId: 'access', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r7'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / IAM', en: 'IT / IAM', fr: 'IT / IAM' }, name: { de: 'Zugriff nach Need-to-know beschränken', en: 'Restrict access by need-to-know', fr: "Restreindre l'accès selon le besoin d'en connaître" } },
    { id: 'PCI-8', article: 'PCI DSS Req. 8', categoryId: 'access', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r8'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'IT / IAM', en: 'IT / IAM', fr: 'IT / IAM' }, name: { de: 'Benutzer identifizieren & authentifizieren (MFA)', en: 'Identify users & authenticate access (MFA)', fr: 'Identifier les utilisateurs & authentifier l\'accès (MFA)' } },
    { id: 'PCI-9', article: 'PCI DSS Req. 9', categoryId: 'access', mandatory: true, rule: { requiresAll: ['measures:r9'], riskLikelihood: 2, riskImpact: 4 }, owner: { de: 'Facility / Security', en: 'Facility / security', fr: 'Facility / sécurité' }, name: { de: 'Physischen Zugriff auf Kontodaten beschränken', en: 'Restrict physical access to account data', fr: "Restreindre l'accès physique aux données de comptes" } },
    { id: 'PCI-10', article: 'PCI DSS Req. 10', categoryId: 'monitor', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r10'], requiresAny: ['roles:monitoring'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Security / SOC', en: 'IT security / SOC', fr: 'Sécurité IT / SOC' }, name: { de: 'Zugriffe protokollieren & überwachen', en: 'Log & monitor all access', fr: 'Journaliser & surveiller tous les accès' } },
    { id: 'PCI-11', article: 'PCI DSS Req. 11', categoryId: 'monitor', weight: 2, mandatory: true, rule: { requiresAll: ['measures:r11'], requiresAny: ['roles:scanning'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Security', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Sicherheit von Systemen & Netzwerken regelmäßig testen', en: 'Test security of systems & networks regularly', fr: 'Tester régulièrement la sécurité des systèmes & réseaux' } },
    { id: 'PCI-12', article: 'PCI DSS Req. 12', categoryId: 'policy', mandatory: true, rule: { requiresAll: ['measures:r12'], requiresAny: ['roles:mgmt'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'CISO / Management', en: 'CISO / management', fr: 'CISO / direction' }, name: { de: 'Informationssicherheit durch Policies & Programme unterstützen', en: 'Support information security with policies & programmes', fr: "Soutenir la sécurité de l'information par des politiques & programmes" } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Retail GmbH',
    role: 'saqaep',
    phase: 'baseline',
    description:
      'E-commerce merchant processing card payments via a redirect to a PSP, with some custom payment pages. Cloud-hosted web environment, no PAN stored, tokenisation via the PSP. Targeting SAQ A-EP. Readiness assessment ahead of annual validation.',
    systems: ['ecommerce', 'network', 'psp', 'cloud'],
    roles: ['mgmt', 'secteam', 'monitoring'],
    knownIssues:
      'Network security controls in place but firewall rules not reviewed every 6 months. MFA enforced for admins but not all remote access. No ASV scans scheduled. Logging exists but retention/review inconsistent. No annual pentest.',
    measures: ['r1', 'r2', 'r4', 'r5', 'r6', 'r7', 'r8', 'r10', 'r12'],
    measures__mat__r1: 'documented',
    measures__mat__r2: 'existing',
    measures__mat__r4: 'documented',
    measures__mat__r5: 'documented',
    measures__mat__r6: 'existing',
    measures__mat__r7: 'documented',
    measures__mat__r8: 'existing',
    measures__mat__r10: 'existing',
    measures__mat__r12: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'SAQ D / RoC — audit-ready', en: 'SAQ D / RoC — audit-ready', fr: 'SAQ D / RoC — prêt pour l\'audit' },
      description: {
        de: 'Vollständig umgesetztes, getestetes Kontrollsystem über die gesamte CDE.',
        en: 'Fully implemented, tested control set across the entire CDE.',
        fr: 'Ensemble de contrôles complet et testé sur toute la CDE.',
      },
      answers: {
        entityName: 'Northern Star Payments',
        role: 'saqd',
        phase: 'periodic',
        description:
          'Large merchant/service provider storing and processing card data in a segmented CDE. Encryption at rest and in transit, MFA everywhere, ASV scans quarterly, annual pentest, full logging with SIEM, formal security programme.',
        systems: ['ecommerce', 'pos', 'storage', 'network', 'psp', 'cloud'],
        roles: ['mgmt', 'secteam', 'segmentation', 'monitoring', 'scanning', 'review'],
        knownIssues:
          'Minor findings from last ASV scan remediated within the quarter. Segmentation testing performed annually.',
        measures: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12'],
        measures__mat__r1: 'audited',
        measures__mat__r2: 'documented',
        measures__mat__r3: 'documented',
        measures__mat__r4: 'documented',
        measures__mat__r5: 'documented',
        measures__mat__r6: 'documented',
        measures__mat__r7: 'documented',
        measures__mat__r8: 'documented',
        measures__mat__r9: 'documented',
        measures__mat__r10: 'audited',
        measures__mat__r11: 'documented',
        measures__mat__r12: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Im Aufbau', en: 'Developing', fr: 'En cours' },
      description: {
        de: 'Kernanforderungen teils umgesetzt, Tests und Reviews lückenhaft.',
        en: 'Core requirements partly in place, testing and reviews patchy.',
        fr: 'Exigences principales partiellement en place, tests et revues lacunaires.',
      },
      answers: {
        entityName: 'Coastal Shop Ltd',
        role: 'saqaep',
        phase: 'gap',
        description:
          'Mid-size e-commerce merchant using a PSP redirect. Basic firewalls and antivirus, partial MFA. No ASV scans, inconsistent logging, no formal security policy programme.',
        systems: ['ecommerce', 'network', 'psp'],
        roles: ['mgmt', 'secteam'],
        knownIssues:
          'Firewall rules not reviewed. No ASV scans. No annual pentest. Logging not centrally reviewed. Security policy outdated.',
        measures: ['r1', 'r2', 'r4', 'r5', 'r7', 'r8'],
        measures__mat__r1: 'documented',
        measures__mat__r2: 'existing',
        measures__mat__r4: 'documented',
        measures__mat__r5: 'existing',
        measures__mat__r7: 'existing',
        measures__mat__r8: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum strukturierte Kontrollen, viele kritische Lücken in der CDE.',
        en: 'Barely structured controls with many critical CDE gaps.',
        fr: 'Contrôles peu structurés, nombreuses lacunes critiques dans la CDE.',
      },
      answers: {
        entityName: 'Harbour Store Co',
        role: 'saqd',
        phase: 'baseline',
        description:
          'Small merchant storing card numbers in a spreadsheet, no segmentation, shared logins, antivirus only on some machines. At the very start of its PCI journey.',
        systems: ['ecommerce', 'storage'],
        roles: ['mgmt'],
        knownIssues:
          'PAN stored unencrypted. Default passwords in use. No MFA. No logging. No ASV scans. No security policy. No segmentation.',
        measures: ['r5'],
        measures__mat__r5: 'existing',
      },
    },
  ],
};
