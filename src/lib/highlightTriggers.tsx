import React from 'react';

/**
 * Highlights trigger words in the text with a special CSS class
 * @param text - The text to search for triggers
 * @param triggers - Array of trigger words/phrases to highlight
 * @returns React node with highlighted triggers
 */
export function highlightTriggers(text: string, triggers: string[]): React.ReactNode {
    if (!text || !triggers || triggers.length === 0) {
        return text;
    }

    // Filter out empty triggers and special markers like "--"
    const validTriggers = triggers
        .filter(t => t && t.trim() !== '' && t.trim() !== '--')
        .map(t => t.trim());

    if (validTriggers.length === 0) {
        return text;
    }

    // Sort by length (longer first) to avoid partial matches
    const sortedTriggers = [...validTriggers].sort((a, b) => b.length - a.length);

    // Create a regex pattern that matches any of the triggers
    // Escape special regex characters
    const escapedTriggers = sortedTriggers.map(t =>
        t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    const pattern = new RegExp(`(${escapedTriggers.join('|')})`, 'gi');

    // Split text by the pattern
    const parts = text.split(pattern);

    if (parts.length === 1) {
        return text;
    }

    return (
        <>
            {parts.map((part, index) => {
                // Check if this part matches any trigger (case-insensitive)
                const isHighlighted = validTriggers.some(
                    trigger => trigger.toLowerCase() === part.toLowerCase()
                );

                if (isHighlighted) {
                    return (
                        <span key={index} className="trigger-highlight">
                            {part}
                        </span>
                    );
                }

                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </>
    );
}

/**
 * Collects all triggers from all signals of a day
 * @param signals - Array of signal objects
 * @returns Flat array of all trigger strings
 */
export function collectAllTriggers(signals: Array<{ triggers?: string[] }>): string[] {
    if (!signals || signals.length === 0) {
        return [];
    }

    const allTriggers: string[] = [];

    for (const signal of signals) {
        if (signal.triggers && Array.isArray(signal.triggers)) {
            for (const trigger of signal.triggers) {
                if (trigger && trigger.trim() !== '' && trigger.trim() !== '--') {
                    allTriggers.push(trigger.trim());
                }
            }
        }
    }

    // Remove duplicates
    return [...new Set(allTriggers)];
}
