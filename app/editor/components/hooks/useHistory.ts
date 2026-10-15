"use client";

import { useCallback, useReducer } from "react";

const BATAS = 100; // jumlah langkah undo maksimal
const JEDA_GABUNG = 700; // ms, perubahan beruntun dengan kunci sama digabung

type Snap<T> = {
  past: T[];
  present: T;
  future: T[];
  kunci: string;
  waktu: number;
};

type Aksi<T> =
  | { jenis: "set"; ubah: (prev: T) => T; kunci?: string; waktu: number }
  | { jenis: "undo" }
  | { jenis: "redo" };

function reducer<T>(s: Snap<T>, a: Aksi<T>): Snap<T> {
  switch (a.jenis) {
    case "set": {
      const next = a.ubah(s.present);
      if (next === s.present) return s;
      const gabung =
        a.kunci !== undefined &&
        a.kunci === s.kunci &&
        a.waktu - s.waktu < JEDA_GABUNG;
      return {
        past: gabung ? s.past : [...s.past.slice(-(BATAS - 1)), s.present],
        present: next,
        future: [],
        kunci: a.kunci ?? "",
        waktu: a.waktu,
      };
    }
    case "undo": {
      if (s.past.length === 0) return s;
      return {
        past: s.past.slice(0, -1),
        present: s.past[s.past.length - 1],
        future: [s.present, ...s.future],
        kunci: "",
        waktu: 0,
      };
    }
    case "redo": {
      if (s.future.length === 0) return s;
      const [next, ...sisa] = s.future;
      return {
        past: [...s.past, s.present],
        present: next,
        future: sisa,
        kunci: "",
        waktu: 0,
      };
    }
  }
}

export function useHistory<T>(awal: () => T) {
  const [s, dispatch] = useReducer(
    reducer<T>,
    undefined,
    (): Snap<T> => ({ past: [], present: awal(), future: [], kunci: "", waktu: 0 })
  );

  /** kunci: perubahan beruntun dengan kunci sama (dalam 0,7 dtk) jadi satu langkah undo. */
  const set = useCallback(
    (ubah: (prev: T) => T, kunci?: string) =>
      dispatch({ jenis: "set", ubah, kunci, waktu: Date.now() }),
    []
  );
  const undo = useCallback(() => dispatch({ jenis: "undo" }), []);
  const redo = useCallback(() => dispatch({ jenis: "redo" }), []);

  return {
    state: s.present,
    set,
    undo,
    redo,
    canUndo: s.past.length > 0,
    canRedo: s.future.length > 0,
  };
}