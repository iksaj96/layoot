const PATHS = {
  pointer: [
    "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
  ],
  text: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
  rect: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"],
  ellipse: ["M2 12a10 7 0 1 0 20 0a10 7 0 1 0-20 0z"],
  line: ["M5 19 19 5"],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M10.5 8.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0z",
    "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
  ],
  bold: [
    "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",
  ],
  italic: ["M19 4h-9", "M14 20H5", "M15 4 9 20"],
  underline: ["M6 4v6a6 6 0 0 0 12 0V4", "M4 20h16"],
  alignLeft: ["M21 5H3", "M15 12H3", "M17 19H3"],
  alignCenter: ["M21 5H3", "M17 12H7", "M19 19H5"],
  alignRight: ["M21 5H3", "M21 12H9", "M21 19H7"],
  alignJustify: ["M21 5H3", "M21 12H3", "M21 19H3"],
  alignCenterVertical: ["M12 2v20", "M4 7h16", "M7 12h10", "M5 17h14"],
  alignCenterHorizontal: ["M2 12h20", "M7 4v16", "M12 7v10", "M17 5v14"],
  alignTop: ["M3 4h18", "M7 7v13", "M12 7v9", "M17 7v13"],
  alignBottom: ["M3 20h18", "M7 4v13", "M12 8v9", "M17 4v13"],
  centerPage: ["M4 4h16v16H4z", "M12 7v10", "M7 12h10"],
  copy: [
    "M8 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z",
    "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2",
  ],
  trash: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  ],
  arrowUp: ["M12 19V5", "m5 12 7-7 7 7"],
  arrowDown: ["M12 5v14", "m19 12-7 7-7-7"],
  toFront: ["M5 3h14", "m18 13-6-6-6 6", "M12 7v14"],
  toBack: ["M12 17V3", "m6 11 6 6 6-6", "M19 21H5"],
  undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"],
  redo: ["m15 14 5-5-5-5", "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"],
  help: [
    "M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0z",
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ],
  plus: ["M5 12h14", "M12 5v14"],
  minus: ["M5 12h14"],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
  download: ["M12 15V3", "m7 10 5 5 5-5", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  arrowLeft: ["m12 19-7-7 7-7", "M19 12H5"],
  layers: [
    "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
    "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",
    "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",
  ],
  fill: [
    "M8 3H5a2 2 0 0 0-2 2v3",
    "M21 8V5a2 2 0 0 0-2-2h-3",
    "M3 16v3a2 2 0 0 0 2 2h3",
    "M16 21h3a2 2 0 0 0 2-2v-3",
  ],
  contain: [
    "M8 3v3a2 2 0 0 1-2 2H3",
    "M21 8h-3a2 2 0 0 1-2-2V3",
    "M3 16h3a2 2 0 0 1 2 2v3",
    "M16 21v-3a2 2 0 0 1 2-2h3",
  ],
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

type IconButtonProps = {
  icon: IconName;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  small?: boolean;
};

export function IconButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  danger,
  small,
}: IconButtonProps) {
  const warna = active
    ? "bg-indigo-600 text-white"
    : danger
    ? "text-red-700 hover:bg-red-50"
    : "text-stone-700 hover:bg-stone-200";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`flex shrink-0 items-center justify-center rounded disabled:opacity-40 ${
        small ? "h-6 w-6" : "h-8 w-8"
      } ${warna}`}
    >
      <Icon name={icon} size={small ? 14 : 18} />
    </button>
  );
}