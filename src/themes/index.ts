import { lightTheme } from './light';
import { darkTheme } from './dark';

export type ThemeMode = 'light' | 'dark';

export const themeLabels: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
};

export { lightTheme, darkTheme };
