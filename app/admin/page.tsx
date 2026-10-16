import Link from "next/link";
import { connection } from "next/server";
import { getAdminContext } from "@/lib/admin";

export const metadata = { title: "Ringkasan Admin — Layoot" };

export default async function AdminDashboard() {
  await connection();
  const { supabase, isAdmin } = await getAdminContext();
  if (!isAdmin) return null;

  const [feedbackResult, userResult, recentResult] = await Promise.all([
    supabase.from("feedback_reports").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("feedback_reports")
      .select("id, user_id, jenis, pesan, halaman, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  for (const result of [feedbackResult, userResult, recentResult]) {
    if (result.error) throw result.error;
  }

  return (
    <>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
          Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900">Ringkasan</h1>
        <p className="mt-2 text-stone-600">
          Pantau masukan dan akun pengguna Layoot.
        </p>
      </div>

      <section
        aria-label="Statistik"
        className="mt-4 grid gap-2 sm:grid-cols-2"
      >
        <article className="rounded-xl border-2 border-violet-200 bg-white p-5">
          <p className="text-sm font-medium text-stone-600">Total saran & masalah</p>
          <p className="mt-2 text-3xl font-bold text-violet-800">
            {feedbackResult.count ?? 0}
          </p>
        </article>
        <article className="rounded-xl border-2 border-violet-200 bg-white p-5">
          <p className="text-sm font-medium text-stone-600">Pengguna terdaftar</p>
          <p className="mt-2 text-3xl font-bold text-violet-800">
            {userResult.count ?? 0}
          </p>
        </article>
      </section>

      <section className="mt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Masukan terbaru</h2>
            <p className="mt-1 text-sm text-stone-600">
              Laporan yang terakhir dikirim pengguna.
            </p>
          </div>
          <Link
            href="/admin/masukan"
            className="text-sm font-bold text-violet-700 hover:text-violet-900"
          >
            Lihat semua →
          </Link>
        </div>
        {!recentResult.data?.length ? (
          <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
            Belum ada saran atau laporan masalah.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {recentResult.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.jenis === "masalah"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {item.jenis === "masalah" ? "Masalah" : "Saran"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-stone-800">{item.pesan}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(item.created_at).toLocaleString("id-ID")} ·{" "}
                    {item.halaman}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
