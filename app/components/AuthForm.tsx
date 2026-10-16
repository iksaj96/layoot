"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const DOMAIN_EMAIL = "@layoot.com";

function terjemah(pesan: string) {
  const p = pesan.toLowerCase();
  if (p.includes("invalid login credentials")) return "Username atau kata sandi salah.";
  if (p.includes("email not confirmed")) return "Akun belum dikonfirmasi. Hubungi admin.";
  if (p.includes("rate limit") || p.includes("too many")) return "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.";
  if (p.includes("invalid api key") || p.includes("apikey")) return "Kunci Supabase salah. Periksa NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.";
  if (p.includes("failed to fetch")) return "Tidak bisa terhubung ke Supabase. Periksa NEXT_PUBLIC_SUPABASE_URL di .env.local lalu restart server.";
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

function IkonGoogle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

const ikonPengguna = ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"];
const ikonKunci = ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11V7a5 5 0 0 1 10 0v4"];
const ikonMasuk = ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "M10 17l5-5-5-5", "M15 12H3"];
const ikonPeringatan = ["M12 9v4", "M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"];
const ikonCentang = ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"];
const ikonDasbor = ["M3 3h7v9H3z", "M14 3h7v5h-7z", "M14 12h7v9h-7z", "M3 16h7v5H3z"];
const ikonKeluar = ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"];

export default function AuthForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // status sesi: null = sedang dicek, "" = belum masuk, selain itu = nama pengguna yang sedang masuk
  const [penggunaMasuk, setPenggunaMasuk] = useState<string | null>(null);
  const [keluarLoading, setKeluarLoading] = useState(false);

  useEffect(() => {
    let aktif = true;

    async function cekSesi() {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        if (aktif) setPenggunaMasuk("");
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!aktif) return;

        if (data.user) {
          const email = data.user.email ?? "";
          setPenggunaMasuk(email.split("@")[0] || "pengguna");
        } else {
          setPenggunaMasuk("");
        }
      } catch {
        if (aktif) setPenggunaMasuk("");
      }
    }

    cekSesi();
    return () => {
      aktif = false;
    };
  }, []);

  async function handleKeluar() {
    setKeluarLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(terjemah(error.message));
        setKeluarLoading(false);
        return;
      }

      setPenggunaMasuk("");
      setPassword("");
      setKeluarLoading(false);
      router.refresh();
    } catch (err) {
      setError(terjemah(err instanceof Error ? err.message : String(err)));
      setKeluarLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError(
        "Variabel .env.local belum terbaca. Pastikan file ada di root proyek, lalu restart npm run dev."
      );
      return;
    }

    // Rapikan username: buang spasi, huruf kecil, dan buang bagian "@..." bila ada
    const bersih = username.trim().toLowerCase().replace(/\s+/g, "").split("@")[0];

    if (!bersih) {
      setError("Username wajib diisi.");
      return;
    }

    const email = `${bersih}${DOMAIN_EMAIL}`;

    setLoading(true);

    try {
      const supabase = createClient();
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
    } catch (err) {
      setError(terjemah(err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border-2 border-violet-200 bg-violet-50/50 py-2.5 pl-10 pr-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-200";

  const sudahMasuk = penggunaMasuk !== null && penggunaMasuk !== "";
  const sedangCek = penggunaMasuk === null;

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
          {sedangCek ? (
            /* ====== Sedang mengecek sesi ====== */
            <div className="flex flex-col items-center py-10 text-center" role="status">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-medium text-stone-600">Memeriksa sesi Anda...</p>
            </div>
          ) : sudahMasuk ? (
            /* ====== Sudah masuk ====== */
            <>
              <div className="inline-flex h-12 w-12 -rotate-3 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[3px_3px_0_0_#1c1917]">
                <Ikon d={ikonCentang} size={24} />
              </div>

              <h1 className="mt-4 text-2xl font-bold text-stone-900">Anda sudah masuk</h1>
              <p className="mt-1 text-sm text-stone-600">
                Anda masuk sebagai{" "}
                <strong className="text-violet-900">{penggunaMasuk}</strong>. Lanjutkan ke dasbor
                atau keluar untuk berganti akun.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                >
                  <span className="mt-0.5 shrink-0">
                    <Ikon d={ikonPeringatan} size={16} />
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/dasbor")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white shadow-[4px_4px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#4c1d95]"
                >
                  <Ikon d={ikonDasbor} size={18} />
                  Buka dasbor
                </button>

                <button
                  type="button"
                  onClick={handleKeluar}
                  disabled={keluarLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-violet-900 bg-white px-4 py-3 font-bold text-violet-900 shadow-[4px_4px_0_0_#c4b5fd] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#c4b5fd] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#c4b5fd]"
                >
                  <Ikon d={ikonKeluar} size={18} />
                  {keluarLoading ? "Memproses..." : "Keluar"}
                </button>
              </div>
            </>
          ) : (
            /* ====== Form masuk ====== */
            <>
              <div className="inline-flex h-12 w-12 -rotate-3 items-center justify-center rounded-xl bg-violet-600 text-white shadow-[3px_3px_0_0_#1c1917]">
                <Ikon d={ikonMasuk} size={24} />
              </div>

              <h1 className="mt-4 text-2xl font-bold text-stone-900">Masuk ke Layoot</h1>
              <p className="mt-1 text-sm text-stone-600">
                Lanjutkan merancang selebaran dan majalah Anda.
              </p>

              {/* Masuk dengan Google (dibekukan, belum tersedia) */}
              <div className="mt-7">
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Login dengan Google belum tersedia"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border-2 border-stone-200 bg-stone-100 px-4 py-3 font-bold text-stone-400 opacity-70 grayscale"
                  >
                    <IkonGoogle size={20} />
                    <span>Masuk dengan Google</span>
                  </button>

                  {/* label melayang di pojok kanan atas tombol */}
                  <span
                    className="pointer-events-none absolute -right-2 -top-3 rotate-6 rounded-full border-2 border-violet-900 bg-fuchsia-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[2px_2px_0_0_#4c1d95]"
                    aria-hidden="true"
                  >
                    Segera hadir
                  </span>
                </div>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-violet-200" />
                  <span className="text-xs font-medium text-stone-500">atau masuk dengan username</span>
                  <div className="h-px flex-1 bg-violet-200" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1 block text-sm font-bold text-violet-900">
                    Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-500">
                      <Ikon d={ikonPengguna} size={18} />
                    </span>
                    <input
                      id="username"
                      type="text"
                      required
                      autoFocus
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Username Anda"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`${inputClass} pr-28`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
                      {DOMAIN_EMAIL}
                    </span>
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
                      autoComplete="current-password"
                      placeholder="Kata sandi Anda"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-3 font-bold text-white shadow-[4px_4px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#4c1d95] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#4c1d95]"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-stone-600">
                Belum punya akun? Hubungi{" "}
                <strong className="text-violet-900">Adlan Madjied Ridho</strong> untuk meminta akses.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}