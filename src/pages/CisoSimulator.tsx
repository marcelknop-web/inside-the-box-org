import { useState, useCallback, useMemo, useRef } from 'react';
import { Shield, TrendingDown, AlertTriangle, ChevronRight, RotateCcw, Skull, Trophy, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCisoSound } from '@/hooks/useCisoSound';

// ── i18n ────────────────────────────────────────────────────────────────────

const labels: Record<string, Record<string, string>> = {
  de: {
    title: 'CISO Budget Simulator',
    subtitle: 'Überlebe 5 Runden als CISO eines regulierten Unternehmens.',
    round: 'Runde',
    of: 'von',
    budget: 'Budget',
    remaining: 'verbleibend',
    marketValue: 'Marktwert',
    reputation: 'Reputation',
    regRisk: 'Reg. Risiko',
    detection: 'Detection',
    resilience: 'Resilience',
    cat1: 'SOC / Detection',
    cat2: 'Backup & Recovery',
    cat3: 'Awareness & Training',
    cat4: 'Architecture Hardening',
    cat5: 'Red Team / Testing',
    cat6: 'Einsparung',
    submit: 'Budget bestätigen',
    nextRound: 'Nächste Runde',
    attackType: 'Angriffstyp',
    detectionProb: 'Detection-Wahrscheinlichkeit',
    detected: 'Entdeckt',
    yes: 'Ja',
    no: 'Nein',
    damage: 'Schaden nach Reduktionen',
    analysis: 'Analyse',
    gameOver: 'Game Over',
    victory: 'Simulation bestanden',
    victoryDesc: 'Du hast 5 Runden als CISO überlebt.',
    restart: 'Neustart',
    back: 'Zurück',
    regPenalty: 'Regulatorische Strafe!',
    regPenaltyHigh: 'Kritisches regulatorisches Versagen!',
    levelNone: 'kein Effekt',
    phishing: 'Phishing-Welle',
    ransomware: 'Ransomware',
    supplyChain: 'Supply Chain Attack',
    insider: 'Insider Incident',
    cloudMisconfig: 'Cloud Misconfiguration',
    zeroDay: 'Zero Day Exploit',
    start: 'Simulation starten',
    introRole: 'Du bist CISO eines regulierten Unternehmens.',
    introGoal: 'Ziel: 5 Runden überleben, ohne dass Marktwert, Reputation oder regulatorisches Risiko kollabieren.',
    introMech1: 'Jede Runde verteilst du 100 Budgetpunkte auf 6 Kategorien.',
    introMech2: 'Danach trifft ein zufälliger Cyberangriff dein Unternehmen.',
    introMech3: 'Deine Investitionen bestimmen, ob der Angriff erkannt wird und wie hoch der Schaden ausfällt.',
    introMech4: 'Ab Runde 3 drohen zusätzliche regulatorische Strafen.',
    introGui: 'Nutze die gelben Schieberegler, um dein Budget auf die Kategorien zu verteilen. Die Summe darf 100 nicht überschreiten. Bestätige dann mit dem Button.',
    introGameOver: 'Game Over bei: Marktwert ≤ 0 · Reputation ≤ 0 · Reg. Risiko ≥ 80',
  },
  en: {
    title: 'CISO Budget Simulator',
    subtitle: 'Survive 5 rounds as CISO of a regulated enterprise.',
    round: 'Round',
    of: 'of',
    budget: 'Budget',
    remaining: 'remaining',
    marketValue: 'Market Value',
    reputation: 'Reputation',
    regRisk: 'Reg. Risk',
    detection: 'Detection',
    resilience: 'Resilience',
    cat1: 'SOC / Detection',
    cat2: 'Backup & Recovery',
    cat3: 'Awareness & Training',
    cat4: 'Architecture Hardening',
    cat5: 'Red Team / Testing',
    cat6: 'Savings',
    submit: 'Confirm Budget',
    nextRound: 'Next Round',
    attackType: 'Attack Type',
    detectionProb: 'Detection Probability',
    detected: 'Detected',
    yes: 'Yes',
    no: 'No',
    damage: 'Damage After Reductions',
    analysis: 'Analysis',
    gameOver: 'Game Over',
    victory: 'Simulation Passed',
    victoryDesc: 'You survived 5 rounds as CISO.',
    restart: 'Restart',
    back: 'Back',
    regPenalty: 'Regulatory Penalty!',
    regPenaltyHigh: 'Critical Regulatory Failure!',
    levelNone: 'no effect',
    phishing: 'Phishing Wave',
    ransomware: 'Ransomware',
    supplyChain: 'Supply Chain Attack',
    insider: 'Insider Incident',
    cloudMisconfig: 'Cloud Misconfiguration',
    zeroDay: 'Zero Day Exploit',
    overBudget: 'Over budget!',
    start: 'Start Simulation',
    introRole: 'You are the CISO of a regulated enterprise.',
    introGoal: 'Goal: Survive 5 rounds without market value, reputation, or regulatory risk collapsing.',
    introMech1: 'Each round you allocate 100 budget points across 6 categories.',
    introMech2: 'Then a random cyberattack hits your organization.',
    introMech3: 'Your investments determine if the attack is detected and how much damage is dealt.',
    introMech4: 'From round 3, additional regulatory penalties apply.',
    introGui: 'Use the yellow sliders to distribute your budget across categories. The total must not exceed 100. Then confirm with the button.',
    introGameOver: 'Game Over at: Market Value ≤ 0 · Reputation ≤ 0 · Reg. Risk ≥ 80',
  },
  fr: {
    title: 'CISO Budget Simulator',
    subtitle: 'Survivez 5 tours en tant que CISO d\'une entreprise réglementée.',
    round: 'Tour',
    of: 'sur',
    budget: 'Budget',
    remaining: 'restant',
    marketValue: 'Valeur marchande',
    reputation: 'Réputation',
    regRisk: 'Risque rég.',
    detection: 'Détection',
    resilience: 'Résilience',
    cat1: 'SOC / Détection',
    cat2: 'Backup & Recovery',
    cat3: 'Awareness & Formation',
    cat4: 'Durcissement Architecture',
    cat5: 'Red Team / Tests',
    cat6: 'Économies',
    submit: 'Confirmer le budget',
    nextRound: 'Tour suivant',
    attackType: 'Type d\'attaque',
    detectionProb: 'Probabilité de détection',
    detected: 'Détecté',
    yes: 'Oui',
    no: 'Non',
    damage: 'Dégâts après réductions',
    analysis: 'Analyse',
    gameOver: 'Fin de partie',
    victory: 'Simulation réussie',
    victoryDesc: 'Vous avez survécu 5 tours en tant que CISO.',
    restart: 'Recommencer',
    back: 'Retour',
    regPenalty: 'Pénalité réglementaire !',
    regPenaltyHigh: 'Échec réglementaire critique !',
    levelNone: 'aucun effet',
    phishing: 'Vague de Phishing',
    ransomware: 'Ransomware',
    supplyChain: 'Attaque Supply Chain',
    insider: 'Incident Interne',
    cloudMisconfig: 'Misconfiguration Cloud',
    zeroDay: 'Exploit Zero Day',
    overBudget: 'Budget dépassé !',
    start: 'Démarrer la simulation',
    introRole: 'Vous êtes le CISO d\'une entreprise réglementée.',
    introGoal: 'Objectif : Survivre 5 tours sans que la valeur marchande, la réputation ou le risque réglementaire ne s\'effondrent.',
    introMech1: 'Chaque tour, vous répartissez 100 points de budget sur 6 catégories.',
    introMech2: 'Ensuite, une cyberattaque aléatoire frappe votre organisation.',
    introMech3: 'Vos investissements déterminent si l\'attaque est détectée et l\'ampleur des dégâts.',
    introMech4: 'À partir du tour 3, des pénalités réglementaires supplémentaires s\'appliquent.',
    introGui: 'Utilisez les curseurs jaunes pour répartir votre budget. Le total ne doit pas dépasser 100. Confirmez ensuite avec le bouton.',
    introGameOver: 'Fin de partie si : Valeur ≤ 0 · Réputation ≤ 0 · Risque rég. ≥ 80',
  },
};

