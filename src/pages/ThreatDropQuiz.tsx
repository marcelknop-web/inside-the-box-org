import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, CheckCircle2, XCircle, Zap, Trophy, Target, Clock, ArrowRight, Shield } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

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
    wrong: 'Falsch.',
    rationale: 'Begründung',
    score: 'Score',
    streak: 'Serie',
    question: 'Frage',
    difficulty: 'Schwierigkeit',
    tags: 'Themen',
    skill: 'Kompetenz',
    selectAnswer: 'Wählen Sie eine Antwort.',
    gameIntro: 'Jede Frage wird in Echtzeit von KI generiert – auf Experten-Niveau.',
    start: 'Erste Frage laden',
    context: 'Kontext',
    confidence: 'KI-Konfidenz',
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
    wrong: 'Wrong.',
    rationale: 'Rationale',
    score: 'Score',
    streak: 'Streak',
    question: 'Question',
    difficulty: 'Difficulty',
    tags: 'Topics',
    skill: 'Skill',
    selectAnswer: 'Select an answer.',
    gameIntro: 'Each question is AI-generated in real-time – at expert level.',
    start: 'Load first question',
    context: 'Context',
    confidence: 'AI Confidence',
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
    wrong: 'Faux.',
    rationale: 'Explication',
    score: 'Score',
    streak: 'Série',
    question: 'Question',
    difficulty: 'Difficulté',
    tags: 'Thèmes',
    skill: 'Compétence',
    selectAnswer: 'Sélectionnez une réponse.',
    gameIntro: 'Chaque question est générée en temps réel par IA – niveau expert.',
    start: 'Charger la première question',
    context: 'Contexte',
    confidence: 'Confiance IA',
  },
};

const ThreatDropQuiz = ({ embedded }: { embedded?: boolean }) => {
  const { language } = useLanguage();
  const t = (key: string) => labels[language]?.[key] ?? labels.en[key] ?? key;
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<'intro' | 'loading' | 'question' | 'answered' | 'error'>('intro');
  const [question, setQuestion] = useState<ThreatDropQuestion | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  const fetchQuestion = useCallback(async () => {
    setPhase('loading');
    setQuestion(null);
    setSelectedIdx(null);

    try {
      const { data, error } = await supabase.functions.invoke('threatdrop-question', {
        body: { language, usedIds },
      });

      if (error || data?.error) {
        console.error('ThreatDrop error:', error || data?.error);
        setPhase('error');
        return;
      }

      setQuestion(data as ThreatDropQuestion);
      setUsedIds(prev => [...prev, data.id]);
      setPhase('question');
    } catch (e) {
      console.error('ThreatDrop fetch error:', e);
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

  // Auto-scroll to result after answering
  useEffect(() => {
    if (phase === 'answered' && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [phase]);

  // Auto-scroll to question after loading
  useEffect(() => {
    if (phase === 'question' && questionRef.current) {
      setTimeout(() => {
        questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [phase, question]);

  const handleRestart = () => {
    setScore(0);
    setStreak(0);
    setTotalAnswered(0);
    setUsedIds([]);
    setPhase('intro');
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-background'} p-4 md:p-6 max-w-3xl mx-auto`}>
      {!embedded && <PageMeta title="ThreatDrop" description="Expert Cybersecurity Quiz" />}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-highlight w-7 h-7" />
          <h1 className="text-highlight font-mono font-bold text-xl">{t('title')}</h1>
        </div>
        <p className="text-foreground/70 text-sm font-sans">{t('subtitle')}</p>
      </div>

      {/* Score bar */}
      {totalAnswered > 0 && (
        <div className="flex gap-4 mb-4 p-3 rounded-xl bg-highlight/5 border border-highlight/20">
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <Trophy className="w-4 h-4 text-highlight" />
            <span className="text-highlight font-bold">{score}/{totalAnswered}</span>
            <span className="text-foreground/50">{t('score')}</span>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold">{streak}×</span>
              <span className="text-foreground/50">{t('streak')}</span>
            </div>
          )}
        </div>
      )}

      {/* Intro phase */}
      {phase === 'intro' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 bg-primary/5 border border-primary/20">
            <p className="text-foreground text-sm font-sans leading-relaxed">{t('gameIntro')}</p>
          </div>
          <Button onClick={fetchQuestion} className="w-full bg-highlight text-highlight-foreground hover:bg-highlight/90 font-mono">
            <Zap className="w-4 h-4 mr-2" />
            {t('start')}
          </Button>
        </div>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 text-highlight animate-spin" />
          <p className="text-foreground/70 text-sm font-mono">{t('loading')}</p>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 bg-destructive/10 border border-destructive/20 text-center">
            <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive text-sm font-sans">{t('error')}</p>
          </div>
          <Button onClick={fetchQuestion} variant="outline" className="w-full font-mono">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Question / Answered */}
      {(phase === 'question' || phase === 'answered') && question && (
        <div ref={questionRef} className="space-y-4">
          {/* Question header */}
          <div className="rounded-xl p-4 bg-highlight/5 border border-highlight/20">
            <div className="flex items-start gap-2 mb-2">
              <Target className="w-5 h-5 text-highlight mt-0.5 flex-shrink-0" />
              <p className="text-highlight font-mono font-bold text-sm">{question.threat_title}</p>
            </div>
            {question.context && (
              <p className="text-foreground/80 text-sm font-sans leading-relaxed mb-3 pl-7">{question.context}</p>
            )}
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pl-7">
              {question.domain_tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-mono bg-highlight/10 text-highlight border border-highlight/20">
                  {tag}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                {t('difficulty')}: {question.difficulty}/5
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = idx === question.correct;
              const isAnswered = phase === 'answered';

              let borderColor = 'border-border hover:border-highlight/40';
              let bgColor = 'bg-secondary/30 hover:bg-highlight/5';
              if (isAnswered) {
                if (isCorrect) {
                  borderColor = 'border-green-500/50';
                  bgColor = 'bg-green-500/10';
                } else if (isSelected && !isCorrect) {
                  borderColor = 'border-destructive/50';
                  bgColor = 'bg-destructive/10';
                } else {
                  borderColor = 'border-border/50';
                  bgColor = 'bg-secondary/20 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isAnswered && handleAnswer(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${borderColor} ${bgColor} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`font-mono font-bold text-sm mt-0.5 flex-shrink-0 ${isAnswered && isCorrect ? 'text-green-500' : isAnswered && isSelected ? 'text-destructive' : 'text-highlight'}`}>
                      {optionLetters[idx]}
                    </span>
                    <span className="text-foreground text-sm font-sans leading-relaxed">{opt.replace(/^[A-D]\s+/, '')}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 ml-auto" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5 ml-auto" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result / Rationale */}
          {phase === 'answered' && (
            <div ref={resultRef} className="space-y-3">
              <div className={`rounded-xl p-4 border ${selectedIdx === question.correct ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedIdx === question.correct
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-destructive" />
                  }
                  <span className={`font-mono font-bold text-sm ${selectedIdx === question.correct ? 'text-green-500' : 'text-destructive'}`}>
                    {selectedIdx === question.correct ? t('correct') : t('wrong')}
                  </span>
                </div>
                <p className="text-foreground/80 text-sm font-sans leading-relaxed">{question.rationale}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchQuestion} className="flex-1 bg-highlight text-highlight-foreground hover:bg-highlight/90 font-mono">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('next')}
                </Button>
                <Button onClick={handleRestart} variant="outline" className="font-mono">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreatDropQuiz;
