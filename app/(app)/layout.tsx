import { redirect } from "next/navigation";
import { getSocialUser } from "@/lib/auth";
import { Header } from "@/components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSocialUser();
  if (!user) redirect("/login");
  const who = user.name || user.email || "Signed in";

  return (
    <div className="min-h-screen">
      <Header who={who} />
      {user.allowed ? (
        <main className="dv-wrap">{children}</main>
      ) : (
        <main className="dv-wrap">
          <h1 className="display-l">No access to Socials</h1>
          <p className="mt-3 max-w-[70ch] text-ink-soft">
            You are signed in as {user.email}, but this account does not have Socials access. An admin can add the
            socials permission to your profile.
          </p>
        </main>
      )}
    </div>
  );
}
