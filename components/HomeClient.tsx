'use client'
import { useState } from 'react'
import Navbar from './Navbar'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'
import ProductGrid, { type ActiveFilters } from './ProductGrid'
import type { Profile } from '@/lib/types'
export default function HomeClient({ profile }: { profile: Profile | null }) {
  const [category, setCategory] = useState<string | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [types, setTypes] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const filters: ActiveFilters = {
    category,
    brand,
    types,
    subcategories,
    tags,
    minPrice,
    maxPrice,
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <FilterBar
          selectedCategory={category}
          selectedBrand={brand}
          onCategoryChange={setCategory}
          onBrandChange={setBrand}
        />
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar
            isAdmin={profile?.is_admin ?? false}
            selectedTypes={types}
            selectedSubcategories={subcategories}
            selectedTags={tags}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onTypesChange={setTypes}
            onSubcategoriesChange={setSubcategories}
            onTagsChange={setTags}
            onPriceChange={(min, max) => {
              setMinPrice(min)
              setMaxPrice(max)
            }}
          />
          <ProductGrid filters={filters} />
        </div>
      </div>
    </div>
  )
}
