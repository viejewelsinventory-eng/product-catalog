'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { createClient } from '@/lib/supabase/client'
import { buildWhatsAppCheckoutLink } from '@/lib/whatsapp'
import { getProductImageUrl } from '@/lib/types'
import { formatPrice } from '@/lib/currency'
import type { Profile } from '@/lib/types'

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
}

export default function CartDrawer({
  isOpen,
  onClose,
  profile,
}: CartDrawerProps) {
  const { items, cartId, removeFromCart, updateQuantity, clearCart, refreshCart } =
    useCart()
  const { currency, rate } = useCurrency()
  const supabase = createClient()
  const [checkingOut, setCheckingOut] = useState(false)

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const handleCheckout = async () => {
    if (!cartId || items.length === 0) return
    setCheckingOut(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const email = user?.email ?? null
    const siteOrigin = window.location.origin

    const whatsappUrl = buildWhatsAppCheckoutLink(items, profile, email, siteOrigin, rate)

    const { error } = await supabase
      .from('carts')
      .update({ status: 'submitted' })
      .eq('id', cartId)

    if (error) {
      console.error('Failed to mark cart as submitted:', error)
    }

    window.open(whatsappUrl, '_blank')

    clearCart()
    await refreshCart()
    setCheckingOut(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Cart ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-10">
              Your cart is empty.
            </p>
          )}

          {items.map((item) => (
            <div key={item.id} className="flex gap-3 border-b border-gray-100 pb-4">
              <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProductImageUrl(item.product.drive_file_id)}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(item.product.price, currency, rate)} each
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="text-sm w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    +
                  </button>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-auto text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-4 space-y-3">
            <div className="flex justify-between text-sm font-medium text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total, currency, rate)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-green-600 text-white rounded-md py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {checkingOut ? 'Preparing...' : 'Checkout via WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
