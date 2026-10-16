import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dasbor",
    name: "Layoot — Desain selebaran dan majalah",
    short_name: "Layoot",
    description:
      "Rancang selebaran dan majalah ukuran A4 dan F4 langsung dari browser.",
    lang: "id",
    dir: "ltr",
    start_url: "/dasbor?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a0a",
    theme_color: "#7c3aed",
    categories: ["productivity", "design", "graphics"],
    icons: [
      ...[72, 96, 128, 144, 152, 192, 384, 512].map((s) => ({
        src: `/icons/icon-${s}x${s}.png`,
        sizes: `${s}x${s}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/icons/maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Desain baru",
        short_name: "Baru",
        url: "/editor",
        icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Dasbor",
        url: "/dasbor",
        icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
      },
    ],
  };
}