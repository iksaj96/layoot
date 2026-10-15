"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DesignElement, DesignPage } from "@/lib/types";
import { borderRadiusCss } from "../core/elementOps";
import { fontCss } from "../core/fonts";
import type { TextFlowSegment } from "../core/textFlow";
import { calculateTextFlow } from "../core/textFlow";
import Icon from "../ui/Icon";

type Props = {
  title: string;
  pages: DesignPage[];
  size: { w: number; h: number };
};

function CetakElemen({
  el,
  textFlow,
}: {
  el: DesignElement;
  textFlow?: TextFlowSegment;
}) {
  const isShape = el.type === "rect" || el.type === "ellipse";
  const radius = borderRadiusCss(el, (mm) => `${mm}mm`);
  const shapeStrokeWidth = el.stroke === "transparent" ? 0 : el.strokeWidth ?? 0.5;
  const innerRadius = borderRadiusCss(
    el,
    (mm) => `${Math.max(0, mm - shapeStrokeWidth)}mm`
  );
  const strokeWidth = el.strokeWidth ?? 0.5;
  const lineW = el.w;
  const lineH = el.h;
  const lineBoxW = Math.max(lineW, strokeWidth);
  const lineBoxH = Math.max(lineH, strokeWidth);

  return (
    <div
      style={{
        position: "absolute",
        left: `${el.x}mm`,
        top: `${el.y}mm`,
        width: `${el.w}mm`,
        height: `${el.h}mm`,
        background: isShape ? el.fill : undefined,
        borderRadius: radius,
        boxSizing: isShape ? "border-box" : undefined,
        border: isShape
          ? `${shapeStrokeWidth}mm solid ${el.stroke ?? "#1c1917"}`
          : undefined,
        overflow: isShape && el.src ? "hidden" : undefined,
      }}
    >
      {el.type === "line" && (
        <svg
          width={`${lineBoxW}mm`}
          height={`${lineBoxH}mm`}
          viewBox={`0 0 ${lineBoxW} ${lineBoxH}`}
          style={{
            position: "absolute",
            left: lineW === 0 ? `${-lineBoxW / 2}mm` : 0,
            top: lineH === 0 ? `${-lineBoxH / 2}mm` : 0,
            overflow: "visible",
          }}
        >
          <line
            x1={lineW === 0 ? lineBoxW / 2 : el.lineFlip ? lineW : 0}
            y1={lineH === 0 ? lineBoxH / 2 : 0}
            x2={lineW === 0 ? lineBoxW / 2 : el.lineFlip ? 0 : lineW}
            y2={lineH === 0 ? lineBoxH / 2 : lineH}
            stroke={el.stroke ?? "#1c1917"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      )}

      {isShape && el.src && (
        <div
          style={{
            position: "absolute",
            inset: `${shapeStrokeWidth}mm`,
            overflow: "hidden",
            borderRadius: innerRadius,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={el.src}
            alt=""
            loading="eager"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: el.fit ?? "cover",
            }}
          />
        </div>
      )}

      {el.type === "text" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.3,
            fontFamily: fontCss(el.fontFamily),
            fontSize: `${el.fontSize ?? 12}pt`,
            fontWeight: el.bold ? 700 : 400,
            fontStyle: el.italic ? "italic" : "normal",
            textDecoration: el.underline ? "underline" : "none",
            textAlign: el.align ?? "left",
            columnCount: Math.max(1, Math.min(6, Math.floor(el.columns ?? 1))),
            columnFill: "auto",
            columnGap: "1em",
            color: el.color ?? "#1c1917",
          }}
        >
          {textFlow?.text ?? el.text}
        </div>
      )}

      {el.type === "image" && el.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={el.src}
          alt=""
          loading="eager"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: el.fit ?? "cover",
          }}
        />
      )}
    </div>
  );
}

export default function ExportPdf({ title, pages, size }: Props) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;

    const judulAwal = document.title;
    document.title = title.trim() || "Desain Layoot";
    let batal = false;

    const selesai = () => {
      document.title = judulAwal;
      setPrinting(false);
    };
    window.addEventListener("afterprint", selesai);

    (async () => {
      const gambar = Array.from(
        document.querySelectorAll<HTMLImageElement>("#area-cetak img")
      );
      await Promise.all(gambar.map((g) => g.decode().catch(() => undefined)));
      try {
        await document.fonts.ready;
      } catch {
        /* abaikan */
      }
      if (!batal) window.print();
    })();

    return () => {
      batal = true;
      window.removeEventListener("afterprint", selesai);
      document.title = judulAwal;
    };
  }, [printing, title]);

  return (
    <>
      <button
        onClick={() => setPrinting(true)}
        disabled={printing}
        title="Ekspor PDF"
        className="flex h-8 shrink-0 items-center gap-1.5 rounded bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Icon name="download" size={16} />
        <span className="hidden sm:inline">
          {printing ? "Menyiapkan..." : "Ekspor PDF"}
        </span>
      </button>

      {printing &&
        createPortal(
          <div id="area-cetak" className="hidden print:block">
            <style>{`
              @page { size: ${size.w}mm ${size.h}mm; margin: 0; }
              #area-cetak, #area-cetak * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            `}</style>
            {pages.map((p, i) => {
              const textFlow = calculateTextFlow(p.elements);
              return (
                <div
                  key={p.id}
                  style={{
                    position: "relative",
                    width: `${size.w}mm`,
                    height: `${size.h}mm`,
                    overflow: "hidden",
                    background: "#fff",
                    breakAfter: i < pages.length - 1 ? "page" : "auto",
                  }}
                >
                  {p.elements.map((el) => (
                    <CetakElemen key={el.id} el={el} textFlow={textFlow[el.id]} />
                  ))}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
