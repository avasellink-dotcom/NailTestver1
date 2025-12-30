import React, { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Particles } from '@/components/Particles';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const steps = [
    {
        emoji: "📚",
        title: "1. Изучи сигналы",
        text: "Перед тестом читай сигналы дня.\nЭто займет всего 2 минуты ⏱️"
    },
    {
        emoji: "🔍",
        title: "2. Найди в вопросе",
        text: "Голубые слова = сигналы!\nОни указывают на правильный ответ."
    },
    {
        emoji: "✅",
        title: "3. Примени правило",
        text: "Winslow → Ищи 'лечение'\nНО: помни про ЛОВУШКИ ❌"
    }
];

interface TutorialScreenProps {
    onComplete: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            localStorage.setItem('tutorial_shown', 'true');
            onComplete();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
            <Particles count={15} />

            <div className="relative z-10 w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold gradient-text mb-2">Как это работает?</h1>
                    <p className="text-muted-foreground text-sm">Методика быстрого обучения</p>
                </div>

                <div className="flex gap-2 justify-center mb-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-4 bg-muted'}`}
                        />
                    ))}
                </div>

                <GlassCard className="p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="text-6xl mb-6">{steps[currentStep].emoji}</div>
                    <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {steps[currentStep].text}
                    </p>
                </GlassCard>

                <Button
                    variant="gradient"
                    size="lg"
                    className="w-full h-14 text-lg"
                    onClick={handleNext}
                >
                    {currentStep === steps.length - 1 ? (
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
