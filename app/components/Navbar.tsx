import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import KeluarButton from "./KeluarButton";

export default async function Navbar() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="relative border-b-2 border-violet-900 bg-[#faf8f3]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 -rotate-6 items-center justify-center rounded-lg bg-violet-600 text-lg font-black text-white shadow-[3px_3px_0_0_#1c1917] transition-transform group-hover:rotate-0">
            L
          </span>
          <span className="text-2xl font-bold text-stone-900">
            Lay
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              oot
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-semibold">
          {user ? (
            <>
              <Link
                href="/dasbor"
                className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white shadow-[3px_3px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4c1d95]"
              >
                Dasbor
              </Link>
              <KeluarButton />
            </>
          ) : (
            <>
              <Link
                href="/masuk"
                className="rounded-lg px-4 py-2 text-violet-900 transition hover:bg-violet-100"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white shadow-[3px_3px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4c1d95]"
              >
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* garis warna di bawah header */}
      <div
        className="absolute inset-x-0 -bottom-[5px] h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500"
        aria-hidden="true"
      />
    </header>
  );
}