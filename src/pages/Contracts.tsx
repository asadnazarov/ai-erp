import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Select } from "@/components/ui/Input"
import { FileUpload } from "@/components/ui/FileUpload"
import { formatMoney, formatDate } from "@/lib/utils"
import { Plus, FileSignature, Paperclip } from "lucide-react"

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  yangi: "accent",
  faol: "success",
  kutilmoqda: "warning",
  yakunlangan: "neutral",
  bekor_qilingan: "danger",
}
const STATUS_LABEL: Record<string, string> = {
  yangi: "Yangi",
  faol: "Faol",
  kutilmoqda: "Kutilmoqda",
  yakunlangan: "Yakunlangan",
  bekor_qilingan: "Bekor qilingan",
}

type Contract = {
  id: string
  number: string | null
  status: string
  amount: number | null
  signed_date: string | null
  start_date: string | null
  end_date: string | null
  file_url: string | null
  clients?: { name: string } | null
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ number: "", client_id: "", amount: "", status: "yangi", start_date: "", end_date: "", file_url: "" })

  async function load() {
    const [{ data: c }, { data: cl }] = await Promise.all([
      supabase.from("contracts").select("*, clients(name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name"),
    ])
    setContracts((c as any) ?? [])
    setClients(cl ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function addContract(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("contracts").insert({
      number: form.number || null,
      client_id: form.client_id || null,
      amount: form.amount ? Number(form.amount) : null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      file_url: form.file_url || null,
    })
    setForm({ number: "", client_id: "", amount: "", status: "yangi", start_date: "", end_date: "", file_url: "" })
    setOpen(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shartnomalar</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Eski, yangi va kutilayotgan shartnomalar</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus size={15} /> Yangi shartnoma
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contracts.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileSignature size={14} className="text-[var(--color-accent)]" />
                  <h4 className="font-medium">{c.number || "Raqamsiz"}</h4>
                </div>
                <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              </div>
              <div className="text-sm text-[var(--color-ink-soft)]">{c.clients?.name ?? "Mijoz biriktirilmagan"}</div>
              {c.amount != null && <div className="mt-1 text-sm font-medium text-[var(--color-accent)]">{formatMoney(c.amount)}</div>}
              <div className="mt-2 text-xs text-[var(--color-ink-faint)]">
                {c.start_date ? formatDate(c.start_date) : "—"} → {c.end_date ? formatDate(c.end_date) : "—"}
              </div>
              {c.file_url && (
                <a href={c.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline">
                  <Paperclip size={11} /> Shartnoma fayli
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {contracts.length === 0 && <p className="text-sm text-[var(--color-ink-faint)]">Shartnomalar yo‘q.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="Yangi shartnoma">
        <form onSubmit={addContract} className="space-y-3">
          <div>
            <Label>Raqami</Label>
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </div>
          <div>
            <Label>Mijoz</Label>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Tanlang</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Summa</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Holati</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
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
          <div>
            <Label>Shartnoma fayli</Label>
            <FileUpload folder="contracts" value={form.file_url} onUploaded={(url) => setForm({ ...form, file_url: url })} />
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>
    </div>
  )
}
