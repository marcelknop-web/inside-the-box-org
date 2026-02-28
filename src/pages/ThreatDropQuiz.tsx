import { useRef, useEffect, useCallback } from 'react';
import { PageMeta } from '@/components/PageMeta';

/* ══════════════════════════════════════
   COLORS
   ══════════════════════════════════════ */
const C = {
  bg: '#05060a', cyan: '#00e5ff', pink: '#ff2bd6',
  lime: '#a7ff1a', yellow: '#ffd000', red: '#ff3b3b',
  white: '#ffffff', grid: 'rgba(255,255,255,0.04)',
};

/* ══════════════════════════════════════
   LANES – Incident Response Lifecycle
   ══════════════════════════════════════ */
const LANES = [
  { name: 'DETECT',    color: C.cyan,   sym: '◎', desc: 'Identify the threat' },
  { name: 'CONTAIN',   color: C.pink,   sym: '◇', desc: 'Stop the spread' },
  { name: 'ERADICATE', color: C.lime,   sym: '✕', desc: 'Remove the threat' },
  { name: 'RECOVER',   color: C.yellow, sym: '↻', desc: 'Restore operations' },
];

/* ══════════════════════════════════════
   THREATS – mapped to correct IR phase
   DETECT(0):    Reconnaissance, alerting, monitoring anomalies
   CONTAIN(1):   Isolate, revoke access, block spread
   ERADICATE(2): Remove malware, implants, persistence
   RECOVER(3):   Restore services, data, configurations
   ══════════════════════════════════════ */
const THREATS = [
  // ── DETECT: you find & alert on these ──
  { label: 'MFA FATIGUE',  lane: 0 },  // detect abnormal push patterns
  { label: 'DNS TUNNEL',   lane: 0 },  // detect via DNS analytics
  { label: 'EXFILTRATION', lane: 0 },  // detect data leaving the org
  { label: 'PORT SCAN',    lane: 0 },  // detect recon activity
  { label: 'C2 BEACON',    lane: 0 },  // detect C2 communications
  { label: 'BRUTE FORCE',  lane: 0 },  // detect failed login spikes
  { label: 'PHISHING',     lane: 0 },  // detect malicious emails
  { label: 'CRED DUMP',    lane: 0 },  // detect credential harvesting
  { label: 'ANOMALY',      lane: 0 },  // detect unusual behavior (UBA)
  { label: 'RECON SCAN',   lane: 0 },  // detect scanning activity

  // ── CONTAIN: isolate, block, revoke ──
  { label: 'GOLDEN TICKET', lane: 1 }, // reset KRBTGT, contain Kerberos abuse
  { label: 'OAUTH ABUSE',   lane: 1 }, // revoke tokens, block app
  { label: 'LATERAL MOVE',  lane: 1 }, // network segmentation
  { label: 'PRIV ESC',      lane: 1 }, // disable escalated account
  { label: 'ZERO DAY',      lane: 1 }, // compensating controls (can't patch yet)
  { label: 'ROGUE ADMIN',   lane: 1 }, // disable account immediately
  { label: 'INSIDER',       lane: 1 }, // restrict access, monitor
  { label: 'SHADOW IT',     lane: 1 }, // isolate unauthorized systems
  { label: 'VPN ABUSE',     lane: 1 }, // revoke VPN access
  { label: 'SUPPLY CHAIN',  lane: 1 }, // isolate compromised component

  // ── ERADICATE: remove the infection ──
  { label: 'WEB SHELL',    lane: 2 },  // remove from server
  { label: 'MALWARE',      lane: 2 },  // clean/remove
  { label: 'ROOTKIT',      lane: 2 },  // remove (reimage if needed)
  { label: 'BACKDOOR',     lane: 2 },  // remove persistence mechanism
  { label: 'CRYPTOMINER',  lane: 2 },  // remove from infrastructure
  { label: 'RAT',          lane: 2 },  // remove remote access trojan
  { label: 'TROJAN',       lane: 2 },  // remove trojan
  { label: 'WORM',         lane: 2 },  // remove from all systems
  { label: 'BOTNET',       lane: 2 },  // remove bot agents
  { label: 'APT IMPLANT',  lane: 2 },  // remove persistent implant

  // ── RECOVER: restore normal ops ──
  { label: 'RANSOMWARE',   lane: 3 },  // restore from backup
  { label: 'BACKUP WIPE',  lane: 3 },  // restore backup infrastructure
  { label: 'DATA BREACH',  lane: 3 },  // restore services, notify stakeholders
  { label: 'DB CORRUPT',   lane: 3 },  // restore database from backup
  { label: 'CONFIG DRIFT', lane: 3 },  // restore correct configuration
  { label: 'SITE DOWN',    lane: 3 },  // restore web services
  { label: 'KEY LEAK',     lane: 3 },  // rotate & reissue keys
  { label: 'CERT EXPIRE',  lane: 3 },  // renew certificates
  { label: 'DNS HIJACK',   lane: 3 },  // restore DNS records
  { label: 'LOG WIPE',     lane: 3 },  // restore logs from backup
];

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */
interface Threat { id: number; label: string; lane: number; y: number; speed: number; caught: boolean; timer: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }
interface Popup { text: string; x: number; y: number; life: number; color: string; }
interface GS {
  phase: 'start' | 'play' | 'over';
  pLane: number; pX: number;
  threats: Threat[]; particles: Particle[]; popups: Popup[];
  score: number; combo: number; bestCombo: number; lives: number;
  time: number; spawnT: number; baseSpd: number;
  shakeT: number; flashT: number; slowT: number; shield: boolean;
  nextId: number; hi: number;
}

