// ============================================
// Currency conversion — USD is the source of truth (all prices in the
// database are stored in USD). This constant converts for display only.
//
// UPDATE THIS PERIODICALLY — exchange rates move daily. Last checked
// August 2026, mid-market rate ≈ 95.6 INR per 1 USD (source: xe.com).
// ============================================
export const USD_TO_INR_RATE = 95.6

export type Currency = 'USD' | 'INR'

export function toINR(usdAmount: number): number {
  return usdAmount * USD_TO_INR_RATE
}

export function formatUSD(usdAmount: number): string {
  return `$${usdAmount.toFixed(2)}`
}

export function formatINR(usdAmount: number): string {
  return `₹${toINR(usdAmount).toFixed(2)}`
}

export function formatPrice(usdAmount: number, currency: Currency): string {
  return currency === 'INR' ? formatINR(usdAmount) : formatUSD(usdAmount)
}

// Both currencies together, e.g. for the WhatsApp message where showing
// both avoids ambiguity about which currency was intended.
export function formatBothCurrencies(usdAmount: number): string {
  return `${formatUSD(usdAmount)} / ${formatINR(usdAmount)}`
}
