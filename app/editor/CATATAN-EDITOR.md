# Catatan Editor Layoot

Tempel seluruh isi file ini ke AI sebelum meminta perubahan. Tujuannya: AI yang menentukan file mana yang perlu diubah, bukan saya.

## INSTRUKSI UNTUK AI (wajib diikuti)
1. Jangan langsung menulis kode. Pertama, pakai peta di bawah ("Cari file dari tampilan", "Cari file dari jenis perubahan", "Siapa mengimpor siapa") untuk menentukan file yang terdampak.
2. Balas dulu dengan daftar singkat: **file yang diubah**, **file baru** (jika ada), dan **file yang harus saya tempel** karena isinya belum Anda lihat. Jangan menebak isi file yang belum ditempel.
3. Setelah semua file yang dibutuhkan ada, tulis **kode lengkap per file**, bukan potongan. Beri nama path file di atas tiap blok kode.
4. Ingat rantai efek: ubah tipe di `lib/types.ts` berarti cek `ElementView.tsx` (layar) dan `ExportPdf.tsx` (cetak) agar tampilan layar dan PDF tetap sama.
5. Satu folder maksimal 19 file. Pakai folder yang sudah ada sesuai fungsinya.
6. Di akhir, tulis bagian baru untuk catatan ini jika ada file baru, dipindah, atau fiturnya berubah.
7. Bahasa nama variabel dan teks antarmuka: Indonesia.

## Cara saya meminta (template)
```
[tempel isi catatan ini]

Saya mau: <jelaskan perubahan>
```
AI akan menjawab file apa yang perlu ditempel, lalu saya tempel file itu.

## Teknologi
Next.js (App Router, `"use client"`), React, TypeScript, Tailwind CSS, Supabase (tabel `designs`, bucket `design-assets`).
Satuan objek: mm. Zoom (`scale`): px per mm. Ekspor PDF lewat cetak browser (`window.print`).

## Struktur dan fungsi file

```
app/editor/
├── CATATAN-EDITOR.md
├── [id]/page.tsx              Halaman server: cek login, ambil desain dari Supabase, render <Editor>
└── components/
    ├── Editor.tsx             Otak editor: SEMUA state, simpan otomatis, salin/tempel, lapisan, halaman, merakit semua bagian
    ├── canvas/
    │   ├── Canvas.tsx         Kertas kerja: zoom scroll, geser klik roda tengah, gambar objek baru, geser/ubah ukuran, atur sudut
    │   └── ElementView.tsx    Tampilan SATU objek di layar (teks, bentuk, gambar) + 8 pegangan ukuran + pegangan sudut
    ├── toolbar/
    │   ├── Toolbox.tsx        Kolom alat kiri (pilih, teks, persegi, elips, gambar)
    │   ├── PropertyBar.tsx    Bilah properti atas: posisi, ukuran, font, warna, sudut, gambar isi, tombol lapisan
    │   ├── ColorPicker.tsx    Kotak warna kustom: panel warna, hue, hex, pipet, warna cepat
    │   ├── FontSelect.tsx     Dropdown jenis huruf
    │   └── ImageUpload.tsx    Unggah gambar ke Supabase Storage (kompres otomatis)
    ├── panels/
    │   ├── LayersPanel.tsx    Daftar objek (lapisan) di kanan
    │   ├── PageStrip.tsx      Bilah halaman di bawah (tambah, duplikat, hapus)
    │   ├── StatusBar.tsx      Bilah paling bawah: info objek, petunjuk, kontrol zoom
    │   └── ShortcutHelp.tsx   Jendela daftar pintasan keyboard (tombol ?)
    ├── export/
    │   └── ExportPdf.tsx      Tombol Ekspor PDF + tampilan CETAK semua halaman (terpisah dari ElementView)
    ├── ui/
    │   ├── Icon.tsx           Kumpulan ikon SVG dan IconButton
    │   └── NumberField.tsx    Input angka berlabel
    ├── hooks/
    │   ├── useHistory.ts      Undo/redo (perubahan beruntun dengan kunci sama digabung)
    │   ├── useShortcuts.ts    Semua pintasan keyboard
    │   └── useGoogleFonts.ts  Memuat stylesheet Google Fonts sekali
    └── core/
        ├── utils.ts           Konstanta (PT_TO_MM, PX_PER_MM, MIN_SIZE, PAD, batas zoom), tipe Tool/Handle/Mode/Status, uid, round, clamp
        ├── fonts.ts           Daftar font, fontCss(), URL Google Fonts
        ├── color.ts           Konversi hex <-> HSV, warna cepat, isHex
        ├── elementOps.ts      Operasi murni: moveLayer, cloneElement, ubahElemen, radiusOf, borderRadiusCss
        └── textFlow.ts        Pembagian teks untuk kotak berkolom yang saling terhubung

lib/types.ts                   Tipe data: Paper, DesignElement, DesignPage, Design, EditorDesign
```