/* ══════════════════════════════════════
   AUDIO – 80s Arcade Beeps (Web Audio)
   ══════════════════════════════════════ */
const tone = (ctx: AudioContext, freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
};

const sfxCatch = (ctx: AudioContext) => {
  tone(ctx, 880, 0.08); setTimeout(() => tone(ctx, 1320, 0.06), 40);
};
const sfxMiss = (ctx: AudioContext) => {
  tone(ctx, 180, 0.25, 'sawtooth', 0.1);
};
const sfxCombo = (ctx: AudioContext) => {
  tone(ctx, 660, 0.06); setTimeout(() => tone(ctx, 990, 0.06), 50);
  setTimeout(() => tone(ctx, 1320, 0.1), 100);
};
const sfxGameOver = (ctx: AudioContext) => {
  tone(ctx, 440, 0.2, 'square', 0.1);
  setTimeout(() => tone(ctx, 330, 0.2, 'square', 0.1), 180);
  setTimeout(() => tone(ctx, 220, 0.4, 'sawtooth', 0.08), 360);
};
const sfxStart = (ctx: AudioContext) => {
  tone(ctx, 440, 0.06); setTimeout(() => tone(ctx, 660, 0.06), 50);
  setTimeout(() => tone(ctx, 880, 0.1), 100);
};

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
const HI_KEY = 'threatdrop-hi';
const getHi = () => { try { return +(localStorage.getItem(HI_KEY) || 0); } catch { return 0; } };
const saveHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HI_KEY, '' + s); } catch {} };

const mkGS = (): GS => ({
  phase: 'start', pLane: 1, pX: 0,
  threats: [], particles: [], popups: [],
  score: 0, combo: 0, bestCombo: 0, lives: 3,
  time: 0, spawnT: 1.5, baseSpd: 110,
  shakeT: 0, flashT: 0, slowT: 0, shield: false,
  nextId: 0, hi: getHi(),
});

