"use client";

import { useEffect, useMemo, useState } from "react";
import { SHORTCUTS } from "../core/shortcuts";

export default function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const groups = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const filtered = SHORTCUTS.filter((shortcut) =>
      `${shortcut.key} ${shortcut.label} ${shortcut.description} ${shortcut.category}`
        .toLocaleLowerCase()
        .includes(term)
    );
    const categories = [...new Set(SHORTCUTS.map((shortcut) => shortcut.category))];
    return categories
      .map((category) => ({
        category,
        shortcuts: filtered.filter((shortcut) => shortcut.category === category),
      }))
      .filter((group) => group.shortcuts.length > 0);
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pintasan Keyboard"
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-4 text-stone-900 shadow-xl dark:bg-stone-900 dark:text-stone-100 sm:p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">Pintasan Keyboard</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm font-semibold text-stone-700 hover:bg-stone-200 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            Tutup
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari tombol atau fungsi..."
          aria-label="Cari shortcut"
          className="mb-4 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />

        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">Shortcut tidak ditemukan.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map(({ category, shortcuts }) => (
              <section key={category}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <li
                      key={`${category}-${shortcut.key}-${shortcut.label}-${index}`}
                      className="grid grid-cols-[minmax(6rem,max-content)_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 text-xs"
                    >
                      <kbd className="w-fit max-w-full whitespace-normal rounded border border-stone-300 bg-stone-100 px-1.5 py-1 font-mono text-[11px] text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
                        {shortcut.key}
                      </kbd>
                      <span className="font-semibold text-stone-800 dark:text-stone-100">
                        {shortcut.label}
                      </span>
                      <span className="col-start-2 text-stone-600 dark:text-stone-300">
                        {shortcut.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
