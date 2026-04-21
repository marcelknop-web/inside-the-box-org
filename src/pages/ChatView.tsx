import { useState, useRef, useEffect, ReactNode, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { Send, Plus, MessageCircle, Shield, Target, BookOpen, AlertTriangle, Eye, Flame, Swords, Calendar, FileText, UserCheck, ChevronLeft, Menu, ShieldCheck, Search, Settings, Award, RotateCcw, Network, CreditCard, CheckCircle, FileCheck, Car, BarChart, RefreshCw, GraduationCap, ClipboardList, Zap, Crown, Users, Gamepad2, Monitor, Crosshair, CheckSquare, Mic, Radio, Video, Mail, Server, Bug, AlertCircle, MessageSquare, Building2, Plane, Landmark, Scale, Wifi, XCircle, HelpCircle, Loader2, X, Linkedin, Play, TrendingDown, Rocket, Fingerprint, Factory } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { consultantProfiles } from '@/data/consultantProfiles';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { LucideIcon } from 'lucide-react';

// Lazy-load heavy page components to reduce initial bundle size
import type { CrisisSimulatorHandle } from './CyberCrisisSimulator';
const CyberCrisisSimulator = lazy(() => import('./CyberCrisisSimulator'));
const DoraIncidentReporter = lazy(() => import('./DoraIncidentReporter'));
const TisaxAssessmentClassifier = lazy(() => import('./TisaxAssessmentClassifier'));
const PciDssSaqNavigator = lazy(() => import('./PciDssSaqNavigator'));
const IspcTtxPrioritizer = lazy(() => import('./IspcTtxPrioritizer'));
const Nis2AwarenessQuiz = lazy(() => import('./Nis2AwarenessQuiz'));
const CisoSimulator = lazy(() => import('./CisoSimulator'));
const ThreatDropQuiz = lazy(() => import('./ThreatDropQuiz'));
const TriggerTriage = lazy(() => import('./TriggerTriage'));
const CyberFrogger = lazy(() => import('./CyberFrogger'));
const EliteShipScene = lazy(() => import('./EliteShipScene'));
const CraComplianceTool = lazy(() => import('./CraComplianceTool'));
const DoraComplianceTool = lazy(() => import('./DoraComplianceTool'));
const Nis2ComplianceTool = lazy(() => import('./Nis2ComplianceTool'));
const Iec62443ComplianceTool = lazy(() => import('./Iec62443ComplianceTool'));
const ButterflyEffectLab = lazy(() => import('./ButterflyEffectLab'));
const SocLife = lazy(() => import('./SocLife'));

import { StaggerReveal } from '@/components/StaggerReveal';
import GlitchText from '@/components/GlitchText';
import Typewriter from '@/components/Typewriter';
import TypedSection from '@/components/TypedSection';
import { LinkButton } from '@/components/LinkButton';
import TtxRegistrationForm from '@/components/TtxRegistrationForm';
import { NewsPanel } from '@/components/NewsPanel';
import { RelatedServices } from '@/components/RelatedServices';
import { NewDateBadge } from '@/components/NewDateBadge';

// AI Lab tool publication dates (ISO YYYY-MM-DD).
// Tools listed here show a "Neu/New/Nouveau" badge for 30 days from this date.
// Add or update entries when you ship a new agent.
const AI_TOOL_ADDED_AT: Record<string, string> = {
  'soc-life': '2026-04-10',
  'butterfly-lab': '2026-04-05',
};

interface NavLink { url: string; label: string; }
interface AiResponse { message: string; links: NavLink[]; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; links?: NavLink[]; }

// ── Chat-styled content blocks ──────────────────────────────────────────────

const Block = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg px-5 py-5 text-base font-sans leading-relaxed tracking-wide text-foreground ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-primary text-xl font-bold font-mono mb-3">{children}</h2>
);

const SubTitle = ({ children, variant: _v }: { children: ReactNode; variant?: 'primary' | 'highlight' }) => (
  <h3 className="text-primary font-semibold font-mono text-base mb-1">{children}</h3>
);

const CardBlock = ({ icon: Icon, title, desc, variant = 'primary', link, linkLabel, bullets, result }: { icon: LucideIcon; title: string; desc: string; variant?: 'primary' | 'highlight'; link?: string; linkLabel?: string; bullets?: string[]; result?: string }) => (
  <div className={`rounded-lg p-5 ${variant === 'highlight' ? 'bg-highlight/[0.03] border border-highlight/15' : 'bg-primary/[0.03] border border-primary/15'} shadow-[0_1px_3px_hsl(216_50%_3%/0.3)]`}>
    <div className="flex items-start gap-3.5">
      <Icon size={20} className={`mt-0.5 flex-shrink-0 opacity-70 ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`} />
      <div>
        <SubTitle variant={variant}>{title}</SubTitle>
        <p className="text-foreground/85 text-[15px] font-sans leading-relaxed tracking-wide whitespace-pre-line">{desc}</p>
        {bullets && bullets.length > 0 && (
          <ul className="text-foreground/85 text-[15px] font-sans leading-relaxed tracking-wide space-y-1.5 mt-2.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2"><span className="flex-shrink-0 text-muted-foreground">•</span><span>{b}</span></li>
            ))}
          </ul>
        )}
        {result && <p className="mt-2.5 text-sm font-semibold text-primary font-mono">{result}</p>}
        {link && linkLabel && (
          <a href={link} target="_blank" rel="noopener noreferrer" className={`inline-block mt-2.5 transition-electric text-sm font-sans underline underline-offset-2 ${variant === 'highlight' ? 'text-highlight hover:text-primary' : 'text-primary hover:text-highlight'}`}>
            → {linkLabel}
          </a>
        )}
      </div>
    </div>
  </div>
);

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-secondary/50 border border-border/60 rounded-lg p-3 text-center min-w-0 shadow-[0_1px_2px_hsl(216_50%_3%/0.25)]">
    <div className="text-lg sm:text-xl font-bold text-highlight font-mono tracking-tight">{value}</div>
    <div className="text-xs sm:text-sm font-sans text-muted-foreground leading-tight mt-0.5">{label}</div>
  </div>
);

