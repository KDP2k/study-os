"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DrawingBackground, DrawingDocument, DrawingElement, DrawingPoint, DrawingStroke, DrawingTool } from "@/lib/types";
import { useStudy } from "./StudyProvider";

const PEN_COLORS = ["#F3F3EF", "#EFFF1A", "#75F2C2", "#55A7FF", "#FF7B63"];

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function simplify(points: DrawingPoint[]) {
  if (points.length < 3) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const p = points[i];
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    if ((dx * dx + dy * dy) >= 3.5) result.push(p);
  }
  result.push(points[points.length - 1]);
  return result;
}

function drawPage(ctx: CanvasRenderingContext2D, width: number, height: number, background: DrawingBackground, elements: DrawingElement[]) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0A1014";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = "rgba(159,188,198,.12)";
  ctx.lineWidth = 1;
  if (background === "dot") {
    ctx.fillStyle = "rgba(159,188,198,.22)";
    for (let x = 24; x < width; x += 24) for (let y = 24; y < height; y += 24) ctx.fillRect(x, y, 1.3, 1.3);
  } else if (background === "graph") {
    for (let x = 0; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
    for (let y = 0; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
  } else if (background === "lined") {
    for (let y = 36; y < height; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
  }
  ctx.restore();

  for (const element of elements) {
    if (element.type === "text") {
      ctx.fillStyle = element.color;
      ctx.font = `${element.size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      ctx.fillText(element.text, element.x, element.y);
      continue;
    }
    const points = element.points;
    if (!points.length) continue;
    ctx.save();
    ctx.globalCompositeOperation = element.tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = element.tool === "eraser" ? "rgba(0,0,0,1)" : element.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i=1;i<points.length;i++) {
      const p = points[i];
      const pressure = p.pressure || .5;
      ctx.lineWidth = element.width * (.72 + pressure * .55);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function DrawingWorkspace({ drawingId, onClose, compact = false }: { drawingId: string; onClose?: () => void; compact?: boolean }) {
  const { state, updateDrawing, updateDrawingPage, addDrawingPage, deleteDrawingPage } = useStudy();

  // Full-screen workspaces temporarily collapse the Study OS navigation rail so
  // the canvas owns the viewport. Compact embeds (previews/cards) do not affect
  // the surrounding application shell.
  useEffect(() => {
    if (compact) return;
    document.documentElement.classList.add("workspace-open");
    return () => document.documentElement.classList.remove("workspace-open");
  }, [compact]);
  const drawing = state.drawings.find((item) => item.id === drawingId);
  const [pageId, setPageId] = useState<string | null>(drawing?.pages[0]?.id || null);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [future, setFuture] = useState<DrawingElement[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);

  useEffect(() => {
    if (drawing && !drawing.pages.some((p) => p.id === pageId)) setPageId(drawing.pages[0]?.id || null);
  }, [drawing, pageId]);
  const page = drawing?.pages.find((item) => item.id === pageId) || drawing?.pages[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawPage(ctx, page.width, page.height, page.background, page.elements);
  }, [page]);

  if (!drawing || !page) return <div className="workspace-empty">Workspace unavailable.</div>;

  const pointerPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) / rect.width) * page.width * 10) / 10,
      y: Math.round(((event.clientY - rect.top) / rect.height) * page.height * 10) / 10,
      pressure: Math.round((event.pointerType === "mouse" ? .5 : Math.max(.05, event.pressure || .5)) * 100) / 100,
      tiltX: event.pointerType === "mouse" ? 0 : Math.round(event.tiltX || 0),
      tiltY: event.pointerType === "mouse" ? 0 : Math.round(event.tiltY || 0)
    };
  };

  function pushHistory() { setHistory((h) => [...h.slice(-24), page.elements]); setFuture([]); }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (tool === "text") {
      const point = pointerPoint(event);
      const text = window.prompt("Text to place on workspace:");
      if (!text) return;
      pushHistory();
      updateDrawingPage(drawing.id, page.id, { elements: [...page.elements, { id: uid("txt"), type: "text", x: point.x, y: point.y, text, color, size: 24 }] });
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pushHistory();
    activeStrokeRef.current = { id: uid("stroke"), type: "stroke", tool: tool === "eraser" ? "eraser" : "pen", color, width: tool === "eraser" ? width * 6 : width, points: [pointerPoint(event)] };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    const nextPoint = pointerPoint(event);
    const prev = stroke.points[stroke.points.length - 1];
    if (prev && Math.hypot(nextPoint.x - prev.x, nextPoint.y - prev.y) < 1.5) return;
    stroke.points.push(nextPoint);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) drawPage(ctx, page.width, page.height, page.background, [...page.elements, stroke]);
  }

  function onPointerUp() {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    activeStrokeRef.current = null;
    const finalized = { ...stroke, points: simplify(stroke.points) };
    updateDrawingPage(drawing.id, page.id, { elements: [...page.elements, finalized] });
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((f) => [page.elements, ...f]);
    setHistory((h) => h.slice(0,-1));
    updateDrawingPage(drawing.id, page.id, { elements: previous });
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, page.elements]);
    setFuture((f) => f.slice(1));
    updateDrawingPage(drawing.id, page.id, { elements: next });
  }

  const content = <div className={`drawing-workspace ${compact ? "compact" : ""}`}>
    <div className="drawing-head">
      <div><span className="sys-label">WORKSPACE_{String(page.pageNumber).padStart(3,"0")}</span><input value={drawing.title} onChange={(e)=>updateDrawing(drawing.id,{title:e.target.value})}/></div>
      <div className="drawing-save-state"><i/> CLOUD AUTOSAVE</div>
      {onClose && <button className="button micro" onClick={onClose}>DONE</button>}
    </div>
    <div className="drawing-toolbar">
      <div className="tool-group">
        {(["pen","eraser","text"] as DrawingTool[]).map((item)=><button key={item} className={tool===item?"active":""} onClick={()=>setTool(item)}>{item.toUpperCase()}</button>)}
      </div>
      <div className="tool-group colors">{PEN_COLORS.map((item)=><button key={item} aria-label={item} className={color===item?"active":""} style={{background:item}} onClick={()=>setColor(item)}/>)}</div>
      <label className="stroke-control">WIDTH <input type="range" min="1" max="12" value={width} onChange={(e)=>setWidth(Number(e.target.value))}/><b>{width}px</b></label>
      <div className="tool-group"><button onClick={undo} disabled={!history.length}>UNDO</button><button onClick={redo} disabled={!future.length}>REDO</button><button onClick={()=>{pushHistory();updateDrawingPage(drawing.id,page.id,{elements:[]})}}>CLEAR</button></div>
      <div className="tool-group"><button onClick={()=>setZoom((z)=>Math.max(.5,z-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom((z)=>Math.min(1.6,z+.1))}>+</button></div>
      <select value={page.background} onChange={(e)=>updateDrawingPage(drawing.id,page.id,{background:e.target.value as DrawingBackground})}><option value="blank">BLANK</option><option value="dot">DOT GRID</option><option value="graph">GRAPH</option><option value="lined">LINES</option></select>
    </div>
    <div className="drawing-stage"><div className="drawing-scale" style={{width:`${zoom*100}%`}}><canvas ref={canvasRef} width={page.width} height={page.height} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}/></div></div>
    <div className="drawing-pages">
      <span>PAGE {page.pageNumber}/{drawing.pages.length}</span>
      <div>{drawing.pages.map((item)=><button key={item.id} className={page.id===item.id?"active":""} onClick={()=>{setPageId(item.id);setHistory([]);setFuture([])}}>{String(item.pageNumber).padStart(2,"0")}</button>)}</div>
      <button onClick={()=>{const id=addDrawingPage(drawing.id);setPageId(id)}}>+ PAGE</button>
      <button disabled={drawing.pages.length<=1} onClick={()=>{deleteDrawingPage(drawing.id,page.id);setPageId(drawing.pages.find((p)=>p.id!==page.id)?.id||null)}}>DELETE</button>
    </div>
  </div>;

  return compact ? content : <div className="workspace-modal-shell">{content}</div>;
}

export function DrawingPreview({ drawing }: { drawing: DrawingDocument }) {
  const page = drawing.pages[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=canvasRef.current; const ctx=canvas?.getContext("2d"); if(canvas&&ctx&&page) drawPage(ctx,page.width,page.height,page.background,page.elements)},[page]);
  if(!page)return null;
  return <canvas className="drawing-preview" ref={canvasRef} width={page.width} height={page.height}/>;
}
