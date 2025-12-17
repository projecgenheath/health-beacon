import { Activity, User, Bell } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">MeuExame</h1>
            <p className="text-xs text-muted-foreground">Acompanhe sua saúde</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-2.5 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-status-danger text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              2
            </span>
          </button>
          <button className="p-2.5 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
