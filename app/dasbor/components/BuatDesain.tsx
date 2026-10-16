"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Paper } from "@/lib/types";

const pilihan: {
  paper: Paper;
  ukuran: string;
  ket: string;
  w: number;
  h: number;
  kartu: string;
  badge: string;
  kertas: string;
  blok: string;
  garis: string;
}[] = [
  {
    paper: "A4",
    ukuran: "210 × 297 mm",
    ket: "Cocok untuk selebaran dan pengumuman.",
    w: 42,
    h: 59,
    kartu: "border-violet-900 bg-violet-100 shadow-[6px_6px_0_0_#5b21b6] md:-rotate-1",
    badge: "bg-violet-600 text-white",
    kertas: "#4c1d95",
    blok: "#7c3aed",
    garis: "#ddd6fe",
  },
  {
    paper: "F4",
    ukuran: "215 × 330 mm",
    ket: "Cocok untuk majalah dan dokumen panjang.",
    w: 43,
    h: 66,
    kartu: "border-fuchsia-900 bg-fuchsia-100 shadow-[6px_6px_0_0_#a21caf] md:rotate-1",
    badge: "bg-fuchsia-600 text-white",
    kertas: "#86198f",
    blok: "#c026d3",
    garis: "#f5d0fe",
  },
];

function Kertas({
  w,
  h,
  bayangan,
  blok,
  garis,
}: {
  w: number;
  h: number;
  bayangan: string;
  blok: string;
  garis: string;
}) {
  const x = (48 - w) / 2;
  const y = (72 - h) / 2;
  return (
    <svg
      width="48"
      height="72"
      viewBox="0 0 48 72"
      className="shrink-0 transition-transform duration-200 group-hover:-rotate-6"
      aria-hidden="true"
    >
      {/* bayangan kertas */}
      <rect x={x + 3} y={y + 3} width={w} height={h} fill={bayangan} />
      {/* kertas */}
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#1c1917" strokeWidth="2" />
      {/* blok judul */}
      <rect x={x + 5} y={y + 5} width={w - 10} height={h * 0.22} fill={blok} />
      {/* garis teks */}
      <rect x={x + 5} y={y + h * 0.22 + 11} width={w - 10} height="3" fill={garis} />
      <rect x={x + 5} y={y + h * 0.22 + 18} width={(w - 10) * 0.75} height="3" fill={garis} />
      <rect x={x + 5} y={y + h * 0.22 + 25} width={(w - 10) * 0.55} height="3" fill={garis} />
    </svg>
  );
}

export default function BuatDesain() {
  const router = useRouter();
  const [loading, setLoading] = useState<Paper | null>(null);
  const [error, setError] = useState("");

  async function buat(paper: Paper) {
    setLoading(paper);
    setError("");

    const { data, error } = await createClient()
      .from("designs")
      .insert({ paper })
      .select("id")
      .single();

    if (error || !data) {
      setError("Gagal membuat desain. Coba lagi.");
      setLoading(null);
      return;
    }

    router.push(`/editor/${data.id}`);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-6">
        {pilihan.map((p) => {
          const sedangMembuat = loading === p.paper;
          return (
            <button
              key={p.paper}
              onClick={() => buat(p.paper)}
              disabled={loading !== null}
              className={`group relative flex w-full cursor-pointer items-center gap-5 overflow-hidden rounded-2xl border-2 p-5 text-left transition duration-200 hover:-translate-y-1 hover:rotate-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:min-w-[300px] ${p.kartu} ${
                sedangMembuat ? "ring-4 ring-violet-300" : ""
              }`}
            >
              {/* label besar di latar */}
              <span
                className="pointer-events-none absolute -right-1 -top-3 text-6xl font-black text-white/70"
                aria-hidden="true"
              >
                {p.paper}
              </span>

              <Kertas
                w={p.w}
                h={p.h}
                bayangan={p.kertas}
                blok={p.blok}
                garis={p.garis}
              />

              <span className="relative">
                <span className="block text-lg font-bold text-stone-900">
                  {sedangMembuat ? "Membuat..." : `Desain ${p.paper}`}
                </span>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${p.badge}`}
                >
                  {p.ukuran}
                </span>
                <span className="mt-2 block text-sm text-stone-700">{p.ket}</span>
              </span>

              {/* indikator di pojok */}
              <span
                className={`relative ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 sm:inline-flex ${
                  sedangMembuat ? "animate-pulse" : ""
                }`}
                aria-hidden="true"
              >
                {sedangMembuat ? "•" : "→"}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}