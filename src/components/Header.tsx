import { Activity, User, LogOut, Settings, Sun, Moon, GitCompare, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu da sua conta');
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/compare', label: 'Comparar', icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 animate-slide-down">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group transition-smooth"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow-primary group-hover:scale-105 transition-spring">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">MeuExame</h1>
              <p className="text-xs text-muted-foreground">Acompanhe sua saúde</p>
            </div>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-smooth btn-press",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-smooth btn-press hover-glow"
            aria-label="Alternar tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute top-2.5 left-2.5 h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          </button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2.5 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-smooth btn-press">
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-scale-in">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Minha conta</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
