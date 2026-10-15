import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BookPreview from "@/app/editor/components/preview/BookPreview";
import { createServerSupabase } from "@/lib/supabase-server";
import type { EditorDesign } from "@/lib/types";

export const metadata: Metadata = { title: "Preview — Layoot" };

async function PreviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { data } = await supabase
    .from("designs")
    .select("id, title, paper, orientation, pages")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <BookPreview design={data as EditorDesign} />;
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900 text-stone-400">
          Memuat preview...
        </p>
      }
    >
      <PreviewContent params={params} />
    </Suspense>
  );
}