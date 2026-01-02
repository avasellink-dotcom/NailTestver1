import React, { useState, useEffect } from 'react';
import { supabase, ActivationCode, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { Copy, Check, RefreshCw, Loader2, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const AdminScreen: React.FC = () => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [codes, setCodes] = useState<ActivationCode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            fetchCodes();
        } else {
            toast.error('Неверный пароль');
        }
    };

    const fetchCodes = async () => {
        if (!isSupabaseConfigured) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('activation_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCodes(data || []);
        } catch (err: any) {
            toast.error('Ошибка загрузки кодов: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateCode = async () => {
        if (!isSupabaseConfigured) {
            toast.error('Supabase не настроен. Проверьте переменные окружения.');
            return;
        }
        setIsGenerating(true);
        try {
            // Format: NAIL-XXXX-XXXX
            const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
            const code = `NAIL-${randomPart()}-${randomPart()}`;

            // Prepare insert data WITHOUT telegram_id
            const insertData = {
                code: code,
                is_used: false
            };

            // Insert into database - use array syntax for better compatibility
            const { data, error } = await supabase
                .from('activation_codes')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            setCodes([data, ...codes]);
            toast.success('Код успешно сгенерирован');
        } catch (err: any) {
            toast.error('Ошибка генерации: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success('Код скопирован');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <GlassCard className="w-full max-w-sm p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Введите пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-center"
                        />
                        <Button type="submit" className="w-full h-12">Войти</Button>
                    </form>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Управление кодами</h1>
                        <p className="text-sm text-muted-foreground">Всего кодов: {codes.length}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAuthenticated(false)}
                        className="gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Выйти
                    </Button>
                </header>

                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className="font-semibold text-lg">Генерация нового кода</h3>
                            <p className="text-xs text-muted-foreground">Формат: NAIL-XXXX-XXXX</p>
                        </div>
                        <Button
                            onClick={generateCode}
                            disabled={isGenerating}
                            className="w-full sm:w-auto gap-2"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Сгенерировать код
                        </Button>
                    </div>
                </GlassCard>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-medium">Список кодов</h3>
                        <button onClick={fetchCodes} className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {isLoading && codes.length === 0 ? (
                            <div className="py-10 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Загрузка...</p>
                            </div>
                        ) : codes.length === 0 ? (
                            <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl">
                                <p className="text-muted-foreground">Кодов пока нет</p>
                            </div>
                        ) : (
                            codes.map((code) => (
                                <GlassCard key={code.id} className="p-4 flex items-center justify-between group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-lg select-all">{code.code}</span>
                                            {code.is_used ? (
                                                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                                    Использован
                                                </span>
                                            ) : (
                                                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                                                    Активен
                                                </span>
                                            )}
                                        </div>
                                        {code.is_used && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                <p>Активирован: {new Date(code.activated_at!).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(code.code)}
                                        className="shrink-0"
                                    >
                                        {copiedCode === code.code ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                    </Button>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
