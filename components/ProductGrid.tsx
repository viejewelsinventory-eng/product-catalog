'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'
const PAGE_SIZE = 50
export type ActiveFilters = {
  category: string | null
  brand: string | null
  types: string[]
  subcategories: string[]
  tags: string[]
  minPrice: number | null
  maxPrice: number | null
  visibility: string | null
}
export default function ProductGrid({
  filters,
}: {
  filters: ActiveFilters
}) {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const buildQuery = useCallback(
    (pageIndex: number) => {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1)
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand)
      }
      if (filters.types.length > 0) {
        query = query.in('type', filters.types)
      }
      if (filters.subcategories.length > 0) {
        query = query.in('subcategory', filters.subcategories)
      }
      if (filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      if (filters.minPrice !== null) {
        query = query.gte('price', filters.minPrice)
      }
      if (filters.maxPrice !== null) {
        query = query.lte('price', filters.maxPrice)
      }
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility)
      }
      return query
    },
    [filters, supabase]
  )
  // Reset and refetch whenever filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPage(0)
    setHasMore(true)
    buildQuery(0).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('Failed to load products:', error)
        setProducts([])
      } else {
        setProducts(data ?? [])
        setHasMore((data?.length ?? 0) === PAGE_SIZE)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [buildQuery])
  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    const { data, error } = await buildQuery(nextPage)
    if (error) {
      console.error('Failed to load more products:', error)
    } else {
      setProducts((prev) => [...prev, ...(data ?? [])])
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      setPage(nextPage)
    }
    setLoadingMore(false)
  }
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
        Loading products...
      </div>
    )
  }
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
        No products match your filters.
      </div>
    )
  }
  return (
    <div className="flex-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-white border border-gray-300 text-gray-900 rounded-md px-6 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
