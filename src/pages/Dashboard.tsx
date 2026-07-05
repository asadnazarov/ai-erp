import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { formatMoney } from "@/lib/utils"
import { Columns3, FolderKanban, Wallet, Contact } from "lucide-react"

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, projects: 0, income: 0, clients: 0 })

  useEffect(() => {
    async function load() {
      const [leads, projects, income, clients] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "jarayonda"),
        supabase.from("finance_transactions").select("amount").eq("type", "kirim"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
      ])
      setStats({
        leads: leads.count ?? 0,
        projects: projects.count ?? 0,
        income: (income.data ?? []).reduce((s, r: any) => s + Number(r.amount), 0),
        clients: clients.count ?? 0,
      })
    }
    load()
  }, [])

  const cards = [
    { label: "Ochiq lidlar", value: stats.leads, icon: Columns3 },
    { label: "Jarayondagi loyihalar", value: stats.projects, icon: FolderKanban },
    { label: "Jami kirim", value: formatMoney(stats.income), icon: Wallet },
    { label: "Mijozlar bazasi", value: stats.clients, icon: Contact },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} {...fade} transition={{ duration: 0.4, delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <c.icon size={17} />
                </div>
                <div className="text-2xl font-semibold tabular-nums">{c.value}</div>
                <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{c.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