const GridItem = ({ icon: Icon, title, subtitle, desc, variant = 'primary', href, className }: { icon: LucideIcon; title: string; subtitle?: string; desc: string; variant?: 'primary' | 'highlight'; href?: string; className?: string }) => {
  const colorClass = variant === 'highlight' ? 'text-highlight' : 'text-primary';
  const borderClass = variant === 'highlight' ? 'border-highlight/12' : 'border-primary/12';
  return (
    <div className={`bg-secondary/30 border ${borderClass} rounded-lg p-3.5 flex items-start gap-3 overflow-hidden shadow-[0_1px_2px_hsl(216_50%_3%/0.2)] ${className || ''}`}>
      <Icon size={17} className={`mt-0.5 flex-shrink-0 opacity-65 ${colorClass}`} />
      <div className="space-y-0.5 min-w-0">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={`font-semibold text-[15px] font-sans underline underline-offset-2 hover:opacity-80 ${colorClass}`}>{title}</a>
        ) : (
          <p className={`font-semibold text-[15px] font-sans ${colorClass}`}>{title}</p>
        )}
        {subtitle && <p className={`${colorClass}/70 text-xs font-semibold font-sans uppercase tracking-wide`}>{subtitle}</p>}
        <p className="text-foreground/75 text-sm font-sans leading-relaxed whitespace-pre-line break-words">{desc}</p>
      </div>
    </div>
  );
};

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

  const icon = (s: SysResult['status']) => s === 'pass' ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : s === 'fail' ? <XCircle className="w-3.5 h-3.5 text-destructive" /> : <HelpCircle className="w-3.5 h-3.5 text-warning" />;

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
      {results && (() => {
        const allPass = results.every(r => r.status === 'pass');
        const anyFail = results.some(r => r.status === 'fail');
        return (
          <div className="mt-3 space-y-1.5">
            {results.map(r => (
              <div key={r.label} className="flex items-center gap-2 text-sm font-sans">
                {icon(r.status)}
                <span className="font-sans font-semibold text-foreground">{r.label}</span>
                <span className="text-foreground">{r.detail}</span>
              </div>
            ))}
            {allPass ? (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-success/30 bg-success/10 text-success">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-sans">{t('techReq.sysCheckAllPass')}</p>
              </div>
            ) : anyFail ? (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-sans">{t('techReq.sysCheckSomeFail')}</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-warning/30 bg-warning/10 text-warning">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-sans">{t('techReq.sysCheckUnknown')}</p>
              </div>
            )}
          </div>
        );
      })()}
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
                  <span className={ok === gr.length ? 'text-success' : ok > 0 ? 'text-warning' : 'text-destructive'}>{ok}/{gr.length} {t('techReq.reachable')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {gr.map(r => (
                    <span key={r.port} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-sm font-mono border ${r.status === 'reachable' ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                      {r.status === 'reachable' ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />} {r.port}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <div className={`flex items-start gap-2 mt-2 p-2 rounded border text-sm font-mono ${results.every(r => r.status === 'reachable') ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
            {results.every(r => r.status === 'reachable') ? <><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{t('techReq.allPortsOk')}</p></> : <><XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{t('techReq.someBlocked')}</p></>}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Service content renderers ───────────────────────────────────────────────

const useServiceContent = () => {
  const { t, tArray, language } = useLanguage();
  const [ytDialogOpen, setYtDialogOpen] = useState(false);

  const contentMap: Record<string, () => ReactNode> = {
    isms: () => (
      <TypedSection title={t('isms.title')} mode="typewriter" intro={<p>{t('isms.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('isms.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('isms.approachTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Search} title={t('isms.step1Title')} desc={t('isms.step1Desc')} />
            <GridItem icon={Settings} title={t('isms.step2Title')} desc={t('isms.step2Desc')} />
            <GridItem icon={Award} title={t('isms.step3Title')} desc={t('isms.step3Desc')} />
            <GridItem icon={RotateCcw} title={t('isms.step4Title')} desc={t('isms.step4Desc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('isms.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={ShieldCheck} title={t('isms.iso27001Title')} desc={t('isms.iso27001Desc')} variant="highlight" />
            <GridItem icon={FileText} title={t('isms.bsiTitle')} desc={t('isms.bsiDesc')} variant="highlight" />
            <GridItem icon={Factory} title={t('isms.iec62443Title')} desc={t('isms.iec62443Desc')} variant="highlight" />
          </div>
          <button
            onClick={() => setActive('iec62443')}
            className="mt-4 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('isms.iec62443ToolLink')}
          </button>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('isms.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('isms.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('isms.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('isms.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('isms.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="isms" onSelect={setActive} />
      </TypedSection>
    ),
    'nis2-dora': () => (
      <TypedSection title={t('nis2.title')} mode="typewriter" intro={<p>{t('nis2.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('nis2.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('nis2.approachTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Search} title={t('nis2.step1Title')} desc={t('nis2.step1Desc')} />
            <GridItem icon={AlertCircle} title={t('nis2.step2Title')} desc={t('nis2.step2Desc')} />
            <GridItem icon={ShieldCheck} title={t('nis2.step3Title')} desc={t('nis2.step3Desc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('nis2.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Building2} title={t('nis2.nis2Name')} desc={t('nis2.nis2Desc')} variant="highlight" />
            <GridItem icon={Landmark} title={t('nis2.doraName')} desc={t('nis2.doraDesc')} variant="highlight" />
            <GridItem icon={Plane} title={t('nis2.partisName')} desc={t('nis2.partisDesc')} variant="highlight" />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('nis2.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('nis2.refDesc')}</p>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('nis2.ttxReadinessTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('nis2.ttxReadinessDesc')}</p>
          <a
            href="/ttx-readiness"
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric"
          >
            {t('nis2.ttxReadinessButton')}
          </a>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('nis2.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('nis2.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('nis2.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="nis2-dora" onSelect={setActive} />
      </TypedSection>
    ),
    'tisax-pci-dss': () => (
      <TypedSection title={t('tisax.title')} mode="typewriter" intro={<p>{t('tisax.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('tisax.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('tisax.approachTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Search} title={t('tisax.step1Title')} desc={t('tisax.step1Desc')} />
            <GridItem icon={Settings} title={t('tisax.step2Title')} desc={t('tisax.step2Desc')} />
            <GridItem icon={CheckCircle} title={t('tisax.step3Title')} desc={t('tisax.step3Desc')} />
            <GridItem icon={FileCheck} title={t('tisax.step4Title')} desc={t('tisax.step4Desc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('tisax.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Car} title={t('tisax.tisaxName')} desc={t('tisax.tisaxDesc')} variant="highlight" />
            <GridItem icon={CreditCard} title={t('tisax.pciName')} desc={t('tisax.pciDesc')} variant="highlight" />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('tisax.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('tisax.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('tisax.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('tisax.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('tisax.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="tisax-pci-dss" onSelect={setActive} />
      </TypedSection>
    ),
    'assessments-concepts': () => (
      <TypedSection title={t('assessments.title')} mode="typewriter" intro={<p>{t('assessments.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('assessments.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('assessments.approachTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Search} title={t('assessments.step1Title')} desc={t('assessments.step1Desc')} />
            <GridItem icon={ShieldCheck} title={t('assessments.step2Title')} desc={t('assessments.step2Desc')} />
            <GridItem icon={Users} title={t('assessments.step3Title')} desc={t('assessments.step3Desc')} />
            <GridItem icon={Calendar} title={t('assessments.step4Title')} desc={t('assessments.step4Desc')} />
            <GridItem icon={BarChart} title={t('assessments.step5Title')} desc={t('assessments.step5Desc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('assessments.outcomesTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('assessments.outcomesDesc')}</p>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('assessments.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('assessments.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('assessments.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('assessments.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('assessments.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="assessments-concepts" onSelect={setActive} />
      </TypedSection>
    ),
    'incident-management': () => (
      <TypedSection title={t('incident.title')} mode="typewriter" intro={<p>{t('incident.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('incident.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('incident.sectionTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Search} title={t('incident.step0Title')} desc={t('incident.step0Desc')} />
            <GridItem icon={ShieldCheck} title={t('incident.step1Title')} desc={t('incident.step1Desc')} />
            <GridItem icon={Eye} title={t('incident.step2Title')} desc={t('incident.step2Desc')} />
            <GridItem icon={Fingerprint} title={t('incident.step3Title')} desc={t('incident.step3Desc')} />
            <GridItem icon={AlertTriangle} title={t('incident.step4Title')} desc={t('incident.step4Desc')} />
            <GridItem icon={RefreshCw} title={t('incident.step5Title')} desc={t('incident.step5Desc')} />
            <GridItem icon={GraduationCap} title={t('incident.step6Title')} desc={t('incident.step6Desc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('incident.outcomesTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('incident.outcomesDesc')}</p>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('incident.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('incident.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('incident.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('incident.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('incident.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="incident-management" onSelect={setActive} />
      </TypedSection>
    ),
    'cyber-crisis-management': () => (
      <TypedSection title={t('cyberCrisis.title')} mode="typewriter" intro={<p>{t('cyberCrisis.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('cyberCrisis.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('cyberCrisis.sectionTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={ClipboardList} title={t('cyberCrisis.planTitle')} desc={t('cyberCrisis.planDesc')} />
            <GridItem icon={Zap} title={t('cyberCrisis.scenarioTitle')} desc={t('cyberCrisis.scenarioDesc')} />
            <GridItem icon={Target} title={t('cyberCrisis.simTitle')} desc={t('cyberCrisis.simDesc')} />
            <GridItem icon={Crown} title={t('cyberCrisis.leaderTitle')} desc={t('cyberCrisis.leaderDesc')} />
            <GridItem icon={MessageSquare} title={t('cyberCrisis.commTitle')} desc={t('cyberCrisis.commDesc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('cyberCrisis.outcomesTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('cyberCrisis.outcomesDesc')}</p>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('cyberCrisis.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('cyberCrisis.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('cyberCrisis.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('cyberCrisis.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('cyberCrisis.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="cyber-crisis-management" onSelect={setActive} />
      </TypedSection>
    ),
    'arena-training': () => (
      <TypedSection title={t('arena.title')} mode="typewriter" intro={<p>{t('arena.intro')}</p>}>
         <Block className="bg-card/40 rounded-xl">
           <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('arena.introDetail')}</p>
         </Block>
         <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
           <SubTitle variant="highlight">{t('arena.stakesTitle')}</SubTitle>
           <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('arena.stakesDesc')}</p>
         </Block>
         <Block className="bg-card/40 rounded-xl">
           <SubTitle variant="highlight">{t('arena.sectionTitle')}</SubTitle>
           <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('arena.sectionDesc')}</p>
         </Block>
         <Block className="bg-primary/5 border border-primary/20 rounded-xl">
           <div className="grid grid-cols-1 gap-3">
             <GridItem icon={Search} title={t('arena.scopingTitle')} desc={t('arena.scopingDesc')} />
             <GridItem icon={Eye} title={t('arena.threatIntelTitle')} desc={t('arena.threatIntelDesc')} />
             <GridItem icon={Target} title={t('arena.redTeamTitle')} desc={t('arena.redTeamDesc')} />
             <GridItem icon={FileText} title={t('arena.reportingTitle')} desc={t('arena.reportingDesc')} />
           </div>
         </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('arena.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('arena.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('arena.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('arena.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('arena.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="arena-training" onSelect={setActive} />
      </TypedSection>
    ),
    'events-workshops': () => (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <img src="/lovable-uploads/fc4cff06-0e9d-41c4-bac3-73a041a924b3.png" alt="Presentation" className="rounded-xl w-full h-40 md:h-48 object-cover border border-border" />
          <img src="/lovable-uploads/f463db5a-733d-4e4e-b151-d3e33ebe8997.png" alt="Training" className="rounded-xl w-full h-40 md:h-48 object-cover border border-border" />
          <img src="/lovable-uploads/48ad82c3-84e8-4161-93d5-d79b509f7cc4.png" alt="Conference" className="rounded-xl w-full h-40 md:h-48 object-cover border border-border" />
        </div>
        <TypedSection title={t('events.title')} mode="typewriter" intro={<p>{t('events.intro')}</p>}>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <div className="grid grid-cols-1 gap-3">
            <GridItem icon={Mic} title={t('events.moderationTitle')} desc={t('events.moderationDesc')} />
            <GridItem icon={Users} title={t('events.workshopsTitle')} desc={t('events.workshopsDesc')} />
          </div>
        </Block>

        <Block className="bg-card/40 rounded-xl">
          <SubTitle>{t('events.referencesTitle')}</SubTitle>
          <p className="text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('events.referencesDesc')}</p>
        </Block>

        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('events.isacaTitle')}</SubTitle>
          <p className="text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('events.isacaDesc')}</p>
          <p className="text-foreground/70 text-xs font-mono mt-3">{t('events.evalPeriod')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 mb-4">
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-foreground/80 text-xs font-mono uppercase tracking-widest mb-1">{t('events.evalSatisfaction')}</span>
              <span className="text-highlight text-4xl sm:text-3xl font-bold font-mono">94 %</span>
            </div>
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-foreground/80 text-xs font-mono uppercase tracking-widest mb-1">{t('events.evalRecommendation')}</span>
              <span className="text-highlight text-4xl sm:text-3xl font-bold font-mono">93 %</span>
            </div>
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-foreground/80 text-xs font-mono uppercase tracking-widest mb-1">{t('events.evalEmpfScore')}</span>
              <span className="text-primary text-4xl sm:text-3xl font-bold font-mono">87 %</span>
            </div>
          </div>

          <div className="space-y-2 mb-2">
            {['evalQuote1', 'evalQuote2', 'evalQuote3'].map((key) => (
              <p key={key} className="text-foreground/80 text-sm italic leading-relaxed pl-3 border-l-2 border-highlight/30">
                {t(`events.${key}` as any)}
              </p>
            ))}
          </div>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('events.upcomingTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <a href="https://www.isaca.de/seminare/seminare/seminare-f%C3%BCr-manager1/cyber-security-expert-26-10-2026.html" target="_blank" rel="noopener noreferrer" className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 hover:bg-primary/10 transition-colors group">
              <ShieldCheck size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-sm md:text-base font-sans text-primary group-hover:underline">{t('events.upcomingIsacaCse')}</p>
                <p className="text-highlight text-sm font-mono font-semibold">{t('events.upcomingIsacaCseDate')}</p>
                <p className="text-foreground/70 text-xs font-mono">{t('events.upcomingIsacaCseLocation')}</p>
                <p className="text-primary text-xs font-mono mt-1">{t('events.upcomingIsacaCseLink')}</p>
              </div>
            </a>
            <a href="https://www.bechtle.com/shop/security-operations-center-soc-basis--EDU703001--p" target="_blank" rel="noopener noreferrer" className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 hover:bg-primary/10 transition-colors group">
              <Server size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-sm md:text-base font-sans text-primary group-hover:underline">{t('events.upcomingBechtleSoc')}</p>
                <p className="text-highlight text-sm font-mono font-semibold">{t('events.upcomingBechtleSocDate')}</p>
                <p className="text-foreground/70 text-xs font-mono">{t('events.upcomingBechtleSocLocation')}</p>
                <p className="text-primary text-xs font-mono mt-1">{t('events.upcomingBechtleSocLink')}</p>
              </div>
            </a>
            <a href="https://www.flane.de/course/innovator-mcsoc?hl=soc" target="_blank" rel="noopener noreferrer" className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 hover:bg-primary/10 transition-colors group">
              <Server size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-sm md:text-base font-sans text-primary group-hover:underline">{t('events.upcomingFastLaneSoc')}</p>
                <p className="text-highlight text-sm font-mono font-semibold">{t('events.upcomingFastLaneSocDate')}</p>
                <p className="text-foreground/70 text-xs font-mono">{t('events.upcomingFastLaneSocLocation')}</p>
                <p className="text-primary text-xs font-mono mt-1">{t('events.upcomingFastLaneSocLink')}</p>
              </div>
            </a>
          </div>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('events.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('events.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('events.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="events-workshops" onSelect={setActive} />

      </TypedSection>
      </>
    ),
    publications: () => (
      <TypedSection title={t('publications.title')} mode="typewriter" intro={<p>{t('publications.intro')}</p>}>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('publications.pubSectionTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Shield} title={t('publications.pub1Title')} desc={t('publications.pub1Desc')} href="https://www.heise.de/select/ix/2021/10/2019809530193925811" />
            <GridItem icon={Radio} title={t('publications.pub2Title')} desc={t('publications.pub2Desc')} href="https://www.heise.de/select/ix/archiv/2015/7/seite-78" />
          </div>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('publications.talksSectionTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Video} title={t('publications.pub3Title')} desc={t('publications.pub3Desc')} href="https://vimeo.com/295582173" />
          </div>
          <p className="text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed mt-3">{t('publications.talksExtra')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('publications.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('publications.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('publications.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="publications" onSelect={setActive} />
      </TypedSection>
    ),
    'virtual-ciso': () => (
      <TypedSection title={t('vciso.title')} mode="typewriter" intro={<p>{t('vciso.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('vciso.introDetail')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('vciso.sectionTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Crown} title={t('vciso.label2')} desc={t('vciso.body2')} />
            <GridItem icon={Settings} title={t('vciso.label3')} desc={t('vciso.body3')} />
            <GridItem icon={CheckSquare} title={t('vciso.label4')} desc={t('vciso.body4')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('vciso.modelTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('vciso.modelDesc')}</p>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('vciso.fitTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('vciso.fitDesc')}</p>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('vciso.refTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('vciso.refDesc')}</p>
        </Block>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('vciso.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('vciso.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('vciso.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="virtual-ciso" onSelect={setActive} />
      </TypedSection>
    ),
    'dora-nis2-ttx': () => (
      <TypedSection title={t('ttx.title')} mode="typewriter" intro={<p>{t('ttx.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('ttx.introDetail')}</p>
          <p className="text-highlight text-sm font-mono mt-2">{t('ttx.focusNote')}</p>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('ttx.targetTitle')}</SubTitle>
          <ul className="list-disc list-inside text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed space-y-1 mt-2">
            {(['target1','target2','target3','target4','target5'] as const).map(k => (
              <li key={k}>{t(`ttx.${k}` as any)}</li>
            ))}
          </ul>
        </Block>

        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('ttx.objectivesTitle')}</SubTitle>
          <ul className="list-disc list-inside text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed space-y-1 mt-2">
            {(['obj1','obj2','obj3','obj4','obj5','obj6'] as const).map(k => (
              <li key={k}>{t(`ttx.${k}` as any)}</li>
            ))}
          </ul>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('ttx.day1Title')}</SubTitle>
          <div className="space-y-3 mt-2">
            {(['mod1','mod2','mod3'] as const).map(m => (
              <div key={m} className="bg-card/40 rounded-lg p-3">
                <p className="font-semibold text-sm text-primary font-sans">{t(`ttx.${m}Title` as any)}</p>
                <p className="text-foreground/80 text-sm font-sans mt-1">{t(`ttx.${m}Desc` as any)}</p>
              </div>
            ))}
            <div className="bg-highlight/10 rounded-lg p-3 border border-highlight/20">
              <p className="font-semibold text-sm text-highlight font-sans">{t('ttx.practiceTitle')}</p>
              <p className="text-foreground/80 text-sm font-sans mt-1">{t('ttx.practiceDesc')}</p>
            </div>
          </div>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('ttx.day2Title')}</SubTitle>
          <div className="space-y-3 mt-2">
            {(['mod4','mod5','mod6','mod7'] as const).map(m => (
              <div key={m} className="bg-card/40 rounded-lg p-3">
                <p className="font-semibold text-sm text-primary font-sans">{t(`ttx.${m}Title` as any)}</p>
                <p className="text-foreground/80 text-sm font-sans mt-1">{t(`ttx.${m}Desc` as any)}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block className="bg-card/40 rounded-xl">
          <SubTitle>{t('ttx.methodTitle')}</SubTitle>
          <ul className="list-disc list-inside text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed space-y-1 mt-2">
            {(['method1','method2','method3','method4','method5'] as const).map(k => (
              <li key={k}>{t(`ttx.${k}` as any)}</li>
            ))}
          </ul>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('ttx.datesTitle')}</SubTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {([{k:'date1',loc:'location'},{k:'date2',loc:'location'},{k:'date3',loc:'locationBerlin'}] as const).map(({k,loc}) => (
              <div key={k} className="bg-card/40 rounded-lg p-3 border border-primary/10">
                <p className="font-semibold text-sm text-primary font-sans">{t(`ttx.${k}` as any)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t(`ttx.${loc}` as any)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-highlight/10 rounded-lg p-3 border border-highlight/20">
            <p className="text-sm font-semibold text-highlight font-sans">{t('ttx.priceLabel')}</p>
            <p className="text-foreground text-sm font-sans mt-1">{t('ttx.priceValue')}</p>
          </div>
        </Block>

        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('ttx.registerTitle')}</SubTitle>
          <div className="mt-3">
            <TtxRegistrationForm />
          </div>
        </Block>

        <Block className="bg-card/40 rounded-xl">
          <p className="text-highlight font-mono font-bold text-sm">{t('ttx.ctaTitle')}</p>
          <p className="text-foreground/80 text-sm font-sans mt-1">{t('ttx.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('ttx.ctaButton')}
          </button>
        </Block>
        <RelatedServices serviceId="dora-nis2-ttx" onSelect={setActive} />
      </TypedSection>
    ),
    'ai-workflows': () => (
      <TypedSection title={t('aiWorkflows.title')} mode="typewriter" intro={<p>{t('aiWorkflows.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('aiWorkflows.introDetail')}</p>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('aiWorkflows.areasTitle')}</SubTitle>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <GridItem icon={Zap} title={t('aiWorkflows.irTitle')} desc={t('aiWorkflows.irDesc')} />
            <GridItem icon={FileText} title={t('aiWorkflows.policyTitle')} desc={t('aiWorkflows.policyDesc')} />
            <GridItem icon={Search} title={t('aiWorkflows.auditTitle')} desc={t('aiWorkflows.auditDesc')} />
          </div>
        </Block>

        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('aiWorkflows.tryAgentsTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] mb-3">{t('aiWorkflows.tryAgentsDesc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* — Flagship: Krisensimulator — */}
            <button onClick={() => setActive('crisis-sim')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <AlertTriangle size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('crisisSim.sidebarLabel')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentCrisisDesc')}</p>
              </div>
            </button>
            {/* — Regulierungs-Checks — */}
            <button onClick={() => setActive('dora-check')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Landmark size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">DORA Incident Check</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentDoraDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('tisax-check')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Car size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">TISAX Assessment Check</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentTisaxDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('pci-check')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <CreditCard size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">PCI-DSS SAQ Navigator</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentPciDesc')}</p>
              </div>
            </button>
            {/* — Planung & Priorisierung — */}
            <button onClick={() => setActive('ttx-check')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <ClipboardList size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">ISCP Quick Check</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentTtxDesc')}</p>
              </div>
            </button>
            {/* — Lern-Simulationen — */}
            <button onClick={() => setActive('nis2-quiz')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Scale size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">NIS-2 Awareness Quiz</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentNis2QuizDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('ciso-sim')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <TrendingDown size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">CISO Budget Simulator</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentCisoDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('threatdrop')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Shield size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.agentThreatDropTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentThreatDropDesc')}</p>
              </div>
            </button>
            {/* — Arcade — */}
            <button onClick={() => setActive('trigger-triage')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Crosshair size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.agentTriggerTriageTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentTriggerTriageDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('cyber-frogger')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Gamepad2 size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.agentFroggerTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentFroggerDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('soc-life')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Building2 size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm flex items-center gap-2 flex-wrap">
                  {t('aiWorkflows.agentSocLifeTitle')}
                  {AI_TOOL_ADDED_AT['soc-life'] && <NewDateBadge addedAt={AI_TOOL_ADDED_AT['soc-life']} />}
                </p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentSocLifeDesc')}</p>
              </div>
            </button>
            {/* — Media — */}
            <button onClick={() => setYtDialogOpen(true)} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Play size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.agentYtTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentYtDesc')}</p>
              </div>
            </button>
            {/* — Simulation — */}
            <button onClick={() => setActive('butterfly-lab')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <TrendingDown size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm flex items-center gap-2 flex-wrap">
                  {t('aiWorkflows.butterflyTitle')}
                  {AI_TOOL_ADDED_AT['butterfly-lab'] && <NewDateBadge addedAt={AI_TOOL_ADDED_AT['butterfly-lab']} />}
                </p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.butterflyDesc')}</p>
              </div>
            </button>
            {/* — Entspannung — */}
            <button onClick={() => setActive('elite-ship')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Rocket size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.eliteTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.eliteDesc')}</p>
              </div>
            </button>
          </div>
          <Dialog open={ytDialogOpen} onOpenChange={setYtDialogOpen}>
            <DialogContent className="sm:max-w-[720px] p-0 bg-background border-highlight/30">
              <DialogTitle className="sr-only">{t('aiWorkflows.agentYtTitle')}</DialogTitle>
              <div className="aspect-video w-full">
                {ytDialogOpen && (
                  <iframe
                    className="w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/T8cfqFS77es?autoplay=1"
                    title="Realistische Einspieler in Krisenstabsübungen"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('aiWorkflows.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('aiWorkflows.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-highlight font-mono font-bold text-sm hover:text-primary transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('aiWorkflows.ctaButton')}
          </button>
        </Block>
      </TypedSection>
    ),
    why: () => (
      <TypedSection title={t('index.title')} mode="typewriter" intro={<p>{t('index.intro')}</p>}>
        <Block className="bg-card/40 rounded-xl">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{t('index.introDetail')}</p>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('index.whatTitle')}</SubTitle>
          <p className="text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('index.whatDesc')}</p>
          <p className="text-primary font-semibold text-sm font-sans mt-3">{t('index.whatOutro')}</p>
        </Block>

        <Block className="bg-card/40 rounded-xl">
          <SubTitle>{t('index.experienceTitle')}</SubTitle>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <StatBlock value="40+" label={t('index.trainingsDelivered')} />
            <StatBlock value="350+" label={t('index.peopleTrained')} />
            <StatBlock value="6" label={t('index.countriesCovered')} />
          </div>
        </Block>

        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('index.techCheckTitle')}</SubTitle>
          <p className="text-sm font-sans leading-relaxed tracking-wide text-foreground mb-3">{t('index.techCheckDesc')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InlineSystemCheck t={t} />
            <InlineConnectivityCheck t={t} language={language} />
          </div>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('index.upcomingTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <a href="https://www.isaca.de/seminare/seminare/seminare-f%C3%BCr-manager1/cyber-security-expert-26-10-2026.html" target="_blank" rel="noopener noreferrer" className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 hover:bg-primary/10 transition-colors group">
              <ShieldCheck size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-sm md:text-base font-sans text-primary group-hover:underline">{t('index.upcomingIsacaTitle')}</p>
                <p className="text-highlight text-sm font-mono font-semibold">{t('index.upcomingIsacaDate')}</p>
                <p className="text-primary text-xs font-mono mt-1">{t('index.upcomingIsacaLink')}</p>
              </div>
            </a>
            <div className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:bg-primary/10 transition-colors group" onClick={() => setActive('contact')}>
              <Calendar size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-sm md:text-base font-sans text-primary group-hover:underline">{t('index.upcomingCustomTitle')}</p>
                <p className="text-foreground/70 text-sm font-sans">{t('index.upcomingCustomDesc')}</p>
                <p className="text-primary text-xs font-mono mt-1">{t('index.upcomingCustomLink')}</p>
              </div>
            </div>
          </div>
        </Block>
      </TypedSection>
    ),
    training: () => (
      <TypedSection title={t('training.title')} mode="typewriter" intro={<p>{t('training.subtitle')} {t('training.intro')}</p>}>
        <CardBlock icon={Server} title={t('training.hostForensics')} desc={t('training.hostForensicsDesc')} />
        <CardBlock icon={Bug} title={t('training.malwareAnalysis')} desc={t('training.malwareAnalysisDesc')} />
        <CardBlock icon={Shield} title={t('training.siem')} desc={t('training.siemDesc')} />
        <CardBlock icon={AlertCircle} title={t('training.incidentMgmt')} desc={t('training.incidentMgmtDesc')} />
        <CardBlock icon={AlertTriangle} title={t('training.crisisMgmt')} desc={t('training.crisisMgmtDesc')} />
        <CardBlock icon={MessageSquare} title={t('training.crisisComm')} desc={t('training.crisisCommDesc')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('training.methodsTitle')}</SubTitle>
          <p className="text-sm font-sans leading-relaxed tracking-wide text-foreground mb-2">{t('training.methodsSubtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GridItem icon={BookOpen} title={t('training.knowledgeTransfer')} desc={t('training.knowledgeTransferDesc')} variant="highlight" />
            <GridItem icon={Users} title={t('training.groupExercises')} desc={t('training.groupExercisesDesc')} variant="highlight" />
            <GridItem icon={Zap} title={t('training.liveCyberAttacks')} desc={t('training.liveCyberAttacksDesc')} variant="highlight" />
          </div>
        </Block>
      </TypedSection>
    ),
    consulting: () => (
      <TypedSection title={t('consulting.title')} mode="typewriter" intro={<p>{t('consulting.intro')}</p>}>
        {[
          { icon: ShieldCheck, title: t('consulting.ismsTitle'), desc: t('consulting.ismsDesc'), id: 'isms' },
          { icon: Network, title: t('consulting.nis2Title'), desc: t('consulting.nis2Desc'), id: 'nis2-dora' },
          { icon: CreditCard, title: t('consulting.tisaxTitle'), desc: t('consulting.tisaxDesc'), id: 'tisax-pci-dss' },
          { icon: Search, title: t('consulting.assessTitle'), desc: t('consulting.assessDesc'), id: 'assessments-concepts' },
          { icon: Flame, title: t('consulting.incidentTitle'), desc: t('consulting.incidentDesc'), id: 'incident-management' },
          { icon: Swords, title: t('consulting.crisisTitle'), desc: t('consulting.crisisDesc'), id: 'cyber-crisis-management' },
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
              <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <StatBlock value="270+" label={t('consulting.clientsServed')} />
          <StatBlock value="20+" label={t('consulting.industrySectors')} />
          <StatBlock value="35+" label={t('consulting.yearsCombined')} />
        </div>
      </TypedSection>
    ),
    'by-whom': () => {
      const profileKeys = ['marcel', 'andreas'] as const;
      return (
        <TypedSection title={t('byWhom.title')} mode="typewriter" intro={<p>{t('byWhom.intro')}</p>}>
          {profileKeys.map(key => {
            const profile = consultantProfiles.find(p => key === 'marcel' ? p.name === 'Marcel Knop' : p.name === 'Andreas Funder')!;
            return (
              <Block key={key} className="bg-secondary/30">
                <div className="flex items-start gap-4 mb-4">
                  <img src={profile.imageUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 shadow-lg" />
                  <div>
                    <p className="text-primary font-bold text-base font-sans">{profile.name} · {profile.role}</p>
                    {profile.linkedinUrl && (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-highlight text-sm font-sans hover:underline">
                        <Linkedin size={14} /> LinkedIn →
                      </a>
                    )}
                  </div>
                </div>
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 mb-4">
                  <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed max-w-prose">{t(`profiles.${key}.bio`)}</p>
                </div>
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 space-y-1.5 text-sm font-sans">
                  <p><span className="text-primary font-semibold">{t(`profiles.${key}.focusLabel`)}:</span> <span className="text-foreground/80">{t(`profiles.${key}.focus`)}</span></p>
                  <p><span className="text-primary font-semibold">{t(`profiles.${key}.certsLabel`)}:</span> <span className="text-foreground/80">{t(`profiles.${key}.certs`)}</span></p>
                  <p><span className="text-primary font-semibold">{t(`profiles.${key}.eduLabel`)}:</span> <span className="text-foreground/80">{t(`profiles.${key}.edu`)}</span></p>
                  <p><span className="text-primary font-semibold">{t(`profiles.${key}.langLabel`)}:</span> <span className="text-foreground/80">{t(`profiles.${key}.lang`)}</span></p>
                </div>
              </Block>
            );
          })}
        </TypedSection>
      );
    },
    contact: () => (
      <TypedSection title={t('contact.title')} mode="typewriter" charDelay={8} intro={<p>{t('contact.intro')}</p>}>
        <Block className="bg-secondary/30">
          <p className="text-primary font-bold text-base font-sans mb-3">Marcel Knop</p>
          <div className="space-y-1.5 text-sm md:text-[15px] font-sans">
            <p>
              <a href="tel:+4915205691648" className="text-foreground hover:text-highlight transition-electric">+49 1520 569 1648</a>
            </p>
            <p>
              <a href="mailto:marcel@inside-the-box.org" className="text-foreground hover:text-highlight transition-electric">marcel@inside-the-box.org</a>
            </p>
          </div>
        </Block>
      </TypedSection>
    ),
    imprint: () => (
      <TypedSection title={t('imprint.title')} mode="typewriter" charDelay={8}>
        <Block className="bg-secondary/30">
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed">
            <span className="text-primary font-semibold">{t('imprint.responsible')}</span><br />
            Marcel Knop<br />
            Appenrother Weg 14<br />
            34308 Bad Emstal, Germany
          </p>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-3">
            <span className="text-primary font-semibold">{t('imprint.contactLabel')}</span><br />
            <a href="mailto:marcel@inside-the-box.org" className="hover:text-highlight transition-electric">marcel@inside-the-box.org</a><br />
            <a href="tel:+4915205691648" className="hover:text-highlight transition-electric">+49 1520 569 1648</a>
          </p>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-3">
            <span className="text-primary font-semibold">{t('imprint.vatId')}</span> DE328906053
          </p>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-3">
            <span className="text-primary font-semibold">{t('imprint.insurance')}</span><br />
            Hiscox SA · Arnulfstr. 31 · 80636 Munich, Germany
          </p>
        </Block>
        <CardBlock icon={Scale} title={t('imprint.disclaimer')} desc={t('imprint.disclaimerText')} />
        <CardBlock icon={FileText} title={t('imprint.copyright')} desc={t('imprint.copyrightText')} />
        <CardBlock icon={Shield} title={t('imprint.dataProtection')} desc={t('imprint.dataProtectionText')} />
      </TypedSection>
    ),
    'tech-requirements': () => {
      const systemItems = tArray('techReq.systemItems');
      const networkItems = tArray('techReq.networkItems');
      return (
        <TypedSection title={t('techReq.title')} mode="typewriter" charDelay={18} intro={<p>{t('techReq.intro')}</p>}>
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
          <InlineSystemCheck t={t} />
          <InlineConnectivityCheck t={t} language={language} />
        </TypedSection>
      );
    },
    'crisis-sim': () => null, // handled separately in ChatView to pass ref
  };

  // We need setActive to be available inside consulting content
  let setActive: (id: string) => void = () => {};
  const bindSetActive = (fn: (id: string) => void) => { setActive = fn; };

  return { contentMap, bindSetActive };
};

interface SidebarItem { id: string; icon: LucideIcon; label: string; isNew?: boolean; }
interface SidebarGroup { title: string; items: SidebarItem[]; }

const SidebarItems = ({ groups, activeId, onSelect }: { groups: SidebarGroup[]; activeId: string | null; onSelect: (id: string) => void }) => (
  <div className="flex-1 overflow-y-auto px-2 pb-4">
    {groups.map((group) => (
      <div key={group.title} className="mb-3">
        <p className="px-2 py-1.5 text-xs font-rounded font-bold text-accent uppercase tracking-wider">{group.title}</p>
        {group.items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-1 text-left transition-electric group ${
              activeId === item.id ? 'bg-highlight/10 text-highlight' : 'text-foreground hover:bg-highlight/5 hover:text-highlight'
            }`}
          >
            <item.icon size={16} className={`flex-shrink-0 ${activeId === item.id ? 'text-highlight' : 'text-foreground/60 group-hover:text-highlight'}`} />
            <span className="truncate font-rounded text-base flex-1">{item.label}</span>
            {item.isNew && (
              <span
                className="relative inline-flex h-1.5 w-1.5 flex-shrink-0"
                aria-label="New"
                title="New"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            )}
          </button>
        ))}
      </div>
    ))}
  </div>
);

