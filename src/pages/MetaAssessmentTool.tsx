import { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, ArrowLeft, Loader2, Sparkles, ShieldCheck, Network, Car,
  CreditCard, Factory, Server, RotateCcw, Lock, AlertTriangle, CheckCircle2,
  Download,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { SiteChrome } from '@/components/SiteChrome';
import { PasswordGate } from '@/components/PasswordGate';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STANDARD_PROFILES, getProfile, tr } from '@/data/metaAssessment';
import type {
  Lang, StandardProfile, IntakeField, IntakeAnswers,
  AssessmentResult, AssessedRequirement, ReqStatus,
} from '@/data/metaAssessment/types';

const ICONS: Record<string, LucideIcon> = {
  Network, Sparkles, Car, CreditCard, Factory, Server, ShieldCheck,
};

type Phase = 'standard' | 'intake' | 'analyzing' | 'report';

// ── small i18n helper for chrome strings ────────────────────────
function ui(lang: Lang) {
  const de = lang === 'de', fr = lang === 'fr';
  return {
    section: de ? '/ META-ASSESSMENT' : fr ? '/ MÉTA-ÉVALUATION' : '/ META ASSESSMENT',
    headline: de ? 'Universelles Assessment-Tool' : fr ? "Outil d'évaluation universel" : 'Universal assessment tool',
    sub: de ? 'Standard wählen → Intake → KI-Auswertung → Reporting.' : fr ? 'Standard → intake → IA → rapport.' : 'Pick a standard → intake → AI evaluation → reporting.',
    chooseStandard: de ? 'Standard wählen' : fr ? 'Choisir un standard' : 'Choose a standard',
    soon: de ? 'Bald' : fr ? 'Bientôt' : 'Soon',
    open: de ? 'Starten' : fr ? 'Démarrer' : 'Start',
    demo: de ? 'Demo' : fr ? 'Démo' : 'Demo',
    back: de ? 'Zurück' : fr ? 'Retour' : 'Back',
    next: de ? 'Weiter' : fr ? 'Suivant' : 'Next',
    run: de ? 'KI-Auswertung starten' : fr ? "Lancer l'évaluation IA" : 'Run AI evaluation',
    analyzing: de ? 'Die KI prüft jede Anforderung gegen die Nachweise …' : fr ? "L'IA évalue chaque exigence …" : 'The AI assesses each requirement against the evidence …',
    required: de ? 'Pflichtfeld' : fr ? 'Champ requis' : 'Required',
    restart: de ? 'Neu starten' : fr ? 'Recommencer' : 'Restart',
    readiness: de ? 'Reifegrad' : fr ? 'Maturité' : 'Readiness',
    checked: de ? 'Anforderungen geprüft' : fr ? 'exigences évaluées' : 'requirements assessed',
    passed: de ? 'erfüllt' : fr ? 'conformes' : 'passed',
    partial: de ? 'teilweise' : fr ? 'partiel' : 'partial',
    gaps: de ? 'Lücken' : fr ? 'lacunes' : 'gaps',
    risks: de ? 'Risiken' : fr ? 'Risques' : 'Risks',
    critical: de ? 'Kritisch' : fr ? 'Critiques' : 'Critical',
    findings: de ? 'Befunde je Anforderung' : fr ? 'Constats par exigence' : 'Findings per requirement',
    evidence: de ? 'Nachweis' : fr ? 'Preuve' : 'Evidence',
    gap: de ? 'Lücke' : fr ? 'Lacune' : 'Gap',
    measure: de ? 'Empfohlene Maßnahme' : fr ? 'Mesure recommandée' : 'Recommended measure',
    rationale: de ? 'Begründung' : fr ? 'Justification' : 'Rationale',
    riskLandscape: de ? 'Risikolandschaft' : fr ? 'Paysage des risques' : 'Risk landscape',
    exportJson: de ? 'Ergebnis exportieren (JSON)' : fr ? 'Exporter (JSON)' : 'Export result (JSON)',
    error: de ? 'Auswertung fehlgeschlagen. Bitte erneut versuchen.' : fr ? 'Échec. Réessayez.' : 'Evaluation failed. Please retry.',
    summary: de ? 'Zusammenfassung' : fr ? 'Synthèse' : 'Summary',
  };
}

