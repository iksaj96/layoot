"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { DEFAULT_FONT_SIZE, PAPER_OPTIONS, PAPER_SIZE_MM } from "@/lib/types";
import type {
  DesignElement,
  DesignPage,
  EditorDesign,
  InlineTextStyle,
  Paper,
} from "@/lib/types";
import Canvas from "./canvas/Canvas";
import ExportPdf from "./export/ExportPdf";
import PageStrip from "./panels/PageStrip";
import ShortcutHelp from "./panels/ShortcutHelp";
import StatusBar from "./panels/StatusBar";
import FeedbackModal from "./panels/FeedbackModal";
import type { JenisMasukan } from "./panels/FeedbackModal";
import Toolbox from "./toolbar/Toolbox";
import EditorSidebar from "./toolbar/EditorSidebar";
import type { SidebarTab } from "./toolbar/EditorSidebar";
import { uploadImageFile } from "./toolbar/ImageUpload";
import type { ImageAsset, UploadedImage } from "./toolbar/ImageUpload";
import Icon from "./ui/Icon";
import type { IconName } from "./ui/Icon";
import { moveLayers, ubahElemen } from "./core/elementOps";
import type { LayerOp } from "./core/elementOps";
import { elementBounds, selectionBounds } from "./core/geometry";
import { calculateTextFlow, calculateTextHeightMm } from "./core/textFlow";
import {
  applyTextStyle,
  remapTextStyles,
  textStyleAt,
} from "./core/textStyles";
import { measureTextWidthMm } from "./core/textMetrics";
import {
  LABEL_STATUS,
  MAX_SCALE,
  MIN_SCALE,
  PX_PER_MM,
  PT_TO_MM,
  clamp,
  round,
  uid,
} from "./core/utils";
import type { Mode, Status, Tool } from "./core/utils";
import type { AlignAction } from "./core/utils";
import { useGoogleFonts } from "./hooks/useGoogleFonts";
import { useHistory } from "./hooks/useHistory";
import { useShortcuts } from "./hooks/useShortcuts";
import type { AksiPintasan } from "./hooks/useShortcuts";

const ELEMEN_KOSONG: DesignElement[] = [];
const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const jedaSimpan = 650;

function serialisasiDesain(
  desain: Pick<EditorDesign, "pages" | "title" | "paper" | "orientation">
) {
  return JSON.stringify(desain);
}

const subscribeToFonts = (notify: () => void) => {
  if (typeof document === "undefined") return () => {};
  document.fonts.addEventListener("loadingdone", notify);
  return () => document.fonts.removeEventListener("loadingdone", notify);
};
const getFontsSnapshot = () =>
  typeof document !== "undefined" && document.fonts.status === "loaded";
const getServerFontsSnapshot = () => false;

