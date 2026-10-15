"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Props = { mode: "masuk" | "daftar" };

function terjemah(pesan: string) {
  const p = pesan.toLowerCase();
  if (p.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (p.includes("already registered")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (p.includes("at least 6") || p.includes("weak")) return "Kata sandi terlalu pendek atau lemah (minimal 6 karakter).";
  if (p.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (p.includes("rate limit")) return "Batas pengiriman email tercapai. Tunggu beberapa menit, atau matikan Confirm email di Supabase.";
  if (p.includes("invalid api key") || p.includes("apikey")) return "Kunci Supabase salah. Periksa NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.";
  if (p.includes("failed to fetch")) return "Tidak bisa terhubung ke Supabase. Periksa NEXT_PUBLIC_SUPABASE_URL di .env.local lalu restart server.";
  if (p.includes("signups not allowed") || p.includes("signup is disabled")) return "Pendaftaran dinonaktifkan di pengaturan Supabase.";
  return `Kesalahan: ${pesan}`;
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const isMasuk = mode === "masuk";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError(
        "Variabel .env.local belum terbaca. Pastikan file ada di root proyek, lalu restart npm run dev."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (isMasuk) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(terjemah(error.message));
          setLoading(false);
          return;
        }
        router.push("/dasbor");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        setError(terjemah(error.message));
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dasbor");
        router.refresh();
        return;
      }

      setInfo("Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk.");
      setLoading(false);
    } catch (err) {
      setError(terjemah(err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6">
      <h1 className="text-2xl font-bold">
        {isMasuk ? "Masuk ke Layoot" : "Buat akun Layoot"}
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        {isMasuk
          ? "Lanjutkan desain Anda."
          : "Gratis, mulai merancang dalam hitungan menit."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold">
            Kata sandi
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={isMasuk ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-indigo-600"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {info && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Memproses..." : isMasuk ? "Masuk" : "Daftar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-stone-600">
        {isMasuk ? "Belum punya akun? " : "Sudah punya akun? "}
        <Link
          href={isMasuk ? "/daftar" : "/masuk"}
          className="font-semibold text-indigo-600"
        >
          {isMasuk ? "Daftar" : "Masuk"}
        </Link>
      </p>
    </div>
  );
}