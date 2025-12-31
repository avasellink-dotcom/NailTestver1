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

    for (const signal of dayData.signals) {
        if (!signal.triggers) continue;

        for (const rawTrigger of signal.triggers) {
            if (!rawTrigger || rawTrigger === '--') continue;

            // Split by separators (slash or arrow) and clean up
            const subTriggers = rawTrigger.split(new RegExp('[/→]')).map(t => t.toLowerCase().trim()).filter(t => t.length > 0);

            for (const subTrigger of subTriggers) {
                if (normalizedQuestion.includes(subTrigger)) {
                    return { signal, trigger: subTrigger };
                }
            }
        }
    }

    return null;
};
