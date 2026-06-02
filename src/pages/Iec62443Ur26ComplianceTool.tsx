import { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, Loader2, FileText, ShieldCheck, Cloud, CloudUpload, Trash2, Check } from 'lucide-react';
import { applyAuditFixes } from '@/utils/iec62443Ur26AuditFixes';
import { generateIec62443Ur26Report } from '@/utils/iec62443Ur26ReportPdf';
import { detectLanguage, extractTexts } from '@/utils/detectLanguage';
import { Iec62443Ur26AuditCharts } from '@/components/Iec62443Ur26AuditCharts';
import { runQualityCheck, type QaResult, type QaCheck } from '@/utils/iec62443Ur26QualityCheck';
import QualityCheckPanel from '@/components/QualityCheckPanel';
import { PageMeta } from '@/components/PageMeta';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import Typewriter from '@/components/Typewriter';
import { StaggerReveal } from '@/components/StaggerReveal';
import {
  getSystemTypes, getSecurityLevels, getZoneConduits,
  PROTOCOL_OPTS, getSecurityMeasures, getSecurityCategories,
  getAttachTypes, IEC_THREATS, IEC_REQS, getReqs, FR_CATEGORIES, threatId,
  DEMO_SCENARIOS,
  type IecThreat, type IecReq, type IecIntakeData, type MeasureEntry, EMPTY_INTAKE,
} from '@/data/iec62443Ur26Data';
import { extractDocumentText } from '@/lib/documentExtraction';
import { assessDocuments, type ReqAssessment, type ReviewSummaryResult } from '@/lib/iecDocumentAssessment';
import { verdictFromStatus, VERDICT_LABELS, VERDICT_STYLES, originalRatingLabel, type IecVerdict } from '@/data/iec62443Data';
import { loadLocalDraft, saveLocalDraft, clearLocalDraft, sanitizeDraftFiles, saveCloudDraft, loadCloudDraft } from '@/lib/intakeDraft';
import { toast } from 'sonner';

const DRAFT_KEY = 'ur26';
const DRAFT_TOOL = 'E26';

// ── Helpers ─────────────────────────────────────────────────────

function riskLevel(l: number, i: number) {
  const s = l * i;
  if (s >= 20) return { label: 'Critical', cls: 'bg-destructive text-destructive-foreground' };
  if (s >= 13) return { label: 'High', cls: 'bg-orange-500 text-white' };
  if (s >= 6) return { label: 'Medium', cls: 'bg-yellow-500 text-black' };
  return { label: 'Low', cls: 'bg-green-500 text-white' };
}

