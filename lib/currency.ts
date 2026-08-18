// ============================================
// Currency conversion — USD is the source of truth (all prices in the
// database are stored in USD). The conversion rate is admin-editable and
// lives in Supabase (`app_settings.usd_to_inr_rate`), loaded and updated
// via CurrencyContext — these functions just take it as a parameter.
// ============================================
export type Currency = 'USD' | 'INR'

export function toINR(usdAmount: number, rate: number): number {
  return usdAmount * rate
}

export function formatUSD(usdAmount: number): string {
  return `$${usdAmount.toFixed(2)}`
}

export function formatINR(usdAmount: number, rate: number): string {
  return `₹${toINR(usdAmount, rate).toFixed(2)}`
}

export function formatPrice(usdAmount: number, currency: Currency, rate: number): string {
  return currency === 'INR' ? formatINR(usdAmount, rate) : formatUSD(usdAmount)
}

// Both currencies together, e.g. for the WhatsApp message where showing
// both avoids ambiguity about which currency was intended.
export function formatBothCurrencies(usdAmount: number, rate: number): string {
  return `${formatUSD(usdAmount)} / ${formatINR(usdAmount, rate)}`
}
