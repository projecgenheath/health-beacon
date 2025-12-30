import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

/**
 * Skeleton loader for AlertsSection
 */
export const AlertsSectionSkeleton = () => {
    return (
        <div className="rounded-2xl bg-card p-6 shadow-md border border-border animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 rounded" />
                <SkeletonText width="w-24" className="h-5" />
            </div>

            {/* Alert Items */}
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-start justify-between">
                            <SkeletonText width="w-2/3" className="h-4" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <SkeletonText width="w-full" className="h-3" />
                        <SkeletonText width="w-4/5" className="h-3" />
                    </div>
                ))}
            </div>
        </div>
    );
};
