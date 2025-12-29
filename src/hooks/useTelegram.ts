import { useEffect, useCallback } from 'react';

export const useTelegram = () => {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (tg?.MainButton) {
      tg.MainButton.setText(text);
      tg.MainButton.show();
      tg.MainButton.onClick(onClick);
    }
  }, [tg]);

  const hideMainButton = useCallback(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg]);

  const showBackButton = useCallback((onClick: () => void) => {
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(onClick);
    }
  }, [tg]);

  const hideBackButton = useCallback(() => {
    if (tg?.BackButton) {
      tg.BackButton.hide();
    }
  }, [tg]);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (tg?.HapticFeedback) {
      if (['success', 'warning', 'error'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error');
      } else {
        tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
      }
    }
  }, [tg]);

  const openTelegramLink = useCallback((username: string) => {
    if (tg) {
      tg.openTelegramLink(`https://t.me/${username}`);
    } else {
      window.open(`https://t.me/${username}`, '_blank');
    }
  }, [tg]);

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    colorScheme: tg?.colorScheme || 'dark',
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    openTelegramLink,
  };
};
