import { IconButton } from "../ui/Icon";

type Props = {
  total: number;
  active: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export default function PageStrip({
  total,
  active,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-t border-stone-300 bg-stone-100 px-2">
      <IconButton
        icon="chevronLeft"
        label="Halaman sebelumnya"
        disabled={active === 0}
        onClick={() => onSelect(active - 1)}
      />
      <span className="shrink-0 px-1 text-xs font-semibold text-stone-700">
        {active + 1} / {total}
      </span>
      <IconButton
        icon="chevronRight"
        label="Halaman berikutnya"
        disabled={active === total - 1}
        onClick={() => onSelect(active + 1)}
      />

      <span className="mx-1 h-5 w-px shrink-0 bg-stone-300" />

      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-7 shrink-0 rounded-t border-b-2 px-3 text-xs font-semibold ${
            i === active
              ? "border-indigo-600 bg-white text-stone-900"
              : "border-transparent text-stone-600 hover:bg-stone-200"
          }`}
        >
          Halaman {i + 1}
        </button>
      ))}

      <span className="mx-1 h-5 w-px shrink-0 bg-stone-300" />

      <IconButton icon="plus" label="Tambah halaman" onClick={onAdd} />
      <IconButton icon="copy" label="Duplikat halaman" onClick={onDuplicate} />
      <IconButton
        icon="trash"
        label="Hapus halaman"
        danger
        disabled={total <= 1}
        onClick={onDelete}
      />
    </div>
  );
}