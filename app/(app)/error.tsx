"use client";

// DESIGN.md 3.5: what failed, in a sentence, plus Retry.
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const timedOut = /abort|timeout/i.test(error.message);
  return (
    <div role="alert" className="max-w-[70ch]">
      <h1 className="display-m">This page did not load</h1>
      <p className="mt-3 text-ink-soft">
        {timedOut ? "The database took more than 10 seconds to answer." : error.message || "Something went wrong reading the data."}
      </p>
      <button type="button" className="dv-btn primary mt-6" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
