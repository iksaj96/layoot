import { DEFAULT_FONT_SIZE } from "@/lib/types";
import type { DesignElement } from "@/lib/types";
import { fontCss } from "./fonts";
import { PX_PER_MM, PT_TO_MM } from "./utils";

export function measureTextWidthMm(el: DesignElement, text: string): number {
  const size = (el.fontSize ?? DEFAULT_FONT_SIZE) * PT_TO_MM;
  const context =
    typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");

  if (!context) return Math.max(5, Array.from(text).length * size * 0.52 + 1);

  const declaredFamily = fontCss(el.fontFamily);
  const family =
    declaredFamily === "inherit"
      ? getComputedStyle(document.body).fontFamily || "Arial, sans-serif"
      : declaredFamily;
  context.font = `${el.italic ? "italic " : ""}${el.bold ? "700 " : "400 "}${size * PX_PER_MM}px ${family}`;
  return Math.max(5, context.measureText(text).width / PX_PER_MM + 1);
}
