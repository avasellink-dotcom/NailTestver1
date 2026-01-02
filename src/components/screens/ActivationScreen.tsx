import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { Particles } from '@/components/Particles';
import { Key, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useTelegram } from '@/hooks/useTelegram';

interface ActivationScreenProps {
    onActivate: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivate }) => {
    const { t } = useLanguage();
    const { user, hapticFeedback } = useTelegram();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleActivate = async () => {
        if (!isSupabaseConfigured) {
            setError('Система активации временно недоступна (ошибка конфигурации)');
            setIsLoading(false);
            return;
        }
        if (!code.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            // 1. Check if code exists and is not used
            const { data, error: fetchError } = await supabase
                .from('activation_codes')
                .select('*')
                .eq('code', code.trim().toUpperCase())
                .single();

            if (fetchError || !data) {
                throw new Error('Некорректный или уже использованный код');
            }

            if (data.is_used) {
                throw new Error('Этот код уже был активирован');
            }

            // 2. Activate the code
            const { error: updateError } = await supabase
                .from('activation_codes')
                .update({
                    is_used: true,
                    telegram_id: user?.id || null,
                    activated_at: new Date().toISOString(),
                })
                .eq('id', data.id);

            if (updateError) {
                throw new Error('Ошибка активации. Попробуйте позже.');
            }

            // 3. Success
            hapticFeedback('success');
            localStorage.setItem('app_activated', 'true');
            if (user?.id) {
                localStorage.setItem('activated_tg_id', user.id.toString());
            }
            onActivate();
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка');
            hapticFeedback('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
            <Particles count={20} />

            <div className="relative z-10 w-full max-w-md animate-scale-in">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                        <Key className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-3">Активация доступа</h1>
                    <p className="text-muted-foreground">
                        Для использования курса необходимо ввести персональный код активации.
                    </p>
                </div>

                <GlassCard className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Введите промокод
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="NAIL-XXXX-XXXX"
                                    disabled={isLoading}
                                    className="w-full h-14 pl-4 pr-4 rounded-xl bg-secondary border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg animate-fade-in text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Button
                            variant="gradient"
                            className="w-full h-14 text-lg font-bold"
                            onClick={handleActivate}
                            disabled={isLoading || !code.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                'Активировать'
                            )}
                        </Button>

                        <div className="pt-4 border-t border-border/50">
                            <p className="text-xs text-center text-muted-foreground">
                                Нет кода? Обратитесь к администратору в Telegram:
                                <br />
                                <a
                                    href="https://t.me/avasellink"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium"
                                >
                                    @avasellink
                                </a>
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {user && (
                    <p className="mt-8 text-center text-xs text-muted-foreground opacity-50">
                        ID: {user.id} {user.username && `| @${user.username}`}
                    </p>
                )}
            </div>
        </div>
    );
};
