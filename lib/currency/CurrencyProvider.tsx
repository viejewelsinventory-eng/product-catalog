'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client'; // use your existing browser Supabase client

type Currency = 'INR' | 'USD';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rate: number | null; // 1 USD = rate INR
  loading: boolean;
  /** Pass a product's price stored in INR; returns it formatted in whichever currency is selected */
  formatPrice: (priceInInr: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('INR');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Remember the user's chosen currency across visits
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('currency') : null;
    if (stored === 'INR' || stored === 'USD') setCurrencyState(stored);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') localStorage.setItem('currency', c);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function fetchRate() {
      const { data, error } = await supabase
        .from('currency_settings')
        .select('usd_to_inr_rate')
        .eq('id', 1)
        .single();

      if (!error && data) setRate(Number(data.usd_to_inr_rate));
      setLoading(false);
    }

    fetchRate();

    // Live refresh: when the rate is updated in the admin panel, every open tab
    // picks up the new rate immediately, no reload needed.
    const channel = supabase
      .channel('currency_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'currency_settings' },
        (payload) => {
          const newRate = (payload.new as { usd_to_inr_rate?: number })?.usd_to_inr_rate;
          if (newRate) setRate(Number(newRate));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatPrice = useCallback(
    (priceInInr: number) => {
      if (currency === 'INR') {
        return `₹${priceInInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      }
      if (!rate) return '—';
      const usd = priceInInr / rate;
      return `$${usd.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currency, rate]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, loading, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside a CurrencyProvider');
  return ctx;
}
