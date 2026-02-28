import { useRef, useEffect, useCallback, useState } from 'react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';

/* ══════════════════════════════════════
   I18N
   ══════════════════════════════════════ */
const TXT = {
  en: {
    title: '🐸 CYBER FROGGER', subtitle: 'CROSS THE THREAT LANDSCAPE',
    howTo: '🐸 HOW TO PLAY',
    howToLines: [
      '1. Cross the road – dodge cyber threats!',
      '2. Cross the swamp – ride the audit logs!',
      '3. Reach the safe zones at the top.',
      '',
      'Arrow keys or WASD to move.',
      'Don\'t get hit. Don\'t fall in the swamp.',
    ],
    controls: '← ↑ → ↓  or  WASD',
    tapStart: '▶ TAP TO START', pressSpace: '▶ PRESS SPACE',
    gameOver: 'INCIDENT DETECTED', score: 'SCORE',
    tapRestart: '▶ TAP TO RETRY', restart: '▶ SPACE / R',
    level: 'LEVEL', lives: 'LIVES', time: 'TIME',
    cleared: '🎉 ZONE SECURED!',
  },
  de: {
    title: '🐸 CYBER FROGGER', subtitle: 'DURCHQUERE DIE BEDROHUNGSLANDSCHAFT',
    howTo: '🐸 SO GEHT\'S',
    howToLines: [
      '1. Straße überqueren – Cyber-Bedrohungen ausweichen!',
      '2. Sumpf überqueren – auf Audit-Logs reiten!',
      '3. Sichere Zonen oben erreichen.',
      '',
      'Pfeiltasten oder WASD zum Bewegen.',
      'Nicht getroffen werden. Nicht im Sumpf versinken.',
    ],
    controls: '← ↑ → ↓  oder  WASD',
    tapStart: '▶ TIPPEN ZUM START', pressSpace: '▶ LEERTASTE',
    gameOver: 'INCIDENT ERKANNT', score: 'PUNKTE',
    tapRestart: '▶ TIPPEN FÜR NEUSTART', restart: '▶ LEERTASTE / R',
    level: 'LEVEL', lives: 'LEBEN', time: 'ZEIT',
    cleared: '🎉 ZONE GESICHERT!',
  },
  fr: {
    title: '🐸 CYBER FROGGER', subtitle: 'TRAVERSEZ LE PAYSAGE DES MENACES',
    howTo: '🐸 COMMENT JOUER',
    howToLines: [
      '1. Traverser la route – éviter les cybermenaces !',
      '2. Traverser le marais – surfer sur les audits !',
      '3. Atteindre les zones sûres en haut.',
      '',
      'Flèches ou WASD pour se déplacer.',
      'Ne pas se faire toucher. Ne pas tomber dans le marais.',
    ],
    controls: '← ↑ → ↓  ou  WASD',
    tapStart: '▶ APPUYER POUR DÉMARRER', pressSpace: '▶ APPUYER ESPACE',
    gameOver: 'INCIDENT DÉTECTÉ', score: 'SCORE',
    tapRestart: '▶ APPUYER POUR REJOUER', restart: '▶ ESPACE / R',
    level: 'LEVEL', lives: 'VIES', time: 'TEMPS',
    cleared: '🎉 ZONE SÉCURISÉE !',
  },
};

/* ══════════════════════════════════════
   COLORS
   ══════════════════════════════════════ */
const C = {
  bg: '#0a0c14', road: '#1a1c28', swamp: '#0d2218', safe: '#0f1a0f',
  green: '#00ff88', red: '#ff4444', yellow: '#ffcc00', cyan: '#00ccff',
  orange: '#ff8833', pink: '#ff44aa', white: '#ffffff', dim: 'rgba(255,255,255,0.3)',
  purple: '#aa44ff', frog: '#44ff66', audit: '#33aaff',
};

/* ══════════════════════════════════════
   THREAT VEHICLES (road section)
   ══════════════════════════════════════ */
interface ThreatDef {
  name: string; width: number; speed: number; color: string;
}

