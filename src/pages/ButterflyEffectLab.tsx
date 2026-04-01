import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Info, Lightbulb, MessageSquare, Scale } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

/* ── Double Pendulum Physics ─────────────────────────────────── */

interface PendulumState {
  θ1: number; θ2: number; ω1: number; ω2: number;
}

const G = 9.81;
const L1 = 1;
const L2 = 1;
const M1 = 1;
const M2 = 1;

/** Compute angular accelerations for a double pendulum */
const doublePendulumAccel = (s: PendulumState): { α1: number; α2: number } => {
  const { θ1, θ2, ω1, ω2 } = s;
  const Δ = θ1 - θ2;
  const sinΔ = Math.sin(Δ);
  const cosΔ = Math.cos(Δ);

  const denom1 = (M1 + M2) * L1 - M2 * L1 * cosΔ * cosΔ;
  const α1 = (-M2 * L1 * ω1 * ω1 * sinΔ * cosΔ
    + M2 * G * Math.sin(θ2) * cosΔ
    - M2 * L2 * ω2 * ω2 * sinΔ
    - (M1 + M2) * G * Math.sin(θ1)) / denom1;

  const denom2 = (L2 / L1) * denom1;
  const α2 = (M2 * L2 * ω2 * ω2 * sinΔ * cosΔ
    + (M1 + M2) * G * Math.sin(θ1) * cosΔ
    + (M1 + M2) * L1 * ω1 * ω1 * sinΔ
    - (M1 + M2) * G * Math.sin(θ2)) / denom2;

  return { α1, α2 };
};

/** RK4 integration step */
const rk4Step = (s: PendulumState, dt: number): PendulumState => {
  const deriv = (st: PendulumState) => {
    const { α1, α2 } = doublePendulumAccel(st);
    return { dθ1: st.ω1, dθ2: st.ω2, dω1: α1, dω2: α2 };
  };

  const k1 = deriv(s);
  const s2: PendulumState = {
    θ1: s.θ1 + k1.dθ1 * dt / 2, θ2: s.θ2 + k1.dθ2 * dt / 2,
    ω1: s.ω1 + k1.dω1 * dt / 2, ω2: s.ω2 + k1.dω2 * dt / 2,
  };
  const k2 = deriv(s2);
  const s3: PendulumState = {
    θ1: s.θ1 + k2.dθ1 * dt / 2, θ2: s.θ2 + k2.dθ2 * dt / 2,
    ω1: s.ω1 + k2.dω1 * dt / 2, ω2: s.ω2 + k2.dω2 * dt / 2,
  };
  const k3 = deriv(s3);
  const s4: PendulumState = {
    θ1: s.θ1 + k3.dθ1 * dt, θ2: s.θ2 + k3.dθ2 * dt,
    ω1: s.ω1 + k3.dω1 * dt, ω2: s.ω2 + k3.dω2 * dt,
  };
  const k4 = deriv(s4);

  return {
    θ1: s.θ1 + (k1.dθ1 + 2 * k2.dθ1 + 2 * k3.dθ1 + k4.dθ1) * dt / 6,
    θ2: s.θ2 + (k1.dθ2 + 2 * k2.dθ2 + 2 * k3.dθ2 + k4.dθ2) * dt / 6,
    ω1: s.ω1 + (k1.dω1 + 2 * k2.dω1 + 2 * k3.dω1 + k4.dω1) * dt / 6,
    ω2: s.ω2 + (k1.dω2 + 2 * k2.dω2 + 2 * k3.dω2 + k4.dω2) * dt / 6,
  };
};

