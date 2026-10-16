export type Paper = "A4" | "F4";

export const DEFAULT_FONT_SIZE = 12;

export const PAPER_OPTIONS: readonly { value: Paper; label: string }[] = [
  { value: "A4", label: "A4 (210 × 297 mm)" },
  { value: "F4", label: "F4 (215 × 330 mm)" },
];

export const PAPER_SIZE_MM: Record<Paper, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  F4: { w: 215, h: 330 },
};

export type ElementType = "text" | "rect" | "ellipse" | "image" | "line";

export type ElementCrop = { x: number; y: number; w: number; h: number };

export type DesignElement = {
  id: string;
  type: ElementType;
  x: number; // mm
  y: number; // mm
  w: number; // mm
  h: number; // mm
  text?: string;
  textKind?: "artistic" | "paragraph";
  textAutoHeight?: boolean;
  fontFamily?: string; // nama font, mis. "Times New Roman"
  fontSize?: number; // pt
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right" | "justify";
  columns?: number;
  nextTextBoxId?: string;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number; // mm
  lineFlip?: boolean;
  radius?: number; // mm, kelengkungan sudut persegi
  rotation?: number; // derajat
  flipX?: boolean;
  flipY?: boolean;
  src?: string; // gambar (type "image") atau gambar isi di dalam rect/ellipse
  fit?: "cover" | "contain";
  crop?: ElementCrop;
};

export type DesignPage = { id: string; elements: DesignElement[] };

export type Design = {
  id: string;
  user_id: string;
  title: string;
  paper: Paper;
  orientation: "portrait" | "landscape";
  pages: DesignPage[];
  created_at: string;
  updated_at: string;
};

export type EditorDesign = Pick<
  Design,
  "id" | "title" | "paper" | "orientation" | "pages" | "updated_at"
>;