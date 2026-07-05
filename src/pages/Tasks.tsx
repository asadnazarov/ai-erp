import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Textarea, Select } from "@/components/ui/Input"
import { Checkbox } from "@/components/ui/Checkbox"
import { Progress } from "@/components/ui/Progress"
import { Comments } from "@/components/ui/Comments"
import { formatDate } from "@/lib/utils"
import { Plus, Pencil, Trash2 } from "lucide-react"

const QUADRANTS = [
  { id: 1, title: "Shoshilinch va muhim", tone: "border-t-[var(--color-danger)]" },
  { id: 2, title: "Shoshilinch emas, muhim", tone: "border-t-[var(--color-accent)]" },
  { id: 3, title: "Shoshilinch, muhim emas", tone: "border-t-[var(--color-warning)]" },
  { id: 4, title: "Na shoshilinch, na muhim", tone: "border-t-[var(--color-ink-faint)]" },
]

type ChecklistItem = { text: string; done: boolean }
type Task = {
  id: string
  title: string
  description: string | null
  department: string | null
  deadline: string | null
  checklist: ChecklistItem[]
  progress: number
  eisenhower: number
}

function TaskCard({ task, onEdit, onDelete, onToggle }: { task: Task; onEdit: () => void; onDelete: () => void; onToggle: (i: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="flex items-start justify-between gap-2">
          <div {...listeners} {...attributes} className="flex-1 cursor-grab text-sm font-medium active:cursor-grabbing">{task.title}</div>
          <div className="flex shrink-0 gap-1">
            <button onClick={onEdit} className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"><Pencil size={12} /></button>
            <button onClick={onDelete} className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"><Trash2 size={12} /></button>
          </div>
        </div>
        {task.department && (
          <span className="mt-1 inline-block rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] text-[var(--color-ink-soft)]">{task.department}</span>
        )}
        {task.deadline && <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">Muddat: {formatDate(task.deadline)}</div>}
        {task.checklist?.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {task.checklist.map((item, idx) => (
              <label key={idx} className="flex cursor-pointer items-center gap-2 text-xs">
                <Checkbox checked={item.done} onCheckedChange={() => onToggle(idx)} />
                <span className={item.done ? "text-[var(--color-ink-faint)] line-through" : ""}>{item.text}</span>
              </label>
            ))}
          </div>
        )}
        <div className="mt-2.5">
          <Progress value={task.progress} tone={task.progress === 100 ? "success" : "accent"} />
        </div>
      </div>
    </div>
  )
}

function Quadrant({ q, count, children }: { q: (typeof QUADRANTS)[number]; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: q.id })
  return (
    <div ref={setNodeRef} className={`w-72 shrink-0 rounded-[var(--radius-lg)] border-t-4 ${q.tone} bg-[var(--color-surface)] p-3 transition-colors ${isOver ? "bg-[var(--color-accent-soft)]" : ""}`}>
      <h3 className="mb-3 text-xs font-semibold text-[var(--color-ink-soft)]">{q.title} <span className="text-[var(--color-ink-faint)]">({count})</span></h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: "", description: "", department: "", deadline: "", eisenhower: "2" })
  const [checklistText, setChecklistText] = useState("")
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function load() {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })
    setTasks((data as Task[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ title: "", description: "", department: "", deadline: "", eisenhower: "2" })
    setChecklistText("")
    setOpen(true)
  }
  function openEdit(t: Task) {
    setEditing(t)
    setForm({ title: t.title, description: t.description ?? "", department: t.department ?? "", deadline: t.deadline ?? "", eisenhower: String(t.eisenhower) })
    setChecklistText((t.checklist ?? []).map((c) => c.text).join("\n"))
    setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const checklist: ChecklistItem[] = checklistText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text) => {
        const existing = editing?.checklist?.find((c) => c.text === text)
        return { text, done: existing?.done ?? false }
      })
    const progress = checklist.length ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100) : (editing?.progress ?? 0)
    const payload = {
      title: form.title,
      description: form.description || null,
      department: form.department || null,
      deadline: form.deadline || null,
      eisenhower: Number(form.eisenhower),
      checklist,
      progress,
    }
    if (editing) {
      await supabase.from("tasks").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("tasks").insert(payload)
    }
    setOpen(false)
    load()
  }

  async function remove(t: Task) {
    if (!confirm(`"${t.title}" vazifasini o‘chirishni tasdiqlaysizmi?`)) return
    await supabase.from("tasks").delete().eq("id", t.id)
    load()
  }

  async function toggleItem(task: Task, index: number) {
    const checklist = task.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c))
    const progress = checklist.length ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100) : 0
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, checklist, progress } : t)))
    await supabase.from("tasks").update({ checklist, progress }).eq("id", task.id)
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const newQuadrant = Number(over.id)
    const task = tasks.find((t) => t.id === active.id)
    if (!task || task.eisenhower === newQuadrant) return
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, eisenhower: newQuadrant } : t)))
    await supabase.from("tasks").update({ eisenhower: newQuadrant }).eq("id", task.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vazifalar</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Eyzenxauer matritsasi — sudrab ustuvorlikni o‘zgartiring</p>
        </div>
        <Button variant="accent" onClick={openNew}>
          <Plus size={15} /> Yangi vazifa
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {QUADRANTS.map((q) => (
            <Quadrant key={q.id} q={q} count={tasks.filter((t) => t.eisenhower === q.id).length}>
              {tasks.filter((t) => t.eisenhower === q.id).map((task) => (
                <motion.div key={task.id} layout>
                  <TaskCard task={task} onEdit={() => openEdit(task)} onDelete={() => remove(task)} onToggle={(i) => toggleItem(task, i)} />
                </motion.div>
              ))}
            </Quadrant>
          ))}
        </div>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Vazifani tahrirlash" : "Yangi vazifa"}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Sarlavha</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bo‘lim</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <Label>Muddat</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Eyzenxauer kvadranti</Label>
            <Select value={form.eisenhower} onChange={(e) => setForm({ ...form, eisenhower: e.target.value })}>
              {QUADRANTS.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
            </Select>
          </div>
          <div>
            <Label>Check-list (har bir band yangi qatorda)</Label>
            <Textarea value={checklistText} onChange={(e) => setChecklistText(e.target.value)} placeholder={"Birinchi qadam\nIkkinchi qadam"} />
          </div>
          <Button type="submit" variant="accent" className="w-full">{editing ? "Saqlash" : "Qo‘shish"}</Button>
        </form>
        {editing && <Comments entityType="task" entityId={editing.id} />}
      </Dialog>
    </div>
  )
}
