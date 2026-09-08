"use client";

import { useState } from "react";
import JSZip from "jszip";
import { courseById } from "@/lib/data";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

export function ExportMenu({courseId}:{courseId:string}){
  const [open,setOpen]=useState(false); const [copied,setCopied]=useState(false);
  const {state,courseContext}=useStudy(); const course=courseById[courseId]; if(!course)return null;
  const context=()=>courseContext(courseId);
  async function copy(){await navigator.clipboard.writeText(context());setCopied(true);setTimeout(()=>setCopied(false),1500);setOpen(false)}
  function markdown(){downloadBlob(new Blob([context()],{type:"text/markdown"}),`${course.code.replace(" ","-")}-AI_CONTEXT.md`);setOpen(false)}
  function json(){const payload={course,notes:state.notes.filter(n=>n.courseId===courseId),flashcards:state.flashcards.filter(c=>c.courseId===courseId),assignments:state.assignments.filter(a=>a.courseId===courseId),resources:state.resources.filter(r=>r.courseId===courseId),mistakes:state.mistakes.filter(m=>m.courseId===courseId)};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),`${course.code.replace(" ","-")}-course.json`);setOpen(false)}
  async function zip(){const pack=new JSZip(); const root=pack.folder(course.code.replace(" ","-"))!; root.file("README.md",`# ${course.code} — ${course.title}\n\nExported from Study OS.`); root.file("course.json",JSON.stringify(course,null,2)); root.file("AI_CONTEXT.md",context()); const notes=root.folder("notes")!;state.notes.filter(n=>n.courseId===courseId).forEach((n,i)=>notes.file(`${String(i+1).padStart(2,"0")}-${n.title.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.md`,n.content));root.file("flashcards.json",JSON.stringify(state.flashcards.filter(c=>c.courseId===courseId),null,2));root.file("assignments.json",JSON.stringify(state.assignments.filter(a=>a.courseId===courseId),null,2));root.file("resources.json",JSON.stringify(state.resources.filter(r=>r.courseId===courseId),null,2));root.file("mistakes.json",JSON.stringify(state.mistakes.filter(m=>m.courseId===courseId),null,2)); const blob=await pack.generateAsync({type:"blob"});downloadBlob(blob,`${course.code.replace(" ","-")}-course-pack.zip`);setOpen(false)}
  return <div className="export-wrap"><button className="button secondary" onClick={()=>setOpen(!open)}><Icon name="download" size={15}/>{copied?"Copied":"Export"}</button>{open&&<div className="export-menu"><button onClick={copy}><strong>Copy for AI</strong><small>Structured context to clipboard</small></button><button onClick={markdown}><strong>Download Markdown</strong><small>Portable AI context</small></button><button onClick={json}><strong>Download JSON</strong><small>Structured course data</small></button><button onClick={zip}><strong>Download Course Pack</strong><small>Notes + cards + data in a ZIP</small></button></div>}</div>
}
