import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { Send, Plus, MessageCircle, Shield, Target, BookOpen, AlertTriangle, Eye, Flame, Swords, Calendar, FileText, UserCheck, ChevronLeft, Menu, ShieldCheck, Search, Settings, Award, RotateCcw, Network, CreditCard, CheckCircle, FileCheck, Car, BarChart, RefreshCw, GraduationCap, ClipboardList, Zap, Crown, Users, Gamepad2, Monitor, Users2, Lightbulb, Flag, Crosshair, CheckSquare, Mic, Presentation, Wrench, Radio, Video, DollarSign, Phone, Mail, Server, Bug, AlertCircle, MessageSquare, Globe, Building2, Plane, Landmark, Scale, Wifi, XCircle, HelpCircle, Loader2, X, Linkedin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { consultantProfiles } from '@/data/consultantProfiles';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { LucideIcon } from 'lucide-react';

interface NavLink { url: string; label: string; }
interface AiResponse { message: string; links: NavLink[]; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; links?: NavLink[]; }

// ── Chat-styled content blocks ──────────────────────────────────────────────

const Block = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl px-5 py-4 text-sm md:text-base font-sans leading-relaxed tracking-wide text-foreground ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-primary text-lg font-bold font-mono mb-3">{children}</h2>
);

const SubTitle = ({ children, variant = 'primary' }: { children: ReactNode; variant?: 'primary' | 'highlight' }) => (
  <h3 className={`${variant === 'highlight' ? 'text-highlight' : 'text-primary'} font-semibold font-mono text-sm mb-1`}>{children}</h3>
);

const CardBlock = ({ icon: Icon, title, desc, variant = 'primary', link, linkLabel, bullets, result }: { icon: LucideIcon; title: string; desc: string; variant?: 'primary' | 'highlight'; link?: string; linkLabel?: string; bullets?: string[]; result?: string }) => (
  <div className={`rounded-xl p-4 ${variant === 'highlight' ? 'bg-highlight/5 border border-highlight/20' : 'bg-primary/5 border border-primary/20'}`}>
    <div className="flex items-start gap-3">
      <Icon size={22} className={`mt-0.5 flex-shrink-0 ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`} />
      <div>
        <SubTitle variant={variant}>{title}</SubTitle>
        <p className="text-foreground text-sm md:text-base font-sans leading-relaxed tracking-wide whitespace-pre-line">{desc}</p>
        {bullets && bullets.length > 0 && (
          <ul className="text-foreground text-sm md:text-base font-sans leading-relaxed tracking-wide space-y-1.5 mt-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2"><span className="flex-shrink-0">•</span><span>{b}</span></li>
            ))}
          </ul>
        )}
        {result && <p className="mt-2 text-sm font-semibold text-primary font-mono">{result}</p>}
        {link && linkLabel && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-highlight hover:text-primary transition-electric text-sm font-sans underline">
            → {linkLabel}
          </a>
        )}
      </div>
    </div>
  </div>
);

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-3 text-center">
    <div className="text-xl font-bold text-highlight font-mono">{value}</div>
    <div className="text-sm font-sans text-foreground">{label}</div>
  </div>
);

const GridItem = ({ icon: Icon, title, desc, variant = 'primary' }: { icon: LucideIcon; title: string; desc: string; variant?: 'primary' | 'highlight' }) => (
  <div className="flex items-start gap-2">
    <Icon size={20} className={`mt-0.5 flex-shrink-0 ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`} />
    <div>
      <p className={`font-semibold text-sm md:text-base font-sans ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`}>{title}</p>
      <p className="text-foreground text-sm md:text-base font-sans leading-relaxed tracking-wide">{desc}</p>
    </div>
  </div>
);

// ── Inline System Check (chat-style) ────────────────────────────────────────

interface SysResult { label: string; status: 'pass' | 'fail' | 'unknown'; detail: string; }

