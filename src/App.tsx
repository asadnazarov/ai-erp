import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "@/lib/auth"
import { AppLayout } from "@/components/layout/AppLayout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import SalesFunnel from "@/pages/SalesFunnel"
import Projects from "@/pages/Projects"
import Tasks from "@/pages/Tasks"
import Documents from "@/pages/Documents"
import Finance from "@/pages/Finance"
import Contracts from "@/pages/Contracts"
import Employees from "@/pages/Employees"
import Clients from "@/pages/Clients"
import DemoTracker from "@/pages/DemoTracker"

function Gate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      </div>
    )
  }
  if (!session) return <Login />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Gate>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sotuv" element={<SalesFunnel />} />
          <Route path="/loyihalar" element={<Projects />} />
          <Route path="/vazifalar" element={<Tasks />} />
          <Route path="/xujjatlar" element={<Documents />} />
          <Route path="/moliya" element={<Finance />} />
          <Route path="/shartnomalar" element={<Contracts />} />
          <Route path="/xodimlar" element={<Employees />} />
          <Route path="/mijozlar" element={<Clients />} />
          <Route path="/demo" element={<DemoTracker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Gate>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
