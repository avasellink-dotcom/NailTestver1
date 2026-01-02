import { Signal, DayData } from '@/types/course';

/**
 * Finds the best matching signal for a question text within a specific day's data.
 * @param questionText The text of the question to analyze.
 * @param dayData The data for the specific day to search in.
 * @returns The matching signal and the specific trigger that matched, or null if no match found.
 */
export const findMatchingSignal = (
    questionText: string,
    dayData: DayData | undefined
): { signal: Signal; trigger: string } | null => {
    if (!dayData || !dayData.signals) {
        return null;
    }

    const normalizedQuestion = questionText.toLowerCase();

    // Common Korean particles that can be ignored for matching (simplistic but effective for CBT)
    const particles = ['은', '는', '이', '가', '을', '를', '의', '와', '과', '에', '에서', '로', '으로'];
    const particleRegex = new RegExp(`(${particles.join('|')})+$`, '');

    for (const signal of dayData.signals) {
        if (!signal.triggers) continue;

        for (const rawTrigger of signal.triggers) {
            if (!rawTrigger || rawTrigger === '--') continue;

            // Split by separators (slash or arrow) and clean up
            const subTriggers = rawTrigger.split(new RegExp('[/→]')).map(t => t.toLowerCase().trim()).filter(t => t.length > 0);

            for (const subTrigger of subTriggers) {
                // Precise match
                if (normalizedQuestion.includes(subTrigger)) {
                    return { signal, trigger: subTrigger };
                }

                // Match without common particles at the end of the trigger (if the question has them)
                const strippedTrigger = subTrigger.replace(particleRegex, '');
                if (strippedTrigger.length > 1 && normalizedQuestion.includes(strippedTrigger)) {
                    return { signal, trigger: strippedTrigger };
                }
            }
        }
    }

    return null;
};
