import { useThemeStore } from '@/src/store/themeStore';

beforeEach(() => {
  const root = document.documentElement;
  root.classList.remove('dark');
  localStorage.clear();
  useThemeStore.setState({ theme: 'light' });
});

describe('themeStore', () => {
  describe('setTheme', () => {
    it('sets theme to dark in state', () => {
      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('adds dark class to documentElement when set to dark', () => {
      useThemeStore.getState().setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class from documentElement when set to light', () => {
      document.documentElement.classList.add('dark');
      useThemeStore.getState().setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists theme to localStorage', () => {
      useThemeStore.getState().setTheme('dark');
      expect(localStorage.getItem('nevo-theme')).toBe('dark');
    });

    it('persists light theme to localStorage', () => {
      useThemeStore.getState().setTheme('light');
      expect(localStorage.getItem('nevo-theme')).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      useThemeStore.setState({ theme: 'light' });
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('toggles from dark to light', () => {
      useThemeStore.setState({ theme: 'dark' });
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('adds dark class when toggling to dark', () => {
      useThemeStore.setState({ theme: 'light' });
      useThemeStore.getState().toggleTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when toggling to light', () => {
      useThemeStore.setState({ theme: 'dark' });
      document.documentElement.classList.add('dark');
      useThemeStore.getState().toggleTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('updates localStorage on toggle', () => {
      useThemeStore.setState({ theme: 'light' });
      useThemeStore.getState().toggleTheme();
      expect(localStorage.getItem('nevo-theme')).toBe('dark');
    });
  });
});
