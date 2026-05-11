import React, { useEffect, useMemo, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import {
  Anchor, Compass, Wind, Loader2, CheckCircle2, XCircle, ArrowRight, Trophy,
  RotateCcw, Sparkles, Waves, Zap, BookOpen, Users, X, ShieldCheck, Flame, CloudLightning,
  Volume2, VolumeX,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SKS_CATALOG } from '@/data/sksQuestions';
import { STAGES, PORTS, type Stage } from '@/lib/nordstern/stages';
import {
  loadState, saveState, resetState, loadDeck, saveDeck, review, dueCards,
  CREW_POOL, pickNewCrew, type SrsCard, type NordsternState, type CrewMember, type KnowledgeCard,
} from '@/lib/nordstern/sm2';
import { useNordsternAudio } from '@/hooks/useNordsternAudio';

type Topic = 'navigation' | 'recht' | 'wetter' | 'seemannschaft';

interface AiQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  keywords?: string[];
  topic?: Topic;
  sourceIndex?: number;
}

const TOPIC_LABEL: Record<Topic, string> = {
  navigation: 'Navigation', recht: 'Recht', wetter: 'Wetter', seemannschaft: 'Seemannschaft',
};

const WIND_LABELS = [
  { bft: 2, label: 'leichte Brise',  desc: 'sanftes Gleiten' },
  { bft: 4, label: 'mäßige Brise',   desc: 'volle Fahrt' },
  { bft: 5, label: 'frische Brise',  desc: 'Reff im Groß' },
  { bft: 6, label: 'starker Wind',   desc: 'Vorsicht geboten' },
  { bft: 7, label: 'steifer Wind',   desc: 'erfahrene Hand nötig' },
];

const SCENE_QUESTIONS = 5;
const HARBOR_QUESTIONS = 3;

function highlight(text: string, kws?: string[]): React.ReactNode {
  if (!kws || kws.length === 0) return text;
  const esc = kws.filter(k => k && k.length >= 2)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  if (esc.length === 0) return text;
  const re = new RegExp(`(${esc.join('|')})`, 'gi');
  const m = new RegExp(`^(${esc.join('|')})$`, 'i');
  return text.split(re).map((p, i) =>
    m.test(p) ? <mark key={i} className="bg-primary/20 text-primary font-semibold rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>
  );
}

type Phase = 'home' | 'briefing' | 'scene' | 'harbor' | 'completed' | 'finished';

