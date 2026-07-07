import { cn } from "@/lib/utils"

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="inline-flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
              : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
