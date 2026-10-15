import { IconButton } from "../ui/Icon";
import type { IconName } from "../ui/Icon";
import type { Tool } from "../core/utils";
import type { SidebarTab } from "./EditorSidebar";

type Props = {
  tool: Tool;
  onTool: (t: Tool) => void;
  activeTab: SidebarTab;
  onTab: (tab: SidebarTab) => void;
};

const ALAT: { id: Tool; icon: IconName; label: string; shortcut: string }[] = [
  { id: "pilih", icon: "pointer", label: "Pilih", shortcut: "V" },
  { id: "teks", icon: "text", label: "Teks", shortcut: "Shift+T" },
  { id: "persegi", icon: "rect", label: "Persegi", shortcut: "Shift+R" },
  { id: "elips", icon: "ellipse", label: "Elips", shortcut: "Shift+E" },
  { id: "garis", icon: "line", label: "Garis", shortcut: "Shift+L" },
  { id: "crop", icon: "crop", label: "Crop", shortcut: "Shift+X" },
];

export default function Toolbox({
  tool,
  onTool,
  activeTab,
  onTab,
}: Props) {
  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-stone-300 bg-stone-100 py-2">
      {ALAT.map((a) => (
        <IconButton
          key={a.id}
          icon={a.icon}
          label={`Alat ${a.label}`}
          shortcut={a.shortcut}
          active={tool === a.id}
          onClick={() => onTool(a.id)}
        />
      ))}

      <span className="my-1 h-px w-6 bg-stone-300" />

      <IconButton
        icon="image"
        label="Buka katalog gambar"
        active={activeTab === "catalog"}
        onClick={() => onTab("catalog")}
      />
      <IconButton
        icon="fill"
        label="Buka properti objek"
        active={activeTab === "properties"}
        onClick={() => onTab("properties")}
      />
      <IconButton
        icon="layers"
        label="Buka daftar objek"
        active={activeTab === "layers"}
        onClick={() => onTab("layers")}
      />
    </aside>
  );
}