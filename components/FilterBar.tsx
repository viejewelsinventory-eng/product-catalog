'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
type FilterBarProps = {
  selectedBrand: string | null
  onBrandChange: (value: string | null) => void
}
export default function FilterBar({
  selectedBrand,
  onBrandChange,
}: FilterBarProps) {
  const supabase = createClient()
  const [brands, setBrands] = useState<string[]>([])
  useEffect(() => {
    const loadOptions = async () => {
      const { data: brandData } = await supabase.rpc('get_distinct_brands')
      if (brandData) {
        setBrands(brandData.map((row: { brand: string }) => row.brand))
      }
    }
    loadOptions()
  }, [supabase])
  return (
    <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4">
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
      {selectedBrand && (
        <button
          onClick={() => onBrandChange(null)}
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
