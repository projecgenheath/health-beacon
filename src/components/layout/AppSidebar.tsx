
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    LayoutDashboard,
    FileStack,
    DollarSign,
    GitCompare,
    FileText,
    Calendar as CalendarIcon,
    Building2,
    BarChart3,
    LogOut,
    BadgeCheck,
    CreditCard,
    Bell,
    ChevronsUpDown,
    Beaker,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserType } from "@/hooks/useUserType";
import { useAuth } from "@/hooks/useAuth";
import logoImg from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userType, profile } = useUserType();
    const { user, signOut } = useAuth();
    const { isMobile } = useSidebar();

    // Patient navigation items
    const patientNavItems = [
        {
            title: "Visão Geral",
            path: "/dashboard",
            icon: LayoutDashboard
        },
        {
            title: "Solicitar Exame",
            path: "/patient/request-exam",
            icon: FileStack
        },
        {
            title: "Orçamentos",
            path: "/patient/quotations",
            icon: DollarSign
        },
        {
            title: "Comparar",
            path: "/dashboard/compare",
            icon: GitCompare
        },
        {
            title: "Análises",
            path: "/dashboard/analytics",
            icon: BarChart3
        },
        {
            title: "Relatórios",
            path: "/dashboard/reports",
            icon: FileText
        },
    ];

    // Laboratory navigation items
    const laboratoryNavItems = [
        {
            title: "Dashboard",
            path: "/laboratory/dashboard",
            icon: LayoutDashboard
        },
        {
            title: "Pedidos",
            path: "/laboratory/requests",
            icon: FileText
        },
        {
            title: "Produção",
            path: "/laboratory/exam-requests",
            icon: Beaker
        },
        {
            title: "Agendamentos",
            path: "/laboratory/appointments",
            icon: CalendarIcon
        },
        {
            title: "Perfil do Lab",
            path: "/laboratory/profile",
            icon: Building2
        },
    ];

    const navItems = userType === "laboratory" ? laboratoryNavItems : patientNavItems;

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    const userInitials = user?.email
        ? user.email.substring(0, 2).toUpperCase()
        : "U";

    const userName = profile?.full_name || user?.email?.split('@')[0] || "Usuário";
    const userEmail = user?.email || "";

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <img
                                    src={logoImg}
                                    alt="BHB Logo"
                                    className="size-5 object-contain"
                                />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold text-primary">BHB Saúde</span>
                                <span className="truncate text-xs text-muted-foreground">Biomedical Health</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            onClick={() => navigate(item.path)}
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={cn(
                                                "transition-all duration-200",
                                                isActive && "font-medium text-primary bg-primary/10"
                                            )}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Example Second Group for generic features */}
                {userType === 'patient' && (
                    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                        <SidebarGroupLabel>Atalhos</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={() => navigate('/notifications')}>
                                        <Bell />
                                        <span>Notificações</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg bg-primary/20 text-primary">
                                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                                        <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-semibold">{userInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{userName}</span>
                                        <span className="truncate text-xs">{userEmail}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg bg-primary/20 text-primary">
                                            <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                                            <AvatarFallback className="rounded-lg bg-primary/20 text-primary">{userInitials}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{userName}</span>
                                            <span className="truncate text-xs">{userEmail}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                        Minha Conta
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Assinatura
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
