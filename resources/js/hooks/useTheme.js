import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../store/uiSlice';

const themes = {
    dark: {
        background: '#0a0a0c',
        surface: 'rgba(20, 20, 25, 0.75)',
        surfaceHeader: 'rgba(15, 15, 20, 0.45)',
        sidebarBg: 'rgba(15, 15, 20, 0.85)',
        cardBg: 'rgba(30, 30, 38, 0.45)',
        cardGradient: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        border: 'rgba(255, 255, 255, 0.08)',
        borderLight: 'rgba(255, 255, 255, 0.04)',
        text: '#ffffff',
        textMuted: '#9ca3af',
        inputBg: 'rgba(30, 30, 38, 0.45)',
        inputBorder: 'rgba(255, 255, 255, 0.08)',
        shadow: '0 4px 20px rgba(0,0,0,0.35)',
        tableHeaderColor: '#9ca3af',
        tableRowBorder: 'rgba(255, 255, 255, 0.08)',
        accentBg: 'rgba(99, 102, 241, 0.08)',
        topBarBg: 'rgba(99, 102, 241, 0.08)',
        topBarBorder: 'rgba(99, 102, 241, 0.2)',
    },
    light: {
        background: '#f3f4f6',
        surface: '#ffffff',
        surfaceHeader: '#f9fafb',
        sidebarBg: '#ffffff',
        cardBg: '#ffffff',
        cardGradient: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
        border: 'rgba(0, 0, 0, 0.08)',
        borderLight: 'rgba(0, 0, 0, 0.04)',
        text: '#111827',
        textMuted: '#4b5563',
        inputBg: '#ffffff',
        inputBorder: 'rgba(0, 0, 0, 0.12)',
        shadow: '0 4px 20px rgba(0,0,0,0.06)',
        tableHeaderColor: '#4b5563',
        tableRowBorder: 'rgba(0, 0, 0, 0.08)',
        accentBg: 'rgba(99, 102, 241, 0.05)',
        topBarBg: '#e0e7ff',
        topBarBorder: 'rgba(99, 102, 241, 0.3)',
    }
};

export default function useTheme() {
    const dispatch = useDispatch();
    const themeName = useSelector(state => state.ui.theme || 'dark');
    
    const colors = themes[themeName] || themes.dark;
    
    return {
        themeName,
        colors,
        toggle: () => dispatch(toggleTheme()),
        isDark: themeName === 'dark',
    };
}
