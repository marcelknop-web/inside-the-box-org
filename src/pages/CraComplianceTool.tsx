import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import Typewriter from '@/components/Typewriter';
import { StaggerReveal } from '@/components/StaggerReveal';
import {
  getProductTypes, getCraClasses, getDeploymentOpts,
  INTERFACE_OPTS, getSecurityMeasures, getSecurityCategories,
  getAttachTypes, THREATS, CRA_REQS, getStrideMeta,
  type Threat, type CraReq, type IntakeData, type MeasureEntry, EMPTY_INTAKE,
} from '@/data/craData';

// ── Helpers ─────────────────────────────────────────────────────

function riskLevel(l: number, i: number, t: (k: string) => string) {
  const s = l * i;
  if (s >= 20) return { label: t('cra.critical'), cls: 'bg-destructive text-destructive-foreground' };
  if (s >= 13) return { label: t('cra.high'), cls: 'bg-orange-500 text-white' };
  if (s >= 6) return { label: t('cra.medium'), cls: 'bg-yellow-500 text-black' };
  return { label: t('cra.low'), cls: 'bg-green-500 text-white' };
}

const StatusBadge = memo(({ status, t }: { status: string; t: (k: string) => string }) => {
  if (status === 'pass') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">{t('cra.statusPass')}</span>;
  if (status === 'partial') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{t('cra.statusPartial')}</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">{t('cra.statusFail')}</span>;
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
    <div className={`border rounded-lg px-4 py-3 text-sm text-foreground ${colors[color]}`}>
      {title ? <div className="font-semibold mb-1">{icon} <Typewriter text={title} mode="typewriter" delay={400} charDelay={8} cursor={false} /></div> : <span className="font-semibold">{icon} </span>}
      <span>{children}</span>
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
  <button onClick={onClick} className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 text-left transition-all ${selected ? 'border-primary bg-primary/10 text-foreground shadow-sm' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary'}`}>
    {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
    <div>
      <div className="font-medium">{label}</div>
      {desc && <div className="text-xs opacity-70 mt-0.5">{desc}</div>}
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
      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{t('cra.criteriaHeader')}</div>
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

function IntakeWizard({ onFinish }: { onFinish: (d: IntakeData) => void }) {
  const { t, tArray } = useLanguage();
  const [sub, setSub] = useState(0);
  const [d, setD] = useState<IntakeData>(EMPTY_INTAKE);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const productTypes = useMemo(() => getProductTypes(t), [t]);
  const craClasses = useMemo(() => getCraClasses(t), [t]);
  const deploymentOpts = useMemo(() => getDeploymentOpts(t), [t]);
  const componentOpts = useMemo(() => tArray('cra.components'), [t]);
  const rolePresets = useMemo(() => tArray('cra.roles'), [t]);
  const securityMeasures = useMemo(() => getSecurityMeasures(t), [t]);
  const securityCategories = useMemo(() => getSecurityCategories(t), [t]);
  const attachTypes = useMemo(() => getAttachTypes(t), [t]);

  const setField = useCallback((field: keyof IntakeData, val: unknown) => {
    setD(prev => ({ ...prev, [field]: val }));
  }, []);

  const toggleArray = useCallback((field: keyof IntakeData, val: string) => {
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
    d.productName.trim().length > 0 && d.productTypes.length > 0,
    true, true, true,
    d.roles.length > 0,
    true, true,
  ], [d.productName, d.productTypes.length, d.roles.length]);

  const isSummary = sub === 7;

  let stepContent: React.ReactNode;
  switch (sub) {
    case 0:
      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={0} total={INTAKE_STEPS} title={t('cra.step0Title')} subtitle={t('cra.step0Sub')} />
          <InfoBox icon="💡" color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step0Info') }} /></InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.productName')}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('cra.productNamePh')} value={d.productName} onChange={e => setField('productName', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.version')}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('cra.versionPh')} value={d.version} onChange={e => setField('version', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.productType')} <span className="normal-case font-normal text-muted-foreground/60">{t('cra.productTypeMulti')}</span></label>
            <div className="grid grid-cols-2 gap-2">
              {productTypes.map(pt => <Chip key={pt.id} label={pt.label} icon={pt.icon} desc={pt.desc} selected={d.productTypes.includes(pt.id)} onClick={() => toggleArray('productTypes', pt.id)} />)}
            </div>
          </div>
        </div>
      );
      break;
    case 1:
      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={1} total={INTAKE_STEPS} title={t('cra.step1Title')} subtitle={t('cra.step1Sub')} />
          <InfoBox icon="📘" title={t('cra.step1InfoTitle')} color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step1Info') }} /></InfoBox>
          <div className="space-y-2">
            {craClasses.map(c => (
              <button key={c.id} onClick={() => setField('craClass', c.id)} className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all ${d.craClass === c.id ? c.color + ' shadow' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{c.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{c.desc}</div>
                    <div className="text-xs text-muted-foreground/60 mt-1">{t('cra.examples')}: {c.example}</div>
                  </div>
                  {d.craClass === c.id && <span className="text-lg mt-0.5 flex-shrink-0 text-primary">✓</span>}
                </div>
              </button>
            ))}
          </div>
          <InfoBox icon="🤔" color="amber"><span dangerouslySetInnerHTML={{ __html: t('cra.step1Hint') }} /></InfoBox>
        </div>
      );
      break;
    case 2:
      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={2} total={INTAKE_STEPS} title={t('cra.step2Title')} subtitle={t('cra.step2Sub')} />
          <InfoBox icon="💡" color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step2Info') }} /></InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('cra.sysDesc')}</label>
            <div className="text-xs text-muted-foreground/60 mb-2">{t('cra.sysDescExample')}</div>
            <textarea rows={4} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder={t('cra.sysDescPh')} value={d.description} onChange={e => setField('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.techComponents')} <span className="normal-case font-normal text-muted-foreground/60">{t('cra.techComponentsMulti')}</span></label>
            <div className="flex flex-wrap gap-2">
              {componentOpts.map(c => (
                <button key={c} onClick={() => toggleArray('components', c)} className={`border rounded-full px-3 py-1.5 text-xs font-medium transition-all ${d.components.includes(c) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{d.components.includes(c) ? '✓ ' : ''}{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.deployment')}</label>
            <div className="flex flex-wrap gap-2">
              {deploymentOpts.map(o => (
                <button key={o.id} onClick={() => setField('deployment', o.id)} className={`border rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${d.deployment === o.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{o.icon} {o.label}</button>
              ))}
            </div>
          </div>
        </div>
      );
      break;
    case 3:
      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={3} total={INTAKE_STEPS} title={t('cra.step3Title')} subtitle={t('cra.step3Sub')} />
          <InfoBox icon="💡" color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step3Info') }} /></InfoBox>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTERFACE_OPTS.map(o => (
              <button key={o.label} onClick={() => toggleArray('interfaces', o.label)} className={`border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 transition-all ${d.interfaces.includes(o.label) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
                <span>{o.icon}</span><span className="flex-1">{o.label}</span>{d.interfaces.includes(o.label) && <span className="text-xs text-primary">✓</span>}
              </button>
            ))}
          </div>
          {d.interfaces.some(i => i.includes('unverschl') || i === 'HTTP' || i === 'FTP/SFTP') && (
            <InfoBox icon="⚠️" color="amber"><span dangerouslySetInnerHTML={{ __html: t('cra.step3Warn') }} /></InfoBox>
          )}
        </div>
      );
      break;
    case 4:
      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={4} total={INTAKE_STEPS} title={t('cra.step4Title')} subtitle={t('cra.step4Sub')} />
          <InfoBox icon="💡" color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step4Info') }} /></InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.commonRoles')}</label>
            <div className="flex flex-wrap gap-2">
              {rolePresets.map(r => (
                <button key={r} onClick={() => addRole(r)} className={`border rounded-full px-3 py-1.5 text-xs font-medium transition-all ${d.roles.includes(r) ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{d.roles.includes(r) ? '✓ ' : ''}{r}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder={t('cra.customRolePh')} value={d.customRole} onChange={e => setField('customRole', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRole(d.customRole); }} />
            <Button onClick={() => addRole(d.customRole)} className="font-medium">{t('cra.addRole')}</Button>
          </div>
          {d.roles.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.selectedRoles')}</label>
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
        </div>
      );
      break;
    case 5: {
      const toggleMeasure = (id: string) => {
        setD(prev => {
          const existing = prev.measures[id];
          if (existing) {
            // Remove if toggling off
            const { [id]: _, ...rest } = prev.measures;
            return { ...prev, measures: rest };
          }
          return { ...prev, measures: { ...prev.measures, [id]: { active: true, documented: false, audited: false } } };
        });
      };
      const setMeasureProp = (id: string, prop: 'documented' | 'audited', val: boolean) => {
        setD(prev => {
          const entry = prev.measures[id];
          if (!entry) return prev;
          return { ...prev, measures: { ...prev.measures, [id]: { ...entry, [prop]: val } } };
        });
      };
      const maturityLabel = (entry: MeasureEntry) => {
        if (entry.active && entry.documented && entry.audited) return t('cra.maturityFull');
        if (entry.active && entry.documented) return t('cra.maturityPartial');
        return t('cra.maturityBasic');
      };
      const maturityColor = (entry: MeasureEntry) => {
        if (entry.active && entry.documented && entry.audited) return 'text-green-400';
        if (entry.active && entry.documented) return 'text-yellow-400';
        return 'text-orange-400';
      };

      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={5} total={INTAKE_STEPS} title={t('cra.step5Title')} subtitle={t('cra.step5Sub')} />
          <InfoBox icon="💡" color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step5Info') }} /></InfoBox>
          {securityCategories.map(cat => (
            <div key={cat}>
              <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{cat}</div>
              <div className="space-y-1.5">
                {securityMeasures.filter(m => m.cat === cat).map(m => {
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
                        <div className="flex gap-4 px-10 pb-2.5 -mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.documented} onChange={e => setMeasureProp(m.id, 'documented', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('cra.documented')}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.audited} onChange={e => setMeasureProp(m.id, 'audited', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t('cra.audited')}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('cra.knownIssues')}</label>
            <div className="text-xs text-muted-foreground/60 mb-2">{t('cra.knownIssuesHint')}</div>
            <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder={t('cra.knownIssuesPh')} value={d.knownIssues} onChange={e => setField('knownIssues', e.target.value)} />
          </div>
        </div>
      );
      break;
    }
    case 6:
      stepContent = (
        <div className="space-y-5">
          <SubStepHeader current={5} total={INTAKE_STEPS} title={t('cra.step6Title')} subtitle={t('cra.step6Sub')} />
          <InfoBox icon="💡" color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.step6Info') }} /></InfoBox>
          <div className="grid grid-cols-1 gap-2">
            {attachTypes.map(at => (
              <button key={at.id} onClick={() => { setActiveUploadType(at.id); if (fileRef.current) { fileRef.current.accept = at.accept; fileRef.current.click(); } }} className="flex items-center gap-3 border-2 border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all text-left">
                <span className="text-xl">{at.icon}</span>
                <div>
                  <div className="font-medium">{at.label} {t('cra.upload')}</div>
                  <div className="text-xs text-muted-foreground/60">{at.accept.replace(/\*/g, t('cra.allFormats'))}</div>
                </div>
                <span className="ml-auto text-muted-foreground/40">+</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" multiple onChange={handleFileChange} className="hidden" />
          {d.files.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('cra.uploadedFiles')} ({d.files.length})</div>
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
          <InfoBox icon="🔒" color="green">{t('cra.filePrivacy')}</InfoBox>
        </div>
      );
      break;
    case 7:
      stepContent = (
        <div className="space-y-4">
          <SubStepHeader current={5} total={INTAKE_STEPS} title={t('cra.summaryTitle')} subtitle={t('cra.summarySub')} />
          {[
            { label: t('cra.sumProduct'), val: `${d.productName} ${d.version}`.trim() },
            { label: t('cra.sumType'), val: d.productTypes.map(id => productTypes.find(pt => pt.id === id)?.label).join(', ') || '—' },
            { label: t('cra.sumClass'), val: craClasses.find(c => c.id === d.craClass)?.label || '—' },
            { label: t('cra.sumComponents'), val: d.components.length > 0 ? d.components.join(', ') : '—' },
            { label: t('cra.sumInterfaces'), val: d.interfaces.length > 0 ? d.interfaces.join(', ') : '—' },
            { label: t('cra.sumRoles'), val: d.roles.length > 0 ? d.roles.join(', ') : '—' },
            { label: t('cra.sumMeasures'), val: (() => { const cnt = Object.keys(d.measures).length; return cnt > 0 ? `${cnt} ${t('cra.sumMeasuresSelected')}` : t('cra.sumMeasuresNone'); })() },
            { label: t('cra.sumAttach'), val: d.files.length > 0 ? `${d.files.length} ${t('cra.sumFiles')}` : t('cra.sumFilesNone') },
          ].map(({ label, val }) => (
            <div key={label} className="flex gap-3 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
              <span className="text-foreground font-medium">{val}</span>
            </div>
          ))}
          {d.knownIssues && <div className="text-sm border-b border-border/50 pb-2"><span className="text-muted-foreground">{t('cra.sumKnownGaps')}: </span><span className="text-foreground">{d.knownIssues}</span></div>}
        </div>
      );
      break;
  }

  return (
    <div>
      {stepContent}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <button onClick={() => setSub(s => s - 1)} disabled={sub === 0} className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${sub === 0 ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground hover:bg-secondary'}`}>{t('cra.back')}</button>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_WIZARD_PAGES }).map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === sub ? 'bg-primary w-3' : i < sub ? 'bg-primary/40' : 'bg-secondary'}`} />)}
        </div>
        {isSummary
          ? <Button onClick={() => onFinish(d)} className="font-semibold shadow-md">{t('cra.startAnalysis')}</Button>
          : <Button onClick={() => setSub(s => s + 1)} disabled={!canNext[sub]} className="font-semibold shadow-sm">
            {sub === 6 ? t('cra.toSummary') : t('cra.next')}
          </Button>
        }
      </div>
    </div>
  );
}

// ── Phase 2: Threat Model ─────────────────────────────────────

function ThreatModel({ threats, onNext }: { threats: Threat[]; onNext: () => void }) {
  const { t } = useLanguage();
  const [exp, setExp] = useState<number | null>(null);
  const strideMeta = useMemo(() => getStrideMeta(t), [t]);
  const counts = useMemo(() => Object.fromEntries('STRIDE'.split('').map(c => [c, threats.filter(th => th.stride === c).length])), [threats]);

  return (
    <StaggerReveal resetKey={`tm`} stagger={350}>
      <InfoBox icon="🛡️" title={t('cra.tmInfoTitle')} color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.tmInfo') }} /></InfoBox>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(strideMeta).map(([k, m]) => (
          <div key={k} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className={`w-8 h-8 rounded-full ${m.dot} text-white font-bold text-sm flex items-center justify-center mx-auto mb-1`}>{k}</div>
            <div className="text-xs text-muted-foreground leading-tight">{m.label}</div>
            <div className="text-xl font-bold text-foreground font-mono">{counts[k] || 0}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {threats.map(th => {
          const meta = strideMeta[th.stride];
          const risk = riskLevel(th.likelihood, th.impact, t);
          const isOpen = exp === th.id;
          return (
            <div key={th.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50" onClick={() => setExp(isOpen ? null : th.id)}>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${meta.badge}`}>{th.stride}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{th.name}</div>
                  <div className="text-xs text-muted-foreground">{th.component}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${risk.cls}`}>{risk.label} (<span className="font-mono">{th.likelihood * th.impact}</span>)</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3 text-sm space-y-3">
                  <div><span className="font-semibold text-muted-foreground">{t('cra.tmAttacker')}: </span><span className="text-foreground">{th.attacker}</span></div>
                  <div><span className="font-semibold text-muted-foreground">{t('cra.tmPath')}: </span><span className="text-foreground">{th.path}</span></div>
                  <EvidenceBlock label={t('cra.tmEvidence')}>{th.evidence}</EvidenceBlock>
                  <EvidenceBlock label={t('cra.tmRationale')}>{th.rationale}</EvidenceBlock>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div><div className="text-xs text-muted-foreground mb-1">Likelihood (<span className="font-mono">{th.likelihood}/5</span>)</div><ScoreBar value={th.likelihood} /></div>
                    <div><div className="text-xs text-muted-foreground mb-1">Impact (<span className="font-mono">{th.impact}/5</span>)</div><ScoreBar value={th.impact} /></div>
                  </div>
                  {th.sources.length > 0 && (
                    <div className="pt-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('cra.tmSources')}</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {th.sources.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-primary/60">›</span>{s}</li>)}
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
        <Button onClick={onNext} className="font-semibold">{t('cra.tmNext')}</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 3: Risk Assessment ──────────────────────────────────

function RiskAssessment({ threats, onNext }: { threats: Threat[]; onNext: () => void }) {
  const { t } = useLanguage();
  const sorted = useMemo(() => [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)), [threats]);
  const cnt = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    sorted.forEach(th => {
      const s = th.likelihood * th.impact;
      if (s >= 20) c.critical++;
      else if (s >= 13) c.high++;
      else if (s >= 6) c.medium++;
      else c.low++;
    });
    return c;
  }, [sorted]);

  const matrixColor = (s: number) => s >= 20 ? 'bg-red-500' : s >= 13 ? 'bg-orange-400' : s >= 6 ? 'bg-yellow-300' : 'bg-green-300';

  return (
    <StaggerReveal resetKey={`ra`} stagger={350}>
      <InfoBox icon="⚖️" title={t('cra.raInfoTitle')} color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.raInfo') }} /></InfoBox>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          [t('cra.critical'), 'bg-destructive', cnt.critical],
          [t('cra.high'), 'bg-orange-500', cnt.high],
          [t('cra.medium'), 'bg-yellow-500', cnt.medium],
          [t('cra.low'), 'bg-green-500', cnt.low],
        ] as [string, string, number][]).map(([l, c, n]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${c} text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2`}>{n}</div>
            <div className="text-sm font-semibold text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm font-semibold text-foreground mb-3">{t('cra.raMatrix')}</div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="w-20 text-right pr-3 text-muted-foreground font-normal pb-1">Impact ↑</th>
                {[1, 2, 3, 4, 5].map(i => <th key={i} className="w-12 text-center text-muted-foreground font-semibold pb-1 font-mono">{i}</th>)}
                <th className="pl-2 text-muted-foreground font-normal">← Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(imp => (
                <tr key={imp}>
                  <td className="text-right pr-3 text-muted-foreground font-semibold py-0.5 font-mono">{imp}</td>
                  {[1, 2, 3, 4, 5].map(lik => {
                    const score = lik * imp;
                    const pts = threats.filter(th => th.likelihood === lik && th.impact === imp);
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
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {([
              ['bg-red-500', t('cra.raCritGte20')],
              ['bg-orange-400', t('cra.raHigh1319')],
              ['bg-yellow-300', t('cra.raMed612')],
              ['bg-green-300', t('cra.raLow15')],
            ] as [string, string][]).map(([c, l]) => (
              <span key={l} className="flex items-center gap-1"><span className={`w-3 h-3 rounded ${c} inline-block`} />{l}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-secondary border-b border-border text-sm font-semibold text-foreground">{t('cra.raAllRisks')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">{t('cra.raThreat')}</th>
                <th className="px-3 py-2 text-center w-10">L</th>
                <th className="px-3 py-2 text-center w-10">I</th>
                <th className="px-3 py-2 text-center w-14">Score</th>
                <th className="px-4 py-2 text-center w-24">{t('cra.raPriority')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((th, idx) => {
                const risk = riskLevel(th.likelihood, th.impact, t);
                return (
                  <tr key={th.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}>
                    <td className="px-4 py-2.5"><div className="font-medium text-foreground">{th.name}</div><div className="text-xs text-muted-foreground">{th.component}</div></td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground font-mono">{th.likelihood}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground font-mono">{th.impact}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground font-mono">{th.likelihood * th.impact}</td>
                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${risk.cls}`}>{risk.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">{t('cra.raNext')}</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 4: CRA Mapping ──────────────────────────────────────

function CRAMapping({ reqs, onNext }: { reqs: CraReq[]; onNext: () => void }) {
  const { t } = useLanguage();
  const [exp, setExp] = useState<string | null>(null);
  const { pass, partial, fail, score, scoreColor, strokeColor } = useMemo(() => {
    const p = reqs.filter(r => r.status === 'pass').length;
    const pa = reqs.filter(r => r.status === 'partial').length;
    const f = reqs.filter(r => r.status === 'fail').length;
    const s = Math.round((p * 100 + pa * 50) / reqs.length);
    return {
      pass: p, partial: pa, fail: f, score: s,
      scoreColor: s >= 70 ? 'text-green-500' : s >= 40 ? 'text-yellow-500' : 'text-destructive',
      strokeColor: s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#dc2626',
    };
  }, [reqs]);

  return (
    <StaggerReveal resetKey={`cm`} stagger={350}>
      <InfoBox icon="📋" title={t('cra.cmInfoTitle')} color="blue"><span dangerouslySetInnerHTML={{ __html: t('cra.cmInfo') }} /></InfoBox>
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
          <div className="text-base font-bold text-foreground mb-1">{t('cra.cmReadiness')}</div>
          <div className="text-sm text-muted-foreground mb-3">{reqs.length} {t('cra.cmChecked')}</div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{pass} {t('cra.cmPassed')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />{partial} {t('cra.cmPartial')}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive inline-block" />{fail} {t('cra.cmGaps')}</span>
          </div>
        </div>
        <div className="text-center sm:text-right flex-shrink-0">
          <div className="text-4xl font-bold text-destructive font-mono">{fail}</div>
          <div className="text-sm text-muted-foreground">{t('cra.cmCritGaps')}</div>
          <div className="text-xs text-muted-foreground/60">{t('cra.cmCloseBeforeAudit')}</div>
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
                  <EvidenceBlock label={t('cra.tmEvidence')}>{r.evidence}</EvidenceBlock>
                  {r.gap && <div><span className="font-semibold text-destructive">{t('cra.cmGapLabel')}: </span><span className="text-foreground">{r.gap}</span></div>}
                  <EvidenceBlock label={t('cra.tmRationale')}>{r.rationale}</EvidenceBlock>
                  <div><span className="font-semibold text-primary">{t('cra.cmMeasure')}: </span><span className="text-foreground">{r.measure}</span></div>
                  <CriteriaBlock criteria={r.criteria} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">{t('cra.cmNext')}</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 5: Report ───────────────────────────────────────────

function ReportView({ intakeData, threats, reqs }: { intakeData: IntakeData; threats: Threat[]; reqs: CraReq[] }) {
  const { t, language } = useLanguage();
  const critRisks = useMemo(() => threats.filter(th => th.likelihood * th.impact >= 20), [threats]);
  const failReqs = useMemo(() => reqs.filter(r => r.status === 'fail'), [reqs]);
  const partialCount = useMemo(() => reqs.filter(r => r.status === 'partial').length, [reqs]);
  const today = useMemo(() => {
    const locale = language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  }, [language]);

  const productTypes = useMemo(() => getProductTypes(t), [t]);
  const craClasses = useMemo(() => getCraClasses(t), [t]);
  const typeName = intakeData.productTypes?.map(id => productTypes.find(pt => pt.id === id)?.label).join(', ') || '';
  const craName = craClasses.find(c => c.id === intakeData.craClass)?.label || intakeData.craClass || '—';

  const introHtml = useMemo(() => {
    return t('cra.rpIntro')
      .replace('{product}', `${intakeData.productName} ${intakeData.version}`)
      .replace('{type}', typeName)
      .replace('{cls}', craName)
      .replace('{date}', today)
      .replace('{threats}', String(threats.length))
      .replace('{critRisks}', String(critRisks.length))
      .replace('{reqs}', String(reqs.length))
      .replace('{failReqs}', String(failReqs.length))
      .replace('{partial}', String(partialCount));
  }, [t, intakeData, typeName, craName, today, threats.length, critRisks.length, reqs.length, failReqs.length, partialCount]);

  return (
    <div className="space-y-4">
      <InfoBox icon="✅" title={t('cra.rpDone')} color="green"><span dangerouslySetInnerHTML={{ __html: t('cra.rpDoneInfo') }} /></InfoBox>
      <div className="bg-card border-l-4 border-primary rounded-lg p-5 border border-border">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('cra.rpTitle')}</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{intakeData.productName} {intakeData.version}</div>
          </div>
          <div className="sm:text-right text-xs text-muted-foreground">
            <div>{today}</div>
            <div className="mt-0.5">{craName}</div>
          </div>
        </div>
        <div className="h-px bg-border mb-3" />
        <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: introHtml }} />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <span className="text-sm font-bold text-destructive">{t('cra.rpImmediate')} — {failReqs.length} {t('cra.rpCritGaps')}</span>
        </div>
        {failReqs.map((r, i) => (
          <div key={r.id} className={`px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'} ${i < failReqs.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="flex gap-3">
              <span className="font-bold text-destructive w-5 flex-shrink-0 font-mono">{i + 1}.</span>
              <div className="flex-1 space-y-2">
                <div>
                  <div className="font-semibold text-foreground">{r.name}</div>
                  <div className="text-muted-foreground/60 text-xs">{r.article}</div>
                </div>
                <div className="text-xs"><span className="font-semibold text-muted-foreground">{t('cra.rpEvidence')}: </span>{r.evidence}</div>
                <div className="text-xs"><span className="font-semibold text-muted-foreground">{t('cra.rpRationale')}: </span>{r.rationale}</div>
                <div className="text-xs"><span className="font-semibold text-primary">{t('cra.rpMeasure')}: </span>{r.measure}</div>
                <CriteriaBlock criteria={r.criteria} t={t} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([
          [t('cra.rpTotalThreats'), threats.length, 'text-foreground'],
          [t('cra.rpCritRisks'), critRisks.length, 'text-destructive'],
          [t('cra.rpCraGaps'), failReqs.length, 'text-destructive'],
        ] as [string, number, string][]).map(([l, n, c]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${c}`}>{n}</div>
            <div className="text-xs text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-foreground">
          <div className="font-semibold mb-0.5">{t('cra.rpExport')}</div>
          <div className="text-xs text-muted-foreground">{t('cra.rpExportHint')}</div>
        </div>
        <div className="flex gap-2">
          <button className="bg-primary/20 text-primary/40 text-sm font-semibold px-4 py-2 rounded-lg cursor-not-allowed" title={t('cra.rpExportBtn')}>DOCX</button>
          <button className="bg-secondary text-muted-foreground text-sm font-semibold px-4 py-2 rounded-lg cursor-not-allowed border border-border" title={t('cra.rpExportBtn')}>PDF</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

const CraComplianceTool = ({ embedded }: { embedded?: boolean }) => {
  const { t, tArray } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>(EMPTY_INTAKE);

  const mainSteps = useMemo(() => tArray('cra.mainSteps'), [t]);

  const handleIntakeFinish = useCallback((data: IntakeData) => {
    setIntakeData(data);
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 2000);
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setIntakeData(EMPTY_INTAKE);
  }, []);

  const progressPct = ((step + 1) / mainSteps.length) * 100;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="CRA Compliance Tool" description="AI Cyber Risk & CRA Compliance Assessment" />}

      <div className="border-b border-border px-4 py-3 mb-1">
        <div className="flex items-center max-w-5xl mx-auto overflow-x-auto">
          {mainSteps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  i === step ? 'bg-primary text-primary-foreground' : i < step ? 'text-primary hover:bg-primary/10 cursor-pointer' : 'text-muted-foreground cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === step ? 'bg-primary-foreground text-primary' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>{i < step ? '✓' : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < mainSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>
      </div>

      <Progress value={progressPct} className="h-1 rounded-none" />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-5" />
            <div className="text-foreground font-semibold text-lg mb-2">{t('cra.aiAnalyzing')}</div>
            <div className="text-muted-foreground text-sm">{t('cra.aiAnalyzingDesc')}</div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-foreground" key={`main-${step}`}><Typewriter text={mainSteps[step]} mode="typewriter" charDelay={10} cursor={false} /></div>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-1" /> {t('cra.restart')}
                </Button>
              )}
            </div>
            {step === 0 && <IntakeWizard onFinish={handleIntakeFinish} />}
            {step === 1 && <ThreatModel threats={THREATS} onNext={() => setStep(2)} />}
            {step === 2 && <RiskAssessment threats={THREATS} onNext={() => setStep(3)} />}
            {step === 3 && <CRAMapping reqs={CRA_REQS} onNext={() => setStep(4)} />}
            {step === 4 && <ReportView intakeData={intakeData} threats={THREATS} reqs={CRA_REQS} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CraComplianceTool;
