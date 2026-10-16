import type { DesignElement } from "@/lib/types";
import { IconButton } from "../ui/Icon";
import type { Mode, Tool } from "../core/utils";
import { round } from "../core/utils";

const NAMA_ALAT: Record<Tool, string> = {
  pilih: "Alat Pilih",
  teks: "Alat Teks",
  persegi: "Alat Persegi",
  elips: "Alat Elips",
  garis: "Alat Garis",
  crop: "Alat Crop",
};

const NAMA_OBJEK: Record<DesignElement["type"], string> = {
  text: "Teks",
  rect: "Persegi",
  ellipse: "Elips",
  image: "Gambar",
  line: "Garis",
};

type Props = {
  tool: Tool;
  mode: Mode;
  selected: DesignElement | null;
  selectedCount: number;
  showModeControls: boolean;
  pesan: string;
  zoom: number;
  onZoom: (faktor: number) => void;
  onFit: () => void;
  onMode: (mode: Mode) => void;
};

export default function StatusBar({
  tool,
  mode,
  selected,
  selectedCount,
  showModeControls,
  pesan,
  zoom,
  onZoom,
  onFit,
  onMode,
}: Props) {
  const cornerSupported =
    selected?.type === "rect" || selected?.type === "image";
  let info = tool === "crop"
    ? "Crop: seret area pada objek untuk memangkasnya · Shift+X"
    : "Tidak ada objek terpilih · Scroll = zoom · Klik roda tengah + geser = pindah tampilan";
  if (selectedCount > 1 && tool !== "crop") {
    info = `${selectedCount} objek terpilih · Mode ukuran`;
  }
  if (selected && tool !== "crop") {
    info =
      mode === "putar"
        ? "Mode putar/balik · seret pegangan putar · penanda tengah atau Alt+1/2/3 untuk ganti mode"
        : mode === "sudut" &&
            cornerSupported
          ? `Mode sudut · ${selected.radius ?? 0} mm · seret titik oranye · penanda tengah atau Alt+1/2/3 untuk ganti mode`
          : `${NAMA_OBJEK[selected.type]} · ${round(selected.w)} × ${round(selected.h)} mm · di (${selected.x}; ${selected.y}) · Mode ukuran · penanda tengah atau Alt+1/2/3 untuk ganti mode`;
  }
  if (pesan) info = pesan;

  return (
    <div className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-stone-300 bg-stone-200 px-2 text-xs text-stone-700">
      <span className={`min-w-0 truncate ${pesan ? "font-semibold text-red-700" : ""}`}>
        {info}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {selected && showModeControls && tool !== "crop" && (
          <div className="mr-1 flex items-center gap-0.5" aria-label="Mode transformasi">
            {([
              ["ukuran", "Ukuran"],
              ["putar", "Putar"],
              ["sudut", "Sudut"],
            ] as const).map(([value, label]) => {
              const disabled = value === "sudut" && !cornerSupported;
              const title = disabled
                ? `Sudut tidak tersedia untuk ${NAMA_OBJEK[selected.type].toLocaleLowerCase()}.`
                : `Mode ${label.toLocaleLowerCase()} (Alt+${value === "ukuran" ? "1" : value === "putar" ? "2" : "3"})`;
              return (
                <button
                  key={value}
                  type="button"
                  title={title}
                  aria-label={title}
                  aria-pressed={mode === value}
                  disabled={disabled}
                  onClick={() => onMode(value)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    mode === value
                      ? "bg-indigo-600 text-white"
                      : "text-stone-700 hover:bg-stone-300"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
        <span className="hidden pr-2 sm:inline">{NAMA_ALAT[tool]}</span>
        <IconButton small icon="minus" label="Perkecil" shortcut="Ctrl/Cmd+-" onClick={() => onZoom(1 / 1.25)} />
        <button
          type="button"
          title="Muat ke layar (Ctrl/Cmd+0)"
          onClick={onFit}
          className="w-12 rounded text-center font-semibold hover:bg-stone-300"
        >
          {zoom}%
        </button>
        <IconButton small icon="plus" label="Perbesar" shortcut="Ctrl/Cmd+=" onClick={() => onZoom(1.25)} />
      </div>
    </div>
  );
}