/**
 * IACS UR E27 Rev.1 — Readiness Assessment phase blocks.
 *
 * These blocks cover the E27-specific scoping and evidence logic that the
 * generic intake wizard did not ask for:
 *  - applicability (vessel level per UR E26 vs. system/equipment level per E27)
 *  - UR E22 system category (I / II / III) driving requirement depth
 *  - asset & software inventory and topology expectations
 *  - untrusted-network trigger for the conditional requirement set
 *  - capability status incl. compensating measures and evidence grading
 *  - the E27 documentation package
 */
import { memo } from 'react';
import {
  VESSEL_TYPES, CBS_CATEGORY_OPTS, ASSET_CLASSES, CONNECTIVITY_OPTS,
  REMOTE_ACCESS_TYPES, REMOTE_ACCESS_CONTROLS, DOC_PACKAGE_ITEMS, DOC_STATE_LABELS,
  EVIDENCE_GRADES, CAPABILITY_LABELS, vesselApplicability, categoryApplicability, reqTier,
  EMPTY_VESSEL, EMPTY_CBS, EMPTY_SUPPLY_CHAIN,
  type IecIntakeData, type IecReq, type ThreeState, type DocState,
  type CapabilityState, type EvidenceGrade, type CbsCategory,
} from '@/data/iec62443Data';

type Setter = React.Dispatch<React.SetStateAction<IecIntakeData>>;

const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none';
const labelCls = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5';

