'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import type { Currency } from '@/lib/currency'

type CurrencyContextType = {
  currency: Currency
  setCurrency: (c: Currency) => void
  toggleCurrency: () => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD')
  const toggleCurrency = () =>
    setCurrency((c) => (c === 'USD' ? 'INR' : 'USD'))

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
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
