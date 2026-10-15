"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { LayerOp } from "../core/elementOps";
import type { AlignAction, Tool } from "../core/utils";
import { SHORTCUTS } from "../core/shortcuts";

export type AksiPintasan = {
  tool: (t: Tool) => void;
  align: (action: AlignAction) => void;
  undo: () => void;
  redo: () => void;
  copy: () => void;
  cut: () => void;
  paste: () => void;
  duplicate: () => void;
  remove: () => void;
  layer: (op: LayerOp) => void;
  nudge: (dx: number, dy: number) => void;
  cycle: (arah: 1 | -1) => void;
  deselect: () => void;
  edit: () => void;
  style: (k: "bold" | "italic" | "underline") => void;
  zoom: (faktor: number) => void;
  fit: () => void;
  save: () => void;
  help: () => void;
};

export function useShortcuts(aksi: AksiPintasan, aktif = true) {
  const ref = useRef(aksi);
  useLayoutEffect(() => {
    ref.current = aksi;
  });

  useEffect(() => {
    if (!aktif) return;

    function onKey(e: KeyboardEvent) {
      const a = ref.current;
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const t = e.target as HTMLElement | null;
      const diInput = !!t?.closest("input, textarea, select") || !!t?.isContentEditable;

      if (e.repeat && !e.key.startsWith("Arrow")) return;

      // Ctrl+S berlaku di mana pun, termasuk saat mengetik judul
      if (ctrl && k === "s") {
        e.preventDefault();
        e.stopPropagation();
        a.save();
        return;
      }

      // Jangan ganggu pengetikan di kolom input
      if (diInput) return;
      const diTombol = !!t?.closest("button, a");

      const jalankan = (fn: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      };

      if (ctrl) {
        if (e.code === "BracketRight") jalankan(() => a.layer(e.shiftKey ? "atas" : "naik"));
        else if (e.code === "BracketLeft") jalankan(() => a.layer(e.shiftKey ? "bawah" : "turun"));
        else if (e.code === "PageUp") jalankan(() => a.layer("naik"));
        else if (e.code === "PageDown") jalankan(() => a.layer("turun"));
        else if (k === "z") jalankan(e.shiftKey ? a.redo : a.undo);
        else if (k === "y") jalankan(a.redo);
        else if (k === "c") jalankan(a.copy);
        else if (k === "x") jalankan(a.cut);
        else if (k === "v") jalankan(a.paste);
        else if (k === "d") jalankan(a.duplicate);
        else if (k === "b") jalankan(() => a.style("bold"));
        else if (k === "i") jalankan(() => a.style("italic"));
        else if (k === "u") jalankan(() => a.style("underline"));
        else if (k === "0") jalankan(a.fit);
        else if (k === "=" || k === "+") jalankan(() => a.zoom(1.25));
        else if (k === "-") jalankan(() => a.zoom(1 / 1.25));
        return;
      }

      if (e.altKey) {
        if (e.code === "PageUp") jalankan(() => a.layer("naik"));
        else if (e.code === "PageDown") jalankan(() => a.layer("turun"));
        return;
      }

      if (!e.shiftKey) {
        const shortcut = SHORTCUTS.find(
          (item) => item.category === "Align" && item.key.toLowerCase() === k
        );
        if (shortcut?.action) {
          const action = shortcut.action;
          return jalankan(() => a.align(action));
        }
      }

      if (e.key === "?" && e.shiftKey) return jalankan(a.help);
      if (e.shiftKey && e.code === "PageUp") return jalankan(() => a.layer("atas"));
      if (e.shiftKey && e.code === "PageDown") return jalankan(() => a.layer("bawah"));

      const langkah = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case "Delete":
        case "Backspace":
          return jalankan(a.remove);
        case "Escape":
          return a.deselect();
        case "Enter":
          if (diTombol) return;
          return jalankan(a.edit);
        case "Tab":
          if (diTombol) return;
          return jalankan(() => a.cycle(e.shiftKey ? -1 : 1));
        case "F1":
          return jalankan(a.help);
        case "ArrowLeft":
          return jalankan(() => a.nudge(-langkah, 0));
        case "ArrowRight":
          return jalankan(() => a.nudge(langkah, 0));
        case "ArrowUp":
          return jalankan(() => a.nudge(0, -langkah));
        case "ArrowDown":
          return jalankan(() => a.nudge(0, langkah));
      }

      if (e.shiftKey) {
        if (k === "t") return jalankan(() => a.tool("teks"));
        else if (k === "r") return jalankan(() => a.tool("persegi"));
        else if (k === "e") return jalankan(() => a.tool("elips"));
        else if (k === "l") return jalankan(() => a.tool("garis"));
        else if (k === "x") return jalankan(() => a.tool("crop"));
        return;
      }
      if (k === "v") jalankan(() => a.tool("pilih"));
    }

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [aktif]);
}