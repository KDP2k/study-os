"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { allCourses } from "@/lib/data";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { state } = useStudy();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [
      { label: "Open dashboard", sub: "Today, next class, courses", href: "/app" },
      { label: "Open schedule", sub: "Weekly + today views", href: "/app/schedule" },
      { label: "Open General", sub: "Personal calendar, appointments, study blocks", href: "/app/general" },
      { label: "Study due cards", sub: "Active recall queue", href: "/app/study" },
      { label: "Open note library", sub: "All course notes", href: "/app/library" },
      { label: "Build AI context", sub: "Export structured study material", href: "/app/ai" }
    ];
    const courseItems = allCourses.map((course) => ({ label: `${course.code} · ${course.title}`, sub: course.semesterId, href: `/app/courses/${course.id}` }));
    const noteItems = state.notes.map((note) => ({ label: note.title, sub: allCourses.find((c) => c.id === note.courseId)?.code || "Note", href: `/app/courses/${note.courseId}?tab=notes` }));
    const all = [...base, ...courseItems, ...noteItems];
    return q ? all.filter((item) => `${item.label} ${item.sub}`.toLowerCase().includes(q)).slice(0, 12) : all.slice(0, 9);
  }, [query, state.notes]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-input-wrap"><Icon name="search"/><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses, notes, or commands…"/><kbd>ESC</kbd></div>
        <div className="command-results">
          {results.map((item) => <button key={`${item.href}-${item.label}`} onClick={() => { router.push(item.href); onClose(); setQuery(""); }}><span><strong>{item.label}</strong><small>{item.sub}</small></span><Icon name="arrow" size={16}/></button>)}
          {!results.length && <div className="empty-mini">No matching notes or courses.</div>}
        </div>
      </div>
    </div>
  );
}
