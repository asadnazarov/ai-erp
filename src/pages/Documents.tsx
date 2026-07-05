import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input, Label, Textarea } from "@/components/ui/Input"
import { Plus, KeyRound, ExternalLink, Eye, EyeOff } from "lucide-react"

type Doc = {
  id: string
  title: string
  folder: string | null
  login: string | null
  password_enc: string | null
  url: string | null
  notes: string | null
}

export default function Documents() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [open, setOpen] = useState(false)
  const [reveal, setReveal] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ title: "", folder: "Umumiy", login: "", password_enc: "", url: "", notes: "" })

  async function load() {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false })
    setDocs((data as Doc[]) ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function addDoc(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from("documents").insert(form)
    setForm({ title: "", folder: "Umumiy", login: "", password_enc: "", url: "", notes: "" })
    setOpen(false)
    load()
  }

  const folders = Array.from(new Set(docs.map((d) => d.folder || "Umumiy")))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Xujjatlar</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Login, parol va kerakli hujjatlar bir joyda</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus size={15} /> Yangi hujjat
        </Button>
      </div>

      {folders.map((folder) => (
        <div key={folder}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{folder}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.filter((d) => (d.folder || "Umumiy") === folder).map((d) => (
              <Card key={d.id}>
                <CardContent className="pt-5">
                  <div className="mb-2 flex items-center gap-2">
                    <KeyRound size={14} className="text-[var(--color-accent)]" />
                    <h4 className="font-medium">{d.title}</h4>
                  </div>
                  {d.login && <div className="text-xs text-[var(--color-ink-soft)]">Login: {d.login}</div>}
                  {d.password_enc && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
                      Parol: {reveal[d.id] ? d.password_enc : "••••••••"}
                      <button
                        onClick={() => setReveal((r) => ({ ...r, [d.id]: !r[d.id] }))}
                        className="cursor-pointer text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                      >
                        {reveal[d.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  )}
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline">
                      Havola <ExternalLink size={11} />
                    </a>
                  )}
                  {d.notes && <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">{d.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {docs.length === 0 && <p className="text-sm text-[var(--color-ink-faint)]">Hozircha hujjatlar yo‘q.</p>}

      <Dialog open={open} onOpenChange={setOpen} title="Yangi hujjat">
        <form onSubmit={addDoc} className="space-y-3">
          <div>
            <Label>Nomi</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <Label>Papka</Label>
            <Input value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Login</Label>
              <Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
            </div>
            <div>
              <Label>Parol</Label>
              <Input value={form.password_enc} onChange={(e) => setForm({ ...form, password_enc: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Havola</Label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button type="submit" variant="accent" className="w-full">Qo‘shish</Button>
        </form>
      </Dialog>
    </div>
  )
}
