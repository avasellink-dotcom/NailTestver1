import React, { useState, useEffect } from 'react';
import { Flashcard } from './Flashcard';
import { MatchPairs } from './MatchPairs';
import { MiniQuiz } from './MiniQuiz';
import { AbcTerm } from '@/types/course';
import { useProgress } from '@/contexts/ProgressContext';
import baseTermsData from '@/data/abc/baseAbcTerms.json';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

type Step = 'flashcards' | 'matching' | 'quiz' | 'complete';

interface ABCTrainerProps {
    dayNumber: number;
    dayTerms: AbcTerm[];
    quizQuestions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
    }>;
    onComplete: () => void;
    onBack: () => void;
}

export const ABCTrainer: React.FC<ABCTrainerProps> = ({
    dayNumber,
    dayTerms,
    quizQuestions,
    onComplete,
    onBack
}) => {
    const { completeAbc, dayProgress } = useProgress();
    const [step, setStep] = useState<Step>('flashcards');
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [knownTerms, setKnownTerms] = useState<Set<string>>(new Set());
    const [repeatQueue, setRepeatQueue] = useState<AbcTerm[]>([]);
    const [matchingScore, setMatchingScore] = useState(0);
    const [quizScore, setQuizScore] = useState(0);

    // Combine base terms with day-specific terms
    const allTerms = [...(baseTermsData as AbcTerm[]).slice(0, 4), ...dayTerms];
    const currentTerms = repeatQueue.length > 0 ? repeatQueue : allTerms;
    const currentTerm = currentTerms[flashcardIndex];

    const handleKnow = () => {
        if (currentTerm) {
            setKnownTerms(prev => new Set(prev).add(currentTerm.id));
        }
        goToNextCard();
    };

    const handleRepeat = () => {
        if (currentTerm) {
            setRepeatQueue(prev => [...prev, currentTerm]);
        }
        goToNextCard();
    };

    const goToNextCard = () => {
        if (flashcardIndex < currentTerms.length - 1) {
            setFlashcardIndex(prev => prev + 1);
        } else if (repeatQueue.length > 0) {
            // Process repeat queue
            setFlashcardIndex(0);
            setRepeatQueue([]);
        } else {
            // Move to matching
            setStep('matching');
        }
    };

    const handleMatchingComplete = (score: number) => {
        setMatchingScore(score);
        setStep('quiz');
    };

    const handleQuizComplete = (score: number) => {
        setQuizScore(score);
        completeAbc(dayNumber, score);
        setStep('complete');
    };

    const progressPercent = step === 'flashcards'
        ? ((flashcardIndex + 1) / currentTerms.length) * 33
        : step === 'matching' ? 33 + (33 * matchingScore)
            : step === 'quiz' ? 66 + (34 * quizScore)
                : 100;

    const isUnlocked = quizScore >= 0.7;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-white p-2">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white">🎓 Азбука Day {dayNumber}</h1>
                <div className="w-10" />
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className={step === 'flashcards' ? 'text-blue-400' : ''}>Карточки</span>
                    <span className={step === 'matching' ? 'text-blue-400' : ''}>Пары</span>
                    <span className={step === 'quiz' ? 'text-blue-400' : ''}>Тест</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <p className="text-center text-slate-400 text-sm mt-2">
                    {knownTerms.size}/{allTerms.length} терминов изучено
                </p>
            </div>

            {/* Content */}
            {step === 'flashcards' && currentTerm && (
                <Flashcard
                    term={currentTerm}
                    onKnow={handleKnow}
                    onRepeat={handleRepeat}
                />
            )}

            {step === 'matching' && (
                <MatchPairs
                    terms={allTerms.slice(0, 4)}
                    onComplete={handleMatchingComplete}
                />
            )}

            {step === 'quiz' && (
                <MiniQuiz
                    questions={quizQuestions}
                    onComplete={handleQuizComplete}
                />
            )}

            {step === 'complete' && (
                <div className="text-center py-12">
                    <div className={`text-8xl mb-6 ${isUnlocked ? 'animate-bounce' : ''}`}>
                        {isUnlocked ? '🎉' : '📚'}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        {isUnlocked ? 'Отлично!' : 'Нужно повторить'}
                    </h2>
                    <p className="text-xl text-slate-300 mb-2">
                        Результат: {Math.round(quizScore * 100)}%
                    </p>
                    <p className="text-slate-400 mb-8">
                        {isUnlocked
                            ? 'Тест разблокирован! Теперь ты можешь пройти основной тест дня.'
                            : 'Для разблокировки теста нужно набрать минимум 70%.'
                        }
                    </p>

                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-8 ${isUnlocked ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                        {isUnlocked ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        <span>{isUnlocked ? 'Тест разблокирован' : 'Тест заблокирован'}</span>
                    </div>

                    <div className="flex gap-4 justify-center">
                        {!isUnlocked && (
                            <button
                                onClick={() => {
                                    setStep('flashcards');
                                    setFlashcardIndex(0);
                                    setKnownTerms(new Set());
                                }}
                                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                            >
                                Попробовать снова
                            </button>
                        )}
                        <button
                            onClick={onComplete}
                            className={`px-8 py-4 rounded-xl font-semibold transition-colors ${isUnlocked
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                }`}
                        >
                            {isUnlocked ? 'Перейти к тесту' : 'Вернуться'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
