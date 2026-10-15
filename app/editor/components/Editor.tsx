"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { PAPER_SIZE_MM } from "@/lib/types";
import type { DesignElement, DesignPage, EditorDesign } from "@/lib/types";
import Canvas from "./canvas/Canvas";
import ExportPdf from "./export/ExportPdf";
import LayersPanel from "./panels/LayersPanel";
import PageStrip from "./panels/PageStrip";
import ShortcutHelp from "./panels/ShortcutHelp";
import StatusBar from "./panels/StatusBar";
import PropertyBar from "./toolbar/PropertyBar";
import Toolbox from "./toolbar/Toolbox";
import type { UploadedImage } from "./toolbar/ImageUpload";
import Icon, { IconButton } from "./ui/Icon";
import { cloneElement, moveLayer, ubahElemen } from "./core/elementOps";
import type { LayerOp } from "./core/elementOps";
import { calculateTextFlow } from "./core/textFlow";
import {
  LABEL_STATUS,
  MAX_SCALE,
  MIN_SCALE,
  PX_PER_MM,
  clamp,
  round,
  uid,
} from "./core/utils";
import type { Mode, Status, Tool } from "./core/utils";
import { useGoogleFonts } from "./hooks/useGoogleFonts";
import { useHistory } from "./hooks/useHistory";
import { useShortcuts } from "./hooks/useShortcuts";
import type { AksiPintasan } from "./hooks/useShortcuts";

const ELEMEN_KOSONG: DesignElement[] = [];
const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const subscribeToFonts = (notify: () => void) => {
  if (typeof document === "undefined") return () => {};
  document.fonts.addEventListener("loadingdone", notify);
  return () => document.fonts.removeEventListener("loadingdone", notify);
};
const getFontsSnapshot = () =>
  typeof document !== "undefined" && document.fonts.status === "loaded";
const getServerFontsSnapshot = () => false;

