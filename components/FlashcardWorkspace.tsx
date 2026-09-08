"use client";

import { useMemo, useState } from "react";
import { isDue } from "@/lib/study";
import { Flashcard } from "@/lib/types";
import { Icon } from "./Icons";
import { useStudy } from "./StudyProvider";

export function FlashcardWorkspace({ courseId, embedded = false }: { courseId: string; embedded?: boolean }) {
  const { state, addFlashcard, updateFlashcard, deleteFlashcard, rateFlashcard } = useStudy();
  const cards = useMemo(()=>state.flashcards.filter((card)=>card.courseId===courseId),[state.flashcards,courseId]);
  const due = cards.filter((card)=>isDue(card));
  const [mode,setMode]=useState<"deck"|"review">("deck");
  const [current,setCurrent]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [newCard,setNewCard]=useState(false);
  const [prompt,setPrompt]=useState("");
  const [answer,setAnswer]=useState("");

  const reviewCards = due;
  const active: Flashcard | undefined = reviewCards[current];

  function createCard(){ if(!prompt.trim()||!answer.trim())return; addFlashcard(courseId,{prompt:prompt.trim(),answer:answer.trim()}); setPrompt("");setAnswer("");setNewCard(false); }
  function rate(rating:"again"|"hard"|"good"|"easy"){ if(!active)return; rateFlashcard(active.id,rating); setRevealed(false); if(current>=reviewCards.length-1)setCurrent(0); }

  if(mode==="review") return <div className={`flashcard-review ${embedded?"embedded":""}`}>
    <div className="review-top"><button className="text-button" onClick={()=>{setMode("deck");setRevealed(false)}}>← Back to deck</button><span>{Math.min(current+1,reviewCards.length)} / {reviewCards.length} due</span></div>
    {active ? <>
      <button className={`review-card ${revealed?"revealed":""}`} onClick={()=>setRevealed(true)}>
        <span className="eyebrow">ACTIVE RECALL</span><h2>{active.prompt}</h2>{revealed?<div className="review-answer"><small>ANSWER</small><p>{active.answer}</p></div>:<p className="tap-hint">Commit to an answer, then reveal.</p>}
      </button>
      {revealed&&<div className="rating-row"><button onClick={()=>rate("again")}><strong>Again</strong><small>10 min</small></button><button onClick={()=>rate("hard")}><strong>Hard</strong><small>~1–2 d</small></button><button onClick={()=>rate("good")}><strong>Good</strong><small>adaptive</small></button><button onClick={()=>rate("easy")}><strong>Easy</strong><small>longer</small></button></div>}
    </> : <div className="empty-state"><Icon name="check" size={30}/><h3>Review queue clear.</h3><p>No cards are due right now.</p><button className="button secondary" onClick={()=>setMode("deck")}>Back to deck</button></div>}
  </div>;

  return <div className="flashcard-workspace">
    <div className="workspace-toolbar"><div><span className="eyebrow">SPACED REVIEW</span><h3>{cards.length} cue cards · {due.length} due</h3></div><div><button className="button secondary" onClick={()=>setNewCard(!newCard)}><Icon name="plus" size={15}/> New card</button><button className="button primary" disabled={!due.length} onClick={()=>{setMode("review");setCurrent(0)}}>Study due ({due.length})</button></div></div>
    {newCard&&<div className="inline-form card-form"><label>Question<textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="What is the difference between…?"/></label><label>Answer<textarea value={answer} onChange={(e)=>setAnswer(e.target.value)} placeholder="One precise idea."/></label><div><button className="button secondary" onClick={()=>setNewCard(false)}>Cancel</button><button className="button primary" onClick={createCard}>Create cue card</button></div></div>}
    {cards.length?<div className="deck-list">{cards.map((card)=><article key={card.id}><div className="deck-card-main"><span className={`card-state ${isDue(card)?"due":""}`}>{isDue(card)?"DUE":`${card.intervalDays}d`}</span><div><textarea value={card.prompt} onChange={(e)=>updateFlashcard(card.id,{prompt:e.target.value})}/><textarea className="answer" value={card.answer} onChange={(e)=>updateFlashcard(card.id,{answer:e.target.value})}/><small>{card.reviews} reviews · {card.lapses} lapses · {card.type}</small></div></div><button className="icon-button small danger-ghost" onClick={()=>deleteFlashcard(card.id)}><Icon name="trash" size={14}/></button></article>)}</div>:<div className="empty-state"><Icon name="cards" size={30}/><h3>Build your recall deck.</h3><p>Create cards manually or directly from lecture notes with <kbd>/flashcard</kbd>.</p><button className="button primary" onClick={()=>setNewCard(true)}>Create first card</button></div>}
    <p className="data-note">This prototype uses an adaptive interval scheduler and stores FSRS-ready review data. A production backend can swap the scheduler without changing the card model.</p>
  </div>;
}
