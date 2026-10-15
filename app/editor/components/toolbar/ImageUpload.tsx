"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

export type UploadedImage = { url: string; width: number; height: number };

type Props = {
  onUploaded: (img: UploadedImage) => void;
  onError: (pesan: string) => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

const BUCKET = "design-assets";
const MAKS_SISI = 2000; // px, cukup untuk cetak A4
const MAKS_ASLI = 15 * 1024 * 1024;
const TIPE = ["image/png", "image/jpeg", "image/webp"];

async function siapkan(file: File) {
  const bmp = await createImageBitmap(file);
  const { width, height } = bmp;
  const sisiPanjang = Math.max(width, height);

  if (sisiPanjang <= MAKS_SISI && file.size <= 2 * 1024 * 1024) {
    bmp.close();
    return { blob: file as Blob, width, height, type: file.type };
  }

  const k = Math.min(1, MAKS_SISI / sisiPanjang);
  const w = Math.round(width * k);
  const h = Math.round(height * k);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("Browser tidak mendukung pemrosesan gambar.");
  }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, type, 0.85)
  );
  if (!blob) throw new Error("Gagal memproses gambar.");

  return { blob, width: w, height: h, type };
}

export default function ImageUpload({
  onUploaded,
  onError,
  title,
  className,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    onError("");

    if (!TIPE.includes(file.type)) {
      onError("Format gambar harus PNG, JPG, atau WebP.");
      return;
    }
    if (file.size > MAKS_ASLI) {
      onError("Ukuran file maksimal 15 MB.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi berakhir. Silakan masuk lagi.");

      const { blob, width, height, type } = await siapkan(file);

      const ext =
        type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: type, cacheControl: "31536000" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onUploaded({ url: data.publicUrl, width, height });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        title={busy ? "Mengunggah..." : title}
        aria-label={title}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={className}
      >
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </>
  );
}