const THREATS: ThreatDef[] = [
  // Short & fast
  { name: 'PHISHING', width: 80, speed: 120, color: C.orange },
  { name: 'MALWARE', width: 70, speed: 140, color: C.red },
  { name: 'TROJAN', width: 75, speed: 110, color: C.pink },
  { name: 'WORM', width: 60, speed: 160, color: C.purple },
  { name: 'SPYWARE', width: 70, speed: 130, color: C.yellow },
  // Long & slow
  { name: 'RANSOMWARE', width: 140, speed: 60, color: C.red },
  { name: 'APT CAMPAIGN', width: 150, speed: 45, color: C.purple },
  { name: 'SUPPLY CHAIN ATTACK', width: 170, speed: 35, color: C.orange },
  { name: 'DDoS FLOOD', width: 200, speed: 50, color: C.cyan },
  { name: 'ZERO-DAY EXPLOIT', width: 130, speed: 70, color: C.pink },
  // Medium
  { name: 'BRUTE FORCE', width: 100, speed: 90, color: C.yellow },
  { name: 'SQL INJECTION', width: 110, speed: 80, color: C.green },
  { name: 'XSS PAYLOAD', width: 95, speed: 100, color: C.cyan },
  { name: 'INSIDER THREAT', width: 120, speed: 55, color: C.orange },
  { name: 'CREDENTIAL STUFF', width: 115, speed: 75, color: C.pink },
];

/* ══════════════════════════════════════
   AUDIT LOGS (swamp/river section)
   ══════════════════════════════════════ */
const AUDIT_NAMES = [
  'ISO 27001', 'SOC 2 TYPE II', 'PCI DSS v4.0', 'TISAX AL3',
  'NIS-2 AUDIT', 'DORA CHECK', 'PENTEST LOG', 'VULN SCAN',
  'RISK ASSESS', 'GAP ANALYSIS', 'BSI AUDIT', 'ISMS REVIEW',
];

/* ══════════════════════════════════════
   SOUND (Web Audio API)
   ══════════════════════════════════════ */
let audioCtx: AudioContext | null = null;
const getAC = () => { if (!audioCtx) audioCtx = new AudioContext(); return audioCtx; };

const tone = (freq: number, dur: number, type: OscillatorType = 'square', vol = 0.08) => {
  try {
    const ac = getAC(); const o = ac.createOscillator(); const g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch {}
};

const sfxHop = () => { tone(330, 0.04); setTimeout(() => tone(440, 0.06), 30); };
const sfxHit = () => { tone(120, 0.3, 'sawtooth', 0.12); setTimeout(() => tone(80, 0.3, 'sawtooth', 0.08), 100); };
const sfxSplash = () => {
  try {
    const ac = getAC(); const buf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.08)) * 0.15;
    const s = ac.createBufferSource(); s.buffer = buf; s.connect(ac.destination); s.start();
  } catch {}
};
const sfxScore = () => { tone(523, 0.08); setTimeout(() => tone(659, 0.08), 60); setTimeout(() => tone(784, 0.12), 120); };
const sfxGameOver = () => { tone(440, 0.2, 'square', 0.1); setTimeout(() => tone(330, 0.2, 'square', 0.1), 180); setTimeout(() => tone(220, 0.4, 'sawtooth', 0.08), 360); };
const sfxLevelUp = () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.06), i * 80)); };
const sfxLand = () => { tone(200, 0.05, 'triangle', 0.04); };

/* ══════════════════════════════════════
   GAME CONFIG
   ══════════════════════════════════════ */
const CELL = 40; // grid cell size
const COLS = 15;
const ROAD_LANES = 5;
const RIVER_LANES = 4;
const SAFE_ROW = 0; // top row = safe zone
const RIVER_START = 1; // rows 1-4 = river/swamp
const ROAD_START = RIVER_START + RIVER_LANES + 1; // after a safe median
const START_ROW = ROAD_START + ROAD_LANES; // bottom safe row
const TOTAL_ROWS = START_ROW + 1;
const GAME_W = COLS * CELL;
const GAME_H = TOTAL_ROWS * CELL;
const SAFE_SLOTS = 5; // number of goal slots at top
const ROUND_TIME = 60; // seconds per level

/* ══════════════════════════════════════
   LEADERBOARD
   ══════════════════════════════════════ */
