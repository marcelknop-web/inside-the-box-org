import { useState, useRef, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';

import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/* ── N-Pendulum Physics (generic Lagrangian) ─────────────────── */

/** State: n angles + n angular velocities. Each rod has unit length and unit mass. */
interface PendulumState {
  θ: number[]; // length n
  ω: number[]; // length n
}

const G = 9.81;
const ROD_LEN = 1;   // each rod length
const ROD_MASS = 1;  // each point mass

/**
 * Solve for angular accelerations α of an n-link planar pendulum chain.
 * Uses the standard Lagrangian formulation:
 *   M(θ) · α = b(θ, ω)
 * where:
 *   M[i][j] = (n - max(i,j)) * L_i * L_j * cos(θ_i - θ_j)   (mass = 1 each)
 *   b[i]    = -Σ_j (n - max(i,j)) * L_i * L_j * sin(θ_i - θ_j) * ω_j^2
 *             - (n - i) * G * L_i * sin(θ_i)
 *
 * Indices are 0-based here; "n - max(i,j)" counts the number of point masses
 * hanging at or below the deeper of the two links (using 1-based convention
 * mass index k contributes for k >= max(i,j)+1, i.e. n - max(i,j) masses).
 */
const computeAccel = (s: PendulumState): number[] => {
  const n = s.θ.length;
  const L = ROD_LEN;

  // Build M and b
  const M: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const b: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const k = n - Math.max(i, j); // # of masses contributing
      M[i][j] = k * L * L * Math.cos(s.θ[i] - s.θ[j]);
    }
    let bi = 0;
    for (let j = 0; j < n; j++) {
      const k = n - Math.max(i, j);
      bi -= k * L * L * Math.sin(s.θ[i] - s.θ[j]) * s.ω[j] * s.ω[j];
    }
    bi -= (n - i) * G * L * Math.sin(s.θ[i]);
    b[i] = bi;
  }

  // Solve M α = b via Gaussian elimination with partial pivoting
  return solveLinear(M, b);
};

const solveLinear = (A: number[][], b: number[]): number[] => {
  const n = b.length;
  // augmented copy
  const a: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    // pivot
    let piv = i;
    let max = Math.abs(a[i][i]);
    for (let r = i + 1; r < n; r++) {
      const v = Math.abs(a[r][i]);
      if (v > max) { max = v; piv = r; }
    }
    if (piv !== i) { const tmp = a[i]; a[i] = a[piv]; a[piv] = tmp; }
    const div = a[i][i] || 1e-12;
    for (let r = i + 1; r < n; r++) {
      const f = a[r][i] / div;
      for (let c = i; c <= n; c++) a[r][c] -= f * a[i][c];
    }
  }
  // back-substitute
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = a[i][n];
    for (let c = i + 1; c < n; c++) sum -= a[i][c] * x[c];
    x[i] = sum / (a[i][i] || 1e-12);
  }
  return x;
};

const cloneState = (s: PendulumState): PendulumState => ({
  θ: [...s.θ], ω: [...s.ω],
});

/** RK4 integration step */
const rk4Step = (s: PendulumState, dt: number): PendulumState => {
  const n = s.θ.length;
  const deriv = (st: PendulumState) => {
    const α = computeAccel(st);
    return { dθ: [...st.ω], dω: α };
  };

  const addScaled = (base: PendulumState, k: { dθ: number[]; dω: number[] }, f: number): PendulumState => ({
    θ: base.θ.map((v, i) => v + k.dθ[i] * f),
    ω: base.ω.map((v, i) => v + k.dω[i] * f),
  });

  const k1 = deriv(s);
  const k2 = deriv(addScaled(s, k1, dt / 2));
  const k3 = deriv(addScaled(s, k2, dt / 2));
  const k4 = deriv(addScaled(s, k3, dt));

  const out: PendulumState = { θ: new Array(n), ω: new Array(n) };
  for (let i = 0; i < n; i++) {
    out.θ[i] = s.θ[i] + (k1.dθ[i] + 2 * k2.dθ[i] + 2 * k3.dθ[i] + k4.dθ[i]) * dt / 6;
    out.ω[i] = s.ω[i] + (k1.dω[i] + 2 * k2.dω[i] + 2 * k3.dω[i] + k4.dω[i]) * dt / 6;
  }
  return out;
};

