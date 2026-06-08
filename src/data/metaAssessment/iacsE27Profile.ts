import type { StandardProfile } from './types';

// ── IACS UR E27 profile ─────────────────────────────────────────
// IACS Unified Requirement E27 — "Cyber resilience of on-board systems
// and equipment". Requirements for individual Computer Based Systems
// (CBS) and equipment, aligned to the security capabilities of
// IEC 62443-3-3 / 4-2 and the five functional elements (Identify,
// Protect, Detect, Respond, Recover). The engine assesses the
// requirements below strictly against the supplied evidence
// (no invented findings — Data Integrity Policy).

export const IACS_E27_PROFILE: StandardProfile = {
  id: 'iacse27',
  name: 'IACS E27',
  icon: 'Server',
  available: true,
  fullName: {
    de: 'IACS UR E27 — Cyber-Resilienz von Bordsystemen & -ausrüstung',
    en: 'IACS UR E27 — Cyber Resilience of On-board Systems & Equipment',
    fr: 'IACS UR E27 — Cyber-résilience des systèmes & équipements de bord',
  },
  regulation: {
    de: 'IACS Unified Requirement E27',
    en: 'IACS Unified Requirement E27',
    fr: 'Exigence unifiée IACS E27',
  },
  description: {
    de: 'Cyber-Resilienz-Audit für Bordsysteme & -ausrüstung (IACS UR E27).',
    en: 'Cyber resilience audit for on-board systems & equipment (IACS UR E27).',
    fr: "Audit de cyber-résilience des systèmes & équipements de bord (IACS UR E27).",
  },
  intake: [
    {
      title: { de: 'System & Bewertungsobjekt', en: 'System & assessment object', fr: "Système & objet d'évaluation" },
      subtitle: {
        de: 'Welches Bordsystem wird bewertet?',
        en: 'Which on-board system is being assessed?',
        fr: 'Quel système de bord est évalué ?',
      },
      info: {
        de: 'UR E27 betrachtet das einzelne CBS / die Ausrüstung und referenziert die Security-Capabilities aus IEC 62443.',
        en: 'UR E27 addresses the individual CBS / equipment and references the security capabilities from IEC 62443.',
        fr: "L'UR E27 traite le CBS / l'équipement individuel et référence les capacités de sécurité de l'IEC 62443.",
      },
      fields: [
        {
          id: 'entityName',
          type: 'text',
          required: true,
          label: { de: 'System / Hersteller', en: 'System / supplier', fr: 'Système / fournisseur' },
          placeholder: { de: 'z. B. ECDIS Modell X', en: 'e.g. ECDIS model X', fr: 'p. ex. ECDIS modèle X' },
        },
        {
          id: 'role',
          type: 'single',
          required: true,
          label: { de: 'Rolle', en: 'Role', fr: 'Rôle' },
          options: [
            { id: 'supplier', icon: '🏭', label: { de: 'Hersteller / Lieferant', en: 'Manufacturer / supplier', fr: 'Fabricant / fournisseur' }, desc: { de: 'Entwickelt das CBS', en: 'Develops the CBS', fr: 'Développe le CBS' } },
            { id: 'integrator', icon: '🔧', label: { de: 'Systemintegrator', en: 'System integrator', fr: 'Intégrateur système' } },
            { id: 'yard', icon: '🏗️', label: { de: 'Werft', en: 'Shipyard', fr: 'Chantier naval' } },
            { id: 'owner', icon: '🛳️', label: { de: 'Reederei / Eigner', en: 'Owner / operator', fr: 'Armateur / exploitant' } },
          ],
        },
        {
          id: 'securityLevel',
          type: 'single',
          required: true,
          label: { de: 'Ziel-Security-Level (IEC 62443)', en: 'Target security level (IEC 62443)', fr: 'Niveau de sécurité cible (IEC 62443)' },
          options: [
            { id: 'sl1', label: { de: 'SL 1 — gegen gelegentliche Verstöße', en: 'SL 1 — against casual violation', fr: 'SL 1 — contre violation occasionnelle' } },
            { id: 'sl2', label: { de: 'SL 2 — gegen vorsätzliche Angriffe (einfach)', en: 'SL 2 — against intentional, simple attacks', fr: 'SL 2 — contre attaques intentionnelles simples' } },
            { id: 'sl3', label: { de: 'SL 3 — gegen ausgefeilte Angriffe', en: 'SL 3 — against sophisticated attacks', fr: 'SL 3 — contre attaques sophistiquées' } },
            { id: 'unsure', label: { de: 'Noch nicht festgelegt', en: 'Not yet defined', fr: 'Pas encore défini' }, desc: { de: 'SL soll mitbewertet werden', en: 'SL to be assessed too', fr: 'SL à évaluer' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Systemkontext', en: 'System context', fr: 'Contexte du système' },
      info: {
        de: 'Je konkreter die Beschreibung, desto präziser die KI-Auswertung.',
        en: 'The more concrete the description, the sharper the AI assessment.',
        fr: "Plus la description est concrète, plus l'évaluation IA est précise.",
      },
      fields: [
        {
          id: 'description',
          type: 'textarea',
          label: { de: 'Beschreibung des Systems, Schnittstellen & Einsatzzweck', en: 'Description of the system, interfaces & intended use', fr: "Description du système, interfaces & usage prévu" },
          placeholder: { de: 'Funktion, Betriebssystem, Netzwerk-/Serien-Schnittstellen, Protokolle, Update-Mechanismen …', en: 'Function, operating system, network/serial interfaces, protocols, update mechanisms …', fr: 'Fonction, système d\'exploitation, interfaces réseau/série, protocoles, mécanismes de mise à jour …' },
        },
        {
          id: 'category',
          type: 'single',
          label: { de: 'Systemkategorie nach Auswirkung', en: 'System category by impact', fr: 'Catégorie du système par impact' },
          options: [
            { id: 'cat1', label: { de: 'Kategorie I — geringe Auswirkung', en: 'Category I — low impact', fr: 'Catégorie I — impact faible' } },
            { id: 'cat2', label: { de: 'Kategorie II — Effizienz/Komfort', en: 'Category II — efficiency/comfort', fr: 'Catégorie II — efficacité/confort' } },
            { id: 'cat3', label: { de: 'Kategorie III — sicherheitskritisch', en: 'Category III — safety-critical', fr: 'Catégorie III — critique pour la sécurité' } },
          ],
        },
      ],
    },
    {
      title: { de: 'Lifecycle & Schwachstellen', en: 'Lifecycle & gaps', fr: 'Cycle de vie & lacunes' },
      fields: [
        {
          id: 'roles',
          type: 'multi',
          required: true,
          label: { de: 'Etablierte Prozesse & Nachweise', en: 'Established processes & evidence', fr: 'Processus & preuves établis' },
          options: [
            { id: 'sdl', icon: '🛠️', label: { de: 'Sicherer Entwicklungslebenszyklus (SDL)', en: 'Secure development lifecycle (SDL)', fr: 'Cycle de développement sécurisé (SDL)' } },
            { id: 'testreport', icon: '🧪', label: { de: 'Test-/Typprüfberichte vorhanden', en: 'Test / type-approval reports available', fr: 'Rapports d\'essai / d\'homologation disponibles' } },
            { id: 'manual', icon: '📘', label: { de: 'Sicherheits-/Härtungs-Handbuch', en: 'Security / hardening manual', fr: 'Manuel de sécurité / durcissement' } },
            { id: 'vuln', icon: '🐞', label: { de: 'Schwachstellen-/Patch-Prozess', en: 'Vulnerability / patch process', fr: 'Processus vulnérabilités / correctifs' } },
            { id: 'sbom', icon: '📦', label: { de: 'SBOM / Komponentenverzeichnis', en: 'SBOM / component inventory', fr: 'SBOM / inventaire des composants' } },
            { id: 'support', icon: '🔄', label: { de: 'Definierter Support-/EOL-Zeitraum', en: 'Defined support / EOL period', fr: 'Période de support / fin de vie définie' } },
          ],
        },
        {
          id: 'knownIssues',
          type: 'textarea',
          label: { de: 'Bekannte Schwachstellen / offene Punkte', en: 'Known weaknesses / open points', fr: 'Faiblesses connues' },
          placeholder: { de: 'z. B. keine Authentisierung am Gerät, keine Integritätsprüfung, keine signierten Updates …', en: 'e.g. no device authentication, no integrity check, no signed updates …', fr: 'p. ex. pas d\'authentification, pas de contrôle d\'intégrité, pas de mises à jour signées …' },
        },
      ],
    },
    {
      title: { de: 'Umgesetzte Security-Capabilities', en: 'Implemented security capabilities', fr: 'Capacités de sécurité en place' },
      info: {
        de: 'Nur ankreuzen, was nachweislich existiert. Die KI erfindet keine Nachweise.',
        en: 'Only tick what verifiably exists. The AI invents no evidence.',
        fr: "Ne cochez que ce qui existe réellement. L'IA n'invente aucune preuve.",
      },
      fields: [
        {
          id: 'measures',
          type: 'maturity-multi',
          label: { de: 'Security-Capabilities (UR E27 / IEC 62443)', en: 'Security capabilities (UR E27 / IEC 62443)', fr: 'Capacités de sécurité (UR E27 / IEC 62443)' },
          help: { de: 'Pro ausgewählter Capability den Reifegrad angeben.', en: 'Specify the maturity for each selected capability.', fr: 'Indiquez la maturité de chaque capacité.' },
          options: [
            { id: 'iac', label: { de: 'Identifikation & Authentisierung (FR1)', en: 'Identification & authentication control (FR1)', fr: 'Contrôle d\'identification & authentification (FR1)' } },
            { id: 'uc', label: { de: 'Nutzungssteuerung / Berechtigungen (FR2)', en: 'Use control / authorisation (FR2)', fr: 'Contrôle d\'utilisation / autorisations (FR2)' } },
            { id: 'si', label: { de: 'Systemintegrität (FR3)', en: 'System integrity (FR3)', fr: 'Intégrité du système (FR3)' } },
            { id: 'dc', label: { de: 'Datenvertraulichkeit (FR4)', en: 'Data confidentiality (FR4)', fr: 'Confidentialité des données (FR4)' } },
            { id: 'rdf', label: { de: 'Eingeschränkter Datenfluss (FR5)', en: 'Restricted data flow (FR5)', fr: 'Flux de données restreint (FR5)' } },
            { id: 'tre', label: { de: 'Zeitnahe Reaktion auf Ereignisse (FR6)', en: 'Timely response to events (FR6)', fr: 'Réponse rapide aux événements (FR6)' } },
            { id: 'ra', label: { de: 'Ressourcenverfügbarkeit / Robustheit (FR7)', en: 'Resource availability / robustness (FR7)', fr: 'Disponibilité des ressources / robustesse (FR7)' } },
            { id: 'hardening', label: { de: 'Härtung & sichere Standardkonfiguration', en: 'Hardening & secure-by-default configuration', fr: 'Durcissement & configuration sécurisée par défaut' } },
            { id: 'logging', label: { de: 'Audit-Logging & lokale Aufzeichnung', en: 'Audit logging & local recording', fr: 'Journalisation d\'audit & enregistrement local' } },
            { id: 'updates', label: { de: 'Signierte / verifizierte Updates', en: 'Signed / verified updates', fr: 'Mises à jour signées / vérifiées' } },
            { id: 'backup', label: { de: 'Sicherung & Wiederherstellung der Konfiguration', en: 'Configuration backup & recovery', fr: 'Sauvegarde & restauration de la configuration' } },
            { id: 'docs', label: { de: 'Sicherheits-Dokumentation für Integration', en: 'Security documentation for integration', fr: 'Documentation de sécurité pour l\'intégration' } },
          ],
        },
      ],
    },
  ],
  categories: [
    { id: 'lifecycle', name: { de: 'Entwicklung & Lebenszyklus', en: 'Development & lifecycle', fr: 'Développement & cycle de vie' }, weight: 2 },
    { id: 'identify', name: { de: 'Identifizieren', en: 'Identify', fr: 'Identifier' } },
    { id: 'protect', name: { de: 'Schützen', en: 'Protect', fr: 'Protéger' }, weight: 2 },
    { id: 'detect', name: { de: 'Erkennen', en: 'Detect', fr: 'Détecter' } },
    { id: 'respond', name: { de: 'Reagieren', en: 'Respond', fr: 'Répondre' } },
    { id: 'recover', name: { de: 'Wiederherstellen', en: 'Recover', fr: 'Récupérer' } },
  ],
  maturity: { enabled: true, target: 4 },
  requirements: [
    { id: 'E27-LC1', article: 'UR E27 §3', categoryId: 'lifecycle', weight: 2, mandatory: true, rule: { requiresAll: ['measures:docs'], requiresAny: ['roles:sdl', 'roles:testreport'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Sicherer Entwicklungslebenszyklus & Nachweise', en: 'Secure development lifecycle & evidence', fr: 'Cycle de développement sécurisé & preuves' }, criteria: [
      { de: 'CBS wird in einem dokumentierten SDL entwickelt; Sicherheitsnachweise und Integrationsdokumentation liegen vor', en: 'CBS developed under a documented SDL; security evidence and integration documentation provided', fr: 'CBS développé selon un SDL documenté ; preuves de sécurité et documentation d\'intégration fournies' },
    ] },
    { id: 'E27-LC2', article: 'UR E27 §3', categoryId: 'lifecycle', mandatory: true, rule: { requiresAll: ['measures:updates'], requiresAny: ['roles:vuln', 'roles:support'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Schwachstellen-, Patch- & Update-Management', en: 'Vulnerability, patch & update management', fr: 'Gestion des vulnérabilités, correctifs & mises à jour' } },
    { id: 'E27-ID1', article: 'UR E27 FR', categoryId: 'identify', mandatory: true, rule: { requiresAll: ['measures:iac'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Identifikation & Authentisierungssteuerung (FR1)', en: 'Identification & authentication control (FR1)', fr: 'Contrôle d\'identification & authentification (FR1)' } },
    { id: 'E27-PR1', article: 'UR E27 FR2', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:uc'], riskLikelihood: 4, riskImpact: 4 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Nutzungssteuerung & Berechtigungen (FR2)', en: 'Use control & authorisation (FR2)', fr: 'Contrôle d\'utilisation & autorisations (FR2)' } },
    { id: 'E27-PR2', article: 'UR E27 FR3', categoryId: 'protect', weight: 2, mandatory: true, rule: { requiresAll: ['measures:si'], requiresAny: ['measures:hardening'], riskLikelihood: 4, riskImpact: 5 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Systemintegrität & Härtung (FR3)', en: 'System integrity & hardening (FR3)', fr: 'Intégrité du système & durcissement (FR3)' } },
    { id: 'E27-PR3', article: 'UR E27 FR4', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:dc'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Datenvertraulichkeit (FR4)', en: 'Data confidentiality (FR4)', fr: 'Confidentialité des données (FR4)' } },
    { id: 'E27-PR4', article: 'UR E27 FR5', categoryId: 'protect', mandatory: true, rule: { requiresAll: ['measures:rdf'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Integrator', en: 'Integrator', fr: 'Intégrateur' }, name: { de: 'Eingeschränkter Datenfluss (FR5)', en: 'Restricted data flow (FR5)', fr: 'Flux de données restreint (FR5)' } },
    { id: 'E27-DE1', article: 'UR E27 FR6', categoryId: 'detect', mandatory: true, rule: { requiresAll: ['measures:logging'], requiresAny: ['measures:tre'], riskLikelihood: 3, riskImpact: 3 }, owner: { de: 'Hersteller', en: 'Manufacturer', fr: 'Fabricant' }, name: { de: 'Audit-Logging & zeitnahe Reaktion auf Ereignisse (FR6)', en: 'Audit logging & timely response to events (FR6)', fr: 'Journalisation & réponse rapide aux événements (FR6)' } },
    { id: 'E27-RS1', article: 'UR E27 FR6', categoryId: 'respond', mandatory: true, rule: { requiresAll: ['measures:tre'], riskLikelihood: 3, riskImpact: 4 }, owner: { de: 'Hersteller / Bord', en: 'Manufacturer / ship', fr: 'Fabricant / bord' }, name: { de: 'Zeitnahe Reaktion auf Sicherheitsereignisse (FR6)', en: 'Timely response to security events (FR6)', fr: 'Réponse rapide aux événements de sécurité (FR6)' } },
    { id: 'E27-RC1', article: 'UR E27 FR7', categoryId: 'recover', weight: 2, mandatory: true, rule: { requiresAll: ['measures:ra'], requiresAny: ['measures:backup'], riskLikelihood: 3, riskImpact: 5 }, owner: { de: 'Hersteller / Bord', en: 'Manufacturer / ship', fr: 'Fabricant / bord' }, name: { de: 'Ressourcenverfügbarkeit, Robustheit & Wiederherstellung (FR7)', en: 'Resource availability, robustness & recovery (FR7)', fr: 'Disponibilité des ressources, robustesse & restauration (FR7)' } },
  ],
  scaleMax: 5,
  demoAnswers: {
    entityName: 'NaviGuard ECDIS v4',
    role: 'supplier',
    securityLevel: 'sl2',
    category: 'cat3',
    description:
      'Type-approved ECDIS unit running a hardened Linux variant. Ethernet and serial (NMEA) interfaces, role-based local accounts, signed software updates. Supplied to yards for newbuild integration; intended as a safety-critical Category III system at target SL 2.',
    roles: ['sdl', 'testreport', 'manual', 'vuln'],
    knownIssues:
      'Audit logging exists but is not exported to a central collector. Configuration backup/restore is manual. SBOM not yet provided to integrators. NMEA serial inputs lack authentication and rely on segmentation.',
    measures: ['iac', 'uc', 'si', 'dc', 'tre', 'hardening', 'logging', 'updates', 'docs'],
    measures__mat__iac: 'documented',
    measures__mat__uc: 'documented',
    measures__mat__si: 'documented',
    measures__mat__dc: 'existing',
    measures__mat__tre: 'existing',
    measures__mat__hardening: 'documented',
    measures__mat__logging: 'existing',
    measures__mat__updates: 'documented',
    measures__mat__docs: 'documented',
  },
  demoScenarios: [
    {
      id: 'mature',
      label: { de: 'Typgeprüftes System — auditreif', en: 'Type-approved system — audit-ready', fr: 'Système homologué — prêt pour l\'audit' },
      description: {
        de: 'Hersteller mit reifem SDL und nahezu vollständigen Security-Capabilities.',
        en: 'Manufacturer with a mature SDL and near-complete security capabilities.',
        fr: 'Fabricant avec SDL mature et capacités de sécurité quasi complètes.',
      },
      answers: {
        entityName: 'SentinelControl PMS',
        role: 'supplier',
        securityLevel: 'sl3',
        category: 'cat3',
        description:
          'Power management system with a mature secure development lifecycle, full IEC 62443-4-2 capability set, signed updates, central log export, SBOM and a documented support/EOL policy. Targeting SL 3 for a safety-critical application.',
        roles: ['sdl', 'testreport', 'manual', 'vuln', 'sbom', 'support'],
        knownIssues:
          'Minor documentation updates pending for the latest firmware release. Penetration test recommendations being closed.',
        measures: ['iac', 'uc', 'si', 'dc', 'rdf', 'tre', 'ra', 'hardening', 'logging', 'updates', 'backup', 'docs'],
        measures__mat__iac: 'audited',
        measures__mat__uc: 'documented',
        measures__mat__si: 'audited',
        measures__mat__dc: 'documented',
        measures__mat__rdf: 'documented',
        measures__mat__tre: 'documented',
        measures__mat__ra: 'documented',
        measures__mat__hardening: 'documented',
        measures__mat__logging: 'documented',
        measures__mat__updates: 'audited',
        measures__mat__backup: 'documented',
        measures__mat__docs: 'documented',
      },
    },
    {
      id: 'developing',
      label: { de: 'In Entwicklung — Teil-Konformität', en: 'In development — partial conformity', fr: 'En développement — conformité partielle' },
      description: {
        de: 'CBS mit Kern-Capabilities, aber offenen Lücken bei Logging, Updates und Recovery.',
        en: 'CBS with core capabilities but open gaps in logging, updates and recovery.',
        fr: 'CBS avec capacités de base mais lacunes en journalisation, mises à jour et restauration.',
      },
      answers: {
        entityName: 'CargoLink Controller',
        role: 'supplier',
        securityLevel: 'sl2',
        category: 'cat2',
        description:
          'Cargo control unit under development. Authentication and use control implemented; integrity and confidentiality partially addressed. No signed updates or configuration backup yet.',
        roles: ['sdl', 'manual'],
        knownIssues:
          'No signed updates. Audit logging missing. No configuration backup/restore. SBOM not produced.',
        measures: ['iac', 'uc', 'si', 'hardening', 'docs'],
        measures__mat__iac: 'documented',
        measures__mat__uc: 'existing',
        measures__mat__si: 'existing',
        measures__mat__hardening: 'existing',
        measures__mat__docs: 'documented',
      },
    },
    {
      id: 'early',
      label: { de: 'Legacy-/Frühphase', en: 'Legacy / early stage', fr: 'Legacy / phase initiale' },
      description: {
        de: 'Älteres oder frühes System ohne formalisierte Security-Capabilities, viele Lücken.',
        en: 'Legacy or early system with no formalised security capabilities and many gaps.',
        fr: 'Système ancien ou précoce sans capacités de sécurité formalisées, nombreuses lacunes.',
      },
      answers: {
        entityName: 'LegacyView Display Unit',
        role: 'owner',
        securityLevel: 'unsure',
        category: 'cat1',
        description:
          'Older display/monitoring unit retrofitted on board. No documented secure development, default shared credentials, unsigned firmware and serial-only interfaces. Owner wants a baseline against UR E27.',
        roles: [],
        knownIssues:
          'Shared default credentials, no authentication granularity, no integrity verification, no logging, no patch process, no recovery path.',
        measures: [],
      },
    },
  ],
};