const useSidebarGroups = (): SidebarGroup[] => {
  const { t } = useLanguage();
  return [
    {
      title: t('nav.groupCyberResilience'),
      items: [
        { id: 'cyber-crisis-management', icon: Swords, label: t('nav.krisenmanagement') },
        
        { id: 'why', icon: Target, label: t('nav.cyberTrainingRange') },
        { id: 'arena-training', icon: Target, label: t('nav.redTeam') },
        { id: 'incident-management', icon: Flame, label: t('nav.incidentMgmt') },
      ],
    },
    {
      title: t('nav.groupRegulation'),
      items: [
        { id: 'nis2-dora', icon: Network, label: t('nav.nis2Dora') },
        { id: 'dora-nis2-ttx', icon: ClipboardList, label: t('nav.ttxTraining'), isNew: true },
        { id: 'isms', icon: ShieldCheck, label: t('nav.ismsBsi') },
        { id: 'tisax-pci-dss', icon: CreditCard, label: t('nav.tisaxPci') },
      ],
    },
    {
      title: t('nav.groupGovernance'),
      items: [
        { id: 'virtual-ciso', icon: UserCheck, label: t('nav.virtualCiso') },
        { id: 'assessments-concepts', icon: Search, label: t('nav.assessments') },
      ],
    },
    {
      title: t('nav.groupInsights'),
      items: [
        { id: 'publications', icon: FileText, label: t('nav.publications') },
        { id: 'events-workshops', icon: Calendar, label: t('nav.eventsWorkshops') },
        { id: 'ai-workflows', icon: Zap, label: t('nav.aiWorkflows'), isNew: true },
      ],
    },
    {
      title: t('nav.groupAbout'),
      items: [
        { id: 'by-whom', icon: Users, label: t('nav.profiles') },
        { id: 'contact', icon: Mail, label: t('nav.contact') },
        { id: 'imprint', icon: Scale, label: t('nav.imprint') },
      ],
    },
  ];
};

