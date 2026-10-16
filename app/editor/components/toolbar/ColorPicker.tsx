"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PRESET_COLORS, hexToHsv, hsvToHex, isHex } from "../core/color";
import type { HSV } from "../core/color";
import { clamp } from "../core/utils";

type Props = {
  label: string;
  value?: string; // hex, "transparent", atau kosong
  onChange: (warna: string) => void;
  allowNone?: boolean; // tampilkan tombol "Tanpa isi"
  allowNoneLabel?: string; // tampilkan tombol "Tanpa isi"
  keepTextSelection?: boolean;
};

const CATUR =
  "repeating-conic-gradient(#d6d3d1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px";
const LEBAR = 232;
const PERKIRAAN_TINGGI = 320;

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

/** Seret di dalam kotak: mengembalikan posisi relatif x,y (0-1). */
function seret(
  e: React.PointerEvent<HTMLDivElement>,
  fn: (x: number, y: number) => void
) {
  const el = e.currentTarget;
  el.setPointerCapture(e.pointerId);

  const hitung = (ev: { clientX: number; clientY: number }) => {
    const r = el.getBoundingClientRect();
    fn(
      clamp((ev.clientX - r.left) / r.width, 0, 1),
      clamp((ev.clientY - r.top) / r.height, 0, 1)
    );
  };
  hitung(e);

  const selesai = () => {
    el.removeEventListener("pointermove", hitung);
    el.removeEventListener("pointerup", selesai);
    el.removeEventListener("pointercancel", selesai);
  };
  el.addEventListener("pointermove", hitung);
  el.addEventListener("pointerup", selesai);
  el.addEventListener("pointercancel", selesai);
}

