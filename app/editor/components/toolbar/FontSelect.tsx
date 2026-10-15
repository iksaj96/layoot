"use client";

import { FONTS, fontCss } from "../core/fonts";

type Props = {
  value?: string;
  onChange: (nama: string) => void;
};

export default function FontSelect({ value, onChange }: Props) {
  const umum = FONTS.filter((f) => f.grup === "Umum");
  const google = FONTS.filter((f) => f.grup === "Google");

  return (
    <select
      title="Jenis huruf"
      aria-label="Jenis huruf"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-36 shrink-0 rounded border border-stone-300 bg-white px-1 text-xs text-stone-900"
      style={{ fontFamily: fontCss(value) }}
    >
      <option value="">Bawaan</option>
      <optgroup label="Umum (Word)">
        {umum.map((f) => (
          <option key={f.nama} value={f.nama} style={{ fontFamily: f.css }}>
            {f.nama}
          </option>
        ))}
      </optgroup>
      <optgroup label="Google Fonts">
        {google.map((f) => (
          <option key={f.nama} value={f.nama} style={{ fontFamily: f.css }}>
            {f.nama}
          </option>
        ))}
      </optgroup>
    </select>
  );
}