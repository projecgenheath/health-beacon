import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    GitCompare,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/dashboard/analytics', label: 'Análises', icon: BarChart3 },
        { path: '/dashboard/compare', label: 'Comparar', icon: GitCompare },
        { path: '/profile', label: 'Perfil', icon: User },
    ];

    // Check if current path matches or starts with the nav item path
    const isPathActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50",
                "md:hidden",
                "bg-card/95 backdrop-blur-xl border-t border-border/50",
                "pb-[env(safe-area-inset-bottom)]"
            )}
            role="navigation"
            aria-label="Navegação principal"
        >
            <div className="flex items-center justify-around px-1 py-2">
                {navItems.map((item) => {
                    const isActive = isPathActive(item.path);
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200",
                                "min-w-[72px] min-h-[56px] px-3 py-2",
                                "active:scale-95 active:bg-secondary/50",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-6 w-6 transition-all duration-200",
                                    isActive && "scale-110"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-xs font-medium leading-tight",
                                    isActive && "font-semibold text-primary"
                                )}
                            >
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
