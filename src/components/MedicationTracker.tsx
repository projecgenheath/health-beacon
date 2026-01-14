import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMedications, Medication } from '@/hooks/useMedications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Pill, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MedicationTracker = () => {
    const { t } = useTranslation();
    const { medications, loading, addMedication, deleteMedication } = useMedications();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: '',
        start_date: '',
        end_date: '',
        notes: '',
    });

    const handleAdd = async () => {
        if (!newMed.name) {
            toast.error('Nome do medicamento é obrigatório');
            return;
        }

        const result = await addMedication({
            name: newMed.name,
            dosage: newMed.dosage || null,
            frequency: newMed.frequency || null,
            start_date: newMed.start_date || null,
            end_date: newMed.end_date || null,
            notes: newMed.notes || null,
        });

        if (result) {
            toast.success('Medicamento adicionado!');
            setIsDialogOpen(false);
            setNewMed({ name: '', dosage: '', frequency: '', start_date: '', end_date: '', notes: '' });
        } else {
            toast.error('Erro ao adicionar medicamento');
        }
    };

    const handleDelete = async (id: string) => {
        const success = await deleteMedication(id);
        if (success) {
            toast.success('Medicamento removido');
        } else {
            toast.error('Erro ao remover medicamento');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-primary" />
                        {t('medications.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Pill className="h-5 w-5 text-primary" />
                            {t('medications.title')}
                        </CardTitle>
                        <CardDescription>
                            {medications.filter((m) => m.is_active).length} {t('medications.active').toLowerCase()}
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                {t('common.add')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('medications.addMedication')}</DialogTitle>
                                <DialogDescription>
                                    {t('medications.addMedication')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="med-name">{t('medications.name')} *</Label>
                                    <Input
                                        id="med-name"
                                        value={newMed.name}
                                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                        placeholder="Ex: Losartana 50mg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="med-dosage">{t('medications.dosage')}</Label>
                                        <Input
                                            id="med-dosage"
                                            value={newMed.dosage}
                                            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                            placeholder="Ex: 1 comprimido"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="med-frequency">{t('medications.frequency')}</Label>
                                        <Input
                                            id="med-frequency"
                                            value={newMed.frequency}
                                            onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                            placeholder="Ex: 2x ao dia"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="med-start">{t('medications.startDate')}</Label>
                                        <Input
                                            id="med-start"
                                            type="date"
                                            value={newMed.start_date}
                                            onChange={(e) => setNewMed({ ...newMed, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="med-end">{t('medications.endDate')}</Label>
                                        <Input
                                            id="med-end"
                                            type="date"
                                            value={newMed.end_date}
                                            onChange={(e) => setNewMed({ ...newMed, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-notes">{t('medications.notes')}</Label>
                                    <Textarea
                                        id="med-notes"
                                        value={newMed.notes}
                                        onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                                        placeholder="Observações..."
                                    />
                                </div>
                                <Button onClick={handleAdd} className="w-full">
                                    {t('common.save')}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {medications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum medicamento cadastrado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {medications.map((med) => (
                            <div
                                key={med.id}
                                className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{med.name}</h4>
                                            <Badge variant={med.is_active ? 'default' : 'secondary'}>
                                                {med.is_active ? t('medications.active') : t('medications.inactive')}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            {med.dosage && (
                                                <span className="flex items-center gap-1">
                                                    <Pill className="h-3 w-3" />
                                                    {med.dosage}
                                                </span>
                                            )}
                                            {med.frequency && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {med.frequency}
                                                </span>
                                            )}
                                            {med.start_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(med.start_date), 'dd/MM/yy', { locale: ptBR })}
                                                    {med.end_date && ` - ${format(new Date(med.end_date), 'dd/MM/yy', { locale: ptBR })}`}
                                                </span>
                                            )}
                                        </div>
                                        {med.notes && (
                                            <p className="text-xs text-muted-foreground mt-2">{med.notes}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(med.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
