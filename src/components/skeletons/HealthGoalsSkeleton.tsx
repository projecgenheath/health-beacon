import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const HealthGoalsSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <SkeletonText width="w-32" className="h-5" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border bg-card space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-1.5">
                    <SkeletonText width="w-24" className="h-4" />
                    <SkeletonText width="w-32" className="h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <SkeletonText width="w-16" className="h-3" />
                  <SkeletonText width="w-20" className="h-3" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <SkeletonText width="w-16 ml-auto" className="h-3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
