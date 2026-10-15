export type FontDef = {
  nama: string;
  css: string;
  grup: "Umum" | "Google";
  google?: string; // spesifikasi family untuk Google Fonts
};

/*
  Font "Umum" memakai font sistem bila ada (Word/Windows/Mac), dan
  pengganti metrik-setara dari Google Fonts bila tidak ada
  (Tinos = Times New Roman, Arimo = Arial, Cousine = Courier New, dst.)
  supaya tata letak dan PDF tetap sama di perangkat mana pun.
*/
export const FONTS: FontDef[] = [
  { nama: "Times New Roman", css: '"Times New Roman", Tinos, Times, serif', grup: "Umum", google: "Tinos:wght@400;700" },
  { nama: "Arial", css: "Arial, Arimo, Helvetica, sans-serif", grup: "Umum", google: "Arimo:wght@400;700" },
  { nama: "Calibri", css: "Calibri, Carlito, Lato, sans-serif", grup: "Umum", google: "Lato:wght@400;700" },
  { nama: "Cambria", css: "Cambria, Caladea, Georgia, serif", grup: "Umum", google: "Caladea:wght@400;700" },
  { nama: "Georgia", css: "Georgia, Gelasio, serif", grup: "Umum", google: "Gelasio:wght@400;700" },
  { nama: "Courier New", css: '"Courier New", Cousine, monospace', grup: "Umum", google: "Cousine:wght@400;700" },
  { nama: "Verdana", css: 'Verdana, "DejaVu Sans", sans-serif', grup: "Umum" },

  { nama: "Inter", css: "Inter, sans-serif", grup: "Google", google: "Inter:wght@400;700" },
  { nama: "Roboto", css: "Roboto, sans-serif", grup: "Google", google: "Roboto:wght@400;700" },
  { nama: "Open Sans", css: '"Open Sans", sans-serif', grup: "Google", google: "Open+Sans:wght@400;700" },
  { nama: "Montserrat", css: "Montserrat, sans-serif", grup: "Google", google: "Montserrat:wght@400;700" },
  { nama: "Poppins", css: "Poppins, sans-serif", grup: "Google", google: "Poppins:wght@400;700" },
  { nama: "Nunito", css: "Nunito, sans-serif", grup: "Google", google: "Nunito:wght@400;700" },
  { nama: "Raleway", css: "Raleway, sans-serif", grup: "Google", google: "Raleway:wght@400;700" },
  { nama: "Source Sans 3", css: '"Source Sans 3", sans-serif', grup: "Google", google: "Source+Sans+3:wght@400;700" },
  { nama: "Playfair Display", css: '"Playfair Display", serif', grup: "Google", google: "Playfair+Display:wght@400;700" },
  { nama: "Merriweather", css: "Merriweather, serif", grup: "Google", google: "Merriweather:wght@400;700" },
  { nama: "Lora", css: "Lora, serif", grup: "Google", google: "Lora:wght@400;700" },
  { nama: "Oswald", css: "Oswald, sans-serif", grup: "Google", google: "Oswald:wght@400;700" },
  { nama: "Roboto Mono", css: '"Roboto Mono", monospace', grup: "Google", google: "Roboto+Mono:wght@400;700" },
  { nama: "Bebas Neue", css: '"Bebas Neue", sans-serif', grup: "Google", google: "Bebas+Neue" },
  { nama: "Pacifico", css: "Pacifico, cursive", grup: "Google", google: "Pacifico" },
  { nama: "Lobster", css: "Lobster, cursive", grup: "Google", google: "Lobster" },
  { nama: "Dancing Script", css: '"Dancing Script", cursive', grup: "Google", google: "Dancing+Script:wght@400;700" },
  { nama: "Caveat", css: "Caveat, cursive", grup: "Google", google: "Caveat:wght@400;700" },
];

export function fontCss(nama?: string): string {
  if (!nama) return "inherit";
  return FONTS.find((f) => f.nama === nama)?.css ?? "inherit";
}

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  FONTS.filter((f) => f.google)
    .map((f) => `family=${f.google}`)
    .join("&") +
  "&display=swap";