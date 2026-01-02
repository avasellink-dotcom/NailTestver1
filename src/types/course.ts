export type AbcCategory = 'reason' | 'indicator' | 'change' | 'calculation' | 'other';

export interface AbcTerm {
    id: string;
    term: string;
    translation: string;
    category: AbcCategory;
    description?: string;
    hint?: string;
    isBase?: boolean;
}

export interface DayAbcData {
    baseMarkers: string[];
    themeTerms: AbcTerm[];
}

export interface Signal {
    id: string;
    title: string;
    triggers: string[];
    reaction: string;
    trap: string | null;
    visualHint?: string;
    lock?: string; // The "Lock" (keyword in the correct answer)
    lockKo?: string; // The Korean version of the lock
    transcription?: string; // Romanization for Russian speakers
    visualAid?: string; // URL or identifier for an image/diagram
    abcTermId?: string; // Link to ABC term
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
    dayNumber?: number;
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
