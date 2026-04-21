/**
 * Lightweight skeleton used as Suspense fallback for lazy routes.
 * Keeps the layout calm while heavy chunks load — no spinner shock.
 */
export function RouteSkeleton() {
  return (
    <div className="min-h-screen w-full px-6 py-10 md:px-10 md:py-14" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 w-1/3 rounded-md bg-muted/40" />
        <div className="h-4 w-2/3 rounded-md bg-muted/30" />
        <div className="space-y-3 pt-4">
          <div className="h-3 w-full rounded-md bg-muted/25" />
          <div className="h-3 w-11/12 rounded-md bg-muted/25" />
          <div className="h-3 w-9/12 rounded-md bg-muted/25" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-6">
          <div className="h-24 rounded-lg bg-muted/20" />
          <div className="h-24 rounded-lg bg-muted/20" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
