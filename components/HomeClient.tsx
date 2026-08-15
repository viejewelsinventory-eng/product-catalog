'use client'
import { useState } from 'react'
import Navbar from './Navbar'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'
import ProductGrid, { type ActiveFilters } from './ProductGrid'
import type { Profile } from '@/lib/types'
export default function HomeClient({ profile }: { profile: Profile | null }) {
  const [brand, setBrand] = useState<string | null>(null)
  const [types, setTypes] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  // Admin-only filters
  const [category, setCategory] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<string | null>(null)

  const isAdmin = profile?.is_admin ?? false

  const filters: ActiveFilters = {
    category: isAdmin ? category : null,
    brand,
    types,
    subcategories,
    tags,
    minPrice,
    maxPrice,
    visibility: isAdmin ? visibility : null,
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <FilterBar
          selectedBrand={brand}
          onBrandChange={setBrand}
        />
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar
            isAdmin={isAdmin}
            selectedTypes={types}
            selectedSubcategories={subcategories}
            selectedTags={tags}
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedCategory={category}
            selectedVisibility={visibility}
            onTypesChange={setTypes}
            onSubcategoriesChange={setSubcategories}
            onTagsChange={setTags}
            onPriceChange={(min, max) => {
              setMinPrice(min)
              setMaxPrice(max)
            }}
            onCategoryChange={setCategory}
            onVisibilityChange={setVisibility}
          />
          <ProductGrid filters={filters} />
        </div>
      </div>
    </div>
  )
}
