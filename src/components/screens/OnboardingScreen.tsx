import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/Particles';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ArrowRight, Target, Key, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-key-lock.png';

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  const { t } = useLanguage();

  const steps = [
    { icon: Target, text: t('onboarding.step1'), color: 'text-primary' },
    { icon: Key, text: t('onboarding.step2'), color: 'text-accent' },
    { icon: Zap, text: t('onboarding.step3'), color: 'text-success' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Particles count={30} />
      
      {/* Header */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Hero Image */}
        <div className="w-64 h-64 mb-8 animate-float">
          <img 
            src={heroImage} 
            alt="Lock and Key" 
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-4 animate-fade-in-up">
          <span className="gradient-text">{t('onboarding.title')}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-muted-foreground text-center mb-8 max-w-md animate-fade-in-up stagger-1">
          {t('onboarding.subtitle')}
        </p>

        {/* Steps */}
        <div className="w-full max-w-sm space-y-3 mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: `${(index + 2) * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl gradient-primary flex items-center justify-center`}>
                <step.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-muted-foreground">{index + 1}.</span>
                <span className="text-sm font-medium">{step.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Promise */}
        <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm animate-fade-in-up stagger-5">
          {t('onboarding.promise')}
        </p>

        {/* CTA Button */}
        <Button
          variant="hero"
          size="xl"
          onClick={onStart}
          className="animate-fade-in-up w-full max-w-sm"
          style={{ animationDelay: '0.6s' }}
        >
          {t('onboarding.start')}
          <ArrowRight className="w-6 h-6 ml-2" />
        </Button>
      </div>
    </div>
  );
};
