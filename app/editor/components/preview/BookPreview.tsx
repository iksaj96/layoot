"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, MouseEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { PAPER_SIZE_MM } from "@/lib/types";
import type { DesignElement, DesignPage, EditorDesign } from "@/lib/types";
import ElementView from "../canvas/ElementView";
import { calculateTextFlow } from "../core/textFlow";
import { PX_PER_MM } from "../core/utils";
import { useGoogleFonts } from "../hooks/useGoogleFonts";

const subscribeToFonts = (notify: () => void) => {
  if (typeof document === "undefined") return () => {};
  document.fonts.addEventListener("loadingdone", notify);
  return () => document.fonts.removeEventListener("loadingdone", notify);
};
const getFontsSnapshot = () =>
  typeof document !== "undefined" && document.fonts.status === "loaded";
const getServerFontsSnapshot = () => false;

/* -------------------------------------------------------------------------- */
/*  Hook ukuran elemen                                                        */
/* -------------------------------------------------------------------------- */

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

/* -------------------------------------------------------------------------- */
/*  Render isi halaman memakai koordinat dan komponen yang sama dengan editor */
/* -------------------------------------------------------------------------- */

function PageContent({
  page,
  baseWidth,
  baseHeight,
  scale,
  fontsReady,
}: {
  page: DesignPage | null;
  baseWidth: number;
  baseHeight: number;
  scale: number;
  fontsReady: boolean;
}) {
  const textFlow = useMemo(
    () => calculateTextFlow(page?.elements ?? [], fontsReady),
    [fontsReady, page?.elements]
  );
  if (!page) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: baseWidth,
        height: baseHeight,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {page.elements.map((el: DesignElement) => (
        <ElementView
          key={el.id}
          el={el}
          scale={PX_PER_MM}
          selected={false}
          showHandles={false}
          showModeHandle={false}
          editing={false}
          textFlow={textFlow[el.id]}
          cursor="default"
          mode="ukuran"
          handleScale={1}
          canCycleMode={false}
          onDown={() => {}}
          onHandleDown={() => {}}
          onRadiusDown={() => {}}
          onRotateDown={() => {}}
          onActivate={() => {}}
          onCycleMode={() => {}}
          onText={() => {}}
          onEditEnd={() => {}}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Satu sisi lembaran (depan / belakang)                                     */
/* -------------------------------------------------------------------------- */

function isPageEmpty(page: DesignPage | null) {
  if (!page) return true;
  return page.elements.length === 0;
}

function Face({
  side,
  page,
  num,
  showNumber,
  render,
  baseWidth,
  baseHeight,
  scale,
  fontsReady,
  roundOuter,
}: {
  side: "front" | "back";
  page: DesignPage | null;
  num: number | null;
  showNumber: boolean;
  render: boolean;
  baseWidth: number;
  baseHeight: number;
  scale: number;
  fontsReady: boolean;
  roundOuter: boolean;
}) {
  const empty = isPageEmpty(page);
  const pageW = baseWidth * scale;
  const fontSize = Math.max(11, pageW * 0.045);
  const isFront = side === "front";
  const radius = roundOuter ? 6 : 0;

  const style: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#fffdf8",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transform: isFront ? undefined : "rotateY(180deg)",
    borderRadius: isFront ? `0 ${radius}px ${radius}px 0` : `${radius}px 0 0 ${radius}px`,
  };

  // bayangan lipatan di sisi punggung buku
  const gutter: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: isFront
      ? "linear-gradient(to right, rgba(0,0,0,.24) 0%, rgba(0,0,0,.07) 3.5%, rgba(0,0,0,0) 11%)"
      : "linear-gradient(to left, rgba(0,0,0,.24) 0%, rgba(0,0,0,.07) 3.5%, rgba(0,0,0,0) 11%)",
  };

  return (
    <div style={style}>
      {render && !empty && (
        <PageContent
          page={page}
          baseWidth={baseWidth}
          baseHeight={baseHeight}
          scale={scale}
          fontsReady={fontsReady}
        />
      )}

      {/* Penanda halaman kosong: halaman tetap tampil supaya pengguna tahu ia ada */}
      {empty && (
        <div
          style={{
            position: "absolute",
            inset: "5%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: fontSize * 0.4,
            border: "1.5px dashed #d6d3d1",
            borderRadius: 4,
            color: "#a8a29e",
            fontSize,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontWeight: 600 }}>Halaman kosong</span>
          <span style={{ fontSize: fontSize * 0.8 }}>
            {num ? `Halaman ${num}` : "Pelengkap lembar"}
          </span>
        </div>
      )}

      {/* Nomor halaman di sudut luar */}
      {!empty && showNumber && num !== null && (
        <span
          style={{
            position: "absolute",
            bottom: pageW * 0.03,
            [isFront ? "right" : "left"]: pageW * 0.05,
            fontSize: fontSize * 0.8,
            color: "#78716c",
            pointerEvents: "none",
          }}
        >
          {num}
        </span>
      )}

      <div style={gutter} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                      */
/* -------------------------------------------------------------------------- */

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICON_PREV = "M15 18l-6-6 6-6";
const ICON_NEXT = "M9 18l6-6-6-6";
const ICON_FIRST = "M18 17l-5-5 5-5M11 17l-5-5 5-5";
const ICON_LAST = "M6 17l5-5-5-5M13 17l5-5-5-5";

/* -------------------------------------------------------------------------- */
/*  BookPreview                                                               */
/* -------------------------------------------------------------------------- */

const FLIP_MS = 900;
const JUMP_STAGGER_MS = 80;

export default function BookPreview({ design }: { design: EditorDesign }) {
  const router = useRouter();
  useGoogleFonts();
  const fontsReady = useSyncExternalStore(
    subscribeToFonts,
    getFontsSnapshot,
    getServerFontsSnapshot
  );

  const pages = useMemo(() => design.pages ?? [], [design.pages]);

  const base = useMemo(
    () => {
      const paperSize = PAPER_SIZE_MM[design.paper];
      const width =
        design.orientation === "landscape" ? paperSize.h : paperSize.w;
      const height =
        design.orientation === "landscape" ? paperSize.w : paperSize.h;
      return { width: width * PX_PER_MM, height: height * PX_PER_MM };
    },
    [design.orientation, design.paper],
  );

  // Susunan seperti buku sungguhan:
  //   sampul depan (sendiri) → halaman dalam berpasangan (kiri-kanan) → sampul belakang (sendiri)
  // Bila jumlah halaman ganjil, satu halaman kosong disisipkan di dalam,
  // tepat sebelum sampul belakang, supaya sampul belakang tetap halaman terakhir desain.
  const leaves = useMemo(() => {
    const list: { page: DesignPage | null; num: number | null }[] = pages.map(
      (page, i) => ({ page, num: i + 1 }),
    );
    if (list.length >= 3 && list.length % 2 === 1) {
      list.splice(list.length - 1, 0, { page: null, num: null });
    }
    return list;
  }, [pages]);

  // Nomor halaman hanya ditampilkan di halaman dalam, bukan di sampul
  const isInnerPage = (num: number | null | undefined) =>
    num != null && num !== 1 && num !== pages.length;

  // Setiap lembar kertas punya 2 sisi: depan = leaf 2k, belakang = leaf 2k+1
  const sheetCount = Math.ceil(leaves.length / 2);

  const [stageRef, stage] = useElementSize<HTMLDivElement>();
  const [nav, setNav] = useState({ from: 0, to: 0 });
  const [moving, setMoving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flipped = nav.to; // jumlah lembar yang sudah dibalik ke kiri
  const forward = nav.to > nav.from;
  const isClosedFront = flipped === 0;
  const isClosedBack = flipped === sheetCount;

  /* ----- ukuran buku mengikuti ruang yang tersedia ----- */
  const pad = stage.width < 640 ? 16 : 48;
  const availW = Math.max(stage.width - pad * 2, 0);
  const availH = Math.max(stage.height - pad * 2, 0);
  const scale =
    availW && availH
      ? Math.min(availW / (base.width * 2), availH / base.height, 1.5)
      : 0;
  const W = base.width * scale;
  const H = base.height * scale;

  /* ----- navigasi ----- */
  const goTo = useCallback(
    (target: number) => {
      const to = Math.max(0, Math.min(sheetCount, target));
      setNav((prev) => (to === prev.to ? prev : { from: prev.to, to }));
      setMoving(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => setMoving(false),
        FLIP_MS + JUMP_STAGGER_MS * Math.max(sheetCount, 1) + 100,
      );
    },
    [sheetCount],
  );

  const next = useCallback(() => goTo(flipped + 1), [goTo, flipped]);
  const prev = useCallback(() => goTo(flipped - 1), [goTo, flipped]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(sheetCount);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, sheetCount]);

  /* ----- klik & geser ----- */
  const onBookClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isClosedFront) return next();
    if (isClosedBack) return prev();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) prev();
    else next();
  };

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > 50) prev();
    else if (dx < -50) next();
  };

  /* ----- label halaman ----- */
  const label = (() => {
    if (pages.length === 0) return "";
    if (isClosedFront) return "Sampul depan";
    if (isClosedBack) return "Sampul belakang";
    const left = leaves[flipped * 2 - 1]?.num ?? null;
    const right = leaves[flipped * 2]?.num ?? null;
    if (left && right) return `Halaman ${left}–${right} dari ${pages.length}`;
    const only = left ?? right;
    return only ? `Halaman ${only} dari ${pages.length}` : "";
  })();

  /* ----- posisi: buku tertutup dipusatkan, terbuka = dua halaman ----- */
  const shiftX = isClosedFront ? -W / 2 : isClosedBack ? W / 2 : 0;

  const ease = "cubic-bezier(.645,.045,.355,1)";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 text-stone-100">
      {/* Bilah atas */}
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full px-3 py-1.5 text-sm text-stone-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          Kembali
        </button>
        <h1 className="truncate text-sm font-medium text-stone-200 sm:text-base">
          {design.title || "Tanpa judul"}
        </h1>
        <span className="w-16" aria-hidden="true" />
      </header>

      {/* Panggung */}
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {pages.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-stone-400">
            Desain ini belum punya halaman.
          </p>
        ) : (
          scale > 0 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: W * 2,
                height: H,
                marginLeft: -W,
                marginTop: -H / 2,
                perspective: Math.max(W * 3.5, 1200),
                transform: `translateX(${shiftX}px)`,
                transition: `transform ${FLIP_MS}ms ${ease}`,
                cursor: "pointer",
              }}
              onClick={onBookClick}
              role="group"
              aria-label="Buku preview"
            >
              {/* Bayangan di bawah buku */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: isClosedFront ? W : 0,
                  width: isClosedFront || isClosedBack ? W : W * 2,
                  height: H,
                  borderRadius: 6,
                  boxShadow:
                    "0 30px 60px -10px rgba(0,0,0,.6), 0 10px 24px rgba(0,0,0,.4)",
                  transition: `left ${FLIP_MS}ms ${ease}, width ${FLIP_MS}ms ${ease}`,
                }}
              />

              {/* Lembaran-lembaran */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transformStyle: "preserve-3d",
                }}
              >
                {Array.from({ length: sheetCount }, (_, k) => {
                  const isFlipped = k < flipped;
                  const inRange = forward
                    ? k >= nav.from && k < nav.to
                    : k >= nav.to && k < nav.from;

                  const delay = inRange
                    ? (forward ? k - nav.from : nav.from - 1 - k) * JUMP_STAGGER_MS
                    : 0;

                  const zIndex =
                    moving && inRange
                      ? 1000 + (forward ? k : sheetCount - k)
                      : isFlipped
                        ? k
                        : sheetCount - k;

                  // render isi hanya untuk lembar di dekat halaman aktif
                  const render = Math.abs(k - flipped) <= 2;

                  return (
                    <div
                      key={k}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: W,
                        width: W,
                        height: H,
                        transformOrigin: "left center",
                        transformStyle: "preserve-3d",
                        transform: `rotateY(${isFlipped ? -180 : 0}deg)`,
                        transition: `transform ${FLIP_MS}ms ${ease} ${delay}ms`,
                        zIndex,
                      }}
                    >
                      <Face
                        side="front"
                        page={leaves[k * 2]?.page ?? null}
                        num={leaves[k * 2]?.num ?? null}
                        showNumber={isInnerPage(leaves[k * 2]?.num)}
                        render={render}
                        baseWidth={base.width}
                        baseHeight={base.height}
                        scale={scale}
                        fontsReady={fontsReady}
                        roundOuter
                      />
                      <Face
                        side="back"
                        page={leaves[k * 2 + 1]?.page ?? null}
                        num={leaves[k * 2 + 1]?.num ?? null}
                        showNumber={isInnerPage(leaves[k * 2 + 1]?.num)}
                        render={render}
                        baseWidth={base.width}
                        baseHeight={base.height}
                        scale={scale}
                        fontsReady={fontsReady}
                        roundOuter
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Kontrol bawah */}
      {pages.length > 0 && (
        <footer className="flex flex-col items-center gap-2 px-4 pb-4 pt-2 sm:pb-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <NavButton label="Ke awal" disabled={flipped === 0} onClick={() => goTo(0)}>
              <Icon d={ICON_FIRST} />
            </NavButton>
            <NavButton label="Halaman sebelumnya" disabled={flipped === 0} onClick={prev}>
              <Icon d={ICON_PREV} />
            </NavButton>

            <span
              className="min-w-40 px-3 text-center text-sm tabular-nums text-stone-200"
              aria-live="polite"
            >
              {label}
            </span>

            <NavButton
              label="Halaman berikutnya"
              disabled={flipped === sheetCount}
              onClick={next}
            >
              <Icon d={ICON_NEXT} />
            </NavButton>
            <NavButton
              label="Ke akhir"
              disabled={flipped === sheetCount}
              onClick={() => goTo(sheetCount)}
            >
              <Icon d={ICON_LAST} />
            </NavButton>
          </div>

          <p className="text-xs text-stone-500">
            Klik buku, geser, atau tekan tombol panah untuk membalik halaman.
          </p>
        </footer>
      )}
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-stone-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}