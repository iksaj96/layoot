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

function Ikon({ d, size = 20 }: { d: string[]; size?: number }) {
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
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

const ikonEmail = ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 6-10 7L2 6"];
const ikonKunci = ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11V7a5 5 0 0 1 10 0v4"];
const ikonMasuk = ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "M10 17l5-5-5-5", "M15 12H3"];
const ikonDaftar = ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M19 8v6M22 11h-6"];
const ikonPeringatan = ["M12 9v4", "M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"];
const ikonCentang = ["M22 11.1V12a10 10 0 1 1-5.9-9.1", "M22 4 12 14l-3-3"];

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

  const inputClass =
    "w-full rounded-xl border-2 border-violet-200 bg-violet-50/50 py-2.5 pl-10 pr-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-200";

  return (
    <div className="w-full max-w-sm">
      <div className="relative overflow-hidden rounded-2xl border-2 border-violet-900 bg-white shadow-[8px_8px_0_0_#5b21b6]">
        {/* strip warna di atas kartu */}
        <div className="h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500" />

        {/* bentuk dekoratif */}
        <div
          className="pointer-events-none absolute -right-8 top-6 h-28 w-28 rounded-full bg-fuchsia-100"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-6 bottom-24 h-16 w-16 rotate-12 rounded-xl bg-violet-100"
          aria-hidden="true"
        />

        <div className="relative p-6">
          <div
            className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-[3px_3px_0_0_#1c1917] ${
              isMasuk ? "bg-violet-600 -rotate-3" : "bg-fuchsia-600 rotate-3"
            }`}
          >
            <Ikon d={isMasuk ? ikonMasuk : ikonDaftar} size={24} />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-stone-900">
            {isMasuk ? "Masuk ke Layoot" : "Buat akun Layoot"}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {isMasuk
              ? "Lanjutkan desain Anda."
              : "Mulai merancang selebaran dan majalah Anda."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-bold text-violet-900">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-500">
                  <Ikon d={ikonEmail} size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-bold text-violet-900">
                Kata sandi
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-500">
                  <Ikon d={ikonKunci} size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isMasuk ? "current-password" : "new-password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                <span className="mt-0.5 shrink-0">
                  <Ikon d={ikonPeringatan} size={16} />
                </span>
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
              >
                <span className="mt-0.5 shrink-0">
                  <Ikon d={ikonCentang} size={16} />
                </span>
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-3 font-bold text-white shadow-[4px_4px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#4c1d95] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#4c1d95]"
            >
              {loading ? "Memproses..." : isMasuk ? "Masuk" : "Daftar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-600">
            {isMasuk ? "Belum punya akun? " : "Sudah punya akun? "}
            <Link
              href={isMasuk ? "/daftar" : "/masuk"}
              className="cursor-pointer font-bold text-violet-700 underline decoration-fuchsia-400 decoration-2 underline-offset-4 hover:text-fuchsia-600"
            >
              {isMasuk ? "Daftar" : "Masuk"}
            </Link>
          </p>
        </div>
      </div>

      {/* catatan khusus IKSAJ */}
      <div className="mt-5 rounded-2xl border-2 border-dashed border-violet-400 bg-violet-50 p-4 text-sm text-stone-700">
        <span className="inline-block rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white">
          Khusus IKSAJ
        </span>
        <p className="mt-2">
          Layoot dibuat oleh <strong className="text-violet-900">Adlan Madjied Ridho</strong> dari
          organisasi IKSAJ dan masih dalam tahap pengembangan. Untuk penggunaan di luar IKSAJ,
          silakan berkoordinasi langsung dengan Adlan guna membahas kesepakatan penggunaan,
          termasuk kemungkinan biaya bulanan.
        </p>
      </div>
    </div>
  );
}