const BOARD_KEY = 'cyberfrogger-top5';
interface BoardEntry { score: number; level: number; date: string; }
const getBoard = (): BoardEntry[] => { try { return JSON.parse(localStorage.getItem(BOARD_KEY) || '[]'); } catch { return []; } };
const saveBoard = (score: number, level: number) => {
  const board = getBoard();
  board.push({ score, level, date: new Date().toLocaleDateString() });
  board.sort((a, b) => b.score - a.score);
  try { localStorage.setItem(BOARD_KEY, JSON.stringify(board.slice(0, 5))); } catch {}
};

/* ══════════════════════════════════════
   GAME STATE
   ══════════════════════════════════════ */
interface Vehicle { x: number; w: number; speed: number; name: string; color: string; dir: number; }
interface Log { x: number; w: number; speed: number; name: string; dir: number; }

interface GS {
  phase: 'start' | 'play' | 'dying' | 'scoring' | 'over';
  frogX: number; frogY: number;
  targetX: number; targetY: number; // animation target
  hopAnim: number; // 0 = done, >0 = animating
  vehicles: Vehicle[][];
  logs: Log[][];
  lives: number; score: number; level: number;
  timer: number;
  filledSlots: boolean[];
  deathAnim: number;
  scoreAnim: number;
  onLog: number; // index of log frog is on, -1 if none
  logSpeed: number; // current log's speed for riding
}

const spawnLane = (laneIdx: number, w: number, level: number, isRiver: boolean): (Vehicle | Log)[] => {
  const items: any[] = [];
  const dir = laneIdx % 2 === 0 ? 1 : -1;
  const count = 2 + Math.floor(Math.random() * 2) + Math.floor(level * 0.3);
  const speedMult = 1 + level * 0.12;

  for (let i = 0; i < count; i++) {
    if (isRiver) {
      const audit = AUDIT_NAMES[Math.floor(Math.random() * AUDIT_NAMES.length)];
      const logW = 80 + Math.floor(Math.random() * 80);
      const spd = (40 + Math.random() * 40) * speedMult;
      items.push({
        x: (i * (w / count)) + Math.random() * 60 - 30,
        w: logW, speed: spd * dir, name: audit, dir,
      });
    } else {
      const threat = THREATS[Math.floor(Math.random() * THREATS.length)];
      const spd = threat.speed * speedMult * (0.8 + Math.random() * 0.4);
      items.push({
        x: (i * (w / count)) + Math.random() * 60 - 30,
        w: threat.width, speed: spd * dir, name: threat.name, color: threat.color, dir,
      });
    }
  }
  return items;
};

const mkGS = (level = 1): GS => {
  const w = GAME_W;
  const vehicles: Vehicle[][] = [];
  const logs: Log[][] = [];

  for (let i = 0; i < ROAD_LANES; i++) {
    vehicles.push(spawnLane(i, w, level, false) as Vehicle[]);
  }
  for (let i = 0; i < RIVER_LANES; i++) {
    logs.push(spawnLane(i, w, level, true) as Log[]);
  }

  return {
    phase: 'play', frogX: Math.floor(COLS / 2) * CELL, frogY: START_ROW * CELL,
    targetX: Math.floor(COLS / 2) * CELL, targetY: START_ROW * CELL,
    hopAnim: 0, vehicles, logs,
    lives: 3, score: 0, level,
    timer: ROUND_TIME,
    filledSlots: new Array(SAFE_SLOTS).fill(false),
    deathAnim: 0, scoreAnim: 0,
    onLog: -1, logSpeed: 0,
  };
};

