"use client";

import { useEffect } from "react";

const GRUP: { judul: string; isi: [string, string][] }[] = [
  {
    judul: "Umum",
    isi: [
      ["Ctrl + S", "Simpan sekarang"],
      ["Ctrl + Z", "Urungkan"],
      ["Ctrl + Shift + Z / Ctrl + Y", "Ulangi"],
      ["? atau F1", "Buka/tutup bantuan ini"],
    ],
  },
  {
    judul: "Alat",
    isi: [
      ["V", "Alat pilih"],
      ["T", "Alat teks"],
      ["R", "Alat persegi"],
      ["E", "Alat elips"],
      ["Esc", "Batal / kembali ke alat pilih"],
    ],
  },
  {
    judul: "Objek",
    isi: [
      ["Ctrl + C / X / V", "Salin / potong / tempel"],
      ["Ctrl + D", "Duplikat"],
      ["Delete / Backspace", "Hapus"],
      ["Tab / Shift + Tab", "Pilih objek berikutnya / sebelumnya"],
      ["Enter", "Edit teks terpilih"],
      ["Panah", "Geser 1 mm (Shift: 10 mm)"],
      ["Klik persegi terpilih", "Ganti mode ukuran ↔ sudut"],
    ],
  },
  {
    judul: "Lapisan",
    isi: [
      ["Ctrl + ]", "Naik satu lapisan"],
      ["Ctrl + [", "Turun satu lapisan"],
      ["Shift + PageUp", "Ke paling atas"],
      ["Shift + PageDown", "Ke paling bawah"],
      ["Alt + PageUp / PageDown", "Naik / turun satu lapisan"],
    ],
  },
  {
    judul: "Teks",
    isi: [
      ["Ctrl + B", "Tebal"],
      ["Ctrl + I", "Miring"],
      ["Ctrl + U", "Garis bawah"],
    ],
  },
  {
    judul: "Tampilan",
    isi: [
      ["Scroll", "Zoom ke arah kursor"],
      ["Klik roda tengah + geser", "Geser tampilan"],
      ["Ctrl + = / Ctrl + -", "Perbesar / perkecil"],
      ["Ctrl + 0", "Muat ke layar"],
    ],
  },
];

export default function ShortcutHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?" || e.key === "F1") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Pintasan keyboard"
        className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">Pintasan keyboard</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200"
          >
            Tutup
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {GRUP.map((g) => (
            <section key={g.judul}>
              <h3 className="mb-1 text-xs font-bold uppercase text-stone-500">
                {g.judul}
              </h3>
              <ul className="space-y-1">
                {g.isi.map(([tombol, arti]) => (
                  <li key={tombol} className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-stone-700">{arti}</span>
                    <kbd className="shrink-0 rounded border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-800">
                      {tombol}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-4 text-xs text-stone-500">
          Ctrl + PageUp/PageDown dipakai Chrome untuk pindah tab dan tidak bisa
          diambil alih situs, jadi gunakan Ctrl + ] dan Ctrl + [ untuk naik/turun
          satu lapisan.
        </p>
      </div>
    </div>
  );
}