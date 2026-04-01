import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

/* ── Lorenz ODE integrator (RK4) ─────────────────────────────── */

interface LorenzParams {
  sigma: number;
  rho: number;
  beta: number;
}

type Vec3 = [number, number, number];

const lorenz = (s: Vec3, p: LorenzParams): Vec3 => [
  p.sigma * (s[1] - s[0]),
  s[0] * (p.rho - s[2]) - s[1],
  s[0] * s[1] - p.beta * s[2],
];

const rk4Step = (s: Vec3, p: LorenzParams, dt: number): Vec3 => {
  const k1 = lorenz(s, p);
  const s2: Vec3 = [s[0] + k1[0] * dt / 2, s[1] + k1[1] * dt / 2, s[2] + k1[2] * dt / 2];
  const k2 = lorenz(s2, p);
  const s3: Vec3 = [s[0] + k2[0] * dt / 2, s[1] + k2[1] * dt / 2, s[2] + k2[2] * dt / 2];
  const k3 = lorenz(s3, p);
  const s4: Vec3 = [s[0] + k3[0] * dt, s[1] + k3[1] * dt, s[2] + k3[2] * dt];
  const k4 = lorenz(s4, p);
  return [
    s[0] + (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * dt / 6,
    s[1] + (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * dt / 6,
    s[2] + (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * dt / 6,
  ];
};

/* ── Translations ────────────────────────────────────────────── */

const texts = {
  de: {
    title: 'Butterfly Effect Lab',
    subtitle: 'Wie winzige Unterschiede in nichtlinearen Systemen zu völlig verschiedenen Ergebnissen führen.',
    params: 'Lorenz-Parameter',
    sigma: 'σ (Prandtl-Zahl)',
    rho: 'ρ (Rayleigh-Zahl)',
    beta: 'β (Geometrie-Faktor)',
    offset: 'Anfangsabweichung Δx₀',
    phase: 'Phasenraum (X–Z-Projektion)',
    divergence: 'Divergenz der Trajektorien',
    trajectory: 'Trajektorie',
    distance: 'Abstand',
    time: 'Zeit',
    play: 'Starten',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    explainTitle: 'Was passiert hier?',
    explain1: 'Zwei nahezu identische Ausgangszustände entwickeln sich zunächst parallel – bis das System an einem kritischen Punkt plötzlich divergiert.',
    explain2: 'Genau dieses Verhalten macht Klimamodelle, Finanzmärkte und andere nichtlineare Systeme so schwer vorhersagbar.',
    explain3: 'Die Lorenz-Gleichungen wurden 1963 als vereinfachtes Atmosphärenmodell formuliert und gelten als Geburtsstunde der Chaostheorie.',
    climateTitle: 'Bezug zum Klima',
    climate1: 'Das Klimasystem enthält hunderte gekoppelter nichtlinearer Variablen – Wind, Temperatur, Meeresströmungen, Wolkenbildung.',
    climate2: 'Schon minimale Veränderungen in der Anfangstemperatur oder CO₂-Konzentration können langfristig völlig andere Klimapfade erzeugen.',
    climate3: 'Deshalb arbeiten Klimawissenschaftler mit Ensemble-Simulationen: Viele parallele Durchläufe mit leicht variierten Anfangsbedingungen zeigen die Bandbreite möglicher Entwicklungen.',
  },
  en: {
    title: 'Butterfly Effect Lab',
    subtitle: 'How tiny differences in nonlinear systems lead to completely different outcomes.',
    params: 'Lorenz Parameters',
    sigma: 'σ (Prandtl number)',
    rho: 'ρ (Rayleigh number)',
    beta: 'β (Geometry factor)',
    offset: 'Initial offset Δx₀',
    phase: 'Phase Space (X–Z Projection)',
    divergence: 'Trajectory Divergence',
    trajectory: 'Trajectory',
    distance: 'Distance',
    time: 'Time',
    play: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    explainTitle: 'What is happening?',
    explain1: 'Two nearly identical initial states evolve in parallel at first – until the system suddenly diverges at a critical point.',
    explain2: 'This exact behaviour makes climate models, financial markets, and other nonlinear systems so difficult to predict.',
    explain3: 'The Lorenz equations were formulated in 1963 as a simplified atmospheric model and are considered the birth of chaos theory.',
    climateTitle: 'Connection to Climate',
    climate1: 'The climate system contains hundreds of coupled nonlinear variables – wind, temperature, ocean currents, cloud formation.',
    climate2: 'Even minimal changes in initial temperature or CO₂ concentration can produce entirely different long-term climate paths.',
    climate3: 'This is why climate scientists use ensemble simulations: many parallel runs with slightly varied initial conditions reveal the range of possible outcomes.',
  },
  fr: {
    title: 'Laboratoire Effet Papillon',
    subtitle: 'Comment de minuscules différences dans les systèmes non linéaires mènent à des résultats radicalement différents.',
    params: 'Paramètres de Lorenz',
    sigma: 'σ (nombre de Prandtl)',
    rho: 'ρ (nombre de Rayleigh)',
    beta: 'β (facteur géométrique)',
    offset: 'Décalage initial Δx₀',
    phase: 'Espace des phases (projection X–Z)',
    divergence: 'Divergence des trajectoires',
    trajectory: 'Trajectoire',
    distance: 'Distance',
    time: 'Temps',
    play: 'Démarrer',
    pause: 'Pause',
    reset: 'Réinitialiser',
    explainTitle: 'Que se passe-t-il ?',
    explain1: 'Deux états initiaux quasi identiques évoluent d\'abord en parallèle, puis le système diverge soudainement à un point critique.',
    explain2: 'C\'est exactement ce comportement qui rend les modèles climatiques, les marchés financiers et autres systèmes non linéaires si difficiles à prédire.',
    explain3: 'Les équations de Lorenz ont été formulées en 1963 comme un modèle atmosphérique simplifié et sont considérées comme la naissance de la théorie du chaos.',
    climateTitle: 'Lien avec le climat',
    climate1: 'Le système climatique contient des centaines de variables non linéaires couplées : vent, température, courants océaniques, formation de nuages.',
    climate2: 'Même des changements minimes de la température initiale ou de la concentration de CO₂ peuvent produire des trajectoires climatiques totalement différentes à long terme.',
    climate3: 'C\'est pourquoi les climatologues utilisent des simulations d\'ensemble : de nombreuses exécutions parallèles avec des conditions initiales légèrement variées révèlent l\'éventail des résultats possibles.',
  },
};

/* ── Component ───────────────────────────────────────────────── */

interface Props {
  embedded?: boolean;
}

const DT = 0.005;
const STEPS_PER_FRAME = 8;
const MAX_TRAIL = 2000;

const ButterflyEffectLab = ({ embedded }: Props) => {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;

  const [sigma, setSigma] = useState(10);
  const [rho, setRho] = useState(28);
  const [beta, setBeta] = useState(2.667);
  const [offset, setOffset] = useState(0.0001);
  const [running, setRunning] = useState(false);

  // Store params in refs so the animation loop always reads live values
  const sigmaRef = useRef(sigma);
  const rhoRef = useRef(rho);
  const betaRef = useRef(beta);
  sigmaRef.current = sigma;
  rhoRef.current = rho;
  betaRef.current = beta;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    a: Vec3; b: Vec3;
    trailA: Vec3[]; trailB: Vec3[];
    divData: { t: number; d: number }[];
    step: number;
  }>({
    a: [1, 1, 1],
    b: [1 + offset, 1, 1],
    trailA: [],
    trailB: [],
    divData: [],
    step: 0,
  });

  const [divData, setDivData] = useState<{ t: number; d: number }[]>([]);
  const rafRef = useRef<number>(0);
  const runRef = useRef(false);

  const resetSim = useCallback(() => {
    setRunning(false);
    runRef.current = false;
    const s = stateRef.current;
    s.a = [1, 1, 1];
    s.b = [1 + offset, 1, 1];
    s.trailA = [];
    s.trailB = [];
    s.divData = [];
    s.step = 0;
    setDivData([]);
    drawTrails();
  }, [offset]);

  // Only reset on offset change (not on σ/ρ/β — those apply live)
  useEffect(() => {
    resetSim();
  }, [offset]);

  /* ── Canvas drawing ──────────────────────────────────────── */

  const projectXZ = (v: Vec3, w: number, h: number): [number, number] => {
    const scale = Math.min(w, h) / 60;
    return [
      w / 2 + v[0] * scale,
      h - 40 - (v[2] - 20) * scale,
    ];
  };

  const drawTrails = useCallback(() => {
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

    // Grid
    ctx.strokeStyle = 'hsla(var(--muted-foreground) / 0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const s = stateRef.current;

    // Trail A (cyan/primary)
    if (s.trailA.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(180 80% 55%)';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      const [sx, sy] = projectXZ(s.trailA[0], w, h);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < s.trailA.length; i++) {
        const [px, py] = projectXZ(s.trailA[i], w, h);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Trail B (orange/warm)
    if (s.trailB.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(30 90% 55%)';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      const [sx, sy] = projectXZ(s.trailB[0], w, h);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < s.trailB.length; i++) {
        const [px, py] = projectXZ(s.trailB[i], w, h);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Current position markers
    if (s.trailA.length > 0) {
      const [ax, ay] = projectXZ(s.trailA[s.trailA.length - 1], w, h);
      ctx.fillStyle = 'hsl(180 80% 55%)';
      ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (s.trailB.length > 0) {
      const [bx, by] = projectXZ(s.trailB[s.trailB.length - 1], w, h);
      ctx.fillStyle = 'hsl(30 90% 55%)';
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Labels
    ctx.font = '11px monospace';
    ctx.fillStyle = 'hsl(180 80% 55%)';
    ctx.fillText(`${t.trajectory} A`, 12, 20);
    ctx.fillStyle = 'hsl(30 90% 55%)';
    ctx.fillText(`${t.trajectory} B (Δx₀ = ${offset})`, 12, 36);

    // Axes labels
    ctx.fillStyle = 'hsla(0 0% 70% / 0.6)';
    ctx.fillText('X →', w - 30, h - 10);
    ctx.fillText('Z ↑', 12, h - 10);
  }, [offset, t]);

  /* ── Animation loop ──────────────────────────────────────── */

  const animate = useCallback(() => {
    if (!runRef.current) return;
    const s = stateRef.current;
    const params: LorenzParams = { sigma: sigmaRef.current, rho: rhoRef.current, beta: betaRef.current };

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      s.a = rk4Step(s.a, params, DT);
      s.b = rk4Step(s.b, params, DT);
      s.trailA.push([...s.a]);
      s.trailB.push([...s.b]);
      if (s.trailA.length > MAX_TRAIL) s.trailA.shift();
      if (s.trailB.length > MAX_TRAIL) s.trailB.shift();
      s.step++;

      if (s.step % 20 === 0) {
        const dist = Math.sqrt(
          (s.a[0] - s.b[0]) ** 2 + (s.a[1] - s.b[1]) ** 2 + (s.a[2] - s.b[2]) ** 2
        );
        s.divData.push({ t: +(s.step * DT).toFixed(2), d: +dist.toFixed(4) });
        if (s.divData.length > 200) s.divData.shift();
      }
    }

    drawTrails();
    if (stateRef.current.step % 40 === 0) {
      setDivData([...s.divData]);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [drawTrails]);

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

  // Initial draw
  useEffect(() => {
    drawTrails();
  }, [drawTrails]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawTrails();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawTrails]);

  const chartConfig = useMemo(() => ({
    d: { label: t.distance, color: 'hsl(0 85% 60%)' },
  }), [t]);

  const formatOffset = (v: number) => {
    if (v >= 0.01) return v.toFixed(2);
    if (v >= 0.001) return v.toFixed(3);
    return v.toFixed(4);
  };

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-background'} space-y-6`}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold font-mono text-primary">{t.title}</h1>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">{t.subtitle}</p>
      </div>

      {/* Controls */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono text-primary">{t.params}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ParamSlider label={t.sigma} value={sigma} min={1} max={30} step={0.5} onChange={setSigma} />
            <ParamSlider label={t.rho} value={rho} min={1} max={50} step={0.5} onChange={setRho} />
            <ParamSlider label={t.beta} value={beta} min={0.5} max={8} step={0.1} onChange={setBeta} />
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-mono">{t.offset}</span>
                <span className="text-primary font-mono font-bold">{formatOffset(offset)}</span>
              </div>
              <Slider
                value={[Math.log10(offset)]}
                min={-6}
                max={-1}
                step={0.1}
                onValueChange={([v]) => setOffset(+(10 ** v).toFixed(6))}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
                <span>0.000001</span>
                <span>0.1</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant={running ? 'secondary' : 'default'}
              size="sm"
              onClick={() => setRunning(!running)}
              className="font-mono"
            >
              {running ? <><Pause size={14} className="mr-1.5" />{t.pause}</> : <><Play size={14} className="mr-1.5" />{t.play}</>}
            </Button>
            <Button variant="outline" size="sm" onClick={resetSim} className="font-mono">
              <RotateCcw size={14} className="mr-1.5" />{t.reset}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phase Space Canvas */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono text-primary">{t.phase}</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg bg-background/80 border border-border/20"
            style={{ height: 360 }}
          />
        </CardContent>
      </Card>

      {/* Divergence Chart */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono text-primary">{t.divergence}</CardTitle>
        </CardHeader>
        <CardContent>
          {divData.length > 2 ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={divData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,50%,0.15)" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: t.time, position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: t.distance, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="d" stroke="hsl(0 85% 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground/50 text-sm font-mono">
              {t.play} ▸
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanatory Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono text-primary flex items-center gap-2">
              <Info size={16} />{t.explainTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>{t.explain1}</p>
            <p>{t.explain2}</p>
            <p className="text-muted-foreground text-xs italic">{t.explain3}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono text-primary flex items-center gap-2">
              <Info size={16} />{t.climateTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>{t.climate1}</p>
            <p>{t.climate2}</p>
            <p className="text-muted-foreground text-xs italic">{t.climate3}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ── Param Slider ────────────────────────────────────────────── */

const ParamSlider = ({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground font-mono">{label}</span>
      <span className="text-primary font-mono font-bold">{value}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

export default ButterflyEffectLab;
