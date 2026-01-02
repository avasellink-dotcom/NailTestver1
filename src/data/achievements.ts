export interface Achievement {
    id: string;
    emoji: string;
    title: string;
    titleEn: string;
    requirement: number;
    description: string;
}

export const achievements: Achievement[] = [
    {
        id: 'beginner',
        emoji: '🥉',
        title: 'Новичок',
        titleEn: 'Beginner',
        requirement: 10,
        description: 'Изучил 10 терминов'
    },
    {
        id: 'intermediate',
        emoji: '🥈',
        title: 'Опытный',
        titleEn: 'Intermediate',
        requirement: 20,
        description: 'Изучил 20 терминов'
    },
    {
        id: 'advanced',
        emoji: '🥇',
        title: 'Мастер',
        titleEn: 'Advanced',
        requirement: 30,
        description: 'Изучил 30 терминов'
    },
    {
        id: 'expert',
        emoji: '💎',
        title: 'Эксперт',
        titleEn: 'Expert',
        requirement: 50,
        description: 'Изучил все 50 терминов'
    }
];
