"use client";
import Link from "next/link";
import { allCourses } from "@/lib/data";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

export function LibraryDashboard(){
  const {state}=useStudy();
  const recent=[...state.notes].sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt)).slice(0,8);
  return <div><div className="page-heading"><div><span className="eyebrow">KNOWLEDGE LIBRARY</span><h1>Library</h1><p>Notes, resources and course material stay attached to the class they came from and remain exportable.</p></div></div>
  <div className="library-summary"><article><Icon name="file"/><strong>{state.notes.length}</strong><span>notes</span></article><article><Icon name="cards"/><strong>{state.flashcards.length}</strong><span>cue cards</span></article><article><Icon name="book"/><strong>{state.resources.length}</strong><span>resources</span></article><article><Icon name="target"/><strong>{state.assignments.length}</strong><span>assessments</span></article></div>
  <section className="panel"><div className="panel-heading"><div><span className="eyebrow">RECENT NOTES</span><h2>Continue learning</h2></div></div>{recent.length?<div className="library-note-list">{recent.map(note=>{const course=allCourses.find(c=>c.id===note.courseId);return <Link key={note.id} href={`/app/courses/${note.courseId}?tab=notes`}><div><span>{course?.code}</span><strong>{note.title}</strong><small>{new Date(note.updatedAt).toLocaleString("en-CA",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</small></div><Icon name="arrow"/></Link>})}</div>:<div className="empty-state"><Icon name="book" size={30}/><h3>Your degree knowledge base starts with one note.</h3><p>Open any course and create a lecture note. It will appear here automatically.</p></div>}</section>
  <section className="section-block"><div className="section-heading"><div><span className="eyebrow">BY COURSE</span><h2>Course library</h2></div></div><div className="course-library-grid">{allCourses.map(course=>{const notes=state.notes.filter(n=>n.courseId===course.id).length;const resources=state.resources.filter(r=>r.courseId===course.id).length;return <Link href={`/app/courses/${course.id}?tab=resources`} key={course.id}><span>{course.code}</span><strong>{course.title}</strong><small>{notes} notes · {resources} resources</small><Icon name="arrow" size={15}/></Link>})}</div></section>
  </div>
}
