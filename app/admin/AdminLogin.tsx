"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/admin-constants";
import { createClient } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function masuk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: loginError } = await createClient().auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });

      if (loginError) {
        setError("Kata sandi admin salah atau akun belum tersedia.");
        return;
      }

      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Tidak dapat masuk. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-violet-900 bg-white shadow-[8px_8px_0_0_#5b21b6]">
        <div className="h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500" />
        <div className="p-7">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-700">
            Area terbatas
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Masuk admin</h1>
          <p className="mt-2 text-sm text-stone-600">
            Gunakan akun admin yang terdaftar untuk mengelola Layoot.
          </p>
          <form onSubmit={masuk} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1 block text-sm font-semibold text-stone-800"
              >
                Email admin
              </label>
              <input
                id="admin-email"
                type="email"
                value={ADMIN_EMAIL}
                readOnly
                autoComplete="username"
                className="w-full rounded-lg border border-stone-300 bg-stone-100 px-3 py-2.5 text-stone-700"
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1 block text-sm font-semibold text-stone-800"
              >
                Kata sandi
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoFocus
                autoComplete="current-password"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-700 px-4 py-3 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memeriksa..." : "Masuk ke dashboard"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
