'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SidebarFilters = {
  types: string[]
  subcategories: string[]
  tags: string[]
  minPrice: number | null
  maxPrice: number | null
  category: string | null
  visibility: string | null
}

type SidebarProps = {
  isAdmin: boolean
  selectedTypes: string[]
  selectedSubcategories: string[]
  selectedTags: string[]
  minPrice: number | null
  maxPrice: number | null
  selectedCategory: string | null
  selectedVisibility: string | null
  onTypesChange: (values: string[]) => void
  onSubcategoriesChange: (values: string[]) => void
  onTagsChange: (values: string[]) => void
  onPriceChange: (min: number | null, max: number | null) => void
  onCategoryChange: (value: string | null) => void
  onVisibilityChange: (value: string | null) => void
}

type TypeGroupInfo = {
  total: number
  subs: { name: string; count: number }[]
}

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin', label: 'Admin Only' },
  { value: 'registered', label: 'Registered User' },
  { value: 'public', label: 'Main Website' },
  { value: 'blank', label: 'Blank' },
]

export default function Sidebar({
  isAdmin,
  selectedTypes,
  selectedSubcategories,
  selectedTags,
  minPrice,
  maxPrice,
  selectedCategory,
  selectedVisibility,
  onTypesChange,
  onSubcategoriesChange,
  onTagsChange,
  onPriceChange,
  onCategoryChange,
  onVisibilityChange,
}: SidebarProps) {
  const supabase = createClient()
  const [typeGroups, setTypeGroups] = useState<Record<string, TypeGroupInfo>>({})
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<string[]>([])
  const [adminCategories, setAdminCategories] = useState<string[]>([])

  // File Types list (fixed set of available tag options) -- loaded once
  useEffect(() => {
    const loadTags = async () => {
      const { data: tagData } = await supabase.rpc('get_distinct_tags')
      if (tagData) {
        setAllTags((tagData as { tag: string }[]).map((row) => row.tag))
      }
    }
    loadTags()
  }, [supabase])

  // Type / Sub-type counts -- reloads any time File Types, price, or the
  // admin Category/Display filters change, so counts always reflect what's
  // currently filtered. Non-admin viewers are implicitly scoped to
  // visibility = 'registered', matching what ProductGrid actually queries.
  useEffect(() => {
    const loadTypeGroups = async () => {
      const effectiveVisibility = isAdmin ? selectedVisibility : 'registered'
      const { data: typeSubData } = await supabase.rpc('get_type_subcategory_groups', {
        tags_filter: selectedTags.length > 0 ? selectedTags : null,
        min_price: minPrice,
        max_price: maxPrice,
        category_filter: isAdmin ? selectedCategory : null,
        visibility_filter: effectiveVisibility,
      })

      if (typeSubData) {
        const groups: Record<string, { total: number; subs: Record<string, number> }> = {}
        for (const row of typeSubData as {
          type: string
          subcategory: string | null
          product_count: number
        }[]) {
          if (!row.type) continue
          if (!groups[row.type]) groups[row.type] = { total: 0, subs: {} }
          groups[row.type].total += Number(row.product_count)
          if (row.subcategory) {
            groups[row.type].subs[row.subcategory] =
              (groups[row.type].subs[row.subcategory] || 0) + Number(row.product_count)
          }
        }
        const sortedGroups: Record<string, TypeGroupInfo> = {}
        Object.keys(groups)
          .sort()
          .forEach((type) => {
            const subsArr = Object.entries(groups[type].subs)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => a.name.localeCompare(b.name))
            sortedGroups[type] = { total: groups[type].total, subs: subsArr }
          })
        setTypeGroups(sortedGroups)
      }
    }

    loadTypeGroups()
  }, [supabase, isAdmin, selectedTags, minPrice, maxPrice, selectedCategory, selectedVisibility])

  // Admin-only: load category options, filtered by the selected Display
  // value so only categories that actually exist for that tier show up.
  useEffect(() => {
    if (!isAdmin) return
    const loadCategories = async () => {
      const { data } = await supabase.rpc('get_distinct_categories', {
        visibility_filter: selectedVisibility || null,
      })
      if (data) {
        const cats = (data as { category: string }[]).map((row) => row.category)
        setAdminCategories(cats)
        // If the currently selected category no longer applies under the
        // new Display filter, clear it rather than leaving a stale/invalid combo.
        if (selectedCategory && !cats.includes(selectedCategory)) {
          onCategoryChange(null)
        }
      }
    }
    loadCategories()
  }, [isAdmin, selectedVisibility, supabase])

  const toggleExpanded = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((v) => v !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

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

  // Grand total across all types under current filters -- admin-only
  const grandTotal = Object.values(typeGroups).reduce((sum, info) => sum + info.total, 0)

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedTags.length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    (isAdmin && (selectedCategory !== null || selectedVisibility !== null))

  const clearAllFilters = () => {
    onTypesChange([])
    onSubcategoriesChange([])
    onTagsChange([])
    onPriceChange(null, null)
    if (isAdmin) {
      onCategoryChange(null)
      onVisibilityChange(null)
    }
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-4 py-2 bg-white hover:bg-gray-50"
        >
          Clear All Filters
        </button>
      )}

      {/* Type -> Sub-type (nested), with live product counts */}
      {Object.keys(typeGroups).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Type</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {Object.entries(typeGroups).map(([type, info]) => {
              const isExpanded = expandedTypes.has(type)
              return (
                <div key={type} className="border-b border-gray-100 last:border-0 pb-1">
                  <div className="flex items-center gap-2 py-1">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(type)}
                      className="text-gray-400 hover:text-gray-700 w-4 text-xs"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {info.subs.length > 0 ? (isExpanded ? '▾' : '▸') : ''}
                    </button>
                    <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleType(type)}
                        className="accent-gray-900"
                      />
                      <span className="flex-1">{type}</span>
                      <span className="text-xs text-gray-400">({info.total})</span>
                    </label>
                  </div>

                  {isExpanded && info.subs.length > 0 && (
                    <div className="ml-8 space-y-1 mt-1">
                      {info.subs.map((sub) => (
                        <label
                          key={sub.name}
                          className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubcategories.includes(sub.name)}
                            onChange={() => toggleSubcategory(sub.name)}
                            className="accent-gray-900"
                          />
                          <span className="flex-1">{sub.name}</span>
                          <span className="text-xs text-gray-400">({sub.count})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* File Types (formerly "Tags") */}
      {allTags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">File Types</h3>
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

      {/* Admin-only filters: grand total, Category + Display/visibility */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-900">
              Admin Filters
            </h3>
            <span className="text-xs font-medium text-amber-800">
              Total: {grandTotal}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">
              Display
            </label>
            <select
              value={selectedVisibility ?? ''}
              onChange={(e) => onVisibilityChange(e.target.value || null)}
              className="w-full text-sm border border-amber-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All</option>
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">
              Category
            </label>
            <select
              value={selectedCategory ?? ''}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              className="w-full text-sm border border-amber-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Categories</option>
              {adminCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </aside>
  )
}
