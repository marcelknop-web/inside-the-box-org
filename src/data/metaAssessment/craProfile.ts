import type { StandardProfile } from './types';

// ── CRA profile ─────────────────────────────────────────────────
// Regulation (EU) 2024/1689 — Cyber Resilience Act.
// Covers products with digital elements (PDEs): hardware and software.
// Intake captures manufacturer context, product type, roles and
// implemented measures; the AI assesses the requirements below
// strictly against the supplied evidence (no invented findings).

export const CRA_PROFILE: StandardProfile = {
  id: 'cra',
  name: 'CRA',
  icon: 'ShieldCheck',
  available: true,
  fullName: {
    de: 'CRA — Cyber Resilience Act (EU) 2024/1689',
    en: 'CRA — Cyber Resilience Act (EU) 2024/1689',
    fr: 'CRA — Cyber Resilience Act (UE) 2024/1689',
  },
  regulation: {
    de: 'Verordnung (EU) 2024/1689',
    en: 'Regulation (EU) 2024/1689',
    fr: 'Règlement (UE) 2024/1689',
  },
  description: {
    de: 'Konformitätsprüfung für Produkte mit digitalen Elementen nach dem Cyber Resilience Act — sichere Produktgestaltung, Schwachstellenmanagement, Meldewesen.',
    en: 'Conformity assessment for products with digital elements under the Cyber Resilience Act — secure-by-design, vulnerability handling, reporting.',
    fr: "Évaluation de conformité pour les produits comportant des éléments numériques selon le Cyber Resilience Act — sécurité dès la conception, gestion des vulnérabilités, notification.",
  },
  intake: [
    {
      title: { de: 'Hersteller & Produkt', en: 'Manufacturer & product', fr: 'Fabricant & produit' },
      subtitle: {
        de: 'Wer stellt das Produkt her und welche Klasse gehört es an?',
        en: 'Who manufactures the product and what class does it belong to?',
        fr: 'Qui fabrique le produit et à quelle classe appartient-il ?',
      },
      info: {
        de: 'Die Produktklasse (wichtig / kritisch) bestimmt Pflichtumfang und Konformitätsbewertung (Modul A, B, C, H).',
        en: 'The product class (important / critical) drives the scope of obligations and conformity assessment (Module A, B, C, H).',
        fr: "La classe du produit (important / critique) détermine l'étendue des obligations et l'évaluation de conformité (module A, B, C, H).",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Hersteller / Wirtschaftsakteur', en: 'Manufacturer / economic operator', fr: 'Fabricant / opérateur économique' },
          placeholder: { de: 'z. B. Muster IoT GmbH', en: 'e.g. Acme IoT Ltd', fr: "p. ex. Exemple IoT SARL" },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle im Vertriebsprozess', en: 'Role in the supply chain', fr: 'Rôle dans la chaîne' },
          options: [
            { id: 'manufacturer', icon: '🏭', label: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, desc: { de: 'Entwickelt und vertreibt das PDE', en: 'Develops and places the PDE on the market', fr: 'Développe et met le PDE sur le marché' } },
            { id: 'importer', icon: '📦', label: { de: 'Einführer', en: 'Importer', fr: 'Importateur' }, desc: { de: 'Bringt ein PDE aus einem Drittland in die EU', en: 'Brings a PDE from a third country into the EU', fr: 'Introduit un PDE d\'un pays tiers dans l\'UE' } },
            { id: 'distributor', icon: '🚚', label: { de: 'Händler', en: 'Distributor', fr: 'Distributeur' }, desc: { de: 'Liefert ein PDE im Vertriebsprozess', en: 'Supplies a PDE in the distribution chain', fr: 'Fournit un PDE dans la chaîne de distribution' } },
          ],
        },
        {
          id: 'productClass',
          type: 'single',
          required: true,
          label: { de: 'Produktklasse', en: 'Product class', fr: 'Classe du produit' },
          options: [
            { id: 'important', label: { de: 'Wichtiges PDE (Anhang III)', en: 'Important PDE (Annex III)', fr: 'PDE important (Annexe III)' }, desc: { de: 'z. B. Browser, Betriebssysteme, smarte Heimgeräte', en: 'e.g. browsers, OS, smart home devices', fr: 'p. ex. navigateurs, OS, objets connectés domestiques' } },
            { id: 'critical', label: { de: 'Kritisches PDE (Anhang IV)', en: 'Critical PDE (Annex IV)', fr: 'PDE critique (Annexe IV)' }, desc: { de: 'z. B. Smart-Card-Reader, Sichere Elemente, Industrie-Steuerungen', en: 'e.g. smart card readers, secure elements, industrial controls', fr: 'p. ex. lecteurs de cartes, éléments sécurisés, contrôles industriels' } },
            { id: 'default', label: { de: 'Sonstiges PDE', en: 'Other PDE', fr: 'Autre PDE' }, desc: { de: 'Standard-CRA-Anforderungen ohne besondere Klassifizierung', en: 'Standard CRA requirements without special classification', fr: 'Exigences CRA standard sans classification spéciale' } },
          ],
        },
        {
          id: 'conformityModule',
          type: 'single',
          required: true,
          label: { de: 'Konformitätsbewertungsmodul', en: 'Conformity assessment module', fr: 'Module d\'évaluation de conformité' },
          options: [
            { id: 'a', label: { de: 'Modul A (interne Fertigungskontrolle)', en: 'Module A (internal production control)', fr: 'Module A (contrôle interne de la production)' } },
            { id: 'b', label: { de: 'Modul B (EU-Typprüfung)', en: 'Module B (EU-type examination)', fr: 'Module B (examen UE de type)' } },
            { id: 'h', label: { de: 'Modul H (vollständige Qualitätssicherung)', en: 'Module H (full quality assurance)', fr: 'Module H (assurance qualité complète)' } },
            { id: 'unsure', label: { de: 'Noch unklar', en: 'Unclear yet', fr: 'Encore incertain' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Produktkontext & Lieferkette', en: 'Product context & supply chain', fr: 'Contexte produit & chaîne' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung des PDE, Funktionsumfang & IT-Landschaft', en: 'Description of the PDE, feature scope & IT landscape', fr: 'Description du PDE, périmètre fonctionnel & SI' },
          placeholder: { de: 'Produkttyp, Schnittstellen, Cloud-Backend, kritische Funktionen, Nutzerdaten, Update-Mechanismus …', en: 'Product type, interfaces, cloud backend, critical functions, user data, update mechanism …', fr: 'Type de produit, interfaces, backend cloud, fonctions critiques, données utilisateur, mécanisme de mise à jour …' },
        },
        {
          id: 'supplyChain',
          type: 'multi',
          label: { de: 'Wesentliche Lieferkettenglieder', en: 'Key supply chain elements', fr: 'Maillons clés de la chaîne' },
          options: [
            { id: 'hwcomponents', icon: '🔩', label: { de: 'Hardware-Komponenten / BOM', en: 'Hardware components / BOM', fr: 'Composants matériels / nomenclature' } },
            { id: 'opensource', icon: '📂', label: { de: 'Open-Source / Drittanbieter-Software', en: 'Open source / third-party software', fr: 'Logiciel open source / tiers' } },
            { id: 'cloud', icon: '☁️', label: { de: 'Cloud-Backend / SaaS', en: 'Cloud backend / SaaS', fr: 'Backend cloud / SaaS' } },
            { id: 'updates', icon: '🔄', label: { de: 'Update-/Patch-Infrastruktur', en: 'Update / patch infrastructure', fr: 'Infrastructure de mise à jour' } },
            { id: 'manufacturing', icon: '🏭', label: { de: 'Fertigungs-/Vertragshersteller', en: 'Manufacturing / contract manufacturer', fr: 'Fabrication / sous-traitant' } },
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
            { id: 'cso', icon: '🔐', label: { de: 'Benannter Cybersecurity-Verantwortlicher', en: 'Designated cybersecurity responsible', fr: 'Responsable cybersécurité désigné' } },
            { id: 'vulnmgmt', icon: '🐞', label: { de: 'Vulnerability-Handling-Team', en: 'Vulnerability handling team', fr: "Équipe de gestion des vulnérabilités" } },
            { id: 'qa', icon: '✅', label: { de: 'QA / Security-Testing vor Markteintritt', en: 'QA / security testing before market placement', fr: 'QA / tests de sécurité avant mise sur le marché' } },
            { id: 'support', icon: '🎧', label: { de: 'Support / Kundenkommunikation', en: 'Support / customer communication', fr: 'Support / communication client' } },
            { id: 'legal', icon: '⚖️', label: { de: 'Recht / Compliance / CE-Prozess', en: 'Legal / compliance / CE process', fr: 'Juridique / conformité / processus CE' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. kein SBOM, kein sicherer Boot, keine automatisierten Sicherheitstests, kein Vulnerability-Reporting-Kanal, keine CE-Konformitätserklärung …', en: 'e.g. no SBOM, no secure boot, no automated security testing, no vulnerability reporting channel, no EU DoC …', fr: 'p. ex. pas de SBOM, pas de secure boot, pas de tests automatisés, pas de canal de signalement, pas de déclaration UE de conformité …' },
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
          label: { de: 'CRA-Kernanforderungen', en: 'CRA core requirements', fr: 'Exigences fondamentales CRA' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'securebydesign', label: { de: 'Sichere Produktgestaltung & Default-Einstellungen', en: 'Secure product design & default settings', fr: 'Conception sécurisée & paramètres par défaut' } },
            { id: 'riskassessment', label: { de: 'Risikobewertung vor Markteintritt', en: 'Risk assessment before market placement', fr: "Évaluation des risques avant mise sur le marché" } },
            { id: 'accesscontrol', label: { de: 'Zugriffskontrolle & Authentifizierung', en: 'Access control & authentication', fr: "Contrôle d'accès & authentification" } },
            { id: 'confidentiality', label: { de: 'Vertraulichkeit / Verschlüsselung', en: 'Confidentiality / encryption', fr: 'Confidentialité / chiffrement' } },
            { id: 'integrity', label: { de: 'Integritätsschutz & Secure Boot / Signatur', en: 'Integrity protection & secure boot / signing', fr: 'Protection intégrité & secure boot / signature' } },
            { id: 'availability', label: { de: 'Verfügbarkeit / Widerstandsfähigkeit (DoS)', en: 'Availability / resilience (DoS)', fr: 'Disponibilité / résilience (DoS)' } },
            { id: 'logging', label: { de: 'Logging & Monitoring', en: 'Logging & monitoring', fr: 'Journalisation & surveillance' } },
            { id: 'updates', label: { de: 'Sicherheitsupdates & Patch-Management', en: 'Security updates & patch management', fr: 'Mises à jour de sécurité & gestion des correctifs' } },
            { id: 'vulnprocess', label: { de: 'Schwachstellenmanagement & Coordinated Disclosure', en: 'Vulnerability management & coordinated disclosure', fr: 'Gestion des vulnérabilités & divulgation coordonnée' } },
            { id: 'reporting', label: { de: 'Meldepflichten (ENISA / 24h / Nutzer)', en: 'Reporting obligations (ENISA / 24h / users)', fr: 'Obligations de notification (ENISA / 24h / utilisateurs)' } },
            { id: 'documentation', label: { de: 'Technische Dokumentation & EU-DoC', en: 'Technical documentation & EU DoC', fr: 'Documentation technique & déclaration UE' } },
            { id: 'sbom', label: { de: 'SBOM / Software-Bill-of-Materials', en: 'SBOM / software bill of materials', fr: 'SBOM / nomenclature logicielle' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'design', name: { de: 'Sichere Gestaltung', en: 'Secure design', fr: 'Conception sécurisée' }, weight: 2 },
    { id: 'protection', name: { de: 'Schutzmaßnahmen', en: 'Protection controls', fr: 'Mesures de protection' }, weight: 2 },
    { id: 'operations', name: { de: 'Betrieb & Updates', en: 'Operations & updates', fr: 'Exploitation & mises à jour' } },
    { id: 'vuln', name: { de: 'Schwachstellenmanagement', en: 'Vulnerability management', fr: 'Gestion des vulnérabilités' }, weight: 2 },
    { id: 'reporting', name: { de: 'Meldewesen & Dokumentation', en: 'Reporting & documentation', fr: 'Notification & documentation' } },
  ],
  maturity: { enabled: true, target: 3 },
  requirements: [
    { id: 'CR-D1', article: 'Art. 10(1) / Annex I.1', categoryId: 'design', weight: 2, mandatory: true, rule: { requiresAll: ['measures:securebydesign'], requiresAny: ['roles:cso'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Produktmanagement / Entwicklung', en: 'Product management / engineering', fr: 'Produit / ingénierie' }, name: { de: 'Sichere Produktgestaltung & Default-Einstellungen', en: 'Secure product design & default settings', fr: 'Conception sécurisée & paramètres par défaut' }, criteria: [
      { de: 'Produkt ist mit angemessenen Sicherheitsmerkmalen entworfen und mit sicheren Standardeinstellungen ausgeliefert', en: 'Product is designed with appropriate security features and delivered with secure default settings', fr: 'Produit conçu avec des fonctionnalités de sécurité appropriées et livré avec des paramètres par défaut sécurisés' },
    ] },
    { id: 'CR-D2', article: 'Art. 10(1) / Annex I.1(a)', categoryId: 'design', mandatory: true, rule: { requiresAll: ['measures:riskassessment'], requiresAny: ['roles:qa'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Risikomanagement / QA', en: 'Risk management / QA', fr: 'Gestion des risques / QA' }, name: { de: 'Risikobewertung vor Markteintritt', en: 'Risk assessment before market placement', fr: "Évaluation des risques avant mise sur le marché" } },
    { id: 'CR-P1', article: 'Art. 10(2) / Annex I.2(a)', categoryId: 'protection', weight: 2, mandatory: true, rule: { requiresAll: ['measures:accesscontrol'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Entwicklung / IT-Sicherheit', en: 'Engineering / IT security', fr: 'Ingénierie / sécurité IT' }, name: { de: 'Zugriffskontrolle & Authentifizierung', en: 'Access control & authentication', fr: "Contrôle d'accès & authentification" } },
    { id: 'CR-P2', article: 'Art. 10(2) / Annex I.2(b)', categoryId: 'protection', mandatory: true, rule: { requiresAll: ['measures:confidentiality'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Entwicklung / IT-Sicherheit', en: 'Engineering / IT security', fr: 'Ingénierie / sécurité IT' }, name: { de: 'Vertraulichkeit / Verschlüsselung', en: 'Confidentiality / encryption', fr: 'Confidentialité / chiffrement' } },
    { id: 'CR-P3', article: 'Art. 10(2) / Annex I.2(c)', categoryId: 'protection', mandatory: true, rule: { requiresAll: ['measures:integrity'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Entwicklung / IT-Sicherheit', en: 'Engineering / IT security', fr: 'Ingénierie / sécurité IT' }, name: { de: 'Integritätsschutz & Schutz vor Manipulation', en: 'Integrity protection & tamper resistance', fr: "Protection de l'intégrité & résistance aux manipulations" } },
    { id: 'CR-P4', article: 'Art. 10(2) / Annex I.2(d)', categoryId: 'protection', mandatory: true, rule: { requiresAll: ['measures:availability'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Entwicklung / IT-Sicherheit', en: 'Engineering / IT security', fr: 'Ingénierie / sécurité IT' }, name: { de: 'Verfügbarkeit / Widerstandsfähigkeit', en: 'Availability / resilience', fr: 'Disponibilité / résilience' } },
    { id: 'CR-P5', article: 'Art. 10(2) / Annex I.2(e)', categoryId: 'protection', mandatory: true, rule: { requiresAll: ['measures:logging'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'IT-Sicherheit / Betrieb', en: 'IT security / operations', fr: 'Sécurité IT / exploitation' }, name: { de: 'Logging & Überwachung', en: 'Logging & monitoring', fr: 'Journalisation & surveillance' } },
    { id: 'CR-O1', article: 'Art. 10(3) / Annex I.3', categoryId: 'operations', weight: 2, mandatory: true, rule: { requiresAll: ['measures:updates'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Produktmanagement / Betrieb', en: 'Product management / operations', fr: 'Produit / exploitation' }, name: { de: 'Sicherheitsupdates über die gesamte Lebensdauer', en: 'Security updates throughout product lifetime', fr: 'Mises à jour de sécurité sur toute la durée de vie' } },
    { id: 'CR-V1', article: 'Art. 13(1)', categoryId: 'vuln', weight: 2, mandatory: true, rule: { requiresAll: ['measures:vulnprocess'], requiresAny: ['roles:vulnmgmt'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Vulnerability-Management-Team', en: 'Vulnerability management team', fr: "Équipe de gestion des vulnérabilités" }, name: { de: 'Schwachstellenmanagement & Coordinated Disclosure', en: 'Vulnerability management & coordinated disclosure', fr: 'Gestion des vulnérabilités & divulgation coordonnée' } },
    { id: 'CR-V2', article: 'Art. 13(2)', categoryId: 'vuln', mandatory: true, rule: { requiresAll: ['measures:reporting'], requiresAny: ['roles:legal'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Legal / Compliance', en: 'Legal / compliance', fr: 'Juridique / conformité' }, name: { de: 'Meldung nicht korrigierter Schwachstellen & Exploits', en: 'Reporting of unpatched vulnerabilities & exploits', fr: 'Signalement des vulnérabilités non corrigées & exploits' } },
    { id: 'CR-R1', article: 'Art. 14(1)', categoryId: 'reporting', weight: 2, mandatory: true, rule: { requiresAll: ['measures:reporting'], requiresAny: ['roles:legal', 'roles:vulnmgmt'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Compliance / Incident-Response', en: 'Compliance / incident response', fr: 'Conformité / réponse aux incidents' }, name: { de: 'Meldung aktiver Ausnutzung an ENISA (24h)', en: 'Reporting of active exploitation to ENISA (24h)', fr: 'Notification d\'exploitation active à l\'ENISA (24h)' } },
    { id: 'CR-R2', article: 'Art. 14(2)', categoryId: 'reporting', mandatory: true, rule: { requiresAll: ['measures:reporting'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Compliance / Support', en: 'Compliance / support', fr: 'Conformité / support' }, name: { de: 'Nutzermeldung bei Sicherheitsvorfällen & Schwachstellen', en: 'User reporting of security incidents & vulnerabilities', fr: 'Notification utilisateurs en cas d\'incidents & vulnérabilités' } },
    { id: 'CR-R3', article: 'Art. 11 / Annex II', categoryId: 'reporting', mandatory: true, rule: { requiresAll: ['measures:documentation'], requiresAny: ['roles:legal'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Compliance / Technische Dokumentation', en: 'Compliance / technical documentation', fr: 'Conformité / documentation technique' }, name: { de: 'Technische Dokumentation & EU-Konformitätserklärung (DoC)', en: 'Technical documentation & EU Declaration of Conformity', fr: 'Documentation technique & déclaration UE de conformité' } },
    { id: 'CR-R4', article: 'Art. 13(5)', categoryId: 'reporting', mandatory: false, rule: { requiresAll: ['measures:sbom'], riskLikelihood: 2, riskImpact: 3 }, owner: { de: 'Entwicklung / Lieferantenmanagement', en: 'Engineering / supply chain management', fr: 'Ingénierie / gestion de la chaîne' }, name: { de: 'SBOM / Software-Bill-of-Materials', en: 'SBOM / software bill of materials', fr: 'SBOM / nomenclature logicielle' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'SmartHome Devices GmbH',
    role: 'manufacturer',
    productClass: 'important',
    conformityModule: 'a',
    description:
      'Manufacturer of smart home IoT devices (thermostats, smart locks, lighting controllers). Firmware runs on embedded Linux with a mobile app and cloud backend on AWS. Products connect via Wi-Fi and Bluetooth. Critical functions: remote access, OTA firmware updates, user authentication.',
    supplyChain: ['hwcomponents', 'opensource', 'cloud', 'updates'],
    roles: ['mgmt', 'cso', 'qa', 'support'],
    knownIssues:
      'No SBOM yet for third-party components. Secure boot partially implemented on some models. Vulnerability reporting channel is an email alias without SLA. No automated security regression testing in CI/CD. EU DoC template exists but not yet signed for all SKUs.',
    measures: ['securebydesign', 'accesscontrol', 'confidentiality', 'integrity', 'availability', 'logging', 'updates', 'vulnprocess', 'reporting', 'documentation'],
    measures__mat__securebydesign: 'documented',
    measures__mat__accesscontrol: 'documented',
    measures__mat__confidentiality: 'documented',
    measures__mat__integrity: 'existing',
    measures__mat__availability: 'documented',
    measures__mat__logging: 'existing',
    measures__mat__updates: 'documented',
    measures__mat__vulnprocess: 'existing',
    measures__mat__reporting: 'existing',
    measures__mat__documentation: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Hersteller — auditreif', en: 'Manufacturer — audit-ready', fr: 'Fabricant — prêt pour l\'audit' },
      description: {
        de: 'Etablierter IoT-Hersteller mit reifem Secure-Development-Lifecycle und vollständiger CRA-Dokumentation.',
        en: 'Established IoT manufacturer with a mature secure development lifecycle and full CRA documentation.',
        fr: 'Fabricant IoT établi avec un cycle de développement sécurisé mature et documentation CRA complète.',
      },
      answers: {
        entityName: 'SmartHome Devices GmbH',
        role: 'manufacturer',
        productClass: 'important',
        conformityModule: 'a',
        description:
          'Manufacturer of smart home IoT devices with a mature SDL. Firmware runs on embedded Linux with mobile apps and cloud backend. All models support secure boot, signed OTA updates, and encrypted local storage. SBOMs generated automatically. CI/CD includes SAST/DAST and dependency scanning.',
        supplyChain: ['hwcomponents', 'opensource', 'cloud', 'updates', 'manufacturing'],
        roles: ['mgmt', 'cso', 'vulnmgmt', 'qa', 'support', 'legal'],
        knownIssues:
          'Minor gap: penetration testing is annual; moving to quarterly. Supplier security audits are sample-based rather than 100%.',
        measures: ['securebydesign', 'riskassessment', 'accesscontrol', 'confidentiality', 'integrity', 'availability', 'logging', 'updates', 'vulnprocess', 'reporting', 'documentation', 'sbom'],
        measures__mat__securebydesign: 'audited',
        measures__mat__riskassessment: 'audited',
        measures__mat__accesscontrol: 'audited',
        measures__mat__confidentiality: 'audited',
        measures__mat__integrity: 'audited',
        measures__mat__availability: 'audited',
        measures__mat__logging: 'documented',
        measures__mat__updates: 'audited',
        measures__mat__vulnprocess: 'audited',
        measures__mat__reporting: 'documented',
        measures__mat__documentation: 'audited',
        measures__mat__sbom: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Hersteller — im Aufbau', en: 'Manufacturer — developing', fr: 'Fabricant — en développement' },
      description: {
        de: 'Wachsender Hard-/Software-Hersteller mit Teil-Maßnahmen und Doku-Lücken.',
        en: 'Growing hardware/software manufacturer with partial controls and documentation gaps.',
        fr: 'Fabricant matériel/logiciel en croissance avec mesures partielles et lacunes documentaires.',
      },
      answers: {
        entityName: 'Connected Industrial AG',
        role: 'manufacturer',
        productClass: 'critical',
        conformityModule: 'b',
        description:
          'Industrial IoT gateway manufacturer serving manufacturing clients. Devices run a custom Linux build with VPN and Modbus TCP support. Cloud backend for fleet management. Products classified as critical PDE under Annex IV (industrial monitoring and control systems).',
        supplyChain: ['hwcomponents', 'opensource', 'cloud', 'updates'],
        roles: ['mgmt', 'cso', 'qa'],
        knownIssues:
          'No formal vulnerability disclosure programme yet. SBOM is manually maintained and only covers top-level dependencies. Secure boot implemented but not enforced. No automated security testing in CI. EU DoC drafted but not yet notarised.',
        measures: ['securebydesign', 'accesscontrol', 'confidentiality', 'integrity', 'updates', 'vulnprocess', 'documentation'],
        measures__mat__securebydesign: 'documented',
        measures__mat__accesscontrol: 'documented',
        measures__mat__confidentiality: 'existing',
        measures__mat__integrity: 'existing',
        measures__mat__updates: 'documented',
        measures__mat__vulnprocess: 'existing',
        measures__mat__documentation: 'documented',
      },
    },
    {
      id: 'early',
      label: { de: 'Start-up — frühe Phase', en: 'Start-up — early stage', fr: 'Start-up — phase initiale' },
      description: {
        de: 'Frühes Start-up mit minimalem Sicherheits-Setup und noch keine CRA-spezifische Dokumentation.',
        en: 'Early-stage start-up with minimal security setup and no CRA-specific documentation yet.',
        fr: 'Start-up en phase initiale avec une configuration sécurité minimale et pas encore de documentation CRA.',
      },
      answers: {
        entityName: 'WearableTech UG',
        role: 'manufacturer',
        productClass: 'important',
        conformityModule: 'unsure',
        description:
          'Three-person start-up building a wearable fitness tracker with BLE and a companion mobile app. Firmware developed by a single engineer; cloud backend is a managed Firebase instance. No dedicated security function.',
        supplyChain: ['opensource', 'cloud'],
        roles: ['mgmt'],
        knownIssues:
          'No formal risk assessment. No secure boot. No SBOM. No vulnerability reporting channel. No EU DoC. No automated security testing. Updates are manual and irregular.',
        measures: ['accesscontrol', 'confidentiality'],
        measures__mat__accesscontrol: 'existing',
        measures__mat__confidentiality: 'existing',
      },
    },
  ],
};
