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
    no: "01",
    judul: "A4 dan F4",
    isi: "Dua ukuran kertas yang paling sering dipakai, tanpa pengaturan rumit.",
    tag: "Ukuran kertas",
    kartu: "bg-violet-100 border-violet-900 shadow-[6px_6px_0_0_#5b21b6] md:-rotate-1",
    ikon: "bg-violet-600 text-white",
    tagWarna: "bg-violet-600 text-white",
    nomor: "text-violet-300",
    d: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8M8 17h5"],
  },
  {
    no: "02",
    judul: "Selebaran sampai majalah",
    isi: "Satu halaman untuk pengumuman, banyak halaman untuk majalah.",
    tag: "Satu atau banyak halaman",
    kartu: "bg-fuchsia-100 border-fuchsia-900 shadow-[6px_6px_0_0_#a21caf] md:translate-y-4 md:rotate-1",
    ikon: "bg-fuchsia-600 text-white",
    tagWarna: "bg-fuchsia-600 text-white",
    nomor: "text-fuchsia-300",
    d: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  },
  {
    no: "03",
    judul: "Ekspor PDF siap cetak",
    isi: "Ukuran tepat dalam milimeter, hasil cetak sesuai tampilan layar.",
    tag: "Presisi milimeter",
    kartu: "bg-indigo-100 border-indigo-900 shadow-[6px_6px_0_0_#4338ca] md:-rotate-1",
    ikon: "bg-indigo-600 text-white",
    tagWarna: "bg-indigo-600 text-white",
    nomor: "text-indigo-300",
    d: ["M6 9V2h12v7", "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2", "M6 14h12v8H6z"],
  },
];

