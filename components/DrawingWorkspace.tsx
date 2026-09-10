"use client";

import { useEffect, useRef, useState } from "react";
import type { DrawingBackground, DrawingDocument, DrawingElement, DrawingPaper, DrawingPoint, DrawingStroke, DrawingTool } from "@/lib/types";
import { useStudy } from "./StudyProvider";

const PEN_COLORS = ["#090D0F", "#F3F3EF", "#EFFF1A", "#75F2C2", "#55A7FF", "#FF7B63"];

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

function paperFill(paper: DrawingPaper) {
  return paper === "light" ? "#FFFFFF" : "#0A1014";
}

function visibleInk(color: string, paper: DrawingPaper) {
  const normalized = color.toUpperCase();
  if (paper === "light" && ["#F3F3EF", "#FFFFFF", "#FFF"].includes(normalized)) return "#090D0F";
  if (paper === "dark" && ["#090D0F", "#000000", "#000"].includes(normalized)) return "#F3F3EF";
  return color;
}

function pointDistance(a: DrawingPoint, b: DrawingPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point: DrawingPoint, a: DrawingPoint, b: DrawingPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return pointDistance(point, a);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/**
 * True vector erasing: touched portions of pen strokes are removed from the
 * saved geometry instead of painting the paper colour over them. This keeps
 * blank/grid/line paper perfectly clean and makes erasing independent of the
 * selected paper colour.
 */
function eraseElementsAt(elements: DrawingElement[], point: DrawingPoint, radius: number): DrawingElement[] {
  const result: DrawingElement[] = [];

  for (const element of elements) {
    if (element.type === "text") {
      const width = Math.max(element.size * .6, element.text.length * element.size * .58);
      const left = element.x;
      const right = element.x + width;
      const top = element.y - element.size;
      const bottom = element.y + element.size * .25;
      const nearestX = Math.max(left, Math.min(point.x, right));
      const nearestY = Math.max(top, Math.min(point.y, bottom));
      if (Math.hypot(point.x - nearestX, point.y - nearestY) <= radius) continue;
      result.push(element);
      continue;
    }

    // Keep legacy eraser elements so old drawings remain backward compatible.
    // New erasing never creates these elements.
    if (element.tool === "eraser") {
      result.push(element);
      continue;
    }

    const points = element.points;
    if (!points.length) continue;
    if (points.length === 1) {
      if (pointDistance(points[0], point) > radius + element.width / 2) result.push(element);
      continue;
    }

    const chunks: DrawingPoint[][] = [];
    let chunk: DrawingPoint[] = [points[0]];
    const hitRadius = radius + element.width / 2;

    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const hit = distanceToSegment(point, a, b) <= hitRadius;

      if (hit) {
        if (chunk.length > 1) chunks.push(chunk);
        chunk = [];
        continue;
      }

      if (!chunk.length) chunk = [a];
      chunk.push(b);
    }

    if (chunk.length > 1) chunks.push(chunk);

    chunks.forEach((segment, index) => {
      result.push({ ...element, id: index === 0 ? element.id : uid("stroke"), points: segment });
    });
  }

  return result;
}

