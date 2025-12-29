import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { X, Copy, Check, MessageCircle, Key } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { activatePremium } = useProgress();
  const { openTelegramLink, hapticFeedback } = useTelegram();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const cardNumber = '9500 0212 4729 8';

  const handleCopy = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopied(true);
    hapticFeedback('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = () => {
    if (activatePremium(code)) {
      setSuccess(true);
      hapticFeedback('success');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCode('');
      }, 2000);
    } else {
      setError('Неверный код');
      hapticFeedback('error');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleOpenTelegram = () => {
    openTelegramLink('avasellink');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <GlassCard className="w-full max-w-md relative overflow-hidden">
        {success ? (
          <div className="text-center py-8 animate-scale-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold gradient-text mb-2">
              {t('payment.success')}
            </h2>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold gradient-text mb-6 pr-8">
              {t('payment.title')}
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">{t('payment.step1')}</p>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={handleCopy}
                    className="w-full justify-between"
                  >
                    <span className="font-mono">{cardNumber}</span>
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  {copied && (
                    <p className="text-xs text-success mt-1">{t('payment.copied')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{t('payment.recipient')}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">{t('payment.step2')}</p>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={handleOpenTelegram}
                    className="w-full justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    @avasellink
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <p className="text-sm text-muted-foreground">{t('payment.step3')}</p>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">{t('payment.step4')}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="XXXXXXXX"
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      />
                    </div>
                    <Button
                      variant="gradient"
                      onClick={handleActivate}
                      disabled={!code}
                    >
                      {t('payment.activate')}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-destructive mt-1">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
};
