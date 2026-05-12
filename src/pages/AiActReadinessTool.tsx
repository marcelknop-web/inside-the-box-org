/**
 * EU AI Act Readiness Assessment Tool — main page
 * Adapted from Nis2ComplianceTool, leaner footprint, trilingual via i18n keys.
 */
import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, Loader2, Sparkles, FileText } from 'lucide-react';
import { generateAiActReport } from '@/utils/aiActReportPdf';
import { AiActAuditCharts } from '@/components/AiActAuditCharts';
import { runAiActQualityCheck } from '@/utils/aiActQualityCheck';
import { applyAiActAuditFixes } from '@/utils/aiActAuditFixes';
import { PageMeta } from '@/components/PageMeta';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import Typewriter from '@/components/Typewriter';
import { StaggerReveal } from '@/components/StaggerReveal';
import {
  getRoleOpts, getAnnexIIIOpts, getProhibitedOpts, getAiActMeasures, getAiActMeasureCats,
  getAiActAttachTypes, AI_ACT_RISKS, AI_ACT_RISKS_EN, AI_ACT_RISKS_FR,
  AI_ACT_REQS, AI_ACT_REQS_EN, AI_ACT_REQS_FR,
  RISK_CATEGORIES, riskId, classifyAiSystem, CLASS_META,
  type AiActRisk, type AiActReq, type AiActIntakeData, type MeasureEntry, EMPTY_INTAKE,
  AI_ACT_DEMO_SCENARIOS,
} from '@/data/aiActData';

// ── Helpers ─────────────────────────────────────────────────────

function riskLevel(l: number, i: number, t: (k: string) => string) {
  const s = l * i;
  if (s >= 20) return { label: t('aiAct.critical'), cls: 'bg-destructive text-destructive-foreground' };
  if (s >= 13) return { label: t('aiAct.high'), cls: 'bg-orange-500 text-white' };
  if (s >= 6) return { label: t('aiAct.medium'), cls: 'bg-yellow-500 text-black' };
  return { label: t('aiAct.low'), cls: 'bg-green-500 text-white' };
}

const StatusBadge = memo(({ status, t }: { status: string; t: (k: string) => string }) => {
  if (status === 'pass') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">{t('aiAct.statusPass')}</span>;
  if (status === 'partial') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{t('aiAct.statusPartial')}</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">{t('aiAct.statusFail')}</span>;
});

function InfoBox({ icon = '💡', title, children, color = 'blue' }: { icon?: string; title?: string; children: React.ReactNode; color?: 'blue' | 'amber' | 'green' | 'red' }) {
  const colors = { blue: 'bg-primary/10 border-primary/20', amber: 'bg-warning/10 border-warning/20', green: 'bg-green-500/10 border-green-500/20', red: 'bg-destructive/10 border-destructive/20' };
  return (
    <div className={`border rounded-lg px-3 sm:px-4 py-3 text-sm text-foreground ${colors[color]} break-words overflow-hidden`}>
      {title ? <div className="font-semibold mb-1">{icon} {title}</div> : <span className="font-semibold">{icon} </span>}
      <span className="break-words">{children}</span>
    </div>
  );
}

function SubStepHeader({ current, total, title, subtitle }: { current: number; total: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i < current ? 'bg-primary' : i === current ? 'bg-primary/60' : 'bg-secondary'}`} />
        ))}
        <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">{current + 1}/{total}</span>
      </div>
      <div className="text-base font-bold text-foreground">
        <Typewriter text={title} mode="typewriter" charDelay={8} cursor={false} />
      </div>
      {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
  );
}

const Chip = memo(({ label, selected, onClick, icon, desc }: { label: string; selected: boolean; onClick: () => void; icon?: string; desc?: string }) => (
  <button onClick={onClick} className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 text-left transition-all min-w-0 overflow-hidden ${selected ? 'border-primary bg-primary/10 text-foreground shadow-sm' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary'}`}>
    {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
    <div className="min-w-0 flex-1">
      <div className="font-medium break-words">{label}</div>
      {desc && <div className="text-xs opacity-70 mt-0.5 break-words">{desc}</div>}
    </div>
    {selected && <span className="ml-auto flex-shrink-0 text-xs text-primary">✓</span>}
  </button>
));

