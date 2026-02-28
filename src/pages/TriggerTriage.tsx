import { useRef, useEffect, useCallback, useState } from 'react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';

/* ══════════════════════════════════════
   I18N
   ══════════════════════════════════════ */
const TT = {
  en: {
    title: '🎯 TRIGGER TRIAGE', subtitle: 'INCIDENT PRIORITY SHOOTING RANGE',
    howTo: '🎯 HOW TO PLAY',
    howToLines: ['1.  Read the incident report above', '2.  Judge: How critical is it?', '3.  Shoot the matching priority target!', '', 'You have 10 seconds per incident.', 'Faster = more points. 3 lives.'],
    controls: 'KEYS 1-5 TO SHOOT  |  SPACE TO START',
    tapStart: '▶ TAP TO START', pressSpace: '▶ PRESS SPACE',
    rangeClosed: 'RANGE CLOSED', finalScore: 'FINAL SCORE',
    correct: 'CORRECT', wrong: 'WRONG', accuracy: 'ACCURACY',
    bestStreak: 'BEST STREAK', best: 'BEST',
    tapRestart: '▶ TAP TO RETRY', restart: '▶ SPACE / R TO RETRY',
    shootPrompt: '▼  SHOOT THE CORRECT PRIORITY  ▼',
    incidentReport: '📋 INCIDENT REPORT',
    round: 'ROUND',
    ratings: ['🔰 Rookie', '📋 Needs Practice', '🎯 On Target', '⭐ Senior Responder', '🏆 Expert Analyst'],
    prioHints: ['Everything down', 'Major impact', 'Limited impact', 'Minor issue', 'No action needed'],
  },
  de: {
    title: '🎯 TRIGGER TRIAGE', subtitle: 'INCIDENT PRIORITÄTS-SCHIEßSTAND',
    howTo: '🎯 SO GEHT\'S',
    howToLines: ['1.  Incident-Meldung oben lesen', '2.  Einschätzen: Wie kritisch?', '3.  Auf die richtige Priorität schießen!', '', '10 Sekunden pro Incident.', 'Schneller = mehr Punkte. 3 Leben.'],
    controls: 'TASTEN 1-5 SCHIEßEN  |  LEERTASTE START',
    tapStart: '▶ TIPPEN ZUM START', pressSpace: '▶ LEERTASTE',
    rangeClosed: 'STAND GESCHLOSSEN', finalScore: 'ENDERGEBNIS',
    correct: 'RICHTIG', wrong: 'FALSCH', accuracy: 'TREFFERQUOTE',
    bestStreak: 'BESTE SERIE', best: 'REKORD',
    tapRestart: '▶ TIPPEN FÜR NEUSTART', restart: '▶ LEERTASTE / R',
    shootPrompt: '▼  RICHTIGE PRIORITÄT SCHIEßEN  ▼',
    incidentReport: '📋 INCIDENT-MELDUNG',
    round: 'RUNDE',
    ratings: ['🔰 Anfänger', '📋 Übung nötig', '🎯 Auf Kurs', '⭐ Senior Analyst', '🏆 Experte'],
    prioHints: ['Totalausfall', 'Großer Impact', 'Begrenzter Impact', 'Geringes Risiko', 'Kein Handlungsbedarf'],
  },
  fr: {
    title: '🎯 TRIGGER TRIAGE', subtitle: 'STAND DE TIR PRIORITÉ INCIDENTS',
    howTo: '🎯 COMMENT JOUER',
    howToLines: ['1.  Lire le rapport d\'incident', '2.  Évaluer : quelle criticité ?', '3.  Tirer sur la bonne priorité !', '', '10 secondes par incident.', 'Plus vite = plus de points. 3 vies.'],
    controls: 'TOUCHES 1-5 TIRER  |  ESPACE DÉMARRER',
    tapStart: '▶ APPUYER POUR DÉMARRER', pressSpace: '▶ APPUYER ESPACE',
    rangeClosed: 'STAND FERMÉ', finalScore: 'SCORE FINAL',
    correct: 'CORRECT', wrong: 'FAUX', accuracy: 'PRÉCISION',
    bestStreak: 'MEILLEURE SÉRIE', best: 'RECORD',
    tapRestart: '▶ APPUYER POUR REJOUER', restart: '▶ ESPACE / R',
    shootPrompt: '▼  TIRER SUR LA BONNE PRIORITÉ  ▼',
    incidentReport: '📋 RAPPORT D\'INCIDENT',
    round: 'TOUR',
    ratings: ['🔰 Débutant', '📋 À améliorer', '🎯 En bonne voie', '⭐ Analyste confirmé', '🏆 Expert'],
    prioHints: ['Panne totale', 'Impact majeur', 'Impact limité', 'Problème mineur', 'Aucune action requise'],
  },
};

/* ══════════════════════════════════════
   COLORS
   ══════════════════════════════════════ */
