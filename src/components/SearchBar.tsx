import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    showClearButton?: boolean;
}

export const SearchBar = ({
    value,
    onChange,
    placeholder = 'Buscar...',
    className,
    showClearButton = true,
}: SearchBarProps) => {
    const handleClear = () => {
        onChange('');
    };

    return (
        <div className={cn('relative w-full', className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-background"
                />
                {showClearButton && value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Limpar busca</span>
                    </Button>
                )}
            </div>
            {value && (
                <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                    Buscando por "{value}"
                </p>
            )}
        </div>
    );
};
