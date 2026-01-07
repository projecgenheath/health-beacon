import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

export const CompareExamsSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText width="w-48" className="h-8" />
        <SkeletonText width="w-72" className="h-4" />
      </div>

      {/* Date Selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-card p-6 border border-border space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <SkeletonText width="w-24" className="h-5" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Comparison Results */}
      <div className="rounded-xl bg-card p-6 border border-border">
        <SkeletonText width="w-40" className="h-5 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-1.5">
                <SkeletonText width="w-32" className="h-4" />
                <SkeletonText width="w-24" className="h-3" />
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right space-y-1">
                  <SkeletonText width="w-16" className="h-5" />
                  <SkeletonText width="w-12" className="h-3" />
                </div>
                <Skeleton className="h-6 w-6 rounded" />
                <div className="text-right space-y-1">
                  <SkeletonText width="w-16" className="h-5" />
                  <SkeletonText width="w-12" className="h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
