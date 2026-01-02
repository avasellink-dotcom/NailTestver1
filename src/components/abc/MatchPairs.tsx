import React, { useState, useEffect } from 'react';
import { AbcTerm } from '@/types/course';
import { cn } from '@/lib/utils';

interface MatchPairsProps {
    terms: AbcTerm[];
    onComplete: (score: number) => void;
}

interface MatchItem {
    id: string;
    text: string;
    type: 'term' | 'translation';
    termId: string;
    matched: boolean;
}

export const MatchPairs: React.FC<MatchPairsProps> = ({ terms, onComplete }) => {
    const [items, setItems] = useState<MatchItem[]>([]);
    const [selected, setSelected] = useState<MatchItem | null>(null);
    const [matchedCount, setMatchedCount] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);

    useEffect(() => {
        // Shuffle and create items
        const termItems: MatchItem[] = terms.map(t => ({
            id: `term-${t.id}`,
            text: t.term,
            type: 'term',
            termId: t.id,
            matched: false
        }));
        const translationItems: MatchItem[] = terms.map(t => ({
            id: `trans-${t.id}`,
            text: t.translation,
            type: 'translation',
            termId: t.id,
            matched: false
        }));

        // Shuffle both arrays
        const shuffled = [...termItems.sort(() => Math.random() - 0.5), ...translationItems.sort(() => Math.random() - 0.5)];
        setItems(shuffled);
    }, [terms]);

    const handleSelect = (item: MatchItem) => {
        if (item.matched) return;

        if (!selected) {
            setSelected(item);
        } else {
            if (selected.id === item.id) {
                setSelected(null);
                return;
            }

            // Check if match
            if (selected.termId === item.termId && selected.type !== item.type) {
                // Correct match
                setItems(prev => prev.map(i =>
                    i.termId === item.termId ? { ...i, matched: true } : i
                ));
                setMatchedCount(prev => prev + 1);

                if (matchedCount + 1 === terms.length) {
                    const score = Math.max(0, 1 - (wrongAttempts * 0.1));
                    onComplete(score);
                }
            } else {
                // Wrong match
                setWrongAttempts(prev => prev + 1);
            }
            setSelected(null);
        }
    };

    const termColumn = items.filter(i => i.type === 'term');
    const transColumn = items.filter(i => i.type === 'translation');

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Соедини пары</h3>
                <p className="text-slate-400">Сопоставь корейский термин с переводом</p>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                    <span className="text-green-400">✅ {matchedCount}/{terms.length}</span>
                    {wrongAttempts > 0 && <span className="text-red-400">❌ {wrongAttempts}</span>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Terms Column */}
                <div className="space-y-3">
                    {termColumn.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            disabled={item.matched}
                            className={cn(
                                "w-full p-4 rounded-xl text-lg font-medium transition-all",
                                item.matched && "bg-green-500/20 text-green-400 border-green-500",
                                !item.matched && selected?.id === item.id && "bg-blue-500 text-white scale-105",
                                !item.matched && selected?.id !== item.id && "bg-slate-800 text-white hover:bg-slate-700",
                                "border-2",
                                item.matched ? "border-green-500" : selected?.id === item.id ? "border-blue-400" : "border-slate-700"
                            )}
                        >
                            {item.text}
                        </button>
                    ))}
                </div>

                {/* Translations Column */}
                <div className="space-y-3">
                    {transColumn.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            disabled={item.matched}
                            className={cn(
                                "w-full p-4 rounded-xl text-base transition-all",
                                item.matched && "bg-green-500/20 text-green-400 border-green-500",
                                !item.matched && selected?.id === item.id && "bg-blue-500 text-white scale-105",
                                !item.matched && selected?.id !== item.id && "bg-slate-800 text-white hover:bg-slate-700",
                                "border-2",
                                item.matched ? "border-green-500" : selected?.id === item.id ? "border-blue-400" : "border-slate-700"
                            )}
                        >
                            {item.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