// ── Wizard ──────────────────────────────────────────────────────
const TOTAL = 7;

function IntakeWizard({ onFinish }: { onFinish: (d: AiActIntakeData) => void }) {
  const { t, language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const [sub, setSub] = useState(0);
  const [d, setD] = useState<AiActIntakeData>(EMPTY_INTAKE);

  const roles = useMemo(() => getRoleOpts(t, lang), [t, lang]);
  const annexIII = useMemo(() => getAnnexIIIOpts(lang), [lang]);
  const prohibited = useMemo(() => getProhibitedOpts(lang), [lang]);
  const measures = useMemo(() => getAiActMeasures(lang), [lang]);
  const cats = useMemo(() => getAiActMeasureCats(lang), [lang]);
  const attachTypes = useMemo(() => getAiActAttachTypes(lang), [lang]);

  const setField = useCallback((f: keyof AiActIntakeData, v: unknown) => setD(p => ({ ...p, [f]: v })), []);
  const toggleArr = useCallback((f: keyof AiActIntakeData, v: string) => {
    setD(p => { const a = p[f] as string[]; return { ...p, [f]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] }; });
  }, []);

  const canNext = useMemo(() => [
    d.entityName.trim().length > 0 && d.role.length > 0,
    d.systemName.trim().length > 0 && d.systemPurpose.trim().length > 0,
    true, // Annex III + prohibited (optional)
    true, // GPAI (optional)
    true, // measures (optional)
    true, // files (optional)
    true, // summary
  ], [d]);

  const scenarioRef = useRef(Math.floor(Math.random() * AI_ACT_DEMO_SCENARIOS.length));
  const handleDemo = useCallback(() => {
    if (sub === 0) scenarioRef.current = (scenarioRef.current + 1) % AI_ACT_DEMO_SCENARIOS.length;
    const s = AI_ACT_DEMO_SCENARIOS[scenarioRef.current];
    switch (sub) {
      case 0: setD(p => ({ ...p, entityName: s.entity.name, role: s.entity.role })); break;
      case 1: setD(p => ({ ...p, systemName: s.systemName, systemPurpose: s.systemPurpose, domain: s.domain })); break;
      case 2: setD(p => ({ ...p, annexIII: s.annexIII, prohibitedFlags: s.prohibitedFlags, realtimeBiometricsPublic: s.realtimeBiometricsPublic, affectsFundamentalRights: s.affectsFundamentalRights })); break;
      case 3: setD(p => ({ ...p, isGpai: s.isGpai, flopsThreshold: s.flopsThreshold })); break;
      case 4: setD(p => ({ ...p, measures: s.measures })); break;
      case 5: setD(p => ({ ...p, files: s.files, knownIssues: s.knownIssues })); break;
    }
  }, [sub]);

  const liveClass = useMemo(() => classifyAiSystem(d), [d]);

  let content: React.ReactNode;
  switch (sub) {
    case 0:
      content = (
        <StaggerReveal resetKey="aia-0" stagger={250}>
          <SubStepHeader current={0} total={TOTAL} title={t('aiAct.step0Title')} subtitle={t('aiAct.step0Sub')} />
          <InfoBox color="blue">{t('aiAct.step0Info')}</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.entityName')}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('aiAct.entityNamePh')} value={d.entityName} onChange={e => setField('entityName', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.roleSel')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map(r => <Chip key={r.id} label={r.label} icon={r.icon} desc={r.desc} selected={d.role.includes(r.id)} onClick={() => toggleArr('role', r.id)} />)}
            </div>
          </div>
        </StaggerReveal>
      );
      break;
    case 1:
      content = (
        <StaggerReveal resetKey="aia-1" stagger={250}>
          <SubStepHeader current={1} total={TOTAL} title={t('aiAct.step1Title')} subtitle={t('aiAct.step1Sub')} />
          <InfoBox color="blue">{t('aiAct.step1Info')}</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.systemName')}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('aiAct.systemNamePh')} value={d.systemName} onChange={e => setField('systemName', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.purpose')}</label>
            <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder={t('aiAct.purposePh')} value={d.systemPurpose} onChange={e => setField('systemPurpose', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.domain')}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('aiAct.domainPh')} value={d.domain} onChange={e => setField('domain', e.target.value)} />
          </div>
        </StaggerReveal>
      );
      break;
    case 2:
      content = (
        <StaggerReveal resetKey="aia-2" stagger={250}>
          <SubStepHeader current={2} total={TOTAL} title={t('aiAct.step2Title')} subtitle={t('aiAct.step2Sub')} />
          <InfoBox color="amber">{t('aiAct.step2Info')}</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.annexIIITitle')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {annexIII.map(o => <Chip key={o.id} label={o.label} icon={o.icon} selected={d.annexIII.includes(o.id)} onClick={() => toggleArr('annexIII', o.id)} />)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('aiAct.prohibitedTitle')}</label>
            <div className="space-y-1.5">
              {prohibited.map(p => (
                <label key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${d.prohibitedFlags.includes(p.id) ? 'border-destructive bg-destructive/10' : 'border-border bg-card hover:border-destructive/40'}`}>
                  <input type="checkbox" className="w-4 h-4 rounded accent-destructive" checked={d.prohibitedFlags.includes(p.id)} onChange={() => toggleArr('prohibitedFlags', p.id)} />
                  <span className="text-sm text-foreground flex-1">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={d.realtimeBiometricsPublic} onChange={e => setField('realtimeBiometricsPublic', e.target.checked)} />
              <span className="text-sm text-foreground">{t('aiAct.realtimeBio')}</span>
            </label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={d.affectsFundamentalRights} onChange={e => setField('affectsFundamentalRights', e.target.checked)} />
              <span className="text-sm text-foreground">{t('aiAct.fundamentalRights')}</span>
            </label>
          </div>
        </StaggerReveal>
      );
      break;
    case 3:
      content = (
        <StaggerReveal resetKey="aia-3" stagger={250}>
          <SubStepHeader current={3} total={TOTAL} title={t('aiAct.step3Title')} subtitle={t('aiAct.step3Sub')} />
          <InfoBox color="blue">{t('aiAct.step3Info')}</InfoBox>
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={d.isGpai} onChange={e => setField('isGpai', e.target.checked)} />
            <span className="text-sm text-foreground">{t('aiAct.isGpai')}</span>
          </label>
          {d.isGpai && (
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-orange-500/30 bg-orange-500/10 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-orange-500" checked={d.flopsThreshold} onChange={e => setField('flopsThreshold', e.target.checked)} />
              <span className="text-sm text-foreground">{t('aiAct.flopsThreshold')}</span>
            </label>
          )}
          <div className={`p-3 rounded-lg border-2 ${CLASS_META[liveClass].color}`}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1">{t('aiAct.liveClassification')}</div>
            <div className="text-sm font-bold">{CLASS_META[liveClass][lang]}</div>
          </div>
        </StaggerReveal>
      );
      break;
    case 4: {
      const toggle = (id: string) => setD(p => {
        const e = p.measures[id];
        if (e) { const { [id]: _x, ...rest } = p.measures; return { ...p, measures: rest }; }
        return { ...p, measures: { ...p.measures, [id]: { active: true, documented: false, audited: false, certified: false } } };
      });
      const setProp = (id: string, k: 'documented' | 'audited' | 'certified', v: boolean) =>
        setD(p => { const e = p.measures[id]; if (!e) return p; return { ...p, measures: { ...p.measures, [id]: { ...e, [k]: v } } }; });
      content = (
        <StaggerReveal resetKey="aia-4" stagger={200}>
          <SubStepHeader current={4} total={TOTAL} title={t('aiAct.step4Title')} subtitle={t('aiAct.step4Sub')} />
          <InfoBox color="blue">{t('aiAct.step4Info')}</InfoBox>
          {cats.map(cat => (
            <div key={cat}>
              <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{cat}</div>
              <div className="space-y-1.5">
                {measures.filter(m => m.cat === cat).map(m => {
                  const e = d.measures[m.id]; const active = !!e;
                  return (
                    <div key={m.id} className={`border rounded-lg ${active ? 'border-green-500/30 bg-green-500/10' : 'border-border bg-card'}`}>
                      <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded accent-green-600" checked={active} onChange={() => toggle(m.id)} />
                        <span className="text-sm text-foreground flex-1">{m.label}</span>
                      </label>
                      {active && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 sm:px-10 pb-2.5 -mt-1">
                          {(['documented', 'audited', 'certified'] as const).map(k => (
                            <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary" checked={e[k]} onChange={ev => setProp(m.id, k, ev.target.checked)} />
                              <span className="text-xs text-muted-foreground">{t(`aiAct.${k}`)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </StaggerReveal>
      );
      break;
    }
    case 5:
      content = (
        <StaggerReveal resetKey="aia-5" stagger={250}>
          <SubStepHeader current={5} total={TOTAL} title={t('aiAct.step5Title')} subtitle={t('aiAct.step5Sub')} />
          <InfoBox color="blue">{t('aiAct.step5Info')}</InfoBox>
          <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder={t('aiAct.knownIssuesPh')} value={d.knownIssues} onChange={e => setField('knownIssues', e.target.value)} />
          <div className="text-xs text-muted-foreground">{t('aiAct.fileNote')}</div>
        </StaggerReveal>
      );
      break;
    case 6:
      content = (
        <StaggerReveal resetKey="aia-6" stagger={200}>
          <SubStepHeader current={6} total={TOTAL} title={t('aiAct.summaryTitle')} subtitle={t('aiAct.summarySub')} />
          {[
            [t('aiAct.sumEntity'), d.entityName || '—'],
            [t('aiAct.sumRole'), d.role.map(id => roles.find(r => r.id === id)?.label).join(', ') || '—'],
            [t('aiAct.sumSystem'), d.systemName || '—'],
            [t('aiAct.sumPurpose'), d.systemPurpose || '—'],
            [t('aiAct.sumAnnexIII'), d.annexIII.length > 0 ? d.annexIII.join(', ') : '—'],
            [t('aiAct.sumProhibited'), d.prohibitedFlags.length > 0 ? `⚠ ${d.prohibitedFlags.length}` : '—'],
            [t('aiAct.sumGpai'), d.isGpai ? (d.flopsThreshold ? t('aiAct.gpaiSystemicLabel') : t('aiAct.gpaiLabel')) : '—'],
            [t('aiAct.sumMeasures'), Object.keys(d.measures).length > 0 ? `${Object.keys(d.measures).length}` : '—'],
            [t('aiAct.sumClassification'), CLASS_META[liveClass][lang]],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
              <span className="text-muted-foreground sm:w-44 flex-shrink-0 text-xs sm:text-sm">{k}</span>
              <span className="text-foreground font-medium break-words min-w-0">{v}</span>
            </div>
          ))}
        </StaggerReveal>
      );
      break;
  }

  const isSummary = sub === 6;
  return (
    <div>
      {content}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          {sub > 0 && <Button variant="ghost" size="sm" onClick={() => setSub(s => s - 1)}>{t('aiAct.back')}</Button>}
          {sub < 6 && (
            <button onClick={handleDemo} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/10">
              <Sparkles className="w-3.5 h-3.5" /> Demo
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL }).map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === sub ? 'bg-primary w-3' : i < sub ? 'bg-primary/40' : 'bg-secondary'}`} />)}
        </div>
        {isSummary
          ? <Button onClick={() => onFinish(d)} className="font-semibold shadow-md">{t('aiAct.startAnalysis')}</Button>
          : <Button onClick={() => setSub(s => s + 1)} disabled={!canNext[sub]} className="font-semibold">
            {sub === 5 ? t('aiAct.toSummary') : t('aiAct.next')}
          </Button>
        }
      </div>
    </div>
  );
}

