export type Lang = 'de' | 'en' | 'fr';
export type L = Record<Lang, string>;

export interface Dim {
  id: string;
  short: L;
  title: L;
  items: L[];
  recommendation: L;
}

export const DIMENSIONS: Dim[] = [
  {
    id: 'd1',
    short: { de: 'Governance', en: 'Governance', fr: 'Gouvernance' },
    title: { de: '1 · Governance & Verantwortlichkeiten', en: '1 · Governance & Accountability', fr: '1 · Gouvernance & responsabilités' },
    items: [
      { de: 'Für Tabletop Exercises ist eine klare, namentlich benannte Verantwortlichkeit definiert.', en: 'A clear, named accountability for tabletop exercises is defined.', fr: 'Une responsabilité claire et nommément attribuée existe pour les tabletops.' },
      { de: 'Die Geschäftsleitung ist formal in das Übungsprogramm eingebunden und informiert sich regelmäßig über Ergebnisse.', en: 'Senior management is formally involved and regularly briefed on results.', fr: 'La direction est formellement impliquée et informée régulièrement des résultats.' },
      { de: 'Es existiert eine verabschiedete Richtlinie, die Übungsziele, Frequenz und Rollen regelt.', en: 'An approved policy defines exercise goals, frequency, and roles.', fr: 'Une politique approuvée définit objectifs, fréquence et rôles des exercices.' },
    ],
    recommendation: {
      de: 'Benannten TTX-Owner etablieren, Vorstandsbericht in Q-Rhythmus aufsetzen und eine knappe Übungs-Policy verabschieden (Ziele, Frequenz, Rollen, Eskalation).',
      en: 'Establish a named TTX owner, set up quarterly board reporting, and approve a concise exercise policy (goals, frequency, roles, escalation).',
      fr: 'Désigner un responsable TTX, mettre en place un reporting trimestriel au COMEX et adopter une politique d\'exercices concise (objectifs, fréquence, rôles, escalade).',
    },
  },
  {
    id: 'd2',
    short: { de: 'Szenarien', en: 'Scenarios', fr: 'Scénarios' },
    title: { de: '2 · Szenarien & Bedrohungsrelevanz', en: '2 · Scenarios & Threat Relevance', fr: '2 · Scénarios & pertinence des menaces' },
    items: [
      { de: 'Übungsszenarien basieren auf einer aktuellen Bedrohungs- und Risikoanalyse der Organisation.', en: 'Exercise scenarios are based on a current threat and risk analysis.', fr: 'Les scénarios reposent sur une analyse actuelle des menaces et des risques.' },
      { de: 'Szenarien adressieren kritische Themen wie Ransomware, Drittparteienausfall und kombinierte Angriffe.', en: 'Scenarios cover critical topics such as ransomware, third-party outage, and blended attacks.', fr: 'Les scénarios couvrent rançongiciel, défaillance tiers et attaques combinées.' },
      { de: 'Szenarien werden regelmäßig aktualisiert und an neue Bedrohungslagen angepasst.', en: 'Scenarios are regularly updated to reflect new threat landscapes.', fr: 'Les scénarios sont mis à jour régulièrement selon l\'évolution des menaces.' },
    ],
    recommendation: {
      de: 'Szenarien aus Risikoanalyse und Threat Intelligence ableiten; Pflicht-Themen Ransomware, Drittparteienausfall, kombinierte Angriffe; jährliches Szenarien-Review verankern.',
      en: 'Derive scenarios from risk analysis and threat intelligence; mandate ransomware, third-party outage, blended attacks; embed an annual scenario review.',
      fr: 'Dériver les scénarios de l\'analyse des risques et de la threat intel ; rendre obligatoires rançongiciel, défaillance tiers et attaques combinées ; revue annuelle des scénarios.',
    },
  },
  {
    id: 'd3',
    short: { de: 'Durchführung', en: 'Execution', fr: 'Exécution' },
    title: { de: '3 · Durchführung & Frequenz', en: '3 · Execution & Frequency', fr: '3 · Exécution & fréquence' },
    items: [
      { de: 'Tabletop Exercises werden mindestens jährlich durchgeführt.', en: 'Tabletop exercises are conducted at least annually.', fr: 'Les tabletops sont organisés au moins une fois par an.' },
      { de: 'Die Übungen verwenden eine strukturierte Inject- und Eskalationsmechanik (kein reines Brainstorming).', en: 'Exercises use structured injects and escalation mechanics (not mere brainstorming).', fr: 'Les exercices utilisent injects et mécanique d\'escalade structurés (pas un simple brainstorming).' },
      { de: 'Moderation und Durchführung erfolgen durch ausgebildete interne oder externe Übungsleiter.', en: 'Facilitation is performed by trained internal or external exercise leads.', fr: 'L\'animation est assurée par des facilitateurs internes ou externes formés.' },
    ],
    recommendation: {
      de: 'Mindestens eine TTX pro Jahr fix planen, mit Inject-Plan, Zeitachsen und definierten Eskalationspunkten; Moderation durch geschulte Leitung sicherstellen.',
      en: 'Plan at least one TTX per year with inject plan, timeline, and defined escalation points; ensure facilitation by trained leads.',
      fr: 'Planifier au moins un TTX par an avec plan d\'injects, chronologie et points d\'escalade définis ; animation par des facilitateurs formés.',
    },
  },
  {
    id: 'd4',
    short: { de: 'Rollen', en: 'Roles', fr: 'Rôles' },
    title: { de: '4 · Rollen & Management-Einbindung', en: '4 · Roles & Management Engagement', fr: '4 · Rôles & implication du management' },
    items: [
      { de: 'Alle relevanten Funktionen (Management, IT, Security, Legal, Kommunikation) sind in den Übungen vertreten.', en: 'All relevant functions (management, IT, security, legal, comms) are represented.', fr: 'Toutes les fonctions clés (direction, IT, sécurité, juridique, comm.) sont représentées.' },
      { de: 'Teilnehmer agieren rollenbasiert und treffen reale Entscheidungen unter Zeitdruck.', en: 'Participants act in role and make real decisions under time pressure.', fr: 'Les participants jouent leur rôle et prennent de vraies décisions sous contrainte de temps.' },
      { de: 'Externe Parteien (z. B. Dienstleister, Behörden) werden bei Bedarf simuliert oder einbezogen.', en: 'External parties (providers, authorities) are simulated or involved when needed.', fr: 'Les parties externes (prestataires, autorités) sont simulées ou impliquées si nécessaire.' },
    ],
    recommendation: {
      de: 'Festen Teilnehmerkreis für Management, IT, Security, Legal, Kommunikation definieren; rollenbasierte Entscheidungen unter Zeitdruck simulieren; Dienstleister/Behörden über Cell-Spieler einbinden.',
      en: 'Define a fixed participant set across management, IT, security, legal, and comms; simulate role-based decisions under time pressure; involve providers/authorities via cell players.',
      fr: 'Définir un cercle fixe de participants (direction, IT, sécurité, juridique, comm.) ; simuler des décisions sous contrainte de temps ; intégrer prestataires/autorités via des cellules.',
    },
  },
  {
    id: 'd5',
    short: { de: 'Doku', en: 'Documentation', fr: 'Documentation' },
    title: { de: '5 · Dokumentation & Auditfähigkeit', en: '5 · Documentation & Audit Readiness', fr: '5 · Documentation & auditabilité' },
    items: [
      { de: 'Jede Übung wird nach standardisiertem Template dokumentiert (Ziele, Ablauf, Entscheidungen, Ergebnisse).', en: 'Each exercise is documented using a standardised template (objectives, flow, decisions, results).', fr: 'Chaque exercice est documenté avec un modèle standardisé (objectifs, déroulé, décisions, résultats).' },
      { de: 'Die Dokumentation genügt den Anforderungen interner und externer Auditoren.', en: 'Documentation meets internal and external auditor requirements.', fr: 'La documentation satisfait aux exigences des auditeurs internes et externes.' },
      { de: 'Übungsunterlagen werden revisionssicher archiviert und sind auf Anforderung abrufbar.', en: 'Exercise records are archived in an audit-proof manner and retrievable on demand.', fr: 'Les dossiers d\'exercice sont archivés de façon auditable et accessibles sur demande.' },
    ],
    recommendation: {
      de: 'Standard-Template (Ziele, Ablauf, Entscheidungen, Ergebnisse) verbindlich machen; revisionssichere Ablage definieren; jährliche Stichprobe durch interne Revision.',
      en: 'Mandate a standard template (objectives, flow, decisions, results); define audit-proof storage; annual sampling by internal audit.',
      fr: 'Imposer un modèle standard (objectifs, déroulé, décisions, résultats) ; définir un stockage auditable ; échantillonnage annuel par l\'audit interne.',
    },
  },
  {
    id: 'd6',
    short: { de: 'Lessons Learned', en: 'Lessons Learned', fr: 'Retours d\'expérience' },
    title: { de: '6 · Lessons Learned & Maßnahmenverfolgung', en: '6 · Lessons Learned & Follow-up', fr: '6 · Retours d\'expérience & suivi' },
    items: [
      { de: 'Nach jeder Übung findet ein strukturiertes Debriefing / Hot Wash statt.', en: 'A structured debrief / hot wash follows every exercise.', fr: 'Un débriefing structuré (hot wash) suit chaque exercice.' },
      { de: 'Identifizierte Schwachstellen werden als Maßnahmen mit Verantwortlichen und Fristen nachverfolgt.', en: 'Identified gaps are tracked as actions with owners and deadlines.', fr: 'Les écarts identifiés sont suivis comme actions avec responsables et délais.' },
      { de: 'Die Wirksamkeit umgesetzter Maßnahmen wird in Folgeübungen erneut geprüft.', en: 'Effectiveness of implemented measures is re-tested in follow-up exercises.', fr: 'L\'efficacité des mesures mises en œuvre est revérifiée lors d\'exercices ultérieurs.' },
    ],
    recommendation: {
      de: 'Hot Wash direkt nach der Übung; Maßnahmenliste mit Owner, Frist, Status im ISMS-Tool führen; Wirksamkeit in der Folge-TTX erneut prüfen.',
      en: 'Hot wash immediately after the exercise; track actions with owner, deadline, and status in the ISMS tool; re-test effectiveness in the next TTX.',
      fr: 'Hot wash juste après l\'exercice ; piloter les actions (responsable, délai, statut) dans l\'outil SMSI ; revérifier l\'efficacité lors du TTX suivant.',
    },
  },
  {
    id: 'd7',
    short: { de: 'ISMS / BCM', en: 'ISMS / BCM', fr: 'SMSI / PCA' },
    title: { de: '7 · Integration in ISMS / BCM', en: '7 · Integration into ISMS / BCM', fr: '7 · Intégration au SMSI / PCA' },
    items: [
      { de: 'Das TTX-Programm ist fester Bestandteil des ISMS und/oder BCM.', en: 'The TTX programme is an integral part of ISMS and/or BCM.', fr: 'Le programme TTX fait partie intégrante du SMSI et/ou du PCA.' },
      { de: 'Übungsergebnisse fließen in Risikoanalyse und Business Impact Analyse ein.', en: 'Exercise results feed into risk analysis and business impact analysis.', fr: 'Les résultats alimentent l\'analyse de risques et le BIA.' },
      { de: 'Es existieren KPIs, mit denen der Reifegrad des Übungsprogramms gemessen wird.', en: 'KPIs exist to measure the maturity of the exercise programme.', fr: 'Des KPI mesurent la maturité du programme d\'exercices.' },
    ],
    recommendation: {
      de: 'TTX als Pflichtkapitel in ISMS/BCM verankern; Findings in Risiko- und BIA-Update spiegeln; KPIs (Frequenz, Findings/Übung, Schließquote, Wirksamkeitsnachweis) im Management-Reporting führen.',
      en: 'Anchor TTX as a mandatory chapter in ISMS/BCM; reflect findings in risk and BIA updates; report KPIs (frequency, findings/exercise, closure rate, effectiveness evidence) to management.',
      fr: 'Ancrer le TTX comme chapitre obligatoire du SMSI/PCA ; refléter les findings dans la mise à jour des risques et le BIA ; reporter des KPI (fréquence, findings/exercice, taux de clôture, preuve d\'efficacité) au management.',
    },
  },
  {
    id: 'd8',
    short: { de: 'Regulatorik', en: 'Regulatory', fr: 'Réglementaire' },
    title: { de: '8 · Regulatorisches Mapping (DORA / NIS-2)', en: '8 · Regulatory Mapping (DORA / NIS-2)', fr: '8 · Mapping réglementaire (DORA / NIS-2)' },
    items: [
      { de: 'Die Übungspraxis ist explizit auf DORA Art. 24–25 bzw. NIS-2 Art. 21 gemappt.', en: 'Exercise practice is explicitly mapped to DORA Art. 24–25 and NIS-2 Art. 21.', fr: 'La pratique d\'exercice est explicitement mappée à DORA Art. 24–25 et NIS-2 Art. 21.' },
      { de: 'Übungsnachweise wurden bereits erfolgreich in einem Audit oder einer Prüfung vorgelegt.', en: 'Exercise evidence has already been successfully presented in an audit or review.', fr: 'Les preuves d\'exercice ont déjà été présentées avec succès lors d\'un audit ou d\'une revue.' },
      { de: 'Die Wirksamkeit der Cyber- und BCM-Maßnahmen ist nachweisbar (NIS-2 Art. 21 Abs. 2 lit. f).', en: 'Effectiveness of cyber and BCM measures is demonstrable (NIS-2 Art. 21(2)(f)).', fr: 'L\'efficacité des mesures cyber et PCA est démontrable (NIS-2 Art. 21(2)(f)).' },
    ],
    recommendation: {
      de: 'Mapping-Tabelle TTX ↔ DORA Art. 24–25 / NIS-2 Art. 21 erstellen; Übungsdokumentation als Wirksamkeitsnachweis (Art. 21 Abs. 2 lit. f) aufbereiten; Audit-Probe-Set vorhalten.',
      en: 'Build a mapping table TTX ↔ DORA Art. 24–25 / NIS-2 Art. 21; package exercise documentation as effectiveness evidence (Art. 21(2)(f)); keep an audit sample set ready.',
      fr: 'Construire une table de mapping TTX ↔ DORA Art. 24–25 / NIS-2 Art. 21 ; préparer la documentation d\'exercice comme preuve d\'efficacité (Art. 21(2)(f)) ; tenir prêt un jeu d\'échantillons pour audit.',
    },
  },
];

