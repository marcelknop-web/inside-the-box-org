import type { StandardProfile } from './types';

// ── AI Act profile ──────────────────────────────────────────────
// Regulation (EU) 2024/1689 (Artificial Intelligence Act).
// Intake captures the operator role, the AI system's risk classification
// and the implemented governance/technical measures; the engine assesses
// the obligations below strictly against the supplied evidence
// (no invented findings — Data Integrity Policy).

export const AIACT_PROFILE: StandardProfile = {
  id: 'aiact',
  name: 'AI Act',
  icon: 'Sparkles',
  available: true,
  fullName: {
    de: 'KI-Verordnung — Konformitätsprüfung',
    en: 'AI Act Conformity Assessment',
    fr: 'Évaluation de conformité — Règlement IA',
  },
  regulation: {
    de: 'Verordnung (EU) 2024/1689',
    en: 'Regulation (EU) 2024/1689',
    fr: 'Règlement (UE) 2024/1689',
  },
  description: {
    de: 'Audit-Workflow zur Konformität von KI-Systemen mit der EU-KI-Verordnung.',
    en: 'Conformity audit workflow for AI systems under the EU AI Act.',
    fr: "Flux d'audit de conformité des systèmes d'IA selon le règlement IA de l'UE.",
  },
  intake: [
    {
      title: { de: 'Akteur & KI-System', en: 'Operator & AI system', fr: "Opérateur & système d'IA" },
      subtitle: {
        de: 'Wer wird bewertet?',
        en: 'Who is being assessed?',
        fr: 'Qui est évalué ?',
      },
      info: {
        de: 'Die Rolle in der KI-Wertschöpfungskette bestimmt den Pflichtumfang (Art. 3, Kap. III).',
        en: 'The role in the AI value chain drives the scope of obligations (Art. 3, Chapter III).',
        fr: "Le rôle dans la chaîne de valeur de l'IA détermine l'étendue des obligations (art. 3, chap. III).",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Name der Organisation', en: 'Organisation name', fr: "Nom de l'organisation" },
          placeholder: { de: 'z. B. Muster AI GmbH', en: 'e.g. Acme AI Ltd', fr: 'p. ex. Exemple IA SARL' },
        },
        {
          id: 'operatorRole',
          type: 'single',
          required: true,
          label: { de: 'Rolle nach KI-VO', en: 'Role under the AI Act', fr: "Rôle selon le règlement IA" },
          options: [
            { id: 'provider', icon: '🏭', label: { de: 'Anbieter', en: 'Provider', fr: 'Fournisseur' }, desc: { de: 'Entwickelt / bringt KI in Verkehr', en: 'Develops / places AI on the market', fr: 'Développe / met sur le marché' } },
            { id: 'deployer', icon: '🏢', label: { de: 'Betreiber', en: 'Deployer', fr: 'Déployeur' }, desc: { de: 'Setzt KI unter eigener Verantwortung ein', en: 'Uses AI under own authority', fr: "Utilise l'IA sous sa responsabilité" } },
            { id: 'importer', icon: '📦', label: { de: 'Einführer / Händler', en: 'Importer / distributor', fr: 'Importateur / distributeur' } },
            { id: 'gpai', icon: '🧠', label: { de: 'Anbieter von GPAI-Modellen', en: 'GPAI model provider', fr: 'Fournisseur de modèles IAUG' }, desc: { de: 'Allzweck-KI-Modelle', en: 'General-purpose AI models', fr: "Modèles d'IA à usage général" } },
            { id: 'both', icon: '🔁', label: { de: 'Anbieter und Betreiber', en: 'Provider and deployer', fr: 'Fournisseur et déployeur' } },
          ],
        },
        {
          id: 'riskClass',
          type: 'single',
          required: true,
          label: { de: 'Risikoklasse des KI-Systems', en: 'Risk class of the AI system', fr: "Classe de risque du système d'IA" },
          options: [
            { id: 'prohibited', label: { de: 'Verbotene Praktik (Art. 5)', en: 'Prohibited practice (Art. 5)', fr: 'Pratique interdite (art. 5)' }, desc: { de: 'Unzulässig', en: 'Not permitted', fr: 'Non autorisé' } },
            { id: 'highrisk', label: { de: 'Hochrisiko (Anhang III / Art. 6)', en: 'High-risk (Annex III / Art. 6)', fr: 'Haut risque (annexe III / art. 6)' }, desc: { de: 'Voller Pflichtkatalog', en: 'Full obligations', fr: 'Obligations complètes' } },
            { id: 'limited', label: { de: 'Begrenztes Risiko (Art. 50)', en: 'Limited risk (Art. 50)', fr: 'Risque limité (art. 50)' }, desc: { de: 'Transparenzpflichten', en: 'Transparency duties', fr: 'Obligations de transparence' } },
            { id: 'minimal', label: { de: 'Minimales Risiko', en: 'Minimal risk', fr: 'Risque minimal' }, desc: { de: 'Freiwilliger Kodex', en: 'Voluntary code', fr: 'Code volontaire' } },
            { id: 'unsure', label: { de: 'Unklar', en: 'Unsure', fr: 'Incertain' }, desc: { de: 'Einstufung soll mitbewertet werden', en: 'Classification to be assessed too', fr: 'Classification à évaluer' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Kontext & Einsatzzweck', en: 'Context & intended purpose', fr: "Contexte & finalité" },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung des KI-Systems & Zweckbestimmung', en: 'Description of the AI system & intended purpose', fr: "Description du système d'IA & finalité" },
          placeholder: { de: 'Modelltyp, Anwendungsbereich, betroffene Personen, Datenquellen …', en: 'Model type, domain, affected persons, data sources …', fr: 'Type de modèle, domaine, personnes concernées, sources de données …' },
        },
        {
          id: 'domains',
          type: 'multi',
          label: { de: 'Anwendungsbereiche (Anhang III)', en: 'Application domains (Annex III)', fr: 'Domaines (annexe III)' },
          options: [
            { id: 'biometrics', icon: '👁️', label: { de: 'Biometrie', en: 'Biometrics', fr: 'Biométrie' } },
            { id: 'critical', icon: '⚡', label: { de: 'Kritische Infrastruktur', en: 'Critical infrastructure', fr: 'Infrastructure critique' } },
            { id: 'education', icon: '🎓', label: { de: 'Bildung & Ausbildung', en: 'Education & training', fr: 'Éducation & formation' } },
            { id: 'employment', icon: '👔', label: { de: 'Beschäftigung / HR', en: 'Employment / HR', fr: 'Emploi / RH' } },
            { id: 'essential', icon: '🏥', label: { de: 'Wesentliche Dienste (Kredit, Versicherung)', en: 'Essential services (credit, insurance)', fr: 'Services essentiels (crédit, assurance)' } },
            { id: 'lawenf', icon: '⚖️', label: { de: 'Strafverfolgung / Justiz', en: 'Law enforcement / justice', fr: 'Application de la loi / justice' } },
            { id: 'migration', icon: '🛂', label: { de: 'Migration & Grenzkontrolle', en: 'Migration & border control', fr: 'Migration & contrôle aux frontières' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Leitung eingebunden', en: 'Management involved', fr: 'Direction impliquée' } },
            { id: 'aigov', icon: '🧭', label: { de: 'KI-Governance-/Compliance-Funktion', en: 'AI governance / compliance function', fr: 'Fonction gouvernance / conformité IA' } },
            { id: 'oversight', icon: '🧑‍✈️', label: { de: 'Benannte menschliche Aufsicht', en: 'Designated human oversight', fr: 'Surveillance humaine désignée' } },
            { id: 'dpo', icon: '🔐', label: { de: 'Datenschutz / DPO', en: 'Data protection / DPO', fr: 'Protection des données / DPO' } },
            { id: 'literacy', icon: '📚', label: { de: 'KI-Kompetenzprogramm (Art. 4)', en: 'AI literacy programme (Art. 4)', fr: 'Programme de littératie IA (art. 4)' } },
            { id: 'audit', icon: '📋', label: { de: 'Interne Revision / Kontrolle', en: 'Internal audit / control', fr: 'Audit interne / contrôle' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine technische Dokumentation, keine Konformitätsbewertung, keine Registrierung …', en: 'e.g. no technical documentation, no conformity assessment, no registration …', fr: 'p. ex. pas de documentation technique, pas d\'évaluation de conformité …' },
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
          label: { de: 'KI-Konformitätsmaßnahmen', en: 'AI compliance measures', fr: 'Mesures de conformité IA' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'riskmgmt', label: { de: 'Risikomanagementsystem (Art. 9)', en: 'Risk management system (Art. 9)', fr: 'Système de gestion des risques (art. 9)' } },
            { id: 'datagov', label: { de: 'Daten-Governance & Datenqualität (Art. 10)', en: 'Data governance & quality (Art. 10)', fr: 'Gouvernance & qualité des données (art. 10)' } },
            { id: 'techdoc', label: { de: 'Technische Dokumentation (Art. 11)', en: 'Technical documentation (Art. 11)', fr: 'Documentation technique (art. 11)' } },
            { id: 'logging', label: { de: 'Protokollierung / Aufzeichnungen (Art. 12)', en: 'Logging / record-keeping (Art. 12)', fr: 'Journalisation / enregistrements (art. 12)' } },
            { id: 'transparency', label: { de: 'Transparenz & Nutzerinformation (Art. 13)', en: 'Transparency & user information (Art. 13)', fr: 'Transparence & information (art. 13)' } },
            { id: 'oversight', label: { de: 'Menschliche Aufsicht (Art. 14)', en: 'Human oversight (Art. 14)', fr: 'Surveillance humaine (art. 14)' } },
            { id: 'accuracy', label: { de: 'Genauigkeit, Robustheit & Cybersicherheit (Art. 15)', en: 'Accuracy, robustness & cybersecurity (Art. 15)', fr: 'Exactitude, robustesse & cybersécurité (art. 15)' } },
            { id: 'qms', label: { de: 'Qualitätsmanagementsystem (Art. 17)', en: 'Quality management system (Art. 17)', fr: 'Système de gestion de la qualité (art. 17)' } },
            { id: 'fra', label: { de: 'Grundrechte-Folgenabschätzung (Art. 27)', en: 'Fundamental rights impact assessment (Art. 27)', fr: 'Analyse d\'impact sur les droits fondamentaux (art. 27)' } },
            { id: 'conformity', label: { de: 'Konformitätsbewertung & CE (Art. 43/47/48)', en: 'Conformity assessment & CE (Art. 43/47/48)', fr: 'Évaluation de conformité & CE (art. 43/47/48)' } },
            { id: 'registration', label: { de: 'EU-Datenbank-Registrierung (Art. 49)', en: 'EU database registration (Art. 49)', fr: 'Enregistrement base UE (art. 49)' } },
            { id: 'transparency50', label: { de: 'Kennzeichnung (Chatbots/Deepfakes, Art. 50)', en: 'Marking (chatbots/deepfakes, Art. 50)', fr: 'Marquage (chatbots/deepfakes, art. 50)' } },
            { id: 'monitoring', label: { de: 'Post-Market-Monitoring (Art. 72)', en: 'Post-market monitoring (Art. 72)', fr: 'Surveillance post-commercialisation (art. 72)' } },
            { id: 'incident', label: { de: 'Meldung schwerwiegender Vorfälle (Art. 73)', en: 'Serious incident reporting (Art. 73)', fr: 'Signalement d\'incidents graves (art. 73)' } },
            { id: 'literacy', label: { de: 'KI-Kompetenz der Mitarbeitenden (Art. 4)', en: 'Staff AI literacy (Art. 4)', fr: 'Littératie IA du personnel (art. 4)' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'gov', name: { de: 'Governance & KI-Kompetenz', en: 'Governance & AI literacy', fr: 'Gouvernance & littératie IA' }, weight: 2 },
    { id: 'rm', name: { de: 'Risiko- & Datenmanagement', en: 'Risk & data management', fr: 'Gestion des risques & données' }, weight: 2 },
    { id: 'doc', name: { de: 'Dokumentation & Protokollierung', en: 'Documentation & logging', fr: 'Documentation & journalisation' } },
    { id: 'transp', name: { de: 'Transparenz & menschliche Aufsicht', en: 'Transparency & human oversight', fr: 'Transparence & surveillance humaine' }, weight: 2 },
    { id: 'tech', name: { de: 'Technische Robustheit', en: 'Technical robustness', fr: 'Robustesse technique' } },
    { id: 'conf', name: { de: 'Konformität & Registrierung', en: 'Conformity & registration', fr: 'Conformité & enregistrement' }, weight: 2 },
    { id: 'monitor', name: { de: 'Marktbeobachtung & Meldewesen', en: 'Market monitoring & reporting', fr: 'Surveillance du marché & signalement' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'A4-1', article: 'Art. 4', categoryId: 'gov', mandatory: true, rule: { requiresAll: ['measures:literacy'], requiresAny: ['roles:literacy'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'HR / KI-Governance', en: 'HR / AI governance', fr: 'RH / gouvernance IA' }, name: { de: 'KI-Kompetenz der Mitarbeitenden', en: 'AI literacy of staff', fr: 'Littératie IA du personnel' }, criteria: [
      { de: 'Mitarbeitende mit KI-Bezug verfügen über ausreichende KI-Kompetenz', en: 'Staff dealing with AI have sufficient AI literacy', fr: "Le personnel concerné dispose d'une littératie IA suffisante" },
    ] },
    { id: 'A9-1', article: 'Art. 9', categoryId: 'rm', weight: 2, mandatory: true, rule: { requiresAll: ['measures:riskmgmt'], requiresAny: ['roles:aigov'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'KI-Governance', en: 'AI governance', fr: 'Gouvernance IA' }, name: { de: 'Risikomanagementsystem', en: 'Risk management system', fr: 'Système de gestion des risques' }, criteria: [
      { de: 'Kontinuierliches Risikomanagement über den gesamten Lebenszyklus', en: 'Continuous risk management across the lifecycle', fr: 'Gestion des risques continue sur tout le cycle de vie' },
    ] },
    { id: 'A10-1', article: 'Art. 10', categoryId: 'rm', weight: 2, mandatory: true, rule: { requiresAll: ['measures:datagov'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Data Science / DPO', en: 'Data science / DPO', fr: 'Data science / DPO' }, name: { de: 'Daten-Governance & Datenqualität', en: 'Data governance & data quality', fr: 'Gouvernance & qualité des données' } },
    { id: 'A11-1', article: 'Art. 11', categoryId: 'doc', mandatory: true, rule: { requiresAll: ['measures:techdoc'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Produkt / Engineering', en: 'Product / engineering', fr: 'Produit / ingénierie' }, name: { de: 'Technische Dokumentation', en: 'Technical documentation', fr: 'Documentation technique' } },
    { id: 'A12-1', article: 'Art. 12', categoryId: 'doc', mandatory: true, rule: { requiresAll: ['measures:logging'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Engineering', en: 'Engineering', fr: 'Ingénierie' }, name: { de: 'Protokollierung & Aufzeichnungen', en: 'Record-keeping & logging', fr: 'Journalisation & enregistrements' } },
    { id: 'A13-1', article: 'Art. 13', categoryId: 'transp', mandatory: true, rule: { requiresAll: ['measures:transparency'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Produkt', en: 'Product', fr: 'Produit' }, name: { de: 'Transparenz & Bereitstellung von Informationen', en: 'Transparency & provision of information', fr: 'Transparence & fourniture d\'informations' } },
    { id: 'A14-1', article: 'Art. 14', categoryId: 'transp', weight: 2, mandatory: true, rule: { requiresAll: ['measures:oversight'], requiresAny: ['roles:oversight'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Menschliche Aufsicht', en: 'Human oversight', fr: 'Surveillance humaine' }, name: { de: 'Menschliche Aufsicht', en: 'Human oversight', fr: 'Surveillance humaine' } },
    { id: 'A15-1', article: 'Art. 15', categoryId: 'tech', mandatory: true, rule: { requiresAll: ['measures:accuracy'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Engineering / Security', en: 'Engineering / security', fr: 'Ingénierie / sécurité' }, name: { de: 'Genauigkeit, Robustheit & Cybersicherheit', en: 'Accuracy, robustness & cybersecurity', fr: 'Exactitude, robustesse & cybersécurité' } },
    { id: 'A17-1', article: 'Art. 17', categoryId: 'conf', mandatory: true, rule: { requiresAll: ['measures:qms'], requiresAny: ['roles:aigov'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'KI-Governance', en: 'AI governance', fr: 'Gouvernance IA' }, name: { de: 'Qualitätsmanagementsystem', en: 'Quality management system', fr: 'Système de gestion de la qualité' } },
    { id: 'A27-1', article: 'Art. 27', categoryId: 'rm', mandatory: false, rule: { requiresAll: ['measures:fra'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Compliance / DPO', en: 'Compliance / DPO', fr: 'Conformité / DPO' }, name: { de: 'Grundrechte-Folgenabschätzung', en: 'Fundamental rights impact assessment', fr: 'Analyse d\'impact sur les droits fondamentaux' } },
    { id: 'A43-1', article: 'Art. 43', categoryId: 'conf', weight: 2, mandatory: true, rule: { requiresAll: ['measures:conformity'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Compliance / QM', en: 'Compliance / QA', fr: 'Conformité / QA' }, name: { de: 'Konformitätsbewertung, EU-Konformitätserklärung & CE', en: 'Conformity assessment, EU declaration & CE marking', fr: 'Évaluation de conformité, déclaration UE & marquage CE' } },
    { id: 'A49-1', article: 'Art. 49', categoryId: 'conf', mandatory: true, rule: { requiresAll: ['measures:registration'], riskLikelihood: 2, riskImpact: 3 }, owner: { de: 'Compliance', en: 'Compliance', fr: 'Conformité' }, name: { de: 'Registrierung in der EU-Datenbank', en: 'Registration in the EU database', fr: 'Enregistrement dans la base de données UE' } },
    { id: 'A50-1', article: 'Art. 50', categoryId: 'transp', mandatory: true, rule: { requiresAll: ['measures:transparency50'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Produkt', en: 'Product', fr: 'Produit' }, name: { de: 'Transparenzpflichten (Chatbots, Deepfakes, generierte Inhalte)', en: 'Transparency obligations (chatbots, deepfakes, generated content)', fr: 'Obligations de transparence (chatbots, deepfakes, contenus générés)' } },
    { id: 'A72-1', article: 'Art. 72', categoryId: 'monitor', mandatory: true, rule: { requiresAll: ['measures:monitoring'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Produkt / QM', en: 'Product / QA', fr: 'Produit / QA' }, name: { de: 'Beobachtung nach dem Inverkehrbringen', en: 'Post-market monitoring', fr: 'Surveillance post-commercialisation' } },
    { id: 'A73-1', article: 'Art. 73', categoryId: 'monitor', mandatory: true, rule: { requiresAll: ['measures:incident'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Compliance / Meldewesen', en: 'Compliance / reporting', fr: 'Conformité / signalement' }, name: { de: 'Meldung schwerwiegender Vorfälle', en: 'Reporting of serious incidents', fr: 'Signalement des incidents graves' } },
    { id: 'A26-1', article: 'Art. 26', categoryId: 'gov', mandatory: false, rule: { requiresAny: ['roles:oversight', 'measures:oversight'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Betreiber', en: 'Deployer', fr: 'Déployeur' }, name: { de: 'Pflichten der Betreiber von Hochrisiko-KI', en: 'Obligations of deployers of high-risk AI', fr: 'Obligations des déployeurs d\'IA à haut risque' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'Acme AI GmbH',
    operatorRole: 'both',
    riskClass: 'highrisk',
    description:
      'SaaS provider deploying a high-risk AI system that automates CV screening and candidate ranking for corporate HR departments across the EU. The model is trained on historical hiring data and integrates with applicant tracking systems. Affected persons: job applicants. Data sources: internal hiring records and enriched profile data.',
    domains: ['employment'],
    roles: ['mgmt', 'aigov', 'oversight', 'dpo'],
    knownIssues:
      'Technical documentation exists but is not yet aligned to Annex IV. No fundamental rights impact assessment performed. Conformity assessment not started and the system is not registered in the EU database. Human oversight is defined but oversight staff are not formally trained.',
    measures: ['riskmgmt', 'datagov', 'techdoc', 'logging', 'transparency', 'oversight', 'accuracy', 'qms', 'monitoring'],
    measures__mat__riskmgmt: 'documented',
    measures__mat__datagov: 'documented',
    measures__mat__techdoc: 'existing',
    measures__mat__logging: 'documented',
    measures__mat__transparency: 'documented',
    measures__mat__oversight: 'existing',
    measures__mat__accuracy: 'documented',
    measures__mat__qms: 'existing',
    measures__mat__monitoring: 'existing',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Hochrisiko-Anbieter — auditreif', en: 'High-risk provider — audit-ready', fr: 'Fournisseur haut risque — prêt pour l\'audit' },
      description: {
        de: 'KI-Anbieter mit reifem QMS und nahezu vollständiger Konformität.',
        en: 'AI provider with a mature QMS and near-complete conformity.',
        fr: 'Fournisseur IA avec SGQ mature et conformité quasi complète.',
      },
      answers: {
        entityName: 'Acme AI GmbH',
        operatorRole: 'provider',
        riskClass: 'highrisk',
        description:
          'Provider of a high-risk AI system for automated credit-scoring used by banks across the EU. Mature MLOps pipeline, documented data governance, independent validation and a designated human-oversight team. Affected persons: loan applicants.',
        domains: ['essential'],
        roles: ['mgmt', 'aigov', 'oversight', 'dpo', 'literacy', 'audit'],
        knownIssues:
          'Registration in the EU database is in progress. Post-market monitoring metrics are defined but only partially automated.',
        measures: ['riskmgmt', 'datagov', 'techdoc', 'logging', 'transparency', 'oversight', 'accuracy', 'qms', 'fra', 'conformity', 'monitoring', 'incident', 'literacy'],
        measures__mat__riskmgmt: 'audited',
        measures__mat__datagov: 'documented',
        measures__mat__techdoc: 'documented',
        measures__mat__logging: 'documented',
        measures__mat__transparency: 'documented',
        measures__mat__oversight: 'documented',
        measures__mat__accuracy: 'audited',
        measures__mat__qms: 'audited',
        measures__mat__fra: 'documented',
        measures__mat__conformity: 'documented',
        measures__mat__monitoring: 'documented',
        measures__mat__incident: 'documented',
        measures__mat__literacy: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'Betreiber — im Aufbau', en: 'Deployer — developing', fr: 'Déployeur — en développement' },
      description: {
        de: 'Betreiber eines Hochrisiko-Systems mit Teil-Konformität und Lücken.',
        en: 'Deployer of a high-risk system with partial conformity and gaps.',
        fr: 'Déployeur d\'un système haut risque avec conformité partielle.',
      },
      answers: {
        entityName: 'NordHR Solutions SA',
        operatorRole: 'deployer',
        riskClass: 'highrisk',
        description:
          'Mid-sized company deploying a third-party high-risk AI system for employee performance evaluation. Relies on the provider\'s documentation and conducts limited internal oversight. Affected persons: employees.',
        domains: ['employment'],
        roles: ['mgmt', 'aigov', 'dpo'],
        knownIssues:
          'Human oversight assignments are informal. No fundamental rights impact assessment. Logging from the provider is not retained locally. Staff AI literacy programme not yet rolled out.',
        measures: ['riskmgmt', 'transparency', 'oversight', 'monitoring'],
        measures__mat__riskmgmt: 'existing',
        measures__mat__transparency: 'documented',
        measures__mat__oversight: 'existing',
        measures__mat__monitoring: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'GPAI-Startup — Frühphase', en: 'GPAI startup — early stage', fr: 'Startup IAUG — phase initiale' },
      description: {
        de: 'Junges Startup, kaum formalisierte KI-Governance, viele Lücken.',
        en: 'Young startup with little formal AI governance and many gaps.',
        fr: 'Jeune startup, gouvernance IA peu formalisée, nombreuses lacunes.',
      },
      answers: {
        entityName: 'Lumen Generative Labs',
        operatorRole: 'gpai',
        riskClass: 'limited',
        description:
          'Startup offering a generative AI assistant (chatbot) and an image-generation API. Roughly 25 employees. Governance handled informally by the founding team alongside product work. Affected persons: end users of the chatbot.',
        domains: [],
        roles: ['mgmt'],
        knownIssues:
          'No documented risk-management or quality-management system. No technical documentation aligned to the Act. AI-generated content is not consistently marked. No post-market monitoring or incident-reporting process. No staff AI literacy programme.',
        measures: ['transparency50'],
        measures__mat__transparency50: 'existing',
      },
    },
  ],
};
