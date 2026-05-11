import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, Percent, Users, Trophy, Flame, Clock, Star, Zap, Loader2, Compass, Scale, CloudSun, Shuffle, RefreshCcw } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { StaggerReveal } from '@/components/StaggerReveal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMillionaireSound } from '@/hooks/useMillionaireSound';
import { supabase } from '@/integrations/supabase/client';
import { SKS_CATALOG, SKS_TOPIC_LABELS, type SksTopic } from '@/data/sksQuestions';

type Topic = SksTopic | 'mixed';

const TOPIC_LABEL: Record<Topic, string> = {
  ...SKS_TOPIC_LABELS,
  mixed: 'Alle Themen gemischt',
};

function topicPoolSize(t: Topic): number {
  if (t === 'mixed') return SKS_CATALOG.navigation.length + SKS_CATALOG.recht.length + SKS_CATALOG.wetter.length;
  return SKS_CATALOG[t].length;
}

interface AiQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUIZ_SIZE = 10;
const QUESTION_TIME = 45;
const BONUS_TIME_THRESHOLD = 30;
const SAFETY_NETS = [2, 5, 8]; // indices where money is secured
const MONEY_LEVELS = ['50', '100', '200', '500', '1.000', '2.000', '4.000', '8.000', '16.000', '64.000'];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const STORAGE_KEY = 'sks_nav_quiz_best';

const I18N: Record<string, Record<string, string>> = {
  title: { de: 'SKS Navigation Quiz', en: 'SKS Navigation Quiz', fr: 'Quiz SKS Navigation' },
  intro: { de: 'Zehn Fragen aus dem amtlichen SKS-Fragenkatalog Navigation. Vier Antworten. Zwei Joker. Wie weit kommen Sie?', en: 'Ten questions from the official German SKS navigation catalogue. Four answers. Two lifelines. How far will you get?', fr: 'Dix questions du catalogue officiel SKS Navigation. Quatre réponses. Deux jokers. Jusqu\'où irez-vous ?' },
  start: { de: 'Start', en: 'Start', fr: 'Commencer' },
  confirm: { de: 'Finale Antwort', en: 'Final Answer', fr: 'Réponse finale' },
  correct: { de: 'Richtig!', en: 'Correct!', fr: 'Correct !' },
  incorrect: { de: 'Falsch!', en: 'Wrong!', fr: 'Faux !' },
  next: { de: 'Weiter', en: 'Next', fr: 'Suivant' },
  restart: { de: 'Nochmal spielen', en: 'Play again', fr: 'Rejouer' },
  gameOver: { de: 'Leider verloren!', en: 'Game Over!', fr: 'Perdu !' },
  won: { de: 'Gewonnen!', en: 'You Won!', fr: 'Gagné !' },
  secured: { de: 'Gesichert', en: 'Secured', fr: 'Sécurisé' },
  reached: { de: 'Erreicht', en: 'Reached', fr: 'Atteint' },
  safetyNet: { de: 'Sicherheitsnetz erreicht', en: 'Safety net reached', fr: 'Filet de sécurité atteint' },
  audience: { de: 'Publikum', en: 'Audience', fr: 'Public' },
  disclaimer: { de: 'Trainingsquiz auf Basis des amtlichen SKS-Fragenkatalogs Navigation. Ersetzt keine Prüfungsvorbereitung mit anerkanntem Lehrmaterial.', en: 'Training quiz based on the official German SKS navigation catalogue. Not a substitute for accredited exam preparation.', fr: 'Quiz d\'entraînement basé sur le catalogue officiel SKS Navigation. Ne remplace pas une préparation officielle.' },
  loading: { de: 'Frage wird generiert...', en: 'Generating question...', fr: 'Génération de la question...' },
  error: { de: 'Frage konnte nicht geladen werden. Erneut versuchen.', en: 'Failed to load question. Try again.', fr: 'Impossible de charger la question. Réessayer.' },
};

// Leaderboard
interface BoardEntry { score: number; amount: string; date: string; }
const BOARD_KEY = 'sks_nav_quiz_board';
function getSksBoard(): BoardEntry[] {
  try { return JSON.parse(localStorage.getItem(BOARD_KEY) || '[]').slice(0, 5); } catch { return []; }
}
function saveSksBoard(score: number, amount: string) {
  const board = getSksBoard();
  board.push({ score, amount, date: new Date().toLocaleDateString() });
  board.sort((a, b) => b.score - a.score || b.amount.localeCompare(a.amount));
  try { localStorage.setItem(BOARD_KEY, JSON.stringify(board.slice(0, 5))); } catch {}
}

