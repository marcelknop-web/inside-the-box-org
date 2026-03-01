import { useState, useCallback, useMemo, useRef } from 'react';
import { Shield, TrendingDown, AlertTriangle, ChevronRight, RotateCcw, Skull, Trophy, ArrowLeft, Volume2, VolumeX, Eye, HardDrive, Brain, Castle, Target, PiggyBank, Zap, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { StaggerReveal } from '@/components/StaggerReveal';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCisoSound } from '@/hooks/useCisoSound';

// ── i18n ────────────────────────────────────────────────────────────────────

const labels: Record<string, Record<string, string>> = {
  de: {
    title: 'CISO Budget Simulator',
    subtitle: 'Überleben Sie 5 Runden als CISO eines regulierten Unternehmens.',
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
    submit: 'Budget bestätigen & Runde starten',
    nextRound: 'Weiter zu Runde',
    attackType: 'Angriffstyp',
    detectionProb: 'Erkennungsrate',
    detectionProbHint: 'Wie wahrscheinlich Ihr SOC den Angriff erkennt.',
    detected: 'Erkannt?',
    yes: 'Ja',
    no: 'Nein',
    damage: 'Schaden',
    damageHint: 'Abzug vom Marktwert. Bei Erkennung halbiert.',
    impactLabel: 'Auswirkung auf Ihr Unternehmen',
    impactHint: 'Wie sich der Angriff auf Ihre drei Kernwerte auswirkt.',
    marketValueHint: 'Sinkt durch Angriffsschaden und regulatorische Strafen.',
    reputationHint: 'Sinkt stärker bei unentdeckten Angriffen.',
    regRiskHint: 'Steigt bei jedem Angriff. Ab 40 und 60 drohen Strafabzüge.',
    analysis: 'Analyse',
    gameOver: 'Game Over',
    victory: 'Simulation bestanden',
    victoryDesc: 'Sie haben 5 Runden als CISO überlebt. Ihr Unternehmen ist intakt.',
    restart: 'Nochmal spielen',
    back: 'Zurück',
    regPenalty: 'Regulatorische Strafe!',
    regPenaltyHigh: 'Kritisches regulatorisches Versagen!',
    levelNone: '—',
    phishing: 'Phishing-Welle',
    ransomware: 'Ransomware',
    supplyChain: 'Supply Chain Attack',
    insider: 'Insider Incident',
    cloudMisconfig: 'Cloud Misconfiguration',
    zeroDay: 'Zero Day Exploit',
    overBudget: 'Budget überschritten!',
    start: 'Simulation starten',
    introRole: 'Sie sind CISO eines regulierten Unternehmens.',
    introGoal: 'Ziel: 5 Runden überleben, ohne dass Marktwert, Reputation oder regulatorisches Risiko kollabieren.',
    introMech1: 'Jede Runde verteilen Sie 100 Budgetpunkte auf 6 Kategorien.',
    introMech2: 'Danach trifft ein zufälliger Cyberangriff Ihr Unternehmen.',
    introMech3: 'Ihre Investitionen bestimmen, ob der Angriff erkannt wird und wie hoch der Schaden ausfällt.',
    introMech4: 'Ab Runde 3 drohen zusätzliche regulatorische Strafen.',
    introGui: 'Nutzen Sie die Schieberegler, um Ihr Budget auf die Kategorien zu verteilen. Die Summe darf 100 nicht überschreiten.',
    introGameOver: 'Game Over bei: Marktwert ≤ 0 · Reputation ≤ 0 · Reg. Risiko ≥ 80',
    phaseStep: 'Schritt',
    phase1Label: 'Budget verteilen',
    phase2Label: 'Angriff',
    phase3Label: 'Auswertung',
    allocateInstruction: 'Verteilen Sie Ihr Security-Budget auf die 6 Kategorien.',
    allocateHint: 'Die Summe darf 100 nicht überschreiten.',
    resultHeadline: 'Angriff auf Ihr Unternehmen!',
    resultDetectedMsg: 'Ihr SOC hat den Angriff rechtzeitig erkannt. Schaden wurde reduziert.',
    resultUndetectedMsg: 'Der Angriff blieb unbemerkt. Voller Schaden trifft Ihr Unternehmen.',
    resultNextHint: 'Überprüfen Sie die Auswirkungen und planen Sie die nächste Runde.',
    gameOverExplain: 'Ihr Unternehmen hat die Krise nicht überstanden.',
    victoryExplain: 'Sie haben alle 5 Angriffswellen erfolgreich navigiert.',
    roundWarning3: '⚠ Ab dieser Runde greift regulatorischer Druck!',
    allocated: 'verteilt',
    levelUp: 'Level-Up',
    currentLevel: 'Level',
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
    submit: 'Confirm Budget & Start Round',
    nextRound: 'Continue to Round',
    attackType: 'Attack Type',
    detectionProb: 'Detection Rate',
    detectionProbHint: 'How likely your SOC detects the attack.',
    detected: 'Detected?',
    yes: 'Yes',
    no: 'No',
    damage: 'Damage',
    damageHint: 'Deducted from Market Value. Halved if detected.',
    impactLabel: 'Impact on your organization',
    impactHint: 'How the attack affects your three core metrics.',
    marketValueHint: 'Decreases from attack damage and regulatory penalties.',
    reputationHint: 'Drops more sharply from undetected attacks.',
    regRiskHint: 'Increases with every attack. Penalties trigger at 40 and 60.',
    analysis: 'Analysis',
    gameOver: 'Game Over',
    victory: 'Simulation Passed',
    victoryDesc: 'You survived 5 rounds as CISO. Your company is intact.',
    restart: 'Play Again',
    back: 'Back',
    regPenalty: 'Regulatory Penalty!',
    regPenaltyHigh: 'Critical Regulatory Failure!',
    levelNone: '—',
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
    introGui: 'Use the sliders to distribute your budget across categories. The total must not exceed 100.',
    introGameOver: 'Game Over at: Market Value ≤ 0 · Reputation ≤ 0 · Reg. Risk ≥ 80',
    phaseStep: 'Step',
    phase1Label: 'Allocate Budget',
    phase2Label: 'Attack',
    phase3Label: 'Assessment',
    allocateInstruction: 'Distribute your security budget across the 6 categories.',
    allocateHint: 'The total must not exceed 100.',
    resultHeadline: 'Attack on your organization!',
    resultDetectedMsg: 'Your SOC detected the attack in time. Damage was reduced.',
    resultUndetectedMsg: 'The attack went unnoticed. Full damage hits your organization.',
    resultNextHint: 'Review the impact and plan your next round.',
    gameOverExplain: 'Your organization did not survive the crisis.',
    victoryExplain: 'You successfully navigated all 5 attack waves.',
    roundWarning3: '⚠ Regulatory pressure kicks in from this round!',
    allocated: 'allocated',
    levelUp: 'Level Up',
    currentLevel: 'Level',
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
    submit: 'Confirmer le budget & lancer le tour',
    nextRound: 'Continuer au tour',
    attackType: 'Type d\'attaque',
    detectionProb: 'Taux de détection',
    detectionProbHint: 'Probabilité que votre SOC détecte l\'attaque.',
    detected: 'Détecté ?',
    yes: 'Oui',
    no: 'Non',
    damage: 'Dégâts',
    damageHint: 'Déduits de la valeur marchande. Réduits de moitié si détecté.',
    impactLabel: 'Impact sur votre organisation',
    impactHint: 'Comment l\'attaque affecte vos trois indicateurs clés.',
    marketValueHint: 'Diminue par les dégâts et les pénalités réglementaires.',
    reputationHint: 'Baisse davantage lors d\'attaques non détectées.',
    regRiskHint: 'Augmente à chaque attaque. Pénalités à partir de 40 et 60.',
    analysis: 'Analyse',
    gameOver: 'Fin de partie',
    victory: 'Simulation réussie',
    victoryDesc: 'Vous avez survécu 5 tours en tant que CISO. Votre entreprise est intacte.',
    restart: 'Rejouer',
    back: 'Retour',
    regPenalty: 'Pénalité réglementaire !',
    regPenaltyHigh: 'Échec réglementaire critique !',
    levelNone: '—',
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
    introGui: 'Utilisez les curseurs pour répartir votre budget. Le total ne doit pas dépasser 100.',
    introGameOver: 'Fin de partie si : Valeur ≤ 0 · Réputation ≤ 0 · Risque rég. ≥ 80',
    phaseStep: 'Étape',
    phase1Label: 'Répartir le budget',
    phase2Label: 'Attaque',
    phase3Label: 'Évaluation',
    allocateInstruction: 'Répartissez votre budget sécurité sur les 6 catégories.',
    allocateHint: 'Le total ne doit pas dépasser 100.',
    resultHeadline: 'Attaque contre votre organisation !',
    resultDetectedMsg: 'Votre SOC a détecté l\'attaque à temps. Les dégâts ont été réduits.',
    resultUndetectedMsg: 'L\'attaque est passée inaperçue. Dégâts complets.',
    resultNextHint: 'Examinez l\'impact et planifiez le prochain tour.',
    gameOverExplain: 'Votre organisation n\'a pas survécu à la crise.',
    victoryExplain: 'Vous avez navigué avec succès les 5 vagues d\'attaques.',
    roundWarning3: '⚠ La pression réglementaire commence à ce tour !',
    allocated: 'réparti',
    levelUp: 'Montée niveau',
    currentLevel: 'Niveau',
  },
};