/** Compute joint positions (including pivot at index 0). Returns n+1 points. */
const jointPositions = (s: PendulumState, scale: number, cx: number, cy: number): [number, number][] => {
  const pts: [number, number][] = [[cx, cy]];
  let x = cx, y = cy;
  for (let i = 0; i < s.θ.length; i++) {
    x += ROD_LEN * Math.sin(s.θ[i]) * scale;
    y += ROD_LEN * Math.cos(s.θ[i]) * scale;
    pts.push([x, y]);
  }
  return pts;
};

/** Tip position of pendulum (last joint), scaled. */
const tipPosition = (s: PendulumState, scale = 1): [number, number] => {
  let x = 0, y = 0;
  for (let i = 0; i < s.θ.length; i++) {
    x += ROD_LEN * Math.sin(s.θ[i]) * scale;
    y += ROD_LEN * Math.cos(s.θ[i]) * scale;
  }
  return [x, y];
};

/* ── Translations ────────────────────────────────────────────── */

const texts = {
  de: {
    title: 'Doppelpendel Lab',
    subtitle: 'Zwei Doppelpendel starten fast gleich – ein winziger Unterschied im Startwinkel führt zu völlig unterschiedlichem Verhalten.',
    params: 'Einstellungen',
    angle1: 'Startwinkel oberes Pendel (Grad)',
    angle2: 'Startwinkel unteres Pendel (Grad)',
    offset: 'Winkelunterschied zwischen A und B (Grad)',
    speed: 'Geschwindigkeit',
    phase: 'Pendelbewegung',
    divergence: 'Wie weit die Pendelspitzen auseinanderlaufen',
    trajectory: 'Pendel',
    distance: 'Abstand',
    time: 'Zeit',
    play: 'Starten',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    liveLabel: 'Live-Vergleich',
    liveStart: 'Startunterschied',
    liveCurrent: 'Aktueller Abstand',
    liveFactor: 'Verstärkung',
    liveHint: 'Simulation starten, um den Live-Vergleich zu sehen',
    explainTitle: 'Was passiert hier?',
    explain1: 'Ein Doppelpendel besteht aus zwei Stäben, die aneinander hängen. Die Bewegung sieht zufällig aus, folgt aber exakten physikalischen Gesetzen.',
    explain2: 'Zwei Pendel starten mit einem winzigen Winkelunterschied. Anfangs bewegen sie sich identisch – dann plötzlich völlig verschieden. Das ist Chaos: Nicht Zufall, sondern extreme Empfindlichkeit gegenüber Anfangsbedingungen.',
    explain3: 'Das Doppelpendel ist eines der einfachsten physikalischen Systeme, das chaotisches Verhalten zeigt. Jeder kann es mit zwei Linealen und einem Stift nachbauen.',
    tryThis: 'Zum Ausprobieren',
    try1: 'Den Winkelunterschied auf 0.01° setzen und starten. Die Pendel laufen trotzdem irgendwann auseinander.',
    try2: 'Den Winkelunterschied auf 5° erhöhen – die Trennung passiert sofort.',
    try3: 'Startwinkel auf 10° reduzieren – die Ausschläge sind kleiner, und das Chaos setzt später ein.',
  },
  en: {
    title: 'Double Pendulum Lab',
    subtitle: 'Two double pendulums start almost identically – a tiny difference in the starting angle leads to completely different behaviour.',
    params: 'Settings',
    angle1: 'Starting angle upper pendulum (degrees)',
    angle2: 'Starting angle lower pendulum (degrees)',
    offset: 'Angle difference between A and B (degrees)',
    speed: 'Speed',
    phase: 'Pendulum motion',
    divergence: 'How far the pendulum tips drift apart',
    trajectory: 'Pendulum',
    distance: 'Distance',
    time: 'Time',
    play: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    liveLabel: 'Live comparison',
    liveStart: 'Starting difference',
    liveCurrent: 'Current distance',
    liveFactor: 'Amplification',
    liveHint: 'Start the simulation to see the live comparison',
    explainTitle: 'What is happening?',
    explain1: 'A double pendulum consists of two rods hanging from each other. The motion looks random but follows exact physical laws.',
    explain2: 'Two pendulums start with a tiny angle difference. At first they move identically – then suddenly, completely differently. This is chaos: not randomness, but extreme sensitivity to initial conditions.',
    explain3: 'The double pendulum is one of the simplest physical systems that exhibits chaotic behaviour. Anyone can rebuild it with two rulers and a pin.',
    tryThis: 'Try this',
    try1: 'Set the angle difference to 0.01° and start. The pendulums still diverge eventually.',
    try2: 'Increase the angle difference to 5° – the separation happens immediately.',
    try3: 'Reduce the starting angle to 10° – the swings are smaller and chaos sets in later.',
  },
  fr: {
    title: 'Laboratoire Double Pendule',
    subtitle: 'Deux doubles pendules démarrent presque identiquement – une infime différence d\'angle mène à un comportement totalement différent.',
    params: 'Réglages',
    angle1: 'Angle de départ pendule supérieur (degrés)',
    angle2: 'Angle de départ pendule inférieur (degrés)',
    offset: 'Différence d\'angle entre A et B (degrés)',
    speed: 'Vitesse',
    phase: 'Mouvement du pendule',
    divergence: 'Écart entre les extrémités des pendules',
    trajectory: 'Pendule',
    distance: 'Distance',
    time: 'Temps',
    play: 'Démarrer',
    pause: 'Pause',
    reset: 'Réinitialiser',
    liveLabel: 'Comparaison en direct',
    liveStart: 'Différence de départ',
    liveCurrent: 'Distance actuelle',
    liveFactor: 'Amplification',
    liveHint: 'Démarrer la simulation pour voir la comparaison',
    explainTitle: 'Que se passe-t-il ?',
    explain1: 'Un double pendule est constitué de deux tiges suspendues l\'une à l\'autre. Le mouvement semble aléatoire mais suit des lois physiques exactes.',
    explain2: 'Deux pendules démarrent avec une infime différence d\'angle. Au début, ils bougent de manière identique – puis soudain, de façon totalement différente. C\'est le chaos : pas le hasard, mais une sensibilité extrême aux conditions initiales.',
    explain3: 'Le double pendule est l\'un des systèmes physiques les plus simples présentant un comportement chaotique. N\'importe qui peut le reconstruire avec deux règles et une épingle.',
    tryThis: 'À essayer',
    try1: 'Régler la différence d\'angle sur 0,01° et démarrer. Les pendules finissent quand même par diverger.',
    try2: 'Augmenter la différence à 5° – la séparation est immédiate.',
    try3: 'Réduire l\'angle de départ à 10° – les oscillations sont plus petites et le chaos apparaît plus tard.',
  },
};

