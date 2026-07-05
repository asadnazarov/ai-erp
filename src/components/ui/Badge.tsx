import type { HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badge = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
      accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
      success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    },
  },
  defaultVariants: { tone: "neutral" },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />
}
