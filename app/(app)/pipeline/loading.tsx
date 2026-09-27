import { Bone, SkeletonShell } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonShell>
      <Bone w={220} h={40} />
      <Bone w="60%" h={18} className="mt-4" />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bone key={i} h={52} />
        ))}
      </div>
    </SkeletonShell>
  );
}
