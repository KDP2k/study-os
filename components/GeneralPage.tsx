"use client";

import { useMemo, useState } from "react";
import { useStudy } from "./StudyProvider";
import type { PersonalEventCategory } from "@/lib/types";

const categories: PersonalEventCategory[]=["Personal","School","Study","Work","Appointment","Deadline","Other"];
function localInputValue(date: Date){const off=date.getTimezoneOffset();return new Date(date.getTime()-off*60000).toISOString().slice(0,16)}

export function GeneralPage(){
  const {state,addPersonalEvent,deletePersonalEvent}=useStudy();
  const [open,setOpen]=useState(false);
  const [title,setTitle]=useState("");
  const [category,setCategory]=useState<PersonalEventCategory>("Personal");
  const [start,setStart]=useState(localInputValue(new Date()));
  const [end,setEnd]=useState(localInputValue(new Date(Date.now()+3600000)));
  const [location,setLocation]=useState("");
  const [notes,setNotes]=useState("");
  const [allDay,setAllDay]=useState(false);
  const events=useMemo(()=>[...state.personalEvents].sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt)),[state.personalEvents]);
  const today=new Date(); const todayKey=today.toDateString();
  const todayEvents=events.filter((e)=>new Date(e.startsAt).toDateString()===todayKey);
  const upcoming=events.filter((e)=>+new Date(e.startsAt)>=Date.now()&&new Date(e.startsAt).toDateString()!==todayKey).slice(0,12);
  function save(){if(!title.trim())return;addPersonalEvent({title:title.trim(),category,startsAt:new Date(start).toISOString(),endsAt:end?new Date(end).toISOString():undefined,location,notes,allDay});setTitle("");setLocation("");setNotes("");setOpen(false)}
  return <div className="general-page">
    <div className="page-heading general-heading"><div><span className="eyebrow">LIFE_RUNTIME</span><h1>General</h1><p>Personal calendar, day-to-day deadlines, study blocks, appointments and everything that does not belong to one course.</p></div><button className="button signal" onClick={()=>setOpen(true)}>+ ADD EVENT</button></div>
    <section className="general-grid">
      <article className="panel general-today"><div className="panel-heading"><div><span className="eyebrow">TODAY</span><h2>{today.toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}</h2></div><span className="sys-label">{todayEvents.length} EVENTS</span></div>
        <div className="general-event-list">{todayEvents.length?todayEvents.map((event)=><div key={event.id} className="general-event"><time>{event.allDay?"ALL DAY":new Date(event.startsAt).toLocaleTimeString("en-CA",{hour:"numeric",minute:"2-digit"})}</time><span className={`event-cat cat-${event.category.toLowerCase()}`}>{event.category}</span><div><strong>{event.title}</strong><small>{event.location||event.notes||"No location"}</small></div><button onClick={()=>deletePersonalEvent(event.id)}>×</button></div>):<div className="empty-state compact"><p>No personal events today. Keep the space open or add one.</p></div>}</div>
      </article>
      <article className="panel general-upcoming"><div className="panel-heading"><div><span className="eyebrow">UPCOMING</span><h2>Next on your radar</h2></div></div>
        <div className="general-event-list">{upcoming.length?upcoming.map((event)=><div key={event.id} className="general-event"><time>{new Date(event.startsAt).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</time><span className={`event-cat cat-${event.category.toLowerCase()}`}>{event.category}</span><div><strong>{event.title}</strong><small>{event.location||new Date(event.startsAt).toLocaleTimeString("en-CA",{hour:"numeric",minute:"2-digit"})}</small></div><button onClick={()=>deletePersonalEvent(event.id)}>×</button></div>):<div className="empty-state compact"><p>Nothing upcoming yet.</p></div>}</div>
      </article>
    </section>
    {open&&<div className="modal-backdrop" onMouseDown={()=>setOpen(false)}><div className="event-modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-title"><div><span className="eyebrow">GENERAL_EVENT</span><h3>Add to your day</h3></div><button className="icon-button small" onClick={()=>setOpen(false)}>×</button></div><label>Title<input autoFocus value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Dentist, gym, study block…"/></label><div className="event-form-row"><label>Starts<input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)}/></label><label>Ends<input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)}/></label></div><div className="event-form-row"><label>Category<select value={category} onChange={(e)=>setCategory(e.target.value as PersonalEventCategory)}>{categories.map((c)=><option key={c}>{c}</option>)}</select></label><label>Location<input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Optional"/></label></div><label>Notes<textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Anything useful…"/></label><label className="check-row"><input type="checkbox" checked={allDay} onChange={(e)=>setAllDay(e.target.checked)}/> All-day event</label><div className="modal-actions"><button className="button secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="button signal" onClick={save}>ADD EVENT</button></div></div></div>}
  </div>
}
