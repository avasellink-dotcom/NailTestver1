import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { Particles } from '@/components/Particles';
import { ArrowLeft, ArrowRight, Target, Key, ChevronLeft, ChevronRight, Languages, HelpCircle } from 'lucide-react';
import courseData from '@/data/courseDays.json';

type LessonPhase = 'signals' | 'patterns' | 'test' | 'result';

interface Signal {
  id: string;
  title: string;
  triggers: string[];
  reaction: string;
  trap: string | null;
}

interface Pattern {
  id: string;
  title: string;
  rule: string;
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
}

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

  const [phase, setPhase] = useState<LessonPhase>('signals');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; isCorrect: boolean; patternId: string }>>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const dayData = courseData.find((d: any) => d.dayNumber === dayNumber);
  const signals: Signal[] = dayData?.signals as any || [];
  const patterns: Pattern[] = dayData?.patterns as any || [];
  const questions: Question[] = (dayData as any)?.questions || [];

  const dp = dayProgress[dayNumber];

  useEffect(() => {
    if (dp?.signalsCompleted && !dp?.patternsCompleted) {
      setPhase('patterns');
    } else if (dp?.patternsCompleted && !dp?.testCompleted) {
      setPhase('test');
    }
  }, [dp]);

  const handleNextSignal = () => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const studiedCount = dp?.signalsCompleted ? signals.length : currentIndex + 1;
      const totalSignals = signals.length;

      if (studiedCount < totalSignals) {
        if (confirm(`⚠️ Секунду!\nТы изучил ${studiedCount}/${totalSignals} сигналов.\n\nПродолжить без изучения всех сигналов?`)) {
          completeSignals(dayNumber);
          setPhase('patterns');
          setCurrentIndex(0);
        }
      } else {
        completeSignals(dayNumber);
        setPhase('patterns');
        setCurrentIndex(0);
      }
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
      patternId: currentQuestion.id, // Using question ID as placeholder since pattern mapping is implicit
    }]);

    // Don't auto-advance if answer is wrong - let user read explanation
    if (isCorrect) {
      setTimeout(() => {
        goToNextQuestion();
      }, 1500);
    }
  };

  const goToNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowTranslation(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate results
      const correctCount = answers.filter(a => a.isCorrect).length;
      const score = Math.round((correctCount / (answers.length || 1)) * 100);
      const errors = answers
        .filter(a => !a.isCorrect)
        .map(a => ({ questionId: a.questionId, patternId: a.patternId }));

      completeTest(dayNumber, score, errors);
      setPhase('result');
    }
  };

  // Find the best matching signal for a question based on Korean keywords
  const findMatchingSignal = (question: Question): Signal | null => {
    const questionText = question.question.toLowerCase();

    // Try to match by triggers
    for (const signal of signals) {
      if (!signal.triggers) continue;

      for (const rawTrigger of signal.triggers) {
        if (!rawTrigger) continue;

        const subTriggers = rawTrigger.split(/[\/\→]/).map(t => t.toLowerCase().trim()).filter(t => t.length > 0);

        for (const subTrigger of subTriggers) {
          if (questionText.includes(subTrigger)) {
            return signal;
          }
        }
      }
    }

    // Fallback: return signal by index if available
    return signals[currentIndex] || signals[0] || null;
  };

  // Find the best matching pattern for a question
  const findMatchingPattern = (question: Question): Pattern | null => {
    // Try to match by question words in pattern
    for (const pattern of patterns) {
      const patternRule = pattern.rule.toLowerCase();
      const questionText = question.question.toLowerCase();

      if (patternRule.includes(questionText)) return pattern;
    }

    return patterns[currentIndex] || patterns[0] || null;
  };

  // Generate comprehensive explanation based on signals and patterns
  const generateExplanation = (question: Question, selectedWrongAnswer: string): string => {
    const correctOption = question.options[question.correctAnswer as keyof typeof question.options];
    const wrongOption = question.options[selectedWrongAnswer as keyof typeof question.options];

    const matchingSignal = findMatchingSignal(question);
    const matchingPattern = findMatchingPattern(question);

    let explanation = `✅ Правильный ответ: ${question.correctAnswer}) ${correctOption}\n`;
    explanation += `❌ Ты выбрал: ${selectedWrongAnswer}) ${wrongOption}\n\n`;

    if (matchingPattern) {
      explanation += `🔑 ПАТТЕРН "${matchingPattern.title}":\n${matchingPattern.rule}\n\n`;
    }

    if (matchingSignal) {
      explanation += `🎯 СИГНАЛ "${matchingSignal.title}":\n${matchingSignal.reaction || ''} ${matchingSignal.trap ? `\nЛовушка: ${matchingSignal.trap}` : ''}`;
    }

    return explanation;
  };

  // Get question hint from signals - always returns something useful
  const getQuestionHint = (question: Question): string => {
    const matchingSignal = findMatchingSignal(question);
    const matchingPattern = findMatchingPattern(question);

    let hint = '';

    if (matchingSignal) {
      hint += `🎯 ${matchingSignal.title}\n${matchingSignal.reaction}`;
      if (matchingSignal.trap) hint += `\nЛовушка: ${matchingSignal.trap}`;
    }

    if (matchingPattern) {
      if (hint) hint += '\n\n';
      hint += `🔑 ${matchingPattern.title}\n${matchingPattern.rule}`;
    }

    if (!hint) {
      hint = '📚 Подсказка для этого вопроса пока не добавлена';
    }

    return hint;
  };

  const getScore = () => {
    const correctCount = answers.filter(a => a.isCorrect).length;
    return Math.round((correctCount / (answers.length || 1)) * 100);
  };

  const renderSignals = () => {
    const signal = signals[currentIndex];
    if (!signal) return null;

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">{t('lesson.signals')}</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {signals.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / signals.length) * 100}%` }}
          />
        </div>

        {/* Signal Card */}
        <GlassCard className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold flex-1">{signal.title}</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="text-gray-400 mt-2 whitespace-pre-line leading-relaxed mb-4">
              {signal.reaction}
            </p>
            <p className="text-sm text-cyan-400 mt-4 font-medium">
              💡 Триггеры: {signal.triggers.join(', ')}
            </p>
            {signal.trap && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-4">
                <p className="text-sm font-bold text-destructive mb-1">ЛОВУШКА:</p>
                <p className="text-sm text-muted-foreground">{signal.trap}</p>
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
            {currentIndex === signals.length - 1 ? t('lesson.finish') : t('lesson.next')}
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

  const renderPatterns = () => {
    const pattern = patterns[currentIndex];
    if (!pattern) return null;

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold">{t('lesson.patterns')}</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {patterns.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full gradient-success transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / patterns.length) * 100}%` }}
          />
        </div>

        {/* Pattern Card */}
        <GlassCard className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center">
              <Key className="w-5 h-5 text-success-foreground" />
            </div>
            <h3 className="text-lg font-bold flex-1">{pattern.title}</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
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
            {currentIndex === patterns.length - 1 ? t('lesson.finish') : t('lesson.next')}
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
    const explanation = selectedAnswer ? generateExplanation(question, selectedAnswer) : '';
    const questionHint = getQuestionHint(question);

    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('lesson.test')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`p-2 rounded-lg transition-all ${showTranslation ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              title="Показать перевод"
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

        {/* Question Card */}
        <GlassCard className="mb-4">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            {question.question}
          </p>
          {showTranslation && (
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
                    <span className={`${showResult && (isCorrect || isSelected) ? 'text-white font-medium' : ''}`}>
                      {option.text}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation for wrong answer */}
        {isWrongAnswer && (
          <div className="mt-4 animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-800 p-4 rounded-lg mt-3">
              <p className="text-red-400 text-lg font-bold">❌ Неправильно</p>
              <p className="text-green-400 mt-1">✅ Ответ: {question.correctAnswer}) {question.options[question.correctAnswer as keyof typeof question.options]}</p>
              {findMatchingSignal(question) && (
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                  💡 {findMatchingSignal(question)?.title}: {findMatchingSignal(question)?.reaction}
                </p>
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
    const score = dayProgress[dayNumber]?.testScore || getScore();
    const isGood = score >= 70;

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-8xl mb-6 animate-bounce-subtle">
          {isGood ? '🎉' : '💪'}
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          {isGood ? t('result.excellent') : t('result.needPractice')}
        </h1>
        <p className="text-5xl font-extrabold gradient-text mb-4">
          {score}%
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          {t('result.correct')}
        </p>
        <p className="text-muted-foreground mb-8 max-w-xs">
          {isGood ? t('result.moving') : t('result.seen')}
        </p>

        <div className="w-full max-w-sm space-y-3">
          {score >= 70 && (
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={onComplete}
            >
              {t('result.nextDay')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="glass"
            size="lg"
            className="w-full"
            onClick={() => {
              setPhase('signals');
              setCurrentIndex(0);
              setAnswers([]);
            }}
          >
            {t('result.repeat')}
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
        {dayNumber === 1 && phase === 'signals' && currentIndex === 0 && (
          <div className="bg-purple-900/50 border border-purple-500/30 p-4 rounded-lg mb-6 animate-in fade-in slide-in-from-top duration-500">
            <p className="text-white font-medium">
              📚 Вводный урок (3 вопроса)
              <br />
              <span className="text-sm text-purple-200 opacity-80">Познакомься с методикой! Мы научим тебя находить правильные ответы быстрее.</span>
            </p>
          </div>
        )}
        {phase === 'signals' && renderSignals()}
        {phase === 'patterns' && renderPatterns()}
        {phase === 'test' && renderTest()}
        {phase === 'result' && renderResult()}
      </div>
    </div>
  );
};
