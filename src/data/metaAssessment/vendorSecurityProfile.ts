import type { StandardProfile } from './types';

// ── Vendor Security Assessment profile ──────────────────────────
// Third-party / supplier security due-diligence assessment. Evaluates a
// vendor's information-security posture across governance, data protection,
// access control, operations, business continuity, incident handling and
// compliance — suitable for onboarding and periodic re-assessment.
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const VENDOR_SECURITY_PROFILE: StandardProfile = {
  id: 'vendorsec',
  name: 'Vendor Security',
  icon: 'Handshake',
  available: true,
  fullName: {
    de: 'Vendor Security Assessment — Lieferanten-Sicherheitsbewertung',
    en: 'Vendor Security Assessment — Third-party security due diligence',
    fr: 'Vendor Security Assessment — Évaluation de sécurité des fournisseurs',
  },
  regulation: {
    de: 'Third-Party Risk Management (TPRM)',
    en: 'Third-Party Risk Management (TPRM)',
    fr: 'Gestion des risques tiers (TPRM)',
  },
  description: {
    de: 'Audit-Workflow zur Sicherheitsbewertung von Lieferanten und Dienstleistern (Third-Party Risk Management).',
    en: 'Conformity audit workflow for assessing the security posture of suppliers and service providers (third-party risk management).',
    fr: "Flux d'audit de conformité pour évaluer la posture de sécurité des fournisseurs et prestataires (gestion des risques tiers).",
  },
  intake: [
    {
      title: { de: 'Lieferant & Bewertungsobjekt', en: 'Vendor & assessment object', fr: "Fournisseur & objet d'évaluation" },
      subtitle: {
        de: 'Welcher Lieferant / Dienstleister wird bewertet?',
        en: 'Which vendor / service provider is being assessed?',
        fr: 'Quel fournisseur / prestataire est évalué ?',
      },
      info: {
        de: 'Die Bewertung richtet sich nach Kritikalität und Datenzugang des Lieferanten.',
        en: 'The assessment is scaled to the vendor’s criticality and data access.',
        fr: "L'évaluation est adaptée à la criticité et à l'accès aux données du fournisseur.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Lieferant / Dienstleister', en: 'Vendor / service provider', fr: 'Fournisseur / prestataire' },
          placeholder: { de: 'z. B. Muster Cloud Services', en: 'e.g. Acme Cloud Services', fr: 'p. ex. Exemple Cloud Services' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Art des Lieferanten', en: 'Type of vendor', fr: 'Type de fournisseur' },
          options: [
            { id: 'saas', icon: '☁️', label: { de: 'SaaS / Cloud-Anbieter', en: 'SaaS / cloud provider', fr: 'Fournisseur SaaS / cloud' }, desc: { de: 'Verarbeitet Daten extern', en: 'Processes data externally', fr: 'Traite des données en externe' } },
            { id: 'processor', icon: '🗄️', label: { de: 'Auftragsverarbeiter (DSGVO)', en: 'Data processor (GDPR)', fr: 'Sous-traitant (RGPD)' } },
            { id: 'managed', icon: '🔧', label: { de: 'Managed-Service / IT-Dienstleister', en: 'Managed service / IT provider', fr: 'Service géré / prestataire IT' } },
            { id: 'goods', icon: '📦', label: { de: 'Waren-/Hardware-Lieferant', en: 'Goods / hardware supplier', fr: 'Fournisseur de biens / matériel' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Bewertungskontext', en: 'Assessment context', fr: "Contexte d'évaluation" },
          options: [
            { id: 'onboarding', label: { de: 'Onboarding / Erstprüfung', en: 'Onboarding / initial review', fr: 'Onboarding / examen initial' } },
            { id: 'periodic', label: { de: 'Periodische Re-Bewertung', en: 'Periodic re-assessment', fr: 'Réévaluation périodique' } },
            { id: 'critical', label: { de: 'Kritischer Lieferant (Tiefenprüfung)', en: 'Critical vendor (deep dive)', fr: 'Fournisseur critique (analyse approfondie)' } },
            { id: 'incident', label: { de: 'Anlassbezogen (nach Vorfall)', en: 'Event-driven (post-incident)', fr: 'Ponctuel (après incident)' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Leistungsumfang, Datenzugang & Risikolandschaft', en: 'Service scope, data access & risk landscape', fr: 'Périmètre, accès aux données & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der Leistung, Datenzugang & Abhängigkeiten', en: 'Description of the service, data access & dependencies', fr: 'Description du service, accès aux données & dépendances' },
          placeholder: { de: 'Welche Leistung, welche Daten (personenbezogen/vertraulich), Zugriffsart, Standorte, Sub-Unternehmer …', en: 'What service, what data (personal/confidential), type of access, locations, sub-processors …', fr: 'Quel service, quelles données (personnelles/confidentielles), type d\'accès, sites, sous-traitants …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Datenzugang & Exposition', en: 'Data access & exposure', fr: 'Accès aux données & exposition' },
          options: [
            { id: 'pii', icon: '👤', label: { de: 'Personenbezogene Daten', en: 'Personal data', fr: 'Données personnelles' } },
            { id: 'confidential', icon: '🔒', label: { de: 'Vertrauliche Geschäftsdaten', en: 'Confidential business data', fr: 'Données métier confidentielles' } },
            { id: 'systemaccess', icon: '🔑', label: { de: 'Zugriff auf interne Systeme', en: 'Access to internal systems', fr: 'Accès aux systèmes internes' } },
            { id: 'hosting', icon: '☁️', label: { de: 'Hosting / Datenspeicherung', en: 'Hosting / data storage', fr: 'Hébergement / stockage' } },
            { id: 'subprocessors', icon: '🔗', label: { de: 'Einsatz von Sub-Unternehmern', en: 'Use of sub-processors', fr: 'Recours à des sous-traitants' } },
            { id: 'critical', icon: '⚠️', label: { de: 'Geschäftskritische Abhängigkeit', en: 'Business-critical dependency', fr: 'Dépendance critique' } },
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
          label: { de: 'Nachgewiesene Strukturen & Zertifizierungen', en: 'Demonstrated structures & certifications', fr: 'Structures & certifications démontrées' },
          options: [
            { id: 'certified', icon: '🏅', label: { de: 'Zertifiziert (ISO 27001 / SOC 2)', en: 'Certified (ISO 27001 / SOC 2)', fr: 'Certifié (ISO 27001 / SOC 2)' } },
            { id: 'ciso', icon: '🛡️', label: { de: 'Benannte Sicherheitsverantwortung', en: 'Designated security responsibility', fr: 'Responsabilité sécurité désignée' } },
            { id: 'dpa', icon: '📄', label: { de: 'AV-Vertrag / DPA vorhanden', en: 'Data processing agreement in place', fr: 'Contrat de sous-traitance (DPA) en place' } },
            { id: 'audits', icon: '📋', label: { de: 'Regelmäßige Audits / Pentests', en: 'Regular audits / pentests', fr: 'Audits / pentests réguliers' } },
            { id: 'training', icon: '📚', label: { de: 'Security-Awareness-Programm', en: 'Security awareness programme', fr: 'Programme de sensibilisation' } },
            { id: 'sla', icon: '⏱️', label: { de: 'Sicherheits-SLAs vereinbart', en: 'Security SLAs agreed', fr: 'SLA de sécurité convenus' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. kein MFA, kein DPA, keine Zertifizierung, unklare Sub-Unternehmer, keine Verschlüsselung …', en: 'e.g. no MFA, no DPA, no certification, unclear sub-processors, no encryption …', fr: 'p. ex. pas de MFA, pas de DPA, pas de certification, sous-traitants flous …' },
        },
      ],
    },
    {
      title: { de: 'Nachgewiesene Maßnahmen', en: 'Demonstrated measures', fr: 'Mesures démontrées' },
      info: {
        de: 'Nur ankreuzen, was der Lieferant nachweislich belegt. Die KI erfindet keine Nachweise.',
        en: 'Only tick what the vendor verifiably evidences. The AI invents no evidence.',
        fr: "Ne cochez que ce que le fournisseur prouve réellement. L'IA n'invente aucune preuve.",
      },
      fields: [
        {
          id: 'measures',
          type: 'maturity-multi',
          label: { de: 'Sicherheitsmaßnahmen des Lieferanten', en: 'Vendor security measures', fr: 'Mesures de sécurité du fournisseur' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'governance', label: { de: 'Sicherheitsorganisation & -richtlinien', en: 'Security organisation & policies', fr: 'Organisation & politiques de sécurité' } },
            { id: 'certification', label: { de: 'Zertifizierungen / Attestierungen', en: 'Certifications / attestations', fr: 'Certifications / attestations' } },
            { id: 'risk', label: { de: 'Risikomanagement', en: 'Risk management', fr: 'Gestion des risques' } },
            { id: 'access', label: { de: 'Zugriffssteuerung & MFA', en: 'Access control & MFA', fr: "Contrôle d'accès & MFA" } },
            { id: 'encryption', label: { de: 'Verschlüsselung (Transit & Ruhe)', en: 'Encryption (in transit & at rest)', fr: 'Chiffrement (transit & repos)' } },
            { id: 'dataprotection', label: { de: 'Datenschutz & DPA / DSGVO', en: 'Data protection & DPA / GDPR', fr: 'Protection des données & DPA / RGPD' } },
            { id: 'datalocation', label: { de: 'Datenstandort & Übermittlungen', en: 'Data location & transfers', fr: 'Localisation & transferts de données' } },
            { id: 'operations', label: { de: 'Betriebssicherheit (Patch, Malware, Backup)', en: 'Operations security (patch, malware, backup)', fr: 'Sécurité d\'exploitation (patch, malware, sauvegarde)' } },
            { id: 'network', label: { de: 'Netzwerk- & Anwendungssicherheit', en: 'Network & application security', fr: 'Sécurité réseau & applicative' } },
            { id: 'vuln', label: { de: 'Schwachstellen- & Pentest-Programm', en: 'Vulnerability & pentest programme', fr: 'Programme de vulnérabilités & pentests' } },
            { id: 'incident', label: { de: 'Incident-Response & Meldepflichten', en: 'Incident response & breach notification', fr: 'Réponse aux incidents & notification' } },
            { id: 'bcm', label: { de: 'Business Continuity & Disaster Recovery', en: 'Business continuity & disaster recovery', fr: 'Continuité & reprise après sinistre' } },
            { id: 'subprocessor', label: { de: 'Sub-Unternehmer-Steuerung', en: 'Sub-processor management', fr: 'Gestion des sous-traitants' } },
            { id: 'sla', label: { de: 'Sicherheits-SLAs & Audit-Rechte', en: 'Security SLAs & audit rights', fr: 'SLA de sécurité & droits d\'audit' } },
            { id: 'awareness', label: { de: 'Awareness & Schulung', en: 'Awareness & training', fr: 'Sensibilisation & formation' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Governance & Compliance', en: 'Governance & compliance', fr: 'Gouvernance & conformité' }, weight: 2 },
    { id: 'data', name: { de: 'Datenschutz & Datenhaltung', en: 'Data protection & residency', fr: 'Protection & hébergement des données' }, weight: 2 },
    { id: 'protect', name: { de: 'Technische Schutzmaßnahmen', en: 'Technical safeguards', fr: 'Mesures techniques' }, weight: 2 },
    { id: 'detect', name: { de: 'Erkennen & Testen', en: 'Detect & test', fr: 'Détecter & tester' } },
    { id: 'respond', name: { de: 'Reagieren & Kontinuität', en: 'Respond & continuity', fr: 'Réponse & continuité' }, weight: 2 },
    { id: 'supplychain', name: { de: 'Lieferkette & Verträge', en: 'Supply chain & contracts', fr: 'Chaîne d\'approvisionnement & contrats' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'VS-G1', article: 'TPRM Governance', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:governance'], requiresAny: ['roles:ciso', 'measures:certification'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Sicherheitsorganisation, Richtlinien & Verantwortlichkeiten', en: 'Security organisation, policies & responsibilities', fr: 'Organisation, politiques & responsabilités de sécurité' }, criteria: [
      { de: 'Dokumentierte Sicherheitsorganisation mit benannter Verantwortung; idealerweise zertifiziert (ISO 27001 / SOC 2)', en: 'Documented security organisation with named responsibility; ideally certified (ISO 27001 / SOC 2)', fr: 'Organisation de sécurité documentée avec responsabilité désignée ; idéalement certifiée (ISO 27001 / SOC 2)' },
    ] },
    { id: 'VS-G2', article: 'TPRM Risk', categoryId: 'govern', mandatory: true, rule: { requiresAll: ['measures:risk'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Risikomanagement', en: 'Risk management', fr: 'Gestion des risques' } },
    { id: 'VS-DA1', article: 'GDPR Art. 28', categoryId: 'data', weight: 2, mandatory: true, rule: { requiresAll: ['measures:dataprotection'], requiresAny: ['roles:dpa'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Datenschutz & Auftragsverarbeitungsvertrag (DPA)', en: 'Data protection & data processing agreement (DPA)', fr: 'Protection des données & contrat de sous-traitance (DPA)' } },
    { id: 'VS-DA2', article: 'Data residency', categoryId: 'data', mandatory: true, rule: { requiresAll: ['measures:datalocation'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Datenstandort & internationale Übermittlungen', en: 'Data location & international transfers', fr: 'Localisation & transferts internationaux' } },
    { id: 'VS-PR1', article: 'Access control', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:access'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Zugriffssteuerung & Mehr-Faktor-Authentifizierung', en: 'Access control & multi-factor authentication', fr: "Contrôle d'accès & authentification multifacteur" } },
    { id: 'VS-PR2', article: 'Encryption', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:encryption'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Verschlüsselung in Transit & Ruhe', en: 'Encryption in transit & at rest', fr: 'Chiffrement en transit & au repos' } },
    { id: 'VS-PR3', article: 'Operations security', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:operations'], requiresAny: ['measures:network'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Betriebs- & Netzwerksicherheit (Patch, Malware, Backup)', en: 'Operations & network security (patch, malware, backup)', fr: 'Sécurité exploitation & réseau (patch, malware, sauvegarde)' } },
    { id: 'VS-DE1', article: 'Vulnerability mgmt', categoryId: 'detect', mandatory: true, rule: { requiresAll: ['measures:vuln'], requiresAny: ['roles:audits'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Schwachstellenmanagement & Penetrationstests', en: 'Vulnerability management & penetration testing', fr: 'Gestion des vulnérabilités & tests d\'intrusion' } },
    { id: 'VS-RS1', article: 'Incident response', categoryId: 'respond', weight: 2, mandatory: true, rule: { requiresAll: ['measures:incident'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Incident-Response & Meldepflichten bei Datenpannen', en: 'Incident response & breach notification', fr: 'Réponse aux incidents & notification de violation' } },
    { id: 'VS-RS2', article: 'BCM / DR', categoryId: 'respond', mandatory: true, rule: { requiresAll: ['measures:bcm'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Business Continuity & Disaster Recovery', en: 'Business continuity & disaster recovery', fr: 'Continuité & reprise après sinistre' } },
    { id: 'VS-SC1', article: 'Sub-processors', categoryId: 'supplychain', mandatory: true, rule: { requiresAll: ['measures:subprocessor'], requiresAny: ['systems:subprocessors'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Lieferant', en: 'Vendor', fr: 'Fournisseur' }, name: { de: 'Sub-Unternehmer-Steuerung & Weitergabe', en: 'Sub-processor management & flow-down', fr: 'Gestion des sous-traitants & répercussion' } },
    { id: 'VS-SC2', article: 'Contracts / SLA', categoryId: 'supplychain', mandatory: true, rule: { requiresAll: ['measures:sla'], requiresAny: ['roles:sla'], riskLikelihood: 2, riskImpact: 3 }, owner: { de: 'Lieferant / Einkauf', en: 'Vendor / procurement', fr: 'Fournisseur / achats' }, name: { de: 'Sicherheits-SLAs & Audit-Rechte', en: 'Security SLAs & audit rights', fr: 'SLA de sécurité & droits d\'audit' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Cloud Services',
    role: 'saas',
    phase: 'onboarding',
    description:
      'SaaS provider hosting our CRM data, including personal data of customers. Multi-tenant cloud platform in the EU with one US-based analytics sub-processor. ISO 27001 certified. Onboarding security assessment before contract signature.',
    systems: ['pii', 'confidential', 'hosting', 'subprocessors', 'critical'],
    roles: ['certified', 'ciso', 'dpa', 'audits', 'sla'],
    knownIssues:
      'SOC 2 Type II in progress but not yet issued. Sub-processor list provided but transfer mechanism for the US analytics provider not fully documented. Pentest reports older than 12 months.',
    measures: ['governance', 'certification', 'risk', 'access', 'encryption', 'dataprotection', 'datalocation', 'operations', 'network', 'incident', 'bcm', 'subprocessor', 'sla'],
    measures__mat__governance: 'documented',
    measures__mat__certification: 'documented',
    measures__mat__risk: 'existing',
    measures__mat__access: 'documented',
    measures__mat__encryption: 'documented',
    measures__mat__dataprotection: 'documented',
    measures__mat__datalocation: 'existing',
    measures__mat__operations: 'documented',
    measures__mat__network: 'existing',
    measures__mat__incident: 'documented',
    measures__mat__bcm: 'existing',
    measures__mat__subprocessor: 'existing',
    measures__mat__sla: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Kritischer Lieferant — belastbar', en: 'Critical vendor — robust', fr: 'Fournisseur critique — robuste' },
      description: {
        de: 'Zertifizierter Anbieter mit nachgewiesenen, geprüften Kontrollen.',
        en: 'Certified provider with evidenced, audited controls.',
        fr: 'Fournisseur certifié avec contrôles prouvés et audités.',
      },
      answers: {
        entityName: 'Northern Star Cloud',
        role: 'saas',
        phase: 'critical',
        description:
          'Business-critical hosting provider with ISO 27001 and SOC 2 Type II. Encryption everywhere, enforced MFA, mature vulnerability programme, tested DR, fully documented EU data residency and sub-processor governance.',
        systems: ['pii', 'confidential', 'systemaccess', 'hosting', 'subprocessors', 'critical'],
        roles: ['certified', 'ciso', 'dpa', 'audits', 'training', 'sla'],
        knownIssues:
          'Minor finding on access-review cadence for one admin group. Remediation tracked with due date.',
        measures: ['governance', 'certification', 'risk', 'access', 'encryption', 'dataprotection', 'datalocation', 'operations', 'network', 'vuln', 'incident', 'bcm', 'subprocessor', 'sla', 'awareness'],
        measures__mat__governance: 'audited',
        measures__mat__certification: 'audited',
        measures__mat__risk: 'documented',
        measures__mat__access: 'documented',
        measures__mat__encryption: 'documented',
        measures__mat__dataprotection: 'documented',
        measures__mat__datalocation: 'documented',
        measures__mat__operations: 'documented',
        measures__mat__network: 'documented',
        measures__mat__vuln: 'documented',
        measures__mat__incident: 'documented',
        measures__mat__bcm: 'documented',
        measures__mat__subprocessor: 'documented',
        measures__mat__sla: 'documented',
        measures__mat__awareness: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Akzeptabel mit Auflagen', en: 'Acceptable with conditions', fr: 'Acceptable sous conditions' },
      description: {
        de: 'Grundlegende Kontrollen vorhanden, aber Lücken bei Nachweisen und Tests.',
        en: 'Basic controls present but gaps in evidence and testing.',
        fr: 'Contrôles de base présents mais lacunes dans les preuves et tests.',
      },
      answers: {
        entityName: 'Coastal Managed IT',
        role: 'managed',
        phase: 'onboarding',
        description:
          'Managed-service provider with system access to our infrastructure. No formal certification; DPA available; MFA partly enforced.',
        systems: ['systemaccess', 'confidential'],
        roles: ['dpa', 'ciso'],
        knownIssues:
          'No ISO/SOC certification. No pentest programme. Backup tested irregularly. Sub-contractors not disclosed.',
        measures: ['governance', 'access', 'encryption', 'dataprotection', 'operations'],
        measures__mat__governance: 'existing',
        measures__mat__access: 'existing',
        measures__mat__encryption: 'documented',
        measures__mat__dataprotection: 'documented',
        measures__mat__operations: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Hohes Risiko', en: 'High risk', fr: 'Risque élevé' },
      description: {
        de: 'Kaum nachweisbare Sicherheitsmaßnahmen, viele offene Punkte.',
        en: 'Barely demonstrable security measures, many open points.',
        fr: 'Mesures de sécurité à peine démontrables, nombreux points ouverts.',
      },
      answers: {
        entityName: 'Harbour Apps Co',
        role: 'saas',
        phase: 'onboarding',
        description:
          'Small SaaS tool requested by a business unit, processing personal data. No certification, unclear hosting, no DPA provided.',
        systems: ['pii', 'hosting'],
        roles: [],
        knownIssues:
          'No DPA, no certification, no MFA, unknown data location, no incident or DR process disclosed.',
        measures: ['encryption'],
        measures__mat__encryption: 'existing',
      },
    },
  ],
};
