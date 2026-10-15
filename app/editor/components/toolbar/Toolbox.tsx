import Icon, { IconButton } from "../ui/Icon";
import type { IconName } from "../ui/Icon";
import ImageUpload from "./ImageUpload";
import type { UploadedImage } from "./ImageUpload";
import type { Tool } from "../core/utils";

type Props = {
  tool: Tool;
  onTool: (t: Tool) => void;
  onImage: (img: UploadedImage) => void;
  onError: (pesan: string) => void;
};

const ALAT: { id: Tool; icon: IconName; label: string }[] = [
  { id: "pilih", icon: "pointer", label: "Pilih (V)" },
  { id: "teks", icon: "text", label: "Teks (T)" },
  { id: "persegi", icon: "rect", label: "Persegi (R)" },
  { id: "elips", icon: "ellipse", label: "Elips (E)" },
];

export default function Toolbox({ tool, onTool, onImage, onError }: Props) {
  return (
    <aside className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-stone-300 bg-stone-100 py-2">
      {ALAT.map((a) => (
        <IconButton
          key={a.id}
          icon={a.icon}
          label={a.label}
          active={tool === a.id}
          onClick={() => onTool(a.id)}
        />
      ))}

      <span className="my-1 h-px w-6 bg-stone-300" />

      <ImageUpload
        onUploaded={onImage}
        onError={onError}
        title="Tambah gambar"
        className="flex h-8 w-8 items-center justify-center rounded text-stone-700 hover:bg-stone-200 disabled:opacity-40"
      >
        <Icon name="image" />
      </ImageUpload>
    </aside>
  );
}