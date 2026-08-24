import type { SupabaseClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 1000

/**
 * Fetch every SKU in the products table, no filters applied.
 * Paginates in batches of 1000 to work around PostgREST's row cap.
 */
export async function fetchAllSkus(
  supabase: SupabaseClient
): Promise<string[]> {
  const skus: string[] = []
  let start = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('sku')
      .order('sku', { ascending: true })
      .range(start, start + PAGE_SIZE - 1)

    if (error) {
      console.error('Failed to fetch all SKUs:', error)
      break
    }
    if (!data || data.length === 0) break

    skus.push(...data.map((row) => row.sku as string).filter(Boolean))

    if (data.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }

  return skus
}

/**
 * Fetch SKUs matching the current admin Category / Display (visibility)
 * filters only. Other filters (types, subcategories, tags, price, search,
 * noImageOnly) are intentionally NOT applied here.
 */
export async function fetchFilteredSkus(
  supabase: SupabaseClient,
  filters: { category: string | null; visibility: string | null }
): Promise<string[]> {
  const skus: string[] = []
  let start = 0

  while (true) {
    let query = supabase
      .from('products')
      .select('sku')
      .order('sku', { ascending: true })
      .range(start, start + PAGE_SIZE - 1)

    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch filtered SKUs:', error)
      break
    }
    if (!data || data.length === 0) break

    skus.push(...data.map((row) => row.sku as string).filter(Boolean))

    if (data.length < PAGE_SIZE) break
    start += PAGE_SIZE
  }

  return skus
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
