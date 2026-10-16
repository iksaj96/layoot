"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase";
import Icon from "../ui/Icon";

export type JenisMasukan = "masalah" | "saran";

type Props = {
  jenis: JenisMasukan;
  designId: string;
  onClose: () => void;
};

const MAKS_PESAN = 2000;

export default function FeedbackModal({ jenis, designId, onClose }: Props) {
  const [pesan, setPesan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !mengirim) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mengirim, onClose]);

  useEffect(() => {
    if (!sukses) return;
    const timer = window.setTimeout(onClose, 1100);
    return () => window.clearTimeout(timer);
  }, [sukses, onClose]);

  async function kirim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isi = pesan.trim();
    if (!isi || isi.length > MAKS_PESAN) {
      setError("Pesan wajib diisi dan maksimal 2000 karakter.");
      return;
    }

    setMengirim(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Sesi login berakhir. Silakan masuk kembali.");

      const { error: insertError } = await supabase.from("feedback_reports").insert({
        user_id: user.id,
        design_id: designId,
        jenis,
        pesan: isi,
        halaman: window.location.pathname,
        user_agent: navigator.userAgent,
      });

      if (insertError) throw insertError;
      setSukses(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Masukan gagal dikirim. Silakan coba lagi."
      );
    } finally {
      setMengirim(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !mengirim) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-lg rounded-xl bg-white p-5 text-stone-900 shadow-2xl"
      >
        {sukses ? (
          <div role="status" className="py-8 text-center">
            <Icon name="circleCheck" size={32} className="mx-auto mb-3 text-emerald-600" />
            <h2 id="feedback-title" className="text-lg font-bold">Terima kasih</h2>
          </div>
        ) : (
          <>
            <h2 id="feedback-title" className="mb-4 text-lg font-bold">
              {jenis === "masalah" ? "Laporkan masalah" : "Beri saran"}
            </h2>
            <form onSubmit={kirim}>
              <label htmlFor="feedback-message" className="mb-1 block text-sm font-semibold">
                Pesan
              </label>
              <textarea
                id="feedback-message"
                required
                maxLength={MAKS_PESAN}
                value={pesan}
                onChange={(event) => {
                  setPesan(event.target.value);
                  setError("");
                }}
                disabled={mengirim}
                rows={6}
                autoFocus
                className="select-text w-full resize-y rounded-lg border border-stone-300 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70"
              />
              <div className="mt-1 flex justify-between text-xs text-stone-500">
                <span>Wajib diisi</span>
                <span>{pesan.length}/{MAKS_PESAN}</span>
              </div>
              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={mengirim}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mengirim || !pesan.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mengirim ? "Mengirim..." : "Kirim"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
