import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import KeluarButton from "./KeluarButton";

export default async function Navbar() {
  await connection();

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="relative border-b-2 border-violet-900 bg-[#faf8f3]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2" aria-label="Layoot - Beranda">
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
            <Link
              href="/masuk"
              className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white shadow-[3px_3px_0_0_#4c1d95] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4c1d95]"
            >
              Masuk
            </Link>
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