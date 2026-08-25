import type { SupabaseClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

/**
 * Fetch every SKU in the products table, no filters applied.
 * Uses a single server-side RPC call (see create_sku_export_functions.sql)
 * instead of paginating client-side, which is far faster for ~176k rows.
 */
export async function fetchAllSkus(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_all_skus')
  if (error) {
    console.error('Failed to fetch all SKUs:', error)
    return []
  }
  return (data as string[]) ?? []
}

/**
 * Fetch SKUs matching every currently active filter (search, category,
 * types, subcategories, tags, price range, visibility, noImageOnly) --
 * mirrors ProductGrid.tsx's buildQuery() exactly, so the export always
 * matches what's showing on screen.
 *
 * The underlying RPC returns a single text[] column (one row containing
 * the whole array) rather than one row per SKU, so results aren't
 * silently truncated by Supabase's default max-rows limit.
 */
export async function fetchFilteredSkus(
  supabase: SupabaseClient,
  filters: {
    search: string
    category: string | null
    types: string[]
    subcategories: string[]
    tags: string[]
    minPrice: number | null
    maxPrice: number | null
    visibility: string | null
    noImageOnly: boolean
  }
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_filtered_skus', {
    p_search: filters.search || null,
    p_category: filters.category,
    p_types: filters.types.length > 0 ? filters.types : null,
    p_subcategories: filters.subcategories.length > 0 ? filters.subcategories : null,
    p_tags: filters.tags.length > 0 ? filters.tags : null,
    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,
    p_visibility: filters.visibility,
    p_no_image_only: filters.noImageOnly,
  })
  if (error) {
    console.error('Failed to fetch filtered SKUs:', error)
    return []
  }
  return (data as string[]) ?? []
}

/**
 * Trigger a browser download of the given SKUs as a single-column .xlsx file.
 */
export function downloadSkusAsExcel(skus: string[], filename: string) {
  const worksheetData = [['SKU'], ...skus.map((sku) => [sku])]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  worksheet['!cols'] = [{ wch: 20 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SKUs')
  XLSX.writeFile(workbook, filename)
}
