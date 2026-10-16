import { memo, useRef } from "react";
import { DEFAULT_FONT_SIZE } from "@/lib/types";
import type { DesignElement, TextStyleRange } from "@/lib/types";
import { borderRadiusCss, radiusOf } from "../core/elementOps";
import { fontCss } from "../core/fonts";
import type { TextFlowSegment } from "../core/textFlow";
import { PT_TO_MM } from "../core/utils";
import type { Handle, Mode } from "../core/utils";
import Icon from "../ui/Icon";
import RichTextInput from "./RichTextInput";
import { cssStyle } from "./RichTextInput";
import { textStyleSegments } from "../core/textStyles";

type Props = {
  el: DesignElement;
  scale: number;
  selected: boolean;
  primarySelected?: boolean;
  showHandles: boolean;
  showModeHandle: boolean;
  editing: boolean;
  textFlow?: TextFlowSegment;
  textStyles?: TextStyleRange[];
  cursor: string;
  mode: Mode;
  handleScale: number;
  canCycleMode: boolean;
  onDown: (e: React.PointerEvent, el: DesignElement) => void;
  onHandleDown: (e: React.PointerEvent, el: DesignElement, h: Handle) => void;
  onRadiusDown: (e: React.PointerEvent, el: DesignElement) => void;
  onRotateDown: (e: React.PointerEvent, el: DesignElement) => void;
  onActivate: (id: string, clickCount: number, canCycleMode: boolean) => void;
  onCycleMode: (id: string) => void;
  onText: (id: string, text: string, start: number, end: number) => void;
  onTextSelection: (id: string, start: number, end: number) => void;
  onEditEnd: () => void;
};

const HANDLES: { h: Handle; pos: React.CSSProperties; cursor: string }[] = [
  { h: "nw", pos: { left: -5, top: -5 }, cursor: "nwse-resize" },
  { h: "n", pos: { left: "50%", top: -5, transform: "translateX(-50%)" }, cursor: "ns-resize" },
  { h: "ne", pos: { right: -5, top: -5 }, cursor: "nesw-resize" },
  { h: "e", pos: { right: -5, top: "50%", transform: "translateY(-50%)" }, cursor: "ew-resize" },
  { h: "sw", pos: { left: -5, bottom: -5 }, cursor: "nesw-resize" },
  { h: "s", pos: { left: "50%", bottom: -5, transform: "translateX(-50%)" }, cursor: "ns-resize" },
  { h: "se", pos: { right: -5, bottom: -5 }, cursor: "nwse-resize" },
  { h: "w", pos: { left: -5, top: "50%", transform: "translateY(-50%)" }, cursor: "ew-resize" },
];

