"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

export function AssignmentsPanel({ courseId }: { courseId: string }) {
  const {state,addAssignment,updateAssignment,deleteAssignment}=useStudy();
  const items=useMemo(()=>state.assignments.filter((item)=>item.courseId===courseId).sort((a,b)=>+new Date(a.dueAt)-+new Date(b.dueAt)),[state.assignments,courseId]);
  const [adding,setAdding]=useState(false);
  const [title,setTitle]=useState(""); const [due,setDue]=useState(""); const [weight,setWeight]=useState("10");
  const graded=items.filter((item)=>typeof item.score==="number"&&item.weight>0);
  const gradedWeight=graded.reduce((sum,item)=>sum+item.weight,0);
  const weighted=graded.reduce((sum,item)=>sum+(item.score||0)*item.weight,0);
  const current=gradedWeight?weighted/gradedWeight:null;

  function add(){if(!title.trim()||!due)return;addAssignment(courseId,{title:title.trim(),dueAt:new Date(`${due}T23:59:00`).toISOString(),weight:Number(weight)||0});setTitle("");setDue("");setWeight("10");setAdding(false)}
  return <div className="assignments-panel">
    <div className="workspace-toolbar"><div><span className="eyebrow">ASSESSMENTS</span><h3>{items.length} tracked</h3></div><button className="button primary" onClick={()=>setAdding(!adding)}><Icon name="plus" size={15}/> Add assessment</button></div>
    <div className="grade-summary"><div><span>Current grade</span><strong>{current===null?"—":`${current.toFixed(1)}%`}</strong><small>Across {gradedWeight}% of graded weight</small></div><div><span>Remaining weight</span><strong>{Math.max(0,100-items.reduce((s,i)=>s+i.weight,0)).toFixed(0)}%</strong><small>Based on assessments entered</small></div></div>
    {adding&&<div className="inline-form assignment-form"><label>Assessment<input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Assignment 1"/></label><label>Due<input type="date" value={due} onChange={(e)=>setDue(e.target.value)}/></label><label>Weight %<input type="number" min="0" max="100" value={weight} onChange={(e)=>setWeight(e.target.value)}/></label><button className="button primary" onClick={add}>Add</button></div>}
    {items.length?<div className="assignment-list">{items.map((item)=>{const days=Math.ceil((+new Date(item.dueAt)-Date.now())/86400000);return <article key={item.id}><div className="assignment-date"><strong>{new Date(item.dueAt).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</strong><small>{days>=0?`${days}d left`:"past"}</small></div><div className="assignment-main"><input value={item.title} onChange={(e)=>updateAssignment(item.id,{title:e.target.value})}/><div><span>{item.weight}% weight</span><select value={item.status} onChange={(e)=>updateAssignment(item.id,{status:e.target.value as typeof item.status})}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="submitted">Submitted</option><option value="graded">Graded</option></select></div></div><label className="score-input">Score<input type="number" min="0" max="100" value={item.score??""} onChange={(e)=>updateAssignment(item.id,{score:e.target.value===""?undefined:Number(e.target.value),status:e.target.value===""?item.status:"graded"})}/><span>%</span></label><button className="icon-button small danger-ghost" onClick={()=>deleteAssignment(item.id)}><Icon name="trash" size={14}/></button></article>})}</div>:<div className="empty-state"><Icon name="target" size={30}/><h3>Add your syllabus assessments.</h3><p>Weights, due dates and grades will roll up into your dashboard automatically.</p></div>}
  </div>
}
