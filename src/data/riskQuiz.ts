import { classify, CLASS_NAMES, referenceRisks } from './riskLife';
import { EV, MEAS, REASONS } from './riskLifeReference';

export interface QuizQuestion { question: string; options: string[]; correct: number; explanation: string }

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
function shuffle(correct: string, wrong: string[]): { options: string[]; correct: number } {
  const opts = [correct, ...wrong.slice(0, 3)].sort(() => Math.random() - 0.5);
  return { options: opts, correct: opts.indexOf(correct) };
}
const q = (question: string, correct: string, wrong: string[], explanation: string): QuizQuestion => ({ question, explanation, ...shuffle(correct, wrong) });
const DECIDERS = ['Risiko-Eigentümer', 'IT-Leitung', 'Geschäftsführung', 'CISO'];
const MONTHS = ['12 Monate', '6 Monate', '3 Monate', '1 Monat'];
const others = (all: string[], c: string) => all.filter(x => x !== c);

/** Difficulty 1-10. All answers derive from the process rules in riskLife.ts. */
const BANK: Record<number, (() => QuizQuestion)[]> = {
  1: [
    () => q('Wie wird der Risikowert berechnet?', 'Schadenshöhe × Wahrscheinlichkeit', ['Schadenshöhe + Wahrscheinlichkeit', 'Anzahl Maßnahmen × Schadenshöhe', 'Wahrscheinlichkeit ÷ Schadenshöhe'], 'Der Wert ergibt sich aus S × W, beide auf einer Skala von 1 bis 5.'),
    () => q('Welche Skala nutzen Schadenshöhe und Wahrscheinlichkeit?', '1 bis 5', ['1 bis 3', '0 bis 10', '1 bis 100'], 'Beide Achsen der Matrix reichen von 1 bis 5.'),
  ],
  2: [
    () => q('Wie viele Risikoklassen kennt der Prozess?', 'Vier', ['Drei', 'Fünf', 'Sechs'], `Die Klassen: ${CLASS_NAMES.join(', ')}.`),
    () => q('Welches Ereignis bedeutet „gelangt an Unbefugte"?', 'Abfluss nach außen', others(EV.map(e => e[0]), 'Abfluss nach außen'), 'Abfluss nach außen beschreibt Daten, die an Unbefugte gelangen.'),
  ],
  3: [
    () => { const s = pick([1, 2]), w = pick([1, 2]); const c = classify(s, w); return q(`S = ${s}, W = ${w}. Welche Klasse?`, c.name, others([...CLASS_NAMES], c.name), `Wert ${c.score} liegt unter 5 und ist damit ${c.name}.`); },
    () => q('Ab welchem Wert ist ein Risiko „extrem schädlich"?', 'Ab 16', ['Ab 10', 'Ab 20', 'Ab 25'], 'Werte von 16 bis 25 gelten als extrem schädlich.'),
  ],
  4: [
    () => q('„Menschen könnten zu Schaden kommen." Welche Schadenshöhe?', '5', ['3', '4', '2'], 'Gefahr für Menschen ist immer die höchste Schadensstufe 5.'),
    () => q('„Kommt etwa einmal im Jahr vor." Welche Wahrscheinlichkeit?', '4', ['2', '3', '5'], 'Einmal jährlich entspricht Stufe 4; mehrmals im Jahr wäre 5.'),
  ],
  5: [
    () => { const c = classify(3, 3); return q('S = 3, W = 3. Welche Klasse?', c.name, others([...CLASS_NAMES], c.name), 'Wert 9 liegt im Bereich 5–9: signifikant.'); },
    () => q('Wer entscheidet über ein „sehr hohes" Risiko?', 'IT-Leitung', others(DECIDERS, 'IT-Leitung'), 'Sehr hohe Risiken entscheidet die IT-Leitung, extreme die Geschäftsführung.'),
  ],
  6: [
    () => q('Wie oft wird ein „extrem schädliches" Risiko neu bewertet?', '3 Monate', others(MONTHS, '3 Monate'), 'Intervalle: 12 Monate (akzeptabel/signifikant), 6 (sehr hoch), 3 (extrem).'),
    () => q('Wer entscheidet über ein signifikantes Risiko?', 'Risiko-Eigentümer', others(DECIDERS, 'Risiko-Eigentümer'), 'Bis „signifikant" entscheidet der Risiko-Eigentümer selbst.'),
  ],
  7: [
    () => { const c = classify(5, 1); return q('S = 5, W = 1 – Wert 5. Welche Klasse gilt?', c.name, others([...CLASS_NAMES], c.name), 'Schutzregel: Bei Schadenshöhe 5 ist ein Risiko mindestens „sehr hoch", egal wie selten.'); },
    () => q('Was bewirkt die Schutzregel bei S = 5?', 'Mindestens Klasse „sehr hoch"', ['Sofortige Akzeptanz', 'Wahrscheinlichkeit wird auf 5 gesetzt', 'Risiko wird gelöscht'], 'Höchster Schaden darf nie als akzeptabel oder signifikant durchgehen.'),
  ],
  8: [
    () => { const r = pick(referenceRisks); const c = classify(r.s, r.w); return q(`${r.id} „${r.title}": S = ${r.s}, W = ${r.w}. Wer entscheidet?`, c.decider, others(DECIDERS, c.decider), `Wert ${c.score}${c.protected ? ' mit Schutzregel' : ''} → ${c.name} → ${c.decider}.`); },
    () => q('Welche Begründung ist für eine Risikoakzeptanz vorgesehen?', REASONS[0], ['Kein Budget vorhanden', 'Prüfung durch CISO entfällt', 'Risiko ist schwer verständlich'], `Vorgesehen sind: ${REASONS.join('; ')}.`),
  ],
  9: [
    () => { const r = pick(referenceRisks); const c = classify(r.s, r.w); const m = `${c.months} Monate`; return q(`${r.id} „${r.title}" (S ${r.s}, W ${r.w}): Intervall der Neubewertung?`, m, others(MONTHS, m), `${c.name} → alle ${c.months} Monate.`); },
    () => q('Wann darf über die Akzeptanz entschieden werden?', 'Wenn alle Maßnahmen erledigt sind', ['Sobald das Risiko erfasst ist', 'Vor der Bewertung', 'Nur bei Klasse akzeptabel'], 'Entscheidungsreif ist ein Risiko erst, wenn alle geplanten Maßnahmen umgesetzt sind.'),
  ],
  10: [
    () => { const c = classify(4, 4); return q('Ransomware Büro-IT: S = 4, W = 4. Klasse, Entscheider, Intervall?', `${c.name} · ${c.decider} · ${c.months} Monate`, ['sehr hoch · IT-Leitung · 6 Monate', 'signifikant · Risiko-Eigentümer · 12 Monate', 'extrem schädlich · CISO · 6 Monate'], 'Wert 16 → extrem schädlich → Geschäftsführung → alle 3 Monate.'); },
    () => { const c = classify(5, 2); return q('Manipulation Fertigungsdaten: S = 5, W = 2 (Wert 10). Was stimmt?', `${c.name}, Entscheidung: ${c.decider}`, ['signifikant, Entscheidung: Risiko-Eigentümer', 'extrem schädlich, Entscheidung: Geschäftsführung', 'akzeptabel, keine Entscheidung'], 'Wert 10 ist ohnehin sehr hoch; die IT-Leitung entscheidet.'); },
    () => q('Welche Maßnahme passt zu „Angriffe zu spät erkannt"?', 'Überwachung und Alarmierung', others([...MEAS], 'Überwachung und Alarmierung'), 'Späte Erkennung behebt man mit Überwachung und Alarmierung.'),
  ],
};

export const getRiskQuestion = (difficulty: number): QuizQuestion => pick(BANK[Math.min(10, Math.max(1, difficulty))])();
export const RISK_QUESTION_BANK = BANK;
