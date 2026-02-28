import { useRef, useEffect, useCallback } from 'react';
import { PageMeta } from '@/components/PageMeta';

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
   LANES – Incident Response Lifecycle
   ══════════════════════════════════════ */
const LANES = [
  { name: 'DETECT',    color: C.cyan,   sym: '◎', desc: 'Identify the threat',   key: '1' },
  { name: 'CONTAIN',   color: C.pink,   sym: '◇', desc: 'Stop the spread',       key: '2' },
  { name: 'ERADICATE', color: C.lime,   sym: '✕', desc: 'Remove the threat',     key: '3' },
  { name: 'RECOVER',   color: C.yellow, sym: '↻', desc: 'Restore operations',    key: '4' },
];

/* ══════════════════════════════════════
   THREATS – mapped to correct IR phase
   ══════════════════════════════════════ */
const THREATS = [
  // DETECT(0)
  { label: 'MFA FATIGUE',  lane: 0 },
  { label: 'DNS TUNNEL',   lane: 0 },
  { label: 'EXFILTRATION', lane: 0 },
  { label: 'PORT SCAN',    lane: 0 },
  { label: 'C2 BEACON',    lane: 0 },
  { label: 'BRUTE FORCE',  lane: 0 },
  { label: 'PHISHING',     lane: 0 },
  { label: 'CRED DUMP',    lane: 0 },
  { label: 'ANOMALY',      lane: 0 },
  { label: 'RECON SCAN',   lane: 0 },
  // CONTAIN(1)
  { label: 'GOLDEN TICKET', lane: 1 },
  { label: 'OAUTH ABUSE',   lane: 1 },
  { label: 'LATERAL MOVE',  lane: 1 },
  { label: 'PRIV ESC',      lane: 1 },
  { label: 'ZERO DAY',      lane: 1 },
  { label: 'ROGUE ADMIN',   lane: 1 },
  { label: 'INSIDER',       lane: 1 },
  { label: 'SHADOW IT',     lane: 1 },
  { label: 'VPN ABUSE',     lane: 1 },
  { label: 'SUPPLY CHAIN',  lane: 1 },
  // ERADICATE(2)
  { label: 'WEB SHELL',    lane: 2 },
  { label: 'MALWARE',      lane: 2 },
  { label: 'ROOTKIT',      lane: 2 },
  { label: 'BACKDOOR',     lane: 2 },
  { label: 'CRYPTOMINER',  lane: 2 },
  { label: 'RAT',          lane: 2 },
  { label: 'TROJAN',       lane: 2 },
  { label: 'WORM',         lane: 2 },
  { label: 'BOTNET',       lane: 2 },
  { label: 'APT IMPLANT',  lane: 2 },
  // RECOVER(3)
  { label: 'RANSOMWARE',   lane: 3 },
  { label: 'BACKUP WIPE',  lane: 3 },
  { label: 'DATA BREACH',  lane: 3 },
  { label: 'DB CORRUPT',   lane: 3 },
  { label: 'CONFIG DRIFT', lane: 3 },
  { label: 'SITE DOWN',    lane: 3 },
  { label: 'KEY LEAK',     lane: 3 },
  { label: 'CERT EXPIRE',  lane: 3 },
  { label: 'DNS HIJACK',   lane: 3 },
  { label: 'LOG WIPE',     lane: 3 },
];

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */
interface Threat {
  id: number; label: string; lane: number; // correct lane
  x: number; y: number; speed: number;     // x = random horizontal position
  caught: boolean; missed: boolean; timer: number;
  feedbackColor: string;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Popup { text: string; x: number; y: number; life: number; color: string; }
interface GS {
  phase: 'start' | 'play' | 'over';
  selectedLane: number; // which lane the player has chosen (highlighted)
  threats: Threat[]; particles: Particle[]; popups: Popup[];
  score: number; combo: number; bestCombo: number; lives: number;
  time: number; spawnT: number; baseSpd: number;
  shakeT: number; flashT: number; slowT: number; shield: boolean;
  nextId: number; hi: number;
  // The active threat the player must classify
  activeIdx: number; // index into threats array of the lowest active threat, or -1
}

/* ══════════════════════════════════════
   AUDIO – 80s Arcade Beeps
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
   HELPERS
   ══════════════════════════════════════ */
const HI_KEY = 'threatdrop-hi';
const getHi = () => { try { return +(localStorage.getItem(HI_KEY) || 0); } catch { return 0; } };
const saveHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HI_KEY, '' + s); } catch {} };

