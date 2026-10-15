export const PT_TO_MM = 0.3528;
export const PX_PER_MM = 3.7795; // 1 mm = 3,78 px pada zoom 100%
export const MIN_SIZE = 5;
export const PAD = 60; // px, ruang kerja di sekeliling kertas
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 8;

export type Tool = "pilih" | "teks" | "persegi" | "elips" | "garis" | "crop";
export type AlignAction = "C" | "E" | "L" | "R" | "T" | "B" | "P";
export type Handle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";
export type Mode = "ukuran" | "putar" | "sudut";
export type Status = "tersimpan" | "menyimpan" | "belum" | "gagal";

export const LABEL_STATUS: Record<Status, string> = {
  tersimpan: "Tersimpan",
  menyimpan: "Menyimpan...",
  belum: "Belum tersimpan",
  gagal: "Gagal menyimpan",
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const round = (n: number) => Math.round(n * 10) / 10;

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));