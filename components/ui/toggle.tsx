"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <span
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--border)" }}
      >
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          aria-label={label}
        />
        <span
          className="pointer-events-none inline-block h-3.5 w-3.5 translate-x-1 transform rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(4px)" }}
        />
      </span>
      <span>
        <span>{label}</span>
        {description ? <span className="block text-xs text-ink-muted">{description}</span> : null}
      </span>
    </label>
  );
}
