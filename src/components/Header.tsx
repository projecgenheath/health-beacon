import { Activity, User, LogOut, Settings, GitCompare, BarChart3 } from 'lucide-react';
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


  // Removed navItems as they are now in the Sidebar

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 animate-slide-down">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Dashboard Title or Context */}
          <h2 className="text-sm font-semibold text-muted-foreground hidden md:block uppercase tracking-wider">
            {location.pathname === '/' ? 'Visão Geral' :
              location.pathname === '/analytics' ? 'Análise de Saúde' :
                location.pathname === '/compare' ? 'Comparação de Exames' :
                  location.pathname === '/profile' ? 'Perfil do Usuário' : ''}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

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
