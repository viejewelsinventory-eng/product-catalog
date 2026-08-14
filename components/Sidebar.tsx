'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SidebarFilters = {
  subcategories: string[]
  tags: string[]
  minPrice: number | null
  maxPrice: number | null
}

type SidebarProps = {
  isAdmin: boolean
  selectedSubcategories: string[]
  selectedTags: string[]
  minPrice: number | null
  maxPrice: number | null
  onSubcategoriesChange: (values: string[]) => void
  onTagsChange: (values: string[]) => void
  onPriceChange: (min: number | null, max: number | null) => void
}

const DEFAULT_MAX_PRICE = 1000

export default function Sidebar({
  isAdmin,
  selectedSubcategories,
  selectedTags,
  minPrice,
  maxPrice,
  onSubcategoriesChange,
  onTagsChange,
  onPriceChange,
}: SidebarProps) {
  const supabase = createClient()
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [sliderValue, setSliderValue] = useState(maxPrice ?? DEFAULT_MAX_PRICE)

  useEffect(() => {
    const loadOptions = async () => {
      const { data: subcatData } = await supabase
        .from('products')
        .select('subcategory')
        .not('subcategory', 'is', null)

      if (subcatData) {
        const unique = Array.from(
          new Set(subcatData.map((row) => row.subcategory as string))
        ).sort()
        setSubcategories(unique)
      }

      const { data: tagData } = await supabase
        .from('products')
        .select('tags')
        .not('tags', 'is', null)

      if (tagData) {
        const flatTags = tagData.flatMap((row) => (row.tags as string[]) ?? [])
        const unique = Array.from(new Set(flatTags)).sort()
        setAllTags(unique)
      }
    }

    loadOptions()
  }, [supabase])

  const toggleSubcategory = (value: string) => {
    if (selectedSubcategories.includes(value)) {
      onSubcategoriesChange(selectedSubcategories.filter((v) => v !== value))
    } else {
      onSubcategoriesChange([...selectedSubcategories, value])
    }
  }

  const toggleTag = (value: string) => {
    if (selectedTags.includes(value)) {
      onTagsChange(selectedTags.filter((v) => v !== value))
    } else {
      onTagsChange([...selectedTags, value])
    }
  }

  const handleSliderChange = (value: number) => {
    setSliderValue(value)
    onPriceChange(null, value)
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
      {/* Price range */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Price Range
        </h3>
        <input
          type="range"
          min={0}
          max={DEFAULT_MAX_PRICE}
          step={5}
          value={sliderValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full accent-gray-900"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>Up to ${sliderValue}</span>
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Subcategory
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {subcategories.map((sub) => (
              <label
                key={sub}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSubcategories.includes(sub)}
                  onChange={() => toggleSubcategory(sub)}
                  className="accent-gray-900"
                />
                {sub}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin-only hidden filters */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            Admin Filters
          </h3>
          <p className="text-xs text-amber-700">
            Hidden filter fields will appear here once configured. Tell
            Claude which product fields you want to filter by, and it will
            add the UI here.
          </p>
        </div>
      )}
    </aside>
  )
}
