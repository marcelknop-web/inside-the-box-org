import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { StaggerReveal } from '@/components/StaggerReveal';

type Lang = 'de' | 'en' | 'fr';
type L = Record<Lang, string>;

const I18N = {
  toggleOpen: { de: '▸ TTX Readiness Self-Assessment starten', en: '▸ Start TTX Readiness Self-Assessment', fr: '▸ Lancer le Self-Assessment TTX Readiness' } as L,
  toggleClose: { de: '▾ Self-Assessment einklappen', en: '▾ Collapse self-assessment', fr: '▾ Réduire le self-assessment' } as L,
  title: { de: 'TTX Readiness – Self-Assessment', en: 'TTX Readiness – Self-Assessment', fr: 'TTX Readiness – Self-Assessment' } as L,
  intro: {
    de: 'Acht Dimensionen, die Aufsicht und Auditoren unter DORA und NIS-2 erwarten. ~10 Minuten. Ergebnis: Reifegrad-Score und Ampel-Einordnung.',
    en: 'Eight dimensions that supervisors and auditors expect under DORA and NIS-2. ~10 minutes. Result: maturity score and traffic-light interpretation.',
    fr: 'Huit dimensions attendues par les superviseurs et auditeurs sous DORA et NIS-2. ~10 minutes. Résultat : score de maturité et interprétation feu tricolore.',
  } as L,
  scale0: { de: '0 – nicht zutreffend', en: '0 – does not apply', fr: '0 – non applicable' } as L,
  scale1: { de: '1 – teilweise', en: '1 – partial', fr: '1 – partiel' } as L,
  scale2: { de: '2 – überwiegend', en: '2 – mostly', fr: '2 – globalement' } as L,
  scale3: { de: '3 – voll auditfähig', en: '3 – fully audit-ready', fr: '3 – pleinement auditable' } as L,
  total: { de: 'Gesamtergebnis', en: 'Total score', fr: 'Score total' } as L,
  reset: { de: 'Zurücksetzen', en: 'Reset', fr: 'Réinitialiser' } as L,
  disclaimer: {
    de: 'Orientierungshilfe. Ersetzt keine formale Prüfung durch Auditoren oder Aufsichtsbehörden.',
    en: 'Indicative guidance. Does not replace formal audits or supervisory reviews.',
    fr: 'Outil indicatif. Ne remplace pas un audit formel ni une revue de l\'autorité de tutelle.',
  } as L,
  // verdicts
  vRedTitle: { de: 'Rot – Kritisch', en: 'Red – Critical', fr: 'Rouge – Critique' } as L,
  vRedDesc: {
    de: 'Dringender Handlungsbedarf. Weder regulatorische Anforderungen noch Wirksamkeitsnachweis erfüllt. Aufbau eines TTX-Programms sollte unmittelbar starten.',
    en: 'Urgent action required. Neither regulatory requirements nor effectiveness evidence are met. Build-up of a TTX programme should start immediately.',
    fr: 'Action urgente requise. Ni les exigences réglementaires ni la preuve d\'efficacité ne sont satisfaites. La mise en place d\'un programme TTX doit démarrer immédiatement.',
  } as L,
  vYellowTitle: { de: 'Gelb – Lückenhaft', en: 'Yellow – Patchy', fr: 'Jaune – Lacunaire' } as L,
  vYellowDesc: {
    de: 'Erste Strukturen vorhanden, aber nicht auditfest. Gezielte Befähigung und methodische Überarbeitung des Übungsprogramms empfehlenswert.',
    en: 'Initial structures exist but are not audit-proof. Targeted enablement and methodical rework of the exercise programme are advisable.',
    fr: 'Premières structures en place mais non auditables. Une montée en compétence ciblée et une refonte méthodique du programme d\'exercices sont recommandées.',
  } as L,
  vOrangeTitle: { de: 'Orange – Solide', en: 'Orange – Solid', fr: 'Orange – Solide' } as L,
  vOrangeDesc: {
    de: 'Gute Basis, aber Feinschliff nötig: Regulatorisches Mapping, KPIs und Integration in ISMS/BCM konsequent ausbauen.',
    en: 'Good foundation, but fine-tuning needed: consistently expand regulatory mapping, KPIs, and integration into ISMS/BCM.',
    fr: 'Bonne base, mais ajustements nécessaires : étendre systématiquement le mapping réglementaire, les KPI et l\'intégration au SMSI/PCA.',
  } as L,
  vGreenTitle: { de: 'Grün – Auditfähig', en: 'Green – Audit-ready', fr: 'Vert – Auditable' } as L,
  vGreenDesc: {
    de: 'Sehr gutes Reifeniveau. Fokus auf Skalierung, Train-the-Trainer und kontinuierliche Weiterentwicklung des Szenarien-Portfolios.',
    en: 'Very good maturity. Focus on scaling, train-the-trainer, and continuous evolution of the scenario portfolio.',
    fr: 'Très bonne maturité. Mettre l\'accent sur le passage à l\'échelle, le train-the-trainer et l\'évolution continue du portefeuille de scénarios.',
  } as L,
};