const C = {
  bg: '#0a0c12',
  red: '#ff3b3b',
  orange: '#ff8c1a',
  yellow: '#ffd000',
  green: '#22dd66',
  blue: '#2299ff',
  cyan: '#00e5ff',
  white: '#f0f0f0',
  dim: 'rgba(255,255,255,0.3)',
  muzzle: '#ffcc44',
};

/* ══════════════════════════════════════
   PRIORITY LEVELS
   ══════════════════════════════════════ */
const PRIOS = [
  { id: 1, name: 'CRITICAL', short: 'P1', color: C.red,    icon: '🔥', hint: 'Everything down' },
  { id: 2, name: 'HIGH',     short: 'P2', color: C.orange, icon: '⚠️', hint: 'Major impact' },
  { id: 3, name: 'MEDIUM',   short: 'P3', color: C.yellow, icon: '⚡', hint: 'Limited impact' },
  { id: 4, name: 'LOW',      short: 'P4', color: C.green,  icon: '📋', hint: 'Minor issue' },
  { id: 5, name: 'INFO',     short: 'P5', color: C.blue,   icon: 'ℹ️', hint: 'No action needed' },
];

/* ══════════════════════════════════════
   INCIDENTS
   ══════════════════════════════════════ */
interface Incident {
  text: string;
  detail: string;
  prio: number;
}

const INCIDENTS: Incident[] = [
  // P1 CRITICAL
  { text: 'Ransomware encrypting production servers',            detail: 'All customer-facing services down. Encryption spreading to backup systems.', prio: 0 },
  { text: 'Active data exfiltration detected',                   detail: 'Outbound transfer of 50GB customer PII to unknown IP. Still ongoing.', prio: 0 },
  { text: 'Core banking system completely unresponsive',          detail: 'Zero transactions processing. 200K customers affected. No failover.', prio: 0 },
  { text: 'Attacker has domain admin access',                    detail: 'Golden Ticket detected. Full AD compromise. Lateral movement active.', prio: 0 },
  { text: 'Payment processing system breached',                  detail: 'Credit card data actively being siphoned. PCI scope compromised.', prio: 0 },
  { text: 'Complete network outage across all sites',             detail: 'Core routers wiped. No connectivity between offices or data centers.', prio: 0 },

  // P2 HIGH
  { text: 'VPN gateway compromised',                             detail: 'Unauthorized access via VPN. 30 sessions hijacked. Remote workers affected.', prio: 1 },
  { text: 'Email server delivering phishing to customers',       detail: 'Compromised mail relay sending malware to customer list. 5K sent.', prio: 1 },
  { text: 'Database replication lag causing data loss risk',      detail: 'Primary DB 45min ahead of replica. If primary fails, data loss.', prio: 1 },
  { text: 'Privilege escalation exploit on web server',          detail: 'Attacker gained root on web-01. Not yet spread. Customer data at risk.', prio: 1 },
  { text: 'DDoS attack degrading main website',                  detail: '70% packet loss on main site. CDN partially mitigating. Sales impacted.', prio: 1 },
  { text: 'Insider deleting files from shared drives',           detail: 'Terminated employee still has access. Deleting files systematically.', prio: 1 },

  // P3 MEDIUM
  { text: 'Phishing campaign targeting employees',               detail: '12 employees clicked link. No credentials entered yet. Alert sent.', prio: 2 },
  { text: 'Single workstation infected with adware',             detail: 'Marketing laptop showing pop-ups. No spread. User isolated.', prio: 2 },
  { text: 'Expired SSL certificate on internal portal',          detail: 'HR portal certificate warning. Internal users only. Workaround exists.', prio: 2 },
  { text: 'Brute-force attempts on staging server',              detail: 'Automated attempts from single IP. Account lockout working. No breach.', prio: 2 },
  { text: 'Unpatched Apache on dev server found',                detail: 'CVE found on internal dev server. Not internet-facing. Patch available.', prio: 2 },
  { text: 'USB policy violation detected',                       detail: 'Employee plugged personal USB. DLP blocked transfer. Quarantined.', prio: 2 },

  // P4 LOW
  { text: 'Password rotation reminder overdue',                  detail: 'Service account password 10 days past policy. No compromise signs.', prio: 3 },
  { text: 'Minor UI bug in admin dashboard',                     detail: 'Chart labels overlapping on one page. Functionality unaffected.', prio: 3 },
  { text: 'Test environment DNS misconfiguration',               detail: 'Dev team can\'t resolve test domains. Production unaffected.', prio: 3 },
  { text: 'Old firewall rules need cleanup',                     detail: '15 unused rules from old project. No security risk, just housekeeping.', prio: 3 },
  { text: 'Guest network printer offline',                       detail: 'Conference room printer not responding. Lobby printer available.', prio: 3 },
  { text: 'Antivirus license renewal in 30 days',                detail: 'Auto-renewal configured. No action required now.', prio: 3 },

  // P5 INFO
  { text: 'Monthly vulnerability report ready',                  detail: 'Scheduled scan completed. Report ready for review. No critical findings.', prio: 4 },
  { text: 'New security training module published',              detail: 'Q2 training live. Employees have 30 days to complete.', prio: 4 },
  { text: 'Routine firmware update available',                   detail: 'Switch firmware v3.2.1. Bug fixes only, no security patches.', prio: 4 },
  { text: 'IT asset inventory audit completed',                  detail: 'All assets accounted for. 3 laptops need label updates.', prio: 4 },
  { text: 'Security standup notes shared',                       detail: 'Meeting minutes distributed. No action items for your team.', prio: 4 },
  { text: 'ISO 27001 documentation updated',                     detail: 'Annual review completed. Minor wording changes only.', prio: 4 },
];

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface BulletHole { x: number; y: number; life: number; }
interface MuzzleFlash { x: number; y: number; life: number; }

