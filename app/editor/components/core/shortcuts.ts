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
  { key: "C", action: "C", label: "Rata tengah vertikal", description: "Sejajarkan pusat kiri-kanan minimal dua objek pada garis tengah bounding box gabungan.", category: "Align" },
  { key: "E", action: "E", label: "Rata tengah horizontal", description: "Sejajarkan pusat atas-bawah minimal dua objek pada garis tengah bounding box gabungan.", category: "Align" },
  { key: "L", action: "L", label: "Rata kiri", description: "Sejajarkan tepi kiri minimal dua objek terpilih.", category: "Align" },
  { key: "R", action: "R", label: "Rata kanan", description: "Sejajarkan tepi kanan minimal dua objek terpilih.", category: "Align" },
  { key: "T", action: "T", label: "Rata atas", description: "Sejajarkan tepi atas minimal dua objek terpilih.", category: "Align" },
  { key: "B", action: "B", label: "Rata bawah", description: "Sejajarkan tepi bawah minimal dua objek terpilih.", category: "Align" },
  { key: "P", action: "P", label: "Pusatkan ke drawing page", description: "Pusatkan objek terpilih ke tengah drawing page, termasuk satu objek.", category: "Align" },
  { key: "Scroll mouse", label: "Zoom in/out", description: "Perbesar atau perkecil tampilan dengan titik zoom di posisi kursor.", category: "Navigasi" },
  { key: "Drag klik tengah", label: "Geser (pan)", description: "Geser workspace bebas ke segala arah.", category: "Navigasi" },
  { key: "Shift + /", label: "Buka katalog shortcut", description: "Buka Pintasan Keyboard.", category: "Bantuan" },
  { key: "F1", label: "Buka katalog shortcut", description: "Buka Pintasan Keyboard.", category: "Bantuan" },
  { key: "V", label: "Alat pilih", description: "Pilih dan edit object.", category: "Alat" },
  { key: "Shift + T", label: "Alat teks", description: "Aktifkan alat teks.", category: "Alat" },
  { key: "Shift + R", label: "Alat persegi", description: "Aktifkan alat persegi.", category: "Alat" },
  { key: "Shift + E", label: "Alat elips", description: "Aktifkan alat elips.", category: "Alat" },
  { key: "Shift + L", label: "Alat garis", description: "Aktifkan alat garis.", category: "Alat" },
  { key: "Shift + X", label: "Alat crop", description: "Pangkas bagian objek terpilih dengan menyeret area crop.", category: "Alat" },
  { key: "Esc", label: "Batal / pilih", description: "Batalkan alat aktif atau hapus pilihan.", category: "Alat" },
  { key: "Ctrl/Cmd + S", label: "Simpan sekarang", description: "Simpan desain.", category: "Umum" },
  { key: "Ctrl/Cmd + Z", label: "Urungkan", description: "Batalkan aksi terakhir; saat mengedit teks berlaku undo teks native.", category: "Umum" },
  { key: "Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y", label: "Ulangi", description: "Ulangi aksi yang dibatalkan; saat mengedit teks berlaku redo native.", category: "Umum" },
  { key: "Ctrl/Cmd + C / X / V", label: "Salin / potong / tempel", description: "Salin, potong, atau tempel objek terpilih; di editor teks gunakan clipboard teks native.", category: "Objek" },
  { key: "Ctrl/Cmd + D", label: "Duplikat", description: "Buat salinan objek terpilih.", category: "Objek" },
  { key: "Delete / Backspace", label: "Hapus", description: "Hapus object terpilih.", category: "Objek" },
  { key: "Tab / Shift + Tab", label: "Pilih objek berikutnya/sebelumnya", description: "Pindah pilihan objek saat fokus di kanvas.", category: "Objek" },
  { key: "Enter / F2", label: "Edit teks", description: "Edit teks pada objek terpilih; Enter di dalam editor menambah baris baru.", category: "Objek" },
  { key: "Panah / Shift + Panah", label: "Geser objek", description: "Geser 1 mm; tahan Shift untuk menggeser 10 mm.", category: "Objek" },
  { key: "Shift / Ctrl/Cmd + seret", label: "Geser lurus", description: "Saat memindahkan objek, kunci gerakan pada sumbu horizontal atau vertikal.", category: "Objek" },
  { key: "Klik objek terpilih", label: "Siklus mode transformasi", description: "Dengan alat pilih, klik tanpa menyeret untuk mengganti mode; penanda tengah atau pemilih mode juga tersedia. Elips, garis, dan teks melewati mode sudut. Klik dua kali teks untuk mengedit.", category: "Objek" },
  { key: "Alt + 1 / 2 / 3", label: "Pilih mode transformasi", description: "Dengan alat pilih dan satu objek terpilih, pilih ukuran, putar, atau sudut; mode sudut hanya tersedia untuk persegi dan gambar.", category: "Objek" },
  { key: "Ctrl/Cmd + seret", label: "Kunci proporsi bentuk", description: "Saat menggambar persegi, elips, atau garis, tahan Ctrl (Windows/Linux) atau Cmd (Mac) untuk membuat proporsi 1:1.", category: "Alat" },
  { key: "Shift + seret", label: "Gambar dari titik tengah", description: "Saat menggambar persegi, elips, atau garis, tahan Shift agar titik awal menjadi pusat bentuk.", category: "Alat" },
  { key: "Ctrl/Cmd + ] / [", label: "Naik/turun satu lapisan", description: "Ubah urutan lapisan objek.", category: "Lapisan" },
  { key: "Ctrl/Cmd + PageUp / PageDown", label: "Naik/turun satu lapisan", description: "Ubah urutan lapisan objek.", category: "Lapisan" },
  { key: "Shift + PageUp / PageDown", label: "Ke lapisan paling atas/bawah", description: "Pindahkan objek ke depan atau belakang.", category: "Lapisan" },
  { key: "Alt + PageUp / PageDown", label: "Naik/turun satu lapisan", description: "Ubah urutan lapisan objek.", category: "Lapisan" },
  { key: "Ctrl/Cmd + B", label: "Tebal", description: "Ubah gaya teks menjadi tebal, termasuk saat teks sedang diedit.", category: "Teks" },
  { key: "Ctrl/Cmd + I", label: "Miring", description: "Ubah gaya teks menjadi miring, termasuk saat teks sedang diedit.", category: "Teks" },
  { key: "Ctrl/Cmd + U", label: "Garis bawah", description: "Tambah atau hapus garis bawah, termasuk saat teks sedang diedit.", category: "Teks" },
  { key: "Ctrl/Cmd + = / -", label: "Zoom in/out", description: "Ubah tingkat zoom workspace.", category: "Tampilan" },
  { key: "Ctrl/Cmd + 0", label: "Muat ke layar", description: "Sesuaikan zoom agar drawing page muat di layar.", category: "Tampilan" },
];

export function shortcutTooltip(key: string): string {
  const shortcut = SHORTCUTS.find((item) => item.category === "Align" && item.key === key)
    ?? SHORTCUTS.find((item) => item.key === key);
  return shortcut ? `${shortcut.label} (${shortcut.key}): ${shortcut.description}` : key;
}