interface Dim {
  id: string;
  title: L;
  items: L[];
}

const DIMENSIONS: Dim[] = [
  {
    id: 'd1',
    title: { de: '1 · Governance & Verantwortlichkeiten', en: '1 · Governance & Accountability', fr: '1 · Gouvernance & responsabilités' },
    items: [
      { de: 'Für Tabletop Exercises ist eine klare, namentlich benannte Verantwortlichkeit definiert.', en: 'A clear, named accountability for tabletop exercises is defined.', fr: 'Une responsabilité claire et nommément attribuée existe pour les tabletops.' },
      { de: 'Die Geschäftsleitung ist formal in das Übungsprogramm eingebunden und informiert sich regelmäßig über Ergebnisse.', en: 'Senior management is formally involved and regularly briefed on results.', fr: 'La direction est formellement impliquée et informée régulièrement des résultats.' },
      { de: 'Es existiert eine verabschiedete Richtlinie, die Übungsziele, Frequenz und Rollen regelt.', en: 'An approved policy defines exercise goals, frequency, and roles.', fr: 'Une politique approuvée définit objectifs, fréquence et rôles des exercices.' },
    ],
  },
  {
    id: 'd2',
    title: { de: '2 · Szenarien & Bedrohungsrelevanz', en: '2 · Scenarios & Threat Relevance', fr: '2 · Scénarios & pertinence des menaces' },
    items: [
      { de: 'Übungsszenarien basieren auf einer aktuellen Bedrohungs- und Risikoanalyse der Organisation.', en: 'Exercise scenarios are based on a current threat and risk analysis.', fr: 'Les scénarios reposent sur une analyse actuelle des menaces et des risques.' },
      { de: 'Szenarien adressieren kritische Themen wie Ransomware, Drittparteienausfall und kombinierte Angriffe.', en: 'Scenarios cover critical topics such as ransomware, third-party outage, and blended attacks.', fr: 'Les scénarios couvrent rançongiciel, défaillance tiers et attaques combinées.' },
      { de: 'Szenarien werden regelmäßig aktualisiert und an neue Bedrohungslagen angepasst.', en: 'Scenarios are regularly updated to reflect new threat landscapes.', fr: 'Les scénarios sont mis à jour régulièrement selon l\'évolution des menaces.' },
    ],
  },
  {
    id: 'd3',
    title: { de: '3 · Durchführung & Frequenz', en: '3 · Execution & Frequency', fr: '3 · Exécution & fréquence' },
    items: [
      { de: 'Tabletop Exercises werden mindestens jährlich durchgeführt.', en: 'Tabletop exercises are conducted at least annually.', fr: 'Les tabletops sont organisés au moins une fois par an.' },
      { de: 'Die Übungen verwenden eine strukturierte Inject- und Eskalationsmechanik (kein reines Brainstorming).', en: 'Exercises use structured injects and escalation mechanics (not mere brainstorming).', fr: 'Les exercices utilisent injects et mécanique d\'escalade structurés (pas un simple brainstorming).' },
      { de: 'Moderation und Durchführung erfolgen durch ausgebildete interne oder externe Übungsleiter.', en: 'Facilitation is performed by trained internal or external exercise leads.', fr: 'L\'animation est assurée par des facilitateurs internes ou externes formés.' },
    ],
  },
  {
    id: 'd4',
    title: { de: '4 · Rollen & Management-Einbindung', en: '4 · Roles & Management Engagement', fr: '4 · Rôles & implication du management' },
    items: [
      { de: 'Alle relevanten Funktionen (Management, IT, Security, Legal, Kommunikation) sind in den Übungen vertreten.', en: 'All relevant functions (management, IT, security, legal, comms) are represented.', fr: 'Toutes les fonctions clés (direction, IT, sécurité, juridique, comm.) sont représentées.' },
      { de: 'Teilnehmer agieren rollenbasiert und treffen reale Entscheidungen unter Zeitdruck.', en: 'Participants act in role and make real decisions under time pressure.', fr: 'Les participants jouent leur rôle et prennent de vraies décisions sous contrainte de temps.' },
      { de: 'Externe Parteien (z. B. Dienstleister, Behörden) werden bei Bedarf simuliert oder einbezogen.', en: 'External parties (providers, authorities) are simulated or involved when needed.', fr: 'Les parties externes (prestataires, autorités) sont simulées ou impliquées si nécessaire.' },
    ],
  },
  {
    id: 'd5',
    title: { de: '5 · Dokumentation & Auditfähigkeit', en: '5 · Documentation & Audit Readiness', fr: '5 · Documentation & auditabilité' },
    items: [
      { de: 'Jede Übung wird nach standardisiertem Template dokumentiert (Ziele, Ablauf, Entscheidungen, Ergebnisse).', en: 'Each exercise is documented using a standardised template (objectives, flow, decisions, results).', fr: 'Chaque exercice est documenté avec un modèle standardisé (objectifs, déroulé, décisions, résultats).' },
      { de: 'Die Dokumentation genügt den Anforderungen interner und externer Auditoren.', en: 'Documentation meets internal and external auditor requirements.', fr: 'La documentation satisfait aux exigences des auditeurs internes et externes.' },
      { de: 'Übungsunterlagen werden revisionssicher archiviert und sind auf Anforderung abrufbar.', en: 'Exercise records are archived in an audit-proof manner and retrievable on demand.', fr: 'Les dossiers d\'exercice sont archivés de façon auditable et accessibles sur demande.' },
    ],
  },
  {
    id: 'd6',
    title: { de: '6 · Lessons Learned & Maßnahmenverfolgung', en: '6 · Lessons Learned & Follow-up', fr: '6 · Retours d\'expérience & suivi' },
    items: [
      { de: 'Nach jeder Übung findet ein strukturiertes Debriefing / Hot Wash statt.', en: 'A structured debrief / hot wash follows every exercise.', fr: 'Un débriefing structuré (hot wash) suit chaque exercice.' },
      { de: 'Identifizierte Schwachstellen werden als Maßnahmen mit Verantwortlichen und Fristen nachverfolgt.', en: 'Identified gaps are tracked as actions with owners and deadlines.', fr: 'Les écarts identifiés sont suivis comme actions avec responsables et délais.' },
      { de: 'Die Wirksamkeit umgesetzter Maßnahmen wird in Folgeübungen erneut geprüft.', en: 'Effectiveness of implemented measures is re-tested in follow-up exercises.', fr: 'L\'efficacité des mesures mises en œuvre est revérifiée lors d\'exercices ultérieurs.' },
    ],
  },
  {
    id: 'd7',
    title: { de: '7 · Integration in ISMS / BCM', en: '7 · Integration into ISMS / BCM', fr: '7 · Intégration au SMSI / PCA' },
    items: [
      { de: 'Das TTX-Programm ist fester Bestandteil des ISMS und/oder BCM.', en: 'The TTX programme is an integral part of ISMS and/or BCM.', fr: 'Le programme TTX fait partie intégrante du SMSI et/ou du PCA.' },
      { de: 'Übungsergebnisse fließen in Risikoanalyse und Business Impact Analyse ein.', en: 'Exercise results feed into risk analysis and business impact analysis.', fr: 'Les résultats alimentent l\'analyse de risques et le BIA.' },
      { de: 'Es existieren KPIs, mit denen der Reifegrad des Übungsprogramms gemessen wird.', en: 'KPIs exist to measure the maturity of the exercise programme.', fr: 'Des KPI mesurent la maturité du programme d\'exercices.' },
    ],
  },
  {
    id: 'd8',
    title: { de: '8 · Regulatorisches Mapping (DORA / NIS-2)', en: '8 · Regulatory Mapping (DORA / NIS-2)', fr: '8 · Mapping réglementaire (DORA / NIS-2)' },
    items: [
      { de: 'Die Übungspraxis ist explizit auf DORA Art. 24–25 bzw. NIS-2 Art. 21 gemappt.', en: 'Exercise practice is explicitly mapped to DORA Art. 24–25 and NIS-2 Art. 21.', fr: 'La pratique d\'exercice est explicitement mappée à DORA Art. 24–25 et NIS-2 Art. 21.' },
      { de: 'Übungsnachweise wurden bereits erfolgreich in einem Audit oder einer Prüfung vorgelegt.', en: 'Exercise evidence has already been successfully presented in an audit or review.', fr: 'Les preuves d\'exercice ont déjà été présentées avec succès lors d\'un audit ou d\'une revue.' },
      { de: 'Die Wirksamkeit der Cyber- und BCM-Maßnahmen ist nachweisbar (NIS-2 Art. 21 Abs. 2 lit. f).', en: 'Effectiveness of cyber and BCM measures is demonstrable (NIS-2 Art. 21(2)(f)).', fr: 'L\'efficacité des mesures cyber et PCA est démontrable (NIS-2 Art. 21(2)(f)).' },
    ],
  },
];

