"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Props = { id: string; judul: string };

function IkonSampah({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IkonPeringatan() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

export default function HapusDesain({ id, judul }: Props) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function tutup() {
    if (loading) return;
    setTerbuka(false);
    setError("");
  }

  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!terbuka) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        setTerbuka(false);
        setError("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terbuka, loading]);

  async function hapus() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("designs")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        setError(`Gagal menghapus: ${error.message}`);
        setLoading(false);
        return;
      }

      // Jika RLS menolak, Supabase tidak error tetapi tidak ada baris yang terhapus
      if (!data || data.length === 0) {
        setError(
          "Desain tidak terhapus. Anda mungkin tidak punya izin, atau desain sudah dihapus."
        );
        setLoading(false);
        return;
      }

      setTerbuka(false);
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        aria-label={`Hapus desain ${judul}`}
      >
        <IkonSampah />
        Hapus
      </button>

      {terbuka &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-5"
            onClick={tutup}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="judul-hapus"
              aria-describedby="isi-hapus"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border-2 border-violet-900 bg-white p-6 shadow-[8px_8px_0_0_#5b21b6]"
            >
              <div className="inline-flex h-12 w-12 -rotate-3 items-center justify-center rounded-xl bg-red-600 text-white shadow-[3px_3px_0_0_#1c1917]">
                <IkonPeringatan />
              </div>

              <h2 id="judul-hapus" className="mt-4 text-xl font-bold text-stone-900">
                Hapus desain ini?
              </h2>
              <p id="isi-hapus" className="mt-2 text-sm text-stone-600">
                Desain{" "}
                <strong className="break-words text-stone-900">“{judul}”</strong> akan
                dihapus secara permanen.{" "}
                <strong className="text-red-700">
                  Tindakan ini tidak bisa dibatalkan dan desain tidak bisa dikembalikan.
                </strong>
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={tutup}
                  disabled={loading}
                  autoFocus
                  className="cursor-pointer rounded-xl border-2 border-violet-200 px-4 py-2.5 font-bold text-violet-900 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={hapus}
                  disabled={loading}
                  className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white shadow-[3px_3px_0_0_#7f1d1d] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#7f1d1d] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_0_#7f1d1d]"
                >
                  {loading ? "Menghapus..." : "Ya, hapus permanen"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}