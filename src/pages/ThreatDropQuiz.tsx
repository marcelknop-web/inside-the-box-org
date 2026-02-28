import { useRef, useEffect, useCallback } from 'react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';

/* ══════════════════════════════════════
   I18N
   ══════════════════════════════════════ */
const T = {
  en: {
    title: 'THREATDROP',
    subtitle: 'INCIDENT RESPONSE ARCADE',
    howTo: 'HOW TO PLAY',
    howToLines: [
      'Threats fall from above with a hint.',
      'Read the hint and decide:',
      'Which Incident Response phase fits?',
      '', '👁 See it? → DETECT', '🛡 Stop it? → CONTAIN',
      '🧹 Remove it? → ERADICATE', '🔄 Fix it? → RECOVER',
    ],
    controls: '1-4 CLASSIFY  |  ← → + ENTER  |  SPACE START',
    tapStart: 'TAP TO START', pressSpace: 'PRESS SPACE',
    gameOver: 'GAME OVER', bestCombo: 'BEST COMBO',
    tapRestart: 'TAP TO RESTART', restart: 'SPACE / R',
    laneDescs: ['Spot it / Alert', 'Isolate / Block', 'Remove / Clean', 'Restore / Rebuild'],
    examples: [
      '👁 "spotted in inbox" → DETECT',
      '🛡 "lock compromised" → CONTAIN',
      '🧹 "remove malware" → ERADICATE',
      '🔄 "bring data back" → RECOVER',
    ],
  },
  de: {
    title: 'THREATDROP',
    subtitle: 'INCIDENT RESPONSE ARCADE',
    howTo: 'SO GEHT\'S',
    howToLines: [
      'Bedrohungen fallen von oben mit Hinweis.',
      'Hinweis lesen und entscheiden:',
      'Welche IR-Phase passt?',
      '', '👁 Erkennen? → DETECT', '🛡 Eindämmen? → CONTAIN',
      '🧹 Entfernen? → ERADICATE', '🔄 Wiederherstellen? → RECOVER',
    ],
    controls: '1-4 ZUORDNEN  |  ← → + ENTER  |  LEERTASTE START',
    tapStart: 'TIPPEN ZUM START', pressSpace: 'LEERTASTE',
    gameOver: 'GAME OVER', bestCombo: 'BESTE COMBO',
    tapRestart: 'TIPPEN FÜR NEUSTART', restart: 'LEERTASTE / R',
    laneDescs: ['Erkennen / Alarmieren', 'Isolieren / Blockieren', 'Entfernen / Bereinigen', 'Wiederherstellen'],
    examples: [
      '👁 "im Postfach entdeckt" → DETECT',
      '🛡 "Account sperren" → CONTAIN',
      '🧹 "Malware löschen" → ERADICATE',
      '🔄 "Daten zurückholen" → RECOVER',
    ],
  },
  fr: {
    title: 'THREATDROP',
    subtitle: 'ARCADE RÉPONSE AUX INCIDENTS',
    howTo: 'COMMENT JOUER',
    howToLines: [
      'Des menaces tombent avec un indice.',
      'Lisez l\'indice et décidez :',
      'Quelle phase IR correspond ?',
      '', '👁 Détecter ? → DETECT', '🛡 Contenir ? → CONTAIN',
      '🧹 Éradiquer ? → ERADICATE', '🔄 Restaurer ? → RECOVER',
    ],
    controls: '1-4 CLASSER  |  ← → + ENTER  |  ESPACE DÉMARRER',
    tapStart: 'APPUYER POUR DÉMARRER', pressSpace: 'APPUYER ESPACE',
    gameOver: 'PARTIE TERMINÉE', bestCombo: 'MEILLEUR COMBO',
    tapRestart: 'APPUYER POUR REJOUER', restart: 'ESPACE / R',
    laneDescs: ['Détecter / Alerter', 'Isoler / Bloquer', 'Supprimer / Nettoyer', 'Restaurer / Reconstruire'],
    examples: [
      '👁 "détecté dans la boîte" → DETECT',
      '🛡 "bloquer le compte" → CONTAIN',
      '🧹 "supprimer le malware" → ERADICATE',
      '🔄 "restaurer les données" → RECOVER',
    ],
  },
};

