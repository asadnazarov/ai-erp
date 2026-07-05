import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label } from "@/components/ui/Input"
import { formatDate } from "@/lib/utils"
import { Plus } from "lucide-react"

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  kutilmoqda: "warning",
  jarayonda: "accent",
  yopilgan: "success",
  toxtatilgan: "neutral",
}
const STATUS_LABEL: Record<string, string> = {
  kutilmoqda: "Kutilmoqda",
  jarayonda: "Jarayonda",
  yopilgan: "Yopilgan",
  toxtatilgan: "To‘xtatilgan",
}

type Project = {
  id: string
  name: string
  status: string
  progress: number
  start_date: string | null
  end_date: string | null
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState("hammasi")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" })

  async function load() {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false })
    setProjects((data as Project[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function addProject(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("projects").insert({
      name: form.name,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: "jarayonda",
      progress: 0,
    })
    setForm({ name: "", start_date: "", end_date: "" })
    setOpen(false)
    load()
  }

  const filtered = filter === "hammasi" ? projects : projects.filter((p) => p.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loyihalar</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Jarayondagi, kutilayotgan va yopilgan loyihalar nazorati</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus size={15} /> Yangi loyiha
        </Button>
      </div>

      <div className="flex gap-2">
        {["hammasi", "kutilmoqda", "jarayonda", "yopilgan", "toxtatilgan"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
            }`}
          >
            {s === "hammasi" ? "Hammasi" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card>
              <CardContent className="pt-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                </div>
                <div className="mb-3 text-xs text-[var(--color-ink-faint)]">
                  {p.start_date ? formatDate(p.start_date) : "—"} → {p.end_date ? formatDate(p.end_date) : "—"}
                </div>
                <Progress value={p.progress} />
                <div className="mt-1.5 text-right text-xs text-[var(--color-ink-soft)]">{p.progress}%</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[var(--color-ink-faint)]">Loyihalar topilmadi.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="Yangi loyiha">
        <form onSubmit={addProject} className="space-y-3">
          <div>
            <Label>Nomi</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Boshlanish</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Tugash</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>
    </div>
  )
}
