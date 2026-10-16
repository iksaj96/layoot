import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import BuatDesain from "@/app/dasbor/components/BuatDesain";
import KeluarButton from "@/app/components/KeluarButton";
import HapusDesain from "@/app/dasbor/components/HapusDesain";

export const metadata = { title: "Dasbor — Layoot" };

async function DasborIsi() {
  // Tandai bahwa komponen ini dirender saat ada request (bukan saat prerender),
  // supaya nilai yang berubah-ubah seperti Date.now() di dalam klien Supabase
  // tidak dihitung lebih awal.
  await connection();

  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/masuk");

  const { data: desain } = await supabase
    .from("designs")
    .select("id, title, paper, pages, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <>
      <header className="relative border-b-2 border-violet-900 bg-[#faf8f3]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="Layoot - Beranda"
          >
            <Image
              src="/logo/logo.png"
              alt="Logo Layoot"
              width={44}
              height={44}
              priority
              className="h-11 w-11 object-contain transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
            />
            <span className="text-2xl font-bold text-stone-900">
              Lay
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                oot
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-stone-600 sm:inline">
              {user.email}
            </span>
            <KeluarButton />
          </div>
        </div>

        {/* garis warna di bawah header */}
        <div
          className="absolute inset-x-0 -bottom-[5px] h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500"
          aria-hidden="true"
        />
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-bold text-stone-900">Buat desain baru</h1>
        <p className="mb-5 mt-1 text-stone-600">Pilih ukuran kertas.</p>
        <BuatDesain />

        <h2 className="mb-4 mt-12 text-2xl font-bold text-stone-900">Desain Anda</h2>

        {!desain || desain.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-10 text-center text-stone-600">
            Belum ada desain. Pilih A4 atau F4 di atas untuk memulai.
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {desain.map((d) => {
              const jumlahHalaman = Array.isArray(d.pages) ? d.pages.length : 1;
              return (
                <li
                  key={d.id}
                  className="flex flex-col overflow-hidden rounded-xl border-2 border-violet-900 bg-white shadow-[4px_4px_0_0_#5b21b6] transition-shadow hover:shadow-[6px_6px_0_0_#5b21b6]"
                >
                  <Link
                    href={`/editor/${d.id}`}
                    className="block flex-1 p-5 transition hover:bg-violet-50/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                        {d.paper}
                      </span>
                      <span className="text-xs text-stone-500">
                        {jumlahHalaman} halaman
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-bold text-stone-900">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-sm text-stone-500">
                      Diubah{" "}
                      {new Date(d.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between border-t-2 border-violet-100 px-3 py-2">
                    <Link
                      href={`/editor/${d.id}`}
                      className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      Buka
                    </Link>
                    <HapusDesain id={d.id} judul={d.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

export default function DasborPage() {
  return (
    <Suspense
      fallback={<p className="p-10 text-center text-stone-600">Memuat...</p>}
    >
      <DasborIsi />
    </Suspense>
  );
}