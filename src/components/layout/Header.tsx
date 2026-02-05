import React from 'react';
import { User, LogOut, Settings, GitCompare, BarChart3, LayoutDashboard, FileStack, Upload, Activity, Beaker, Briefcase } from 'lucide-react';
import logoImg from '@/assets/logo.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { useTheme } from '@/hooks/use-theme';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/common/NotificationBell';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { clearPendingFile } from '@/lib/storage';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { userType } = useUserType();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    await clearPendingFile();
    toast.success('Você saiu da sua conta');
    navigate('/');
  };

  // Navigation items based on user type
  const getNavigationItems = () => {
    if (userType === 'patient') {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Relatórios', path: '/dashboard/reports', icon: FileStack },
        { name: 'Solicitar Exame', path: '/patient/request-exam', icon: Upload },
      ];
    } else if (userType === 'laboratory') {
      return [
        { name: 'Dashboard', path: '/laboratory/dashboard', icon: LayoutDashboard },
        { name: 'Pedidos', path: '/laboratory/requests', icon: FileStack },
        { name: 'Produção', path: '/laboratory/exam-requests', icon: Briefcase },
        { name: 'Agendamentos', path: '/laboratory/appointments', icon: Activity },
        { name: 'Catálogo', path: '/laboratory/services', icon: Beaker },
      ];
    }
    return [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }];
  };

  const navItems = getNavigationItems();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/60 border-b border-white/10 safe-area-inset-top">
      <div className="px-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate(userType === 'laboratory' ? '/laboratory/dashboard' : '/dashboard')}>
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/20 shadow-glow-primary transition-spring hover:scale-110">
                <img
                   src={logoImg}
                  alt="BHB Logo"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground leading-none">BHB Saúde</h1>
                <p className="text-[10px] text-muted-foreground tracking-tighter uppercase font-semibold">Biomedical Health</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 relative group',
                      isActive
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive && "text-primary")} />
                    <span className="text-sm">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-smooth btn-press min-w-[40px] min-h-[40px] flex items-center justify-center overflow-hidden"
                  aria-label="Menu do usuário"
                >
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card animate-scale-in border-white/10 p-2">
                <div className="px-2 py-2 mb-1">
                  <p className="text-sm font-bold truncate text-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Conta BHB</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg py-2 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors">
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Meu Perfil</span>
                      {userType === 'laboratory' && (
                        <span className="text-[10px] text-muted-foreground font-normal">Configurar Integração DB</span>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg py-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-colors">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation row - visible only on small screens */}
      <div className="md:hidden border-t border-white/5 overflow-x-auto scrollbar-hide bg-black/5">
        <nav className="flex items-center gap-1 px-4 py-2 min-h-[52px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-glow-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
