import type { StandardProfile } from './types';

// ── IACS UR E26 profile ─────────────────────────────────────────
// IACS Unified Requirement E26 — "Cyber resilience of ships".
// Goal-based requirements for the cyber resilience of the vessel as a
// whole: the integrated network of Computer Based Systems (CBS), the
// responsibilities of owner and yard, and the ship-wide security framework.
// The engine assesses the requirements below strictly against the supplied
// evidence (no invented findings — Data Integrity Policy).

export const IACS_E26_PROFILE: StandardProfile = {
  id: 'iacse26',
  name: 'IACS E26',
  icon: 'ShieldCheck',
  available: true,
  fullName: {
    de: 'IACS UR E26 — Cyber-Resilienz von Schiffen',
    en: 'IACS UR E26 — Cyber Resilience of Ships',
    fr: 'IACS UR E26 — Cyber-résilience des navires',
  },
  regulation: {
    de: 'IACS Unified Requirement E26',
    en: 'IACS Unified Requirement E26',
    fr: 'Exigence unifiée IACS E26',
  },
  description: {
    de: 'Audit-Workflow zur Cyber-Resilienz des Schiffes als Ganzes nach IACS UR E26.',
    en: 'Conformity audit workflow for the cyber resilience of the vessel as a whole under IACS UR E26.',
    fr: "Flux d'audit de conformité pour la cyber-résilience du navire dans son ensemble selon IACS UR E26.",
  },
  intake: [
    {
      title: { de: 'Schiff & Bewertungsobjekt', en: 'Vessel & assessment object', fr: "Navire & objet d'évaluation" },
      subtitle: {
        de: 'Welches Schiff wird bewertet?',
        en: 'Which vessel is being assessed?',
        fr: 'Quel navire est évalué ?',
      },
      info: {
        de: 'UR E26 gilt für Neubauten mit Bauvertrag ab 1. Juli 2024 und betrachtet das Schiff als integriertes CBS-Netzwerk.',
        en: 'UR E26 applies to newbuilds contracted on or after 1 July 2024 and treats the vessel as an integrated CBS network.',
        fr: "L'UR E26 s'applique aux navires neufs commandés à partir du 1er juillet 2024 et considère le navire comme un réseau intégré de CBS.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'Schiff / Organisation', en: 'Vessel / organisation', fr: 'Navire / organisation' },
          placeholder: { de: 'z. B. MV Muster', en: 'e.g. MV Acme', fr: 'p. ex. MV Exemple' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle im Lebenszyklus', en: 'Role in the lifecycle', fr: 'Rôle dans le cycle de vie' },
          options: [
            { id: 'owner', icon: '🛳️', label: { de: 'Reederei / Eigner', en: 'Owner / operator', fr: 'Armateur / exploitant' }, desc: { de: 'Betrieb & Instandhaltung', en: 'Operation & maintenance', fr: 'Exploitation & maintenance' } },
            { id: 'yard', icon: '🏗️', label: { de: 'Werft', en: 'Shipyard', fr: 'Chantier naval' }, desc: { de: 'Bau & Integration', en: 'Build & integration', fr: 'Construction & intégration' } },
            { id: 'integrator', icon: '🔧', label: { de: 'Systemintegrator', en: 'System integrator', fr: 'Intégrateur système' } },
            { id: 'both', icon: '🔁', label: { de: 'Eigner & Werft', en: 'Owner & yard', fr: 'Armateur & chantier' } },
          ],
        },
        {
          id: 'phase',
          type: 'single',
          required: true,
          label: { de: 'Projektphase', en: 'Project phase', fr: 'Phase du projet' },
          options: [
            { id: 'design', label: { de: 'Entwurf / Engineering', en: 'Design / engineering', fr: 'Conception / ingénierie' } },
            { id: 'construction', label: { de: 'Bau / Integration', en: 'Construction / integration', fr: 'Construction / intégration' } },
            { id: 'trials', label: { de: 'Erprobung / Abnahme', en: 'Trials / commissioning', fr: 'Essais / réception' } },
            { id: 'operation', label: { de: 'Betrieb', en: 'In operation', fr: 'En exploitation' } },
          ],
        },
      ],
    },
    {
      title: { de: 'CBS-Umfang & Risikolandschaft', en: 'CBS scope & risk landscape', fr: 'Périmètre CBS & paysage des risques' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung der Bordsysteme (CBS) & Architektur', en: 'Description of on-board systems (CBS) & architecture', fr: 'Description des systèmes de bord (CBS) & architecture' },
          placeholder: { de: 'Navigation, Antrieb, Ladungsmanagement, Kommunikation, Netzwerke, Shore-Connections …', en: 'Navigation, propulsion, cargo management, communications, networks, shore connections …', fr: 'Navigation, propulsion, gestion de cargaison, communications, réseaux, connexions à terre …' },
        },
        {
          id: 'systems',
          type: 'multi',
          label: { de: 'Kategorien betroffener Systeme', en: 'Categories of affected systems', fr: 'Catégories de systèmes concernés' },
          options: [
            { id: 'navigation', icon: '🧭', label: { de: 'Navigation (ECDIS, Radar, GNSS)', en: 'Navigation (ECDIS, radar, GNSS)', fr: 'Navigation (ECDIS, radar, GNSS)' } },
            { id: 'propulsion', icon: '⚙️', label: { de: 'Antrieb & Maschinensteuerung', en: 'Propulsion & machinery control', fr: 'Propulsion & contrôle machine' } },
            { id: 'cargo', icon: '📦', label: { de: 'Ladungsmanagement', en: 'Cargo management', fr: 'Gestion de la cargaison' } },
            { id: 'comms', icon: '📡', label: { de: 'Kommunikation / VSAT', en: 'Communications / VSAT', fr: 'Communications / VSAT' } },
            { id: 'safety', icon: '🚨', label: { de: 'Sicherheits- & Alarmsysteme', en: 'Safety & alarm systems', fr: 'Systèmes de sécurité & alarme' } },
            { id: 'admin', icon: '💻', label: { de: 'Administrative IT / Crew', en: 'Administrative IT / crew', fr: 'IT administrative / équipage' } },
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
            { id: 'mgmt', icon: '👔', label: { de: 'Management eingebunden', en: 'Management involved', fr: 'Direction impliquée' } },
            { id: 'cyberlead', icon: '🛡️', label: { de: 'Benannte Cyber-Verantwortung (Bord/Land)', en: 'Designated cyber responsibility (ship/shore)', fr: 'Responsabilité cyber désignée (bord/terre)' } },
            { id: 'sms', icon: '📘', label: { de: 'Integration ins SMS (ISM/IMO 2021)', en: 'Integrated into SMS (ISM / IMO 2021)', fr: 'Intégré au SGS (ISM / OMI 2021)' } },
            { id: 'supplier', icon: '🔗', label: { de: 'Lieferanten-/Werft-Verantwortlichkeiten geregelt', en: 'Supplier / yard responsibilities defined', fr: 'Responsabilités fournisseurs / chantier définies' } },
            { id: 'training', icon: '📚', label: { de: 'Crew-Cyber-Awareness', en: 'Crew cyber awareness', fr: "Sensibilisation cyber de l'équipage" } },
            { id: 'audit', icon: '📋', label: { de: 'Audit-/Survey-Programm', en: 'Audit / survey programme', fr: 'Programme d\'audit / visite' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. kein CBS-Inventar, keine Netzwerksegmentierung, kein Incident-Plan, keine Backups …', en: 'e.g. no CBS inventory, no network segmentation, no incident plan, no backups …', fr: 'p. ex. pas d\'inventaire CBS, pas de segmentation réseau, pas de plan d\'incident …' },
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
          label: { de: 'Maßnahmen zur Cyber-Resilienz (UR E26)', en: 'Cyber-resilience measures (UR E26)', fr: 'Mesures de cyber-résilience (UR E26)' },
          help: { de: 'Pro ausgewählter Maßnahme den Reifegrad angeben.', en: 'Specify the maturity for each selected measure.', fr: 'Indiquez la maturité de chaque mesure.' },
          options: [
            { id: 'inventory', label: { de: 'CBS-Inventar & Asset-Verzeichnis', en: 'CBS inventory & asset register', fr: 'Inventaire CBS & registre des actifs' } },
            { id: 'riskassess', label: { de: 'Cyber-Risikobeurteilung des Schiffes', en: 'Ship cyber risk assessment', fr: 'Appréciation des cyber-risques du navire' } },
            { id: 'securityplan', label: { de: 'Ship Cyber Resilience Framework / Plan', en: 'Ship cyber resilience framework / plan', fr: 'Cadre / plan de cyber-résilience du navire' } },
            { id: 'segmentation', label: { de: 'Netzwerksegmentierung (Zonen & Conduits)', en: 'Network segmentation (zones & conduits)', fr: 'Segmentation réseau (zones & conduits)' } },
            { id: 'access', label: { de: 'Zugriffssteuerung & Authentisierung', en: 'Access control & authentication', fr: "Contrôle d'accès & authentification" } },
            { id: 'wireless', label: { de: 'Absicherung Wireless & Remote-Zugänge', en: 'Securing wireless & remote access', fr: 'Sécurisation sans fil & accès distant' } },
            { id: 'media', label: { de: 'Kontrolle von Wechselmedien', en: 'Control of removable media', fr: 'Contrôle des supports amovibles' } },
            { id: 'malware', label: { de: 'Schutz vor Schadsoftware', en: 'Malware protection', fr: 'Protection contre les logiciels malveillants' } },
            { id: 'monitoring', label: { de: 'Detektion & Monitoring', en: 'Detection & monitoring', fr: 'Détection & surveillance' } },
            { id: 'incident', label: { de: 'Incident-Response-Plan', en: 'Incident response plan', fr: "Plan de réponse aux incidents" } },
            { id: 'recovery', label: { de: 'Backup & Wiederherstellung', en: 'Backup & recovery', fr: 'Sauvegarde & restauration' } },
            { id: 'patch', label: { de: 'Patch- & Change-Management', en: 'Patch & change management', fr: 'Gestion des correctifs & changements' } },
            { id: 'training', label: { de: 'Schulung & Awareness der Crew', en: 'Crew training & awareness', fr: "Formation & sensibilisation de l'équipage" } },
            { id: 'sms', label: { de: 'Verankerung im Sicherheitsmanagementsystem', en: 'Embedding in the safety management system', fr: 'Ancrage dans le système de gestion de la sécurité' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'govern', name: { de: 'Governance & Verantwortlichkeiten', en: 'Governance & responsibilities', fr: 'Gouvernance & responsabilités' }, weight: 2 },
    { id: 'identify', name: { de: 'Identifizieren', en: 'Identify', fr: 'Identifier' }, weight: 2 },
    { id: 'protect', name: { de: 'Schützen', en: 'Protect', fr: 'Protéger' }, weight: 2 },
    { id: 'detect', name: { de: 'Erkennen', en: 'Detect', fr: 'Détecter' } },
    { id: 'respond', name: { de: 'Reagieren', en: 'Respond', fr: 'Répondre' }, weight: 2 },
    { id: 'recover', name: { de: 'Wiederherstellen', en: 'Recover', fr: 'Récupérer' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'E26-G1', article: 'UR E26 §3', categoryId: 'govern', weight: 2, mandatory: true, rule: { requiresAll: ['measures:securityplan'], requiresAny: ['roles:cyberlead'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Reederei / Werft', en: 'Owner / yard', fr: 'Armateur / chantier' }, name: { de: 'Ship Cyber Resilience Framework & Verantwortlichkeiten', en: 'Ship cyber resilience framework & responsibilities', fr: 'Cadre de cyber-résilience du navire & responsabilités' }, criteria: [
      { de: 'Ship-wide Cyber-Resilience-Framework dokumentiert; Rollen von Eigner, Werft und Lieferanten geregelt', en: 'Ship-wide cyber resilience framework documented; owner, yard and supplier roles defined', fr: 'Cadre de cyber-résilience documenté ; rôles armateur, chantier et fournisseurs définis' },
    ] },
    { id: 'E26-G2', article: 'UR E26 §3', categoryId: 'govern', mandatory: true, rule: { requiresAll: ['measures:sms'], requiresAny: ['roles:sms', 'roles:training'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Reederei', en: 'Owner', fr: 'Armateur' }, name: { de: 'Verankerung im Sicherheitsmanagement & Crew-Awareness', en: 'Embedding in safety management & crew awareness', fr: 'Ancrage dans la gestion de la sécurité & sensibilisation' } },
    { id: 'E26-ID1', article: 'UR E26 §4 Identify', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:inventory'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Systemintegrator', en: 'System integrator', fr: 'Intégrateur système' }, name: { de: 'CBS-Inventar & Asset-Identifikation', en: 'CBS inventory & asset identification', fr: 'Inventaire CBS & identification des actifs' } },
    { id: 'E26-ID2', article: 'UR E26 §4 Identify', categoryId: 'identify', weight: 2, mandatory: true, rule: { requiresAll: ['measures:riskassess'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Reederei / Werft', en: 'Owner / yard', fr: 'Armateur / chantier' }, name: { de: 'Cyber-Risikobeurteilung des Schiffes', en: 'Ship cyber risk assessment', fr: 'Appréciation des cyber-risques du navire' } },
    { id: 'E26-PR1', article: 'UR E26 §4 Protect', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:segmentation'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Systemintegrator', en: 'System integrator', fr: 'Intégrateur système' }, name: { de: 'Netzwerksegmentierung (Zonen & Conduits)', en: 'Network segmentation (zones & conduits)', fr: 'Segmentation réseau (zones & conduits)' } },
    { id: 'E26-PR2', article: 'UR E26 §4 Protect', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:access'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'IT / OT', en: 'IT / OT', fr: 'IT / OT' }, name: { de: 'Zugriffssteuerung & Authentisierung', en: 'Access control & authentication', fr: "Contrôle d'accès & authentification" } },
    { id: 'E26-PR3', article: 'UR E26 §4 Protect', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:wireless'], requiresAny: ['measures:media'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / OT', en: 'IT / OT', fr: 'IT / OT' }, name: { de: 'Absicherung von Wireless, Remote-Zugängen & Wechselmedien', en: 'Securing wireless, remote access & removable media', fr: 'Sécurisation sans fil, accès distant & supports amovibles' } },
    { id: 'E26-PR4', article: 'UR E26 §4 Protect', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:malware'], requiresAny: ['measures:patch'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'IT / OT', en: 'IT / OT', fr: 'IT / OT' }, name: { de: 'Schadsoftwareschutz & Patch-/Change-Management', en: 'Malware protection & patch/change management', fr: 'Protection anti-malware & gestion des correctifs/changements' } },
    { id: 'E26-DE1', article: 'UR E26 §4 Detect', categoryId: 'detect', mandatory: true, rule: { requiresAll: ['measures:monitoring'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Bord / Land-SOC', en: 'Ship / shore SOC', fr: 'Bord / SOC à terre' }, name: { de: 'Detektion & Monitoring von Cyber-Ereignissen', en: 'Detection & monitoring of cyber events', fr: 'Détection & surveillance des événements cyber' } },
    { id: 'E26-RS1', article: 'UR E26 §4 Respond', categoryId: 'respond', weight: 2, mandatory: true, rule: { requiresAll: ['measures:incident'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Reederei / Bord', en: 'Owner / ship', fr: 'Armateur / bord' }, name: { de: 'Incident-Response-Plan', en: 'Incident response plan', fr: "Plan de réponse aux incidents" } },
    { id: 'E26-RC1', article: 'UR E26 §4 Recover', categoryId: 'recover', mandatory: true, rule: { requiresAll: ['measures:recovery'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Bord / IT', en: 'Ship / IT', fr: 'Bord / IT' }, name: { de: 'Backup & Wiederherstellung kritischer Systeme', en: 'Backup & recovery of critical systems', fr: 'Sauvegarde & restauration des systèmes critiques' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'MV Acme Pioneer',
    role: 'both',
    phase: 'construction',
    description:
      'Newbuild container vessel under construction. Integrated CBS network spans navigation (ECDIS, radar, GNSS), propulsion and machinery control, cargo management and VSAT communications. Shore connections for remote diagnostics. Owner and yard are jointly preparing the vessel for IACS UR E26 class review.',
    systems: ['navigation', 'propulsion', 'cargo', 'comms', 'safety'],
    roles: ['mgmt', 'cyberlead', 'sms', 'supplier'],
    knownIssues:
      'CBS inventory drafted but not complete across all suppliers. Network segmentation designed but not fully verified. Incident response plan exists ashore but not yet exercised on board. Backups defined for IT but not for all OT systems.',
    measures: ['inventory', 'riskassess', 'securityplan', 'segmentation', 'access', 'wireless', 'malware', 'monitoring', 'incident', 'recovery', 'sms'],
    measures__mat__inventory: 'documented',
    measures__mat__riskassess: 'documented',
    measures__mat__securityplan: 'documented',
    measures__mat__segmentation: 'existing',
    measures__mat__access: 'documented',
    measures__mat__wireless: 'existing',
    measures__mat__malware: 'documented',
    measures__mat__monitoring: 'existing',
    measures__mat__incident: 'documented',
    measures__mat__recovery: 'existing',
    measures__mat__sms: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Klassen-Review — auditreif', en: 'Class review — audit-ready', fr: 'Revue de classe — prêt pour l\'audit' },
      description: {
        de: 'Neubau mit nahezu vollständigem Cyber-Resilience-Framework und verifizierten Maßnahmen.',
        en: 'Newbuild with a near-complete cyber resilience framework and verified measures.',
        fr: 'Navire neuf avec cadre de cyber-résilience quasi complet et mesures vérifiées.',
      },
      answers: {
        entityName: 'MV Northern Star',
        role: 'both',
        phase: 'trials',
        description:
          'Newbuild LNG carrier in trials phase. Complete CBS inventory, segmented zones-and-conduits architecture, monitored network, exercised incident response and tested OT backups. Owner and yard fully aligned on UR E26 responsibilities.',
        systems: ['navigation', 'propulsion', 'cargo', 'comms', 'safety', 'admin'],
        roles: ['mgmt', 'cyberlead', 'sms', 'supplier', 'training', 'audit'],
        knownIssues:
          'A few low-priority observations from the integration test remain open. Continuous monitoring tuning still in progress.',
        measures: ['inventory', 'riskassess', 'securityplan', 'segmentation', 'access', 'wireless', 'media', 'malware', 'monitoring', 'incident', 'recovery', 'patch', 'training', 'sms'],
        measures__mat__inventory: 'audited',
        measures__mat__riskassess: 'audited',
        measures__mat__securityplan: 'documented',
        measures__mat__segmentation: 'audited',
        measures__mat__access: 'documented',
        measures__mat__wireless: 'documented',
        measures__mat__media: 'documented',
        measures__mat__malware: 'documented',
        measures__mat__monitoring: 'documented',
        measures__mat__incident: 'documented',
        measures__mat__recovery: 'documented',
        measures__mat__patch: 'documented',
        measures__mat__training: 'documented',
        measures__mat__sms: 'audited',
      },
    },
    {
      id: 'developing',
      label: { de: 'Neubau — im Aufbau', en: 'Newbuild — developing', fr: 'Navire neuf — en développement' },
      description: {
        de: 'Bauphase mit Teil-Konformität und mehreren offenen technischen Maßnahmen.',
        en: 'Construction phase with partial conformity and several open technical measures.',
        fr: 'Phase de construction avec conformité partielle et plusieurs mesures techniques ouvertes.',
      },
      answers: {
        entityName: 'MV Coastal Trader',
        role: 'yard',
        phase: 'construction',
        description:
          'General cargo newbuild in construction. CBS inventory and risk assessment under way; segmentation partially designed; no incident exercises yet.',
        systems: ['navigation', 'propulsion', 'comms'],
        roles: ['mgmt', 'cyberlead'],
        knownIssues:
          'No exercised incident response. Removable-media controls not defined. OT backups missing. Crew awareness programme not started.',
        measures: ['inventory', 'riskassess', 'securityplan', 'access', 'malware'],
        measures__mat__inventory: 'documented',
        measures__mat__riskassess: 'existing',
        measures__mat__securityplan: 'existing',
        measures__mat__access: 'existing',
        measures__mat__malware: 'documented',
      },
    },
    {
      id: 'early',
      label: { de: 'Frühe Entwurfsphase', en: 'Early design stage', fr: 'Phase de conception initiale' },
      description: {
        de: 'Entwurfsphase ohne formalisiertes Cyber-Resilience-Framework, viele Lücken.',
        en: 'Design stage with no formalised cyber resilience framework and many gaps.',
        fr: 'Phase de conception sans cadre de cyber-résilience formalisé, nombreuses lacunes.',
      },
      answers: {
        entityName: 'Project Hull 4821',
        role: 'integrator',
        phase: 'design',
        description:
          'Early design of an offshore support vessel. CBS architecture being defined. No formal cyber risk assessment or resilience framework yet; security relies on individual supplier defaults.',
        systems: ['navigation', 'propulsion'],
        roles: ['mgmt'],
        knownIssues:
          'No CBS inventory, no ship cyber risk assessment, no segmentation design, no incident or recovery planning, no SMS integration.',
        measures: ['access'],
        measures__mat__access: 'existing',
      },
    },
  ],
};
