"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Paper } from "@/lib/types";

const pilihan: { paper: Paper; ukuran: string; w: number; h: number }[] = [
  { paper: "A4", ukuran: "210 × 297 mm", w: 42, h: 59 },
  { paper: "F4", ukuran: "215 × 330 mm", w: 43, h: 66 },
];

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
      <div className="flex flex-wrap gap-4">
        {pilihan.map((p) => (
          <button
            key={p.paper}
            onClick={() => buat(p.paper)}
            disabled={loading !== null}
            className="flex items-center gap-4 rounded-xl border-2 border-stone-900 bg-white p-4 text-left disabled:opacity-60"
          >
            <svg width="48" height="72" viewBox="0 0 48 72" aria-hidden="true">
              <rect
                x={(48 - p.w) / 2}
                y={(72 - p.h) / 2}
                width={p.w}
                height={p.h}
                fill="#fff"
                stroke="#1c1917"
                strokeWidth="2"
              />
            </svg>
            <span>
              <span className="block text-lg font-bold">
                {loading === p.paper ? "Membuat..." : `Desain ${p.paper}`}
              </span>
              <span className="block text-sm text-stone-600">{p.ukuran}</span>
            </span>
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}