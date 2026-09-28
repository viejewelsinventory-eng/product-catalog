'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'
import ProductDetailModal from './ProductDetailModal'
import { fetchAllSkus, fetchFilteredSkus, downloadSkusAsExcel } from '@/lib/exportSkus'
// 100 divides evenly into the 2-, 4- and 5-column layouts, so the last row
// of a page is never left partially filled.
const PAGE_SIZE = 100
export type ActiveFilters = {
  category: string | null
  types: string[]
  subcategories: string[]
  subsubcategories: string[]
  tags: string[]
  minPrice: number | null
  maxPrice: number | null
  visibility: string | null
  noImageOnly: boolean
}
export type SortOption = 'newest' | 'sku_asc' | 'price_asc' | 'price_desc'

const OUTLINE_BUTTON =
  'rounded-full border border-stone-300 bg-white text-stone-800 text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 hover:border-[#b08d57] hover:text-[#8a6d3b] disabled:opacity-50'

// Returns 0-indexed page numbers with gaps collapsed to ellipses, e.g.
// 1 ... 4 5 6 ... 1760. With ~176K SKUs there are well over a thousand
// pages, so showing every number is not an option.
function getPageNumbers(
  current: number,
  total: number
): (number | 'gap-left' | 'gap-right')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  let start = Math.max(1, current - 1)
  let end = Math.min(total - 2, current + 1)
  if (current <= 2) end = Math.min(total - 2, 3)
  if (current >= total - 3) start = Math.max(1, total - 4)
  const pages: (number | 'gap-left' | 'gap-right')[] = [0]
  if (start > 1) pages.push('gap-left')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 2) pages.push('gap-right')
  pages.push(total - 1)
  return pages
}

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
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadingFiltered, setDownloadingFiltered] = useState(false)

  // Page resets to the first page automatically whenever filters, search or
  // sort change: the stored page only counts while its key matches the
  // current filter key, otherwise we are back on page 0 (no double fetch).
  const filterKey = JSON.stringify([filters, search, sortBy, isAdmin])
  const [pageState, setPageState] = useState({ key: filterKey, page: 0 })
  const page = pageState.key === filterKey ? pageState.page : 0

  const buildQuery = useCallback(
    (pageIndex: number) => {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1)
      switch (sortBy) {
        case 'sku_asc':
          // sku_sort_key is a generated column (letter prefix + zero-padded
          // numeric suffix) so VPD1001 sorts before VPD10000 correctly --
          // ordering by the raw sku column sorts lexicographically and
          // puts VPD10000 before VPD1001.
          query = query.order('sku_sort_key', { ascending: true })
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
        // subcategory is text[] (a product can belong to multiple
        // sub-types), so match if it shares ANY selected sub-type.
        query = query.overlaps('subcategory', filters.subcategories)
      }
      if (filters.subsubcategories.length > 0) {
        // subsubcategory stores composite "SubType::SubSubType" values,
        // so matching stays scoped to the exact parent Sub-Type -- the
        // same Sub-Sub-Type name reused under a different Sub-Type never
        // cross-matches here.
        query = query.overlaps('subsubcategory', filters.subsubcategories)
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
      if (!isAdmin) {
        // Registered/public users should never see "Photo Missing" items --
        // only admins see those, so they know what still needs a photo.
        // Once an image is matched (drive_file_id populated), the product
        // becomes visible here automatically.
        query = query.not('drive_file_id', 'is', null).neq('drive_file_id', '')
      }
      return query
    },
    [filters, search, sortBy, supabase, isAdmin]
  )

  // Fetch whenever the filters, search, sort or page change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    buildQuery(page).then(({ data, error, count }) => {
      if (cancelled) return
      if (error) {
        console.error('Failed to load products:', error)
        setProducts([])
        setTotalCount(0)
      } else {
        setProducts(data ?? [])
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [buildQuery, page])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const goToPage = (target: number) => {
    if (target < 0 || target >= totalPages || target === page) return
    setPageState({ key: filterKey, page: target })
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        search,
        category: filters.category,
        types: filters.types,
        subcategories: filters.subcategories,
        subsubcategories: filters.subsubcategories,
        tags: filters.tags,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        visibility: filters.visibility,
        noImageOnly: filters.noImageOnly,
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

  const rangeStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalCount)

  return (
    <div className="flex-1 rounded-3xl bg-[#faf8f5] p-3 sm:p-4 lg:p-5">
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className={`${OUTLINE_BUTTON} px-6 py-3`}
          >
            {downloadingAll ? 'Preparing file...' : 'Download All SKUs (Excel)'}
          </button>
          <button
            onClick={handleDownloadFiltered}
            disabled={downloadingFiltered}
            className={`${OUTLINE_BUTTON} px-6 py-3`}
          >
            {downloadingFiltered ? 'Preparing file...' : 'Download Filtered SKUs (Excel)'}
          </button>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-40 font-serif text-xs uppercase tracking-[0.35em] text-stone-400">
          Loading collection...
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center py-40 font-serif text-base tracking-widest text-stone-400">
          No pieces match your filters.
        </div>
      ) : (
        <>
          <p className="mb-4 px-1 text-[11px] uppercase tracking-[0.25em] text-stone-400">
            Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{' '}
            {totalCount.toLocaleString()} pieces
          </p>

          {/* 2 columns on phones, 4 on tablets, 5 on desktop */}
          <div
            className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 transition-opacity duration-300 ${
              loading ? 'opacity-40 pointer-events-none' : 'opacity-100'
            }`}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdmin={isAdmin}
                onOpen={() => setSelectedProduct(product)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex flex-wrap items-center justify-center gap-2"
            >
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 0 || loading}
                className={`${OUTLINE_BUTTON} px-5 py-2.5`}
              >
                Previous
              </button>

              {getPageNumbers(page, totalPages).map((entry) =>
                typeof entry === 'string' ? (
                  <span key={entry} className="px-1 text-stone-400">
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    onClick={() => goToPage(entry)}
                    disabled={loading}
                    aria-current={entry === page ? 'page' : undefined}
                    className={`h-10 min-w-[2.5rem] rounded-full px-3 text-sm transition-colors duration-300 ${
                      entry === page
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-white hover:text-[#8a6d3b]'
                    }`}
                  >
                    {(entry + 1).toLocaleString()}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className={`${OUTLINE_BUTTON} px-5 py-2.5`}
              >
                Next
              </button>
            </nav>
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
