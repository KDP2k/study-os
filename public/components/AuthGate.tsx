"use client";

import { FormEvent, useState } from "react";
import { useStudy } from "./StudyProvider";
import { Icon } from "./Icons";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authStatus, signIn, signUp, supabaseConfigured, authMessage } = useStudy();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (authStatus === "authenticated") return <>{children}</>;

  if (authStatus === "loading") {
    return <main className="auth-screen"><div className="auth-card auth-loading"><span className="auth-spinner"/><h2>Connecting Study OS…</h2><p>Checking your Supabase session and cloud data.</p></div></main>;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-glyph">K//</span><div><strong>STUDY OS</strong><small>SUPABASE CLOUD</small></div></div>
        <span className="eyebrow">PRIVATE ACADEMIC WORKSPACE</span>
        <h1>{mode === "signin" ? "Sign in to your Study OS." : "Create your Study OS account."}</h1>
        <p>Your notes, cue cards, assignments, resources and mistakes will sync through your Supabase project instead of living only in this browser.</p>

        {!supabaseConfigured && <div className="auth-alert error"><Icon name="alert" size={16}/><span>Supabase environment variables are missing. Check <code>.env.local</code>.</span></div>}
        {authMessage && <div className="auth-alert"><Icon name="check" size={16}/><span>{authMessage}</span></div>}
        {error && <div className="auth-alert error"><Icon name="alert" size={16}/><span>{error}</span></div>}

        <form onSubmit={submit} className="auth-form">
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password<input type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••"/></label>
          <button className="button primary large auth-submit" disabled={busy || !supabaseConfigured}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>

        <button className="auth-switch" onClick={()=>{setMode(mode === "signin" ? "signup" : "signin");setError("")}}>
          {mode === "signin" ? "First time here? Create an account" : "Already have an account? Sign in"}
        </button>
        <small className="auth-footnote">If Supabase email confirmation is enabled, confirm the signup email before signing in.</small>
      </section>
    </main>
  );
}