const STATUS_STYLE: Record<ReqStatus, { cls: string; label: Record<Lang, string> }> = {
  pass: { cls: 'bg-green-500/10 text-green-400 border-green-500/20', label: { de: 'Erfüllt', en: 'Pass', fr: 'Conforme' } },
  partial: { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' } },
  fail: { cls: 'bg-destructive/10 text-destructive border-destructive/20', label: { de: 'Lücke', en: 'Gap', fr: 'Lacune' } },
};

// ── Standard selector ───────────────────────────────────────────
function StandardSelect({ lang, onPick, onDemo }: { lang: Lang; onPick: (p: StandardProfile) => void; onDemo: (p: StandardProfile) => void }) {
  const u = ui(lang);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STANDARD_PROFILES.map((p) => {
        const Icon = ICONS[p.icon] ?? ShieldCheck;
        return (
          <div
            key={p.id}
            className={`group text-left bg-background/40 border rounded-lg p-5 transition-colors ${
              p.available ? 'border-primary/15 hover:border-primary/40' : 'border-border/40 opacity-55'
            }`}
          >
            <button
              disabled={!p.available}
              onClick={() => p.available && onPick(p)}
              className={`text-left w-full ${p.available ? '' : 'cursor-not-allowed'}`}
            >
              <div className="flex items-start gap-3.5">
                <Icon size={20} className="mt-0.5 flex-shrink-0 text-primary opacity-75" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-mono text-[15px] text-foreground leading-tight">{p.name}</h3>
                    {!p.available && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">{u.soon}</span>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{tr(p.description, lang)}</p>
                </div>
              </div>
            </button>
            {p.available && (
              <div className="flex items-center gap-4 mt-3 pl-[34px]">
                <button onClick={() => onPick(p)} className="inline-flex items-center gap-1 font-mono text-xs text-primary group-hover:gap-2 transition-all">
                  {u.open}<ArrowRight size={13} />
                </button>
                {p.demoAnswers && (
                  <button onClick={() => onDemo(p)} className="inline-flex items-center gap-1 font-mono text-xs text-highlight hover:opacity-80 transition-opacity">
                    <Sparkles size={12} /> {u.demo}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field renderer ──────────────────────────────────────────────
function FieldView({ field, value, onChange, lang }: {
  field: IntakeField; value: string | string[] | undefined;
  onChange: (v: string | string[]) => void; lang: Lang;
}) {
  const label = tr(field.label, lang);
  const ph = tr(field.placeholder, lang);

  if (field.type === 'text') {
    return (
      <div>
        <FieldLabel field={field} lang={lang} />
        <input
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          placeholder={ph} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div>
        <FieldLabel field={field} lang={lang} />
        <textarea rows={4}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
          placeholder={ph} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  // single / multi
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (id: string) => {
    if (field.type === 'single') { onChange(id); return; }
    onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };
  return (
    <div>
      <FieldLabel field={field} lang={lang} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {field.options?.map((o) => {
          const sel = field.type === 'single' ? value === o.id : arr.includes(o.id);
          return (
            <button key={o.id} onClick={() => toggle(o.id)}
              className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 text-left transition-all ${
                sel ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              }`}>
              {o.icon && <span className="mt-0.5 flex-shrink-0">{o.icon}</span>}
              <div className="min-w-0 flex-1">
                <div className="font-medium break-words">{tr(o.label, lang)}</div>
                {o.desc && <div className="text-xs opacity-70 mt-0.5 break-words">{tr(o.desc, lang)}</div>}
              </div>
              {sel && <span className="ml-auto text-xs text-primary">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldLabel({ field, lang }: { field: IntakeField; lang: Lang }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {tr(field.label, lang)}{field.required && <span className="text-primary"> *</span>}
      {field.help && <span className="block normal-case font-normal text-[11px] mt-0.5 opacity-70">{tr(field.help, lang)}</span>}
    </label>
  );
}

// ── Intake wizard ───────────────────────────────────────────────
function IntakeWizard({ profile, lang, onFinish, onBack }: {
  profile: StandardProfile; lang: Lang;
  onFinish: (a: IntakeAnswers) => void; onBack: () => void;
}) {
  const u = ui(lang);
  const [sub, setSub] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const step = profile.intake[sub];
  const isLast = sub === profile.intake.length - 1;

  const setVal = useCallback((id: string, v: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }, []);

  const canNext = useMemo(() => step.fields.every((f) => {
    if (!f.required) return true;
    const v = answers[f.id];
    return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  }), [step, answers]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {profile.intake.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i < sub ? 'bg-primary' : i === sub ? 'bg-primary/60' : 'bg-secondary'}`} />
        ))}
        <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">{sub + 1}/{profile.intake.length}</span>
      </div>

      <div className="text-base font-bold text-foreground font-mono">{tr(step.title, lang)}</div>
      {step.subtitle && <div className="text-sm text-muted-foreground mt-0.5 mb-3">{tr(step.subtitle, lang)}</div>}
      {step.info && (
        <div className="border border-primary/20 bg-primary/10 rounded-lg px-4 py-3 text-sm text-foreground mb-4">💡 {tr(step.info, lang)}</div>
      )}

      <div className="space-y-5">
        {step.fields.map((f) => (
          <FieldView key={f.id} field={f} value={answers[f.id]} onChange={(v) => setVal(f.id, v)} lang={lang} />
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={() => (sub === 0 ? onBack() : setSub(sub - 1))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
          <ArrowLeft size={14} /> {u.back}
        </button>
        <button disabled={!canNext} onClick={() => (isLast ? onFinish(answers) : setSub(sub + 1))}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40">
          {isLast ? u.run : u.next} {isLast ? <Sparkles size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Report ──────────────────────────────────────────────────────
function Report({ profile, lang, result, answers, onRestart }: {
  profile: StandardProfile; lang: Lang; result: AssessmentResult;
  answers: IntakeAnswers; onRestart: () => void;
}) {
  const u = ui(lang);
  const reqMeta = useMemo(() => new Map(profile.requirements.map((r) => [r.id, r])), [profile]);

  const merged: AssessedRequirement[] = useMemo(() => result.requirements.map((r) => {
    const meta = reqMeta.get(r.id);
    return { ...r, article: meta?.article ?? '', name: meta ? tr(meta.name, lang) : r.id };
  }), [result, reqMeta, lang]);

  const pass = merged.filter((r) => r.status === 'pass').length;
  const partial = merged.filter((r) => r.status === 'partial').length;
  const fail = merged.filter((r) => r.status === 'fail').length;
  const pct = merged.length ? Math.round(((pass + partial * 0.5) / merged.length) * 100) : 0;
  const critRisks = result.risks.filter((r) => r.likelihood * r.impact >= 15);

  const entityName = (answers.entityName as string) || profile.name;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ profile: profile.id, entityName, answers, result }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.id}-assessment.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="bg-background/40 border-l-4 border-primary border border-primary/15 rounded-lg p-5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-mono">{profile.name} — {tr(profile.regulation, lang)}</div>
        <div className="text-lg font-bold text-foreground mt-0.5">{entityName}</div>
        {result.summary && <p className="text-sm text-foreground leading-relaxed mt-3">{result.summary}</p>}
      </div>

      {/* Readiness + stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="bg-background/40 border border-primary/15 rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold font-mono">{u.readiness}</div>
          <div className={`text-4xl font-bold font-mono mt-1 ${pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{pct}%</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{merged.length} {u.checked}</div>
        </div>
        {([[pass, u.passed, 'text-green-400'], [partial, u.partial, 'text-yellow-400'], [fail, u.gaps, 'text-destructive']] as [number, string, string][]).map(([n, l, c]) => (
          <div key={l} className="bg-background/40 border border-primary/15 rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${c}`}>{n}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Findings */}
      <div>
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-3">{u.findings}</h2>
        <div className="space-y-1.5">
          {merged.map((r) => {
            const st = STATUS_STYLE[r.status];
            return (
              <details key={r.id} className="bg-background/40 border border-primary/15 rounded-lg overflow-hidden">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30">
                  <span className="font-mono text-[11px] text-muted-foreground font-bold w-16 flex-shrink-0">{r.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground break-words">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.article}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${st.cls}`}>{st.label[lang]}</span>
                </summary>
                <div className="border-t border-border bg-secondary/20 px-4 py-3 text-sm space-y-2.5">
                  {r.evidence && <ReportField label={u.evidence}>{r.evidence}</ReportField>}
                  {r.gap && <div><span className="font-semibold text-destructive">{u.gap}: </span>{r.gap}</div>}
                  {r.rationale && <ReportField label={u.rationale}>{r.rationale}</ReportField>}
                  {r.measure && <div><span className="font-semibold text-primary">{u.measure}: </span>{r.measure}</div>}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Risks */}
      {result.risks.length > 0 && (
        <div>
          <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-3">
            {u.riskLandscape} {critRisks.length > 0 && <span className="text-destructive">· {critRisks.length} {u.critical}</span>}
          </h2>
          <div className="space-y-1.5">
            {[...result.risks].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact).map((r) => {
              const score = r.likelihood * r.impact;
              const cls = score >= 20 ? 'bg-destructive text-destructive-foreground' : score >= 15 ? 'bg-orange-500 text-white' : score >= 8 ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white';
              return (
                <div key={r.id} className="flex items-center gap-3 bg-background/40 border border-primary/15 rounded-lg px-3 py-2.5 text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground font-bold w-8 flex-shrink-0">{r.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground truncate" title={r.name}>{r.name}</div>
                    {r.component && <div className="text-xs text-muted-foreground truncate">{r.component}</div>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${cls}`}>{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button onClick={exportJson} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Download size={14} /> {u.exportJson}
        </button>
        <button onClick={onRestart} className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
          <RotateCcw size={14} /> {u.restart}
        </button>
      </div>
    </div>
  );
}

function ReportField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background/50 border border-border rounded-md px-3 py-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
const MetaAssessmentTool = () => {
  const { language } = useLanguage();
  const lang = language as Lang;
  const u = ui(lang);
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('standard');
  const [profile, setProfile] = useState<StandardProfile | null>(null);
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const buildIntakeText = useCallback((p: StandardProfile, a: IntakeAnswers): string => {
    const lines: string[] = [];
    for (const step of p.intake) {
      for (const f of step.fields) {
        const v = a[f.id];
        if (v === undefined || (Array.isArray(v) && v.length === 0) || v === '') continue;
        let rendered: string;
        if (Array.isArray(v)) {
          rendered = v.map((id) => tr(f.options?.find((o) => o.id === id)?.label, lang) || id).join(', ');
        } else if (f.options) {
          rendered = tr(f.options.find((o) => o.id === v)?.label, lang) || v;
        } else {
          rendered = String(v);
        }
        lines.push(`- ${tr(f.label, lang)}: ${rendered}`);
      }
    }
    return lines.join('\n') || '(no data provided)';
  }, [lang]);

  const runAssessment = useCallback(async (p: StandardProfile, a: IntakeAnswers) => {
    setPhase('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('meta-assessment-reasoning', {
        body: {
          standardName: p.name,
          regulation: tr(p.regulation, 'en'),
          language: lang,
          intakeText: buildIntakeText(p, a),
          requirements: p.requirements.map((r) => ({
            id: r.id, article: r.article, name: tr(r.name, lang),
            criteria: r.criteria?.map((c) => tr(c, lang)).join('; '),
          })),
        },
      });
      if (error || !data || data.error) throw new Error(data?.error || error?.message || 'failed');
      setResult(data as AssessmentResult);
      setPhase('report');
    } catch (e) {
      console.error('meta-assessment error', e);
      toast({ title: u.error, variant: 'destructive' });
      setPhase('intake');
    }
  }, [lang, buildIntakeText, toast, u.error]);

  const restart = useCallback(() => {
    setPhase('standard'); setProfile(null); setAnswers({}); setResult(null);
  }, []);

  return (
    <SiteChrome>
      <PasswordGate storageKey="assessment-tools" label="Meta Assessment">
        <PageMeta title="Universal Assessment Tool — Inside the Box" description="Universelles, KI-gestütztes Compliance-Assessment: Standard wählen, Intake, KI-Auswertung, Reporting." />
        <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <header className="mb-8">
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary mb-3">{u.section}</div>
            <h1 className="font-mono text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight">
              {phase === 'standard' ? u.headline : `${profile?.name} — ${tr(profile?.fullName, lang)}`}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">{u.sub}</p>
          </header>

          {/* Phase nav */}
          <div className="flex items-center gap-2 mb-8 font-mono text-[11px] uppercase tracking-wider">
            {(['standard', 'intake', 'analyzing', 'report'] as Phase[]).map((ph, i) => {
              const order = ['standard', 'intake', 'analyzing', 'report'];
              const active = order.indexOf(phase) >= i;
              const labels = { standard: u.chooseStandard, intake: 'Intake', analyzing: 'KI', report: 'Report' };
              return (
                <div key={ph} className="flex items-center gap-2">
                  {i > 0 && <span className="text-border">›</span>}
                  <span className={active ? 'text-primary' : 'text-muted-foreground/50'}>{labels[ph]}</span>
                </div>
              );
            })}
          </div>

          {phase === 'standard' && <StandardSelect lang={lang} onPick={(p) => { setProfile(p); setPhase('intake'); }} />}

          {phase === 'intake' && profile && (
            <IntakeWizard
              profile={profile} lang={lang}
              onBack={restart}
              onFinish={(a) => { setAnswers(a); runAssessment(profile, a); }}
            />
          )}

          {phase === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-5" />
              <p className="text-sm text-muted-foreground max-w-md">{u.analyzing}</p>
            </div>
          )}

          {phase === 'report' && profile && result && (
            <Report profile={profile} lang={lang} result={result} answers={answers} onRestart={restart} />
          )}
        </main>
      </PasswordGate>
    </SiteChrome>
  );
};

export default MetaAssessmentTool;
