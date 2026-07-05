import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Select } from "@/components/ui/Input"
import { Comments } from "@/components/ui/Comments"
import { formatDate } from "@/lib/utils"
import { Plus, Pencil, Trash2 } from "lucide-react"

const STATUSES = [
  { key: "kutilmoqda", label: "Kutilmoqda", tone: "warning" as const },
  { key: "jarayonda", label: "Jarayonda", tone: "accent" as const },
  { key: "yopilgan", label: "Yopilgan", tone: "success" as const },
  { key: "toxtatilgan", label: "To‘xtatilgan", tone: "neutral" as const },
]

type Project = {
  id: string
  name: string
  status: string
  progress: number
  start_date: string | null
  end_date: string | null
  description: string | null
}

function ProjectCard({ p, onEdit, onDelete }: { p: Project; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: p.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      <Card className="w-64 shrink-0 cursor-grab p-4 active:cursor-grabbing">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold">{p.name}</h3>
          <div className="flex shrink-0 gap-1">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            >
              <Pencil size={12} />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <div className="mb-2.5 text-[11px] text-[var(--color-ink-faint)]">
          {p.start_date ? formatDate(p.start_date) : "—"} → {p.end_date ? formatDate(p.end_date) : "—"}
        </div>
        <Progress value={p.progress} tone={p.progress === 100 ? "success" : "accent"} />
        <div className="mt-1.5 text-right text-xs text-[var(--color-ink-soft)]">{p.progress}%</div>
      </Card>
    </div>
  )
}

function Column({ status, label, tone, count, children }: { status: string; label: string; tone: "warning" | "accent" | "success" | "neutral"; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={`w-72 shrink-0 rounded-[var(--radius-lg)] p-2 transition-colors ${isOver ? "bg-[var(--color-accent-soft)]" : ""}`}>
      <div className="mb-2.5 flex items-center gap-2 px-1.5">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-xs text-[var(--color-ink-faint)]">{count}</span>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", status: "jarayonda", progress: "0", description: "" })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function load() {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false })
    setProjects((data as Project[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: "", start_date: "", end_date: "", status: "jarayonda", progress: "0", description: "" })
    setOpen(true)
  }
  function openEdit(p: Project) {
    setEditing(p)
    setForm({
      name: p.name, start_date: p.start_date ?? "", end_date: p.end_date ?? "",
      status: p.status, progress: String(p.progress), description: p.description ?? "",
    })
    setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      progress: Number(form.progress),
      description: form.description || null,
    }
    if (editing) {
      await supabase.from("projects").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("projects").insert(payload)
    }
    setOpen(false)
    load()
  }

  async function remove(p: Project) {
    if (!confirm(`"${p.name}" loyihasini o‘chirishni tasdiqlaysizmi?`)) return
    await supabase.from("projects").delete().eq("id", p.id)
    load()
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const newStatus = String(over.id)
    const project = projects.find((p) => p.id === active.id)
    if (!project || project.status === newStatus) return
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p)))
    await supabase.from("projects").update({ status: newStatus }).eq("id", project.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loyihalar</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Ustunlar orasida sudrab holatini o‘zgartiring</p>
        </div>
        <Button variant="accent" onClick={openNew}>
          <Plus size={15} /> Yangi loyiha
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <Column key={s.key} status={s.key} label={s.label} tone={s.tone} count={projects.filter((p) => p.status === s.key).length}>
              {projects.filter((p) => p.status === s.key).map((p) => (
                <motion.div key={p.id} layout>
                  <ProjectCard p={p} onEdit={() => openEdit(p)} onDelete={() => remove(p)} />
                </motion.div>
              ))}
            </Column>
          ))}
        </div>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Loyihani tahrirlash" : "Yangi loyiha"}>
        <form onSubmit={save} className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Holati</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Progress (%)</Label>
              <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Izoh</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button type="submit" variant="accent" className="w-full">{editing ? "Saqlash" : "Qo‘shish"}</Button>
        </form>
        {editing && <Comments entityType="project" entityId={editing.id} />}
      </Dialog>
    </div>
  )
}
