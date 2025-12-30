import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    pageName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Page-level error boundary for catching errors in specific pages
 * without breaking the entire application
 */
export class PageErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Error in ${this.props.pageName || 'page'}:`, error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    handleGoBack = () => {
        window.history.back();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="container py-12 flex items-center justify-center min-h-[60vh]">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Erro ao carregar {this.props.pageName || 'página'}</CardTitle>
                            <CardDescription>
                                Ocorreu um problema ao exibir este conteúdo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Button
                                    onClick={this.handleReset}
                                    variant="default"
                                    className="flex-1 gap-2"
                                    size="sm"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Tentar novamente
                                </Button>
                                <Button
                                    onClick={this.handleGoBack}
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    size="sm"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
