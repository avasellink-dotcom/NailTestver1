import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Onboarding
    'onboarding.title': 'Система «Замок-ключ»',
    'onboarding.subtitle': 'Сдай CBT экзамен за 28 дней, тренируя не память, а реакцию.',
    'onboarding.step1': 'Увидел СИГНАЛ в вопросе',
    'onboarding.step2': 'Применил ПАТТЕРН (готовое правило)',
    'onboarding.step3': 'Мгновенно выбрал правильный ответ',
    'onboarding.promise': 'Твой мозг запомнит связки автоматически. Уже через 3 дня ты заметишь, как быстро узнаёшь ловушки.',
    'onboarding.start': 'Начать День 1',

    // Home
    'home.greeting': 'Ты на Дне',
    'home.progress': 'Пройдено',
    'home.lastTest': 'Последний тест',
    'home.correct': 'правильных',
    'home.continue': 'Продолжить',
    'home.training': 'Тренировка',
    'home.errors': 'Ошибки',
    'home.daysCompleted': 'Дней пройдено',
    'home.accuracy': 'Точность',
    'home.streak': 'Серия',

    // Days
    'days.title': 'Все дни курса',
    'days.completed': 'Пройден',
    'days.locked': 'Заблокирован',
    'days.available': 'Доступен',
    'days.signals': 'Сигналы',
    'days.patterns': 'Паттерны',
    'days.test': 'Тест',

    // Lesson
    'lesson.signals': 'Сигналы дня',
    'lesson.patterns': 'Паттерны дня',
    'lesson.test': 'Тест',
    'lesson.next': 'Далее',
    'lesson.finish': 'Завершить',
    'lesson.question': 'Вопрос',
    'lesson.of': 'из',

    // Results
    'result.excellent': 'Отличная работа!',
    'result.good': 'Хороший результат!',
    'result.needPractice': 'Не останавливайся!',
    'result.correct': 'правильных ответов',
    'result.moving': 'Ты уверенно движешься к цели!',
    'result.start': 'это старт.',
    'result.mistakes': 'Ошибки — это нормально, они делают тебя сильнее.',
    'result.seen': 'Ты увидел, где нужна практика.',
    'result.weakPoints': 'Слабые места:',
    'result.repeat': 'Повторить ошибки',
    'result.nextDay': 'Следующий День',
    'result.pattern': 'Паттерн',
    'result.errorsCount': 'ошибок',

    // Trainer
    'trainer.title': 'Тренажёр',
    'trainer.random': 'Случайные',
    'trainer.randomDesc': 'Вопросы из всех тем',
    'trainer.weak': 'Слабые места',
    'trainer.weakDesc': 'Паттерны с ошибками',
    'trainer.exam': 'Экзамен 60',
    'trainer.examDesc': '60 вопросов за 60 минут',
    'trainer.review': 'Повторение',
    'trainer.reviewDesc': 'Все пройденные вопросы',

    // Payment
    'payment.title': 'Открой доступ ко всем 28 дням',
    'payment.step1': 'Переведи 40000₩ на карту Jeonbuk Bank',
    'payment.recipient': 'Получатель: DMITRIYYU',
    'payment.copy': 'Скопировать номер',
    'payment.step2': 'Отправь скриншот в личку',
    'payment.step3': 'Получи код активации',
    'payment.step4': 'Введи код:',
    'payment.activate': 'Активировать',
    'payment.success': 'Все дни разблокированы!',
    'payment.copied': 'Скопировано!',

    // Common
    'common.back': 'Назад',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успех',
    'common.day': 'День',
  },
  ko: {
    // Onboarding
    'onboarding.title': '「자물쇠-열쇠」 시스템',
    'onboarding.subtitle': '28일 만에 CBT 시험 합격, 암기가 아닌 반응 훈련으로.',
    'onboarding.step1': '문제에서 신호를 발견',
    'onboarding.step2': '패턴(준비된 규칙) 적용',
    'onboarding.step3': '즉시 정답 선택',
    'onboarding.promise': '뇌가 자동으로 연결을 기억합니다. 3일 후면 함정을 빠르게 알아차리게 됩니다.',
    'onboarding.start': '1일차 시작',

    // Home
    'home.greeting': '현재',
    'home.progress': '완료',
    'home.lastTest': '마지막 테스트',
    'home.correct': '정답',
    'home.continue': '계속하기',
    'home.training': '연습',
    'home.errors': '오류',
    'home.daysCompleted': '완료한 일수',
    'home.accuracy': '정확도',
    'home.streak': '연속',

    // Days
    'days.title': '전체 과정',
    'days.completed': '완료',
    'days.locked': '잠김',
    'days.available': '이용 가능',
    'days.signals': '신호',
    'days.patterns': '패턴',
    'days.test': '테스트',

    // Lesson
    'lesson.signals': '오늘의 신호',
    'lesson.patterns': '오늘의 패턴',
    'lesson.test': '테스트',
    'lesson.next': '다음',
    'lesson.finish': '완료',
    'lesson.question': '문제',
    'lesson.of': '/',

    // Results
    'result.excellent': '훌륭합니다!',
    'result.good': '좋은 결과!',
    'result.needPractice': '멈추지 마세요!',
    'result.correct': '정답',
    'result.moving': '목표를 향해 자신있게 나아가고 있습니다!',
    'result.start': '이것은 시작입니다.',
    'result.mistakes': '실수는 괜찮습니다, 더 강해지게 합니다.',
    'result.seen': '연습이 필요한 곳을 확인했습니다.',
    'result.weakPoints': '약점:',
    'result.repeat': '오류 복습',
    'result.nextDay': '다음 날',
    'result.pattern': '패턴',
    'result.errorsCount': '오류',

    // Trainer
    'trainer.title': '트레이너',
    'trainer.random': '무작위',
    'trainer.randomDesc': '모든 주제의 질문',
    'trainer.weak': '약점',
    'trainer.weakDesc': '오류가 있는 패턴',
    'trainer.exam': '시험 60',
    'trainer.examDesc': '60분에 60문제',
    'trainer.review': '복습',
    'trainer.reviewDesc': '모든 완료된 질문',

    // Payment
    'payment.title': '28일 전체 액세스 잠금 해제',
    'payment.step1': 'Jeonbuk Bank 카드로 40000₩ 이체',
    'payment.recipient': '수취인: DMITRIYYU',
    'payment.copy': '번호 복사',
    'payment.step2': 'DM으로 스크린샷 보내기',
    'payment.step3': '활성화 코드 받기',
    'payment.step4': '코드 입력:',
    'payment.activate': '활성화',
    'payment.success': '모든 날이 잠금 해제되었습니다!',
    'payment.copied': '복사됨!',

    // Common
    'common.back': '뒤로',
    'common.loading': '로딩...',
    'common.error': '오류',
    'common.success': '성공',
    'common.day': '일',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ru';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'ru' || saved === 'ko') {
      setLanguageState(saved);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