/** Convert pendulum state to tip positions */
const pendulumPositions = (s: PendulumState, scale: number, cx: number, cy: number) => {
  const x1 = cx + L1 * Math.sin(s.θ1) * scale;
  const y1 = cy + L1 * Math.cos(s.θ1) * scale;
  const x2 = x1 + L2 * Math.sin(s.θ2) * scale;
  const y2 = y1 + L2 * Math.cos(s.θ2) * scale;
  return { x1, y1, x2, y2 };
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
    climateTitle: 'Was hat das mit der Natur zu tun?',
    climate1: 'Natürliche Systeme wie Wetter, Meeresströmungen oder Ökosysteme verhalten sich ähnlich: Sie folgen klaren physikalischen Regeln, sind aber trotzdem langfristig nicht exakt vorhersagbar.',
    climate2: 'Kein noch so gutes Modell kann alle Wechselwirkungen perfekt erfassen – genau wie beim Doppelpendel reicht ein winziger Unterschied, um das Ergebnis komplett zu verändern.',
    climate3: 'Das bedeutet nicht, dass Vorhersagen sinnlos sind. Aber es zeigt, warum Sicherheit in komplexen Systemen eine Illusion ist – und warum Demut vor der Komplexität der Natur angebracht wäre.',
    criticTitle: 'Gegenargumente und Einordnung',
    critic1q: '„Der CO₂-Anstieg ist nicht Ursache, sondern Folge der Erwärmung."',
    critic1a: 'In Eisbohrkernen zeigt sich tatsächlich, dass in früheren Zyklen die Temperatur oft vor dem CO₂ anstieg – ausgelöst durch Erdbahnveränderungen. Das CO₂ wirkte dann als Verstärker. Heute ist die Situation umgekehrt: Der CO₂-Anstieg geht der Erwärmung voraus und ist auf Verbrennung fossiler Brennstoffe zurückführbar (Isotopen-Signatur). Ob man das als ausreichenden Beweis sieht, bleibt dem Betrachter überlassen.',
    critic2q: '„Wir leben in einer Eiszeit – das Römische Klimaoptimum und die Mittelalterliche Warmzeit waren wärmer."',
    critic2a: 'Geologisch befinden wir uns tatsächlich in einem Eiszeitalter (solange Polkappen existieren). Regionale Warmperioden wie das Römische Optimum (~250 v.Chr.–400 n.Chr.) oder das Mittelalterliche Optimum (~900–1300) sind belegt. Die Mainstream-Forschung sagt, die aktuelle Erwärmung sei global und schneller. Kritiker verweisen darauf, dass historische Datennetze zu dünn sind, um das sicher zu vergleichen.',
    critic3q: '„Auch ohne den Menschen gab es sehr schnelle Temperaturänderungen."',
    critic3a: 'Das stimmt – am Ende der letzten Eiszeit stieg die Temperatur in Grönland innerhalb weniger Jahrzehnte um bis zu 10 °C (Dansgaard-Oeschger-Ereignisse). Solche Sprünge zeigen, dass das Klimasystem zu abrupten Übergängen fähig ist – ganz ohne menschlichen Einfluss.',
    critic4q: '„In nichtlinearen Systemen lassen sich dämpfende Rückkopplungen nur schätzen."',
    critic4a: 'Das ist mathematisch korrekt und genau das, was dieses Lab zeigt. In chaotischen Systemen hängen Ergebnisse extrem von Anfangsbedingungen und Parametern ab. Wolkenbildung, Ozean-Absorption, Vegetations-Feedback – all das sind Faktoren, deren genaue Stärke nur geschätzt werden kann. Die Forschung arbeitet mit Wahrscheinlichkeitsbereichen, nicht mit Gewissheiten.',
    critic5q: '„Ozeane und Pflanzen brauchen CO₂ – es pauschal zu verteufeln zeigt fehlendes Verständnis."',
    critic5a: 'CO₂ ist tatsächlich ein essenzieller Baustein für Photosynthese. Mehr CO₂ fördert unter Laborbedingungen das Pflanzenwachstum. In der Realität begrenzen aber Wasser, Nährstoffe und Temperatur das Wachstum – nicht das CO₂ allein. Ozeane nehmen rund ein Viertel des CO₂ auf, was zu Versauerung führt. Die Wirkung von CO₂ ist also komplex: Es ist gleichzeitig Lebensgrundlage und Treibhausgas. Wer es nur als das eine oder das andere betrachtet, vereinfacht.',
    criticNote: 'Dieser Simulator zeigt keine Klimaprognose. Er zeigt, warum nichtlineare Systeme schwer vorhersagbar sind. Die Bewertung der Argumente bleibt beim Betrachter.',
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
    climateTitle: 'What does this have to do with nature?',
    climate1: 'Natural systems like weather, ocean currents, or ecosystems behave similarly: they follow clear physical rules yet remain unpredictable in the long term.',
    climate2: 'No model, no matter how good, can perfectly capture every interaction – just like with the double pendulum, a tiny difference is enough to completely change the outcome.',
    climate3: 'This doesn\'t mean predictions are useless. But it shows why certainty in complex systems is an illusion – and why humility before nature\'s complexity would be appropriate.',
    criticTitle: 'Counter-arguments and context',
    critic1q: '"The CO₂ rise is not the cause but a consequence of warming."',
    critic1a: 'Ice cores do show that in past cycles, temperature often rose before CO₂ – triggered by orbital changes. CO₂ then acted as an amplifier. Today the situation is reversed: the CO₂ rise precedes warming and is traceable to fossil fuel combustion (isotope signature). Whether this constitutes sufficient proof is left to the observer.',
    critic2q: '"We live in an ice age – the Roman Climate Optimum and Medieval Warm Period were warmer."',
    critic2a: 'Geologically, we are indeed in an ice age (as long as polar ice caps exist). Regional warm periods like the Roman Optimum (~250 BC–400 AD) or the Medieval Warm Period (~900–1300) are documented. Mainstream research says today\'s warming is global and faster. Critics point out that historical data networks are too sparse to compare reliably.',
    critic3q: '"There were very rapid temperature changes even without humans."',
    critic3a: 'That\'s true – at the end of the last ice age, temperatures in Greenland rose by up to 10 °C within decades (Dansgaard-Oeschger events). Such jumps show the climate system is capable of abrupt transitions without human influence.',
    critic4q: '"In nonlinear systems, dampening feedbacks can only be estimated."',
    critic4a: 'This is mathematically correct and exactly what this lab demonstrates. In chaotic systems, outcomes depend extremely on initial conditions and parameters. Cloud formation, ocean absorption, vegetation feedback – all are factors whose exact strength can only be estimated. Research works with probability ranges, not certainties.',
    critic5q: '"Oceans and plants need CO₂ – demonising it shows a lack of understanding."',
    critic5a: 'CO₂ is indeed an essential building block for photosynthesis. More CO₂ promotes plant growth under laboratory conditions. In reality, however, water, nutrients, and temperature limit growth – not CO₂ alone. Oceans absorb about a quarter of CO₂, leading to acidification. The effect of CO₂ is complex: it is both a basis of life and a greenhouse gas. Viewing it as only one or the other is a simplification.',
    criticNote: 'This simulator does not show a climate forecast. It shows why nonlinear systems are hard to predict. The evaluation of the arguments is left to the observer.',
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
    climateTitle: 'Quel rapport avec la nature ?',
    climate1: 'Les systèmes naturels comme la météo, les courants océaniques ou les écosystèmes se comportent de manière similaire : ils suivent des règles physiques claires mais restent imprévisibles à long terme.',
    climate2: 'Aucun modèle, aussi bon soit-il, ne peut capturer parfaitement chaque interaction – tout comme le double pendule, une infime différence suffit à changer complètement le résultat.',
    climate3: 'Cela ne signifie pas que les prévisions sont inutiles. Mais cela montre pourquoi la certitude dans les systèmes complexes est une illusion – et pourquoi l\'humilité face à la complexité de la nature serait appropriée.',
    criticTitle: 'Contre-arguments et mise en contexte',
    critic1q: '« La hausse du CO₂ n\'est pas la cause mais la conséquence du réchauffement. »',
    critic1a: 'Les carottes de glace montrent effectivement que lors de cycles passés, la température a souvent augmenté avant le CO₂ – déclenchée par des variations orbitales. Le CO₂ agissait ensuite comme amplificateur. Aujourd\'hui la situation est inversée : la hausse du CO₂ précède le réchauffement et est attribuable à la combustion fossile (signature isotopique). La question de savoir si cela constitue une preuve suffisante est laissée à l\'observateur.',
    critic2q: '« Nous vivons dans une ère glaciaire – l\'Optimum Romain et la Période Chaude Médiévale étaient plus chauds. »',
    critic2a: 'Géologiquement, nous sommes effectivement dans une ère glaciaire (tant que des calottes polaires existent). Des périodes chaudes régionales sont documentées. La recherche dominante affirme que le réchauffement actuel est global et plus rapide. Les critiques soulignent que les réseaux de données historiques sont trop clairsemés pour une comparaison fiable.',
    critic3q: '« Il y a eu des changements de température très rapides même sans l\'homme. »',
    critic3a: 'C\'est vrai – à la fin de la dernière glaciation, les températures au Groenland ont augmenté jusqu\'à 10 °C en quelques décennies (événements de Dansgaard-Oeschger). De tels sauts montrent que le système climatique est capable de transitions abruptes sans influence humaine.',
    critic4q: '« Dans les systèmes non linéaires, les rétroactions atténuantes ne peuvent qu\'être estimées. »',
    critic4a: 'C\'est mathématiquement correct et exactement ce que ce lab démontre. Dans les systèmes chaotiques, les résultats dépendent extrêmement des conditions initiales. La recherche travaille avec des plages de probabilité, pas des certitudes.',
    critic5q: '« Les océans et les plantes ont besoin de CO₂ – le diaboliser montre un manque de compréhension. »',
    critic5a: 'Le CO₂ est effectivement un composant essentiel de la photosynthèse. Plus de CO₂ favorise la croissance végétale en laboratoire. En réalité, l\'eau, les nutriments et la température limitent la croissance – pas le CO₂ seul. Les océans absorbent environ un quart du CO₂, ce qui entraîne l\'acidification. L\'effet du CO₂ est complexe : il est à la fois base de vie et gaz à effet de serre. Le considérer uniquement comme l\'un ou l\'autre est une simplification.',
    criticNote: 'Ce simulateur ne montre pas une prévision climatique. Il montre pourquoi les systèmes non linéaires sont difficiles à prédire. L\'évaluation des arguments est laissée à l\'observateur.',
  },
};

