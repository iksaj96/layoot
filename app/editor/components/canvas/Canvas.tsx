"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_FONT_SIZE } from "@/lib/types";
import type { DesignElement } from "@/lib/types";
import type { TextFlowSegment } from "../core/textFlow";
import ElementView from "./ElementView";
import { MAX_SCALE, MIN_SCALE, MIN_SIZE, PX_PER_MM, PT_TO_MM, clamp, round, uid } from "../core/utils";
import type { Handle, Mode, Tool } from "../core/utils";
import { measureTextWidthMm } from "../core/textMetrics";

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
  onDropImage: (file: File, x: number, y: number) => void;
  onActivate: (id: string, clickCount: number, canCycleMode: boolean) => void;
  onCycleMode: (id: string) => void;
  onEdit: (id: string | null) => void;
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
  onDropImage,
  onActivate,
  onCycleMode: onCycleModeChange,
  onEdit,
  onScale,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cropPreview, setCropPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
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

  const titikHalaman = useCallback((clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const bounds = wrap.getBoundingClientRect();
    return {
      x: (clientX - bounds.left - panRef.current.x) / scaleRef.current,
      y: (clientY - bounds.top - panRef.current.y) / scaleRef.current,
    };
  }, []);

  const startCrop = useCallback(
    (e: React.PointerEvent, el: DesignElement) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      onSelect(el.id);
      const start = titikHalaman(e.clientX, e.clientY);
      setCropPreview({ x: start.x, y: start.y, w: 0, h: 0 });
      let current = start;
      let previewFrame = 0;
      let previewTerbaru = { x: start.x, y: start.y, w: 0, h: 0 };

      const onMove = (event: PointerEvent) => {
        if (event.pointerId !== e.pointerId) return;
        current = titikHalaman(event.clientX, event.clientY);
        previewTerbaru = {
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          w: Math.abs(current.x - start.x),
          h: Math.abs(current.y - start.y),
        };
        if (!previewFrame) {
          previewFrame = requestAnimationFrame(() => {
            setCropPreview(previewTerbaru);
            previewFrame = 0;
          });
        }
      };
      function bersihkan() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        cancelAnimationFrame(previewFrame);
        setCropPreview(null);
      }
      function onUp(event: PointerEvent) {
        if (event.pointerId !== e.pointerId) return;
        bersihkan();

        const dragged = {
          left: Math.min(start.x, current.x),
          top: Math.min(start.y, current.y),
          right: Math.max(start.x, current.x),
          bottom: Math.max(start.y, current.y),
        };
        const linePadding =
          el.type === "line" ? Math.max((el.strokeWidth ?? 0.5) / 2, 0.5) : 0;
        const box = {
          left: Math.max(el.x - linePadding, dragged.left),
          top: Math.max(el.y - linePadding, dragged.top),
          right: Math.min(el.x + Math.max(el.w, 1) + linePadding, dragged.right),
          bottom: Math.min(el.y + Math.max(el.h, 1) + linePadding, dragged.bottom),
        };
        const cropW = box.right - box.left;
        const cropH = box.bottom - box.top;
        if (
          el.type === "line"
            ? cropW <= 0 || cropH <= 0
            : cropW < 1 || cropH < 1
        ) return;

        if (el.type === "line") {
          const dx = el.w;
          const dy = el.h;
          let x0 = el.lineFlip ? dx : 0;
          let y0 = 0;
          let x1 = el.lineFlip ? 0 : dx;
          let y1 = dy;
          const minX = box.left - el.x;
          const minY = box.top - el.y;
          const maxX = box.right - el.x;
          const maxY = box.bottom - el.y;
          const vx = x1 - x0;
          const vy = y1 - y0;
          let t0 = 0;
          let t1 = 1;
          const clip = (p: number, q: number) => {
            if (p === 0) return q >= 0;
            const ratio = q / p;
            if (p < 0) t0 = Math.max(t0, ratio);
            else t1 = Math.min(t1, ratio);
            return t0 <= t1;
          };
          if (
            !clip(-vx, x0 - minX) ||
            !clip(vx, maxX - x0) ||
            !clip(-vy, y0 - minY) ||
            !clip(vy, maxY - y0)
          ) return;
          const startX = x0 + t0 * vx;
          const startY = y0 + t0 * vy;
          const endX = x0 + t1 * vx;
          const endY = y0 + t1 * vy;
          x0 = Math.min(startX, endX);
          y0 = Math.min(startY, endY);
          x1 = Math.max(startX, endX);
          y1 = Math.max(startY, endY);
          if (Math.hypot(x1 - x0, y1 - y0) < 1) return;
          onUpdate(el.id, {
            x: round(el.x + x0),
            y: round(el.y + y0),
            w: round(x1 - x0),
            h: round(y1 - y0),
            lineFlip: (startX - endX) * (startY - endY) < 0,
            crop: undefined,
          });
          return;
        }

        const crop = el.crop ?? { x: 0, y: 0, w: 1, h: 1 };
        const left = (box.left - el.x) / el.w;
        const top = (box.top - el.y) / el.h;
        const width = cropW / el.w;
        const height = cropH / el.h;
        onUpdate(el.id, {
          x: round(box.left),
          y: round(box.top),
          w: round(cropW),
          h: round(cropH),
          crop: {
            x: crop.x + left * crop.w,
            y: crop.y + top * crop.h,
            w: width * crop.w,
            h: height * crop.h,
          },
        });
      }
      function onCancel(event: PointerEvent) {
        if (event.pointerId !== e.pointerId) return;
        bersihkan();
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    },
    [onSelect, onUpdate, titikHalaman]
  );

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
    (
      clientX: number,
      clientY: number,
      complete = false,
      firstMove?: {
        x: number;
        y: number;
        ctrlKey: boolean;
        metaKey: boolean;
        shiftKey: boolean;
      }
    ) => {
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
              textKind: "artistic",
              fontSize: DEFAULT_FONT_SIZE,
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

      if (baru.type === "text") {
        baru.w = measureTextWidthMm(baru, baru.text ?? "");
        baru.h = DEFAULT_FONT_SIZE * PT_TO_MM * 1.3;
      }
      onCreate(baru);
      if (complete) {
        onToolDone();
        if (baru.type === "text") onEdit(id);
        return;
      }
      let digeser = false;
      let pointerX = firstMove?.x ?? clientX;
      let pointerY = firstMove?.y ?? clientY;
      let ctrl = !!(firstMove?.ctrlKey || firstMove?.metaKey);
      let shift = !!firstMove?.shiftKey;

      const perbaruiGambar = () => {
        const bounds = wrap.getBoundingClientRect();
        const currentScale = scaleRef.current;
        const cx = (pointerX - bounds.left - panRef.current.x) / currentScale;
        const cy = (pointerY - bounds.top - panRef.current.y) / currentScale;
        if (!digeser && Math.hypot(pointerX - clientX, pointerY - clientY) < 4) return;
        digeser = true;
        if (baru.type === "text") {
          onUpdate(id, {
            x: round(Math.min(sx, cx)),
            y: round(Math.min(sy, cy)),
            w: round(Math.max(MIN_SIZE, Math.abs(cx - sx))),
            h: round(Math.max(MIN_SIZE, Math.abs(cy - sy))),
            textKind: "paragraph",
            textAutoHeight: true,
          });
          return;
        }

        let dx = cx - sx;
        let dy = cy - sy;
        const proporsiTerkunci = ctrl;
        if (proporsiTerkunci) {
          const ukuran = Math.max(
            Math.abs(dx),
            Math.abs(dy),
            shift ? MIN_SIZE / 2 : MIN_SIZE
          );
          dx = Math.sign(dx || 1) * ukuran;
          dy = Math.sign(dy || 1) * ukuran;
        }

        if (baru.type === "line") {
          if (shift) {
            const akhirX = sx + dx;
            const akhirY = sy + dy;
            const awalX = sx - dx;
            const awalY = sy - dy;
            onUpdate(id, {
              x: round(Math.min(awalX, akhirX)),
              y: round(Math.min(awalY, akhirY)),
              w: round(Math.abs(akhirX - awalX)),
              h: round(Math.abs(akhirY - awalY)),
              lineFlip: (akhirX - awalX) * (akhirY - awalY) < 0,
            });
            return;
          }
          onUpdate(id, {
            x: round(Math.min(sx, cx)),
            y: round(Math.min(sy, cy)),
            w: round(Math.abs(dx)),
            h: round(Math.abs(dy)),
            lineFlip: dx * dy < 0,
          });
          return;
        }

        const tengah = shift;
        const lebar = tengah ? Math.max(MIN_SIZE, Math.abs(dx) * 2) : Math.max(MIN_SIZE, Math.abs(dx));
        const tinggi = tengah ? Math.max(MIN_SIZE, Math.abs(dy) * 2) : Math.max(MIN_SIZE, Math.abs(dy));
        onUpdate(id, {
          x: round(tengah ? sx - lebar / 2 : Math.min(sx, cx)),
          y: round(tengah ? sy - tinggi / 2 : Math.min(sy, cy)),
          w: round(lebar),
          h: round(tinggi),
        });
      };

      const onMove = (ev: PointerEvent) => {
        pointerX = ev.clientX;
        pointerY = ev.clientY;
        ctrl = ev.ctrlKey || ev.metaKey;
        shift = ev.shiftKey;
        perbaruiGambar();
      };
      const onKeyChange = (ev: KeyboardEvent) => {
        ctrl = ev.ctrlKey || ev.metaKey;
        shift = ev.shiftKey;
        perbaruiGambar();
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("keydown", onKeyChange);
        window.removeEventListener("keyup", onKeyChange);
        onToolDone();
        if (baru.type === "text") onEdit(id);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("keydown", onKeyChange);
      window.addEventListener("keyup", onKeyChange);
      if (firstMove) perbaruiGambar();
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
        workspaceRef.current?.focus({ preventScroll: true });
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
      workspaceRef.current?.focus({ preventScroll: true });
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
          Math.hypot(e.clientX - start.x, e.clientY - start.y) >= (tool === "teks" ? 4 : 5) &&
          tool !== "pilih" && tool !== "crop") {
        start.started = true;
        sudahNavigasi.current = true;
        startDrawAt(start.x, start.y, false, e);
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
        else if (tool !== "crop") startDrawAt(start.x, start.y, true);
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
      workspaceRef.current?.focus({ preventScroll: true });
      startDrawAt(e.clientX, e.clientY);
    },
    [startDrawAt]
  );

  /* Geser dan ubah ukuran objek. */
  const startDrag = useCallback(
    (e: React.PointerEvent, el: DesignElement, aksi: "move" | Handle) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      workspaceRef.current?.focus({ preventScroll: true });

      const sudahDipilih = selectedIds.includes(el.id);
      const shiftSelect = aksi === "move" && e.shiftKey;
      if (!shiftSelect && (!sudahDipilih || (aksi === "move" && selectedIds.length > 1))) {
        onSelect(el.id);
      }

      e.currentTarget.setPointerCapture(e.pointerId);
      const sx = e.clientX;
      const sy = e.clientY;
      const o = { x: el.x, y: el.y, w: el.w, h: el.h };
      let bergerak = false;
      let arahTerkunci: "x" | "y" | null = null;

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        if (!bergerak && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
        bergerak = true;

        if (shiftSelect && !sudahDipilih) onSelect(el.id, true);
        let dx = (ev.clientX - sx) / scale;
        let dy = (ev.clientY - sy) / scale;

        if (aksi === "move") {
          const dikunci = ev.shiftKey || ev.ctrlKey || ev.metaKey;
          if (dikunci) {
            arahTerkunci ??= Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
            if (arahTerkunci === "x") dy = 0;
            else dx = 0;
          } else {
            arahTerkunci = null;
          }
          onUpdate(el.id, { x: round(o.x + dx), y: round(o.y + dy) });
          return;
        }

        let { x, y, w, h } = o;
        const sudut = aksi === "nw" || aksi === "ne" || aksi === "sw" || aksi === "se";
        if (
          sudut &&
          el.type === "text" &&
          (el.textKind ?? "paragraph") === "artistic"
        ) {
          const perubahanLebar = (aksi.includes("e") ? dx : -dx) / o.w;
          const perubahanTinggi = (aksi.includes("s") ? dy : -dy) / o.h;
          const perubahan = Math.abs(perubahanLebar) >= Math.abs(perubahanTinggi)
            ? perubahanLebar
            : perubahanTinggi;
          const fontSize = el.fontSize ?? DEFAULT_FONT_SIZE;
          const faktor = Math.max(4 / fontSize, 1 + perubahan);
          w = o.w * faktor;
          h = o.h * faktor;
          if (aksi.includes("w")) x = o.x + o.w - w;
          if (aksi.includes("n")) y = o.y + o.h - h;
          onUpdate(el.id, {
            x: round(x),
            y: round(y),
            w: round(w),
            h: round(h),
            fontSize: round(fontSize * faktor),
          });
          return;
        }
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
        const ubahTinggi = aksi.includes("n") || aksi.includes("s");
        onUpdate(el.id, {
          x: round(x),
          y: round(y),
          w: round(w),
          h: ubahTinggi ? round(h) : o.h,
          ...(ubahTinggi &&
          el.type === "text" &&
          (el.textKind ?? "paragraph") === "paragraph"
            ? { textAutoHeight: false }
            : {}),
        });
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (shiftSelect && !bergerak) onSelect(el.id, true);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [scale, selectedIds, onSelect, onUpdate]
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

  const onRotateDown = useCallback(
    (e: React.PointerEvent, el: DesignElement) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const wrap = wrapRef.current;
      if (!wrap) return;
      const bounds = wrap.getBoundingClientRect();
      const centerX =
        bounds.left + panRef.current.x + (el.x + el.w / 2) * scaleRef.current;
      const centerY =
        bounds.top + panRef.current.y + (el.y + el.h / 2) * scaleRef.current;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const initialRotation = el.rotation ?? 0;

      const onMove = (event: PointerEvent) => {
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
        const delta = ((angle - startAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const rotation = initialRotation + (delta * 180) / Math.PI;
        onUpdate(el.id, {
          rotation: round(((rotation + 180) % 360 + 360) % 360 - 180),
        });
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
    [onUpdate]
  );

  const onDown = useCallback(
    (e: React.PointerEvent, el: DesignElement) => {
      if (tool === "crop") {
        startCrop(e, el);
        return;
      }
      if (tool !== "pilih") {
        startDraw(e);
        return;
      }
      startDrag(e, el, "move");
    },
    [tool, startDraw, startDrag, startCrop]
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
  const cycleMode = useCallback(
    (id: string) => {
      onCycleModeChange(id);
      workspaceRef.current?.focus({ preventScroll: true });
    },
    [onCycleModeChange]
  );

  function onWorkspacePointerDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    workspaceRef.current?.focus({ preventScroll: true });
    if (tool === "pilih") {
      onSelect(null);
      return;
    }
    if (tool === "crop") {
      const activeElement = elements.find((el) => selectedIds.includes(el.id));
      if (activeElement) startCrop(e, activeElement);
      return;
    }
    startDraw(e);
  }

  function onDragOver(e: React.DragEvent) {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function onDrop(e: React.DragEvent) {
    const file = Array.from(e.dataTransfer.files).find((item) =>
      item.type.startsWith("image/")
    );
    if (!file) return;

    e.preventDefault();
    const bounds = wrapRef.current?.getBoundingClientRect();
    if (!bounds) return;
    onDropImage(
      file,
      round((e.clientX - bounds.left - panRef.current.x) / scaleRef.current),
      round((e.clientY - bounds.top - panRef.current.y) / scaleRef.current)
    );
  }

  return (
    <div
      ref={wrapRef}
      onPointerDown={onWorkspacePointerDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-stone-300"
      style={{ touchAction: "none", cursor: tool === "pilih" ? "default" : "crosshair" }}
    >
      {/* Pasteboard tidak memiliki batas scroll; hanya transform workspace yang berubah. */}
      <div
        ref={workspaceRef}
        tabIndex={-1}
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
              showModeHandle={
                selectedIds.length === 1 &&
                el.id === selectedId &&
                tool === "pilih" &&
                editingId === null
              }
              editing={el.id === editingId}
              textFlow={textFlow[el.id]}
              cursor={tool === "pilih" ? "move" : "crosshair"}
              mode={el.id === selectedId ? mode : "ukuran"}
              handleScale={PX_PER_MM / scale}
              canCycleMode={selectedIds.length === 1 && tool === "pilih"}
              onDown={onDown}
              onHandleDown={onHandleDown}
              onRadiusDown={onRadiusDown}
              onRotateDown={onRotateDown}
              onActivate={onActivate}
              onCycleMode={cycleMode}
              onText={onText}
              onEditEnd={onEditEnd}
            />
          ))}
          {cropPreview && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-dashed border-indigo-600 bg-indigo-400/20"
              style={{
                left: cropPreview.x * PX_PER_MM,
                top: cropPreview.y * PX_PER_MM,
                width: cropPreview.w * PX_PER_MM,
                height: cropPreview.h * PX_PER_MM,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}