import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, RotateCcw, Check, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { ReadinessGauge, VerdictBreakdown } from '@/components/gapzero/ReadinessVisuals';
import {
  assess, emptyIntake, intakeComplete, tx, CONTROLS, MODULES, INDUSTRIES, REVENUE, RECORDS,
  DOWNTIME, INCIDENTS, LIMITS, type Intake, type Option, type ControlAnswer, type Weights,
} from '@/data/cyberInsurance';

const STORE = 'assistantzero-intake';

export default function AssistantZero() {
  const { language } = useLanguage();
  const lang = language === 'de' ? 'de' : 'en';
  const L = (de: string, en: string) => (lang === 'de' ? de : en);
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<Intake>(() => {
    try { return { ...emptyIntake(), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return emptyIntake(); }
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(intake)); }, [intake]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const set = <K extends keyof Intake>(k: K, v: Intake[K]) => setIntake((p) => ({ ...p, [k]: v }));
  const result = useMemo(() => assess(intake), [intake]);

  const steps = [
    { title: L('Unternehmen', 'Company'), ok: !!(intake.company.trim() && intake.industry && intake.revenue) },
    { title: L('Risikoprofil', 'Risk profile'), ok: !!(intake.records && intake.downtime && intake.incidents) },
    { title: L('Sicherheitsmaßnahmen', 'Security controls'), ok: CONTROLS.every((c) => intake.controls[c.id]) },
    { title: L('Deckungsbedarf', 'Coverage needs'), ok: !!(intake.limit && intake.modules.length) },
    { title: L('Entscheidungskriterien', 'Decision criteria'), ok: true },
    { title: L('Ergebnis', 'Result'), ok: true },
  ];

  const download = async () => {
    setBusy(true);
    try { const m = await import('@/utils/cyberInsuranceReportPdf'); await m.generateCyberInsuranceReport(intake, lang); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title="AssistantZero — Cyber-Versicherbarkeit" description={L('Geführte Bewertung von Interessenten für eine Cyberversicherung: Risikoprofil, Anforderungen, Marktvergleich und nachvollziehbares Ergebnis.', 'Guided assessment of cyber insurance prospects: risk profile, requirements, market comparison and a traceable result.')} />
      <header className="border-b border-primary/15">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="font-mono text-xs tracking-[0.25em] uppercase text-primary">AssistantZero</Link>
          {step > 0 && <span className="font-mono text-[11px] text-muted-foreground">{Math.min(step, 6)} / 6</span>}
        </div>
        {step > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-1.5">
            {steps.map((s, i) => (
              <button key={s.title} onClick={() => setStep(i + 1)} className={`h-1 flex-1 rounded-full ${i + 1 === step ? 'bg-primary' : s.ok && i < 5 ? 'bg-highlight/60' : 'bg-secondary'}`} aria-label={s.title} />
            ))}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {step === 0 && (
          <section className="space-y-8 py-6">
            <div>
              <p className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-3">{L('Für Makler und Berater', 'For brokers and advisors')}</p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{L('Ist der Interessent cyber-versicherbar – und wo?', 'Is the prospect cyber-insurable — and where?')}</h1>
              <p className="text-muted-foreground mt-4 max-w-2xl">{L('In fünf kurzen Schritten: Risikoprofil, Sicherheitsmaßnahmen und Deckungsbedarf erfassen. Danach folgen Versicherbarkeit, Auflagen und ein Vergleich mit typischen Marktsegmenten – mit offengelegten Kriterien.', 'Five short steps: capture risk profile, security controls and coverage needs. You then get insurability, conditions and a comparison with typical market segments — with every criterion disclosed.')}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[[L('Risiko- und Anforderungsprofil', 'Risk & requirements profile'), '01'], [L('Marktvergleich nach Segmenten', 'Market comparison by segment'), '02'], [L('Ergebnis mit Auflagen und PDF', 'Result with conditions and PDF'), '03']].map(([t, n]) => (
                <div key={n} className="bg-background/40 border border-primary/15 rounded-lg p-4">
                  <div className="font-mono text-primary text-sm mb-2">{n}</div><div className="text-sm">{t}</div>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={() => setStep(1)}>{L('Bewertung starten', 'Start assessment')} <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </section>
        )}

        {step === 1 && (
          <Screen title={steps[0].title} lead={L('Wer soll versichert werden?', 'Who is to be insured?')}>
            <Label text={L('Name des Interessenten', 'Prospect name')} />
            <input value={intake.company} onChange={(e) => set('company', e.target.value)} maxLength={120} className="w-full rounded-lg border border-primary/25 bg-background/40 px-4 py-3 text-base outline-none focus:border-primary" placeholder={L('z. B. Muster GmbH', 'e.g. Example Ltd')} />
            <Label text={L('Branche', 'Industry')} />
            <Choice options={INDUSTRIES} value={intake.industry} onChange={(v) => set('industry', v)} lang={lang} />
            <Label text={L('Jahresumsatz', 'Annual revenue')} />
            <Choice options={REVENUE} value={intake.revenue} onChange={(v) => set('revenue', v)} lang={lang} cols={4} />
          </Screen>
        )}

        {step === 2 && (
          <Screen title={steps[1].title} lead={L('Wie groß ist die Angriffsfläche?', 'How large is the exposure?')}>
            <Label text={L('Gespeicherte personenbezogene Datensätze', 'Personal data records held')} />
            <Choice options={RECORDS} value={intake.records} onChange={(v) => set('records', v)} lang={lang} cols={4} />
            <Label text={L('Wie lange geht es ohne IT?', 'How long can operations run without IT?')} />
            <Choice options={DOWNTIME} value={intake.downtime} onChange={(v) => set('downtime', v)} lang={lang} />
            <Label text={L('Cyber-Vorfälle in den letzten 3 Jahren', 'Cyber incidents in the last 3 years')} />
            <Choice options={INCIDENTS} value={intake.incidents} onChange={(v) => set('incidents', v)} lang={lang} cols={3} />
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Toggle label={L('Akzeptiert Kartenzahlungen', 'Accepts card payments')} value={intake.cardData} onChange={(v) => set('cardData', v)} />
              <Toggle label={L('Geschäft oder Kunden in den USA', 'Business or customers in the US')} value={intake.usExposure} onChange={(v) => set('usExposure', v)} />
            </div>
          </Screen>
        )}

        {step === 3 && (
          <Screen title={steps[2].title} lead={L('Was ist umgesetzt? Mit * markierte Maßnahmen verlangen fast alle Versicherer.', 'What is in place? Controls marked * are required by almost every insurer.')}>
            <div className="space-y-2">
              {CONTROLS.map((c) => (
                <div key={c.id} className="bg-background/40 border border-primary/15 rounded-lg p-3 sm:flex sm:items-center sm:gap-4">
                  <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                    <div className="text-sm font-medium">{tx(c.label, lang)}{c.knockout && <span className="text-primary"> *</span>}</div>
                    <div className="text-xs text-muted-foreground">{tx(c.hint, lang)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0">
                    {(['yes', 'partial', 'no'] as ControlAnswer[]).map((a) => {
                      const on = intake.controls[c.id] === a;
                      return (
                        <button key={a} onClick={() => set('controls', { ...intake.controls, [c.id]: a })}
                          className={`rounded-md border px-2 py-2 text-xs font-mono transition-colors ${on ? (a === 'yes' ? 'border-green-500 bg-green-500/15 text-green-400' : a === 'partial' ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' : 'border-destructive bg-destructive/15 text-destructive') : 'border-primary/15 text-muted-foreground hover:border-primary/40'}`}>
                          {a === 'yes' ? L('Ja', 'Yes') : a === 'partial' ? L('Teilweise', 'Partial') : L('Nein', 'No')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Screen>
        )}

        {step === 4 && (
          <Screen title={steps[3].title} lead={L('Was soll die Police leisten?', 'What should the policy cover?')}>
            <Label text={L('Gewünschte Versicherungssumme', 'Desired limit')} />
            <Choice options={LIMITS} value={intake.limit} onChange={(v) => set('limit', v)} lang={lang} cols={4} />
            <Label text={L('Benötigte Bausteine', 'Required modules')} />
            <div className="grid sm:grid-cols-2 gap-2">
              {MODULES.map((m) => {
                const on = intake.modules.includes(m.id);
                return (
                  <button key={m.id} onClick={() => set('modules', on ? intake.modules.filter((x) => x !== m.id) : [...intake.modules, m.id])}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm ${on ? 'border-primary bg-primary/10' : 'border-primary/15 bg-background/40 hover:border-primary/40'}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded border ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/30'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                    {tx(m.label, lang)}
                  </button>
                );
              })}
            </div>
          </Screen>
        )}

        {step === 5 && (
          <Screen title={steps[4].title} lead={L('Wie wichtig ist dem Kunden was? Diese Gewichte bestimmen den Marktvergleich.', 'What matters most to the client? These weights drive the market comparison.')}>
            {([['coverage', L('Breite der Deckung', 'Breadth of cover')], ['price', L('Günstiger Preis', 'Low price')], ['service', L('Service und Schadenhilfe', 'Service and claims help')], ['limit', L('Hohe Versicherungssumme', 'High limit')]] as [keyof Weights, string][]).map(([k, lbl]) => (
              <div key={k} className="bg-background/40 border border-primary/15 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-3"><span>{lbl}</span><span className="font-mono text-primary">{intake.weights[k]} / 5</span></div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => set('weights', { ...intake.weights, [k]: n })} aria-label={`${lbl} ${n}`}
                      className={`h-9 rounded-md border font-mono text-xs ${n <= intake.weights[k] ? 'border-primary bg-primary/20 text-primary' : 'border-primary/15 text-muted-foreground'}`}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </Screen>
        )}

        {step === 6 && (intakeComplete(intake) ? <Results intake={intake} r={result} lang={lang} onPdf={download} busy={busy} /> : (
          <Screen title={steps[5].title} lead={L('Es fehlen noch Angaben:', 'Some answers are still missing:')}>
            {steps.slice(0, 4).filter((s) => !s.ok).map((s) => <button key={s.title} onClick={() => setStep(steps.indexOf(s) + 1)} className="block text-primary underline text-sm">{s.title}</button>)}
          </Screen>
        ))}
      </main>

      {step > 0 && (
        <footer className="fixed bottom-0 inset-x-0 border-t border-primary/15 bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft className="mr-1 h-4 w-4" />{L('Zurück', 'Back')}</Button>
            <Button variant="ghost" size="sm" onClick={() => { setIntake(emptyIntake()); setStep(0); }}><RotateCcw className="mr-1 h-4 w-4" />{L('Neu', 'New')}</Button>
            {step < 6 && <Button onClick={() => setStep(step + 1)} disabled={step <= 4 && !steps[step - 1].ok}>{step === 5 ? L('Auswerten', 'Evaluate') : L('Weiter', 'Next')}<ArrowRight className="ml-1 h-4 w-4" /></Button>}
            {step === 6 && <span className="w-20" />}
          </div>
        </footer>
      )}
    </div>
  );
}

function Screen({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-highlight">{title}</p>
      <h2 className="text-2xl sm:text-3xl font-bold border-l-4 border-primary pl-4">{lead}</h2>
      <div className="space-y-3 pt-2">{children}</div>
    </section>
  );
}

const Label = ({ text }: { text: string }) => <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground pt-3">{text}</div>;

function Choice({ options, value, onChange, lang, cols = 2 }: { options: Option[]; value: string; onChange: (v: string) => void; lang: string; cols?: number }) {
  const grid = cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={`grid gap-2 ${grid}`}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${value === o.value ? 'border-primary bg-primary/10 text-foreground' : 'border-primary/15 bg-background/40 text-muted-foreground hover:border-primary/40'}`}>
          {tx(o.label, lang)}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${value ? 'border-primary bg-primary/10' : 'border-primary/15 bg-background/40'}`}>
      {label}<span className="font-mono text-xs text-primary">{value ? 'JA / YES' : 'NEIN / NO'}</span>
    </button>
  );
}

function Results({ intake, r, lang, onPdf, busy }: { intake: Intake; r: ReturnType<typeof assess>; lang: string; onPdf: () => void; busy: boolean }) {
  const L = (de: string, en: string) => (lang === 'de' ? de : en);
  const tone = r.verdict === 'pass' ? 'text-green-400 border-green-500/40' : r.verdict === 'partial' ? 'text-yellow-400 border-yellow-500/40' : 'text-destructive border-destructive/40';
  const panel = 'bg-background/40 border border-primary/15 rounded-lg p-5';
  const h = 'font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-4';
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-highlight">{L('Ergebnis', 'Result')}</p>
          <h2 className="text-2xl sm:text-3xl font-bold">{intake.company}</h2>
        </div>
        <Button onClick={onPdf} disabled={busy}><Download className="mr-2 h-4 w-4" />{busy ? '…' : L('PDF-Bericht', 'PDF report')}</Button>
      </div>

      <div className={`rounded-lg border-2 px-5 py-4 ${tone}`}>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">{L('Gesamturteil', 'Overall opinion')}</div>
        <div className="text-xl font-bold">{tx(r.verdictLabel, lang)}</div>
      </div>

      <div className={`${panel} grid sm:grid-cols-3 gap-6 items-center`}>
        <ReadinessGauge pct={r.insurability} label={L('Versicherbarkeit', 'Insurability')} sub="0–100" />
        <ReadinessGauge pct={r.maturity} label={L('Sicherheitsniveau', 'Security maturity')} />
        <VerdictBreakdown counts={r.controlCounts} labels={{ pass: L('Umgesetzt', 'In place'), partial: L('Teilweise', 'Partial'), fail: L('Fehlt', 'Missing') }} />
      </div>

      <div className={panel}>
        <h3 className={h}>{L('Treiber der Risiko-Exposition', 'Exposure drivers')} · {r.exposure} %</h3>
        <div className="space-y-2.5">
          {r.exposureDrivers.map((d) => (
            <div key={d.label.en} className="flex items-center gap-3">
              <span className="text-xs w-40 shrink-0 truncate">{tx(d.label, lang)}</span>
              <span className="h-2 flex-1 rounded-full bg-secondary overflow-hidden"><span className={`block h-full ${d.value >= 70 ? 'bg-destructive' : d.value >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${d.value}%` }} /></span>
              <span className="font-mono text-xs w-8 text-right">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {r.conditions.length > 0 && (
        <div className={panel}>
          <h3 className={h}>{L('Auflagen', 'Conditions')} · {r.conditions.length}</h3>
          <ul className="space-y-2">
            {r.conditions.map((c) => (
              <li key={c.controlId} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${c.timing === 'binding' ? 'bg-destructive/15 text-destructive' : 'bg-yellow-500/15 text-yellow-400'}`}>{c.timing === 'binding' ? L('vor Bindung', 'before binding') : L('90 Tage', '90 days')}</span>
                <span>{tx(c.label, lang)} {c.answer === 'partial' ? L('vollständig umsetzen', '— complete') : L('einführen', '— implement')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={panel}>
        <h3 className={h}>{L('Marktvergleich', 'Market comparison')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{L('Typische Marktsegmente, keine einzelnen Versicherer. Erst Ausschlusskriterien, dann gewichtete Eignung nach den Kriterien des Kunden. Preise nur relativ.', 'Typical market segments, not individual insurers. Knock-outs first, then weighted fit by the client\'s criteria. Prices relative only.')}</p>
        <div className="space-y-3">
          {r.segments.map((s) => (
            <details key={s.segment.id} open={s === r.recommended} className={`rounded-lg border ${s === r.recommended ? 'border-primary/60' : 'border-primary/15'} p-4`}>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  {s.eligible ? <Check className="h-4 w-4 text-green-400 shrink-0" /> : <X className="h-4 w-4 text-destructive shrink-0" />}
                  <span className="text-sm font-medium flex-1 min-w-0">{tx(s.segment.name, lang)}{s === r.recommended && <span className="ml-2 font-mono text-[10px] uppercase text-primary">{L('Empfehlung', 'Recommended')}</span>}</span>
                  <span className={`font-mono text-sm font-bold ${s.eligible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{s.fit} %</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden"><div className={`h-full ${s.eligible ? 'bg-primary' : 'bg-muted-foreground/40'}`} style={{ width: `${s.fit}%` }} /></div>
              </summary>
              <p className="text-xs text-muted-foreground mt-3">{tx(s.segment.description, lang)}</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {s.criteria.map((c) => (
                  <div key={c.key} className="text-xs">
                    <div className="flex justify-between mb-1"><span>{tx(c.label, lang)} <span className="text-muted-foreground">×{c.weight}</span></span><span className="font-mono">{c.score}</span></div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-highlight" style={{ width: `${c.score}%` }} /></div>
                  </div>
                ))}
              </div>
              {s.knockouts.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {s.knockouts.map((k) => <li key={k.en} className="flex gap-2 text-xs text-destructive"><Minus className="h-3.5 w-3.5 shrink-0 mt-0.5" />{tx(k, lang)}</li>)}
                </ul>
              )}
            </details>
          ))}
        </div>
      </div>

      <div className={`${panel} text-xs text-muted-foreground space-y-1`}>
        <h3 className={h}>{L('So wird gerechnet', 'How it is calculated')}</h3>
        <p>{L('Sicherheitsniveau: gewichteter Anteil umgesetzter Maßnahmen (Ja 1, Teilweise 0,5, Nein 0).', 'Security maturity: weighted share of controls in place (yes 1, partial 0.5, no 0).')}</p>
        <p>{L('Versicherbarkeit = 60 % Sicherheitsniveau + 40 % (100 − Exposition).', 'Insurability = 60% security maturity + 40% (100 − exposure).')}</p>
        <p>{L('Ab 70 und alle Pflichtmaßnahmen umgesetzt: versicherbar. Unter 45 oder zwei fehlende Pflichtmaßnahmen: kaum versicherbar. Sonst: mit Auflagen.', '70+ with all mandatory controls: insurable. Below 45 or two missing mandatory controls: hard to insure. Otherwise: with conditions.')}</p>
        <p>{L('Vorprüfung auf Basis von Selbstauskünften, kein Angebot.', 'Pre-assessment based on self-declared data, not a quote.')}</p>
      </div>
    </section>
  );
}
