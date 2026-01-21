import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Upload,
    Sparkles,
    ChartLine,
    Bell,
    Shield,
    ArrowRight,
    FileText,
    Image as ImageIcon,
    Zap,
    Lock,
    Mail,
} from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { storePendingFile, getPendingFile } from '@/lib/storage';

const Landing = () => {
    const { user, signIn } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Redirect if already logged in - must be in useEffect to avoid setState during render
    useEffect(() => {
        if (user) {
            console.log('[LANDING] User already logged in, redirecting to dashboard...');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, []);

    const handleFileSelect = async (file: File) => {
        console.log('=== [LANDING] File selected ===');
        console.log('[LANDING] File name:', file.name);
        console.log('[LANDING] File type:', file.type);
        console.log('[LANDING] File size:', file.size);

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            console.error('[LANDING] Invalid file type:', file.type);
            toast.error('Formato inválido. Aceitos: PDF, JPG, PNG');
            return;
        }

        console.log('[LANDING] ✓ File type valid');

        // 1. Show modal IMMEDIATELY for best UX
        console.log('[LANDING] Setting pending file in component state...');
        setPendingFile(file);
        setShowAuthModal(true);
        console.log('[LANDING] ✓ Auth modal opened');

        // 2. Persist in background so it's there after login
        try {
            console.log('[LANDING] Attempting to store in IndexedDB...');
            await storePendingFile(file);
            console.log('[LANDING] ✓✓✓ File persisted successfully to IndexedDB');

            // Verify it was saved
            console.log('[LANDING] Verifying storage...');
            const stored = await getPendingFile();
            if (stored) {
                console.log('[LANDING] ✓ Verification successful - file exists in IndexedDB');
            } else {
                console.error('[LANDING] ✗ Verification failed - file NOT in IndexedDB!');
            }
        } catch (error) {
            console.error('[LANDING] ✗✗✗ Failed to persist file:', error);
            // Non-critical: the file is still in 'pendingFile' state for this session
        }

        console.log('=== [LANDING] File selection complete ===');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('=== [LANDING] Login initiated ===');
        setIsSubmitting(true);

        const { error } = await signIn(loginEmail, loginPassword);

        if (error) {
            console.error('[LANDING] Login failed:', error);
            toast.error('Email ou senha incorretos');
            setIsSubmitting(false);
            return;
        }

        console.log('[LANDING] ✓ Login successful');
        console.log('[LANDING] Navigating to /dashboard...');
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
        console.log('=== [LANDING] Navigation triggered ===');
    };

    const features = [
        {
            icon: Sparkles,
            title: 'Análise por IA',
            description: 'Seus exames são processados em segundos com inteligência artificial avançada',
            gradient: 'from-violet-500 to-purple-500',
        },
        {
            icon: ChartLine,
            title: 'Histórico Completo',
            description: 'Acompanhe a evolução dos seus resultados ao longo do tempo',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Bell,
            title: 'Alertas Inteligentes',
            description: 'Receba notificações quando houver valores fora do normal',
            gradient: 'from-amber-500 to-orange-500',
        },
    ];

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-status-healthy/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[200px] animate-float" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center">
                            <img src={logoImg} alt="BHB Logo" className="h-9 w-9 sm:h-10 sm:w-10 object-contain" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold">BHB</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <ThemeToggle />
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                            onClick={() => navigate('/auth')}
                        >
                            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Entrar</span>
                        </Button>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 sm:pb-20">
                    <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 animate-fade-in">
                        <Badge variant="secondary" className="mb-4 sm:mb-6 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
                            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                            Powered by AI
                        </Badge>
                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text leading-tight">
                            Analise seus exames com{' '}
                            <span className="bg-gradient-to-r from-primary to-status-healthy bg-clip-text text-transparent">
                                inteligência artificial
                            </span>
                        </h1>
                        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
                            Faça upload do seu exame e receba uma análise detalhada em segundos.
                            Acompanhe sua saúde de forma inteligente.
                        </p>
                    </div>

                    {/* Upload Area */}
                    <Card
                        className={cn(
                            'w-full max-w-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300',
                            'bg-card/50 backdrop-blur-xl border-2',
                            'hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10',
                            isDragging
                                ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/20'
                                : 'border-border/50'
                        )}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleInputChange}
                        />

                        <div className="flex flex-col items-center gap-4 sm:gap-6">
                            <div className={cn(
                                'h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center transition-all duration-300',
                                'bg-gradient-to-br from-primary/20 to-primary/5',
                                isDragging && 'scale-110 from-primary/30 to-primary/10'
                            )}>
                                <Upload className={cn(
                                    'h-8 w-8 sm:h-10 sm:w-10 transition-all duration-300',
                                    isDragging ? 'text-primary scale-110' : 'text-muted-foreground'
                                )} />
                            </div>

                            <div className="text-center">
                                <p className="text-base sm:text-lg font-medium mb-2">
                                    {isDragging
                                        ? 'Solte o arquivo aqui'
                                        : 'Arraste seu exame aqui ou clique para selecionar'
                                    }
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Suportamos PDF e imagens (JPG, PNG)
                                </p>
                            </div>

                            <div className="flex gap-2 sm:gap-3">
                                <Badge variant="outline" className="gap-1 sm:gap-1.5 text-xs">
                                    <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    PDF
                                </Badge>
                                <Badge variant="outline" className="gap-1 sm:gap-1.5 text-xs">
                                    <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    JPG/PNG
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-16 max-w-5xl w-full px-2">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.title}
                                className="p-4 sm:p-6 bg-card/30 backdrop-blur border-border/50 hover:bg-card/50 transition-all duration-300"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={cn(
                                    'h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4',
                                    `bg-gradient-to-br ${feature.gradient}`
                                )}>
                                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Trust Badge */}
                    <div className="mt-10 sm:mt-16 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground px-4 text-center">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-status-healthy flex-shrink-0" />
                        <span>Seus dados são protegidos com criptografia de ponta</span>
                    </div>
                </main>
            </div>

            {/* Auth Modal */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Quase lá!
                        </DialogTitle>
                        <DialogDescription>
                            Para salvar e analisar seu exame, faça login ou crie uma conta gratuita.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Email Login */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Entrando...' : 'Entrar e Analisar Exame'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground">
                            Não tem conta?{' '}
                            <Button
                                variant="link"
                                className="p-0 h-auto font-medium"
                                onClick={() => {
                                    setShowAuthModal(false);
                                    navigate('/auth');
                                }}
                            >
                                Crie uma gratuitamente
                            </Button>
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Landing;
