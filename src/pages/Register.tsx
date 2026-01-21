import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RegisterWizard } from '@/components/RegisterWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoImg from '@/assets/logo.svg';

const Register = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !loading) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center animate-pulse-slow">
                        <img src={logoImg} alt="BHB Logo" className="h-14 w-14 object-contain" />
                    </div>
                    <p className="text-muted-foreground animate-fade-in">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 py-6 sm:py-8 relative overflow-x-hidden">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Back button */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>
            </div>

            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-status-healthy/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />
            </div>

            {/* Header */}
            <div className="relative text-center mb-6 sm:mb-8 mt-12 sm:mt-4 animate-slide-up">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-3 sm:mb-4 animate-float hover:scale-105 transition-spring">
                    <img src={logoImg} alt="BHB Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Crie sua conta</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                    Preencha seus dados para começar a usar o BHB
                </p>
            </div>

            {/* Wizard */}
            <div className="relative flex-1 flex items-start justify-center py-4">
                <RegisterWizard />
            </div>

            {/* Footer */}
            <div className="relative text-center mt-6">
                <p className="text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-primary"
                        onClick={() => navigate('/auth')}
                    >
                        Faça login
                    </Button>
                </p>
            </div>
        </div>
    );
};

export default Register;
