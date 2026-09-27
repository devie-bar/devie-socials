import { Bone, SkeletonShell } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonShell>
      <div className="flex items-end justify-between">
        <Bone w={140} h={40} />
        <Bone w={120} h={40} />
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] md:items-end md:gap-12">
        <div>
          <Bone w={180} h={12} />
          <Bone w={200} h={56} className="mt-2" />
        </div>
        <Bone w="70%" h={24} />
      </div>
      {[0, 1].map((w) => (
        <div key={w} className="mt-12">
          <Bone w={220} h={28} />
          <Bone w="50%" h={20} className="mt-3" />
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Bone key={i} h={150} className="rounded-module" />
            ))}
          </div>
        </div>
      ))}
    </SkeletonShell>
  );
}
