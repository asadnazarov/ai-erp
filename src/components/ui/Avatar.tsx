import { cn } from "@/lib/utils"
import { initials } from "@/lib/utils"

export function Avatar({ name, src, size = 32, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover border border-[var(--color-border)]", className)}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "flex items-center justify-center rounded-full bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]",
        className
      )}
    >
      {initials(name)}
    </div>
  )
}
