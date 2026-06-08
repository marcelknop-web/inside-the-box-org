import type { StandardProfile } from './types';

// ── DORA profile ────────────────────────────────────────────────
// Regulation (EU) 2022/2554 (Digital Operational Resilience Act).
// Intake captures the financial-entity context and implemented ICT
// resilience measures; the AI assesses the requirements below strictly
// against the supplied evidence (no invented findings).

export const DORA_PROFILE: StandardProfile = {
  id: 'dora',
  name: 'DORA',
  icon: 'Network',
  available: true,
  fullName: {
    de: 'DORA-Konformitätsprüfung',
    en: 'DORA Conformity Assessment',
    fr: 'Évaluation de conformité DORA',
  },
  regulation: {
    de: 'Verordnung (EU) 2022/2554',
    en: 'Regulation (EU) 2022/2554',
    fr: 'Règlement (UE) 2022/2554',
  },
  description: {
    de: 'Digitale operationale Resilienz für Finanzunternehmen nach DORA.',
    en: 'Digital operational resilience audit for financial entities (DORA).',
    fr: "Audit de résilience opérationnelle numérique pour entités financières (DORA).",
  },
  intake: [
    {
      title: { de: 'Finanzunternehmen', en: 'Financial entity', fr: 'Entité financière' },
      subtitle: {
        de: 'Wer wird bewertet?',
        en: 'Who is being assessed?',
        fr: 'Qui est évalué ?',
      },
      info: {
        de: 'Der Typ des Finanzunternehmens bestimmt Pflichtumfang und Verhältnismäßigkeit (Art. 4).',
        en: 'The type of financial entity drives the scope of obligations and proportionality (Art. 4).',
        fr: "Le type d'entité financière détermine l'étendue des obligations et la proportionnalité (art. 4).",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Name des Unternehmens', en: 'Entity name', fr: "Nom de l'entité" },
          placeholder: { de: 'z. B. Musterbank AG', en: 'e.g. Acme Bank plc', fr: 'p. ex. Banque Exemple SA' },
        },
        {
          id: 'entityType',
          type: 'single',
          required: true,
          label: { de: 'Art des Finanzunternehmens', en: 'Type of financial entity', fr: "Type d'entité financière" },
          options: [
            { id: 'credit', icon: '🏦', label: { de: 'Kreditinstitut', en: 'Credit institution', fr: 'Établissement de crédit' } },
            { id: 'payment', icon: '💳', label: { de: 'Zahlungsinstitut / E-Geld', en: 'Payment / e-money institution', fr: 'Établissement de paiement / monnaie électronique' } },
            { id: 'investment', icon: '📈', label: { de: 'Wertpapierfirma', en: 'Investment firm', fr: "Entreprise d'investissement" } },
            { id: 'insurance', icon: '🛡️', label: { de: 'Versicherung / Rückversicherung', en: 'Insurance / reinsurance', fr: 'Assurance / réassurance' } },
            { id: 'crypto', icon: '🪙', label: { de: 'Krypto-Dienstleister (MiCAR)', en: 'Crypto-asset service provider', fr: 'Prestataire de crypto-actifs' } },
            { id: 'ictprovider', icon: '☁️', label: { de: 'IKT-Drittdienstleister', en: 'ICT third-party provider', fr: 'Prestataire tiers TIC' } },
            { id: 'other', icon: '🏢', label: { de: 'Sonstiges Finanzunternehmen', en: 'Other financial entity', fr: 'Autre entité financière' } },
          ],
        },
        {
          id: 'proportionality',
          type: 'single',
          required: true,
          label: { de: 'Verhältnismäßigkeit', en: 'Proportionality', fr: 'Proportionnalité' },
          options: [
            { id: 'full', label: { de: 'Vollständiger Rahmen', en: 'Full framework', fr: 'Cadre complet' }, desc: { de: 'Großes/komplexes Unternehmen', en: 'Large/complex entity', fr: 'Entité grande/complexe' } },
            { id: 'simplified', label: { de: 'Vereinfachter Rahmen', en: 'Simplified framework', fr: 'Cadre simplifié' }, desc: { de: 'Kleinunternehmen (Art. 16)', en: 'Small entity (Art. 16)', fr: 'Petite entité (art. 16)' } },
            { id: 'unsure', label: { de: 'Unklar', en: 'Unsure', fr: 'Incertain' }, desc: { de: 'Umfang soll mitbewertet werden', en: 'Scope to be assessed too', fr: 'Périmètre à évaluer' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Kontext & IKT-Drittparteien', en: 'Context & ICT third parties', fr: 'Contexte & tiers TIC' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der Tätigkeit & IKT-Landschaft', en: 'Description of operations & ICT landscape', fr: "Description de l'activité & du SI" },
          placeholder: { de: 'Kritische/wichtige Funktionen, Kernsysteme, Standorte …', en: 'Critical/important functions, core systems, sites …', fr: 'Fonctions critiques, systèmes clés, sites …' },
        },
        {
          id: 'thirdParties',
          type: 'multi',
          label: { de: 'Wesentliche IKT-Drittdienstleister', en: 'Key ICT third parties', fr: 'Tiers TIC clés' },
          options: [
            { id: 'cloud', icon: '☁️', label: { de: 'Cloud-Provider', en: 'Cloud provider', fr: 'Fournisseur cloud' } },
            { id: 'corebanking', icon: '🏦', label: { de: 'Kernbanken-/Kernsystem', en: 'Core banking/system', fr: 'Système central' } },
            { id: 'payproc', icon: '💳', label: { de: 'Zahlungsabwickler', en: 'Payment processor', fr: 'Processeur de paiement' } },
            { id: 'datafeeds', icon: '📡', label: { de: 'Marktdaten / Feeds', en: 'Market data / feeds', fr: 'Données de marché' } },
            { id: 'mssp', icon: '🛡️', label: { de: 'Managed Security (MSSP)', en: 'Managed security (MSSP)', fr: 'Sécurité managée' } },
            { id: 'software', icon: '💾', label: { de: 'Software-Lieferanten', en: 'Software vendors', fr: 'Éditeurs logiciels' } },
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
          label: { de: 'Etablierte Rollen', en: 'Established roles', fr: 'Rôles établis' },
          options: [
            { id: 'mgmt', icon: '👔', label: { de: 'Leitungsorgan eingebunden', en: 'Management body involved', fr: 'Organe de direction impliqué' } },
            { id: 'ictrisk', icon: '📊', label: { de: 'IKT-Risikomanagementfunktion', en: 'ICT risk management function', fr: 'Fonction de gestion des risques TIC' } },
            { id: 'ciso', icon: '🔐', label: { de: 'CISO / Informationssicherheit', en: 'CISO / Information security', fr: 'RSSI' } },
            { id: 'irt', icon: '🚨', label: { de: 'Incident-Response-Funktion', en: 'Incident response function', fr: 'Fonction de réponse aux incidents' } },
            { id: 'tprm', icon: '🤝', label: { de: 'IKT-Drittparteienmanagement', en: 'ICT third-party management', fr: 'Gestion des tiers TIC' } },
            { id: 'audit', icon: '📋', label: { de: 'Interne Revision / Kontrolle', en: 'Internal audit / control', fr: 'Audit interne / contrôle' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. kein vollständiges Informationsregister, kein TLPT …', en: 'e.g. no complete register of information, no TLPT …', fr: 'p. ex. registre incomplet, pas de TLPT …' },
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
          label: { de: 'IKT-Resilienzmaßnahmen', en: 'ICT resilience measures', fr: 'Mesures de résilience TIC' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'ictframework', label: { de: 'IKT-Risikomanagementrahmen', en: 'ICT risk management framework', fr: 'Cadre de gestion des risques TIC' } },
            { id: 'protection', label: { de: 'Schutz- & Präventionsmaßnahmen', en: 'Protection & prevention controls', fr: 'Mesures de protection & prévention' } },
            { id: 'detection', label: { de: 'Erkennungsmechanismen', en: 'Detection mechanisms', fr: 'Mécanismes de détection' } },
            { id: 'bcm', label: { de: 'Business Continuity & Wiederherstellung', en: 'Business continuity & recovery', fr: 'Continuité & rétablissement' } },
            { id: 'backup', label: { de: 'Backup & Restore', en: 'Backup & restore', fr: 'Sauvegarde & restauration' } },
            { id: 'incidentmgmt', label: { de: 'IKT-Vorfallmanagement', en: 'ICT incident management', fr: 'Gestion des incidents TIC' } },
            { id: 'incidentreport', label: { de: 'Meldung schwerwiegender Vorfälle', en: 'Major incident reporting', fr: 'Notification des incidents majeurs' } },
            { id: 'testing', label: { de: 'Resilienz-Testprogramm', en: 'Resilience testing programme', fr: 'Programme de tests de résilience' } },
            { id: 'tlpt', label: { de: 'Bedrohungsgeleitete Penetrationstests (TLPT)', en: 'Threat-led penetration testing (TLPT)', fr: 'Tests d\'intrusion fondés sur la menace (TLPT)' } },
            { id: 'register', label: { de: 'Informationsregister (Verträge)', en: 'Register of information (contracts)', fr: "Registre d'information (contrats)" } },
            { id: 'tprcontract', label: { de: 'Vertragliche IKT-Drittparteienauflagen', en: 'Contractual ICT third-party clauses', fr: 'Clauses contractuelles tiers TIC' } },
            { id: 'exit', label: { de: 'Ausstiegsstrategien & Konzentrationsrisiko', en: 'Exit strategies & concentration risk', fr: 'Stratégies de sortie & risque de concentration' } },
            { id: 'infosharing', label: { de: 'Informationsaustausch zu Cyberbedrohungen', en: 'Cyber threat information sharing', fr: "Partage d'informations sur les cybermenaces" } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'gov', name: { de: 'Governance & IKT-Risikorahmen', en: 'Governance & ICT risk framework', fr: 'Gouvernance & cadre de risque TIC' }, weight: 2 },
    { id: 'rm', name: { de: 'IKT-Risikomanagement', en: 'ICT risk management', fr: 'Gestion des risques TIC' } },
    { id: 'ops', name: { de: 'Betrieb & Resilienz', en: 'Operations & resilience', fr: 'Exploitation & résilience' } },
    { id: 'incident', name: { de: 'Vorfallmanagement & Meldewesen', en: 'Incident management & reporting', fr: 'Gestion des incidents & notification' }, weight: 2 },
    { id: 'testing', name: { de: 'Resilienz-Tests', en: 'Resilience testing', fr: 'Tests de résilience' } },
    { id: 'tpr', name: { de: 'IKT-Drittparteienrisiko', en: 'ICT third-party risk', fr: 'Risque lié aux tiers TIC' }, weight: 2 },
    { id: 'sharing', name: { de: 'Informationsaustausch', en: 'Information sharing', fr: "Partage d'informations" } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'D5-1', article: 'Art. 5', categoryId: 'gov', weight: 2, mandatory: true, rule: { requiresAll: ['roles:mgmt'], requiresAny: ['measures:ictframework'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Leitungsorgan', en: 'Management body', fr: 'Organe de direction' }, name: { de: 'Governance & Verantwortung des Leitungsorgans', en: 'Governance & management body accountability', fr: "Gouvernance & responsabilité de l'organe de direction" }, criteria: [
      { de: 'Leitungsorgan legt den IKT-Risikorahmen fest und überwacht dessen Umsetzung', en: 'Management body defines and oversees the ICT risk framework', fr: "L'organe de direction définit et supervise le cadre de risque TIC" },
      { de: 'Leitungsorgan verfügt über ausreichende IKT-Kenntnisse (Schulung)', en: 'Management body maintains adequate ICT knowledge (training)', fr: 'Connaissances TIC suffisantes (formation)' },
    ] },
    { id: 'D6-1', article: 'Art. 6', categoryId: 'rm', mandatory: true, rule: { requiresAll: ['measures:ictframework'], requiresAny: ['roles:ictrisk'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IKT-Risikomanagement', en: 'ICT risk management', fr: 'Gestion des risques TIC' }, name: { de: 'IKT-Risikomanagementrahmen', en: 'ICT risk management framework', fr: 'Cadre de gestion des risques TIC' } },
    { id: 'D8-1', article: 'Art. 8', categoryId: 'rm', mandatory: true, rule: { requiresAny: ['measures:ictframework', 'roles:ictrisk'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IKT-Risikomanagement', en: 'ICT risk management', fr: 'Gestion des risques TIC' }, name: { de: 'Identifikation (Funktionen & Assets)', en: 'Identification (functions & assets)', fr: 'Identification (fonctions & actifs)' } },
    { id: 'D9-1', article: 'Art. 9', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:protection'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Informationssicherheit', en: 'Information security', fr: 'Sécurité de l\'information' }, name: { de: 'Schutz & Prävention', en: 'Protection & prevention', fr: 'Protection & prévention' } },
    { id: 'D10-1', article: 'Art. 10', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:detection'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Security Operations', en: 'Security operations', fr: 'Opérations de sécurité' }, name: { de: 'Erkennung von IKT-Vorfällen', en: 'Detection of ICT incidents', fr: 'Détection des incidents TIC' } },
    { id: 'D11-1', article: 'Art. 11', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:bcm'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'IT-Betrieb', en: 'IT operations', fr: 'Exploitation IT' }, name: { de: 'Business Continuity & Reaktion/Wiederherstellung', en: 'Business continuity & response/recovery', fr: 'Continuité & réponse/rétablissement' } },
    { id: 'D12-1', article: 'Art. 12', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:backup'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'IT-Betrieb', en: 'IT operations', fr: 'Exploitation IT' }, name: { de: 'Backup, Wiederherstellung & Recovery', en: 'Backup, restoration & recovery', fr: 'Sauvegarde, restauration & rétablissement' } },
    { id: 'D17-1', article: 'Art. 17', categoryId: 'incident', mandatory: true, rule: { requiresAll: ['measures:incidentmgmt'], requiresAny: ['roles:irt'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Incident-Response-Funktion', en: 'Incident response function', fr: 'Fonction de réponse aux incidents' }, name: { de: 'IKT-Vorfallmanagementprozess', en: 'ICT incident management process', fr: 'Processus de gestion des incidents TIC' } },
    { id: 'D19-1', article: 'Art. 19', categoryId: 'incident', weight: 2, mandatory: true, rule: { requiresAll: ['measures:incidentreport'], requiresAny: ['roles:irt'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Compliance / Meldewesen', en: 'Compliance / reporting', fr: 'Conformité / notification' }, name: { de: 'Meldung schwerwiegender IKT-Vorfälle (4h/72h/1 Monat)', en: 'Reporting of major ICT incidents (4h/72h/1 month)', fr: 'Notification des incidents TIC majeurs' } },
    { id: 'D24-1', article: 'Art. 24', categoryId: 'testing', mandatory: true, rule: { requiresAll: ['measures:testing'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IKT-Risikomanagement', en: 'ICT risk management', fr: 'Gestion des risques TIC' }, name: { de: 'Programm für digitale Resilienztests', en: 'Digital resilience testing programme', fr: 'Programme de tests de résilience numérique' } },
    { id: 'D26-1', article: 'Art. 26', categoryId: 'testing', mandatory: false, rule: { requiresAll: ['measures:tlpt'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IKT-Risikomanagement', en: 'ICT risk management', fr: 'Gestion des risques TIC' }, name: { de: 'Erweiterte Tests (TLPT)', en: 'Advanced testing (TLPT)', fr: 'Tests avancés (TLPT)' } },
    { id: 'D28-1', article: 'Art. 28', categoryId: 'tpr', mandatory: true, rule: { requiresAny: ['roles:tprm', 'measures:tprcontract'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IKT-Drittparteienmanagement', en: 'ICT third-party management', fr: 'Gestion des tiers TIC' }, name: { de: 'Allgemeine Grundsätze IKT-Drittparteienrisiko', en: 'General principles for ICT third-party risk', fr: 'Principes généraux du risque lié aux tiers TIC' } },
    { id: 'D28-3', article: 'Art. 28(3)', categoryId: 'tpr', mandatory: true, rule: { requiresAll: ['measures:register'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IKT-Drittparteienmanagement', en: 'ICT third-party management', fr: 'Gestion des tiers TIC' }, name: { de: 'Informationsregister', en: 'Register of information', fr: "Registre d'information" } },
    { id: 'D28-8', article: 'Art. 28(8)', categoryId: 'tpr', mandatory: true, rule: { requiresAll: ['measures:exit'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IKT-Drittparteienmanagement', en: 'ICT third-party management', fr: 'Gestion des tiers TIC' }, name: { de: 'Ausstiegsstrategien & Konzentrationsrisiko', en: 'Exit strategies & concentration risk', fr: 'Stratégies de sortie & risque de concentration' } },
    { id: 'D30-1', article: 'Art. 30', categoryId: 'tpr', weight: 2, mandatory: true, rule: { requiresAll: ['measures:tprcontract'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Einkauf / Recht', en: 'Procurement / Legal', fr: 'Achats / Juridique' }, name: { de: 'Vertragliche Schlüsselbestimmungen', en: 'Key contractual provisions', fr: 'Dispositions contractuelles clés' } },
    { id: 'D45-1', article: 'Art. 45', categoryId: 'sharing', mandatory: false, rule: { requiresAll: ['measures:infosharing'], riskLikelihood: 2, riskImpact: 3 }, owner: { de: 'CISO / Threat Intelligence', en: 'CISO / Threat intelligence', fr: 'RSSI / Renseignement sur les menaces' }, name: { de: 'Vereinbarungen zum Informationsaustausch', en: 'Information sharing arrangements', fr: "Accords de partage d'informations" } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Bank AG',
    entityType: 'credit',
    proportionality: 'full',
    description:
      'Regional credit institution with approx. 1,200 employees offering retail and corporate banking, payments and online banking. Core banking on a managed platform, Microsoft 365 cloud, two ICT third parties for payment processing and market data. Critical functions: payment processing, core banking ledger, online banking portal.',
    thirdParties: ['cloud', 'corebanking', 'payproc', 'datafeeds'],
    roles: ['mgmt', 'ictrisk', 'ciso', 'irt', 'tprm'],
    knownIssues:
      'Register of information is incomplete for sub-outsourcing. No TLPT performed yet. Exit strategies documented only for the cloud provider, not for the core banking platform. Detection relies mainly on the MSSP without internal correlation.',
    measures: ['ictframework', 'protection', 'detection', 'bcm', 'backup', 'incidentmgmt', 'incidentreport', 'testing', 'register', 'tprcontract'],
    measures__mat__ictframework: 'documented',
    measures__mat__protection: 'documented',
    measures__mat__detection: 'existing',
    measures__mat__bcm: 'audited',
    measures__mat__backup: 'documented',
    measures__mat__incidentmgmt: 'documented',
    measures__mat__incidentreport: 'existing',
    measures__mat__testing: 'existing',
    measures__mat__register: 'existing',
    measures__mat__tprcontract: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Kreditinstitut — auditreif', en: 'Credit institution — audit-ready', fr: 'Établissement de crédit — prêt pour l’audit' },
      description: {
        de: 'Regionalbank mit reifem IKT-Risikorahmen und wenigen offenen Punkten.',
        en: 'Regional bank with a mature ICT risk framework and few open points.',
        fr: 'Banque régionale avec cadre de risque TIC mature et peu de points ouverts.',
      },
      answers: {
        entityName: 'Acme Bank AG',
        entityType: 'credit',
        proportionality: 'full',
        description:
          'Regional credit institution with approx. 1,200 employees offering retail and corporate banking, payments and online banking. Core banking on a managed platform, Microsoft 365 cloud, two ICT third parties for payment processing and market data. Critical functions: payment processing, core banking ledger, online banking portal.',
        thirdParties: ['cloud', 'corebanking', 'payproc', 'datafeeds'],
        roles: ['mgmt', 'ictrisk', 'ciso', 'irt', 'tprm', 'audit'],
        knownIssues:
          'Register of information is incomplete for sub-outsourcing. No TLPT performed yet. Exit strategies documented only for the cloud provider, not for the core banking platform. Detection relies mainly on the MSSP without internal correlation.',
        measures: ['ictframework', 'protection', 'detection', 'bcm', 'backup', 'incidentmgmt', 'incidentreport', 'testing', 'register', 'tprcontract', 'exit'],
        measures__mat__ictframework: 'audited',
        measures__mat__protection: 'documented',
        measures__mat__detection: 'documented',
        measures__mat__bcm: 'audited',
        measures__mat__backup: 'documented',
        measures__mat__incidentmgmt: 'documented',
        measures__mat__incidentreport: 'documented',
        measures__mat__testing: 'documented',
        measures__mat__register: 'documented',
        measures__mat__tprcontract: 'documented',
        measures__mat__exit: 'existing',
      },
    },
    {
      id: 'developing',
      label: { de: 'Zahlungsinstitut — im Aufbau', en: 'Payment institution — developing', fr: 'Établissement de paiement — en développement' },
      description: {
        de: 'Zahlungsdienstleister mit Teil-Resilienz und Lücken bei Tests & Dritten.',
        en: 'Payment provider with partial resilience and gaps in testing & third parties.',
        fr: 'Prestataire de paiement avec résilience partielle et lacunes tests & tiers.',
      },
      answers: {
        entityName: 'PayFlow Payments SA',
        entityType: 'payment',
        proportionality: 'full',
        description:
          'Payment institution with approx. 240 employees providing card acquiring and account-to-account payments across the EU. Heavily reliant on a cloud hyperscaler and an external payment processor. Critical functions: transaction authorisation, settlement, fraud monitoring.',
        thirdParties: ['cloud', 'payproc', 'mssp'],
        roles: ['mgmt', 'ictrisk', 'ciso'],
        knownIssues:
          'ICT risk framework is documented but not yet independently reviewed. Incident reporting timelines are not formally tested. No resilience testing programme in place. Register of information started but contractual clauses are inconsistent across providers.',
        measures: ['ictframework', 'protection', 'detection', 'backup', 'incidentmgmt', 'register'],
        measures__mat__ictframework: 'documented',
        measures__mat__protection: 'existing',
        measures__mat__detection: 'existing',
        measures__mat__backup: 'documented',
        measures__mat__incidentmgmt: 'existing',
        measures__mat__register: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Wertpapierfirma — Frühphase', en: 'Investment firm — early stage', fr: 'Entreprise d’investissement — phase initiale' },
      description: {
        de: 'Kleine Wertpapierfirma, kaum formalisierte IKT-Resilienz, viele Lücken.',
        en: 'Small investment firm with little formal ICT resilience and many gaps.',
        fr: 'Petite entreprise d’investissement, faible résilience TIC, nombreuses lacunes.',
      },
      answers: {
        entityName: 'Meridian Capital Partners',
        entityType: 'investment',
        proportionality: 'simplified',
        description:
          'Small investment firm with approx. 45 employees offering portfolio management and brokerage. Relies on a SaaS trading platform, market-data feeds and outsourced IT. Security and ICT risk are managed informally by operations alongside other duties.',
        thirdParties: ['cloud', 'datafeeds', 'software'],
        roles: ['mgmt'],
        knownIssues:
          'No documented ICT risk-management framework. No incident-management or reporting process. No business-continuity or backup testing. No register of information and no third-party contractual security clauses.',
        measures: ['protection'],
        measures__mat__protection: 'existing',
      },
    },
  ],
};
