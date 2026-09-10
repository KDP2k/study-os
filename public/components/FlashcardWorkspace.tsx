"use client";

import { useMemo, useState } from "react";
import { isDue } from "@/lib/study";
import { Flashcard, RichContent } from "@/lib/types";
import { Icon } from "./Icons";
import { DrawingWorkspace } from "./DrawingWorkspace";
import { legacyToRich, richToPlain, RichContentEditor, RichContentRenderer } from "./RichContent";
import { useStudy } from "./StudyProvider";

export function FlashcardWorkspace({ courseId, embedded = false }: { courseId: string; embedded?: boolean }) {
  const { state, addFlashcard, updateFlashcard, deleteFlashcard, rateFlashcard, addDrawing } = useStudy();
  const cards = useMemo(()=>state.flashcards.filter((card)=>card.courseId===courseId),[state.flashcards,courseId]);
  const due = cards.filter((card)=>isDue(card));
  const [mode,setMode]=useState<"deck"|"review">("deck");
  const [current,setCurrent]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [newCard,setNewCard]=useState(false);
  const [front,setFront]=useState<RichContent>([{id:"front-1",type:"paragraph",text:""}]);
  const [back,setBack]=useState<RichContent>([{id:"back-1",type:"paragraph",text:""}]);
  const [openDrawing,setOpenDrawing]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [editFront,setEditFront]=useState<RichContent>([]);
  const [editBack,setEditBack]=useState<RichContent>([]);

  const reviewCards = due;
  const active: Flashcard | undefined = reviewCards[current];

  function addDrawingBlock(side:"front"|"back") {
    const drawingId=addDrawing({courseId,title:"Cue card diagram"});
    const block={id:`draw-${Date.now()}`,type:"drawing" as const,drawingId,caption:"Cue card diagram"};
    side==="front"?setFront((c)=>[...c,block]):setBack((c)=>[...c,block]);
    setOpenDrawing(drawingId);
  }
  function createCard(){
    const prompt=richToPlain(front).trim(); const answer=richToPlain(back).trim();
    if(!prompt||!answer)return;
    addFlashcard(courseId,{prompt,answer,promptContent:front,answerContent:back});
    setFront([{id:`front-${Date.now()}`,type:"paragraph",text:""}]); setBack([{id:`back-${Date.now()}`,type:"paragraph",text:""}]); setNewCard(false);
  }
  function rate(rating:"again"|"hard"|"good"|"easy"){ if(!active)return; rateFlashcard(active.id,rating); setRevealed(false); if(current>=reviewCards.length-1)setCurrent(0); }
  function startEdit(card:Flashcard){setEditing(card.id);setEditFront(card.promptContent||legacyToRich(card.prompt));setEditBack(card.answerContent||legacyToRich(card.answer));}
  function saveEdit(){if(!editing)return;updateFlashcard(editing,{promptContent:editFront,answerContent:editBack,prompt:richToPlain(editFront),answer:richToPlain(editBack)});setEditing(null)}

  if(mode==="review") return <div className={`flashcard-review ${embedded?"embedded":""}`}>
    <div className="review-top"><button className="text-button" onClick={()=>{setMode("deck");setRevealed(false)}}>← Back to deck</button><span>{Math.min(current+1,reviewCards.length)} / {reviewCards.length} due</span></div>
    {active ? <>
      <div className={`review-card ${revealed?"revealed":""}`}>
        <div className="card-tech-row"><span>CARD_{String(current+1).padStart(3,"0")}</span><span>{courseId.toUpperCase()}</span></div>
        <span className="eyebrow">QUESTION</span><RichContentRenderer content={active.promptContent} fallback={active.prompt} onOpenDrawing={setOpenDrawing}/>
        {!revealed?<button className="button primary reveal-btn" onClick={()=>setRevealed(true)}>SHOW ANSWER</button>:<div className="review-answer"><span className="eyebrow">ANSWER</span><RichContentRenderer content={active.answerContent} fallback={active.answer} onOpenDrawing={setOpenDrawing}/></div>}
      </div>
      {revealed&&<div className="rating-row"><button onClick={()=>rate("again")}><strong>Again</strong><small>10 min</small></button><button onClick={()=>rate("hard")}><strong>Hard</strong><small>~1–2 d</small></button><button onClick={()=>rate("good")}><strong>Good</strong><small>adaptive</small></button><button onClick={()=>rate("easy")}><strong>Easy</strong><small>longer</small></button></div>}
    </> : <div className="empty-state"><Icon name="check" size={30}/><h3>Review queue clear.</h3><p>No cards are due right now.</p><button className="button secondary" onClick={()=>setMode("deck")}>Back to deck</button></div>}
    {openDrawing&&<DrawingWorkspace drawingId={openDrawing} onClose={()=>setOpenDrawing(null)}/>}  
  </div>;

  return <div className="flashcard-workspace">
    {editing&&<div className="rich-card-form edit-existing"><div className="rich-side"><span className="sys-label">EDIT FRONT</span><RichContentEditor content={editFront} onChange={setEditFront} onAddDrawing={()=>{const id=addDrawing({courseId,title:"Cue card diagram"});setEditFront((c)=>[...c,{id:`draw-${Date.now()}`,type:"drawing",drawingId:id,caption:"Cue card diagram"}]);setOpenDrawing(id)}}/></div><div className="rich-side"><span className="sys-label">EDIT BACK</span><RichContentEditor content={editBack} onChange={setEditBack} onAddDrawing={()=>{const id=addDrawing({courseId,title:"Cue card diagram"});setEditBack((c)=>[...c,{id:`draw-${Date.now()}`,type:"drawing",drawingId:id,caption:"Cue card diagram"}]);setOpenDrawing(id)}}/></div><div className="modal-actions"><button className="button secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="button signal" onClick={saveEdit}>SAVE CHANGES</button></div></div>}
    <div className="workspace-toolbar"><div><span className="eyebrow">SPACED REVIEW</span><h3>{cards.length} cue cards · {due.length} due</h3></div><div><button className="button secondary" onClick={()=>setNewCard(!newCard)}><Icon name="plus" size={15}/> New card</button><button className="button primary" disabled={!due.length} onClick={()=>{setMode("review");setCurrent(0)}}>Study due ({due.length})</button></div></div>
    {newCard&&<div className="rich-card-form"><div className="rich-side"><span className="sys-label">FRONT // QUESTION</span><RichContentEditor content={front} onChange={setFront} onAddDrawing={()=>addDrawingBlock("front")}/></div><div className="rich-side"><span className="sys-label">BACK // ANSWER</span><RichContentEditor content={back} onChange={setBack} onAddDrawing={()=>addDrawingBlock("back")}/></div><div className="modal-actions"><button className="button secondary" onClick={()=>setNewCard(false)}>Cancel</button><button className="button primary" onClick={createCard}>Create cue card</button></div></div>}
    {cards.length?<div className="deck-list">{cards.map((card)=><article key={card.id}><div className="deck-card-main"><span className={`card-state ${isDue(card)?"due":""}`}>{isDue(card)?"DUE":`${card.intervalDays}d`}</span><div className="deck-rich"><RichContentRenderer content={card.promptContent} fallback={card.prompt} onOpenDrawing={setOpenDrawing}/><details><summary>ANSWER</summary><RichContentRenderer content={card.answerContent} fallback={card.answer} onOpenDrawing={setOpenDrawing}/></details><small>{card.reviews} reviews · {card.lapses} lapses · {card.type}</small></div></div><div className="deck-actions"><button className="button micro" onClick={()=>startEdit(card)}>EDIT</button><button className="icon-button small danger-ghost" onClick={()=>deleteFlashcard(card.id)}><Icon name="trash" size={14}/></button></div></article>)}</div>:<div className="empty-state"><Icon name="cards" size={30}/><h3>Build your recall deck.</h3><p>Create rich cards with structured text, code, equations and editable drawings.</p><button className="button primary" onClick={()=>setNewCard(true)}>Create first card</button></div>}
    {openDrawing&&<DrawingWorkspace drawingId={openDrawing} onClose={()=>setOpenDrawing(null)}/>}  
  </div>;
}
