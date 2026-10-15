import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Layoot — Desain selebaran dan majalah",
  description:
    "Rancang selebaran dan majalah ukuran A4 dan F4 langsung dari browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans">{children}</body>
    </html>
  );
}