const MAX = DIMENSIONS.length * 3 * 3; // 72

function verdict(score: number, t: (l: L) => string) {
  if (score <= 24) return { key: 'red', title: t(I18N.vRedTitle), desc: t(I18N.vRedDesc), color: 'text-[hsl(0,75%,55%)]', border: 'border-[hsl(0,75%,55%)]', bg: 'bg-[hsl(0,75%,55%,0.1)]' };
  if (score <= 48) return { key: 'yellow', title: t(I18N.vYellowTitle), desc: t(I18N.vYellowDesc), color: 'text-[hsl(45,90%,55%)]', border: 'border-[hsl(45,90%,55%)]', bg: 'bg-[hsl(45,90%,55%,0.1)]' };
  if (score <= 60) return { key: 'orange', title: t(I18N.vOrangeTitle), desc: t(I18N.vOrangeDesc), color: 'text-[hsl(33,96%,49%)]', border: 'border-[hsl(33,96%,49%)]', bg: 'bg-[hsl(33,96%,49%,0.1)]' };
  return { key: 'green', title: t(I18N.vGreenTitle), desc: t(I18N.vGreenDesc), color: 'text-[hsl(122,39%,45%)]', border: 'border-[hsl(122,39%,45%)]', bg: 'bg-[hsl(122,39%,45%,0.1)]' };
}