const StatusBadge = memo(({ status }: { status: string }) => {
  const verdict = verdictFromStatus(status as IecReq['status']);
  const style = VERDICT_STYLES[verdict];
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${style.badge}`}>{VERDICT_LABELS[verdict].en}</span>;
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

function CriteriaBlock({ criteria }: { criteria: string[] }) {
  if (!criteria.length) return null;
  return (
    <div className="bg-background/50 border border-primary/20 rounded-md px-3 py-2">
      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Acceptance Criteria</div>
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

function IntakeWizard({ onFinish }: { onFinish: (d: IecIntakeData) => void }) {
  const { t } = useLanguage();
  const restored = useRef(loadLocalDraft<IecIntakeData>(DRAFT_KEY));
  const [sub, setSub] = useState(() => restored.current?.sub ?? 0);
  const [d, setD] = useState<IecIntakeData>(() =>
    restored.current ? sanitizeDraftFiles(restored.current.data) : EMPTY_INTAKE,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudCode, setCloudCode] = useState('');
  const [loadCode, setLoadCode] = useState('');

  // Auto-save every change locally (best-effort safety net).
  useEffect(() => {
    saveLocalDraft(DRAFT_KEY, { sub, data: d, savedAt: Date.now() });
  }, [sub, d]);

  const handleCloudSave = useCallback(async () => {
    setCloudBusy(true);
    try {
      const code = await saveCloudDraft(DRAFT_TOOL, d);
      setCloudCode(code);
      toast.success(`Saved to cloud — your restore code: ${code}`);
    } catch {
      toast.error('Cloud save failed. Your inputs are still saved locally.');
    } finally {
      setCloudBusy(false);
    }
  }, [d]);

  const handleCloudLoad = useCallback(async () => {
    const code = loadCode.trim();
    if (!code) return;
    setCloudBusy(true);
    try {
      const { data: loaded } = await loadCloudDraft<IecIntakeData>(code);
      setD(sanitizeDraftFiles(loaded));
      setSub(0);
      setLoadCode('');
      toast.success('Draft loaded from cloud.');
    } catch {
      toast.error('No draft found for this code.');
    } finally {
      setCloudBusy(false);
    }
  }, [loadCode]);

  const handleClearDraft = useCallback(() => {
    clearLocalDraft(DRAFT_KEY);
    setD(EMPTY_INTAKE);
    setSub(0);
    setCloudCode('');
    toast.success('Saved inputs cleared.');
  }, []);


  const systemTypes = useMemo(() => getSystemTypes(t), [t]);
  const securityLevels = useMemo(() => getSecurityLevels(t), [t]);
  const zoneConduits = useMemo(() => getZoneConduits(t), [t]);
  const securityMeasures = useMemo(() => getSecurityMeasures(t), [t]);
  const securityCategories = useMemo(() => getSecurityCategories(t), [t]);
  const attachTypes = useMemo(() => getAttachTypes(t), [t]);
  const rolePresets = ['Captain', 'Chief Engineer', 'IT/ETO Officer', 'Watch Officer', 'Safety Officer', 'DPO', 'Owner/Fleet Manager', 'Class Surveyor'];

  const setField = useCallback((field: keyof IecIntakeData, val: unknown) => {
    setD(prev => ({ ...prev, [field]: val }));
  }, []);

  const toggleArray = useCallback((field: keyof IecIntakeData, val: string) => {
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
    const picked = Array.from(e.target.files);
    const entries = picked.map((file) => ({ id: crypto.randomUUID(), file }));
    setD(prev => ({
      ...prev,
      files: [
        ...prev.files,
        ...entries.map(({ id, file }) => ({
          id,
          name: file.name,
          size: file.size,
          type: activeUploadType || 'other',
          extractStatus: 'pending' as const,
        })),
      ],
    }));
    entries.forEach(({ id, file }) => {
      extractDocumentText(file).then(({ text, status, error }) => {
        setD(prev => ({
          ...prev,
          files: prev.files.map(f => f.id === id ? { ...f, text, extractStatus: status, extractError: error } : f),
        }));
      }).catch((err) => {
        setD(prev => ({
          ...prev,
          files: prev.files.map(f => f.id === id ? { ...f, text: '', extractStatus: 'error' as const, extractError: err instanceof Error ? err.message : 'Extraction failed' } : f),
        }));
      });
    });
    e.target.value = '';
  }, [activeUploadType]);

  const removeFile = useCallback((id: string) => {
    setD(prev => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }));
  }, []);


  const canNext = useMemo(() => [
    d.facilityName.trim().length > 0 && d.systemTypes.length > 0,
    true, true, true,
    d.roles.length > 0,
    true, true,
  ], [d.facilityName, d.systemTypes.length, d.roles.length]);

  const scenarioRef = useRef(Math.floor(Math.random() * DEMO_SCENARIOS.length));

  const handleDemo = useCallback(() => {
    if (sub === 0) {
      scenarioRef.current = (scenarioRef.current + 1) % DEMO_SCENARIOS.length;
    }
    const scenario = DEMO_SCENARIOS[scenarioRef.current];
    switch (sub) {
      case 0: setD(prev => ({ ...prev, facilityName: scenario.facility.name, systemTypes: scenario.facility.types })); break;
      case 1: setD(prev => ({ ...prev, securityLevel: scenario.securityLevel })); break;
      case 2: setD(prev => ({ ...prev, description: scenario.description, zones: scenario.zones })); break;
      case 3: setD(prev => ({ ...prev, protocols: scenario.protocols })); break;
      case 4: setD(prev => ({ ...prev, roles: scenario.roles })); break;
      case 5: setD(prev => ({ ...prev, measures: scenario.measures, knownIssues: scenario.knownIssues })); break;
      case 6: setD(prev => ({ ...prev, files: scenario.files.map((f) => ({ ...f, id: crypto.randomUUID() })) })); break;
    }
  }, [sub]);

  const prevSubRef = useRef(0);
  if (sub === 0 && prevSubRef.current > 0) {
    scenarioRef.current = Math.floor(Math.random() * DEMO_SCENARIOS.length);
  }
  prevSubRef.current = sub;

  const isSummary = sub === 7;

  let stepContent: React.ReactNode;
  switch (sub) {
    case 0:
      stepContent = (
        <StaggerReveal resetKey="intake-0" stagger={300}>
          <SubStepHeader current={0} total={INTAKE_STEPS} title="Identify Vessel" subtitle="Which vessel and its CBS framework is being assessed?" />
          <InfoBox icon="🚢" color="blue">IACS UR E26 sets goal-based requirements for the cyber resilience of the vessel as a whole — covering the integrated network of Computer Based Systems (CBS) across the ship, the responsibilities of owner and yard, and the ship-wide security framework. Identify the vessel under assessment.</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Vessel Name / CBS Designation</label>
            <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. MV Northern Spirit — Integrated Bridge System" value={d.facilityName} onChange={e => setField('facilityName', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Types (CBS) <span className="normal-case font-normal text-muted-foreground/60">(multi-select)</span></label>
            <div className="grid grid-cols-2 gap-2">
              {systemTypes.map(st => <Chip key={st.id} label={st.label} icon={st.icon} desc={st.desc} selected={d.systemTypes.includes(st.id)} onClick={() => toggleArray('systemTypes', st.id)} />)}
            </div>
          </div>
        </StaggerReveal>
      );
      break;
    case 1:
      stepContent = (
        <StaggerReveal resetKey="intake-1" stagger={300}>
          <SubStepHeader current={1} total={INTAKE_STEPS} title="Target Security Level (SL-T)" subtitle="What protection level is required?" />
          <InfoBox icon="📘" title="Security Levels per IEC 62443 (referenced by E26)" color="blue">Security Levels define the required protection grade against different threat scenarios — from opportunistic attackers (SL 1) to state-sponsored actors (SL 4).</InfoBox>
          <div className="space-y-2">
            {securityLevels.map(sl => (
              <button key={sl.id} onClick={() => setField('securityLevel', sl.id)} className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all ${d.securityLevel === sl.id ? sl.color + ' shadow' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{sl.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{sl.desc}</div>
                  </div>
                  {d.securityLevel === sl.id && <span className="text-lg mt-0.5 flex-shrink-0 text-primary">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </StaggerReveal>
      );
      break;
    case 2:
      stepContent = (
        <StaggerReveal resetKey="intake-2" stagger={300}>
          <SubStepHeader current={2} total={INTAKE_STEPS} title="On-Board Network Zones" subtitle="Which network zones are present on board?" />
          <InfoBox icon="💡" color="blue">IACS UR E26 requires the ship's CBS to be organised into security zones and conduits. Segmentation between bridge, engine room, crew IT, and shore connections is a core ship-wide design requirement for cyber resilience.</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">System Description</label>
            <textarea rows={4} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="e.g. Integrated bridge system with ECDIS, Radar/ARPA, AIS, Engine Control System..." value={d.description} onChange={e => setField('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available Zones</label>
            <div className="flex flex-wrap gap-2">
              {zoneConduits.map(zc => (
                <button key={zc.id} onClick={() => toggleArray('zones', zc.id)} className={`border rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${d.zones.includes(zc.id) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{zc.icon} {zc.label}</button>
              ))}
            </div>
          </div>
        </StaggerReveal>
      );
      break;
    case 3:
      stepContent = (
        <StaggerReveal resetKey="intake-3" stagger={300}>
          <SubStepHeader current={3} total={INTAKE_STEPS} title="Protocols and Interfaces" subtitle="Which communication protocols are used on board?" />
          <InfoBox icon="💡" color="blue">The protocol selection significantly influences the threat landscape. Maritime protocols such as NMEA offer no native authentication or encryption.</InfoBox>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROTOCOL_OPTS.map(o => (
              <button key={o.label} onClick={() => toggleArray('protocols', o.label)} className={`border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 transition-all ${d.protocols.includes(o.label) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
                <span>{o.icon}</span><span className="flex-1">{o.label}</span>{d.protocols.includes(o.label) && <span className="text-xs text-primary">✓</span>}
              </button>
            ))}
          </div>
          {d.protocols.some(p => p.includes('NMEA') || p.includes('Serial')) && (
            <InfoBox icon="⚠️" color="amber">NMEA and serial protocols offer no native authentication or encryption. Compensating measures (network segmentation, gateways) are required per UR E26.</InfoBox>
          )}
        </StaggerReveal>
      );
      break;
    case 4:
      stepContent = (
        <StaggerReveal resetKey="intake-4" stagger={300}>
          <SubStepHeader current={4} total={INTAKE_STEPS} title="Roles and Responsibilities" subtitle="Who is responsible for cyber resilience on board?" />
          <InfoBox icon="💡" color="blue">IACS UR E26 assigns ship-wide cyber resilience responsibilities across owner, yard, and suppliers, and requires clearly defined roles for cyber risk management on board and ashore.</InfoBox>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Common Roles</label>
            <div className="flex flex-wrap gap-2">
              {rolePresets.map(r => (
                <button key={r} onClick={() => addRole(r)} className={`border rounded-full px-3 py-1.5 text-xs font-medium transition-all ${d.roles.includes(r) ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{d.roles.includes(r) ? '✓ ' : ''}{r}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Add another role" value={d.customRole} onChange={e => setField('customRole', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRole(d.customRole); }} />
            <Button onClick={() => addRole(d.customRole)} className="font-medium">Add</Button>
          </div>
          {d.roles.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Selected Roles</label>
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
          const entry = prev.measures[id];
          if (!entry) return prev;
          return { ...prev, measures: { ...prev.measures, [id]: { ...entry, [prop]: val } } };
        });
      };
      const maturityLabel = (entry: MeasureEntry) => {
        if (entry.active && entry.documented && entry.audited && entry.certified) return 'Certified';
        if (entry.active && entry.documented && entry.audited) return 'Complete';
        if (entry.active && entry.documented) return 'Partial';
        return 'Basic';
      };
      const maturityColor = (entry: MeasureEntry) => {
        if (entry.active && entry.documented && entry.audited && entry.certified) return 'text-primary';
        if (entry.active && entry.documented && entry.audited) return 'text-green-400';
        if (entry.active && entry.documented) return 'text-yellow-400';
        return 'text-orange-400';
      };

      stepContent = (
        <StaggerReveal resetKey="intake-5" stagger={300}>
          <SubStepHeader current={5} total={INTAKE_STEPS} title="Existing Security Measures" subtitle="What is already implemented on board?" />
          <InfoBox icon="💡" color="blue">The maturity assessment shows the implementation status of existing security measures on board.</InfoBox>
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
                        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 sm:px-10 pb-2.5 -mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.documented} onChange={e => setMeasureProp(m.id, 'documented', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Documented</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.audited} onChange={e => setMeasureProp(m.id, 'audited', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Audited</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.certified} onChange={e => setMeasureProp(m.id, 'certified', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Certified</span>
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
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Known Vulnerabilities</label>
            <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="e.g. Flat network, shared accounts, NMEA unprotected, USB ports open..." value={d.knownIssues} onChange={e => setField('knownIssues', e.target.value)} />
          </div>
        </StaggerReveal>
      );
      break;
    }
    case 6:
      stepContent = (
        <StaggerReveal resetKey="intake-6" stagger={300}>
          <SubStepHeader current={5} total={INTAKE_STEPS} title="Documentation" subtitle="Upload existing documents (optional)" />
          <InfoBox icon="💡" color="blue">Network topology diagrams, CBS inventories, and risk assessments increase evidence quality.</InfoBox>
          <div className="grid grid-cols-1 gap-2">
            {attachTypes.map(at => (
              <button key={at.id} onClick={() => { setActiveUploadType(at.id); if (fileRef.current) { fileRef.current.accept = at.accept; fileRef.current.click(); } }} className="flex items-center gap-3 border-2 border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all text-left">
                <span className="text-xl">{at.icon}</span>
                <div>
                  <div className="font-medium">{at.label} Upload</div>
                  <div className="text-xs text-muted-foreground/60">{at.accept.replace(/\*/g, 'All formats')}</div>
                </div>
                <span className="ml-auto text-muted-foreground/40">+</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" multiple onChange={handleFileChange} className="hidden" />
          {d.files.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Uploaded Files ({d.files.length})</div>
              <div className="space-y-1.5">
                {d.files.map((f) => {
                  const typeInfo = attachTypes.find(at => at.id === f.type) || { icon: '📎', label: 'Document' };
                  const st = f.extractStatus;
                  const badge = st === 'pending' ? { txt: 'Reading…', cls: 'text-muted-foreground' }
                    : st === 'ok' ? { txt: `✓ ${((f.text?.length || 0) / 1000).toFixed(1)}k chars`, cls: 'text-green-600' }
                    : st === 'empty' ? { txt: 'No text found', cls: 'text-yellow-600' }
                    : st === 'unsupported' ? { txt: 'Format not readable', cls: 'text-yellow-600' }
                    : st === 'error' ? { txt: 'Read error', cls: 'text-destructive' }
                    : null;
                  return (
                    <div key={f.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5 text-sm">
                      <span className="text-lg flex-shrink-0">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {typeInfo.label} · <span className="font-mono">{(f.size / 1024).toFixed(0)} KB</span>
                          {badge && <> · <span className={`font-medium ${badge.cls}`}>{badge.txt}</span></>}
                        </div>
                      </div>
                      <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive font-bold text-lg leading-none transition-colors">×</button>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const total = d.files.length;
                const done = d.files.filter(f => f.extractStatus !== 'pending').length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const busy = done < total;
                return (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`font-medium ${busy ? 'text-primary' : 'text-green-600'}`}>
                        {busy ? 'Reading documents…' : 'All documents read'}
                      </span>
                      <span className="font-mono text-muted-foreground">{done}/{total} · {pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${busy ? 'bg-primary' : 'bg-green-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {busy && (
                      <div className="text-xs text-muted-foreground mt-1.5">
                        Please wait until all documents are read — the assessment uses their content.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          <InfoBox icon="🔒" color="green">Document content is analysed in your browser; only extracted text is sent to the assessment AI — original files are never uploaded or stored.</InfoBox>
        </StaggerReveal>

      );
      break;
    case 7:
      stepContent = (
        <StaggerReveal resetKey="intake-7" stagger={250}>
          <SubStepHeader current={5} total={INTAKE_STEPS} title="Summary" subtitle="Review your inputs before starting the assessment." />
          {[
            { label: 'Vessel/System', val: d.facilityName || '—' },
            { label: 'CBS Types', val: d.systemTypes.map(id => systemTypes.find(st => st.id === id)?.label).join(', ') || '—' },
            { label: 'Security Level', val: securityLevels.find(sl => sl.id === d.securityLevel)?.label || '—' },
            { label: 'Zones', val: d.zones.map(id => zoneConduits.find(zc => zc.id === id)?.label).join(', ') || '—' },
            { label: 'Protocols', val: d.protocols.join(', ') || '—' },
            { label: 'Roles', val: d.roles.join(', ') || '—' },
            { label: 'Measures', val: Object.keys(d.measures).length > 0 ? `${Object.keys(d.measures).length} selected` : 'None' },
            { label: 'Documents', val: d.files.length > 0 ? `${d.files.length} files` : 'None' },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground sm:w-36 flex-shrink-0 text-xs sm:text-sm">{label}</span>
              <span className="text-foreground font-medium break-words min-w-0">{val}</span>
            </div>
          ))}
          {d.knownIssues && (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground sm:w-36 flex-shrink-0 text-xs sm:text-sm">Known Issues</span>
              <span className="text-foreground font-medium break-words min-w-0">{d.knownIssues}</span>
            </div>
          )}
        </StaggerReveal>
      );
      break;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 bg-card border border-border rounded-lg px-3 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-green-600 font-medium">
          <Check className="w-3.5 h-3.5" /> Inputs are saved automatically
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button size="sm" variant="outline" onClick={handleCloudSave} disabled={cloudBusy} className="h-7 text-xs">
            <CloudUpload className="w-3.5 h-3.5 mr-1" /> Save to cloud
          </Button>
          {cloudCode && (
            <code className="px-2 py-1 rounded bg-primary/10 text-primary font-mono font-semibold select-all">{cloudCode}</code>
          )}
          <div className="flex items-center gap-1">
            <input
              value={loadCode}
              onChange={(e) => setLoadCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCloudLoad(); }}
              placeholder="Restore code"
              className="w-28 border border-border rounded-md px-2 py-1 text-xs bg-background text-foreground focus:ring-2 focus:ring-primary outline-none uppercase"
            />
            <Button size="sm" variant="ghost" onClick={handleCloudLoad} disabled={cloudBusy || !loadCode.trim()} className="h-7 text-xs">
              <Cloud className="w-3.5 h-3.5 mr-1" /> Load
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={handleClearDraft} className="h-7 text-xs text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>
      {stepContent}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          {sub > 0 && <Button variant="outline" onClick={() => setSub(sub - 1)}>Back</Button>}
          {sub <= 6 && <Button variant="ghost" size="sm" onClick={handleDemo} className="text-xs text-muted-foreground">Demo</Button>}
        </div>
        {sub < 7 ? (
          <Button onClick={() => setSub(sub + 1)} disabled={!canNext[sub]} className="font-semibold">
            {sub === 6 ? 'Review Summary' : 'Next'}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            {d.files.some(f => f.extractStatus === 'pending') && (
              <span className="text-xs text-muted-foreground">Reading documents… please wait</span>
            )}
            <Button
              onClick={() => onFinish(d)}
              disabled={d.files.some(f => f.extractStatus === 'pending')}
              className="font-semibold"
            >
              Start Assessment
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Phase 2: Threat Model ─────────────────────────────────────

function SectionCard({ title, icon, children, className = '' }: { title: string; icon?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-3.5 border-b border-border bg-secondary/40">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  const colorCls = accent === 'danger' ? 'text-destructive' : accent === 'warning' ? 'text-orange-500' : accent === 'success' ? 'text-green-500' : 'text-foreground';
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold font-mono ${colorCls} mb-1`}>{value}</div>
      <div className="text-xs font-medium text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}

function ThreatModel({ threats, onNext }: { threats: IecThreat[]; onNext: () => void }) {
  const [exp, setExp] = useState<number | null>(null);
  const frCounts = useMemo(() => {
    const c: Record<string, number> = {};
    Object.keys(FR_CATEGORIES).forEach(k => c[k] = 0);
    threats.forEach(th => { c[th.fr] = (c[th.fr] || 0) + 1; });
    return c;
  }, [threats]);

  return (
    <StaggerReveal resetKey="tm" stagger={300}>
      <InfoBox icon="🔍" title="Maritime Threat Landscape" color="blue">The threat analysis is based on the chapter structure of IACS UR E26 and identifies vulnerabilities in the Computer Based Systems (CBS) on board.</InfoBox>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(FR_CATEGORIES).map(([key, meta]) => (
          <div key={key} className="bg-card border border-border rounded-xl p-3.5 text-center hover:border-primary/30 transition-colors">
            <div className={`w-2.5 h-2.5 rounded-full ${meta.dot} mx-auto mb-2`} />
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{meta.label.en}</div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">{frCounts[key] || 0}</div>
          </div>
        ))}
      </div>

      <SectionCard title={`Identified Threats (${threats.length})`} icon="🛡️">
        <div className="space-y-2">
          {threats.map(th => {
            const isOpen = exp === th.id;
            const risk = riskLevel(th.likelihood, th.impact);
            const meta = FR_CATEGORIES[th.fr];
            return (
              <div key={th.id} className={`border rounded-lg overflow-hidden transition-colors ${isOpen ? 'border-primary/30 bg-primary/[0.02]' : 'border-border hover:border-muted-foreground/30'}`}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExp(isOpen ? null : th.id)}>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${meta?.badge || ''}`}>{th.fr}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{th.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{th.component}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${risk.cls}`}>{th.likelihood * th.impact}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
                {isOpen && (
                  <div className="border-t border-border bg-secondary/20 px-4 py-4 text-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-background/60 rounded-lg px-3 py-2"><span className="font-semibold text-muted-foreground block mb-0.5">Attacker</span><span className="text-foreground">{th.attacker}</span></div>
                      <div className="bg-background/60 rounded-lg px-3 py-2"><span className="font-semibold text-muted-foreground block mb-0.5">Reference</span><span className="text-foreground font-mono">{th.iecRef}</span></div>
                    </div>
                    <div className="bg-background/60 rounded-lg px-3 py-2 text-xs"><span className="font-semibold text-muted-foreground block mb-0.5">Attack Path</span><span className="text-foreground">{th.path}</span></div>
                    <EvidenceBlock label="Evidence">{th.evidence}</EvidenceBlock>
                    <EvidenceBlock label="Rationale">{th.rationale}</EvidenceBlock>
                    <div className="grid grid-cols-2 gap-4">
                      <div><div className="text-xs font-semibold text-muted-foreground mb-1.5">Likelihood</div><ScoreBar value={th.likelihood} /></div>
                      <div><div className="text-xs font-semibold text-muted-foreground mb-1.5">Impact</div><ScoreBar value={th.impact} /></div>
                    </div>
                    {th.sources.length > 0 && (
                      <div className="text-xs text-muted-foreground pt-1 border-t border-border/50"><span className="font-semibold">Sources: </span>{th.sources.join(' · ')}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">Risk Matrix</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 3: Risk Assessment ──────────────────────────────────

function RiskAssessment({ threats, onNext }: { threats: IecThreat[]; onNext: () => void }) {
  const sorted = useMemo(() => [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)), [threats]);
  const cnt = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    threats.forEach(th => { const s = th.likelihood * th.impact; if (s >= 20) c.critical++; else if (s >= 13) c.high++; else if (s >= 6) c.medium++; else c.low++; });
    return c;
  }, [threats]);

  const matrixColor = (s: number) => s >= 20 ? 'bg-red-500' : s >= 13 ? 'bg-orange-400' : s >= 6 ? 'bg-yellow-300' : 'bg-green-300';

  return (
    <StaggerReveal resetKey="ra" stagger={350}>
      <InfoBox icon="⚖️" title="Risk Matrix (5×5)" color="blue">The risk assessment maps each threat by likelihood and impact on vessel safety.</InfoBox>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Critical" value={cnt.critical} accent="danger" />
        <KpiCard label="High" value={cnt.high} accent="warning" />
        <KpiCard label="Medium" value={cnt.medium} />
        <KpiCard label="Low" value={cnt.low} accent="success" />
      </div>
      <SectionCard title="Risk Matrix (Likelihood × Impact)" icon="📊">
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse mx-auto">
            <thead><tr>
              <th className="w-20 text-right pr-3 text-muted-foreground font-normal pb-2">Impact ↑</th>
              {[1,2,3,4,5].map(i => <th key={i} className="w-14 text-center text-muted-foreground font-semibold pb-2 font-mono">{i}</th>)}
              <th className="pl-3 text-muted-foreground font-normal pb-2">Likelihood →</th>
            </tr></thead>
            <tbody>
              {[5,4,3,2,1].map(imp => (
                <tr key={imp}>
                  <td className="text-right pr-3 text-muted-foreground font-semibold py-1 font-mono">{imp}</td>
                  {[1,2,3,4,5].map(lik => {
                    const score = lik * imp;
                    const pts = threats.filter(th => th.likelihood === lik && th.impact === imp);
                    return (
                      <td key={lik} className={`w-14 h-11 ${matrixColor(score)} text-center align-middle border-2 border-background rounded-md`} title={pts.map(p => p.name).join('\n')}>
                        {pts.length > 0 && <div className="w-7 h-7 bg-background/90 rounded-full text-foreground font-bold text-xs font-mono flex items-center justify-center mx-auto shadow-sm cursor-help">{pts.length}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title={`All Risks (${sorted.length})`} icon="📋">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs text-muted-foreground"><tr>
              <th className="px-5 py-2.5 text-left font-semibold">Threat</th>
              <th className="px-3 py-2.5 text-center w-12 font-semibold">L</th>
              <th className="px-3 py-2.5 text-center w-12 font-semibold">I</th>
              <th className="px-3 py-2.5 text-center w-16 font-semibold">Score</th>
              <th className="px-5 py-2.5 text-center w-28 font-semibold">Priority</th>
            </tr></thead>
            <tbody>
              {sorted.map((th, idx) => {
                const risk = riskLevel(th.likelihood, th.impact);
                return (
                  <tr key={th.id} className={`border-b border-border/50 last:border-0 ${idx % 2 === 0 ? '' : 'bg-secondary/20'}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-foreground">
                        <span className="font-mono text-xs text-muted-foreground mr-2">{threatId(th)}</span>{th.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{th.component}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground font-mono">{th.likelihood}</td>
                    <td className="px-3 py-3 text-center font-semibold text-foreground font-mono">{th.impact}</td>
                    <td className="px-3 py-3 text-center font-bold text-foreground font-mono">{th.likelihood * th.impact}</td>
                    <td className="px-5 py-3 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${risk.cls}`}>{risk.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">E26 Mapping</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 4: E26 Mapping ──────────────────────────────────────

function IecMapping({ reqs, onNext }: { reqs: IecReq[]; onNext: () => void }) {
  const [exp, setExp] = useState<string | null>(null);
  const { pass, partial, fail, score, scoreColor, strokeColor } = useMemo(() => {
    const p = reqs.filter(r => r.status === 'pass').length;
    const pa = reqs.filter(r => r.status === 'partial').length;
    const f = reqs.filter(r => r.status === 'fail').length;
    const s = Math.round((p * 100 + pa * 50) / reqs.length);
    return { pass: p, partial: pa, fail: f, score: s, scoreColor: s >= 70 ? 'text-green-500' : s >= 40 ? 'text-yellow-500' : 'text-destructive', strokeColor: s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#dc2626' };
  }, [reqs]);

  return (
    <StaggerReveal resetKey="cm" stagger={300}>
      <InfoBox icon="📋" title="IACS UR E26 Applicability Review" color="blue">Applicability of each IACS UR E26 requirement (Chapters 4–16) to the declared scope.</InfoBox>

      {/* Score Overview */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-secondary" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{score}%</span>
            <span className="text-[10px] text-muted-foreground font-medium">Addressed</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-lg font-bold text-foreground mb-1">IACS UR E26 Applicability Summary</div>
          <div className="text-sm text-muted-foreground mb-4">{reqs.length} requirements assessed</div>
          <div className="flex gap-5 text-sm flex-wrap justify-center sm:justify-start">
            {([[VERDICT_LABELS.not_applicable.en, pass, 'bg-green-500'], [VERDICT_LABELS.partially_applicable.en, partial, 'bg-yellow-500'], [VERDICT_LABELS.applicable.en, fail, 'bg-destructive']] as [string, number, string][]).map(([label, count, bg]) => (
              <span key={label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${bg} inline-block`} />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-bold font-mono text-foreground">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements List */}
      <SectionCard title={`Requirements (${reqs.length})`} icon="📝">
        <div className="space-y-2">
          {reqs.map(r => {
            const isOpen = exp === r.id;
            return (
              <div key={r.id} className={`border rounded-lg overflow-hidden transition-colors ${isOpen ? 'border-primary/30 bg-primary/[0.02]' : 'border-border hover:border-muted-foreground/30'}`}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExp(isOpen ? null : r.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.article}</div>
                  </div>
                  <StatusBadge status={r.status} />
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
                {isOpen && (
                  <div className="border-t border-border bg-secondary/20 px-4 py-4 text-sm space-y-3">
                    <EvidenceBlock label="Evidence">{r.evidence}</EvidenceBlock>
                    {r.gap && (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 text-sm">
                        <span className="font-semibold text-destructive">Gap: </span><span className="text-foreground">{r.gap}</span>
                      </div>
                    )}
                    <EvidenceBlock label="Rationale">{r.rationale}</EvidenceBlock>
                    {r.measure && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm">
                        <span className="font-semibold text-primary">Measure: </span><span className="text-foreground">{r.measure}</span>
                      </div>
                    )}
                    <CriteriaBlock criteria={r.criteria} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">Report</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 5: Report ───────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: IecVerdict }) {
  const s = VERDICT_STYLES[verdict];
  return <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${s.badge}`}>{VERDICT_LABELS[verdict].en}</span>;
}

function ReportView({ intakeData, threats, reqs, reviewSummary }: { intakeData: IecIntakeData; threats: IecThreat[]; reqs: IecReq[]; reviewSummary: ReviewSummaryResult | null }) {
  const [localThreats, setLocalThreats] = useState<IecThreat[]>(() => threats.map(th => ({ ...th, sources: [...th.sources] })));
  const [localReqs, setLocalReqs] = useState<IecReq[]>(() => reqs.map(r => ({ ...r, criteria: [...r.criteria] })));
  const [qaResult, setQaResult] = useState<QaResult | null>(null);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaExpanded, setQaExpanded] = useState(false);
  const [, setPreFixQaChecks] = useState<QaCheck[] | null>(null);
  const [allFixLogs, setAllFixLogs] = useState<string[]>([]);

  // Verdict counts (applicability model)
  const counts = useMemo(() => {
    const na = localReqs.filter(r => r.status === 'pass').length;
    const partial = localReqs.filter(r => r.status === 'partial').length;
    const applicable = localReqs.filter(r => r.status === 'fail').length;
    return { na, partial, applicable };
  }, [localReqs]);

  // Original risk rating per requirement, derived from linked threats.
  const ratingFor = useCallback((r: IecReq): number => {
    const linked = localThreats.filter(th => th.iecRef === r.article);
    return linked.length > 0 ? Math.max(...linked.map(th => th.likelihood * th.impact)) : 0;
  }, [localThreats]);

  const critFindings = useMemo(() => localThreats.filter(th => th.likelihood * th.impact >= 20).length, [localThreats]);

  // Individual findings: controls that are applicable or partially applicable.
  const findings = useMemo(() => localReqs.filter(r => r.status !== 'pass'), [localReqs]);
  const today = useMemo(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), []);

  const securityLevels = useMemo(() => getSecurityLevels((k: string) => k), []);
  const slName = securityLevels.find(sl => sl.id === intakeData.securityLevel)?.label || intakeData.securityLevel || '—';

  const residualItems = reviewSummary?.residualScopeItems && reviewSummary.residualScopeItems.length > 0
    ? reviewSummary.residualScopeItems
    : findings.filter(r => r.residualScopeNote).slice(0, 5).map(r => ({ title: r.name, detail: r.residualScopeNote || '' }));

  const handleQaAndFix = useCallback(() => {
    setQaRunning(true);
    setQaExpanded(false);
    setTimeout(() => {
      const initialQa = runQualityCheck(localThreats, localReqs, 'en', intakeData);
      setPreFixQaChecks(initialQa.checks);
      let finalThreats = localThreats;
      let finalReqs = localReqs;
      let fixLogs: string[] = [];
      if (initialQa.failed > 0) {
        const result = applyAuditFixes(localThreats, localReqs, initialQa.checks.filter(c => !c.passed), 'en', intakeData);
        finalThreats = result.threats; finalReqs = result.reqs; fixLogs = result.fixes;
        setLocalThreats(finalThreats); setLocalReqs(finalReqs); setAllFixLogs(fixLogs);
      }
      const postFixQa = runQualityCheck(finalThreats, finalReqs, 'en', intakeData);
      setQaResult(postFixQa); setQaRunning(false); setQaExpanded(true);
    }, 1500);
  }, [localThreats, localReqs, intakeData]);

  const qaVerdict = qaResult?.verdict;

  const QA_CATEGORIES: Record<string, string> = {
    consistency: 'A. Consistency Check', technical: 'B. Technical Correctness',
    evidence: 'C. Evidence Check', editorial: 'D. Editorial Check', ot: 'E. Maritime Check',
  };

  return (
    <StaggerReveal resetKey="rp" stagger={300}>
      <InfoBox icon="✅" title="Applicability Review Complete" color="green">The IACS UR E26 applicability review has been performed. Run the quality check to validate the report before export.</InfoBox>

      {/* Report Header */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-l-4 border-primary p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">IACS UR E26 Applicability Review</div>
              <div className="text-xl font-bold text-foreground">{intakeData.facilityName}</div>
            </div>
            <div className="sm:text-right text-xs text-muted-foreground space-y-0.5">
              <div className="font-mono">{today}</div>
              <div className="font-medium">{slName}</div>
              <div className="uppercase tracking-wider text-[10px] text-destructive font-bold">Confidential</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <SectionCard title="Executive Summary" icon="📌">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          {reviewSummary?.coreFinding || `This applicability review evaluated ${localReqs.length} IACS UR E26 requirements against the declared scope of ${intakeData.facilityName}. ${counts.applicable} requirements are fully applicable, ${counts.partial} are partially applicable, and ${counts.na} are not applicable to this architecture.`}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-destructive">{counts.applicable}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{VERDICT_LABELS.applicable.en}</div>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-yellow-500">{counts.partial}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{VERDICT_LABELS.partially_applicable.en}</div>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-green-500">{counts.na}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{VERDICT_LABELS.not_applicable.en}</div>
          </div>
        </div>
        {critFindings > 0 && (
          <div className="text-xs text-muted-foreground mt-3">{critFindings} of the underlying findings carry a critical original risk rating.</div>
        )}
      </SectionCard>

      {/* 2. Residual scope + recommendation */}
      {(residualItems.length > 0 || reviewSummary?.recommendation) && (
        <SectionCard title="Key Residual Scope & Recommendation" icon="🎯">
          {residualItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {residualItems.map((it, i) => (
                <div key={i} className="border border-border rounded-lg px-3 py-2">
                  <div className="text-sm font-semibold text-foreground">{it.title}</div>
                  {it.detail && <div className="text-xs text-muted-foreground mt-0.5">{it.detail}</div>}
                </div>
              ))}
            </div>
          )}
          {reviewSummary?.recommendation && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm">
              <span className="font-semibold text-primary">Recommendation: </span>
              <span className="text-foreground">{reviewSummary.recommendation}</span>
            </div>
          )}
        </SectionCard>
      )}

      {/* 3. Scope */}
      <SectionCard title="Introduction & Scope" icon="📋">
        <div className="space-y-2 text-sm">
          {intakeData.description && <p className="text-foreground leading-relaxed">{intakeData.description}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2">
            <div><span className="text-muted-foreground">Target Security Level: </span><span className="text-foreground font-medium">{slName}</span></div>
            {intakeData.systemTypes.length > 0 && <div><span className="text-muted-foreground">CBS Types: </span><span className="text-foreground font-medium">{intakeData.systemTypes.join(', ')}</span></div>}
            {intakeData.zones.length > 0 && <div><span className="text-muted-foreground">Zones: </span><span className="text-foreground font-medium">{intakeData.zones.join(', ')}</span></div>}
            {intakeData.protocols.length > 0 && <div><span className="text-muted-foreground">Protocols: </span><span className="text-foreground font-medium">{intakeData.protocols.join(', ')}</span></div>}
          </div>
        </div>
      </SectionCard>

      {/* Charts */}
      <SectionCard title="Applicability Overview" icon="📊">
        <Iec62443Ur26AuditCharts threats={localThreats} reqs={localReqs} />
      </SectionCard>

      {/* 4. Individual Findings */}
      {findings.length > 0 && (
        <SectionCard title={`Individual Findings (${findings.length})`} icon="🔍">
          <div className="space-y-3">
            {findings.map((r, i) => {
              const verdict = verdictFromStatus(r.status);
              const score = ratingFor(r);
              return (
                <div key={r.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold bg-secondary px-2 py-1 rounded-md flex-shrink-0 text-muted-foreground">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm">{r.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{FR_CATEGORIES[r.id.split('-')[0]]?.label.en || ''} · {r.article}</div>
                      </div>
                    </div>
                    <VerdictBadge verdict={verdict} />
                  </div>
                  <div className="ml-10 space-y-1.5 text-xs">
                    {score > 0 && <div><span className="font-semibold text-muted-foreground">Original Risk Rating: </span><span className="text-foreground">{originalRatingLabel(score, 'en')}</span></div>}
                    {r.generalisedFinding && <div><span className="font-semibold text-muted-foreground">Generalised Finding: </span><span className="text-foreground">{r.generalisedFinding}</span></div>}
                    {r.clientResponse && <div><span className="font-semibold text-muted-foreground">Client Response: </span><span className="text-foreground">{r.clientResponse}</span></div>}
                    {r.residualScopeNote && <div className="bg-secondary/40 border border-border rounded-md px-2.5 py-1.5"><span className="font-semibold text-muted-foreground">Residual Scope Note: </span><span className="text-foreground">{r.residualScopeNote}</span></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* 5. Complete Control Assessment Matrix */}
      <SectionCard title={`Complete Control Assessment Matrix (${localReqs.length})`} icon="🗂️">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-semibold">ID</th>
                <th className="py-2 pr-3 font-semibold">Reference</th>
                <th className="py-2 pr-3 font-semibold">Control</th>
                <th className="py-2 pr-3 font-semibold">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {localReqs.map(r => (
                <tr key={r.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 font-mono text-foreground">{r.id}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.article}</td>
                  <td className="py-2 pr-3 text-foreground">{r.name}</td>
                  <td className="py-2 pr-3"><VerdictBadge verdict={verdictFromStatus(r.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {qaResult && qaExpanded && (
        <QualityCheckPanel result={qaResult} fixLogs={allFixLogs} categories={QA_CATEGORIES} />
      )}

      {/* Export Bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-foreground">Export Applicability Review</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {qaResult ? 'Quality check complete — PDF export ready' : 'Run the quality check to validate the report'}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <Button onClick={handleQaAndFix} disabled={qaRunning} variant={qaResult ? 'outline' : 'default'} className="font-semibold">
              {qaRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              {qaRunning ? 'Checking…' : 'Validate Report'}
            </Button>
            {qaResult && (
              <Button
                onClick={() => {
                  generateIec62443Ur26Report({
                    intakeData,
                    threats: localThreats,
                    reqs: localReqs,
                    language: detectLanguage(extractTexts(intakeData as any)) as 'de' | 'en' | 'fr',
                    isDraft: qaVerdict !== 'passed',
                    qaChecks: qaResult.checks,
                    fixLog: allFixLogs,
                    qaIterations: 1,
                    reviewSummary: reviewSummary || undefined,
                  });
                }}
                className="font-semibold"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Final
              </Button>
            )}
          </div>
        </div>
      </div>
    </StaggerReveal>
  );
}

// ── Main ──────────────────────────────────────────────────────

const MAIN_STEPS = ['Data Collection', 'Threat Landscape', 'Risk Matrix', 'E26 Mapping', 'Report & Export'];

const Iec62443Ur26ComplianceTool = ({ embedded }: { embedded?: boolean }) => {
  const [step, setStepRaw] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('CBS threats are being identified and assessed against IACS UR E26.');
  const [intakeData, setIntakeData] = useState<IecIntakeData>(EMPTY_INTAKE);
  const [docAssessments, setDocAssessments] = useState<ReqAssessment[] | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryResult | null>(null);
  const [docsAnalyzed, setDocsAnalyzed] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setStep = useCallback((s: number) => { setStepRaw(s); setTimeout(scrollToTop, 50); }, [scrollToTop]);

  const handleIntakeFinish = useCallback(async (data: IecIntakeData) => {
    setIntakeData(data);
    setDocAssessments(null);
    setReviewSummary(null);
    setDocsAnalyzed([]);
    setLoading(true);

    const readableDocs = data.files.filter(f => f.extractStatus === 'ok' && (f.text || '').trim().length > 0);

    if (readableDocs.length === 0) {
      setLoadingMsg('CBS threats are being identified and assessed against IACS UR E26.');
      setTimeout(() => { setLoading(false); setStep(1); }, 1500);
      return;
    }

    setLoadingMsg(`Analysing ${readableDocs.length} document(s) against the IACS UR E26 requirements…`);
    try {
      const lang = detectLanguage(extractTexts(data as unknown as Record<string, unknown>)) as 'de' | 'en' | 'fr';
      const measures = Object.entries(data.measures || {})
        .filter(([, m]) => m && (m.active || m.documented || m.audited || m.certified))
        .map(([k, m]) => {
          const flags = [m.active && 'active', m.documented && 'documented', m.audited && 'audited', m.certified && 'certified'].filter(Boolean).join('/');
          return `${k} (${flags})`;
        });
      const result = await assessDocuments(
        'E26',
        getReqs(data.extendedMatrix).map(r => ({ id: r.id, article: r.article, name: r.name, criteria: r.criteria })),
        readableDocs.map(f => ({ name: f.name, type: f.type, text: f.text || '' })),
        lang,
        {
          facilityName: data.facilityName,
          systemTypes: data.systemTypes,
          securityLevel: data.securityLevel,
          description: data.description,
          zones: data.zones,
          protocols: data.protocols,
          measures,
          knownIssues: data.knownIssues,
        },
      );
      setDocAssessments(result.assessments);
      setReviewSummary(result.summary || null);
      setDocsAnalyzed(result.documentsAnalyzed);
      toast.success(`Document analysis complete — ${result.documentsAnalyzed.length} document(s) evaluated against ${result.assessments.length} requirements.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Document analysis failed';
      toast.error(`Document analysis failed: ${msg}. Proceeding with the standard requirement baseline.`);
    } finally {
      setLoading(false);
      setStep(1);
    }
  }, [setStep]);

  const effectiveReqs = useMemo<IecReq[]>(() => {
    const baseReqs = getReqs(intakeData?.extendedMatrix);
    if (!docAssessments) return baseReqs;
    const byId = new Map(docAssessments.map(a => [a.id, a]));
    const basisLabel: Record<string, string> = {
      declared: 'Self-declared (intake)',
      document: 'Document-verified',
      declared_document: 'Self-declared & document-verified',
      none: '',
    };
    return IEC_REQS.map(r => {
      const a = byId.get(r.id);
      if (!a) return r;
      const label = basisLabel[a.basis] || '';
      const docEvidence = a.evidence
        ? `${a.evidence}${a.sourceDoc ? ` (source: ${a.sourceDoc})` : ''}`
        : '';
      const evidence = label
        ? `[${label}] ${docEvidence || (a.basis === 'declared' ? 'Based on intake self-declaration; no supporting document quote available.' : r.evidence)}`
        : (docEvidence || r.evidence);
      return {
        ...r,
        status: a.status,
        evidence,
        rationale: a.rationale || r.rationale,
        generalisedFinding: a.generalisedFinding || r.generalisedFinding,
        clientResponse: a.clientResponse || r.clientResponse,
        residualScopeNote: a.residualScopeNote || r.residualScopeNote,
      };
    });
  }, [docAssessments]);


  const reset = useCallback(() => { setStep(0); setIntakeData(EMPTY_INTAKE); setDocAssessments(null); setReviewSummary(null); setDocsAnalyzed([]); }, [setStep]);

  const progressPct = ((step + 1) / MAIN_STEPS.length) * 100;


  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="IACS UR E26 Cyber Resilience Assessment" description="IACS UR E26 Compliance Assessment for maritime on-board systems" />}
      <div className="border-b border-border px-4 py-3 mb-1" ref={contentRef}>
        <div className="flex items-center max-w-5xl mx-auto overflow-x-auto">
          {MAIN_STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'text-primary hover:bg-primary/10 cursor-pointer' : 'text-muted-foreground cursor-not-allowed'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === step ? 'bg-primary-foreground text-primary' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>{i < step ? '✓' : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < MAIN_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>
      </div>
      <Progress value={progressPct} className="h-1 rounded-none" />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-5" />
            <div className="text-foreground font-semibold text-lg mb-2">Performing Maritime Cyber Risk Analysis…</div>
            <div className="text-muted-foreground text-sm">{loadingMsg}</div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-foreground" key={`main-${step}`}><Typewriter text={MAIN_STEPS[step]} mode="typewriter" charDelay={10} cursor={false} /></div>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-1" /> Restart
                </Button>
              )}
            </div>
            {step > 0 && docsAnalyzed.length > 0 && (
              <div className="mb-4 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 text-xs text-foreground">
                <span className="text-base leading-none">📄</span>
                <span>Requirement compliance was evaluated against the content of <strong>{docsAnalyzed.length}</strong> uploaded document(s): {docsAnalyzed.join(', ')}.</span>
              </div>
            )}
            {step === 0 && <IntakeWizard onFinish={handleIntakeFinish} />}
            {step === 1 && <ThreatModel threats={IEC_THREATS} onNext={() => setStep(2)} />}
            {step === 2 && <RiskAssessment threats={IEC_THREATS} onNext={() => setStep(3)} />}
            {step === 3 && <IecMapping reqs={effectiveReqs} onNext={() => setStep(4)} />}
            {step === 4 && <ReportView intakeData={intakeData} threats={IEC_THREATS} reqs={effectiveReqs} reviewSummary={reviewSummary} />}
          </div>

        )}
      </div>
    </div>
  );
};

export default Iec62443Ur26ComplianceTool;
