import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import BuatDesain from "@/app/components/BuatDesain";
import KeluarButton from "@/app/components/KeluarButton";

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
      <header className="border-b border-stone-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-2xl font-bold">
            Lay<span className="text-indigo-600">oot</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-stone-600 sm:inline">
              {user.email}
            </span>
            <KeluarButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-bold">Buat desain baru</h1>
        <p className="mb-5 mt-1 text-stone-600">Pilih ukuran kertas.</p>
        <BuatDesain />

        <h2 className="mb-4 mt-12 text-2xl font-bold">Desain Anda</h2>

        {!desain || desain.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
            Belum ada desain. Pilih A4 atau F4 di atas untuk memulai.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {desain.map((d) => {
              const jumlahHalaman = Array.isArray(d.pages) ? d.pages.length : 1;
              return (
                <li key={d.id}>
                  <Link
                    href={`/editor/${d.id}`}
                    className="block rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                        {d.paper}
                      </span>
                      <span className="text-xs text-stone-500">
                        {jumlahHalaman} halaman
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-bold">{d.title}</h3>
                    <p className="mt-1 text-sm text-stone-500">
                      Diubah{" "}
                      {new Date(d.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
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