function HeaderIconButton({
  icon,
  label,
  shortcut,
  disabled = false,
  onClick,
}: {
  icon: IconName;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const accessibleLabel = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      type="button"
      title={accessibleLabel}
      aria-label={accessibleLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-stone-700 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon name={icon} size={18} />
      {shortcut && <span className="hidden text-[10px] md:inline">{shortcut}</span>}
    </button>
  );
}

export default function Editor({ design }: { design: EditorDesign }) {
  useGoogleFonts();

  const [paper, setPaper] = useState<Paper>(design.paper);
  const [orientation, setOrientation] = useState<EditorDesign["orientation"]>(
    design.orientation
  );
  const base = PAPER_SIZE_MM[paper];
  const size =
    orientation === "landscape" ? { w: base.h, h: base.w } : base;

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("pilih");
  const [mode, setMode] = useState<Mode>("ukuran");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("properties");
  const [imageLibraryRevision, setImageLibraryRevision] = useState(0);
  const [pesan, setPesan] = useState("");
  const [scale, setScale] = useState(1.2); // px per mm
  const [status, setStatus] = useState<Status>("tersimpan");
  const [helpOpen, setHelpOpen] = useState(false);
  const [masukanTerbuka, setMasukanTerbuka] = useState<JenisMasukan | null>(null);
  const sudahAturSkalaAwal = useRef(false);
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

  const papan = useRef<DesignElement[] | null>(null);
  const sesiEditTeks = useRef(0);
  const seleksiTeks = useRef<{
    id: string | null;
    start: number;
    end: number;
    pending: InlineTextStyle;
  }>({ id: null, start: 0, end: 0, pending: {} });

  // Undo bisa mengurangi jumlah halaman, jadi indeks aktif dijaga di batas
  const hal = Math.min(active, pages.length - 1);
  const elements = pages[hal]?.elements ?? ELEMEN_KOSONG;
  const selected = elements.find((e) => e.id === selectedId) ?? null;
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const textStylesById = useMemo(
    () =>
      Object.fromEntries(
        elements
          .filter((el) => el.type === "text")
          .map((el) => [el.id, el.textStyles])
      ),
    [elements]
  );
  const textFlow = useMemo(
    () =>
      calculateTextFlow(
        elements.map((el) =>
          el.crop
            ? { ...el, w: el.w / el.crop.w, h: el.h / el.crop.h }
            : el
        ),
        hydrated && fontsReady
      ),
    [elements, fontsReady, hydrated]
  );
  const textBoxes = elements.filter((el) => el.type === "text");
  const textBoxOptions =
    selected?.type === "text" && (selected.textKind ?? "paragraph") !== "artistic"
      ? textBoxes
          .map((box, index) => ({ box, label: `Kotak teks ${index + 1}` }))
          .filter(({ box }) => {
            if ((box.textKind ?? "paragraph") === "artistic") return false;
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
    const margin = 32;
    const sidebarWidth = window.innerWidth >= 640 ? 256 : 224;
    const lebar = window.innerWidth - 48 - sidebarWidth - margin * 2;
    const tinggi = window.innerHeight - 152 - margin * 2;
    const s = Math.min(lebar / size.w, tinggi / size.h);
    return clamp(Math.floor(s * 100) / 100, MIN_SCALE, MAX_SCALE);
  }, [size.w, size.h]);

  useEffect(() => {
    if (sudahAturSkalaAwal.current) return;
    sudahAturSkalaAwal.current = true;
    setScale(fitScale());
  }, [fitScale]);

  const zoom = useCallback((faktor: number) => {
    setScale((s) => clamp(Math.round(s * faktor * 1000) / 1000, MIN_SCALE, MAX_SCALE));
  }, []);

  /* ---------- Simpan otomatis ---------- */

  const terbaru = useRef({ pages, title, paper, orientation });
  useEffect(() => {
    terbaru.current = { pages, title, paper, orientation };
  });

  const [snapshotTersimpanUI, setSnapshotTersimpanUI] = useState(() =>
    serialisasiDesain({ pages, title, paper, orientation })
  );
  const snapshotTersimpan = useRef(snapshotTersimpanUI);
  const versiTersimpan = useRef(design.updated_at);
  const snapshotDalamSimpan = useRef<string | null>(null);
  const timerSimpan = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisiDiminta = useRef(0);
  const revisiTersimpan = useRef(0);
  const prosesSimpan = useRef<Promise<boolean> | null>(null);
  const snapshotLokal = useMemo(
    () => serialisasiDesain({ pages, title, paper, orientation }),
    [pages, title, paper, orientation]
  );
  const statusTampilan =
    status === "gagal" || status === "konflik"
      ? status
      : status === "menyimpan"
        ? status
        : snapshotLokal === snapshotTersimpanUI
          ? "tersimpan"
          : "belum";

  const kirim = useCallback(async () => {
    if (timerSimpan.current) {
      clearTimeout(timerSimpan.current);
      timerSimpan.current = null;
    }
    revisiDiminta.current += 1;
    if (prosesSimpan.current) return prosesSimpan.current;

    const proses = (async () => {
      while (revisiTersimpan.current < revisiDiminta.current) {
        const revisi = revisiDiminta.current;
        const data = terbaru.current;
        const snapshot = serialisasiDesain(data);
        if (snapshot === snapshotTersimpan.current) {
          revisiTersimpan.current = revisi;
          continue;
        }

        setStatus("menyimpan");
        const versiTanggal = Date.parse(versiTersimpan.current);
        const waktuUpdate = new Date(
          Math.max(Date.now(), Number.isFinite(versiTanggal) ? versiTanggal + 1 : 0)
        ).toISOString();
        snapshotDalamSimpan.current = snapshot;

        let tersimpan = false;
        let konflik = false;
        for (let percobaan = 0; percobaan < 2; percobaan += 1) {
          try {
            const { data: hasil, error } = await createClient()
              .from("designs")
              .update({ ...data, updated_at: waktuUpdate })
              .eq("id", design.id)
              .eq("updated_at", versiTersimpan.current)
              .select("updated_at")
              .maybeSingle();

            if (hasil) {
              versiTersimpan.current = hasil.updated_at;
              snapshotTersimpan.current = snapshot;
              setSnapshotTersimpanUI(snapshot);
              revisiTersimpan.current = revisi;
              tersimpan = true;
              break;
            }
            if (!error) {
              konflik = true;
              break;
            }
            if (percobaan === 0) {
              await new Promise((resolve) => setTimeout(resolve, 350));
            }
          } catch {
            if (percobaan === 1) break;
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        }

        snapshotDalamSimpan.current = null;
        if (!tersimpan) {
          setStatus(konflik ? "konflik" : "gagal");
          setPesan(
            konflik
              ? "Desain berubah di tab lain. Muat ulang untuk mengambil versi terbaru."
              : "Gagal menyimpan ke Supabase. Tekan Ctrl/Cmd+S untuk mencoba lagi."
          );
          return false;
        }
      }

      setStatus("tersimpan");
      setPesan("");
      return true;
    })();
    prosesSimpan.current = proses;
    try {
      return await proses;
    } finally {
      if (prosesSimpan.current === proses) prosesSimpan.current = null;
    }
  }, [design.id]);

  useEffect(() => {
    if (snapshotLokal === snapshotTersimpan.current) return;
    timerSimpan.current = setTimeout(() => {
      timerSimpan.current = null;
      void kirim();
    }, jedaSimpan);
    return () => {
      if (timerSimpan.current) clearTimeout(timerSimpan.current);
      timerSimpan.current = null;
    };
  }, [snapshotLokal, kirim]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`desain:${design.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "designs",
          filter: `id=eq.${design.id}`,
        },
        ({ new: perubahan }) => {
          const baris = perubahan as Partial<EditorDesign>;
          if (
            baris.id !== design.id ||
            typeof baris.title !== "string" ||
            (baris.paper !== "A4" && baris.paper !== "F4") ||
            (baris.orientation !== "portrait" && baris.orientation !== "landscape") ||
            !Array.isArray(baris.pages) ||
            typeof baris.updated_at !== "string"
          ) {
            return;
          }
          if (
            Date.parse(baris.updated_at) <=
            Date.parse(versiTersimpan.current)
          ) {
            return;
          }

          const remote = {
            pages: baris.pages,
            title: baris.title,
            paper: baris.paper,
            orientation: baris.orientation,
          } as typeof terbaru.current;
          const snapshotRemote = serialisasiDesain(remote);
          if (
            snapshotRemote === snapshotDalamSimpan.current ||
            snapshotRemote === snapshotTersimpan.current
          ) {
            snapshotTersimpan.current = snapshotRemote;
            setSnapshotTersimpanUI(snapshotRemote);
            versiTersimpan.current = baris.updated_at;
            return;
          }

          const localKotor =
            serialisasiDesain(terbaru.current) !== snapshotTersimpan.current ||
            timerSimpan.current !== null ||
            prosesSimpan.current !== null;
          if (localKotor) {
            setStatus("konflik");
            setPesan(
              "Desain berubah di tab lain. Perubahan lokal dipertahankan; muat ulang untuk mengambil versi terbaru."
            );
            return;
          }

          const halamanRemote =
            remote.pages.length > 0 ? remote.pages : [{ id: "p1", elements: [] }];
          const dataTerbaru = { ...remote, pages: halamanRemote };
          terbaru.current = dataTerbaru;
          snapshotTersimpan.current = serialisasiDesain(dataTerbaru);
          setSnapshotTersimpanUI(snapshotTersimpan.current);
          versiTersimpan.current = baris.updated_at;
          setTitle(dataTerbaru.title);
          setPaper(dataTerbaru.paper);
          setOrientation(dataTerbaru.orientation);
          setPages(() => dataTerbaru.pages);
          setStatus("tersimpan");
          setPesan("");
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [design.id, setPages]);

  useEffect(() => {
    if (statusTampilan === "tersimpan") return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [statusTampilan]);

  /* ---------- Operasi objek ---------- */

  const pilih = useCallback((id: string | null, additive = false) => {
    if (additive && id) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id];
      setSelectedIds(next);
      setSelectedId(next.at(-1) ?? null);
    } else {
      setSelectedIds(id ? [id] : []);
      setSelectedId(id);
    }
    setMode("ukuran");
    setPesan("");
  }, [selectedIds]);

  const pilihBanyak = useCallback(
    (ids: string[], additive: boolean) => {
      const next = additive
        ? [...selectedIds, ...ids.filter((id) => !selectedIds.includes(id))]
        : ids;
      setSelectedIds(next);
      setSelectedId(next.at(-1) ?? null);
      setMode("ukuran");
      setPesan("");
    },
    [selectedIds]
  );

  function aturEditing(id: string | null) {
    if (id && id !== editingId) {
      sesiEditTeks.current += 1;
      seleksiTeks.current = { id, start: 0, end: 0, pending: {} };
    }
    setEditingId(id);
  }

  const updateElement = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      const element = elements.find((item) => item.id === id);
      let perubahan: Partial<DesignElement> = {
        ...patch,
        ...(patch.text !== undefined
          ? { text: patch.text.replace(/\r\n?/g, "\n") }
          : {}),
      };
      if (element?.type === "text") {
        const selanjutnya = { ...element, ...perubahan };
        const text = selanjutnya.text ?? "";
        const textBerubah =
          patch.text !== undefined ||
          patch.fontSize !== undefined ||
          patch.fontFamily !== undefined ||
          patch.bold !== undefined ||
          patch.italic !== undefined ||
          patch.columns !== undefined ||
          patch.textKind !== undefined;

        if (
          (selanjutnya.textKind ?? "paragraph") === "artistic" &&
          textBerubah
        ) {
          const baris = text.split("\n");
          perubahan = {
            ...perubahan,
            w: Math.max(
              5,
              ...baris.map((barisTeks) =>
                measureTextWidthMm(selanjutnya, barisTeks)
              )
            ),
            h:
              Math.max(1, baris.length) *
              (selanjutnya.fontSize ?? DEFAULT_FONT_SIZE) *
              PT_TO_MM *
              1.3,
          };
        } else {
          if (
            patch.h !== undefined &&
            patch.h !== element.h &&
            patch.textKind === undefined &&
            element.textAutoHeight
          ) {
            perubahan.textAutoHeight = false;
          }
          const textAutoHeight =
            perubahan.textAutoHeight ?? element.textAutoHeight ?? false;
          const target = { ...selanjutnya, ...perubahan };
          if (
            textAutoHeight &&
            !target.nextTextBoxId &&
            (textBerubah || patch.w !== undefined)
          ) {
            perubahan.h = calculateTextHeightMm(target, text);
          }
        }
      }
      const satuSesiEdit = editingId !== null && patch.text !== undefined;
      const kunci = satuSesiEdit
        ? `text-edit:${id}:${sesiEditTeks.current}`
        : `${id}|${Object.keys(perubahan).sort().join(",")}`;
      setPages(
        (prev) =>
          ubahElemen(prev, hal, (els) =>
            els.map((el) => (el.id === id ? { ...el, ...perubahan } : el))
          ),
        kunci,
        satuSesiEdit
      );
    },
    [editingId, elements, hal, setPages]
  );

  const updateMany = useCallback(
    (
      updates: Record<string, Partial<DesignElement>>,
      historyKey: string,
      mergePermanently = false
    ) => {
      const patches = new Map(Object.entries(updates));
      setPages(
        (prev) =>
          ubahElemen(prev, hal, (els) =>
            els.map((el) => {
              const patch = patches.get(el.id);
              return patch ? { ...el, ...patch } : el;
            })
          ),
        historyKey,
        mergePermanently
      );
    },
    [hal, setPages]
  );

  const onTextChange = useCallback(
    (id: string, text: string, start: number, end: number) => {
      const element = elements.find((item) => item.id === id);
      if (!element) return;
      const previousText = element.text ?? "";
      const ranges = remapTextStyles(element.textStyles, previousText, text);
      let prefix = 0;
      while (
        prefix < previousText.length &&
        prefix < text.length &&
        previousText[prefix] === text[prefix]
      ) {
        prefix += 1;
      }
      let suffix = 0;
      while (
        suffix < previousText.length - prefix &&
        suffix < text.length - prefix &&
        previousText[previousText.length - 1 - suffix] ===
          text[text.length - 1 - suffix]
      ) {
        suffix += 1;
      }
      const insertedEnd = text.length - suffix;
      const pending =
        seleksiTeks.current.id === id ? seleksiTeks.current.pending : {};
      const styledRanges =
        insertedEnd > prefix && Object.keys(pending).length
          ? applyTextStyle(ranges, prefix, insertedEnd, pending)
          : ranges;
      seleksiTeks.current = { id, start, end, pending };
      updateElement(id, { text, textStyles: styledRanges });
    },
    [elements, updateElement]
  );

  const onTextSelection = useCallback(
    (id: string, start: number, end: number) => {
      const current =
        seleksiTeks.current.id === id
          ? seleksiTeks.current
          : { id, start: 0, end: 0, pending: {} };
      seleksiTeks.current = { ...current, start, end };
    },
    []
  );

  const formatText = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      const rangeId =
        editingId === id && seleksiTeks.current.id
          ? seleksiTeks.current.id
          : id;
      const element = elements.find((item) => item.id === rangeId);
      if (!element || element.type !== "text") return;
      const format: InlineTextStyle = {};
      if (patch.bold !== undefined) format.bold = patch.bold;
      if (patch.italic !== undefined) format.italic = patch.italic;
      if (patch.underline !== undefined) format.underline = patch.underline;
      if (patch.color !== undefined) format.color = patch.color;
      if (patch.fontSize !== undefined) format.fontSize = patch.fontSize;
      if (Object.keys(format).length === 0) {
        updateElement(id, patch);
        return;
      }

      if (editingId === id && seleksiTeks.current.id === rangeId) {
        const { start, end, pending } = seleksiTeks.current;
        if (start < end) {
          const current = textStyleAt(element.textStyles, start);
          for (const key of ["bold", "italic", "underline"] as const) {
            if (format[key] !== undefined) {
              const effective = current[key] ?? element[key] ?? false;
              if (format[key] === effective) format[key] = !effective;
            }
          }
          const textStyles = applyTextStyle(
            element.textStyles,
            start,
            end,
            format
          );
          seleksiTeks.current = {
            ...seleksiTeks.current,
            pending: { ...pending, ...format },
          };
          updateElement(rangeId, { textStyles });
          return;
        }

        for (const key of ["bold", "italic", "underline"] as const) {
          if (format[key] !== undefined) {
            const effective = pending[key] ?? element[key] ?? false;
            if (format[key] === effective) format[key] = !effective;
          }
        }
        seleksiTeks.current = {
          ...seleksiTeks.current,
          pending: { ...pending, ...format },
        };
        return;
      }

      updateElement(id, patch);
    },
    [editingId, elements, updateElement]
  );

  const tambahElemen = useCallback(
    (el: DesignElement) => {
      // kunci sama dengan drag-ukuran, supaya menggambar objek jadi satu langkah undo
      const kunci = el.type === "text"
        ? `${el.id}|h,textAutoHeight,textKind,w,x,y`
        : el.type === "line"
          ? `${el.id}|h,lineFlip,w,x,y`
          : `${el.id}|h,w,x,y`;
      setPages((prev) => ubahElemen(prev, hal, (els) => [...els, el]), kunci);
      setSelectedId(el.id);
      setSelectedIds([el.id]);
      setMode("ukuran");
    },
    [hal, setPages]
  );

  const selesaiAlat = useCallback(() => setTool("pilih"), []);

  function tambahGambar(img: UploadedImage, x?: number, y?: number) {
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
      x: round(clamp(x ?? size.w * 0.1, 0, size.w - w)),
      y: round(clamp(y ?? size.h * 0.1, 0, size.h - h)),
      w: round(w),
      h: round(h),
      src: img.url,
      fit: "cover",
    });
  }

  async function unggahKeCanvas(file: File, x: number, y: number) {
    setPesan("");
    try {
      const image = await uploadImageFile(file);
      if (!image) return;
      setImageLibraryRevision((revision) => revision + 1);
      tambahGambar(image, x, y);
    } catch (error) {
      setPesan(error instanceof Error ? error.message : "Gagal mengunggah gambar.");
    }
  }

  function hapusAsetGambar(asset: ImageAsset) {
    const references = pages.flatMap((page) =>
      page.elements.filter((el) => el.src === asset.url)
    );
    if (references.length === 0) return;

    const removedIds = new Set(
      references.filter((el) => el.type === "image").map((el) => el.id)
    );
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        elements: page.elements
          .filter((el) => !(el.type === "image" && el.src === asset.url))
          .map((el) => (el.src === asset.url ? { ...el, src: undefined } : el)),
      }))
    );
    if (selectedId && removedIds.has(selectedId)) {
      setSelectedId(null);
      setMode("ukuran");
    }
    setSelectedIds((ids) => ids.filter((id) => !removedIds.has(id)));
  }

  function isiGambar(img: UploadedImage) {
    if (!selected || (selected.type !== "rect" && selected.type !== "ellipse")) return;
    updateElement(selected.id, { src: img.url, fit: "cover" });
    setImageLibraryRevision((revision) => revision + 1);
  }

  function hapus() {
    const removedIds = new Set(
      selectedIds.length ? selectedIds : selectedId ? [selectedId] : []
    );
    if (removedIds.size === 0) return;

    const selectedTextIds = new Set(
      elements
        .filter((el) => removedIds.has(el.id) && el.type === "text")
        .map((el) => el.id)
    );
    const incoming = new Set(
      textBoxes
        .map((el) => el.nextTextBoxId)
        .filter((id): id is string => !!id)
    );
    const chainUpdates = new Map<
      string,
      { nextTextBoxId?: string; text?: string; textStyles?: DesignElement["textStyles"] }
    >();

    for (const root of textBoxes.filter((el) => !incoming.has(el.id))) {
      const chain: DesignElement[] = [];
      const visited = new Set<string>();
      let current: DesignElement | undefined = root;
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        chain.push(current);
        current = textBoxes.find((el) => el.id === current?.nextTextBoxId);
      }
      if (!chain.some((el) => selectedTextIds.has(el.id))) continue;
      const remaining = chain.filter((el) => !selectedTextIds.has(el.id));
      if (remaining.length === 0) continue;

      const textFlowRoot = textFlow[root.id];
      const fullText = textFlowRoot?.fullText ?? root.text ?? "";
      const rootWasRemoved = selectedTextIds.has(root.id);
      const first = remaining[0];
      if (rootWasRemoved) {
        const start = textFlow[first.id]?.start ?? 0;
        chainUpdates.set(first.id, {
          text: fullText.slice(start),
          textStyles: (root.textStyles ?? [])
            .filter((range) => range.end > start)
            .map((range) => ({
              ...range,
              start: Math.max(0, range.start - start),
              end: range.end - start,
            })),
        });
      }
      remaining.forEach((el, index) => {
        const update = chainUpdates.get(el.id) ?? {};
        update.nextTextBoxId = remaining[index + 1]?.id;
        chainUpdates.set(el.id, update);
      });
    }

    setPages((prev) =>
      ubahElemen(prev, hal, (els) => {
        return els
          .filter((el) => !removedIds.has(el.id))
          .map((el) => {
            const update = chainUpdates.get(el.id);
            return update ? { ...el, ...update } : el;
          });
      })
    );
    setSelectedId(null);
    setSelectedIds([]);
    setEditingId(null);
    setMode("ukuran");
  }

  function salin() {
    const ids = new Set(selectedIds.length ? selectedIds : selected ? [selected.id] : []);
    if (!ids.size) return;
    papan.current = elements.filter((el) => ids.has(el.id)).map((el) => ({
      ...el,
      textStyles: el.textStyles?.map((range) => ({
        ...range,
        style: { ...range.style },
      })),
    }));
  }

  function potong() {
    if (selectedIds.length === 0 && !selected) return;
    salin();
    hapus();
  }

  function tempel() {
    const src = papan.current;
    if (!src?.length) return;
    const idMap = new Map(src.map((el) => [el.id, uid()]));
    const salinan = src.map((el) => ({
      ...el,
      id: idMap.get(el.id) ?? uid(),
      nextTextBoxId: el.nextTextBoxId
        ? idMap.get(el.nextTextBoxId)
        : undefined,
      textStyles: el.textStyles?.map((range) => ({
        ...range,
        style: { ...range.style },
      })),
    }));
    setPages((prev) =>
      ubahElemen(prev, hal, (els) => [...els, ...salinan])
    );
    setSelectedIds(salinan.map((el) => el.id));
    setSelectedId(salinan.at(-1)?.id ?? null);
    setMode("ukuran");
  }

  function duplikat() {
    const ids = new Set(selectedIds.length ? selectedIds : selected ? [selected.id] : []);
    if (ids.size === 0) return;
    const sources = elements.filter((el) => ids.has(el.id));
    const idMap = new Map(sources.map((el) => [el.id, uid()]));
    const salinan = sources.map((el) => ({
      ...el,
      id: idMap.get(el.id) ?? uid(),
      x: round(el.x + 5),
      y: round(el.y + 5),
      nextTextBoxId: el.nextTextBoxId
        ? idMap.get(el.nextTextBoxId)
        : undefined,
      textStyles: el.textStyles?.map((range) => ({
        ...range,
        style: { ...range.style },
      })),
    }));
    setPages((prev) =>
      ubahElemen(prev, hal, (els) => [...els, ...salinan])
    );
    setSelectedIds(salinan.map((el) => el.id));
    setSelectedId(salinan.at(-1)?.id ?? null);
    setMode("ukuran");
  }

  function hubungkanTeks(id: string, nextId: string | undefined) {
    const box = textBoxes.find((el) => el.id === id);
    if (
      !box ||
      (box.textKind ?? "paragraph") === "artistic" ||
      box.nextTextBoxId === nextId
    ) return;
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

    const elemenSetelahPerubahan = elements.map((el) => ({
      ...el,
      ...perubahan.get(el.id),
    }));
    const kotakMasuk = new Set(
      elemenSetelahPerubahan
        .map((el) => el.nextTextBoxId)
        .filter((targetId): targetId is string => !!targetId)
    );
    for (const el of elemenSetelahPerubahan) {
      if (
        perubahan.has(el.id) &&
        el.type === "text" &&
        el.textAutoHeight &&
        !el.nextTextBoxId &&
        !kotakMasuk.has(el.id)
      ) {
        atur(el.id, { h: calculateTextHeightMm(el, el.text ?? "") });
      }
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
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (ids.length === 0) return;
    setPages((prev) => ubahElemen(prev, hal, (els) => moveLayers(els, ids, op)));
  }

  function alignSelected(action: AlignAction) {
    const ids = new Set(selectedIds);
    if (action !== "P" && ids.size < 2) return;
    if (ids.size === 0) return;
    const anchorId = selectedIds.at(-1);

    setPages((prev) => {
      const page = prev[hal];
      if (!page) return prev;
      const chosen = page.elements.filter((el) => ids.has(el.id));
      if (chosen.length === 0 || (action !== "P" && chosen.length < 2)) return prev;

      const anchor = chosen.find((el) => el.id === anchorId);
      const anchorBounds = anchor ? elementBounds(anchor) : null;
      const bounds = selectionBounds(chosen);
      if (!bounds) return prev;
      const { left, top, right, bottom } = bounds;
      const delta = (el: DesignElement) => {
        const box = elementBounds(el);
        switch (action) {
          case "C":
            return {
              x: round(
                ((anchorBounds?.left ?? left) +
                  (anchorBounds?.right ?? right) -
                  box.left -
                  box.right) /
                  2
              ),
              y: 0,
            };
          case "E":
            return {
              x: 0,
              y: round(
                ((anchorBounds?.top ?? top) +
                  (anchorBounds?.bottom ?? bottom) -
                  box.top -
                  box.bottom) /
                  2
              ),
            };
          case "L":
            return { x: round((anchorBounds?.left ?? left) - box.left), y: 0 };
          case "R":
            return { x: round((anchorBounds?.right ?? right) - box.right), y: 0 };
          case "T":
            return { x: 0, y: round((anchorBounds?.top ?? top) - box.top) };
          case "B":
            return { x: 0, y: round((anchorBounds?.bottom ?? bottom) - box.bottom) };
          case "P":
            return {
              x: round((size.w - (right - left)) / 2 - left),
              y: round((size.h - (bottom - top)) / 2 - top),
            };
        }
      };

      return ubahElemen(prev, hal, (els) =>
        els.map((el) => {
          if (!ids.has(el.id)) return el;
          const move = delta(el);
          return move.x === 0 && move.y === 0
            ? el
            : { ...el, x: round(el.x + move.x), y: round(el.y + move.y) };
        })
      );
    });
  }

  function geser(dx: number, dy: number) {
    const ids = new Set(selectedIds.length ? selectedIds : selected ? [selected.id] : []);
    if (!ids.size) return;
    setPages((prev) =>
      ubahElemen(prev, hal, (els) =>
        els.map((el) =>
          ids.has(el.id)
            ? { ...el, x: round(el.x + dx), y: round(el.y + dy) }
            : el
        )
      ),
      `nudge:${[...ids].sort().join(",")}`
    );
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
    if (selected?.type === "text") aturEditing(selected.id);
  }

  function gayaTeks(k: "bold" | "italic" | "underline") {
    if (selected?.type !== "text") return;
    const patch = {
      [k]: !selected[k],
    };
    formatText(selected.id, patch);
  }

  function batal() {
    if (tool !== "pilih") setTool("pilih");
    else if (mode !== "ukuran") setMode("ukuran");
    else pilih(null);
  }

  function aktivasiObjek(
    id: string,
    clickCount: number,
    canCycleMode: boolean
  ) {
    if (tool !== "pilih") return;
    const element = elements.find((el) => el.id === id);
    if (clickCount >= 2 && element?.type === "text") aturEditing(id);
    else if (canCycleMode && element) {
      siklusMode(id);
    }
  }

  function modeMendukungSudut(element: DesignElement) {
    return element.type === "rect" || element.type === "image";
  }

  function aturMode(nextMode: Mode) {
    if (selectedIds.length !== 1 || !selected || tool !== "pilih") return;
    if (nextMode === "sudut" && !modeMendukungSudut(selected)) return;
    setMode(nextMode);
  }

  function siklusMode(id: string) {
    const element = elements.find((item) => item.id === id);
    if (
      !element ||
      selectedIds.length !== 1 ||
      selectedId !== id ||
      editingId ||
      tool !== "pilih"
    ) {
      return;
    }
    setMode((current) => {
      if (current === "ukuran") return "putar";
      if (current === "putar" && modeMendukungSudut(element)) return "sudut";
      return "ukuran";
    });
  }

  const tutupMasukan = useCallback(() => setMasukanTerbuka(null), []);

  async function bukaPreview() {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      setPesan("Izinkan pop-up untuk membuka preview di tab baru.");
      return;
    }

    tab.opener = null;
    setPesan("");
    try {
      const tersimpan = await kirim();
      if (!tersimpan) {
        tab.close();
        setPesan("Desain belum berhasil disimpan. Coba lagi.");
        return;
      }
      tab.location.href = `/editor/${design.id}/preview`;
    } catch {
      tab.close();
      setPesan("Desain belum berhasil disimpan. Coba lagi.");
    }
  }

  /* ---------- Operasi halaman ---------- */

  function pilihHalaman(i: number) {
    setActive(i);
    setSelectedId(null);
    setSelectedIds([]);
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
    align: alignSelected,
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
    mode: aturMode,
    zoom,
    fit: () => setScale(fitScale()),
    save: kirim,
    help: () => setHelpOpen(true),
  };
  useShortcuts(aksi, !helpOpen && masukanTerbuka === null);

  return (
    <div className="flex h-dvh select-none flex-col overflow-hidden bg-stone-100 text-stone-900 print:hidden">
      <header className="relative flex h-12 shrink-0 items-center gap-1 border-b-2 border-violet-900 bg-[#faf8f3] px-2">
        <Link
          href="/dasbor"
          title="Kembali ke dasbor"
          aria-label="Kembali ke dasbor"
          className="group flex h-9 shrink-0 items-center gap-1 rounded-lg px-1 text-stone-700 transition hover:bg-violet-100/60"
        >
          <Icon name="chevronLeft" size={18} />
          <Image
            src="/logo/logo.png"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            priority
            className="h-8 w-8 object-contain transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
          />
          <span className="hidden text-lg font-bold text-stone-900 sm:inline">
            Lay
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              oot
            </span>
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Icon name="fileText" size={16} className="shrink-0 text-stone-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Judul desain"
            className="min-w-0 flex-1 rounded-lg border border-transparent px-1.5 py-1 text-sm font-bold focus:border-stone-300"
          />
          <label
            title="Ukuran kertas"
            className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg px-1 text-stone-700 hover:bg-black/5"
          >
            <Icon name="fileText" size={18} />
            <select
              value={paper}
              onChange={(event) => {
                const option = PAPER_OPTIONS.find(
                  (item) => item.value === event.target.value
                );
                if (option) setPaper(option.value);
              }}
              aria-label="Ukuran kertas"
              className="h-8 w-[3.3rem] appearance-none bg-transparent text-xs font-semibold outline-none"
            >
              {PAPER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={14} className="-ml-2 pointer-events-none" />
          </label>
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              title="Potret"
              aria-label="Potret"
              aria-pressed={orientation === "portrait"}
              onClick={() => setOrientation("portrait")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 ${
                orientation === "portrait" ? "bg-black/5 text-stone-900" : "text-stone-500"
              }`}
            >
              <Icon name="rectangleVertical" size={18} />
            </button>
            <button
              type="button"
              title="Lanskap"
              aria-label="Lanskap"
              aria-pressed={orientation === "landscape"}
              onClick={() => setOrientation("landscape")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 ${
                orientation === "landscape" ? "bg-black/5 text-stone-900" : "text-stone-500"
              }`}
            >
              <Icon name="rectangleHorizontal" size={18} />
            </button>
          </div>
          <span className="hidden shrink-0 whitespace-nowrap text-[11px] text-stone-500 lg:inline">
            {size.w} × {size.h} mm
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <HeaderIconButton
            icon="undo"
            label="Urungkan"
            shortcut="Ctrl/Cmd+Z"
            disabled={!canUndo}
            onClick={undo}
          />
          <HeaderIconButton
            icon="redo"
            label="Ulangi"
            shortcut="Ctrl/Cmd+Y"
            disabled={!canRedo}
            onClick={redo}
          />
          <HeaderIconButton
            icon="help"
            label="Bantuan shortcut"
            shortcut="?"
            onClick={() => setHelpOpen(true)}
          />
          <span
            role="status"
            title={LABEL_STATUS[statusTampilan]}
            aria-label={LABEL_STATUS[statusTampilan]}
            className={`flex h-8 shrink-0 items-center gap-1 px-1 ${
              statusTampilan === "gagal"
                ? "text-red-700"
                : statusTampilan === "konflik"
                  ? "text-amber-700"
                  : statusTampilan === "tersimpan"
                    ? "text-emerald-600"
                    : "text-stone-500"
            }`}
          >
            <Icon
              name={
                statusTampilan === "tersimpan"
                  ? "circleCheck"
                  : statusTampilan === "gagal" || statusTampilan === "konflik"
                    ? "help"
                    : "loader"
              }
              size={18}
              className={statusTampilan === "menyimpan" || statusTampilan === "belum" ? "animate-spin" : undefined}
            />
            <span className="hidden whitespace-nowrap text-xs font-semibold lg:inline">
              {LABEL_STATUS[statusTampilan]}
            </span>
          </span>
        </div>
        <ExportPdf title={title} pages={pages} size={size} />
        <div
          className="absolute inset-x-0 -bottom-[2px] h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500"
          aria-hidden="true"
        />
      </header>

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <Toolbox
          tool={tool}
          onTool={setTool}
          activeTab={sidebarTab}
          onTab={setSidebarTab}
        />
        <Canvas
          size={size}
          scale={scale}
          elements={elements}
          textFlow={textFlow}
          textStylesById={textStylesById}
          selectedId={selectedId}
          selectedIds={selectedIds}
          editingId={editingId}
          tool={tool}
          mode={mode}
          onSelect={pilih}
          onSelectMany={pilihBanyak}
          onUpdate={updateElement}
          onUpdateMany={updateMany}
          onCreate={tambahElemen}
          onToolDone={selesaiAlat}
          onDropImage={unggahKeCanvas}
          onActivate={aktivasiObjek}
          onCycleMode={siklusMode}
          onEdit={aturEditing}
          onScale={setScale}
          onText={onTextChange}
          onTextSelection={onTextSelection}
        />
        <EditorSidebar
          tab={sidebarTab}
          onTab={setSidebarTab}
          selected={selected}
          selectedElements={selectedElements}
          onAlign={alignSelected}
          mode={mode}
          textBoxOptions={textBoxOptions}
          onChange={updateElement}
          onFormatText={formatText}
          onLinkText={hubungkanTeks}
          onLayer={lapisan}
          onDuplicate={duplikat}
          onDelete={hapus}
          onCopy={salin}
          onCut={potong}
          onFillImage={isiGambar}
          onError={setPesan}
          elements={elements}
          selectedId={selectedId}
          onSelect={pilih}
          refreshKey={imageLibraryRevision}
          onSelectImage={(image) => tambahGambar(image)}
          onDeleteImage={hapusAsetGambar}
        />
      </div>

      <footer className="shrink-0">
        <div className="flex items-center border-t border-stone-300 bg-stone-100">
          <div className="min-w-0 flex-1">
            <PageStrip
              total={pages.length}
              active={hal}
              onSelect={pilihHalaman}
              onAdd={tambahHalaman}
              onDuplicate={duplikatHalaman}
              onDelete={hapusHalaman}
            />
          </div>
          <div className="mr-1 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setMasukanTerbuka("masalah")}
              title="Laporkan masalah"
              aria-label="Laporkan masalah"
              className="flex h-7 items-center gap-1 rounded-lg border border-stone-300 bg-white px-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-200 sm:px-2"
            >
              <Icon name="help" size={14} />
              <span className="hidden sm:inline">Laporkan masalah</span>
            </button>
            <button
              type="button"
              onClick={() => setMasukanTerbuka("saran")}
              title="Beri saran"
              aria-label="Beri saran"
              className="flex h-7 items-center gap-1 rounded-lg border border-stone-300 bg-white px-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-200 sm:px-2"
            >
              <Icon name="text" size={14} />
              <span className="hidden sm:inline">Beri saran</span>
            </button>
          </div>
          <button
            type="button"
            onClick={bukaPreview}
            title="Lihat preview selebaran di tab baru"
            className="mx-2 flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:gap-1.5 sm:px-2.5 sm:text-xs"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M12 7v14m0-14C10.5 5.7 8.6 5 6 5S2.5 5.7 1 7v13c1.5-1.3 3.5-2 6-2s4.5.7 5 2" />
              <path d="M12 7c1.5-1.3 3.4-2 6-2s3.5.7 5 2v13c-1.5-1.3-3.5-2-6-2s-4.5.7-5 2" />
            </svg>
            <span className="whitespace-nowrap">Lihat preview selebaran</span>
          </button>
        </div>
        <StatusBar
          tool={tool}
          mode={mode}
          selected={selectedIds.length === 1 ? selected : null}
          selectedCount={selectedIds.length}
          showModeControls={
            selectedIds.length === 1 && tool === "pilih" && editingId === null
          }
          pesan={pesan}
          zoom={Math.round((scale / PX_PER_MM) * 100)}
          onZoom={zoom}
          onFit={() => setScale(fitScale())}
          onMode={aturMode}
        />
      </footer>

      {helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}
      {masukanTerbuka && (
        <FeedbackModal
          jenis={masukanTerbuka}
          designId={design.id}
          onClose={tutupMasukan}
        />
      )}
    </div>
  );
}
