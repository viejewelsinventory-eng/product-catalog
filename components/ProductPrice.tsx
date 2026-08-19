'use client';

import { useCurrency } from '@/lib/currency/CurrencyProvider';

/**
 * Drop this wherever a product price is currently rendered.
 * `priceInInr` should be the price exactly as stored in your products table (base currency = INR).
 */
export function ProductPrice({ priceInInr }: { priceInInr: number }) {
  const { formatPrice, loading } = useCurrency();

  if (loading) return <span className="text-gray-400">…</span>;

  return <span>{formatPrice(priceInInr)}</span>;
}
