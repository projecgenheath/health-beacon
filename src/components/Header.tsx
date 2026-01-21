import { Activity, User, LogOut, Settings, GitCompare, BarChart3, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { clearPendingFile } from '@/lib/storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    await clearPendingFile();
    toast.success('Você saiu da sua conta');
    navigate('/');
  };

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Visão Geral';
      case '/dashboard/analytics':
      case '/analytics':
        return 'Análises';
      case '/dashboard/compare':
      case '/compare':
        return 'Comparar';
      case '/profile':
        return 'Perfil';
      default:
        return '';
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/dashboard/compare', label: 'Comparar', icon: GitCompare },
    { path: '/dashboard/reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 safe-area-inset-top">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto">
        {/* Mobile: Logo + Title | Desktop: Just Title */}
        {/* Mobile menu trigger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburguer */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                <SheetHeader className="p-6 text-left border-b border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                      <Activity className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <SheetTitle className="text-xl font-bold">BHB (Biomedical Health Bank)</SheetTitle>
                  </div>
                </SheetHeader>
                <div className="flex flex-col gap-1 p-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "justify-start gap-4 h-12 text-base px-4",
                          isActive && "bg-secondary font-semibold"
                        )}
                        onClick={() => {
                          navigate(item.path);
                        }}
                      >
                        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - always visible now */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-sm">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>

          {/* Page Title */}
          <h2 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
            {getPageTitle()}
          </h2>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  isActive && "bg-secondary text-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Action buttons - with proper spacing for mobile */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 sm:p-2.5 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-smooth btn-press min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Menu do usuário"
              >
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-scale-in">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user?.email}</p>
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
