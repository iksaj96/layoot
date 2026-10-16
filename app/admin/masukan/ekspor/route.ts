import { getAdminContext } from "@/lib/admin";

const UKURAN_BATCH = 1000;

function csvCell(value: string | null) {
  const text = value ?? "";
  const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const jenis = new URL(request.url).searchParams.get("jenis");
  if (jenis !== "masalah" && jenis !== "saran") {
    return new Response("Jenis ekspor tidak valid.", { status: 400 });
  }

  const { supabase, user, isAdmin } = await getAdminContext();
  if (!user) return new Response("Autentikasi diperlukan.", { status: 401 });
  if (!isAdmin) return new Response("Akses ditolak.", { status: 403 });

  const baris: string[] = [];

  for (let offset = 0; ; offset += UKURAN_BATCH) {
    const { data, error } = await supabase
      .from("feedback_reports")
      .select("pesan")
      .eq("jenis", jenis)
      .order("created_at", { ascending: true })
      .range(offset, offset + UKURAN_BATCH - 1);

    if (error) throw error;

    for (const item of data) {
      baris.push(
        csvCell(item.pesan)
      );
    }

    if (data.length < UKURAN_BATCH) break;
  }

  return new Response(baris.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="masukan-${jenis}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
