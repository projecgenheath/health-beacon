import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Accessibility,
    Eye,
    Type,
    Zap,
    RotateCcw,
    Monitor,
    Volume2,
} from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface SettingItemProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const SettingItem = ({
    icon,
    iconBg,
    title,
    description,
    checked,
    onCheckedChange,
}: SettingItemProps) => (
    <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBg)}>
                {icon}
            </div>
            <div>
                <Label className="text-base font-medium cursor-pointer" htmlFor={title}>
                    {title}
                </Label>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
        <Switch
            id={title}
            checked={checked}
            onCheckedChange={onCheckedChange}
            aria-label={title}
        />
    </div>
);

/**
 * Componente de configurações de acessibilidade
 * Permite ao usuário personalizar a experiência visual e de interação
 */
export const AccessibilitySettings = () => {
    const { settings, updateSetting, resetSettings } = useAccessibility();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Accessibility className="h-5 w-5" />
                            Acessibilidade
                        </CardTitle>
                        <CardDescription>
                            Personalize sua experiência para melhor usabilidade
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetSettings}
                        className="gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Restaurar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="divide-y divide-border">
                <SettingItem
                    icon={<Zap className="h-5 w-5 text-amber-500" />}
                    iconBg="bg-amber-500/10"
                    title="Reduzir Animações"
                    description="Minimiza movimento e animações na interface"
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                />

                <SettingItem
                    icon={<Eye className="h-5 w-5 text-blue-500" />}
                    iconBg="bg-blue-500/10"
                    title="Alto Contraste"
                    description="Aumenta o contraste das cores para melhor visibilidade"
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                />

                <SettingItem
                    icon={<Type className="h-5 w-5 text-emerald-500" />}
                    iconBg="bg-emerald-500/10"
                    title="Texto Grande"
                    description="Aumenta o tamanho do texto em toda a aplicação"
                    checked={settings.largeText}
                    onCheckedChange={(checked) => updateSetting('largeText', checked)}
                />

                <SettingItem
                    icon={<Volume2 className="h-5 w-5 text-violet-500" />}
                    iconBg="bg-violet-500/10"
                    title="Modo Leitor de Tela"
                    description="Otimiza conteúdo para leitores de tela"
                    checked={settings.screenReaderMode}
                    onCheckedChange={(checked) => updateSetting('screenReaderMode', checked)}
                />

                {/* Info box */}
                <div className="pt-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                        <Monitor className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">
                                Preferências do Sistema
                            </p>
                            <p>
                                Algumas configurações podem ser detectadas automaticamente do seu
                                sistema operacional, como a preferência por movimento reduzido.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
