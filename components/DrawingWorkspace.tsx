"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DrawingBackground,
  DrawingDocument,
  DrawingElement,
  DrawingPaper,
  DrawingPoint,
  DrawingStroke,
  DrawingTool,
} from "@/lib/types";
import { useStudy } from "./StudyProvider";

const PEN_COLORS = ["#090D0F", "#F3F3EF", "#EFFF1A", "#75F2C2", "#55A7FF", "#FF7B63"];

const PAGE_PRESETS = {
  "a4-portrait": { label: "A4 PORTRAIT", width: 1400, height: 1980 },
  "letter-portrait": { label: "LETTER PORTRAIT", width: 1400, height: 1812 },
  "a4-landscape": { label: "A4 LANDSCAPE", width: 1980, height: 1400 },
} as const;

type PagePresetId = keyof typeof PAGE_PRESETS;
type ViewMode = "fit-page" | "fit-width" | "custom";
type Bounds = { left: number; top: number; right: number; bottom: number };
type HandleName = "nw" | "ne" | "sw" | "se";

type SelectInteraction =
  | { kind: "box"; start: DrawingPoint; current: DrawingPoint }
  | { kind: "move"; start: DrawingPoint; baseElements: DrawingElement[]; selectedIds: string[]; changed: boolean }
  | {
      kind: "scale";
      start: DrawingPoint;
      baseElements: DrawingElement[];
      selectedIds: string[];
      bounds: Bounds;
      handle: HandleName;
      anchor: DrawingPoint;
      startHandle: DrawingPoint;
      changed: boolean;
    };

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
    if (dx * dx + dy * dy >= 3.5) result.push(p);
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

