import Link from "next/link";
import { getAdminContext } from "@/lib/admin";

const UKURAN_HALAMAN = 25;
type Props = { searchParams: Promise<{ halaman?: string }> };

export const metadata = { title: "Manajemen pengguna — Admin Layoot" };

export default async function PenggunaAdminPage({ searchParams }: Props) {
  const { supabase, isAdmin } = await getAdminContext();
  if (!isAdmin) return null;

  const params = await searchParams;
  const requestedPage = Number(params.halaman);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const from = (page - 1) * UKURAN_HALAMAN;

  const { data: pengguna, count, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + UKURAN_HALAMAN - 1);

  if (error) throw error;

  const totalHalaman = Math.max(1, Math.ceil((count ?? 0) / UKURAN_HALAMAN));

  return (
    <>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
          Akun Layoot
        </p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900">
          Manajemen pengguna
        </h1>
        <p className="mt-2 text-stone-600">
          {count ?? 0} akun terdaftar, diurutkan dari yang terbaru.
        </p>
      </div>

      {!pengguna?.length ? (
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
          Belum ada data pengguna.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead className="bg-violet-50 text-xs uppercase tracking-wide text-violet-900">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Nama</th>
                <th scope="col" className="px-4 py-3 font-bold">Email</th>
                <th scope="col" className="px-4 py-3 font-bold">Terdaftar</th>
                <th scope="col" className="px-4 py-3 font-bold">ID akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pengguna.map((profile) => (
                <tr key={profile.id} className="align-top hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {profile.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {profile.email || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                    {new Date(profile.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="max-w-48 break-all px-4 py-3 font-mono text-xs text-stone-500">
                    {profile.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalHalaman > 1 && (
        <nav
          aria-label="Halaman daftar pengguna"
          className="mt-6 flex items-center justify-between"
        >
          {page > 1 ? (
            <Link
              href={`/admin/pengguna?halaman=${page - 1}`}
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
              href={`/admin/pengguna?halaman=${page + 1}`}
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
