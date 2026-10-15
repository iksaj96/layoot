import type { DesignElement } from "@/lib/types";
import { IconButton } from "../ui/Icon";
import type { Mode, Tool } from "../core/utils";

const NAMA_ALAT: Record<Tool, string> = {
  pilih: "Alat Pilih",
  teks: "Alat Teks",
  persegi: "Alat Persegi",
  elips: "Alat Elips",
};

const NAMA_OBJEK: Record<DesignElement["type"], string> = {
  text: "Teks",
  rect: "Persegi",
  ellipse: "Elips",
  image: "Gambar",
};

type Props = {
  tool: Tool;
  mode: Mode;
  selected: DesignElement | null;
  pesan: string;
  zoom: number;
  onZoom: (faktor: number) => void;
  onFit: () => void;
};

export default function StatusBar({
  tool,
  mode,
  selected,
  pesan,
  zoom,
  onZoom,
  onFit,
}: Props) {
  let info = "Tidak ada objek terpilih · Scroll = zoom · Klik roda tengah + geser = pindah tampilan";
  if (selected) {
    info =
      mode === "sudut" && selected.type === "rect"
        ? `Mode sudut · ${selected.radius ?? 0} mm · seret titik oranye, klik objek lagi untuk kembali`
        : `${NAMA_OBJEK[selected.type]} · ${selected.w} × ${selected.h} mm · di (${selected.x}; ${selected.y})`;
  }
  if (pesan) info = pesan;

  return (
    <div className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-stone-300 bg-stone-200 px-2 text-xs text-stone-700">
      <span className={`min-w-0 truncate ${pesan ? "font-semibold text-red-700" : ""}`}>
        {info}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden pr-2 sm:inline">{NAMA_ALAT[tool]}</span>
        <IconButton small icon="minus" label="Perkecil (Ctrl+-)" onClick={() => onZoom(1 / 1.25)} />
        <button
          type="button"
          title="Muat ke layar (Ctrl+0)"
          onClick={onFit}
          className="w-12 rounded text-center font-semibold hover:bg-stone-300"
        >
          {zoom}%
        </button>
        <IconButton small icon="plus" label="Perbesar (Ctrl+=)" onClick={() => onZoom(1.25)} />
      </div>
    </div>
  );
}