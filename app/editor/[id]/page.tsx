import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import Editor from "@/app/editor/components/Editor";
import type { EditorDesign } from "@/lib/types";

export const metadata = { title: "Editor — Layoot" };

type Props = { params: Promise<{ id: string }> };

async function EditorIsi({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { data } = await supabase
    .from("designs")
    .select("id, title, paper, orientation, pages, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <Editor design={data as EditorDesign} />;
}

export default function EditorPage({ params }: Props) {
  return (
    <Suspense
      fallback={<p className="p-10 text-center text-stone-600">Memuat editor...</p>}
    >
      <EditorIsi params={params} />
    </Suspense>
  );
}