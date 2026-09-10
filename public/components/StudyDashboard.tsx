"use client";

import { useMemo, useState } from "react";
import { allCourses } from "@/lib/data";
import { isDue, nextLectureReview } from "@/lib/study";
import { Icon } from "./Icons";
import { FlashcardWorkspace } from "./FlashcardWorkspace";
import { useStudy } from "./StudyProvider";

export function StudyDashboard(){
  const {state,semester,updateNote}=useStudy();
  const semesterCourseIds=new Set(semester.courses.map(c=>c.id));
  const due=state.flashcards.filter(card=>semesterCourseIds.has(card.courseId)&&isDue(card));
  const mistakes=state.mistakes.filter(m=>semesterCourseIds.has(m.courseId)).sort((a,b)=>b.count-a.count);
  const [selectedCourse,setSelectedCourse]=useState(semester.courses[0]?.id||"");
  const [recallNoteId,setRecallNoteId]=useState("");
  const [recallText,setRecallText]=useState("");
  const [revealed,setRevealed]=useState(false);
  const courseNotes=state.notes.filter(n=>n.courseId===selectedCourse);
  const recallNote=courseNotes.find(n=>n.id===recallNoteId);
  const dueByCourse=useMemo(()=>semester.courses.map(course=>({course,count:due.filter(card=>card.courseId===course.id).length})).filter(x=>x.count),[semester,due]);

  function markRecall(success:boolean){if(!recallNote)return;const nextStage=success?recallNote.reviewStage+1:Math.max(0,recallNote.reviewStage-1);updateNote(recallNote.id,{reviewStage:nextStage,nextReviewAt:nextLectureReview(nextStage)});setRecallText("");setRevealed(false)}

  return <div className="study-page">
    <div className="page-heading"><div><span className="eyebrow">LEARNING ENGINE</span><h1>Study</h1><p>Active recall first: cards, lecture recall, mistakes and mixed review across your current semester.</p></div><div className="study-score"><span>Due now</span><strong>{due.length}</strong><small>cards</small></div></div>

    <div className="study-overview-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">TODAY'S REVIEW</span><h2>{due.length} cards</h2></div></div>{dueByCourse.length?<div className="review-list">{dueByCourse.map(({course,count})=><div key={course.id}><span>{course.shortName}</span><strong>{count}</strong><div className="meter"><i style={{width:`${Math.min(100,count*10+25)}%`}}/></div></div>)}</div>:<div className="empty-state compact"><Icon name="check"/><p>Your due-card queue is clear.</p></div>}</section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">MISTAKE BANK</span><h2>{mistakes.length} weak prompts</h2></div></div>{mistakes.length?<div className="mistake-list">{mistakes.slice(0,6).map(m=><div key={m.id}><span>{allCourses.find(c=>c.id===m.courseId)?.code}</span><strong>{m.topic}</strong><em>{m.count}×</em></div>)}</div>:<div className="empty-state compact"><Icon name="target"/><p>Cards rated “Again” will automatically build your mistake bank.</p></div>}</section></div>

    <section className="panel recall-lab"><div className="panel-heading"><div><span className="eyebrow">RECALL MODE</span><h2>Hide the note. Reconstruct it from memory.</h2></div></div><div className="recall-controls"><select value={selectedCourse} onChange={(e)=>{setSelectedCourse(e.target.value);setRecallNoteId("");setRevealed(false)}}>{semester.courses.map(c=><option key={c.id} value={c.id}>{c.code} · {c.shortName}</option>)}</select><select value={recallNoteId} onChange={(e)=>{setRecallNoteId(e.target.value);setRevealed(false)}}><option value="">Choose a lecture note</option>{courseNotes.map(n=><option key={n.id} value={n.id}>{n.title}</option>)}</select></div>{recallNote?<div className="recall-grid"><div><label>Your reconstruction</label><textarea value={recallText} onChange={(e)=>setRecallText(e.target.value)} placeholder="Explain everything you remember before revealing the source…"/><button className="button primary" onClick={()=>setRevealed(true)}>Reveal source note</button></div><div className={`source-note ${revealed?"revealed":""}`}><label>Source</label>{revealed?<pre>{recallNote.content}</pre>:<div className="hidden-note"><Icon name="brain" size={30}/><strong>Source hidden</strong><span>Recall first. Recognition is easier than retrieval.</span></div>}{revealed&&<div className="self-rate"><button onClick={()=>markRecall(false)}>Needs work</button><button onClick={()=>markRecall(true)}>I recalled it well</button></div>}</div></div>:<div className="empty-inline">Create a lecture note in a course, then choose it here for retrieval practice.</div>}</section>

    <section className="panel mixed-review"><div className="panel-heading"><div><span className="eyebrow">MIXED REVIEW</span><h2>Interleave your current semester</h2></div></div><p>Choose a course deck below, or move between courses during one session rather than drilling a single topic until it only feels familiar.</p><div className="course-select-row">{semester.courses.map(c=><button key={c.id} className={selectedCourse===c.id?"active":""} onClick={()=>setSelectedCourse(c.id)}>{c.shortName}<small>{state.flashcards.filter(card=>card.courseId===c.id&&isDue(card)).length} due</small></button>)}</div><FlashcardWorkspace courseId={selectedCourse} embedded/></section>
  </div>
}
