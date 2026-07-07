import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Select } from "@/components/ui/Input"
import { FileUpload } from "@/components/ui/FileUpload"
import { Progress } from "@/components/ui/Progress"
import { Badge } from "@/components/ui/Badge"
import { formatMoney, formatDate } from "@/lib/utils"
import { Plus, TrendingUp, TrendingDown, Target, CalendarClock, Check, Pencil } from "lucide-react"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"

type Tx = { id: string; type: "kirim" | "chiqim"; category: string | null; amount: number; occurred_on: string; receipt_url: string | null; edited_at: string | null }
type Goal = { id: string; title: string; target_amount: number; period_start: string; period_end: string }
type PaymentStage = {
  id: string; contract_id: string; title: string; amount: number; due_date: string | null; status: string; paid_at: string | null
  contracts?: { number: string | null } | null
}
type ContractOption = { id: string; number: string | null }

export default function Finance() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [expectedContracts, setExpectedContracts] = useState(0)
  const [open, setOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Tx | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [form, setForm] = useState({ type: "kirim", category: "", amount: "", occurred_on: "", receipt_url: "" })
  const [goalForm, setGoalForm] = useState({ title: "", target_amount: "", period_start: "", period_end: "" })
  const [stages, setStages] = useState<PaymentStage[]>([])
  const [contractOptions, setContractOptions] = useState<ContractOption[]>([])
  const [stageForm, setStageForm] = useState({ contract_id: "", title: "", amount: "", due_date: "" })

  async function load() {
    const [{ data: t }, { data: g }, { data: c }, { data: st }, { data: co }] = await Promise.all([
      supabase.from("finance_transactions").select("*").order("occurred_on", { ascending: false }).limit(200),
      supabase.from("finance_goals").select("*").order("period_start", { ascending: false }),
      supabase.from("contracts").select("amount").in("status", ["yangi", "kutilmoqda"]),
      supabase.from("payment_stages").select("*, contracts(number)").order("due_date", { ascending: true }),
      supabase.from("contracts").select("id, number"),
    ])
    setTxs((t as Tx[]) ?? [])
    setGoals((g as Goal[]) ?? [])
    setExpectedContracts((c ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0))
    setStages((st as any) ?? [])
    setContractOptions((co as ContractOption[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  const income = txs.filter((t) => t.type === "kirim").reduce((s, t) => s + Number(t.amount), 0)
  const expense = txs.filter((t) => t.type === "chiqim").reduce((s, t) => s + Number(t.amount), 0)
  const net = income - expense

  const chartData = useMemo(() => {
    const byMonth: Record<string, { month: string; kirim: number; chiqim: number }> = {}
    for (const t of txs) {
      const m = t.occurred_on?.slice(0, 7) ?? "—"
      byMonth[m] ??= { month: m, kirim: 0, chiqim: 0 }
      byMonth[m][t.type === "kirim" ? "kirim" : "chiqim"] += Number(t.amount)
    }
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
  }, [txs])

  function openNewTx() {
    setEditingTx(null)
    setForm({ type: "kirim", category: "", amount: "", occurred_on: "", receipt_url: "" })
    setOpen(true)
  }
  function openEditTx(tx: Tx) {
    setEditingTx(tx)
    setForm({ type: tx.type, category: tx.category ?? "", amount: String(tx.amount), occurred_on: tx.occurred_on, receipt_url: tx.receipt_url ?? "" })
    setOpen(true)
  }

  async function addTx(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      type: form.type,
      category: form.category || null,
      amount: Number(form.amount),
      occurred_on: form.occurred_on || new Date().toISOString().slice(0, 10),
      receipt_url: form.receipt_url || null,
    }
    if (editingTx) {
      await supabase.from("finance_transactions").update({ ...payload, edited_at: new Date().toISOString() }).eq("id", editingTx.id)
    } else {
      await supabase.from("finance_transactions").insert(payload)
    }
    setForm({ type: "kirim", category: "", amount: "", occurred_on: "", receipt_url: "" })
    setEditingTx(null)
    setOpen(false)
    load()
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("finance_goals").insert({
      title: goalForm.title,
      target_amount: Number(goalForm.target_amount),
      period_start: goalForm.period_start,
      period_end: goalForm.period_end,
    })
    setGoalForm({ title: "", target_amount: "", period_start: "", period_end: "" })
    setGoalOpen(false)
    load()
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("payment_stages").insert({
      contract_id: stageForm.contract_id,
      title: stageForm.title,
      amount: Number(stageForm.amount),
      due_date: stageForm.due_date || null,
    })
    setStageForm({ contract_id: "", title: "", amount: "", due_date: "" })
    setStageOpen(false)
    load()
  }

  async function markPaid(stage: PaymentStage) {
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from("payment_stages").update({ status: "tolandi", paid_at: today }).eq("id", stage.id)
    await supabase.from("finance_transactions").insert({
      type: "kirim",
      category: `To‘lov bosqichi: ${stage.title}`,
      amount: stage.amount,
      occurred_on: today,
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Moliya</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Fin model, SMART maqsadlar va oqim</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGoalOpen(true)}>
            <Target size={15} /> SMART maqsad
          </Button>
          <Button variant="accent" onClick={openNewTx}>
            <Plus size={15} /> Tranzaksiya
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-success)]"><TrendingUp size={16} /><span className="text-xs font-medium">Kirim</span></div>
          <div className="text-xl font-semibold">{formatMoney(income)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-danger)]"><TrendingDown size={16} /><span className="text-xs font-medium">Chiqim</span></div>
          <div className="text-xl font-semibold">{formatMoney(expense)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="mb-2 text-xs font-medium text-[var(--color-ink-soft)]">Sof foyda</div>
          <div className={`text-xl font-semibold ${net >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{formatMoney(net)}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Barcha tranzaksiyalar</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {txs.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${t.type === "kirim" ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"}`}>
                  {t.type === "kirim" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                </span>
                <div>
                  <div className="font-medium">{t.category || (t.type === "kirim" ? "Kirim" : "Chiqim")}</div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-faint)]">
                    {formatDate(t.occurred_on)}
                    {t.edited_at && <Badge tone="neutral">Tahrirlangan</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-medium ${t.type === "kirim" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{formatMoney(t.amount)}</span>
                <button onClick={() => openEditTx(t)} className="cursor-pointer rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]">
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          ))}
          {txs.length === 0 && <p className="text-xs text-[var(--color-ink-faint)]">Hozircha tranzaksiyalar yo‘q.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Oylik oqim (grafik)</CardTitle></CardHeader>
        <CardContent className="h-56 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="kirim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chiqim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-danger)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Area type="monotone" dataKey="kirim" stroke="var(--color-success)" fill="url(#kirim)" strokeWidth={2} />
              <Area type="monotone" dataKey="chiqim" stroke="var(--color-danger)" fill="url(#chiqim)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Kutilayotgan sotuvlar (shartnomalar bo‘yicha)</CardTitle></CardHeader>
        <CardContent className="pt-0 text-sm text-[var(--color-ink-soft)]">
          Yangi va kutilayotgan shartnomalar summasi: <span className="font-semibold text-[var(--color-ink)]">{formatMoney(expectedContracts)}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>To‘lov bosqichlari</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setStageOpen(true)}>
            <Plus size={13} /> Bosqich qo‘shish
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {stages.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{s.title} <span className="text-xs text-[var(--color-ink-faint)]">· {s.contracts?.number ?? "shartnomasiz"}</span></div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                  <CalendarClock size={11} /> {s.due_date ? formatDate(s.due_date) : "muddatsiz"} · {formatMoney(s.amount)}
                </div>
              </div>
              {s.status === "tolandi" ? (
                <Badge tone="success">To‘landi</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => markPaid(s)}>
                  <Check size={12} /> To‘landi deb belgilash
                </Button>
              )}
            </div>
          ))}
          {stages.length === 0 && <p className="text-xs text-[var(--color-ink-faint)]">Hozircha to‘lov bosqichlari yo‘q.</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {goals.map((g) => {
          const achieved = txs
            .filter((t) => t.type === "kirim" && t.occurred_on >= g.period_start && t.occurred_on <= g.period_end)
            .reduce((s, t) => s + Number(t.amount), 0)
          const pct = g.target_amount ? Math.min(100, Math.round((achieved / g.target_amount) * 100)) : 0
          return (
            <Card key={g.id}>
              <CardContent className="pt-5">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="font-medium">{g.title}</h4>
                  <span className="text-xs text-[var(--color-ink-faint)]">{formatDate(g.period_start)} – {formatDate(g.period_end)}</span>
                </div>
                <Progress value={pct} tone={pct >= 100 ? "success" : "accent"} className="my-2" />
                <div className="text-xs text-[var(--color-ink-soft)]">{formatMoney(achieved)} / {formatMoney(g.target_amount)} ({pct}%)</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title={editingTx ? "Tranzaksiyani tahrirlash" : "Yangi tranzaksiya"}>
        <form onSubmit={addTx} className="space-y-3">
          <div>
            <Label>Turi</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="kirim">Kirim</option>
              <option value="chiqim">Chiqim</option>
            </Select>
          </div>
          <div>
            <Label>Kategoriya</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Summa</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <Label>Sana</Label>
              <Input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Chek / kvitansiya</Label>
            <FileUpload folder="receipts" value={form.receipt_url} onUploaded={(url) => setForm({ ...form, receipt_url: url })} />
          </div>
          <Button type="submit" variant="accent" className="w-full">{editingTx ? "Saqlash" : "Qo‘shish"}</Button>
        </form>
      </Dialog>

      <Dialog open={goalOpen} onOpenChange={setGoalOpen} title="SMART maqsad qo‘shish">
        <form onSubmit={addGoal} className="space-y-3">
          <div>
            <Label>Nomi</Label>
            <Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
          </div>
          <div>
            <Label>Maqsad summasi</Label>
            <Input type="number" value={goalForm.target_amount} onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Boshlanish</Label>
              <Input type="date" value={goalForm.period_start} onChange={(e) => setGoalForm({ ...goalForm, period_start: e.target.value })} required />
            </div>
            <div>
              <Label>Tugash</Label>
              <Input type="date" value={goalForm.period_end} onChange={(e) => setGoalForm({ ...goalForm, period_end: e.target.value })} required />
            </div>
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>

      <Dialog open={stageOpen} onOpenChange={setStageOpen} title="To‘lov bosqichi qo‘shish">
        <form onSubmit={addStage} className="space-y-3">
          <div>
            <Label>Shartnoma</Label>
            <Select value={stageForm.contract_id} onChange={(e) => setStageForm({ ...stageForm, contract_id: e.target.value })} required>
              <option value="">Tanlang</option>
              {contractOptions.map((c) => <option key={c.id} value={c.id}>{c.number || c.id.slice(0, 8)}</option>)}
            </Select>
          </div>
          <div>
            <Label>Bosqich nomi</Label>
            <Input value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} placeholder="Boshlang‘ich to‘lov" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Summa</Label>
              <Input type="number" value={stageForm.amount} onChange={(e) => setStageForm({ ...stageForm, amount: e.target.value })} required />
            </div>
            <div>
              <Label>Muddat</Label>
              <Input type="date" value={stageForm.due_date} onChange={(e) => setStageForm({ ...stageForm, due_date: e.target.value })} />
            </div>
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>
    </div>
  )
}