const InlineSystemCheck = ({ t }: { t: (k: string) => string }) => {
  const [results, setResults] = useState<SysResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const ua = navigator.userAgent;
      const isWin = /Windows/.test(ua); const isMac = /Macintosh|Mac OS/.test(ua);
      const isLinux = /Linux/.test(ua) && !/Android/.test(ua);
      const isMobile = /Android|iPhone|iPad|iPod/.test(ua);
      const osName = isWin ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isMobile ? 'Mobile' : 'Unknown';
      const lW = window.screen.width; const lH = window.screen.height; const minOk = lW >= 1024 && lH >= 768;
      const isChrome = /Chrome\//.test(ua) && !/Edge/.test(ua);
      const isFF = /Firefox\//.test(ua); const isSafari = /Safari\//.test(ua) && !/Chrome/.test(ua); const isEdge = /Edg\//.test(ua);
      const browser = isEdge ? 'Edge' : isChrome ? 'Chrome' : isFF ? 'Firefox' : isSafari ? 'Safari' : 'Unknown';
      setResults([
        { label: t('techReq.sysCheckLabelOS'), status: isMobile ? 'fail' : (isWin || isMac || isLinux) ? 'pass' : 'unknown', detail: osName },
        { label: t('techReq.sysCheckLabelScreen'), status: minOk ? 'pass' : 'fail', detail: `${lW}×${lH}` },
        { label: t('techReq.sysCheckLabelBrowser'), status: (isChrome || isFF || isSafari || isEdge) ? 'pass' : 'unknown', detail: browser },
      ]);
      setLoading(false);
    }, 600);
  }, [t]);

  const icon = (s: SysResult['status']) => s === 'pass' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : s === 'fail' ? <XCircle className="w-3.5 h-3.5 text-destructive" /> : <HelpCircle className="w-3.5 h-3.5 text-yellow-500" />;

  return (
    <div className="rounded-xl p-4 bg-highlight/5 border border-highlight/20">
      <div className="flex items-center gap-2 mb-2">
        <Monitor size={16} className="text-highlight" />
        <SubTitle variant="highlight">{t('techReq.sysCheckCardTitle')}</SubTitle>
      </div>
      <p className="text-sm font-sans leading-relaxed tracking-wide text-foreground mb-3">{t('techReq.sysCheckCardDesc')}</p>
      <button onClick={run} disabled={loading} className="flex items-center gap-2 bg-highlight text-highlight-foreground px-4 py-1.5 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('techReq.sysCheckRunning')}</> : <><Monitor className="w-4 h-4" /> {t('techReq.sysCheckRunBtn')}</>}
      </button>
      {results && (
        <div className="mt-3 space-y-1.5">
          {results.map(r => (
            <div key={r.label} className="flex items-center gap-2 text-sm font-sans">
              {icon(r.status)}
              <span className="font-sans font-semibold text-foreground">{r.label}</span>
              <span className="text-foreground">{r.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Inline Connectivity Check (chat-style) ──────────────────────────────────

const PROBE_HOST = 'portquiz.net';
const PROBE_TIMEOUT = 12000;
const PROBE_GROUPS = [
  { label: 'RDP (Training)', ports: Array.from({ length: 21 }, (_, i) => 7000 + i) },
  { label: 'HTTPS', ports: [443] },
];

function probePort(host: string, port: number, timeoutMs: number): Promise<{ port: number; status: 'reachable' | 'blocked'; latencyMs: number }> {
  return new Promise(resolve => {
    const start = performance.now();
    const img = new Image();
    let settled = false;
    const settle = (status: 'reachable' | 'blocked') => { if (settled) return; settled = true; clearTimeout(timer); img.src = ''; resolve({ port, status, latencyMs: Math.round(performance.now() - start) }); };
    const timer = setTimeout(() => settle('blocked'), timeoutMs);
    img.onload = () => settle('reachable');
    img.onerror = () => settle(performance.now() - start < 5000 ? 'reachable' : 'blocked');
    img.src = `http://${host}:${port}/?cb=${Date.now()}-${port}`;
  });
}

const InlineConnectivityCheck = ({ t, language }: { t: (k: string) => string; language: string }) => {
  const [results, setResults] = useState<{ port: number; status: 'reachable' | 'blocked'; latencyMs: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const run = useCallback(async () => {
    setLoading(true); setResults(null);
    const allPorts = PROBE_GROUPS.flatMap(g => g.ports);
    setProgress({ done: 0, total: allPorts.length });
    const collected: typeof results extends infer T ? NonNullable<T> : never = [];
    for (let i = 0; i < allPorts.length; i += 5) {
      const batch = await Promise.all(allPorts.slice(i, i + 5).map(p => probePort(PROBE_HOST, p, PROBE_TIMEOUT)));
      collected.push(...batch);
      setProgress({ done: collected.length, total: allPorts.length });
    }
    setResults([...collected]); setLoading(false);
  }, []);

  return (
    <div className="rounded-xl p-4 bg-highlight/5 border border-highlight/20">
      <div className="flex items-center gap-2 mb-2">
        <Wifi size={16} className="text-highlight" />
        <SubTitle variant="highlight">{t('techReq.connectivityTitle')}</SubTitle>
      </div>
      <p className="text-sm font-sans leading-relaxed tracking-wide text-foreground mb-3">{t('techReq.connectivityDesc')}</p>
      <button onClick={run} disabled={loading} className="flex items-center gap-2 bg-highlight text-highlight-foreground px-4 py-1.5 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('techReq.testing')}</> : <><Wifi className="w-4 h-4" /> {t('techReq.runTest')}</>}
      </button>
      {loading && (
        <div className="mt-2">
          <div className="w-full h-1.5 rounded bg-secondary overflow-hidden">
            <div className="h-full bg-highlight transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="text-sm font-sans text-foreground mt-1">{progress.done}/{progress.total} {t('techReq.portsChecked')}</p>
        </div>
      )}
      {results && (
        <div className="mt-3 space-y-2">
          {PROBE_GROUPS.map(group => {
            const gr = results.filter(r => group.ports.includes(r.port));
            const ok = gr.filter(r => r.status === 'reachable').length;
            return (
              <div key={group.label}>
                <div className="flex items-center justify-between text-sm font-mono mb-1">
                  <span className="text-foreground font-semibold">{group.label}</span>
                  <span className={ok === gr.length ? 'text-green-500' : ok > 0 ? 'text-yellow-500' : 'text-destructive'}>{ok}/{gr.length} {t('techReq.reachable')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {gr.map(r => (
                    <span key={r.port} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-sm font-mono border ${r.status === 'reachable' ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                      {r.status === 'reachable' ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />} {r.port}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <div className={`flex items-start gap-2 mt-2 p-2 rounded border text-sm font-mono ${results.every(r => r.status === 'reachable') ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
            {results.every(r => r.status === 'reachable') ? <><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{t('techReq.allPortsOk')}</p></> : <><XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{t('techReq.someBlocked')}</p></>}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Service content renderers ───────────────────────────────────────────────

const useServiceContent = () => {
  const { t, language } = useLanguage();

  const contentMap: Record<string, () => ReactNode> = {
    isms: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('isms.title')}</SectionTitle><p>{t('isms.intro')}</p></Block>
        <CardBlock icon={ShieldCheck} title={t('isms.iso27001Title')} desc={t('isms.iso27001Desc')} />
        <CardBlock icon={FileText} title={t('isms.bsiTitle')} desc={t('isms.bsiDesc')} variant="highlight" />
        <Block className="bg-secondary/30">
          <SectionTitle>{t('isms.approachTitle')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GridItem icon={Search} title={t('isms.assessmentTitle')} desc={t('isms.assessmentDesc')} />
            <GridItem icon={Settings} title={t('isms.implementationTitle')} desc={t('isms.implementationDesc')} />
            <GridItem icon={Award} title={t('isms.certificationTitle')} desc={t('isms.certificationDesc')} />
            <GridItem icon={RotateCcw} title={t('isms.maintenanceTitle')} desc={t('isms.maintenanceDesc')} />
          </div>
        </Block>
      </div>
    ),
    'nis2-dora': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('nis2.title')}</SectionTitle><p>{t('nis2.intro')}</p></Block>
        <CardBlock icon={Search} title={t('nis2.impactTitle')} desc={t('nis2.impactDesc')} />
        <CardBlock icon={AlertCircle} title={t('nis2.gapTitle')} desc={t('nis2.gapDesc')} />
        <CardBlock icon={ShieldCheck} title={t('nis2.measuresTitle')} desc={t('nis2.measuresDesc')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('nis2.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Building2} title={t('nis2.nis2Name')} desc={t('nis2.nis2Desc')} variant="highlight" />
            <GridItem icon={Landmark} title={t('nis2.doraName')} desc={t('nis2.doraDesc')} variant="highlight" />
            <GridItem icon={Plane} title={t('nis2.partisName')} desc={t('nis2.partisDesc')} variant="highlight" />
          </div>
        </Block>
      </div>
    ),
    'tisax-pci-dss': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('tisax.title')}</SectionTitle><p>{t('tisax.intro')}</p></Block>
        <CardBlock icon={Settings} title={t('tisax.implTitle')} desc={t('tisax.implDesc')} />
        <CardBlock icon={CheckCircle} title={t('tisax.reviewsTitle')} desc={t('tisax.reviewsDesc')} variant="highlight" />
        <CardBlock icon={FileCheck} title={t('tisax.auditTitle')} desc={t('tisax.auditDesc')} />
        <Block className="bg-secondary/30">
          <SubTitle>{t('tisax.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Car} title={t('tisax.tisaxName')} desc={t('tisax.tisaxDesc')} />
            <GridItem icon={CreditCard} title={t('tisax.pciName')} desc={t('tisax.pciDesc')} />
          </div>
        </Block>
      </div>
    ),
    'assessments-concepts': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('assessments.title')}</SectionTitle><p>{t('assessments.intro')}</p></Block>
        <CardBlock icon={Search} title={t('assessments.threatTitle')} desc={t('assessments.threatDesc')} />
        <CardBlock icon={ShieldCheck} title={t('assessments.controlsTitle')} desc={t('assessments.controlsDesc')} variant="highlight" />
        <CardBlock icon={Users} title={t('assessments.rolesTitle')} desc={t('assessments.rolesDesc')} />
        <CardBlock icon={Calendar} title={t('assessments.planningTitle')} desc={t('assessments.planningDesc')} variant="highlight" />
        <CardBlock icon={BarChart} title={t('assessments.measureTitle')} desc={t('assessments.measureDesc')} />
      </div>
    ),
    'incident-management': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('incident.title')}</SectionTitle><p>{t('incident.intro')}</p></Block>
        <CardBlock icon={FileText} title={t('incident.planTitle')} desc={t('incident.planDesc')} />
        <CardBlock icon={Eye} title={t('incident.detectionTitle')} desc={t('incident.detectionDesc')} variant="highlight" />
        <CardBlock icon={AlertTriangle} title={t('incident.containTitle')} desc={t('incident.containDesc')} />
        <CardBlock icon={RefreshCw} title={t('incident.recoveryTitle')} desc={t('incident.recoveryDesc')} variant="highlight" />
        <CardBlock icon={GraduationCap} title={t('incident.simTitle')} desc={t('incident.simDesc')} />
      </div>
    ),
    'cyber-crisis-management': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('cyberCrisis.title')}</SectionTitle><p>{t('cyberCrisis.intro')}</p></Block>
        <CardBlock icon={ClipboardList} title={t('cyberCrisis.planTitle')} desc={t('cyberCrisis.planDesc')} />
        <CardBlock icon={Zap} title={t('cyberCrisis.scenarioTitle')} desc={t('cyberCrisis.scenarioDesc')} variant="highlight" />
        <CardBlock icon={Target} title={t('cyberCrisis.simTitle')} desc={t('cyberCrisis.simDesc')} />
        <CardBlock icon={Crown} title={t('cyberCrisis.leaderTitle')} desc={t('cyberCrisis.leaderDesc')} variant="highlight" />
        <CardBlock icon={MessageSquare} title={t('cyberCrisis.commTitle')} desc={t('cyberCrisis.commDesc')} />
        <Block><h2 className="text-highlight text-lg font-bold font-mono mb-3">{t('cyberCrisis.methTitle')}</h2></Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GridItem icon={Users} title={t('cyberCrisis.tabletop')} desc={t('cyberCrisis.tabletopDesc')} variant="highlight" />
            <GridItem icon={Gamepad2} title={t('cyberCrisis.liveSim')} desc={t('cyberCrisis.liveSimDesc')} variant="highlight" />
            <GridItem icon={Monitor} title={t('cyberCrisis.cyberRange')} desc={t('cyberCrisis.cyberRangeDesc')} variant="highlight" />
          </div>
        </Block>
        <Block className="bg-secondary/30">
          <SubTitle>{t('cyberCrisis.outcomesTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={ShieldCheck} title={t('cyberCrisis.readiness')} desc={t('cyberCrisis.readinessDesc')} />
            <GridItem icon={Users2} title={t('cyberCrisis.coordination')} desc={t('cyberCrisis.coordinationDesc')} />
            <GridItem icon={Lightbulb} title={t('cyberCrisis.leadership')} desc={t('cyberCrisis.leadershipDesc')} />
          </div>
        </Block>
      </div>
    ),
    'arena-training': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('arena.title')}</SectionTitle><p>{t('arena.intro')}</p></Block>
        <CardBlock icon={Target} title={t('arena.arenaTitle')} desc={t('arena.arenaDesc')} />
        <CardBlock icon={Flag} title={t('arena.tiberTitle')} desc={t('arena.tiberDesc')} variant="highlight" />
        <Block className="bg-secondary/30">
          <SubTitle>{t('arena.methTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Gamepad2} title={t('arena.realisticTitle')} desc={t('arena.realisticDesc')} />
            <GridItem icon={Crosshair} title={t('arena.handsOnTitle')} desc={t('arena.handsOnDesc')} />
            <GridItem icon={Users} title={t('arena.teamTitle')} desc={t('arena.teamDesc')} />
            <GridItem icon={CheckSquare} title={t('arena.regulatoryTitle')} desc={t('arena.regulatoryDesc')} />
          </div>
        </Block>
      </div>
    ),
    'events-workshops': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('events.title')}</SectionTitle><p>{t('events.intro')}</p></Block>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <img src="/lovable-uploads/fc4cff06-0e9d-41c4-bac3-73a041a924b3.png" alt="Presentation" className="rounded-xl w-full h-40 md:h-48 object-cover border border-border" />
          <img src="/lovable-uploads/f463db5a-733d-4e4e-b151-d3e33ebe8997.png" alt="Training" className="rounded-xl w-full h-40 md:h-48 object-cover border border-border" />
          <img src="/lovable-uploads/48ad82c3-84e8-4161-93d5-d79b509f7cc4.png" alt="Conference" className="rounded-xl w-full h-40 md:h-48 object-cover border border-border" />
        </div>
        <CardBlock icon={Mic} title={t('events.moderationTitle')} desc={t('events.moderationDesc')} />
        <CardBlock icon={Users} title={t('events.workshopsTitle')} desc={t('events.workshopsDesc')} variant="highlight" />
        <CardBlock icon={Award} title={t('events.referencesTitle')} desc={t('events.referencesDesc')} />
        <Block className="bg-secondary/30">
          <SubTitle>{t('events.eventTypesTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Presentation} title={t('events.conferences')} desc={t('events.conferencesDesc')} />
            <GridItem icon={Wrench} title={t('events.workshops')} desc={t('events.workshopsDescShort')} />
            <GridItem icon={GraduationCap} title={t('events.seminars')} desc={t('events.seminarsDesc')} />
          </div>
        </Block>
      </div>
    ),
    publications: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('publications.title')}</SectionTitle><p>{t('publications.intro')}</p></Block>
        <CardBlock icon={Shield} title={t('publications.pub1Title')} desc={t('publications.pub1Desc')} link="https://www.heise.de/select/ix/2021/10/2019809530193925811" linkLabel={t('publications.readOnHeise')} />
        <CardBlock icon={Radio} title={t('publications.pub2Title')} desc={t('publications.pub2Desc')} variant="highlight" link="https://www.heise.de/select/ix/archiv/2015/7/seite-78" linkLabel={t('publications.readOnHeise')} />
        <CardBlock icon={Video} title={t('publications.pub3Title')} desc={t('publications.pub3Desc')} link="https://vimeo.com/295582173" linkLabel={t('publications.watchOnVimeo')} />
        <Block className="bg-secondary/30">
          <SubTitle>{t('publications.certTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Award} title={t('publications.isacaTitle')} desc={t('publications.isacaDesc')} />
            <GridItem icon={Presentation} title={t('publications.confTitle')} desc={t('publications.confDesc')} />
            <GridItem icon={BookOpen} title={t('publications.eduTitle')} desc={t('publications.eduDesc')} />
          </div>
        </Block>
      </div>
    ),
    'virtual-ciso': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('vciso.title')}</SectionTitle><p>{t('vciso.intro')}</p></Block>
        <CardBlock icon={Crown} title={t('vciso.stratTitle')} desc={t('vciso.stratDesc')} />
        <CardBlock icon={Settings} title={t('vciso.opsTitle')} desc={t('vciso.opsDesc')} />
        <CardBlock icon={CheckSquare} title={t('vciso.compTitle')} desc={t('vciso.compDesc')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('vciso.modelTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={UserCheck} title={t('vciso.flexible')} desc={t('vciso.flexibleDesc')} variant="highlight" />
            <GridItem icon={DollarSign} title={t('vciso.costEffective')} desc={t('vciso.costEffectiveDesc')} variant="highlight" />
            <GridItem icon={Zap} title={t('vciso.immediate')} desc={t('vciso.immediateDesc')} variant="highlight" />
            <GridItem icon={Award} title={t('vciso.experienced')} desc={t('vciso.experiencedDesc')} variant="highlight" />
          </div>
        </Block>
      </div>
    ),
    'ai-workflows': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('aiWorkflows.title')}</SectionTitle><p>{t('aiWorkflows.intro')}</p></Block>
        <CardBlock icon={Zap} title={t('aiWorkflows.irTitle')} desc={t('aiWorkflows.irDesc')} bullets={[t('aiWorkflows.irBullet1'), t('aiWorkflows.irBullet2'), t('aiWorkflows.irBullet3')]} result={t('aiWorkflows.irResult')} />
        <CardBlock icon={FileText} title={t('aiWorkflows.policyTitle')} desc={t('aiWorkflows.policyDesc')} bullets={[t('aiWorkflows.policyBullet1'), t('aiWorkflows.policyBullet2'), t('aiWorkflows.policyBullet3')]} result={t('aiWorkflows.policyResult')} />
        <CardBlock icon={Search} title={t('aiWorkflows.auditTitle')} desc={t('aiWorkflows.auditDesc')} bullets={[t('aiWorkflows.auditBullet1'), t('aiWorkflows.auditBullet2'), t('aiWorkflows.auditBullet3')]} result={t('aiWorkflows.auditResult')} />
        <CardBlock icon={Gamepad2} title={t('aiWorkflows.crisisTitle')} desc={t('aiWorkflows.crisisDesc')} bullets={[t('aiWorkflows.crisisBullet1'), t('aiWorkflows.crisisBullet2'), t('aiWorkflows.crisisBullet3')]} result={t('aiWorkflows.crisisResult')} />
        <Block className="bg-highlight/10 border border-highlight/30 rounded-xl">
          <SubTitle variant="highlight">{t('aiWorkflows.ctaTitle')}</SubTitle>
          <p className="text-foreground whitespace-pre-line">{t('aiWorkflows.ctaDesc')}</p>
        </Block>
      </div>
    ),
    why: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle>{t('index.title')}</SectionTitle>
          <p className="text-lg font-semibold mb-2">{t('index.subtitle')}</p>
          <p className="text-foreground" dangerouslySetInnerHTML={{
            __html: t('index.card1').replace(/<span>/g, '<span class="text-primary font-semibold">')
          }} />
        </Block>
        <Block className="bg-secondary/30">
          <p className="text-foreground whitespace-pre-line">{t('index.card1b')}</p>
        </Block>
        <Block>
          <p className="text-foreground whitespace-pre-line" dangerouslySetInnerHTML={{
            __html: t('index.card2').replace(/<span>/g, '<span class="text-primary font-semibold">')
          }} />
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-foreground font-semibold">{t('index.card2outro')}</p>
        </Block>
        <div className="grid grid-cols-3 gap-2">
          <StatBlock value="40+" label={t('index.trainingsDelivered')} />
          <StatBlock value="350+" label={t('index.peopleTrained')} />
          <StatBlock value="6" label={t('index.countriesCovered')} />
        </div>
      </div>
    ),
    training: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle>{t('training.title')}</SectionTitle>
          <p>{t('training.subtitle')}</p>
        </Block>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CardBlock icon={Server} title={t('training.hostForensics')} desc={t('training.hostForensicsDesc')} />
          <CardBlock icon={Bug} title={t('training.malwareAnalysis')} desc={t('training.malwareAnalysisDesc')} variant="highlight" />
          <CardBlock icon={Shield} title={t('training.siem')} desc={t('training.siemDesc')} />
          <CardBlock icon={AlertCircle} title={t('training.incidentMgmt')} desc={t('training.incidentMgmtDesc')} variant="highlight" />
          <CardBlock icon={AlertTriangle} title={t('training.crisisMgmt')} desc={t('training.crisisMgmtDesc')} />
          <CardBlock icon={MessageSquare} title={t('training.crisisComm')} desc={t('training.crisisCommDesc')} variant="highlight" />
        </div>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('training.methodsTitle')}</SubTitle>
          <p className="text-sm font-sans leading-relaxed tracking-wide text-foreground mb-2">{t('training.methodsSubtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GridItem icon={BookOpen} title={t('training.knowledgeTransfer')} desc={t('training.knowledgeTransferDesc')} variant="highlight" />
            <GridItem icon={Users} title={t('training.groupExercises')} desc={t('training.groupExercisesDesc')} variant="highlight" />
            <GridItem icon={Zap} title={t('training.liveCyberAttacks')} desc={t('training.liveCyberAttacksDesc')} variant="highlight" />
          </div>
        </Block>
      </div>
    ),
    consulting: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle>{t('consulting.title')}</SectionTitle>
          <p>{t('consulting.intro')}</p>
        </Block>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { icon: ShieldCheck, title: t('consulting.ismsTitle'), desc: t('consulting.ismsDesc'), id: 'isms' },
            { icon: Network, title: t('consulting.nis2Title'), desc: t('consulting.nis2Desc'), id: 'nis2-dora' },
            { icon: CreditCard, title: t('consulting.tisaxTitle'), desc: t('consulting.tisaxDesc'), id: 'tisax-pci-dss' },
            { icon: Search, title: t('consulting.assessTitle'), desc: t('consulting.assessDesc'), id: 'assessments-concepts' },
            { icon: AlertTriangle, title: t('consulting.incidentTitle'), desc: t('consulting.incidentDesc'), id: 'incident-management' },
            { icon: Radio, title: t('consulting.crisisTitle'), desc: t('consulting.crisisDesc'), id: 'cyber-crisis-management' },
            { icon: Target, title: t('consulting.arenaTitle'), desc: t('consulting.arenaDesc'), id: 'arena-training' },
            { icon: Calendar, title: t('consulting.eventsTitle'), desc: t('consulting.eventsDesc'), id: 'events-workshops' },
            { icon: FileText, title: t('consulting.pubTitle'), desc: t('consulting.pubDesc'), id: 'publications' },
            { icon: UserCheck, title: t('consulting.vcisoTitle'), desc: t('consulting.vcisoDesc'), id: 'virtual-ciso' },
            { icon: Zap, title: t('consulting.aiWorkflowsTitle'), desc: t('consulting.aiWorkflowsDesc'), id: 'ai-workflows' },
          ].map(s => (
            <div key={s.id} className="rounded-xl p-3 bg-primary/5 border border-primary/20 flex items-start gap-2 cursor-pointer hover:bg-primary/10 transition-electric" onClick={() => setActive(s.id)}>
              <s.icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-primary font-semibold text-sm font-sans">{s.title} →</p>
                <p className="text-foreground text-sm font-sans leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatBlock value="270+" label={t('consulting.clientsServed')} />
          <StatBlock value="20+" label={t('consulting.industrySectors')} />
          <StatBlock value="35+" label={t('consulting.yearsCombined')} />
        </div>
      </div>
    ),
    'by-whom': () => {
      const profiles = consultantProfiles.map((profile) => {
        const key = profile.name === 'Marcel Knop' ? 'marcel' : 'andreas';
        if (language !== 'en') {
          return {
            ...profile,
            sections: [
              { title: t(`profiles.${key}.eduTitle`), items: language === 'de' ? (key === 'marcel' ? ['Dipl.-Ing. Maschinenbau', 'CISSP, CISA', 'ISO/IEC 27001 + 22301 Lead Auditor', 'BSI Grundschutz-Praktiker'] : ['B.Sc. Betriebswirtschaftslehre', 'ISO/IEC 27001 Lead Auditor + Implementer', 'ISO/IEC 27005 Risk Manager', 'BSI IT-Grundschutz-Praktiker', 'Datenschutzauditor (DSA-TÜV)']) : (key === 'marcel' ? ['Dipl.-Ing. Génie mécanique', 'CISSP, CISA', 'ISO/IEC 27001 + 22301 Lead Auditor', 'BSI Baseline Protection Practitioner'] : ['B.Sc. Administration des affaires', 'ISO/IEC 27001 Lead Auditor + Implementer', 'ISO/IEC 27005 Risk Manager', 'BSI IT-Grundschutz Practitioner', 'Auditeur protection des données (DSA-TÜV)']) },
              { title: t(`profiles.${key}.expTitle`), items: language === 'de' ? (key === 'marcel' ? ['KPMG: Consultant bis Senior Manager', 'Accenture: Senior Manager', 'Ernst & Young: Senior Manager'] : ['PwC: Manager, Cybersecurity und Datenschutz', 'Ernst & Young: Senior Consultant', 'CSPi: Consultant Security und Datenschutz']) : (key === 'marcel' ? ['KPMG : Consultant à Senior Manager', 'Accenture : Senior Manager', 'Ernst & Young : Senior Manager'] : ['PwC : Manager, Cybersécurité et Protection des données', 'Ernst & Young : Senior Consultant', 'CSPi : Consultant Sécurité et Protection des données']) },
              { title: t(`profiles.${key}.servTitle`), items: language === 'de' ? (key === 'marcel' ? ['Cybersecurity-Beratung und Audits', 'ISMS, TISAX, NIS-2, PCI-DSS Implementierung', 'Cyber-Krisenmanagement und Übungen', 'TIBER, BCM'] : ['Informationssicherheit, ISMS-Strategie', 'ISO/IEC 27001, PCI-DSS, NIST, TISAX', 'Risikomanagement, Business Continuity', 'EU-DSGVO, Kritische Infrastrukturen (KRITIS)']) : (key === 'marcel' ? ['Conseil et audits en cybersécurité', 'Implémentation SMSI, TISAX, NIS-2, PCI-DSS', 'Gestion de cyber-crise et exercices', 'TIBER, BCM'] : ['Sécurité de l\'information, Stratégie SMSI', 'ISO/IEC 27001, PCI-DSS, NIST, TISAX', 'Gestion des risques, Continuité d\'activité', 'RGPD UE, Infrastructures critiques (KRITIS)']) },
              { title: t(`profiles.${key}.langTitle`), items: language === 'de' ? (key === 'marcel' ? ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)'] : ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)', 'Französisch (fachsprachlich)']) : (key === 'marcel' ? ['Allemand (langue maternelle)', 'Anglais (courant professionnel)'] : ['Allemand (langue maternelle)', 'Anglais (courant professionnel)', 'Français (professionnel)']) },
            ],
          };
        }
        return profile;
      });
      return (
        <div className="space-y-3">
          <Block><SectionTitle>{t('byWhom.title')}</SectionTitle><p>{t('byWhom.intro')}</p></Block>
          {profiles.map(p => (
            <Block key={p.name} className="bg-secondary/30">
              <div className="flex items-start gap-4 mb-4">
                <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 shadow-lg" />
                <div>
                  <p className="text-primary font-bold text-base font-sans">{p.name}</p>
                  <p className="text-foreground text-sm font-sans mb-1">{p.role}</p>
                  {p.linkedinUrl && (
                    <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-highlight text-sm font-sans hover:underline">
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {p.sections.map((s, i) => (
                  <div key={i}>
                    <p className="text-primary font-semibold text-sm font-sans mb-1">{s.title}</p>
                     <ul className="text-sm font-sans text-foreground space-y-0.5">
                      {s.items.map((item, j) => <li key={j}>• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Block>
          ))}
        </div>
      );
    },
    contact: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('contact.title')}</SectionTitle><p>{t('contact.intro')}</p></Block>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-primary" />
              <SubTitle>{t('contact.phone')}</SubTitle>
            </div>
            <a href="tel:+4915205691648" className="text-foreground text-sm font-sans hover:text-highlight transition-electric">+49 1520 569 1648</a>
          </div>
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-primary" />
              <SubTitle>{t('contact.email')}</SubTitle>
            </div>
            <a href="mailto:marcel@inside-the-box.org" className="text-foreground text-sm font-sans hover:text-highlight transition-electric">marcel@inside-the-box.org</a>
          </div>
        </div>
      </div>
    ),
    imprint: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('imprint.title')}</SectionTitle></Block>
        <Block className="bg-secondary/30">
          <p className="text-foreground text-sm font-sans leading-relaxed">
            <span className="text-primary font-semibold">{t('imprint.responsible')}</span><br />
            Marcel Knop<br />
            Appenrother Weg 14<br />
            34308 Bad Emstal, Germany
          </p>
           <p className="text-foreground text-sm font-sans leading-relaxed mt-3">
            <span className="text-primary font-semibold">{t('imprint.contactLabel')}</span><br />
            <a href="mailto:marcel@inside-the-box.org" className="hover:text-highlight transition-electric">marcel@inside-the-box.org</a><br />
            <a href="tel:+4915205691648" className="hover:text-highlight transition-electric">+49 1520 569 1648</a>
          </p>
           <p className="text-foreground text-sm font-sans leading-relaxed mt-3">
            <span className="text-primary font-semibold">{t('imprint.vatId')}</span> DE328906053
          </p>
          <p className="text-foreground text-sm font-sans leading-relaxed mt-3">
            <span className="text-primary font-semibold">{t('imprint.insurance')}</span><br />
            Hiscox SA · Arnulfstr. 31 · 80636 Munich, Germany
          </p>
        </Block>
        <CardBlock icon={Scale} title={t('imprint.disclaimer')} desc={t('imprint.disclaimerText')} />
        <CardBlock icon={FileText} title={t('imprint.copyright')} desc={t('imprint.copyrightText')} variant="highlight" />
        <CardBlock icon={Shield} title={t('imprint.dataProtection')} desc={t('imprint.dataProtectionText')} />
      </div>
    ),
    'tech-requirements': () => {
      const systemItems = language === 'de'
        ? ['Moderner Computer (Windows/Mac/Linux)', 'Mindestens 8GB RAM', 'Stabile Internetverbindung (10+ Mbps)', 'Mindestauflösung 1024×768', 'RDP-Client installiert']
        : language === 'fr'
        ? ['Ordinateur moderne (Windows/Mac/Linux)', '8 Go de RAM minimum', 'Internet stable (10+ Mbps)', 'Résolution minimum 1024×768', 'Client RDP installé']
        : ['Modern computer (Windows/Mac/Linux)', '8GB RAM minimum', 'Stable internet (10+ Mbps)', '1024×768 resolution minimum', 'RDP client installed'];
      const networkItems = language === 'de'
        ? ['RDP: 7000–7020/TCP ausgehend', 'HTTPS: 443/TCP ausgehend', 'Keine eingehenden Verbindungen erforderlich', 'Konnektivität vorab testen']
        : language === 'fr'
        ? ['RDP : 7000–7020/TCP sortant', 'HTTPS : 443/TCP sortant', 'Aucune connexion entrante requise', 'Tester la connectivité au préalable']
        : ['RDP: 7000–7020/TCP outbound', 'HTTPS: 443/TCP outbound', 'No inbound connections required', 'Test connectivity beforehand'];
      return (
        <div className="space-y-3">
          <Block><SectionTitle>{t('techReq.title')}</SectionTitle><p>{t('techReq.intro')}</p></Block>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={16} className="text-primary" />
                <SubTitle>{t('techReq.systemTitle')}</SubTitle>
              </div>
               <p className="text-sm font-sans leading-relaxed text-foreground mb-2">{t('techReq.systemDesc')}</p>
               <ul className="text-sm font-sans text-foreground space-y-0.5">
                {systemItems.map((item, i) => <li key={i}>• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Wifi size={16} className="text-primary" />
                <SubTitle variant="primary">{t('techReq.networkTitle')}</SubTitle>
              </div>
               <p className="text-sm font-sans leading-relaxed text-foreground mb-2">{t('techReq.networkDesc')}</p>
               <ul className="text-sm font-sans text-foreground space-y-0.5">
                {networkItems.map((item, i) => <li key={i}>• <span className="font-mono">{item}</span></li>)}
              </ul>
            </div>
          </div>
          {/* Inline System Check */}
          <InlineSystemCheck t={t} />
          {/* Inline Connectivity Check */}
          <InlineConnectivityCheck t={t} language={language} />
        </div>
      );
    },
  };

  // We need setActive to be available inside consulting content
  let setActive: (id: string) => void = () => {};
  const bindSetActive = (fn: (id: string) => void) => { setActive = fn; };

  return { contentMap, bindSetActive };
};

interface SidebarItem { id: string; icon: LucideIcon; label: string; }
interface SidebarGroup { title: string; items: SidebarItem[]; }

const useSidebarGroups = (): SidebarGroup[] => {
  const { t } = useLanguage();
  return [
    {
      title: t('nav.training'),
      items: [
        { id: 'why', icon: Target, label: t('start.cyberTrainingRange') },
        { id: 'training', icon: Swords, label: t('training.title') },
        { id: 'tech-requirements', icon: Monitor, label: t('techReq.sidebarLabel') },
      ],
    },
    {
      title: t('nav.consulting'),
      items: [
        { id: 'consulting', icon: Shield, label: t('consulting.title') },
        { id: 'isms', icon: ShieldCheck, label: t('consulting.ismsTitle') },
        { id: 'nis2-dora', icon: Network, label: t('consulting.nis2Title') },
        { id: 'tisax-pci-dss', icon: CreditCard, label: t('consulting.tisaxTitle') },
        { id: 'assessments-concepts', icon: Search, label: t('consulting.assessTitle') },
        { id: 'incident-management', icon: Flame, label: t('consulting.incidentTitle') },
        { id: 'cyber-crisis-management', icon: Swords, label: t('consulting.crisisTitle') },
        { id: 'arena-training', icon: Target, label: t('consulting.arenaSidebarLabel') },
        { id: 'events-workshops', icon: Calendar, label: t('consulting.eventsTitle') },
        { id: 'publications', icon: FileText, label: t('consulting.pubTitle') },
        { id: 'virtual-ciso', icon: UserCheck, label: t('vciso.title') },
        { id: 'ai-workflows', icon: Zap, label: t('consulting.aiWorkflowsTitle') },
      ],
    },
    {
      title: t('nav.byWhom'),
      items: [
        { id: 'by-whom', icon: Users, label: t('nav.profiles') },
        { id: 'contact', icon: Mail, label: t('nav.contact') },
        { id: 'imprint', icon: Scale, label: t('imprint.title') },
      ],
    },
  ];
};

// ── Main component ──────────────────────────────────────────────────────────

const ChatView = () => {
  const { language, setLanguage, t } = useLanguage();
  const sidebarGroups = useSidebarGroups();
  const [activeService, setActiveService] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarInitialized, setSidebarInitialized] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const { contentMap, bindSetActive } = useServiceContent();
  bindSetActive((id) => { setActiveService(id); setMessages([]); });

  useEffect(() => { if (window.innerWidth > 1024) inputRef.current?.focus(); }, []);
  useEffect(() => { if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
  }, [activeService]);
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jbhfqocscbvcvzlgwvvy.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaGZxb2NzY2J2Y3Z6bGd3dnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTM2NTksImV4cCI6MjA4NzI2OTY1OX0.gwIYZtnr5HEMgEHsFgYOFlyQOpm-KBWTavu0IWEyLyE';
      const res = await fetch(`${supabaseUrl}/functions/v1/ask-navigator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ question: userMsg }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: AiResponse = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, links: data.links }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const newChat = () => { 
    setActiveService(null); 
    setMessages([]); 
    setInput(''); 
    setChatOpen(false);
    if (window.innerWidth >= 768) inputRef.current?.focus(); 
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!sidebarInitialized && typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setSidebarOpen(!mobile);
      setSidebarInitialized(true);
    }
  }, [sidebarInitialized]);

  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectService = (id: string) => {
    setActiveService(id);
    setMessages([]);
    if (isMobile) setSidebarOpen(false);
    // Only focus input on large desktop screens, not on iPad/tablet
    if (!isMobile && !isTablet) inputRef.current?.focus();
  };

  const serviceContent = activeService && contentMap[activeService] ? contentMap[activeService]() : null;

  return (
    <div className="h-screen flex overflow-hidden bg-transparent">
      <PageMeta title="inside-the-box" description="Cybersecurity Navigator" />

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[280px] h-full flex flex-col bg-card animate-in slide-in-from-left duration-200">
            <div className="p-3 flex items-center justify-between bg-primary/10">
              <button onClick={() => { setActiveService(null); setMessages([]); setSidebarOpen(false); }} className="flex items-center gap-2 text-sm font-rounded font-bold text-primary hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"><GeometricSymbol size="xs" />inside-the-box.org</button>
              <button onClick={() => setSidebarOpen(false)} className="ml-2 p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-electric">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {sidebarGroups.map((group) => (
                <div key={group.title} className="mb-3">
                  <p className="px-2 py-1.5 text-xs font-rounded font-bold text-accent uppercase tracking-wider">{group.title}</p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectService(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-1 text-left transition-electric group ${
                        activeService === item.id ? 'bg-highlight/10 text-highlight' : 'text-foreground hover:bg-highlight/5 hover:text-highlight'
                      }`}
                    >
                      <item.icon size={16} className={`flex-shrink-0 ${activeService === item.id ? 'text-highlight' : 'text-foreground/60 group-hover:text-highlight'}`} />
                      <span className="truncate font-rounded text-base">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-border p-3 flex items-center justify-center">
              <button onClick={() => setLanguage(nextLanguage(language))} className="rounded-lg border border-highlight/30 px-2.5 py-1.5 text-xs font-rounded font-bold text-highlight hover:bg-highlight/10 hover:border-highlight/50 transition-electric uppercase tracking-wider">
                {language.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
          <div className="w-64 h-full flex flex-col bg-card border-r border-border">
            <div className="h-12 px-3 flex items-center justify-between bg-primary/10 border-b border-border flex-shrink-0">
              <button onClick={() => { setActiveService(null); setMessages([]); }} className="flex items-center gap-2 text-sm font-rounded font-bold text-primary hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"><GeometricSymbol size="xs" />inside-the-box.org</button>
              <button onClick={() => setLanguage(nextLanguage(language))} className="rounded-lg border border-highlight/30 px-2.5 py-2.5 text-xs font-rounded font-bold text-highlight hover:bg-highlight/10 hover:border-highlight/50 transition-electric uppercase tracking-wider">
                {language.toUpperCase()}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {sidebarGroups.map((group) => (
                <div key={group.title} className="mb-3">
                  <p className="px-2 py-1.5 text-xs font-rounded font-bold text-accent uppercase tracking-wider">{group.title}</p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectService(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-1 text-left transition-electric group ${
                        activeService === item.id ? 'bg-highlight/10 text-highlight' : 'text-foreground hover:bg-highlight/5 hover:text-highlight'
                      }`}
                    >
                      <item.icon size={16} className={`flex-shrink-0 ${activeService === item.id ? 'text-highlight' : 'text-foreground/60 group-hover:text-highlight'}`} />
                      <span className="truncate font-rounded text-base">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-electric">
            {!isMobile && sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <span className="flex-1 text-sm font-mono font-bold text-accent truncate text-center md:text-left">
            {activeService 
              ? (sidebarGroups.flatMap(g => g.items).find(i => i.id === activeService)?.label || 'inside-the-box') 
              : (isMobile ? 'inside-the-box' : t('welcome.headerTitle'))}
          </span>
          {isMobile && (
            <button onClick={newChat} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-electric">
              <Plus size={18} />
            </button>
          )}
        </div>

        <div ref={contentAreaRef} className="flex-1 overflow-y-auto relative">
          {!activeService && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="mb-6">
                <GeometricSymbol size="sm" className="w-16 h-16 opacity-60" />
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-bold text-accent mb-2 text-center">{t('welcome.title')}</h1>
              <p className="text-sm text-foreground font-mono text-center max-w-md px-2">
                {t('welcome.intro')}
              </p>
            </div>
          ) : (
            <div className="w-full px-3 md:px-6 lg:px-10 py-4 md:py-6 space-y-4">
              {serviceContent && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">{serviceContent}</div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle size={14} className="text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2.5 text-sm font-sans leading-relaxed tracking-wide ${msg.role === 'user' ? 'bg-secondary text-foreground' : 'text-foreground'}`}>
                    <p>{msg.content}</p>
                    {msg.links && msg.links.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {msg.links.map((link, j) => {
                          const serviceId = sidebarGroups.flatMap(g => g.items).find(s => link.url.includes(s.id))?.id;
                          return (
                            <li key={j}>
                              {serviceId ? (
                                <button onClick={() => selectService(serviceId)} className="text-primary hover:underline text-sm font-sans text-left">→ {link.label}</button>
                              ) : (
                                <a href={link.url} className="text-primary hover:underline text-sm font-sans">→ {link.label}</a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={14} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-1 py-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input - desktop: always show (except service on mobile). Mobile welcome: show floating button, expand on click */}
        {(() => {
          const isTouchDevice = isMobile || isTablet;
          // On touch devices: show FAB unless user explicitly opened chat; hide completely on service pages
          if (isTouchDevice && !!activeService) return null;
          const showInput = !isTouchDevice || chatOpen;
          if (!showInput) {
            return (
              <div className="absolute bottom-16 right-6 z-10">
                <button
                  onClick={() => { setChatOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                  className="w-14 h-14 rounded-full bg-highlight text-highlight-foreground shadow-lg flex items-center justify-center hover:bg-highlight/80 transition-electric"
                >
                  <MessageCircle size={24} />
                </button>
              </div>
            );
          }
          return (
            <div className="border-t border-border px-2 md:px-4 py-1.5 md:py-2 flex-shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-center bg-secondary rounded-xl border border-highlight/30 focus-within:border-highlight/60 transition-electric">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={t('welcome.chatPlaceholder')}
                    className="flex-1 bg-transparent px-3 md:px-4 py-2 text-base md:text-sm font-mono text-highlight placeholder:text-highlight/50 resize-none focus:outline-none max-h-[120px]"
                    disabled={isLoading}
                  />
                  <button onClick={handleSend} disabled={!input.trim() || isLoading} className="m-1 p-1.5 rounded-lg bg-highlight text-highlight-foreground disabled:opacity-30 hover:bg-highlight/80 transition-electric">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ChatView;
