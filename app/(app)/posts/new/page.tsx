import { getEvents, getPillars } from "@/lib/data";
import { addDays, todayParis } from "@/lib/dates";
import { PostForm } from "@/components/PostForm";

export const dynamic = "force-dynamic";

function safeBack(b?: string) {
  return b && b.startsWith("/") && !b.startsWith("//") ? b : "/plan";
}

export default async function NewPost({ searchParams }: { searchParams: { date?: string; back?: string; event?: string } }) {
  const today = todayParis();
  const [pillars, events] = await Promise.all([getPillars(), getEvents(addDays(today, -14), addDays(today, 180))]);
  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : undefined;
  return (
    <>
      <h1 className="display-xl">New post</h1>
      <div className="mt-8">
        <PostForm pillars={pillars} events={events} back={safeBack(searchParams.back)} defaults={{ date, eventId: searchParams.event }} />
      </div>
    </>
  );
}
