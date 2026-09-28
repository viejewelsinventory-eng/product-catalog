'use client'
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ProductGrid, { type ActiveFilters, type SortOption } from './ProductGrid'
import AdminCurrencyRateBox from './AdminCurrencyRateBox'
import AdminPriceIssuesPanel from './AdminPriceIssuesPanel'
import type { Profile } from '@/lib/types'
export default function HomeClient({ profile }: { profile: Profile | null }) {
  const [types, setTypes] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [subsubcategories, setSubsubcategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  // Admin-only filters
  const [category, setCategory] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<string | null>(null)
  const [noImageOnly, setNoImageOnly] = useState(false)
  // Search + sort
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const isAdmin = profile?.is_admin ?? false
  const filters: ActiveFilters = {
    category: isAdmin ? category : null,
    types,
    subcategories,
    subsubcategories,
    tags,
    minPrice,
    maxPrice,
    visibility: isAdmin ? visibility : 'registered',
    noImageOnly: isAdmin ? noImageOnly : false,
  }
  const handlePriceChange = (min: number | null, max: number | null) => {
    setMinPrice(min)
    setMaxPrice(max)
  }
  return (
    <div className="min-h-screen bg-white">
      <Navbar
        profile={profile}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      {isAdmin && <AdminCurrencyRateBox />}
      {isAdmin && <AdminPriceIssuesPanel />}
      {/* Wide container (no max-w-7xl cap) with tight side padding so the
          sidebar sits near the left edge and the grid gets the rest */}
      <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-4 lg:px-5 py-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          <Sidebar
            isAdmin={isAdmin}
            selectedTypes={types}
            selectedSubcategories={subcategories}
            selectedSubsubcategories={subsubcategories}
            selectedTags={tags}
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedCategory={category}
            selectedVisibility={visibility}
            noImageOnly={noImageOnly}
            onTypesChange={setTypes}
            onSubcategoriesChange={setSubcategories}
            onSubsubcategoriesChange={setSubsubcategories}
            onTagsChange={setTags}
            onPriceChange={handlePriceChange}
            onCategoryChange={setCategory}
            onVisibilityChange={setVisibility}
            onNoImageOnlyChange={setNoImageOnly}
          />
          <ProductGrid
            filters={filters}
            isAdmin={isAdmin}
            search={search}
            sortBy={sortBy}
          />
        </div>
      </div>
    </div>
  )
}
