import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton para o widget de tendências de saúde
 */
export const HealthTrendsSkeleton = () => {
    return (
        <Card className="glass-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-12" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Trend items */}
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                    >
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Skeleton className="h-4 w-14" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                    </div>
                ))}

                {/* Summary footer */}
                <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Skeleton para o card de score de saúde
 */
export const HealthScoreSkeleton = () => {
    return (
        <Card className="glass-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score display */}
                <div className="flex items-center justify-center py-4">
                    <Skeleton className="h-16 w-20" />
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </div>

                {/* Trends summary */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="text-center space-y-1">
                            <Skeleton className="h-6 w-8 mx-auto" />
                            <Skeleton className="h-3 w-16 mx-auto" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Skeleton para ações rápidas
 */
export const QuickActionsSkeleton = () => {
    return (
        <Card className="glass-card">
            <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30"
                        >
                            <Skeleton className="h-6 w-6 mb-2" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
