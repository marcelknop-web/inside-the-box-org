import { useRef, useEffect, useCallback, useState } from 'react';
import { PageMeta } from '@/components/PageMeta';

/* ══════════════════════════════════════
   COLORS
   ══════════════════════════════════════ */
const C = {
  bg: '#0a0c12',
  wood: '#2a1f14',
  woodLight: '#3d2e1f',
  metal: '#3a3e4a',
  metalLight: '#5a5e6a',
  red: '#ff3b3b',
  orange: '#ff8c1a',
  yellow: '#ffd000',
  green: '#22dd66',
  blue: '#2299ff',
  cyan: '#00e5ff',
  white: '#f0f0f0',
  dim: 'rgba(255,255,255,0.3)',
  muzzle: '#ffcc44',
  smoke: 'rgba(200,200,200,0.15)',
};

/* ══════════════════════════════════════
   PRIORITY LEVELS
   ══════════════════════════════════════ */
const PRIOS = [
  { id: 1, name: 'P1 CRITICAL', short: 'P1', color: C.red,    desc: 'Total outage, data breach, immediate danger' },
  { id: 2, name: 'P2 HIGH',     short: 'P2', color: C.orange, desc: 'Major service degraded, attack in progress' },
  { id: 3, name: 'P3 MEDIUM',   short: 'P3', color: C.yellow, desc: 'Limited impact, workaround available' },
  { id: 4, name: 'P4 LOW',      short: 'P4', color: C.green,  desc: 'Minor issue, no immediate risk' },
  { id: 5, name: 'P5 INFO',     short: 'P5', color: C.blue,   desc: 'Informational, no action needed now' },
];

/* ══════════════════════════════════════
   INCIDENTS – realistic scenarios
   ══════════════════════════════════════ */
interface Incident {
  text: string;
  detail: string;
  prio: number; // 0-4 index
}

