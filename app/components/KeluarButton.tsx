"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function KeluarButton() {
  const router = useRouter();

  async function keluar() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={keluar}
      className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
    >
      Keluar
    </button>
  );
}