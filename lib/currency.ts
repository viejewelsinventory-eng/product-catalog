export type Currency = 'USD' | 'INR'

export function formatPrice(price: number, currency: Currency, rate: number): string {
  if (currency === 'INR') {
    const converted = price * rate
    return `₹${converted.toFixed(2)}`
  }
  return `$${price.toFixed(2)}`
}
