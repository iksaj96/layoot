import Navbar from "@/app/components/Navbar";
import AuthForm from "@/app/components/AuthForm";

export const metadata = { title: "Masuk — Layoot" };

export default function MasukPage() {
  return (
    <div>
      <Navbar />
      <main className="flex justify-center px-5 py-14">
        <AuthForm mode="masuk" />
      </main>
    </div>
  );
}