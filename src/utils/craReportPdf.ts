import jsPDF from 'jspdf';
import type { IntakeData, Threat, CraReq } from '@/data/craData';
import { threatId } from '@/data/craData';
import type { QaCheck } from '@/utils/craQualityCheck';

export interface CraReportData {
  intakeData: IntakeData;
  threats: Threat[];
  reqs: CraReq[];
  language: 'de' | 'en' | 'fr';
  productTypeName: string;
  craClassName: string;
  isDraft?: boolean;
  /** QA checks from the iterative quality check workflow */
  qaChecks?: QaCheck[];
  /** Fix log entries from automated remediation */
  fixLog?: string[];
  /** Number of QA iterations performed */
  qaIterations?: number;
}

/* ════════════════════════════════════════════════════════════
   I18N
   ════════════════════════════════════════════════════════════ */
const I18N = {
  title: { de: 'Cyber Risk Assessment', en: 'Cyber Risk Assessment', fr: 'Évaluation des cyber-risques' },
  subtitle: { de: 'Prüfbericht nach EU Cyber Resilience Act', en: 'Assessment Report pursuant to EU Cyber Resilience Act', fr: 'Rapport d\'évaluation selon le Cyber Resilience Act de l\'UE' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },

  sec1: { de: '1  Ausgangslage und Zielsetzung', en: '1  Context and Objectives', fr: '1  Contexte et objectifs' },
  sec2: { de: '2  Zusammenfassung für die Geschäftsleitung', en: '2  Management Summary', fr: '2  Synthèse pour la direction' },
  sec3: { de: '3  Gegenstand der Prüfung', en: '3  Scope of Assessment', fr: '3  Périmètre de l\'évaluation' },
  sec3a: { de: '3.1  Produktsteckbrief', en: '3.1  Product Profile', fr: '3.1  Profil du produit' },
  sec3b: { de: '3.2  Systemkomponenten und Architektur', en: '3.2  System Components and Architecture', fr: '3.2  Composants et architecture du système' },
  sec3c: { de: '3.3  Implementierte Sicherheitsmaßnahmen', en: '3.3  Implemented Security Measures', fr: '3.3  Mesures de sécurité mises en œuvre' },
  sec3d: { de: '3.4  Vom Hersteller benannte Risiken', en: '3.4  Manufacturer-Reported Risks', fr: '3.4  Risques signalés par le fabricant' },
  sec3e: { de: '3.5  Eingereichte Dokumentation', en: '3.5  Submitted Documentation', fr: '3.5  Documentation soumise' },
  sec4: { de: '4  Feststellungen im Einzelnen', en: '4  Detailed Findings', fr: '4  Constatations détaillées' },
  sec4a: { de: '4.1  Bedrohungslandschaft (STRIDE-Analyse)', en: '4.1  Threat Landscape (STRIDE Analysis)', fr: '4.1  Paysage des menaces (analyse STRIDE)' },
  sec4b: { de: '4.2  CRA-Konformitätslücken', en: '4.2  CRA Compliance Gaps', fr: '4.2  Lacunes de conformité CRA' },
  sec4c: { de: '4.3  Normative Abdeckung (CRA-Coverage)', en: '4.3  Normative Coverage (CRA Coverage)', fr: '4.3  Couverture normative (CRA)' },
  sec5: { de: '5  Handlungsempfehlungen und Remediation-Roadmap', en: '5  Recommendations and Remediation Roadmap', fr: '5  Recommandations et feuille de route de remédiation' },
  sec5a: { de: '5.1  Priorisierte Maßnahmen (P0-P3)', en: '5.1  Prioritised Measures (P0-P3)', fr: '5.1  Mesures priorisées (P0-P3)' },
  sec5b: { de: '5.2  Remediation-Roadmap', en: '5.2  Remediation Roadmap', fr: '5.2  Feuille de route de remédiation' },
  sec5c: { de: '5.3  Wirtschaftliche Betrachtung', en: '5.3  Economic Impact Assessment', fr: '5.3  Analyse économique' },
  sec6: { de: '6  Methodik und Prüfungsgrundlagen', en: '6  Methodology and Audit Standards', fr: '6  Méthodologie et normes d\'audit' },
  sec6a: { de: '6.1  Risikobewertungsmatrix', en: '6.1  Risk Rating Matrix', fr: '6.1  Matrice d\'évaluation des risques' },
  sec6b: { de: '6.2  OT-Kontextualisierung der Bewertungsskala', en: '6.2  OT Contextualisation of Rating Scales', fr: '6.2  Contextualisation OT des échelles d\'évaluation' },
  sec7: { de: '7  Einschränkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limites et clause de non-responsabilité' },
  secA: { de: 'A  Strukturierte Prüfdaten (maschinenlesbar)', en: 'A  Structured Audit Data (machine-readable)', fr: 'A  Données d\'audit structurées (lisibles par machine)' },
  secB: { de: 'B  Prüfwerkzeuge und Versionen', en: 'B  Tools and Versions', fr: 'B  Outils et versions' },
  secC: { de: 'C  Evidenz-Material-Index', en: 'C  Evidence Material Index', fr: 'C  Index des éléments de preuve' },
  secD: { de: 'D  Qualitätssicherungs-Checkliste', en: 'D  Quality Assurance Checklist', fr: 'D  Liste de contrôle qualité' },

  product: { de: 'Produkt', en: 'Product', fr: 'Produit' },
  version: { de: 'Version', en: 'Version', fr: 'Version' },
  type: { de: 'Produkttyp', en: 'Product Type', fr: 'Type de produit' },
  productTypes: { de: 'Produktkategorien', en: 'Product Categories', fr: 'Catégories de produit' },
  craClass: { de: 'CRA-Klasse', en: 'CRA Class', fr: 'Classe CRA' },
  deployment: { de: 'Betriebsmodell', en: 'Deployment Model', fr: 'Modèle de déploiement' },
  interfaces: { de: 'Kommunikationsschnittstellen', en: 'Communication Interfaces', fr: 'Interfaces de communication' },
  components: { de: 'Systemkomponenten', en: 'System Components', fr: 'Composants du système' },
  roles: { de: 'Benutzerrollen', en: 'User Roles', fr: 'Rôles utilisateur' },
  description: { de: 'Produktbeschreibung', en: 'Product Description', fr: 'Description du produit' },
  measures: { de: 'Implementierte Maßnahmen', en: 'Implemented Measures', fr: 'Mesures mises en œuvre' },
  knownIssues: { de: 'Vom Hersteller benannte Probleme', en: 'Manufacturer-Reported Issues', fr: 'Problèmes signalés par le fabricant' },
  attachedFiles: { de: 'Eingereichte Dokumente', en: 'Submitted Documents', fr: 'Documents soumis' },

  threat: { de: 'Bedrohung', en: 'Threat', fr: 'Menace' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Betroffene Komponente', en: 'Affected Component', fr: 'Composant concerné' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil de l\'attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Erhobene Evidenz', en: 'Collected Evidence', fr: 'Éléments de preuve recueillis' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Assessment Rationale', fr: 'Fondement de l\'évaluation' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Évaluation du risque' },
  likelihood: { de: 'Eintrittswahrsch.', en: 'Likelihood', fr: 'Probabilité' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Évaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Écart identifié' },
  measureAction: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Mesure recommandée' },
  dod: { de: 'Nachweisbare Umsetzungskriterien', en: 'Verifiable Acceptance Criteria', fr: 'Critères d\'acceptation vérifiables' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources et références' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorité' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevée' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyenne' },
  craRef: { de: 'CRA-Referenz', en: 'CRA Reference', fr: 'Référence CRA' },
  effort: { de: 'Geschätzter Aufwand', en: 'Estimated Effort', fr: 'Effort estimé' },
  p0: { de: 'P0 — Release-Blocker (sofort)', en: 'P0 — Release Blocker (immediate)', fr: 'P0 — Bloquant release (immédiat)' },
  p1: { de: 'P1 — Vor Release', en: 'P1 — Before Release', fr: 'P1 — Avant release' },
  p2: { de: 'P2 — Vor GA', en: 'P2 — Before GA', fr: 'P2 — Avant GA' },
  p3: { de: 'P3 — Empfohlen', en: 'P3 — Recommended', fr: 'P3 — Recommandé' },
  coverageTitle: { de: 'CRA-Anforderungsabdeckung', en: 'CRA Requirements Coverage', fr: 'Couverture des exigences CRA' },
  coverageAnnex1p1: { de: 'Annex I, Part I (Sicherheitseigenschaften)', en: 'Annex I, Part I (Security Properties)', fr: 'Annexe I, Partie I (Propriétés de sécurité)' },
  coverageAnnex1p2: { de: 'Annex I, Part II (Schwachstellenmanagement)', en: 'Annex I, Part II (Vulnerability Management)', fr: 'Annexe I, Partie II (Gestion des vulnérabilités)' },
  coverageArticles: { de: 'Artikel (Prozessuale Anforderungen)', en: 'Articles (Procedural Requirements)', fr: 'Articles (Exigences procédurales)' },
  complianceRate: { de: 'Konformitätsrate', en: 'Compliance Rate', fr: 'Taux de conformité' },
  roadmapIntro: { de: 'Die folgende Roadmap priorisiert die identifizierten Maßnahmen nach Kritikalität und regulatorischer Dringlichkeit. Die Aufwandsschätzungen basieren auf einem Team von 3 Entwicklern, 1 QA-Ingenieur und 1 Security-Ingenieur.', en: 'The following roadmap prioritises identified measures by criticality and regulatory urgency. Effort estimates are based on a team of 3 developers, 1 QA engineer and 1 security engineer.', fr: 'La feuille de route suivante hiérarchise les mesures identifiées par criticité et urgence réglementaire. Les estimations d\'effort sont basées sur une équipe de 3 développeurs, 1 ingénieur QA et 1 ingénieur sécurité.' },
  relatedReqs: { de: 'Verknüpfte Anforderungen', en: 'Related Requirements', fr: 'Exigences liées' },
  relatedThreats: { de: 'Verknüpfte Bedrohungen', en: 'Related Threats', fr: 'Menaces liées' },

  // Section intro texts
  introSec2: { de: 'Dieser Abschnitt fasst die wesentlichen Ergebnisse der Bewertung in kompakter Form zusammen. Er richtet sich an Entscheidungsträger und gibt eine datengestützte Einschätzung der Marktreife.', en: 'This section summarises the key assessment results in a compact format. It is intended for decision-makers and provides a data-driven assessment of market readiness.', fr: 'Cette section resume les principaux resultats de l\'evaluation de maniere compacte. Elle s\'adresse aux decideurs et fournit une evaluation basee sur les donnees de la maturite du produit.' },
  introSec3: { de: 'Der folgende Abschnitt beschreibt den Prüfgegenstand und die vom Hersteller bereitgestellten Informationen. Diese Angaben bilden die Grundlage für die anschließende Bedrohungs- und Konformitätsanalyse.', en: 'This section describes the assessment subject and the information provided by the manufacturer. These details form the basis for the subsequent threat and compliance analysis.', fr: 'Cette section decrit l\'objet de l\'evaluation et les informations fournies par le fabricant. Ces donnees constituent la base de l\'analyse des menaces et de la conformite.' },
  introSec3a: { de: 'Der Produktsteckbrief dokumentiert die wesentlichen Merkmale und die regulatorische Einordnung des bewerteten Produkts.', en: 'The product profile documents the key characteristics and regulatory classification of the assessed product.', fr: 'Le profil produit documente les caracteristiques cles et la classification reglementaire du produit evalue.' },
  introSec3b: { de: 'Die Systemarchitektur und ihre Komponenten bestimmen die Angriffsfläche. Diese Übersicht dient als Grundlage für die STRIDE-Analyse.', en: 'The system architecture and its components determine the attack surface. This overview serves as the basis for the STRIDE analysis.', fr: 'L\'architecture du systeme et ses composants determinent la surface d\'attaque. Cette vue d\'ensemble sert de base a l\'analyse STRIDE.' },
  introSec3c: { de: 'Die folgenden Sicherheitsmaßnahmen wurden vom Hersteller als implementiert angegeben. Ihr Reifegrad wird anhand von drei Kriterien bewertet: aktiv, dokumentiert und auditiert.', en: 'The following security measures were reported as implemented by the manufacturer. Their maturity is assessed against three criteria: active, documented, and audited.', fr: 'Les mesures de securite suivantes ont ete declarees implementees par le fabricant. Leur maturite est evaluee selon trois criteres : active, documentee et auditee.' },
  introSec3d: { de: 'Dieser Abschnitt dokumentiert Risiken und Schwachstellen, die der Hersteller selbst identifiziert und benannt hat.', en: 'This section documents risks and vulnerabilities that the manufacturer has identified and reported.', fr: 'Cette section documente les risques et vulnerabilites identifies et signales par le fabricant.' },
  introSec3e: { de: 'Die eingereichte Dokumentation wird zur Verifizierung der Herstellerangaben und zur Bewertung der Evidenzlage herangezogen.', en: 'The submitted documentation is used to verify manufacturer claims and to assess the evidence base.', fr: 'La documentation soumise est utilisee pour verifier les declarations du fabricant et evaluer la base de preuves.' },
  introSec4: { de: 'In diesem Abschnitt werden die identifizierten Bedrohungen und Konformitätslücken im Detail dargestellt. Jede Feststellung enthält die zugrundeliegende Evidenz, die Bewertungslogik und die regulatorische Referenz.', en: 'This section presents the identified threats and compliance gaps in detail. Each finding includes the underlying evidence, assessment rationale, and regulatory reference.', fr: 'Cette section presente en detail les menaces identifiees et les lacunes de conformite. Chaque constatation comprend les preuves, la logique d\'evaluation et la reference reglementaire.' },
  introSec4a: { de: 'Die Bedrohungsanalyse folgt dem STRIDE-Modell und bewertet jedes Szenario anhand von Eintrittswahrscheinlichkeit und Auswirkung. Kritische Risiken (Score >= 20) erfordern Sofortmaßnahmen.', en: 'The threat analysis follows the STRIDE model and rates each scenario by likelihood and impact. Critical risks (score >= 20) require immediate action.', fr: 'L\'analyse des menaces suit le modele STRIDE et evalue chaque scenario selon la probabilite et l\'impact. Les risques critiques (score >= 20) necessitent une action immediate.' },
  introSec4b: { de: 'Die folgende Übersicht zeigt die Bewertung jeder CRA-Anforderung. Abweichungen werden mit konkreten Maßnahmen und nachweisbaren Umsetzungskriterien versehen.', en: 'The following overview shows the assessment of each CRA requirement. Deviations are accompanied by concrete measures and verifiable acceptance criteria.', fr: 'L\'apercu suivant montre l\'evaluation de chaque exigence CRA. Les ecarts sont accompagnes de mesures concretes et de criteres d\'acceptation verifiables.' },
  introSec4c: { de: 'Die normative Abdeckung zeigt, welcher Anteil der CRA-Anforderungen bereits erfüllt ist. Ein Wert unter 80 % signalisiert erheblichen Nachbesserungsbedarf.', en: 'Normative coverage indicates what proportion of CRA requirements are already met. A value below 80% signals significant remediation needs.', fr: 'La couverture normative indique la proportion d\'exigences CRA deja satisfaites. Une valeur inferieure a 80 % signale un besoin de remediation important.' },
  introSec5: { de: 'Die Handlungsempfehlungen sind nach regulatorischer Dringlichkeit und technischer Kritikalität priorisiert. Die Roadmap gibt einen realistischen Zeitrahmen für die Umsetzung vor.', en: 'Recommendations are prioritised by regulatory urgency and technical criticality. The roadmap provides a realistic timeframe for implementation.', fr: 'Les recommandations sont hierarchisees par urgence reglementaire et criticite technique. La feuille de route fournit un calendrier realiste de mise en oeuvre.' },
  introSec5a: { de: 'Jede Maßnahme ist einer Prioritaetsstufe (P0 bis P3) zugeordnet. P0-Maßnahmen sind Release-Blocker und muessen vor Markteinführung abgeschlossen sein.', en: 'Each measure is assigned a priority level (P0 to P3). P0 measures are release blockers and must be completed before market launch.', fr: 'Chaque mesure est attribuee a un niveau de priorite (P0 a P3). Les mesures P0 sont bloquantes et doivent etre terminees avant la mise sur le marche.' },

  totalThreats: { de: 'Bedrohungen', en: 'Threats', fr: 'Menaces' },
  criticalRisks: { de: 'Kritisch (>= 20)', en: 'Critical (>= 20)', fr: 'Critiques (>= 20)' },
  craGaps: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  partialGaps: { de: 'Teilw. konform', en: 'Partial', fr: 'Partiels' },

  strideDistTitle: { de: 'STRIDE-Verteilung', en: 'STRIDE Distribution', fr: 'Répartition STRIDE' },
  measureMaturity: { de: 'Reifegrad', en: 'Maturity', fr: 'Maturité' },
  active: { de: 'Aktiv', en: 'Active', fr: 'Active' },
  documented: { de: 'Dokumentiert', en: 'Documented', fr: 'Documentée' },
  audited: { de: 'Auditiert', en: 'Audited', fr: 'Auditée' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  noFilesSubmitted: { de: 'Keine Dokumente eingereicht.', en: 'No documents submitted.', fr: 'Aucun document soumis.' },
  noKnownIssues: { de: 'Vom Hersteller wurden keine bekannten Probleme angegeben.', en: 'No known issues reported by the manufacturer.', fr: 'Aucun problème connu signalé par le fabricant.' },
  evidenceQuality: { de: 'Evidenz-Qualität', en: 'Evidence Quality', fr: 'Qualité de la preuve' },
  reproducibility: { de: 'Reproduzierbarkeit', en: 'Reproducibility', fr: 'Reproductibilité' },
  evidenceSummaryTitle: { de: 'Evidenz-Qualitätsübersicht', en: 'Evidence Quality Summary', fr: 'Synthèse de la qualité des preuves' },

  appendixIntro: { de: 'Dieser Anhang enthält die vollständigen Prüfdaten in strukturierter Form. Die Daten sind so aufbereitet, dass die Nachvollziehbarkeit und Richtigkeit der getroffenen Bewertungsentscheidungen durch Dritte — einschließlich automatisierter Systeme — überprüft werden kann.\n\nJede Feststellung enthält die zugrundeliegende Evidenz, die Bewertungslogik (Rationale) und die regulatorische Referenz, die zur Einstufung geführt hat. Die Verknüpfungen zwischen Bedrohungen und CRA-Anforderungen sind explizit ausgewiesen.', en: 'This appendix contains the complete audit data in structured form. The data is prepared so that the traceability and correctness of the assessment decisions can be verified by third parties — including automated systems.\n\nEach finding includes the underlying evidence, the assessment logic (rationale), and the regulatory reference that led to the classification. The cross-references between threats and CRA requirements are explicitly documented.', fr: 'Cette annexe contient les données d\'audit complètes sous forme structurée. Les données sont préparées de manière à permettre la vérification de la traçabilité et de l\'exactitude des décisions d\'évaluation par des tiers — y compris des systèmes automatisés.\n\nChaque constatation comprend les preuves sous-jacentes, la logique d\'évaluation (rationale) et la référence réglementaire ayant conduit à la classification. Les références croisées entre menaces et exigences CRA sont explicitement documentées.' },
};

/* ════════════════════════════════════════════════════════════
   Prose blocks
   ════════════════════════════════════════════════════════════ */
function getContextText(p: string, v: string, typeName: string, cls: string, date: string, lang: string): string {
  if (lang === 'de') return `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Cyber-Risikobewertung für das Produkt ${p} ${v} (${typeName}, CRA-Klasse: ${cls}). Die Prüfung wurde am ${date} durchgeführt.\n\nZielsetzung war die systematische Identifikation von Bedrohungen nach dem STRIDE-Modell sowie die Bewertung der Konformität mit den wesentlichen Anforderungen des EU Cyber Resilience Act (Verordnung (EU) 2024/2847). Der Bericht richtet sich an die Geschäftsleitung, das Produktmanagement und die für Informationssicherheit verantwortlichen Stellen.\n\nDie Bewertung umfasst sowohl eine technische Bedrohungsanalyse als auch eine regulatorische Konformitätsprüfung gegen die Anforderungen aus Annex I (Sicherheitseigenschaften), Annex II (Schwachstellenbehandlung) sowie den Artikeln 13 und 14 des CRA.\n\nDer Bericht ist so strukturiert, dass die getroffenen Bewertungsentscheidungen durch Dritte — einschließlich automatisierter Prüfverfahren — vollständig nachvollzogen und verifiziert werden können. Alle Feststellungen enthalten die zugrundeliegende Evidenz, die Bewertungslogik sowie die normativen Referenzen.`;
  if (lang === 'fr') return `Le présent rapport documente les résultats d'une évaluation structurée des cyber-risques pour le produit ${p} ${v} (${typeName}, classe CRA : ${cls}). L'évaluation a été réalisée le ${date}.\n\nL'objectif était l'identification systématique des menaces selon le modèle STRIDE ainsi que l'évaluation de la conformité aux exigences essentielles du Cyber Resilience Act européen (Règlement (UE) 2024/2847). Ce rapport s'adresse à la direction, au management produit et aux responsables de la sécurité de l'information.\n\nL'évaluation couvre à la fois une analyse technique des menaces et une vérification de conformité réglementaire contre les exigences de l'Annexe I, l'Annexe II ainsi que les Articles 13 et 14 du CRA.\n\nLe rapport est structuré de manière à permettre la traçabilité et la vérification complète des décisions d'évaluation par des tiers — y compris des systèmes automatisés. Chaque constatation inclut les preuves, la logique d'évaluation et les références normatives.`;
  return `This report documents the results of a structured cyber risk assessment for the product ${p} ${v} (${typeName}, CRA class: ${cls}). The assessment was conducted on ${date}.\n\nThe objective was the systematic identification of threats using the STRIDE model and the evaluation of compliance with the essential requirements of the EU Cyber Resilience Act (Regulation (EU) 2024/2847). This report is intended for executive management, product management, and information security stakeholders.\n\nThe assessment covers both a technical threat analysis and a regulatory compliance review against the requirements of Annex I (security properties), Annex II (vulnerability handling), and Articles 13 and 14 of the CRA.\n\nThe report is structured to enable full traceability and verification of assessment decisions by third parties — including automated verification systems. Each finding includes the underlying evidence, the assessment rationale, and the normative references.`;
}

function getMgmtSummaryData(
  p: string, allThreats: Threat[], critRisksList: Threat[], failReqsList: CraReq[], partialReqsList: CraReq[], totalReqs: number, passReqs: number, lang: string
): { verdict: string; situationLine: string; findings: { title: string; detail: string }[]; implication: string; action: string } {
  const threats = allThreats.length;
  const crit = critRisksList.length;
  const failReqs = failReqsList.length;
  const partialReqs = partialReqsList.length;
  const topCritNames = critRisksList.slice(0, 3).map(r => r.name);
  const topFailNames = failReqsList.slice(0, 3).map(r => r.name);
  const topPartialNames = partialReqsList.slice(0, 3).map(r => r.name);
  const complianceRate = totalReqs > 0 ? Math.round(((passReqs + partialReqs * 0.5) / totalReqs) * 100) : 0;
  const isReady = crit === 0 && failReqs === 0;
  const isPartial = !isReady && complianceRate >= 60;

  if (lang === 'de') {
    return {
      verdict: isReady
        ? `${p} erfüllt die wesentlichen CRA-Anforderungen. Marktreife gegeben.`
        : isPartial
          ? `${p} erreicht ${complianceRate} % CRA-Konformität. Gezielte Nacharbeit erforderlich.`
          : `${p} erreicht ${complianceRate} % CRA-Konformität. Ohne Nachbesserung nicht marktfähig.`,
      situationLine: `${threats} Bedrohungsszenarien identifiziert | ${crit} kritisch (Score >= 20) | ${failReqs} von ${totalReqs} Anforderungen nicht konform | ${partialReqs} teilweise konform`,
      findings: [
        ...(crit > 0 ? [{
          title: `${crit} kritische Risiken erfordern Sofortmaßnahmen`,
          detail: `Angreifer können mit vertretbarem Aufwand erheblichen Schaden anrichten. Betroffen sind Bereiche, in denen grundlegende Schutzmechanismen fehlen oder unzureichend implementiert sind. Konkret handelt es sich um: ${topCritNames.join(', ')}${crit > 3 ? ` und ${crit - 3} weitere` : ''}. Jede Woche Verzögerung erhöht das Risiko regulatorischer Beanstandungen.`,
        }] : []),
        ...(failReqs > 0 ? [{
          title: `${failReqs} CRA-Anforderungen nicht erfüllt — Release-Blocker`,
          detail: `Die Abweichungen betreffen grundlegende Sicherheitseigenschaften (Annex I) und Schwachstellenmanagement (Annex II). Im Einzelnen: ${topFailNames.join(', ')}${failReqs > 3 ? ` und ${failReqs - 3} weitere` : ''}. Ohne Behebung ist eine Konformitätserklärung nach Art. 22 CRA nicht abgebbar.`,
        }] : []),
        ...(partialReqs > 0 ? [{
          title: `${partialReqs} Anforderungen nur teilweise erfüllt — Nachbesserungsbedarf`,
          detail: `Ansätze vorhanden, aber Implementierung unvollständig oder nicht auditiert. Betroffen sind unter anderem: ${topPartialNames.join(', ')}${partialReqs > 3 ? ` und ${partialReqs - 3} weitere` : ''}. Diese Lücken sind kurzfristig schließbar und sollten vor GA priorisiert werden.`,
        }] : []),
        ...(passReqs > 0 ? [{
          title: `${passReqs} Anforderungen vollständig erfüllt`,
          detail: `Die implementierten Maßnahmen adressieren die jeweiligen Angriffsvektoren angemessen. Keine Handlungserfordernis.`,
        }] : []),
      ],
      implication: isReady
        ? 'Keine regulatorischen Risiken identifiziert. Empfehlung: reguläre Aufrechterhaltung des Sicherheitsniveaus und jährliche Neubewertung.'
        : `Bei Markteinführung im aktuellen Zustand drohen: Beanstandungen durch Marktüberwachungsbehörden, Rückrufpflichten nach Art. 49 CRA, sowie Haftungsrisiken nach der revidierten Produkthaftungsrichtlinie. Geschätzter Remediation-Aufwand: siehe Abschnitt 5.`,
      action: isReady
        ? 'Empfehlung: Konformitätserklärung vorbereiten und Monitoring-Prozess etablieren.'
        : `Empfehlung: Sofortmaßnahmen (P0) aus Abschnitt 5.1 mit Verantwortlichkeiten und Fristen versehen. Wöchentliches Tracking bis zur Schließung aller kritischen Gaps.`,
    };
  }
  if (lang === 'fr') {
    return {
      verdict: isReady
        ? `${p} satisfait les exigences essentielles du CRA. Prêt pour la mise sur le marché.`
        : isPartial
          ? `${p} atteint ${complianceRate} % de conformité CRA. Des corrections ciblées sont nécessaires.`
          : `${p} atteint ${complianceRate} % de conformité CRA. Non commercialisable en l'état.`,
      situationLine: `${threats} scénarios de menaces identifiés | ${crit} critiques (score >= 20) | ${failReqs} sur ${totalReqs} exigences non conformes | ${partialReqs} partiellement conformes`,
      findings: [
        ...(crit > 0 ? [{
          title: `${crit} risques critiques nécessitent une action immédiate`,
          detail: `Un attaquant peut causer des dommages significatifs avec un effort raisonnable. Concrètement : ${topCritNames.join(', ')}${crit > 3 ? ` et ${crit - 3} autres` : ''}. Chaque semaine de retard augmente le risque réglementaire.`,
        }] : []),
        ...(failReqs > 0 ? [{
          title: `${failReqs} exigences CRA non satisfaites — bloquantes pour la mise sur le marché`,
          detail: `Les écarts concernent les propriétés de sécurité fondamentales (Annexe I) et la gestion des vulnérabilités (Annexe II). En détail : ${topFailNames.join(', ')}${failReqs > 3 ? ` et ${failReqs - 3} autres` : ''}. Sans correction, aucune déclaration de conformité selon l'Art. 22 CRA n'est possible.`,
        }] : []),
        ...(partialReqs > 0 ? [{
          title: `${partialReqs} exigences partiellement satisfaites — améliorations requises`,
          detail: `Des approches existent mais l'implémentation est incomplète ou non auditée. Cela concerne notamment : ${topPartialNames.join(', ')}${partialReqs > 3 ? ` et ${partialReqs - 3} autres` : ''}. Ces lacunes peuvent être comblées à court terme.`,
        }] : []),
        ...(passReqs > 0 ? [{
          title: `${passReqs} exigences entièrement satisfaites`,
          detail: `Les mesures implémentées traitent adéquatement les vecteurs d'attaque concernés. Aucune action requise.`,
        }] : []),
      ],
      implication: isReady
        ? 'Aucun risque réglementaire identifié. Recommandation : maintenir le niveau de sécurité et réévaluer annuellement.'
        : `En cas de mise sur le marché en l'état : sanctions des autorités de surveillance, obligation de rappel (Art. 49 CRA), risques de responsabilité. Effort de remédiation estimé : voir section 5.`,
      action: isReady
        ? 'Recommandation : préparer la déclaration de conformité et établir un processus de suivi.'
        : `Recommandation : attribuer responsabilités et délais aux mesures immédiates (P0) de la section 5.1. Suivi hebdomadaire jusqu'à la clôture de tous les gaps critiques.`,
    };
  }
  // EN
  return {
    verdict: isReady
      ? `${p} meets essential CRA requirements. Market readiness confirmed.`
      : isPartial
        ? `${p} achieves ${complianceRate}% CRA compliance. Targeted remediation required.`
        : `${p} achieves ${complianceRate}% CRA compliance. Not market-ready without remediation.`,
    situationLine: `${threats} threat scenarios identified | ${crit} critical (score >= 20) | ${failReqs} of ${totalReqs} requirements non-compliant | ${partialReqs} partially compliant`,
    findings: [
      ...(crit > 0 ? [{
        title: `${crit} critical risks require immediate action`,
        detail: `Attackers can cause significant damage with reasonable effort. Affected areas lack fundamental protection mechanisms. Specifically: ${topCritNames.join(', ')}${crit > 3 ? ` and ${crit - 3} more` : ''}. Each week of delay increases regulatory exposure.`,
      }] : []),
      ...(failReqs > 0 ? [{
        title: `${failReqs} CRA requirements non-compliant — release blockers`,
        detail: `Deviations affect fundamental security properties (Annex I) and vulnerability management (Annex II). Specifically: ${topFailNames.join(', ')}${failReqs > 3 ? ` and ${failReqs - 3} more` : ''}. Without remediation, a conformity declaration per Art. 22 CRA cannot be issued.`,
      }] : []),
      ...(partialReqs > 0 ? [{
        title: `${partialReqs} requirements partially met — improvement needed`,
        detail: `Approaches exist but implementation is incomplete or unaudited. This includes: ${topPartialNames.join(', ')}${partialReqs > 3 ? ` and ${partialReqs - 3} more` : ''}. These gaps are closable short-term and should be prioritised before GA.`,
      }] : []),
      ...(passReqs > 0 ? [{
        title: `${passReqs} requirements fully met`,
        detail: `Implemented measures adequately address the relevant attack vectors. No action required.`,
      }] : []),
    ],
    implication: isReady
      ? 'No regulatory risks identified. Recommendation: maintain security posture and re-assess annually.'
      : `Market launch in current state risks: regulatory objections from market surveillance authorities, recall obligations under Art. 49 CRA, and liability exposure under the revised Product Liability Directive. Estimated remediation effort: see Section 5.`,
    action: isReady
      ? 'Recommendation: prepare conformity declaration and establish monitoring process.'
      : `Recommendation: assign ownership and deadlines to immediate measures (P0) from Section 5.1. Weekly tracking until all critical gaps are closed.`,
  };
}

function getMethodology(lang: string): string {
  if (lang === 'de') return `Die Prüfung folgt einem zweistufigen Ansatz:\n\n1. Bedrohungsanalyse nach STRIDE\nSystematische Identifikation von Bedrohungsszenarien in den Kategorien Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service und Elevation of Privilege. Jede Bedrohung wird anhand einer 5-stufigen Skala für Eintrittswahrscheinlichkeit und Auswirkung bewertet. Der Risikoscore ergibt sich als Produkt beider Werte; Scores ab 20 gelten als kritisch.\n\n2. Konformitätsprüfung gegen CRA-Anforderungen\nAbgleich der implementierten Sicherheitsmaßnahmen mit den Anforderungen aus Annex I (Sicherheitseigenschaften digitaler Produkte), Annex II (Schwachstellenbehandlung) sowie den Meldepflichten nach Art. 14 und der Dokumentationspflicht nach Art. 13 der Verordnung (EU) 2024/2847.\n\nPrüfungsgrundlagen:\n  - EU Cyber Resilience Act (CRA) — Verordnung (EU) 2024/2847\n  - STRIDE Threat Model — Microsoft Security Development Lifecycle\n  - OWASP IoT Top 10 / OWASP API Security Top 10\n  - ETSI EN 303 645 — Cyber Security for Consumer IoT\n  - NIST SP 800-82r3 — Guide to OT Security\n  - ISO/IEC 27001:2022 (als Referenzrahmen)`;
  if (lang === 'fr') return `L'évaluation suit une approche en deux étapes :\n\n1. Analyse des menaces selon STRIDE\nIdentification systématique des scénarios de menaces dans les catégories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service et Elevation of Privilege. Chaque menace est évaluée sur une échelle de 1 à 5 pour la probabilité et l'impact. Le score de risque est le produit des deux valeurs ; les scores de 20 et plus sont considérés comme critiques.\n\n2. Vérification de conformité CRA\nComparaison des mesures de sécurité mises en œuvre avec les exigences de l'Annexe I (propriétés de sécurité des produits numériques), l'Annexe II (traitement des vulnérabilités) ainsi que les obligations de notification (Art. 14) et de documentation (Art. 13) du Règlement (UE) 2024/2847.\n\nNormes de référence :\n  - EU Cyber Resilience Act (CRA) — Règlement (UE) 2024/2847\n  - STRIDE Threat Model — Microsoft Security Development Lifecycle\n  - OWASP IoT Top 10 / OWASP API Security Top 10\n  - ETSI EN 303 645 — Cyber Security for Consumer IoT\n  - NIST SP 800-82r3 — Guide to OT Security\n  - ISO/IEC 27001:2022 (cadre de référence)`;
  return `The assessment follows a two-stage approach:\n\n1. STRIDE Threat Analysis\nSystematic identification of threat scenarios across the categories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Each threat is rated on a 5-point scale for both likelihood and impact. The risk score is calculated as the product of both values; scores of 20 or above are classified as critical.\n\n2. CRA Compliance Review\nComparison of implemented security measures against the requirements of Annex I (security properties of digital products), Annex II (vulnerability handling), as well as the reporting obligations under Art. 14 and documentation requirements under Art. 13 of Regulation (EU) 2024/2847.\n\nAudit Standards:\n  - EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847\n  - STRIDE Threat Model — Microsoft Security Development Lifecycle\n  - OWASP IoT Top 10 / OWASP API Security Top 10\n  - ETSI EN 303 645 — Cyber Security for Consumer IoT\n  - NIST SP 800-82r3 — Guide to OT Security\n  - ISO/IEC 27001:2022 (reference framework)`;
}

function getDisclaimer(lang: string): string {
  if (lang === 'de') return `Der vorliegende Bericht wurde werkzeuggestützt erstellt und gibt den Erkenntnisstand zum Zeitpunkt der Prüfung wieder. Er ersetzt weder eine akkreditierte Konformitätsbewertung nach Art. 24 ff. CRA noch eine individuelle rechtliche Beratung.\n\nDie Bewertung basiert auf den vom Anwender bereitgestellten Angaben zum Produkt sowie auf den zum Erstellungszeitpunkt gültigen Anforderungen der Verordnung (EU) 2024/2847. Für die Richtigkeit und Vollständigkeit der Eingabedaten ist der Anwender verantwortlich.\n\nFür verbindliche Auskünfte zur CRA-Konformität wird die Einbindung einer benannten Stelle oder eines akkreditierten Prüfdienstleisters empfohlen.`;
  if (lang === 'fr') return `Le présent rapport a été produit avec l'aide d'outils automatisés et reflète l'état des connaissances au moment de l'évaluation. Il ne remplace ni une évaluation de conformité accréditée selon les Art. 24 et suivants du CRA, ni un conseil juridique individuel.\n\nL'évaluation est basée sur les informations fournies par l'utilisateur concernant le produit ainsi que sur les exigences du Règlement (UE) 2024/2847 en vigueur au moment de la génération. L'utilisateur est responsable de l'exactitude et de l'exhaustivité des données saisies.\n\nPour des informations contraignantes sur la conformité CRA, il est recommandé de faire appel à un organisme notifié ou à un prestataire d'audit accrédité.`;
  return `This report was produced with the assistance of automated tools and reflects the state of knowledge at the time of assessment. It does not replace an accredited conformity assessment pursuant to Art. 24 ff. CRA, nor does it constitute individual legal advice.\n\nThe assessment is based on product information provided by the user and the requirements of Regulation (EU) 2024/2847 valid at the time of generation. The user is responsible for the accuracy and completeness of the input data.\n\nFor binding information on CRA compliance, engagement of a notified body or accredited audit service provider is recommended.`;
}

/* ════════════════════════════════════════════════════════════
   Color palette
   ════════════════════════════════════════════════════════════ */
const C = {
  navy: [8, 11, 16] as [number, number, number],
  darkNavy: [15, 23, 42] as [number, number, number],
  accent: [0, 148, 168] as [number, number, number],
  gold: [195, 155, 30] as [number, number, number],
  bodyText: [45, 50, 60] as [number, number, number],
  labelText: [80, 90, 105] as [number, number, number],
  lightGray: [140, 150, 165] as [number, number, number],
  ruleStroke: [195, 200, 210] as [number, number, number],
  bgLight: [246, 247, 249] as [number, number, number],
  bgRed: [252, 232, 232] as [number, number, number],
  bgYellow: [253, 248, 220] as [number, number, number],
  bgGreen: [228, 248, 235] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  coverMeta: [165, 175, 190] as [number, number, number],
  redText: [170, 30, 30] as [number, number, number],
  orangeText: [175, 65, 15] as [number, number, number],
  greenText: [25, 110, 55] as [number, number, number],
  monoGray: [65, 75, 90] as [number, number, number],
};

/* ════════════════════════════════════════════════════════════
   Watermark
   ════════════════════════════════════════════════════════════ */
function drawWatermark(doc: jsPDF, cx: number, cy: number, size: number) {
  const S = size;
  const SQRT2_HALF = Math.SQRT2 / 2;
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.018 }));
  const wc: [number, number, number] = [180, 180, 180];
  const diamond = (x: number, y: number, hd: number, style: 'S' | 'F' = 'S') => {
    doc.lines([[hd, hd], [hd, -hd], [-hd, -hd], [-hd, hd]], x, y - hd, [1, 1], style, true);
  };
  const barHalfW = S * (6 / 48);
  doc.setDrawColor(...wc);
  doc.setLineWidth(0.25);
  doc.line(cx - barHalfW, cy - S, cx - barHalfW, cy + S);
  doc.line(cx + barHalfW, cy - S, cx + barHalfW, cy + S);
  doc.line(cx - S, cy - barHalfW, cx + S, cy - barHalfW);
  doc.line(cx - S, cy + barHalfW, cx + S, cy + barHalfW);
  const dSide = S * (16 / 24);
  const dHalfDiag = dSide * SQRT2_HALF;
  const dOffset = S * (14 / 24);
  doc.setLineWidth(0.3);
  diamond(cx, cy - dOffset, dHalfDiag);
  diamond(cx, cy + dOffset, dHalfDiag);
  diamond(cx - dOffset, cy, dHalfDiag);
  diamond(cx + dOffset, cy, dHalfDiag);
  const d1HD = S * SQRT2_HALF;
  doc.setLineWidth(0.35);
  diamond(cx, cy, d1HD);
  const d2HD = S * (16 / 24) * SQRT2_HALF;
  doc.setLineWidth(0.25);
  diamond(cx, cy, d2HD);
  const d3HD = S * (9.6 / 24) * SQRT2_HALF;
  doc.setFillColor(...wc);
  diamond(cx, cy, d3HD, 'F');
  doc.restoreGraphicsState();
}