/* ══════════════════════════════════════
   COLORS
   ══════════════════════════════════════ */
const C = {
  bg: '#05060a', cyan: '#00e5ff', pink: '#ff2bd6',
  lime: '#a7ff1a', yellow: '#ffd000', red: '#ff3b3b',
  white: '#ffffff', grid: 'rgba(255,255,255,0.04)',
  dim: 'rgba(255,255,255,0.25)',
};

/* ══════════════════════════════════════
   LANES
   ══════════════════════════════════════ */
const LANES = [
  { name: 'DETECT',    color: C.cyan,   sym: '◎', key: '1' },
  { name: 'CONTAIN',   color: C.pink,   sym: '◇', key: '2' },
  { name: 'ERADICATE', color: C.lime,   sym: '✕', key: '3' },
  { name: 'RECOVER',   color: C.yellow, sym: '↻', key: '4' },
];

/* ══════════════════════════════════════
   THREAT SHAPES
   ══════════════════════════════════════ */
type ThreatShape = 'eye' | 'skull' | 'bolt' | 'bug' | 'shield' | 'lock' | 'flame' | 'wave';

const drawShape = (ctx: CanvasRenderingContext2D, shape: ThreatShape, size: number, color: string) => {
  ctx.strokeStyle = color;
  ctx.fillStyle = color + '20';
  ctx.lineWidth = 2.5;
  const s = size;
  switch (shape) {
    case 'eye': // radar/eye
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      break;
    case 'skull': // danger skull
      ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.6, 0, Math.PI, true); ctx.lineTo(-s * 0.6, s * 0.3);
      ctx.lineTo(-s * 0.2, s * 0.15); ctx.lineTo(0, s * 0.35); ctx.lineTo(s * 0.2, s * 0.15);
      ctx.lineTo(s * 0.6, s * 0.3); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bolt': // lightning
      ctx.beginPath(); ctx.moveTo(s * 0.15, -s * 0.6); ctx.lineTo(-s * 0.1, -s * 0.05);
      ctx.lineTo(s * 0.12, -s * 0.05); ctx.lineTo(-s * 0.15, s * 0.6);
      ctx.lineTo(s * 0.1, s * 0.05); ctx.lineTo(-s * 0.12, s * 0.05); ctx.closePath();
      ctx.stroke(); ctx.fill();
      break;
    case 'bug': // virus/bug
      ctx.beginPath(); ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35);
        ctx.lineTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.7); ctx.stroke();
      }
      break;
    case 'shield': // shield
      ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(s * 0.5, -s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.15); ctx.lineTo(0, s * 0.6);
      ctx.lineTo(-s * 0.5, s * 0.15); ctx.lineTo(-s * 0.5, -s * 0.3); ctx.closePath();
      ctx.stroke(); ctx.fill();
      break;
    case 'lock': // padlock
      ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.25, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = color + '20';
      ctx.fillRect(-s * 0.35, -s * 0.1, s * 0.7, s * 0.55);
      ctx.strokeRect(-s * 0.35, -s * 0.1, s * 0.7, s * 0.55);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    case 'flame': // fire
      ctx.beginPath(); ctx.moveTo(0, -s * 0.6);
      ctx.bezierCurveTo(s * 0.4, -s * 0.2, s * 0.45, s * 0.3, 0, s * 0.6);
      ctx.bezierCurveTo(-s * 0.45, s * 0.3, -s * 0.4, -s * 0.2, 0, -s * 0.6);
      ctx.stroke(); ctx.fill();
      break;
    case 'wave': // signal wave
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const r = s * (0.2 + i * 0.2);
        ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
      }
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
  }
};

/* ══════════════════════════════════════
   THREATS
   ══════════════════════════════════════ */
