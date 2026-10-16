import { getAdminContext } from "@/lib/admin";

type Context = { params: Promise<{ id: string }> };

async function getAuthorizedReportId({ params }: Context) {
  const { supabase, user, isAdmin } = await getAdminContext();
  if (!user) {
    return { response: Response.json({ error: "Autentikasi diperlukan." }, { status: 401 }) };
  }
  if (!isAdmin) {
    return { response: Response.json({ error: "Akses ditolak." }, { status: 403 }) };
  }

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { response: Response.json({ error: "ID laporan tidak valid." }, { status: 400 }) };
  }

  return { id, supabase };
}

export async function PATCH(request: Request, context: Context) {
  const authorized = await getAuthorizedReportId(context);
  if ("response" in authorized) return authorized.response;
  const { id, supabase } = authorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("pesan" in body) ||
    typeof body.pesan !== "string"
  ) {
    return Response.json({ error: "Isi laporan tidak valid." }, { status: 400 });
  }

  const pesan = body.pesan;
  const panjang = Array.from(pesan).length;
  if (!pesan.trim() || panjang > 2000) {
    return Response.json(
      { error: "Isi laporan harus terdiri dari 1 hingga 2000 karakter." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("feedback_reports")
    .update({ pesan })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data.length) {
    return Response.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }

  return Response.json({ success: true });
}

export async function DELETE(_request: Request, context: Context) {
  const authorized = await getAuthorizedReportId(context);
  if ("response" in authorized) return authorized.response;
  const { id, supabase } = authorized;

  const { data, error } = await supabase
    .from("feedback_reports")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data.length) {
    return Response.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }

  return Response.json({ success: true });
}
