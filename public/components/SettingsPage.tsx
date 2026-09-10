"use client";

import { useState } from "react";
import { semesters } from "@/lib/data";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

export function SettingsPage() {
  const {
    state,
    resetAllData,
    syncStatus,
    syncError,
    userEmail,
    refreshFromCloud,
    importLocalDataToCloud,
    signOut
  } = useStudy();
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<{ ok: boolean; message: string } | null>(null);
  const [healthBusy, setHealthBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    a.download = "study-os-backup.json";
    a.click();
  }

  async function testBackend() {
    setHealthBusy(true);
    setHealth(null);
    try {
      const response = await fetch("/api/backend/health", { cache: "no-store" });
      const body = await response.json();
      setHealth({
        ok: Boolean(response.ok && body.ok),
        message: response.ok && body.ok
          ? `Supabase database connected${body.openaiConfigured ? " · OpenAI key detected" : ""}`
          : body.error || "Backend health check failed."
      });
    } catch (error) {
      setHealth({ ok: false, message: error instanceof Error ? error.message : "Backend health check failed." });
    } finally {
      setHealthBusy(false);
    }
  }

  async function refresh() {
    setActionMessage("Refreshing from Supabase…");
    await refreshFromCloud();
    setActionMessage("Cloud data refreshed.");
    setTimeout(() => setActionMessage(""), 1800);
  }

  async function importLocal() {
    if (!confirm("Upload the local browser cache into your Supabase account? Cloud records with the same Study OS IDs will be updated.")) return;
    setActionMessage("Uploading local cache…");
    try {
      await importLocalDataToCloud();
      setActionMessage("Local data uploaded to Supabase.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Import failed.");
    }
    setTimeout(() => setActionMessage(""), 2500);
  }

  return <div>
    <div className="page-heading"><div><span className="eyebrow">CLOUD + PORTABLE</span><h1>Settings & data</h1><p>Your Study OS now uses Supabase as the cloud source of truth while keeping a local browser cache for fast recovery.</p></div></div>
    <div className="settings-grid">
      <section className="panel"><span className="eyebrow">SUPABASE ACCOUNT</span><h2>{userEmail || "Signed in"}</h2><div className={`backend-status-line ${syncStatus === "error" ? "error" : ""}`}><i/><strong>{syncStatus === "syncing" ? "Saving to cloud…" : syncStatus === "loading" ? "Loading cloud data…" : syncStatus === "error" ? "Cloud sync issue" : "Cloud sync active"}</strong></div>{syncError && <p className="settings-error">{syncError}</p>}<div className="settings-actions"><button className="button secondary" onClick={()=>void refresh()}><Icon name="download" size={15}/> Refresh from cloud</button><button className="button secondary" onClick={()=>void signOut()}>Sign out</button></div>{actionMessage && <small className="settings-message">{actionMessage}</small>}</section>

      <section className="panel"><span className="eyebrow">BACKEND TEST</span><h2>Verify the server connection</h2><p>This calls a server-only health route using your Supabase secret key and confirms that the <code>notes</code> table is reachable.</p><button className="button primary" onClick={testBackend} disabled={healthBusy}>{healthBusy ? "Testing…" : "Test backend"}</button>{health && <div className={`health-result ${health.ok ? "ok" : "error"}`}><Icon name={health.ok ? "check" : "alert"} size={15}/><span>{health.message}</span></div>}</section>

      <section className="panel"><span className="eyebrow">DATA BACKUP</span><h2>Own your notes.</h2><p>Export the complete in-memory dataset as JSON. Per-course pages can also create Markdown and ZIP course packs.</p><div className="settings-actions"><button className="button primary" onClick={download}><Icon name="download" size={15}/> Download backup</button><button className="button secondary" onClick={copy}>{copied ? "Copied" : "Copy JSON"}</button></div></section>

      <section className="panel"><span className="eyebrow">LOCAL → CLOUD</span><h2>Import browser cache</h2><p>If you used the old local-only prototype before signing in, this can upload that browser's cached notes, cards, assignments, resources, mistakes, General events and available workspace data.</p><button className="button secondary" onClick={importLocal}>Import local cache</button></section>

      <section className="panel"><span className="eyebrow">SEMESTERS</span><h2>Configured schedule</h2><div className="settings-semesters">{semesters.map((s)=><div key={s.id}><strong>{s.title}</strong><span>{s.courses.length} courses · {s.schedule.length} scheduled meetings</span></div>)}</div></section>

      <section className="panel danger-panel"><span className="eyebrow">CLOUD RESET</span><h2>Reset Study OS data</h2><p>Clears notes, cue cards, assignments, resources, mistakes, General events and workspaces. Because cloud sync is active, the deletion will also propagate to Supabase.</p><button className="button danger" onClick={()=>{if(confirm("Delete all Study OS learning data from this account? This will sync to Supabase.")) resetAllData()}}>Reset study data</button></section>

      <section className="panel"><span className="eyebrow">DATABASE MIGRATIONS</span><h2>Study OS V2 migration</h2><p>Existing installations should run only the additive V2 migration below. It preserves current rows and adds rich cards, General events and drawing workspaces.</p><code>supabase/migrations/0003_study_os_v2.sql</code></section>
    </div>
  </div>;
}
