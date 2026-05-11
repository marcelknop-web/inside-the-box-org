import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { Anchor, Compass, Wind, Loader2, CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw, Sparkles, Waves } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SKS_CATALOG } from '@/data/sksQuestions';
import { STAGES, PORTS, type Stage } from '@/lib/nordstern/stages';
import { loadState, saveState, resetState, loadDeck, saveDeck, review, dueCards, type SrsCard, type NordsternState } from '@/lib/nordstern/sm2';

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
  navigation: 'Navigation',
  recht: 'Recht',
  wetter: 'Wetter',
  seemannschaft: 'Seemannschaft',
};

const WIND_LABELS = [
  { bft: 2, label: 'leichte Brise', desc: 'sanftes Gleiten' },
  { bft: 4, label: 'mäßige Brise', desc: 'volle Fahrt' },
  { bft: 5, label: 'frische Brise', desc: 'Reff im Groß' },
  { bft: 6, label: 'starker Wind', desc: 'Vorsicht geboten' },
  { bft: 7, label: 'steifer Wind', desc: 'erfahrene Hand nötig' },
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

  const stage = STAGES[state.currentStage];
  const isLast = state.currentStage >= STAGES.length;

  // persist
  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { saveDeck(deck); }, [deck]);

  const wind = useMemo(() => {
    const s = (state.windSeed + state.currentStage * 7) % WIND_LABELS.length;
    return WIND_LABELS[s];
  }, [state.windSeed, state.currentStage]);

  // Fetch question: 30% from due SRS deck, 70% fresh from stage topic
  const fetchQuestion = useCallback(async (mode: 'scene' | 'harbor') => {
    setLoading(true); setError(null); setSelected(null); setRevealed(false);
    try {
      const due = dueCards(deck);
      let topic: Topic;
      let sourceIndex: number;
      if (mode === 'scene' && due.length > 0 && Math.random() < 0.35) {
        const pick = due[0];
        topic = pick.topic as Topic;
        sourceIndex = pick.sourceIndex;
      } else {
        // Stage-Thema bevorzugt; Hafenmanöver schwerer
        topic = (stage?.topicHint || 'navigation') as Topic;
        const pool = SKS_CATALOG[topic];
        sourceIndex = Math.floor(Math.random() * pool.length);
      }
      const difficulty = mode === 'harbor' ? Math.min(10, state.difficulty + 2) : state.difficulty;
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
  }, [deck, stage, state.difficulty]);

  const startStage = () => {
    setQuestionIdx(0);
    setSessionCorrect(0);
    setSessionTotal(0);
    setPhase('scene');
    fetchQuestion('scene');
  };

  const onAnswer = (idx: number) => {
    if (revealed || !current) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === current.correct;
    setSessionTotal(s => s + 1);
    if (correct) setSessionCorrect(s => s + 1);

    // SRS-Update
    if (current.topic && typeof current.sourceIndex === 'number') {
      const key = `${current.topic}:${current.sourceIndex}`;
      const card = deck[key] || null;
      const quality = correct ? 5 : 0;
      const updated = review(card, current.topic, current.sourceIndex, quality);
      setDeck(d => ({ ...d, [key]: updated }));
    }

    // Adaptive Schwierigkeit
    setState(s => ({
      ...s,
      totalAnswered: s.totalAnswered + 1,
      totalCorrect: s.totalCorrect + (correct ? 1 : 0),
      correctStreak: correct ? s.correctStreak + 1 : 0,
      difficulty: correct
        ? (s.correctStreak >= 2 ? Math.min(8, s.difficulty + 1) : s.difficulty)
        : Math.max(3, s.difficulty - 1),
    }));
  };

  const onNext = () => {
    if (!current) return;
    const isScene = phase === 'scene';
    const limit = isScene ? SCENE_QUESTIONS : HARBOR_QUESTIONS;
    if (questionIdx + 1 < limit) {
      setQuestionIdx(i => i + 1);
      fetchQuestion(isScene ? 'scene' : 'harbor');
    } else {
      if (isScene) {
        // Übergang zum Hafenmanöver
        setQuestionIdx(0);
        setPhase('harbor');
        fetchQuestion('harbor');
      } else {
        // Etappe abgeschlossen
        const passed = sessionCorrect >= Math.floor((SCENE_QUESTIONS + HARBOR_QUESTIONS) * 0.6);
        if (passed) {
          setState(s => {
            const next = s.currentStage + 1;
            return {
              ...s,
              currentStage: next,
              completedStages: [...s.completedStages, stage.id],
              patches: [...s.patches, stage.to],
            };
          });
          setPhase(state.currentStage + 1 >= STAGES.length ? 'finished' : 'completed');
        } else {
          // Etappe nicht bestanden – Ankerplatz, neuer Versuch
          setPhase('completed');
        }
      }
    }
  };

  const sessionAccuracy = sessionTotal > 0 ? Math.round(sessionCorrect / sessionTotal * 100) : 0;
  const dueCount = dueCards(deck).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title="Nordstern – SKS-Pauken als Roguelike" description="Mediterrane Roguelike-Lernreise von Athen nach Bodrum. Spaced Repetition, adaptive Schwierigkeit, szenische SKS-Fragen." />

      <header className="border-b border-border/40 bg-background/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm tracking-widest text-primary">NORDSTERN</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">SKS-Pauken-Reise</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span>Etappe {Math.min(state.currentStage + 1, STAGES.length)}/{STAGES.length}</span>
            <span className="text-primary">D{state.difficulty}</span>
            {dueCount > 0 && <span className="text-yellow-400">↻{dueCount}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {phase === 'home' && (
          <HomeScreen
            state={state} stage={stage} isLast={isLast} wind={wind}
            onStart={() => { setPhase('briefing'); }}
            onReset={() => { resetState(); setState(loadState()); setDeck({}); }}
          />
        )}

        {phase === 'briefing' && stage && (
          <Briefing stage={stage} wind={wind} onGo={startStage} />
        )}

        {(phase === 'scene' || phase === 'harbor') && (
          <QuestionPanel
            phase={phase} questionIdx={questionIdx} stage={stage}
            current={current} loading={loading} error={error}
            selected={selected} revealed={revealed}
            sessionCorrect={sessionCorrect} sessionTotal={sessionTotal}
            onAnswer={onAnswer} onNext={onNext} onRetry={() => fetchQuestion(phase === 'scene' ? 'scene' : 'harbor')}
          />
        )}

        {phase === 'completed' && stage && (
          <Completed
            stage={stage} accuracy={sessionAccuracy}
            correct={sessionCorrect} total={sessionTotal}
            onContinue={() => setPhase('home')}
          />
        )}

        {phase === 'finished' && (
          <Finished state={state} onReset={() => { resetState(); setState(loadState()); setDeck({}); setPhase('home'); }} />
        )}
      </main>

      <footer className="text-center text-xs text-muted-foreground/70 pb-8 px-4">
        Trainingsspiel auf Basis des amtlichen SKS-Fragenkatalogs. Ersetzt keine Prüfungsvorbereitung mit anerkanntem Lehrmaterial.
        {' · '}<Link to="/sks-quiz" className="underline hover:text-primary">Klassisches Quiz</Link>
      </footer>
    </div>
  );
};

