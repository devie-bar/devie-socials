import Link from "next/link";
export default function NotFound() {
  return (
    <div>
      <h1 className="display-l">That post does not exist</h1>
      <p className="mt-3 text-ink-soft">It may have been deleted.</p>
      <Link href="/plan" className="dv-btn primary mt-6">
        Back To Plan
      </Link>
    </div>
  );
}
