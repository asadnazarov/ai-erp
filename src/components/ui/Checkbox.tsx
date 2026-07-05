import * as RCheckbox from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function Checkbox({ checked, onCheckedChange, className }: { checked: boolean; onCheckedChange: (v: boolean) => void; className?: string }) {
  return (
    <RCheckbox.Root
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(!!v)}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] data-[state=checked]:bg-[var(--color-accent)] data-[state=checked]:border-[var(--color-accent)] transition-colors cursor-pointer",
        className
      )}
    >
      <RCheckbox.Indicator>
        <Check size={13} strokeWidth={3} className="text-white" />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  )
}
