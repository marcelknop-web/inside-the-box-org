import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Info, RotateCcw, Thermometer, Droplets, Mountain, Waves } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Area, AreaChart } from 'recharts';

/* ── Climate model ────────────────────────────────────────────── */

interface FeedbackState {
  iceAlbedo: boolean;
  permafrost: boolean;
  oceanCirculation: boolean;
  waterVapor: boolean;
}

interface ClimatePoint {
  co2: number;
  tempBase: number;
  tempWithFeedback: number;
  year: number;
}

const PREINDUSTRIAL_CO2 = 280;
const CURRENT_CO2 = 425;

// Simplified climate sensitivity: ~3°C per doubling of CO₂ (base, no feedbacks)
const BASE_SENSITIVITY = 3.0;

// Feedback multipliers
const FEEDBACK_STRENGTHS = {
  iceAlbedo: 0.35,       // Ice-albedo: ~+35% warming
  permafrost: 0.25,      // Permafrost methane: ~+25%
  oceanCirculation: 0.15, // Ocean circulation weakening: ~+15%
  waterVapor: 0.5,       // Water vapor: ~+50% (strongest feedback)
};

// Tipping point thresholds (in °C above preindustrial)
const TIPPING_POINTS = {
  greenlandIce: { threshold: 1.5, label: { de: 'Grönland-Eis', en: 'Greenland Ice', fr: 'Glace Groenland' } },
  coralReefs: { threshold: 1.5, label: { de: 'Korallenriffe', en: 'Coral Reefs', fr: 'Récifs coralliens' } },
  westAntarctic: { threshold: 2.0, label: { de: 'Westantarktis', en: 'West Antarctic', fr: 'Antarctique Ouest' } },
  permafrostCollapse: { threshold: 3.0, label: { de: 'Permafrost-Kollaps', en: 'Permafrost Collapse', fr: 'Effondrement permafrost' } },
  amazonDieback: { threshold: 3.5, label: { de: 'Amazonas-Absterben', en: 'Amazon Dieback', fr: 'Dépérissement Amazonie' } },
  amocShutdown: { threshold: 4.0, label: { de: 'AMOC-Stillstand', en: 'AMOC Shutdown', fr: 'Arrêt AMOC' } },
};

function computeTemperature(co2: number, feedbacks: FeedbackState): number {
  if (co2 <= PREINDUSTRIAL_CO2) return 0;
  const logRatio = Math.log2(co2 / PREINDUSTRIAL_CO2);
  const baseTemp = BASE_SENSITIVITY * logRatio;

  let feedbackMultiplier = 1;
  if (feedbacks.iceAlbedo) feedbackMultiplier += FEEDBACK_STRENGTHS.iceAlbedo;
  if (feedbacks.permafrost) feedbackMultiplier += FEEDBACK_STRENGTHS.permafrost;
  if (feedbacks.oceanCirculation) feedbackMultiplier += FEEDBACK_STRENGTHS.oceanCirculation;
  if (feedbacks.waterVapor) feedbackMultiplier += FEEDBACK_STRENGTHS.waterVapor;

  return baseTemp * feedbackMultiplier;
}

function generateCurve(feedbacks: FeedbackState): ClimatePoint[] {
  const points: ClimatePoint[] = [];
  for (let co2 = 280; co2 <= 1200; co2 += 10) {
    const baseTemp = BASE_SENSITIVITY * Math.log2(co2 / PREINDUSTRIAL_CO2);
    const tempWithFeedback = computeTemperature(co2, feedbacks);
    // Rough year mapping: 280ppm ≈ 1850, 425ppm ≈ 2024
    const year = Math.round(1850 + (co2 - 280) * (2100 - 1850) / (800 - 280));
    points.push({ co2, tempBase: +baseTemp.toFixed(2), tempWithFeedback: +tempWithFeedback.toFixed(2), year });
  }
  return points;
}

/* ── Translations ────────────────────────────────────────────── */

