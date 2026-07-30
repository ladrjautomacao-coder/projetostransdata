import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectFollowUpSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="space-y-2 rounded-lg border border-border/50 p-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}
