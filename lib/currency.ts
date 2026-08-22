export type Currency = 'USD' | 'INR'

export function toINR(usdAmount: number, rate: number): number {
  return usdAmount * rate
}

export function formatUSD(usdAmount: number | null | undefined): string {
  if (usdAmount == null) return 'Price N/A'
  return `$${usdAmount.toFixed(2)}`
}

export function formatINR(usdAmount: number | null | undefined, rate: number): string {
  if (usdAmount == null) return 'Price N/A'
  return `₹${toINR(usdAmount, rate).toFixed(2)}`
}

export function formatPrice(
  usdAmount: number | null | undefined,
  currency: Currency,
  rate: number
): string {
  return currency === 'INR' ? formatINR(usdAmount, rate) : formatUSD(usdAmount)
}

export function formatBothCurrencies(usdAmount: number | null | undefined, rate: number): string {
  if (usdAmount == null) return 'Price N/A'
  return `${formatUSD(usdAmount)} / ${formatINR(usdAmount, rate)}`
}
