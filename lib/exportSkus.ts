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
 * Fetch SKUs matching the current admin Category / Display (visibility)
 * filters only. Other filters (types, subcategories, tags, price, search,
 * noImageOnly) are intentionally NOT applied here.
 */
export async function fetchFilteredSkus(
  supabase: SupabaseClient,
  filters: { category: string | null; visibility: string | null }
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_filtered_skus', {
    p_category: filters.category,
    p_visibility: filters.visibility,
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
