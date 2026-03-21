import { useState, useCallback, useRef, useMemo, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, Loader2, Sparkles, FileText, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Wrench } from 'lucide-react';
import { applyDoraAuditFixes } from '@/utils/doraAuditFixes';
import { generateDoraReport } from '@/utils/doraReportPdf';
import { DoraAuditCharts } from '@/components/DoraAuditCharts';
import { DoraFindingsView } from '@/components/DoraFindingsView';
import { runDoraQualityCheck, type QaResult } from '@/utils/doraQualityCheck';
import { PageMeta } from '@/components/PageMeta';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import Typewriter from '@/components/Typewriter';
import { StaggerReveal } from '@/components/StaggerReveal';
import {
  getEntityTypes, getCriticalityLevels, getInfraOpts,
  THIRD_PARTY_OPTS, getRiskMeasures, getRiskCategories,
  getAttachTypes, DORA_RISKS, DORA_REQS, RISK_CATEGORIES, riskId,
  type DoraRisk, type DoraReq, type DoraIntakeData, type MeasureEntry, EMPTY_INTAKE,
  DEMO_SCENARIOS, type DemoScenario,
} from '@/data/doraData';

// ── Helpers ─────────────────────────────────────────────────────

function riskLevel(l: number, i: number, t: (k: string) => string) {
  const s = l * i;
  if (s >= 20) return { label: t('dora.critical'), cls: 'bg-destructive text-destructive-foreground' };
  if (s >= 13) return { label: t('dora.high'), cls: 'bg-orange-500 text-white' };
  if (s >= 6) return { label: t('dora.medium'), cls: 'bg-yellow-500 text-black' };
  return { label: t('dora.low'), cls: 'bg-green-500 text-white' };
}

const StatusBadge = memo(({ status, t }: { status: string; t: (k: string) => string }) => {
  if (status === 'pass') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">{t('dora.statusPass')}</span>;
  if (status === 'partial') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{t('dora.statusPartial')}</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">{t('dora.statusFail')}</span>;
});

const ScoreBar = memo(({ value }: { value: number }) => {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? 'bg-destructive' : value >= 3 ? 'bg-orange-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-secondary rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold w-4 text-muted-foreground font-mono">{value}</span>
    </div>
  );
});

// ── Shared UI ───────────────────────────────────────────────────

