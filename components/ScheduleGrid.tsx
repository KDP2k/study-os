"use client";

import Link from "next/link";
import { useState } from "react";
import { courseById } from "@/lib/data";
import { dayName, eventsForDay, formatTime, minutesFromTime, weekdays } from "@/lib/schedule";
import { Icon } from "./Icons";
import { SemesterSwitcher } from "./SemesterSwitcher";
import { useStudy } from "./StudyProvider";

const START = 8 * 60;
const END = 21 * 60;
const HEIGHT = 780;

export function SchedulePage() {
  const { semester } = useStudy();
  const [mode, setMode] = useState<"week"|"today">("week");
  const today = dayName(new Date());
  const todayEvents = eventsForDay(semester, today);
  return (
    <div>
      <div className="page-heading"><div><span className="eyebrow">STRUCTURED CALENDAR</span><h1>Schedule</h1><p>Your timetable is actual data, so the dashboard can understand what class is happening next.</p></div><div className="segmented"><button className={mode==="week"?"active":""} onClick={()=>setMode("week")}>Week</button><button className={mode==="today"?"active":""} onClick={()=>setMode("today")}>Today</button></div></div>
      <SemesterSwitcher/>
      {mode === "week" ? <>
        <div className="schedule-desktop panel">
          <div className="schedule-grid-header"><div/><>{weekdays.map((day)=><div key={day} className={day===today?"today":""}>{day.slice(0,3)}<small>{day===today?"TODAY":""}</small></div>)}</></div>
          <div className="schedule-body" style={{height:HEIGHT}}>
            <div className="time-axis">{Array.from({length:14},(_,i)=>8+i).map((hour)=><span key={hour} style={{top:`${((hour*60-START)/(END-START))*HEIGHT}px`}}>{formatTime(`${String(hour).padStart(2,"0")}:00`).replace(":00","")}</span>)}</div>
            <div className="schedule-columns">{weekdays.map((day)=><div key={day} className={`schedule-column ${day===today?"today":""}`}>{Array.from({length:27},(_,i)=><i key={i} style={{top:`${(i/26)*100}%`}}/>)}{eventsForDay(semester,day).map((event)=>{const top=((minutesFromTime(event.start)-START)/(END-START))*HEIGHT; const height=((minutesFromTime(event.end)-minutesFromTime(event.start))/(END-START))*HEIGHT; const course=courseById[event.courseId]; return <Link href={`/app/courses/${event.courseId}`} key={event.id} className={`schedule-event ${event.type}`} style={{top,height}}><small>{event.section}</small><strong>{course?.shortName}</strong><span>{formatTime(event.start)} · {event.room||"Room TBA"}</span></Link>})}</div>)}</div>
          </div>
        </div>
        <div className="schedule-mobile">{weekdays.map((day)=>{const items=eventsForDay(semester,day); if(!items.length)return null; return <section key={day} className="mobile-day"><div><span className="eyebrow">{day===today?"TODAY":"DAY"}</span><h2>{day}</h2></div>{items.map((event)=><Link key={event.id} href={`/app/courses/${event.courseId}`}><time>{formatTime(event.start)}</time><span><strong>{event.title}</strong><small>{event.type.toUpperCase()} · {event.room||"Room TBA"} · until {formatTime(event.end)}</small></span><Icon name="chevron" size={16}/></Link>)}</section>})}</div>
      </> : <div className="today-view panel"><div className="today-view-head"><span className="eyebrow">{today.toUpperCase()}</span><h2>{new Date().toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"})}</h2></div>{todayEvents.length ? todayEvents.map((event)=><Link key={event.id} href={`/app/courses/${event.courseId}`} className="today-event"><time>{formatTime(event.start)}<small>{formatTime(event.end)}</small></time><span className="big-dot"/><div><small>{event.section}</small><strong>{event.title}</strong><span>{event.type} · {event.room||"Room TBA"}</span></div><Icon name="arrow"/></Link>) : <div className="empty-state"><Icon name="calendar" size={28}/><h3>No scheduled classes today.</h3><p>Use the open block for spaced review or advanced topics.</p></div>}</div>}
      {semester.id === "fall-2026" && <p className="data-note">SOCI 2755 is included as a course workspace but does not appear on the supplied weekly timetable, so no fixed meeting was invented.</p>}
    </div>
  );
}
