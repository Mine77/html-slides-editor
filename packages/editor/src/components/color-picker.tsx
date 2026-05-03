const SWATCHES = [
  "#0f172a",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#a78bfa",
];

const GRADIENTS = [
  "linear-gradient(135deg,#a855f7,#ec4899)",
  "linear-gradient(135deg,#06b6d4,#8b5cf6)",
  "linear-gradient(135deg,#f59e0b,#ec4899)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#f97316,#ef4444)",
  "linear-gradient(135deg,#8b5cf6,#3b82f6)",
];

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const colorInputValue = value.startsWith("#") ? value : "#0f172a";

  return (
    <div className="hse-color-picker">
      <div className="hse-color-picker-preview-row">
        <span
          className="hse-color-picker-preview"
          style={{ background: value }}
          aria-hidden="true"
        />
        <input
          className="hse-color-picker-hex"
          type="text"
          value={value}
          spellCheck={false}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      </div>

      <input
        className="hse-color-picker-spectrum"
        type="color"
        value={colorInputValue}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />

      <section className="hse-color-picker-section" aria-label="Preset colors">
        <div className="hse-color-picker-section-title">色板</div>
        <div className="hse-color-picker-swatch-grid">
          {SWATCHES.map((color) => (
            <button
              key={color}
              className={color.toLowerCase() === value.toLowerCase() ? "is-selected" : undefined}
              type="button"
              style={{ background: color }}
              aria-label={`Use ${color}`}
              onClick={() => {
                onChange(color);
              }}
            />
          ))}
        </div>
      </section>

      <section className="hse-color-picker-section" aria-label="Preset gradients">
        <div className="hse-color-picker-section-title">渐变</div>
        <div className="hse-color-picker-gradient-grid">
          {GRADIENTS.map((gradient) => (
            <button
              key={gradient}
              className={gradient === value ? "is-selected" : undefined}
              type="button"
              style={{ background: gradient }}
              aria-label="Use gradient"
              onClick={() => {
                onChange(gradient);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export { ColorPicker };
