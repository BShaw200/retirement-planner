import { useEffect, useId, useState } from "react";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
}

/** A number box that lets people type freely and only saves sensible values. */
export function NumberField({
  id, label, value, onChange, prefix, suffix, help, min = 0, max, step = 1,
}: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  const helpId = useId();

  // Keep the box in step when the value changes from elsewhere (loading a scenario).
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
  }, [value]);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={text}
          min={min}
          max={max}
          step={step}
          aria-describedby={help ? helpId : undefined}
          onChange={(e) => {
            setText(e.target.value);
            const next = Number(e.target.value);
            if (e.target.value.trim() !== "" && Number.isFinite(next)) onChange(next);
          }}
          onBlur={() => setText(String(value))}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
      {help && <p className="help" id={helpId}>{help}</p>}
    </div>
  );
}

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  help?: string;
  describe: (value: number) => string;
}

/** A slider for choosing an age, with a plain-language note under it. */
export function SliderField({ id, label, value, onChange, min, max, help, describe }: SliderFieldProps) {
  const helpId = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} <strong className="slider-value">{value}</strong>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-describedby={helpId}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="slider-scale" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <p className="help" id={helpId}>
        {describe(value)}
        {help ? ` ${help}` : ""}
      </p>
    </div>
  );
}

interface ToggleFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  help?: string;
}

export function ToggleField({ id, label, checked, onChange, help }: ToggleFieldProps) {
  return (
    <div className="field field-toggle">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {label}
        {help && <span className="help">{help}</span>}
      </label>
    </div>
  );
}
