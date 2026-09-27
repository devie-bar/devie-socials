"use client";

import { useState } from "react";

/** Instagram CDN links expire; when one fails, show a plain tile saying so rather than a broken image. */
export function Thumb({ src, alt, tall = false }: { src: string | null; alt: string; tall?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ratio = tall ? "aspect-[9/16]" : "aspect-[4/5]";
  if (!src || failed)
    return (
      <span className={`flex ${ratio} w-full items-center justify-center rounded-media bg-paper-wash px-2 text-center text-[12px] text-ink-soft`}>
        No preview. Syncs again soon.
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`${ratio} w-full rounded-media object-cover`} />;
}
