import { memo } from "react";
import type { DesignElement } from "@/lib/types";
import { borderRadiusCss, radiusOf } from "../core/elementOps";
import { fontCss } from "../core/fonts";
import type { TextFlowSegment } from "../core/textFlow";
import { PT_TO_MM } from "../core/utils";
import type { Handle, Mode } from "../core/utils";

type Props = {
  el: DesignElement;
  scale: number;
  selected: boolean;
  showHandles: boolean;
  editing: boolean;
  textFlow?: TextFlowSegment;
  cursor: string;
  mode: Mode;
  onDown: (e: React.PointerEvent, el: DesignElement) => void;
  onHandleDown: (e: React.PointerEvent, el: DesignElement, h: Handle) => void;
  onRadiusDown: (e: React.PointerEvent, el: DesignElement) => void;
  onRotateDown: (e: React.PointerEvent, el: DesignElement) => void;
  onActivate: (id: string, clickCount: number) => void;
  onText: (id: string, text: string) => void;
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
  showHandles,
  editing,
  textFlow,
  cursor,
  mode,
  onDown,
  onHandleDown,
  onRadiusDown,
  onRotateDown,
  onActivate,
  onText,
  onEditEnd,
}: Props) {
  const isShape = el.type === "rect" || el.type === "ellipse";
  const crop = el.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const sourceElement = el.crop
    ? { ...el, w: el.w / crop.w, h: el.h / crop.h }
    : el;
  const radius = borderRadiusCss(sourceElement, (mm) => `${mm * scale}px`);
  const modeSudut = selected && mode === "sudut" && el.type === "rect";
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
    fontSize: (el.fontSize ?? 12) * PT_TO_MM * scale,
    fontWeight: el.bold ? 700 : 400,
    fontStyle: el.italic ? "italic" : "normal",
    textDecoration: el.underline ? "underline" : "none",
    textAlign: el.align ?? "left",
    columnCount: Math.max(1, Math.min(6, Math.floor(el.columns ?? 1))),
    columnFill: "auto",
    columnGap: "1em",
    color: el.color ?? "#1c1917",
  };

  return (
    <div
      onPointerDown={(e) => onDown(e, el)}
      onClick={(e) => {
        if (editing) return;
        if (
          e.target instanceof Element &&
          e.target.closest("[data-element-handle]")
        ) {
          return;
        }
        onActivate(el.id, e.detail);
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
        overflow: "hidden",
        outline: selected ? "1px solid #4f46e5" : "none",
        transform: `rotate(${el.rotation ?? 0}deg) scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`,
        transformOrigin: `${((0.5 - crop.x) / crop.w) * 100}% ${((0.5 - crop.y) / crop.h) * 100}%`,
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
          <textarea
            autoFocus
            value={textFlow?.fullText ?? el.text ?? ""}
            onChange={(e) => onText(textFlow?.sourceId ?? el.id, e.target.value)}
            onBlur={onEditEnd}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") onEditEnd();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              ...textStyle,
              columnCount: 1,
              resize: "none",
              border: "none",
              outline: "none",
              padding: 0,
              margin: 0,
              background: "#fff",
              userSelect: "text",
            }}
          />
        ) : (
          <div
            style={{
              ...textStyle,
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {textFlow?.text ?? el.text}
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

      {/* Titik ubah ukuran */}
      {selected &&
        showHandles &&
        !editing &&
        !modeSudut &&
        HANDLES.map((hd) => (
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