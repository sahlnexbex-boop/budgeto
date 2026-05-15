import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorPresets, ThemeType, ColorThemeType } from '../theme/colors';

interface ThemeContextType {
    theme: ThemeType;
    colorTheme: ColorThemeType;
    colors: any;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
    setColorTheme: (colorTheme: ColorThemeType) => void;
    currency: string;
    setCurrency: (currency: string) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>('dark');
    const [colorTheme, setColorThemeState] = useState<ColorThemeType>('yellow');
    const [currency, setCurrencyState] = useState<string>('INR');
    const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);

    useEffect(() => {
        const loadSettings = async () => {
            const savedTheme = await AsyncStorage.getItem('user-theme');
            if (savedTheme) {
                setThemeState(savedTheme as ThemeType);
            }
            const savedColorTheme = await AsyncStorage.getItem('user-color-theme');
            if (savedColorTheme) {
                setColorThemeState(savedColorTheme as ColorThemeType);
            }
            const savedCurrency = await AsyncStorage.getItem('user-currency');
            if (savedCurrency) {
                setCurrencyState(savedCurrency);
            }
            const savedSound = await AsyncStorage.getItem('user-sound-enabled');
            if (savedSound) {
                setSoundEnabledState(savedSound === 'true');
            }
        };
        loadSettings();
    }, []);

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    };

    const setColorTheme = async (newColorTheme: ColorThemeType) => {
        setColorThemeState(newColorTheme);
        await AsyncStorage.setItem('user-color-theme', newColorTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const setCurrency = async (newCurrency: string) => {
        setCurrencyState(newCurrency);
        await AsyncStorage.setItem('user-currency', newCurrency);
    };

    const setSoundEnabled = async (enabled: boolean) => {
        setSoundEnabledState(enabled);
        await AsyncStorage.setItem('user-sound-enabled', enabled ? 'true' : 'false');
    };

    const colors = ColorPresets[colorTheme]?.[theme] || ColorPresets.purple[theme];

    return (
        <ThemeContext.Provider value={{
            theme,
            colorTheme,
            colors,
            toggleTheme,
            setTheme,
            setColorTheme,
            currency,
            setCurrency,
            soundEnabled,
            setSoundEnabled
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
