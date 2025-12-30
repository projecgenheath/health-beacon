import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

/**
 * Complete Dashboard Skeleton
 * Matches the Index page layout
 */
export const DashboardSkeleton = () => {
    return (
        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-1">
                {/* Health Summary Skeleton */}
                <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
                    <div className="flex items-center gap-3 mb-6">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <SkeletonText width="w-32" className="h-5" />
                            <SkeletonText width="w-24" className="h-3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="text-center space-y-2">
                                <SkeletonText width="w-full" className="h-8" />
                                <SkeletonText width="w-16 mx-auto" className="h-3" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upload Section Skeleton */}
                <div className="rounded-2xl bg-card p-6 shadow-md border border-border border-dashed">
                    <div className="flex justify-center mb-4">
                        <Skeleton className="h-16 w-16 rounded-2xl" />
                    </div>
                    <div className="space-y-2 mb-4">
                        <SkeletonText width="w-3/4 mx-auto" className="h-4" />
                        <SkeletonText width="w-1/2 mx-auto" className="h-3" />
                    </div>
                    <Skeleton className="w-full h-11 rounded-xl" />
                </div>

                {/* Upload History Skeleton */}
                <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
                    <SkeletonText width="w-32" className="h-5 mb-4" />
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="flex-1 space-y-1.5">
                                    <SkeletonText width="w-3/4" className="h-3" />
                                    <SkeletonText width="w-1/2" className="h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerts Skeleton */}
                <div className="rounded-2xl bg-card p-6 shadow-md border border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Skeleton className="h-5 w-5 rounded" />
                        <SkeletonText width="w-24" className="h-5" />
                    </div>
                    <div className="space-y-3">
                        {[1].map((i) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <SkeletonText width="w-2/3" className="h-4" />
                                <SkeletonText width="w-full" className="h-3" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right column - Exams List */}
            <div className="lg:col-span-2 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <SkeletonText width="w-32" className="h-6" />
                </div>

                {/* Search + Filter bar */}
                <div className="flex gap-3">
                    <Skeleton className="flex-1 h-11 rounded-xl" />
                    <Skeleton className="h-11 w-28 rounded-xl" />
                </div>

                {/* Exam Cards */}
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <SkeletonText width="w-3/4" className="h-5" />
                                    <SkeletonText width="w-1/2" className="h-3" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
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
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <SkeletonText width="w-32" className="h-3" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