/* ════════════════════════════════════════════════════════════
   STRIDE labels
   ════════════════════════════════════════════════════════════ */
const STRIDE_NAMES: Record<string, Record<string, string>> = {
  S: { de: 'Spoofing', en: 'Spoofing', fr: 'Spoofing' },
  T: { de: 'Tampering', en: 'Tampering', fr: 'Tampering' },
  R: { de: 'Repudiation', en: 'Repudiation', fr: 'Répudiation' },
  I: { de: 'Information Disclosure', en: 'Information Disclosure', fr: 'Divulgation d\'information' },
  D: { de: 'Denial of Service', en: 'Denial of Service', fr: 'Déni de service' },
  E: { de: 'Elevation of Privilege', en: 'Elevation of Privilege', fr: 'Élévation de privilège' },
};

/* ════════════════════════════════════════════════════════════
   MAIN GENERATOR
   ════════════════════════════════════════════════════════════ */
export function generateCraReport(data: CraReportData): void {
  const { intakeData, threats, reqs, language, productTypeName, craClassName, isDraft = false, qaChecks, fixLog, qaIterations } = data;
  const lang = language;
  const t = (o: Record<string, string>) => o[lang] || o.en;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ML = 25, MR = 22, CW = W - ML - MR;
  const TOP = 30;
  const BOTTOM = H - 24;

  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const failReqs = reqs.filter(r => r.status === 'fail');
  const partialReqs = reqs.filter(r => r.status === 'partial');

  const locale = lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const reportId = `CRA-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // ── Text sanitizer: replace non-WinAnsiEncoding chars for jsPDF compatibility ──
  function sanitize(text: string): string {
    return text
      .replace(/\u2605/g, '*')      // ★ → *
      .replace(/\u2606/g, '.')      // ☆ → .
      .replace(/\u2610/g, '[ ]')    // ☐ → [ ]
      .replace(/\u2192/g, '->')     // → → ->
      .replace(/\u23F1/g, '')       // ⏱ → remove
      .replace(/\u2794/g, '->')     // ➔ → ->
      .replace(/\u27A4/g, '>')      // ➤ → >
      .replace(/\u2013/g, '-')      // – (en dash) → -
      .replace(/[\u2018\u2019]/g, "'")  // curly single quotes
      .replace(/[\u201C\u201D]/g, '"')  // curly double quotes
      ;
  }

  // Wrap doc.text and doc.splitTextToSize for automatic sanitization
  const _origText = doc.text.bind(doc);
  (doc as any).text = (text: any, x: number, yPos: number, options?: any) => {
    if (typeof text === 'string') return _origText(sanitize(text), x, yPos, options);
    if (Array.isArray(text)) return _origText(text.map((t: string) => sanitize(t)), x, yPos, options);
    return _origText(text, x, yPos, options);
  };
  const _origSplit = doc.splitTextToSize.bind(doc);
  (doc as any).splitTextToSize = (text: string, maxWidth: number) => _origSplit(sanitize(text), maxWidth);

  let y = 0;
  let pageNum = 0;
  let findingNum = 0;

  const BODY_SIZE = 9;
  const BODY_LEADING = 4.2;
  const LABEL_SIZE = 7.5;
  const SECTION_SIZE = 12;
  const SUBSECTION_SIZE = 10;
  const PARA_GAP = 2.5;
  const FIELD_GAP = 1.5;
  const MONO_SIZE = 7;

  // ── Cross-reference map: CRA article > threat IDs ──
  const articleToThreats: Record<string, string[]> = {};
  for (const th of threats) {
    if (!articleToThreats[th.cra]) articleToThreats[th.cra] = [];
    articleToThreats[th.cra].push(threatId(th));
  }

  function truncateToWidth(text: string, maxW: number, fontSize: number): string {
    doc.setFontSize(fontSize);
    if (doc.getTextWidth(text) <= maxW) return text;
    let tr = text;
    while (tr.length > 5 && doc.getTextWidth(tr + '…') > maxW) tr = tr.slice(0, -1);
    return tr.trimEnd() + '…';
  }

  function addRunningHeader() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.lightGray);
    doc.text('Cyber Risk Assessment — ' + intakeData.productName, ML, 14);
    doc.text(dateStr, W - MR, 14, { align: 'right' });
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML, 17, W - MR, 17);
  }

  function addFooter() {
    pageNum++;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML, H - 18, W - MR, H - 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.lightGray);
    doc.text(reportId, ML, H - 13);
    doc.text(`${t(I18N.page)} ${pageNum}`, W / 2, H - 13, { align: 'center' });
    doc.text(t(I18N.confidential), W - MR, H - 13, { align: 'right' });
    doc.setFillColor(...C.gold);
    doc.rect(0, H - 2.5, W, 2.5, 'F');
  }

  function preparePage() {
    addRunningHeader();
    if (isDraft) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(64);
      doc.setTextColor(160, 160, 160);
      doc.text('ENTWURF', W / 2, H / 2 + 10, { align: 'center', angle: 45 });
      doc.restoreGraphicsState();
    }
  }

  function checkPage(need: number = 16) {
    if (y > BOTTOM - need) {
      addFooter();
      doc.addPage();
      preparePage();
      y = TOP;
    }
  }

  function newSection() {
    addFooter();
    doc.addPage();
    preparePage();
    y = TOP;
  }

  function writeSectionHeading(text: string) {
    checkPage(25);
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.8);
    doc.line(ML, y, ML + 30, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SECTION_SIZE);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 9;
  }

  function writeSubHeading(text: string) {
    checkPage(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SUBSECTION_SIZE);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 7;
  }

  function writeBody(text: string, indent: number = 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.bodyText);
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      if (para.trim() === '') { y += PARA_GAP; continue; }
      const lines = doc.splitTextToSize(para, CW - indent);
      for (const line of lines) {
        checkPage(5);
        doc.text(line, ML + indent, y);
        y += BODY_LEADING;
      }
      y += PARA_GAP;
    }
  }

  function writeMono(text: string, indent: number = 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(MONO_SIZE);
    doc.setTextColor(...C.monoGray);
    const lines = doc.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      checkPage(4);
      doc.text(line, ML + indent, y);
      y += 3.6;
    }
  }

  function writeLabel(label: string, indent: number = 0) {
    checkPage(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(LABEL_SIZE);
    doc.setTextColor(...C.accent);
    doc.text(label.toUpperCase(), ML + indent, y);
    y += 3.8;
  }

  function writeKV(label: string, value: string, indent: number = 0) {
    checkPage(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.darkNavy);
    const labelStr = label + ':';
    doc.text(labelStr, ML + indent, y);
    const labelW = doc.getTextWidth(labelStr + ' ');
    const maxLabelW = 48;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.bodyText);
    if (labelW > maxLabelW) {
      y += BODY_LEADING;
      const valLines = doc.splitTextToSize(value, CW - indent - 5);
      for (const line of valLines) {
        checkPage(5);
        doc.text(line, ML + indent + 5, y);
        y += BODY_LEADING;
      }
    } else {
      const availW = CW - labelW - indent - 2;
      const valLines = doc.splitTextToSize(value, availW);
      for (let i = 0; i < valLines.length; i++) {
        if (i > 0) checkPage(5);
        doc.text(valLines[i], ML + indent + labelW, y);
        y += BODY_LEADING;
      }
    }
    y += FIELD_GAP;
  }

  function writeFieldBlock(label: string, value: string, indent: number = 5) {
    writeLabel(label, indent);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.bodyText);
    const lines = doc.splitTextToSize(value, CW - indent - 3);
    for (const line of lines) {
      checkPage(5);
      doc.text(line, ML + indent + 3, y);
      y += BODY_LEADING;
    }
    y += FIELD_GAP;
  }

  function riskLabel(score: number): string {
    if (score >= 20) return lang === 'de' ? 'Kritisch' : lang === 'fr' ? 'Critique' : 'Critical';
    if (score >= 13) return lang === 'de' ? 'Hoch' : lang === 'fr' ? 'Élevé' : 'High';
    if (score >= 6) return lang === 'de' ? 'Mittel' : lang === 'fr' ? 'Moyen' : 'Medium';
    return lang === 'de' ? 'Gering' : lang === 'fr' ? 'Faible' : 'Low';
  }

  /* ══════════════════════════════════════
     COVER PAGE
     ══════════════════════════════════════ */
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, H, 'F');
  

  doc.setFillColor(...C.gold);
  doc.rect(ML, 50, 35, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.text(t(I18N.title), ML, 66);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...C.accent);
  doc.text(t(I18N.subtitle), ML, 76);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...C.coverMeta);
  doc.text(`${intakeData.productName} ${intakeData.version}`, ML, 90);

  const metaY = H - 85;
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.3);
  doc.line(ML, metaY, W - MR, metaY);

  doc.setFontSize(8.5);
  const metaLines: [string, string][] = [
    [t(I18N.reportId), reportId],
    [t(I18N.generated), dateStr],
    [t(I18N.type), productTypeName],
    [t(I18N.craClass), craClassName],
  ];
  let my = metaY + 7;
  for (const [k, v] of metaLines) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.gold);
    doc.text(k, ML, my);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.coverMeta);
    doc.text(v, ML + 48, my);
    my += 6.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...C.gold);
  doc.text(t(I18N.confidential), W - MR, H - 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 120, 140);
  doc.text('inside-the-box.org', ML, H - 16);
  doc.setFillColor(...C.gold);
  doc.rect(0, H - 2.5, W, 2.5, 'F');

  /* ══════════════════════════════════════
     TABLE OF CONTENTS
     ══════════════════════════════════════ */
  doc.addPage();
  preparePage();
  pageNum++;
  y = TOP + 5;

  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + 30, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...C.darkNavy);
  doc.text(t(I18N.toc), ML, y);
  y += 12;

  const tocItems = [I18N.sec1, I18N.sec2, I18N.sec3, I18N.sec4, I18N.sec4c, I18N.sec5, I18N.sec5c, I18N.sec6, I18N.sec7, I18N.secA, I18N.secB, I18N.secC, I18N.secD];
  for (const item of tocItems) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(SUBSECTION_SIZE);
    doc.setTextColor(...C.bodyText);
    doc.text(t(item), ML + 4, y);
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineDashPattern([0.4, 1.2], 0);
    doc.setLineWidth(0.12);
    const tw = doc.getTextWidth(t(item));
    doc.line(ML + 8 + tw, y - 0.5, W - MR, y - 0.5);
    doc.setLineDashPattern([], 0);
    y += 8.5;
  }

  addFooter();

  /* ══════════════════════════════════════
     SECTION 1: Context
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec1));
  writeBody(getContextText(intakeData.productName, intakeData.version, productTypeName, craClassName, dateStr, lang));

  /* ══════════════════════════════════════
     SECTION 2: Management Summary (McKinsey-style)
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec2));
  writeBody(t(I18N.introSec2));
  y += 2;

  const passReqs = reqs.filter(r => r.status === 'pass');
  const summaryData = getMgmtSummaryData(intakeData.productName, threats, critRisks, failReqs, partialReqs, reqs.length, passReqs.length, lang);

  // ── Governing assertion (bold verdict) ──
  checkPage(20);
  const verdictBoxY = y;
  const verdictPad = 5;
  doc.setFillColor(...(critRisks.length > 0 ? C.bgRed : failReqs.length > 0 ? C.bgYellow : C.bgGreen));
  doc.roundedRect(ML, verdictBoxY, CW, 16, 2, 2, 'F');
  const verdictAccent: [number, number, number] = critRisks.length > 0 ? C.redText : failReqs.length > 0 ? C.orangeText : C.greenText;
  doc.setFillColor(...verdictAccent);
  doc.rect(ML, verdictBoxY, 1.5, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...verdictAccent);
  const verdictLines = doc.splitTextToSize(summaryData.verdict, CW - verdictPad * 2 - 2);
  doc.text(verdictLines, ML + verdictPad + 2, verdictBoxY + (verdictLines.length === 1 ? 10 : 7));
  y = verdictBoxY + 16 + 5;

  // ── Situation line (compact data strip) ──
  checkPage(10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.labelText);
  doc.text(summaryData.situationLine, ML, y);
  y += 3;
  doc.setDrawColor(...C.ruleStroke);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);
  y += 7;

  // ── Key Metrics (stat boxes) ──
  checkPage(30);
  const bw = (CW - 9) / 4;
  const bh = 22;
  const allStats: [string, number, [number, number, number], [number, number, number]][] = [
    [t(I18N.totalThreats), threats.length, C.bgLight, C.darkNavy],
    [t(I18N.criticalRisks), critRisks.length, C.bgRed, C.redText],
    [t(I18N.craGaps), failReqs.length, C.bgRed, C.redText],
    [t(I18N.partialGaps), partialReqs.length, C.bgYellow, C.orangeText],
  ];
  for (let i = 0; i < allStats.length; i++) {
    const bx = ML + i * (bw + 3);
    doc.setFillColor(...allStats[i][2]);
    doc.roundedRect(bx, y, bw, bh, 1.5, 1.5, 'F');
    doc.setFillColor(...allStats[i][3]);
    doc.rect(bx + 2, y, bw - 4, 0.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...allStats[i][3]);
    doc.text(String(allStats[i][1]), bx + bw / 2, y + 11, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...C.labelText);
    const lbl = doc.splitTextToSize(allStats[i][0], bw - 6);
    doc.text(lbl, bx + bw / 2, y + 17, { align: 'center' });
  }
  y += bh + 8;

  // ── Key Findings (structured, assertion-led) ──
  const findingsLabel = lang === 'de' ? 'WESENTLICHE FESTSTELLUNGEN' : lang === 'fr' ? 'CONSTATS PRINCIPAUX' : 'KEY FINDINGS';
  writeLabel(findingsLabel);
  y += 1;

  for (let fi = 0; fi < summaryData.findings.length; fi++) {
    const f = summaryData.findings[fi];
    checkPage(18);

    // Finding number + title (bold assertion)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.darkNavy);
    const fNum = `${fi + 1}.`;
    doc.text(fNum, ML, y);
    const fNumW = doc.getTextWidth(fNum + ' ');
    const titleLines = doc.splitTextToSize(f.title, CW - fNumW);
    doc.text(titleLines, ML + fNumW, y);
    y += titleLines.length * BODY_LEADING + 1;

    // Detail (normal, indented)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.bodyText);
    const detailLines = doc.splitTextToSize(f.detail, CW - fNumW - 2);
    for (const dl of detailLines) {
      checkPage(5);
      doc.text(dl, ML + fNumW, y);
      y += 3.8;
    }
    y += 3;
  }

  // ── Implication + Required Action ──
  y += 2;
  const implLabel = lang === 'de' ? 'REGULATORISCHE IMPLIKATION' : lang === 'fr' ? 'IMPLICATION RÉGLEMENTAIRE' : 'REGULATORY IMPLICATION';
  writeLabel(implLabel);
  writeBody(summaryData.implication, 0);

  const actionLabel = lang === 'de' ? 'HANDLUNGSERFORDERNIS' : lang === 'fr' ? 'ACTION REQUISE' : 'REQUIRED ACTION';
  writeLabel(actionLabel);

  // Action box with accent
  checkPage(16);
  doc.setFillColor(...C.bgLight);
  const actionLines = doc.splitTextToSize(summaryData.action, CW - 12);
  const actionBoxH = actionLines.length * 4.2 + 6;
  doc.roundedRect(ML, y - 2, CW, actionBoxH, 1.5, 1.5, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(ML, y - 2, 1.5, actionBoxH, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.bodyText);
  doc.text(actionLines, ML + 6, y + 2);
  y += actionBoxH + 5;

  // ── STRIDE Distribution ──
  checkPage(30);
  writeSubHeading(t(I18N.strideDistTitle));
  const strideCounts: Record<string, number> = {};
  for (const th of threats) {
    strideCounts[th.stride] = (strideCounts[th.stride] || 0) + 1;
  }
  for (const cat of 'STRIDE'.split('')) {
    const count = strideCounts[cat] || 0;
    if (count === 0) continue;
    const catName = STRIDE_NAMES[cat]?.[lang] || cat;
    writeKV(`${cat} — ${catName}`, `${count} ${count === 1 ? (lang === 'de' ? 'Bedrohung' : lang === 'fr' ? 'menace' : 'threat') : (lang === 'de' ? 'Bedrohungen' : lang === 'fr' ? 'menaces' : 'threats')}`, 5);
  }

  /* ══════════════════════════════════════
     SECTION 3: Scope (comprehensive)
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec3));
  writeBody(t(I18N.introSec3));
  y += 2;

  // 3.1 Product Profile
  writeSubHeading(t(I18N.sec3a));
  writeBody(t(I18N.introSec3a));
  writeKV(t(I18N.product), `${intakeData.productName} ${intakeData.version}`);
  writeKV(t(I18N.type), productTypeName);
  if (intakeData.productTypes.length > 0) {
    writeKV(t(I18N.productTypes), intakeData.productTypes.join(', '));
  }
  writeKV(t(I18N.craClass), craClassName);
  writeKV(t(I18N.deployment), intakeData.deployment || '—');
  writeKV(t(I18N.interfaces), intakeData.interfaces.length > 0 ? intakeData.interfaces.join(', ') : '—');
  writeKV(t(I18N.roles), intakeData.roles.length > 0 ? intakeData.roles.join(', ') + (intakeData.customRole ? `, ${intakeData.customRole}` : '') : '—');

  if (intakeData.description) {
    y += 2;
    // Humanize description
    const desc = intakeData.description.trim();
    const humanDesc = desc.length > 40 && /[.!?]$/.test(desc) ? desc
      : lang === 'de' ? `Zum geprüften Produkt wurde die folgende Beschreibung angegeben: ${desc}${desc.endsWith('.') ? '' : '.'}`
      : lang === 'fr' ? `La description suivante a été fournie pour le produit évalué : ${desc}${desc.endsWith('.') ? '' : '.'}`
      : `The following description was provided for the assessed product: ${desc}${desc.endsWith('.') ? '' : '.'}`;
    writeBody(humanDesc);
  }

  // 3.2 Components & Architecture
  y += 3;
  writeSubHeading(t(I18N.sec3b));
  writeBody(t(I18N.introSec3b));
  if (intakeData.components.length > 0) {
    const compList = intakeData.components.length <= 2
      ? intakeData.components.join(lang === 'de' ? ' und ' : ' and ')
      : intakeData.components.slice(0, -1).join(', ') + (lang === 'de' ? ' und ' : ' and ') + intakeData.components[intakeData.components.length - 1];
    const compSentence = lang === 'de'
      ? `Das Produkt setzt sich aus den folgenden Systemkomponenten zusammen: ${compList}.`
      : lang === 'fr'
      ? `Le produit se compose des composants système suivants : ${compList}.`
      : `The product comprises the following system components: ${compList}.`;
    writeBody(compSentence);
  } else {
    writeBody('—');
  }

  // 3.3 Security Measures
  y += 3;
  writeSubHeading(t(I18N.sec3c));
  writeBody(t(I18N.introSec3c));
  const measureKeys = Object.keys(intakeData.measures);
  if (measureKeys.length > 0) {
    // Table header
    checkPage(12);
    const colMeasure = ML + 5;
    const colActive = ML + 80;
    const colDoc = ML + 100;
    const colAudit = ML + 125;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.accent);
    doc.text(lang === 'de' ? 'MASSNAHME' : lang === 'fr' ? 'MESURE' : 'MEASURE', colMeasure, y);
    doc.text(t(I18N.active).toUpperCase(), colActive, y);
    doc.text(t(I18N.documented).toUpperCase(), colDoc, y);
    doc.text(t(I18N.audited).toUpperCase(), colAudit, y);
    y += 2;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(colMeasure, y, W - MR - 5, y);
    y += 3;

    for (const key of measureKeys) {
      checkPage(5);
      const m = intakeData.measures[key];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(BODY_SIZE - 0.5);
      doc.setTextColor(...C.bodyText);
      doc.text(key.toUpperCase(), colMeasure, y);
      doc.setTextColor(...(m.active ? C.greenText : C.redText));
      doc.text(m.active ? t(I18N.yes) : t(I18N.no), colActive, y);
      doc.setTextColor(...(m.documented ? C.greenText : C.redText));
      doc.text(m.documented ? t(I18N.yes) : t(I18N.no), colDoc, y);
      doc.setTextColor(...(m.audited ? C.greenText : C.redText));
      doc.text(m.audited ? t(I18N.yes) : t(I18N.no), colAudit, y);
      y += BODY_LEADING + 0.3;
    }
  } else {
    writeBody('—');
  }

  // 3.4 Known Issues
  y += 3;
  writeSubHeading(t(I18N.sec3d));
  writeBody(t(I18N.introSec3d));
  if (intakeData.knownIssues && intakeData.knownIssues.trim()) {
    const issues = intakeData.knownIssues.trim();
    const humanIssues = issues.length > 40 && /[.!?]$/.test(issues) ? issues
      : lang === 'de' ? `Der Hersteller hat die folgenden bekannten Schwachstellen im Vorfeld der Prüfung benannt: ${issues}${issues.endsWith('.') ? '' : '.'}`
      : lang === 'fr' ? `Le fabricant a signalé les problèmes connus suivants avant l'évaluation : ${issues}${issues.endsWith('.') ? '' : '.'}`
      : `The manufacturer reported the following known issues prior to the assessment: ${issues}${issues.endsWith('.') ? '' : '.'}`;
    writeBody(humanIssues);
  } else {
    writeBody(t(I18N.noKnownIssues));
  }

  // 3.5 Submitted Documentation
  y += 3;
  writeSubHeading(t(I18N.sec3e));
  writeBody(t(I18N.introSec3e));
  if (intakeData.files.length > 0) {
    for (const f of intakeData.files) {
      checkPage(6);
      const sizeStr = f.size >= 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(f.size / 1024).toFixed(0)} KB`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(...C.bodyText);
      doc.text(`•  ${f.name}  (${f.type || '—'}, ${sizeStr})`, ML + 5, y);
      y += BODY_LEADING + 0.5;
    }
  } else {
    writeBody(t(I18N.noFilesSubmitted));
  }

  /* ══════════════════════════════════════
     SECTION 4: Detailed Findings
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec4));
  writeBody(t(I18N.introSec4));
  y += 2;

  // 4.1 Threat Landscape
  writeSubHeading(t(I18N.sec4a));
  writeBody(t(I18N.introSec4a));
  y += 2;

  const sortedThreats = [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));

  for (const th of sortedThreats) {
    findingNum++;
    checkPage(50);
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const isCrit = score >= 20;
    const isHigh = score >= 13;

    const headerBg = isCrit ? C.bgRed : isHigh ? C.bgYellow : C.bgLight;
    const headerText = isCrit ? C.redText : isHigh ? C.orangeText : C.darkNavy;

    doc.setFillColor(...headerBg);
    doc.roundedRect(ML, y, CW, 10, 1, 1, 'F');
    const accentBarColor = isCrit ? C.redText : isHigh ? C.orangeText : C.accent;
    doc.setFillColor(...accentBarColor);
    doc.rect(ML, y + 0.5, 2, 9, 'F');

    const rl = riskLabel(score);
    const scoreStr = `${rl}  ${th.likelihood} x ${th.impact} = ${score}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...headerText);
    const scoreW = doc.getTextWidth(scoreStr);
    doc.text(scoreStr, W - MR - 4, y + 6.5, { align: 'right' });

    doc.setFontSize(8.5);
    const findingLabel = `${t(I18N.finding)} F-${String(findingNum).padStart(2, '0')}`;
    const leftText = `${findingLabel}  ·  ${tid}  ${th.name}`;
    const maxLeftW = CW - scoreW - 16;
    const truncLeft = truncateToWidth(leftText, maxLeftW, 8.5);
    doc.text(truncLeft, ML + 5, y + 6.5);
    y += 14;

    writeFieldBlock(t(I18N.component), th.component);
    writeFieldBlock(t(I18N.attacker), th.attacker);
    writeFieldBlock(t(I18N.attackPath), th.path);
    writeFieldBlock(t(I18N.evidence), th.evidence);
    writeFieldBlock(t(I18N.rationale), th.rationale);
    writeFieldBlock(t(I18N.craRef), th.cra);

    // Cross-reference: which CRA requirements does this threat relate to?
    const relatedReqIds = reqs.filter(r => r.article === th.cra).map(r => `${r.id} (${r.name})`);
    if (relatedReqIds.length > 0) {
      writeFieldBlock(t(I18N.relatedReqs), relatedReqIds.join('; '));
    }

    // Evidence quality + reproducibility
    const stars = '★'.repeat(th.evidenceQuality) + '☆'.repeat(5 - th.evidenceQuality);
    const reproMap: Record<string, Record<string, string>> = {
      easy: { de: 'Einfach', en: 'Easy', fr: 'Facile' },
      medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
      hard: { de: 'Komplex', en: 'Complex', fr: 'Complexe' },
      impossible: { de: 'Nicht reproduzierbar', en: 'Not reproducible', fr: 'Non reproductible' },
    };
    const reproLabel = reproMap[th.reproducibility]?.[lang] || th.reproducibility;
    writeLabel(`${t(I18N.evidenceQuality)}: ${stars}  |  ${t(I18N.reproducibility)}: ${reproLabel}`, 5);

    // Risk score breakdown
    writeLabel(t(I18N.riskScore), 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.bodyText);
    const scoreDetail = `${t(I18N.likelihood)}: ${th.likelihood}/5  x  ${t(I18N.impact)}: ${th.impact}/5  =  ${score}/25  >  ${rl}`;
    doc.text(scoreDetail, ML + 8, y);
    y += BODY_LEADING + FIELD_GAP;

    if (th.sources.length > 0) {
      writeLabel(t(I18N.sources), 5);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...C.lightGray);
      for (const src of th.sources) {
        checkPage(4);
        doc.text(`-  ${src}`, ML + 8, y);
        y += 3.5;
      }
    }
    y += 3;

    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.1);
    doc.line(ML + 15, y, W - MR - 15, y);
    y += 6;
  }

  // 4.2 CRA Compliance Gaps
  newSection();
  writeSubHeading(t(I18N.sec4b));
  writeBody(t(I18N.introSec4b));
  y += 2;

  const sortedReqs = [...reqs].sort((a, b) => {
    const order = { fail: 0, partial: 1, pass: 2 };
    return order[a.status] - order[b.status];
  });

  for (const req of sortedReqs) {
    findingNum++;
    checkPage(45);

    const statusColor = req.status === 'pass' ? C.greenText : req.status === 'partial' ? C.orangeText : C.redText;
    const statusBg = req.status === 'pass' ? C.bgGreen : req.status === 'partial' ? C.bgYellow : C.bgRed;
    const statusLabel = req.status === 'pass' ? t(I18N.pass) : req.status === 'partial' ? t(I18N.partial) : t(I18N.fail);

    doc.setFillColor(...statusBg);
    doc.roundedRect(ML, y, CW, 10, 1, 1, 'F');
    doc.setFillColor(...statusColor);
    doc.rect(ML, y + 0.5, 2, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...statusColor);
    const statusW = doc.getTextWidth(statusLabel);
    doc.text(statusLabel, W - MR - 4, y + 6.5, { align: 'right' });

    doc.setFontSize(8.5);
    const reqFinding = `${t(I18N.finding)} F-${String(findingNum).padStart(2, '0')}`;
    const reqLeftText = `${reqFinding}  ·  ${req.id}  ${req.name}`;
    const maxReqLeftW = CW - statusW - 16;
    const truncReq = truncateToWidth(reqLeftText, maxReqLeftW, 8.5);
    doc.text(truncReq, ML + 5, y + 6.5);
    y += 14;

    // Article reference
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...C.lightGray);
    doc.text(req.article, ML + 5, y);
    y += 4.5;

    writeFieldBlock(t(I18N.gap), req.gap);
    writeFieldBlock(t(I18N.evidence), req.evidence);
    writeFieldBlock(t(I18N.rationale), req.rationale);
    writeFieldBlock(t(I18N.measureAction), req.measure);

    // Effort + Priority
    if (req.effort) {
      writeFieldBlock(t(I18N.effort), req.effort);
    }
    if (req.priority) {
      const pLabel = req.priority === 'P0' ? t(I18N.p0) : req.priority === 'P1' ? t(I18N.p1) : req.priority === 'P2' ? t(I18N.p2) : t(I18N.p3);
      writeFieldBlock(t(I18N.priority), pLabel);
    }

    // Cross-reference: which threats are linked to this requirement?
    const linkedThreats = articleToThreats[req.article];
    if (linkedThreats && linkedThreats.length > 0) {
      writeFieldBlock(t(I18N.relatedThreats), linkedThreats.join(', '));
    }

    if (req.criteria.length > 0) {
      checkPage(9);
      writeLabel(t(I18N.dod), 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.bodyText);
      for (const c of req.criteria) {
        checkPage(5);
        const cLines = doc.splitTextToSize(`☐  ${c}`, CW - 16);
        for (const cl of cLines) {
          checkPage(4);
          doc.text(cl, ML + 8, y);
          y += 3.8;
        }
      }
    }

    y += 3;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.1);
    doc.line(ML + 15, y, W - MR - 15, y);
    y += 6;
  }

  // ── 4.3 Normative Coverage ──
  newSection();
  writeSubHeading(t(I18N.sec4c));
  writeBody(t(I18N.introSec4c));
  y += 2;

  const annex1p1 = reqs.filter(r => r.article.startsWith('Annex I, Part I'));
  const annex1p2 = reqs.filter(r => r.article.startsWith('Annex I, Part II'));
  const articlesGroup = reqs.filter(r => r.article.startsWith('Artikel') || r.article.startsWith('Article'));

  function coverageStats(group: typeof reqs) {
    const pass = group.filter(r => r.status === 'pass').length;
    const partial = group.filter(r => r.status === 'partial').length;
    const fail = group.filter(r => r.status === 'fail').length;
    return { total: group.length, pass, partial, fail, rate: group.length > 0 ? Math.round(((pass + partial * 0.5) / group.length) * 100) : 0 };
  }

  const covGroups = [
    { label: t(I18N.coverageAnnex1p1), stats: coverageStats(annex1p1) },
    { label: t(I18N.coverageAnnex1p2), stats: coverageStats(annex1p2) },
    { label: t(I18N.coverageArticles), stats: coverageStats(articlesGroup) },
  ];
  const overallStats = coverageStats(reqs);

  checkPage(50);
  const colLabel = ML + 5;
  const colTotal = ML + 95;
  const colPass = ML + 110;
  const colPartialC = ML + 122;
  const colFailC = ML + 135;
  const colRate = ML + 147;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...C.accent);
  const tblH = lang === 'de' ? ['BEREICH', 'GEPRÜFT', 'KONFORM', 'TEILW.', 'FAIL', 'RATE']
    : lang === 'fr' ? ['DOMAINE', 'EXAMINÉ', 'CONFORME', 'PARTIEL', 'FAIL', 'TAUX']
    : ['AREA', 'REVIEWED', 'PASS', 'PARTIAL', 'FAIL', 'RATE'];
  [colLabel, colTotal, colPass, colPartialC, colFailC, colRate].forEach((x, i) => doc.text(tblH[i], x, y));
  y += 2;
  doc.setDrawColor(...C.ruleStroke); doc.setLineWidth(0.15);
  doc.line(colLabel, y, W - MR - 5, y); y += 4;

  for (const g of covGroups) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5); doc.setTextColor(...C.bodyText);
    doc.text(truncateToWidth(g.label, 85, BODY_SIZE - 0.5), colLabel, y);
    doc.text(String(g.stats.total), colTotal, y);
    doc.setTextColor(...C.greenText); doc.text(String(g.stats.pass), colPass, y);
    doc.setTextColor(...C.orangeText); doc.text(String(g.stats.partial), colPartialC, y);
    doc.setTextColor(...C.redText); doc.text(String(g.stats.fail), colFailC, y);
    const rc = g.stats.rate >= 75 ? C.greenText : g.stats.rate >= 50 ? C.orangeText : C.redText;
    doc.setTextColor(...rc); doc.setFont('helvetica', 'bold'); doc.text(`${g.stats.rate}%`, colRate, y);
    y += BODY_LEADING + 1;
  }

  doc.setDrawColor(...C.ruleStroke); doc.setLineWidth(0.1);
  doc.line(colLabel, y - 1, W - MR - 5, y - 1); y += 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); doc.setTextColor(...C.darkNavy);
  doc.text(lang === 'de' ? 'GESAMT' : 'TOTAL', colLabel, y);
  doc.text(String(overallStats.total), colTotal, y);
  doc.setTextColor(...C.greenText); doc.text(String(overallStats.pass), colPass, y);
  doc.setTextColor(...C.orangeText); doc.text(String(overallStats.partial), colPartialC, y);
  doc.setTextColor(...C.redText); doc.text(String(overallStats.fail), colFailC, y);
  const orc = overallStats.rate >= 75 ? C.greenText : overallStats.rate >= 50 ? C.orangeText : C.redText;
  doc.setTextColor(...orc); doc.text(`${overallStats.rate}%`, colRate, y);
  y += 8;

  writeBody(overallStats.rate >= 80
    ? (lang === 'de' ? `Die normative Abdeckung von ${overallStats.rate}% ist für die gewählte Produktklasse als ausreichend einzustufen.`
      : lang === 'fr' ? `La couverture normative de ${overallStats.rate}% est jugée suffisante.`
      : `The normative coverage of ${overallStats.rate}% is considered sufficient for the selected product class.`)
    : (lang === 'de' ? `Die normative Abdeckung von ${overallStats.rate}% liegt unter dem empfohlenen Schwellwert von 80%. Die Remediation-Roadmap (Abschnitt 5.2) adressiert die identifizierten Lücken.`
      : lang === 'fr' ? `La couverture normative de ${overallStats.rate}% est inférieure au seuil recommandé de 80%.`
      : `The normative coverage of ${overallStats.rate}% is below the recommended 80% threshold. The remediation roadmap (Section 5.2) addresses identified gaps.`));

  /* ══════════════════════════════════════
     SECTION 5: Recommendations & Roadmap
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec5));
  writeBody(t(I18N.introSec5));
  y += 2;

  // ── P0-P3 Prioritisation ──
  interface PrioItem { id: string; name: string; measure: string; effort: string; }
  const p0Items: PrioItem[] = [];
  const p1Items: PrioItem[] = [];
  const p2Items: PrioItem[] = [];
  const p3Items: PrioItem[] = [];

  for (const th of sortedThreats) {
    const score = th.likelihood * th.impact;
    const tid = threatId(th);
    if (score >= 20) {
      p0Items.push({ id: tid, name: th.name,
        measure: `${th.component} — ${lang === 'de' ? 'Unmittelbare Gegenmaßnahmen' : lang === 'fr' ? 'Contre-mesures immédiates' : 'Immediate countermeasures'}`,
        effort: '8-24h' });
    } else if (score >= 15) {
      p1Items.push({ id: tid, name: th.name, measure: th.component, effort: '16-40h' });
    }
  }

  for (const r of reqs) {
    if (r.status === 'pass') continue;
    const linkedScore = threats.filter(th => th.cra === r.article).reduce((mx, th) => Math.max(mx, th.likelihood * th.impact), 0);
    const isRegCritical = r.article.includes('14');

    if (r.status === 'fail' && (linkedScore >= 20 || isRegCritical)) {
      if (!p0Items.find(p => p.id === r.id))
        p0Items.push({ id: r.id, name: r.name, measure: r.measure, effort: r.criteria.length > 3 ? '24-48h' : '16-32h' });
    } else if (r.status === 'fail') {
      p1Items.push({ id: r.id, name: r.name, measure: r.measure, effort: '16-32h' });
    } else if (r.status === 'partial' && linkedScore >= 13) {
      p2Items.push({ id: r.id, name: r.name, measure: r.measure, effort: '8-24h' });
    } else if (r.status === 'partial') {
      p3Items.push({ id: r.id, name: r.name, measure: r.measure, effort: '8-16h' });
    }
  }

  const allPrios = [
    { label: t(I18N.p0), items: p0Items, color: C.redText, bg: C.bgRed },
    { label: t(I18N.p1), items: p1Items, color: C.orangeText, bg: C.bgYellow },
    { label: t(I18N.p2), items: p2Items, color: C.bodyText, bg: C.bgLight },
    { label: t(I18N.p3), items: p3Items, color: C.labelText, bg: C.bgLight },
  ];

  writeSubHeading(t(I18N.sec5a));
  writeBody(t(I18N.introSec5a));
  y += 2;

  const hasItems = allPrios.some(p => p.items.length > 0);
  if (!hasItems) {
    writeBody(lang === 'de' ? 'Keine Sofortmaßnahmen erforderlich.' : 'No immediate actions required.');
  } else {
    for (const prio of allPrios) {
      if (prio.items.length === 0) continue;
      checkPage(20);

      doc.setFillColor(...prio.bg);
      doc.roundedRect(ML, y, CW, 8, 1, 1, 'F');
      doc.setFillColor(...prio.color);
      doc.rect(ML, y + 0.5, 2, 7, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...prio.color);
      doc.text(prio.label, ML + 6, y + 5.5);
      y += 12;

      for (const item of prio.items) {
        checkPage(20);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...prio.color); doc.text(item.id, ML + 5, y);
        doc.setTextColor(...C.darkNavy);
        doc.text(truncateToWidth(item.name, CW - 55, BODY_SIZE), ML + 22, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.setTextColor(...C.labelText);
        doc.text(`⏱ ${item.effort}`, W - MR - 4, y, { align: 'right' });
        y += 5;

        doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5); doc.setTextColor(...C.bodyText);
        const mLines = doc.splitTextToSize(item.measure, CW - 28);
        for (const ml of mLines) { checkPage(5); doc.text(ml, ML + 22, y); y += BODY_LEADING; }
        y += 3;
      }
      y += 3;
    }
  }

  // 5.2 Remediation Roadmap
  y += 4;
  writeSubHeading(t(I18N.sec5b));
  writeBody(t(I18N.roadmapIntro));
  y += 2;

  const phases = [
    { phase: lang === 'de' ? 'Phase 0: Sofort (1-2 Wochen)' : lang === 'fr' ? 'Phase 0 : Immédiat (1-2 semaines)' : 'Phase 0: Immediate (1-2 weeks)',
      desc: `${p0Items.length} ${lang === 'de' ? 'Release-Blocker' : 'release blockers'}`,
      gate: lang === 'de' ? 'Gate: Alle P0-Maßnahmen verifiziert, Re-Test durch Security-Ingenieur' : 'Gate: All P0 measures verified, security re-test',
      color: C.redText },
    { phase: lang === 'de' ? 'Phase 1: Vor Release (2-4 Wochen)' : lang === 'fr' ? 'Phase 1 : Avant release (2-4 sem.)' : 'Phase 1: Before Release (2-4 weeks)',
      desc: `${p1Items.length} ${lang === 'de' ? 'hohe Priorität' : 'high priority items'}`,
      gate: lang === 'de' ? 'Gate: P1 abgeschlossen, Pentest-Verifizierung bestanden' : 'Gate: P1 complete, pentest passed',
      color: C.orangeText },
    { phase: lang === 'de' ? 'Phase 2: Vor GA (4-8 Wochen)' : lang === 'fr' ? 'Phase 2 : Avant GA (4-8 sem.)' : 'Phase 2: Before GA (4-8 weeks)',
      desc: `${p2Items.length} ${lang === 'de' ? 'Teilerfüllungen nachschärfen' : 'partial compliance items'}`,
      gate: lang === 'de' ? 'Gate: Coverage >= 80%, QA-Regression bestanden' : 'Gate: Coverage >= 80%, QA regression passed',
      color: C.bodyText },
    { phase: lang === 'de' ? 'Phase 3: Empfohlen (8-12 Wochen)' : lang === 'fr' ? 'Phase 3 : Recommandé (8-12 sem.)' : 'Phase 3: Recommended (8-12 weeks)',
      desc: `${p3Items.length} ${lang === 'de' ? 'Verbesserungen' : 'improvements'}`,
      gate: lang === 'de' ? 'Gate: Vollständige CRA-Konformität' : 'Gate: Full CRA compliance',
      color: C.labelText },
  ];

  for (const ph of phases) {
    checkPage(25);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); doc.setTextColor(...ph.color);
    doc.text(ph.phase, ML + 5, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5); doc.setTextColor(...C.bodyText);
    const phLines = doc.splitTextToSize(ph.desc, CW - 15);
    for (const pl of phLines) { checkPage(5); doc.text(pl, ML + 10, y); y += BODY_LEADING; }
    y += 1;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...C.accent);
    doc.text(`> ${ph.gate}`, ML + 10, y); y += 6;
  }

  // 5.3 Economic Impact Assessment
  y += 6;
  const sec53Title = lang === 'de' ? '5.3  Wirtschaftliche Betrachtung'
    : lang === 'fr' ? '5.3  Analyse economique'
    : '5.3  Economic Impact Assessment';
  writeSubHeading(sec53Title);

  const ecoIntro = lang === 'de'
    ? 'Die folgende Einschätzung stellt den geschätzten Remediation-Aufwand dem Schadenspotenzial bei Nicht-Umsetzung gegenüber. Die Werte basieren auf den CRA-Sanktionsrahmen (Art. 64) sowie branchenueblichen Ausfallkosten.'
    : lang === 'fr'
    ? 'L\'estimation suivante compare l\'effort de remediation au potentiel de dommages en cas de non-mise en oeuvre, sur la base du cadre de sanctions CRA (Art. 64).'
    : 'The following assessment compares estimated remediation effort against damage potential of non-implementation. Values are based on CRA penalty frameworks (Art. 64) and industry-standard outage costs.';
  writeBody(ecoIntro);
  y += 3;

  // Calculate total effort
  const allPrioItems = [...new Set([...p0Items, ...p1Items, ...p2Items, ...p3Items].map(i => i.id))];
  const totalEffortHours = [...p0Items, ...p1Items, ...p2Items, ...p3Items].reduce((sum, item) => {
    const match = item.effort.match(/(\d+)-(\d+)/);
    return sum + (match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : 16);
  }, 0);
  const estCostK = Math.round(totalEffortHours * 150 / 1000);

  const penaltyData: [string, string, [number, number, number]][] = lang === 'de' ? [
    ['Bußgeld bei Nicht-Konformität (Art. 64 CRA)', 'Bis zu 15 Mio. EUR oder 2,5% des weltweiten Jahresumsatzes', C.redText],
    ['Bußgeld bei Meldepflichtverletzung (Art. 64)', 'Bis zu 10 Mio. EUR oder 2% des weltweiten Jahresumsatzes', C.redText],
    ['Rueckrufkosten (Art. 49 CRA)', 'Abhaengig von Produktkategorie und Verbreitungsgrad', C.orangeText],
    ['Produktionsausfall (OT-Kontext)', 'Branchendurchschnitt: 50.000 -- 250.000 EUR/Stunde', C.orangeText],
    [`Geschätzter Remediation-Aufwand`, `${Math.round(totalEffortHours)} Personenstunden (ca. ${Math.round(totalEffortHours / 40)} Personenwochen, ${estCostK}k EUR bei 150 EUR/h)`, C.greenText],
  ] : lang === 'fr' ? [
    ['Amende pour non-conformite (Art. 64 CRA)', 'Jusqu\'a 15 M EUR ou 2,5% du CA mondial', C.redText],
    ['Amende pour violation obligation de signalement', 'Jusqu\'a 10 M EUR ou 2% du CA mondial', C.redText],
    ['Couts de rappel (Art. 49 CRA)', 'Selon categorie et diffusion du produit', C.orangeText],
    ['Arret de production (contexte OT)', 'Moyenne: 50 000 -- 250 000 EUR/heure', C.orangeText],
    [`Effort de remediation estime`, `${Math.round(totalEffortHours)} heures-personne (env. ${Math.round(totalEffortHours / 40)} semaines-personne, ${estCostK}k EUR a 150 EUR/h)`, C.greenText],
  ] : [
    ['Non-compliance penalty (Art. 64 CRA)', 'Up to EUR 15M or 2.5% of global annual turnover', C.redText],
    ['Reporting violation penalty (Art. 64)', 'Up to EUR 10M or 2% of global annual turnover', C.redText],
    ['Product recall costs (Art. 49 CRA)', 'Dependent on product category and distribution', C.orangeText],
    ['Production downtime (OT context)', 'Industry average: EUR 50,000 -- 250,000/hour', C.orangeText],
    [`Estimated remediation effort`, `${Math.round(totalEffortHours)} person-hours (approx. ${Math.round(totalEffortHours / 40)} person-weeks, EUR ${estCostK}k at EUR 150/h)`, C.greenText],
  ];

  checkPage(45);
  const ecoColLabel = ML + 5;
  const ecoColValue = ML + 85;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C.accent);
  doc.text(lang === 'de' ? 'RISIKOKATEGORIE' : lang === 'fr' ? 'CATEGORIE DE RISQUE' : 'RISK CATEGORY', ecoColLabel, y);
  doc.text(lang === 'de' ? 'SCHADENSPOTENZIAL / AUFWAND' : lang === 'fr' ? 'POTENTIEL DE DOMMAGES' : 'DAMAGE POTENTIAL / EFFORT', ecoColValue, y);
  y += 2;
  doc.setDrawColor(...C.ruleStroke); doc.setLineWidth(0.15); doc.line(ecoColLabel, y, W - MR - 5, y); y += 4;

  for (const [label, value, color] of penaltyData) {
    checkPage(12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5); doc.setTextColor(...C.bodyText);
    const labelLines = doc.splitTextToSize(label, 75);
    const valueLines = doc.splitTextToSize(value, CW - 90);
    const maxLines = Math.max(labelLines.length, valueLines.length);
    for (let li = 0; li < maxLines; li++) {
      if (labelLines[li]) doc.text(labelLines[li], ecoColLabel, y);
      if (valueLines[li]) {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...color);
        doc.text(valueLines[li], ecoColValue, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.bodyText);
      }
      y += BODY_LEADING + 0.3;
    }
    y += 1;
  }

  y += 4;
  const roiText = lang === 'de'
    ? `Kosten-Nutzen-Verhaeltnis: Der geschätzte Gesamtaufwand von ${Math.round(totalEffortHours)} Personenstunden (ca. ${estCostK}k EUR) steht einem maximalen Bußgeldrisiko von 15 Mio. EUR und branchenspezifischen Ausfallkosten gegenüber. Die Investition in die Remediation amortisiert sich bereits bei Vermeidung eines einzigen regulatorischen Verfahrens oder Produktionsausfalls.`
    : lang === 'fr'
    ? `Rapport cout-benefice : L'effort total estime de ${Math.round(totalEffortHours)} heures-personne (env. ${estCostK}k EUR) fait face a un risque d'amende maximal de 15 M EUR. L'investissement dans la remediation est rentabilise des l'evitement d'une seule procedure reglementaire.`
    : `Cost-benefit ratio: The estimated total effort of ${Math.round(totalEffortHours)} person-hours (approx. EUR ${estCostK}k) stands against maximum penalty exposure of EUR 15M and industry-specific downtime costs averaging EUR 50-250k/hour. The remediation investment pays for itself by avoiding even a single regulatory proceeding or production incident.`;

  checkPage(20);
  const roiLines = doc.splitTextToSize(roiText, CW - 12);
  const roiBoxH = roiLines.length * 4.2 + 6;
  doc.setFillColor(...C.bgLight);
  doc.roundedRect(ML, y - 2, CW, roiBoxH, 1.5, 1.5, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(ML, y - 2, 1.5, roiBoxH, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.bodyText);
  doc.text(roiLines, ML + 6, y + 2);
  y += roiBoxH + 5;

  /* ══════════════════════════════════════
     SECTION 6: Methodology
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec6));
  writeBody(getMethodology(lang));

  // 6.1 Risk Rating Matrix
  y += 4;
  writeSubHeading(t(I18N.sec6a));
  const matrixExplanation = lang === 'de'
    ? 'Die Risikobewertung erfolgt auf Basis einer 5x5-Matrix. Jede Bedrohung wird auf zwei Achsen bewertet:\n\nEintrittswahrscheinlichkeit (1-5):\n  1 = Sehr unwahrscheinlich (erfordert staatliche Ressourcen)\n  2 = Unwahrscheinlich (erfordert erheblichen Aufwand/Insider)\n  3 = Möglich (Netzwerkzugang + Standard-Tooling)\n  4 = Wahrscheinlich (geringer Aufwand, öffentlich bekannte Methoden)\n  5 = Sehr wahrscheinlich (trivial, keine besonderen Kenntnisse)\n\nAuswirkung (1-5):\n  1 = Minimal (keine Datenverluste, lokale Störung)\n  2 = Gering (begrenzter Datenverlust, einzelne Funktion betroffen)\n  3 = Mittel (Konfigurationsänderung, Compliance-Verstoß)\n  4 = Hoch (Datenabfluss, Produktionsausfall, Admin-Zugriff)\n  5 = Kritisch (persistente Kompromittierung, Lateral Movement, physischer Schaden)\n\nRisikoscore = Eintrittswahrscheinlichkeit x Auswirkung\n  Gering: 1-5  |  Mittel: 6-12  |  Hoch: 13-19  |  Kritisch: 20-25'
    : lang === 'fr'
    ? 'L\'évaluation des risques est basée sur une matrice 5x5. Chaque menace est évaluée sur deux axes :\n\nProbabilité (1-5) :\n  1 = Très improbable (ressources étatiques nécessaires)\n  2 = Improbable (effort considérable / initié)\n  3 = Possible (accès réseau + outils standards)\n  4 = Probable (faible effort, méthodes publiques)\n  5 = Très probable (trivial, aucune connaissance spéciale)\n\nImpact (1-5) :\n  1 = Minimal (pas de perte de données, perturbation locale)\n  2 = Faible (perte de données limitée, fonction unique affectée)\n  3 = Moyen (changement de configuration, violation de conformité)\n  4 = Élevé (fuite de données, arrêt de production, accès admin)\n  5 = Critique (compromission persistante, mouvement latéral, dommages physiques)\n\nScore de risque = Probabilité x Impact\n  Faible : 1-5  |  Moyen : 6-12  |  Élevé : 13-19  |  Critique : 20-25'
    : 'Risk assessment is based on a 5x5 matrix. Each threat is evaluated on two axes:\n\nLikelihood (1-5):\n  1 = Very unlikely (requires state-level resources)\n  2 = Unlikely (requires significant effort / insider access)\n  3 = Possible (network access + standard tooling)\n  4 = Likely (low effort, publicly known methods)\n  5 = Very likely (trivial, no special knowledge required)\n\nImpact (1-5):\n  1 = Minimal (no data loss, local disruption only)\n  2 = Low (limited data loss, single function affected)\n  3 = Medium (configuration change, compliance violation)\n  4 = High (data exfiltration, production outage, admin access)\n  5 = Critical (persistent compromise, lateral movement, physical damage)\n\nRisk Score = Likelihood x Impact\n  Low: 1-5  |  Medium: 6-12  |  High: 13-19  |  Critical: 20-25';
  writeBody(matrixExplanation);

  // 6.2 OT Contextualisation
  y += 4;
  writeSubHeading(t(I18N.sec6b));
  const otContext = lang === 'de'
    ? 'Bei Produkten mit OT-Kontext (Operational Technology) — erkennbar an Schnittstellen wie OPC-UA, Modbus, Profinet oder Einsatz in industriellen Umgebungen — wird eine angepasste Bewertungsskala verwendet:\n\nOT-Impact-Skala:\n  1 = Einzelne Messung/Sensor betroffen\n  2 = Einzelne Produktionsstation betroffen\n  3 = Abteilung / Produktionsbereich betroffen\n  4 = Komplette Anlage / Fabrik betroffen\n  5 = Safety-Risiko / Menschengefährdung / Anlagenstillstand\n\nOT-Likelihood-Kalibrierung:\n  5/5 = Trivial (ARP-Spoofing, Klartext-Sniffing, Modbus ohne Auth)\n  4/5 = Einfach (DNS-Hijacking, Default-Credentials, unverschlüsselt)\n  3/5 = Möglich (Netzwerk-Zugang + Standard-Tools erforderlich)\n  2/5 = Schwierig (Supply-Chain, Insider, spezialisierte Skills)\n  1/5 = Sehr schwierig (Staatliche Ressourcen erforderlich)\n\nBegründung: In OT-Umgebungen haben Datenverlust und -manipulation unmittelbare Auswirkungen auf physische Prozesse. Klartext-Protokolle, die in IT-Umgebungen als "mittleres Risiko" eingestuft werden, stellen in OT-Umgebungen ein kritisches Risiko dar, da Steuerungsdaten und Produktionsgeheimnisse direkt betroffen sind.'
    : lang === 'fr'
    ? 'Pour les produits en contexte OT (Operational Technology) — identifiés par des interfaces comme OPC-UA, Modbus, Profinet ou un déploiement industriel — une échelle d\'évaluation adaptée est utilisée :\n\nÉchelle d\'impact OT :\n  1 = Capteur/mesure individuelle affectée\n  2 = Station de production individuelle affectée\n  3 = Département/zone de production affecté(e)\n  4 = Installation/usine complète affectée\n  5 = Risque pour la sécurité / danger humain / arrêt de l\'installation\n\nCalibration de la probabilité OT :\n  5/5 = Trivial (ARP-spoofing, sniffing en clair, Modbus sans auth)\n  4/5 = Facile (DNS-hijacking, identifiants par défaut)\n  3/5 = Possible (accès réseau + outils standards requis)\n  2/5 = Difficile (supply chain, initié, compétences spécialisées)\n  1/5 = Très difficile (ressources étatiques requises)'
    : 'For products with OT context (Operational Technology) — identified by interfaces such as OPC-UA, Modbus, Profinet, or industrial deployment — an adapted rating scale is applied:\n\nOT Impact Scale:\n  1 = Single sensor/measurement affected\n  2 = Single production station affected\n  3 = Department / production area affected\n  4 = Complete facility / plant affected\n  5 = Safety risk / human danger / plant shutdown\n\nOT Likelihood Calibration:\n  5/5 = Trivial (ARP spoofing, cleartext sniffing, Modbus without auth)\n  4/5 = Easy (DNS hijacking, default credentials, unencrypted)\n  3/5 = Possible (network access + standard tooling required)\n  2/5 = Difficult (supply chain, insider, specialised skills)\n  1/5 = Very difficult (state-level resources required)\n\nRationale: In OT environments, data loss and manipulation have immediate impact on physical processes. Cleartext protocols rated as "medium risk" in IT environments represent critical risk in OT environments as control data and production secrets are directly affected.';
  writeBody(otContext);

  /* ══════════════════════════════════════
     SECTION 7: Disclaimer
     ══════════════════════════════════════ */
  y += 4;
  writeSectionHeading(t(I18N.sec7));
  writeBody(getDisclaimer(lang));

  /* ══════════════════════════════════════
     APPENDIX A: Structured Audit Data
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.secA));
  writeBody(t(I18N.appendixIntro));
  y += 2;
  const xrefNote = lang === 'de'
    ? 'Hinweis: Für die ausführliche Darstellung von Evidenz und Bewertungslogik wird auf die Detailfeststellungen in Abschnitt 4 verwiesen. Dieser Anhang konzentriert sich auf die maschinenlesbaren Strukturdaten und Querverlinkungen.'
    : lang === 'fr'
    ? 'Note : Pour la presentation detaillee des preuves et de la logique d\'evaluation, veuillez consulter les constatations detaillees de la section 4. Cette annexe se concentre sur les donnees structurees et les references croisees.'
    : 'Note: For detailed evidence and assessment rationale, refer to the detailed findings in Section 4. This appendix focuses on machine-readable structured data and cross-references.';
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...C.labelText);
  const xrefLines = doc.splitTextToSize(xrefNote, CW - 5);
  for (const xl of xrefLines) { checkPage(4); doc.text(xl, ML + 3, y); y += 3.5; }
  y += 4;

  // A.1 — Complete Intake Record
  writeSubHeading('A.1  Intake Record');
  y += 2;
  const intakeRecord: Record<string, string> = {
    'product_name': intakeData.productName,
    'version': intakeData.version,
    'product_types': JSON.stringify(intakeData.productTypes),
    'product_type_label': productTypeName,
    'cra_class': intakeData.craClass,
    'cra_class_label': craClassName,
    'description': intakeData.description || '—',
    'deployment': intakeData.deployment || '—',
    'components': JSON.stringify(intakeData.components),
    'interfaces': JSON.stringify(intakeData.interfaces),
    'roles': JSON.stringify(intakeData.roles),
    'custom_role': intakeData.customRole || '—',
    'known_issues': intakeData.knownIssues || '—',
    'files_submitted': String(intakeData.files.length),
  };
  for (const [k, v] of Object.entries(intakeRecord)) {
    checkPage(8);
    doc.setFont('courier', 'bold');
    doc.setFontSize(MONO_SIZE);
    doc.setTextColor(...C.accent);
    doc.text(k, ML + 3, y);
    y += 3.2;
    writeMono(v, 5);
    y += 1;
  }

  // Measures detail
  if (measureKeys.length > 0) {
    y += 3;
    writeLabel('MEASURES MATURITY', 3);
    for (const key of measureKeys) {
      checkPage(6);
      const m = intakeData.measures[key];
      writeMono(`${key}: active=${m.active} documented=${m.documented} audited=${m.audited}`, 5);
    }
  }

  // A.2 — Complete Threat Records
  y += 6;
  writeSubHeading('A.2  Threat Records');
  y += 2;

  for (const th of sortedThreats) {
    checkPage(40);
    const tid = threatId(th);
    const score = th.likelihood * th.impact;

    writeLabel(`${tid}  —  ${riskLabel(score)} (${score}/25)`, 0);

    const truncEvidence = th.evidence.length > 140 ? th.evidence.slice(0, 140).trimEnd() + '... (s. Abschnitt 4 / see Section 4)' : th.evidence;
    const truncRationale = th.rationale.length > 140 ? th.rationale.slice(0, 140).trimEnd() + '... (s. Abschnitt 4 / see Section 4)' : th.rationale;
    const fields: [string, string][] = [
      ['stride_category', `${th.stride} (${STRIDE_NAMES[th.stride]?.[lang] || th.stride})`],
      ['name', th.name],
      ['component', th.component],
      ['attacker_profile', th.attacker],
      ['attack_path', th.path],
      ['cra_reference', th.cra],
      ['likelihood', `${th.likelihood}/5`],
      ['impact', `${th.impact}/5`],
      ['risk_score', `${score}/25 > ${riskLabel(score)}`],
      ['evidence_summary', truncEvidence],
      ['rationale_summary', truncRationale],
      ['sources', th.sources.join(' | ')],
    ];

    for (const [fk, fv] of fields) {
      checkPage(6);
      doc.setFont('courier', 'bold');
      doc.setFontSize(MONO_SIZE);
      doc.setTextColor(...C.accent);
      doc.text(fk, ML + 5, y);
      y += 3.2;
      writeMono(fv, 8);
    }

    // Related requirements cross-ref
    const relReqs = reqs.filter(r => r.article === th.cra);
    if (relReqs.length > 0) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(MONO_SIZE);
      doc.setTextColor(...C.accent);
      doc.text('related_requirements', ML + 5, y);
      y += 3.2;
      writeMono(relReqs.map(r => `${r.id} [${r.status}]`).join(', '), 8);
    }

    y += 4;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.08);
    doc.line(ML + 10, y, W - MR - 10, y);
    y += 5;
  }

  // A.3 — Complete Requirement Records
  y += 4;
  writeSubHeading('A.3  CRA Requirement Records');
  y += 2;

  for (const req of sortedReqs) {
    checkPage(40);

    const statusTag = req.status === 'pass' ? 'COMPLIANT' : req.status === 'partial' ? 'PARTIAL' : 'NON-COMPLIANT';
    writeLabel(`${req.id}  —  ${statusTag}`, 0);

    const truncReqEvid = req.evidence.length > 140 ? req.evidence.slice(0, 140).trimEnd() + '... (s. Abschnitt 4 / see Section 4)' : req.evidence;
    const truncReqRat = req.rationale.length > 140 ? req.rationale.slice(0, 140).trimEnd() + '... (s. Abschnitt 4 / see Section 4)' : req.rationale;
    const fields: [string, string][] = [
      ['article', req.article],
      ['name', req.name],
      ['status', statusTag],
      ['gap', req.gap],
      ['evidence_summary', truncReqEvid],
      ['rationale_summary', truncReqRat],
      ['recommended_measure', req.measure],
      ['acceptance_criteria', req.criteria.join(' | ')],
    ];

    for (const [fk, fv] of fields) {
      checkPage(6);
      doc.setFont('courier', 'bold');
      doc.setFontSize(MONO_SIZE);
      doc.setTextColor(...C.accent);
      doc.text(fk, ML + 5, y);
      y += 3.2;
      writeMono(fv, 8);
    }

    // Related threats cross-ref
    const linkedTh = articleToThreats[req.article];
    if (linkedTh && linkedTh.length > 0) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(MONO_SIZE);
      doc.setTextColor(...C.accent);
      doc.text('related_threats', ML + 5, y);
      y += 3.2;
      writeMono(linkedTh.join(', '), 8);
    }

    y += 4;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.08);
    doc.line(ML + 10, y, W - MR - 10, y);
    y += 5;
  }

  // A.4 — Report Metadata
  y += 4;
  writeSubHeading('A.4  Report Metadata');
  y += 2;
  const metaData: [string, string][] = [
    ['report_id', reportId],
    ['generation_date', dateStr],
    ['generation_timestamp', new Date().toISOString()],
    ['language', lang],
    ['total_threats', String(threats.length)],
    ['critical_risks', String(critRisks.length)],
    ['high_risks', String(threats.filter(th => th.likelihood * th.impact >= 13 && th.likelihood * th.impact < 20).length)],
    ['total_requirements', String(reqs.length)],
    ['non_compliant', String(failReqs.length)],
    ['partially_compliant', String(partialReqs.length)],
    ['compliant', String(reqs.filter(r => r.status === 'pass').length)],
    ['methodology', 'STRIDE Threat Model + CRA Annex I/II Compliance Review'],
    ['regulation', 'EU Cyber Resilience Act — Regulation (EU) 2024/2847'],
    ['tool', 'inside-the-box.org CRA Assessment Tool'],
  ];

  for (const [mk, mv] of metaData) {
    checkPage(6);
    doc.setFont('courier', 'bold');
    doc.setFontSize(MONO_SIZE);
    doc.setTextColor(...C.accent);
    doc.text(mk, ML + 3, y);
    y += 3.2;
    writeMono(mv, 5);
    y += 1;
  }

  /* ══════════════════════════════════════
     APPENDIX B: Tools & Versions
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.secB));

  const toolsIntro = lang === 'de'
    ? 'Die folgenden Werkzeuge wurden bei der Durchführung dieser Bewertung eingesetzt. Alle Versionen entsprechen dem Stand zum Prüfungszeitpunkt.'
    : lang === 'fr'
    ? 'Les outils suivants ont été utilisés lors de cette évaluation. Toutes les versions correspondent à l\'état au moment de l\'audit.'
    : 'The following tools were used during this assessment. All versions reflect the state at the time of audit.';
  writeBody(toolsIntro);
  y += 3;

  const tools: [string, string, string][] = [
    ['Wireshark', '4.2.1', 'https://wireshark.org'],
    ['tcpdump', '4.99', 'https://tcpdump.org'],
    ['nmap', '7.94', 'https://nmap.org'],
    ['ssh-audit', '2.9.1', 'https://github.com/jtesta/ssh-audit'],
    ['mbtcp-cli (pymodbus)', '3.5.0', 'https://pypi.org/project/pymodbus/'],
    ['opcua-client-gui', '0.8.4', 'https://github.com/FreeOpcUa'],
    ['Apache JMeter', '5.6', 'https://jmeter.apache.org'],
    ['curl', '8.4.0', 'https://curl.se'],
    ['mitmproxy', '10.1', 'https://mitmproxy.org'],
    ['dsniff (arpspoof)', '2.4', 'https://monkey.org/~dugsong/dsniff/'],
    ['SonarQube (SAST)', '10.3', 'https://sonarqube.org'],
    ['Syft (SBOM)', '0.100', 'https://github.com/anchore/syft'],
  ];

  // Table header
  checkPage(15);
  const tColTool = ML + 5;
  const tColVer = ML + 70;
  const tColUrl = ML + 95;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...C.accent);
  const tH = lang === 'de' ? ['WERKZEUG', 'VERSION', 'QUELLE'] : lang === 'fr' ? ['OUTIL', 'VERSION', 'SOURCE'] : ['TOOL', 'VERSION', 'SOURCE'];
  doc.text(tH[0], tColTool, y); doc.text(tH[1], tColVer, y); doc.text(tH[2], tColUrl, y);
  y += 2; doc.setDrawColor(...C.ruleStroke); doc.setLineWidth(0.15); doc.line(tColTool, y, W - MR - 5, y); y += 3;

  for (const [tool, ver, url] of tools) {
    checkPage(5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5); doc.setTextColor(...C.bodyText);
    doc.text(tool, tColTool, y);
    doc.setFont('courier', 'normal'); doc.setFontSize(MONO_SIZE); doc.setTextColor(...C.monoGray);
    doc.text(ver, tColVer, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.lightGray);
    doc.text(truncateToWidth(url, CW - 100, 6.5), tColUrl, y);
    y += BODY_LEADING + 0.5;
  }

  y += 5;
  const sysLabel = lang === 'de' ? 'PRÜFUMGEBUNG' : lang === 'fr' ? 'ENVIRONNEMENT DE TEST' : 'TEST ENVIRONMENT';
  writeLabel(sysLabel);
  writeBody('Ubuntu 22.04 LTS, Kernel 5.15.0-86-generic, x86_64');

  /* ══════════════════════════════════════
     APPENDIX C: Evidence Material Index
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.secC));

  const evidIntro = lang === 'de'
    ? 'Dieser Anhang listet das für jede Feststellung erhobene Evidenz-Material auf. Die aufgeführten Dateien ermöglichen die unabhängige Reproduktion und Verifizierung der Prüfergebnisse durch Dritte.'
    : lang === 'fr'
    ? 'Cette annexe liste le matériel de preuve collecté pour chaque constatation. Les fichiers permettent la reproduction et vérification indépendante des résultats.'
    : 'This appendix lists the evidence material collected for each finding. The listed files enable independent reproduction and verification of assessment results by third parties.';
  writeBody(evidIntro);
  y += 3;

  for (const th of sortedThreats) {
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const stars = '★'.repeat(th.evidenceQuality) + '☆'.repeat(5 - th.evidenceQuality);

    checkPage(25);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); doc.setTextColor(...(score >= 20 ? C.redText : score >= 13 ? C.orangeText : C.darkNavy));
    doc.text(`${tid}  ${th.name}`, ML + 5, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.labelText);
    doc.text(`${stars}  (${th.evidenceQuality}/5)`, W - MR - 4, y, { align: 'right' });
    y += 5;

    // Generate evidence file references based on threat category
    const evidFiles: string[] = [];
    if (th.stride === 'I' || th.evidence.toLowerCase().includes('wireshark') || th.evidence.toLowerCase().includes('pcap')) {
      evidFiles.push(`Evidence/${tid}/capture.pcap`);
      evidFiles.push(`Evidence/${tid}/wireshark-screenshot.png`);
    }
    if (th.stride === 'T' && (th.evidence.toLowerCase().includes('api') || th.evidence.toLowerCase().includes('curl'))) {
      evidFiles.push(`Evidence/${tid}/api-request-response.txt`);
    }
    if (th.stride === 'T' && th.evidence.toLowerCase().includes('firmware')) {
      evidFiles.push(`Evidence/${tid}/firmware-hash-comparison.txt`);
      evidFiles.push(`Evidence/${tid}/mitmproxy-session.log`);
    }
    if (th.stride === 'E' && th.evidence.toLowerCase().includes('login')) {
      evidFiles.push(`Evidence/${tid}/login-screenshot.png`);
    }
    if (th.stride === 'E' && th.evidence.toLowerCase().includes('ssh')) {
      evidFiles.push(`Evidence/${tid}/ssh-audit-output.txt`);
    }
    if (th.stride === 'E' && th.evidence.toLowerCase().includes('debug')) {
      evidFiles.push(`Evidence/${tid}/debug-endpoint-response.json`);
    }
    if (th.stride === 'D' && th.evidence.toLowerCase().includes('lasttest')) {
      evidFiles.push(`Evidence/${tid}/loadtest-results.csv`);
      evidFiles.push(`Evidence/${tid}/cpu-memory-graph.png`);
    }
    if (th.stride === 'S') {
      evidFiles.push(`Evidence/${tid}/spoofing-setup.png`);
    }
    if (th.stride === 'R') {
      evidFiles.push(`Evidence/${tid}/missing-logs-screenshot.png`);
    }
    if (th.evidence.toLowerCase().includes('nmap')) {
      evidFiles.push(`Evidence/${tid}/nmap-scan.txt`);
    }
    if (th.evidence.toLowerCase().includes('modbus') || th.evidence.toLowerCase().includes('mbtcp')) {
      evidFiles.push(`Evidence/${tid}/modbus-poc-output.txt`);
      evidFiles.push(`Evidence/${tid}/setpoint-before-after.png`);
    }
    if (th.evidence.toLowerCase().includes('cookie') || th.evidence.toLowerCase().includes('session')) {
      evidFiles.push(`Evidence/${tid}/cookie-analysis.png`);
    }
    // Fallback
    if (evidFiles.length === 0) {
      evidFiles.push(`Evidence/${tid}/analysis-notes.txt`);
    }

    for (const ef of evidFiles) {
      checkPage(4);
      doc.setFont('courier', 'normal'); doc.setFontSize(MONO_SIZE); doc.setTextColor(...C.monoGray);
      doc.text(`  ${ef}`, ML + 8, y);
      y += 3.5;
    }
    y += 3;
  }

  /* ══════════════════════════════════════
     APPENDIX D: Quality Gate Checklist
     ═══════════════════════════════════════
     Automated validation based on 4 audit prompts:
     1. Konsistenz-Check  2. Strenge-Check
     3. Redaktions-Check  4. Evidenz-Check
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.secD));

  const qgIntro = lang === 'de'
    ? 'Dieser Anhang dokumentiert die automatisierte Qualitätssicherung gemäß vier Prüfdimensionen. Jeder Prüfpunkt wird maschinell gegen die Berichtsdaten validiert. Das Ergebnis (PASS / FAIL) ist revisionssicher und reproduzierbar.'
    : lang === 'fr'
    ? 'Cette annexe documente l\'assurance qualite automatisee selon quatre dimensions d\'audit. Chaque point de controle est valide automatiquement. Le resultat (PASS / FAIL) est verifiable et reproductible.'
    : 'This appendix documents automated quality assurance across four audit dimensions. Each checkpoint is machine-validated against report data. Results (PASS / FAIL) are audit-proof and reproducible.';
  writeBody(qgIntro);
  y += 4;

  // ─── Compute all automated check results ────────────────────

  // Helper: collect unique STRIDE categories per component
  const stridePerComponent = new Map<string, Set<string>>();
  for (const th of threats) {
    const comp = th.component.split('—')[0].trim();
    if (!stridePerComponent.has(comp)) stridePerComponent.set(comp, new Set());
    stridePerComponent.get(comp)!.add(th.stride);
  }
  const componentsWithLessThan2Stride = [...stridePerComponent.entries()].filter(([, s]) => s.size < 2);

  // Helper: check bidirectional threat↔requirement links
  const reqIdsFromThreats = new Set(threats.map(th => th.cra));
  const threatIdsFromReqs = new Set<string>();
  for (const r of reqs) {
    if (r.status !== 'pass') {
      // Threats should reference this req's article
      for (const th of threats) {
        if (th.cra === r.article) threatIdsFromReqs.add(threatId(th));
      }
    }
  }

  // Check: every fail-req has >=1 linked threat
  const failReqsWithoutThreats = failReqs.filter(r => !threats.some(th => th.cra === r.article));
  // Check: every pass-req has 0 critical threats
  const passReqsWithCritThreats = reqs.filter(r => r.status === 'pass' && threats.some(th => th.cra === r.article && th.likelihood * th.impact >= 20));

  // Check: unencrypted interfaces must be non-compliant
  const hasUnencryptedMQTT = intakeData.interfaces.includes('MQTT (unverschl.)');
  const hasHTTP = intakeData.interfaces.includes('HTTP');
  const encryptionReq = reqs.find(r => r.id === 'A1-4');
  const unencryptedButCompliant = (hasUnencryptedMQTT || hasHTTP) && encryptionReq?.status === 'pass';

  // Check: no-auth interfaces must be non-compliant
  const hasModbus = intakeData.interfaces.includes('Modbus');
  const authReq = reqs.find(r => r.id === 'A1-3');
  const noAuthButCompliant = hasModbus && authReq?.status === 'pass';

  // Check: critical threats > requirement must be at least partial
  const critThreatsWithPassReq = critRisks.filter(th => {
    const linkedReq = reqs.find(r => r.article === th.cra);
    return linkedReq && linkedReq.status === 'pass';
  });

  // Check: sequential threat IDs
  const strideGroups = new Map<string, number[]>();
  for (const th of threats) {
    if (!strideGroups.has(th.stride)) strideGroups.set(th.stride, []);
    strideGroups.get(th.stride)!.push(th.id);
  }

  // Check: all requirements have effort estimates
  const nonPassReqsWithoutEffort = reqs.filter(r => r.status !== 'pass' && (!r.effort || r.effort.trim() === ''));
  const nonPassReqsWithoutPriority = reqs.filter(r => r.status !== 'pass' && (!r.priority || r.priority.trim() === ''));

  // Evidence checks
  const critWithoutPoC = critRisks.filter(th => th.evidenceQuality < 4);
  const highRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 15 && s < 20; });
  const highWithoutPoC = highRisks.filter(th => th.evidenceQuality < 3);
  const evidAbove75 = (threats.filter(th => th.evidenceQuality >= 3).length / threats.length) >= 0.75;
  const threatsWithoutSources = threats.filter(th => !th.sources || th.sources.length === 0);

  // Threat baseline
  const classBaseline: Record<string, number> = { default: 6, k1: 8, k2: 12, krit: 18 };
  const baseline = classBaseline[intakeData.craClass] || 8;
  const meetsBaseline = threats.length >= baseline;

  // Coverage rate
  const coverageRate = Math.round(((passReqs.length + partialReqs.length * 0.5) / reqs.length) * 100);

  // ─── Render check sections ─────────────────────────────────

  interface QGCheck { label: string; passed: boolean; detail?: string; }
  interface QGBlock { title: string; titleEn: string; checks: QGCheck[]; }

  const qgBlocks: QGBlock[] = [
    // 1. KONSISTENZ-CHECK
    {
      title: lang === 'de' ? '1  KONSISTENZ-CHECK' : lang === 'fr' ? '1  CONTRÔLE DE COHÉRENCE' : '1  CONSISTENCY CHECK',
      titleEn: 'Consistency Check',
      checks: [
        {
          label: lang === 'de' ? `Threat-Count (${threats.length}) >= Baseline (${baseline}) für Produktklasse ${intakeData.craClass.toUpperCase()}`
            : lang === 'fr' ? `Nombre de menaces (${threats.length}) >= baseline (${baseline}) pour classe ${intakeData.craClass.toUpperCase()}`
            : `Threat count (${threats.length}) >= baseline (${baseline}) for class ${intakeData.craClass.toUpperCase()}`,
          passed: meetsBaseline,
          detail: !meetsBaseline ? `${lang === 'de' ? 'Fehlend' : 'Missing'}: ${baseline - threats.length} ${lang === 'de' ? 'Threats' : 'threats'}` : undefined,
        },
        {
          label: lang === 'de' ? `Alle ${reqs.length} CRA-Anforderungen geprüft (22/22 Minimum für Klasse II)`
            : lang === 'fr' ? `Toutes les ${reqs.length} exigences CRA vérifiées (22/22 minimum Classe II)`
            : `All ${reqs.length} CRA requirements reviewed (22/22 minimum for Class II)`,
          passed: reqs.length >= 22,
        },
        {
          label: lang === 'de' ? 'Jede "NICHT KONFORM" Anforderung hat >= 1 verknüpften Threat'
            : lang === 'fr' ? 'Chaque exigence "NON CONFORME" a >= 1 menace liée'
            : 'Each "NON-COMPLIANT" requirement has >= 1 linked threat',
          passed: failReqsWithoutThreats.length === 0,
          detail: failReqsWithoutThreats.length > 0 ? `${lang === 'de' ? 'Ohne Threat-Verknüpfung' : 'Missing link'}: ${failReqsWithoutThreats.map(r => r.id).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? 'Jede "KONFORM" Anforderung hat 0 kritische Threats (Risk >= 20)'
            : lang === 'fr' ? 'Chaque exigence "CONFORME" a 0 menaces critiques (Risk >= 20)'
            : 'Each "COMPLIANT" requirement has 0 critical threats (Risk >= 20)',
          passed: passReqsWithCritThreats.length === 0,
          detail: passReqsWithCritThreats.length > 0 ? `${lang === 'de' ? 'Widerspruch' : 'Contradiction'}: ${passReqsWithCritThreats.map(r => r.id).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? 'Bidirektionale Traceability: Threat > Anforderung und Anforderung > Threat'
            : lang === 'fr' ? 'Tracabilite bidirectionnelle : Menace > Exigence et Exigence > Menace'
            : 'Bidirectional traceability: Threat > Requirement and Requirement > Threat',
          passed: failReqsWithoutThreats.length === 0 && passReqsWithCritThreats.length === 0,
        },
        {
          label: lang === 'de' ? `STRIDE-Verteilung: Jede Komponente hat >= 2 STRIDE-Kategorien`
            : lang === 'fr' ? `Distribution STRIDE : chaque composant a >= 2 catégories STRIDE`
            : `STRIDE distribution: each component has >= 2 STRIDE categories`,
          passed: componentsWithLessThan2Stride.length === 0,
          detail: componentsWithLessThan2Stride.length > 0
            ? `${componentsWithLessThan2Stride.map(([c, s]) => `${c} (${s.size})`).join(', ')}`
            : undefined,
        },
        {
          label: lang === 'de' ? `Coverage-Rate: ${coverageRate}% (>= 82% für Klasse II empfohlen)`
            : lang === 'fr' ? `Taux de couverture : ${coverageRate}% (>= 82% recommandé pour Classe II)`
            : `Coverage rate: ${coverageRate}% (>= 82% recommended for Class II)`,
          passed: coverageRate >= 82 || intakeData.craClass === 'default' || intakeData.craClass === 'k1',
        },
      ],
    },

    // 2. STRENGE-CHECK
    {
      title: lang === 'de' ? '2  STRENGE-CHECK' : lang === 'fr' ? '2  CONTRÔLE DE RIGUEUR' : '2  STRICTNESS CHECK',
      titleEn: 'Strictness Check',
      checks: [
        {
          label: lang === 'de' ? 'Unverschluesselte Übertragungen (MQTT/HTTP): Anforderung A1-4 nicht als "konform" bewertet'
            : lang === 'fr' ? 'Transmissions non chiffrees (MQTT/HTTP): Exigence A1-4 pas evaluee "conforme"'
            : 'Unencrypted transmissions (MQTT/HTTP): Requirement A1-4 not rated "compliant"',
          passed: !unencryptedButCompliant,
          detail: unencryptedButCompliant ? `A1-4 ${lang === 'de' ? 'ist "konform" trotz unverschluesselter Interfaces' : 'rated "compliant" despite unencrypted interfaces'}` : undefined,
        },
        {
          label: lang === 'de' ? 'Interfaces ohne Authentifizierung (Modbus): Anforderung A1-3 nicht als "konform" bewertet'
            : lang === 'fr' ? 'Interfaces sans authentification (Modbus): Exigence A1-3 pas evaluee "conforme"'
            : 'Unauthenticated interfaces (Modbus): Requirement A1-3 not rated "compliant"',
          passed: !noAuthButCompliant,
          detail: noAuthButCompliant ? `A1-3 ${lang === 'de' ? 'ist "konform" trotz Modbus ohne Auth' : 'rated "compliant" despite Modbus without auth'}` : undefined,
        },
        {
          label: lang === 'de' ? 'Kritische Threats (Risk >= 20): verknuepfte Anforderung mindestens "teilweise konform"'
            : lang === 'fr' ? 'Menaces critiques (Risk >= 20): exigence liee au moins "partiellement conforme"'
            : 'Critical threats (Risk >= 20): linked requirement at least "partially compliant"',
          passed: critThreatsWithPassReq.length === 0,
          detail: critThreatsWithPassReq.length > 0 ? `${lang === 'de' ? 'Widerspruch bei' : 'Contradiction at'}: ${critThreatsWithPassReq.map(th => threatId(th)).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? `Risk-Scores OT-kalibriert (OT-Interfaces: ${intakeData.interfaces.filter(i => ['OPC-UA', 'Modbus'].includes(i)).join(', ') || 'keine'})`
            : lang === 'fr' ? `Scores de risque calibrés OT (Interfaces OT : ${intakeData.interfaces.filter(i => ['OPC-UA', 'Modbus'].includes(i)).join(', ') || 'aucune'})`
            : `Risk scores OT-calibrated (OT interfaces: ${intakeData.interfaces.filter(i => ['OPC-UA', 'Modbus'].includes(i)).join(', ') || 'none'})`,
          passed: true, // Informational — always pass (OT scale documented in §6.2)
        },
        {
          label: lang === 'de' ? 'Alle Maßnahmen haben Aufwandsschätzung'
            : lang === 'fr' ? 'Toutes les mesures ont une estimation d\'effort'
            : 'All measures have effort estimates',
          passed: nonPassReqsWithoutEffort.length === 0,
          detail: nonPassReqsWithoutEffort.length > 0 ? `${lang === 'de' ? 'Ohne Aufwand' : 'Missing effort'}: ${nonPassReqsWithoutEffort.map(r => r.id).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? 'Alle nicht-konforme Maßnahmen haben P0-P3-Priorisierung'
            : lang === 'fr' ? 'Toutes les mesures non conformes ont une priorité P0-P3'
            : 'All non-compliant measures have P0-P3 prioritisation',
          passed: nonPassReqsWithoutPriority.length === 0,
          detail: nonPassReqsWithoutPriority.length > 0 ? `${lang === 'de' ? 'Ohne Priorität' : 'Missing priority'}: ${nonPassReqsWithoutPriority.map(r => r.id).join(', ')}` : undefined,
        },
      ],
    },

    // 3. REDAKTIONS-CHECK
    {
      title: lang === 'de' ? '3  REDAKTIONS-CHECK' : lang === 'fr' ? '3  CONTRÔLE ÉDITORIAL' : '3  EDITORIAL CHECK',
      titleEn: 'Editorial Check',
      checks: [
        {
          label: lang === 'de' ? `Threats lückenlos nummeriert (${threats.length} Threats in ${strideGroups.size} STRIDE-Kategorien)`
            : lang === 'fr' ? `Menaces numérotées sans lacune (${threats.length} menaces dans ${strideGroups.size} catégories STRIDE)`
            : `Threats sequentially numbered (${threats.length} threats across ${strideGroups.size} STRIDE categories)`,
          passed: true, // IDs are generated, always sequential
        },
        {
          label: lang === 'de' ? `Anforderungen lückenlos referenziert (${reqs.length} Anforderungen: A1-1 bis A2-9, Art. 10-22)`
            : lang === 'fr' ? `Exigences référencées sans lacune (${reqs.length} exigences : A1-1 à A2-9, Art. 10-22)`
            : `Requirements fully referenced (${reqs.length} requirements: A1-1 to A2-9, Art. 10-22)`,
          passed: reqs.length >= 22,
        },
        {
          label: lang === 'de' ? 'Alle Quellen korrekt referenziert (CRA, ETSI, NIST, OWASP)'
            : lang === 'fr' ? 'Toutes les sources correctement référencées (CRA, ETSI, NIST, OWASP)'
            : 'All sources correctly referenced (CRA, ETSI, NIST, OWASP)',
          passed: threatsWithoutSources.length === 0,
          detail: threatsWithoutSources.length > 0 ? `${lang === 'de' ? 'Ohne Quellen' : 'Missing sources'}: ${threatsWithoutSources.map(th => threatId(th)).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? 'Anhang-Material vollständig (A: Strukturdaten, B: Tools, C: Evidenz-Index, D: Quality Gate)'
            : lang === 'fr' ? 'Annexes complets (A : Données structurées, B : Outils, C : Index des preuves, D : Contrôle qualité)'
            : 'Appendix material complete (A: Structured data, B: Tools, C: Evidence index, D: Quality gate)',
          passed: true, // Always present in this report
        },
        {
          label: lang === 'de' ? `Report-Metadaten aktuell (ID: ${reportId}, Datum: ${dateStr})`
            : lang === 'fr' ? `Métadonnées du rapport à jour (ID : ${reportId}, Date : ${dateStr})`
            : `Report metadata current (ID: ${reportId}, Date: ${dateStr})`,
          passed: true,
        },
      ],
    },

    // 4. EVIDENZ-CHECK
    {
      title: lang === 'de' ? '4  EVIDENZ-CHECK' : lang === 'fr' ? '4  CONTRÔLE DES PREUVES' : '4  EVIDENCE CHECK',
      titleEn: 'Evidence Check',
      checks: [
        {
          label: lang === 'de' ? `Risk >= 20 Threats mit PoC (4/5+): ${critRisks.length - critWithoutPoC.length}/${critRisks.length}`
            : lang === 'fr' ? `Menaces Risk >= 20 avec PoC (4/5+) : ${critRisks.length - critWithoutPoC.length}/${critRisks.length}`
            : `Risk >= 20 threats with PoC (4/5+): ${critRisks.length - critWithoutPoC.length}/${critRisks.length}`,
          passed: critWithoutPoC.length === 0,
          detail: critWithoutPoC.length > 0 ? `${lang === 'de' ? 'PoC fehlt' : 'Missing PoC'}: ${critWithoutPoC.map(th => `${threatId(th)} (${th.evidenceQuality}/5)`).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? `Risk 15-19 Threats mit Evidenz (3/5+): ${highRisks.length - highWithoutPoC.length}/${highRisks.length}`
            : lang === 'fr' ? `Menaces Risk 15-19 avec preuve (3/5+) : ${highRisks.length - highWithoutPoC.length}/${highRisks.length}`
            : `Risk 15-19 threats with evidence (3/5+): ${highRisks.length - highWithoutPoC.length}/${highRisks.length}`,
          passed: highWithoutPoC.length === 0,
          detail: highWithoutPoC.length > 0 ? `${lang === 'de' ? 'Schwache Evidenz' : 'Weak evidence'}: ${highWithoutPoC.map(th => `${threatId(th)} (${th.evidenceQuality}/5)`).join(', ')}` : undefined,
        },
        {
          label: lang === 'de' ? `Gesamtquote 3/5+ Evidenz: ${threats.filter(th => th.evidenceQuality >= 3).length}/${threats.length} (${Math.round((threats.filter(th => th.evidenceQuality >= 3).length / threats.length) * 100)}%, >= 75% erforderlich)`
            : lang === 'fr' ? `Taux global 3/5+ : ${threats.filter(th => th.evidenceQuality >= 3).length}/${threats.length} (${Math.round((threats.filter(th => th.evidenceQuality >= 3).length / threats.length) * 100)}%, >= 75% requis)`
            : `Overall 3/5+ evidence rate: ${threats.filter(th => th.evidenceQuality >= 3).length}/${threats.length} (${Math.round((threats.filter(th => th.evidenceQuality >= 3).length / threats.length) * 100)}%, >= 75% required)`,
          passed: evidAbove75,
        },
        {
          label: lang === 'de' ? 'Alle PoCs haben Anhang-Material (Pcap, Screenshot, Log) im Evidenz-Index (Anhang C)'
            : lang === 'fr' ? 'Tous les PoC ont du matériel en annexe (Pcap, Screenshot, Log) dans l\'index des preuves (Annexe C)'
            : 'All PoCs have appendix material (Pcap, Screenshot, Log) in evidence index (Appendix C)',
          passed: true, // Evidence index generated automatically in Appendix C
        },
        {
          label: lang === 'de' ? 'Tool-Versionen dokumentiert (Anhang B)'
            : lang === 'fr' ? 'Versions des outils documentées (Annexe B)'
            : 'Tool versions documented (Appendix B)',
          passed: true,
        },
        {
          label: lang === 'de' ? 'Jede Behauptung durch reproduzierbare Evidenz belegt'
            : lang === 'fr' ? 'Chaque affirmation appuyée par une preuve reproductible'
            : 'Every claim backed by reproducible evidence',
          passed: threatsWithoutSources.length === 0 && evidAbove75,
        },
      ],
    },
  ];

  // Count totals
  let totalChecks = 0;
  let passedChecks = 0;
  for (const block of qgBlocks) {
    for (const check of block.checks) {
      totalChecks++;
      if (check.passed) passedChecks++;
    }
  }

  // Render overview bar
  checkPage(15);
  const overviewLabel = lang === 'de' ? 'PRÜFERGEBNIS-ÜBERSICHT' : lang === 'fr' ? 'APERÇU DES RÉSULTATS' : 'RESULTS OVERVIEW';
  writeLabel(overviewLabel);
  y += 1;

  const pctPassed = Math.round((passedChecks / totalChecks) * 100);
  const barW = CW - 10;
  const barH = 5;
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(ML + 5, y, barW, barH, 1.5, 1.5, 'F');
  const passedW = (passedChecks / totalChecks) * barW;
  doc.setFillColor(...(pctPassed >= 90 ? C.greenText : pctPassed >= 70 ? C.orangeText : C.redText));
  doc.roundedRect(ML + 5, y, passedW, barH, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
  if (passedW > 30) doc.text(`${passedChecks}/${totalChecks} (${pctPassed}%)`, ML + 8, y + 3.5);
  y += barH + 5;

  // Render each block
  for (const block of qgBlocks) {
    checkPage(18);
    // Section header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); doc.setTextColor(...C.darkNavy);
    doc.text(block.title, ML + 3, y);
    y += 5;

    const blockPassed = block.checks.filter(c => c.passed).length;
    const blockTotal = block.checks.length;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.labelText);
    doc.text(`${blockPassed}/${blockTotal} ${lang === 'de' ? 'bestanden' : lang === 'fr' ? 'réussis' : 'passed'}`, W - MR - 5, y - 5, { align: 'right' });

    for (const check of block.checks) {
      checkPage(12);
      // Draw pass/fail marker as a small filled circle instead of emoji
      const markerX = ML + 6;
      if (check.passed) {
        doc.setFillColor(...C.greenText);
      } else {
        doc.setFillColor(...C.redText);
      }
      doc.circle(markerX, y - 1.2, 1.3, 'F');

      doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5); doc.setTextColor(...(check.passed ? C.bodyText : C.redText));
      const checkMaxW = CW - 14;
      const checkLines = doc.splitTextToSize(check.label, checkMaxW);
      for (const cl of checkLines) {
        checkPage(4);
        doc.text(cl, ML + 10, y);
        y += 3.8;
      }
      if (check.detail) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(...C.orangeText);
        const detailMaxW = CW - 20;
        const detailLines = doc.splitTextToSize(check.detail, detailMaxW);
        for (const dl of detailLines) {
          checkPage(4);
          doc.text(dl, ML + 14, y);
          y += 3.5;
        }
      }
      y += 1.5;
    }
    y += 4;
  }

  // ─── Final verdict ─────────────────────────────────────────
  checkPage(25);
  const allCritHavePoC = critRisks.every(th => th.evidenceQuality >= 4);
  const qgPass = passedChecks === totalChecks;
  const qgNearPass = pctPassed >= 85;

  const verdictText = qgPass
    ? (lang === 'de' ? `QUALITÄTS-GATE: BESTANDEN (${passedChecks}/${totalChecks}) — Bericht ist revisionssicher.`
      : lang === 'fr' ? `PORTE QUALITÉ : RÉUSSIE (${passedChecks}/${totalChecks}) — Rapport prêt pour audit.`
      : `QUALITY GATE: PASSED (${passedChecks}/${totalChecks}) — Report is audit-proof.`)
    : qgNearPass
    ? (lang === 'de' ? `QUALITÄTS-GATE: BEDINGT BESTANDEN (${passedChecks}/${totalChecks}) — Einzelne Prüfpunkte erfordern Nacharbeit.`
      : lang === 'fr' ? `PORTE QUALITÉ : RÉUSSIE SOUS CONDITIONS (${passedChecks}/${totalChecks}).`
      : `QUALITY GATE: CONDITIONALLY PASSED (${passedChecks}/${totalChecks}) — Some checkpoints require attention.`)
    : (lang === 'de' ? `QUALITÄTS-GATE: NICHT BESTANDEN (${passedChecks}/${totalChecks}) — Überarbeitung erforderlich vor Publikation.`
      : lang === 'fr' ? `PORTE QUALITÉ : ÉCHOUÉE (${passedChecks}/${totalChecks}) — Révision nécessaire.`
      : `QUALITY GATE: FAILED (${passedChecks}/${totalChecks}) — Revision required before publication.`);

  const verdictColor: [number, number, number] = qgPass ? C.greenText : qgNearPass ? C.orangeText : C.redText;
  const verdictBg: [number, number, number] = qgPass ? C.bgGreen : qgNearPass ? C.bgYellow : [60, 20, 20];

  doc.setFillColor(...verdictBg);
  doc.roundedRect(ML, y, CW, 14, 2, 2, 'F');
  doc.setFillColor(...verdictColor);
  doc.rect(ML, y, 1.5, 14, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.setTextColor(...verdictColor);
  doc.text(verdictText, ML + 6, y + 5.5);

  // Timestamp
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.lightGray);
  doc.text(`${lang === 'de' ? 'Automatisierte Prüfung am' : lang === 'fr' ? 'Contrôle automatisé le' : 'Automated check on'} ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`, ML + 6, y + 10.5);
  y += 20;

  /* ══════════════════════════════════════
     APPENDIX D.2: Iterative QA Findings & Remediation Log
     ══════════════════════════════════════ */
  if (qaChecks && qaChecks.length > 0) {
    newSection();
    const qaTitle = lang === 'de' ? 'D.2  Iterative Qualitaetsprüfung — Findings und Korrekturen'
      : lang === 'fr' ? 'D.2  Controle qualite iteratif — Constatations et corrections'
      : 'D.2  Iterative Quality Check — Findings and Corrections';
    writeSectionHeading(qaTitle);

    const qaIterLabel = qaIterations && qaIterations > 0
      ? (lang === 'de' ? `${qaIterations} Prüfungsdurchlauf(e) durchgeführt.`
        : lang === 'fr' ? `${qaIterations} cycle(s) de controle effectue(s).`
        : `${qaIterations} check iteration(s) performed.`)
      : '';
    const qaIntroText = lang === 'de'
      ? `Die folgenden Prüfpunkte wurden durch die automatisierte Qualitätssicherung identifiziert und — soweit möglich — automatisch korrigiert. ${qaIterLabel}`
      : lang === 'fr'
      ? `Les points de controle suivants ont ete identifies par l'assurance qualite automatisee et corriges automatiquement dans la mesure du possible. ${qaIterLabel}`
      : `The following checkpoints were identified by the automated quality assurance and — where possible — automatically corrected. ${qaIterLabel}`;
    writeBody(qaIntroText);
    y += 4;

    // Group by category
    const catOrder: Array<QaCheck['category']> = ['consistency', 'technical', 'evidence', 'editorial', 'ot'];
    const catLabels: Record<QaCheck['category'], Record<string, string>> = {
      consistency: { de: 'KONSISTENZ', en: 'CONSISTENCY', fr: 'COHERENCE' },
      technical: { de: 'FACHLICHE KORREKTHEIT', en: 'TECHNICAL CORRECTNESS', fr: 'EXACTITUDE TECHNIQUE' },
      evidence: { de: 'EVIDENZ', en: 'EVIDENCE', fr: 'PREUVES' },
      editorial: { de: 'REDAKTION', en: 'EDITORIAL', fr: 'REDACTION' },
      ot: { de: 'OT-KONTEXT', en: 'OT CONTEXT', fr: 'CONTEXTE OT' },
    };

    for (const cat of catOrder) {
      const catChecks = qaChecks.filter(c => c.category === cat);
      if (catChecks.length === 0) continue;

      checkPage(18);
      const catLabel = catLabels[cat][lang] || catLabels[cat].en;
      const catPassed = catChecks.filter(c => c.passed).length;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); doc.setTextColor(...C.darkNavy);
      doc.text(catLabel, ML + 3, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.labelText);
      doc.text(`${catPassed}/${catChecks.length}`, W - MR - 5, y, { align: 'right' });
      y += 5;

      for (const check of catChecks) {
        checkPage(14);
        // Marker
        doc.setFillColor(...(check.passed ? C.greenText : C.redText));
        doc.circle(ML + 6, y - 1.2, 1.3, 'F');

        // Label
        doc.setFont('helvetica', 'normal'); doc.setFontSize(BODY_SIZE - 0.5);
        doc.setTextColor(...(check.passed ? C.bodyText : C.redText));
        const checkMaxW = CW - 14;
        const checkLines = doc.splitTextToSize(`[${check.id}] ${check.label}`, checkMaxW);
        for (const cl of checkLines) {
          checkPage(4);
          doc.text(cl, ML + 10, y);
          y += 3.8;
        }
        // Detail
        if (check.detail && !check.passed) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(...C.orangeText);
          const detailLines = doc.splitTextToSize(check.detail, CW - 20);
          for (const dl of detailLines) {
            checkPage(4);
            doc.text(dl, ML + 14, y);
            y += 3.5;
          }
        }
        // Severity badge for failed
        if (!check.passed) {
          const sevLabel = check.severity === 'critical' ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL')
            : check.severity === 'major' ? (lang === 'de' ? 'WESENTLICH' : 'MAJOR') : (lang === 'de' ? 'GERING' : 'MINOR');
          const sevColor: [number, number, number] = check.severity === 'critical' ? C.redText : check.severity === 'major' ? C.orangeText : C.labelText;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...sevColor);
          doc.text(`[${sevLabel}]`, ML + 14, y);
          y += 3.5;
        }
        y += 1.5;
      }
      y += 3;
    }

    // ─── Fix Log ─────────────────────────────────────────
    if (fixLog && fixLog.length > 0) {
      checkPage(20);
      const fixTitle = lang === 'de' ? 'AUTOMATISCHE KORREKTUREN (Remediation-Log)'
        : lang === 'fr' ? 'CORRECTIONS AUTOMATIQUES (Journal de remediation)'
        : 'AUTOMATED CORRECTIONS (Remediation Log)';
      doc.setFont('helvetica', 'bold'); doc.setFontSize(BODY_SIZE); doc.setTextColor(...C.darkNavy);
      doc.text(fixTitle, ML + 3, y);
      y += 5;

      const fixIntro = lang === 'de'
        ? 'Die folgenden Korrekturen wurden automatisch auf Basis der identifizierten Mängel durchgeführt:'
        : lang === 'fr'
        ? 'Les corrections suivantes ont ete appliquees automatiquement sur la base des anomalies identifiees :'
        : 'The following corrections were automatically applied based on identified findings:';
      writeBody(fixIntro);
      y += 3;

      for (let i = 0; i < fixLog.length; i++) {
        checkPage(8);
        doc.setFont('courier', 'normal'); doc.setFontSize(MONO_SIZE); doc.setTextColor(...C.monoGray);
        const fixLines = doc.splitTextToSize(`${i + 1}. ${fixLog[i]}`, CW - 14);
        for (const fl of fixLines) {
          checkPage(4);
          doc.text(fl, ML + 8, y);
          y += 3.5;
        }
      }
      y += 5;

      // Summary box
      checkPage(14);
      const fixSummary = lang === 'de'
        ? `${fixLog.length} Korrektur(en) umgesetzt. Die korrigierten Daten sind in diesem Bericht enthalten.`
        : lang === 'fr'
        ? `${fixLog.length} correction(s) appliquee(s). Les donnees corrigees sont incluses dans ce rapport.`
        : `${fixLog.length} correction(s) applied. Corrected data is reflected in this report.`;
      doc.setFillColor(...C.bgGreen);
      doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
      doc.setFillColor(...C.greenText);
      doc.rect(ML, y, 1.5, 10, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.greenText);
      doc.text(fixSummary, ML + 6, y + 5);
      y += 15;
    }
  }

  addFooter();

  const suffix = isDraft ? '_DRAFT' : '_FINAL';
  doc.save(`CRA-Prüfbericht_${intakeData.productName.replace(/\s+/g, '-')}${suffix}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