interface GS {
  phase: 'start' | 'play' | 'result' | 'over';
  currentIncident: Incident | null;
  incidentIdx: number;
  timer: number;
  maxTime: number;
  score: number;
  streak: number;
  bestStreak: number;
  round: number;
  maxRounds: number;
  correct: number;
  wrong: number;
  lives: number;
  particles: Particle[];
  bulletHoles: BulletHole[];
  muzzleFlash: MuzzleFlash | null;
  lastResult: 'correct' | 'wrong' | 'timeout' | null;
  lastCorrectPrio: number;
  resultTimer: number;
  shakeT: number;
  hi: number;
  usedIncidents: number[];
  hoverTarget: number; // which target mouse is hovering (-1 = none)
}

/* ══════════════════════════════════════
   AUDIO
   ══════════════════════════════════════ */
const tone = (ctx: AudioContext, freq: number, dur: number, type: OscillatorType = 'square', vol = 0.1) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
};

const sfxShoot = (ctx: AudioContext) => {
  const bufferSize = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  const noise = ctx.createBufferSource(); noise.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 2500;
  noise.connect(filter); filter.connect(g); g.connect(ctx.destination);
  noise.start();
  tone(ctx, 80, 0.12, 'sine', 0.18);
};

const sfxHit = (ctx: AudioContext) => {
  // Satisfying "ding!" for correct
  tone(ctx, 880, 0.08, 'square', 0.1);
  setTimeout(() => tone(ctx, 1320, 0.08, 'sine', 0.08), 40);
  setTimeout(() => tone(ctx, 1760, 0.12, 'sine', 0.06), 80);
};
const sfxMiss = (ctx: AudioContext) => {
  // Buzzer
  tone(ctx, 120, 0.3, 'sawtooth', 0.12);
  tone(ctx, 100, 0.3, 'square', 0.06);
};
const sfxTimeout = (ctx: AudioContext) => {
  tone(ctx, 300, 0.12, 'square', 0.08);
  setTimeout(() => tone(ctx, 200, 0.2, 'sawtooth', 0.06), 100);
};
const sfxNewRound = (ctx: AudioContext) => {
  // Short "ready" chime
  tone(ctx, 660, 0.06, 'sine', 0.08);
  setTimeout(() => tone(ctx, 880, 0.1, 'sine', 0.1), 60);
};
const sfxGameOver = (ctx: AudioContext) => {
  tone(ctx, 440, 0.2, 'square', 0.08);
  setTimeout(() => tone(ctx, 330, 0.25, 'sawtooth', 0.06), 180);
  setTimeout(() => tone(ctx, 220, 0.4, 'sawtooth', 0.05), 360);
};
const sfxTick = (ctx: AudioContext) => { tone(ctx, 1000, 0.02, 'sine', 0.04); };

// BG Music – tense, driving synth
interface BGMusic { running: boolean; timers: ReturnType<typeof setInterval>[]; step: number; gain: GainNode; }
const BASS_LINE = [110, 110, 147, 147, 131, 131, 165, 165];
const LEAD_LINE = [330, 392, 440, 392, 330, 294, 262, 294, 440, 494, 523, 494, 440, 392, 330, 392];
const startBGMusic = (ctx: AudioContext): BGMusic => {
  const gain = ctx.createGain(); gain.gain.value = 0.06; gain.connect(ctx.destination);
  const bg: BGMusic = { running: true, timers: [], step: 0, gain };

  // Driving bass pulse
  bg.timers.push(setInterval(() => {
    if (!bg.running) return;
    const freq = BASS_LINE[bg.step % BASS_LINE.length];
    const osc = ctx.createOscillator(); const ng = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = freq;
    ng.gain.setValueAtTime(0.15, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(ng); ng.connect(bg.gain); osc.start(); osc.stop(ctx.currentTime + 0.14);
  }, 200));

  // Lead arpeggio
  bg.timers.push(setInterval(() => {
    if (!bg.running) return;
    const freq = LEAD_LINE[bg.step % LEAD_LINE.length];
    const osc = ctx.createOscillator(); const ng = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = freq;
    ng.gain.setValueAtTime(0.06, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(ng); ng.connect(bg.gain); osc.start(); osc.stop(ctx.currentTime + 0.12);
    bg.step++;
  }, 200));

  return bg;
};
const stopBGMusic = (bg: BGMusic | null) => { if (!bg) return; bg.running = false; bg.timers.forEach(t => clearInterval(t)); };

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
const HI_KEY = 'triggertriage-hi';
const getHi = () => { try { return +(localStorage.getItem(HI_KEY) || 0); } catch { return 0; } };
const saveHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HI_KEY, '' + s); } catch {} };