export default function SksNavigationQuiz({ embedded = false }: { embedded?: boolean }) {
  const lang: 'de' = 'de';
  const t = (obj: Record<string, string>) => obj.de;
  const isMobile = useIsMobile();
  const { playQuestionReveal, playCorrect, playWrong, playSelect, playConfirm, playVictory, playDefeat, playTick, playTickUrgent, playMilestone } = useMillionaireSound();

  // ── Topic & random-but-tracked progress ──
  const [topic, setTopic] = useState<Topic | null>(null);
  const seenKey = (tp: Topic) => `sks_quiz_seen_${tp}`;
  const readSeen = (tp: Topic): number[] => {
    try { return JSON.parse(localStorage.getItem(seenKey(tp)) || '[]'); } catch { return []; }
  };
  const writeSeen = (tp: Topic, arr: number[]) => {
    try { localStorage.setItem(seenKey(tp), JSON.stringify(arr)); } catch {}
  };
  // The 10 source indices chosen for the current round
  const roundIndicesRef = useRef<number[]>([]);

  const pickRoundIndices = (tp: Topic): number[] => {
    const pool = topicPoolSize(tp);
    let seen = readSeen(tp);
    // Reset if we've consumed (almost) the whole pool
    if (seen.length + QUIZ_SIZE > pool) seen = [];
    const available: number[] = [];
    for (let i = 0; i < pool; i++) if (!seen.includes(i)) available.push(i);
    // Fisher-Yates shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    const chosen = available.slice(0, QUIZ_SIZE);
    writeSeen(tp, [...seen, ...chosen]);
    return chosen;
  };

  const [started, setStarted] = useState(embedded);
  const [currentQ, setCurrentQ] = useState(0);
  const [question, setQuestion] = useState<AiQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReady, setGameOverReady] = useState(false); // delayed flag for showing results
  const [won, setWon] = useState(false);

  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [audienceUsed, setAudienceUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [audienceResults, setAudienceResults] = useState<Record<number, number> | null>(null);

  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [speedBonuses, setSpeedBonuses] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); } catch { return 0; }
  });
  const [showMilestone, setShowMilestone] = useState(false);
  const [showSpeedBonus, setShowSpeedBonus] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // Fetch question from edge function (random indices, ascending difficulty)
  const fetchQuestion = useCallback(async (questionIndex: number, tp: Topic | null) => {
    if (!tp) return;
    setLoadingQuestion(true);
    setLoadError(false);
    setQuestion(null);
    try {
      const difficulty = questionIndex + 1; // 1-10, aufsteigend
      const sourceIndex = roundIndicesRef.current[questionIndex] ?? Math.floor(Math.random() * topicPoolSize(tp));
      const { data, error } = await supabase.functions.invoke('sks-question', {
        body: { topic: tp === 'mixed' ? undefined : tp, difficulty, sourceIndex },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQuestion(data as AiQuestion);
      setLoadingQuestion(false);
      playQuestionReveal();
    } catch (e) {
      console.error('Failed to fetch SKS question:', e);
      setLoadError(true);
      setLoadingQuestion(false);
    }
  }, [playQuestionReveal]);

  // Fetch first question when game starts
  useEffect(() => {
    if (started && topic && !gameOver && !won && !question && !loadingQuestion) {
      fetchQuestion(currentQ, topic);
    }
  }, [started, topic, currentQ, gameOver, won]);

  // Timer
  useEffect(() => {
    if (!started || gameOver || won || confirmed || loadingQuestion || !question) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 11 && prev > 5) playTick();
        if (prev <= 5) playTickUrgent();
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQ, started, gameOver, won, confirmed, loadingQuestion, question]);

  // Time out
  useEffect(() => {
    if (timeLeft === 0 && started && !gameOver && !won && !confirmed && question) {
      setGameOver(true);
      const newBest = Math.max(bestScore, score);
      setBestScore(newBest);
      try { localStorage.setItem(STORAGE_KEY, String(newBest)); } catch {}
      setTimeout(() => playDefeat(), 300);
    }
  }, [timeLeft, started, gameOver, won, confirmed, question]);

  // Delay game-over screen to let the defeat melody play
  useEffect(() => {
    if (gameOver && !gameOverReady) {
      const timer = setTimeout(() => setGameOverReady(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [gameOver, gameOverReady]);

  const handleSelect = (idx: number) => {
    if (confirmed || timeLeft === 0 || !question) return;
    playSelect();
    setSelected(String(idx));
  };

  const handleConfirm = () => {
    if (selected === null || confirmed || !question) return;
    playConfirm();
    setConfirmed(true);
    const isCorrect = parseInt(selected) === question.correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore(currentQ + 1);
      if (timeLeft >= BONUS_TIME_THRESHOLD) {
        setSpeedBonuses(s => s + 1);
        setShowSpeedBonus(true);
        setTimeout(() => setShowSpeedBonus(false), 1500);
      }
      if (SAFETY_NETS.includes(currentQ)) {
        setShowMilestone(true);
        setTimeout(() => playMilestone(), 500);
        setTimeout(() => setShowMilestone(false), 2500);
      }
      if (currentQ === QUIZ_SIZE - 1) {
        setWon(true);
        const newBest = Math.max(bestScore, QUIZ_SIZE);
        setBestScore(newBest);
        try { localStorage.setItem(STORAGE_KEY, String(newBest)); } catch {}
        saveSksBoard(QUIZ_SIZE, '64.000');
        setTimeout(() => playVictory(), 300);
      } else {
        setTimeout(() => playCorrect(), 400);
      }
    } else {
      setStreak(0);
      setGameOver(true);
      const newBest = Math.max(bestScore, score);
      setBestScore(newBest);
      try { localStorage.setItem(STORAGE_KEY, String(newBest)); } catch {}
      const secLevel = SAFETY_NETS.filter(idx => idx < currentQ).reverse()[0];
      const secAmount = secLevel !== undefined ? MONEY_LEVELS[secLevel] : '0';
      saveSksBoard(score, secAmount);
      setTimeout(() => playDefeat(), 300);
    }
  };

  const handleNext = () => {
    const nextQ = currentQ + 1;
    setCurrentQ(nextQ);
    setSelected(null);
    setConfirmed(false);
    setHiddenOptions([]);
    setAudienceResults(null);
    setShowSpeedBonus(false);
    setQuestion(null);
    fetchQuestion(nextQ, topic);
  };

  const useFiftyFifty = useCallback(() => {
    if (fiftyFiftyUsed || confirmed || !question) return;
    setFiftyFiftyUsed(true);
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== question.correct);
    // Shuffle and pick 2
    for (let i = wrongIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
    }
    const toHide = wrongIndices.slice(0, 2);
    setHiddenOptions(toHide);
    if (selected !== null && toHide.includes(parseInt(selected))) {
      setSelected(null);
    }
  }, [fiftyFiftyUsed, confirmed, question, selected]);

  const useAudience = useCallback(() => {
    if (audienceUsed || confirmed || !question) return;
    setAudienceUsed(true);
    const correctPct = 45 + Math.floor(Math.random() * 30);
    const remaining = 100 - correctPct;
    const others = [0, 1, 2, 3].filter(i => i !== question.correct && !hiddenOptions.includes(i));
    const results: Record<number, number> = {};
    results[question.correct] = correctPct;
    let left = remaining;
    others.forEach((idx, i) => {
      if (i === others.length - 1) {
        results[idx] = left;
      } else {
        const pct = Math.floor(Math.random() * left * 0.7);
        results[idx] = pct;
        left -= pct;
      }
    });
    hiddenOptions.forEach(h => { results[h] = 0; });
    setAudienceResults(results);
  }, [audienceUsed, confirmed, question, hiddenOptions]);

  const restart = (newRound: boolean) => {
    if (topic && newRound) {
      roundIndicesRef.current = pickRoundIndices(topic);
    }
    setStarted(embedded);
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setGameOver(false);
    setGameOverReady(false);
    setWon(false);
    setFiftyFiftyUsed(false);
    setAudienceUsed(false);
    setHiddenOptions([]);
    setAudienceResults(null);
    setStreak(0);
    setSpeedBonuses(0);
    setTimeLeft(QUESTION_TIME);
    setQuestion(null);
    setLoadError(false);
  };

  const chooseTopic = (tp: Topic) => {
    setTopic(tp);
    roundIndicesRef.current = pickRoundIndices(tp);
    setStarted(true);
  };

  const resetTopicProgress = () => {
    if (!topic) return;
    writeSeen(topic, []);
    roundIndicesRef.current = pickRoundIndices(topic);
    restart(false);
  };

  const getSecuredLevel = () => {
    for (let i = SAFETY_NETS.length - 1; i >= 0; i--) {
      if (score > SAFETY_NETS[i]) return SAFETY_NETS[i];
    }
    return -1;
  };

  const progressPct = ((currentQ) / QUIZ_SIZE) * 100;
  const timerPct = (timeLeft / QUESTION_TIME) * 100;
  const timerUrgent = timeLeft <= 10;
  const timerCritical = timeLeft <= 5;

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 max-w-4xl mx-auto bg-transparent';
  const diamondClip = 'polygon(4% 50%, 7% 0%, 93% 0%, 96% 50%, 93% 100%, 7% 100%)';

  // ── Entry screen: topic picker ──
  if (!started || !topic) {
    const topics: { id: Topic; label: string; sub: string; Icon: typeof Compass }[] = [
      { id: 'navigation', label: 'Navigation', sub: `${SKS_CATALOG.navigation.length} Fragen`, Icon: Compass },
      { id: 'recht', label: 'Schifffahrtsrecht', sub: `${SKS_CATALOG.recht.length} Fragen`, Icon: Scale },
      { id: 'wetter', label: 'Wetterkunde', sub: `${SKS_CATALOG.wetter.length} Fragen`, Icon: CloudSun },
      { id: 'mixed', label: 'Alle Themen gemischt', sub: `${topicPoolSize('mixed')} Fragen`, Icon: Shuffle },
    ];
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="SKS Quiz" description="SKS Quiz – Wer wird Skipper?" />
        <div className="text-center space-y-8 max-w-xl relative">
          <div className="absolute inset-0 -top-20 bg-[radial-gradient(ellipse_at_center,hsl(45_100%_48%/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent rounded-full animate-pulse" />
            <div className="absolute inset-3 rotate-45 border-2 border-primary/60 bg-gradient-to-br from-primary/20 to-card flex items-center justify-center shadow-[0_0_40px_hsl(45_100%_48%/0.3)]">
              <span className="text-3xl -rotate-45">🧭</span>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-mono tracking-widest uppercase">SKS</h1>
            <p className="text-lg text-foreground/70 font-mono tracking-wide">Wer wird Skipper?</p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </div>
          <p className="text-foreground/60 text-sm leading-relaxed max-w-md mx-auto">
            Zehn Fragen aus dem amtlichen SKS-Fragenkatalog. Vier Antworten, zwei Joker. Themenbereich wählen — die Fragen werden systematisch durchgegangen und Ihr Fortschritt bleibt gespeichert.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
            {topics.map(({ id, label, sub, Icon }) => {
              const cursor = readSeen(id).length;
              const pool = topicPoolSize(id);
              return (
                <button key={id} onClick={() => chooseTopic(id)}
                  className="group relative p-4 rounded-xl border border-primary/30 bg-card/60 hover:bg-primary/10 hover:border-primary/60 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-mono font-bold text-sm tracking-wider">{label}</p>
                      <p className="text-muted-foreground text-[11px] font-mono">{sub} · Gesehen {cursor}/{pool}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> <span className="font-mono">{QUESTION_TIME}s</span></span>
            <span className="flex items-center gap-1.5"><Flame size={12} className="text-primary/60" /> Streak</span>
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-primary/60" /> Speed</span>
          </div>
          <p className="text-muted-foreground text-[10px] italic max-w-sm mx-auto">{t(I18N.disclaimer)}</p>
        </div>
      </div>
    );
  }

  // ── Game Over / Won ──
  if (gameOverReady || won) {
    const securedLevel = getSecuredLevel();
    const finalLevel = won ? QUIZ_SIZE - 1 : (securedLevel >= 0 ? securedLevel : -1);
    const finalAmount = finalLevel >= 0 ? MONEY_LEVELS[finalLevel] : '0';
    const isNewBest = score > (bestScore - (won ? 0 : 1));
    const timeRanOut = timeLeft === 0 && selected === null;

    return (
      <div className={wrapperClass}>
        <PageMeta title="SKS Navigation Quiz" description="SKS Navigation Quiz" />
        <div className="text-center mb-6">
          <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono tracking-widest uppercase`}>
            <Typewriter text={t(I18N.title)} charDelay={8} />
          </h1>
        </div>
        <StaggerReveal stagger={400}>
          <div className={`relative rounded-2xl p-8 text-center overflow-hidden border ${won ? 'border-primary/40' : 'border-destructive/40'}`}>
            <div className={`absolute inset-0 ${won ? 'bg-[radial-gradient(ellipse_at_center,hsl(45_100%_48%/0.1)_0%,transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,hsl(0_84%_60%/0.08)_0%,transparent_70%)]'}`} />
            {won && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-primary rounded-full animate-ping" style={{ left: `${5 + (i * 5) % 90}%`, top: `${10 + (i * 11) % 80}%`, animationDelay: `${i * 0.15}s`, animationDuration: `${1 + (i % 4) * 0.4}s` }} />
                ))}
              </div>
            )}
            <div className="relative z-10">
              <div className="text-5xl mb-4">{won ? '🏆' : (timeRanOut ? '⏰' : '💔')}</div>
              <h2 className={`text-2xl md:text-3xl font-bold font-mono tracking-wider ${won ? 'text-primary' : 'text-destructive'}`}>
                {won ? t(I18N.won) : (timeRanOut ? t({ de: 'Zeit abgelaufen!', en: 'Time\'s up!', fr: 'Temps écoulé !' }) : t(I18N.gameOver))}
              </h2>
              <div className="mt-6 space-y-2">
                <p className="text-foreground/40 text-xs uppercase tracking-[0.2em] font-mono">{won ? t(I18N.reached) : t(I18N.secured)}</p>
                <p className="text-4xl md:text-5xl font-mono font-black text-primary drop-shadow-[0_0_20px_hsl(45_100%_48%/0.4)]">€ {won ? '64.000' : finalAmount}</p>
                {!won && <p className="text-foreground/40 text-xs font-mono">{t(I18N.reached)}: € {MONEY_LEVELS[currentQ]} · {t(I18N.secured)}: € {finalAmount}</p>}
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs">
                <span className="flex items-center gap-1.5 text-primary"><CheckCircle2 size={14} /> <span className="font-mono font-bold">{score}/{QUIZ_SIZE}</span></span>
                {speedBonuses > 0 && <span className="flex items-center gap-1.5 text-highlight"><Zap size={14} /> <span className="font-mono font-bold">{speedBonuses}x</span></span>}
                {isNewBest && score > 0 && <span className="flex items-center gap-1.5 text-primary animate-pulse"><Star size={14} className="fill-primary" /> {t({ de: 'Neuer Rekord!', en: 'New record!', fr: 'Nouveau record !' })}</span>}
              </div>
            </div>
          </div>
          {!won && !timeRanOut && question && (
            <div className="bg-card/80 border border-border rounded-xl p-5">
              <p className="text-foreground/50 text-xs mb-3 font-mono">{question.question}</p>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-foreground/70 text-sm leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          )}
          {/* ── TOP 5 LEADERBOARD ── */}
          {(() => {
            const board = getSksBoard();
            if (board.length === 0) return null;
            return (
              <div className="bg-card/60 border border-primary/20 rounded-xl p-4">
                <h3 className="text-center font-mono font-bold text-xs text-primary/80 tracking-[0.2em] mb-3">─── TOP 5 ───</h3>
                <div className="space-y-1.5">
                  {board.map((e, i) => {
                    const isCurrentRun = e.score === score && e.date === new Date().toLocaleDateString();
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
                    return (
                      <div key={i} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${isCurrentRun ? 'bg-primary/10 text-primary' : i === 0 ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                        <span>{medal} {e.score}/{QUIZ_SIZE}</span>
                        <span>€ {e.amount}</span>
                        <span className="text-[10px]">{e.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-xs">
              {won ? t({ de: 'Kannst du es nochmal schaffen?', en: 'Can you do it again?', fr: 'Pouvez-vous recommencer ?' })
                : t({ de: 'Jede Runde generiert neue Fragen – versuchen Sie es erneut.', en: 'Every round generates new questions – try again.', fr: 'Chaque tour génère de nouvelles questions – réessayez.' })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => restart(true)} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 font-mono font-bold tracking-wider">
                <RotateCcw className="w-4 h-4 mr-2" /> Weiter im Themenblock
              </Button>
              <Button onClick={() => { setTopic(null); restart(false); }} variant="ghost" className="text-muted-foreground hover:text-primary font-mono text-xs">
                Thema wechseln
              </Button>
              <Button onClick={resetTopicProgress} variant="ghost" className="text-muted-foreground hover:text-destructive font-mono text-xs">
                <RefreshCcw className="w-3 h-3 mr-1" /> Fortschritt zurücksetzen
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-xs text-center italic">{t(I18N.disclaimer)}</p>
        </StaggerReveal>
      </div>
    );
  }

  // ── Loading question ──
  if (loadingQuestion || !question) {
    return (
      <div className={wrapperClass}>
        <PageMeta title="SKS Navigation Quiz" description="SKS Navigation Quiz" />
        <div className="flex flex-col items-center justify-center gap-6 py-20">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(45_100%_48%/0.1)_0%,transparent_70%)]" />
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-primary font-mono font-bold text-sm">{t(I18N.loading)}</p>
            <p className="text-muted-foreground text-xs font-mono">
              {t({ de: `Schwierigkeit: ${currentQ + 1}/10`, en: `Difficulty: ${currentQ + 1}/10`, fr: `Difficulté : ${currentQ + 1}/10` })}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= currentQ ? 'bg-primary' : 'bg-muted/30'}`} />
              ))}
            </div>
          </div>
          {loadError && (
            <div className="text-center space-y-3">
              <p className="text-destructive text-sm">{t(I18N.error)}</p>
              <Button onClick={() => fetchQuestion(currentQ, topic)} variant="outline" className="border-primary/40 text-primary">
                <RotateCcw className="w-4 h-4 mr-2" /> {t({ de: 'Erneut versuchen', en: 'Retry', fr: 'Réessayer' })}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active game ──
  const isCorrect = confirmed && selected !== null && parseInt(selected) === question.correct;
  const isWrong = confirmed && selected !== null && parseInt(selected) !== question.correct;
  const showLadder = !isMobile;

  return (
    <div className={wrapperClass}>
      <PageMeta title="SKS Navigation Quiz" description="SKS Navigation Quiz" />

      {/* Top HUD */}
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className={`${embedded ? 'text-base' : 'text-lg md:text-2xl'} font-bold text-primary font-mono tracking-widest uppercase truncate`}>
              <Typewriter text={t(I18N.title)} charDelay={8} />
            </h1>
            <p className="text-[10px] md:text-xs font-mono text-muted-foreground/70 tracking-wider truncate">
              {TOPIC_LABEL[topic]} · Block {Math.floor(startIndexRef.current / QUIZ_SIZE) + 1} von {Math.ceil(topicPoolSize(topic) / QUIZ_SIZE)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {streak > 1 && (
              <div className="flex items-center gap-1 text-primary text-sm font-bold animate-pulse font-mono">
                <Flame size={16} className={streak >= 5 ? 'text-destructive' : ''} />
                <span>{streak}x</span>
              </div>
            )}
            <button onClick={() => { setTopic(null); restart(false); }} className="text-muted-foreground hover:text-primary text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-border/40 hover:border-primary/40 transition-colors">
              Thema
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          {SAFETY_NETS.map(idx => (
            <div key={idx} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-primary shadow-[0_0_6px_hsl(45_100%_48%/0.5)]" style={{ left: `${((idx + 1) / QUIZ_SIZE) * 100}%` }} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative h-1 bg-muted/15 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerCritical ? 'bg-destructive animate-pulse' : timerUrgent ? 'bg-primary' : 'bg-highlight/40'}`} style={{ width: `${timerPct}%` }} />
          </div>
          <span className={`font-mono text-xs tabular-nums min-w-[2.5rem] text-right ${timerCritical ? 'text-destructive font-bold animate-pulse' : timerUrgent ? 'text-primary' : 'text-muted-foreground'}`}>
            <Clock size={10} className="inline mr-1" />{timeLeft}s
          </span>
          <span className="font-mono text-xs text-muted-foreground/60">{currentQ + 1}/{QUIZ_SIZE}</span>
        </div>
      </div>

      {/* Milestone */}
      {showMilestone && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-card/95 border-2 border-primary rounded-2xl p-8 text-center animate-bounce shadow-[0_0_60px_hsl(45_100%_48%/0.3)]">
            <Trophy className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-primary font-bold text-xl font-mono">€ {MONEY_LEVELS[currentQ]}</p>
            <p className="text-primary/60 text-xs mt-1 uppercase tracking-widest">{t(I18N.safetyNet)}</p>
          </div>
        </div>
      )}

      {/* Speed bonus */}
      {showSpeedBonus && (
        <div className="fixed top-20 right-4 z-50 pointer-events-none">
          <div className="bg-highlight/20 border border-highlight/40 rounded-lg px-4 py-2 flex items-center gap-2 animate-bounce shadow-[0_0_20px_hsl(187_100%_42%/0.2)]">
            <Zap size={16} className="text-highlight" />
            <span className="text-highlight font-mono text-sm font-bold">Speed Bonus!</span>
          </div>
        </div>
      )}

      <div className={`flex gap-5 ${showLadder ? '' : 'flex-col'}`}>
        <div className="flex-1 min-w-0 space-y-4">
          <StaggerReveal key={`question-${currentQ}`} stagger={120}>
            {/* Jokers */}
            <div className="flex items-center gap-2">
              <button onClick={useFiftyFifty} disabled={fiftyFiftyUsed || confirmed}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-mono text-xs transition-all duration-300 ${fiftyFiftyUsed ? 'border-muted/20 text-muted-foreground/30 cursor-not-allowed line-through opacity-40' : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_12px_hsl(45_100%_48%/0.15)]'}`}>
                <Percent size={14} /> 50:50
              </button>
              <button onClick={useAudience} disabled={audienceUsed || confirmed}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-mono text-xs transition-all duration-300 ${audienceUsed ? 'border-muted/20 text-muted-foreground/30 cursor-not-allowed line-through opacity-40' : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_12px_hsl(45_100%_48%/0.15)]'}`}>
                <Users size={14} /> {t(I18N.audience)}
              </button>
              <span className="ml-auto text-muted-foreground/40 font-mono text-[10px]">⚡ {currentQ + 1}/10</span>
              {!showLadder && <span className="text-primary font-mono text-sm font-bold drop-shadow-[0_0_8px_hsl(45_100%_48%/0.3)]">€ {MONEY_LEVELS[currentQ]}</span>}
            </div>

            {/* Question panel */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-2xl" />
              <div className="relative bg-gradient-to-b from-secondary via-card to-secondary rounded-2xl p-4 md:p-6 border border-primary/20">
                <p className="text-foreground text-sm md:text-base leading-relaxed text-center font-medium">{question.question}</p>
              </div>
            </div>

            {/* Answer options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options.map((opt, i) => {
                const isHidden = hiddenOptions.includes(i);
                const isThis = selected === String(i);
                const isAnswer = i === question.correct;
                const padClass = 'px-5 sm:px-8 py-2.5 sm:py-3';

                if (isHidden) {
                  return (
                    <div key={i} className={`relative ${padClass} text-sm opacity-15`} style={{ clipPath: diamondClip }}>
                      <div className="absolute inset-0 bg-muted/20" style={{ clipPath: diamondClip }} />
                      <span className="relative font-mono font-bold mr-2 text-muted-foreground">{OPTION_LETTERS[i]}:</span>
                      <span className="relative line-through text-muted-foreground break-words">{opt}</span>
                    </div>
                  );
                }

                let outerGradient = 'from-primary/20 via-primary/40 to-primary/20';
                let innerBg = 'from-secondary via-card to-secondary';
                let textClass = 'text-foreground/80';
                let glowClass = '';

                if (isThis && !confirmed) {
                  outerGradient = 'from-primary/50 via-primary/80 to-primary/50';
                  innerBg = 'from-primary/20 via-primary/10 to-primary/20';
                  textClass = 'text-primary';
                  glowClass = 'shadow-[0_0_20px_hsl(45_100%_48%/0.2)]';
                }
                if (confirmed) {
                  if (isAnswer) {
                    outerGradient = 'from-success/50 via-success/80 to-success/50';
                    innerBg = 'from-success/15 via-success/10 to-success/15';
                    textClass = 'text-success';
                    glowClass = 'shadow-[0_0_20px_hsl(142_71%_45%/0.2)]';
                  } else if (isThis && !isCorrect) {
                    outerGradient = 'from-destructive/50 via-destructive/80 to-destructive/50';
                    innerBg = 'from-destructive/15 via-destructive/10 to-destructive/15';
                    textClass = 'text-destructive';
                    glowClass = 'shadow-[0_0_20px_hsl(0_84%_60%/0.2)]';
                  } else {
                    outerGradient = 'from-muted/20 via-muted/30 to-muted/20';
                    innerBg = 'from-muted/10 via-card to-muted/10';
                    textClass = 'text-muted-foreground/40';
                  }
                }

                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={confirmed}
                    className={`relative text-left transition-all duration-300 active:scale-[0.98] disabled:cursor-default ${glowClass} group`}
                    style={{ clipPath: diamondClip }}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${outerGradient}`} style={{ clipPath: diamondClip }} />
                    <div className={`absolute inset-[1px] bg-gradient-to-b ${innerBg}`} style={{ clipPath: diamondClip }} />
                    <div className={`relative ${padClass} text-sm ${textClass} break-words`}>
                      <span className="font-mono font-bold mr-2 text-primary/80 flex-shrink-0">{OPTION_LETTERS[i]}:</span>
                      {opt}
                    </div>
                    {!confirmed && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: diamondClip }} />}
                  </button>
                );
              })}
            </div>
          </StaggerReveal>

          {/* Audience results */}
          {audienceResults && (
            <div className="bg-card/80 border border-primary/20 rounded-xl p-4 animate-fade-in">
              <p className="text-primary text-xs mb-2 uppercase tracking-[0.15em] font-mono">{t(I18N.audience)}</p>
              <div className="flex items-end gap-3 h-20">
                {question.options.map((_, i) => {
                  const pct = audienceResults[i] || 0;
                  if (hiddenOptions.includes(i)) return null;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-foreground/50 font-mono text-[10px]">{pct}%</span>
                      <div className="w-full bg-muted/20 rounded-sm overflow-hidden" style={{ height: '48px' }}>
                        <div className="w-full bg-gradient-to-t from-primary/60 to-primary/30 rounded-sm transition-all duration-700" style={{ height: `${pct * 0.48}px`, marginTop: `${48 - pct * 0.48}px` }} />
                      </div>
                      <span className="text-primary font-mono text-xs font-bold">{OPTION_LETTERS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm */}
          {selected !== null && !confirmed && (
            <div className="flex items-center justify-center animate-fade-in">
              <button onClick={handleConfirm} className="relative group px-8 py-3" style={{ clipPath: diamondClip }}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 animate-pulse group-hover:animate-none group-hover:from-primary/60 group-hover:via-primary group-hover:to-primary/60 transition-all" style={{ clipPath: diamondClip }} />
                <div className="absolute inset-[1px] bg-gradient-to-b from-card via-secondary to-card" style={{ clipPath: diamondClip }} />
                <span className="relative text-primary font-mono font-bold tracking-wider uppercase text-sm group-hover:text-foreground transition-colors">{t(I18N.confirm)}</span>
              </button>
            </div>
          )}

          {/* Explanation */}
          {confirmed && (
            <StaggerReveal stagger={100}>
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                {isCorrect ? <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />}
                <div>
                  <p className={`text-sm font-bold mb-1 font-mono ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                    {isCorrect ? t(I18N.correct) : t(I18N.incorrect)}
                    {isCorrect && streak > 1 && <span className="ml-2 text-primary text-xs">🔥 {streak}x Streak!</span>}
                  </p>
                  <p className="text-foreground/70 text-sm leading-relaxed">{question.explanation}</p>
                </div>
              </div>
              {isCorrect && !won && (
                <div className="flex justify-end">
                  <button onClick={handleNext} className="relative group px-6 py-2.5" style={{ clipPath: diamondClip }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-highlight/30 via-highlight/50 to-highlight/30 group-hover:from-highlight/50 group-hover:via-highlight/70 group-hover:to-highlight/50 transition-all" style={{ clipPath: diamondClip }} />
                    <div className="absolute inset-[1px] bg-gradient-to-b from-card via-secondary to-card" style={{ clipPath: diamondClip }} />
                    <span className="relative flex items-center gap-2 text-highlight font-mono font-bold text-sm group-hover:text-foreground transition-colors">
                      {t(I18N.next)} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              )}
            </StaggerReveal>
          )}
        </div>

        {/* Money Ladder */}
        {showLadder && (
          <div className="w-40 flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-gradient-to-b from-card via-secondary/50 to-card rounded-xl border border-primary/10 p-2 space-y-0">
                {[...MONEY_LEVELS].reverse().map((level, reverseIdx) => {
                  const idx = MONEY_LEVELS.length - 1 - reverseIdx;
                  const isCurrent = idx === currentQ;
                  const isPassed = idx < score;
                  const isSafetyNet = SAFETY_NETS.includes(idx);
                  const isReached = idx <= currentQ;

                  let textColor = 'text-foreground/20';
                  let bg = '';
                  let borderStyle = 'border-transparent';
                  let glow = '';

                  if (isCurrent && !gameOver) {
                    textColor = 'text-primary';
                    bg = 'bg-primary/10';
                    borderStyle = 'border-primary/40';
                    glow = 'shadow-[0_0_12px_hsl(45_100%_48%/0.15)]';
                  } else if (isPassed) {
                    textColor = 'text-success/70';
                    bg = 'bg-success/5';
                  } else if (isSafetyNet) {
                    textColor = isReached ? 'text-primary/80' : 'text-primary/40';
                  }

                  return (
                    <div key={level} className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-xs font-mono transition-all duration-500 ${textColor} ${bg} ${borderStyle} ${glow} ${isCurrent ? 'scale-105 font-bold' : ''}`}>
                      <span className="text-[10px] opacity-40 w-4">{idx + 1}</span>
                      <span className={isSafetyNet ? 'font-black' : 'font-semibold'}>€ {level}</span>
                      {isSafetyNet && <Trophy size={10} className="text-primary/50" />}
                      {!isSafetyNet && <span className="w-[10px]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
