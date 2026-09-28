'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { getProductImageUrl } from '@/lib/types'
import { formatUSD } from '@/lib/currency'
import { getFileTypeLabel } from '@/lib/fileTypes'
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
  // Only the file types this product actually has -- unavailable ones are not listed
  const availableFileTypes = product.tags ?? []
  // subsubcategory stores composite "SubType::SubSubType" values; show only
  // the Sub-Sub-Type name since the Sub-Type is displayed on its own row.
  const subSubLabels = (product.subsubcategory ?? []).map((value) =>
    value.includes('::') ? value.split('::')[1] : value
  )
  const subTypes = product.subcategory ?? []
  return (
    <div
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-[0_30px_80px_-20px_rgba(28,25,23,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bigger image. Blank overrides everything; otherwise fall back to photo-missing on load error */}
        <div className="p-3 w-full md:w-1/2 flex-shrink-0">
          <div className="relative w-full aspect-square rounded-2xl border border-stone-100 bg-white overflow-hidden">
            <div className="absolute inset-2">
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
          </div>
        </div>
        {/* Details */}
        <div className="flex-1 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-serif text-xl tracking-wide text-stone-900">{product.sku}</h2>
              <p className="mt-1 font-serif text-base text-[#8a6d3b]">{formatUSD(product.price)}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Product classification */}
          <div className="space-y-4 border-t border-stone-100 pt-5">
            <div>
              <h3 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                Product Style
              </h3>
              <p className="text-sm text-stone-800">{product.type || '—'}</p>
            </div>

            <div>
              <h3 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                Sub-Type
              </h3>
              {subTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {subTypes.map((sub) => (
                    <span
                      key={sub}
                      className="rounded-full border border-[#dccfae] px-2.5 py-1 text-[11px] text-[#8a6d3b]"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-800">—</p>
              )}
            </div>

            <div>
              <h3 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                Sub-Sub-Type
              </h3>
              {subSubLabels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {subSubLabels.map((label, i) => (
                    <span
                      key={`${label}-${i}`}
                      className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] text-stone-600"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-800">—</p>
              )}
            </div>
          </div>

          {/* File types: only the ones this product has */}
          <div className="border-t border-stone-100 pt-5">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
              File Types Available
            </h3>
            {availableFileTypes.length > 0 ? (
              <ul className="space-y-1.5">
                {availableFileTypes.map((tag) => (
                  <li key={tag} className="flex items-center gap-2 text-sm text-stone-900">
                    <span className="text-[#b08d57]">✓</span>
                    {getFileTypeLabel(tag)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">None listed</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
