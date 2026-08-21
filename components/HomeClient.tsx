'use client'
import { useState } from 'react'

type SyncResponse =
  | { status: 'synced'; rowsUpdated: number; imagesUpdated: number }
  | {
      status: 'backfill_in_progress'
      sheetRowsProcessedSoFar: string
      sheetDone: boolean
      driveDone: boolean
      message: string
    }
  | { error: string }

// Inline, admin-only catalog sync control. Render this conditionally
// wherever isAdmin is true.
export default function AdminRefreshCatalogButton() {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSync() {
    setSyncing(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/sync-catalog', { method: 'POST' })
      const data: SyncResponse = await res.json()

      if ('error' in data) {
        setMessage(`Error: ${data.error}`)
        setSyncing(false)
        return
      }

      if (data.status === 'backfill_in_progress') {
        setMessage(
          `Backfill still running (${data.sheetRowsProcessedSoFar} rows processed so far). ${data.message}`
        )
        setSyncing(false)
        return
      }

      setMessage(
        `Synced ${data.rowsUpdated} changed rows, ${data.imagesUpdated} changed images. Reloading...`
      )
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setMessage('Sync request failed.')
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
          Admin: Catalog Sync
        </span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-gray-900 text-white text-xs rounded-md px-3 py-1.5 hover:bg-gray-800 disabled:opacity-50"
        >
          {syncing ? 'Checking…' : 'Refresh Catalog'}
        </button>
        {message && <span className="text-xs text-gray-700">{message}</span>}
      </div>
    </div>
  )
}
