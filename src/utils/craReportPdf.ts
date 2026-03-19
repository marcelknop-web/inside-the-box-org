import jsPDF from 'jspdf';
import type { IntakeData, Threat, CraReq } from '@/data/craData';
import { threatId } from '@/data/craData';

export interface CraReportData {
  intakeData: IntakeData;
  threats: Threat[];
  reqs: CraReq[];
  language: 'de' | 'en' | 'fr';
  productTypeName: string;
  craClassName: string;
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
  sec5a: { de: '5.1  Priorisierte Maßnahmen (P0–P3)', en: '5.1  Prioritised Measures (P0–P3)', fr: '5.1  Mesures priorisées (P0–P3)' },
  sec5b: { de: '5.2  Remediation-Roadmap', en: '5.2  Remediation Roadmap', fr: '5.2  Feuille de route de remédiation' },
  sec6: { de: '6  Methodik und Prüfungsgrundlagen', en: '6  Methodology and Audit Standards', fr: '6  Méthodologie et normes d\'audit' },
  sec6a: { de: '6.1  Risikobewertungsmatrix', en: '6.1  Risk Rating Matrix', fr: '6.1  Matrice d\'évaluation des risques' },
  sec7: { de: '7  Einschränkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limites et clause de non-responsabilité' },
  secA: { de: 'A  Strukturierte Prüfdaten (maschinenlesbar)', en: 'A  Structured Audit Data (machine-readable)', fr: 'A  Données d\'audit structurées (lisibles par machine)' },

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

