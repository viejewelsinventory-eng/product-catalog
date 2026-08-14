import type { CartItemWithProduct, Profile } from './types'

// Set this to YOUR WhatsApp business number, in international format,
// digits only, no + or spaces. Example: 15551234567
const WHATSAPP_BUSINESS_NUMBER = '919619616412'

export function buildWhatsAppCheckoutLink(
  items: CartItemWithProduct[],
  profile: Profile | null
): string {
  const lines: string[] = []

  lines.push('New Order Request')
  lines.push('')

  if (profile) {
    lines.push(`Name: ${profile.full_name ?? 'N/A'}`)
    lines.push(`Phone: ${profile.phone_number ?? 'N/A'}`)
    if (profile.company_name) {
      lines.push(`Company: ${profile.company_name}`)
    }
    lines.push('')
  }

  lines.push('Items:')
  items.forEach((item) => {
    const lineTotal = (item.product.price * item.quantity).toFixed(2)
    lines.push(
      `- ${item.product.name} (SKU: ${item.product.sku}) x${item.quantity} — $${lineTotal}`
    )
  })

  const grandTotal = items
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    .toFixed(2)

  lines.push('')
  lines.push(`Total: $${grandTotal}`)

  const message = lines.join('\n')
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`
}