const INCIDENTS: Incident[] = [
  // P1 CRITICAL
  { text: 'Ransomware encrypting production servers',            detail: 'All customer-facing services down. Encryption spreading to backup systems.', prio: 0 },
  { text: 'Active data exfiltration detected',                   detail: 'Outbound transfer of 50GB customer PII to unknown IP. Still ongoing.', prio: 0 },
  { text: 'Core banking system completely unresponsive',          detail: 'Zero transactions processing. 200K customers affected. No failover available.', prio: 0 },
  { text: 'Attacker has domain admin access',                    detail: 'Golden Ticket detected. Full AD compromise confirmed. Lateral movement active.', prio: 0 },
  { text: 'Payment processing system breached',                  detail: 'Credit card data actively being siphoned. PCI scope fully compromised.', prio: 0 },
  { text: 'Complete network outage across all sites',             detail: 'Core routers wiped. No connectivity between any offices or data centers.', prio: 0 },

  // P2 HIGH
  { text: 'VPN gateway compromised',                             detail: 'Unauthorized access via VPN. 30 sessions hijacked. Remote workers affected.', prio: 1 },
  { text: 'Email server delivering phishing to customers',       detail: 'Compromised mail relay sending malware to customer mailing list. 5K sent so far.', prio: 1 },
  { text: 'Database replication lag causing data loss',           detail: 'Primary DB 45min ahead of replica. If primary fails, significant data loss.', prio: 1 },
  { text: 'Privilege escalation exploit active on web server',   detail: 'Attacker gained root on web-01. Not yet spread. Customer data on same host.', prio: 1 },
  { text: 'DDoS attack degrading main website',                  detail: '70% packet loss on main site. CDN partially mitigating. Sales impacted.', prio: 1 },
  { text: 'Insider deleting files from shared drives',           detail: 'Terminated employee still has access. Deleting project files systematically.', prio: 1 },

  // P3 MEDIUM
  { text: 'Phishing campaign targeting employees',               detail: '12 employees clicked link. No credentials entered yet. Awareness alert sent.', prio: 2 },
  { text: 'Single workstation infected with adware',             detail: 'Marketing laptop showing pop-ups. No network spread. User isolated.', prio: 2 },
  { text: 'Expired SSL certificate on internal portal',          detail: 'HR portal showing certificate warning. Only internal users affected. Workaround: direct IP.', prio: 2 },
  { text: 'Failed login brute-force on staging server',          detail: 'Automated attempts from single IP. Account lockout working. No breach.', prio: 2 },
  { text: 'Vulnerability scan found unpatched Apache',           detail: 'CVE-2024 on internal dev server. Not internet-facing. Patch available.', prio: 2 },
  { text: 'USB device policy violation detected',                detail: 'Employee plugged personal USB. DLP blocked file transfer. Device quarantined.', prio: 2 },

  // P4 LOW
  { text: 'Scheduled password rotation reminder overdue',        detail: 'Service account password 10 days past rotation policy. No signs of compromise.', prio: 3 },
  { text: 'Minor UI bug in admin dashboard',                     detail: 'Chart labels overlapping on one page. Functionality unaffected.', prio: 3 },
  { text: 'Test environment DNS misconfiguration',               detail: 'Dev team can\'t resolve internal test domains. Production unaffected.', prio: 3 },
  { text: 'Old firewall rule cleanup requested',                 detail: '15 unused rules from decommissioned project. No security risk, just housekeeping.', prio: 3 },
  { text: 'Printer on guest network not responding',             detail: 'Conference room printer offline. Guests can use lobby printer instead.', prio: 3 },
  { text: 'Software license approaching renewal date',           detail: 'Antivirus license expires in 30 days. Auto-renewal configured.', prio: 3 },

  // P5 INFO
  { text: 'Monthly vulnerability report available',              detail: 'Scheduled scan completed. Report ready for review. No critical findings.', prio: 4 },
  { text: 'New security awareness training published',           detail: 'Q2 training module live. Employees have 30 days to complete.', prio: 4 },
  { text: 'Vendor released routine firmware update',             detail: 'Switch firmware v3.2.1 available. Bug fixes only, no security patches.', prio: 4 },
  { text: 'IT asset inventory audit completed',                  detail: 'All assets accounted for. 3 laptops need label updates.', prio: 4 },
  { text: 'Security team weekly standup notes shared',           detail: 'Meeting minutes distributed. No action items for your team.', prio: 4 },
  { text: 'Compliance documentation updated for ISO 27001',      detail: 'Annual review completed. Minor wording changes. No process changes.', prio: 4 },
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
  timer: number;        // countdown per question
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
  // Gunshot: short noise burst + low thud
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 2000;
  noise.connect(filter); filter.connect(g); g.connect(ctx.destination);
  noise.start();
  // Low thud
  tone(ctx, 80, 0.15, 'sine', 0.2);
};

const sfxHit = (ctx: AudioContext) => { tone(ctx, 1200, 0.06, 'square', 0.08); setTimeout(() => tone(ctx, 1600, 0.06, 'square', 0.06), 40); };
const sfxMiss = (ctx: AudioContext) => { tone(ctx, 200, 0.3, 'sawtooth', 0.08); };
const sfxTimeout = (ctx: AudioContext) => { tone(ctx, 300, 0.15, 'square', 0.06); setTimeout(() => tone(ctx, 200, 0.2, 'square', 0.06), 120); };
const sfxBell = (ctx: AudioContext) => { tone(ctx, 880, 0.1, 'sine', 0.12); setTimeout(() => tone(ctx, 1100, 0.15, 'sine', 0.1), 80); };
const sfxGameOver = (ctx: AudioContext) => { tone(ctx, 440, 0.2, 'square', 0.08); setTimeout(() => tone(ctx, 330, 0.25, 'sawtooth', 0.06), 200); setTimeout(() => tone(ctx, 220, 0.4, 'sawtooth', 0.05), 400); };