const Nordstern = () => {
  const [state, setState] = useState<NordsternState>(() => loadState());
  const [deck, setDeck] = useState<Record<string, SrsCard>>(() => loadDeck());
  const [phase, setPhase] = useState<Phase>('home');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [current, setCurrent] = useState<AiQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Joker pro Etappe
  const [jokersLeft, setJokersLeft] = useState(1);
  const [eliminated, setEliminated] = useState<number[]>([]);

  // Sturm-Event (zufällig in einer Szenen-Frage)
  const [stormQuestionIdx, setStormQuestionIdx] = useState<number | null>(null);
  const [stormActive, setStormActive] = useState(false);

  // Belohnungen am Etappenende
  const [newCrew, setNewCrew] = useState<CrewMember | null>(null);
  const [newKnowledge, setNewKnowledge] = useState<KnowledgeCard | null>(null);

  // Logbuch-Modal
  const [logbuchOpen, setLogbuchOpen] = useState(false);

  // Patzer-Versicherung verbraucht (Maschinist)
  const [insuranceAvailable, setInsuranceAvailable] = useState(false);

  // Maritime sound design
  const audio = useNordsternAudio();

  const stage = STAGES[state.currentStage];
  const isLast = state.currentStage >= STAGES.length;

  const hasCrew = (id: string) => state.crew.includes(id);
  const maxJokers = hasCrew('lotse') ? 2 : 1;
  const streakBonus = hasCrew('cook') ? 1 : 0;
  const navigatorBonus = hasCrew('navigator');

  // persist
  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { saveDeck(deck); }, [deck]);

  const wind = useMemo(() => {
    const s = (state.windSeed + state.currentStage * 7) % WIND_LABELS.length;
    return WIND_LABELS[s];
  }, [state.windSeed, state.currentStage]);

  const fetchQuestion = useCallback(async (mode: 'scene' | 'harbor') => {
    setLoading(true); setError(null); setSelected(null); setRevealed(false); setEliminated([]);
    try {
      const due = dueCards(deck);
      let topic: Topic;
      let sourceIndex: number;
      if (mode === 'scene' && due.length > 0 && Math.random() < 0.35) {
        const pick = due[0];
        topic = pick.topic as Topic;
        sourceIndex = pick.sourceIndex;
      } else {
        topic = (stage?.topicHint || 'navigation') as Topic;
        const pool = SKS_CATALOG[topic];
        sourceIndex = Math.floor(Math.random() * pool.length);
      }
      let difficulty = state.difficulty;
      if (mode === 'harbor') difficulty += 2;
      if (mode === 'harbor' && navigatorBonus) difficulty -= 1;
      if (stormActive) difficulty += 1;
      difficulty = Math.min(10, Math.max(1, difficulty));

      const { data, error: err } = await supabase.functions.invoke('sks-question', {
        body: { topic, difficulty, sourceIndex },
      });
      if (err) throw err;
      if (!data || data.error) throw new Error(data?.error || 'Fehler');
      setCurrent({ ...data, topic, sourceIndex });
    } catch (e: any) {
      console.error(e);
      setError('Frage konnte nicht geladen werden. Erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, [deck, stage, state.difficulty, navigatorBonus, stormActive]);

  const startStage = () => {
    setQuestionIdx(0);
    setSessionCorrect(0);
    setSessionTotal(0);
    setJokersLeft(maxJokers);
    setInsuranceAvailable(hasCrew('mechanic') && !state.insuranceUsed);
    // Sturm in einer zufälligen Szenen-Frage (außer der ersten)
    setStormQuestionIdx(1 + Math.floor(Math.random() * (SCENE_QUESTIONS - 1)));
    setStormActive(false);
    setNewCrew(null);
    setNewKnowledge(null);
    setPhase('scene');
    audio.playFoghorn();
    fetchQuestion('scene');
  };

  // Sturm-Trigger bei Phasenwechsel zur passenden Frage
  useEffect(() => {
    if (phase === 'scene' && stormQuestionIdx === questionIdx) setStormActive(true);
    else setStormActive(false);
  }, [phase, questionIdx, stormQuestionIdx]);

  // Wind- und Sturm-Audio mit Spielzustand koppeln
  useEffect(() => {
    const inGame = phase === 'scene' || phase === 'harbor';
    audio.setWind(inGame ? wind.bft : 2);
  }, [wind.bft, phase, audio]);
  useEffect(() => { audio.setStorm(stormActive); }, [stormActive, audio]);

  const useFiftyFifty = () => {
    if (!current || revealed || jokersLeft <= 0) return;
    const wrong = current.options.map((_, i) => i).filter(i => i !== current.correct);
    // 2 zufällige falsche eliminieren
    const shuffled = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(shuffled);
    setJokersLeft(j => j - 1);
  };

  const onAnswer = (idx: number) => {
    if (revealed || !current || eliminated.includes(idx)) return;
    setSelected(idx);
    setRevealed(true);
    let correct = idx === current.correct;

    // Patzer-Versicherung: erste falsche Antwort wird zu "knapp richtig"
    let usedInsurance = false;
    if (!correct && insuranceAvailable) {
      usedInsurance = true;
      setInsuranceAvailable(false);
    }
    const effectiveCorrect = correct || usedInsurance;

    setSessionTotal(s => s + 1);
    if (effectiveCorrect) setSessionCorrect(s => s + 1);

    // SRS-Update (mit echter Korrektheit, nicht Versicherung)
    if (current.topic && typeof current.sourceIndex === 'number') {
      const key = `${current.topic}:${current.sourceIndex}`;
      const card = deck[key] || null;
      const quality = correct ? 5 : (usedInsurance ? 3 : 0);
      const updated = review(card, current.topic, current.sourceIndex, quality);
      setDeck(d => ({ ...d, [key]: updated }));
    }

    // Adaptive Difficulty + Streak
    setState(s => {
      const newStreak = correct ? s.correctStreak + 1 : 0;
      const bonus = correct ? 1 + streakBonus : 0;
      return {
        ...s,
        totalAnswered: s.totalAnswered + 1,
        totalCorrect: s.totalCorrect + (correct ? 1 : 0),
        correctStreak: newStreak,
        bestStreak: Math.max(s.bestStreak, newStreak),
        difficulty: correct
          ? (s.correctStreak + 1 >= 2 + (3 - bonus) ? Math.min(8, s.difficulty + 1) : s.difficulty)
          : Math.max(3, s.difficulty - 1),
        insuranceUsed: s.insuranceUsed || usedInsurance,
      };
    });

    // Knowledge Card sammeln: nur bei perfekter Antwort, kein Duplikat
    if (correct && current.topic && typeof current.sourceIndex === 'number') {
      const key = `${current.topic}:${current.sourceIndex}`;
      const exists = state.knowledgeCards.some(k => `${k.topic}:${k.sourceIndex}` === key);
      if (!exists && Math.random() < 0.4) {
        const card: KnowledgeCard = {
          topic: current.topic, sourceIndex: current.sourceIndex,
          q: current.question, a: current.options[current.correct], addedAt: Date.now(),
        };
        setNewKnowledge(card);
        setState(s => ({ ...s, knowledgeCards: [...s.knowledgeCards, card] }));
      }
    }
  };

  const onNext = () => {
    if (!current) return;
    const isScene = phase === 'scene';
    const limit = isScene ? SCENE_QUESTIONS : HARBOR_QUESTIONS;
    setNewKnowledge(null);
    if (questionIdx + 1 < limit) {
      setQuestionIdx(i => i + 1);
      fetchQuestion(isScene ? 'scene' : 'harbor');
    } else {
      if (isScene) {
        setQuestionIdx(0);
        setPhase('harbor');
        fetchQuestion('harbor');
      } else {
        const passed = sessionCorrect >= Math.floor((SCENE_QUESTIONS + HARBOR_QUESTIONS) * 0.6);
        if (passed) {
          const crew = pickNewCrew(state.crew);
          if (crew) setNewCrew(crew);
          setState(s => {
            const next = s.currentStage + 1;
            return {
              ...s,
              currentStage: next,
              completedStages: [...s.completedStages, stage.id],
              patches: [...s.patches, stage.to],
              crew: crew ? [...s.crew, crew.id] : s.crew,
            };
          });
          setPhase(state.currentStage + 1 >= STAGES.length ? 'finished' : 'completed');
        } else {
          setPhase('completed');
        }
      }
    }
  };

  const sessionAccuracy = sessionTotal > 0 ? Math.round(sessionCorrect / sessionTotal * 100) : 0;
  const dueCount = dueCards(deck).length;

  return (
    <div className="h-screen [height:100svh] [height:100dvh] max-h-screen [max-height:100dvh] bg-background text-foreground flex flex-col overflow-hidden">
      <PageMeta title="Nordstern – SKS-Pauken als Roguelike" description="Mediterrane Lernreise von Athen nach Bodrum. Spaced Repetition, adaptive Schwierigkeit, szenische SKS-Fragen." />

      <header className="border-b border-border/40 bg-background/60 backdrop-blur shrink-0">
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs tracking-widest text-primary">NORDSTERN</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <span>E{Math.min(state.currentStage + 1, STAGES.length)}/{STAGES.length}</span>
            <span className="text-primary">D{state.difficulty}</span>
            {state.correctStreak > 0 && (
              <span className="text-orange-400 flex items-center gap-0.5"><Flame className="w-3 h-3" />{state.correctStreak}</span>
            )}
            {dueCount > 0 && <span className="text-yellow-400">↻{dueCount}</span>}
            <button
              onClick={() => setLogbuchOpen(true)}
              className="ml-2 px-2 py-1 rounded border border-border/50 hover:border-primary/50 hover:text-primary flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />Logbuch
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto px-3 py-3 md:py-4 flex flex-col">
          {phase === 'home' && (
            <HomeScreen
              state={state} stage={stage} isLast={isLast} wind={wind}
              onStart={() => setPhase('briefing')}
              onReset={() => { resetState(); setState(loadState()); setDeck({}); }}
            />
          )}
          {phase === 'briefing' && stage && (
            <Briefing stage={stage} wind={wind} crewCount={state.crew.length} onGo={startStage} />
          )}
          {(phase === 'scene' || phase === 'harbor') && (
            <QuestionPanel
              phase={phase} questionIdx={questionIdx} stage={stage}
              currentStage={state.currentStage}
              current={current} loading={loading} error={error}
              selected={selected} revealed={revealed} eliminated={eliminated}
              sessionCorrect={sessionCorrect} sessionTotal={sessionTotal}
              stormActive={stormActive} jokersLeft={jokersLeft} maxJokers={maxJokers}
              insuranceAvailable={insuranceAvailable}
              newKnowledge={newKnowledge}
              onAnswer={onAnswer} onNext={onNext}
              onRetry={() => fetchQuestion(phase === 'scene' ? 'scene' : 'harbor')}
              onJoker={useFiftyFifty}
            />
          )}
          {phase === 'completed' && stage && (
            <Completed
              stage={stage} accuracy={sessionAccuracy}
              correct={sessionCorrect} total={sessionTotal}
              newCrew={newCrew}
              onContinue={() => setPhase('home')}
            />
          )}
          {phase === 'finished' && (
            <Finished state={state} onReset={() => { resetState(); setState(loadState()); setDeck({}); setPhase('home'); }} />
          )}
        </div>
      </main>

      {logbuchOpen && <Logbuch state={state} onClose={() => setLogbuchOpen(false)} />}
    </div>
  );
};

// ---------- Komponenten ----------

const RouteMap: React.FC<{ currentStage: number }> = ({ currentStage }) => (
  <svg viewBox="0 0 100 80" className="w-auto h-auto max-w-full max-h-full" style={{ aspectRatio: '100 / 80' }} preserveAspectRatio="xMidYMid meet">
    <defs>
      <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary/10" />
      </pattern>
      <radialGradient id="sea" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
      </radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="0.6" /></filter>
    </defs>
    <rect width="100" height="80" fill="url(#sea)" />
    <rect width="100" height="80" fill="url(#grid)" />
    {/* wave hints */}
    {[18, 30, 45, 65].map(y => (
      <path key={y} d={`M0 ${y} Q 25 ${y - 1.5}, 50 ${y} T 100 ${y}`} fill="none" stroke="currentColor" strokeWidth="0.15" className="text-primary/20" />
    ))}
    {/* compass rose */}
    <g transform="translate(92,8)" className="text-primary/40">
      <circle r="3" fill="none" stroke="currentColor" strokeWidth="0.15" />
      <path d="M0,-3 L0.6,0 L0,3 L-0.6,0 Z" fill="currentColor" />
      <text y="-4" textAnchor="middle" fontSize="1.6" className="fill-primary/60 font-mono">N</text>
    </g>
    <polyline points={PORTS.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="text-primary/40" />
    <polyline points={PORTS.slice(0, currentStage + 1).map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.7" className="text-primary" filter="url(#glow)" />
    <polyline points={PORTS.slice(0, currentStage + 1).map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
    {PORTS.map((p, i) => {
      const done = i <= currentStage;
      const active = i === currentStage;
      return (
        <g key={p.name}>
          {active && <circle cx={p.x} cy={p.y} r="2.5" className="fill-primary/30"><animate attributeName="r" values="1.6;3;1.6" dur="2.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" /></circle>}
          <circle cx={p.x} cy={p.y} r={active ? 1.4 : 0.8} className={active ? 'fill-primary' : done ? 'fill-primary/60' : 'fill-muted-foreground/40'} />
          <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="2" className={active ? 'fill-primary font-bold' : 'fill-muted-foreground'}>{p.name}</text>
        </g>
      );
    })}
    {currentStage < PORTS.length && (
      <text x={PORTS[currentStage].x} y={PORTS[currentStage].y + 0.8} textAnchor="middle" fontSize="4">⛵</text>
    )}
  </svg>
);

// Mini route ribbon for in-question HUD
const RouteRibbon: React.FC<{ currentStage: number; questionIdx: number; limit: number; phase: 'scene' | 'harbor' }> = ({ currentStage, questionIdx, limit, phase }) => {
  // Compute virtual progress along PORTS path
  const segStart = PORTS[currentStage];
  const segEnd = PORTS[Math.min(currentStage + 1, PORTS.length - 1)];
  const t = phase === 'scene'
    ? (questionIdx / (limit + 3)) // scenes fill ~5/8
    : (5 / 8) + ((questionIdx + 1) / (3 + 5)); // harbor fills remaining
  const tx = segStart.x + (segEnd.x - segStart.x) * Math.min(1, t);
  const ty = segStart.y + (segEnd.y - segStart.y) * Math.min(1, t);
  return (
    <svg viewBox="0 0 100 18" className="w-full h-8 md:h-10" preserveAspectRatio="none">
      <line x1="0" y1="9" x2="100" y2="9" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1.2 1.2" className="text-primary/25" />
      {PORTS.map((p, i) => {
        const x = (i / (PORTS.length - 1)) * 100;
        const done = i <= currentStage;
        const active = i === currentStage;
        return (
          <g key={i}>
            <circle cx={x} cy={9} r={active ? 1.6 : 1} className={done ? 'fill-primary' : 'fill-muted-foreground/40'} />
            {active && <circle cx={x} cy={9} r="3" className="fill-primary/25"><animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" /></circle>}
            <text x={x} y={17} textAnchor="middle" fontSize="2.6" className={active ? 'fill-primary font-bold' : 'fill-muted-foreground/60'} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{p.name.slice(0, 4)}</text>
          </g>
        );
      })}
      {/* boat */}
      <g transform={`translate(${(currentStage / (PORTS.length - 1)) * 100 + ((1 / (PORTS.length - 1)) * 100) * Math.min(1, t)} 9)`}>
        <text textAnchor="middle" fontSize="5" y="1.8">⛵</text>
      </g>
    </svg>
  );
};

const HomeScreen: React.FC<{
  state: NordsternState; stage?: Stage; isLast: boolean; wind: typeof WIND_LABELS[0];
  onStart: () => void; onReset: () => void;
}> = ({ state, stage, isLast, wind, onStart, onReset }) => (
  <div className="flex-1 min-h-0 flex flex-col gap-3 md:gap-4">
    <div className="text-center shrink-0">
      <h1 className="text-xl md:text-3xl font-bold tracking-tight">⛵ Nordstern</h1>
      <p className="text-[11px] md:text-sm text-muted-foreground max-w-2xl mx-auto leading-snug">
        Sieben Etappen von Athen nach Bodrum. Falsche Antworten kehren als Wetterfront zurück.
      </p>
    </div>

    <div className="flex-1 min-h-0 bg-card/50 border border-border/50 rounded-lg p-2 md:p-4 flex items-center justify-center overflow-hidden">
      <RouteMap currentStage={state.currentStage} />
    </div>

    {isLast ? (
      <div className="text-center space-y-3 bg-primary/10 border border-primary/30 rounded-lg p-4 shrink-0">
        <Trophy className="w-10 h-10 mx-auto text-primary" />
        <h2 className="text-lg font-bold">Bodrum erreicht – Reise abgeschlossen.</h2>
        <Button onClick={onReset} variant="outline" size="sm"><RotateCcw className="w-4 h-4" />Neue Reise</Button>
      </div>
    ) : stage && (
      <div className="bg-card/50 border border-border/50 rounded-lg p-3 md:p-4 shrink-0 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-muted-foreground">NÄCHSTE ETAPPE</div>
          <h2 className="text-base md:text-xl font-bold leading-tight">{stage.from} → {stage.to}</h2>
          <div className="text-xs text-muted-foreground">{stage.nm} sm · {TOPIC_LABEL[stage.topicHint]} · {wind.bft} Bft {wind.label}</div>
        </div>
        <Button onClick={onStart} size="sm">
          <Anchor className="w-4 h-4" />Leinen los
        </Button>
      </div>
    )}

    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono shrink-0">
      <Stat label="Beantw." value={state.totalAnswered} />
      <Stat label="Richtig" value={state.totalCorrect} />
      <Stat label="Streak" value={state.bestStreak} />
      <Stat label="Häfen" value={`${state.patches.length}/${STAGES.length}`} />
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-card/40 border border-border/30 rounded-md p-2 md:p-3">
    <div className="text-base md:text-xl text-primary font-bold">{value}</div>
    <div className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</div>
  </div>
);

const TOPIC_EMOJI: Record<Topic, string> = {
  navigation: '🧭', recht: '⚖️', wetter: '🌬️', seemannschaft: '⚓',
};

// Visual wind dial showing Bft strength
const WindDial: React.FC<{ bft: number }> = ({ bft }) => {
  const pct = Math.min(1, bft / 9);
  return (
    <svg viewBox="0 0 60 60" className="w-16 h-16 md:w-20 md:h-20">
      <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/40" />
      <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="2"
        strokeDasharray={`${pct * 163} 163`} strokeLinecap="round"
        transform="rotate(-90 30 30)" className="text-primary" />
      <text x="30" y="28" textAnchor="middle" fontSize="18" className="fill-primary font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{bft}</text>
      <text x="30" y="42" textAnchor="middle" fontSize="7" className="fill-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>BFT</text>
    </svg>
  );
};

const Briefing: React.FC<{ stage: Stage; wind: typeof WIND_LABELS[0]; crewCount: number; onGo: () => void }> = ({ stage, wind, crewCount, onGo }) => (
  <div className="flex-1 min-h-0 max-w-2xl w-full mx-auto flex flex-col justify-center gap-4">
    <div className="text-center shrink-0">
      <div className="text-[10px] font-mono text-primary tracking-widest">BRIEFING</div>
      <h2 className="text-xl md:text-3xl font-bold mt-1 leading-tight">{stage.from} → {stage.to}</h2>
    </div>

    {/* Visual hero card */}
    <div className="relative bg-gradient-to-br from-card/60 to-card/30 border border-border/50 rounded-lg p-4 md:p-5 overflow-hidden">
      <div className="absolute -right-4 -top-4 text-7xl md:text-8xl opacity-10 select-none pointer-events-none">{TOPIC_EMOJI[stage.topicHint]}</div>
      <div className="relative flex items-center gap-4">
        <WindDial bft={wind.bft} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{wind.label}</div>
          <div className="text-sm md:text-base text-foreground/90 italic leading-snug line-clamp-3">"{stage.scene}"</div>
        </div>
      </div>
      <div className="relative grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/30">
        <div className="text-center">
          <Waves className="w-4 h-4 mx-auto text-primary" />
          <div className="text-base font-bold font-mono mt-0.5">{stage.nm}<span className="text-[10px] text-muted-foreground ml-0.5">sm</span></div>
        </div>
        <div className="text-center">
          <div className="text-xl">{TOPIC_EMOJI[stage.topicHint]}</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">{TOPIC_LABEL[stage.topicHint]}</div>
        </div>
        <div className="text-center">
          <Users className="w-4 h-4 mx-auto text-primary" />
          <div className="text-base font-bold font-mono mt-0.5">{crewCount}<span className="text-[10px] text-muted-foreground ml-0.5">Crew</span></div>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-muted-foreground shrink-0">
      <span className="text-primary">5</span>×Szene
      <span className="opacity-40">·</span>
      <span className="text-primary">3</span>×Hafen
      <span className="opacity-40">·</span>
      <span className="text-primary">60%</span> bestehen
    </div>
    <Button onClick={onGo} className="w-full shrink-0"><ArrowRight className="w-4 h-4" />Leinen los</Button>
  </div>
);

const QuestionPanel: React.FC<{
  phase: 'scene' | 'harbor';
  questionIdx: number;
  stage?: Stage;
  currentStage: number;
  current: AiQuestion | null;
  loading: boolean;
  error: string | null;
  selected: number | null;
  revealed: boolean;
  eliminated: number[];
  sessionCorrect: number;
  sessionTotal: number;
  stormActive: boolean;
  jokersLeft: number;
  maxJokers: number;
  insuranceAvailable: boolean;
  newKnowledge: KnowledgeCard | null;
  onAnswer: (i: number) => void;
  onNext: () => void;
  onRetry: () => void;
  onJoker: () => void;
}> = ({ phase, questionIdx, stage, currentStage, current, loading, error, selected, revealed, eliminated,
       sessionCorrect, sessionTotal, stormActive, jokersLeft, maxJokers,
       insuranceAvailable, newKnowledge, onAnswer, onNext, onRetry, onJoker }) => {
  const limit = phase === 'scene' ? SCENE_QUESTIONS : HARBOR_QUESTIONS;
  const topicEmoji = stage ? TOPIC_EMOJI[stage.topicHint] : '🧭';
  return (
    <div className="flex-1 min-h-0 max-w-2xl w-full mx-auto flex flex-col gap-2 md:gap-3 overflow-hidden relative">
      {/* Storm overlay – flashes behind everything */}
      {stormActive && !loading && (
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden -z-0">
          <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
          <div className="absolute top-2 right-2 text-destructive/70 animate-pulse">
            <CloudLightning className="w-8 h-8" />
          </div>
        </div>
      )}

      {/* Route ribbon HUD */}
      <div className="shrink-0 text-primary/60">
        <RouteRibbon currentStage={currentStage} questionIdx={questionIdx} limit={limit} phase={phase} />
      </div>

      {/* Compact icon HUD */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-sm">{phase === 'scene' ? topicEmoji : '⚓'}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            <span className="text-primary">{questionIdx + 1}</span>/{limit}
          </span>
          {stormActive && (
            <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-destructive/15 border border-destructive/40 text-destructive text-[10px] font-mono animate-pulse">
              <CloudLightning className="w-3 h-3" />STURM
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {insuranceAvailable && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400" title="Patzer-Versicherung">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          )}
          <button
            onClick={onJoker}
            disabled={revealed || jokersLeft <= 0 || loading}
            className="relative inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary/40 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 transition"
            title="50/50 Joker"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 text-[9px] font-mono bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center">{jokersLeft}</span>
          </button>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-card/50 border border-border/40 font-mono text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-primary">{sessionCorrect}</span><span className="text-muted-foreground">/{sessionTotal}</span>
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex-1 min-h-0 bg-card/50 border border-border/50 rounded-lg p-6 text-center flex flex-col items-center justify-center">
          <div className="relative">
            <Compass className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-3">Kurs setzen…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center space-y-3 flex flex-col items-center justify-center">
          <p className="text-sm">{error}</p>
          <Button onClick={onRetry} size="sm" variant="outline"><RotateCcw className="w-4 h-4" />Erneut</Button>
        </div>
      )}

      {current && !loading && !error && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 md:gap-3 overflow-hidden">
          <div className="relative bg-card/50 border border-border/50 rounded-lg p-3 md:p-4 shrink-0 overflow-hidden">
            <div className="absolute -right-2 -top-2 text-5xl opacity-[0.07] select-none pointer-events-none">{topicEmoji}</div>
            <p className="relative text-sm md:text-base font-medium leading-snug">
              {highlight(current.question, current.keywords)}
            </p>
          </div>

          <div className="grid gap-1.5 md:gap-2 shrink-0">
            {current.options.map((opt, i) => {
              const isSel = selected === i;
              const isCorrect = revealed && i === current.correct;
              const isWrong = revealed && isSel && i !== current.correct;
              const isEliminated = eliminated.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(i)}
                  disabled={revealed || isEliminated}
                  className={[
                    'group text-left pl-2 pr-3 py-2 md:py-2.5 rounded-lg border transition-all flex items-center gap-3',
                    isCorrect ? 'border-green-500/60 bg-green-500/10' :
                    isWrong ? 'border-destructive/60 bg-destructive/10' :
                    isSel ? 'border-primary/60 bg-primary/10' :
                    isEliminated ? 'border-border/30 bg-card/10 opacity-30 line-through' :
                    'border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/60 hover:translate-x-0.5',
                    revealed || isEliminated ? 'cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span className={[
                    'shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full font-mono text-xs font-bold border transition',
                    isCorrect ? 'border-green-500/60 bg-green-500/20 text-green-400' :
                    isWrong ? 'border-destructive/60 bg-destructive/20 text-destructive' :
                    isSel ? 'border-primary/60 bg-primary/20 text-primary' :
                    'border-border/60 bg-background/40 text-muted-foreground group-hover:border-primary/60 group-hover:text-primary',
                  ].join(' ')}>
                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : 'ABCD'[i]}
                  </span>
                  <span className="flex-1 text-sm leading-snug">
                    {revealed && i === current.correct ? highlight(opt, current.keywords) : opt}
                  </span>
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="flex-1 min-h-0 bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto text-xs md:text-sm flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{highlight(current.explanation, current.keywords)}</span>
              </div>
              {newKnowledge && (
                <div className="flex items-center gap-2 text-[11px] bg-cyan-500/10 border border-cyan-500/30 rounded-md px-2 py-1 text-cyan-300 shrink-0 animate-in fade-in zoom-in-95">
                  <BookOpen className="w-3.5 h-3.5" />
                  Neue Logbuch-Karte gesammelt.
                </div>
              )}
              <Button onClick={onNext} className="w-full shrink-0" size="sm">
                {questionIdx + 1 < limit ? <>Weiter <ArrowRight className="w-4 h-4" /></> :
                  phase === 'scene' ? <>Hafen anlaufen <Anchor className="w-4 h-4" /></> :
                  <>Etappe beenden <Trophy className="w-4 h-4" /></>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Completed: React.FC<{
  stage: Stage; accuracy: number; correct: number; total: number;
  newCrew: CrewMember | null; onContinue: () => void;
}> = ({ stage, accuracy, correct, total, newCrew, onContinue }) => {
  const passed = accuracy >= 60;
  return (
    <div className="flex-1 min-h-0 max-w-xl mx-auto text-center flex flex-col items-center justify-center gap-4 py-2">
      {passed ? (
        <>
          <div className="text-4xl md:text-5xl">⚓</div>
          <h2 className="text-xl md:text-3xl font-bold">{stage.to} erreicht</h2>
          <p className="text-sm text-muted-foreground">Patch ins Logbuch: <span className="text-primary font-semibold">{stage.to}</span></p>
        </>
      ) : (
        <>
          <div className="text-4xl md:text-5xl">🌊</div>
          <h2 className="text-xl md:text-3xl font-bold">Vor Anker</h2>
          <p className="text-sm text-muted-foreground">Wetter unbeständig – die Etappe wiederholt sich. Pauken hilft.</p>
        </>
      )}
      <div className="bg-card/50 border border-border/50 rounded-lg p-3 inline-block">
        <div className="text-2xl md:text-3xl font-bold text-primary">{accuracy}%</div>
        <div className="text-xs text-muted-foreground">{correct} von {total} richtig</div>
      </div>

      {passed && newCrew && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 max-w-md w-full text-left animate-in fade-in zoom-in-95">
          <div className="text-[10px] font-mono text-primary tracking-widest mb-1">NEUES CREW-MITGLIED</div>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{newCrew.emoji}</div>
            <div className="min-w-0">
              <div className="font-bold text-sm">{newCrew.name}</div>
              <div className="text-xs text-muted-foreground">{newCrew.role}</div>
              <div className="text-xs text-primary mt-0.5">{newCrew.effect}</div>
            </div>
          </div>
        </div>
      )}

      <Button onClick={onContinue} className="w-full md:w-auto">
        Zur Karte <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

const Finished: React.FC<{ state: NordsternState; onReset: () => void }> = ({ state, onReset }) => (
  <div className="flex-1 min-h-0 max-w-xl mx-auto text-center flex flex-col items-center justify-center gap-4">
    <Trophy className="w-12 h-12 md:w-16 md:h-16 text-primary" />
    <h2 className="text-2xl md:text-4xl font-bold">Bodrum erreicht!</h2>
    <p className="text-sm text-muted-foreground">
      {state.totalAnswered} Fragen, {state.totalCorrect} richtig ({Math.round(state.totalCorrect / Math.max(1, state.totalAnswered) * 100)} %). Best-Streak: {state.bestStreak}.
    </p>
    <div className="flex flex-wrap gap-1.5 justify-center">
      {state.patches.map(p => (
        <span key={p} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">⚓ {p}</span>
      ))}
    </div>
    <Button onClick={onReset}><RotateCcw className="w-4 h-4" />Neue Reise</Button>
  </div>
);

const Logbuch: React.FC<{ state: NordsternState; onClose: () => void }> = ({ state, onClose }) => {
  const crewById = (id: string) => CREW_POOL.find(c => c.id === id);
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-auto">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full p-5 md:p-6 space-y-5 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Logbuch</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <section>
          <h3 className="text-xs font-mono text-primary tracking-widest mb-2">CREW ({state.crew.length}/{CREW_POOL.length})</h3>
          {state.crew.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Crew an Bord. Bestehe Etappen, um Mitglieder anzuheuern.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {state.crew.map(id => {
                const c = crewById(id); if (!c) return null;
                return (
                  <div key={id} className="bg-card/50 border border-border/50 rounded-md p-3 flex items-center gap-3">
                    <div className="text-2xl">{c.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.role}</div>
                      <div className="text-xs text-primary mt-0.5">{c.effect}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs font-mono text-primary tracking-widest mb-2">HÄFEN ({state.patches.length}/{STAGES.length})</h3>
          <div className="flex flex-wrap gap-2">
            {STAGES.map(s => {
              const done = state.patches.includes(s.to);
              return (
                <span key={s.id} className={`text-xs font-mono px-2 py-1 rounded-full border ${done ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/40 text-muted-foreground/60'}`}>
                  {done ? '⚓' : '○'} {s.to}
                </span>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-mono text-primary tracking-widest mb-2">WISSENSKARTEN ({state.knowledgeCards.length})</h3>
          {state.knowledgeCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Karten werden gelegentlich nach perfekten Antworten gesammelt.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {state.knowledgeCards.slice().reverse().map((c, i) => (
                <div key={i} className="bg-card/40 border border-border/40 rounded-md p-3">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">{TOPIC_LABEL[c.topic as Topic] || c.topic}</div>
                  <div className="text-sm font-medium leading-snug">{c.q}</div>
                  <div className="text-xs text-primary mt-1">→ {c.a}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Button onClick={onClose} variant="outline" className="w-full">Schließen</Button>
      </div>
    </div>
  );
};

export default Nordstern;
