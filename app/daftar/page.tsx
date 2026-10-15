import Navbar from "@/app/components/Navbar";
import AuthForm from "@/app/components/AuthForm";

export const metadata = { title: "Daftar — Layoot" };

export default function DaftarPage() {
  return (
    <div>
      <Navbar />
      <main className="flex justify-center px-5 py-14">
        <AuthForm mode="daftar" />
      </main>
    </div>
  );
}