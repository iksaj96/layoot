import type { AlignAction } from "./utils";

export type ShortcutCategory =
  | "Align"
  | "Navigasi"
  | "Bantuan"
  | "Umum"
  | "Alat"
  | "Objek"
  | "Lapisan"
  | "Teks"
  | "Tampilan";

export type Shortcut = {
  key: string;
  label: string;
  description: string;
  category: ShortcutCategory;
  action?: AlignAction;
};

export const SHORTCUTS: Shortcut[] = [
  { key: "C", action: "C", label: "Rata tengah vertikal", description: "Sejajarkan pusat kiri-kanan semua object pada garis tengah bounding box gabungan.", category: "Align" },
  { key: "E", action: "E", label: "Rata tengah horizontal", description: "Sejajarkan pusat atas-bawah semua object pada garis tengah bounding box gabungan.", category: "Align" },
  { key: "L", action: "L", label: "Rata kiri", description: "Sejajarkan tepi kiri semua object terpilih.", category: "Align" },
  { key: "R", action: "R", label: "Rata kanan", description: "Sejajarkan tepi kanan semua object terpilih.", category: "Align" },
  { key: "T", action: "T", label: "Rata atas", description: "Sejajarkan tepi atas semua object terpilih.", category: "Align" },
  { key: "B", action: "B", label: "Rata bawah", description: "Sejajarkan tepi bawah semua object terpilih.", category: "Align" },
  { key: "P", action: "P", label: "Pusatkan ke drawing page", description: "Pusatkan object terpilih ke tengah drawing page.", category: "Align" },
  { key: "Scroll mouse", label: "Zoom in/out", description: "Perbesar atau perkecil tampilan dengan titik zoom di posisi kursor.", category: "Navigasi" },
  { key: "Drag klik tengah", label: "Geser (pan)", description: "Geser workspace bebas ke segala arah.", category: "Navigasi" },
  { key: "?", label: "Buka katalog shortcut", description: "Buka Pintasan Keyboard (Shift + /).", category: "Bantuan" },
  { key: "F1", label: "Buka katalog shortcut", description: "Buka Pintasan Keyboard.", category: "Bantuan" },
  { key: "V", label: "Alat pilih", description: "Pilih dan edit object.", category: "Alat" },
  { key: "Shift + T", label: "Alat teks", description: "Aktifkan alat teks.", category: "Alat" },
  { key: "Shift + R", label: "Alat persegi", description: "Aktifkan alat persegi.", category: "Alat" },
  { key: "Shift + E", label: "Alat elips", description: "Aktifkan alat elips.", category: "Alat" },
  { key: "Shift + L", label: "Alat garis", description: "Aktifkan alat garis.", category: "Alat" },
  { key: "Shift + X", label: "Alat crop", description: "Pangkas bagian objek terpilih dengan menyeret area crop.", category: "Alat" },
  { key: "Esc", label: "Batal / pilih", description: "Batalkan alat aktif atau hapus pilihan.", category: "Alat" },
  { key: "Ctrl + S", label: "Simpan sekarang", description: "Simpan desain.", category: "Umum" },
  { key: "Ctrl + Z", label: "Urungkan", description: "Batalkan aksi terakhir.", category: "Umum" },
  { key: "Ctrl + Shift + Z / Ctrl + Y", label: "Ulangi", description: "Ulangi aksi yang dibatalkan.", category: "Umum" },
  { key: "Ctrl + C / X / V", label: "Salin / potong / tempel", description: "Salin, potong, atau tempel object terpilih.", category: "Objek" },
  { key: "Ctrl + D", label: "Duplikat", description: "Buat salinan object terpilih.", category: "Objek" },
  { key: "Delete / Backspace", label: "Hapus", description: "Hapus object terpilih.", category: "Objek" },
  { key: "Tab / Shift + Tab", label: "Pilih object berikutnya/sebelumnya", description: "Pindah pilihan ke object lain.", category: "Objek" },
  { key: "Enter", label: "Edit teks", description: "Edit teks pada object terpilih.", category: "Objek" },
  { key: "Panah / Shift + Panah", label: "Geser object", description: "Geser 1 mm; tahan Shift untuk menggeser 10 mm.", category: "Objek" },
  { key: "Klik 2x / 3x", label: "Putar/balik / atur sudut", description: "Klik objek dua kali untuk membuka mode putar dan balik; klik tiga kali pada persegi untuk mengatur sudut.", category: "Objek" },
  { key: "Ctrl + ] / Ctrl + [", label: "Naik/turun satu lapisan", description: "Ubah urutan lapisan object.", category: "Lapisan" },
  { key: "Ctrl + PageUp / PageDown", label: "Naik/turun satu lapisan", description: "Ubah urutan lapisan object.", category: "Lapisan" },
  { key: "Shift + PageUp / PageDown", label: "Ke lapisan paling atas/bawah", description: "Pindahkan object ke depan atau belakang.", category: "Lapisan" },
  { key: "Alt + PageUp / PageDown", label: "Naik/turun satu lapisan", description: "Ubah urutan lapisan object.", category: "Lapisan" },
  { key: "Ctrl + B", label: "Tebal", description: "Ubah gaya teks menjadi tebal.", category: "Teks" },
  { key: "Ctrl + I", label: "Miring", description: "Ubah gaya teks menjadi miring.", category: "Teks" },
  { key: "Ctrl + U", label: "Garis bawah", description: "Tambah atau hapus garis bawah pada teks.", category: "Teks" },
  { key: "Ctrl + = / Ctrl + -", label: "Zoom in/out", description: "Ubah tingkat zoom workspace.", category: "Tampilan" },
  { key: "Ctrl + 0", label: "Muat ke layar", description: "Sesuaikan zoom agar drawing page muat di layar.", category: "Tampilan" },
];

export function shortcutTooltip(key: string): string {
  const shortcut = SHORTCUTS.find((item) => item.category === "Align" && item.key === key)
    ?? SHORTCUTS.find((item) => item.key === key);
  return shortcut ? `${shortcut.label} (${shortcut.key}): ${shortcut.description}` : key;
}
