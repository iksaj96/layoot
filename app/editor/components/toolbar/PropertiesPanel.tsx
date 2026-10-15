"use client";

import type { DesignElement } from "@/lib/types";
import { radiusOf } from "../core/elementOps";
import type { LayerOp } from "../core/elementOps";
import { MIN_SIZE } from "../core/utils";
import type { Mode } from "../core/utils";
import Icon, { IconButton } from "../ui/Icon";
import NumberField from "../ui/NumberField";
import ColorPicker from "./ColorPicker";
import FontSelect from "./FontSelect";
import ImageUpload from "./ImageUpload";
import type { UploadedImage } from "./ImageUpload";

type Props = {
  selected: DesignElement | null;
  mode: Mode;
  textBoxOptions: { id: string; label: string }[];
  onChange: (id: string, patch: Partial<DesignElement>) => void;
  onLinkText: (id: string, nextId: string | undefined) => void;
  onLayer: (op: LayerOp) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFillImage: (img: UploadedImage) => void;
  onError: (pesan: string) => void;
};

function Sekat() {
  return <span className="my-1 h-px w-full shrink-0 bg-stone-200" />;
}

export default function PropertiesPanel({
  selected,
  mode,
  textBoxOptions,
  onChange,
  onLinkText,
  onLayer,
  onDuplicate,
  onDelete,
  onFillImage,
  onError,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
      {!selected ? (
        <p className="text-xs text-stone-600">
          Pilih satu objek untuk mengubah posisi, ukuran, warna, dan tampilannya.
        </p>
      ) : (
        <>
          <section className="flex flex-wrap items-center gap-2">
            <span className="w-full text-xs font-bold text-stone-600">Posisi & ukuran</span>
            <NumberField label="X" value={selected.x} onChange={(v) => onChange(selected.id, { x: v })} />
            <NumberField label="Y" value={selected.y} onChange={(v) => onChange(selected.id, { y: v })} />
            <NumberField
              label="L"
              value={selected.w}
              min={selected.type === "line" ? 0 : MIN_SIZE}
              onChange={(v) =>
                onChange(selected.id, { w: Math.max(selected.type === "line" ? 0 : MIN_SIZE, v) })
              }
            />
            <NumberField
              label="T"
              value={selected.h}
              min={selected.type === "line" ? 0 : MIN_SIZE}
              onChange={(v) =>
                onChange(selected.id, { h: Math.max(selected.type === "line" ? 0 : MIN_SIZE, v) })
              }
            />
            <span className="shrink-0 text-xs text-stone-500">mm</span>
          </section>

          {mode === "putar" && (
            <>
              <span className="w-full text-xs font-bold text-stone-600">Transformasi</span>
              <IconButton
                icon="flipHorizontal"
                label="Balik horizontal"
                active={!!selected.flipX}
                onClick={() => onChange(selected.id, { flipX: !selected.flipX })}
              />
              <IconButton
                icon="flipVertical"
                label="Balik vertikal"
                active={!!selected.flipY}
                onClick={() => onChange(selected.id, { flipY: !selected.flipY })}
              />
              <NumberField
                label="Putar"
                value={selected.rotation ?? 0}
                min={-360}
                max={360}
                step={1}
                width="w-14"
                onChange={(value) =>
                  onChange(selected.id, { rotation: Math.max(-360, Math.min(360, value)) })
                }
              />
              <span className="shrink-0 text-xs text-stone-500">°</span>
              <Sekat />
            </>
          )}

          {/* ---------- Teks ---------- */}
          {selected.type === "text" && (
            <>
              <span className="w-full text-xs font-bold text-stone-600">Teks</span>
              <FontSelect
                value={selected.fontFamily}
                onChange={(nama) => onChange(selected.id, { fontFamily: nama || undefined })}
              />
              <NumberField
                label="Ukuran"
                value={selected.fontSize ?? 12}
                min={4}
                step={1}
                width="w-14"
                onChange={(v) => onChange(selected.id, { fontSize: v })}
              />
              <IconButton
                icon="bold"
                label="Tebal"
                shortcut="Ctrl+B"
                active={!!selected.bold}
                onClick={() => onChange(selected.id, { bold: !selected.bold })}
              />
              <IconButton
                icon="italic"
                label="Miring"
                shortcut="Ctrl+I"
                active={!!selected.italic}
                onClick={() => onChange(selected.id, { italic: !selected.italic })}
              />
              <IconButton
                icon="underline"
                label="Garis bawah"
                shortcut="Ctrl+U"
                active={!!selected.underline}
                onClick={() => onChange(selected.id, { underline: !selected.underline })}
              />
              <IconButton
                icon="alignLeft"
                label="Rata kiri"
                active={(selected.align ?? "left") === "left"}
                onClick={() => onChange(selected.id, { align: "left" })}
              />
              <IconButton
                icon="alignCenter"
                label="Rata tengah"
                active={selected.align === "center"}
                onClick={() => onChange(selected.id, { align: "center" })}
              />
              <IconButton
                icon="alignRight"
                label="Rata kanan"
                active={selected.align === "right"}
                onClick={() => onChange(selected.id, { align: "right" })}
              />
              <IconButton
                icon="alignJustify"
                label="Rata kiri-kanan"
                active={selected.align === "justify"}
                onClick={() => onChange(selected.id, { align: "justify" })}
              />
              <NumberField
                label="Kolom"
                value={selected.columns ?? 1}
                min={1}
                max={6}
                step={1}
                width="w-12"
                onChange={(v) =>
                  onChange(selected.id, { columns: Math.max(1, Math.min(6, Math.floor(v))) })
                }
              />
              <label className="flex shrink-0 items-center gap-1 text-xs font-semibold text-stone-600">
                Lanjut ke
                <select
                  aria-label="Lanjutkan teks ke kotak teks"
                  value={selected.nextTextBoxId ?? ""}
                  onChange={(e) => onLinkText(selected.id, e.target.value || undefined)}
                  className="max-w-40 rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-900"
                >
                  <option value="">Tidak ada</option>
                  {textBoxOptions.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.label}
                    </option>
                  ))}
                </select>
              </label>
              <ColorPicker
                label="Warna teks"
                value={selected.color ?? "#1c1917"}
                onChange={(c) => onChange(selected.id, { color: c })}
              />
              <Sekat />
            </>
          )}

          {selected.type === "line" && (
            <>
              <span className="w-full text-xs font-bold text-stone-600">Garis</span>
              <ColorPicker
                label="Warna garis"
                value={selected.stroke ?? "#1c1917"}
                onChange={(c) => onChange(selected.id, { stroke: c })}
              />
              <NumberField
                label="Ketebalan"
                value={selected.strokeWidth ?? 0.5}
                min={0.1}
                max={10}
                step={0.1}
                width="w-14"
                onChange={(v) =>
                  onChange(selected.id, { strokeWidth: Math.max(0.1, Math.min(10, v)) })
                }
              />
              <span className="shrink-0 text-xs text-stone-500">mm</span>
              <Sekat />
            </>
          )}

          {/* ---------- Persegi dan elips ---------- */}
          {(selected.type === "rect" || selected.type === "ellipse") && (
            <>
              <span className="w-full text-xs font-bold text-stone-600">Bentuk</span>
              <ColorPicker
                label="Warna isi"
                value={selected.fill}
                allowNone
                onChange={(c) => onChange(selected.id, { fill: c })}
              />
              <ColorPicker
                label="Warna garis luar"
                value={selected.stroke ?? "#1c1917"}
                allowNone
                allowNoneLabel="Tanpa garis luar"
                onChange={(c) => onChange(selected.id, { stroke: c })}
              />
              <NumberField
                label="Ketebalan"
                value={selected.strokeWidth ?? 0.5}
                min={0.1}
                max={10}
                step={0.1}
                width="w-14"
                onChange={(v) =>
                  onChange(selected.id, { strokeWidth: Math.max(0.1, Math.min(10, v)) })
                }
              />
              <span className="shrink-0 text-xs text-stone-500">mm</span>

              {selected.type === "rect" && (
                <NumberField
                  label="Sudut"
                  value={radiusOf(selected)}
                  min={0}
                  max={Math.min(selected.w, selected.h) / 2}
                  step={1}
                  width="w-14"
                  onChange={(v) => onChange(selected.id, { radius: Math.max(0, v) })}
                />
              )}

              <ImageUpload
                onUploaded={onFillImage}
                onError={onError}
                title="Isi bentuk dengan gambar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-700 hover:bg-stone-200 disabled:opacity-40"
              >
                <Icon name="image" />
              </ImageUpload>

              {selected.src && (
                <>
                  <IconButton
                    icon="fill"
                    label="Gambar isi penuh"
                    active={(selected.fit ?? "cover") === "cover"}
                    onClick={() => onChange(selected.id, { fit: "cover" })}
                  />
                  <IconButton
                    icon="contain"
                    label="Gambar tampil utuh"
                    active={selected.fit === "contain"}
                    onClick={() => onChange(selected.id, { fit: "contain" })}
                  />
                  <IconButton
                    icon="x"
                    label="Hapus gambar isi"
                    onClick={() => onChange(selected.id, { src: undefined })}
                  />
                </>
              )}
              <Sekat />
            </>
          )}

          {/* ---------- Gambar ---------- */}
          {selected.type === "image" && (
            <>
              <span className="w-full text-xs font-bold text-stone-600">Gambar</span>
              <IconButton
                icon="fill"
                label="Isi penuh"
                active={(selected.fit ?? "cover") === "cover"}
                onClick={() => onChange(selected.id, { fit: "cover" })}
              />
              <IconButton
                icon="contain"
                label="Tampilkan utuh"
                active={selected.fit === "contain"}
                onClick={() => onChange(selected.id, { fit: "contain" })}
              />
              <Sekat />
            </>
          )}

          {/* ---------- Lapisan dan aksi ---------- */}
          <section className="flex flex-wrap items-center gap-1 border-t border-stone-200 pt-2">
            <span className="w-full text-xs font-bold text-stone-600">Susunan & aksi</span>
            <IconButton icon="toFront" label="Ke paling atas" shortcut="Shift+PgUp" onClick={() => onLayer("atas")} />
            <IconButton icon="arrowUp" label="Naikkan satu lapisan" shortcut="Ctrl+]" onClick={() => onLayer("naik")} />
            <IconButton icon="arrowDown" label="Turunkan satu lapisan" shortcut="Ctrl+[" onClick={() => onLayer("turun")} />
            <IconButton icon="toBack" label="Ke paling bawah" shortcut="Shift+PgDn" onClick={() => onLayer("bawah")} />
            <IconButton icon="copy" label="Duplikat" shortcut="Ctrl+D" onClick={onDuplicate} />
            <IconButton icon="trash" label="Hapus" shortcut="Del" danger onClick={onDelete} />
          </section>
        </>
      )}
    </div>
  );
}