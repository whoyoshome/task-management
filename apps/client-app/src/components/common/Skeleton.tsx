/** Placeholder blocks shown while data loads, shaped like the content. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

/** Busy region for screen readers, wrapping visual placeholders. */
function Loading({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="status" aria-label={label}>
      {children}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Loading label="Loading projects">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-lg border bg-white p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function BoardSkeleton() {
  return (
    <Loading label="Loading the board">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[3, 2, 1].map((cards, i) => (
          <div key={i} className="rounded-lg border bg-white">
            <Skeleton className="h-12 rounded-b-none" />
            <div className="space-y-3 p-3">
              {Array.from({ length: cards }, (_, j) => (
                <Skeleton key={j} className="h-20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Loading label="Loading tasks">
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </Loading>
  );
}