export default function ColorPicker({
  label,
  value,
  onChange,
  allowNone,
  allowNoneLabel = "Tanpa isi (transparan)",
  keepTextSelection = false,
}: Props) {
  const tombol = useRef<HTMLButtonElement>(null);
  const kotak = useRef<HTMLDivElement>(null);
  const [buka, setBuka] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [hsv, setHsv] = useState<HSV>(() =>
    hexToHsv(isHex(value) ? value : "#ffffff")
  );
  const [draf, setDraf] = useState(isHex(value) ? value : "");
  const nilaiHex = isHex(value) ? value.toLowerCase() : null;
  const [nilaiHexSebelumnya, setNilaiHexSebelumnya] = useState(nilaiHex);

  if (nilaiHex && nilaiHex !== nilaiHexSebelumnya) {
    setNilaiHexSebelumnya(nilaiHex);
    setHsv(hexToHsv(nilaiHex));
    setDraf(nilaiHex);
  }

  const aturPosisi = useCallback(() => {
    const tombolAktif = tombol.current;
    if (!tombolAktif) return;
    const r = tombolAktif.getBoundingClientRect();
    const lebarAktif = Math.min(LEBAR, window.innerWidth - 16);
    const ruangBawah = window.innerHeight - r.bottom - 14;
    const ruangAtas = r.top - 14;
    const top =
      ruangBawah >= PERKIRAAN_TINGGI
        ? r.bottom + 6
        : ruangAtas >= PERKIRAAN_TINGGI
          ? r.top - PERKIRAAN_TINGGI - 6
          : Math.max(
              8,
              Math.min(r.bottom + 6, window.innerHeight - PERKIRAAN_TINGGI - 8)
            );
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - lebarAktif - 8)),
      top,
    });
  }, []);

  // Tutup saat klik di luar atau tekan Esc
  useEffect(() => {
    if (!buka) return;
    let frame = 0;
    const aturUlang = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(aturPosisi);
    };
    const luar = (e: PointerEvent) => {
      const t = e.target as Node;
      if (kotak.current?.contains(t) || tombol.current?.contains(t)) return;
      setBuka(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    document.addEventListener("pointerdown", luar);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", aturUlang);
    window.visualViewport?.addEventListener("resize", aturUlang);
    return () => {
      document.removeEventListener("pointerdown", luar);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", aturUlang);
      window.visualViewport?.removeEventListener("resize", aturUlang);
      cancelAnimationFrame(frame);
    };
  }, [aturPosisi, buka]);

  function toggle() {
    if (!buka && tombol.current) {
      aturPosisi();
    }
    setBuka(!buka);
  }

  function terapkanHsv(n: HSV) {
    const hex = hsvToHex(n);
    setHsv(n);
    setDraf(hex);
    onChange(hex);
  }

  function pakaiHex(hex: string) {
    const h = hex.toLowerCase();
    setHsv(hexToHsv(h));
    setDraf(h);
    onChange(h);
  }

  async function pipet() {
    const ED = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!ED) return;
    try {
      const r = await new ED().open();
      pakaiHex(r.sRGBHex);
    } catch {
      /* dibatalkan */
    }
  }

  const adaPipet = typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <>
      <button
        ref={tombol}
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={buka}
        onClick={toggle}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded border border-stone-300 bg-white px-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
      >
        <span
          className="h-5 w-5 rounded-sm border border-stone-400"
          style={{ background: isHex(value) ? value : CATUR }}
        />
        <span className="hidden lg:inline">{label}</span>
      </button>

      {buka &&
        createPortal(
          <div
            ref={kotak}
            role="dialog"
            data-text-format={keepTextSelection ? "" : undefined}
            aria-label={`Pilih ${label.toLowerCase()}`}
            className="select-none overflow-y-auto rounded-lg border border-stone-300 bg-white p-3 shadow-xl"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              width: "min(232px, calc(100vw - 16px))",
              maxHeight: "calc(100dvh - 16px)",
              zIndex: 100,
            }}
          >
            {/* Panel warna bebas */}
            <div
              className="relative h-36 w-full cursor-crosshair touch-none rounded"
              style={{
                background: `linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))`,
              }}
              onPointerDown={(e) =>
                seret(e, (x, y) => terapkanHsv({ h: hsv.h, s: x, v: 1 - y }))
              }
            >
              <span
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                style={{
                  left: `${hsv.s * 100}%`,
                  top: `${(1 - hsv.v) * 100}%`,
                  boxShadow: "0 0 0 1px #000",
                }}
              />
            </div>

            {/* Slider hue */}
            <div
              className="relative mt-3 h-3 w-full cursor-pointer touch-none rounded"
              style={{
                background:
                  "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
              }}
              onPointerDown={(e) =>
                seret(e, (x) => terapkanHsv({ ...hsv, h: Math.min(359.9, x * 360) }))
              }
            >
              <span
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                style={{
                  left: `${(hsv.h / 360) * 100}%`,
                  background: `hsl(${hsv.h},100%,50%)`,
                  boxShadow: "0 0 0 1px #000",
                }}
              />
            </div>

            {/* Kode hex dan pipet */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-7 w-7 shrink-0 rounded border border-stone-400"
                style={{ background: hsvToHex(hsv) }}
              />
              <input
                value={draf}
                spellCheck={false}
                aria-label="Kode warna hex"
                onChange={(e) => {
                  const v = e.target.value;
                  setDraf(v);
                  const hex = v.startsWith("#") ? v : `#${v}`;
                  if (isHex(hex)) pakaiHex(hex);
                }}
                className="h-7 min-w-0 flex-1 rounded border border-stone-300 px-2 font-mono text-xs uppercase text-stone-900"
              />
              {adaPipet && (
                <button
                  type="button"
                  onClick={pipet}
                  className="h-7 shrink-0 rounded border border-stone-300 px-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Pipet
                </button>
              )}
            </div>

            {/* Warna cepat */}
            <div className="mt-3 grid grid-cols-11 gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Warna ${c}`}
                  onClick={() => pakaiHex(c)}
                  className="h-4 w-full rounded-sm border border-stone-300"
                  style={{ background: c }}
                />
              ))}
            </div>

            {allowNone && (
              <button
                type="button"
                onClick={() => onChange("transparent")}
                className="mt-3 w-full rounded border border-stone-300 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                {allowNoneLabel}
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}