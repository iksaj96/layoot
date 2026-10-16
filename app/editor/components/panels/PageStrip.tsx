"use client";

import { useLayoutEffect, useRef } from "react";
import Icon from "../ui/Icon";

type Props = {
  total: number;
  active: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const actionStyle =
  "flex h-7 shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-white px-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-200 sm:px-2";

export default function PageStrip({
  total,
  active,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: Props) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active, total]);

  return (
    <div className="flex h-9 min-w-0 items-center gap-1 border-t border-stone-300 bg-stone-100 px-2">
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          title="Halaman sebelumnya"
          disabled={active === 0}
          onClick={() => onSelect(active - 1)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40"
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <span className="shrink-0 px-1 text-xs font-semibold text-stone-700">
          {active + 1} / {total}
        </span>
        <button
          type="button"
          aria-label="Halaman berikutnya"
          title="Halaman berikutnya"
          disabled={active === total - 1}
          onClick={() => onSelect(active + 1)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>

      <div
        ref={tabsRef}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            ref={i === active ? activeTabRef : undefined}
            type="button"
            aria-current={i === active ? "page" : undefined}
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
      </div>

      <button type="button" title="Tambah halaman" aria-label="Tambah halaman" onClick={onAdd} className={actionStyle}>
        <Icon name="plus" size={14} />
      </button>
      <button type="button" title="Duplikat halaman" aria-label="Duplikat halaman" onClick={onDuplicate} className={actionStyle}>
        <Icon name="copy" size={14} />
      </button>
      <button
        type="button"
        title="Hapus halaman"
        aria-label="Hapus halaman"
        disabled={total <= 1}
        onClick={onDelete}
        className={`${actionStyle} border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40`}
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}
