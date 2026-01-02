import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
    isAccessibilityMode: boolean;
}

interface SettingsContextType {
    settings: Settings;
    toggleAccessibilityMode: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : { isAccessibilityMode: false };
    });

    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));

        // Apply class to HTML element
        if (settings.isAccessibilityMode) {
            document.documentElement.classList.add('accessibility-mode');
        } else {
            document.documentElement.classList.remove('accessibility-mode');
        }
    }, [settings]);

    const toggleAccessibilityMode = () => {
        setSettings(prev => ({ ...prev, isAccessibilityMode: !prev.isAccessibilityMode }));
    };

    return (
        <SettingsContext.Provider value={{ settings, toggleAccessibilityMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
