import type { DesignElement, DesignPage } from "@/lib/types";
import { round, uid } from "./utils";

export type LayerOp = "naik" | "turun" | "atas" | "bawah";

/** Urutan array = urutan lapisan (elemen terakhir ada paling atas). */
export function moveLayer(
  els: DesignElement[],
  id: string,
  op: LayerOp
): DesignElement[] {
  const idx = els.findIndex((e) => e.id === id);
  if (idx < 0) return els;

  const tujuan =
    op === "naik"
      ? idx + 1
      : op === "turun"
      ? idx - 1
      : op === "atas"
      ? els.length - 1
      : 0;
  const akhir = Math.max(0, Math.min(els.length - 1, tujuan));
  if (akhir === idx) return els;

  const salinan = [...els];
  const [item] = salinan.splice(idx, 1);
  salinan.splice(akhir, 0, item);
  return salinan;
}

export function cloneElement(el: DesignElement, geser = 5): DesignElement {
  return {
    ...el,
    id: uid(),
    x: round(el.x + geser),
    y: round(el.y + geser),
    nextTextBoxId: undefined,
  };
}

/** Ubah daftar elemen satu halaman; jika tidak ada perubahan, objek lama dikembalikan. */
export function ubahElemen(
  pages: DesignPage[],
  index: number,
  fn: (els: DesignElement[]) => DesignElement[]
): DesignPage[] {
  const p = pages[index];
  if (!p) return pages;
  const els = fn(p.elements);
  if (els === p.elements) return pages;
  return pages.map((x, i) => (i === index ? { ...x, elements: els } : x));
}

/** Radius sudut (mm) yang valid untuk persegi dan gambar. */
export function radiusOf(el: DesignElement): number {
  if (el.type !== "rect" && el.type !== "image") return 0;
  return Math.max(0, Math.min(el.radius ?? 0, Math.min(el.w, el.h) / 2));
}

/** Nilai CSS border-radius untuk layar (px) maupun cetak (mm). */
export function borderRadiusCss(
  el: DesignElement,
  satuan: (mm: number) => string
): string | undefined {
  if (el.type === "ellipse") return "50%";
  if ((el.type === "rect" || el.type === "image") && el.radius) {
    return satuan(radiusOf(el));
  }
  return undefined;
}