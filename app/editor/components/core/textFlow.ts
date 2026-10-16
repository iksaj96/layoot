import { DEFAULT_FONT_SIZE } from "@/lib/types";
import type { DesignElement } from "@/lib/types";
import { PX_PER_MM, PT_TO_MM } from "./utils";
import { fontCss } from "./fonts";

export type TextFlowSegment = {
  sourceId: string;
  text: string;
  fullText: string;
  start: number;
};

function fontSizeMm(el: DesignElement): number {
  return (el.fontSize ?? DEFAULT_FONT_SIZE) * PT_TO_MM;
}

function measureTextMm(
  el: DesignElement,
  useCanvasMetrics: boolean
): (text: string) => number {
  const size = fontSizeMm(el);
  const declaredFamily = fontCss(el.fontFamily);
  const family =
    declaredFamily === "inherit" && typeof document !== "undefined"
      ? getComputedStyle(document.body).fontFamily || "Arial, sans-serif"
      : declaredFamily === "inherit"
        ? "Arial, sans-serif"
        : declaredFamily;
  const context =
    !useCanvasMetrics || typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");
  if (context) {
    context.font = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${size * PX_PER_MM}px ${family}`;
  }
  return context
    ? (text: string) => context.measureText(text).width / PX_PER_MM
    : (text: string) => Array.from(text).length * size * 0.52;
}

function lineStarts(
  text: string,
  width: number,
  measure: (text: string) => number
): number[] {
  if (!text) return [];

  const starts: number[] = [];
  let paragraphStart = 0;

  for (const paragraph of text.split("\n")) {
    const words = [...paragraph.matchAll(/\S+/g)];
    if (words.length === 0) {
      starts.push(paragraphStart);
    } else {
      let lineStart = paragraphStart + (words[0].index ?? 0);
      let lineWidth = 0;

      for (const wordMatch of words) {
        const word = wordMatch[0];
        const wordStart = paragraphStart + (wordMatch.index ?? 0);
        const wordWidth = measure(word);

        if (wordWidth > width) {
          if (lineWidth > 0) starts.push(lineStart);
          const pieceStarts = [0];
          let pieceWidth = 0;
          let characterOffset = 0;

          for (const character of Array.from(word)) {
            const characterWidth = measure(character);
            if (pieceWidth > 0 && pieceWidth + characterWidth > width) {
              pieceStarts.push(characterOffset);
              pieceWidth = 0;
            }
            pieceWidth += characterWidth;
            characterOffset += character.length;
          }

          starts.push(...pieceStarts.slice(0, -1).map((offset) => wordStart + offset));
          const pieceStart = pieceStarts[pieceStarts.length - 1];
          lineStart = wordStart + pieceStart;
          lineWidth = pieceWidth;
          continue;
        }

        const nextWidth = lineWidth === 0
          ? wordWidth
          : lineWidth + measure(" ") + wordWidth;
        if (lineWidth > 0 && nextWidth > width) {
          starts.push(lineStart);
          lineStart = wordStart;
          lineWidth = wordWidth;
        } else {
          lineWidth = nextWidth;
        }
      }

      starts.push(lineStart);
    }
    paragraphStart += paragraph.length + 1;
  }

  return starts;
}

function fitTextEnd(
  text: string,
  el: DesignElement,
  useCanvasMetrics: boolean
): number {
  if (!text) return 0;

  const columns = Math.max(1, Math.min(6, Math.floor(el.columns ?? 1)));
  const size = fontSizeMm(el);
  const columnWidth = Math.max(1, (el.w - size * (columns - 1)) / columns);
  const starts = lineStarts(text, columnWidth, measureTextMm(el, useCanvasMetrics));
  const capacity = Math.max(1, Math.floor(el.h / (size * 1.3))) * columns;
  return starts.length <= capacity ? text.length : starts[capacity];
}

export function calculateTextHeightMm(
  el: DesignElement,
  text: string,
  useCanvasMetrics = true
): number {
  const columns = Math.max(1, Math.min(6, Math.floor(el.columns ?? 1)));
  const size = fontSizeMm(el);
  const columnWidth = Math.max(1, (el.w - size * (columns - 1)) / columns);
  const measure = measureTextMm(el, useCanvasMetrics);
  const lines = Math.max(1, lineStarts(text, columnWidth, measure).length);
  return Math.ceil(lines / columns) * size * 1.3;
}

export function calculateTextFlow(
  elements: DesignElement[],
  useCanvasMetrics = true
): Record<string, TextFlowSegment> {
  const boxes = elements.filter((el) => el.type === "text");
  const linkableBoxes = boxes.filter(
    (el) => (el.textKind ?? "paragraph") !== "artistic"
  );
  const ids = new Set(linkableBoxes.map((el) => el.id));
  const incoming = new Set(
    linkableBoxes
      .map((el) => el.nextTextBoxId)
      .filter((id): id is string => !!id && ids.has(id))
  );
  const result: Record<string, TextFlowSegment> = {};

  for (const root of linkableBoxes) {
    if (incoming.has(root.id)) continue;

    const fullText = root.text ?? "";
    let remaining = fullText;
    let start = 0;
    let current: DesignElement | undefined = root;
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      const end = start + fitTextEnd(remaining, current, useCanvasMetrics);
      result[current.id] = {
        sourceId: root.id,
        text: fullText.slice(start, end),
        fullText,
        start,
      };
      remaining = fullText.slice(end);
      start = end;
      current = linkableBoxes.find((el) => el.id === current?.nextTextBoxId);
    }
  }

  for (const box of boxes) {
    if (result[box.id]) continue;
    const text = box.text ?? "";
    result[box.id] = { sourceId: box.id, text, fullText: text, start: 0 };
  }

  return result;
}
