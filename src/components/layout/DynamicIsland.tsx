import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { navItems } from "./navItems"
import { cn } from "@/lib/utils"

const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const

export function DynamicIsland() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pulseKey, setPulseKey] = useState(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = navItems.find((i) => i.path === pathname) ?? navItems[0]
  const ActiveIcon = active.icon

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = document.getElementById("app-scroll")?.scrollTop ?? window.scrollY
        setScrolled(y > 24)
      })
    }
    const scroller = document.getElementById("app-scroll")
    scroller?.addEventListener("scroll", onScroll)
    window.addEventListener("scroll", onScroll)
    return () => {
      scroller?.removeEventListener("scroll", onScroll)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  function handleSelect(path: string) {
    navigate(path)
    setPulseKey((k) => k + 1)
    setOpen(false)
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 350)
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
      <motion.div
        layout
        onMouseEnter={() => {
          cancelClose()
          setOpen(true)
        }}
        onMouseLeave={scheduleClose}
        onClick={() => setOpen((o) => !o)}
        animate={{
          opacity: scrolled && !open ? 0.62 : 1,
          scale: scrolled && !open ? 0.92 : 1,
          y: scrolled && !open ? -2 : 0,
        }}
        transition={SPRING}
        className={cn(
          "pointer-events-auto relative flex cursor-pointer flex-col items-stretch overflow-hidden rounded-[28px] bg-[var(--color-island)] shadow-[var(--shadow-island)] backdrop-blur-xl",
          scrolled && !open ? "backdrop-saturate-150" : ""
        )}
        style={{ transformOrigin: "top center" }}
      >
        {/* pulse ring on selection */}
        <AnimatePresence>
          {pulseKey > 0 && (
            <motion.span
              key={pulseKey}
              className="pointer-events-none absolute inset-0 rounded-[28px] ring-2 ring-[var(--color-accent)]"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <motion.div layout className="flex items-center gap-2.5 px-4 py-2.5">
          <motion.div
            layout
            animate={{ rotate: open ? 90 : 0 }}
            transition={SPRING}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-island-ink)]/10"
          >
            <ActiveIcon size={14} className="text-[var(--color-island-ink)]" strokeWidth={2.2} />
          </motion.div>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={active.path}
              initial={{ opacity: 0, x: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -6, filter: "blur(3px)" }}
              transition={{ duration: 0.22 }}
              className="whitespace-nowrap text-[13px] font-medium text-[var(--color-island-ink)]"
            >
              {active.label}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING}
              className="grid grid-cols-2 gap-1 px-2 pb-2.5"
            >
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = item.path === pathname
                return (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(item.path)
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-[12.5px] transition-colors cursor-pointer",
                      isActive
                        ? "bg-[var(--color-accent)] text-white"
                        : "text-[var(--color-island-ink)]/85 hover:bg-[var(--color-island-ink)]/10"
                    )}
                  >
                    <Icon size={14} strokeWidth={2.2} className="shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
