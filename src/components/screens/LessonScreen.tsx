import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { Particles } from '@/components/Particles';
import { ArrowLeft, ArrowRight, Target, Key, ChevronLeft, ChevronRight, Languages, BookOpen, Zap, AlertTriangle } from 'lucide-react';
import { highlightTriggers, collectAllTriggers } from '@/lib/highlightTriggers';
import courseData from '@/data/courseDays.json';

type LessonPhase = 'intro' | 'signals' | 'patterns' | 'test' | 'result';

import { Signal, Pattern, Question, DayData } from '@/types/course';
import { findMatchingSignal } from '@/lib/courseUtils';

interface LessonScreenProps {
  dayNumber: number;
  onBack: () => void;
  onComplete: () => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  dayNumber,
  onBack,
  onComplete,
}) => {
  const { t, language } = useLanguage();
  const { completeSignals, completePatterns, completeTest, dayProgress } = useProgress();
  const { hapticFeedback } = useTelegram();

  const [phase, setPhase] = useState<LessonPhase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; isCorrect: boolean; patternId: string }>>([]);
  const [showTranslation, setShowTranslation] = useState(false);

  const dayData = courseData.find((d: any) => d.dayNumber === dayNumber) as DayData | undefined;
  const signals: Signal[] = dayData?.signals || [];
  const patterns: Pattern[] = dayData?.patterns || [];
  const questions: Question[] = dayData?.questions || [];

  // Collect all triggers for highlighting
  const allTriggers = collectAllTriggers(signals);

  const dp = dayProgress[dayNumber];

  useEffect(() => {
    if (dp?.signalsCompleted && !dp?.patternsCompleted) {
      setPhase('patterns');
    } else if (dp?.patternsCompleted && !dp?.testCompleted) {
      setPhase('test');
    } else if (!dp?.signalsCompleted) {
      setPhase('intro');
    }
  }, [dp]);

  const handleStartSignals = () => {
    setPhase('signals');
    setCurrentIndex(0);
    hapticFeedback('light');
  };

  const handleNextSignal = () => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeSignals(dayNumber);
      setPhase('patterns');
      setCurrentIndex(0);
    }
    hapticFeedback('light');
  };

  const handlePrevSignal = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    hapticFeedback('light');
  };

  const handleNextPattern = () => {
    if (currentIndex < patterns.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completePatterns(dayNumber);
      setPhase('test');
      setCurrentIndex(0);
    }
    hapticFeedback('light');
  };

  const handlePrevPattern = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    hapticFeedback('light');
  };

  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      hapticFeedback('success');
    } else {
      hapticFeedback('error');
    }

    setAnswers([...answers, {
      questionId: currentQuestion.id,
      isCorrect,
      patternId: currentQuestion.id,
    }]);

    if (isCorrect) {
      setTimeout(() => {
        goToNextQuestion();
      }, 1500);
    }
  };

  const goToNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setShowTranslation(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const correctCount = answers.filter(a => a.isCorrect).length;
      const score = Math.round((correctCount / (answers.length || 1)) * 100);
      const errors = answers
        .filter(a => !a.isCorrect)
        .map(a => ({ questionId: a.questionId, patternId: a.patternId }));

      completeTest(dayNumber, score, errors);
      setPhase('result');
    }
  };



  const getScore = () => {
    const correctCount = answers.filter(a => a.isCorrect).length;
    return Math.round((correctCount / (answers.length || 1)) * 100);
  };

  // === INTRO PHASE ===
  const renderIntro = () => {
    if (!dayData) return null;

    const isReviewDay = dayData.title.includes('REVIEW');
    const hasSignals = signals.length > 0;
    const hasPatterns = patterns.length > 0;

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce-subtle">{dayData.emoji}</div>
          <h1 className="text-2xl font-extrabold mb-2">
            День {dayNumber}: {dayData.titleRu || dayData.title}
          </h1>
          <p className="text-muted-foreground text-sm">{dayData.titleKo}</p>
        </div>

        {/* Goal Card */}
        <GlassCard className="mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">🎯 Цель дня</h3>
              <p className="text-muted-foreground leading-relaxed">{dayData.goal}</p>
            </div>
          </div>
        </GlassCard>

        {/* What's inside */}
        <GlassCard className="mb-4">
          <h3 className="font-bold text-lg mb-4">📚 Что тебя ждёт</h3>
          <div className="space-y-3">
            {hasSignals && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Zap className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="font-medium text-cyan-400">{signals.length} сигналов</span>
                  <p className="text-xs text-muted-foreground">Триггерные слова для распознавания</p>
                </div>
              </div>
            )}
            {hasPatterns && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Key className="w-5 h-5 text-green-400" />
                <div>
                  <span className="font-medium text-green-400">{patterns.length} паттернов</span>
                  <p className="text-xs text-muted-foreground">Правила мгновенного ответа</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <div>
                <span className="font-medium text-purple-400">{questions.length} вопросов</span>
                <p className="text-xs text-muted-foreground">Тест на закрепление</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Instruction */}
        {dayData.signalsInstruction && (
          <GlassCard className="mb-6 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground leading-relaxed">
              💡 {dayData.signalsInstruction}
            </p>
          </GlassCard>
        )}

        {/* Start Button */}
        <div className="mt-auto">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleStartSignals}
          >
            {hasSignals ? 'Начать изучение сигналов' : 'Перейти к тесту'}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // === SIGNALS PHASE ===
  const renderSignals = () => {
    const signal = signals[currentIndex];
    if (!signal) {
      // No signals - skip to patterns or test
      if (patterns.length > 0) {
        completeSignals(dayNumber);
        setPhase('patterns');
        setCurrentIndex(0);
      } else {
        completeSignals(dayNumber);
        completePatterns(dayNumber);
        setPhase('test');
        setCurrentIndex(0);
      }
      return null;
    }

    const validTriggers = signal.triggers.filter(t => t && t.trim() !== '' && t.trim() !== '--');

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold">Сигналы</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {signals.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / signals.length) * 100}%` }}
          />
        </div>

        {/* Signal Card */}
        <GlassCard className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-lg font-bold flex-1">{signal.title}</h1>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Triggers */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">🔍 Триггеры (ищи в вопросе):</p>
              <div className="flex flex-wrap gap-2">
                {validTriggers.map((trigger, idx) => (
                  <span key={idx} className="signal-trigger-badge">
                    {trigger}
                  </span>
                ))}
              </div>
            </div>

            {/* Reaction */}
            {signal.reaction && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 mb-1 font-medium">✅ Реакция:</p>
                <p className="text-foreground whitespace-pre-line leading-relaxed">
                  {signal.reaction}
                </p>
              </div>
            )}

            {/* Trap */}
            {signal.trap && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400 font-medium">Ловушка:</p>
                </div>
                <p className="text-foreground">{signal.trap}</p>
              </div>
            )}

            {/* Visual Hint */}
            {signal.visualHint && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 mb-1 font-medium">💡 Визуальная подсказка:</p>
                <p className="text-foreground whitespace-pre-line leading-relaxed font-medium">
                  {signal.visualHint}
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="glass"
            size="icon"
            onClick={handlePrevSignal}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            onClick={handleNextSignal}
          >
            {currentIndex === signals.length - 1 ? 'К паттернам' : 'Далее'}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="glass"
            size="icon"
            onClick={handleNextSignal}
            disabled={currentIndex === signals.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // === PATTERNS PHASE ===
  const renderPatterns = () => {
    const pattern = patterns[currentIndex];
    if (!pattern) {
      // No patterns - skip to test
      completePatterns(dayNumber);
      setPhase('test');
      setCurrentIndex(0);
      return null;
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Паттерны</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {patterns.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / patterns.length) * 100}%` }}
          />
        </div>

        {/* Pattern Card */}
        <GlassCard className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-bold flex-1">{pattern.title}</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="text-foreground whitespace-pre-line leading-relaxed">
              {pattern.rule}
            </p>
          </div>
        </GlassCard>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="glass"
            size="icon"
            onClick={handlePrevPattern}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="gradientSuccess"
            className="flex-1"
            onClick={handleNextPattern}
          >
            {currentIndex === patterns.length - 1 ? 'К тесту' : 'Далее'}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="glass"
            size="icon"
            onClick={handleNextPattern}
            disabled={currentIndex === patterns.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // === TEST PHASE ===
  const renderTest = () => {
    const question = questions[currentIndex];
    if (!question) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Вопросы для этого дня ещё не добавлены</p>
        </div>
      );
    }

    const options = [
      { key: 'A', text: question.options.A },
      { key: 'B', text: question.options.B },
      { key: 'C', text: question.options.C },
      { key: 'D', text: question.options.D },
    ];

    const isWrongAnswer = showFeedback && selectedAnswer !== question.correctAnswer;
    const match = findMatchingSignal(question.question, dayData);
    const matchingSignal = match?.signal;

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Тест</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`p-2 rounded-lg transition-all ${showTranslation ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              title="Показать подсказку"
            >
              <Languages className="w-5 h-5" />
            </button>
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

        {/* Question Card with Trigger Highlighting */}
        <GlassCard className="mb-4">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            {highlightTriggers(question.question, allTriggers)}
          </p>
          {showTranslation && matchingSignal && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">💡 Сигнал:</p>
              <p className="text-sm text-cyan-400 font-medium">{matchingSignal.title}</p>
              {matchingSignal.reaction && (
                <p className="text-sm text-muted-foreground mt-1">{matchingSignal.reaction}</p>
              )}
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
                    <span className={`${showResult && (isCorrect || isSelected) ? 'text-white font-medium' : ''}`}>
                      {option.text}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback for wrong answer */}
        {isWrongAnswer && (
          <div className="mt-4 animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-red-400 text-lg font-bold">❌ Неправильно</p>
              <p className="text-green-400 mt-1">
                ✅ Ответ: {question.correctAnswer}) {question.options[question.correctAnswer as keyof typeof question.options]}
              </p>
              {matchingSignal && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-cyan-400 text-sm font-medium">
                    🎯 {matchingSignal.title}
                  </p>
                  {matchingSignal.reaction && (
                    <p className="text-gray-300 text-sm mt-1">{matchingSignal.reaction}</p>
                  )}
                  {matchingSignal.trap && (
                    <p className="text-red-300 text-sm mt-1">⚠️ {matchingSignal.trap}</p>
                  )}
                  {matchingSignal.visualHint && (
                    <div className="mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400 mb-0.5 font-bold">💡 Запомни:</p>
                      <p className="text-sm text-yellow-200 whitespace-pre-line">{matchingSignal.visualHint}</p>
                    </div>
                  )}
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

  // === RESULT PHASE ===
  const renderResult = () => {
    const score = dayProgress[dayNumber]?.testScore || getScore();
    const isGood = score >= 70;

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-8xl mb-6 animate-bounce-subtle">
          {isGood ? '🎉' : '💪'}
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          {isGood ? 'Отлично!' : 'Нужно повторить'}
        </h1>
        <p className="text-5xl font-extrabold gradient-text mb-4">
          {score}%
        </p>
        <p className="text-lg text-muted-foreground mb-4">
          Правильных ответов
        </p>
        <p className="text-muted-foreground mb-8 max-w-xs">
          {isGood
            ? 'День завершён! Переходи к следующему дню.'
            : dayData?.resultMessage || 'Пересмотри сигналы и попробуй снова.'}
        </p>

        <div className="w-full max-w-sm space-y-3">
          {score >= 70 && (
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={onComplete}
            >
              Следующий день
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="glass"
            size="lg"
            className="w-full"
            onClick={() => {
              setPhase('intro');
              setCurrentIndex(0);
              setAnswers([]);
            }}
          >
            Повторить урок
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden p-4">
      <Particles count={10} />

      {/* Back Button */}
      <button
        onClick={onBack}
        className="p-2 rounded-xl hover:bg-secondary transition-colors mb-4 self-start relative z-10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {phase === 'intro' && renderIntro()}
        {phase === 'signals' && renderSignals()}
        {phase === 'patterns' && renderPatterns()}
        {phase === 'test' && renderTest()}
        {phase === 'result' && renderResult()}
      </div>
    </div>
  );
};
