import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { Send, Plus, MessageCircle, Shield, Target, BookOpen, AlertTriangle, Eye, Flame, Swords, Calendar, FileText, UserCheck, ChevronLeft, Menu, ShieldCheck, Search, Settings, Award, RotateCcw, Network, CreditCard, CheckCircle, FileCheck, Car, BarChart, RefreshCw, GraduationCap, ClipboardList, Zap, Crown, Users, Gamepad2, Monitor, Users2, Lightbulb, Flag, Crosshair, CheckSquare, Mic, Presentation, Wrench, Radio, Video, DollarSign, Phone, Mail, Server, Bug, AlertCircle, MessageSquare, Globe, Building2, Plane, Landmark, Scale, Wifi, XCircle, HelpCircle, Loader2, X, Linkedin, Play, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { consultantProfiles } from '@/data/consultantProfiles';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { LucideIcon } from 'lucide-react';
import CyberCrisisSimulator, { type CrisisSimulatorHandle } from './CyberCrisisSimulator';
import DoraIncidentReporter from './DoraIncidentReporter';
import ArtificialStressSimulator from './ArtificialStressSimulator';
import TisaxAssessmentClassifier from './TisaxAssessmentClassifier';
import PciDssSaqNavigator from './PciDssSaqNavigator';
import IspcTtxPrioritizer from './IspcTtxPrioritizer';
import Nis2AwarenessQuiz from './Nis2AwarenessQuiz';
import CisoSimulator from './CisoSimulator';
import ThreatDropQuiz from './ThreatDropQuiz';
import TriggerTriage from './TriggerTriage';
import CyberFrogger from './CyberFrogger';
import { StaggerReveal } from '@/components/StaggerReveal';
import GlitchText from '@/components/GlitchText';
import Typewriter from '@/components/Typewriter';
import TypedSection from '@/components/TypedSection';
import { LinkButton } from '@/components/LinkButton';

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
          <a href={link} target="_blank" rel="noopener noreferrer" className={`inline-block mt-2 transition-electric text-sm font-sans underline ${variant === 'highlight' ? 'text-highlight hover:text-primary' : 'text-primary hover:text-highlight'}`}>
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

const GridItem = ({ icon: Icon, title, subtitle, desc, variant = 'primary', href, className }: { icon: LucideIcon; title: string; subtitle?: string; desc: string; variant?: 'primary' | 'highlight'; href?: string; className?: string }) => {
  const colorClass = variant === 'highlight' ? 'text-highlight' : 'text-primary';
  const bgClass = variant === 'highlight' ? 'bg-highlight/5' : 'bg-primary/5';
  return (
    <div className={`${bgClass} rounded-lg p-3 flex items-start gap-2.5 overflow-hidden ${className || ''}`}>
      <Icon size={18} className={`mt-1 flex-shrink-0 ${colorClass}`} />
      <div className="space-y-1 min-w-0">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={`font-semibold text-sm md:text-base font-sans underline hover:opacity-80 ${colorClass}`}>{title}</a>
        ) : (
          <p className={`font-semibold text-sm md:text-base font-sans ${colorClass}`}>{title}</p>
        )}
        {subtitle && <p className={`${colorClass}/70 text-xs font-semibold font-sans uppercase tracking-wide`}>{subtitle}</p>}
        <p className="text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed whitespace-pre-line break-words">{desc}</p>
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
          </div>
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
            className="mt-3 inline-flex items-center gap-2 text-primary font-mono font-bold text-sm hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('isms.ctaButton')}
          </button>
        </Block>
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
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('nis2.ctaTitle')}</SubTitle>
          <p className="text-foreground text-sm md:text-[15px] font-sans leading-relaxed mt-2">{t('nis2.ctaDesc')}</p>
          <button
            onClick={() => setActive('contact')}
            className="mt-3 inline-flex items-center gap-2 text-primary font-mono font-bold text-sm hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('nis2.ctaButton')}
          </button>
        </Block>
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
            className="mt-3 inline-flex items-center gap-2 text-primary font-mono font-bold text-sm hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('tisax.ctaButton')}
          </button>
        </Block>
      </TypedSection>
    ),
    'assessments-concepts': () => (
      <TypedSection title={t('assessments.title')} mode="typewriter" intro={<p>{t('assessments.intro')}</p>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GridItem icon={Search} title={t('assessments.step1Title')} subtitle={t('assessments.step1Subtitle')} desc={t('assessments.step1Desc')} />
          <GridItem icon={ShieldCheck} title={t('assessments.step2Title')} subtitle={t('assessments.step2Subtitle')} desc={t('assessments.step2Desc')} />
          <GridItem icon={Users} title={t('assessments.step3Title')} subtitle={t('assessments.step3Subtitle')} desc={t('assessments.step3Desc')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GridItem icon={Calendar} title={t('assessments.step4Title')} subtitle={t('assessments.step4Subtitle')} desc={t('assessments.step4Desc')} />
          <GridItem icon={BarChart} title={t('assessments.step5Title')} subtitle={t('assessments.step5Subtitle')} desc={t('assessments.step5Desc')} />
        </div>
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
            <GridItem icon={ShieldCheck} title={t('incident.step1Title')} desc={t('incident.step1Desc')} />
            <GridItem icon={Eye} title={t('incident.step2Title')} desc={t('incident.step2Desc')} />
            <GridItem icon={AlertTriangle} title={t('incident.step3Title')} desc={t('incident.step3Desc')} />
            <GridItem icon={RefreshCw} title={t('incident.step4Title')} desc={t('incident.step4Desc')} />
            <GridItem icon={GraduationCap} title={t('incident.step5Title')} desc={t('incident.step5Desc')} />
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
            className="mt-3 inline-flex items-center gap-2 text-primary font-mono font-bold text-sm hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('incident.ctaButton')}
          </button>
        </Block>
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
            className="mt-3 inline-flex items-center gap-2 text-primary font-mono font-bold text-sm hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"
          >
            {t('cyberCrisis.ctaButton')}
          </button>
        </Block>
      </TypedSection>
    ),
    'arena-training': () => (
      <TypedSection title={t('arena.title')} mode="typewriter" intro={<p>{t('arena.intro')}</p>}>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GridItem icon={Target} title={t('arena.arenaTitle')} desc={t('arena.arenaDesc')} />
            <GridItem icon={Flag} title={t('arena.tiberTitle')} desc={t('arena.tiberDesc')} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('arena.methTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Gamepad2} title={t('arena.realisticTitle')} desc={t('arena.realisticDesc')} variant="highlight" />
            <GridItem icon={Crosshair} title={t('arena.handsOnTitle')} desc={t('arena.handsOnDesc')} variant="highlight" />
            <GridItem icon={Users} title={t('arena.teamTitle')} desc={t('arena.teamDesc')} variant="highlight" />
            <GridItem icon={CheckSquare} title={t('arena.regulatoryTitle')} desc={t('arena.regulatoryDesc')} variant="highlight" />
          </div>
        </Block>
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
        
        <CardBlock icon={Mic} title={t('events.moderationTitle')} desc={t('events.moderationDesc')} />
        <CardBlock icon={Users} title={t('events.workshopsTitle')} desc={t('events.workshopsDesc')} />
        <CardBlock icon={Award} title={t('events.referencesTitle')} desc={`${t('events.referencesIntro')}\n\n${t('events.referencesDesc')}`} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('events.eventTypesTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Presentation} title={t('events.conferences')} desc={t('events.conferencesDesc')} variant="highlight" />
            <GridItem icon={Wrench} title={t('events.workshops')} desc={t('events.workshopsDescShort')} variant="highlight" />
            <GridItem icon={GraduationCap} title={t('events.seminars')} desc={t('events.seminarsDesc')} variant="highlight" />
            <GridItem icon={ShieldCheck} title={t('events.isacaTitle')} desc={t('events.isacaDesc')} variant="highlight" href="https://www.isaca.de/seminare/seminare/seminare-f%C3%BCr-manager1/cyber-security-expert-20-04-2026.html" />
          </div>
        </Block>

        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <div className="text-center mb-4">
            <SubTitle variant="highlight">{t('events.evalTitle')}</SubTitle>
            <p className="text-foreground text-lg font-semibold font-sans mt-1">{t('events.evalCourse')}</p>
            <p className="text-foreground text-sm font-mono mt-0.5">{t('events.evalSubtitle')}</p>
            <p className="text-foreground/70 text-xs font-mono mt-1">{t('events.evalPeriod')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-foreground/80 text-xs font-mono uppercase tracking-widest mb-1">{t('events.evalSatisfaction')}</span>
              <span className="text-highlight text-4xl sm:text-3xl font-bold font-mono">94%</span>
            </div>
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-foreground/80 text-xs font-mono uppercase tracking-widest mb-1">{t('events.evalRecommendation')}</span>
              <span className="text-highlight text-4xl sm:text-3xl font-bold font-mono">93%</span>
              <span className="text-foreground/70 text-xs font-mono mt-1">{t('events.evalRecommendationSub')}</span>
            </div>
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-foreground/80 text-xs font-mono uppercase tracking-widest mb-1">{t('events.evalEmpfScore')}</span>
              <span className="text-primary text-4xl sm:text-3xl font-bold font-mono">87%</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {['evalQuote1', 'evalQuote2', 'evalQuote3'].map((key) => (
              <p key={key} className="text-foreground/80 text-sm italic leading-relaxed pl-3 border-l-2 border-highlight/30">
                {t(`events.${key}` as any)}
              </p>
            ))}
          </div>

          <p className="text-foreground text-xs font-mono text-center">{t('events.evalQuality')}</p>
        </Block>

        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <SubTitle>{t('events.upcomingTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <a href="https://www.isaca.de/seminare/seminare/seminare-f%C3%BCr-manager1/cyber-security-expert-20-04-2026.html" target="_blank" rel="noopener noreferrer" className="bg-primary/5 rounded-lg p-4 flex items-start gap-3 hover:bg-primary/10 transition-colors group">
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
          </div>
        </Block>

      </TypedSection>
      </>
    ),
    publications: () => (
      <TypedSection title={t('publications.title')} mode="typewriter" intro={<p>{t('publications.intro')}</p>}>
        <CardBlock icon={Shield} title={t('publications.pub1Title')} desc={t('publications.pub1Desc')} link="https://www.heise.de/select/ix/2021/10/2019809530193925811" linkLabel={t('publications.readOnHeise')} />
        <CardBlock icon={Radio} title={t('publications.pub2Title')} desc={t('publications.pub2Desc')} link="https://www.heise.de/select/ix/archiv/2015/7/seite-78" linkLabel={t('publications.readOnHeise')} />
        <CardBlock icon={Video} title={t('publications.pub3Title')} desc={t('publications.pub3Desc')} link="https://vimeo.com/295582173" linkLabel={t('publications.watchOnVimeo')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('publications.certTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Award} title={t('publications.isacaTitle')} desc={t('publications.isacaDesc')} variant="highlight" href="https://www.isaca.de/seminare/zertifikate/nationale-zertifikate/cyber-security-expert-cse.html" />
            <GridItem icon={Presentation} title={t('publications.confTitle')} desc={t('publications.confDesc')} variant="highlight" />
            <GridItem icon={BookOpen} title={t('publications.eduTitle')} desc={t('publications.eduDesc')} variant="highlight" />
          </div>
        </Block>
      </TypedSection>
    ),
    'virtual-ciso': () => (
      <TypedSection title={t('vciso.title')} mode="typewriter" intro={<p>{t('vciso.intro')}</p>}>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-foreground/90 text-sm md:text-[15px] font-sans leading-relaxed font-medium">{t('vciso.body1')}</p>
        </Block>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GridItem icon={Crown} title={t('vciso.label2')} desc={t('vciso.body2')} />
          <GridItem icon={Settings} title={t('vciso.label3')} desc={t('vciso.body3')} />
          <GridItem icon={CheckSquare} title={t('vciso.label4')} desc={t('vciso.body4')} />
        </div>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('vciso.modelTitle')}</SubTitle>
          <p className="text-foreground/80 text-sm md:text-[15px] font-sans leading-relaxed whitespace-pre-line mt-2">{t('vciso.modelDesc')}</p>
        </Block>
      </TypedSection>
    ),
    'ai-workflows': () => (
      <TypedSection title={t('aiWorkflows.title')} mode="typewriter" intro={<p>{t('aiWorkflows.intro')}</p>}>
        <Block className="bg-primary/5 border border-primary/20 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GridItem icon={Zap} title={t('aiWorkflows.irTitle')} desc={`${t('aiWorkflows.irDesc')}\n\n• ${t('aiWorkflows.irBullet1')}\n• ${t('aiWorkflows.irBullet2')}\n• ${t('aiWorkflows.irBullet3')}\n\n${t('aiWorkflows.irResult')}`} />
            <GridItem icon={FileText} title={t('aiWorkflows.policyTitle')} desc={`${t('aiWorkflows.policyDesc')}\n\n• ${t('aiWorkflows.policyBullet1')}\n• ${t('aiWorkflows.policyBullet2')}\n• ${t('aiWorkflows.policyBullet3')}\n\n${t('aiWorkflows.policyResult')}`} />
            <GridItem icon={Search} title={t('aiWorkflows.auditTitle')} desc={`${t('aiWorkflows.auditDesc')}\n\n• ${t('aiWorkflows.auditBullet1')}\n• ${t('aiWorkflows.auditBullet2')}\n• ${t('aiWorkflows.auditBullet3')}\n\n${t('aiWorkflows.auditResult')}`} />
          </div>
        </Block>
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">
            {t('aiWorkflows.tryAgentsTitle')}
          </SubTitle>
          <p className="text-foreground text-sm md:text-[15px] mb-3">
            {t('aiWorkflows.tryAgentsDesc')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onClick={() => setActive('crisis-sim')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <AlertTriangle size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('crisisSim.sidebarLabel')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentCrisisDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('stress-sim')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Bug size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.agentStressTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentStressDesc')}</p>
              </div>
            </button>
            <button onClick={() => setActive('ttx-check')} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <ClipboardList size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">ISCP Quick Check</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentTtxDesc')}</p>
              </div>
            </button>
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
            <button onClick={() => setYtDialogOpen(true)} className="flex items-start gap-3 p-3 rounded-lg border border-highlight/20 bg-highlight/5 hover:bg-highlight/10 hover:border-highlight/40 transition-electric text-left">
              <Play size={20} className="text-highlight mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-highlight font-semibold font-mono text-sm">{t('aiWorkflows.agentYtTitle')}</p>
                <p className="text-foreground/80 text-xs">{t('aiWorkflows.agentYtDesc')}</p>
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
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('aiWorkflows.ctaTitle')}</SubTitle>
          <p className="text-foreground whitespace-pre-line">{t('aiWorkflows.ctaDesc')}</p>
        </Block>
      </TypedSection>
    ),
    why: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle><Typewriter text={t('index.title')} /></SectionTitle>
          <p className="text-lg font-semibold mb-2">
            {(() => {
              const subtitle = t('index.subtitle');
              const match = subtitle.match(/(.*?)(Unerwartete|unexpected|l'inattendu|inattendu)(.*)/i);
              if (match) {
                return <><Typewriter text={match[1]} delay={1400} cursor={false} /><GlitchText>{match[2]}</GlitchText><Typewriter text={match[3]} delay={2200} /></>;
              }
              return <Typewriter text={subtitle} delay={1400} />;
            })()}
          </p>
        </Block>
        <StaggerReveal stagger={600} startDelay={3200}>
          <Block className="bg-primary/10 border-2 border-primary/30 rounded-xl">
            <p className="text-foreground mb-3">
              {t('index.card1').split(/<span>|<\/span>/).map((part, i) =>
                i % 2 === 1 ? <span key={i} className="text-primary font-semibold">{part}</span> : part
              )}
            </p>
            <ul className="list-disc list-inside text-foreground mb-3 space-y-1">
              {t('index.card1bullets').split('\n').map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <p className="text-primary font-semibold">{t('index.card1outro')}</p>
          </Block>
          <Block className="bg-primary/10 border-2 border-primary/30 rounded-xl">
            <p className="text-foreground mb-3">
              {t('index.card2').split(/<span>|<\/span>/).map((part, i) =>
                i % 2 === 1 ? <span key={i} className="text-primary font-semibold">{part}</span> : part
              )}
            </p>
            <ul className="list-disc list-inside text-foreground mb-3 space-y-1">
              {t('index.card2bullets').split('\n').map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <p className="text-primary font-semibold">{t('index.card2outro')}</p>
          </Block>
          <div className="grid grid-cols-3 gap-2">
            <StatBlock value="40+" label={t('index.trainingsDelivered')} />
            <StatBlock value="350+" label={t('index.peopleTrained')} />
            <StatBlock value="6" label={t('index.countriesCovered')} />
          </div>
          <Block className="bg-highlight/5 border-2 border-highlight/30 rounded-xl">
            <SubTitle variant="highlight">{t('index.techCheckTitle')}</SubTitle>
            <p className="text-sm font-sans leading-relaxed tracking-wide text-foreground mb-3">{t('index.techCheckDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InlineSystemCheck t={t} />
              <InlineConnectivityCheck t={t} language={language} />
            </div>
          </Block>
        </StaggerReveal>
      </div>
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
      const profiles = consultantProfiles.map((profile) => {
        const key = profile.name === 'Marcel Knop' ? 'marcel' : 'andreas';
        return {
          ...profile,
          sections: [
            { title: t(`profiles.${key}.eduTitle`), items: tArray(`profiles.${key}.edu`) },
            { title: t(`profiles.${key}.expTitle`), items: tArray(`profiles.${key}.exp`) },
            { title: t(`profiles.${key}.servTitle`), items: tArray(`profiles.${key}.serv`) },
            { title: t(`profiles.${key}.langTitle`), items: tArray(`profiles.${key}.lang`) },
          ],
        };
      });
      return (
        <TypedSection title={t('byWhom.title')} mode="typewriter" intro={<p>{t('byWhom.intro')}</p>}>
          {profiles.map(p => (
            <Block key={p.name} className="bg-secondary/30">
              <div className="flex items-start gap-4 mb-4">
                <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 shadow-lg" />
                <div>
                  <p className="text-primary font-bold text-base font-sans">{p.name}</p>
                  <p className="text-foreground text-sm md:text-[15px] font-sans mb-1">{p.role}</p>
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
        </TypedSection>
      );
    },
    contact: () => (
      <TypedSection title={t('contact.title')} mode="typewriter" charDelay={8} intro={<p>{t('contact.intro')}</p>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-primary" />
              <SubTitle>{t('contact.phone')}</SubTitle>
            </div>
            <a href="tel:+4915205691648" className="text-foreground text-sm md:text-[15px] font-sans hover:text-highlight transition-electric">+49 1520 569 1648</a>
          </div>
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-primary" />
              <SubTitle>{t('contact.email')}</SubTitle>
            </div>
            <a href="mailto:marcel@inside-the-box.org" className="text-foreground text-sm md:text-[15px] font-sans hover:text-highlight transition-electric">marcel@inside-the-box.org</a>
          </div>
        </div>
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
        <CardBlock icon={FileText} title={t('imprint.copyright')} desc={t('imprint.copyrightText')} variant="highlight" />
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

interface SidebarItem { id: string; icon: LucideIcon; label: string; }
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
            <span className="truncate font-rounded text-base">{item.label}</span>
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
        { id: 'ai-workflows', icon: Zap, label: t('nav.aiWorkflows') },
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
  const sidebarGroups = useSidebarGroups();
  const [activeService, setActiveService] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarInitialized, setSidebarInitialized] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const crisisRef = useRef<CrisisSimulatorHandle>(null);
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

  const serviceContent = activeService === 'crisis-sim'
    ? <CyberCrisisSimulator embedded ref={crisisRef} />
    : activeService === 'dora-check'
    ? <DoraIncidentReporter embedded />
    : activeService === 'stress-sim'
    ? <ArtificialStressSimulator embedded />
    : activeService === 'tisax-check'
    ? <TisaxAssessmentClassifier embedded />
    : activeService === 'pci-check'
    ? <PciDssSaqNavigator embedded />
    : activeService === 'ttx-check'
    ? <IspcTtxPrioritizer embedded />
    : activeService === 'nis2-quiz'
    ? <Nis2AwarenessQuiz embedded />
    : activeService === 'ciso-sim'
    ? <CisoSimulator embedded />
    : activeService === 'threatdrop'
    ? <ThreatDropQuiz embedded />
    : activeService === 'trigger-triage'
    ? <TriggerTriage embedded />
    : activeService === 'cyber-frogger'
    ? <CyberFrogger embedded />
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
              <button onClick={() => { setActiveService(null); setMessages([]); setSidebarOpen(false); }} className="flex items-center gap-2 text-sm font-rounded font-bold text-primary hover:text-highlight transition-electric cursor-pointer bg-transparent border-none p-0"><GeometricSymbol size="xs" />inside-the-box.org</button>
              <button onClick={() => setSidebarOpen(false)} className="ml-2 p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-electric">
                <X size={18} />
              </button>
            </div>
            <SidebarItems groups={sidebarGroups} activeId={activeService} onSelect={selectService} />
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

        <div ref={contentAreaRef} className="flex-1 overflow-y-auto relative">
          {!activeService && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4" style={{ gap: 0 }}>
              <button onClick={() => setSidebarOpen(true)} className="mb-8 cursor-pointer bg-transparent border-none p-0 transition-electric group/welcome">
                <GeometricSymbol size="sm" className="w-16 h-16 opacity-60 group-hover/welcome:opacity-100 transition-electric" hoverCyan />
              </button>
              {/* Brand name */}
              <button onClick={() => setSidebarOpen(true)} className="cursor-pointer bg-transparent border-none p-0 transition-electric" style={{ marginBottom: '40px' }}>
                <h1 className="font-mono font-bold text-accent hover:text-highlight text-center transition-electric" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', letterSpacing: '-0.01em' }}>
                  <Typewriter text={t('welcome.title')} charDelay={60} />
                </h1>
              </button>
              {/* Animated hero content */}
              <div className="flex flex-col items-center w-full">
                {/* Claim – scramble decode reveal */}
                <button onClick={() => setSidebarOpen(true)} className="cursor-pointer bg-transparent border-none p-0 w-full text-center transition-electric" style={{ marginBottom: '32px' }}>
                  <p className="font-mono font-semibold text-center uppercase" style={{ fontSize: 'clamp(0.85rem, 2.8vw, 1.25rem)', letterSpacing: '0.12em', color: '#ffffff' }}>
                    <Typewriter text={t('welcome.heroClaim')} mode="scramble" delay={2200} charDelay={18} cursor={false} onDone={() => setClaimDone(true)} />
                  </p>
                </button>
                {/* Subtitle & Signature – fade in after claim */}
                <div
                  className="flex flex-col items-center w-full"
                  style={{
                    opacity: claimDone ? 1 : 0,
                    transform: claimDone ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 600ms ease-out, transform 600ms ease-out',
                  }}
                >
                  <button onClick={() => setSidebarOpen(true)} className="cursor-pointer bg-transparent border-none p-0 w-full text-center transition-electric" style={{ marginBottom: '16px' }}>
                    <p className="font-mono text-center" style={{ fontSize: 'clamp(0.85rem, 2vw, 1.0rem)', letterSpacing: '0.02em', color: 'rgba(255,255,255,0.72)' }}>
                      {t('welcome.heroSubtitle')}
                    </p>
                  </button>
                  <button onClick={() => setSidebarOpen(true)} className="cursor-pointer bg-transparent border-none p-0 w-full text-center transition-electric">
                    <p className="font-mono text-center" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.88rem)', letterSpacing: '0.02em', color: 'rgba(255,255,255,0.58)' }}>
                      {t('welcome.heroSignature')}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full px-3 md:px-6 lg:px-10 py-4 md:py-6 space-y-4">
              {serviceContent && (() => {
                if (activeService === 'crisis-sim' || activeService === 'stress-sim') {
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

        {/* Input - desktop: always show (except service on mobile). Mobile welcome: show floating button, expand on click */}
        {(() => {
          const isTouchDevice = isMobile || isTablet;
          // On touch devices: show FAB unless user explicitly opened chat; hide completely on service pages (except crisis-sim)
          if (isTouchDevice && !!activeService && activeService !== 'crisis-sim' && activeService !== 'stress-sim') return null;
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
                    className="flex-1 bg-transparent px-3 md:px-4 py-2 text-base md:text-sm font-mono text-foreground placeholder:text-highlight/50 resize-none focus:outline-none max-h-[120px]"
                    disabled={isLoading || (activeService === 'crisis-sim' && crisisRef.current?.isLoading())}
                  />
                  <button onClick={handleSend} disabled={!input.trim() || isLoading || (activeService === 'crisis-sim' && crisisRef.current?.isLoading())} className="m-1 p-1.5 rounded-lg bg-highlight text-highlight-foreground disabled:opacity-30 hover:bg-highlight/80 transition-electric">
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