const pickIncident = (used: number[]): { incident: Incident; idx: number } => {
  const available = INCIDENTS.map((inc, i) => ({ inc, i })).filter(x => !used.includes(x.i));
  const pool = available.length > 0 ? available : INCIDENTS.map((inc, i) => ({ inc, i }));
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { incident: pick.inc, idx: pick.i };
};

const mkGS = (): GS => ({
  phase: 'start', currentIncident: null, incidentIdx: -1,
  timer: 0, maxTime: 10,
  score: 0, streak: 0, bestStreak: 0, round: 0, maxRounds: 15,
  correct: 0, wrong: 0, lives: 3,
  particles: [], bulletHoles: [], muzzleFlash: null,
  lastResult: null, lastCorrectPrio: -1, resultTimer: 0,
  shakeT: 0, hi: getHi(), usedIncidents: [], hoverTarget: -1,
});

const rRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
};

/* Word wrap helper */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line); line = word;
    } else { line = test; }
  }
  if (line) lines.push(line);
  return lines;
};

/* Target geometry – BIGGER targets, clear spacing */
const getTargets = (w: number, h: number) => {
  const targetY = h * 0.62;
  const radius = Math.min(w / 10, 52);
  const totalW = 5 * radius * 2 + 4 * 12; // targets + gaps
  const startX = (w - totalW) / 2 + radius;
  return PRIOS.map((_, i) => ({
    x: startX + i * (radius * 2 + 12),
    y: targetY,
    r: radius,
  }));
};

