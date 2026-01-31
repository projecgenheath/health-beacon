import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search, Beaker, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LaboratoryServices() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState<string[]>([]);
    const [newService, setNewService] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadServices();
        }
    }, [user]);

    const loadServices = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('services_offered')
                .eq('user_id', user!.id)
                .single();

            if (error) throw error;

            setServices(data.services_offered || []);
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Erro ao carregar serviços');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!newService.trim()) return;

        if (services.includes(newService.trim())) {
            toast.error('Este serviço já está na lista');
            return;
        }

        const updatedServices = [...services, newService.trim()];
        setServices(updatedServices);
        setNewService('');
        await saveServices(updatedServices);
    };

    const handleRemoveService = async (serviceToRemove: string) => {
        const updatedServices = services.filter(s => s !== serviceToRemove);
        setServices(updatedServices);
        await saveServices(updatedServices);
    };

    const saveServices = async (updatedServices: string[]) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ services_offered: updatedServices })
                .eq('user_id', user!.id);

            if (error) throw error;
            toast.success('Lista de serviços atualizada');
        } catch (error) {
            console.error('Error saving services:', error);
            toast.error('Erro ao salvar alterações');
            // Revert local state on error
            loadServices();
        } finally {
            setSaving(false);
        }
    };

    const filteredServices = services.filter(s =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Beaker className="h-8 w-8 text-primary" />
                        Catálogo de Exames
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os exames e serviços oferecidos pelo seu laboratório
                    </p>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Adicionar Novo Exame</CardTitle>
                    <CardDescription>
                        Digite o nome do exame para adicionar ao seu catálogo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ex: Hemograma Completo, Glicemia, COVID-19 PCR..."
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                            className="max-w-xl"
                        />
                        <Button onClick={handleAddService} disabled={saving || !newService.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Exames Cadastrados ({services.length})</CardTitle>
                        <CardDescription>Lista de exames disponíveis para agendamento</CardDescription>
                    </div>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar na lista..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredServices.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
                            <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground">
                                {searchQuery ? 'Nenhume exame encontrado para a busca.' : 'Nenhum exame cadastrado ainda.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredServices.map((service, index) => (
                                <div
                                    key={`${service}-${index}`}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors group animate-slide-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <span className="font-medium truncate mr-2" title={service}>
                                        {service}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => handleRemoveService(service)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
