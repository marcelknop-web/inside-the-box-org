import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RotateCcw, CheckCircle2, XCircle, Zap, Trophy, Target, ArrowRight, Shield, Flame, Star } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface ThreatDropQuestion {
  id: string;
  threat_title: string;
  context: string;
  options: string[];
  correct: number;
  rationale: string;
  domain_tags: string[];
  difficulty: number;
  primary_skill: string;
  confidence: number;
}

const labels: Record<string, Record<string, string>> = {
  de: {
    title: 'ThreatDrop',
    subtitle: 'Experten-Quiz für ISMS- und Cybersecurity-Profis.',
    loading: 'Frage wird generiert…',
    error: 'Fehler beim Laden. Bitte erneut versuchen.',
    retry: 'Erneut versuchen',
    next: 'Nächste Frage',
    restart: 'Neues Spiel',
    correct: 'Richtig!',
    wrong: 'Leider falsch.',
    rationale: 'Begründung',
    score: 'Score',
    streak: 'Serie',
    question: 'Frage',
    difficulty: 'Level',
    selectAnswer: 'Wählen Sie eine Antwort.',
    gameIntro: 'Testen Sie Ihr Wissen auf SOC-Lead- und CISO-Niveau. Jede Frage wird in Echtzeit von KI generiert.',
    start: 'Quiz starten',
    context: 'Kontext',
    perfect: 'Perfekt!',
    goodJob: 'Gut gemacht!',
    keepGoing: 'Weiter so!',
  },
  en: {
    title: 'ThreatDrop',
    subtitle: 'Expert quiz for ISMS and cybersecurity professionals.',
    loading: 'Generating question…',
    error: 'Failed to load. Please try again.',
    retry: 'Try again',
    next: 'Next question',
    restart: 'New game',
    correct: 'Correct!',
    wrong: 'Incorrect.',
    rationale: 'Rationale',
    score: 'Score',
    streak: 'Streak',
    question: 'Question',
    difficulty: 'Level',
    selectAnswer: 'Select an answer.',
    gameIntro: 'Test your knowledge at SOC Lead and CISO level. Each question is AI-generated in real-time.',
    start: 'Start Quiz',
    context: 'Context',
    perfect: 'Perfect!',
    goodJob: 'Well done!',
    keepGoing: 'Keep going!',
  },
  fr: {
    title: 'ThreatDrop',
    subtitle: 'Quiz expert pour professionnels SMSI et cybersécurité.',
    loading: 'Génération de la question…',
    error: 'Échec du chargement. Veuillez réessayer.',
    retry: 'Réessayer',
    next: 'Question suivante',
    restart: 'Nouveau jeu',
    correct: 'Correct !',
    wrong: 'Incorrect.',
    rationale: 'Explication',
    score: 'Score',
    streak: 'Série',
    question: 'Question',
    difficulty: 'Niveau',
    selectAnswer: 'Sélectionnez une réponse.',
    gameIntro: 'Testez vos connaissances au niveau SOC Lead et CISO. Chaque question est générée en temps réel par IA.',
    start: 'Démarrer le quiz',
    context: 'Contexte',
    perfect: 'Parfait !',
    goodJob: 'Bien joué !',
    keepGoing: 'Continuez !',
  },
};

/* ── Score Ring SVG ── */
const ScoreRing = ({ score, total }: { score: number; total: number }) => {
  const pct = total === 0 ? 0 : score / total;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" className="absolute">
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        <motion.circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="hsl(var(--highlight))"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="text-highlight font-mono font-bold text-lg z-10">{score}</span>
    </div>
  );
};