/* ══════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════ */
export default function CyberFrogger({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const txt = TXT[language as keyof typeof TXT] || TXT.en;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gs = useRef<GS>({ ...mkGS(), phase: 'start' as const });
  const animRef = useRef(0);
  const lastT = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const moveCD = useRef(0);
  const timerAccum = useRef(0);
  const txtRef = useRef(txt);
  txtRef.current = txt;

  const startGame = useCallback(() => {
    const g = gs.current;
    if (g.phase === 'start' || g.phase === 'over') {
      const newG = mkGS(1);
      Object.assign(g, newG);
      g.phase = 'play';
      try { getAC(); } catch {}
    }
  }, []);

  const resetFrog = useCallback(() => {
    const g = gs.current;
    g.frogX = Math.floor(COLS / 2) * CELL;
    g.frogY = START_ROW * CELL;
    g.targetX = g.frogX;
    g.targetY = g.frogY;
    g.hopAnim = 0;
    g.onLog = -1;
    g.logSpeed = 0;
  }, []);

  const die = useCallback(() => {
    const g = gs.current;
    g.lives--;
    if (g.lives <= 0) {
      g.phase = 'over';
      saveBoard(g.score, g.level);
      sfxGameOver();
    } else {
      g.phase = 'dying';
      g.deathAnim = 0.6;
      sfxHit();
    }
  }, []);

  const tryMove = useCallback((dx: number, dy: number) => {
    const g = gs.current;
    if (g.phase !== 'play' || g.hopAnim > 0 || moveCD.current > 0) return;

    const nx = g.frogX + dx * CELL;
    const ny = g.frogY + dy * CELL;

    if (nx < 0 || nx >= GAME_W || ny < 0 || ny >= GAME_H) return;

    g.targetX = nx;
    g.targetY = ny;
    g.hopAnim = 0.12;
    moveCD.current = 0.13;
    sfxHop();

    if (dy < 0) g.score += 10; // points for moving forward
  }, []);

  // Input handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gs.current;
      if (g.phase === 'start' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); startGame(); return; }
      if (g.phase === 'over' && (e.key === 'r' || e.key === 'R' || e.key === ' ')) { e.preventDefault(); startGame(); return; }

      keysRef.current.add(e.key);

      if (g.phase === 'play') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); tryMove(0, -1); }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); tryMove(0, 1); }
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); tryMove(-1, 0); }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); tryMove(1, 0); }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, [startGame, tryMove]);

  // Touch controls (swipe + D-pad)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0, startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const g = gs.current;
      if (g.phase === 'start' || g.phase === 'over') { startGame(); return; }
      if (g.phase !== 'play') return;

      // Check D-pad hit
      const c = canvasRef.current; if (!c) return;
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cw = c.width / dpr;
      const ch = c.height / dpr;
      const tx = (e.touches[0].clientX - rect.left) * (cw / rect.width);
      const ty = (e.touches[0].clientY - rect.top) * (ch / rect.height);

      const padSize = 52, padGap = 6;
      const padX = cw - padSize * 3 - padGap * 2 - 16;
      const padY = ch - padSize * 3 - padGap * 2 - 16;
      const dirs = [
        { dx: 0, dy: -1, col: 1, row: 0 },
        { dx: -1, dy: 0, col: 0, row: 1 },
        { dx: 1, dy: 0, col: 2, row: 1 },
        { dx: 0, dy: 1, col: 1, row: 2 },
      ];
      for (const d of dirs) {
        const bx = padX + d.col * (padSize + padGap);
        const by = padY + d.row * (padSize + padGap);
        if (tx >= bx && tx <= bx + padSize && ty >= by && ty <= by + padSize) {
          tryMove(d.dx, d.dy);
          e.preventDefault();
          return;
        }
      }

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < 15 && ady < 15) { tryMove(0, -1); return; } // tap = move up
      if (adx > ady) { tryMove(dx > 0 ? 1 : -1, 0); }
      else { tryMove(0, dy > 0 ? 1 : -1); }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd); };
  }, [startGame, tryMove]);

  // Game loop
  useEffect(() => {
    const loop = (now: number) => {
      const txt = txtRef.current;
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;
      const g = gs.current;

      const c = canvasRef.current; if (!c) { animRef.current = requestAnimationFrame(loop); return; }
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const dispW = rect.width;
        const dispH = rect.height;
        if (c.width !== Math.round(dispW * dpr) || c.height !== Math.round(dispH * dpr)) {
          c.width = Math.round(dispW * dpr);
          c.height = Math.round(dispH * dpr);
          c.style.width = dispW + 'px';
          c.style.height = dispH + 'px';
        }
      }

      const ctx = c.getContext('2d'); if (!ctx) { animRef.current = requestAnimationFrame(loop); return; }
      const dpr = window.devicePixelRatio || 1;
      const cw = c.width / dpr;
      const ch = c.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale game to fit
      const scale = Math.min(cw / GAME_W, ch / (GAME_H + 50));
      const ox = (cw - GAME_W * scale) / 2;
      const oy = (ch - (GAME_H + 50) * scale) / 2 + 40 * scale;

      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = 'rgba(5,6,10,0.6)';
      ctx.fillRect(0, 0, cw, ch);

      // ── UPDATE ──
      if (g.phase === 'play') {
        // Timer
        timerAccum.current += dt;
        if (timerAccum.current >= 1) {
          timerAccum.current -= 1;
          g.timer--;
          if (g.timer <= 0) { die(); }
        }

        // Move cooldown
        if (moveCD.current > 0) moveCD.current -= dt;

        // Hop animation
        if (g.hopAnim > 0) {
          g.hopAnim -= dt;
          if (g.hopAnim <= 0) {
            g.hopAnim = 0;
            g.frogX = g.targetX;
            g.frogY = g.targetY;
          } else {
            const t = 1 - g.hopAnim / 0.12;
            g.frogX = g.frogX + (g.targetX - g.frogX) * t;
            g.frogY = g.frogY + (g.targetY - g.frogY) * t;
          }
        }

        // Move vehicles
        for (const lane of g.vehicles) {
          for (const v of lane) {
            v.x += v.speed * dt;
            if (v.speed > 0 && v.x > GAME_W + 50) v.x = -v.w - 20;
            if (v.speed < 0 && v.x + v.w < -50) v.x = GAME_W + 20;
          }
        }

        // Move logs
        for (const lane of g.logs) {
          for (const l of lane) {
            l.x += l.speed * dt;
            if (l.speed > 0 && l.x > GAME_W + 50) l.x = -l.w - 20;
            if (l.speed < 0 && l.x + l.w < -50) l.x = GAME_W + 20;
          }
        }

        // Frog riding log
        const frogRow = Math.round(g.frogY / CELL);
        const riverRowIdx = frogRow - RIVER_START;
        g.onLog = -1;
        g.logSpeed = 0;

        if (riverRowIdx >= 0 && riverRowIdx < RIVER_LANES) {
          const laneLogs = g.logs[riverRowIdx];
          let onAny = false;
          for (const l of laneLogs) {
            if (g.frogX + CELL * 0.7 > l.x && g.frogX + CELL * 0.3 < l.x + l.w) {
              onAny = true;
              g.logSpeed = l.speed;
              g.frogX += l.speed * dt;
              g.targetX += l.speed * dt;
              break;
            }
          }
          if (!onAny && g.hopAnim <= 0) {
            // Fell in swamp
            sfxSplash();
            die();
          }
          // Off screen while on log
          if (g.frogX < -CELL || g.frogX > GAME_W) {
            sfxSplash();
            die();
          }
        }

        // Check vehicle collision
        if (g.hopAnim <= 0) {
          const roadRowIdx = frogRow - ROAD_START;
          if (roadRowIdx >= 0 && roadRowIdx < ROAD_LANES) {
            const laneVehicles = g.vehicles[roadRowIdx];
            for (const v of laneVehicles) {
              if (g.frogX + CELL * 0.7 > v.x && g.frogX + CELL * 0.3 < v.x + v.w) {
                die();
                break;
              }
            }
          }
        }

        // Check reached top safe zone
        if (frogRow === SAFE_ROW && g.hopAnim <= 0) {
          const slotWidth = GAME_W / SAFE_SLOTS;
          const slotIdx = Math.floor((g.frogX + CELL / 2) / slotWidth);
          if (slotIdx >= 0 && slotIdx < SAFE_SLOTS && !g.filledSlots[slotIdx]) {
            g.filledSlots[slotIdx] = true;
            g.score += 100 + g.timer * 5;
            sfxScore();
            g.timer = ROUND_TIME;
            timerAccum.current = 0;

            // Check all slots filled → next level
            if (g.filledSlots.every(Boolean)) {
              g.phase = 'scoring';
              g.scoreAnim = 1.5;
              g.score += 500;
              sfxLevelUp();
            } else {
              resetFrog();
            }
          } else {
            // Bounce back if slot occupied or out of bounds
            tryMove(0, 1);
          }
        }

        // Median row is safe
      }

      // Dying animation
      if (g.phase === 'dying') {
        g.deathAnim -= dt;
        if (g.deathAnim <= 0) {
          g.phase = 'play';
          g.timer = ROUND_TIME;
          timerAccum.current = 0;
          resetFrog();
        }
      }

      // Scoring animation (level clear)
      if (g.phase === 'scoring') {
        g.scoreAnim -= dt;
        if (g.scoreAnim <= 0) {
          const newLevel = g.level + 1;
          const newG = mkGS(newLevel);
          newG.score = g.score;
          newG.lives = g.lives;
          newG.level = newLevel;
          Object.assign(g, newG);
        }
      }

      // ── DRAW ──
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      // Background rows
      for (let r = 0; r < TOTAL_ROWS; r++) {
        const y = r * CELL;
        if (r === SAFE_ROW) {
          ctx.fillStyle = '#0a1a10';
        } else if (r >= RIVER_START && r < RIVER_START + RIVER_LANES) {
          ctx.fillStyle = C.swamp;
        } else if (r === RIVER_START + RIVER_LANES) {
          ctx.fillStyle = '#151820'; // median
        } else if (r >= ROAD_START && r <= START_ROW) {
          ctx.fillStyle = r === START_ROW ? '#151820' : C.road;
        } else {
          ctx.fillStyle = C.bg;
        }
        ctx.fillRect(0, y, GAME_W, CELL);
      }

      // Road lane markings
      for (let i = 0; i < ROAD_LANES; i++) {
        const y = (ROAD_START + i) * CELL + CELL / 2;
        ctx.setLineDash([8, 12]);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_W, y); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Swamp water texture
      for (let i = 0; i < RIVER_LANES; i++) {
        const y = (RIVER_START + i) * CELL;
        for (let x = 0; x < GAME_W; x += 20) {
          const wave = Math.sin(now * 0.002 + x * 0.05 + i) * 2;
          ctx.fillStyle = 'rgba(0,255,100,0.03)';
          ctx.fillRect(x, y + 15 + wave, 12, 2);
        }
      }

      // Safe slots at top
      const slotW = GAME_W / SAFE_SLOTS;
      for (let i = 0; i < SAFE_SLOTS; i++) {
        const sx = i * slotW;
        ctx.strokeStyle = 'rgba(0,255,136,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 2, 2, slotW - 4, CELL - 4);
        if (g.filledSlots[i]) {
          ctx.fillStyle = 'rgba(0,255,136,0.15)';
          ctx.fillRect(sx + 2, 2, slotW - 4, CELL - 4);
          // Draw mini frog
          ctx.font = '20px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = C.frog;
          ctx.fillText('🐸', sx + slotW / 2, CELL - 8);
        }
      }

      // Draw logs (audit platforms)
      for (let i = 0; i < RIVER_LANES; i++) {
        const y = (RIVER_START + i) * CELL;
        for (const l of g.logs[i]) {
          // Log body
          const grd = ctx.createLinearGradient(l.x, y, l.x + l.w, y);
          grd.addColorStop(0, 'rgba(30,80,60,0.9)');
          grd.addColorStop(0.5, 'rgba(40,100,70,0.95)');
          grd.addColorStop(1, 'rgba(30,80,60,0.9)');
          ctx.fillStyle = grd;
          ctx.fillRect(l.x, y + 4, l.w, CELL - 8);
          ctx.strokeStyle = 'rgba(0,200,100,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(l.x, y + 4, l.w, CELL - 8);
          // Audit label
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = C.audit;
          ctx.fillText(l.name, l.x + l.w / 2, y + CELL / 2 + 3);
        }
      }

      // Draw vehicles (threats)
      for (let i = 0; i < ROAD_LANES; i++) {
        const y = (ROAD_START + i) * CELL;
        for (const v of g.vehicles[i]) {
          // Vehicle body
          const vgrd = ctx.createLinearGradient(v.x, y, v.x + v.w, y);
          vgrd.addColorStop(0, v.color + '20');
          vgrd.addColorStop(0.5, v.color + '40');
          vgrd.addColorStop(1, v.color + '20');
          ctx.fillStyle = vgrd;
          ctx.fillRect(v.x, y + 3, v.w, CELL - 6);
          // Border
          ctx.strokeStyle = v.color + '80';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(v.x, y + 3, v.w, CELL - 6);
          // Glow
          ctx.shadowColor = v.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = v.color + '15';
          ctx.fillRect(v.x, y + 3, v.w, CELL - 6);
          ctx.shadowBlur = 0;
          // Name
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = v.color;
          ctx.fillText(v.name, v.x + v.w / 2, y + CELL / 2 + 3);
          // Headlights
          const hlX = v.speed > 0 ? v.x + v.w - 3 : v.x + 3;
          ctx.fillStyle = C.yellow + '60';
          ctx.fillRect(hlX - 2, y + 8, 4, 3);
          ctx.fillRect(hlX - 2, y + CELL - 11, 4, 3);
        }
      }

      // Draw frog
      if (g.phase !== 'over') {
        const fx = g.hopAnim > 0 ? g.frogX : g.targetX;
        const fy = g.hopAnim > 0 ? g.frogY : g.targetY;
        const hopBounce = g.hopAnim > 0 ? Math.sin(g.hopAnim / 0.12 * Math.PI) * 4 : 0;

        if (g.phase === 'dying') {
          // Death animation - skull
          const deathAlpha = g.deathAnim / 0.6;
          ctx.globalAlpha = deathAlpha;
          ctx.font = '28px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = C.red;
          ctx.fillText('💀', fx + CELL / 2, fy + CELL - 6 - hopBounce);
          ctx.globalAlpha = 1;
        } else {
          // Frog sprite
          ctx.font = '28px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🐸', fx + CELL / 2, fy + CELL - 6 - hopBounce);
          // Shadow
          ctx.fillStyle = 'rgba(0,255,100,0.08)';
          ctx.beginPath();
          ctx.ellipse(fx + CELL / 2, fy + CELL - 2, 14, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Scoring animation overlay
      if (g.phase === 'scoring') {
        ctx.fillStyle = 'rgba(0,255,100,0.08)';
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = C.green;
        const pulse = 0.8 + Math.sin(now * 0.01) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.fillText(txt.cleared, GAME_W / 2, GAME_H / 2 - 10);
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = C.yellow;
        ctx.fillText(`${txt.level} ${g.level + 1}`, GAME_W / 2, GAME_H / 2 + 16);
        ctx.globalAlpha = 1;
      }

      // HUD
      if (g.phase === 'play' || g.phase === 'dying' || g.phase === 'scoring') {
        ctx.fillStyle = 'rgba(5,6,10,0.85)';
        ctx.fillRect(0, GAME_H, GAME_W, 50);

        ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
        ctx.fillStyle = C.green;
        ctx.fillText(`${txt.score}: ${g.score}`, 8, GAME_H + 16);
        ctx.fillStyle = C.cyan;
        ctx.fillText(`${txt.level}: ${g.level}`, 8, GAME_H + 32);

        ctx.textAlign = 'center';
        ctx.fillStyle = g.timer <= 10 ? C.red : C.yellow;
        ctx.fillText(`${txt.time}: ${g.timer}s`, GAME_W / 2, GAME_H + 24);

        ctx.textAlign = 'right';
        for (let i = 0; i < 3; i++) {
          ctx.font = '14px monospace';
          ctx.fillStyle = i < g.lives ? C.red : 'rgba(255,255,255,0.1)';
          ctx.fillText('♥', GAME_W - 8 - (2 - i) * 18, GAME_H + 20);
        }
      }

      ctx.restore();

      // ── MOBILE D-PAD OVERLAY ──
      const isMob = 'ontouchstart' in window;
      if (isMob && g.phase === 'play') {
        const padSize = 52;
        const padGap = 6;
        const padX = cw - padSize * 3 - padGap * 2 - 16;
        const padY = ch - padSize * 3 - padGap * 2 - 16;
        const dirs = [
          { label: '▲', col: 1, row: 0 },
          { label: '◀', col: 0, row: 1 },
          { label: '▶', col: 2, row: 1 },
          { label: '▼', col: 1, row: 2 },
        ];
        for (const d of dirs) {
          const dx = padX + d.col * (padSize + padGap);
          const dy = padY + d.row * (padSize + padGap);
          ctx.fillStyle = 'rgba(0,255,136,0.10)';
          ctx.strokeStyle = 'rgba(0,255,136,0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(dx, dy, padSize, padSize, 10);
          ctx.fill(); ctx.stroke();
          ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(0,255,136,0.6)';
          ctx.fillText(d.label, dx + padSize / 2, dy + padSize / 2 + 8);
        }
      }

      // ── START SCREEN ──
      if (g.phase === 'start') {
        ctx.fillStyle = 'rgba(5,6,10,0.88)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.textAlign = 'center';

        ctx.shadowColor = C.green; ctx.shadowBlur = 25;
        ctx.font = 'bold 24px monospace'; ctx.fillStyle = C.green;
        ctx.fillText(txt.title, cw / 2, ch * 0.12);
        ctx.shadowBlur = 0;
        ctx.font = '9px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText(txt.subtitle, cw / 2, ch * 0.12 + 20);

        const ey = ch * 0.22;
        ctx.font = 'bold 11px monospace'; ctx.fillStyle = C.yellow;
        ctx.fillText(txt.howTo, cw / 2, ey);
        ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < txt.howToLines.length; i++) {
          ctx.fillText(txt.howToLines[i], cw / 2, ey + 18 + i * 15);
        }

        // Threat preview
        const py = ch * 0.60;
        ctx.font = 'bold 10px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText('── THREATS ──', cw / 2, py);
        const previewThreats = THREATS.slice(0, 6);
        for (let i = 0; i < previewThreats.length; i++) {
          const t = previewThreats[i];
          ctx.fillStyle = t.color; ctx.font = '9px monospace';
          ctx.fillText(`${t.name}`, cw / 2, py + 16 + i * 14);
        }

        const mob = 'ontouchstart' in window;
        if (!mob) { ctx.fillStyle = C.dim; ctx.font = '9px monospace'; ctx.fillText(txt.controls, cw / 2, ch * 0.90); }
        const blink = Math.sin(now * 0.005) > 0;
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 13px monospace'; ctx.fillText(mob ? txt.tapStart : txt.pressSpace, cw / 2, ch * 0.95); }
      }

      // ── GAME OVER ──
      if (g.phase === 'over') {
        ctx.fillStyle = 'rgba(5,6,10,0.85)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.textAlign = 'center';
        const sy = ch * 0.12;

        ctx.shadowColor = C.red; ctx.shadowBlur = 20;
        ctx.font = 'bold 22px monospace'; ctx.fillStyle = C.red;
        ctx.fillText(txt.gameOver, cw / 2, sy);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 36px monospace'; ctx.fillStyle = C.white;
        ctx.fillText('' + g.score, cw / 2, sy + 50);
        ctx.font = '10px monospace'; ctx.fillStyle = C.dim;
        ctx.fillText(txt.score, cw / 2, sy + 68);

        ctx.fillStyle = C.cyan;
        ctx.fillText(`${txt.level}: ${g.level}`, cw / 2, sy + 90);

        // Leaderboard
        const board = getBoard();
        if (board.length > 0) {
          const lbY = sy + 115;
          ctx.font = 'bold 10px monospace'; ctx.fillStyle = C.yellow + '90';
          ctx.fillText('─── TOP 5 ───', cw / 2, lbY);
          for (let i = 0; i < board.length; i++) {
            const e = board[i];
            const isCurrentRun = e.score === g.score && e.date === new Date().toLocaleDateString();
            const y = lbY + 18 + i * 18;
            ctx.font = '10px monospace';
            ctx.fillStyle = isCurrentRun ? C.yellow : (i === 0 ? C.cyan : C.dim);
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
            ctx.fillText(`${medal} ${e.score}pts  Lv${e.level}  ${e.date}`, cw / 2, y);
          }
        }

        const mob = 'ontouchstart' in window;
        const blink = Math.sin(now * 0.005) > 0;
        const restartY = sy + 115 + (board.length > 0 ? 18 + board.length * 18 + 14 : 30);
        if (blink) { ctx.fillStyle = C.yellow; ctx.font = 'bold 12px monospace'; ctx.fillText(mob ? txt.tapRestart : txt.restart, cw / 2, restartY); }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    lastT.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${embedded ? 'w-full h-[500px] rounded-xl' : 'w-full h-screen'}`}
      style={{ cursor: 'pointer', background: 'transparent' }}
      tabIndex={0}
    >
      {!embedded && <PageMeta title="Cyber Frogger" description="Cybersecurity Frogger Arcade Game" />}
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
