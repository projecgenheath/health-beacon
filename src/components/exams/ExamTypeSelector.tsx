import { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface ExamTypeSelectorProps {
    value: string[];
    onChange: (examTypes: string[]) => void;
}

const COMMON_EXAMS = [
    'Hemograma Completo',
    'Glicemia em Jejum',
    'Colesterol Total',
    'HDL',
    'LDL',
    'Triglicerídeos',
    'TSH',
    'T4 Livre',
    'Creatinina',
    'Ureia',
    'TGO/AST',
    'TGP/ALT',
    'Ácido Úrico',
    'Vitamina D',
    'Vitamina B12',
    'Ferritina',
    'PSA',
    'Urina Tipo 1',
];

export function ExamTypeSelector({ value, onChange }: ExamTypeSelectorProps) {
    const [customExam, setCustomExam] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Deduplicate values for display
    const uniqueExams = Array.from(new Set(value));

    const filteredExams = COMMON_EXAMS.filter(
        (exam) =>
            exam.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !uniqueExams.includes(exam)
    );

    const handleAddExam = (exam: string) => {
        // Check if exam already exists (case-insensitive)
        const examExists = uniqueExams.some(
            e => e.toLowerCase() === exam.toLowerCase()
        );

        if (!examExists) {
            onChange([...uniqueExams, exam]);
        }
    };

    const handleRemoveExam = (examToRemove: string) => {
        onChange(uniqueExams.filter((e) => e !== examToRemove));
    };

    const handleAddCustomExam = () => {
        const trimmedExam = customExam.trim();
        if (!trimmedExam) return;

        // Check if exam already exists (case-insensitive)
        const examExists = uniqueExams.some(
            e => e.toLowerCase() === trimmedExam.toLowerCase()
        );

        if (!examExists) {
            onChange([...uniqueExams, trimmedExam]);
            setCustomExam('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomExam();
        }
    };

    return (
        <div className="space-y-3">
            <Label>Tipos de Exames</Label>

            {/* Search input */}
            <div className="space-y-2">
                <Input
                    placeholder="Buscar exames..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Filtered suggestions */}
                {searchTerm && filteredExams.length > 0 && (
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                        {filteredExams.slice(0, 8).map((exam) => (
                            <button
                                key={exam}
                                type="button"
                                onClick={() => {
                                    handleAddExam(exam);
                                    setSearchTerm('');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-accent rounded text-sm"
                            >
                                {exam}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom exam input */}
            <div className="flex gap-2">
                <Input
                    placeholder="Ou digite um exame personalizado"
                    value={customExam}
                    onChange={(e) => setCustomExam(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    type="button"
                    onClick={handleAddCustomExam}
                    disabled={!customExam.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90"
                >
                    Adicionar
                </button>
            </div>

            {/* Selected exams */}
            {uniqueExams.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                        Exames selecionados ({uniqueExams.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {uniqueExams.map((exam, index) => (
                            <Badge key={`${exam}-${index}`} variant="secondary" className="gap-1">
                                {exam}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExam(exam)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