/* ── Difficulty dots ── */
const DifficultyDots = ({ level }: { level: number }) => (
  <div className="flex gap-1 items-center">
    {[1, 2, 3, 4, 5].map(i => (
      <motion.div
        key={i}
        className={`w-2 h-2 rounded-full ${i <= level ? 'bg-primary' : 'bg-muted'}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.05 }}
      />
    ))}
  </div>
);

const optionLetters = ['A', 'B', 'C', 'D'];

const ThreatDropQuiz = ({ embedded }: { embedded?: boolean }) => {
  const { language } = useLanguage();
  const t = (key: string) => labels[language]?.[key] ?? labels.en[key] ?? key;

  const [phase, setPhase] = useState<'intro' | 'loading' | 'question' | 'answered' | 'error'>('intro');
  const [question, setQuestion] = useState<ThreatDropQuestion | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchQuestion = useCallback(async () => {
    setPhase('loading');
    setQuestion(null);
    setSelectedIdx(null);
    try {
      const { data, error } = await supabase.functions.invoke('threatdrop-question', {
        body: { language, usedIds },
      });
      if (error || data?.error) { setPhase('error'); return; }
      setQuestion(data as ThreatDropQuestion);
      setUsedIds(prev => [...prev, data.id]);
      setPhase('question');
    } catch {
      setPhase('error');
    }
  }, [language, usedIds]);

  const handleAnswer = (idx: number) => {
    if (phase !== 'question' || !question) return;
    setSelectedIdx(idx);
    setTotalAnswered(prev => prev + 1);
    if (idx === question.correct) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
    setPhase('answered');
  };

  useEffect(() => {
    if (phase === 'answered' && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
  }, [phase]);

  const handleRestart = () => {
    setScore(0);
    setStreak(0);
    setTotalAnswered(0);
    setUsedIds([]);
    setPhase('intro');
  };

  const isCorrect = selectedIdx === question?.correct;

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-background'} p-4 md:p-6 max-w-3xl mx-auto`}>
      {!embedded && <PageMeta title="ThreatDrop" description="Expert Cybersecurity Quiz" />}

      {/* ── Header with Score ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Shield className="text-highlight w-7 h-7" />
          </motion.div>
          <div>
            <h1 className="text-highlight font-mono font-bold text-xl leading-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-xs font-sans">{t('subtitle')}</p>
          </div>
        </div>

        {totalAnswered > 0 && (
          <div className="flex items-center gap-3">
            {streak >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/30"
              >
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-primary font-mono font-bold text-sm">{streak}×</span>
              </motion.div>
            )}
            <ScoreRing score={score} total={totalAnswered} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="relative rounded-2xl overflow-hidden border border-highlight/20 bg-gradient-to-br from-highlight/5 via-card to-primary/5 p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-highlight/5 via-transparent to-primary/5"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <Shield className="w-16 h-16 text-highlight mx-auto mb-4" />
              </motion.div>
              <p className="text-foreground text-sm font-sans leading-relaxed max-w-md mx-auto relative z-10">
                {t('gameIntro')}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchQuestion}
              className="w-full py-3.5 rounded-xl bg-highlight text-highlight-foreground font-mono font-bold text-sm flex items-center justify-center gap-2 hover:bg-highlight/90 transition-colors"
            >
              <Zap className="w-5 h-5" />
              {t('start')}
            </motion.button>
          </motion.div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-5"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-2 border-highlight/20 border-t-highlight"
              />
              <Shield className="w-6 h-6 text-highlight absolute inset-0 m-auto" />
            </div>
            <p className="text-muted-foreground text-sm font-mono">{t('loading')}</p>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl p-6 bg-destructive/10 border border-destructive/20 text-center">
              <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-destructive text-sm font-sans">{t('error')}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchQuestion}
              className="w-full py-3 rounded-xl border border-border bg-secondary text-foreground font-mono text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t('retry')}
            </motion.button>
          </motion.div>
        )}

        {/* ── QUESTION / ANSWERED ── */}
        {(phase === 'question' || phase === 'answered') && question && (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            {/* Question number + difficulty */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-mono">
                {t('question')} #{totalAnswered + (phase === 'question' ? 1 : 0)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] font-mono uppercase">{t('difficulty')}</span>
                <DifficultyDots level={question.difficulty} />
              </div>
            </div>

            {/* Question card */}
            <div className="rounded-2xl border border-highlight/20 bg-card overflow-hidden">
              {/* Domain tags strip */}
              <div className="flex gap-1.5 px-4 pt-3 pb-2 flex-wrap">
                {question.domain_tags.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-highlight/10 text-highlight border border-highlight/20"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>

              {/* Title + Context */}
              <div className="px-4 pb-4">
                <div className="flex items-start gap-2 mb-2">
                  <Target className="w-4 h-4 text-highlight mt-1 flex-shrink-0" />
                  <h2 className="text-foreground font-mono font-bold text-sm leading-snug">{question.threat_title}</h2>
                </div>
                {question.context && (
                  <p className="text-muted-foreground text-sm font-sans leading-relaxed pl-6">{question.context}</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrectOpt = idx === question.correct;
                const isAnswered = phase === 'answered';

                let borderClass = 'border-border/60 hover:border-highlight/40';
                let bgClass = 'bg-card hover:bg-highlight/5';
                let textClass = 'text-muted-foreground';

                if (isAnswered) {
                  if (isCorrectOpt) {
                    borderClass = 'border-green-500/50';
                    bgClass = 'bg-green-500/10';
                    textClass = 'text-green-400';
                  } else if (isSelected) {
                    borderClass = 'border-destructive/50';
                    bgClass = 'bg-destructive/10';
                    textClass = 'text-destructive';
                  } else {
                    borderClass = 'border-border/30';
                    bgClass = 'bg-card/50 opacity-50';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    whileHover={!isAnswered ? { scale: 1.01, x: 4 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                    onClick={() => !isAnswered && handleAnswer(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors ${borderClass} ${bgClass} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`font-mono font-bold text-sm mt-0.5 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                        isAnswered && isCorrectOpt ? 'bg-green-500/20 text-green-400' :
                        isAnswered && isSelected ? 'bg-destructive/20 text-destructive' :
                        'bg-highlight/10 text-highlight'
                      }`}>
                        {optionLetters[idx]}
                      </span>
                      <span className="text-foreground text-sm font-sans leading-relaxed flex-1">{opt.replace(/^[A-D]\s+/, '')}</span>
                      {isAnswered && isCorrectOpt && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        </motion.div>
                      )}
                      {isAnswered && isSelected && !isCorrectOpt && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                          <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* ── Result + Rationale ── */}
            {phase === 'answered' && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                {/* Feedback banner */}
                <div className={`rounded-2xl p-5 border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {isCorrect ? (
                      <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Star className="w-5 h-5 text-green-400" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                      </motion.div>
                    )}
                    <div>
                      <p className={`font-mono font-bold text-sm ${isCorrect ? 'text-green-400' : 'text-destructive'}`}>
                        {isCorrect ? t('correct') : t('wrong')}
                      </p>
                      {isCorrect && streak >= 3 && (
                        <p className="text-primary text-xs font-mono flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {streak}× {t('streak')}!
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-foreground/80 text-sm font-sans leading-relaxed">{question.rationale}</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fetchQuestion}
                    className="flex-1 py-3 rounded-xl bg-highlight text-highlight-foreground font-mono font-bold text-sm flex items-center justify-center gap-2 hover:bg-highlight/90 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {t('next')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRestart}
                    className="px-4 py-3 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreatDropQuiz;
