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
  reviews: Array<{
    patternId: string;
    nextReview: number; // Timestamp
    interval: number; // Days
    easeFactor: number;
    history: number[]; // Previous intervals
  }>;
}

interface DayProgress {
  abcCompleted: boolean;
  abcScore: number;
  testUnlocked: boolean;
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
  completeAbc: (dayNumber: number, score: number) => void;
  completeSignals: (dayNumber: number) => void;
  completePatterns: (dayNumber: number) => void;
  completeTest: (dayNumber: number, score: number, errors: Array<{ questionId: string; patternId: string }>, correctIds: string[]) => void;
  activatePremium: (code: string) => boolean;
  addError: (error: { questionId: string; patternId: string; dayNumber: number }) => void;
  clearErrors: () => void;
  getWeakPatterns: () => Array<{ patternId: string; errorCount: number }>;
  getDueReviews: () => Array<{ patternId: string; nextReview: number }>;
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
  reviews: [],
};

const INITIAL_EASE_FACTOR = 2.5;
const INITIAL_INTERVAL = 1; // 1 day

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('userProgress');
    return saved ? { ...defaultProgress, ...JSON.parse(saved) } : defaultProgress;
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

  const completeAbc = (dayNumber: number, score: number) => {
    setDayProgress(prev => ({
      ...prev,
      [dayNumber]: {
        ...prev[dayNumber],
        abcCompleted: true,
        abcScore: score,
        testUnlocked: score >= 0.7,
        signalsCompleted: prev[dayNumber]?.signalsCompleted || false,
        patternsCompleted: prev[dayNumber]?.patternsCompleted || false,
        testCompleted: prev[dayNumber]?.testCompleted || false,
        testScore: prev[dayNumber]?.testScore || null,
      },
    }));
  };

  const completeSignals = (dayNumber: number) => {
    setDayProgress(prev => ({
      ...prev,
      [dayNumber]: {
        ...prev[dayNumber],
        abcCompleted: prev[dayNumber]?.abcCompleted || false,
        abcScore: prev[dayNumber]?.abcScore || 0,
        testUnlocked: prev[dayNumber]?.testUnlocked || false,
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
        abcCompleted: prev[dayNumber]?.abcCompleted || false,
        abcScore: prev[dayNumber]?.abcScore || 0,
        testUnlocked: prev[dayNumber]?.testUnlocked || false,
        signalsCompleted: prev[dayNumber]?.signalsCompleted || false,
        patternsCompleted: true,
        testCompleted: prev[dayNumber]?.testCompleted || false,
        testScore: prev[dayNumber]?.testScore || null,
      },
    }));
  };

  const scheduleReview = (patternId: string, isCorrect: boolean) => {
    setProgress(prev => {
      const existingReview = prev.reviews?.find(r => r.patternId === patternId);

      let nextReview: number;
      let interval: number;
      let easeFactor: number;
      let history: number[];

      if (!existingReview) {
        // First time seeing or reviewing this pattern
        interval = isCorrect ? INITIAL_INTERVAL : 0.5; // 0.5 day penalty if wrong first time? Or just 0
        easeFactor = INITIAL_EASE_FACTOR;
        history = [];
      } else {
        easeFactor = existingReview.easeFactor;
        history = existingReview.history;

        if (isCorrect) {
          // SM-2 simplified
          if (existingReview.interval === 0) {
            interval = 1;
          } else if (existingReview.interval === 1) {
            interval = 6;
          } else {
            interval = Math.round(existingReview.interval * easeFactor);
          }
          // Cap ease factor changes slightly if needed, but for now simple mult
        } else {
          // Wrong answer resets interval relative to difficulty
          interval = 1;
          easeFactor = Math.max(1.3, easeFactor - 0.2); // Decrease ease
        }
      }

      // Calculate next review timestamp (Days -> Milliseconds)
      nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

      const newReview = {
        patternId,
        nextReview,
        interval,
        easeFactor,
        history: [...history, interval]
      };

      const otherReviews = prev.reviews ? prev.reviews.filter(r => r.patternId !== patternId) : [];

      return {
        ...prev,
        reviews: [...otherReviews, newReview]
      };
    });
  };

  const completeTest = (dayNumber: number, score: number, errors: Array<{ questionId: string; patternId: string }>, correctIds?: string[]) => {
    const newPatternStats = { ...progress.patternStats };

    // Process errors for stats
    errors.forEach(error => {
      if (!newPatternStats[error.patternId]) {
        newPatternStats[error.patternId] = { correct: 0, wrong: 0 };
      }
      newPatternStats[error.patternId].wrong += 1;
      // Schedule immediate re-review (failure)
      scheduleReview(error.patternId, false);
    });

    // Process correct answers for SRS (if provided)
    if (correctIds) {
      correctIds.forEach(patternId => {
        if (patternId) {
          if (!newPatternStats[patternId]) {
            newPatternStats[patternId] = { correct: 0, wrong: 0 };
          }
          newPatternStats[patternId].correct += 1;
          scheduleReview(patternId, true);
        }
      });
    }

    setDayProgress(prev => ({
      ...prev,
      [dayNumber]: {
        ...prev[dayNumber],
        abcCompleted: prev[dayNumber]?.abcCompleted || true,
        abcScore: prev[dayNumber]?.abcScore || 1,
        testUnlocked: true,
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
    // Explicitly mark as failed review
    scheduleReview(error.patternId, false);
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

  const getDueReviews = () => {
    if (!progress.reviews) return [];
    const now = Date.now();
    return progress.reviews
      .filter(r => r.nextReview <= now)
      .sort((a, b) => a.nextReview - b.nextReview);
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
        completeAbc,
        completeSignals,
        completePatterns,
        completeTest,
        activatePremium,
        addError,
        clearErrors,
        getWeakPatterns,
        getDueReviews,
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
