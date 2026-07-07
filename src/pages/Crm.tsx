import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Textarea, Select } from "@/components/ui/Input"
import { Comments } from "@/components/ui/Comments"
import { Tabs } from "@/components/ui/Tabs"
import { formatMoney, formatDate } from "@/lib/utils"
import { Plus, ChevronRight, Sheet, XCircle, RotateCcw, Code2 } from "lucide-react"

const STAGES = [
  { key: "yangi", label: "Yangi" },
  { key: "aloqada", label: "Aloqada" },
  { key: "taklif", label: "Taklif" },
  { key: "kelishuv", label: "Kelishuv" },
  { key: "yutildi", label: "Yutildi" },
] as const

const PIPELINE_STAGES = [
  { key: "qimmat", label: "Qimmat" },
  { key: "qiziqdi", label: "Faqat qiziqdi" },
  { key: "qaror_qabul_qiluvchi_emas", label: "Qaror qabul qiluvchi emas" },
  { key: "boshqa", label: "Boshqa" },
] as const

type Lead = {
  id: string
  client_name: string
  company: string | null
  phone: string | null
  amount: number | null
  stage: string
  project_type: string | null
  employees_count: number | null
  budget: string | null
  submitted_at: string | null
  form_data: Record<string, unknown> | null
  pipeline_stage: string | null
  rejection_note: string | null
}

const emptyForm = { client_name: "", company: "", phone: "", amount: "", project_type: "", employees_count: "", budget: "" }

