import type { DesignElement } from "@/lib/types";
import Icon from "../ui/Icon";
import type { IconName } from "../ui/Icon";

type Props = {
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const IKON: Record<DesignElement["type"], IconName> = {
  text: "text",
  rect: "rect",
  ellipse: "ellipse",
  image: "image",
};

const NAMA: Record<DesignElement["type"], string> = {
  text: "Teks",
  rect: "Persegi",
  ellipse: "Elips",
  image: "Gambar",
};

export default function LayersPanel({ elements, selectedId, onSelect }: Props) {
  return (
    <aside className="hidden w-48 shrink-0 flex-col border-l border-stone-300 bg-stone-100 md:flex">
      <div className="flex items-center gap-2 border-b border-stone-300 px-3 py-2 text-xs font-bold text-stone-700">
        <Icon name="layers" size={14} />
        Objek
      </div>

      {elements.length === 0 ? (
        <p className="p-3 text-xs text-stone-500">Belum ada objek di halaman ini.</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-auto p-1">
          {[...elements].reverse().map((el) => (
            <li key={el.id}>
              <button
                onClick={() => onSelect(el.id)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                  el.id === selectedId
                    ? "bg-indigo-600 text-white"
                    : "text-stone-800 hover:bg-stone-200"
                }`}
              >
                <Icon name={IKON[el.type]} size={14} />
                <span className="truncate">
                  {el.type === "text" && el.text
                    ? el.text.slice(0, 22)
                    : NAMA[el.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}