const texts = {
  de: {
    title: 'CO₂-Kipppunkt-Simulator',
    subtitle: 'Erleben Sie interaktiv, wie CO₂-Konzentration und Feedback-Schleifen Klima-Kipppunkte auslösen.',
    co2Label: 'CO₂-Konzentration',
    ppm: 'ppm',
    tempRise: 'Temperaturanstieg',
    tempRiseLabel: 'Erwärmung über vorindustriellem Niveau',
    feedbackLoops: 'Feedback-Schleifen',
    iceAlbedo: 'Eis-Albedo',
    iceAlbedoDesc: 'Schmelzendes Eis → dunklere Oberfläche → mehr Absorption',
    permafrost: 'Permafrost-Methan',
    permafrostDesc: 'Tauender Permafrost → Methan-Freisetzung → verstärkte Erwärmung',
    ocean: 'Ozean-Zirkulation',
    oceanDesc: 'Schwächere Umwälzung → weniger Wärmetransport → regionale Extreme',
    waterVapor: 'Wasserdampf',
    waterVaporDesc: 'Wärmere Luft → mehr Verdunstung → stärkerer Treibhauseffekt',
    curveTitle: 'Temperatur-Antwort auf CO₂',
    baseOnly: 'Ohne Feedbacks',
    withFeedback: 'Mit Feedbacks',
    tippingZone: 'Kipppunkte',
    reset: 'Zurücksetzen',
    current: 'Heute',
    preindustrial: 'Vorindustriell',
    explainTitle: 'Was zeigt der Simulator?',
    explain1: 'Die Grundkurve basiert auf der Klimasensitivität: ~3 °C Erwärmung pro Verdopplung des CO₂-Gehalts gegenüber dem vorindustriellen Niveau (280 ppm).',
    explain2: 'Feedback-Schleifen verstärken die Erwärmung erheblich. Der Wasserdampf-Feedback allein erhöht die Sensitivität um ~50 %. Zusammen können alle Feedbacks die Erwärmung mehr als verdoppeln.',
    explain3: 'Kipppunkte sind Schwellen, ab denen Veränderungen unumkehrbar werden — z. B. das Abschmelzen des Grönland-Eisschilds oder der Kollaps des Amazonas-Regenwalds.',
    tippingTitle: 'Kipppunkte & Kaskaden',
    tipping1: 'Einzelne Kipppunkte können weitere auslösen: Schmelzendes Eis beschleunigt die Erwärmung, die wiederum Permafrost destabilisiert.',
    tipping2: 'Bei einer Erwärmung über 4 °C drohen mehrere Kippelemente gleichzeitig zu kippen — ein sogenannter „Hothouse Earth"-Pfad.',
    tipping3: 'Das Pariser Abkommen zielt auf maximal 1,5–2 °C, um die gefährlichsten Kipppunkte zu vermeiden.',
    danger: 'Kritisch',
    warning: 'Warnung',
    safe: 'Im Rahmen',
  },
  en: {
    title: 'CO₂ Tipping Point Simulator',
    subtitle: 'Experience interactively how CO₂ concentration and feedback loops trigger climate tipping points.',
    co2Label: 'CO₂ Concentration',
    ppm: 'ppm',
    tempRise: 'Temperature Rise',
    tempRiseLabel: 'Warming above pre-industrial level',
    feedbackLoops: 'Feedback Loops',
    iceAlbedo: 'Ice-Albedo',
    iceAlbedoDesc: 'Melting ice → darker surface → more absorption',
    permafrost: 'Permafrost Methane',
    permafrostDesc: 'Thawing permafrost → methane release → amplified warming',
    ocean: 'Ocean Circulation',
    oceanDesc: 'Weaker overturning → less heat transport → regional extremes',
    waterVapor: 'Water Vapor',
    waterVaporDesc: 'Warmer air → more evaporation → stronger greenhouse effect',
    curveTitle: 'Temperature Response to CO₂',
    baseOnly: 'Without Feedbacks',
    withFeedback: 'With Feedbacks',
    tippingZone: 'Tipping Points',
    reset: 'Reset',
    current: 'Today',
    preindustrial: 'Pre-industrial',
    explainTitle: 'What does the simulator show?',
    explain1: 'The base curve relies on climate sensitivity: ~3 °C warming per doubling of CO₂ above pre-industrial levels (280 ppm).',
    explain2: 'Feedback loops amplify warming significantly. Water vapor feedback alone increases sensitivity by ~50%. Combined, all feedbacks can more than double the warming.',
    explain3: 'Tipping points are thresholds beyond which changes become irreversible — e.g., the melting of the Greenland ice sheet or the collapse of the Amazon rainforest.',
    tippingTitle: 'Tipping Points & Cascades',
    tipping1: 'Individual tipping points can trigger others: melting ice accelerates warming, which in turn destabilises permafrost.',
    tipping2: 'Above 4 °C warming, multiple tipping elements risk flipping simultaneously — a so-called "Hothouse Earth" pathway.',
    tipping3: 'The Paris Agreement aims at a maximum of 1.5–2 °C to avoid the most dangerous tipping points.',
    danger: 'Critical',
    warning: 'Warning',
    safe: 'On track',
  },
  fr: {
    title: 'Simulateur de Points de Basculement CO₂',
    subtitle: 'Découvrez interactivement comment la concentration de CO₂ et les boucles de rétroaction déclenchent des points de basculement climatiques.',
    co2Label: 'Concentration de CO₂',
    ppm: 'ppm',
    tempRise: 'Hausse de température',
    tempRiseLabel: 'Réchauffement au-dessus du niveau préindustriel',
    feedbackLoops: 'Boucles de rétroaction',
    iceAlbedo: 'Albédo des glaces',
    iceAlbedoDesc: 'Fonte des glaces → surface plus sombre → plus d\'absorption',
    permafrost: 'Méthane du pergélisol',
    permafrostDesc: 'Dégel du pergélisol → libération de méthane → réchauffement amplifié',
    ocean: 'Circulation océanique',
    oceanDesc: 'Circulation plus faible → moins de transport de chaleur → extrêmes régionaux',
    waterVapor: 'Vapeur d\'eau',
    waterVaporDesc: 'Air plus chaud → plus d\'évaporation → effet de serre renforcé',
    curveTitle: 'Réponse thermique au CO₂',
    baseOnly: 'Sans rétroactions',
    withFeedback: 'Avec rétroactions',
    tippingZone: 'Points de basculement',
    reset: 'Réinitialiser',
    current: 'Aujourd\'hui',
    preindustrial: 'Préindustriel',
    explainTitle: 'Que montre le simulateur ?',
    explain1: 'La courbe de base repose sur la sensibilité climatique : ~3 °C de réchauffement par doublement du CO₂ au-dessus du niveau préindustriel (280 ppm).',
    explain2: 'Les boucles de rétroaction amplifient significativement le réchauffement. La rétroaction de la vapeur d\'eau seule augmente la sensibilité de ~50 %. Ensemble, toutes les rétroactions peuvent plus que doubler le réchauffement.',
    explain3: 'Les points de basculement sont des seuils au-delà desquels les changements deviennent irréversibles — par ex. la fonte de la calotte groenlandaise ou l\'effondrement de la forêt amazonienne.',
    tippingTitle: 'Points de basculement & cascades',
    tipping1: 'Des points de basculement individuels peuvent en déclencher d\'autres : la fonte des glaces accélère le réchauffement, qui déstabilise à son tour le pergélisol.',
    tipping2: 'Au-delà de 4 °C de réchauffement, plusieurs éléments de basculement risquent de basculer simultanément — une trajectoire dite « Terre étuve ».',
    tipping3: 'L\'Accord de Paris vise un maximum de 1,5–2 °C pour éviter les points de basculement les plus dangereux.',
    danger: 'Critique',
    warning: 'Avertissement',
    safe: 'Dans les limites',
  },
};

