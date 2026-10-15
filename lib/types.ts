export type Paper = "A4" | "F4";

export const PAPER_SIZE_MM: Record<Paper, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  F4: { w: 215, h: 330 },
};

export type ElementType = "text" | "rect" | "ellipse" | "image";

export type DesignElement = {
  id: string;
  type: ElementType;
  x: number; // mm
  y: number; // mm
  w: number; // mm
  h: number; // mm
  text?: string;
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
  radius?: number; // mm, kelengkungan sudut persegi
  src?: string; // gambar (type "image") atau gambar isi di dalam rect/ellipse
  fit?: "cover" | "contain";
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
  "id" | "title" | "paper" | "orientation" | "pages"
>;