export default function Editor({ design }: { design: EditorDesign }) {
  useGoogleFonts();

  const base = PAPER_SIZE_MM[design.paper];
  const size =
    design.orientation === "landscape" ? { w: base.h, h: base.w } : base;

  const [title, setTitle] = useState(design.title);
  const {
    state: pages,
    set: setPages,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<DesignPage[]>(() =>
    Array.isArray(design.pages) && design.pages.length > 0
      ? design.pages
      : [{ id: "p1", elements: [] }]
  );

  const [active, setActive] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("pilih");
  const [mode, setMode] = useState<Mode>("ukuran");
  const [pesan, setPesan] = useState("");
  const [scale, setScale] = useState(1.2); // px per mm
  const [status, setStatus] = useState<Status>("tersimpan");
  const [helpOpen, setHelpOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );
  const fontsReady = useSyncExternalStore(
    subscribeToFonts,
    getFontsSnapshot,
    getServerFontsSnapshot
  );

  const papan = useRef<DesignElement | null>(null);
  const geserTempel = useRef(0);

  // Undo bisa mengurangi jumlah halaman, jadi indeks aktif dijaga di batas
  const hal = Math.min(active, pages.length - 1);
  const elements = pages[hal]?.elements ?? ELEMEN_KOSONG;
  const selected = elements.find((e) => e.id === selectedId) ?? null;
  const textFlow = useMemo(
    () => calculateTextFlow(elements, hydrated && fontsReady),
    [elements, fontsReady, hydrated]
  );
  const textBoxes = elements.filter((el) => el.type === "text");
  const textBoxOptions =
    selected?.type === "text"
      ? textBoxes
          .map((box, index) => ({ box, label: `Kotak teks ${index + 1}` }))
          .filter(({ box }) => {
            if (box.id === selected.id) return false;
            if (box.id === selected.nextTextBoxId) return true;
            const hasIncoming = textBoxes.some(
              (el) => el.id !== selected.id && el.nextTextBoxId === box.id
            );
            if (hasIncoming) return false;

            const visited = new Set<string>();
            let current: DesignElement | undefined = box;
            while (current && !visited.has(current.id)) {
              if (current.id === selected.id) return false;
              visited.add(current.id);
              current = textBoxes.find(
                (el) => el.id === current?.nextTextBoxId
              );
            }
            return true;
          })
          .map(({ box, label }) => ({ id: box.id, label }))
      : [];

  /* ---------- Zoom ---------- */

  const fitScale = useCallback(() => {
    const md = window.innerWidth >= 768;
    const margin = 32;
    const lebar = window.innerWidth - 44 - (md ? 192 : 0) - margin * 2;
    const tinggi = window.innerHeight - 152 - margin * 2;
    const s = Math.min(lebar / size.w, tinggi / size.h);
    return clamp(Math.floor(s * 100) / 100, MIN_SCALE, MAX_SCALE);
  }, [size.w, size.h]);

  useEffect(() => {
    setScale(fitScale());
  }, [fitScale]);

  const zoom = useCallback((faktor: number) => {
    setScale((s) => clamp(Math.round(s * faktor * 1000) / 1000, MIN_SCALE, MAX_SCALE));
  }, []);

  /* ---------- Simpan otomatis ---------- */

  const terbaru = useRef({ pages, title });
  useEffect(() => {
    terbaru.current = { pages, title };
  });

  const simpanId = useRef(0);
  const pertama = useRef(true);

  const kirim = useCallback(async () => {
    const { pages: p, title: t } = terbaru.current;
    const id = ++simpanId.current;
    setStatus("menyimpan");
    const { error } = await createClient()
      .from("designs")
      .update({ title: t, pages: p })
      .eq("id", design.id);
    if (simpanId.current === id) setStatus(error ? "gagal" : "tersimpan");
  }, [design.id]);

  useEffect(() => {
    if (pertama.current) {
      pertama.current = false;
      return;
    }
    setStatus("belum");
    simpanId.current += 1; // hasil simpan lama yang masih berjalan diabaikan
    const t = setTimeout(kirim, 1200);
    return () => clearTimeout(t);
  }, [pages, title, kirim]);

  useEffect(() => {
    if (status === "tersimpan") return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [status]);

  /* ---------- Operasi objek ---------- */

  const pilih = useCallback((id: string | null) => {
    setSelectedId(id);
    setMode("ukuran");
    setPesan("");
  }, []);

  const updateElement = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      setPages(
        (prev) =>
          ubahElemen(prev, hal, (els) =>
            els.map((el) => (el.id === id ? { ...el, ...patch } : el))
          ),
        `${id}|${Object.keys(patch).sort().join(",")}`
      );
    },
    [hal, setPages]
  );

  const tambahElemen = useCallback(
    (el: DesignElement) => {
      // kunci sama dengan drag-ukuran, supaya menggambar objek jadi satu langkah undo
      setPages((prev) => ubahElemen(prev, hal, (els) => [...els, el]), `${el.id}|h,w,x,y`);
      setSelectedId(el.id);
      setMode("ukuran");
    },
    [hal, setPages]
  );

  const selesaiAlat = useCallback(() => setTool("pilih"), []);
  const gantiMode = useCallback(
    () => setMode((m) => (m === "ukuran" ? "sudut" : "ukuran")),
    []
  );

  function tambahGambar(img: UploadedImage) {
    const rasio = img.height / img.width;
    let w = size.w * 0.6;
    let h = w * rasio;
    if (h > size.h * 0.6) {
      h = size.h * 0.6;
      w = h / rasio;
    }
    tambahElemen({
      id: uid(),
      type: "image",
      x: round(size.w * 0.1),
      y: round(size.h * 0.1),
      w: round(w),
      h: round(h),
      src: img.url,
      fit: "cover",
    });
  }

  function isiGambar(img: UploadedImage) {
    if (!selected || (selected.type !== "rect" && selected.type !== "ellipse")) return;
    updateElement(selected.id, { src: img.url, fit: "cover" });
  }

  function hapus() {
    if (!selectedId) return;
    const removed = elements.find((el) => el.id === selectedId);
    const predecessor = textBoxes.find((el) => el.nextTextBoxId === selectedId);
    const successorId = removed?.type === "text" ? removed.nextTextBoxId : undefined;
    const remainingText =
      successorId && removed
        ? (textFlow[successorId]?.fullText ?? removed.text ?? "").slice(
            textFlow[successorId]?.start ?? 0
          )
        : undefined;

    setPages((prev) =>
      ubahElemen(prev, hal, (els) => {
        const filtered = els.filter((el) => el.id !== selectedId);
        return filtered.map((el) => {
          if (predecessor && el.id === predecessor.id) {
            return { ...el, nextTextBoxId: successorId };
          }
          if (!predecessor && successorId && el.id === successorId) {
            return { ...el, text: remainingText };
          }
          return el;
        });
      })
    );
    setSelectedId(null);
    setEditingId(null);
    setMode("ukuran");
  }

  function salin() {
    if (!selected) return;
    papan.current = selected;
    geserTempel.current = 0;
  }

  function potong() {
    if (!selected) return;
    salin();
    hapus();
  }

  function tempel() {
    const src = papan.current;
    if (!src) return;
    geserTempel.current += 1;
    const d = 5 * geserTempel.current;
    tambahElemen({
      ...src,
      id: uid(),
      x: round(src.x + d),
      y: round(src.y + d),
      nextTextBoxId: undefined,
    });
  }

  function duplikat() {
    if (selected) tambahElemen(cloneElement(selected));
  }

  function hubungkanTeks(id: string, nextId: string | undefined) {
    const box = textBoxes.find((el) => el.id === id);
    if (!box || box.nextTextBoxId === nextId) return;
    if (nextId && !textBoxOptions.some((el) => el.id === nextId)) {
      setPesan("Kotak teks tujuan tidak dapat dihubungkan.");
      return;
    }

    const flowSebelum = calculateTextFlow(elements);
    const perubahan = new Map<string, Partial<DesignElement>>();
    const atur = (targetId: string, patch: Partial<DesignElement>) => {
      perubahan.set(targetId, { ...perubahan.get(targetId), ...patch });
    };

    if (box.nextTextBoxId) {
      const root = flowSebelum[id];
      const target = flowSebelum[box.nextTextBoxId];
      if (root && target) {
        atur(root.sourceId, { text: root.fullText.slice(0, target.start) });
        atur(box.nextTextBoxId, {
          text: root.fullText.slice(target.start),
        });
      }
      atur(id, { nextTextBoxId: undefined });
    }

    if (nextId) {
      const setelahPutus = elements.map((el) => ({
        ...el,
        ...perubahan.get(el.id),
      }));
      const flowSetelahPutus = calculateTextFlow(setelahPutus);
      const source = flowSetelahPutus[id];
      const target = flowSetelahPutus[nextId];
      if (!source || !target || source.sourceId === target.sourceId) {
        setPesan("Alur teks tidak boleh membentuk lingkaran.");
        return;
      }

      const sourceText = source.fullText;
      const targetText = target.fullText === "Teks" ? "" : target.fullText;
      atur(source.sourceId, {
        text: sourceText + (sourceText && targetText ? "\n" : "") + targetText,
      });
      atur(target.sourceId, { text: "" });
      atur(id, { nextTextBoxId: nextId });
    }

    setPages((prev) =>
      ubahElemen(prev, hal, (els) =>
        els.map((el) => {
          const patch = perubahan.get(el.id);
          return patch ? { ...el, ...patch } : el;
        })
      )
    );
    setPesan("");
  }

  function lapisan(op: LayerOp) {
    if (!selectedId) return;
    setPages((prev) => ubahElemen(prev, hal, (els) => moveLayer(els, selectedId, op)));
  }

  function geser(dx: number, dy: number) {
    if (!selected) return;
    updateElement(selected.id, {
      x: round(selected.x + dx),
      y: round(selected.y + dy),
    });
  }

  function pindah(arah: 1 | -1) {
    if (elements.length === 0) return;
    const idx = elements.findIndex((e) => e.id === selectedId);
    const next =
      idx < 0
        ? arah === 1
          ? 0
          : elements.length - 1
        : (idx + arah + elements.length) % elements.length;
    pilih(elements[next].id);
  }

  function ubahTeks() {
    if (selected?.type === "text") setEditingId(selected.id);
  }

  function gayaTeks(k: "bold" | "italic" | "underline") {
    if (selected?.type !== "text") return;
    const patch: Partial<DesignElement> =
      k === "bold"
        ? { bold: !selected.bold }
        : k === "italic"
        ? { italic: !selected.italic }
        : { underline: !selected.underline };
    updateElement(selected.id, patch);
  }

  function batal() {
    if (tool !== "pilih") setTool("pilih");
    else if (mode === "sudut") setMode("ukuran");
    else pilih(null);
  }

  /* ---------- Operasi halaman ---------- */

  function pilihHalaman(i: number) {
    setActive(i);
    setSelectedId(null);
    setEditingId(null);
    setMode("ukuran");
  }

  function tambahHalaman() {
    setPages((prev) => [...prev, { id: uid(), elements: [] }]);
    pilihHalaman(pages.length);
  }

  function duplikatHalaman() {
    setPages((prev) => {
      const src = prev[hal];
      if (!src) return prev;
      const idBaru = new Map(src.elements.map((el) => [el.id, uid()]));
      const salinan: DesignPage = {
        id: uid(),
        elements: src.elements.map((el) => ({
          ...el,
          id: idBaru.get(el.id) ?? uid(),
          nextTextBoxId: el.nextTextBoxId
            ? idBaru.get(el.nextTextBoxId)
            : undefined,
        })),
      };
      const next = [...prev];
      next.splice(hal + 1, 0, salinan);
      return next;
    });
    pilihHalaman(hal + 1);
  }

  function hapusHalaman() {
    if (pages.length <= 1) return;
    if (!window.confirm(`Hapus halaman ${hal + 1}?`)) return;
    setPages((prev) => prev.filter((_, i) => i !== hal));
    pilihHalaman(Math.max(0, hal - 1));
  }

  /* ---------- Pintasan keyboard ---------- */

  const aksi: AksiPintasan = {
    tool: setTool,
    undo,
    redo,
    copy: salin,
    cut: potong,
    paste: tempel,
    duplicate: duplikat,
    remove: hapus,
    layer: lapisan,
    nudge: geser,
    cycle: pindah,
    deselect: batal,
    edit: ubahTeks,
    style: gayaTeks,
    zoom,
    fit: () => setScale(fitScale()),
    save: kirim,
    help: () => setHelpOpen(true),
  };
  useShortcuts(aksi, !helpOpen);

  return (
    <div className="flex h-dvh select-none flex-col bg-stone-100 text-stone-900 print:hidden">
      {/* Bilah judul */}
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-stone-300 bg-white px-2">
        <Link
          href="/dasbor"
          title="Kembali ke dasbor"
          aria-label="Kembali ke dasbor"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-700 hover:bg-stone-200"
        >
          <Icon name="arrowLeft" />
        </Link>
        <span className="hidden shrink-0 text-lg font-bold sm:inline">
          Lay<span className="text-indigo-600">oot</span>
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Judul desain"
          className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-sm font-bold focus:border-stone-300"
        />
        <IconButton icon="undo" label="Urungkan (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
        <IconButton icon="redo" label="Ulangi (Ctrl+Y)" disabled={!canRedo} onClick={redo} />
        <IconButton icon="help" label="Pintasan keyboard (?)" onClick={() => setHelpOpen(true)} />
        <span
          className={`hidden shrink-0 text-xs font-semibold sm:inline ${
            status === "gagal" ? "text-red-700" : "text-stone-500"
          }`}
        >
          {LABEL_STATUS[status]}
        </span>
        <ExportPdf title={title} pages={pages} size={size} />
      </header>

      <PropertyBar
        selected={selected}
        textBoxOptions={textBoxOptions}
        paper={design.paper}
        size={size}
        onChange={updateElement}
        onLinkText={hubungkanTeks}
        onLayer={lapisan}
        onDuplicate={duplikat}
        onDelete={hapus}
        onFillImage={isiGambar}
        onError={setPesan}
      />

      <div className="flex min-h-0 flex-1">
        <Toolbox
          tool={tool}
          onTool={setTool}
          onImage={tambahGambar}
          onError={setPesan}
        />
        <Canvas
          size={size}
          scale={scale}
          elements={elements}
          textFlow={textFlow}
          selectedId={selectedId}
          editingId={editingId}
          tool={tool}
          mode={mode}
          onSelect={pilih}
          onUpdate={updateElement}
          onCreate={tambahElemen}
          onToolDone={selesaiAlat}
          onEdit={setEditingId}
          onToggleMode={gantiMode}
          onScale={setScale}
        />
        <LayersPanel elements={elements} selectedId={selectedId} onSelect={pilih} />
      </div>

      <PageStrip
        total={pages.length}
        active={hal}
        onSelect={pilihHalaman}
        onAdd={tambahHalaman}
        onDuplicate={duplikatHalaman}
        onDelete={hapusHalaman}
      />
      <StatusBar
        tool={tool}
        mode={mode}
        selected={selected}
        pesan={pesan}
        zoom={Math.round((scale / PX_PER_MM) * 100)}
        onZoom={zoom}
        onFit={() => setScale(fitScale())}
      />

      {helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
