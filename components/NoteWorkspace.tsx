"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icons";
import { DrawingPreview, DrawingWorkspace } from "./DrawingWorkspace";
import { useStudy } from "./StudyProvider";

const slashCommands = [
  { key: "heading", label: "Heading", hint: "Large section heading", template: "# " },
  { key: "equation", label: "Equation", hint: "LaTeX block", template: "$$\n\\text{equation}\n$$" },
  { key: "code", label: "Code block", hint: "Fenced source code", template: "```ts\n// code\n```" },
  { key: "callout", label: "Callout", hint: "Important idea", template: "> **Key idea:** " },
  { key: "definition", label: "Definition", hint: "Atomic concept", template: "**Definition —** " },
  { key: "question", label: "Question", hint: "Something to resolve", template: "- [ ] **Question:** " },
  { key: "exam", label: "Exam note", hint: "Mark as testable", template: "⚑ **EXAM:** " },
  { key: "flashcard", label: "Flashcard", hint: "Create a real cue card", template: "" }
] as const;

export function NoteWorkspace({ courseId }: { courseId: string }) {
  const { state, addNote, updateNote, deleteNote, addFlashcard, addDrawing, deleteDrawing } = useStudy();
  const notes = useMemo(() => state.notes.filter((note) => note.courseId === courseId).sort((a,b) => +new Date(b.updatedAt)-+new Date(a.updatedAt)), [state.notes, courseId]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slash, setSlash] = useState<{ query: string; start: number; end: number } | null>(null);
  const [cardModal, setCardModal] = useState(false);
  const [cardQ, setCardQ] = useState("");
  const [cardA, setCardA] = useState("");
  const [openDrawing, setOpenDrawing] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedId && notes[0]) setSelectedId(notes[0].id);
    if (selectedId && !notes.some((note) => note.id === selectedId)) setSelectedId(notes[0]?.id || null);
  }, [notes, selectedId]);

  const selected = notes.find((note) => note.id === selectedId) || null;

  function createNote() {
    const id = addNote(courseId, { title: `Lecture ${String(notes.length + 1).padStart(2, "0")} — Untitled`, content: `# Lecture ${String(notes.length + 1).padStart(2, "0")}\n\n## Objectives\n\n- \n\n## Notes\n\n\n## Key concepts\n\n\n## Questions I still have\n\n- [ ] \n\n## Exam material\n\n` });
    setSelectedId(id);
  }

  function detectSlash(value: string, caret: number) {
    const before = value.slice(0, caret);
    const lineStart = Math.max(before.lastIndexOf("\n") + 1, 0);
    const fragment = before.slice(lineStart);
    if (fragment.startsWith("/") && !fragment.includes(" ")) setSlash({ query: fragment.slice(1).toLowerCase(), start: lineStart, end: caret });
    else setSlash(null);
  }

  function insertTemplate(template: string) {
    if (!selected || !slash) return;
    const next = selected.content.slice(0, slash.start) + template + selected.content.slice(slash.end);
    updateNote(selected.id, { content: next });
    const caret = slash.start + template.length;
    setSlash(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(caret, caret);
    });
  }

  function selectSlashCommand(command: typeof slashCommands[number]) {
    if (command.key === "flashcard") {
      if (selected && slash) updateNote(selected.id, { content: selected.content.slice(0, slash.start) + selected.content.slice(slash.end) });
      setSlash(null);
      setCardModal(true);
      return;
    }
    insertTemplate(command.template);
  }

  function saveCard() {
    if (!cardQ.trim() || !cardA.trim()) return;
    addFlashcard(courseId, { prompt: cardQ.trim(), answer: cardA.trim(), sourceNoteId: selected?.id });
    setCardQ(""); setCardA(""); setCardModal(false);
  }

  const filteredCommands = slashCommands.filter((command) => !slash?.query || command.key.includes(slash.query) || command.label.toLowerCase().includes(slash.query));

  return (
    <div className="notes-workspace">
      <aside className="notes-list">
        <div className="notes-list-head"><div><span className="eyebrow">LECTURES</span><strong>{notes.length} notes</strong></div><button className="icon-button small" onClick={createNote} aria-label="New note"><Icon name="plus" size={16}/></button></div>
        <button className="new-note-button" onClick={createNote}><Icon name="plus" size={15}/> New lecture note</button>
        <div className="note-items">
          {notes.map((note) => <button key={note.id} className={note.id === selectedId ? "active" : ""} onClick={() => setSelectedId(note.id)}><strong>{note.title}</strong><small>{new Date(note.updatedAt).toLocaleDateString("en-CA",{month:"short",day:"numeric"})} · {note.content.trim().split(/\s+/).filter(Boolean).length} words</small></button>)}
          {!notes.length && <div className="empty-mini">Your lecture notes will stay organized here.</div>}
        </div>
      </aside>

      <section className="note-editor-panel">
        {selected ? <>
          <div className="note-editor-top">
            <input className="note-title-input" value={selected.title} onChange={(e)=>updateNote(selected.id,{title:e.target.value})}/>
            <div className="note-actions"><span className="autosave-dot"><i/> autosaved</span><button className="icon-button small danger-ghost" onClick={()=>{ if(confirm("Delete this note?")) deleteNote(selected.id); }} aria-label="Delete note"><Icon name="trash" size={15}/></button></div>
          </div>
          <div className="editor-toolbar">
            {slashCommands.slice(0,7).map((command)=><button key={command.key} onClick={()=>{
              const ref=textareaRef.current; if(!ref)return; const start=ref.selectionStart; const value=selected.content; const template=command.template; const next=value.slice(0,start)+template+value.slice(ref.selectionEnd); updateNote(selected.id,{content:next}); requestAnimationFrame(()=>{ref.focus();ref.setSelectionRange(start+template.length,start+template.length)});
            }}>{command.key === "heading" ? "H1" : command.key === "equation" ? "∑" : command.key === "code" ? "</>" : command.key === "callout" ? "!" : command.key === "definition" ? "Def" : command.key === "question" ? "?" : "⚑"}</button>)}
            <span/>
            <button onClick={()=>setCardModal(true)}><Icon name="cards" size={14}/> Card</button>
            <small>Type <kbd>/</kbd> for commands</small>
          </div>
          <div className="editor-canvas-wrap">
            <textarea
              ref={textareaRef}
              className="note-textarea"
              value={selected.content}
              onChange={(e)=>{updateNote(selected.id,{content:e.target.value}); detectSlash(e.target.value,e.target.selectionStart);}}
              onClick={(e)=>detectSlash(e.currentTarget.value,e.currentTarget.selectionStart)}
              onKeyUp={(e)=>detectSlash(e.currentTarget.value,e.currentTarget.selectionStart)}
              placeholder="Start typing your lecture notes…"
              spellCheck
            />
            {slash && filteredCommands.length > 0 && <div className="slash-menu">{filteredCommands.map((command)=><button key={command.key} onMouseDown={(e)=>{e.preventDefault();selectSlashCommand(command)}}><span><strong>/{command.key}</strong><small>{command.hint}</small></span><Icon name="arrow" size={14}/></button>)}</div>}
          </div>
          <div className="note-workspaces">
            <div className="note-workspace-head"><div><span className="eyebrow">WORKSPACE</span><strong>Handwritten / diagram pages</strong></div><button className="button micro" onClick={()=>{const id=addDrawing({courseId,noteId:selected.id,title:`${selected.title} — Workspace`});updateNote(selected.id,{drawingIds:[...(selected.drawingIds||[]),id]});setOpenDrawing(id)}}>+ DRAW SET</button></div>
            <div className="note-workspace-grid">{(selected.drawingIds||[]).map((id)=>{const drawing=state.drawings.find((d)=>d.id===id);return drawing?<div className="note-workspace-card" key={id}><button className="note-workspace-open" onClick={()=>setOpenDrawing(id)}><DrawingPreview drawing={drawing}/><span>{drawing.title}</span><small>{drawing.pages.length} page{drawing.pages.length===1?"":"s"}</small></button><button className="note-workspace-delete" aria-label={`Delete ${drawing.title}`} title="Delete workspace set" onClick={()=>{if(window.confirm(`Delete "${drawing.title}" and all ${drawing.pages.length} page${drawing.pages.length===1?"":"s"}? This cannot be undone.`)){deleteDrawing(id);if(openDrawing===id)setOpenDrawing(null)}}}><Icon name="trash" size={14}/></button></div>:null})}</div>
          </div>
          <div className="editor-status"><span>Markdown-first · AI-friendly</span><span>{selected.content.length.toLocaleString()} characters</span></div>
        </> : <div className="empty-state editor-empty"><Icon name="file" size={30}/><h3>Create your first lecture note.</h3><p>The editor is Markdown-first, autosaves to Supabase with a local browser cache, and can generate real cue cards from the slash menu.</p><button className="button primary" onClick={createNote}>Create note</button></div>}
      </section>

      {openDrawing && <DrawingWorkspace drawingId={openDrawing} onClose={()=>setOpenDrawing(null)}/>}
      {cardModal && <div className="modal-backdrop" onMouseDown={()=>setCardModal(false)}><div className="small-modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-title"><div><span className="eyebrow">CUE CARD</span><h3>Create from note</h3></div><button className="icon-button small" onClick={()=>setCardModal(false)}><Icon name="close" size={16}/></button></div><label>Question<textarea value={cardQ} onChange={(e)=>setCardQ(e.target.value)} placeholder="What should future-you recall?"/></label><label>Answer<textarea value={cardA} onChange={(e)=>setCardA(e.target.value)} placeholder="Keep it atomic and precise."/></label><div className="modal-actions"><button className="button secondary" onClick={()=>setCardModal(false)}>Cancel</button><button className="button primary" onClick={saveCard}>Create card</button></div></div></div>}
    </div>
  );
}
