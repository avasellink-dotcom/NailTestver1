import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface MiniQuizProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
}

export const MiniQuiz: React.FC<MiniQuizProps> = ({ questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const isLastQuestion = currentIndex === questions.length - 1;

    const handleAnswer = (index: number) => {
        if (showResult) return;
        setSelectedAnswer(index);
        setShowResult(true);
        if (index === currentQuestion.correctAnswer) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (isLastQuestion) {
            const score = correctCount / questions.length;
            onComplete(score);
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Вопрос {currentIndex + 1} из {questions.length}</span>
                    <span className="text-green-400">{correctCount} правильно</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-medium text-white mb-6">{currentQuestion.question}</h3>

                {/* Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={showResult}
                            className={cn(
                                "w-full p-4 rounded-xl text-left transition-all border-2",
                                showResult && index === currentQuestion.correctAnswer && "bg-green-500/20 border-green-500 text-green-400",
                                showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && "bg-red-500/20 border-red-500 text-red-400",
                                !showResult && "bg-slate-700 border-slate-600 text-white hover:border-blue-500 hover:bg-slate-600",
                                showResult && index !== currentQuestion.correctAnswer && selectedAnswer !== index && "opacity-50"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Result & Explanation */}
            {showResult && (
                <div className={cn(
                    "rounded-xl p-4 mb-6",
                    isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
                )}>
                    <p className={cn("font-semibold mb-2", isCorrect ? "text-green-400" : "text-red-400")}>
                        {isCorrect ? "✅ Правильно!" : "❌ Неправильно"}
                    </p>
                    <p className="text-slate-300 text-sm">{currentQuestion.explanation}</p>
                </div>
            )}

            {/* Next Button */}
            {showResult && (
                <button
                    onClick={handleNext}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                >
                    {isLastQuestion ? "Завершить" : "Следующий вопрос"}
                </button>
            )}
        </div>
    );
};