// ---------- Komponenten ----------

const RouteMap: React.FC<{ currentStage: number; completed: string[] }> = ({ currentStage, completed }) => {
  return (
    <svg viewBox="0 0 100 80" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Hintergrund / Wasser-Gitter */}
      <defs>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary/10" />
        </pattern>
      </defs>
      <rect width="100" height="80" fill="url(#grid)" />

      {/* Route-Linie */}
      <polyline
        points={PORTS.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeDasharray="1 1"
        className="text-primary/40"
      />
      {/* gesegelte Strecke */}
      <polyline
        points={PORTS.slice(0, currentStage + 1).map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        className="text-primary"
      />

      {/* Häfen */}
      {PORTS.map((p, i) => {
        const done = i <= currentStage;
        const active = i === currentStage;
        return (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r={active ? 1.4 : 0.8}
              className={active ? 'fill-primary' : done ? 'fill-primary/60' : 'fill-muted-foreground/40'} />
            <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="2"
              className={active ? 'fill-primary font-bold' : 'fill-muted-foreground'}>{p.name}</text>
          </g>
        );
      })}

      {/* Boot */}
      {currentStage < PORTS.length && (
        <text x={PORTS[currentStage].x} y={PORTS[currentStage].y + 0.8} textAnchor="middle" fontSize="3.5">⛵</text>
      )}
    </svg>
  );
};

const HomeScreen: React.FC<{
  state: NordsternState; stage?: Stage; isLast: boolean; wind: typeof WIND_LABELS[0];
  onStart: () => void; onReset: () => void;
}> = ({ state, stage, isLast, wind, onStart, onReset }) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">⛵ Nordstern</h1>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
        Sieben Etappen von Athen nach Bodrum. Jede Seemeile eine Frage. Falsch beantwortete Fragen kommen wieder – bis sie sitzen.
      </p>
    </div>

    <div className="bg-card/50 border border-border/50 rounded-lg p-4 md:p-6">
      <RouteMap currentStage={state.currentStage} completed={state.completedStages} />
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

    <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
      <Stat label="Beantwortet" value={state.totalAnswered} />
      <Stat label="Richtig" value={state.totalCorrect} />
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
  <div className="bg-card/40 border border-border/30 rounded-md p-3">
    <div className="text-lg md:text-xl text-primary font-bold">{value}</div>
    <div className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</div>
  </div>
);

