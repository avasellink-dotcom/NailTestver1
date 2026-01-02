import React, { useState, useEffect } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProgressProvider, useProgress } from '@/contexts/ProgressContext';
import { useTelegram } from '@/hooks/useTelegram';
import { OnboardingScreen } from '@/components/screens/OnboardingScreen';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { DayListScreen } from '@/components/screens/DayListScreen';
import { LessonScreen } from '@/components/screens/LessonScreen';
import { TrainerScreen } from '@/components/screens/TrainerScreen';
import { ActivationScreen } from '@/components/screens/ActivationScreen';
import { TutorialScreen } from '@/components/screens/TutorialScreen';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

type Screen = 'onboarding' | 'home' | 'dayList' | 'lesson' | 'trainer' | 'errors' | 'activation' | 'tutorial';

const AppContent: React.FC = () => {
  const { tg, user } = useTelegram();

  const [screen, setScreen] = useState<Screen>('home');
  const [isCheckingActivation, setIsCheckingActivation] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    const checkActivation = async () => {
      // 1. Initial Launch Date Setup
      let firstLaunchAt = localStorage.getItem('first_launch_at');
      if (!firstLaunchAt) {
        firstLaunchAt = new Date().toISOString();
        localStorage.setItem('first_launch_at', firstLaunchAt);
      }

      // 2. Trial Period Check (2 days = 172800000 ms)
      const trialDuration = 2 * 24 * 60 * 60 * 1000;
      const launchDate = new Date(firstLaunchAt).getTime();
      const now = new Date().getTime();
      const isTrialActive = (now - launchDate) < trialDuration;

      // 3. Check local storage for permanent activation
      const localActivated = localStorage.getItem('app_activated');
      if (localActivated === 'true' || isTrialActive) {
        determineInitialScreen();
        setIsCheckingActivation(false);
        return;
      }

      // 4. Check Supabase by telegram_id
      if (user?.id && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('activation_codes')
            .select('is_used')
            .eq('telegram_id', user.id)
            .eq('is_used', true)
            .maybeSingle();

          if (data) {
            localStorage.setItem('app_activated', 'true');
            determineInitialScreen();
            setIsCheckingActivation(false);
            return;
          }
        } catch (err) {
          console.error('Activation check error:', err);
          setScreen('activation');
          setIsCheckingActivation(false);
          return;
        }
      }

      // 5. Not activated and trial expired
      setScreen('activation');
      setIsCheckingActivation(false);
    };

    const determineInitialScreen = () => {
      const hasStarted = localStorage.getItem('hasStarted');
      setScreen(hasStarted ? 'home' : 'onboarding');
    };

    if (tg) {
      tg.ready();
      tg.expand();
    }

    checkActivation();
  }, [tg, user]);

  const handleStartCourse = () => {
    localStorage.setItem('hasStarted', 'true');
    setScreen('home');
  };

  const handleSelectDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setScreen('lesson');
  };

  const handleLessonComplete = () => {
    setScreen('home');
  };

  const handleActivationComplete = () => {
    const hasStarted = localStorage.getItem('hasStarted');
    setScreen(hasStarted ? 'home' : 'onboarding');
  };

  if (isCheckingActivation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {screen === 'activation' && (
        <ActivationScreen onActivate={handleActivationComplete} />
      )}
      {screen === 'onboarding' && (
        <OnboardingScreen onStart={handleStartCourse} />
      )}
      {screen === 'home' && (
        <HomeScreen
          onContinue={handleSelectDay}
          onTrainer={() => setScreen('trainer')}
          onErrors={() => setScreen('errors')}
          onDayList={() => setScreen('dayList')}
          onTutorial={() => setScreen('tutorial')}
        />
      )}
      {screen === 'tutorial' && (
        <TutorialScreen onComplete={() => setScreen('home')} />
      )}
      {screen === 'dayList' && (
        <DayListScreen
          onBack={() => setScreen('home')}
          onSelectDay={handleSelectDay}
        />
      )}
      {screen === 'lesson' && (
        <LessonScreen
          dayNumber={selectedDay}
          onBack={() => setScreen('home')}
          onComplete={handleLessonComplete}
        />
      )}
      {screen === 'trainer' && (
        <TrainerScreen
          onBack={() => setScreen('home')}
          onSelectMode={(mode) => console.log('Selected mode:', mode)}
        />
      )}
      {screen === 'errors' && (
        <TrainerScreen
          onBack={() => setScreen('home')}
          onSelectMode={(mode) => console.log('Selected mode:', mode)}
        />
      )}
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <LanguageProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </LanguageProvider>
  );
};

export default Index;
