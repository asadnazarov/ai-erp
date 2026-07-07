import { chromium } from "playwright"
import path from "path"

const file = process.argv[2]
const out = process.argv[3]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 2 })
await page.goto("file://" + path.resolve(file), { waitUntil: "networkidle" })
await page.waitForTimeout(300)
await page.screenshot({ path: out })
await browser.close()
