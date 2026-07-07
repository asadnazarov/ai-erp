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
import { FileUpload } from "@/components/ui/FileUpload"
import { Comments } from "@/components/ui/Comments"
import { renderProposalHtml, renderSupportHtml } from "@/lib/proposalTemplate"
import { formatDate } from "@/lib/utils"
import { Plus, Pencil, Trash2, Search, FileText, Paperclip } from "lucide-react"

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
  lead_id: string | null
  client_contact_name: string | null
  employees_count: number | null
  budget: string | null
  tz_file_url: string | null
  payment_type: string | null
  installments_count: number | null
}

type LeadOption = { id: string; client_name: string; phone: string | null; company: string | null; employees_count: number | null; budget: string | null }
type PaymentStage = { id: string; title: string; amount: number; due_date: string | null; contract_id: string }

function ProjectCard({ p, onEdit, onDelete }: { p: Project; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: p.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      <Card className="w-full cursor-grab p-4 active:cursor-grabbing">
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
        {p.client_contact_name && <div className="mb-1 text-[11px] text-[var(--color-ink-soft)]">{p.client_contact_name}</div>}
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

const emptyForm = {
  name: "", start_date: "", end_date: "", status: "jarayonda", progress: "0", description: "",
  lead_id: "", client_contact_name: "", employees_count: "", budget: "", tz_file_url: "",
  payment_type: "bir_martalik", installments_count: "2",
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [leadPhoneSearch, setLeadPhoneSearch] = useState("")
  const [leadResults, setLeadResults] = useState<LeadOption[]>([])
  const [attachedLead, setAttachedLead] = useState<LeadOption | null>(null)
  const [kpOpen, setKpOpen] = useState(false)
  const [kpHtml, setKpHtml] = useState<string | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportHtml, setSupportHtml] = useState<string | null>(null)
  const [supportForm, setSupportForm] = useState({ support_tier: "start", support_months: "1" })
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
    setForm(emptyForm)
    setAttachedLead(null)
    setLeadPhoneSearch("")
    setLeadResults([])
    setOpen(true)
  }
  async function openEdit(p: Project) {
    setEditing(p)
    setForm({
      name: p.name, start_date: p.start_date ?? "", end_date: p.end_date ?? "",
      status: p.status, progress: String(p.progress), description: p.description ?? "",
      lead_id: p.lead_id ?? "", client_contact_name: p.client_contact_name ?? "",
      employees_count: p.employees_count != null ? String(p.employees_count) : "",
      budget: p.budget ?? "", tz_file_url: p.tz_file_url ?? "",
      payment_type: p.payment_type ?? "bir_martalik",
      installments_count: p.installments_count != null ? String(p.installments_count) : "2",
    })
    if (p.lead_id) {
      const { data } = await supabase.from("leads").select("id, client_name, phone, company, employees_count, budget").eq("id", p.lead_id).single()
      setAttachedLead((data as LeadOption) ?? null)
    } else {
      setAttachedLead(null)
    }
    setLeadPhoneSearch("")
    setLeadResults([])
    setOpen(true)
  }

  async function searchLeadByPhone() {
    if (!leadPhoneSearch.trim()) return
    const { data } = await supabase
      .from("leads")
      .select("id, client_name, phone, company, employees_count, budget")
      .ilike("phone", `%${leadPhoneSearch.trim()}%`)
      .limit(5)
    setLeadResults((data as LeadOption[]) ?? [])
  }

  function attachLead(lead: LeadOption) {
    setAttachedLead(lead)
    setForm((f) => ({
      ...f,
      lead_id: lead.id,
      client_contact_name: f.client_contact_name || lead.client_name,
      employees_count: f.employees_count || (lead.employees_count != null ? String(lead.employees_count) : ""),
      budget: f.budget || lead.budget || "",
      name: f.name || lead.company || lead.client_name,
    }))
    setLeadResults([])
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
      lead_id: form.lead_id || null,
      client_contact_name: form.client_contact_name || null,
      employees_count: form.employees_count ? Number(form.employees_count) : null,
      budget: form.budget || null,
      tz_file_url: form.tz_file_url || null,
      payment_type: form.payment_type || null,
      installments_count: form.payment_type === "bolib_tolash" ? Number(form.installments_count) : null,
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

  async function generateKp() {
    if (!editing) return
    const { data: contract } = await supabase.from("contracts").select("id, amount").eq("project_id", editing.id).limit(1).maybeSingle()
    let stages: PaymentStage[] = []
    if (contract) {
      const { data } = await supabase.from("payment_stages").select("*").eq("contract_id", contract.id).order("due_date", { ascending: true })
      stages = (data as PaymentStage[]) ?? []
    }
    const html = renderProposalHtml({
      projectName: form.name,
      companyName: attachedLead?.company ?? null,
      clientContactName: form.client_contact_name || null,
      amount: contract?.amount ?? null,
      paymentType: form.payment_type || null,
      installmentsCount: form.payment_type === "bolib_tolash" ? Number(form.installments_count) : null,
      paymentStages: stages,
    })
    await supabase.from("proposals").insert({
      project_id: editing.id,
      kind: "kp",
      payment_type: form.payment_type || null,
      installments_count: form.payment_type === "bolib_tolash" ? Number(form.installments_count) : null,
      generated_html: html,
    })
    setKpHtml(html)
  }

  async function generateSupport(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const html = renderSupportHtml({
      projectName: form.name,
      companyName: attachedLead?.company ?? null,
      supportTier: supportForm.support_tier,
      supportMonths: Number(supportForm.support_months),
    })
    await supabase.from("proposals").insert({
      project_id: editing.id,
      kind: "support",
      support_tier: supportForm.support_tier,
      support_months: Number(supportForm.support_months),
      generated_html: html,
    })
    setSupportHtml(html)
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

          <div>
            <Label>Lid biriktirish (telefon orqali)</Label>
            {attachedLead ? (
              <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm">
                <span>{attachedLead.client_name} {attachedLead.company ? `· ${attachedLead.company}` : ""}</span>
                <button type="button" onClick={() => { setAttachedLead(null); setForm((f) => ({ ...f, lead_id: "" })) }} className="cursor-pointer text-xs text-[var(--color-danger)]">
                  Bekor qilish
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={leadPhoneSearch} onChange={(e) => setLeadPhoneSearch(e.target.value)} placeholder="+998..." />
                  <Button type="button" variant="outline" onClick={searchLeadByPhone}><Search size={14} /></Button>
                </div>
                {leadResults.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => attachLead(lead)}
                    className="block w-full cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-2)]"
                  >
                    {lead.client_name} {lead.company ? `· ${lead.company}` : ""} {lead.phone ? `· ${lead.phone}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mijoz vakili (kim bilan gaplashamiz)</Label>
              <Input value={form.client_contact_name} onChange={(e) => setForm({ ...form, client_contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Xodimlar soni</Label>
              <Input type="number" value={form.employees_count} onChange={(e) => setForm({ ...form, employees_count: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Byudjet</Label>
            <Input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>

          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">To‘lov shartlari</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>To‘lov turi</Label>
                <Select value={form.payment_type} onChange={(e) => setForm({ ...form, payment_type: e.target.value })}>
                  <option value="bir_martalik">Bir martalik to‘lov</option>
                  <option value="bolib_tolash">Bo‘lib to‘lash</option>
                </Select>
              </div>
              {form.payment_type === "bolib_tolash" && (
                <div>
                  <Label>Necha qismga bo‘lib</Label>
                  <Input type="number" min={2} value={form.installments_count} onChange={(e) => setForm({ ...form, installments_count: e.target.value })} />
                </div>
              )}
            </div>
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
          <div>
            <Label>TZ fayli</Label>
            <FileUpload folder="tz" value={form.tz_file_url} onUploaded={(url) => setForm({ ...form, tz_file_url: url })} />
            {form.tz_file_url && (
              <a href={form.tz_file_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline">
                <Paperclip size={11} /> TZ faylini ko‘rish
              </a>
            )}
          </div>
          <Button type="submit" variant="accent" className="w-full">{editing ? "Saqlash" : "Qo‘shish"}</Button>
        </form>

        {editing && (
          <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
            <Button type="button" variant="outline" className="w-full" onClick={async () => { setKpHtml(null); setKpOpen(true); await generateKp() }}>
              <FileText size={14} /> KP (kommersiya taklifi) yaratish
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => { setSupportHtml(null); setSupportOpen(true) }}>
              <FileText size={14} /> Qo‘llab-quvvatlash hujjatini yaratish
            </Button>
            <Comments entityType="project" entityId={editing.id} />
          </div>
        )}
      </Dialog>

      <Dialog open={kpOpen} onOpenChange={setKpOpen} title="KP (kommersiya taklifi)">
        {kpHtml && (
          <div className="space-y-3">
            <div className="max-h-[60vh] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)]" dangerouslySetInnerHTML={{ __html: kpHtml }} />
            <Button variant="outline" className="w-full" onClick={() => window.print()}>Chop etish / PDF saqlash</Button>
          </div>
        )}
      </Dialog>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen} title="Qo‘llab-quvvatlash hujjati">
        {!supportHtml ? (
          <form onSubmit={generateSupport} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tarif</Label>
                <Select value={supportForm.support_tier} onChange={(e) => setSupportForm({ ...supportForm, support_tier: e.target.value })}>
                  <option value="bepul">Bepul</option>
                  <option value="start">Start</option>
                  <option value="pro">Pro</option>
                  <option value="max">Max</option>
                </Select>
              </div>
              <div>
                <Label>Necha oy</Label>
                <Input type="number" min={0} value={supportForm.support_months} onChange={(e) => setSupportForm({ ...supportForm, support_months: e.target.value })} />
              </div>
            </div>
            <Button type="submit" variant="accent" className="w-full">Yaratish</Button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="max-h-[60vh] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)]" dangerouslySetInnerHTML={{ __html: supportHtml }} />
            <Button variant="outline" className="w-full" onClick={() => window.print()}>Chop etish / PDF saqlash</Button>
          </div>
        )}
      </Dialog>
    </div>
  )
}
