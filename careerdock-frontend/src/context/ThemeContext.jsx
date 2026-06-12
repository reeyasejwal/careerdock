import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
  sage:      { sidebar:'#3D5435', primary:'#4A6741', accent:'#99AD7A', surface:'rgba(238,232,212,0.6)', mainBg:'#FAF8F2', text:'#2A3D24', cardBg:'rgba(255,255,255,0.6)', muted:'#7A8A6A', name:'Sage' },
  blush:     { sidebar:'#5C3A45', primary:'#C2185B', accent:'#F48FB1', surface:'rgba(252,228,236,0.6)', mainBg:'#FFF5F8', text:'#3D1F28', cardBg:'rgba(255,255,255,0.6)', muted:'#9A7080', name:'Blush' },
  ocean:     { sidebar:'#1A2F4A', primary:'#1565C0', accent:'#64B5F6', surface:'rgba(212,230,248,0.6)', mainBg:'#F5F9FF', text:'#0D1B2A', cardBg:'rgba(255,255,255,0.6)', muted:'#5A7A9A', name:'Ocean' },
  lavender:  { sidebar:'#2D2442', primary:'#7B1FA2', accent:'#CE93D8', surface:'rgba(232,224,248,0.6)', mainBg:'#FAF5FF', text:'#1A1030', cardBg:'rgba(255,255,255,0.6)', muted:'#7A6A90', name:'Lavender' },
  sand:      { sidebar:'#3A2A1A', primary:'#8B6348', accent:'#D4A882', surface:'rgba(242,232,216,0.6)', mainBg:'#FBF7F0', text:'#2E1A0E', cardBg:'rgba(255,255,255,0.6)', muted:'#8A7A6A', name:'Sand' },
  midnight:  { sidebar:'#0F1923', primary:'#00BCD4', accent:'#4DD0E1', surface:'rgba(20,40,60,0.6)',   mainBg:'#0A1628', text:'#E0F0FF', cardBg:'rgba(30,50,70,0.5)',     muted:'#6A8A9A', name:'Midnight' },
  rosegold:  { sidebar:'#3D2A2A', primary:'#C07A5C', accent:'#E8B4A0', surface:'rgba(248,232,224,0.6)', mainBg:'#FDF8F5', text:'#2A1A15', cardBg:'rgba(255,255,255,0.6)', muted:'#9A7A70', name:'Rose Gold' },
};

const DARK_OVERRIDES = {
  mainBg: '#0F0F14', cardBg: 'rgba(30,30,38,0.65)', surface: 'rgba(35,35,45,0.6)', text: '#EEF2FF', muted: '#8A90AA',
};

const ThemeContext = createContext(null);

function applyTheme(themeKey, dark) {
  const t = { ...(THEMES[themeKey] || THEMES.sage), ...(dark ? DARK_OVERRIDES : {}) };
  const root = document.documentElement;
  root.setAttribute('data-theme', themeKey);
  root.setAttribute('data-dark', dark ? '1' : '0');
  root.style.setProperty('--sidebar', t.sidebar);
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--surface', t.surface);
  root.style.setProperty('--mainBg', t.mainBg);
  root.style.setProperty('--text', t.text);
  root.style.setProperty('--cardBg', t.cardBg);
  root.style.setProperty('--muted', t.muted);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('cd_theme') || 'sage');
  const [dark, setDarkState] = useState(() => localStorage.getItem('cd_dark') === '1');

  useEffect(() => { applyTheme(theme, dark); }, [theme, dark]);

  const setTheme = (key) => { setThemeState(key); localStorage.setItem('cd_theme', key); };
  const toggleDark = () => { setDarkState(d => { const nd = !d; localStorage.setItem('cd_dark', nd ? '1' : '0'); return nd; }); };

  return <ThemeContext.Provider value={{ theme, dark, setTheme, toggleDark, themes: THEMES }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
