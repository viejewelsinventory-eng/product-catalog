import type { CartItemWithProduct, Profile } from './types'
import { formatUSD, formatINR } from './currency'
// Set this to YOUR WhatsApp business number, in international format,
// digits only, no + or spaces. Example: 15551234567
const WHATSAPP_BUSINESS_NUMBER = '919619616412'
// PayPal account to display for USD payments.
const PAYPAL_ACCOUNT = 'ssdiaminc@gmail.com'
// Filename of your UPI QR code image, uploaded to the public/ folder.
// e.g. if you upload public/upi-qr.png, keep this as 'upi-qr.png'.
const UPI_QR_FILENAME = 'upi-qr.png'
export function buildWhatsAppCheckoutLink(
  items: CartItemWithProduct[],
  profile: Profile | null,
  email: string | null,
  siteOrigin: string,
  rate: number
): string {
  const lines: string[] = []
  // Header (WhatsApp can't embed an actual logo image via a wa.me link,
  // so this is a bold text header standing in for one)
  lines.push('🔷 *VIE* — *Cart Details*')
  lines.push('')
  // Client details
  lines.push('*Customer Details*')
  lines.push(`Name: ${profile?.full_name ?? 'N/A'}`)
  if (email) {
    lines.push(`Email: ${email}`)
  }
  lines.push(`Phone: ${profile?.phone_number ?? 'N/A'}`)
  if (profile?.company_name) {
    lines.push(`Company: ${profile.company_name}`)
  }
  lines.push('')
  // Items — SKU, qty, rate, amount, in both currencies
  lines.push('*Items*')
  items.forEach((item, index) => {
    const lineTotal = item.product.price * item.quantity
    lines.push(`${index + 1}. SKU: ${item.product.sku}`)
    lines.push(`   Qty: ${item.quantity}`)
    lines.push(
      `   Rate: ${formatUSD(item.product.price)} / ${formatINR(item.product.price, rate)}`
    )
    lines.push(`   Amount: ${formatUSD(lineTotal)} / ${formatINR(lineTotal, rate)}`)
    lines.push('')
  })
  const grandTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  lines.push(`*Total: ${formatUSD(grandTotal)} / ${formatINR(grandTotal, rate)}*`)
  lines.push('')
  // Payment options
  lines.push('*Payment Options*')
  const qrLink = `${siteOrigin}/${UPI_QR_FILENAME}`
  lines.push(`🇮🇳 UPI (INR) — Scan QR: ${qrLink}`)
  lines.push(`🌍 PayPal (USD): ${PAYPAL_ACCOUNT}`)
  lines.push('')
  lines.push('Thank you for shopping with VIE! 🙏')
  const message = lines.join('\n')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`
}