/* ══════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════ */
const TriggerTriage = ({ embedded }: { embedded?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gs = useRef<GS>(mkGS());
  const animRef = useRef(0);
  const lastT = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const audioRef = useRef<AudioContext | null>(null);
  const bgRef = useRef<BGMusic | null>(null);
  const [, forceRender] = useState(0);
  const lastTickRef = useRef(0);
  const { language } = useLanguage();
  const langRef = useRef(language);
  langRef.current = language;
  

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) { try { audioRef.current = new AudioContext(); } catch {} }
    return audioRef.current;
  }, []);

  const nextRound = useCallback(() => {
    const g = gs.current;
    if (g.round >= g.maxRounds || g.lives <= 0) {
      g.phase = 'over';
      saveHi(g.score); g.hi = Math.max(g.hi, g.score);
      const ac = audioRef.current;
      if (ac) sfxGameOver(ac);
      stopBGMusic(bgRef.current); bgRef.current = null;
      return;
    }
    const { incident, idx } = pickIncident(g.usedIncidents);
    g.currentIncident = incident;
    g.incidentIdx = idx;
    g.usedIncidents.push(idx);
    g.timer = g.maxTime;
    g.round++;
    g.lastResult = null;
    g.bulletHoles = [];
    g.phase = 'play';
    lastTickRef.current = Math.ceil(g.maxTime);
    const ac = audioRef.current;
    if (ac) sfxNewRound(ac);
  }, []);

  const startGame = useCallback(() => {
    gs.current = { ...mkGS(), phase: 'play' };
    gs.current.hi = getHi();
    const ac = ensureAudio();
    if (ac) {
      sfxNewRound(ac);
      stopBGMusic(bgRef.current);
      bgRef.current = startBGMusic(ac);
    }
    nextRound();
  }, [ensureAudio, nextRound]);

  const shoot = useCallback((targetIdx: number) => {
    const g = gs.current;
    if (g.phase !== 'play' || !g.currentIncident) return;
    const { w, h } = sizeRef.current;
    const targets = getTargets(w, h);
    const target = targets[targetIdx];
    const ac = audioRef.current;

    g.muzzleFlash = { x: target.x, y: h - 20, life: 0.15 };
    if (ac) sfxShoot(ac);
    g.bulletHoles.push({ x: target.x + (Math.random() - 0.5) * target.r * 0.4, y: target.y + (Math.random() - 0.5) * target.r * 0.4, life: 1.5 });

    if (targetIdx === g.currentIncident.prio) {
      g.lastResult = 'correct';
      g.lastCorrectPrio = g.currentIncident.prio;
      const timeBonus = Math.floor(g.timer * 20);
      const streakBonus = g.streak * 25;
      g.score += 100 + timeBonus + streakBonus;
      g.streak++; g.bestStreak = Math.max(g.bestStreak, g.streak);
      g.correct++;
      for (let i = 0; i < 30; i++) {
        const a = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
        const s = 120 + Math.random() * 180;
        g.particles.push({ x: target.x, y: target.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.3, color: PRIOS[targetIdx].color, size: 2 + Math.random() * 4 });
      }
      if (ac) setTimeout(() => sfxHit(ac), 60);
    } else {
      g.lastResult = 'wrong';
      g.lastCorrectPrio = g.currentIncident.prio;
      g.streak = 0; g.wrong++; g.lives--;
      g.shakeT = 0.35;
      if (ac) setTimeout(() => sfxMiss(ac), 60);
      if (g.lives <= 0) {
        g.phase = 'over';
        saveHi(g.score); g.hi = Math.max(g.hi, g.score);
        if (ac) sfxGameOver(ac);
        stopBGMusic(bgRef.current); bgRef.current = null;
        return;
      }
    }
    g.resultTimer = 2.0;
    g.phase = 'result';
  }, []);

  useEffect(() => { return () => stopBGMusic(bgRef.current); }, []);

  /* Resize */
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current, ct = containerRef.current;
      if (!c || !ct) return;
      const r = ct.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr; c.height = r.height * dpr;
      c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
      sizeRef.current = { w: r.width, h: r.height };
    };
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gs.current;
      if (g.phase === 'start' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'over' && (e.key === 'r' || e.key === 'R' || e.key === ' ')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'play') {
        if (e.key >= '1' && e.key <= '5') { e.preventDefault(); shoot(+e.key - 1); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame, shoot]);

  /* Mouse / Touch – bigger hit areas */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const handle = (cx: number, cy: number) => {
      const g = gs.current;
      if (g.phase === 'start' || g.phase === 'over') { startGame(); return; }
      if (g.phase !== 'play') return;
      const { w, h } = sizeRef.current;
      const targets = getTargets(w, h);
      // Also accept clicks on the label area below targets
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const dx = cx - t.x;
        const inXRange = Math.abs(dx) < t.r + 15;
        const inYRange = cy > t.y - t.r - 15 && cy < t.y + t.r + 70;
        if (inXRange && inYRange) { shoot(i); return; }
      }
    };
    // Hover tracking
    const onMove = (e: MouseEvent) => {
      const g = gs.current;
      const r = c.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      const { w, h } = sizeRef.current;
      const targets = getTargets(w, h);
      g.hoverTarget = -1;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (Math.abs(cx - t.x) < t.r + 15 && cy > t.y - t.r - 15 && cy < t.y + t.r + 70) {
          g.hoverTarget = i; break;
        }
      }
      c.style.cursor = g.hoverTarget >= 0 && g.phase === 'play' ? 'crosshair' : 'default';
    };
    const onClick = (e: MouseEvent) => { const r = c.getBoundingClientRect(); handle(e.clientX - r.left, e.clientY - r.top); };
    const onTouch = (e: TouchEvent) => { e.preventDefault(); const r = c.getBoundingClientRect(); const t = e.touches[0]; handle(t.clientX - r.left, t.clientY - r.top); };
    c.addEventListener('mousemove', onMove);
    c.addEventListener('mousedown', onClick);
    c.addEventListener('touchstart', onTouch, { passive: false });
    return () => { c.removeEventListener('mousemove', onMove); c.removeEventListener('mousedown', onClick); c.removeEventListener('touchstart', onTouch); };
  }, [startGame, shoot]);

  /* ══════════════ GAME LOOP ══════════════ */
  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;
      const g = gs.current;
      const { w, h } = sizeRef.current;
      if (w === 0) { animRef.current = requestAnimationFrame(loop); return; }
      const ac = audioRef.current;
      const lang = langRef.current as 'en' | 'de' | 'fr';
      const txt = TT[lang];
      const ac = audioRef.current;

      /* ── UPDATE ── */
      if (g.phase === 'play') {
        g.timer -= dt;
        // Tick sound for last 3 seconds
        const sec = Math.ceil(g.timer);
        if (sec <= 3 && sec > 0 && sec < lastTickRef.current) {
          lastTickRef.current = sec;
          if (ac) sfxTick(ac);
        }
        if (g.timer <= 0) {
          g.lastResult = 'timeout';
          g.lastCorrectPrio = g.currentIncident?.prio ?? 0;
          g.streak = 0; g.wrong++; g.lives--;
          g.shakeT = 0.3;
          if (ac) sfxTimeout(ac);
          if (g.lives <= 0) {
            g.phase = 'over'; saveHi(g.score); g.hi = Math.max(g.hi, g.score);
            if (ac) sfxGameOver(ac);
            stopBGMusic(bgRef.current); bgRef.current = null;
          } else {
            g.resultTimer = 2.0; g.phase = 'result';
          }
        }
      }

      if (g.phase === 'result') {
        g.resultTimer -= dt;
        if (g.resultTimer <= 0) nextRound();
      }

      for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 300 * dt; }
      g.particles = g.particles.filter(p => p.life > 0);
      for (const b of g.bulletHoles) b.life -= dt;
      g.bulletHoles = g.bulletHoles.filter(b => b.life > 0);
      if (g.muzzleFlash) { g.muzzleFlash.life -= dt; if (g.muzzleFlash.life <= 0) g.muzzleFlash = null; }
      g.shakeT = Math.max(0, g.shakeT - dt);

      /* ── DRAW ── */
      const cv = canvasRef.current;
      if (!cv) { animRef.current = requestAnimationFrame(loop); return; }
      const ctx = cv.getContext('2d');
      if (!ctx) { animRef.current = requestAnimationFrame(loop); return; }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (g.shakeT > 0) { const i = g.shakeT * 14; ctx.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i); }

      // ── Background ──
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
      wallGrad.addColorStop(0, '#0c0e16');
      wallGrad.addColorStop(0.4, '#111420');
      wallGrad.addColorStop(1, '#08090e');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      const targets = getTargets(w, h);

      // ── TITLE BAR (always visible during play) ──
      if (g.phase === 'play' || g.phase === 'result') {
        // Top bar background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, w, 42);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 42); ctx.lineTo(w, 42); ctx.stroke();

        // Title left
        ctx.textAlign = 'left';
        ctx.font = 'bold 12px monospace'; ctx.fillStyle = C.red;
        ctx.fillText('🎯 TRIGGER TRIAGE', 12, 16);
        ctx.font = '9px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText('ROUND ' + g.round + '/' + g.maxRounds, 12, 32);

        // Score center
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px monospace'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, w / 2, 20);
        if (g.streak > 1) {
          ctx.font = '10px monospace'; ctx.fillStyle = C.cyan;
          ctx.fillText(g.streak + '× STREAK', w / 2, 34);
        }

        // Lives right
        ctx.textAlign = 'right';
        for (let i = 0; i < 3; i++) {
          ctx.font = '16px monospace';
          ctx.fillStyle = i < g.lives ? C.red : 'rgba(255,255,255,0.1)';
          ctx.fillText('♥', w - 14 - (2 - i) * 22, 22);
        }
      }

      // ── INCIDENT CARD ──
      if ((g.phase === 'play' || g.phase === 'result') && g.currentIncident) {
        const cardW = Math.min(w - 30, 500);
        const cardX = (w - cardW) / 2;
        const cardY = 54;

        // Measure content height dynamically
        ctx.font = 'bold 14px monospace';
        const titleLines = wrapText(ctx, g.currentIncident.text, cardW - 40);
        ctx.font = '11px monospace';
        const detailLines = wrapText(ctx, g.currentIncident.detail, cardW - 40);
        const cardH = 24 + titleLines.length * 20 + 8 + detailLines.length * 16 + 20;

        // Card background with glow
        ctx.shadowColor = g.phase === 'result'
          ? (g.lastResult === 'correct' ? C.green : C.red)
          : 'rgba(0,200,255,0.15)';
        ctx.shadowBlur = g.phase === 'result' ? 20 : 8;
        ctx.fillStyle = '#131724ee';
        rRect(ctx, cardX, cardY, cardW, cardH, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Card border
        const borderColor = g.phase === 'result'
          ? (g.lastResult === 'correct' ? C.green : C.red)
          : 'rgba(255,255,255,0.12)';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = g.phase === 'result' ? 2 : 1;
        rRect(ctx, cardX, cardY, cardW, cardH, 12);
        ctx.stroke();

        // "INCIDENT REPORT" label
        ctx.textAlign = 'left';
        ctx.font = '8px monospace'; ctx.fillStyle = C.cyan + '80';
        ctx.fillText('📋 INCIDENT REPORT', cardX + 16, cardY + 16);

        // Title
        ctx.font = 'bold 14px monospace'; ctx.fillStyle = C.white;
        ctx.textAlign = 'center';
        for (let i = 0; i < titleLines.length; i++) {
          ctx.fillText(titleLines[i], w / 2, cardY + 34 + i * 20);
        }

        // Detail
        ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        const detailStartY = cardY + 34 + titleLines.length * 20 + 8;
        for (let i = 0; i < detailLines.length; i++) {
          ctx.fillText(detailLines[i], w / 2, detailStartY + i * 16);
        }

        // Timer bar (prominent)
        if (g.phase === 'play') {
          const barW = cardW - 24;
          const barX = cardX + 12;
          const barY = cardY + cardH - 10;
          const pct = Math.max(0, g.timer / g.maxTime);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          rRect(ctx, barX, barY, barW, 6, 3); ctx.fill();
          const barColor = pct > 0.4 ? C.cyan : (pct > 0.2 ? C.orange : C.red);
          ctx.fillStyle = barColor;
          rRect(ctx, barX, barY, barW * pct, 6, 3); ctx.fill();

          // Timer number
          ctx.textAlign = 'right';
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = barColor;
          ctx.fillText(Math.ceil(g.timer) + 's', cardX + cardW - 16, cardY + cardH - 16);
        }

        // Instruction arrow
        if (g.phase === 'play') {
          const arrowY = cardY + cardH + 16;
          ctx.textAlign = 'center';
          ctx.font = '10px monospace'; ctx.fillStyle = C.dim;
          const pulse = 0.5 + Math.sin(now * 0.006) * 0.5;
          ctx.globalAlpha = 0.4 + pulse * 0.4;
          ctx.fillText('▼  SHOOT THE CORRECT PRIORITY  ▼', w / 2, arrowY);
          ctx.globalAlpha = 1;
        }

        // Result feedback
        if (g.phase === 'result' && g.lastResult) {
          const fbY = cardY + cardH + 18;
          ctx.textAlign = 'center';
          ctx.font = 'bold 14px monospace';
          if (g.lastResult === 'correct') {
            ctx.fillStyle = C.green;
            ctx.fillText('✓ CORRECT!  ' + PRIOS[g.lastCorrectPrio].short + ' ' + PRIOS[g.lastCorrectPrio].name, w / 2, fbY);
          } else {
            ctx.fillStyle = C.red;
            const label = g.lastResult === 'timeout' ? '⏱ TIME\'S UP!' : '✕ WRONG!';
            ctx.fillText(label + '  →  ' + PRIOS[g.lastCorrectPrio].short + ' ' + PRIOS[g.lastCorrectPrio].name, w / 2, fbY);
          }
        }
      }

      // ── Range floor ──
      const floorY = h * 0.85;
      ctx.fillStyle = '#0c0e14';
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();

      // ── TARGETS ──
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const prio = PRIOS[i];
        const isHover = g.hoverTarget === i && g.phase === 'play';
        const isCorrectResult = g.phase === 'result' && g.lastCorrectPrio === i;
        const isWrongShot = g.phase === 'result' && g.lastResult !== 'correct' && g.lastCorrectPrio === i;

        // Target post
        ctx.strokeStyle = '#2a2e3a';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(t.x, t.y + t.r); ctx.lineTo(t.x, floorY); ctx.stroke();

        // Target shadow/glow
        if (isHover || isWrongShot) {
          ctx.shadowColor = isWrongShot ? prio.color : 'rgba(255,255,255,0.3)';
          ctx.shadowBlur = isWrongShot ? 25 : 15;
        }

        // Outer circle fill
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? '#1e2235' : '#161a28';
        ctx.fill();
        ctx.strokeStyle = prio.color + (isHover ? 'cc' : '55');
        ctx.lineWidth = isHover ? 3 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Concentric rings with color fill for bullseye
        const ringAlpha = isHover ? '30' : '18';
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = prio.color + ringAlpha; ctx.lineWidth = 1; ctx.stroke();

        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.50, 0, Math.PI * 2);
        ctx.fillStyle = prio.color + '10';
        ctx.fill();
        ctx.strokeStyle = prio.color + ringAlpha; ctx.stroke();

        // Bullseye center
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = prio.color + (isHover ? 'cc' : '80');
        ctx.fill();

        // Crosshairs
        ctx.strokeStyle = prio.color + '15'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(t.x - t.r, t.y); ctx.lineTo(t.x + t.r, t.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t.x, t.y - t.r); ctx.lineTo(t.x, t.y + t.r); ctx.stroke();

        // Priority label – PROMINENT
        ctx.textAlign = 'center';

        // Priority badge
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = prio.color;
        ctx.fillText(prio.short, t.x, t.y + t.r + 18);

        // Name
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = prio.color + 'bb';
        ctx.fillText(prio.name, t.x, t.y + t.r + 32);

        // Hint
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText(prio.hint, t.x, t.y + t.r + 44);

        // Key hint
        ctx.font = '8px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillText('[' + (i + 1) + ']', t.x, t.y + t.r + 56);
      }

      // Bullet holes
      for (const b of g.bulletHoles) {
        ctx.globalAlpha = Math.min(1, b.life * 2);
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 * i) / 3;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * 5, b.y + Math.sin(a) * 5);
          ctx.lineTo(b.x + Math.cos(a) * (10 + Math.random() * 5), b.y + Math.sin(a) * (10 + Math.random() * 5));
          ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Muzzle flash
      if (g.muzzleFlash) {
        const mf = g.muzzleFlash;
        ctx.globalAlpha = mf.life / 0.15;
        const flashSize = 35 + (1 - mf.life / 0.15) * 25;
        const grad = ctx.createRadialGradient(mf.x, mf.y, 0, mf.x, mf.y, flashSize);
        grad.addColorStop(0, C.muzzle);
        grad.addColorStop(0.4, C.orange + '80');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(mf.x - flashSize, mf.y - flashSize, flashSize * 2, flashSize * 2);
        ctx.globalAlpha = 1;
      }

      // Particles
      for (const p of g.particles) {
        ctx.globalAlpha = Math.min(1, p.life * 2.5); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Flash overlay
      if (g.shakeT > 0) {
        ctx.fillStyle = `rgba(255,50,50,${g.shakeT * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

      // Vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
      vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      /* ── START SCREEN ── */
      if (g.phase === 'start') {
        ctx.fillStyle = 'rgba(8,9,14,0.90)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        // Title with big glow
        ctx.shadowColor = C.red; ctx.shadowBlur = 40;
        ctx.font = 'bold 32px monospace'; ctx.fillStyle = C.red;
        ctx.fillText('🎯 TRIGGER TRIAGE', w / 2, h * 0.12);
        ctx.shadowBlur = 0;
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('INCIDENT PRIORITY SHOOTING RANGE', w / 2, h * 0.12 + 24);

        // How to play – clear instructions
        const ey = h * 0.22;
        ctx.font = 'bold 12px monospace'; ctx.fillStyle = C.yellow;
        ctx.fillText('🎯 HOW TO PLAY', w / 2, ey);

        ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const lines = [
          '1.  Read the incident report above',
          '2.  Judge: How critical is it?',
          '3.  Shoot the matching priority target!',
          '',
          'You have 10 seconds per incident.',
          'Faster = more points. 3 lives.',
        ];
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], w / 2, ey + 22 + i * 18);

        // Priority legend – visual and clear
        const ly = h * 0.52;
        ctx.font = 'bold 11px monospace';
        for (let i = 0; i < 5; i++) {
          const y = ly + i * 28;
          // Colored bullet
          ctx.fillStyle = PRIOS[i].color;
          ctx.beginPath(); ctx.arc(w / 2 - 130, y - 3, 5, 0, Math.PI * 2); ctx.fill();
          // Label
          ctx.textAlign = 'left';
          ctx.fillStyle = PRIOS[i].color;
          ctx.font = 'bold 11px monospace';
          ctx.fillText(PRIOS[i].short + '  ' + PRIOS[i].name, w / 2 - 118, y);
          // Description
          ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillText(PRIOS[i].hint, w / 2 + 20, y);
          ctx.textAlign = 'center';
        }

        // Controls
        const mob = 'ontouchstart' in window;
        if (!mob) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '9px monospace';
          ctx.fillText('KEYS 1-5 TO SHOOT  |  SPACE TO START', w / 2, h * 0.89);
        }
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.orange; ctx.font = 'bold 14px monospace'; ctx.fillText(mob ? '▶ TAP TO START' : '▶ PRESS SPACE', w / 2, h * 0.94); }
        if (g.hi > 0) { ctx.fillStyle = C.yellow + '50'; ctx.font = '10px monospace'; ctx.fillText('BEST: ' + g.hi, w / 2, h * 0.98); }
      }

      /* ── GAME OVER ── */
      if (g.phase === 'over') {
        ctx.fillStyle = 'rgba(8,9,14,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        ctx.shadowColor = C.red; ctx.shadowBlur = 25;
        ctx.font = 'bold 28px monospace'; ctx.fillStyle = C.red;
        ctx.fillText('RANGE CLOSED', w / 2, h * 0.18);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 44px monospace'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, w / 2, h * 0.34);
        ctx.font = '10px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText('FINAL SCORE', w / 2, h * 0.34 + 20);

        // Stats
        const acc = g.correct + g.wrong > 0 ? Math.round((g.correct / (g.correct + g.wrong)) * 100) : 0;
        const sy = h * 0.46;
        ctx.font = 'bold 13px monospace';

        ctx.fillStyle = C.green;
        ctx.fillText('✓ ' + g.correct + ' CORRECT', w / 2 - 80, sy);
        ctx.fillStyle = C.red;
        ctx.fillText('✕ ' + g.wrong + ' WRONG', w / 2 + 80, sy);

        ctx.fillStyle = acc >= 70 ? C.green : (acc >= 50 ? C.yellow : C.red);
        ctx.font = 'bold 18px monospace';
        ctx.fillText(acc + '% ACCURACY', w / 2, sy + 30);

        if (g.bestStreak > 1) {
          ctx.fillStyle = C.cyan; ctx.font = '11px monospace';
          ctx.fillText('BEST STREAK: ' + g.bestStreak + '×', w / 2, sy + 52);
        }

        // Rating
        let rating = '🔰 Rookie'; let ratingColor = C.dim;
        if (acc >= 90) { rating = '🏆 Expert Analyst'; ratingColor = C.yellow; }
        else if (acc >= 75) { rating = '⭐ Senior Responder'; ratingColor = C.green; }
        else if (acc >= 60) { rating = '🎯 On Target'; ratingColor = C.cyan; }
        else if (acc >= 40) { rating = '📋 Needs Practice'; ratingColor = C.orange; }
        ctx.font = 'bold 14px monospace'; ctx.fillStyle = ratingColor;
        ctx.fillText(rating, w / 2, sy + 80);

        ctx.fillStyle = g.score >= g.hi && g.hi > 0 ? C.yellow : C.dim;
        ctx.font = '10px monospace';
        ctx.fillText('BEST: ' + g.hi + (g.score >= g.hi && g.score > 0 ? ' ★ NEW RECORD' : ''), w / 2, sy + 108);

        const mob = 'ontouchstart' in window;
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.orange; ctx.font = 'bold 13px monospace'; ctx.fillText(mob ? '▶ TAP TO RETRY' : '▶ SPACE / R TO RETRY', w / 2, sy + 140); }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    lastT.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [nextRound]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${embedded ? 'w-full h-[500px] rounded-xl' : 'w-full h-screen'}`}
      style={{ background: C.bg }}
    >
      {!embedded && <PageMeta title="Trigger Triage" description="Incident Priority Shooting Range" />}
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default TriggerTriage;
