import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Textarea } from "@/components/ui/Input"
import { Checkbox } from "@/components/ui/Checkbox"
import { Progress } from "@/components/ui/Progress"
import { formatDate } from "@/lib/utils"
import { Plus } from "lucide-react"

const QUADRANTS = [
  { id: 1, title: "Shoshilinch va muhim", tone: "border-t-[var(--color-danger)]" },
  { id: 2, title: "Shoshilinch emas, lekin muhim", tone: "border-t-[var(--color-accent)]" },
  { id: 3, title: "Shoshilinch, lekin muhim emas", tone: "border-t-[var(--color-warning)]" },
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

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", department: "", deadline: "", eisenhower: "2" })

  async function load() {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })
    setTasks((data as Task[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      department: form.department || null,
      deadline: form.deadline || null,
      eisenhower: Number(form.eisenhower),
      checklist: [],
      progress: 0,
    })
    setForm({ title: "", description: "", department: "", deadline: "", eisenhower: "2" })
    setOpen(false)
    load()
  }

  async function toggleItem(task: Task, index: number) {
    const checklist = task.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c))
    const progress = checklist.length ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100) : 0
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, checklist, progress } : t)))
    await supabase.from("tasks").update({ checklist, progress }).eq("id", task.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vazifalar</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Eyzenxauer matritsasi bo‘yicha ustuvorlik</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus size={15} /> Yangi vazifa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => (
          <Card key={q.id} className={`border-t-4 ${q.tone}`}>
            <CardContent className="pt-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink-soft)]">{q.title}</h3>
              <div className="space-y-3">
                {tasks.filter((t) => t.eisenhower === q.id).map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{task.title}</div>
                      {task.department && (
                        <span className="whitespace-nowrap rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] text-[var(--color-ink-soft)]">
                          {task.department}
                        </span>
                      )}
                    </div>
                    {task.deadline && (
                      <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">Muddat: {formatDate(task.deadline)}</div>
                    )}
                    {task.checklist?.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {task.checklist.map((item, idx) => (
                          <label key={idx} className="flex cursor-pointer items-center gap-2 text-xs">
                            <Checkbox checked={item.done} onCheckedChange={() => toggleItem(task, idx)} />
                            <span className={item.done ? "text-[var(--color-ink-faint)] line-through" : ""}>{item.text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="mt-2.5">
                      <Progress value={task.progress} tone={task.progress === 100 ? "success" : "accent"} />
                    </div>
                  </motion.div>
                ))}
                {tasks.filter((t) => t.eisenhower === q.id).length === 0 && (
                  <p className="text-xs text-[var(--color-ink-faint)]">Vazifalar yo‘q</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="Yangi vazifa">
        <form onSubmit={addTask} className="space-y-3">
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
            <select
              value={form.eisenhower}
              onChange={(e) => setForm({ ...form, eisenhower: e.target.value })}
              className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
            >
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>
    </div>
  )
}