// ── Localizers ──────────────────────────────────────────────────
function localizeRisks(risks: AiActRisk[], lang: 'de' | 'en' | 'fr'): AiActRisk[] {
  if (lang === 'de') return risks;
  const map = lang === 'en' ? AI_ACT_RISKS_EN : AI_ACT_RISKS_FR;
  return risks.map(r => {
    const tr = map[String(r.id)];
    return tr ? { ...r, ...tr } : r;
  });
}
function localizeReqs(reqs: AiActReq[], lang: 'de' | 'en' | 'fr'): AiActReq[] {
  if (lang === 'de') return reqs;
  const map = lang === 'en' ? AI_ACT_REQS_EN : AI_ACT_REQS_FR;
  return reqs.map(r => {
    const tr = map[r.id];
    return tr ? { ...r, ...tr, criteria: tr.criteria || r.criteria } : r;
  });
}

// ── Phase 2: Risk Landscape ─────────────────────────────────────
function RiskLandscape({ risks, onNext }: { risks: AiActRisk[]; onNext: () => void }) {
  const { t, language } = useLanguage();
  const lang = language as string;
  const [exp, setExp] = useState<number | null>(null);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of risks) c[r.category] = (c[r.category] || 0) + 1;
    return c;
  }, [risks]);

  return (
    <StaggerReveal resetKey="rl" stagger={300}>
      <InfoBox icon="🛡️" color="blue">{t('aiAct.rlInfo')}</InfoBox>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {Object.entries(RISK_CATEGORIES).map(([k, m]) => (
          <div key={k} className="bg-card border border-border rounded-lg p-2 sm:p-3 text-center">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${m.dot} text-white font-bold text-xs sm:text-sm flex items-center justify-center mx-auto mb-1`}>{k}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight break-words">{m.label[lang] || m.label.en}</div>
            <div className="text-lg sm:text-xl font-bold text-foreground font-mono">{counts[k] || 0}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {risks.map(ri => {
          const meta = RISK_CATEGORIES[ri.category];
          const risk = riskLevel(ri.likelihood, ri.impact, t);
          const isOpen = exp === ri.id;
          return (
            <div key={ri.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer hover:bg-secondary/50" onClick={() => setExp(isOpen ? null : ri.id)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${meta?.badge || ''}`}>{riskId(ri)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${risk.cls}`}>{risk.label} <span className="font-mono">({ri.likelihood}×{ri.impact}={ri.likelihood * ri.impact})</span></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground break-words">{ri.name}</div>
                  <div className="text-xs text-muted-foreground break-words">{ri.component} · {ri.aiActRef}</div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 px-3 sm:px-4 py-3 text-sm space-y-2">
                  <div><span className="font-semibold text-muted-foreground">{t('aiAct.tmActor')}: </span>{ri.attacker}</div>
                  <div><span className="font-semibold text-muted-foreground">{t('aiAct.tmPath')}: </span>{ri.path}</div>
                  <div className="bg-background/50 border border-border rounded-md px-3 py-2"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('aiAct.tmEvidence')}</div>{ri.evidence}</div>
                  <div className="bg-background/50 border border-border rounded-md px-3 py-2"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('aiAct.tmRationale')}</div>{ri.rationale}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2"><Button onClick={onNext} className="font-semibold">{t('aiAct.tmNext')}</Button></div>
    </StaggerReveal>
  );
}

// ── Phase 3: Requirements Mapping ───────────────────────────────
function ReqMapping({ reqs, onNext }: { reqs: AiActReq[]; onNext: () => void }) {
  const { t } = useLanguage();
  const [exp, setExp] = useState<string | null>(null);
  const pass = reqs.filter(r => r.status === 'pass').length;
  const partial = reqs.filter(r => r.status === 'partial').length;
  const fail = reqs.filter(r => r.status === 'fail').length;
  const pct = Math.round(((pass + partial * 0.5) / reqs.length) * 100);

  return (
    <StaggerReveal resetKey="rm" stagger={300}>
      <InfoBox icon="📋" color="blue">{t('aiAct.cmInfo')}</InfoBox>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-center mb-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('aiAct.cmReadiness')}</div>
          <div className={`text-4xl font-bold font-mono mt-1 ${pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{pct}%</div>
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" />{pass}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" />{partial}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive" />{fail}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {reqs.map(r => {
          const isOpen = exp === r.id;
          return (
            <div key={r.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 cursor-pointer hover:bg-secondary/50" onClick={() => setExp(isOpen ? null : r.id)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.article} · {r.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} t={t} />
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3 text-sm space-y-2">
                  <div className="bg-background/50 border border-border rounded-md px-3 py-2"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('aiAct.tmEvidence')}</div>{r.evidence}</div>
                  {r.gap && <div><span className="font-semibold text-destructive">{t('aiAct.cmGap')}: </span>{r.gap}</div>}
                  {r.measure && <div><span className="font-semibold text-primary">{t('aiAct.cmMeasure')}: </span>{r.measure}</div>}
                  {r.criteria.length > 0 && (
                    <div className="bg-background/50 border border-primary/20 rounded-md px-3 py-2">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{t('aiAct.criteria')}</div>
                      <ul className="space-y-1">{r.criteria.map((c, i) => <li key={i} className="flex gap-2"><span className="text-primary/60 font-mono text-xs">{i+1}.</span>{c}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2"><Button onClick={onNext} className="font-semibold">{t('aiAct.cmNext')}</Button></div>
    </StaggerReveal>
  );
}

// ── Phase 4: Report ─────────────────────────────────────────────
function ReportView({ intakeData, risks, reqs }: { intakeData: AiActIntakeData; risks: AiActRisk[]; reqs: AiActReq[] }) {
  const { t, language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const classification = useMemo(() => classifyAiSystem(intakeData), [intakeData]);
  const classMeta = CLASS_META[classification];
  const [pdfRunning, setPdfRunning] = useState(false);

  const critRisks = useMemo(() => risks.filter(r => r.likelihood * r.impact >= 20), [risks]);
  const failReqs = useMemo(() => reqs.filter(r => r.status === 'fail'), [reqs]);

  const handlePdf = useCallback(() => {
    setPdfRunning(true);
    requestAnimationFrame(() => setTimeout(async () => {
      try {
        const qa = runAiActQualityCheck(risks, reqs, lang, intakeData);
        const fix = applyAiActAuditFixes(risks, reqs, qa.checks.filter(c => !c.passed), lang, intakeData);
        await generateAiActReport({ intakeData, risks: fix.risks, reqs: fix.reqs, language: lang, classification, isDraft: false });
      } finally { setPdfRunning(false); }
    }, 100));
  }, [intakeData, risks, reqs, lang, classification]);

  return (
    <StaggerReveal resetKey="rp" stagger={300}>
      <div className={`p-4 rounded-lg border-2 ${classMeta.color}`}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-1">{t('aiAct.classification')}</div>
        <div className="text-xl font-bold">{classMeta[lang]}</div>
        {classification === 'prohibited' && <div className="mt-2 text-sm">{t('aiAct.prohibitedWarning')}</div>}
      </div>

      <div className="bg-card border-l-4 border-primary rounded-lg p-4 sm:p-5 border border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('aiAct.rpTitle')}</div>
        <div className="text-base sm:text-lg font-bold text-foreground mt-0.5 break-words">{intakeData.entityName} — {intakeData.systemName}</div>
        <div className="h-px bg-border my-3" />
        <p className="text-sm text-foreground leading-relaxed">
          {t('aiAct.rpSummary')
            .replace('{system}', intakeData.systemName || '—')
            .replace('{class}', classMeta[lang])
            .replace('{riskCount}', String(risks.length))
            .replace('{critCount}', String(critRisks.length))
            .replace('{reqCount}', String(reqs.length))
            .replace('{gapCount}', String(failReqs.length))}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {([
          [t('aiAct.statRisks'), risks.length, 'text-foreground'],
          [t('aiAct.statCritical'), critRisks.length, 'text-destructive'],
          [t('aiAct.statGaps'), failReqs.length, 'text-destructive'],
        ] as [string, number, string][]).map(([l, n, c]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className={`text-2xl sm:text-3xl font-bold font-mono ${c}`}>{n}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      <details className="bg-card border border-border rounded-xl overflow-hidden" open>
        <summary className="px-5 py-3 cursor-pointer text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          📊 {t('aiAct.dashboard')}
        </summary>
        <div className="px-5 pb-5">
          <AiActAuditCharts risks={risks} reqs={reqs} />
        </div>
      </details>

      <div className="bg-secondary border border-border rounded-lg p-3 sm:p-4">
        <div className="text-sm text-foreground mb-3">
          <div className="font-semibold mb-0.5">{t('aiAct.rpExport')}</div>
          <div className="text-xs text-muted-foreground">{t('aiAct.rpExportHint')}</div>
        </div>
        <button onClick={handlePdf} disabled={pdfRunning} className="text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/30 disabled:opacity-50 w-full sm:w-auto justify-center">
          {pdfRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {pdfRunning ? t('aiAct.rpPdfRunning') : t('aiAct.rpPdfBtn')}
        </button>
      </div>
    </StaggerReveal>
  );
}

// ── Main ────────────────────────────────────────────────────────
const STEP_KEYS = ['aiAct.msData', 'aiAct.msRiskLandscape', 'aiAct.msMapping', 'aiAct.msReport'];

const AiActReadinessTool = ({ embedded }: { embedded?: boolean }) => {
  const { t, language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const [step, setStepRaw] = useState(0);
  const [loading, setLoading] = useState(false);
  const [intakeData, setIntakeData] = useState<AiActIntakeData>(EMPTY_INTAKE);
  const localizedRisks = useMemo(() => localizeRisks(AI_ACT_RISKS, lang), [lang]);
  const localizedReqs = useMemo(() => localizeReqs(AI_ACT_REQS, lang), [lang]);
  const contentRef = useRef<HTMLDivElement>(null);

  const setStep = useCallback((s: number) => {
    setStepRaw(s);
    setTimeout(() => { contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 50);
  }, []);

  const steps = STEP_KEYS.map(k => t(k));
  const handleIntakeFinish = useCallback((d: AiActIntakeData) => {
    setIntakeData(d); setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 1500);
  }, [setStep]);
  const reset = useCallback(() => { setStep(0); setIntakeData(EMPTY_INTAKE); }, [setStep]);
  const progressPct = ((step + 1) / steps.length) * 100;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="EU AI Act Readiness" description="EU-AI-Act-Konformitätsprüfung nach (EU) 2024/1689" />}

      <div className="px-4 md:px-8 lg:px-12 pt-6 pb-2 max-w-5xl" ref={contentRef}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{t('aiAct.h1')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('aiAct.subtitle')}</p>
      </div>

      <div className="border-b border-border px-4 py-3 mb-1">
        <div className="flex items-center max-w-5xl overflow-x-auto">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'bg-primary-foreground text-primary' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>{i < step ? '✓' : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>
      </div>

      <Progress value={progressPct} className="h-1 rounded-none" />

      <div className="max-w-5xl px-4 md:px-8 lg:px-12 py-6">
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-5" />
            <div className="text-foreground font-semibold text-lg mb-2">{t('aiAct.rpLoading')}</div>
            <div className="text-muted-foreground text-sm">{t('aiAct.rpLoadingSub')}</div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-foreground"><Typewriter text={steps[step]} mode="typewriter" charDelay={10} cursor={false} /></div>
              {step > 0 && <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground"><RotateCcw className="w-4 h-4 mr-1" /> {t('aiAct.restart')}</Button>}
            </div>
            {step === 0 && <IntakeWizard onFinish={handleIntakeFinish} />}
            {step === 1 && <RiskLandscape risks={localizedRisks} onNext={() => setStep(2)} />}
            {step === 2 && <ReqMapping reqs={localizedReqs} onNext={() => setStep(3)} />}
            {step === 3 && <ReportView intakeData={intakeData} risks={localizedRisks} reqs={localizedReqs} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiActReadinessTool;
