type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: string;
};

export default function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
  width = "w-16",
}: Props) {
  return (
    <label className="flex shrink-0 items-center gap-1 text-xs font-semibold text-stone-600">
      {label}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className={`${width} rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-900`}
      />
    </label>
  );
}