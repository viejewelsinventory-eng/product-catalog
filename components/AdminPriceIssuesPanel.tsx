'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FlaggedProduct = {
  id: string
  sku: string
  price: number | null
}

export default function AdminPriceIssuesPanel() {
  const supabase = createClient()
  const [issues, setIssues] = useState<FlaggedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const loadIssues = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, price')
      .eq('visibility', 'registered')
      .or('price.is.null,price.lt.1')
      .order('sku', { ascending: true })

    if (error) {
      console.error('Failed to load price issues:', error)
      setIssues([])
    } else {
      setIssues(data ?? [])
    }
    setLastChecked(new Date())
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  if (loading && issues.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-400">
          Checking registered-user pricing...
        </div>
      </div>
    )
  }

  if (issues.length === 0) {
    return null // nothing wrong, don't clutter the admin view
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-red-800">
            ⚠ Price Issues — Registered User visibility ({issues.length})
          </h2>
          <button
            onClick={loadIssues}
            disabled={loading}
            className="text-xs bg-white border border-red-300 text-red-700 rounded-md px-3 py-1 hover:bg-red-100 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-xs text-red-700 mb-2">
          These SKUs are visible to registered users but are missing a price or priced under $1.
        </p>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {issues.map((p) => (
            <div key={p.id} className="flex justify-between text-sm text-red-900">
              <span>{p.sku}</span>
              <span>{p.price === null ? 'No price' : `$${p.price}`}</span>
            </div>
          ))}
        </div>
        {lastChecked && (
          <p className="text-[10px] text-red-400 mt-2">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