// ── Types & Constants ───────────────────────────────────────────────────────

type AttackKey = 'phishing' | 'ransomware' | 'supplyChain' | 'insider' | 'cloudMisconfig' | 'zeroDay';

interface Attack {
  key: AttackKey;
  baseDamage: [number, number]; // [min, max]
  baseDetection: number; // base detection %
}

const ATTACKS: Attack[] = [
  { key: 'phishing', baseDamage: [20, 40], baseDetection: 50 },
  { key: 'ransomware', baseDamage: [40, 60], baseDetection: 30 },
  { key: 'supplyChain', baseDamage: [35, 55], baseDetection: 20 },
  { key: 'insider', baseDamage: [25, 45], baseDetection: 40 },
  { key: 'cloudMisconfig', baseDamage: [20, 35], baseDetection: 60 },
  { key: 'zeroDay', baseDamage: [45, 60], baseDetection: 25 },
];

const CATEGORIES = ['cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6'] as const;

function pointsToLevelGain(pts: number): number {
  if (pts <= 20) return 0;
  if (pts <= 40) return 1;
  if (pts <= 60) return 2;
  if (pts <= 80) return 3;
  return 4;
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

interface GameState {
  marketValue: number;
  reputation: number;
  regRisk: number;
  levels: number[]; // [soc, backup, awareness, hardening, redteam, savings]
}

interface RoundResult {
  round: number;
  attackKey: AttackKey;
  detectionPct: number;
  wasDetected: boolean;
  rawDamage: number;
  finalDamage: number;
  regPenalty: boolean;
  regPenaltyHigh: boolean;
  analysis: string[];
  statsBefore: Pick<GameState, 'marketValue' | 'reputation' | 'regRisk'>;
  statsAfter: Pick<GameState, 'marketValue' | 'reputation' | 'regRisk'>;
}

// ── Analysis Generator ──────────────────────────────────────────────────────

function generateAnalysis(
  lang: string,
  attackKey: AttackKey,
  wasDetected: boolean,
  levels: number[],
  allocation: number[],
): string[] {
  const [soc, backup, awareness, hardening, redteam, savings] = levels;
  const lines: string[] = [];

  if (lang === 'de') {
    if (wasDetected) lines.push('Angriff erkannt – Schaden konnte begrenzt werden.');
    else lines.push('Angriff blieb unentdeckt – voller Schaden, erhöhtes regulatorisches Risiko.');
    if (soc < 2) lines.push('SOC-Level kritisch niedrig. Detection-Fähigkeit unzureichend.');
    if (attackKey === 'ransomware' && backup < 2) lines.push('Backup-Level zu niedrig für Ransomware-Resilienz.');
    if (awareness < 2 && (attackKey === 'phishing' || attackKey === 'insider')) lines.push('Awareness-Defizit erhöht Anfälligkeit für Social Engineering.');
    if (hardening < 2 && (attackKey === 'cloudMisconfig' || attackKey === 'supplyChain')) lines.push('Architektur ungehärtet – Angriffsfläche zu groß.');
    if (savings > 0 && allocation[5] > 30) lines.push(`${allocation[5]} Punkte eingespart – kurzfristiger Gewinn, langfristiges Risiko.`);
    if (redteam >= 3) lines.push('Red-Team-Investment zahlt sich durch bessere Resilienz aus.');
  } else if (lang === 'fr') {
    if (wasDetected) lines.push('Attaque détectée – dégâts limités.');
    else lines.push('Attaque non détectée – dégâts complets, risque réglementaire accru.');
    if (soc < 2) lines.push('Niveau SOC critique. Capacité de détection insuffisante.');
    if (attackKey === 'ransomware' && backup < 2) lines.push('Niveau de backup trop bas pour la résilience ransomware.');
    if (awareness < 2 && (attackKey === 'phishing' || attackKey === 'insider')) lines.push('Déficit de sensibilisation augmente la vulnérabilité.');
    if (savings > 0 && allocation[5] > 30) lines.push(`${allocation[5]} points économisés – gain court terme, risque long terme.`);
  } else {
    if (wasDetected) lines.push('Attack detected – damage was contained.');
    else lines.push('Attack went undetected – full damage, increased regulatory risk.');
    if (soc < 2) lines.push('SOC level critically low. Detection capability insufficient.');
    if (attackKey === 'ransomware' && backup < 2) lines.push('Backup level too low for ransomware resilience.');
    if (awareness < 2 && (attackKey === 'phishing' || attackKey === 'insider')) lines.push('Awareness deficit increases social engineering vulnerability.');
    if (hardening < 2 && (attackKey === 'cloudMisconfig' || attackKey === 'supplyChain')) lines.push('Architecture unhardened – attack surface too large.');
    if (savings > 0 && allocation[5] > 30) lines.push(`${allocation[5]} points saved – short-term gain, long-term risk.`);
    if (redteam >= 3) lines.push('Red team investment paying off through better resilience.');
  }

  return lines.slice(0, 4);
}

// ── Component ───────────────────────────────────────────────────────────────

const CisoSimulator = ({ embedded = false }: { embedded?: boolean }) => {
  const { language } = useLanguage();
  const t = useCallback((key: string) => labels[language]?.[key] ?? labels.en[key] ?? key, [language]);
  const sound = useCisoSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastSliderTickRef = useRef(0);

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'allocate' | 'result' | 'gameover' | 'victory'>('intro');
  const [state, setState] = useState<GameState>({
    marketValue: 100, reputation: 100, regRisk: 0,
    levels: [1, 1, 1, 1, 1, 0],
  });
  const [allocation, setAllocation] = useState<number[]>([20, 20, 20, 20, 20, 0]);
  const [results, setResults] = useState<RoundResult[]>([]);

  const totalAllocated = useMemo(() => allocation.reduce((a, b) => a + b, 0), [allocation]);
  const overBudget = totalAllocated > 100;

  const setCategory = useCallback((idx: number, val: number) => {
    setAllocation(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    // Throttled tick sound
    if (soundEnabled) {
      const now = Date.now();
      if (now - lastSliderTickRef.current > 80) {
        lastSliderTickRef.current = now;
        sound.playSliderTick();
      }
    }
  }, [soundEnabled, sound]);

  const submitBudget = useCallback(() => {
    if (overBudget) return;
    if (soundEnabled) sound.playConfirm();

    // Update levels
    const newLevels = state.levels.map((lvl, i) => {
      if (i === 5) return 0; // savings has no level
      return clamp(lvl + pointsToLevelGain(allocation[i]), 0, 5);
    });

    // Pick random attack
    const attack = ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
    const rawDamage = randInt(attack.baseDamage[0], attack.baseDamage[1]);

    // Detection
    const socLevel = newLevels[0];
    const awarenessLevel = newLevels[2];
    const detectionPct = clamp(attack.baseDetection + socLevel * 10 + awarenessLevel * 5, 0, 99);
    const wasDetected = Math.random() * 100 < detectionPct;

    // Damage reduction
    const resilienceLevel = newLevels[3]; // hardening = resilience
    let finalDamage = wasDetected ? Math.floor(rawDamage / 2) : rawDamage;
    finalDamage = Math.max(0, finalDamage - resilienceLevel * 5);
    if (attack.key === 'ransomware' && newLevels[1] >= 2) {
      finalDamage = Math.floor(finalDamage / 2);
    }

    // Apply effects
    let mv = state.marketValue - finalDamage;
    let rep = state.reputation - (wasDetected ? 5 : 15);
    let reg = state.regRisk + (wasDetected ? 5 : 15);

    // Savings bonus: unspent budget adds to market value slightly
    const saved = 100 - totalAllocated;
    if (saved > 0) mv += Math.floor(saved * 0.3);

    // Regulatory penalties (from round 3)
    let regPenalty = false;
    let regPenaltyHigh = false;
    if (round >= 3) {
      if (reg > 60) {
        mv -= 40;
        regPenaltyHigh = true;
      } else if (reg > 40) {
        mv -= 20;
        rep -= 10;
        regPenalty = true;
      }
    }

    mv = Math.max(mv, 0);
    rep = Math.max(rep, 0);
    reg = Math.min(reg, 100);

    const result: RoundResult = {
      round,
      attackKey: attack.key,
      detectionPct,
      wasDetected,
      rawDamage,
      finalDamage,
      regPenalty,
      regPenaltyHigh,
      analysis: generateAnalysis(language, attack.key, wasDetected, newLevels, allocation),
      statsBefore: { marketValue: state.marketValue, reputation: state.reputation, regRisk: state.regRisk },
      statsAfter: { marketValue: mv, reputation: rep, regRisk: reg },
    };

    setResults(prev => [...prev, result]);
    setState({ marketValue: mv, reputation: rep, regRisk: reg, levels: newLevels });

    // Sound effects based on outcome
    if (soundEnabled) {
      setTimeout(() => sound.playAttackAlert(), 200);
      setTimeout(() => {
        if (mv <= 0 || rep <= 0 || reg >= 80) {
          sound.playGameOver();
        } else if (round >= 5) {
          sound.playVictory();
        } else if (regPenalty || regPenaltyHigh) {
          sound.playRegPenalty();
        } else if (wasDetected) {
          sound.playDetected();
        } else {
          sound.playUndetected();
        }
      }, 1200);
    }

    // Check game over
    if (mv <= 0 || rep <= 0 || reg >= 80) {
      setPhase('gameover');
    } else if (round >= 5) {
      setPhase('victory');
    } else {
      setPhase('result');
    }
  }, [state, allocation, round, overBudget, totalAllocated, language, soundEnabled, sound]);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setAllocation([20, 20, 20, 20, 20, 0]);
    setPhase('allocate');
    if (soundEnabled) sound.playRoundStart();
  }, [soundEnabled, sound]);

  const restart = useCallback(() => {
    setRound(1);
    setPhase('intro');
    setState({ marketValue: 100, reputation: 100, regRisk: 0, levels: [1, 1, 1, 1, 1, 0] });
    setAllocation([20, 20, 20, 20, 20, 0]);
    setResults([]);
  }, []);

  const latestResult = results[results.length - 1];

  const containerClass = embedded
    ? 'w-full max-w-3xl mx-auto p-4 md:p-6'
    : 'min-h-screen bg-background p-4 md:p-8';

  return (
    <div className={containerClass}>
      {!embedded && <PageMeta title="CISO Simulator" description="Cybersecurity Budget Simulation" />}

      {/* Header */}
      <div className="max-w-3xl mx-auto">
        {!embedded && (
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-highlight transition-colors mb-4 font-mono">
            <ArrowLeft size={14} /> {t('back')}
          </a>
        )}

        {phase === 'intro' ? (
          <div className="space-y-4">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-primary">{t('title')}</h1>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <p className="text-foreground font-sans font-semibold">{t('introRole')}</p>
              <p className="text-foreground/80 font-sans text-sm">{t('introGoal')}</p>
              <ul className="space-y-2 text-sm font-sans text-foreground/80">
                <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">1.</span> {t('introMech1')}</li>
                <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">2.</span> {t('introMech2')}</li>
                <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">3.</span> {t('introMech3')}</li>
                <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">4.</span> {t('introMech4')}</li>
              </ul>
              <p className="text-foreground/70 font-sans text-sm italic border-l-2 border-primary/30 pl-3">{t('introGui')}</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm font-mono text-destructive">
                {t('introGameOver')}
              </div>
            </div>
            <Button onClick={() => setPhase('allocate')} className="w-full font-mono" size="lg">
              <Shield size={16} className="mr-2" /> {t('start')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-mono text-primary">{t('title')}</h1>
                <p className="text-sm text-muted-foreground font-sans mt-1">{t('subtitle')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSoundEnabled(s => !s)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <span className="text-sm font-mono text-highlight font-bold">{t('round')} {round} {t('of')} 5</span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-6">
              <StatCard label={t('marketValue')} value={state.marketValue} max={100} color="primary" />
              <StatCard label={t('reputation')} value={state.reputation} max={100} color="highlight" />
              <StatCard label={t('regRisk')} value={state.regRisk} max={80} color="destructive" invert />
              <StatCard label={t('detection')} value={state.levels[0]} max={5} color="primary" isLevel />
              <StatCard label={t('resilience')} value={state.levels[3]} max={5} color="primary" isLevel />
            </div>
          </>
        )}

        {/* Phase: Allocate */}
        {phase === 'allocate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono text-foreground">{t('budget')}: <span className="font-bold">100</span></p>
              <p className={`text-sm font-mono font-bold ${overBudget ? 'text-destructive' : totalAllocated === 100 ? 'text-success' : 'text-warning'}`}>
                {100 - totalAllocated} {t('remaining')} {overBudget && `— ${t('overBudget')}`}
              </p>
            </div>

            <div className="space-y-3">
              {CATEGORIES.map((cat, i) => (
                <div key={cat} className="bg-card rounded-lg border border-primary/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-mono text-foreground">{t(cat)}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-primary w-8 text-right">{allocation[i]}</span>
                      {i < 5 && (
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${pointsToLevelGain(allocation[i]) > 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {pointsToLevelGain(allocation[i]) > 0 ? `+${pointsToLevelGain(allocation[i])}` : t('levelNone')}
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={allocation[i]}
                    onChange={e => setCategory(i, Number(e.target.value))}
                    className="ciso-slider w-full h-2 rounded-lg appearance-none bg-secondary cursor-pointer"
                  />
                  {i < 5 && (
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                      <span>Lv {state.levels[i]}</span>
                      <span>→ Lv {clamp(state.levels[i] + pointsToLevelGain(allocation[i]), 0, 5)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={submitBudget}
              disabled={overBudget}
              className="w-full font-mono"
              size="lg"
            >
              <Shield size={16} className="mr-2" /> {t('submit')} <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Phase: Result */}
        {phase === 'result' && latestResult && (
          <div className="space-y-4">
            <ResultCard result={latestResult} t={t} />
            <Button onClick={nextRound} className="w-full font-mono" size="lg">
              {t('nextRound')} <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Phase: Game Over */}
        {phase === 'gameover' && latestResult && (
          <div className="space-y-4">
            <ResultCard result={latestResult} t={t} />
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
              <Skull size={40} className="mx-auto text-destructive mb-3" />
              <h2 className="text-xl font-bold font-mono text-destructive">{t('gameOver')}</h2>
              <p className="text-sm text-muted-foreground mt-2 font-sans">
                {state.marketValue <= 0 && `${t('marketValue')} = 0`}
                {state.reputation <= 0 && `${t('reputation')} = 0`}
                {state.regRisk >= 80 && `${t('regRisk')} ≥ 80`}
              </p>
            </div>
            <Button onClick={restart} variant="outline" className="w-full font-mono" size="lg">
              <RotateCcw size={16} className="mr-2" /> {t('restart')}
            </Button>
          </div>
        )}

        {/* Phase: Victory */}
        {phase === 'victory' && latestResult && (
          <div className="space-y-4">
            <ResultCard result={latestResult} t={t} />
            <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
              <Trophy size={40} className="mx-auto text-success mb-3" />
              <h2 className="text-xl font-bold font-mono text-success">{t('victory')}</h2>
              <p className="text-sm text-muted-foreground mt-2 font-sans">{t('victoryDesc')}</p>
              <div className="flex gap-4 justify-center mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold font-mono text-primary">{state.marketValue}</p>
                  <p className="text-xs text-muted-foreground">{t('marketValue')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-mono text-highlight">{state.reputation}</p>
                  <p className="text-xs text-muted-foreground">{t('reputation')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-mono text-destructive">{state.regRisk}</p>
                  <p className="text-xs text-muted-foreground">{t('regRisk')}</p>
                </div>
              </div>
            </div>
            <Button onClick={restart} variant="outline" className="w-full font-mono" size="lg">
              <RotateCcw size={16} className="mr-2" /> {t('restart')}
            </Button>
          </div>
        )}

        {/* History */}
        {results.length > 1 && phase !== 'gameover' && phase !== 'victory' && (
          <div className="mt-6 space-y-2">
            {results.slice(0, -1).reverse().map(r => (
              <div key={r.round} className="bg-card/50 border border-border/50 rounded-lg p-3 text-xs font-mono">
                <span className="text-muted-foreground">R{r.round}</span>
                <span className="mx-2 text-foreground">{t(r.attackKey)}</span>
                <span className={r.wasDetected ? 'text-success' : 'text-destructive'}>
                  {r.wasDetected ? '✓' : '✗'} 
                </span>
                <span className="ml-2 text-destructive">-{r.finalDamage}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slider styling */}
      <style>{`
        .ciso-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: hsl(var(--secondary));
          outline: none;
        }
        .ciso-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--primary));
          box-shadow: 0 0 8px hsl(var(--primary) / 0.5);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .ciso-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 14px hsl(var(--primary) / 0.8);
        }
        .ciso-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--primary));
          box-shadow: 0 0 8px hsl(var(--primary) / 0.5);
          cursor: pointer;
        }
        .ciso-slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 4px;
        }
        .ciso-slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: hsl(var(--secondary));
        }
      `}</style>
    </div>
  );
};

// ── Sub-Components ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, max, color, invert, isLevel }: {
  label: string; value: number; max: number; color: string; invert?: boolean; isLevel?: boolean;
}) => {
  const pct = isLevel ? (value / max) * 100 : (value / max) * 100;
  const danger = invert ? pct > 70 : pct < 30;
  const colorClass = danger ? 'text-destructive' : `text-${color}`;

  return (
    <div className="bg-card border border-border rounded-lg p-2 text-center">
      <p className={`text-lg font-bold font-mono ${colorClass}`}>
        {isLevel ? `${value}/5` : value}
      </p>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      <div className="h-1 mt-1 rounded bg-secondary overflow-hidden">
        <div
          className={`h-full rounded transition-all duration-500 ${danger ? 'bg-destructive' : `bg-${color}`}`}
          style={{ width: `${clamp(pct, 0, 100)}%` }}
        />
      </div>
    </div>
  );
};

const ResultCard = ({ result, t }: { result: RoundResult; t: (k: string) => string }) => (
  <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-3">
    <div className="flex items-center gap-2 mb-1">
      <AlertTriangle size={18} className={result.wasDetected ? 'text-warning' : 'text-destructive'} />
      <h3 className="font-mono font-bold text-foreground">{t('round')} {result.round} — {t(result.attackKey)}</h3>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-mono">
      <div>
        <p className="text-muted-foreground text-xs">{t('detectionProb')}</p>
        <p className="text-foreground font-bold">{result.detectionPct}%</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">{t('detected')}</p>
        <p className={`font-bold ${result.wasDetected ? 'text-success' : 'text-destructive'}`}>
          {result.wasDetected ? t('yes') : t('no')}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">{t('damage')}</p>
        <p className="text-destructive font-bold">-{result.finalDamage}</p>
      </div>
    </div>

    {(result.regPenalty || result.regPenaltyHigh) && (
      <div className={`rounded-lg p-2 text-sm font-mono ${result.regPenaltyHigh ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-warning/15 text-warning border border-warning/30'}`}>
        ⚠ {result.regPenaltyHigh ? t('regPenaltyHigh') : t('regPenalty')}
      </div>
    )}

    <div className="grid grid-cols-3 gap-2 text-center text-sm font-mono">
      <div>
        <p className="text-muted-foreground text-[10px]">{t('marketValue')}</p>
        <p className="text-foreground">
          <span className="text-muted-foreground">{result.statsBefore.marketValue}</span>
          <span className="mx-1">→</span>
          <span className={result.statsAfter.marketValue < result.statsBefore.marketValue ? 'text-destructive font-bold' : 'text-success font-bold'}>{result.statsAfter.marketValue}</span>
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-[10px]">{t('reputation')}</p>
        <p className="text-foreground">
          <span className="text-muted-foreground">{result.statsBefore.reputation}</span>
          <span className="mx-1">→</span>
          <span className={result.statsAfter.reputation < result.statsBefore.reputation ? 'text-destructive font-bold' : 'text-success font-bold'}>{result.statsAfter.reputation}</span>
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-[10px]">{t('regRisk')}</p>
        <p className="text-foreground">
          <span className="text-muted-foreground">{result.statsBefore.regRisk}</span>
          <span className="mx-1">→</span>
          <span className={result.statsAfter.regRisk > result.statsBefore.regRisk ? 'text-destructive font-bold' : 'text-success font-bold'}>{result.statsAfter.regRisk}</span>
        </p>
      </div>
    </div>

    <div className="border-t border-border pt-2">
      <p className="text-xs font-mono text-muted-foreground mb-1">{t('analysis')}</p>
      {result.analysis.map((line, i) => (
        <p key={i} className="text-sm font-sans text-foreground leading-relaxed">• {line}</p>
      ))}
    </div>
  </div>
);

export default CisoSimulator;
