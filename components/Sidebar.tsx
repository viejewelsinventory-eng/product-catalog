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
type SubGroup = { total: number; subsubs: Record<string, number> }
type TypeGroup = { total: number; subs: Record<string, SubGroup> }

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
        const groups: Record<string, TypeGroup> = {}
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
      {hasActiveFilters &&
