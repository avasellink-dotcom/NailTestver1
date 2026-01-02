import React, { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/Particles';
import { ArrowRight, CheckCircle2, Search, Zap, MousePointerClick } from 'lucide-react';

const steps = [
    {
        icon: <Search className="w-12 h-12 text-blue-400" />,
        title: "1. Scan for Signals",
        titleRu: "1. Ищи Сигналы",
        text: "В вопросе всегда есть ключевое слово (Сигнал). Оно подсвечено голубым.",
        subtext: "Не пытайся перевести всё предложение. Ищи знакомые слова."
    },
    {
        icon: <Zap className="w-12 h-12 text-yellow-400" />,
        title: "2. Recall the Pattern",
        titleRu: "2. Вспомни Паттерн",
        text: "Сигнал всегда связан с правилом. Увидел сигнал — вспомни картинку.",
        subtext: "Пример: «Горшок» (항아리) всегда значит «Старение»."
    },
    {
        icon: <MousePointerClick className="w-12 h-12 text-green-400" />,
        title: "3. Lock the Answer",
        titleRu: "3. Выбери Ответ",
        text: "Найди ответ, который подходит под правило. Не думай долго.",
        subtext: "Увидел «Горшок» → Ищи ответ про «Стариков» или «Низкую рождаемость»."
    }
];

interface TutorialScreenProps {
    onComplete: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length + 1) { // +1 for the Live Example step
            setCurrentStep(prev => prev + 1);
        } else {
            localStorage.setItem('tutorial_shown', 'true');
            onComplete();
        }
    };

    const isLiveExample = currentStep === steps.length;
    const isLastStep = currentStep === steps.length;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
            <Particles count={15} />

            <div className="relative z-10 w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold gradient-text mb-2">Как это работает?</h1>
                    <p className="text-muted-foreground text-sm">Методика Pattern-Key-Lock</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2 justify-center mb-4">
                    {[...steps, { title: 'Live Example' }].map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-4 bg-muted'}`}
                        />
                    ))}
                </div>

                <GlassCard className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
                    {!isLiveExample ? (
                        <>
                            <div className="mb-6 p-4 bg-primary/10 rounded-full">
                                {steps[currentStep].icon}
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{steps[currentStep].titleRu}</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-6">{steps[currentStep].title}</p>

                            <p className="text-foreground text-lg mb-4 font-medium leading-relaxed">
                                {steps[currentStep].text}
                            </p>
                            <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg w-full">
                                {steps[currentStep].subtext}
                            </p>
                        </>
                    ) : (
                        <div className="w-full text-left space-y-4">
                            <div className="flex items-center gap-2 mb-2 justify-center">
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">LIVE DEMO</span>
                                <h2 className="text-xl font-bold text-center">Живой Пример</h2>
                            </div>

                            {/* Mock Question Card */}
                            <div className="bg-card/50 border border-border rounded-xl p-4 text-sm relative">
                                <p className="mb-3 font-medium text-foreground">
                                    인구구조가 <span className="trigger-highlight text-primary font-bold decoration-wavy underline decoration-primary">항아리형</span>일 때 특징으로 옳은 것은?
                                </p>

                                {/* Thinking Process Overlay */}
                                <div className="space-y-2 pl-4 border-l-2 border-primary/30 my-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Search className="w-3 h-3" />
                                        <span>Вижу: <span className="text-primary font-bold">항아리형 (Горшок)</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                        <span>Помню: Горшок = <span className="text-yellow-500 font-bold">Старение / Мало детей</span></span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="w-full p-2 rounded border border-border opacity-50 text-xs">A. 출생률이 높다 (Много детей)</div>
                                    <div className="w-full p-2 rounded border-2 border-green-500 bg-green-500/10 text-xs font-bold flex justify-between items-center">
                                        <span>B. 고령화가 진행된다</span>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="text-[10px] text-green-400 pl-2">↑ "Прогрессирует старение" — Бинго!</div>
                                </div>
                            </div>

                            <p className="text-center text-xs text-muted-foreground mt-2">
                                Ты не переводил вопрос. Ты просто нашел сигнал и выбрал паттерн.
                            </p>
                        </div>
                    )}
                </GlassCard>

                <Button
                    variant="gradient"
                    size="lg"
                    className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all"
                    onClick={handleNext}
                >
                    {isLastStep ? (
                        <>
                            Начать обучение <CheckCircle2 className="ml-2 w-5 h-5" />
                        </>
                    ) : (
                        <>
                            Далее <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
