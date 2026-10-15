"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DesignElement } from "@/lib/types";
import type { TextFlowSegment } from "../core/textFlow";
import ElementView from "./ElementView";
import { MAX_SCALE, MIN_SCALE, MIN_SIZE, PX_PER_MM, clamp, round, uid } from "../core/utils";
import type { Handle, Mode, Tool } from "../core/utils";

type Props = {
  size: { w: number; h: number };
  scale: number;
  elements: DesignElement[];
  textFlow: Record<string, TextFlowSegment>;
  selectedId: string | null;
  selectedIds: string[];
  editingId: string | null;
  tool: Tool;
  mode: Mode;
  onSelect: (id: string | null, additive?: boolean) => void;
  onUpdate: (id: string, patch: Partial<DesignElement>) => void;
  onCreate: (el: DesignElement) => void;
  onToolDone: () => void;
  onEdit: (id: string | null) => void;
  onToggleMode: () => void;
  onScale: (s: number) => void;
};

export default function Canvas({
  size,
  scale,
  elements,
  textFlow,
  selectedId,
  selectedIds,
  editingId,
  tool,
  mode,
  onSelect,
  onUpdate,
  onCreate,
  onToolDone,
  onEdit,
  onToggleMode,
  onScale,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const sudahNavigasi = useRef(false);
  const sentuhan = useRef(new Map<number, { x: number; y: number }>());
  const gestureAwal = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
    pan: { x: number; y: number };
    scale: number;
  } | null>(null);
  const sentuhanTunggal = useRef<{
    id: number;
    x: number;
    y: number;
    started: boolean;
  } | null>(null);
  const pageW = size.w * PX_PER_MM;
  const pageH = size.h * PX_PER_MM;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const setPanPosition = useCallback((next: { x: number; y: number }) => {
    panRef.current = next;
    setPan(next);
  }, []);

  /* Letakkan halaman di tengah viewport saat editor pertama kali dibuka. */
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || sudahNavigasi.current) return;
    const frame = requestAnimationFrame(() => {
      if (sudahNavigasi.current) return;
      setPanPosition({
        x: (wrap.clientWidth - size.w * scaleRef.current) / 2,
        y: (wrap.clientHeight - size.h * scaleRef.current) / 2,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [size.h, size.w, setPanPosition]);

  const startDrawAt = useCallback(
    (clientX: number, clientY: number, complete = false) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const bounds = wrap.getBoundingClientRect();
      const drawScale = scaleRef.current;
      const sx = round((clientX - bounds.left - panRef.current.x) / drawScale);
      const sy = round((clientY - bounds.top - panRef.current.y) / drawScale);
      const id = uid();

      const baru: DesignElement =
        tool === "teks"
          ? {
              id,
              type: "text",
              x: sx,
              y: sy,
              w: 70,
              h: 14,
              text: "Teks",
              fontSize: 24,
              bold: false,
              align: "left",
              color: "#1c1917",
            }
          : tool === "persegi"
            ? {
                id,
                type: "rect",
                x: sx,
                y: sy,
                w: 60,
                h: 40,
                stroke: "#1c1917",
                strokeWidth: 0.5,
              }
            : tool === "elips"
            ? {
                id,
                type: "ellipse",
                x: sx,
                y: sy,
                w: 50,
                h: 50,
                stroke: "#1c1917",
                strokeWidth: 0.5,
              }
          : { id, type: "line", x: sx, y: sy, w: 20, h: 0, stroke: "#1c1917", strokeWidth: 0.5 };

      onCreate(baru);
      if (complete) {
        onToolDone();
        if (baru.type === "text") onEdit(id);
        return;
      }
      let digeser = false;

      const onMove = (ev: PointerEvent) => {
        const bounds = wrap.getBoundingClientRect();
        const currentScale = scaleRef.current;
        const cx = (ev.clientX - bounds.left - panRef.current.x) / currentScale;
        const cy = (ev.clientY - bounds.top - panRef.current.y) / currentScale;
        if (!digeser && Math.hypot(cx - sx, cy - sy) < 3) return;
        digeser = true;
        if (baru.type === "line") {
          onUpdate(id, {
            x: round(Math.min(sx, cx)),
            y: round(Math.min(sy, cy)),
            w: round(Math.abs(cx - sx)),
            h: round(Math.abs(cy - sy)),
            lineFlip: (cx - sx) * (cy - sy) < 0,
          });
          return;
        }
        onUpdate(id, {
          x: round(Math.min(sx, cx)),
          y: round(Math.min(sy, cy)),
          w: round(Math.max(MIN_SIZE, Math.abs(cx - sx))),
          h: round(Math.max(MIN_SIZE, Math.abs(cy - sy))),
        });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        onToolDone();
        if (baru.type === "text") onEdit(id);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [tool, onCreate, onUpdate, onToolDone, onEdit]
  );

  /* Wheel zooms around the cursor; middle-button dragging pans the pasteboard. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const multiplier = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? wrap.clientHeight : 1;
      const currentScale = scaleRef.current;
      const bounds = wrap.getBoundingClientRect();
      const cursorX = e.clientX - bounds.left;
      const cursorY = e.clientY - bounds.top;
      const nextScale = clamp(
        Math.round(currentScale * Math.exp(-e.deltaY * multiplier * 0.0015) * 1000) / 1000,
        MIN_SCALE,
        MAX_SCALE
      );
      if (nextScale === currentScale) return;
      const ratio = nextScale / currentScale;
      setPanPosition({
        x: cursorX - (cursorX - panRef.current.x) * ratio,
        y: cursorY - (cursorY - panRef.current.y) * ratio,
      });
      onScale(nextScale);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        if (e.target !== wrap && e.target !== workspaceRef.current) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        sentuhan.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (sentuhan.current.size === 1) {
          sentuhanTunggal.current = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            started: false,
          };
        } else if (sentuhan.current.size === 2) {
          const [a, b] = [...sentuhan.current.values()];
          const bounds = wrap.getBoundingClientRect();
          const midpoint = {
            x: (a.x + b.x) / 2 - bounds.left,
            y: (a.y + b.y) / 2 - bounds.top,
          };
          gestureAwal.current = {
            distance: Math.hypot(a.x - b.x, a.y - b.y),
            midpoint,
            pan: panRef.current,
            scale: scaleRef.current,
          };
          sentuhanTunggal.current = null;
        }
        return;
      }

      if (e.button !== 1) return;
      e.preventDefault();
      e.stopImmediatePropagation();

      const sx = e.clientX;
      const sy = e.clientY;
      const awal = panRef.current;
      sudahNavigasi.current = true;
      wrap.style.cursor = "grabbing";

      const move = (ev: PointerEvent) => {
        setPanPosition({ x: awal.x + ev.clientX - sx, y: awal.y + ev.clientY - sy });
      };
      const up = () => {
        wrap.style.cursor = "";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };
    const preventMiddleAutoScroll = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!sentuhan.current.has(e.pointerId)) return;
      e.preventDefault();
      sentuhan.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const points = [...sentuhan.current.values()];
      const start = sentuhanTunggal.current;
      if (points.length === 1 && start && !start.started &&
          Math.hypot(e.clientX - start.x, e.clientY - start.y) >= 5 &&
          tool !== "pilih") {
        start.started = true;
        sudahNavigasi.current = true;
        startDrawAt(start.x, start.y);
      }
      if (points.length < 2) return;
      const gesture = gestureAwal.current;
      if (!gesture) return;
      const [a, b] = points;
      const bounds = wrap.getBoundingClientRect();
      const midpoint = {
        x: (a.x + b.x) / 2 - bounds.left,
        y: (a.y + b.y) / 2 - bounds.top,
      };
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const nextScale = clamp(
        Math.round(gesture.scale * distance / Math.max(gesture.distance, 1) * 1000) / 1000,
        MIN_SCALE,
        MAX_SCALE
      );
      const anchorX = (gesture.midpoint.x - gesture.pan.x) / gesture.scale;
      const anchorY = (gesture.midpoint.y - gesture.pan.y) / gesture.scale;
      setPanPosition({
        x: midpoint.x - anchorX * nextScale,
        y: midpoint.y - anchorY * nextScale,
      });
      onScale(nextScale);
      sudahNavigasi.current = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!sentuhan.current.has(e.pointerId)) return;
      sentuhan.current.delete(e.pointerId);
      if (sentuhan.current.size < 2) gestureAwal.current = null;
      const start = sentuhanTunggal.current;
      if (start?.id === e.pointerId && !start.started && !gestureAwal.current) {
        if (tool === "pilih") onSelect(null);
        else startDrawAt(start.x, start.y, true);
      }
      if (sentuhan.current.size === 0) sentuhanTunggal.current = null;
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("pointerdown", onPointerDown, true);
    wrap.addEventListener("mousedown", preventMiddleAutoScroll);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("pointerdown", onPointerDown, true);
      wrap.removeEventListener("mousedown", preventMiddleAutoScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onScale, onSelect, setPanPosition, startDrawAt, tool]);

  /* Gambar objek baru dengan drag (atau klik untuk ukuran bawaan) */
  const startDraw = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      startDrawAt(e.clientX, e.clientY);
    },
    [startDrawAt]
  );

  /* Geser dan ubah ukuran objek. Klik (tanpa geser) pada persegi yang sudah
     terpilih mengganti mode ukuran <-> sudut. */
  const startDrag = useCallback(
    (e: React.PointerEvent, el: DesignElement, aksi: "move" | Handle) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const sudahDipilih = selectedIds.includes(el.id);
      const shiftSelect = aksi === "move" && e.shiftKey;
      if (shiftSelect) onSelect(el.id, true);
      else if (!sudahDipilih || (aksi === "move" && selectedIds.length > 1)) {
        onSelect(el.id);
      }

      const sx = e.clientX;
      const sy = e.clientY;
      const o = { x: el.x, y: el.y, w: el.w, h: el.h };
      let bergerak = false;

      const onMove = (ev: PointerEvent) => {
        if (!bergerak && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
        bergerak = true;

        const dx = (ev.clientX - sx) / scale;
        const dy = (ev.clientY - sy) / scale;

        if (aksi === "move") {
          onUpdate(el.id, { x: round(o.x + dx), y: round(o.y + dy) });
          return;
        }

        let { x, y, w, h } = o;
        const sudut = aksi === "nw" || aksi === "ne" || aksi === "sw" || aksi === "se";
        if (sudut && ev.shiftKey && el.type !== "line") {
          const perubahanLebar = (aksi.includes("e") ? dx : -dx) / o.w;
          const perubahanTinggi = (aksi.includes("s") ? dy : -dy) / o.h;
          const perubahan = Math.abs(perubahanLebar) >= Math.abs(perubahanTinggi)
            ? perubahanLebar
            : perubahanTinggi;
          const faktorMin = Math.max(MIN_SIZE / o.w, MIN_SIZE / o.h);
          const faktor = Math.max(faktorMin, 1 + perubahan);

          w = o.w * faktor;
          h = o.h * faktor;
          if (aksi.includes("w")) x = o.x + o.w - w;
          if (aksi.includes("n")) y = o.y + o.h - h;
        } else {
          const minDimensi = el.type === "line" ? 0 : MIN_SIZE;
          if (aksi.includes("e")) w = Math.max(minDimensi, o.w + dx);
          if (aksi.includes("w")) {
            w = Math.max(minDimensi, o.w - dx);
            x = o.x + o.w - w;
          }
          if (aksi.includes("s")) h = Math.max(minDimensi, o.h + dy);
          if (aksi.includes("n")) {
            h = Math.max(minDimensi, o.h - dy);
            y = o.y + o.h - h;
          }
        }
        onUpdate(el.id, { x: round(x), y: round(y), w: round(w), h: round(h) });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (!bergerak && !shiftSelect && aksi === "move" && sudahDipilih && el.type === "rect") {
          onToggleMode();
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [scale, selectedIds, onSelect, onUpdate, onToggleMode]
  );

  /* Atur kelengkungan sudut persegi */
  const onRadiusDown = useCallback(
    (e: React.PointerEvent, el: DesignElement) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const sx = e.clientX;
      const awal = el.radius ?? 0;
      const maks = Math.min(el.w, el.h) / 2;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - sx) / scale;
        onUpdate(el.id, { radius: round(clamp(awal - dx, 0, maks)) });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [scale, onUpdate]
  );

  const onDown = useCallback(
    (e: React.PointerEvent, el: DesignElement) => {
      if (tool !== "pilih") {
        startDraw(e);
        return;
      }
      startDrag(e, el, "move");
    },
    [tool, startDraw, startDrag]
  );

  const onHandleDown = useCallback(
    (e: React.PointerEvent, el: DesignElement, h: Handle) =>
      startDrag(e, el, h),
    [startDrag]
  );

  const onText = useCallback(
    (id: string, text: string) => onUpdate(id, { text }),
    [onUpdate]
  );

  const onEditEnd = useCallback(() => onEdit(null), [onEdit]);

  function onWorkspacePointerDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    if (tool === "pilih") {
      onSelect(null);
      return;
    }
    startDraw(e);
  }

  return (
    <div
      ref={wrapRef}
      onPointerDown={onWorkspacePointerDown}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-stone-300"
      style={{ touchAction: "none", cursor: tool === "pilih" ? "default" : "crosshair" }}
    >
      {/* Pasteboard tidak memiliki batas scroll; hanya transform workspace yang berubah. */}
      <div
        ref={workspaceRef}
        onPointerDown={onWorkspacePointerDown}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: pageW,
          height: pageH,
          overflow: "visible",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale / PX_PER_MM})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          className="bg-white"
          aria-label="Drawing page"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: pageW,
            height: pageH,
            boxSizing: "border-box",
            border: "1px solid #a8a29e",
            boxShadow: "4px 4px 0 #bdbdbd",
            pointerEvents: "none",
          }}
        >
          {/* Garis margin 10 mm */}
          <div
            style={{
              position: "absolute",
              inset: 10 * PX_PER_MM,
              border: "1px dashed #d6d3d1",
              pointerEvents: "none",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: pageW,
            height: pageH,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {elements.map((el) => (
            <ElementView
              key={el.id}
              el={el}
              scale={PX_PER_MM}
              selected={selectedIds.includes(el.id)}
              showHandles={el.id === selectedId}
              editing={el.id === editingId}
              textFlow={textFlow[el.id]}
              cursor={tool === "pilih" ? "move" : "crosshair"}
              mode={el.id === selectedId ? mode : "ukuran"}
              onDown={onDown}
              onHandleDown={onHandleDown}
              onRadiusDown={onRadiusDown}
              onEdit={onEdit}
              onText={onText}
              onEditEnd={onEditEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}