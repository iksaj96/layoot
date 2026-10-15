import { Suspense } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { createServerSupabase } from "@/lib/supabase-server";

function Ikon({ d }: { d: string[] }) {
  return (
    <svg
      width="26"
      height="26"
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

const fitur = [
  {
    judul: "A4 dan F4",
    isi: "Dua ukuran kertas yang paling sering dipakai, tanpa pengaturan rumit.",
    d: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8M8 17h5"],
  },
  {
    judul: "Selebaran sampai majalah",
    isi: "Satu halaman untuk pengumuman, banyak halaman untuk majalah.",
    d: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  },
  {
    judul: "Ekspor PDF siap cetak",
    isi: "Ukuran tepat dalam milimeter, hasil cetak sesuai tampilan layar.",
    d: ["M6 9V2h12v7", "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2", "M6 14h12v8H6z"],
  },
];

function IlustrasiKertas() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label="Ilustrasi kertas A4 dan F4"
    >
      {/* A4 */}
      <rect x="10" y="44" width="168" height="238" fill="#fff" stroke="#1c1917" strokeWidth="2" />
      <rect x="24" y="58" width="140" height="48" fill="#4f46e5" />
      <rect x="24" y="120" width="100" height="10" fill="#1c1917" />
      <rect x="24" y="140" width="140" height="6" fill="#e7e5e4" />
      <rect x="24" y="154" width="120" height="6" fill="#e7e5e4" />
      <rect x="24" y="176" width="64" height="56" fill="#fecdd3" />
      <rect x="98" y="176" width="66" height="6" fill="#e7e5e4" />
      <rect x="98" y="190" width="50" height="6" fill="#e7e5e4" />
      <text x="168" y="274" fontSize="11" fontWeight="700" fill="#a8a29e" textAnchor="end">A4</text>

      {/* F4 */}
      <rect x="214" y="16" width="172" height="264" fill="#fff" stroke="#1c1917" strokeWidth="2" />
      <rect x="228" y="30" width="60" height="8" fill="#d6d3d1" />
      <rect x="228" y="48" width="144" height="6" fill="#e7e5e4" />
      <rect x="228" y="62" width="124" height="6" fill="#e7e5e4" />
      <rect x="228" y="76" width="134" height="6" fill="#e7e5e4" />
      <rect x="228" y="100" width="144" height="80" fill="#fde68a" />
      <rect x="228" y="196" width="144" height="6" fill="#e7e5e4" />
      <rect x="228" y="210" width="110" height="6" fill="#e7e5e4" />
      <rect x="228" y="224" width="130" height="6" fill="#e7e5e4" />
      <text x="376" y="272" fontSize="11" fontWeight="700" fill="#a8a29e" textAnchor="end">F4</text>
    </svg>
  );
}

export default function Home() {
  return (
    <div>
      <Suspense
        fallback={
          <div
            className="h-16 border-b border-stone-200 bg-[#faf8f3]"
            aria-hidden="true"
          />
        }
      >
        <Navbar />
      </Suspense>
      <Suspense
        fallback={
          <main className="mx-auto min-h-[60vh] max-w-6xl px-5 py-14">
            <p>Memuat...</p>
          </main>
        }
      >
        <HomeContent />
      </Suspense>
      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        © 2026 Layoot
      </footer>
    </div>
  );
}

async function HomeContent() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              Editor desain cetak
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Rancang selebaran dan majalah{" "}
              <span className="text-indigo-600">tanpa ribet.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-stone-600">
              Susun layout ukuran A4 dan F4 langsung dari browser, lalu ekspor ke
              PDF siap cetak.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={user ? "/dasbor" : "/daftar"}
                className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white"
              >
                {user ? "Buka dasbor" : "Buat desain pertama"}
              </Link>
              {!user && (
                <Link
                  href="/masuk"
                  className="rounded-lg border border-stone-300 bg-white px-6 py-3 font-semibold"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>

          <IlustrasiKertas />
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-3">
          {fitur.map(({ judul, isi, d }) => (
            <div key={judul} className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Ikon d={d} />
              </div>
              <h3 className="text-lg font-bold">{judul}</h3>
              <p className="mt-2 text-stone-600">{isi}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-2xl bg-stone-900 px-6 py-12 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Siap membuat desain pertama Anda?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-300">
              Daftar gratis dan mulai merancang dalam hitungan menit.
            </p>
            <Link
              href={user ? "/dasbor" : "/daftar"}
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-stone-900"
            >
              {user ? "Buka dasbor" : "Mulai gratis"}
            </Link>
          </div>
        </section>
    </main>
  );
}