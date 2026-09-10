"use client";

import type { RichContent, RichTextBlock } from "@/lib/types";
import { DrawingPreview } from "./DrawingWorkspace";
import { useStudy } from "./StudyProvider";

function uid(){return typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():`${Date.now()}-${Math.random()}`}

export function legacyToRich(text: string): RichContent {
  return text ? [{ id: uid(), type: "paragraph", text }] : [];
}

export function richToPlain(content?: RichContent) {
  if (!content?.length) return "";
  return content.map((block)=>block.type==="drawing"?`[Drawing: ${block.caption||"workspace"}]`:block.text).join("\n\n");
}

export function RichContentRenderer({ content, fallback, onOpenDrawing }: { content?: RichContent; fallback?: string; onOpenDrawing?: (id:string)=>void }) {
  const { state } = useStudy();
  if (!content?.length) return <div className="legacy-rich-text">{fallback || ""}</div>;
  return <div className="rich-content-renderer">{content.map((block)=>{
    if(block.type==="drawing"){
      const drawing=state.drawings.find((item)=>item.id===block.drawingId);
      if(!drawing)return <div key={block.id} className="rich-missing">Drawing unavailable</div>;
      return <button key={block.id} className="rich-drawing-block" onClick={()=>onOpenDrawing?.(drawing.id)}><DrawingPreview drawing={drawing}/><span>{block.caption||drawing.title} · OPEN EDITABLE WORKSPACE →</span></button>
    }
    if(block.type==="heading")return <h3 key={block.id}>{block.text}</h3>;
    if(block.type==="code")return <pre key={block.id}><code>{block.text}</code></pre>;
    if(block.type==="equation")return <div key={block.id} className="rich-equation">{block.text}</div>;
    if(block.type==="callout")return <aside key={block.id}>{block.text}</aside>;
    return <p key={block.id}>{block.text}</p>;
  })}</div>;
}

export function RichContentEditor({ content, onChange, onAddDrawing }: { content: RichContent; onChange:(content:RichContent)=>void; onAddDrawing?:()=>void }) {
  function add(type: Exclude<RichTextBlock["type"],"drawing">){onChange([...content,{id:uid(),type,text:""} as RichTextBlock])}
  function update(id:string,text:string){onChange(content.map((b)=>b.id===id&&b.type!=="drawing"?{...b,text}:b))}
  return <div className="rich-editor">
    <div className="rich-blocks">{content.map((block,index)=>block.type==="drawing"?<div key={block.id} className="rich-editor-drawing"><span>DRAWING // {block.caption||"WORKSPACE"}</span><button onClick={()=>onChange(content.filter((b)=>b.id!==block.id))}>REMOVE</button></div>:<div key={block.id} className={`rich-edit-block type-${block.type}`}><span>{block.type.toUpperCase()} {String(index+1).padStart(2,"0")}</span><textarea rows={block.type==="code"||block.type==="equation"?4:2} value={block.text} onChange={(e)=>update(block.id,e.target.value)} placeholder={block.type==="equation"?"e.g. T(n) = O(n log n)":block.type==="code"?"Paste code…":"Write content…"}/><button onClick={()=>onChange(content.filter((b)=>b.id!==block.id))}>×</button></div>)}</div>
    <div className="rich-addbar"><button onClick={()=>add("paragraph")}>+ TEXT</button><button onClick={()=>add("heading")}>+ HEADING</button><button onClick={()=>add("code")}>+ CODE</button><button onClick={()=>add("equation")}>+ EQUATION</button><button onClick={()=>add("callout")}>+ CALLOUT</button>{onAddDrawing&&<button onClick={onAddDrawing}>+ DRAWING</button>}</div>
  </div>;
}