## Cari file dari TAMPILAN (yang saya lihat di layar)
| Bagian yang mau diubah | File |
|---|---|
| Bilah judul paling atas (judul, undo/redo, bantuan, status simpan, tombol Ekspor PDF) | `Editor.tsx` (bagian `<header>`), tombol PDF di `export/ExportPdf.tsx` |
| Bilah properti di bawah judul (X, Y, L, T, font, warna, perataan, kolom, alur teks, sudut, tombol lapisan) | `toolbar/PropertyBar.tsx` |
| Kolom alat di kiri | `toolbar/Toolbox.tsx` |
| Daftar objek di kanan | `panels/LayersPanel.tsx` |
| Kertas / area kerja (latar abu-abu, garis margin, outline kertas) | `canvas/Canvas.tsx` |
| Tampilan satu objek (teks, bentuk, gambar, garis seleksi, 8 pegangan ukuran, titik sudut oranye) | `canvas/ElementView.tsx` |
| Bilah halaman (Halaman 1, 2, tambah, duplikat, hapus) | `panels/PageStrip.tsx` |
| Bilah paling bawah (info objek, zoom %) | `panels/StatusBar.tsx` |
| Kotak pemilih warna | `toolbar/ColorPicker.tsx` |
| Dropdown font | `toolbar/FontSelect.tsx` (daftar font di `core/fonts.ts`) |
| Jendela daftar pintasan | `panels/ShortcutHelp.tsx` |
| Hasil PDF / cetak | `export/ExportPdf.tsx` |
| Bentuk ikon | `ui/Icon.tsx` |

## Cari file dari JENIS PERUBAHAN
| Mau apa | File yang diubah |
|---|---|
| Tambah properti objek baru (mis. bayangan, transparansi, garis tepi) | `lib/types.ts` + `canvas/ElementView.tsx` + `export/ExportPdf.tsx` + `toolbar/PropertyBar.tsx` (+ `core/elementOps.ts` bila ada logika) |
| Tambah jenis objek baru (mis. garis, bintang) | `lib/types.ts` + `core/utils.ts` (tipe Tool) + `toolbar/Toolbox.tsx` + `canvas/Canvas.tsx` (startDraw) + `canvas/ElementView.tsx` + `export/ExportPdf.tsx` + `panels/LayersPanel.tsx` + `panels/StatusBar.tsx` + `ui/Icon.tsx` + `hooks/useShortcuts.ts` + `panels/ShortcutHelp.tsx` |
| Tambah pintasan keyboard | `hooks/useShortcuts.ts` + `Editor.tsx` (objek `aksi` dan fungsinya) + `panels/ShortcutHelp.tsx` (daftar) |
| Tambah font | `core/fonts.ts` saja |
| Tambah ikon | `ui/Icon.tsx` saja |
| Tambah tombol di bilah properti | `toolbar/PropertyBar.tsx` (+ `Editor.tsx` jika butuh fungsi baru) |
| Ubah cara menggeser / mengubah ukuran / menggambar objek | `canvas/Canvas.tsx` |
| Ubah zoom, geser tampilan, ukuran awal kertas di layar | `canvas/Canvas.tsx` + `Editor.tsx` (fitScale, zoom) + `core/utils.ts` (batas zoom) |
| Ubah salin / tempel / hapus / duplikat / urutan lapisan | `Editor.tsx` + `core/elementOps.ts` |
| Ubah undo/redo | `hooks/useHistory.ts` (+ `Editor.tsx` bila kunci penggabungan berubah) |
| Ubah simpan otomatis / koneksi Supabase | `Editor.tsx` (bagian "Simpan otomatis"), `[id]/page.tsx` (pengambilan data) |
| Ubah unggah gambar (ukuran maks, format, kompres) | `toolbar/ImageUpload.tsx` |
| Ubah ukuran kertas / jenis kertas | `lib/types.ts` (PAPER_SIZE_MM) + `Editor.tsx` |
| Ubah warna cepat di pemilih warna | `core/color.ts` |
| Ubah hasil PDF (tampil beda dari layar) | `export/ExportPdf.tsx` (dan cek `canvas/ElementView.tsx` agar tetap sama) |
| Halaman (tambah/hapus/urut) | `Editor.tsx` + `panels/PageStrip.tsx` |
| Seleksi banyak objek, rotasi (belum ada) | `lib/types.ts` + `Editor.tsx` (state selectedIds) + `canvas/Canvas.tsx` + `canvas/ElementView.tsx` + `export/ExportPdf.tsx` + `toolbar/PropertyBar.tsx` + `hooks/useShortcuts.ts` |