/* ── Component ───────────────────────────────────────────────── */

interface Props {
  embedded?: boolean;
}

const ClimateTippingSimulator = ({ embedded }: Props) => {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;

  const [co2, setCo2] = useState(CURRENT_CO2);
  const [feedbacks, setFeedbacks] = useState<FeedbackState>({
    iceAlbedo: true,
    permafrost: false,
    oceanCirculation: false,
    waterVapor: true,
  });

  const toggleFeedback = (key: keyof FeedbackState) => {
    setFeedbacks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const reset = () => {
    setCo2(CURRENT_CO2);
    setFeedbacks({ iceAlbedo: true, permafrost: false, oceanCirculation: false, waterVapor: true });
  };

  const curveData = useMemo(() => generateCurve(feedbacks), [feedbacks]);
  const currentTemp = useMemo(() => computeTemperature(co2, feedbacks), [co2, feedbacks]);
  const baseTemp = useMemo(() => computeTemperature(co2, { iceAlbedo: false, permafrost: false, oceanCirculation: false, waterVapor: false }), [co2]);

  const activeTipping = useMemo(() => {
    return Object.entries(TIPPING_POINTS)
      .filter(([, tp]) => currentTemp >= tp.threshold)
      .map(([key, tp]) => ({ key, ...tp }));
  }, [currentTemp]);

  const threatLevel = currentTemp >= 4 ? 'danger' : currentTemp >= 2 ? 'warning' : 'safe';
  const threatColor = threatLevel === 'danger' ? 'hsl(0 85% 55%)' : threatLevel === 'warning' ? 'hsl(35 90% 55%)' : 'hsl(140 60% 45%)';
  const threatBg = threatLevel === 'danger' ? 'bg-red-500/10 border-red-500/30' : threatLevel === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30';

  const chartConfig = useMemo(() => ({
    tempBase: { label: t.baseOnly, color: 'hsl(200 70% 55%)' },
    tempWithFeedback: { label: t.withFeedback, color: 'hsl(0 85% 60%)' },
  }), [t]);

  const feedbackItems = [
    { key: 'iceAlbedo' as const, icon: Mountain, label: t.iceAlbedo, desc: t.iceAlbedoDesc, strength: FEEDBACK_STRENGTHS.iceAlbedo },
    { key: 'permafrost' as const, icon: Thermometer, label: t.permafrost, desc: t.permafrostDesc, strength: FEEDBACK_STRENGTHS.permafrost },
    { key: 'oceanCirculation' as const, icon: Waves, label: t.ocean, desc: t.oceanDesc, strength: FEEDBACK_STRENGTHS.oceanCirculation },
    { key: 'waterVapor' as const, icon: Droplets, label: t.waterVapor, desc: t.waterVaporDesc, strength: FEEDBACK_STRENGTHS.waterVapor },
  ];

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-background'} space-y-6`}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold font-mono text-primary">{t.title}</h1>
        <p className="text-foreground/70 text-sm md:text-base leading-relaxed max-w-2xl">{t.subtitle}</p>
      </div>

      {/* Temperature Display */}
      <Card className={`border ${threatBg} backdrop-blur`}>
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{t.tempRiseLabel}</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl md:text-5xl font-bold font-mono" style={{ color: threatColor }}>
                  +{currentTemp.toFixed(1)} °C
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  ({t.baseOnly}: +{baseTemp.toFixed(1)} °C)
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-mono px-3 py-1 rounded-full border" style={{ color: threatColor, borderColor: threatColor }}>
                {t[threatLevel]}
              </span>
              <span className="text-lg font-bold font-mono text-primary">{co2} {t.ppm}</span>
            </div>
          </div>

          {/* Active tipping points */}
          {activeTipping.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeTipping.map(tp => (
                <span key={tp.key} className="text-xs font-mono px-2 py-1 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                  ⚠ {tp.label[language] || tp.label.de} ({tp.threshold} °C)
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CO₂ Slider */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono text-primary">{t.co2Label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-mono">{t.preindustrial}: 280 {t.ppm}</span>
            <span className="text-primary font-mono font-bold">{co2} {t.ppm}</span>
          </div>
          <Slider
            value={[co2]}
            min={280}
            max={1200}
            step={5}
            onValueChange={([v]) => setCo2(v)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
            <span>280 {t.ppm}</span>
            <span className="text-amber-500/60">425 ({t.current})</span>
            <span>1200 {t.ppm}</span>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Loops */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono text-primary">{t.feedbackLoops}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feedbackItems.map(item => (
              <button
                key={item.key}
                onClick={() => toggleFeedback(item.key)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  feedbacks[item.key]
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border/30 bg-card/30 opacity-60'
                }`}
              >
                <item.icon size={18} className={`mt-0.5 flex-shrink-0 ${feedbacks[item.key] ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono font-semibold text-foreground">{item.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">+{(item.strength * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <Switch
                  checked={feedbacks[item.key]}
                  onCheckedChange={() => toggleFeedback(item.key)}
                  className="flex-shrink-0 mt-0.5"
                />
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-3">
            <Button variant="outline" size="sm" onClick={reset} className="font-mono">
              <RotateCcw size={14} className="mr-1.5" />{t.reset}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Response Curve */}
      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono text-primary">{t.curveTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={curveData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="gradFeedback" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 85% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 85% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200 70% 55%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(200 70% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,50%,0.15)" />
              <XAxis
                dataKey="co2"
                tick={{ fontSize: 10 }}
                label={{ value: `CO₂ (${t.ppm})`, position: 'insideBottomRight', offset: -5, fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 11 }}
                domain={[0, 'auto']}
              />
              <ChartTooltip content={<ChartTooltipContent />} />

              {/* Tipping point reference lines */}
              {Object.entries(TIPPING_POINTS).map(([key, tp]) => (
                <ReferenceLine
                  key={key}
                  y={tp.threshold}
                  stroke="hsl(35 90% 55%)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: tp.label[language] || tp.label.de,
                    position: 'right',
                    fontSize: 9,
                    fill: 'hsl(35 90% 55%)',
                  }}
                />
              ))}

              {/* Current CO₂ marker */}
              <ReferenceLine
                x={co2}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="2 2"
              />

              <Area
                type="monotone"
                dataKey="tempBase"
                stroke="hsl(200 70% 55%)"
                strokeWidth={2}
                fill="url(#gradBase)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="tempWithFeedback"
                stroke="hsl(0 85% 60%)"
                strokeWidth={2}
                fill="url(#gradFeedback)"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>

          {/* Legend */}
          <div className="flex gap-6 mt-2 justify-center">
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="w-4 h-0.5 rounded" style={{ background: 'hsl(200 70% 55%)' }} />
              <span className="text-muted-foreground">{t.baseOnly}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="w-4 h-0.5 rounded" style={{ background: 'hsl(0 85% 60%)' }} />
              <span className="text-muted-foreground">{t.withFeedback}</span>
            </div>
          </div>
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
              <Info size={16} />{t.tippingTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>{t.tipping1}</p>
            <p>{t.tipping2}</p>
            <p className="text-muted-foreground text-xs italic">{t.tipping3}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClimateTippingSimulator;
