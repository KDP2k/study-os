"use client";
import { useMemo, useState } from "react";
import { allCourses } from "@/lib/data";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

const instructions={
  explain:"Explain the selected material deeply, starting from first principles and using the course context as the source of truth.",
  quiz:"Quiz me with active recall. Ask one question at a time and do not reveal the answer before I attempt it.",
  summarize:"Create a concise but complete study summary organized by concepts, dependencies, and exam-relevant details.",
  cards:"Create atomic cue cards. Each card should test one idea and avoid vague prompts.",
  gaps:"Find gaps, contradictions, weak areas, and concepts that my notes mention without adequately explaining.",
  exam:"Create an exam-prep plan prioritizing weak/high-value material, then generate exam-style questions without immediate solutions."
};

export function AILab(){
 const {state,courseContext}=useStudy();const [courseId,setCourseId]=useState(allCourses[0].id);const [mode,setMode]=useState<keyof typeof instructions>("quiz");const [copied,setCopied]=useState(false);
 const course=allCourses.find(c=>c.id===courseId)!;
 const stats=useMemo(()=>({notes:state.notes.filter(n=>n.courseId===courseId).length,cards:state.flashcards.filter(c=>c.courseId===courseId).length,resources:state.resources.filter(r=>r.courseId===courseId).length,mistakes:state.mistakes.filter(m=>m.courseId===courseId).length}),[state,courseId]);
 const prompt=`${courseContext(courseId)}\n\n# CURRENT TASK\n\n${instructions[mode]}`;
 async function copy(){await navigator.clipboard.writeText(prompt);setCopied(true);setTimeout(()=>setCopied(false),1500)}
 return <div className="ai-lab-page"><div className="page-heading"><div><span className="eyebrow">CONTEXT, NOT CHAT CHAOS</span><h1>AI Lab</h1><p>Build a clean, source-aware study prompt from the material already stored in Study OS.</p></div></div><div className="ai-lab-grid"><section className="panel ai-config"><span className="eyebrow">01 · CONTEXT</span><h2>Select course</h2><select value={courseId} onChange={e=>setCourseId(e.target.value)}>{allCourses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}</select><div className="context-stats"><div><strong>{stats.notes}</strong><span>notes</span></div><div><strong>{stats.cards}</strong><span>cards</span></div><div><strong>{stats.resources}</strong><span>resources</span></div><div><strong>{stats.mistakes}</strong><span>mistakes</span></div></div><span className="eyebrow block">02 · TASK</span><div className="ai-mode-grid">{Object.keys(instructions).map(key=><button key={key} className={mode===key?"active":""} onClick={()=>setMode(key as keyof typeof instructions)}>{key==="cards"?"Create cards":key==="gaps"?"Find gaps":key==="exam"?"Exam prep":key.charAt(0).toUpperCase()+key.slice(1)}</button>)}</div><div className="ai-action-note"><Icon name="spark"/><p>The prototype keeps AI provider-independent. Copy this context into ChatGPT or another agent today; a server-side provider can be wired later without changing your stored study data.</p></div></section><section className="panel ai-output"><div className="panel-heading"><div><span className="eyebrow">03 · AGENT PACKET</span><h2>{course.code} · {mode}</h2></div><button className="button primary" onClick={copy}>{copied?"Copied":"Copy prompt"}</button></div><textarea readOnly value={prompt}/></section></div></div>
}
