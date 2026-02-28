import { useState, useCallback, useMemo, useRef } from 'react';
import { Shield, TrendingDown, AlertTriangle, ChevronRight, RotateCcw, Skull, Trophy, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
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
    detectionProbHint: 'Wie wahrscheinlich Ihr SOC den Angriff erkennt. Abhängig von SOC- und Awareness-Level.',
    detected: 'Erkannt?',
    yes: 'Ja',
    no: 'Nein',
    damage: 'Schaden',
    damageHint: 'Abzug vom Marktwert. Bei Erkennung halbiert, durch Resilience & Backup weiter reduziert.',
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
    levelNone: 'kein Effekt',
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
    introGui: 'Nutzen Sie die gelben Schieberegler, um Ihr Budget auf die Kategorien zu verteilen. Die Summe darf 100 nicht überschreiten. Bestätigen Sie dann mit dem Button.',
    introGameOver: 'Game Over bei: Marktwert ≤ 0 · Reputation ≤ 0 · Reg. Risiko ≥ 80',
    // Phase guidance
    phaseStep: 'Schritt',
    phase1Label: 'Budget verteilen',
    phase2Label: 'Angriff',
    phase3Label: 'Auswertung',
    allocateInstruction: 'Verteilen Sie Ihr Security-Budget auf die 6 Kategorien.',
    allocateHint: 'Bewegen Sie die Schieberegler und achten Sie darauf, dass die Summe ≤ 100 bleibt.',
    resultHeadline: 'Angriff auf Ihr Unternehmen!',
    resultDetectedMsg: 'Ihr SOC hat den Angriff rechtzeitig erkannt. Schaden wurde reduziert.',
    resultUndetectedMsg: 'Der Angriff blieb unbemerkt. Voller Schaden trifft Ihr Unternehmen.',
    resultNextHint: 'Überprüfen Sie die Auswirkungen und planen Sie die nächste Runde.',
    gameOverExplain: 'Ihr Unternehmen hat die Krise nicht überstanden.',
    victoryExplain: 'Sie haben alle 5 Angriffswellen erfolgreich navigiert.',
    roundWarning3: '⚠ Ab dieser Runde greift regulatorischer Druck!',
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
    detectionProbHint: 'How likely your SOC detects the attack. Depends on SOC and Awareness levels.',
    detected: 'Detected?',
    yes: 'Yes',
    no: 'No',
    damage: 'Damage',
    damageHint: 'Deducted from Market Value. Halved if detected, further reduced by Resilience & Backup.',
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
    phaseStep: 'Step',
    phase1Label: 'Allocate Budget',
    phase2Label: 'Attack',
    phase3Label: 'Assessment',
    allocateInstruction: 'Distribute your security budget across the 6 categories.',
    allocateHint: 'Move the sliders and make sure the total stays ≤ 100.',
    resultHeadline: 'Attack on your organization!',
    resultDetectedMsg: 'Your SOC detected the attack in time. Damage was reduced.',
    resultUndetectedMsg: 'The attack went unnoticed. Full damage hits your organization.',
    resultNextHint: 'Review the impact and plan your next round.',
    gameOverExplain: 'Your organization did not survive the crisis.',
    victoryExplain: 'You successfully navigated all 5 attack waves.',
    roundWarning3: '⚠ Regulatory pressure kicks in from this round!',
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
    detectionProbHint: 'Probabilité que votre SOC détecte l\'attaque. Dépend des niveaux SOC et Awareness.',
    detected: 'Détecté ?',
    yes: 'Oui',
    no: 'Non',
    damage: 'Dégâts',
    damageHint: 'Déduits de la valeur marchande. Réduits de moitié si détecté, encore réduits par Résilience & Backup.',
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
    phaseStep: 'Étape',
    phase1Label: 'Répartir le budget',
    phase2Label: 'Attaque',
    phase3Label: 'Évaluation',
    allocateInstruction: 'Répartissez votre budget sécurité sur les 6 catégories.',
    allocateHint: 'Déplacez les curseurs et assurez-vous que le total reste ≤ 100.',
    resultHeadline: 'Attaque contre votre organisation !',
    resultDetectedMsg: 'Votre SOC a détecté l\'attaque à temps. Les dégâts ont été réduits.',
    resultUndetectedMsg: 'L\'attaque est passée inaperçue. Dégâts complets.',
    resultNextHint: 'Examinez l\'impact et planifiez le prochain tour.',
    gameOverExplain: 'Votre organisation n\'a pas survécu à la crise.',
    victoryExplain: 'Vous avez navigué avec succès les 5 vagues d\'attaques.',
    roundWarning3: '⚠ La pression réglementaire commence à ce tour !',
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

// ── Leaderboard helpers ──
const CISO_BOARD_KEY = 'ciso_sim_top5';
interface CisoBoardEntry { rounds: number; mv: number; rep: number; reg: number; won: boolean; date: string; }
const getCisoBoard = (): CisoBoardEntry[] => { try { return JSON.parse(localStorage.getItem(CISO_BOARD_KEY) || '[]'); } catch { return []; } };
const saveCisoBoard = (rounds: number, mv: number, rep: number, reg: number, won: boolean) => {
  const board = getCisoBoard();
  board.push({ rounds, mv, rep, reg, won, date: new Date().toLocaleDateString() });
  // Sort: victories first (by mv desc), then losses (by rounds desc)
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
      saveCisoBoard(round, mv, rep, reg, false);
      setPhase('gameover');
    } else if (round >= 5) {
      saveCisoBoard(round, mv, rep, reg, true);
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
    : 'min-h-screen p-4 md:p-8';

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
            <StaggerReveal stagger={500} startDelay={300}>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-foreground font-sans font-semibold">{t('introRole')}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-foreground/80 font-sans text-sm">{t('introGoal')}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2">
                <ul className="space-y-2 text-sm font-sans text-foreground/80">
                  <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">1.</span> {t('introMech1')}</li>
                  <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">2.</span> {t('introMech2')}</li>
                  <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">3.</span> {t('introMech3')}</li>
                  <li className="flex items-start gap-2"><span className="text-primary font-mono font-bold">4.</span> {t('introMech4')}</li>
                </ul>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-foreground/70 font-sans text-sm italic border-l-2 border-primary/30 pl-3">{t('introGui')}</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm font-mono text-destructive">
                {t('introGameOver')}
              </div>
              <Button onClick={() => setPhase('allocate')} className="w-full font-mono" size="lg">
                <Shield size={16} className="mr-2" /> {t('start')}
              </Button>
            </StaggerReveal>
          </div>
        ) : (
          <>
            {/* Persistent header with round + sound */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-mono text-primary">{t('title')}</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSoundEnabled(s => !s)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>

            {/* Step indicator */}
            <PhaseSteps
              currentPhase={phase}
              round={round}
              t={t}
            />

            {/* Stats Bar */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-5">
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
          <StaggerReveal key={`alloc-${round}`} stagger={120} startDelay={200}>
            {/* Round warning for round 3+ */}
            {round >= 3 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm font-mono text-warning">
                {t('roundWarning3')}
              </div>
            )}

            {/* Instruction banner */}
            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-sans font-semibold text-foreground">{t('allocateInstruction')}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">{t('allocateHint')}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-mono text-foreground">{t('budget')}: <span className="font-bold">100</span></p>
              <p className={`text-sm font-mono font-bold ${overBudget ? 'text-destructive' : totalAllocated === 100 ? 'text-success' : 'text-warning'}`}>
                {100 - totalAllocated} {t('remaining')} {overBudget && `— ${t('overBudget')}`}
              </p>
            </div>

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

            <Button
              onClick={submitBudget}
              disabled={overBudget}
              className="w-full font-mono"
              size="lg"
            >
              <Shield size={16} className="mr-2" /> {t('submit')} <ChevronRight size={16} className="ml-2" />
            </Button>
          </StaggerReveal>
        )}

        {/* Phase: Result */}
        {phase === 'result' && latestResult && (
          <StaggerReveal key={`result-${round}`} stagger={500} startDelay={300}>
            {/* Headline: what happened */}
            <div className={`rounded-xl p-4 border ${latestResult.wasDetected ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className={latestResult.wasDetected ? 'text-warning' : 'text-destructive'} />
                <h3 className="font-mono font-bold text-foreground">{t(latestResult.attackKey)}</h3>
              </div>
              <p className="text-sm font-sans text-foreground/80">
                {latestResult.wasDetected ? t('resultDetectedMsg') : t('resultUndetectedMsg')}
              </p>
            </div>

            {/* Key metrics */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <div className="grid grid-cols-3 gap-3 text-sm font-mono">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">{t('detectionProb')}</p>
                  <p className="text-foreground font-bold text-lg">{latestResult.detectionPct}%</p>
                  <p className="text-muted-foreground text-[10px] mt-1 font-sans leading-tight">{t('detectionProbHint')}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">{t('detected')}</p>
                  <p className={`font-bold text-lg ${latestResult.wasDetected ? 'text-success' : 'text-destructive'}`}>
                    {latestResult.wasDetected ? '✓ ' + t('yes') : '✗ ' + t('no')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">{t('damage')}</p>
                  <p className="text-destructive font-bold text-lg">-{latestResult.finalDamage}</p>
                  <p className="text-muted-foreground text-[10px] mt-1 font-sans leading-tight">{t('damageHint')}</p>
                </div>
              </div>
            </div>

            {(latestResult.regPenalty || latestResult.regPenaltyHigh) && (
              <div className={`rounded-lg p-3 text-sm font-mono ${latestResult.regPenaltyHigh ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-warning/15 text-warning border border-warning/30'}`}>
                {latestResult.regPenaltyHigh ? t('regPenaltyHigh') : t('regPenalty')}
              </div>
            )}

            {/* Impact on stats */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">{t('impactLabel')}</p>
              <p className="text-muted-foreground text-[10px] font-sans mb-3">{t('impactHint')}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-sm font-mono">
                <div>
                  <p className="text-muted-foreground text-[10px]">{t('marketValue')}</p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">{latestResult.statsBefore.marketValue}</span>
                    <span className="mx-1">→</span>
                    <span className={latestResult.statsAfter.marketValue < latestResult.statsBefore.marketValue ? 'text-destructive font-bold' : 'text-success font-bold'}>{latestResult.statsAfter.marketValue}</span>
                  </p>
                  <p className="text-muted-foreground text-[9px] font-sans mt-0.5 leading-tight">{t('marketValueHint')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">{t('reputation')}</p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">{latestResult.statsBefore.reputation}</span>
                    <span className="mx-1">→</span>
                    <span className={latestResult.statsAfter.reputation < latestResult.statsBefore.reputation ? 'text-destructive font-bold' : 'text-success font-bold'}>{latestResult.statsAfter.reputation}</span>
                  </p>
                  <p className="text-muted-foreground text-[9px] font-sans mt-0.5 leading-tight">{t('reputationHint')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">{t('regRisk')}</p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">{latestResult.statsBefore.regRisk}</span>
                    <span className="mx-1">→</span>
                    <span className={latestResult.statsAfter.regRisk > latestResult.statsBefore.regRisk ? 'text-destructive font-bold' : 'text-success font-bold'}>{latestResult.statsAfter.regRisk}</span>
                  </p>
                  <p className="text-muted-foreground text-[9px] font-sans mt-0.5 leading-tight">{t('regRiskHint')}</p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{t('analysis')}</p>
              {latestResult.analysis.map((line, i) => (
                <p key={i} className="text-sm font-sans text-foreground leading-relaxed">• {line}</p>
              ))}
            </div>

            {/* CTA */}
            <div className="bg-card border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs font-sans text-muted-foreground mb-3">{t('resultNextHint')}</p>
              <Button onClick={nextRound} className="w-full font-mono" size="lg">
                {t('nextRound')} {round + 1} <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </StaggerReveal>
        )}

        {/* Phase: Game Over */}
        {phase === 'gameover' && latestResult && (
          <StaggerReveal key="gameover" stagger={600} startDelay={400}>
            {/* What happened */}
            <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-destructive" />
                <h3 className="font-mono font-bold text-foreground">{t(latestResult.attackKey)}</h3>
              </div>
              <p className="text-sm font-sans text-foreground/80">
                {latestResult.wasDetected ? t('resultDetectedMsg') : t('resultUndetectedMsg')}
              </p>
            </div>

            {/* Final stats */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <div className="grid grid-cols-3 gap-2 text-center text-sm font-mono">
                <div>
                  <p className="text-muted-foreground text-[10px]">{t('marketValue')}</p>
                  <p><span className="text-muted-foreground">{latestResult.statsBefore.marketValue}</span> <span className="mx-1">→</span> <span className="text-destructive font-bold">{latestResult.statsAfter.marketValue}</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">{t('reputation')}</p>
                  <p><span className="text-muted-foreground">{latestResult.statsBefore.reputation}</span> <span className="mx-1">→</span> <span className="text-destructive font-bold">{latestResult.statsAfter.reputation}</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">{t('regRisk')}</p>
                  <p><span className="text-muted-foreground">{latestResult.statsBefore.regRisk}</span> <span className="mx-1">→</span> <span className="text-destructive font-bold">{latestResult.statsAfter.regRisk}</span></p>
                </div>
              </div>
            </div>

            {/* Game Over banner */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
              <Skull size={40} className="mx-auto text-destructive mb-3" />
              <h2 className="text-xl font-bold font-mono text-destructive">{t('gameOver')}</h2>
              <p className="text-sm text-foreground/70 mt-2 font-sans">{t('gameOverExplain')}</p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {state.marketValue <= 0 && `${t('marketValue')} = 0  `}
                {state.reputation <= 0 && `${t('reputation')} = 0  `}
                {state.regRisk >= 80 && `${t('regRisk')} ≥ 80`}
              </p>
            </div>

            {/* TOP 5 LEADERBOARD */}
            {(() => {
              const board = getCisoBoard();
              if (board.length === 0) return null;
              return (
                <div className="bg-card/60 border border-primary/20 rounded-xl p-4">
                  <h3 className="text-center font-mono font-bold text-xs text-primary/80 tracking-[0.2em] mb-3">─── TOP 5 ───</h3>
                  <div className="space-y-1.5">
                    {board.map((e, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
                      return (
                        <div key={i} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${i === 0 ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                          <span>{medal} R{e.rounds}</span>
                          <span className={e.won ? 'text-success' : 'text-destructive'}>{e.won ? '✓' : '✗'}</span>
                          <span>MV:{e.mv} Rep:{e.rep}</span>
                          <span className="text-[10px]">{e.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <Button onClick={restart} variant="outline" className="w-full font-mono" size="lg">
              <RotateCcw size={16} className="mr-2" /> {t('restart')}
            </Button>
          </StaggerReveal>
        )}

        {/* Phase: Victory */}
        {phase === 'victory' && latestResult && (
          <StaggerReveal key="victory" stagger={600} startDelay={400}>
            <div className="bg-success/5 border border-success/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-success" />
                <h3 className="font-mono font-bold text-foreground">{t(latestResult.attackKey)} — {t('round')} 5</h3>
              </div>
              <p className="text-sm font-sans text-foreground/80">{t('victoryExplain')}</p>
            </div>

            <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
              <Trophy size={40} className="mx-auto text-success mb-3" />
              <h2 className="text-xl font-bold font-mono text-success">{t('victory')}</h2>
              <p className="text-sm text-foreground/70 mt-2 font-sans">{t('victoryDesc')}</p>
              <div className="flex gap-4 justify-center mt-4">
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
          </StaggerReveal>
        )}

        {/* Phase: Victory */}
        {phase === 'victory' && latestResult && (
          <StaggerReveal key="victory" stagger={500} startDelay={400}>
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={latestResult.wasDetected ? 'text-warning' : 'text-destructive'} />
                <h3 className="font-mono font-bold text-foreground">{t('round')} {latestResult.round} — {t(latestResult.attackKey)}</h3>
              </div>
            </div>

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

            {/* TOP 5 LEADERBOARD */}
            {(() => {
              const board = getCisoBoard();
              if (board.length === 0) return null;
              return (
                <div className="bg-card/60 border border-primary/20 rounded-xl p-4">
                  <h3 className="text-center font-mono font-bold text-xs text-primary/80 tracking-[0.2em] mb-3">─── TOP 5 ───</h3>
                  <div className="space-y-1.5">
                    {board.map((e, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
                      return (
                        <div key={i} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${i === 0 ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                          <span>{medal} R{e.rounds}</span>
                          <span className={e.won ? 'text-success' : 'text-destructive'}>{e.won ? '✓' : '✗'}</span>
                          <span>MV:{e.mv} Rep:{e.rep}</span>
                          <span className="text-[10px]">{e.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <Button onClick={restart} variant="outline" className="w-full font-mono" size="lg">
              <RotateCcw size={16} className="mr-2" /> {t('restart')}
            </Button>
          </StaggerReveal>
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

const PhaseSteps = ({ currentPhase, round, t }: {
  currentPhase: string; round: number; t: (k: string) => string;
}) => {
  const steps = [
    { key: 'allocate', label: t('phase1Label'), num: 1 },
    { key: 'attack', label: t('phase2Label'), num: 2 },
    { key: 'result', label: t('phase3Label'), num: 3 },
  ];
  const activeIdx = currentPhase === 'allocate' ? 0 : 1; // result/gameover/victory = step 2-3

  return (
    <div className="mb-5">
      {/* Round badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-mono text-highlight font-bold">{t('round')} {round} {t('of')} 5</span>
        <div className="h-1.5 flex-1 mx-4 rounded bg-secondary overflow-hidden">
          <div
            className="h-full rounded bg-primary transition-all duration-500"
            style={{ width: `${(round / 5) * 100}%` }}
          />
        </div>
      </div>
      {/* Step pills */}
      <div className="flex gap-2">
        {steps.map((step, i) => {
          const isActive = (currentPhase === 'allocate' && i === 0) ||
            ((currentPhase === 'result' || currentPhase === 'gameover' || currentPhase === 'victory') && i >= 1);
          const isCurrent = (currentPhase === 'allocate' && i === 0) ||
            ((currentPhase === 'result' || currentPhase === 'gameover' || currentPhase === 'victory') && i === 2);
          return (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                isCurrent
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : isActive
                    ? 'bg-primary/10 text-primary/60'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isCurrent ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary/30 text-primary' : 'bg-muted-foreground/20'
              }`}>
                {step.num}
              </span>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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


export default CisoSimulator;
