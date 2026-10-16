import type { InlineTextStyle, TextStyleRange } from "@/lib/types";

export function applyTextStyle(
  ranges: TextStyleRange[] | undefined,
  start: number,
  end: number,
  style: InlineTextStyle
): TextStyleRange[] {
  if (start >= end) return ranges ?? [];
  const boundaries = new Set([start, end]);
  for (const range of ranges ?? []) {
    boundaries.add(range.start);
    boundaries.add(range.end);
  }
  const points = [...boundaries].sort((a, b) => a - b);
  const next: TextStyleRange[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const existing = (ranges ?? []).find(
      (range) => range.start <= from && range.end >= to
    )?.style;
    const updated =
      from < end && to > start
        ? { ...existing, ...style }
        : existing;
    if (!updated || Object.keys(updated).length === 0) continue;

    const previous = next.at(-1);
    if (
      previous &&
      previous.end === from &&
      JSON.stringify(previous.style) === JSON.stringify(updated)
    ) {
      previous.end = to;
    } else {
      next.push({ start: from, end: to, style: updated });
    }
  }
  return next;
}

export function remapTextStyles(
  ranges: TextStyleRange[] | undefined,
  previousText: string,
  nextText: string
): TextStyleRange[] {
  if (!ranges?.length || previousText === nextText) return ranges ?? [];
  let prefix = 0;
  while (
    prefix < previousText.length &&
    prefix < nextText.length &&
    previousText[prefix] === nextText[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < previousText.length - prefix &&
    suffix < nextText.length - prefix &&
    previousText[previousText.length - 1 - suffix] ===
      nextText[nextText.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const oldEnd = previousText.length - suffix;
  const newEnd = nextText.length - suffix;
  const delta = newEnd - oldEnd;
  const mapped: TextStyleRange[] = [];

  for (const range of ranges) {
    if (range.start < prefix) {
      mapped.push({
        start: range.start,
        end: Math.min(range.end, prefix),
        style: range.style,
      });
    }
    if (range.end > oldEnd) {
      mapped.push({
        start: Math.max(range.start, oldEnd) + delta,
        end: range.end + delta,
        style: range.style,
      });
    }
    if (range.start < prefix && range.end > oldEnd && oldEnd < prefix) {
      mapped.push({
        start: prefix,
        end: oldEnd + delta,
        style: range.style,
      });
    }
  }

  return mapped.filter((range) => range.end > range.start);
}

export function textStyleSegments(
  text: string,
  ranges: TextStyleRange[] | undefined
): { text: string; style?: InlineTextStyle }[] {
  if (!ranges?.length || !text) return [{ text }];
  const boundaries = new Set([0, text.length]);
  for (const range of ranges) {
    boundaries.add(Math.max(0, Math.min(text.length, range.start)));
    boundaries.add(Math.max(0, Math.min(text.length, range.end)));
  }

  const points = [...boundaries].sort((a, b) => a - b);
  const segments: { text: string; style?: InlineTextStyle }[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    if (start === end) continue;
    const style = ranges
      .filter((range) => range.start <= start && range.end >= end)
      .reduce<InlineTextStyle>(
        (merged, range) => ({ ...merged, ...range.style }),
        {}
      );
    const hasStyle = Object.keys(style).length > 0;
    const previous = segments.at(-1);
    if (
      previous &&
      JSON.stringify(previous.style) === JSON.stringify(hasStyle ? style : undefined)
    ) {
      previous.text += text.slice(start, end);
    } else {
      segments.push({
        text: text.slice(start, end),
        style: hasStyle ? style : undefined,
      });
    }
  }
  return segments;
}

export function textStyleAt(
  ranges: TextStyleRange[] | undefined,
  index: number
): InlineTextStyle {
  return (ranges ?? [])
    .filter((range) => range.start <= index && index < range.end)
    .reduce<InlineTextStyle>(
      (merged, range) => ({ ...merged, ...range.style }),
      {}
    );
}