/* ── Component ───────────────────────────────────────────────── */

interface Props {
  embedded?: boolean;
}

const DT = 0.002;
const STEPS_PER_FRAME = 6;
const MAX_TRAIL = 1500;
const MIN_LINKS = 2;
const MAX_LINKS = 8;
const DEFAULT_LINKS = 3;

const ButterflyEffectLab = ({ embedded }: Props) => {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;

  const angle1 = 120;
  const [offsetDeg, setOffsetDeg] = useState(3.6); // 1% of 360°
  const [numLinks, setNumLinks] = useState(DEFAULT_LINKS);
  const [running, setRunning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ekgRef = useRef<HTMLCanvasElement>(null);
  const ekgDataRef = useRef<number[]>([]);

  const toRad = (d: number) => (d * Math.PI) / 180;

  // Adaptive timestep: smaller dt for more links to keep RK4 stable
  const dtForLinks = (n: number) => DT * (n <= 3 ? 1 : n <= 5 ? 0.5 : 0.25);
  const stepsForLinks = (n: number) => Math.max(STEPS_PER_FRAME, Math.round(STEPS_PER_FRAME * (n <= 3 ? 1 : n <= 5 ? 2 : 4)));

  const makeInitialState = useCallback((n: number, extraOffset = 0): PendulumState => {
    const θ: number[] = [];
    for (let i = 0; i < n; i++) {
      θ.push(toRad(angle1 + (i === 0 ? extraOffset : 0)));
    }
    return { θ, ω: new Array(n).fill(0) };
  }, [angle1]);

  const stateRef = useRef<{
    a: PendulumState; b: PendulumState;
    trailA: number[][]; trailB: number[][]; // each entry: array of n angles
    permTrailA: number[][]; permTrailB: number[][];
    divData: { t: number; d: number }[];
    step: number;
    n: number;
  }>({
    a: makeInitialState(DEFAULT_LINKS, 0),
    b: makeInitialState(DEFAULT_LINKS, 0.001),
    trailA: [],
    trailB: [],
    permTrailA: [],
    permTrailB: [],
    divData: [],
    step: 0,
    n: DEFAULT_LINKS,
  });

  const [divData, setDivData] = useState<{ t: number; d: number }[]>([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const [liveSpeedDiff, setLiveSpeedDiff] = useState(0);
  const [liveAngleDiff, setLiveAngleDiff] = useState(0);
  const rafRef = useRef<number>(0);
  const runRef = useRef(false);

  const resetSim = useCallback(() => {
    setRunning(false);
    runRef.current = false;
    const s = stateRef.current;
    s.n = numLinks;
    s.a = makeInitialState(numLinks, 0);
    s.b = makeInitialState(numLinks, offsetDeg);
    s.trailA = [];
    s.trailB = [];
    s.permTrailA = [];
    s.permTrailB = [];
    s.divData = [];
    s.step = 0;
    setDivData([]);
    setLiveDistance(0);
    setLiveSpeedDiff(0);
    setLiveAngleDiff(0);
    ekgDataRef.current = [];
    drawEkg();
    drawFrame();
  }, [makeInitialState, offsetDeg]);

  useEffect(() => { resetSim(); }, [offsetDeg]);

  /* ── Canvas drawing ──────────────────────────────────────── */

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'hsla(0, 0%, 50%, 0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Pivot exactly centered; scale so full reach (2 arms) nearly touches edges
    const padding = 15;
    const maxReach = 2; // L1 + L2
    const scale = Math.min((w - padding * 2) / (maxReach * 2), (h - padding * 2) / (maxReach * 2)) * 0.95;
    const cx = w / 2;
    const cy = h / 2;

    const s = stateRef.current;

    // Helper: project stored angles [θ1, θ2] to pixel position of tip
    const tipPixel = (angles: [number, number]): [number, number] => {
      const x1 = cx + L1 * Math.sin(angles[0]) * scale;
      const y1 = cy + L1 * Math.cos(angles[0]) * scale;
      const x2 = x1 + L2 * Math.sin(angles[1]) * scale;
      const y2 = y1 + L2 * Math.cos(angles[1]) * scale;
      return [x2, y2];
    };

    // Draw permanent trails (faint background)
    const drawAnglesTrail = (trail: [number, number][], color: string, alpha: number, width: number) => {
      if (trail.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      const [sx, sy] = tipPixel(trail[0]);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < trail.length; i++) {
        const [px, py] = tipPixel(trail[i]);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    drawAnglesTrail(s.permTrailA, 'hsl(180, 80%, 55%)', 0.15, 0.6);
    drawAnglesTrail(s.permTrailB, 'hsl(30, 90%, 55%)', 0.15, 0.6);

    drawAnglesTrail(s.trailA, 'hsl(180, 80%, 55%)', 0.6, 1.2);
    drawAnglesTrail(s.trailB, 'hsl(30, 90%, 55%)', 0.6, 1.2);

    // Draw pendulums
    const drawPendulum = (st: PendulumState, color: string, label: string) => {
      const { x1, y1, x2, y2 } = pendulumPositions(st, scale, cx, cy);

      // Rods
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Pivot
      ctx.fillStyle = 'hsl(0, 0%, 60%)';
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

      // Joint
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x1, y1, 5, 0, Math.PI * 2); ctx.fill();

      // Tip
      ctx.beginPath(); ctx.arc(x2, y2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      // Label
      ctx.font = '11px monospace';
      ctx.fillStyle = color;
      ctx.fillText(label, x2 + 10, y2 - 5);
    };

    drawPendulum(s.a, 'hsl(180, 80%, 55%)', 'A');
    drawPendulum(s.b, 'hsl(30, 90%, 55%)', 'B');

    // Legend
    ctx.font = '11px monospace';
    ctx.fillStyle = 'hsl(180, 80%, 55%)';
    ctx.fillText(`${t.trajectory} A`, 12, 20);
    ctx.fillStyle = 'hsl(30, 90%, 55%)';
    const pct = offsetDeg / 360 * 100; const pctStr = pct < 0.0001 ? pct.toFixed(7) : pct < 0.01 ? pct.toFixed(5) : pct.toFixed(4);
    ctx.fillText(`${t.trajectory} B (Δ = ${pctStr} %)`, 12, 36);
  }, [offsetDeg, t]);

  /* ── EKG drawing ──────────────────────────────────────────── */

  const drawEkg = useCallback(() => {
    const canvas = ekgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'hsla(0, 0%, 50%, 0.08)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const data = ekgDataRef.current;
    if (data.length < 2) return;

    // Auto-scale: find max in buffer
    const maxVal = Math.max(...data, 0.1);
    const padding = 4;

    ctx.beginPath();
    ctx.strokeStyle = 'hsl(0, 85%, 60%)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'hsl(0, 85%, 60%)';
    ctx.shadowBlur = 4;

    // Logarithmic x-spacing: recent data spread out, old data compressed
    const n = data.length;
    const getX = (i: number) => {
      // Distance from right edge (0 = newest, n-1 = oldest)
      const age = n - 1 - i;
      if (age === 0) return w;
      // Log compression: map age to x position
      const logMax = Math.log(n);
      const logAge = Math.log(age + 1);
      return w - (logAge / logMax) * (w - 4);
    };

    for (let i = 0; i < n; i++) {
      const x = getX(i);
      const y = h - padding - (data[i] / maxVal) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Current value dot
    const lastY = h - padding - (data[n - 1] / maxVal) * (h - padding * 2);
    ctx.fillStyle = 'hsl(0, 85%, 60%)';
    ctx.beginPath(); ctx.arc(w - 1, lastY, 3, 0, Math.PI * 2); ctx.fill();
  }, []);

  /* ── Animation loop ──────────────────────────────────────── */

  const animate = useCallback(() => {
    if (!runRef.current) return;
    const s = stateRef.current;

    const stepsThisFrame = STEPS_PER_FRAME;

    for (let i = 0; i < stepsThisFrame; i++) {
      s.a = rk4Step(s.a, DT);
      s.b = rk4Step(s.b, DT);

      // Store [θ1, θ2] so trails are resolution-independent
      const anglesA: [number, number] = [s.a.θ1, s.a.θ2];
      const anglesB: [number, number] = [s.b.θ1, s.b.θ2];
      s.trailA.push(anglesA);
      s.trailB.push(anglesB);
      s.permTrailA.push(anglesA);
      s.permTrailB.push(anglesB);
      if (s.trailA.length > MAX_TRAIL) s.trailA.shift();
      if (s.trailB.length > MAX_TRAIL) s.trailB.shift();
      s.step++;

      if (s.step % 30 === 0) {
        const pA = pendulumPositions(s.a, 1, 0, 0);
        const pB = pendulumPositions(s.b, 1, 0, 0);
        const dist = Math.sqrt((pA.x2 - pB.x2) ** 2 + (pA.y2 - pB.y2) ** 2);
        s.divData.push({ t: +(s.step * DT).toFixed(2), d: +dist.toFixed(4) });
        if (s.divData.length > 200) s.divData.shift();
      }
    }

    drawFrame();

    if (s.step % 30 === 0 || s.step % stepsThisFrame === 0) {
      setDivData([...s.divData]);
      const posA = pendulumPositions(s.a, 1, 0, 0);
      const posB = pendulumPositions(s.b, 1, 0, 0);
      const dist = Math.sqrt((posA.x2 - posB.x2) ** 2 + (posA.y2 - posB.y2) ** 2);
      setLiveDistance(dist);
      // Speed difference (angular velocities)
      const speedDiff = Math.sqrt((s.a.ω1 - s.b.ω1) ** 2 + (s.a.ω2 - s.b.ω2) ** 2);
      setLiveSpeedDiff(speedDiff);
      // Angle difference
      const angleDiff = Math.sqrt(
        (Math.sin(s.a.θ1) - Math.sin(s.b.θ1)) ** 2 + (Math.cos(s.a.θ1) - Math.cos(s.b.θ1)) ** 2 +
        (Math.sin(s.a.θ2) - Math.sin(s.b.θ2)) ** 2 + (Math.cos(s.a.θ2) - Math.cos(s.b.θ2)) ** 2
      );
      setLiveAngleDiff(angleDiff);
      // Push combined deviation to EKG buffer
      const combined = dist + speedDiff / 5 + angleDiff;
      ekgDataRef.current.push(combined);
      if (ekgDataRef.current.length > 500) ekgDataRef.current.shift();
      drawEkg();
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  useEffect(() => {
    if (running) {
      runRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      runRef.current = false;
      cancelAnimationFrame(rafRef.current);
    }
    return () => { runRef.current = false; cancelAnimationFrame(rafRef.current); };
  }, [running, animate]);

  useEffect(() => { drawFrame(); }, [drawFrame]);

  useEffect(() => {
    const handleResize = () => drawFrame();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);


  return (
    <div className={`${embedded ? '' : 'bg-background'} flex flex-col p-2 md:p-3 overflow-hidden`} style={{ height: embedded ? undefined : '100dvh' }}>
      {/* Header + Controls in one compact row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5 flex-shrink-0">
        <h1 className="text-sm md:text-base font-bold font-mono text-primary">{t.title}</h1>
        <div className="flex items-center gap-1.5">
          <Button
            variant={running ? 'secondary' : 'default'}
            size="sm"
            onClick={() => setRunning(!running)}
            className="font-mono h-6 text-[10px] px-2"
          >
            {running ? <><Pause size={10} className="mr-0.5" />{t.pause}</> : <><Play size={10} className="mr-0.5" />{t.play}</>}
          </Button>
          <Button variant="outline" size="sm" onClick={resetSim} className="font-mono h-6 text-[10px] px-2">
            <RotateCcw size={10} className="mr-0.5" />{t.reset}
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">Δθ</span>
          <Slider
            value={[Math.log10(Math.max(offsetDeg, 0.00001))]}
            min={-5}
            max={Math.log10(3.6)}
            step={0.05}
            onValueChange={([v]) => setOffsetDeg(+(10 ** v).toPrecision(3))}
            className="w-24 md:w-32"
          />
          <span className="text-[9px] text-primary font-mono font-bold whitespace-nowrap">
            {(() => { const p = offsetDeg / 360 * 100; return p < 0.0001 ? p.toFixed(7) : p < 0.01 ? p.toFixed(5) : p.toFixed(4); })()} %
          </span>
        </div>
      </div>

      {/* Main content – fills remaining space */}
      {/* Desktop: side by side | Mobile: pendulum on top, gauges below */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[1fr_180px] gap-1.5">
        {/* Pendulum Canvas */}
        <div className="min-h-0 flex-1">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-lg bg-background/80 border border-border/20"
          />
        </div>

        {/* Sidebar: Gauges + EKG */}
        <div className="flex flex-row md:flex-col gap-1.5 md:gap-2 flex-shrink-0 md:justify-center"
             style={{ maxHeight: 'calc(100%)' }}>
          {/* On mobile: 3 gauges + EKG in a row; on desktop: stacked */}
          <div className="flex-1 md:flex-none">
            <LiveGauge
              label={language === 'de' ? 'Abstand' : language === 'fr' ? 'Distance' : 'Distance'}
              value={liveDistance}
              max={4}
              color="hsl(180, 80%, 55%)"
              warningColor="hsl(35, 90%, 55%)"
              dangerColor="hsl(0, 85%, 60%)"
              hint={running || liveDistance > 0}
            />
          </div>
          <div className="flex-1 md:flex-none">
            <LiveGauge
              label={language === 'de' ? 'Tempo Δ' : language === 'fr' ? 'Vitesse Δ' : 'Speed Δ'}
              value={liveSpeedDiff}
              max={20}
              color="hsl(260, 70%, 60%)"
              warningColor="hsl(280, 70%, 55%)"
              dangerColor="hsl(320, 80%, 55%)"
              hint={running || liveSpeedDiff > 0}
            />
          </div>
          <div className="flex-1 md:flex-none">
            <LiveGauge
              label={language === 'de' ? 'Winkel Δ' : language === 'fr' ? 'Angle Δ' : 'Angle Δ'}
              value={liveAngleDiff}
              max={2.83}
              color="hsl(45, 90%, 55%)"
              warningColor="hsl(30, 90%, 55%)"
              dangerColor="hsl(0, 85%, 60%)"
              hint={running || liveAngleDiff > 0}
            />
          </div>

          {/* EKG monitor */}
          <div className="flex-1 md:flex-none pt-1 border-t border-border/20 md:pt-1.5">
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[7px] md:text-[8px] text-muted-foreground font-mono uppercase tracking-wider">
                {language === 'de' ? 'Abweichung' : language === 'fr' ? 'Déviation' : 'Deviation'}
              </span>
              <span className="text-[8px] md:text-[9px] font-mono font-bold text-primary">
                {(liveDistance + liveSpeedDiff / 5 + liveAngleDiff).toFixed(3)}
              </span>
            </div>
            <canvas
              ref={ekgRef}
              className="w-full rounded bg-background/80 border border-border/20"
              style={{ height: 50 }}
            />
            <p className="text-[6px] md:text-[7px] text-muted-foreground/40 font-mono mt-0.5">
              Δ: {(() => { const p = offsetDeg / 360 * 100; return p < 0.0001 ? p.toFixed(7) : p < 0.01 ? p.toFixed(5) : p.toFixed(4); })()} %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
/* ── Live Gauge Bar ───────────────────────────────────────────── */

const LiveGauge = ({ label, value, max, color, warningColor, dangerColor, hint }: {
  label: string; value: number; max: number;
  color: string; warningColor: string; dangerColor: string;
  hint: boolean;
}) => {
  const pct = Math.min(value / max, 1) * 100;
  const barColor = pct > 75 ? dangerColor : pct > 40 ? warningColor : color;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color: barColor }}>
          {hint ? value.toFixed(3) : '–'}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-background/80 border border-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: hint ? `${pct}%` : '0%',
            backgroundColor: barColor,
            boxShadow: pct > 50 ? `0 0 8px ${barColor}` : 'none',
          }}
        />
      </div>
    </div>
  );
};

export default ButterflyEffectLab;
