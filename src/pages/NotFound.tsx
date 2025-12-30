import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-9xl font-extrabold text-primary/20">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Página não encontrada</h2>
          <p className="text-muted-foreground">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