function InfoBox({ icon = '💡', title, children, color = 'blue' }: { icon?: string; title?: string; children: React.ReactNode; color?: 'blue' | 'amber' | 'green' }) {
  const colors = { blue: 'bg-primary/10 border-primary/20', amber: 'bg-warning/10 border-warning/20', green: 'bg-green-500/10 border-green-500/20' };
  return (
    <div className={`border rounded-lg px-3 sm:px-4 py-3 text-sm text-foreground ${colors[color]} break-words overflow-hidden`}>
      {title ? <div className="font-semibold mb-1">{icon} <Typewriter text={title} mode="typewriter" delay={400} charDelay={8} cursor={false} /></div> : <span className="font-semibold">{icon} </span>}
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
      <div className="text-base font-bold text-foreground" key={`title-${current}`}>
        <Typewriter text={title} mode="typewriter" charDelay={8} cursor={false} />
      </div>
      {subtitle && <div className="text-sm text-muted-foreground mt-0.5" key={`sub-${current}`}>
        <Typewriter text={subtitle} mode="typewriter" delay={title.length * 8 + 200} charDelay={6} cursor={false} />
      </div>}
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

function EvidenceBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background/50 border border-border rounded-md px-3 py-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function CriteriaBlock({ criteria, t }: { criteria: string[]; t: (k: string) => string }) {
  if (!criteria.length) return null;
  return (
    <div className="bg-background/50 border border-primary/20 rounded-md px-3 py-2">
      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{t('dora.criteriaHeader')}</div>
      <ul className="space-y-1">
        {criteria.map((c, i) => (
          <li key={i} className="flex gap-2 text-foreground">
            <span className="text-primary/60 flex-shrink-0 font-mono text-xs mt-0.5">{i + 1}.</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Intake Wizard ───────────────────────────────────────────────

const INTAKE_STEPS = 6;
const TOTAL_WIZARD_PAGES = 8;

function IntakeWizard({ onFinish }: { onFinish: (d: DoraIntakeData) => void }) {
  const { t, language } = useLanguage();
  const [sub, setSub] = useState(0);
  const [d, setD] = useState<DoraIntakeData>(EMPTY_INTAKE);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const entityTypes = useMemo(() => getEntityTypes(t), [t]);
  const critLevels = useMemo(() => getCriticalityLevels(t), [t]);
  const infraOpts = useMemo(() => getInfraOpts(t), [t]);
  const riskMeasures = useMemo(() => getRiskMeasures(t), [t]);
  const riskCategories = useMemo(() => getRiskCategories(t), [t]);
  const attachTypes = useMemo(() => getAttachTypes(t), [t]);

  const setField = useCallback((field: keyof DoraIntakeData, val: unknown) => {
    setD(prev => ({ ...prev, [field]: val }));
  }, []);

  const toggleArray = useCallback((field: keyof DoraIntakeData, val: string) => {
    setD(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }, []);

  const addRole = useCallback((role: string) => {
    if (!role.trim()) return;
    setD(prev => prev.roles.includes(role.trim()) ? prev : { ...prev, roles: [...prev.roles, role.trim()], customRole: '' });
  }, []);

  const removeRole = useCallback((role: string) => {
    setD(prev => ({ ...prev, roles: prev.roles.filter(x => x !== role) }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: activeUploadType || 'other' }));
    setD(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    e.target.value = '';
  }, [activeUploadType]);

  const removeFile = useCallback((idx: number) => {
    setD(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
  }, []);

  const canNext = useMemo(() => [
    d.entityName.trim().length > 0 && d.entityType.length > 0,
    d.criticality !== '',
    true,
    d.infrastructure.length > 0,
    d.roles.length > 0,
    true, true,
  ], [d.entityName, d.entityType.length, d.criticality, d.infrastructure.length, d.roles.length]);

  const scenarioRef = useRef(Math.floor(Math.random() * DEMO_SCENARIOS.length));

  const handleDemo = useCallback(() => {
    // On sub 0, cycle to next scenario on each click
    if (sub === 0) {
      scenarioRef.current = (scenarioRef.current + 1) % DEMO_SCENARIOS.length;
    }
    const scenario = DEMO_SCENARIOS[scenarioRef.current];
    switch (sub) {
      case 0: setD(prev => ({ ...prev, entityName: scenario.entity.name, entityType: scenario.entity.types })); break;
      case 1: setD(prev => ({ ...prev, criticality: scenario.criticality })); break;
      case 2: setD(prev => ({ ...prev, description: scenario.description, thirdPartyProviders: scenario.thirdPartyProviders })); break;
      case 3: setD(prev => ({ ...prev, infrastructure: scenario.infrastructure })); break;
      case 4: setD(prev => ({ ...prev, roles: scenario.roles, knownIssues: scenario.knownIssues })); break;
      case 5: setD(prev => ({ ...prev, measures: scenario.measures })); break;
      case 6: setD(prev => ({ ...prev, files: scenario.files })); break;
    }
  }, [sub]);

  const prevSubRef = useRef(0);
  if (sub === 0 && prevSubRef.current > 0) {
    scenarioRef.current = Math.floor(Math.random() * DEMO_SCENARIOS.length);
  }
  prevSubRef.current = sub;

  const isSummary = sub === 7;

  const rolePresets = [
    'Vorstand IT', 'CISO', 'IT-Leiter', 'Compliance-Beauftragter',
    'Datenschutzbeauftragter', 'Risikomanager', 'Interner Revisor', 'Service Delivery Manager',
  ];

  let stepContent: React.ReactNode;
  switch (sub) {
    case 0:
      stepContent = (
        <StaggerReveal resetKey="d-intake-0" stagger={300}>
          <SubStepHeader current={0} total={INTAKE_STEPS} title={t('dora.step0Title')} subtitle={t('dora.step0Sub')} />
          <InfoBox icon="💡" color="blue">{t('dora.step0Info')}</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('dora.entityName')}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('dora.entityNamePh')} value={d.entityName} onChange={e => setField('entityName', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('dora.entityTypeSel')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {entityTypes.map(et => <Chip key={et.id} label={et.label} icon={et.icon} desc={et.desc} selected={d.entityType.includes(et.id)} onClick={() => toggleArray('entityType', et.id)} />)}
            </div>
          </div>
        </StaggerReveal>
      );
      break;
    case 1:
      stepContent = (
        <StaggerReveal resetKey="d-intake-1" stagger={300}>
          <SubStepHeader current={1} total={INTAKE_STEPS} title={t('dora.step1Title')} subtitle={t('dora.step1Sub')} />
          <InfoBox icon="📘" title={t('dora.step1InfoTitle')} color="blue">{t('dora.step1Info')}</InfoBox>
          <div className="space-y-2">
            {critLevels.map(c => (
              <button key={c.id} onClick={() => setField('criticality', c.id)} className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all ${d.criticality === c.id ? c.color + ' shadow' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{c.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{c.desc}</div>
                  </div>
                  {d.criticality === c.id && <span className="text-lg mt-0.5 flex-shrink-0 text-primary">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </StaggerReveal>
      );
      break;
    case 2:
      stepContent = (
        <StaggerReveal resetKey="d-intake-2" stagger={300}>
          <SubStepHeader current={2} total={INTAKE_STEPS} title={t('dora.step2Title')} subtitle={t('dora.step2Sub')} />
          <InfoBox icon="💡" color="blue">{t('dora.step2Info')}</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('dora.description')}</label>
            <textarea rows={4} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder={t('dora.descriptionPh')} value={d.description} onChange={e => setField('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('dora.thirdParty')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THIRD_PARTY_OPTS.map(tp => (
                <button key={tp.label} onClick={() => toggleArray('thirdPartyProviders', tp.label)} className={`border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 transition-all ${d.thirdPartyProviders.includes(tp.label) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
                  <span>{tp.icon}</span><span className="flex-1">{tp.label}</span>{d.thirdPartyProviders.includes(tp.label) && <span className="text-xs text-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </StaggerReveal>
      );
      break;
    case 3:
      stepContent = (
        <StaggerReveal resetKey="d-intake-3" stagger={300}>
          <SubStepHeader current={3} total={INTAKE_STEPS} title={t('dora.step3Title')} subtitle={t('dora.step3Sub')} />
          <InfoBox icon="💡" color="blue">{t('dora.step3Info')}</InfoBox>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {infraOpts.map(o => (
              <button key={o.id} onClick={() => toggleArray('infrastructure', o.id)} className={`border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 transition-all min-w-0 ${d.infrastructure.includes(o.id) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
                <span className="flex-shrink-0">{o.icon}</span><span className="flex-1 min-w-0 break-words">{o.label}</span>{d.infrastructure.includes(o.id) && <span className="text-xs text-primary flex-shrink-0">✓</span>}
              </button>
            ))}
          </div>
        </StaggerReveal>
      );
      break;
    case 4:
      stepContent = (
        <StaggerReveal resetKey="d-intake-4" stagger={300}>
          <SubStepHeader current={4} total={INTAKE_STEPS} title={t('dora.step4Title')} subtitle={t('dora.step4Sub')} />
          <InfoBox icon="💡" color="blue">{t('dora.step4Info')}</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('dora.commonRoles')}</label>
            <div className="flex flex-wrap gap-2">
              {rolePresets.map(r => (
                <button key={r} onClick={() => addRole(r)} className={`border rounded-full px-3 py-1.5 text-xs font-medium transition-all ${d.roles.includes(r) ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{d.roles.includes(r) ? '✓ ' : ''}{r}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('dora.customRolePh')} value={d.customRole} onChange={e => setField('customRole', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRole(d.customRole); }} />
            <Button onClick={() => addRole(d.customRole)} className="font-medium">{t('dora.addRole')}</Button>
          </div>
          {d.roles.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('dora.selectedRoles')}</label>
              <div className="flex flex-wrap gap-2">
                {d.roles.map(r => (
                  <span key={r} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
                    👤 {r}
                    <button onClick={() => removeRole(r)} className="text-green-400 hover:text-destructive font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('dora.knownIssues')}</label>
            <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder={t('dora.knownIssuesPh')} value={d.knownIssues} onChange={e => setField('knownIssues', e.target.value)} />
          </div>
        </StaggerReveal>
      );
      break;
    case 5: {
      const toggleMeasure = (id: string) => {
        setD(prev => {
          const existing = prev.measures[id];
          if (existing) { const { [id]: _, ...rest } = prev.measures; return { ...prev, measures: rest }; }
          return { ...prev, measures: { ...prev.measures, [id]: { active: true, documented: false, audited: false, certified: false } } };
        });
      };
      const setMeasureProp = (id: string, prop: 'documented' | 'audited' | 'certified', val: boolean) => {
        setD(prev => {
          const entry = prev.measures[id]; if (!entry) return prev;
          return { ...prev, measures: { ...prev.measures, [id]: { ...entry, [prop]: val } } };
        });
      };
      const maturityLabel = (entry: MeasureEntry) => {
        if (entry.active && entry.documented && entry.audited && entry.certified) return t('dora.maturityCertified');
        if (entry.active && entry.documented && entry.audited) return t('dora.maturityFull');
        if (entry.active && entry.documented) return t('dora.maturityPartial');
        return t('dora.maturityBasic');
      };
      const maturityColor = (entry: MeasureEntry) => {
        if (entry.active && entry.documented && entry.audited && entry.certified) return 'text-primary';
        if (entry.active && entry.documented && entry.audited) return 'text-green-400';
        if (entry.active && entry.documented) return 'text-yellow-400';
        return 'text-orange-400';
      };

      stepContent = (
        <StaggerReveal resetKey="d-intake-5" stagger={300}>
          <SubStepHeader current={5} total={INTAKE_STEPS} title={t('dora.step5Title')} subtitle={t('dora.step5Sub')} />
          <InfoBox icon="💡" color="blue">{t('dora.step5Info')}</InfoBox>
          {riskCategories.map(cat => (
            <div key={cat}>
              <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{cat}</div>
              <div className="space-y-1.5">
                {riskMeasures.filter(m => m.cat === cat).map(m => {
                  const entry = d.measures[m.id];
                  const isActive = !!entry;
                  return (
                    <div key={m.id} className={`border rounded-lg transition-all ${isActive ? 'border-green-500/30 bg-green-500/10' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                      <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded accent-green-600 flex-shrink-0" checked={isActive} onChange={() => toggleMeasure(m.id)} />
                        <span className="text-sm text-foreground flex-1">{m.label}</span>
                        {isActive && <span className={`text-xs font-semibold flex-shrink-0 ${maturityColor(entry)}`}>{maturityLabel(entry)}</span>}
                      </label>
                      {isActive && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 sm:px-10 pb-2.5 -mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.documented} onChange={e => setMeasureProp(m.id, 'documented', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('dora.documented')}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.audited} onChange={e => setMeasureProp(m.id, 'audited', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('dora.audited')}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.certified} onChange={e => setMeasureProp(m.id, 'certified', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('dora.certified')}</span>
                          </label>
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
    case 6:
      stepContent = (
        <StaggerReveal resetKey="d-intake-6" stagger={300}>
          <SubStepHeader current={5} total={INTAKE_STEPS} title={t('dora.step6Title')} subtitle={t('dora.step6Sub')} />
          <InfoBox icon="💡" color="blue">{t('dora.step6Info')}</InfoBox>
          <div className="grid grid-cols-1 gap-2">
            {attachTypes.map(at => (
              <button key={at.id} onClick={() => { setActiveUploadType(at.id); if (fileRef.current) { fileRef.current.accept = at.accept; fileRef.current.click(); } }} className="flex items-center gap-3 border-2 border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all text-left">
                <span className="text-xl">{at.icon}</span>
                <div>
                  <div className="font-medium">{at.label}</div>
                  <div className="text-xs text-muted-foreground/60">{at.accept}</div>
                </div>
                <span className="ml-auto text-muted-foreground/40">+</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" multiple onChange={handleFileChange} className="hidden" />
          {d.files.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('dora.uploadedFiles')} ({d.files.length})</div>
              <div className="space-y-1.5">
                {d.files.map((f, i) => {
                  const typeInfo = attachTypes.find(at => at.id === f.type) || { icon: '📎', label: 'Document' };
                  return (
                    <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5 text-sm">
                      <span className="text-lg flex-shrink-0">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{typeInfo.label} · <span className="font-mono">{(f.size / 1024).toFixed(0)} KB</span></div>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive font-bold text-lg leading-none transition-colors">×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <InfoBox icon="🔒" color="green">{t('dora.filePrivacy')}</InfoBox>
        </StaggerReveal>
      );
      break;
    case 7:
      stepContent = (
        <StaggerReveal resetKey="d-intake-7" stagger={250}>
          <SubStepHeader current={5} total={INTAKE_STEPS} title={t('dora.summaryTitle')} subtitle={t('dora.summarySub')} />
          {[
            { label: t('dora.sumEntity'), val: d.entityName },
            { label: t('dora.sumType'), val: d.entityType.map(id => entityTypes.find(et => et.id === id)?.label).join(', ') || '—' },
            { label: t('dora.sumCriticality'), val: critLevels.find(c => c.id === d.criticality)?.label || '—' },
            { label: t('dora.sumInfra'), val: d.infrastructure.length > 0 ? d.infrastructure.map(id => infraOpts.find(o => o.id === id)?.label || id).join(', ') : '—' },
            { label: t('dora.sumProviders'), val: d.thirdPartyProviders.length > 0 ? `${d.thirdPartyProviders.length} Anbieter` : '—' },
            { label: t('dora.sumRoles'), val: d.roles.length > 0 ? d.roles.join(', ') : '—' },
            { label: t('dora.sumMeasures'), val: (() => { const cnt = Object.keys(d.measures).length; return cnt > 0 ? `${cnt} ${t('dora.sumMeasuresSelected')}` : t('dora.sumMeasuresNone'); })() },
            { label: t('dora.sumAttach'), val: d.files.length > 0 ? `${d.files.length} ${t('dora.sumFiles')}` : t('dora.sumFilesNone') },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground sm:w-28 flex-shrink-0 text-xs sm:text-sm">{label}</span>
              <span className="text-foreground font-medium break-words min-w-0">{val}</span>
            </div>
          ))}
          {d.knownIssues && <div className="text-sm border-b border-border/50 pb-2"><span className="text-muted-foreground">{t('dora.sumKnownGaps')}: </span><span className="text-foreground">{d.knownIssues}</span></div>}
        </StaggerReveal>
      );
      break;
  }

  return (
    <div>
      {stepContent}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          {sub > 0 && <Button variant="ghost" size="sm" onClick={() => setSub(s => s - 1)}>{t('dora.back')}</Button>}
          {sub < 7 && (
            <button onClick={handleDemo} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/10">
              <Sparkles className="w-3.5 h-3.5" /> Demo
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_WIZARD_PAGES }).map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === sub ? 'bg-primary w-3' : i < sub ? 'bg-primary/40' : 'bg-secondary'}`} />)}
        </div>
        {isSummary
          ? <Button onClick={() => onFinish(d)} className="font-semibold shadow-md">{t('dora.startAnalysis')}</Button>
          : <Button onClick={() => setSub(s => s + 1)} disabled={!canNext[sub]} className="font-semibold shadow-sm">
            {sub === 6 ? t('dora.toSummary') : t('dora.next')}
          </Button>
        }
      </div>
    </div>
  );
}

// ── Phase 2: Risk Landscape ──────────────────────────────────

function RiskLandscape({ risks, onNext }: { risks: DoraRisk[]; onNext: () => void }) {
  const { t, language } = useLanguage();
  const [exp, setExp] = useState<number | null>(null);
  const lang = language as string;

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ri of risks) { counts[ri.category] = (counts[ri.category] || 0) + 1; }
    return counts;
  }, [risks]);

  return (
    <StaggerReveal resetKey="rl" stagger={350}>
      <InfoBox icon="🛡️" title={t('dora.rlInfoTitle')} color="blue">{t('dora.rlInfo')}</InfoBox>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(RISK_CATEGORIES).map(([k, m]) => (
          <div key={k} className="bg-card border border-border rounded-lg p-2 sm:p-3 text-center">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${m.dot} text-white font-bold text-xs sm:text-sm flex items-center justify-center mx-auto mb-1`}>{k}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight break-words">{m.label[lang] || m.label.en}</div>
            <div className="text-lg sm:text-xl font-bold text-foreground font-mono">{catCounts[k] || 0}</div>
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
                  <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${meta?.badge || ''}`}>{riskId(ri)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${risk.cls}`}>{risk.label} <span className="font-mono">({ri.likelihood}×{ri.impact}={ri.likelihood * ri.impact})</span></span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto sm:hidden" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto sm:hidden" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground break-words">{ri.name}</div>
                  <div className="text-xs text-muted-foreground break-words">{ri.component} · {ri.doraRef}</div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" />}
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 px-3 sm:px-4 py-3 text-sm space-y-3">
                  <div className="break-words"><span className="font-semibold text-muted-foreground">{t('dora.tmAttacker')}: </span><span className="text-foreground break-words">{ri.attacker}</span></div>
                  <div className="break-words"><span className="font-semibold text-muted-foreground">{t('dora.tmPath')}: </span><span className="text-foreground break-words">{ri.path}</span></div>
                  <EvidenceBlock label={t('dora.tmEvidence')}>{ri.evidence}</EvidenceBlock>
                  <EvidenceBlock label={t('dora.tmRationale')}>{ri.rationale}</EvidenceBlock>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div><div className="text-xs text-muted-foreground mb-1">Likelihood (<span className="font-mono">{ri.likelihood}/5</span>)</div><ScoreBar value={ri.likelihood} /></div>
                    <div><div className="text-xs text-muted-foreground mb-1">Impact (<span className="font-mono">{ri.impact}/5</span>)</div><ScoreBar value={ri.impact} /></div>
                  </div>
                  {ri.sources.length > 0 && (
                    <div className="pt-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('dora.tmSources')}</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {ri.sources.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-primary/60">{'>'}</span>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">{t('dora.tmNext')}</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 3: Risk Matrix ──────────────────────────────────────

function RiskMatrix({ risks, onNext }: { risks: DoraRisk[]; onNext: () => void }) {
  const { t } = useLanguage();
  const sorted = useMemo(() => [...risks].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)), [risks]);
  const cnt = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    sorted.forEach(ri => {
      const s = ri.likelihood * ri.impact;
      if (s >= 20) c.critical++; else if (s >= 13) c.high++; else if (s >= 6) c.medium++; else c.low++;
    });
    return c;
  }, [sorted]);

  const matrixColor = (s: number) => s >= 20 ? 'bg-red-500' : s >= 13 ? 'bg-orange-400' : s >= 6 ? 'bg-yellow-300' : 'bg-green-300';

  return (
    <StaggerReveal resetKey="rm" stagger={350}>
      <InfoBox icon="⚖️" title={t('dora.raInfoTitle')} color="blue">{t('dora.raInfo')}</InfoBox>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          [t('dora.critical'), 'bg-destructive', cnt.critical],
          [t('dora.high'), 'bg-orange-500', cnt.high],
          [t('dora.medium'), 'bg-yellow-500', cnt.medium],
          [t('dora.low'), 'bg-green-500', cnt.low],
        ] as [string, string, number][]).map(([l, c, n]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${c} text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2`}>{n}</div>
            <div className="text-sm font-semibold text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm font-semibold text-foreground mb-3">{t('dora.raMatrix')}</div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="w-20 text-right pr-3 text-muted-foreground font-normal pb-1">Impact ↑</th>
                {[1,2,3,4,5].map(i => <th key={i} className="w-12 text-center text-muted-foreground font-semibold pb-1 font-mono">{i}</th>)}
                <th className="pl-2 text-muted-foreground font-normal">← Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {[5,4,3,2,1].map(imp => (
                <tr key={imp}>
                  <td className="text-right pr-3 text-muted-foreground font-semibold py-0.5 font-mono">{imp}</td>
                  {[1,2,3,4,5].map(lik => {
                    const score = lik * imp;
                    const pts = risks.filter(ri => ri.likelihood === lik && ri.impact === imp);
                    return (
                      <td key={lik} className={`w-12 h-10 ${matrixColor(score)} text-center align-middle border border-background`} title={pts.map(p => p.name).join('\n') || ''}>
                        {pts.length > 0 && <div className="w-6 h-6 bg-background/90 rounded-full text-foreground font-bold text-xs font-mono flex items-center justify-center mx-auto shadow cursor-help">{pts.length}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-secondary border-b border-border text-sm font-semibold text-foreground">{t('dora.raAllRisks')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">{t('dora.raThreat')}</th>
                <th className="px-3 py-2 text-center w-10">L</th>
                <th className="px-3 py-2 text-center w-10">I</th>
                <th className="px-3 py-2 text-center w-14">Score</th>
                <th className="px-4 py-2 text-center w-24">{t('dora.raPriority')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ri, idx) => {
                const risk = riskLevel(ri.likelihood, ri.impact, t);
                return (
                  <tr key={ri.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}>
                    <td className="px-4 py-2.5"><div className="font-medium text-foreground"><span className="font-mono text-xs text-muted-foreground mr-1.5">{riskId(ri)}</span>{ri.name}</div><div className="text-xs text-muted-foreground">{ri.component}</div></td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground font-mono">{ri.likelihood}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground font-mono">{ri.impact}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground font-mono">{ri.likelihood * ri.impact}</td>
                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${risk.cls}`}>{risk.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">{t('dora.raNext')}</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 4: DORA Mapping ──────────────────────────────────────

function DORAMapping({ reqs, onNext }: { reqs: DoraReq[]; onNext: () => void }) {
  const { t } = useLanguage();
  const [exp, setExp] = useState<string | null>(null);
  const { pass, partial, fail, score, scoreColor, strokeColor } = useMemo(() => {
    const p = reqs.filter(r => r.status === 'pass').length;
    const pa = reqs.filter(r => r.status === 'partial').length;
    const f = reqs.filter(r => r.status === 'fail').length;
    const s = Math.round((p * 100 + pa * 50) / reqs.length);
    return { pass: p, partial: pa, fail: f, score: s,
      scoreColor: s >= 70 ? 'text-green-500' : s >= 40 ? 'text-yellow-500' : 'text-destructive',
      strokeColor: s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#dc2626' };
  }, [reqs]);

  return (
    <StaggerReveal resetKey="dm" stagger={350}>
      <InfoBox icon="📋" title={t('dora.cmInfoTitle')} color="blue">{t('dora.cmInfo')}</InfoBox>
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-secondary" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={strokeColor} strokeWidth="3" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold font-mono ${scoreColor}`}>{score}%</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-foreground mb-1">{t('dora.cmReadiness')}</div>
          <div className="text-sm text-muted-foreground mb-3">{reqs.length} {t('dora.cmChecked')}</div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{pass} {t('dora.cmPassed')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />{partial} {t('dora.cmPartial')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive inline-block" />{fail} {t('dora.cmGaps')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {reqs.map(r => {
          const isOpen = exp === r.id;
          return (
            <div key={r.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50" onClick={() => setExp(isOpen ? null : r.id)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.article}</div>
                </div>
                <StatusBadge status={r.status} t={t} />
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3 text-sm space-y-3">
                  <EvidenceBlock label={t('dora.tmEvidence')}>{r.evidence}</EvidenceBlock>
                  {r.gap && <div><span className="font-semibold text-destructive">{t('dora.cmGapLabel')}: </span><span className="text-foreground">{r.gap}</span></div>}
                  <EvidenceBlock label={t('dora.tmRationale')}>{r.rationale}</EvidenceBlock>
                  {r.measure && <div><span className="font-semibold text-primary">{t('dora.cmMeasure')}: </span><span className="text-foreground">{r.measure}</span></div>}
                  <CriteriaBlock criteria={r.criteria} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">{t('dora.cmNext')}</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 5: Report ───────────────────────────────────────────

function ReportView({ intakeData, risks, reqs }: { intakeData: DoraIntakeData; risks: DoraRisk[]; reqs: DoraReq[] }) {
  const { t, language } = useLanguage();
  const [localRisks, setLocalRisks] = useState<DoraRisk[]>(() => risks.map(r => ({ ...r, sources: [...r.sources] })));
  const [localReqs, setLocalReqs] = useState<DoraReq[]>(() => reqs.map(r => ({ ...r, criteria: [...r.criteria] })));
  const [qaResult, setQaResult] = useState<QaResult | null>(null);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaExpanded, setQaExpanded] = useState(false);
  const [fixesApplied, setFixesApplied] = useState(false);
  const [fixesRunning, setFixesRunning] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [fixLog, setFixLog] = useState<string[]>([]);
  const [allFixLogs, setAllFixLogs] = useState<string[]>([]);
  const [draftDownloaded] = useState(true); // No draft step — QA is always available
  const [qaIteration, setQaIteration] = useState(0);
  interface QaHistoryEntry { iteration: number; passed: number; total: number; failed: number; verdict: string; fixes: string[] }
  const [qaHistory, setQaHistory] = useState<QaHistoryEntry[]>([]);
  const [preFixQaChecks, setPreFixQaChecks] = useState<QaCheck[] | null>(null);
  type QaCheck = NonNullable<QaResult>['checks'][number];
  const critRisks = useMemo(() => localRisks.filter(r => r.likelihood * r.impact >= 20), [localRisks]);
  const failReqs = useMemo(() => localReqs.filter(r => r.status === 'fail'), [localReqs]);
  const [finalPdfRunning, setFinalPdfRunning] = useState(false);

  const entityTypes = useMemo(() => getEntityTypes(t), [t]);
  const critLevels = useMemo(() => getCriticalityLevels(t), [t]);
  const typeName = intakeData.entityType?.map(id => entityTypes.find(et => et.id === id)?.label).join(', ') || '';
  const critName = critLevels.find(c => c.id === intakeData.criticality)?.label || intakeData.criticality || '—';
  const today = useMemo(() => {
    const locale = language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  }, [language]);

  const handleQaCheck = useCallback(() => {
    setQaRunning(true); setQaExpanded(false); setFixesApplied(false); setFixLog([]);
    const nextIter = qaIteration + 1; setQaIteration(nextIter);
    setTimeout(() => {
      const result = runDoraQualityCheck(localRisks, localReqs, language as 'de' | 'en' | 'fr', intakeData);
      setQaResult(result); setQaRunning(false); setQaExpanded(true);
      setQaHistory(prev => [...prev, { iteration: nextIter, passed: result.passed, total: result.total, failed: result.failed, verdict: result.verdict, fixes: [] }]);
    }, 1500);
  }, [localRisks, localReqs, language, intakeData, qaIteration]);

  const handleApplyFixes = useCallback(() => {
    if (!qaResult) return;
    setFixesRunning(true); setFixProgress(10);
    const failed = qaResult.checks.filter(c => !c.passed);
    setPreFixQaChecks(prev => prev || qaResult.checks);
    const t1 = setTimeout(() => setFixProgress(30), 300);
    const t2 = setTimeout(() => setFixProgress(55), 700);
    const t3 = setTimeout(() => {
      setFixProgress(75);
      const result = applyDoraAuditFixes(localRisks, localReqs, failed, language as 'de' | 'en' | 'fr', intakeData);
      setLocalRisks(result.risks); setLocalReqs(result.reqs); setFixLog(result.fixes);
      setAllFixLogs(prev => [...prev, ...result.fixes]); setFixProgress(90);
      setQaHistory(prev => prev.map((h, i) => i === prev.length - 1 ? { ...h, fixes: result.fixes } : h));
      setTimeout(() => {
        const newQa = runDoraQualityCheck(result.risks, result.reqs, language as 'de' | 'en' | 'fr', intakeData);
        setQaResult(newQa); setFixProgress(100);
        setTimeout(() => { setFixesApplied(true); setFixesRunning(false); setFixProgress(0); }, 400);
      }, 500);
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [qaResult, localRisks, localReqs, language, intakeData]);

  // Draft step removed — no longer needed

  const handleFinalPdf = useCallback(() => {
    setFinalPdfRunning(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const checksForPdf = preFixQaChecks || qaResult?.checks;
          const fixLogForPdf = allFixLogs.length > 0 ? allFixLogs : fixLog;
          generateDoraReport({ intakeData, risks: localRisks, reqs: localReqs, language: language as 'de' | 'en' | 'fr', entityTypeName: typeName, criticalityName: critName, isDraft: false, qaChecks: checksForPdf, fixLog: fixLogForPdf, qaIterations: qaIteration });
        } finally { setFinalPdfRunning(false); }
      }, 100);
    });
  }, [intakeData, localRisks, localReqs, language, typeName, critName, qaResult, fixLog, allFixLogs, preFixQaChecks, qaIteration]);

  const qaVerdict = qaResult?.verdict;
  const canFinal = fixesApplied || qaVerdict === 'passed' || qaVerdict === 'conditional';

  const CATEGORY_LABELS: Record<string, string> = {
    consistency: language === 'de' ? 'A. Konsistenzprüfung' : 'A. Consistency Check',
    technical: language === 'de' ? 'B. Fachliche Korrektheit' : 'B. Technical Correctness',
    evidence: language === 'de' ? 'C. Evidenzprüfung' : 'C. Evidence Check',
    editorial: language === 'de' ? 'D. Redaktionelle Prüfung' : 'D. Editorial Check',
    regulatory: language === 'de' ? 'E. Regulatorische Prüfung' : 'E. Regulatory Check',
  };

  return (
    <StaggerReveal resetKey="rp" stagger={350}>
      <InfoBox icon="✅" title={t('dora.rpDone')} color="green">{t('dora.rpDoneInfo')}</InfoBox>

      <div className="bg-card border-l-4 border-primary rounded-lg p-5 border border-border">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('dora.rpTitle')}</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{intakeData.entityName}</div>
          </div>
          <div className="sm:text-right text-xs text-muted-foreground">
            <div>{today}</div>
            <div className="mt-0.5">{critName}</div>
          </div>
        </div>
        <div className="h-px bg-border mb-3" />
        <p className="text-sm text-foreground leading-relaxed">
          {language === 'de'
            ? `Die DORA-Konformitaetspruefung fuer ${intakeData.entityName} (${typeName}, Kritikalitaet: ${critName}) wurde am ${today} durchgefuehrt. Es wurden ${localRisks.length} IKT-Risiken identifiziert, davon ${critRisks.length} mit kritischem Score (>= 20). Von ${localReqs.length} DORA-Anforderungen bestehen ${failReqs.length} Luecken.`
            : `The DORA compliance assessment for ${intakeData.entityName} (${typeName}, criticality: ${critName}) was conducted on ${today}. ${localRisks.length} ICT risks were identified, ${critRisks.length} with critical score (>= 20). Of ${localReqs.length} DORA requirements, ${failReqs.length} gaps remain.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([
          [language === 'de' ? 'IKT-Risiken' : 'ICT Risks', localRisks.length, 'text-foreground'],
          [language === 'de' ? 'Kritisch (>= 20)' : 'Critical (>= 20)', critRisks.length, 'text-destructive'],
          [language === 'de' ? 'DORA-Luecken' : 'DORA Gaps', failReqs.length, 'text-destructive'],
        ] as [string, number, string][]).map(([l, n, c]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${c}`}>{n}</div>
            <div className="text-xs text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Critical Risks */}
      {critRisks.length > 0 && (
        <div className="bg-card border-2 border-destructive/30 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
            <span className="text-sm font-bold text-destructive">{language === 'de' ? 'Kritische IKT-Risiken' : 'Critical ICT Risks'} — {critRisks.length}</span>
          </div>
          <div className="px-4 py-3 text-sm space-y-2">
            {critRisks.map(ri => (
              <div key={ri.id} className="flex items-start gap-3">
                <span className="font-mono text-xs text-destructive font-bold bg-destructive/10 px-1.5 py-0.5 rounded flex-shrink-0">{riskId(ri)}</span>
                <div className="flex-1">
                  <span className="font-semibold text-foreground">{ri.name}</span>
                  <span className="text-muted-foreground"> — {ri.component}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">Score: <span className="font-mono font-bold text-destructive">{ri.likelihood}x{ri.impact}={ri.likelihood * ri.impact}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QA History */}
      {qaHistory.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{language === 'de' ? 'Pruefverlauf' : 'Check History'}</div>
          <div className="flex gap-2 flex-wrap">
            {qaHistory.map((h, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border ${i === qaHistory.length - 1 ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                <span className="font-bold text-foreground">#{h.iteration}</span>
                <span className={h.verdict === 'passed' ? 'text-green-500' : h.verdict === 'conditional' ? 'text-yellow-500' : 'text-destructive'}>{h.passed}/{h.total}</span>
                {h.fixes.length > 0 && <span className="text-primary">+{h.fixes.length} fixes</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QA Result */}
      {qaResult && qaExpanded && (
        <div className={`bg-card border-2 rounded-lg overflow-hidden ${qaVerdict === 'passed' ? 'border-green-500/40' : qaVerdict === 'conditional' ? 'border-yellow-500/40' : 'border-destructive/40'}`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${qaVerdict === 'passed' ? 'bg-green-500/10 border-green-500/20' : qaVerdict === 'conditional' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
            <div className="flex items-center gap-2">
              {qaVerdict === 'passed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : qaVerdict === 'conditional' ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
              <span className={`text-sm font-bold ${qaVerdict === 'passed' ? 'text-green-500' : qaVerdict === 'conditional' ? 'text-yellow-500' : 'text-destructive'}`}>{qaResult.verdictLabel}</span>
              {qaIteration > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">#{qaIteration}</span>}
            </div>
            <span className="text-xs font-mono text-muted-foreground">{qaResult.passed}/{qaResult.total}</span>
          </div>
          <div className="px-4 py-3 space-y-4 text-sm">
            <div className="bg-secondary rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${qaVerdict === 'passed' ? 'bg-green-500' : qaVerdict === 'conditional' ? 'bg-yellow-500' : 'bg-destructive'}`} style={{ width: `${Math.round((qaResult.passed / qaResult.total) * 100)}%` }} />
            </div>
            {(['consistency', 'technical', 'evidence', 'editorial', 'regulatory'] as const).map(cat => {
              const catChecks = qaResult.checks.filter(c => c.category === cat);
              if (catChecks.length === 0) return null;
              const catPassed = catChecks.filter(c => c.passed).length;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-foreground text-xs">{CATEGORY_LABELS[cat]}</span>
                    <span className="text-xs font-mono text-muted-foreground">{catPassed}/{catChecks.length}</span>
                  </div>
                  <div className="space-y-1">
                    {catChecks.map(check => (
                      <div key={check.id} className="flex items-start gap-2 text-xs">
                        <span className="flex-shrink-0 mt-0.5">{check.passed ? '✅' : '❌'}</span>
                        <div className="flex-1">
                          <span className={check.passed ? 'text-foreground' : 'text-destructive font-medium'}>{check.label}</span>
                          <span className="text-muted-foreground ml-1.5">— {check.detail}</span>
                        </div>
                        {!check.passed && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${check.severity === 'critical' ? 'bg-destructive/10 text-destructive' : check.severity === 'major' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {check.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {qaResult.corrections.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="font-semibold text-destructive text-xs mb-1">{language === 'de' ? 'Korrekturanweisungen (zwingend):' : 'Required corrections:'}</div>
                <ul className="space-y-0.5 text-xs text-foreground">
                  {qaResult.corrections.map((c, i) => <li key={i} className="flex gap-1.5"><span className="text-destructive font-mono">{i + 1}.</span>{c}</li>)}
                </ul>
              </div>
            )}
            {qaResult.failed > 0 && !fixesApplied && (
              <div className="border-t border-border pt-3 flex items-center gap-2 text-xs text-primary">
                <Wrench className="w-3.5 h-3.5" />
                <span className="font-medium">{language === 'de' ? `${qaResult.failed} Befunde koennen automatisch korrigiert werden` : `${qaResult.failed} findings can be auto-corrected`}</span>
              </div>
            )}
            {fixesApplied && (
              <div className="border-t border-border pt-3 flex items-center gap-2 text-xs text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-medium">{language === 'de' ? 'Korrekturen angewendet — erneuter Check oder PDF Final moeglich' : 'Corrections applied — re-check or Final available'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fix Log */}
      {fixesApplied && fixLog.length > 0 && (
        <div className="bg-card border-2 border-primary/30 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/20 bg-primary/5 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{language === 'de' ? 'Automatisch umgesetzte Korrekturen' : 'Automatically applied corrections'}</span>
            <span className="text-xs font-mono text-muted-foreground ml-auto">{fixLog.length} fixes</span>
          </div>
          <div className="px-4 py-3">
            <ul className="space-y-1 text-xs text-foreground">
              {fixLog.map((f, i) => (
                <li key={i} className="flex gap-2 items-start"><CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /><span>{f}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ═══ FINDINGS & FIXES DASHBOARD ═══ */}
      {qaResult && (
        <div className="bg-card border border-border rounded-xl p-5">
          <DoraFindingsView
            risks={localRisks}
            reqs={localReqs}
            qaResult={qaResult}
            preFixChecks={preFixQaChecks}
            fixLog={fixLog}
            fixesApplied={fixesApplied}
          />
        </div>
      )}

      {/* ═══ FULL DASHBOARD (after fixes) ═══ */}
      {fixesApplied && (
        <details className="bg-card border border-border rounded-xl overflow-hidden">
          <summary className="px-5 py-3 cursor-pointer text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            📊 {language === 'de' ? 'Vollständiges Auswertungs-Dashboard anzeigen' : 'Show full assessment dashboard'}
          </summary>
          <div className="px-5 pb-5">
            <DoraAuditCharts risks={localRisks} reqs={localReqs} />
          </div>
        </details>
      )}

      {/* Export Bar */}
      <div className="bg-secondary border border-border rounded-lg p-4">
        <div className="text-sm text-foreground mb-3">
          <div className="font-semibold mb-0.5">{t('dora.rpExport')}</div>
          <div className="text-xs text-muted-foreground">
            {qaIteration > 0
              ? `${language === 'de' ? 'Durchlauf' : 'Run'} ${qaIteration} — ${fixesApplied ? (language === 'de' ? 'Korrekturen angewendet' : 'Fixes applied') : qaResult ? (language === 'de' ? 'Ergebnisse vorliegend' : 'Results available') : ''}`
              : t('dora.rpExportHint')}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(() => {
            const activeClass = 'bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/30';
            const doneClass = 'bg-card border border-primary/40 text-primary hover:bg-accent';
            const disabledClass = 'bg-muted text-muted-foreground cursor-not-allowed';
            const defaultClass = 'bg-card border border-border text-foreground hover:bg-accent';

            const qaIsNext = !qaResult || fixesApplied;
            const fixesIsNext = qaResult && qaResult.failed > 0 && !fixesApplied && !fixesRunning;
            const finalIsNext = fixesApplied || qaVerdict === 'passed' || qaVerdict === 'conditional';

            return (
              <>
                <button onClick={handleQaCheck} disabled={qaRunning} className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 ${qaRunning ? activeClass : qaIsNext ? activeClass : qaResult && !fixesApplied ? doneClass : defaultClass}`}>
                  {qaRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span className="font-mono text-xs opacity-60 mr-0.5">1</span>
                  {qaRunning ? (language === 'de' ? 'Pruefe...' : 'Checking...') : (fixesApplied ? (language === 'de' ? 'Erneut pruefen' : 'Re-check') : (language === 'de' ? 'Pruefung starten' : 'Start Audit'))}
                  {qaIteration > 0 && <span className="text-[10px] font-mono opacity-60">#{qaIteration}</span>}
                </button>
                <span className="text-muted-foreground text-xs hidden sm:inline">{'>'}</span>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={handleApplyFixes} disabled={!qaResult || qaResult.failed === 0 || fixesApplied || fixesRunning} className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 ${fixesRunning ? activeClass : fixesIsNext ? activeClass : fixesApplied ? doneClass : (!qaResult || qaResult.failed === 0) ? disabledClass : defaultClass}`}>
                    {fixesRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : fixesApplied ? <CheckCircle2 className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                    <span className="font-mono text-xs opacity-60 mr-0.5">2</span>
                    {fixesRunning ? (language === 'de' ? 'Wird umgesetzt...' : 'Applying...') : (language === 'de' ? 'Empfehlungen umsetzen' : 'Apply Fixes')}
                  </button>
                  {fixesRunning && <Progress value={fixProgress} className="w-full h-1.5 mt-1" />}
                </div>
                <span className="text-muted-foreground text-xs hidden sm:inline">{'>'}</span>
                <button onClick={handleFinalPdf} disabled={!canFinal || finalPdfRunning} className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${finalPdfRunning ? activeClass : finalIsNext && canFinal ? activeClass : !canFinal ? disabledClass : defaultClass}`}>
                  {finalPdfRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span className="font-mono text-xs opacity-60 mr-0.5">3</span>
                  {finalPdfRunning ? (language === 'de' ? 'Wird erstellt...' : 'Generating...') : 'PDF Final'}
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </StaggerReveal>
  );
}

// ── Main ──────────────────────────────────────────────────────

const MAIN_STEPS_DE = ['Datenerfassung', 'IKT-Risikolandschaft', 'Risikomatrix', 'DORA-Mapping', 'Report & Export'];
const MAIN_STEPS_EN = ['Data Collection', 'ICT Risk Landscape', 'Risk Matrix', 'DORA Mapping', 'Report & Export'];

const DoraComplianceTool = ({ embedded }: { embedded?: boolean }) => {
  const { t, language } = useLanguage();
  const [step, setStepRaw] = useState(0);
  const [loading, setLoading] = useState(false);
  const [intakeData, setIntakeData] = useState<DoraIntakeData>(EMPTY_INTAKE);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setStep = useCallback((s: number) => {
    setStepRaw(s);
    setTimeout(scrollToTop, 50);
  }, [scrollToTop]);

  const mainSteps = language === 'de' ? MAIN_STEPS_DE : MAIN_STEPS_EN;

  const handleIntakeFinish = useCallback((data: DoraIntakeData) => {
    setIntakeData(data);
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 2000);
  }, [setStep]);

  const reset = useCallback(() => {
    setStep(0);
    setIntakeData(EMPTY_INTAKE);
  }, [setStep]);

  const progressPct = ((step + 1) / mainSteps.length) * 100;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="DORA Compliance Tool" description="DORA Konformitaetspruefung nach (EU) 2022/2554" />}

      <div className="px-4 md:px-8 lg:px-12 pt-6 pb-2 max-w-5xl" ref={contentRef}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          DORA Compliance Audit
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {language === 'de' ? 'Konformitätsprüfung nach (EU) 2022/2554 – Digital Operational Resilience Act' : 'Conformity assessment per (EU) 2022/2554 – Digital Operational Resilience Act'}
        </p>
      </div>

      <div className="border-b border-border px-4 py-3 mb-1">
        <div className="flex items-center max-w-5xl overflow-x-auto">
          {mainSteps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'text-primary hover:bg-primary/10 cursor-pointer' : 'text-muted-foreground cursor-not-allowed'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === step ? 'bg-primary-foreground text-primary' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>{i < step ? '✓' : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < mainSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>
      </div>

      <Progress value={progressPct} className="h-1 rounded-none" />

      <div className="max-w-5xl px-4 md:px-8 lg:px-12 py-6">
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-5" />
            <div className="text-foreground font-semibold text-lg mb-2">{language === 'de' ? 'Analysiere IKT-Risiken...' : 'Analysing ICT risks...'}</div>
            <div className="text-muted-foreground text-sm">{language === 'de' ? 'DORA-Konformitaetspruefung wird durchgefuehrt' : 'DORA compliance assessment in progress'}</div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-foreground" key={`main-${step}`}><Typewriter text={mainSteps[step]} mode="typewriter" charDelay={10} cursor={false} /></div>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-1" /> {language === 'de' ? 'Neustart' : 'Restart'}
                </Button>
              )}
            </div>
            {step === 0 && <IntakeWizard onFinish={handleIntakeFinish} />}
            {step === 1 && <RiskLandscape risks={DORA_RISKS} onNext={() => setStep(2)} />}
            {step === 2 && <RiskMatrix risks={DORA_RISKS} onNext={() => setStep(3)} />}
            {step === 3 && <DORAMapping reqs={DORA_REQS} onNext={() => setStep(4)} />}
            {step === 4 && <ReportView intakeData={intakeData} risks={DORA_RISKS} reqs={DORA_REQS} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoraComplianceTool;