// BG Music – military / shooting range vibe
interface BGMusic { running: boolean; timer: ReturnType<typeof setInterval> | null; step: number; gain: GainNode; }
const RANGE_NOTES = [165, 196, 220, 262, 220, 196, 165, 147, 165, 220, 262, 294, 262, 220, 196, 165];
const startBGMusic = (ctx: AudioContext): BGMusic => {
  const gain = ctx.createGain(); gain.gain.value = 0.03; gain.connect(ctx.destination);
  const bg: BGMusic = { running: true, timer: null, step: 0, gain };
  bg.timer = setInterval(() => {
    if (!bg.running) return;
    const freq = RANGE_NOTES[bg.step % RANGE_NOTES.length];
    const osc = ctx.createOscillator();
    const ng = ctx.createGain();
    osc.type = bg.step % 3 === 0 ? 'triangle' : 'square';
    osc.frequency.value = freq;
    ng.gain.setValueAtTime(0.12, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(ng); ng.connect(bg.gain);
    osc.start(); osc.stop(ctx.currentTime + 0.22);
    if (bg.step % 4 === 0) {
      const b = ctx.createOscillator(); const bg2 = ctx.createGain();
      b.type = 'triangle'; b.frequency.value = freq / 2;
      bg2.gain.setValueAtTime(0.06, ctx.currentTime);
      bg2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      b.connect(bg2); bg2.connect(bg.gain); b.start(); b.stop(ctx.currentTime + 0.28);
    }
    bg.step++;
  }, 220);
  return bg;
};
const stopBGMusic = (bg: BGMusic | null) => { if (!bg) return; bg.running = false; if (bg.timer) clearInterval(bg.timer); };

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
  timer: 0, maxTime: 8,
  score: 0, streak: 0, bestStreak: 0, round: 0, maxRounds: 15,
  correct: 0, wrong: 0, lives: 3,
  particles: [], bulletHoles: [], muzzleFlash: null,
  lastResult: null, lastCorrectPrio: -1, resultTimer: 0,
  shakeT: 0, hi: getHi(), usedIncidents: [],
});

const rRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
};

/* ══════════════════════════════════════
   TARGET GEOMETRY – returns {x, y, radius} for each target
   ══════════════════════════════════════ */
