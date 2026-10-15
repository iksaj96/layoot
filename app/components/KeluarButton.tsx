"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function KeluarButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function keluar() {
    setLoading(true);
    try {
      await createClient().auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={keluar}
      disabled={loading}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-violet-900 bg-white px-4 py-2 text-sm font-bold text-violet-900 shadow-[3px_3px_0_0_#c4b5fd] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-violet-50 hover:shadow-[1px_1px_0_0_#c4b5fd] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_0_#c4b5fd]"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}