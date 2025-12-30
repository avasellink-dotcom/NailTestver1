import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/contexts/ProgressContext';
import { GlassCard } from '@/components/GlassCard';
import { Particles } from '@/components/Particles';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Target, Clock, BookOpen, ArrowRight, ChevronLeft, Languages, HelpCircle, Zap } from 'lucide-react';
import courseData from '@/data/courseDays.json';
import { findThemeHint } from '@/data/hintPatterns';

interface TrainerScreenProps {
  onBack: () => void;
  onSelectMode: (mode: string) => void;
}

interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  dayNumber?: number;
}

type TrainerPhase = 'menu' | 'quiz' | 'result';

export const TrainerScreen: React.FC<TrainerScreenProps> = ({ onBack, onSelectMode }) => {
  const { t } = useLanguage();
  const { progress } = useProgress();

  const [phase, setPhase] = useState<TrainerPhase>('menu');
  const [currentMode, setCurrentMode] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes for exam mode
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isWrongAnswer, setIsWrongAnswer] = useState(false);

  const getAllQuestions = (): Question[] => {
    const allQuestions: Question[] = [];
    courseData.forEach((day: any) => {
      if (day.questions) {
        allQuestions.push(...day.questions.map((q: any) => ({ ...q, dayNumber: day.dayNumber })));
      }
    });
    return allQuestions;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleSelectMode = (mode: string) => {
    setCurrentMode(mode);
    onSelectMode(mode);

    let selectedQuestions: Question[] = [];

    switch (mode) {
      case 'random':
        selectedQuestions = shuffleArray(getAllQuestions()).slice(0, 20);
        break;
      case 'weak':
        // Get questions from error patterns
        const errorQuestionIds = new Set(progress.errors.map(e => e.questionId));
        selectedQuestions = getAllQuestions().filter(q => errorQuestionIds.has(q.id));
        if (selectedQuestions.length === 0) {
          selectedQuestions = shuffleArray(getAllQuestions()).slice(0, 10);
        }
        selectedQuestions = shuffleArray(selectedQuestions).slice(0, 20);
        break;
      case 'exam':
        selectedQuestions = shuffleArray(getAllQuestions()).slice(0, 60);
        // Start timer
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setPhase('result');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerInterval(interval);
        break;
      case 'review':
        selectedQuestions = shuffleArray(getAllQuestions()).slice(0, 30);
        break;
    }

    if (selectedQuestions.length > 0) {
      setQuestions(selectedQuestions);
      setCurrentIndex(0);
      setCorrectCount(0);
      setPhase('quiz');
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setIsWrongAnswer(false);
      setTimeout(() => {
        goToNextQuestion();
      }, 1500);
    } else {
      setIsWrongAnswer(true);
      // Don't auto-advance, let user read explanation
    }
  };

  const goToNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setIsWrongAnswer(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      setPhase('result');
    }
  };

  // Find the best matching signal for a question
  const findMatchingSignal = (questionText: string, dayNumber: number): { signal: any; trigger: string | null } | null => {
    // dayNumber is crucial for finding the correct signals
    const currentDay = courseData.find((d: any) => d.dayNumber === dayNumber);

    if (!currentDay || !currentDay.signals) {
      return null;
    }

    // Normalize question
    const normalizedQuestion = questionText.toLowerCase().trim();

    // Iterate through signals
    for (const signal of currentDay.signals) {
      if (!signal.triggers) continue;

      // Check each trigger string which might contain multiple sub-triggers (e.g. "A / B" or "A → B")
      for (const rawTrigger of signal.triggers) {
        if (!rawTrigger) continue;

        // Split by separators commonly used in the new all_days.json
        const subTriggers = rawTrigger.split(/[\/\→]/).map(t => t.toLowerCase().trim()).filter(t => t.length > 0);

        for (const subTrigger of subTriggers) {
          if (normalizedQuestion.includes(subTrigger)) {
            return { signal, trigger: subTrigger };
          }
        }
      }
    }

    return null;
  };

  // Render question text with highlighted trigger
  const renderQuestionWithHighlights = (text: string, dayNum: number) => {
    const match = findMatchingSignal(text, dayNum);

    if (!match) {
      return <>{text}</>;
    }

    const { trigger } = match;
    // Экранируем спецсимволы в триггере
    const escapedTrigger = trigger!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTrigger})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => (
          <span
            key={i}
            className={
              part.toLowerCase() === trigger!.toLowerCase()
                ? 'text-[#00f2ff] font-bold underline underline-offset-4 decoration-[#00f2ff]/50'
                : ''
            }
          >
            {part}
          </span>
        ))}
      </>
    );
  };

  // Find the best matching pattern for a question
  const findMatchingPattern = (question: Question, dayData: any): any => {
    if (!dayData?.patterns) return null;

    for (const pattern of dayData.patterns) {
      const patternRule = pattern.rule.toLowerCase();
      const questionText = question.question.toLowerCase();

      if (patternRule.includes(questionText)) return pattern;
    }
    return null;
  };

  // Generate comprehensive explanation
  const getExplanationData = (question: Question, selectedWrongAnswer: string) => {
    const correctOption = question.options[question.correctAnswer as keyof typeof question.options];
    const wrongOption = question.options[selectedWrongAnswer as keyof typeof question.options];

    const dayNumber = question.dayNumber || 1;
    const signalResult = findMatchingSignal(question.question, dayNumber);
    const dayData = courseData.find((d: any) => d.dayNumber === dayNumber);
    const matchingPattern = findMatchingPattern(question, dayData);

    return {
      correctOption,
      wrongOption,
      matchingSignal: signalResult?.signal,
      matchedTrigger: signalResult?.trigger,
      matchingPattern
    };
  };

  // Get question hint - prioritized by theme, then by day data
  const getQuestionHint = (question: Question): string | null => {
    // 1. Try to find theme-based hint first (high relevance)
    const themeHint = findThemeHint(question.question);
    if (themeHint) return themeHint;

    const dayNumber = question.dayNumber || 1;
    const signalResult = findMatchingSignal(question.question, dayNumber);
    const dayData = courseData.find((d: any) => d.dayNumber === dayNumber);
    const matchingPattern = findMatchingPattern(question, dayData);

    let hint = '';

    if (signalResult?.signal) {
      hint += `🎯 ${signalResult.signal.title}\n${signalResult.signal.reaction}`;
    }

    if (matchingPattern) {
      if (hint) hint += '\n\n';
      hint += `🔑 ${matchingPattern.title}\n${matchingPattern.rule}`;
    }

    return hint || null;
  };

  const handleBackToMenu = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setPhase('menu');
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setTimeLeft(3600);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modes = [
    {
      id: 'random',
      icon: Shuffle,
      title: t('trainer.random'),
      description: t('trainer.randomDesc'),
      gradient: 'gradient-primary',
    },
    {
      id: 'weak',
      icon: Target,
      title: t('trainer.weak'),
      description: t('trainer.weakDesc'),
      gradient: 'gradient-warning',
    },
    {
      id: 'exam',
      icon: Clock,
      title: t('trainer.exam'),
      description: t('trainer.examDesc'),
      gradient: 'gradient-error',
    },
    {
      id: 'review',
      icon: BookOpen,
      title: t('trainer.review'),
      description: t('trainer.reviewDesc'),
      gradient: 'gradient-success',
    },
  ];

  const renderMenu = () => (
    <>
      {/* Header */}
      <div className="relative z-10 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-secondary transition-colors mb-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold gradient-text">{t('trainer.title')}</h1>
      </div>

      {/* Modes Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
        {modes.map((mode) => (
          <GlassCard
            key={mode.id}
            className="flex flex-col items-center justify-center text-center p-6"
            hover
            onClick={() => handleSelectMode(mode.id)}
          >
            <div className={`w-16 h-16 rounded-2xl ${mode.gradient} flex items-center justify-center mb-4`}>
              <mode.icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-bold mb-2 text-foreground">{mode.title}</h3>
            <p className="text-xs text-muted-foreground">{mode.description}</p>
          </GlassCard>
        ))}
      </div>
    </>
  );

  const renderQuiz = () => {
    const question = questions[currentIndex];
    if (!question) return null;

    const options = [
      { key: 'A', text: question.options.A },
      { key: 'B', text: question.options.B },
      { key: 'C', text: question.options.C },
      { key: 'D', text: question.options.D },
    ];

    const dayNumber = question.dayNumber || 1;
    const signalResult = findMatchingSignal(question.question, dayNumber);

    const expData = selectedAnswer ? getExplanationData(question, selectedAnswer) : null;
    const questionHint = getQuestionHint(question);

    return (
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToMenu}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`p-2 rounded-lg transition-all ${showTranslation ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              title="Показать перевод"
            >
              <Languages className="w-5 h-5" />
            </button>
            {currentMode === 'exam' && (
              <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-destructive' : 'text-foreground'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <GlassCard className="mb-4">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            {renderQuestionWithHighlights(question.question, dayNumber)}
          </p>
          {showTranslation && questionHint && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">🇷🇺 Подсказка на русском:</p>
              <p className="text-sm text-primary whitespace-pre-line leading-relaxed">
                {questionHint}
              </p>
            </div>
          )}
        </GlassCard>

        {/* Options */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selectedAnswer === option.key;
            const isCorrect = option.key === question.correctAnswer;
            const showResult = showFeedback;

            let bgClass = 'glass-card hover:bg-[hsla(240,15%,20%,0.8)]';
            if (showResult && isCorrect) {
              bgClass = 'gradient-success';
            } else if (showResult && isSelected && !isCorrect) {
              bgClass = 'gradient-error';
            }

            return (
              <button
                key={option.key}
                onClick={() => handleSelectAnswer(option.key)}
                disabled={showFeedback}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-300
                  ${bgClass}
                  ${!showFeedback ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0
                    ${showResult && isCorrect ? 'bg-success-foreground/20 text-success-foreground' :
                      showResult && isSelected ? 'bg-destructive-foreground/20 text-destructive-foreground' :
                        'bg-primary/20 text-primary'}
                  `}>
                    {option.key}
                  </span>
                  <div className="flex-1">
                    <span className={`${showResult && (isCorrect || isSelected) ? 'text-white font-medium' : 'text-foreground'}`}>
                      {option.text}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {isWrongAnswer && expData && (
          <div className="mt-4 animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#1a1b1e] p-5 rounded-xl mt-4 border-b-2 border-[#00f2ff] shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[#ff4d4d] text-lg font-bold">❌ Неправильно</p>
              </div>
              <p className="text-[#4ade80] font-medium mb-3">✅ Верно: {question.correctAnswer}) {expData.correctOption}</p>
              {expData.matchingSignal && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <p className="text-[#00f2ff] text-sm font-bold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {expData.matchingSignal.title}
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {expData.matchingSignal.reaction}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="gradient"
              size="lg"
              className="w-full mt-4"
              onClick={goToNextQuestion}
            >
              {currentIndex < questions.length - 1 ? 'Следующий вопрос' : 'Результаты'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    const score = Math.round((correctCount / (questions.length || 1)) * 100);
    const isGood = score >= 70;

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <div className="text-8xl mb-6 animate-bounce-subtle">
          {isGood ? '🎉' : '💪'}
        </div>
        <h1 className="text-3xl font-extrabold mb-2 text-foreground">
          {isGood ? t('result.excellent') : t('result.needPractice')}
        </h1>
        <p className="text-5xl font-extrabold gradient-text mb-4">
          {score}%
        </p>
        <p className="text-lg text-muted-foreground mb-2">
          {correctCount} / {questions.length} {t('result.correct')}
        </p>
        <p className="text-muted-foreground mb-8 max-w-xs">
          {isGood ? t('result.moving') : t('result.seen')}
        </p>

        <div className="w-full max-w-sm space-y-3">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => handleSelectMode(currentMode)}
          >
            {t('result.repeat')}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="glass"
            size="lg"
            className="w-full"
            onClick={handleBackToMenu}
          >
            {t('trainer.title')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden p-4">
      <Particles count={15} />

      {phase === 'menu' && renderMenu()}
      {phase === 'quiz' && renderQuiz()}
      {phase === 'result' && renderResult()}
    </div>
  );
};
