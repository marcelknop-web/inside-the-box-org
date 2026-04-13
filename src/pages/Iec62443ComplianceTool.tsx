import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, Loader2, FileText, ShieldCheck } from 'lucide-react';
import { applyAuditFixes } from '@/utils/iec62443AuditFixes';
import { generateIec62443Report } from '@/utils/iec62443ReportPdf';
import { Iec62443AuditCharts } from '@/components/Iec62443AuditCharts';
import { runQualityCheck, type QaResult, type QaCheck } from '@/utils/iec62443QualityCheck';
import QualityCheckPanel from '@/components/QualityCheckPanel';
import { PageMeta } from '@/components/PageMeta';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import Typewriter from '@/components/Typewriter';
import { StaggerReveal } from '@/components/StaggerReveal';
import {
  getSystemTypes, getSecurityLevels, getZoneConduits,
  PROTOCOL_OPTS, getSecurityMeasures, getSecurityCategories,
  getAttachTypes, IEC_THREATS, IEC_REQS, FR_CATEGORIES, threatId,
  DEMO_SCENARIOS,
  type IecThreat, type IecReq, type IecIntakeData, type MeasureEntry, EMPTY_INTAKE,
} from '@/data/iec62443Data';

// ── Helpers ─────────────────────────────────────────────────────

function riskLevel(l: number, i: number) {
  const s = l * i;
  if (s >= 20) return { label: 'Critical', cls: 'bg-destructive text-destructive-foreground' };
  if (s >= 13) return { label: 'High', cls: 'bg-orange-500 text-white' };
  if (s >= 6) return { label: 'Medium', cls: 'bg-yellow-500 text-black' };
  return { label: 'Low', cls: 'bg-green-500 text-white' };
}

const StatusBadge = memo(({ status }: { status: string }) => {
  if (status === 'pass') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">Compliant</span>;
  if (status === 'partial') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Partial</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">Non-Compliant</span>;
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
  const [sub, setSub] = useState(0);
  const [d, setD] = useState<IecIntakeData>(EMPTY_INTAKE);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

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
    const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: activeUploadType || 'other' }));
    setD(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    e.target.value = '';
  }, [activeUploadType]);

  const removeFile = useCallback((idx: number) => {
    setD(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
  }, []);

  const canNext = useMemo(() => [
    d.facilityName.trim().length > 0 && d.systemTypes.length > 0,
    true, true, true,
    d.roles.length > 0,
    true, true,
  ], [d.facilityName, d.systemTypes.length, d.roles.length]);

  const scenarioRef = useRef(Math.floor(Math.random() * DEMO_SCENARIOS.length));

  const handleDemo = useCallback(() => {
    const scenario = DEMO_SCENARIOS[scenarioRef.current];
    switch (sub) {
      case 0: setD(prev => ({ ...prev, facilityName: scenario.facility.name, systemTypes: scenario.facility.types })); break;
      case 1: setD(prev => ({ ...prev, securityLevel: scenario.securityLevel })); break;
      case 2: setD(prev => ({ ...prev, description: scenario.description, zones: scenario.zones })); break;
      case 3: setD(prev => ({ ...prev, protocols: scenario.protocols })); break;
      case 4: setD(prev => ({ ...prev, roles: scenario.roles })); break;
      case 5: setD(prev => ({ ...prev, measures: scenario.measures, knownIssues: scenario.knownIssues })); break;
      case 6: setD(prev => ({ ...prev, files: scenario.files })); break;
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
          <SubStepHeader current={0} total={INTAKE_STEPS} title="Identify Vessel / System" subtitle="Which CBS is being assessed?" />
          <InfoBox icon="🚢" color="blue">IACS UR E27 defines requirements for the cyber resilience of on-board systems and equipment (Computer Based Systems — CBS). Identify the vessel or system under assessment.</InfoBox>
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
          <InfoBox icon="📘" title="Security Levels per E27/IEC 62443" color="blue">Security Levels define the required protection grade against different threat scenarios — from opportunistic attackers (SL 1) to state-sponsored actors (SL 4).</InfoBox>
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
          <InfoBox icon="💡" color="blue">IACS UR E26 defines security zones on board. Segmentation between bridge, engine room, crew IT, and shore connections is essential for cyber resilience.</InfoBox>
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
            <InfoBox icon="⚠️" color="amber">NMEA and serial protocols offer no native authentication or encryption. Compensating measures (network segmentation, gateways) are required per UR E27.</InfoBox>
          )}
        </StaggerReveal>
      );
      break;
    case 4:
      stepContent = (
        <StaggerReveal resetKey="intake-4" stagger={300}>
          <SubStepHeader current={4} total={INTAKE_STEPS} title="Roles and Responsibilities" subtitle="Who is responsible for cyber resilience on board?" />
          <InfoBox icon="💡" color="blue">IACS UR E26 requires clearly defined roles for cyber risk management on board and ashore.</InfoBox>
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
        if (entry.active && entry.documented && entry.audited) return 'Complete';
        if (entry.active && entry.documented) return 'Partial';
        return 'Basic';
      };
      const maturityColor = (entry: MeasureEntry) => {
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
                        <div className="flex gap-4 px-10 pb-2.5 -mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.documented} onChange={e => setMeasureProp(m.id, 'documented', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Documented</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary flex-shrink-0" checked={entry.audited} onChange={e => setMeasureProp(m.id, 'audited', e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Audited</span>
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
          <InfoBox icon="🔒" color="green">Files are not stored or transmitted.</InfoBox>
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
            <div key={label} className="flex gap-3 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
              <span className="text-foreground font-medium">{val}</span>
            </div>
          ))}
          {d.knownIssues && <div className="text-sm border-b border-border/50 pb-2"><span className="text-muted-foreground">Known Issues: </span><span className="text-foreground">{d.knownIssues}</span></div>}
        </StaggerReveal>
      );
      break;
  }

  return (
    <div>
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
          <Button onClick={() => onFinish(d)} className="font-semibold">Start Assessment</Button>
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
      <InfoBox icon="🔍" title="Maritime Threat Landscape" color="blue">The threat analysis is based on the requirement categories of IACS UR E27 and identifies vulnerabilities in the Computer Based Systems (CBS) on board.</InfoBox>

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
        <Button onClick={onNext} className="font-semibold">E27 Mapping</Button>
      </div>
    </StaggerReveal>
  );
}

