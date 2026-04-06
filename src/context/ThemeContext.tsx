// src/theme/ThemeContext.tsx
import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ThemeMode, lightTheme, darkTheme } from '../themes/index';

interface ThemeContextType {
    mode: ThemeMode;
    setTheme: (mode: ThemeMode) => void;
    storeTheme: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    setTheme: () => { },
    storeTheme: () => { },
});

interface Props {
    children: ReactNode;
}

export const ThemeProvider: React.FC<Props> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('light');

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') {
            setMode(stored);
        }
    }, []);

    const setTheme = (newMode: ThemeMode) => {
        console.log('Theme changed')
        setMode(newMode);
    };

    const storeTheme = (newMode: ThemeMode) => {
        console.log('Theme saved')
        localStorage.setItem('theme', newMode);
    };

    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, setTheme, storeTheme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
