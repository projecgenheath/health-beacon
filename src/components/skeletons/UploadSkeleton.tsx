import { Skeleton, SkeletonText, SkeletonButton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for UploadSection
 */
export const UploadSectionSkeleton = () => {
    return (
        <div className="rounded-2xl bg-card p-6 shadow-md border border-border border-dashed animate-pulse">
            {/* Icon */}
            <div className="flex justify-center mb-4">
                <Skeleton className="h-16 w-16 rounded-2xl" />
            </div>

            {/* Text */}
            <div className="space-y-2 mb-4">
                <SkeletonText width="w-3/4 mx-auto" className="h-4" />
                <SkeletonText width="w-1/2 mx-auto" className="h-3" />
            </div>

            {/* Button */}
            <SkeletonButton className="w-full h-11" />
        </div>
    );
};

/**
 * Skeleton loader for UploadHistory
 */
export const UploadHistorySkeleton = () => {
    return (
        <div className="rounded-2xl bg-card p-6 shadow-md border border-border animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <SkeletonText width="w-32" className="h-5" />
                <Skeleton className="h-6 w-6 rounded" />
            </div>

            {/* History Items */}
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <SkeletonText width="w-3/4" className="h-3" />
                            <SkeletonText width="w-1/2" className="h-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