function normalizeBounds(a: DrawingPoint, b: DrawingPoint): Bounds {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

function elementBounds(element: DrawingElement): Bounds | null {
  if (element.type === "text") {
    const lines = element.text.split("\n");
    const maxChars = Math.max(1, ...lines.map((line) => line.length));
    const width = Math.max(element.size * 0.6, maxChars * element.size * 0.58);
    const lineHeight = element.size * 1.2;
    return {
      left: element.x,
      right: element.x + width,
      top: element.y - element.size,
      bottom: element.y + Math.max(0, lines.length - 1) * lineHeight + element.size * 0.25,
    };
  }

  if (!element.points.length) return null;
  const pad = Math.max(2, element.width / 2);
  const xs = element.points.map((point) => point.x);
  const ys = element.points.map((point) => point.y);
  return {
    left: Math.min(...xs) - pad,
    right: Math.max(...xs) + pad,
    top: Math.min(...ys) - pad,
    bottom: Math.max(...ys) + pad,
  };
}

function mergeBounds(bounds: Bounds[]): Bounds | null {
  if (!bounds.length) return null;
  return bounds.reduce(
    (result, item) => ({
      left: Math.min(result.left, item.left),
      top: Math.min(result.top, item.top),
      right: Math.max(result.right, item.right),
      bottom: Math.max(result.bottom, item.bottom),
    }),
    bounds[0]
  );
}

function selectedBounds(elements: DrawingElement[], ids: string[]) {
  const wanted = new Set(ids);
  return mergeBounds(
    elements
      .filter((element) => wanted.has(element.id))
      .map(elementBounds)
      .filter((bounds): bounds is Bounds => Boolean(bounds))
  );
}

function boundsIntersect(a: Bounds, b: Bounds) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function pointInsideBounds(point: DrawingPoint, bounds: Bounds, pad = 0) {
  return point.x >= bounds.left - pad && point.x <= bounds.right + pad && point.y >= bounds.top - pad && point.y <= bounds.bottom + pad;
}

function hitElement(element: DrawingElement, point: DrawingPoint, radius: number) {
  if (element.type === "text") {
    const bounds = elementBounds(element);
    return Boolean(bounds && pointInsideBounds(point, bounds, radius));
  }

  if (!element.points.length) return false;
  if (element.points.length === 1) return pointDistance(element.points[0], point) <= radius + element.width / 2;
  for (let i = 1; i < element.points.length; i++) {
    if (distanceToSegment(point, element.points[i - 1], element.points[i]) <= radius + element.width / 2) return true;
  }
  return false;
}

function selectionHandles(bounds: Bounds) {
  return {
    nw: { x: bounds.left, y: bounds.top },
    ne: { x: bounds.right, y: bounds.top },
    sw: { x: bounds.left, y: bounds.bottom },
    se: { x: bounds.right, y: bounds.bottom },
  } satisfies Record<HandleName, { x: number; y: number }>;
}

function oppositeHandle(bounds: Bounds, handle: HandleName): DrawingPoint {
  const handles = selectionHandles(bounds);
  if (handle === "nw") return { ...handles.se, pressure: 0.5 };
  if (handle === "ne") return { ...handles.sw, pressure: 0.5 };
  if (handle === "sw") return { ...handles.ne, pressure: 0.5 };
  return { ...handles.nw, pressure: 0.5 };
}

function findHandle(point: DrawingPoint, bounds: Bounds, radius: number): HandleName | null {
  const handles = selectionHandles(bounds);
  for (const handle of Object.keys(handles) as HandleName[]) {
    if (Math.hypot(point.x - handles[handle].x, point.y - handles[handle].y) <= radius) return handle;
  }
  return null;
}

function moveElements(elements: DrawingElement[], ids: string[], dx: number, dy: number): DrawingElement[] {
  const wanted = new Set(ids);
  return elements.map((element) => {
    if (!wanted.has(element.id)) return element;
    if (element.type === "text") return { ...element, x: element.x + dx, y: element.y + dy };
    return { ...element, points: element.points.map((point) => ({ ...point, x: point.x + dx, y: point.y + dy })) };
  });
}

function scaleElements(elements: DrawingElement[], ids: string[], anchor: DrawingPoint, scale: number): DrawingElement[] {
  const wanted = new Set(ids);
  return elements.map((element) => {
    if (!wanted.has(element.id)) return element;
    if (element.type === "text") {
      return {
        ...element,
        x: anchor.x + (element.x - anchor.x) * scale,
        y: anchor.y + (element.y - anchor.y) * scale,
        size: Math.max(8, element.size * scale),
      };
    }
    return {
      ...element,
      width: Math.max(0.6, element.width * scale),
      points: element.points.map((point) => ({
        ...point,
        x: anchor.x + (point.x - anchor.x) * scale,
        y: anchor.y + (point.y - anchor.y) * scale,
      })),
    };
  });
}

function scalePageContent(elements: DrawingElement[], oldWidth: number, oldHeight: number, newWidth: number, newHeight: number) {
  const scale = Math.min(newWidth / oldWidth, newHeight / oldHeight);
  const offsetX = (newWidth - oldWidth * scale) / 2;
  const offsetY = (newHeight - oldHeight * scale) / 2;
  return elements.map((element): DrawingElement => {
    if (element.type === "text") {
      return {
        ...element,
        x: offsetX + element.x * scale,
        y: offsetY + element.y * scale,
        size: Math.max(8, element.size * scale),
      };
    }
    return {
      ...element,
      width: Math.max(0.6, element.width * scale),
      points: element.points.map((point) => ({ ...point, x: offsetX + point.x * scale, y: offsetY + point.y * scale })),
    };
  });
}

/**
 * True vector erasing: touched portions of pen strokes are removed from the
 * saved geometry instead of painting the paper colour over them.
 */
function eraseElementsAt(elements: DrawingElement[], point: DrawingPoint, radius: number): DrawingElement[] {
  const result: DrawingElement[] = [];

  for (const element of elements) {
    if (element.type === "text") {
      const bounds = elementBounds(element);
      if (bounds) {
        const nearestX = Math.max(bounds.left, Math.min(point.x, bounds.right));
        const nearestY = Math.max(bounds.top, Math.min(point.y, bounds.bottom));
        if (Math.hypot(point.x - nearestX, point.y - nearestY) <= radius) continue;
      }
      result.push(element);
      continue;
    }

    // Keep legacy eraser elements so old drawings remain backward compatible.
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
    for (let x = 0; x < width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (background === "lined") {
    for (let y = 36; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  ctx.restore();

  const renderElements = (target: CanvasRenderingContext2D, legacyEraserMode = false) => {
    for (const element of elements) {
      if (element.type === "text") {
        target.save();
        target.globalCompositeOperation = "source-over";
        target.fillStyle = visibleInk(element.color, paper);
        target.font = `${element.size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
        const lineHeight = element.size * 1.2;
        element.text.split("\n").forEach((line, index) => target.fillText(line, element.x, element.y + index * lineHeight));
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
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const pressure = p.pressure || 0.5;
        target.lineWidth = element.width * (0.72 + pressure * 0.55);
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

  // Older saved pages may contain eraser strokes. Replay them on an ink-only
  // layer so they never punch holes in the paper/grid itself.
  const inkCanvas = document.createElement("canvas");
  inkCanvas.width = width;
  inkCanvas.height = height;
  const ink = inkCanvas.getContext("2d");
  if (!ink) return;
  renderElements(ink, true);
  ctx.drawImage(inkCanvas, 0, 0);
}

function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  elements: DrawingElement[],
  selectedIds: string[],
  viewScale: number,
  box?: Bounds | null
) {
  const safeScale = Math.max(0.08, viewScale);

  if (box) {
    ctx.save();
    ctx.strokeStyle = "#55A7FF";
    ctx.fillStyle = "rgba(85,167,255,.10)";
    ctx.lineWidth = 1.5 / safeScale;
    ctx.setLineDash([8 / safeScale, 6 / safeScale]);
    ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
    ctx.fillRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
    ctx.restore();
  }

  const bounds = selectedBounds(elements, selectedIds);
  if (!bounds) return;

  const handleSize = 9 / safeScale;
  ctx.save();
  ctx.strokeStyle = "#EFFF1A";
  ctx.fillStyle = "rgba(239,255,26,.07)";
  ctx.lineWidth = 2 / safeScale;
  ctx.setLineDash([10 / safeScale, 7 / safeScale]);
  ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.setLineDash([]);

  Object.values(selectionHandles(bounds)).forEach((handle) => {
    ctx.fillStyle = "#EFFF1A";
    ctx.strokeStyle = "#090D0F";
    ctx.lineWidth = 1.5 / safeScale;
    ctx.fillRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2);
    ctx.strokeRect(handle.x - handleSize, handle.y - handleSize, handleSize * 2, handleSize * 2);
  });
  ctx.restore();
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
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [future, setFuture] = useState<DrawingElement[][]>([]);
  const [drawEnabled, setDrawEnabled] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [resizePreset, setResizePreset] = useState<PagePresetId>("a4-portrait");
  const [viewMode, setViewMode] = useState<ViewMode>("fit-page");
  const [customScale, setCustomScale] = useState(0.6);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const eraserElementsRef = useRef<DrawingElement[] | null>(null);
  const selectInteractionRef = useRef<SelectInteraction | null>(null);
  const previewElementsRef = useRef<DrawingElement[] | null>(null);

  useEffect(() => {
    if (drawing && !drawing.pages.some((p) => p.id === pageId)) setPageId(drawing.pages[0]?.id || null);
  }, [drawing, pageId]);

  const page = drawing?.pages.find((item) => item.id === pageId) || drawing?.pages[0];
  const paper: DrawingPaper = page?.paper === "dark" ? "dark" : "light";

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const measure = () => setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [drawing?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobile = window.matchMedia("(max-width: 650px) and (pointer: coarse)").matches;
    if (mobile) {
      setDrawEnabled(false);
      return;
    }
    const saved = window.localStorage.getItem("study-os:workspace-draw-enabled");
    if (saved === "0") setDrawEnabled(false);
    if (saved === "1") setDrawEnabled(true);
  }, []);

  useEffect(() => {
    setSelectedIds([]);
    setHistory([]);
    setFuture([]);
    selectInteractionRef.current = null;
    previewElementsRef.current = null;
  }, [page?.id]);

  const fitWidthScale = useMemo(() => {
    if (!page || !stageSize.width) return 0.5;
    return Math.max(0.08, (stageSize.width - 48) / page.width);
  }, [page, stageSize.width]);

  const fitPageScale = useMemo(() => {
    if (!page || !stageSize.width || !stageSize.height) return fitWidthScale;
    const widthScale = (stageSize.width - 48) / page.width;
    const heightScale = (stageSize.height - 48) / page.height;
    return Math.max(0.08, Math.min(widthScale, heightScale));
  }, [page, stageSize, fitWidthScale]);

  const viewScale = viewMode === "fit-width" ? fitWidthScale : viewMode === "fit-page" ? fitPageScale : customScale;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !page) return;
    const currentPaper: DrawingPaper = page.paper === "dark" ? "dark" : "light";
    drawPage(ctx, page.width, page.height, page.background, currentPaper, page.elements);
    drawSelectionOverlay(ctx, page.elements, selectedIds, viewScale);
  }, [page, selectedIds, viewScale]);

  if (!drawing || !page) return <div className="workspace-empty">Workspace unavailable.</div>;

  const activeDrawing = drawing;
  const activePage = page;

  const pointerPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) / rect.width) * activePage.width * 10) / 10,
      y: Math.round(((event.clientY - rect.top) / rect.height) * activePage.height * 10) / 10,
      pressure: Math.round((event.pointerType === "mouse" ? 0.5 : Math.max(0.05, event.pressure || 0.5)) * 100) / 100,
      tiltX: event.pointerType === "mouse" ? 0 : Math.round(event.tiltX || 0),
      tiltY: event.pointerType === "mouse" ? 0 : Math.round(event.tiltY || 0),
    };
  };

  function renderCanvas(elements = activePage.elements, box?: Bounds | null, selected = selectedIds) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawPage(ctx, activePage.width, activePage.height, activePage.background, paper, elements);
    drawSelectionOverlay(ctx, elements, selected, viewScale, box);
  }

  function pushHistory(elements = activePage.elements) {
    setHistory((current) => [...current.slice(-24), elements]);
    setFuture([]);
  }

  function eraserRadius() {
    return Math.max(10, width * 3.5);
  }

  function handleRadius() {
    return 18 / Math.max(0.08, viewScale);
  }

  function setDrawingLock(next: boolean) {
    setDrawEnabled(next);
    activeStrokeRef.current = null;
    eraserElementsRef.current = null;
    selectInteractionRef.current = null;
    previewElementsRef.current = null;
    renderCanvas(activePage.elements);
    if (typeof window !== "undefined" && !window.matchMedia("(max-width: 650px) and (pointer: coarse)").matches) {
      window.localStorage.setItem("study-os:workspace-draw-enabled", next ? "1" : "0");
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawEnabled) return;

    const point = pointerPoint(event);

    if (tool === "text") {
      const text = window.prompt("Text to place on workspace:");
      if (!text) return;
      pushHistory();
      updateDrawingPage(activeDrawing.id, activePage.id, {
        elements: [
          ...activePage.elements,
          { id: uid("txt"), type: "text", x: point.x, y: point.y, text, color, size: 24 },
        ],
      });
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "select") {
      const currentBounds = selectedBounds(activePage.elements, selectedIds);
      const handle = currentBounds ? findHandle(point, currentBounds, handleRadius()) : null;

      if (handle && currentBounds) {
        const handles = selectionHandles(currentBounds);
        selectInteractionRef.current = {
          kind: "scale",
          start: point,
          baseElements: activePage.elements,
          selectedIds: [...selectedIds],
          bounds: currentBounds,
          handle,
          anchor: oppositeHandle(currentBounds, handle),
          startHandle: { ...handles[handle], pressure: 0.5 },
          changed: false,
        };
        return;
      }

      const hit = [...activePage.elements].reverse().find((element) => hitElement(element, point, 12 / Math.max(0.08, viewScale)));
      if (hit) {
        const nextSelection = selectedIds.includes(hit.id) ? selectedIds : [hit.id];
        setSelectedIds(nextSelection);
        selectInteractionRef.current = {
          kind: "move",
          start: point,
          baseElements: activePage.elements,
          selectedIds: [...nextSelection],
          changed: false,
        };
        renderCanvas(activePage.elements, null, nextSelection);
        return;
      }

      setSelectedIds([]);
      selectInteractionRef.current = { kind: "box", start: point, current: point };
      renderCanvas(activePage.elements, normalizeBounds(point, point), []);
      return;
    }

    pushHistory();

    if (tool === "eraser") {
      const next = eraseElementsAt(activePage.elements, point, eraserRadius());
      eraserElementsRef.current = next;
      renderCanvas(next);
      return;
    }

    activeStrokeRef.current = { id: uid("stroke"), type: "stroke", tool: "pen", color, width, points: [point] };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawEnabled) return;

    const interaction = selectInteractionRef.current;
    if (interaction && tool === "select") {
      const point = pointerPoint(event);

      if (interaction.kind === "box") {
        interaction.current = point;
        const box = normalizeBounds(interaction.start, point);
        const ids = activePage.elements
          .filter((element) => {
            const bounds = elementBounds(element);
            return Boolean(bounds && boundsIntersect(bounds, box));
          })
          .map((element) => element.id);
        renderCanvas(activePage.elements, box, ids);
        return;
      }

      if (interaction.kind === "move") {
        const dx = point.x - interaction.start.x;
        const dy = point.y - interaction.start.y;
        if (!interaction.changed && Math.hypot(dx, dy) > 1) {
          interaction.changed = true;
          pushHistory(interaction.baseElements);
        }
        if (!interaction.changed) return;
        const next = moveElements(interaction.baseElements, interaction.selectedIds, dx, dy);
        previewElementsRef.current = next;
        renderCanvas(next, null, interaction.selectedIds);
        return;
      }

      const startDistance = Math.max(1, Math.hypot(interaction.startHandle.x - interaction.anchor.x, interaction.startHandle.y - interaction.anchor.y));
      const currentDistance = Math.hypot(point.x - interaction.anchor.x, point.y - interaction.anchor.y);
      const scale = Math.min(6, Math.max(0.15, currentDistance / startDistance));
      if (!interaction.changed && Math.abs(scale - 1) > 0.01) {
        interaction.changed = true;
        pushHistory(interaction.baseElements);
      }
      if (!interaction.changed) return;
      const next = scaleElements(interaction.baseElements, interaction.selectedIds, interaction.anchor, scale);
      previewElementsRef.current = next;
      renderCanvas(next, null, interaction.selectedIds);
      return;
    }

    if (eraserElementsRef.current) {
      const next = eraseElementsAt(eraserElementsRef.current, pointerPoint(event), eraserRadius());
      eraserElementsRef.current = next;
      renderCanvas(next);
      return;
    }

    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    const nextPoint = pointerPoint(event);
    const prev = stroke.points[stroke.points.length - 1];
    if (prev && Math.hypot(nextPoint.x - prev.x, nextPoint.y - prev.y) < 1.5) return;
    stroke.points.push(nextPoint);
    renderCanvas([...activePage.elements, stroke]);
  }

  function onPointerUp(event?: React.PointerEvent<HTMLCanvasElement>) {
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    const interaction = selectInteractionRef.current;
    if (interaction && tool === "select") {
      selectInteractionRef.current = null;

      if (interaction.kind === "box") {
        const box = normalizeBounds(interaction.start, interaction.current);
        const ids = activePage.elements
          .filter((element) => {
            const bounds = elementBounds(element);
            return Boolean(bounds && boundsIntersect(bounds, box));
          })
          .map((element) => element.id);
        setSelectedIds(ids);
        renderCanvas(activePage.elements, null, ids);
        return;
      }

      if (interaction.changed && previewElementsRef.current) {
        const elements = previewElementsRef.current;
        previewElementsRef.current = null;
        updateDrawingPage(activeDrawing.id, activePage.id, { elements });
        return;
      }

      previewElementsRef.current = null;
      renderCanvas(activePage.elements);
      return;
    }

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
    setFuture((current) => [activePage.elements, ...current]);
    setHistory((current) => current.slice(0, -1));
    setSelectedIds([]);
    updateDrawingPage(activeDrawing.id, activePage.id, { elements: previous });
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((current) => [...current, activePage.elements]);
    setFuture((current) => current.slice(1));
    setSelectedIds([]);
    updateDrawingPage(activeDrawing.id, activePage.id, { elements: next });
  }

  function deleteSelected() {
    if (!selectedIds.length) return;
    pushHistory();
    const wanted = new Set(selectedIds);
    updateDrawingPage(activeDrawing.id, activePage.id, { elements: activePage.elements.filter((element) => !wanted.has(element.id)) });
    setSelectedIds([]);
  }

  function changePaper(next: DrawingPaper) {
    updateDrawingPage(activeDrawing.id, activePage.id, { paper: next });
    if (next === "light" && color.toUpperCase() === "#F3F3EF") setColor("#090D0F");
    if (next === "dark" && color.toUpperCase() === "#090D0F") setColor("#F3F3EF");
  }

  function resizeCurrentPage() {
    const preset = PAGE_PRESETS[resizePreset];
    if (activePage.width === preset.width && activePage.height === preset.height) return;
    const message = activePage.elements.length
      ? `Resize this page to ${preset.label}? Existing handwriting/text will be proportionally scaled to fit. This cannot be undone with the drawing Undo button.`
      : `Resize this page to ${preset.label}?`;
    if (!window.confirm(message)) return;
    const elements = scalePageContent(activePage.elements, activePage.width, activePage.height, preset.width, preset.height);
    setSelectedIds([]);
    updateDrawingPage(activeDrawing.id, activePage.id, { width: preset.width, height: preset.height, elements });
    setViewMode("fit-page");
  }

  function zoomBy(delta: number) {
    setCustomScale(Math.min(2.5, Math.max(0.15, viewScale + delta)));
    setViewMode("custom");
  }

  function deleteCurrentPage() {
    if (activeDrawing.pages.length === 1) {
      if (!window.confirm("This is the last page in this workspace. Deleting it will delete the entire workspace set. Continue?")) return;
      deleteDrawing(activeDrawing.id);
      onClose?.();
      return;
    }
    if (!window.confirm(`Delete page ${activePage.pageNumber}? This cannot be undone.`)) return;
    const nextPage = activeDrawing.pages.find((item) => item.id !== activePage.id);
    deleteDrawingPage(activeDrawing.id, activePage.id);
    setPageId(nextPage?.id || null);
  }

  function deleteWorkspace() {
    if (!window.confirm(`Delete \"${activeDrawing.title}\" and all ${activeDrawing.pages.length} page${activeDrawing.pages.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    deleteDrawing(activeDrawing.id);
    onClose?.();
  }

  const selectedCount = selectedIds.length;
  const cursor = !drawEnabled ? "default" : tool === "select" ? "default" : tool === "text" ? "text" : "crosshair";

  const content = (
    <div className={`drawing-workspace ${compact ? "compact" : ""}`}>
      <div className="drawing-head">
        <div>
          <span className="sys-label">WORKSPACE_{String(activePage.pageNumber).padStart(3, "0")}</span>
          <input value={activeDrawing.title} onChange={(event) => updateDrawing(activeDrawing.id, { title: event.target.value })} />
        </div>
        <div className="drawing-save-state"><i /> CLOUD AUTOSAVE</div>
        {!compact && <button className="button micro workspace-delete" onClick={deleteWorkspace}>DELETE SET</button>}
        {onClose && <button className="button micro" onClick={onClose}>DONE</button>}
      </div>

      <div className="drawing-toolbar">
        <div className="tool-group">
          {(["pen", "eraser", "text", "select"] as DrawingTool[]).map((item) => (
            <button key={item} className={tool === item ? "active" : ""} onClick={() => setTool(item)} disabled={!drawEnabled}>
              {item === "select" ? "SELECT" : item.toUpperCase()}
            </button>
          ))}
        </div>

        <button className={`draw-lock ${drawEnabled ? "enabled" : "locked"}`} onClick={() => setDrawingLock(!drawEnabled)}>
          {drawEnabled ? "UNLOCKED · DRAW ON" : "LOCKED · SCROLL"}
        </button>

        <div className="tool-group colors">
          {PEN_COLORS.map((item) => (
            <button key={item} aria-label={item} className={color === item ? "active" : ""} style={{ background: item }} onClick={() => setColor(item)} disabled={!drawEnabled} />
          ))}
        </div>

        <label className="stroke-control">
          WIDTH
          <input type="range" min="1" max="12" value={width} onChange={(event) => setWidth(Number(event.target.value))} disabled={!drawEnabled} />
          <b>{width}px</b>
        </label>

        <div className="tool-group">
          <button onClick={undo} disabled={!history.length}>UNDO</button>
          <button onClick={redo} disabled={!future.length}>REDO</button>
          <button onClick={() => { pushHistory(); setSelectedIds([]); updateDrawingPage(activeDrawing.id, activePage.id, { elements: [] }); }}>CLEAR</button>
        </div>

        <div className="tool-group view-tools">
          <button className={viewMode === "fit-page" ? "active" : ""} onClick={() => setViewMode("fit-page")}>FIT PAGE</button>
          <button className={viewMode === "fit-width" ? "active" : ""} onClick={() => setViewMode("fit-width")}>FIT WIDTH</button>
          <button onClick={() => zoomBy(-0.1)}>−</button>
          <span>{Math.round(viewScale * 100)}%</span>
          <button onClick={() => zoomBy(0.1)}>+</button>
        </div>

        <select aria-label="Paper color" value={paper} onChange={(event) => changePaper(event.target.value as DrawingPaper)}>
          <option value="light">LIGHT PAPER</option>
          <option value="dark">DARK PAPER</option>
        </select>

        <select aria-label="Paper pattern" value={activePage.background} onChange={(event) => updateDrawingPage(activeDrawing.id, activePage.id, { background: event.target.value as DrawingBackground })}>
          <option value="blank">BLANK</option>
          <option value="dot">DOT GRID</option>
          <option value="graph">GRAPH</option>
          <option value="lined">LINES</option>
        </select>
      </div>

      <div className="drawing-subtoolbar">
        <span className="current-page-size">CURRENT {activePage.width}×{activePage.height}</span>
        <select value={resizePreset} onChange={(event) => setResizePreset(event.target.value as PagePresetId)} aria-label="Resize page preset">
          {Object.entries(PAGE_PRESETS).map(([id, preset]) => <option key={id} value={id}>{preset.label}</option>)}
        </select>
        <button onClick={resizeCurrentPage}>RESIZE PAGE</button>
        {tool === "select" && selectedCount > 0 && (
          <div className="selection-actions">
            <strong>{selectedCount} SELECTED</strong>
            <span>DRAG TO MOVE · CORNERS TO SCALE</span>
            <button onClick={deleteSelected}>DELETE SELECTED</button>
          </div>
        )}
      </div>

      <div ref={stageRef} className={`drawing-stage paper-${paper} ${drawEnabled ? "is-draw-enabled" : "is-locked"}`}>
        <div className="drawing-scale" style={{ width: `${activePage.width * viewScale}px`, height: `${activePage.height * viewScale}px` }}>
          <canvas
            style={{ backgroundColor: paperFill(paper), touchAction: drawEnabled ? "none" : "pan-x pan-y pinch-zoom", cursor }}
            ref={canvasRef}
            width={activePage.width}
            height={activePage.height}
            onPointerEnter={(event) => {
              if (event.pointerType === "pen" && viewMode === "fit-page") setViewMode("fit-width");
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>

      <div className="drawing-pages">
        <span>PAGE {activePage.pageNumber}/{activeDrawing.pages.length}</span>
        <button
          className="page-arrow"
          disabled={activePage.pageNumber <= 1}
          onClick={() => setPageId(activeDrawing.pages[activePage.pageNumber - 2]?.id || activePage.id)}
        >‹</button>
        <div>
          {activeDrawing.pages.map((item) => (
            <button key={item.id} className={activePage.id === item.id ? "active" : ""} onClick={() => setPageId(item.id)}>
              {String(item.pageNumber).padStart(2, "0")}
            </button>
          ))}
        </div>
        <button
          className="page-arrow"
          disabled={activePage.pageNumber >= activeDrawing.pages.length}
          onClick={() => setPageId(activeDrawing.pages[activePage.pageNumber]?.id || activePage.id)}
        >›</button>
        <button onClick={() => { const id = addDrawingPage(activeDrawing.id); setPageId(id); setViewMode("fit-page"); }}>+ PAGE</button>
        <button className="page-delete" onClick={deleteCurrentPage}>DELETE PAGE</button>
      </div>
    </div>
  );

  return compact ? content : <div className="workspace-modal-shell">{content}</div>;
}

export function DrawingPreview({ drawing }: { drawing: DrawingDocument }) {
  const page = drawing.pages[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paper: DrawingPaper = page?.paper === "dark" ? "dark" : "light";

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx && page) drawPage(ctx, page.width, page.height, page.background, page.paper === "dark" ? "dark" : "light", page.elements);
  }, [page]);

  if (!page) return null;
  return <canvas className="drawing-preview" style={{ backgroundColor: paperFill(paper) }} ref={canvasRef} width={page.width} height={page.height} />;
}
