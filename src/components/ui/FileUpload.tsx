import { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Paperclip, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function FileUpload({
  folder,
  value,
  onUploaded,
  accept = "image/*,.pdf,.doc,.docx,.xlsx",
  label = "Fayl biriktirish",
}: {
  folder: string
  value?: string | null
  onUploaded: (publicUrl: string) => void
  accept?: string
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, { upsert: false })
    if (upErr) {
      setError(upErr.message)
      setLoading(false)
      return
    }
    const { data } = supabase.storage.from("attachments").getPublicUrl(path)
    onUploaded(data.publicUrl)
    setLoading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] disabled:opacity-60"
        )}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : value ? <CheckCircle2 size={14} className="text-[var(--color-success)]" /> : <Paperclip size={14} />}
        {loading ? "Yuklanmoqda..." : value ? "Fayl yuklandi — almashtirish" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[var(--color-accent)] hover:underline">
          Yuklangan faylni ko‘rish
        </a>
      )}
    </div>
  )
}
