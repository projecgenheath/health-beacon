import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-shimmer",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Utility skeleton components
const SkeletonText = ({
  className,
  width = 'w-full'
}: {
  className?: string;
  width?: string;
}) => {
  return <Skeleton className={cn('h-4', width, className)} />;
};

const SkeletonAvatar = ({ className }: { className?: string }) => {
  return <Skeleton className={cn('rounded-full h-12 w-12', className)} />;
};

const SkeletonButton = ({ className }: { className?: string }) => {
  return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />;
};

const SkeletonBadge = ({ className }: { className?: string }) => {
  return <Skeleton className={cn('h-6 w-16 rounded-full', className)} />;
};

const SkeletonIcon = ({ className }: { className?: string }) => {
  return <Skeleton className={cn('h-5 w-5 rounded', className)} />;
};

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonBadge, SkeletonIcon };
