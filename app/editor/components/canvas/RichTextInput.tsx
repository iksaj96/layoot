"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { InlineTextStyle, TextStyleRange } from "@/lib/types";
import { textStyleSegments } from "../core/textStyles";

type Props = {
  value: string;
  ranges?: TextStyleRange[];
  columns: number;
  fontScale: number;
  baseStyle: CSSProperties;
  onChange: (text: string, start: number, end: number) => void;
  onSelectionChange: (start: number, end: number) => void;
  onBlur: () => void;
};

export function cssStyle(
  style: InlineTextStyle,
  fontScale: number
): CSSProperties {
  return {
    ...(style.bold !== undefined ? { fontWeight: style.bold ? 700 : 400 } : {}),
    ...(style.italic !== undefined
      ? { fontStyle: style.italic ? "italic" : "normal" }
      : {}),
    ...(style.underline !== undefined
      ? { textDecoration: style.underline ? "underline" : "none" }
      : {}),
    ...(style.color ? { color: style.color } : {}),
    ...(style.fontSize ? { fontSize: `${style.fontSize * fontScale}px` } : {}),
  };
}

function offsetAt(
  root: HTMLElement,
  node: Node,
  offset: number
): number | null {
  if (!root.contains(node) && root !== node) return null;
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
  } catch {
    return null;
  }
  return range.toString().length;
}

function textPoint(root: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) return { node, offset: remaining };
    remaining -= length;
    node = walker.nextNode();
  }
  return null;
}

function readSelection(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.anchorNode || !selection.focusNode) return null;
  const start = offsetAt(root, selection.anchorNode, selection.anchorOffset);
  const end = offsetAt(root, selection.focusNode, selection.focusOffset);
  if (start === null || end === null) return null;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function insertPlainText(root: HTMLElement, text: string) {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!selection || !range || !root.contains(range.commonAncestorContainer)) return;
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStart(node, text.length);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}

export default function RichTextInput({
  value,
  ranges,
  columns,
  fontScale,
  baseStyle,
  onChange,
  onSelectionChange,
  onBlur,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const segments = textStyleSegments(value, ranges);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || document.activeElement !== root) return;
    const start = textPoint(root, selectionRef.current.start);
    const end = textPoint(root, selectionRef.current.end);
    if (!start || !end) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [ranges, value]);

  function setSelection() {
    const root = rootRef.current;
    const selected = root ? readSelection(root) : null;
    if (!selected) return;
    selectionRef.current = selected;
    onSelectionChange(selected.start, selected.end);
  }

  function input(event: FormEvent<HTMLDivElement>) {
    const root = event.currentTarget;
    const selection = readSelection(root) ?? selectionRef.current;
    selectionRef.current = selection;
    onChange(root.innerText.replace(/\r\n?/g, "\n"), selection.start, selection.end);
  }

  return (
    <div
      ref={rootRef}
      data-text-editor
      role="textbox"
      aria-label="Edit teks"
      aria-multiline="true"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={input}
      onPaste={(event) => {
        event.preventDefault();
        insertPlainText(
          event.currentTarget,
          event.clipboardData.getData("text/plain")
        );
      }}
      onKeyUp={setSelection}
      onMouseUp={setSelection}
      onFocus={setSelection}
      onBlur={() => {
        setSelection();
        window.setTimeout(() => {
          const active = document.activeElement;
          if (
            active instanceof HTMLElement &&
            (active.closest("[data-text-format]") ||
              active.closest("[data-text-editor]"))
          ) {
            return;
          }
          onBlur();
        }, 0);
      }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          insertPlainText(event.currentTarget, "\n");
          return;
        }
        if (event.key === "Escape") (event.currentTarget as HTMLElement).blur();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        ...baseStyle,
        columnCount: Math.max(1, Math.min(6, Math.floor(columns))),
        columnFill: "auto",
        columnGap: "1em",
        overflow: "auto",
        overflowWrap: "break-word",
        resize: "none",
        border: "none",
        outline: "none",
        padding: 0,
        margin: 0,
        background: "#fff",
        userSelect: "text",
        WebkitUserSelect: "text",
      }}
    >
      {segments.map((segment, index) =>
        segment.style ? (
          <span key={index} style={cssStyle(segment.style, fontScale)}>
            {segment.text}
          </span>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </div>
  );
}
