import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-2.5 rounded-xl text-foreground transition-all duration-300",
        "bg-secondary/50 hover:bg-secondary",
        "group"
      )}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <Sun className={cn(
        "h-5 w-5 transition-all duration-300",
        isDark ? "rotate-0 scale-100" : "rotate-90 scale-0 absolute"
      )} />
      <Moon className={cn(
        "h-5 w-5 transition-all duration-300",
        isDark ? "rotate-90 scale-0 absolute" : "rotate-0 scale-100"
      )} />
    </button>
  );
};
