"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, IconName } from "./Icons";
import { useStudy } from "./StudyProvider";
import { CommandPalette } from "./CommandPalette";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/app", label: "Dashboard", icon: "home" },
  { href: "/app/schedule", label: "Schedule", icon: "calendar" },
  { href: "/app/general", label: "General", icon: "target" },
  { href: "/app/study", label: "Study", icon: "brain" },
  { href: "/app/library", label: "Library", icon: "book" },
  { href: "/app/ai", label: "AI Lab", icon: "spark" },
  { href: "/app/settings", label: "Settings", icon: "settings" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { semester, syncStatus, syncError, userEmail, signOut } = useStudy();
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lakehead-study-os:theme");
    const next = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("lakehead-study-os:theme", next ? "dark" : "light");
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const syncLabel = syncStatus === "syncing" ? "Saving…" : syncStatus === "loading" ? "Loading…" : syncStatus === "error" ? "Sync issue" : "Cloud saved";

  return (
    <div className={`app-shell season-${semester.season}`}>
      <aside className="sidebar">
        <Link href="/app" className="brand-mark app-wordmark" aria-label="Study OS dashboard">
          <span><strong>STUDY_OS</strong><small>// SOFTWARE_ENGINEERING</small></span>
        </Link>
        <nav className="side-nav">
          {nav.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`side-link ${active ? "active" : ""}`}>
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className={`cloud-status ${syncStatus === "error" ? "error" : ""}`} title={syncError || "Your study data is synced to Supabase."}>
            <span className="status-dot" />
            <div><strong>{syncLabel}</strong><small>{userEmail || "Supabase"}</small></div>
          </div>
          <div className="semester-mini">
            <span className="status-dot" />
            <div><strong>{semester.title}</strong><small>{semester.courses.length} courses</small></div>
          </div>
          <button className="sidebar-signout" onClick={()=>void signOut()}>Sign out</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-mobile-brand">STUDY_OS</div>
          <button className="command-trigger" onClick={() => setPaletteOpen(true)}>
            <Icon name="search" size={16}/><span>Search or command</span><kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <span className={`sync-pill ${syncStatus === "error" ? "error" : ""}`} title={syncError || "Synced to Supabase"}><i/>{syncLabel}</span>
            <span className="season-pill">{semester.season === "fall" ? "FALL" : "WINTER"} MODE</span>
            <button className="icon-button" onClick={toggleTheme} aria-label="Toggle dark mode"><Icon name={dark ? "sun" : "moon"}/></button>
          </div>
        </header>
        <main className="content-wrap">{children}</main>
      </div>

      <nav className="mobile-nav">
        {nav.filter((item)=>["/app","/app/schedule","/app/general","/app/study","/app/library"].includes(item.href)).map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon name={item.icon} size={19}/><span>{item.label.replace("Dashboard", "Home")}</span></Link>;
        })}
      </nav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