export const ITEMS_PER_DIM = 3;
export const MAX_PER_DIM = ITEMS_PER_DIM * 3; // 9
export const MAX_TOTAL = DIMENSIONS.length * MAX_PER_DIM; // 72

export interface Verdict {
  key: 'red' | 'yellow' | 'orange' | 'green';
  title: L;
  desc: L;
  hsl: string; // raw "h, s%, l%"
}

export const VERDICTS: Verdict[] = [
  {
    key: 'red',
    title: { de: 'Rot · Kritisch', en: 'Red · Critical', fr: 'Rouge · Critique' },
    desc: {
      de: 'Dringender Handlungsbedarf. Weder regulatorische Anforderungen noch Wirksamkeitsnachweis erfüllt. Aufbau eines TTX-Programms sollte unmittelbar starten.',
      en: 'Urgent action required. Neither regulatory requirements nor effectiveness evidence are met. Build-up of a TTX programme should start immediately.',
      fr: 'Action urgente requise. Ni les exigences réglementaires ni la preuve d\'efficacité ne sont satisfaites. La mise en place d\'un programme TTX doit démarrer immédiatement.',
    },
    hsl: '0, 75%, 55%',
  },
  {
    key: 'yellow',
    title: { de: 'Gelb · Lückenhaft', en: 'Yellow · Patchy', fr: 'Jaune · Lacunaire' },
    desc: {
      de: 'Erste Strukturen vorhanden, aber nicht auditfest. Gezielte Befähigung und methodische Überarbeitung des Übungsprogramms empfehlenswert.',
      en: 'Initial structures exist but are not audit-proof. Targeted enablement and methodical rework of the exercise programme are advisable.',
      fr: 'Premières structures en place mais non auditables. Une montée en compétence ciblée et une refonte méthodique du programme d\'exercices sont recommandées.',
    },
    hsl: '45, 90%, 55%',
  },
  {
    key: 'orange',
    title: { de: 'Orange · Solide', en: 'Orange · Solid', fr: 'Orange · Solide' },
    desc: {
      de: 'Gute Basis, aber Feinschliff nötig: Regulatorisches Mapping, KPIs und Integration in ISMS/BCM konsequent ausbauen.',
      en: 'Good foundation, but fine-tuning needed: consistently expand regulatory mapping, KPIs, and integration into ISMS/BCM.',
      fr: 'Bonne base, mais ajustements nécessaires : étendre systématiquement le mapping réglementaire, les KPI et l\'intégration au SMSI/PCA.',
    },
    hsl: '33, 96%, 49%',
  },
  {
    key: 'green',
    title: { de: 'Grün · Auditfähig', en: 'Green · Audit-ready', fr: 'Vert · Auditable' },
    desc: {
      de: 'Sehr gutes Reifeniveau. Fokus auf Skalierung, Train-the-Trainer und kontinuierliche Weiterentwicklung des Szenarien-Portfolios.',
      en: 'Very good maturity. Focus on scaling, train-the-trainer, and continuous evolution of the scenario portfolio.',
      fr: 'Très bonne maturité. Mettre l\'accent sur le passage à l\'échelle, le train-the-trainer et l\'évolution continue du portefeuille de scénarios.',
    },
    hsl: '122, 39%, 45%',
  },
];

export function getVerdict(score: number): Verdict {
  if (score <= 24) return VERDICTS[0];
  if (score <= 48) return VERDICTS[1];
  if (score <= 60) return VERDICTS[2];
  return VERDICTS[3];
}
