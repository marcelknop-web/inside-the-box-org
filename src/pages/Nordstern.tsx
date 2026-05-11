import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import {
  Anchor, Compass, Wind, Loader2, CheckCircle2, XCircle, ArrowRight, Trophy,
  RotateCcw, Sparkles, Waves, Zap, BookOpen, Users, X, ShieldCheck, Flame, CloudLightning,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SKS_CATALOG } from '@/data/sksQuestions';
import { STAGES, PORTS, type Stage } from '@/lib/nordstern/stages';
import {
  loadState, saveState, resetState, loadDeck, saveDeck, review, dueCards,
  CREW_POOL, pickNewCrew, type SrsCard, type NordsternState, type CrewMember, type KnowledgeCard,
} from '@/lib/nordstern/sm2';

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
    fetchQuestion('scene');
  };

  // Sturm-Trigger bei Phasenwechsel zur passenden Frage
  useEffect(() => {
    if (phase === 'scene' && stormQuestionIdx === questionIdx) setStormActive(true);
    else setStormActive(false);
  }, [phase, questionIdx, stormQuestionIdx]);

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
    <div className="h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden">
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
  <svg viewBox="0 0 100 80" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
    <defs>
      <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary/10" />
      </pattern>
    </defs>
    <rect width="100" height="80" fill="url(#grid)" />
    <polyline points={PORTS.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 1" className="text-primary/40" />
    <polyline points={PORTS.slice(0, currentStage + 1).map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.6" className="text-primary" />
    {PORTS.map((p, i) => {
      const done = i <= currentStage;
      const active = i === currentStage;
      return (
        <g key={p.name}>
          <circle cx={p.x} cy={p.y} r={active ? 1.4 : 0.8} className={active ? 'fill-primary' : done ? 'fill-primary/60' : 'fill-muted-foreground/40'} />
          <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="2" className={active ? 'fill-primary font-bold' : 'fill-muted-foreground'}>{p.name}</text>
        </g>
      );
    })}
    {currentStage < PORTS.length && (
      <text x={PORTS[currentStage].x} y={PORTS[currentStage].y + 0.8} textAnchor="middle" fontSize="3.5">⛵</text>
    )}
  </svg>
);

const HomeScreen: React.FC<{
  state: NordsternState; stage?: Stage; isLast: boolean; wind: typeof WIND_LABELS[0];
  onStart: () => void; onReset: () => void;
}> = ({ state, stage, isLast, wind, onStart, onReset }) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">⛵ Nordstern</h1>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
        Sieben Etappen von Athen nach Bodrum. Jede Seemeile eine Frage. Falsche Antworten kehren als Wetterfront zurück – bis sie sitzen.
      </p>
    </div>

    <div className="bg-card/50 border border-border/50 rounded-lg p-4 md:p-6">
      <RouteMap currentStage={state.currentStage} />
    </div>

    {isLast ? (
      <div className="text-center space-y-4 bg-primary/10 border border-primary/30 rounded-lg p-6">
        <Trophy className="w-12 h-12 mx-auto text-primary" />
        <h2 className="text-xl font-bold">Bodrum erreicht – Reise abgeschlossen.</h2>
        <Button onClick={onReset} variant="outline"><RotateCcw className="w-4 h-4" />Neue Reise</Button>
      </div>
    ) : stage && (
      <div className="bg-card/50 border border-border/50 rounded-lg p-4 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-mono text-muted-foreground">NÄCHSTE ETAPPE</div>
            <h2 className="text-xl md:text-2xl font-bold">{stage.from} → {stage.to}</h2>
            <div className="text-sm text-muted-foreground">{stage.nm} sm · Schwerpunkt: {TOPIC_LABEL[stage.topicHint]}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-muted-foreground flex items-center gap-1 justify-end"><Wind className="w-3 h-3" />WETTER</div>
            <div className="text-sm">{wind.bft} Bft · {wind.label}</div>
            <div className="text-xs text-muted-foreground">{wind.desc}</div>
          </div>
        </div>
        <Button onClick={onStart} className="w-full md:w-auto" size="lg">
          <Anchor className="w-4 h-4" />Leinen los
        </Button>
      </div>
    )}

    <div className="grid grid-cols-4 gap-2 md:gap-3 text-center text-xs font-mono">
      <Stat label="Beantwortet" value={state.totalAnswered} />
      <Stat label="Richtig" value={state.totalCorrect} />
      <Stat label="Best-Streak" value={state.bestStreak} />
      <Stat label="Häfen" value={`${state.patches.length}/${STAGES.length}`} />
    </div>

    <div className="text-center">
      <button onClick={onReset} className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline">
        Reise zurücksetzen
      </button>
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-card/40 border border-border/30 rounded-md p-2 md:p-3">
    <div className="text-base md:text-xl text-primary font-bold">{value}</div>
    <div className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</div>
  </div>
);

