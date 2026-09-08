"use client";

import { useEffect, useMemo, useState } from "react";
import { Course } from "@/lib/types";
import { formatTime } from "@/lib/schedule";
import { semesterById } from "@/lib/data";
import { CourseArtwork } from "./CourseArtwork";
import { NoteWorkspace } from "./NoteWorkspace";
import { FlashcardWorkspace } from "./FlashcardWorkspace";
import { AssignmentsPanel } from "./AssignmentsPanel";
import { ResourcesPanel } from "./ResourcesPanel";
import { ExportMenu } from "./ExportMenu";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

const tabs = ["overview","notes","cards","assignments","topics","resources","ai"] as const;
type Tab = typeof tabs[number];

export function CourseDetail({ course }: { course: Course }) {
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (queryTab && tabs.includes(queryTab)) setTab(queryTab);
  }, []);
  const { state, courseContext } = useStudy();
  const semester = semesterById[course.semesterId];
  const schedule = semester.schedule.filter((event) => event.courseId === course.id);
  const notes = state.notes.filter((n)=>n.courseId===course.id);
  const cards = state.flashcards.filter((c)=>c.courseId===course.id);
  const assignments = state.assignments.filter((a)=>a.courseId===course.id);
  const resources = state.resources.filter((r)=>r.courseId===course.id);
  const dueCards = cards.filter((card)=>new Date(card.dueAt)<=new Date()).length;
  const [copied,setCopied]=useState(false);

  const nextAssignment = useMemo(()=>assignments.filter((a)=>new Date(a.dueAt)>=new Date()).sort((a,b)=>+new Date(a.dueAt)-+new Date(b.dueAt))[0],[assignments]);

  async function copyContext(){await navigator.clipboard.writeText(courseContext(course.id));setCopied(true);setTimeout(()=>setCopied(false),1500)}

  return <div className="course-detail-page">
    <section className="course-hero">
      <CourseArtwork art={course.art}/>
      <div className="course-hero-overlay"/>
      <div className="course-hero-copy"><span className="eyebrow">{semester.title.toUpperCase()} · {course.section}</span><h1>{course.title}</h1><div className="course-hero-meta"><span>{course.code}</span>{course.labSection&&<span>{course.labSection}</span>}{course.instructor&&<span>{course.instructor}</span>}</div></div>
      <div className="course-hero-actions"><ExportMenu courseId={course.id}/>{course.registrationUrl&&<a className="button ghost-on-art" href={course.registrationUrl} target="_blank" rel="noreferrer">Lakehead plan <Icon name="arrow" size={14}/></a>}</div>
    </section>

    <nav className="course-tabs">{tabs.map((item)=><button key={item} className={tab===item?"active":""} onClick={()=>setTab(item)}>{item==="cards"?"Cue Cards":item.charAt(0).toUpperCase()+item.slice(1)}</button>)}</nav>

    {tab === "overview" && <div className="course-overview-grid">
      <section className="panel course-progress-panel"><div className="panel-heading"><div><span className="eyebrow">COURSE OS</span><h2>Progress snapshot</h2></div></div><div className="stat-quad"><div><strong>{notes.length}</strong><span>Notes</span></div><div><strong>{cards.length}</strong><span>Cards</span></div><div><strong>{dueCards}</strong><span>Due now</span></div><div><strong>{assignments.length}</strong><span>Assessments</span></div></div>{nextAssignment?<div className="next-assignment"><span>Next deadline</span><strong>{nextAssignment.title}</strong><small>{new Date(nextAssignment.dueAt).toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"})} · {nextAssignment.weight}%</small></div>:<div className="empty-inline">Add your syllabus assessments to activate deadline tracking.</div>}</section>

      <section className="panel class-times"><div className="panel-heading"><div><span className="eyebrow">MEETINGS</span><h2>Class times</h2></div></div>{schedule.length? <div className="meeting-list">{schedule.map((event)=><div key={event.id}><div className="meeting-day">{event.day.slice(0,3)}</div><div><strong>{event.type==="lab"?"Lab":"Lecture"}</strong><span>{formatTime(event.start)} → {formatTime(event.end)}</span><small>{event.room||"Room TBA"}{event.instructor?` · ${event.instructor}`:""}</small></div></div>)}</div>:<div className="empty-inline">Flexible / online course — no fixed meeting was supplied.</div>}</section>

      <section className="panel roadmap-panel"><div className="panel-heading"><div><span className="eyebrow">SUGGESTED ROADMAP</span><h2>Concept path</h2></div></div><div className="roadmap-list">{course.roadmap.map((topic,index)=><div key={topic}><span>{String(index+1).padStart(2,"0")}</span><strong>{topic}</strong><i/></div>)}</div><p className="data-note">These are starter organizational topics, not a claim about your professor’s exact syllabus. Replace them as the course unfolds.</p></section>

      <section className="panel advanced-panel"><div className="panel-heading"><div><span className="eyebrow">BEYOND CLASS</span><h2>Advanced topics</h2></div></div><div className="topic-chips">{course.advancedTopics.map((topic)=><span key={topic}>{topic}</span>)}</div><div className="advanced-path">Course concept <Icon name="arrow" size={14}/> advanced topic <Icon name="arrow" size={14}/> side project <Icon name="arrow" size={14}/> portfolio</div></section>
    </div>}

    {tab === "notes" && <NoteWorkspace courseId={course.id}/>} 
    {tab === "cards" && <FlashcardWorkspace courseId={course.id}/>} 
    {tab === "assignments" && <AssignmentsPanel courseId={course.id}/>} 
    {tab === "resources" && <ResourcesPanel courseId={course.id}/>} 
    {tab === "topics" && <div className="topics-page"><section className="panel"><span className="eyebrow">KNOWLEDGE MAP</span><h2>Course topic graph</h2><p>Start with the roadmap, then turn concepts into your real syllabus structure. The graph is intentionally data-driven so notes, cards and mistakes can attach to the same topic later.</p><div className="knowledge-flow">{course.roadmap.map((topic,index)=><div key={topic}><span>{index+1}</span><strong>{topic}</strong>{index<course.roadmap.length-1&&<Icon name="arrow"/>}</div>)}</div></section><section className="panel"><span className="eyebrow">ADVANCED / CAREER</span><h2>Beyond the curriculum</h2><div className="advanced-topic-grid">{course.advancedTopics.map((topic,index)=><article key={topic}><span>{String(index+1).padStart(2,"0")}</span><h3>{topic}</h3><p>Tag as ADVANCED, PROJECT IDEA or CAREER RELEVANT as you connect class material to engineering work.</p></article>)}</div></section></div>}
    {tab === "ai" && <div className="ai-course-panel panel"><div className="panel-heading"><div><span className="eyebrow">AI CONTEXT</span><h2>Agent-ready course context</h2></div><button className="button primary" onClick={copyContext}>{copied?"Copied":"Copy for AI"}</button></div><p>The context is generated from your actual notes, cards, assignments and resources — not random chat history.</p><textarea readOnly value={courseContext(course.id)}/></div>}
  </div>
}
