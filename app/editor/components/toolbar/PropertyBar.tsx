import type { AlignAction } from "../core/utils";
import { IconButton } from "../ui/Icon";
import type { DesignElement } from "@/lib/types";

type Props = {
  selectedElements: DesignElement[];
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
  selectedElements,
  onAlign,
}: Props) {
  if (selectedElements.length === 0) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-black/5 p-1.5">
      <span className="mr-0.5 text-[10px] font-semibold text-stone-500">Rata</span>
      {alignButtons.map(({ action, icon, label }) => (
        <IconButton
          key={action}
          icon={icon}
          label={label}
          shortcut={action}
          small
          disabled={action !== "P" && selectedElements.length < 2}
          onClick={() => onAlign(action)}
        />
      ))}
    </div>
  );
}
