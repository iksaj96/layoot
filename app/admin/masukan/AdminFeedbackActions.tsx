"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { id: string; pesan: string };
type ApiResponse = { error?: string };

export default function AdminFeedbackActions({ id, pesan }: Props) {
  const router = useRouter();
  const [mengedit, setMengedit] = useState(false);
  const [isi, setIsi] = useState(pesan);
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState("");

  async function simpan() {
    setSibuk(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/masukan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan: isi }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(result.error || "Gagal menyimpan perubahan.");
        return;
      }

      setIsi(isi);
      setMengedit(false);
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Gagal menyimpan perubahan."
      );
    } finally {
      setSibuk(false);
    }
  }

  async function hapus() {
    if (!window.confirm("Hapus laporan ini secara permanen?")) return;

    setSibuk(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/masukan/${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(result.error || "Gagal menghapus laporan.");
        return;
      }

      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Gagal menghapus laporan."
      );
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="mt-3">
      {mengedit ? (
        <div className="space-y-2">
          <label htmlFor={`pesan-${id}`} className="sr-only">
            Isi laporan
          </label>
          <textarea
            id={`pesan-${id}`}
            value={isi}
            onChange={(event) => setIsi(event.target.value)}
            maxLength={2000}
            rows={4}
            disabled={sibuk}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 disabled:opacity-60"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={simpan}
              disabled={sibuk || !isi.trim() || Array.from(isi).length > 2000}
              className="rounded-lg bg-violet-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sibuk ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsi(pesan);
                setMengedit(false);
                setError("");
              }}
              disabled={sibuk}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMengedit(true)}
            disabled={sibuk}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-violet-50 disabled:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={hapus}
            disabled={sibuk}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {sibuk ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
