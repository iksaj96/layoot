"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { DesignElement } from "@/lib/types";
import type { TextFlowSegment } from "../core/textFlow";
import ElementView from "./ElementView";
import { MAX_SCALE, MIN_SCALE, MIN_SIZE, PAD, clamp, round, uid } from "../core/utils";
import type { Handle, Mode, Tool } from "../core/utils";

type Props = {
  size: { w: number; h: number };
  scale: number;
  elements: DesignElement[];
  textFlow: Record<string, TextFlowSegment>;
  selectedId: string | null;
  editingId: string | null;
  tool: Tool;
  mode: Mode;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<DesignElement>) => void;
  onCreate: (el: DesignElement) => void;
  onToolDone: () => void;
  onEdit: (id: string | null) => void;
  onToggleMode: () => void;
  onScale: (s: number) => void;
};

type Jangkar = { mmX: number; mmY: number; cx: number; cy: number };

export default function Canvas({
  size,
  scale,
  elements,
  textFlow,
  selectedId,
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
  const pageRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const jangkar = useRef<Jangkar | null>(null);
  const pageW = size.w * scale;
  const pageH = size.h * scale;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  /* Setelah zoom, jaga titik di bawah kursor tetap di tempatnya */
  useLayoutEffect(() => {
    const j = jangkar.current;
    const wrap = wrapRef.current;
    const page = pageRef.current;
    if (!j || !wrap || !page) return;
    jangkar.current = null;
    const r = page.getBoundingClientRect();
    wrap.scrollLeft += r.left + j.mmX * scale - j.cx;
    wrap.scrollTop += r.top + j.mmY * scale - j.cy;
  }, [scale]);

  /* Zoom dengan scroll, geser dengan klik roda tengah */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const page = pageRef.current;
      if (!page) return;
      const s = scaleRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      const next = clamp(
        Math.round(s * Math.exp(-delta * 0.0015) * 1000) / 1000,
        MIN_SCALE,
        MAX_SCALE
      );
      if (next === s) return;
      const r = page.getBoundingClientRect();
      jangkar.current = {
        mmX: (e.clientX - r.left) / s,
        mmY: (e.clientY - r.top) / s,
        cx: e.clientX,
        cy: e.clientY,
      };
      onScale(next);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      e.stopPropagation();

      const sx = e.clientX;
      const sy = e.clientY;
      const sl = wrap.scrollLeft;
      const st = wrap.scrollTop;

      const lapis = document.createElement("div");
      lapis.style.cssText = "position:fixed;inset:0;z-index:60;cursor:grabbing";
      document.body.appendChild(lapis);

      const move = (ev: PointerEvent) => {
        wrap.scrollLeft = sl - (ev.clientX - sx);
        wrap.scrollTop = st - (ev.clientY - sy);
      };
      const up = () => {
        lapis.remove();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };

    // Cegah mode autoscroll bawaan browser pada klik roda tengah
    const cegahAutoscroll = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("pointerdown", onPointerDown, true);
    wrap.addEventListener("mousedown", cegahAutoscroll);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("pointerdown", onPointerDown, true);
      wrap.removeEventListener("mousedown", cegahAutoscroll);
    };
  }, [onScale]);

  /* Gambar objek baru dengan drag (atau klik untuk ukuran bawaan) */
  const startDraw = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const page = pageRef.current;
      if (!page) return;
      e.stopPropagation();

      const rect = page.getBoundingClientRect();
      const sx = round((e.clientX - rect.left) / scale);
      const sy = round((e.clientY - rect.top) / scale);
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
          ? { id, type: "rect", x: sx, y: sy, w: 60, h: 40, fill: "#4f46e5" }
          : { id, type: "ellipse", x: sx, y: sy, w: 50, h: 50, fill: "#f59e0b" };

      onCreate(baru);

      let digeser = false;

      const onMove = (ev: PointerEvent) => {
        const cx = (ev.clientX - rect.left) / scale;
        const cy = (ev.clientY - rect.top) / scale;
        if (!digeser && Math.hypot(cx - sx, cy - sy) < 3) return;
        digeser = true;
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
    [tool, scale, onCreate, onUpdate, onToolDone, onEdit]
  );

  /* Geser dan ubah ukuran objek. Klik (tanpa geser) pada persegi yang sudah
     terpilih mengganti mode ukuran <-> sudut. */
  const startDrag = useCallback(
    (e: React.PointerEvent, el: DesignElement, aksi: "move" | Handle) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const sudahDipilih = selectedId === el.id;
      if (!sudahDipilih) onSelect(el.id);

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
        if (sudut && ev.shiftKey) {
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
          if (aksi.includes("e")) w = Math.max(MIN_SIZE, o.w + dx);
          if (aksi.includes("w")) {
            w = Math.max(MIN_SIZE, o.w - dx);
            x = o.x + o.w - w;
          }
          if (aksi.includes("s")) h = Math.max(MIN_SIZE, o.h + dy);
          if (aksi.includes("n")) {
            h = Math.max(MIN_SIZE, o.h - dy);
            y = o.y + o.h - h;
          }
        }
        onUpdate(el.id, { x: round(x), y: round(y), w: round(w), h: round(h) });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (!bergerak && aksi === "move" && sudahDipilih && el.type === "rect") {
          onToggleMode();
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [scale, selectedId, onSelect, onUpdate, onToggleMode]
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

  function onPagePointerDown(e: React.PointerEvent) {
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
      className="min-h-0 min-w-0 flex-1 overflow-auto bg-stone-300"
    >
      {/* Ruang kerja: kertas selalu di tengah bila muat, bisa digulir bila besar */}
      <div
        onPointerDown={(e) => {
          if (e.target === e.currentTarget && e.button === 0 && tool === "pilih") {
            onSelect(null);
          }
        }}
        style={{
          display: "flex",
          width: "max-content",
          minWidth: "100%",
          minHeight: "100%",
          padding: PAD,
        }}
      >
        <div
          ref={pageRef}
          onPointerDown={onPagePointerDown}
          className="bg-white"
          style={{
            position: "relative",
            flexShrink: 0,
            margin: "auto",
            width: pageW,
            height: pageH,
            outline: "1px solid #78716c",
            cursor: tool === "pilih" ? "default" : "crosshair",
            touchAction: tool === "pilih" ? "auto" : "none",
          }}
        >
          {/* Garis margin 10 mm */}
          <div
            style={{
              position: "absolute",
              inset: 10 * scale,
              border: "1px dashed #d6d3d1",
              pointerEvents: "none",
            }}
          />
          {elements.map((el) => (
            <ElementView
              key={el.id}
              el={el}
              scale={scale}
              selected={el.id === selectedId}
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