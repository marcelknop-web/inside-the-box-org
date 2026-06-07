import type { StandardProfile } from './types';

// ── NIS2 pilot profile ──────────────────────────────────────────
// Directive (EU) 2022/2555. Intake captures the entity context and
// implemented measures; the AI assesses the requirements below
// strictly against the supplied evidence (no invented findings).

export const NIS2_PROFILE: StandardProfile = {
  id: 'nis2',
  name: 'NIS2',
  icon: 'Network',
  available: true,
  fullName: {
    de: 'NIS-2-Konformitätsprüfung',
    en: 'NIS-2 Conformity Assessment',
    fr: 'Évaluation de conformité NIS-2',
  },
  regulation: {
    de: 'Richtlinie (EU) 2022/2555',
    en: 'Directive (EU) 2022/2555',
    fr: 'Directive (UE) 2022/2555',
  },
  description: {
    de: 'Audit-Workflow für wesentliche und wichtige Einrichtungen nach NIS-2.',
    en: 'Audit workflow for essential and important entities under NIS-2.',
    fr: "Flux d'audit pour entités essentielles et importantes selon NIS-2.",
  },
  intake: [
    {
      title: { de: 'Einrichtung', en: 'Entity', fr: 'Entité' },
      subtitle: {
        de: 'Wer wird bewertet?',
        en: 'Who is being assessed?',
        fr: 'Qui est évalué ?',
      },
      info: {
        de: 'Die Einstufung (wesentlich/wichtig) bestimmt Pflichtumfang und Aufsichtsregime.',
        en: 'Classification (essential/important) drives the scope of obligations and supervision.',
        fr: "La classification détermine l'étendue des obligations et le régime de supervision.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Name der Einrichtung', en: 'Entity name', fr: "Nom de l'entité" },
          placeholder: { de: 'z. B. Stadtwerke Musterstadt', en: 'e.g. Acme Utilities', fr: 'p. ex. Régie municipale' },
        },
        {
          id: 'sectors',
          type: 'multi',
          required: true,
          label: { de: 'Sektor(en)', en: 'Sector(s)', fr: 'Secteur(s)' },
          options: [
            { id: 'energy', icon: '⚡', label: { de: 'Energie', en: 'Energy', fr: 'Énergie' } },
            { id: 'health', icon: '🏥', label: { de: 'Gesundheit', en: 'Health', fr: 'Santé' } },
            { id: 'transport', icon: '🚆', label: { de: 'Transport', en: 'Transport', fr: 'Transport' } },
            { id: 'finance', icon: '🏦', label: { de: 'Finanzwesen', en: 'Finance', fr: 'Finance' } },
            { id: 'water', icon: '💧', label: { de: 'Wasser/Abwasser', en: 'Water', fr: 'Eau' } },
            { id: 'digital', icon: '☁️', label: { de: 'Digitale Dienste', en: 'Digital services', fr: 'Services numériques' } },
            { id: 'manufacturing', icon: '🏭', label: { de: 'Produktion', en: 'Manufacturing', fr: 'Fabrication' } },
            { id: 'public', icon: '🏛️', label: { de: 'Öffentliche Verwaltung', en: 'Public administration', fr: 'Administration publique' } },
          ],
        },
        {
          id: 'classification',
          type: 'single',
          required: true,
          label: { de: 'Einstufung', en: 'Classification', fr: 'Classification' },
          options: [
            { id: 'essential', label: { de: 'Wesentliche Einrichtung', en: 'Essential entity', fr: 'Entité essentielle' }, desc: { de: 'Strengere Aufsicht, proaktive Kontrolle', en: 'Stricter, proactive supervision', fr: 'Supervision proactive renforcée' } },
            { id: 'important', label: { de: 'Wichtige Einrichtung', en: 'Important entity', fr: 'Entité importante' }, desc: { de: 'Reaktive Aufsicht', en: 'Reactive supervision', fr: 'Supervision réactive' } },
            { id: 'unsure', label: { de: 'Unklar', en: 'Unsure', fr: 'Incertain' }, desc: { de: 'Einstufung soll mitbewertet werden', en: 'Classification to be assessed too', fr: 'Classification à évaluer' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Kontext & Lieferkette', en: 'Context & supply chain', fr: 'Contexte & chaîne' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der Tätigkeit & IT-Landschaft', en: 'Description of operations & IT landscape', fr: "Description de l'activité & du SI" },
          placeholder: { de: 'Kerndienste, kritische Systeme, Standorte …', en: 'Core services, critical systems, sites …', fr: 'Services clés, systèmes critiques, sites …' },
        },
        {
          id: 'supplyChain',
          type: 'multi',
          label: { de: 'Wesentliche Drittanbieter', en: 'Key third parties', fr: 'Tiers clés' },
          options: [
            { id: 'cloud', icon: '☁️', label: { de: 'Cloud-Provider', en: 'Cloud provider', fr: 'Fournisseur cloud' } },
            { id: 'mssp', icon: '🛡️', label: { de: 'Managed Security (MSSP)', en: 'Managed security (MSSP)', fr: 'Sécurité managée' } },
            { id: 'software', icon: '💾', label: { de: 'Software-Lieferanten', en: 'Software vendors', fr: 'Éditeurs logiciels' } },
            { id: 'ot', icon: '⚙️', label: { de: 'OT-/Anlagenlieferanten', en: 'OT/equipment vendors', fr: 'Fournisseurs OT' } },
            { id: 'outsourcing', icon: '🤝', label: { de: 'IT-Outsourcing', en: 'IT outsourcing', fr: 'Infogérance' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Geschäftsleitung eingebunden', en: 'Management involved', fr: 'Direction impliquée' } },
            { id: 'ciso', icon: '🔐', label: { de: 'CISO / IT-Sicherheit', en: 'CISO / IT security', fr: 'RSSI' } },
            { id: 'dpo', icon: '📋', label: { de: 'Datenschutzbeauftragter', en: 'DPO', fr: 'DPO' } },
            { id: 'risk', icon: '📊', label: { de: 'Risikomanagement', en: 'Risk management', fr: 'Gestion des risques' } },
            { id: 'irt', icon: '🚨', label: { de: 'Incident-Response-Team', en: 'Incident response team', fr: "Équipe de réponse" } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine MFA für Admins, kein BCM-Test 2024 …', en: 'e.g. no MFA for admins, no BCM test in 2024 …', fr: 'p. ex. pas de MFA admins …' },
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
          label: { de: 'Maßnahmen nach Art. 21', en: 'Measures per Art. 21', fr: 'Mesures selon art. 21' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'riskpolicy', label: { de: 'Risikoanalyse & Sicherheitsrichtlinien', en: 'Risk analysis & security policies', fr: 'Analyse de risque & politiques' } },
            { id: 'incident', label: { de: 'Incident Handling', en: 'Incident handling', fr: 'Gestion des incidents' } },
            { id: 'bcm', label: { de: 'Business Continuity / Backup', en: 'Business continuity / backup', fr: 'Continuité / sauvegarde' } },
            { id: 'supplychainsec', label: { de: 'Lieferkettensicherheit', en: 'Supply chain security', fr: 'Sécurité de la chaîne' } },
            { id: 'vuln', label: { de: 'Schwachstellen- & Patch-Management', en: 'Vulnerability & patch mgmt', fr: 'Gestion des vulnérabilités' } },
            { id: 'crypto', label: { de: 'Kryptografie / Verschlüsselung', en: 'Cryptography / encryption', fr: 'Cryptographie' } },
            { id: 'mfa', label: { de: 'MFA & Zugriffskontrolle', en: 'MFA & access control', fr: 'MFA & contrôle d\'accès' } },
            { id: 'training', label: { de: 'Schulung & Awareness', en: 'Training & awareness', fr: 'Formation & sensibilisation' } },
            { id: 'audit', label: { de: 'Wirksamkeitsprüfung / Audits', en: 'Effectiveness reviews / audits', fr: 'Audits d\'efficacité' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'gov', name: { de: 'Governance & Verantwortung', en: 'Governance & accountability', fr: 'Gouvernance & responsabilité' }, weight: 2 },
    { id: 'rm', name: { de: 'Risikomanagement', en: 'Risk management', fr: 'Gestion des risques' } },
    { id: 'ops', name: { de: 'Betrieb & Resilienz', en: 'Operations & resilience', fr: 'Exploitation & résilience' } },
    { id: 'supply', name: { de: 'Lieferkette', en: 'Supply chain', fr: "Chaîne d'approvisionnement" } },
    { id: 'tech', name: { de: 'Technische Maßnahmen', en: 'Technical controls', fr: 'Mesures techniques' } },
    { id: 'report', name: { de: 'Meldewesen', en: 'Reporting', fr: 'Notification' }, weight: 2 },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'A20-1', article: 'Art. 20', categoryId: 'gov', weight: 2, mandatory: true, rule: { requiresAll: ['roles:mgmt'], requiresAny: ['measures:training'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Geschäftsleitung', en: 'Management board', fr: 'Direction' }, name: { de: 'Verantwortung & Schulung der Geschäftsleitung', en: 'Management accountability & training', fr: 'Responsabilité de la direction' }, criteria: [
      { de: 'Leitungsorgan billigt Risikomaßnahmen und überwacht deren Umsetzung', en: 'Management approves risk measures and oversees implementation', fr: 'La direction approuve et supervise' },
      { de: 'Leitungspersonen nehmen an Schulungen teil', en: 'Management members attend training', fr: 'Formation de la direction' },
    ] },
    { id: 'A21-1', article: 'Art. 21(2)(a)', categoryId: 'rm', mandatory: true, rule: { requiresAll: ['measures:riskpolicy'], requiresAny: ['roles:risk'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Risikomanagement', en: 'Risk management', fr: 'Gestion des risques' }, name: { de: 'Risikoanalyse & Sicherheitsrichtlinien', en: 'Risk analysis & security policies', fr: 'Analyse de risque & politiques' } },
    { id: 'A21-2', article: 'Art. 21(2)(b)', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:incident'], requiresAny: ['roles:irt'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Incident-Response-Team', en: 'Incident response team', fr: 'Équipe de réponse' }, name: { de: 'Bewältigung von Sicherheitsvorfällen', en: 'Incident handling', fr: 'Gestion des incidents' } },
    { id: 'A21-3', article: 'Art. 21(2)(c)', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:bcm'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'IT-Betrieb', en: 'IT operations', fr: 'Exploitation IT' }, name: { de: 'Business Continuity & Backup-Management', en: 'Business continuity & backup', fr: 'Continuité & sauvegarde' } },
    { id: 'A21-4', article: 'Art. 21(2)(d)', categoryId: 'supply', mandatory: true, rule: { requiresAll: ['measures:supplychainsec'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Einkauf / Lieferantenmgmt', en: 'Procurement / vendor mgmt', fr: 'Achats / fournisseurs' }, name: { de: 'Sicherheit der Lieferkette', en: 'Supply chain security', fr: 'Sécurité de la chaîne' } },
    { id: 'A21-5', article: 'Art. 21(2)(e)', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:vuln'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT-Betrieb', en: 'IT operations', fr: 'Exploitation IT' }, name: { de: 'Sicherheit bei Beschaffung, Entwicklung & Wartung', en: 'Security in acquisition, development & maintenance', fr: 'Sécurité acquisition & maintenance' } },
    { id: 'A21-6', article: 'Art. 21(2)(f)', categoryId: 'rm', mandatory: true, rule: { requiresAll: ['measures:audit'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'CISO / IT-Sicherheit', en: 'CISO / IT security', fr: 'RSSI' }, name: { de: 'Bewertung der Wirksamkeit der Maßnahmen', en: 'Effectiveness assessment of measures', fr: "Évaluation de l'efficacité" } },
    { id: 'A21-7', article: 'Art. 21(2)(g)', categoryId: 'ops', mandatory: true, rule: { requiresAll: ['measures:training'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'CISO / IT-Sicherheit', en: 'CISO / IT security', fr: 'RSSI' }, name: { de: 'Cyberhygiene & Schulungen', en: 'Cyber hygiene & training', fr: 'Cyberhygiène & formation' } },
    { id: 'A21-8', article: 'Art. 21(2)(h)', categoryId: 'tech', mandatory: true, rule: { requiresAll: ['measures:crypto'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Sicherheit', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'Kryptografie & Verschlüsselung', en: 'Cryptography & encryption', fr: 'Cryptographie' } },
    { id: 'A21-9', article: 'Art. 21(2)(i)', categoryId: 'tech', mandatory: true, rule: { requiresAny: ['measures:mfa', 'roles:dpo'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT-Sicherheit / HR', en: 'IT security / HR', fr: 'Sécurité IT / RH' }, name: { de: 'Personalsicherheit & Zugriffskontrolle', en: 'HR security & access control', fr: 'Sécurité RH & accès' } },
    { id: 'A21-10', article: 'Art. 21(2)(j)', categoryId: 'tech', mandatory: true, rule: { requiresAll: ['measures:mfa'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'IT-Sicherheit', en: 'IT security', fr: 'Sécurité IT' }, name: { de: 'MFA & gesicherte Kommunikation', en: 'MFA & secured communications', fr: 'MFA & communications' } },
    { id: 'A23-1', article: 'Art. 23', categoryId: 'report', weight: 2, mandatory: true, rule: { requiresAll: ['measures:incident'], requiresAny: ['roles:irt'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'CISO / Compliance', en: 'CISO / Compliance', fr: 'RSSI / Conformité' }, name: { de: 'Meldepflichten (24h/72h/1 Monat)', en: 'Reporting obligations (24h/72h/1 month)', fr: 'Obligations de notification' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme Utilities GmbH',
    sectors: ['energy', 'water'],
    classification: 'essential',
    description:
      'Regional energy and water utility with approx. 850 employees. Operates electricity, gas and water distribution networks, SCADA / control systems and a customer portal. On-premises data centre plus Microsoft 365 cloud. Critical systems: network control centre, billing system (SAP IS-U), GIS.',
    supplyChain: ['cloud', 'software', 'ot'],
    roles: ['mgmt', 'ciso', 'dpo', 'risk'],
    knownIssues:
      'No consistent MFA for administrative access in OT. BCM plan exists, but no full recovery test since 2023. Supplier contracts lack uniform security clauses. Vulnerability scans only in IT, not OT.',
    measures: ['riskpolicy', 'incident', 'bcm', 'vuln', 'crypto', 'training', 'audit'],
    measures__mat__riskpolicy: 'documented',
    measures__mat__incident: 'documented',
    measures__mat__bcm: 'existing',
    measures__mat__vuln: 'audited',
    measures__mat__crypto: 'documented',
    measures__mat__training: 'existing',
    measures__mat__audit: 'certified',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Versorger — auditreif', en: 'Utility — audit-ready', fr: 'Distributeur — prêt pour l’audit' },
      description: {
        de: 'Großer Energie-/Wasserversorger mit reifem ISMS und wenigen Lücken.',
        en: 'Large energy/water utility with a mature ISMS and few gaps.',
        fr: 'Grand distributeur énergie/eau avec SMSI mature et peu de lacunes.',
      },
      answers: {
        entityName: 'Acme Utilities GmbH',
        sectors: ['energy', 'water'],
        classification: 'essential',
        description:
          'Regional energy and water utility with approx. 850 employees. Operates electricity, gas and water distribution networks, SCADA / control systems and a customer portal. On-premises data centre plus Microsoft 365 cloud. Critical systems: network control centre, billing system (SAP IS-U), GIS.',
        supplyChain: ['cloud', 'software', 'ot'],
        roles: ['mgmt', 'ciso', 'dpo', 'risk', 'irt'],
        knownIssues:
          'BCM plan exists, but no full recovery test since 2023. Supplier contracts lack uniform security clauses. Vulnerability scans cover IT but only partially OT.',
        measures: ['riskpolicy', 'incident', 'bcm', 'supplychainsec', 'vuln', 'crypto', 'mfa', 'training', 'audit'],
        measures__mat__riskpolicy: 'audited',
        measures__mat__incident: 'documented',
        measures__mat__bcm: 'documented',
        measures__mat__supplychainsec: 'documented',
        measures__mat__vuln: 'audited',
        measures__mat__crypto: 'documented',
        measures__mat__mfa: 'documented',
        measures__mat__training: 'documented',
        measures__mat__audit: 'certified',
      },
    },
    {
      id: 'developing',
      label: { de: 'Hersteller — im Aufbau', en: 'Manufacturer — developing', fr: 'Fabricant — en développement' },
      description: {
        de: 'Mittelständischer Produktionsbetrieb mit Teil-Maßnahmen und Doku-Lücken.',
        en: 'Mid-size manufacturer with partial controls and documentation gaps.',
        fr: 'PME industrielle avec mesures partielles et lacunes documentaires.',
      },
      answers: {
        entityName: 'Norddeutsche Maschinenbau AG',
        sectors: ['manufacturing'],
        classification: 'important',
        description:
          'Mid-size mechanical-engineering company with approx. 420 employees and two production sites. Mixed IT/OT environment with networked CNC machines, an ERP system and a cloud-based CAD/PLM platform. Security is driven by a small IT team without a dedicated CISO.',
        supplyChain: ['cloud', 'software', 'ot'],
        roles: ['mgmt', 'ciso'],
        knownIssues:
          'No formal risk-management process; policies are partly informal. Incident handling is ad hoc without a defined escalation path. No regular awareness training. Backups exist but restore tests are irregular.',
        measures: ['riskpolicy', 'incident', 'bcm', 'vuln'],
        measures__mat__riskpolicy: 'existing',
        measures__mat__incident: 'existing',
        measures__mat__bcm: 'existing',
        measures__mat__vuln: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Digitaldienst — Frühphase', en: 'Digital service — early stage', fr: 'Service numérique — phase initiale' },
      description: {
        de: 'Kleiner Digitaldienstleister, kaum formalisierte Maßnahmen, viele Lücken.',
        en: 'Small digital service provider with few formal controls and many gaps.',
        fr: 'Petit prestataire numérique, peu de mesures formelles, nombreuses lacunes.',
      },
      answers: {
        entityName: 'Cloudwerk Solutions GmbH',
        sectors: ['digital'],
        classification: 'unsure',
        description:
          'Fast-growing SaaS provider with approx. 60 employees offering a B2B scheduling platform. Fully cloud-native on a single hyperscaler, small engineering-led team. Security has so far been handled informally alongside product development.',
        supplyChain: ['cloud', 'software'],
        roles: ['mgmt'],
        knownIssues:
          'No documented risk analysis or security policies. No incident-response plan and no defined reporting process. MFA only on some admin accounts. No business-continuity plan and no security audits performed.',
        measures: ['crypto'],
        measures__mat__crypto: 'existing',
      },
    },
  ],
};
