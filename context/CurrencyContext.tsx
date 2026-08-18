'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Currency } from '@/lib/currency'

type CurrencyContextType = {
  currency: Currency
  setCurrency: (c: Currency) => void
  toggleCurrency: () => void
  rate: number
  refreshRate: (newRate: number) => Promise<boolean>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [rate, setRate] = useState<number>(95.6) // fallback until the DB value loads

  // Load the current admin-set USD -> INR rate on mount
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('app_settings')
      .select('usd_to_inr_rate')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load currency rate:', error)
          return
        }
        if (data?.usd_to_inr_rate) setRate(Number(data.usd_to_inr_rate))
      })
  }, [])

  const toggleCurrency = () =>
    setCurrency((c) => (c === 'USD' ? 'INR' : 'USD'))

  // Admin-only write (enforced by Supabase RLS) -- updates the DB, then
  // local state so every component reading `rate` re-renders immediately.
  const refreshRate = async (newRate: number): Promise<boolean> => {
    const supabase = createClient()
    const { error } = await supabase
      .from('app_settings')
      .update({ usd_to_inr_rate: newRate, updated_at: new Date().toISOString() })
      .eq('id', 1)
    if (error) {
      console.error('Failed to update currency rate:', error)
      return false
    }
    setRate(newRate)
    return true
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, toggleCurrency, rate, refreshRate }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return ctx
}