// ── Phase 4: E27 Mapping ──────────────────────────────────────

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
      <InfoBox icon="📋" title="IACS UR E27 Compliance Assessment" color="blue">Assessment of the vessel against the requirements of IACS UR E27 (Table 1 + Table 2).</InfoBox>

      {/* Score Overview */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-secondary" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{score}%</span>
            <span className="text-[10px] text-muted-foreground font-medium">Readiness</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="text-lg font-bold text-foreground mb-1">IACS UR E27 Compliance Score</div>
          <div className="text-sm text-muted-foreground mb-4">{reqs.length} requirements assessed</div>
          <div className="flex gap-5 text-sm flex-wrap justify-center sm:justify-start">
            {([['Compliant', pass, 'bg-green-500'], ['Partial', partial, 'bg-yellow-500'], ['Non-Compliant', fail, 'bg-destructive']] as [string, number, string][]).map(([label, count, bg]) => (
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

function ReportView({ intakeData, threats, reqs }: { intakeData: IecIntakeData; threats: IecThreat[]; reqs: IecReq[] }) {
  const [localThreats, setLocalThreats] = useState<IecThreat[]>(() => threats.map(th => ({ ...th, sources: [...th.sources] })));
  const [localReqs, setLocalReqs] = useState<IecReq[]>(() => reqs.map(r => ({ ...r, criteria: [...r.criteria] })));
  const [qaResult, setQaResult] = useState<QaResult | null>(null);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaExpanded, setQaExpanded] = useState(false);
  const [, setPreFixQaChecks] = useState<QaCheck[] | null>(null);
  const [allFixLogs, setAllFixLogs] = useState<string[]>([]);

  const critRisks = useMemo(() => localThreats.filter(th => th.likelihood * th.impact >= 20), [localThreats]);
  const failReqs = useMemo(() => localReqs.filter(r => r.status === 'fail'), [localReqs]);
  const today = useMemo(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), []);

  const securityLevels = useMemo(() => getSecurityLevels((k: string) => k), []);
  const slName = securityLevels.find(sl => sl.id === intakeData.securityLevel)?.label || intakeData.securityLevel || '—';

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

  const CATEGORY_LABELS: Record<string, string> = {
    consistency: 'A. Consistency Check', technical: 'B. Technical Correctness',
    evidence: 'C. Evidence Check', editorial: 'D. Editorial Check', ot: 'E. Maritime Check',
  };

  return (
    <StaggerReveal resetKey="rp" stagger={300}>
      <InfoBox icon="✅" title="Assessment Complete" color="green">The IACS UR E27 assessment has been performed. Run the quality check to validate the report.</InfoBox>

      {/* Report Header */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-l-4 border-primary p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">IACS UR E27 Assessment Report</div>
              <div className="text-xl font-bold text-foreground">{intakeData.facilityName}</div>
            </div>
            <div className="sm:text-right text-xs text-muted-foreground space-y-0.5">
              <div className="font-mono">{today}</div>
              <div className="font-medium">{slName}</div>
            </div>
          </div>
          <div className="h-px bg-border my-4" />
          <p className="text-sm text-foreground leading-relaxed">
            For vessel/system <strong>{intakeData.facilityName}</strong>, <strong>{localThreats.length} threats</strong> were identified, of which <strong className="text-destructive">{critRisks.length} are critical</strong>. Out of {localReqs.length} assessed requirements, <strong className="text-destructive">{failReqs.length} are non-compliant</strong>.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Threats" value={localThreats.length} />
        <KpiCard label="Critical Risks" value={critRisks.length} accent="danger" />
        <KpiCard label="Non-Compliant" value={failReqs.length} accent="danger" />
      </div>

      {/* Charts */}
      <SectionCard title="Assessment Overview" icon="📊">
        <Iec62443AuditCharts threats={localThreats} reqs={localReqs} />
      </SectionCard>

      {/* Critical risks */}
      {critRisks.length > 0 && (
        <SectionCard title={`Critical Risks (${critRisks.length})`} icon="🔴" className="border-destructive/30">
          <div className="space-y-3">
            {critRisks.map(th => (
              <div key={th.id} className="flex items-start gap-3 bg-destructive/5 border border-destructive/15 rounded-lg p-3">
                <span className="font-mono text-xs text-destructive font-bold bg-destructive/10 px-2 py-1 rounded-md flex-shrink-0">{threatId(th)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{th.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{th.component}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Score: <span className="font-mono font-bold text-destructive">{th.likelihood} × {th.impact} = {th.likelihood * th.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Fail reqs */}
      {failReqs.length > 0 && (
        <SectionCard title={`Non-Compliant Requirements (${failReqs.length})`} icon="⚠️" className="border-destructive/20">
          <div className="space-y-3">
            {failReqs.map((r, i) => (
              <div key={r.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-destructive font-mono text-sm bg-destructive/10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.article}</div>
                  </div>
                </div>
                <div className="ml-10 space-y-2 text-sm">
                  <div className="text-xs"><span className="font-semibold text-muted-foreground">Evidence: </span><span className="text-foreground">{r.evidence}</span></div>
                  {r.measure && (
                    <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 text-xs">
                      <span className="font-semibold text-primary">Measure: </span><span className="text-foreground">{r.measure}</span>
                    </div>
                  )}
                  <CriteriaBlock criteria={r.criteria} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* QA Result */}
      {qaResult && qaExpanded && (
        <div className={`bg-card border-2 rounded-xl overflow-hidden ${qaVerdict === 'passed' ? 'border-green-500/40' : qaVerdict === 'conditional' ? 'border-yellow-500/40' : 'border-destructive/40'}`}>
          <div className={`px-5 py-3.5 border-b flex items-center justify-between ${qaVerdict === 'passed' ? 'bg-green-500/10 border-green-500/20' : qaVerdict === 'conditional' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
            <div className="flex items-center gap-2">
              {qaVerdict === 'passed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : qaVerdict === 'conditional' ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
              <span className={`text-sm font-bold ${qaVerdict === 'passed' ? 'text-green-500' : qaVerdict === 'conditional' ? 'text-yellow-500' : 'text-destructive'}`}>{qaResult.verdictLabel}</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{qaResult.passed}/{qaResult.total}</span>
          </div>
          <div className="px-5 py-4 space-y-4 text-sm">
            <div className="bg-secondary rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${qaVerdict === 'passed' ? 'bg-green-500' : qaVerdict === 'conditional' ? 'bg-yellow-500' : 'bg-destructive'}`} style={{ width: `${Math.round((qaResult.passed / qaResult.total) * 100)}%` }} />
            </div>
            {(['consistency', 'technical', 'evidence', 'editorial', 'ot'] as const).map(cat => {
              const catChecks = qaResult.checks.filter(c => c.category === cat);
              if (catChecks.length === 0) return null;
              return (
                <div key={cat} className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground text-xs">{CATEGORY_LABELS[cat]}</span>
                    <span className="text-xs font-mono text-muted-foreground">{catChecks.filter(c => c.passed).length}/{catChecks.length}</span>
                  </div>
                  <div className="space-y-1">
                    {catChecks.map(check => (
                      <div key={check.id} className="flex items-start gap-2 text-xs">
                        <span className="flex-shrink-0 mt-0.5">{check.passed ? '✅' : '❌'}</span>
                        <div className="flex-1">
                          <span className={check.passed ? 'text-foreground' : 'text-destructive font-medium'}>{check.label}</span>
                          <span className="text-muted-foreground ml-1.5">— {check.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {allFixLogs.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-primary text-xs">Automated Corrections Applied</span>
                  <span className="text-xs font-mono text-muted-foreground ml-auto">{allFixLogs.length} fixes</span>
                </div>
                <ul className="space-y-1 text-xs text-foreground">
                  {allFixLogs.map((f, i) => (
                    <li key={i} className="flex gap-1.5 items-start">
                      <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-foreground">Export Report</div>
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
                  generateIec62443Report({
                    intakeData,
                    threats: localThreats,
                    reqs: localReqs,
                    language: 'en',
                    isDraft: qaVerdict !== 'passed',
                    qaChecks: qaResult.checks,
                    fixLog: allFixLogs,
                    qaIterations: 1,
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

const MAIN_STEPS = ['Data Collection', 'Threat Landscape', 'Risk Matrix', 'E27 Mapping', 'Report & Export'];

const Iec62443ComplianceTool = ({ embedded }: { embedded?: boolean }) => {
  const [step, setStepRaw] = useState(0);
  const [loading, setLoading] = useState(false);
  const [intakeData, setIntakeData] = useState<IecIntakeData>(EMPTY_INTAKE);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setStep = useCallback((s: number) => { setStepRaw(s); setTimeout(scrollToTop, 50); }, [scrollToTop]);

  const handleIntakeFinish = useCallback((data: IecIntakeData) => {
    setIntakeData(data);
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 2000);
  }, [setStep]);

  const reset = useCallback(() => { setStep(0); setIntakeData(EMPTY_INTAKE); }, [setStep]);

  const progressPct = ((step + 1) / MAIN_STEPS.length) * 100;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="IACS UR E27 Cyber Resilience Assessment" description="IACS UR E27 Compliance Assessment for maritime on-board systems" />}
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
            <div className="text-muted-foreground text-sm">CBS threats are being identified and assessed against IACS UR E27.</div>
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
            {step === 0 && <IntakeWizard onFinish={handleIntakeFinish} />}
            {step === 1 && <ThreatModel threats={IEC_THREATS} onNext={() => setStep(2)} />}
            {step === 2 && <RiskAssessment threats={IEC_THREATS} onNext={() => setStep(3)} />}
            {step === 3 && <IecMapping reqs={IEC_REQS} onNext={() => setStep(4)} />}
            {step === 4 && <ReportView intakeData={intakeData} threats={IEC_THREATS} reqs={IEC_REQS} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Iec62443ComplianceTool;
