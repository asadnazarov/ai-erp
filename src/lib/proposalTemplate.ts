import { formatMoney, formatDate } from "@/lib/utils"

const SUPPORT_TIER_LABEL: Record<string, string> = {
  bepul: "Bepul",
  start: "Start",
  pro: "Pro",
  max: "Max",
}
const PAYMENT_TYPE_LABEL: Record<string, string> = {
  bir_martalik: "Bir martalik to‘lov",
  bolib_tolash: "Bo‘lib to‘lash",
}

type KpInput = {
  projectName: string
  companyName: string | null
  clientContactName: string | null
  amount: number | null
  paymentType: string | null
  installmentsCount: number | null
  paymentStages: { title: string; amount: number; due_date: string | null }[]
}

export function renderProposalHtml(p: KpInput): string {
  const stagesRows = p.paymentStages.length
    ? p.paymentStages
        .map(
          (s) => `<tr>
            <td style="padding:10px 14px;border-bottom:1px solid #e8e6e1;">${s.title}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e8e6e1;text-align:right;">${formatMoney(s.amount)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #e8e6e1;text-align:right;">${s.due_date ? formatDate(s.due_date) : "—"}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding:14px;color:#9a98a0;">To‘lov bosqichlari kiritilmagan</td></tr>`

  return `
  <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color:#17161b; max-width:720px; margin:0 auto; padding:32px;">
    <div style="margin-bottom:28px;">
      <div style="font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#5b5bf6; font-weight:600;">Kommersiya taklifi</div>
      <h1 style="font-size:28px; margin:8px 0 0; font-weight:800;">${p.projectName}</h1>
      ${p.companyName ? `<div style="color:#6b6a70; margin-top:4px;">${p.companyName}${p.clientContactName ? " · " + p.clientContactName : ""}</div>` : ""}
    </div>

    <div style="display:flex; gap:24px; margin-bottom:28px;">
      <div>
        <div style="font-size:12px; color:#9a98a0; text-transform:uppercase; letter-spacing:1px;">Umumiy summa</div>
        <div style="font-size:20px; font-weight:700; margin-top:4px;">${p.amount != null ? formatMoney(p.amount) : "—"}</div>
      </div>
      <div>
        <div style="font-size:12px; color:#9a98a0; text-transform:uppercase; letter-spacing:1px;">To‘lov turi</div>
        <div style="font-size:20px; font-weight:700; margin-top:4px;">${p.paymentType ? PAYMENT_TYPE_LABEL[p.paymentType] ?? p.paymentType : "—"}</div>
      </div>
      ${
        p.paymentType === "bolib_tolash" && p.installmentsCount
          ? `<div><div style="font-size:12px; color:#9a98a0; text-transform:uppercase; letter-spacing:1px;">Qismlar soni</div><div style="font-size:20px; font-weight:700; margin-top:4px;">${p.installmentsCount}</div></div>`
          : ""
      }
    </div>

    <h3 style="font-size:15px; margin-bottom:10px;">To‘lov bosqichlari</h3>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left; padding:8px 14px; color:#9a98a0; font-size:12px; text-transform:uppercase;">Bosqich</th>
          <th style="text-align:right; padding:8px 14px; color:#9a98a0; font-size:12px; text-transform:uppercase;">Summa</th>
          <th style="text-align:right; padding:8px 14px; color:#9a98a0; font-size:12px; text-transform:uppercase;">Muddat</th>
        </tr>
      </thead>
      <tbody>${stagesRows}</tbody>
    </table>
  </div>`
}

type SupportInput = {
  projectName: string
  companyName: string | null
  supportTier: string
  supportMonths: number | null
}

export function renderSupportHtml(p: SupportInput): string {
  return `
  <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color:#17161b; max-width:720px; margin:0 auto; padding:32px;">
    <div style="margin-bottom:24px;">
      <div style="font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#5b5bf6; font-weight:600;">Texnik qo‘llab-quvvatlash</div>
      <h1 style="font-size:28px; margin:8px 0 0; font-weight:800;">${p.projectName}</h1>
      ${p.companyName ? `<div style="color:#6b6a70; margin-top:4px;">${p.companyName}</div>` : ""}
    </div>

    <div style="background:#f4f3f1; border-radius:14px; padding:20px 24px;">
      <div style="font-size:12px; color:#9a98a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Tarif</div>
      <div style="font-size:20px; font-weight:700;">${SUPPORT_TIER_LABEL[p.supportTier] ?? p.supportTier}${p.supportMonths ? ` — ${p.supportMonths} oy` : ""}</div>
      <p style="color:#6b6a70; font-size:14px; margin-top:10px;">
        Loyiha topshirilgandan so‘ng ko‘rsatilgan muddat davomida xatoliklarni bepul tuzatamiz, savollaringizga javob beramiz va tizim ishlashini nazorat qilamiz.
      </p>
    </div>
  </div>`
}
