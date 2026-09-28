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

const MAX_IMAGE_RETRIES = 2
const RETRY_DELAY_MS = 1200

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
  const [retryCount, setRetryCount] = useState(0)
  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdding(true)
    await addToCart(product, 1)
    setAdding(false)
  }
  const handleImageError = () => {
    if (isBlank) return
    if (retryCount < MAX_IMAGE_RETRIES) {
      // Transient failures are common right after a bulk image-matching
      // run: Google Drive often needs to generate a thumbnail the first
      // time a file is requested. Retry a couple of times with a short
      // delay before falling back to the missing-photo placeholder.
      setTimeout(() => {
        setRetryCount((count) => count + 1)
      }, RETRY_DELAY_MS)
    } else {
      setImgError(true)
    }
  }
  const isBlank = product.visibility === 'blank'
  const imageUrl = getProductImageUrl(product.drive_file_id)
  const displaySrc = isBlank
    ? '/blank.jpg'
    : imgError
    ? '/photo-missing.jpg'
    : imageUrl
  const displayLabel = VISIBILITY_LABELS[product.visibility] ?? product.visibility
  // subsubcategory stores composite "SubType::SubSubType" values; only the
  // Sub-Sub-Type portion is shown here since the Sub-Type is already
  // rendered on its own.
  const subSubLabels = (product.subsubcategory ?? []).map((value) =>
    value.includes('::') ? value.split('::')[1] : value
  )
  return (
    <div
      onClick={onOpen}
      className="group flex flex-col h-full cursor-pointer rounded-2xl border border-stone-200/70 bg-white p-1.5 transition-all duration-500 hover:-translate-y-1 hover:border-[#c9b58a] hover:shadow-[0_24px_50px_-16px_rgba(28,25,23,0.22)]"
    >
      {/* Full image, no cropping. Blank overrides everything; otherwise fall back to photo-missing on load error */}
      <div className="relative w-full aspect-square overflow-hidden rounded-xl border border-stone-100 bg-white">
        <div className="absolute inset-1">
          <Image
            // key forces a fresh <img> mount on retry, since simply changing
            // the src prop on the same element won't reliably re-trigger a
            // request after a prior failure.
            key={`${product.id}-${retryCount}`}
            src={displaySrc}
            alt={product.sku}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            onError={handleImageError}
            unoptimized
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 gap-1.5 px-1.5 pt-3 pb-1.5">
        {/* SKU under image, shown to everyone */}
        <p className="font-serif text-sm tracking-wide text-stone-900">{product.sku}</p>
        {/* Sub-Type / Sub-Sub-Type tags, shown to everyone */}
        {(product.subcategory?.length || subSubLabels.length) ? (
          <div className="flex flex-wrap gap-1">
            {product.subcategory?.map((sub) => (
              <span
                key={`sub-${sub}`}
                className="rounded-full border border-[#dccfae] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#8a6d3b]"
              >
                {sub}
              </span>
            ))}
            {subSubLabels.map((label, i) => (
              <span
                key={`subsub-${label}-${i}`}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-stone-500"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {/* Admin only: file types (tags) available -- reserves space even when empty, per spec */}
        {isAdmin && (
          <div className="flex flex-wrap gap-1 min-h-[1rem]">
            {product.tags && product.tags.length > 0 &&
              product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-stone-200 px-1 py-0.5 text-[9px] uppercase tracking-wider text-stone-500"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}
        <p className="font-serif text-sm text-[#8a6d3b]">
          {formatPrice(product.price, currency, rate)}
        </p>
        {/* Admin only: Display and Category, stacked underneath each other */}
        {isAdmin && (
          <div className="space-y-0.5 border-t border-stone-100 pt-2 text-[10px] uppercase tracking-wider text-stone-400">
            <p>Display: {displayLabel}</p>
            <p>Category: {product.category || '—'}</p>
          </div>
        )}
        {/* Spacer absorbs leftover height so the button always sits at the same bottom position */}
        <div className="flex-1" />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="mt-1 w-full rounded-full bg-stone-900 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[#b08d57] disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
