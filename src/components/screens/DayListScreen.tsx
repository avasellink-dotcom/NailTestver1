import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/contexts/ProgressContext';
import { GlassCard } from '@/components/GlassCard';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Particles } from '@/components/Particles';
import { PaymentModal } from '@/components/PaymentModal';
import { ArrowLeft, Check, Lock, ChevronRight, Zap, Key, BookOpen } from 'lucide-react';
import courseData from '@/data/courseDays.json';

// Import day images
import day1Image from '@/assets/day-1.png';
import day2Image from '@/assets/day-2.png';
import day3Image from '@/assets/day-3.png';

interface DayData {
  dayNumber: number;
  emoji: string;
  title: string;
  titleKo?: string;
  titleRu?: string;
  signals?: any[];
  patterns?: any[];
  questions?: any[];
}

interface DayListScreenProps {
  onBack: () => void;
  onSelectDay: (dayNumber: number) => void;
}

export const DayListScreen: React.FC<DayListScreenProps> = ({ onBack, onSelectDay }) => {
  const { t } = useLanguage();
  const { progress, dayProgress, isDayAvailable } = useProgress();
  const [showPayment, setShowPayment] = useState(false);

  const dayImages: Record<number, string> = {
    1: day1Image,
    2: day2Image,
    3: day3Image,
  };

  const getDefaultImage = (dayNumber: number) => {
    const mod = (dayNumber - 1) % 3;
    return mod === 0 ? day1Image : mod === 1 ? day2Image : day3Image;
  };

  const handleDayClick = (dayNumber: number) => {
    if (isDayAvailable(dayNumber)) {
      onSelectDay(dayNumber);
    } else {
      setShowPayment(true);
    }
  };

  const getDayStatus = (dayNumber: number) => {
    if (progress.completedDays.includes(dayNumber)) return 'completed';
    if (!isDayAvailable(dayNumber)) return 'locked';
    return 'available';
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden pb-6">
      <Particles count={15} />

      {/* Header */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">28-дневный курс</h1>
          <LanguageToggle />
        </div>
      </div>

      {/* Day Grid */}
      <div className="flex-1 px-4 relative z-10 overflow-y-auto scrollbar-hide">
        <div className="grid gap-4">
          {(courseData as DayData[]).map((day) => {
            const status = getDayStatus(day.dayNumber);
            const dp = dayProgress[day.dayNumber];
            const image = dayImages[day.dayNumber] || getDefaultImage(day.dayNumber);
            const isLocked = status === 'locked';

            const signalsCount = day.signals?.length || 0;
            const patternsCount = day.patterns?.length || 0;
            const questionsCount = day.questions?.length || 0;

            // Get display title
            const displayTitle = day.titleRu || day.title;
            const isReviewDay = day.title.includes('REVIEW');

            return (
              <GlassCard
                key={day.dayNumber}
                className={`relative overflow-hidden p-0 ${isLocked ? 'opacity-70' : ''}`}
                hover={!isLocked}
                onClick={() => handleDayClick(day.dayNumber)}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={image}
                    alt={displayTitle}
                    className={`w-full h-full object-cover ${isLocked ? 'blur-sm' : ''}`}
                    style={{ opacity: 0.25 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/60" />
                </div>

                {/* Content */}
                <div className="relative p-4 flex items-center gap-4">
                  {/* Day Number */}
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center text-xl font-extrabold
                    ${status === 'completed' ? 'gradient-success' :
                      status === 'locked' ? 'bg-muted' : 'gradient-primary'}
                  `}>
                    {status === 'completed' ? (
                      <Check className="w-7 h-7 text-success-foreground" />
                    ) : status === 'locked' ? (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <span className="text-primary-foreground">{day.dayNumber}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{day.emoji}</span>
                      <h3 className="font-semibold truncate">{displayTitle}</h3>
                    </div>

                    {/* Content counts */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {signalsCount > 0 && (
                        <span className={`flex items-center gap-1 ${dp?.signalsCompleted ? 'text-cyan-400' : ''}`}>
                          <Zap className="w-3 h-3" />
                          {signalsCount}
                        </span>
                      )}
                      {patternsCount > 0 && (
                        <span className={`flex items-center gap-1 ${dp?.patternsCompleted ? 'text-green-400' : ''}`}>
                          <Key className="w-3 h-3" />
                          {patternsCount}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 ${dp?.testCompleted ? 'text-purple-400' : ''}`}>
                        <BookOpen className="w-3 h-3" />
                        {questionsCount}
                      </span>
                      {dp?.testCompleted && dp.testScore !== null && (
                        <span className="font-medium text-success">
                          {dp.testScore}%
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="mt-2">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${status === 'completed' ? 'bg-success/20 text-success' :
                          status === 'locked' ? 'bg-muted text-muted-foreground' :
                            isReviewDay ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/20 text-primary'}
                      `}>
                        {status === 'completed' ? 'Завершён' :
                          status === 'locked' ? 'Заблокирован' :
                            isReviewDay ? 'Повторение' : 'Доступен'}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  {!isLocked && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
};
