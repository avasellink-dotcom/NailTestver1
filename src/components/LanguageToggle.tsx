import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 glass-card rounded-full p-1">
      <button
        onClick={() => setLanguage('ru')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          language === 'ru'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="text-base">🇷🇺</span>
        <span>RU</span>
      </button>
      <button
        onClick={() => setLanguage('ko')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          language === 'ko'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="text-base">🇰🇷</span>
        <span>KO</span>
      </button>
    </div>
  );
};