const Briefing: React.FC<{ stage: Stage; wind: typeof WIND_LABELS[0]; crewCount: number; onGo: () => void }> = ({ stage, wind, crewCount, onGo }) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="text-center">
      <div className="text-xs font-mono text-primary tracking-widest">BRIEFING</div>
      <h2 className="text-2xl md:text-3xl font-bold mt-1">{stage.from} → {stage.to}</h2>
    </div>
    <div className="bg-card/50 border border-border/50 rounded-lg p-4 md:p-6 space-y-3">
      <p className="italic text-muted-foreground">"{stage.scene}"</p>
      <div className="flex items-center gap-4 text-sm flex-wrap pt-2 border-t border-border/30">
        <span className="flex items-center gap-1"><Waves className="w-4 h-4 text-primary" />{stage.nm} sm</span>
        <span className="flex items-center gap-1"><Wind className="w-4 h-4 text-primary" />{wind.bft} Bft</span>
        <span className="flex items-center gap-1"><Compass className="w-4 h-4 text-primary" />{TOPIC_LABEL[stage.topicHint]}</span>
        {crewCount > 0 && <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" />{crewCount} Crew</span>}
      </div>
    </div>
    <div className="text-center text-sm text-muted-foreground">
      5 Szenen-Fragen · 3 Hafenmanöver · 60 % zum Bestehen
    </div>
    <Button onClick={onGo} className="w-full" size="lg"><ArrowRight className="w-4 h-4" />Etappe starten</Button>
  </div>
);

