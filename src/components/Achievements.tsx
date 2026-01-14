import { useTranslation } from 'react-i18next';
import { useAchievements } from '@/hooks/useAchievements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
    'pt-BR': ptBR,
    'en-US': enUS,
    'es-ES': es,
};

export const Achievements = () => {
    const { t, i18n } = useTranslation();
    const { achievements, loading, unlockedCount, totalCount } = useAchievements();
    const locale = localeMap[i18n.language] || ptBR;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {t('achievements.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
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
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            {t('achievements.title')}
                        </CardTitle>
                        <CardDescription>
                            {unlockedCount} / {totalCount} {t('achievements.unlocked').toLowerCase()}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-yellow-500">{unlockedCount}</span>
                        <span className="text-muted-foreground text-sm">/{totalCount}</span>
                    </div>
                </div>
                <Progress value={(unlockedCount / totalCount) * 100} className="mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {achievements.map((achievement) => {
                        const isUnlocked = !!achievement.unlockedAt;
                        const progress = achievement.progress || 0;
                        const target = achievement.target || 1;
                        const progressPercent = Math.min((progress / target) * 100, 100);

                        return (
                            <div
                                key={achievement.key}
                                className={cn(
                                    'p-4 rounded-xl border transition-all duration-300',
                                    isUnlocked
                                        ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30'
                                        : 'bg-muted/30 border-border/50 opacity-60'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            'h-12 w-12 rounded-xl flex items-center justify-center text-2xl',
                                            isUnlocked
                                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                                                : 'bg-muted'
                                        )}
                                    >
                                        {isUnlocked ? achievement.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{t(achievement.titleKey)}</h4>
                                            {isUnlocked && (
                                                <Badge variant="secondary" className="text-[10px] h-4">
                                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                                    {t('achievements.unlocked')}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{t(achievement.descKey)}</p>
                                        {!isUnlocked && target > 1 && (
                                            <div className="mt-2">
                                                <Progress value={progressPercent} className="h-1.5" />
                                                <span className="text-xs text-muted-foreground">
                                                    {progress}/{target}
                                                </span>
                                            </div>
                                        )}
                                        {isUnlocked && achievement.unlockedAt && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(achievement.unlockedAt), "d 'de' MMMM, yyyy", { locale })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