const infoLayoot = [
  {
    judul: "Dibuat oleh",
    isi: "Adlan Madjied Ridho, dari organisasi IKSAJ.",
    kartu: "bg-violet-100 border-violet-900 shadow-[5px_5px_0_0_#5b21b6]",
    label: "bg-violet-600 text-white",
  },
  {
    judul: "Tahap pengembangan",
    isi: "Layoot masih terus dikembangkan. Fitur akan bertambah dan bisa berubah sewaktu-waktu.",
    kartu: "bg-fuchsia-100 border-fuchsia-900 shadow-[5px_5px_0_0_#a21caf]",
    label: "bg-fuchsia-600 text-white",
  },
  {
    judul: "Khusus IKSAJ",
    isi: "Website ini disiapkan untuk keperluan IKSAJ, belum dibuka untuk umum.",
    kartu: "bg-indigo-100 border-indigo-900 shadow-[5px_5px_0_0_#4338ca]",
    label: "bg-indigo-600 text-white",
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
      {/* bentuk dekoratif di belakang */}
      <circle cx="372" cy="30" r="22" fill="#e879f9" />
      <circle cx="26" cy="262" r="14" fill="#a78bfa" />

      {/* A4 */}
      <rect x="16" y="50" width="168" height="238" fill="#4c1d95" />
      <rect x="10" y="44" width="168" height="238" fill="#fff" stroke="#1c1917" strokeWidth="2" />
      <rect x="24" y="58" width="140" height="48" fill="#7c3aed" />
      <rect x="24" y="120" width="100" height="10" fill="#1c1917" />
      <rect x="24" y="140" width="140" height="6" fill="#e7e5e4" />
      <rect x="24" y="154" width="120" height="6" fill="#e7e5e4" />
      <rect x="24" y="176" width="64" height="56" fill="#f0abfc" />
      <rect x="98" y="176" width="66" height="6" fill="#e7e5e4" />
      <rect x="98" y="190" width="50" height="6" fill="#e7e5e4" />
      <text x="168" y="274" fontSize="11" fontWeight="700" fill="#a8a29e" textAnchor="end">A4</text>

      {/* F4 */}
      <rect x="220" y="22" width="172" height="264" fill="#86198f" />
      <rect x="214" y="16" width="172" height="264" fill="#fff" stroke="#1c1917" strokeWidth="2" />
      <rect x="228" y="30" width="60" height="8" fill="#c4b5fd" />
      <rect x="228" y="48" width="144" height="6" fill="#e7e5e4" />
      <rect x="228" y="62" width="124" height="6" fill="#e7e5e4" />
      <rect x="228" y="76" width="134" height="6" fill="#e7e5e4" />
      <rect x="228" y="100" width="144" height="80" fill="#ddd6fe" />
      <circle cx="300" cy="140" r="22" fill="#a855f7" />
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
        © 2026 Layoot · Dibuat oleh Adlan Madjied Ridho, IKSAJ
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
          <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            Editor desain cetak
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            Rancang selebaran dan majalah{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              tanpa ribet.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-stone-600">
            Susun layout ukuran A4 dan F4 langsung dari browser, lalu ekspor ke
            PDF siap cetak.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={user ? "/dasbor" : "/daftar"}
              className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white shadow-[4px_4px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#4c1d95]"
            >
              {user ? "Buka dasbor" : "Buat desain pertama"}
            </Link>
            {!user && (
              <Link
                href="/masuk"
                className="rounded-lg border border-violet-300 bg-white px-6 py-3 font-semibold text-violet-900 transition hover:bg-violet-50"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>

        <IlustrasiKertas />
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-20 md:grid-cols-3">
        {fitur.map(({ no, judul, isi, tag, kartu, ikon, tagWarna, nomor, d }) => (
          <div
            key={judul}
            className={`relative overflow-hidden rounded-2xl border-2 p-6 transition-transform duration-200 hover:rotate-0 hover:-translate-y-1 ${kartu}`}
          >
            <span
              className={`pointer-events-none absolute -right-2 -top-4 text-7xl font-black ${nomor}`}
              aria-hidden="true"
            >
              {no}
            </span>
            <div
              className={`relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${ikon}`}
            >
              <Ikon d={d} />
            </div>
            <h3 className="relative text-lg font-bold text-stone-900">{judul}</h3>
            <p className="relative mt-2 text-stone-700">{isi}</p>
            <span
              className={`relative mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${tagWarna}`}
            >
              {tag}
            </span>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">
            Tentang Layoot
          </span>
          <h2 className="mt-4 text-2xl font-bold md:text-3xl">
            Dibuat dari dalam, untuk IKSAJ
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {infoLayoot.map(({ judul, isi, kartu, label }) => (
            <div key={judul} className={`rounded-2xl border-2 p-6 ${kartu}`}>
              <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${label}`}>
                {judul}
              </span>
              <p className="mt-3 font-semibold text-stone-900">{isi}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-violet-400 bg-white p-6 md:p-8">
          <h3 className="text-lg font-bold text-violet-900">
            Ingin menggunakan Layoot?
          </h3>
          <p className="mt-2 max-w-3xl text-stone-700">
            Karena Layoot masih dalam tahap pengembangan dan khusus untuk IKSAJ,
            pengguna yang ingin memakainya diminta berkoordinasi langsung dengan
            Adlan Madjied Ridho. Dalam pembicaraan itu akan dibahas kesepakatan
            penggunaan, termasuk kemungkinan adanya biaya bulanan untuk menunjang
            pengembangan dan pemeliharaan website.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-violet-900 via-violet-800 to-fuchsia-800 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Siap membuat desain pertama Anda?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-violet-100">
            Mulai merancang dalam hitungan menit. Untuk penggunaan di luar
            IKSAJ, hubungi pembuat terlebih dahulu.
          </p>
          <Link
            href={user ? "/dasbor" : "/daftar"}
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-violet-900 transition hover:bg-violet-100"
          >
            {user ? "Buka dasbor" : "Mulai sekarang"}
          </Link>
        </div>
      </section>
    </main>
  );
}