const QuestionPanel: React.FC<{
  phase: 'scene' | 'harbor';
  questionIdx: number;
  stage?: Stage;
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
}> = ({ phase, questionIdx, stage, current, loading, error, selected, revealed, eliminated,
       sessionCorrect, sessionTotal, stormActive, jokersLeft, maxJokers,
       insuranceAvailable, newKnowledge, onAnswer, onNext, onRetry, onJoker }) => {
  const limit = phase === 'scene' ? SCENE_QUESTIONS : HARBOR_QUESTIONS;
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between text-xs font-mono gap-2">
        <span className="text-primary">
          {phase === 'scene' ? `SZENE ${questionIdx + 1}/${limit}` : `⚓ HAFENMANÖVER ${questionIdx + 1}/${limit}`}
        </span>
        <div className="flex items-center gap-2">
          {insuranceAvailable && (
            <span className="flex items-center gap-1 text-cyan-400" title="Patzer-Versicherung (Maschinist)">
              <ShieldCheck className="w-3 h-3" />1×
            </span>
          )}
          <button
            onClick={onJoker}
            disabled={revealed || jokersLeft <= 0 || loading}
            className="px-2 py-1 rounded border border-primary/40 text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/10 flex items-center gap-1"
            title="50/50 – zwei falsche Antworten eliminieren"
          >
            <Zap className="w-3 h-3" />50/50 ({jokersLeft}/{maxJokers})
          </button>
          <span className="text-muted-foreground">{sessionCorrect}/{sessionTotal} ✓</span>
        </div>
      </div>

      {/* Sturm-Warnung */}
      {stormActive && !loading && (
        <div className="bg-destructive/10 border border-destructive/40 rounded-lg p-3 flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
          <CloudLightning className="w-4 h-4 text-destructive" />
          <span><strong>Sturm-Event:</strong> Schwierigkeit +1 – richtige Antwort zählt doppelt für die Streak.</span>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex gap-1">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < questionIdx ? 'bg-primary' : i === questionIdx ? 'bg-primary/60' : 'bg-muted'}`} />
        ))}
      </div>

      {loading && (
        <div className="bg-card/50 border border-border/50 rounded-lg p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">{phase === 'harbor' ? 'Hafenmanöver wird vorbereitet…' : 'Frage wird vorbereitet…'}</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center space-y-3">
          <p className="text-sm">{error}</p>
          <Button onClick={onRetry} size="sm" variant="outline"><RotateCcw className="w-4 h-4" />Erneut</Button>
        </div>
      )}

      {current && !loading && !error && (
        <>
          {phase === 'scene' && stage && questionIdx === 0 && (
            <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">{stage.scene}</p>
          )}
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 md:p-5">
            <p className="text-base md:text-lg font-medium leading-snug">
              {highlight(current.question, current.keywords)}
            </p>
          </div>

          <div className="grid gap-2">
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
                    'text-left p-3 md:p-4 rounded-lg border transition-all flex items-start gap-3',
                    isCorrect ? 'border-green-500/60 bg-green-500/10' :
                    isWrong ? 'border-destructive/60 bg-destructive/10' :
                    isSel ? 'border-primary/60 bg-primary/10' :
                    isEliminated ? 'border-border/30 bg-card/10 opacity-30 line-through' :
                    'border-border/50 bg-card/30 hover:border-primary/40 hover:bg-card/60',
                    revealed || isEliminated ? 'cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span className="font-mono text-xs text-muted-foreground mt-1">{'ABCD'[i]}</span>
                  <span className="flex-1 text-sm md:text-base">
                    {revealed && i === current.correct ? highlight(opt, current.keywords) : opt}
                  </span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  {isWrong && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{highlight(current.explanation, current.keywords)}</span>
              </p>
              {newKnowledge && (
                <div className="flex items-center gap-2 text-xs bg-cyan-500/10 border border-cyan-500/30 rounded-md p-2 text-cyan-300">
                  <BookOpen className="w-4 h-4" />
                  Neue Logbuch-Karte gesammelt.
                </div>
              )}
              <Button onClick={onNext} className="w-full" size="lg">
                {questionIdx + 1 < limit ? <>Weiter <ArrowRight className="w-4 h-4" /></> :
                  phase === 'scene' ? <>Hafen anlaufen <Anchor className="w-4 h-4" /></> :
                  <>Etappe beenden <Trophy className="w-4 h-4" /></>}
              </Button>
            </div>
          )}
        </>
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
    <div className="max-w-xl mx-auto text-center space-y-6">
      {passed ? (
        <>
          <div className="text-5xl">⚓</div>
          <h2 className="text-2xl md:text-3xl font-bold">{stage.to} erreicht</h2>
          <p className="text-muted-foreground">Patch ins Logbuch: <span className="text-primary font-semibold">{stage.to}</span></p>
        </>
      ) : (
        <>
          <div className="text-5xl">🌊</div>
          <h2 className="text-2xl md:text-3xl font-bold">Vor Anker</h2>
          <p className="text-muted-foreground">Wetter unbeständig – die Etappe wiederholt sich. Pauken hilft.</p>
        </>
      )}
      <div className="bg-card/50 border border-border/50 rounded-lg p-4 inline-block">
        <div className="text-3xl font-bold text-primary">{accuracy}%</div>
        <div className="text-xs text-muted-foreground">{correct} von {total} richtig</div>
      </div>

      {passed && newCrew && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md mx-auto text-left animate-in fade-in zoom-in-95">
          <div className="text-xs font-mono text-primary tracking-widest mb-2">NEUES CREW-MITGLIED</div>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{newCrew.emoji}</div>
            <div>
              <div className="font-bold">{newCrew.name}</div>
              <div className="text-xs text-muted-foreground">{newCrew.role}</div>
              <div className="text-sm text-primary mt-1">{newCrew.effect}</div>
            </div>
          </div>
        </div>
      )}

      <Button onClick={onContinue} size="lg" className="w-full md:w-auto">
        Zur Karte <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

const Finished: React.FC<{ state: NordsternState; onReset: () => void }> = ({ state, onReset }) => (
  <div className="max-w-xl mx-auto text-center space-y-6 py-8">
    <Trophy className="w-16 h-16 text-primary mx-auto" />
    <h2 className="text-3xl md:text-4xl font-bold">Bodrum erreicht!</h2>
    <p className="text-muted-foreground">
      Sie haben {state.totalAnswered} Fragen beantwortet, davon {state.totalCorrect} richtig
      ({Math.round(state.totalCorrect / Math.max(1, state.totalAnswered) * 100)} %).
      Best-Streak: {state.bestStreak}.
    </p>
    <div className="flex flex-wrap gap-2 justify-center">
      {state.patches.map(p => (
        <span key={p} className="text-xs font-mono px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">⚓ {p}</span>
      ))}
    </div>
    <Button onClick={onReset} size="lg"><RotateCcw className="w-4 h-4" />Neue Reise</Button>
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
