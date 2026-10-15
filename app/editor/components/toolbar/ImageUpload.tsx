"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

export type UploadedImage = {
  path: string;
  url: string;
  user_id: string;
  width: number;
  height: number;
};

export type ImageAsset = Pick<UploadedImage, "path" | "url" | "user_id"> & {
  name: string;
  width: number | null;
  height: number | null;
};

type Props = {
  onUploaded: (img: UploadedImage) => void;
  onError: (pesan: string) => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export const BUCKET = "design-assets";
const MAKS_SISI = 2000; // px, cukup untuk cetak A4
const MAKS_ASLI = 15 * 1024 * 1024;
const TIPE = ["image/png", "image/jpeg", "image/webp"];

export async function uploadImageFile(file: File): Promise<UploadedImage> {
  if (!TIPE.includes(file.type)) {
    throw new Error("Format gambar harus PNG, JPG, atau WebP.");
  }
  if (file.size > MAKS_ASLI) {
    throw new Error("Ukuran file maksimal 15 MB.");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sesi berakhir. Silakan masuk lagi.");

  const { blob, width, height, type } = await siapkan(file);
  const ext =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const nama = file.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "gambar";
  const path = `${user.id}/${nama}-${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: type, cacheControl: "31536000" });
  if (upErr) throw upErr;

  const { error: metadataError } = await supabase.from("images").insert({
    user_id: user.id,
    storage_path: path,
    file_name: file.name,
    mime_type: type,
    size_bytes: blob.size,
    width,
    height,
  });
  if (metadataError) {
    const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([path]);
    if (cleanupError) {
      throw new Error(
        `Gambar terunggah tetapi gagal disimpan ke pustaka (${metadataError.message}); pembersihan file juga gagal (${cleanupError.message}).`
      );
    }
    throw new Error(`Gagal menyimpan gambar ke pustaka: ${metadataError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl, user_id: user.id, width, height };
}

export async function listUploadedImages(): Promise<ImageAsset[]> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sesi berakhir. Silakan masuk lagi.");

  const { data: images, error } = await supabase
    .from("images")
    .select("user_id, storage_path, file_name, width, height")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!images) throw new Error("Gagal memuat pustaka gambar.");

  const bucket = supabase.storage.from(BUCKET);
  return images.map((image) => ({
    path: image.storage_path,
    name: image.file_name,
    user_id: image.user_id,
    width: image.width,
    height: image.height,
    url: bucket.getPublicUrl(image.storage_path).data.publicUrl,
  }));
}

export async function deleteUploadedImage(path: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sesi berakhir. Silakan masuk lagi.");
  if (!path.startsWith(`${user.id}/`) || path.slice(user.id.length + 1).includes("/")) {
    throw new Error("Lokasi gambar tidak valid.");
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;

  const { error: metadataError } = await supabase
    .from("images")
    .delete()
    .eq("storage_path", path)
    .eq("user_id", user.id);
  if (metadataError) {
    throw new Error(
      `File gambar sudah dihapus dari Storage, tetapi metadata pustaka gagal dihapus: ${metadataError.message}`
    );
  }
}

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

    setBusy(true);
    try {
      onUploaded(await uploadImageFile(file));
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