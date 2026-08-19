'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { getProductImageUrl } from '@/lib/types'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { formatPrice } from '@/lib/currency'
const VISIBILITY_LABELS: Record<string, string> = {
  admin: 'Admin Only',
  registered: 'Registered User',
  public: 'Main Website',
  blank: 'Blank',
}
export default function ProductCard({
  product,
  isAdmin,
  onOpen,
}: {
  product: Product
  isAdmin: boolean
  onOpen: () => void
}) {
  const { addToCart } = useCart()
  const { currency, rate } = useCurrency()
  const [adding, setAdding] = useState(false)
  const [imgError, setImgError] = useState(false)
  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdding(true)
    await addToCart(product, 1)
    setAdding(false)
  }
  const isBlank = product.visibility === 'blank'
  const imageUrl = getProductImageUrl(product.drive_file_id)
  const displaySrc = isBlank ? '/blank.jpg' : imgError ? '/photo-missing.jpg' : imageUrl
  const displayLabel = VISIBILITY_LABELS[product.visibility] ?? product.visibility
  return (
    <div
      onClick={onOpen}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Full image, no cropping. Blank overrides everything; otherwise fall back to photo-missing on load error */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={displaySrc}
          alt={product.sku}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain"
          onError={() => {
            if (!isBlank) setImgError(true)
          }}
          unoptimized
        />
      </div>
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        {/* SKU under image, shown to everyone */}
        <p className="text-sm font-semibold text-gray-900">{product.sku}</p>
        {/* Admin only: file types (tags) available -- reserves space even when empty, per spec */}
        {isAdmin && (
          <div className="flex flex-wrap gap-1 min-h-[1.25rem]">
            {product.tags && product.tags.length > 0 &&
              product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
        <p className="text-sm text-gray-700">{formatPrice(product.price, currency, rate)}</p>
        {/* Admin only: Display and Category, stacked underneath each other */}
        {isAdmin && (
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>Display: {displayLabel}</p>
            <p>Category: {product.category || '—'}</p>
          </div>
        )}
        {/* Spacer absorbs leftover height so the button always sits at the same bottom position */}
        <div className="flex-1" />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="mt-1 bg-gray-900 text-white text-xs rounded-md py-2 hover:bg-gray-800 disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
