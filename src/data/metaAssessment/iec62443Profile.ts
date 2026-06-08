import type { StandardProfile } from './types';

// ── IEC 62443 profile ─────────────────────────────────────────────
// IEC 62443 — Security for industrial automation and control
// systems (IACS). Covers the lifecycle from security programme
// (SR 1.1), risk assessment (SR 2.1), system security (SR 3.x),
// component security (SR 4.x) to operations & maintenance (SR 6.x).
// The engine assesses the requirements below strictly against the
// supplied evidence (no invented findings — Data Integrity Policy).

export const IEC62443_PROFILE: StandardProfile = {
  id: 'iec62443',
  name: 'IEC 62443',
  icon: 'Factory',
  available: true,
  fullName: {
    de: 'IEC 62443 — OT-/IACS-Sicherheit',
    en: 'IEC 62443 — OT / IACS Security',
    fr: 'IEC 62443 — Sécurité OT / IACS',
  },
  regulation: {
    de: 'IEC 62443 Familie',
    en: 'IEC 62443 Family',
    fr: 'Famille IEC 62443',
  },
  description: {
    de: 'Sicherheitsbewertung industrieller Automatisierungssysteme (IEC 62443).',
    en: 'Security assessment for industrial automation systems (IEC 62443).',
    fr: "Évaluation de sécurité des systèmes d'automatisation industrielle (IEC 62443).",
  },
  intake: [
    {
      title: { de: 'Organisation & IACS-Geltungsbereich', en: 'Organisation & IACS scope', fr: 'Organisation & périmètre IACS' },
      subtitle: {
        de: 'Welche IACS-Umgebung wird bewertet?',
        en: 'Which IACS environment is being assessed?',
        fr: 'Quel environnement IACS est évalué ?',
      },
      info: {
        de: 'IEC 62443 strukturiert die OT-Sicherheit über Security-Level (SL), Zonen & Leitungen und den gesamten Lebenszyklus.',
        en: 'IEC 62443 structures OT security through Security Levels (SL), zones & conduits, and the full lifecycle.',
        fr: 'IEC 62443 structure la sécurité OT via les niveaux de sécurité (SL), les zones & conduits et le cycle de vie complet.',
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Organisation / Anlage', en: 'Organisation / facility', fr: 'Organisation / installation' },
          placeholder: { de: 'z. B. Chemiepark Nord, Produktionslinie A', en: 'e.g. North Chemical Park, Production Line A', fr: 'p. ex. Parc chimique Nord, Ligne de production A' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle / Verantwortung', en: 'Role / responsibility', fr: 'Rôle / responsabilité' },
          options: [
            { id: 'owner', icon: '🏢', label: { de: 'OT-Sicherheitsverantwortung', en: 'OT security owner', fr: 'Responsable sécurité OT' }, desc: { de: 'OT-Security-Programm-Verantwortung', en: 'OT security programme ownership', fr: 'Responsabilité programme sécurité OT' } },
            { id: 'engineer', icon: '🔧', label: { de: 'OT-Ingenieur / Integrator', en: 'OT engineer / integrator', fr: 'Ingénieur OT / intégrateur' } },
            { id: 'supplier', icon: '🏭', label: { de: 'Anbieter / Hersteller', en: 'Supplier / manufacturer', fr: 'Fournisseur / fabricant' } },
            { id: 'consultant', icon: '🤝', label: { de: 'Berater / Auditor', en: 'Consultant / auditor', fr: 'Consultant / auditeur' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Bewertungs-Kontext', en: 'Assessment context', fr: "Contexte d'évaluation" },
          options: [
            { id: 'first', label: { de: 'Erst-Bewertung / Zertifizierung', en: 'First assessment / certification', fr: 'Première évaluation / certification' } },
            { id: 'recert', label: { de: 'Re-Zertifizierung', en: 'Re-certification', fr: 'Recertification' } },
            { id: 'internal', label: { de: 'Internes Audit / Vorbereitung', en: 'Internal audit / preparation', fr: 'Audit interne / préparation' } },
            { id: 'gap', label: { de: 'Gap-Analyse', en: 'Gap analysis', fr: 'Analyse des écarts' } },
          ],
        },
      ],
    },
    {
      title: { de: 'IACS-Landschaft & Risikoprofil', en: 'IACS landscape & risk profile', fr: 'Paysage IACS & profil de risque' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der IACS-Umgebung, Zonen, Leitungen & kritischen Assets', en: 'Description of the IACS environment, zones, conduits & critical assets', fr: 'Description de l\'environnement IACS, zones, conduits & actifs critiques' },
          placeholder: { de: 'Prozesse, SPS, SCADA, Safety-Systeme, Netzwerksegmentierung, Fernzugriff, MES/ERP-Anbindung …', en: 'Processes, PLCs, SCADA, safety systems, network segmentation, remote access, MES/ERP links …', fr: 'Processus, API, SCADA, systèmes de sécurité, segmentation réseau, accès distant, liens MES/ERP …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kritische IACS-Komponenten', en: 'Critical IACS components', fr: 'Composants IACS critiques' },
          options: [
            { id: 'scada', icon: '🖥️', label: { de: 'SCADA / HMI', en: 'SCADA / HMI', fr: 'SCADA / IHM' } },
            { id: 'plc', icon: '🔌', label: { de: 'SPS / RTU / Feldbus', en: 'PLC / RTU / Fieldbus', fr: 'API / RTU / Fieldbus' } },
            { id: 'safety', icon: '🛡️', label: { de: 'Safety-Systeme (SIS)', en: 'Safety systems (SIS)', fr: 'Systèmes de sécurité (SIS)' } },
            { id: 'network', icon: '🌐', label: { de: 'Netzwerk / Firewall / DMZ', en: 'Network / firewall / DMZ', fr: 'Réseau / pare-feu / DMZ' } },
            { id: 'remote', icon: '🔑', label: { de: 'Fernzugriff / VPN / Remote', en: 'Remote access / VPN / remote', fr: 'Accès distant / VPN / télémaintenance' } },
            { id: 'mes', icon: '🔗', label: { de: 'MES / ERP / IT-Anbindung', en: 'MES / ERP / IT connection', fr: 'MES / ERP / lien IT' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Top-Management committed', en: 'Top management committed', fr: 'Direction engagée' } },
            { id: 'otsec', icon: '🔒', label: { de: 'Benannte OT-Security-Verantwortung', en: 'Designated OT security responsibility', fr: 'Responsabilité sécurité OT désignée' } },
            { id: 'csirt', icon: '🚨', label: { de: 'Incident-Response-Team / CSIRT', en: 'Incident response team / CSIRT', fr: 'Équipe de réponse / CSIRT' } },
            { id: 'policy', icon: '📜', label: { de: 'OT-Security-Politik & -Programm', en: 'OT security policy & programme', fr: 'Politique & programme sécurité OT' } },
            { id: 'zoning', icon: '🏗️', label: { de: 'Zonen & Leitungen dokumentiert', en: 'Zones & conduits documented', fr: 'Zones & conduits documentés' } },
            { id: 'patch', icon: '🔧', label: { de: 'Patch-/Change-Management etabliert', en: 'Patch / change management established', fr: 'Gestion des correctifs / changements établie' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine Zonenmodellierung, keine Security-Level-Ziele, ungepatchte SPSen, geteilte Anmeldedaten, unverschlüsselte Fernzugriffe …', en: 'e.g. no zone modelling, no security level targets, unpatched PLCs, shared credentials, unencrypted remote access …', fr: 'p. ex. pas de modélisation de zones, pas dobjectifs de niveau de sécurité, API non patchées, identifiants partagés …' },
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
          label: { de: 'IEC 62443-Maßnahmen', en: 'IEC 62443 measures', fr: 'Mesures IEC 62443' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'program', label: { de: 'Security-Programm & -Politik (SR 1.1)', en: 'Security programme & policy (SR 1.1)', fr: 'Programme & politique de sécurité (SR 1.1)' } },
            { id: 'roles', label: { de: 'Rollen, Verantwortlichkeiten & Kompetenz (SR 1.2)', en: 'Roles, responsibilities & competence (SR 1.2)', fr: 'Rôles, responsabilités & compétence (SR 1.2)' } },
            { id: 'risk', label: { de: 'Risikobeurteilung & Zonen/Leitungen (SR 2.1–2.3)', en: 'Risk assessment & zones / conduits (SR 2.1–2.3)', fr: 'Appréciation des risques & zones/conduits (SR 2.1–2.3)' } },
            { id: 'sl', label: { de: 'Security-Level-Ziele & -Nachweis (SL-T/SR)', en: 'Security level targets & evidence (SL-T/SR)', fr: 'Objectifs & preuves de niveau de sécurité (SL-T/SR)' } },
            { id: 'systemreq', label: { de: 'System-Sicherheitsanforderungen (SR 3.1–3.3)', en: 'System security requirements (SR 3.1–3.3)', fr: 'Exigences de sécurité système (SR 3.1–3.3)' } },
            { id: 'systemint', label: { de: 'Sichere System-Integration & Inbetriebnahme (SR 3.4)', en: 'Secure system integration & commissioning (SR 3.4)', fr: 'Intégration système sécurisée & mise en service (SR 3.4)' } },
            { id: 'hardening', label: { de: 'Härtung & Konfigurationsmanagement (SR 3.5)', en: 'Hardening & configuration management (SR 3.5)', fr: 'Durcissement & gestion de configuration (SR 3.5)' } },
            { id: 'product', label: { de: 'Komponenten-/Produkt-Sicherheit (SR 4.x)', en: 'Component / product security (SR 4.x)', fr: 'Sécurité composant/produit (SR 4.x)' } },
            { id: 'sdlc', label: { de: 'Sicherer Entwicklungs-Lebenszyklus (SDLC)', en: 'Secure development lifecycle (SDLC)', fr: 'Cycle de vie développement sécurisé (SDLC)' } },
            { id: 'patch', label: { de: 'Patch- & Schwachstellenmanagement', en: 'Patch & vulnerability management', fr: 'Gestion des correctifs & vulnérabilités' } },
            { id: 'backup', label: { de: 'Backup & Wiederherstellung', en: 'Backup & recovery', fr: 'Sauvegarde & récupération' } },
            { id: 'monitor', label: { de: 'Überwachung & Ereigniserkennung', en: 'Monitoring & event detection', fr: 'Surveillance & détection dévénements' } },
            { id: 'response', label: { de: 'Incident-Response & Wiederanlauf', en: 'Incident response & recovery', fr: 'Réponse incident & reprise' } },
            { id: 'audit', label: { de: 'Internes Audit & Managementbewertung', en: 'Internal audit & management review', fr: 'Audit interne & revue de direction' } },
            { id: 'improvement', label: { de: 'Kontinuierliche Verbesserung', en: 'Continual improvement', fr: 'Amélioration continue' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Programm & Governance', en: 'Programme & governance', fr: 'Programme & gouvernance' }, weight: 2 },
    { id: 'risk', name: { de: 'Risiko & Zonenmodell', en: 'Risk & zone model', fr: 'Risque & modèle de zones' }, weight: 2 },
    { id: 'system', name: { de: 'System-Sicherheit', en: 'System security', fr: 'Sécurité système' }, weight: 2 },
    { id: 'product', name: { de: 'Produkt-Sicherheit', en: 'Product security', fr: 'Sécurité produit' } },
    { id: 'ops', name: { de: 'Betrieb & Wartung', en: 'Operations & maintenance', fr: 'Opérations & maintenance' } },
    { id: 'improve', name: { de: 'Bewertung & Verbesserung', en: 'Evaluation & improvement', fr: 'Évaluation & amélioration' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'ICS-G1', article: 'IEC 62443-2-1 SR 1.1', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:program'], requiresAny: ['roles:otsec', 'roles:policy'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'OT-Security-Programm-Manager', en: 'OT security programme manager', fr: 'Responsable programme sécurité OT' }, name: { de: 'Security-Programm & -Politik', en: 'Security programme & policy', fr: 'Programme & politique de sécurité' }, criteria: [
      { de: 'Dokumentiertes OT-Security-Programm mit Politik, Rollen und Management-Commitment', en: 'Documented OT security programme with policy, roles and management commitment', fr: 'Programme sécurité OT documenté avec politique, rôles et engagement de la direction' },
    ] },
    { id: 'ICS-G2', article: 'IEC 62443-2-1 SR 1.2', categoryId: 'govern', mandatory: true, rule: { requiresAll: ['measures:roles'], requiresAny: ['roles:otsec', 'roles:csirt'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'OT-Security-Manager', en: 'OT security manager', fr: 'Responsable sécurité OT' }, name: { de: 'Rollen, Verantwortlichkeiten & Kompetenz', en: 'Roles, responsibilities & competence', fr: 'Rôles, responsabilités & compétence' } },
    { id: 'ICS-RA1', article: 'IEC 62443-2-1 SR 2.1', categoryId: 'risk', weight: 2, mandatory: true, rule: { requiresAll: ['measures:risk'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'OT-Risk / Engineering', en: 'OT risk / engineering', fr: 'Risque OT / ingénierie' }, name: { de: 'Risikobeurteilung & Zonen-/Leitungsmodell', en: 'Risk assessment & zone/conduit model', fr: 'Appréciation des risques & modèle zones/conduits' } },
    { id: 'ICS-RA2', article: 'IEC 62443-2-1 SR 2.3', categoryId: 'risk', weight: 2, mandatory: true, rule: { requiresAll: ['measures:sl'], requiresAny: ['roles:zoning'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'OT-Security-Architekt', en: 'OT security architect', fr: 'Architecte sécurité OT' }, name: { de: 'Security-Level-Ziele (SL-T) & -Nachweis (SL-A)', en: 'Security level targets (SL-T) & assurance (SL-A)', fr: 'Objectifs de niveau de sécurité (SL-T) & assurance (SL-A)' } },
    { id: 'ICS-SY1', article: 'IEC 62443-3-3 SR 3.1–3.3', categoryId: 'system', weight: 2, mandatory: true, rule: { requiresAll: ['measures:systemreq'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'System-Integrator / OT-Engineering', en: 'System integrator / OT engineering', fr: 'Intégrateur système / ingénierie OT' }, name: { de: 'System-Sicherheitsanforderungen & -Design', en: 'System security requirements & design', fr: 'Exigences & conception de sécurité système' } },
    { id: 'ICS-SY2', article: 'IEC 62443-3-3 SR 3.4–3.5', categoryId: 'system', weight: 2, mandatory: true, rule: { requiresAll: ['measures:systemint'], requiresAny: ['measures:hardening'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'OT-Integrator / Betrieb', en: 'OT integrator / operations', fr: 'Intégrateur OT / exploitation' }, name: { de: 'Sichere Integration, Inbetriebnahme & Härtung', en: 'Secure integration, commissioning & hardening', fr: 'Intégration sécurisée, mise en service & durcissement' } },
    { id: 'ICS-PR1', article: 'IEC 62443-4-1 / 4-2', categoryId: 'product', mandatory: false, rule: { requiresAll: ['measures:product'], requiresAny: ['measures:sdlc'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Produktentwicklung / Hersteller', en: 'Product development / supplier', fr: 'Développement produit / fabricant' }, name: { de: 'Komponenten-Sicherheit & sicherer SDLC', en: 'Component security & secure SDLC', fr: 'Sécurité composant & SDLC sécurisé' } },
    { id: 'ICS-OP1', article: 'IEC 62443-2-1 SR 6.1–6.2', categoryId: 'ops', weight: 2, mandatory: true, rule: { requiresAll: ['measures:patch'], requiresAny: ['measures:backup'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'OT-Betrieb / Wartung', en: 'OT operations / maintenance', fr: 'Exploitation OT / maintenance' }, name: { de: 'Patch-, Change- & Backup-Management', en: 'Patch, change & backup management', fr: 'Gestion des correctifs, changements & sauvegardes' } },
    { id: 'ICS-OP2', article: 'IEC 62443-2-1 SR 6.3–6.4', categoryId: 'ops', weight: 2, mandatory: true, rule: { requiresAll: ['measures:monitor'], requiresAny: ['measures:response'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'SOC / OT-Security-Team', en: 'SOC / OT security team', fr: 'SOC / équipe sécurité OT' }, name: { de: 'Überwachung, Detektion & Incident-Response', en: 'Monitoring, detection & incident response', fr: 'Surveillance, détection & réponse incident' } },
    { id: 'ICS-IM1', article: 'IEC 62443-2-1 SR 7.1–7.2', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:audit'], requiresAny: ['roles:audit'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'OT-Security / Interne Revision', en: 'OT security / internal audit', fr: 'Sécurité OT / audit interne' }, name: { de: 'Internes Audit & Managementbewertung', en: 'Internal audit & management review', fr: 'Audit interne & revue de direction' } },
    { id: 'ICS-IM2', article: 'IEC 62443-2-1 SR 7.3–7.4', categoryId: 'improve', mandatory: true, rule: { requiresAll: ['measures:improvement'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'OT-Security-Manager', en: 'OT security manager', fr: 'Responsable sécurité OT' }, name: { de: 'Korrekturmaßnahmen & kontinuierliche Verbesserung', en: 'Corrective action & continual improvement', fr: 'Actions correctives & amélioration continue' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'ProcessControl Industries GmbH',
    role: 'owner',
    phase: 'first',
    description:
      'Chemical processing plant with DCS, SIS and SCADA. Network segmented into Level 0–3 with DMZ to corporate IT. Remote access via VPN for two integrators. First IEC 62443 assessment. Security level target SL-2 for the production zone.',
    systems: ['scada', 'plc', 'safety', 'network', 'remote', 'mes'],
    roles: ['mgmt', 'otsec', 'policy', 'zoning', 'patch'],
    knownIssues:
      'Some legacy PLCs not yet patched. Remote access logs reviewed manually, not automated. No formal incident response runbooks for OT. Backup of engineering workstations ad-hoc.',
    measures: ['program', 'roles', 'risk', 'sl', 'systemreq', 'systemint', 'hardening', 'product', 'sdlc', 'patch', 'backup', 'monitor', 'response', 'audit', 'improvement'],
    measures__mat__program: 'documented',
    measures__mat__roles: 'documented',
    measures__mat__risk: 'documented',
    measures__mat__sl: 'documented',
    measures__mat__systemreq: 'documented',
    measures__mat__systemint: 'existing',
    measures__mat__hardening: 'existing',
    measures__mat__product: 'existing',
    measures__mat__sdlc: 'existing',
    measures__mat__patch: 'existing',
    measures__mat__backup: 'existing',
    measures__mat__monitor: 'existing',
    measures__mat__response: 'existing',
    measures__mat__audit: 'existing',
    measures__mat__improvement: 'existing',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'SL-3 — auditreif', en: 'SL-3 — audit-ready', fr: 'SL-3 — prêt pour l\'audit' },
      description: {
        de: 'Reife OT-Security mit vollständigem Zonenmodell, automatisiertem Monitoring und geprüftem SL-Nachweis.',
        en: 'Mature OT security with complete zone model, automated monitoring and verified SL assurance.',
        fr: 'Sécurité OT mature avec modèle de zones complet, surveillance automatisée et assurance SL vérifiée.',
      },
      answers: {
        entityName: 'Advanced Manufacturing SA',
        role: 'owner',
        phase: 'recert',
        description:
          'Fully segmented IACS with documented zones and conduits. SL-3 targets validated. Automated patch management, centralised logging, OT SOC with 24/7 coverage. Incident response tested quarterly. Management review and internal audits on schedule.',
        systems: ['scada', 'plc', 'safety', 'network', 'remote', 'mes'],
        roles: ['mgmt', 'otsec', 'csirt', 'policy', 'zoning', 'patch'],
        knownIssues:
          'Minor finding on certificate expiry tracking for one vendor component. Corrected before the audit.',
        measures: ['program', 'roles', 'risk', 'sl', 'systemreq', 'systemint', 'hardening', 'product', 'sdlc', 'patch', 'backup', 'monitor', 'response', 'audit', 'improvement'],
        measures__mat__program: 'audited',
        measures__mat__roles: 'audited',
        measures__mat__risk: 'audited',
        measures__mat__sl: 'audited',
        measures__mat__systemreq: 'audited',
        measures__mat__systemint: 'audited',
        measures__mat__hardening: 'audited',
        measures__mat__product: 'audited',
        measures__mat__sdlc: 'audited',
        measures__mat__patch: 'audited',
        measures__mat__backup: 'audited',
        measures__mat__monitor: 'audited',
        measures__mat__response: 'audited',
        measures__mat__audit: 'audited',
        measures__mat__improvement: 'audited',
      },
    },
    {
      id: 'developing',
      label: { de: 'SL-1 erreicht — SL-2 im Aufbau', en: 'SL-1 reached — SL-2 developing', fr: 'SL-1 atteint — SL-2 en développement' },
      description: {
        de: 'Grundlegendes Zonenmodell vorhanden, aber Lücken bei Monitoring, Response und SL-Nachweis.',
        en: 'Basic zone model present, but gaps in monitoring, response and SL assurance.',
        fr: 'Modèle de zones de base en place, mais lacunes sur surveillance, réponse et assurance SL.',
      },
      answers: {
        entityName: 'MidChem Plant B',
        role: 'engineer',
        phase: 'internal',
        description:
          'Production site with SCADA and PLCs. Basic network segmentation between OT and IT. Firewall in place but no detailed conduit documentation. Remote access used but not consistently logged. Patch management manual.',
        systems: ['scada', 'plc', 'network'],
        roles: ['mgmt', 'otsec', 'policy'],
        knownIssues:
          'No formal incident response plan for OT. No automated monitoring of OT networks. Security levels not formally targeted or verified. Backup of PLC programs not regularly tested.',
        measures: ['program', 'roles', 'risk', 'systemreq', 'systemint', 'hardening', 'patch', 'backup'],
        measures__mat__program: 'documented',
        measures__mat__roles: 'existing',
        measures__mat__risk: 'existing',
        measures__mat__systemreq: 'existing',
        measures__mat__systemint: 'existing',
        measures__mat__hardening: 'existing',
        measures__mat__patch: 'existing',
        measures__mat__backup: 'existing',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Phase', en: 'Early stage', fr: 'Phase initiale' },
      description: {
        de: 'Kaum formalisierte OT-Security, viele Lücken gegenüber IEC 62443.',
        en: 'Barely formalised OT security with many gaps against IEC 62443.',
        fr: 'Sécurité OT peu formalisée, nombreuses lacunes face à IEC 62443.',
      },
      answers: {
        entityName: 'SmallWorks GmbH',
        role: 'supplier',
        phase: 'gap',
        description:
          'Small machine builder with three PLCs and a local HMI. No network segmentation, shared passwords, no remote access policy, no patch management. No security programme or risk assessment.',
        systems: ['plc'],
        roles: ['mgmt'],
        knownIssues:
          'No OT security policy, no risk assessment, no zones or conduits, no security levels, no patch management, no monitoring, no incident response, no backups.',
        measures: ['program'],
        measures__mat__program: 'existing',
      },
    },
  ],
};
