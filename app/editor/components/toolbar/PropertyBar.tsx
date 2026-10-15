import type { AlignAction } from "../core/utils";
import { IconButton } from "../ui/Icon";
import type { DesignElement, Paper } from "@/lib/types";

type Props = {
  selected: DesignElement | null;
  selectedElements: DesignElement[];
  paper: Paper;
  size: { w: number; h: number };
  onAlign: (action: AlignAction) => void;
};

const alignButtons: {
  action: AlignAction;
  label: string;
  icon:
    | "alignCenterVertical"
    | "alignCenterHorizontal"
    | "alignLeft"
    | "alignRight"
    | "alignTop"
    | "alignBottom"
    | "centerPage";
}[] = [
  { action: "C", icon: "alignCenterVertical", label: "Rata tengah vertikal" },
  { action: "E", icon: "alignCenterHorizontal", label: "Rata tengah horizontal" },
  { action: "L", icon: "alignLeft", label: "Rata kiri" },
  { action: "R", icon: "alignRight", label: "Rata kanan" },
  { action: "T", icon: "alignTop", label: "Rata atas" },
  { action: "B", icon: "alignBottom", label: "Rata bawah" },
  { action: "P", icon: "centerPage", label: "Pusatkan ke halaman" },
];

export default function PropertyBar({
  selected,
  selectedElements,
  paper,
  size,
  onAlign,
}: Props) {
  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-1.5 border-b border-stone-300 bg-stone-100 px-3 py-1">
      {selectedElements.length > 0 ? (
        <>
          <span className="mr-1 text-xs font-semibold text-stone-600">Align</span>
          {alignButtons.map(({ action, icon, label }) => (
            <IconButton
              key={action}
              icon={icon}
              label={label}
              shortcut={action}
              disabled={action !== "P" && selectedElements.length < 2}
              onClick={() => onAlign(action)}
            />
          ))}
          <span className="ml-1 text-xs text-stone-600">
            {selectedElements.length} objek terpilih
          </span>
        </>
      ) : (
        <span className="text-xs text-stone-600">
          <span className="font-bold text-stone-800">
            Kertas {paper} · {size.w} × {size.h} mm
          </span>
          <span className="ml-2">
            {selected ? "Properti objek tersedia di panel kanan." : "Pilih objek untuk mengubah propertinya."}
          </span>
        </span>
      )}
    </div>
  );
}
