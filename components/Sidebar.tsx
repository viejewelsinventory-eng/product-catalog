'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFileTypeLabel } from '@/lib/fileTypes'

export type SidebarFilters = {
  types: string[]
  subcategories: string[]
  subsubcategories: string[]
  tags: string[]
  minPrice: number | null
  maxPrice: number | null
  category: string | null
  visibility: string | null
  noImageOnly: boolean
}

type SidebarProps = {
  isAdmin: boolean
  selectedTypes: string[]
  selectedSubcategories: string[]
  selectedSubsubcategories: string[]
  selectedTags: string[]
  minPrice: number | null
  maxPrice: number | null
  selectedCategory: string | null
  selectedVisibility: string | null
  noImageOnly: boolean
  onTypesChange: (values: string[]) => void
  onSubcategoriesChange: (values: string[]) => void
  onSubsubcategoriesChange: (values: string[]) => void
  onTagsChange: (values: string[]) => void
  onPriceChange: (min: number | null, max: number | null) => void
  onCategoryChange: (value: string | null) => void
  onVisibilityChange: (value: string | null) => void
  onNoImageOnlyChange: (value: boolean) => void
}

type SubSubInfo = { name: string; count: number }
type SubcategoryInfo = { name: string; count: number; subsubs: SubSubInfo[] }
type TypeGroupInfo = { total: number; subs: SubcategoryInfo[] }

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
  selectedSubsubcategories,
  selectedTags,
  minPrice,
  maxPrice,
  selectedCategory,
  selectedVisibility,
  noImageOnly,
  onTypesChange,
  onSubcategoriesChange,
  onSubsubcategoriesChange,
  onTagsChange,
  onPriceChange,
  onCategoryChange,
  onVisibilityChange,
  onNoImageOnlyChange,
}: SidebarProps) {
  const supabase = createClient()
  const [typeGroups, setTypeGroups] = useState<Record<string, TypeGroupInfo>>({})
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<string[]>([])
  const [adminCategories, setAdminCategories] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)

  useEffect(() => {
    const loadTags = async () => {
      const { data: tagData } = await supabase.rpc('get_distinct_tags')
      if (tagData) {
        setAllTags((tagData as { tag: string }[]).map((row) => row.tag))
      }
    }
    loadTags()
  }, [supabase])

  useEffect(() => {
    const loadTypeGroups = async () => {
      const effectiveVisibility = isAdmin ? selectedVisibility : 'registered'
      const { data: typeSubData } = await supabase.rpc('get_type_subcategory_groups', {
        tags_filter: selectedTags.length > 0 ? selectedTags : null,
        min_price: minPrice,
        max_price: maxPrice,
        category_filter: isAdmin ? selectedCategory : null,
        visibility_filter: effectiveVisibility,
        types_filter: selectedTypes.length > 0 ? selectedTypes : null,
        subcategories_filter: selectedSubcategories.length > 0 ? selectedSubcategories : null,
        no_image_only: isAdmin ? noImageOnly : false,
        search_filter: null,
        require_image: !isAdmin,
        subsubcategories_filter: selectedSubsubcategories.length > 0 ? selectedSubsubcategories : null,
      })

      if (typeSubData) {
        const groups: Record
          string,
          { total: number; subs: Record<string, { total: number; subsubs: Record<string, number> }> }
        > = {}
        for (const row of typeSubData as {
          type: string
          subcategory: string | null
          subsubcategory: string | null
          product_count: number
        }[]) {
          if (!row.type) continue
          if (!groups[row.type]) groups[row.type] = { total: 0, subs: {} }
          groups[row.type].total += Number(row.product_count)
          if (row.subcategory) {
            if (!groups[row.type].subs[row.subcategory]) {
              groups[row.type].subs[row.subcategory] = { total: 0, subsubs: {} }
            }
            groups[row.type].subs[row.subcategory].total += Number(row.product_count)
            if (row.subsubcategory) {
              groups[row.type].subs[row.subcategory].subsubs[row.subsubcategory] =
                (groups[row.type].subs[row.subcategory].subsubs[row.subsubcategory] || 0) +
                Number(row.product_count)
            }
          }
        }
        const sortedGroups: Record<string, TypeGroupInfo> = {}
        Object.keys(groups)
          .sort()
          .forEach((type) => {
            const subsArr: SubcategoryInfo[] = Object.entries(groups[type].subs)
              .map(([name, info]) => ({
                name,
                count: info.total,
                subsubs: Object.entries(info.subsubs)
                  .map(([subName, count]) => ({ name: subName, count }))
                  .sort((a, b) => a.name.localeCompare(b.name)),
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
            sortedGroups[type] = { total: groups[type].total, subs: subsArr }
          })
        setTypeGroups(sortedGroups)
      }
    }

    loadTypeGroups()
  }, [
    supabase,
    isAdmin,
    selectedTypes,
    selectedSubcategories,
    selectedSubsubcategories,
    selectedTags,
    minPrice,
    maxPrice,
    selectedCategory,
    selectedVisibility,
    noImageOnly,
  ])

  useEffect(() => {
    if (!isAdmin) return
    const loadTotalCount = async () => {
      const { data, error } = await supabase.rpc('get_filtered_product_count', {
        p_search: null,
        p_category: selectedCategory,
        p_types: selectedTypes.length > 0 ? selectedTypes : null,
        p_subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : null,
        p_tags: selectedTags.length > 0 ? selectedTags : null,
        p_min_price: minPrice,
        p_max_price: maxPrice,
        p_visibility: selectedVisibility,
        p_no_image_only: noImageOnly,
        p_subsubcategories: selectedSubsubcategories.length > 0 ? selectedSubsubcategories : null,
      })
      if (!error && typeof data === 'number') {
        setTotalCount(data)
      }
    }
    loadTotalCount()
  }, [
    supabase,
    isAdmin,
    selectedTypes,
    selectedSubcategories,
    selectedSubsubcategories,
    selectedTags,
    minPrice,
    maxPrice,
    selectedCategory,
    selectedVisibility,
    noImageOnly,
  ])

  useEffect(() => {
    if (!isAdmin) return
    const loadCategories = async () => {
      const { data } = await supabase.rpc('get_distinct_categories', {
        visibility_filter: selectedVisibility || null,
      })
      if (data) {
        const cats = (data as { category: string }[]).map((row) => row.category)
        setAdminCategories(cats)
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

  const toggleSubExpanded = (key: string) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
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

  const toggleSubsubcategory = (composite: string) => {
    if (selectedSubsubcategories.includes(composite)) {
      onSubsubcategoriesChange(selectedSubsubcategories.filter((v) => v !== composite))
    } else {
      onSubsubcategoriesChange([...selectedSubsubcategories, composite])
    }
  }

  const toggleTag = (value: string) => {
    if (selectedTags.includes(value)) {
      onTagsChange(selectedTags.filter((v) => v !== value))
    } else {
      onTagsChange([...selectedTags, value])
    }
  }

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedSubsubcategories.length > 0 ||
    selectedTags.length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    (isAdmin && (selectedCategory !== null || selectedVisibility !== null || noImageOnly))

  const clearAllFilters = () => {
    onTypesChange([])
    onSubcategoriesChange([])
    onSubsubcategoriesChange([])
    onTagsChange([])
    onPriceChange(null, null)
    if (isAdmin) {
      onCategoryChange(null)
      onVisibilityChange(null)
      onNoImageOnlyChange(false)
    }
  }

  return (
    <aside className="w-full lg:w-56 flex-shrink-0 space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full rounded-full border border-stone-300 bg-white px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-stone-700 transition-colors duration-300 hover:border-[#b08d57] hover:text-[#8a6d3b]"
        >
          Clear All Filters
        </button>
      )}

      {Object.keys(typeGroups).length > 0 && (
        <div className="rounded-2xl border border-stone-200/70 bg-white p-4">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
            Type
          </h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {Object.entries(typeGroups).map(([type, info]) => {
              const isExpanded = expandedTypes.has(type)
              return (
                <div key={type} className="border-b border-stone-100 last:border-0 pb-1">
                  <div className="flex items-center gap-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(type)}
                      className="w-4 text-xs text-stone-400 hover:text-stone-700"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {info.subs.length > 0 ? (isExpanded ? '▾' : '▸') : ''}
                    </button>
                    <label className="flex flex-1 cursor-pointer items-center gap-2 text-xs text-stone-800">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleType(type)}
                        className="accent-stone-900"
                      />
                      <span className="flex-1">{type}</span>
                      <span className="text-[10px] text-stone-400">({info.total})</span>
                    </label>
                  </div>

                  {isExpanded && info.subs.length > 0 && (
                    <div className="ml-6 space-y-1 mt-1">
                      {info.subs.map((sub) => {
                        const subKey = `${type}::${sub.name}`
                        const subExpanded = expandedSubcategories.has(subKey)
                        return (
                          <div key={sub.name}>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleSubExpanded(subKey)}
                                className="w-3 text-[10px] text-stone-400 hover:text-stone-700"
                                aria-label={subExpanded ? 'Collapse' : 'Expand'}
                              >
                                {sub.subsubs.length > 0 ? (subExpanded ? '▾' : '▸') : ''}
                              </button>
                              <label className="flex flex-1 cursor-pointer items-center gap-2 text-xs text-stone-600">
                                <input
                                  type="checkbox"
                                  checked={selectedSubcategories.includes(sub.name)}
                                  onChange={() => toggleSubcategory(sub.name)}
                                  className="accent-stone-900"
                                />
                                <span className="flex-1">{sub.name}</span>
                                <span className="text-[10px] text-stone-400">({sub.count})</span>
                              </label>
                            </div>

                            {subExpanded && sub.subsubs.length > 0 && (
                              <div className="ml-6 space-y-1 mt-1">
                                {sub.subsubs.map((subsub) => {
                                  const composite = `${sub.name}::${subsub.name}`
                                  return (
                                    <label
                                      key={composite}
                                      className="flex cursor-pointer items-center gap-2 text-xs text-stone-500"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedSubsubcategories.includes(composite)}
                                        onChange={() => toggleSubsubcategory(composite)}
                                        className="accent-stone-900"
                                      />
                                      <span className="flex-1">{subsub.name}</span>
                                      <span className="text-[10px] text-stone-400">({subsub.count})</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="rounded-2xl border border-stone-200/70 bg-white p-4">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
            File Types
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors duration-300 ${
                    active
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-300 bg-white text-stone-700 hover:border-[#b08d57]'
                  }`}
                >
                  {getFileTypeLabel(tag)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-900">
              Admin Filters
            </h3>
            <span className="text-[11px] font-medium text-amber-800">
              Total: {totalCount}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-amber-800">
              Display
            </label>
            <select
              value={selectedVisibility ?? ''}
              onChange={(e) => onVisibilityChange(e.target.value || null)}
              className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <label className="mb-1 block text-[11px] font-medium text-amber-800">
              Category
            </label>
            <select
              value={selectedCategory ?? ''}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Categories</option>
