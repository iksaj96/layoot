"use client";

import { useEffect, useState } from "react";
import type { ImageAsset, UploadedImage } from "./ImageUpload";
import ImageUpload, {
  deleteUploadedImage,
  listUploadedImages,
} from "./ImageUpload";
import Icon from "../ui/Icon";

type Props = {
  refreshKey: number;
  onSelect: (image: UploadedImage) => void;
  onDelete: (image: ImageAsset) => void;
  onError: (message: string) => void;
};

function ImageItem({
  asset,
  onSelect,
  onDelete,
  deleting,
}: {
  asset: ImageAsset;
  onSelect: (image: UploadedImage) => void;
  onDelete: (asset: ImageAsset) => void;
  deleting: boolean;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(
    null
  );

  return (
    <li className="flex min-w-0 items-center gap-1 rounded p-1 hover:bg-stone-200">
      <button
        type="button"
        disabled={!dimensions}
        onClick={() => dimensions && onSelect({ ...asset, ...dimensions })}
        className="flex min-w-0 flex-1 items-center gap-2 rounded text-left text-xs disabled:cursor-wait"
        title="Tambahkan gambar ke halaman"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt=""
          loading="lazy"
          onLoad={(event) =>
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          className="h-10 w-10 shrink-0 rounded border border-stone-300 bg-white object-contain"
        />
        <span className="truncate">{asset.name}</span>
      </button>
      <button
        type="button"
        title="Hapus gambar dari pustaka"
        aria-label={`Hapus ${asset.name}`}
        disabled={deleting}
        onClick={() => onDelete(asset)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-red-700 hover:bg-red-50 disabled:opacity-40"
      >
        <Icon name="trash" size={14} />
      </button>
    </li>
  );
}

export default function ImageLibraryPanel({
  refreshKey,
  onSelect,
  onDelete,
  onError,
}: Props) {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [localRevision, setLocalRevision] = useState(0);

  useEffect(() => {
    let aktif = true;
    listUploadedImages()
      .then((images) => {
        if (aktif) setAssets(images);
      })
      .catch((error: unknown) => {
        if (aktif) {
          onError(
            error instanceof Error ? error.message : "Gagal memuat pustaka gambar."
          );
        }
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [onError, refreshKey, localRevision]);

  async function hapusGambar(asset: ImageAsset) {
    if (
      !window.confirm(
        `Hapus "${asset.name}" dari pustaka dan Supabase Storage? Desain lain yang memakai gambar ini tidak lagi dapat menampilkannya.`
      )
    ) {
      return;
    }

    setDeletingPath(asset.path);
    onError("");
    try {
      await deleteUploadedImage(asset.path);
      setAssets((current) => current.filter((image) => image.path !== asset.path));
      onDelete(asset);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Gagal menghapus gambar.");
    } finally {
      setDeletingPath(null);
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-stone-300 px-3 py-2 text-xs font-bold text-stone-700">
        <Icon name="image" size={14} />
        Gambar
      </div>

      <div className="border-b border-stone-300 p-2">
        <ImageUpload
          onUploaded={() => setLocalRevision((revision) => revision + 1)}
          onError={onError}
          title="Unggah gambar ke pustaka"
          className="flex w-full items-center justify-center gap-2 rounded bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          <Icon name="plus" size={14} />
          Unggah gambar
        </ImageUpload>
      </div>

      {loading ? (
        <p className="p-3 text-xs text-stone-500">Memuat gambar...</p>
      ) : assets.length === 0 ? (
        <p className="p-3 text-xs text-stone-500">Belum ada gambar di pustaka.</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-auto p-1">
          {assets.map((asset) => (
            <ImageItem
              key={asset.path}
              asset={asset}
              onSelect={onSelect}
              onDelete={hapusGambar}
              deleting={deletingPath === asset.path}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
