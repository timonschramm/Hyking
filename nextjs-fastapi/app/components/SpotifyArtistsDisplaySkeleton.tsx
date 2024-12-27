import { Skeleton } from "@/components/ui/skeleton";

export const SpotifyArtistsDisplaySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <div className="aspect-square relative">
          <Skeleton className="absolute inset-0 rounded-lg" />
        </div>
      </div>
    ))}
  </div> 
);
