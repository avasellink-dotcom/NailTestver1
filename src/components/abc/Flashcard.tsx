import React, { useState } from 'react';
import { AbcTerm } from '@/types/course';
import { categoryConfig } from '@/data/categoryConfig';
import { cn } from '@/lib/utils';

interface FlashcardProps {
    term: AbcTerm;
    onKnow: () => void;
    onRepeat: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ term, onKnow, onRepeat }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const config = categoryConfig[term.category] || categoryConfig.other;

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Card Container */}
            <div
                className="relative h-64 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div
                    className={cn(
                        "absolute inset-0 transition-transform duration-500 preserve-3d",
                        isFlipped && "rotate-y-180"
                    )}
                >
                    {/* Front Side */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center shadow-xl border border-slate-700">
                        <span className="text-5xl mb-4">{config.emoji}</span>
                        <h2 className="text-4xl font-bold text-white mb-2">{term.term}</h2>
                        <p className="text-slate-400 text-sm">Нажми, чтобы увидеть перевод</p>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl">
                        <h2 className="text-3xl font-bold text-white mb-2">{term.term}</h2>
                        <div className="w-16 h-1 bg-white/30 rounded mb-4" />
                        <p className="text-2xl text-white mb-2">{term.translation}</p>
                        {term.description && (
                            <p className="text-blue-100 text-center text-sm mb-2">{term.description}</p>
                        )}
                        {term.hint && (
                            <div className="bg-white/10 rounded-lg p-3 mt-2">
                                <p className="text-blue-100 text-sm">💡 {term.hint}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {isFlipped && (
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRepeat(); setIsFlipped(false); }}
                        className="flex-1 py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        🤔 Повторить
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onKnow(); setIsFlipped(false); }}
                        className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        😊 Знаю
                    </button>
                </div>
            )}
        </div>
    );
};
