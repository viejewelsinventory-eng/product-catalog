'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { getProductImageUrl } from '@/lib/types'
import { formatUSD } from '@/lib/currency'
import { FILE_TYPE_LABELS } from '@/lib/fileTypes'
export default function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const isBlank = product.visibility === 'blank'
  const imageUrl = getProductImageUrl(product.drive_file_id)
  const displaySrc = isBlank ? '/blank.jpg' : imgError ? '/photo-missing.jpg' : imageUrl
  const availableTags = new Set(product.tags ?? [])
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bigger image. Blank overrides everything; otherwise fall back to photo-missing on load error */}
        <div className="relative w-full md:w-1/2 aspect-square bg-gray-100 flex-shrink-0">
          <Image
            src={displaySrc}
            alt={product.sku}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            onError={() => {
              if (!isBlank) setImgError(true)
            }}
            unoptimized
          />
        </div>
        {/* Details */}
        <div className="p-6 flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-gray-900">{product.sku}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <p className="text-gray-700">{formatUSD(product.price)}</p>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              File types available
            </h3>
            <ul className="space-y-1">
              {FILE_TYPE_LABELS.map(({ tag, label }) => {
                const available = availableTags.has(tag)
                return (
                  <li
                    key={tag}
                    className={`text-sm flex items-center gap-2 ${
                      available ? 'text-gray-900' : 'text-gray-300'
                    }`}
                  >
                    <span>{available ? '✓' : '✕'}</span>
                    {label}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
