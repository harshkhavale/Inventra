/** Placeholder shown while a client-rendered view mounts. */
export function ViewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex animate-pulse flex-col gap-5">
      <div className="grid gap-3.5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[98px] rounded-[14px] border border-line bg-white" />
        ))}
      </div>
      <div className="h-[420px] rounded-[14px] border border-line bg-white" />
    </div>
  );
}
