export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-pulse space-y-4"
    >
      <div className="h-4 w-36 rounded bg-violet-100" />
      <div className="h-8 w-56 rounded bg-stone-100" />
      <div className="h-4 w-72 max-w-full rounded bg-stone-100" />
      <div className="h-24 rounded-xl bg-stone-100" />
    </div>
  );
}
