import type { ReactNode } from "react"
import { DynamicIsland } from "./DynamicIsland"

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full">
      <DynamicIsland />
      <main id="app-scroll" className="h-full overflow-y-auto px-6 pb-16 pt-24 md:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
