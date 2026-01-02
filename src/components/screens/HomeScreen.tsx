import { useSettings } from '@/contexts/SettingsContext';
import { ArrowRight, Dumbbell, RotateCcw, Trophy, Flame, Target, HelpCircle, Type } from 'lucide-react';
import courseData from '@/data/courseDays.json';

// ... (imports remain)

interface HomeScreenProps {
  onContinue: (dayNumber: number) => void;
  onTrainer: () => void;
  onErrors: () => void;
  onDayList: () => void;
  onTutorial: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onContinue,
  onTrainer,
  onErrors,
  onDayList,
  onTutorial,
}) => {
  const { t } = useLanguage();
  const { progress, dayProgress, isDayAvailable } = useProgress();
  const { settings, toggleAccessibilityMode } = useSettings();
  const [showPayment, setShowPayment] = useState(false);

  // ... (rest of logic)

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden pb-6">
      <Particles count={20} />

      {/* Header */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('home.greeting')}</p>
            <h1 className="text-2xl font-bold gradient-text">
              {t('common.day')} {currentDay}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAccessibilityMode}
              className={`p-2 rounded-lg transition-colors ${settings.isAccessibilityMode ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
              title="Крупный шрифт"
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={onTutorial}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              title="Как это работает?"
            >
              <HelpCircle className="w-5 h-5 text-primary" />
            </button>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 space-y-4 relative z-10">
        {/* Progress Ring Card */}
        <GlassCard className="flex items-center gap-6 p-6" hover onClick={onDayList}>
          <ProgressRing progress={overallProgress} size={100}>
            <div className="text-center">
              <span className="text-2xl font-bold">{overallProgress}%</span>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{t('home.progress')}</p>
            <p className="text-lg font-semibold">{completedCount} / {totalDays} {t('home.daysCompleted')}</p>
            {lastScore !== null && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('home.lastTest')}: <span className="text-success font-medium">{lastScore}%</span> {t('home.correct')}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Current Day Card */}
        <GlassCard
          className="relative overflow-hidden p-0"
          hover
          onClick={handleContinue}
        >
          <div className="absolute inset-0">
            <img
              src={currentDayImage}
              alt={currentDayTitle}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
          </div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Сегодня</p>
                <h2 className="text-xl font-bold">{currentDayTitle}</h2>
              </div>
              <div className="text-4xl font-extrabold gradient-text">{currentDay}</div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{motivationalMessage}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary transition-all duration-500"
                  style={{
                    width: dayProgress[currentDay]?.testCompleted
                      ? '100%'
                      : dayProgress[currentDay]?.patternsCompleted
                        ? '66%'
                        : dayProgress[currentDay]?.signalsCompleted
                          ? '33%'
                          : '0%'
                  }}
                />
              </div>
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </div>
        </GlassCard>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="text-center p-4">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-warning" />
            <p className="text-lg font-bold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">{t('home.accuracy')}</p>
          </GlassCard>
          <GlassCard className="text-center p-4">
            <Flame className="w-6 h-6 mx-auto mb-2 text-destructive" />
            <p className="text-lg font-bold">{progress.streak}</p>
            <p className="text-xs text-muted-foreground">{t('home.streak')}</p>
          </GlassCard>
          <GlassCard className="text-center p-4">
            <Target className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-lg font-bold">{progress.errors.length}</p>
            <p className="text-xs text-muted-foreground">{t('home.errors')}</p>
          </GlassCard>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleContinue}
          >
            {t('home.continue')} {t('common.day')} {currentDay}
            <ArrowRight className="w-5 h-5" />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="gradientSuccess"
              size="default"
              className="w-full"
              onClick={onTrainer}
            >
              <Dumbbell className="w-5 h-5" />
              {t('home.training')}
            </Button>
            <Button
              variant="gradientWarning"
              size="default"
              className="w-full"
              onClick={onErrors}
              disabled={progress.errors.length === 0}
            >
              <RotateCcw className="w-5 h-5" />
              {t('home.errors')}
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
};
