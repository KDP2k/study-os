"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { courseById } from "@/lib/data";
import { dayName, eventsForDay, formatTime, getCurrentOrNextEvent, semesterWeek } from "@/lib/schedule";
import { isDue } from "@/lib/study";
import { CourseCard } from "./CourseCard";
import { Icon } from "./Icons";
import { SemesterSwitcher } from "./SemesterSwitcher";
import { useStudy } from "./StudyProvider";

export function Dashboard() {
  const { semester, state } = useStudy();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const today = now ? dayName(now) : "Tuesday";
  const todayEvents = now ? eventsForDay(semester, today) : [];
  const next = now ? getCurrentOrNextEvent(semester, now) : null;
  const week = now ? semesterWeek(semester, now) : null;
  const dueCards = state.flashcards.filter((card) => semester.courses.some((course) => course.id === card.courseId) && isDue(card, now || new Date(0)));
  const upcomingAssignments = state.assignments
    .filter((item) => semester.courses.some((course) => course.id === item.courseId) && new Date(item.dueAt).getTime() >= (now?.getTime() || 0))
    .sort((a,b) => +new Date(a.dueAt) - +new Date(b.dueAt)).slice(0,3);
  const dateLabel = now ? now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" }) : "Loading today…";

  const reviewByCourse = useMemo(() => semester.courses.map((course) => ({ course, count: dueCards.filter((card) => card.courseId === course.id).length })).filter((item) => item.count > 0), [semester, dueCards]);

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div className="hero-topline"><span>{semester.label}</span><span>SOFTWARE ENGINEERING · {week ? `WEEK ${String(week).padStart(2,"0")}` : "TERM READY"}</span></div>
        <div className="hero-grid">
          <div>
            <p className="eyebrow">KRIS // ENGINEERING</p>
            <h1>{now && now.getHours() < 12 ? "Good morning." : now && now.getHours() < 18 ? "Good afternoon." : "Good evening."}</h1>
            <p className="hero-date">{dateLabel} · Thunder Bay</p>
          </div>
          <div className="next-class-card">
            <span className="eyebrow">{next?.status === "ongoing" ? "IN CLASS NOW" : "NEXT CLASS"}</span>
            {next ? <>
              <h2>{next.event.title}</h2>
              <div className="next-details"><span><Icon name="clock" size={15}/>{formatTime(next.event.start)} → {formatTime(next.event.end)}</span>{next.event.room && <span>{next.event.room}</span>}</div>
              <Link href={`/app/courses/${next.event.courseId}?tab=notes`}>{next.status === "ongoing" ? "Open class notes" : next.daysAway === 0 ? "Prepare for class" : `In ${next.daysAway} day${next.daysAway === 1 ? "" : "s"}`} <Icon name="arrow" size={15}/></Link>
            </> : <><h2>No scheduled class ahead.</h2><p>Use the open time for review or advanced topics.</p></>}
          </div>
        </div>
        <div className="hero-orbit hero-orbit-a"/><div className="hero-orbit hero-orbit-b"/>
      </section>

      <SemesterSwitcher/>

      <section className="dashboard-stat-grid">
        <article className="panel today-panel">
          <div className="panel-heading"><div><span className="eyebrow">TODAY</span><h2>{today}</h2></div><Link href="/app/schedule">Full schedule <Icon name="arrow" size={14}/></Link></div>
          {todayEvents.length ? <div className="timeline-mini">{todayEvents.map((event) => <Link key={event.id} href={`/app/courses/${event.courseId}`}><time>{formatTime(event.start)}</time><span className="timeline-dot"/><div><strong>{courseById[event.courseId]?.shortName || event.title}</strong><small>{event.type === "lab" ? "Lab" : event.room || "Lecture"} · {formatTime(event.end)}</small></div></Link>)}</div> : <div className="empty-state compact"><Icon name="calendar"/><p>No scheduled classes today.</p></div>}
        </article>

        <article className="panel review-panel">
          <div className="panel-heading"><div><span className="eyebrow">STUDY QUEUE</span><h2>{dueCards.length} cards due</h2></div><Link href="/app/study">Study <Icon name="arrow" size={14}/></Link></div>
          {reviewByCourse.length ? <div className="review-list">{reviewByCourse.map(({course,count}) => <div key={course.id}><span>{course.shortName}</span><strong>{count}</strong><div className="meter"><i style={{width:`${Math.min(100,25+count*7)}%`}}/></div></div>)}</div> : <div className="empty-state compact"><Icon name="cards"/><p>Add cue cards from your course pages and they’ll appear here when due.</p></div>}
        </article>

        <article className="panel deadline-panel">
          <div className="panel-heading"><div><span className="eyebrow">UPCOMING</span><h2>Deadlines</h2></div><Link href="/app/library">Library <Icon name="arrow" size={14}/></Link></div>
          {upcomingAssignments.length ? <div className="deadline-list">{upcomingAssignments.map((item) => <div key={item.id}><time>{new Date(item.dueAt).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</time><span><strong>{item.title}</strong><small>{courseById[item.courseId]?.code} · {item.weight}%</small></span></div>)}</div> : <div className="empty-state compact"><Icon name="target"/><p>Add your assessments once syllabi arrive. The dashboard will prioritize what’s next.</p></div>}
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">ACTIVE SEMESTER</span><h2>{semester.title} courses</h2></div><p>Labs live inside their parent course but remain separate on the timetable.</p></div>
        <div className="course-grid">{semester.courses.map((course) => <CourseCard key={course.id} course={course}/>)}</div>
      </section>

      <section className="study-cta">
        <div><span className="eyebrow">LEARNING ENGINE</span><h2>Turn class notes into recall, cards, mistakes, and exam prep.</h2><p>The prototype already stores notes, cue cards, assignments, resources and exportable AI context locally in your browser.</p></div>
        <div className="cta-actions"><Link href="/app/study" className="button primary">Start studying <Icon name="arrow" size={16}/></Link><Link href="/app/ai" className="button secondary">Open AI Lab</Link></div>
      </section>
    </div>
  );
}
