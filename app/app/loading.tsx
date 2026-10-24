export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-black/[0.06]" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white/70 ring-1 ring-black/5" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-white/70 ring-1 ring-black/5" />
      <p className="sr-only">Chargement en cours…</p>
    </div>
  );
}