function drawPage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: DrawingBackground,
  paper: DrawingPaper,
  elements: DrawingElement[]
) {
  const fill = paperFill(paper);
  const gridStroke = paper === "light" ? "rgba(9,13,15,.11)" : "rgba(159,188,198,.12)";
  const dotFill = paper === "light" ? "rgba(9,13,15,.19)" : "rgba(159,188,198,.22)";

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = gridStroke;
  ctx.lineWidth = 1;
  if (background === "dot") {
    ctx.fillStyle = dotFill;
    for (let x = 24; x < width; x += 24) for (let y = 24; y < height; y += 24) ctx.fillRect(x, y, 1.3, 1.3);
  } else if (background === "graph") {
    for (let x = 0; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
    for (let y = 0; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
  } else if (background === "lined") {
    for (let y = 36; y < height; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
  }
  ctx.restore();

  const renderElements = (target: CanvasRenderingContext2D, legacyEraserMode = false) => {
    for (const element of elements) {
      if (element.type === "text") {
        target.save();
        target.globalCompositeOperation = "source-over";
        target.fillStyle = visibleInk(element.color, paper);
        target.font = `${element.size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
        target.fillText(element.text, element.x, element.y);
        target.restore();
        continue;
      }
      const points = element.points;
      if (!points.length) continue;
      target.save();
      target.globalCompositeOperation = element.tool === "eraser" && legacyEraserMode ? "destination-out" : "source-over";
      target.strokeStyle = element.tool === "eraser" ? "rgba(0,0,0,1)" : visibleInk(element.color, paper);
      target.lineCap = "round";
      target.lineJoin = "round";
      target.beginPath();
      target.moveTo(points[0].x, points[0].y);
      for (let i=1;i<points.length;i++) {
        const p = points[i];
        const pressure = p.pressure || .5;
        target.lineWidth = element.width * (.72 + pressure * .55);
        target.lineTo(p.x, p.y);
      }
      target.stroke();
      target.restore();
    }
  };

  const hasLegacyEraser = elements.some((element) => element.type === "stroke" && element.tool === "eraser");
  if (!hasLegacyEraser) {
    renderElements(ctx);
    return;
  }

  // Older saved pages may contain "eraser strokes". Replay those against a
  // transparent ink-only layer so they erase ink, never the paper/grid below.
  const inkCanvas = document.createElement("canvas");
  inkCanvas.width = width;
  inkCanvas.height = height;
  const ink = inkCanvas.getContext("2d");
  if (!ink) return;
  renderElements(ink, true);
  ctx.drawImage(inkCanvas, 0, 0);
}

export function DrawingWorkspace({ drawingId, onClose, compact = false }: { drawingId: string; onClose?: () => void; compact?: boolean }) {
  const { state, updateDrawing, deleteDrawing, updateDrawingPage, addDrawingPage, deleteDrawingPage } = useStudy();

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
  const eraserElementsRef = useRef<DrawingElement[] | null>(null);

  useEffect(() => {
    if (drawing && !drawing.pages.some((p) => p.id === pageId)) setPageId(drawing.pages[0]?.id || null);
  }, [drawing, pageId]);
  const page = drawing?.pages.find((item) => item.id === pageId) || drawing?.pages[0];
  const paper: DrawingPaper = page?.paper === "dark" ? "dark" : "light";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawPage(ctx, page.width, page.height, page.background, page.paper === "dark" ? "dark" : "light", page.elements);
  }, [page]);

  if (!drawing || !page) return <div className="workspace-empty">Workspace unavailable.</div>;

  const activeDrawing = drawing;
  const activePage = page;

  const pointerPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) / rect.width) * activePage.width * 10) / 10,
      y: Math.round(((event.clientY - rect.top) / rect.height) * activePage.height * 10) / 10,
      pressure: Math.round((event.pointerType === "mouse" ? .5 : Math.max(.05, event.pressure || .5)) * 100) / 100,
      tiltX: event.pointerType === "mouse" ? 0 : Math.round(event.tiltX || 0),
      tiltY: event.pointerType === "mouse" ? 0 : Math.round(event.tiltY || 0)
    };
  };

  function pushHistory() {
    setHistory((h) => [...h.slice(-24), activePage.elements]);
    setFuture([]);
  }

  function eraserRadius() {
    return Math.max(10, width * 3.5);
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (tool === "text") {
      const point = pointerPoint(event);
      const text = window.prompt("Text to place on workspace:");
  
      if (!text) return;
  
      pushHistory();
  
      updateDrawingPage(activeDrawing.id, activePage.id, {
        elements: [
          ...activePage.elements,
          {
            id: uid("txt"),
            type: "text",
            x: point.x,
            y: point.y,
            text,
            color,
            size: 24,
          },
        ],
      });
  
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pushHistory();

    if (tool === "eraser") {
      const next = eraseElementsAt(activePage.elements, pointerPoint(event), eraserRadius());
      eraserElementsRef.current = next;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawPage(ctx, activePage.width, activePage.height, activePage.background, paper, next);
      return;
    }

    activeStrokeRef.current = { id: uid("stroke"), type: "stroke", tool: "pen", color, width, points: [pointerPoint(event)] };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (eraserElementsRef.current) {
      const next = eraseElementsAt(eraserElementsRef.current, pointerPoint(event), eraserRadius());
      eraserElementsRef.current = next;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawPage(ctx, activePage.width, activePage.height, activePage.background, paper, next);
      return;
    }

    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    const nextPoint = pointerPoint(event);
    const prev = stroke.points[stroke.points.length - 1];
    if (prev && Math.hypot(nextPoint.x - prev.x, nextPoint.y - prev.y) < 1.5) return;
    stroke.points.push(nextPoint);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) drawPage(ctx, activePage.width, activePage.height, activePage.background, paper, [...activePage.elements, stroke]);
  }

  function onPointerUp() {
    if (eraserElementsRef.current) {
      const elements = eraserElementsRef.current;
      eraserElementsRef.current = null;
      updateDrawingPage(activeDrawing.id, activePage.id, { elements });
      return;
    }

    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    activeStrokeRef.current = null;
    const finalized = { ...stroke, points: simplify(stroke.points) };
    updateDrawingPage(activeDrawing.id, activePage.id, { elements: [...activePage.elements, finalized] });
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((f) => [activePage.elements, ...f]);
    setHistory((h) => h.slice(0,-1));
    updateDrawingPage(activeDrawing.id, activePage.id, { elements: previous });
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, activePage.elements]);
    setFuture((f) => f.slice(1));
    updateDrawingPage(activeDrawing.id, activePage.id, { elements: next });
  }

  function changePaper(next: DrawingPaper) {
    updateDrawingPage(activeDrawing.id, activePage.id, { paper: next });
    if (next === "light" && color.toUpperCase() === "#F3F3EF") setColor("#090D0F");
    if (next === "dark" && color.toUpperCase() === "#090D0F") setColor("#F3F3EF");
  }

  function deleteCurrentPage() {
    if (activeDrawing.pages.length === 1) {
      if (!window.confirm("This is the last page in this workspace. Deleting it will delete the entire workspace set. Continue?")) return;
      deleteDrawing(activeDrawing.id);
      onClose?.();
      return;
    }
    if (!window.confirm(`Delete page ${activePage.pageNumber}? This cannot be undone.`)) return;
    const nextPage = activeDrawing.pages.find((p) => p.id !== activePage.id);
    deleteDrawingPage(activeDrawing.id, activePage.id);
    setPageId(nextPage?.id || null);
    setHistory([]);
    setFuture([]);
  }

  function deleteWorkspace() {
    if (!window.confirm(`Delete \"${activeDrawing.title}\" and all ${activeDrawing.pages.length} page${activeDrawing.pages.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    deleteDrawing(activeDrawing.id);
    onClose?.();
  }

  const content = <div className={`drawing-workspace ${compact ? "compact" : ""}`}>
    <div className="drawing-head">
      <div><span className="sys-label">WORKSPACE_{String(activePage.pageNumber).padStart(3,"0")}</span><input value={activeDrawing.title} onChange={(e)=>updateDrawing(activeDrawing.id,{title:e.target.value})}/></div>
      <div className="drawing-save-state"><i/> CLOUD AUTOSAVE</div>
      {!compact && <button className="button micro workspace-delete" onClick={deleteWorkspace}>DELETE SET</button>}
      {onClose && <button className="button micro" onClick={onClose}>DONE</button>}
    </div>
    <div className="drawing-toolbar">
      <div className="tool-group">
        {(["pen","eraser","text"] as DrawingTool[]).map((item)=><button key={item} className={tool===item?"active":""} onClick={()=>setTool(item)}>{item.toUpperCase()}</button>)}
      </div>
      <div className="tool-group colors">{PEN_COLORS.map((item)=><button key={item} aria-label={item} className={color===item?"active":""} style={{background:item}} onClick={()=>setColor(item)}/>)}</div>
      <label className="stroke-control">WIDTH <input type="range" min="1" max="12" value={width} onChange={(e)=>setWidth(Number(e.target.value))}/><b>{width}px</b></label>
      <div className="tool-group"><button onClick={undo} disabled={!history.length}>UNDO</button><button onClick={redo} disabled={!future.length}>REDO</button><button onClick={()=>{pushHistory();updateDrawingPage(activeDrawing.id,activePage.id,{elements:[]})}}>CLEAR</button></div>
      <div className="tool-group"><button onClick={()=>setZoom((z)=>Math.max(.5,z-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom((z)=>Math.min(1.6,z+.1))}>+</button></div>
      <select aria-label="Paper color" value={paper} onChange={(e)=>changePaper(e.target.value as DrawingPaper)}><option value="light">LIGHT PAPER</option><option value="dark">DARK PAPER</option></select>
      <select aria-label="Paper pattern" value={activePage.background} onChange={(e)=>updateDrawingPage(activeDrawing.id,activePage.id,{background:e.target.value as DrawingBackground})}><option value="blank">BLANK</option><option value="dot">DOT GRID</option><option value="graph">GRAPH</option><option value="lined">LINES</option></select>
    </div>
    <div className={`drawing-stage paper-${paper}`}><div className="drawing-scale" style={{width:`${zoom*100}%`}}><canvas style={{backgroundColor:paperFill(paper)}} ref={canvasRef} width={activePage.width} height={activePage.height} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}/></div></div>
    <div className="drawing-pages">
      <span>PAGE {activePage.pageNumber}/{activeDrawing.pages.length}</span>
      <div>{activeDrawing.pages.map((item)=><button key={item.id} className={activePage.id===item.id?"active":""} onClick={()=>{setPageId(item.id);setHistory([]);setFuture([])}}>{String(item.pageNumber).padStart(2,"0")}</button>)}</div>
      <button onClick={()=>{const id=addDrawingPage(activeDrawing.id);setPageId(id)}}>+ PAGE</button>
      <button className="page-delete" onClick={deleteCurrentPage}>DELETE PAGE</button>
    </div>
  </div>;

  return compact ? content : <div className="workspace-modal-shell">{content}</div>;
}

export function DrawingPreview({ drawing }: { drawing: DrawingDocument }) {
  const page = drawing.pages[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paper: DrawingPaper = page?.paper === "dark" ? "dark" : "light";
  useEffect(()=>{const canvas=canvasRef.current; const ctx=canvas?.getContext("2d"); if(canvas&&ctx&&page) drawPage(ctx,page.width,page.height,page.background,page.paper === "dark" ? "dark" : "light",page.elements)},[page]);
  if(!page)return null;
  return <canvas className="drawing-preview" style={{backgroundColor:paperFill(paper)}} ref={canvasRef} width={page.width} height={page.height}/>;
}