const spawnThreat = (g: GS, yOff = 0) => {
  const t = THREATS[Math.floor(Math.random() * THREATS.length)];
  g.threats.push({ id: g.nextId++, label: t.label, lane: t.lane, y: -50 + yOff, speed: g.baseSpd + g.combo * 3, caught: false, timer: 0 });
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
        if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); g.pLane = Math.max(0, g.pLane - 1); }
        if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); g.pLane = Math.min(3, g.pLane + 1); }
        if (e.key >= '1' && e.key <= '4') { e.preventDefault(); g.pLane = +e.key - 1; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame]);

  /* Touch / Click */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const handle = (cx: number) => {
      const g = gs.current;
      if (g.phase !== 'play') { startGame(); return; }
      const rect = c.getBoundingClientRect();
      g.pLane = Math.max(0, Math.min(3, Math.floor((cx - rect.left) / (rect.width / 4))));
    };
    const onClick = (e: MouseEvent) => handle(e.clientX);
    const onTouch = (e: TouchEvent) => { e.preventDefault(); handle(e.touches[0].clientX); };
    const onTouchMove = (e: TouchEvent) => {
      if (gs.current.phase !== 'play') return;
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      gs.current.pLane = Math.max(0, Math.min(3, Math.floor((e.touches[0].clientX - rect.left) / (rect.width / 4))));
    };
    c.addEventListener('mousedown', onClick);
    c.addEventListener('touchstart', onTouch, { passive: false });
    c.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => { c.removeEventListener('mousedown', onClick); c.removeEventListener('touchstart', onTouch); c.removeEventListener('touchmove', onTouchMove); };
  }, [startGame]);

  /* ══════════════ GAME LOOP ══════════════ */
  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;
      const g = gs.current;
      const { w, h } = sizeRef.current;
      if (w === 0) { animRef.current = requestAnimationFrame(loop); return; }

      const lw = w / 4;
      const catchY = h - 58;
      const ac = audioRef.current;

      /* ── UPDATE ── */
      if (g.phase === 'play') {
        g.time += dt;
        const tx = g.pLane * lw + lw / 2;
        g.pX += (tx - g.pX) * 0.18;

        g.spawnT -= dt;
        if (g.spawnT <= 0) {
          spawnThreat(g);
          const interval = Math.max(0.7, 2.2 - g.time * 0.012);
          g.spawnT = interval * (0.8 + Math.random() * 0.4);
          if (g.combo >= 10 && Math.random() < 0.3) spawnThreat(g, -80);
        }

        const sm = g.slowT > 0 ? 0.35 : 1;
        g.slowT = Math.max(0, g.slowT - dt);

        const rm: number[] = [];
        for (const t of g.threats) {
          if (t.caught) { t.timer += dt; if (t.timer > 0.25) rm.push(t.id); continue; }
          t.y += t.speed * sm * dt;

          if (t.y >= catchY - 35 && t.y <= catchY + 15 && !t.caught && g.pLane === t.lane) {
            t.caught = true; t.timer = 0;
            const pts = 100 + g.combo * 10;
            g.score += pts; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
            burst(g, g.pX, catchY, LANES[t.lane].color);
            g.popups.push({ text: '+' + pts, x: g.pX, y: catchY - 10, life: 0.7, color: LANES[t.lane].color });
            g.baseSpd = 110 + g.combo * 3;
            if (ac) { if (g.combo % 5 === 0) sfxCombo(ac); else sfxCatch(ac); }
            if (g.combo === 5) { g.slowT = 5; g.popups.push({ text: '⏱ SLOW TIME', x: w / 2, y: h / 2, life: 1.2, color: C.cyan }); }
            if (g.combo === 15) { g.shield = true; g.popups.push({ text: '◆ SHIELD', x: w / 2, y: h / 2, life: 1.2, color: C.pink }); }
          }

          if (t.y > h + 20 && !t.caught) {
            rm.push(t.id);
            if (g.shield) { g.shield = false; }
            else { g.lives--; g.combo = 0; g.shakeT = 0.3; g.flashT = 0.3; if (ac) sfxMiss(ac); }
            if (g.lives <= 0) { g.phase = 'over'; saveHi(g.score); g.hi = Math.max(g.hi, g.score); if (ac) sfxGameOver(ac); }
          }
        }
        g.threats = g.threats.filter(t => !rm.includes(t.id));

        for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 200 * dt; }
        g.particles = g.particles.filter(p => p.life > 0);
        for (const p of g.popups) { p.y -= 60 * dt; p.life -= dt; }
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

      // Lane dividers
      ctx.setLineDash([4, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * lw, 0); ctx.lineTo(i * lw, h); ctx.stroke(); }
      ctx.setLineDash([]);

      // Lane labels + highlights
      for (let i = 0; i < 4; i++) {
        const lane = LANES[i]; const cx = i * lw + lw / 2;
        if (g.phase === 'play' && g.pLane === i) { ctx.fillStyle = lane.color + '0a'; ctx.fillRect(i * lw, 0, lw, h); }
        ctx.textAlign = 'center';
        ctx.font = '16px monospace'; ctx.fillStyle = lane.color + (g.pLane === i ? 'cc' : '50');
        ctx.fillText(lane.sym, cx, h - 22);
        ctx.font = 'bold 9px monospace'; ctx.fillText(lane.name, cx, h - 8);
      }

      // Catcher
      if (g.phase === 'play' || g.phase === 'over') {
        const cw = lw * 0.8, ch = 10;
        const lc = LANES[g.pLane].color;
        ctx.shadowColor = lc; ctx.shadowBlur = 16;
        ctx.fillStyle = lc + '35'; ctx.strokeStyle = lc; ctx.lineWidth = 2;
        rRect(ctx, g.pX - cw / 2, catchY - ch / 2, cw, ch, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(g.pX, catchY, 3, 0, Math.PI * 2); ctx.fillStyle = lc; ctx.fill();
        ctx.shadowBlur = 0;
        if (g.shield) { ctx.strokeStyle = C.pink + '50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(g.pX, catchY, cw / 2 + 6, 0, Math.PI * 2); ctx.stroke(); }
      }

      // Threats
      for (const t of g.threats) {
        const lc = LANES[t.lane].color; const cx = t.lane * lw + lw / 2;
        const tw = lw * 0.72, th = 36;
        let alpha = 1, scale = 1;
        if (t.caught) { alpha = 1 - t.timer / 0.25; scale = 1 + t.timer * 2; }
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, t.y); ctx.scale(scale, scale);
        ctx.shadowColor = lc; ctx.shadowBlur = 8 + Math.max(0, 1 - Math.abs(t.y - catchY) / 200) * 12;
        ctx.fillStyle = '#0a0c14ee'; ctx.strokeStyle = lc; ctx.lineWidth = 1.5;
        rRect(ctx, -tw / 2, -th / 2, tw, th, 6); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = lc;
        ctx.fillText(t.label, 0, 4);
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
        ctx.globalAlpha = Math.min(1, p.life * 1.5); ctx.font = 'bold 14px monospace';
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
        ctx.fillStyle = 'rgba(5,6,10,0.8)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        // Title
        ctx.shadowColor = C.cyan; ctx.shadowBlur = 25;
        ctx.font = 'bold 28px monospace'; ctx.fillStyle = C.cyan;
        ctx.fillText('THREATDROP', w / 2, h * 0.18);
        ctx.shadowBlur = 0;
        ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('INCIDENT RESPONSE ARCADE', w / 2, h * 0.18 + 20);

        // Explanation
        const ey = h * 0.30;
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Threats fall from above. Move the catcher', w / 2, ey);
        ctx.fillText('to the correct Incident Response phase:', w / 2, ey + 16);

        // Lane legend with descriptions
        const ly = h * 0.42;
        const spacing = w < 400 ? 14 : 16;
        for (let i = 0; i < 4; i++) {
          const y = ly + i * (spacing + 10);
          ctx.fillStyle = LANES[i].color;
          ctx.font = '14px monospace';
          ctx.fillText(LANES[i].sym, w / 2 - (w < 400 ? 80 : 100), y);
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(LANES[i].name, w / 2 - (w < 400 ? 65 : 85), y);
          ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillText('– ' + LANES[i].desc, w / 2 - (w < 400 ? 65 : 85) + (w < 400 ? 72 : 82), y);
          ctx.textAlign = 'center';
        }

        // Examples
        const exY = ly + 4 * (spacing + 10) + 10;
        ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('e.g. PHISHING → DETECT | ROOTKIT → ERADICATE', w / 2, exY);
        ctx.fillText('LATERAL MOVE → CONTAIN | RANSOMWARE → RECOVER', w / 2, exY + 14);

        // Controls
        const mob = 'ontouchstart' in window;
        if (!mob) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '9px monospace';
          ctx.fillText('← → MOVE  |  1-4 DIRECT  |  SPACE START', w / 2, h * 0.84);
        }

        // Start prompt
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 13px monospace'; ctx.fillText(mob ? 'TAP TO START' : 'PRESS SPACE', w / 2, h * 0.90); }

        // Hi
        if (g.hi > 0) { ctx.fillStyle = C.yellow + '60'; ctx.font = '10px monospace'; ctx.fillText('HI ' + g.hi, w / 2, h * 0.95); }
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