export default function Crm() {
  const [view, setView] = useState<"voronka" | "pipeline">("voronka")
  const [leads, setLeads] = useState<Lead[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetUrl, setSheetUrl] = useState("")
  const [apiInfoOpen, setApiInfoOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<Lead | null>(null)
  const [rejectReason, setRejectReason] = useState<(typeof PIPELINE_STAGES)[number]["key"]>("qimmat")
  const [rejectNote, setRejectNote] = useState("")
  const [form, setForm] = useState(emptyForm)

  async function load() {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false })
    setLeads((data as Lead[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }
  function openEdit(lead: Lead) {
    setEditing(lead)
    setForm({
      client_name: lead.client_name, company: lead.company ?? "", phone: lead.phone ?? "",
      amount: lead.amount != null ? String(lead.amount) : "", project_type: lead.project_type ?? "",
      employees_count: lead.employees_count != null ? String(lead.employees_count) : "", budget: lead.budget ?? "",
    })
    setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      client_name: form.client_name,
      company: form.company || null,
      phone: form.phone || null,
      amount: form.amount ? Number(form.amount) : null,
      project_type: form.project_type || null,
      employees_count: form.employees_count ? Number(form.employees_count) : null,
      budget: form.budget || null,
    }
    if (editing) {
      await supabase.from("leads").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("leads").insert({ ...payload, stage: "yangi" })
    }
    setOpen(false)
    load()
  }

  async function moveStage(lead: Lead, dir: 1 | -1) {
    const idx = STAGES.findIndex((s) => s.key === lead.stage)
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, idx + dir))]
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: next.key } : l)))
    await supabase.from("leads").update({ stage: next.key }).eq("id", lead.id)
  }

  function openReject(lead: Lead) {
    setRejectTarget(lead)
    setRejectReason("qimmat")
    setRejectNote("")
  }
  async function confirmReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectTarget) return
    await supabase.from("leads").update({
      stage: "yoqotildi",
      pipeline_stage: rejectReason,
      rejection_note: rejectNote || null,
    }).eq("id", rejectTarget.id)
    setRejectTarget(null)
    load()
  }

  async function restore(lead: Lead) {
    await supabase.from("leads").update({ stage: "yangi", pipeline_stage: null, rejection_note: null }).eq("id", lead.id)
    load()
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
    const iPhone = idx("phone") >= 0 ? idx("phone") : idx("telefon")
    const payload = body
      .filter((r) => r[iName]?.trim())
      .map((r, i) => ({
        client_name: r[iName]?.trim() ?? "Noma'lum",
        company: iCompany >= 0 ? r[iCompany]?.trim() : null,
        phone: iPhone >= 0 ? r[iPhone]?.trim() : null,
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

  const voronkaLeads = leads.filter((l) => l.stage !== "yoqotildi")
  const pipelineLeads = leads.filter((l) => l.stage === "yoqotildi")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Sotuv voronkasi va rad etilgan lidlar pipeline’i</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setApiInfoOpen(true)}>
            <Code2 size={15} /> API orqali ulash
          </Button>
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            <Sheet size={15} /> Sheets’dan import
          </Button>
          <Button variant="accent" onClick={openNew}>
            <Plus size={15} /> Yangi lid
          </Button>
        </div>
      </div>

      <Tabs value={view} onChange={setView} options={[{ value: "voronka", label: "Voronka" }, { value: "pipeline", label: "Pipeline" }]} />

      {view === "voronka" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const items = voronkaLeads.filter((l) => l.stage === stage.key)
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
                              onClick={(e) => { e.stopPropagation(); openReject(lead) }}
                              title="Rad etish"
                              className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                            >
                              <XCircle size={13} />
                            </button>
                          </div>
                          {lead.company && <div className="text-xs text-[var(--color-ink-soft)]">{lead.company}</div>}
                          {lead.phone && <div className="text-xs text-[var(--color-ink-faint)]">{lead.phone}</div>}
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
      )}

      {view === "pipeline" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = pipelineLeads.filter((l) => l.pipeline_stage === stage.key)
            return (
              <div key={stage.key} className="min-w-0">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{stage.label}</span>
                  <span className="text-xs text-[var(--color-ink-faint)]">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((lead) => (
                    <Card key={lead.id} className="p-3.5">
                      <div className="text-sm font-medium">{lead.client_name}</div>
                      {lead.company && <div className="text-xs text-[var(--color-ink-soft)]">{lead.company}</div>}
                      {lead.rejection_note && <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">{lead.rejection_note}</p>}
                      <button
                        onClick={() => restore(lead)}
                        className="mt-2.5 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
                      >
                        <RotateCcw size={12} /> Qayta tiklash
                      </button>
                    </Card>
                  ))}
                  {items.length === 0 && <p className="text-xs text-[var(--color-ink-faint)]">Bo‘sh</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Lidni tahrirlash" : "Yangi lid qo‘shish"}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mijoz ismi</Label>
              <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Kompaniya</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Summa</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Xodimlar soni</Label>
              <Input type="number" value={form.employees_count} onChange={(e) => setForm({ ...form, employees_count: e.target.value })} />
            </div>
            <div>
              <Label>Byudjet</Label>
              <Input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Loyiha turi</Label>
            <Input value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} />
          </div>
          <Button type="submit" variant="accent" className="w-full">{editing ? "Saqlash" : "Qo‘shish"}</Button>
        </form>

        {editing && (
          <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4 text-sm">
            <div className="text-xs text-[var(--color-ink-faint)]">
              Lid tushgan sana: {editing.submitted_at ? formatDate(editing.submitted_at) : "—"}
            </div>
            {editing.form_data && Object.keys(editing.form_data).length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-medium text-[var(--color-ink-soft)]">Forma orqali topshirilgan ma’lumotlar</div>
                <div className="space-y-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-3 text-xs">
                  {Object.entries(editing.form_data).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-[var(--color-ink-faint)]">{k}</span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Comments entityType="lead" entityId={editing.id} />
          </div>
        )}
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)} title="Nega yo‘qotildik?">
        <form onSubmit={confirmReject} className="space-y-3">
          <div>
            <Label>Sabab</Label>
            <Select value={rejectReason} onChange={(e) => setRejectReason(e.target.value as typeof rejectReason)}>
              {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Izoh {rejectReason === "boshqa" && "(majburiy)"}</Label>
            <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} required={rejectReason === "boshqa"} />
          </div>
          <Button type="submit" variant="danger" className="w-full">Pipeline’ga o‘tkazish</Button>
        </form>
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

      <Dialog open={apiInfoOpen} onOpenChange={setApiInfoOpen} title="API orqali lid qo‘shish">
        <div className="space-y-3 text-sm">
          <p className="text-[var(--color-ink-soft)]">
            Google Apps Script, Zapier, Make yoki boshqa avtomatlashtirish orqali quyidagi so‘rovni yuboring:
          </p>
          <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-3 text-xs leading-relaxed">
{`POST https://dmjgbwqnbthateuhpyde.supabase.co/rest/v1/leads
apikey: <VITE_SUPABASE_ANON_KEY>
Authorization: Bearer <VITE_SUPABASE_ANON_KEY>
Content-Type: application/json
Prefer: return=minimal

{
  "client_name": "Aziz Karimov",
  "phone": "+998901234567",
  "company": "Example LLC",
  "employees_count": 12,
  "budget": "5,000,000 so'm",
  "form_data": { "manba": "Landing forma" }
}`}
          </pre>
          <p className="text-xs text-[var(--color-ink-faint)]">
            Google Apps Script’da <code>UrlFetchApp.fetch(url, {"{"}method:"post", headers:{"{"}...{"}"}, payload: JSON.stringify(data){"}"}</code> orqali chaqiring.
          </p>
        </div>
      </Dialog>
    </div>
  )
}
