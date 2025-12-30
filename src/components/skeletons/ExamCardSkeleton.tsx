import { Skeleton, SkeletonText, SkeletonBadge, SkeletonIcon } from '@/components/ui/skeleton';

/**
 * Skeleton loader for ExamCard
 */
export const ExamCardSkeleton = () => {
    return (
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <SkeletonText width="w-3/4" className="h-5" />
                    <SkeletonText width="w-1/2" className="h-3" />
                </div>
                <SkeletonBadge className="w-20" />
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <SkeletonText width="w-16" className="h-3" />
                    <SkeletonText width="w-24" className="h-6" />
                </div>
                <div className="space-y-1.5">
                    <SkeletonText width="w-20" className="h-3" />
                    <SkeletonText width="w-32" className="h-6" />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                    <SkeletonIcon />
                    <SkeletonText width="w-24" className="h-3" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
        </div>
    );
};

/**
 * Skeleton loader for multiple ExamCards
 */
export const ExamCardsListSkeleton = ({ count = 3 }: { count?: number }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <ExamCardSkeleton key={index} />
            ))}
        </div>
    );
};
