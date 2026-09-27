/** DESIGN.md 3.5: appears after 200ms, announces "Loading" once, blocks are aria-hidden. */
export function SkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dv-skel-wrap" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}
export function Bone({ w = "100%", h = 16, className = "" }: { w?: number | string; h?: number; className?: string }) {
  return <span className={`dv-skel ${className}`} style={{ width: w, height: h }} />;
}
