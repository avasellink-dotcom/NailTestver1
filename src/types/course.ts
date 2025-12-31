export interface Signal {
    id: string;
    title: string;
    triggers: string[];
    reaction: string;
    trap: string | null;
    visualHint?: string;
}

export interface Pattern {
    id: string;
    title: string;
    rule: string;
    visualHint?: string;
}

export interface Question {
    id: string;
    question: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    correctAnswer: string;
    dayNumber?: number; // Optional as it might be enriched later
}

export interface DayData {
    dayNumber: number;
    emoji: string;
    title: string;
    titleKo?: string;
    titleRu?: string;
    goal: string;
    format: string;
    signalsInstruction: string;
    patternsInstruction?: string;
    testInstruction?: string;
    signals: Signal[];
    patterns: Pattern[];
    questions: Question[];
    resultMessage?: string;
    resultErrorSignals?: string[];
}
