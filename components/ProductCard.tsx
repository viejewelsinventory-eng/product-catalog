'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { getProductImageUrl } from '@/lib/types'
import { useCart } from '@/context/CartContext'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleAdd = async () => {
    setAdding(true)
    await addToCart(product, 1)
    setAdding(false)
  }

  const imageUrl = getProductImageUrl(product.drive_file_id)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col hover:shadow-md transition-shadow">
      <div className="relative w-full aspect-square bg-gray-100">
        {!imgError ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {product.brand ?? 'Unbranded'}
        </p>
        <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2 flex-1">
          {product.name}
        </h3>
        <p className="text-base font-semibold text-gray-900 mt-2">
          ${product.price.toFixed(2)}
        </p>

        <button
          onClick={handleAdd}
          disabled={adding}
          className="mt-3 w-full bg-gray-900 text-white text-sm rounded-md py-2 hover:bg-gray-800 disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