// ── Types & Constants ───────────────────────────────────────────────────────

type AttackKey = 'phishing' | 'ransomware' | 'supplyChain' | 'insider' | 'cloudMisconfig' | 'zeroDay';

interface Attack {
  key: AttackKey;
  baseDamage: [number, number];
  baseDetection: number;
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
const CAT_ICONS = [Eye, HardDrive, Brain, Castle, Target, PiggyBank];
const CAT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--highlight))',
  'hsl(160, 80%, 50%)',
  'hsl(280, 60%, 60%)',
  'hsl(30, 90%, 55%)',
  'hsl(var(--muted-foreground))',
];

function pointsToLevelGain(pts: number): number {
  if (pts <= 20) return 0;
  if (pts <= 40) return 1;
  if (pts <= 60) return 2;
  if (pts <= 80) return 3;
  return 4;
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

const CISO_BOARD_KEY = 'ciso_sim_top5';
interface CisoBoardEntry { rounds: number; mv: number; rep: number; reg: number; won: boolean; date: string; }
const getCisoBoard = (): CisoBoardEntry[] => { try { return JSON.parse(localStorage.getItem(CISO_BOARD_KEY) || '[]'); } catch { return []; } };
const saveCisoBoard = (rounds: number, mv: number, rep: number, reg: number, won: boolean) => {
  const board = getCisoBoard();
  board.push({ rounds, mv, rep, reg, won, date: new Date().toLocaleDateString() });
  board.sort((a, b) => {
    if (a.won !== b.won) return a.won ? -1 : 1;
    if (a.won && b.won) return b.mv - a.mv;
    return b.rounds - a.rounds;
  });
  try { localStorage.setItem(CISO_BOARD_KEY, JSON.stringify(board.slice(0, 5))); } catch {}
};
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

interface GameState {
  marketValue: number;
  reputation: number;
  regRisk: number;
  levels: number[];
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

function generateAnalysis(
  lang: string, attackKey: AttackKey, wasDetected: boolean, levels: number[], allocation: number[],
): string[] {
  const [soc, backup, awareness, hardening, redteam] = levels;
  const lines: string[] = [];
  if (lang === 'de') {
    if (wasDetected) lines.push('Angriff erkannt – Schaden konnte begrenzt werden.');
    else lines.push('Angriff blieb unentdeckt – voller Schaden, erhöhtes regulatorisches Risiko.');
    if (soc < 2) lines.push('SOC-Level kritisch niedrig. Detection-Fähigkeit unzureichend.');
    if (attackKey === 'ransomware' && backup < 2) lines.push('Backup-Level zu niedrig für Ransomware-Resilienz.');
    if (awareness < 2 && (attackKey === 'phishing' || attackKey === 'insider')) lines.push('Awareness-Defizit erhöht Anfälligkeit für Social Engineering.');
    if (hardening < 2 && (attackKey === 'cloudMisconfig' || attackKey === 'supplyChain')) lines.push('Architektur ungehärtet – Angriffsfläche zu groß.');
    if (allocation[5] > 30) lines.push(`${allocation[5]} Punkte eingespart – kurzfristiger Gewinn, langfristiges Risiko.`);
    if (redteam >= 3) lines.push('Red-Team-Investment zahlt sich durch bessere Resilienz aus.');
  } else if (lang === 'fr') {
    if (wasDetected) lines.push('Attaque détectée – dégâts limités.');
    else lines.push('Attaque non détectée – dégâts complets, risque réglementaire accru.');
    if (soc < 2) lines.push('Niveau SOC critique. Capacité de détection insuffisante.');
    if (attackKey === 'ransomware' && backup < 2) lines.push('Niveau de backup trop bas pour la résilience ransomware.');
    if (awareness < 2 && (attackKey === 'phishing' || attackKey === 'insider')) lines.push('Déficit de sensibilisation augmente la vulnérabilité.');
    if (allocation[5] > 30) lines.push(`${allocation[5]} points économisés – gain court terme, risque long terme.`);
  } else {
    if (wasDetected) lines.push('Attack detected – damage was contained.');
    else lines.push('Attack went undetected – full damage, increased regulatory risk.');
    if (soc < 2) lines.push('SOC level critically low. Detection capability insufficient.');
    if (attackKey === 'ransomware' && backup < 2) lines.push('Backup level too low for ransomware resilience.');
    if (awareness < 2 && (attackKey === 'phishing' || attackKey === 'insider')) lines.push('Awareness deficit increases social engineering vulnerability.');
    if (hardening < 2 && (attackKey === 'cloudMisconfig' || attackKey === 'supplyChain')) lines.push('Architecture unhardened – attack surface too large.');
    if (allocation[5] > 30) lines.push(`${allocation[5]} points saved – short-term gain, long-term risk.`);
    if (redteam >= 3) lines.push('Red team investment paying off through better resilience.');
  }
  return lines.slice(0, 4);
}

// ── SVG Gauge Component ─────────────────────────────────────────────────────

function CircularGauge({ value, max, label, color, invert, size = 80 }: {
  value: number; max: number; label: string; color: string; invert?: boolean; size?: number;
}) {
  const pct = clamp((value / max) * 100, 0, 100);
  const danger = invert ? pct > 70 : pct < 30;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const strokePct = (pct / 100) * circ;
  const strokeColor = danger ? 'hsl(var(--destructive))' : color;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={strokeColor} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${strokePct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
        <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fill={strokeColor} fontSize={size * 0.25} fontFamily="monospace" fontWeight="bold"
        >
          {value}
        </text>
      </svg>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider text-center leading-tight">{label}</span>
    </div>
  );
}

function LevelPips({ level, max = 5, color }: { level: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-sm transition-all duration-300"
          style={{
            background: i < level ? color : 'hsl(var(--secondary))',
            boxShadow: i < level ? `0 0 4px ${color}40` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Budget Distribution Bar ─────────────────────────────────────────────────

function BudgetBar({ allocation }: { allocation: number[] }) {
  const total = allocation.reduce((a, b) => a + b, 0);
  return (
    <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex">
      {allocation.map((val, i) => (
        val > 0 ? (
          <div
            key={i}
            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(val / Math.max(total, 100)) * 100}%`,
              background: CAT_COLORS[i],
              opacity: 0.85,
            }}
          />
        ) : null
      ))}
      {total < 100 && (
        <div className="h-full flex-1" style={{ background: 'transparent' }} />
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

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

    const newLevels = state.levels.map((lvl, i) => {
      if (i === 5) return 0;
      return clamp(lvl + pointsToLevelGain(allocation[i]), 0, 5);
    });

    const attack = ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
    const rawDamage = randInt(attack.baseDamage[0], attack.baseDamage[1]);

    const socLevel = newLevels[0];
    const awarenessLevel = newLevels[2];
    const detectionPct = clamp(attack.baseDetection + socLevel * 10 + awarenessLevel * 5, 0, 99);
    const wasDetected = Math.random() * 100 < detectionPct;

    const resilienceLevel = newLevels[3];
    let finalDamage = wasDetected ? Math.floor(rawDamage / 2) : rawDamage;
    finalDamage = Math.max(0, finalDamage - resilienceLevel * 5);
    if (attack.key === 'ransomware' && newLevels[1] >= 2) {
      finalDamage = Math.floor(finalDamage / 2);
    }

    let mv = state.marketValue - finalDamage;
    let rep = state.reputation - (wasDetected ? 5 : 15);
    let reg = state.regRisk + (wasDetected ? 5 : 15);

    const saved = 100 - totalAllocated;
    if (saved > 0) mv += Math.floor(saved * 0.3);

    let regPenalty = false;
    let regPenaltyHigh = false;
    if (round >= 3) {
      if (reg > 60) { mv -= 40; regPenaltyHigh = true; }
      else if (reg > 40) { mv -= 20; rep -= 10; regPenalty = true; }
    }

    mv = Math.max(mv, 0);
    rep = Math.max(rep, 0);
    reg = Math.min(reg, 100);

    const result: RoundResult = {
      round, attackKey: attack.key, detectionPct, wasDetected,
      rawDamage, finalDamage, regPenalty, regPenaltyHigh,
      analysis: generateAnalysis(language, attack.key, wasDetected, newLevels, allocation),
      statsBefore: { marketValue: state.marketValue, reputation: state.reputation, regRisk: state.regRisk },
      statsAfter: { marketValue: mv, reputation: rep, regRisk: reg },
    };

    setResults(prev => [...prev, result]);
    setState({ marketValue: mv, reputation: rep, regRisk: reg, levels: newLevels });

    if (soundEnabled) {
      setTimeout(() => sound.playAttackAlert(), 200);
      setTimeout(() => {
        if (mv <= 0 || rep <= 0 || reg >= 80) sound.playGameOver();
        else if (round >= 5) sound.playVictory();
        else if (regPenalty || regPenaltyHigh) sound.playRegPenalty();
        else if (wasDetected) sound.playDetected();
        else sound.playUndetected();
      }, 1200);
    }

    if (mv <= 0 || rep <= 0 || reg >= 80) { saveCisoBoard(round, mv, rep, reg, false); setPhase('gameover'); }
    else if (round >= 5) { saveCisoBoard(round, mv, rep, reg, true); setPhase('victory'); }
    else setPhase('result');
  }, [state, allocation, round, overBudget, totalAllocated, language, soundEnabled, sound]);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setAllocation([20, 20, 20, 20, 20, 0]);
    setPhase('allocate');
    if (soundEnabled) sound.playRoundStart();
  }, [soundEnabled, sound]);

  const restart = useCallback(() => {
    setRound(1); setPhase('intro');
    setState({ marketValue: 100, reputation: 100, regRisk: 0, levels: [1, 1, 1, 1, 1, 0] });
    setAllocation([20, 20, 20, 20, 20, 0]); setResults([]);
  }, []);

  const latestResult = results[results.length - 1];

  const containerClass = embedded
    ? 'w-full max-w-4xl mx-auto p-4 md:p-6'
    : 'min-h-screen p-4 md:p-8';

  return (
    <div className={containerClass}>
      {!embedded && <PageMeta title="CISO Simulator" description="Cybersecurity Budget Simulation" />}

      <div className="max-w-4xl mx-auto">
        {!embedded && (
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-highlight transition-colors mb-4 font-mono">
            <ArrowLeft size={14} /> {t('back')}
          </a>
        )}

        {/* ─── INTRO ─── */}
        {phase === 'intro' && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <Shield size={40} className="mx-auto text-primary mb-3" />
              <h1 className="text-2xl md:text-3xl font-bold font-mono text-primary">{t('title')}</h1>
              <p className="text-sm text-muted-foreground mt-1 font-sans">{t('subtitle')}</p>
            </div>

            <StaggerReveal stagger={400} startDelay={300}>
              <div className="bg-card/80 border border-primary/20 rounded-xl p-5 backdrop-blur-sm">
                <p className="text-foreground font-sans font-semibold text-lg">{t('introRole')}</p>
                <p className="text-foreground/70 font-sans text-sm mt-2">{t('introGoal')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, text: t('introMech1'), color: 'hsl(var(--primary))' },
                  { icon: Zap, text: t('introMech2'), color: 'hsl(var(--destructive))' },
                  { icon: Eye, text: t('introMech3'), color: 'hsl(var(--highlight))' },
                  { icon: AlertTriangle, text: t('introMech4'), color: 'hsl(30, 90%, 55%)' },
                ].map((item, i) => (
                  <div key={i} className="bg-card/60 border border-border rounded-xl p-4 flex gap-3 items-start">
                    <div className="p-2 rounded-lg shrink-0" style={{ background: item.color + '15' }}>
                      <item.icon size={18} style={{ color: item.color }} />
                    </div>
                    <p className="text-sm font-sans text-foreground/80 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-destructive/8 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                <Skull size={20} className="text-destructive shrink-0" />
                <p className="text-sm font-mono text-destructive/90">{t('introGameOver')}</p>
              </div>

              <Button onClick={() => setPhase('allocate')} className="w-full font-mono text-base" size="lg">
                <Shield size={18} className="mr-2" /> {t('start')}
              </Button>
            </StaggerReveal>
          </div>
        )}

        {/* ─── GAME PHASES ─── */}
        {phase !== 'intro' && (
          <>
            {/* Header bar */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg md:text-xl font-bold font-mono text-primary">{t('title')}</h1>
              <button
                onClick={() => setSoundEnabled(s => !s)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            {/* Round progress */}
            <div className="flex items-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map(r => (
                <div key={r} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-500 ${
                      r < round ? 'bg-primary/20 text-primary border border-primary/40' :
                      r === round ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' :
                      'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {r < round ? '✓' : r}
                  </div>
                  <div className={`h-0.5 w-full rounded ${r <= round ? 'bg-primary' : 'bg-secondary'} transition-all duration-500`} />
                </div>
              ))}
            </div>

            {/* Phase steps */}
            <div className="flex gap-1.5 mb-5">
              {[
                { label: t('phase1Label'), active: phase === 'allocate' },
                { label: t('phase2Label'), active: phase === 'result' || phase === 'gameover' || phase === 'victory' },
                { label: t('phase3Label'), active: phase === 'result' || phase === 'gameover' || phase === 'victory' },
              ].map((step, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${step.active ? 'bg-primary' : 'bg-secondary'}`} />
              ))}
            </div>

            {/* Dashboard gauges */}
            <div className="bg-card/60 border border-border rounded-xl p-4 mb-5">
              <div className="flex items-center justify-around flex-wrap gap-3">
                <CircularGauge value={state.marketValue} max={100} label={t('marketValue')} color="hsl(var(--primary))" size={72} />
                <CircularGauge value={state.reputation} max={100} label={t('reputation')} color="hsl(var(--highlight))" size={72} />
                <CircularGauge value={state.regRisk} max={80} label={t('regRisk')} color="hsl(var(--destructive))" invert size={72} />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Eye size={13} className="text-primary" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{t('detection')}</span>
                  </div>
                  <LevelPips level={state.levels[0]} color="hsl(var(--primary))" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Castle size={13} className="text-primary" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{t('resilience')}</span>
                  </div>
                  <LevelPips level={state.levels[3]} color="hsl(var(--primary))" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── ALLOCATE PHASE ─── */}
        {phase === 'allocate' && (
          <StaggerReveal key={`alloc-${round}`} stagger={80} startDelay={150}>
            {round >= 3 && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-sm font-mono text-warning flex items-center gap-2">
                <AlertTriangle size={16} /> {t('roundWarning3')}
              </div>
            )}

            {/* Budget overview bar */}
            <div className="bg-card/60 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-foreground font-semibold">{t('budget')}: 100</span>
                <span className={`text-sm font-mono font-bold ${
                  overBudget ? 'text-destructive' : totalAllocated === 100 ? 'text-green-500' : 'text-primary'
                }`}>
                  {totalAllocated} {t('allocated')} {overBudget && `· ${t('overBudget')}`}
                </span>
              </div>
              <BudgetBar allocation={allocation} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {CATEGORIES.map((cat, i) => allocation[i] > 0 ? (
                  <span key={i} className="text-[9px] font-mono flex items-center gap-1" style={{ color: CAT_COLORS[i] }}>
                    <span className="w-2 h-2 rounded-sm" style={{ background: CAT_COLORS[i] }} />
                    {allocation[i]}
                  </span>
                ) : null)}
              </div>
            </div>

            {/* Category cards – 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CATEGORIES.map((cat, i) => {
                const Icon = CAT_ICONS[i];
                const gain = i < 5 ? pointsToLevelGain(allocation[i]) : 0;
                const newLevel = i < 5 ? clamp(state.levels[i] + gain, 0, 5) : 0;
                return (
                  <div key={cat} className="bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: CAT_COLORS[i] + '18' }}>
                        <Icon size={18} style={{ color: CAT_COLORS[i] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-semibold text-foreground truncate">{t(cat)}</p>
                        {i < 5 && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <LevelPips level={state.levels[i]} color={CAT_COLORS[i]} />
                            {gain > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500 font-bold">
                                → Lv {newLevel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-lg font-mono font-bold min-w-[2.5rem] text-right" style={{ color: CAT_COLORS[i] }}>
                        {allocation[i]}
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={100} step={5}
                      value={allocation[i]}
                      onChange={e => setCategory(i, Number(e.target.value))}
                      className="ciso-slider w-full"
                      style={{ '--slider-color': CAT_COLORS[i] } as React.CSSProperties}
                    />
                  </div>
                );
              })}
            </div>

            <Button onClick={submitBudget} disabled={overBudget} className="w-full font-mono text-base" size="lg">
              <Shield size={18} className="mr-2" /> {t('submit')} <ChevronRight size={16} className="ml-2" />
            </Button>
          </StaggerReveal>
        )}

        {/* ─── RESULT PHASE ─── */}
        {phase === 'result' && latestResult && (
          <StaggerReveal key={`result-${round}`} stagger={400} startDelay={200}>
            {/* Attack banner */}
            <div className={`rounded-xl p-5 border-2 ${
              latestResult.wasDetected
                ? 'bg-green-500/5 border-green-500/30'
                : 'bg-destructive/5 border-destructive/30'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  latestResult.wasDetected ? 'bg-green-500/15' : 'bg-destructive/15'
                }`}>
                  {latestResult.wasDetected
                    ? <ShieldCheck size={24} className="text-green-500" />
                    : <ShieldAlert size={24} className="text-destructive" />
                  }
                </div>
                <div>
                  <h3 className="font-mono font-bold text-foreground text-lg">{t(latestResult.attackKey)}</h3>
                  <p className="text-sm font-sans text-foreground/70">
                    {latestResult.wasDetected ? t('resultDetectedMsg') : t('resultUndetectedMsg')}
                  </p>
                </div>
              </div>
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Activity size={18} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-mono font-bold text-primary">{latestResult.detectionPct}%</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{t('detectionProb')}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                {latestResult.wasDetected
                  ? <ShieldCheck size={18} className="mx-auto text-green-500 mb-2" />
                  : <ShieldAlert size={18} className="mx-auto text-destructive mb-2" />
                }
                <p className={`text-2xl font-mono font-bold ${latestResult.wasDetected ? 'text-green-500' : 'text-destructive'}`}>
                  {latestResult.wasDetected ? '✓' : '✗'}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{t('detected')}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <TrendingDown size={18} className="mx-auto text-destructive mb-2" />
                <p className="text-2xl font-mono font-bold text-destructive">-{latestResult.finalDamage}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{t('damage')}</p>
              </div>
            </div>

            {(latestResult.regPenalty || latestResult.regPenaltyHigh) && (
              <div className={`rounded-xl p-4 border-2 flex items-center gap-3 ${
                latestResult.regPenaltyHigh
                  ? 'bg-destructive/10 border-destructive/40 text-destructive'
                  : 'bg-warning/10 border-warning/40 text-warning'
              }`}>
                <AlertTriangle size={20} />
                <span className="text-sm font-mono font-bold">
                  {latestResult.regPenaltyHigh ? t('regPenaltyHigh') : t('regPenalty')}
                </span>
              </div>
            )}

            {/* Impact comparison */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">{t('impactLabel')}</p>
              <div className="space-y-3">
                {[
                  { label: t('marketValue'), before: latestResult.statsBefore.marketValue, after: latestResult.statsAfter.marketValue, color: 'hsl(var(--primary))', max: 100 },
                  { label: t('reputation'), before: latestResult.statsBefore.reputation, after: latestResult.statsAfter.reputation, color: 'hsl(var(--highlight))', max: 100 },
                  { label: t('regRisk'), before: latestResult.statsBefore.regRisk, after: latestResult.statsAfter.regRisk, color: 'hsl(var(--destructive))', max: 80, invert: true },
                ].map((metric, i) => {
                  const diff = metric.after - metric.before;
                  const isWorse = metric.invert ? diff > 0 : diff < 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{metric.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${clamp((metric.after / metric.max) * 100, 0, 100)}%`,
                            background: isWorse ? 'hsl(var(--destructive))' : metric.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 w-24 justify-end">
                        <span className="text-xs font-mono text-muted-foreground">{metric.before}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className={`text-xs font-mono font-bold ${isWorse ? 'text-destructive' : 'text-green-500'}`}>
                          {metric.after}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-card/60 border border-border rounded-xl p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">{t('analysis')}</p>
              <div className="space-y-2">
                {latestResult.analysis.map((line, i) => (
                  <p key={i} className="text-sm font-sans text-foreground/80 leading-relaxed flex items-start gap-2">
                    <span className="text-primary mt-0.5">›</span> {line}
                  </p>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Button onClick={nextRound} className="w-full font-mono text-base" size="lg">
              {t('nextRound')} {round + 1} <ChevronRight size={16} className="ml-2" />
            </Button>
          </StaggerReveal>
        )}

        {/* ─── GAME OVER ─── */}
        {phase === 'gameover' && latestResult && (
          <StaggerReveal key="gameover" stagger={500} startDelay={300}>
            <div className="bg-destructive/5 border-2 border-destructive/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert size={22} className="text-destructive" />
                <h3 className="font-mono font-bold text-foreground text-lg">{t(latestResult.attackKey)}</h3>
              </div>
              <p className="text-sm font-sans text-foreground/70">
                {latestResult.wasDetected ? t('resultDetectedMsg') : t('resultUndetectedMsg')}
              </p>
            </div>

            <div className="bg-card border border-destructive/20 rounded-xl p-6 text-center">
              <Skull size={48} className="mx-auto text-destructive mb-4" />
              <h2 className="text-2xl font-bold font-mono text-destructive">{t('gameOver')}</h2>
              <p className="text-sm text-foreground/60 mt-2 font-sans">{t('gameOverExplain')}</p>
              <div className="flex gap-4 justify-center mt-4">
                {[
                  { label: t('marketValue'), val: state.marketValue, bad: state.marketValue <= 0 },
                  { label: t('reputation'), val: state.reputation, bad: state.reputation <= 0 },
                  { label: t('regRisk'), val: state.regRisk, bad: state.regRisk >= 80 },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className={`text-xl font-bold font-mono ${s.bad ? 'text-destructive' : 'text-foreground/60'}`}>{s.val}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Leaderboard />

            <Button onClick={restart} variant="outline" className="w-full font-mono text-base" size="lg">
              <RotateCcw size={16} className="mr-2" /> {t('restart')}
            </Button>
          </StaggerReveal>
        )}

        {/* ─── VICTORY ─── */}
        {phase === 'victory' && (
          <StaggerReveal key="victory" stagger={500} startDelay={300}>
            <div className="bg-green-500/5 border-2 border-green-500/30 rounded-xl p-6 text-center">
              <Trophy size={48} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold font-mono text-green-500">{t('victory')}</h2>
              <p className="text-sm text-foreground/60 mt-2 font-sans">{t('victoryDesc')}</p>
              <div className="flex gap-6 justify-center mt-5">
                {[
                  { label: t('marketValue'), val: state.marketValue, color: 'hsl(var(--primary))' },
                  { label: t('reputation'), val: state.reputation, color: 'hsl(var(--highlight))' },
                  { label: t('regRisk'), val: state.regRisk, color: 'hsl(var(--destructive))' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Leaderboard />

            <Button onClick={restart} variant="outline" className="w-full font-mono text-base" size="lg">
              <RotateCcw size={16} className="mr-2" /> {t('restart')}
            </Button>
          </StaggerReveal>
        )}

        {/* History */}
        {results.length > 1 && phase !== 'gameover' && phase !== 'victory' && (
          <div className="mt-6 space-y-1.5">
            {results.slice(0, -1).reverse().map(r => (
              <div key={r.round} className="bg-card/40 border border-border/40 rounded-lg px-4 py-2.5 flex items-center gap-3 text-xs font-mono">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {r.round}
                </span>
                <span className="text-foreground flex-1">{t(r.attackKey)}</span>
                <span className={r.wasDetected ? 'text-green-500' : 'text-destructive'}>
                  {r.wasDetected ? '✓' : '✗'}
                </span>
                <span className="text-destructive">-{r.finalDamage}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slider CSS */}
      <style>{`
        .ciso-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: hsl(var(--secondary));
          outline: none;
          cursor: pointer;
        }
        .ciso-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--slider-color, hsl(var(--primary)));
          border: 2px solid hsl(var(--background));
          box-shadow: 0 0 0 2px var(--slider-color, hsl(var(--primary))), 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ciso-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 0 3px var(--slider-color, hsl(var(--primary))), 0 0 12px var(--slider-color, hsl(var(--primary)));
        }
        .ciso-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--slider-color, hsl(var(--primary)));
          border: 2px solid hsl(var(--background));
          box-shadow: 0 0 0 2px var(--slider-color, hsl(var(--primary)));
          cursor: pointer;
        }
        .ciso-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
        }
        .ciso-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: hsl(var(--secondary));
        }
      `}</style>
    </div>
  );
};

// ── Leaderboard Sub-Component ───────────────────────────────────────────────

function Leaderboard() {
  const board = getCisoBoard();
  if (board.length === 0) return null;
  return (
    <div className="bg-card/60 border border-primary/15 rounded-xl p-4">
      <h3 className="text-center font-mono font-bold text-xs text-primary/70 tracking-[0.2em] mb-3">─── TOP 5 ───</h3>
      <div className="space-y-1">
        {board.map((e, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
          return (
            <div key={i} className={`flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded-lg ${
              i === 0 ? 'bg-primary/5 text-foreground' : 'text-muted-foreground'
            }`}>
              <span className="w-16">{medal} R{e.rounds}</span>
              <span className={`w-6 text-center ${e.won ? 'text-green-500' : 'text-destructive'}`}>{e.won ? '✓' : '✗'}</span>
              <span className="flex-1 text-right">MV:{e.mv} Rep:{e.rep}</span>
              <span className="text-[10px] ml-3 text-muted-foreground/60">{e.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CisoSimulator;
