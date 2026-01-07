import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

export const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText width="w-48" className="h-8" />
          <SkeletonText width="w-64" className="h-4" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-card p-6 border border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <SkeletonText width="w-16" className="h-3" />
                <SkeletonText width="w-12" className="h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <div className="rounded-xl bg-card p-6 border border-border">
          <SkeletonText width="w-40" className="h-5 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>

        {/* Pie Chart */}
        <div className="rounded-xl bg-card p-6 border border-border">
          <SkeletonText width="w-40" className="h-5 mb-4" />
          <div className="flex items-center justify-center h-64">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl bg-card p-6 border border-border">
        <SkeletonText width="w-48" className="h-5 mb-4" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
};
