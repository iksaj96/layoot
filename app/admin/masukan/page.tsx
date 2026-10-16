import Link from "next/link";
import { connection } from "next/server";
import AdminFeedbackActions from "@/app/admin/masukan/AdminFeedbackActions";
import { getAdminContext } from "@/lib/admin";

const UKURAN_HALAMAN = 25;
type Props = { searchParams: Promise<{ jenis?: string; halaman?: string }> };

export const metadata = { title: "Saran & masalah — Admin Layoot" };

export default async function MasukanAdminPage({ searchParams }: Props) {
  await connection();
  const { supabase, isAdmin } = await getAdminContext();
  if (!isAdmin) return null;

  const params = await searchParams;
  const jenis = params.jenis === "masalah" || params.jenis === "saran"
    ? params.jenis
    : "";
  const requestedPage = Number(params.halaman);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const from = (page - 1) * UKURAN_HALAMAN;

  let query = supabase
    .from("feedback_reports")
    .select("id, user_id, design_id, jenis, pesan, halaman, user_agent, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + UKURAN_HALAMAN - 1);

  if (jenis) query = query.eq("jenis", jenis);

  const { data: laporan, count, error } = await query;
  if (error) throw error;

  const userIds = [...new Set((laporan ?? []).map((item) => item.user_id))];
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds)
    : { data: [], error: null };
  if (profilesError) throw profilesError;

  const profilPerId = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  const totalHalaman = Math.max(1, Math.ceil((count ?? 0) / UKURAN_HALAMAN));

  return (
    <>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
          Masukan pengguna
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900">
          Saran & masalah
        </h1>
        <p className="mt-2 text-stone-600">
          {count ?? 0} laporan{jenis ? ` berjenis ${jenis}` : " masuk"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter jenis masukan" className="flex flex-wrap gap-2">
          {[
            { href: "/admin/masukan", label: "Semua", value: "" },
            { href: "/admin/masukan?jenis=masalah", label: "Masalah", value: "masalah" },
            { href: "/admin/masukan?jenis=saran", label: "Saran", value: "saran" },
          ].map((filter) => (
            <Link
              key={filter.value || "semua"}
              href={filter.href}
              aria-current={jenis === filter.value ? "page" : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                jenis === filter.value
                  ? "bg-violet-700 text-white"
                  : "border border-stone-300 bg-white text-stone-700 hover:bg-violet-50"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/masukan/ekspor?jenis=masalah"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-violet-50"
          >
            Ekspor masalah
          </a>
          <a
            href="/admin/masukan/ekspor?jenis=saran"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-violet-50"
          >
            Ekspor saran
          </a>
        </div>
      </div>

      {!laporan?.length ? (
        <p className="mt-5 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
          Belum ada masukan untuk filter ini.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {laporan.map((item) => {
            const profile = profilPerId.get(item.user_id);
            return (
              <li
                key={item.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.jenis === "masalah"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.jenis === "masalah" ? "Masalah" : "Saran"}
                  </span>
                  <time
                    dateTime={item.created_at}
                    className="text-xs text-stone-500"
                  >
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </time>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-800">
                  {item.pesan}
                </p>
                <AdminFeedbackActions id={item.id} pesan={item.pesan} />
                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold text-stone-700">Pengguna: </dt>
                    <dd className="inline">
                      {profile?.full_name || profile?.email || "Profil tidak ditemukan"}
                      {profile?.full_name && profile.email ? ` (${profile.email})` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-stone-700">Halaman: </dt>
                    <dd className="inline break-all">{item.halaman}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="inline font-semibold text-stone-700">ID desain: </dt>
                    <dd className="inline break-all">{String(item.design_id)}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}

      {totalHalaman > 1 && (
        <nav
          aria-label="Halaman daftar masukan"
          className="mt-6 flex items-center justify-between"
        >
          {page > 1 ? (
            <Link
              href={`/admin/masukan?${jenis ? `jenis=${jenis}&` : ""}halaman=${page - 1}`}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-violet-50"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-stone-600">
            Halaman {page} dari {totalHalaman}
          </span>
          {page < totalHalaman && (
            <Link
              href={`/admin/masukan?${jenis ? `jenis=${jenis}&` : ""}halaman=${page + 1}`}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-violet-50"
            >
              Berikutnya →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
