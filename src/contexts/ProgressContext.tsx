import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProgress {
  currentDay: number;
  completedDays: number[];
  activationCode: string | null;
  isPremium: boolean;
  lastTestScore: number | null;
  streak: number;
  totalCorrect: number;
  totalAnswered: number;
  errors: Array<{
    questionId: string;
    patternId: string;
    dayNumber: number;
    timestamp: number;
  }>;
  patternStats: Record<string, { correct: number; wrong: number }>;
}

interface DayProgress {
  signalsCompleted: boolean;
  patternsCompleted: boolean;
  testCompleted: boolean;
  testScore: number | null;
}

interface ProgressContextType {
  progress: UserProgress;
  dayProgress: Record<number, DayProgress>;
  setCurrentDay: (day: number) => void;
  completeDay: (dayNumber: number) => void;
  completeSignals: (dayNumber: number) => void;
  completePatterns: (dayNumber: number) => void;
  completeTest: (dayNumber: number, score: number, errors: Array<{ questionId: string; patternId: string }>) => void;
  activatePremium: (code: string) => boolean;
  addError: (error: { questionId: string; patternId: string; dayNumber: number }) => void;
  clearErrors: () => void;
  getWeakPatterns: () => Array<{ patternId: string; errorCount: number }>;
  isDayAvailable: (dayNumber: number) => boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const VALID_CODES = ['CBT2024', 'NAILMASTER', 'PREMIUM28'];

const defaultProgress: UserProgress = {
  currentDay: 1,
  completedDays: [],
  activationCode: null,
  isPremium: false,
  lastTestScore: null,
  streak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  errors: [],
  patternStats: {},
};

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('userProgress');
    return saved ? JSON.parse(saved) : defaultProgress;
  });

  const [dayProgress, setDayProgress] = useState<Record<number, DayProgress>>(() => {
    const saved = localStorage.getItem('dayProgress');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('userProgress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('dayProgress', JSON.stringify(dayProgress));
  }, [dayProgress]);

  const setCurrentDay = (day: number) => {
    setProgress(prev => ({ ...prev, currentDay: day }));
  };

  const completeDay = (dayNumber: number) => {
    setProgress(prev => ({
      ...prev,
      completedDays: prev.completedDays.includes(dayNumber) 
        ? prev.completedDays 
        : [...prev.completedDays, dayNumber],
      currentDay: Math.max(prev.currentDay, dayNumber + 1),
    }));
  };

  const completeSignals = (dayNumber: number) => {
    setDayProgress(prev => ({
      ...prev,
      [dayNumber]: {
        ...prev[dayNumber],
        signalsCompleted: true,
        patternsCompleted: prev[dayNumber]?.patternsCompleted || false,
        testCompleted: prev[dayNumber]?.testCompleted || false,
        testScore: prev[dayNumber]?.testScore || null,
      },
    }));
  };

  const completePatterns = (dayNumber: number) => {
    setDayProgress(prev => ({
      ...prev,
      [dayNumber]: {
        ...prev[dayNumber],
        signalsCompleted: prev[dayNumber]?.signalsCompleted || false,
        patternsCompleted: true,
        testCompleted: prev[dayNumber]?.testCompleted || false,
        testScore: prev[dayNumber]?.testScore || null,
      },
    }));
  };

  const completeTest = (dayNumber: number, score: number, errors: Array<{ questionId: string; patternId: string }>) => {
    const newPatternStats = { ...progress.patternStats };
    
    errors.forEach(error => {
      if (!newPatternStats[error.patternId]) {
        newPatternStats[error.patternId] = { correct: 0, wrong: 0 };
      }
      newPatternStats[error.patternId].wrong += 1;
    });

    setDayProgress(prev => ({
      ...prev,
      [dayNumber]: {
        signalsCompleted: true,
        patternsCompleted: true,
        testCompleted: true,
        testScore: score,
      },
    }));

    setProgress(prev => ({
      ...prev,
      lastTestScore: score,
      patternStats: newPatternStats,
      errors: [
        ...prev.errors,
        ...errors.map(e => ({ ...e, dayNumber, timestamp: Date.now() })),
      ],
    }));

    if (score >= 70) {
      completeDay(dayNumber);
    }
  };

  const activatePremium = (code: string): boolean => {
    const isValid = VALID_CODES.includes(code.toUpperCase());
    if (isValid) {
      setProgress(prev => ({
        ...prev,
        activationCode: code,
        isPremium: true,
      }));
    }
    return isValid;
  };

  const addError = (error: { questionId: string; patternId: string; dayNumber: number }) => {
    setProgress(prev => ({
      ...prev,
      errors: [...prev.errors, { ...error, timestamp: Date.now() }],
    }));
  };

  const clearErrors = () => {
    setProgress(prev => ({ ...prev, errors: [] }));
  };

  const getWeakPatterns = () => {
    const patternErrors: Record<string, number> = {};
    progress.errors.forEach(error => {
      patternErrors[error.patternId] = (patternErrors[error.patternId] || 0) + 1;
    });
    return Object.entries(patternErrors)
      .map(([patternId, errorCount]) => ({ patternId, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount);
  };

  const isDayAvailable = (dayNumber: number): boolean => {
    if (dayNumber <= 3) return true; // Free days
    if (progress.isPremium) return true;
    return false;
  };

  return (
    <ProgressContext.Provider
      value={{
        progress,
        dayProgress,
        setCurrentDay,
        completeDay,
        completeSignals,
        completePatterns,
        completeTest,
        activatePremium,
        addError,
        clearErrors,
        getWeakPatterns,
        isDayAvailable,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