const Briefing: React.FC<{ stage: Stage; wind: typeof WIND_LABELS[0]; onGo: () => void }> = ({ stage, wind, onGo }) => (
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
      </div>
    </div>
    <div className="text-center text-sm text-muted-foreground">
      5 Szenen-Fragen, dann 3 Hafenmanöver-Fragen (schwerer).
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
  sessionCorrect: number;
  sessionTotal: number;
  onAnswer: (i: number) => void;
  onNext: () => void;
  onRetry: () => void;
}> = ({ phase, questionIdx, stage, current, loading, error, selected, revealed, sessionCorrect, sessionTotal, onAnswer, onNext, onRetry }) => {
  const limit = phase === 'scene' ? SCENE_QUESTIONS : HARBOR_QUESTIONS;
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-primary">
          {phase === 'scene' ? `SZENE ${questionIdx + 1}/${limit}` : `⚓ HAFENMANÖVER ${questionIdx + 1}/${limit}`}
        </span>
        <span className="text-muted-foreground">{sessionCorrect}/{sessionTotal} ✓</span>
      </div>

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
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(i)}
                  disabled={revealed}
                  className={[
                    'text-left p-3 md:p-4 rounded-lg border transition-all',
                    'flex items-start gap-3',
                    isCorrect ? 'border-green-500/60 bg-green-500/10' :
                    isWrong ? 'border-destructive/60 bg-destructive/10' :
                    isSel ? 'border-primary/60 bg-primary/10' :
                    'border-border/50 bg-card/30 hover:border-primary/40 hover:bg-card/60',
                    revealed ? 'cursor-default' : 'cursor-pointer',
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

const Completed: React.FC<{ stage: Stage; accuracy: number; correct: number; total: number; onContinue: () => void }> = ({ stage, accuracy, correct, total, onContinue }) => {
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
      ({Math.round(state.totalCorrect / Math.max(1, state.totalAnswered) * 100)}%).
    </p>
    <div className="flex flex-wrap gap-2 justify-center">
      {state.patches.map(p => (
        <span key={p} className="text-xs font-mono px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">⚓ {p}</span>
      ))}
    </div>
    <Button onClick={onReset} size="lg"><RotateCcw className="w-4 h-4" />Neue Reise</Button>
  </div>
);

export default Nordstern;
