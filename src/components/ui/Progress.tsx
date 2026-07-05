import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function Progress({ value, className, tone = "accent" }: { value: number; className?: string; tone?: "accent" | "success" | "warning" | "danger" }) {
  const colors: Record<string, string> = {
    accent: "var(--color-accent)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  }
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: colors[tone] }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
