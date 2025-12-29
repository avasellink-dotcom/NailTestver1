import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/contexts/ProgressContext';
import { GlassCard } from '@/components/GlassCard';
import { Particles } from '@/components/Particles';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Target, Clock, BookOpen, ArrowRight, ChevronLeft, Languages, HelpCircle } from 'lucide-react';
import courseData from '@/data/courseData.json';

interface TrainerScreenProps {
  onBack: () => void;
  onSelectMode: (mode: string) => void;
}

interface Question {
  id: string;
  questionKo: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  answerPattern: string;
  questionRu?: string;
  optionARu?: string;
  optionBRu?: string;
  optionCRu?: string;
  optionDRu?: string;
  explanationRu?: string;
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
    courseData.days.forEach((day: any) => {
      if (day.questions) {
        allQuestions.push(...day.questions);
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
        const errorPatterns = new Set(progress.errors.map(e => e.patternId));
        selectedQuestions = getAllQuestions().filter(q => errorPatterns.has(q.answerPattern));
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
  const findMatchingSignal = (question: Question, dayData: any): any => {
    if (!dayData?.signals) return null;
    
    // Try to match by any word in the question appearing in signal
    for (const signal of dayData.signals) {
      const signalTitle = signal.title.toLowerCase();
      const signalContent = signal.content.toLowerCase();
      
      const questionWords = question.questionKo.split(/\s+/);
      for (const word of questionWords) {
        if (word.length >= 2 && (signalTitle.includes(word) || signalContent.includes(word))) {
          return signal;
        }
      }
    }
    
    // Fallback: return signal by question index
    const questionIdx = parseInt(question.id.split('-')[1]) - 1;
    if (questionIdx >= 0 && questionIdx < dayData.signals.length) {
      return dayData.signals[questionIdx];
    }
    
    return dayData.signals[0] || null;
  };

  // Find the best matching pattern for a question
  const findMatchingPattern = (question: Question, dayData: any): any => {
    if (!dayData?.patterns) return null;
    
    for (const pattern of dayData.patterns) {
      const patternTitle = pattern.title.toLowerCase();
      const patternContent = pattern.content.toLowerCase();
      
      const questionWords = question.questionKo.split(/\s+/);
      for (const word of questionWords) {
        if (word.length >= 2 && (patternTitle.includes(word) || patternContent.includes(word))) {
          return pattern;
        }
      }
      
      const correctOption = {
        'A': question.optionA,
        'B': question.optionB,
        'C': question.optionC,
        'D': question.optionD,
      }[question.correctAnswer];
      
      if (correctOption && patternContent.includes(correctOption.toLowerCase())) {
        return pattern;
      }
    }
    
    const questionIdx = parseInt(question.id.split('-')[1]) - 1;
    if (questionIdx >= 0 && questionIdx < dayData.patterns.length) {
      return dayData.patterns[questionIdx];
    }
    
    return dayData.patterns[0] || null;
  };

  // Generate comprehensive explanation
  const generateExplanation = (question: Question, selectedWrongAnswer: string): string => {
    const correctOption = {
      'A': question.optionA,
      'B': question.optionB,
      'C': question.optionC,
      'D': question.optionD,
    }[question.correctAnswer];

    const wrongOption = {
      'A': question.optionA,
      'B': question.optionB,
      'C': question.optionC,
      'D': question.optionD,
    }[selectedWrongAnswer];

    const dayNumber = parseInt(question.id.split('-')[0].replace('Q', ''));
    const dayData = courseData.days.find((d: any) => d.dayNumber === dayNumber);
    
    const matchingSignal = findMatchingSignal(question, dayData);
    const matchingPattern = findMatchingPattern(question, dayData);
    
    let explanation = `✅ Правильный ответ: ${question.correctAnswer}) ${correctOption}\n`;
    explanation += `❌ Ты выбрал: ${selectedWrongAnswer}) ${wrongOption}\n\n`;
    
    if (matchingPattern) {
      explanation += `🔑 ПАТТЕРН "${matchingPattern.title}":\n${matchingPattern.content}\n\n`;
    }
    
    if (matchingSignal) {
      explanation += `🎯 СИГНАЛ "${matchingSignal.title}":\n${matchingSignal.content}`;
    }
    
    if (!matchingPattern && !matchingSignal) {
      explanation += `📚 Запомни: правильный ответ — ${question.correctAnswer}) ${correctOption}`;
    }
    
    return explanation;
  };

  // Get question hint from signals - always returns something useful
  const getQuestionHint = (question: Question): string => {
    const dayNumber = parseInt(question.id.split('-')[0].replace('Q', ''));
    const dayData = courseData.days.find((d: any) => d.dayNumber === dayNumber);
    
    const matchingSignal = findMatchingSignal(question, dayData);
    const matchingPattern = findMatchingPattern(question, dayData);
    
    let hint = '';
    
    if (matchingSignal) {
      hint += `🎯 ${matchingSignal.title}\n${matchingSignal.content}`;
    }
    
    if (matchingPattern) {
      if (hint) hint += '\n\n';
      hint += `🔑 ${matchingPattern.title}\n${matchingPattern.content}`;
    }
    
    if (!hint) {
      hint = '📚 Подсказка для этого вопроса пока не добавлена';
    }
    
    return hint;
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
      { key: 'A', text: question.optionA, textRu: question.optionARu },
      { key: 'B', text: question.optionB, textRu: question.optionBRu },
      { key: 'C', text: question.optionC, textRu: question.optionCRu },
      { key: 'D', text: question.optionD, textRu: question.optionDRu },
    ];

    const explanation = selectedAnswer ? generateExplanation(question, selectedAnswer) : '';
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
            {question.questionKo}
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
                    <span className={`${showResult && (isCorrect || isSelected) ? 'text-white font-medium' : 'text-foreground'}`}>
                      {option.text}
                    </span>
                    {showTranslation && option.textRu && (
                      <p className="text-xs text-primary/80 mt-1">
                        🇷🇺 {option.textRu}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation for wrong answer */}
        {isWrongAnswer && (
          <div className="mt-4 animate-in slide-in-from-bottom duration-300">
            <GlassCard className="border-2 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl gradient-error flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-destructive mb-2">❌ Неправильно</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </GlassCard>
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
    const score = Math.round((correctCount / questions.length) * 100);
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
