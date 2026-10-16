import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import KeluarButton from "@/app/components/KeluarButton";
import AdminLogin from "@/app/admin/AdminLogin";
import AdminNavigation from "@/app/admin/AdminNavigation";
import { getAdminContext } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin — Layoot" };

function AdminLoading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-center text-sm text-stone-600">Memuat dashboard admin...</p>
    </main>
  );
}

async function AdminLayoutIsi({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const { user, isAdmin } = await getAdminContext();

  if (!user) return <AdminLogin />;

  if (!isAdmin) redirect("/");

  return (
    <div className="flex h-dvh flex-col gap-2 overflow-hidden p-2">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 rounded-xl border border-violet-200 bg-white px-3 py-2 sm:px-4">
        <Link
          href="/admin"
          className="flex shrink-0 items-center gap-2"
          aria-label="Layoot Admin"
        >
          <Image
            src="/logo/logo.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
          <span className="text-xl font-bold text-stone-900">
            Layoot <span className="text-violet-700">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-600 sm:inline">
            {user.email}
          </span>
          <KeluarButton />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
        <aside className="shrink-0 rounded-xl border border-violet-200 bg-white md:w-64">
          <AdminNavigation />
        </aside>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-xl border border-violet-200 bg-white p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminLayoutIsi>{children}</AdminLayoutIsi>
    </Suspense>
  );
}