const getTargets = (w: number, h: number) => {
  const targetY = h * 0.72;
  const radius = Math.min(w / 12, 44);
  const spacing = w / 6;
  return PRIOS.map((_, i) => ({
    x: spacing + i * spacing,
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
    const ac = audioRef.current;
    if (ac) sfxBell(ac);
  }, []);

  const startGame = useCallback(() => {
    gs.current = { ...mkGS(), phase: 'play' };
    gs.current.hi = getHi();
    const ac = ensureAudio();
    if (ac) {
      sfxBell(ac);
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

    // Muzzle flash
    g.muzzleFlash = { x: target.x, y: h - 30, life: 0.15 };
    if (ac) sfxShoot(ac);

    // Bullet hole on target
    g.bulletHoles.push({ x: target.x + (Math.random() - 0.5) * target.r * 0.5, y: target.y + (Math.random() - 0.5) * target.r * 0.5, life: 1.5 });

    if (targetIdx === g.currentIncident.prio) {
      // CORRECT
      g.lastResult = 'correct';
      g.lastCorrectPrio = g.currentIncident.prio;
      const timeBonus = Math.floor(g.timer * 20);
      const streakBonus = g.streak * 25;
      g.score += 100 + timeBonus + streakBonus;
      g.streak++; g.bestStreak = Math.max(g.bestStreak, g.streak);
      g.correct++;
      // Burst particles
      for (let i = 0; i < 25; i++) {
        const a = (Math.PI * 2 * i) / 25 + Math.random() * 0.3;
        const s = 100 + Math.random() * 150;
        g.particles.push({ x: target.x, y: target.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, color: PRIOS[targetIdx].color, size: 2 + Math.random() * 3 });
      }
      if (ac) sfxHit(ac);
    } else {
      // WRONG
      g.lastResult = 'wrong';
      g.lastCorrectPrio = g.currentIncident.prio;
      g.streak = 0;
      g.wrong++;
      g.lives--;
      g.shakeT = 0.3;
      if (ac) sfxMiss(ac);
      if (g.lives <= 0) {
        g.phase = 'over';
        saveHi(g.score); g.hi = Math.max(g.hi, g.score);
        if (ac) sfxGameOver(ac);
        stopBGMusic(bgRef.current); bgRef.current = null;
        return;
      }
    }
    g.resultTimer = 1.8;
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

  /* Mouse / Touch */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const handle = (cx: number, cy: number) => {
      const g = gs.current;
      const { w, h } = sizeRef.current;
      if (g.phase === 'start' || g.phase === 'over') { startGame(); return; }
      if (g.phase !== 'play') return;
      const targets = getTargets(w, h);
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const dx = cx - t.x, dy = cy - t.y;
        if (Math.sqrt(dx * dx + dy * dy) < t.r + 12) { shoot(i); return; }
      }
    };
    const onClick = (e: MouseEvent) => { const r = c.getBoundingClientRect(); handle(e.clientX - r.left, e.clientY - r.top); };
    const onTouch = (e: TouchEvent) => { e.preventDefault(); const r = c.getBoundingClientRect(); const t = e.touches[0]; handle(t.clientX - r.left, t.clientY - r.top); };
    c.addEventListener('mousedown', onClick);
    c.addEventListener('touchstart', onTouch, { passive: false });
    return () => { c.removeEventListener('mousedown', onClick); c.removeEventListener('touchstart', onTouch); };
  }, [startGame, shoot]);

  /* Crosshair cursor */
  useEffect(() => {
    const c = canvasRef.current;
    if (c) c.style.cursor = 'crosshair';
  }, []);

  /* ══════════════ GAME LOOP ══════════════ */
  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;
      const g = gs.current;
      const { w, h } = sizeRef.current;
      if (w === 0) { animRef.current = requestAnimationFrame(loop); return; }
      const ac = audioRef.current;

      /* ── UPDATE ── */
      if (g.phase === 'play') {
        g.timer -= dt;
        if (g.timer <= 0) {
          // Timeout
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
            g.resultTimer = 1.8; g.phase = 'result';
          }
        }
      }

      if (g.phase === 'result') {
        g.resultTimer -= dt;
        if (g.resultTimer <= 0) nextRound();
      }

      // Particles
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
      if (g.shakeT > 0) { const i = g.shakeT * 12; ctx.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i); }

      // ── Background: shooting range ──
      // Dark concrete wall
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
      wallGrad.addColorStop(0, '#0f1118');
      wallGrad.addColorStop(0.5, '#141822');
      wallGrad.addColorStop(1, '#0a0c12');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h);

      // Horizontal lane lines (range aesthetic)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Range lane dividers (vertical lines between targets)
      const targets = getTargets(w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const x = i * (w / 5);
        ctx.setLineDash([8, 12]);
        ctx.beginPath(); ctx.moveTo(x, h * 0.55); ctx.lineTo(x, h * 0.90); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Range ceiling rope (decorative)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, h * 0.50); ctx.lineTo(w, h * 0.50); ctx.stroke();

      // ── INCIDENT CARD (top) ──
      if ((g.phase === 'play' || g.phase === 'result') && g.currentIncident) {
        const cardW = Math.min(w - 40, 520);
        const cardX = (w - cardW) / 2;
        const cardY = 60;
        const cardH = 110;

        // Card shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#161a26';
        rRect(ctx, cardX, cardY, cardW, cardH, 10);
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // Card border
        ctx.strokeStyle = g.phase === 'result'
          ? (g.lastResult === 'correct' ? C.green + '80' : C.red + '80')
          : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = g.phase === 'result' ? 2 : 1;
        rRect(ctx, cardX, cardY, cardW, cardH, 10);
        ctx.stroke();

        // Incident text
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = C.white;
        // Word wrap title
        const maxCharsPerLine = Math.floor(cardW / 8);
        const words = g.currentIncident.text.split(' ');
        let line = '', lineY = cardY + 30;
        for (const word of words) {
          const test = line + (line ? ' ' : '') + word;
          if (test.length > maxCharsPerLine && line) {
            ctx.fillText(line, w / 2, lineY);
            line = word; lineY += 18;
          } else { line = test; }
        }
        if (line) ctx.fillText(line, w / 2, lineY);

        // Detail text
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.45)';
        const dWords = g.currentIncident.detail.split(' ');
        let dLine = ''; let dY = lineY + 22;
        for (const word of dWords) {
          const test = dLine + (dLine ? ' ' : '') + word;
          if (test.length > maxCharsPerLine + 10 && dLine) {
            ctx.fillText(dLine, w / 2, dY);
            dLine = word; dY += 14;
          } else { dLine = test; }
        }
        if (dLine) ctx.fillText(dLine, w / 2, dY);

        // Timer bar
        if (g.phase === 'play') {
          const barW = cardW - 20;
          const barX = cardX + 10;
          const barY = cardY + cardH - 12;
          const pct = Math.max(0, g.timer / g.maxTime);
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          rRect(ctx, barX, barY, barW, 5, 2); ctx.fill();
          ctx.fillStyle = pct > 0.3 ? C.cyan : (pct > 0.15 ? C.orange : C.red);
          rRect(ctx, barX, barY, barW * pct, 5, 2); ctx.fill();
        }

        // Result overlay on card
        if (g.phase === 'result' && g.lastResult) {
          ctx.font = 'bold 12px monospace';
          if (g.lastResult === 'correct') {
            ctx.fillStyle = C.green;
            ctx.fillText('✓ CORRECT – ' + PRIOS[g.lastCorrectPrio].name, w / 2, cardY + cardH + 20);
          } else {
            ctx.fillStyle = C.red;
            const label = g.lastResult === 'timeout' ? '⏱ TIME\'S UP' : '✕ WRONG';
            ctx.fillText(label + ' – Correct: ' + PRIOS[g.lastCorrectPrio].name, w / 2, cardY + cardH + 20);
          }
        }
      }

      // ── TARGETS ──
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const prio = PRIOS[i];
        const isCorrectResult = g.phase === 'result' && g.lastCorrectPrio === i;

        // Target post (line from bottom)
        ctx.strokeStyle = C.metalLight;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(t.x, t.y + t.r + 5); ctx.lineTo(t.x, h * 0.90); ctx.stroke();

        // Target glow if correct result
        if (isCorrectResult && g.lastResult !== 'correct') {
          ctx.shadowColor = prio.color; ctx.shadowBlur = 30;
        }

        // Outer ring
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1e2a';
        ctx.fill();
        ctx.strokeStyle = prio.color + '60'; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0;

        // Middle ring
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = prio.color + '40'; ctx.lineWidth = 1.5; ctx.stroke();

        // Inner ring
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = prio.color + '40'; ctx.lineWidth = 1; ctx.stroke();

        // Bullseye center
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = prio.color;
        ctx.fill();

        // Cross hairs on target
        ctx.strokeStyle = prio.color + '25'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(t.x - t.r, t.y); ctx.lineTo(t.x + t.r, t.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t.x, t.y - t.r); ctx.lineTo(t.x, t.y + t.r); ctx.stroke();

        // Label
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = prio.color;
        ctx.fillText(prio.short, t.x, t.y + t.r + 20);
        ctx.font = '8px monospace';
        ctx.fillStyle = prio.color + '70';
        ctx.fillText(prio.name.split(' ')[1] || '', t.x, t.y + t.r + 32);

        // Key hint
        ctx.font = '8px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillText('' + (i + 1), t.x, t.y + t.r + 44);
      }

      // Bullet holes
      for (const b of g.bulletHoles) {
        ctx.globalAlpha = Math.min(1, b.life * 2);
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
        // Small crack lines
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * i) / 4 + Math.random() * 0.3;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * 4, b.y + Math.sin(a) * 4);
          ctx.lineTo(b.x + Math.cos(a) * (8 + Math.random() * 6), b.y + Math.sin(a) * (8 + Math.random() * 6));
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Muzzle flash
      if (g.muzzleFlash) {
        const mf = g.muzzleFlash;
        ctx.globalAlpha = mf.life / 0.15;
        const flashSize = 30 + (1 - mf.life / 0.15) * 20;
        const grad = ctx.createRadialGradient(mf.x, mf.y, 0, mf.x, mf.y, flashSize);
        grad.addColorStop(0, C.muzzle);
        grad.addColorStop(0.5, C.orange + '60');
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

      // ── HUD ──
      if (g.phase !== 'start') {
        // Score
        ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, 16, 28);

        // Round
        ctx.font = '10px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText('ROUND ' + g.round + '/' + g.maxRounds, 16, 44);

        // Streak
        if (g.streak > 1) {
          ctx.textAlign = 'center'; ctx.fillStyle = C.cyan; ctx.font = 'bold 14px monospace';
          ctx.fillText(g.streak + '× STREAK', w / 2, 28);
        }

        // Lives (bullet icons)
        ctx.textAlign = 'right';
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < g.lives ? C.orange : 'rgba(255,255,255,0.1)';
          ctx.font = '14px monospace';
          ctx.fillText('◆', w - 14 - (2 - i) * 20, 28);
        }
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

      // ── Range floor ──
      ctx.fillStyle = '#0e1018';
      ctx.fillRect(0, h * 0.90, w, h * 0.1);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, h * 0.90); ctx.lineTo(w, h * 0.90); ctx.stroke();

      // Flash
      if (g.shakeT > 0) {
        ctx.fillStyle = `rgba(255,50,50,${g.shakeT * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      }

      /* ── START SCREEN ── */
      if (g.phase === 'start') {
        ctx.fillStyle = 'rgba(10,12,18,0.88)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        // Title
        ctx.shadowColor = C.red; ctx.shadowBlur = 30;
        ctx.font = 'bold 30px monospace'; ctx.fillStyle = C.red;
        ctx.fillText('TRIGGER TRIAGE', w / 2, h * 0.13);
        ctx.shadowBlur = 0;
        ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('INCIDENT PRIORITY RANGE', w / 2, h * 0.13 + 22);

        // How to play
        const ey = h * 0.24;
        ctx.font = 'bold 11px monospace'; ctx.fillStyle = C.yellow;
        ctx.fillText('HOW TO PLAY', w / 2, ey);
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
        const lines = [
          'An incident appears at the top.',
          'Read it carefully and decide:',
          'How critical is this incident?',
          '',
          'Shoot the correct priority target!',
          'Press 1-5 or click/tap a target.',
          'Faster answers = more points.',
        ];
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], w / 2, ey + 18 + i * 15);

        // Priority legend
        const ly = h * 0.55;
        for (let i = 0; i < 5; i++) {
          const y = ly + i * 22;
          ctx.fillStyle = PRIOS[i].color;
          ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
          ctx.fillText(PRIOS[i].short + '  ' + PRIOS[i].name.split(' ')[1], w / 2 - 110, y);
          ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillText(PRIOS[i].desc.slice(0, 40), w / 2 - 40, y);
          ctx.textAlign = 'center';
        }

        const mob = 'ontouchstart' in window;
        if (!mob) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '9px monospace';
          ctx.fillText('1-5 SHOOT  |  SPACE START', w / 2, h * 0.88);
        }
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.orange; ctx.font = 'bold 13px monospace'; ctx.fillText(mob ? 'TAP TO START' : 'PRESS SPACE', w / 2, h * 0.93); }
        if (gs.current.hi > 0) { ctx.fillStyle = C.yellow + '60'; ctx.font = '10px monospace'; ctx.fillText('HI ' + gs.current.hi, w / 2, h * 0.97); }
      }

      /* ── GAME OVER ── */
      if (g.phase === 'over') {
        ctx.fillStyle = 'rgba(10,12,18,0.8)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.shadowColor = C.red; ctx.shadowBlur = 20;
        ctx.font = 'bold 26px monospace'; ctx.fillStyle = C.red;
        ctx.fillText('RANGE CLOSED', w / 2, h * 0.22);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 40px monospace'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, w / 2, h * 0.38);
        ctx.font = '10px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText('SCORE', w / 2, h * 0.38 + 18);

        ctx.fillStyle = C.green; ctx.fillText('CORRECT: ' + g.correct, w / 2 - 60, h * 0.50);
        ctx.fillStyle = C.red; ctx.fillText('WRONG: ' + g.wrong, w / 2 + 60, h * 0.50);

        const acc = g.correct + g.wrong > 0 ? Math.round((g.correct / (g.correct + g.wrong)) * 100) : 0;
        ctx.fillStyle = acc >= 70 ? C.green : (acc >= 50 ? C.yellow : C.red);
        ctx.font = 'bold 14px monospace';
        ctx.fillText(acc + '% ACCURACY', w / 2, h * 0.58);

        if (g.bestStreak > 1) { ctx.fillStyle = C.cyan; ctx.font = '10px monospace'; ctx.fillText('BEST STREAK: ' + g.bestStreak + '×', w / 2, h * 0.65); }

        ctx.fillStyle = g.score >= g.hi && g.hi > 0 ? C.yellow : C.dim;
        ctx.font = '10px monospace';
        ctx.fillText('HI ' + g.hi + (g.score >= g.hi && g.score > 0 ? ' ★ NEW' : ''), w / 2, h * 0.72);

        const mob = 'ontouchstart' in window;
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.orange; ctx.font = 'bold 12px monospace'; ctx.fillText(mob ? 'TAP TO RESTART' : 'SPACE / R', w / 2, h * 0.82); }
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
