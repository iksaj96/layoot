import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import KeluarButton from "./KeluarButton";

export default async function Navbar() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-stone-200 bg-[#faf8f3]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="text-2xl font-bold">
          Lay<span className="text-indigo-600">oot</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          {user ? (
            <>
              <Link
                href="/dasbor"
                className="rounded-lg bg-stone-900 px-4 py-2 text-white"
              >
                Dasbor
              </Link>
              <KeluarButton />
            </>
          ) : (
            <>
              <Link href="/masuk" className="px-4 py-2 text-stone-600">
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="rounded-lg bg-stone-900 px-4 py-2 text-white"
              >
                Mulai gratis
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}