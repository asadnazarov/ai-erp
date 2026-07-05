import {
  LayoutDashboard,
  Columns3,
  FolderKanban,
  ListChecks,
  FileText,
  Wallet,
  FileSignature,
  Users,
  Contact,
  ClipboardList,
} from "lucide-react"

export const navItems = [
  { path: "/", label: "Bosh sahifa", icon: LayoutDashboard },
  { path: "/sotuv", label: "Sotuv voronkasi", icon: Columns3 },
  { path: "/loyihalar", label: "Loyihalar", icon: FolderKanban },
  { path: "/vazifalar", label: "Vazifalar", icon: ListChecks },
  { path: "/xujjatlar", label: "Xujjatlar", icon: FileText },
  { path: "/moliya", label: "Moliya", icon: Wallet },
  { path: "/shartnomalar", label: "Shartnomalar", icon: FileSignature },
  { path: "/xodimlar", label: "Xodimlar", icon: Users },
  { path: "/mijozlar", label: "Mijozlar bazasi", icon: Contact },
  { path: "/demo", label: "TZ / Demo", icon: ClipboardList },
] as const
