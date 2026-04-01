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
    subtitle: 'Zwei fast gleiche Startpunkte – und trotzdem ein völlig anderes Ergebnis. Hier lässt sich das live nachvollziehen.',
    params: 'Einstellungen',
    sigma: 'σ – Wie stark sich Wärme verteilt',
    rho: 'ρ – Wie stark der Antrieb von unten wirkt',
    beta: 'β – Wie schnell Energie abfließt',
    offset: 'Startunterschied zwischen A und B',
    phase: 'Flugbahn der zwei Systeme (Draufsicht)',
    divergence: 'Wie weit A und B auseinanderlaufen',
    trajectory: 'System',
    distance: 'Abstand',
    time: 'Zeit',
    play: 'Starten',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    explainTitle: 'Was passiert hier?',
    explain1: 'Zwei Simulationen starten fast identisch – der Unterschied ist so klein, dass er anfangs unsichtbar ist. Trotzdem laufen die Kurven irgendwann völlig auseinander. Das ist der „Schmetterlingseffekt": Winzige Ursachen können riesige Wirkungen haben.',
    explain2: 'Dieses Verhalten ist kein Fehler, sondern eine Eigenschaft bestimmter Systeme. Wetter, Klima, Börsenkurse – sie alle reagieren so empfindlich auf kleinste Änderungen, dass langfristige Vorhersagen grundsätzlich unsicher bleiben.',
    explain3: 'Edward Lorenz entdeckte das 1963 zufällig, als er ein Wettermodell am Computer rechnete und Nachkommastellen rundete. Das Ergebnis war völlig anders. So entstand die Chaostheorie.',
    climateTitle: 'Was hat das mit Klima zu tun?',
    climate1: 'Das Klima hängt von hunderten Faktoren ab, die sich gegenseitig beeinflussen: Wind bewegt Wärme, Wärme verändert Wolken, Wolken reflektieren Sonnenlicht. Alles hängt mit allem zusammen.',
    climate2: 'Schon ein kleiner Unterschied – zum Beispiel 0,1 °C mehr Anfangstemperatur oder etwas mehr CO₂ – kann langfristig einen komplett anderen Klimaverlauf erzeugen.',
    climate3: 'Deshalb berechnen Klimaforscher nicht eine einzige Vorhersage, sondern hunderte Varianten gleichzeitig. So wird sichtbar, welche Entwicklungen wahrscheinlich sind – und wo die Unsicherheit liegt.',
  },
  en: {
    title: 'Butterfly Effect Lab',
    subtitle: 'Two nearly identical starting points – yet a completely different outcome. See it happen in real time.',
    params: 'Settings',
    sigma: 'σ – How fast heat spreads',
    rho: 'ρ – How strong the driving force is',
    beta: 'β – How quickly energy dissipates',
    offset: 'Starting difference between A and B',
    phase: 'Flight path of both systems (top view)',
    divergence: 'How far A and B drift apart',
    trajectory: 'System',
    distance: 'Distance',
    time: 'Time',
    play: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    explainTitle: 'What is happening?',
    explain1: 'Two simulations start almost identically – the difference is so small it\'s invisible at first. Yet at some point, the curves diverge completely. This is the "butterfly effect": tiny causes can have enormous consequences.',
    explain2: 'This behaviour is not a bug – it\'s a fundamental property of certain systems. Weather, climate, stock markets – they all react so sensitively to the smallest changes that long-term predictions remain inherently uncertain.',
    explain3: 'Edward Lorenz discovered this by accident in 1963 when he rounded decimal places in a weather model. The result was completely different. That\'s how chaos theory was born.',
    climateTitle: 'What does this have to do with climate?',
    climate1: 'Climate depends on hundreds of factors that influence each other: wind moves heat, heat changes clouds, clouds reflect sunlight. Everything is connected to everything.',
    climate2: 'Even a small difference – say 0.1 °C more initial temperature or slightly more CO₂ – can produce a completely different climate trajectory over decades.',
    climate3: 'That\'s why climate scientists don\'t calculate a single prediction but hundreds of variations at once. This reveals which developments are likely – and where the uncertainty lies.',
  },
  fr: {
    title: 'Laboratoire Effet Papillon',
    subtitle: 'Deux points de départ presque identiques – et pourtant un résultat totalement différent. Observez en temps réel.',
    params: 'Réglages',
    sigma: 'σ – Vitesse de propagation de la chaleur',
    rho: 'ρ – Intensité de la force motrice',
    beta: 'β – Vitesse de dissipation de l\'énergie',
    offset: 'Différence de départ entre A et B',
    phase: 'Trajectoire des deux systèmes (vue de dessus)',
    divergence: 'Écart entre A et B au fil du temps',
    trajectory: 'Système',
    distance: 'Distance',
    time: 'Temps',
    play: 'Démarrer',
    pause: 'Pause',
    reset: 'Réinitialiser',
    explainTitle: 'Que se passe-t-il ?',
    explain1: 'Deux simulations démarrent de manière quasi identique – la différence est si infime qu\'elle est d\'abord invisible. Pourtant, à un moment donné, les courbes divergent totalement. C\'est « l\'effet papillon » : de minuscules causes peuvent avoir d\'énormes conséquences.',
    explain2: 'Ce comportement n\'est pas un bug – c\'est une propriété fondamentale de certains systèmes. Météo, climat, marchés financiers – tous réagissent si sensiblement aux moindres changements que les prédictions à long terme restent fondamentalement incertaines.',
    explain3: 'Edward Lorenz a découvert cela par hasard en 1963 en arrondissant des décimales dans un modèle météo. Le résultat était totalement différent. C\'est ainsi qu\'est née la théorie du chaos.',
    climateTitle: 'Quel rapport avec le climat ?',
    climate1: 'Le climat dépend de centaines de facteurs qui s\'influencent mutuellement : le vent déplace la chaleur, la chaleur modifie les nuages, les nuages réfléchissent la lumière du soleil. Tout est lié à tout.',
    climate2: 'Même une petite différence – par exemple 0,1 °C de température initiale en plus ou un peu plus de CO₂ – peut produire une trajectoire climatique complètement différente sur des décennies.',
    climate3: 'C\'est pourquoi les climatologues ne calculent pas une seule prédiction mais des centaines de variantes en parallèle. Cela révèle quelles évolutions sont probables – et où se situe l\'incertitude.',
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
    // Center the Lorenz attractor: X range ~[-22,22], Z range ~[0,50]
    const padding = 30;
    const usableW = w - padding * 2;
    const usableH = h - padding * 2;
    const scaleX = usableW / 50;  // X spans ~50 units
    const scaleZ = usableH / 55;  // Z spans ~55 units
    const scale = Math.min(scaleX, scaleZ);
    return [
      w / 2 + v[0] * scale,
      h - padding - v[2] * scale,
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
            style={{ height: 300 }}
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
