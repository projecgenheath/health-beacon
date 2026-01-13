import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Activity, TrendingUp } from "lucide-react";

export const ExamCardSkeleton = () => (
    <div className="rounded-2xl bg-card border border-border/50 p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    </div>
);

export const ExamListSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
            <ExamCardSkeleton key={i} />
        ))}
    </div>
);

export const AnalyticsCardSkeleton = () => (
    <div className="rounded-2xl bg-card border border-border/50 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-6 w-24" />
            </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
    </div>
);

export const ChartSkeleton = () => (
    <div className="rounded-2xl bg-card border border-border/50 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
            <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="relative h-80">
            <div className="absolute inset-0 flex items-end justify-around gap-2 px-4">
                {[65, 45, 80, 55, 70, 40, 60].map((height, i) => (
                    <Skeleton
                        key={i}
                        className="w-full rounded-t-lg"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    </div>
);

export const UploadHistorySkeleton = () => (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-pulse">
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-5 w-5 rounded" />
        </div>
    </div>
);

export const ProfileSkeleton = () => (
    <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
        <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-card border border-border/50 p-4">
                    <Skeleton className="h-4 w-32 mb-3" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
        </div>
    </div>
);
