'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FilterBarProps = {
  selectedCategory: string | null
  selectedBrand: string | null
  onCategoryChange: (value: string | null) => void
  onBrandChange: (value: string | null) => void
}

export default function FilterBar({
  selectedCategory,
  selectedBrand,
  onCategoryChange,
  onBrandChange,
}: FilterBarProps) {
  const supabase = createClient()
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    const loadOptions = async () => {
      const { data: categoryData } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)

      const { data: brandData } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)

      if (categoryData) {
        const uniqueCategories = Array.from(
          new Set(categoryData.map((row) => row.category as string))
        ).sort()
        setCategories(uniqueCategories)
      }

      if (brandData) {
        const uniqueBrands = Array.from(
          new Set(brandData.map((row) => row.brand as string))
        ).sort()
        setBrands(uniqueBrands)
      }
    }

    loadOptions()
  }, [supabase])

  return (
    <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4">
      <select
        value={selectedCategory ?? ''}
        onChange={(e) => onCategoryChange(e.target.value || null)}
        className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        value={selectedBrand ?? ''}
        onChange={(e) => onBrandChange(e.target.value || null)}
        className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="">All Brands</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>

      {(selectedCategory || selectedBrand) && (
        <button
          onClick={() => {
            onCategoryChange(null)
            onBrandChange(null)
          }}
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
