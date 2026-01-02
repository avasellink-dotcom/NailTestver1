export type AbcCategory = 'reason' | 'result' | 'indicator' | 'change' | 'calculation' | 'other';

export interface CategoryConfig {
    emoji: string;
    label: string;
    labelEn: string;
    color: string;
    description: string;
}

export const categoryConfig: Record<AbcCategory, CategoryConfig> = {
    reason: {
        emoji: '🔴',
        label: 'Причина',
        labelEn: 'Cause',
        color: '#ef4444',
        description: 'Что вызывает явление'
    },
    result: {
        emoji: '🟢',
        label: 'Результат',
        labelEn: 'Result',
        color: '#10b981',
        description: 'Что получилось в итоге'
    },
    indicator: {
        emoji: '📊',
        label: 'Показатель',
        labelEn: 'Indicator',
        color: '#3b82f6',
        description: 'То, что измеряем'
    },
    change: {
        emoji: '📈',
        label: 'Изменение',
        labelEn: 'Change',
        color: '#f59e0b',
        description: 'Рост или снижение'
    },
    calculation: {
        emoji: '➗',
        label: 'Расчёт',
        labelEn: 'Calculation',
        color: '#8b5cf6',
        description: 'Формулы и вычисления'
    },
    other: {
        emoji: '📝',
        label: 'Другое',
        labelEn: 'Other',
        color: '#6b7280',
        description: 'Общие термины'
    }
};
