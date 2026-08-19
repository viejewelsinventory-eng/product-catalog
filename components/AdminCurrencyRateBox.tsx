'use client'
import { useEffect, useState } from 'react'
import { useCurrency } from '@/context/CurrencyContext'

// Inline, admin-only currency rate control. Render this conditionally
// wherever isAdmin is true — it is not a standalone page/route.
export default function AdminCurrencyRateBox() {
  const { rate, refreshRate } = useCurrency()
  const [input, setInput] = useState(String(rate))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setInput(String(rate))
  }, [rate])

  async function handleSave() {
    const parsed = parseFloat(input)
    if (!parsed || parsed <= 0) {
      setMessage('Enter a valid rate greater than 0.')
      return
    }

    setSaving(true)
    setMessage('')

    const success = await refreshRate(parsed)

    setSaving(false)
    setMessage(success ? 'Rate updated.' : 'Failed to save — check console.')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
          Admin: Currency Rate
        </span>
        <span className="text-sm text-gray-700">1 USD =</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 w-24 text-sm"
        />
        <span className="text-sm text-gray-700">INR</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-900 text-white text-xs rounded-md px-3 py-1.5 hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {message && <span className="text-xs text-gray-600">{message}</span>}
      </div>
    </div>
  )
}
