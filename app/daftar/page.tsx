import { Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import AuthForm from "@/app/components/AuthForm";

export const metadata = { title: "Daftar — Layoot" };

export default function DaftarPage() {
  return (
    <div>
      <Suspense
        fallback={
          <div
            className="h-16 border-b border-stone-200 bg-[#faf8f3]"
            aria-hidden="true"
          />
        }
      >
        <Navbar />
      </Suspense>
      <main className="flex justify-center px-5 py-14">
        <AuthForm mode="daftar" />
      </main>
    </div>
  );
}