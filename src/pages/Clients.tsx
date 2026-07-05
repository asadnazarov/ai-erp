import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Select, Textarea } from "@/components/ui/Input"
import { Avatar } from "@/components/ui/Avatar"
import { Comments } from "@/components/ui/Comments"
import { Plus, Star } from "lucide-react"

const LOYALTY_TONE: Record<string, "success" | "neutral" | "danger"> = {
  sodiq: "success",
  oddiy: "neutral",
  qopol: "danger",
}
const LOYALTY_LABEL: Record<string, string> = {
  sodiq: "Sodiq mijoz",
  oddiy: "Oddiy mijoz",
  qopol: "Qo‘pol mijoz",
}

type Client = {
  id: string
  name: string
  brand: string | null
  icp_portrait: string | null
  character_notes: string | null
  budget_level: string | null
  loyalty_status: string
  satisfaction_score: number | null
  usage_count: number
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: "", brand: "", icp_portrait: "", character_notes: "", budget_level: "", loyalty_status: "oddiy", satisfaction_score: "5",
  })

  async function load() {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false })
    setClients((data as Client[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("clients").insert({
      name: form.name,
      brand: form.brand || null,
      icp_portrait: form.icp_portrait || null,
      character_notes: form.character_notes || null,
      budget_level: form.budget_level || null,
      loyalty_status: form.loyalty_status,
      satisfaction_score: Number(form.satisfaction_score),
    })
    setForm({ name: "", brand: "", icp_portrait: "", character_notes: "", budget_level: "", loyalty_status: "oddiy", satisfaction_score: "5" })
    setOpen(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mijozlar bazasi</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Mijoz kartochkalari, ICP portret va sodiqlik darajasi</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus size={15} /> Yangi mijoz
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <Card key={c.id} className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setSelected(c)}>
            <CardContent className="pt-5">
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={c.name} size={38} />
                <div>
                  <div className="font-medium">{c.name}</div>
                  {c.brand && <div className="text-xs text-[var(--color-ink-soft)]">{c.brand}</div>}
                </div>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={LOYALTY_TONE[c.loyalty_status]}>{LOYALTY_LABEL[c.loyalty_status]}</Badge>
                {c.satisfaction_score != null && (
                  <span className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                    <Star size={11} className="fill-[var(--color-warning)] text-[var(--color-warning)]" /> {c.satisfaction_score}/10
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--color-ink-faint)]">Xizmatdan foydalangan: {c.usage_count} marta</div>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && <p className="text-sm text-[var(--color-ink-faint)]">Mijozlar yo‘q.</p>}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-3 text-sm">
            {selected.icp_portrait && (
              <div><span className="font-medium">ICP portret: </span>{selected.icp_portrait}</div>
            )}
            {selected.character_notes && (
              <div><span className="font-medium">Xarakteri: </span>{selected.character_notes}</div>
            )}
            {selected.budget_level && (
              <div><span className="font-medium">Pul imkoniyati: </span>{selected.budget_level}</div>
            )}
            <div><span className="font-medium">Holati: </span>{LOYALTY_LABEL[selected.loyalty_status]}</div>
            <Comments entityType="client" entityId={selected.id} />
          </div>
        )}
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen} title="Yangi mijoz">
        <form onSubmit={addClient} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ism / kompaniya</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Brend</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>ICP portret</Label>
            <Textarea value={form.icp_portrait} onChange={(e) => setForm({ ...form, icp_portrait: e.target.value })} />
          </div>
          <div>
            <Label>Xarakteri / eslatmalar</Label>
            <Textarea value={form.character_notes} onChange={(e) => setForm({ ...form, character_notes: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Pul imkoniyati</Label>
              <Input value={form.budget_level} onChange={(e) => setForm({ ...form, budget_level: e.target.value })} />
            </div>
            <div>
              <Label>Holati</Label>
              <Select value={form.loyalty_status} onChange={(e) => setForm({ ...form, loyalty_status: e.target.value })}>
                {Object.entries(LOYALTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <Label>Mamnunlik (1-10)</Label>
              <Input type="number" min={1} max={10} value={form.satisfaction_score} onChange={(e) => setForm({ ...form, satisfaction_score: e.target.value })} />
            </div>
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>
    </div>
  )
}
