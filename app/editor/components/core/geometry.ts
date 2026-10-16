import type { DesignElement } from "@/lib/types";

export type Bounds = { left: number; top: number; right: number; bottom: number };

export function elementBounds(el: DesignElement): Bounds {
  const centerX = el.x + el.w / 2;
  const centerY = el.y + el.h / 2;
  const radians = ((el.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const linePad = el.type === "line" ? (el.strokeWidth ?? 0.5) : 0;
  const width = Math.max(el.w, linePad) * cos + Math.max(el.h, linePad) * sin;
  const height = Math.max(el.w, linePad) * sin + Math.max(el.h, linePad) * cos;

  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    right: centerX + width / 2,
    bottom: centerY + height / 2,
  };
}

export function selectionBounds(elements: DesignElement[]): Bounds | null {
  if (elements.length === 0) return null;
  const bounds = elements.map(elementBounds);
  return {
    left: Math.min(...bounds.map((box) => box.left)),
    top: Math.min(...bounds.map((box) => box.top)),
    right: Math.max(...bounds.map((box) => box.right)),
    bottom: Math.max(...bounds.map((box) => box.bottom)),
  };
}