const mkGS = (): GS => ({
  phase: 'start', selectedLane: -1,
  threats: [], particles: [], popups: [],
  score: 0, combo: 0, bestCombo: 0, lives: 3,
  time: 0, spawnT: 1.8, baseSpd: 70,
  shakeT: 0, flashT: 0, slowT: 0, shield: false,
  nextId: 0, hi: getHi(), activeIdx: -1,
});

const spawnThreat = (g: GS, w: number, yOff = 0) => {
  const t = THREATS[Math.floor(Math.random() * THREATS.length)];
  // Threat falls down the center area (slight random offset)
  const centerX = w / 2 + (Math.random() - 0.5) * w * 0.3;
  g.threats.push({
    id: g.nextId++, label: t.label, lane: t.lane,
    x: centerX, y: -50 + yOff,
    speed: g.baseSpd + Math.min(g.combo * 2, 60),
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

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) { try { audioRef.current = new AudioContext(); } catch {} }
    return audioRef.current;
  }, []);

  const startGame = useCallback(() => {
    const hi = gs.current.hi;
    gs.current = { ...mkGS(), phase: 'play', hi };
    const a = ensureAudio();
    if (a) sfxStart(a);
  }, [ensureAudio]);

  /* ── Try to classify the lowest active threat ── */
  const classifyThreat = useCallback((chosenLane: number) => {
    const g = gs.current;
    if (g.phase !== 'play') return;
    // Find the lowest (closest to bottom) uncaught/unmissed threat
    let lowest: Threat | null = null;
    for (const t of g.threats) {
      if (t.caught || t.missed) continue;
      if (!lowest || t.y > lowest.y) lowest = t;
    }
    if (!lowest) return;
    const ac = audioRef.current;

    if (chosenLane === lowest.lane) {
      // CORRECT
      lowest.caught = true; lowest.timer = 0;
      lowest.feedbackColor = LANES[lowest.lane].color;
      const pts = 100 + g.combo * 15;
      g.score += pts; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
      burst(g, lowest.x, lowest.y, LANES[lowest.lane].color);
      g.popups.push({ text: '+' + pts, x: lowest.x, y: lowest.y - 20, life: 0.8, color: LANES[lowest.lane].color });
      g.baseSpd = Math.min(180, 70 + g.combo * 2);
      if (ac) { if (g.combo % 5 === 0) sfxCombo(ac); else sfxCatch(ac); }
      if (g.combo === 5) { g.slowT = 5; g.popups.push({ text: '⏱ SLOW TIME', x: sizeRef.current.w / 2, y: sizeRef.current.h / 2, life: 1.2, color: C.cyan }); }
      if (g.combo === 15) { g.shield = true; g.popups.push({ text: '◆ SHIELD', x: sizeRef.current.w / 2, y: sizeRef.current.h / 2, life: 1.2, color: C.pink }); }
    } else {
      // WRONG – show correct answer briefly
      lowest.missed = true; lowest.timer = 0;
      lowest.feedbackColor = C.red;
      g.popups.push({ text: '✕ → ' + LANES[lowest.lane].name, x: lowest.x, y: lowest.y - 20, life: 1.2, color: C.red });
      if (g.shield) { g.shield = false; }
      else { g.lives--; g.combo = 0; g.shakeT = 0.3; g.flashT = 0.3; }
      if (ac) sfxMiss(ac);
      if (g.lives <= 0) { g.phase = 'over'; saveHi(g.score); g.hi = Math.max(g.hi, g.score); if (ac) sfxGameOver(ac); }
    }
    g.selectedLane = -1;
  }, []);

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
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gs.current;
      if (g.phase === 'start' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'over' && (e.key === 'r' || e.key === 'R' || e.key === ' ')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'play') {
        // Direct lane selection = classification
        if (e.key >= '1' && e.key <= '4') { e.preventDefault(); classifyThreat(+e.key - 1); return; }
        // Arrow keys highlight, Enter confirms
        if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); g.selectedLane = Math.max(0, (g.selectedLane < 0 ? 1 : g.selectedLane) - 1); }
        if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); g.selectedLane = Math.min(3, (g.selectedLane < 0 ? 0 : g.selectedLane) + 1); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (g.selectedLane >= 0) classifyThreat(g.selectedLane);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame, classifyThreat]);

  /* Touch / Click – tap on lane buttons at bottom */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const handle = (cx: number, cy: number) => {
      const g = gs.current;
      const { w, h } = sizeRef.current;
      if (g.phase !== 'play') { startGame(); return; }
      // Bottom 70px = lane buttons
      if (cy > h - 70) {
        const lane = Math.max(0, Math.min(3, Math.floor(cx / (w / 4))));
        classifyThreat(lane);
      }
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

      const lw = w / 4;
      const deadlineY = h - 80; // threat must be classified before reaching here
      const ac = audioRef.current;

      /* ── UPDATE ── */
      if (g.phase === 'play') {
        g.time += dt;

        // Spawn
        g.spawnT -= dt;
        if (g.spawnT <= 0) {
          spawnThreat(g, w);
          const interval = Math.max(1.2, 3.0 - g.time * 0.008 - g.combo * 0.03);
          g.spawnT = interval * (0.85 + Math.random() * 0.3);
          if (g.combo >= 10 && Math.random() < 0.25) spawnThreat(g, w, -120);
        }

        const sm = g.slowT > 0 ? 0.35 : 1;
        g.slowT = Math.max(0, g.slowT - dt);

        const rm: number[] = [];
        for (const t of g.threats) {
          if (t.caught || t.missed) {
            t.timer += dt;
            if (t.timer > 0.5) rm.push(t.id);
            continue;
          }
          t.y += t.speed * sm * dt;

          // Threat reached deadline without being classified
          if (t.y >= deadlineY) {
            t.missed = true; t.timer = 0;
            t.feedbackColor = C.red;
            g.popups.push({ text: '✕ ' + LANES[t.lane].name, x: t.x, y: t.y - 20, life: 1.0, color: C.red });
            if (g.shield) { g.shield = false; }
            else { g.lives--; g.combo = 0; g.shakeT = 0.3; g.flashT = 0.3; if (ac) sfxMiss(ac); }
            if (g.lives <= 0) { g.phase = 'over'; saveHi(g.score); g.hi = Math.max(g.hi, g.score); if (ac) sfxGameOver(ac); }
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
      const c = canvasRef.current;
      if (!c) { animRef.current = requestAnimationFrame(loop); return; }
      const ctx = c.getContext('2d');
      if (!ctx) { animRef.current = requestAnimationFrame(loop); return; }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (g.shakeT > 0) { const i = g.shakeT * 15; ctx.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i); }

      // BG + Grid
      ctx.fillStyle = C.bg; ctx.fillRect(-10, -10, w + 20, h + 20);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Deadline line (dashed)
      if (g.phase === 'play') {
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = C.red + '30'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, deadlineY); ctx.lineTo(w, deadlineY); ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── LANE BUTTONS (bottom bar) ──
      const btnH = 60;
      const btnY = h - btnH;
      for (let i = 0; i < 4; i++) {
        const lane = LANES[i];
        const bx = i * lw;
        const selected = g.selectedLane === i;
        // Button background
        ctx.fillStyle = selected ? lane.color + '25' : '#0d0f18';
        ctx.fillRect(bx, btnY, lw, btnH);
        // Border
        ctx.strokeStyle = selected ? lane.color : lane.color + '30';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(bx + 0.5, btnY + 0.5, lw - 1, btnH - 1);
        // Symbol
        ctx.textAlign = 'center';
        ctx.font = '18px monospace'; ctx.fillStyle = lane.color + (selected ? 'ff' : '90');
        ctx.fillText(lane.sym, bx + lw / 2, btnY + 24);
        // Name
        ctx.font = 'bold 8px monospace'; ctx.fillStyle = lane.color + (selected ? 'dd' : '60');
        ctx.fillText(lane.name, bx + lw / 2, btnY + 40);
        // Key hint
        ctx.font = '8px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(lane.key, bx + lw / 2, btnY + 52);
      }

      // ── THREATS ──
      for (const t of g.threats) {
        const tw = Math.min(lw * 0.9, 130), th = 40;
        let alpha = 1, scale = 1;
        const col = t.caught || t.missed ? t.feedbackColor : C.white;
        if (t.caught) { alpha = 1 - t.timer / 0.5; scale = 1 + t.timer * 1.5; }
        if (t.missed && !t.caught) { alpha = Math.max(0, 1 - t.timer / 0.5); }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(t.x, t.y);
        ctx.scale(scale, scale);

        // Glow based on proximity to deadline
        const urgency = Math.max(0, 1 - Math.abs(t.y - deadlineY) / 250);
        ctx.shadowColor = t.caught ? LANES[t.lane].color : (urgency > 0.5 ? C.red : C.cyan);
        ctx.shadowBlur = 6 + urgency * 14;

        // Card
        ctx.fillStyle = '#0c0e18ee';
        ctx.strokeStyle = col + (t.caught || t.missed ? '' : '80');
        ctx.lineWidth = t.caught ? 2.5 : 1.5;
        rRect(ctx, -tw / 2, -th / 2, tw, th, 7);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(t.label, 0, 4);

        // If caught, show correct lane icon
        if (t.caught) {
          ctx.font = '10px monospace';
          ctx.fillStyle = LANES[t.lane].color;
          ctx.fillText(LANES[t.lane].sym + ' ' + LANES[t.lane].name, 0, -th / 2 - 6);
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

      // ── HUD ──
      if (g.phase === 'play' || g.phase === 'over') {
        ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, 16, 28);
        if (g.combo > 1) { ctx.textAlign = 'center'; ctx.fillStyle = C.cyan; ctx.font = 'bold 20px monospace'; ctx.fillText(g.combo + '×', w / 2, 30); }
        ctx.textAlign = 'right';
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < g.lives ? C.red : 'rgba(255,255,255,0.1)'; ctx.font = '16px monospace'; ctx.fillText('♥', w - 14 - (2 - i) * 22, 28); }
        if (g.slowT > 0) { ctx.textAlign = 'left'; ctx.font = '10px monospace'; ctx.fillStyle = C.cyan; ctx.fillText('⏱ ' + g.slowT.toFixed(1) + 's', 16, 48); }
        if (g.shield) { ctx.textAlign = 'left'; ctx.font = '10px monospace'; ctx.fillStyle = C.pink; ctx.fillText('◆ SHIELD', 16, g.slowT > 0 ? 62 : 48); }
      }

      // Flash
      if (g.flashT > 0) { ctx.fillStyle = `rgba(255,50,50,${g.flashT * 0.4})`; ctx.fillRect(-10, -10, w + 20, h + 20); }

      // Scanlines + Vignette
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
      vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      /* ── START SCREEN ── */
      if (g.phase === 'start') {
        ctx.fillStyle = 'rgba(5,6,10,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        // Title
        ctx.shadowColor = C.cyan; ctx.shadowBlur = 25;
        ctx.font = 'bold 28px monospace'; ctx.fillStyle = C.cyan;
        ctx.fillText('THREATDROP', w / 2, h * 0.14);
        ctx.shadowBlur = 0;
        ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('INCIDENT RESPONSE ARCADE', w / 2, h * 0.14 + 20);

        // How to play
        const ey = h * 0.25;
        ctx.font = 'bold 11px monospace'; ctx.fillStyle = C.yellow;
        ctx.fillText('HOW TO PLAY', w / 2, ey);
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const lines = [
          'Cyber threats fall from above.',
          'Read each threat label and decide:',
          'Which IR phase handles it?',
          '',
          'Press 1-4 or click the lane to classify.',
          'Be fast – threats won\'t wait!',
        ];
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], w / 2, ey + 18 + i * 15);
        }

        // Lane legend
        const ly = h * 0.52;
        ctx.font = 'bold 10px monospace';
        for (let i = 0; i < 4; i++) {
          const y = ly + i * 26;
          ctx.fillStyle = LANES[i].color;
          ctx.font = '16px monospace';
          ctx.fillText(LANES[i].sym, w / 2 - 100, y + 2);
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(LANES[i].key + '  ' + LANES[i].name, w / 2 - 80, y + 2);
          ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillText('– ' + LANES[i].desc, w / 2 + 10, y + 2);
          ctx.textAlign = 'center';
        }

        // Examples
        const exY = ly + 4 * 26 + 14;
        ctx.font = '9px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText('PHISHING → DETECT  |  ROOTKIT → ERADICATE', w / 2, exY);
        ctx.fillText('PRIV ESC → CONTAIN  |  RANSOMWARE → RECOVER', w / 2, exY + 14);

        // Controls
        const mob = 'ontouchstart' in window;
        if (!mob) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '9px monospace';
          ctx.fillText('1-4 CLASSIFY  |  ← → + ENTER  |  SPACE START', w / 2, h * 0.88);
        }

        // Start prompt
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 13px monospace'; ctx.fillText(mob ? 'TAP TO START' : 'PRESS SPACE', w / 2, h * 0.93); }
        if (g.hi > 0) { ctx.fillStyle = C.yellow + '60'; ctx.font = '10px monospace'; ctx.fillText('HI ' + g.hi, w / 2, h * 0.97); }
      }

      /* ── GAME OVER ── */
      if (g.phase === 'over') {
        ctx.fillStyle = 'rgba(5,6,10,0.75)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.shadowColor = C.red; ctx.shadowBlur = 20; ctx.font = 'bold 26px monospace'; ctx.fillStyle = C.red;
        ctx.fillText('GAME OVER', w / 2, h * 0.30); ctx.shadowBlur = 0;
        ctx.font = 'bold 38px monospace'; ctx.fillStyle = C.white; ctx.fillText('' + g.score, w / 2, h * 0.44);
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('SCORE', w / 2, h * 0.44 + 18);
        if (g.bestCombo > 1) { ctx.fillStyle = C.cyan; ctx.fillText('BEST COMBO ' + g.bestCombo + '×', w / 2, h * 0.56); }
        ctx.fillStyle = g.score >= g.hi && g.hi > 0 ? C.yellow : 'rgba(255,255,255,0.35)';
        ctx.fillText('HI ' + g.hi + (g.score >= g.hi && g.score > 0 ? ' ★ NEW' : ''), w / 2, h * 0.64);
        const mob = 'ontouchstart' in window;
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 12px monospace'; ctx.fillText(mob ? 'TAP TO RESTART' : 'SPACE / R', w / 2, h * 0.77); }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    lastT.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${embedded ? 'w-full h-[500px] rounded-xl' : 'w-full h-screen'}`}
      style={{ background: C.bg, cursor: 'pointer' }}
    >
      {!embedded && <PageMeta title="ThreatDrop" description="Arcade Cybersecurity Game" />}
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ThreatDropQuiz;