const THREATS: { label: string; lane: number; hint: string; shape: ThreatShape }[] = [
  // DETECT (0)
  { label: 'SUSPICIOUS LOGIN',   lane: 0, hint: '👁 alert triggered',     shape: 'eye' },
  { label: 'PHISHING EMAIL',     lane: 0, hint: '👁 spotted in inbox',    shape: 'eye' },
  { label: 'PORT SCAN',          lane: 0, hint: '👁 scanning activity',   shape: 'wave' },
  { label: 'ANOMALY ALERT',      lane: 0, hint: '👁 unusual pattern',     shape: 'wave' },
  { label: 'BRUTE FORCE',        lane: 0, hint: '👁 repeated attempts',   shape: 'bolt' },
  { label: 'LOG ALERT',          lane: 0, hint: '👁 SIEM triggered',      shape: 'eye' },
  { label: 'UNUSUAL TRAFFIC',    lane: 0, hint: '👁 network spike',       shape: 'wave' },
  { label: 'NEW DEVICE',         lane: 0, hint: '👁 unknown endpoint',    shape: 'eye' },
  { label: 'RECON SCAN',         lane: 0, hint: '👁 probing detected',    shape: 'wave' },
  { label: 'IDS ALERT',          lane: 0, hint: '👁 intrusion signal',    shape: 'eye' },
  // CONTAIN (1)
  { label: 'ISOLATE HOST',       lane: 1, hint: '🛡 cut off spread',      shape: 'shield' },
  { label: 'BLOCK IP',           lane: 1, hint: '🛡 firewall rule',       shape: 'shield' },
  { label: 'DISABLE ACCOUNT',    lane: 1, hint: '🛡 lock compromised',    shape: 'lock' },
  { label: 'QUARANTINE',         lane: 1, hint: '🛡 isolate file',        shape: 'shield' },
  { label: 'SEGMENT NETWORK',    lane: 1, hint: '🛡 limit blast radius',  shape: 'shield' },
  { label: 'REVOKE TOKEN',       lane: 1, hint: '🛡 stop access',         shape: 'lock' },
  { label: 'KILL SESSION',       lane: 1, hint: '🛡 terminate connection', shape: 'lock' },
  { label: 'FREEZE ACCOUNT',     lane: 1, hint: '🛡 prevent lateral move', shape: 'lock' },
  { label: 'BLOCK DOMAIN',       lane: 1, hint: '🛡 DNS sinkhole',        shape: 'shield' },
  { label: 'VPN LOCKOUT',        lane: 1, hint: '🛡 revoke remote access', shape: 'lock' },
  // ERADICATE (2)
  { label: 'DELETE MALWARE',     lane: 2, hint: '🧹 remove malicious file', shape: 'bug' },
  { label: 'PATCH VULN',         lane: 2, hint: '🧹 fix the hole',        shape: 'bug' },
  { label: 'REMOVE BACKDOOR',    lane: 2, hint: '🧹 close hidden entry',  shape: 'skull' },
  { label: 'CLEAN ROOTKIT',      lane: 2, hint: '🧹 deep system clean',   shape: 'skull' },
  { label: 'WIPE TROJAN',        lane: 2, hint: '🧹 eliminate payload',   shape: 'bug' },
  { label: 'PURGE RAT',          lane: 2, hint: '🧹 remove remote tool',  shape: 'skull' },
  { label: 'STRIP WEB SHELL',    lane: 2, hint: '🧹 delete injected code', shape: 'bug' },
  { label: 'REMOVE IMPLANT',     lane: 2, hint: '🧹 APT artifact gone',   shape: 'skull' },
  { label: 'FIX CONFIG',         lane: 2, hint: '🧹 correct misconfig',   shape: 'bug' },
  { label: 'KILL CRYPTOMINER',   lane: 2, hint: '🧹 stop resource theft', shape: 'bug' },
  // RECOVER (3)
  { label: 'RESTORE BACKUP',     lane: 3, hint: '🔄 bring data back',     shape: 'flame' },
  { label: 'REBUILD SERVER',     lane: 3, hint: '🔄 fresh system image',  shape: 'flame' },
  { label: 'REISSUE CERTS',      lane: 3, hint: '🔄 new certificates',    shape: 'lock' },
  { label: 'RESET PASSWORDS',    lane: 3, hint: '🔄 new credentials',     shape: 'lock' },
  { label: 'RESTORE DB',         lane: 3, hint: '🔄 data recovery',       shape: 'flame' },
  { label: 'REDEPLOY APP',       lane: 3, hint: '🔄 clean deployment',    shape: 'flame' },
  { label: 'ROTATE KEYS',        lane: 3, hint: '🔄 new API keys',        shape: 'lock' },
  { label: 'REBUILD DNS',        lane: 3, hint: '🔄 fix resolution',      shape: 'wave' },
  { label: 'FAILOVER',           lane: 3, hint: '🔄 switch to standby',   shape: 'flame' },
  { label: 'SERVICE RESTART',    lane: 3, hint: '🔄 bring back online',   shape: 'flame' },
];

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */
interface Threat {
  id: number; label: string; lane: number; hint: string; shape: ThreatShape;
  x: number; y: number; speed: number;
  caught: boolean; missed: boolean; timer: number;
  feedbackColor: string;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Popup { text: string; x: number; y: number; life: number; color: string; }
interface GS {
  phase: 'start' | 'play' | 'over';
  selectedLane: number;
  threats: Threat[]; particles: Particle[]; popups: Popup[];
  score: number; combo: number; bestCombo: number; lives: number;
  time: number; spawnT: number; baseSpd: number;
  shakeT: number; flashT: number; slowT: number; shield: boolean;
  nextId: number; hi: number;
  activeIdx: number;
}

/* ══════════════════════════════════════
   AUDIO – SFX
   ══════════════════════════════════════ */
const tone = (ctx: AudioContext, freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
};
const sfxCatch = (ctx: AudioContext) => { tone(ctx, 880, 0.08); setTimeout(() => tone(ctx, 1320, 0.06), 40); };
const sfxMiss = (ctx: AudioContext) => { tone(ctx, 180, 0.25, 'sawtooth', 0.1); };
const sfxCombo = (ctx: AudioContext) => { tone(ctx, 660, 0.06); setTimeout(() => tone(ctx, 990, 0.06), 50); setTimeout(() => tone(ctx, 1320, 0.1), 100); };
const sfxGameOver = (ctx: AudioContext) => { tone(ctx, 440, 0.2, 'square', 0.1); setTimeout(() => tone(ctx, 330, 0.2, 'square', 0.1), 180); setTimeout(() => tone(ctx, 220, 0.4, 'sawtooth', 0.08), 360); };
const sfxStart = (ctx: AudioContext) => { tone(ctx, 440, 0.06); setTimeout(() => tone(ctx, 660, 0.06), 50); setTimeout(() => tone(ctx, 880, 0.1), 100); };

/* ══════════════════════════════════════
   BG MUSIC – Space Invaders style
   Slow, hypnotic "tab tab tab tab" descending bass
   ══════════════════════════════════════ */
interface BGMusic {
  ctx: AudioContext;
  running: boolean;
  timers: ReturnType<typeof setInterval>[];
  step: number;
  gainNode: GainNode;
}

// Classic 4-note descending pattern like Space Invaders
const SI_NOTES = [130, 110, 98, 82]; // E2, A1, G1, E1 – ominous descent

const startBGMusic = (ctx: AudioContext): BGMusic => {
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.10;
  gainNode.connect(ctx.destination);
  const bg: BGMusic = { ctx, running: true, timers: [], step: 0, gainNode };

  const tick = () => {
    if (!bg.running) return;
    const freq = SI_NOTES[bg.step % SI_NOTES.length];
    // Short, percussive square wave "tab"
    const osc = ctx.createOscillator();
    const ng = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    ng.gain.setValueAtTime(0.25, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(ng); ng.connect(bg.gainNode);
    osc.start(); osc.stop(ctx.currentTime + 0.09);
    bg.step++;
  };

  // Start slow, ~0.6s gap (like the original game start)
  bg.timers.push(setInterval(tick, 600));
  return bg;
};

const stopBGMusic = (bg: BGMusic | null) => {
  if (!bg) return;
  bg.running = false;
  bg.timers.forEach(t => clearInterval(t));
};

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
const HI_KEY = 'threatdrop-hi';
const getHi = () => { try { return +(localStorage.getItem(HI_KEY) || 0); } catch { return 0; } };
const saveHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HI_KEY, '' + s); } catch {} };