/* ── Component ───────────────────────────────────────────────── */

interface Props {
  embedded?: boolean;
}

const DT = 0.002;
const STEPS_PER_FRAME = 6;
const MAX_TRAIL = 1500;

const ButterflyEffectLab = ({ embedded }: Props) => {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;

  const angle1 = 120;
  const angle2 = 120;
  const [offsetDeg, setOffsetDeg] = useState(0.1);
  const [running, setRunning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toRad = (d: number) => (d * Math.PI) / 180;

  const makeInitialState = useCallback((extraOffset = 0): PendulumState => ({
    θ1: toRad(angle1 + extraOffset),
    θ2: toRad(angle2),
    ω1: 0,
    ω2: 0,
  }), [angle1, angle2]);

  const stateRef = useRef<{
    a: PendulumState; b: PendulumState;
    trailA: [number, number][]; trailB: [number, number][];
    divData: { t: number; d: number }[];
    step: number;
  }>({
    a: makeInitialState(0),
    b: makeInitialState(0.1),
    trailA: [],
    trailB: [],
    divData: [],
    step: 0,
  });

  const [divData, setDivData] = useState<{ t: number; d: number }[]>([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const rafRef = useRef<number>(0);
  const runRef = useRef(false);

  const resetSim = useCallback(() => {
    setRunning(false);
    runRef.current = false;
    const s = stateRef.current;
    s.a = makeInitialState(0);
    s.b = makeInitialState(offsetDeg);
    s.trailA = [];
    s.trailB = [];
    s.divData = [];
    s.step = 0;
    setDivData([]);
    setLiveDistance(0);
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

    const cx = w / 2;
    const cy = h * 0.35;
    const scale = Math.min(w, h) * 0.2;

    const s = stateRef.current;

    // Draw trails (tip of 2nd pendulum)
    const drawTrail = (trail: [number, number][], color: string) => {
      if (trail.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.5;
      ctx.moveTo(trail[0][0], trail[0][1]);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i][0], trail[i][1]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    drawTrail(s.trailA, 'hsl(180, 80%, 55%)');
    drawTrail(s.trailB, 'hsl(30, 90%, 55%)');

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
    ctx.fillText(`${t.trajectory} B (Δθ = ${offsetDeg}°)`, 12, 36);
  }, [offsetDeg, t]);

  /* ── Animation loop ──────────────────────────────────────── */

  const animate = useCallback(() => {
    if (!runRef.current) return;
    const s = stateRef.current;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.getBoundingClientRect().width / 2 : 300;
    const cy = canvas ? canvas.getBoundingClientRect().height * 0.2 : 80;
    const scale = canvas ? Math.min(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height) * 0.22 : 80;

    const stepsThisFrame = STEPS_PER_FRAME;

    for (let i = 0; i < stepsThisFrame; i++) {
      s.a = rk4Step(s.a, DT);
      s.b = rk4Step(s.b, DT);

      const posA = pendulumPositions(s.a, scale, cx, cy);
      const posB = pendulumPositions(s.b, scale, cx, cy);
      s.trailA.push([posA.x2, posA.y2]);
      s.trailB.push([posB.x2, posB.y2]);
      if (s.trailA.length > MAX_TRAIL) s.trailA.shift();
      if (s.trailB.length > MAX_TRAIL) s.trailB.shift();
      s.step++;

      if (s.step % 30 === 0) {
        const dist = Math.sqrt(
          (posA.x2 - posB.x2) ** 2 + (posA.y2 - posB.y2) ** 2
        ) / scale;
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

  const chartConfig = useMemo(() => ({
    d: { label: t.distance, color: 'hsl(0, 85%, 60%)' },
  }), [t]);

  const offsetStart = toRad(offsetDeg);

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-background'} space-y-6`}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold font-mono text-primary">{t.title}</h1>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">{t.subtitle}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
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
        <span className="text-xs text-muted-foreground font-mono self-center ml-2">
          Δθ = {offsetDeg}°
        </span>
      </div>

      {/* Pendulum + Live data side by side */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
        {/* Pendulum Canvas */}
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono text-primary">{t.phase}</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg bg-background/80 border border-border/20"
              style={{ height: 380 }}
            />
          </CardContent>
        </Card>

        {/* Right sidebar: Live Comparison + Divergence Chart */}
        <div className="space-y-4">
          {/* Live Comparison */}
          <Card className={`border ${liveDistance > 1.5 ? 'border-red-500/30 bg-red-500/5' : liveDistance > 0.5 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/40 bg-card/60'} backdrop-blur transition-colors duration-500`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-primary">{t.liveLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              {(running || liveDistance > 0) ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{t.liveStart}</p>
                    <p className="text-base font-bold font-mono text-primary">{offsetDeg}°</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{t.liveCurrent}</p>
                    <p className="text-base font-bold font-mono" style={{ color: liveDistance > 1.5 ? 'hsl(0, 85%, 60%)' : liveDistance > 0.5 ? 'hsl(35, 90%, 55%)' : 'hsl(180, 80%, 55%)' }}>
                      {liveDistance.toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{t.liveFactor}</p>
                    <p className="text-base font-bold font-mono" style={{ color: liveDistance > 1.5 ? 'hsl(0, 85%, 60%)' : liveDistance > 0.5 ? 'hsl(35, 90%, 55%)' : 'hsl(180, 80%, 55%)' }}>
                      {offsetStart > 0 ? `×${Math.round(liveDistance / offsetStart).toLocaleString()}` : '–'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 font-mono py-2">{t.liveHint}</p>
              )}
            </CardContent>
          </Card>

          {/* Divergence Chart */}
          <Card className="border-border/40 bg-card/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-primary">{t.divergence}</CardTitle>
            </CardHeader>
            <CardContent>
              {divData.length > 2 ? (
                <ChartContainer config={chartConfig} className="h-[160px] w-full">
                  <LineChart data={divData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,50%,0.15)" />
                    <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="d" stroke="hsl(0, 85%, 60%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-muted-foreground/50 text-xs font-mono">
                  {t.play} ▸
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Try This */}
      <Card className="border-highlight/20 bg-highlight/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono text-highlight flex items-center gap-2">
            <Lightbulb size={16} />{t.tryThis}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-foreground/80 leading-relaxed list-decimal list-inside">
            <li>{t.try1}</li>
            <li>{t.try2}</li>
            <li>{t.try3}</li>
          </ol>
        </CardContent>
      </Card>

      {/* Critics & Counter-arguments */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono text-primary flex items-center gap-2">
            <Scale size={16} />{t.criticTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { q: t.critic1q, a: t.critic1a },
            { q: t.critic2q, a: t.critic2a },
            { q: t.critic3q, a: t.critic3a },
            { q: t.critic4q, a: t.critic4a },
            { q: t.critic5q, a: t.critic5a },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-semibold text-foreground/90 italic">{item.q}</p>
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed ml-[22px]">{item.a}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic border-t border-border/20 pt-3 mt-3">{t.criticNote}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ButterflyEffectLab;