const ElementView = memo(function ElementView({
  el,
  scale,
  selected,
  primarySelected = false,
  showHandles,
  showModeHandle,
  editing,
  textFlow,
  textStyles,
  cursor,
  mode,
  handleScale,
  canCycleMode,
  onDown,
  onHandleDown,
  onRadiusDown,
  onRotateDown,
  onActivate,
  onCycleMode,
  onText,
  onTextSelection,
  onEditEnd,
}: Props) {
  const isShape = el.type === "rect" || el.type === "ellipse";
  const isArtisticText =
    el.type === "text" && (el.textKind ?? "paragraph") === "artistic";
  const pointerAwal = useRef<{
    x: number;
    y: number;
    terpilih: boolean;
    canCycleMode: boolean;
    shift: boolean;
    bergerak: boolean;
  } | null>(null);
  const crop = el.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const sourceElement = el.crop
    ? { ...el, w: el.w / crop.w, h: el.h / crop.h }
    : el;
  const radius = borderRadiusCss(sourceElement, (mm) => `${mm * scale}px`);
  const modeSudut =
    selected &&
    mode === "sudut" &&
    (el.type === "rect" || el.type === "image");
  const modePutar = selected && mode === "putar";
  const shapeStrokeWidth =
    el.stroke === "transparent" ? 0 : (el.strokeWidth ?? 0.5) * scale;
  const innerRadius = borderRadiusCss(
    sourceElement,
    (mm) => `${Math.max(0, mm * scale - shapeStrokeWidth)}px`
  );
  const lineWidth = (el.strokeWidth ?? 0.5) * scale;
  const lineW = el.w * scale;
  const lineH = el.h * scale;
  const lineBoxW = Math.max(lineW, lineWidth, 8);
  const lineBoxH = Math.max(lineH, lineWidth, 8);
  const viewW = el.type === "line" ? lineBoxW : el.w * scale;
  const viewH = el.type === "line" ? lineBoxH : el.h * scale;
  const contentW = viewW / crop.w;
  const contentH = viewH / crop.h;

  const textStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    lineHeight: 1.3,
    fontFamily: fontCss(el.fontFamily),
    fontSize: (el.fontSize ?? DEFAULT_FONT_SIZE) * PT_TO_MM * scale,
    fontWeight: el.bold ? 700 : 400,
    fontStyle: el.italic ? "italic" : "normal",
    textDecoration: el.underline ? "underline" : "none",
    textAlign: el.align ?? "left",
    columnCount: isArtisticText
      ? 1
      : Math.max(1, Math.min(6, Math.floor(el.columns ?? 1))),
    columnFill: "auto",
    columnGap: "1em",
    color: el.color ?? "#1c1917",
    whiteSpace: isArtisticText ? "pre" : "pre-wrap",
  };
  const visibleText = textFlow?.text ?? el.text ?? "";
  const visibleStyleRanges = (textStyles ?? [])
    .map((range) => ({
      ...range,
      start: Math.max(0, range.start - (textFlow?.start ?? 0)),
      end: Math.min(
        visibleText.length,
        range.end - (textFlow?.start ?? 0)
      ),
    }))
    .filter((range) => range.end > range.start);

  return (
    <div
      onPointerDown={(e) => {
        pointerAwal.current = {
          x: e.clientX,
          y: e.clientY,
          terpilih: selected,
          canCycleMode,
          shift: e.shiftKey,
          bergerak: false,
        };
        onDown(e, el);
      }}
      onPointerMove={(e) => {
        const awal = pointerAwal.current;
        if (awal && Math.hypot(e.clientX - awal.x, e.clientY - awal.y) >= 3) {
          awal.bergerak = true;
        }
      }}
      onClick={(e) => {
        const awal = pointerAwal.current;
        pointerAwal.current = null;
        if (
          e.target instanceof Element &&
          e.target.closest("[data-element-handle]")
        ) {
          return;
        }
        if (editing || !awal?.terpilih || awal.shift || awal.bergerak) return;
        onActivate(el.id, e.detail, awal.canCycleMode);
      }}
      style={{
        position: "absolute",
        left: el.x * scale - (el.type === "line" && el.w === 0 ? lineBoxW / 2 : 0),
        top: el.y * scale - (el.type === "line" && el.h === 0 ? lineBoxH / 2 : 0),
        width: el.type === "line" ? lineBoxW : el.w * scale,
        height: el.type === "line" ? lineBoxH : el.h * scale,
        pointerEvents: "auto",
        cursor: editing ? "text" : cursor,
        touchAction: "none",
        outline: selected ? "1px solid #4f46e5" : "none",
        borderRadius:
          el.type === "image"
            ? borderRadiusCss(el, (mm) => `${mm * scale}px`)
            : undefined,
        zIndex: selected ? 2 : undefined,
        transform: `rotate(${el.rotation ?? 0}deg) scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`,
        transformOrigin: `${((0.5 - crop.x) / crop.w) * 100}% ${((0.5 - crop.y) / crop.h) * 100}%`,
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: viewW,
          height: viewH,
          overflow: "hidden",
          borderRadius:
            el.type === "image"
              ? borderRadiusCss(el, (mm) => `${mm * scale}px`)
              : undefined,
        }}
      >
      <div
        style={{
          position: "absolute",
          left: (-crop.x / crop.w) * viewW,
          top: (-crop.y / crop.h) * viewH,
          width: contentW,
          height: contentH,
          background: isShape ? el.fill : undefined,
          borderRadius: radius,
          boxSizing: isShape ? "border-box" : undefined,
          border: isShape
            ? `${shapeStrokeWidth}px solid ${el.stroke ?? "#1c1917"}`
            : undefined,
        }}
      >
      {el.type === "line" && (
        <svg
          width={lineBoxW}
          height={lineBoxH}
          viewBox={`0 0 ${lineBoxW} ${lineBoxH}`}
          aria-label="Garis"
          style={{ display: "block", overflow: "visible", pointerEvents: "none" }}
        >
          <line
            x1={lineW === 0 ? lineBoxW / 2 : el.lineFlip ? lineW : 0}
            y1={lineH === 0 ? lineBoxH / 2 : 0}
            x2={lineW === 0 ? lineBoxW / 2 : el.lineFlip ? 0 : lineW}
            y2={lineH === 0 ? lineBoxH / 2 : lineH}
            stroke={el.stroke ?? "#1c1917"}
            strokeWidth={lineWidth}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Gambar di dalam bentuk */}
      {isShape && el.src && (
        <div
          style={{
            position: "absolute",
            inset: shapeStrokeWidth,
            overflow: "hidden",
            borderRadius: innerRadius,
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={el.src}
            alt=""
            draggable={false}
            decoding="async"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: el.fit ?? "cover",
            }}
          />
        </div>
      )}

      {el.type === "text" &&
        (editing ? (
          <RichTextInput
            value={textFlow?.fullText ?? el.text ?? ""}
            ranges={textStyles}
            columns={isArtisticText ? 1 : el.columns ?? 1}
            fontScale={PT_TO_MM * scale}
            onBlur={onEditEnd}
            baseStyle={{
              ...textStyle,
              columnCount: undefined,
              columnGap: undefined,
              whiteSpace: isArtisticText ? "pre" : "pre-wrap",
              overflowWrap: isArtisticText ? "normal" : "break-word",
            }}
            onChange={(value, start, end) =>
              onText(textFlow?.sourceId ?? el.id, value, start, end)
            }
            onSelectionChange={(start, end) =>
              onTextSelection(textFlow?.sourceId ?? el.id, start, end)
            }
          />
        ) : (
          <div
            style={{
              ...textStyle,
              overflow: "hidden",
              wordBreak: isArtisticText ? "normal" : "break-word",
            }}
          >
            {textStyleSegments(visibleText, visibleStyleRanges).map(
              (segment, index) =>
                segment.style ? (
                  <span
                    key={index}
                    style={cssStyle(segment.style, PT_TO_MM * scale)}
                  >
                    {segment.text}
                  </span>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
            )}
          </div>
        ))}

      {el.type === "image" && el.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={el.src}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: el.fit ?? "cover",
            pointerEvents: "none",
          }}
        />
      )}
      </div>
      </div>

      {selected && primarySelected && (
        <span
          aria-label="Objek acuan seleksi"
          title="Objek acuan seleksi"
          style={{
            position: "absolute",
            right: -4,
            top: -4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#4f46e5",
            border: "1px solid #fff",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />
      )}

      {selected && showModeHandle && !editing && canCycleMode && (
        <button
          type="button"
          data-element-handle
          title={`Mode ${mode}; klik untuk ${mode === "ukuran" ? "putar" : mode === "putar" && (el.type === "rect" || el.type === "image") ? "sudut" : "ukuran"}`}
          aria-label={`Mode ${mode}. Klik untuk mengganti mode`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onCycleMode(el.id);
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 28 * handleScale,
            height: 28 * handleScale,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            border: "2px solid #fff",
            borderRadius: "50%",
            background: "#4f46e5",
            color: "#fff",
            boxShadow: "0 0 0 1px #1c1917",
            cursor: "pointer",
            touchAction: "none",
            zIndex: 3,
          }}
        >
          <Icon
            name={mode === "ukuran" ? "rect" : mode === "putar" ? "rotate" : "fill"}
            size={14 * handleScale}
          />
        </button>
      )}

      {/* Titik ubah ukuran */}
      {selected &&
        showHandles &&
        !editing &&
        !modeSudut &&
        HANDLES.filter((hd) =>
          !isArtisticText ||
          hd.h === "nw" ||
          hd.h === "ne" ||
          hd.h === "sw" ||
          hd.h === "se"
        ).map((hd) => (
          <div
            key={hd.h}
            data-element-handle
            onPointerDown={(e) => onHandleDown(e, el, hd.h)}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              background: "#fff",
              border: "1px solid #1c1917",
              cursor: hd.cursor,
              touchAction: "none",
              ...hd.pos,
            }}
          />
        ))}

      {/* Titik atur sudut (mode sudut) */}
      {selected && showHandles && !editing && modeSudut && (
        <div
          data-element-handle
          title="Seret untuk mengatur sudut"
          onPointerDown={(e) => onRadiusDown(e, el)}
          style={{
            position: "absolute",
            left: (el.w - radiusOf(el)) * scale - 7,
            top: -7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#f97316",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px #1c1917",
            cursor: "ew-resize",
            touchAction: "none",
          }}
        />
      )}

      {selected && showHandles && !editing && modePutar && (
        <div
          data-element-handle
          title="Seret untuk memutar objek"
          onPointerDown={(e) => onRotateDown(e, el)}
          style={{
            position: "absolute",
            left: "50%",
            top: -30,
            width: 14,
            height: 14,
            transform: "translateX(-50%)",
            borderRadius: "50%",
            background: "#4f46e5",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px #1c1917",
            cursor: "grab",
            touchAction: "none",
          }}
        />
      )}
    </div>
  );
});

export default ElementView;