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
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/compare', label: 'Comparar', icon: GitCompare },
        { path: '/profile', label: 'Perfil', icon: User },
    ];

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50",
                "md:hidden",
                "bg-card/95 backdrop-blur-xl border-t border-border/50",
                "safe-area-inset-bottom"
            )}
        >
            <div className="flex items-center justify-around px-2 py-3">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                                "min-w-[64px] max-w-[80px]",
                                "active:scale-95",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
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
                                    "text-[10px] font-medium leading-tight",
                                    isActive && "font-semibold"
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