const mkGS = (): GS => ({
  phase: 'start', selectedLane: -1,
  threats: [], particles: [], popups: [],
  score: 0, combo: 0, bestCombo: 0, lives: 3,
  time: 0, spawnT: 2.2, baseSpd: 55,
  shakeT: 0, flashT: 0, slowT: 0, shield: false,
  nextId: 0, hi: getHi(), activeIdx: -1,
});

const spawnThreat = (g: GS, w: number, yOff = 0) => {
  const t = THREATS[Math.floor(Math.random() * THREATS.length)];
  const centerX = w / 2 + (Math.random() - 0.5) * w * 0.3;
  g.threats.push({
    id: g.nextId++, label: t.label, lane: t.lane, hint: t.hint, shape: t.shape,
    x: centerX, y: -50 + yOff,
    speed: g.baseSpd + Math.min(g.combo * 1.5, 50),
    caught: false, missed: false, timer: 0, feedbackColor: '',
  });
};

const burst = (g: GS, x: number, y: number, color: string) => {
  for (let i = 0; i < 18; i++) {
    const a = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
    const s = 80 + Math.random() * 120;
    g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.3, color, size: 2 + Math.random() * 3 });
  }
};

const rRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
};

/* ══════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════ */
const ThreatDropQuiz = ({ embedded }: { embedded?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gs = useRef<GS>(mkGS());
  const animRef = useRef(0);
  const lastT = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const audioRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<BGMusic | null>(null);
  const { language } = useLanguage();
  const langRef = useRef(language);
  langRef.current = language;

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) { try { audioRef.current = new AudioContext(); } catch {} }
    return audioRef.current;
  }, []);

  const startGame = useCallback(() => {
    const hi = gs.current.hi;
    gs.current = { ...mkGS(), phase: 'play', hi };
    const a = ensureAudio();
    if (a) { sfxStart(a); stopBGMusic(bgMusicRef.current); bgMusicRef.current = startBGMusic(a); }
  }, [ensureAudio]);

  useEffect(() => { return () => stopBGMusic(bgMusicRef.current); }, []);

  const classifyThreat = useCallback((chosenLane: number) => {
    const g = gs.current;
    if (g.phase !== 'play') return;
    let lowest: Threat | null = null;
    for (const t of g.threats) { if (!t.caught && !t.missed && (!lowest || t.y > lowest.y)) lowest = t; }
    if (!lowest) return;
    const ac = audioRef.current;

    if (chosenLane === lowest.lane) {
      lowest.caught = true; lowest.timer = 0;
      lowest.feedbackColor = LANES[lowest.lane].color;
      const pts = 100 + g.combo * 15;
      g.score += pts; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
      burst(g, lowest.x, lowest.y, LANES[lowest.lane].color);
      g.popups.push({ text: '+' + pts, x: lowest.x, y: lowest.y - 20, life: 0.8, color: LANES[lowest.lane].color });
      g.baseSpd = Math.min(150, 55 + g.combo * 1.5);
      if (ac) { g.combo % 5 === 0 ? sfxCombo(ac) : sfxCatch(ac); }
      if (g.combo === 5) { g.slowT = 5; g.popups.push({ text: '⏱ SLOW TIME', x: sizeRef.current.w / 2, y: sizeRef.current.h / 2, life: 1.2, color: C.cyan }); }
      if (g.combo === 15) { g.shield = true; g.popups.push({ text: '◆ SHIELD', x: sizeRef.current.w / 2, y: sizeRef.current.h / 2, life: 1.2, color: C.pink }); }
    } else {
      lowest.missed = true; lowest.timer = 0; lowest.feedbackColor = C.red;
      g.popups.push({ text: '✕ → ' + LANES[lowest.lane].name, x: lowest.x, y: lowest.y - 20, life: 1.2, color: C.red });
      if (g.shield) g.shield = false;
      else { g.lives--; g.combo = 0; g.shakeT = 0.3; g.flashT = 0.3; }
      if (ac) sfxMiss(ac);
      if (g.lives <= 0) { g.phase = 'over'; saveHi(g.score); g.hi = Math.max(g.hi, g.score); if (ac) sfxGameOver(ac); stopBGMusic(bgMusicRef.current); bgMusicRef.current = null; }
    }
    g.selectedLane = -1;
  }, []);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gs.current;
      if (g.phase === 'start' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'over' && (e.key === 'r' || e.key === 'R' || e.key === ' ')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'play') {
        if (e.key >= '1' && e.key <= '4') { e.preventDefault(); classifyThreat(+e.key - 1); return; }
        if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); g.selectedLane = Math.max(0, (g.selectedLane < 0 ? 1 : g.selectedLane) - 1); }
        if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); g.selectedLane = Math.min(3, (g.selectedLane < 0 ? 0 : g.selectedLane) + 1); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (g.selectedLane >= 0) classifyThreat(g.selectedLane); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame, classifyThreat]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const handle = (cx: number, cy: number) => {
      const g = gs.current; const { w, h } = sizeRef.current;
      if (g.phase !== 'play') { startGame(); return; }
      if (cy > h - 70) { classifyThreat(Math.max(0, Math.min(3, Math.floor(cx / (w / 4))))); }
    };
    const onClick = (e: MouseEvent) => { const r = c.getBoundingClientRect(); handle(e.clientX - r.left, e.clientY - r.top); };
    const onTouch = (e: TouchEvent) => { e.preventDefault(); const r = c.getBoundingClientRect(); const t = e.touches[0]; handle(t.clientX - r.left, t.clientY - r.top); };
    c.addEventListener('mousedown', onClick);
    c.addEventListener('touchstart', onTouch, { passive: false });
    return () => { c.removeEventListener('mousedown', onClick); c.removeEventListener('touchstart', onTouch); };
  }, [startGame, classifyThreat]);

  /* ══════════════ GAME LOOP ══════════════ */
  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;
      const g = gs.current;
      const { w, h } = sizeRef.current;
      if (w === 0) { animRef.current = requestAnimationFrame(loop); return; }
      const lang = langRef.current as 'en' | 'de' | 'fr';
      const txt = T[lang];

      const lw = w / 4;
      const deadlineY = h - 80;
      const ac = audioRef.current;

      if (g.phase === 'play') {
        g.time += dt;
        g.spawnT -= dt;
        if (g.spawnT <= 0) {
          spawnThreat(g, w);
          const interval = Math.max(1.5, 3.5 - g.time * 0.006 - g.combo * 0.02);
          g.spawnT = interval * (0.85 + Math.random() * 0.3);
          if (g.combo >= 12 && Math.random() < 0.2) spawnThreat(g, w, -140);
        }
        const sm = g.slowT > 0 ? 0.35 : 1;
        g.slowT = Math.max(0, g.slowT - dt);

        const rm: number[] = [];
        for (const t of g.threats) {
          if (t.caught || t.missed) { t.timer += dt; if (t.timer > 0.5) rm.push(t.id); continue; }
          t.y += t.speed * sm * dt;
          if (t.y >= deadlineY) {
            t.missed = true; t.timer = 0; t.feedbackColor = C.red;
            g.popups.push({ text: '✕ ' + LANES[t.lane].name, x: t.x, y: t.y - 20, life: 1.0, color: C.red });
            if (g.shield) g.shield = false;
            else { g.lives--; g.combo = 0; g.shakeT = 0.3; g.flashT = 0.3; if (ac) sfxMiss(ac); }
            if (g.lives <= 0) { g.phase = 'over'; saveHi(g.score); g.hi = Math.max(g.hi, g.score); if (ac) sfxGameOver(ac); stopBGMusic(bgMusicRef.current); bgMusicRef.current = null; }
          }
        }
        g.threats = g.threats.filter(t => !rm.includes(t.id));
        for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 200 * dt; }
        g.particles = g.particles.filter(p => p.life > 0);
        for (const p of g.popups) { p.y -= 50 * dt; p.life -= dt; }
        g.popups = g.popups.filter(p => p.life > 0);
        g.shakeT = Math.max(0, g.shakeT - dt);
        g.flashT = Math.max(0, g.flashT - dt);
      }

      /* ── DRAW ── */
      const c = canvasRef.current; if (!c) { animRef.current = requestAnimationFrame(loop); return; }
      const ctx = c.getContext('2d'); if (!ctx) { animRef.current = requestAnimationFrame(loop); return; }
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (g.shakeT > 0) { const i = g.shakeT * 15; ctx.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i); }

      ctx.fillStyle = C.bg; ctx.fillRect(-10, -10, w + 20, h + 20);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      if (g.phase === 'play') {
        ctx.setLineDash([6, 8]); ctx.strokeStyle = C.red + '30'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, deadlineY); ctx.lineTo(w, deadlineY); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Lane buttons
      const btnH = 60, btnY = h - btnH;
      for (let i = 0; i < 4; i++) {
        const lane = LANES[i]; const bx = i * lw; const selected = g.selectedLane === i;
        ctx.fillStyle = selected ? lane.color + '25' : '#0d0f18';
        ctx.fillRect(bx, btnY, lw, btnH);
        ctx.strokeStyle = selected ? lane.color : lane.color + '30';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(bx + 0.5, btnY + 0.5, lw - 1, btnH - 1);
        ctx.textAlign = 'center';
        ctx.font = '18px monospace'; ctx.fillStyle = lane.color + (selected ? 'ff' : '90');
        ctx.fillText(lane.sym, bx + lw / 2, btnY + 24);
        ctx.font = 'bold 8px monospace'; ctx.fillStyle = lane.color + (selected ? 'dd' : '60');
        ctx.fillText(lane.name, bx + lw / 2, btnY + 40);
        ctx.font = '7px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillText(txt.laneDescs[i], bx + lw / 2, btnY + 52);
      }

      // ── THREATS (with shapes!) ──
      for (const t of g.threats) {
        let alpha = 1, scale = 1;
        const col = t.caught || t.missed ? t.feedbackColor : C.white;
        if (t.caught) { alpha = 1 - t.timer / 0.5; scale = 1 + t.timer * 1.5; }
        if (t.missed && !t.caught) { alpha = Math.max(0, 1 - t.timer / 0.5); }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(t.x, t.y);
        ctx.scale(scale, scale);

        const urgency = Math.max(0, 1 - Math.abs(t.y - deadlineY) / 250);
        ctx.shadowColor = t.caught ? LANES[t.lane].color : (urgency > 0.5 ? C.red : C.cyan);
        ctx.shadowBlur = 6 + urgency * 14;

        // Draw shape instead of box
        drawShape(ctx, t.shape, 38, col);
        ctx.shadowBlur = 0;

        // Label below shape
        ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(t.label, 0, 38);

        // Hint
        ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(t.hint, 0, 54);

        if (t.caught) {
          ctx.font = '10px monospace'; ctx.fillStyle = LANES[t.lane].color;
          ctx.fillText(LANES[t.lane].sym + ' ' + LANES[t.lane].name, 0, -24);
        }
        ctx.restore();
      }

      // Particles
      for (const p of g.particles) {
        ctx.globalAlpha = Math.min(1, p.life * 2.5); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Popups
      for (const p of g.popups) {
        ctx.globalAlpha = Math.min(1, p.life * 1.5); ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center'; ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // HUD
      if (g.phase === 'play' || g.phase === 'over') {
        ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, 16, 28);
        if (g.combo > 1) { ctx.textAlign = 'center'; ctx.fillStyle = C.cyan; ctx.font = 'bold 20px monospace'; ctx.fillText(g.combo + '×', w / 2, 30); }
        ctx.textAlign = 'right';
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < g.lives ? C.red : 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.fillText('♥', w - 14 - (2 - i) * 22, 28); }
        if (g.slowT > 0) { ctx.textAlign = 'left'; ctx.font = '10px monospace'; ctx.fillStyle = C.cyan; ctx.fillText('⏱ ' + g.slowT.toFixed(1) + 's', 16, 48); }
        if (g.shield) { ctx.textAlign = 'left'; ctx.font = '10px monospace'; ctx.fillStyle = C.pink; ctx.fillText('◆ SHIELD', 16, g.slowT > 0 ? 62 : 48); }
      }

      if (g.flashT > 0) { ctx.fillStyle = `rgba(255,50,50,${g.flashT * 0.4})`; ctx.fillRect(-10, -10, w + 20, h + 20); }

      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
      vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      /* ── START SCREEN ── */
      if (g.phase === 'start') {
        ctx.fillStyle = 'rgba(5,6,10,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        ctx.shadowColor = C.cyan; ctx.shadowBlur = 25;
        ctx.font = 'bold 28px monospace'; ctx.fillStyle = C.cyan;
        ctx.fillText(txt.title, w / 2, h * 0.12);
        ctx.shadowBlur = 0;
        ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(txt.subtitle, w / 2, h * 0.12 + 20);

        const ey = h * 0.22;
        ctx.font = 'bold 11px monospace'; ctx.fillStyle = C.yellow;
        ctx.fillText(txt.howTo, w / 2, ey);
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < txt.howToLines.length; i++) {
          ctx.fillText(txt.howToLines[i], w / 2, ey + 18 + i * 15);
        }

        const ly = h * 0.56;
        for (let i = 0; i < 4; i++) {
          const y = ly + i * 24;
          ctx.fillStyle = LANES[i].color; ctx.font = '16px monospace';
          ctx.fillText(LANES[i].sym, w / 2 - 100, y + 2);
          ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
          ctx.fillText(LANES[i].key + '  ' + LANES[i].name, w / 2 - 80, y + 2);
          ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillText('– ' + txt.laneDescs[i], w / 2 + 10, y + 2);
          ctx.textAlign = 'center';
        }

        const exY = ly + 4 * 24 + 14;
        ctx.font = '9px monospace'; ctx.fillStyle = C.dim;
        for (let i = 0; i < txt.examples.length; i++) ctx.fillText(txt.examples[i], w / 2, exY + i * 14);

        const mob = 'ontouchstart' in window;
        if (!mob) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '9px monospace'; ctx.fillText(txt.controls, w / 2, h * 0.90); }
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 13px monospace'; ctx.fillText(mob ? txt.tapStart : txt.pressSpace, w / 2, h * 0.95); }
        if (g.hi > 0) { ctx.fillStyle = C.yellow + '60'; ctx.font = '10px monospace'; ctx.fillText('HI ' + g.hi, w / 2, h * 0.98); }
      }

      /* ── GAME OVER ── */
      if (g.phase === 'over') {
        ctx.fillStyle = 'rgba(5,6,10,0.75)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.shadowColor = C.red; ctx.shadowBlur = 20; ctx.font = 'bold 26px monospace'; ctx.fillStyle = C.red;
        ctx.fillText(txt.gameOver, w / 2, h * 0.30); ctx.shadowBlur = 0;
        ctx.font = 'bold 38px monospace'; ctx.fillStyle = C.white; ctx.fillText('' + g.score, w / 2, h * 0.44);
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('SCORE', w / 2, h * 0.44 + 18);
        if (g.bestCombo > 1) { ctx.fillStyle = C.cyan; ctx.fillText(txt.bestCombo + ' ' + g.bestCombo + '×', w / 2, h * 0.56); }
        ctx.fillStyle = g.score >= g.hi && g.hi > 0 ? C.yellow : 'rgba(255,255,255,0.35)';
        ctx.fillText('HI ' + g.hi + (g.score >= g.hi && g.score > 0 ? ' ★ NEW' : ''), w / 2, h * 0.64);
        const mob = 'ontouchstart' in window;
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 12px monospace'; ctx.fillText(mob ? txt.tapRestart : txt.restart, w / 2, h * 0.77); }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    lastT.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div ref={containerRef}
      className={`relative overflow-hidden ${embedded ? 'w-full h-[500px] rounded-xl' : 'w-full h-screen'}`}
      style={{ background: C.bg, cursor: 'pointer' }}>
      {!embedded && <PageMeta title="ThreatDrop" description="Arcade Cybersecurity Game" />}
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ThreatDropQuiz;