// ── Main component ──────────────────────────────────────────────────────────

const ChatView = () => {
  const { language, setLanguage, t } = useLanguage();
  const { serviceId: routeServiceId } = useParams<{ serviceId?: string }>();
  const navigate = useNavigate();
  const sidebarGroups = useSidebarGroups();

  // Derive service ID from either the :serviceId param OR from known explicit routes
  const deriveServiceId = useCallback((): string | null => {
    if (routeServiceId) return routeServiceId;
    const path = window.location.pathname.replace(/^\//, '');
    const explicitRoutes = ['nis2-compliance', 'iacs-e27', 'iec62443', 'soc-life'];
    if (explicitRoutes.includes(path)) return path;
    return null;
  }, [routeServiceId]);

  const [activeService, setActiveService] = useState<string | null>(() => deriveServiceId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarInitialized, setSidebarInitialized] = useState(false);
   const [titleDone, setTitleDone] = useState(false);
   const [subtitleDone, setSubtitleDone] = useState(false);
   const [claimDone, setClaimDone] = useState(false);
   const [chatBarReady, setChatBarReady] = useState(false);
   const [exampleIndex, setExampleIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const crisisRef = useRef<CrisisSimulatorHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const { contentMap, bindSetActive } = useServiceContent();
  const navigateToService = useCallback((id: string | null) => {
    setActiveService(id);
    setMessages([]);
    navigate(id ? `/${id}` : '/', { replace: false });
  }, [navigate]);

  bindSetActive((id) => navigateToService(id));

  // Sync when route param changes (e.g. browser back/forward)
  useEffect(() => {
    const newService = deriveServiceId();
    if (newService !== activeService) {
      setActiveService(newService);
      setMessages([]);
    }
  }, [routeServiceId, deriveServiceId]);

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
    
    // Route to crisis simulator if active
    if (activeService === 'crisis-sim' && crisisRef.current?.isActive()) {
      setInput('');
      crisisRef.current.sendExternalMessage(userMsg);
      return;
    }
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const { data: responseData, error: fnError } = await supabase.functions.invoke('ask-navigator', {
        body: { question: userMsg },
      });
      if (fnError) throw fnError;
      setMessages(prev => [...prev, { role: 'assistant', content: responseData.message, links: responseData.links }]);
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
    navigateToService(null);
    setInput(''); 
    setChatOpen(false);
    if (window.innerWidth >= 768) inputRef.current?.focus(); 
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const isMobile = useIsMobile();

  // Auto-close sidebar when desktop window is too narrow
  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (window.innerWidth < 900 && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, sidebarOpen]);

  useEffect(() => {
    if (!sidebarInitialized && typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        // Mobile: sidebar stays closed, mark initialized
        setSidebarInitialized(true);
      } else if (activeService !== null) {
        // Desktop with active service: open immediately — except for SocLife,
        // where the simulator should get full focus on first load. The user
        // can still open the sidebar manually via the trigger.
        if (activeService !== 'soc-life') {
          setSidebarOpen(true);
        }
        setSidebarInitialized(true);
      } else if (claimDone) {
        // Desktop welcome screen: open after user has time to read content
        const timer = setTimeout(() => {
          setSidebarOpen(true);
          setSidebarInitialized(true);
        }, 2800);
        return () => clearTimeout(timer);
      }
    }
  }, [sidebarInitialized, claimDone, activeService]);

  // Show chat bar after sidebar has opened (last element to appear)
  useEffect(() => {
    if (sidebarInitialized && !chatBarReady) {
      const delay = activeService !== null ? 0 : 800;
      const timer = setTimeout(() => setChatBarReady(true), delay);
      return () => clearTimeout(timer);
    }
  }, [sidebarInitialized, chatBarReady, activeService]);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Tool/wizard/simulator routes — chat bar is hidden on these (focused workflows)
  const TOOL_SERVICES = useMemo(() => new Set([
    'crisis-sim', 'dora-check', 'tisax-check', 'pci-check', 'ttx-check',
    'nis2-quiz', 'ciso-sim', 'threatdrop', 'trigger-triage', 'cyber-frogger',
    'elite-ship', 'cra-check', 'dora-compliance', 'nis2-compliance',
    'iacs-e27', 'iec62443', 'butterfly-lab', 'soc-life', 'system-check',
    'ttx-readiness', 'enigma', 'itsm', 'itsm-dev',
  ]), []);
  const isToolPage = !!activeService && TOOL_SERVICES.has(activeService);

  // Rotating example questions for the chat placeholder (info pages only)
  const exampleQuestions = useMemo(() => {
    const all = {
      de: [
        // Short (≤34) — Kundenintent, mobil-tauglich
        'Was bietet ihr genau an?',
        'Wie kann ich euch beauftragen?',
        'Was kostet ein Tabletop?',
        'Wann ist der nächste TTX-Termin?',
        'Macht ihr auch Audits?',
        'Helft ihr bei NIS-2?',
        'Helft ihr bei DORA?',
        'Habt ihr Referenzen?',
        'Wer steckt hinter inside-the-box?',
        'Arbeitet ihr remote?',
        'Sprecht ihr Deutsch und Englisch?',
        'Wie schnell könnt ihr starten?',
        'Macht ihr auch Krisenübungen?',
        'Habt ihr ein Beispiel-Report?',
        'Bietet ihr ISMS-Aufbau an?',
        'Macht ihr CISO as a Service?',
        'Begleitet ihr ISO 27001?',
        'Helft ihr bei TISAX?',
        'Macht ihr PCI-DSS Beratung?',
        'Bietet ihr OT-Security an?',
        'Helft ihr nach einem Incident?',
        'Macht ihr Awareness-Trainings?',
        'Habt ihr KI-Tools zum Testen?',
        'Wo kann ich ein Angebot anfragen?',
        'Wie läuft ein Erstgespräch?',
        'Macht ihr auch kleine Firmen?',
        'Habt ihr ein Whitepaper?',
        'Wie unterscheidet ihr euch?',
        'Was ist „inside the box"?',
        'Kann ich die Tools selbst nutzen?',
        // Long — Kundenintent
        'Wie helft ihr uns bei der NIS-2-Umsetzung?',
        'Was kostet ein Tabletop Exercise bei euch?',
        'Wie schnell könnt ihr mit einem Projekt starten?',
        'Was ist im Festpreis-Paket alles enthalten?',
        'Wie ist der Ablauf einer Zusammenarbeit?',
        'Macht ihr auch komplette ISMS-Begleitung?',
        'Könnt ihr uns auf ein NIS-2 Audit vorbereiten?',
        'Wie lange dauert ein typisches Beratungsprojekt?',
        'Bietet ihr CISO as a Service an?',
        'Wie unterstützt ihr nach einem Cyberangriff?',
        'Welche Branchen betreut ihr typischerweise?',
        'Habt ihr Erfahrung mit kritischer Infrastruktur?',
        'Macht ihr auch reine Workshops für die Geschäftsleitung?',
        'Könnt ihr unsere Lieferanten mit prüfen?',
        'Welche Tools dürfen wir kostenfrei nutzen?',
        'Wie sieht euer Tabletop-Format konkret aus?',
        'Bietet ihr Vor-Ort-Workshops oder remote?',
        'Wie helft ihr bei der DORA-Umsetzung?',
        'Welche Reportings bekommen wir am Ende?',
        'Habt ihr ein Beispiel für einen Audit-Report?',
        'Wie unterscheidet ihr euch von großen Beratungen?',
        'Mit wem arbeite ich konkret zusammen?',
        'Habt ihr Festpreise oder Tagessätze?',
        'Wie verbindlich ist ein erstes Angebot?',
        'Wie sieht ein Pilotprojekt mit euch aus?',
        'Könnt ihr eine Krisenübung für unseren Vorstand machen?',
        'Begleitet ihr uns auch nach dem Audit?',
        'Helft ihr bei der Auswahl eines SOC-Anbieters?',
        'Könnt ihr uns bei einer Versicherungsanfrage unterstützen?',
        'Wie sichert ihr Vertraulichkeit zu?',
      ],
      en: [
        // Short (≤34) — customer intent
        'What do you actually offer?',
        'How can I hire you?',
        'What does a tabletop cost?',
        'When is the next TTX session?',
        'Do you run audits too?',
        'Can you help with NIS-2?',
        'Can you help with DORA?',
        'Do you have references?',
        'Who is behind inside-the-box?',
        'Do you work remotely?',
        'How fast can you start?',
        'Do you do crisis exercises?',
        'Do you have a sample report?',
        'Do you build ISMS programmes?',
        'Do you offer CISO-as-a-Service?',
        'Do you support ISO 27001?',
        'Can you help with TISAX?',
        'Do you do PCI-DSS advisory?',
        'Do you do OT security?',
        'Can you help after a breach?',
        'Do you run awareness training?',
        'Can I try your AI tools?',
        'Where do I request a quote?',
        'How does a first call work?',
        'Do you take on small firms?',
        'Do you have a whitepaper?',
        'How are you different?',
        'What is „inside the box"?',
        'Can I use the tools myself?',
        'Do you speak English?',
        // Long — customer intent
        'How can you help us implement NIS-2?',
        'What does a tabletop exercise cost with you?',
        'How fast can you start a project?',
        'What is included in your fixed-price package?',
        'How does an engagement with you typically run?',
        'Do you also support full ISMS rollouts?',
        'Can you prepare us for a NIS-2 audit?',
        'How long does a typical advisory project take?',
        'Do you offer CISO as a Service?',
        'How do you support us after a cyber attack?',
        'Which industries do you typically work with?',
        'Do you have experience with critical infrastructure?',
        'Do you run executive-only workshops?',
        'Can you assess our suppliers as well?',
        'Which tools can we use for free?',
        'What does your tabletop format look like?',
        'Do you deliver on-site workshops or remote?',
        'How can you help with DORA implementation?',
        'What deliverables do we get at the end?',
        'Do you have a sample audit report?',
        'How do you differ from the big consultancies?',
        'Who exactly will I work with on the project?',
        'Do you offer fixed prices or day rates?',
        'How binding is an initial quote?',
        'What does a pilot with you look like?',
        'Can you run a crisis drill for our board?',
        'Do you stay with us after the audit?',
        'Can you help us select a SOC provider?',
        'Can you support us with a cyber insurance request?',
        'How do you ensure confidentiality?',
      ],
      fr: [
        // Short (≤34) — intention client
        'Que proposez-vous exactement ?',
        'Comment vous mandater ?',
        'Combien coûte un tabletop ?',
        'Prochaine session TTX ?',
        'Faites-vous des audits ?',
        'Aidez-vous sur NIS-2 ?',
        'Aidez-vous sur DORA ?',
        'Avez-vous des références ?',
        'Qui est derrière inside-the-box ?',
        'Travaillez-vous à distance ?',
        'Sous quel délai démarrer ?',
        'Faites-vous des exercices ?',
        'Avez-vous un rapport type ?',
        'Construisez-vous un SMSI ?',
        'CISO as a Service ?',
        'Accompagnez-vous ISO 27001 ?',
        'Aidez-vous pour TISAX ?',
        'Conseil PCI-DSS ?',
        'Faites-vous de l\'OT security ?',
        'Aide après un incident ?',
        'Sensibilisation utilisateurs ?',
        'Puis-je tester vos outils IA ?',
        'Où demander un devis ?',
        'Comment se passe un premier RDV ?',
        'Travaillez-vous avec des PME ?',
        'Avez-vous un livre blanc ?',
        'Qu\'est-ce qui vous différencie ?',
        'Parlez-vous français ?',
        'Puis-je utiliser les outils ?',
        'C\'est quoi „inside the box" ?',
        // Long — intention client
        'Comment pouvez-vous nous aider sur NIS-2 ?',
        'Combien coûte un tabletop exercise chez vous ?',
        'Sous quel délai pouvez-vous démarrer un projet ?',
        'Que contient votre forfait au prix fixe ?',
        'Comment se déroule une mission avec vous ?',
        'Accompagnez-vous le déploiement complet d\'un SMSI ?',
        'Pouvez-vous nous préparer à un audit NIS-2 ?',
        'Combien de temps dure une mission de conseil typique ?',
        'Proposez-vous du CISO as a Service ?',
        'Comment intervenez-vous après une cyberattaque ?',
        'Quels secteurs accompagnez-vous habituellement ?',
        'Avez-vous une expérience des infrastructures critiques ?',
        'Faites-vous des ateliers réservés à la direction ?',
        'Pouvez-vous aussi évaluer nos fournisseurs ?',
        'Quels outils peut-on utiliser gratuitement ?',
        'À quoi ressemble concrètement votre format tabletop ?',
        'Vos ateliers sont-ils sur site ou à distance ?',
        'Comment nous accompagnez-vous sur DORA ?',
        'Quels livrables recevons-nous à la fin ?',
        'Avez-vous un exemple de rapport d\'audit ?',
        'En quoi vous différenciez-vous des grands cabinets ?',
        'Avec qui vais-je concrètement travailler ?',
        'Travaillez-vous au forfait ou en TJM ?',
        'Un premier devis est-il engageant ?',
        'À quoi ressemble un projet pilote avec vous ?',
        'Pouvez-vous animer une crise pour notre comité ?',
        'Restez-vous avec nous après l\'audit ?',
        'Aidez-vous à sélectionner un prestataire SOC ?',
        'Pouvez-vous nous aider sur une demande d\'assurance cyber ?',
        'Comment garantissez-vous la confidentialité ?',
      ],
    } as const;
    const list = all[(language as 'de' | 'en' | 'fr')] ?? all.en;
    // On mobile, only keep short questions that fit on a single line in the chat bar
    const maxLen = isMobile ? 34 : 999;
    const filtered = list.filter(q => q.length <= maxLen);
    const pool = filtered.length > 0 ? filtered : list;
    // Fisher-Yates shuffle so each visit shows a different order
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [language, isMobile]);


  // Rotate every 4s, but pause while the user is typing
  useEffect(() => {
    if (isToolPage || input.length > 0) return;
    const id = window.setInterval(() => {
      setExampleIndex(i => (i + 1) % exampleQuestions.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [isToolPage, input.length, exampleQuestions.length]);

  const selectService = (id: string) => {
    navigateToService(id);
    if (isMobile) setSidebarOpen(false);
    if (!isMobile && !isTablet) inputRef.current?.focus();
  };

  const lazyFallback = (
    <div className="px-2 py-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="space-y-3 max-w-2xl">
        <div className="h-5 w-1/3 rounded bg-muted/40" />
        <div className="h-3 w-2/3 rounded bg-muted/30" />
        <div className="h-3 w-5/6 rounded bg-muted/25" />
        <div className="h-24 rounded-lg bg-muted/20 mt-4" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );

  const serviceContent = activeService === 'crisis-sim'
    ? <Suspense fallback={lazyFallback}><CyberCrisisSimulator embedded ref={crisisRef} /></Suspense>
    : activeService === 'dora-check'
    ? <Suspense fallback={lazyFallback}><DoraIncidentReporter embedded /></Suspense>
    : activeService === 'tisax-check'
    ? <Suspense fallback={lazyFallback}><TisaxAssessmentClassifier embedded /></Suspense>
    : activeService === 'pci-check'
    ? <Suspense fallback={lazyFallback}><PciDssSaqNavigator embedded /></Suspense>
    : activeService === 'ttx-check'
    ? <Suspense fallback={lazyFallback}><IspcTtxPrioritizer embedded /></Suspense>
    : activeService === 'nis2-quiz'
    ? <Suspense fallback={lazyFallback}><Nis2AwarenessQuiz embedded /></Suspense>
    : activeService === 'ciso-sim'
    ? <Suspense fallback={lazyFallback}><CisoSimulator embedded /></Suspense>
    : activeService === 'threatdrop'
    ? <Suspense fallback={lazyFallback}><ThreatDropQuiz embedded /></Suspense>
    : activeService === 'trigger-triage'
    ? <Suspense fallback={lazyFallback}><TriggerTriage embedded /></Suspense>
    : activeService === 'cyber-frogger'
    ? <Suspense fallback={lazyFallback}><CyberFrogger embedded /></Suspense>
    : activeService === 'elite-ship'
    ? <Suspense fallback={lazyFallback}><EliteShipScene embedded /></Suspense>
    : activeService === 'cra-check'
    ? <Suspense fallback={lazyFallback}><CraComplianceTool embedded /></Suspense>
    : activeService === 'dora-compliance'
    ? <Suspense fallback={lazyFallback}><DoraComplianceTool embedded /></Suspense>
    : activeService === 'nis2-compliance'
    ? <Suspense fallback={lazyFallback}><Nis2ComplianceTool embedded /></Suspense>
    : activeService === 'iacs-e27' || activeService === 'iec62443'
    ? <Suspense fallback={lazyFallback}><Iec62443ComplianceTool embedded /></Suspense>
    : activeService === 'butterfly-lab'
    ? <Suspense fallback={lazyFallback}><ButterflyEffectLab embedded /></Suspense>
    : activeService === 'soc-life'
    ? <Suspense fallback={lazyFallback}><SocLife embedded /></Suspense>
    : activeService === 'system-check'
    ? <InlineSystemCheck t={t} />
    : activeService && contentMap[activeService] ? contentMap[activeService]() : null;

  return (
    <div className="h-screen flex overflow-hidden bg-transparent">
      <PageMeta title="inside-the-box" description="Cybersecurity Navigator" />

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[280px] h-full flex flex-col bg-card animate-in slide-in-from-left duration-200">
            <div className="p-3 flex items-center justify-between bg-primary/10">
              <button onClick={() => { navigateToService(null); setSidebarOpen(false); }} className="flex items-center gap-2 text-sm font-rounded font-bold text-primary hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"><GeometricSymbol size="xs" />inside-the-box.org</button>
              <button onClick={() => setSidebarOpen(false)} className="ml-2 p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-electric">
                <X size={18} />
              </button>
            </div>
            <SidebarItems groups={sidebarGroups} activeId={activeService} onSelect={selectService} />
            <div className="border-t border-border p-3 flex items-center justify-center gap-1">
              {(['en', 'de', 'fr'] as const).map(lng => (
                <button key={lng} onClick={() => setLanguage(lng)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-rounded font-bold uppercase tracking-wider transition-electric ${language === lng ? 'bg-highlight/20 border-highlight text-highlight' : 'border-highlight/30 text-highlight/60 hover:bg-highlight/10 hover:border-highlight/50 hover:text-highlight'}`}>
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
          <div className="w-64 h-full flex flex-col bg-card border-r border-border">
            <div className="h-12 px-3 flex items-center justify-between bg-primary/10 border-b border-border flex-shrink-0">
              <button onClick={() => navigateToService(null)} className="flex items-center gap-2 text-sm font-rounded font-bold text-primary hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"><GeometricSymbol size="xs" />inside-the-box.org</button>
              <div className="flex gap-1">
                {(['en', 'de', 'fr'] as const).map(lng => (
                  <button key={lng} onClick={() => setLanguage(lng)} className={`rounded-lg border px-2 py-1.5 text-xs font-rounded font-bold uppercase tracking-wider transition-electric ${language === lng ? 'bg-highlight/20 border-highlight text-highlight' : 'border-highlight/30 text-highlight/60 hover:bg-highlight/10 hover:border-highlight/50 hover:text-highlight'}`}>
                    {lng.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <SidebarItems groups={sidebarGroups} activeId={activeService} onSelect={selectService} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-electric">
            {!isMobile && sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          {activeService ? (
            <a href="/" className="flex-1 text-sm font-mono font-bold text-accent truncate text-center md:text-left hover:text-highlight transition-electric">
              inside-the-box.org
            </a>
          ) : (
            <span className="flex-1" />
          )}
          {isMobile && (
            <button onClick={newChat} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-electric">
              <Plus size={18} />
            </button>
          )}
        </div>

        <div ref={contentAreaRef} className="flex-1 overflow-y-auto relative" style={{ contain: 'layout style' }}>
          {!activeService && messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center px-4 pb-40 max-w-2xl mx-auto" style={{ gap: 0, contain: 'layout style' }}>
              {/* Logo – always visible */}
              <div className="mb-8 animate-logo-breathe">
                <GeometricSymbol size="sm" className="w-12 h-12" />
              </div>

              {/* Brand name – typewriter */}
              <div className="relative" style={{ marginBottom: '8px' }}>
                <h1 aria-hidden="true" className="font-rounded font-bold text-center invisible whitespace-nowrap" style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2rem)', letterSpacing: '-0.02em' }}>
                  {t('welcome.title')}
                </h1>
                <h1 className="font-rounded font-bold text-accent text-center absolute inset-0 whitespace-nowrap" style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2rem)', letterSpacing: '-0.02em' }}>
                  <Typewriter text={t('welcome.title')} charDelay={60} cursor={false} onDone={() => { setTitleDone(true); setSubtitleDone(true); }} />
                </h1>
              </div>

              {/* Subtitle – fade in after title */}
              <p
                className="font-rounded text-primary text-center"
                style={{
                  fontSize: 'clamp(0.95rem, 2.2vw, 1.05rem)',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  marginBottom: '28px',
                }}
              >
                {t('welcome.heroSubtitle')}
              </p>

              {/* Claim – scramble, starts after subtitle */}
              <div className="w-full text-center relative" style={{ marginBottom: '28px' }}>
                <p aria-hidden="true" className="font-mono text-center uppercase invisible" style={{ fontSize: 'clamp(0.82rem, 2vw, 0.95rem)', letterSpacing: '0.22em', fontWeight: 500 }}>
                  {t('welcome.heroClaim')}
                </p>
                {subtitleDone && (
                  <p className="font-mono text-center uppercase text-foreground absolute inset-0" style={{ fontSize: 'clamp(0.82rem, 2vw, 0.95rem)', letterSpacing: '0.22em', fontWeight: 500 }}>
                    <Typewriter text={t('welcome.heroClaim')} mode="scramble" charDelay={18} cursor={false} onDone={() => setClaimDone(true)} />
                  </p>
                )}
              </div>

              {/* Cybersecurity Consulting – fade after claim */}
              <div
                className="w-full text-center"
                style={{
                  marginBottom: '16px',
                  opacity: claimDone ? 1 : 0,
                  transition: 'opacity 600ms ease-out',
                }}
              >
                <p className="font-rounded text-base text-center text-foreground" style={{ fontWeight: 400 }}>
                  {t('welcome.heroConsulting')}
                </p>
              </div>

              {/* Names – fade after claim (slightly delayed) */}
              <div
                className="w-full text-center"
                style={{
                  opacity: claimDone ? 1 : 0,
                  transition: 'opacity 600ms ease-out 300ms',
                }}
              >
                <p className="font-rounded text-base text-center text-foreground" style={{ fontWeight: 500 }}>
                  {t('welcome.heroSignature')}
                </p>
              </div>

              {/* News panel – fade in last */}
              <div
                className="w-full"
                style={{
                  opacity: claimDone ? 1 : 0,
                  transition: 'opacity 700ms ease-out 700ms',
                }}
              >
                <NewsPanel onSelectService={selectService} />
              </div>
            </div>
          ) : (
            <div className="w-full px-3 md:px-6 lg:px-10 py-4 md:py-6 pb-20 space-y-4">
              {serviceContent && (() => {
                if (activeService === 'crisis-sim' || activeService === 'elite-ship') {
                  return <div className="flex-1 min-w-0">{serviceContent}</div>;
                }
                const ActiveIcon = sidebarGroups.flatMap(g => g.items).find(i => i.id === activeService)?.icon || MessageCircle;
                return (
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-[18px]">
                    <ActiveIcon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">{serviceContent}</div>
                </div>
                );
              })()}
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

        {/* Input – floating bar. Hidden on focused tool/wizard pages, visible on info pages and crisis-sim. */}
        {(() => {
          // Hide entirely on focused tool/wizard/simulator pages (except crisis-sim where chat IS the tool)
          if (isToolPage && activeService !== 'crisis-sim') return null;
          const placeholder = activeService === 'crisis-sim'
            ? 'Ask me anything …'
            : exampleQuestions[exampleIndex];
          return (
            <div
              className="fixed z-40 pointer-events-none transition-opacity duration-700 ease-out"
              style={{
                left: isMobile ? '1rem' : (sidebarOpen ? 'calc(16rem + 1.5rem)' : '1.5rem'),
                right: isMobile ? '1rem' : '0.75rem',
                bottom: 'calc(1rem + env(safe-area-inset-bottom))',
                opacity: chatBarReady ? 1 : 0,
              }}
            >
              <div className="max-w-2xl ml-auto pointer-events-auto">
                <div className="relative flex items-center bg-secondary/90 backdrop-blur-md rounded-xl border border-highlight/30 focus-within:border-highlight/60 transition-electric shadow-lg">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-3 md:px-4 py-2.5 text-base md:text-sm font-mono text-foreground placeholder:text-muted-foreground placeholder:transition-opacity placeholder:duration-500 resize-none focus:outline-none max-h-[120px]"
                    disabled={isLoading || (activeService === 'crisis-sim' && crisisRef.current?.isLoading())}
                  />
                  <button onClick={handleSend} disabled={!input.trim() || isLoading || (activeService === 'crisis-sim' && crisisRef.current?.isLoading())} className="m-1.5 p-2 rounded-lg bg-highlight text-highlight-foreground disabled:opacity-30 hover:bg-highlight/80 transition-electric">
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
