import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Activity,
    BarChart3,
    GitCompare,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Calendar,
    Settings,
    Bell,
    Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/dashboard/compare', label: 'Comparar', icon: GitCompare },
        { path: '/profile', label: 'Meu Perfil', icon: User },
    ];

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <aside
            className={cn(
                "sticky top-0 h-screen transition-all duration-300 ease-in-out z-40 flex-shrink-0",
                "bg-card/80 backdrop-blur-xl border-r border-border/50",
                "hidden md:flex md:flex-col",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex flex-col h-full py-6">
                {/* Logo Section */}
                <div className={cn(
                    "px-6 mb-8 flex items-center transition-all duration-300",
                    isCollapsed ? "justify-center" : "justify-between"
                )}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow-primary">
                                <Activity className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-foreground leading-tight">MeuExame</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Health Beacon</p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow-primary">
                            <Activity className="h-5 w-5 text-primary-foreground" />
                        </div>
                    )}
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <TooltipProvider key={item.path} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => navigate(item.path)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 btn-press group",
                                                isActive
                                                    ? "sidebar-item-active"
                                                    : "text-muted-foreground sidebar-item-hover"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                                                isActive ? "scale-110" : "group-hover:scale-110"
                                            )} />
                                            {!isCollapsed && (
                                                <span className="text-sm font-medium animate-fade-in whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right" className="bg-popover text-popover-foreground">
                                            {item.label}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="px-3 space-y-2">
                    <Separator className="my-4 bg-border/50" />

                    <button
                        onClick={handleSignOut}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 btn-press group",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium animate-fade-in">Sair da Conta</span>
                        )}
                    </button>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary transition-all duration-200 btn-press mt-2 justify-center"
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        {!isCollapsed && <span className="text-sm font-medium">Recolher</span>}
                    </button>

                    {/* User Profile Mini */}
                    {!isCollapsed && user && (
                        <div className="mt-4 p-3 rounded-2xl bg-secondary/50 border border-border/50 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate text-foreground">{user.email?.split('@')[0]}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