export default function TtxReadinessAssessment() {
  const { language } = useLanguage();
  const lang = language as Lang;
  const t = (l: L) => l[lang] || l.en;

  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const totalAnswered = Object.keys(answers).length;
  const totalItems = DIMENSIONS.length * 3;
  const score = useMemo(() => Object.values(answers).reduce((a, b) => a + b, 0), [answers]);
  const allDone = totalAnswered === totalItems;

  const set = (key: string, val: number) => setAnswers(p => ({ ...p, [key]: val }));
  const reset = () => setAnswers({});

  const v = verdict(score, t);

  return (
    <div className="bg-card/40 rounded-xl p-4 md:p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left text-primary font-mono text-sm md:text-base hover:text-highlight transition-electric"
      >
        <span>{open ? t(I18N.toggleClose) : t(I18N.toggleOpen)}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-primary font-mono text-base md:text-lg mb-1">{t(I18N.title)}</h3>
            <p className="text-foreground/80 text-sm font-sans leading-relaxed">{t(I18N.intro)}</p>
          </div>

          {/* Score sticky-ish header */}
          <div className="flex items-center justify-between gap-3 bg-background/40 border border-primary/20 rounded-lg px-3 py-2">
            <div className="font-mono text-xs md:text-sm">
              <span className="text-muted-foreground">{t(I18N.total)}: </span>
              <span className="text-primary font-bold">{score}</span>
              <span className="text-muted-foreground"> / {MAX}</span>
              <span className="text-muted-foreground ml-2">({totalAnswered}/{totalItems})</span>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-electric"
            >
              <RotateCcw className="w-3 h-3" /> {t(I18N.reset)}
            </button>
          </div>

          {/* Scale legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-muted-foreground">
            <span>{t(I18N.scale0)}</span>
            <span>{t(I18N.scale1)}</span>
            <span>{t(I18N.scale2)}</span>
            <span>{t(I18N.scale3)}</span>
          </div>

          <StaggerReveal stagger={120}>
            {DIMENSIONS.map(dim => (
              <div key={dim.id} className="bg-background/30 border border-primary/15 rounded-lg p-3">
                <h4 className="text-highlight font-mono text-sm mb-3">{t(dim.title)}</h4>
                <div className="space-y-3">
                  {dim.items.map((item, i) => {
                    const key = `${dim.id}-${i}`;
                    const val = answers[key];
                    return (
                      <div key={key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <p className="text-foreground/85 text-sm font-sans leading-snug flex-1">{t(item)}</p>
                        <div className="flex gap-1 shrink-0">
                          {[0, 1, 2, 3].map(n => {
                            const sel = val === n;
                            return (
                              <button
                                key={n}
                                onClick={() => set(key, n)}
                                aria-label={`${t(item)} – ${n}`}
                                className={`w-8 h-8 rounded border-2 font-mono text-sm transition-electric ${
                                  sel
                                    ? 'border-highlight bg-highlight/15 text-highlight'
                                    : 'border-primary/40 text-foreground/70 hover:border-highlight hover:text-highlight'
                                }`}
                              >
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </StaggerReveal>

          {allDone && (
            <div className={`${v.bg} ${v.border} border-2 rounded-lg p-4`}>
              <div className={`font-mono font-bold text-base md:text-lg ${v.color}`}>{v.title} · {score}/{MAX}</div>
              <p className="text-foreground/85 text-sm font-sans leading-relaxed mt-2">{v.desc}</p>
            </div>
          )}

          <p className="text-muted-foreground text-[11px] italic">{t(I18N.disclaimer)}</p>
        </div>
      )}
    </div>
  );
}