## Siapa mengimpor siapa (rantai efek)
- `Editor.tsx` mengimpor: semua komponen di `canvas/`, `toolbar/`, `panels/`, `export/`, `ui/Icon`, semua `hooks/`, dan `core/utils`, `core/elementOps`.
- `canvas/Canvas.tsx` memakai `canvas/ElementView.tsx` dan `core/utils`.
- `canvas/ElementView.tsx` memakai `core/elementOps`, `core/fonts`, `core/utils`.
- `export/ExportPdf.tsx` memakai `core/elementOps`, `core/fonts`, `ui/Icon`. Logika tampilan sama dengan `ElementView.tsx` tetapi satuan mm, jadi dua file ini harus selalu dijaga sinkron.
- `toolbar/PropertyBar.tsx` memakai `ColorPicker`, `FontSelect`, `ImageUpload`, `ui/NumberField`, `ui/Icon`, `core/elementOps`.
- `hooks/useShortcuts.ts` hanya memanggil fungsi yang dikirim `Editor.tsx` (tidak menyentuh state langsung).
- Semua file memakai tipe dari `lib/types.ts`.

## Model data (lib/types.ts)
`DesignElement`: id, type (`text` | `rect` | `ellipse` | `image`), x, y, w, h (mm), text, fontFamily, fontSize (pt), bold, italic, underline, align, columns, nextTextBoxId, color, fill, radius (mm, hanya rect), src, fit (`cover` | `contain`).
`src` dipakai oleh `image` dan juga sebagai gambar isi di dalam `rect`/`ellipse`.
Urutan array `elements` = urutan lapisan (elemen terakhir paling atas).
Field baru harus opsional agar desain lama tetap aman. `pages` disimpan sebagai JSON di Supabase, jadi tidak perlu ubah tabel.

## Alur penting
- **State utama** ada di `Editor.tsx`. Komponen lain hanya menerima props dan callback.
- **Undo/redo**: `setPages(fn, kunci?)` dari `useHistory`. Kunci sama dalam 0,7 detik jadi satu langkah.
- **Simpan otomatis**: tertunda 1,2 detik setelah `pages` atau `title` berubah. `Ctrl+S` simpan langsung.
- **Mode sudut persegi**: klik persegi terpilih (tanpa geser) mengganti mode `ukuran` <-> `sudut`.
- **Zoom**: scroll di `Canvas.tsx` (listener wheel non-passive), menjaga titik di bawah kursor. Geser tampilan dengan klik roda tengah.
- **Font**: font sistem lebih dulu, lalu pengganti metrik-setara dari Google Fonts (Tinos, Arimo, Carlito, dll).
- **Ekspor PDF**: `ExportPdf.tsx` merender semua halaman di `#area-cetak` dengan satuan mm, lalu `window.print()`.

## Pintasan keyboard saat ini
Ctrl+S simpan, Ctrl+Z urungkan, Ctrl+Shift+Z / Ctrl+Y ulangi, Ctrl+C/X/V salin/potong/tempel, Ctrl+D duplikat,
Delete/Backspace hapus, Tab / Shift+Tab pilih objek berikutnya/sebelumnya, Enter edit teks, Panah geser 1 mm (Shift 10 mm),
V/T/R/E pilih alat, Esc batal, Ctrl+B/I/U gaya teks, Ctrl+] / Ctrl+[ naik/turun lapisan,
Shift+PageUp/PageDown ke paling atas/bawah, Alt+PageUp/PageDown naik/turun lapisan,
Ctrl+= / Ctrl+- / Ctrl+0 zoom, ? atau F1 bantuan.
Catatan: Ctrl+PageUp/PageDown dipakai Chrome untuk pindah tab, jadi tidak bisa dipakai.

## Belum ada
- Seleksi banyak objek (kotak seleksi, Shift+klik, Ctrl+A).
- Rotasi objek.
- Penggaris (sengaja dihapus).

## Riwayat perubahan
(Tambahkan satu baris tiap selesai perubahan besar: tanggal, apa yang berubah, file yang disentuh.)
- 2026-10-15: Struktur folder dirapikan; penggaris dihapus; zoom scroll + geser klik roda tengah; shortcut + undo/redo; banyak font; gambar di dalam bentuk; sudut persegi; pemilih warna kustom.
- 2026-10-15: Kotak teks mendukung rata kiri-kanan, kolom, dan alur teks ke kotak berikutnya; layar dan PDF memakai pembagian teks yang sama.