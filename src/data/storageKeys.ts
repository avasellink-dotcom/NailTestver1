// Keys используемые в localStorage для ABC функционала
export const STORAGE_KEYS = {
    knownTerms: 'nailexam_known_terms', // { termId: { known: boolean, lastReviewed: timestamp } }
    abcProgress: 'nailexam_abc_progress', // { day1: { completed, score, unlocked }, ... }
    reviewSchedule: 'nailexam_review_schedule' // { termId: nextReviewDate }
};

// Spaced Repetition расписание
export const reviewSchedule: Record<number, number[]> = {
    3: [1], // Day 3 повторяет Day 1
    4: [2], // Day 4 повторяет Day 2
    5: [1, 3], // Day 5 повторяет Days 1 и 3
    6: [2, 4], // Day 6 повторяет Days 2 и 4
    7: [1, 3, 5] // Day 7 повторяет Days 1, 3, 5
};
