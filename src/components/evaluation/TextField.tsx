import type { KeyboardEvent } from "react";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal" | "search" | "url" | "none";
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  maxLength,
  type = "text",
  inputMode,
  onBlur,
  onKeyDown,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}