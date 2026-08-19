'use client'
import { useEffect, useState } from 'react'
import { useCurrency } from '@/context/CurrencyContext'

// NOTE: this page assumes it's already behind your admin auth/middleware.
// If you don't have that yet, protect this route (e.g. in middleware.ts) so only
// users with profiles.is_admin = true can reach /admin/*.

export default function CurrencyAdminPage() {
  const { rate, refreshRate } = useCurrency()
  const [input, setInput] = useState(String(rate))

  // The context starts with a fallback rate and loads the real one from the
  // database a moment later — keep the input in sync once that happens.
  useEffect(() => {
    setInput(String(rate))
  }, [rate])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
    setMessage(
      success
        ? 'Rate updated — all product prices on the storefront now reflect it.'
        : 'Something went wrong saving the rate. Check the console for details.'
    )
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-1">Currency rate</h1>
      <p className="text-sm text-gray-500 mb-4">
        Set the manual USD → INR conversion rate used across the storefront.
      </p>

      <label className="block text-sm text-gray-600 mb-1">
        Current rate: 1 USD = {rate} INR
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border rounded-md px-3 py-2 w-full mb-3"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save rate'}
      </button>

      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  )
}