  totalThreats: { de: 'Bedrohungen', en: 'Threats', fr: 'Menaces' },
  criticalRisks: { de: 'Kritisch (≥ 20)', en: 'Critical (≥ 20)', fr: 'Critiques (≥ 20)' },
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

function getMgmtSummary(
  p: string, threats: number, crit: number, failReqs: number, partialReqs: number, totalReqs: number, lang: string
): string {
  if (lang === 'de') return `Die Prüfung hat ${threats} Bedrohungsszenarien identifiziert und bewertet. Davon weisen ${crit} einen kritischen Risikoscore auf (Eintrittswahrscheinlichkeit × Auswirkung ≥ 20) und erfordern unmittelbares Handeln.\n\nVon ${totalReqs} geprüften CRA-Anforderungen sind ${failReqs} als nicht konform eingestuft. Diese Abweichungen betreffen grundlegende Sicherheitseigenschaften, die vor einer Markteinführung zwingend adressiert werden müssen. Weitere ${partialReqs} Anforderungen sind nur teilweise erfüllt und bedürfen der Nachbesserung.\n\n${crit > 0 ? 'Die identifizierten kritischen Risiken betreffen insbesondere Bereiche, in denen Angreifer mit vertretbarem Aufwand erheblichen Schaden anrichten können. Eine verzögerte Behebung erhöht das Risiko regulatorischer Beanstandungen und potenzieller Haftungsansprüche.' : 'Es wurden keine Bedrohungen mit kritischem Risikoscore identifiziert. Die vorhandenen Maßnahmen adressieren die wesentlichen Angriffsvektoren angemessen.'}\n\n${failReqs > 0 ? 'Handlungsbedarf besteht vor allem bei den in Abschnitt 5 aufgeführten Sofortmaßnahmen. Diese sollten priorisiert und mit klaren Verantwortlichkeiten und Zeitplänen versehen werden.' : 'Die CRA-Anforderungen werden weitgehend erfüllt. Die verbleibenden Teilerfüllungen sollten im Rahmen des regulären Entwicklungsprozesses adressiert werden.'}`;
  if (lang === 'fr') return `L'évaluation a identifié et évalué ${threats} scénarios de menaces. Parmi ceux-ci, ${crit} présentent un score de risque critique (probabilité × impact ≥ 20) et nécessitent une action immédiate.\n\nSur ${totalReqs} exigences CRA examinées, ${failReqs} sont classées comme non conformes. Ces écarts concernent des propriétés de sécurité fondamentales qui doivent impérativement être corrigées avant la mise sur le marché. ${partialReqs} exigences supplémentaires ne sont que partiellement satisfaites.\n\n${crit > 0 ? 'Les risques critiques identifiés concernent notamment des domaines où un attaquant peut causer des dommages significatifs avec un effort raisonnable.' : 'Aucune menace avec un score de risque critique n\'a été identifiée.'}\n\n${failReqs > 0 ? 'Les actions immédiates détaillées dans la section 5 doivent être priorisées avec des responsabilités et des délais clairs.' : 'Les exigences CRA sont largement satisfaites. Les conformités partielles restantes peuvent être traitées dans le cadre du processus de développement régulier.'}`;
  return `The assessment identified and evaluated ${threats} threat scenarios. Of these, ${crit} carry a critical risk score (likelihood × impact ≥ 20) and require immediate action.\n\nOf ${totalReqs} CRA requirements reviewed, ${failReqs} are rated as non-compliant. These deviations affect fundamental security properties that must be addressed before market entry. An additional ${partialReqs} requirements are only partially fulfilled and require remediation.\n\n${crit > 0 ? 'The identified critical risks particularly affect areas where attackers can cause significant damage with reasonable effort. Delayed remediation increases the risk of regulatory objections and potential liability claims.' : 'No threats with critical risk scores were identified. The existing measures adequately address the primary attack vectors.'}\n\n${failReqs > 0 ? 'Priority action is required on the immediate measures listed in Section 5. These should be assigned clear ownership and timelines.' : 'CRA requirements are largely met. The remaining partial fulfillments should be addressed through the regular development process.'}`;
}

function getMethodology(lang: string): string {
  if (lang === 'de') return `Die Prüfung folgt einem zweistufigen Ansatz:\n\n1. Bedrohungsanalyse nach STRIDE\nSystematische Identifikation von Bedrohungsszenarien in den Kategorien Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service und Elevation of Privilege. Jede Bedrohung wird anhand einer 5-stufigen Skala für Eintrittswahrscheinlichkeit und Auswirkung bewertet. Der Risikoscore ergibt sich als Produkt beider Werte; Scores ab 20 gelten als kritisch.\n\n2. Konformitätsprüfung gegen CRA-Anforderungen\nAbgleich der implementierten Sicherheitsmaßnahmen mit den Anforderungen aus Annex I (Sicherheitseigenschaften digitaler Produkte), Annex II (Schwachstellenbehandlung) sowie den Meldepflichten nach Art. 14 und der Dokumentationspflicht nach Art. 13 der Verordnung (EU) 2024/2847.\n\nPrüfungsgrundlagen:\n  – EU Cyber Resilience Act (CRA) — Verordnung (EU) 2024/2847\n  – STRIDE Threat Model — Microsoft Security Development Lifecycle\n  – OWASP IoT Top 10 / OWASP API Security Top 10\n  – ETSI EN 303 645 — Cyber Security for Consumer IoT\n  – NIST SP 800-82r3 — Guide to OT Security\n  – ISO/IEC 27001:2022 (als Referenzrahmen)`;
  if (lang === 'fr') return `L'évaluation suit une approche en deux étapes :\n\n1. Analyse des menaces selon STRIDE\nIdentification systématique des scénarios de menaces dans les catégories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service et Elevation of Privilege. Chaque menace est évaluée sur une échelle de 1 à 5 pour la probabilité et l'impact. Le score de risque est le produit des deux valeurs ; les scores de 20 et plus sont considérés comme critiques.\n\n2. Vérification de conformité CRA\nComparaison des mesures de sécurité mises en œuvre avec les exigences de l'Annexe I (propriétés de sécurité des produits numériques), l'Annexe II (traitement des vulnérabilités) ainsi que les obligations de notification (Art. 14) et de documentation (Art. 13) du Règlement (UE) 2024/2847.\n\nNormes de référence :\n  – EU Cyber Resilience Act (CRA) — Règlement (UE) 2024/2847\n  – STRIDE Threat Model — Microsoft Security Development Lifecycle\n  – OWASP IoT Top 10 / OWASP API Security Top 10\n  – ETSI EN 303 645 — Cyber Security for Consumer IoT\n  – NIST SP 800-82r3 — Guide to OT Security\n  – ISO/IEC 27001:2022 (cadre de référence)`;
  return `The assessment follows a two-stage approach:\n\n1. STRIDE Threat Analysis\nSystematic identification of threat scenarios across the categories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Each threat is rated on a 5-point scale for both likelihood and impact. The risk score is calculated as the product of both values; scores of 20 or above are classified as critical.\n\n2. CRA Compliance Review\nComparison of implemented security measures against the requirements of Annex I (security properties of digital products), Annex II (vulnerability handling), as well as the reporting obligations under Art. 14 and documentation requirements under Art. 13 of Regulation (EU) 2024/2847.\n\nAudit Standards:\n  – EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847\n  – STRIDE Threat Model — Microsoft Security Development Lifecycle\n  – OWASP IoT Top 10 / OWASP API Security Top 10\n  – ETSI EN 303 645 — Cyber Security for Consumer IoT\n  – NIST SP 800-82r3 — Guide to OT Security\n  – ISO/IEC 27001:2022 (reference framework)`;
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
  doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
  const wc: [number, number, number] = [195, 155, 30];
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
  const { intakeData, threats, reqs, language, productTypeName, craClassName } = data;
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

  // ── Cross-reference map: CRA article → threat IDs ──
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
    drawWatermark(doc, W / 2, H / 2, 52);
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
  drawWatermark(doc, W / 2, 120, 65);

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

  const tocItems = [I18N.sec1, I18N.sec2, I18N.sec3, I18N.sec4, I18N.sec4c, I18N.sec5, I18N.sec6, I18N.sec7, I18N.secA];
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
     SECTION 2: Management Summary
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec2));
  writeBody(getMgmtSummary(intakeData.productName, threats.length, critRisks.length, failReqs.length, partialReqs.length, reqs.length, lang));
  y += 6;

  // Stats boxes
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

  // STRIDE Distribution summary
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

  // 3.1 Product Profile
  writeSubHeading(t(I18N.sec3a));
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
    writeFieldBlock(t(I18N.description), intakeData.description, 0);
  }

  // 3.2 Components & Architecture
  y += 3;
  writeSubHeading(t(I18N.sec3b));
  if (intakeData.components.length > 0) {
    for (const comp of intakeData.components) {
      checkPage(6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(...C.bodyText);
      doc.text(`•  ${comp}`, ML + 5, y);
      y += BODY_LEADING + 0.5;
    }
  } else {
    writeBody('—');
  }

  // 3.3 Security Measures
  y += 3;
  writeSubHeading(t(I18N.sec3c));
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
  writeBody(intakeData.knownIssues || t(I18N.noKnownIssues));

  // 3.5 Submitted Documentation
  y += 3;
  writeSubHeading(t(I18N.sec3e));
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

  // 4.1 Threat Landscape
  writeSubHeading(t(I18N.sec4a));
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
    const scoreStr = `${rl}  ${th.likelihood} × ${th.impact} = ${score}`;
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

    // Risk score breakdown
    writeLabel(t(I18N.riskScore), 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.bodyText);
    const scoreDetail = `${t(I18N.likelihood)}: ${th.likelihood}/5  ×  ${t(I18N.impact)}: ${th.impact}/5  =  ${score}/25  →  ${rl}`;
    doc.text(scoreDetail, ML + 8, y);
    y += BODY_LEADING + FIELD_GAP;

    if (th.sources.length > 0) {
      writeLabel(t(I18N.sources), 5);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...C.lightGray);
      for (const src of th.sources) {
        checkPage(4);
        doc.text(`–  ${src}`, ML + 8, y);
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

  /* ══════════════════════════════════════
     SECTION 5: Recommendations
     ══════════════════════════════════════ */
  newSection();
  writeSectionHeading(t(I18N.sec5));

  if (failReqs.length === 0 && critRisks.length === 0) {
    writeBody(lang === 'de'
      ? 'Auf Basis der durchgeführten Prüfung ergeben sich keine Sofortmaßnahmen. Die bestehenden Maßnahmen adressieren die identifizierten Risiken angemessen.'
      : lang === 'fr'
      ? 'Sur la base de l\'évaluation réalisée, aucune action immédiate n\'est nécessaire. Les mesures existantes répondent de manière adéquate aux risques identifiés.'
      : 'Based on the assessment conducted, no immediate actions are required. The existing measures adequately address the identified risks.');
  } else {
    if (critRisks.length > 0) {
      checkPage(14);
      writeSubHeading(`${t(I18N.priority)}: ${t(I18N.high)}`);

      for (const th of critRisks) {
        checkPage(12);
        const tid = threatId(th);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...C.redText);
        doc.text(tid, ML + 5, y);

        doc.setTextColor(...C.darkNavy);
        const nameMaxW = CW - 24;
        const recName = truncateToWidth(th.name, nameMaxW, BODY_SIZE);
        doc.text(recName, ML + 20, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...C.bodyText);
        const desc = lang === 'de'
          ? `Risikoscore ${th.likelihood} × ${th.impact} = ${th.likelihood * th.impact}. ${th.component} — Unmittelbare technische Gegenmaßnahmen erforderlich.`
          : lang === 'fr'
          ? `Score de risque ${th.likelihood} × ${th.impact} = ${th.likelihood * th.impact}. ${th.component} — Contre-mesures techniques immédiates nécessaires.`
          : `Risk score ${th.likelihood} × ${th.impact} = ${th.likelihood * th.impact}. ${th.component} — Immediate technical countermeasures required.`;
        const dLines = doc.splitTextToSize(desc, CW - 24);
        for (const dl of dLines) {
          checkPage(5);
          doc.text(dl, ML + 20, y);
          y += BODY_LEADING;
        }
        y += 3;
      }
      y += 2;
    }

    if (failReqs.length > 0) {
      checkPage(14);
      const gapPrio = critRisks.length > 0
        ? `${t(I18N.priority)}: ${t(I18N.medium)}`
        : `${t(I18N.priority)}: ${t(I18N.high)}`;
      writeSubHeading(gapPrio);

      for (let i = 0; i < failReqs.length; i++) {
        checkPage(12);
        const r = failReqs[i];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...C.redText);
        doc.text(`${i + 1}.`, ML + 5, y);

        doc.setTextColor(...C.darkNavy);
        const gapText = `${r.name} (${r.id})`;
        const gapMaxW = CW - 18;
        const truncGap = truncateToWidth(gapText, gapMaxW, BODY_SIZE);
        doc.text(truncGap, ML + 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...C.bodyText);
        const mLines = doc.splitTextToSize(r.measure, CW - 18);
        for (const ml of mLines) {
          checkPage(5);
          doc.text(ml, ML + 14, y);
          y += BODY_LEADING;
        }
        y += 3;
      }
    }
  }

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
    ? 'Die Risikobewertung erfolgt auf Basis einer 5×5-Matrix. Jede Bedrohung wird auf zwei Achsen bewertet:\n\nEintrittswahrscheinlichkeit (1–5):\n  1 = Sehr unwahrscheinlich (erfordert staatliche Ressourcen)\n  2 = Unwahrscheinlich (erfordert erheblichen Aufwand/Insider)\n  3 = Möglich (Netzwerkzugang + Standard-Tooling)\n  4 = Wahrscheinlich (geringer Aufwand, öffentlich bekannte Methoden)\n  5 = Sehr wahrscheinlich (trivial, keine besonderen Kenntnisse)\n\nAuswirkung (1–5):\n  1 = Minimal (keine Datenverluste, lokale Störung)\n  2 = Gering (begrenzter Datenverlust, einzelne Funktion betroffen)\n  3 = Mittel (Konfigurationsänderung, Compliance-Verstoß)\n  4 = Hoch (Datenabfluss, Produktionsausfall, Admin-Zugriff)\n  5 = Kritisch (persistente Kompromittierung, Lateral Movement, physischer Schaden)\n\nRisikoscore = Eintrittswahrscheinlichkeit × Auswirkung\n  Gering: 1–5  |  Mittel: 6–12  |  Hoch: 13–19  |  Kritisch: 20–25'
    : lang === 'fr'
    ? 'L\'évaluation des risques est basée sur une matrice 5×5. Chaque menace est évaluée sur deux axes :\n\nProbabilité (1–5) :\n  1 = Très improbable (ressources étatiques nécessaires)\n  2 = Improbable (effort considérable / initié)\n  3 = Possible (accès réseau + outils standards)\n  4 = Probable (faible effort, méthodes publiques)\n  5 = Très probable (trivial, aucune connaissance spéciale)\n\nImpact (1–5) :\n  1 = Minimal (pas de perte de données, perturbation locale)\n  2 = Faible (perte de données limitée, fonction unique affectée)\n  3 = Moyen (changement de configuration, violation de conformité)\n  4 = Élevé (fuite de données, arrêt de production, accès admin)\n  5 = Critique (compromission persistante, mouvement latéral, dommages physiques)\n\nScore de risque = Probabilité × Impact\n  Faible : 1–5  |  Moyen : 6–12  |  Élevé : 13–19  |  Critique : 20–25'
    : 'Risk assessment is based on a 5×5 matrix. Each threat is evaluated on two axes:\n\nLikelihood (1–5):\n  1 = Very unlikely (requires state-level resources)\n  2 = Unlikely (requires significant effort / insider access)\n  3 = Possible (network access + standard tooling)\n  4 = Likely (low effort, publicly known methods)\n  5 = Very likely (trivial, no special knowledge required)\n\nImpact (1–5):\n  1 = Minimal (no data loss, local disruption only)\n  2 = Low (limited data loss, single function affected)\n  3 = Medium (configuration change, compliance violation)\n  4 = High (data exfiltration, production outage, admin access)\n  5 = Critical (persistent compromise, lateral movement, physical damage)\n\nRisk Score = Likelihood × Impact\n  Low: 1–5  |  Medium: 6–12  |  High: 13–19  |  Critical: 20–25';
  writeBody(matrixExplanation);

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

    const fields: [string, string][] = [
      ['stride_category', `${th.stride} (${STRIDE_NAMES[th.stride]?.[lang] || th.stride})`],
      ['name', th.name],
      ['component', th.component],
      ['attacker_profile', th.attacker],
      ['attack_path', th.path],
      ['cra_reference', th.cra],
      ['likelihood', `${th.likelihood}/5`],
      ['impact', `${th.impact}/5`],
      ['risk_score', `${score}/25 → ${riskLabel(score)}`],
      ['evidence', th.evidence],
      ['rationale', th.rationale],
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

    const fields: [string, string][] = [
      ['article', req.article],
      ['name', req.name],
      ['status', statusTag],
      ['gap', req.gap],
      ['evidence', req.evidence],
      ['rationale', req.rationale],
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

  addFooter();

  doc.save(`CRA-Pruefbericht_${intakeData.productName.replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
