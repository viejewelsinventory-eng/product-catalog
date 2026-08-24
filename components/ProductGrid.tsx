'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'
import ProductDetailModal from './ProductDetailModal'
import { fetchAllSkus, fetchFilteredSkus, downloadSkusAsExcel } from '@/lib/exportSkus'
const PAGE_SIZE = 50
export type ActiveFilters = {
  category: string | null
  types: string[]
  subcategories: string[]
  tags: string[]
  minPrice: number | null
  maxPrice: number | null
  visibility: string | null
  noImageOnly: boolean
}
export type SortOption = 'newest' | 'sku_asc' | 'price_asc' | 'price_desc'
export default function ProductGrid({
  filters,
  isAdmin,
  search,
  sortBy,
}: {
  filters: ActiveFilters
  isAdmin: boolean
  search: string
  sortBy: SortOption
}) {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadingFiltered, setDownloadingFiltered] = useState(false)
  const buildQuery = useCallback(
    (pageIndex: number) => {
      let query = supabase
        .from('products')
        .select('*')
        .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1)
      switch (sortBy) {
        case 'sku_asc':
          query = query.order('sku', { ascending: true })
          break
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }
      if (search.trim()) {
        query = query.ilike('sku', `%${search.trim()}%`)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
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
      if (filters.noImageOnly) {
        query = query.or('drive_file_id.is.null,drive_file_id.eq.')
      }
      return query
    },
    [filters, search, sortBy, supabase]
  )
  // Reset and refetch whenever filters, search, or sort change
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
  const handleDownloadAll = async () => {
    setDownloadingAll(true)
    try {
      const skus = await fetchAllSkus(supabase)
      downloadSkusAsExcel(skus, `all-skus-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      console.error('Failed to download all SKUs:', err)
    } finally {
      setDownloadingAll(false)
    }
  }
  const handleDownloadFiltered = async () => {
    setDownloadingFiltered(true)
    try {
      const skus = await fetchFilteredSkus(supabase, {
        category: filters.category,
        visibility: filters.visibility,
      })
      downloadSkusAsExcel(
        skus,
        `filtered-skus-${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (err) {
      console.error('Failed to download filtered SKUs:', err)
    } finally {
      setDownloadingFiltered(false)
    }
  }
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
        Loading products...
      </div>
    )
  }
  return (
    <div className="flex-1">
      {isAdmin && (
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {downloadingAll ? 'Preparing file...' : 'Download All SKUs (Excel)'}
          </button>
          <button
            onClick={handleDownloadFiltered}
            disabled={downloadingFiltered}
            className="bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {downloadingFiltered ? 'Preparing file...' : 'Download Filtered SKUs (Excel)'}
          </button>
        </div>
      )}
      {products.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
          No products match your filters.
        </div>
      ) : (
        <>
          {/* Capped at 4 columns, no 5-column tier */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdmin={isAdmin}
                onOpen={() => setSelectedProduct(product)}
              />
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
        </>
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
