import type { LucideIcon } from 'lucide-react';
import { Anchor, Bot, Boxes, ClipboardCheck, FileOutput, Gauge, ListChecks, Network, Route, ShieldCheck, Wrench } from 'lucide-react';
import type { HomeLanguage, LocalizedText } from '@/data/homeTopics';

const l = (de: string, en: string, fr: string): LocalizedText => ({ de, en, fr });

export type ToolIntroduction = {
  key: string;
  name: string;
  eyebrow: LocalizedText;
  audience: LocalizedText;
  problem: LocalizedText;
  inputs: LocalizedText[];
  steps: { title: LocalizedText; description: LocalizedText }[];
  outcomes: LocalizedText[];
  limits: LocalizedText;
  icon: LucideIcon;
};

const commonSteps = (
  first: LocalizedText,
  second: LocalizedText,
  third: LocalizedText,
) => [
  { title: l('Vorbereiten', 'Prepare', 'Préparer'), description: first },
  { title: l('Bearbeiten', 'Work through', 'Évaluer'), description: second },
  { title: l('Ergebnis nutzen', 'Use the result', 'Exploiter le résultat'), description: third },
];

export const TOOL_INTRODUCTIONS: ToolIntroduction[] = [
  {
    key: 'gapzero', name: 'GapZero', icon: Gauge,
    eyebrow: l('Interne Revision & Readiness', 'Internal audit & readiness', 'Audit interne & préparation à l’audit'),
    audience: l('Für Verantwortliche in Informationssicherheit, Compliance und interner Revision.', 'For information security, compliance and internal audit leads.', 'Pour les responsables sécurité de l’information, conformité et audit interne.'),
    problem: l('Führt strukturiert durch das Kontrolldesign eines gewählten Regelwerks und macht Lücken, Begründungen und Maßnahmen nachvollziehbar.', 'Guides a structured review of control design against a selected framework and documents gaps, rationale and actions.', 'Guide une revue structurée de la conception des contrôles selon un référentiel et documente écarts, justification et actions.'),
    inputs: [l('Regelwerk und Geltungsbereich', 'Framework and scope', 'Référentiel et périmètre'), l('Prüfergeführte Antworten und Nachweise', 'Assessor-led answers and evidence', 'Réponses guidées par l’auditeur et éléments probants')],
    steps: commonSteps(l('Standard und Prüfkontext auswählen.', 'Select the standard and review context.', 'Sélectionner la norme et le contexte.'), l('Kontrolldesign anhand geführter Fragen beurteilen.', 'Assess control design through guided questions.', 'Évaluer la conception des contrôles par des questions guidées.'), l('Strukturierte Bewertung und Dokumentation exportieren.', 'Export a structured assessment and documentation.', 'Exporter une évaluation et une documentation structurées.')),
    outcomes: [l('Readiness-Bewertung', 'Readiness assessment', 'Évaluation de préparation'), l('Priorisierte Feststellungen und Maßnahmen', 'Prioritised findings and actions', 'Constats et actions priorisés'), l('Nachvollziehbarer Bericht', 'Traceable report', 'Rapport traçable')],
    limits: l('Bewertet eingegebenes Kontrolldesign und Nachweise. Es prüft weder die tatsächliche Wirksamkeit im Betrieb noch garantiert es Normkonformität oder ein erfolgreiches Audit.', 'Assesses submitted control design and evidence. It does not test operating effectiveness or guarantee conformity or a successful audit.', 'Évalue la conception des contrôles et les preuves saisies. Il ne teste pas l’efficacité opérationnelle et ne garantit ni conformité ni réussite d’un audit.'),
  },
  {
    key: 'assessment-tools', name: 'Assessment Tools', icon: Boxes,
    eyebrow: l('Geschützter Werkzeugkatalog', 'Protected tool catalogue', 'Catalogue d’outils protégé'),
    audience: l('Für Fachverantwortliche, die den passenden strukturierten Check auswählen möchten.', 'For practitioners selecting the right structured assessment.', 'Pour les responsables qui souhaitent choisir l’évaluation structurée adaptée.'),
    problem: l('Bündelt die verfügbaren Assessment- und Compliance-Werkzeuge an einem geschützten Einstiegspunkt.', 'Brings the available assessment and compliance tools together behind one protected entry point.', 'Regroupe les outils d’évaluation et de conformité derrière un accès protégé.'),
    inputs: [l('Gewünschtes Regelwerk oder Thema', 'Required framework or topic', 'Référentiel ou sujet recherché')],
    steps: commonSteps(l('Zugang öffnen.', 'Open the protected catalogue.', 'Ouvrir le catalogue protégé.'), l('Werkzeug nach Aufgabe auswählen.', 'Choose a tool for the task.', 'Choisir l’outil selon le besoin.'), l('Den jeweiligen geführten Ablauf starten.', 'Start its guided workflow.', 'Démarrer son parcours guidé.')),
    outcomes: [l('Direkter Zugang zu verfügbaren Checks', 'Direct access to available checks', 'Accès direct aux évaluations disponibles')],
    limits: l('Der Katalog selbst führt keine Prüfung durch. Umfang und Grenzen stehen beim jeweiligen Werkzeug.', 'The catalogue does not perform an assessment itself. Each tool states its own scope and limits.', 'Le catalogue ne réalise pas lui-même d’évaluation. Chaque outil précise son périmètre et ses limites.'),
  },
  {
    key: 'iacs-ur26', name: 'IACS UR E26 Readiness', icon: Anchor,
    eyebrow: l('Maritime Cyber-Resilienz', 'Maritime cyber resilience', 'Cyber-résilience maritime'),
    audience: l('Für Reedereien, Werften und Verantwortliche für die Cyber-Resilienz des Schiffs als Ganzes.', 'For shipowners, yards and teams responsible for vessel-level cyber resilience.', 'Pour armateurs, chantiers et responsables de la cyber-résilience du navire.'),
    problem: l('Strukturiert die Readiness-Bewertung der schiffsweiten Anforderungen aus IACS UR E26.', 'Structures a readiness review of vessel-level IACS UR E26 requirements.', 'Structure l’évaluation de préparation aux exigences IACS UR E26 au niveau du navire.'),
    inputs: [l('Schiffs- und Einsatzprofil', 'Vessel and operating profile', 'Profil du navire et d’exploitation'), l('Kontrollstatus und verfügbare Nachweise', 'Control status and available evidence', 'État des contrôles et preuves disponibles')],
    steps: commonSteps(l('Anwendbarkeit und Profil erfassen.', 'Capture applicability and profile.', 'Définir l’applicabilité et le profil.'), l('Anforderungen und Evidenz strukturiert bewerten.', 'Review requirements and evidence.', 'Évaluer exigences et preuves.'), l('Readiness-Bericht und Maßnahmen ableiten.', 'Derive a readiness report and actions.', 'Produire un rapport de préparation et des actions.')),
    outcomes: [l('Readiness-Bild nach Anforderungsbereichen', 'Readiness view by requirement area', 'Vue de préparation par domaine'), l('Dokumentierte Lücken und Maßnahmen', 'Documented gaps and actions', 'Écarts et actions documentés')],
    limits: l('Eine geführte Readiness-Bewertung, keine Klassifikationsabnahme oder Zertifizierung.', 'A guided readiness assessment, not class approval or certification.', 'Une évaluation guidée de préparation, non une approbation de classe ou certification.'),
  },
  {
    key: 'iacs-ur27', name: 'IACS UR E27 Readiness', icon: ShieldCheck,
    eyebrow: l('Cyber-Resilienz von Bordsystemen', 'Cyber resilience of onboard systems', 'Cyber-résilience des systèmes embarqués'),
    audience: l('Für Systemhersteller, Integratoren, Werften und maritime Cyber-Verantwortliche.', 'For system suppliers, integrators, yards and maritime cyber leads.', 'Pour fournisseurs de systèmes, intégrateurs, chantiers et responsables cyber maritimes.'),
    problem: l('Ordnet die Anforderungen an einzelne Computer-based Systems und deren Nachweise.', 'Organises requirements and evidence for individual computer-based systems.', 'Structure les exigences et preuves relatives aux systèmes informatisés individuels.'),
    inputs: [l('Systemkategorie und Anwendbarkeit', 'System category and applicability', 'Catégorie système et applicabilité'), l('Architektur, Zugriff und Nachweise', 'Architecture, access and evidence', 'Architecture, accès et preuves')],
    steps: commonSteps(l('System und Anwendbarkeit abgrenzen.', 'Define the system and applicability.', 'Délimiter le système et l’applicabilité.'), l('Anforderungen und Evidenz bewerten.', 'Review requirements and evidence.', 'Évaluer exigences et preuves.'), l('Readiness und offene Punkte dokumentieren.', 'Document readiness and open items.', 'Documenter la préparation et les points ouverts.')),
    outcomes: [l('Anforderungsbezogene Readiness', 'Requirement-level readiness', 'Préparation par exigence'), l('Nachweis- und Maßnahmenübersicht', 'Evidence and action overview', 'Vue des preuves et actions')],
    limits: l('Unterstützt die Vorbereitung; ersetzt keine Produktprüfung, Klassifikationsabnahme oder unabhängige Verifikation.', 'Supports preparation; it does not replace product testing, class approval or independent verification.', 'Aide à la préparation sans remplacer essais produit, approbation de classe ou vérification indépendante.'),
  },
  {
    key: 'iec62443', name: 'IEC 62443 Assessment', icon: Network,
    eyebrow: l('OT-Security Readiness', 'OT security readiness', 'Préparation sécurité OT'),
    audience: l('Für Betreiber und Verantwortliche industrieller Automatisierungs- und Steuerungssysteme.', 'For operators and owners of industrial automation and control systems.', 'Pour exploitants et responsables de systèmes industriels d’automatisation et de contrôle.'),
    problem: l('Strukturiert die Bewertung von Zonen, Conduits, Security Levels und Kontrollen nach IEC 62443.', 'Structures the review of zones, conduits, security levels and controls under IEC 62443.', 'Structure l’évaluation des zones, conduits, niveaux de sécurité et contrôles selon IEC 62443.'),
    inputs: [l('OT-Architektur und Systemgrenzen', 'OT architecture and system boundaries', 'Architecture OT et limites système'), l('Kontrollstatus und Evidenz', 'Control status and evidence', 'État des contrôles et preuves')],
    steps: commonSteps(l('Scope und Zielbild festlegen.', 'Set scope and target state.', 'Définir périmètre et cible.'), l('Anforderungen kontrollweise bewerten.', 'Review requirements control by control.', 'Évaluer les exigences contrôle par contrôle.'), l('Lücken und priorisierte Maßnahmen dokumentieren.', 'Document gaps and prioritised actions.', 'Documenter écarts et actions prioritaires.')),
    outcomes: [l('Strukturierte OT-Readiness', 'Structured OT readiness view', 'Vue structurée de la préparation OT'), l('Priorisierte Maßnahmen', 'Prioritised actions', 'Actions priorisées')],
    limits: l('Keine technische Penetrationsprüfung und keine Zertifizierungszusage.', 'Not a technical penetration test or certification assurance.', 'Ni test d’intrusion technique ni garantie de certification.'),
  },
  {
    key: 'ernstlfall', name: 'ERNSTLFALL', icon: ClipboardCheck,
    eyebrow: l('Tabletop-Übungsgenerator', 'Tabletop exercise generator', 'Générateur d’exercice sur table'),
    audience: l('Für Genossenschaftsbanken, die eine strukturierte Krisenübung vorbereiten.', 'For cooperative banks preparing a structured crisis exercise.', 'Pour les banques coopératives préparant un exercice de crise structuré.'),
    problem: l('Erstellt aus Bankprofil, Themen und Übungsparametern einen anpassbaren Übungsentwurf.', 'Creates an adaptable exercise draft from bank profile, topics and exercise parameters.', 'Crée un projet d’exercice adaptable à partir du profil, des thèmes et paramètres.'),
    inputs: [l('Bankprofil und gewählte Vorfälle', 'Bank profile and selected incidents', 'Profil de banque et incidents choisis'), l('Dauer, Zielgruppe und Übungsparameter', 'Duration, audience and exercise parameters', 'Durée, public et paramètres')],
    steps: commonSteps(l('Profil und Themen festlegen.', 'Define profile and topics.', 'Définir profil et thèmes.'), l('Übungsparameter prüfen und generieren.', 'Review parameters and generate.', 'Vérifier les paramètres et générer.'), l('Ergebnis prüfen und als Word-Datei exportieren.', 'Review and export as a Word file.', 'Relire et exporter au format Word.')),
    outcomes: [l('Szenario, Injects, Rollen und Arbeitsmaterial', 'Scenario, injects, roles and worksheets', 'Scénario, injects, rôles et supports'), l('Bearbeitbarer Word-Export', 'Editable Word export', 'Export Word modifiable')],
    limits: l('Der Entwurf muss vor Einsatz fachlich, organisatorisch und rechtlich durch den Übungsverantwortlichen geprüft werden.', 'The draft requires technical, organisational and legal review by the exercise owner before use.', 'Le projet doit être validé sur les plans métier, organisationnel et juridique avant utilisation.'),
  },
  {
    key: 'marsec', name: 'MarSec Studio', icon: Anchor,
    eyebrow: l('Maritime Übungsgestaltung', 'Maritime exercise design', 'Conception d’exercices maritimes'),
    audience: l('Für Container-Reedereien, Hafenbetreiber und Kreuzfahrtunternehmen.', 'For container shipping companies, port operators and cruise lines.', 'Pour compagnies maritimes, opérateurs portuaires et croisiéristes.'),
    problem: l('Erstellt maritime Krisenübungen passend zu Sektor, Vorfällen und Übungszielen.', 'Creates maritime crisis exercises aligned to sector, incidents and objectives.', 'Crée des exercices de crise maritime adaptés au secteur, aux incidents et objectifs.'),
    inputs: [l('Maritimer Sektor und ausgewählte Vorfälle', 'Maritime sector and selected incidents', 'Secteur maritime et incidents choisis'), l('Teilnehmer, Dauer und Lernziele', 'Participants, duration and learning objectives', 'Participants, durée et objectifs pédagogiques')],
    steps: commonSteps(l('Übungskontext festlegen.', 'Define the exercise context.', 'Définir le contexte de l’exercice.'), l('Szenario automatisch erzeugen und qualitätssichern.', 'Generate and quality-check the scenario.', 'Générer et contrôler la qualité du scénario.'), l('Unterlagen und One-Pager exportieren.', 'Export materials and the one-page brief.', 'Exporter les supports et le one-pager.')),
    outcomes: [l('Maritimes Übungspaket', 'Maritime exercise package', 'Dossier d’exercice maritime'), l('Word-Dokumente und PDF-One-Pager', 'Word documents and PDF one-pager', 'Documents Word et one-pager PDF')],
    limits: l('Die generierten Unterlagen sind ein Arbeitsentwurf und müssen vor einer realen Übung durch Verantwortliche geprüft und freigegeben werden.', 'Generated materials are a working draft and must be reviewed and approved before a live exercise.', 'Les supports générés sont un projet de travail à valider avant tout exercice réel.'),
  },
  {
    key: 'cra-check', name: 'CRA Compliance Tool', icon: Wrench,
    eyebrow: l('Cyber Resilience Act Readiness', 'Cyber Resilience Act readiness', 'Préparation au Cyber Resilience Act'),
    audience: l('Für Hersteller und Verantwortliche digitaler Produkte.', 'For manufacturers and owners of products with digital elements.', 'Pour fabricants et responsables de produits comportant des éléments numériques.'),
    problem: l('Strukturiert Anforderungen, Produktkontext, Evidenz und offene Maßnahmen zum CRA.', 'Structures CRA requirements, product context, evidence and open actions.', 'Structure exigences CRA, contexte produit, preuves et actions ouvertes.'),
    inputs: [l('Produktprofil, Rolle und Nachweise', 'Product profile, role and evidence', 'Profil produit, rôle et preuves')],
    steps: commonSteps(l('Produkt und Rolle abgrenzen.', 'Define product and role.', 'Délimiter produit et rôle.'), l('Anforderungen geführt bewerten.', 'Review requirements through guided questions.', 'Évaluer les exigences de manière guidée.'), l('Readiness-Bericht und Maßnahmen ableiten.', 'Produce a readiness report and actions.', 'Produire rapport de préparation et actions.')),
    outcomes: [l('Dokumentierte CRA-Readiness', 'Documented CRA readiness', 'Préparation CRA documentée'), l('Priorisierte Maßnahmen', 'Prioritised actions', 'Actions priorisées')],
    limits: l('Keine Konformitätsbewertung durch eine benannte Stelle und keine Rechtsberatung.', 'Not a conformity assessment by a notified body and not legal advice.', 'Ni évaluation par un organisme notifié ni conseil juridique.'),
  },
  {
    key: 'dora-compliance', name: 'DORA Compliance Tool', icon: ClipboardCheck,
    eyebrow: l('DORA Readiness', 'DORA readiness', 'Préparation DORA'),
    audience: l('Für Finanzunternehmen und Verantwortliche für IKT-Risikomanagement.', 'For financial entities and ICT risk owners.', 'Pour entités financières et responsables des risques TIC.'),
    problem: l('Führt durch eine strukturierte DORA-Bewertung mit dokumentierter Begründung und Maßnahmen.', 'Guides a structured DORA assessment with documented rationale and actions.', 'Guide une évaluation DORA structurée avec justification et actions documentées.'),
    inputs: [l('Unternehmenskontext, Kontrollstatus und Evidenz', 'Entity context, control status and evidence', 'Contexte, état des contrôles et preuves')],
    steps: commonSteps(l('Scope und Kontext erfassen.', 'Capture scope and context.', 'Définir périmètre et contexte.'), l('Anforderungen und Nachweise beurteilen.', 'Review requirements and evidence.', 'Évaluer exigences et preuves.'), l('Bewertung und Maßnahmen exportieren.', 'Export assessment and actions.', 'Exporter évaluation et actions.')),
    outcomes: [l('DORA-Readiness-Bericht', 'DORA readiness report', 'Rapport de préparation DORA'), l('Feststellungen und Maßnahmenplan', 'Findings and action plan', 'Constats et plan d’action')],
    limits: l('Eine strukturierte Selbsteinschätzung; keine aufsichtsrechtliche Feststellung oder Rechtsberatung.', 'A structured self-assessment, not a regulatory determination or legal advice.', 'Une auto-évaluation structurée, non une décision réglementaire ou un conseil juridique.'),
  },
  {
    key: 'nis2-compliance', name: 'NIS-2 Compliance Tool', icon: ShieldCheck,
    eyebrow: l('NIS-2 Readiness', 'NIS 2 readiness', 'Préparation NIS 2'),
    audience: l('Für Leitung, Informationssicherheit und Compliance potenziell betroffener Organisationen.', 'For management, security and compliance teams in potentially affected organisations.', 'Pour directions, sécurité et conformité d’organisations potentiellement concernées.'),
    problem: l('Strukturiert die Bewertung von Governance, Risikomaßnahmen und Meldebereitschaft nach NIS-2.', 'Structures the review of governance, risk measures and reporting readiness under NIS 2.', 'Structure l’évaluation de la gouvernance, des mesures de risque et de la capacité de notification NIS 2.'),
    inputs: [l('Organisationsprofil, Maßnahmenstatus und Evidenz', 'Organisation profile, measure status and evidence', 'Profil organisationnel, état des mesures et preuves')],
    steps: commonSteps(l('Kontext und Betroffenheit erfassen.', 'Capture context and applicability.', 'Définir contexte et applicabilité.'), l('Anforderungen geführt bewerten.', 'Review requirements through guided questions.', 'Évaluer les exigences de manière guidée.'), l('Readiness und Maßnahmen dokumentieren.', 'Document readiness and actions.', 'Documenter préparation et actions.')),
    outcomes: [l('NIS-2-Readiness-Bericht', 'NIS 2 readiness report', 'Rapport de préparation NIS 2'), l('Priorisierte Lücken und Maßnahmen', 'Prioritised gaps and actions', 'Écarts et actions priorisés')],
    limits: l('Keine verbindliche Betroffenheitsentscheidung, Rechtsberatung oder behördliche Bestätigung.', 'Not a binding scope determination, legal advice or authority confirmation.', 'Ni décision contraignante d’applicabilité, ni conseil juridique, ni confirmation d’une autorité.'),
  },
  {
    key: 'ai-act-readiness', name: 'EU AI Act Readiness Assessment', icon: Bot,
    eyebrow: l('KI-Systeme einordnen', 'Classify AI systems', 'Qualifier les systèmes d’IA'),
    audience: l('Für Anbieter und Betreiber, die Pflichten für ein konkretes KI-System einordnen.', 'For providers and deployers assessing duties for a specific AI system.', 'Pour fournisseurs et déployeurs évaluant les obligations d’un système d’IA.'),
    problem: l('Unterstützt die Risikoklassifizierung und strukturiert die daraus abgeleiteten Pflichten und Nachweise.', 'Supports risk classification and structures resulting obligations and evidence.', 'Aide à classifier le risque et structure les obligations et preuves associées.'),
    inputs: [l('Systemzweck, Einsatzkontext und Rolle', 'System purpose, use context and role', 'Finalité, contexte d’usage et rôle')],
    steps: commonSteps(l('KI-System und Rolle beschreiben.', 'Describe the AI system and role.', 'Décrire le système d’IA et le rôle.'), l('Risikoklasse und Pflichten geführt prüfen.', 'Review risk class and duties.', 'Examiner classe de risque et obligations.'), l('Readiness und nächste Schritte dokumentieren.', 'Document readiness and next steps.', 'Documenter préparation et prochaines étapes.')),
    outcomes: [l('Begründete Risikoeinordnung', 'Reasoned risk classification', 'Classification de risque motivée'), l('Strukturierte Pflichtenübersicht', 'Structured duties overview', 'Vue structurée des obligations')],
    limits: l('Unterstützt die fachliche Einordnung, ersetzt aber keine Rechtsberatung oder behördliche Entscheidung.', 'Supports professional assessment but does not replace legal advice or an authority decision.', 'Aide à l’analyse sans remplacer un conseil juridique ou une décision d’autorité.'),
  },
  {
    key: 'itsm', name: 'ITSM Tool', icon: Route,
    eyebrow: l('IT-Service-Management', 'IT service management', 'Gestion des services IT'),
    audience: l('Für Verantwortliche, die einen bestehenden IT-Servicekatalog konsolidieren und seine Beziehungen prüfen.', 'For practitioners consolidating an existing IT service catalogue and reviewing its relationships.', 'Pour les responsables qui consolident un catalogue de services IT existant et vérifient ses relations.'),
    problem: l('Verknüpft Services, Geschäftsprozesse, Benutzergruppen, Berechtigungen und Abhängigkeiten in einer prüfbaren Katalogsicht.', 'Connects services, business processes, user groups, permissions and dependencies in a reviewable catalogue.', 'Relie services, processus métier, groupes, habilitations et dépendances dans un catalogue vérifiable.'),
    inputs: [l('Services, Prozesse, Gruppen und Berechtigungen', 'Services, processes, groups and permissions', 'Services, processus, groupes et habilitations'), l('Manuelle Eingaben oder vorbereitete JSON-, CSV- und TXT-Dateien', 'Manual entries or prepared JSON, CSV and TXT files', 'Saisie manuelle ou fichiers JSON, CSV et TXT préparés')],
    steps: commonSteps(l('Stammdaten erfassen oder importieren.', 'Enter or import master data.', 'Saisir ou importer les données de référence.'), l('Mappings, Berechtigungen, Abhängigkeiten und Datenqualität prüfen.', 'Review mappings, permissions, dependencies and data quality.', 'Vérifier correspondances, habilitations, dépendances et qualité des données.'), l('Katalog, Visualisierungen und Prüfergebnisse exportieren.', 'Export the catalogue, visualisations and review results.', 'Exporter catalogue, visualisations et résultats de contrôle.')),
    outcomes: [l('Strukturierter Servicekatalog', 'Structured service catalogue', 'Catalogue de services structuré'), l('2D-/3D-Abhängigkeitsdarstellung', '2D/3D dependency visualisation', 'Visualisation 2D/3D des dépendances'), l('Qualitäts-/Compliance-Übersicht und CSV-/JSON-Exporte', 'Quality/compliance overview and CSV/JSON exports', 'Vue qualité/conformité et exports CSV/JSON')],
    limits: l('Daten bleiben im Arbeitsspeicher des Browsers; ein Export sichert den Stand. KI-Funktionen benötigen einen bereitgestellten API-Schlüssel und ersetzen keine fachliche Prüfung.', 'Data remains in browser memory; export saves the current state. AI features require a supplied API key and do not replace professional review.', 'Les données restent en mémoire dans le navigateur ; l’export sauvegarde l’état. Les fonctions IA nécessitent une clé fournie et ne remplacent pas une revue métier.'),
  },
  {
    key: 'itsm-dev', name: 'ITSM Dev Tool', icon: FileOutput,
    eyebrow: l('Interner Entwicklungszugang', 'Internal development access', 'Accès de développement interne'),
    audience: l('Für autorisierte Personen, die die Entwicklungsfassung des ITSM-Werkzeugs prüfen.', 'For authorised reviewers of the ITSM development version.', 'Pour les personnes autorisées à examiner la version de développement ITSM.'),
    problem: l('Erweitert den ITSM-Katalog um interne Testmodule für Configuration Items, Incidents, Changes, SLAs, Reifegrad- und Gap-Analyse.', 'Extends the ITSM catalogue with internal trial modules for configuration items, incidents, changes, SLAs, maturity and gap analysis.', 'Étend le catalogue ITSM avec des modules internes de test pour éléments de configuration, incidents, changements, SLA, maturité et écarts.'),
    inputs: [l('Vorbereitete Testdaten für Katalog und zusätzliche Module', 'Prepared test data for the catalogue and additional modules', 'Données de test préparées pour le catalogue et les modules supplémentaires')],
    steps: commonSteps(l('Internen Prüfauftrag und Testdaten festlegen.', 'Define the internal review task and test data.', 'Définir la revue interne et les données de test.'), l('Zusatzmodule und geführten Ablauf prüfen.', 'Review the additional modules and guided flow.', 'Examiner les modules supplémentaires et le parcours guidé.'), l('XLSX-/PDF-Ausgaben und Beobachtungen bewerten.', 'Review XLSX/PDF outputs and observations.', 'Évaluer les sorties XLSX/PDF et les observations.')),
    outcomes: [l('Geprüfter Entwicklungsstand', 'Reviewed development state', 'Version de développement examinée'), l('Testausgaben als XLSX und PDF', 'Trial XLSX and PDF outputs', 'Sorties de test XLSX et PDF')],
    limits: l('Interne Testfassung mit noch nicht freigegebenen Modulen; nicht für reale Betriebsdaten.', 'Internal trial build with modules not yet released; not for live operational data.', 'Version interne d’essai avec modules non encore validés ; non destinée à des données opérationnelles réelles.'),
  },
  {
    key: 'sitemap-index', name: 'Sitemap / Index', icon: ListChecks,
    eyebrow: l('Interner Routenindex', 'Internal route index', 'Index interne des routes'),
    audience: l('Für autorisierte Pflege und Prüfung der vorhandenen Seiten.', 'For authorised maintenance and review of existing pages.', 'Pour la maintenance et la revue autorisées des pages existantes.'),
    problem: l('Bündelt interne Direktzugänge zu vorhandenen Routen.', 'Collects internal direct links to existing routes.', 'Regroupe les accès directs internes aux routes existantes.'),
    inputs: [l('Kein fachlicher Input erforderlich', 'No professional input required', 'Aucune donnée métier requise')],
    steps: commonSteps(l('Zugang öffnen.', 'Open access.', 'Ouvrir l’accès.'), l('Gesuchte Route auswählen.', 'Select the required route.', 'Choisir la route recherchée.'), l('Zielseite separat prüfen.', 'Review the destination separately.', 'Examiner séparément la page cible.')),
    outcomes: [l('Geschützter Seitenindex', 'Protected page index', 'Index de pages protégé')],
    limits: l('Nur Navigation; der Index verändert keine Inhalte oder Daten.', 'Navigation only; the index does not change content or data.', 'Navigation uniquement ; l’index ne modifie ni contenu ni données.'),
  },
];

export function getToolIntroduction(storageKey: string, label?: string) {
  if (label === 'GapZero') return TOOL_INTRODUCTIONS.find((item) => item.key === 'gapzero');
  if (label === 'IACS UR E26 Compliance Tool') return TOOL_INTRODUCTIONS.find((item) => item.key === 'iacs-ur26');
  if (label === 'IACS UR E27 Compliance Tool') return TOOL_INTRODUCTIONS.find((item) => item.key === 'iacs-ur27');
  if (label === 'IEC 62443 Compliance Tool') return TOOL_INTRODUCTIONS.find((item) => item.key === 'iec62443');
  if (label === 'MarSec Studio') return TOOL_INTRODUCTIONS.find((item) => item.key === 'marsec');
  return TOOL_INTRODUCTIONS.find((item) => item.key === storageKey);
}

export const getLocalized = (value: LocalizedText, language: HomeLanguage) => value[language];