"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CALLBACK = "https://socials.devie.bar/auth/callback";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "sent">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const addr = email.trim();
    const { data: allowed, error: gateErr } = await supabase.rpc("is_email_allowed", { p_email: addr });
    if (gateErr) {
      setBusy(false);
      setError("Could not check access just now. Try again in a moment.");
      return;
    }
    if (!allowed) {
      setBusy(false);
      setError("That email is not set up for De Vie apps. Ask an admin to add you.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true, emailRedirectTo: CALLBACK },
    });
    setBusy(false);
    if (error) {
      setError(error.message.toLowerCase().includes("rate limit") ? "Too many emails just now. Wait a minute and try again." : error.message);
      return;
    }
    setStage("sent");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) {
      setError("That code did not work. Check it, or send a new one.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-brand px-4 py-4">
        <img src="/devie-wordmark-white.png" alt="De Vie" className="h-9 w-auto" />
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pt-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">
          <h1 className="display-l">Socials</h1>
          <p className="mt-2 text-ink-soft">Plan, make and track what goes out on @devie.bar.</p>

          {stage === "email" ? (
            <form onSubmit={sendCode} className="mt-8">
              <label className="dv-field">
                <span className="label">Email</span>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <button className="dv-btn primary w-full" disabled={busy}>
                {busy ? "Sending..." : "Send sign-in code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="mt-8">
              <p className="mb-4 text-sm text-ink-soft">
                We sent a code and a link to <strong className="text-ink">{email}</strong>. Use either.
              </p>
              <label className="dv-field">
                <span className="label">Code</span>
                <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
              </label>
              <button className="dv-btn primary w-full" disabled={busy}>
                {busy ? "Checking..." : "Sign in"}
              </button>
              <button type="button" className="dv-btn mt-2 w-full" onClick={() => setStage("email")}>
                Use another email
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-inner border border-danger-line bg-danger-tint px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
