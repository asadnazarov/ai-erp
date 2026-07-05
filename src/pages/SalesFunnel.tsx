import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Textarea } from "@/components/ui/Input"
import { Comments } from "@/components/ui/Comments"
import { formatMoney } from "@/lib/utils"
import { Plus, ChevronRight, Sheet, Trash2 } from "lucide-react"

const STAGES = [
  { key: "yangi", label: "Yangi" },
  { key: "aloqada", label: "Aloqada" },
  { key: "taklif", label: "Taklif" },
  { key: "kelishuv", label: "Kelishuv" },
  { key: "yutildi", label: "Yutildi" },
  { key: "yoqotildi", label: "Yo‘qotildi" },
] as const

type Lead = {
  id: string
  client_name: string
  company: string | null
  amount: number | null
  stage: string
  project_type: string | null
}

export default function SalesFunnel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetUrl, setSheetUrl] = useState("")
  const [form, setForm] = useState({ client_name: "", company: "", amount: "", project_type: "" })

  async function load() {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false })
    setLeads((data as Lead[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ client_name: "", company: "", amount: "", project_type: "" })
    setOpen(true)
  }
  function openEdit(lead: Lead) {
    setEditing(lead)
    setForm({
      client_name: lead.client_name, company: lead.company ?? "",
      amount: lead.amount != null ? String(lead.amount) : "", project_type: lead.project_type ?? "",
    })
    setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      client_name: form.client_name,
      company: form.company || null,
      amount: form.amount ? Number(form.amount) : null,
      project_type: form.project_type || null,
    }
    if (editing) {
      await supabase.from("leads").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("leads").insert({ ...payload, stage: "yangi" })
    }
    setOpen(false)
    load()
  }

  async function remove(lead: Lead) {
    if (!confirm(`"${lead.client_name}" lidini o‘chirishni tasdiqlaysizmi?`)) return
    await supabase.from("leads").delete().eq("id", lead.id)
    load()
  }

  async function moveStage(lead: Lead, dir: 1 | -1) {
    const idx = STAGES.findIndex((s) => s.key === lead.stage)
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, idx + dir))]
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: next.key } : l)))
    await supabase.from("leads").update({ stage: next.key }).eq("id", lead.id)
  }

  async function importFromSheet(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(sheetUrl)
    const text = await res.text()
    const rows = text.trim().split("\n").map((r) => r.split(","))
    const [header, ...body] = rows
    const idx = (name: string) => header.findIndex((h) => h.trim().toLowerCase().includes(name))
    const iName = idx("ism") >= 0 ? idx("ism") : idx("name")
    const iCompany = idx("company") >= 0 ? idx("company") : idx("kompaniya")
    const iAmount = idx("amount") >= 0 ? idx("amount") : idx("summa")
    const payload = body
      .filter((r) => r[iName]?.trim())
      .map((r, i) => ({
        client_name: r[iName]?.trim() ?? "Noma'lum",
        company: iCompany >= 0 ? r[iCompany]?.trim() : null,
        amount: iAmount >= 0 ? Number(r[iAmount]?.replace(/[^\d.]/g, "")) || null : null,
        stage: "yangi",
        sheet_row_ref: `${sheetUrl}#${i}`,
      }))
    if (payload.length) {
      await supabase.from("leads").upsert(payload, { onConflict: "sheet_row_ref", ignoreDuplicates: true })
    }
    setSheetOpen(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sotuv voronkasi</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Lidlarni bosqichlar bo‘yicha kuzating</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            <Sheet size={15} /> Sheets’dan import
          </Button>
          <Button variant="accent" onClick={openNew}>
            <Plus size={15} /> Yangi lid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.key)
          return (
            <div key={stage.key} className="min-w-0">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{stage.label}</span>
                <span className="text-xs text-[var(--color-ink-faint)]">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                <AnimatePresence>
                  {items.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    >
                      <Card className="cursor-pointer p-3.5" onClick={() => openEdit(lead)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium">{lead.client_name}</div>
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(lead) }}
                            className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {lead.company && <div className="text-xs text-[var(--color-ink-soft)]">{lead.company}</div>}
                        {lead.amount != null && (
                          <div className="mt-1.5 text-xs font-medium text-[var(--color-accent)]">{formatMoney(lead.amount)}</div>
                        )}
                        <div className="mt-2.5 flex items-center justify-between">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStage(lead, -1) }}
                            className="cursor-pointer rounded-md p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)] disabled:opacity-20"
                            disabled={stage.key === STAGES[0].key}
                          >
                            <ChevronRight size={13} className="rotate-180" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStage(lead, 1) }}
                            className="cursor-pointer rounded-md p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)] disabled:opacity-20"
                            disabled={stage.key === STAGES[STAGES.length - 1].key}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Lidni tahrirlash" : "Yangi lid qo‘shish"}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Mijoz ismi</Label>
            <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
          </div>
          <div>
            <Label>Kompaniya</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Summa</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Loyiha turi</Label>
              <Input value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} />
            </div>
          </div>
          <Button type="submit" variant="accent" className="w-full">{editing ? "Saqlash" : "Qo‘shish"}</Button>
        </form>
        {editing && <Comments entityType="lead" entityId={editing.id} />}
      </Dialog>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen} title="Google Sheets’dan lidlarni import qilish">
        <form onSubmit={importFromSheet} className="space-y-3">
          <div>
            <Label>Sheet CSV havolasi (File → Share → Publish to web → CSV)</Label>
            <Textarea value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/.../pub?output=csv" required />
          </div>
          <Button type="submit" variant="accent" className="w-full">Import qilish</Button>
        </form>
      </Dialog>
    </div>
  )
}
