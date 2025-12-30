import { Skeleton, SkeletonText, SkeletonIcon } from '@/components/ui/skeleton';

/**
 * Skeleton loader for HealthSummaryCard
 */
export const HealthSummaryCardSkeleton = () => {
    return (
        <div className="rounded-2xl bg-card p-6 shadow-md border border-border animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1">
                    <SkeletonText width="w-32" className="h-5 mb-2" />
                    <SkeletonText width="w-24" className="h-3" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center space-y-2">
                        <SkeletonText width="w-full" className="h-8" />
                        <SkeletonText width="w-16 mx-auto" className="h-3" />
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-border" />

            {/* Bottom text */}
            <SkeletonText width="w-3/4 mx-auto" className="h-3" />
        </div>
    );
};
