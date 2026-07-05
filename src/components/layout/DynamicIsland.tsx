import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { navItems } from "./navItems"
import { cn } from "@/lib/utils"

const SPRING = { type: "spring", stiffness: 460, damping: 36, mass: 0.8 } as const

export function DynamicIsland() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pulseKey, setPulseKey] = useState(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = navItems.find((i) => i.path === pathname) ?? navItems[0]
  const ActiveIcon = active.icon
  const rest = navItems.filter((i) => i.path !== active.path)

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
    closeTimer.current = setTimeout(() => setOpen(false), 300)
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.div
        layout
        onMouseEnter={() => {
          cancelClose()
          setOpen(true)
        }}
        onMouseLeave={scheduleClose}
        onClick={() => setOpen((o) => !o)}
        animate={{
          opacity: scrolled && !open ? 0.6 : 1,
          scale: scrolled && !open ? 0.9 : 1,
          y: scrolled && !open ? -2 : 0,
        }}
        transition={SPRING}
        className={cn(
          "pointer-events-auto relative flex max-w-[92vw] cursor-pointer items-center overflow-hidden rounded-full bg-[var(--color-island)] shadow-[var(--shadow-island)] backdrop-blur-xl",
          scrolled && !open ? "backdrop-saturate-150" : ""
        )}
      >
        <AnimatePresence>
          {pulseKey > 0 && (
            <motion.span
              key={pulseKey}
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[var(--color-accent)]"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <motion.div layout className="flex items-center gap-2 overflow-x-auto px-3.5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <motion.div
            layout
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]"
          >
            <ActiveIcon size={13} className="text-white" strokeWidth={2.2} />
          </motion.div>

          <AnimatePresence mode="popLayout">
            <motion.span
              key={active.path}
              initial={{ opacity: 0, x: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -6, filter: "blur(3px)" }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap text-[13px] font-medium text-[var(--color-island-ink)]"
            >
              {active.label}
            </motion.span>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {open && (
              <>
                <motion.span
                  key="divider"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-4 w-px shrink-0 bg-[var(--color-island-ink)]/20"
                />
                {rest.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, x: -8, scale: 0.7 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.7 }}
                      transition={{ ...SPRING, delay: idx * 0.02 }}
                      title={item.label}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(item.path)
                      }}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-island-ink)]/75 transition-colors hover:bg-[var(--color-island-ink)]/10 hover:text-[var(--color-island-ink)]"
                    >
                      <Icon size={14} strokeWidth={2.2} />
                    </motion.button>
                  )
                })}
              </>
            )}
          </AnimatePresence>

          <motion.div
            layout
            animate={{ rotate: open ? 180 : 0 }}
            transition={SPRING}
            className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--color-island-ink)]/50"
          >
            <ChevronDown size={13} />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