export const LevelTag = memo(({ level }: { level: 1 | 2 | 3 }) => {
  const map = {
    1: { label: 'Level 1 · Quick intake', cls: 'bg-primary/10 text-primary border-primary/20' },
    2: { label: 'Level 2 · Detailed assessment', cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    3: { label: 'Level 3 · Evidence & documentation', cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
  }[level];
  return <span className={`inline-block text-[10px] font-bold uppercase tracking-wider border rounded px-2 py-0.5 ${map.cls}`}>{map.label}</span>;
});

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function TriState({ value, onChange, yes = 'Yes', no = 'No' }: { value: ThreeState; onChange: (v: ThreeState) => void; yes?: string; no?: string }) {
  const opts: { id: ThreeState; label: string }[] = [
    { id: 'yes', label: yes }, { id: 'no', label: no }, { id: 'unknown', label: 'Not known' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`border rounded-lg px-3 py-1.5 text-sm transition-all ${value === o.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{o.label}</button>
      ))}
    </div>
  );
}

function ChipRow({ options, selected, onToggle, cols = 2 }: { options: readonly { id: string; label: string }[]; selected: string[]; onToggle: (id: string) => void; cols?: number }) {
  return (
    <div className={`grid gap-2 ${cols === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {options.map(o => (
        <button key={o.id} onClick={() => onToggle(o.id)} className={`border rounded-lg px-3 py-2 text-sm text-left transition-all flex items-center gap-2 ${selected.includes(o.id) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
          <span className="flex-1">{o.label}</span>
          {selected.includes(o.id) && <span className="text-xs text-primary">✓</span>}
        </button>
      ))}
    </div>
  );
}

// ── Phase: Applicability & Scope ───────────────────────────────

export function E27ScopePhase({ d, setD }: { d: IecIntakeData; setD: Setter }) {
  const v = d.vessel || EMPTY_VESSEL;
  const set = (patch: Partial<typeof v>) => setD(prev => ({ ...prev, vessel: { ...(prev.vessel || EMPTY_VESSEL), ...patch } }));
  const app = vesselApplicability(v);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Vessel Type">
          <select className={inputCls} value={v.vesselType} onChange={e => set({ vesselType: e.target.value })}>
            <option value="">Select…</option>
            {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Flag State">
          <input className={inputCls} placeholder="e.g. Liberia" value={v.flag} onChange={e => set({ flag: e.target.value })} />
        </Field>
        <Field label="Classification Society">
          <input className={inputCls} placeholder="e.g. DNV, LR, BV, ABS" value={v.classSociety} onChange={e => set({ classSociety: e.target.value })} />
        </Field>
        <Field label="Construction Contract Date" hint="Drives whether UR E27 Rev.1 applies as a mandatory class requirement.">
          <input className={inputCls} placeholder="e.g. 2024-06-15" value={v.contractDate} onChange={e => set({ contractDate: e.target.value })} />
        </Field>
      </div>

      <Field label="Contracted for construction on or after 1 January 2024?">
        <TriState value={v.newbuild} onChange={val => set({ newbuild: val })} />
      </Field>

      <Field label="Is the vessel-level requirement UR E26 also in scope?" hint="E26 covers the integration of CBS into the vessel; E27 covers the individual system or equipment. This assessment addresses E27.">
        <TriState value={v.e26InScope} onChange={val => set({ e26InScope: val })} />
      </Field>

      <div className={`border rounded-lg px-4 py-3 text-sm ${app.verdict === 'mandatory' ? 'bg-destructive/5 border-destructive/20' : app.verdict === 'undetermined' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="font-semibold text-foreground mb-0.5">
          Applicability: {app.verdict === 'mandatory' ? 'Mandatory' : app.verdict === 'voluntary' ? 'Voluntary benchmark' : 'Undetermined'}
        </div>
        <div className="text-muted-foreground">{app.rationale}</div>
      </div>
    </div>
  );
}

// ── Phase: CBS identification extras ──────────────────────────

export function E27CbsExtras({ d, setD }: { d: IecIntakeData; setD: Setter }) {
  const c = d.cbs || EMPTY_CBS;
  const set = (patch: Partial<typeof c>) => setD(prev => ({ ...prev, cbs: { ...(prev.cbs || EMPTY_CBS), ...patch } }));
  const cat = categoryApplicability(c.category);

  return (
    <div className="space-y-4">
      <Field label="Functional Description of the CBS" hint="What does this system do on board, and what happens on failure?">
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="e.g. Autopilot and heading control including rudder command interface to the steering gear" value={c.cbsFunction} onChange={e => set({ cbsFunction: e.target.value })} />
      </Field>

      <Field label="Is this CBS in the scope of UR E27?" hint="Systems without safety, environmental or operational relevance may be excluded — the exclusion must be justified.">
        <TriState value={c.cbsInScope} onChange={val => set({ cbsInScope: val })} yes="In scope" no="Excluded" />
      </Field>

      <Field label="UR E22 System Category" hint="The category is mandatory input: it determines the applicable requirement depth for the CBS.">
        <div className="space-y-2">
          {CBS_CATEGORY_OPTS.map(o => (
            <button key={o.id} onClick={() => set({ category: o.id as CbsCategory })} className={`w-full text-left border-2 rounded-xl px-4 py-2.5 transition-all ${c.category === o.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
              <div className="font-semibold text-sm text-foreground">{o.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Basis for the Category Assignment">
        <input className={inputCls} placeholder="e.g. FMEA of the steering function, agreed with class in design review" value={c.categoryBasis} onChange={e => set({ categoryBasis: e.target.value })} />
      </Field>

      <Field label="Supplier Type Approval Status">
        <select className={inputCls} value={c.supplierTypeApproval} onChange={e => set({ supplierTypeApproval: e.target.value as typeof c.supplierTypeApproval })}>
          <option value="unknown">Not known</option>
          <option value="approved">Type approval with cyber scope held</option>
          <option value="in_progress">Application in progress</option>
          <option value="none">No type approval</option>
        </select>
      </Field>

      <div className="bg-secondary/40 border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">{cat.note}</div>
    </div>
  );
}

// ── Phase: Asset & software inventory ─────────────────────────

export function E27InventoryPhase({ d, setD }: { d: IecIntakeData; setD: Setter }) {
  const counts = d.assetCounts || {};
  const assets = d.assets || [];

  const setCount = (id: string, val: string) => setD(prev => ({ ...prev, assetCounts: { ...(prev.assetCounts || {}), [id]: val } }));
  const addAsset = () => setD(prev => ({
    ...prev,
    assets: [...(prev.assets || []), { id: crypto.randomUUID(), name: '', vendor: '', fwVersion: '', zone: '', interfaces: '', criticality: '' as const }],
  }));
  const setAsset = (id: string, patch: Partial<(typeof assets)[number]>) => setD(prev => ({
    ...prev, assets: (prev.assets || []).map(a => a.id === id ? { ...a, ...patch } : a),
  }));
  const removeAsset = (id: string) => setD(prev => ({ ...prev, assets: (prev.assets || []).filter(a => a.id !== id) }));

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Asset Classes in the CBS (counts)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ASSET_CLASSES.map(a => (
            <div key={a.id} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-card">
              <span className="text-sm text-foreground flex-1">{a.label}</span>
              <input inputMode="numeric" className="w-16 border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground text-right font-mono" placeholder="0" value={counts[a.id] || ''} onChange={e => setCount(a.id, e.target.value.replace(/[^0-9]/g, ''))} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${labelCls} mb-0`}>Key Assets (optional detail)</label>
          <button onClick={addAsset} className="text-xs font-semibold text-primary hover:underline">+ Add asset</button>
        </div>
        {assets.length === 0 && (
          <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-3">
            No individual assets listed yet. UR E27 expects an inventory identifying hardware, software and firmware versions of the CBS components.
          </div>
        )}
        <div className="space-y-2">
          {assets.map(a => (
            <div key={a.id} className="border border-border rounded-lg p-3 bg-card space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className={inputCls} placeholder="Component name" value={a.name} onChange={e => setAsset(a.id, { name: e.target.value })} />
                <input className={inputCls} placeholder="Vendor" value={a.vendor} onChange={e => setAsset(a.id, { vendor: e.target.value })} />
                <input className={inputCls} placeholder="SW / firmware version" value={a.fwVersion} onChange={e => setAsset(a.id, { fwVersion: e.target.value })} />
                <input className={inputCls} placeholder="Zone" value={a.zone} onChange={e => setAsset(a.id, { zone: e.target.value })} />
                <input className={inputCls} placeholder="Interfaces (e.g. Ethernet, serial, USB)" value={a.interfaces} onChange={e => setAsset(a.id, { interfaces: e.target.value })} />
                <select className={inputCls} value={a.criticality} onChange={e => setAsset(a.id, { criticality: e.target.value as typeof a.criticality })}>
                  <option value="">Criticality…</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <button onClick={() => removeAsset(a.id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Phase: Architecture extras ────────────────────────────────

export function E27ArchitectureExtras({ d, setD }: { d: IecIntakeData; setD: Setter }) {
  const conn = d.connectivity || [];
  const toggleConn = (id: string) => setD(prev => {
    const cur = prev.connectivity || [];
    return { ...prev, connectivity: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
  });

  return (
    <div className="space-y-4">
      <Field label="External Interfaces of the CBS">
        <ChipRow options={CONNECTIVITY_OPTS} selected={conn} onToggle={toggleConn} />
      </Field>

      <Field label="Topology Documentation Available" hint="UR E27 expects the CBS topology to be documented as delivered.">
        <select className={inputCls} value={d.topology || ''} onChange={e => setD(prev => ({ ...prev, topology: e.target.value as IecIntakeData['topology'] }))}>
          <option value="">Select…</option>
          <option value="both">Physical and logical diagram</option>
          <option value="physical">Physical diagram only</option>
          <option value="logical">Logical diagram only</option>
          <option value="none">No diagram available</option>
        </select>
      </Field>

      <Field label="Zone & Conduit Boundaries" hint="Which boundaries separate this CBS from other systems, and how are they enforced?">
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="e.g. CBS in the machinery zone, single conduit to the ship LAN via firewall with whitelisted Modbus/TCP" value={d.boundaries || ''} onChange={e => setD(prev => ({ ...prev, boundaries: e.target.value }))} />
      </Field>
    </div>
  );
}

// ── Phase: Access & untrusted networks ────────────────────────

export function E27AccessPhase({ d, setD }: { d: IecIntakeData; setD: Setter }) {
  const types = d.remoteAccessTypes || [];
  const controls = d.remoteAccessControls || {};
  const toggleType = (id: string) => setD(prev => {
    const cur = prev.remoteAccessTypes || [];
    return { ...prev, remoteAccessTypes: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
  });
  const toggleControl = (id: string) => setD(prev => ({
    ...prev, remoteAccessControls: { ...(prev.remoteAccessControls || {}), [id]: !(prev.remoteAccessControls || {})[id] },
  }));

  const utn = d.untrustedNetwork || 'unknown';

  return (
    <div className="space-y-4">
      <Field label="Is the CBS connected to an untrusted network?" hint="Untrusted means any network not fully under the operator's control — shore links, vendor access, crew networks.">
        <TriState value={utn} onChange={val => setD(prev => ({ ...prev, untrustedNetwork: val }))} />
      </Field>

      <div className={`border rounded-lg px-4 py-3 text-sm ${utn === 'yes' ? 'bg-destructive/5 border-destructive/20' : utn === 'no' ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
        {utn === 'yes'
          ? 'The conditional requirements for untrusted-network connections (E27 items 31–41) are added to the applicable requirement set.'
          : utn === 'no'
            ? 'The conditional untrusted-network requirements are excluded. The absence of any untrusted connection must be evidenced by the topology documentation.'
            : 'Until this is answered, the conditional untrusted-network requirements are kept in scope as a conservative assumption.'}
      </div>

      <Field label="Remote Access to the CBS">
        <ChipRow options={REMOTE_ACCESS_TYPES} selected={types} onToggle={toggleType} />
      </Field>

      {types.length > 0 && !types.includes('none') && (
        <Field label="Remote Access Controls in Place">
          <div className="space-y-1.5">
            {REMOTE_ACCESS_CONTROLS.map(c => (
              <label key={c.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2 bg-card cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={!!controls[c.id]} onChange={() => toggleControl(c.id)} />
                <span className="text-sm text-foreground">{c.label}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}

// ── Phase: Supply chain ───────────────────────────────────────

export function E27SupplyChainPhase({ d, setD }: { d: IecIntakeData; setD: Setter }) {
  const s = d.supplyChain || EMPTY_SUPPLY_CHAIN;
  const set = (patch: Partial<typeof s>) => setD(prev => ({ ...prev, supplyChain: { ...(prev.supplyChain || EMPTY_SUPPLY_CHAIN), ...patch } }));
  const docFields: { key: keyof typeof s; label: string }[] = [
    { key: 'e27Declaration', label: 'Supplier declaration of conformity to UR E27' },
    { key: 'iec62443Cert', label: 'IEC 62443-4-1 / 4-2 certification of the product or process' },
    { key: 'securityGuidelines', label: 'Secure configuration & hardening guidelines supplied' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="System Manufacturer / OEM"><input className={inputCls} value={s.manufacturer} onChange={e => set({ manufacturer: e.target.value })} /></Field>
        <Field label="System Integrator"><input className={inputCls} value={s.integrator} onChange={e => set({ integrator: e.target.value })} /></Field>
        <Field label="Shipyard"><input className={inputCls} value={s.shipyard} onChange={e => set({ shipyard: e.target.value })} /></Field>
        <Field label="Relevant Subcontractors"><input className={inputCls} value={s.subcontractors} onChange={e => set({ subcontractors: e.target.value })} /></Field>
      </div>
      <div>
        <label className={labelCls}>Supplier Deliverables</label>
        <div className="space-y-2">
          {docFields.map(f => (
            <div key={String(f.key)} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-border rounded-lg px-3 py-2 bg-card">
              <span className="text-sm text-foreground flex-1">{f.label}</span>
              <select className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground" value={s[f.key] as DocState} onChange={e => set({ [f.key]: e.target.value as DocState } as Partial<typeof s>)}>
                {(Object.keys(DOC_STATE_LABELS) as DocState[]).map(k => <option key={k} value={k}>{DOC_STATE_LABELS[k]}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Phase: Capability status per requirement ──────────────────

export function E27CapabilitiesPhase({ d, setD, reqs }: { d: IecIntakeData; setD: Setter; reqs: IecReq[] }) {
  const caps = d.capabilities || {};
  const comp = d.compensating || {};
  const utn = d.untrustedNetwork;
  const scoped = utn === 'no' ? reqs.filter(r => reqTier(r) === 'core') : reqs;

  const setCap = (id: string, val: CapabilityState) => setD(prev => ({ ...prev, capabilities: { ...(prev.capabilities || {}), [id]: val } }));
  const setComp = (id: string, val: string) => setD(prev => ({ ...prev, compensating: { ...(prev.compensating || {}), [id]: val } }));

  const groups = Array.from(new Set(scoped.map(r => r.id.split('-')[0])));

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted-foreground">
        {scoped.length} requirements in scope ({scoped.filter(r => reqTier(r) === 'core').length} core
        {scoped.some(r => reqTier(r) === 'utn') ? `, ${scoped.filter(r => reqTier(r) === 'utn').length} conditional for untrusted networks` : ''}).
      </div>
      {groups.map(g => (
        <div key={g}>
          <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{g}</div>
          <div className="space-y-2">
            {scoped.filter(r => r.id.split('-')[0] === g).map(r => {
              const state = caps[r.id] || 'unknown';
              return (
                <div key={r.id} className="border border-border rounded-lg px-3 py-2.5 bg-card space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r.article}{reqTier(r) === 'utn' ? ' · conditional (UTN)' : ''}</div>
                    </div>
                    <select className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground" value={state} onChange={e => setCap(r.id, e.target.value as CapabilityState)}>
                      {(Object.keys(CAPABILITY_LABELS) as CapabilityState[]).map(k => <option key={k} value={k}>{CAPABILITY_LABELS[k]}</option>)}
                    </select>
                  </div>
                  {state === 'compensated' && (
                    <input className={inputCls} placeholder="Describe the compensating measure and who accepted it" value={comp[r.id] || ''} onChange={e => setComp(r.id, e.target.value)} />
                  )}
                  {state === 'na' && (
                    <input className={inputCls} placeholder="Justification for non-applicability (required)" value={comp[r.id] || ''} onChange={e => setComp(r.id, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Phase: Evidence grading & documentation package ───────────

export function E27EvidencePhase({ d, setD, reqs }: { d: IecIntakeData; setD: Setter; reqs: IecReq[] }) {
  const grades = d.evidenceGrades || {};
  const docs = d.docPackage || {};
  const caps = d.capabilities || {};
  const claimed = reqs.filter(r => {
    const s = caps[r.id];
    return s === 'implemented' || s === 'partial' || s === 'compensated';
  });

  const setGrade = (id: string, val: EvidenceGrade) => setD(prev => ({ ...prev, evidenceGrades: { ...(prev.evidenceGrades || {}), [id]: val } }));
  const setDoc = (id: string, val: DocState) => setD(prev => ({ ...prev, docPackage: { ...(prev.docPackage || {}), [id]: val } }));

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Documentation Package (UR E27 deliverables)</label>
        <div className="space-y-2">
          {DOC_PACKAGE_ITEMS.map(i => (
            <div key={i.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-border rounded-lg px-3 py-2 bg-card">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">{i.label}</div>
                <div className="text-xs text-muted-foreground font-mono">{i.ref}</div>
              </div>
              <select className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground" value={docs[i.id] || 'missing'} onChange={e => setDoc(i.id, e.target.value as DocState)}>
                {(Object.keys(DOC_STATE_LABELS) as DocState[]).map(k => <option key={k} value={k}>{DOC_STATE_LABELS[k]}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Evidence Grade per Claimed Capability</label>
        {claimed.length === 0 ? (
          <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-3">
            No capabilities were declared as implemented, partial or compensated, so there is nothing to grade yet.
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-2">
              A capability that is only claimed — not documented or verified — is not audit-ready and is scored down accordingly.
            </div>
            <div className="space-y-2">
              {claimed.map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-border rounded-lg px-3 py-2 bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.article}</div>
                  </div>
                  <select className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground" value={grades[r.id] || 'none'} onChange={e => setGrade(r.id, e.target.value as EvidenceGrade)}>
                    {EVIDENCE_GRADES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
